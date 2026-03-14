# Metering & Billing Integration for Stone AI Tools

## Seed Classification
- **Domain**: Backend Engineering / Billing
- **Platform**: Stone AI Tools (tools.stone-ai.net)
- **Complexity**: Advanced
- **Prerequisites**: Stripe API, event-driven architecture, Redis
- **Last Updated**: 2026-03-09

---

## 1. Metering Architecture Overview

### Usage-Based Billing Model

```
Stone AI Tools Billing Model:

Base subscription (monthly/annual) + Metered usage

┌─────────┬──────────┬───────────┬─────────────────────────┐
│ Plan    │ Base Fee │ Included  │ Overage Rate            │
├─────────┼──────────┼───────────┼─────────────────────────┤
│ FREE    │ $0       │ 1,000     │ Not allowed (blocked)   │
│ STARTER │ $19.99   │ 25,000    │ $0.002/call             │
│ PLUS    │ $49.99   │ 100,000   │ $0.001/call             │
│ PRO     │ $200.00  │ 500,000   │ $0.0005/call            │
│ ENTERPRISE│ Custom │ Custom    │ Custom (volume discount) │
└─────────┴──────────┴───────────┴─────────────────────────┘

Smart/Premium agents cost more:
- Standard agents: 1 credit per call
- SMART agents:    5 credits per call
- PRO agents:      10 credits per call
```

### Metering Pipeline

```
Usage Tracking Flow:

  API Request → Gateway → Usage Meter → Redis (real-time) → PostgreSQL (durable)
                                │                                    │
                                │                              ┌─────┴─────┐
                                │                              │ Aggregate  │
                                │                              │ Worker     │
                                │                              └─────┬─────┘
                                │                                    │
                                │                              ┌─────┴─────┐
                                │                              │ Stripe    │
                                └─────────────────────────────►│ Metered   │
                                  Usage alerts                 │ Billing   │
                                                               └───────────┘
```

---

## 2. Real-Time Usage Tracking

### 2.1 Gateway Usage Meter

