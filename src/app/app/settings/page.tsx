import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTierConfig } from "@/lib/tier-config";
import type { Tier } from "@/lib/tier-config";
import { SettingsClient } from "./settings-client";

export default async function SettingsPage() {
  const user = await getOrCreateUser();
  const tier = user.tier as Tier;
  const config = getTierConfig(tier);

  // Get API keys for Pro users
  let apiKeys: { id: string; name: string; keyPrefix: string; lastUsedAt: string | null; createdAt: string }[] = [];
  if (tier === "PRO") {
    const keys = await db.apiKey.findMany({
      where: { userId: user.id, revokedAt: null },
      select: { id: true, name: true, keyPrefix: true, lastUsedAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    apiKeys = keys.map((k) => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.keyPrefix,
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      createdAt: k.createdAt.toISOString(),
    }));
  }

  return (
    <SettingsClient
      user={{
        id: user.id,
        email: user.email,
        name: user.name,
        tier,
        tierName: config.name,
        createdAt: user.createdAt.toISOString(),
      }}
      limits={config.limits}
      perks={config.perks}
      allowedModes={config.allowedModes}
      apiKeys={apiKeys}
    />
  );
}
