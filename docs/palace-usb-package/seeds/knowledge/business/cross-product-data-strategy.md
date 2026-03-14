# Cross-Product Data Strategy — Stone AI Ecosystem

## Seed Classification
- **Domain**: Cross-Business Operations
- **Applies To**: Stone AI (Web SaaS), Best AI Mobile (React Native), Stone AI Tools (API Marketplace)
- **Owner**: Agent Stone (Head 1) + Cardinal (Head 2)
- **Created**: 2026-03-09
- **Sensitivity**: Internal — Strategic

---

## 1. Executive Summary

Data is the connective tissue between three products. This seed defines how data is structured, partitioned, shared, and analyzed across Stone AI, Best AI Mobile, and Stone AI Tools — all running on a shared Neon PostgreSQL instance with pgvector. It covers database schema design, data partitioning strategies, cross-product insight generation, data warehouse design, and ETL patterns.

Principle: each product owns its data, but the ecosystem creates insights no single product could generate alone.

---

## 2. Database Architecture

### 2.1 Schema Design — Multi-Tenant Single Database

All three products share a single Neon PostgreSQL 16 database with pgvector, partitioned by PostgreSQL schemas.

```sql
-- Schema hierarchy
CREATE SCHEMA shared;        -- Cross-product tables (users, events, scores)
CREATE SCHEMA stone_ai;      -- Stone AI web-specific tables
CREATE SCHEMA best_ai;       -- Best AI Mobile-specific tables
CREATE SCHEMA tools;         -- Stone AI Tools-specific tables
CREATE SCHEMA analytics;     -- Aggregated analytics (materialized views, reports)
CREATE SCHEMA staging;       -- ETL staging area

-- Shared extensions
CREATE EXTENSION IF NOT EXISTS vector;       -- pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS pg_trgm;      -- Trigram similarity search
CREATE EXTENSION IF NOT EXISTS pgcrypto;     -- Encryption functions
```

### 2.2 Shared Schema Tables

```sql
-- Core user identity (synced from Clerk)
CREATE TABLE shared.users (
  id TEXT PRIMARY KEY,                    -- Clerk user ID
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  clerk_metadata JSONB DEFAULT '{}',
  ecosystem_score INTEGER DEFAULT 0,
  active_products TEXT[] DEFAULT '{}',
  primary_product TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cross-product events (event bus persistence)
CREATE TABLE shared.cross_product_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES shared.users(id),
  source_product TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Monthly partitions for events
CREATE TABLE shared.events_2026_01 PARTITION OF shared.cross_product_events
  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
CREATE TABLE shared.events_2026_02 PARTITION OF shared.cross_product_events
  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
CREATE TABLE shared.events_2026_03 PARTITION OF shared.cross_product_events
  FOR VALUES FROM ('2026-03-01') TO ('2026-04-01');
-- Continue for 12 months, auto-create via cron

-- Ecosystem scores (recalculated daily)
CREATE TABLE shared.ecosystem_scores (
  user_id TEXT PRIMARY KEY REFERENCES shared.users(id),
  total_score INTEGER NOT NULL,
  products_used INTEGER DEFAULT 0,
  weekly_active_products INTEGER DEFAULT 0,
  monthly_revenue DECIMAL(10,2) DEFAULT 0,
  account_age_days INTEGER DEFAULT 0,
  referrals_made INTEGER DEFAULT 0,
  forum_contributions INTEGER DEFAULT 0,
  score_tier TEXT,               -- explorer, engaged, committed, power_user, ambassador
  last_calculated TIMESTAMPTZ DEFAULT NOW()
);

-- Cross-sell tracking
CREATE TABLE shared.cross_sell_impressions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES shared.users(id),
  trigger_id TEXT NOT NULL,
  source_product TEXT NOT NULL,
  target_product TEXT NOT NULL,
  placement TEXT,
  impression_count INTEGER DEFAULT 1,
  clicked BOOLEAN DEFAULT FALSE,
  converted BOOLEAN DEFAULT FALSE,
  dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unified notification queue
CREATE TABLE shared.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES shared.users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  source_product TEXT NOT NULL,
  target_product TEXT,        -- null = all products
  priority INTEGER DEFAULT 3,
  read BOOLEAN DEFAULT FALSE,
  delivered BOOLEAN DEFAULT FALSE,
  delivery_channel TEXT,      -- in_app, push, email
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.3 Product-Specific Schemas

**Stone AI Schema** (existing Prisma schema, moved to stone_ai namespace):
```sql
-- Stone AI owns: agents, chats, messages, besties, backdrops,
-- forum, subscriptions, referrals, badges, emotes, settings
-- These remain in their current Prisma-managed structure
-- but namespaced under stone_ai schema

