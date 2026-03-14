# SQL Analytics Queries

## Seed Classification
- **Domain**: Data Analytics / SQL
- **Relevance**: Stone AI business intelligence, PostgreSQL-specific analytics queries
- **Last Updated**: 2026-03-09

---

## Revenue Queries

### Monthly Recurring Revenue (MRR)

```sql
-- Current MRR by plan tier
SELECT
  plan,
  COUNT(*) as subscriber_count,
  SUM(
    CASE
      WHEN billing_interval = 'monthly' THEN amount
      WHEN billing_interval = 'yearly' THEN amount / 12.0
      ELSE 0
    END
  ) as mrr
FROM subscriptions
WHERE status = 'active'
GROUP BY plan
ORDER BY mrr DESC;
```

### MRR Trend Over Time

```sql
-- MRR at the end of each month (point-in-time reconstruction)
WITH months AS (
  SELECT generate_series(
    DATE_TRUNC('month', '2025-01-01'::date),
    DATE_TRUNC('month', CURRENT_DATE),
    '1 month'::interval
  )::date as month_start
),
mrr_per_month AS (
  SELECT
    m.month_start,
    SUM(
      CASE
        WHEN s.billing_interval = 'monthly' THEN s.amount
        WHEN s.billing_interval = 'yearly' THEN s.amount / 12.0
        ELSE 0
      END
    ) as mrr
  FROM months m
  LEFT JOIN subscriptions s
    ON s.started_at <= (m.month_start + INTERVAL '1 month' - INTERVAL '1 day')
    AND (s.cancelled_at IS NULL OR s.cancelled_at > (m.month_start + INTERVAL '1 month' - INTERVAL '1 day'))
    AND s.status IN ('active', 'cancelled') -- Include cancelled to reconstruct history
  GROUP BY m.month_start
)
SELECT
  month_start,
  mrr,
  LAG(mrr) OVER (ORDER BY month_start) as prev_mrr,
  ROUND(
    (mrr - LAG(mrr) OVER (ORDER BY month_start)) / NULLIF(LAG(mrr) OVER (ORDER BY month_start), 0) * 100,
    1
  ) as mrr_growth_pct
FROM mrr_per_month
ORDER BY month_start;
```

### MRR Movement (New, Expansion, Contraction, Churn)

```sql
-- MRR decomposition for a given month
WITH current_month AS (
  SELECT DATE_TRUNC('month', CURRENT_DATE) as month_start
),
prev_month_subs AS (
  SELECT user_id, plan, amount, billing_interval,
    CASE
      WHEN billing_interval = 'monthly' THEN amount
      WHEN billing_interval = 'yearly' THEN amount / 12.0
    END as monthly_amount
  FROM subscriptions
  WHERE started_at < (SELECT month_start FROM current_month)
    AND (cancelled_at IS NULL OR cancelled_at >= (SELECT month_start FROM current_month))
),
curr_month_subs AS (
  SELECT user_id, plan, amount, billing_interval,
    CASE
      WHEN billing_interval = 'monthly' THEN amount
      WHEN billing_interval = 'yearly' THEN amount / 12.0
    END as monthly_amount
  FROM subscriptions
  WHERE status = 'active'
    AND started_at < (SELECT month_start FROM current_month) + INTERVAL '1 month'
)
SELECT
  COALESCE(SUM(CASE WHEN p.user_id IS NULL AND c.user_id IS NOT NULL THEN c.monthly_amount END), 0) as new_mrr,
  COALESCE(SUM(CASE WHEN p.user_id IS NOT NULL AND c.user_id IS NOT NULL AND c.monthly_amount > p.monthly_amount THEN c.monthly_amount - p.monthly_amount END), 0) as expansion_mrr,
  COALESCE(SUM(CASE WHEN p.user_id IS NOT NULL AND c.user_id IS NOT NULL AND c.monthly_amount < p.monthly_amount THEN p.monthly_amount - c.monthly_amount END), 0) as contraction_mrr,
  COALESCE(SUM(CASE WHEN p.user_id IS NOT NULL AND c.user_id IS NULL THEN p.monthly_amount END), 0) as churned_mrr
FROM prev_month_subs p
FULL OUTER JOIN curr_month_subs c ON p.user_id = c.user_id;
```

