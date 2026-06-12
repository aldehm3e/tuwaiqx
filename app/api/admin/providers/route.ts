import { NextResponse } from "next/server";
import { requireAdminRequest } from "@/src/lib/auth/guards";
import { createProvider } from "@/src/lib/ai/factory";
import { prisma } from "@/src/lib/db/prisma";
import { errorResponse, emptyToNull } from "@/src/lib/api/errors";
import { auditLog } from "@/src/lib/services/audit";
import { encryptSecret } from "@/src/lib/security/secrets";
import { providerSchema } from "@/src/lib/validation/schemas";

export async function POST(request: Request) {
  const guard = await requireAdminRequest(request, "manage_integrations");
  if (guard.response) return guard.response;

  try {
    const input = providerSchema.parse(await request.json());
    const providerForHealth = createProvider({
      name: input.name,
      type: input.type,
      baseUrl: emptyToNull(input.baseUrl),
      apiKey: emptyToNull(input.apiKey),
      chatModel: emptyToNull(input.chatModel),
      embeddingModel: emptyToNull(input.embeddingModel)
    });
    const health = await providerForHealth.healthCheck();

    const provider = await prisma.$transaction(async (tx) => {
      if (input.isDefaultChat) {
        await tx.modelProvider.updateMany({ data: { isDefaultChat: false } });
      }
      if (input.isDefaultEmbedding) {
        await tx.modelProvider.updateMany({ data: { isDefaultEmbedding: false } });
      }
      return tx.modelProvider.create({
        data: {
          name: input.name,
          type: input.type,
          baseUrl: emptyToNull(input.baseUrl),
          apiKeyCiphertext: input.apiKey ? encryptSecret(input.apiKey) : null,
          chatModel: emptyToNull(input.chatModel),
          embeddingModel: emptyToNull(input.embeddingModel),
          isDefaultChat: input.isDefaultChat,
          isDefaultEmbedding: input.isDefaultEmbedding,
          isEnabled: input.isEnabled,
          lastHealthStatus: health.ok ? "ok" : "failed",
          lastHealthAt: new Date()
        }
      });
    });

    await auditLog({
      userId: guard.admin!.id,
      action: "model_provider_created",
      entity: "ModelProvider",
      entityId: provider.id,
      metadata: { type: provider.type, health: provider.lastHealthStatus }
    });
    return NextResponse.json({ message: health.message, id: provider.id });
  } catch (error) {
    return errorResponse(error);
  }
}

