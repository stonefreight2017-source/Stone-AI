# Prisma Migration Playbook — Stone AI

> Zero-downtime migration strategies for PostgreSQL 16 + Prisma 7.x on Neon.
> Real examples using Stone AI models: User, Conversation, Message, Agent, BestieProfile.

---

## Table of Contents

1. [Migration Command Reference](#1-migration-command-reference)
2. [Adding Columns Safely](#2-adding-columns-safely)
3. [Renaming Fields Without Downtime](#3-renaming-fields-without-downtime)
4. [Enum Additions and Modifications](#4-enum-additions-and-modifications)
5. [@default vs App-Level Defaults](#5-default-vs-app-level-defaults)
6. [Index Management](#6-index-management)
7. [Breaking Changes in Production](#7-breaking-changes-in-production)
8. [Failed Migration Recovery on Neon](#8-failed-migration-recovery-on-neon)
9. [Migration Squashing](#9-migration-squashing)
10. [Multi-Phase Migration Patterns](#10-multi-phase-migration-patterns)
11. [Neon-Specific Strategies](#11-neon-specific-strategies)
12. [Pre-Flight Checklist](#12-pre-flight-checklist)
13. [Emergency Runbook](#13-emergency-runbook)

---

## 1. Migration Command Reference

### prisma migrate dev

Local development only. Never production.

```bash
npx prisma migrate dev --name add_user_avatar
```

- Generates SQL migration in `prisma/migrations/`, applies it, regenerates Client
- Detects drift and may prompt to reset the database
- `--create-only` generates SQL without applying (use for custom edits)
- `--skip-seed` skips seed script execution

**Critical**: `migrate dev` can reset your local database if drift is detected. Never point it at production.

### prisma migrate deploy

Production, staging, CI/CD only.

```bash
npx prisma migrate deploy
```

- Applies pending migrations in order. Does NOT generate new ones or regenerate Client.
- Fails (doesn't reset) on problems. Records applied migrations in `_prisma_migrations`.
- **This is the only migrate command that should ever touch production.**

### prisma migrate reset

Local development only. Destroys everything.

```bash
npx prisma migrate reset
```

Drops the database, recreates from scratch, applies all migrations, runs seed. Never run against production.

### prisma migrate diff

Compare states, generate custom SQL:

```bash
npx prisma migrate diff \
  --from-schema-datamodel prisma/schema.prisma \
  --to-url "$DATABASE_URL" \
  --script
```

### prisma migrate resolve

Mark failed migrations as applied or rolled back:

```bash
npx prisma migrate resolve --applied 20260308120000_add_user_avatar
npx prisma migrate resolve --rolled-back 20260308120000_add_user_avatar
```

---

## 2. Adding Columns Safely

### Rule: New columns MUST be nullable OR have a @default

PostgreSQL 11+ stores constant defaults in catalog metadata without rewriting the table. This makes column additions instant.

### Safe: Nullable column

```prisma
model User {
  avatarUrl String?  // nullable = instant, no lock, no rewrite
}
```

### Safe: Column with @default

```prisma
model User {
  theme String @default("system")  // constant default = instant
}
```

### DANGEROUS: NOT NULL without @default

```prisma
model User {
  theme String  // NOT NULL, no default = will fail on existing rows
}
```

**Always provide a default for non-nullable columns.**

### Real Example: Adding smartCreditsRemaining

```prisma
model User {
  smartCreditsRemaining Int @default(5)
}
```

```sql
ALTER TABLE "User" ADD COLUMN "smartCreditsRemaining" INTEGER NOT NULL DEFAULT 5;
```

Constant default = metadata only. No rewrite. No downtime.

### Real Example: Onboarding fields

```prisma
model User {
  onboardingCompleted Boolean  @default(false)   // constant = instant
  onboardingStep      Int      @default(0)       // constant = instant
  onboardingGoals     String[] @default([])      // constant = instant
  onboardingSkippedAt DateTime?                   // nullable = instant
}
```

### Two-Phase Pattern (for computed defaults)

**Phase 1** — Add nullable, deploy:
```prisma
model Agent { popularity Float? }
```

**Phase 2** — Backfill:
```sql
UPDATE "Agent" SET "popularity" = (
  SELECT COUNT(*) FROM "Conversation" WHERE "agentId" = "Agent"."id"
)::float WHERE "popularity" IS NULL;
```

**Phase 3** — Set NOT NULL with default:
```prisma
model Agent { popularity Float @default(0) }
```

The `SET NOT NULL` requires a full table scan (no rewrite). For large tables, use `CHECK` constraint with `NOT VALID` first, then validate separately.

---

## 3. Renaming Fields Without Downtime

### The Problem

Prisma sees a rename as "drop old, add new" — causing **data loss**.

### Option A: @map (Zero SQL, Zero Risk)

Rename the Prisma field but keep the database column name:

```prisma
model Conversation {
  isArchived Boolean @default(false) @map("archived")
}
```

No migration SQL generated. App code uses `conversation.isArchived`, database column stays `archived`. **Preferred approach.**

### Option B: Four-Phase Database Rename

When the database column itself must change:

**Phase 1**: Add new column, copy data (use `--create-only`, edit SQL):
```sql
ALTER TABLE "User" ADD COLUMN "displayName" TEXT;
UPDATE "User" SET "displayName" = "name";
```

**Phase 2**: Dual-write in application code:
```typescript
await prisma.user.update({
  data: { name: newName, displayName: newName },
});
```

**Phase 3**: Switch all reads to new column, remove fallbacks.

**Phase 4**: Drop old column in a separate deployment:
```sql
ALTER TABLE "User" DROP COLUMN "name";
```

---

## 4. Enum Additions and Modifications

### Adding Values (Safe)

```prisma
enum Tier {
  FREE
  STARTER
  PLUS
  SMART
  PRO
  ENTERPRISE  // new
}
```

```sql
ALTER TYPE "Tier" ADD VALUE 'ENTERPRISE';
```

Instant. Non-transactional (PostgreSQL limitation). Cannot be rolled back once applied. Prisma handles the transaction boundary automatically.

### Adding Multiple Values

Each gets its own `ALTER TYPE ... ADD VALUE`. All safe. Deploy migration before code that uses the new values.

### Removing Values — DANGER

PostgreSQL does NOT support `ALTER TYPE ... REMOVE VALUE`. Full replacement required:

```sql
CREATE TYPE "SubscriptionStatus_new" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED');
UPDATE "User" SET "subscriptionStatus" = 'CANCELED' WHERE "subscriptionStatus" = 'INACTIVE';
ALTER TABLE "User"
  ALTER COLUMN "subscriptionStatus" TYPE "SubscriptionStatus_new"
  USING "subscriptionStatus"::text::"SubscriptionStatus_new";
DROP TYPE "SubscriptionStatus";
ALTER TYPE "SubscriptionStatus_new" RENAME TO "SubscriptionStatus";
```

**Always write this as a custom migration. Never let Prisma auto-generate it.**

### Renaming Values

PostgreSQL 10+ supports this directly:
```sql
ALTER TYPE "Tier" RENAME VALUE 'SMART' TO 'ADVANCED';
```

Prisma won't generate this — use `--create-only` and write manually.

---

## 5. @default vs App-Level Defaults

### Use @default when:
- **Constant values**: `@default(false)`, `@default(0)`, `@default("system")`
- **PG functions**: `@default(now())`, `@default(cuid())`
- **Data integrity regardless of insert method**: raw SQL, bulk imports, other services

### Use app-level defaults when:
- Default depends on other fields (referralCode from email hash)
- Default requires external services (avatar from Clerk)
- Default is conditional (credits by tier)

### Hybrid Approach (Recommended)

```prisma
model User {
  smartCreditsRemaining Int @default(5)  // DB safety net
}
```

```typescript
const CREDITS_BY_TIER: Record<Tier, number> = {
  FREE: 5, STARTER: 25, PLUS: 50, SMART: 100, PRO: 500,
};
// App logic sets the real value; @default(5) catches any code path that forgets
```

### @updatedAt — Special Case

`@updatedAt` is NOT a database default. Prisma Client injects `NOW()` on every UPDATE. Direct SQL updates will NOT trigger it. For true DB-level updated timestamps, use a trigger:

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW."updatedAt" = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_updated_at BEFORE UPDATE ON "User"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### ID Generators

| Generator | Sortable | Size | Use Case |
|-----------|----------|------|----------|
| `autoincrement()` | Yes | 4-8 bytes | Internal, not exposed |
| `cuid()` | Roughly | ~25 chars | **Stone AI default** |
| `uuid()` | No | 36 chars | External APIs, compliance |

---

## 6. Index Management

### B-tree (Default) — 90% of needs

Equality, range, sorting, prefix LIKE.

```prisma
@@index([userId, updatedAt])  // composite B-tree
```

**Current Stone AI B-tree indexes:**
- Conversation: `(userId, updatedAt)`, `(agentId)`, `(bestieId)`
- Message: `(conversationId, createdAt)`
- ForumPost: `(category, createdAt DESC)`, `(userId)`, `(pinned, createdAt DESC)`
- Notification: `(userId, read, createdAt DESC)`
- Referral: `(referrerId, status)`
- ApiKey: `(userId)`, `(keyHash)`

### GIN — Arrays, JSONB, Full-Text Search

Prisma doesn't support GIN natively. Use custom migration:

```sql
CREATE INDEX "User_badges_gin" ON "User" USING GIN ("badges");
```

**Stone AI GIN candidates:** `User.badges`, `User.easterEggClaims`, `User.onboardingGoals`, `BestieProfile.personality` (JSONB).

Add when table exceeds ~10K rows AND you query these columns with `has`/`hasEvery`/`hasSome` or JSONB containment.

### GiST — Geometric, Range Types

Not currently needed for Stone AI. Would be relevant for geographic features or range overlap detection.

### BRIN — Append-Only Timestamp Data

100-1000x smaller than B-tree. Works on naturally ordered data.

```sql
CREATE INDEX "Message_createdAt_brin" ON "Message" USING BRIN ("createdAt");
```

**Stone AI BRIN candidates** (when tables exceed 1M rows): `Message.createdAt`, `Notification.createdAt`, `ForumReply.createdAt`.

### Adding Indexes Without Downtime

`CREATE INDEX` blocks writes. Use `CONCURRENTLY`:

```sql
CREATE INDEX CONCURRENTLY "Message_model_idx" ON "Message"("model");
```

Requires running outside a transaction. With `--create-only`, edit the SQL and add:

```toml
# prisma/migrations/<timestamp>/migration.toml
[migration]
transaction = false
```

**Always use CONCURRENTLY for production indexes on tables with >10K rows.**

### Composite Index Column Order

Put highest-selectivity column first. `@@index([userId, updatedAt])` filters to one user THEN sorts — better than `@@index([updatedAt, userId])` for per-user queries.

### Partial Indexes (Custom SQL)

```sql
CREATE INDEX "Notification_unread_idx"
  ON "Notification"("userId", "createdAt" DESC) WHERE "read" = false;

CREATE INDEX "Feedback_unresolved_idx"
  ON "Feedback"("createdAt") WHERE "resolved" = false;
```

Dramatically smaller. Speeds up the most common queries.

---

## 7. Breaking Changes in Production

### Breaking vs Safe

| Change | Safe? |
|--------|-------|
| Add nullable column | YES |
| Add column with @default | YES |
| Add enum value | YES |
| Add index / table | YES |
| Drop column | NO — use 2-step deploy |
| Drop table | NO |
| Remove enum value | NO — custom SQL |
| Rename column | NO — use @map or 4-phase |
| NOT NULL without default | NO |
| Narrowing type change | NO — validate first |

### Expand-Migrate-Contract Pattern

1. **Expand**: Add new columns/tables, keep old. Deploy code that writes to both.
2. **Migrate**: Backfill data from old to new. Verify.
3. **Contract**: Drop old columns/tables. Deploy code using only new.

### Dropping Columns Safely

**Step 1**: Remove column from Prisma schema. Deploy. Client stops using it, but column still exists.
**Step 2**: Later deployment — migration drops the column.

Rolling deploys mean old and new code run simultaneously. Old code needs the column to exist.

---

## 8. Failed Migration Recovery on Neon

### Check migration status

```sql
SELECT migration_name, finished_at, rolled_back_at, logs
FROM _prisma_migrations ORDER BY started_at DESC LIMIT 5;
```

### Partially applied (non-transactional)

**Fix forward**: Complete remaining statements manually, then:
```bash
npx prisma migrate resolve --applied <migration_name>
```

**Roll back**: Undo what was applied, then:
```bash
npx prisma migrate resolve --rolled-back <migration_name>
```

### Migration succeeded but app crashes

If migration is backward-compatible: roll back app code, fix, redeploy.
If migration broke things: use Neon point-in-time restore:

```bash
neonctl branches create --project-id <id> --parent <branch> \
  --point-in-time "2026-03-08T12:00:00Z"
```

### _prisma_migrations out of sync

```bash
npx prisma migrate resolve --applied <migration_already_in_db>
```

### Schema drift

```bash
npx prisma migrate diff --from-migrations prisma/migrations --to-url "$DATABASE_URL" --script
```

Generate a fix migration from the diff output.

---

## 9. Migration Squashing

### When to squash
- 50+ migrations accumulated
- Fresh setup takes >60 seconds
- Migrations that undo each other exist

### How to squash

```bash
# 1. Generate baseline from current schema
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > baseline.sql

# 2. Replace all migrations
rm -rf prisma/migrations/
mkdir -p prisma/migrations/0_baseline
mv baseline.sql prisma/migrations/0_baseline/migration.sql

# 3. Mark as applied on ALL existing databases
DATABASE_URL="<prod>" npx prisma migrate resolve --applied 0_baseline
DATABASE_URL="<staging>" npx prisma migrate resolve --applied 0_baseline
npx prisma migrate resolve --applied 0_baseline  # local
```

**Risk**: Any environment not marked will try to apply the baseline and fail. Custom migration SQL (data backfills, manual indexes) may not be captured by `migrate diff`.

---

## 10. Multi-Phase Migration Patterns

### Adding a Unique Constraint with Existing Data

Real scenario: `@@unique([userId, name])` on BestieProfile when duplicates might exist.

**Phase 1** — Find and resolve duplicates:
```sql
SELECT "userId", "name", COUNT(*) FROM "BestieProfile"
GROUP BY "userId", "name" HAVING COUNT(*) > 1;

DELETE FROM "BestieProfile" a USING "BestieProfile" b
WHERE a."userId" = b."userId" AND a."name" = b."name"
  AND a."createdAt" < b."createdAt";
```

**Phase 2** — Add constraint. **Phase 3** — Add app-level validation.

### Splitting a Table

If User model gets too wide:

**Phase 1**: Create UserProfile with FK. **Phase 2**: Backfill from User. **Phase 3**: Update app code. **Phase 4**: Drop columns from User (separate deploy).

### Changing a Column Type (Widening)

```sql
-- Int to Float (safe widening)
ALTER TABLE "Agent" ALTER COLUMN "sortOrder" TYPE DOUBLE PRECISION
  USING "sortOrder"::double precision;
```

Narrowing conversions (String->Int, Float->Int) require data validation first.

---

## 11. Neon-Specific Strategies

### Connection Pooling

Migrations MUST use direct connection, not PgBouncer pooler:

```env
# Migrations (direct — no "-pooler" in hostname)
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Application (pooled — note "-pooler")
DATABASE_URL="postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
```

### Branch-Based Migration Testing

```bash
# Create branch from production
neonctl branches create --project-id <id> --name migration-test --parent main

# Test migration on branch
DATABASE_URL="<branch-url>" npx prisma migrate deploy

# Verify, then apply to production
DATABASE_URL="<production-url>" npx prisma migrate deploy

# Clean up
neonctl branches delete --project-id <id> --branch migration-test
```

### Monitor Storage

```sql
SELECT schemaname || '.' || tablename AS table,
  pg_size_pretty(pg_total_relation_size(schemaname || '.' || tablename)) AS total
FROM pg_tables WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname || '.' || tablename) DESC;
```

---

## 12. Pre-Flight Checklist

### Before Writing
- [ ] Backward-compatible with currently deployed code?
- [ ] Part of a multi-phase plan?
- [ ] Needs manual SQL editing? (renames, custom indexes, backfills)
- [ ] Any enum removals/renames? (custom SQL required)
- [ ] Every NOT NULL column has @default?

### Before Deploying
- [ ] Tested on Neon branch?
- [ ] Using direct connection URL (not pooler)?
- [ ] App code works with both old and new schema?
- [ ] Rollback plan documented?
- [ ] Large table lock time estimated? (CONCURRENTLY for indexes)

### After Deploying
- [ ] `prisma migrate status` shows all applied?
- [ ] App healthy in Vercel logs?
- [ ] No unexpected NULLs in new columns?

### Vercel Build Order

```json
{ "vercel-build": "prisma generate && prisma migrate deploy && next build" }
```

If migration fails, build fails, old deployment stays live. This is your safety net.

---

## 13. Emergency Runbook

### Migration failed, deploy stuck

```bash
DATABASE_URL="<prod>" npx prisma migrate status
# Fix forward or roll back manually, then resolve
```

### Table locked, queries timing out

```sql
SELECT pid, state, query, now() - query_start AS duration
FROM pg_stat_activity WHERE state != 'idle' ORDER BY duration DESC;

SELECT pg_cancel_backend(<pid>);      -- graceful
SELECT pg_terminate_backend(<pid>);   -- forced
```

### Wrong migration applied

Prisma has no rollback. Write reverse SQL as a new forward migration:
```bash
npx prisma migrate dev --name revert_bad_change --create-only
# Write reverse SQL, then apply
```

### Neon unreachable

1. Check https://neonstatus.com
2. Check compute suspension (auto-wakes on connection)
3. Verify connection string (pooler vs direct)
4. Check Neon dashboard for resource limits

---

## Quick Reference

| Task | Safe? | Notes |
|------|-------|-------|
| Add nullable column | YES | Instant |
| Add column with @default | YES | Instant (constant defaults) |
| Add enum value | YES | Non-transactional, irreversible |
| Add index | YES | Use CONCURRENTLY on large tables |
| Rename with @map | YES | Zero SQL |
| Drop column | 2-STEP | Remove from schema first, drop later |
| Remove enum value | CUSTOM SQL | Create new type, migrate, drop old |
| Rename column in DB | 4-PHASE | Add new, dual-write, switch, drop old |
| NOT NULL without default | NEVER | Will fail on existing rows |

---

*Playbook v1.0.0 | 2026-03-09 | Prisma 7.4.2, PostgreSQL 16, Neon, Vercel*
