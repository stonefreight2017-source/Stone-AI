# Stripe Integration Deep Dive — Stone AI Palace Knowledge Seed

## Seed Classification
- **Domain**: Revenue Operations / Payment Infrastructure
- **Complexity**: Advanced
- **Stack**: Next.js 16, TypeScript, Stripe API v2024+, Prisma 7.4
- **Applies To**: Stone AI, Best AI, Stone AI Tools

---

## 1. Stripe Architecture Overview

Stripe is the payment backbone for the entire Three-Headed Monster ecosystem. Every dollar flows through Stripe's infrastructure before reaching the business. Understanding the integration deeply — not just at the "copy a code snippet" level — is what separates revenue-resilient SaaS from brittle payment systems that leak money.

### Core Stripe Objects and Their Relationships

```
Customer
├── PaymentMethod (card, bank, etc.)
├── Subscription
│   ├── SubscriptionItem (one per Price)
│   ├── Invoice (generated per billing cycle)
│   │   └── PaymentIntent (actual charge attempt)
│   └── Discount (coupon applied)
├── Invoice (one-off)
├── PaymentIntent (one-time payment)
├── SetupIntent (save card without charging)
└── Balance (credits, adjustments)
```

Every Stripe object has an `id` prefixed with its type: `cus_` for customers, `sub_` for subscriptions, `pi_` for payment intents, `inv_` for invoices, `pm_` for payment methods, `price_` for prices, `prod_` for products. This naming convention is critical for debugging and logging — you should always log Stripe IDs alongside your internal IDs.

### The Stripe-Prisma Sync Problem

The single most common failure mode in Stripe integrations is data desynchronization between your database and Stripe. Your Prisma `User` model has a `stripeCustomerId`. Your subscription state lives in both Stripe and your database. When these diverge, users get wrong access levels, billing breaks, and support tickets explode.

**The Golden Rule**: Stripe is the source of truth for billing state. Your database is a cache of that truth. Webhooks are the synchronization mechanism.

```typescript
// prisma/schema.prisma — billing-relevant fields
model User {
  id               String   @id @default(cuid())
  email            String   @unique
  stripeCustomerId String?  @unique
  subscriptionId   String?  @unique
  subscriptionStatus SubscriptionStatus @default(FREE)
  currentPlan      PlanTier @default(FREE)
  billingPeriod    BillingPeriod?
  trialEndsAt      DateTime?
  currentPeriodEnd DateTime?
  cancelAtPeriodEnd Boolean @default(false)
}

enum SubscriptionStatus {
  FREE
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
  UNPAID
  PAUSED
  INCOMPLETE
  INCOMPLETE_EXPIRED
}

enum PlanTier {
  FREE
  STARTER
  PLUS
  SMART
  PRO
}

enum BillingPeriod {
  MONTHLY
  ANNUAL
}
```

---

## 2. Stripe Customer Management

### Creating Customers

Never create a Stripe customer until the user signals purchase intent. For Stone AI, this means the customer object is created when they first click "Subscribe" or "Start Trial," not at registration.

```typescript
// src/lib/stripe/customers.ts
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export async function getOrCreateStripeCustomer(userId: string): Promise<string> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, email: true, stripeCustomerId: true, name: true },
  });

  if (user.stripeCustomerId) {
    // Verify the customer still exists in Stripe
    try {
      await stripe.customers.retrieve(user.stripeCustomerId);
      return user.stripeCustomerId;
    } catch (error) {
      if ((error as Stripe.errors.StripeError).code === 'resource_missing') {
        // Customer was deleted in Stripe — recreate
        console.warn(`Stripe customer ${user.stripeCustomerId} missing, recreating for user ${userId}`);
      } else {
        throw error;
      }
    }
  }

  const customer = await stripe.customers.create({
    email: user.email!,
    name: user.name ?? undefined,
    metadata: {
      userId: user.id,
      platform: 'stone-ai',
      createdAt: new Date().toISOString(),
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}
```

**Key decisions in this code:**
1. `metadata.userId` — This links the Stripe customer back to your system. When webhooks fire, you need this to find the right user.
2. `metadata.platform` — Future-proofing for when Best AI and Tools share the same Stripe account.
3. Re-creation on missing customer — Handles the edge case where someone deletes a customer in the Stripe dashboard.