SET search_path TO stone_ai;
-- All existing Stone AI tables live here
```

**Best AI Mobile Schema**:
```sql
CREATE TABLE best_ai.mobile_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES shared.users(id),
  device_type TEXT,                -- ios, android
  device_model TEXT,
  app_version TEXT,
  os_version TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER
);

CREATE TABLE best_ai.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES shared.users(id),
  token TEXT NOT NULL,
  platform TEXT NOT NULL,          -- apns, fcm
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE best_ai.voice_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES shared.users(id),
  agent_id TEXT NOT NULL,
  duration_seconds INTEGER,
  transcript_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE best_ai.mobile_preferences (
  user_id TEXT PRIMARY KEY REFERENCES shared.users(id),
  notification_enabled BOOLEAN DEFAULT TRUE,
  voice_enabled BOOLEAN DEFAULT TRUE,
  offline_cache_enabled BOOLEAN DEFAULT FALSE,
  preferred_agents TEXT[] DEFAULT '{}',
  theme TEXT DEFAULT 'system',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Stone AI Tools Schema**:
```sql
CREATE TABLE tools.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES shared.users(id),
  key_hash TEXT UNIQUE NOT NULL,    -- SHA-256 of actual key
  key_prefix TEXT NOT NULL,          -- First 8 chars for identification
  name TEXT,
  permissions TEXT[] DEFAULT '{}',
  rate_limit_tier TEXT DEFAULT 'FREE',
  active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE tools.api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES tools.api_keys(id),
  user_id TEXT REFERENCES shared.users(id),
  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY RANGE (created_at);

CREATE TABLE tools.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT REFERENCES shared.users(id),
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,           -- Event types to subscribe to
  secret TEXT NOT NULL,             -- Webhook signing secret
  active BOOLEAN DEFAULT TRUE,
  failure_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tools.marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  pricing_model TEXT,              -- free, per_call, subscription
  price_per_call DECIMAL(10,4),
  monthly_price DECIMAL(10,2),
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Data Partitioning Strategy

### 3.1 Time-Based Partitioning

High-volume tables are partitioned by time:

```sql
-- Events: monthly partitions
-- API usage: monthly partitions
-- Chat messages: monthly partitions (Stone AI)
-- Voice interactions: monthly partitions (Best AI)

-- Auto-partition management (run monthly via cron)
CREATE OR REPLACE FUNCTION shared.create_monthly_partition(
  parent_table TEXT,
  target_month DATE
) RETURNS VOID AS $$
DECLARE
  partition_name TEXT;
  start_date DATE;
  end_date DATE;
BEGIN
  start_date := date_trunc('month', target_month);
  end_date := start_date + INTERVAL '1 month';
  partition_name := parent_table || '_' || to_char(start_date, 'YYYY_MM');

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
    partition_name, parent_table, start_date, end_date
  );
END;
$$ LANGUAGE plpgsql;
```

### 3.2 Retention Policies

| Data Type | Hot (fast access) | Warm (compressed) | Cold (archived) | Delete |
|-----------|-------------------|-------------------|-----------------|--------|
| Events | 90 days | 1 year | 3 years | 5 years |
| API usage | 30 days | 6 months | 2 years | 3 years |
| Chat messages | 1 year | 3 years | 7 years | Never* |
| Analytics aggregates | Forever | N/A | N/A | Never |
| User profiles | Forever | N/A | N/A | On deletion request |

*Chat messages may need to be retained for legal/compliance reasons.

### 3.3 Index Strategy

```sql
-- Shared indexes (cross-product queries)
CREATE INDEX idx_events_user_product ON shared.cross_product_events(user_id, source_product);
CREATE INDEX idx_events_type_time ON shared.cross_product_events(event_type, created_at);
CREATE INDEX idx_users_products ON shared.users USING GIN(active_products);
CREATE INDEX idx_ecosystem_score ON shared.ecosystem_scores(total_score DESC);

