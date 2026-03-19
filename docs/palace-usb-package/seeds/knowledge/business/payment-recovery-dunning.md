# Payment Recovery & Dunning — Stone AI Palace Knowledge Seed

## Seed Classification
- **Domain**: Revenue Operations / Churn Prevention
- **Complexity**: Advanced
- **Stack**: Next.js 16, TypeScript, Stripe Billing, Prisma 7.4
- **Applies To**: Stone AI, Best AI, Stone AI Tools

---

## 1. The Cost of Failed Payments

Failed payments are the silent revenue killer in SaaS. Industry data shows that **20-40% of all churn is involuntary** — the customer didn't choose to leave, their payment just failed. For a business like Stone AI with tiered pricing from $19.99 to $200/month, recovering even a fraction of failed payments has a massive impact on revenue.

### Why Payments Fail

| Reason | Frequency | Recoverable? | Strategy |
|--------|-----------|-------------|----------|
| Insufficient funds | ~35% | High (try later) | Smart Retries |
| Expired card | ~25% | High (prompt update) | Card updater + email |
| Card reported lost/stolen | ~10% | Medium (new card needed) | Email + in-app prompt |
| Bank decline (fraud) | ~10% | Low | Support contact |
| Network/processing error | ~10% | Very high (temporary) | Immediate retry |
| Invalid card number | ~5% | Medium (data entry error) | Re-enter card |
| Currency/country block | ~3% | Low | Alternative payment |
| Other | ~2% | Varies | Case-by-case |

### The Revenue Impact Model

```
Monthly subscribers:          1,000
Average monthly revenue:      $75/subscriber (weighted across tiers)
Monthly payment failure rate: 8%
Failed payments per month:    80
Without recovery:             80 * $75 = $6,000 lost/month = $72,000/year

With 60% recovery rate:       48 recovered * $75 = $3,600 saved/month = $43,200/year
Net improvement:              $43,200/year from dunning alone
```

---

## 2. Stripe Smart Retries

### How Smart Retries Work

Stripe's Smart Retries use machine learning to determine the optimal time to retry a failed payment. Instead of a fixed retry schedule, Stripe analyzes patterns across its entire network to find when a specific card is most likely to succeed.

```typescript
// src/lib/stripe/retry-config.ts

/**
 * Stripe Smart Retries configuration.
 * Configure in Stripe Dashboard > Settings > Billing > Subscriptions and emails > Manage failed payments
 *
 * Recommended settings for Stone AI:
 * - Smart Retries: ON
 * - Retry schedule: Smart (Stripe optimized)
 * - Maximum retry attempts: Up to 4 retries over ~3 weeks
 * - After all retries fail: Cancel subscription
 */
export const RETRY_CONFIG = {
  // Stripe handles retry timing with Smart Retries
  smartRetries: true,

  // Maximum time Stripe will attempt retries (days)
  maxRetryPeriod: 21,

  // What happens after all retries are exhausted
  failedPaymentAction: 'cancel_subscription' as const,

  // Grace period BEFORE marking as past_due (hours)
  // This is the window between first failure and status change
  initialGracePeriodHours: 1,

  // Whether to send Stripe's built-in dunning emails
  // Set to false — we handle our own emails for better customization
  stripeEmails: false,

  // Our custom dunning sequence
  dunningSequence: [
    { day: 0, action: 'email_payment_failed', urgency: 'low' },
    { day: 1, action: 'email_update_payment', urgency: 'medium' },
    { day: 3, action: 'email_access_warning', urgency: 'high' },
    { day: 5, action: 'in_app_banner', urgency: 'high' },
    { day: 7, action: 'email_final_warning', urgency: 'critical' },
    { day: 10, action: 'email_degraded_access', urgency: 'critical' },
    { day: 14, action: 'email_last_chance', urgency: 'critical' },
    { day: 21, action: 'subscription_canceled', urgency: 'final' },
  ],
};
```

### Configuring Smart Retries via API

```typescript
// scripts/configure-stripe-billing.ts
async function configureSmartRetries() {
  // Smart Retries are configured at the account level via the Dashboard
  // But subscription-level overrides are possible:

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_settings: {
      payment_method_options: {
        card: {
          request_three_d_secure: 'automatic',
        },
      },
    },
    // Dunning behavior configuration
    collection_method: 'charge_automatically',
  });
}
```

---

## 3. Custom Dunning Email Sequence

