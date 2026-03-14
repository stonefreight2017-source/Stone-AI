# Data Analytics Foundations

## Seed Classification
- **Domain**: Data Analytics / Business Intelligence
- **Relevance**: Stone AI product analytics, user behavior tracking, business decisions
- **Last Updated**: 2026-03-09

---

## The Analytics Mindset

### What Analytics Is (and Isn't)

Analytics is the practice of turning raw data into decisions. Not dashboards. Not charts. Not SQL queries. DECISIONS. Every piece of analytics work should eventually answer: "What should we DO?"

**Analytics IS**:
- A decision-support system
- A way to validate or invalidate assumptions
- A feedback loop between action and outcome
- A tool for finding patterns humans can't see at scale

**Analytics IS NOT**:
- A substitute for judgment
- A guarantee of correctness (data can lie, mislead, or be incomplete)
- A dashboard that nobody looks at
- Vanity metrics to feel good about

### The Analytics Value Chain

```
Raw Data → Clean Data → Metrics → Insights → Decisions → Actions → Outcomes
```

Each step adds value, but ONLY if it leads to the next. Clean data with no metrics is useless. Metrics with no insights are noise. Insights with no decisions are academic. Decisions with no actions are wasted breath.

**Where most companies fail**: They build beautiful dashboards (metrics) and stop. The gap between "looking at data" and "making decisions from data" is where analytics dies.

### Analytical Thinking Framework

For every business question, apply this framework:

1. **What do we want to know?** (The question)
2. **What data do we need to answer it?** (The inputs)
3. **How will we analyze it?** (The method)
4. **What will we do with the answer?** (The action)
5. **How will we know if the action worked?** (The feedback loop)

**Example — Stone AI**:
1. Question: Why do free users not upgrade to Starter?
2. Data: User activity logs, feature usage, session counts, upgrade funnel events
3. Method: Cohort analysis comparing upgraders vs non-upgraders, funnel drop-off analysis
4. Action: If users who try 3+ agents upgrade 5x more → prompt free users to try their 3rd agent
5. Feedback: Track upgrade rate for prompted vs non-prompted users

---

## Data Collection Strategy

### What to Track (Event Taxonomy)

A well-designed event taxonomy is the foundation of ALL analytics. Get this wrong and everything downstream is unreliable.

### Event Naming Convention

**Format**: `{object}.{action}` in snake_case

```
user.signed_up
user.logged_in
user.upgraded
user.downgraded
user.churned

agent.session_started
agent.session_completed
agent.message_sent
agent.message_received
agent.collaboration_initiated

billing.checkout_started
billing.checkout_completed
billing.payment_failed
billing.subscription_cancelled

page.viewed
feature.used
onboarding.step_completed
onboarding.completed
```

### Event Properties

Every event should carry contextual properties:

```json
{
  "event": "agent.session_started",
  "timestamp": "2026-03-09T14:30:00Z",
  "user_id": "usr_abc123",
  "properties": {
    "agent_id": "ag_copywriter_01",
    "agent_name": "Copywriter",
    "session_id": "sess_def456",
    "plan": "starter",
    "source": "dashboard",
    "device_type": "desktop",
    "browser": "chrome"
  }
}
```

**Required properties for ALL events**:
- `timestamp` (ISO 8601)
- `user_id` (anonymized if needed for privacy)
- `session_id` (for session-level analysis)
- `plan` (current subscription tier)

**Additional properties by event type**:
- **Page views**: page_path, referrer, utm_source, utm_medium, utm_campaign
- **Agent events**: agent_id, agent_name, message_count, session_duration
- **Billing events**: plan, amount, currency, payment_method, promo_code
- **Feature usage**: feature_name, duration, completion_status

### Stone AI Event Taxonomy (Core)

#### User Lifecycle Events

| Event | When | Key Properties |
|---|---|---|
| user.signed_up | Account creation | source, referral_code, initial_plan |
| user.onboarding_started | First login | — |
| user.onboarding_completed | Finished onboarding flow | steps_completed, duration_seconds |
| user.first_agent_used | First agent session | agent_id, time_to_first_use |
| user.activated | Completed 3+ agent sessions | days_to_activation |
| user.upgraded | Plan upgrade | from_plan, to_plan, trigger |
| user.downgraded | Plan downgrade | from_plan, to_plan, reason |
| user.churned | Subscription cancelled | plan, tenure_days, reason |
| user.reactivated | Returned after churn | previous_plan, new_plan, days_churned |

