# Billing Edge Cases — Stone AI Palace Knowledge Seed

## Seed Classification
- **Domain**: Revenue Operations / Billing Engineering
- **Complexity**: Advanced
- **Stack**: Next.js 16, TypeScript, Stripe Billing, Prisma 7.4
- **Applies To**: Stone AI, Best AI, Stone AI Tools

---

## 1. Why Edge Cases Matter in Billing

Billing edge cases are where money gets lost, customers get angry, and support tickets multiply. A billing system that handles the "happy path" only covers about 70% of real-world scenarios. The other 30% — timezone mismatches, mid-cycle plan changes, currency conversion, tax complications, refund loops, disputed charges — these are the scenarios that determine whether your billing system is production-grade or a ticking time bomb.

Every edge case described in this seed has happened to real SaaS companies and cost them real revenue. Stone AI's billing implementation must account for all of them.

---

## 2. Timezone Issues

### The Problem

Stripe operates in UTC. Your users are in every timezone. When a subscription's billing period ends at midnight UTC, a user in San Francisco sees it as 4 PM. A user in Tokyo sees it as 9 AM the next day. This creates confusion about when charges happen, when access changes, and when billing periods start/end.

### Specific Scenarios

**Scenario 1: "I was charged for tomorrow"**
A user in UTC-8 (PST) sees a charge on their bank statement dated the "next day" because Stripe generated the invoice at 12:01 AM UTC, which is 4:01 PM the previous day in PST. The user thinks they were charged a day early.

**Solution:**
```typescript
// Always display dates in the user's timezone
import { formatInTimeZone } from 'date-fns-tz';

export function formatBillingDate(
  utcDate: Date,
  userTimezone: string = 'America/New_York'
): string {
  return formatInTimeZone(utcDate, userTimezone, 'MMMM d, yyyy');
}

// In billing UI, always show timezone
export function formatBillingDateWithTZ(
  utcDate: Date,
  userTimezone: string
): string {
  return formatInTimeZone(
    utcDate,
    userTimezone,
    "MMMM d, yyyy 'at' h:mm a zzz"
  );
}
```

**Scenario 2: Trial ends "early"**
A user starts a 7-day trial at 11 PM their local time. The trial starts at 6 AM UTC the next day. Seven days later, the trial ends at 6 AM UTC, which is 11 PM the sixth day in their timezone. The user perceives they only got 6 days.

**Solution:**
```typescript
// When displaying trial end dates, round UP to end of day in user's timezone
export function getTrialEndDisplay(
  trialEndUtc: Date,
  userTimezone: string
): Date {
  const inUserTz = utcToZonedTime(trialEndUtc, userTimezone);
  // If the trial ends before noon in user's tz, show previous day
  // If after noon, show that day
  // This prevents the "one day short" perception
  return inUserTz;
}

// Better approach: Always communicate trial length in terms of "until DATE"
// rather than "for N days"
export function getTrialMessage(trialEnd: Date, userTimezone: string): string {
  const displayDate = formatBillingDate(trialEnd, userTimezone);
  return `Your trial is active until ${displayDate}`;
}
```

**Scenario 3: Billing cycle boundary**
A user cancels at 11:55 PM their time. Their billing period ends at midnight UTC (which is a different date locally). The system processes the cancellation, but because it's technically the next billing period in UTC, the user is charged one more cycle.

**Solution:**
```typescript
// Always use Stripe's cancel_at_period_end instead of manual date calculations
export async function safeCancellation(subscriptionId: string): Promise<void> {
  // This ALWAYS cancels at the correct period end, regardless of timezone
  await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
  // Never try to calculate period boundaries yourself — let Stripe handle it
}
```

---

## 3. Currency Conversion

### Stone AI's Currency Strategy

Stone AI bills exclusively in USD. This simplifies pricing, tax calculation, and revenue reporting. But international users pay in their local currency through their bank's conversion.

### Edge Cases

**Scenario: Fluctuating exchange rates**
A user in the EU sees $99.99/month but their bank converts it differently each month. One month they pay EUR 91, the next EUR 95. They see inconsistent charges and think Stone AI is changing their price.