### Revenue Per User

```sql
-- ARPU by plan
SELECT
  plan,
  COUNT(DISTINCT user_id) as users,
  SUM(total_paid) as total_revenue,
  ROUND(SUM(total_paid) / COUNT(DISTINCT user_id), 2) as arpu
FROM (
  SELECT
    user_id,
    plan,
    SUM(amount) as total_paid
  FROM payments
  WHERE status = 'succeeded'
    AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
  GROUP BY user_id, plan
) sub
GROUP BY plan
ORDER BY arpu DESC;
```

### Daily Revenue

```sql
-- Daily revenue with running total for the month
SELECT
  DATE(created_at) as day,
  COUNT(*) as transactions,
  SUM(amount) as daily_revenue,
  SUM(SUM(amount)) OVER (
    ORDER BY DATE(created_at)
  ) as running_total
FROM payments
WHERE status = 'succeeded'
  AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY DATE(created_at)
ORDER BY day;
```

---

## Cohort Queries

### Sign-Up Cohort Retention

```sql
-- Monthly retention by sign-up cohort
WITH user_cohorts AS (
  SELECT
    id as user_id,
    DATE_TRUNC('month', created_at)::date as cohort_month
  FROM users
),
user_activity AS (
  SELECT
    user_id,
    DATE_TRUNC('month', timestamp)::date as activity_month
  FROM analytics_events
  WHERE event_name IN ('agent.session_started', 'user.logged_in')
  GROUP BY user_id, DATE_TRUNC('month', timestamp)::date
)
SELECT
  uc.cohort_month,
  COUNT(DISTINCT uc.user_id) as cohort_size,
  COUNT(DISTINCT CASE WHEN ua.activity_month = uc.cohort_month THEN ua.user_id END) as month_0,
  COUNT(DISTINCT CASE WHEN ua.activity_month = uc.cohort_month + INTERVAL '1 month' THEN ua.user_id END) as month_1,
  COUNT(DISTINCT CASE WHEN ua.activity_month = uc.cohort_month + INTERVAL '2 months' THEN ua.user_id END) as month_2,
  COUNT(DISTINCT CASE WHEN ua.activity_month = uc.cohort_month + INTERVAL '3 months' THEN ua.user_id END) as month_3,
  COUNT(DISTINCT CASE WHEN ua.activity_month = uc.cohort_month + INTERVAL '4 months' THEN ua.user_id END) as month_4,
  COUNT(DISTINCT CASE WHEN ua.activity_month = uc.cohort_month + INTERVAL '5 months' THEN ua.user_id END) as month_5,
  COUNT(DISTINCT CASE WHEN ua.activity_month = uc.cohort_month + INTERVAL '6 months' THEN ua.user_id END) as month_6
FROM user_cohorts uc
LEFT JOIN user_activity ua ON uc.user_id = ua.user_id
GROUP BY uc.cohort_month
ORDER BY uc.cohort_month;
```

### Retention Rate (Percentage)

```sql
-- Same query but as percentages
WITH cohort_data AS (
  -- [use the CTE from above]
  SELECT
    uc.cohort_month,
    COUNT(DISTINCT uc.user_id) as cohort_size,
    COUNT(DISTINCT CASE WHEN ua.activity_month = uc.cohort_month THEN ua.user_id END) as m0,
    COUNT(DISTINCT CASE WHEN ua.activity_month = uc.cohort_month + INTERVAL '1 month' THEN ua.user_id END) as m1,
    COUNT(DISTINCT CASE WHEN ua.activity_month = uc.cohort_month + INTERVAL '2 months' THEN ua.user_id END) as m2,
    COUNT(DISTINCT CASE WHEN ua.activity_month = uc.cohort_month + INTERVAL '3 months' THEN ua.user_id END) as m3
  FROM user_cohorts uc
  LEFT JOIN user_activity ua ON uc.user_id = ua.user_id
  GROUP BY uc.cohort_month
)
SELECT
  cohort_month,
  cohort_size,
  ROUND(m0::numeric / NULLIF(cohort_size, 0) * 100, 1) as m0_pct,
  ROUND(m1::numeric / NULLIF(cohort_size, 0) * 100, 1) as m1_pct,
  ROUND(m2::numeric / NULLIF(cohort_size, 0) * 100, 1) as m2_pct,
  ROUND(m3::numeric / NULLIF(cohort_size, 0) * 100, 1) as m3_pct
FROM cohort_data
ORDER BY cohort_month;
```

