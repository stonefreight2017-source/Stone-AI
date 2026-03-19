# DB-1: Prisma 7.4.2 Schema Conventions & Migration Safety

## Purpose
Operational reference for the Senior Database Engineer working on Stone AI's Prisma schema. Covers naming conventions, model relationships, migration workflow, rollback procedures, Prisma 7.x gotchas, and schema smells found in the actual codebase.

---

## Current Implementation (from actual codebase)

### Stack
- **ORM**: Prisma 7.4.2 with `@prisma/adapter-pg` (PrismaPg driver adapter)
- **Database**: PostgreSQL 16 + pgvector on Neon (serverless)
- **Generator**: `prisma-client` outputting to `../src/generated/prisma`
- **Schema file**: `prisma/schema.prisma` (single file, no multi-file schema)
- **No migration history**: Project uses `prisma db push` (no `migrations/` directory exists)

### All Models (18 Prisma models + 1 raw SQL table)

| Model | Primary Key | Key Relations | Notable Fields |
|---|---|---|---|
| **User** | `cuid()` | Has many: Conversations, UsageRecords, DailyUsages, UpgradeOffers, ApiKeys, AgentMemories, BestieMemories, ForumPosts, ForumReplies, ForumLikes, Feedbacks, Notifications, Referrals (both sides), BestieProfiles | `clerkId` (unique), `email` (unique), `stripeCustomerId` (unique), `stripeSubscriptionId` (unique), `referralCode` (unique), `badges` (String[]), `easterEggClaims` (String[]) |
| **Conversation** | `cuid()` | Belongs to: User, Agent?, BestieProfile?; Has many: Messages | `agentId` (nullable, SetNull on delete), `bestieId` (nullable, SetNull on delete) |
| **Message** | `cuid()` | Belongs to: Conversation (Cascade) | `content` (Text), `role` (enum), `mode` (enum nullable) |
| **UsageRecord** | `cuid()` | Belongs to: User (Cascade) | `@@unique([userId, billingCycleStart])` |
| **DailyUsage** | `cuid()` | Belongs to: User (Cascade) | `date` (Date type), `@@unique([userId, date])` |
| **UpgradeOffer** | `cuid()` | Belongs to: User (Cascade) | `@@unique([userId, currentTier, targetTier])` |
| **FeatureFlag** | `cuid()` | None | `@@map("feature_flags")` — only model with custom table name |
| **InviteCode** | `cuid()` | Has many: InviteRedemptions | `code` (unique) |
| **InviteRedemption** | `cuid()` | Belongs to: InviteCode (Cascade) | `@@unique([inviteCodeId, userId])` |
| **ApiKey** | `cuid()` | Belongs to: User (Cascade) | `keyHash` (unique), `revokedAt` (nullable soft-delete) |
| **Agent** | `cuid()` | Has many: KnowledgeChunks, AgentMemories, Conversations | `slug` (unique), `systemPrompt` (Text) |
| **AgentKnowledgeChunk** | `cuid()` | Belongs to: Agent (Cascade) | `embedding` Unsupported("vector(768)") nullable — pgvector column |
| **AgentMemory** | `cuid()` | Belongs to: Agent (Cascade), User (Cascade) | `@@unique([agentId, userId, key])` — key-value per user per agent |
| **Referral** | `cuid()` | Belongs to: User x2 (named relations) | `@@unique([referrerId, referredUserId])` |
| **ForumPost** | `cuid()` | Belongs to: User (Cascade); Has many: ForumReplies, ForumLikes | Denormalized `likes` counter |
| **ForumReply** | `cuid()` | Belongs to: User (Cascade), ForumPost (Cascade) | Denormalized `likes` counter |
| **ForumLike** | `cuid()` | Belongs to: User (Cascade), ForumPost (Cascade) | `@@unique([userId, postId])` |
| **Feedback** | `cuid()` | Belongs to: User (Cascade) | `type` (enum), `resolved` (Boolean) |
| **Notification** | `cuid()` | Belongs to: User (Cascade) | `read` (Boolean), sorted index on createdAt DESC |
| **BestieProfile** | `cuid()` | Belongs to: User (Cascade); Has many: Conversations, BestieMemories | `personality` (Json), `@@unique([userId, name])` |
| **BestieMemory** | `cuid()` | Belongs to: BestieProfile (Cascade), User (Cascade) | `@@unique([bestieId, userId, key])` |
| **AuditLog** (raw SQL) | `UUID` | None — created via `$executeRawUnsafe` | Not in Prisma schema; managed in `src/lib/audit.ts` |

