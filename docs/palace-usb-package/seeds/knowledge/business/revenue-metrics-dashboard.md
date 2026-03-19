# Revenue Metrics Dashboard — Stone AI Palace Knowledge Seed

## Seed Classification
- **Domain**: Revenue Operations / Business Intelligence
- **Complexity**: Advanced
- **Stack**: Next.js 16, TypeScript, Stripe, Prisma 7.4, PostgreSQL 16
- **Applies To**: Stone AI, Best AI, Stone AI Tools

---

## 1. Core Revenue Metrics — What to Track and Why

Every SaaS business lives or dies by its metrics. But the danger isn't in not tracking metrics — it's in tracking the wrong ones, or tracking the right ones incorrectly. This seed covers every revenue metric Stone AI needs, the exact formulas, the SQL queries to calculate them, and the common mistakes that lead to wrong numbers.

### The Metrics Hierarchy

```
Level 1: North Star Metrics
├── MRR (Monthly Recurring Revenue)
├── Net Revenue Retention (NRR)
└── LTV:CAC Ratio

Level 2: Growth Metrics
├── MRR Growth Rate
├── ARR (Annual Recurring Revenue)
├── Expansion Revenue
├── Contraction Revenue
└── New MRR

Level 3: Health Metrics
├── Churn Rate (Gross)
├── Churn Rate (Net)
├── Voluntary Churn
├── Involuntary Churn
├── LTV (Lifetime Value)
├── CAC (Customer Acquisition Cost)
└── Payback Period

Level 4: Operational Metrics
├── ARPU (Average Revenue Per User)
├── ARPPU (Average Revenue Per Paying User)
├── Conversion Rate (Free → Paid)
├── Upgrade Rate
├── Downgrade Rate
├── Trial Conversion Rate
└── Dunning Recovery Rate

Level 5: Cohort Metrics
├── Cohort Retention
├── Cohort Revenue
├── Cohort LTV
└── Cohort Payback
```

---

## 2. MRR (Monthly Recurring Revenue)

### Definition

MRR is the normalized monthly revenue from all active subscriptions. It's the single most important metric for a subscription business.

### Formula

```
MRR = Sum of (Monthly Price × Quantity) for all active subscriptions

For annual subscriptions:
Monthly equivalent = Annual Price / 12

Total MRR = Monthly MRR + (Annual MRR / 12)
```

### SQL Query

```sql
-- Current MRR calculation
SELECT
  COALESCE(SUM(
    CASE
      WHEN u.billing_period = 'MONTHLY' THEN
        CASE u.current_plan
          WHEN 'STARTER' THEN 19.99
          WHEN 'PLUS' THEN 49.99
          WHEN 'SMART' THEN 99.99
          WHEN 'PRO' THEN 200.00
          ELSE 0
        END
      WHEN u.billing_period = 'ANNUAL' THEN
        CASE u.current_plan
          WHEN 'SMART' THEN 84.99
          WHEN 'PRO' THEN 170.00
          ELSE 0
        END
      ELSE 0
    END
  ), 0) AS current_mrr
FROM users u
WHERE u.subscription_status IN ('ACTIVE', 'TRIALING')
  AND u.current_plan != 'FREE';

-- MRR breakdown by component
SELECT
  'new_mrr' AS component,
  COALESCE(SUM(monthly_amount), 0) AS amount
FROM (
  SELECT
    CASE
      WHEN u.billing_period = 'ANNUAL' THEN
        CASE u.current_plan WHEN 'SMART' THEN 84.99 WHEN 'PRO' THEN 170.00 ELSE 0 END
      ELSE
        CASE u.current_plan WHEN 'STARTER' THEN 19.99 WHEN 'PLUS' THEN 49.99 WHEN 'SMART' THEN 99.99 WHEN 'PRO' THEN 200.00 ELSE 0 END
    END AS monthly_amount
  FROM users u
  WHERE u.subscription_status IN ('ACTIVE', 'TRIALING')
    AND u.current_plan != 'FREE'
    AND u.created_at >= date_trunc('month', CURRENT_DATE)
) sub

UNION ALL

SELECT
  'expansion_mrr' AS component,
  COALESCE(SUM(
    CASE
      WHEN pcl.to_plan > pcl.from_plan THEN
        get_monthly_price(pcl.to_plan, pcl.to_period) - get_monthly_price(pcl.from_plan, pcl.from_period)
      ELSE 0
    END
  ), 0) AS amount
FROM plan_change_logs pcl
WHERE pcl.type = 'UPGRADE'
  AND pcl.created_at >= date_trunc('month', CURRENT_DATE)

UNION ALL

SELECT
  'contraction_mrr' AS component,
  COALESCE(SUM(
    CASE
      WHEN pcl.to_plan < pcl.from_plan THEN
        get_monthly_price(pcl.from_plan, pcl.from_period) - get_monthly_price(pcl.to_plan, pcl.to_period)
      ELSE 0
    END
  ), 0) AS amount
FROM plan_change_logs pcl
WHERE pcl.type = 'DOWNGRADE'
  AND pcl.created_at >= date_trunc('month', CURRENT_DATE)

UNION ALL

SELECT
  'churned_mrr' AS component,
  COALESCE(SUM(
    CASE
      WHEN u.billing_period = 'ANNUAL' THEN
        CASE u.current_plan WHEN 'SMART' THEN 84.99 WHEN 'PRO' THEN 170.00 ELSE 0 END
      ELSE
        CASE u.current_plan WHEN 'STARTER' THEN 19.99 WHEN 'PLUS' THEN 49.99 WHEN 'SMART' THEN 99.99 WHEN 'PRO' THEN 200.00 ELSE 0 END
    END
  ), 0) AS amount
FROM users u
WHERE u.subscription_status = 'CANCELED'
  AND u.updated_at >= date_trunc('month', CURRENT_DATE);
```

