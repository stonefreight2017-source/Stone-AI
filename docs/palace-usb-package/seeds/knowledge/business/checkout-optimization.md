# Checkout Optimization — Stone AI Palace Knowledge Seed

## Seed Classification
- **Domain**: Revenue Operations / Conversion Optimization
- **Complexity**: Intermediate-Advanced
- **Stack**: Next.js 16, TypeScript, Stripe Checkout/Payment Element, Prisma 7.4
- **Applies To**: Stone AI, Best AI, Stone AI Tools

---

## 1. The Checkout Conversion Funnel

Every user who sees your pricing page and doesn't subscribe is money left on the table. Checkout optimization is the art and science of removing friction between "I want this" and "I bought this." For Stone AI, the funnel looks like:

```
Pricing Page Visitors     100%
  │ Click "Subscribe"      30-40%  (Engagement rate)
  │ Reach checkout          28-38% (Drop-off from clicks to checkout load)
  │ Enter payment info      15-25% (Major friction point)
  │ Complete purchase        12-20% (Final conversion)
  │
  ▼
Paying Customers
```

Every 1% improvement in conversion at any stage compounds. If you go from 15% to 18% checkout completion, that's a 20% increase in customers — with zero additional traffic.

---

## 2. Stripe Checkout vs Custom Payment Forms

### Stripe Checkout (Hosted)

Stripe Checkout is a pre-built, hosted payment page maintained by Stripe. Users are redirected to Stripe's domain to complete payment.

**Advantages:**
- PCI compliant out of the box
- Stripe continuously optimizes conversion
- Auto-handles 3D Secure and SCA
- Shows relevant payment methods by geography (Apple Pay, Google Pay, bank transfers)
- Supports 20+ languages automatically
- Mobile-optimized by default
- Built-in address collection and tax ID handling

**Disadvantages:**
- User leaves your site (redirect)
- Limited UI customization
- Can't deeply integrate with your page flow

### Stripe Payment Element (Embedded)

The Payment Element is an embeddable component that stays on your site.

**Advantages:**
- User never leaves your site
- Customizable appearance
- Can integrate with your own form flow

**Disadvantages:**
- More code to maintain
- You handle more of the PCI compliance
- You build your own mobile optimization
- You handle payment method display logic

### Recommendation for Stone AI

**Use Stripe Checkout for the primary subscription flow.** The conversion advantages of Stripe's continuously-optimized hosted checkout outweigh the UX cost of a redirect. Stripe reports that Checkout converts 8-12% better than custom forms for most SaaS companies.

Use Payment Element only for specific flows where staying on-site matters:
- Payment method updates (dunning recovery)
- Adding a backup payment method
- One-time purchases (if any)

---

## 3. Stripe Checkout Session Configuration

### Optimized Checkout Session