#### Agent Usage Events

| Event | When | Key Properties |
|---|---|---|
| agent.session_started | New session created | agent_id, context_provided |
| agent.message_sent | User sends message | agent_id, message_length, has_attachment |
| agent.message_received | Agent responds | agent_id, response_time_ms, token_count |
| agent.session_completed | Session ends | agent_id, message_count, duration_seconds, satisfaction_rating |
| agent.collaboration_started | Cross-agent handoff | source_agent, target_agent, context_shared |
| agent.memory_accessed | Agent retrieves memory | agent_id, memory_items_retrieved |

#### Billing Events

| Event | When | Key Properties |
|---|---|---|
| billing.checkout_started | Clicks upgrade | target_plan, current_plan |
| billing.checkout_completed | Payment succeeds | plan, amount, interval, promo_code |
| billing.payment_failed | Payment fails | plan, failure_reason, retry_count |
| billing.subscription_renewed | Auto-renewal | plan, amount, tenure_months |
| billing.subscription_cancelled | Cancels | plan, reason, tenure_days |

### Implementation Checklist

- [ ] Every user-facing action fires an event
- [ ] Every event has a timestamp and user_id
- [ ] Event names follow the naming convention consistently
- [ ] Properties are typed correctly (string, number, boolean, not mixed)
- [ ] Server-side events are used for billing/critical actions (never client-side only)
- [ ] Event schema is documented and version-controlled
- [ ] QA process verifies events fire correctly before each release
- [ ] Data team has reviewed and approved the taxonomy

---

## Data Quality

### The Five Dimensions of Data Quality

1. **Completeness**: Are there gaps? Missing events, null properties, partial records?
2. **Accuracy**: Does the data reflect reality? Are timestamps correct? Are user_ids matching?
3. **Consistency**: Does "plan=starter" mean the same thing everywhere? Are naming conventions followed?
4. **Timeliness**: How fresh is the data? Real-time events arriving hours late are stale.
5. **Validity**: Do values make sense? A session_duration of -50 seconds is invalid data.

### Common Data Quality Problems

| Problem | Symptom | Fix |
|---|---|---|
| Duplicate events | Inflated counts | Deduplication by event_id |
| Missing events | Sudden drops in metrics | Event monitoring/alerting |
| Wrong timestamps | Time-based analysis is off | Use server-side timestamps |
| Inconsistent naming | "sign_up" vs "signed_up" | Schema enforcement |
| Bot traffic | Inflated page views | Bot detection + filtering |
| Currency mismatch | Revenue calculations off | Normalize to one currency |
| Timezone issues | Daily metrics don't align | Standardize on UTC |

### Data Quality Monitoring

Set up automated checks that run daily:

```sql
-- Check for missing events (significant drop from previous day)
WITH daily_events AS (
  SELECT
    DATE(timestamp) as event_date,
    event_name,
    COUNT(*) as event_count
  FROM events
  WHERE timestamp >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY 1, 2
)
SELECT
  event_name,
  event_date,
  event_count,
  LAG(event_count) OVER (PARTITION BY event_name ORDER BY event_date) as prev_count,
  ROUND(
    (event_count::numeric / NULLIF(LAG(event_count) OVER (PARTITION BY event_name ORDER BY event_date), 0) - 1) * 100,
    1
  ) as pct_change
FROM daily_events
WHERE event_date = CURRENT_DATE - 1
ORDER BY pct_change ASC;  -- Biggest drops first
```

**Alert thresholds**:
- Event count drops > 50% from previous day → immediate alert
- Any critical event (signup, payment) with zero count → immediate alert
- Null rate on required properties > 5% → daily alert

### Data Quality as a Culture

Data quality isn't a one-time project. It's a practice:

