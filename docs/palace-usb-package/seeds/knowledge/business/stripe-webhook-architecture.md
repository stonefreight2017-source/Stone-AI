# Stripe Webhook Architecture — Stone AI Palace Knowledge Seed

## Seed Classification
- **Domain**: Revenue Operations / Payment Infrastructure
- **Complexity**: Advanced
- **Stack**: Next.js 16, TypeScript, Stripe Webhooks, Prisma 7.4
- **Applies To**: Stone AI, Best AI, Stone AI Tools

---

## 1. Why Webhooks Are the Backbone of Billing

Stripe webhooks are the nervous system of your billing integration. Every state change — subscription created, payment succeeded, payment failed, card updated, dispute opened — flows through webhooks. If your webhook handler fails, your entire billing system fails.

The critical insight: **Your webhook handler IS your billing system.** The checkout flow and portal are just triggers. The webhook handler is where billing state actually changes.

### What Happens Without Proper Webhooks

- User subscribes → webhook fails → user charged but database says FREE → support ticket
- Payment fails → webhook fails → user not notified → involuntary churn
- User cancels via Stripe Portal → webhook fails → user still has access → revenue leak
- Dispute opened → webhook fails → evidence deadline passes → money lost

---

## 2. Essential Webhook Events for Subscriptions

### Events Stone AI Must Handle

```typescript
// src/lib/stripe/webhook-events.ts

/**
 * Critical events — failures in these handlers directly impact revenue
 */
export const CRITICAL_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'invoice.paid',
  'charge.dispute.created',
] as const;

/**
 * Important events — affect user experience and reporting
 */
export const IMPORTANT_EVENTS = [
  'customer.subscription.trial_will_end',
  'customer.subscription.paused',
  'customer.subscription.resumed',
  'invoice.upcoming',
  'invoice.finalized',
  'customer.updated',
  'payment_method.attached',
  'payment_method.detached',
  'payment_method.updated',
  'charge.dispute.closed',
  'charge.refunded',
] as const;

/**
 * Informational events — useful for analytics and debugging
 */
export const INFORMATIONAL_EVENTS = [
  'customer.created',
  'customer.deleted',
  'invoice.created',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'setup_intent.succeeded',
  'charge.succeeded',
  'charge.failed',
  'customer.tax_id.created',
  'customer.tax_id.updated',
] as const;

export const ALL_EVENTS = [
  ...CRITICAL_EVENTS,
  ...IMPORTANT_EVENTS,
  ...INFORMATIONAL_EVENTS,
] as const;
```

### Event Flow Diagrams

#### New Subscription Flow
```
User completes Stripe Checkout
       │
       ▼
checkout.session.completed
       │
       ▼
customer.subscription.created (status: active or trialing)
       │
       ▼
invoice.created (first invoice)
       │
       ▼
invoice.finalized
       │
       ▼
invoice.paid / invoice.payment_succeeded
       │
       ▼
charge.succeeded
```

#### Payment Failure Flow
```
Billing cycle → Invoice generated
       │
       ▼
invoice.created
       │
       ▼
invoice.payment_failed (first attempt)
       │
       ▼
customer.subscription.updated (status: past_due)
       │
       ├── Smart Retry succeeds ──▶ invoice.payment_succeeded
       │                                    │
       │                                    ▼
       │                           customer.subscription.updated (status: active)
       │
       └── All retries fail ──▶ customer.subscription.deleted (or updated to unpaid)
```

#### Cancellation Flow
```
User clicks "Cancel"
       │
       ▼
customer.subscription.updated (cancel_at_period_end: true)
       │
       ▼  (time passes until period end)
       │
customer.subscription.deleted (status: canceled)
```

---

## 3. Webhook Handler Implementation

### The Main Handler

