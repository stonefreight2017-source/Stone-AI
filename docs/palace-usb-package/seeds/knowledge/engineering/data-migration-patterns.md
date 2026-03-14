# Data Migration Patterns

## Palace Knowledge Seed — Advanced Backend Engineering

### Overview

Data migrations are among the riskiest operations in production systems. This seed covers zero-downtime migration strategies, backfill patterns, data transformation pipelines, rollback procedures, and practical Prisma migration workflows for Stone AI (Next.js 16, Prisma 7.4.2, PostgreSQL 16, Neon).

---

## 1. Zero-Downtime Migration Strategy

### The Expand-Contract Pattern

Never remove or rename columns in a single step. Use a three-phase approach:

```
Phase 1: EXPAND — Add new column/table, keep old one
Phase 2: MIGRATE — Backfill data, update application to write to both
Phase 3: CONTRACT — Remove old column/table after verification
```

### Phase 1: Expand

```sql
-- Migration: Add new tier column (enum to string migration)
-- prisma/migrations/20260309_expand_tier_column/migration.sql

-- Add new column (nullable, no default yet)
ALTER TABLE users ADD COLUMN tier_v2 TEXT;

-- Create index in the background (CONCURRENTLY = no lock)
CREATE INDEX CONCURRENTLY idx_users_tier_v2 ON users (tier_v2);
```

```typescript
// Application code: dual-write during expansion
async function updateUserTier(userId: string, newTier: string): Promise<void> {
  await prisma.user.update({
    where: { clerkId: userId },
    data: {
      tier: newTier,       // Old column (still primary)
      tierV2: newTier,     // New column (shadow write)
    },
  });
}
```

### Phase 2: Backfill

```typescript
// src/lib/migrations/backfill-tier-v2.ts

export async function backfillTierV2(batchSize: number = 1000): Promise<{
  processed: number;
  remaining: number;
}> {
  let processed = 0;

  while (true) {
    // Process in batches to avoid long transactions
    const batch = await prisma.$queryRaw<{ id: string; tier: string }[]>`
      SELECT id, tier FROM users
      WHERE tier_v2 IS NULL
      LIMIT ${batchSize}
      FOR UPDATE SKIP LOCKED
    `;

    if (batch.length === 0) break;

    // Batch update
    for (const user of batch) {
      await prisma.$executeRaw`
        UPDATE users SET tier_v2 = ${user.tier}
        WHERE id = ${user.id}::uuid AND tier_v2 IS NULL
      `;
    }

    processed += batch.length;

    // Brief pause to reduce DB load
    await new Promise((r) => setTimeout(r, 100));
  }

  const remaining = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM users WHERE tier_v2 IS NULL
  `;

  return { processed, remaining: Number(remaining[0].count) };
}
```

### Phase 3: Contract

```sql
-- Only after verifying all data is migrated and app reads from tier_v2

-- Step 1: Make new column NOT NULL
ALTER TABLE users ALTER COLUMN tier_v2 SET NOT NULL;

-- Step 2: Rename columns (if desired)
ALTER TABLE users RENAME COLUMN tier TO tier_old;
ALTER TABLE users RENAME COLUMN tier_v2 TO tier;

-- Step 3: Drop old column (after deployment verification)
ALTER TABLE users DROP COLUMN tier_old;
```

---

## 2. Prisma Migration Workflow

### Safe Migration Practices

```typescript
// prisma/migrations/helpers/safe-migration.ts

// Always use directUrl for migrations (bypasses PgBouncer)
// prisma.schema: directUrl = env("DIRECT_DATABASE_URL")

// Migration checklist:
// 1. Test on Neon branch first
// 2. Review generated SQL before applying
// 3. Ensure backward compatibility
// 4. Have rollback SQL ready
```

### Generate and Review

```bash
# Generate migration from schema changes
npx prisma migrate dev --name add_user_preferences

# Review the generated SQL before pushing to production
cat prisma/migrations/20260309_add_user_preferences/migration.sql

