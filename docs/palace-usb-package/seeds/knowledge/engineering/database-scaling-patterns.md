# Database Scaling Patterns

## Palace Knowledge Seed — Advanced Backend Engineering

### Overview

As Stone AI grows, the database must scale with it. This seed covers read replicas, connection pooling strategies, query optimization, table partitioning, Neon branching for development, and practical scaling patterns for PostgreSQL 16 with Prisma 7.4.2 on Neon.

---

## 1. Neon Architecture and Scaling

### How Neon Scales

Neon separates storage from compute:
- **Compute** auto-scales from 0.25 to 8 CU (Compute Units)
- **Storage** is bottomless (pay per GB)
- **Branches** create instant copies (copy-on-write) for dev/testing

```
Production Branch (main)
├── Dev Branch (auto-created per PR)
├── Staging Branch
├── Migration Test Branch
└── Analytics Branch (read-only workloads)
```

### Autoscaling Configuration

```typescript
// Neon autoscaling is configured via the Neon dashboard/API
// Key settings:
// - Min compute: 0.25 CU (scales to zero when idle)
// - Max compute: 4 CU (or higher on Scale plan)
// - Autosuspend: 5 minutes of inactivity
// - Scale-to-zero: enabled for cost savings

// For production Stone AI:
// Min: 1 CU (avoid cold starts)
// Max: 4 CU (handle traffic spikes)
// Autosuspend: disabled (always-on for production)
```

---

## 2. Read Replicas

### Using Neon Read Replicas

```typescript
// src/lib/db/read-replica.ts
import { PrismaClient } from '@prisma/client';

// Primary: for writes and critical reads
export const primaryDb = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL }, // Pooled primary
  },
});

// Read replica: for heavy read queries
export const replicaDb = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_REPLICA_URL }, // Pooled replica
  },
});

// Helper: route reads to replica, writes to primary
export function getReadDb(): PrismaClient {
  // Use replica for read-heavy operations
  if (process.env.DATABASE_REPLICA_URL) {
    return replicaDb;
  }
  return primaryDb;
}

// Usage patterns
async function getAgentList(tier: string) {
  // Read from replica — eventual consistency is OK for agent list
  return getReadDb().agent.findMany({
    where: { isActive: true },
    orderBy: { number: 'asc' },
  });
}

async function updateUserTier(userId: string, newTier: string) {
  // Write to primary — must be consistent
  return primaryDb.user.update({
    where: { clerkId: userId },
    data: { tier: newTier },
  });
}

async function getForumPosts(page: number, pageSize: number) {
  // Read from replica — slight lag is acceptable
  return getReadDb().forumPost.findMany({
    where: { isPublished: true },
    orderBy: { createdAt: 'desc' },
    take: pageSize,
    skip: (page - 1) * pageSize,
  });
}
```

### Read-After-Write Consistency

```typescript
// src/lib/db/consistency.ts

// When a user writes data and immediately reads it,
// the replica may not have the write yet.

// Strategy 1: Read from primary after write
async function upgradeAndReadTier(userId: string, newTier: string) {
  // Write to primary
  await primaryDb.user.update({
    where: { clerkId: userId },
    data: { tier: newTier },
  });

  // Read from PRIMARY (not replica) for immediate consistency
  return primaryDb.user.findUnique({
    where: { clerkId: userId },
    select: { tier: true },
  });
}

// Strategy 2: Use session-level routing
// After a write, set a cookie/header indicating "read from primary"
// for the next N seconds
async function setReadFromPrimary(response: Response): Promise<void> {
  // Cookie expires in 5 seconds — enough for replica to catch up
  response.headers.append(
    'Set-Cookie',
    'read-primary=1; Max-Age=5; Path=/; HttpOnly'
  );
}

function shouldReadFromPrimary(req: Request): boolean {
  return req.headers.get('cookie')?.includes('read-primary=1') ?? false;
}
```

---

## 3. Query Optimization

### Index Strategy