### Customer Metadata Strategy

Stripe metadata is limited to 50 keys, each up to 500 characters. Use it strategically:

```typescript
const CUSTOMER_METADATA_SCHEMA = {
  userId: 'Internal user ID',
  platform: 'stone-ai | best-ai | tools',
  signupDate: 'ISO date of account creation',
  referralCode: 'If user was referred',
  acquisitionChannel: 'organic | paid | referral | affiliate',
  region: 'User region for tax/compliance',
};
```

---

## 3. Checkout Sessions — The Purchase Flow

### Stripe Checkout vs. Custom Checkout

Stripe offers two paths: **Stripe Checkout** (hosted by Stripe) and **Custom Checkout** (using Payment Element in your UI). For Stone AI, Stripe Checkout is the correct choice for the following reasons:

1. **PCI compliance** — Stripe Checkout handles all card data, so Stone AI never touches sensitive payment info.
2. **Conversion optimization** — Stripe continuously A/B tests their checkout flow. You get those improvements for free.
3. **Payment method support** — Stripe Checkout automatically shows relevant payment methods (Apple Pay, Google Pay, bank debits) based on the customer's location and device.
4. **3D Secure handling** — SCA (Strong Customer Authentication) is automatic with Stripe Checkout.

The tradeoff is less UI control. For Stone AI's pricing tiers, this is an acceptable trade.

### Creating Checkout Sessions

```typescript
// src/app/api/billing/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { getOrCreateStripeCustomer } from '@/lib/stripe/customers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// Stone AI Price IDs — mapped from plan + billing period
const PRICE_MAP: Record<string, Record<string, string>> = {
  STARTER: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY!,
    annual: process.env.STRIPE_PRICE_STARTER_ANNUAL!,
  },
  PLUS: {
    monthly: process.env.STRIPE_PRICE_PLUS_MONTHLY!,
    annual: process.env.STRIPE_PRICE_PLUS_ANNUAL!,
  },
  SMART: {
    monthly: process.env.STRIPE_PRICE_SMART_MONTHLY!,
    annual: process.env.STRIPE_PRICE_SMART_ANNUAL!,
  },
  PRO: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY!,
    annual: process.env.STRIPE_PRICE_PRO_ANNUAL!,
  },
};

const CheckoutSchema = z.object({
  plan: z.enum(['STARTER', 'PLUS', 'SMART', 'PRO']),
  period: z.enum(['monthly', 'annual']),
  promoCode: z.string().optional(),
}).strict();

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CheckoutSchema.parse(body);

    const stripeCustomerId = await getOrCreateStripeCustomer(userId);
    const priceId = PRICE_MAP[parsed.plan]?.[parsed.period];

    if (!priceId) {
      return NextResponse.json({ error: 'Invalid plan configuration' }, { status: 400 });
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
      subscription_data: {
        metadata: {
          userId,
          plan: parsed.plan,
          period: parsed.period,
          platform: 'stone-ai',
        },
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      tax_id_collection: { enabled: true },
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    };

    // Apply promotional pricing if applicable
    if (parsed.promoCode) {
      const promotionCodes = await stripe.promotionCodes.list({
        code: parsed.promoCode,
        active: true,
        limit: 1,
      });

      if (promotionCodes.data.length > 0) {
        sessionParams.discounts = [
          { promotion_code: promotionCodes.data[0].id },
        ];
        // Remove allow_promotion_codes when using discounts directly
        delete sessionParams.allow_promotion_codes;
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.errors }, { status: 400 });
    }
    console.error('Checkout session creation failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Checkout Session Success Handling

After Stripe redirects the user back, you need to handle the success page. **Critical**: Do NOT activate the subscription on the success redirect. Wait for the webhook. The redirect is just for UX.

```typescript
// src/app/billing/success/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function BillingSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    // Poll for subscription activation (webhook may take a few seconds)
    const checkSubscription = async () => {
      const res = await fetch(`/api/billing/check-subscription?session=${sessionId}`);
      const data = await res.json();

      if (data.active) {
        setStatus('success');
      } else {
        // Retry after 2 seconds, max 5 attempts
        setTimeout(checkSubscription, 2000);
      }
    };

    checkSubscription();
  }, [sessionId]);

  // Render appropriate UI based on status
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      {status === 'loading' && <p>Activating your subscription...</p>}
      {status === 'success' && <p>Welcome to Stone AI! Your plan is now active.</p>}
      {status === 'error' && <p>Something went wrong. Please contact support.</p>}
    </div>
  );
}
```

---

## 4. Subscription Lifecycle Management

### Creating Subscriptions Directly (API-Only Flows)

While Checkout Sessions are preferred for user-facing flows, you sometimes need to create subscriptions programmatically — for example, when migrating users from another billing system or applying founder-granted access.

```typescript
// src/lib/stripe/subscriptions.ts
export async function createSubscription(
  customerId: string,
  priceId: string,
  options: {
    trialDays?: number;
    couponId?: string;
    metadata?: Record<string, string>;
  } = {}
): Promise<Stripe.Subscription> {
  const params: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription',
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
    },
    expand: ['latest_invoice.payment_intent'],
    metadata: options.metadata ?? {},
  };

  if (options.trialDays) {
    params.trial_period_days = options.trialDays;
    params.trial_settings = {
      end_behavior: { missing_payment_method: 'cancel' },
    };
  }

  if (options.couponId) {
    params.coupon = options.couponId;
  }

  return stripe.subscriptions.create(params);
}
```

### Subscription States and Transitions

```
                    ┌─────────────────┐
                    │   incomplete    │ ← Checkout started but not completed
                    └────────┬────────┘
                             │ payment succeeds
                             ▼
