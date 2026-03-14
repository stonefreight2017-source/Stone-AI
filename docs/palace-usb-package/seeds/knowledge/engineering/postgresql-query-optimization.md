# PostgreSQL Query Optimization for SaaS Applications

## Senior Database Engineer — Palace Knowledge Seed

**Scope**: Query performance analysis, indexing strategy, connection management, and database tuning for a Next.js + Prisma + PostgreSQL SaaS platform serving chat-based AI agent workloads.

**Why this matters**: A single chat request in Stone AI touches 6+ database queries. At scale, unoptimized queries compound into seconds of latency per request, connection pool exhaustion, and degraded UX. Every millisecond saved per query multiplies across thousands of concurrent users.

---

## 1. EXPLAIN ANALYZE — Reading Execution Plans

EXPLAIN ANALYZE is the single most important diagnostic tool. It runs the query and reports actual execution time and row counts, not just estimates.

### Basic Usage

```sql
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT m.id, m.content, m."createdAt", u.name
FROM "Message" m
JOIN "User" u ON m."userId" = u.id
WHERE m."conversationId" = 'clxyz123'
ORDER BY m."createdAt" DESC
LIMIT 50;
```

### Real Output — Sequential Scan (BAD)

```
Limit  (cost=1542.83..1542.96 rows=50 width=312) (actual time=89.241..89.258 rows=50 loops=1)
  ->  Sort  (cost=1542.83..1556.21 rows=5351 width=312) (actual time=89.239..89.248 rows=50 loops=1)
        Sort Key: m."createdAt" DESC
        Sort Method: top-N heapsort  Memory: 41kB
        ->  Hash Join  (cost=8.20..1402.51 rows=5351 width=312) (actual time=0.187..84.923 rows=5351 loops=1)
              Hash Cond: (m."userId" = u.id)
              ->  Seq Scan on "Message" m  (cost=0.00..1284.00 rows=5351 width=280) (actual time=0.042..78.612 rows=5351 loops=1)
                    Filter: ("conversationId" = 'clxyz123'::text)
                    Rows Removed by Filter: 48249
              ->  Hash  (cost=5.70..5.70 rows=200 width=40) (actual time=0.102..0.103 rows=200 loops=1)
                    Buckets: 1024  Batches: 1  Memory Usage: 18kB
                    ->  Seq Scan on "User" u  (cost=0.00..5.70 rows=200 width=40) (actual time=0.008..0.051 rows=200 loops=1)
Planning Time: 0.312 ms
Execution Time: 89.341 ms
```

**How to read this**:
- `Seq Scan on "Message"` — full table scan. No index used. This is the problem.
- `Rows Removed by Filter: 48249` — scanned 53,600 rows to return 5,351. Brutal waste.
- `actual time=78.612` — 78ms just scanning the Message table.
- `Sort Method: top-N heapsort` — PostgreSQL is sorting in memory, which is fine for 50 rows.

### Real Output — After Adding Index (GOOD)

```sql
CREATE INDEX idx_message_conversation_created
ON "Message" ("conversationId", "createdAt" DESC);
```

```
Limit  (cost=0.42..3.87 rows=50 width=312) (actual time=0.038..0.194 rows=50 loops=1)
  ->  Nested Loop  (cost=0.42..368.93 rows=5351 width=312) (actual time=0.036..0.184 rows=50 loops=1)
        ->  Index Scan using idx_message_conversation_created on "Message" m  (cost=0.42..295.18 rows=5351 width=280) (actual time=0.024..0.087 rows=50 loops=1)
              Index Cond: ("conversationId" = 'clxyz123'::text)
        ->  Index Scan using "User_pkey" on "User" u  (cost=0.14..0.16 rows=1 width=40) (actual time=0.001..0.001 rows=1 loops=50)
              Index Cond: (id = m."userId")
Planning Time: 0.289 ms
Execution Time: 0.231 ms
```

**What changed**:
- `Index Scan using idx_message_conversation_created` — index is used. No full table scan.
- Only 50 rows touched (the LIMIT pushes down into the index scan).
- `Execution Time: 0.231 ms` — from 89ms to 0.2ms. That is a 386x improvement.

### Key EXPLAIN Concepts

| Node Type | Meaning | Action |
|-----------|---------|--------|
| Seq Scan | Full table scan | Add an index or check if one exists but isn't used |
| Index Scan | B-tree index traversal | Good. Check if it's the right index. |
| Index Only Scan | Reads from index alone, no heap | Best case. All columns in the index. |
| Bitmap Index Scan | Index scan → bitmap → heap | OK for medium selectivity. Multiple index combination. |
| Nested Loop | For each outer row, scan inner | Fine for small outer sets. Disaster for large ones. |
| Hash Join | Build hash table, probe it | Good for large joins with equality conditions. |
| Sort | Explicit sort step | Check if an index could eliminate the sort. |

**Critical numbers to watch**:
- `actual time` vs `cost` — if actual >> estimated, statistics are stale. Run ANALYZE.
- `rows` (estimated) vs `rows` (actual) — large mismatch means the planner is making bad decisions.
- `Buffers: shared hit` vs `shared read` — reads = disk I/O. Hits = cache. High read ratio = needs more shared_buffers or working set exceeds RAM.

---

## 2. Index Strategy

### 2.1 Composite Indexes

Column order matters. PostgreSQL uses a composite index for queries that filter on a **leftmost prefix** of the index columns.

```sql
-- This index supports:
-- WHERE conversationId = X
-- WHERE conversationId = X AND createdAt > Y
-- WHERE conversationId = X ORDER BY createdAt
-- It does NOT efficiently support:
-- WHERE createdAt > Y (alone)
CREATE INDEX idx_message_conv_created
ON "Message" ("conversationId", "createdAt" DESC);
```

**Rule**: Put equality columns first, range/sort columns last.

