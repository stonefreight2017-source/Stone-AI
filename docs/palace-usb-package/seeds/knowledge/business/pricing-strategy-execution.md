# Pricing Strategy & Execution — Stone AI Palace Knowledge Seed

## Seed Classification
- **Domain**: Revenue Operations / Pricing Strategy
- **Complexity**: Advanced
- **Stack**: Next.js 16, TypeScript, Stripe Billing, Prisma 7.4
- **Applies To**: Stone AI (primary), Best AI, Stone AI Tools

---

## 1. Stone AI Pricing Architecture

### The Tier Structure

Stone AI's pricing is designed around a core principle: **every tier must feel like a steal compared to the value delivered.** The gap between tiers is calibrated to create natural upgrade pressure — users should hit the ceiling of their current tier and immediately see value in the next one.

| Tier | Monthly | Annual (per month) | Annual Total | Agents | Key Features |
|------|---------|-------------------|-------------|--------|-------------|
| FREE | $0 | — | — | 4 | Basic chat, limited agents |
| STARTER | $19.99 | — | — | 16 | 1 Bestie, standard agents |
| PLUS | $49.99 | — | — | 30 | Premium backdrops, more agents |
| SMART | $99.99 | $79.99 | $959.88 | 39 | Claude Sonnet (cloud AI), SMART agents |
| PRO | $200.00 | $170.00 | $2,040.00 | 42 | All agents, priority support |

### Pricing Psychology at Each Tier

**FREE to STARTER ($0 → $19.99)**: The first dollar is the hardest to get. The gap from free to paid must be bridged by an irresistible value proposition. 4 agents → 16 agents (4x increase) plus Bestie companion. The $19.99 price is below the "impulse buy" threshold for most software users.

**STARTER to PLUS ($19.99 → $49.99)**: 2.5x the price, but nearly 2x the agents (16 → 30). The premium backdrops and additional agents create a "power user" feel. Users who hit the STARTER agent ceiling naturally gravitate here.

**PLUS to SMART ($49.99 → $99.99)**: This is where the AI quality jump happens. Claude Sonnet (cloud AI) is only available at SMART and above. This creates a clear quality differentiation — SMART agents are demonstrably better. The annual discount ($79.99/mo) makes this tier the "sweet spot" for committed users.

**SMART to PRO ($99.99 → $200.00)**: The premium tier for power users. All 42 public agents, priority support. The 2x price jump is justified by completeness — PRO users never see a locked agent. Annual discount (15%, $170/mo) rewards commitment.

### Annual Discount Strategy

Annual discounts serve two purposes:
1. **Revenue front-loading** — Collecting a year upfront improves cash flow and reduces churn risk.
2. **Commitment anchoring** — Annual subscribers churn at 1/3 the rate of monthly subscribers.

Only SMART and PRO offer annual pricing because:
- STARTER and PLUS are entry-level tiers where monthly flexibility encourages upgrades.
- SMART and PRO users have demonstrated commitment — annual locks them in.
- The annual discount on SMART ($79.99 vs $99.99 = 20% off) is aggressive because SMART is the target "forever" tier for most users.
- PRO's annual discount (15%, $170/mo) is less aggressive because PRO users are already highly committed.

---

## 2. Promotional Pricing Implementation

### Promo Types in Stone AI

| Promo | Price | Applicable Tiers | Duration | Purpose |
|-------|-------|------------------|----------|---------|
| FIRST MONTH | $9.99 | All paid | 1 month | New user acquisition |
| TRIAL | $14.99 | All paid | 1 month | Low-commitment trial |
| GROWTH | $39.99 | PLUS+ | 1 month | Mid-tier adoption |

### Implementing Promotions with Stripe Coupons

