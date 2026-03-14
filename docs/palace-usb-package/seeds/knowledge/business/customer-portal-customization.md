# Customer Portal Customization — Stone AI Ecosystem

## Seed Classification
- **Domain**: Revenue Operations / Billing UX
- **Complexity**: Intermediate
- **Stack**: Next.js 16, TypeScript, Stripe Customer Portal, Prisma 7.4
- **Applies To**: Stone AI, Best AI Mobile, Stone AI Tools

---

## 1. Stripe Customer Portal Overview

Stripe's Customer Portal is a pre-built, hosted UI that lets customers manage their billing — update payment methods, change plans, view invoice history, and cancel subscriptions — without you building any of it. It reduces billing support tickets by 40-60% and gives customers 24/7 self-service access.

### Portal Capabilities

| Feature | What It Does | Customer Impact |
|---------|-------------|----------------|
| Subscription management | Change plan, switch billing period | Self-service upgrades/downgrades |
| Payment method update | Add/change card, set default | Reduces failed payments |
| Invoice history | View and download past invoices | Self-service accounting |
| Cancellation | Cancel with optional retention flow | Controlled offboarding |
| Subscription pause | Temporarily pause billing | Retention alternative |
| Promo code application | Apply discount codes | Self-service discounts |

---

## 2. Portal Configuration

### Creating the Portal Configuration

```typescript
// Configure Stripe Customer Portal
const portalConfiguration = await stripe.billingPortal.configurations.create({
  business_profile: {
    headline: 'Manage Your Stone AI Subscription',
    privacy_policy_url: 'https://stone-ai.net/privacy',
    terms_of_service_url: 'https://stone-ai.net/terms',
  },
  features: {
    // Plan changes
    subscription_update: {
      enabled: true,
      default_allowed_updates: ['price', 'promotion_code'],
      proration_behavior: 'create_prorations',
      products: [
        {
          product: process.env.STRIPE_STONE_AI_PRODUCT_ID!,
          prices: [
            process.env.STRIPE_STARTER_MONTHLY_PRICE_ID!,
            process.env.STRIPE_STARTER_ANNUAL_PRICE_ID!,
            process.env.STRIPE_PLUS_MONTHLY_PRICE_ID!,
            process.env.STRIPE_PLUS_ANNUAL_PRICE_ID!,
            process.env.STRIPE_SMART_MONTHLY_PRICE_ID!,
            process.env.STRIPE_SMART_ANNUAL_PRICE_ID!,
            process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
            process.env.STRIPE_PRO_ANNUAL_PRICE_ID!,
          ],
        },
      ],
    },

    // Payment method management
    payment_method_update: {
      enabled: true,
    },

    // Invoice history
    invoice_history: {
      enabled: true,
    },

    // Cancellation
    subscription_cancel: {
      enabled: true,
      mode: 'at_period_end', // Access continues until period end
      cancellation_reason: {
        enabled: true,
        options: [
          'too_expensive',
          'missing_features',
          'switched_service',
          'unused',
          'customer_service',
          'too_complex',
          'low_quality',
          'other',
        ],
      },
    },

    // Subscription pause
    subscription_pause: {
      enabled: true,
    },

    // Customer update (email, billing address)
    customer_update: {
      enabled: true,
      allowed_updates: ['email', 'address', 'tax_id'],
    },
  },
});
```

### Launching the Portal from Your App

```typescript
// API route: /api/billing/portal
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const { userId } = auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) {
    return new Response('No billing account found', { status: 404 });
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/billing`,
    configuration: process.env.STRIPE_PORTAL_CONFIG_ID,
  });

  return Response.json({ url: session.url });
}
```

### Client-Side Portal Launch

```typescript
// Component: ManageBillingButton
'use client';

