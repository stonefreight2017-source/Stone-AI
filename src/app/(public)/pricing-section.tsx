"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Star, Crown, ArrowRight, Building2, ChevronDown, MessageSquare, Brain, Zap, Users as UsersIcon, Heart, Sparkles, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TierDetails {
  messagesPerDay: string;
  tokensPerMonth: string;
  maxResponse: string;
  concurrentChats: string;
  requestsPerMinute: string;
  contextMemory: string;
  aiModes: string;
  autoRouting: boolean;
  conversationExport: boolean;
  priorityQueue: boolean;
  apiAccess: boolean;
  besties: string;
  agents: string;
  billingOptions: string;
}

type BillingPeriod = "monthly" | "6month" | "annual";

interface TierInfo {
  key: string;
  name: string;
  tagline: string;
  price: number;
  price6month: number;
  priceAnnual: number;
  priceDisplay: string;
  popular?: boolean;
  enterprise?: boolean;
  color: string;
  accentText: string;
  features: { text: string; highlight?: boolean; link?: string }[];
  details: TierDetails;
}

const TIERS: TierInfo[] = [
  {
    key: "FREE",
    name: "Free",
    tagline: "Ask a question at 10pm and get an answer before your finger leaves the key",
    price: 0,
    price6month: 0,
    priceAnnual: 0,
    priceDisplay: "$0",
    color: "border-zinc-600",
    accentText: "text-zinc-300",
    features: [
      { text: "Starts responding in under 100ms — faster than you can switch tabs" },
      { text: "4 AI agents to plan, write, learn, and stay on track", highlight: true },
      { text: "1 AI Bestie — powered by 4 specialist agents — that remembers you tomorrow" },
      { text: "Every conversation saved — pick up right where you left off" },
      { text: "Your data is never sold or shared. Local Mode keeps data on our servers; Smart Mode uses Anthropic (opt-in)." },
      { text: "No credit card — sign up with Google, Apple, or email in seconds" },
    ],
    details: {
      messagesPerDay: "100",
      tokensPerMonth: "200K",
      maxResponse: "1,200 tokens",
      concurrentChats: "1",
      requestsPerMinute: "3",
      contextMemory: "15 messages",
      aiModes: "Local + 5 lifetime premium credits",
      autoRouting: false,
      conversationExport: false,
      priorityQueue: false,
      apiAccess: false,
      besties: "1 AI Bestie (4-agent knowledge)",
      agents: "4 AI Agents (Onboarding, Bestie, Wellness, Tutor)",
      billingOptions: "Free forever (ad-supported)",
    },
  },
  {
    key: "STARTER",
    name: "Builder",
    tagline: "Go from napkin sketch to first revenue — your AI co-founder never sleeps",
    price: 19.99,
    price6month: 18.99,
    priceAnnual: 16.99,
    priceDisplay: "$19.99",
    color: "border-blue-600",
    accentText: "text-blue-400",
    features: [
      { text: "Everything in Free" },
      { text: "16 agents: your copywriter, strategist, developer, and 13 more", highlight: true },
      { text: "10 Smart Mode answers/day for the hard questions that need genius-level thinking", highlight: true },
      { text: "250 messages/day — enough to draft a full business plan before lunch" },
      { text: "Export conversations as docs — hand them straight to clients or partners" },
      { text: "1 AI Bestie — powered by 16 specialist agents — that learns your voice and goals over time" },
    ],
    details: {
      messagesPerDay: "250",
      tokensPerMonth: "6M",
      maxResponse: "2,500 tokens",
      concurrentChats: "2",
      requestsPerMinute: "10",
      contextMemory: "25 messages",
      aiModes: "Local + 10 premium/day (Smart Mode)",
      autoRouting: false,
      conversationExport: true,
      priorityQueue: false,
      apiAccess: false,
      besties: "1 AI Bestie (16-agent knowledge)",
      agents: "16 Specialist Agents (Business, Content, Marketing)",
      billingOptions: "$19.99/mo · $18.99/mo (6-mo, 5% off) · $16.99/mo (yearly, 15% off)",
    },
  },
  {
    key: "PLUS",
    name: "Growth",
    tagline: "The moment your side hustle starts feeling like a real company",
    price: 49.99,
    price6month: 47.49,
    priceAnnual: 42.49,
    priceDisplay: "$49.99",
    color: "border-purple-600",
    accentText: "text-purple-400",
    features: [
      { text: "Everything in Builder" },
      { text: "30 agents covering marketing, legal, finance, dev, HR, and sales", highlight: true },
      { text: "15 Smart Mode answers/day — cloud-powered AI for the hard questions", highlight: true },
      { text: "500 messages/day — enough for a growing team across multiple projects" },
      { text: "Commercial rights — use AI-generated content in your business, no attribution", highlight: true },
      { text: "1 AI Bestie — powered by 30 specialist agents — career, finance, wellness, and more" },
    ],
    details: {
      messagesPerDay: "500",
      tokensPerMonth: "15M",
      maxResponse: "3,500 tokens",
      concurrentChats: "3",
      requestsPerMinute: "15",
      contextMemory: "40 messages",
      aiModes: "Local + 15 premium/day (Smart Mode)",
      autoRouting: false,
      conversationExport: true,
      priorityQueue: false,
      apiAccess: false,
      besties: "1 AI Bestie (30-agent knowledge)",
      agents: "30 Specialist Agents (all categories)",
      billingOptions: "$49.99/mo · $47.49/mo (6-mo, 5% off) · $42.49/mo (yearly, 15% off)",
    },
  },
  {
    key: "SMART",
    name: "Executive",
    tagline: "39 AI specialists, one monthly investment — working for you every day of the month",
    price: 99.99,
    price6month: 94.99,
    priceAnnual: 84.99,
    priceDisplay: "$99.99",
    popular: true,
    color: "border-amber-500",
    accentText: "text-amber-400",
    features: [
      { text: "Everything in Growth" },
      { text: "39 agents across strategy, legal, finance, dev, marketing, and ops — your full executive floor, staffed overnight", highlight: true },
      { text: "Each agent handles a different business domain — strategy, legal, finance, dev, marketing, and ops", highlight: true },
      { text: "1,000 messages/day with priority queue — decisions at the speed your business actually moves" },
      { text: "30 Smart Mode answers/day — deep strategy, board-ready reports, complex financial analysis" },
      { text: "Early access — try new agents and features 30 days before everyone else" },
      { text: "1 AI Bestie — powered by 39 specialist agents — a thinking partner that knows every corner of your operation", highlight: true },
    ],
    details: {
      messagesPerDay: "1,000",
      tokensPerMonth: "40M",
      maxResponse: "6,000 tokens",
      concurrentChats: "4",
      requestsPerMinute: "25",
      contextMemory: "60 messages",
      aiModes: "Local + 30 premium/day (Smart Mode)",
      autoRouting: false,
      conversationExport: true,
      priorityQueue: false,
      apiAccess: false,
      besties: "1 AI Bestie (39-agent knowledge)",
      agents: "39 Specialist Agents (nearly every category)",
      billingOptions: "$99.99/mo · $94.99/mo (6-mo, 5% off) · $84.99/mo (yearly, 15% off)",
    },
  },
  {
    key: "PRO",
    name: "Reseller",
    tagline: "White-label it, resell it, build your own AI agency on top of ours",
    price: 200,
    price6month: 200,
    priceAnnual: 190,
    priceDisplay: "$200",
    color: "border-amber-400",
    accentText: "text-amber-300",
    features: [
      { text: "Everything in Executive" },
      { text: "All 42 agents + full API — plug AI into your own products overnight", highlight: true },
      { text: "Commercial license + reseller rights — charge your clients, keep the margin", highlight: true },
      { text: "3,000 messages/day + 50 Smart Mode answers — enough firepower to serve a client roster" },
      { text: "Commercial license + reseller rights — charge your clients, keep the margin", highlight: true },
      { text: "1 AI Bestie — powered by all 42 specialist agents — a genius operator across your entire business" },
      { text: "2x referral rewards — earn double commission when you bring others to Stone AI" },
    ],
    details: {
      messagesPerDay: "3,000",
      tokensPerMonth: "100M",
      maxResponse: "8,000 tokens",
      concurrentChats: "6",
      requestsPerMinute: "30",
      contextMemory: "80 messages",
      aiModes: "Local + 50 premium/day (Smart Mode)",
      autoRouting: false,
      conversationExport: true,
      priorityQueue: false,
      apiAccess: true,
      besties: "1 AI Bestie (all 42-agent knowledge)",
      agents: "All 42 Specialist Agents + API + reseller",
      billingOptions: "$200/mo · $190/mo (yearly, 5% off)",
    },
  },
  {
    key: "ENTERPRISE",
    name: "Enterprise",
    tagline: "One AI platform your whole team shares — every department, one subscription",
    price: 500,
    price6month: 500,
    priceAnnual: 475,
    priceDisplay: "From $500",
    enterprise: true,
    color: "border-emerald-500",
    accentText: "text-emerald-400",
    features: [
      { text: "Everything in Reseller" },
      { text: "Seats for your whole team — everyone gets their own agents and API keys", highlight: true },
      { text: "Dedicated GPU infrastructure — your workloads never compete for resources", highlight: true },
      { text: "99.5% uptime SLA with service credits", highlight: true, link: "/sla" },
      { text: "SSO/SAML + audit logging — IT signs off on day one" },
      { text: "50K+ requests/day — enough for department-wide rollouts across the org" },
      { text: "Dedicated support channel — real humans, same-day responses" },
    ],
    details: {
      messagesPerDay: "50,000+ (custom)",
      tokensPerMonth: "Custom",
      maxResponse: "Custom",
      concurrentChats: "Custom",
      requestsPerMinute: "Custom",
      contextMemory: "100+ messages",
      aiModes: "All modes + dedicated infrastructure",
      autoRouting: true,
      conversationExport: true,
      priorityQueue: true,
      apiAccess: true,
      besties: "2 AI Besties (all 42+ agent knowledge each)",
      agents: "All 42 + custom agent development",
      billingOptions: "From $500/mo · $475/mo (yearly, 5% off) · Net 30/60/90",
    },
  },
];