```typescript
// scripts/create-promotions.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

async function createAllPromotions() {
  // FIRST MONTH: $9.99 for any plan
  // Implemented as per-plan coupons since discount amounts differ
  const firstMonthCoupons = [
    { plan: 'STARTER', amountOff: 1000, name: 'First Month - Starter' },  // $19.99 - $10.00 = $9.99
    { plan: 'PLUS', amountOff: 4000, name: 'First Month - Plus' },        // $49.99 - $40.00 = $9.99
    { plan: 'SMART', amountOff: 9000, name: 'First Month - Smart' },      // $99.99 - $90.00 = $9.99
    { plan: 'PRO', amountOff: 19001, name: 'First Month - Pro' },         // $200.00 - $190.01 = $9.99
  ];

  for (const config of firstMonthCoupons) {
    const coupon = await stripe.coupons.create({
      amount_off: config.amountOff,
      currency: 'usd',
      duration: 'once',
      name: config.name,
      metadata: {
        promoType: 'FIRST_MONTH',
        plan: config.plan,
        targetPrice: '999',
      },
    });

    // Create a promotion code users can enter
    await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: `FIRST${config.plan}`,
      max_redemptions: 10000,
      restrictions: {
        first_time_transaction: true,
      },
      metadata: {
        promoType: 'FIRST_MONTH',
        plan: config.plan,
      },
    });
  }

  // Universal first month promo code (auto-selects correct coupon)
  // This requires server-side logic to pick the right coupon based on the selected plan

  // TRIAL: $14.99 for any plan
  const trialCoupons = [
    { plan: 'STARTER', amountOff: 500, name: 'Trial - Starter' },
    { plan: 'PLUS', amountOff: 3500, name: 'Trial - Plus' },
    { plan: 'SMART', amountOff: 8500, name: 'Trial - Smart' },
    { plan: 'PRO', amountOff: 18501, name: 'Trial - Pro' },
  ];

  for (const config of trialCoupons) {
    const coupon = await stripe.coupons.create({
      amount_off: config.amountOff,
      currency: 'usd',
      duration: 'once',
      name: config.name,
      metadata: {
        promoType: 'TRIAL',
        plan: config.plan,
        targetPrice: '1499',
      },
    });

    await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: `TRY${config.plan}`,
      max_redemptions: 10000,
      restrictions: {
        first_time_transaction: true,
      },
    });
  }

  // GROWTH: $39.99 for PLUS and above
  const growthCoupons = [
    { plan: 'PLUS', amountOff: 1000, name: 'Growth - Plus' },     // $49.99 - $10.00 = $39.99
    { plan: 'SMART', amountOff: 6000, name: 'Growth - Smart' },   // $99.99 - $60.00 = $39.99
    { plan: 'PRO', amountOff: 16001, name: 'Growth - Pro' },      // $200.00 - $160.01 = $39.99
  ];

  for (const config of growthCoupons) {
    const coupon = await stripe.coupons.create({
      amount_off: config.amountOff,
      currency: 'usd',
      duration: 'once',
      name: config.name,
      metadata: {
        promoType: 'GROWTH',
        plan: config.plan,
        targetPrice: '3999',
      },
    });

    await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: `GROW${config.plan}`,
      max_redemptions: 5000,
      restrictions: {
        first_time_transaction: true,
      },
    });
  }

  console.log('All promotions created successfully');
}
```

### Server-Side Promo Code Resolution