**Solution:**
```typescript
// Display a notice for non-USD users
export function getCurrencyNotice(userCountry: string): string | null {
  if (userCountry === 'US') return null;

  return 'Stone AI bills in USD. Your bank may convert the charge to your local currency ' +
    'at the current exchange rate. The exact amount in your local currency may vary ' +
    'slightly between billing cycles.';
}
```

**Scenario: Double conversion fees**
Some banks charge a foreign transaction fee (typically 1-3%) on top of the conversion. A $19.99 charge becomes $20.59 after the fee.

**Mitigation:** Consider supporting multi-currency pricing in the future via Stripe's multi-currency support. For now, mention potential fees in the checkout flow.

---

## 4. Tax Compliance with Stripe Tax

### Stripe Tax Integration

```typescript
// src/lib/stripe/tax-config.ts

/**
 * Stripe Tax automatically calculates and collects the correct tax
 * based on the customer's location. This handles:
 * - US sales tax (varies by state)
 * - EU VAT (varies by country, reverse charge for B2B)
 * - Canadian GST/HST/PST
 * - Australian GST
 * - And 40+ other jurisdictions
 */

// Enable Stripe Tax on checkout sessions
export function createTaxEnabledCheckout(
  params: Stripe.Checkout.SessionCreateParams
): Stripe.Checkout.SessionCreateParams {
  return {
    ...params,
    automatic_tax: { enabled: true },
    // Tax ID collection for B2B (EU VAT reverse charge)
    tax_id_collection: { enabled: true },
    // Collect billing address for tax calculation
    billing_address_collection: 'required',
    // Update customer address from checkout
    customer_update: {
      address: 'auto',
      name: 'auto',
    },
  };
}

// For programmatic subscription creation
export function createTaxEnabledSubscription(
  params: Stripe.SubscriptionCreateParams
): Stripe.SubscriptionCreateParams {
  return {
    ...params,
    automatic_tax: { enabled: true },
  };
}
```

### Tax Edge Cases

**Scenario: EU customer with VAT number**
An EU business customer provides a VAT number. Under reverse charge rules, they shouldn't be charged VAT. Stripe Tax handles this automatically when `tax_id_collection` is enabled.

```typescript
// Verifying a tax ID programmatically
export async function verifyTaxId(
  customerId: string,
  type: string,
  value: string
): Promise<{ verified: boolean; status: string }> {
  const taxId = await stripe.customers.createTaxId(customerId, {
    type: type as Stripe.CustomerCreateTaxIdParams.Type,
    value,
  });

  // Tax IDs are verified asynchronously
  // Listen for customer.tax_id.updated webhook
  return {
    verified: taxId.verification?.status === 'verified',
    status: taxId.verification?.status ?? 'pending',
  };
}
```

**Scenario: US nexus thresholds**
Stone AI only has nexus (tax obligation) in states where it has economic presence. Initially this might just be the founder's state. As revenue grows, economic nexus thresholds (typically $100K in sales or 200 transactions) trigger obligations in other states.

```typescript
// Stripe Tax handles nexus automatically — it tracks where you
// need to collect tax based on your registration settings.
// Configure tax registrations in Stripe Dashboard > Tax > Registrations

// Monitor approaching nexus thresholds
export async function checkNexusThresholds(): Promise<{
  state: string;
  revenue: number;
  transactions: number;
  thresholdApproaching: boolean;
}[]> {
  // Query revenue by state from Stripe
  // Alert when approaching $100K or 200 transactions
  const stateRevenue = await prisma.$queryRaw<any[]>`
    SELECT
      u.state,
      SUM(pe.amount) / 100.0 AS revenue,
      COUNT(*) AS transaction_count
    FROM payment_events pe
    JOIN users u ON u.id = pe.user_id
    WHERE pe.type = 'PAYMENT_SUCCEEDED'
      AND pe.created_at >= date_trunc('year', CURRENT_DATE)
    GROUP BY u.state
    HAVING SUM(pe.amount) / 100.0 > 80000 -- Alert at 80% of threshold
       OR COUNT(*) > 160
  `;

  return stateRevenue.map(s => ({
    state: s.state,
    revenue: s.revenue,
    transactions: s.transaction_count,
    thresholdApproaching: s.revenue > 80000 || s.transaction_count > 160,
  }));
}
```

