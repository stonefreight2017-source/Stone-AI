import { getOrCreateUser } from "@/lib/auth";
import { TIER_CONFIG } from "@/lib/tier-config";
import type { Tier } from "@/lib/tier-config";
import { DiscoverClient } from "./discover-client";

export default async function DiscoverPage() {
  const user = await getOrCreateUser();
  const tier = user.tier as Tier;
  const config = TIER_CONFIG[tier];

  return (
    <DiscoverClient
      currentTier={tier}
      tierName={config.name}
    />
  );
}