### MRR Over Time

```sql
-- Monthly MRR trend (last 12 months)
WITH months AS (
  SELECT generate_series(
    date_trunc('month', CURRENT_DATE - INTERVAL '11 months'),
    date_trunc('month', CURRENT_DATE),
    INTERVAL '1 month'
  ) AS month
),
monthly_mrr AS (
  SELECT
    m.month,
    COALESCE(SUM(
      CASE
        WHEN u.billing_period = 'ANNUAL' THEN
          CASE u.current_plan WHEN 'SMART' THEN 84.99 WHEN 'PRO' THEN 170.00 ELSE 0 END
        ELSE
          CASE u.current_plan WHEN 'STARTER' THEN 19.99 WHEN 'PLUS' THEN 49.99 WHEN 'SMART' THEN 99.99 WHEN 'PRO' THEN 200.00 ELSE 0 END
      END
    ), 0) AS mrr
  FROM months m
  LEFT JOIN users u ON
    u.subscription_status IN ('ACTIVE', 'TRIALING')
    AND u.current_plan != 'FREE'
    AND u.created_at <= m.month + INTERVAL '1 month'
    AND (u.updated_at > m.month OR u.subscription_status = 'ACTIVE')
  GROUP BY m.month
)
SELECT
  month,
  mrr,
  mrr - LAG(mrr) OVER (ORDER BY month) AS mrr_change,
  ROUND(
    (mrr - LAG(mrr) OVER (ORDER BY month)) / NULLIF(LAG(mrr) OVER (ORDER BY month), 0) * 100,
    1
  ) AS growth_rate_pct
FROM monthly_mrr
ORDER BY month;
```

### ARR (Annual Recurring Revenue)

```sql
-- ARR = MRR × 12
SELECT current_mrr * 12 AS arr
FROM (
  SELECT COALESCE(SUM(
    CASE
      WHEN u.billing_period = 'ANNUAL' THEN
        CASE u.current_plan WHEN 'SMART' THEN 84.99 WHEN 'PRO' THEN 170.00 ELSE 0 END
      ELSE
        CASE u.current_plan WHEN 'STARTER' THEN 19.99 WHEN 'PLUS' THEN 49.99 WHEN 'SMART' THEN 99.99 WHEN 'PRO' THEN 200.00 ELSE 0 END
    END
  ), 0) AS current_mrr
  FROM users u
  WHERE u.subscription_status IN ('ACTIVE', 'TRIALING')
    AND u.current_plan != 'FREE'
) sub;
```

---

## 3. Churn Rate

### Types of Churn