# Apply to production (Neon)
npx prisma migrate deploy
```

### Neon Branch-Based Migration Testing

```typescript
// src/lib/migrations/neon-branch-test.ts

// Create a branch, test migration, then apply to main
async function testMigrationOnBranch(): Promise<void> {
  // 1. Create Neon branch from production
  // neon branch create --name migration-test --parent main

  // 2. Apply migration to branch
  // DATABASE_URL=<branch-url> npx prisma migrate deploy

  // 3. Run verification queries
  // 4. If good, apply to main
  // 5. Delete branch
  // neon branch delete migration-test
}
```

---

## 3. Data Transformation Pipelines

```typescript
// src/lib/migrations/pipeline.ts

interface MigrationStep {
  name: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
  verify: () => Promise<boolean>;
}

class MigrationPipeline {
  private steps: MigrationStep[] = [];
  private completedSteps: string[] = [];

  addStep(step: MigrationStep): MigrationPipeline {
    this.steps.push(step);
    return this;
  }

  async execute(): Promise<{
    success: boolean;
    completedSteps: string[];
    failedStep?: string;
    error?: string;
  }> {
    for (const step of this.steps) {
      console.log(`[Migration] Executing: ${step.name}`);
      const startTime = Date.now();

      try {
        await step.up();

        // Verify step succeeded
        const verified = await step.verify();
        if (!verified) {
          throw new Error(`Verification failed for step: ${step.name}`);
        }

        this.completedSteps.push(step.name);
        console.log(
          `[Migration] Completed: ${step.name} (${Date.now() - startTime}ms)`
        );
      } catch (error: any) {
        console.error(`[Migration] Failed: ${step.name}`, error);

        // Rollback completed steps in reverse order
        await this.rollback();

        return {
          success: false,
          completedSteps: this.completedSteps,
          failedStep: step.name,
          error: error.message,
        };
      }
    }

    return { success: true, completedSteps: this.completedSteps };
  }

  private async rollback(): Promise<void> {
    console.log('[Migration] Rolling back...');

    for (let i = this.completedSteps.length - 1; i >= 0; i--) {
      const stepName = this.completedSteps[i];
      const step = this.steps.find((s) => s.name === stepName);

      if (step) {
        try {
          await step.down();
          console.log(`[Migration] Rolled back: ${stepName}`);
        } catch (rollbackError) {
          console.error(
            `[Migration] CRITICAL: Rollback failed for ${stepName}`,
            rollbackError
          );
          // Alert founder — manual intervention needed
          await sendFounderAlert(
            'migration.rollback.failed',
            'CRITICAL: Migration Rollback Failed',
            `Step: ${stepName}\nError: ${rollbackError}`,
            'stone'
          );
        }
      }
    }
  }
}

// Example: Migrate user preferences from JSON column to normalized table
const preferenceMigration = new MigrationPipeline()
  .addStep({
    name: 'create-preferences-table',
    up: async () => {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS user_preferences (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id),
          key TEXT NOT NULL,
          value JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(user_id, key)
        )
      `;
    },
    down: async () => {
      await prisma.$executeRaw`DROP TABLE IF EXISTS user_preferences`;
    },
    verify: async () => {
      const result = await prisma.$queryRaw<any[]>`
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'user_preferences'
      `;
      return result.length > 0;
    },
  })
  .addStep({
    name: 'backfill-preferences',
    up: async () => {
      await prisma.$executeRaw`
        INSERT INTO user_preferences (user_id, key, value)
        SELECT
          id as user_id,
          key,
          value
        FROM users,
        LATERAL jsonb_each(COALESCE(preferences, '{}'::jsonb)) AS kv(key, value)
        WHERE preferences IS NOT NULL
          AND preferences != '{}'::jsonb
        ON CONFLICT (user_id, key) DO NOTHING
      `;
    },
    down: async () => {
      await prisma.$executeRaw`DELETE FROM user_preferences`;
    },
    verify: async () => {
      // Verify counts match
      const [jsonCount, tableCount] = await Promise.all([
        prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(*) as count FROM users
          WHERE preferences IS NOT NULL AND preferences != '{}'::jsonb
        `,
        prisma.$queryRaw<[{ count: bigint }]>`
          SELECT COUNT(DISTINCT user_id) as count FROM user_preferences
        `,
      ]);
      return Number(jsonCount[0].count) === Number(tableCount[0].count);
    },
  })
  .addStep({
    name: 'add-application-index',
    up: async () => {
      await prisma.$executeRaw`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_prefs_user_key
        ON user_preferences (user_id, key)
      `;
    },
    down: async () => {
      await prisma.$executeRaw`DROP INDEX IF EXISTS idx_user_prefs_user_key`;
    },
    verify: async () => {
      const result = await prisma.$queryRaw<any[]>`
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_user_prefs_user_key'
      `;
      return result.length > 0;
    },
  });
