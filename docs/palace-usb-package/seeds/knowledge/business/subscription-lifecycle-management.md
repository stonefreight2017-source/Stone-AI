# Subscription Lifecycle Management — Stone AI Palace Knowledge Seed

## Seed Classification
- **Domain**: Revenue Operations / Subscription Management
- **Complexity**: Advanced
- **Stack**: Next.js 16, TypeScript, Stripe Billing, Prisma 7.4
- **Applies To**: Stone AI (primary), Best AI, Stone AI Tools

---

## 1. The Subscription Lifecycle — Complete Map

Every subscription in Stone AI follows a lifecycle that begins the moment a user shows purchase intent and ends either when they cancel or when the business ceases to exist. Understanding every state, transition, and edge case in this lifecycle is what separates a billing system that "mostly works" from one that never leaks revenue.

### The Full State Machine

```
                                    USER SIGNS UP (FREE)
                                          │
                                          ▼
                              ┌──────────────────────┐
                              │    FREE TIER (no sub) │
                              └──────────┬───────────┘
                                         │
                          ┌──────────────┤ User clicks "Subscribe"
                          │              │
                   ┌──────▼──────┐  ┌────▼───────────┐
                   │   TRIALING  │  │   INCOMPLETE    │
                   │ (with trial)│  │ (payment issue) │
                   └──────┬──────┘  └────┬───────────┘
                          │              │
                  Trial ends,     Payment succeeds
                  payment OK             │
                          │              │
                          ▼              ▼
                   ┌─────────────────────────┐
                   │         ACTIVE          │◄──── Reactivation
                   └────────┬───────┬────────┘      (from past_due)
                            │       │
                Payment fails│       │ User cancels
                            │       │
                   ┌────────▼──┐  ┌─▼──────────────┐
                   │ PAST_DUE  │  │ CANCEL PENDING  │
                   │           │  │ (cancel_at_      │
                   │           │  │  period_end=true)│
                   └─────┬─────┘  └───────┬─────────┘
                         │                │
              Retries    │         Period ends
              exhausted  │                │
                         │                │
                   ┌─────▼──┐     ┌───────▼──────┐
                   │ UNPAID  │    │   CANCELED    │
                   └─────┬───┘    └──────┬────────┘
                         │               │
                         │        ┌──────▼────────┐
                         └───────▶│  WIN-BACK     │
                                  │  (resubscribe)│
                                  └───────────────┘
```

### State Definitions with Business Rules

| State | Stripe Status | User Access | Agent Limit | Bestie Access | Duration |
|-------|--------------|-------------|-------------|---------------|----------|
| FREE | No subscription | Basic | 4 agents | No | Unlimited |
| TRIALING | `trialing` | Full tier | Per tier | Yes | 7 or 14 days |
| INCOMPLETE | `incomplete` | None | 4 (FREE) | No | 23 hours |
| ACTIVE | `active` | Full tier | Per tier | Yes | Until next billing |
| PAST_DUE | `past_due` | Grace period | Per tier | Yes (3 days) | Up to 7 days |
| UNPAID | `unpaid` | None | 4 (FREE) | No | Until resubscribe |
| CANCEL_PENDING | `active` + `cancel_at_period_end` | Full tier | Per tier | Yes | Until period end |
| CANCELED | `canceled` | None | 4 (FREE) | No | Until resubscribe |
| PAUSED | `paused` | None | 4 (FREE) | No | Up to 90 days |

---

## 2. Trial Management

### Trial Design Decisions

Stone AI's trial strategy is designed around one principle: **remove every barrier to the "aha moment."** The aha moment for Stone AI is when a user has a meaningful conversation with a specialized agent that solves a real problem. Everything about the trial is optimized to get users to that point.

#### Trial Parameters

```typescript
// src/lib/billing/trial-config.ts
export const TRIAL_CONFIG = {
  // Default trial length by plan
  trialDays: {
    STARTER: 7,
    PLUS: 7,
    SMART: 14,  // Longer trial for higher-value plan
    PRO: 14,
  },

  // Whether payment method is required upfront
  requirePaymentMethod: true,

  // Grace period after trial ends before downgrade
  gracePeriodHours: 24,

  // Number of agents available during trial (full tier access)
  agentAccess: 'full_tier',

  // Bestie available during trial
  bestieAccess: true,

  // Maximum number of messages during trial
  messageLimit: null, // Unlimited — we want the aha moment

  // Trial extension rules
  extensions: {
    maxExtensions: 1,
    extensionDays: 7,
    requireReason: true,
    autoApprove: false, // Manual approval by founder
  },
};
```

### Starting a Trial

