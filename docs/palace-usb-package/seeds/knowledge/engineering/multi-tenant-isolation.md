# Multi-Tenant Isolation for Stone AI Tools

## Seed Classification
- **Domain**: Backend Engineering / Database Architecture
- **Platform**: Stone AI Tools (tools.stone-ai.net)
- **Complexity**: Advanced
- **Prerequisites**: PostgreSQL, Prisma, security architecture
- **Last Updated**: 2026-03-09

---

## 1. Multi-Tenancy Architecture Overview

### Isolation Strategy Selection

Stone AI Tools uses a **shared database with row-level security (RLS)** model. This balances cost efficiency with strong data isolation.

```
Multi-Tenancy Models Compared:

┌──────────────────────────────────────────────────────────────┐
│                                                              │
│  Model 1: Separate Database per Tenant                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                       │
│  │  DB: T1 │ │  DB: T2 │ │  DB: T3 │  ← Strongest isolation │
│  └─────────┘ └─────────┘ └─────────┘  ← Highest cost        │
│                                        ← Hard to query across │
│                                                              │
│  Model 2: Shared Database, Separate Schemas                  │
│  ┌──────────────────────────────────┐                        │
│  │  DB: Stone_AI_Tools              │                        │
│  │  ┌────────┐ ┌────────┐ ┌──────┐ │  ← Good isolation      │
│  │  │Schema  │ │Schema  │ │Schema│ │  ← Medium cost          │
│  │  │  T1    │ │  T2    │ │  T3  │ │  ← Migration complexity │
│  │  └────────┘ └────────┘ └──────┘ │                        │
│  └──────────────────────────────────┘                        │
│                                                              │
│  Model 3: Shared Database, Row-Level Security  ★ CHOSEN ★   │
│  ┌──────────────────────────────────┐                        │
│  │  DB: Stone_AI_Tools              │                        │
│  │  ┌──────────────────────────────┐│                        │
│  │  │  All tenants in same tables  ││  ← Good isolation (RLS)│
│  │  │  tenant_id column on every   ││  ← Lowest cost         │
│  │  │  row, RLS policies enforce   ││  ← Easy migrations     │
│  │  │  tenant boundaries           ││  ← Simple queries      │
│  │  └──────────────────────────────┘│                        │
│  └──────────────────────────────────┘                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘

Decision: Model 3 — Row-Level Security
Rationale:
- Stone AI Tools targets thousands of small-to-medium tenants
- Cost efficiency is critical for the marketplace model
- Neon Postgres supports RLS natively
- Single schema simplifies migrations and Prisma management
- RLS provides database-level enforcement (not just app-level)
```

---

## 2. Schema Design for Multi-Tenancy

### 2.1 Core Tenant Model

```prisma
// File: prisma/schema.prisma (Stone AI Tools)

model Tenant {
  id              String        @id @default(cuid())
  name            String
  slug            String        @unique
  plan            TenantPlan    @default(FREE)
  status          TenantStatus  @default(ACTIVE)

  // Billing
  stripeCustomerId    String?   @unique
  stripeSubscriptionId String?
  billingEmail         String

  // Limits
  monthlyApiLimit     Int       @default(1000)
  rateLimit           Int       @default(100) // per minute
  maxApiKeys          Int       @default(3)

  // Metadata
  settings        Json          @default("{}")
  metadata        Json          @default("{}")

  // Timestamps
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  suspendedAt     DateTime?

  // Relations
  apiKeys         ApiKey[]
  members         TenantMember[]
  usageRecords    UsageRecord[]
  webhooks        Webhook[]
  auditLogs       AuditLog[]

  @@index([slug])
  @@index([stripeCustomerId])
  @@index([status])
  @@map("tenants")
}

enum TenantPlan {
  FREE
  STARTER
  PLUS
  PRO
  ENTERPRISE
}

enum TenantStatus {
  ACTIVE
  SUSPENDED
  PENDING_DELETION
  DELETED
}

model TenantMember {
  id          String          @id @default(cuid())
  tenantId    String
  userId      String
  role        TenantRole      @default(MEMBER)
  invitedAt   DateTime        @default(now())
  joinedAt    DateTime?

  tenant      Tenant          @relation(fields: [tenantId], references: [id])

  @@unique([tenantId, userId])
  @@index([userId])
  @@map("tenant_members")
}

enum TenantRole {
  OWNER
  ADMIN
  MEMBER
  READONLY
}
```

### 2.2 Tenant-Scoped Data Models

Every data table that stores tenant-specific data includes a `tenantId` column and a composite index.