**Scenario: Tax-inclusive vs tax-exclusive pricing**
Stone AI prices are tax-exclusive (the posted price + tax = total charge). Some jurisdictions require tax-inclusive pricing to be displayed. Handle this in the UI:

```typescript
export function getDisplayPrice(
  basePrice: number,
  userCountry: string,
  userState?: string
): { displayPrice: number; taxNote: string; taxInclusive: boolean } {
  // For now, Stone AI always shows tax-exclusive prices
  // with a note that tax may be added at checkout
  return {
    displayPrice: basePrice,
    taxNote: 'Plus applicable taxes',
    taxInclusive: false,
  };

  // Future: For EU users, consider showing tax-inclusive prices
  // This requires knowing the user's exact tax rate before they reach checkout
}
```

---

## 5. Proration Edge Cases

### Mid-Cycle Upgrade with Existing Promo

A user on STARTER ($19.99/mo) with a 50% off coupon upgrades to PLUS ($49.99/mo) mid-cycle. The proration calculation needs to account for the coupon discount.

```typescript
// Stripe handles this correctly IF the coupon is applied at the subscription level.
// The proration credit for unused STARTER time uses the discounted price.
// The proration charge for remaining PLUS time uses the undiscounted price
// (unless the coupon applies to the new plan too).

// To preview the correct proration:
export async function previewProrationWithCoupon(
  subscriptionId: string,
  newPriceId: string
): Promise<{
  credit: number;
  charge: number;
  netCharge: number;
  couponApplied: boolean;
}> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const currentItem = subscription.items.data[0];

  const preview = await stripe.invoices.retrieveUpcoming({
    customer: subscription.customer as string,
    subscription: subscriptionId,
    subscription_items: [{ id: currentItem.id, price: newPriceId }],
    subscription_proration_behavior: 'create_prorations',
  });

  const prorationLines = preview.lines.data.filter(l => l.proration);
  const credit = prorationLines
    .filter(l => l.amount < 0)
    .reduce((sum, l) => sum + Math.abs(l.amount), 0);
  const charge = prorationLines
    .filter(l => l.amount > 0)
    .reduce((sum, l) => sum + l.amount, 0);

  return {
    credit: credit / 100,
    charge: charge / 100,
    netCharge: (charge - credit) / 100,
    couponApplied: !!subscription.discount,
  };
}
```

### Multiple Plan Changes in One Billing Cycle

A user upgrades from STARTER to PLUS, then upgrades again to SMART in the same billing cycle. Stripe generates proration adjustments for both changes, which can confuse users.

```typescript
// Solution: Rate-limit plan changes to 1 per 24 hours
export async function canChangePlan(userId: string): Promise<{
  allowed: boolean;
  nextAllowedAt?: Date;
  reason?: string;
}> {
  const recentChange = await prisma.planChangeLog.findFirst({
    where: {
      userId,
      createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (recentChange) {
    const nextAllowed = new Date(recentChange.createdAt.getTime() + 24 * 60 * 60 * 1000);
    return {
      allowed: false,
      nextAllowedAt: nextAllowed,
      reason: 'Plan changes are limited to once per 24 hours. You can change your plan again on ' +
        formatBillingDate(nextAllowed, 'America/New_York'),
    };
  }

  return { allowed: true };
}
```

### Proration on Very Short Billing Periods

If a user upgrades on the last day of their billing cycle, the proration charge is tiny (1/30th of the price difference). But the credit for the old plan is also tiny. The net effect can be confusing — they see a $1.50 charge and a $0.67 credit.