-- Product-specific indexes
CREATE INDEX idx_api_usage_key ON tools.api_usage(api_key_id, created_at);
CREATE INDEX idx_mobile_sessions_user ON best_ai.mobile_sessions(user_id, started_at);

-- Vector indexes for semantic search
CREATE INDEX idx_agent_embeddings ON stone_ai.agent_profiles USING ivfflat(embedding vector_cosine_ops);
```

---

## 4. Cross-Product Insights

### 4.1 Insight Categories

**User Behavior Insights**:
- Which product combinations are most common?
- What's the typical cross-product adoption sequence?
- Do mobile users who also use web have higher retention?
- Do API users who also use the consumer app spend more?

**Revenue Insights**:
- Revenue per user for single vs multi-product users
- Which cross-sell paths generate the most revenue?
- Bundle vs individual pricing revenue comparison
- Tier upgrade patterns across products

**Engagement Insights**:
- Cross-product usage correlation (does web usage predict mobile adoption?)
- Agent popularity differences across platforms
- Time-of-day usage patterns per product
- Feature adoption rates across products

### 4.2 Insight Queries

```sql
-- Multi-product user revenue comparison
SELECT
  CASE
    WHEN array_length(u.active_products, 1) = 1 THEN 'single_product'
    WHEN array_length(u.active_products, 1) = 2 THEN 'two_products'
    WHEN array_length(u.active_products, 1) = 3 THEN 'three_products'
  END AS product_count,
  COUNT(DISTINCT u.id) AS users,
  AVG(es.monthly_revenue) AS avg_revenue,
  AVG(es.total_score) AS avg_ecosystem_score
FROM shared.users u
JOIN shared.ecosystem_scores es ON u.id = es.user_id
GROUP BY 1
ORDER BY 3 DESC;

-- Cross-product adoption sequence
SELECT
  first_product,
  second_product,
  COUNT(*) AS transitions,
  AVG(days_between) AS avg_days_to_adopt
FROM (
  SELECT
    user_id,
    source_product AS first_product,
    LEAD(source_product) OVER (PARTITION BY user_id ORDER BY created_at) AS second_product,
    EXTRACT(DAY FROM LEAD(created_at) OVER (PARTITION BY user_id ORDER BY created_at) - created_at) AS days_between
  FROM shared.cross_product_events
  WHERE event_type = 'user.first_use'
) sub
WHERE second_product IS NOT NULL
GROUP BY 1, 2
ORDER BY 3 DESC;

-- Agent popularity across products
SELECT
  e.payload->>'agent_id' AS agent_id,
  e.source_product,
  COUNT(*) AS interactions,
  COUNT(DISTINCT e.user_id) AS unique_users
FROM shared.cross_product_events e
WHERE e.event_type = 'agent.interaction'
AND e.created_at > NOW() - INTERVAL '30 days'
GROUP BY 1, 2
ORDER BY 3 DESC;
```

### 4.3 Predictive Models (Future)

Data collected enables future ML models:

1. **Churn Prediction**: Cross-product usage patterns predict churn better than single-product signals
2. **Cross-Sell Propensity**: Which users are most likely to adopt a second product?
3. **Tier Upgrade Prediction**: Usage patterns that indicate readiness for a higher tier
4. **Agent Recommendation**: Personalized agent suggestions based on cross-product behavior
5. **Lifetime Value Prediction**: Early signals that predict high-LTV users

---

## 5. Data Warehouse Design

### 5.1 Warehouse Architecture

For the current scale, the "warehouse" is a set of materialized views and aggregation tables within the same Neon database. As scale grows, this can migrate to a dedicated analytical database.

```
Operational Tables (OLTP)
  → ETL (scheduled jobs)
    → Staging Tables (staging schema)
      → Transformation
        → Analytical Tables (analytics schema)
          → Materialized Views
            → Dashboard API
```

### 5.2 Analytical Tables

```sql
-- Fact: Daily product metrics
CREATE TABLE analytics.fact_daily_metrics (
  date DATE NOT NULL,
  product TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value DECIMAL(15,4),
  PRIMARY KEY (date, product, metric_name)
);