```typescript
// src/lib/billing/promotions.ts
export async function resolvePromoCode(
  code: string,
  plan: PlanTier
): Promise<{
  valid: boolean;
  couponId?: string;
  discountAmount?: number;
  finalPrice?: number;
  error?: string;
}> {
  // Universal promo codes map to plan-specific coupons
  const universalCodes: Record<string, string> = {
    'FIRSTMONTH': 'FIRST_MONTH',
    'TRYME': 'TRIAL',
    'GROWTH': 'GROWTH',
    'WELCOME': 'FIRST_MONTH',
    'SAVE': 'FIRST_MONTH',
  };

  const promoType = universalCodes[code.toUpperCase()];

  if (promoType) {
    // Find the plan-specific coupon
    const coupons = await stripe.coupons.list({ limit: 100 });
    const matchingCoupon = coupons.data.find(
      c => c.metadata?.promoType === promoType && c.metadata?.plan === plan
    );

    if (!matchingCoupon) {
      return { valid: false, error: 'This promo code is not available for your selected plan' };
    }

    const planPrice = getBasePrice(plan);
    const discountAmount = matchingCoupon.amount_off ? matchingCoupon.amount_off / 100 : 0;
    const finalPrice = planPrice - discountAmount;

    return {
      valid: true,
      couponId: matchingCoupon.id,
      discountAmount,
      finalPrice,
    };
  }

  // Try as a direct Stripe promotion code
  try {
    const promotionCodes = await stripe.promotionCodes.list({
      code: code.toUpperCase(),
      active: true,
      limit: 1,
    });

    if (promotionCodes.data.length === 0) {
      return { valid: false, error: 'Invalid promo code' };
    }

    const promo = promotionCodes.data[0];
    const coupon = typeof promo.coupon === 'string'
      ? await stripe.coupons.retrieve(promo.coupon)
      : promo.coupon;

    // Check plan restriction
    if (coupon.metadata?.plan && coupon.metadata.plan !== plan) {
      return { valid: false, error: 'This promo code is not available for your selected plan' };
    }

    const planPrice = getBasePrice(plan);
    let discountAmount: number;

    if (coupon.amount_off) {
      discountAmount = coupon.amount_off / 100;
    } else if (coupon.percent_off) {
      discountAmount = planPrice * (coupon.percent_off / 100);
    } else {
      discountAmount = 0;
    }

    return {
      valid: true,
      couponId: coupon.id,
      discountAmount,
      finalPrice: planPrice - discountAmount,
    };
  } catch {
    return { valid: false, error: 'Invalid promo code' };
  }
}

function getBasePrice(plan: PlanTier): number {
  const prices: Record<PlanTier, number> = {
    FREE: 0,
    STARTER: 19.99,
    PLUS: 49.99,
    SMART: 99.99,
    PRO: 200.00,
  };
  return prices[plan];
}
```

---

## 3. Coupon and Promotion Code Management

### Coupon Lifecycle

```typescript
// src/lib/billing/coupon-management.ts

export async function createCoupon(params: {
  name: string;
  type: 'percent_off' | 'amount_off';
  value: number; // percentage or cents
  duration: 'once' | 'repeating' | 'forever';
  durationInMonths?: number;
  maxRedemptions?: number;
  redeemBy?: Date;
  planRestrictions?: PlanTier[];
  metadata?: Record<string, string>;
}): Promise<Stripe.Coupon> {
  const couponParams: Stripe.CouponCreateParams = {
    name: params.name,
    duration: params.duration,
    metadata: {
      ...params.metadata,
      createdBy: 'stone-ai-admin',
      planRestrictions: params.planRestrictions?.join(',') ?? 'all',
    },
  };

  if (params.type === 'percent_off') {
    couponParams.percent_off = params.value;
  } else {
    couponParams.amount_off = params.value;
    couponParams.currency = 'usd';
  }

  if (params.duration === 'repeating' && params.durationInMonths) {
    couponParams.duration_in_months = params.durationInMonths;
  }

  if (params.maxRedemptions) {
    couponParams.max_redemptions = params.maxRedemptions;
  }

  if (params.redeemBy) {
    couponParams.redeem_by = Math.floor(params.redeemBy.getTime() / 1000);
  }

  return stripe.coupons.create(couponParams);
}

export async function createPromotionCode(params: {
  couponId: string;
  code: string;
  maxRedemptions?: number;
  firstTimeOnly?: boolean;
  minimumAmount?: number;
  expiresAt?: Date;
}): Promise<Stripe.PromotionCode> {
  return stripe.promotionCodes.create({
    coupon: params.couponId,
    code: params.code.toUpperCase(),
    max_redemptions: params.maxRedemptions,
    restrictions: {
      first_time_transaction: params.firstTimeOnly ?? true,
      minimum_amount: params.minimumAmount,
      minimum_amount_currency: params.minimumAmount ? 'usd' : undefined,
    },
    expires_at: params.expiresAt
      ? Math.floor(params.expiresAt.getTime() / 1000)
      : undefined,
    metadata: {
      platform: 'stone-ai',
    },
  });
}

// Deactivate a promotion code
export async function deactivatePromoCode(code: string): Promise<void> {
  const promos = await stripe.promotionCodes.list({
    code: code.toUpperCase(),
    active: true,
    limit: 1,
  });

  if (promos.data.length > 0) {
    await stripe.promotionCodes.update(promos.data[0].id, {
      active: false,
    });
  }
}

// Get promotion code usage statistics
export async function getPromoCodeStats(code: string): Promise<{
  totalRedemptions: number;
  revenue: number;
  averageOrderValue: number;
  planBreakdown: Record<string, number>;
}> {
  const promos = await stripe.promotionCodes.list({
    code: code.toUpperCase(),
    limit: 1,
  });

  if (promos.data.length === 0) {
    throw new Error('Promotion code not found');
  }

  const promo = promos.data[0];
  const couponId = typeof promo.coupon === 'string' ? promo.coupon : promo.coupon.id;

  // Find all subscriptions using this coupon
  const subscriptions = await stripe.subscriptions.list({
    limit: 100,
    expand: ['data.discount'],
  });

  const redeemed = subscriptions.data.filter(
    s => s.discount?.coupon?.id === couponId
  );

  const planBreakdown: Record<string, number> = {};
  let totalRevenue = 0;

  for (const sub of redeemed) {
    const plan = sub.metadata?.plan ?? 'unknown';
    planBreakdown[plan] = (planBreakdown[plan] ?? 0) + 1;

    const item = sub.items.data[0];
    if (item?.price?.unit_amount) {
      totalRevenue += item.price.unit_amount / 100;
    }
  }

  return {
    totalRedemptions: promo.times_redeemed,
    revenue: totalRevenue,
    averageOrderValue: redeemed.length > 0 ? totalRevenue / redeemed.length : 0,
    planBreakdown,
  };
}
```

