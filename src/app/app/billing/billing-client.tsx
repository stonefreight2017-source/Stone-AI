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
  ChevronDown,
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
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [tierDropdownOpen, setTierDropdownOpen] = useState(false);

  const PERIOD_INFO = {
    monthly: { label: "Monthly", discount: 0, months: 1 },
    semiannual: { label: "6 Months", discount: 10, months: 6 },
    annual: { label: "Annual", discount: 20, months: 12 },
  } as const;

  const upgradeTiers = tiers.filter((t) => t.key !== "FREE");

  // Default to the first tier above current, or the most popular
  useEffect(() => {
    if (!selectedTier) {
      const firstUpgrade = upgradeTiers.find(
        (t) => TIER_RANK[t.key] > TIER_RANK[currentTier]
      );
      setSelectedTier(firstUpgrade?.key ?? upgradeTiers[0]?.key ?? "STARTER");
    }
  }, [currentTier]);

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

  const TIER_DETAILS: Record<string, { tagline: string; features: string[]; highlight?: string }> = {
    STARTER: {
      tagline: "Plan and start your business",
      features: [
        "16 specialized AI agents",
        "200 messages/day",
        "10 Smart (GPT-4o) messages/day",
        "Cloud fallback protection",
        "File upload & analysis",
        "10 web searches/day",
        "5 document uploads",
        "1 AI Bestie companion",
        "Mobile app access",
      ],
    },
    PLUS: {
      tagline: "Plan, start, and maintain your business",
      highlight: "Most Popular",
      features: [
        "30 specialized AI agents",
        "500 messages/day",
        "30 Smart (GPT-4o) messages/day",
        "Image generation",
        "Voice interaction",
        "50 web searches/day",
        "Code execution sandbox",
        "25 document uploads",
        "3 integrations (Zapier, Google)",
        "3 AI Bestie companions",
        "Everything in Builder",
      ],
    },
    SMART: {
      tagline: "Plan, start, maintain, and run your business",
      features: [
        "All 42 specialized AI agents",
        "1,500 messages/day",
        "80 Smart (GPT-4o) messages/day",
        "Priority processing queue",
        "Custom Agent Builder",
        "200 web searches/day",
        "200 code executions/day",
        "100 document uploads",
        "10 integrations",
        "Team workspace",
        "SOC 2 compliance",
        "5 AI Bestie companions",
        "Everything in Growth",
      ],
    },
    PRO: {
      tagline: "Full platform access with reseller capabilities",
      highlight: "Reseller — earn from Stone AI",
      features: [
        "Unlimited messages",
        "150 Smart (GPT-4o) messages/day",
        "API access & developer keys",
        "Commercial license & white-label",
        "Custom model fine-tuning",
        "Unlimited integrations",
        "HIPAA compliance",
        "500 document uploads",
        "2x referral rewards",
        "10 AI Bestie companions",
        "Everything in Executive",
      ],
    },
  };

  const TIER_COLORS: Record<string, { border: string; accent: string; bg: string }> = {
    STARTER: { border: "border-blue-600", accent: "text-blue-400", bg: "bg-blue-500" },
    PLUS: { border: "border-indigo-600", accent: "text-indigo-400", bg: "bg-indigo-500" },
    SMART: { border: "border-purple-600", accent: "text-purple-400", bg: "bg-purple-500" },
    PRO: { border: "border-amber-500", accent: "text-amber-400", bg: "bg-amber-500" },
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

  const activeTier = upgradeTiers.find((t) => t.key === selectedTier) ?? upgradeTiers[0];
  const tierDetail = activeTier ? TIER_DETAILS[activeTier.key] : null;
  const tierColor = activeTier ? TIER_COLORS[activeTier.key] : null;
  const isCurrentPlan = activeTier?.key === currentTier;
  const isDowngrade = activeTier ? TIER_RANK[activeTier.key] < TIER_RANK[currentTier] : false;
  const isUpgrade = activeTier ? TIER_RANK[activeTier.key] > TIER_RANK[currentTier] : false;
  const isPro = activeTier?.key === "PRO";

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
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

      {/* Header */}
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

      {/* Upgrade Section — Dropdown + Detail Card */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-400" />
          Upgrade Your Plan
        </h2>

        {/* Billing Period Toggle */}
        <div className="flex items-center justify-center gap-1 mb-5 bg-zinc-800 rounded-lg p-1 max-w-sm mx-auto">
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

        {/* Tier Dropdown Selector */}
        <div className="relative max-w-sm mx-auto mb-5">
          <button
            onClick={() => setTierDropdownOpen(!tierDropdownOpen)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border ${
              tierColor?.border ?? "border-zinc-700"
            } bg-zinc-900 hover:bg-zinc-800/80 transition-colors`}
          >
            <div className="flex items-center gap-3">
              {isPro && <Crown className="h-4 w-4 text-amber-400" />}
              <span className="text-white font-semibold">{activeTier?.name}</span>
              {activeTier && (
                <span className="text-zinc-400 text-sm">
                  ${billingPeriod === "monthly"
                    ? activeTier.price
                    : (activeTier.price * (1 - PERIOD_INFO[billingPeriod].discount / 100)).toFixed(2)}/mo
                </span>
              )}
              {isCurrentPlan && (
                <Badge className="bg-emerald-900 text-emerald-300 text-xs ml-1">Current</Badge>
              )}
            </div>
            <ChevronDown className={`h-4 w-4 text-zinc-400 transition-transform ${tierDropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {tierDropdownOpen && (
            <div className="absolute z-20 top-full mt-1 w-full bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden shadow-xl">
              {upgradeTiers.map((t) => {
                const isCurrent = t.key === currentTier;
                const isSelected = t.key === selectedTier;
                const tPro = t.key === "PRO";
                return (
                  <button
                    key={t.key}
                    onClick={() => {
                      setSelectedTier(t.key);
                      setTierDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-zinc-800 transition-colors ${
                      isSelected ? "bg-zinc-800" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {tPro && <Crown className="h-4 w-4 text-amber-400" />}
                      <span className={`font-medium ${tPro ? "text-amber-400" : "text-white"}`}>{t.name}</span>
                      {t.popular && !isCurrent && (
                        <Badge className="bg-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0">Popular</Badge>
                      )}
                      {isCurrent && (
                        <Badge className="bg-emerald-900 text-emerald-300 text-[10px] px-1.5 py-0">Current</Badge>
                      )}
                    </div>
                    <span className="text-zinc-400 text-sm">
                      ${billingPeriod === "monthly"
                        ? t.price
                        : (t.price * (1 - PERIOD_INFO[billingPeriod].discount / 100)).toFixed(2)}/mo
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Tier Detail Card */}
        {activeTier && tierDetail && tierColor && (
          <Card className={`bg-zinc-900 ${tierColor.border} border transition-all`}>
            <CardContent className="pt-6 space-y-5">
              {/* Header row: name + price */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className={`text-xl font-bold ${isPro ? "text-amber-400" : "text-white"} flex items-center gap-2`}>
                    {isPro && <Crown className="h-5 w-5" />}
                    {activeTier.name}
                  </h3>
                  <p className="text-zinc-400 text-sm mt-0.5">{tierDetail.tagline}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white">
                      ${billingPeriod === "monthly"
                        ? activeTier.price
                        : (activeTier.price * (1 - PERIOD_INFO[billingPeriod].discount / 100)).toFixed(2)}
                    </span>
                    <span className="text-zinc-500 text-sm">/mo</span>
                  </div>
                  {billingPeriod !== "monthly" && (
                    <p className="text-xs text-zinc-500 mt-0.5">
                      <span className="line-through text-zinc-600 mr-1">${activeTier.price}/mo</span>
                      {PERIOD_INFO[billingPeriod].months === 6
                        ? `$${(activeTier.price * 6 * (1 - PERIOD_INFO[billingPeriod].discount / 100)).toFixed(2)} / 6 mo`
                        : `$${(activeTier.price * 12 * (1 - PERIOD_INFO[billingPeriod].discount / 100)).toFixed(2)} / yr`}
                    </p>
                  )}
                </div>
              </div>

              {/* Highlight badge */}
              {tierDetail.highlight && (
                <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${
                  isPro
                    ? "bg-amber-950/40 border border-amber-800/50 text-amber-300"
                    : "bg-amber-500/15 border border-amber-500/30 text-amber-400"
                }`}>
                  <Star className="h-3 w-3" />
                  {tierDetail.highlight}
                </div>
              )}

              {/* Features — 2-column grid for compactness */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                {tierDetail.features.map((f) => (
                  <div key={f} className="flex items-center gap-2 text-sm">
                    <Check className={`h-4 w-4 shrink-0 ${isPro ? "text-amber-400" : tierColor.accent}`} />
                    <span className={f.startsWith("Unlimited") || f.startsWith("Everything") ? "text-white font-medium" : "text-zinc-300"}>
                      {f}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action button */}
              <div className="pt-1">
                {isCurrentPlan ? (
                  <Button disabled className="w-full" variant="outline">
                    <Check className="h-4 w-4 mr-2" />
                    Current Plan
                  </Button>
                ) : isDowngrade ? (
                  <Button
                    variant="outline"
                    className="w-full border-zinc-700 text-zinc-400 hover:text-white"
                    onClick={handleManageBilling}
                    disabled={!hasStripeCustomer}
                  >
                    Downgrade via Billing Portal
                  </Button>
                ) : isUpgrade ? (
                  <Button
                    className={`w-full text-base py-5 ${
                      isPro
                        ? "bg-amber-500 text-black hover:bg-amber-400 font-semibold"
                        : "bg-white text-black hover:bg-zinc-200 font-medium"
                    }`}
                    onClick={() => handleUpgrade(activeTier.key)}
                    disabled={loadingCheckout === activeTier.key}
                  >
                    {loadingCheckout === activeTier.key ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : isPro ? (
                      <Crown className="h-4 w-4 mr-2" />
                    ) : (
                      <ArrowRight className="h-4 w-4 mr-2" />
                    )}
                    {isPro ? "Go Pro" : `Upgrade to ${activeTier.name}`}
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick tier comparison strip */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {upgradeTiers.map((t) => {
            const isCurrent = t.key === currentTier;
            const isSelected = t.key === selectedTier;
            const tColor = TIER_COLORS[t.key];
            return (
              <button
                key={t.key}
                onClick={() => setSelectedTier(t.key)}
                className={`text-center py-2 px-1 rounded-lg border transition-all text-xs ${
                  isSelected
                    ? `${tColor?.border} bg-zinc-800`
                    : "border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50"
                }`}
              >
                <p className={`font-semibold ${isSelected ? (t.key === "PRO" ? "text-amber-400" : "text-white") : "text-zinc-500"}`}>
                  {t.name}
                </p>
                <p className={`${isSelected ? "text-zinc-300" : "text-zinc-600"}`}>
                  ${billingPeriod === "monthly"
                    ? t.price
                    : (t.price * (1 - PERIOD_INFO[billingPeriod].discount / 100)).toFixed(0)}/mo
                </p>
                {isCurrent && (
                  <p className="text-emerald-500 text-[10px] font-medium mt-0.5">Current</p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* FAQ */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="pt-6 space-y-3">
          <h3 className="text-sm font-semibold text-zinc-300">Billing FAQ</h3>
          <div className="space-y-2 text-sm text-zinc-400">
            <p>
              <strong className="text-zinc-300">When am I charged?</strong>{" "}
              Your first charge happens at checkout. Renewals are automatic.
            </p>
            <p>
              <strong className="text-zinc-300">Can I cancel anytime?</strong>{" "}
              Yes. Click &quot;Manage Billing&quot; to cancel through Stripe. You keep
              access until the end of your billing period.
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