```typescript
// src/lib/stripe/optimized-checkout.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function createOptimizedCheckoutSession(params: {
  customerId: string;
  priceId: string;
  userId: string;
  plan: string;
  period: string;
  promoCode?: string;
  referralCode?: string;
  utmSource?: string;
}): Promise<Stripe.Checkout.Session> {
  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    customer: params.customerId,
    mode: 'subscription',

    // Line items — clear product description helps conversion
    line_items: [
      {
        price: params.priceId,
        quantity: 1,
      },
    ],

    // Allow Stripe to show promotion code entry field
    allow_promotion_codes: !params.promoCode,

    // If we have a specific promo, apply it directly
    ...(params.promoCode ? {
      discounts: [{ promotion_code: await resolvePromoCodeId(params.promoCode) }],
    } : {}),

    // Redirect URLs
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}&plan=${params.plan}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true&plan=${params.plan}`,

    // Tax collection
    automatic_tax: { enabled: true },
    tax_id_collection: { enabled: true },

    // Billing address (required for tax calculation)
    billing_address_collection: 'auto',

    // Update customer info from checkout
    customer_update: {
      address: 'auto',
      name: 'auto',
    },

    // Subscription metadata
    subscription_data: {
      metadata: {
        userId: params.userId,
        plan: params.plan,
        period: params.period,
        platform: 'stone-ai',
        utmSource: params.utmSource ?? '',
        referralCode: params.referralCode ?? '',
      },
    },

    // Payment method configuration
    payment_method_types: ['card'], // Add more as needed

    // Custom fields (optional — for business customers)
    // custom_fields: [
    //   { key: 'company', label: { type: 'custom', custom: 'Company Name' }, type: 'text', optional: true },
    // ],

    // Consent collection (email marketing)
    consent_collection: {
      terms_of_service: 'required',
    },

    // Custom text
    custom_text: {
      submit: {
        message: `Subscribe to Stone AI ${params.plan} — you can cancel anytime.`,
      },
      terms_of_service_acceptance: {
        message: 'I agree to the [Terms of Service](https://stone-ai.net/terms) and [Privacy Policy](https://stone-ai.net/privacy).',
      },
    },

    // Session expiration (30 minutes)
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,

    // Metadata for tracking
    metadata: {
      userId: params.userId,
      plan: params.plan,
      period: params.period,
      source: 'pricing_page',
      utmSource: params.utmSource ?? '',
    },
  };

  return stripe.checkout.sessions.create(sessionConfig);
}
```

### Checkout Session for Annual Plans with Savings Display

```typescript
export async function createAnnualCheckoutWithSavings(params: {
  customerId: string;
  plan: 'SMART' | 'PRO';
  userId: string;
}): Promise<Stripe.Checkout.Session> {
  const annualPriceId = getPriceIdForPlan(params.plan, 'annual');
  const monthlyCost = params.plan === 'SMART' ? 99.99 : 200.00;
  const annualMonthlyCost = params.plan === 'SMART' ? 84.99 : 170.00;
  const annualSavings = (monthlyCost - annualMonthlyCost) * 12;

  return stripe.checkout.sessions.create({
    customer: params.customerId,
    mode: 'subscription',
    line_items: [{ price: annualPriceId, quantity: 1 }],
    success_url: `${APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/billing?canceled=true`,
    custom_text: {
      submit: {
        message: `You're saving $${annualSavings.toFixed(0)} per year with annual billing!`,
      },
    },
    subscription_data: {
      metadata: {
        userId: params.userId,
        plan: params.plan,
        period: 'annual',
        platform: 'stone-ai',
      },
    },
    automatic_tax: { enabled: true },
  });
}
```

---

## 4. Pre-Checkout Optimization

### The Pricing Page

The pricing page is where the conversion battle is won or lost. Key optimization levers:

```typescript
// src/components/billing/PricingPage.tsx
// Key UX principles for the pricing page:

const PRICING_PAGE_PRINCIPLES = {
  // 1. Highlight the recommended plan
  highlightPlan: 'SMART', // "Most Popular" badge

  // 2. Default to the billing period that's best for the business
  defaultPeriod: 'annual', // Show annual first — higher LTV

  // 3. Show savings prominently
  showSavings: true, // "$180/year savings" badge on annual

  // 4. Reduce choice paralysis
  maxPlansVisible: 4, // Don't show all 5 plans equally (hide FREE in a smaller section)

  // 5. Social proof
  showSubscriberCount: true, // "Join 500+ Stone AI users"
  showTestimonials: true,

  // 6. Urgency (ethical)
  showPromo: true, // "First month $9.99 — limited time"

  // 7. Clear CTA
  ctaText: {
    upgrade: 'Get Started',
    current: 'Current Plan',
    downgrade: 'Switch Plan',
  },

  // 8. Feature comparison toggle
  showDetailedComparison: 'expandable', // Don't overwhelm, but make it available
};
```

### Plan Preselection from Feature Prompts

```typescript
// When a user hits a feature gate, pre-select the plan they need
// This creates a seamless "unlock" experience

// src/app/api/billing/preselect/route.ts
export async function GET(req: NextRequest) {
  const feature = req.nextUrl.searchParams.get('feature');
  const requiredPlan = getMinimumPlanForFeature(feature);

  // Redirect to pricing page with plan preselected
  const redirectUrl = new URL('/billing', process.env.NEXT_PUBLIC_APP_URL);
  redirectUrl.searchParams.set('recommended', requiredPlan);
  redirectUrl.searchParams.set('feature', feature ?? '');

  return NextResponse.redirect(redirectUrl);
}

function getMinimumPlanForFeature(feature: string | null): string {
  const featureMap: Record<string, string> = {
    'bestie': 'STARTER',
    'premium_backdrops': 'PLUS',
    'smart_agents': 'SMART',
    'claude_sonnet': 'SMART',
    'priority_support': 'SMART',
    'all_agents': 'PRO',
    'early_access': 'PRO',
  };
  return featureMap[feature ?? ''] ?? 'STARTER';
}
```

---

## 5. One-Click Upsells

### Post-Checkout Upsells

After a successful checkout, there's a golden window where the user is in "buying mode." This is the perfect time for upsells.

```typescript
// src/app/billing/success/upsell.tsx
'use client';

interface UpsellProps {
  currentPlan: string;
  currentPeriod: string;
}

