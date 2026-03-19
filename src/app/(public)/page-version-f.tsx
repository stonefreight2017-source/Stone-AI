"use client";

/**
 * VERSION F — "The Conversion Machine" — Maximum Information Density, Zero Waste
 * Stripe/Linear style. Clean, information-dense, every pixel earns its place.
 * For the visitor who wants to understand the product in 30 seconds.
 * Accent: Amber + emerald (warm and trustworthy)
 *
 * NOTE: metadata cannot be exported from a "use client" component in Next.js.
 * To use this version, import it in page.tsx or copy content to a server wrapper.
 */

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Shield,
  Users,
  Bot,
  Heart,
  Zap,
  Brain,
  Briefcase,
  Pen,
  BarChart2,
  Code,
  TrendingUp,
  MessageSquare,
  Star,
  Cpu,
  Lock,
  Check,
  ChevronDown,
  Clock,
  Globe,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PricingSection } from "./pricing-section";
import {
  ScrollSection,
  StaggerGrid,
  StaggerCard,
  AnimateOnScroll,
} from "./animated-sections";
import { FadeIn } from "@/components/ui/animate";

/* ─── Department Mini-Card ─── */
function DeptCard({
  icon: Icon,
  name,
  count,
  color,
}: {
  icon: React.ElementType;
  name: string;
  count: number;
  color: string;
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-center hover:border-zinc-700 transition-colors">
      <Icon className={`h-5 w-5 mx-auto mb-1.5 ${color}`} />
      <p className="text-xs font-medium text-white">{name}</p>
      <p className="text-xs text-zinc-500">{count} agents</p>
    </div>
  );
}

/* ─── Step Card ─── */
function StepCard({
  step,
  icon: Icon,
  title,
  desc,
}: {
  step: number;
  icon: React.ElementType;
  title: string;
  desc: string;
}) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
        <Icon className="h-6 w-6 text-amber-400" />
      </div>
      <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-xs mb-2">
        Step {step}
      </Badge>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-zinc-500">{desc}</p>
    </div>
  );
}

/* ─── Agent Showcase Card ─── */
function AgentCard({
  name,
  dept,
  desc,
  sample,
  tier,
  icon: Icon,
}: {
  name: string;
  dept: string;
  desc: string;
  sample: string;
  tier: string;
  icon: React.ElementType;
}) {
  const tierColor: Record<string, string> = {
    FREE: "bg-zinc-800 text-zinc-300 border-zinc-700",
    STARTER: "bg-amber-900/30 text-amber-300 border-amber-800/40",
    PLUS: "bg-blue-900/30 text-blue-300 border-blue-800/40",
    SMART: "bg-purple-900/30 text-purple-300 border-purple-800/40",
  };
  return (
    <Card className="bg-zinc-900/70 border-zinc-800 p-4 rounded-xl">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
            <Icon className="h-4 w-4 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{name}</p>
            <p className="text-xs text-zinc-500">{dept}</p>
          </div>
        </div>
        <Badge className={`text-xs ${tierColor[tier] || tierColor.FREE}`}>{tier}</Badge>
      </div>
      <p className="text-xs text-zinc-400 mb-3">{desc}</p>
      <div className="bg-zinc-800/50 rounded-md p-2 text-xs text-zinc-500 italic">
        Sample: &ldquo;{sample}&rdquo;
      </div>
    </Card>
  );
}

