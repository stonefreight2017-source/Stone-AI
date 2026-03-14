# Affiliate Revenue Tracking — Stone AI Ecosystem

## Seed Classification
- **Domain**: Revenue Operations / Partner Payments
- **Complexity**: Advanced
- **Stack**: Next.js 16, TypeScript, Stripe Connect, Prisma 7.4
- **Applies To**: Stone AI (referral payouts), Stone AI Tools (affiliate program)

---

## 1. Affiliate Program Architecture

### Overview

An affiliate program turns external advocates (influencers, bloggers, developers, power users) into a paid sales force. Affiliates promote Stone AI using tracked links, and earn commission on every customer they bring in. Unlike a referral program (user-to-user, typically rewarded with product credits), an affiliate program involves monetary payouts, requires tax compliance, and needs robust tracking infrastructure.

### Affiliate vs. Referral: Key Differences

| Aspect | Referral Program | Affiliate Program |
|--------|-----------------|------------------|
| Participants | Existing users | Anyone (users, influencers, bloggers) |
| Reward | Product credits, free months | Cash (real money) |
| Complexity | Low | High (payments, tax, compliance) |
| Scale | Organic, moderate | Can scale to hundreds of affiliates |
| Tracking | Simple referral codes | Full attribution, cookie tracking |
| Payout | No cash involved | Monthly/quarterly cash payments |
| Tax implications | Minimal | 1099 reporting (US), international tax |

### System Architecture

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   AFFILIATE  │    │   STONE AI   │    │   STRIPE     │
│   (Partner)  │    │   (Platform) │    │   CONNECT    │
├──────────────┤    ├──────────────┤    ├──────────────┤
│ Gets link    │    │ Track clicks │    │ Hold funds   │
│ Promotes     │──→ │ Track signups│──→ │ Calculate    │
│ Earns comm.  │ ←──│ Track revenue│ ←──│ Pay out      │
│ Gets paid    │    │ Dashboard    │    │ Tax forms    │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## 2. Stripe Connect for Affiliate Payouts

### Why Stripe Connect