```prisma
model ApiKey {
  id            String      @id @default(cuid())
  tenantId      String
  name          String
  keyHash       String      @unique    // SHA-256 hash of the key
  keyPrefix     String                 // First 8 chars for identification
  scopes        String[]    @default(["agents:read", "agents:invoke"])
  lastUsedAt    DateTime?
  expiresAt     DateTime?
  revokedAt     DateTime?
  createdBy     String                 // userId who created it

  // Metadata
  metadata      Json        @default("{}")
  ipAllowlist   String[]    @default([])

  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt

  tenant        Tenant      @relation(fields: [tenantId], references: [id])
  usageRecords  UsageRecord[]

  @@index([tenantId])
  @@index([keyPrefix])
  @@index([tenantId, revokedAt])
  @@map("api_keys")
}

model UsageRecord {
  id            String      @id @default(cuid())
  tenantId      String
  apiKeyId      String?

  // What was used
  agentId       String
  endpoint      String
  method        String

  // Usage metrics
  requestCount  Int         @default(1)
  tokenCount    Int         @default(0)
  computeTimeMs Int         @default(0)

  // Billing
  costMicros    Int         @default(0) // Cost in microdollars (1/1,000,000)
  billed        Boolean     @default(false)
  billingPeriod String                  // "2026-03" format

  // Request context
  statusCode    Int
  responseTimeMs Int
  region        String?

  createdAt     DateTime    @default(now())

  tenant        Tenant      @relation(fields: [tenantId], references: [id])
  apiKey        ApiKey?     @relation(fields: [apiKeyId], references: [id])

  @@index([tenantId, billingPeriod])
  @@index([tenantId, createdAt])
  @@index([apiKeyId, createdAt])
  @@index([agentId, createdAt])
  @@map("usage_records")
}

model AuditLog {
  id          String    @id @default(cuid())
  tenantId    String
  userId      String?
  action      String    // "api_key.created", "webhook.deleted", etc.
  resource    String    // Resource type
  resourceId  String?   // Resource ID
  details     Json      @default("{}")
  ipAddress   String?
  userAgent   String?

  createdAt   DateTime  @default(now())

  tenant      Tenant    @relation(fields: [tenantId], references: [id])

  @@index([tenantId, createdAt])
  @@index([tenantId, action])
  @@index([tenantId, resource, resourceId])
  @@map("audit_logs")
}
```

---

## 3. Row-Level Security (RLS) Implementation

### 3.1 PostgreSQL RLS Policies

RLS provides database-level enforcement of tenant boundaries. Even if application code has a bug, the database itself prevents cross-tenant data access.

```sql
-- File: prisma/migrations/XXXXXX_enable_rls/migration.sql

-- Enable RLS on all tenant-scoped tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;

-- Force RLS even for table owners (prevents bypass)
ALTER TABLE api_keys FORCE ROW LEVEL SECURITY;
ALTER TABLE usage_records FORCE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE webhooks FORCE ROW LEVEL SECURITY;
ALTER TABLE tenant_members FORCE ROW LEVEL SECURITY;

-- Create the tenant context setting function
-- Application sets this before every query
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS TEXT AS $$
  SELECT current_setting('app.current_tenant_id', TRUE);
$$ LANGUAGE SQL STABLE;

-- API Keys: Tenant can only see their own keys
CREATE POLICY api_keys_tenant_isolation ON api_keys
  USING (tenant_id = current_tenant_id());

CREATE POLICY api_keys_tenant_insert ON api_keys
  FOR INSERT
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY api_keys_tenant_update ON api_keys
  FOR UPDATE
  USING (tenant_id = current_tenant_id())
  WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY api_keys_tenant_delete ON api_keys
  FOR DELETE
  USING (tenant_id = current_tenant_id());

-- Usage Records: Tenant can only see their own usage
CREATE POLICY usage_records_tenant_isolation ON usage_records
  USING (tenant_id = current_tenant_id());

CREATE POLICY usage_records_tenant_insert ON usage_records
  FOR INSERT
  WITH CHECK (tenant_id = current_tenant_id());

-- Audit Logs: Tenant can only see their own audit logs (read-only for tenants)
CREATE POLICY audit_logs_tenant_read ON audit_logs
  FOR SELECT
  USING (tenant_id = current_tenant_id());

-- System role for internal operations (bypasses RLS)
CREATE ROLE stone_ai_system;
ALTER TABLE api_keys OWNER TO stone_ai_system;
ALTER TABLE usage_records OWNER TO stone_ai_system;
-- Table owners bypass RLS by default

-- Application role (RLS enforced)
CREATE ROLE stone_ai_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO stone_ai_app;

-- Admin role (can query across tenants for analytics)
CREATE ROLE stone_ai_admin;
CREATE POLICY admin_all_access ON api_keys TO stone_ai_admin USING (true);
CREATE POLICY admin_usage_access ON usage_records TO stone_ai_admin USING (true);
CREATE POLICY admin_audit_access ON audit_logs TO stone_ai_admin USING (true);
```

### 3.2 Setting Tenant Context Per Request