### Email Templates and Timing

Stripe's built-in emails are generic. Custom dunning emails perform better because they're branded, personal, and can reference the specific features the user will lose.

```typescript
// src/lib/billing/dunning/email-templates.ts

export const DUNNING_EMAILS = {
  // Day 0: Gentle notification
  payment_failed: {
    subject: 'Quick heads-up: Your payment didn\'t go through',
    preheader: 'No worries — let\'s get this sorted.',
    template: 'dunning-soft',
    variables: (user: DunningUser) => ({
      firstName: user.name?.split(' ')[0] ?? 'there',
      planName: getPlanDisplayName(user.currentPlan),
      amount: getMonthlyPrice(user.currentPlan, user.billingPeriod),
      updatePaymentUrl: `${APP_URL}/billing/update-payment`,
      failureReason: getHumanReadableFailureReason(user.lastDeclineCode),
    }),
  },

  // Day 1: Direct but friendly
  update_payment: {
    subject: 'Action needed: Update your payment method',
    preheader: 'Keep your Stone AI access uninterrupted.',
    template: 'dunning-action',
    variables: (user: DunningUser) => ({
      firstName: user.name?.split(' ')[0] ?? 'there',
      planName: getPlanDisplayName(user.currentPlan),
      agentCount: getAgentLimitForPlan(user.currentPlan),
      daysRemaining: calculateDaysUntilDowngrade(user),
      updatePaymentUrl: `${APP_URL}/billing/update-payment`,
    }),
  },

  // Day 3: Urgency increase
  access_warning: {
    subject: 'Your Stone AI access is at risk',
    preheader: `Your ${getAgentLimitForPlan('STARTER')}+ agents are waiting.`,
    template: 'dunning-urgent',
    variables: (user: DunningUser) => ({
      firstName: user.name?.split(' ')[0] ?? 'there',
      planName: getPlanDisplayName(user.currentPlan),
      agentCount: getAgentLimitForPlan(user.currentPlan),
      bestieActive: user.currentPlan !== 'FREE',
      conversationCount: user.totalConversations,
      daysRemaining: calculateDaysUntilDowngrade(user),
      updatePaymentUrl: `${APP_URL}/billing/update-payment`,
    }),
  },

  // Day 7: Final warning
  final_warning: {
    subject: 'Final notice: Your subscription will be canceled',
    preheader: 'We don\'t want to see you go.',
    template: 'dunning-final',
    variables: (user: DunningUser) => ({
      firstName: user.name?.split(' ')[0] ?? 'there',
      planName: getPlanDisplayName(user.currentPlan),
      cancelDate: formatDate(calculateCancelDate(user)),
      lostFeatures: getLostFeatures(user.currentPlan),
      updatePaymentUrl: `${APP_URL}/billing/update-payment`,
      // Offer a discount to prevent churn
      discountOffer: shouldOfferDiscount(user) ? getRetentionDiscount(user) : null,
    }),
  },

  // Day 14: Last chance
  last_chance: {
    subject: 'Last chance to save your Stone AI subscription',
    preheader: 'Your account will be downgraded tomorrow.',
    template: 'dunning-last-chance',
    variables: (user: DunningUser) => ({
      firstName: user.name?.split(' ')[0] ?? 'there',
      planName: getPlanDisplayName(user.currentPlan),
      updatePaymentUrl: `${APP_URL}/billing/update-payment`,
      // One final discount attempt
      finalOffer: getLastChanceOffer(user),
    }),
  },

  // Post-cancellation
  subscription_canceled: {
    subject: 'Your Stone AI subscription has been canceled',
    preheader: 'We saved your data. Come back anytime.',
    template: 'dunning-canceled',
    variables: (user: DunningUser) => ({
      firstName: user.name?.split(' ')[0] ?? 'there',
      previousPlan: getPlanDisplayName(user.currentPlan),
      dataRetentionDays: 90,
      resubscribeUrl: `${APP_URL}/billing`,
      // Win-back offer
      winBackOffer: getWinBackOffer(user),
    }),
  },
};
```

### Dunning Email Scheduler