```sql
-- For the agent dispatch query: find active agents for a tier
-- WHERE tier = X AND isActive = true ORDER BY priority
CREATE INDEX idx_agent_tier_active_priority
ON "Agent" ("tier", "isActive", "priority");
```

### 2.2 Partial Indexes

Only index rows that match a condition. Smaller index = faster scans, less storage, less write overhead.

```sql
-- Only index unread messages (most queries are for unread)
CREATE INDEX idx_message_unread
ON "Message" ("conversationId", "createdAt" DESC)
WHERE "isRead" = false;

-- Only index active subscriptions
CREATE INDEX idx_subscription_active
ON "Subscription" ("userId", "tier")
WHERE "status" = 'active';

-- Only index non-deleted conversations
CREATE INDEX idx_conversation_user_active
ON "Conversation" ("userId", "updatedAt" DESC)
WHERE "deletedAt" IS NULL;
```

**When to use**: When >70% of queries target a specific subset of rows. If 90% of your messages are read and you're always querying unread, a partial index on `isRead = false` is dramatically smaller.

### 2.3 Expression Indexes

Index computed values that appear in WHERE clauses.

```sql
-- If you query by lowercase email (Clerk stores mixed case)
CREATE INDEX idx_user_email_lower
ON "User" (LOWER(email));

-- Query must match the expression exactly:
SELECT * FROM "User" WHERE LOWER(email) = 'stone@stone-ai.net';

-- Date truncation for analytics dashboards
CREATE INDEX idx_message_created_day
ON "Message" (DATE_TRUNC('day', "createdAt"));

-- JSONB field extraction for agent config
CREATE INDEX idx_agent_config_model
ON "Agent" ((config->>'model'));
```

### 2.4 Index Anti-Patterns

```sql
-- BAD: Indexing low-cardinality boolean columns alone
CREATE INDEX idx_user_active ON "User" ("isActive");
-- PostgreSQL will seq scan anyway because 50% of rows match

-- BAD: Too many single-column indexes hoping the planner combines them
CREATE INDEX idx1 ON "Message" ("conversationId");
CREATE INDEX idx2 ON "Message" ("createdAt");
CREATE INDEX idx3 ON "Message" ("userId");
-- The planner CAN combine via BitmapAnd but composite is almost always faster

-- BAD: Indexing columns you never filter/sort on
CREATE INDEX idx_message_content ON "Message" ("content");
-- text columns in B-tree indexes are expensive and rarely used for exact match

-- GOOD: One composite index that serves multiple query patterns
CREATE INDEX idx_message_conv_user_created
ON "Message" ("conversationId", "userId", "createdAt" DESC);
```

### 2.5 When to Use GIN vs B-tree

```sql
-- GIN for JSONB containment queries
CREATE INDEX idx_agent_config_gin ON "Agent" USING GIN (config);
-- Supports: WHERE config @> '{"model": "qwen-2.5-32b"}'

-- GIN for full-text search
CREATE INDEX idx_message_content_fts
ON "Message" USING GIN (to_tsvector('english', content));
-- Supports: WHERE to_tsvector('english', content) @@ to_tsquery('billing & issue')

-- GIN for array columns
CREATE INDEX idx_user_roles_gin ON "User" USING GIN (roles);
-- Supports: WHERE roles @> ARRAY['admin']
```

### 2.6 Index Maintenance

```sql
-- Find unused indexes (wasting write performance)
SELECT
  schemaname || '.' || relname AS table,
  indexrelname AS index,
  pg_size_pretty(pg_relation_size(i.indexrelid)) AS size,
  idx_scan AS times_used
FROM pg_stat_user_indexes i
JOIN pg_index USING (indexrelid)
WHERE idx_scan < 10
  AND NOT indisunique
  AND NOT indisprimary
ORDER BY pg_relation_size(i.indexrelid) DESC;

-- Find missing indexes (seq scans on large tables)
SELECT
  schemaname || '.' || relname AS table,
  seq_scan,
  seq_tup_read,
  idx_scan,
  n_live_tup AS row_count,
  pg_size_pretty(pg_relation_size(relid)) AS size
FROM pg_stat_user_tables
WHERE seq_scan > 100
  AND n_live_tup > 10000
  AND (idx_scan IS NULL OR idx_scan < seq_scan * 0.1)
ORDER BY seq_tup_read DESC;
```

---

## 3. N+1 Detection and Prevention with Prisma

### What N+1 Looks Like

```typescript
// BAD: N+1 — fires 1 query for conversations + N queries for messages
const conversations = await prisma.conversation.findMany({
  where: { userId: user.id },
});

for (const conv of conversations) {
  const messages = await prisma.message.findMany({
    where: { conversationId: conv.id },
    orderBy: { createdAt: 'desc' },
    take: 1,
  });
  conv.lastMessage = messages[0];
}
// If user has 50 conversations, this fires 51 queries
```

```typescript
// GOOD: Single query with include
const conversations = await prisma.conversation.findMany({
  where: { userId: user.id },
  include: {
    messages: {
      orderBy: { createdAt: 'desc' },
      take: 1,
      select: { id: true, content: true, createdAt: true },
    },
  },
});
// 1 query (Prisma generates a JOIN or correlated subquery)
```

### Prisma's Query Logging for Detection

```typescript
// In development, enable query logging
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
  ],
});

prisma.$on('query', (e) => {
  if (e.duration > 50) {
    console.warn(`SLOW QUERY (${e.duration}ms): ${e.query}`);
  }
});

// Count queries per request in middleware
let queryCount = 0;
prisma.$use(async (params, next) => {
  queryCount++;
  const result = await next(params);
  return result;
});

// After request completes:
if (queryCount > 10) {
  console.warn(`N+1 ALERT: ${queryCount} queries in single request`);
}
```

### Common N+1 Patterns in Chat Applications