1. **Schema registry**: All events go through a schema definition before implementation
2. **QA in staging**: Test every new event in staging before production
3. **Monitoring**: Automated checks on event volumes, null rates, and anomalies
4. **Ownership**: Assign a data quality owner (person or team)
5. **Documentation**: Every event and property is documented with examples
6. **Regular audits**: Monthly review of top 20 events for accuracy

---

## Privacy-Compliant Tracking

### Legal Frameworks

| Regulation | Jurisdiction | Key Requirements |
|---|---|---|
| GDPR | EU/EEA | Consent before tracking, right to deletion, data minimization |
| CCPA/CPRA | California | Right to opt-out of sale/sharing, right to deletion |
| LGPD | Brazil | Consent-based, data minimization, right to deletion |
| PIPEDA | Canada | Knowledge and consent, limited collection |
| ePrivacy | EU | Cookie consent, communication privacy |

### Privacy-First Analytics Architecture

```
┌──────────────────────────────┐
│        User Action           │
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│    Consent Check             │
│  (Has user consented to      │
│   this category of tracking?)│
└──────────┬───────────────────┘
           │
    ┌──────┴──────┐
    ▼             ▼
┌────────┐  ┌──────────┐
│ Yes    │  │ No       │
│Track   │  │Don't     │
│full    │  │track OR  │
│event   │  │track     │
│        │  │anonymous │
└────────┘  └──────────┘
```

### What You Can Track Without Consent