### Enums (7 total)
`Tier` (FREE, STARTER, PLUS, SMART, PRO), `SubscriptionStatus` (INACTIVE, ACTIVE, PAST_DUE, CANCELED), `Role` (USER, ASSISTANT, SYSTEM), `Mode` (LOCAL, SMART), `AgentCategory` (BUSINESS, CONTENT, MARKETING, EDUCATION, TECHNICAL, FINANCE), `ReferralStatus` (PENDING, QUALIFIED, REWARDED), `ForumCategory` (GENERAL, TIPS, SHOWCASE, AGENTS, BUSINESS, TECHNICAL, FEEDBACK), `FeedbackType` (QUESTION, BUG, FEATURE)

### Relationship Map (cascade behavior)
```
User ──< Conversation ──< Message          (all Cascade)
User ──< UsageRecord                       (Cascade)
User ──< DailyUsage                        (Cascade)
User ──< UpgradeOffer                      (Cascade)
User ──< ApiKey                            (Cascade)
User ──< AgentMemory >── Agent             (both Cascade)
User ──< BestieProfile ──< BestieMemory    (Cascade)
User ──< BestieProfile ──< Conversation    (SetNull on bestie delete)
User ──< ForumPost ──< ForumReply          (Cascade)
User ──< ForumPost ──< ForumLike           (Cascade)
User ──< Feedback                          (Cascade)
User ──< Notification                      (Cascade)
User ──< Referral (as Referrer)            (Cascade)
User ──< Referral (as ReferredUser)        (Cascade)
Agent ──< AgentKnowledgeChunk              (Cascade)
Agent ──< Conversation                     (SetNull on agent delete)
InviteCode ──< InviteRedemption            (Cascade)
```

Key pattern: Deleting a User cascades to almost everything. Deleting an Agent or BestieProfile sets the FK to null on Conversations (preserving chat history).

---

## Conventions & Standards

### Naming Conventions (as observed in schema)
- **Table names**: PascalCase, singular (`User`, `ForumPost`, `AgentKnowledgeChunk`)
- **Exception**: `FeatureFlag` maps to `feature_flags` via `@@map` — the ONLY model with a custom table name
- **Field names**: camelCase (`userId`, `createdAt`, `stripeCustomerId`)
- **Relation fields**: camelCase, match the related model name (`user`, `agent`, `conversations`)
- **Named relations**: Only used for self-referential or multi-FK (`@relation("Referrer")`, `@relation("ReferredUser")`)
- **Enum names**: PascalCase (`Tier`, `AgentCategory`)
- **Enum values**: SCREAMING_SNAKE_CASE (`PAST_DUE`, `FEATURE`)
- **IDs**: All use `@id @default(cuid())` — no UUIDs in Prisma models (AuditLog raw table uses UUID)
- **Timestamps**: `createdAt DateTime @default(now())` on every model; `updatedAt DateTime @updatedAt` where mutation is expected
- **Text fields**: Explicitly `@db.Text` for long content (`content`, `systemPrompt`, `description`, `message`, `adminNote`, `value`)
- **Indexes**: Explicitly declared with `@@index` on foreign keys and common query patterns
- **Unique constraints**: `@@unique` for composite uniqueness (not just `@unique` on single fields)

### Index Inventory (all explicit indexes)
| Model | Index | Type |
|---|---|---|
| Conversation | `[userId, updatedAt]` | Composite |
| Conversation | `[agentId]` | Single FK |
| Conversation | `[bestieId]` | Single FK |
| Message | `[conversationId, createdAt]` | Composite (query pattern) |
| UsageRecord | `[userId]` | Single FK |
| DailyUsage | `[userId, date]` | Composite (redundant with unique) |
| InviteCode | `[code]` | Single (redundant with unique) |
| ApiKey | `[userId]` | Single FK |
| ApiKey | `[keyHash]` | Single (redundant with unique) |
| Agent | `[category]` | Single |
| Agent | `[requiredTier]` | Single |
| AgentKnowledgeChunk | `[agentId]` | Single FK |
| AgentMemory | `[agentId, userId]` | Composite FK |
| Referral | `[referrerId, status]` | Composite |
| ForumPost | `[category, createdAt DESC]` | Composite sorted |
| ForumPost | `[userId]` | Single FK |
| ForumPost | `[pinned, createdAt DESC]` | Composite sorted |
| ForumReply | `[postId, createdAt]` | Composite |
| ForumReply | `[userId]` | Single FK |
| Feedback | `[resolved, createdAt]` | Composite |
| Feedback | `[userId]` | Single FK |
| Notification | `[userId, read, createdAt DESC]` | Composite sorted |
| BestieProfile | `[userId]` | Single FK |
| BestieMemory | `[bestieId, userId]` | Composite FK |

