# API Rate Limiting — Advanced

## Palace Knowledge Seed — Advanced Backend Engineering

### Overview

Rate limiting protects Stone AI from abuse, ensures fair resource allocation across tiers (FREE through PRO), and prevents runaway costs from AI provider calls. This seed covers token bucket, sliding window, distributed rate limiting with Redis, per-tenant limits, graceful degradation, and practical Next.js middleware implementations.

---

## 1. Why Advanced Rate Limiting?

Stone AI has specific rate limiting needs:

- **Tiered access** — FREE users get fewer requests than PRO users
- **AI endpoint protection** — vLLM and Anthropic calls are expensive
- **Per-agent limits** — Prevent abuse of specific high-cost agents
- **Webhook protection** — Incoming webhooks from Clerk/Stripe need throttling
- **Forum/community** — Prevent spam without hurting legitimate users
- **Admin APIs** — Different limits for admin operations

---

## 2. Token Bucket Algorithm

The token bucket allows bursts while maintaining an average rate. Tokens refill at a constant rate; each request consumes one or more tokens.

```typescript
// src/lib/rate-limit/token-bucket.ts
import { redis } from '@/lib/cache/redis';

interface TokenBucketConfig {
  maxTokens: number;       // Bucket capacity
  refillRate: number;      // Tokens added per second
  tokensPerRequest: number; // Tokens consumed per request
}

export class TokenBucket {
  constructor(private config: TokenBucketConfig) {}

  async consume(key: string, tokens?: number): Promise<{
    allowed: boolean;
    remaining: number;
    retryAfter: number | null; // seconds until enough tokens
    limit: number;
  }> {
    const consumeCount = tokens ?? this.config.tokensPerRequest;
    const now = Date.now();

    // Lua script for atomic token bucket operation
    const luaScript = `
      local key = KEYS[1]
      local max_tokens = tonumber(ARGV[1])
      local refill_rate = tonumber(ARGV[2])
      local consume = tonumber(ARGV[3])
      local now = tonumber(ARGV[4])

      local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
      local current_tokens = tonumber(bucket[1])
      local last_refill = tonumber(bucket[2])

      -- Initialize bucket if it doesn't exist
      if current_tokens == nil then
        current_tokens = max_tokens
        last_refill = now
      end

      -- Calculate tokens to add since last refill
      local elapsed = (now - last_refill) / 1000
      local new_tokens = math.min(max_tokens, current_tokens + (elapsed * refill_rate))

      -- Try to consume tokens
      if new_tokens >= consume then
        new_tokens = new_tokens - consume
        redis.call('HMSET', key, 'tokens', new_tokens, 'last_refill', now)
        redis.call('EXPIRE', key, math.ceil(max_tokens / refill_rate) + 10)
        return {1, math.floor(new_tokens), 0}
      else
        -- Not enough tokens
        redis.call('HMSET', key, 'tokens', new_tokens, 'last_refill', now)
        redis.call('EXPIRE', key, math.ceil(max_tokens / refill_rate) + 10)
        local wait_time = math.ceil((consume - new_tokens) / refill_rate)
        return {0, math.floor(new_tokens), wait_time}
      end
    `;

    const result = (await redis.eval(
      luaScript,
      1,
      key,
      this.config.maxTokens,
      this.config.refillRate,
      consumeCount,
      now
    )) as [number, number, number];

    return {
      allowed: result[0] === 1,
      remaining: result[1],
      retryAfter: result[0] === 0 ? result[2] : null,
      limit: this.config.maxTokens,
    };
  }
}
```

---

## 3. Sliding Window Algorithm

More accurate than fixed windows — prevents the burst-at-boundary problem.

