"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Star, Crown, ArrowRight, Zap, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TierInfo {
  key: string;
  name: string;
  tagline: string;
  price: number;
  priceDisplay: string;
  popular?: boolean;
  enterprise?: boolean;
  color: string;
  accentText: string;
  features: { text: string; highlight?: boolean }[];
}

const TIERS: TierInfo[] = [
  {
    key: "FREE",
    name: "Free",
    tagline: "Try the speed for yourself",
    price: 0,
    priceDisplay: "$0",
    color: "border-zinc-600",
    accentText: "text-zinc-300",
    features: [
      { text: "Local AI chat" },
      { text: "Sub-100ms responses", highlight: true },
      { text: "Full conversation history" },
      { text: "Complete data privacy" },
      { text: "No credit card required" },
    ],
  },
  {
    key: "STARTER",
    name: "Starter",
    tagline: "For daily AI users",
    price: 9.99,
    priceDisplay: "$9.99",
    color: "border-blue-600",
    accentText: "text-blue-400",
    features: [
      { text: "Everything in Free" },
      { text: "4x faster throughput", highlight: true },
      { text: "5x more daily capacity" },
      { text: "Longer, more detailed responses" },
      { text: "Extended conversation memory" },
      { text: "1 AI Bestie companion" },
    ],
  },
  {
    key: "PLUS",
    name: "Plus",
    tagline: "Unlock AI Expert Agents",
    price: 29.99,
    priceDisplay: "$29.99",
    color: "border-purple-600",
    accentText: "text-purple-400",
    features: [
      { text: "Everything in Starter" },
      { text: "11 AI Expert Agents", highlight: true },
      { text: "16x Free plan capacity" },
      { text: "2 concurrent chats" },
      { text: "Conversation export" },
      { text: "2 AI Bestie companions" },
    ],
  },
  {
    key: "SMART",
    name: "Smart",
    tagline: "Full agency toolkit + cloud AI",
    price: 69.99,
    priceDisplay: "$69.99",
    popular: true,
    color: "border-amber-500",
    accentText: "text-amber-400",
    features: [
      { text: "Everything in Plus" },
      { text: "26 AI Expert Agents", highlight: true },
      { text: "GPT-4o Smart mode", highlight: true },
      { text: "Cloud fallback (never goes down)" },
      { text: "Auto-routing + 3 concurrent chats" },
      { text: "3 AI Bestie companions" },
    ],
  },
  {
    key: "PRO",
    name: "Pro",
    tagline: "All 30 agents + API + priority",
    price: 199,
    priceDisplay: "$199",
    color: "border-amber-400",
    accentText: "text-amber-300",
    features: [
      { text: "Everything in Smart" },
      { text: "All 30 AI Expert Agents", highlight: true },
      { text: "API access (build on Stone AI)", highlight: true },
      { text: "Priority inference queue", highlight: true },
      { text: "100x Free plan capacity" },
      { text: "10 concurrent chats + 32K responses" },
      { text: "5 AI Bestie companions" },
      { text: "Commercial license" },
    ],
  },
  {
    key: "ENTERPRISE",
    name: "Enterprise",
    tagline: "Dedicated infrastructure for teams",
    price: 500,
    priceDisplay: "From $500",
    enterprise: true,
    color: "border-emerald-500",
    accentText: "text-emerald-400",
    features: [
      { text: "Everything in Pro" },
      { text: "Multiple seats & API keys", highlight: true },
      { text: "Dedicated inference priority", highlight: true },
      { text: "99.9% uptime SLA", highlight: true },
      { text: "SSO/SAML + audit logging" },
      { text: "50K+ requests/day + custom limits" },
      { text: "Dedicated support channel" },
    ],
  },
];

export function PricingSection() {
  const [selected, setSelected] = useState("SMART");

  const tier = TIERS.find((t) => t.key === selected)!;
  const isPro = tier.key === "PRO";
  const isEnterprise = tier.key === "ENTERPRISE";

  return (
    <section id="pricing" className="px-6 pb-24 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-4">
        More speed. More intelligence. Your call.
      </h2>
      <p className="text-center text-zinc-400 mb-10 max-w-lg mx-auto">
        Every tier unlocks faster responses and smarter capabilities.
        Start free, scale when you&apos;re ready. Cancel anytime.
      </p>

      {/* Tier selector pills */}
      <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
        {TIERS.map((t) => {
          const isActive = t.key === selected;
          return (
            <button
              key={t.key}
              onClick={() => setSelected(t.key)}
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
              <span className="text-4xl font-bold text-white">{tier.priceDisplay}</span>
              {tier.price > 0 && <span className="text-zinc-500">/mo</span>}
            </div>
            {tier.price > 0 && !isEnterprise && (
              <p className="text-xs text-zinc-500 mt-1">
                Save 10% with 6-month &bull; 20% with annual billing
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

        {/* Pro founding member callout */}
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
              onClick={() => setSelected(t.key)}
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
                {t.priceDisplay}{t.price > 0 && !t.enterprise ? "/mo" : ""}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