```typescript
// src/app/api/webhooks/stripe/route.ts
import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { handleCheckoutCompleted } from './handlers/checkout';
import { handleSubscriptionEvent } from './handlers/subscription';
import { handleInvoiceEvent } from './handlers/invoice';
import { handleDisputeEvent } from './handlers/dispute';
import { handlePaymentMethodEvent } from './handlers/payment-method';
import { prisma } from '@/lib/prisma';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  let event: Stripe.Event;

  // Step 1: Verify webhook signature
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    console.error('Webhook: Missing stripe-signature header');
    return new Response('Missing signature', { status: 400 });
  }

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Invalid signature', { status: 400 });
  }

  // Step 2: Idempotency check — don't process the same event twice
  const existingEvent = await prisma.processedWebhookEvent.findUnique({
    where: { stripeEventId: event.id },
  });

  if (existingEvent) {
    console.log(`Webhook: Event ${event.id} already processed, returning 200`);
    return new Response('Already processed', { status: 200 });
  }

  // Step 3: Route to appropriate handler
  try {
    console.log(`Webhook: Processing ${event.type} (${event.id})`);

    switch (event.type) {
      // Checkout
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      // Subscription events
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
      case 'customer.subscription.paused':
      case 'customer.subscription.resumed':
      case 'customer.subscription.trial_will_end':
      case 'customer.subscription.pending_update_applied':
      case 'customer.subscription.pending_update_expired':
        await handleSubscriptionEvent(event.type, event.data.object as Stripe.Subscription);
        break;

      // Invoice events
      case 'invoice.payment_succeeded':
      case 'invoice.payment_failed':
      case 'invoice.paid':
      case 'invoice.upcoming':
      case 'invoice.finalized':
        await handleInvoiceEvent(event.type, event.data.object as Stripe.Invoice);
        break;

      // Dispute events
      case 'charge.dispute.created':
      case 'charge.dispute.closed':
        await handleDisputeEvent(event.type, event.data.object as Stripe.Dispute);
        break;

      // Payment method events
      case 'payment_method.attached':
      case 'payment_method.detached':
      case 'payment_method.updated':
        await handlePaymentMethodEvent(event.type, event.data.object as Stripe.PaymentMethod);
        break;

      // Refund
      case 'charge.refunded':
        await handleRefund(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`Webhook: Unhandled event type ${event.type}`);
    }

    // Step 4: Record successful processing
    const duration = Date.now() - startTime;
    await prisma.processedWebhookEvent.create({
      data: {
        stripeEventId: event.id,
        eventType: event.type,
        processedAt: new Date(),
        durationMs: duration,
        success: true,
      },
    });

    console.log(`Webhook: ${event.type} processed in ${duration}ms`);
    return new Response('OK', { status: 200 });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Webhook: Failed to process ${event.type}:`, error);

    // Record the failure
    await prisma.processedWebhookEvent.create({
      data: {
        stripeEventId: event.id,
        eventType: event.type,
        processedAt: new Date(),
        durationMs: duration,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });

    // IMPORTANT: Return 200 even on error to prevent Stripe from retrying
    // unless you WANT retries (in which case return 500)
    // For idempotent handlers, 500 is safer — Stripe will retry
    return new Response('Processing error', { status: 500 });
  }
}

// Disable body parsing — we need the raw body for signature verification
export const config = {
  api: { bodyParser: false },
};
```

### Subscription Event Handler

```typescript
// src/app/api/webhooks/stripe/handlers/subscription.ts
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { PlanTier, SubscriptionStatus } from '@prisma/client';

export async function handleSubscriptionEvent(
  eventType: string,
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    // Try to find user by Stripe customer ID
    const customerId = typeof subscription.customer === 'string'
      ? subscription.customer
      : subscription.customer.id;

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    });

    if (!user) {
      console.error(
        `Webhook: No user found for subscription ${subscription.id} ` +
        `(customer: ${customerId})`
      );
      return;
    }

    // Process with found user ID
    await processSubscriptionEvent(eventType, subscription, user.id);
    return;
  }

  await processSubscriptionEvent(eventType, subscription, userId);
}

async function processSubscriptionEvent(
  eventType: string,
  subscription: Stripe.Subscription,
  userId: string
): Promise<void> {
  switch (eventType) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(subscription, userId);
      break;

    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(subscription, userId);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(subscription, userId);
      break;

    case 'customer.subscription.trial_will_end':
      await handleTrialWillEnd(subscription, userId);
      break;

    case 'customer.subscription.paused':
      await handleSubscriptionPaused(subscription, userId);
      break;

    case 'customer.subscription.resumed':
      await handleSubscriptionResumed(subscription, userId);
      break;

    case 'customer.subscription.pending_update_applied':
      await handlePendingUpdateApplied(subscription, userId);
      break;
  }
}