```typescript
// Solution: If upgrade happens within last 3 days of cycle, defer to next cycle
export async function shouldDeferUpgrade(
  subscriptionId: string
): Promise<{ defer: boolean; currentPeriodEnd: Date }> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const periodEnd = new Date(subscription.current_period_end * 1000);
  const daysRemaining = (periodEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000);

  return {
    defer: daysRemaining < 3,
    currentPeriodEnd: periodEnd,
  };
}
```

---

## 6. Refund Policies and Implementation

### Stone AI Refund Policy

```typescript
// src/lib/billing/refunds.ts
export const REFUND_POLICY = {
  // Full refund within first 48 hours of subscription
  fullRefundWindow: 48 * 60 * 60 * 1000, // 48 hours in ms

  // Prorated refund for cancellation in first billing cycle
  proratedRefundWindow: 30 * 24 * 60 * 60 * 1000, // 30 days

  // No refund after first billing cycle
  // Exception: service outage > 24 hours

  // Annual subscriptions: prorated refund for remaining months
  annualRefundPolicy: 'prorated',

  // Maximum refund amount per customer per year
  maxAnnualRefund: 1000, // $1,000
};

export async function processRefund(
  userId: string,
  reason: string,
  options: {
    amount?: number; // Specific amount (cents), or null for full refund
    chargeId?: string; // Specific charge, or null for latest
  } = {}
): Promise<{
  refunded: boolean;
  amount: number;
  refundId?: string;
  reason?: string;
}> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      stripeCustomerId: true,
      subscriptionId: true,
      subscriptionStatus: true,
      currentPlan: true,
      createdAt: true,
    },
  });

  if (!user.stripeCustomerId) {
    return { refunded: false, amount: 0, reason: 'No billing account' };
  }

  // Check refund eligibility
  const timeSinceSubscription = Date.now() - user.createdAt.getTime();
  const isWithinFullRefundWindow = timeSinceSubscription < REFUND_POLICY.fullRefundWindow;
  const isWithinProratedWindow = timeSinceSubscription < REFUND_POLICY.proratedRefundWindow;

  // Check annual refund cap
  const yearlyRefunds = await prisma.refundLog.aggregate({
    where: {
      userId,
      createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
    },
    _sum: { amount: true },
  });

  const yearlyRefundTotal = (yearlyRefunds._sum.amount ?? 0) / 100;
  if (yearlyRefundTotal >= REFUND_POLICY.maxAnnualRefund) {
    return {
      refunded: false,
      amount: 0,
      reason: 'Annual refund limit reached. Please contact support.',
    };
  }

  // Find the charge to refund
  let chargeId = options.chargeId;
  if (!chargeId) {
    const charges = await stripe.charges.list({
      customer: user.stripeCustomerId,
      limit: 1,
    });
    chargeId = charges.data[0]?.id;
  }

  if (!chargeId) {
    return { refunded: false, amount: 0, reason: 'No charges found to refund' };
  }

  const charge = await stripe.charges.retrieve(chargeId);
  let refundAmount: number;

  if (options.amount) {
    refundAmount = options.amount;
  } else if (isWithinFullRefundWindow) {
    refundAmount = charge.amount;
  } else if (isWithinProratedWindow) {
    // Prorated refund
    const daysUsed = Math.ceil(timeSinceSubscription / (24 * 60 * 60 * 1000));
    const daysInPeriod = 30;
    const unusedRatio = Math.max(0, (daysInPeriod - daysUsed) / daysInPeriod);
    refundAmount = Math.round(charge.amount * unusedRatio);
  } else {
    return { refunded: false, amount: 0, reason: 'Outside refund window' };
  }

  // Check against annual cap
  if ((yearlyRefundTotal * 100 + refundAmount) > REFUND_POLICY.maxAnnualRefund * 100) {
    refundAmount = Math.round((REFUND_POLICY.maxAnnualRefund - yearlyRefundTotal) * 100);
  }

  if (refundAmount <= 0) {
    return { refunded: false, amount: 0, reason: 'Calculated refund amount is zero' };
  }

  // Process the refund
  const refund = await stripe.refunds.create({
    charge: chargeId,
    amount: refundAmount,
    reason: 'requested_by_customer',
    metadata: {
      userId,
      reason,
      policy: isWithinFullRefundWindow ? 'full' : 'prorated',
    },
  });

  // Log the refund
  await prisma.refundLog.create({
    data: {
      userId,
      stripeRefundId: refund.id,
      chargeId,
      amount: refundAmount,
      reason,
      policy: isWithinFullRefundWindow ? 'FULL' : 'PRORATED',
    },
  });

  return {
    refunded: true,
    amount: refundAmount / 100,
    refundId: refund.id,
  };
}
```