```typescript
// src/lib/billing/trials.ts
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe/client';
import { TRIAL_CONFIG } from './trial-config';
import { getOrCreateStripeCustomer } from '@/lib/stripe/customers';

export async function startTrial(
  userId: string,
  plan: 'STARTER' | 'PLUS' | 'SMART' | 'PRO',
  paymentMethodId: string
): Promise<{ subscription: Stripe.Subscription; trialEnd: Date }> {
  const customerId = await getOrCreateStripeCustomer(userId);

  // Check if user has had a trial before
  const previousTrials = await prisma.trialHistory.findMany({
    where: { userId },
  });

  if (previousTrials.length > 0) {
    throw new TrialError(
      'TRIAL_ALREADY_USED',
      'You have already used a free trial. Please subscribe directly.'
    );
  }

  // Attach payment method to customer
  await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });

  const trialDays = TRIAL_CONFIG.trialDays[plan];
  const priceId = getPriceIdForPlan(plan, 'monthly');

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    trial_period_days: trialDays,
    trial_settings: {
      end_behavior: {
        missing_payment_method: 'cancel',
      },
    },
    payment_settings: {
      save_default_payment_method: 'on_subscription',
    },
    metadata: {
      userId,
      plan,
      trialStart: new Date().toISOString(),
      platform: 'stone-ai',
    },
  });

  const trialEnd = new Date(subscription.trial_end! * 1000);

  // Record trial in history (prevents re-trials)
  await prisma.trialHistory.create({
    data: {
      userId,
      plan,
      startedAt: new Date(),
      endsAt: trialEnd,
      stripeSubscriptionId: subscription.id,
    },
  });

  // Update user record
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionId: subscription.id,
      subscriptionStatus: 'TRIALING',
      currentPlan: plan,
      trialEndsAt: trialEnd,
      currentPeriodEnd: trialEnd,
    },
  });

  // Schedule trial reminder emails
  await scheduleTrialEmails(userId, plan, trialEnd);

  return { subscription, trialEnd };
}

async function scheduleTrialEmails(
  userId: string,
  plan: string,
  trialEnd: Date
): Promise<void> {
  const reminders = [
    {
      type: 'TRIAL_WELCOME',
      scheduledFor: new Date(), // Immediate
    },
    {
      type: 'TRIAL_MIDPOINT',
      scheduledFor: new Date(trialEnd.getTime() - (trialEnd.getTime() - Date.now()) / 2),
    },
    {
      type: 'TRIAL_ENDING_SOON',
      scheduledFor: new Date(trialEnd.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days before
    },
    {
      type: 'TRIAL_LAST_DAY',
      scheduledFor: new Date(trialEnd.getTime() - 24 * 60 * 60 * 1000), // 1 day before
    },
    {
      type: 'TRIAL_ENDED',
      scheduledFor: trialEnd,
    },
  ];

  await prisma.scheduledEmail.createMany({
    data: reminders.map(r => ({
      userId,
      emailType: r.type,
      scheduledFor: r.scheduledFor,
      metadata: { plan },
      status: 'PENDING',
    })),
  });
}
```

### Trial to Paid Conversion

The most critical moment in the subscription lifecycle. When a trial ends and the first real payment succeeds, that's a conversion. When it fails, you have a narrow window to save the customer.