### Revenue Cohort

```sql
-- Revenue retention by sign-up cohort
WITH user_cohorts AS (
  SELECT id as user_id, DATE_TRUNC('month', created_at)::date as cohort_month
  FROM users
),
monthly_revenue AS (
  SELECT
    user_id,
    DATE_TRUNC('month', created_at)::date as revenue_month,
    SUM(amount) as revenue
  FROM payments
  WHERE status = 'succeeded'
  GROUP BY user_id, DATE_TRUNC('month', created_at)::date
)
SELECT
  uc.cohort_month,
  COUNT(DISTINCT uc.user_id) as cohort_size,
  SUM(CASE WHEN mr.revenue_month = uc.cohort_month THEN mr.revenue END) as m0_revenue,
  SUM(CASE WHEN mr.revenue_month = uc.cohort_month + INTERVAL '1 month' THEN mr.revenue END) as m1_revenue,
  SUM(CASE WHEN mr.revenue_month = uc.cohort_month + INTERVAL '2 months' THEN mr.revenue END) as m2_revenue,
  SUM(CASE WHEN mr.revenue_month = uc.cohort_month + INTERVAL '3 months' THEN mr.revenue END) as m3_revenue
FROM user_cohorts uc
LEFT JOIN monthly_revenue mr ON uc.user_id = mr.user_id
GROUP BY uc.cohort_month
ORDER BY uc.cohort_month;
```

---

## Funnel Queries

### Sign-Up to Upgrade Funnel

```sql
-- Full conversion funnel with drop-off rates
WITH funnel AS (
  SELECT
    COUNT(DISTINCT CASE WHEN event_name = 'page.viewed' AND properties->>'page' = '/' THEN user_id END) as visited_home,
    COUNT(DISTINCT CASE WHEN event_name = 'page.viewed' AND properties->>'page' = '/signup' THEN user_id END) as visited_signup,
    COUNT(DISTINCT CASE WHEN event_name = 'user.signed_up' THEN user_id END) as signed_up,
    COUNT(DISTINCT CASE WHEN event_name = 'user.onboarding_completed' THEN user_id END) as onboarded,
    COUNT(DISTINCT CASE WHEN event_name = 'agent.session_started' THEN user_id END) as used_agent,
    COUNT(DISTINCT CASE WHEN event_name = 'user.activated' THEN user_id END) as activated,
    COUNT(DISTINCT CASE WHEN event_name = 'user.upgraded' THEN user_id END) as upgraded
  FROM analytics_events
  WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
)
SELECT
  visited_home,
  visited_signup,
  ROUND(visited_signup::numeric / NULLIF(visited_home, 0) * 100, 1) as home_to_signup_pct,
  signed_up,
  ROUND(signed_up::numeric / NULLIF(visited_signup, 0) * 100, 1) as signup_conversion_pct,
  onboarded,
  ROUND(onboarded::numeric / NULLIF(signed_up, 0) * 100, 1) as onboarding_pct,
  used_agent,
  ROUND(used_agent::numeric / NULLIF(onboarded, 0) * 100, 1) as agent_usage_pct,
  activated,
  ROUND(activated::numeric / NULLIF(used_agent, 0) * 100, 1) as activation_pct,
  upgraded,
  ROUND(upgraded::numeric / NULLIF(activated, 0) * 100, 1) as upgrade_pct
FROM funnel;
```

### Agent-Specific Funnel

```sql
-- Which agents drive upgrades?
WITH agent_usage_before_upgrade AS (
  SELECT
    ae.user_id,
    ae.properties->>'agent_name' as agent_name,
    COUNT(*) as sessions_before_upgrade
  FROM analytics_events ae
  INNER JOIN analytics_events ue
    ON ae.user_id = ue.user_id
    AND ue.event_name = 'user.upgraded'
    AND ae.timestamp < ue.timestamp
  WHERE ae.event_name = 'agent.session_started'
  GROUP BY ae.user_id, ae.properties->>'agent_name'
)
SELECT
  agent_name,
  COUNT(DISTINCT user_id) as users_who_upgraded_after_using,
  ROUND(AVG(sessions_before_upgrade), 1) as avg_sessions_before_upgrade,
  SUM(sessions_before_upgrade) as total_sessions
FROM agent_usage_before_upgrade
GROUP BY agent_name
ORDER BY users_who_upgraded_after_using DESC;
```