async function handleSubscriptionCreated(
  subscription: Stripe.Subscription,
  userId: string
): Promise<void> {
  const plan = mapPriceIdToPlan(subscription.items.data[0]?.price?.id);
  const period = mapPriceIdToPeriod(subscription.items.data[0]?.price?.id);
  const status = mapStripeStatus(subscription.status);

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionId: subscription.id,
      subscriptionStatus: status,
      currentPlan: plan,
      billingPeriod: period,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialEndsAt: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });

  console.log(`Subscription created: ${subscription.id} for user ${userId} (${plan}/${period})`);
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  userId: string
): Promise<void> {
  const plan = mapPriceIdToPlan(subscription.items.data[0]?.price?.id);
  const period = mapPriceIdToPeriod(subscription.items.data[0]?.price?.id);
  const status = mapStripeStatus(subscription.status);

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { currentPlan: true, subscriptionStatus: true },
  });

  // Detect plan changes
  if (user.currentPlan !== plan) {
    await prisma.planChangeLog.create({
      data: {
        userId,
        fromPlan: user.currentPlan,
        toPlan: plan,
        fromPeriod: period,
        toPeriod: period,
        type: isPlanHigher(plan, user.currentPlan) ? 'UPGRADE' : 'DOWNGRADE',
      },
    });
  }

  // Detect status changes
  if (user.subscriptionStatus !== status) {
    await handleStatusTransition(userId, user.subscriptionStatus, status, subscription);
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: status,
      currentPlan: plan,
      billingPeriod: period,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      trialEndsAt: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  userId: string
): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { currentPlan: true },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionId: null,
      subscriptionStatus: 'CANCELED',
      cancelAtPeriodEnd: false,
      trialEndsAt: null,
    },
  });

  // Log the cancellation
  await prisma.planChangeLog.create({
    data: {
      userId,
      fromPlan: user.currentPlan,
      toPlan: 'FREE',
      type: 'CANCELLATION',
    },
  });

  // Handle feature downgrade (lock agents, deactivate bestie, etc.)
  await handleDowngradeEffective(userId, 'FREE');

  // Send cancellation confirmation
  await sendEmail(userId, 'SUBSCRIPTION_CANCELED', {
    previousPlan: user.currentPlan,
    dataRetentionDays: 90,
    resubscribeUrl: `${APP_URL}/billing`,
  });
}

async function handleTrialWillEnd(
  subscription: Stripe.Subscription,
  userId: string
): Promise<void> {
  // Sent 3 days before trial ends
  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : null;

  await sendEmail(userId, 'TRIAL_ENDING_SOON', {
    trialEnd,
    plan: subscription.metadata?.plan,
    updatePaymentUrl: `${APP_URL}/billing/update-payment`,
  });
}

async function handleSubscriptionPaused(
  subscription: Stripe.Subscription,
  userId: string
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'PAUSED',
      pausedUntil: subscription.pause_collection?.resumes_at
        ? new Date(subscription.pause_collection.resumes_at * 1000)
        : null,
    },
  });
}

async function handleSubscriptionResumed(
  subscription: Stripe.Subscription,
  userId: string
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'ACTIVE',
      pausedUntil: null,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });
}

async function handlePendingUpdateApplied(
  subscription: Stripe.Subscription,
  userId: string
): Promise<void> {
  // A scheduled plan change (e.g., downgrade at period end) has been applied
  const newPlan = mapPriceIdToPlan(subscription.items.data[0]?.price?.id);
  const newPeriod = mapPriceIdToPeriod(subscription.items.data[0]?.price?.id);

  await prisma.user.update({
    where: { id: userId },
    data: {
      currentPlan: newPlan,
      billingPeriod: newPeriod,
      pendingDowngrade: null,
      pendingDowngradeDate: null,
      pendingPeriodChange: null,
      pendingPeriodChangeDate: null,
    },
  });

  // If this was a downgrade, handle feature gating
  await handleDowngradeEffective(userId, newPlan);
}