export function PricingSection() {
  const [selected, setSelected] = useState("SMART");
  const [showDetails, setShowDetails] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");


  const tier = TIERS.find((t) => t.key === selected)!;
  const isPro = tier.key === "PRO";
  const isEnterprise = tier.key === "ENTERPRISE";

  const getCurrentPrice = (t: TierInfo) => {
    if (t.price === 0) return t.price;
    if (billingPeriod === "6month") return t.price6month;
    if (billingPeriod === "annual") return t.priceAnnual;
    return t.price;
  };

  const formatPrice = (t: TierInfo) => {
    const p = getCurrentPrice(t);
    if (p === 0) return "$0";
    if (t.enterprise) return `From $${p}`;
    return `$${p % 1 === 0 ? p : p.toFixed(2)}`;
  };

  return (
    <section id="pricing" className="px-6 pb-24 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-4">
        More speed. More intelligence. Your call.
      </h2>
      <p className="text-center text-zinc-400 mb-8 max-w-lg mx-auto">
        Every tier puts more specialists in your corner and more hours back in your week.
        Start free, scale when the results speak for themselves.
      </p>

      {/* Founding Member Promo Banner — Always visible */}
        <div className="mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-top-4 duration-500">
          {/* Shimmer border wrapper */}
          <div className="relative rounded-2xl p-[2px] bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 shadow-lg shadow-amber-900/20"
               style={{ backgroundSize: "200% 100%", animation: "promoShimmer 3s ease-in-out infinite" }}>
            <div className="bg-zinc-900 rounded-2xl p-6 md:p-8">
              {/* Header */}
              <div className="flex items-center justify-center gap-2 mb-1">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <h3 className="text-lg md:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-yellow-500">
                  Limited Launch Deals
                </h3>
                <Sparkles className="h-5 w-5 text-amber-400" />
              </div>
              <p className="text-center text-sm text-zinc-400 mb-6">
                Lock in founding member pricing — these one-time offers disappear once you leave.
              </p>

              {/* Three promo cards side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                {/* Starter Deal — Builder at $9.99 */}
                <div className="relative bg-zinc-800/60 border border-emerald-700/50 rounded-xl p-5 flex flex-col">
                  <div className="absolute -top-2.5 left-4">
                    <span className="bg-emerald-700 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                      First Month
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 mt-2 mb-2">Builder plan</p>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-zinc-400 line-through text-base">$19.99</span>
                    <span className="text-2xl font-bold text-emerald-400">$9.99</span>
                    <span className="text-zinc-400 text-sm">/mo</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="inline-block bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                      Save $10 first month
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <CreditCard className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="text-xs text-zinc-400">Credit card required</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                    One-time offer — $9.99 for your first 30 days, then $19.99/mo. Try the full Builder experience.
                  </p>
                  <div className="mt-auto">
                    <Button asChild size="sm" className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-semibold">
                      <Link href="/sign-up">
                        Claim $9.99 Deal
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Launch Trial — Builder at $14.99 */}
                <div className="relative bg-zinc-800/60 border border-emerald-700/50 rounded-xl p-5 flex flex-col">
                  <div className="absolute -top-2.5 left-4">
                    <span className="bg-emerald-700 text-white text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                      Launch Trial
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 mt-2 mb-2">Builder plan</p>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-zinc-400 line-through text-base">$19.99</span>
                    <span className="text-2xl font-bold text-emerald-400">$14.99</span>
                    <span className="text-zinc-400 text-sm">/mo</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="inline-block bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                      Save $5/mo
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <CreditCard className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="text-xs text-zinc-400">Credit card required</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                    One-time offer — price locked while your subscription is active. Founding members earn the <span className="text-amber-400 font-medium">OG</span> badge.
                  </p>
                  <div className="mt-auto">
                    <Button asChild size="sm" className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-semibold">
                      <Link href="/sign-up">
                        Claim $14.99 Deal
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Growth Early Adopter — Growth at $39.99 */}
                <div className="relative bg-zinc-800/60 border border-amber-700/50 rounded-xl p-5 flex flex-col">
                  <div className="absolute -top-2.5 left-4">
                    <span className="bg-amber-600 text-black text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                      Early Adopter
                    </span>
                  </div>
                  <p className="text-sm text-zinc-400 mt-2 mb-0.5">Growth plan</p>
                  <p className="text-xs text-emerald-400 font-medium mb-2">+ 7-day free trial</p>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-zinc-400 line-through text-base">$49.99</span>
                    <span className="text-2xl font-bold text-amber-400">$39.99</span>
                    <span className="text-zinc-400 text-sm">/mo</span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="inline-block bg-amber-500/20 text-amber-400 text-xs font-semibold px-2 py-0.5 rounded-full">
                      Save $10/mo
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <CreditCard className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="text-xs text-zinc-400">Credit card required</span>
                  </div>
                  <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                    One-time offer — price locked while your subscription is active. Founding members earn the <span className="text-amber-400 font-medium">OG</span> badge.
                  </p>
                  <div className="mt-auto">
                    <Button asChild size="sm" className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold">
                      <Link href="/sign-up">
                        Claim $39.99 Deal
                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>

              {/* OG badge note */}
              <p className="text-center text-xs text-zinc-400 mb-4">
                OG badges are visible across forums, profiles, and every app on Stone AI.
              </p>

              {/* Always visible — no dismiss */}
            </div>
          </div>

          {/* Shimmer keyframes injected via style tag */}
          <style jsx>{`
            @keyframes promoShimmer {
              0%, 100% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
            }
          `}</style>
        </div>

      {/* Billing period toggle */}
      <div className="flex items-center justify-center gap-1 mb-8 bg-zinc-900 rounded-lg p-1 max-w-md mx-auto" role="radiogroup" aria-label="Billing period">
        {(["monthly", "6month", "annual"] as const)
          .filter((period) => {
            // Hide 6-month option when the selected tier has no 6-month discount
            if (period === "6month" && tier.price6month >= tier.price && tier.price > 0) return false;
            return true;
          })
          .map((period) => {
          const labels: Record<BillingPeriod, string> = { monthly: "Monthly", "6month": "6-Month", annual: "Yearly" };
          const savings: Record<BillingPeriod, string> = { monthly: "", "6month": "5% off", annual: "up to 15% off" };
          const isActive = billingPeriod === period;
          return (
            <button
              key={period}
              role="radio"
              aria-checked={isActive}
              onClick={() => setBillingPeriod(period)}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                isActive
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {labels[period]}
              {savings[period] && (
                <span className={`ml-1 text-xs font-semibold ${isActive ? "text-emerald-600" : "text-emerald-400"}`}>
                  {savings[period]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tier selector pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8" role="radiogroup" aria-label="Select pricing tier">
        {TIERS.map((t) => {
          const isActive = t.key === selected;
          return (
            <button
              key={t.key}
              role="radio"
              aria-checked={isActive}
              onClick={() => {
                setSelected(t.key);
                setShowDetails(false);
                // If switching to a tier with no 6-month discount while on 6-month billing, reset to monthly
                if (billingPeriod === "6month" && t.price6month >= t.price && t.price > 0) {
                  setBillingPeriod("monthly");
                }
              }}
              className={`relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? `bg-zinc-800 ${t.accentText} ring-1 ring-current`
                  : "bg-zinc-900 text-zinc-400 hover:text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {t.key === "PRO" && <Crown className="h-3.5 w-3.5" />}
                {t.key === "ENTERPRISE" && <Building2 className="h-3.5 w-3.5" />}
                {t.name}
              </span>
              {t.popular && (
                <span className="absolute -top-2 -right-1 bg-amber-500 text-black text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
                  Popular
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected tier detail card */}
      <Card className={`bg-zinc-900 ${tier.color} border-2 p-6 md:p-8 transition-all`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {isPro && <Crown className="h-5 w-5 text-amber-400" />}
              {isEnterprise && <Building2 className="h-5 w-5 text-emerald-400" />}
              <h3 className={`text-2xl font-bold ${tier.accentText}`}>{tier.name}</h3>
              {tier.popular && (
                <Badge className="bg-amber-500/20 text-amber-400 text-xs px-2 py-0.5">
                  <Star className="h-3 w-3 mr-1" /> Most Popular
                </Badge>
              )}
            </div>
            <p className="text-zinc-400 text-sm">{tier.tagline}</p>
          </div>
          <div className="text-left sm:text-right">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-white">{formatPrice(tier)}</span>
              {tier.price > 0 && <span className="text-zinc-400">/mo</span>}
            </div>
            {billingPeriod === "6month" && tier.price6month < tier.price && (
              <p className="text-xs text-emerald-400 mt-1">
                {isEnterprise
                  ? `Billed $${(getCurrentPrice(tier) * 6).toFixed(0)} every 6 months (5% off)`
                  : `Billed $${(getCurrentPrice(tier) * 6).toFixed(2)} every 6 months (5% off)`}
              </p>
            )}
            {billingPeriod === "annual" && tier.priceAnnual < tier.price && (
              <p className="text-xs text-emerald-400 mt-1">
                {(() => {
                  const discount = (isEnterprise || isPro) ? "5% off" : "15% off";
                  return isEnterprise
                    ? `Billed $${(getCurrentPrice(tier) * 12).toFixed(0)} per year (${discount})`
                    : `Billed $${(getCurrentPrice(tier) * 12).toFixed(2)} per year (${discount})`;
                })()}
              </p>
            )}
            {tier.key === "STARTER" && (
              <p className="text-xs text-amber-400 mt-1 font-medium">
                <Sparkles className="inline h-3 w-3 mr-1" />
                Launch deal: $9.99 first month <span className="text-zinc-400 line-through">$19.99</span>
              </p>
            )}
            {tier.key === "PLUS" && (
              <p className="text-xs text-amber-400 mt-1 font-medium">
                <Sparkles className="inline h-3 w-3 mr-1" />
                Early adopter: $39.99/mo <span className="text-zinc-400 line-through">$49.99</span> — OG badge included
              </p>
            )}
          </div>
        </div>

        {/* Features in 2-column layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 mb-6">
          {tier.features.map((f, i) => (
            <div key={i} className="flex items-center gap-2.5 text-sm">
              <Check className={`h-4 w-4 shrink-0 ${f.highlight ? "text-amber-400" : "text-emerald-400"}`} />
              <span className={f.highlight ? "text-white font-medium" : "text-zinc-300"}>
                {f.text}
                {f.link && (
                  <>
                    {" "}
                    <Link href={f.link} className="text-emerald-400 underline text-xs hover:text-emerald-300">
                      (see SLA)
                    </Link>
                  </>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Full Details Toggle */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-4 group"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${showDetails ? "rotate-180" : ""}`} />
          <span>{showDetails ? "Hide" : "Show"} full details</span>
        </button>

        {/* Expandable Details Panel */}
        {showDetails && (
          <div className="border-t border-zinc-800 pt-5 mb-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Capacity & Performance */}
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Zap className="h-3 w-3" /> Capacity & Performance
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-400 uppercase">Messages / Day</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{tier.details.messagesPerDay}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-400 uppercase">Tokens / Month</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{tier.details.tokensPerMonth}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-400 uppercase">Max Response</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{tier.details.maxResponse}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-400 uppercase">Concurrent Chats</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{tier.details.concurrentChats}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-400 uppercase">Requests / Minute</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{tier.details.requestsPerMinute}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-400 uppercase">Context Memory</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{tier.details.contextMemory}</p>
                </div>
              </div>
            </div>

            {/* AI & Agents */}
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Brain className="h-3 w-3" /> AI & Agents
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-400 uppercase">AI Modes</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{tier.details.aiModes}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-xs text-zinc-400 uppercase">Specialist Agents</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{tier.details.agents}</p>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div>
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MessageSquare className="h-3 w-3" /> Features
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: "Auto-Routing", enabled: tier.details.autoRouting },
                  { label: "Export Chats", enabled: tier.details.conversationExport },
                  { label: "Priority Queue", enabled: tier.details.priorityQueue },
                  { label: "API Access", enabled: tier.details.apiAccess },
                ].map((feat) => (
                  <div key={feat.label} className="flex items-center gap-2 bg-zinc-800/50 rounded-lg p-2.5">
                    {feat.enabled ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" aria-hidden="true" />
                    ) : (
                      <span className="h-3.5 w-3.5 text-zinc-400 shrink-0 text-center leading-none">&mdash;</span>
                    )}
                    <span className={`text-xs ${feat.enabled ? "text-zinc-200" : "text-zinc-400"}`}>
                      {feat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bestie & Billing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <p className="text-xs text-zinc-400 uppercase flex items-center gap-1">
                  <Heart className="h-2.5 w-2.5" /> AI Bestie Companions
                </p>
                <p className="text-sm font-semibold text-white mt-0.5">{tier.details.besties}</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <p className="text-xs text-zinc-400 uppercase">Billing Options</p>
                <p className="text-sm font-semibold text-white mt-0.5">{tier.details.billingOptions}</p>
              </div>
            </div>
          </div>
        )}


        {/* CTA */}
        <Button
          asChild
          size="lg"
          className={`w-full sm:w-auto text-base px-8 ${
            isEnterprise
              ? "bg-emerald-600 hover:bg-emerald-500"
              : tier.popular
              ? "bg-amber-500 text-black hover:bg-amber-400 font-semibold"
              : isPro
              ? "bg-amber-500 text-black hover:bg-amber-400 font-semibold"
              : "bg-white text-black hover:bg-zinc-200"
          }`}
        >
          <Link href={isEnterprise ? "/enterprise" : "/sign-up"}>
            {tier.price === 0 ? "Start Free" : isEnterprise ? "Build Your Plan" : "Get Started"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </Card>

      {/* Quick price comparison strip */}
      <div className="mt-6 grid grid-cols-3 sm:grid-cols-6 gap-2">
        {TIERS.map((t) => {
          const isActive = t.key === selected;
          return (
            <button
              key={t.key}
              onClick={() => {
                setSelected(t.key);
                setShowDetails(false);
                if (billingPeriod === "6month" && t.price6month >= t.price && t.price > 0) {
                  setBillingPeriod("monthly");
                }
              }}
              className={`text-center py-2 rounded-lg border transition-all text-xs ${
                isActive
                  ? `${t.color} bg-zinc-800/80`
                  : "border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-800/30"
              }`}
            >
              <p className={`font-semibold ${isActive ? t.accentText : "text-zinc-400"}`}>
                {t.name}
              </p>
              <p className={isActive ? "text-zinc-300" : "text-zinc-400"}>
                {formatPrice(t)}{t.price > 0 && !t.enterprise ? "/mo" : ""}
              </p>
              {t.key === "STARTER" && (
                <p className="text-amber-400 text-xs font-semibold mt-0.5">$9.99 deal</p>
              )}
              {t.key === "PLUS" && (
                <p className="text-amber-400 text-xs font-semibold mt-0.5">$39.99 deal</p>
              )}
            </button>
          );
        })}
      </div>

      {/* Professional disclaimer */}
      <p className="text-center text-xs text-zinc-500 mt-8">
        AI agents provide assistance, not professional advice. Not a substitute for a licensed professional.
      </p>

    </section>
  );
}