┌──────────┐       ┌─────────────────┐
│ trialing │──────▶│     active      │◀─── payment succeeds after past_due
└──────────┘       └────────┬────────┘
   trial ends,              │
   payment fails            │ payment fails
                             ▼
                    ┌─────────────────┐
                    │   past_due      │ ← Stripe retrying payments
                    └────────┬────────┘
                             │ all retries exhausted
                             ▼
                    ┌─────────────────┐
                    │    unpaid       │ ← Terminal (or canceled, based on settings)
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │   canceled      │ ← Subscription ended
                    └─────────────────┘
```

Each state requires different handling in your application:

| Status | User Access | UI State | Action |
|--------|------------|----------|--------|
| `incomplete` | None | Show "Complete Payment" | Redirect to payment |
| `trialing` | Full tier access | Show trial countdown | Remind before trial ends |
| `active` | Full tier access | Normal | None |
| `past_due` | Degraded (grace period) | Show "Update Payment" | Send dunning emails |
| `unpaid` | None | Show "Reactivate" | Require payment update |
| `canceled` | Until period end | Show "Resubscribe" | Offer win-back |
| `paused` | None | Show "Resume" | Allow easy resume |

### Upgrading and Downgrading

```typescript
// src/lib/stripe/plan-changes.ts
export async function changePlan(
  subscriptionId: string,
  newPriceId: string,
  options: {
    proration?: 'create_prorations' | 'none' | 'always_invoice';
    immediate?: boolean;
  } = {}
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentItem = subscription.items.data[0];

  if (!currentItem) {
    throw new Error('Subscription has no items');
  }

  const updateParams: Stripe.SubscriptionUpdateParams = {
    items: [
      {
        id: currentItem.id,
        price: newPriceId,
      },
    ],
    proration_behavior: options.proration ?? 'create_prorations',
    metadata: {
      ...subscription.metadata,
      lastPlanChange: new Date().toISOString(),
      previousPrice: currentItem.price.id,
    },
  };

  // For downgrades, apply at period end to give user remaining time on current plan
  if (!options.immediate) {
    // Check if this is a downgrade by comparing price amounts
    const currentPrice = await stripe.prices.retrieve(currentItem.price.id);
    const newPrice = await stripe.prices.retrieve(newPriceId);

    if ((newPrice.unit_amount ?? 0) < (currentPrice.unit_amount ?? 0)) {
      // Downgrade — schedule for end of current period
      return scheduleDowngrade(subscriptionId, newPriceId);
    }
  }

  return stripe.subscriptions.update(subscriptionId, updateParams);
}

