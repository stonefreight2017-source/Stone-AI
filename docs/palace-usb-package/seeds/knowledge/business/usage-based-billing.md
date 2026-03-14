# Usage-Based Billing — Stone AI Tools

## Seed Classification
- **Domain**: Revenue Operations / Payment Infrastructure
- **Complexity**: Advanced
- **Stack**: Next.js 16, TypeScript, Stripe Billing, Prisma 7.4
- **Applies To**: Stone AI Tools (primarily), Stone AI (future usage tracking)

---

## 1. Usage-Based Billing Overview

### Why Usage-Based for Stone AI Tools

Stone AI Tools is an API marketplace. Developers consume AI capabilities through API calls. Usage-based billing aligns revenue with value: developers pay proportionally to how much they use the service. This model:

- **Lowers the entry barrier**: Developers can start for free or near-free, paying only as they grow
- **Aligns with developer expectations**: AWS, Stripe, Twilio — developers expect usage-based pricing from API providers
- **Captures upside**: High-usage customers pay more, matching the infrastructure cost they incur
- **Reduces churn**: No fixed monthly cost to evaluate — users only pay when they get value

### Billing Model: Hybrid (Base + Usage)

Pure usage-based billing creates revenue unpredictability. A hybrid model combines a base subscription with metered usage:

| Plan | Base Price | Included API Calls | Overage Rate |
|------|-----------|-------------------|--------------|
| Free | $0/mo | 1,000 calls/mo | N/A (hard limit) |
| Starter | $29/mo | 50,000 calls/mo | $0.002/call |
| Pro | $99/mo | 250,000 calls/mo | $0.0015/call |
| Enterprise | Custom | Custom | Custom |

The base subscription provides revenue predictability. The included calls provide value certainty (developers know they get X calls for $Y). Overage pricing captures high-usage scenarios without penalizing them.

---

## 2. Stripe Billing Meter

### Stripe Billing Meters (Modern Approach)

Stripe Billing Meters (released 2024) provide native usage-based billing support:

```typescript
// Create a Billing Meter for API calls
const meter = await stripe.billing.meters.create({
  display_name: 'Stone AI Tools API Calls',
  event_name: 'api_call',
  default_aggregation: {
    formula: 'sum',
  },
});

// Create a metered price linked to the meter
const meteredPrice = await stripe.prices.create({
  product: TOOLS_PRODUCT_ID,
  currency: 'usd',
  billing_scheme: 'tiered',
  recurring: {
    interval: 'month',
    usage_type: 'metered',
    meter: meter.id,
  },
  tiers: [
    { up_to: 50000, unit_amount: 0 },           // First 50K included
    { up_to: 250000, unit_amount: 0.2 },         // $0.002/call
    { up_to: 1000000, unit_amount: 0.15 },       // $0.0015/call (volume discount)
    { up_to: 'inf', unit_amount: 0.10 },          // $0.001/call (high volume)
  ],
  tiers_mode: 'graduated',
});
```

### Reporting Usage Events

Every API call must be reported to Stripe for billing:

```typescript
// Report a usage event to Stripe Billing Meter
async function reportAPIUsage(event: {
  customerId: string;
  endpoint: string;
  tokens: number;
  timestamp: number;
}) {
  await stripe.billing.meterEvents.create({
    event_name: 'api_call',
    payload: {
      stripe_customer_id: event.customerId,
      value: '1', // 1 API call
    },
    timestamp: event.timestamp,
  });

  // Also track locally for real-time dashboard
  await prisma.apiUsage.create({
    data: {
      userId: event.customerId,
      endpoint: event.endpoint,
      tokens: event.tokens,
      timestamp: new Date(event.timestamp * 1000),
    },
  });
}
```

### Legacy Approach: Usage Records

For Stripe integrations not using the new Billing Meters:

```typescript
// Report usage via subscription item usage records
async function reportUsageLegacy(
  subscriptionItemId: string,
  quantity: number,
  timestamp: number
) {
  await stripe.subscriptionItems.createUsageRecord(subscriptionItemId, {
    quantity,
    timestamp,
    action: 'increment', // Add to running total
  });
}
```

---

## 3. Usage Tracking Infrastructure

### Real-Time Usage Tracking

API usage must be tracked in real-time for three purposes:
1. **Billing**: Accurate usage reporting to Stripe
2. **Rate limiting**: Enforce plan limits
3. **Dashboard**: Show developers their current usage

```typescript
// Usage tracking middleware for API routes
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

async function trackAndLimitUsage(
  userId: string,
  plan: ToolsPlanTier
): Promise<{ allowed: boolean; currentUsage: number; limit: number }> {
  const key = `usage:${userId}:${getCurrentMonth()}`;
  const currentUsage = await redis.incr(key);

  // Set expiry on first increment (auto-cleanup)
  if (currentUsage === 1) {
    await redis.expire(key, 60 * 60 * 24 * 35); // 35 days
  }

  const limit = getPlanLimit(plan);

  if (plan === 'FREE' && currentUsage > limit) {
    return { allowed: false, currentUsage, limit };
  }

  // Paid plans allow overage (billed via Stripe)
  return { allowed: true, currentUsage, limit };
}

function getPlanLimit(plan: ToolsPlanTier): number {
  switch (plan) {
    case 'FREE': return 1000;
    case 'STARTER': return 50000;
    case 'PRO': return 250000;
    case 'ENTERPRISE': return Infinity;
    default: return 0;
  }
}
```