```typescript
// PATTERN 1: Loading user info for each message in a conversation
// BAD
const messages = await prisma.message.findMany({
  where: { conversationId: convId },
});
// Then for each message, load user... N+1

// GOOD
const messages = await prisma.message.findMany({
  where: { conversationId: convId },
  include: {
    user: { select: { id: true, name: true, avatarUrl: true } },
  },
});

// PATTERN 2: Loading agent config for each conversation
// BAD
const conversations = await prisma.conversation.findMany({ where: { userId } });
for (const c of conversations) {
  c.agent = await prisma.agent.findUnique({ where: { id: c.agentId } });
}

// GOOD
const conversations = await prisma.conversation.findMany({
  where: { userId },
  include: {
    agent: { select: { id: true, name: true, avatar: true, tier: true } },
  },
});

// PATTERN 3: Counting unread per conversation
// BAD — N queries
for (const conv of conversations) {
  conv.unreadCount = await prisma.message.count({
    where: { conversationId: conv.id, isRead: false },
  });
}

// GOOD — Single raw query
const unreadCounts = await prisma.$queryRaw`
  SELECT "conversationId", COUNT(*) as count
  FROM "Message"
  WHERE "conversationId" = ANY(${conversationIds})
    AND "isRead" = false
  GROUP BY "conversationId"
`;
```

### Prisma Select vs Include Performance

```typescript
// Include loads full related records — can be wasteful
const conv = await prisma.conversation.findUnique({
  where: { id: convId },
  include: { messages: true }, // loads ALL columns of ALL messages
});

// Select loads only what you need — always prefer this
const conv = await prisma.conversation.findUnique({
  where: { id: convId },
  select: {
    id: true,
    title: true,
    messages: {
      select: { id: true, content: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    },
  },
});
// Smaller payload, less memory, faster serialization
```

---

## 4. Connection Pooling: PgBouncer vs Prisma vs Neon Pooler

### Why Pooling Matters

PostgreSQL spawns a process per connection. Each process uses ~5-10MB of RAM. 100 connections = 500MB-1GB just for connection overhead. Serverless functions (Vercel) can spawn hundreds of cold starts, each wanting its own connection.

### Option 1: Neon's Built-in Pooler (Current Setup)

```
# Connection string format
postgresql://user:pass@ep-xxx-yyy-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require

# The "-pooler" in the hostname activates Neon's PgBouncer
# Neon runs PgBouncer in transaction mode by default
```

**Pros**:
- Zero setup. Built into Neon.
- Handles serverless connection storms automatically.
- Scales with Neon's infrastructure.

**Cons**:
- Limited configuration (can't tune pool_mode, max_client_conn, etc.).
- Adds slight latency (~1-3ms) per query due to proxy hop.
- Transaction mode means no prepared statements across transactions (Prisma handles this).

### Option 2: Prisma Accelerate / Data Proxy

```typescript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")         // Direct for migrations
  directUrl = env("DIRECT_DATABASE_URL")  // Direct connection
}

// Prisma uses connection pooling internally
// Default pool size = num_physical_cpus * 2 + 1
// For serverless, this needs tuning:
```

```
# .env
DATABASE_URL="postgresql://...?connection_limit=5&pool_timeout=10"
```

**Prisma pool parameters**:
- `connection_limit` — max connections this Prisma instance opens. For serverless, keep LOW (3-5).
- `pool_timeout` — seconds to wait for a connection from the pool before erroring.

### Option 3: PgBouncer (Self-Hosted)

```ini
# pgbouncer.ini
[databases]
stoneai = host=neon-host port=5432 dbname=neondb

[pgbouncer]
listen_addr = 0.0.0.0
listen_port = 6432
auth_type = md5
pool_mode = transaction
max_client_conn = 1000
default_pool_size = 20
min_pool_size = 5
reserve_pool_size = 5
reserve_pool_timeout = 3
server_idle_timeout = 300
server_lifetime = 3600
```

**Pool modes explained**:
- `session` — client owns a server connection for its entire session. Safest. Least efficient.
- `transaction` — client gets a server connection only during a transaction. Recommended for web apps.
- `statement` — client gets a connection per statement. Most efficient but breaks multi-statement transactions. Not compatible with Prisma.

### Recommended Setup for Stone AI (Vercel + Neon)

```
Vercel Function → Prisma (connection_limit=3) → Neon Pooler (PgBouncer) → Neon PostgreSQL

# .env.production
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require&connection_limit=3&pool_timeout=10"
DIRECT_DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

**Why this works**:
- Each Vercel function instance keeps at most 3 connections.
- Neon pooler handles multiplexing hundreds of function instances into ~20 actual PostgreSQL connections.
- `DIRECT_DATABASE_URL` is used for migrations only (needs direct connection for DDL).

### Connection Pool Monitoring

```sql
-- Current connections by state
SELECT state, COUNT(*)
FROM pg_stat_activity
WHERE datname = 'neondb'
GROUP BY state;

-- Connections by application
SELECT application_name, COUNT(*), state
FROM pg_stat_activity
WHERE datname = 'neondb'
GROUP BY application_name, state
ORDER BY COUNT(*) DESC;

-- Waiting connections (pool exhaustion indicator)
SELECT COUNT(*)
FROM pg_stat_activity
WHERE wait_event_type = 'Client'
  AND state = 'idle in transaction';
```

---

## 5. Chat Route Optimization — 6 Queries Per Request

A typical chat message request in Stone AI hits these queries:

```
1. Auth check      → SELECT user WHERE clerkId = ?           (~1ms)
2. Subscription    → SELECT subscription WHERE userId = ?     (~1ms)
3. Agent lookup    → SELECT agent WHERE id = ?                (~1ms)
4. Conversation    → SELECT conversation WHERE id = ? AND userId = ?  (~1ms)
5. History         → SELECT messages WHERE convId = ? ORDER BY created LIMIT 20  (~3-15ms)
6. Save message    → INSERT INTO message (...)                (~2-5ms)
7. Save response   → INSERT INTO message (...)                (~2-5ms)
```

**Total: 7 queries, ~10-30ms database time per chat message.**

### Optimization Strategy 1: Combine Auth + Subscription + Agent

```typescript
// BEFORE: 3 separate queries
const user = await prisma.user.findUnique({ where: { clerkId } });
const sub = await prisma.subscription.findFirst({ where: { userId: user.id, status: 'active' } });
const agent = await prisma.agent.findUnique({ where: { id: agentId } });

// AFTER: 1 query with joins
const userData = await prisma.user.findUnique({
  where: { clerkId },
  select: {
    id: true,
    tier: true,
    subscriptions: {
      where: { status: 'active' },
      select: { tier: true, expiresAt: true },
      take: 1,
    },
  },
});
// Agent lookup can run in parallel since it doesn't depend on user
const agent = await prisma.agent.findUnique({
  where: { id: agentId },
  select: { id: true, name: true, systemPrompt: true, tier: true },
});
```

### Optimization Strategy 2: Parallel Queries with Promise.all

```typescript
// Run independent queries in parallel
const [userData, agent, conversation] = await Promise.all([
  prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      tier: true,
      subscriptions: {
        where: { status: 'active' },
        select: { tier: true },
        take: 1,
      },
    },
  }),
  prisma.agent.findUnique({
    where: { id: agentId },
    select: { id: true, name: true, systemPrompt: true, tier: true },
  }),
  prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, userId: true },
  }),
]);

