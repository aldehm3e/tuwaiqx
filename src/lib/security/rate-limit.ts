import { getEnv } from "@/src/lib/config/env";
import { getRedisClient } from "@/src/lib/redis/client";

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
let warnedRedisFallback = false;

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
  retryAfter: number;
  source: "disabled" | "redis" | "memory" | "deny";
};

function memoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs, limit, retryAfter: 0, source: "memory" };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: existing.resetAt,
      limit,
      retryAfter: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      source: "memory"
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
    limit,
    retryAfter: 0,
    source: "memory"
  };
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const env = getEnv();
  const now = Date.now();

  if (!env.RATE_LIMIT_ENABLED) {
    return { allowed: true, remaining: limit, resetAt: now + windowMs, limit, retryAfter: 0, source: "disabled" };
  }

  try {
    const redis = getRedisClient();
    if (redis.status === "wait" || redis.status === "end") {
      await redis.connect();
    }
    const redisKey = `rate-limit:${key}`;
    const count = await redis.incr(redisKey);

    if (count === 1) {
      await redis.pexpire(redisKey, windowMs);
    }

    let ttl = await redis.pttl(redisKey);
    if (ttl < 0) {
      await redis.pexpire(redisKey, windowMs);
      ttl = windowMs;
    }

    const resetAt = now + ttl;
    const allowed = count <= limit;
    return {
      allowed,
      remaining: Math.max(0, limit - count),
      resetAt,
      limit,
      retryAfter: allowed ? 0 : Math.max(1, Math.ceil(ttl / 1000)),
      source: "redis"
    };
  } catch (error) {
    if (!warnedRedisFallback) {
      warnedRedisFallback = true;
      console.warn("Redis rate limit unavailable.", {
        fallback: env.RATE_LIMIT_REDIS_FALLBACK,
        error: error instanceof Error ? error.message : "Unknown Redis error"
      });
    }

    if (env.RATE_LIMIT_REDIS_FALLBACK === "deny") {
      return {
        allowed: false,
        remaining: 0,
        resetAt: now + windowMs,
        limit,
        retryAfter: Math.max(1, Math.ceil(windowMs / 1000)),
        source: "deny"
      };
    }

    return memoryRateLimit(key, limit, windowMs);
  }
}

export function rateLimitHeaders(result: RateLimitResult) {
  const headers = new Headers();
  headers.set("X-RateLimit-Limit", String(result.limit));
  headers.set("X-RateLimit-Remaining", String(result.remaining));
  headers.set("X-RateLimit-Reset", String(Math.ceil(result.resetAt / 1000)));

  if (!result.allowed) {
    headers.set("Retry-After", String(result.retryAfter));
  }

  return headers;
}

export function applyRateLimitHeaders(headers: Headers, result: RateLimitResult) {
  for (const [key, value] of rateLimitHeaders(result)) {
    headers.set(key, value);
  }

  return headers;
}

export function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
