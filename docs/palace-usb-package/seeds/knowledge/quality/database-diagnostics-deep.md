# Database Diagnostics Deep Dive

> Computer Wiz Quality Seed — PostgreSQL Performance Analysis & Neon-Specific Diagnostics

## Purpose

The database is the heartbeat of Stone AI. When queries slow down, everything downstream suffers — agent responses lag, chat feels broken, billing fails silently. This seed gives Wiz the tools to diagnose PostgreSQL performance issues at every level: from individual query analysis to system-wide lock contention, vacuum tuning, and Neon-specific operational patterns.

---

## 1. PostgreSQL Slow Query Analysis

### Enabling Query Logging

```sql
-- Show current settings
SHOW log_min_duration_statement;
SHOW log_statement;

-- Log all queries taking > 500ms
ALTER SYSTEM SET log_min_duration_statement = 500;

-- Log all queries (for debugging only — high overhead)
ALTER SYSTEM SET log_statement = 'all';

-- Apply changes
SELECT pg_reload_conf();
```

### Using EXPLAIN ANALYZE

```sql
-- Basic explain
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';

-- Full analysis with actual execution
EXPLAIN (ANALYZE, BUFFERS, TIMING, FORMAT JSON)
SELECT u.*, COUNT(c.id) as chat_count
FROM "User" u
LEFT JOIN "Chat" c ON c."userId" = u.id
WHERE u."createdAt" > NOW() - INTERVAL '30 days'
GROUP BY u.id
ORDER BY chat_count DESC
LIMIT 20;
```

### Reading EXPLAIN Output

```
Key fields to examine:

Seq Scan: Full table scan — usually bad for large tables
  → Fix: Add appropriate index

Index Scan: Using index — good
Index Only Scan: Returning data from index alone — best

Nested Loop: O(n*m) — fine for small result sets, bad for large
  → Watch for: inner loop doing Seq Scan

Hash Join: Good for medium-to-large joins
Merge Join: Good when both sides are sorted

Sort: External sort means data doesn't fit in work_mem
  → Fix: Increase work_mem or add index matching ORDER BY

Bitmap Heap Scan: Hybrid — uses index bitmap then heap
  → Watch for: "lossy" means too many rows for bitmap in work_mem
```

### Cost Analysis

```sql
-- Understanding costs
-- cost=0.00..35.50 rows=10 width=244
--   0.00 = startup cost (before first row)
--   35.50 = total cost (arbitrary units, relative)
--   rows=10 = estimated row count
--   width=244 = estimated avg row size in bytes

-- When actual vs estimated rows differ significantly:
-- PROBLEM: Statistics are stale
-- FIX:
ANALYZE "User";  -- Update statistics for one table
ANALYZE;          -- Update all tables
```

### Query Pattern Anti-Patterns

```sql
-- ANTI-PATTERN 1: SELECT * when you only need a few columns
-- BAD:
SELECT * FROM "User" WHERE "subscriptionTier" = 'PRO';
-- GOOD:
SELECT id, email, "displayName" FROM "User" WHERE "subscriptionTier" = 'PRO';

-- ANTI-PATTERN 2: N+1 queries
-- BAD (in application code):
--   users = SELECT * FROM "User" LIMIT 100;
--   for each user: SELECT * FROM "Chat" WHERE "userId" = user.id;
-- GOOD:
SELECT u.id, u.email, c.id as chat_id, c.title
FROM "User" u
LEFT JOIN "Chat" c ON c."userId" = u.id
LIMIT 100;

-- ANTI-PATTERN 3: Functions on indexed columns
-- BAD (can't use index):
SELECT * FROM "User" WHERE LOWER(email) = 'test@example.com';
-- GOOD (if you have a functional index):
CREATE INDEX idx_user_email_lower ON "User" (LOWER(email));

-- ANTI-PATTERN 4: Leading wildcard LIKE
-- BAD (can't use btree index):
SELECT * FROM "User" WHERE email LIKE '%@gmail.com';
-- GOOD (use trigram index):
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX idx_user_email_trgm ON "User" USING gin (email gin_trgm_ops);

-- ANTI-PATTERN 5: Unbounded queries
-- BAD:
SELECT * FROM "Message" WHERE "chatId" = $1;
-- GOOD:
SELECT * FROM "Message" WHERE "chatId" = $1 ORDER BY "createdAt" DESC LIMIT 50;
```

---

## 2. pg_stat_statements

### Setup and Configuration