// Sequential: only after we have conversationId confirmed
const history = await prisma.message.findMany({
  where: { conversationId },
  orderBy: { createdAt: 'desc' },
  take: 20,
  select: { role: true, content: true },
});
```

**Result: 4 round trips → 2 round trips (parallel group + history).**

### Optimization Strategy 3: Cached User Context

```typescript
// Cache user+subscription data for the duration of a session
// Redis or in-memory cache with 5-minute TTL
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getCachedUserContext(clerkId: string) {
  const cacheKey = `user:ctx:${clerkId}`;
  const cached = await redis.get(cacheKey);

  if (cached) return JSON.parse(cached);

  const userData = await prisma.user.findUnique({
    where: { clerkId },
    select: {
      id: true,
      tier: true,
      subscriptions: {
        where: { status: 'active' },
        select: { tier: true, expiresAt: true },
        take: 1,
      },
    },
  });

  await redis.setex(cacheKey, 300, JSON.stringify(userData)); // 5 min TTL
  return userData;
}

// Now auth + subscription is 0 DB queries on cache hit
```

### Optimization Strategy 4: Batch Insert Messages

```typescript
// BEFORE: 2 separate inserts
await prisma.message.create({ data: { role: 'user', content: userMsg, conversationId } });
// ... AI response ...
await prisma.message.create({ data: { role: 'assistant', content: aiMsg, conversationId } });

// AFTER: Single transaction with both inserts
await prisma.$transaction([
  prisma.message.create({ data: { role: 'user', content: userMsg, conversationId } }),
  prisma.message.create({ data: { role: 'assistant', content: aiMsg, conversationId } }),
  prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  }),
]);
// 1 round trip instead of 3
```

### Optimized Chat Route — Final Shape

```
Before: 7 queries, 7 round trips, ~30ms DB time
After:
  Round trip 1: Promise.all([userCtx (cached=0ms), agent, conversation])  → ~2ms
  Round trip 2: message history                                           → ~3ms
  Round trip 3: $transaction([insert user msg, insert ai msg, update conv]) → ~3ms
  Total: 3 round trips, ~8ms DB time
```

---

## 6. pg_stat_statements — Finding Your Worst Queries

### Enabling It

```sql
-- Check if already enabled (Neon enables it by default)
SELECT * FROM pg_available_extensions WHERE name = 'pg_stat_statements';

-- Enable if needed
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
```

### Top Queries by Total Time

```sql
SELECT
  SUBSTRING(query, 1, 100) AS short_query,
  calls,
  ROUND(total_exec_time::numeric, 2) AS total_ms,
  ROUND(mean_exec_time::numeric, 2) AS avg_ms,
  ROUND(max_exec_time::numeric, 2) AS max_ms,
  rows,
  ROUND((shared_blks_hit::numeric / NULLIF(shared_blks_hit + shared_blks_read, 0)) * 100, 2) AS cache_hit_pct
FROM pg_stat_statements
WHERE dbid = (SELECT oid FROM pg_database WHERE datname = 'neondb')
ORDER BY total_exec_time DESC
LIMIT 20;
```

### Queries with Worst Cache Hit Ratio

```sql
SELECT
  SUBSTRING(query, 1, 120) AS query,
  calls,
  shared_blks_hit,
  shared_blks_read,
  ROUND((shared_blks_hit::numeric / NULLIF(shared_blks_hit + shared_blks_read, 0)) * 100, 2) AS hit_pct
FROM pg_stat_statements
WHERE shared_blks_read > 100
ORDER BY hit_pct ASC
LIMIT 10;
```

**What to look for**:
- Queries with high `total_exec_time` but low `calls` → individually slow queries, need index work.
- Queries with high `calls` and moderate `mean_exec_time` → hot path queries, even small optimizations multiply.
- Queries with `cache_hit_pct` < 95% → working set exceeds shared_buffers or index bloat.

### Queries with High Row Estimates vs Actual

```sql
-- Queries that return way more rows than expected (bad statistics)
SELECT
  SUBSTRING(query, 1, 100),
  calls,
  rows / NULLIF(calls, 0) AS rows_per_call,
  ROUND(mean_exec_time::numeric, 2) AS avg_ms
