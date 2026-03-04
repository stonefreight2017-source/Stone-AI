import { getOrCreateUser } from "@/lib/auth";
import { getTierConfig, TIER_DISPLAY, TIER_CONFIG } from "@/lib/tier-config";
import type { Tier } from "@/lib/tier-config";
import { PromotionsClient } from "./promotions-client";

export default async function PromotionsPage() {
  const user = await getOrCreateUser();
  const tier = user.tier as Tier;
  const config = getTierConfig(tier);

  return (
    <PromotionsClient
      currentTier={tier}
      tierName={config.name}
      freeTrialUsed={user.freeTrialUsed}
      enhancedTrialUsed={user.enhancedTrialUsed}
      trialActive={!!(user.freeTrialEndsAt && user.freeTrialEndsAt > new Date())}
      trialEndsAt={user.freeTrialEndsAt?.toISOString() ?? null}
      hasSubscription={user.subscriptionStatus === "ACTIVE"}
      tiers={TIER_DISPLAY.map((t) => ({
        key: t.key,
        name: t.name,
        price: t.price,
        badge: t.badge,
        popular: t.popular,
        limits: TIER_CONFIG[t.key].limits,
        perks: TIER_CONFIG[t.key].perks,
        allowedModes: TIER_CONFIG[t.key].allowedModes,
      }))}
    />
  );
}