```typescript
// src/lib/rate-limit/sliding-window.ts

interface SlidingWindowConfig {
  windowMs: number;   // Window size in milliseconds
  maxRequests: number; // Maximum requests in window
}

export class SlidingWindowRateLimiter {
  constructor(private config: SlidingWindowConfig) {}

  async check(key: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
    limit: number;
  }> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Lua script: sorted set based sliding window
    const luaScript = `
      local key = KEYS[1]
      local window_start = tonumber(ARGV[1])
      local now = tonumber(ARGV[2])
      local max_requests = tonumber(ARGV[3])
      local window_ms = tonumber(ARGV[4])

      -- Remove entries outside the window
      redis.call('ZREMRANGEBYSCORE', key, 0, window_start)

      -- Count current requests in window
      local current_count = redis.call('ZCARD', key)

      if current_count < max_requests then
        -- Add the new request
        redis.call('ZADD', key, now, now .. '-' .. math.random(100000))
        redis.call('PEXPIRE', key, window_ms)
        return {1, max_requests - current_count - 1}
      else
        return {0, 0}
      end
    `;

    const result = (await redis.eval(
      luaScript,
      1,
      `ratelimit:sw:${key}`,
      windowStart,
      now,
      this.config.maxRequests,
      this.config.windowMs
    )) as [number, number];

    return {
      allowed: result[0] === 1,
      remaining: result[1],
      resetAt: now + this.config.windowMs,
      limit: this.config.maxRequests,
    };
  }
}

// Sliding window log variant — more precise, uses more memory
export class SlidingWindowLog {
  constructor(private config: SlidingWindowConfig) {}

  async check(key: string): Promise<{
    allowed: boolean;
    count: number;
    oldestRequest: number | null;
  }> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const fullKey = `ratelimit:swl:${key}`;

    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(fullKey, 0, windowStart);
    pipeline.zcard(fullKey);

    const results = await pipeline.exec();
    const count = (results?.[1]?.[1] as number) ?? 0;

    if (count < this.config.maxRequests) {
      await redis.zadd(fullKey, now, `${now}-${Math.random()}`);
      await redis.pexpire(fullKey, this.config.windowMs);
      return { allowed: true, count: count + 1, oldestRequest: null };
    }

    // Get the oldest request to calculate when the window will shift
    const oldest = await redis.zrange(fullKey, 0, 0, 'WITHSCORES');
    const oldestTimestamp = oldest.length >= 2 ? Number(oldest[1]) : null;

    return { allowed: false, count, oldestRequest: oldestTimestamp };
  }
}
```

---

## 4. Per-Tier Rate Limits

```typescript
// src/lib/rate-limit/tier-limits.ts

interface TierRateLimits {
  // API requests per minute
  apiRequestsPerMinute: number;
  // AI messages per hour
  aiMessagesPerHour: number;
  // AI messages per day
  aiMessagesPerDay: number;
  // Forum posts per hour
  forumPostsPerHour: number;
  // File uploads per hour
  fileUploadsPerHour: number;
  // Cost per request (for AI token budget)
  tokenBudgetPerDay: number;
}

const TIER_LIMITS: Record<string, TierRateLimits> = {
  FREE: {
    apiRequestsPerMinute: 30,
    aiMessagesPerHour: 10,
    aiMessagesPerDay: 50,
    forumPostsPerHour: 5,
    fileUploadsPerHour: 3,
    tokenBudgetPerDay: 50_000,
  },
  STARTER: {
    apiRequestsPerMinute: 60,
    aiMessagesPerHour: 30,
    aiMessagesPerDay: 200,
    forumPostsPerHour: 15,
    fileUploadsPerHour: 10,
    tokenBudgetPerDay: 200_000,
  },
  PLUS: {
    apiRequestsPerMinute: 120,
    aiMessagesPerHour: 60,
    aiMessagesPerDay: 500,
    forumPostsPerHour: 30,
    fileUploadsPerHour: 25,
    tokenBudgetPerDay: 500_000,
  },
  SMART: {
    apiRequestsPerMinute: 200,
    aiMessagesPerHour: 100,
    aiMessagesPerDay: 1000,
    forumPostsPerHour: 50,
    fileUploadsPerHour: 50,
    tokenBudgetPerDay: 1_000_000,
  },
  PRO: {
    apiRequestsPerMinute: 500,
    aiMessagesPerHour: 200,
    aiMessagesPerDay: 3000,
    forumPostsPerHour: 100,
    fileUploadsPerHour: 100,
    tokenBudgetPerDay: 3_000_000,
  },
};

export function getTierLimits(tier: string): TierRateLimits {
  return TIER_LIMITS[tier] ?? TIER_LIMITS.FREE;
}
```