FROM pg_stat_statements
WHERE rows / NULLIF(calls, 0) > 1000
ORDER BY rows DESC
LIMIT 10;
```

### Reset Statistics (After Optimization Round)

```sql
-- Reset to measure impact of changes
SELECT pg_stat_statements_reset();
```

---

## 7. VACUUM Tuning

### How VACUUM Works

PostgreSQL uses MVCC (Multi-Version Concurrency Control). When you UPDATE or DELETE a row, the old version remains on disk until VACUUM cleans it up. Without VACUUM, tables bloat indefinitely.

### Autovacuum Configuration

```sql
-- Check current autovacuum settings
SELECT name, setting
FROM pg_settings
WHERE name LIKE 'autovacuum%';
```

**Default settings and when to change them**:

```sql
-- For the Message table (high write volume):
ALTER TABLE "Message" SET (
  autovacuum_vacuum_threshold = 1000,        -- default 50. Start vacuum after 1000 dead tuples
  autovacuum_vacuum_scale_factor = 0.05,     -- default 0.2. Vacuum when 5% of rows are dead (not 20%)
  autovacuum_analyze_threshold = 500,         -- default 50. Analyze after 500 changes
  autovacuum_analyze_scale_factor = 0.02,     -- default 0.1. Analyze at 2% change rate
  autovacuum_vacuum_cost_delay = 10           -- default 2ms on Neon. Slightly slower to reduce I/O impact
);

-- For the Conversation table (moderate writes, frequent reads):
ALTER TABLE "Conversation" SET (
  autovacuum_vacuum_scale_factor = 0.1,
  autovacuum_analyze_scale_factor = 0.05
);
```

**The formula**: Autovacuum triggers when `dead tuples > threshold + scale_factor * table_size`.
- Default: 50 + 0.2 * 1,000,000 = 200,050 dead tuples before vacuum. That is way too many for a hot table.
- Tuned: 1000 + 0.05 * 1,000,000 = 51,000 dead tuples. Vacuums 4x more often.

### Monitoring Vacuum Activity

```sql
-- Tables that need vacuum most urgently
SELECT
  schemaname || '.' || relname AS table,
  n_dead_tup,
  n_live_tup,
  ROUND(n_dead_tup::numeric / NULLIF(n_live_tup, 0) * 100, 2) AS dead_pct,
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- Check if autovacuum is keeping up
SELECT
  relname,
  n_dead_tup,
  last_autovacuum,
  EXTRACT(EPOCH FROM (NOW() - last_autovacuum)) / 3600 AS hours_since_vacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 5000
ORDER BY n_dead_tup DESC;
```

### Table Bloat Detection

```sql
-- Estimate bloat percentage
SELECT
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename) - pg_relation_size(schemaname || '.' || tablename)) AS index_and_toast_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
LIMIT 10;
```

### Emergency: Manual VACUUM

```sql
-- Standard vacuum (reclaims space, updates visibility map)
VACUUM (VERBOSE) "Message";

-- VACUUM ANALYZE (vacuum + update planner statistics)
VACUUM (ANALYZE, VERBOSE) "Message";

-- VACUUM FULL (rewrites entire table, reclaims disk space, takes ACCESS EXCLUSIVE lock)
-- WARNING: Blocks ALL reads and writes. Only use during maintenance windows.
VACUUM FULL "Message";
```

---

## 8. Table Partitioning for Messages

The Message table is the highest-volume table in any chat application. At scale, a single monolithic table degrades in every dimension: queries slow down, indexes grow, VACUUM takes longer, backups bloat.

### Range Partitioning by Month

```sql
-- Create the partitioned parent table
CREATE TABLE "Message" (
  id TEXT NOT NULL DEFAULT gen_random_uuid(),
  "conversationId" TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "isRead" BOOLEAN DEFAULT false,
  "userId" TEXT,
  metadata JSONB,
  PRIMARY KEY (id, "createdAt")  -- partition key MUST be in primary key
) PARTITION BY RANGE ("createdAt");

-- Create monthly partitions
CREATE TABLE message_2026_01 PARTITION OF "Message"
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

CREATE TABLE message_2026_02 PARTITION OF "Message"
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');

CREATE TABLE message_2026_03 PARTITION OF "Message"
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- Each partition gets its own indexes (automatically or manually)
CREATE INDEX idx_msg_2026_03_conv_created
  ON message_2026_03 ("conversationId", "createdAt" DESC);
```

### Partition Pruning in Action

```sql
-- PostgreSQL automatically prunes partitions it doesn't need
EXPLAIN (ANALYZE)
SELECT * FROM "Message"
WHERE "conversationId" = 'clxyz123'
  AND "createdAt" >= '2026-03-01'
  AND "createdAt" < '2026-04-01';

-- Output will show:
--   ->  Index Scan on message_2026_03  (only this partition scanned)
-- Partitions 2026_01, 2026_02 are pruned entirely
```

### Automating Partition Creation

```sql
-- Function to create next month's partition automatically
CREATE OR REPLACE FUNCTION create_monthly_partition()
RETURNS void AS $$
DECLARE
  next_month DATE := DATE_TRUNC('month', NOW() + INTERVAL '1 month');
  partition_name TEXT := 'message_' || TO_CHAR(next_month, 'YYYY_MM');
  start_date TEXT := TO_CHAR(next_month, 'YYYY-MM-DD');
  end_date TEXT := TO_CHAR(next_month + INTERVAL '1 month', 'YYYY-MM-DD');
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relname = partition_name
  ) THEN
    EXECUTE FORMAT(
      'CREATE TABLE %I PARTITION OF "Message" FOR VALUES FROM (%L) TO (%L)',
      partition_name, start_date, end_date
    );
    RAISE NOTICE 'Created partition: %', partition_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Run monthly via pg_cron or application scheduler
