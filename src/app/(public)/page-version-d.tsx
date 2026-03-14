"use client";

/**
 * VERSION D — "The Product Demo" — Show, Don't Tell
 * Product-forward. The hero IS the product. Minimal text, maximum visual proof.
 * Accent: Amber dominant (warm, approachable)
 *
 * NOTE: metadata cannot be exported from a "use client" component in Next.js.
 * To use this version, import it in page.tsx or copy content to a server wrapper.
 */

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
  DollarSign,
  Sparkles,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PricingSection } from "./pricing-section";
import {
  HeroSection,
  HeroGlow,
  ScrollSection,
  StaggerGrid,
  StaggerCard,
  AnimateOnScroll,
} from "./animated-sections";

/* ─── Mock Chat Bubbles ─── */
function MockChatWindow() {
  return (
    <Card className="bg-zinc-900 border-zinc-700/60 rounded-xl overflow-hidden shadow-2xl shadow-amber-500/5 w-full max-w-md">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-zinc-800/80 border-b border-zinc-700/50">
        <div className="flex gap-1.5">
          <span className="w-3 h-3 rounded-full bg-red-500/70" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <span className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <span className="text-xs text-zinc-400 ml-2">Stone AI — Marketing Strategist</span>
      </div>
      {/* Messages */}
      <div className="p-4 space-y-3 text-sm">
        {/* User bubble */}
        <div className="flex justify-end">
          <div className="bg-amber-600/20 border border-amber-700/30 rounded-xl rounded-br-sm px-3 py-2 max-w-[80%] text-zinc-200">
            Build me a marketing plan for my startup
          </div>
        </div>
        {/* Agent bubble */}
        <div className="flex justify-start">
          <div className="bg-zinc-800 border border-zinc-700/50 rounded-xl rounded-bl-sm px-3 py-2.5 max-w-[85%] text-zinc-300 space-y-2">
            <p className="font-medium text-amber-400 text-xs flex items-center gap-1">
              <Bot className="h-3 w-3" /> Marketing Strategist
            </p>
            <p className="font-semibold text-white">Q1 Go-to-Market Plan</p>
            <div className="space-y-1 text-xs text-zinc-400">
              <p>1. Target audience &amp; ICP definition</p>
              <p>2. Channel strategy (organic + paid)</p>
              <p>3. Content calendar — 12 weeks</p>
              <p>4. Budget allocation &amp; KPIs</p>
              <p>5. Launch sequence &amp; timeline</p>
            </div>
            <Badge className="bg-green-900/40 text-green-400 border-green-800/50 text-xs mt-1">
              <Sparkles className="h-2.5 w-2.5 mr-1" /> Ready to export
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}

/* ─── Trust Badge ─── */
function TrustBadge({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-2 text-zinc-400 text-sm">
      <Icon className="h-4 w-4 text-amber-400" />
      <span>{text}</span>
    </div>
  );
}

/* ─── Testimonial Card ─── */
function TestimonialCard({
  quote,
  name,
  role,
}: {
  quote: string;
  name: string;
  role: string;
}) {
  return (
    <Card className="bg-zinc-800/50 border-zinc-700/50 p-6 rounded-xl">
      <div className="flex gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
        ))}
      </div>
      <p className="text-zinc-300 text-sm leading-relaxed mb-4">&ldquo;{quote}&rdquo;</p>
      <div>
        <p className="text-white font-medium text-sm">{name}</p>
        <p className="text-zinc-500 text-xs">{role}</p>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════ */