### Time-to-Upgrade Analysis

```sql
-- How long does it take users to upgrade from sign-up?
WITH upgrade_times AS (
  SELECT
    u.id as user_id,
    u.created_at as signup_date,
    MIN(ae.timestamp) as upgrade_date,
    EXTRACT(EPOCH FROM MIN(ae.timestamp) - u.created_at) / 86400.0 as days_to_upgrade
  FROM users u
  INNER JOIN analytics_events ae
    ON u.id::text = ae.user_id
    AND ae.event_name = 'user.upgraded'
  GROUP BY u.id, u.created_at
)
SELECT
  CASE
    WHEN days_to_upgrade < 1 THEN 'Same day'
    WHEN days_to_upgrade < 3 THEN '1-2 days'
    WHEN days_to_upgrade < 7 THEN '3-6 days'
    WHEN days_to_upgrade < 14 THEN '1-2 weeks'
    WHEN days_to_upgrade < 30 THEN '2-4 weeks'
    WHEN days_to_upgrade < 90 THEN '1-3 months'
    ELSE '3+ months'
  END as time_bucket,
  COUNT(*) as users,
  ROUND(AVG(days_to_upgrade), 1) as avg_days
FROM upgrade_times
GROUP BY 1
ORDER BY MIN(days_to_upgrade);
```

---

## Retention Queries

### Daily/Weekly/Monthly Active Users

```sql
-- DAU, WAU, MAU for the last 30 days
SELECT
  DATE(timestamp) as day,
  COUNT(DISTINCT user_id) as dau,
  COUNT(DISTINCT user_id) FILTER (
    WHERE timestamp >= DATE(timestamp) - INTERVAL '6 days'
  ) as wau,
  COUNT(DISTINCT user_id) FILTER (
    WHERE timestamp >= DATE(timestamp) - INTERVAL '29 days'
  ) as mau
FROM analytics_events
WHERE event_name IN ('user.logged_in', 'agent.session_started')
  AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY day;
```

### Stickiness (DAU/MAU Ratio)

```sql
-- DAU/MAU ratio — how "sticky" is the product?
WITH daily_users AS (
  SELECT
    DATE(timestamp) as day,
    COUNT(DISTINCT user_id) as dau
  FROM analytics_events
  WHERE event_name IN ('user.logged_in', 'agent.session_started')
    AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY DATE(timestamp)
),
monthly_users AS (
  SELECT COUNT(DISTINCT user_id) as mau
  FROM analytics_events
  WHERE event_name IN ('user.logged_in', 'agent.session_started')
    AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
)
SELECT
  du.day,
  du.dau,
  mu.mau,
  ROUND(du.dau::numeric / NULLIF(mu.mau, 0) * 100, 1) as stickiness_pct
FROM daily_users du
CROSS JOIN monthly_users mu
ORDER BY du.day;
-- Target: > 20% is good for SaaS, > 50% is exceptional
```

### User Engagement Segments

```sql
-- Segment users by activity level (last 30 days)
WITH user_activity AS (
  SELECT
    user_id,
    COUNT(DISTINCT DATE(timestamp)) as active_days,
    COUNT(*) as total_events,
    MAX(timestamp) as last_active
  FROM analytics_events
  WHERE event_name = 'agent.session_started'
    AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY user_id
)
SELECT
  CASE
    WHEN active_days >= 20 THEN 'Power User (20+ days)'
    WHEN active_days >= 10 THEN 'Regular (10-19 days)'
    WHEN active_days >= 4 THEN 'Casual (4-9 days)'
    WHEN active_days >= 1 THEN 'Light (1-3 days)'
    ELSE 'Dormant (0 days)'
  END as segment,
  COUNT(*) as user_count,
  ROUND(AVG(total_events), 1) as avg_events,
  ROUND(AVG(active_days), 1) as avg_active_days
FROM user_activity
GROUP BY 1
ORDER BY MIN(active_days) DESC;
```