```sql
-- Enable the extension (Neon has this available)
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Configuration
ALTER SYSTEM SET pg_stat_statements.max = 5000;
ALTER SYSTEM SET pg_stat_statements.track = 'top';  -- or 'all' for nested
ALTER SYSTEM SET pg_stat_statements.track_utility = on;
SELECT pg_reload_conf();
```

### Essential Queries

```sql
-- Top 10 queries by total time
SELECT
  queryid,
  LEFT(query, 100) as query_preview,
  calls,
  ROUND(total_exec_time::numeric, 2) as total_ms,
  ROUND(mean_exec_time::numeric, 2) as avg_ms,
  ROUND(max_exec_time::numeric, 2) as max_ms,
  ROUND(stddev_exec_time::numeric, 2) as stddev_ms,
  rows,
  ROUND((100.0 * total_exec_time / SUM(total_exec_time) OVER())::numeric, 2) as pct_total
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;

-- Top 10 by average time (find slow individual queries)
SELECT
  LEFT(query, 100) as query_preview,
  calls,
  ROUND(mean_exec_time::numeric, 2) as avg_ms,
  ROUND(max_exec_time::numeric, 2) as max_ms,
  rows / NULLIF(calls, 0) as avg_rows
FROM pg_stat_statements
WHERE calls > 10  -- Filter noise
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Queries with high variance (inconsistent performance)
SELECT
  LEFT(query, 100) as query_preview,
  calls,
  ROUND(mean_exec_time::numeric, 2) as avg_ms,
  ROUND(stddev_exec_time::numeric, 2) as stddev_ms,
  ROUND((stddev_exec_time / NULLIF(mean_exec_time, 0))::numeric, 2) as coefficient_of_variation
FROM pg_stat_statements
WHERE calls > 50
ORDER BY stddev_exec_time / NULLIF(mean_exec_time, 0) DESC NULLS LAST
LIMIT 10;

-- Cache hit ratio per query
SELECT
  LEFT(query, 100) as query_preview,
  calls,
  shared_blks_hit,
  shared_blks_read,
  ROUND(
    (shared_blks_hit::numeric / NULLIF(shared_blks_hit + shared_blks_read, 0)) * 100,
    2
  ) as cache_hit_pct
FROM pg_stat_statements
WHERE shared_blks_hit + shared_blks_read > 100
ORDER BY cache_hit_pct ASC
LIMIT 10;

-- Reset stats (do this periodically to get fresh data)
SELECT pg_stat_statements_reset();
```

### Tracking Query Performance Over Time

```sql
-- Create a snapshots table
CREATE TABLE IF NOT EXISTS query_perf_snapshots (
  id SERIAL PRIMARY KEY,
  snapshot_time TIMESTAMPTZ DEFAULT NOW(),
  queryid BIGINT,
  query_preview TEXT,
  calls BIGINT,
  total_exec_time DOUBLE PRECISION,
  mean_exec_time DOUBLE PRECISION,
  max_exec_time DOUBLE PRECISION,
  rows BIGINT
);

-- Take periodic snapshots
INSERT INTO query_perf_snapshots (queryid, query_preview, calls, total_exec_time, mean_exec_time, max_exec_time, rows)
SELECT
  queryid,
  LEFT(query, 200),
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time,
  rows
FROM pg_stat_statements
WHERE calls > 10;

-- Compare snapshots to find regressions
SELECT
  n.query_preview,
  o.mean_exec_time as old_avg_ms,
  n.mean_exec_time as new_avg_ms,
  ROUND(((n.mean_exec_time - o.mean_exec_time) / NULLIF(o.mean_exec_time, 0) * 100)::numeric, 1) as pct_change
FROM query_perf_snapshots n
JOIN query_perf_snapshots o ON n.queryid = o.queryid
WHERE n.snapshot_time = (SELECT MAX(snapshot_time) FROM query_perf_snapshots)
  AND o.snapshot_time = (SELECT MIN(snapshot_time) FROM query_perf_snapshots WHERE snapshot_time < n.snapshot_time)
  AND n.mean_exec_time > o.mean_exec_time * 1.5  -- 50%+ regression
ORDER BY n.mean_exec_time - o.mean_exec_time DESC;
```

---

## 3. Lock Contention Analysis

### Identifying Current Locks