-- Fact: User activity
CREATE TABLE analytics.fact_user_activity (
  date DATE NOT NULL,
  user_id TEXT NOT NULL,
  product TEXT NOT NULL,
  sessions INTEGER DEFAULT 0,
  interactions INTEGER DEFAULT 0,
  revenue DECIMAL(10,2) DEFAULT 0,
  PRIMARY KEY (date, user_id, product)
);

-- Dimension: User segments
CREATE TABLE analytics.dim_user_segments (
  user_id TEXT PRIMARY KEY,
  acquisition_channel TEXT,
  acquisition_product TEXT,
  current_tier TEXT,
  user_type TEXT,              -- free, paid, churned, reactivated
  product_combo TEXT,          -- "web", "web+mobile", "web+mobile+api", etc.
  cohort_month TEXT,           -- "2026-01"
  ltv_segment TEXT,            -- low, medium, high, whale
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Dimension: Product catalog
CREATE TABLE analytics.dim_products (
  product_id TEXT PRIMARY KEY,
  product_name TEXT,
  product_type TEXT,
  launch_date DATE,
  current_version TEXT,
  tier_structure JSONB
);

-- Fact: Cross-sell funnel
CREATE TABLE analytics.fact_cross_sell_funnel (
  date DATE NOT NULL,
  source_product TEXT NOT NULL,
  target_product TEXT NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  signups INTEGER DEFAULT 0,
  activated INTEGER DEFAULT 0,
  revenue_attributed DECIMAL(10,2) DEFAULT 0,
  PRIMARY KEY (date, source_product, target_product)
);
```

### 5.3 Cohort Tables

```sql
-- Monthly cohort analysis (cross-product)
CREATE TABLE analytics.monthly_cohorts (
  cohort_month TEXT NOT NULL,       -- "2026-01"
  months_since_signup INTEGER NOT NULL,
  product TEXT NOT NULL,
  cohort_size INTEGER,
  active_users INTEGER,
  retention_rate DECIMAL(5,2),
  revenue DECIMAL(10,2),
  arpu DECIMAL(10,2),
  multi_product_rate DECIMAL(5,2),
  PRIMARY KEY (cohort_month, months_since_signup, product)
);
```

---

## 6. ETL Patterns

### 6.1 ETL Job Architecture

```typescript
interface ETLJob {
  name: string;
  schedule: string;          // Cron expression
  source: string;            // Source schema/table
  destination: string;       // Destination schema/table
  transformations: string[]; // SQL transformations applied
  dependencies: string[];    // Other jobs that must complete first
  timeout: number;           // Max execution time in seconds
  retries: number;
  alertOnFailure: boolean;
}
```

### 6.2 Core ETL Jobs

**Job 1: Daily Metrics Aggregation**
```
Schedule: Daily at 2:00 AM UTC
Source: All operational tables
Destination: analytics.fact_daily_metrics
Steps:
  1. Aggregate Stone AI metrics (users, revenue, sessions, interactions)
  2. Aggregate Best AI metrics
  3. Aggregate Tools metrics
  4. Calculate combined metrics
  5. Insert into fact_daily_metrics
  6. Refresh dependent materialized views
Duration: ~30 seconds
```

**Job 2: User Segment Update**
```
Schedule: Daily at 3:00 AM UTC
Source: shared.users + product subscription tables
Destination: analytics.dim_user_segments
Dependencies: Job 1
Steps:
  1. Pull current user data from all products
  2. Calculate LTV segment based on revenue history
  3. Determine product combination
  4. Update acquisition channel if new data available
  5. Upsert into dim_user_segments
Duration: ~45 seconds
```

**Job 3: Ecosystem Score Recalculation**
```
Schedule: Daily at 4:00 AM UTC
Source: All product activity + shared.users
Destination: shared.ecosystem_scores
Dependencies: Job 1, Job 2
Steps:
  1. Calculate product breadth score (0-30)
  2. Calculate engagement depth (0-30)
  3. Calculate revenue contribution (0-20)
  4. Calculate tenure score (0-10)
  5. Calculate social score (0-10)
  6. Compute total, assign tier
  7. Upsert into ecosystem_scores
Duration: ~60 seconds
```

**Job 4: Cross-Sell Funnel Aggregation**
```
Schedule: Daily at 2:30 AM UTC
Source: shared.cross_sell_impressions + product signups
Destination: analytics.fact_cross_sell_funnel
Steps:
  1. Count impressions per source→target per day
  2. Count clicks
  3. Count resulting signups
  4. Count activations (used target product within 7 days)
  5. Calculate attributed revenue
Duration: ~15 seconds
```

**Job 5: Monthly Cohort Update**
```
Schedule: Weekly on Sunday at 5:00 AM UTC
Source: analytics.fact_user_activity + dim_user_segments
Destination: analytics.monthly_cohorts
Steps:
  1. For each cohort month, calculate retention at each month
  2. Split by product
  3. Calculate revenue per cohort
  4. Calculate multi-product adoption rate per cohort
Duration: ~120 seconds
```

**Job 6: Partition Maintenance**
```
Schedule: Monthly on 1st at 1:00 AM UTC
Steps:
  1. Create next month's partitions for all partitioned tables
  2. Drop partitions older than retention policy
  3. Vacuum analyze all partitioned tables
  4. Report partition sizes
Duration: ~30 seconds
```

### 6.3 ETL Error Handling

```typescript
async function runETLJob(job: ETLJob): Promise<ETLResult> {
  const startTime = Date.now();

  try {
    // Check dependencies
    for (const dep of job.dependencies) {
      const depStatus = await getJobStatus(dep);
      if (depStatus !== "completed") {
        throw new Error(`Dependency ${dep} not completed: ${depStatus}`);
      }
    }

    // Run in transaction
    await db.$transaction(async (tx) => {
      // Stage data
      await tx.$executeRawUnsafe(job.stagingQuery);

      // Transform
      for (const transform of job.transformations) {
        await tx.$executeRawUnsafe(transform);
      }

      // Load to destination
      await tx.$executeRawUnsafe(job.loadQuery);
    }, { timeout: job.timeout * 1000 });

    const duration = Date.now() - startTime;
    await logJobSuccess(job.name, duration);
    return { status: "completed", duration };

  } catch (error) {
    await logJobFailure(job.name, error);

    if (job.alertOnFailure) {
      await sendFounderAlert({
        alertType: "system.error",
        title: `ETL Job Failed: ${job.name}`,
        message: `Error: ${error.message}. Duration: ${Date.now() - startTime}ms`,
      });
    }

    // Retry logic
    if (job.retries > 0) {
      return runETLJob({ ...job, retries: job.retries - 1 });
    }

    return { status: "failed", error: error.message };
  }
}
```

---

## 7. Data Access Patterns

### 7.1 Prisma Client Configuration

Each product gets its own Prisma client with access to shared + product-specific schemas:

```prisma
// Stone AI prisma schema
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["shared", "stone_ai"]
}

