# Unified Analytics Dashboard — Stone AI Ecosystem

## Seed Classification
- **Domain**: Cross-Business Operations
- **Applies To**: Stone AI (Web SaaS), Best AI Mobile (React Native), Stone AI Tools (API Marketplace)
- **Owner**: Agent Stone (Head 1) + Cardinal (Head 2)
- **Created**: 2026-03-09
- **Sensitivity**: Internal — Strategic

---

## 1. Executive Summary

Three products generating data independently are three blind spots. A unified analytics dashboard aggregates metrics across Stone AI, Best AI Mobile, and Stone AI Tools into a single executive view. This seed defines the metrics architecture, dashboard design, cross-product KPIs, and the data pipeline that feeds them.

The founder should never have to open three dashboards to understand business health. One screen, one truth, three businesses.

---

## 2. Dashboard Architecture

### 2.1 Data Flow

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Stone AI    │  │  Best AI     │  │  Stone AI    │
│  (Web)       │  │  (Mobile)    │  │  (Tools)     │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌─────────────────────────────────────────────────┐
│           Event Collection Layer                  │
│  (Product-specific event schemas → unified)       │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│            Analytics Database                      │
│  (Neon PG — analytics schema)                     │
│  Aggregation tables, materialized views            │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│          Unified Dashboard API                    │
│  /api/admin/analytics/*                           │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│        Executive Dashboard UI                     │
│  (Admin panel — founder access only)              │
└─────────────────────────────────────────────────┘
```

### 2.2 Event Schema

All products emit events in a unified format:

```typescript
interface AnalyticsEvent {
  id: string;
  product: "stone-ai" | "best-ai-mobile" | "stone-ai-tools";
  userId: string;
  eventType: string;
  category: "engagement" | "revenue" | "conversion" | "retention" | "infrastructure";
  properties: Record<string, any>;
  timestamp: Date;
  sessionId: string;
  platform: "web" | "mobile" | "api";
}
```

**Standard Event Types Across Products**:
| Event | Stone AI | Best AI Mobile | Stone AI Tools |
|-------|---------|---------------|---------------|
| user.signup | Yes | Yes | Yes |
| user.login | Yes | Yes | Yes (API key auth) |
| agent.interaction | Yes | Yes | Yes (API call) |
| subscription.created | Yes | Yes | Yes |
| subscription.cancelled | Yes | Yes | Yes |
| session.start | Yes | Yes | N/A |
| session.end | Yes | Yes | N/A |
| cross_sell.impression | Yes | Yes | Yes |
| cross_sell.click | Yes | Yes | Yes |

---

## 3. Metric Definitions

### 3.1 Combined Revenue Metrics

**Monthly Recurring Revenue (MRR) — Combined**:
```
Combined MRR = Stone AI MRR + Best AI MRR + Tools MRR

Stone AI MRR = Σ(active_subscriptions × tier_price)
  FREE: $0, STARTER: $19.99, PLUS: $49.99, SMART: $99.99/$84.99, PRO: $200/$170

Best AI MRR = Σ(active_subscriptions × tier_price)
  FREE: $0, BASIC: TBD, PREMIUM: TBD

Tools MRR = Σ(active_subscriptions × tier_price) + usage_overage
  FREE: $0, DEVELOPER: TBD, BUSINESS: TBD
```

**Annual Recurring Revenue (ARR)**:
```
ARR = Combined MRR × 12
Adjusted ARR = ARR + annual_subscription_commitments - expected_churn_revenue
```

**Revenue Per User (RPU)**:
```
Combined RPU = Total Revenue / Total Unique Paying Users
Product RPU = Product Revenue / Product Paying Users
Cross-Product Premium = Multi-Product RPU - Single Product RPU
```

**Net Revenue Retention (NRR)**:
```
NRR = (Starting MRR + Expansion - Contraction - Churn) / Starting MRR × 100

Expansion: Upgrades + cross-product additions
Contraction: Downgrades across any product
Churn: Complete cancellation from ALL products
```

### 3.2 User Metrics

**Total Users (Deduplicated)**:
```
Total Ecosystem Users = Unique Clerk user IDs across all products
  NOT: Stone AI users + Best AI users + Tools users (would double-count)

Multi-Product Users = Users active on 2+ products
Ecosystem Penetration = Multi-Product Users / Total Ecosystem Users
```

**Daily/Weekly/Monthly Active Users**:
```
DAU = Unique users with any event in last 24 hours (across all products)
WAU = Unique users with any event in last 7 days
MAU = Unique users with any event in last 30 days

Product-Specific:
  DAU_stone = Unique users on Stone AI in last 24h
  DAU_mobile = Unique users on Best AI in last 24h
  DAU_tools = Unique users on Tools in last 24h

Stickiness = DAU / MAU (target: >20%)
```

**User Growth**:
```
Net User Growth = New Signups - Churned Users
Growth Rate = Net User Growth / Previous Period Users × 100
Organic Growth Rate = (New Signups - Paid Acquisition) / Previous Period Users × 100
```

### 3.3 Engagement Metrics

**Agent Interactions**:
```
Total Interactions = Σ agent interactions across all products
Interactions Per User = Total Interactions / Active Users
Interactions Per Session = Total Interactions / Total Sessions

Popular Agents (cross-product):
  Rank agents by total interactions across all products
  Identify product-specific vs universal appeal
```

**Session Metrics**:
```
Average Session Duration:
  Stone AI: web sessions (pageview start → last activity)
  Best AI: app open → app background
  Tools: API session (first call → last call within 30min window)

Sessions Per User Per Day:
  Target: 2+ for web, 3+ for mobile, continuous for API
```

### 3.4 Conversion Metrics

**Funnel Metrics**:
```
Signup → First Interaction: % of new users who interact with an agent
First Interaction → Repeat: % who return within 7 days
Repeat → Paid: % who upgrade to any paid tier
Paid → Multi-Product: % of paid users who adopt a second product
Multi-Product → Bundle: % of multi-product users on bundle pricing
```

**Cross-Sell Metrics**:
```
Cross-Sell Impression Rate = Cross-sell impressions / eligible users
Cross-Sell CTR = Clicks / Impressions
Cross-Sell Conversion = Product signups from cross-sell / Clicks
Cross-Sell Revenue Lift = Revenue from cross-sold users - baseline revenue
```

### 3.5 Infrastructure Metrics

**AI Infrastructure**:
```
vLLM Utilization = Active sequences / Max sequences
Cloud Fallback Rate = Cloud requests / Total AI requests
Average Inference Latency = Mean response time across all products
P95 Latency = 95th percentile response time
Error Rate = Failed AI requests / Total AI requests
Cost Per Request = (Cloud API spend + infrastructure amortization) / Total requests
```

**System Health**:
```
Uptime = (Total minutes - Downtime minutes) / Total minutes × 100
  Target: 99.9% (43.8 minutes downtime/month max)

Error Rate by Product:
  5xx errors / total requests per product
  Target: <0.1%

API Response Time:
  P50, P95, P99 per product per endpoint
```

---

## 4. Dashboard Layout

### 4.1 Executive Summary View (Default)

```
┌─────────────────────────────────────────────────────────────────┐
│  THREE-HEADED MONSTER — EXECUTIVE DASHBOARD          [Mar 2026] │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  COMBINED MRR          TOTAL USERS       ECOSYSTEM SCORE         │
│  $12,450 (+18%)        4,231 (+312)      42 (median)            │
│  ████████████░░         ████████████░     ████████░░░░           │
│                                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐       │
│  │ STONE AI    │ │ BEST AI     │ │ STONE AI TOOLS      │       │
│  │ MRR: $8,200 │ │ MRR: $2,100 │ │ MRR: $2,150         │       │
│  │ Users: 3,100│ │ Users: 850  │ │ Users: 620          │       │
│  │ DAU: 420    │ │ DAU: 180    │ │ DAU: 95             │       │
│  │ Churn: 3.2% │ │ Churn: 4.1% │ │ Churn: 2.8%         │       │
│  └─────────────┘ └─────────────┘ └─────────────────────┘       │
│                                                                   │
│  MULTI-PRODUCT USERS: 385 (9.1%)    BUNDLE USERS: 112 (29%)    │
│                                                                   │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  REVENUE TREND (90 days)                                │     │
│  │  $15K ┤                                          ╱      │     │
│  │  $10K ┤                              ╱──────────╱       │     │
│  │   $5K ┤              ╱──────────────╱                   │     │
│  │    $0 ┤─────────────╱                                   │     │
│  │       └──────────────────────────────────────────       │     │
│  │        Jan          Feb          Mar                     │     │
│  │  ── Combined  ── Stone AI  ── Best AI  ── Tools         │     │
│  └────────────────────────────────────────────────────┘     │
│                                                                   │
│  TOP ALERTS:                                                     │
│  ⚠ vLLM utilization hit 82% at 2:15 PM                         │
│  ⚠ Best AI churn rate increased 0.4% week-over-week             │
│  ✓ Tools API had 100% uptime this week                          │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Revenue Deep-Dive View

```
┌─────────────────────────────────────────────────────────────────┐
│  REVENUE ANALYSIS                                     [Mar 2026] │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  MRR BREAKDOWN BY TIER                                           │
│  ┌──────────────────────────────────────────────────────┐       │
│  │ Stone AI:                                             │       │
│  │   FREE: 2,100 users ($0)                              │       │
│  │   STARTER: 380 × $19.99 = $7,596                     │       │
│  │   PLUS: 85 × $49.99 = $4,249                         │       │
│  │   SMART: 42 × $99.99 = $4,200 (12 annual @ $84.99)  │       │
│  │   PRO: 8 × $200 = $1,600 (3 annual @ $170)          │       │
│  │   Subtotal: $17,645                                   │       │
│  ├──────────────────────────────────────────────────────┤       │
│  │ Best AI Mobile:                                       │       │
│  │   FREE: 650 users ($0)                                │       │
│  │   BASIC: 140 × $9.99 = $1,399                        │       │
│  │   PREMIUM: 60 × $24.99 = $1,499                      │       │
│  │   Subtotal: $2,898                                    │       │
│  ├──────────────────────────────────────────────────────┤       │
│  │ Stone AI Tools:                                       │       │
│  │   FREE: 420 users ($0)                                │       │
│  │   DEVELOPER: 130 × $14.99 = $1,949                   │       │
│  │   BUSINESS: 70 × $49.99 = $3,499                     │       │
│  │   Overage: $450                                       │       │
│  │   Subtotal: $5,898                                    │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                   │
│  NET REVENUE RETENTION: 108%                                     │
│  LTV (Single Product): $380    LTV (Multi-Product): $1,050      │
│  LTV Multiplier: 2.76x                                          │
│                                                                   │
│  REVENUE AT RISK (churn signals):                                │
│  23 users showing churn signals = $2,340 MRR at risk             │
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Product Comparison View

```
┌─────────────────────────────────────────────────────────────────┐
│  PRODUCT COMPARISON                                   [Mar 2026] │
├──────────────┬──────────┬──────────┬─────────────────────────────┤
│  Metric      │ Stone AI │ Best AI  │ Tools                       │
├──────────────┼──────────┼──────────┼─────────────────────────────┤
│  MRR         │ $8,200   │ $2,100   │ $2,150                     │
│  MRR Growth  │ +12%     │ +45%     │ +28%                       │
│  Total Users │ 3,100    │ 850      │ 620                        │
│  Paid %      │ 32%      │ 24%     │ 32%                        │
│  DAU         │ 420      │ 180      │ 95                         │
│  Stickiness  │ 22%      │ 28%      │ 15%                       │
│  Churn Rate  │ 3.2%     │ 4.1%     │ 2.8%                      │
│  NPS         │ 42       │ 38       │ 51                         │
│  Avg Session │ 8.5 min  │ 3.2 min  │ N/A                       │
│  Support Tix │ 45/wk    │ 28/wk    │ 12/wk                     │
│  Uptime      │ 99.95%   │ 99.92%   │ 99.98%                    │
│  Error Rate  │ 0.08%    │ 0.12%    │ 0.03%                     │
│  CSAT        │ 4.2/5    │ 3.9/5    │ 4.5/5                     │
├──────────────┼──────────┼──────────┼─────────────────────────────┤
│  Health      │ ● Green  │ ● Yellow │ ● Green                    │
└──────────────┴──────────┴──────────┴─────────────────────────────┘
```

---

## 5. Cross-Product KPIs

### 5.1 North Star Metrics

Each product has a North Star, plus one combined North Star:

| Scope | North Star Metric | Target |
|-------|-------------------|--------|
| **Combined** | Multi-Product MRR Growth Rate | >15% MoM |
| Stone AI | Weekly Active Agent Users | >1,000 |
| Best AI Mobile | Daily Active Users | >500 |
| Stone AI Tools | Monthly API Calls | >100,000 |

### 5.2 Shared KPIs (Reviewed Weekly)

| KPI | Definition | Target | Alert Threshold |
|-----|-----------|--------|-----------------|
| Combined MRR | Sum of all product MRR | Growing | <5% MoM growth |
| Ecosystem Penetration | % users on 2+ products | >15% | <10% |
| Cross-Sell CVR | Cross-sell conversion rate | >10% | <5% |
| Combined Churn | Weighted average churn | <4% | >5% |
| Infrastructure Cost Ratio | Infra cost / MRR | <15% | >25% |
| Cloud Fallback Rate | % AI requests to cloud | <20% | >40% |
| Combined NPS | Weighted NPS across products | >40 | <30 |
| Support Resolution Time | Average time to close ticket | <4 hours | >8 hours |

### 5.3 Product Health Score

Each product gets a composite health score (0-100):

```typescript
interface ProductHealthScore {
  product: string;
  score: number;
  components: {
    revenue: number;      // 0-25: MRR growth, NRR, LTV trend
    engagement: number;   // 0-25: DAU/MAU, session depth, feature adoption
    quality: number;      // 0-25: uptime, error rate, CSAT, NPS
    growth: number;       // 0-25: user growth, conversion rate, viral coefficient
  };
  trend: "improving" | "stable" | "declining";
  alerts: string[];
}
```

**Health Score Thresholds**:
| Score | Status | Action |
|-------|--------|--------|
| 80-100 | Excellent | Continue current strategy |
| 60-79 | Good | Monitor for trends |
| 40-59 | Attention Needed | Investigate declining areas |
| 20-39 | At Risk | Immediate founder attention |
| 0-19 | Critical | Emergency response |

---

## 6. Data Pipeline

### 6.1 Collection Layer

```typescript
// Shared analytics client used by all products
class AnalyticsClient {
  private product: string;

  constructor(product: string) {
    this.product = product;
  }

  async track(eventType: string, properties: Record<string, any>) {
    const event: AnalyticsEvent = {
      id: generateId(),
      product: this.product,
      userId: getCurrentUserId(),
      eventType,
      category: categorizeEvent(eventType),
      properties,
      timestamp: new Date(),
      sessionId: getSessionId(),
      platform: getPlatform(),
    };

    // Write to analytics schema
    await db.analytics.events.create({ data: event });

    // Publish to real-time dashboard
    await redis.publish("analytics:events", JSON.stringify(event));
  }
}

// Usage in each product
const analytics = new AnalyticsClient("stone-ai");
await analytics.track("agent.interaction", { agentId: "stone-1", duration: 45 });
```

### 6.2 Aggregation Layer

**Materialized Views** (refreshed on schedule):

```sql
-- Hourly: Active users per product
CREATE MATERIALIZED VIEW analytics.hourly_active_users AS
SELECT
  date_trunc('hour', timestamp) as hour,
  product,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(*) as total_events
FROM analytics.events
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY 1, 2;

-- Daily: Revenue summary
CREATE MATERIALIZED VIEW analytics.daily_revenue AS
SELECT
  date_trunc('day', created_at) as day,
  product,
  SUM(amount) as revenue,
  COUNT(DISTINCT user_id) as paying_users,
  SUM(amount) / COUNT(DISTINCT user_id) as arpu
FROM analytics.transactions
GROUP BY 1, 2;

-- Weekly: Cross-product adoption
CREATE MATERIALIZED VIEW analytics.weekly_cross_product AS
SELECT
  date_trunc('week', timestamp) as week,
  user_id,
  array_agg(DISTINCT product) as products_used,
  COUNT(DISTINCT product) as product_count
FROM analytics.events
GROUP BY 1, 2;
```

**Refresh Schedule**:
| View | Refresh Frequency | Duration |
|------|-------------------|----------|
| hourly_active_users | Every hour | ~2s |
| daily_revenue | Every 6 hours | ~5s |
| weekly_cross_product | Daily at 3 AM | ~15s |
| monthly_cohorts | Weekly | ~30s |
| ecosystem_scores | Daily at 4 AM | ~20s |

### 6.3 API Layer

```typescript
// Dashboard API endpoints (admin only)
// All require founder authentication

// GET /api/admin/analytics/summary
// Returns executive summary for date range
interface SummaryResponse {
  dateRange: { start: Date; end: Date };
  combined: {
    mrr: number;
    mrrGrowth: number;
    totalUsers: number;
    newUsers: number;
    churnRate: number;
    ecosystemPenetration: number;
  };
  byProduct: Record<string, ProductMetrics>;
  alerts: Alert[];
}

// GET /api/admin/analytics/revenue?period=monthly
// Returns revenue breakdown

// GET /api/admin/analytics/users?segment=multi-product
// Returns user analytics with segmentation

// GET /api/admin/analytics/infrastructure
// Returns infrastructure metrics

// GET /api/admin/analytics/cross-sell
// Returns cross-sell funnel metrics

// GET /api/admin/analytics/health
// Returns product health scores
```

---

## 7. Alerting & Anomaly Detection

### 7.1 Automated Alerts

```typescript
interface AnalyticsAlert {
  id: string;
  severity: "info" | "warning" | "critical";
  metric: string;
  product: string | "combined";
  currentValue: number;
  threshold: number;
  direction: "above" | "below";
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}
```

**Alert Rules**:
| Metric | Condition | Severity | Action |
|--------|----------|----------|--------|
| MRR | Drops >5% MoM | Critical | Email founder |
| Churn rate | >5% any product | Warning | Dashboard alert |
| DAU | Drops >20% WoW | Warning | Dashboard + email |
| Error rate | >1% any product | Critical | Email + Chaos |
| vLLM utilization | >90% sustained 1hr | Critical | Email + Chaos |
| Cloud spend | >80% of monthly budget | Warning | Dashboard + email |
| NPS | Drops below 30 | Warning | Dashboard alert |
| Cross-sell CVR | <3% for 7 days | Info | Dashboard alert |

### 7.2 Anomaly Detection

Simple statistical anomaly detection for key metrics:

```typescript
function detectAnomaly(metric: string, currentValue: number, historicalValues: number[]): boolean {
  const mean = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
  const stdDev = Math.sqrt(
    historicalValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalValues.length
  );

  // Alert if current value is >2 standard deviations from mean
  return Math.abs(currentValue - mean) > 2 * stdDev;
}
```

---

## 8. Reporting Cadence

### 8.1 Automated Reports

| Report | Frequency | Recipients | Contents |
|--------|-----------|------------|----------|
| Daily Digest | Daily 8 AM | Founder | Yesterday's KPIs, alerts, anomalies |
| Weekly Summary | Monday 9 AM | Founder | Week-over-week trends, product health |
| Monthly Review | 1st of month | Founder | Full metrics, MoM comparison, recommendations |
| Quarterly Analysis | End of quarter | Founder + Heads | QBR data, strategic analysis |

### 8.2 Report Delivery

Reports delivered via:
1. Dashboard (always available, real-time)
2. Email via sendFounderAlert() (scheduled reports)
3. Admin panel notification badge (alerts only)

---

## 9. Implementation Plan

### Phase 1: Foundation (Week 1-2)
- Analytics schema in Neon
- Event collection client (shared npm package)
- Basic materialized views
- Admin dashboard skeleton

### Phase 2: Core Metrics (Week 3-4)
- Revenue dashboard
- User metrics dashboard
- Product comparison view
- Basic alerting

### Phase 3: Intelligence (Week 5-8)
- Cross-product KPIs
- Ecosystem scoring integration
- Anomaly detection
- Automated reports

### Phase 4: Advanced (Month 3+)
- Cohort analysis
- Predictive metrics (churn forecasting)
- A/B test result integration
- Custom dashboard builder

---

*Seed created by Agent Stone (Head 1) + Cardinal (Head 2) — Three-Headed Monster Operations*
*You can't manage what you can't measure. One dashboard, three businesses, zero blind spots.*