```typescript
// File: src/gateway/metering/usage-meter.ts

interface UsageEvent {
  tenantId: string;
  apiKeyId: string;
  agentId: string;
  agentTier: string;     // 'free' | 'starter' | 'plus' | 'smart' | 'pro'
  endpoint: string;
  method: string;
  statusCode: number;
  responseTimeMs: number;
  tokenCount: number;
  computeTimeMs: number;
  timestamp: number;
  requestId: string;
  region: string;
}

class UsageMeter {
  private redis: Redis;
  private buffer: UsageEvent[] = [];
  private flushInterval: NodeJS.Timeout;

  constructor(redis: Redis) {
    this.redis = redis;
    // Flush buffer every 5 seconds
    this.flushInterval = setInterval(() => this.flush(), 5_000);
  }

  /**
   * Record a usage event. Called after every successful API response.
   * This MUST be non-blocking — metering failures should never affect API responses.
   */
  async record(event: UsageEvent): Promise<void> {
    this.buffer.push(event);

    // Also update real-time counters in Redis (for rate limiting and dashboards)
    const period = this.getBillingPeriod(event.timestamp);
    const credits = this.calculateCredits(event);

    const pipeline = this.redis.pipeline();

    // Increment monthly usage counter
    pipeline.incrby(`usage:${event.tenantId}:${period}:calls`, 1);
    pipeline.incrby(`usage:${event.tenantId}:${period}:credits`, credits);
    pipeline.incrby(`usage:${event.tenantId}:${period}:tokens`, event.tokenCount);

    // Per-agent counter
    pipeline.incrby(`usage:${event.tenantId}:${period}:agent:${event.agentId}`, 1);

    // Daily counter (for time-series dashboard)
    const day = new Date(event.timestamp).toISOString().split('T')[0];
    pipeline.incrby(`usage:${event.tenantId}:daily:${day}:calls`, 1);

    // Set TTL on all keys (auto-cleanup after 90 days)
    const ttl = 90 * 24 * 60 * 60;
    pipeline.expire(`usage:${event.tenantId}:${period}:calls`, ttl);
    pipeline.expire(`usage:${event.tenantId}:${period}:credits`, ttl);
    pipeline.expire(`usage:${event.tenantId}:${period}:tokens`, ttl);

    await pipeline.exec().catch((err) => {
      logger.error('Redis usage update failed', { error: err.message, tenantId: event.tenantId });
    });

    // Check if tenant has exceeded their included quota
    await this.checkUsageThresholds(event.tenantId, period);
  }

  private calculateCredits(event: UsageEvent): number {
    // Only successful requests cost credits
    if (event.statusCode >= 400) return 0;

    switch (event.agentTier) {
      case 'free':
      case 'starter': return 1;
      case 'plus':    return 2;
      case 'smart':   return 5;
      case 'pro':     return 10;
      default:        return 1;
    }
  }

  private getBillingPeriod(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Flush buffered events to PostgreSQL for durable storage.
   */
  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const batch = this.buffer.splice(0, this.buffer.length);

    try {
      await db.raw.usageRecord.createMany({
        data: batch.map(event => ({
          tenantId: event.tenantId,
          apiKeyId: event.apiKeyId,
          agentId: event.agentId,
          endpoint: event.endpoint,
          method: event.method,
          statusCode: event.statusCode,
          responseTimeMs: event.responseTimeMs,
          tokenCount: event.tokenCount,
          computeTimeMs: event.computeTimeMs,
          requestCount: 1,
          costMicros: this.calculateCostMicros(event),
          billingPeriod: this.getBillingPeriod(event.timestamp),
          region: event.region,
        })),
      });

      metrics.counter('metering.events_flushed', {}, batch.length);
    } catch (error) {
      logger.error('Usage flush to Postgres failed', {
        count: batch.length,
        error: error instanceof Error ? error.message : 'Unknown',
      });
      // Re-add to buffer for retry (with limit to prevent memory leak)
      if (this.buffer.length < 10_000) {
        this.buffer.unshift(...batch);
      } else {
        logger.error('Usage buffer overflow, dropping events', { dropped: batch.length });
        metrics.counter('metering.events_dropped', {}, batch.length);
      }
    }
  }

  private calculateCostMicros(event: UsageEvent): number {
    if (event.statusCode >= 400) return 0;

    // Cost in microdollars (1/1,000,000 of a dollar)
    // Base cost per agent tier
    const baseCost: Record<string, number> = {
      free: 100,       // $0.0001
      starter: 500,    // $0.0005
      plus: 1_000,     // $0.001
      smart: 5_000,    // $0.005
      pro: 10_000,     // $0.01
    };

    return baseCost[event.agentTier] ?? 500;
  }
}
```

### 2.2 Usage Threshold Alerts

