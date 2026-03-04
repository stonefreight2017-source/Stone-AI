"use client";

import { AdSlot } from "./AdSlot";

interface TierGatedAdProps {
  tier: string;
  slot: "sidebar" | "chat-idle" | "between-conversations";
  className?: string;
}

/**
 * Only renders the ad slot for ad-supported tiers (FREE, STARTER).
 * PLUS, SMART, PRO = ad-free, this renders nothing.
 */
export function TierGatedAd({ tier, slot, className }: TierGatedAdProps) {
  // Ad-free tiers
  if (tier === "PLUS" || tier === "SMART" || tier === "PRO") {
    return null;
  }

  return <AdSlot slot={slot} className={className} />;
}
