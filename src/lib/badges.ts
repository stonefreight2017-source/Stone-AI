import type { User } from "@/generated/prisma/client";

export interface BadgeDefinition {
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  tier?: "legendary";
}

export const BADGE_DEFINITIONS: Record<string, BadgeDefinition> = {
  og: {
    slug: "og",
    name: "OG Member",
    description:
      "Original member -- signed up with a founding offer",
    icon: "star",
    color: "amber",
  },
  "golden-egg": {
    slug: "golden-egg",
    name: "Golden Egg",
    description:
      "Retained founding price for 1 full year -- the rarest badge on Stone AI",
    icon: "trophy",
    color: "gold",
    tier: "legendary",
  },
};

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/**
 * Compute the badges a user should have based on their promo status.
 * Returns badge definition objects for every badge the user qualifies for.
 */
export function getUserBadges(
  user: Pick<
    User,
    "promoKey" | "promoSubscribedAt" | "subscriptionStatus" | "badges"
  >
): BadgeDefinition[] {
  const earned: BadgeDefinition[] = [];

  // OG badge: user subscribed via a promo price and still has an active subscription
  if (user.promoKey && user.subscriptionStatus === "ACTIVE") {
    earned.push(BADGE_DEFINITIONS["og"]);
  }

  // Golden Egg: promo subscriber for 365+ days and still active
  if (
    user.promoKey &&
    user.promoSubscribedAt &&
    user.subscriptionStatus === "ACTIVE"
  ) {
    const elapsed = Date.now() - new Date(user.promoSubscribedAt).getTime();
    if (elapsed >= ONE_YEAR_MS) {
      earned.push(BADGE_DEFINITIONS["golden-egg"]);
    }
  }

  return earned;
}

/**
 * Returns true if the user qualifies for the golden-egg badge
 * but doesn't have it in their persisted badges array yet.
 */
export function shouldAwardGoldenEgg(
  user: Pick<
    User,
    "promoKey" | "promoSubscribedAt" | "subscriptionStatus" | "badges"
  >
): boolean {
  if (!user.promoKey || !user.promoSubscribedAt) return false;
  if (user.subscriptionStatus !== "ACTIVE") return false;
  if (user.badges.includes("golden-egg")) return false;

  const elapsed = Date.now() - new Date(user.promoSubscribedAt).getTime();
  return elapsed >= ONE_YEAR_MS;
}