---

## 7. Credit Balance Management

### Customer Credit System

Stripe supports customer credit balances, which can be used for:
- Refund alternatives (credit instead of cash refund)
- Service credits for outages
- Promotional credits
- Referral rewards

```typescript
// src/lib/billing/credits.ts

export async function addCredit(
  userId: string,
  amount: number, // in cents (positive = credit to customer)
  description: string,
  options: {
    type: 'service_credit' | 'promotional' | 'referral' | 'refund_credit';
    expiresAt?: Date;
  }
): Promise<{
  balance: number;
  transactionId: string;
}> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user.stripeCustomerId) {
    throw new Error('No Stripe customer for this user');
  }

  // Create a customer balance transaction
  // Negative amount = credit to the customer (reduces their next invoice)
  const transaction = await stripe.customers.createBalanceTransaction(
    user.stripeCustomerId,
    {
      amount: -Math.abs(amount), // Negative = credit
      currency: 'usd',
      description,
      metadata: {
        userId,
        type: options.type,
        expiresAt: options.expiresAt?.toISOString() ?? '',
      },
    }
  );

  // Track in our database
  await prisma.creditTransaction.create({
    data: {
      userId,
      stripeTransactionId: transaction.id,
      amount,
      type: options.type,
      description,
      expiresAt: options.expiresAt,
    },
  });

  // Get updated balance
  const customer = await stripe.customers.retrieve(user.stripeCustomerId);
  const balance = (customer as Stripe.Customer).balance;

  return {
    balance: Math.abs(balance) / 100, // Convert to positive dollars
    transactionId: transaction.id,
  };
}

export async function getCustomerBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (!user.stripeCustomerId) return 0;

  const customer = await stripe.customers.retrieve(user.stripeCustomerId);
  // Stripe balance: negative = customer has credit, positive = customer owes
  return Math.abs(Math.min(0, (customer as Stripe.Customer).balance)) / 100;
}
```

---

## 8. Dispute (Chargeback) Handling

### The Dispute Lifecycle

```
Customer disputes charge with their bank
       │
       ▼
Stripe creates dispute object, notifies via webhook
       │
       ▼
You have ~7-21 days to respond with evidence
       │
       ▼
Bank reviews evidence (30-90 days)
       │
       ├── Won: Charge stands, funds returned to you
       └── Lost: Charge reversed, dispute fee applies ($15)
```

### Webhook Handler for Disputes