```

---

## 4. Batch Backfill Patterns

```typescript
// src/lib/migrations/batch-backfill.ts

interface BackfillOptions {
  batchSize: number;
  delayBetweenBatchesMs: number;
  maxBatches?: number;
  onProgress?: (processed: number, remaining: number) => void;
}

async function batchBackfill<T>(
  fetchBatch: (offset: number, limit: number) => Promise<T[]>,
  processBatch: (items: T[]) => Promise<void>,
  countRemaining: () => Promise<number>,
  options: BackfillOptions
): Promise<{ total: number; errors: number }> {
  let offset = 0;
  let totalProcessed = 0;
  let errors = 0;
  let batchCount = 0;

  while (true) {
    if (options.maxBatches && batchCount >= options.maxBatches) break;

    const batch = await fetchBatch(offset, options.batchSize);
    if (batch.length === 0) break;

    try {
      await processBatch(batch);
      totalProcessed += batch.length;
    } catch (error) {
      errors++;
      console.error(`[Backfill] Batch at offset ${offset} failed:`, error);
    }

    offset += options.batchSize;
    batchCount++;

    // Report progress
    if (options.onProgress) {
      const remaining = await countRemaining();
      options.onProgress(totalProcessed, remaining);
    }

    // Throttle to reduce DB pressure
    if (options.delayBetweenBatchesMs > 0) {
      await new Promise((r) => setTimeout(r, options.delayBetweenBatchesMs));
    }
  }

  return { total: totalProcessed, errors };
}

// Usage: Backfill embeddings for forum posts
await batchBackfill(
  // Fetch batch
  async (offset, limit) =>
    prisma.forumPost.findMany({
      where: {
        embedding: null,
        deletedAt: null,
      },
      take: limit,
      skip: offset,
      select: { id: true, title: true, body: true },
    }),
  // Process batch
  async (posts) => {
    for (const post of posts) {
      const text = `${post.title} ${post.body}`;
      const embedding = await generateEmbedding(text);
      await prisma.$executeRaw`
        UPDATE forum_posts SET embedding = ${embedding}::vector
        WHERE id = ${post.id}::uuid
      `;
    }
  },
  // Count remaining
  async () => {
    const result = await prisma.forumPost.count({
      where: { embedding: null, deletedAt: null },
    });
    return result;
  },
  {
    batchSize: 50,
    delayBetweenBatchesMs: 1000,
    onProgress: (processed, remaining) => {
      console.log(`[Backfill] Processed: ${processed}, Remaining: ${remaining}`);
    },
  }
);
```

---

## 5. Rollback Procedures

```typescript
// src/lib/migrations/rollback.ts

interface RollbackPlan {
  migration: string;
  sql: string[];
  verification: string;
  dataPreservation: string;
}

