import { getOrCreateUser } from "@/lib/auth";
import { getTierConfig, TIER_DISPLAY } from "@/lib/tier-config";
import type { Tier } from "@/lib/tier-config";
import { BillingClient } from "./billing-client";

export default async function BillingPage() {
  const user = await getOrCreateUser();
  const tier = user.tier as Tier;
  const config = getTierConfig(tier);

  return (
    <BillingClient
      currentTier={tier}
      tierName={config.name}
      price={config.price}
      subscriptionStatus={user.subscriptionStatus}
      hasStripeCustomer={!!user.stripeCustomerId}
      tiers={TIER_DISPLAY.map((t) => ({
        key: t.key,
        name: t.name,
        price: t.price,
        badge: t.badge,
        popular: t.popular,
      }))}
    />
  );
}
