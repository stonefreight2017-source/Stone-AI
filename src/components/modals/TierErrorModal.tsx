"use client";

import { useRouter } from "next/navigation";
import { ShieldAlert, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TierBadge } from "@/components/billing/TierBadge";
import { useAppStore } from "@/store/app-store";
import { TIER_CONFIG } from "@/lib/tier-config";
import type { TierMismatchError, QuotaExceededError } from "@/types";

export function TierErrorModal() {
  const router = useRouter();
  const { tierError, setTierError } = useAppStore();

  if (!tierError) return null;

  const isTierMismatch = tierError.code === "TIER_MISMATCH";

  function handleUpgrade() {
    setTierError(null);
    router.push("/app/billing");
  }

  function handleDismiss() {
    setTierError(null);
  }

  return (
    <Dialog open={!!tierError} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            <DialogTitle className="text-lg">
              {isTierMismatch ? "Mode Not Available" : "Usage Limit Reached"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-zinc-400">
            {tierError.message}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {isTierMismatch && (
            <TierMismatchContent error={tierError as TierMismatchError} />
          )}
          {!isTierMismatch && (
            <QuotaExceededContent error={tierError as QuotaExceededError} />
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-zinc-700 text-zinc-300"
              onClick={handleDismiss}
            >
              Got it
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
              onClick={handleUpgrade}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Upgrade Plan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TierMismatchContent({ error }: { error: TierMismatchError }) {
  const requiredConfig = TIER_CONFIG[error.requiredTier];

  return (
    <div className="bg-zinc-800 rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-400">Your plan</span>
        <TierBadge tier={error.currentTier} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-400">Required for {error.requestedMode}</span>
        <TierBadge tier={error.requiredTier} />
      </div>
      {requiredConfig && (
        <div className="pt-2 border-t border-zinc-700">
          <span className="text-sm text-zinc-300">
            Starting at ${requiredConfig.price}/mo
          </span>
        </div>
      )}
    </div>
  );
}

function QuotaExceededContent({ error }: { error: QuotaExceededError }) {
  const dailyPct = Math.round(
    (error.usage.messagesSentToday / error.limit.messagesPerDay) * 100
  );
  const monthlyPct = Math.round(
    (error.usage.tokensUsedThisMonth / error.limit.tokensPerMonth) * 100
  );

  return (
    <div className="bg-zinc-800 rounded-lg p-4 space-y-3">
      <div>
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-zinc-400">Daily messages</span>
          <span className="text-zinc-300">
            {error.usage.messagesSentToday} / {error.limit.messagesPerDay}
          </span>
        </div>
        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all"
            style={{ width: `${Math.min(dailyPct, 100)}%` }}
          />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between text-sm mb-1">
          <span className="text-zinc-400">Monthly tokens</span>
          <span className="text-zinc-300">
            {formatTokens(error.usage.tokensUsedThisMonth)} /{" "}
            {formatTokens(error.limit.tokensPerMonth)}
          </span>
        </div>
        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 rounded-full transition-all"
            style={{ width: `${Math.min(monthlyPct, 100)}%` }}
          />
        </div>
      </div>
      <p className="text-xs text-zinc-500">
        Resets daily at midnight. Upgrade for higher limits.
      </p>
    </div>
  );
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toString();
}