export function PostCheckoutUpsell({ currentPlan, currentPeriod }: UpsellProps) {
  const upsell = getUpsellOffer(currentPlan, currentPeriod);
  if (!upsell) return null;

  return (
    <div className="mt-8 p-6 border rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10">
      <h3 className="text-lg font-semibold">{upsell.headline}</h3>
      <p className="text-sm text-gray-400 mt-2">{upsell.description}</p>
      <div className="mt-4 flex items-center gap-4">
        <span className="text-2xl font-bold">{upsell.price}</span>
        <span className="text-sm text-gray-500 line-through">{upsell.originalPrice}</span>
        <span className="text-sm text-green-400">{upsell.savings}</span>
      </div>
      <button
        onClick={() => handleUpsell(upsell)}
        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
      >
        {upsell.cta}
      </button>
      <p className="text-xs text-gray-500 mt-2">
        This upgrade takes effect immediately. Your next invoice will reflect the new plan.
      </p>
    </div>
  );
}

function getUpsellOffer(plan: string, period: string) {
  // Monthly → Annual upsell (most common and highest impact)
  if (period === 'monthly' && ['SMART', 'PRO'].includes(plan)) {
    const monthlyCost = plan === 'SMART' ? 99.99 : 200.00;
    const annualMonthlyCost = plan === 'SMART' ? 84.99 : 170.00;
    const annualSavings = (monthlyCost - annualMonthlyCost) * 12;

    return {
      type: 'period_upgrade',
      headline: `Save $${annualSavings.toFixed(0)}/year with annual billing`,
      description: `Switch to annual billing and pay just $${annualMonthlyCost}/month instead of $${monthlyCost}/month.`,
      price: `$${annualMonthlyCost}/mo`,
      originalPrice: `$${monthlyCost}/mo`,
      savings: `Save ${Math.round((1 - annualMonthlyCost/monthlyCost) * 100)}%`,
      cta: 'Switch to Annual',
      action: { type: 'switch_period', newPeriod: 'annual' },
    };
  }

  // Plan upgrade upsell
  const nextPlan = getNextPlan(plan);
  if (nextPlan) {
    return {
      type: 'plan_upgrade',
      headline: `Unlock even more with ${nextPlan.name}`,
      description: nextPlan.pitch,
      price: `$${nextPlan.price}/mo`,
      originalPrice: null,
      savings: `+${nextPlan.additionalAgents} more agents`,
      cta: `Upgrade to ${nextPlan.name}`,
      action: { type: 'upgrade_plan', newPlan: nextPlan.id },
    };
  }

  return null;
}

function getNextPlan(currentPlan: string) {
  const upgrades: Record<string, any> = {
    STARTER: {
      id: 'PLUS', name: 'Plus', price: 49.99, additionalAgents: 14,
      pitch: 'Get premium backdrops and 14 more specialized agents.',
    },
    PLUS: {
      id: 'SMART', name: 'Smart', price: 99.99, additionalAgents: 9,
      pitch: 'Unlock Claude Sonnet AI and our most intelligent SMART agents.',
    },
    SMART: {
      id: 'PRO', name: 'Pro', price: 200.00, additionalAgents: 3,
      pitch: 'Full access to all 38 agents plus priority support and early access.',
    },
  };
  return upgrades[currentPlan] ?? null;
}
```

---

## 6. Cart Abandonment Recovery

### Tracking Abandoned Checkouts

```typescript
// src/lib/billing/abandonment.ts

export async function trackCheckoutStart(
  userId: string,
  sessionId: string,
  plan: string,
  period: string
): Promise<void> {
  await prisma.checkoutAttempt.create({
    data: {
      userId,
      stripeSessionId: sessionId,
      plan,
      period,
      status: 'STARTED',
      startedAt: new Date(),
    },
  });
}