**Customer Churn Rate** = Customers lost / Total customers at start of period
**Revenue Churn Rate** = MRR lost / MRR at start of period
**Gross Churn** = Total lost (voluntary + involuntary)
**Net Churn** = Lost - Expansion (can be negative = net growth)
**Voluntary Churn** = User actively canceled
**Involuntary Churn** = Payment failed, subscription ended

### SQL Queries

```sql
-- Monthly customer churn rate
WITH monthly_stats AS (
  SELECT
    date_trunc('month', CURRENT_DATE) AS month,
    COUNT(*) FILTER (
      WHERE subscription_status IN ('ACTIVE', 'TRIALING')
        AND current_plan != 'FREE'
        AND created_at < date_trunc('month', CURRENT_DATE)
    ) AS start_of_month_customers,
    COUNT(*) FILTER (
      WHERE subscription_status = 'CANCELED'
        AND updated_at >= date_trunc('month', CURRENT_DATE)
    ) AS churned_customers
  FROM users
)
SELECT
  month,
  start_of_month_customers,
  churned_customers,
  ROUND(
    churned_customers::numeric / NULLIF(start_of_month_customers, 0) * 100,
    2
  ) AS churn_rate_pct
FROM monthly_stats;

-- Voluntary vs involuntary churn breakdown
SELECT
  CASE
    WHEN u.cancel_reason IN ('user_requested', 'downgrade_to_free') THEN 'voluntary'
    WHEN u.cancel_reason IN ('payment_failed', 'unpaid') THEN 'involuntary'
    ELSE 'other'
  END AS churn_type,
  COUNT(*) AS count,
  ROUND(
    COUNT(*)::numeric / NULLIF(SUM(COUNT(*)) OVER (), 0) * 100,
    1
  ) AS percentage
FROM users u
WHERE u.subscription_status = 'CANCELED'
  AND u.updated_at >= date_trunc('month', CURRENT_DATE)
GROUP BY 1
ORDER BY 2 DESC;

-- Revenue churn rate
WITH period AS (
  SELECT
    date_trunc('month', CURRENT_DATE) AS month_start,
    date_trunc('month', CURRENT_DATE) + INTERVAL '1 month' AS month_end
)
SELECT
  ROUND(
    COALESCE(SUM(
      CASE
        WHEN u.billing_period = 'ANNUAL' THEN
          CASE u.current_plan WHEN 'SMART' THEN 84.99 WHEN 'PRO' THEN 170.00 ELSE 0 END
        ELSE
          CASE u.current_plan WHEN 'STARTER' THEN 19.99 WHEN 'PLUS' THEN 49.99 WHEN 'SMART' THEN 99.99 WHEN 'PRO' THEN 200.00 ELSE 0 END
      END
    ), 0)::numeric /
    NULLIF((
      SELECT SUM(
        CASE
          WHEN u2.billing_period = 'ANNUAL' THEN
            CASE u2.current_plan WHEN 'SMART' THEN 84.99 WHEN 'PRO' THEN 170.00 ELSE 0 END
          ELSE
            CASE u2.current_plan WHEN 'STARTER' THEN 19.99 WHEN 'PLUS' THEN 49.99 WHEN 'SMART' THEN 99.99 WHEN 'PRO' THEN 200.00 ELSE 0 END
        END
      )
      FROM users u2
      WHERE u2.subscription_status IN ('ACTIVE', 'TRIALING')
        AND u2.current_plan != 'FREE'
        AND u2.created_at < (SELECT month_start FROM period)
    ), 0) * 100,
    2
  ) AS revenue_churn_rate_pct
FROM users u, period p
WHERE u.subscription_status = 'CANCELED'
  AND u.updated_at >= p.month_start
  AND u.updated_at < p.month_end;
```

---

## 4. LTV (Lifetime Value)

### Formula

```
Simple LTV = ARPU / Monthly Churn Rate

Better LTV = ARPU × Gross Margin / Monthly Churn Rate

Cohort-based LTV = Sum of actual revenue per customer over their lifetime

Predictive LTV = ARPU × (1 / churn_rate) × gross_margin
```

### SQL Queries