---

## 4. Price Changes for Existing Customers

### The Grandfathering Decision

When you raise prices, you have three options for existing customers:

1. **Grandfather** — Existing customers keep their current price forever.
2. **Grace period** — Existing customers keep current price for X months, then move to new price.
3. **Immediate** — All customers move to new price at their next billing cycle.

Each has tradeoffs:

| Strategy | Revenue Impact | Churn Risk | Complexity | Customer Sentiment |
|----------|---------------|-----------|------------|-------------------|
| Grandfather | Lowest | Lowest | Medium | Positive |
| Grace Period | Medium | Medium | High | Neutral |
| Immediate | Highest | Highest | Low | Negative |

**Stone AI's approach**: Grace period with 90 days notice. Existing customers keep their price for 90 days after the announcement, then move to the new price. This balances revenue optimization with customer respect.

### Implementing Price Changes

```typescript
// src/lib/billing/price-changes.ts

export async function executePriceChange(params: {
  plan: PlanTier;
  period: 'monthly' | 'annual';
  newAmount: number; // in cents
  effectiveDate: Date;
  gracePeriodDays: number;
  grandfatherExisting: boolean;
}): Promise<{
  newPriceId: string;
  affectedSubscriptions: number;
  scheduledChanges: number;
}> {
  // 1. Create the new price in Stripe
  const productId = getProductIdForPlan(params.plan);
  const interval = params.period === 'annual' ? 'year' : 'month';

  const newPrice = await stripe.prices.create({
    product: productId,
    unit_amount: params.newAmount,
    currency: 'usd',
    recurring: { interval },
    nickname: `${params.plan} ${params.period} - New pricing`,
    metadata: {
      plan: params.plan,
      period: params.period,
      effectiveDate: params.effectiveDate.toISOString(),
      previousPrice: 'see old price ID in metadata',
    },
  });

  // 2. Deactivate the old price (prevent new signups at old price)
  const oldPriceId = getPriceIdForPlan(params.plan, params.period);
  await stripe.prices.update(oldPriceId, { active: false });

  // 3. Update environment/config to point to new price
  // This would typically be done via env vars or a config table
  await prisma.pricingConfig.upsert({
    where: {
      plan_period: { plan: params.plan, period: params.period === 'annual' ? 'ANNUAL' : 'MONTHLY' },
    },
    create: {
      plan: params.plan,
      period: params.period === 'annual' ? 'ANNUAL' : 'MONTHLY',
      stripePriceId: newPrice.id,
      amount: params.newAmount,
      effectiveDate: params.effectiveDate,
    },
    update: {
      stripePriceId: newPrice.id,
      amount: params.newAmount,
      effectiveDate: params.effectiveDate,
    },
  });

  if (params.grandfatherExisting) {
    // Existing customers keep their price. No changes needed.
    return {
      newPriceId: newPrice.id,
      affectedSubscriptions: 0,
      scheduledChanges: 0,
    };
  }

  // 4. Find all active subscriptions on the old price
  let affectedCount = 0;
  let scheduledCount = 0;
  let hasMore = true;
  let startingAfter: string | undefined;

  while (hasMore) {
    const subscriptions = await stripe.subscriptions.list({
      price: oldPriceId,
      status: 'active',
      limit: 100,
      starting_after: startingAfter,
    });

    for (const sub of subscriptions.data) {
      affectedCount++;
      const currentItem = sub.items.data[0];

      // Calculate when this subscription should move to the new price
      const changeDate = new Date(Math.max(
        params.effectiveDate.getTime(),
        sub.current_period_end * 1000 + params.gracePeriodDays * 24 * 60 * 60 * 1000
      ));

      // Schedule the price change
      const schedule = await stripe.subscriptionSchedules.create({
        from_subscription: sub.id,
      });

      await stripe.subscriptionSchedules.update(schedule.id, {
        end_behavior: 'release',
        phases: [
          {
            items: [{ price: oldPriceId, quantity: 1 }],
            start_date: schedule.phases[0].start_date,
            end_date: Math.floor(changeDate.getTime() / 1000),
          },
          {
            items: [{ price: newPrice.id, quantity: 1 }],
            start_date: Math.floor(changeDate.getTime() / 1000),
          },
        ],
      });

      scheduledCount++;

      // Notify the customer
      const userId = sub.metadata?.userId;
      if (userId) {
        await sendEmail(userId, 'PRICE_CHANGE_NOTICE', {
          plan: params.plan,
          oldPrice: (currentItem.price.unit_amount ?? 0) / 100,
          newPrice: params.newAmount / 100,
          effectiveDate: changeDate,
          gracePeriodDays: params.gracePeriodDays,
        });
      }
    }

    hasMore = subscriptions.has_more;
    if (subscriptions.data.length > 0) {
      startingAfter = subscriptions.data[subscriptions.data.length - 1].id;
    }
  }

  return {
    newPriceId: newPrice.id,
    affectedSubscriptions: affectedCount,
    scheduledChanges: scheduledCount,
  };
}
```