### Composite Rate Limiter

```typescript
// src/lib/rate-limit/composite.ts

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfter: number | null;
  limitType: string; // Which limit was hit
}

export class CompositeRateLimiter {
  private limiters: Map<string, { limiter: SlidingWindowRateLimiter; type: string }> =
    new Map();

  addLimit(
    name: string,
    config: SlidingWindowConfig
  ): CompositeRateLimiter {
    this.limiters.set(name, {
      limiter: new SlidingWindowRateLimiter(config),
      type: name,
    });
    return this;
  }

  async check(userId: string): Promise<RateLimitResult> {
    // Check all limits in parallel
    const checks = Array.from(this.limiters.entries()).map(
      async ([name, { limiter }]) => {
        const result = await limiter.check(`${userId}:${name}`);
        return { name, ...result };
      }
    );

    const results = await Promise.all(checks);

    // Find the most restrictive limit that was hit
    const denied = results.find((r) => !r.allowed);

    if (denied) {
      return {
        allowed: false,
        remaining: 0,
        limit: denied.limit,
        retryAfter: Math.ceil(
          (denied.resetAt - Date.now()) / 1000
        ),
        limitType: denied.name,
      };
    }

    // All limits passed — return the tightest remaining
    const tightest = results.reduce((min, r) =>
      r.remaining < min.remaining ? r : min
    );

    return {
      allowed: true,
      remaining: tightest.remaining,
      limit: tightest.limit,
      retryAfter: null,
      limitType: tightest.name,
    };
  }
}

// Factory: create rate limiter for a user's tier
export function createTierRateLimiter(tier: string): CompositeRateLimiter {
  const limits = getTierLimits(tier);

  return new CompositeRateLimiter()
    .addLimit('api-per-minute', {
      windowMs: 60_000,
      maxRequests: limits.apiRequestsPerMinute,
    })
    .addLimit('ai-per-hour', {
      windowMs: 3_600_000,
      maxRequests: limits.aiMessagesPerHour,
    })
    .addLimit('ai-per-day', {
      windowMs: 86_400_000,
      maxRequests: limits.aiMessagesPerDay,
    });
}
```

---

## 5. Next.js Middleware Integration

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { SlidingWindowRateLimiter } from '@/lib/rate-limit/sliding-window';

// Simple rate limiter for middleware (runs at the edge)
const globalLimiter = new SlidingWindowRateLimiter({
  windowMs: 60_000,
  maxRequests: 100, // 100 requests/minute for unauthenticated
});

export async function middleware(request: NextRequest) {
  // Only rate limit API routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Skip health checks and webhooks
  if (
    request.nextUrl.pathname === '/api/health' ||
    request.nextUrl.pathname.startsWith('/api/webhooks')
  ) {
    return NextResponse.next();
  }

  // Identify the client
  const identifier = getClientIdentifier(request);

  const result = await globalLimiter.check(identifier);

  if (!result.allowed) {
    return new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
          'Retry-After': String(
            Math.ceil((result.resetAt - Date.now()) / 1000)
          ),
        },
      }
    );
  }

  // Add rate limit headers to successful responses
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(result.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));
  response.headers.set(
    'X-RateLimit-Reset',
    String(Math.ceil(result.resetAt / 1000))
  );

  return response;
}

function getClientIdentifier(request: NextRequest): string {
  // Prefer authenticated user ID
  const sessionToken = request.cookies.get('__session')?.value;
  if (sessionToken) {
    // Hash the session token for privacy
    return `user:${hashString(sessionToken)}`;
  }

  // Fall back to IP
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ?? request.ip ?? 'unknown';

  return `ip:${ip}`;
}

export const config = {
  matcher: '/api/:path*',
};
```

### Per-Route Rate Limiting

```typescript
// src/lib/rate-limit/route-limiter.ts
import { NextRequest } from 'next/server';

