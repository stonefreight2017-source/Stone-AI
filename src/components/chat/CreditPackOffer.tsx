"use client";

import { useState } from "react";
import { Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CREDIT_PACK_PRICES, type CreditPackTier } from "@/lib/tier-config";

interface CreditPackOfferProps {
  smartUsage: { sent: number; limit: number };
}

const PACK_ORDER: CreditPackTier[] = ["STARTER", "STANDARD", "POWER", "BULK"];

export function CreditPackOffer({ smartUsage }: CreditPackOfferProps) {
  const [loadingPack, setLoadingPack] = useState<CreditPackTier | null>(null);

  async function handleBuyPack(packTier: CreditPackTier) {
    setLoadingPack(packTier);
    try {
      const res = await fetch("/api/billing/credit-packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packTier }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to start checkout.");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoadingPack(null);
    }
  }

  return (
    <div className="rounded-lg border border-amber-800/40 bg-amber-950/20 p-4 my-2 max-w-md">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="h-4 w-4 text-amber-400" />
        <p className="text-sm font-medium text-amber-300">
          You&apos;ve used all {smartUsage.limit} Cloud AI messages today.
        </p>
      </div>
      <p className="text-xs text-zinc-400 mb-3">
        Need more? Grab a credit pack:
      </p>
      <div className="grid grid-cols-2 gap-2">
        {PACK_ORDER.map((tier) => {
          const pack = CREDIT_PACK_PRICES[tier];
          const priceStr = `$${(pack.price / 100).toFixed(2)}`;
          const isLoading = loadingPack === tier;
          return (
            <Button
              key={tier}
              variant="outline"
              size="sm"
              disabled={loadingPack !== null}
              onClick={() => handleBuyPack(tier)}
              className="border-amber-800/50 hover:border-amber-600/60 hover:bg-amber-900/20 text-zinc-200 text-xs"
            >
              {isLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>{pack.credits} credits &mdash; {priceStr}</>
              )}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