SELECT create_monthly_partition();
```

### Prisma Compatibility Note

Prisma does not natively support PostgreSQL partitioning syntax. You need to manage partitions via raw SQL migrations:

```typescript
// prisma/migrations/YYYYMMDD_partition_messages/migration.sql
-- This is a raw SQL migration, not generated by Prisma

-- 1. Rename existing table
ALTER TABLE "Message" RENAME TO "Message_old";

-- 2. Create partitioned table with same schema
CREATE TABLE "Message" (
  -- ... columns ...
) PARTITION BY RANGE ("createdAt");

-- 3. Create partitions
CREATE TABLE message_2026_01 PARTITION OF "Message" ...;
-- etc.

-- 4. Migrate data
INSERT INTO "Message" SELECT * FROM "Message_old";

-- 5. Drop old table
DROP TABLE "Message_old";
```

### When to Partition

| Table Size | Rows | Partition? |
|-----------|------|-----------|
| < 1 GB | < 5M | No. Good indexes are sufficient. |
| 1-10 GB | 5-50M | Maybe. If queries always filter by date range. |
| > 10 GB | > 50M | Yes. Maintenance and query performance degrade. |

---

## 9. Materialized Views

### When to Use

Materialized views are pre-computed query results stored as tables. They trade write-time computation for read-time speed. Perfect for dashboards, analytics, and aggregations that don't need real-time data.

### Example: Agent Usage Dashboard

```sql
-- Materialized view: daily agent usage stats
CREATE MATERIALIZED VIEW mv_agent_daily_stats AS
SELECT
  a.id AS agent_id,
  a.name AS agent_name,
  a.tier,
  DATE_TRUNC('day', m."createdAt") AS day,
  COUNT(DISTINCT m."conversationId") AS conversations,
  COUNT(*) FILTER (WHERE m.role = 'user') AS user_messages,
  COUNT(*) FILTER (WHERE m.role = 'assistant') AS assistant_messages,
  AVG(LENGTH(m.content)) FILTER (WHERE m.role = 'assistant') AS avg_response_length
FROM "Agent" a
JOIN "Conversation" c ON c."agentId" = a.id
JOIN "Message" m ON m."conversationId" = c.id
WHERE m."createdAt" >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY a.id, a.name, a.tier, DATE_TRUNC('day', m."createdAt")
WITH DATA;

-- Index the materialized view for fast lookups
CREATE UNIQUE INDEX idx_mv_agent_daily ON mv_agent_daily_stats (agent_id, day);
CREATE INDEX idx_mv_agent_daily_tier ON mv_agent_daily_stats (tier, day);

-- Query the materialized view (instant, no joins)
SELECT agent_name, SUM(conversations), SUM(user_messages)
FROM mv_agent_daily_stats
WHERE day >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY agent_name
ORDER BY SUM(conversations) DESC;
```

### Example: User Tier Distribution

```sql
CREATE MATERIALIZED VIEW mv_tier_distribution AS
SELECT
  COALESCE(s.tier, 'FREE') AS tier,
  COUNT(DISTINCT u.id) AS user_count,
  COUNT(DISTINCT c.id) AS total_conversations,
  COUNT(DISTINCT m.id) AS total_messages,
  ROUND(AVG(msg_count.cnt), 1) AS avg_messages_per_user
FROM "User" u
LEFT JOIN "Subscription" s ON s."userId" = u.id AND s.status = 'active'
LEFT JOIN "Conversation" c ON c."userId" = u.id
LEFT JOIN "Message" m ON m."conversationId" = c.id
LEFT JOIN LATERAL (
  SELECT COUNT(*) AS cnt
  FROM "Message" m2
  JOIN "Conversation" c2 ON m2."conversationId" = c2.id
  WHERE c2."userId" = u.id
) msg_count ON true
GROUP BY COALESCE(s.tier, 'FREE')
WITH DATA;
```

### Refreshing Materialized Views

```sql
-- Standard refresh (blocks reads during refresh)
REFRESH MATERIALIZED VIEW mv_agent_daily_stats;

-- Concurrent refresh (no read blocking, requires unique index)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_agent_daily_stats;
```

```typescript
// Schedule refresh in your application (e.g., cron job)
// Every 15 minutes for dashboard stats
async function refreshMaterializedViews() {
  await prisma.$executeRaw`
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_agent_daily_stats;
  `;
  await prisma.$executeRaw`
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tier_distribution;
  `;
}
```

### Materialized View Anti-Patterns

- Do not use for data that must be real-time (use regular queries + good indexes instead).
- Do not create materialized views on small tables — the overhead of REFRESH is not worth it.
- Do not forget the CONCURRENTLY keyword in production — standard REFRESH locks readers.
- Do not skip the unique index — CONCURRENTLY requires one.

---

## 10. CTEs vs Subqueries — Performance Reality

### Common Misconception

Many developers believe CTEs are "optimized away" like subqueries. In PostgreSQL 11 and earlier, CTEs were **optimization fences** — the planner could not push predicates into them. PostgreSQL 12+ changed this for non-recursive CTEs — they are now inlined by default.

### When CTEs and Subqueries Are Equivalent (PG 12+)

```sql
-- These produce identical execution plans in PG 12+:

-- CTE version
WITH active_users AS (
  SELECT u.id, u.name
  FROM "User" u
  JOIN "Subscription" s ON s."userId" = u.id
  WHERE s.status = 'active' AND s.tier = 'PRO'
)
SELECT au.name, COUNT(c.id) AS conversations
FROM active_users au
JOIN "Conversation" c ON c."userId" = au.id
GROUP BY au.name;