export function ManageBillingButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const { url } = await res.json();
      window.location.href = url;
    } catch (error) {
      toast.error('Failed to open billing portal');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading ? 'Opening...' : 'Manage Billing'}
    </Button>
  );
}
```

---

## 3. Custom Flows (Beyond Default Portal)

### When to Build Custom vs. Use Stripe Portal

| Scenario | Stripe Portal | Custom Build |
|----------|:----------:|:----------:|
| Update payment method | Yes | No |
| View invoices | Yes | No |
| Upgrade/downgrade plan | Yes | Maybe (for custom UX) |
| Cancel subscription | Yes | Maybe (for retention flow) |
| Usage dashboard | No | Yes |
| Cross-product management | No | Yes |
| Custom promo code flow | Limited | Yes |
| Referral rewards display | No | Yes |

### Custom Plan Management Page

For a richer experience than Stripe's default portal, build a custom billing page:

```
┌──────────────────────────────────────────────────┐
│  BILLING & PLAN — Settings                        │
├──────────────────────────────────────────────────┤
│                                                   │
│  Current Plan: SMART                              │
│  ┌─────────────────────────────────────────────┐ │
│  │ $99.99/month · 39 AI Agents · Bestie Pro    │ │
│  │ Next billing: April 9, 2026                  │ │
│  │ Annual option: $79.99/mo (Save $240/year)    │ │
│  │ [Switch to Annual] [Change Plan]             │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  Payment Method                                   │
│  Visa ending in 4242 · Expires 12/2028           │
│  [Update Card] [Add Backup Card]                 │
│                                                   │
│  Billing History                                  │
│  ┌──────────┬───────┬─────────┬────────┐        │
│  │ Date     │ Amount│ Status  │ Action │        │
│  ├──────────┼───────┼─────────┼────────┤        │
│  │ Mar 9    │$99.99 │ ✅ Paid │[PDF]   │        │
│  │ Feb 9    │$99.99 │ ✅ Paid │[PDF]   │        │
│  │ Jan 9    │$99.99 │ ✅ Paid │[PDF]   │        │
│  └──────────┴───────┴─────────┴────────┘        │
│  [View All Invoices]                              │
│                                                   │
│  Account Credits                                  │
│  Referral credits: $20.00                         │
│  [How to earn more credits]                       │
│                                                   │
│  ─────────────────────────────────────────────── │
│  [Cancel Subscription]  [Pause Subscription]      │
│                                                   │
└──────────────────────────────────────────────────┘
```

### Custom Cancel Flow with Retention

The default Stripe cancel flow is minimal. A custom flow can save 10-30% of cancellations:

```typescript
// Custom cancellation API with retention offers
export async function POST(req: Request) {
  const { reason, feedback } = await req.json();
  const { userId } = auth();

  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
  });

  // Log cancellation attempt
  await prisma.cancellationAttempt.create({
    data: {
      userId: user.id,
      reason,
      feedback,
      outcome: 'pending',
    },
  });

  // Generate retention offer based on reason
  let retentionOffer = null;

  switch (reason) {
    case 'too_expensive':
      retentionOffer = {
        type: 'discount',
        offer: '25% off for 3 months',
        couponId: 'RETENTION_25_3MO',
      };
      break;

    case 'unused':
      retentionOffer = {
        type: 'pause',
        offer: 'Pause your subscription for up to 3 months',
        action: 'pause',
      };
      break;

    case 'missing_features':
      retentionOffer = {
        type: 'upgrade_trial',
        offer: 'Try the next tier free for 14 days',
        action: 'trial_upgrade',
      };
      break;

    case 'switched_service':
      retentionOffer = {
        type: 'discount',
        offer: '50% off for 1 month + personal onboarding call',
        couponId: 'RETENTION_50_1MO',
      };
      break;

    default:
      retentionOffer = {
        type: 'pause',
        offer: 'Pause instead of cancel?',
        action: 'pause',
      };
  }

  return Response.json({ retentionOffer });
}
```

---

## 4. Branding and Customization

### Portal Branding Options

Stripe Customer Portal supports limited branding:
- **Logo**: Upload company logo (displayed in portal header)
- **Colors**: Primary brand color (affects buttons and links)
- **Headline**: Custom text ("Manage Your Stone AI Subscription")
- **Links**: Privacy policy and terms of service URLs

### Setting Portal Branding

```typescript
// Update portal branding via Stripe Dashboard or API
await stripe.billingPortal.configurations.update(configId, {
  business_profile: {
    headline: 'Manage Your Stone AI Subscription',
    privacy_policy_url: 'https://stone-ai.net/privacy',
    terms_of_service_url: 'https://stone-ai.net/terms',
  },
});