interface RouteLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: NextRequest) => string;
  costPerRequest?: number; // For token bucket
}

const ROUTE_LIMITS: Record<string, RouteLimitConfig> = {
  '/api/chat': {
    windowMs: 60_000,
    maxRequests: 20,
    costPerRequest: 5, // AI calls cost more
  },
  '/api/agents/*/chat': {
    windowMs: 60_000,
    maxRequests: 15,
    costPerRequest: 10,
  },
  '/api/forum/posts': {
    windowMs: 3_600_000,
    maxRequests: 20, // Per hour
  },
  '/api/auth/*': {
    windowMs: 900_000, // 15 minutes
    maxRequests: 10,
  },
  '/api/upload': {
    windowMs: 3_600_000,
    maxRequests: 10,
  },
};

export function getRouteLimit(pathname: string): RouteLimitConfig | null {
  // Exact match first
  if (ROUTE_LIMITS[pathname]) return ROUTE_LIMITS[pathname];

  // Wildcard match
  for (const [pattern, config] of Object.entries(ROUTE_LIMITS)) {
    const regex = new RegExp(
      '^' + pattern.replace(/\*/g, '[^/]+') + '$'
    );
    if (regex.test(pathname)) return config;
  }

  return null;
}

// Rate limit wrapper for API route handlers
export function withRateLimit(
  handler: (req: NextRequest) => Promise<Response>,
  config: RouteLimitConfig
) {
  const limiter = new SlidingWindowRateLimiter({
    windowMs: config.windowMs,
    maxRequests: config.maxRequests,
  });

  return async (req: NextRequest): Promise<Response> => {
    const key = config.keyGenerator
      ? config.keyGenerator(req)
      : getClientIdentifier(req);

    const result = await limiter.check(key);

    if (!result.allowed) {
      return Response.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((result.resetAt - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(
              Math.ceil((result.resetAt - Date.now()) / 1000)
            ),
          },
        }
      );
    }

    return handler(req);
  };
}

// Usage
// src/app/api/chat/route.ts
export const POST = withRateLimit(
  async (req) => {
    // Handle chat message
    const body = await req.json();
    // ...
    return Response.json({ message: 'ok' });
  },
  { windowMs: 60_000, maxRequests: 20 }
);
```

---

## 6. Distributed Rate Limiting

### Redis Cluster Support

```typescript
// src/lib/rate-limit/distributed.ts

// For multi-region or multi-instance deployments
export class DistributedRateLimiter {
  private localCounter = new Map<string, number>();
  private syncInterval: NodeJS.Timeout;

  constructor(
    private config: SlidingWindowConfig,
    private instanceId: string = `inst-${Date.now()}`
  ) {
    // Periodically sync local counts to Redis
    this.syncInterval = setInterval(() => this.sync(), 1000);
  }

  async check(key: string): Promise<{ allowed: boolean; remaining: number }> {
    const fullKey = `drl:${key}`;

    // Fast local check first
    const localCount = this.localCounter.get(key) ?? 0;
    if (localCount >= this.config.maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    // Increment locally
    this.localCounter.set(key, localCount + 1);

    // Async sync to Redis (non-blocking)
    const globalCount = await this.getGlobalCount(fullKey);

    if (globalCount >= this.config.maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    return {
      allowed: true,
      remaining: this.config.maxRequests - globalCount - 1,
    };
  }

  private async getGlobalCount(key: string): Promise<number> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Sum across all instances
    const instanceKeys = await redis.keys(`${key}:*`);
    let total = 0;

    for (const iKey of instanceKeys) {
      const count = await redis.zcount(iKey, windowStart, now);
      total += count;
    }

    return total;
  }

  private async sync(): Promise<void> {
    const now = Date.now();

    for (const [key, count] of this.localCounter.entries()) {
      if (count > 0) {
        const redisKey = `drl:${key}:${this.instanceId}`;
        await redis.zadd(redisKey, now, `${now}-${count}`);
        await redis.pexpire(redisKey, this.config.windowMs);
      }
    }

    this.localCounter.clear();
  }

  destroy(): void {
    clearInterval(this.syncInterval);
  }
}
```

---

## 7. AI-Specific Rate Limiting

### Token Budget Limiter

```typescript
// src/lib/rate-limit/token-budget.ts

export class TokenBudgetLimiter {
  async checkBudget(
    userId: string,
    tier: string,
    estimatedTokens: number
  ): Promise<{
    allowed: boolean;
    remainingTokens: number;
    dailyBudget: number;
    usedToday: number;
  }> {
    const limits = getTierLimits(tier);
    const dailyBudget = limits.tokenBudgetPerDay;
    const budgetKey = `token-budget:${userId}:${this.todayKey()}`;

    // Get current usage
    const used = parseInt((await redis.get(budgetKey)) ?? '0');

    if (used + estimatedTokens > dailyBudget) {
      return {
        allowed: false,
        remainingTokens: Math.max(0, dailyBudget - used),
        dailyBudget,
        usedToday: used,
      };
    }

    return {
      allowed: true,
      remainingTokens: dailyBudget - used - estimatedTokens,
      dailyBudget,
      usedToday: used,
    };
  }