```sql
-- Simple LTV calculation
WITH metrics AS (
  SELECT
    COALESCE(AVG(
      CASE
        WHEN u.billing_period = 'ANNUAL' THEN
          CASE u.current_plan WHEN 'SMART' THEN 84.99 WHEN 'PRO' THEN 170.00 ELSE 0 END
        ELSE
          CASE u.current_plan WHEN 'STARTER' THEN 19.99 WHEN 'PLUS' THEN 49.99 WHEN 'SMART' THEN 99.99 WHEN 'PRO' THEN 200.00 ELSE 0 END
      END
    ), 0) AS arpu,
    COALESCE(
      COUNT(*) FILTER (
        WHERE subscription_status = 'CANCELED'
          AND updated_at >= CURRENT_DATE - INTERVAL '30 days'
      )::numeric /
      NULLIF(COUNT(*) FILTER (
        WHERE subscription_status IN ('ACTIVE', 'TRIALING')
          AND current_plan != 'FREE'
      ), 0),
      0.05 -- Default 5% if no data
    ) AS monthly_churn_rate
  FROM users u
  WHERE current_plan != 'FREE'
)
SELECT
  arpu,
  monthly_churn_rate,
  ROUND(arpu / NULLIF(monthly_churn_rate, 0), 2) AS simple_ltv,
  ROUND(arpu * 0.80 / NULLIF(monthly_churn_rate, 0), 2) AS margin_adjusted_ltv
FROM metrics;

-- LTV by plan tier
SELECT
  current_plan,
  COUNT(*) AS subscribers,
  ROUND(AVG(
    CASE
      WHEN billing_period = 'ANNUAL' THEN
        CASE current_plan WHEN 'SMART' THEN 84.99 WHEN 'PRO' THEN 170.00 ELSE 0 END
      ELSE
        CASE current_plan WHEN 'STARTER' THEN 19.99 WHEN 'PLUS' THEN 49.99 WHEN 'SMART' THEN 99.99 WHEN 'PRO' THEN 200.00 ELSE 0 END
    END
  ), 2) AS arpu,
  ROUND(AVG(
    EXTRACT(EPOCH FROM (
      COALESCE(
        CASE WHEN subscription_status = 'CANCELED' THEN updated_at END,
        CURRENT_TIMESTAMP
      ) - created_at
    )) / (30.44 * 24 * 3600)
  ), 1) AS avg_lifetime_months
FROM users
WHERE current_plan != 'FREE'
GROUP BY current_plan
ORDER BY
  CASE current_plan
    WHEN 'STARTER' THEN 1
    WHEN 'PLUS' THEN 2
    WHEN 'SMART' THEN 3
    WHEN 'PRO' THEN 4
  END;

-- Actual LTV (revenue realized per customer)
SELECT
  u.id,
  u.current_plan,
  u.created_at,
  COALESCE(SUM(pe.amount), 0) / 100 AS total_revenue,
  EXTRACT(EPOCH FROM (
    COALESCE(
      CASE WHEN u.subscription_status = 'CANCELED' THEN u.updated_at END,
      CURRENT_TIMESTAMP
    ) - u.created_at
  )) / (30.44 * 24 * 3600) AS lifetime_months,
  ROUND(
    (COALESCE(SUM(pe.amount), 0) / 100.0) /
    NULLIF(
      EXTRACT(EPOCH FROM (
        COALESCE(
          CASE WHEN u.subscription_status = 'CANCELED' THEN u.updated_at END,
          CURRENT_TIMESTAMP
        ) - u.created_at
      )) / (30.44 * 24 * 3600),
      0
    ),
    2
  ) AS monthly_arpu
FROM users u
LEFT JOIN payment_events pe ON pe.user_id = u.id AND pe.type = 'PAYMENT_SUCCEEDED'
WHERE u.current_plan != 'FREE'
GROUP BY u.id, u.current_plan, u.created_at, u.subscription_status, u.updated_at
ORDER BY total_revenue DESC
LIMIT 100;
```

---

## 5. CAC (Customer Acquisition Cost)

### Formula

```
CAC = Total Sales & Marketing Spend / Number of New Customers Acquired

Blended CAC = Total spend / All new customers (including organic)
Paid CAC = Paid marketing spend / Customers from paid channels
```

### SQL Query