```typescript
// File: src/gateway/metering/threshold-checker.ts

interface UsageThreshold {
  percentage: number;
  alertType: string;
  action?: 'warn' | 'throttle' | 'block';
}

const USAGE_THRESHOLDS: UsageThreshold[] = [
  { percentage: 50, alertType: 'usage_50_percent' },
  { percentage: 75, alertType: 'usage_75_percent' },
  { percentage: 90, alertType: 'usage_90_percent', action: 'warn' },
  { percentage: 100, alertType: 'usage_100_percent', action: 'throttle' },
  { percentage: 120, alertType: 'usage_120_percent', action: 'block' },
];

class UsageThresholdChecker {
  async checkUsageThresholds(tenantId: string, period: string): Promise<void> {
    // Get current usage
    const currentUsage = parseInt(
      await redis.get(`usage:${tenantId}:${period}:calls`) ?? '0',
      10
    );

    // Get tenant limit
    const tenant = await this.getCachedTenantLimits(tenantId);
    if (!tenant || tenant.monthlyApiLimit === -1) return; // Unlimited

    const percentUsed = (currentUsage / tenant.monthlyApiLimit) * 100;

    for (const threshold of USAGE_THRESHOLDS) {
      const alertKey = `alert:${tenantId}:${period}:${threshold.alertType}`;
      const alreadySent = await redis.get(alertKey);

      if (percentUsed >= threshold.percentage && !alreadySent) {
        // Send alert
        await this.sendUsageAlert(tenantId, {
          type: threshold.alertType,
          currentUsage,
          limit: tenant.monthlyApiLimit,
          percentUsed: Math.round(percentUsed),
          action: threshold.action,
        });

        // Mark alert as sent (prevent duplicates)
        await redis.set(alertKey, '1', 'EX', 30 * 24 * 60 * 60);

        // Take action if needed
        if (threshold.action === 'block' && tenant.plan === 'FREE') {
          // Block FREE tier at 120% (they get a small buffer)
          await redis.set(`blocked:${tenantId}:${period}`, '1', 'EX', 30 * 24 * 60 * 60);
        }
      }
    }
  }

  private async sendUsageAlert(tenantId: string, alert: UsageAlert): Promise<void> {
    const tenant = await db.raw.tenant.findUnique({
      where: { id: tenantId },
      select: { billingEmail: true, name: true, plan: true },
    });

    if (!tenant) return;

    // Send email
    await sendEmail(tenant.billingEmail, 'usage-threshold-alert', {
      tenantName: tenant.name,
      currentUsage: alert.currentUsage.toLocaleString(),
      limit: alert.limit.toLocaleString(),
      percentUsed: alert.percentUsed,
      plan: tenant.plan,
      upgradeUrl: 'https://tools.stone-ai.net/dashboard/billing',
    });

    // Send webhook if configured
    await webhookService.emit(tenantId, 'usage.threshold_reached', {
      threshold: alert.type,
      currentUsage: alert.currentUsage,
      limit: alert.limit,
      percentUsed: alert.percentUsed,
    });
  }
}
```

---

## 3. Stripe Metered Billing Integration

### 3.1 Stripe Product/Price Setup

```typescript
// File: src/services/stripe-setup.ts

/**
 * Stripe product structure for Stone AI Tools:
 *
 * Product: "Stone AI Tools API"
 *   Price: STARTER ($19.99/month)
 *     - Base fee: $19.99/month
 *     - Metered: Usage above 25,000 calls at $0.002/call
 *   Price: PLUS ($49.99/month)
 *     - Base fee: $49.99/month
 *     - Metered: Usage above 100,000 calls at $0.001/call
 *   Price: PRO ($200/month)
 *     - Base fee: $200/month
 *     - Metered: Usage above 500,000 calls at $0.0005/call
 */

async function setupStripeProducts(): Promise<void> {
  // Create the product
  const product = await stripe.products.create({
    name: 'Stone AI Tools API',
    description: 'Access Stone AI agents via API',
    metadata: { platform: 'stone-ai-tools' },
  });

  // Recurring prices (base subscription)
  const plans = [
    { name: 'STARTER', amount: 1999, included: 25_000, overageRate: 200 },
    { name: 'PLUS', amount: 4999, included: 100_000, overageRate: 100 },
    { name: 'PRO', amount: 20000, included: 500_000, overageRate: 50 },
  ];

  for (const plan of plans) {
    // Base subscription price
    const basePrice = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.amount,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: {
        plan: plan.name,
        type: 'base',
        included_calls: plan.included.toString(),
      },
    });

    // Metered overage price
    const meteredPrice = await stripe.prices.create({
      product: product.id,
      currency: 'usd',
      recurring: {
        interval: 'month',
        usage_type: 'metered',
      },
      billing_scheme: 'tiered',
      tiers_mode: 'graduated',
      tiers: [
        {
          up_to: plan.included,
          unit_amount: 0,             // Included in base
          flat_amount: 0,
        },
        {
          up_to: 'inf',
          unit_amount: plan.overageRate, // Overage rate in cents
        },
      ],
      metadata: {
        plan: plan.name,
        type: 'metered',
      },
    });

    console.log(`${plan.name}: base=${basePrice.id}, metered=${meteredPrice.id}`);
  }
}
```