```sql
-- Show all current locks with blocking information
SELECT
  blocked_locks.pid AS blocked_pid,
  blocked_activity.usename AS blocked_user,
  LEFT(blocked_activity.query, 60) AS blocked_query,
  blocking_locks.pid AS blocking_pid,
  blocking_activity.usename AS blocking_user,
  LEFT(blocking_activity.query, 60) AS blocking_query,
  blocked_activity.wait_event_type,
  blocked_activity.state AS blocked_state,
  NOW() - blocked_activity.query_start AS blocked_duration
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON (
  blocking_locks.locktype = blocked_locks.locktype
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
)
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- Deadlock detection log check
-- PostgreSQL automatically detects and resolves deadlocks, logging them.
-- Check logs for: "deadlock detected"
```

### Lock Types Explained

```
AccessShareLock: SELECT — shared, non-blocking
RowShareLock: SELECT FOR UPDATE/SHARE
RowExclusiveLock: INSERT, UPDATE, DELETE — most common write lock
ShareLock: CREATE INDEX (not CONCURRENTLY)
ShareRowExclusiveLock: Rare, some constraint operations
ExclusiveLock: Rare, some operations
AccessExclusiveLock: ALTER TABLE, DROP — blocks EVERYTHING including SELECT
```

### Common Lock Contention Scenarios in Stone AI

```sql
-- Scenario 1: Long-running SELECT blocking ALTER TABLE
-- Fix: Use short lock timeouts for DDL
SET lock_timeout = '5s';
ALTER TABLE "User" ADD COLUMN "newField" TEXT;

-- Scenario 2: Concurrent updates to same row (user profile updates)
-- Fix: Use SELECT FOR UPDATE with SKIP LOCKED for queue-like patterns
SELECT * FROM "Task"
WHERE status = 'pending'
ORDER BY created_at
LIMIT 1
FOR UPDATE SKIP LOCKED;

-- Scenario 3: Bulk updates holding locks too long
-- Fix: Batch updates
-- BAD:
UPDATE "Message" SET processed = true WHERE "chatId" = $1;
-- GOOD:
UPDATE "Message" SET processed = true
WHERE id IN (
  SELECT id FROM "Message"
  WHERE "chatId" = $1 AND NOT processed
  LIMIT 100
);

-- Scenario 4: Index creation blocking writes
-- Fix: Use CONCURRENTLY
CREATE INDEX CONCURRENTLY idx_message_chat ON "Message" ("chatId");
```

### Advisory Locks for Application-Level Coordination

```sql
-- Get an advisory lock (non-blocking)
SELECT pg_try_advisory_lock(hashtext('user_subscription_update_' || $1::text));

-- Release it
SELECT pg_advisory_unlock(hashtext('user_subscription_update_' || $1::text));

-- Session-level vs transaction-level
-- pg_advisory_lock() — held until session ends or explicitly released
-- pg_advisory_xact_lock() — released at end of transaction (preferred)
```

---

## 4. Vacuum Tuning

### Understanding VACUUM

```
VACUUM removes dead tuples (rows marked for deletion by MVCC).
Without vacuum:
  - Table bloat increases
  - Index bloat increases
  - Sequential scans slow down
  - Transaction ID wraparound risk

VACUUM types:
  - VACUUM: Reclaims space, doesn't lock table, doesn't return space to OS
  - VACUUM FULL: Rewrites entire table, acquires AccessExclusiveLock, returns space to OS
  - VACUUM ANALYZE: Vacuum + update statistics
  - Autovacuum: Automatic background process (the workhorse)
```

### Monitoring Vacuum Activity

```sql
-- Check autovacuum activity
SELECT
  schemaname,
  relname,
  last_vacuum,
  last_autovacuum,
  vacuum_count,
  autovacuum_count,
  n_dead_tup,
  n_live_tup,
  ROUND((n_dead_tup::numeric / NULLIF(n_live_tup + n_dead_tup, 0)) * 100, 2) as dead_pct
FROM pg_stat_user_tables
ORDER BY n_dead_tup DESC
LIMIT 20;

-- Check running vacuum processes
SELECT
  pid,
  datname,
  relid::regclass as table_name,
  phase,
  heap_blks_total,
  heap_blks_scanned,
  heap_blks_vacuumed,
  ROUND((heap_blks_vacuumed::numeric / NULLIF(heap_blks_total, 0)) * 100, 1) as pct_complete
FROM pg_stat_progress_vacuum;

-- Table bloat estimation
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname || '.' || tablename)) as table_size,
  pg_size_pretty(pg_indexes_size(schemaname || '.' || tablename)) as index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC
LIMIT 20;
```

### Autovacuum Tuning

