/**
 * VERSION C — "The Hybrid" (50/50 blend of A + B)
 * Warm storytelling from Version A + futuristic technical aesthetic from Version B.
 * Amber/gold narrative warmth meets cyan/terminal technical credibility.
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
    <div className="min-h-screen bg-zinc-950 text-white scroll-smooth">
      {/* Nav — warm brand + clean tech feel */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-xl font-bold">Stone AI&#8482;</span>
        <div className="flex items-center gap-6">
          <Link href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:inline">
            Features
          </Link>
          <Link href="#agents" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:inline">
            Agents
          </Link>
          <Link href="#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:inline">
            Pricing
          </Link>
          <Link href="#community" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:inline">
            Community
          </Link>
          <Link href="/sign-in" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Sign In
          </Link>
          <Button asChild size="sm">
            <Link href="/sign-up">Get Started Free</Link>
          </Button>
        </div>
      </nav>

      {/* Hero — Warm story hook with technical edge */}
      <section className="relative px-6 pt-20 pb-12 max-w-4xl mx-auto text-center overflow-hidden">
        <HeroGlow />
        {/* Subtle tech glow from Version B */}
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-cyan-500/3 rounded-full blur-[100px] pointer-events-none" />

        <HeroSection>
          <Badge className="mb-6 bg-amber-900/50 text-amber-300 border-amber-800">
            <Activity className="h-3 w-3 mr-1" /> 42 AI agents. Local inference. Zero data leaks.
          </Badge>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
            You had the <span className="text-amber-400">idea</span>.
            <br />Now meet the <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">team</span>.
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-4 leading-relaxed">
            While others debate whether AI replaces jobs, your 42-agent team is already
            writing proposals, building strategies, and closing deals.
          </p>
          <p className="text-lg text-zinc-500 max-w-xl mx-auto mb-10">
            The companies that move first don&apos;t compete. They dominate.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-500 text-lg px-8">
              <Link href="/sign-up">
                Start for free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-zinc-700 text-zinc-300 text-lg px-8"
            >
              <Link href="#pricing">See pricing</Link>
            </Button>
          </div>
        </HeroSection>
      </section>

      {/* Chapter 1: Speed — stats + terminal comparison from B */}
      <section className="px-6 pb-20 max-w-4xl mx-auto">
        <ScrollSection>
          <p className="text-center text-sm text-zinc-500 uppercase tracking-widest mb-8">Chapter 1: The Speed Advantage</p>
        </ScrollSection>
        <StaggerGrid className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          {[
            { value: "<100ms", label: "First token", color: "text-amber-400 border-amber-500/20 bg-amber-500/5" },
            { value: "70B", label: "Parameters", color: "text-blue-400 border-blue-500/20 bg-blue-500/5" },
            { value: "0ms", label: "Network hop", color: "text-green-400 border-green-500/20 bg-green-500/5" },
            { value: "100%", label: "Data local", color: "text-purple-400 border-purple-500/20 bg-purple-500/5" },
          ].map((spec) => (
            <StaggerCard key={spec.label}>
              <div className={`rounded-xl border p-5 text-center ${spec.color}`}>
                <p className="text-3xl font-bold">{spec.value}</p>
                <p className="text-xs mt-1 opacity-60 uppercase tracking-wider">{spec.label}</p>
              </div>
            </StaggerCard>
          ))}
        </StaggerGrid>

        {/* Terminal comparison from B blended with A's warmth */}
        <ScrollSection>
          <h2 className="text-3xl font-bold text-center mb-4">
            Your team doesn&apos;t wait. Neither should your AI.
          </h2>
          <p className="text-center text-zinc-400 mb-10 max-w-lg mx-auto">
            Most AI tools route your data through remote servers.
            We moved the intelligence to your network.
          </p>
        </ScrollSection>

        <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StaggerCard>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <div className="h-2 w-2 rounded-full bg-zinc-600" />
                <span className="text-xs text-zinc-600 ml-2 font-mono">cloud_ai.log</span>
              </div>
              <div className="font-mono text-xs space-y-1.5 text-zinc-500">
                <p><span className="text-zinc-600">[08:15:03]</span> Message sent to remote API...</p>
                <p><span className="text-zinc-600">[08:15:03]</span> Routing through proxy server...</p>
                <p><span className="text-zinc-600">[08:15:04]</span> Queued behind 847 requests...</p>
                <p><span className="text-zinc-600">[08:15:04]</span> Data copied to training pipeline...</p>
                <p><span className="text-red-400">[08:15:05]</span> <span className="text-red-400">LATENCY: 623ms</span></p>
                <p><span className="text-yellow-400">[08:15:05]</span> <span className="text-yellow-400">Data retained 30 days</span></p>
              </div>
            </div>
          </StaggerCard>
          <StaggerCard>
            <div className="rounded-xl border border-amber-800/30 bg-gradient-to-br from-zinc-900 to-amber-950/10 p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-2 w-2 rounded-full bg-amber-400" />
                <div className="h-2 w-2 rounded-full bg-amber-400" />
                <div className="h-2 w-2 rounded-full bg-amber-400" />
                <span className="text-xs text-amber-500/60 ml-2 font-mono">stone_engine.log</span>
              </div>
              <div className="font-mono text-xs space-y-1.5 text-zinc-400">
                <p><span className="text-amber-500/60">[08:15:03]</span> Message received locally</p>
                <p><span className="text-amber-500/60">[08:15:03]</span> GPU inference started...</p>
                <p><span className="text-green-400">[08:15:03]</span> <span className="text-green-400">LATENCY: 67ms</span></p>
                <p><span className="text-green-400">[08:15:03]</span> <span className="text-green-400">Data: Never left network</span></p>
                <p><span className="text-green-400">[08:15:03]</span> <span className="text-green-400">Cost: $0.00</span></p>
                <p><span className="text-amber-400">[08:15:04]</span> <span className="text-amber-400">Ready for next request</span></p>
              </div>
            </div>
          </StaggerCard>
        </StaggerGrid>
      </section>

      {/* Chapter 2: The Problem — A's before/after with B's timeline */}
      <section id="features" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-red-950/5 to-zinc-950 pointer-events-none" />

        <div className="relative px-6 py-24 max-w-6xl mx-auto">
          <ScrollSection>
            <p className="text-center text-sm text-zinc-500 uppercase tracking-widest mb-4">Chapter 2: The Problem Nobody Talks About</p>
            <h2 className="text-4xl sm:text-5xl font-bold text-center mb-4 leading-tight">
              AI isn&apos;t coming for your job.<br />
              It&apos;s coming for your <span className="text-red-400">busywork.</span>
            </h2>
            <p className="text-center text-zinc-400 max-w-2xl mx-auto mb-16">
              The average knowledge worker spends 60% of their day on tasks a machine can do better.
              The question isn&apos;t whether AI changes work — it&apos;s whether you direct it or get replaced by it.
            </p>
          </ScrollSection>

          {/* Three-column timeline from B */}
          <AnimateOnScroll>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
              <Card className="bg-zinc-900/80 border-zinc-800 p-8">
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
              </Card>

              <Card className="bg-zinc-900/80 border-zinc-800 p-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-yellow-900/30 flex items-center justify-center">
                    <Bot className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-yellow-400">Today</p>
                    <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Generic AI</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    "Re-explain your business every session",
                    "Copy-paste between AI and your docs",
                    "Hit token limits mid-conversation",
                    "Pay per message — costs pile up",
                    "Your data trains someone else's model",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <span className="text-yellow-500 text-xs shrink-0 mt-0.5">~</span>
                      <p className="text-xs text-zinc-500">{item}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="bg-gradient-to-b from-amber-950/20 to-zinc-900/80 border-amber-900/30 p-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-amber-900/30 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-amber-400">With Stone AI</p>
                    <p className="text-[10px] text-amber-500/60 uppercase tracking-wider">AI-native workflow</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {[
                    "42 agents remember your business forever",
                    "One platform for proposals, code, marketing",
                    "Unlimited local inference — $0 per message",
                    "Sub-100ms — faster than you can blink",
                    "Your data never leaves your network",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <Check className="h-3 w-3 text-amber-400 shrink-0 mt-1" />
                      <p className="text-xs text-zinc-300">{item}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </AnimateOnScroll>

          {/* 4 pillars */}
          <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StaggerCard>
              <div className="text-center p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-amber-800/40 transition-colors">
                <Gauge className="h-8 w-8 text-amber-400 mx-auto mb-3" />
                <p className="font-bold text-white text-sm mb-1">Sub-100ms</p>
                <p className="text-xs text-zinc-500">Faster than cloud AI receives your message</p>
              </div>
            </StaggerCard>
            <StaggerCard>
              <div className="text-center p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-blue-800/40 transition-colors">
                <Brain className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                <p className="font-bold text-white text-sm mb-1">70B Parameters</p>
                <p className="text-xs text-zinc-500">Frontier open-weight, always upgrading</p>
              </div>
            </StaggerCard>
            <StaggerCard>
              <div className="text-center p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-green-800/40 transition-colors">
                <Shield className="h-8 w-8 text-green-400 mx-auto mb-3" />
                <p className="font-bold text-white text-sm mb-1">Zero data leaks</p>
                <p className="text-xs text-zinc-500">Local mode never sends a byte off-network</p>
              </div>
            </StaggerCard>
            <StaggerCard>
              <div className="text-center p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-emerald-800/40 transition-colors">
                <DollarSign className="h-8 w-8 text-emerald-400 mx-auto mb-3" />
                <p className="font-bold text-white text-sm mb-1">Flat pricing</p>
                <p className="text-xs text-zinc-500">No per-token billing. No surprises.</p>
              </div>
            </StaggerCard>
          </StaggerGrid>
        </div>
      </section>

      {/* Chapter 3: Getting Started */}
      <section className="px-6 py-24 max-w-4xl mx-auto">
        <ScrollSection>
          <p className="text-center text-sm text-zinc-500 uppercase tracking-widest mb-4">Chapter 3: Getting Started</p>
          <h2 className="text-3xl font-bold text-center mb-12">
            Three steps. <span className="text-amber-400">Zero friction.</span>
          </h2>
        </ScrollSection>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: "01", title: "Sign up in seconds", desc: "Free tier, no credit card. Instant access to 4 agents and unlimited local AI.", icon: Users },
            { step: "02", title: "Chat with local AI", desc: "Messages hit a local GPU — not OpenAI, not the cloud. Sub-100ms responses.", icon: Cpu },
            { step: "03", title: "Unlock Smart mode", desc: "Need GPT-4o? Upgrade to unlock cloud fallback, more agents, and API access.", icon: Layers },
          ].map((s) => (
            <AnimateOnScroll key={s.step} delay={Number(s.step) * 0.1}>
              <Card className="bg-zinc-900 border-zinc-800 p-6 hover:border-zinc-700 transition-colors">
                <span className="text-3xl font-bold text-zinc-800 font-mono">{s.step}</span>
                <s.icon className="h-6 w-6 text-amber-400 mt-3 mb-2" />
                <h3 className="font-bold text-white mb-2">{s.title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{s.desc}</p>
              </Card>
            </AnimateOnScroll>
          ))}
        </div>
      </section>

      {/* Enterprise */}
      <section className="px-6 pb-24 max-w-4xl mx-auto">
        <AnimateOnScroll>
          <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-zinc-800 p-8 md:p-12 hover:border-zinc-700 transition-colors">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-1">
                <Badge className="mb-3 bg-green-900/50 text-green-300 border-green-800">Enterprise Ready</Badge>
                <h3 className="text-2xl font-bold mb-2">Built for regulated industries</h3>
                <p className="text-zinc-400 leading-relaxed">
                  Healthcare, legal, finance — Stone AI&#8482; runs on local GPU inference
                  by default, keeping sensitive data on your network. Cloud AI (Smart mode)
                  is opt-in and clearly labeled — you control when data leaves and when it stays.
                </p>
              </div>
              <Button asChild variant="outline" className="border-green-800 text-green-300 hover:bg-green-900/30 shrink-0">
                <Link href="/sign-up">Contact Sales</Link>
              </Button>
            </div>
          </Card>
        </AnimateOnScroll>
      </section>

      <PricingSection />

      {/* Chapter 4: Watch It Work — Scenarios from A + terminal style from B */}
      <section id="agents" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-purple-950/5 to-zinc-950 pointer-events-none" />

        <div className="relative px-6 py-24 max-w-6xl mx-auto">
          <ScrollSection>
            <div className="text-center mb-16">
              <p className="text-sm text-zinc-500 uppercase tracking-widest mb-4">Chapter 4: Watch It Work</p>
              <Badge className="mb-4 bg-amber-900/50 text-amber-300 border-amber-800">
                <Bot className="h-3 w-3 mr-1" /> 42 Expert AI Agents
              </Badge>
              <h2 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
                42 specialists.<br />
                <span className="text-amber-400">Zero salaries.</span>
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                Each agent is a domain expert with persistent memory and industry-specific knowledge.
                They don&apos;t just answer questions — they do the work.
              </p>
            </div>
          </ScrollSection>

          {/* Scenario 1: Launch a business */}
          <AnimateOnScroll>
            <Card className="bg-gradient-to-r from-blue-950/30 to-zinc-900 border-blue-900/30 p-8 lg:p-10 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-blue-900/50 flex items-center justify-center">
                  <Rocket className="h-6 w-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Launch a business this week</h3>
                  <p className="text-sm text-zinc-500">5 agents. 5 days. Revenue-ready.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {[
                  { step: "DAY 1", agent: "Startup Launcher", task: "Validate idea, map market, revenue model", color: "border-blue-500/20 bg-blue-500/5" },
                  { step: "DAY 2", agent: "Business Plan", task: "Full plan with financial projections", color: "border-blue-500/20 bg-blue-500/5" },
                  { step: "DAY 3", agent: "Brand Agent", task: "Name, voice, positioning, identity", color: "border-purple-500/20 bg-purple-500/5" },
                  { step: "DAY 4", agent: "Web Dev Agent", task: "Landing page and online presence", color: "border-amber-500/20 bg-amber-500/5" },
                  { step: "DAY 5", agent: "Marketing Agent", task: "Ads, funnels, email sequences", color: "border-green-500/20 bg-green-500/5" },
                ].map((s) => (
                  <div key={s.step} className={`rounded-lg border ${s.color} p-4`}>
                    <span className="text-[10px] font-mono text-zinc-600 uppercase">{s.step}</span>
                    <p className="text-sm font-semibold text-white mt-1">{s.agent}</p>
                    <p className="text-xs text-zinc-500 mt-1">{s.task}</p>
                  </div>
                ))}
              </div>
            </Card>
          </AnimateOnScroll>

          {/* Scenario 2: One idea, 12 deliverables */}
          <AnimateOnScroll delay={0.1}>
            <Card className="bg-gradient-to-r from-purple-950/30 to-zinc-900 border-purple-900/30 p-8 lg:p-10 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-purple-900/50 flex items-center justify-center">
                  <Network className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">One idea in. Twelve deliverables out.</h3>
                  <p className="text-sm text-zinc-500">Tell one agent your idea. Watch the others build on it.</p>
                </div>
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
                  <div key={d.agent} className="bg-zinc-800/40 rounded-lg p-3 border border-zinc-700/30 hover:border-purple-700/40 transition-colors text-center">
                    <p className="text-[11px] font-semibold text-zinc-300">{d.agent}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">{d.output}</p>
                  </div>
                ))}
              </div>
            </Card>
          </AnimateOnScroll>

          {/* Scenario 3: Monday morning — terminal style from B */}
          <AnimateOnScroll delay={0.2}>
            <Card className="bg-gradient-to-r from-amber-950/30 to-zinc-900 border-amber-900/30 p-8 lg:p-10 mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-amber-900/50 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Your Monday. Reimagined.</h3>
                  <p className="text-sm text-zinc-500">What took 5 hours now takes 38 minutes</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] text-red-400/60 uppercase tracking-wider font-mono mb-3">BEFORE_STONE.log</p>
                  <div className="space-y-2 font-mono">
                    {[
                      "Client proposal ............... 2.0 hrs",
                      "Competitor research ........... 0.8 hrs",
                      "Social media content .......... 1.0 hrs",
                      "Report formatting ............. 0.5 hrs",
                      "Email follow-ups .............. 1.0 hrs",
                    ].map((t) => (
                      <p key={t} className="text-xs text-zinc-600">{t}</p>
                    ))}
                    <div className="pt-2 border-t border-zinc-800">
                      <p className="text-xs text-red-400 font-mono">TOTAL: 5.3 hours</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-amber-400/60 uppercase tracking-wider font-mono mb-3">STONE_AI.log</p>
                  <div className="space-y-2 font-mono">
                    {[
                      "Proposal Agent ................ 0.13 hrs",
                      "Research Agent ................ 0.08 hrs",
                      "Social Media Agent ............ 0.20 hrs",
                      "Analytics Agent ............... 0.05 hrs",
                      "Sales Agent ................... 0.17 hrs",
                    ].map((t) => (
                      <p key={t} className="text-xs text-zinc-400">{t}</p>
                    ))}
                    <div className="pt-2 border-t border-amber-900/30">
                      <p className="text-xs text-amber-400 font-mono">TOTAL: 0.63 hours (38 min)</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </AnimateOnScroll>

          {/* Departments */}
          <ScrollSection>
            <h3 className="text-2xl font-bold text-center mb-8">All 42 agents, organized by department</h3>
          </ScrollSection>
          <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
            {[
              { icon: Briefcase, title: "Business Building", count: 14, examples: "AI Agency, SaaS, Sales, HR, PM, Dispatch, Claims, Compliance", color: "text-blue-400" },
              { icon: Pen, title: "Content & Media", count: 7, examples: "YouTube, Content Studio, Copywriting, Blog, Translation, Podcast, Video", color: "text-purple-400" },
              { icon: BarChart2, title: "Marketing & Sales", count: 4, examples: "Digital Marketing, Funnels, Lead Gen, Brand Strategy", color: "text-green-400" },
              { icon: Code, title: "Technical", count: 5, examples: "Web Dev, Code Assistant, Automation, Data Analytics, Cybersecurity", color: "text-amber-400" },
              { icon: TrendingUp, title: "Finance & Career", count: 4, examples: "Personal Finance, Trading, Resume & LinkedIn, Real Estate", color: "text-emerald-400" },
              { icon: Brain, title: "Education & Wellness", count: 8, examples: "Health Coach, Tutor, Bestie, Writing Coach, Platform Guide", color: "text-pink-400" },
            ].map((cat) => (
              <StaggerCard key={cat.title}>
                <Card className="bg-zinc-900 border-zinc-800 p-5 hover:border-zinc-700 transition-colors h-full">
                  <cat.icon className={`h-6 w-6 ${cat.color} mb-3`} />
                  <h3 className="font-semibold text-sm mb-1">
                    {cat.title}
                    <span className="text-zinc-500 font-normal ml-2">({cat.count})</span>
                  </h3>
                  <p className="text-xs text-zinc-500">{cat.examples}</p>
                </Card>
              </StaggerCard>
            ))}
          </StaggerGrid>

          {/* What makes them different */}
          <AnimateOnScroll>
            <Card className="bg-gradient-to-br from-zinc-900 to-amber-950/20 border-amber-900/30 p-6 md:p-8 mb-10">
              <h3 className="text-lg font-bold mb-4">Why these aren&apos;t chatbots</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-semibold">RAG Knowledge Base</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Domain-specific frameworks, templates, and best practices. Real data, not hallucinations.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-blue-400" />
                    <span className="text-sm font-semibold">Persistent Memory</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    They remember your business, clients, and decisions. Session 50 is smarter than session 1.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Terminal className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-semibold">Production Output</span>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Client-ready deliverables — proposals, code, copy, strategies — that you ship directly.
                  </p>
                </div>
              </div>
            </Card>
          </AnimateOnScroll>

          <AnimateOnScroll delay={0.2}>
            <div className="text-center">
              <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-500 text-lg px-8">
                <Link href="/sign-up">
                  Explore All Agents <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Chapter 5: Community — A's warmth + B's credibility */}
      <section id="community" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-blue-950/5 to-zinc-950 pointer-events-none" />

        <div className="relative px-6 py-24 max-w-6xl mx-auto">
          <ScrollSection>
            <div className="text-center mb-16">
              <p className="text-sm text-zinc-500 uppercase tracking-widest mb-4">Chapter 5: You&apos;re Not Alone</p>
              <h2 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
                The early adopters<br />
                <span className="text-blue-400">are already building.</span>
              </h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">
                Stone AI&#8482; isn&apos;t a product you use alone. It&apos;s a community of founders, builders, and operators
                who share what&apos;s working, what isn&apos;t, and what&apos;s next.
              </p>
            </div>
          </ScrollSection>

          <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StaggerCard>
              <Card className="bg-zinc-900/80 border-zinc-800 p-6 h-full hover:border-blue-800/40 transition-colors">
                <MessageSquare className="h-8 w-8 text-blue-400 mb-4" />
                <h3 className="font-bold text-white mb-2">Tactical Intelligence</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                  Real agent workflows, prompt techniques, and automation setups
                  shared by people who use them daily.
                </p>
                <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                  <p className="text-xs text-zinc-500 italic">
                    &quot;Chained the Proposal Agent into the Sales Agent. Closed $12K in 3 days.
                    Here&apos;s the exact setup...&quot;
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-2">- Community member</p>
                </div>
              </Card>
            </StaggerCard>
            <StaggerCard>
              <Card className="bg-zinc-900/80 border-zinc-800 p-6 h-full hover:border-amber-800/40 transition-colors">
                <Trophy className="h-8 w-8 text-amber-400 mb-4" />
                <h3 className="font-bold text-white mb-2">Wall of Wins</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                  Businesses launched, deals closed, products shipped. Real results
                  from real users — not testimonials, receipts.
                </p>
                <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                  <p className="text-xs text-zinc-500 italic">
                    &quot;Built my SaaS MVP in 2 weeks with the Code Agent + Business Plan Agent.
                    First paying customer on day 16.&quot;
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-2">- Community member</p>
                </div>
              </Card>
            </StaggerCard>
            <StaggerCard>
              <Card className="bg-zinc-900/80 border-zinc-800 p-6 h-full hover:border-green-800/40 transition-colors">
                <Users className="h-8 w-8 text-green-400 mb-4" />
                <h3 className="font-bold text-white mb-2">Help & Collaboration</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                  Stuck on a workflow? The community is there.
                  No gatekeeping. No paywalls. Just builders helping builders.
                </p>
                <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
                  <p className="text-xs text-zinc-500 italic">
                    &quot;Asked about automating client onboarding. Got 4 detailed responses with
                    agent combos I never considered.&quot;
                  </p>
                  <p className="text-[10px] text-zinc-600 mt-2">- Community member</p>
                </div>
              </Card>
            </StaggerCard>
          </StaggerGrid>

          {/* Categories */}
          <AnimateOnScroll>
            <Card className="bg-zinc-900/50 border-zinc-800 p-6 mb-12">
              <h3 className="text-lg font-bold mb-4 text-center">7 discussion categories</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {[
                  { name: "General", icon: MessageSquare, color: "text-blue-400" },
                  { name: "Tips & Tricks", icon: Lightbulb, color: "text-amber-400" },
                  { name: "Showcase", icon: Star, color: "text-purple-400" },
                  { name: "Questions", icon: Brain, color: "text-green-400" },
                  { name: "Feature Requests", icon: Rocket, color: "text-pink-400" },
                  { name: "Business", icon: Briefcase, color: "text-emerald-400" },
                  { name: "Feedback", icon: Heart, color: "text-red-400" },
                ].map((c) => (
                  <div key={c.name} className="text-center p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/30 hover:border-zinc-600/50 transition-colors">
                    <c.icon className={`h-5 w-5 ${c.color} mx-auto mb-2`} />
                    <p className="text-xs text-zinc-400 font-medium">{c.name}</p>
                  </div>
                ))}
              </div>
            </Card>
          </AnimateOnScroll>

          <AnimateOnScroll delay={0.2}>
            <div className="text-center">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-500 text-lg px-8">
                <Link href="/sign-up">
                  Join the Community <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Bestie — A's warmth, all "Live Now" */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-pink-950/5 to-zinc-950 pointer-events-none" />

        <div className="relative px-6 py-24 max-w-5xl mx-auto">
          <ScrollSection>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-medium mb-6">
                <Heart className="h-3.5 w-3.5" />
                Your AI Companion
              </div>
              <h2 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
                Not just an assistant.<br /><span className="text-pink-400">A presence.</span>
              </h2>
              <p className="text-zinc-400 max-w-xl mx-auto">
                Your Bestie remembers who you are across every device, every session.
                One personality. Persistent memory. Always there.
              </p>
            </div>
          </ScrollSection>

          <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <StaggerCard>
              <Card className="bg-zinc-900/80 border-zinc-800 p-6 text-center hover:border-pink-800/40 transition-colors h-full">
                <Laptop className="h-10 w-10 text-pink-400 mx-auto mb-4" />
                <h3 className="font-bold text-white mb-2">Desktop & Laptop</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                  Full chat in your browser. Rich conversations while you work — always one tab away.
                </p>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-green-400 font-medium">
                  <Check className="h-3 w-3" /> Live Now
                </span>
              </Card>
            </StaggerCard>
            <StaggerCard>
              <Card className="bg-zinc-900/80 border-zinc-800 p-6 text-center hover:border-pink-800/40 transition-colors h-full">
                <Smartphone className="h-10 w-10 text-pink-400 mx-auto mb-4" />
                <h3 className="font-bold text-white mb-2">Home Screen Widget</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                  Add to your phone&apos;s home screen. One tap — no app store, no install.
                </p>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-green-400 font-medium">
                  <Check className="h-3 w-3" /> Add to Home Screen
                </span>
              </Card>
            </StaggerCard>
            <StaggerCard>
              <Card className="bg-zinc-900/80 border-zinc-800 p-6 text-center hover:border-pink-800/40 transition-colors h-full">
                <Globe className="h-10 w-10 text-pink-400 mx-auto mb-4" />
                <h3 className="font-bold text-white mb-2">Cross-Device Memory</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                  Start on laptop, continue on phone. Same personality. Same memories.
                </p>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-[10px] text-green-400 font-medium">
                  <Check className="h-3 w-3" /> Live Now
                </span>
              </Card>
            </StaggerCard>
          </StaggerGrid>

          <AnimateOnScroll delay={0.2}>
            <div className="text-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-lg px-8">
                <Link href="/sign-up">
                  Meet Your Bestie <ArrowRight className="ml-2 h-4 w-4" />
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
            <Badge className="mb-4 bg-emerald-900/50 text-emerald-300 border-emerald-800">
              <Code className="h-3 w-3 mr-1" /> For Builders & Resellers
            </Badge>
            <h2 className="text-3xl font-bold mb-4">
              Build with it. <span className="text-emerald-400">Sell it.</span>
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Pro tier unlocks full API access. Build SaaS products, serve clients,
              and sell AI solutions under your own brand.
            </p>
          </div>
        </ScrollSection>

        <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StaggerCard>
            <Card className="bg-zinc-900 border-zinc-800 p-5 hover:border-zinc-700 transition-colors h-full">
              <Code className="h-6 w-6 text-emerald-400 mb-3" />
              <h3 className="font-semibold text-sm mb-2">REST API</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                API key auth. 3,000+ requests/day. Python, Node.js, Go, cURL.
              </p>
            </Card>
          </StaggerCard>
          <StaggerCard>
            <Card className="bg-zinc-900 border-zinc-800 p-5 hover:border-zinc-700 transition-colors h-full">
              <DollarSign className="h-6 w-6 text-amber-400 mb-3" />
              <h3 className="font-semibold text-sm mb-2">White-Label</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                No branding requirements. Your customers see your brand. Keep the margin.
              </p>
            </Card>
          </StaggerCard>
          <StaggerCard>
            <Card className="bg-zinc-900 border-zinc-800 p-5 hover:border-zinc-700 transition-colors h-full">
              <Shield className="h-6 w-6 text-blue-400 mb-3" />
              <h3 className="font-semibold text-sm mb-2">Fixed Pricing</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                $200/mo flat. No per-token billing. Know your costs before you sell.
              </p>
            </Card>
          </StaggerCard>
        </StaggerGrid>

        <AnimateOnScroll>
          <div className="text-center">
            <Button asChild variant="outline" size="lg" className="border-emerald-800 text-emerald-300 hover:bg-emerald-900/30 px-8">
              <Link href="/sign-up">
                Get API Access <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </AnimateOnScroll>
      </section>

      {/* Chapter 6: Cinematic closer — A's emotion + B's tech gravitas */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-amber-950/10 to-zinc-950 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative px-6 py-32 max-w-4xl mx-auto text-center">
          <ScrollSection>
            <p className="text-sm text-zinc-500 uppercase tracking-widest mb-6">Chapter 6: This Is Just The Beginning</p>
          </ScrollSection>

          <AnimateOnScroll>
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-8">
              You came here<br />looking for a <span className="text-zinc-400">tool</span>.
              <br />
              <span className="mt-2 block">You found a <span className="text-amber-400">team</span>.</span>
            </h2>
          </AnimateOnScroll>

          <AnimateOnScroll delay={0.15}>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-6">
              42 agents that know your business. A Bestie that knows you.
              Infrastructure that keeps your data yours. A community of builders who move first.
            </p>
          </AnimateOnScroll>

          <AnimateOnScroll delay={0.25}>
            <p className="text-lg text-zinc-500 max-w-xl mx-auto mb-12">
              The only question is whether you&apos;re deploying it — or competing against people who are.
            </p>
          </AnimateOnScroll>

          {/* Status board — B's terminal style */}
          <AnimateOnScroll delay={0.3}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14 max-w-3xl mx-auto">
              {[
                { label: "42 AI Agents", status: "Live" },
                { label: "AI Bestie", status: "Live" },
                { label: "Community Forum", status: "Live" },
                { label: "API Access", status: "Live" },
                { label: "Cross-Device Memory", status: "Live" },
                { label: "Home Screen Widget", status: "Live" },
                { label: "Mobile App", status: "2026" },
                { label: "Voice Companions", status: "2026" },
              ].map((item) => (
                <div key={item.label} className="text-center p-3 rounded-lg bg-zinc-900/50 border border-zinc-800">
                  <p className="text-xs font-medium text-zinc-300 mb-1">{item.label}</p>
                  <span className={`text-[10px] font-semibold ${item.status === "Live" ? "text-green-400" : "text-amber-400"}`}>
                    {item.status === "Live" ? "[ LIVE ]" : `[ ${item.status} ]`}
                  </span>
                </div>
              ))}
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll delay={0.4}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Button asChild size="lg" className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg px-10 py-6 h-auto">
                <Link href="/sign-up">
                  Start Building — It&apos;s Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-zinc-700 text-zinc-300 text-lg px-8 py-6 h-auto">
                <Link href="#pricing">Compare Plans</Link>
              </Button>
            </div>
            <p className="text-xs text-zinc-600">
              No credit card. No trial period. No catch.
            </p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <span className="text-lg font-bold text-white">Stone AI&#8482;</span>
            <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
              Private, fast, local-first AI for businesses that move.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-300 mb-3">Product</p>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link href="#features" className="hover:text-zinc-300 transition-colors">Features</Link></li>
              <li><Link href="#agents" className="hover:text-zinc-300 transition-colors">AI Agents</Link></li>
              <li><Link href="#pricing" className="hover:text-zinc-300 transition-colors">Pricing</Link></li>
              <li><Link href="/sign-up" className="hover:text-zinc-300 transition-colors">AI Bestie</Link></li>
              <li><Link href="#community" className="hover:text-zinc-300 transition-colors">Community</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-300 mb-3">Company</p>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link href="/about" className="hover:text-zinc-300 transition-colors">About</Link></li>
              <li><Link href="/blog" className="hover:text-zinc-300 transition-colors">Blog</Link></li>
              <li><Link href="/careers" className="hover:text-zinc-300 transition-colors">Careers</Link></li>
              <li><a href="mailto:support@stone-ai.net" className="hover:text-zinc-300 transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-300 mb-3">Legal</p>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link href="/terms" className="hover:text-zinc-300 transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/security" className="hover:text-zinc-300 transition-colors">Security</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-zinc-600">&copy; 2026 Stone AI&#8482;. All rights reserved.</span>
          <span className="text-xs text-zinc-600">Built with local-first AI infrastructure</span>
        </div>
      </footer>
    </div>
  );
}