// Helper: Map Stripe status to our status enum
function mapStripeStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  const mapping: Record<string, SubscriptionStatus> = {
    'active': 'ACTIVE',
    'trialing': 'TRIALING',
    'past_due': 'PAST_DUE',
    'canceled': 'CANCELED',
    'unpaid': 'UNPAID',
    'incomplete': 'INCOMPLETE',
    'incomplete_expired': 'INCOMPLETE_EXPIRED',
    'paused': 'PAUSED',
  };
  return mapping[status] ?? 'FREE';
}

// Helper: Handle status transitions (trigger emails, dunning, etc.)
async function handleStatusTransition(
  userId: string,
  fromStatus: SubscriptionStatus,
  toStatus: SubscriptionStatus,
  subscription: Stripe.Subscription
): Promise<void> {
  // Trialing → Active: Trial converted
  if (fromStatus === 'TRIALING' && toStatus === 'ACTIVE') {
    await handleTrialConversion(subscription);
  }

  // Active → Past Due: Payment failed, start dunning
  if (fromStatus === 'ACTIVE' && toStatus === 'PAST_DUE') {
    await initiateDunningSequence(userId, subscription.latest_invoice as string, 'payment_failed');
  }

  // Past Due → Active: Payment recovered
  if (fromStatus === 'PAST_DUE' && toStatus === 'ACTIVE') {
    await handlePaymentRecovered(userId, subscription.latest_invoice as string);
  }
}
```

### Invoice Event Handler

```typescript
// src/app/api/webhooks/stripe/handlers/invoice.ts
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';

export async function handleInvoiceEvent(
  eventType: string,
  invoice: Stripe.Invoice
): Promise<void> {
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;

  if (!customerId) return;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error(`Webhook: No user for customer ${customerId} (invoice ${invoice.id})`);
    return;
  }

  switch (eventType) {
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(invoice, user.id);
      break;

    case 'invoice.payment_failed':
      await handlePaymentFailed(invoice, user.id);
      break;

    case 'invoice.upcoming':
      await handleUpcomingInvoice(invoice, user.id);
      break;

    case 'invoice.finalized':
      // Invoice finalized and ready for payment
      await prisma.invoiceLog.create({
        data: {
          userId: user.id,
          stripeInvoiceId: invoice.id,
          amount: invoice.amount_due,
          status: 'FINALIZED',
        },
      });
      break;

    case 'invoice.paid':
      // Confirm payment received (may fire alongside payment_succeeded)
      await prisma.invoiceLog.upsert({
        where: { stripeInvoiceId: invoice.id },
        create: {
          userId: user.id,
          stripeInvoiceId: invoice.id,
          amount: invoice.amount_paid,
          status: 'PAID',
          paidAt: new Date(),
        },
        update: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });
      break;
  }
}

async function handlePaymentSucceeded(
  invoice: Stripe.Invoice,
  userId: string
): Promise<void> {
  // Update billing period
  await prisma.user.update({
    where: { id: userId },
    data: {
      currentPeriodEnd: new Date(invoice.period_end * 1000),
      subscriptionStatus: 'ACTIVE',
    },
  });

  // Record the payment event for analytics
  await prisma.paymentEvent.create({
    data: {
      userId,
      type: 'PAYMENT_SUCCEEDED',
      invoiceId: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
    },
  });

  // If this resolves an active dunning sequence
  const activeDunning = await prisma.dunningSequence.findFirst({
    where: { userId, status: 'ACTIVE' },
  });

  if (activeDunning) {
    await handlePaymentRecovered(userId, invoice.id);
  }

  // Send receipt
  // (Stripe can send receipts automatically; only send custom receipt if needed)
}

async function handlePaymentFailed(
  invoice: Stripe.Invoice,
  userId: string
): Promise<void> {
  const attemptCount = invoice.attempt_count;
  const nextAttempt = invoice.next_payment_attempt
    ? new Date(invoice.next_payment_attempt * 1000)
    : null;

  // Get decline reason
  let declineCode = 'unknown';
  if (invoice.charge) {
    const chargeId = typeof invoice.charge === 'string' ? invoice.charge : invoice.charge.id;
    try {
      const charge = await stripe.charges.retrieve(chargeId);
      declineCode = charge.failure_code ?? charge.outcome?.reason ?? 'unknown';
    } catch {
      // Charge might not exist yet
    }
  }

  // Record payment failure
  await prisma.paymentEvent.create({
    data: {
      userId,
      type: 'PAYMENT_FAILED',
      invoiceId: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      declineCode,
      attemptCount,
      nextRetryAt: nextAttempt,
    },
  });

  // Start or escalate dunning
  if (attemptCount <= 1) {
    await initiateDunningSequence(userId, invoice.id, declineCode);
  } else {
    await escalateDunning(userId, attemptCount, declineCode);
  }

  // Update user status if not already past_due
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'PAST_DUE',
    },
  });
}