```sql
-- Current autovacuum settings
SHOW autovacuum;
SHOW autovacuum_vacuum_threshold;      -- Default: 50
SHOW autovacuum_vacuum_scale_factor;   -- Default: 0.2 (20%)
SHOW autovacuum_analyze_threshold;     -- Default: 50
SHOW autovacuum_analyze_scale_factor;  -- Default: 0.1 (10%)
SHOW autovacuum_naptime;               -- Default: 1min

-- Trigger formula: threshold + scale_factor * n_live_tup
-- For a table with 100,000 rows:
--   Vacuum triggers at: 50 + 0.2 * 100000 = 20,050 dead tuples
--   Analyze triggers at: 50 + 0.1 * 100000 = 10,050 modified tuples

-- Per-table tuning for hot tables
ALTER TABLE "Message" SET (
  autovacuum_vacuum_scale_factor = 0.05,  -- 5% instead of 20%
  autovacuum_vacuum_threshold = 100,
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_vacuum_cost_delay = 10        -- More aggressive
);

ALTER TABLE "Chat" SET (
  autovacuum_vacuum_scale_factor = 0.05,
  autovacuum_vacuum_threshold = 100
);
```

### Transaction ID Wraparound Prevention

```sql
-- Check transaction age (CRITICAL — wraparound = forced shutdown)
SELECT
  datname,
  age(datfrozenxid) as xid_age,
  ROUND(age(datfrozenxid)::numeric / 2000000000 * 100, 2) as pct_to_wraparound
FROM pg_database
ORDER BY age(datfrozenxid) DESC;

-- Per-table check
SELECT
  relname,
  age(relfrozenxid) as xid_age,
  pg_size_pretty(pg_total_relation_size(oid)) as size
FROM pg_class
WHERE relkind = 'r' AND relnamespace = 'public'::regnamespace
ORDER BY age(relfrozenxid) DESC
LIMIT 10;

-- ALERT if any table exceeds 500M transactions
-- Wraparound happens at 2 billion — 500M is early warning
```

---

## 5. Index Diagnostics

### Finding Missing Indexes

```sql
-- Tables with high sequential scan ratios
SELECT
  schemaname,
  relname,
  seq_scan,
  idx_scan,
  ROUND((seq_scan::numeric / NULLIF(seq_scan + idx_scan, 0)) * 100, 2) as seq_scan_pct,
  n_live_tup,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || relname)) as size
FROM pg_stat_user_tables
WHERE n_live_tup > 1000  -- Only tables with data
ORDER BY seq_scan_pct DESC, seq_scan DESC
LIMIT 10;

-- Unused indexes (candidates for removal)
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Duplicate indexes
SELECT
  a.indexrelid::regclass as index1,
  b.indexrelid::regclass as index2,
  a.indrelid::regclass as table_name
FROM pg_index a
JOIN pg_index b ON (
  a.indrelid = b.indrelid
  AND a.indexrelid != b.indexrelid
  AND a.indkey = b.indkey
)
WHERE a.indexrelid > b.indexrelid;

-- Index bloat check
SELECT
  indexrelname,
  relname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE relname IN ('User', 'Chat', 'Message', 'Agent')
ORDER BY pg_relation_size(indexrelid) DESC;
```

### Index Strategy for Stone AI Tables

```sql
-- Core query patterns and recommended indexes:

-- User lookups by Clerk ID (already exists via Prisma @@unique)
-- User lookups by email (already exists)
-- User lookups by subscription tier (for admin queries)
CREATE INDEX CONCURRENTLY idx_user_sub_tier ON "User" ("subscriptionTier") WHERE "subscriptionTier" != 'FREE';

-- Chat queries by user, sorted by date (most common query)
CREATE INDEX CONCURRENTLY idx_chat_user_created ON "Chat" ("userId", "createdAt" DESC);

-- Message queries by chat, sorted by date
CREATE INDEX CONCURRENTLY idx_message_chat_created ON "Message" ("chatId", "createdAt" DESC);

-- Agent access by tier (for agent listing page)
CREATE INDEX CONCURRENTLY idx_agent_tier ON "Agent" ("requiredTier");

-- Partial indexes for active resources
CREATE INDEX CONCURRENTLY idx_active_subscriptions ON "Subscription" ("userId") WHERE status = 'active';

-- Covering index (index-only scan) for common projections
CREATE INDEX CONCURRENTLY idx_user_profile ON "User" (id, email, "displayName", "avatarUrl", "subscriptionTier");
```

