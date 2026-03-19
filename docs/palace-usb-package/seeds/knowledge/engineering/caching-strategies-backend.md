# Caching Strategies — Backend

## Palace Knowledge Seed — Advanced Backend Engineering

### Overview

Caching is the single most impactful performance optimization for backend systems. This seed covers Redis caching patterns, cache invalidation strategies, cache-aside/write-through/write-behind topologies, distributed caching, and practical implementations for the Stone AI stack (Next.js 16, Prisma 7.4.2, PostgreSQL 16, Redis, Vercel).

---

## 1. Caching Fundamentals

### Why Cache in Stone AI?

- **Agent list/config** — 40 agents, rarely change, queried on every page load
- **User tier/permissions** — Checked on every API call for authorization
- **Pricing data** — Static between deployments
- **Forum posts** — High read-to-write ratio
- **AI model metadata** — Provider configs, model names, token limits
- **Session data** — Clerk session augmented with tier info

### Cache Hit Ratio Target

A healthy cache hit ratio for Stone AI: **>90%** for agent configs, **>80%** for user data, **>95%** for static data (pricing, backdrops).

---

## 2. Redis Setup

```typescript
// src/lib/cache/redis.ts
import { Redis } from 'ioredis';

const globalForRedis = globalThis as unknown as { redis: Redis | undefined };

function createRedisClient(): Redis {
  const redis = new Redis(process.env.REDIS_URL!, {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      if (times > 10) return null; // Stop retrying
      return Math.min(times * 100, 3000);
    },
    enableReadyCheck: true,
    lazyConnect: true,
    keepAlive: 30000,
    connectTimeout: 5000,
    commandTimeout: 3000,
  });

  redis.on('error', (err) => {
    console.error('[Redis] Connection error:', err.message);
  });

  redis.on('connect', () => {
    console.log('[Redis] Connected');
  });

  return redis;
}

// Singleton in development (Next.js hot reload protection)
export const redis = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis;
}
```

---

## 3. Cache-Aside (Lazy Loading)

The most common pattern: check cache first, fall back to database, populate cache on miss.

```typescript
// src/lib/cache/cache-aside.ts
import { redis } from './redis';

interface CacheOptions {
  ttl: number; // seconds
  prefix: string;
  serialize?: (data: unknown) => string;
  deserialize?: (raw: string) => unknown;
}

export class CacheAside<T> {
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions) {
    this.options = {
      serialize: JSON.stringify,
      deserialize: JSON.parse,
      ...options,
    };
  }

  private key(id: string): string {
    return `${this.options.prefix}:${id}`;
  }

  async get(id: string, fetcher: () => Promise<T>): Promise<T> {
    const cacheKey = this.key(id);

    // 1. Try cache
    const cached = await redis.get(cacheKey);
    if (cached !== null) {
      return this.options.deserialize(cached) as T;
    }

    // 2. Cache miss — fetch from source
    const data = await fetcher();

    // 3. Populate cache (don't await — fire and forget)
    redis
      .setex(cacheKey, this.options.ttl, this.options.serialize(data))
      .catch((err) => console.error('[Cache] Write failed:', err));

    return data;
  }

  async invalidate(id: string): Promise<void> {
    await redis.del(this.key(id));
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await redis.keys(`${this.options.prefix}:${pattern}`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  async set(id: string, data: T, ttlOverride?: number): Promise<void> {
    const ttl = ttlOverride ?? this.options.ttl;
    await redis.setex(
      this.key(id),
      ttl,
      this.options.serialize(data)
    );
  }
}

// Concrete caches for Stone AI
export const agentCache = new CacheAside<AgentConfig>({
  prefix: 'agent',
  ttl: 3600, // 1 hour — agents rarely change
});

export const userTierCache = new CacheAside<UserTier>({
  prefix: 'user-tier',
  ttl: 300, // 5 minutes — tier changes are important but not instant
});

export const pricingCache = new CacheAside<PricingData>({
  prefix: 'pricing',
  ttl: 86400, // 24 hours — pricing is static
});

// Usage in API route
async function getAgent(agentId: number): Promise<AgentConfig> {
  return agentCache.get(String(agentId), async () => {
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { capabilities: true },
    });
    if (!agent) throw new NotFoundError('Agent not found');
    return agent;
  });
}
```