export async function handleCheckoutAbandonment(): Promise<void> {
  // Find checkout sessions started more than 1 hour ago that weren't completed
  const abandonedCheckouts = await prisma.checkoutAttempt.findMany({
    where: {
      status: 'STARTED',
      startedAt: {
        lt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        gt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Within last 24 hours
      },
    },
    include: {
      user: { select: { email: true, name: true } },
    },
  });

  for (const checkout of abandonedCheckouts) {
    // Verify the session wasn't actually completed
    try {
      const session = await stripe.checkout.sessions.retrieve(checkout.stripeSessionId);

      if (session.status === 'complete') {
        // Session was completed — update our record
        await prisma.checkoutAttempt.update({
          where: { id: checkout.id },
          data: { status: 'COMPLETED' },
        });
        continue;
      }

      if (session.status === 'expired') {
        await prisma.checkoutAttempt.update({
          where: { id: checkout.id },
          data: { status: 'EXPIRED' },
        });
      }
    } catch {
      // Session may have been cleaned up
    }

    // Send abandonment recovery email
    await prisma.checkoutAttempt.update({
      where: { id: checkout.id },
      data: { status: 'ABANDONED', abandonedAt: new Date() },
    });

    // Only send one abandonment email per user per week
    const recentEmail = await prisma.scheduledEmail.findFirst({
      where: {
        userId: checkout.userId,
        emailType: 'CHECKOUT_ABANDONED',
        createdAt: { gt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    if (!recentEmail) {
      await sendEmail(checkout.userId, 'CHECKOUT_ABANDONED', {
        plan: checkout.plan,
        period: checkout.period,
        price: getDisplayPrice(checkout.plan as PlanTier, checkout.period),
        resumeUrl: `${APP_URL}/billing?plan=${checkout.plan}&period=${checkout.period}`,
        incentive: getAbandonmentIncentive(checkout.plan as PlanTier),
      });
    }
  }
}

function getAbandonmentIncentive(plan: PlanTier): {
  hasIncentive: boolean;
  message?: string;
  promoCode?: string;
} {
  // Only offer incentive for SMART and PRO (higher value)
  if (plan === 'SMART' || plan === 'PRO') {
    return {
      hasIncentive: true,
      message: 'Complete your signup today and get your first month for just $9.99!',
      promoCode: 'WELCOME',
    };
  }

  return { hasIncentive: false };
}
```

### Abandonment Recovery Email Sequence

```typescript
// Abandoned checkout email sequence:
// 1. 1 hour after abandonment: "Did something go wrong?"
// 2. 24 hours: "Your plan is waiting for you"
// 3. 3 days: "Special offer — first month $9.99" (SMART/PRO only)
// 4. 7 days: Final reminder, no further emails

const ABANDONMENT_SEQUENCE = [
  {
    delay: 60 * 60 * 1000, // 1 hour
    template: 'CHECKOUT_ABANDONED_SOFT',
    subject: 'Did something go wrong?',
  },
  {
    delay: 24 * 60 * 60 * 1000, // 24 hours
    template: 'CHECKOUT_ABANDONED_REMINDER',
    subject: 'Your Stone AI plan is waiting',
  },
  {
    delay: 3 * 24 * 60 * 60 * 1000, // 3 days
    template: 'CHECKOUT_ABANDONED_OFFER',
    subject: 'Special offer: First month $9.99',
    smartPlusOnly: true,
  },
  {
    delay: 7 * 24 * 60 * 60 * 1000, // 7 days
    template: 'CHECKOUT_ABANDONED_FINAL',
    subject: 'Last chance: Complete your Stone AI subscription',
  },
];
```

---

## 7. Checkout Flow Analytics

### Tracking Key Metrics

```typescript
// src/lib/analytics/checkout-analytics.ts

export interface CheckoutMetrics {
  pricingPageViews: number;
  checkoutStarts: number;
  checkoutCompletions: number;
  abandonmentRate: number;
  conversionRate: number;
  avgTimeToComplete: number; // seconds
  topDropOffReasons: { reason: string; count: number }[];
  byPlan: Record<string, {
    starts: number;
    completions: number;
    conversionRate: number;
  }>;
  byPeriod: Record<string, {
    starts: number;
    completions: number;
    conversionRate: number;
  }>;
}

export async function getCheckoutMetrics(
  period: { start: Date; end: Date }
): Promise<CheckoutMetrics> {
  const attempts = await prisma.checkoutAttempt.findMany({
    where: {
      startedAt: { gte: period.start, lte: period.end },
    },
  });

  const total = attempts.length;
  const completed = attempts.filter(a => a.status === 'COMPLETED');
  const abandoned = attempts.filter(a => a.status === 'ABANDONED');

  // By plan
  const byPlan: Record<string, { starts: number; completions: number; conversionRate: number }> = {};
  for (const plan of ['STARTER', 'PLUS', 'SMART', 'PRO']) {
    const planAttempts = attempts.filter(a => a.plan === plan);
    const planCompleted = planAttempts.filter(a => a.status === 'COMPLETED');
    byPlan[plan] = {
      starts: planAttempts.length,
      completions: planCompleted.length,
      conversionRate: planAttempts.length > 0
        ? planCompleted.length / planAttempts.length
        : 0,
    };
  }

  // By period (monthly vs annual)
  const byPeriod: Record<string, { starts: number; completions: number; conversionRate: number }> = {};
  for (const billingPeriod of ['monthly', 'annual']) {
    const periodAttempts = attempts.filter(a => a.period === billingPeriod);
    const periodCompleted = periodAttempts.filter(a => a.status === 'COMPLETED');
    byPeriod[billingPeriod] = {
      starts: periodAttempts.length,
      completions: periodCompleted.length,
      conversionRate: periodAttempts.length > 0
        ? periodCompleted.length / periodAttempts.length
        : 0,
    };
  }

  return {
    pricingPageViews: 0, // Would come from analytics service
    checkoutStarts: total,
    checkoutCompletions: completed.length,
    abandonmentRate: total > 0 ? abandoned.length / total : 0,
    conversionRate: total > 0 ? completed.length / total : 0,
    avgTimeToComplete: calculateAvgCompletionTime(completed),
    topDropOffReasons: [], // Would need exit survey data
    byPlan,
    byPeriod,
  };
}
```

---

## 8. Mobile Checkout Optimization

```typescript
// Mobile-specific checkout considerations:

// 1. Stripe Checkout is already mobile-optimized
// But your PRICING PAGE needs to be too:

const MOBILE_PRICING_GUIDELINES = {
  // Show one plan at a time on mobile (swipeable carousel)
  layout: 'carousel',

  // Default to the recommended plan
  defaultVisible: 'SMART',

  // Minimize text — bullet points only
  maxFeaturesShown: 4,

  // Large touch targets for CTA buttons
  ctaMinHeight: '48px',

  // Sticky CTA at bottom of screen
  stickyCTA: true,

  // Show price prominently
  priceSize: '2rem',

  // Don't show the comparison table by default
  comparisonTable: 'hidden_by_default',
};

// 2. Apple Pay and Google Pay
// These are automatically shown in Stripe Checkout when applicable
// They dramatically improve mobile conversion (one-tap purchase)

// 3. Link (Stripe's one-click checkout)
// Stripe Link auto-fills payment details for returning customers
// No configuration needed — it's built into Stripe Checkout
```

---

## 9. Checkout A/B Testing Framework

```typescript
// src/lib/experiments/checkout-experiments.ts

export type CheckoutExperiment = {
  id: string;
  name: string;
  variants: {
    id: string;
    weight: number;
    config: Partial<CheckoutConfig>;
  }[];
};

interface CheckoutConfig {
  defaultPeriod: 'monthly' | 'annual';
  highlightedPlan: string;
  showPromoCodeField: boolean;
  showSavingsBadge: boolean;
  ctaText: string;
  showGuarantee: boolean;
  guaranteeText: string;
  showSocialProof: boolean;
  socialProofText: string;
}

// Current experiments to run:
export const ACTIVE_EXPERIMENTS: CheckoutExperiment[] = [
  {
    id: 'default_period_v1',
    name: 'Default billing period: monthly vs annual',
    variants: [
      { id: 'monthly', weight: 0.5, config: { defaultPeriod: 'monthly' } },
      { id: 'annual', weight: 0.5, config: { defaultPeriod: 'annual' } },
    ],
  },
  {
    id: 'cta_text_v1',
    name: 'CTA button text optimization',
    variants: [
      { id: 'get_started', weight: 0.33, config: { ctaText: 'Get Started' } },
      { id: 'subscribe_now', weight: 0.33, config: { ctaText: 'Subscribe Now' } },
      { id: 'start_free_trial', weight: 0.34, config: { ctaText: 'Start Free Trial' } },
    ],
  },
  {
    id: 'guarantee_v1',
    name: 'Money-back guarantee display',
    variants: [
      { id: 'no_guarantee', weight: 0.5, config: { showGuarantee: false } },
      {
        id: 'with_guarantee',
        weight: 0.5,
        config: {
          showGuarantee: true,
          guaranteeText: '48-hour money-back guarantee. No questions asked.',
        },
      },
    ],
  },
];
```

---

## Summary

Checkout optimization for Stone AI covers:

1. **Stripe Checkout vs Payment Element** — Use Checkout for primary subscription flow, Payment Element for updates
2. **Optimized session configuration** — Tax, consent, custom text, session expiration
3. **Pre-checkout optimization** — Pricing page design, plan preselection from feature gates
4. **One-click upsells** — Monthly-to-annual and plan upgrade offers post-checkout
5. **Cart abandonment recovery** — Tracking, timed email sequence, conditional incentives
6. **Checkout analytics** — Conversion rates by plan, period, and funnel stage
7. **Mobile optimization** — Carousel pricing, Apple/Google Pay, responsive CTAs
8. **A/B testing framework** — Experiment infrastructure for continuous optimization

Every percentage point of checkout conversion improvement translates directly to revenue growth without additional marketing spend. The goal is to make the path from "interested" to "subscribed" as frictionless as possible.