### 3.2 Subscription Creation

```typescript
// File: src/services/subscription-service.ts

class SubscriptionService {
  async createSubscription(
    tenantId: string,
    plan: TenantPlan
  ): Promise<Stripe.Subscription> {
    const tenant = await db.raw.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { stripeCustomerId: true },
    });

    if (!tenant.stripeCustomerId) {
      throw new Error('Tenant does not have a Stripe customer');
    }

    const prices = STRIPE_PRICE_IDS[plan];
    if (!prices) {
      throw new Error(`No Stripe prices configured for plan: ${plan}`);
    }

    const subscription = await stripe.subscriptions.create({
      customer: tenant.stripeCustomerId,
      items: [
        { price: prices.base },       // Base subscription fee
        { price: prices.metered },     // Metered usage component
      ],
      metadata: {
        tenantId,
        plan,
        platform: 'stone-ai-tools',
      },
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
    });

    // Store subscription ID
    await db.raw.tenant.update({
      where: { id: tenantId },
      data: {
        stripeSubscriptionId: subscription.id,
        plan,
        monthlyApiLimit: PLAN_LIMITS[plan].monthlyApiLimit,
        rateLimit: PLAN_LIMITS[plan].ratePerMinute,
      },
    });

    return subscription;
  }
}
```

### 3.3 Usage Reporting to Stripe

```typescript
// File: src/services/stripe-usage-reporter.ts

/**
 * Reports aggregated usage to Stripe for metered billing.
 *
 * Runs as a scheduled job every hour.
 * At billing period end, Stripe calculates the total and charges.
 */

class StripeUsageReporter {
  /**
   * Report usage for all active metered subscriptions.
   * Called by cron job every hour.
   */
  async reportUsage(): Promise<void> {
    const period = getCurrentBillingPeriod();

    // Get all active subscriptions with metered components
    const tenants = await db.raw.tenant.findMany({
      where: {
        status: 'ACTIVE',
        stripeSubscriptionId: { not: null },
        plan: { not: 'FREE' },
      },
      select: {
        id: true,
        stripeSubscriptionId: true,
        plan: true,
      },
    });

    for (const tenant of tenants) {
      try {
        await this.reportTenantUsage(tenant, period);
      } catch (error) {
        logger.error('Failed to report usage to Stripe', {
          tenantId: tenant.id,
          error: error instanceof Error ? error.message : 'Unknown',
        });
      }
    }
  }

  private async reportTenantUsage(
    tenant: { id: string; stripeSubscriptionId: string; plan: string },
    period: string
  ): Promise<void> {
    // Get current usage from Redis (real-time counter)
    const currentCalls = parseInt(
      await redis.get(`usage:${tenant.id}:${period}:calls`) ?? '0',
      10
    );

    // Get last reported usage
    const lastReported = parseInt(
      await redis.get(`stripe:reported:${tenant.id}:${period}`) ?? '0',
      10
    );

    const newUsage = currentCalls - lastReported;
    if (newUsage <= 0) return; // No new usage to report

    // Find the metered subscription item
    const subscription = await stripe.subscriptions.retrieve(
      tenant.stripeSubscriptionId!
    );

    const meteredItem = subscription.items.data.find(
      item => item.price.recurring?.usage_type === 'metered'
    );

    if (!meteredItem) {
      logger.error('No metered item found on subscription', {
        tenantId: tenant.id,
        subscriptionId: tenant.stripeSubscriptionId,
      });
      return;
    }

    // Report usage to Stripe
    await stripe.subscriptionItems.createUsageRecord(
      meteredItem.id,
      {
        quantity: newUsage,
        timestamp: Math.floor(Date.now() / 1000),
        action: 'increment',
      }
    );

    // Update last reported
    await redis.set(`stripe:reported:${tenant.id}:${period}`, currentCalls.toString());

    logger.info('Usage reported to Stripe', {
      tenantId: tenant.id,
      newUsage,
      totalUsage: currentCalls,
      period,
    });
  }

  /**
   * End-of-period reconciliation.
   * Ensures Stripe has accurate final usage for billing.
   * Run at the end of each billing period.
   */
  async reconcile(period: string): Promise<void> {
    const tenants = await db.raw.tenant.findMany({
      where: {
        status: 'ACTIVE',
        stripeSubscriptionId: { not: null },
        plan: { not: 'FREE' },
      },
    });

    for (const tenant of tenants) {
      // Get authoritative usage from PostgreSQL
      const dbUsage = await db.raw.usageRecord.aggregate({
        where: {
          tenantId: tenant.id,
          billingPeriod: period,
          statusCode: { lt: 400 }, // Only successful requests
        },
        _sum: { requestCount: true },
      });

      const totalCalls = dbUsage._sum.requestCount ?? 0;

      // Get what we've reported to Stripe
      const reportedToStripe = parseInt(
        await redis.get(`stripe:reported:${tenant.id}:${period}`) ?? '0',
        10
      );

      const difference = totalCalls - reportedToStripe;

      if (difference > 0) {
        logger.warn('Usage reconciliation adjustment needed', {
          tenantId: tenant.id,
          period,
          dbTotal: totalCalls,
          stripeReported: reportedToStripe,
          adjustment: difference,
        });

        // Report the difference
        await this.reportTenantUsage(
          { ...tenant, stripeSubscriptionId: tenant.stripeSubscriptionId! },
          period
        );
      } else if (difference < 0) {
        // We over-reported — this is unusual
        logger.error('Usage over-reported to Stripe', {
          tenantId: tenant.id,
          period,
          dbTotal: totalCalls,
          stripeReported: reportedToStripe,
          overReported: Math.abs(difference),
        });
      }
    }
  }
}
```