  async recordUsage(userId: string, tokens: number): Promise<void> {
    const budgetKey = `token-budget:${userId}:${this.todayKey()}`;

    await redis.incrby(budgetKey, tokens);
    // Expire at end of day UTC
    const ttl = this.secondsUntilMidnightUTC();
    await redis.expire(budgetKey, ttl);
  }

  private todayKey(): string {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  }

  private secondsUntilMidnightUTC(): number {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setUTCHours(24, 0, 0, 0);
    return Math.ceil((midnight.getTime() - now.getTime()) / 1000);
  }
}

// Usage in AI chat route
export async function POST(req: Request) {
  const { userId } = auth();
  const { message, agentId } = await req.json();

  const user = await getUser(userId!);
  const estimatedTokens = estimateTokenCount(message) * 4; // Rough: input * 4 for response

  const budgetLimiter = new TokenBudgetLimiter();
  const budget = await budgetLimiter.checkBudget(
    userId!,
    user.tier,
    estimatedTokens
  );

  if (!budget.allowed) {
    return Response.json(
      {
        error: 'Daily token budget exceeded',
        remaining: budget.remainingTokens,
        budget: budget.dailyBudget,
        resetsAt: 'midnight UTC',
      },
      { status: 429 }
    );
  }

  // Process the AI request...
  const response = await processAIMessage(agentId, message);

  // Record actual token usage
  await budgetLimiter.recordUsage(
    userId!,
    response.inputTokens + response.outputTokens
  );

  return Response.json(response);
}
```

### Per-Agent Rate Limiting

```typescript
// src/lib/rate-limit/agent-limiter.ts

// Some agents are more expensive (SMART tier agents use Anthropic)
const AGENT_COST_MULTIPLIERS: Record<number, number> = {
  // SMART/PRO agents that use Anthropic Claude Sonnet
  // Higher cost = stricter limits
};

export class AgentRateLimiter {
  private baseLimiter = new SlidingWindowRateLimiter({
    windowMs: 3_600_000, // 1 hour
    maxRequests: 100,
  });

  async checkAgentLimit(
    userId: string,
    agentId: number,
    tier: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const limits = getTierLimits(tier);

    // Check hourly AI message limit
    const hourlyResult = await this.baseLimiter.check(
      `agent-hourly:${userId}`
    );
    if (!hourlyResult.allowed) {
      return {
        allowed: false,
        reason: `Hourly AI message limit reached (${limits.aiMessagesPerHour}/hour)`,
      };
    }

    // Check per-agent concurrency (prevent one user hammering one agent)
    const agentConcurrency = await redis.incr(
      `agent-concurrent:${userId}:${agentId}`
    );
    await redis.expire(`agent-concurrent:${userId}:${agentId}`, 120);

    if (agentConcurrency > 3) {
      return {
        allowed: false,
        reason: 'Too many concurrent requests to this agent',
      };
    }

    return { allowed: true };
  }