```typescript
// src/lib/billing/trial-conversion.ts

/**
 * Handles the trial-to-paid transition.
 * Called from the webhook handler when we receive:
 * - customer.subscription.updated (status changes from trialing to active)
 * - invoice.payment_succeeded (first post-trial invoice)
 */
export async function handleTrialConversion(
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = subscription.metadata.userId;
  if (!userId) {
    console.error('Trial conversion: missing userId in subscription metadata', subscription.id);
    return;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'ACTIVE',
      trialEndsAt: null, // Trial is over
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    },
  });

  // Update trial history
  await prisma.trialHistory.updateMany({
    where: {
      userId,
      stripeSubscriptionId: subscription.id,
    },
    data: {
      convertedAt: new Date(),
      converted: true,
    },
  });

  // Cancel any remaining trial emails
  await prisma.scheduledEmail.updateMany({
    where: {
      userId,
      emailType: { in: ['TRIAL_ENDING_SOON', 'TRIAL_LAST_DAY', 'TRIAL_ENDED'] },
      status: 'PENDING',
    },
    data: { status: 'CANCELED' },
  });

  // Send conversion confirmation
  await sendEmail(userId, 'SUBSCRIPTION_ACTIVATED', {
    plan: subscription.metadata.plan,
    nextBillingDate: new Date(subscription.current_period_end * 1000),
  });

  // Analytics event
  await trackEvent('trial_converted', {
    userId,
    plan: subscription.metadata.plan,
    trialDuration: calculateTrialDuration(subscription),
  });
}

/**
 * Handles failed trial conversion (payment fails at end of trial).
 */
export async function handleTrialConversionFailure(
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = subscription.metadata.userId;
  if (!userId) return;

  // Don't immediately downgrade — give a grace period
  const gracePeriodEnd = new Date(
    Date.now() + TRIAL_CONFIG.gracePeriodHours * 60 * 60 * 1000
  );

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'PAST_DUE',
      // Keep current plan during grace period
      currentPeriodEnd: gracePeriodEnd,
    },
  });

  // Send urgent payment update email
  await sendEmail(userId, 'TRIAL_PAYMENT_FAILED', {
    plan: subscription.metadata.plan,
    updatePaymentUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/update-payment`,
    gracePeriodEnd,
  });
}
```

### Trial Extension Logic

```typescript
// src/lib/billing/trial-extensions.ts
export async function requestTrialExtension(
  userId: string,
  reason: string
): Promise<{ approved: boolean; newEndDate?: Date }> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { trialHistory: true },
  });

  if (user.subscriptionStatus !== 'TRIALING') {
    throw new Error('User is not currently in a trial');
  }

  const currentTrial = user.trialHistory.find(
    t => t.stripeSubscriptionId === user.subscriptionId && !t.converted
  );

  if (!currentTrial) {
    throw new Error('No active trial found');
  }

  // Check extension limit
  const existingExtensions = await prisma.trialExtension.count({
    where: { trialHistoryId: currentTrial.id },
  });

  if (existingExtensions >= TRIAL_CONFIG.extensions.maxExtensions) {
    return { approved: false };
  }

  // Record extension request
  const extension = await prisma.trialExtension.create({
    data: {
      trialHistoryId: currentTrial.id,
      reason,
      extensionDays: TRIAL_CONFIG.extensions.extensionDays,
      approved: TRIAL_CONFIG.extensions.autoApprove,
    },
  });

  if (TRIAL_CONFIG.extensions.autoApprove) {
    return await applyTrialExtension(extension.id);
  }

  // Queue for manual approval
  await sendFounderAlert({
    alertType: 'trial.extension_request',
    title: `Trial Extension Request: ${user.email}`,
    body: `Plan: ${user.currentPlan}\nReason: ${reason}\nCurrent end: ${user.trialEndsAt}`,
  });

  return { approved: false }; // Pending approval
}

async function applyTrialExtension(
  extensionId: string
): Promise<{ approved: boolean; newEndDate: Date }> {
  const extension = await prisma.trialExtension.findUniqueOrThrow({
    where: { id: extensionId },
    include: { trialHistory: { include: { user: true } } },
  });

  const subscription = await stripe.subscriptions.retrieve(
    extension.trialHistory.stripeSubscriptionId
  );

  const currentTrialEnd = subscription.trial_end!;
  const newTrialEnd = currentTrialEnd + (extension.extensionDays * 24 * 60 * 60);

  await stripe.subscriptions.update(subscription.id, {
    trial_end: newTrialEnd,
  });

  const newEndDate = new Date(newTrialEnd * 1000);

  await prisma.user.update({
    where: { id: extension.trialHistory.userId },
    data: {
      trialEndsAt: newEndDate,
      currentPeriodEnd: newEndDate,
    },
  });

  await prisma.trialExtension.update({
    where: { id: extensionId },
    data: { approved: true, appliedAt: new Date() },
  });

  return { approved: true, newEndDate };
}
```

---

## 3. Upgrade Flows

### Upgrade Mechanics

When a user upgrades (e.g., STARTER to PLUS), several things happen simultaneously:
1. The subscription's price changes immediately.
2. A proration credit is created for the unused portion of the current plan.
3. A proration charge is created for the remaining period on the new plan.
4. The user's access level changes immediately.
5. The billing amount changes on the next invoice.

```typescript
// src/lib/billing/upgrades.ts
import { PlanTier } from '@prisma/client';
import { stripe } from '@/lib/stripe/client';
import { prisma } from '@/lib/prisma';

const PLAN_HIERARCHY: Record<PlanTier, number> = {
  FREE: 0,
  STARTER: 1,
  PLUS: 2,
  SMART: 3,
  PRO: 4,
};

