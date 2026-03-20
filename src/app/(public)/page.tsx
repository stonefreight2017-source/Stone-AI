"use client";

import Link from "next/link";
import {
  Zap,
  Brain,
  Shield,
  ArrowRight,
  Check,
  Code,
  TrendingUp,
  Wrench,
  DollarSign,
  Settings,
  Search,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Insignia } from "@/components/brand/Insignia";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-900 text-white scroll-smooth relative">
      {/* ── Themed backdrop: dot grid + radial glows + noise ── */}
      <div className="fixed inset-0 pointer-events-none -z-10" aria-hidden="true">
        {/* Dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />
        {/* Hero glow — cool cyan */}
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full bg-cyan-500/[0.04] blur-[120px]" />
        {/* Mid-page glow — warm amber */}
        <div className="absolute top-[45%] right-[-10%] w-[600px] h-[600px] rounded-full bg-amber-500/[0.03] blur-[150px]" />
        {/* Bottom glow — subtle purple */}
        <div className="absolute bottom-[5%] left-[-5%] w-[700px] h-[500px] rounded-full bg-purple-500/[0.03] blur-[130px]" />
        {/* Noise texture overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
          <filter id="noiseFilter">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noiseFilter)" />
        </svg>
      </div>

      <div className="relative z-10">
        {/* ═══════════════════════════════════════════════════════════
            NAV
        ═══════════════════════════════════════════════════════════ */}
        <nav aria-label="Main navigation" className="flex items-center justify-between px-4 sm:px-6 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-zinc-300 hover:text-white transition-colors" aria-label="Home">
              <Home className="h-5 w-5" />
            </Link>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="#features" className="text-sm text-zinc-300 hover:text-white transition-colors hidden sm:inline">
              Features
            </Link>
            <Link href="#pricing" className="text-sm text-zinc-300 hover:text-white transition-colors hidden sm:inline">
              Pricing
            </Link>
            <Link href="/sign-in" className="text-sm text-zinc-300 hover:text-white transition-colors">
              Sign In
            </Link>
          </div>
        </nav>

        {/* Insignia — centered */}
        <div className="flex justify-center pt-4 pb-4">
          <Insignia size={18} />
        </div>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 1 — HERO
        ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-3xl mx-auto text-center px-4 pt-16 pb-20">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight">
            AI specialists for businesses that need real answers fast
          </h1>
          <p className="mt-6 text-lg text-zinc-300 max-w-2xl mx-auto">
            Stone routes each request to the right specialist for troubleshooting, coding, billing, operations, and growth.
          </p>
          <p className="mt-3 text-sm text-zinc-400">
            Local-first by default. Stronger handling available on supported tiers when needed.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-zinc-900 hover:bg-zinc-200 font-semibold px-8">
              <Link href="/sign-up">Start Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-zinc-600 text-zinc-200 hover:bg-zinc-800 px-8">
              <Link href="#pricing">See Pricing</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            Built for real business workflows, not just generic chat.
          </p>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 2 — TRUST / VALUE STRIP
        ═══════════════════════════════════════════════════════════ */}
        <section id="features" className="max-w-5xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-zinc-800 border-zinc-700 p-6">
              <div className="flex items-center gap-3 mb-3">
                <Brain className="h-5 w-5 text-cyan-400" />
                <h3 className="font-semibold text-white">Smart specialist routing</h3>
              </div>
              <p className="text-sm text-zinc-400">
                Stone automatically routes each request to the best specialist, so users do not have to choose from a long list of bots.
              </p>
            </Card>
            <Card className="bg-zinc-800 border-zinc-700 p-6">
              <div className="flex items-center gap-3 mb-3">
                <Zap className="h-5 w-5 text-amber-400" />
                <h3 className="font-semibold text-white">Local-first performance</h3>
              </div>
              <p className="text-sm text-zinc-400">
                Standard work is handled locally first for speed and cost control.
              </p>
            </Card>
            <Card className="bg-zinc-800 border-zinc-700 p-6">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="h-5 w-5 text-purple-400" />
                <h3 className="font-semibold text-white">Cloud support when needed</h3>
              </div>
              <p className="text-sm text-zinc-400">
                More demanding requests can use stronger handling based on tier, priority, and workload.
              </p>
            </Card>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 3 — WHAT STONE HELPS WITH
        ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">What Stone helps with</h2>
            <p className="mt-3 text-zinc-400 max-w-xl mx-auto">
              Stone is built to help with the work businesses actually need done every day.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Wrench, title: "Troubleshooting", text: "Fix broken workflows, setup issues, failed integrations, and service problems faster." },
              { icon: Code, title: "Coding and implementation", text: "Get help with APIs, routes, scripts, backend logic, and technical fixes." },
              { icon: DollarSign, title: "Billing and pricing", text: "Handle plans, Stripe setup, payment issues, pricing decisions, and customer billing questions." },
              { icon: Settings, title: "Operations", text: "Get help with launch planning, usage limits, service design, support flow, and business systems." },
              { icon: TrendingUp, title: "Growth and planning", text: "Use specialist support for decision-making, scaling, and next-step planning." },
            ].map((item) => (
              <Card key={item.title} className="bg-zinc-800 border-zinc-700 p-6">
                <div className="flex items-center gap-3 mb-3">
                  <item.icon className="h-5 w-5 text-cyan-400" />
                  <h3 className="font-semibold text-white">{item.title}</h3>
                </div>
                <p className="text-sm text-zinc-400">{item.text}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 4 — HOW IT WORKS
        ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-4xl mx-auto px-4 pb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">How it works</h2>
            <p className="mt-3 text-zinc-400 max-w-xl mx-auto">
              Stone is designed to be simple to use, even when the work behind the scenes is more advanced.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "1", title: "Ask your question", text: "Start with a clear question, task, or problem inside the Stone workspace." },
              { step: "2", title: "Stone routes it", text: "The system decides which specialist is the best fit for the request." },
              { step: "3", title: "Get a practical answer", text: "Receive a structured response with plain-English guidance and next steps." },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/10 text-cyan-400 font-bold text-xl mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-400">{item.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-zinc-500">
            Higher tiers add more specialist depth, stronger priority, and broader business support.
          </p>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 5 — SPECIALIST CATEGORIES PREVIEW
        ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-5xl mx-auto px-4 pb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">Built around specialist categories</h2>
            <p className="mt-3 text-zinc-400 max-w-2xl mx-auto">
              Stone uses specialist roles behind the scenes so users can get the right kind of help without sorting through dozens of separate agents.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Wrench, label: "Troubleshooting" },
              { icon: Code, label: "Development" },
              { icon: DollarSign, label: "Billing" },
              { icon: Settings, label: "Operations" },
              { icon: TrendingUp, label: "Growth" },
              { icon: Search, label: "Research" },
            ].map((cat) => (
              <Card key={cat.label} className="bg-zinc-800 border-zinc-700 p-4 flex flex-col items-center gap-2 text-center">
                <cat.icon className="h-6 w-6 text-cyan-400" />
                <span className="text-sm font-medium text-zinc-200">{cat.label}</span>
              </Card>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-zinc-500">
            As the platform grows, specialist depth grows with it, without making the interface harder to use.
          </p>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 6 — PRICING PREVIEW
        ═══════════════════════════════════════════════════════════ */}
        <section id="pricing" className="max-w-5xl mx-auto px-4 pb-20">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">Choose the plan that fits your workload</h2>
            <p className="mt-3 text-zinc-400 max-w-2xl mx-auto">
              Start free, upgrade as your usage grows, and unlock more specialist depth, stronger priority, and white-label options.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Free */}
            <Card className="bg-zinc-800 border-zinc-700 p-6 flex flex-col">
              <h3 className="text-xl font-bold text-white">Free</h3>
              <p className="mt-1 text-3xl font-bold text-white">$0</p>
              <p className="mt-3 text-sm text-zinc-400 flex-1">
                Try Stone with limited usage and core specialist access.
              </p>
              <Button asChild className="mt-6 w-full bg-white text-zinc-900 hover:bg-zinc-200 font-semibold">
                <Link href="/sign-up">Start Free</Link>
              </Button>
            </Card>

            {/* Builder */}
            <Card className="bg-zinc-800 border-zinc-700 p-6 flex flex-col">
              <h3 className="text-xl font-bold text-white">Builder</h3>
              <p className="mt-1 text-3xl font-bold text-white">
                $19.99<span className="text-sm font-normal text-zinc-400">/mo</span>
              </p>
              <p className="mt-3 text-sm text-zinc-400 flex-1">
                Base capabilities for solo builders and early business use.
              </p>
              <Button asChild className="mt-6 w-full bg-white text-zinc-900 hover:bg-zinc-200 font-semibold">
                <Link href="/sign-up">Choose Builder</Link>
              </Button>
            </Card>

            {/* Executive */}
            <Card className="bg-zinc-800 border-zinc-700 p-6 flex flex-col relative">
              <Badge className="absolute top-4 right-4 bg-cyan-500/20 text-cyan-300 border-cyan-500/30">
                Most Popular
              </Badge>
              <h3 className="text-xl font-bold text-white">Executive</h3>
              <p className="mt-1 text-3xl font-bold text-white">
                $99.99<span className="text-sm font-normal text-zinc-400">/mo</span>
              </p>
              <p className="mt-3 text-sm text-zinc-400 flex-1">
                Advanced capability for users who need stronger priority and deeper support.
              </p>
              <Button asChild variant="outline" className="mt-6 w-full border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 font-semibold">
                <Link href="/pricing">View Plans</Link>
              </Button>
            </Card>
          </div>
          <div className="mt-6 text-center">
            <Link href="/pricing" className="inline-flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors">
              See all plans <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            SECTION 7 — FINAL CTA
        ═══════════════════════════════════════════════════════════ */}
        <section className="max-w-3xl mx-auto text-center px-4 pb-20">
          <h2 className="text-3xl font-bold">Start simple and scale when you&apos;re ready</h2>
          <p className="mt-4 text-zinc-400 max-w-2xl mx-auto">
            Begin with Free, move into Builder or Growth as your workload increases, and upgrade to Reseller or Enterprise when your business needs white-label or custom support.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg" className="bg-white text-zinc-900 hover:bg-zinc-200 font-semibold px-8">
              <Link href="/sign-up">Start Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-zinc-600 text-zinc-200 hover:bg-zinc-800 px-8">
              <Link href="/pricing">See Pricing</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-zinc-500">
            Stone is designed to begin simply and grow with your business.
          </p>
        </section>

        {/* ═══════════════════════════════════════════════════════════
            FOOTER
        ═══════════════════════════════════════════════════════════ */}
        <footer className="border-t border-zinc-800 py-8 px-4">
          <p className="text-center text-xs text-zinc-500 max-w-2xl mx-auto">
            Stone provides AI-assisted support and guidance. It does not replace licensed legal, financial, medical, or other regulated professional advice.
          </p>
        </footer>
      </div>
    </div>
  );
}