---

## 4. Overage Handling

### 4.1 Overage Policy

```typescript
// File: src/services/overage-handler.ts

class OverageHandler {
  /**
   * Check if a request should be allowed based on usage limits.
   * Called in the gateway pipeline before forwarding to upstream.
   */
  async checkQuota(tenantId: string, plan: string): Promise<QuotaCheckResult> {
    const period = getCurrentBillingPeriod();
    const currentCalls = parseInt(
      await redis.get(`usage:${tenantId}:${period}:calls`) ?? '0',
      10
    );

    const limit = PLAN_LIMITS[plan as TenantPlan]?.monthlyApiLimit ?? 1000;

    // FREE tier: hard block at limit
    if (plan === 'FREE' && currentCalls >= limit) {
      return {
        allowed: false,
        reason: 'quota_exceeded',
        currentUsage: currentCalls,
        limit,
        message: `Free tier limit of ${limit.toLocaleString()} API calls reached. Upgrade to continue.`,
        upgradeUrl: 'https://tools.stone-ai.net/pricing',
      };
    }

    // Paid tiers: allow overage (billed at overage rate)
    if (plan !== 'FREE' && currentCalls >= limit) {
      // Check if overage is enabled for this tenant
      const overageBlocked = await redis.get(`blocked:${tenantId}:${period}`);
      if (overageBlocked) {
        return {
          allowed: false,
          reason: 'overage_blocked',
          currentUsage: currentCalls,
          limit,
          message: 'Usage limit exceeded and overage is disabled. Contact support.',
        };
      }

      // Check hard cap (prevent runaway billing)
      const hardCap = limit * 3; // 300% hard cap
      if (currentCalls >= hardCap) {
        return {
          allowed: false,
          reason: 'hard_cap_reached',
          currentUsage: currentCalls,
          limit,
          message: `Hard usage cap (${hardCap.toLocaleString()} calls) reached. Contact support to increase.`,
        };
      }

      // Overage allowed
      return {
        allowed: true,
        isOverage: true,
        currentUsage: currentCalls,
        limit,
        overageCount: currentCalls - limit,
      };
    }

    // Under limit
    return {
      allowed: true,
      isOverage: false,
      currentUsage: currentCalls,
      limit,
      remaining: limit - currentCalls,
    };
  }
}
```