/* ─── FAQ Item ─── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-zinc-800 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-4 text-left"
      >
        <span className="text-sm font-medium text-white pr-4">{q}</span>
        <ChevronDown
          className={`h-4 w-4 text-zinc-500 shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <p className="text-sm text-zinc-400 pb-4 leading-relaxed">{a}</p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default function LandingPageF() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white scroll-smooth">
      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-xl font-bold">Stone AI&#8482;</span>
        <div className="flex items-center gap-5">
          <Link href="#agents" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:inline">
            Agents
          </Link>
          <Link href="#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:inline">
            Pricing
          </Link>
          <Link href="/sign-in" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Sign In
          </Link>
          <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-full px-5">
            <Link href="/sign-up">Start Free</Link>
          </Button>
        </div>
      </nav>

      {/* ── Hero: Compact, Left-Aligned ── */}
      <section className="px-6 pt-12 pb-16 max-w-6xl mx-auto">
        <FadeIn>
          <div className="grid md:grid-cols-2 gap-10 items-start">
            {/* Left: Copy */}
            <div>
              <Badge className="bg-amber-900/40 text-amber-300 border-amber-800/50 mb-4">
                <Sparkles className="h-3 w-3 mr-1" /> Now with 38 AI specialists
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-4">
                AI agents that produce{" "}
                <span className="text-amber-400">real work</span>
              </h1>
              <p className="text-zinc-400 leading-relaxed mb-6 max-w-lg">
                Not another chatbot. Stone AI gives you a team of domain
                specialists — marketing, coding, finance, legal, content —
                powered by local GPU inference. Private by default. $0 to start.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold px-8">
                  <Link href="/sign-up">
                    Start Free <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-zinc-700 text-zinc-300 px-8">
                  <Link href="#pricing">See Pricing</Link>
                </Button>
              </div>
            </div>

            {/* Right: 2x3 Mini Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              <DeptCard icon={Briefcase} name="Business" count={8} color="text-amber-400" />
              <DeptCard icon={Pen} name="Content" count={7} color="text-pink-400" />
              <DeptCard icon={TrendingUp} name="Marketing" count={8} color="text-emerald-400" />
              <DeptCard icon={Code} name="Technical" count={7} color="text-cyan-400" />
              <DeptCard icon={BarChart2} name="Finance" count={6} color="text-blue-400" />
              <DeptCard icon={GraduationCap} name="Education" count={6} color="text-purple-400" />
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ── Stat Bar ── */}
      <AnimateOnScroll direction="up">
        <div className="border-y border-zinc-800/60 bg-zinc-900/30 py-4">
          <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4 px-6 text-center">
            {[
              { value: "42", label: "agents" },
              { value: "<100ms", label: "local latency" },
              { value: "AES-256", label: "encryption" },
              { value: "$0/mo", label: "to start" },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-lg font-bold text-white">{value}</p>
                <p className="text-xs text-zinc-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimateOnScroll>

      {/* ── How It Works ── */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <ScrollSection>
          <h2 className="text-2xl font-bold text-center mb-10">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <StepCard step={1} icon={Users} title="Pick an agent" desc="Choose from 38 specialists across 6 departments" />
            <StepCard step={2} icon={MessageSquare} title="Describe your task" desc="Tell the agent what you need in plain language" />
            <StepCard step={3} icon={Check} title="Get real deliverables" desc="Plans, copy, code, analysis — ready to use" />
          </div>
        </ScrollSection>
      </section>

      {/* ── Agent Showcase ── */}
      <section id="agents" className="px-6 py-16 max-w-6xl mx-auto">
        <ScrollSection>
          <h2 className="text-2xl font-bold text-center mb-2">Meet the team</h2>
          <p className="text-zinc-500 text-center mb-10 text-sm">One agent from each department</p>
        </ScrollSection>
        <StaggerGrid className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StaggerCard>
            <AgentCard
              icon={Briefcase}
              name="Business Strategist"
              dept="Business"
              desc="Builds business plans, competitive analyses, and go-to-market strategies."
              sample="Create a go-to-market strategy for a B2B SaaS product"
              tier="FREE"
            />
          </StaggerCard>
          <StaggerCard>
            <AgentCard
              icon={Pen}
              name="Content Writer"
              dept="Content"
              desc="Produces blog posts, social media copy, and long-form content."
              sample="Write a 1,500-word blog post on remote work trends"
              tier="FREE"
            />
          </StaggerCard>
          <StaggerCard>
            <AgentCard
              icon={TrendingUp}
              name="Marketing Strategist"
              dept="Marketing"
              desc="Builds marketing plans, campaign strategies, and funnel analyses."
              sample="Build a Q1 marketing plan for $5K budget"
              tier="STARTER"
            />
          </StaggerCard>
          <StaggerCard>
            <AgentCard
              icon={Code}
              name="Code Assistant"
              dept="Technical"
              desc="Writes, reviews, and debugs code across multiple languages."
              sample="Refactor this React component for performance"
              tier="PLUS"
            />
          </StaggerCard>
          <StaggerCard>
            <AgentCard
              icon={BarChart2}
              name="Financial Analyst"
              dept="Finance"
              desc="Builds financial models, projections, and investment analyses."
              sample="Create a 3-year revenue projection for my startup"
              tier="SMART"
            />
          </StaggerCard>
          <StaggerCard>
            <AgentCard
              icon={GraduationCap}
              name="Study Coach"
              dept="Education"
              desc="Creates study plans, explains concepts, and builds practice problems."
              sample="Help me understand calculus derivatives step by step"
              tier="FREE"
            />
          </StaggerCard>
        </StaggerGrid>
      </section>

      {/* ── Two Engines Comparison ── */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <ScrollSection>
          <h2 className="text-2xl font-bold text-center mb-10">Two engines. You choose.</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* LOCAL */}
            <Card className="bg-zinc-900/70 border-emerald-800/30 p-6 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <Cpu className="h-5 w-5 text-emerald-400" />
                <h3 className="font-bold text-lg text-emerald-400">LOCAL</h3>
              </div>
              <ul className="space-y-3 text-sm">
                {[
                  { label: "Model", value: "Llama 70B" },
                  { label: "Runs on", value: "Your GPU" },
                  { label: "Latency", value: "<100ms" },
                  { label: "Privacy", value: "Data never leaves" },
                  { label: "Cost", value: "Free with tier" },
                ].map(({ label, value }) => (
                  <li key={label} className="flex justify-between">
                    <span className="text-zinc-500">{label}</span>
                    <span className="text-zinc-200 font-medium">{value}</span>
                  </li>
                ))}
              </ul>
            </Card>

            {/* SMART */}
            <Card className="bg-zinc-900/70 border-blue-800/30 p-6 rounded-xl">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-lg text-blue-400">SMART</h3>
              </div>
              <ul className="space-y-3 text-sm">
                {[
                  { label: "Model", value: "Anthropic Claude" },
                  { label: "Runs on", value: "Cloud" },
                  { label: "Latency", value: "~2-5s" },
                  { label: "Strength", value: "Complex reasoning" },
                  { label: "Cost", value: "SMART tier+ ($99.99)" },
                ].map(({ label, value }) => (
                  <li key={label} className="flex justify-between">
                    <span className="text-zinc-500">{label}</span>
                    <span className="text-zinc-200 font-medium">{value}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </ScrollSection>
      </section>

      {/* ── Bestie Section ── */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <AnimateOnScroll direction="up">
          <Card className="bg-zinc-900/50 border-zinc-800 p-8 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center shrink-0">
                <Heart className="h-6 w-6 text-pink-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Your AI Bestie</h3>
                <p className="text-zinc-400 text-sm mb-4">
                  More than an assistant — a companion that grows with you.
                </p>
                <ul className="space-y-2">
                  {[
                    "Remembers your preferences and past conversations",
                    "Adapts to your communication style",
                    "Persistent memory across sessions",
                    "18 personality traits you can customize",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-zinc-300">
                      <Check className="h-4 w-4 text-pink-400 mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </AnimateOnScroll>
      </section>

      {/* ── Social Proof Strip ── */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <AnimateOnScroll direction="up">
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              {
                quote: "Replaced 3 freelancers. Stone AI pays for itself in the first week.",
                name: "Maya T.",
                role: "Freelancer",
              },
              {
                quote: "Local inference + AES-256 encryption. Our compliance team signed off in a day.",
                name: "James C.",
                role: "Startup Founder",
              },
              {
                quote: "38 agents, one platform, zero learning curve. This is how AI should work.",
                name: "Priya K.",
                role: "Agency Owner",
              },
            ].map(({ quote, name, role }) => (
              <div key={name} className="flex items-start gap-3">
                <div className="flex gap-0.5 shrink-0 mt-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3 w-3 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <div>
                  <p className="text-sm text-zinc-300 mb-1">&ldquo;{quote}&rdquo;</p>
                  <p className="text-xs text-zinc-500">
                    {name}, {role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </AnimateOnScroll>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="px-6 py-16 max-w-6xl mx-auto">
        <ScrollSection>
          <PricingSection />
        </ScrollSection>
      </section>

      {/* ── FAQ ── */}
      <section className="px-6 py-16 max-w-2xl mx-auto">
        <AnimateOnScroll direction="up">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently asked</h2>
          <div className="border border-zinc-800 rounded-xl px-6 bg-zinc-900/30">
            <FAQItem
              q="What makes Stone AI different from ChatGPT?"
              a="ChatGPT is one general assistant. Stone AI gives you 38 specialized agents — each trained for a specific domain like marketing, finance, legal, or code. Plus, our local inference means your data never leaves your machine."
            />
            <FAQItem
              q="Do I need a GPU for local inference?"
              a="Local mode requires a compatible GPU. Without one, you can still use our SMART mode (cloud-based AI) which works on any device. Free tier includes both modes."
            />
            <FAQItem
              q="Is my data really private?"
              a="Yes. In LOCAL mode, all processing happens on your hardware. Data never touches our servers. All stored data is encrypted with AES-256-GCM. We take privacy seriously."
            />
            <FAQItem
              q="Can I try it before paying?"
              a="Absolutely. The Free tier gives you access to 4 agents with no credit card required. Upgrade anytime if you need more specialists or features."
            />
            <FAQItem
              q="What's Bestie?"
              a="Bestie is your personal AI companion included with every paid tier. It remembers your preferences and adapts to your communication style. Think of it as a friend who's always there."
            />
          </div>
        </AnimateOnScroll>
      </section>

      {/* ── Final CTA Bar ── */}
      <section className="mx-6 mb-12 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 px-8 py-10 max-w-4xl lg:mx-auto">
        <AnimateOnScroll direction="up">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-bold text-black mb-1">
                Ready to meet your team?
              </h2>
              <p className="text-amber-900 text-sm">
                38 specialists. Zero setup. Free forever tier.
              </p>
            </div>
            <Button asChild size="lg" className="bg-black hover:bg-zinc-900 text-white font-semibold px-8 shrink-0">
              <Link href="/sign-up">
                Start Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </AnimateOnScroll>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-800/60 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
          <span>&copy; {new Date().getFullYear()} Stone AI&#8482;. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/security" className="hover:text-white transition-colors">Security</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
