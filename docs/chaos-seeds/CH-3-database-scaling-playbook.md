# CH-3: Database Scaling Playbook (Beyond Single Neon)
**Agent**: Chaos (Agent #44) | **Priority**: P1 | **Date**: 2026-03-07
**Stack**: Neon Serverless Postgres, pgvector, Prisma 7.4.2, 3 businesses sharing infra

---

## 1. Neon's Current Scaling Capabilities

### Autoscaling

| Feature | Current Capability |
|---|---|
| Autoscaling range | 0.25 CU to 16 CU (1 CU = 1 vCPU, 4GB RAM) |
| Fixed compute | Up to 56 CU |
| Scale-to-zero | Yes, computes suspend after inactivity |
| Wake time | ~500ms cold start |
| Scale-up speed | Real-time, based on load |

### Connection Limits by Compute Size

| Compute (CU) | max_connections | Pooled (PgBouncer) |
|---|---|---|
| 0.25 | 112 | Up to 10,000 |
| 1 | 448 | Up to 10,000 |
| 4 | 1,792 | Up to 10,000 |
| 8 | 3,604 | Up to 10,000 |
| 16 | 4,000 (capped) | Up to 10,000 |

### Read Replicas
- Instant creation (no data copy — reads from same storage)
- Independent autoscaling (separate CU allocation)
- No additional storage cost
- Can have multiple read replicas per project
- Each replica gets its own connection string

### Storage
- Bottomless (no pre-provisioned limits)
- Branching (instant copy-on-write forks)
- Point-in-time restore (WAL-based)
- Pricing: $0.35/GB-month (post-2025 Databricks acquisition pricing)

### Current Plan Limits (verify against your Neon tier)
- Free: 100 CU-hours/month, 10 branches, 0.5GB storage
- Launch: 300 CU-hours/month, unlimited branches
- Scale: 750 CU-hours/month, read replicas, autoscaling to 8 CU
- Business: Unlimited CU-hours, autoscaling to 16 CU, dedicated support

---

## 2. Query Performance Monitoring

### Slow Query Detection

```sql
-- Enable pg_stat_statements (already available on Neon)
-- Top 10 slowest queries by total time
SELECT
  substring(query, 1, 100) as query_preview,
  calls,
  round(total_exec_time::numeric, 2) as total_ms,
  round(mean_exec_time::numeric, 2) as avg_ms,
  round(max_exec_time::numeric, 2) as max_ms,
  rows
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 10;
```

### Index Optimization Checklist

```sql
-- Find missing indexes (tables with sequential scans on large tables)
SELECT
  schemaname, relname,
  seq_scan, seq_tup_read,
  idx_scan, idx_tup_fetch,
  n_live_tup
FROM pg_stat_user_tables
WHERE seq_scan > 100
  AND n_live_tup > 10000
ORDER BY seq_tup_read DESC;

-- Find unused indexes (wasting space and write performance)
SELECT
  schemaname, tablename, indexname,
  idx_scan,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND schemaname != 'pg_catalog'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Index hit ratio (should be >99%)
SELECT
  'index hit rate' as name,
  round(sum(idx_blks_hit) / nullif(sum(idx_blks_hit + idx_blks_read), 0) * 100, 2) as ratio
FROM pg_statio_user_indexes;
```

### Key Queries to Monitor for Stone AI

| Query Pattern | Expected Performance | Alarm Threshold |
|---|---|---|
| Chat history fetch (by user) | <10ms | >50ms |
| Agent config load | <5ms | >20ms |
| Embedding similarity search | <100ms | >500ms |
| User auth lookup | <5ms | >20ms |
| Forum post listing | <20ms | >100ms |
| Billing status check | <10ms | >50ms |
| Admin dashboard aggregations | <500ms | >2s |

---

## 3. pgvector Scaling at High Embedding Volumes

### Index Strategy: HNSW vs IVFFlat

| Factor | HNSW | IVFFlat |
|---|---|---|
| Query speed | 1.5ms avg | 2.4ms avg |
| QPS at 0.99 recall | 40.5 | 2.6 |
| Build time (1M vectors) | ~4000s | ~128s |
| Memory usage (1M vectors) | ~729MB | ~257MB |
| Handles inserts well | Yes (no rebuild needed) | No (rebuild for new data) |
| Best for | <10M vectors, dynamic data | >10M vectors, static data |

### Recommended Configuration for Stone AI

```sql
-- For embeddings table (assuming OpenAI text-embedding-3-small, 1536 dims)
-- Use HNSW for dynamic data with good recall

-- Create the HNSW index
CREATE INDEX CONCURRENTLY idx_embeddings_hnsw
ON embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 128);

-- Set search parameters for queries
SET hnsw.ef_search = 100;  -- Higher = better recall, slower

-- For very large tables (>5M rows), partition first
CREATE TABLE embeddings (
  id bigint GENERATED ALWAYS AS IDENTITY,
  content_type text NOT NULL,  -- 'chat', 'agent', 'forum', 'knowledge'
  embedding vector(1536),
  metadata jsonb,
  created_at timestamptz DEFAULT now()
) PARTITION BY LIST (content_type);

CREATE TABLE embeddings_chat PARTITION OF embeddings FOR VALUES IN ('chat');
CREATE TABLE embeddings_agent PARTITION OF embeddings FOR VALUES IN ('agent');
CREATE TABLE embeddings_forum PARTITION OF embeddings FOR VALUES IN ('forum');
CREATE TABLE embeddings_knowledge PARTITION OF embeddings FOR VALUES IN ('knowledge');

-- Index each partition separately
CREATE INDEX ON embeddings_chat USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 128);
CREATE INDEX ON embeddings_agent USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 128);
-- etc.
```

### Scaling Thresholds

| Embedding Count | Strategy | Notes |
|---|---|---|
| <100K | HNSW, single table | No partitioning needed |
| 100K-1M | HNSW, partition by content_type | Better index build times |
| 1M-10M | HNSW partitioned + read replica for search | Offload search to replica |
| >10M | Consider IVFFlat for cold data, HNSW for hot | Hybrid approach |
| >50M | Dedicated vector DB (Pinecone/Qdrant) + Neon for relational | Neon for metadata, vector DB for search |

---

## 4. Read Replica Architecture

### What to Route Where

```
PRIMARY (read-write compute)
├── All INSERT/UPDATE/DELETE operations
├── User authentication writes
├── Chat message storage
├── Billing/subscription changes
├── Admin operations
└── Any transaction requiring consistency

READ REPLICA 1 (search & analytics)
├── Vector similarity searches
├── Forum post listings
├── Agent catalog browsing
├── Admin dashboard read queries
└── Analytics aggregations

READ REPLICA 2 (future, if needed)
├── User history browsing
├── Chat history retrieval
└── Referral leaderboard queries
```

### Prisma Configuration for Read Replicas

```typescript
// prisma/schema.prisma — no changes needed, just connection strings

// src/lib/db.ts
import { PrismaClient } from '@prisma/client';

// Primary (read-write)
const primaryUrl = process.env.DATABASE_URL;
// Read replica (pooled connection)
const replicaUrl = process.env.DATABASE_REPLICA_URL;

export const prisma = new PrismaClient({
  datasources: { db: { url: primaryUrl } }
});

export const prismaRead = new PrismaClient({
  datasources: { db: { url: replicaUrl } }
});

// Usage pattern:
// Write operations: prisma.user.create(...)
// Read operations:  prismaRead.user.findMany(...)
// Vector search:    prismaRead.$queryRaw`SELECT ... ORDER BY embedding <=> ...`
```

### Neon Read Replica Connection
```
# Primary (pooled)
postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require

# Read replica (pooled) — different endpoint
postgresql://user:pass@ep-yyy-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

## 5. Connection Pooling at Scale

### Current Architecture
```
Vercel Serverless Functions
  → Neon PgBouncer (pooled endpoint, port 5432)
    → Neon Postgres (direct)
```

### PgBouncer Configuration (Neon-managed)
- **Mode**: Transaction (connections returned after each transaction)
- **max_client_conn**: 10,000 (Neon-managed)
- **default_pool_size**: 90% of max_connections (auto-scaled)

### Connection String Best Practices
```
# ALWAYS use pooled connection for serverless (Vercel)
# Pooled endpoint has "-pooler" in hostname
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"

# Direct connection ONLY for migrations and long-running admin tasks
DIRECT_DATABASE_URL="postgresql://user:pass@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
```

### Prisma Connection Pool Settings
```typescript
// In schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")       // pooled for queries
  directUrl = env("DIRECT_DATABASE_URL") // direct for migrations
}