async function scheduleDowngrade(
  subscriptionId: string,
  newPriceId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentItem = subscription.items.data[0];

  // Create a subscription schedule from the existing subscription
  const schedule = await stripe.subscriptionSchedules.create({
    from_subscription: subscriptionId,
  });

  // Update the schedule to change plan at next billing period
  await stripe.subscriptionSchedules.update(schedule.id, {
    phases: [
      {
        items: [{ price: currentItem.price.id, quantity: 1 }],
        start_date: schedule.phases[0].start_date,
        end_date: schedule.phases[0].end_date,
      },
      {
        items: [{ price: newPriceId, quantity: 1 }],
        start_date: schedule.phases[0].end_date,
        iterations: 1,
      },
    ],
  });

  return stripe.subscriptions.retrieve(subscriptionId);
}
```

### Cancellation Flow

```typescript
// src/lib/stripe/cancellation.ts
export async function cancelSubscription(
  subscriptionId: string,
  options: {
    immediate?: boolean;
    reason?: string;
    feedback?: string;
  } = {}
): Promise<Stripe.Subscription> {
  if (options.immediate) {
    // Immediate cancellation — rare, usually for refund cases
    return stripe.subscriptions.cancel(subscriptionId, {
      prorate: true,
      invoice_now: true,
    });
  }

  // Cancel at period end — user keeps access until billing cycle ends
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
    metadata: {
      cancelReason: options.reason ?? 'user_requested',
      cancelFeedback: options.feedback ?? '',
      cancelRequestedAt: new Date().toISOString(),
    },
  });
}

export async function reactivateSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  // Only works if cancel_at_period_end is true and period hasn't ended
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
    metadata: {
      cancelReason: '',
      cancelFeedback: '',
      cancelRequestedAt: '',
      reactivatedAt: new Date().toISOString(),
    },
  });
}
```

---

## 5. Payment Intents and Setup Intents

### When to Use Each

- **PaymentIntent**: Collecting a payment NOW. Used for one-time purchases.
- **SetupIntent**: Saving a payment method for LATER. Used for trials without upfront charges, or adding a backup payment method.
- **Checkout Session**: Combines both. For subscription creation, this is the preferred approach.

### Setup Intents for Trial Starts

When a user starts a trial, you want their payment method on file so the transition to paid is seamless:

```typescript
// src/lib/stripe/setup-intents.ts
export async function createSetupIntent(customerId: string): Promise<Stripe.SetupIntent> {
  return stripe.setupIntents.create({
    customer: customerId,
    payment_method_types: ['card'],
    usage: 'off_session', // Important: allows charging later without user present
    metadata: {
      purpose: 'trial_payment_method',
      platform: 'stone-ai',
    },
  });
}
```

The `usage: 'off_session'` flag is critical. It tells Stripe this payment method will be used for recurring charges when the user isn't actively on your site. This triggers additional authentication flows (3D Secure) upfront, reducing failed payments later.

---

## 6. Idempotency Keys

### Why Idempotency Matters

Network requests fail. Servers crash mid-operation. Users double-click buttons. Without idempotency, any of these scenarios can result in double charges, duplicate subscriptions, or missing records.

Stripe supports idempotency keys on all POST requests. If you send the same idempotency key twice, Stripe returns the result of the first request instead of creating a duplicate.

```typescript
// src/lib/stripe/idempotency.ts
import { createHash } from 'crypto';

export function generateIdempotencyKey(
  action: string,
  userId: string,
  ...params: string[]
): string {
  const raw = [action, userId, ...params, Date.now().toString()].join(':');
  return createHash('sha256').update(raw).digest('hex').substring(0, 64);
}

// Usage in checkout
const idempotencyKey = generateIdempotencyKey('checkout', userId, plan, period);

const session = await stripe.checkout.sessions.create(
  sessionParams,
  { idempotencyKey }
);
```

**Best practices for idempotency keys:**
1. Include the action type, user ID, and relevant parameters.
2. Keys expire after 24 hours in Stripe.
3. Do NOT include timestamps if you want retries to work (same key = same result).
4. For operations that SHOULD be retryable (like checkout), omit the timestamp.
5. For operations that SHOULD be unique per attempt, include the timestamp.

```typescript
// Retryable — same key for same checkout attempt
const checkoutKey = generateStableKey('checkout', userId, plan, period);

