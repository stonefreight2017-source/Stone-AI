# Multi-Product Billing — Three-Headed Monster Ecosystem

## Seed Classification
- **Domain**: Revenue Operations / Payment Infrastructure
- **Complexity**: Advanced
- **Stack**: Next.js 16, TypeScript, Stripe API, Prisma 7.4
- **Applies To**: Stone AI, Best AI Mobile, Stone AI Tools

---

## 1. Multi-Product Billing Architecture

### The Three-Product Challenge

The Three-Headed Monster operates three products with different billing models:
- **Stone AI**: Tier-based subscriptions (FREE/STARTER/PLUS/SMART/PRO)
- **Best AI Mobile**: Subscription via App Store/Google Play + potential direct billing
- **Stone AI Tools**: Usage-based API billing

Each product has its own pricing, billing cycle, and payment flow — but they share customers. A developer might use Stone AI for daily work, Best AI Mobile on their commute, and Stone AI Tools to build their product. Billing these three products independently creates friction, confusion, and churn. Unified multi-product billing creates a seamless experience that encourages ecosystem adoption.

### Stripe Product Architecture

```
Stripe Account (Stone AI Ecosystem)
├── Product: Stone AI
│   ├── Price: FREE ($0)
│   ├── Price: STARTER Monthly ($19.99/mo)
│   ├── Price: STARTER Annual ($16.99/mo)
│   ├── Price: PLUS Monthly ($49.99/mo)
│   ├── Price: PLUS Annual ($42.49/mo)
│   ├── Price: SMART Monthly ($99.99/mo)
│   ├── Price: SMART Annual ($84.99/mo)
│   ├── Price: PRO Monthly ($200/mo)
│   └── Price: PRO Annual ($170/mo)
├── Product: Best AI Mobile
│   ├── Price: Mobile Basic Monthly
│   ├── Price: Mobile Premium Monthly
│   └── Price: Mobile Annual
├── Product: Stone AI Tools
│   ├── Price: Tools Free Tier ($0, usage limits)
│   ├── Price: Tools Starter ($29/mo + usage)
│   ├── Price: Tools Pro ($99/mo + usage)
│   └── Price: Metered Usage (per-API-call pricing)
└── Coupons / Promo Codes
    ├── FIRST_MONTH_999 (Stone AI STARTER promo)
    ├── ECOSYSTEM_20 (20% off when subscribing to 2+ products)
    └── ANNUAL_SAVE (annual discount)
```

### Shared Customer Architecture

A single Stripe Customer object represents one person across all three products. This is critical for unified billing.

```typescript
// Prisma schema for multi-product billing
model User {
  id                String   @id @default(cuid())
  email             String   @unique
  clerkId           String   @unique
  stripeCustomerId  String?  @unique

  // Stone AI subscription
  stoneAiSubscriptionId     String?  @unique
  stoneAiPlan               PlanTier @default(FREE)
  stoneAiStatus             SubscriptionStatus @default(FREE)
  stoneAiBillingPeriod      BillingPeriod?

  // Best AI Mobile subscription (if direct billing, not App Store)
  mobileSubscriptionId      String?  @unique
  mobilePlan                MobilePlanTier?
  mobileStatus              SubscriptionStatus?

  // Stone AI Tools subscription
  toolsSubscriptionId       String?  @unique
  toolsPlan                 ToolsPlanTier?
  toolsStatus               SubscriptionStatus?
  toolsUsageThisMonth       Int      @default(0)

  // Unified billing
  activeProducts            String[] @default([]) // ["stone-ai", "mobile", "tools"]
  ecosystemDiscount         Boolean  @default(false)
  totalMonthlySpend         Float    @default(0)

  // ... other fields
}
```

### One Invoice, Multiple Products

Stripe supports multiple subscriptions per customer, each generating its own invoice. For a unified billing experience:

**Option A: Separate subscriptions, separate invoices (simpler)**
- Each product has its own subscription
- Customer receives separate invoices per product
- Pro: Simple implementation, independent billing cycles
- Con: Multiple charges on statement, confusing for customer

**Option B: Subscription with multiple items (recommended)**
- One subscription with multiple line items (one per product)
- Single invoice per billing cycle
- Pro: One charge, one invoice, clear billing
- Con: All products must share billing cycle

```typescript
// Creating a multi-product subscription
const subscription = await stripe.subscriptions.create({
  customer: user.stripeCustomerId,
  items: [
    { price: 'price_stone_ai_smart_monthly' },  // Stone AI SMART
    { price: 'price_tools_starter_monthly' },     // Tools Starter
    // Mobile billing handled via App Store/Play Store typically
  ],
  // Apply ecosystem discount if subscribing to 2+ products
  coupon: items.length >= 2 ? 'ECOSYSTEM_20' : undefined,
});
```

---

## 2. Shared Customer Accounts

### Account Unification Strategy

A customer should have ONE account across all three products. Clerk handles authentication, and the same Clerk user ID maps to all three product experiences.