```sql
-- Critical indexes for Stone AI

-- User lookups (most common query pattern)
CREATE INDEX CONCURRENTLY idx_users_clerk_id ON users (clerk_id);
CREATE INDEX CONCURRENTLY idx_users_tier ON users (tier);
CREATE INDEX CONCURRENTLY idx_users_email ON users (email);

-- Conversation queries
CREATE INDEX CONCURRENTLY idx_conversations_user_agent
  ON conversations (user_id, agent_id, created_at DESC);

-- Message history
CREATE INDEX CONCURRENTLY idx_messages_conversation
  ON messages (conversation_id, created_at ASC);

-- Forum queries
CREATE INDEX CONCURRENTLY idx_forum_posts_category_date
  ON forum_posts (category_id, created_at DESC)
  WHERE is_published = true AND deleted_at IS NULL;

-- Token usage tracking
CREATE INDEX CONCURRENTLY idx_token_usage_user_date
  ON token_usage (user_id, recorded_at DESC);

-- Partial indexes (smaller, faster)
CREATE INDEX CONCURRENTLY idx_active_subscriptions
  ON subscriptions (user_id)
  WHERE status = 'active';

-- Covering index (includes columns to avoid table lookup)
CREATE INDEX CONCURRENTLY idx_agents_list_covering
  ON agents (number, name, description, tier, avatar_url)
  WHERE is_active = true AND is_royal_guard = false;
```

### EXPLAIN ANALYZE Patterns

```typescript
// src/lib/db/query-analysis.ts

export async function analyzeQuery(query: string): Promise<{
  plan: string;
  executionTime: number;
  recommendations: string[];
}> {
  const result = await prisma.$queryRawUnsafe<any[]>(
    `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`
  );

  const plan = result[0]['QUERY PLAN'][0];
  const executionTime = plan['Execution Time'];
  const recommendations: string[] = [];

  // Check for sequential scans on large tables
  function checkNode(node: any): void {
    if (node['Node Type'] === 'Seq Scan' && node['Actual Rows'] > 1000) {
      recommendations.push(
        `Sequential scan on ${node['Relation Name']} (${node['Actual Rows']} rows) — consider adding an index`
      );
    }

    if (node['Node Type'] === 'Sort' && node['Sort Method'] === 'external merge') {
      recommendations.push(
        'Sort spilling to disk — increase work_mem or add index'
      );
    }

    if (node['Plans']) {
      for (const child of node['Plans']) {
        checkNode(child);
      }
    }
  }

  checkNode(plan['Plan']);

  return {
    plan: JSON.stringify(plan, null, 2),
    executionTime,
    recommendations,
  };
}
```

### Query Optimization Patterns

```typescript
// src/lib/db/optimized-queries.ts

// BAD: N+1 query
async function getConversationsWithMessages_BAD(userId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { userId },
  });

  for (const conv of conversations) {
    // N additional queries!
    conv.messages = await prisma.message.findMany({
      where: { conversationId: conv.id },
    });
  }
}

// GOOD: Single query with include
async function getConversationsWithMessages(userId: string) {
  return prisma.conversation.findMany({
    where: { userId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 50, // Limit messages per conversation
      },
    },
    take: 20,
    orderBy: { updatedAt: 'desc' },
  });
}

// BETTER: Use select to reduce payload
async function getConversationList(userId: string) {
  return prisma.conversation.findMany({
    where: { userId },
    select: {
      id: true,
      agentId: true,
      updatedAt: true,
      _count: { select: { messages: true } },
      messages: {
        select: { content: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1, // Only last message for preview
      },
    },
    take: 20,
    orderBy: { updatedAt: 'desc' },
  });
}

// BEST: Raw SQL for complex aggregations
async function getUserDashboardStats(userId: string) {
  return prisma.$queryRaw`
    SELECT
      u.tier,
      u.created_at,
      (SELECT COUNT(*) FROM conversations WHERE user_id = u.id) as total_conversations,
      (SELECT COUNT(*) FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE c.user_id = u.id) as total_messages,
      (SELECT COALESCE(SUM(total_tokens), 0)
       FROM daily_usage WHERE user_id = u.id
       AND date >= CURRENT_DATE - INTERVAL '30 days') as tokens_30d,
      (SELECT COALESCE(SUM(total_cost), 0)
       FROM daily_usage WHERE user_id = u.id
       AND date >= CURRENT_DATE - INTERVAL '30 days') as cost_30d
    FROM users u
    WHERE u.clerk_id = ${userId}
  `;
}
```