### Resurrection Rate

```sql
-- Users who returned after 30+ days of inactivity
WITH user_gaps AS (
  SELECT
    user_id,
    DATE(timestamp) as active_date,
    LAG(DATE(timestamp)) OVER (PARTITION BY user_id ORDER BY DATE(timestamp)) as prev_active_date,
    DATE(timestamp) - LAG(DATE(timestamp)) OVER (PARTITION BY user_id ORDER BY DATE(timestamp)) as gap_days
  FROM (
    SELECT DISTINCT user_id, DATE(timestamp)
    FROM analytics_events
    WHERE event_name IN ('user.logged_in', 'agent.session_started')
  ) sub
)
SELECT
  DATE_TRUNC('month', active_date)::date as month,
  COUNT(DISTINCT CASE WHEN gap_days >= 30 THEN user_id END) as resurrected_users,
  COUNT(DISTINCT user_id) as total_active_users,
  ROUND(
    COUNT(DISTINCT CASE WHEN gap_days >= 30 THEN user_id END)::numeric /
    NULLIF(COUNT(DISTINCT user_id), 0) * 100, 1
  ) as resurrection_rate_pct
FROM user_gaps
WHERE active_date >= CURRENT_DATE - INTERVAL '6 months'
GROUP BY 1
ORDER BY 1;
```

---

## LTV Calculation

### Simple LTV

```sql
-- LTV by plan (simple: ARPU / churn rate)
WITH plan_metrics AS (
  SELECT
    plan,
    COUNT(*) as active_subscribers,
    AVG(
      CASE
        WHEN billing_interval = 'monthly' THEN amount
        WHEN billing_interval = 'yearly' THEN amount / 12.0
      END
    ) as avg_monthly_revenue
  FROM subscriptions
  WHERE status = 'active'
  GROUP BY plan
),
churn_metrics AS (
  SELECT
    plan,
    COUNT(*) FILTER (WHERE cancelled_at >= CURRENT_DATE - INTERVAL '30 days') as churned_last_month,
    COUNT(*) as total_ever
  FROM subscriptions
  GROUP BY plan
)
SELECT
  pm.plan,
  pm.active_subscribers,
  ROUND(pm.avg_monthly_revenue, 2) as arpu,
  ROUND(cm.churned_last_month::numeric / NULLIF(pm.active_subscribers, 0) * 100, 1) as monthly_churn_pct,
  CASE
    WHEN cm.churned_last_month > 0
    THEN ROUND(pm.avg_monthly_revenue / (cm.churned_last_month::numeric / pm.active_subscribers), 2)
    ELSE NULL
  END as estimated_ltv
FROM plan_metrics pm
LEFT JOIN churn_metrics cm ON pm.plan = cm.plan
ORDER BY estimated_ltv DESC NULLS LAST;
```

### Actual LTV (Realized Revenue per Customer)

```sql
-- Actual revenue generated per user, by sign-up cohort
WITH user_revenue AS (
  SELECT
    u.id as user_id,
    DATE_TRUNC('month', u.created_at)::date as cohort_month,
    COALESCE(SUM(p.amount), 0) as total_revenue,
    EXTRACT(EPOCH FROM COALESCE(MAX(s.cancelled_at), NOW()) - u.created_at) / 86400.0 / 30.0 as tenure_months
  FROM users u
  LEFT JOIN payments p ON u.id = p.user_id AND p.status = 'succeeded'
  LEFT JOIN subscriptions s ON u.id = s.user_id
  GROUP BY u.id, u.created_at
)
SELECT
  cohort_month,
  COUNT(*) as users,
  ROUND(AVG(total_revenue), 2) as avg_ltv_to_date,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY total_revenue), 2) as median_ltv,
  ROUND(AVG(tenure_months), 1) as avg_tenure_months,
  ROUND(MAX(total_revenue), 2) as max_ltv
FROM user_revenue
GROUP BY cohort_month
ORDER BY cohort_month;
```

---

## Churn Analysis

### Churn Rate Calculation