---

## 6. Connection Pool Diagnostics

### Monitoring Connections

```sql
-- Current connections by state
SELECT
  state,
  usename,
  COUNT(*) as count,
  MAX(NOW() - state_change) as max_duration
FROM pg_stat_activity
WHERE datname = current_database()
GROUP BY state, usename
ORDER BY count DESC;

-- Long-running queries
SELECT
  pid,
  usename,
  state,
  NOW() - query_start as duration,
  LEFT(query, 100) as query_preview
FROM pg_stat_activity
WHERE state != 'idle'
  AND query NOT ILIKE '%pg_stat%'
  AND NOW() - query_start > INTERVAL '30 seconds'
ORDER BY duration DESC;

-- Connection limits
SHOW max_connections;
SELECT COUNT(*) as current_connections FROM pg_stat_activity;
SELECT COUNT(*) as available_slots FROM pg_stat_activity WHERE state = 'idle';
```

### Prisma Connection Pool Settings

```javascript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  // Connection pool settings via URL params:
  // ?connection_limit=10&pool_timeout=30
}

// For Neon with serverless driver:
// ?pgbouncer=true&connection_limit=10
```

### Connection Pool Sizing Formula

```
Optimal pool size = (core_count * 2) + effective_spindle_count

For Neon serverless:
- Start with connection_limit = 10
- Monitor for "connection pool exhausted" errors
- Scale up in increments of 5
- Max practical limit on Neon: depends on plan

Signs of pool exhaustion:
- "too many connections" errors
- Increasing query queue times
- Idle connections not being released

Signs of pool too large:
- Many idle connections consuming memory
- Connection overhead exceeding query time
```

---

## 7. Neon-Specific Diagnostics

### Understanding Neon Architecture

```
Neon separates compute from storage:
- Compute: Runs PostgreSQL (scales to zero, auto-scales up)
- Storage: Distributed, uses copy-on-write branching
- Pageserver: Serves pages to compute on demand

Implications for diagnostics:
1. Cold start latency: First query after scale-to-zero is slow (500ms-2s)
2. Page fetch latency: Pages not in compute cache must be fetched from storage
3. Branch performance: Branches share storage — no duplication overhead
4. Connection pooling: Use Neon's built-in pooler (PgBouncer-compatible)
```

### Neon-Specific Performance Queries

```sql
-- Check compute size and scaling
SHOW neon.max_cluster_size;

-- Monitor page cache effectiveness
-- High cache miss = compute too small or working set too large
SELECT
  sum(blks_hit) as cache_hits,
  sum(blks_read) as cache_misses,
  ROUND(sum(blks_hit)::numeric / NULLIF(sum(blks_hit) + sum(blks_read), 0) * 100, 2) as hit_rate
FROM pg_stat_database
WHERE datname = current_database();
-- Target: > 99% hit rate

-- Connection usage on Neon
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE state = 'active') as active,
  COUNT(*) FILTER (WHERE state = 'idle') as idle,
  COUNT(*) FILTER (WHERE state = 'idle in transaction') as idle_in_txn
FROM pg_stat_activity;
```

### Neon Cold Start Optimization

```javascript
// Strategy 1: Keep-alive ping to prevent scale-to-zero
// Use a cron job (Vercel Cron, external)
// GET /api/health → simple query to keep compute warm

// Strategy 2: Use Neon's serverless driver for edge
import { neon } from '@neondatabase/serverless';
const sql = neon(process.env.DATABASE_URL);

// Strategy 3: Connection pooling URL
// Use the pooled connection string (port 5432) for web traffic
// Use direct connection (port 5433) for migrations only

// Strategy 4: Optimize first query
// Keep the initial query lightweight — avoid complex JOINs on cold start
```

### Neon Branching for Safe Testing

```bash
# Create a branch for testing a query
neonctl branches create --name "perf-test" --parent "main"

# Run expensive EXPLAIN ANALYZE on the branch, not production
# This uses the same data without affecting the production compute

# Delete when done
neonctl branches delete "perf-test"
```

---

## 8. Prisma Query Performance

### Enabling Prisma Query Logging

```javascript
// In prisma client instantiation
const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'warn', emit: 'stdout' },
    { level: 'error', emit: 'stdout' },
  ],
});

prisma.$on('query', (e) => {
  if (e.duration > 100) {
    console.warn(`SLOW QUERY (${e.duration}ms):`, e.query);
    console.warn('Params:', e.params);
  }
});
```

