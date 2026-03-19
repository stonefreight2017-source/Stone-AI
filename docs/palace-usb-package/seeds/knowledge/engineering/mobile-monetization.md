# Mobile Monetization — Best AI Mobile

## Seed Classification
- **Domain**: Mobile Engineering / Business
- **Application**: Best AI Mobile (Business #2)
- **Stack**: react-native-purchases (RevenueCat), Stripe, App Store, Play Store
- **Audience**: Senior Backend Engineer, Senior Frontend Engineer

---

## 1. Monetization Architecture

### Dual Payment Platform Strategy

Best AI Mobile must handle subscriptions from **three sources**:
1. **Stripe** — Web subscribers who install the mobile app
2. **Apple App Store** — iOS in-app purchases (Apple takes 15-30%)
3. **Google Play Store** — Android in-app purchases (Google takes 15-30%)

```
┌─────────────────────────────────────────────────┐
│              Stone AI Backend                     │
│         (Single source of truth for tiers)        │
├─────────┬──────────┬───────────────┬─────────────┤
│ Stripe  │ App Store│  Play Store   │ RevenueCat  │
│ Webhook │  Server  │  RTDN         │   Webhook   │
│         │  Notif.  │  (Real-Time)  │             │
└────┬────┴────┬─────┴──────┬────────┴──────┬──────┘
     │         │            │               │
     │    ┌────┴────┐  ┌────┴────┐          │
     │    │  Apple  │  │ Google  │          │
     │    │  IAP    │  │ Billing │    RevenueCat
     │    └─────────┘  └─────────┘    (Abstraction)
     │
  Stripe
  (Web)
```

### RevenueCat as Abstraction Layer

**RevenueCat** (via `react-native-purchases`) abstracts App Store and Play Store billing. Benefits:
- Unified API for both stores
- Server-side receipt validation
- Webhook integration with Stone AI backend
- Subscription analytics dashboard
- Handles edge cases (grace periods, billing retries, family sharing)

---

## 2. Pricing Alignment

### Mobile vs Web Pricing

| Tier | Web (Stripe) | iOS (App Store) | Android (Play Store) |
|------|-------------|-----------------|---------------------|
| FREE | $0 | $0 | $0 |
| STARTER | $19.99/mo | $19.99/mo | $19.99/mo |
| PLUS | $49.99/mo | $49.99/mo | $49.99/mo |
| SMART | $99.99/mo | $99.99/mo | $99.99/mo |
| SMART Annual | $84.99/mo | $84.99/mo | $84.99/mo |
| PRO | $200/mo | $199.99/mo | $199.99/mo |
| PRO Annual | $170/mo | $169.99/mo | $169.99/mo |

**Important**: Apple and Google require pricing from their tier tables. The closest matching price point is used.

### Revenue Impact

Apple/Google take 15% (small business program) or 30% (standard). Strategy:
- Encourage web signup via marketing (full revenue via Stripe)
- Mobile IAP for convenience (accept the platform fee)
- Annual plans encouraged on mobile (higher LTV offsets fees)
- Never link to external payment from within the app (Apple/Google policy violation)

---

## 3. RevenueCat Integration

### Setup

```typescript
// src/services/monetization/revenueCat.ts
import Purchases, {
  PurchasesOffering,
  CustomerInfo,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import { appConfig } from '@/src/utils/env';

const REVENUECAT_API_KEYS = {
  ios: process.env.EXPO_PUBLIC_RC_IOS_KEY!,
  android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY!,
};

export async function initializeRevenueCat(userId: string): Promise<void> {
  const apiKey = Platform.OS === 'ios'
    ? REVENUECAT_API_KEYS.ios
    : REVENUECAT_API_KEYS.android;

  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  await Purchases.configure({
    apiKey,
    appUserID: userId, // Use Clerk user ID for cross-platform identity
  });
}

export async function getOfferings(): Promise<PurchasesOffering | null> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current;
  } catch (error) {
    console.error('Failed to fetch offerings:', error);
    return null;
  }
}

export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<{ success: boolean; customerInfo?: CustomerInfo; error?: string }> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true, customerInfo };
  } catch (error: any) {
    if (error.userCancelled) {
      return { success: false, error: 'cancelled' };
    }
    return { success: false, error: error.message };
  }
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}

export function addCustomerInfoListener(
  listener: (info: CustomerInfo) => void
): () => void {
  const remove = Purchases.addCustomerInfoUpdateListener(listener);
  return remove;
}
```

### RevenueCat Product Configuration

```typescript
// RevenueCat Dashboard Configuration (reference)

// Entitlements:
// - "starter_access"  → STARTER tier agents (1-16)
// - "plus_access"     → PLUS tier agents (1-30)
// - "smart_access"    → SMART tier agents (1-39)
// - "pro_access"      → PRO tier agents (1-38)

// Products (iOS):
// - bestai_starter_monthly     → $19.99/mo
// - bestai_starter_annual      → $199.99/yr ($16.67/mo)
// - bestai_plus_monthly        → $49.99/mo
// - bestai_plus_annual         → $499.99/yr ($41.67/mo)
// - bestai_smart_monthly       → $99.99/mo
// - bestai_smart_annual        → $1019.88/yr ($84.99/mo)
// - bestai_pro_monthly         → $199.99/mo
// - bestai_pro_annual          → $2039.99/yr ($170/mo)

// Packages (in "default" offering):
// - "$rc_monthly"   → monthly package (tier selected in UI)
// - "$rc_annual"    → annual package (tier selected in UI)

// Or separate offerings per tier:
// - "starter"  → starter monthly + annual
// - "plus"     → plus monthly + annual
// - "smart"    → smart monthly + annual
// - "pro"      → pro monthly + annual
```

---

## 4. Subscription UI

```typescript
// src/components/subscription/PlanSelector.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useState, useEffect } from 'react';
import { useTheme } from '@/src/theme';
import { getOfferings, purchasePackage } from '@/src/services/monetization/revenueCat';
import { PurchasesPackage } from 'react-native-purchases';
import { haptic } from '@/src/utils/haptics';
import { Button } from '@/src/components/ui/Button';

interface Plan {
  id: string;
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  agents: number;
  features: string[];
  monthlyPackage?: PurchasesPackage;
  annualPackage?: PurchasesPackage;
}

export function PlanSelector() {
  const theme = useTheme();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    const offerings = await getOfferings();
    if (!offerings) return;

    // Map RevenueCat offerings to plan display
    const planData: Plan[] = [
      {
        id: 'starter',
        name: 'Starter',
        monthlyPrice: '$19.99',
        annualPrice: '$16.67',
        agents: 16,
        features: ['16 AI Agents', '1 Bestie', 'Chat History', 'Basic Support'],
      },
      {
        id: 'plus',
        name: 'Plus',
        monthlyPrice: '$49.99',
        annualPrice: '$41.67',
        agents: 30,
        features: ['30 AI Agents', '1 Bestie', 'Priority Chat', 'Premium Support'],
      },
      {
        id: 'smart',
        name: 'Smart',
        monthlyPrice: '$99.99',
        annualPrice: '$84.99',
        agents: 39,
        features: ['39 AI Agents', '1 Bestie', 'Claude Sonnet', 'Priority Everything'],
      },
      {
        id: 'pro',
        name: 'Pro',
        monthlyPrice: '$200',
        annualPrice: '$170',
        agents: 38,
        features: ['All 38 Agents', '1 Bestie', 'Full AI Power', 'VIP Support'],
      },
    ];

    setPlans(planData);
  };

  const handlePurchase = async () => {
    if (!selectedPlan) return;
    setIsLoading(true);
    haptic.medium();

    const plan = plans.find((p) => p.id === selectedPlan);
    const pkg = billingCycle === 'monthly'
      ? plan?.monthlyPackage
      : plan?.annualPackage;

    if (!pkg) {
      setIsLoading(false);
      return;
    }

    const result = await purchasePackage(pkg);

    if (result.success) {
      haptic.success();
      // Navigate to success screen
    } else if (result.error !== 'cancelled') {
      haptic.error();
      // Show error
    }

    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      {/* Billing cycle toggle */}
      <View style={[styles.cycleToggle, { backgroundColor: theme.colors.surface }]}>
        <Pressable
          onPress={() => setBillingCycle('monthly')}
          style={[
            styles.cycleButton,
            billingCycle === 'monthly' && {
              backgroundColor: theme.colors.primary,
            },
          ]}
        >
          <Text style={{
            color: billingCycle === 'monthly' ? '#FFF' : theme.colors.text,
            fontFamily: 'Inter-SemiBold',
          }}>
            Monthly
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setBillingCycle('annual')}
          style={[
            styles.cycleButton,
            billingCycle === 'annual' && {
              backgroundColor: theme.colors.primary,
            },
          ]}
        >
          <Text style={{
            color: billingCycle === 'annual' ? '#FFF' : theme.colors.text,
            fontFamily: 'Inter-SemiBold',
          }}>
            Annual (Save 15%)
          </Text>
        </Pressable>
      </View>

      {/* Plan cards */}
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          billingCycle={billingCycle}
          isSelected={selectedPlan === plan.id}
          onSelect={() => {
            haptic.selection();
            setSelectedPlan(plan.id);
          }}
        />
      ))}

      <Button
        title="Subscribe"
        onPress={handlePurchase}
        loading={isLoading}
        disabled={!selectedPlan}
        size="large"
      />

      <Text style={[styles.legal, { color: theme.colors.textTertiary }]}>
        Payment will be charged to your {Platform.OS === 'ios' ? 'Apple' : 'Google'} account.
        Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  cycleToggle: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
  },
  cycleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  legal: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 8,
  },
});
```

---

## 5. Receipt Validation

### Server-Side Validation

```typescript
// Stone AI Backend: src/lib/monetization/validateReceipt.ts
import Purchases from 'purchases-node'; // RevenueCat server SDK

const rcClient = new Purchases.Purchases(process.env.REVENUECAT_API_KEY!);

export async function validateAndSyncSubscription(
  userId: string
): Promise<{ tier: string; isActive: boolean }> {
  try {
    const subscriber = await rcClient.getSubscriber(userId);
    const entitlements = subscriber.subscriber.entitlements;

    // Map RevenueCat entitlements to Stone AI tiers
    if (entitlements.pro_access?.expires_date) {
      const isActive = new Date(entitlements.pro_access.expires_date) > new Date();
      if (isActive) return { tier: 'PRO', isActive: true };
    }
    if (entitlements.smart_access?.expires_date) {
      const isActive = new Date(entitlements.smart_access.expires_date) > new Date();
      if (isActive) return { tier: 'SMART', isActive: true };
    }
    if (entitlements.plus_access?.expires_date) {
      const isActive = new Date(entitlements.plus_access.expires_date) > new Date();
      if (isActive) return { tier: 'PLUS', isActive: true };
    }
    if (entitlements.starter_access?.expires_date) {
      const isActive = new Date(entitlements.starter_access.expires_date) > new Date();
      if (isActive) return { tier: 'STARTER', isActive: true };
    }

    return { tier: 'FREE', isActive: false };
  } catch (error) {
    console.error('Receipt validation failed:', error);
    throw error;
  }
}

// Webhook handler for RevenueCat events
export async function handleRevenueCatWebhook(event: any) {
  const { type, app_user_id, product_id, expiration_at_ms } = event;

  switch (type) {
    case 'INITIAL_PURCHASE':
    case 'RENEWAL':
      await syncSubscriptionToDatabase(app_user_id, product_id, 'active');
      break;

    case 'CANCELLATION':
      // Still active until period ends
      await updateCancelAtPeriodEnd(app_user_id, true);
      break;

    case 'EXPIRATION':
      await syncSubscriptionToDatabase(app_user_id, null, 'expired');
      break;

    case 'BILLING_ISSUE':
      await handleBillingIssue(app_user_id);
      break;

    case 'PRODUCT_CHANGE':
      await handlePlanChange(app_user_id, product_id);
      break;
  }
}
```

---

## 6. Restore Purchases

```typescript
// src/hooks/useSubscription.ts
import { useState, useEffect, useCallback } from 'react';
import {
  getCustomerInfo,
  restorePurchases,
  addCustomerInfoListener,
} from '@/src/services/monetization/revenueCat';
import { CustomerInfo } from 'react-native-purchases';
import type { SubscriptionTier } from '@/src/types/shared';

export function useSubscription() {
  const [tier, setTier] = useState<SubscriptionTier>('FREE');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initial check
    loadSubscriptionStatus();

    // Listen for changes
    const remove = addCustomerInfoListener((info) => {
      setTier(mapEntitlementsToTier(info));
    });

    return remove;
  }, []);

  const loadSubscriptionStatus = async () => {
    try {
      const info = await getCustomerInfo();
      setTier(mapEntitlementsToTier(info));
    } catch {
      // Fallback to cached tier
    } finally {
      setIsLoading(false);
    }
  };

  const restore = useCallback(async (): Promise<boolean> => {
    try {
      const info = await restorePurchases();
      const restoredTier = mapEntitlementsToTier(info);
      setTier(restoredTier);
      return restoredTier !== 'FREE';
    } catch {
      return false;
    }
  }, []);

  return { tier, isLoading, restore };
}

function mapEntitlementsToTier(info: CustomerInfo): SubscriptionTier {
  const entitlements = info.entitlements.active;
  if (entitlements['pro_access']) return 'PRO';
  if (entitlements['smart_access']) return 'SMART';
  if (entitlements['plus_access']) return 'PLUS';
  if (entitlements['starter_access']) return 'STARTER';
  return 'FREE';
}
```

---

## 7. Cross-Platform Subscription Sync

```typescript
// When a user subscribes on web (Stripe) and opens the mobile app,
// or subscribes on iOS and opens on Android:

// The Stone AI backend is the source of truth for tier.
// RevenueCat aliases are used to link the same user across platforms.

// On app launch:
async function syncSubscriptionStatus(userId: string) {
  // 1. Check RevenueCat for mobile subscriptions
  const rcInfo = await getCustomerInfo();
  const mobileTier = mapEntitlementsToTier(rcInfo);

  // 2. Check Stone AI backend for web subscriptions
  const { data: backendSub } = await apiClient.get('/api/subscription/status');
  const webTier = backendSub.tier;

  // 3. Use the HIGHER tier (user might have both)
  const tierOrder = ['FREE', 'STARTER', 'PLUS', 'SMART', 'PRO'];
  const effectiveTier = tierOrder.indexOf(mobileTier) > tierOrder.indexOf(webTier)
    ? mobileTier
    : webTier;

  return effectiveTier;
}
```

---

## 8. App Store Compliance

### Required Disclosures

```typescript
// Subscription screen MUST include (Apple requirement):
// 1. Price and billing period
// 2. Auto-renewal terms
// 3. Link to Terms of Service
// 4. Link to Privacy Policy
// 5. "Restore Purchases" button

// These must be visible without scrolling
<View style={styles.legalSection}>
  <Pressable onPress={() => Linking.openURL('https://stone-ai.net/terms')}>
    <Text style={styles.link}>Terms of Service</Text>
  </Pressable>
  <Pressable onPress={() => Linking.openURL('https://stone-ai.net/privacy')}>
    <Text style={styles.link}>Privacy Policy</Text>
  </Pressable>
  <Button
    title="Restore Purchases"
    variant="ghost"
    onPress={handleRestore}
  />
</View>
```

### What NOT to Do

- Never link to external payment page from within the app (Apple/Google violation)
- Never mention Stripe pricing is cheaper than App Store pricing
- Never discourage App Store purchase
- Never mention the platform commission
- Always provide a "Restore Purchases" button
- Always clearly state auto-renewal terms

This monetization architecture allows Best AI Mobile to accept payments through all channels while maintaining a single subscription status across web and mobile, with RevenueCat handling the complexity of App Store and Play Store billing.
