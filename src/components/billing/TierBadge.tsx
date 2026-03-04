"use client";

import { Badge } from "@/components/ui/badge";
import { Crown } from "lucide-react";

const TIER_COLORS: Record<string, string> = {
  FREE: "bg-zinc-600 text-zinc-200 hover:bg-zinc-600",
  STARTER: "bg-blue-600 text-blue-100 hover:bg-blue-600",
  PLUS: "bg-indigo-600 text-indigo-100 hover:bg-indigo-600",
  SMART: "bg-purple-600 text-purple-100 hover:bg-purple-600",
  PRO: "bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold hover:from-amber-400 hover:to-yellow-400",
};

export function TierBadge({ tier }: { tier: string }) {
  const isPro = tier === "PRO";
  return (
    <Badge className={`text-xs ${TIER_COLORS[tier] ?? TIER_COLORS.FREE}`}>
      {isPro && <Crown className="h-3 w-3 mr-0.5" />}
      {tier}
    </Badge>
  );
}