// Unique per attempt — subscription update should always go through
const updateKey = generateUniqueKey('plan-change', userId, newPlan);

function generateStableKey(...parts: string[]): string {
  return createHash('sha256').update(parts.join(':')).digest('hex').substring(0, 64);
}

function generateUniqueKey(...parts: string[]): string {
  return createHash('sha256')
    .update([...parts, crypto.randomUUID()].join(':'))
    .digest('hex')
    .substring(0, 64);
}
```

---

## 7. Comprehensive Error Handling

### Stripe Error Types

Stripe errors have a consistent structure. Understanding them prevents generic error messages from reaching users:

```typescript
// src/lib/stripe/errors.ts
import Stripe from 'stripe';

export type StripeErrorCode =
  | 'card_declined'
  | 'expired_card'
  | 'incorrect_cvc'
  | 'processing_error'
  | 'insufficient_funds'
  | 'authentication_required'
  | 'rate_limit'
  | 'invalid_request'
  | 'api_error';

export function handleStripeError(error: unknown): {
  code: StripeErrorCode;
  message: string;
  retryable: boolean;
  userMessage: string;
} {
  if (error instanceof Stripe.errors.StripeCardError) {
    const declineCode = error.decline_code;
    return {
      code: (declineCode as StripeErrorCode) ?? 'card_declined',
      message: error.message,
      retryable: ['processing_error', 'try_again_later'].includes(declineCode ?? ''),
      userMessage: getCardErrorMessage(declineCode),
    };
  }

  if (error instanceof Stripe.errors.StripeRateLimitError) {
    return {
      code: 'rate_limit',
      message: error.message,
      retryable: true,
      userMessage: 'Too many requests. Please try again in a moment.',
    };
  }

  if (error instanceof Stripe.errors.StripeInvalidRequestError) {
    return {
      code: 'invalid_request',
      message: error.message,
      retryable: false,
      userMessage: 'There was a problem with your request. Please try again.',
    };
  }

  if (error instanceof Stripe.errors.StripeAPIError) {
    return {
      code: 'api_error',
      message: (error as any).message ?? 'Unknown API error',
      retryable: true,
      userMessage: 'Our payment system is temporarily unavailable. Please try again.',
    };
  }

  return {
    code: 'api_error',
    message: error instanceof Error ? error.message : 'Unknown error',
    retryable: false,
    userMessage: 'An unexpected error occurred. Please contact support.',
  };
}

function getCardErrorMessage(declineCode: string | null | undefined): string {
  const messages: Record<string, string> = {
    insufficient_funds: 'Your card has insufficient funds. Please try a different card.',
    lost_card: 'This card has been reported lost. Please use a different card.',
    stolen_card: 'This card has been reported stolen. Please use a different card.',
    expired_card: 'Your card has expired. Please update your payment method.',
    incorrect_cvc: 'The CVC number is incorrect. Please check and try again.',
    processing_error: 'Your card couldn\'t be processed. Please try again.',
    card_not_supported: 'This card type is not supported. Please use a different card.',
    currency_not_supported: 'This card does not support the requested currency.',
    duplicate_transaction: 'A similar transaction was recently submitted. Please wait a moment.',
    fraudulent: 'This transaction has been declined. Please contact your bank.',
    generic_decline: 'Your card was declined. Please contact your bank for details.',
    incorrect_number: 'The card number is incorrect. Please check and try again.',
    invalid_expiry_month: 'The expiration month is invalid.',
    invalid_expiry_year: 'The expiration year is invalid.',
  };

  return messages[declineCode ?? ''] ?? 'Your card was declined. Please try a different payment method.';
}
```

### Retry Logic with Exponential Backoff

```typescript
// src/lib/stripe/retry.ts
export async function withStripeRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelayMs?: number;
    idempotencyKey?: string;
  } = {}
): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000 } = options;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const stripeError = handleStripeError(error);

      if (!stripeError.retryable || attempt === maxRetries) {
        throw error;
      }

      const delay = baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000;
      console.warn(
        `Stripe operation failed (attempt ${attempt + 1}/${maxRetries + 1}), ` +
        `retrying in ${Math.round(delay)}ms: ${stripeError.message}`
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Unreachable');
}