export async function upgradePlan(
  userId: string,
  newPlan: PlanTier,
  options: {
    newPeriod?: 'monthly' | 'annual';
    promoCode?: string;
  } = {}
): Promise<{ subscription: Stripe.Subscription; prorationAmount: number }> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  // Validate this is actually an upgrade
  if (PLAN_HIERARCHY[newPlan] <= PLAN_HIERARCHY[user.currentPlan]) {
    throw new BillingError('NOT_AN_UPGRADE', 'New plan must be higher than current plan');
  }

  if (!user.subscriptionId) {
    throw new BillingError('NO_SUBSCRIPTION', 'User has no active subscription');
  }

  const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);
  const currentItem = subscription.items.data[0];

  const period = options.newPeriod ?? (user.billingPeriod === 'ANNUAL' ? 'annual' : 'monthly');
  const newPriceId = getPriceIdForPlan(newPlan, period);

  // Preview the proration to show the user before confirming
  const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
    customer: user.stripeCustomerId!,
    subscription: user.subscriptionId,
    subscription_items: [
      {
        id: currentItem.id,
        price: newPriceId,
      },
    ],
    subscription_proration_behavior: 'create_prorations',
  });

  const prorationAmount = upcomingInvoice.lines.data
    .filter(line => line.proration)
    .reduce((sum, line) => sum + line.amount, 0);

  // Apply the upgrade
  const updatedSubscription = await stripe.subscriptions.update(user.subscriptionId, {
    items: [
      {
        id: currentItem.id,
        price: newPriceId,
      },
    ],
    proration_behavior: 'create_prorations',
    metadata: {
      ...subscription.metadata,
      plan: newPlan,
      period,
      lastUpgrade: new Date().toISOString(),
      previousPlan: user.currentPlan,
    },
  });

  // Apply promo code if provided
  if (options.promoCode) {
    await applyPromotionToSubscription(updatedSubscription.id, options.promoCode);
  }

  // Update local database immediately (don't wait for webhook)
  // Webhook will confirm and handle edge cases
  await prisma.user.update({
    where: { id: userId },
    data: {
      currentPlan: newPlan,
      billingPeriod: period === 'annual' ? 'ANNUAL' : 'MONTHLY',
    },
  });

  // Log the plan change
  await prisma.planChangeLog.create({
    data: {
      userId,
      fromPlan: user.currentPlan,
      toPlan: newPlan,
      fromPeriod: user.billingPeriod ?? 'MONTHLY',
      toPeriod: period === 'annual' ? 'ANNUAL' : 'MONTHLY',
      prorationAmount,
      type: 'UPGRADE',
    },
  });

  return {
    subscription: updatedSubscription,
    prorationAmount,
  };
}
```

### Upgrade Preview (Show Cost Before Confirming)

```typescript
// src/app/api/billing/upgrade-preview/route.ts
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = UpgradePreviewSchema.parse(await req.json());
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (!user.subscriptionId || !user.stripeCustomerId) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 400 });
  }

  const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);
  const currentItem = subscription.items.data[0];
  const newPriceId = getPriceIdForPlan(body.plan, body.period);

  // Get upcoming invoice preview
  const preview = await stripe.invoices.retrieveUpcoming({
    customer: user.stripeCustomerId,
    subscription: user.subscriptionId,
    subscription_items: [{ id: currentItem.id, price: newPriceId }],
    subscription_proration_behavior: 'create_prorations',
  });

  const prorationLines = preview.lines.data.filter(l => l.proration);
  const credit = prorationLines.find(l => l.amount < 0);
  const charge = prorationLines.find(l => l.amount > 0);

  return NextResponse.json({
    currentPlan: user.currentPlan,
    newPlan: body.plan,
    currentPrice: getCurrentPrice(user.currentPlan, user.billingPeriod),
    newPrice: getCurrentPrice(body.plan, body.period),
    prorationCredit: Math.abs(credit?.amount ?? 0) / 100,
    prorationCharge: (charge?.amount ?? 0) / 100,
    amountDueToday: Math.max(0, preview.amount_due) / 100,
    nextBillingDate: new Date(preview.period_end * 1000),
    nextBillingAmount: preview.lines.data
      .filter(l => !l.proration)
      .reduce((sum, l) => sum + l.amount, 0) / 100,
  });
}
```

---

## 4. Downgrade Flows

### Downgrade Strategy

Downgrades are more complex than upgrades because you need to decide:
1. **When does access change?** — Immediately or at period end?
2. **What happens to the price difference?** — Credit, refund, or nothing?
3. **What happens to features above the new tier?** — Data preserved but inaccessible? Deleted?

Stone AI's downgrade policy:
- Access remains at the current tier until the current billing period ends.
- At period end, the new (lower) price takes effect.
- No refunds for the remaining period (the user keeps their current access level until it expires).
- Bestie data is preserved but inaccessible if the new tier doesn't include Bestie.
- Agent conversation history is preserved but agents above the new tier limit are locked.

```typescript
// src/lib/billing/downgrades.ts
export async function downgradePlan(
  userId: string,
  newPlan: PlanTier,
  options: {
    newPeriod?: 'monthly' | 'annual';
  } = {}
): Promise<{ effectiveDate: Date; currentPlanUntil: Date }> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  });

  // Validate this is actually a downgrade
  if (PLAN_HIERARCHY[newPlan] >= PLAN_HIERARCHY[user.currentPlan]) {
    throw new BillingError('NOT_A_DOWNGRADE', 'Use upgrade flow for higher plans');
  }

  if (!user.subscriptionId) {
    throw new BillingError('NO_SUBSCRIPTION', 'User has no active subscription');
  }

  const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);
  const currentItem = subscription.items.data[0];
  const period = options.newPeriod ?? 'monthly';
  const newPriceId = getPriceIdForPlan(newPlan, period);

  if (newPlan === 'FREE') {
    // Downgrade to FREE = cancel subscription at period end
    await stripe.subscriptions.update(user.subscriptionId, {
      cancel_at_period_end: true,
      metadata: {
        ...subscription.metadata,
        downgradeTarget: 'FREE',
        downgradeRequestedAt: new Date().toISOString(),
      },
    });
  } else {
    // Schedule the plan change for the end of the current period
    const schedule = await stripe.subscriptionSchedules.create({
      from_subscription: user.subscriptionId,
    });

    await stripe.subscriptionSchedules.update(schedule.id, {
      end_behavior: 'release',
      phases: [
        {
          items: [{ price: currentItem.price.id, quantity: 1 }],
          start_date: schedule.phases[0].start_date,
          end_date: schedule.phases[0].end_date,
        },
        {
          items: [{ price: newPriceId, quantity: 1 }],
          start_date: schedule.phases[0].end_date,
        },
      ],
    });
  }

  const currentPlanUntil = new Date(subscription.current_period_end * 1000);

  // Update user with pending downgrade info
  await prisma.user.update({
    where: { id: userId },
    data: {
      pendingDowngrade: newPlan,
      pendingDowngradeDate: currentPlanUntil,
    },
  });

  // Log the plan change
  await prisma.planChangeLog.create({
    data: {
      userId,
      fromPlan: user.currentPlan,
      toPlan: newPlan,
      fromPeriod: user.billingPeriod ?? 'MONTHLY',
      toPeriod: period === 'annual' ? 'ANNUAL' : 'MONTHLY',
      type: 'DOWNGRADE',
      effectiveDate: currentPlanUntil,
    },
  });

  return {
    effectiveDate: currentPlanUntil,
    currentPlanUntil,
  };
}
```

### Downgrade Feature Handling

```typescript
// src/lib/billing/feature-access.ts
export async function handleDowngradeEffective(
  userId: string,
  newPlan: PlanTier
): Promise<void> {
  const agentLimit = getAgentLimitForPlan(newPlan);
  const hasBestie = newPlan !== 'FREE';

  // Lock agents above the new tier limit (don't delete conversations)
  await prisma.agentAccess.updateMany({
    where: {
      userId,
      agentNumber: { gt: agentLimit },
    },
    data: {
      locked: true,
      lockedAt: new Date(),
      lockReason: 'PLAN_DOWNGRADE',
    },
  });

  // Handle Bestie
  if (!hasBestie) {
    await prisma.bestie.updateMany({
      where: { userId },
      data: {
        active: false,
        deactivatedAt: new Date(),
        deactivateReason: 'PLAN_DOWNGRADE',
      },
    });
  }

  // Handle premium backdrops
  if (newPlan === 'FREE' || newPlan === 'STARTER') {
    await prisma.userBackdrop.updateMany({
      where: {
        userId,
        backdrop: { premium: true },
      },
      data: {
        active: false,
      },
    });

    // Reset to default backdrop
    await prisma.user.update({
      where: { id: userId },
      data: { activeBackdropId: null },
    });
  }

  // Clear pending downgrade
  await prisma.user.update({
    where: { id: userId },
    data: {
      currentPlan: newPlan,
      pendingDowngrade: null,
      pendingDowngradeDate: null,
    },
  });
}