### Price Change Communication Template

```typescript
// src/lib/billing/price-change-emails.ts

export const PRICE_CHANGE_EMAIL = {
  subject: 'Important update to your Stone AI subscription',
  template: `
Hi {firstName},

We're writing to let you know about an upcoming change to Stone AI pricing.

**What's changing:**
Your {planName} plan will move from ${oldPrice}/month to ${newPrice}/month.

**When:**
This change takes effect on {effectiveDate}.

**Why:**
We've significantly expanded our AI capabilities, added {newFeatureCount} new agents,
and improved the quality of responses across all tiers. This pricing update
reflects the increased value we're delivering.

**Your current price is locked until {effectiveDate}.**
You have {gracePeriodDays} days at your current rate.

**Your options:**
1. **Stay on your current plan** — Your price will update automatically on {effectiveDate}.
2. **Switch to annual billing** — Lock in a lower rate for 12 months.
3. **Downgrade** — Move to a lower tier if {planName} no longer fits your needs.
4. **Cancel** — We'd hate to see you go, but you can cancel anytime.

If you have any questions, reply to this email or contact us at support@stone-ai.net.

Thank you for being a Stone AI subscriber.

— The Stone AI Team
  `,
};
```

---

## 5. Tiered Pricing Implementation

### The Pricing Page API

