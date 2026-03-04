"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  CreditCard,
  Zap,
  MessageSquare,
  Brain,
  TrendingUp,
  ExternalLink,
  Check,
  ArrowRight,
  Loader2,
  Crown,
  Infinity,
  Shield,
  Code2,
  Blocks,
  Rocket,
  Users,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TierBadge } from "@/components/billing/TierBadge";

interface TierOption {
  key: string;
  name: string;
  price: number;
  badge: string;
  popular: boolean;
}

interface UsageData {
  usage: {
    messagesToday: number;
    messagesLimit: number;
    tokensThisMonth: number;
    tokensLimit: number;
    localRequests: number;
    smartRequests: number;
    totalMessages: number;
  };
  stats: {
    conversations: number;
    agentSessions: number;
  };
}

interface BillingClientProps {
  currentTier: string;
  tierName: string;
  price: number;
  subscriptionStatus: string;
  hasStripeCustomer: boolean;
  tiers: TierOption[];
}

export function BillingClient({
  currentTier,
  tierName,
  price,
  subscriptionStatus,
  hasStripeCustomer,
  tiers,
}: BillingClientProps) {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");
  const upgradedTier = searchParams.get("tier");

  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loadingCheckout, setLoadingCheckout] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "semiannual" | "annual">("monthly");

  const PERIOD_INFO = {
    monthly: { label: "Monthly", discount: 0, months: 1 },
    semiannual: { label: "6 Months", discount: 10, months: 6 },
    annual: { label: "Annual", discount: 20, months: 12 },
  } as const;

  useEffect(() => {
    fetch("/api/user/usage")
      .then((r) => r.json())
      .then((data) => setUsageData(data))
      .catch(() => {});
  }, []);

  async function handleUpgrade(tier: string) {
    setLoadingCheckout(tier);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, period: billingPeriod }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch {
      alert("Failed to create checkout session");
    } finally {
      setLoadingCheckout(null);
    }
  }

  async function handleManageBilling() {
    setLoadingPortal(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Something went wrong");
      }
    } catch {
      alert("Failed to open billing portal");
    } finally {
      setLoadingPortal(false);
    }
  }

  const TIER_RANK: Record<string, number> = {
    FREE: 0, STARTER: 1, PLUS: 2, SMART: 3, PRO: 4,
  };

  const TIER_FEATURES: Record<string, string[]> = {
    STARTER: [
      "150 messages/day",
      "Local AI model",
      "20-message context",
    ],
    PLUS: [
      "490 messages/day",
      "Conversation export",
      "40-message context",
    ],
    SMART: [
      "980 messages/day",
      "GPT-4o cloud model",
      "Auto model routing",
      "60-message context",
    ],
    PRO: [
      "Unlimited messages",
      "Priority queue",
      "API access & keys",
      "Custom Agent Builder",
      "Commercial license",
      "Early access to new agents",
      "2x referral rewards",
      "100-message context",
    ],
  };

  function formatTokens(n: number): string {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toString();
  }

  function usagePercent(used: number, limit: number): number {
    if (limit === 0) return 0;
    return Math.min(Math.round((used / limit) * 100), 100);
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      {/* Success/cancel banners */}
      {success && (
        <div className="bg-emerald-900/40 border border-emerald-700 rounded-lg p-4 flex items-center gap-3">
          <Check className="h-5 w-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-emerald-300 font-medium">
              Welcome to {upgradedTier ?? "your new plan"}!
            </p>
            <p className="text-emerald-400/70 text-sm">
              Your account has been upgraded. Enjoy your new features.
            </p>
          </div>
        </div>
      )}
      {canceled && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
          <p className="text-zinc-300">
            Checkout was canceled. No charges were made.
          </p>
        </div>
      )}

      {/* Current Plan */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Billing</h1>
        <p className="text-zinc-400">Manage your subscription and usage</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Current Plan Card */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-zinc-300 text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <TierBadge tier={currentTier} />
              <span className="text-2xl font-bold text-white">
                {price === 0 ? "Free" : `$${price}/mo`}
              </span>
            </div>

            <div className="text-sm text-zinc-400">
              Status:{" "}
              <span
                className={
                  subscriptionStatus === "ACTIVE"
                    ? "text-emerald-400"
                    : subscriptionStatus === "PAST_DUE"
                    ? "text-amber-400"
                    : "text-zinc-500"
                }
              >
                {subscriptionStatus === "ACTIVE"
                  ? "Active"
                  : subscriptionStatus === "PAST_DUE"
                  ? "Past Due"
                  : subscriptionStatus === "CANCELED"
                  ? "Canceled"
                  : "No subscription"}
              </span>
            </div>

            {hasStripeCustomer && (
              <Button
                variant="outline"
                className="w-full border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                onClick={handleManageBilling}
                disabled={loadingPortal}
              >
                {loadingPortal ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Manage Billing
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Usage Card */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-zinc-300 text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Usage This Period
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {usageData ? (
              <>
                {/* Messages today */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-400 flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      Messages today
                    </span>
                    <span className="text-zinc-300">
                      {usageData.usage.messagesToday} / {usageData.usage.messagesLimit}
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{
                        width: `${usagePercent(usageData.usage.messagesToday, usageData.usage.messagesLimit)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Tokens this month */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-400 flex items-center gap-1">
                      <Brain className="h-3 w-3" />
                      Tokens this month
                    </span>
                    <span className="text-zinc-300">
                      {formatTokens(usageData.usage.tokensThisMonth)} /{" "}
                      {formatTokens(usageData.usage.tokensLimit)}
                    </span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{
                        width: `${usagePercent(usageData.usage.tokensThisMonth, usageData.usage.tokensLimit)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-white">{usageData.stats.conversations}</p>
                    <p className="text-xs text-zinc-500">Conversations</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-white">{usageData.stats.agentSessions}</p>
                    <p className="text-xs text-zinc-500">Agent Sessions</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Plan Comparison */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-400" />
          Upgrade Your Plan
        </h2>

        {/* Billing Period Toggle */}
        <div className="flex items-center justify-center gap-1 mb-6 bg-zinc-800 rounded-lg p-1 max-w-md mx-auto">
          {(["monthly", "semiannual", "annual"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setBillingPeriod(p)}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                billingPeriod === p
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {PERIOD_INFO[p].label}
              {PERIOD_INFO[p].discount > 0 && (
                <span className="ml-1 text-emerald-400 text-xs font-bold">
                  -{PERIOD_INFO[p].discount}%
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {tiers
            .filter((t) => t.key !== "FREE")
            .map((t) => {
              const isCurrentPlan = t.key === currentTier;
              const isDowngrade = TIER_RANK[t.key] < TIER_RANK[currentTier];
              const isUpgrade = TIER_RANK[t.key] > TIER_RANK[currentTier];
              const isPro = t.key === "PRO";
              const features = TIER_FEATURES[t.key] || [];

              return (
                <Card
                  key={t.key}
                  className={`bg-zinc-900 border transition-colors relative ${
                    isCurrentPlan
                      ? "border-emerald-600"
                      : t.popular
                      ? "border-amber-500 ring-1 ring-amber-500/30"
                      : "border-zinc-800"
                  }`}
                >
                  {t.popular && !isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-amber-500 text-black text-xs font-bold px-3 py-0.5">
                        <Crown className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold ${isPro ? "text-amber-400" : "text-white"}`}>
                        {isPro && <Crown className="h-4 w-4 inline mr-1.5 -mt-0.5" />}
                        {t.name}
                      </h3>
                      {isCurrentPlan && (
                        <Badge className="bg-emerald-900 text-emerald-300 text-xs">
                          Current
                        </Badge>
                      )}
                    </div>

                    <div>
                      <span className="text-3xl font-bold text-white">
                        ${billingPeriod === "monthly"
                          ? t.price
                          : (t.price * (1 - PERIOD_INFO[billingPeriod].discount / 100)).toFixed(2)}
                      </span>
                      <span className="text-zinc-500 text-sm">/mo</span>
                      {billingPeriod !== "monthly" && (
                        <div className="text-xs text-zinc-500 mt-1">
                          <span className="text-emerald-400 line-through mr-1">${t.price}/mo</span>
                          billed ${
                            PERIOD_INFO[billingPeriod].months === 6
                              ? `$${(t.price * 6 * (1 - PERIOD_INFO[billingPeriod].discount / 100)).toFixed(2)} every 6 months`
                              : `$${(t.price * 12 * (1 - PERIOD_INFO[billingPeriod].discount / 100)).toFixed(2)}/year`
                          }
                        </div>
                      )}
                    </div>

                    {/* Feature list */}
                    <ul className="space-y-1.5 text-sm">
                      {features.map((f) => (
                        <li key={f} className="flex items-start gap-2">
                          <Check className={`h-4 w-4 shrink-0 mt-0.5 ${isPro ? "text-amber-400" : "text-emerald-400"}`} />
                          <span className={f === "Unlimited messages" ? "text-white font-medium" : "text-zinc-400"}>
                            {f}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Founding Member callout — PRO only */}
                    {isPro && (
                      <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-2.5">
                        <p className="text-xs text-amber-300 font-medium flex items-center gap-1.5">
                          <Star className="h-3 w-3" />
                          Founding Member — price locked forever
                        </p>
                      </div>
                    )}

                    {isCurrentPlan ? (
                      <Button disabled className="w-full" variant="outline">
                        <Check className="h-4 w-4 mr-2" />
                        Current Plan
                      </Button>
                    ) : isDowngrade ? (
                      <Button
                        variant="outline"
                        className="w-full border-zinc-700 text-zinc-500"
                        onClick={handleManageBilling}
                        disabled={!hasStripeCustomer}
                      >
                        Manage via Portal
                      </Button>
                    ) : isUpgrade ? (
                      <Button
                        className={`w-full ${
                          isPro
                            ? "bg-amber-500 text-black hover:bg-amber-400 font-semibold"
                            : "bg-white text-black hover:bg-zinc-200"
                        }`}
                        onClick={() => handleUpgrade(t.key)}
                        disabled={loadingCheckout === t.key}
                      >
                        {loadingCheckout === t.key ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : isPro ? (
                          <Crown className="h-4 w-4 mr-2" />
                        ) : (
                          <ArrowRight className="h-4 w-4 mr-2" />
                        )}
                        {isPro ? "Go Pro" : "Upgrade"}
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </div>

      {/* FAQ / Info */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-300">Billing FAQ</h3>
          <div className="space-y-2 text-sm text-zinc-400">
            <p>
              <strong className="text-zinc-300">When am I charged?</strong>{" "}
              Subscriptions are billed monthly. Your first charge happens at
              checkout.
            </p>
            <p>
              <strong className="text-zinc-300">Can I cancel anytime?</strong>{" "}
              Yes. Click "Manage Billing" to cancel through Stripe. You keep
              access until the end of the billing period.
            </p>
            <p>
              <strong className="text-zinc-300">What happens if I downgrade?</strong>{" "}
              Your current plan stays active until the end of the billing cycle,
              then switches to the new plan.
            </p>
            <p>
              <strong className="text-zinc-300">Need help?</strong>{" "}
              Contact support at support@stone-ai.net
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