const ROLLBACK_PLANS: Record<string, RollbackPlan> = {
  'add-preferences-table': {
    migration: '20260309_add_preferences_table',
    sql: [
      // Restore data to JSON column first
      `UPDATE users u SET preferences = (
        SELECT jsonb_object_agg(key, value)
        FROM user_preferences up
        WHERE up.user_id = u.id
      ) WHERE EXISTS (
        SELECT 1 FROM user_preferences WHERE user_id = u.id
      )`,
      // Then drop the table
      'DROP TABLE IF EXISTS user_preferences',
    ],
    verification: 'SELECT COUNT(*) FROM users WHERE preferences IS NOT NULL',
    dataPreservation: 'Data moved back to users.preferences JSON column',
  },
};

async function executeRollback(migrationName: string): Promise<void> {
  const plan = ROLLBACK_PLANS[migrationName];
  if (!plan) throw new Error(`No rollback plan for: ${migrationName}`);

  console.log(`[Rollback] Executing rollback for: ${migrationName}`);

  // Create a savepoint
  await prisma.$executeRaw`SAVEPOINT rollback_savepoint`;

  try {
    for (const sql of plan.sql) {
      await prisma.$executeRawUnsafe(sql);
    }

    // Verify
    const verificationResult = await prisma.$queryRawUnsafe(plan.verification);
    console.log(`[Rollback] Verification result:`, verificationResult);

    // Release savepoint (commit)
    await prisma.$executeRaw`RELEASE SAVEPOINT rollback_savepoint`;

    console.log(`[Rollback] Successfully rolled back: ${migrationName}`);
  } catch (error) {
    // Rollback to savepoint
    await prisma.$executeRaw`ROLLBACK TO SAVEPOINT rollback_savepoint`;
    throw error;
  }
}
```

---

## 6. Migration Monitoring

```typescript
// src/lib/migrations/monitor.ts

export async function getMigrationStatus(): Promise<{
  applied: { name: string; appliedAt: Date }[];
  pending: string[];
  failed: { name: string; error: string }[];
}> {
  const applied = await prisma.$queryRaw<any[]>`
    SELECT migration_name as name, finished_at as "appliedAt"
    FROM _prisma_migrations
    WHERE rolled_back_at IS NULL
    ORDER BY finished_at DESC
  `;

  const failed = await prisma.$queryRaw<any[]>`
    SELECT migration_name as name, logs as error
    FROM _prisma_migrations
    WHERE rolled_back_at IS NOT NULL OR applied_steps_count = 0
  `;

  return { applied, pending: [], failed };
}

// API endpoint for admin monitoring
// src/app/api/admin/migrations/route.ts
export const GET = requireFounder(async () => {
  const status = await getMigrationStatus();
  return Response.json(status);
});
```

---

## 7. Testing Migrations

```typescript
// __tests__/migrations/preference-migration.test.ts

describe('Preference Migration Pipeline', () => {
  it('should create preferences table', async () => {
    const result = await preferenceMigration.execute();
    expect(result.success).toBe(true);
    expect(result.completedSteps).toContain('create-preferences-table');
  });

  it('should rollback cleanly on failure', async () => {
    const failingPipeline = new MigrationPipeline()
      .addStep({
        name: 'will-succeed',
        up: async () => { /* works */ },
        down: async () => { /* undo */ },
        verify: async () => true,
      })
      .addStep({
        name: 'will-fail',
        up: async () => { throw new Error('intentional'); },
        down: async () => { /* undo */ },
        verify: async () => true,
      });

    const result = await failingPipeline.execute();
    expect(result.success).toBe(false);
    expect(result.failedStep).toBe('will-fail');
  });
});
```

---

## Summary

| Pattern | When to Use | Risk Level |
|---------|-------------|-----------|
| Expand-Contract | Column rename, type change | Low (3 deploys) |
| Batch backfill | Populate new columns | Low (throttled) |
| Migration pipeline | Multi-step with verification | Medium (automated rollback) |
| Neon branch testing | Test before production | Very Low |
| Savepoint rollback | Emergency recovery | High (manual) |

Data migrations in Stone AI follow the expand-contract pattern with verification at every step. The Neon branching model allows testing migrations against production data without risk.