```typescript
// src/app/api/pricing/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { userId } = await auth();

  // Get current user's plan for comparison
  let currentPlan: PlanTier = 'FREE';
  let currentPeriod: string | null = null;

  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentPlan: true, billingPeriod: true },
    });
    if (user) {
      currentPlan = user.currentPlan;
      currentPeriod = user.billingPeriod;
    }
  }

  const tiers = [
    {
      id: 'FREE',
      name: 'Free',
      description: 'Get started with AI assistance',
      monthlyPrice: 0,
      annualPrice: null,
      annualSavings: null,
      features: [
        { text: '4 AI agents', included: true },
        { text: 'Basic chat interface', included: true },
        { text: 'Community forum access', included: true },
        { text: 'Bestie companion', included: false },
        { text: 'Premium backdrops', included: false },
        { text: 'SMART agents (Claude Sonnet)', included: false },
      ],
      agentCount: 4,
      cta: currentPlan === 'FREE' ? 'Current Plan' : 'Downgrade',
      highlighted: false,
      badge: null,
    },
    {
      id: 'STARTER',
      name: 'Starter',
      description: 'For individuals getting serious about AI',
      monthlyPrice: 19.99,
      annualPrice: null,
      annualSavings: null,
      features: [
        { text: '16 AI agents', included: true },
        { text: '1 Bestie companion', included: true },
        { text: 'All chat features', included: true },
        { text: '2 communication styles', included: true },
        { text: 'Premium backdrops', included: false },
        { text: 'SMART agents (Claude Sonnet)', included: false },
      ],
      agentCount: 16,
      cta: currentPlan === 'STARTER' ? 'Current Plan' :
           PLAN_HIERARCHY[currentPlan] > PLAN_HIERARCHY.STARTER ? 'Downgrade' : 'Get Started',
      highlighted: false,
      badge: null,
      promos: {
        firstMonth: 9.99,
        trial: 14.99,
      },
    },
    {
      id: 'PLUS',
      name: 'Plus',
      description: 'For power users who want more',
      monthlyPrice: 49.99,
      annualPrice: null,
      annualSavings: null,
      features: [
        { text: '30 AI agents', included: true },
        { text: '1 Bestie companion', included: true },
        { text: 'Premium backdrops', included: true },
        { text: '4 personality paths', included: true },
        { text: '18 trait options', included: true },
        { text: 'SMART agents (Claude Sonnet)', included: false },
      ],
      agentCount: 30,
      cta: currentPlan === 'PLUS' ? 'Current Plan' :
           PLAN_HIERARCHY[currentPlan] > PLAN_HIERARCHY.PLUS ? 'Downgrade' : 'Upgrade',
      highlighted: false,
      badge: null,
      promos: {
        firstMonth: 9.99,
        trial: 14.99,
        growth: 39.99,
      },
    },
    {
      id: 'SMART',
      name: 'Smart',
      description: 'Our most popular plan — powered by Claude Sonnet',
      monthlyPrice: 99.99,
      annualPrice: 79.99,
      annualSavings: 240.00, // (99.99 - 79.99) * 12
      features: [
        { text: '39 AI agents including SMART agents', included: true },
        { text: '1 Bestie companion', included: true },
        { text: 'Claude Sonnet AI (cloud)', included: true },
        { text: 'All premium features', included: true },
        { text: '6 language support', included: true },
        { text: 'Priority email support', included: true },
      ],
      agentCount: 39,
      cta: currentPlan === 'SMART' ? 'Current Plan' :
           PLAN_HIERARCHY[currentPlan] > PLAN_HIERARCHY.SMART ? 'Downgrade' : 'Go Smart',
      highlighted: true,
      badge: 'Most Popular',
      promos: {
        firstMonth: 9.99,
        trial: 14.99,
        growth: 39.99,
      },
    },
    {
      id: 'PRO',
      name: 'Pro',
      description: 'Full access to everything Stone AI offers',
      monthlyPrice: 200.00,
      annualPrice: 170.00,
      annualSavings: 360.00, // (200 - 170) * 12
      features: [
        { text: 'All 42 public AI agents', included: true },
        { text: '1 Bestie companion', included: true },
        { text: 'All SMART features', included: true },
        { text: 'Priority support', included: true },
        { text: 'Early access to new agents', included: true },
        { text: 'Exclusive Pro community', included: true },
      ],
      agentCount: 42,
      cta: currentPlan === 'PRO' ? 'Current Plan' : 'Go Pro',
      highlighted: false,
      badge: 'Full Access',
      promos: {
        firstMonth: 9.99,
        trial: 14.99,
      },
    },
  ];

  return NextResponse.json({
    tiers,
    currentPlan,
    currentPeriod,
  });
}
```

---

## 6. Feature Gating by Tier

### Server-Side Feature Checks