```typescript
// src/lib/billing/disputes.ts

export async function handleDispute(dispute: Stripe.Dispute): Promise<void> {
  const chargeId = typeof dispute.charge === 'string'
    ? dispute.charge
    : dispute.charge.id;

  const charge = await stripe.charges.retrieve(chargeId);
  const customerId = typeof charge.customer === 'string'
    ? charge.customer
    : charge.customer?.id;

  const user = customerId
    ? await prisma.user.findFirst({ where: { stripeCustomerId: customerId } })
    : null;

  // Log the dispute
  await prisma.disputeLog.create({
    data: {
      userId: user?.id,
      stripeDisputeId: dispute.id,
      chargeId,
      amount: dispute.amount,
      reason: dispute.reason,
      status: dispute.status,
      evidenceDeadline: dispute.evidence_details?.due_by
        ? new Date(dispute.evidence_details.due_by * 1000)
        : null,
    },
  });

  // Alert the founder
  await sendFounderAlert({
    alertType: 'billing.dispute',
    title: `[DISPUTE] $${dispute.amount / 100} - ${dispute.reason}`,
    body: `
      Customer: ${user?.email ?? 'Unknown'}
      Amount: $${dispute.amount / 100}
      Reason: ${dispute.reason}
      Deadline: ${dispute.evidence_details?.due_by
        ? new Date(dispute.evidence_details.due_by * 1000).toISOString()
        : 'Unknown'}
      Stripe Dashboard: https://dashboard.stripe.com/disputes/${dispute.id}
    `,
  });

  // Auto-submit evidence if we have it
  if (user && dispute.status === 'needs_response') {
    await submitDisputeEvidence(dispute.id, user.id);
  }
}

async function submitDisputeEvidence(
  disputeId: string,
  userId: string
): Promise<void> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      createdAt: true,
      subscriptionStatus: true,
      currentPlan: true,
    },
  });

  // Gather evidence
  const loginHistory = await prisma.auditLog.findMany({
    where: { userId, action: 'LOGIN' },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  const conversationCount = await prisma.conversation.count({
    where: { userId },
  });

  const evidence: Stripe.DisputeUpdateParams.Evidence = {
    customer_name: user.name ?? undefined,
    customer_email_address: user.email,
    product_description: `Stone AI ${user.currentPlan} subscription - AI assistant platform with ${getAgentLimitForPlan(user.currentPlan)} specialized agents`,
    customer_purchase_ip: undefined, // Would need to log this
    access_activity_log: loginHistory.map(l =>
      `${l.createdAt.toISOString()} - ${l.action} from ${l.ipAddress}`
    ).join('\n'),
    service_date: user.createdAt.toISOString().split('T')[0],
    cancellation_policy: 'Cancel anytime. Full refund within 48 hours. Prorated refund within 30 days.',
    cancellation_policy_disclosure: 'Displayed on pricing page and checkout flow.',
    refund_policy: 'Full refund within 48 hours of subscription start. Prorated refund within first 30 days.',
    refund_policy_disclosure: 'Displayed on pricing page, checkout flow, and Terms of Service.',
  };

  await stripe.disputes.update(disputeId, { evidence });
}
```

### Dispute Prevention

```typescript
// Best practices to minimize disputes:

// 1. Clear billing descriptor
// In Stripe Dashboard > Settings > Public details > Statement descriptor
// Use "STONE AI" (max 22 chars) so users recognize the charge

// 2. Send receipt emails for every charge
// Stripe sends these automatically if enabled in Dashboard

// 3. Make cancellation easy
// Hidden cancellation flows cause more disputes than refund requests

// 4. Pre-charge notifications
// Send email 3 days before each charge
export async function sendPreChargeNotification(
  userId: string,
  amount: number,
  chargeDate: Date
): Promise<void> {
  await sendEmail(userId, 'UPCOMING_CHARGE', {
    amount: amount / 100,
    date: chargeDate,
    updatePaymentUrl: `${APP_URL}/billing/update-payment`,
    cancelUrl: `${APP_URL}/billing`,
  });
}
```

---

## 9. Mid-Cycle Changes and Their Complications

### Switching Billing Period Mid-Cycle