---

## 4. Table Partitioning

```sql
-- Partition large tables by time for better query performance

-- Token usage: partitioned by month
CREATE TABLE token_usage (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id UUID,
  agent_id INTEGER,
  provider TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost_usd NUMERIC(10,6) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (recorded_at);

-- Create monthly partitions
CREATE TABLE token_usage_2026_01 PARTITION OF token_usage
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE token_usage_2026_02 PARTITION OF token_usage
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE token_usage_2026_03 PARTITION OF token_usage
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');

-- Indexes on partitions (each partition gets its own index)
CREATE INDEX idx_token_usage_user_date ON token_usage (user_id, recorded_at DESC);

-- Audit log: partitioned by month
CREATE TABLE audit_log (
  id UUID DEFAULT gen_random_uuid(),
  action TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) PARTITION BY RANGE (created_at);
```

### Auto-Create Partitions

```typescript
// src/lib/db/partition-manager.ts

export async function ensurePartitionsExist(
  monthsAhead: number = 3
): Promise<string[]> {
  const created: string[] = [];
  const now = new Date();

  for (let i = 0; i <= monthsAhead; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const nextDate = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);

    const yearMonth = `${date.getFullYear()}_${String(date.getMonth() + 1).padStart(2, '0')}`;
    const partitionName = `token_usage_${yearMonth}`;

    const fromDate = date.toISOString().slice(0, 10);
    const toDate = nextDate.toISOString().slice(0, 10);

    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS ${partitionName}
        PARTITION OF token_usage
        FOR VALUES FROM ('${fromDate}') TO ('${toDate}')
      `);
      created.push(partitionName);
    } catch (error: any) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
    }
  }

  return created;
}