---

## 4. Write-Through Cache

Writes go to cache AND database simultaneously. Guarantees cache is always fresh.

```typescript
// src/lib/cache/write-through.ts

export class WriteThroughCache<T> {
  constructor(
    private cache: CacheAside<T>,
    private writer: (id: string, data: T) => Promise<void>
  ) {}

  async write(id: string, data: T): Promise<void> {
    // Write to both in parallel
    await Promise.all([
      this.cache.set(id, data),
      this.writer(id, data),
    ]);
  }

  async read(id: string, fetcher: () => Promise<T>): Promise<T> {
    return this.cache.get(id, fetcher);
  }
}

// Usage: User settings cache
const userSettingsCache = new WriteThroughCache<UserSettings>(
  new CacheAside({ prefix: 'user-settings', ttl: 600 }),
  async (id, settings) => {
    await prisma.userSettings.update({
      where: { userId: id },
      data: settings,
    });
  }
);

// In API route
export async function PUT(req: Request) {
  const { userId } = auth();
  const settings = await req.json();

  await userSettingsCache.write(userId!, settings);

  return Response.json({ success: true });
}
```

---

## 5. Write-Behind (Write-Back) Cache

Writes go to cache immediately, database write is deferred. Higher performance, risk of data loss.

```typescript
// src/lib/cache/write-behind.ts

interface WriteBuffer<T> {
  id: string;
  data: T;
  timestamp: number;
}

export class WriteBehindCache<T> {
  private buffer: WriteBuffer<T>[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private flushThreshold: number;
  private flushIntervalMs: number;

  constructor(
    private cache: CacheAside<T>,
    private batchWriter: (items: WriteBuffer<T>[]) => Promise<void>,
    options?: { flushThreshold?: number; flushIntervalMs?: number }
  ) {
    this.flushThreshold = options?.flushThreshold ?? 50;
    this.flushIntervalMs = options?.flushIntervalMs ?? 5000;
    this.startFlushTimer();
  }

  async write(id: string, data: T): Promise<void> {
    // Write to cache immediately
    await this.cache.set(id, data);

    // Buffer the write
    this.buffer.push({ id, data, timestamp: Date.now() });

    // Flush if threshold reached
    if (this.buffer.length >= this.flushThreshold) {
      await this.flush();
    }
  }

  private startFlushTimer(): void {
    this.flushInterval = setInterval(() => {
      if (this.buffer.length > 0) {
        this.flush().catch(console.error);
      }
    }, this.flushIntervalMs);
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const items = [...this.buffer];
    this.buffer = [];

    try {
      await this.batchWriter(items);
    } catch (error) {
      // Re-add failed items to buffer
      console.error('[WriteBehind] Batch write failed, re-buffering:', error);
      this.buffer.unshift(...items);
    }
  }

  async shutdown(): Promise<void> {
    if (this.flushInterval) clearInterval(this.flushInterval);
    await this.flush(); // Final flush
  }
}

// Usage: Analytics event buffering
const analyticsCache = new WriteBehindCache<AnalyticsEvent>(
  new CacheAside({ prefix: 'analytics', ttl: 60 }),
  async (items) => {
    // Batch insert into PostgreSQL
    const values = items.map(
      (item) =>
        `('${item.id}', '${JSON.stringify(item.data)}'::jsonb, NOW())`
    );

    await prisma.$executeRawUnsafe(`
      INSERT INTO analytics_events (id, data, created_at)
      VALUES ${values.join(',')}
    `);
  },
  { flushThreshold: 100, flushIntervalMs: 10_000 }
);
```

---

## 6. Cache Invalidation Strategies

### Time-Based (TTL)

```typescript
// Different TTLs for different data volatility
const TTL = {
  STATIC: 86400,      // 24 hours — pricing, agent definitions
  SEMI_STATIC: 3600,  // 1 hour — forum categories, help articles
  DYNAMIC: 300,       // 5 minutes — user profiles, tier info
  VOLATILE: 60,       // 1 minute — online presence, typing indicators
  EPHEMERAL: 10,      // 10 seconds — rate limit counters
} as const;
```

