import { NextResponse } from "next/server";
import { detectProviderModels } from "@/src/lib/ai/model-detection";
import { emptyToNull, errorResponse } from "@/src/lib/api/errors";
import { requireAdminRequest } from "@/src/lib/auth/guards";
import { prisma } from "@/src/lib/db/prisma";
import { decryptSecret } from "@/src/lib/security/secrets";
import { providerDetectionSchema } from "@/src/lib/validation/schemas";

export async function POST(request: Request) {
  const guard = await requireAdminRequest(request, "manage_integrations");
  if (guard.response) return guard.response;

  try {
    const input = providerDetectionSchema.parse(await request.json());
    const savedProvider = input.providerId
      ? await prisma.modelProvider.findUniqueOrThrow({ where: { id: input.providerId } })
      : null;
    const apiKey = emptyToNull(input.apiKey) ?? decryptSecret(savedProvider?.apiKeyCiphertext ?? null);
    const detected = await detectProviderModels({
      id: savedProvider?.id,
      name: savedProvider?.name || "Provider",
      type: input.type ?? savedProvider?.type ?? "OLLAMA",
      baseUrl: emptyToNull(input.baseUrl) ?? savedProvider?.baseUrl ?? null,
      apiKey,
      chatModel: savedProvider?.chatModel,
      embeddingModel: savedProvider?.embeddingModel
    });

    return NextResponse.json(detected);
  } catch (error) {
    return errorResponse(error);
  }
}