### 4.2 Spending Limits

```typescript
// File: src/services/spending-limits.ts

class SpendingLimitService {
  /**
   * Tenants can set monthly spending limits to prevent surprise bills.
   */
  async setSpendingLimit(tenantId: string, limitDollars: number): Promise<void> {
    await db.raw.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          spendingLimit: limitDollars * 1_000_000, // Store in microdollars
          spendingLimitEnabled: true,
        },
      },
    });

    await auditLogger.log({
      tenantId,
      action: 'settings.spending_limit_set',
      resource: 'tenant',
      resourceId: tenantId,
      details: { limitDollars },
    });
  }

  async checkSpendingLimit(tenantId: string): Promise<boolean> {
    const tenant = await this.getCachedTenantSettings(tenantId);

    if (!tenant.settings?.spendingLimitEnabled) return true; // No limit set

    const period = getCurrentBillingPeriod();
    const currentSpend = parseInt(
      await redis.get(`usage:${tenantId}:${period}:cost_micros`) ?? '0',
      10
    );

    return currentSpend < tenant.settings.spendingLimit;
  }
}
```

---

## 5. Billing Reconciliation

### 5.1 Monthly Reconciliation Job

```typescript
// File: src/jobs/billing-reconciliation.ts

/**
 * Monthly billing reconciliation.
 * Runs at the end of each billing period.
 *
 * Ensures:
 * 1. PostgreSQL usage matches Redis counters
 * 2. Stripe has accurate final usage
 * 3. Billing amounts are correct
 * 4. No missed or duplicate charges
 */

class BillingReconciliation {
  async reconcilePeriod(period: string): Promise<ReconciliationReport> {
    const report: ReconciliationReport = {
      period,
      tenantsChecked: 0,
      discrepancies: [],
      adjustments: [],
      totalUsageRecords: 0,
    };

    const tenants = await db.raw.tenant.findMany({
      where: {
        status: { in: ['ACTIVE', 'SUSPENDED'] },
        plan: { not: 'FREE' },
        stripeSubscriptionId: { not: null },
      },
    });

    for (const tenant of tenants) {
      report.tenantsChecked++;

      // Source 1: PostgreSQL (authoritative)
      const dbUsage = await db.raw.usageRecord.aggregate({
        where: {
          tenantId: tenant.id,
          billingPeriod: period,
          statusCode: { lt: 400 },
        },
        _sum: {
          requestCount: true,
          tokenCount: true,
          costMicros: true,
        },
      });

      // Source 2: Redis (real-time)
      const redisUsage = parseInt(
        await redis.get(`usage:${tenant.id}:${period}:calls`) ?? '0',
        10
      );

      // Source 3: Stripe (what we billed)
      const stripeUsage = await this.getStripeReportedUsage(
        tenant.stripeSubscriptionId!,
        period
      );

      const dbCalls = dbUsage._sum.requestCount ?? 0;

      // Check for discrepancies
      const redisDiscrepancy = Math.abs(dbCalls - redisUsage);
      if (redisDiscrepancy > dbCalls * 0.01) { // >1% difference
        report.discrepancies.push({
          tenantId: tenant.id,
          type: 'redis_vs_db',
          dbValue: dbCalls,
          redisValue: redisUsage,
          difference: redisDiscrepancy,
        });
      }

      const stripeDiscrepancy = Math.abs(dbCalls - stripeUsage);
      if (stripeDiscrepancy > dbCalls * 0.01) {
        report.discrepancies.push({
          tenantId: tenant.id,
          type: 'stripe_vs_db',
          dbValue: dbCalls,
          stripeValue: stripeUsage,
          difference: stripeDiscrepancy,
        });

        // Correct Stripe if we under-reported
        if (dbCalls > stripeUsage) {
          const adjustment = dbCalls - stripeUsage;
          logger.warn('Stripe under-reported, sending adjustment', {
            tenantId: tenant.id,
            adjustment,
          });

          // Report the difference to Stripe
          await this.reportAdjustment(tenant.stripeSubscriptionId!, adjustment);

          report.adjustments.push({
            tenantId: tenant.id,
            adjustment,
            direction: 'stripe_increment',
          });
        }
      }

      report.totalUsageRecords += dbCalls;
    }

    // Store report
    await db.raw.billingReconciliation.create({
      data: {
        period,
        report: report as any,
        createdAt: new Date(),
      },
    });

    // Alert if there are significant discrepancies
    if (report.discrepancies.length > 0) {
      await sendFounderAlert({
        alertType: 'billing.reconciliation',
        title: `[BILLING] Reconciliation for ${period}`,
        body: `Found ${report.discrepancies.length} discrepancies across ${report.tenantsChecked} tenants.`,
        details: report,
      });
    }

    return report;
  }

  private async getStripeReportedUsage(
    subscriptionId: string,
    period: string
  ): Promise<number> {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    const meteredItem = subscription.items.data.find(
      item => item.price.recurring?.usage_type === 'metered'
    );

    if (!meteredItem) return 0;

    // Get usage summary from Stripe
    const summary = await stripe.subscriptionItems.listUsageRecordSummaries(
      meteredItem.id,
      { limit: 1 }
    );

    return summary.data[0]?.total_usage ?? 0;
  }
}
```

