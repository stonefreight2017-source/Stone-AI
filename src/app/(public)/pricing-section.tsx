"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Star, Crown, ArrowRight, Building2, ChevronDown, MessageSquare, Brain, Zap, Users as UsersIcon, Heart } from "lucide-react";
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
    tagline: "Try the speed for yourself",
    price: 0,
    price6month: 0,
    priceAnnual: 0,
    priceDisplay: "$0",
    color: "border-zinc-600",
    accentText: "text-zinc-300",
    features: [
      { text: "Local AI chat — sub-100ms responses" },
      { text: "4 AI agents included", highlight: true },
      { text: "1 AI Bestie companion" },
      { text: "Full conversation history" },
      { text: "Complete data privacy" },
      { text: "No credit card required" },
    ],
    details: {
      messagesPerDay: "30",
      tokensPerMonth: "100K",
      maxResponse: "500 tokens",
      concurrentChats: "1",
      requestsPerMinute: "2",
      contextMemory: "10 messages",
      aiModes: "Local only",
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
    tagline: "Plan and start your business",
    price: 19.99,
    price6month: 17.99,
    priceAnnual: 15.99,
    priceDisplay: "$19.99",
    color: "border-blue-600",
    accentText: "text-blue-400",
    features: [
      { text: "Everything in Free" },
      { text: "16 AI Expert Agents", highlight: true },
      { text: "Local + Smart mode (GPT-4o)", highlight: true },
      { text: "200 messages/day + 2 concurrent chats" },
      { text: "Conversation export" },
      { text: "1 AI Bestie companion" },
    ],
    details: {
      messagesPerDay: "200",
      tokensPerMonth: "5M",
      maxResponse: "2,000 tokens",
      concurrentChats: "2",
      requestsPerMinute: "10",
      contextMemory: "25 messages",
      aiModes: "Local + Smart (GPT-4o)",
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
    tagline: "Plan, start, and maintain your business",
    price: 49.99,
    price6month: 44.99,
    priceAnnual: 39.99,
    priceDisplay: "$49.99",
    color: "border-purple-600",
    accentText: "text-purple-400",
    features: [
      { text: "Everything in Builder" },
      { text: "30 AI Expert Agents", highlight: true },
      { text: "Auto-routing + 3 concurrent chats" },
      { text: "500 messages/day + 50M context" },
      { text: "Image generation + voice", highlight: true },
      { text: "3 AI Bestie companions" },
    ],
    details: {
      messagesPerDay: "500",
      tokensPerMonth: "15M",
      maxResponse: "4,000 tokens",
      concurrentChats: "3",
      requestsPerMinute: "20",
      contextMemory: "50 messages",
      aiModes: "Local + Smart (GPT-4o) with auto-routing",
      autoRouting: true,
      conversationExport: true,
      priorityQueue: false,
      apiAccess: false,
      besties: "3 AI Besties",
      agents: "30 Expert Agents (all categories)",
      billingOptions: "$49.99/mo · $44.99/mo (6-mo, 10% off) · $39.99/mo (yearly, 20% off)",
    },
  },
  {
    key: "SMART",
    name: "Executive",
    tagline: "Plan, start, maintain, and run your business",
    price: 99.99,
    price6month: 89.99,
    priceAnnual: 79.99,
    priceDisplay: "$99.99",
    popular: true,
    color: "border-amber-500",
    accentText: "text-amber-400",
    features: [
      { text: "Everything in Growth" },
      { text: "All 42 AI Expert Agents", highlight: true },
      { text: "1,500 messages/day + priority queue", highlight: true },
      { text: "Agent builder + early access features" },
      { text: "Team workspace + SOC 2 compliance" },
      { text: "5 AI Bestie companions" },
    ],
    details: {
      messagesPerDay: "1,500",
      tokensPerMonth: "50M",
      maxResponse: "8,000 tokens",
      concurrentChats: "5",
      requestsPerMinute: "40",
      contextMemory: "80 messages",
      aiModes: "Local + Smart (GPT-4o) with auto-routing",
      autoRouting: true,
      conversationExport: true,
      priorityQueue: true,
      apiAccess: false,
      besties: "5 AI Besties",
      agents: "All 42 Expert Agents (every category)",
      billingOptions: "$99.99/mo · $89.99/mo (6-mo, 10% off) · $79.99/mo (yearly, 20% off)",
    },
  },
  {
    key: "PRO",
    name: "Reseller",
    tagline: "Full platform access with reseller capabilities",
    price: 200,
    price6month: 200,
    priceAnnual: 190,
    priceDisplay: "$200",
    color: "border-amber-400",
    accentText: "text-amber-300",
    features: [
      { text: "Everything in Executive" },
      { text: "All 42 AI Agents + API access", highlight: true },
      { text: "Commercial license + reseller rights", highlight: true },
      { text: "Unlimited messages (99,999/day)" },
      { text: "10 concurrent chats + 32K responses" },
      { text: "10 AI Bestie companions" },
      { text: "Custom model fine-tuning", highlight: true },
      { text: "HIPAA + SOC 2 compliance" },
    ],
    details: {
      messagesPerDay: "Unlimited (99,999)",
      tokensPerMonth: "Unlimited",
      maxResponse: "32,000 tokens",
      concurrentChats: "10",
      requestsPerMinute: "60",
      contextMemory: "100 messages",
      aiModes: "Local + Smart + Priority with auto-routing",
      autoRouting: true,
      conversationExport: true,
      priorityQueue: true,
      apiAccess: true,
      besties: "10 AI Besties",
      agents: "All 42 Expert Agents + API + reseller",
      billingOptions: "$200/mo · $190/mo (yearly, 5% off)",
    },
  },
  {
    key: "ENTERPRISE",
    name: "Enterprise",
    tagline: "Dedicated infrastructure for teams",
    price: 500,
    price6month: 500,
    priceAnnual: 475,
    priceDisplay: "From $500",
    enterprise: true,
    color: "border-emerald-500",
    accentText: "text-emerald-400",
    features: [
      { text: "Everything in Reseller" },
      { text: "Multiple seats & API keys", highlight: true },
      { text: "Dedicated inference infrastructure", highlight: true },
      { text: "99.9% uptime SLA", highlight: true },
      { text: "SSO/SAML + audit logging" },
      { text: "50K+ requests/day + custom limits" },
      { text: "Dedicated support channel" },
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
      besties: "Custom",
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
        Every tier unlocks faster responses and smarter capabilities.
        Start free, scale when you&apos;re ready. Cancel anytime.
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
    </section>
  );
}