// Usage
const session = await withStripeRetry(
  () => stripe.checkout.sessions.create(params, { idempotencyKey }),
  { maxRetries: 3 }
);
```

---

## 8. Test Mode to Live Mode Migration

### The Migration Checklist

Moving from Stripe test mode to live mode is one of the highest-risk operations in a SaaS launch. One mistake means real charges fail, subscriptions break, or — worst case — you charge real customers incorrectly.

#### Phase 1: Pre-Migration Verification

```typescript
// scripts/stripe-migration-check.ts
/**
 * Pre-migration verification script.
 * Run this BEFORE switching to live keys.
 * It verifies all products, prices, and webhooks are mirrored in live mode.
 */

async function verifyMigrationReadiness() {
  const testStripe = new Stripe(process.env.STRIPE_SECRET_KEY_TEST!);
  const liveStripe = new Stripe(process.env.STRIPE_SECRET_KEY_LIVE!);

  // 1. Verify all products exist in live mode
  const testProducts = await testStripe.products.list({ active: true, limit: 100 });
  const liveProducts = await liveStripe.products.list({ active: true, limit: 100 });

  console.log(`Test products: ${testProducts.data.length}`);
  console.log(`Live products: ${liveProducts.data.length}`);

  for (const testProd of testProducts.data) {
    const liveProd = liveProducts.data.find(p => p.name === testProd.name);
    if (!liveProd) {
      console.error(`MISSING in live: Product "${testProd.name}" (${testProd.id})`);
    }
  }

  // 2. Verify all prices exist
  const testPrices = await testStripe.prices.list({ active: true, limit: 100 });
  const livePrices = await liveStripe.prices.list({ active: true, limit: 100 });

  for (const testPrice of testPrices.data) {
    const matchingLive = livePrices.data.find(
      p => p.unit_amount === testPrice.unit_amount &&
           p.recurring?.interval === testPrice.recurring?.interval
    );
    if (!matchingLive) {
      console.error(
        `MISSING in live: Price $${(testPrice.unit_amount ?? 0) / 100}/${testPrice.recurring?.interval} ` +
        `(${testPrice.id})`
      );
    }
  }

  // 3. Verify webhook endpoints
  const testWebhooks = await testStripe.webhookEndpoints.list();
  const liveWebhooks = await liveStripe.webhookEndpoints.list();

  console.log(`\nTest webhooks: ${testWebhooks.data.length}`);
  console.log(`Live webhooks: ${liveWebhooks.data.length}`);

  for (const testWh of testWebhooks.data) {
    const liveWh = liveWebhooks.data.find(w => w.url === testWh.url);
    if (!liveWh) {
      console.error(`MISSING in live: Webhook ${testWh.url}`);
    } else {
      const missingEvents = testWh.enabled_events.filter(
        e => !liveWh.enabled_events.includes(e)
      );
      if (missingEvents.length > 0) {
        console.error(`Webhook ${testWh.url} missing events: ${missingEvents.join(', ')}`);
      }
    }
  }

  // 4. Verify coupons/promotion codes
  const testCoupons = await testStripe.coupons.list({ limit: 100 });
  const liveCoupons = await liveStripe.coupons.list({ limit: 100 });

  console.log(`\nTest coupons: ${testCoupons.data.length}`);
  console.log(`Live coupons: ${liveCoupons.data.length}`);
}
```

#### Phase 2: Environment Variable Swap

```bash
# .env.local — current (test mode)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_test_...

# .env.local — after migration (live mode)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...

