import Redis from "ioredis";
import { getEnv } from "@/src/lib/config/env";

let client: Redis | undefined;

export function getRedisClient() {
  if (!client) {
    client = new Redis(getEnv().REDIS_URL, {
      enableOfflineQueue: false,
      lazyConnect: true,
      maxRetriesPerRequest: 1
    });

    client.on("error", () => {
      // Call sites decide whether Redis failures should fall back or fail closed.
    });
  }

  return client;
}