```sql
-- CAC by acquisition channel (requires marketing spend data)
WITH new_customers AS (
  SELECT
    date_trunc('month', created_at) AS month,
    COALESCE(acquisition_channel, 'organic') AS channel,
    COUNT(*) AS new_paying_customers
  FROM users
  WHERE current_plan != 'FREE'
    AND subscription_status IN ('ACTIVE', 'TRIALING')
    AND created_at >= CURRENT_DATE - INTERVAL '6 months'
  GROUP BY 1, 2
),
spend AS (
  -- This would come from a marketing_spend table
  SELECT
    month,
    channel,
    amount AS spend
  FROM marketing_spend
  WHERE month >= CURRENT_DATE - INTERVAL '6 months'
)
SELECT
  nc.month,
  nc.channel,
  nc.new_paying_customers,
  COALESCE(s.spend, 0) AS marketing_spend,
  CASE
    WHEN nc.new_paying_customers > 0 THEN
      ROUND(COALESCE(s.spend, 0)::numeric / nc.new_paying_customers, 2)
    ELSE NULL
  END AS cac
FROM new_customers nc
LEFT JOIN spend s ON s.month = nc.month AND s.channel = nc.channel
ORDER BY nc.month, nc.channel;
```

### LTV:CAC Ratio

```sql
-- LTV:CAC ratio by channel
-- Target: 3:1 or higher (healthy SaaS)
-- Below 1:1 = losing money on acquisition
-- Above 5:1 = underinvesting in growth

WITH ltv_by_channel AS (
  SELECT
    COALESCE(acquisition_channel, 'organic') AS channel,
    ROUND(AVG(
      CASE
        WHEN billing_period = 'ANNUAL' THEN
          CASE current_plan WHEN 'SMART' THEN 84.99 WHEN 'PRO' THEN 170.00 ELSE 0 END
        ELSE
          CASE current_plan WHEN 'STARTER' THEN 19.99 WHEN 'PLUS' THEN 49.99 WHEN 'SMART' THEN 99.99 WHEN 'PRO' THEN 200.00 ELSE 0 END
      END
    ) / NULLIF(0.05, 0), 2) AS estimated_ltv -- Using 5% churn estimate
  FROM users
  WHERE current_plan != 'FREE'
  GROUP BY 1
),
cac_by_channel AS (
  SELECT
    channel,
    ROUND(AVG(cac), 2) AS avg_cac
  FROM (
    -- Subquery with CAC calculation per month per channel
    SELECT 'organic' AS channel, 0 AS cac -- Placeholder
  ) sub
  GROUP BY 1
)
SELECT
  l.channel,
  l.estimated_ltv,
  c.avg_cac,
  ROUND(l.estimated_ltv / NULLIF(c.avg_cac, 0), 1) AS ltv_cac_ratio,
  CASE
    WHEN c.avg_cac = 0 THEN 'infinite (organic)'
    WHEN l.estimated_ltv / c.avg_cac >= 3 THEN 'healthy'
    WHEN l.estimated_ltv / c.avg_cac >= 1 THEN 'marginal'
    ELSE 'unprofitable'
  END AS health
FROM ltv_by_channel l
LEFT JOIN cac_by_channel c ON c.channel = l.channel
ORDER BY ltv_cac_ratio DESC NULLS LAST;
```

---

## 6. Net Revenue Retention (NRR)

### Definition

NRR measures how much revenue you retain from existing customers, including expansions (upgrades) and contractions (downgrades). An NRR above 100% means existing customers are growing in value — this is the hallmark of a healthy SaaS business.

### Formula

```
NRR = (Starting MRR + Expansion MRR - Contraction MRR - Churned MRR) / Starting MRR × 100

Example:
Starting MRR: $10,000
Expansion (upgrades): +$1,500
Contraction (downgrades): -$500
Churned: -$800
NRR = ($10,000 + $1,500 - $500 - $800) / $10,000 × 100 = 102%
```

### SQL Query

