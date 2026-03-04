"use client";

import { Badge } from "@/components/ui/badge";

const TIER_COLORS: Record<string, string> = {
  FREE: "bg-zinc-600 text-zinc-200 hover:bg-zinc-600",
  STARTER: "bg-blue-600 text-blue-100 hover:bg-blue-600",
  PLUS: "bg-indigo-600 text-indigo-100 hover:bg-indigo-600",
  SMART: "bg-purple-600 text-purple-100 hover:bg-purple-600",
  PRO: "bg-amber-600 text-amber-100 hover:bg-amber-600",
};

export function TierBadge({ tier }: { tier: string }) {
  return (
    <Badge className={`text-xs ${TIER_COLORS[tier] ?? TIER_COLORS.FREE}`}>
      {tier}
    </Badge>
  );
}