---

## Migration Workflow

### Current State: `prisma db push` (No Migration History)
The project has **no `migrations/` directory**. Schema changes are applied via `prisma db push`, which syncs the schema directly without tracking migration history. This is fine for early development but becomes risky at scale.

### Recommended Workflow (for production changes on Neon)

**Safe schema change procedure:**

1. **Create a Neon branch** from main (instant, copy-on-write):
   ```
   # Via Neon console or CLI
   neonctl branches create --name schema-change-YYYY-MM-DD
   ```

2. **Test the change on the branch**:
   ```bash
   # Point to branch connection string
   DATABASE_URL="<branch-url>" npx prisma db push
   # Verify: npx prisma studio (inspect on branch)
   ```

3. **If using migrations (recommended to adopt)**:
   ```bash
   npx prisma migrate dev --name descriptive_change_name
   # This creates SQL in prisma/migrations/ and applies it
   ```

4. **Apply to production**:
   ```bash
   # For db push workflow:
   DATABASE_URL="<production-url>" npx prisma db push

   # For migrate workflow:
   DATABASE_URL="<production-url>" npx prisma migrate deploy
   ```

5. **Regenerate client** (happens automatically on `build`):
   ```bash
   npx prisma generate
   # Note: package.json has "build": "prisma generate && next build"
   # and "postinstall": "prisma generate"
   ```

### Rollback Procedures

**With `db push` (current approach):**
- No built-in rollback. You must manually reverse changes.
- Neon branching is your safety net: restore from a branch or use point-in-time restore.
- For destructive changes (dropping columns/tables), there is NO undo without a backup.

**With `migrate` (recommended to adopt):**
- Prisma does not auto-generate down migrations.
- Write manual rollback SQL and store alongside migrations.
- Use Neon's point-in-time restore as the nuclear option.

**Emergency rollback checklist:**
1. Revert the schema change in `schema.prisma`
2. Run `prisma db push` (or `migrate deploy` with rollback migration)
3. Redeploy the previous application version on Vercel
4. If data was lost: restore from Neon point-in-time recovery

---

## Prisma 7.x Gotchas (specific to this codebase)

### 1. Driver Adapter Required
Prisma 7.x dropped the built-in engine. Stone AI uses `@prisma/adapter-pg` (PrismaPg):
```typescript
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
return new PrismaClient({ adapter });
```
**Gotcha**: The old `new PrismaClient()` without an adapter will NOT work in Prisma 7.x.

### 2. `Unsupported` Type for pgvector
The `embedding` field uses `Unsupported("vector(768)")` because Prisma has no native vector type. This means:
- You CANNOT read/write this field through Prisma's typed API
- You MUST use `$queryRawUnsafe` for all vector operations
- Prisma will skip this column in normal select/create/update operations

### 3. `prisma generate` Output Location
Generator outputs to `../src/generated/prisma` (not the default `node_modules`). This is committed or generated at build time. After ANY schema change, run `prisma generate` or the types will be stale.

### 4. Raw SQL Tables Outside Prisma
`AuditLog` is created via raw SQL in `src/lib/audit.ts` and is NOT in the Prisma schema. `prisma db push` will NOT touch it, but `prisma migrate reset` WILL drop it. Keep track of out-of-schema tables.