### Common Prisma Performance Issues

```javascript
// Issue 1: N+1 — forgot to include relations
// BAD:
const users = await prisma.user.findMany();
for (const user of users) {
  const chats = await prisma.chat.findMany({ where: { userId: user.id } });
}

// GOOD:
const users = await prisma.user.findMany({
  include: { chats: true },
});

// Issue 2: Selecting all fields when you need a few
// BAD:
const user = await prisma.user.findUnique({ where: { id } });

// GOOD:
const user = await prisma.user.findUnique({
  where: { id },
  select: { id: true, email: true, displayName: true },
});

// Issue 3: Not using transactions for related writes
// BAD:
await prisma.user.update({ where: { id }, data: { credits: { decrement: 1 } } });
await prisma.usage.create({ data: { userId: id, type: 'agent_call' } });

// GOOD:
await prisma.$transaction([
  prisma.user.update({ where: { id }, data: { credits: { decrement: 1 } } }),
  prisma.usage.create({ data: { userId: id, type: 'agent_call' } }),
]);

// Issue 4: Raw SQL for complex queries Prisma can't optimize
const result = await prisma.$queryRaw`
  SELECT u.id, u.email, COUNT(c.id) as chat_count
  FROM "User" u
  LEFT JOIN "Chat" c ON c."userId" = u.id
  WHERE u."subscriptionTier" = ${tier}
  GROUP BY u.id
  HAVING COUNT(c.id) > 10
  ORDER BY chat_count DESC
  LIMIT 20
`;
```

---

## 9. Monitoring Dashboard Queries

### System Health Overview

```sql
-- Database size
SELECT
  pg_size_pretty(pg_database_size(current_database())) as db_size;

-- Table sizes ranked
SELECT
  relname as table_name,
  pg_size_pretty(pg_total_relation_size(oid)) as total_size,
  pg_size_pretty(pg_relation_size(oid)) as data_size,
  pg_size_pretty(pg_indexes_size(oid)) as index_size,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows
FROM pg_stat_user_tables
JOIN pg_class ON pg_stat_user_tables.relid = pg_class.oid
ORDER BY pg_total_relation_size(oid) DESC;

-- Replication lag (if applicable)
SELECT
  client_addr,
  state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  pg_wal_lsn_diff(sent_lsn, replay_lsn) as replication_lag_bytes
FROM pg_stat_replication;
```

### Alert Thresholds

```
Cache Hit Rate: Alert if < 95%, Critical if < 90%
Dead Tuple Ratio: Alert if > 10%, Critical if > 20%
Long Running Queries: Alert if > 30s, Kill if > 5min
Connection Usage: Alert if > 80% of max, Critical if > 95%
Transaction Age: Alert if > 200M, Critical if > 500M
Vacuum Lag: Alert if last vacuum > 24h on hot tables
Table Bloat: Alert if > 2x expected size
Replication Lag: Alert if > 1MB, Critical if > 10MB
```

---

## 10. Diagnostic Runbook for Wiz

### "The Database Is Slow" — Systematic Diagnosis

```
Step 1: Check active queries
  → pg_stat_activity: anything running > 5s?
  → Any lock contention?

Step 2: Check connection state
  → How many connections? Are we near max?
  → Any idle-in-transaction connections?

Step 3: Check cache hit rates
  → pg_stat_database: cache hit rate < 99%?
  → If yes: compute size may be too small for working set

Step 4: Check slow queries
  → pg_stat_statements: what's consuming the most time?
  → Any recent query plan changes?

Step 5: Check vacuum state
  → Dead tuples accumulating?
  → When was last vacuum on hot tables?

Step 6: Check table/index sizes
  → Unexpected growth?
  → Missing indexes on frequently queried columns?

Step 7: Neon-specific
  → Cold start? Check compute status
  → Page cache misses? May need larger compute
  → Using pooled connection string?
```

---

## Stone AI Application Notes

- **Primary tables to monitor**: User, Chat, Message, Agent, Subscription, BestieProfile
- **Hot paths**: Agent chat (Message inserts + User credit decrements), subscription checks
- **Neon plan awareness**: Connection limits and compute size vary by plan
- **Migration safety**: Always use branches for testing migrations before applying to main
- **Vacuum priority**: Message table (highest write volume), Chat (frequent updates)
- **Index strategy**: Optimize for the agent chat flow first — that's the core product experience

---

*Computer Wiz — The Diagnostician. The database never lies; you just have to know what questions to ask.*