```typescript
// File: src/lib/db/tenant-context.ts

import { PrismaClient } from '@prisma/client';

// Extended Prisma client that sets tenant context
class TenantAwarePrismaClient {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Execute a callback within a tenant context.
   * All queries inside the callback are scoped to the tenant via RLS.
   */
  async withTenant<T>(tenantId: string, callback: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      // Set the tenant context for RLS
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, TRUE)`;

      return callback(tx as unknown as PrismaClient);
    });
  }

  /**
   * Execute a callback with system privileges (bypasses RLS).
   * Use sparingly — only for cross-tenant operations like billing aggregation.
   */
  async withSystem<T>(callback: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      // Set role to system (RLS bypass)
      await tx.$executeRaw`SET LOCAL ROLE stone_ai_system`;

      return callback(tx as unknown as PrismaClient);
    });
  }

  /**
   * Get the raw Prisma client for non-tenant-scoped operations.
   * WARNING: Does not enforce RLS. Use withTenant() for tenant data.
   */
  get raw(): PrismaClient {
    return this.prisma;
  }
}

// Singleton
export const db = new TenantAwarePrismaClient();
```

### 3.3 Middleware Integration

```typescript
// File: src/gateway/middleware/tenant-context.ts

async function resolveTenant(req: GatewayRequest): Promise<PipelineResult> {
  // Tenant is resolved from the authenticated API key
  const apiKeyHash = req.metadata.apiKeyHash as string;

  if (!apiKeyHash) {
    return {
      action: 'short-circuit',
      statusCode: 401,
      body: { error: 'missing_api_key', message: 'No API key provided' },
    };
  }

  // Look up tenant from API key (cached in Redis)
  const cacheKey = `tenant:apikey:${apiKeyHash}`;
  let tenantData = await redis.get(cacheKey);

  if (!tenantData) {
    // Cache miss — query database
    const apiKey = await db.raw.apiKey.findUnique({
      where: { keyHash: apiKeyHash },
      include: {
        tenant: {
          select: {
            id: true,
            plan: true,
            status: true,
            monthlyApiLimit: true,
            rateLimit: true,
            settings: true,
          },
        },
      },
    });

    if (!apiKey || apiKey.revokedAt) {
      return {
        action: 'short-circuit',
        statusCode: 401,
        body: { error: 'invalid_api_key', message: 'API key is invalid or revoked' },
      };
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return {
        action: 'short-circuit',
        statusCode: 401,
        body: { error: 'expired_api_key', message: 'API key has expired' },
      };
    }

    tenantData = JSON.stringify({
      tenantId: apiKey.tenantId,
      plan: apiKey.tenant.plan,
      status: apiKey.tenant.status,
      scopes: apiKey.scopes,
      limits: {
        monthly: apiKey.tenant.monthlyApiLimit,
        ratePerMinute: apiKey.tenant.rateLimit,
      },
      ipAllowlist: apiKey.ipAllowlist,
    });

    // Cache for 5 minutes
    await redis.setex(cacheKey, 300, tenantData);

    // Update last used timestamp (fire-and-forget)
    db.raw.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    }).catch(() => {}); // Non-critical
  }

  const tenant = JSON.parse(tenantData as string);

  // Check tenant status
  if (tenant.status !== 'ACTIVE') {
    return {
      action: 'short-circuit',
      statusCode: 403,
      body: {
        error: 'tenant_suspended',
        message: 'Your account has been suspended',
        support_url: 'https://tools.stone-ai.net/support',
      },
    };
  }

  // Check IP allowlist
  if (tenant.ipAllowlist.length > 0) {
    const clientIp = req.raw.ip;
    if (!tenant.ipAllowlist.includes(clientIp)) {
      return {
        action: 'short-circuit',
        statusCode: 403,
        body: {
          error: 'ip_not_allowed',
          message: 'Request IP is not in the allowlist for this API key',
        },
      };
    }
  }

  // Set tenant context on request
  req.tenantId = tenant.tenantId;
  req.metadata.tenantPlan = tenant.plan;
  req.metadata.scopes = tenant.scopes;
  req.metadata.tenantLimits = tenant.limits;

  return { action: 'continue' };
}
```

---

## 4. Tenant Provisioning

### 4.1 Tenant Creation Flow

```typescript
// File: src/services/tenant-provisioning.ts

interface CreateTenantInput {
  name: string;
  slug: string;
  billingEmail: string;
  plan: TenantPlan;
  ownerId: string;
}