### Usage Data Model

```typescript
// Prisma model for detailed usage tracking
model APIUsage {
  id          String   @id @default(cuid())
  userId      String
  endpoint    String   // /summarize, /analyze, /generate, etc.
  tokens      Int      // Input + output tokens consumed
  latencyMs   Int      // Response time in milliseconds
  statusCode  Int      // 200, 400, 429, 500, etc.
  timestamp   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])

  @@index([userId, timestamp])
  @@index([endpoint, timestamp])
}

// Aggregated daily usage (for dashboard and billing reconciliation)
model DailyUsageAggregate {
  id          String   @id @default(cuid())
  userId      String
  date        DateTime @db.Date
  totalCalls  Int
  totalTokens Int
  byEndpoint  Json     // { "/summarize": 150, "/analyze": 80 }
  estimatedCost Float

  user        User     @relation(fields: [userId], references: [id])

  @@unique([userId, date])
}
```

### Usage Aggregation Job

Run a daily aggregation job to compute usage summaries:

```typescript
// Daily cron job: aggregate usage and report to Stripe
async function dailyUsageAggregation() {
  const yesterday = startOfYesterday();
  const today = startOfToday();

  // Get all active Tools users
  const activeUsers = await prisma.user.findMany({
    where: {
      toolsStatus: 'ACTIVE',
    },
  });

  for (const user of activeUsers) {
    // Count yesterday's API calls
    const usageCount = await prisma.aPIUsage.count({
      where: {
        userId: user.id,
        timestamp: { gte: yesterday, lt: today },
      },
    });

    if (usageCount === 0) continue;

    // Aggregate by endpoint
    const byEndpoint = await prisma.aPIUsage.groupBy({
      by: ['endpoint'],
      where: {
        userId: user.id,
        timestamp: { gte: yesterday, lt: today },
      },
      _count: true,
    });

    // Store aggregate
    await prisma.dailyUsageAggregate.create({
      data: {
        userId: user.id,
        date: yesterday,
        totalCalls: usageCount,
        totalTokens: 0, // compute from detailed records
        byEndpoint: Object.fromEntries(
          byEndpoint.map(e => [e.endpoint, e._count])
        ),
        estimatedCost: calculateCost(usageCount, user.toolsPlan),
      },
    });

    // Report to Stripe (if using usage records instead of real-time meter events)
    if (user.toolsSubscriptionItemId) {
      await stripe.subscriptionItems.createUsageRecord(
        user.toolsSubscriptionItemId,
        {
          quantity: usageCount,
          timestamp: Math.floor(yesterday.getTime() / 1000),
          action: 'set',
        }
      );
    }
  }
}
```

---

## 4. Tier Thresholds and Automatic Upgrades

### Usage-Based Tier Progression

When a developer consistently exceeds their plan's included calls, nudge them to upgrade:

```typescript
// Check if user should be nudged to upgrade
async function checkUsageTierFit(userId: string): Promise<{
  shouldUpgrade: boolean;
  suggestedPlan: ToolsPlanTier;
  savings: number;
}> {
  const last3Months = await prisma.dailyUsageAggregate.aggregate({
    where: {
      userId,
      date: { gte: subMonths(new Date(), 3) },
    },
    _sum: { totalCalls: true },
  });

  const avgMonthlyUsage = (last3Months._sum.totalCalls || 0) / 3;
  const currentPlan = await getUserPlan(userId);

  // Calculate cost on current plan vs next tier
  const currentCost = calculateMonthlyCost(avgMonthlyUsage, currentPlan);
  const nextPlan = getNextTier(currentPlan);
  const nextCost = calculateMonthlyCost(avgMonthlyUsage, nextPlan);

  if (nextCost < currentCost) {
    return {
      shouldUpgrade: true,
      suggestedPlan: nextPlan,
      savings: currentCost - nextCost,
    };
  }

  return { shouldUpgrade: false, suggestedPlan: currentPlan, savings: 0 };
}
```

### Automatic Notifications

```typescript
// Usage threshold notifications
const usageAlerts = {
  '50%': {
    message: "You've used 50% of your included API calls this month.",
    channel: 'in-app',
  },
  '80%': {
    message: "You're approaching your included API call limit. Calls beyond your limit will be billed at overage rates.",
    channel: 'email + in-app',
  },
  '100%': {
    message: "You've exceeded your included API calls. Additional calls are billed at $X per call. Consider upgrading to save.",
    channel: 'email + in-app',
  },
  '150%': {
    message: "Your usage this month is significantly above your plan. Upgrading to {nextPlan} would save you ${savings}/month.",
    channel: 'email',
  },
};
```

---

## 5. Developer Usage Dashboard

