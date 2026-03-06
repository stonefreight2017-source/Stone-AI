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

  const TIER_DETAILS: Record<string, { tagline: string; features: string[]; whyUpgrade: string; highlight?: string }> = {
    STARTER: {
      tagline: "Everything you need to plan and launch your first business",
      whyUpgrade: "Perfect if you have an idea and need help turning it into a real business. You get a team of 16 AI specialists that can write your business plan, research your market, and help you launch.",
      features: [
        "16 AI agents — like having a small team (marketing, finance, strategy, content, and more)",
        "250 messages a day — enough to have real working sessions with your AI team",
        "10 premium answers/day — powered by GPT-4o for complex questions that need deeper thinking",
        "Upload files for analysis — drop in spreadsheets, PDFs, or images and get instant insights",
        "10 web lookups/day — your agents can search the internet to give you current, real answers",
        "Store 10 documents — save your business plan, brand guide, or research so agents remember them",
        "1 AI Bestie — your personal companion that knows you and remembers every conversation",
        "Works on your phone — full access from any device, anywhere",
      ],
    },
    PLUS: {
      tagline: "For businesses that are growing and need more firepower",
      highlight: "Most Popular",
      whyUpgrade: "You've launched and now you need to grow. More agents, more daily capacity, plus powerful tools like AI image creation, voice chat, and app connections to automate your workflow.",
      features: [
        "30 AI agents — nearly the full team, covering every business function",
        "600 messages a day — enough for heavy daily use across multiple projects",
        "25 premium answers/day — more complex analysis, longer responses, deeper research",
        "AI image creation — generate product mockups, social media graphics, logos, and more",
        "Voice chat — talk to your agents out loud instead of typing (great for brainstorming)",
        "40 web lookups/day — agents check real-time data, competitor prices, trending topics",
        "Run code — test ideas, analyze data, or build prototypes right inside conversations",
        "30 saved documents — your agents remember your brand, products, and past research",
        "5 app connections — link Google, Zapier, or other tools so your AI team can work with your existing apps",
        "2 AI Besties — create different companions for different parts of your life",
        "Everything in Builder, plus commercial rights — use AI-generated content in your business",
      ],
    },
    SMART: {
      tagline: "Your full AI-powered business command center",
      whyUpgrade: "This is the executive suite. Every agent unlocked, priority speed, your own custom agents, team collaboration, and enterprise-grade security. Built for people who run real businesses.",
      features: [
        "All 42 AI agents — the complete team, zero restrictions",
        "1,500 messages a day — run your entire business through AI without hitting limits",
        "60 premium answers/day — deep strategy sessions, long-form content, complex analysis",
        "Priority speed — your requests go to the front of the line, every time",
        "Build your own agents — create custom AI specialists trained on your specific business needs",
        "150 web lookups + 150 code runs/day — serious research and development capacity",
        "100 saved documents — your AI team has deep knowledge of your entire business",
        "10 app connections — connect your CRM, email, project tools, and more",
        "Team workspace — invite your team to collaborate with shared agents and conversations",
        "SOC 2 compliance — enterprise security standards for regulated industries",
        "3 AI Besties — personal, business, and learning companions all at once",
        "Early access — try new agents and features 30 days before everyone else",
      ],
    },
    PRO: {
      tagline: "Full platform access + earn money reselling Stone AI",
      highlight: "Reseller — build a business on top of Stone AI",
      whyUpgrade: "Everything in Executive, plus the ability to resell Stone AI under your own brand. API access to build your own apps. HIPAA compliance for healthcare. Custom AI training. This is for entrepreneurs who want to build on top of our platform.",
      features: [
        "Unlimited messages — no daily cap, no throttling, use it as much as you need",
        "125 premium answers/day — the highest allocation for the most demanding workflows",
        "API access — build your own apps, websites, or tools powered by Stone AI",
        "White-label & commercial license — rebrand and resell to your own clients",
        "Custom model training — teach the AI about your specific industry, products, or processes",
        "Unlimited app connections — connect every tool in your stack",
        "HIPAA compliance — handle sensitive health data within legal requirements",
        "500 saved documents — a complete business knowledge library for your AI team",
        "2x referral rewards — earn double when you bring others to Stone AI",
        "5 AI Besties — one for every role in your life",
        "Everything in Executive, plus dedicated support",
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
                      Monthly capacity used
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

              {/* Why upgrade — plain English explanation */}
              <div className="bg-zinc-800/40 rounded-lg p-4 border border-zinc-700/50">
                <p className="text-sm text-zinc-300 leading-relaxed">{tierDetail.whyUpgrade}</p>
              </div>

              {/* Features — plain English, single column for readability */}
              <div className="space-y-2.5">
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">What you get:</p>
                {tierDetail.features.map((f) => {
                  const isBold = f.startsWith("Unlimited") || f.startsWith("Everything") || f.startsWith("All 42");
                  return (
                    <div key={f} className="flex items-start gap-2.5 text-sm">
                      <Check className={`h-4 w-4 shrink-0 mt-0.5 ${isPro ? "text-amber-400" : tierColor.accent}`} />
                      <span className={isBold ? "text-white font-medium" : "text-zinc-300"}>
                        {f}
                      </span>
                    </div>
                  );
                })}
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
          <div className="space-y-3 text-sm text-zinc-400">
            <p>
              <strong className="text-zinc-300">When am I charged?</strong>{" "}
              Your first charge happens at checkout. Renewals are automatic on the same date each month (or period).
            </p>
            <p>
              <strong className="text-zinc-300">Can I cancel anytime?</strong>{" "}
              Yes. Click &quot;Manage Billing&quot; above. You keep full access until the end of what you already paid for.
            </p>
            <p>
              <strong className="text-zinc-300">What if I run out of messages for the day?</strong>{" "}
              Your daily count resets at midnight. If you need more right now, you can grab a small credit pack from the Deals page — they start at $1.99 for 10 extra premium messages.
            </p>
            <p>
              <strong className="text-zinc-300">What are &quot;premium answers&quot;?</strong>{" "}
              These are powered by GPT-4o — a more advanced AI that gives deeper, longer, and more accurate responses. Regular messages use our fast local AI (unlimited). Premium is for when you need the best possible answer.
            </p>
            <p>
              <strong className="text-zinc-300">What are &quot;app connections&quot;?</strong>{" "}
              These let your AI agents talk to other apps you already use — like Google Docs, Zapier, Slack, or your CRM. More connections = more automation.
            </p>
            <p>
              <strong className="text-zinc-300">What are &quot;saved documents&quot;?</strong>{" "}
              Upload your business plan, product catalog, brand guidelines, or any reference material. Your AI agents will remember and reference these in every conversation — like giving your team a shared brain.
            </p>
            <p>
              <strong className="text-zinc-300">What happens if I downgrade?</strong>{" "}
              Your current plan stays active until the end of your billing cycle, then switches to the new plan. You won&apos;t lose any saved conversations.
            </p>
            <p>
              <strong className="text-zinc-300">I&apos;m not sure which plan is right for me.</strong>{" "}
              Start with Builder ($19.99/mo). It gives you everything you need to get going. You can always upgrade later and your conversations, documents, and bestie carry over.
            </p>
            <p>
              <strong className="text-zinc-300">Need help choosing or setting up?</strong>{" "}
              We&apos;re here. Email support@stone-ai.net or use the Help &amp; Support page. If you&apos;re on a paid plan, we&apos;ll walk you through everything personally — that&apos;s our promise.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