class TenantProvisioningService {
  async createTenant(input: CreateTenantInput): Promise<Tenant> {
    // Validate slug uniqueness
    const existing = await db.raw.tenant.findUnique({
      where: { slug: input.slug },
    });

    if (existing) {
      throw new ConflictError('tenant_slug_taken', `Slug "${input.slug}" is already in use`);
    }

    // Validate slug format
    if (!/^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/.test(input.slug)) {
      throw new ValidationError('invalid_slug', 'Slug must be 3-50 chars, lowercase alphanumeric and hyphens');
    }

    // Create tenant with all related resources in a transaction
    const tenant = await db.raw.$transaction(async (tx) => {
      // 1. Create the tenant
      const tenant = await tx.tenant.create({
        data: {
          name: input.name,
          slug: input.slug,
          billingEmail: input.billingEmail,
          plan: input.plan,
          monthlyApiLimit: PLAN_LIMITS[input.plan].monthlyApiLimit,
          rateLimit: PLAN_LIMITS[input.plan].ratePerMinute,
          maxApiKeys: PLAN_LIMITS[input.plan].maxApiKeys,
          settings: {
            webhookSecret: generateWebhookSecret(),
            defaultRegion: 'us-east-1',
          },
        },
      });

      // 2. Add the owner as a member
      await tx.tenantMember.create({
        data: {
          tenantId: tenant.id,
          userId: input.ownerId,
          role: 'OWNER',
          joinedAt: new Date(),
        },
      });

      // 3. Create the initial API key
      const { key, hash, prefix } = generateApiKey();
      await tx.apiKey.create({
        data: {
          tenantId: tenant.id,
          name: 'Default API Key',
          keyHash: hash,
          keyPrefix: prefix,
          scopes: ['agents:read', 'agents:invoke'],
          createdBy: input.ownerId,
        },
      });

      // 4. Create initial audit log entry
      await tx.auditLog.create({
        data: {
          tenantId: tenant.id,
          userId: input.ownerId,
          action: 'tenant.created',
          resource: 'tenant',
          resourceId: tenant.id,
          details: {
            plan: input.plan,
            slug: input.slug,
          },
        },
      });

      return { tenant, apiKey: key };
    });

    // Post-creation async tasks (non-blocking)
    await Promise.allSettled([
      // Create Stripe customer
      this.createStripeCustomer(tenant),
      // Send welcome email
      this.sendWelcomeEmail(input.billingEmail, tenant),
      // Initialize usage counters in Redis
      this.initializeUsageCounters(tenant.id),
    ]);

    return tenant;
  }

  private async createStripeCustomer(tenant: Tenant): Promise<void> {
    const customer = await stripe.customers.create({
      email: tenant.billingEmail,
      name: tenant.name,
      metadata: {
        tenantId: tenant.id,
        plan: tenant.plan,
      },
    });

    await db.raw.tenant.update({
      where: { id: tenant.id },
      data: { stripeCustomerId: customer.id },
    });
  }

  private async initializeUsageCounters(tenantId: string): Promise<void> {
    const period = getCurrentBillingPeriod(); // "2026-03"
    await redis.set(`usage:${tenantId}:${period}:count`, '0');
    await redis.set(`usage:${tenantId}:${period}:tokens`, '0');
  }
}

// Plan limits configuration
const PLAN_LIMITS: Record<TenantPlan, PlanLimits> = {
  FREE: {
    monthlyApiLimit: 1_000,
    ratePerMinute: 100,
    maxApiKeys: 3,
    maxWebhooks: 1,
    maxMembers: 1,
    agentAccess: ['free'],
    features: [],
  },
  STARTER: {
    monthlyApiLimit: 25_000,
    ratePerMinute: 1_000,
    maxApiKeys: 5,
    maxWebhooks: 3,
    maxMembers: 3,
    agentAccess: ['free', 'starter'],
    features: ['webhooks'],
  },
  PLUS: {
    monthlyApiLimit: 100_000,
    ratePerMinute: 5_000,
    maxApiKeys: 10,
    maxWebhooks: 10,
    maxMembers: 10,
    agentAccess: ['free', 'starter', 'plus'],
    features: ['webhooks', 'analytics', 'priority_support'],
  },
  PRO: {
    monthlyApiLimit: 500_000,
    ratePerMinute: 20_000,
    maxApiKeys: 25,
    maxWebhooks: 25,
    maxMembers: 25,
    agentAccess: ['free', 'starter', 'plus', 'smart', 'pro'],
    features: ['webhooks', 'analytics', 'priority_support', 'custom_models', 'sla'],
  },
  ENTERPRISE: {
    monthlyApiLimit: -1, // Unlimited
    ratePerMinute: 100_000,
    maxApiKeys: 100,
    maxWebhooks: 100,
    maxMembers: 100,
    agentAccess: ['free', 'starter', 'plus', 'smart', 'pro'],
    features: ['webhooks', 'analytics', 'priority_support', 'custom_models', 'sla', 'dedicated_support', 'custom_agents'],
  },
};
```

### 4.2 API Key Generation

```typescript
// File: src/services/api-key.ts

import { randomBytes, createHash } from 'crypto';

interface GeneratedApiKey {
  key: string;     // Full key (only shown once)
  hash: string;    // SHA-256 hash (stored in DB)
  prefix: string;  // First 8 chars (for identification)
}

function generateApiKey(): GeneratedApiKey {
  // Format: sat_{random_32_bytes_base62}
  // "sat" = Stone AI Tools
  const randomPart = randomBytes(32).toString('base64url').slice(0, 43);
  const key = `sat_${randomPart}`;

  const hash = createHash('sha256').update(key).digest('hex');
  const prefix = key.slice(0, 12); // "sat_XXXXXXXX"

  return { key, hash, prefix };
}

// Verify an API key
function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

// Extract prefix for display
function getKeyPrefix(key: string): string {
  return key.slice(0, 12);
}