// Best AI prisma schema
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["shared", "best_ai"]
}

// Tools prisma schema
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["shared", "tools"]
}

// Analytics (read-only for dashboard)
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["shared", "analytics"]
}
```

### 7.2 Data Access Rules

| Accessor | Can Read | Can Write | Restrictions |
|----------|---------|-----------|-------------|
| Stone AI app | shared.*, stone_ai.*, analytics.* (views) | shared.events, stone_ai.* | No direct analytics writes |
| Best AI app | shared.*, best_ai.* | shared.events, best_ai.* | No cross-product table writes |
| Tools app | shared.*, tools.* | shared.events, tools.* | No cross-product table writes |
| Analytics jobs | All schemas | analytics.*, staging.* | Only via ETL jobs |
| Admin dashboard | analytics.* | None | Read-only |

### 7.3 Row-Level Security (Future)

```sql
-- Ensure products can only access their own data
CREATE POLICY product_isolation ON shared.cross_product_events
  USING (source_product = current_setting('app.current_product'));

-- Set product context per connection
SET app.current_product = 'stone-ai';
```

---

## 8. Data Quality

### 8.1 Validation Rules

```typescript
const dataQualityChecks = [
  {
    name: "user_product_consistency",
    query: "SELECT COUNT(*) FROM shared.users WHERE active_products = '{}' AND id IN (SELECT DISTINCT user_id FROM shared.cross_product_events WHERE created_at > NOW() - INTERVAL '7 days')",
    threshold: 0,
    severity: "warning",
    description: "Users with recent events but empty active_products array"
  },
  {
    name: "ecosystem_score_freshness",
    query: "SELECT COUNT(*) FROM shared.ecosystem_scores WHERE last_calculated < NOW() - INTERVAL '48 hours'",
    threshold: 0,
    severity: "warning",
    description: "Ecosystem scores not recalculated in 48 hours"
  },
  {
    name: "orphaned_events",
    query: "SELECT COUNT(*) FROM shared.cross_product_events WHERE user_id NOT IN (SELECT id FROM shared.users)",
    threshold: 0,
    severity: "critical",
    description: "Events referencing non-existent users"
  },
  {
    name: "revenue_reconciliation",
    query: "SELECT ABS(SUM(stripe_amount) - SUM(db_amount)) FROM analytics.revenue_reconciliation_view",
    threshold: 1.00,
    severity: "critical",
    description: "Revenue difference between Stripe and database exceeds $1"
  }
];
```

### 8.2 Data Quality Dashboard

Run quality checks daily and surface results:
```
DATA QUALITY REPORT — 2026-03-09
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ user_product_consistency: 0 issues
✓ ecosystem_score_freshness: 0 issues
✓ orphaned_events: 0 issues
✓ revenue_reconciliation: $0.00 difference
✓ partition_health: All partitions present
✓ index_bloat: No indexes >20% bloated

