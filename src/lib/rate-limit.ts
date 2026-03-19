/**
 * Edge-compatible rate limiter using in-memory sliding window counters.
 *
 * Design decisions:
 * - Uses Map<string, {count, resetAt}> — works on Vercel Edge Runtime (no Node.js deps)
 * - Each serverless instance gets its own counter, so effective limits scale with instance count
 * - Periodic cleanup evicts expired entries to prevent memory leaks
 * - When Upstash is provisioned later, replace this with @upstash/ratelimit for distributed state
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 60 seconds
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 60_000;

function cleanup(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

/**
 * Check rate limit for a given key.
 *
 * @param key     Unique identifier (e.g. "health:1.2.3.4" or "auth:user_abc")
 * @param limit   Maximum requests allowed in the window
 * @param windowMs  Window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  // Window expired or first request — start fresh
  if (!entry || now >= entry.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, limit, remaining: limit - 1, reset: resetAt };
  }

  // Within window — increment
  entry.count += 1;

  if (entry.count > limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: entry.resetAt,
    };
  }

  return {
    success: true,
    limit,
    remaining: limit - entry.count,
    reset: entry.resetAt,
  };
}

// ---------------------------------------------------------------------------
// Pre-configured limit tiers
// ---------------------------------------------------------------------------

const ONE_MINUTE_MS = 60_000;

/** /api/health — 60 req/min per IP */
export function healthLimit(ip: string): RateLimitResult {
  return checkRateLimit(`health:${ip}`, 60, ONE_MINUTE_MS);
}

/** /api/webhooks/* — 30 req/min per IP */
export function webhookLimit(ip: string): RateLimitResult {
  return checkRateLimit(`webhook:${ip}`, 30, ONE_MINUTE_MS);
}

/** Authenticated /api/* — 120 req/min per user */
export function authenticatedLimit(userId: string): RateLimitResult {
  return checkRateLimit(`auth:${userId}`, 120, ONE_MINUTE_MS);
}