---

## 6. Usage Dashboard Data

### 6.1 Usage API Endpoints

```typescript
// File: src/app/api/dashboard/usage/route.ts

export async function GET(req: Request) {
  const tenantId = await requireAuth(req);
  const { searchParams } = new URL(req.url);

  const period = searchParams.get('period') ?? getCurrentBillingPeriod();
  const granularity = searchParams.get('granularity') ?? 'daily';

  // Real-time counters from Redis
  const [totalCalls, totalTokens, totalCredits] = await Promise.all([
    redis.get(`usage:${tenantId}:${period}:calls`),
    redis.get(`usage:${tenantId}:${period}:tokens`),
    redis.get(`usage:${tenantId}:${period}:credits`),
  ]);

  // Time series from PostgreSQL
  const timeSeries = await db.withTenant(tenantId, (tx) =>
    tx.$queryRaw`
      SELECT
        DATE_TRUNC(${granularity}, created_at) as bucket,
        SUM(request_count) as calls,
        SUM(token_count) as tokens,
        SUM(cost_micros) as cost_micros,
        COUNT(DISTINCT agent_id) as unique_agents
      FROM usage_records
      WHERE tenant_id = ${tenantId}
        AND billing_period = ${period}
      GROUP BY bucket
      ORDER BY bucket
    `
  );

  // Top agents
  const topAgents = await db.withTenant(tenantId, (tx) =>
    tx.usageRecord.groupBy({
      by: ['agentId'],
      where: { tenantId, billingPeriod: period },
      _sum: { requestCount: true, tokenCount: true, costMicros: true },
      _avg: { responseTimeMs: true },
      orderBy: { _sum: { requestCount: 'desc' } },
      take: 10,
    })
  );

  // Tenant limits
  const tenant = await db.raw.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: { plan: true, monthlyApiLimit: true },
  });

  return Response.json({
    period,
    plan: tenant.plan,
    limits: {
      monthlyApiCalls: tenant.monthlyApiLimit,
    },
    current: {
      totalCalls: parseInt(totalCalls ?? '0', 10),
      totalTokens: parseInt(totalTokens ?? '0', 10),
      totalCredits: parseInt(totalCredits ?? '0', 10),
      estimatedCost: (parseInt(totalCredits ?? '0', 10) * 0.001),
      percentUsed: Math.round(
        (parseInt(totalCalls ?? '0', 10) / tenant.monthlyApiLimit) * 100
      ),
    },
    timeSeries,
    topAgents,
  });
}
```