// Note: Logo and colors are set in Stripe Dashboard
// Settings → Branding → Customer Portal
```

### Custom Domain for Portal

Stripe Customer Portal runs on Stripe's domain (billing.stripe.com) by default. For a branded experience:
- **Option A**: Use Stripe's portal with your branding settings (quickest)
- **Option B**: Build a custom billing page that uses Stripe APIs directly (most control)
- **Option C**: Embed Stripe elements within your app using Stripe.js (middle ground)

---

## 5. Portal Event Handling

### Webhook Events from Portal Actions

When customers make changes through the portal, Stripe fires webhooks:

```typescript
// Handle portal-initiated changes
async function handlePortalWebhook(event: Stripe.Event) {
  switch (event.type) {
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const prev = event.data.previous_attributes as any;

      // Plan change
      if (prev?.items) {
        const oldPlan = getPlanFromPrice(prev.items.data[0].price);
        const newPlan = getPlanFromPrice(sub.items.data[0].price.id);

        await prisma.user.update({
          where: { stripeCustomerId: sub.customer as string },
          data: { stoneAiPlan: newPlan },
        });

        // Send confirmation email
        if (isUpgrade(oldPlan, newPlan)) {
          await sendUpgradeConfirmation(sub.customer as string, oldPlan, newPlan);
        } else {
          await sendDowngradeConfirmation(sub.customer as string, oldPlan, newPlan);
        }
      }

      // Pause/resume
      if (sub.pause_collection) {
        await handleSubscriptionPaused(sub);
      } else if (prev?.pause_collection) {
        await handleSubscriptionResumed(sub);
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await handleCancellation(sub);
      break;
    }

    case 'payment_method.attached': {
      // Customer added a new payment method via portal
      const pm = event.data.object as Stripe.PaymentMethod;
      await logPaymentMethodUpdate(pm.customer as string);
      break;
    }

    case 'billing_portal.session.created': {
      // Track portal access for analytics
      const session = event.data.object as Stripe.BillingPortal.Session;
      await logPortalAccess(session.customer as string);
      break;
    }
  }
}
```

---

## 6. Support Ticket Reduction

### Self-Service Coverage

The portal should handle the most common billing support requests:

| Request | Portal Handles? | Reduction |
|---------|:---------------:|-----------|
| "How do I update my card?" | Yes | 100% eliminated |
| "Where are my invoices?" | Yes | 100% eliminated |
| "How do I upgrade?" | Yes | 90% eliminated |
| "How do I cancel?" | Yes | 80% eliminated |
| "I was charged twice" | No (support) | — |
| "I want a refund" | No (support) | — |
| "What does this charge mean?" | Partially (invoice details) | 50% reduced |
| "My payment failed" | Yes (update card) | 70% eliminated |

### Portal Education

Help users find and use the portal:
1. **Settings page**: Prominent "Manage Billing" button
2. **Payment failure email**: Direct link to portal for card update
3. **Help docs**: "How to manage your subscription" article with portal screenshots
4. **Onboarding**: Mention billing self-service during new user onboarding
5. **Support auto-reply**: For billing questions, first suggest the portal

### Measuring Portal Impact

```
# Portal Effectiveness Report — [Month]

Portal Sessions: XXX
├── Plan changes made: XX
├── Payment methods updated: XX
├── Invoices downloaded: XX
├── Cancellations initiated: XX
│   └── Saved by retention offer: XX (XX%)
└── Average time in portal: X minutes

Support Tickets (billing):
├── This month: XX
├── Last month (pre-portal): XX
├── Reduction: XX%
└── Remaining ticket types: [refund requests, disputes, unclear charges]

Estimated Support Cost Savings: $X,XXX/month
```