### 5. Singleton Pattern
`db.ts` uses the global singleton pattern to avoid connection exhaustion in development (Next.js hot reload):
```typescript
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const db = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

### 6. No `previewFeatures` Enabled
The schema has no `previewFeatures` in the generator block. If you need features like `fullTextSearch`, `multiSchema`, or `views`, they must be explicitly enabled.

---

## Schema Smells & Risks

### CRITICAL: No Vector Index on `AgentKnowledgeChunk.embedding`
The `embedding` column has NO index. Every similarity search does a sequential scan. This is acceptable at low volume (hundreds of chunks) but will degrade as knowledge bases grow.
**Fix**: Create an HNSW index (see DB-2 seed).

### MEDIUM: Denormalized `likes` Counter on ForumPost/ForumReply
`ForumPost.likes` and `ForumReply.likes` are denormalized counters alongside the `ForumLike` join table. Risk of counter drift if the increment/decrement logic has bugs. Consider a database trigger or periodic reconciliation query.

### MEDIUM: No `updatedAt` on Several Models
Models missing `@updatedAt`: `Message`, `UsageRecord`, `InviteCode`, `InviteRedemption`, `ForumReply`, `ForumLike`, `Notification`, `Referral`. If any of these are ever updated (not just created), you lose the mutation timestamp.

### LOW: Redundant Indexes
- `InviteCode`: `@@index([code])` is redundant with `@unique` on `code` (unique constraints create implicit indexes)
- `ApiKey`: `@@index([keyHash])` is redundant with `@unique` on `keyHash`
- `DailyUsage`: `@@index([userId, date])` is redundant with `@@unique([userId, date])`
These don't hurt performance but add minor write overhead and clutter.

### LOW: N+1 Risk Patterns
- Agent seeding (`src/lib/agent-seed.ts`) loops through agents one-by-one with upsert + count + create. At 40 agents this is fine; at scale, batch with `createMany`.
- Forum post listing with replies/likes could trigger N+1 if not using `include` carefully.

### LOW: String Arrays for Badges/Claims
`User.badges` and `User.easterEggClaims` use `String[]` (Postgres text arrays). This works but makes querying "all users with badge X" require `@>` array contains operators. If badge logic grows complex, consider a join table.

### INFO: No Soft Delete Pattern
All deletions are hard deletes with cascading. If audit/recovery is needed beyond the AuditLog table, consider adding a `deletedAt` column to key models (User, Conversation).

---

## DO / DON'T Rules

### DO
- Always create a Neon branch before testing schema changes against production data
- Always run `prisma generate` after schema changes (or rely on `npm run build`)
- Use `@db.Text` for any field that could exceed 255 characters
- Add `@@index` on foreign key columns used in WHERE/JOIN clauses
- Use `@@unique` for composite uniqueness constraints (Prisma enforces at DB level)
- Use `Cascade` for child records that have no meaning without the parent
- Use `SetNull` when the child record should survive parent deletion (Conversations keep existing after Agent/Bestie deletion)
- Use `$queryRawUnsafe` with parameterized arguments (never string interpolation) for vector operations
- Keep the AuditLog raw table in mind when doing `migrate reset`

### DON'T
- Don't add fields to the schema without checking if an index is needed for the query pattern
- Don't use `prisma migrate reset` in production (drops all tables including raw SQL ones)
- Don't create new `Unsupported` type columns without documenting the raw SQL needed to operate on them
- Don't remove a field/model without verifying cascade effects — check the relationship map above
- Don't bypass the singleton pattern in `db.ts` — creating multiple PrismaClient instances exhausts connections
- Don't assume `prisma db push` is reversible — it is not; Neon branching is your safety net
- Don't add `@unique` AND `@@index` on the same field — the unique constraint already creates an index
- Don't use `prisma migrate dev` against the production DATABASE_URL — always double-check the connection string

---

## Quick Reference

```bash
# Generate client after schema change
npx prisma generate

# Push schema to database (no migration history)
npx prisma db push

# Create migration (if adopting migrate workflow)
npx prisma migrate dev --name add_field_description

# Deploy migrations to production
npx prisma migrate deploy

# Check migration status
npx prisma migrate status

# Visual database browser
npx prisma studio

# Test database connectivity
npx prisma db execute --stdin <<< "SELECT 1"

# Check table row counts
npx prisma db execute --stdin <<< "SELECT relname, n_live_tup FROM pg_stat_user_tables ORDER BY n_live_tup DESC"

# Neon branch for safe testing
neonctl branches create --name schema-change-$(date +%Y%m%d)
```

### Key File Paths
| File | Purpose |
|---|---|
| `prisma/schema.prisma` | Single source of truth for schema |
| `src/generated/prisma/` | Generated Prisma client (auto-generated) |
| `src/lib/db.ts` | Singleton PrismaClient with PrismaPg adapter |
| `src/lib/audit.ts` | Raw SQL AuditLog table (outside Prisma schema) |
| `src/lib/embeddings.ts` | pgvector operations via `$queryRawUnsafe` |
| `src/lib/agent-seed.ts` | Agent + knowledge chunk seeding logic |
