import { NextResponse } from "next/server";
import type { ModelProvider, Prisma, ProviderType } from "@prisma/client";
import { detectProviderModels } from "@/src/lib/ai/model-detection";
import { providerFromDb } from "@/src/lib/ai/factory";
import { requireAdminRequest } from "@/src/lib/auth/guards";
import { emptyToNull, errorResponse } from "@/src/lib/api/errors";
import { prisma } from "@/src/lib/db/prisma";
import { auditLog } from "@/src/lib/services/audit";
import { decryptSecret, encryptSecret } from "@/src/lib/security/secrets";
import { providerSchema } from "@/src/lib/validation/schemas";

type ProviderActionPayload = {
  action?: string;
  type?: unknown;
  baseUrl?: unknown;
  apiKey?: unknown;
};

function configRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value) ? { ...(value as Record<string, unknown>) } : {};
}

function mergeConfigJson(value: unknown, updates: Prisma.InputJsonObject): Prisma.InputJsonObject {
  return {
    ...(configRecord(value) as Prisma.InputJsonObject),
    ...updates
  };
}

async function readActionPayload(request: Request): Promise<ProviderActionPayload> {
  const text = await request.text();
  if (!text.trim()) {
    return { action: "health" };
  }
  return JSON.parse(text) as ProviderActionPayload;
}

function isProviderType(value: unknown): value is ProviderType {
  return value === "OLLAMA" || value === "OPENAI_COMPATIBLE" || value === "MOCK";
}

function providerConfigForDetection(provider: ModelProvider, payload: ProviderActionPayload) {
  return {
    id: provider.id,
    name: provider.name,
    type: isProviderType(payload.type) ? payload.type : provider.type,
    baseUrl: typeof payload.baseUrl === "string" ? emptyToNull(payload.baseUrl) : provider.baseUrl,
    apiKey: typeof payload.apiKey === "string" ? emptyToNull(payload.apiKey) ?? decryptSecret(provider.apiKeyCiphertext) : decryptSecret(provider.apiKeyCiphertext),
    chatModel: provider.chatModel,
    embeddingModel: provider.embeddingModel
  };
}

function isDefaultProvider(
  provider: Pick<ModelProvider, "id" | "isDefaultChat" | "isDefaultEmbedding">,
  settings: { defaultChatProviderId: string | null; defaultEmbeddingProviderId: string | null } | null
) {
  return {
    chat: settings?.defaultChatProviderId === provider.id || provider.isDefaultChat,
    embedding: settings?.defaultEmbeddingProviderId === provider.id || provider.isDefaultEmbedding
  };
}

function previewText(value: string) {
  return value.replace(/\s+/g, " ").trim().slice(0, 240);
}

