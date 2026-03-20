"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  ArrowRight,
  Star,
  ChevronDown,
  Zap,
  Shield,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/* ------------------------------------------------------------------ */
/*  Plan data                                                          */
/* ------------------------------------------------------------------ */

interface Plan {
  id: string;
  name: string;
  price: string;
  tagline: string;
  description: string;
  includes: string[];
  buttonLabel: string;
  buttonHref: string;
  promo?: string;
  popular?: boolean;
  note?: string;
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    tagline: "Best for trying Stone before upgrading",
    description:
      "A simple starting point for testing the interface, seeing how specialist routing works, and deciding if Stone fits your workflow.",
    includes: [
      "Limited usage",
      "Core specialist access",
      "Standard routing",
      "Basic chat workspace",
      "Local-first handling only",
      "No credit card required",
    ],
    buttonLabel: "Start Free",
    buttonHref: "/sign-up",
    note: "Free is designed as a teaser for Builder, not unlimited long-term production use.",
  },
  {
    id: "builder",
    name: "Builder",
    price: "$19.99",
    tagline: "Base capabilities for solo operators and early builders",
    description:
      "Builder gives you the core Stone experience with higher limits, broader specialist coverage, and a better fit for real day-to-day work.",
    includes: [
      "Everything in Free",
      "Higher usage limits",
      "Broader specialist access",
      "Better fit for active work sessions",
      "Entry-level stronger handling where supported",
    ],
    buttonLabel: "Choose Builder",
    buttonHref: "/sign-up",
    promo: "Launch offer available",
  },
  {
    id: "growth",
    name: "Growth",
    price: "$49.99",
    tagline:
      "More capacity and stronger specialist support for growing businesses",
    description:
      "Growth is for users who rely on Stone more often and need more room, more depth, and stronger day-to-day support.",
    includes: [
      "Everything in Builder",
      "More usage",
      "Broader specialist depth",
      "Better routing priority",
      "Better fit for frequent business use",
    ],
    buttonLabel: "Choose Growth",
    buttonHref: "/sign-up",
    promo: "Launch offer available",
  },
  {
    id: "executive",
    name: "Executive",
    price: "$99.99",
    tagline: "Advanced capability for decision-heavy operators and leaders",
    description:
      "Executive is for users who need deeper specialist support, stronger priority handling, and a more complete business AI workspace.",
    includes: [
      "Everything in Growth",
      "Higher limits",
      "Priority handling",
      "Deeper specialist access",
      "Better fit for high-value decisions",
    ],
    buttonLabel: "Choose Executive",
    buttonHref: "/sign-up",
    popular: true,
  },
  {
    id: "reseller",
    name: "Reseller",
    price: "$200",
    tagline: "All core capabilities plus white-label access",
    description:
      "Reseller is built for businesses that want to offer Stone-powered capability under their own brand or inside a client-facing setup.",
    includes: [
      "Everything in Executive",
      "White-label support",
      "Reseller-friendly setup",
      "Branding flexibility",
      "Higher-tier usage and access",
    ],
    buttonLabel: "Choose Reseller",
    buttonHref: "/sign-up",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "$500+",
    tagline: "Custom setup, higher-touch support, and enterprise flexibility",
    description:
      "Enterprise is for organizations that need custom usage, stronger controls, specialized agreements, or tailored deployment.",
    includes: [
      "Everything in Reseller",
      "Custom setup options",
      "Higher-touch onboarding",
      "Custom usage terms",
      "White-label flexibility",
      "Enterprise support path",
    ],
    buttonLabel: "Contact Sales",
    buttonHref: "/enterprise",
  },
];

/* ------------------------------------------------------------------ */
/*  Comparison table data                                              */
/* ------------------------------------------------------------------ */

const COMPARE_ROWS: { label: string; tiers: boolean[] }[] = [
  // Order: Free, Builder, Growth, Executive, Reseller, Enterprise
  { label: "Core specialist access", tiers: [true, true, true, true, true, true] },
  { label: "Advanced specialist access", tiers: [false, false, true, true, true, true] },
  { label: "Priority handling", tiers: [false, false, false, true, true, true] },
  { label: "Higher usage limits", tiers: [false, true, true, true, true, true] },
  { label: "Local-first access", tiers: [true, true, true, true, true, true] },
  { label: "Stronger handling eligibility", tiers: [false, false, true, true, true, true] },
  { label: "White-label", tiers: [false, false, false, false, true, true] },
  { label: "Custom setup", tiers: [false, false, false, false, false, true] },
  { label: "Best for solo users", tiers: [true, true, true, false, false, false] },
  { label: "Best for teams", tiers: [false, false, true, true, true, true] },
  { label: "Best for resellers", tiers: [false, false, false, false, true, true] },
  { label: "Enterprise customization", tiers: [false, false, false, false, false, true] },
];