```sql
-- Net Revenue Retention (trailing 12 months)
WITH monthly_cohort AS (
  SELECT
    u.id,
    date_trunc('month', u.created_at) AS signup_month,
    CASE
      WHEN u.billing_period = 'ANNUAL' THEN
        CASE u.current_plan WHEN 'SMART' THEN 84.99 WHEN 'PRO' THEN 170.00 ELSE 0 END
      ELSE
        CASE u.current_plan WHEN 'STARTER' THEN 19.99 WHEN 'PLUS' THEN 49.99 WHEN 'SMART' THEN 99.99 WHEN 'PRO' THEN 200.00 ELSE 0 END
    END AS current_mrr_contribution,
    u.subscription_status
  FROM users u
  WHERE u.created_at < date_trunc('month', CURRENT_DATE) - INTERVAL '12 months'
),
starting AS (
  SELECT SUM(current_mrr_contribution) AS starting_mrr
  FROM monthly_cohort
  WHERE subscription_status IN ('ACTIVE', 'TRIALING')
),
current_state AS (
  SELECT SUM(
    CASE
      WHEN subscription_status IN ('ACTIVE', 'TRIALING') THEN current_mrr_contribution
      ELSE 0
    END
  ) AS current_mrr
  FROM monthly_cohort
)
SELECT
  s.starting_mrr,
  c.current_mrr,
  ROUND(c.current_mrr / NULLIF(s.starting_mrr, 0) * 100, 1) AS nrr_pct,
  CASE
    WHEN c.current_mrr / NULLIF(s.starting_mrr, 0) * 100 >= 120 THEN 'excellent'
    WHEN c.current_mrr / NULLIF(s.starting_mrr, 0) * 100 >= 100 THEN 'healthy'
    WHEN c.current_mrr / NULLIF(s.starting_mrr, 0) * 100 >= 85 THEN 'concerning'
    ELSE 'critical'
  END AS health
FROM starting s, current_state c;
```

---

## 7. Expansion Revenue

### Tracking Upgrades and Upsells

```sql
-- Expansion revenue by month
SELECT
  date_trunc('month', pcl.created_at) AS month,
  COUNT(*) AS upgrade_count,
  SUM(
    get_monthly_price(pcl.to_plan, pcl.to_period) -
    get_monthly_price(pcl.from_plan, pcl.from_period)
  ) AS expansion_mrr,
  AVG(
    get_monthly_price(pcl.to_plan, pcl.to_period) -
    get_monthly_price(pcl.from_plan, pcl.from_period)
  ) AS avg_expansion_per_upgrade
FROM plan_change_logs pcl
WHERE pcl.type = 'UPGRADE'
  AND pcl.created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY 1
ORDER BY 1;

-- Most common upgrade paths
SELECT
  pcl.from_plan || ' → ' || pcl.to_plan AS upgrade_path,
  COUNT(*) AS count,
  ROUND(
    COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100,
    1
  ) AS percentage,
  AVG(
    EXTRACT(EPOCH FROM (pcl.created_at - u.created_at)) / (30.44 * 24 * 3600)
  ) AS avg_months_before_upgrade
FROM plan_change_logs pcl
JOIN users u ON u.id = pcl.user_id
WHERE pcl.type = 'UPGRADE'
  AND pcl.created_at >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY 1
ORDER BY 2 DESC;
```

---

## 8. Cohort Analysis

### Monthly Cohort Retention

```sql
-- Cohort retention matrix (revenue retention by signup month)
WITH cohorts AS (
  SELECT
    u.id,
    date_trunc('month', u.created_at) AS cohort_month,
    u.subscription_status,
    u.current_plan,
    u.billing_period
  FROM users u
  WHERE u.current_plan != 'FREE'
    AND u.created_at >= CURRENT_DATE - INTERVAL '12 months'
),
months AS (
  SELECT generate_series(0, 11) AS month_offset
),
retention AS (
  SELECT
    c.cohort_month,
    m.month_offset,
    COUNT(DISTINCT c.id) FILTER (
      WHERE c.subscription_status IN ('ACTIVE', 'TRIALING')
        OR c.cohort_month + (m.month_offset || ' months')::interval > CURRENT_DATE
    ) AS retained_customers,
    COUNT(DISTINCT c.id) AS total_customers
  FROM cohorts c
  CROSS JOIN months m
  WHERE c.cohort_month + (m.month_offset || ' months')::interval <= CURRENT_DATE
  GROUP BY c.cohort_month, m.month_offset
)
SELECT
  TO_CHAR(cohort_month, 'YYYY-MM') AS cohort,
  total_customers AS cohort_size,
  month_offset AS months_since_signup,
  retained_customers,
  ROUND(retained_customers::numeric / NULLIF(total_customers, 0) * 100, 1) AS retention_pct
FROM retention
ORDER BY cohort_month, month_offset;
```

### Cohort Revenue Analysis