// Mask a key for display (e.g., in logs)
function maskApiKey(key: string): string {
  if (key.length < 12) return '***';
  return `${key.slice(0, 8)}...${key.slice(-4)}`;
}
```

---

## 5. Data Boundaries and Isolation Enforcement

### 5.1 Application-Level Isolation (Defense in Depth)

Even with RLS, the application layer enforces tenant boundaries as a second line of defense.

```typescript
// File: src/lib/db/tenant-scoped-queries.ts

/**
 * Tenant-scoped query builder.
 * Every query automatically includes tenant_id filter.
 * This is defense-in-depth on top of PostgreSQL RLS.
 */
class TenantScopedQueries {
  constructor(private tenantId: string) {}

  // API Keys
  async getApiKeys() {
    return db.withTenant(this.tenantId, (tx) =>
      tx.apiKey.findMany({
        where: {
          tenantId: this.tenantId, // Application-level filter
          revokedAt: null,
        },
        orderBy: { createdAt: 'desc' },
      })
    );
  }

  async createApiKey(input: CreateApiKeyInput) {
    // Enforce max API keys limit
    const count = await db.withTenant(this.tenantId, (tx) =>
      tx.apiKey.count({
        where: {
          tenantId: this.tenantId,
          revokedAt: null,
        },
      })
    );

    const limits = await this.getTenantLimits();
    if (count >= limits.maxApiKeys) {
      throw new LimitExceededError(
        'max_api_keys',
        `Maximum of ${limits.maxApiKeys} API keys reached. Upgrade your plan for more.`
      );
    }

    const { key, hash, prefix } = generateApiKey();

    const apiKey = await db.withTenant(this.tenantId, (tx) =>
      tx.apiKey.create({
        data: {
          tenantId: this.tenantId,
          name: input.name,
          keyHash: hash,
          keyPrefix: prefix,
          scopes: input.scopes,
          expiresAt: input.expiresAt,
          createdBy: input.userId,
          ipAllowlist: input.ipAllowlist ?? [],
        },
      })
    );

    // Audit log
    await this.auditLog('api_key.created', 'api_key', apiKey.id, {
      name: input.name,
      scopes: input.scopes,
    });

    return { ...apiKey, key }; // Return full key only on creation
  }

  async revokeApiKey(keyId: string) {
    const result = await db.withTenant(this.tenantId, (tx) =>
      tx.apiKey.updateMany({
        where: {
          id: keyId,
          tenantId: this.tenantId, // Double-check tenant ownership
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
        },
      })
    );

    if (result.count === 0) {
      throw new NotFoundError('api_key_not_found', 'API key not found or already revoked');
    }

    // Invalidate cached tenant data for this key
    await this.invalidateApiKeyCache(keyId);

    await this.auditLog('api_key.revoked', 'api_key', keyId, {});
  }

  // Usage
  async getUsageSummary(period: string) {
    return db.withTenant(this.tenantId, (tx) =>
      tx.usageRecord.groupBy({
        by: ['agentId'],
        where: {
          tenantId: this.tenantId,
          billingPeriod: period,
        },
        _sum: {
          requestCount: true,
          tokenCount: true,
          computeTimeMs: true,
          costMicros: true,
        },
        _count: true,
      })
    );
  }

  // Audit Logging
  private async auditLog(
    action: string,
    resource: string,
    resourceId: string,
    details: Record<string, unknown>
  ): Promise<void> {
    await db.withTenant(this.tenantId, (tx) =>
      tx.auditLog.create({
        data: {
          tenantId: this.tenantId,
          action,
          resource,
          resourceId,
          details,
        },
      })
    ).catch((err) => {
      // Audit log failures should not break the main operation
      logger.error('Audit log failed', { action, resource, error: err.message });
    });
  }

  private async getTenantLimits(): Promise<PlanLimits> {
    const tenant = await db.raw.tenant.findUniqueOrThrow({
      where: { id: this.tenantId },
      select: { plan: true },
    });
    return PLAN_LIMITS[tenant.plan];
  }

  private async invalidateApiKeyCache(keyId: string): Promise<void> {
    const key = await db.raw.apiKey.findUnique({
      where: { id: keyId },
      select: { keyHash: true },
    });
    if (key) {
      await redis.del(`tenant:apikey:${key.keyHash}`);
    }
  }
}

// Factory function
export function tenantQueries(tenantId: string): TenantScopedQueries {
  return new TenantScopedQueries(tenantId);
}
```

### 5.2 Cross-Tenant Query Prevention

```typescript
// File: src/lib/db/query-guard.ts

/**
 * Prisma middleware that prevents cross-tenant queries.
 * Validates that every query on tenant-scoped tables includes a tenantId filter.
 */
const TENANT_SCOPED_MODELS = [
  'ApiKey',
  'UsageRecord',
  'AuditLog',
  'Webhook',
  'TenantMember',
];