// Connection limit per Vercel function instance
// Prisma default pool is 5 connections — good for serverless
// Don't increase unless you see connection wait times
```

### Scaling Limits
| Scenario | Connections Used | Headroom |
|---|---|---|
| 50 concurrent Vercel functions x 5 pool each | 250 | 9,750 remaining |
| 200 concurrent functions | 1,000 | 9,000 remaining |
| 1000 concurrent functions | 5,000 | 5,000 remaining |
| Theoretical max (Vercel Enterprise) | 10,000 | 0 — need to scale |

**When connection pooling becomes a bottleneck**: >5,000 concurrent serverless function invocations. At that point, add application-level connection pooling or switch to Neon's serverless driver (@neondatabase/serverless).

---

## 6. Data Archival Strategy

### Tiered Storage Model

| Data Type | Hot (active DB) | Warm (read replica) | Cold (archive) |
|---|---|---|---|
| Chat history | Last 90 days | 90 days - 1 year | >1 year |
| Embeddings | All active | Search replica | Never (regenerable) |
| Forum posts | All | All | Never |
| Audit logs | Last 30 days | 30 days - 1 year | >1 year |
| Analytics events | Last 7 days | 7 days - 90 days | >90 days |
| User profiles | All | Read replica | Deleted accounts after 30 days |

### Archival Implementation

```sql
-- 1. Create archive table (same schema, partitioned by month)
CREATE TABLE chat_messages_archive (LIKE chat_messages INCLUDING ALL)
PARTITION BY RANGE (created_at);