### Event-Based Invalidation

```typescript
// src/lib/cache/invalidation.ts

// Subscribe to domain events and invalidate caches
function setupCacheInvalidation(): void {
  // When user's subscription changes, invalidate their tier cache
  eventBus.on('subscription.changed', async (event) => {
    await userTierCache.invalidate(event.aggregateId);
    await userSettingsCache.invalidate(event.aggregateId);
    console.log(`[Cache] Invalidated user caches for ${event.aggregateId}`);
  });

  // When an agent is updated, invalidate its cache
  eventBus.on('agent.updated', async (event) => {
    await agentCache.invalidate(event.aggregateId);
    // Also invalidate the agent list cache
    await redis.del('agent-list:all');
    await redis.del('agent-list:by-tier:*');
  });

  // When pricing changes, clear all pricing caches
  eventBus.on('pricing.updated', async () => {
    await pricingCache.invalidatePattern('*');
  });

  // When a forum post is created/updated
  eventBus.on('forum.post.changed', async (event) => {
    const data = event.data as any;
    await redis.del(`forum-post:${event.aggregateId}`);
    await redis.del(`forum-thread:${data.threadId}`);
    // Invalidate paginated list cache
    await invalidateForumListCaches(data.categoryId);
  });
}

async function invalidateForumListCaches(categoryId: string): Promise<void> {
  // Delete all paginated cache entries for this category
  const keys = await redis.keys(`forum-list:${categoryId}:page:*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
  // Also invalidate the "latest" and "popular" sorted caches
  await redis.del(`forum-list:${categoryId}:latest`);
  await redis.del(`forum-list:${categoryId}:popular`);
}
```

### Tag-Based Invalidation

```typescript
// src/lib/cache/tagged-cache.ts

export class TaggedCache {
  private prefix = 'tcache';

  async set(
    key: string,
    data: unknown,
    tags: string[],
    ttl: number
  ): Promise<void> {
    const pipeline = redis.pipeline();

    // Store the data
    pipeline.setex(`${this.prefix}:data:${key}`, ttl, JSON.stringify(data));

    // Associate tags with this key
    for (const tag of tags) {
      pipeline.sadd(`${this.prefix}:tag:${tag}`, key);
      pipeline.expire(`${this.prefix}:tag:${tag}`, ttl + 60); // Tag set lives slightly longer
    }

    // Store which tags this key belongs to (for cleanup)
    pipeline.sadd(`${this.prefix}:key-tags:${key}`, ...tags);
    pipeline.expire(`${this.prefix}:key-tags:${key}`, ttl);

    await pipeline.exec();
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await redis.get(`${this.prefix}:data:${key}`);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async invalidateTag(tag: string): Promise<number> {
    const keys = await redis.smembers(`${this.prefix}:tag:${tag}`);

    if (keys.length === 0) return 0;

    const pipeline = redis.pipeline();

    for (const key of keys) {
      pipeline.del(`${this.prefix}:data:${key}`);
      pipeline.del(`${this.prefix}:key-tags:${key}`);
    }

    pipeline.del(`${this.prefix}:tag:${tag}`);

    await pipeline.exec();

    return keys.length;
  }

  async invalidateMultipleTags(tags: string[]): Promise<void> {
    await Promise.all(tags.map((tag) => this.invalidateTag(tag)));
  }
}

const taggedCache = new TaggedCache();

// Usage: Cache a forum post with multiple tags
await taggedCache.set(
  `forum-post:${postId}`,
  postData,
  [`user:${authorId}`, `category:${categoryId}`, 'forum-posts'],
  3600
);

// When user is updated, invalidate all their content
await taggedCache.invalidateTag(`user:${userId}`);

// When category is reorganized, invalidate all posts in it
await taggedCache.invalidateTag(`category:${categoryId}`);
```

---

## 7. Multi-Layer Caching

### L1 (In-Memory) + L2 (Redis) + L3 (Database)

```typescript
// src/lib/cache/multi-layer.ts

// L1: In-memory LRU cache (per-instance, dies with the serverless function)
class LRUCache<T> {
  private cache = new Map<string, { data: T; expiresAt: number }>();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  set(key: string, data: T, ttlMs: number): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

// Multi-layer cache
export class MultiLayerCache<T> {
  private l1: LRUCache<T>;
  private l2Prefix: string;
  private l2Ttl: number;