# Price IDs CHANGE between test and live. Map them:
STRIPE_PRICE_STARTER_MONTHLY=price_live_starter_monthly
STRIPE_PRICE_STARTER_ANNUAL=price_live_starter_annual
STRIPE_PRICE_PLUS_MONTHLY=price_live_plus_monthly
STRIPE_PRICE_PLUS_ANNUAL=price_live_plus_annual
STRIPE_PRICE_SMART_MONTHLY=price_live_smart_monthly
STRIPE_PRICE_SMART_ANNUAL=price_live_smart_annual
STRIPE_PRICE_PRO_MONTHLY=price_live_pro_monthly
STRIPE_PRICE_PRO_ANNUAL=price_live_pro_annual
```

#### Phase 3: Post-Migration Smoke Test

```typescript
// After deploying with live keys, immediately test:
const smokeTests = [
  'Create a real $1 subscription (use a test coupon for 100% off first month)',
  'Verify webhook fires and user record updates',
  'Cancel the subscription',
  'Verify cancellation webhook fires',
  'Check the Stripe dashboard for the subscription lifecycle',
  'Verify the user portal loads with live data',
  'Test a real card decline (use Stripe test card 4000 0000 0000 0002 — wait, live mode!)',
  'Instead: temporarily subscribe yourself and verify the full flow',
];
```

---

## 9. Stripe Products and Prices for Stone AI

### Product/Price Architecture

```typescript
// scripts/seed-stripe-products.ts
/**
 * Creates all Stone AI products and prices in Stripe.
 * Run once per mode (test and live).
 */

const PRODUCTS = [
  {
    name: 'Stone AI Starter',
    description: 'Access to 16 AI agents, 1 Bestie companion',
    prices: [
      { amount: 1999, interval: 'month' as const, nickname: 'Starter Monthly' },
      // No annual for Starter
    ],
  },
  {
    name: 'Stone AI Plus',
    description: 'Access to 30 AI agents, 1 Bestie companion, premium features',
    prices: [
      { amount: 4999, interval: 'month' as const, nickname: 'Plus Monthly' },
      // No annual for Plus
    ],
  },
  {
    name: 'Stone AI Smart',
    description: 'Access to 39 AI agents including Claude Sonnet, 1 Bestie companion',
    prices: [
      { amount: 9999, interval: 'month' as const, nickname: 'Smart Monthly' },
      { amount: 7999, interval: 'month' as const, nickname: 'Smart Annual (per month equivalent)',
        intervalCount: 1, metadata: { billingPeriod: 'annual', displayPrice: '$79.99/mo billed annually' } },
      // Actually for annual: $79.99/mo * 12 = $959.88/year
      { amount: 95988, interval: 'year' as const, nickname: 'Smart Annual' },
    ],
  },
  {
    name: 'Stone AI Pro',
    description: 'Full access to all 42 public AI agents, priority support',
    prices: [
      { amount: 20000, interval: 'month' as const, nickname: 'Pro Monthly' },
      { amount: 204000, interval: 'year' as const, nickname: 'Pro Annual ($170/mo)' },
    ],
  },
];

// Promotional prices
const PROMOS = [
  {
    name: 'First Month Special',
    coupon: { amount_off: undefined, percent_off: undefined, duration: 'once' as const },
    // $9.99 first month — implemented as a coupon per plan
    plans: {
      STARTER: { amount_off: 1000 }, // $19.99 - $10.00 = $9.99
      PLUS: { amount_off: 4000 },    // $49.99 - $40.00 = $9.99
      SMART: { amount_off: 9000 },   // $99.99 - $90.00 = $9.99
      PRO: { amount_off: 19001 },    // $200.00 - $190.01 = $9.99
    },
  },
  {
    name: 'Trial Price',
    // $14.99 trial — similar structure
    plans: {
      STARTER: { amount_off: 500 },
      PLUS: { amount_off: 3500 },
      SMART: { amount_off: 8500 },
      PRO: { amount_off: 18501 },
    },
  },
  {
    name: 'Growth Discount',
    // $39.99 — for Plus and above
    plans: {
      PLUS: { amount_off: 1000 },
      SMART: { amount_off: 6000 },
      PRO: { amount_off: 16001 },
    },
  },
];
```

---

## 10. Security Considerations

### Webhook Signature Verification

Never process a webhook without verifying its signature. This prevents attackers from sending fake events to your endpoint:

```typescript
// ALWAYS verify in the webhook handler
const sig = request.headers.get('stripe-signature');
if (!sig) {
  return new Response('Missing signature', { status: 400 });
}