```typescript
// src/lib/billing/dunning/scheduler.ts
import { prisma } from '@/lib/prisma';
import { RETRY_CONFIG } from '../retry-config';

export async function initiateDunningSequence(
  userId: string,
  invoiceId: string,
  failureReason: string
): Promise<void> {
  // Check if dunning is already active for this user
  const existingDunning = await prisma.dunningSequence.findFirst({
    where: { userId, status: 'ACTIVE' },
  });

  if (existingDunning) {
    // Update existing sequence with new failure info
    await prisma.dunningSequence.update({
      where: { id: existingDunning.id },
      data: {
        lastFailureAt: new Date(),
        failureCount: { increment: 1 },
        lastDeclineCode: failureReason,
        invoiceId,
      },
    });
    return;
  }

  // Create new dunning sequence
  const dunning = await prisma.dunningSequence.create({
    data: {
      userId,
      invoiceId,
      status: 'ACTIVE',
      startedAt: new Date(),
      lastFailureAt: new Date(),
      failureCount: 1,
      lastDeclineCode: failureReason,
    },
  });

  // Schedule all dunning emails
  const now = Date.now();
  const emails = RETRY_CONFIG.dunningSequence
    .filter(step => step.action.startsWith('email_'))
    .map(step => ({
      dunningSequenceId: dunning.id,
      userId,
      emailType: step.action.toUpperCase(),
      scheduledFor: new Date(now + step.day * 24 * 60 * 60 * 1000),
      urgency: step.urgency,
      status: 'PENDING' as const,
    }));

  await prisma.scheduledEmail.createMany({ data: emails });

  // Send first email immediately
  await sendDunningEmail(userId, 'payment_failed');
}

export async function handlePaymentRecovered(
  userId: string,
  invoiceId: string
): Promise<void> {
  // Mark dunning sequence as resolved
  await prisma.dunningSequence.updateMany({
    where: { userId, status: 'ACTIVE' },
    data: {
      status: 'RESOLVED',
      resolvedAt: new Date(),
      resolution: 'PAYMENT_RECOVERED',
    },
  });

  // Cancel all pending dunning emails
  await prisma.scheduledEmail.updateMany({
    where: {
      userId,
      emailType: { startsWith: 'EMAIL_' },
      status: 'PENDING',
      dunningSequenceId: { not: null },
    },
    data: { status: 'CANCELED' },
  });

  // Remove in-app dunning banners
  await prisma.userNotification.updateMany({
    where: {
      userId,
      type: 'DUNNING_BANNER',
      dismissed: false,
    },
    data: { dismissed: true },
  });

  // Send recovery confirmation
  await sendEmail(userId, 'PAYMENT_RECOVERED', {
    message: 'Your payment went through! Your subscription is fully active again.',
  });
}
```

---

## 4. Payment Method Update Flow

### In-App Payment Update

The most effective dunning strategy is making it dead simple to update a payment method. Every friction point in this flow costs recovered revenue.

```typescript
// src/app/api/billing/update-payment/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { stripe } from '@/lib/stripe/client';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { stripeCustomerId: true, subscriptionId: true },
  });

  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account' }, { status: 400 });
  }

  // Create a SetupIntent for the customer to add a new payment method
  const setupIntent = await stripe.setupIntents.create({
    customer: user.stripeCustomerId,
    payment_method_types: ['card'],
    usage: 'off_session',
    metadata: {
      userId,
      purpose: 'payment_update',
      dunning: 'true',
    },
  });

  return NextResponse.json({
    clientSecret: setupIntent.client_secret,
  });
}

// After the SetupIntent succeeds (from client-side confirmation):
export async function PUT(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { paymentMethodId } = await req.json();

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { stripeCustomerId: true, subscriptionId: true },
  });

  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account' }, { status: 400 });
  }

  // Set as default payment method
  await stripe.customers.update(user.stripeCustomerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });

  // If there's a past-due subscription, update its default payment method too
  if (user.subscriptionId) {
    await stripe.subscriptions.update(user.subscriptionId, {
      default_payment_method: paymentMethodId,
    });

    // Retry the latest failed invoice immediately
    const subscription = await stripe.subscriptions.retrieve(user.subscriptionId, {
      expand: ['latest_invoice'],
    });

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice;
    if (latestInvoice && latestInvoice.status === 'open') {
      try {
        await stripe.invoices.pay(latestInvoice.id, {
          payment_method: paymentMethodId,
        });
      } catch (error) {
        // Payment might still fail — Stripe will continue retrying
        console.error('Immediate retry failed:', error);
      }
    }
  }

  return NextResponse.json({ success: true });
}
```

### Stripe Customer Portal for Payment Updates

