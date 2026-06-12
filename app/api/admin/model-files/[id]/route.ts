import { NextResponse } from "next/server";
import { errorResponse } from "@/src/lib/api/errors";
import { requireAdminRequest } from "@/src/lib/auth/guards";
import { prisma } from "@/src/lib/db/prisma";
import { removeLocalAiConfig, removeLocalModelFile } from "@/src/lib/models/storage";
import { auditLog } from "@/src/lib/services/audit";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminRequest(request, "manage_integrations");
  if (guard.response) return guard.response;

  try {
    const { id } = await params;
    const modelFile = await prisma.localModelFile.findUniqueOrThrow({
      where: { id },
      select: { id: true, name: true, storageKey: true, kind: true, format: true }
    });

    await removeLocalModelFile(modelFile.storageKey);
    await removeLocalAiConfig(modelFile.id);
    await prisma.localModelFile.delete({ where: { id } });
    await auditLog({
      userId: guard.admin!.id,
      action: "local_model_deleted",
      entity: "LocalModelFile",
      entityId: id,
      metadata: { name: modelFile.name, kind: modelFile.kind, format: modelFile.format }
    });

    return NextResponse.json({ message: "Model file deleted." });
  } catch (error) {
    return errorResponse(error);
  }
}