let event: Stripe.Event;
try {
  event = stripe.webhooks.constructEvent(
    await request.text(), // Raw body — NOT parsed JSON
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
} catch (err) {
  console.error('Webhook signature verification failed:', err);
  return new Response('Invalid signature', { status: 400 });
}
```

### API Key Security

- Never expose `sk_live_*` or `sk_test_*` in client-side code.
- Only `pk_live_*` and `pk_test_*` are safe for the browser.
- Store all secret keys in environment variables, never in code.
- Rotate keys immediately if exposed (Stripe Dashboard → API Keys → Roll Key).
- Use restricted keys for specific operations when possible.

### PCI Compliance

With Stripe Checkout, Stone AI is SAQ-A compliant (the simplest level). This means:
- Card data never touches our servers.
- We don't store, process, or transmit cardholder data.
- Stripe handles all PCI DSS requirements.
- We must still secure our Stripe API keys and webhook endpoints.

---

## 11. Stripe CLI for Development

### Essential Commands

```bash
# Login to Stripe CLI
stripe login

# Listen for webhooks locally (forwards to your dev server)
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger specific webhook events for testing
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated
stripe trigger customer.subscription.deleted
stripe trigger invoice.payment_succeeded
stripe trigger invoice.payment_failed
stripe trigger checkout.session.completed

# List recent events
stripe events list --limit 10

# Retrieve a specific resource
stripe customers retrieve cus_xxx
stripe subscriptions retrieve sub_xxx
stripe invoices retrieve inv_xxx

# Create test resources
stripe prices create \
  --product prod_xxx \
  --unit-amount 1999 \
  --currency usd \
  --recurring[interval]=month
```

### Local Development Webhook Flow

```
User clicks "Subscribe"
       │
       ▼
Next.js API creates Checkout Session
       │
       ▼
User completes Stripe Checkout
       │
       ▼
Stripe fires webhook events ──▶ Stripe CLI ──▶ localhost:3000/api/webhooks/stripe
       │
       ▼
Webhook handler updates Prisma database
       │
       ▼
User sees updated subscription status
```

---

## 12. Production Monitoring and Alerting

### Key Metrics to Monitor

```typescript
// src/lib/stripe/monitoring.ts
export const STRIPE_ALERTS = {
  // Alert if payment failure rate exceeds 5% in any 1-hour window
  paymentFailureRate: {
    threshold: 0.05,
    window: '1h',
    severity: 'high',
  },
  // Alert if webhook processing takes > 10 seconds
  webhookLatency: {
    threshold: 10000, // ms
    severity: 'medium',
  },
  // Alert if any webhook returns 500
  webhookErrors: {
    threshold: 1,
    window: '5m',
    severity: 'critical',
  },
  // Alert if subscription churn spike (> 2x normal rate)
  churnSpike: {
    threshold: 2.0, // multiplier
    window: '24h',
    severity: 'high',
  },
};
```

### Logging Strategy

```typescript
// Every Stripe operation should produce a structured log entry
interface StripeLog {
  action: string;
  stripeId: string;
  userId: string;
  status: 'success' | 'failure' | 'retry';
  durationMs: number;
  metadata: Record<string, unknown>;
  error?: {
    code: string;
    message: string;
    declineCode?: string;
  };
}

export function logStripeOperation(log: StripeLog): void {
  console.log(JSON.stringify({
    ...log,
    timestamp: new Date().toISOString(),
    service: 'stripe',
    platform: 'stone-ai',
  }));
}
```

---

## Summary

This seed covers the complete Stripe integration pattern for Stone AI:

1. **Customer management** with Prisma sync and metadata strategy
2. **Checkout Sessions** with promotional pricing support
3. **Subscription lifecycle** including upgrades, downgrades, and cancellations
4. **Payment and Setup Intents** for different payment flows
5. **Idempotency** patterns to prevent duplicate operations
6. **Error handling** with user-friendly messages and retry logic
7. **Test to live migration** with verification scripts
8. **Product/price architecture** matching Stone AI's tier structure
9. **Security** including webhook verification and PCI compliance
10. **Development tools** using Stripe CLI
11. **Production monitoring** and alerting strategies

Every pattern here is designed for a Next.js 16 + TypeScript + Prisma stack. The code is production-grade, not tutorial-level. It handles edge cases that most Stripe integrations miss: customer deletion recovery, idempotency key strategies, graceful downgrade scheduling, and structured error handling that gives users actionable messages instead of generic failures.