```typescript
// src/app/api/billing/portal/route.ts
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user.stripeCustomerId) {
    return NextResponse.json({ error: 'No billing account' }, { status: 400 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    flow_data: {
      type: 'payment_method_update',
    },
  });

  return NextResponse.json({ url: session.url });
}
```

---

## 5. In-App Dunning UI

### Dunning Banner Component

```typescript
// src/components/billing/DunningBanner.tsx
'use client';

import { useState } from 'react';
import { AlertTriangle, CreditCard, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DunningBannerProps {
  severity: 'warning' | 'urgent' | 'critical';
  daysRemaining: number;
  planName: string;
  onUpdatePayment: () => void;
  onDismiss?: () => void;
}

export function DunningBanner({
  severity,
  daysRemaining,
  planName,
  onUpdatePayment,
  onDismiss,
}: DunningBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const messages = {
    warning: `Your recent payment didn't go through. Update your payment method to keep your ${planName} access.`,
    urgent: `Payment issue: Your ${planName} plan will be downgraded in ${daysRemaining} days if payment isn't resolved.`,
    critical: `Final warning: Your subscription will be canceled ${daysRemaining <= 1 ? 'tomorrow' : `in ${daysRemaining} days`}. Update payment now.`,
  };

  const colors = {
    warning: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-200',
    urgent: 'bg-orange-500/10 border-orange-500/30 text-orange-200',
    critical: 'bg-red-500/10 border-red-500/30 text-red-200',
  };

  return (
    <div className={cn(
      'fixed top-0 left-0 right-0 z-50 border-b px-4 py-3',
      'flex items-center justify-between gap-4',
      colors[severity]
    )}>
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <p className="text-sm font-medium">{messages[severity]}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={onUpdatePayment}
          className="bg-white text-black hover:bg-gray-100"
        >
          <CreditCard className="h-4 w-4 mr-1" />
          Update Payment
        </Button>
        {severity === 'warning' && onDismiss && (
          <button
            onClick={() => {
              setDismissed(true);
              onDismiss();
            }}
            className="p-1 hover:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
```

### Dunning State Provider

```typescript
// src/lib/billing/dunning/use-dunning-state.ts
'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/use-user';

interface DunningState {
  isDunning: boolean;
  severity: 'warning' | 'urgent' | 'critical';
  daysRemaining: number;
  message: string;
}

export function useDunningState(): DunningState | null {
  const { user } = useUser();
  const [dunning, setDunning] = useState<DunningState | null>(null);

  useEffect(() => {
    if (!user || user.subscriptionStatus !== 'PAST_DUE') {
      setDunning(null);
      return;
    }

    const periodEnd = new Date(user.currentPeriodEnd);
    const now = new Date();
    const daysSinceFailure = Math.floor(
      (now.getTime() - periodEnd.getTime()) / (24 * 60 * 60 * 1000)
    );
    const daysRemaining = 21 - daysSinceFailure;

    let severity: 'warning' | 'urgent' | 'critical';
    if (daysSinceFailure <= 3) severity = 'warning';
    else if (daysSinceFailure <= 10) severity = 'urgent';
    else severity = 'critical';

    setDunning({
      isDunning: true,
      severity,
      daysRemaining: Math.max(0, daysRemaining),
      message: getDunningMessage(severity, daysRemaining, user.currentPlan),
    });
  }, [user]);

  return dunning;
}
```

---

## 6. Involuntary Churn Prevention Strategies

### Card Updater Service

Stripe automatically updates expired card numbers through partnerships with card networks. This is called the **Automatic Card Updater** and it runs automatically for all Stripe customers.

```typescript
// What Stripe updates automatically:
// - Card numbers when a bank issues a replacement (lost/stolen)
// - Expiration dates when a card is renewed
// - This happens in the background — no user action needed

// You can check if a card was updated:
export async function checkCardUpdates(customerId: string): Promise<void> {
  const paymentMethods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  });

  for (const pm of paymentMethods.data) {
    const card = pm.card!;
    console.log(`Card ${pm.id}: ${card.brand} ending ${card.last4}`);
    console.log(`  Expires: ${card.exp_month}/${card.exp_year}`);
    console.log(`  Updated: ${pm.metadata?.lastUpdated ?? 'unknown'}`);
  }
}
```

### Pre-Dunning: Proactive Card Expiry Notifications

Don't wait for a payment to fail. If you know a card is expiring, notify the user before the next billing date:

```typescript
// src/lib/billing/dunning/pre-dunning.ts
export async function checkExpiringCards(): Promise<void> {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // Find all users whose cards expire before their next billing date
  const usersWithExpiringCards = await prisma.user.findMany({
    where: {
      subscriptionStatus: 'ACTIVE',
      stripeCustomerId: { not: null },
      currentPeriodEnd: { gte: nextMonth }, // Next billing is after next month
    },
  });

  for (const user of usersWithExpiringCards) {
    try {
      const customer = await stripe.customers.retrieve(user.stripeCustomerId!);
      if (customer.deleted) continue;

      const defaultPmId = (customer as Stripe.Customer).invoice_settings?.default_payment_method;
      if (!defaultPmId || typeof defaultPmId !== 'string') continue;

      const pm = await stripe.paymentMethods.retrieve(defaultPmId);
      if (!pm.card) continue;

      const cardExpiry = new Date(pm.card.exp_year, pm.card.exp_month - 1);

      // Card expires before next billing
      if (cardExpiry < user.currentPeriodEnd!) {
        await sendEmail(user.id, 'CARD_EXPIRING', {
          last4: pm.card.last4,
          brand: pm.card.brand,
          expiryMonth: pm.card.exp_month,
          expiryYear: pm.card.exp_year,
          nextBillingDate: user.currentPeriodEnd,
          updateUrl: `${APP_URL}/billing/update-payment`,
        });

        console.log(`Pre-dunning: Notified user ${user.id} about expiring card`);
      }
    } catch (error) {
      console.error(`Pre-dunning check failed for user ${user.id}:`, error);
    }
  }
}

// Run this as a daily cron job
// Vercel Cron: cron(0 9 * * *) — 9 AM UTC daily
```

### Retry Timing Optimization

Beyond Stripe's Smart Retries, there are additional strategies for timing retries:

```typescript
// src/lib/billing/dunning/retry-timing.ts

/**
 * Optimal retry windows based on payment failure research:
 *
 * 1. IMMEDIATE (within 1 hour): Catches transient network failures
 *    - Success rate: ~15%
 *    - Stripe handles this automatically
 *
 * 2. NEXT DAY: After funds may have been deposited
 *    - Success rate: ~25%
 *    - Best time: 10 AM local time (after overnight deposits)
 *
 * 3. PAYDAY WINDOW: Around common paydays
 *    - Success rate: ~30%
 *    - Dates: 1st, 15th, last Friday of month
 *
 * 4. WEEKEND: Lower spend period, funds more available
 *    - Success rate: ~20%
 *    - Best time: Saturday morning
 */

export function getNextOptimalRetryTime(
  failureDate: Date,
  attemptNumber: number,
  userTimezone?: string
): Date {
  const tz = userTimezone ?? 'America/New_York';

  switch (attemptNumber) {
    case 1:
      // 4 hours after failure
      return new Date(failureDate.getTime() + 4 * 60 * 60 * 1000);

    case 2:
      // Next day at 10 AM user's local time
      return getNextLocalTime(failureDate, 10, 0, tz);

    case 3:
      // Next upcoming payday (1st or 15th)
      return getNextPayday(failureDate);

    case 4:
      // Next Saturday at 10 AM
      return getNextDayOfWeek(failureDate, 6, 10, 0, tz);

    default:
      // Weekly after that
      return new Date(failureDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
}

function getNextPayday(from: Date): Date {
  const day = from.getDate();
  const year = from.getFullYear();
  const month = from.getMonth();

  if (day < 1) return new Date(year, month, 1, 10, 0);
  if (day < 15) return new Date(year, month, 15, 10, 0);
  return new Date(year, month + 1, 1, 10, 0);
}

function getNextLocalTime(from: Date, hour: number, minute: number, tz: string): Date {
  const next = new Date(from.getTime() + 24 * 60 * 60 * 1000);
  next.setHours(hour, minute, 0, 0);
  return next;
}

function getNextDayOfWeek(
  from: Date, dayOfWeek: number, hour: number, minute: number, tz: string
): Date {
  const result = new Date(from);
  result.setDate(result.getDate() + ((dayOfWeek - result.getDay() + 7) % 7 || 7));
  result.setHours(hour, minute, 0, 0);
  return result;
}
```

---

## 7. Dunning Analytics and Tracking

### Metrics to Track

```typescript
// src/lib/billing/dunning/metrics.ts

export interface DunningMetrics {
  // Overall recovery
  totalFailedPayments: number;
  totalRecovered: number;
  recoveryRate: number; // recovered / failed

  // By recovery method
  recoveredBySmartRetry: number;
  recoveredByCardUpdate: number;
  recoveredByDunningEmail: number;
  recoveredByInAppPrompt: number;
  recoveredByPortalUpdate: number;

  // Timing
  averageRecoveryTimeHours: number;
  medianRecoveryTimeHours: number;
  recoveryByDay: Record<number, number>; // day in sequence -> recovery count

  // Financial
  revenueAtRisk: number;
  revenueRecovered: number;
  revenueLost: number;

  // Churn impact
  involuntaryChurnRate: number;
  involuntaryChurnPrevented: number;
}

export async function calculateDunningMetrics(
  period: { start: Date; end: Date }
): Promise<DunningMetrics> {
  const sequences = await prisma.dunningSequence.findMany({
    where: {
      startedAt: { gte: period.start, lte: period.end },
    },
    include: {
      user: { select: { currentPlan: true, billingPeriod: true } },
    },
  });

  const totalFailed = sequences.length;
  const recovered = sequences.filter(s => s.status === 'RESOLVED');
  const lost = sequences.filter(s => s.status === 'FAILED');

  const recoveryTimes = recovered.map(s =>
    (s.resolvedAt!.getTime() - s.startedAt.getTime()) / (60 * 60 * 1000)
  );

  return {
    totalFailedPayments: totalFailed,
    totalRecovered: recovered.length,
    recoveryRate: totalFailed > 0 ? recovered.length / totalFailed : 0,

    recoveredBySmartRetry: recovered.filter(s => s.resolution === 'SMART_RETRY').length,
    recoveredByCardUpdate: recovered.filter(s => s.resolution === 'CARD_UPDATER').length,
    recoveredByDunningEmail: recovered.filter(s => s.resolution === 'EMAIL_UPDATE').length,
    recoveredByInAppPrompt: recovered.filter(s => s.resolution === 'IN_APP_UPDATE').length,
    recoveredByPortalUpdate: recovered.filter(s => s.resolution === 'PORTAL_UPDATE').length,

    averageRecoveryTimeHours: recoveryTimes.length > 0
      ? recoveryTimes.reduce((a, b) => a + b, 0) / recoveryTimes.length
      : 0,
    medianRecoveryTimeHours: recoveryTimes.length > 0
      ? recoveryTimes.sort((a, b) => a - b)[Math.floor(recoveryTimes.length / 2)]
      : 0,
    recoveryByDay: calculateRecoveryByDay(recovered),

    revenueAtRisk: sequences.reduce((sum, s) => sum + getMonthlyAmount(s.user), 0),
    revenueRecovered: recovered.reduce((sum, s) => sum + getMonthlyAmount(s.user), 0),
    revenueLost: lost.reduce((sum, s) => sum + getMonthlyAmount(s.user), 0),

    involuntaryChurnRate: totalFailed > 0 ? lost.length / totalFailed : 0,
    involuntaryChurnPrevented: recovered.length,
  };
}
```

### SQL Queries for Dunning Dashboard

```sql
-- Recovery rate over time (weekly)
SELECT
  date_trunc('week', started_at) AS week,
  COUNT(*) AS total_failed,
  COUNT(*) FILTER (WHERE status = 'RESOLVED') AS recovered,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'RESOLVED')::numeric / NULLIF(COUNT(*), 0) * 100, 1
  ) AS recovery_rate_pct
FROM dunning_sequences
WHERE started_at >= NOW() - INTERVAL '12 weeks'
GROUP BY 1
ORDER BY 1;

-- Revenue at risk vs recovered (monthly)
SELECT
  date_trunc('month', ds.started_at) AS month,
  SUM(
    CASE u.current_plan
      WHEN 'STARTER' THEN 19.99
      WHEN 'PLUS' THEN 49.99
      WHEN 'SMART' THEN CASE u.billing_period WHEN 'ANNUAL' THEN 84.99 ELSE 99.99 END
      WHEN 'PRO' THEN CASE u.billing_period WHEN 'ANNUAL' THEN 170.00 ELSE 200.00 END
      ELSE 0
    END
  ) AS revenue_at_risk,
  SUM(
    CASE WHEN ds.status = 'RESOLVED' THEN
      CASE u.current_plan
        WHEN 'STARTER' THEN 19.99
        WHEN 'PLUS' THEN 49.99
        WHEN 'SMART' THEN CASE u.billing_period WHEN 'ANNUAL' THEN 84.99 ELSE 99.99 END
        WHEN 'PRO' THEN CASE u.billing_period WHEN 'ANNUAL' THEN 170.00 ELSE 200.00 END
        ELSE 0
      END
    ELSE 0 END
  ) AS revenue_recovered
FROM dunning_sequences ds
JOIN users u ON u.id = ds.user_id
WHERE ds.started_at >= NOW() - INTERVAL '6 months'
GROUP BY 1
ORDER BY 1;

-- Most effective dunning step
SELECT
  resolution,
  COUNT(*) AS recoveries,
  AVG(EXTRACT(EPOCH FROM (resolved_at - started_at)) / 3600) AS avg_hours_to_recovery
FROM dunning_sequences
WHERE status = 'RESOLVED'
  AND started_at >= NOW() - INTERVAL '3 months'
GROUP BY 1
ORDER BY 2 DESC;

-- Decline code distribution
SELECT
  last_decline_code,
  COUNT(*) AS occurrences,
  COUNT(*) FILTER (WHERE status = 'RESOLVED') AS recovered,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'RESOLVED')::numeric / NULLIF(COUNT(*), 0) * 100, 1
  ) AS recovery_rate_pct