function getAgentLimitForPlan(plan: PlanTier): number {
  const limits: Record<PlanTier, number> = {
    FREE: 4,
    STARTER: 16,
    PLUS: 30,
    SMART: 39,
    PRO: 38,
  };
  return limits[plan];
}
```

---

## 5. Pause and Resume

### Subscription Pausing

Pausing is a retention tool. When a user wants to cancel because they don't need the service temporarily (vacation, project end, budget constraints), pausing keeps them in the funnel instead of losing them to cancellation.

```typescript
// src/lib/billing/pause.ts
export const PAUSE_CONFIG = {
  maxPauseDurationDays: 90,
  minPauseDurationDays: 7,
  maxPausesPerYear: 2,
  preserveData: true,
  resumeBehavior: 'same_plan' as const,
};

export async function pauseSubscription(
  userId: string,
  pauseDays: number,
  reason?: string
): Promise<{ pauseUntil: Date }> {
  if (pauseDays < PAUSE_CONFIG.minPauseDurationDays || pauseDays > PAUSE_CONFIG.maxPauseDurationDays) {
    throw new BillingError(
      'INVALID_PAUSE_DURATION',
      `Pause must be between ${PAUSE_CONFIG.minPauseDurationDays} and ${PAUSE_CONFIG.maxPauseDurationDays} days`
    );
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { pauseHistory: { where: { createdAt: { gte: oneYearAgo() } } } },
  });

  if (user.pauseHistory.length >= PAUSE_CONFIG.maxPausesPerYear) {
    throw new BillingError('PAUSE_LIMIT_REACHED', 'Maximum pauses per year reached');
  }

  if (!user.subscriptionId) {
    throw new BillingError('NO_SUBSCRIPTION', 'No active subscription to pause');
  }

  // Stripe pause: set pause_collection on the subscription
  const pauseUntil = new Date(Date.now() + pauseDays * 24 * 60 * 60 * 1000);

  await stripe.subscriptions.update(user.subscriptionId, {
    pause_collection: {
      behavior: 'void', // Don't generate invoices during pause
      resumes_at: Math.floor(pauseUntil.getTime() / 1000),
    },
    metadata: {
      pausedAt: new Date().toISOString(),
      pauseReason: reason ?? 'user_requested',
      pauseUntil: pauseUntil.toISOString(),
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'PAUSED',
      pausedUntil: pauseUntil,
    },
  });

  await prisma.pauseHistory.create({
    data: {
      userId,
      reason,
      pauseDays,
      pauseUntil,
      previousPlan: user.currentPlan,
    },
  });

  // Schedule resume reminder
  await prisma.scheduledEmail.create({
    data: {
      userId,
      emailType: 'SUBSCRIPTION_RESUME_REMINDER',
      scheduledFor: new Date(pauseUntil.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days before
      metadata: { pauseUntil: pauseUntil.toISOString(), plan: user.currentPlan },
      status: 'PENDING',
    },
  });

  return { pauseUntil };
}

