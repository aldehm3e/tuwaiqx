import { NextResponse } from "next/server";
import type { LocalModelKind } from "@prisma/client";
import { errorResponse } from "@/src/lib/api/errors";
import { requireAdminRequest } from "@/src/lib/auth/guards";
import { getEnv } from "@/src/lib/config/env";
import { prisma } from "@/src/lib/db/prisma";
import { removeLocalModelFile, storeLocalModelFile, writeLocalAiConfig } from "@/src/lib/models/storage";
import { auditLog } from "@/src/lib/services/audit";
import { localModelUploadSchema } from "@/src/lib/validation/schemas";

export async function POST(request: Request) {
  const guard = await requireAdminRequest(request, "manage_integrations");
  if (guard.response) return guard.response;

  try {
    const env = getEnv();
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File) || !file.size) {
      return NextResponse.json({ error: "Upload a model file." }, { status: 400 });
    }

    const input = localModelUploadSchema.parse({
      name: formData.get("name"),
      kind: formData.get("kind"),
      runtimeHint: formData.get("runtimeHint")
    });
    const maxBytes = env.MAX_MODEL_UPLOAD_MB * 1024 * 1024;
    const stored = await storeLocalModelFile({
      file,
      kind: input.kind as LocalModelKind,
      maxBytes
    });
    const modelFile = await prisma.localModelFile.create({
      data: {
        name: input.name,
        kind: input.kind,
        format: stored.format,
        filename: file.name,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: stored.sizeBytes,
        storageKey: stored.storageKey,
        sha256: stored.sha256,
        status: "ready",
        runtimeHint: input.runtimeHint?.trim() || null,
        createdById: guard.admin!.id
      }
    });
    let runtimeConfig: Awaited<ReturnType<typeof writeLocalAiConfig>> = null;
    try {
      runtimeConfig = await writeLocalAiConfig({
        id: modelFile.id,
        kind: modelFile.kind,
        format: modelFile.format,
        storageKey: modelFile.storageKey
      });
    } catch (configError) {
      await removeLocalModelFile(modelFile.storageKey).catch(() => {});
      await prisma.localModelFile.delete({ where: { id: modelFile.id } }).catch(() => {});
      throw configError;
    }

    await auditLog({
      userId: guard.admin!.id,
      action: "local_model_uploaded",
      entity: "LocalModelFile",
      entityId: modelFile.id,
      metadata: {
        kind: modelFile.kind,
        format: modelFile.format,
        sizeBytes: modelFile.sizeBytes.toString(),
        runtimeModelName: runtimeConfig?.modelName || null,
        runtimeConfigKey: runtimeConfig?.storageKey || null
      }
    });

    return NextResponse.json({ message: "Model file uploaded.", id: modelFile.id });
  } catch (error) {
    return errorResponse(error);
  }
}
