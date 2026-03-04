"use client";

import { useEffect, useState } from "react";

interface AdSlotProps {
  slot: "sidebar" | "chat-idle" | "between-conversations";
  className?: string;
}

// Placement philosophy: minimal, non-intrusive, at natural breakpoints only
// - sidebar: below nav links, scrolls with sidebar (not sticky/floating)
// - chat-idle: only when user hasn't sent a message in 60+ seconds (empty state)
// - between-conversations: on the conversation list, after every 8th conversation

interface AdConfig {
  showAds: boolean;
  adSlots: string[];
  segments: string[];
  publisherId: string | null;
}

/**
 * AdSlot — renders an ad container for free-tier users.
 * Paid users never see this component (parent checks tier).
 *
 * When AdSense publisher ID is configured, renders a real AdSense unit.
 * Otherwise renders contextual placeholder content.
 */
export function AdSlot({ slot, className = "" }: AdSlotProps) {
  const [config, setConfig] = useState<AdConfig | null>(null);

  const [ccpaOptOut, setCcpaOptOut] = useState(false);

  useEffect(() => {
    setCcpaOptOut(localStorage.getItem("stone_ccpa_optout") === "true");
    fetch("/api/ads")
      .then((r) => r.json())
      .then((data) => setConfig(data))
      .catch(() => {});
  }, []);

  // Don't render anything if ads are disabled or this slot isn't active
  if (!config?.showAds || !config.adSlots.includes(slot)) {
    return null;
  }

  const slotStyles: Record<string, string> = {
    sidebar: "w-full max-w-[300px] min-h-[250px]",
    "chat-idle": "w-full max-w-[728px] min-h-[90px] mx-auto",
    "between-conversations": "w-full max-w-[468px] min-h-[60px] mx-auto",
  };

  // If AdSense is configured, render real ad unit
  if (config.publisherId) {
    return (
      <div className={`${slotStyles[slot]} ${className}`}>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={config.publisherId}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
          {...(ccpaOptOut ? { "data-npa": "1" } : {})}
        />
      </div>
    );
  }

  // Placeholder — reserved ad space, renders as blank until AdSense is live
  // No mention of ads, upgrades, or ad-free. Completely invisible strategy.
  return (
    <div
      className={`${slotStyles[slot]} ${className}`}
      data-ad-slot={slot}
      data-ad-status="pending"
    />
  );
}
