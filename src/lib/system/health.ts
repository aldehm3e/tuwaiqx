import fs from "node:fs/promises";
import type { ModelProvider } from "@prisma/client";
import { prisma } from "@/src/lib/db/prisma";
import { getEnv } from "@/src/lib/config/env";
import { defaultProviderFromEnv, providerFromDb } from "@/src/lib/ai/factory";

async function checkProviderRuntime(provider: ModelProvider) {
  try {
    const result = await providerFromDb(provider).healthCheck();
    return {
      id: provider.id,
      name: provider.name,
      type: provider.type,
      baseUrl: provider.baseUrl,
      chatModel: provider.chatModel,
      embeddingModel: provider.embeddingModel,
      isDefaultChat: provider.isDefaultChat,
      isDefaultEmbedding: provider.isDefaultEmbedding,
      ok: result.ok,
      message: result.message
    };
  } catch (error) {
    return {
      id: provider.id,
      name: provider.name,
      type: provider.type,
      baseUrl: provider.baseUrl,
      chatModel: provider.chatModel,
      embeddingModel: provider.embeddingModel,
      isDefaultChat: provider.isDefaultChat,
      isDefaultEmbedding: provider.isDefaultEmbedding,
      ok: false,
      message: error instanceof Error ? error.message : "Runtime check failed"
    };
  }
}

type SystemHealthOptions = {
  includeProviders?: boolean;
};

export async function getSystemHealth(options: SystemHealthOptions = {}) {
  const env = getEnv();
  const checks = {
    database: false,
    redis: false,
    storage: false,
    model: false
  };
  const messages: Record<string, string> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
    messages.database = "PostgreSQL ready";
  } catch (error) {
    messages.database = error instanceof Error ? error.message : "Database failed";
  }

  try {
    const { default: Redis } = await import("ioredis");
    const redis = new Redis(env.REDIS_URL, {
      enableOfflineQueue: false,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null
    });
    redis.on("error", () => {
      // The health response reports Redis failure; suppress noisy client events.
    });
    await redis.connect();
    await redis.ping();
    await redis.quit();
    checks.redis = true;
    messages.redis = "Redis ready";
  } catch (error) {
    messages.redis = error instanceof Error ? error.message : "Redis failed";
  }

  try {
    if (env.STORAGE_DRIVER === "local") {
      await fs.mkdir(env.STORAGE_PATH, { recursive: true });
      await fs.access(env.STORAGE_PATH);
      checks.storage = true;
      messages.storage = "Local storage ready";
    } else {
      checks.storage = Boolean(env.S3_ENDPOINT && env.S3_BUCKET);
      messages.storage = checks.storage ? "S3-compatible storage configured" : "S3 storage missing configuration";
    }
  } catch (error) {
    messages.storage = error instanceof Error ? error.message : "Storage failed";
  }

  try {
    const settings = await prisma.appSettings.findFirst({
      select: { defaultChatProviderId: true, defaultEmbeddingProviderId: true }
    });
    const configuredProvider = settings?.defaultChatProviderId
      ? await prisma.modelProvider.findUnique({ where: { id: settings.defaultChatProviderId } })
      : null;
    const model = await (configuredProvider ? providerFromDb(configuredProvider) : defaultProviderFromEnv()).healthCheck();
    checks.model = model.ok;
    messages.model = model.message;
  } catch (error) {
    messages.model = error instanceof Error ? error.message : "Model check failed";
  }

  const providerHealth = options.includeProviders
    ? await Promise.all(
        (
          await prisma.modelProvider.findMany({
            where: { isEnabled: true },
            orderBy: { createdAt: "asc" }
          })
        ).map(checkProviderRuntime)
      )
    : [];

  return {
    ok: Object.values(checks).every(Boolean),
    checks,
    messages,
    providers: providerHealth
  };
}