  constructor(options: {
    l1MaxSize?: number;
    l2Prefix: string;
    l2Ttl: number;
  }) {
    this.l1 = new LRUCache(options.l1MaxSize ?? 500);
    this.l2Prefix = options.l2Prefix;
    this.l2Ttl = options.l2Ttl;
  }

  async get(key: string, fetcher: () => Promise<T>): Promise<T> {
    // L1: In-memory check
    const l1Result = this.l1.get(key);
    if (l1Result !== undefined) {
      return l1Result;
    }

    // L2: Redis check
    const l2Key = `${this.l2Prefix}:${key}`;
    const l2Result = await redis.get(l2Key);
    if (l2Result !== null) {
      const data = JSON.parse(l2Result) as T;
      // Populate L1
      this.l1.set(key, data, 30_000); // L1: 30 seconds
      return data;
    }

    // L3: Database fetch
    const data = await fetcher();

    // Populate L2 and L1
    await redis.setex(l2Key, this.l2Ttl, JSON.stringify(data));
    this.l1.set(key, data, 30_000);

    return data;
  }

  async invalidate(key: string): Promise<void> {
    this.l1.delete(key);
    await redis.del(`${this.l2Prefix}:${key}`);
  }
}

// Agent config uses multi-layer caching — queried on every request
export const agentConfigCache = new MultiLayerCache<AgentConfig>({
  l1MaxSize: 100, // Keep up to 100 agents in memory
  l2Prefix: 'ml-agent',
  l2Ttl: 3600, // Redis: 1 hour
});
```

---

## 8. Request-Level Caching (Request Deduplication)

```typescript
// src/lib/cache/request-cache.ts

// Prevents the same database query from running multiple times
// within a single request lifecycle
export function createRequestCache() {
  const cache = new Map<string, Promise<unknown>>();

  return {
    async dedupe<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
      if (cache.has(key)) {
        return cache.get(key) as Promise<T>;
      }

      const promise = fetcher();
      cache.set(key, promise);

      try {
        return await promise;
      } catch (error) {
        cache.delete(key); // Don't cache errors
        throw error;
      }
    },

    clear(): void {
      cache.clear();
    },
  };
}

// Per-request singleton via AsyncLocalStorage
import { AsyncLocalStorage } from 'async_hooks';

const requestCacheStorage = new AsyncLocalStorage<ReturnType<typeof createRequestCache>>();

export function withRequestCache<T>(fn: () => Promise<T>): Promise<T> {
  return requestCacheStorage.run(createRequestCache(), fn);
}

export function getRequestCache() {
  return requestCacheStorage.getStore();
}

// Usage in data fetching
async function getUserTier(userId: string): Promise<string> {
  const reqCache = getRequestCache();

  if (reqCache) {
    return reqCache.dedupe(`user-tier:${userId}`, () =>
      fetchUserTierFromDB(userId)
    );
  }

  return fetchUserTierFromDB(userId);
}

// Middleware wraps every request
// src/middleware.ts
export async function middleware(req: NextRequest) {
  return withRequestCache(async () => {
    // All data fetching within this request shares the dedupe cache
    const tier = await getUserTier(userId); // First call: hits DB
    const tier2 = await getUserTier(userId); // Second call: returns cached promise
    // ...
  });
}
```

---

## 9. Cache Stampede Prevention

When a cache entry expires and multiple requests try to rebuild it simultaneously.

```typescript
// src/lib/cache/stampede.ts

// Strategy 1: Mutex lock (only one rebuilder)
export async function cacheWithLock<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
  lockTimeout: number = 5000
): Promise<T> {
  // Try cache first
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  // Try to acquire lock
  const lockKey = `lock:${key}`;
  const acquired = await redis.set(lockKey, '1', 'PX', lockTimeout, 'NX');

  if (acquired) {
    try {
      // We got the lock — rebuild the cache
      const data = await fetcher();
      await redis.setex(key, ttl, JSON.stringify(data));
      return data;
    } finally {
      await redis.del(lockKey);
    }
  }

  // Another process is rebuilding — wait and retry
  await new Promise((resolve) => setTimeout(resolve, 100));
  const retryResult = await redis.get(key);
  if (retryResult) return JSON.parse(retryResult);

  // Lock holder might have failed — just fetch directly
  return fetcher();
}