const TIER_NAMES = ["Free", "Builder", "Growth", "Executive", "Reseller", "Enterprise"];

/* ------------------------------------------------------------------ */
/*  FAQ data                                                           */
/* ------------------------------------------------------------------ */

const FAQS: { q: string; a: string }[] = [
  {
    q: "What is included in Free?",
    a: "Free includes limited usage and core specialist access so you can test the product before upgrading.",
  },
  {
    q: "Why is Free local-only?",
    a: "Free is designed to give people a real preview of Stone while keeping the platform sustainable and responsive.",
  },
  {
    q: "What changes when I upgrade?",
    a: "Higher tiers add more usage, more specialist depth, stronger priority, and better fit for heavier business use.",
  },
  {
    q: "Do higher tiers get better handling?",
    a: "Yes. Higher tiers can support stronger routing, more depth, and more advanced handling where applicable.",
  },
  {
    q: "What is white-label?",
    a: "White-label means reseller-facing flexibility for businesses that want to present the service under their own brand.",
  },
  {
    q: "How does Enterprise work?",
    a: "Enterprise is custom and built around your usage, support, branding, and agreement needs.",
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function PricingSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <section className="px-6 pb-24 max-w-7xl mx-auto">
      {/* ============================================================ */}
      {/* SECTION 1 — PRICING HERO                                     */}
      {/* ============================================================ */}
      <div className="text-center pt-16 pb-12 max-w-3xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
          Simple pricing for businesses that need reliable AI help
        </h1>
        <p className="text-lg text-zinc-400 mb-3">
          Start free, upgrade as your workload grows, and unlock more specialist
          depth, higher limits, stronger priority, and white-label options.
        </p>
        <p className="text-sm text-zinc-500">
          Stone routes each request to the right specialist. Higher tiers add
          more capability, stronger handling, and broader business support.
        </p>
      </div>

      {/* ============================================================ */}
      {/* SECTION 2 — QUICK PROMISE STRIP                              */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-16 max-w-4xl mx-auto">
        {[
          {
            icon: <Zap className="h-5 w-5 text-amber-400" />,
            title: "Start simple",
            text: "Try Stone with Free before committing to a paid plan.",
          },
          {
            icon: <TrendingUp className="h-5 w-5 text-emerald-400" />,
            title: "Upgrade by workload",
            text: "Move up as your usage, team needs, and specialist depth increase.",
          },
          {
            icon: <Shield className="h-5 w-5 text-blue-400" />,
            title: "Scale to white-label",
            text: "Reseller and Enterprise plans support branding flexibility and custom setup.",
          },
        ].map((box) => (
          <Card
            key={box.title}
            className="bg-zinc-800/60 border-zinc-700 p-6 text-center"
          >
            <div className="flex justify-center mb-3">{box.icon}</div>
            <h3 className="text-white font-semibold text-base mb-1">
              {box.title}
            </h3>
            <p className="text-zinc-400 text-sm">{box.text}</p>
          </Card>
        ))}
      </div>

      {/* ============================================================ */}
      {/* SECTION 3 — SIX PLAN CARDS                                   */}
      {/* ============================================================ */}
      <div
        id="plans"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20"
      >
        {PLANS.map((plan) => (
          <Card
            key={plan.id}
            className={`relative bg-zinc-800/50 border p-6 flex flex-col ${
              plan.popular
                ? "border-amber-500 ring-1 ring-amber-500/40"
                : "border-zinc-700"
            }`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-4 bg-amber-500 text-black text-xs font-bold px-3 py-1">
                <Star className="h-3 w-3 mr-1" /> Most Popular
              </Badge>
            )}

            {/* Plan header */}
            <div className="mb-4">
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-bold text-white">
                  {plan.price}
                </span>
                {plan.id !== "enterprise" && (
                  <span className="text-zinc-400 text-sm">/mo</span>
                )}
                {plan.id === "enterprise" && (
                  <span className="text-zinc-400 text-sm">/ custom</span>
                )}
              </div>
              <p className="text-sm text-zinc-400 mt-2 italic">
                {plan.tagline}
              </p>
            </div>

            {/* Description */}
            <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
              {plan.description}
            </p>

            {/* Includes */}
            <ul className="space-y-2 mb-6 flex-1">
              {plan.includes.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-zinc-300">{item}</span>
                </li>
              ))}
            </ul>

            {/* Promo */}
            {plan.promo && (
              <p className="text-xs text-amber-400 font-medium mb-3">
                {plan.promo}
              </p>
            )}

            {/* Note */}
            {plan.note && (
              <p className="text-xs text-zinc-500 mb-3 leading-relaxed">
                {plan.note}
              </p>
            )}

            {/* Button */}
            <Button
              asChild
              className={`w-full mt-auto ${
                plan.popular
                  ? "bg-amber-500 text-black hover:bg-amber-400 font-semibold"
                  : plan.id === "enterprise"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                  : "bg-white text-black hover:bg-zinc-200"
              }`}
            >
              <Link href={plan.buttonHref}>
                {plan.buttonLabel}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </Card>
        ))}
      </div>

      {/* ============================================================ */}
      {/* SECTION 4 — COMPARE PLANS                                    */}
      {/* ============================================================ */}
      <div className="mb-20 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-3">
          Compare plans at a glance
        </h2>
        <p className="text-center text-zinc-400 mb-8 max-w-xl mx-auto">
          Choose the level that matches your workload, support needs, and
          branding goals.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="text-left text-zinc-400 font-medium py-3 pr-4 min-w-[200px]">
                  Feature
                </th>
                {TIER_NAMES.map((name) => (
                  <th
                    key={name}
                    className="text-center text-zinc-300 font-semibold py-3 px-2 min-w-[90px]"
                  >
                    {name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-zinc-800 hover:bg-zinc-800/30 transition-colors"
                >
                  <td className="text-zinc-300 py-3 pr-4">{row.label}</td>
                  {row.tiers.map((has, i) => (
                    <td key={i} className="text-center py-3 px-2">
                      {has ? (
                        <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                      ) : (
                        <span className="text-zinc-600">&mdash;</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 5 — PROMO SECTION                                    */}
      {/* ============================================================ */}
      <div className="mb-20 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-3">
          Founding member offers
        </h2>
        <p className="text-center text-zinc-400 mb-8">
          Some plans may include launch pricing or promotional rates for early
          members. Promotions appear under the standard plan name so pricing
          stays clear and consistent.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Card className="bg-zinc-800/60 border-zinc-700 p-5">
            <p className="text-sm text-zinc-400 mb-1">Builder</p>
            <div className="flex items-baseline gap-2">
              <span className="text-zinc-500 line-through text-base">
                $19.99/mo
              </span>
              <span className="text-xl font-bold text-emerald-400">
                $9.99
              </span>
              <span className="text-zinc-400 text-sm">first month</span>
            </div>
            <p className="text-xs text-zinc-500 mt-2">Launch offer</p>
          </Card>

          <Card className="bg-zinc-800/60 border-zinc-700 p-5">
            <p className="text-sm text-zinc-400 mb-1">Growth</p>
            <div className="flex items-baseline gap-2">
              <span className="text-zinc-500 line-through text-base">
                $49.99/mo
              </span>
              <span className="text-xl font-bold text-amber-400">
                $39.99/mo
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-2">Launch offer</p>
          </Card>
        </div>

        <p className="text-xs text-zinc-500 text-center">
          Promotional pricing can change. Standard plan names and core plan
          structure stay the same.
        </p>
      </div>

      {/* ============================================================ */}
      {/* SECTION 6 — FAQ                                              */}
      {/* ============================================================ */}
      <div className="mb-20 max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-white text-center mb-8">
          Frequently asked questions
        </h2>

        <div className="space-y-2">
          {FAQS.map((faq, i) => {
            const isOpen = openFaq === i;
            return (
              <div
                key={i}
                className="border border-zinc-800 rounded-lg overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-zinc-800/40 transition-colors"
                >
                  <span className="text-sm font-medium text-zinc-200">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-zinc-400 shrink-0 ml-4 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-zinc-400 leading-relaxed">
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================ */}
      {/* SECTION 7 — FINAL CTA                                        */}
      {/* ============================================================ */}
      <div className="text-center mb-12 max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-4">
          Start simple and scale when you&apos;re ready
        </h2>
        <p className="text-zinc-400 mb-8">
          Begin with Free, move into Builder or Growth as your workload
          increases, and upgrade to Reseller or Enterprise when your business
          needs white-label or custom support.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
            asChild
            size="lg"
            className="bg-white text-black hover:bg-zinc-200 px-8"
          >
            <Link href="/sign-up">
              Start Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-zinc-600 text-zinc-300 hover:bg-zinc-800 px-8"
          >
            <Link href="/enterprise">Contact Sales</Link>
          </Button>
        </div>
        <p className="text-xs text-zinc-500 mt-6">
          Stone is designed to begin simply and grow with your business.
        </p>
      </div>

      {/* ============================================================ */}
      {/* FOOTER DISCLAIMER                                            */}
      {/* ============================================================ */}
      <p className="text-center text-xs text-zinc-500 max-w-2xl mx-auto">
        Stone provides AI-assisted support and guidance. It does not replace
        licensed legal, financial, medical, or other regulated professional
        advice.
      </p>
    </section>
  );
}