Under most frameworks, you can track:
- **Strictly necessary** analytics: error rates, uptime, security events
- **Aggregated/anonymous** data: total page views (not tied to a user), error counts
- **First-party server-side** events: user actions within your product (in many jurisdictions, this falls under "legitimate interest" if you're not sharing data)

### What Requires Consent

- Third-party analytics (Google Analytics, Meta Pixel, etc.)
- Cross-site tracking
- Advertising identifiers
- Any data shared with third parties
- Cookies (in the EU, almost ALL non-essential cookies)

### Data Minimization Checklist

- [ ] Only collect data you'll actually analyze (no "just in case" tracking)
- [ ] Set retention periods for all data categories
- [ ] Implement automated deletion at retention limits
- [ ] Anonymize data when individual identity isn't needed
- [ ] Don't store raw IP addresses (hash or truncate)
- [ ] Don't track sensitive categories (health, religion, politics) unless essential
- [ ] Document the purpose for every tracked property
- [ ] Provide data export and deletion for individual users (GDPR Article 17/20)

### Cookie Consent Implementation

```
Banner appears on first visit:
┌────────────────────────────────────────────────────────┐
│ We use cookies to improve your experience.             │
│                                                        │
│ ✅ Essential (always on)                               │
│ ☐  Analytics (helps us improve the product)            │
│ ☐  Marketing (personalized ads and content)            │
│                                                        │
│ [Accept All]  [Save Preferences]  [Reject Non-Essential│
└────────────────────────────────────────────────────────┘
```

**Rules**:
- Pre-checked boxes for non-essential categories are ILLEGAL under GDPR
- "Accept All" and "Reject All" must be equally prominent (no dark patterns)
- Consent must be recordable and provable
- Users must be able to change consent at any time
- No tracking fires before consent is given

---

## Analytics Infrastructure

### Data Stack Options for SaaS

**Lightweight (Early Stage — Stone AI's current position)**:
- Event collection: Vercel Analytics + custom server-side events in PostgreSQL
- Warehouse: Neon PostgreSQL (same DB, analytics schema)
- Dashboard: Custom admin dashboard or Metabase
- Cost: $0-50/month

**Mid-Stage (Growing)**:
- Event collection: PostHog (self-hosted or cloud) or Segment
- Warehouse: Neon PostgreSQL or dedicated warehouse
- Dashboard: Metabase or Grafana
- ETL: Simple cron jobs or dbt
- Cost: $100-500/month

**Scale (High Volume)**:
- Event collection: Segment → Snowflake/BigQuery
- Warehouse: Snowflake or BigQuery
- Dashboard: Metabase, Looker, or Tableau
- ETL: dbt + Airflow/Dagster
- Cost: $500-5,000+/month

### Stone AI Analytics Architecture (Current)

```
User Action → Next.js API Route → PostgreSQL (events table)
                                          │
                                          ▼
                                  Admin Dashboard (queries)
                                  Scheduled Reports (cron)
```

**Events table schema** (PostgreSQL):
```sql
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name VARCHAR(100) NOT NULL,
  user_id VARCHAR(50),
  session_id VARCHAR(50),
  properties JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX idx_events_name_timestamp ON analytics_events(event_name, timestamp);
CREATE INDEX idx_events_user_id ON analytics_events(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_events_timestamp ON analytics_events(timestamp);
CREATE INDEX idx_events_properties ON analytics_events USING GIN(properties);
```

### Event Ingestion Best Practices

1. **Batch inserts**: Don't insert one event at a time. Buffer and batch every 5-10 seconds.
2. **Async processing**: Event tracking should NEVER slow down the user-facing request.
3. **Retry logic**: Failed event inserts should retry, not silently drop.
4. **Schema validation**: Validate event structure before insertion (Zod schema).
5. **Deduplication**: Include a client-generated event_id to prevent duplicate inserts on retries.

---

## Core SaaS Metrics

### The Metric Hierarchy

```
North Star Metric
├── Acquisition Metrics
│   ├── Traffic
│   ├── Sign-up rate
│   └── Cost per acquisition (CPA)
├── Activation Metrics
│   ├── Onboarding completion rate
│   ├── Time to first value
│   └── Feature adoption rate
├── Retention Metrics
│   ├── Daily/Weekly/Monthly active users
│   ├── Retention rate (by cohort)
│   └── Churn rate
├── Revenue Metrics
│   ├── MRR (Monthly Recurring Revenue)
│   ├── ARPU (Average Revenue Per User)
│   ├── LTV (Lifetime Value)
│   └── LTV:CAC ratio
└── Referral Metrics
    ├── Referral rate
    ├── Viral coefficient
    └── NPS
```

### Metric Definitions for Stone AI

**MRR (Monthly Recurring Revenue)**:
Sum of all active subscription amounts, normalized to monthly.
```
MRR = Σ(active_subscription_monthly_amount)
Annual plans: divide by 12 for monthly equivalent
```

**Churn Rate**:
```
Monthly Churn Rate = (Customers lost in month / Customers at start of month) × 100
```
Good: < 5% monthly, Great: < 3%, Exceptional: < 1%

**ARPU (Average Revenue Per User)**:
```
ARPU = MRR / Total Active Paid Users
```

**LTV (Lifetime Value)**:
```
LTV = ARPU / Monthly Churn Rate
Example: $50 ARPU / 5% churn = $1,000 LTV
```

**CAC (Customer Acquisition Cost)**:
```
CAC = Total Sales & Marketing Spend / New Customers Acquired
```

**LTV:CAC Ratio**:
```
Target: > 3:1 (you make $3 for every $1 spent acquiring)
Warning zone: < 1:1 (you're losing money on every customer)
```

**Activation Rate**:
```
Activation Rate = (Users completing activation criteria / Total sign-ups) × 100
Stone AI activation = user completes 3+ agent sessions within 7 days
```

**Net Revenue Retention (NRR)**:
```
NRR = (MRR at start + expansion - contraction - churn) / MRR at start × 100
Target: > 100% (expansion revenue exceeds churn revenue)
Great: > 110%
Exceptional: > 130%
```

---

## Building Your First Dashboard

### What to Include (Minimum Viable Dashboard)

**Page 1: Business Overview**
- MRR (with trend line)
- Total users (free + paid)
- Paid users by tier
- Churn rate (trailing 30 days)
- Sign-ups (trailing 30 days)

**Page 2: User Activity**
- DAU/WAU/MAU
- Agent sessions per day
- Top agents by usage
- Average session duration
- Feature adoption rates

**Page 3: Revenue**
- MRR breakdown by tier
- New MRR vs churned MRR
- ARPU by tier
- LTV:CAC ratio
- Revenue retention (NRR)

**Page 4: Funnel**
- Visitor → Sign-up → Activation → Upgrade → Retention
- Conversion rates at each stage
- Drop-off points identified

### Dashboard Design Principles

See `dashboard-design-principles.md` for full coverage. Key rules:

1. **Most important metric at the top left** (eye tracking follows F-pattern)
2. **One metric per card** — don't combine unrelated data
3. **Trend over snapshot** — show the direction, not just the number
4. **Comparison context** — "5% churn" means nothing without "was 7% last month"
5. **Refresh rate matches decision speed** — real-time for ops, daily for strategy

---

## From Data to Decisions

### The Decision Framework

Not every insight requires action. Use this filter:

1. **Is the insight statistically significant?** Small samples lie.
2. **Is it actionable?** "Users in Brazil convert 2% less" — what can we DO about it?
3. **Is it material?** A 0.1% improvement isn't worth engineering effort.
4. **Is it causal or correlational?** Users who use 3 agents upgrade more — does using 3 agents CAUSE upgrades, or do people inclined to upgrade also use more agents?
5. **What's the cost of being wrong?** If we act on this insight and it's wrong, what's the downside?

### Common Analytical Pitfalls

**Survivorship bias**: Analyzing only users who stayed, ignoring those who left. "Our average user loves feature X" — but maybe the users who hated feature X already churned.

**Simpson's paradox**: A trend that appears in aggregate data reverses when data is grouped. Hospital A has higher survival rates overall, but Hospital B is better for EVERY individual condition — because Hospital B treats harder cases.

**Correlation ≠ causation**: Ice cream sales and drowning deaths both increase in summer. Ice cream doesn't cause drowning.

**Cherry-picking timeframes**: Revenue is up 50%! (If you compare this month to the worst month last year.) Always use consistent comparison periods.

**Vanity metrics**: Total sign-ups only goes up. Monthly active users can go down. Track the metric that can tell you bad news.

---

## Analytics Maturity Model

### Level 1: Reactive (Where Most Startups Are)
- Check analytics when something feels wrong
- No systematic tracking
- Decisions based on gut + occasional SQL query
- "I think users like this feature"

### Level 2: Descriptive (Know What Happened)
- Consistent event tracking
- Basic dashboard with core metrics
- Weekly metric reviews
- "Users dropped 15% last week"

### Level 3: Diagnostic (Know Why It Happened)
- Segmented analysis (by cohort, tier, behavior)
- Funnel analysis with drop-off identification
- Correlation analysis
- "Users dropped because we broke the onboarding flow on mobile"

### Level 4: Predictive (Know What Will Happen)
- Churn prediction models
- LTV forecasting
- Seasonal pattern recognition
- "These 200 users are likely to churn next month based on their activity pattern"

### Level 5: Prescriptive (Know What to Do About It)
- Automated interventions (churn prevention emails triggered by prediction)
- A/B testing culture with systematic experimentation
- Data-informed product roadmap
- "Send these 200 at-risk users a re-engagement campaign — expected to save $8K in MRR"

**Stone AI target**: Level 3 now, Level 4 within 6 months.

---

## Quick Reference: SQL for Analytics

### Essential Aggregations

```sql
-- Daily active users
SELECT DATE(timestamp) as day, COUNT(DISTINCT user_id) as dau
FROM analytics_events
WHERE event_name = 'user.logged_in'
AND timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY 1 ORDER BY 1;

-- MRR by tier
SELECT
  plan,
  COUNT(*) as subscribers,
  SUM(monthly_amount) as mrr
FROM subscriptions
WHERE status = 'active'
GROUP BY plan
ORDER BY mrr DESC;

-- Conversion funnel
SELECT
  COUNT(DISTINCT CASE WHEN event_name = 'page.viewed' AND properties->>'page' = '/signup' THEN user_id END) as visited_signup,
  COUNT(DISTINCT CASE WHEN event_name = 'user.signed_up' THEN user_id END) as signed_up,
  COUNT(DISTINCT CASE WHEN event_name = 'agent.session_started' THEN user_id END) as used_agent,
  COUNT(DISTINCT CASE WHEN event_name = 'user.upgraded' THEN user_id END) as upgraded
FROM analytics_events
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days';
```

See `sql-analytics-queries.md` for comprehensive query library.

---

*This seed is part of the Stone AI Palace USB Package — Data Analytics domain.*