---

## 7. Webhook Events for Billing

```typescript
// Billing-related webhook events sent to tenants

const BILLING_WEBHOOK_EVENTS = {
  'usage.threshold_reached': {
    description: 'Sent when usage hits 50%, 75%, 90%, 100%, or 120% of plan limit',
    payload: {
      threshold: 'usage_90_percent',
      currentUsage: 90000,
      limit: 100000,
      percentUsed: 90,
    },
  },
  'billing.invoice_created': {
    description: 'Sent when a new invoice is generated',
    payload: {
      invoiceId: 'inv_xxx',
      amount: 4999,
      currency: 'usd',
      period: '2026-03',
    },
  },
  'billing.payment_succeeded': {
    description: 'Sent when payment is successfully processed',
    payload: {
      invoiceId: 'inv_xxx',
      amount: 4999,
      paidAt: '2026-04-01T00:00:00Z',
    },
  },
  'billing.payment_failed': {
    description: 'Sent when payment fails',
    payload: {
      invoiceId: 'inv_xxx',
      amount: 4999,
      failureReason: 'card_declined',
      nextRetryAt: '2026-04-04T00:00:00Z',
    },
  },
};
```

---

## 8. Stripe Webhook Handler

```typescript
// File: src/app/api/webhooks/stripe/route.ts

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_TOOLS_WEBHOOK_SECRET!
    );
  } catch (error) {
    return new Response('Invalid signature', { status: 400 });
  }

  switch (event.type) {
    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      const tenantId = invoice.metadata?.tenantId;
      if (tenantId) {
        await handleInvoicePaid(tenantId, invoice);
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const tenantId = invoice.metadata?.tenantId;
      if (tenantId) {
        await handlePaymentFailed(tenantId, invoice);
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const tenantId = subscription.metadata?.tenantId;
      if (tenantId) {
        await handleSubscriptionUpdated(tenantId, subscription);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const tenantId = subscription.metadata?.tenantId;
      if (tenantId) {
        await handleSubscriptionCanceled(tenantId, subscription);
      }
      break;
    }
  }

  return new Response('OK');
}

async function handlePaymentFailed(tenantId: string, invoice: Stripe.Invoice): Promise<void> {
  const attempt = invoice.attempt_count;

  // First failure: notify
  if (attempt === 1) {
    const tenant = await db.raw.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { billingEmail: true },
    });

    await sendEmail(tenant.billingEmail, 'payment-failed', {
      amount: (invoice.amount_due / 100).toFixed(2),
      updatePaymentUrl: 'https://tools.stone-ai.net/dashboard/billing',
    });
  }

  // Third failure: suspend
  if (attempt >= 3) {
    await tenantLifecycle.suspendTenant(tenantId, 'payment_failed');
  }
}
```

---

## Summary

Stone AI Tools metering and billing system:

1. **Real-Time Metering**: Redis counters updated on every API call (non-blocking), flushed to PostgreSQL every 5 seconds
2. **Stripe Integration**: Metered billing with base subscription + usage-based overage, hourly usage reporting
3. **Threshold Alerts**: Progressive notifications at 50%, 75%, 90%, 100%, 120% of plan limits
4. **Overage Handling**: FREE tier hard-blocked, paid tiers allow overage up to 3x with billing
5. **Spending Limits**: Tenant-configurable caps to prevent surprise bills
6. **Reconciliation**: End-of-period cross-referencing between Redis, PostgreSQL, and Stripe
7. **Webhook Events**: Tenants receive billing events (threshold, invoice, payment) via webhooks
8. **Hard Caps**: Safety nets prevent runaway billing regardless of plan