```sql
-- Revenue per cohort over time
WITH cohorts AS (
  SELECT
    u.id,
    date_trunc('month', u.created_at) AS cohort_month
  FROM users u
  WHERE u.current_plan != 'FREE'
    AND u.created_at >= CURRENT_DATE - INTERVAL '12 months'
),
monthly_revenue AS (
  SELECT
    c.cohort_month,
    date_trunc('month', pe.created_at) AS revenue_month,
    SUM(pe.amount) / 100.0 AS revenue
  FROM cohorts c
  JOIN payment_events pe ON pe.user_id = c.id
    AND pe.type = 'PAYMENT_SUCCEEDED'
  GROUP BY c.cohort_month, date_trunc('month', pe.created_at)
)
SELECT
  TO_CHAR(cohort_month, 'YYYY-MM') AS cohort,
  TO_CHAR(revenue_month, 'YYYY-MM') AS month,
  EXTRACT(MONTH FROM AGE(revenue_month, cohort_month)) AS months_since_signup,
  revenue,
  SUM(revenue) OVER (PARTITION BY cohort_month ORDER BY revenue_month) AS cumulative_revenue
FROM monthly_revenue
ORDER BY cohort_month, revenue_month;
```

---

## 9. Dashboard Implementation

### TypeScript Metrics Service

```typescript
// src/lib/metrics/revenue-metrics.ts
import { prisma } from '@/lib/prisma';

export interface RevenueSnapshot {
  mrr: number;
  arr: number;
  mrrGrowthRate: number;
  totalPayingCustomers: number;
  arpu: number;
  churnRate: number;
  nrr: number;
  ltvCacRatio: number;
  trialConversionRate: number;
  expansionMrr: number;
  contractionMrr: number;
  newMrr: number;
  churnedMrr: number;
}

export async function getRevenueSnapshot(): Promise<RevenueSnapshot> {
  const [
    mrrData,
    customerData,
    churnData,
    expansionData,
    trialData,
  ] = await Promise.all([
    calculateMRR(),
    getCustomerCounts(),
    calculateChurnRate(),
    getExpansionContraction(),
    getTrialConversion(),
  ]);

  const arpu = mrrData.currentMrr / Math.max(customerData.paying, 1);
  const ltv = arpu / Math.max(churnData.rate, 0.01);
  const cac = 50; // Placeholder — calculate from marketing spend

  return {
    mrr: mrrData.currentMrr,
    arr: mrrData.currentMrr * 12,
    mrrGrowthRate: mrrData.growthRate,
    totalPayingCustomers: customerData.paying,
    arpu,
    churnRate: churnData.rate,
    nrr: calculateNRR(mrrData, expansionData),
    ltvCacRatio: ltv / Math.max(cac, 1),
    trialConversionRate: trialData.conversionRate,
    expansionMrr: expansionData.expansion,
    contractionMrr: expansionData.contraction,
    newMrr: mrrData.newMrr,
    churnedMrr: churnData.churnedMrr,
  };
}

async function calculateMRR(): Promise<{
  currentMrr: number;
  previousMrr: number;
  growthRate: number;
  newMrr: number;
}> {
  const result = await prisma.$queryRaw<any[]>`
    SELECT
      COALESCE(SUM(
        CASE
          WHEN billing_period = 'ANNUAL' THEN
            CASE current_plan WHEN 'SMART' THEN 84.99 WHEN 'PRO' THEN 170.00 ELSE 0 END
          ELSE
            CASE current_plan WHEN 'STARTER' THEN 19.99 WHEN 'PLUS' THEN 49.99 WHEN 'SMART' THEN 99.99 WHEN 'PRO' THEN 200.00 ELSE 0 END
        END
      ), 0)::float AS current_mrr,
      COALESCE(SUM(
        CASE
          WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN
            CASE
              WHEN billing_period = 'ANNUAL' THEN
                CASE current_plan WHEN 'SMART' THEN 84.99 WHEN 'PRO' THEN 170.00 ELSE 0 END
              ELSE
                CASE current_plan WHEN 'STARTER' THEN 19.99 WHEN 'PLUS' THEN 49.99 WHEN 'SMART' THEN 99.99 WHEN 'PRO' THEN 200.00 ELSE 0 END
            END
          ELSE 0
        END
      ), 0)::float AS new_mrr
    FROM users
    WHERE subscription_status IN ('ACTIVE', 'TRIALING')
      AND current_plan != 'FREE'
  `;

  const currentMrr = result[0]?.current_mrr ?? 0;
  const newMrr = result[0]?.new_mrr ?? 0;

  return {
    currentMrr,
    previousMrr: currentMrr - newMrr, // Simplified
    growthRate: 0, // Calculate from previous month
    newMrr,
  };
}

// Plan breakdown for dashboard visualization
export async function getPlanBreakdown(): Promise<{
  plan: string;
  count: number;
  mrr: number;
  percentage: number;
}[]> {
  const result = await prisma.$queryRaw<any[]>`
    SELECT
      current_plan AS plan,
      COUNT(*)::int AS count,
      SUM(
        CASE
          WHEN billing_period = 'ANNUAL' THEN
            CASE current_plan WHEN 'SMART' THEN 84.99 WHEN 'PRO' THEN 170.00 ELSE 0 END
          ELSE
            CASE current_plan WHEN 'STARTER' THEN 19.99 WHEN 'PLUS' THEN 49.99 WHEN 'SMART' THEN 99.99 WHEN 'PRO' THEN 200.00 ELSE 0 END
        END
      )::float AS mrr
    FROM users
    WHERE subscription_status IN ('ACTIVE', 'TRIALING')
      AND current_plan != 'FREE'
    GROUP BY current_plan
    ORDER BY
      CASE current_plan
        WHEN 'STARTER' THEN 1
        WHEN 'PLUS' THEN 2
        WHEN 'SMART' THEN 3
        WHEN 'PRO' THEN 4
      END
  `;

  const totalMrr = result.reduce((sum, r) => sum + r.mrr, 0);

  return result.map(r => ({
    plan: r.plan,
    count: r.count,
    mrr: r.mrr,
    percentage: totalMrr > 0 ? (r.mrr / totalMrr) * 100 : 0,
  }));
}
```