```sql
-- Monthly churn rate (logo churn — by customer count)
WITH monthly_state AS (
  SELECT
    DATE_TRUNC('month', d)::date as month,
    COUNT(DISTINCT s.user_id) FILTER (
      WHERE s.started_at < DATE_TRUNC('month', d)
      AND (s.cancelled_at IS NULL OR s.cancelled_at >= DATE_TRUNC('month', d))
    ) as start_of_month_count,
    COUNT(DISTINCT s.user_id) FILTER (
      WHERE s.cancelled_at >= DATE_TRUNC('month', d)
      AND s.cancelled_at < DATE_TRUNC('month', d) + INTERVAL '1 month'
    ) as churned_count
  FROM generate_series(
    '2025-01-01'::date,
    CURRENT_DATE,
    '1 month'::interval
  ) d
  CROSS JOIN subscriptions s
  GROUP BY 1
)
SELECT
  month,
  start_of_month_count,
  churned_count,
  ROUND(churned_count::numeric / NULLIF(start_of_month_count, 0) * 100, 2) as churn_rate_pct
FROM monthly_state
ORDER BY month;
```

### Churn Reason Analysis

```sql
-- Why are users churning?
SELECT
  properties->>'reason' as churn_reason,
  COUNT(*) as occurrences,
  ROUND(COUNT(*)::numeric / SUM(COUNT(*)) OVER () * 100, 1) as pct_of_churns
FROM analytics_events
WHERE event_name = 'user.churned'
  AND timestamp >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY properties->>'reason'
ORDER BY occurrences DESC;
```

### Pre-Churn Behavior Signals

```sql
-- Activity patterns of users who churned vs stayed (last 90 days)
WITH churned_users AS (
  SELECT DISTINCT user_id
  FROM analytics_events
  WHERE event_name = 'user.churned'
    AND timestamp >= CURRENT_DATE - INTERVAL '90 days'
),
user_metrics AS (
  SELECT
    ae.user_id,
    CASE WHEN cu.user_id IS NOT NULL THEN 'churned' ELSE 'active' END as status,
    COUNT(DISTINCT DATE(ae.timestamp)) as active_days,
    COUNT(*) FILTER (WHERE ae.event_name = 'agent.session_started') as sessions,
    COUNT(DISTINCT ae.properties->>'agent_id') FILTER (WHERE ae.event_name = 'agent.session_started') as unique_agents_used,
    AVG(CASE WHEN ae.event_name = 'agent.session_completed'
      THEN (ae.properties->>'duration_seconds')::numeric END) as avg_session_duration
  FROM analytics_events ae
  LEFT JOIN churned_users cu ON ae.user_id = cu.user_id
  WHERE ae.timestamp >= CURRENT_DATE - INTERVAL '90 days'
  GROUP BY ae.user_id, CASE WHEN cu.user_id IS NOT NULL THEN 'churned' ELSE 'active' END
)
SELECT
  status,
  COUNT(*) as users,
  ROUND(AVG(active_days), 1) as avg_active_days,
  ROUND(AVG(sessions), 1) as avg_sessions,
  ROUND(AVG(unique_agents_used), 1) as avg_agents_used,
  ROUND(AVG(avg_session_duration), 0) as avg_session_seconds
FROM user_metrics
GROUP BY status;
```

---

## Feature Usage Queries

### Agent Popularity

```sql
-- Most used agents (sessions and unique users)
SELECT
  properties->>'agent_name' as agent_name,
  COUNT(*) as total_sessions,
  COUNT(DISTINCT user_id) as unique_users,
  ROUND(AVG((properties->>'duration_seconds')::numeric), 0) as avg_duration_sec,
  ROUND(AVG((properties->>'message_count')::numeric), 1) as avg_messages
FROM analytics_events
WHERE event_name = 'agent.session_completed'
  AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY properties->>'agent_name'
ORDER BY total_sessions DESC;
```

### Feature Adoption by Plan

```sql
-- Which features do different tiers use?
SELECT
  u.plan,
  ae.properties->>'feature_name' as feature,
  COUNT(DISTINCT ae.user_id) as users_using,
  COUNT(*) as total_uses,
  ROUND(
    COUNT(DISTINCT ae.user_id)::numeric /
    NULLIF((SELECT COUNT(*) FROM users WHERE plan = u.plan), 0) * 100,
    1
  ) as adoption_pct
FROM analytics_events ae
INNER JOIN users u ON ae.user_id = u.id::text
WHERE ae.event_name = 'feature.used'
  AND ae.timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY u.plan, ae.properties->>'feature_name'
ORDER BY u.plan, adoption_pct DESC;
```

