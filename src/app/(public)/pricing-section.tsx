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
  features: { text: string; highlight?: boolean }[];
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
      { text: "Answers faster than you can switch tabs — under 100ms" },
      { text: "4 AI agents to plan, write, learn, and stay on track", highlight: true },
      { text: "1 AI Bestie that remembers you tomorrow" },
      { text: "Every conversation saved — pick up right where you left off" },
      { text: "Your data stays on our servers, never sold or shared" },
      { text: "No credit card, no trial clock — just go" },
    ],
    details: {
      messagesPerDay: "50",
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
      besties: "1 AI Bestie",
      agents: "4 AI Agents (Onboarding, Bestie, Wellness, Tutor)",
      billingOptions: "Free forever",
    },
  },
  {
    key: "STARTER",
    name: "Builder",
    tagline: "Go from napkin sketch to first revenue — your AI co-founder never sleeps",
    price: 19.99,
    price6month: 17.99,
    priceAnnual: 15.99,
    priceDisplay: "$19.99",
    color: "border-blue-600",
    accentText: "text-blue-400",
    features: [
      { text: "Everything in Free" },
      { text: "16 agents: your copywriter, strategist, developer, and 13 more", highlight: true },
      { text: "10 GPT-4o answers/day for the hard questions that need genius-level thinking", highlight: true },
      { text: "250 messages/day — enough to draft a full business plan before lunch" },
      { text: "Export conversations as docs — hand them straight to clients or partners" },
      { text: "1 AI Bestie that learns your voice and goals over time" },
    ],
    details: {
      messagesPerDay: "250",
      tokensPerMonth: "6M",
      maxResponse: "2,500 tokens",
      concurrentChats: "2",
      requestsPerMinute: "10",
      contextMemory: "25 messages",
      aiModes: "Local + 10 premium/day (GPT-4o)",
      autoRouting: false,
      conversationExport: true,
      priorityQueue: false,
      apiAccess: false,
      besties: "1 AI Bestie",
      agents: "16 Expert Agents (Business, Content, Marketing)",
      billingOptions: "$19.99/mo · $17.99/mo (6-mo, 10% off) · $15.99/mo (yearly, 20% off)",
    },
  },
  {
    key: "PLUS",
    name: "Growth",
    tagline: "The moment your side hustle starts feeling like a real company",
    price: 49.99,
    price6month: 44.99,
    priceAnnual: 39.99,
    priceDisplay: "$49.99",
    color: "border-purple-600",
    accentText: "text-purple-400",
    features: [
      { text: "Everything in Builder" },
      { text: "30 agents covering marketing, legal, finance, dev, HR, and sales", highlight: true },
      { text: "15 GPT-4o answers/day — auto-routed so the right brain handles each question", highlight: true },
      { text: "500 messages/day + live web research to keep your market intel fresh" },
      { text: "Talk out loud in 6 languages — serve clients from Tokyo to Buenos Aires", highlight: true },
      { text: "1 AI Bestie connected to 5 apps — it checks your calendar so you don't have to" },
    ],
    details: {
      messagesPerDay: "500",
      tokensPerMonth: "15M",
      maxResponse: "3,500 tokens",
      concurrentChats: "3",
      requestsPerMinute: "15",
      contextMemory: "40 messages",
      aiModes: "Local + 15 premium/day (GPT-4o) with auto-routing",
      autoRouting: true,
      conversationExport: true,
      priorityQueue: false,
      apiAccess: false,
      besties: "1 AI Bestie",
      agents: "30 Expert Agents (all categories)",
      billingOptions: "$49.99/mo · $44.99/mo (6-mo, 10% off) · $39.99/mo (yearly, 20% off)",
    },
  },
  {
    key: "SMART",
    name: "Executive",
    tagline: "Run your entire operation like a CEO with a full AI executive team",
    price: 99.99,
    price6month: 89.99,
    priceAnnual: 79.99,
    priceDisplay: "$99.99",
    popular: true,
    color: "border-amber-500",
    accentText: "text-amber-400",
    features: [
      { text: "Everything in Growth" },
      { text: "All 42 agents — every department staffed, every skill covered", highlight: true },
      { text: "1,000 messages/day with priority queue — your team never hits a wall", highlight: true },
      { text: "30 GPT-4o answers/day + build custom agents tailored to your workflow" },
      { text: "Team workspace with SOC 2 compliance — bring your people in safely" },
      { text: "1 AI Bestie wired into 10 apps — it runs your day so you run the business" },
    ],
    details: {
      messagesPerDay: "1,000",
      tokensPerMonth: "40M",
      maxResponse: "6,000 tokens",
      concurrentChats: "4",
      requestsPerMinute: "25",
      contextMemory: "60 messages",
      aiModes: "Local + 30 premium/day (GPT-4o) with auto-routing",
      autoRouting: true,
      conversationExport: true,
      priorityQueue: true,
      apiAccess: false,
      besties: "1 AI Bestie",
      agents: "All 42 Expert Agents (every category)",
      billingOptions: "$99.99/mo · $89.99/mo (6-mo, 10% off) · $79.99/mo (yearly, 20% off)",
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
      { text: "3,000 messages/day + 50 GPT-4o — enough firepower to serve a client roster" },
      { text: "Fine-tune models on your data — your AI gets smarter the more you use it", highlight: true },
      { text: "1 AI Bestie + 50 app connections — an operator that runs across your entire stack" },
      { text: "HIPAA + SOC 2 — serve healthcare, finance, and regulated clients with confidence" },
    ],
    details: {
      messagesPerDay: "3,000",
      tokensPerMonth: "100M",
      maxResponse: "8,000 tokens",
      concurrentChats: "6",
      requestsPerMinute: "30",
      contextMemory: "80 messages",
      aiModes: "Local + 50 premium/day + Priority with auto-routing",
      autoRouting: true,
      conversationExport: true,
      priorityQueue: true,
      apiAccess: true,
      besties: "1 AI Bestie",
      agents: "All 42 Expert Agents + API + reseller",
      billingOptions: "$200/mo · $190/mo (yearly, 5% off)",
    },
  },
  {
    key: "ENTERPRISE",
    name: "Enterprise",
    tagline: "Replace six-figure software contracts with one platform your whole team shares",
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
      { text: "99.9% uptime SLA — as reliable as the tools it replaces", highlight: true },
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
      besties: "2 AI Besties",
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

      {/* Billing period toggle */}
      <div className="flex items-center justify-center gap-1 mb-8 bg-zinc-900 rounded-lg p-1 max-w-md mx-auto">
        {(["monthly", "6month", "annual"] as const).map((period) => {
          const labels: Record<BillingPeriod, string> = { monthly: "Monthly", "6month": "6-Month", annual: "Yearly" };
          const savings: Record<BillingPeriod, string> = { monthly: "", "6month": "10% off", annual: "20% off" };
          const isActive = billingPeriod === period;
          return (
            <button
              key={period}
              onClick={() => setBillingPeriod(period)}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                isActive
                  ? "bg-white text-black shadow-sm"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              {labels[period]}
              {savings[period] && (
                <span className={`ml-1 text-[10px] font-semibold ${isActive ? "text-emerald-600" : "text-emerald-400"}`}>
                  {savings[period]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tier selector pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {TIERS.map((t) => {
          const isActive = t.key === selected;
          return (
            <button
              key={t.key}
              onClick={() => { setSelected(t.key); setShowDetails(false); }}
              className={`relative px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? `bg-zinc-800 ${t.accentText} ring-1 ring-current`
                  : "bg-zinc-900 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              }`}
            >
              <span className="flex items-center gap-1.5">
                {t.key === "PRO" && <Crown className="h-3.5 w-3.5" />}
                {t.key === "ENTERPRISE" && <Building2 className="h-3.5 w-3.5" />}
                {t.name}
              </span>
              {t.popular && (
                <span className="absolute -top-2 -right-1 bg-amber-500 text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
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
                <Badge className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5">
                  <Star className="h-3 w-3 mr-1" /> Most Popular
                </Badge>
              )}
            </div>
            <p className="text-zinc-400 text-sm">{tier.tagline}</p>
          </div>
          <div className="text-left sm:text-right">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-white">{formatPrice(tier)}</span>
              {tier.price > 0 && <span className="text-zinc-500">/mo</span>}
            </div>
            {billingPeriod === "6month" && tier.price6month < tier.price && (
              <p className="text-xs text-emerald-400 mt-1">
                {isEnterprise
                  ? `Billed $${(getCurrentPrice(tier) * 6).toFixed(0)} every 6 months (10% off)`
                  : `Billed $${(getCurrentPrice(tier) * 6).toFixed(2)} every 6 months (10% off)`}
              </p>
            )}
            {billingPeriod === "annual" && tier.priceAnnual < tier.price && (
              <p className="text-xs text-emerald-400 mt-1">
                {(() => {
                  const discount = isPro || isEnterprise ? "5% off" : "20% off";
                  return isEnterprise
                    ? `Billed $${(getCurrentPrice(tier) * 12).toFixed(0)} per year (${discount})`
                    : `Billed $${(getCurrentPrice(tier) * 12).toFixed(2)} per year (${discount})`;
                })()}
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
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Zap className="h-3 w-3" /> Capacity & Performance
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-zinc-500 uppercase">Messages / Day</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{tier.details.messagesPerDay}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-zinc-500 uppercase">Tokens / Month</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{tier.details.tokensPerMonth}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-zinc-500 uppercase">Max Response</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{tier.details.maxResponse}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-zinc-500 uppercase">Concurrent Chats</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{tier.details.concurrentChats}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-zinc-500 uppercase">Requests / Minute</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{tier.details.requestsPerMinute}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-zinc-500 uppercase">Context Memory</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{tier.details.contextMemory}</p>
                </div>
              </div>
            </div>

            {/* AI & Agents */}
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Brain className="h-3 w-3" /> AI & Agents
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-zinc-500 uppercase">AI Modes</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{tier.details.aiModes}</p>
                </div>
                <div className="bg-zinc-800/50 rounded-lg p-3">
                  <p className="text-[10px] text-zinc-500 uppercase">Expert Agents</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{tier.details.agents}</p>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div>
              <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
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
                      <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="h-3.5 w-3.5 text-zinc-600 shrink-0 text-center leading-none">&mdash;</span>
                    )}
                    <span className={`text-xs ${feat.enabled ? "text-zinc-200" : "text-zinc-600"}`}>
                      {feat.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bestie & Billing */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <p className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
                  <Heart className="h-2.5 w-2.5" /> AI Bestie Companions
                </p>
                <p className="text-sm font-semibold text-white mt-0.5">{tier.details.besties}</p>
              </div>
              <div className="bg-zinc-800/50 rounded-lg p-3">
                <p className="text-[10px] text-zinc-500 uppercase">Billing Options</p>
                <p className="text-sm font-semibold text-white mt-0.5">{tier.details.billingOptions}</p>
              </div>
            </div>
          </div>
        )}

        {/* Reseller founding member callout */}
        {isPro && (
          <div className="bg-amber-950/30 border border-amber-800/50 rounded-lg p-3 mb-6">
            <p className="text-sm text-amber-300 font-medium flex items-center gap-2">
              <Star className="h-4 w-4" />
              Founding Member — this price is locked forever for early subscribers
            </p>
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
              onClick={() => { setSelected(t.key); setShowDetails(false); }}
              className={`text-center py-2 rounded-lg border transition-all text-xs ${
                isActive
                  ? `${t.color} bg-zinc-800/80`
                  : "border-zinc-800/50 bg-zinc-900/30 hover:bg-zinc-800/30"
              }`}
            >
              <p className={`font-semibold ${isActive ? t.accentText : "text-zinc-600"}`}>
                {t.name}
              </p>
              <p className={isActive ? "text-zinc-300" : "text-zinc-700"}>
                {formatPrice(t)}{t.price > 0 && !t.enterprise ? "/mo" : ""}
              </p>
            </button>
          );
        })}
      </div>

      {/* Limited Sign-On Deals */}
      <div className="mt-10">
        <div className="flex items-center justify-center gap-2 mb-5">
          <Sparkles className="h-5 w-5 text-amber-400" />
          <h3 className="text-lg font-bold text-white">Limited Sign-On Deals</h3>
          <Sparkles className="h-5 w-5 text-amber-400" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {/* Launch Trial — Builder at $14.99 */}
          <div className="relative bg-zinc-900 border border-emerald-800/60 rounded-xl p-5 flex flex-col">
            <div className="absolute -top-2.5 left-4">
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                Launch Trial
              </span>
            </div>
            <p className="text-sm text-zinc-400 mt-2 mb-3">Builder plan</p>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-zinc-500 line-through text-lg">$19.99</span>
              <span className="text-3xl font-bold text-emerald-400">$14.99</span>
              <span className="text-zinc-500 text-sm">/mo</span>
            </div>
            <div className="flex items-center gap-1.5 mb-2">
              <CreditCard className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-xs text-zinc-400 font-medium">Credit card required</span>
            </div>
            <p className="text-xs text-amber-400/90 mb-2 leading-relaxed">
              One-time offer — if you cancel, this price is gone forever
            </p>
            <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed">
              Lock in this price and join the OG founders. Keep it for a year — unlock the <span className="text-amber-400 font-medium">Golden Egg</span>, the rarest badge on Stone AI.
            </p>
            <div className="mt-auto">
              <Button asChild size="sm" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
                <Link href="/sign-up">
                  Claim This Deal
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Growth Early Adopter — Growth at $39.99 + 7-day trial */}
          <div className="relative bg-zinc-900 border border-amber-700/60 rounded-xl p-5 flex flex-col">
            <div className="absolute -top-2.5 left-4">
              <span className="bg-amber-600 text-black text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide">
                Early Adopter
              </span>
            </div>
            <p className="text-sm text-zinc-400 mt-2 mb-1">Growth plan</p>
            <p className="text-[11px] text-emerald-400 font-medium mb-2">+ 7-day free trial</p>
            <div className="flex items-baseline gap-2 mb-3">
              <span className="text-zinc-500 line-through text-lg">$49.99</span>
              <span className="text-3xl font-bold text-amber-400">$39.99</span>
              <span className="text-zinc-500 text-sm">/mo</span>
            </div>
            <div className="flex items-center gap-1.5 mb-2">
              <CreditCard className="h-3.5 w-3.5 text-zinc-400" />
              <span className="text-xs text-zinc-400 font-medium">Credit card required</span>
            </div>
            <p className="text-xs text-amber-400/90 mb-2 leading-relaxed">
              One-time offer — if you cancel, this price is gone forever
            </p>
            <p className="text-[11px] text-zinc-500 mb-4 leading-relaxed">
              Lock in this price and join the OG founders. Keep it for a year — unlock the <span className="text-amber-400 font-medium">Golden Egg</span>, the rarest badge on Stone AI.
            </p>
            <div className="mt-auto">
              <Button asChild size="sm" className="w-full bg-amber-500 hover:bg-amber-400 text-black font-semibold">
                <Link href="/sign-up">
                  Claim This Deal
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* OG program callout */}
        <p className="text-center text-xs text-zinc-600 mt-5 max-w-lg mx-auto">
          OG and Golden Egg badges are visible across the entire Stone AI ecosystem — in the community forum, your profile, and every app in the platform.
          Founding member status that everyone can see.
        </p>
      </div>
    </section>
  );
}