FROM dunning_sequences
WHERE started_at >= NOW() - INTERVAL '3 months'
GROUP BY 1
ORDER BY 2 DESC;
```

---

## 8. Revenue Recovery Tools from Stripe

### Stripe Revenue Recovery

Stripe offers built-in revenue recovery features that complement custom dunning:

1. **Smart Retries**: ML-powered retry timing (already covered above)
2. **Automatic Card Updater**: Updates expired/replaced card details
3. **Adaptive Acceptance**: Routes transactions to maximize approval rates
4. **3D Secure optimization**: Only triggers 3DS when needed, reducing friction

```typescript
// Check if a customer has Stripe's automatic card updates enabled
// This is account-level, not per-customer, but you can verify results:
export async function checkRecoveryStatus(customerId: string): Promise<{
  cardUpdaterActive: boolean;
  smartRetriesActive: boolean;
  recentRecoveries: number;
}> {
  // Check recent payment intents for recovery patterns
  const recentPayments = await stripe.paymentIntents.list({
    customer: customerId,
    limit: 10,
  });

  const recoveries = recentPayments.data.filter(pi => {
    // Payment succeeded after initially failing
    const attempts = pi.charges?.data ?? [];
    return attempts.length > 1 && pi.status === 'succeeded';
  });

  return {
    cardUpdaterActive: true, // Account-level setting
    smartRetriesActive: true, // Account-level setting
    recentRecoveries: recoveries.length,
  };
}
```

### Stripe Billing Insights

```typescript
// Access Stripe's billing analytics via API
export async function getStripeRecoveryInsights(): Promise<void> {
  // Stripe Sigma (SQL) queries for revenue recovery
  // Note: Requires Stripe Sigma subscription

  // Alternative: Use the Stripe Dashboard API
  // Dashboard > Revenue recovery shows:
  // - Smart Retries recovered revenue
  // - Card updater recovered revenue
  // - Recovery rate trends
  // - Failure reason breakdown
}
```

---

## 9. Webhook Handling for Dunning Events

```typescript
// src/app/api/webhooks/stripe/dunning-handlers.ts