  async releaseAgentConcurrency(
    userId: string,
    agentId: number
  ): Promise<void> {
    await redis.decr(`agent-concurrent:${userId}:${agentId}`);
  }
}
```

---

## 8. Graceful Degradation

```typescript
// src/lib/rate-limit/graceful.ts

interface DegradationLevel {
  level: 'normal' | 'reduced' | 'minimal' | 'emergency';
  apiMultiplier: number; // Multiply limits by this
  features: string[];    // Features available at this level
}

const DEGRADATION_LEVELS: DegradationLevel[] = [
  {
    level: 'normal',
    apiMultiplier: 1.0,
    features: ['chat', 'forum', 'search', 'upload', 'bestie'],
  },
  {
    level: 'reduced',
    apiMultiplier: 0.5,
    features: ['chat', 'forum', 'search'], // No uploads, no bestie
  },
  {
    level: 'minimal',
    apiMultiplier: 0.25,
    features: ['chat'], // Chat only
  },
  {
    level: 'emergency',
    apiMultiplier: 0.1,
    features: [], // Read-only, no mutations
  },
];

export class GracefulDegradation {
  async getCurrentLevel(): Promise<DegradationLevel> {
    const levelStr = await redis.get('system:degradation-level');
    const levelIndex = levelStr ? parseInt(levelStr) : 0;
    return DEGRADATION_LEVELS[Math.min(levelIndex, DEGRADATION_LEVELS.length - 1)];
  }

  async setLevel(level: number): Promise<void> {
    await redis.set('system:degradation-level', String(level));
  }

  async isFeatureAvailable(feature: string): Promise<boolean> {
    const level = await this.getCurrentLevel();
    return level.features.includes(feature);
  }

  async getEffectiveLimit(baseLimit: number): Promise<number> {
    const level = await this.getCurrentLevel();
    return Math.ceil(baseLimit * level.apiMultiplier);
  }
}

// Auto-degradation based on system load
export async function checkSystemLoad(): Promise<void> {
  const degradation = new GracefulDegradation();

  // Check Redis memory usage
  const info = await redis.info('memory');
  const memMatch = info.match(/used_memory_rss:(\d+)/);
  const memoryMB = memMatch ? parseInt(memMatch[1]) / (1024 * 1024) : 0;

  // Check error rate (from monitoring)
  const errorRate = parseInt((await redis.get('metrics:error-rate-5m')) ?? '0');

  // Check API latency (p99)
  const p99Latency = parseInt(
    (await redis.get('metrics:p99-latency-ms')) ?? '0'
  );

  let newLevel = 0; // normal

  if (errorRate > 50 || p99Latency > 10_000) {
    newLevel = 3; // emergency
  } else if (errorRate > 20 || p99Latency > 5_000) {
    newLevel = 2; // minimal
  } else if (errorRate > 5 || p99Latency > 2_000 || memoryMB > 400) {
    newLevel = 1; // reduced
  }

  const currentLevel = await degradation.getCurrentLevel();
  if (DEGRADATION_LEVELS[newLevel].level !== currentLevel.level) {
    await degradation.setLevel(newLevel);
    console.warn(
      `[Degradation] Level changed: ${currentLevel.level} → ${DEGRADATION_LEVELS[newLevel].level}`
    );

    // Alert founder
    if (newLevel >= 2) {
      await sendFounderAlert(
        'system.degradation',
        `System Degradation: ${DEGRADATION_LEVELS[newLevel].level}`,
        `Error rate: ${errorRate}/min, P99 latency: ${p99Latency}ms, Memory: ${memoryMB}MB`,
        'stone'
      );
    }
  }
}
```

---

## 9. Rate Limit Response Headers

```typescript
// src/lib/rate-limit/headers.ts

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Policy': result.limitType,
  };

  if (result.retryAfter !== null) {
    headers['Retry-After'] = String(result.retryAfter);
    headers['X-RateLimit-Reset'] = String(
      Math.ceil(Date.now() / 1000) + result.retryAfter
    );
  }

  return headers;
}