// Strategy 2: Stale-while-revalidate
export async function cacheWithSWR<T>(
  key: string,
  ttl: number,
  staleGrace: number, // How long stale data is acceptable
  fetcher: () => Promise<T>
): Promise<T> {
  const raw = await redis.get(key);

  if (raw) {
    const { data, cachedAt } = JSON.parse(raw) as {
      data: T;
      cachedAt: number;
    };

    const age = (Date.now() - cachedAt) / 1000;

    if (age < ttl) {
      // Fresh — return immediately
      return data;
    }

    if (age < ttl + staleGrace) {
      // Stale but within grace period — return stale, rebuild in background
      rebuildInBackground(key, ttl, fetcher);
      return data;
    }
  }

  // No cache or expired beyond grace — must wait for fresh data
  const data = await fetcher();
  await redis.setex(
    key,
    ttl + staleGrace + 60,
    JSON.stringify({ data, cachedAt: Date.now() })
  );
  return data;
}

function rebuildInBackground<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): void {
  // Don't await — fire and forget
  fetcher()
    .then((data) =>
      redis.setex(key, ttl + 60, JSON.stringify({ data, cachedAt: Date.now() }))
    )
    .catch((err) => console.error('[SWR] Background rebuild failed:', err));
}
```

---

## 10. Caching in Next.js 16

### Route Handler Caching

```typescript
// src/app/api/agents/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // Use multi-layer cache for agent list
  const agents = await agentConfigCache.get('all-agents', async () => {
    return prisma.agent.findMany({
      where: { isActive: true },
      orderBy: { number: 'asc' },
      select: {
        id: true,
        number: true,
        name: true,
        description: true,
        tier: true,
        avatarUrl: true,
      },
    });
  });

  return NextResponse.json(agents, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
    },
  });
}
```

### Unstable Cache (Next.js Data Cache)

```typescript
// src/lib/data/cached-queries.ts
import { unstable_cache } from 'next/cache';

export const getCachedAgentList = unstable_cache(
  async () => {
    return prisma.agent.findMany({
      where: { isActive: true },
      orderBy: { number: 'asc' },
    });
  },
  ['agent-list'],
  {
    revalidate: 3600, // Revalidate every hour
    tags: ['agents'],
  }
);

export const getCachedPricing = unstable_cache(
  async () => {
    return prisma.pricingTier.findMany({
      orderBy: { price: 'asc' },
    });
  },
  ['pricing'],
  {
    revalidate: 86400,
    tags: ['pricing'],
  }
);

// Invalidate via revalidateTag
import { revalidateTag } from 'next/cache';

// In an admin API route that updates agents
export async function PUT(req: Request) {
  // ... update agent in DB
  revalidateTag('agents'); // Purges the Next.js data cache
  await agentCache.invalidate(String(agentId)); // Purges Redis cache
  return Response.json({ success: true });
}
```

---

## 11. Cache Warming

```typescript
// src/lib/cache/warming.ts

export async function warmCaches(): Promise<void> {
  console.log('[CacheWarming] Starting...');

  const warmers = [
    warmAgentCache(),
    warmPricingCache(),
    warmPopularForumPosts(),
  ];

  const results = await Promise.allSettled(warmers);

  for (const result of results) {
    if (result.status === 'rejected') {
      console.error('[CacheWarming] Failed:', result.reason);
    }
  }

  console.log('[CacheWarming] Complete');
}