### Power User Identification

```sql
-- Top 10% most active users (for outreach, case studies, beta testing)
WITH user_scores AS (
  SELECT
    user_id,
    COUNT(*) as total_events,
    COUNT(DISTINCT DATE(timestamp)) as active_days,
    COUNT(DISTINCT properties->>'agent_id') as agents_used,
    NTILE(10) OVER (ORDER BY COUNT(*)) as decile
  FROM analytics_events
  WHERE event_name = 'agent.session_started'
    AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY user_id
)
SELECT
  us.user_id,
  u.email,
  u.plan,
  us.total_events,
  us.active_days,
  us.agents_used
FROM user_scores us
INNER JOIN users u ON us.user_id = u.id::text
WHERE us.decile = 10
ORDER BY us.total_events DESC
LIMIT 50;
```

---

## Time-Based Analysis

### Peak Usage Hours

```sql
-- When do users engage most? (by hour of day, in UTC)
SELECT
  EXTRACT(HOUR FROM timestamp) as hour_utc,
  EXTRACT(DOW FROM timestamp) as day_of_week,
  COUNT(*) as events,
  COUNT(DISTINCT user_id) as unique_users
FROM analytics_events
WHERE event_name = 'agent.session_started'
  AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY 1, 2
ORDER BY 2, 1;
```

### Week-over-Week Growth

```sql
-- WoW growth for key metrics
WITH weekly_metrics AS (
  SELECT
    DATE_TRUNC('week', timestamp)::date as week,
    COUNT(DISTINCT user_id) as active_users,
    COUNT(DISTINCT CASE WHEN event_name = 'user.signed_up' THEN user_id END) as new_signups,
    COUNT(CASE WHEN event_name = 'agent.session_started' THEN 1 END) as sessions
  FROM analytics_events
  WHERE timestamp >= CURRENT_DATE - INTERVAL '8 weeks'
  GROUP BY 1
)
SELECT
  week,
  active_users,
  LAG(active_users) OVER (ORDER BY week) as prev_week_users,
  ROUND(
    (active_users - LAG(active_users) OVER (ORDER BY week))::numeric /
    NULLIF(LAG(active_users) OVER (ORDER BY week), 0) * 100, 1
  ) as user_growth_pct,
  new_signups,
  sessions
FROM weekly_metrics
ORDER BY week;
```

---

## Utility Queries

### Quick Health Check

```sql
-- Run this daily — quick snapshot of business health
SELECT
  (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE) as signups_today,
  (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as signups_7d,
  (SELECT COUNT(DISTINCT user_id) FROM analytics_events
   WHERE event_name = 'user.logged_in' AND timestamp >= CURRENT_DATE) as dau_today,
  (SELECT SUM(CASE WHEN billing_interval = 'monthly' THEN amount
    WHEN billing_interval = 'yearly' THEN amount / 12.0 END)
   FROM subscriptions WHERE status = 'active') as current_mrr,
  (SELECT COUNT(*) FROM subscriptions
   WHERE cancelled_at >= CURRENT_DATE - INTERVAL '7 days') as churns_7d,
  (SELECT COUNT(*) FROM analytics_events
   WHERE event_name = 'user.upgraded' AND timestamp >= CURRENT_DATE - INTERVAL '7 days') as upgrades_7d;
```

### Data Quality Check

```sql
-- Quick data quality scan
SELECT
  event_name,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE user_id IS NULL) as null_user_ids,
  COUNT(*) FILTER (WHERE properties IS NULL OR properties = '{}'::jsonb) as empty_properties,
  MIN(timestamp) as earliest,
  MAX(timestamp) as latest
FROM analytics_events
WHERE timestamp >= CURRENT_DATE - INTERVAL '1 day'
GROUP BY event_name
ORDER BY total_events DESC;
```

---

*This seed is part of the Stone AI Palace USB Package — Data Analytics domain.*
