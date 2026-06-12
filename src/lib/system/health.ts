import fs from "node:fs/promises";
import { prisma } from "@/src/lib/db/prisma";
import { getEnv } from "@/src/lib/config/env";
import { defaultProviderFromEnv } from "@/src/lib/ai/factory";

export async function getSystemHealth() {
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
    const model = await defaultProviderFromEnv().healthCheck();
    checks.model = model.ok;
    messages.model = model.message;
  } catch (error) {
    messages.model = error instanceof Error ? error.message : "Model check failed";
  }

  return {
    ok: Object.values(checks).every(Boolean),
    checks,
    messages
  };
}