export async function handleInvoicePaymentFailed(
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
    console.error(`No user found for Stripe customer ${customerId}`);
    return;
  }

  const attemptCount = invoice.attempt_count;
  const nextAttempt = invoice.next_payment_attempt
    ? new Date(invoice.next_payment_attempt * 1000)
    : null;

  // Get decline code from the latest charge
  const charge = invoice.charge;
  let declineCode = 'unknown';
  if (charge && typeof charge === 'string') {
    const chargeObj = await stripe.charges.retrieve(charge);
    declineCode = chargeObj.failure_code ?? chargeObj.outcome?.reason ?? 'unknown';
  }

  console.log(`Payment failed for user ${user.id}: attempt ${attemptCount}, reason: ${declineCode}`);

  if (attemptCount === 1) {
    // First failure — initiate dunning
    await initiateDunningSequence(user.id, invoice.id, declineCode);

    // Update user status
    await prisma.user.update({
      where: { id: user.id },
      data: { subscriptionStatus: 'PAST_DUE' },
    });
  } else {
    // Subsequent failure — escalate dunning
    await escalateDunning(user.id, attemptCount, declineCode);
  }

  // Log for analytics
  await prisma.paymentEvent.create({
    data: {
      userId: user.id,
      type: 'PAYMENT_FAILED',
      invoiceId: invoice.id,
      attemptCount,
      declineCode,
      amount: invoice.amount_due,
      nextRetryAt: nextAttempt,
    },
  });
}

