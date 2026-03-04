/**
 * Redis-backed sliding window rate limiter.
 * Falls back to in-memory Map if Redis is unavailable.
 * Survives restarts, works across multiple instances.
 */

import Redis from "ioredis";

// --- Redis connection (lazy singleton) ---
let redis: Redis | null = null;
let redisAvailable = true;

function getRedis(): Redis | null {
  if (!redisAvailable) return null;
  if (redis) return redis;

  try {
    redis = new Redis({
      host: process.env.REDIS_HOST ?? "127.0.0.1",
      port: parseInt(process.env.REDIS_PORT ?? "6379", 10),
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      connectTimeout: 2000,
      enableOfflineQueue: false,
    });

    redis.on("error", () => {
      // Silently fall back to in-memory
      redisAvailable = false;
      redis?.disconnect();
      redis = null;
    });

    redis.connect().catch(() => {
      redisAvailable = false;
      redis = null;
    });

    return redis;
  } catch {
    redisAvailable = false;
    return null;
  }
}

// --- In-memory fallback ---
interface RateEntry {
  timestamps: number[];
}

const memoryStore = new Map<string, RateEntry>();

// Clean up old in-memory entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of memoryStore) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < 60_000);
    if (entry.timestamps.length === 0) memoryStore.delete(key);
  }
}, 5 * 60_000);

/**
 * Check rate limit using Redis (primary) or in-memory (fallback).
 * Uses a sliding window of 60 seconds.
 */
export async function checkRateLimitAsync(
  key: string,
  maxPerMinute: number
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const client = getRedis();
  if (client && redisAvailable) {
    try {
      return await redisRateLimit(client, key, maxPerMinute);
    } catch {
      // Fall through to in-memory
    }
  }
  return memoryRateLimit(key, maxPerMinute);
}

/**
 * Synchronous rate limit check (in-memory only).
 * Used by routes that can't await — prefer checkRateLimitAsync when possible.
 */
export function checkRateLimit(
  key: string,
  maxPerMinute: number
): { allowed: boolean; retryAfterMs: number } {
  return memoryRateLimit(key, maxPerMinute);
}

// --- Redis implementation ---
async function redisRateLimit(
  client: Redis,
  key: string,
  maxPerMinute: number
): Promise<{ allowed: boolean; retryAfterMs: number }> {
  const redisKey = `rl:${key}`;
  const now = Date.now();
  const windowStart = now - 60_000;

  // Atomic pipeline: remove old entries, count, add new, set TTL
  const pipeline = client.pipeline();
  pipeline.zremrangebyscore(redisKey, 0, windowStart);
  pipeline.zcard(redisKey);
  pipeline.zadd(redisKey, now.toString(), `${now}:${Math.random()}`);
  pipeline.expire(redisKey, 70); // TTL slightly longer than window

  const results = await pipeline.exec();
  if (!results) return { allowed: true, retryAfterMs: 0 };

  const count = (results[1]?.[1] as number) ?? 0;

  if (count >= maxPerMinute) {
    // Get oldest entry to calculate retry time
    const oldest = await client.zrange(redisKey, 0, 0, "WITHSCORES");
    const oldestTime = oldest.length >= 2 ? parseInt(oldest[1], 10) : now;
    const retryAfterMs = 60_000 - (now - oldestTime);

    // Remove the entry we just added (over limit)
    await client.zremrangebyscore(redisKey, now.toString(), now.toString());

    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1000) };
  }

  return { allowed: true, retryAfterMs: 0 };
}

// --- In-memory implementation ---
function memoryRateLimit(
  key: string,
  maxPerMinute: number
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = memoryStore.get(key) ?? { timestamps: [] };

  entry.timestamps = entry.timestamps.filter((t) => now - t < 60_000);

  if (entry.timestamps.length >= maxPerMinute) {
    const oldest = entry.timestamps[0];
    const retryAfterMs = 60_000 - (now - oldest);
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1000) };
  }

  entry.timestamps.push(now);
  memoryStore.set(key, entry);
  return { allowed: true, retryAfterMs: 0 };
}

/**
 * Concurrent request limiter — prevents a single user from flooding the server.
 * Uses Redis INCR/DECR with TTL for automatic cleanup.
 */
export async function acquireConcurrencySlot(
  userId: string,
  maxConcurrent: number
): Promise<{ acquired: boolean; release: () => Promise<void> }> {
  const client = getRedis();
  const key = `concurrent:${userId}`;

  if (client && redisAvailable) {
    try {
      const count = await client.incr(key);
      await client.expire(key, 120); // Auto-expire after 2 min (safety net)

      if (count > maxConcurrent) {
        await client.decr(key);
        return {
          acquired: false,
          release: async () => {},
        };
      }

      return {
        acquired: true,
        release: async () => {
          try {
            await client.decr(key);
          } catch {}
        },
      };
    } catch {
      // Fall through — allow request on Redis failure
    }
  }

  // In-memory fallback: no concurrent limiting (single instance approximation)
  return { acquired: true, release: async () => {} };
}