-- 2. Monthly archival job (run via Neon SQL or cron)
-- Move messages older than 90 days
WITH archived AS (
  DELETE FROM chat_messages
  WHERE created_at < NOW() - INTERVAL '90 days'
  RETURNING *
)
INSERT INTO chat_messages_archive SELECT * FROM archived;

-- 3. Export cold storage to S3/R2 (>1 year)
-- Use pg_dump with date filter, upload to Cloudflare R2
```

### Cloudflare R2 for Cold Storage
```
- Free egress (no bandwidth charges)
- S3-compatible API
- $0.015/GB-month storage
- Perfect for old chat archives, audit logs
```

---

## 7. Migration Path: Scaling Phases

### Phase 1: Current (Single Neon Project, Autoscaling)
```
Stone AI → Neon (autoscaling 0.25-4 CU)
         → Single project, single branch
         → Pooled connections via PgBouncer
```
**Capacity**: ~100 concurrent users, <1M rows per table

### Phase 2: Read Replicas (When search latency increases)
```
Stone AI Writes → Neon Primary (4-8 CU)
Stone AI Reads  → Neon Read Replica (4-8 CU, autoscaling)
Vector Search   → Neon Read Replica 2 (dedicated)
```
**Trigger**: When vector search P95 > 200ms or primary CPU > 70% sustained
**Capacity**: ~500 concurrent users, <10M embeddings

### Phase 3: Multi-Project (When 3 businesses need isolation)
```
Stone AI    → Neon Project A (primary + replica)
Best AI     → Neon Project B (primary + replica)
Stone Tools → Neon Project C (primary + replica)
Shared Auth → Neon Project D (Clerk/auth data, replicated)
```
**Trigger**: When any business needs independent scaling or compliance isolation
**Capacity**: Each project scales independently to 56 CU

### Phase 4: Multi-Region (When global users demand it)
```
US-East: Neon Primary (all writes)
US-West: Neon Read Replica (west coast users)
EU:      Neon Read Replica (European users, GDPR data locality)
```
**Trigger**: When >30% of users are outside US-East region
**Note**: Neon's multi-region is on their roadmap. Until available, use Cloudflare caching for read-heavy endpoints.

---

## 8. Cross-Business Database Architecture

### Option A: Single Neon Project, Schema Separation (Current — KEEP for now)
```sql
-- All three businesses share one Neon project
-- Separate by schema prefix or table naming
-- Shared: users, auth, billing tables
-- Per-business: stone_ai.*, best_ai.*, stone_tools.*
```
**Pros**: Simple, cheap, shared user accounts work naturally
**Cons**: Noisy neighbor risk, no independent scaling, single point of failure

### Option B: Separate Neon Projects, Shared Auth (Phase 3)
```
Project: stone-ai-prod     → stone-ai.net
Project: best-ai-prod      → best-ai app
Project: stone-tools-prod  → tools.stone-ai.net
Project: shared-auth       → Clerk user data (if needed)
```
**Pros**: Independent scaling, isolation, per-business cost tracking
**Cons**: Cross-business queries need application-level joins

### Recommendation
**Stay on Option A until any single business exceeds 4 CU sustained or you need compliance isolation.** The overhead of multi-project isn't worth it until the scaling demands it. Neon's per-project pricing means you pay more for the same total compute split across projects.

---

## Summary: Action Items

| Action | Priority | When |
|---|---|---|
| Enable pg_stat_statements monitoring | P0 | Now |
| Set up slow query alerts (>500ms) | P0 | Now |
| Create HNSW indexes on embedding tables | P1 | Before launch |
| Configure read replica for vector search | P1 | When search P95 > 200ms |
| Implement archival for chat history >90 days | P2 | At 1M+ messages |
| Plan multi-project split for 3 businesses | P2 | When any business hits 4 CU sustained |
| Evaluate multi-region | P3 | When >30% users outside US-East |