export async function handleInvoicePaymentSucceeded(
  invoice: Stripe.Invoice
): Promise<void> {
  const customerId = typeof invoice.customer === 'string'
    ? invoice.customer
    : invoice.customer?.id;

  if (!customerId) return;

  const user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!user) return;

  // Check if this resolves an active dunning sequence
  if (user.subscriptionStatus === 'PAST_DUE') {
    await handlePaymentRecovered(user.id, invoice.id);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionStatus: 'ACTIVE',
        currentPeriodEnd: new Date(invoice.period_end * 1000),
      },
    });
  }

  // Log successful payment
  await prisma.paymentEvent.create({
    data: {
      userId: user.id,
      type: 'PAYMENT_SUCCEEDED',
      invoiceId: invoice.id,
      amount: invoice.amount_paid,
    },
  });
}
```

---

## 10. Retention Offers During Dunning

### Dynamic Discount Strategy

When a user's payment fails, offering a discount can prevent churn. But the discount should be proportional to the user's value:

```typescript
// src/lib/billing/dunning/retention-offers.ts

export function calculateRetentionOffer(user: DunningUser): RetentionOffer | null {
  const lifetimeValue = user.totalPayments;
  const tenure = monthsSince(user.createdAt);
  const engagementScore = calculateEngagementScore(user);

  // High-value customers get better offers
  if (lifetimeValue > 500 || tenure > 6) {
    return {
      type: 'percent_off',
      value: 25,
      duration: 3, // months
      code: `COMEBACK25_${user.id.slice(-6)}`,
      message: "We'd hate to lose you. Here's 25% off your next 3 months.",
    };
  }

  if (lifetimeValue > 100 || tenure > 3) {
    return {
      type: 'percent_off',
      value: 15,
      duration: 1,
      code: `STAY15_${user.id.slice(-6)}`,
      message: "Let's keep your access going — 15% off next month.",
    };
  }

  // New or low-engagement users — no discount, just make update easy
  if (engagementScore < 0.3) {
    return null;
  }

  // Medium engagement — small offer
  return {
    type: 'amount_off',
    value: 500, // $5.00
    duration: 1,
    code: `SAVE5_${user.id.slice(-6)}`,
    message: "Here's $5 off your next payment to make updating your card worth it.",
  };
}