async function handleUpcomingInvoice(
  invoice: Stripe.Invoice,
  userId: string
): Promise<void> {
  // Sent ~3 days before the next charge
  // Use this to warn users about upcoming charges
  await sendEmail(userId, 'UPCOMING_CHARGE', {
    amount: invoice.amount_due / 100,
    date: new Date((invoice.next_payment_attempt ?? invoice.period_end) * 1000),
  });
}
```

---

## 4. Webhook Signature Verification Deep Dive

```typescript
// CRITICAL: Why raw body matters

// Stripe signs the RAW request body. If your framework parses the body
// as JSON before you can verify the signature, the signature check fails
// because JSON.parse + JSON.stringify changes whitespace/formatting.

// In Next.js App Router, use req.text() to get the raw body:
const rawBody = await req.text();
// NOT await req.json()

// Then verify:
const event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);

// Common pitfalls:
// 1. Middleware that parses body before the handler
// 2. Using req.json() instead of req.text()
// 3. Having a body parser middleware in the chain
// 4. Using the wrong webhook secret (test vs live)
// 5. Using the account webhook secret instead of connect webhook secret
```

---

## 5. Idempotent Event Processing

### Why Idempotency Matters for Webhooks

Stripe guarantees at-least-once delivery. This means you WILL receive duplicate events. Without idempotent processing, duplicates cause double credits, double emails, and data corruption.

```typescript
// src/lib/stripe/webhook-idempotency.ts

export async function processEventIdempotently<T>(
  eventId: string,
  eventType: string,
  resourceId: string,
  processor: () => Promise<T>
): Promise<T | null> {
  // Check if already processed
  const existing = await prisma.processedWebhookEvent.findUnique({
    where: { stripeEventId: eventId },
  });

  if (existing) {
    console.log(`Event ${eventId} already processed at ${existing.processedAt}`);
    return null;
  }

  // Use a transaction to prevent race conditions between
  // two webhook deliveries of the same event
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Double-check inside transaction
      const doubleCheck = await tx.processedWebhookEvent.findUnique({
        where: { stripeEventId: eventId },
      });

      if (doubleCheck) return null;

      // Mark as processing
      await tx.processedWebhookEvent.create({
        data: {
          stripeEventId: eventId,
          eventType,
          resourceId,
          processedAt: new Date(),
          success: false, // Will update to true on completion
        },
      });

      return 'proceed' as const;
    });

    if (result === null) return null;

    // Process outside the transaction (may involve external calls)
    const processorResult = await processor();

    // Mark as successfully processed
    await prisma.processedWebhookEvent.update({
      where: { stripeEventId: eventId },
      data: { success: true },
    });

    return processorResult;
  } catch (error) {
    // Mark as failed
    await prisma.processedWebhookEvent.update({
      where: { stripeEventId: eventId },
      data: {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
    });
    throw error;
  }
}
```

---

## 6. Event Ordering and Stale Event Prevention

### The Ordering Problem

Stripe doesn't guarantee event ordering. You might receive `customer.subscription.updated` before `customer.subscription.created`. You might receive an older event after a newer one.

```typescript
// src/lib/stripe/event-ordering.ts

export async function shouldProcessEvent(
  resourceType: string,
  resourceId: string,
  eventTimestamp: number
): Promise<boolean> {
  // Check if we've already processed a newer event for this resource
  const latestEvent = await prisma.processedWebhookEvent.findFirst({
    where: {
      resourceId,
      eventType: { startsWith: resourceType },
      success: true,
    },
    orderBy: { stripeTimestamp: 'desc' },
  });

  if (latestEvent && latestEvent.stripeTimestamp > eventTimestamp) {
    console.log(
      `Skipping stale event for ${resourceId}: ` +
      `event timestamp ${eventTimestamp} is older than ` +
      `processed event ${latestEvent.stripeEventId} at ${latestEvent.stripeTimestamp}`
    );
    return false;
  }

  return true;
}
```

---

## 7. Testing Webhooks with Stripe CLI

### Local Development Setup

```bash
# Install Stripe CLI
# Windows (via scoop):
scoop install stripe