```
Customer: alex@example.com
├── Clerk ID: user_abc123
├── Stripe Customer: cus_xyz789
├── Stone AI: SMART plan (active)
├── Best AI Mobile: Premium (active via App Store)
└── Stone AI Tools: Starter + usage billing (active)
```

### Cross-Product SSO

Clerk provides the SSO layer. Once a user signs in to any product, they're authenticated across all:

```typescript
// Middleware for multi-product auth
export async function multiProductAuth(req: NextRequest) {
  const { userId } = getAuth(req);

  if (!userId) return redirectToSignIn();

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      stoneAiPlan: true,
      mobilePlan: true,
      toolsPlan: true,
      activeProducts: true,
    },
  });

  // User has access based on their subscriptions per product
  return { user, products: user.activeProducts };
}
```

### Account Portal

A unified account portal shows all subscriptions in one place:

```
┌──────────────────────────────────────────────────┐
│  YOUR SUBSCRIPTIONS                               │
├──────────────────────────────────────────────────┤
│                                                   │
│  🤖 Stone AI                                     │
│  Plan: SMART ($99.99/mo)                         │
│  Status: Active | Next billing: Apr 9, 2026      │
│  [Manage Plan] [View Usage]                      │
│                                                   │
│  📱 Best AI Mobile                               │
│  Plan: Premium (via App Store)                   │
│  Status: Active | Managed in App Store           │
│  [Open App Store Settings]                        │
│                                                   │
│  🔧 Stone AI Tools                               │
│  Plan: Starter ($29/mo) + Usage                  │
│  API calls this month: 12,450 / 50,000           │
│  Estimated usage charges: $24.90                  │
│  Status: Active | Next billing: Apr 9, 2026      │
│  [Manage Plan] [View API Usage]                  │
│                                                   │
│  ─────────────────────────────────────────────── │
│  Ecosystem Discount: 20% off (2+ products)  ✅  │
│  Total Monthly: $153.89 (was $178.89)            │
│  ─────────────────────────────────────────────── │
│                                                   │
│  Payment Method: Visa ****4242                    │
│  [Update Payment] [Billing History] [Download Invoices] │
│                                                   │
└──────────────────────────────────────────────────┘
```

---

## 3. Cross-Product Discounts

### Ecosystem Discount Strategy

Incentivize customers to use multiple products by offering discounts for multi-product subscriptions:

| Products | Discount | Example |
|----------|----------|---------|
| 1 product | 0% (standard pricing) | SMART: $99.99/mo |
| 2 products | 15% off total | SMART + Tools Starter: $109.64 (was $128.99) |
| 3 products | 20% off total | SMART + Tools + Mobile: $151.19 (was $188.99) |

### Discount Implementation

```typescript
// Check and apply ecosystem discount
async function calculateEcosystemDiscount(
  customerId: string
): Promise<{ discountPercent: number; couponId: string | null }> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
  });

  const activeProducts = new Set<string>();
  for (const sub of subscriptions.data) {
    for (const item of sub.items.data) {
      const product = item.price.product as string;
      if (product === STONE_AI_PRODUCT_ID) activeProducts.add('stone-ai');
      if (product === TOOLS_PRODUCT_ID) activeProducts.add('tools');
      if (product === MOBILE_PRODUCT_ID) activeProducts.add('mobile');
    }
  }

  if (activeProducts.size >= 3) return { discountPercent: 20, couponId: 'ECOSYSTEM_20' };
  if (activeProducts.size >= 2) return { discountPercent: 15, couponId: 'ECOSYSTEM_15' };
  return { discountPercent: 0, couponId: null };
}

// Apply/update discount when subscription changes
async function syncEcosystemDiscount(customerId: string) {
  const { couponId } = await calculateEcosystemDiscount(customerId);

  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
  });

  for (const sub of subscriptions.data) {
    const currentCoupon = sub.discount?.coupon?.id;
    if (currentCoupon !== couponId) {
      if (couponId) {
        await stripe.subscriptions.update(sub.id, { coupon: couponId });
      } else if (currentCoupon) {
        await stripe.subscriptions.deleteDiscount(sub.id);
      }
    }
  }
}
```

### Cross-Product Upsell Points

**From Stone AI:**
- Dashboard banner: "Build with our APIs → Stone AI Tools"
- Settings page: "Take AI mobile → Best AI Mobile"
- After using code agents: "Integrate AI into your app → Stone AI Tools"

**From Best AI Mobile:**
- App settings: "Full power on desktop → Stone AI"
- After hitting mobile limits: "Need more? → Stone AI Plans"

**From Stone AI Tools:**
- Docs site: "See these APIs in action → Stone AI"
- Dashboard: "AI on the go → Best AI Mobile"

---

## 4. Unified Billing Portal

### Customer Portal Configuration

Stripe Customer Portal provides a self-service billing management interface:

```typescript
// Configure Stripe Customer Portal
const portalConfig = await stripe.billingPortal.configurations.create({
  business_profile: {
    headline: 'Stone AI Ecosystem — Manage Your Subscriptions',
    privacy_policy_url: 'https://stone-ai.net/privacy',
    terms_of_service_url: 'https://stone-ai.net/terms',
  },
  features: {
    subscription_update: {
      enabled: true,
      default_allowed_updates: ['price', 'quantity', 'promotion_code'],
      proration_behavior: 'create_prorations',
      products: [
        {
          product: STONE_AI_PRODUCT_ID,
          prices: [/* all Stone AI price IDs */],
        },
        {
          product: TOOLS_PRODUCT_ID,
          prices: [/* all Tools price IDs */],
        },
      ],
    },
    subscription_cancel: {
      enabled: true,
      mode: 'at_period_end',
      cancellation_reason: {
        enabled: true,
        options: [
          'too_expensive',
          'missing_features',
          'switched_service',
          'unused',
          'customer_service',
          'too_complex',
          'other',
        ],
      },
    },
    payment_method_update: { enabled: true },
    invoice_history: { enabled: true },
    subscription_pause: { enabled: true },
  },
});
```

### Invoice Customization

All invoices across all products should have consistent branding:

```typescript
// Invoice settings
await stripe.customers.update(customerId, {
  invoice_settings: {
    custom_fields: [
      { name: 'Ecosystem', value: 'Stone AI / Best AI / Stone AI Tools' },
    ],
    footer: 'Thank you for being part of the Stone AI ecosystem. Questions? support@stone-ai.net',
  },
});
```

---

## 5. App Store Billing Challenges

### The Mobile Billing Problem

Best AI Mobile subscriptions purchased through the App Store or Google Play are managed by Apple/Google, NOT Stripe:
- Apple takes 30% (15% for Small Business Program)
- Google takes 15-30%
- You don't get direct access to the customer's payment method
- Subscription management happens in Apple/Google settings, not your portal

### Solutions for Mobile Billing

**Option 1: App Store billing only (simplest)**
- All mobile subscriptions through App Store/Play Store
- Use RevenueCat or Apple/Google APIs to sync subscription status to your server
- Accept the 15-30% platform fee as cost of mobile distribution
- Separate from Stripe billing entirely

**Option 2: Hybrid billing (recommended)**
- Free users sign up via App Store (no charge, no fee)
- Premium users are nudged to manage billing on stone-ai.net (Stripe, 0% platform fee)
- App Store billing available as fallback for users who prefer it
- Cross-platform subscription recognition via Clerk auth

**Option 3: Web-only billing for mobile (aggressive)**
- All billing happens on stone-ai.net via Stripe
- Mobile app checks subscription status via API
- Avoids all App Store fees
- Risk: Apple may reject the app for circumventing IAP (review App Store guidelines carefully)

### RevenueCat Integration (for App Store subscriptions)

```typescript
// Sync App Store subscription status to your server
import Purchases from 'react-native-purchases';

// On app launch
Purchases.configure({ apiKey: REVENUECAT_API_KEY });

// Check subscription status
const customerInfo = await Purchases.getCustomerInfo();
const isSubscribed = customerInfo.entitlements.active['premium'];

// Sync to server
await fetch('/api/mobile/sync-subscription', {
  method: 'POST',
  body: JSON.stringify({
    userId: clerkUserId,
    isSubscribed,
    productId: customerInfo.activeSubscriptions[0],
    expiresAt: customerInfo.entitlements.active['premium']?.expirationDate,
  }),
});
```

---

## 6. Financial Reporting Across Products

### Unified Revenue Dashboard

```
┌──────────────────────────────────────────────────┐
│  ECOSYSTEM REVENUE — [Month Year]                 │
├──────────────────────────────────────────────────┤
│                                                   │
│  Total MRR: $XX,XXX                              │
│  ├── Stone AI:      $XX,XXX (XX%)                │
│  ├── Best AI Mobile: $X,XXX (XX%)                │
│  └── Stone AI Tools: $X,XXX (XX%)                │
│                                                   │
│  Cross-Product Metrics:                           │
│  ├── Multi-product customers: XXX (XX%)          │
│  ├── Ecosystem discount applied: $X,XXX          │
│  ├── Avg revenue per multi-product customer: $XX │
│  └── Multi-product retention: XX% (vs XX% single)│
│                                                   │
│  Product Movement:                                │
│  ├── Stone AI → Tools cross-sell: XX this month  │
│  ├── Stone AI → Mobile cross-sell: XX            │
│  └── Tools → Stone AI cross-sell: XX             │
│                                                   │
└──────────────────────────────────────────────────┘
```

### Key Multi-Product Metrics

| Metric | Formula | Target |
|--------|---------|--------|
| Multi-product adoption rate | Users with 2+ products / Total paid users | 15-25% |
| Cross-sell conversion rate | Cross-sell conversions / Cross-sell impressions | 5-10% |
| Ecosystem discount revenue impact | Revenue lost to discounts / Revenue gained from retention | > 3x return |
| Multi-product churn rate | Multi-product churners / Multi-product users | < 3% (vs < 5% single) |
| Average revenue per ecosystem user | Total MRR / Ecosystem users | 2x single-product ARPU |