export async function resumeSubscription(userId: string): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (user.subscriptionStatus !== 'PAUSED' || !user.subscriptionId) {
    throw new BillingError('NOT_PAUSED', 'Subscription is not paused');
  }

  await stripe.subscriptions.update(user.subscriptionId, {
    pause_collection: '', // Remove pause
    metadata: {
      pausedAt: '',
      pauseReason: '',
      pauseUntil: '',
      resumedAt: new Date().toISOString(),
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'ACTIVE',
      pausedUntil: null,
    },
  });

  // Update pause history
  await prisma.pauseHistory.updateMany({
    where: { userId, resumedAt: null },
    data: { resumedAt: new Date() },
  });
}
```

---

## 6. Proration Calculations

### How Proration Works

Proration ensures users pay fairly when they change plans mid-cycle. Stripe handles the math, but you need to understand it to display accurate previews and handle edge cases.

```
Example: User on STARTER ($19.99/mo), 15 days into a 30-day cycle, upgrades to PLUS ($49.99/mo)

Days remaining: 15 out of 30
Credit for unused STARTER: $19.99 * (15/30) = $10.00 (credit)
Charge for remaining PLUS:  $49.99 * (15/30) = $25.00 (charge)
Net charge today: $25.00 - $10.00 = $15.00
Next full invoice: $49.99 (30 days later)
```

### Proration Behavior Options

```typescript
type ProrationBehavior =
  | 'create_prorations'    // Default: credit + charge for remaining period
  | 'none'                 // No proration: new price on next invoice only
  | 'always_invoice';      // Create prorations AND invoice immediately