// Drop old partitions (data retention)
export async function dropOldPartitions(
  retentionMonths: number = 12
): Promise<string[]> {
  const dropped: string[] = [];
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - retentionMonths);

  const partitions = await prisma.$queryRaw<any[]>`
    SELECT tablename FROM pg_tables
    WHERE tablename LIKE 'token_usage_%'
    ORDER BY tablename
  `;

  for (const p of partitions) {
    // Extract year_month from table name
    const match = p.tablename.match(/token_usage_(\d{4})_(\d{2})/);
    if (!match) continue;

    const partitionDate = new Date(parseInt(match[1]), parseInt(match[2]) - 1);
    if (partitionDate < cutoff) {
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS ${p.tablename}`);
      dropped.push(p.tablename);
    }
  }

  return dropped;
}
```

---

## 5. Neon Branching for Development

```typescript
// src/lib/db/neon-branching.ts

// Neon branches are instant, zero-copy database copies
// Perfect for:
// 1. Feature development (branch per PR)
// 2. Migration testing
// 3. Analytics workloads (don't impact production)
// 4. Data snapshots for debugging

// GitHub Actions integration: auto-create branch per PR
// .github/workflows/preview.yml
/*
- name: Create Neon Branch
  uses: neondatabase/create-branch-action@v5
  with:
    project_id: ${{ secrets.NEON_PROJECT_ID }}
    branch_name: preview/${{ github.event.pull_request.number }}
    api_key: ${{ secrets.NEON_API_KEY }}
    parent: main

- name: Run Migrations
  run: npx prisma migrate deploy
  env:
    DATABASE_URL: ${{ steps.create-branch.outputs.db_url }}
*/

// Programmatic branch management
import { createApiClient } from '@neondatabase/api-client';

const neonApi = createApiClient({
  apiKey: process.env.NEON_API_KEY!,
});

export async function createDevBranch(name: string): Promise<{
  branchId: string;
  connectionString: string;
}> {
  const project = await neonApi.listProjects();
  const projectId = project.data.projects[0].id;

  const branch = await neonApi.createProjectBranch(projectId, {
    branch: { name, parent_id: 'main' },
    endpoints: [{ type: 'read_write' }],
  });

  return {
    branchId: branch.data.branch.id,
    connectionString: branch.data.connection_uris[0].connection_uri,
  };
}

export async function deleteDevBranch(branchId: string): Promise<void> {
  const project = await neonApi.listProjects();
  const projectId = project.data.projects[0].id;

  await neonApi.deleteProjectBranch(projectId, branchId);
}
```

---

## 6. Connection Management Under Load

```typescript
// src/lib/db/load-management.ts

// Shed load when database is overwhelmed
export class DatabaseLoadShedder {
  private queueDepth = 0;
  private maxQueueDepth = 100;
  private shedPercentage = 0;

  async executeWithShedding<T>(
    fn: () => Promise<T>,
    priority: 'critical' | 'normal' | 'low' = 'normal'
  ): Promise<T> {
    // Critical queries never get shed
    if (priority === 'critical') {
      return fn();
    }

    // Check if we should shed this request
    if (this.shouldShed(priority)) {
      throw new ServiceUnavailableError(
        'Database is under heavy load. Please retry in a few seconds.'
      );
    }

    this.queueDepth++;

    try {
      return await fn();
    } finally {
      this.queueDepth--;
      this.updateShedPercentage();
    }
  }

  private shouldShed(priority: string): boolean {
    if (this.shedPercentage === 0) return false;

    // Low priority gets shed first
    const threshold = priority === 'low'
      ? this.shedPercentage * 2
      : this.shedPercentage;

    return Math.random() * 100 < threshold;
  }

  private updateShedPercentage(): void {
    const utilization = this.queueDepth / this.maxQueueDepth;

    if (utilization > 0.9) {
      this.shedPercentage = 50; // Shed 50% of non-critical
    } else if (utilization > 0.7) {
      this.shedPercentage = 20;
    } else if (utilization > 0.5) {
      this.shedPercentage = 5;
    } else {
      this.shedPercentage = 0;
    }
  }
}

export const loadShedder = new DatabaseLoadShedder();
```

---

## 7. Monitoring Database Scale

```typescript
// src/app/api/admin/db-stats/route.ts

export const GET = requireFounder(async () => {
  const stats = await prisma.$queryRaw<any[]>`
    SELECT
      schemaname,
      relname as table_name,
      n_tup_ins as inserts,
      n_tup_upd as updates,
      n_tup_del as deletes,
      n_live_tup as live_rows,
      n_dead_tup as dead_rows,
      pg_size_pretty(pg_total_relation_size(relid)) as total_size,
      last_vacuum,
      last_analyze
    FROM pg_stat_user_tables
    ORDER BY n_live_tup DESC
    LIMIT 20
  `;

  const connectionStats = await prisma.$queryRaw<any[]>`
    SELECT
      state,
      COUNT(*) as count,
      MAX(EXTRACT(EPOCH FROM (NOW() - state_change)))::int as max_duration_sec
    FROM pg_stat_activity
    WHERE datname = current_database()
    GROUP BY state
  `;

  const indexStats = await prisma.$queryRaw<any[]>`
    SELECT
      indexrelname as index_name,
      idx_scan as scans,
      pg_size_pretty(pg_relation_size(indexrelid)) as size
    FROM pg_stat_user_indexes
    ORDER BY idx_scan ASC
    LIMIT 10
  `;

  return Response.json({
    tables: stats,
    connections: connectionStats,
    unusedIndexes: indexStats,
  });
});
```

---

## Summary

| Strategy | When to Apply | Stone AI Application |
|----------|--------------|---------------------|
| Read replicas | Read-heavy queries | Agent list, forum, help articles |
| Neon autoscaling | Variable traffic | Production compute auto-sizing |
| Query optimization | Always | N+1 prevention, covering indexes |
| Table partitioning | >1M rows/table | Token usage, audit log |
| Neon branching | Development | PR previews, migration testing |
| Connection pooling | Serverless | PgBouncer via Neon pooler |
| Load shedding | Traffic spikes | Protect DB from overload |

Database scaling in Stone AI leverages Neon's serverless architecture: auto-scaling compute, instant branching, and managed connection pooling. The application layer adds read routing, query optimization, and load management.