```typescript
// src/lib/billing/feature-gates.ts

export interface TierFeatures {
  agentLimit: number;
  hasBestie: boolean;
  bestieStyles: number;
  bestiePaths: number;
  bestieTraits: number;
  bestieLanguages: number;
  premiumBackdrops: boolean;
  smartAgents: boolean;
  prioritySupport: boolean;
  earlyAccess: boolean;
  maxConversationsPerDay: number;
  maxMessagesPerConversation: number;
  forumPostsPerDay: number;
}

const TIER_FEATURES: Record<PlanTier, TierFeatures> = {
  FREE: {
    agentLimit: 4,
    hasBestie: false,
    bestieStyles: 0,
    bestiePaths: 0,
    bestieTraits: 0,
    bestieLanguages: 0,
    premiumBackdrops: false,
    smartAgents: false,
    prioritySupport: false,
    earlyAccess: false,
    maxConversationsPerDay: 10,
    maxMessagesPerConversation: 50,
    forumPostsPerDay: 3,
  },
  STARTER: {
    agentLimit: 16,
    hasBestie: true,
    bestieStyles: 2,
    bestiePaths: 4,
    bestieTraits: 18,
    bestieLanguages: 6,
    premiumBackdrops: false,
    smartAgents: false,
    prioritySupport: false,
    earlyAccess: false,
    maxConversationsPerDay: 50,
    maxMessagesPerConversation: 100,
    forumPostsPerDay: 10,
  },
  PLUS: {
    agentLimit: 30,
    hasBestie: true,
    bestieStyles: 2,
    bestiePaths: 4,
    bestieTraits: 18,
    bestieLanguages: 6,
    premiumBackdrops: true,
    smartAgents: false,
    prioritySupport: false,
    earlyAccess: false,
    maxConversationsPerDay: 100,
    maxMessagesPerConversation: 200,
    forumPostsPerDay: 20,
  },
  SMART: {
    agentLimit: 39,
    hasBestie: true,
    bestieStyles: 2,
    bestiePaths: 4,
    bestieTraits: 18,
    bestieLanguages: 6,
    premiumBackdrops: true,
    smartAgents: true,
    prioritySupport: true,
    earlyAccess: false,
    maxConversationsPerDay: 200,
    maxMessagesPerConversation: 500,
    forumPostsPerDay: 50,
  },
  PRO: {
    agentLimit: 42,
    hasBestie: true,
    bestieStyles: 2,
    bestiePaths: 4,
    bestieTraits: 18,
    bestieLanguages: 6,
    premiumBackdrops: true,
    smartAgents: true,
    prioritySupport: true,
    earlyAccess: true,
    maxConversationsPerDay: -1, // Unlimited
    maxMessagesPerConversation: -1,
    forumPostsPerDay: -1,
  },
};

export function getFeaturesForTier(tier: PlanTier): TierFeatures {
  return TIER_FEATURES[tier];
}

export function canAccessAgent(userTier: PlanTier, agentNumber: number): boolean {
  return agentNumber <= TIER_FEATURES[userTier].agentLimit;
}

export function canUseSmartAgents(userTier: PlanTier): boolean {
  return TIER_FEATURES[userTier].smartAgents;
}

export function canAccessPremiumBackdrop(userTier: PlanTier): boolean {
  return TIER_FEATURES[userTier].premiumBackdrops;
}
```

### Middleware-Level Feature Gating

```typescript
// src/middleware/billing-gate.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFeaturesForTier } from '@/lib/billing/feature-gates';

export function billingGate(
  requiredFeature: keyof TierFeatures,
  requiredValue?: any
) {
  return async (req: NextRequest, userId: string) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { currentPlan: true, subscriptionStatus: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const features = getFeaturesForTier(user.currentPlan);
    const featureValue = features[requiredFeature];

    if (typeof featureValue === 'boolean' && !featureValue) {
      return NextResponse.json({
        error: 'Feature not available on your current plan',
        requiredTier: getMinimumTierForFeature(requiredFeature),
        upgradeUrl: '/billing',
      }, { status: 403 });
    }

    if (typeof featureValue === 'number' && requiredValue !== undefined) {
      if (featureValue !== -1 && requiredValue > featureValue) {
        return NextResponse.json({
          error: 'Limit exceeded on your current plan',
          limit: featureValue,
          requiredTier: getMinimumTierForFeature(requiredFeature, requiredValue),
          upgradeUrl: '/billing',
        }, { status: 403 });
      }
    }

    return null; // Access granted
  };
}
```