// Stone AI's proration strategy by change type:
const PRORATION_STRATEGY = {
  upgrade: 'create_prorations',      // Fair — charge difference immediately
  downgrade: 'none',                 // User keeps current access until period end
  periodChange: 'create_prorations', // Monthly to annual: credit remaining monthly, charge annual
  cancelResubscribe: 'none',         // Fresh start on new billing cycle
};
```

### Annual to Monthly Switching

This is a common edge case that trips up many billing systems:

```typescript
// Switching from annual to monthly mid-year
export async function switchToMonthly(userId: string): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (user.billingPeriod !== 'ANNUAL' || !user.subscriptionId) {
    throw new BillingError('NOT_ANNUAL', 'User is not on an annual plan');
  }

  const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);
  const currentItem = subscription.items.data[0];
  const monthlyPriceId = getPriceIdForPlan(user.currentPlan, 'monthly');

  // Option A: Switch immediately with proration (user gets credit for unused annual)
  // This can result in large credits. Use carefully.

  // Option B (preferred): Schedule switch at end of annual period
  const schedule = await stripe.subscriptionSchedules.create({
    from_subscription: user.subscriptionId,
  });

  await stripe.subscriptionSchedules.update(schedule.id, {
    end_behavior: 'release',
    phases: [
      {
        items: [{ price: currentItem.price.id, quantity: 1 }],
        start_date: schedule.phases[0].start_date,
        end_date: schedule.phases[0].end_date,
      },
      {
        items: [{ price: monthlyPriceId, quantity: 1 }],
        start_date: schedule.phases[0].end_date,
      },
    ],
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      pendingPeriodChange: 'MONTHLY',
      pendingPeriodChangeDate: new Date(subscription.current_period_end * 1000),
    },
  });
}
```

---

## 7. Grace Periods and Access Control

### The Access Control Decision Tree

```typescript
// src/lib/billing/access-control.ts
export function determineAccessLevel(user: UserWithSubscription): AccessLevel {
  const now = new Date();

  // Active or trialing — full access
  if (['ACTIVE', 'TRIALING'].includes(user.subscriptionStatus)) {
    return {
      tier: user.currentPlan,
      agentLimit: getAgentLimitForPlan(user.currentPlan),
      bestieAccess: user.currentPlan !== 'FREE',
      premiumBackdrops: ['PLUS', 'SMART', 'PRO'].includes(user.currentPlan),
      smartAgents: ['SMART', 'PRO'].includes(user.currentPlan),
    };
  }

  // Cancel pending — still active until period end
  if (user.subscriptionStatus === 'ACTIVE' && user.cancelAtPeriodEnd) {
    if (user.currentPeriodEnd && user.currentPeriodEnd > now) {
      return {
        tier: user.currentPlan,
        agentLimit: getAgentLimitForPlan(user.currentPlan),
        bestieAccess: user.currentPlan !== 'FREE',
        premiumBackdrops: ['PLUS', 'SMART', 'PRO'].includes(user.currentPlan),
        smartAgents: ['SMART', 'PRO'].includes(user.currentPlan),
      };
    }
  }

  // Past due — grace period with degraded access
  if (user.subscriptionStatus === 'PAST_DUE') {
    const gracePeriodEnd = new Date(
      (user.currentPeriodEnd?.getTime() ?? Date.now()) + GRACE_PERIOD_MS
    );

    if (now < gracePeriodEnd) {
      return {
        tier: user.currentPlan,
        agentLimit: getAgentLimitForPlan(user.currentPlan),
        bestieAccess: false, // Bestie disabled during grace
        premiumBackdrops: false,
        smartAgents: false, // SMART agents disabled during grace
        degraded: true,
        message: 'Please update your payment method to maintain full access.',
      };
    }
  }

  // Everything else: FREE access
  return {
    tier: 'FREE',
    agentLimit: 4,
    bestieAccess: false,
    premiumBackdrops: false,
    smartAgents: false,
  };
}

