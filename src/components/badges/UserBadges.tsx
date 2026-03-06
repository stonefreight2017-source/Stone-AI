"use client";

import { Star, Trophy } from "lucide-react";
import { BADGE_DEFINITIONS, type BadgeDefinition } from "@/lib/badges";

interface UserBadgesProps {
  /** Array of badge slugs the user has earned (from DB or computed) */
  badges: string[];
  /** Compact mode renders smaller pills (for sidebar, forum, etc.) */
  compact?: boolean;
}

export function UserBadges({ badges, compact = false }: UserBadgesProps) {
  if (!badges || badges.length === 0) return null;

  return (
    <span className="inline-flex items-center gap-1">
      {badges.map((slug) => {
        const def = BADGE_DEFINITIONS[slug];
        if (!def) return null;
        return <BadgePill key={slug} badge={def} compact={compact} />;
      })}
    </span>
  );
}

function BadgePill({
  badge,
  compact,
}: {
  badge: BadgeDefinition;
  compact: boolean;
}) {
  const isLegendary = badge.tier === "legendary";
  const Icon = isLegendary ? Trophy : Star;

  if (isLegendary) {
    return (
      <span
        className={`group relative inline-flex items-center gap-1 rounded-full font-semibold
          bg-gradient-to-r from-yellow-500/30 via-amber-400/30 to-yellow-500/30
          text-amber-300 border border-amber-500/40
          badge-golden-egg-shimmer
          ${compact ? "px-1.5 py-0 text-[9px]" : "px-2 py-0.5 text-[10px]"}`}
        title={badge.description}
      >
        <Icon className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
        {!compact && badge.name}
        {/* Tooltip on hover */}
        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-lg bg-zinc-800 border border-amber-500/30 px-3 py-2 text-[11px] text-zinc-300 leading-snug opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 text-center shadow-lg shadow-amber-900/20">
          {badge.description}
        </span>
      </span>
    );
  }

  // OG badge (amber/gold pill with star)
  return (
    <span
      className={`group relative inline-flex items-center gap-1 rounded-full font-semibold
        bg-amber-500/15 text-amber-400 border border-amber-500/25
        ${compact ? "px-1.5 py-0 text-[9px]" : "px-2 py-0.5 text-[10px]"}`}
      title={badge.description}
    >
      <Icon className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {!compact && badge.name}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-[11px] text-zinc-300 leading-snug opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 text-center shadow-lg">
        {badge.description}
      </span>
    </span>
  );
}

/**
 * Small gold dot indicator for sidebar — shows if user has the golden-egg badge.
 */
export function GoldenEggDot({ badges }: { badges: string[] }) {
  if (!badges || !badges.includes("golden-egg")) return null;
  return (
    <span
      className="inline-block h-2 w-2 rounded-full bg-amber-400 badge-golden-egg-shimmer"
      title="Golden Egg -- 1 year founding member"
    />
  );
}