---

## 7. Competitive Pricing Analysis

### How Stone AI Compares

```
| Competitor     | Entry Tier | Mid Tier  | Top Tier   | AI Model     |
|----------------|-----------|-----------|------------|--------------|
| ChatGPT Plus   | $20/mo    | $200/mo   | —          | GPT-4o/o3    |
| Claude Pro     | $20/mo    | $100/mo   | —          | Claude Sonnet/Opus |
| Jasper AI      | $49/mo    | $125/mo   | Custom     | Various      |
| Stone AI       | $19.99/mo | $99.99/mo | $200/mo    | Qwen + Claude|

Stone AI's advantage:
1. More specialized agents than any competitor
2. Bestie companion is unique
3. Tiered pricing allows gradual commitment
4. Cloud AI (Claude Sonnet) at SMART tier matches Claude Pro pricing
5. Local AI (Qwen) at lower tiers provides value without cloud costs
```

### Price Elasticity Considerations

```
Factors favoring price increases:
- Unique Bestie feature has no direct competitor
- Agent specialization adds perceived value
- Claude Sonnet access at $99.99 is competitive
- Premium community/forum creates switching costs

Factors favoring current prices:
- New entrant — needs to build trust
- Free tier creates acquisition funnel
- $9.99 first month promo lowers barrier
- Annual discounts already optimize for commitment
```

---

## 8. Pricing Experimentation Framework

### A/B Testing Price Points

```typescript
// src/lib/billing/price-experiments.ts
export interface PriceExperiment {
  id: string;
  name: string;
  plan: PlanTier;
  variants: {
    id: string;
    price: number;
    weight: number; // Traffic allocation (0-1)
  }[];
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'active' | 'completed' | 'canceled';
  metrics: {
    conversionRate: Record<string, number>;
    revenue: Record<string, number>;
    churnRate: Record<string, number>;
  };
}

export async function assignPriceVariant(
  userId: string,
  experimentId: string
): Promise<string> {
  // Check if user already has an assignment
  const existing = await prisma.experimentAssignment.findUnique({
    where: { userId_experimentId: { userId, experimentId } },
  });

  if (existing) return existing.variantId;

  // Deterministic assignment based on user ID
  const experiment = await prisma.priceExperiment.findUniqueOrThrow({
    where: { id: experimentId },
    include: { variants: true },
  });

  const hash = createHash('md5').update(`${userId}:${experimentId}`).digest();
  const bucket = hash.readUInt32BE(0) / 0xFFFFFFFF; // 0-1

  let cumulative = 0;
  let selectedVariant = experiment.variants[0];

  for (const variant of experiment.variants) {
    cumulative += variant.weight;
    if (bucket <= cumulative) {
      selectedVariant = variant;
      break;
    }
  }

  await prisma.experimentAssignment.create({
    data: {
      userId,
      experimentId,
      variantId: selectedVariant.id,
    },
  });

  return selectedVariant.id;
}
```

---

## Summary

Stone AI's pricing strategy execution covers:

1. **Five-tier architecture** (FREE through PRO) with psychological pricing at each level
2. **Annual discounts** only for SMART (20%) and PRO (15%) to reward commitment
3. **Three promotional programs** ($9.99 First Month, $14.99 Trial, $39.99 Growth) with plan-specific Stripe coupons
4. **Coupon lifecycle management** including creation, tracking, deactivation, and analytics
5. **Price change procedures** for existing customers with grandfathering options and 90-day grace periods
6. **Feature gating** at every tier with server-side enforcement and upgrade prompts
7. **Competitive positioning** relative to ChatGPT Plus, Claude Pro, and Jasper
8. **Pricing experimentation** framework for A/B testing price points

Every pricing decision is implemented through Stripe's billing infrastructure with local caching in Prisma. The system is designed so that pricing changes can be executed without code deployments — new prices are created in Stripe, old prices are deactivated, and the config database is updated.