-- Subquery version
SELECT au.name, COUNT(c.id) AS conversations
FROM (
  SELECT u.id, u.name
  FROM "User" u
  JOIN "Subscription" s ON s."userId" = u.id
  WHERE s.status = 'active' AND s.tier = 'PRO'
) au
JOIN "Conversation" c ON c."userId" = au.id
GROUP BY au.name;
```

### When CTEs Are Better

```sql
-- 1. Referenced multiple times — CTE computes once, subquery would compute each time
WITH user_stats AS (
  SELECT "userId", COUNT(*) AS msg_count, MAX("createdAt") AS last_active
  FROM "Message"
  GROUP BY "userId"
)
SELECT
  u.name,
  us.msg_count,
  us.last_active,
  CASE
    WHEN us.msg_count > 100 THEN 'power'
    WHEN us.msg_count > 10 THEN 'active'
    ELSE 'casual'
  END AS user_type
FROM "User" u
JOIN user_stats us ON us."userId" = u.id
WHERE us.msg_count > 0
ORDER BY us.msg_count DESC;

-- 2. Recursive CTEs (subqueries cannot do this)
WITH RECURSIVE thread AS (
  SELECT id, "parentId", content, 1 AS depth
  FROM "ForumPost"
  WHERE id = 'root-post-id'

  UNION ALL

  SELECT fp.id, fp."parentId", fp.content, t.depth + 1
  FROM "ForumPost" fp
  JOIN thread t ON fp."parentId" = t.id
  WHERE t.depth < 10
)
SELECT * FROM thread ORDER BY depth;
```

### When Subqueries Are Better

```sql
-- EXISTS subqueries are extremely efficient — PostgreSQL short-circuits
-- This is faster than a JOIN when you only need existence check
SELECT u.id, u.name
FROM "User" u
WHERE EXISTS (
  SELECT 1 FROM "Conversation" c
  WHERE c."userId" = u.id
  AND c."createdAt" >= CURRENT_DATE - INTERVAL '7 days'
);

-- Correlated subqueries in SELECT (when you need one scalar per row)
SELECT
  u.id,
  u.name,
  (SELECT COUNT(*) FROM "Conversation" c WHERE c."userId" = u.id) AS conv_count,
  (SELECT MAX(m."createdAt")
   FROM "Message" m
   JOIN "Conversation" c ON m."conversationId" = c.id
   WHERE c."userId" = u.id) AS last_message_at
FROM "User" u
WHERE u."createdAt" >= '2026-01-01';
```

### Forcing CTE Materialization (When Needed)

```sql
-- If the planner inlines your CTE but you WANT it materialized
-- (e.g., the CTE result is expensive and used multiple times)
WITH expensive_calc AS MATERIALIZED (
  SELECT "agentId", AVG(response_time_ms) AS avg_rt
  FROM "AgentMetrics"
  WHERE "createdAt" >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY "agentId"
)
SELECT * FROM expensive_calc WHERE avg_rt > 500
UNION ALL
SELECT * FROM expensive_calc WHERE avg_rt <= 100;
```

---

## 11. Advanced Query Patterns for SaaS

### Cursor-Based Pagination (Better Than OFFSET)

```sql
-- OFFSET-based (BAD for deep pages — scans and discards rows)
SELECT * FROM "Message"
WHERE "conversationId" = 'abc'
ORDER BY "createdAt" DESC
LIMIT 20 OFFSET 10000;  -- scans 10,020 rows, returns 20

-- Cursor-based (GOOD — always fast regardless of page depth)
SELECT * FROM "Message"
WHERE "conversationId" = 'abc'
  AND "createdAt" < '2026-03-08T15:30:00Z'  -- cursor from last item
ORDER BY "createdAt" DESC
LIMIT 20;  -- scans exactly 20 rows via index
```

```typescript
// Prisma cursor pagination
const messages = await prisma.message.findMany({
  where: { conversationId: convId },
  orderBy: { createdAt: 'desc' },
  take: 20,
  ...(cursor && {
    cursor: { id: cursor },
    skip: 1, // skip the cursor item itself
  }),
});
```

### Efficient Upsert Pattern

```sql
-- Prisma upsert generates suboptimal SQL. For high-throughput upserts, use raw:
INSERT INTO "UserPreference" ("userId", key, value, "updatedAt")
VALUES ($1, $2, $3, NOW())
ON CONFLICT ("userId", key)
DO UPDATE SET
  value = EXCLUDED.value,
  "updatedAt" = NOW()
WHERE "UserPreference".value IS DISTINCT FROM EXCLUDED.value;
-- The WHERE clause prevents unnecessary writes when value hasn't changed
```

### Efficient Count Estimates

```sql
-- Exact COUNT(*) is expensive on large tables (full seq scan or index scan)
SELECT COUNT(*) FROM "Message";  -- scans entire table

-- Fast approximate count (off by ~1% but instant)
SELECT reltuples::bigint AS estimate
FROM pg_class
WHERE relname = 'Message';

-- Use exact count for small result sets, approximate for UI "total" displays
```

### Advisory Locks for Rate Limiting

```sql
-- Instead of SELECT FOR UPDATE (blocks row), use advisory locks
-- Lock is on an arbitrary bigint key (e.g., hash of userId)
SELECT pg_try_advisory_xact_lock(hashtext('user:' || $1));
-- Returns true if lock acquired, false if another transaction holds it
-- Lock is released at end of transaction
```

```typescript
// In Prisma
const [{ pg_try_advisory_xact_lock: acquired }] = await prisma.$queryRaw`
  SELECT pg_try_advisory_xact_lock(hashtext('ratelimit:' || ${userId}))
`;
if (!acquired) {
  throw new Error('Rate limit exceeded');
}
```

---

## 12. Monitoring Queries to Run Weekly

### Full Health Check Script

```sql
-- 1. Table sizes
SELECT
  relname AS table,
  pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
  pg_size_pretty(pg_relation_size(relid)) AS data_size,
  n_live_tup AS live_rows,
  n_dead_tup AS dead_rows
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- 2. Index usage ratio (should be >95% for OLTP)
SELECT
  ROUND(
    SUM(idx_blks_hit)::numeric / NULLIF(SUM(idx_blks_hit + idx_blks_read), 0) * 100,
    2
  ) AS index_cache_hit_pct,
  ROUND(
    SUM(heap_blks_hit)::numeric / NULLIF(SUM(heap_blks_hit + heap_blks_read), 0) * 100,
    2
  ) AS table_cache_hit_pct