function calculateEngagementScore(user: DunningUser): number {
  // 0-1 score based on activity
  const factors = [
    user.totalConversations > 10 ? 0.3 : user.totalConversations * 0.03,
    user.lastActiveAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? 0.3 : 0,
    user.bestieConfigured ? 0.2 : 0,
    user.referralsMade > 0 ? 0.2 : 0,
  ];
  return Math.min(1, factors.reduce((a, b) => a + b, 0));
}
```

---

## Summary

Payment recovery and dunning for Stone AI encompasses:

1. **Stripe Smart Retries** — ML-powered retry timing for optimal recovery
2. **Custom dunning email sequences** — 7-step branded email flow from gentle reminder to final notice
3. **In-app dunning UI** — Severity-based banners that make payment updates frictionless
4. **Payment method update flows** — Both custom (SetupIntent) and Stripe Portal options
5. **Pre-dunning prevention** — Proactive card expiry notifications before failures occur
6. **Involuntary churn analytics** — Tracking recovery rates, timing, and revenue impact
7. **Retry timing optimization** — Aligning retries with paydays and low-spend windows
8. **Dynamic retention offers** — Value-based discounts during the dunning sequence
9. **Webhook-driven automation** — All dunning events triggered by Stripe webhook events
10. **Revenue impact modeling** — Quantifying the financial value of dunning improvements

The goal is simple: never lose a customer who wanted to stay. Every failed payment is recoverable if you reach the customer quickly enough, make updating their payment method effortless, and remind them what they'll lose.