```typescript
// User on SMART Monthly ($99.99/mo) wants to switch to SMART Annual ($79.99/mo)
// at 15 days into their monthly cycle.

export async function switchBillingPeriod(
  userId: string,
  newPeriod: 'monthly' | 'annual'
): Promise<{
  effectiveDate: Date;
  creditApplied: number;
  newPrice: number;
}> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      subscriptionId: true,
      currentPlan: true,
      billingPeriod: true,
      stripeCustomerId: true,
    },
  });

  if (!user.subscriptionId) throw new Error('No subscription');

  const subscription = await stripe.subscriptions.retrieve(user.subscriptionId);
  const currentItem = subscription.items.data[0];
  const newPriceId = getPriceIdForPlan(user.currentPlan, newPeriod);

  if (newPeriod === 'annual') {
    // Monthly → Annual: Apply immediately, credit remaining monthly time
    const updated = await stripe.subscriptions.update(user.subscriptionId, {
      items: [{ id: currentItem.id, price: newPriceId }],
      proration_behavior: 'create_prorations',
    });

    // The first annual charge will be reduced by the credit from the unused monthly time
    const preview = await stripe.invoices.retrieveUpcoming({
      customer: user.stripeCustomerId!,
    });

    const creditLine = preview.lines.data.find(l => l.proration && l.amount < 0);
    const credit = creditLine ? Math.abs(creditLine.amount) / 100 : 0;

    return {
      effectiveDate: new Date(),
      creditApplied: credit,
      newPrice: newPeriod === 'annual'
        ? getAnnualPrice(user.currentPlan) ?? 0
        : getMonthlyPrice(user.currentPlan),
    };
  } else {
    // Annual → Monthly: Schedule for end of annual period
    // DO NOT apply immediately — user already paid for the year
    const periodEnd = new Date(subscription.current_period_end * 1000);

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

    return {
      effectiveDate: periodEnd,
      creditApplied: 0,
      newPrice: getMonthlyPrice(user.currentPlan),
    };
  }
}
```

### Coupon Changes Mid-Subscription

```typescript
// Applying or removing a coupon on an active subscription

export async function applyCouponToSubscription(
  subscriptionId: string,
  couponId: string
): Promise<void> {
  await stripe.subscriptions.update(subscriptionId, {
    coupon: couponId,
  });
  // The coupon applies starting from the NEXT invoice, not the current period
}

export async function removeCouponFromSubscription(
  subscriptionId: string
): Promise<void> {
  await stripe.subscriptions.deleteDiscount(subscriptionId);
  // Discount is removed; next invoice will be at full price
}

// Edge case: User has a "50% off for 3 months" coupon and upgrades mid-coupon
// The coupon continues on the new plan! A 50% off STARTER ($10/mo)
// becomes 50% off SMART ($50/mo) — probably not what you intended.

export async function handleUpgradeWithCoupon(
  subscription: Stripe.Subscription,
  newPlan: PlanTier
): Promise<void> {
  if (subscription.discount) {
    const coupon = subscription.discount.coupon;

    // Check if the coupon was plan-specific
    if (coupon.metadata?.plan && coupon.metadata.plan !== newPlan) {
      // Remove the plan-specific coupon on upgrade
      await stripe.subscriptions.deleteDiscount(subscription.id);
      console.log(`Removed plan-specific coupon ${coupon.id} on upgrade`);
    }
  }
}
```

---

## 10. Incomplete Subscription Handling

### What Causes Incomplete Subscriptions

An `incomplete` subscription occurs when the initial payment fails during subscription creation. This can happen with 3D Secure authentication, insufficient funds, or card declines.

```typescript
// src/lib/billing/incomplete-subs.ts

export async function handleIncompleteSubscription(
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = subscription.metadata?.userId;
  if (!userId) return;

  if (subscription.status === 'incomplete') {
    // Subscription was created but payment failed
    // The user has 23 hours to complete payment

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'INCOMPLETE',
        // Do NOT set currentPlan yet — payment hasn't succeeded
      },
    });

    await sendEmail(userId, 'SUBSCRIPTION_INCOMPLETE', {
      message: 'Your payment couldn\'t be processed. Please try again within 23 hours.',
      retryUrl: `${APP_URL}/billing/retry-payment?sub=${subscription.id}`,
    });
  }

  if (subscription.status === 'incomplete_expired') {
    // 23 hours passed without successful payment
    // Clean up the subscription record

    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionId: null,
        subscriptionStatus: 'FREE',
        currentPlan: 'FREE',
      },
    });

    // Delete the subscription in Stripe (can't recover it)
    try {
      await stripe.subscriptions.cancel(subscription.id);
    } catch {
      // May already be canceled
    }
  }
}
```

---

## 11. Race Conditions in Billing

### Double Subscription Prevention