# Login to your Stripe account
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# The CLI will display a webhook signing secret (whsec_...)
# Use this in your .env.local:
# STRIPE_WEBHOOK_SECRET=whsec_...

# Trigger specific events for testing
stripe trigger checkout.session.completed
stripe trigger customer.subscription.created
stripe trigger customer.subscription.updated --add subscription:status=past_due
stripe trigger invoice.payment_failed
stripe trigger invoice.payment_succeeded
stripe trigger customer.subscription.deleted
stripe trigger charge.dispute.created

# Replay recent events
stripe events resend evt_xxx

# List recent events
stripe events list --limit 5
```

### Automated Webhook Tests

```typescript
// src/__tests__/webhooks/stripe-webhooks.test.ts
import { POST } from '@/app/api/webhooks/stripe/route';
import Stripe from 'stripe';

// Create a test helper that generates signed webhook payloads
function createWebhookPayload(
  type: string,
  data: Record<string, any>
): { body: string; signature: string } {
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = JSON.stringify({
    id: `evt_test_${Date.now()}`,
    type,
    created: timestamp,
    data: { object: data },
  });

  // Generate test signature
  const crypto = require('crypto');
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET!)
    .update(signedPayload)
    .digest('hex');

  return {
    body: payload,
    signature: `t=${timestamp},v1=${signature}`,
  };
}

describe('Stripe Webhook Handler', () => {
  it('should handle checkout.session.completed', async () => {
    const { body, signature } = createWebhookPayload(
      'checkout.session.completed',
      {
        id: 'cs_test_123',
        subscription: 'sub_test_123',
        customer: 'cus_test_123',
        metadata: {
          userId: 'test_user_id',
          plan: 'SMART',
          period: 'monthly',
        },
      }
    );

    const req = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body,
      headers: {
        'stripe-signature': signature,
        'content-type': 'application/json',
      },
    });

    const response = await POST(req as any);
    expect(response.status).toBe(200);
  });

  it('should reject invalid signatures', async () => {
    const req = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: '{}',
      headers: {
        'stripe-signature': 'invalid_signature',
        'content-type': 'application/json',
      },
    });

    const response = await POST(req as any);
    expect(response.status).toBe(400);
  });

  it('should handle duplicate events idempotently', async () => {
    const { body, signature } = createWebhookPayload(
      'invoice.payment_succeeded',
      {
        id: 'inv_test_duplicate',
        customer: 'cus_test_123',
        amount_paid: 9999,
        period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
      }
    );

    // Process same event twice
    const req1 = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body,
      headers: { 'stripe-signature': signature },
    });

    const req2 = new Request('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body,
      headers: { 'stripe-signature': signature },
    });

    const [res1, res2] = await Promise.all([
      POST(req1 as any),
      POST(req2 as any),
    ]);

    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);

    // Verify the payment was only recorded once
    // (check database for single entry)
  });
});
```

---

## 8. Production Webhook Patterns

### Monitoring and Alerting

```typescript
// src/lib/stripe/webhook-monitoring.ts

export async function checkWebhookHealth(): Promise<{
  healthy: boolean;
  lastEventAt: Date | null;
  failureRate: number;
  avgProcessingMs: number;
  backlog: number;
}> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const recentEvents = await prisma.processedWebhookEvent.findMany({
    where: { processedAt: { gte: oneHourAgo } },
    select: { success: true, durationMs: true, processedAt: true },
  });

  const total = recentEvents.length;
  const failures = recentEvents.filter(e => !e.success).length;
  const avgDuration = total > 0
    ? recentEvents.reduce((sum, e) => sum + (e.durationMs ?? 0), 0) / total
    : 0;
  const lastEvent = recentEvents.length > 0
    ? recentEvents.reduce((latest, e) =>
        e.processedAt > latest.processedAt ? e : latest
      ).processedAt
    : null;

  const failureRate = total > 0 ? failures / total : 0;

  return {
    healthy: failureRate < 0.05 && avgDuration < 10000,
    lastEventAt: lastEvent,
    failureRate,
    avgProcessingMs: Math.round(avgDuration),
    backlog: 0, // Would need to compare with Stripe's event count
  };
}