function tenantQueryGuard(params: any, next: any) {
  if (!TENANT_SCOPED_MODELS.includes(params.model)) {
    return next(params);
  }

  // Check that query includes tenantId in where clause
  const where = params.args?.where;

  if (params.action === 'findMany' || params.action === 'count' || params.action === 'aggregate') {
    if (!where?.tenantId) {
      logger.error('SECURITY: Cross-tenant query attempt detected', {
        model: params.model,
        action: params.action,
        where: JSON.stringify(where),
        stack: new Error().stack,
      });

      // In production, reject the query
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`Tenant-scoped query on ${params.model} must include tenantId`);
      }
    }
  }

  return next(params);
}

// Register middleware
prisma.$use(tenantQueryGuard);
```

---

## 6. Tenant Data Management

### 6.1 Tenant Suspension

```typescript
// File: src/services/tenant-lifecycle.ts

class TenantLifecycleService {
  async suspendTenant(tenantId: string, reason: string): Promise<void> {
    await db.raw.$transaction(async (tx) => {
      // 1. Update tenant status
      await tx.tenant.update({
        where: { id: tenantId },
        data: {
          status: 'SUSPENDED',
          suspendedAt: new Date(),
          metadata: {
            suspensionReason: reason,
          },
        },
      });

      // 2. Audit log
      await tx.auditLog.create({
        data: {
          tenantId,
          action: 'tenant.suspended',
          resource: 'tenant',
          resourceId: tenantId,
          details: { reason },
        },
      });
    });

    // 3. Invalidate all cached API keys for this tenant
    await this.invalidateAllTenantKeys(tenantId);

    // 4. Cancel Stripe subscription
    const tenant = await db.raw.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { stripeSubscriptionId: true, billingEmail: true },
    });

    if (tenant.stripeSubscriptionId) {
      await stripe.subscriptions.update(tenant.stripeSubscriptionId, {
        pause_collection: { behavior: 'void' },
      });
    }

    // 5. Send notification
    await sendEmail(tenant.billingEmail, 'account-suspended', { reason });
  }

  async reactivateTenant(tenantId: string): Promise<void> {
    await db.raw.tenant.update({
      where: { id: tenantId },
      data: {
        status: 'ACTIVE',
        suspendedAt: null,
      },
    });

    // Resume Stripe subscription
    const tenant = await db.raw.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { stripeSubscriptionId: true },
    });

    if (tenant.stripeSubscriptionId) {
      await stripe.subscriptions.update(tenant.stripeSubscriptionId, {
        pause_collection: '',
      });
    }
  }

  async deleteTenant(tenantId: string): Promise<void> {
    // Soft delete first (30-day grace period)
    await db.raw.tenant.update({
      where: { id: tenantId },
      data: {
        status: 'PENDING_DELETION',
        metadata: {
          deletionScheduledAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    });

    // Revoke all API keys immediately
    await db.raw.apiKey.updateMany({
      where: { tenantId, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    // Invalidate caches
    await this.invalidateAllTenantKeys(tenantId);

    // Schedule hard delete job
    await jobQueue.add('tenant:hard-delete', { tenantId }, {
      delay: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }

  async hardDeleteTenant(tenantId: string): Promise<void> {
    // Verify tenant is still pending deletion
    const tenant = await db.raw.tenant.findUnique({
      where: { id: tenantId },
      select: { status: true },
    });

    if (tenant?.status !== 'PENDING_DELETION') {
      logger.info('Tenant no longer pending deletion, skipping', { tenantId });
      return;
    }

    // Delete in dependency order
    await db.raw.$transaction(async (tx) => {
      await tx.auditLog.deleteMany({ where: { tenantId } });
      await tx.usageRecord.deleteMany({ where: { tenantId } });
      await tx.webhook.deleteMany({ where: { tenantId } });
      await tx.apiKey.deleteMany({ where: { tenantId } });
      await tx.tenantMember.deleteMany({ where: { tenantId } });
      await tx.tenant.delete({ where: { id: tenantId } });
    });

    // Delete Stripe customer
    if (tenant.stripeCustomerId) {
      await stripe.customers.del(tenant.stripeCustomerId);
    }

    logger.info('Tenant hard deleted', { tenantId });
  }

  private async invalidateAllTenantKeys(tenantId: string): Promise<void> {
    const keys = await db.raw.apiKey.findMany({
      where: { tenantId },
      select: { keyHash: true },
    });

    const pipeline = redis.pipeline();
    for (const key of keys) {
      pipeline.del(`tenant:apikey:${key.keyHash}`);
    }
    await pipeline.exec();
  }
}
```

### 6.2 Tenant Data Export (GDPR Compliance)

```typescript
// File: src/services/tenant-data-export.ts

class TenantDataExportService {
  async exportTenantData(tenantId: string): Promise<TenantExport> {
    // Gather all tenant data
    const [tenant, members, apiKeys, usage, auditLogs, webhooks] = await Promise.all([
      db.raw.tenant.findUniqueOrThrow({
        where: { id: tenantId },
      }),
      db.raw.tenantMember.findMany({
        where: { tenantId },
      }),
      db.raw.apiKey.findMany({
        where: { tenantId },
        select: {
          id: true,
          name: true,
          keyPrefix: true,
          scopes: true,
          createdAt: true,
          revokedAt: true,
          // Never export key hashes
        },
      }),
      db.raw.usageRecord.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'asc' },
      }),
      db.raw.auditLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'asc' },
      }),
      db.raw.webhook.findMany({
        where: { tenantId },
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      tenantId,
      tenant: {
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan,
        billingEmail: tenant.billingEmail,
        createdAt: tenant.createdAt,
      },
      members,
      apiKeys,
      usageRecords: usage,
      auditLogs,
      webhooks: webhooks.map(w => ({
        ...w,
        secret: undefined, // Never export webhook secrets
      })),
    };
  }
}
```

---

## 7. Audit Trail System

### 7.1 Comprehensive Audit Logging

```typescript
// File: src/services/audit-logger.ts

type AuditAction =
  | 'tenant.created'
  | 'tenant.updated'
  | 'tenant.suspended'
  | 'tenant.reactivated'
  | 'tenant.deleted'
  | 'api_key.created'
  | 'api_key.revoked'
  | 'api_key.rotated'
  | 'webhook.created'
  | 'webhook.updated'
  | 'webhook.deleted'
  | 'member.invited'
  | 'member.joined'
  | 'member.removed'
  | 'member.role_changed'
  | 'plan.upgraded'
  | 'plan.downgraded'
  | 'settings.updated'
  | 'ip_allowlist.updated'
  | 'agent.invoked'         // Tracked separately for high-volume
  | 'data.exported';

interface AuditEntry {
  tenantId: string;
  userId?: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

class AuditLogger {
  // High-frequency events use a buffer and batch insert
  private buffer: AuditEntry[] = [];
  private flushInterval: NodeJS.Timeout;

  constructor() {
    this.flushInterval = setInterval(() => this.flush(), 5_000);
  }

  async log(entry: AuditEntry): Promise<void> {
    // High-frequency events get buffered
    if (entry.action === 'agent.invoked') {
      this.buffer.push(entry);
      if (this.buffer.length >= 100) {
        await this.flush();
      }
      return;
    }

    // Low-frequency events are written immediately
    await db.raw.auditLog.create({
      data: {
        tenantId: entry.tenantId,
        userId: entry.userId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        details: entry.details,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const batch = this.buffer.splice(0, this.buffer.length);

    try {
      await db.raw.auditLog.createMany({
        data: batch.map(entry => ({
          tenantId: entry.tenantId,
          userId: entry.userId,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          details: entry.details as any,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent,
        })),
      });
    } catch (error) {
      logger.error('Failed to flush audit logs', {
        count: batch.length,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      // Re-add to buffer for retry
      this.buffer.unshift(...batch);
    }
  }

  async queryAuditLog(
    tenantId: string,
    filters: {
      action?: AuditAction;
      resource?: string;
      resourceId?: string;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
      page?: number;
      pageSize?: number;
    }
  ): Promise<PaginatedResult<AuditLog>> {
    const { page = 1, pageSize = 50 } = filters;

    const where: any = { tenantId };
    if (filters.action) where.action = filters.action;
    if (filters.resource) where.resource = filters.resource;
    if (filters.resourceId) where.resourceId = filters.resourceId;
    if (filters.userId) where.userId = filters.userId;
    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const [items, total] = await Promise.all([
      db.withTenant(tenantId, (tx) =>
        tx.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        })
      ),
      db.withTenant(tenantId, (tx) =>
        tx.auditLog.count({ where })
      ),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }
}
```

---

## 8. Tenant Isolation Testing

### 8.1 Isolation Verification Tests

```typescript
// File: tests/integration/tenant-isolation.test.ts

describe('Tenant Isolation', () => {
  let tenantA: string;
  let tenantB: string;

  beforeAll(async () => {
    tenantA = await createTestTenant('tenant-a');
    tenantB = await createTestTenant('tenant-b');

    // Create test data for both tenants
    await db.withTenant(tenantA, (tx) =>
      tx.apiKey.create({ data: { tenantId: tenantA, name: 'A-Key', ...generateTestKey() } })
    );
    await db.withTenant(tenantB, (tx) =>
      tx.apiKey.create({ data: { tenantId: tenantB, name: 'B-Key', ...generateTestKey() } })
    );
  });

  test('Tenant A cannot see Tenant B API keys', async () => {
    const keys = await db.withTenant(tenantA, (tx) =>
      tx.apiKey.findMany({ where: { tenantId: tenantA } })
    );

    expect(keys).toHaveLength(1);
    expect(keys[0].name).toBe('A-Key');
    // Tenant B's key should not appear
    expect(keys.find(k => k.name === 'B-Key')).toBeUndefined();
  });

  test('Tenant A cannot access Tenant B API key by ID', async () => {
    const bKey = await db.withTenant(tenantB, (tx) =>
      tx.apiKey.findFirst({ where: { tenantId: tenantB } })
    );

    // Try to access B's key from A's context
    const result = await db.withTenant(tenantA, (tx) =>
      tx.apiKey.findUnique({ where: { id: bKey!.id } })
    );

    // RLS should prevent access
    expect(result).toBeNull();
  });

  test('Tenant A cannot update Tenant B data', async () => {
    const bKey = await db.withTenant(tenantB, (tx) =>
      tx.apiKey.findFirst({ where: { tenantId: tenantB } })
    );

    const result = await db.withTenant(tenantA, (tx) =>
      tx.apiKey.updateMany({
        where: { id: bKey!.id },
        data: { name: 'HACKED' },
      })
    );

    // Should affect 0 rows due to RLS
    expect(result.count).toBe(0);

    // Verify B's key is unchanged
    const unchanged = await db.withTenant(tenantB, (tx) =>
      tx.apiKey.findUnique({ where: { id: bKey!.id } })
    );
    expect(unchanged!.name).toBe('B-Key');
  });

  test('Tenant A cannot delete Tenant B data', async () => {
    const bKey = await db.withTenant(tenantB, (tx) =>
      tx.apiKey.findFirst({ where: { tenantId: tenantB } })
    );

    const result = await db.withTenant(tenantA, (tx) =>
      tx.apiKey.deleteMany({ where: { id: bKey!.id } })
    );

    expect(result.count).toBe(0);
  });

  test('Cross-tenant aggregate queries are isolated', async () => {
    // Create usage records for both tenants
    await db.withTenant(tenantA, (tx) =>
      tx.usageRecord.createMany({
        data: Array.from({ length: 10 }, () => ({
          tenantId: tenantA,
          agentId: 'test-agent',
          endpoint: '/v1/agents/test/invoke',
          method: 'POST',
          statusCode: 200,
          responseTimeMs: 100,
          billingPeriod: '2026-03',
        })),
      })
    );

    await db.withTenant(tenantB, (tx) =>
      tx.usageRecord.createMany({
        data: Array.from({ length: 5 }, () => ({
          tenantId: tenantB,
          agentId: 'test-agent',
          endpoint: '/v1/agents/test/invoke',
          method: 'POST',
          statusCode: 200,
          responseTimeMs: 100,
          billingPeriod: '2026-03',
        })),
      })
    );

    // Tenant A should only see their 10 records
    const aCount = await db.withTenant(tenantA, (tx) =>
      tx.usageRecord.count({ where: { tenantId: tenantA } })
    );
    expect(aCount).toBe(10);

    // Tenant B should only see their 5 records
    const bCount = await db.withTenant(tenantB, (tx) =>
      tx.usageRecord.count({ where: { tenantId: tenantB } })
    );
    expect(bCount).toBe(5);
  });
});
```

---

## 9. Performance Considerations

### 9.1 Indexing Strategy for Multi-Tenant Tables

```sql
-- All tenant-scoped tables need tenant_id as the LEADING column in indexes
-- This ensures efficient partition pruning with RLS

-- Good: tenant_id leads the index
CREATE INDEX idx_usage_tenant_period ON usage_records (tenant_id, billing_period);
CREATE INDEX idx_usage_tenant_date ON usage_records (tenant_id, created_at);
CREATE INDEX idx_audit_tenant_action ON audit_logs (tenant_id, action, created_at);

-- Bad: tenant_id is not the leading column (forces full index scan per tenant)
-- CREATE INDEX idx_usage_period ON usage_records (billing_period, tenant_id); -- DON'T

-- Partial indexes for active tenants (optimization)
CREATE INDEX idx_active_keys ON api_keys (tenant_id, key_hash)
  WHERE revoked_at IS NULL;
```

### 9.2 Connection Pooling Per Tenant

```typescript
// For high-traffic tenants, consider connection pool isolation
// This prevents one noisy tenant from starving others

const POOL_CONFIG = {
  // Default pool for all tenants
  default: {
    min: 5,
    max: 20,
  },
  // Enterprise tenants get dedicated pool capacity
  enterprise: {
    min: 2,
    max: 10,
  },
};
```

---

## 10. Summary

Multi-tenant isolation in Stone AI Tools is enforced at multiple levels:

1. **Database Level (RLS)**: PostgreSQL row-level security policies ensure tenants can never access each other's data, regardless of application bugs
2. **Application Level**: Prisma middleware validates every query includes `tenantId`, providing defense-in-depth
3. **Gateway Level**: Tenant resolution from API keys with cached lookups, scoping every request before it reaches business logic
4. **API Key Isolation**: Keys are hashed (never stored in plaintext), scoped to tenants, and support IP allowlisting
5. **Audit Trail**: Every mutation is logged with tenant context for compliance and debugging
6. **Lifecycle Management**: Proper suspension, reactivation, and deletion flows with data export for GDPR

The combination of RLS + application guards + gateway enforcement creates a robust multi-tenant system that protects data even if one layer fails.