export async function PATCH(request: Request, { params }: { params: Promise<unknown> }) {
  const guard = await requireAdminRequest(request, "manage_integrations");
  if (guard.response) return guard.response;

  try {
    const { id } = (await params) as { id: string };
    const payload = await readActionPayload(request);
    const action = payload.action || "health";
    const provider = await prisma.modelProvider.findUniqueOrThrow({ where: { id } });

    if (action === "health") {
      const startedAt = Date.now();
      const health = await providerFromDb(provider).healthCheck();
      const latencyMs = Date.now() - startedAt;
      await prisma.modelProvider.update({
        where: { id },
        data: {
          configJson: mergeConfigJson(provider.configJson, { lastHealthLatencyMs: latencyMs }),
          lastHealthStatus: health.ok ? "ok" : "failed",
          lastHealthAt: new Date()
        }
      });
      await auditLog({
        userId: guard.admin!.id,
        action: "model_provider_health_checked",
        entity: "ModelProvider",
        entityId: id,
        metadata: { health: health.ok ? "ok" : "failed", latencyMs }
      });

      return NextResponse.json({ message: health.message, latencyMs });
    }

    if (action === "enable") {
      await prisma.modelProvider.update({ where: { id }, data: { isEnabled: true } });
      await auditLog({
        userId: guard.admin!.id,
        action: "model_provider_enabled",
        entity: "ModelProvider",
        entityId: id,
        metadata: { name: provider.name }
      });
      return NextResponse.json({ message: "Provider enabled." });
    }

    if (action === "disable") {
      const settings = await prisma.appSettings.findFirst({
        select: { defaultChatProviderId: true, defaultEmbeddingProviderId: true }
      });
      const defaults = isDefaultProvider(provider, settings);
      if (defaults.chat || defaults.embedding) {
        return NextResponse.json({ error: "Default providers cannot be disabled. Set another enabled provider as default first." }, { status: 400 });
      }
      await prisma.modelProvider.update({ where: { id }, data: { isEnabled: false } });
      await auditLog({
        userId: guard.admin!.id,
        action: "model_provider_disabled",
        entity: "ModelProvider",
        entityId: id,
        metadata: { name: provider.name }
      });
      return NextResponse.json({ message: "Provider disabled." });
    }

    if (action === "setDefaultChat" || action === "setDefaultEmbedding") {
      if (!provider.isEnabled) {
        return NextResponse.json({ error: "Enable this provider before setting it as a default." }, { status: 400 });
      }

      await prisma.$transaction(async (tx) => {
        if (action === "setDefaultChat") {
          await tx.modelProvider.updateMany({ data: { isDefaultChat: false } });
          await tx.modelProvider.update({ where: { id }, data: { isDefaultChat: true } });
          await tx.appSettings.updateMany({ data: { defaultChatProviderId: id } });
        } else {
          await tx.modelProvider.updateMany({ data: { isDefaultEmbedding: false } });
          await tx.modelProvider.update({ where: { id }, data: { isDefaultEmbedding: true } });
          await tx.appSettings.updateMany({ data: { defaultEmbeddingProviderId: id } });
        }
      });

      await auditLog({
        userId: guard.admin!.id,
        action: action === "setDefaultChat" ? "model_provider_default_chat_set" : "model_provider_default_embedding_set",
        entity: "ModelProvider",
        entityId: id,
        metadata: { name: provider.name }
      });
      return NextResponse.json({ message: action === "setDefaultChat" ? "Default chat provider updated." : "Default embedding provider updated." });
    }

    if (action === "detectModels") {
      const detected = await detectProviderModels(providerConfigForDetection(provider, payload));
      await prisma.modelProvider.update({
        where: { id },
        data: {
          configJson: mergeConfigJson(provider.configJson, {
            lastDetectedModelsAt: new Date().toISOString(),
            lastDetectedChatModels: detected.chatModels.slice(0, 100),
            lastDetectedEmbeddingModels: detected.embeddingModels.slice(0, 100)
          })
        }
      });
      await auditLog({
        userId: guard.admin!.id,
        action: "model_provider_models_detected",
        entity: "ModelProvider",
        entityId: id,
        metadata: { count: detected.models.length }
      });
      return NextResponse.json(detected);
    }

    if (action === "testChat") {
      const startedAt = Date.now();
      const response = await providerFromDb(provider).complete({
        messages: [{ role: "user", content: "Reply with one short sentence: TuwaiqX model test successful." }],
        maxTokens: 80,
        temperature: 0
      });
      const latencyMs = Date.now() - startedAt;
      await prisma.modelProvider.update({
        where: { id },
        data: {
          configJson: mergeConfigJson(provider.configJson, {
            lastChatTestLatencyMs: latencyMs,
            lastChatTestAt: new Date().toISOString()
          })
        }
      });
      await auditLog({
        userId: guard.admin!.id,
        action: "model_provider_chat_tested",
        entity: "ModelProvider",
        entityId: id,
        metadata: { latencyMs, model: provider.chatModel }
      });
      return NextResponse.json({
        message: "Chat test succeeded.",
        latencyMs,
        model: provider.chatModel,
        provider: provider.name,
        textPreview: previewText(response.content)
      });
    }

    if (action === "testEmbedding") {
      const startedAt = Date.now();
      const response = await providerFromDb(provider).embed({ input: "TuwaiqX embedding test" });
      const latencyMs = Date.now() - startedAt;
      await prisma.modelProvider.update({
        where: { id },
        data: {
          configJson: mergeConfigJson(provider.configJson, {
            lastEmbeddingTestLatencyMs: latencyMs,
            lastEmbeddingTestAt: new Date().toISOString()
          })
        }
      });
      await auditLog({
        userId: guard.admin!.id,
        action: "model_provider_embedding_tested",
        entity: "ModelProvider",
        entityId: id,
        metadata: { latencyMs, model: provider.embeddingModel, dimension: response.embedding.length }
      });
      return NextResponse.json({
        message: "Embedding test succeeded.",
        latencyMs,
        model: provider.embeddingModel,
        provider: provider.name,
        dimension: response.embedding.length
      });
    }

    return NextResponse.json({ error: "Unknown provider action." }, { status: 400 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<unknown> }) {
  const guard = await requireAdminRequest(request, "manage_integrations");
  if (guard.response) return guard.response;

  try {
    const { id } = (await params) as { id: string };
    const input = providerSchema.parse(await request.json());
    const [provider, settings] = await Promise.all([
      prisma.modelProvider.findUniqueOrThrow({ where: { id } }),
      prisma.appSettings.findFirst({
        select: { defaultChatProviderId: true, defaultEmbeddingProviderId: true }
      })
    ]);
    const defaults = isDefaultProvider(provider, settings);

    if (!input.isEnabled && (defaults.chat || defaults.embedding || input.isDefaultChat || input.isDefaultEmbedding)) {
      return NextResponse.json({ error: "Default providers cannot be disabled. Set another enabled provider as default first." }, { status: 400 });
    }

    const apiKey = emptyToNull(input.apiKey);
    const apiKeyCiphertext = apiKey ? encryptSecret(apiKey) : undefined;
    const updatedProvider = await prisma.$transaction(async (tx) => {
      if (input.isDefaultChat) {
        await tx.modelProvider.updateMany({ data: { isDefaultChat: false } });
        await tx.appSettings.updateMany({ data: { defaultChatProviderId: id } });
      } else if (defaults.chat) {
        await tx.appSettings.updateMany({ data: { defaultChatProviderId: null } });
      }

      if (input.isDefaultEmbedding) {
        await tx.modelProvider.updateMany({ data: { isDefaultEmbedding: false } });
        await tx.appSettings.updateMany({ data: { defaultEmbeddingProviderId: id } });
      } else if (defaults.embedding) {
        await tx.appSettings.updateMany({ data: { defaultEmbeddingProviderId: null } });
      }

      return tx.modelProvider.update({
        where: { id },
        data: {
          name: input.name,
          type: input.type,
          baseUrl: emptyToNull(input.baseUrl),
          ...(apiKeyCiphertext ? { apiKeyCiphertext } : {}),
          chatModel: emptyToNull(input.chatModel),
          embeddingModel: emptyToNull(input.embeddingModel),
          isDefaultChat: input.isDefaultChat,
          isDefaultEmbedding: input.isDefaultEmbedding,
          isEnabled: input.isEnabled
        }
      });
    });

    await auditLog({
      userId: guard.admin!.id,
      action: "model_provider_updated",
      entity: "ModelProvider",
      entityId: id,
      metadata: { type: updatedProvider.type, apiKeyRotated: Boolean(apiKeyCiphertext) }
    });

    return NextResponse.json({ message: "Provider updated.", id });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<unknown> }) {
  const guard = await requireAdminRequest(request, "manage_integrations");
  if (guard.response) return guard.response;

  try {
    const { id } = (await params) as { id: string };
    const providerCount = await prisma.modelProvider.count();
    if (providerCount <= 1) {
      return NextResponse.json({ error: "At least one provider must remain." }, { status: 400 });
    }

    const provider = await prisma.modelProvider.findUniqueOrThrow({
      where: { id },
      select: { id: true, name: true, isDefaultChat: true, isDefaultEmbedding: true }
    });
    const settings = await prisma.appSettings.findFirst({
      select: { defaultChatProviderId: true, defaultEmbeddingProviderId: true }
    });
    const replacement = await prisma.modelProvider.findFirst({
      where: { id: { not: id }, isEnabled: true },
      orderBy: { createdAt: "asc" },
      select: { id: true }
    });
    const wasDefaultChat = settings?.defaultChatProviderId === id || provider.isDefaultChat;
    const wasDefaultEmbedding = settings?.defaultEmbeddingProviderId === id || provider.isDefaultEmbedding;

    await prisma.$transaction(async (tx) => {
      await tx.modelProvider.delete({ where: { id } });

      if (wasDefaultChat) {
        await tx.modelProvider.updateMany({ data: { isDefaultChat: false } });
        await tx.appSettings.updateMany({
          data: { defaultChatProviderId: replacement?.id ?? null }
        });
        if (replacement) {
          await tx.modelProvider.update({
            where: { id: replacement.id },
            data: { isDefaultChat: true }
          });
        }
      }

      if (wasDefaultEmbedding) {
        await tx.modelProvider.updateMany({ data: { isDefaultEmbedding: false } });
        await tx.appSettings.updateMany({
          data: { defaultEmbeddingProviderId: replacement?.id ?? null }
        });
        if (replacement) {
          await tx.modelProvider.update({
            where: { id: replacement.id },
            data: { isDefaultEmbedding: true }
          });
        }
      }
    });

    await auditLog({
      userId: guard.admin!.id,
      action: "model_provider_deleted",
      entity: "ModelProvider",
      entityId: id,
      metadata: { name: provider.name }
    });

    return NextResponse.json({ message: "Provider deleted." });
  } catch (error) {
    return errorResponse(error);
  }
}
