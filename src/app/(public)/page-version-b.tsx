/**
 * VERSION B — "The New World"
 * Futuristic, high-tech aesthetic. AI integration with human work.
 * Bold visual language, cinematic sections, but not overwhelming.
 */
import Link from "next/link";
import {
  Zap,
  Brain,
  Shield,
  DollarSign,
  Server,
  ArrowRight,
  Check,
  Star,
  Gauge,
  Bot,
  Briefcase,
  Pen,
  BarChart2,
  Code,
  TrendingUp,
  Users,
  MessageSquare,
  Rocket,
  Target,
  Clock,
  Cpu,
  X,
  Smartphone,
  Laptop,
  Globe,
  Heart,
  Lightbulb,
  Trophy,
  Sparkles,
  ChevronRight,
  Activity,
  CircuitBoard,
  Fingerprint,
  ScanLine,
  Network,
  Layers,
  Terminal,
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


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white scroll-smooth">
      {/* Nav — minimal, floating feel */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-xl font-bold tracking-tight">
          <span className="text-cyan-400">Stone</span> AI&#8482;
        </span>
        <div className="flex items-center gap-6">
          <Link href="#features" className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors hidden sm:inline">
            Features
          </Link>
          <Link href="#agents" className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors hidden sm:inline">
            Agents
          </Link>
          <Link href="#pricing" className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors hidden sm:inline">
            Pricing
          </Link>
          <Link href="#community" className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors hidden sm:inline">
            Community
          </Link>
          <Link href="/sign-in" className="text-sm text-zinc-500 hover:text-white transition-colors">
            Sign In
          </Link>
          <Button asChild size="sm" className="bg-cyan-600 hover:bg-cyan-500 text-black font-semibold">
            <Link href="/sign-up">Get Started Free</Link>
          </Button>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════
          Hero — "The Shift Has Already Happened"
         ═══════════════════════════════════════════════════════════════ */}
      <section className="relative px-6 pt-24 pb-16 max-w-5xl mx-auto text-center overflow-hidden">
        {/* Futuristic glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-purple-500/5 rounded-full blur-[100px] pointer-events-none" />

        <HeroSection>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-medium mb-8">
            <Activity className="h-3.5 w-3.5" />
            42 AI agents. Local inference. Zero data leaks.
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            The workforce of the<br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              future is here.
            </span>
          </h1>

          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-4 leading-relaxed">
            While others debate whether AI will replace jobs, your AI team is already writing proposals,
            building strategies, and closing deals. 42 specialists. One platform. Instant.
          </p>
          <p className="text-lg text-zinc-600 max-w-xl mx-auto mb-10">
            The companies that move first don&apos;t compete. They dominate.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg px-8">
              <Link href="/sign-up">
                Deploy Your Team <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-zinc-800 text-zinc-400 text-lg px-8 hover:border-cyan-800 hover:text-cyan-400"
            >
              <Link href="#pricing">See pricing</Link>
            </Button>
          </div>
        </HeroSection>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          Chapter 1: The Infrastructure — Technical specs, futuristic
         ═══════════════════════════════════════════════════════════════ */}
      <section className="relative px-6 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-cyan-950/5 to-black pointer-events-none" />

        <div className="relative max-w-5xl mx-auto">
          <ScrollSection>
            <p className="text-center text-xs text-cyan-500/60 uppercase tracking-[0.3em] mb-4">System Architecture</p>
            <h2 className="text-4xl font-bold text-center mb-4">
              AI that runs at the <span className="text-cyan-400">speed of thought.</span>
            </h2>
            <p className="text-center text-zinc-500 mb-12 max-w-lg mx-auto">
              Local GPU inference. No cloud dependency. No data in transit.
              The intelligence lives where you do.
            </p>
          </ScrollSection>

          {/* Spec grid — terminal/dashboard aesthetic */}
          <StaggerGrid className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
            {[
              { value: "<100ms", label: "First token", icon: Zap, color: "text-cyan-400 border-cyan-500/20 bg-cyan-500/5" },
              { value: "70B", label: "Parameters", icon: Brain, color: "text-purple-400 border-purple-500/20 bg-purple-500/5" },
              { value: "0ms", label: "Network hop", icon: Network, color: "text-green-400 border-green-500/20 bg-green-500/5" },
              { value: "100%", label: "Data local", icon: Shield, color: "text-amber-400 border-amber-500/20 bg-amber-500/5" },
            ].map((spec) => (
              <StaggerCard key={spec.label}>
                <div className={`rounded-xl border p-5 text-center ${spec.color}`}>
                  <spec.icon className="h-5 w-5 mx-auto mb-2 opacity-60" />
                  <p className="text-3xl font-bold font-mono">{spec.value}</p>
                  <p className="text-xs mt-1 opacity-60 uppercase tracking-wider">{spec.label}</p>
                </div>
              </StaggerCard>
            ))}
          </StaggerGrid>

          {/* Architecture comparison — dark terminal style */}
          <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StaggerCard>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-xs text-zinc-600 ml-2 font-mono">legacy_cloud_ai.log</span>
                </div>
                <div className="font-mono text-xs space-y-1.5 text-zinc-500">
                  <p><span className="text-zinc-600">[08:15:03]</span> User message sent to remote API...</p>
                  <p><span className="text-zinc-600">[08:15:03]</span> Routing through proxy server...</p>
                  <p><span className="text-zinc-600">[08:15:04]</span> Queued behind 847 requests...</p>
                  <p><span className="text-zinc-600">[08:15:04]</span> Data copied to training pipeline...</p>
                  <p><span className="text-red-400">[08:15:05]</span> <span className="text-red-400">LATENCY: 623ms to first token</span></p>
                  <p><span className="text-yellow-400">[08:15:05]</span> <span className="text-yellow-400">WARNING: Data retained 30 days</span></p>
                  <p><span className="text-zinc-600">[08:15:06]</span> Response streaming...</p>
                  <p><span className="text-zinc-600">[08:15:08]</span> Billing: $0.04 charged</p>
                </div>
              </div>
            </StaggerCard>
            <StaggerCard>
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/10 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2 w-2 rounded-full bg-cyan-400" />
                  <div className="h-2 w-2 rounded-full bg-cyan-400" />
                  <div className="h-2 w-2 rounded-full bg-cyan-400" />
                  <span className="text-xs text-cyan-500/60 ml-2 font-mono">stone_engine.log</span>
                </div>
                <div className="font-mono text-xs space-y-1.5 text-zinc-400">
                  <p><span className="text-cyan-500/60">[08:15:03]</span> Message received locally</p>
                  <p><span className="text-cyan-500/60">[08:15:03]</span> GPU inference started...</p>
                  <p><span className="text-green-400">[08:15:03]</span> <span className="text-green-400">LATENCY: 67ms to first token</span></p>
                  <p><span className="text-green-400">[08:15:03]</span> <span className="text-green-400">DATA: Never left network</span></p>
                  <p><span className="text-green-400">[08:15:03]</span> <span className="text-green-400">COST: $0.00</span></p>
                  <p><span className="text-cyan-500/60">[08:15:03]</span> Response streaming...</p>
                  <p><span className="text-cyan-500/60">[08:15:04]</span> Complete. 512 tokens generated.</p>
                  <p><span className="text-cyan-400">[08:15:04]</span> <span className="text-cyan-400">STATUS: Ready for next request</span></p>
                </div>
              </div>
            </StaggerCard>
          </StaggerGrid>

          <AnimateOnScroll delay={0.3}>
            <p className="text-[10px] text-zinc-600 mt-4 text-center max-w-lg mx-auto">
              Local mode performance varies by GPU hardware. Smart mode routes to GPT-4o cloud API
              when needed, with latency similar to other cloud providers.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          Chapter 2: The Shift — AI is replacing workflows, not people
         ═══════════════════════════════════════════════════════════════ */}
      <section id="features" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-purple-950/5 to-black pointer-events-none" />

        <div className="relative px-6 py-24 max-w-6xl mx-auto">
          <ScrollSection>
            <p className="text-center text-xs text-purple-400/60 uppercase tracking-[0.3em] mb-4">The New Paradigm</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-center mb-4 leading-tight">
              AI isn&apos;t coming for your job.<br />
              It&apos;s coming for your <span className="text-purple-400">busywork.</span>
            </h2>
            <p className="text-center text-zinc-500 max-w-2xl mx-auto mb-16">
              The average knowledge worker spends 60% of their day on tasks a machine can do better.
              The question isn&apos;t whether AI changes work — it&apos;s whether you&apos;re the one directing it
              or the one being replaced by it.
            </p>
          </ScrollSection>

          {/* The transformation — horizontal timeline */}
          <div className="mb-16">
            <AnimateOnScroll>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Yesterday */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                      <Clock className="h-4 w-4 text-zinc-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-400">Yesterday</p>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Manual everything</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      "Write proposals from scratch — 3 hours",
                      "Research competitors manually — 2 hours",
                      "Format reports and decks — 1.5 hours",
                      "Draft emails one by one — 1 hour",
                      "Context-switch between 6 tools",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2">
                        <X className="h-3 w-3 text-zinc-600 shrink-0 mt-1" />
                        <p className="text-xs text-zinc-500">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Today — with generic AI */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-yellow-900/30 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-yellow-400">Today</p>
                      <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Generic AI chatbots</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      "Re-explain your business every session",
                      "Copy-paste between AI and your docs",
                      "Hit token limits mid-conversation",
                      "Pay per message — costs add up fast",
                      "Your data trains someone else's model",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2">
                        <span className="text-yellow-500 text-xs shrink-0 mt-0.5">~</span>
                        <p className="text-xs text-zinc-500">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tomorrow — with Stone AI */}
                <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-950/20 to-zinc-950/80 p-8">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-cyan-900/30 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-cyan-400">With Stone AI</p>
                      <p className="text-[10px] text-cyan-500/60 uppercase tracking-wider">AI-native workflow</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      "42 agents remember your business forever",
                      "One platform — proposals, code, marketing, ops",
                      "Unlimited local inference — $0 per message",
                      "Sub-100ms response — faster than you can blink",
                      "Your data never leaves your network",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2">
                        <Check className="h-3 w-3 text-cyan-400 shrink-0 mt-1" />
                        <p className="text-xs text-zinc-300">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AnimateOnScroll>
          </div>

          {/* The 4 pillars — glowing cards */}
          <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: Gauge, title: "Sub-100ms", desc: "Local GPU inference. No network delay.", color: "cyan" },
              { icon: Brain, title: "70B Model", desc: "Frontier open-weight. Always upgrading.", color: "purple" },
              { icon: Shield, title: "Zero Leaks", desc: "Data never leaves your infrastructure.", color: "green" },
              { icon: DollarSign, title: "Flat Rate", desc: "No per-token billing. No surprises.", color: "amber" },
            ].map((p) => (
              <StaggerCard key={p.title}>
                <div className={`text-center p-6 rounded-xl bg-zinc-950 border border-${p.color}-500/10 hover:border-${p.color}-500/30 transition-all duration-300`}>
                  <p.icon className={`h-8 w-8 text-${p.color}-400 mx-auto mb-3`} />
                  <p className="font-bold text-white text-sm mb-1">{p.title}</p>
                  <p className="text-xs text-zinc-500">{p.desc}</p>
                </div>
              </StaggerCard>
            ))}
          </StaggerGrid>
        </div>
      </section>

      {/* Chapter 3: Getting Started — Clean, minimal */}
      <section className="px-6 py-24 max-w-4xl mx-auto">
        <ScrollSection>
          <p className="text-center text-xs text-zinc-500 uppercase tracking-[0.3em] mb-4">Deployment</p>
          <h2 className="text-3xl font-bold text-center mb-12">
            Three commands. <span className="text-cyan-400">Zero friction.</span>
          </h2>
        </ScrollSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: "01", title: "Sign up", desc: "Free tier. No credit card. No trial. Instant access to 4 agents and unlimited local inference.", icon: Fingerprint },
            { step: "02", title: "Chat locally", desc: "Your messages hit a local GPU — not OpenAI, not the cloud. Sub-100ms responses.", icon: Cpu },
            { step: "03", title: "Scale up", desc: "Need GPT-4o? Upgrade to unlock Smart mode, more agents, and API access.", icon: Layers },
          ].map((s) => (
            <AnimateOnScroll key={s.step} delay={Number(s.step) * 0.1}>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 hover:border-cyan-800/30 transition-colors">
                <span className="text-4xl font-bold text-zinc-800 font-mono">{s.step}</span>
                <s.icon className="h-6 w-6 text-cyan-400 mt-3 mb-2" />
                <h3 className="font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>
      </section>

      {/* Enterprise */}
      <section className="px-6 pb-24 max-w-4xl mx-auto">
        <AnimateOnScroll>
          <div className="rounded-2xl border border-green-500/10 bg-gradient-to-r from-green-950/10 to-zinc-950 p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-1">
                <Badge className="mb-3 bg-green-500/10 text-green-400 border-green-500/20">
                  Enterprise Ready
                </Badge>
                <h3 className="text-2xl font-bold mb-2">
                  Built for regulated industries
                </h3>
                <p className="text-zinc-500 leading-relaxed">
                  Healthcare, legal, finance — Stone AI&#8482; runs on local GPU inference
                  by default, keeping sensitive data on your network. Cloud AI (Smart mode)
                  is opt-in and clearly labeled — you control when data leaves and when it stays.
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                className="border-green-500/20 text-green-400 hover:bg-green-500/10 shrink-0"
              >
                <Link href="/sign-up">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </AnimateOnScroll>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* ═══════════════════════════════════════════════════════════════
          Chapter 4: The Workforce — Agents as AI employees
         ═══════════════════════════════════════════════════════════════ */}
      <section id="agents" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-blue-950/5 to-black pointer-events-none" />

        <div className="relative px-6 py-24 max-w-6xl mx-auto">
          <ScrollSection>
            <div className="text-center mb-16">
              <p className="text-xs text-blue-400/60 uppercase tracking-[0.3em] mb-4">Your AI Workforce</p>
              <h2 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
                42 specialists.<br />
                <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Zero salaries.</span>
              </h2>
              <p className="text-zinc-500 max-w-2xl mx-auto">
                Each agent is a domain expert — trained on real frameworks, loaded with industry knowledge,
                and equipped with persistent memory. They don&apos;t just answer questions. They do the work.
              </p>
            </div>
          </ScrollSection>

          {/* The org chart — your AI company */}
          <AnimateOnScroll>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-8 mb-8">
              <div className="flex items-center gap-2 mb-6">
                <CircuitBoard className="h-5 w-5 text-cyan-400" />
                <h3 className="font-bold text-white">Mission: Launch a business this week</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[
                  { step: "DAY 1", agent: "Startup Launcher", task: "Validate idea, map market, define revenue", color: "border-cyan-500/20 bg-cyan-500/5" },
                  { step: "DAY 2", agent: "Business Plan Agent", task: "Full plan with financial projections", color: "border-blue-500/20 bg-blue-500/5" },
                  { step: "DAY 3", agent: "Brand Agent", task: "Name, voice, positioning, visual identity", color: "border-purple-500/20 bg-purple-500/5" },
                  { step: "DAY 4", agent: "Web Dev Agent", task: "Landing page, online presence, SEO", color: "border-amber-500/20 bg-amber-500/5" },
                  { step: "DAY 5", agent: "Marketing Agent", task: "Ads, funnels, email sequences live", color: "border-green-500/20 bg-green-500/5" },
                ].map((s) => (
                  <div key={s.step} className={`rounded-lg border ${s.color} p-4`}>
                    <span className="text-[10px] font-mono text-zinc-600 uppercase">{s.step}</span>
                    <p className="text-sm font-semibold text-white mt-1">{s.agent}</p>
                    <p className="text-xs text-zinc-500 mt-1">{s.task}</p>
                  </div>
                ))}
              </div>
            </div>
          </AnimateOnScroll>

          {/* One input, 12 outputs */}
          <AnimateOnScroll delay={0.1}>
            <div className="rounded-2xl border border-purple-500/10 bg-gradient-to-r from-purple-950/10 to-zinc-950 p-8 mb-8">
              <div className="flex items-center gap-2 mb-6">
                <Network className="h-5 w-5 text-purple-400" />
                <h3 className="font-bold text-white">One idea in. Twelve deliverables out.</h3>
              </div>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {[
                  { agent: "Content Studio", output: "Blog series" },
                  { agent: "Copywriting", output: "Email sequence" },
                  { agent: "Social Media", output: "30 days posts" },
                  { agent: "YouTube", output: "Video script" },
                  { agent: "SEO Agent", output: "Keyword map" },
                  { agent: "Ad Copy", output: "Ad campaigns" },
                  { agent: "Funnel Agent", output: "Landing pages" },
                  { agent: "Podcast", output: "Episode outline" },
                  { agent: "Sales Agent", output: "Outreach emails" },
                  { agent: "Analytics", output: "Dashboard" },
                  { agent: "Translation", output: "3 languages" },
                  { agent: "Proposal", output: "Client deck" },
                ].map((d) => (
                  <div key={d.agent} className="rounded-lg bg-zinc-900/50 border border-zinc-800/50 p-3 hover:border-purple-500/20 transition-colors text-center">
                    <p className="text-[11px] font-semibold text-zinc-300">{d.agent}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">{d.output}</p>
                  </div>
                ))}
              </div>
            </div>
          </AnimateOnScroll>

          {/* Time saved — dramatic comparison */}
          <AnimateOnScroll delay={0.2}>
            <div className="rounded-2xl border border-amber-500/10 bg-gradient-to-r from-amber-950/10 to-zinc-950 p-8 mb-12">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-white">Your Monday. Reimagined.</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] text-red-400/60 uppercase tracking-wider font-mono mb-3">HUMAN_ONLY.log</p>
                  <div className="space-y-2">
                    {[
                      "Client proposal ............... 2.0 hrs",
                      "Competitor research ........... 0.8 hrs",
                      "Social media content .......... 1.0 hrs",
                      "Report formatting ............. 0.5 hrs",
                      "Email follow-ups .............. 1.0 hrs",
                    ].map((t) => (
                      <p key={t} className="text-xs font-mono text-zinc-600">{t}</p>
                    ))}
                    <div className="pt-2 border-t border-zinc-800">
                      <p className="text-xs font-mono text-red-400">TOTAL: 5.3 hours</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-cyan-400/60 uppercase tracking-wider font-mono mb-3">STONE_AI.log</p>
                  <div className="space-y-2">
                    {[
                      "Proposal Agent ................ 0.13 hrs",
                      "Research Agent ................ 0.08 hrs",
                      "Social Media Agent ............ 0.20 hrs",
                      "Data Analytics Agent .......... 0.05 hrs",
                      "Sales Agent ................... 0.17 hrs",
                    ].map((t) => (
                      <p key={t} className="text-xs font-mono text-zinc-400">{t}</p>
                    ))}
                    <div className="pt-2 border-t border-cyan-500/10">
                      <p className="text-xs font-mono text-cyan-400">TOTAL: 0.63 hours (38 minutes)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </AnimateOnScroll>

          {/* Departments */}
          <ScrollSection>
            <h3 className="text-2xl font-bold text-center mb-8">Departments</h3>
          </ScrollSection>
          <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
            {[
              { icon: Briefcase, title: "Business Building", count: 14, examples: "AI Agency, SaaS, Sales, HR, PM, Dispatch, Claims, Compliance", color: "text-blue-400" },
              { icon: Pen, title: "Content & Media", count: 7, examples: "YouTube, Content Studio, Copywriting, Blog, Translation, Podcast", color: "text-purple-400" },
              { icon: BarChart2, title: "Marketing & Sales", count: 4, examples: "Digital Marketing, Funnels, Lead Gen, Brand Strategy", color: "text-green-400" },
              { icon: Code, title: "Technical", count: 5, examples: "Web Dev, Code Assistant, Automation, Analytics, Cybersecurity", color: "text-cyan-400" },
              { icon: TrendingUp, title: "Finance & Career", count: 4, examples: "Personal Finance, Trading, Resume, Real Estate", color: "text-amber-400" },
              { icon: Brain, title: "Education & Wellness", count: 8, examples: "Health Coach, Tutor, Bestie, Writing Coach, Platform Guide", color: "text-pink-400" },
            ].map((cat) => (
              <StaggerCard key={cat.title}>
                <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5 hover:border-zinc-700 transition-colors h-full">
                  <cat.icon className={`h-5 w-5 ${cat.color} mb-3`} />
                  <h3 className="font-semibold text-sm mb-1 text-white">
                    {cat.title}
                    <span className="text-zinc-600 font-normal ml-2">({cat.count})</span>
                  </h3>
                  <p className="text-xs text-zinc-600">{cat.examples}</p>
                </div>
              </StaggerCard>
            ))}
          </StaggerGrid>

          {/* What's different */}
          <AnimateOnScroll>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 md:p-8 mb-10">
              <h3 className="text-lg font-bold mb-4">
                Why these aren&apos;t chatbots
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-cyan-400" />
                    <span className="text-sm font-semibold">RAG Knowledge Base</span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Domain-specific frameworks, templates, and best practices.
                    Real data, not generic hallucinations.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-purple-400" />
                    <span className="text-sm font-semibold">Persistent Memory</span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    They remember your business, clients, and decisions.
                    Session 50 is smarter than session 1.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-semibold">Production Output</span>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Client-ready deliverables — proposals, code, copy,
                    strategies — that you ship, not edit.
                  </p>
                </div>
              </div>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll delay={0.2}>
            <div className="text-center">
              <Button asChild size="lg" className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg px-8">
                <Link href="/sign-up">
                  Deploy All 42 Agents <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          Chapter 5: The Network — Community as a movement
         ═══════════════════════════════════════════════════════════════ */}
      <section id="community" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-blue-950/5 to-black pointer-events-none" />

        <div className="relative px-6 py-24 max-w-6xl mx-auto">
          <ScrollSection>
            <div className="text-center mb-16">
              <p className="text-xs text-blue-400/60 uppercase tracking-[0.3em] mb-4">The Network</p>
              <h2 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
                The early adopters<br />
                <span className="text-blue-400">are already building.</span>
              </h2>
              <p className="text-zinc-500 max-w-2xl mx-auto">
                Stone AI&#8482; isn&apos;t a product you use alone. It&apos;s a network of founders, builders, and operators
                who share what&apos;s working, what isn&apos;t, and what&apos;s next.
              </p>
            </div>
          </ScrollSection>

          <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StaggerCard>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-6 h-full hover:border-blue-500/20 transition-colors">
                <MessageSquare className="h-7 w-7 text-blue-400 mb-4" />
                <h3 className="font-bold text-white mb-2">Tactical Intelligence</h3>
                <p className="text-sm text-zinc-500 leading-relaxed mb-4">
                  Real agent workflows, prompt engineering techniques, and automation
                  setups shared by people who use them daily.
                </p>
                <div className="rounded-lg bg-zinc-900/50 border border-zinc-800/50 p-3">
                  <p className="text-xs text-zinc-600 italic">
                    &quot;Chained the Proposal Agent into the Sales Agent. Closed $12K in 3 days.
                    Here&apos;s the exact setup...&quot;
                  </p>
                </div>
              </div>
            </StaggerCard>
            <StaggerCard>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-6 h-full hover:border-amber-500/20 transition-colors">
                <Trophy className="h-7 w-7 text-amber-400 mb-4" />
                <h3 className="font-bold text-white mb-2">Proof of Work</h3>
                <p className="text-sm text-zinc-500 leading-relaxed mb-4">
                  Businesses launched, deals closed, products shipped — real results
                  from real users. Not testimonials. Receipts.
                </p>
                <div className="rounded-lg bg-zinc-900/50 border border-zinc-800/50 p-3">
                  <p className="text-xs text-zinc-600 italic">
                    &quot;Built my SaaS MVP in 2 weeks with the Code Agent + Business Plan Agent.
                    First paying customer on day 16.&quot;
                  </p>
                </div>
              </div>
            </StaggerCard>
            <StaggerCard>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-6 h-full hover:border-green-500/20 transition-colors">
                <Users className="h-7 w-7 text-green-400 mb-4" />
                <h3 className="font-bold text-white mb-2">Open Source Knowledge</h3>
                <p className="text-sm text-zinc-500 leading-relaxed mb-4">
                  No gatekeeping. No paid masterclasses. Just builders helping builders.
                  Ask a question, get an answer from someone who&apos;s done it.
                </p>
                <div className="rounded-lg bg-zinc-900/50 border border-zinc-800/50 p-3">
                  <p className="text-xs text-zinc-600 italic">
                    &quot;Asked about automating client onboarding. Got 4 detailed replies with
                    agent combos I never considered.&quot;
                  </p>
                </div>
              </div>
            </StaggerCard>
          </StaggerGrid>

          {/* Categories */}
          <AnimateOnScroll>
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-6 mb-12">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                {[
                  { name: "General", color: "text-blue-400" },
                  { name: "Tips", color: "text-amber-400" },
                  { name: "Showcase", color: "text-purple-400" },
                  { name: "Questions", color: "text-green-400" },
                  { name: "Features", color: "text-pink-400" },
                  { name: "Business", color: "text-cyan-400" },
                  { name: "Feedback", color: "text-red-400" },
                ].map((c) => (
                  <div key={c.name} className="text-center p-2 rounded-lg bg-zinc-900/30 border border-zinc-800/30">
                    <p className={`text-xs font-medium ${c.color}`}>{c.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll delay={0.2}>
            <div className="text-center">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-500 text-lg px-8 font-bold">
                <Link href="/sign-up">
                  Join the Network <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          Bestie — AI Companion, futuristic framing
         ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-pink-950/5 to-black pointer-events-none" />

        <div className="relative px-6 py-24 max-w-5xl mx-auto">
          <ScrollSection>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-medium mb-6">
                <Heart className="h-3.5 w-3.5" />
                AI Companion
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
                Not just an assistant.<br />
                <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">A presence.</span>
              </h2>
              <p className="text-zinc-500 max-w-xl mx-auto">
                Your Bestie remembers who you are across every device, every session, every conversation.
                One personality. Persistent memory. Always there.
              </p>
            </div>
          </ScrollSection>

          <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StaggerCard>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-6 text-center hover:border-pink-500/20 transition-colors h-full">
                <Laptop className="h-9 w-9 text-pink-400 mx-auto mb-4" />
                <h3 className="font-bold text-white mb-2">Desktop & Laptop</h3>
                <p className="text-sm text-zinc-500 leading-relaxed mb-3">
                  Full conversations in your browser. Rich, persistent chat
                  while you work — always one tab away.
                </p>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-green-400 font-medium">
                  <Check className="h-3 w-3" /> Live Now
                </span>
              </div>
            </StaggerCard>
            <StaggerCard>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-6 text-center hover:border-pink-500/20 transition-colors h-full">
                <Smartphone className="h-9 w-9 text-pink-400 mx-auto mb-4" />
                <h3 className="font-bold text-white mb-2">Home Screen Widget</h3>
                <p className="text-sm text-zinc-500 leading-relaxed mb-3">
                  Add to your phone&apos;s home screen. One tap — no app store,
                  no install, no login screen.
                </p>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-green-400 font-medium">
                  <Check className="h-3 w-3" /> Add to Home Screen
                </span>
              </div>
            </StaggerCard>
            <StaggerCard>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-6 text-center hover:border-pink-500/20 transition-colors h-full">
                <Globe className="h-9 w-9 text-pink-400 mx-auto mb-4" />
                <h3 className="font-bold text-white mb-2">Cross-Device Memory</h3>
                <p className="text-sm text-zinc-500 leading-relaxed mb-3">
                  Start on laptop, continue on phone. Same personality.
                  Same memories. Seamless.
                </p>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-green-400 font-medium">
                  <Check className="h-3 w-3" /> Live Now
                </span>
              </div>
            </StaggerCard>
          </StaggerGrid>

          <AnimateOnScroll delay={0.2}>
            <div className="text-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-lg px-8 font-bold">
                <Link href="/sign-up">
                  Create Your Bestie <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Builders & Resellers — compact */}
      <section className="px-6 py-24 max-w-5xl mx-auto">
        <ScrollSection>
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              <Code className="h-3 w-3 mr-1" /> For Builders
            </Badge>
            <h2 className="text-3xl font-bold mb-4">
              Build with it. <span className="text-emerald-400">Sell it.</span>
            </h2>
            <p className="text-zinc-500 max-w-2xl mx-auto">
              Pro tier unlocks full API access. Build SaaS products, serve clients,
              and sell AI solutions under your own brand.
            </p>
          </div>
        </ScrollSection>

        <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Terminal, title: "REST API", desc: "API key auth. 3,000+ requests/day. Works with any language.", color: "text-emerald-400" },
            { icon: DollarSign, title: "White-Label", desc: "No branding requirements. Your customers see your brand.", color: "text-amber-400" },
            { icon: Shield, title: "Fixed Pricing", desc: "$200/mo flat. No per-token billing. Know your costs.", color: "text-cyan-400" },
          ].map((item) => (
            <StaggerCard key={item.title}>
              <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5 hover:border-zinc-700 transition-colors h-full">
                <item.icon className={`h-6 w-6 ${item.color} mb-3`} />
                <h3 className="font-semibold text-sm mb-2 text-white">{item.title}</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
              </div>
            </StaggerCard>
          ))}
        </StaggerGrid>

        <AnimateOnScroll>
          <div className="text-center">
            <Button asChild variant="outline" size="lg" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 px-8">
              <Link href="/sign-up">
                Get API Access <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </AnimateOnScroll>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          Chapter 6: The Future Is Already Running — Cinematic finale
         ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Multi-layered cinematic gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-cyan-950/10 to-black pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative px-6 py-32 max-w-4xl mx-auto text-center">
          <ScrollSection>
            <p className="text-xs text-cyan-500/60 uppercase tracking-[0.3em] mb-8">Chapter 6</p>
          </ScrollSection>

          <AnimateOnScroll>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.1] mb-8">
              The future isn&apos;t<br />
              <span className="text-zinc-600">coming.</span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                It&apos;s running.
              </span>
            </h2>
          </AnimateOnScroll>

          <AnimateOnScroll delay={0.15}>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-6">
              42 AI agents that know your business. A companion that knows you.
              Infrastructure that keeps your data yours. A community of builders who move first.
            </p>
          </AnimateOnScroll>

          <AnimateOnScroll delay={0.25}>
            <p className="text-lg text-zinc-600 max-w-xl mx-auto mb-12">
              The only question is whether you&apos;re deploying it — or competing against people who are.
            </p>
          </AnimateOnScroll>

          {/* Status board */}
          <AnimateOnScroll delay={0.3}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-14 max-w-3xl mx-auto">
              {[
                { label: "42 AI Agents", status: "ONLINE" },
                { label: "AI Bestie", status: "ONLINE" },
                { label: "Community", status: "ONLINE" },
                { label: "API Access", status: "ONLINE" },
                { label: "Cross-Device Sync", status: "ONLINE" },
                { label: "Home Screen Widget", status: "ONLINE" },
                { label: "Mobile App", status: "2026" },
                { label: "Voice Companions", status: "2026" },
              ].map((item) => (
                <div key={item.label} className="text-center p-3 rounded-lg bg-zinc-950 border border-zinc-800">
                  <p className="text-xs font-medium text-zinc-400 mb-1">{item.label}</p>
                  <span className={`text-[10px] font-mono font-bold ${item.status === "ONLINE" ? "text-green-400" : "text-amber-400"}`}>
                    {item.status === "ONLINE" ? "[ ONLINE ]" : `[ ${item.status} ]`}
                  </span>
                </div>
              ))}
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Button asChild size="lg" className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-lg px-10 py-6 h-auto">
                <Link href="/sign-up">
                  Deploy Now — It&apos;s Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-zinc-800 text-zinc-400 text-lg px-8 py-6 h-auto hover:border-cyan-800">
                <Link href="#pricing">Compare Plans</Link>
              </Button>
            </div>
            <p className="text-xs text-zinc-700 font-mono">
              No credit card. No trial. No catch.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 px-6 py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <span className="text-lg font-bold"><span className="text-cyan-400">Stone</span> AI&#8482;</span>
            <p className="text-sm text-zinc-600 mt-2 leading-relaxed">
              Private, fast, local-first AI infrastructure for the next era of work.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-400 mb-3">Product</p>
            <ul className="space-y-2 text-sm text-zinc-600">
              <li><Link href="#features" className="hover:text-cyan-400 transition-colors">Features</Link></li>
              <li><Link href="#agents" className="hover:text-cyan-400 transition-colors">AI Agents</Link></li>
              <li><Link href="#pricing" className="hover:text-cyan-400 transition-colors">Pricing</Link></li>
              <li><Link href="/sign-up" className="hover:text-cyan-400 transition-colors">AI Bestie</Link></li>
              <li><Link href="#community" className="hover:text-cyan-400 transition-colors">Community</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-400 mb-3">Company</p>
            <ul className="space-y-2 text-sm text-zinc-600">
              <li><Link href="/about" className="hover:text-cyan-400 transition-colors">About</Link></li>
              <li><Link href="/blog" className="hover:text-cyan-400 transition-colors">Blog</Link></li>
              <li><Link href="/careers" className="hover:text-cyan-400 transition-colors">Careers</Link></li>
              <li><Link href="mailto:support@stone-ai.net" className="hover:text-cyan-400 transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-400 mb-3">Legal</p>
            <ul className="space-y-2 text-sm text-zinc-600">
              <li><Link href="/terms" className="hover:text-cyan-400 transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/security" className="hover:text-cyan-400 transition-colors">Security</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-zinc-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-zinc-700">&copy; 2026 Stone AI&#8482;. All rights reserved.</span>
          <span className="text-xs text-zinc-700 font-mono">Built on local-first AI infrastructure</span>
        </div>
      </footer>
    </div>
  );
}