```typescript
// Prevent creating two subscriptions for the same user
export async function safeCreateSubscription(
  userId: string,
  plan: PlanTier,
  period: string
): Promise<Stripe.Subscription> {
  // Use a database lock to prevent race conditions
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (user.subscriptionId) {
      // Check if the subscription is actually active in Stripe
      try {
        const existingSub = await stripe.subscriptions.retrieve(user.subscriptionId);
        if (['active', 'trialing', 'past_due'].includes(existingSub.status)) {
          throw new BillingError('ALREADY_SUBSCRIBED', 'User already has an active subscription');
        }
      } catch (e) {
        if ((e as any).code !== 'resource_missing') throw e;
        // Subscription doesn't exist in Stripe — clean up local state
      }
    }

    // Mark as "subscription in progress" to block concurrent attempts
    await tx.user.update({
      where: { id: userId },
      data: { subscriptionId: 'CREATING' },
    });

    return user;
  });

  try {
    const subscription = await createSubscription(
      result.stripeCustomerId!,
      getPriceIdForPlan(plan, period),
      { metadata: { userId, plan, period } }
    );

    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionId: subscription.id },
    });

    return subscription;
  } catch (error) {
    // Roll back the "CREATING" state
    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionId: null },
    });
    throw error;
  }
}
```

### Webhook Ordering Issues

```typescript
// Stripe doesn't guarantee webhook delivery order.
// You might receive subscription.updated BEFORE subscription.created.

export async function handleWebhookWithOrdering(
  event: Stripe.Event
): Promise<void> {
  const eventTimestamp = event.created;

  // Use idempotent processing
  const existing = await prisma.processedEvent.findUnique({
    where: { stripeEventId: event.id },
  });

  if (existing) {
    console.log(`Event ${event.id} already processed, skipping`);
    return;
  }

  // For subscription events, check if we have a newer event already processed
  if (event.type.startsWith('customer.subscription.')) {
    const subId = (event.data.object as Stripe.Subscription).id;
    const newerEvent = await prisma.processedEvent.findFirst({
      where: {
        resourceId: subId,
        eventType: { startsWith: 'customer.subscription.' },
        stripeTimestamp: { gt: eventTimestamp },
      },
    });

    if (newerEvent) {
      console.log(`Skipping stale event ${event.id} — newer event ${newerEvent.stripeEventId} exists`);
      await prisma.processedEvent.create({
        data: {
          stripeEventId: event.id,
          eventType: event.type,
          resourceId: subId,
          stripeTimestamp: eventTimestamp,
          skipped: true,
          skipReason: 'stale_event',
        },
      });
      return;
    }
  }

  // Process the event
  await processEvent(event);

  // Record as processed
  await prisma.processedEvent.create({
    data: {
      stripeEventId: event.id,
      eventType: event.type,
      resourceId: getResourceId(event),
      stripeTimestamp: eventTimestamp,
    },
  });
}
```

---

## Summary

This seed covers the billing edge cases that catch most SaaS companies off guard:

1. **Timezone issues** — Display dates in user timezone, avoid "charged early" perception
2. **Currency conversion** — USD-only billing with transparent communication about bank fees
3. **Tax compliance** — Stripe Tax integration, VAT reverse charges, nexus monitoring
4. **Proration edge cases** — Upgrades with coupons, multiple changes per cycle, short-period prorations
5. **Refund policies** — 48-hour full refund, 30-day prorated, annual cap enforcement
6. **Credit balance** — Service credits, promotional credits, referral rewards via Stripe balance
7. **Dispute handling** — Auto-evidence submission, founder alerts, prevention strategies
8. **Mid-cycle changes** — Period switching, coupon interactions, plan-specific coupon cleanup
9. **Incomplete subscriptions** — 23-hour recovery window, expiration cleanup
10. **Race conditions** — Double subscription prevention, webhook ordering, idempotent processing

Every edge case has production-ready TypeScript code and explanation of why the naive approach fails. The common thread: trust Stripe as the source of truth, handle every state transition explicitly, and never assume the happy path.