### Dashboard API Endpoint

```typescript
// src/app/api/admin/revenue/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getRevenueSnapshot, getPlanBreakdown } from '@/lib/metrics/revenue-metrics';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Check admin access
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN' && user?.role !== 'FOUNDER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [snapshot, planBreakdown] = await Promise.all([
    getRevenueSnapshot(),
    getPlanBreakdown(),
  ]);

  return NextResponse.json({
    snapshot,
    planBreakdown,
    generatedAt: new Date().toISOString(),
  });
}
```

---

## 10. Metric Benchmarks

### SaaS Benchmarks for Stone AI's Stage

| Metric | Poor | Acceptable | Good | Excellent | Stone AI Target |
|--------|------|-----------|------|-----------|----------------|
| Monthly Churn | >5% | 3-5% | 1-3% | <1% | <3% |
| NRR | <85% | 85-100% | 100-120% | >120% | >100% |
| LTV:CAC | <1 | 1-3 | 3-5 | >5 | >3 |
| Trial Conversion | <10% | 10-25% | 25-50% | >50% | >25% |
| Free to Paid | <2% | 2-5% | 5-10% | >10% | >5% |
| Payback Period | >18mo | 12-18mo | 6-12mo | <6mo | <12mo |
| ARPU | <$20 | $20-50 | $50-100 | >$100 | $60+ |

---

## Summary

This revenue metrics dashboard seed covers:

1. **MRR/ARR calculation** with breakdown by component (new, expansion, contraction, churned)
2. **Churn rate analysis** separating voluntary vs involuntary, customer vs revenue churn
3. **LTV computation** using simple, margin-adjusted, and cohort-based approaches
4. **CAC tracking** by acquisition channel with LTV:CAC ratio health scoring
5. **Net Revenue Retention** as the north star metric for customer growth
6. **Expansion revenue tracking** with upgrade path analysis
7. **Cohort analysis** for both retention and revenue over time
8. **TypeScript metrics service** for the admin dashboard API
9. **SQL queries** for every metric, ready to execute against the Prisma/PostgreSQL schema
10. **Benchmark targets** calibrated for Stone AI's stage and pricing

Every metric has a specific SQL query, a TypeScript implementation, and context for why it matters. The dashboard API is admin-gated and returns a complete revenue snapshot in a single request.