const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
```

---

## 8. Reactivation Flows

### Win-Back After Cancellation

When a user's subscription is canceled (either voluntary or involuntary), they enter a win-back window. The goal is to re-subscribe them with minimal friction.

```typescript
// src/lib/billing/reactivation.ts
export async function reactivateSubscription(
  userId: string,
  plan: PlanTier,
  period: 'monthly' | 'annual',
  options: {
    promoCode?: string;
    skipTrial?: boolean;
  } = {}
): Promise<Stripe.Subscription> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (!['CANCELED', 'UNPAID', 'FREE'].includes(user.subscriptionStatus)) {
    throw new BillingError('NOT_CANCELED', 'User still has an active subscription');
  }

  const customerId = await getOrCreateStripeCustomer(userId);
  const priceId = getPriceIdForPlan(plan, period);

  const params: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription',
    },
    expand: ['latest_invoice.payment_intent'],
    metadata: {
      userId,
      plan,
      period,
      reactivatedAt: new Date().toISOString(),
      previousCancelReason: user.cancelReason ?? '',
      platform: 'stone-ai',
    },
  };

  // Apply win-back promo if provided
  if (options.promoCode) {
    const promos = await stripe.promotionCodes.list({
      code: options.promoCode,
      active: true,
      limit: 1,
    });
    if (promos.data.length > 0) {
      params.promotion_code = promos.data[0].id;
    }
  }

  const subscription = await stripe.subscriptions.create(params);

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status === 'active' ? 'ACTIVE' : 'INCOMPLETE',
      currentPlan: plan,
      billingPeriod: period === 'annual' ? 'ANNUAL' : 'MONTHLY',
      cancelAtPeriodEnd: false,
      cancelReason: null,
    },
  });

  return subscription;
}
```

### Reactivation Before Period End

If a user cancels but the billing period hasn't ended yet, they can reactivate without creating a new subscription:

```typescript
export async function undoCancellation(userId: string): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  if (!user.cancelAtPeriodEnd || !user.subscriptionId) {
    throw new BillingError('NOT_PENDING_CANCEL', 'No pending cancellation to undo');
  }

  await stripe.subscriptions.update(user.subscriptionId, {
    cancel_at_period_end: false,
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      cancelAtPeriodEnd: false,
      cancelReason: null,
      pendingDowngrade: null,
      pendingDowngradeDate: null,
    },
  });
}
```

---

## 9. Billing Cycle Management

### Understanding Billing Anchors

Stripe's billing anchor is the date within a billing cycle that determines when invoices are generated. By default, it's the subscription creation date.

```typescript
// For consistent billing dates across all subscribers (e.g., always bill on the 1st):
const subscription = await stripe.subscriptions.create({
  customer: customerId,
  items: [{ price: priceId }],
  billing_cycle_anchor: getNextFirstOfMonth(),
  proration_behavior: 'create_prorations', // Charge for partial first month
});

function getNextFirstOfMonth(): number {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return Math.floor(next.getTime() / 1000);
}
```

Stone AI uses the default anchor (subscription creation date) because:
1. It simplifies proration calculations.
2. Revenue is distributed throughout the month (better cash flow predictability).
3. It avoids the "everyone bills on the 1st" server load spike.

### Handling Period Boundaries

```typescript
// src/lib/billing/period.ts
export function isWithinCurrentPeriod(user: UserWithSubscription): boolean {
  if (!user.currentPeriodEnd) return false;
  return new Date() < user.currentPeriodEnd;
}

export function daysUntilRenewal(user: UserWithSubscription): number {
  if (!user.currentPeriodEnd) return -1;
  const msRemaining = user.currentPeriodEnd.getTime() - Date.now();
  return Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
}

export function isInGracePeriod(user: UserWithSubscription): boolean {
  if (user.subscriptionStatus !== 'PAST_DUE') return false;
  if (!user.currentPeriodEnd) return false;
  const gracePeriodEnd = new Date(user.currentPeriodEnd.getTime() + GRACE_PERIOD_MS);
  return new Date() < gracePeriodEnd;
}
```

---

## 10. Subscription Event Handling Matrix

Every subscription event from Stripe maps to specific actions in Stone AI:

| Stripe Event | Action | Priority |
|---|---|---|
| `customer.subscription.created` | Create local subscription record, set plan access | HIGH |
| `customer.subscription.updated` | Sync status, handle plan changes, update access | HIGH |
| `customer.subscription.deleted` | Downgrade to FREE, preserve data | HIGH |
| `customer.subscription.trial_will_end` | Send trial ending reminder (3 days before) | MEDIUM |
| `customer.subscription.paused` | Set paused status, restrict access | MEDIUM |
| `customer.subscription.resumed` | Restore access to paused plan | MEDIUM |
| `invoice.payment_succeeded` | Confirm active status, update period end | HIGH |
| `invoice.payment_failed` | Start dunning flow, send payment update email | CRITICAL |
| `invoice.upcoming` | Send upcoming charge notification | LOW |
| `customer.subscription.pending_update_applied` | Apply scheduled plan change | HIGH |
| `customer.subscription.pending_update_expired` | Clean up failed schedule | MEDIUM |

---

## Summary

The subscription lifecycle for Stone AI encompasses:

1. **Trial management** with configurable durations, payment method requirements, extension logic, and conversion tracking
2. **Upgrade flows** with real-time proration previews and immediate access changes
3. **Downgrade flows** with scheduled changes at period end and feature gating
4. **Pause and resume** as a retention tool with limits on frequency and duration
5. **Proration calculations** for mid-cycle changes including annual-to-monthly switches
6. **Grace periods** with degraded access during payment recovery
7. **Reactivation flows** for both pre-period-end (undo cancel) and post-cancellation (new subscription)
8. **Billing cycle management** with consistent period tracking

Every state transition has a corresponding database update, email trigger, and access control check. The system is designed so that Stripe is always the source of truth, with the local database as a synchronized cache updated via webhooks. When local state and Stripe diverge, Stripe wins.