export default function LandingPageD() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white scroll-smooth">
      {/* ── Nav ── */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-xl font-bold">Stone AI&#8482;</span>
        <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold">
          <Link href="/sign-up">Start Free</Link>
        </Button>
      </nav>

      {/* ── Hero: Split Layout ── */}
      <section className="relative px-6 pt-16 pb-20 max-w-6xl mx-auto overflow-hidden">
        <HeroGlow />
        <HeroSection>
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div className="text-left">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-4">
                <span className="text-amber-400">42 AI specialists.</span>
                <br />
                One platform.
                <br />
                <span className="text-zinc-400">$0 to start.</span>
              </h1>
              <p className="text-lg text-zinc-400 mb-2 leading-relaxed">
                Local inference. Your data never leaves.
              </p>
              <p className="text-zinc-500 mb-8">
                Real agents that produce real deliverables — not another chatbot.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-lg px-8">
                  <Link href="/sign-up">
                    Start Free <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-zinc-700 text-zinc-300 text-lg px-8">
                  <Link href="#pricing">See Pricing</Link>
                </Button>
              </div>
            </div>

            {/* Right: Mock Product Window */}
            <div className="flex justify-center">
              <MockChatWindow />
            </div>
          </div>
        </HeroSection>
      </section>

      {/* ── Trust Strip ── */}
      <ScrollSection>
        <div className="border-y border-zinc-800/60 bg-zinc-900/40 py-5">
          <div className="max-w-5xl mx-auto flex flex-wrap justify-center gap-8 sm:gap-12 px-6">
            <TrustBadge icon={Users} text="500+ builders" />
            <TrustBadge icon={Bot} text="42 specialists" />
            <TrustBadge icon={Lock} text="AES-256 encrypted" />
            <TrustBadge icon={DollarSign} text="$0 to start" />
          </div>
        </div>
      </ScrollSection>

      {/* ── 3-Column Feature Grid ── */}
      <section className="px-6 py-20 max-w-6xl mx-auto">
        <StaggerGrid className="grid md:grid-cols-3 gap-6">
          {/* Card 1: Your AI Team */}
          <StaggerCard>
            <Card className="bg-zinc-900/70 border-zinc-800 p-6 rounded-xl h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold">Your AI Team</h3>
              </div>
              <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
                42 domain specialists across 6 departments. Marketing, coding, finance,
                legal, content, and education — each trained for their role.
              </p>
              <div className="grid grid-cols-6 gap-2">
                {[Briefcase, Pen, BarChart2, Code, TrendingUp, GraduationCap, Brain, MessageSquare, Shield, Zap, Heart, Bot].map(
                  (Icon, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-md bg-zinc-800 flex items-center justify-center"
                    >
                      <Icon className="h-3.5 w-3.5 text-zinc-500" />
                    </div>
                  )
                )}
              </div>
            </Card>
          </StaggerCard>

          {/* Card 2: Meet Bestie */}
          <StaggerCard>
            <Card className="bg-zinc-900/70 border-zinc-800 p-6 rounded-xl h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-pink-400" />
                </div>
                <h3 className="text-lg font-semibold">Meet Bestie</h3>
              </div>
              <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
                Your AI companion with personality. Bestie remembers you, adapts to
                your style and grows with you over time.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Remembers you", "Adapts", "Your personality"].map(
                  (trait) => (
                    <Badge
                      key={trait}
                      className="bg-pink-900/30 text-pink-300 border-pink-800/40 text-xs"
                    >
                      {trait}
                    </Badge>
                  )
                )}
              </div>
            </Card>
          </StaggerCard>

          {/* Card 3: Two Engines */}
          <StaggerCard>
            <Card className="bg-zinc-900/70 border-zinc-800 p-6 rounded-xl h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Cpu className="h-5 w-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold">Two Engines</h3>
              </div>
              <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
                LOCAL mode runs on your GPU — private, fast, free. SMART mode uses
                cloud AI for complex tasks. You choose per conversation.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="bg-emerald-900/40 text-emerald-400 border-emerald-800/50 text-xs">LOCAL</Badge>
                  <span className="text-zinc-400">Private &middot; &lt;100ms &middot; Free</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="bg-blue-900/40 text-blue-400 border-blue-800/50 text-xs">SMART</Badge>
                  <span className="text-zinc-400">Powerful &middot; Complex tasks &middot; Paid</span>
                </div>
              </div>
            </Card>
          </StaggerCard>
        </StaggerGrid>
      </section>

      {/* ── Social Proof: Testimonials ── */}
      <section className="px-6 py-16 max-w-6xl mx-auto">
        <ScrollSection>
          <h2 className="text-2xl font-bold text-center mb-10">
            Trusted by builders who <span className="text-amber-400">ship</span>
          </h2>
        </ScrollSection>
        <StaggerGrid className="grid md:grid-cols-3 gap-6">
          <StaggerCard>
            <TestimonialCard
              quote="I replaced 3 freelancers with Stone AI agents. My marketing plan, blog content, and financial projections — all done in one afternoon."
              name="Maya Torres"
              role="Freelancer &amp; Solopreneur"
            />
          </StaggerCard>
          <StaggerCard>
            <TestimonialCard
              quote="The local inference is what sold me. Our legal docs never leave our servers. That's not a feature — that's a requirement."
              name="James Chen"
              role="Startup Founder, Series A"
            />
          </StaggerCard>
          <StaggerCard>
            <TestimonialCard
              quote="We onboarded our whole team in a day. 42 agents across every department we need. The ROI was obvious by week one."
              name="Priya Kapoor"
              role="Agency Owner, 12 employees"
            />
          </StaggerCard>
        </StaggerGrid>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="px-6 py-16 max-w-6xl mx-auto">
        <ScrollSection>
          <PricingSection />
        </ScrollSection>
      </section>

      {/* ── Closer ── */}
      <section className="px-6 py-24 text-center">
        <AnimateOnScroll direction="up">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 max-w-2xl mx-auto">
            Stop chatting with AI.
            <br />
            <span className="text-amber-400">Start working with it.</span>
          </h2>
          <p className="text-zinc-400 mb-8 max-w-md mx-auto">
            42 specialists. Zero setup. Your first agent is free.
          </p>
          <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-lg px-10">
            <Link href="/sign-up">
              Start Free <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
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