async function warmAgentCache(): Promise<void> {
  const agents = await prisma.agent.findMany({
    where: { isActive: true },
    include: { capabilities: true },
  });

  const pipeline = redis.pipeline();

  for (const agent of agents) {
    pipeline.setex(
      `agent:${agent.id}`,
      3600,
      JSON.stringify(agent)
    );
  }

  // Also cache the full list
  pipeline.setex('agent-list:all', 3600, JSON.stringify(agents));

  await pipeline.exec();

  console.log(`[CacheWarming] Warmed ${agents.length} agents`);
}

async function warmPricingCache(): Promise<void> {
  const tiers = await prisma.pricingTier.findMany();
  await redis.setex('pricing:all', 86400, JSON.stringify(tiers));
}

async function warmPopularForumPosts(): Promise<void> {
  const popular = await prisma.forumPost.findMany({
    where: { isPublished: true },
    orderBy: { viewCount: 'desc' },
    take: 50,
  });

  const pipeline = redis.pipeline();
  for (const post of popular) {
    pipeline.setex(`forum-post:${post.id}`, 3600, JSON.stringify(post));
  }
  await pipeline.exec();
}

// Warm caches on deploy or server start
// Can be triggered via API route or build hook
```

---

## 12. Monitoring Cache Health

```typescript
// src/lib/cache/metrics.ts

interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  errorCount: number;
  avgLatencyMs: number;
  memoryUsageMB: number;
}

class CacheMonitor {
  private hits = 0;
  private misses = 0;
  private errors = 0;
  private totalLatencyMs = 0;
  private operations = 0;

  recordHit(latencyMs: number): void {
    this.hits++;
    this.operations++;
    this.totalLatencyMs += latencyMs;
  }

  recordMiss(latencyMs: number): void {
    this.misses++;
    this.operations++;
    this.totalLatencyMs += latencyMs;
  }

  recordError(): void {
    this.errors++;
  }

  async getMetrics(): Promise<CacheMetrics> {
    const info = await redis.info('memory');
    const memoryMatch = info.match(/used_memory:(\d+)/);
    const memoryBytes = memoryMatch ? parseInt(memoryMatch[1]) : 0;

    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits + this.misses > 0
        ? this.hits / (this.hits + this.misses)
        : 0,
      errorCount: this.errors,
      avgLatencyMs: this.operations > 0
        ? this.totalLatencyMs / this.operations
        : 0,
      memoryUsageMB: memoryBytes / (1024 * 1024),
    };
  }

  reset(): void {
    this.hits = this.misses = this.errors = this.totalLatencyMs = this.operations = 0;
  }
}

export const cacheMonitor = new CacheMonitor();

// Instrumented cache wrapper
export async function cachedGet<T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const start = Date.now();

  try {
    const cached = await redis.get(key);

    if (cached) {
      cacheMonitor.recordHit(Date.now() - start);
      return JSON.parse(cached);
    }

    cacheMonitor.recordMiss(Date.now() - start);

    const data = await fetcher();
    await redis.setex(key, ttl, JSON.stringify(data));
    return data;
  } catch (error) {
    cacheMonitor.recordError();
    // Fallback to direct fetch
    return fetcher();
  }
}
```

---

## Summary

| Strategy | Best For | Stone AI Use Case |
|----------|----------|------------------|
| Cache-Aside | Read-heavy data | Agent configs, user profiles |
| Write-Through | Data that must be consistent | User settings, preferences |
| Write-Behind | High-write, loss-tolerant | Analytics events, view counts |
| Multi-Layer (L1+L2) | Hot data, low latency | Agent configs (every request) |
| SWR | Tolerance for brief staleness | Forum posts, help articles |
| Tagged Invalidation | Related data groups | User content, category pages |
| Request Dedup | N+1 within a request | Multiple tier checks per request |
| Cache Warming | Predictable hot data | Deploy-time agent/pricing cache |

The golden rule: cache what is read often and written rarely. Invalidate aggressively for data that matters (billing, permissions) and use TTL for data where brief staleness is acceptable (forum posts, analytics).