Overall: HEALTHY (5/5 checks passing)
```

---

## 9. Privacy & Compliance

### 9.1 Data Classification

| Classification | Description | Examples | Handling |
|---------------|-------------|----------|---------|
| Public | Non-sensitive | Product names, agent descriptions | No restrictions |
| Internal | Business data | Metrics, analytics, KPIs | Employee/founder access only |
| Confidential | User PII | Email, name, usage history | Encrypted, access-logged |
| Restricted | Sensitive PII | Payment info, auth tokens | AES-256-GCM, minimal access |

### 9.2 GDPR/CCPA Compliance

**Data Subject Rights Implementation**:
```typescript
// Right to access — export all user data across products
async function exportUserData(userId: string): Promise<UserDataExport> {
  return {
    profile: await db.shared.users.findUnique({ where: { id: userId } }),
    stoneAiData: await db.stoneAi.exportUserData(userId),
    bestAiData: await db.bestAi.exportUserData(userId),
    toolsData: await db.tools.exportUserData(userId),
    events: await db.shared.crossProductEvents.findMany({ where: { userId } }),
    ecosystemScore: await db.shared.ecosystemScores.findUnique({ where: { userId } }),
  };
}

// Right to deletion — delete across all products
async function deleteUserData(userId: string): Promise<DeletionResult> {
  return await db.$transaction(async (tx) => {
    // Delete in reverse dependency order
    await tx.shared.crossProductEvents.deleteMany({ where: { userId } });
    await tx.shared.ecosystemScores.delete({ where: { userId } });
    await tx.shared.crossSellImpressions.deleteMany({ where: { userId } });
    await tx.shared.notifications.deleteMany({ where: { userId } });
    await tx.stoneAi.deleteUserData(userId);
    await tx.bestAi.deleteUserData(userId);
    await tx.tools.deleteUserData(userId);
    await tx.shared.users.delete({ where: { id: userId } });
    // Also delete from Clerk
    await clerk.users.deleteUser(userId);
    return { deleted: true, timestamp: new Date() };
  });
}
```

---

## 10. Implementation Roadmap

### Phase 1: Schema Foundation (Week 1)
- Create all schemas (shared, stone_ai, best_ai, tools, analytics, staging)
- Migrate existing Stone AI tables to stone_ai schema
- Create shared tables
- Set up partitioning for events

### Phase 2: Data Collection (Week 2-3)
- Deploy analytics event client to Stone AI
- Create ETL job framework
- Implement daily aggregation jobs
- Basic data quality checks

### Phase 3: Cross-Product (Month 2)
- Best AI and Tools schemas populated
- Cross-product event flow operational
- Ecosystem scoring live
- Analytical materialized views

### Phase 4: Intelligence (Month 3+)
- Full data warehouse views
- Cohort analysis operational
- Predictive model data preparation
- Advanced data quality automation

---

*Seed created by Agent Stone (Head 1) + Cardinal (Head 2) — Three-Headed Monster Operations*
*Data shared intelligently across products creates insights impossible to achieve in isolation. The ecosystem sees what individual products cannot.*