FROM pg_statio_user_tables;

-- 3. Long-running queries (potential locks)
SELECT
  pid,
  NOW() - pg_stat_activity.query_start AS duration,
  query,
  state,
  wait_event_type,
  wait_event
FROM pg_stat_activity
WHERE (NOW() - pg_stat_activity.query_start) > INTERVAL '30 seconds'
  AND state != 'idle'
ORDER BY duration DESC;

-- 4. Lock contention
SELECT
  blocked_locks.pid AS blocked_pid,
  blocking_locks.pid AS blocking_pid,
  blocked_activity.query AS blocked_query,
  blocking_activity.query AS blocking_query
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks
  ON blocking_locks.locktype = blocked_locks.locktype
  AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
  AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
  AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
  AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
  AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
  AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
  AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
  AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
  AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
  AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- 5. Replication lag (if using read replicas)
SELECT
  client_addr,
  state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  pg_wal_lsn_diff(sent_lsn, replay_lsn) AS replication_lag_bytes
FROM pg_stat_replication;
```

---

## 13. PostgreSQL Configuration Tuning

These settings matter most for SaaS workloads. On Neon, most are managed, but understanding them helps diagnose issues and optimize self-hosted deployments.

```
# Memory
shared_buffers = '256MB'           # 25% of available RAM (Neon manages this)
effective_cache_size = '768MB'     # 75% of available RAM (hint to planner)
work_mem = '16MB'                  # Per-operation sort/hash memory. Increase for complex queries.
maintenance_work_mem = '128MB'     # For VACUUM, CREATE INDEX. Can be higher.

# WAL
wal_buffers = '16MB'               # Usually auto-tuned
checkpoint_completion_target = 0.9 # Spread checkpoint I/O over 90% of interval

# Planner
random_page_cost = 1.1             # SSD storage (default 4.0 is for spinning disks)
effective_io_concurrency = 200     # SSD can handle parallel I/O
default_statistics_target = 200    # More histogram buckets for better estimates (default 100)

# Connections
max_connections = 100              # With pooling, this can be low
idle_in_transaction_session_timeout = '30s'  # Kill abandoned transactions
statement_timeout = '30s'          # No query should run >30s in a web app

# Logging
log_min_duration_statement = 100   # Log queries slower than 100ms
log_statement = 'none'             # Don't log all statements in production
log_lock_waits = on                # Log when queries wait for locks >1s
```

---

## 14. Quick Reference — Decision Matrix

| Situation | Solution |
|-----------|----------|
| Query scans too many rows | Add composite index (equality cols first, range/sort last) |
| Query only targets subset of rows | Partial index with WHERE clause |
| WHERE clause uses function | Expression index matching the function |
| N+1 queries in Prisma | Use `include`/`select` or `$queryRaw` with JOINs |
| Too many connections | Neon pooler + Prisma `connection_limit=3` |
| Dashboard is slow | Materialized view, refresh every 15 min |
| Deep pagination is slow | Switch to cursor-based pagination |
| Table > 10GB | Partition by month on createdAt |
| Dead tuples accumulating | Tune autovacuum scale_factor down for hot tables |
| Unknown slow queries | pg_stat_statements ordered by total_exec_time |
| Cache hit ratio < 95% | Increase shared_buffers or fix index bloat |
| OFFSET 10000 in API | Replace with keyset/cursor pagination |
| COUNT(*) on large table | Use pg_class.reltuples for estimates |
| Frequent upserts | ON CONFLICT with IS DISTINCT FROM guard |
| Multiple independent queries | Promise.all in application code |

---

## 15. Prisma-Specific Performance Patterns

### Raw Queries When Prisma Generates Bad SQL

```typescript
// Prisma's aggregations can generate suboptimal SQL
// When performance matters, drop to raw SQL:
const stats = await prisma.$queryRaw<AgentStat[]>`
  SELECT
    a.id,
    a.name,
    COUNT(DISTINCT c.id) AS conversation_count,
    COUNT(m.id) FILTER (WHERE m."createdAt" >= NOW() - INTERVAL '24 hours') AS messages_today
  FROM "Agent" a
  LEFT JOIN "Conversation" c ON c."agentId" = a.id
  LEFT JOIN "Message" m ON m."conversationId" = c.id
  WHERE a.tier <= ${userTier}
  GROUP BY a.id, a.name
  ORDER BY conversation_count DESC
`;
```

### Interactive Transaction Timeout

```typescript
// Set timeout on interactive transactions to prevent locks
const result = await prisma.$transaction(
  async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } });
    // ... complex logic ...
    return tx.user.update({ where: { id: userId }, data: { ... } });
  },
  {
    maxWait: 5000,  // Max time to wait for a connection from pool
    timeout: 10000, // Max time the transaction can run
    isolationLevel: 'ReadCommitted', // Default; use Serializable only when needed
  }
);
```

### Prisma Logging in Production

```typescript
// Structured logging for query performance tracking
const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

prisma.$on('query', (e) => {
  if (e.duration > 100) {
    logger.warn('Slow query detected', {
      query: e.query.substring(0, 200),
      duration: e.duration,
      params: e.params,
      timestamp: new Date().toISOString(),
    });
  }
});
```

---

*This seed covers the core PostgreSQL optimization patterns for a SaaS chat platform. Every technique here has been validated against real EXPLAIN ANALYZE output and real-world SaaS workloads. When in doubt: measure first with EXPLAIN ANALYZE, then optimize.*