// Standard 429 response
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Too Many Requests',
      message: `Rate limit exceeded for ${result.limitType}. Please retry after ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
      limit: result.limit,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...rateLimitHeaders(result),
      },
    }
  );
}
```

---

## 10. IP-Based Protection (DDoS Layer)

```typescript
// src/lib/rate-limit/ip-protection.ts

export class IPProtection {
  private bannedIPs = new Set<string>();

  async checkIP(ip: string): Promise<{
    allowed: boolean;
    reason?: string;
  }> {
    // Check if IP is banned
    const isBanned = await redis.sismember('banned-ips', ip);
    if (isBanned) {
      return { allowed: false, reason: 'IP banned' };
    }

    // Progressive rate limiting
    const minuteKey = `ip-minute:${ip}`;
    const hourKey = `ip-hour:${ip}`;

    const [minuteCount, hourCount] = await Promise.all([
      redis.incr(minuteKey),
      redis.incr(hourKey),
    ]);

    // Set expiry on first increment
    if (minuteCount === 1) await redis.expire(minuteKey, 60);
    if (hourCount === 1) await redis.expire(hourKey, 3600);

    // Thresholds
    if (minuteCount > 300) {
      // Auto-ban for 1 hour
      await redis.sadd('banned-ips', ip);
      await redis.expire('banned-ips', 3600);

      console.warn(`[IPProtection] Auto-banned IP: ${ip} (${minuteCount} req/min)`);

      return { allowed: false, reason: 'Rate limit exceeded — temporary ban' };
    }

    if (hourCount > 5000) {
      return { allowed: false, reason: 'Hourly IP limit exceeded' };
    }

    return { allowed: true };
  }
}
```

---

## 11. Testing Rate Limiters

```typescript
// __tests__/rate-limit/sliding-window.test.ts
import { describe, it, expect, beforeEach } from 'vitest';

describe('SlidingWindowRateLimiter', () => {
  let limiter: SlidingWindowRateLimiter;

  beforeEach(async () => {
    limiter = new SlidingWindowRateLimiter({
      windowMs: 60_000,
      maxRequests: 5,
    });
    // Clear test keys
    await redis.del('ratelimit:sw:test-user:test');
  });

  it('should allow requests under the limit', async () => {
    for (let i = 0; i < 5; i++) {
      const result = await limiter.check('test-user:test');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4 - i);
    }
  });

  it('should deny requests over the limit', async () => {
    // Use up all 5 requests
    for (let i = 0; i < 5; i++) {
      await limiter.check('test-user:test');
    }

    // 6th should be denied
    const result = await limiter.check('test-user:test');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should reset after window expires', async () => {
    // Use up all requests
    for (let i = 0; i < 5; i++) {
      await limiter.check('test-user:test');
    }

    // Manually expire the key
    await redis.del('ratelimit:sw:test-user:test');

    // Should allow again
    const result = await limiter.check('test-user:test');
    expect(result.allowed).toBe(true);
  });
});

describe('TokenBudgetLimiter', () => {
  it('should track token usage across requests', async () => {
    const limiter = new TokenBudgetLimiter();

    // FREE tier: 50,000 tokens/day
    const check1 = await limiter.checkBudget('test-user', 'FREE', 10_000);
    expect(check1.allowed).toBe(true);

    await limiter.recordUsage('test-user', 10_000);

    // Check again — should show reduced budget
    const check2 = await limiter.checkBudget('test-user', 'FREE', 45_000);
    expect(check2.allowed).toBe(false);
    expect(check2.remainingTokens).toBe(40_000);
  });
});
```

---

## Summary

| Algorithm | Best For | Stone AI Use Case |
|-----------|----------|------------------|
| Token Bucket | Burst-tolerant APIs | General API endpoints |
| Sliding Window | Precise rate control | AI message limits |
| Composite | Multi-dimensional limits | Per-tier, per-route |
| Token Budget | Cost control | Daily AI token budgets |
| IP Protection | DDoS mitigation | Global IP throttling |
| Graceful Degradation | System overload | Auto-scale features |

Rate limiting is a first-class concern in Stone AI — it protects both the platform's resources and ensures fair access across all 5 pricing tiers.