// Alert if webhook health degrades
export async function webhookHealthCheck(): Promise<void> {
  const health = await checkWebhookHealth();

  if (!health.healthy) {
    await sendFounderAlert({
      alertType: 'system.webhook_unhealthy',
      title: '[ALERT] Stripe Webhook Health Degraded',
      body: `
        Failure rate: ${(health.failureRate * 100).toFixed(1)}%
        Avg processing: ${health.avgProcessingMs}ms
        Last event: ${health.lastEventAt?.toISOString() ?? 'None'}
      `,
    });
  }

  // No events in 6 hours during business hours = something is wrong
  if (!health.lastEventAt || health.lastEventAt < new Date(Date.now() - 6 * 60 * 60 * 1000)) {
    const hour = new Date().getUTCHours();
    if (hour >= 12 && hour <= 4) { // Roughly US business hours
      await sendFounderAlert({
        alertType: 'system.webhook_silent',
        title: '[ALERT] No Stripe Webhooks Received in 6 Hours',
        body: 'Check Stripe Dashboard > Developers > Webhooks for delivery issues.',
      });
    }
  }
}
```

### Dead Letter Queue for Failed Events

```typescript
// If a webhook handler fails after all retries, the event goes to a dead letter queue

export async function processDeadLetterQueue(): Promise<void> {
  const failedEvents = await prisma.processedWebhookEvent.findMany({
    where: {
      success: false,
      retryCount: { lt: 3 },
      processedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    orderBy: { processedAt: 'asc' },
    take: 10,
  });

  for (const failed of failedEvents) {
    try {
      // Re-fetch the event from Stripe
      const event = await stripe.events.retrieve(failed.stripeEventId);

      // Re-process
      await processWebhookEvent(event);

      // Mark as recovered
      await prisma.processedWebhookEvent.update({
        where: { id: failed.id },
        data: { success: true, recoveredAt: new Date() },
      });

      console.log(`DLQ: Recovered event ${failed.stripeEventId}`);
    } catch (error) {
      await prisma.processedWebhookEvent.update({
        where: { id: failed.id },
        data: {
          retryCount: { increment: 1 },
          lastRetryAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }
}
```

---

## 9. Webhook Security

### Beyond Signature Verification

```typescript
// Additional security measures for the webhook endpoint:

// 1. IP allowlisting (optional, Stripe publishes their IP ranges)
// https://stripe.com/docs/ips

// 2. Rate limiting the webhook endpoint
// Prevents abuse if someone discovers the URL
export const WEBHOOK_RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // Stripe typically sends < 50 per minute
};

// 3. Timeout protection
// If handler takes > 30 seconds, return 200 and process async
const WEBHOOK_TIMEOUT_MS = 25000; // 25 seconds (Vercel has 30s limit)

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new Error(`Webhook processing timed out after ${timeoutMs}ms`)),
      timeoutMs
    );
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

// 4. Never expose webhook URL in client-side code
// The URL should only be configured in Stripe Dashboard and env vars
```

---

## Summary

Stripe webhook architecture for Stone AI encompasses:

1. **Event classification** — Critical, important, and informational events with different handling priorities
2. **Main handler** with signature verification, idempotency, and error recovery
3. **Subscription handlers** for all lifecycle events (created, updated, deleted, paused, resumed, trial ending)
4. **Invoice handlers** for payment success, failure, and upcoming charge notifications
5. **Idempotent processing** using database locks to prevent duplicate processing
6. **Event ordering** protection against stale events
7. **Stripe CLI testing** with automated test helpers for webhook payloads
8. **Production monitoring** with health checks and dead letter queue
9. **Security** beyond signature verification — rate limiting, timeouts, IP awareness

The webhook handler is the single most critical piece of the billing infrastructure. Every dollar of revenue flows through it. It must be reliable, idempotent, observable, and recoverable.