### API Usage Dashboard Design

```
┌──────────────────────────────────────────────────┐
│  API USAGE — [Current Month]                      │
├──────────────────────────────────────────────────┤
│                                                   │
│  Plan: Starter ($29/mo)                          │
│  Included: 50,000 calls | Used: 32,450 (64.9%)  │
│  ████████████████████░░░░░░░░░░                  │
│                                                   │
│  Estimated bill: $29.00 (within included)         │
│  Billing period: Mar 9 — Apr 8, 2026             │
│                                                   │
│  ┌─────────────────────────────────────────┐     │
│  │ Daily Usage (30-day chart)               │     │
│  │ ▁▃▅▇█▆▄▃▅▇▅▃▁▃▅▇█▆▄▃▅▇▅▃▁▃▅▇▅        │     │
│  └─────────────────────────────────────────┘     │
│                                                   │
│  Usage by Endpoint:                               │
│  /summarize:  14,200 calls (43.7%)               │
│  /analyze:     8,100 calls (25.0%)               │
│  /generate:    6,300 calls (19.4%)               │
│  /review:      3,850 calls (11.9%)               │
│                                                   │
│  Average latency: 234ms                           │
│  Error rate: 0.3%                                 │
│  ─────────────────────────────────────────────── │
│  [Download Usage Report] [API Keys] [Upgrade Plan]│
│                                                   │
└──────────────────────────────────────────────────┘
```

---

## 6. Billing Edge Cases

### Usage-Based Edge Cases

**1. What happens when a free user hits the limit?**
- Hard block: API returns 429 Too Many Requests
- Response includes upgrade link and current usage
- Dashboard shows limit reached with upgrade CTA

**2. What about failed API calls? Do they count?**
- 2xx responses: Count as billable calls
- 4xx responses (client error): Count (developer's responsibility)
- 5xx responses (server error): Do NOT count (our responsibility)
- 429 responses (rate limited): Do NOT count

**3. What if Stripe usage reporting fails?**
- Buffer usage events locally (Redis + database)
- Retry failed Stripe reports with exponential backoff
- Daily reconciliation job catches any missed reports
- Never lose usage data — bill accurately

**4. Mid-cycle plan changes?**
- Upgrade: Immediate access to new plan limits, prorated billing
- Downgrade: Takes effect at end of billing cycle, keeps current limits until then
- Cancel: Access until end of billing cycle, final invoice includes any overage

**5. Disputed usage?**
- Maintain detailed API logs (request ID, timestamp, endpoint, response code)
- Provide usage export in CSV for developer verification
- Support team can audit specific time ranges
- If legitimate dispute, issue credit via Stripe

```typescript
// Issue usage credit
async function issueUsageCredit(
  customerId: string,
  amount: number,
  reason: string
) {
  await stripe.creditNotes.create({
    invoice: lastInvoiceId,
    lines: [{
      type: 'custom_line_item',
      description: `Usage credit: ${reason}`,
      unit_amount: -Math.round(amount * 100),
      quantity: 1,
    }],
  });

  // Log for audit
  await prisma.billingAudit.create({
    data: {
      customerId,
      type: 'USAGE_CREDIT',
      amount,
      reason,
      issuedBy: 'support',
    },
  });
}
```

---

## 7. Cost Management for the Business

### Cost Per API Call Calculation

To price usage profitably, know your cost per call:

```
Infrastructure cost per API call:
├── AI model inference (vLLM/Claude API): $0.0005 - $0.002 per call
├── Server compute (Vercel/edge): $0.00001 per call
├── Database query: $0.000001 per call
├── Bandwidth: $0.00001 per call
└── Total cost per call: ~$0.0006 - $0.0022

Pricing margin:
├── Overage rate: $0.002/call
├── Cost: ~$0.001/call (average)
├── Gross margin: ~50%
└── At volume discount ($0.001/call): ~0% margin (drive adoption)
```

### Usage Monitoring for Infrastructure

Track usage patterns to predict infrastructure needs:

```typescript
// Monitor usage trends for capacity planning
async function weeklyUsageReport() {
  const thisWeek = await prisma.dailyUsageAggregate.aggregate({
    where: { date: { gte: subDays(new Date(), 7) } },
    _sum: { totalCalls: true },
  });

  const lastWeek = await prisma.dailyUsageAggregate.aggregate({
    where: {
      date: {
        gte: subDays(new Date(), 14),
        lt: subDays(new Date(), 7),
      },
    },
    _sum: { totalCalls: true },
  });

  const growthRate = (thisWeek._sum.totalCalls - lastWeek._sum.totalCalls)
    / lastWeek._sum.totalCalls;

  if (growthRate > 0.2) {
    // 20%+ week-over-week growth — alert for capacity planning
    await sendFounderAlert({
      alertType: 'infrastructure',
      title: '[USAGE] API call growth exceeding 20% WoW',
      body: `This week: ${thisWeek._sum.totalCalls}, Last week: ${lastWeek._sum.totalCalls}, Growth: ${(growthRate * 100).toFixed(1)}%`,
    });
  }
}
```