Stripe Connect handles the hardest parts of paying affiliates:
- **KYC/identity verification**: Stripe verifies affiliates (you don't have to)
- **Bank transfers**: Stripe handles ACH, wire, and international transfers
- **Tax reporting**: Stripe generates 1099s for US affiliates
- **Currency conversion**: Pays international affiliates in their local currency
- **Compliance**: Handles anti-money-laundering and sanctions screening

### Connect Account Types

| Type | Best For | Control | Onboarding |
|------|---------|---------|------------|
| Express | Most affiliates | Stripe-managed dashboard | Quick (Stripe-hosted) |
| Custom | Enterprise partners | You build the dashboard | Complex (you handle) |
| Standard | Independent businesses | Affiliate uses their Stripe | Medium |

**Recommendation**: Use Express accounts for all affiliates. Fast onboarding, Stripe handles the complexity, affiliates get a Stripe dashboard to track their earnings.

### Creating an Affiliate Connect Account

```typescript
// Create a Stripe Connect Express account for a new affiliate
async function createAffiliateAccount(affiliate: {
  email: string;
  name: string;
  country: string;
}): Promise<string> {
  const account = await stripe.accounts.create({
    type: 'express',
    email: affiliate.email,
    capabilities: {
      transfers: { requested: true },
    },
    business_type: 'individual',
    metadata: {
      affiliate_id: affiliate.email,
      program: 'stone-ai-affiliate',
    },
  });

  // Store the Connect account ID
  await prisma.affiliate.create({
    data: {
      email: affiliate.email,
      name: affiliate.name,
      country: affiliate.country,
      stripeConnectId: account.id,
      status: 'PENDING_ONBOARDING',
    },
  });

  return account.id;
}

// Generate onboarding link for the affiliate
async function getOnboardingLink(affiliateId: string): Promise<string> {
  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
  });

  const accountLink = await stripe.accountLinks.create({
    account: affiliate.stripeConnectId,
    refresh_url: `${APP_URL}/affiliate/onboarding?refresh=true`,
    return_url: `${APP_URL}/affiliate/dashboard`,
    type: 'account_onboarding',
  });

  return accountLink.url;
}
```

---

## 3. Commission Calculation

### Commission Structure

```typescript
// Commission rates by plan and type
const COMMISSION_RATES = {
  // One-time commission (paid on first successful payment)
  oneTime: {
    STARTER: 10.00,   // $10 per STARTER conversion
    PLUS: 25.00,      // $25 per PLUS conversion
    SMART: 50.00,     // $50 per SMART conversion
    PRO: 100.00,      // $100 per PRO conversion
  },

  // Recurring commission (paid monthly for 12 months)
  recurring: {
    rate: 0.15,        // 15% of monthly revenue
    duration: 12,      // Months of recurring commission
  },

  // Usage-based commission (Stone AI Tools)
  usage: {
    rate: 0.10,        // 10% of usage revenue
    duration: 12,      // Months
  },
};
```

### Commission Calculation Engine

```typescript
// Calculate commission for a conversion event
async function calculateCommission(event: {
  affiliateId: string;
  customerId: string;
  plan: PlanTier;
  amount: number;
  isFirstPayment: boolean;
  billingPeriod: 'monthly' | 'annual';
}): Promise<{
  oneTimeCommission: number;
  recurringCommission: number;
  totalCommission: number;
}> {
  const oneTimeCommission = event.isFirstPayment
    ? COMMISSION_RATES.oneTime[event.plan] || 0
    : 0;

  const recurringCommission = event.amount * COMMISSION_RATES.recurring.rate;

  // Check if within recurring commission window (12 months)
  const referral = await prisma.affiliateReferral.findFirst({
    where: {
      affiliateId: event.affiliateId,
      referredCustomerId: event.customerId,
    },
  });

  const monthsSinceReferral = referral
    ? differenceInMonths(new Date(), referral.createdAt)
    : 0;

  const activeRecurring = monthsSinceReferral < COMMISSION_RATES.recurring.duration
    ? recurringCommission
    : 0;

  return {
    oneTimeCommission,
    recurringCommission: activeRecurring,
    totalCommission: oneTimeCommission + activeRecurring,
  };
}
```

### Commission Data Model

```typescript
model Affiliate {
  id                String   @id @default(cuid())
  email             String   @unique
  name              String
  country           String
  stripeConnectId   String   @unique
  status            AffiliateStatus @default(PENDING_ONBOARDING)
  tier              AffiliateTier @default(STANDARD)
  referralCode      String   @unique
  referralLink      String   // Full URL with UTM params
  totalEarnings     Float    @default(0)
  pendingPayout     Float    @default(0)
  totalReferrals    Int      @default(0)
  totalConversions  Int      @default(0)
  createdAt         DateTime @default(now())

  referrals         AffiliateReferral[]
  commissions       AffiliateCommission[]
  payouts           AffiliatePayout[]
}

model AffiliateReferral {
  id                  String   @id @default(cuid())
  affiliateId         String
  referredCustomerId  String
  referredEmail       String
  status              ReferralStatus @default(PENDING)
  convertedPlan       PlanTier?
  clickedAt           DateTime
  signedUpAt          DateTime?
  convertedAt         DateTime?
  createdAt           DateTime @default(now())

  affiliate           Affiliate @relation(fields: [affiliateId], references: [id])

  @@unique([affiliateId, referredCustomerId])
}

model AffiliateCommission {
  id              String   @id @default(cuid())
  affiliateId     String
  referralId      String
  type            CommissionType // ONE_TIME, RECURRING, USAGE
  amount          Float
  revenueAmount   Float    // The original payment amount
  commissionRate  Float    // The rate applied
  status          CommissionStatus @default(PENDING)
  paidAt          DateTime?
  payoutId        String?
  createdAt       DateTime @default(now())

  affiliate       Affiliate @relation(fields: [affiliateId], references: [id])
}

model AffiliatePayout {
  id              String   @id @default(cuid())
  affiliateId     String
  amount          Float
  stripeTransferId String?
  status          PayoutStatus @default(PENDING)
  periodStart     DateTime
  periodEnd       DateTime
  commissionCount Int
  processedAt     DateTime?
  createdAt       DateTime @default(now())

  affiliate       Affiliate @relation(fields: [affiliateId], references: [id])
}

enum AffiliateStatus {
  PENDING_ONBOARDING
  ACTIVE
  PAUSED
  TERMINATED
}

enum AffiliateTier {
  STANDARD    // 15% recurring
  PREMIUM     // 20% recurring (top performers)
  ENTERPRISE  // Custom rates
}

enum CommissionStatus {
  PENDING     // Awaiting payout window
  APPROVED    // Approved for next payout
  PAID        // Paid out via Stripe Connect
  REVERSED    // Refund or chargeback reversed the commission
}

enum PayoutStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}
```

---

## 4. Revenue Sharing Implementation

### Processing Payouts via Stripe Connect

```typescript
// Monthly payout processing job
async function processMonthlyPayouts() {
  const affiliates = await prisma.affiliate.findMany({
    where: {
      status: 'ACTIVE',
      pendingPayout: { gte: 50 }, // Minimum $50 payout threshold
    },
  });

  for (const affiliate of affiliates) {
    try {
      // Get all approved commissions
      const commissions = await prisma.affiliateCommission.findMany({
        where: {
          affiliateId: affiliate.id,
          status: 'APPROVED',
        },
      });

      const totalAmount = commissions.reduce((sum, c) => sum + c.amount, 0);

      if (totalAmount < 50) continue; // Below minimum threshold

      // Create Stripe Transfer to affiliate's Connect account
      const transfer = await stripe.transfers.create({
        amount: Math.round(totalAmount * 100), // Cents
        currency: 'usd',
        destination: affiliate.stripeConnectId,
        description: `Stone AI Affiliate Payout — ${format(new Date(), 'MMMM yyyy')}`,
        metadata: {
          affiliate_id: affiliate.id,
          commission_count: commissions.length.toString(),
          period: format(new Date(), 'yyyy-MM'),
        },
      });

      // Create payout record
      const payout = await prisma.affilaitePayout.create({
        data: {
          affiliateId: affiliate.id,
          amount: totalAmount,
          stripeTransferId: transfer.id,
          status: 'COMPLETED',
          periodStart: startOfMonth(subMonths(new Date(), 1)),
          periodEnd: endOfMonth(subMonths(new Date(), 1)),
          commissionCount: commissions.length,
          processedAt: new Date(),
        },
      });

      // Update commission statuses
      await prisma.affiliateCommission.updateMany({
        where: {
          id: { in: commissions.map(c => c.id) },
        },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          payoutId: payout.id,
        },
      });

      // Update affiliate balance
      await prisma.affiliate.update({
        where: { id: affiliate.id },
        data: {
          pendingPayout: { decrement: totalAmount },
          totalEarnings: { increment: totalAmount },
        },
      });

      // Notify affiliate
      await sendAffiliatePayoutNotification(affiliate, totalAmount);

    } catch (error) {
      console.error(`Payout failed for affiliate ${affiliate.id}:`, error);
      await logPayoutFailure(affiliate.id, error);
    }
  }
}
```

### Handling Refunds and Chargebacks

When a referred customer gets a refund or files a chargeback, the affiliate commission must be reversed:

```typescript
// Handle refund → reverse commission
async function handleRefundedReferral(event: {
  customerId: string;
  refundAmount: number;
}) {
  // Find the affiliate who referred this customer
  const referral = await prisma.affiliateReferral.findFirst({
    where: { referredCustomerId: event.customerId },
    include: { affiliate: true },
  });

  if (!referral) return; // Not an affiliate referral

  // Find unpaid commissions for this referral and reverse them
  const commissions = await prisma.affiliateCommission.findMany({
    where: {
      referralId: referral.id,
      status: { in: ['PENDING', 'APPROVED'] },
    },
  });

  for (const commission of commissions) {
    await prisma.affiliateCommission.update({
      where: { id: commission.id },
      data: { status: 'REVERSED' },
    });

    await prisma.affiliate.update({
      where: { id: referral.affiliateId },
      data: { pendingPayout: { decrement: commission.amount } },
    });
  }

  // If commission was already paid, create a negative adjustment
  const paidCommissions = await prisma.affiliateCommission.findMany({
    where: {
      referralId: referral.id,
      status: 'PAID',
    },
  });

  if (paidCommissions.length > 0) {
    const totalPaid = paidCommissions.reduce((sum, c) => sum + c.amount, 0);
    await prisma.affiliateCommission.create({
      data: {
        affiliateId: referral.affiliateId,
        referralId: referral.id,
        type: 'REVERSAL',
        amount: -totalPaid,
        revenueAmount: -event.refundAmount,
        commissionRate: 0,
        status: 'APPROVED', // Will be deducted from next payout
      },
    });
  }
}
```

---

## 5. Affiliate Dashboard

### Dashboard Design

```
┌──────────────────────────────────────────────────┐
│  AFFILIATE DASHBOARD — [Affiliate Name]           │
├──────────────────────────────────────────────────┤
│                                                   │
│  Your Link: stone-ai.net/a/[code]  [Copy]        │
│                                                   │
│  ┌──────────┬──────────┬──────────┬──────────┐  │
│  │  Clicks  │ Signups  │Conversions│ Earnings │  │
│  │  1,234   │   189    │    47     │ $2,350   │  │
│  │  ↑12%    │  ↑8%     │   ↑15%   │  ↑18%   │  │
│  └──────────┴──────────┴──────────┴──────────┘  │
│                                                   │
│  Pending Payout: $485.00                          │
│  Next Payout: April 1, 2026                       │
│  Min. threshold: $50.00                           │
│                                                   │
│  Recent Conversions:                              │
│  ├── Mar 8: SMART plan signup — $50.00 + $15/mo  │
│  ├── Mar 6: STARTER plan signup — $10.00 + $3/mo │
│  ├── Mar 3: PLUS plan signup — $25.00 + $7.50/mo │
│  └── [View All]                                   │
│                                                   │
│  Monthly Performance:                             │
│  ┌─────────────────────────────────────────┐     │
│  │ [Revenue chart — last 6 months]          │     │
│  └─────────────────────────────────────────┘     │
│                                                   │
│  Resources:                                       │
│  [Marketing Assets] [Brand Guidelines] [Help]     │
│                                                   │
└──────────────────────────────────────────────────┘
```

---

## 6. Tax Compliance

### US Tax Reporting (1099)

For US affiliates earning $600+ in a calendar year, you must issue a 1099-NEC. Stripe Connect handles this automatically for Express accounts:

```typescript
// Stripe Connect handles:
// 1. Collecting W-9 equivalent information during onboarding
// 2. Verifying TIN (Tax Identification Number)
// 3. Generating 1099-NEC forms annually
// 4. E-filing with the IRS
// 5. Delivering tax forms to affiliates

// Your responsibility:
// - Ensure Stripe Connect tax reporting is enabled
// - Review generated 1099s before filing deadline (Jan 31)
// - Handle affiliate inquiries about tax forms
```

### International Affiliates

For international affiliates:
- Stripe handles currency conversion and international bank transfers
- No 1099 required for non-US persons (but may need W-8BEN form)
- Affiliates are responsible for reporting income in their country
- Withholding requirements vary by country and tax treaty

### Fraud Prevention

```typescript
// Affiliate fraud detection
const fraudChecks = {
  // Self-referral detection
  sameEmail: (affiliate: Affiliate, referral: AffiliateReferral) =>
    affiliate.email.split('@')[1] === referral.referredEmail.split('@')[1],

  // Click fraud (excessive clicks, low conversion)
  clickFraud: (affiliate: Affiliate) =>
    affiliate.totalReferrals > 1000 && affiliate.totalConversions < 5,

  // Cookie stuffing detection (referral without genuine click)
  cookieStuffing: (referral: AffiliateReferral) =>
    !referral.clickedAt || referral.signedUpAt.getTime() - referral.clickedAt.getTime() < 1000,

  // Refund pattern (high refund rate on referred customers)
  refundPattern: async (affiliateId: string) => {
    const referrals = await prisma.affiliateReferral.count({
      where: { affiliateId, status: 'CONVERTED' },
    });
    const refunded = await prisma.affiliateCommission.count({
      where: { affiliateId, status: 'REVERSED' },
    });
    return refunded / Math.max(referrals, 1) > 0.2; // >20% refund rate
  },
};
```
