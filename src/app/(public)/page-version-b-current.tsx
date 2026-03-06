import Link from "next/link";
import {
  Zap,
  Brain,
  Shield,
  ArrowRight,
  Check,
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
  Smartphone,
  Laptop,
  Globe,
  Heart,
  Lightbulb,
  Trophy,
  Sparkles,
  Star,
  Network,
  Terminal,
  Mic,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PricingSection } from "./pricing-section";
import { LandingTabs } from "./landing-tabs";
import {
  HeroSection,
  ScrollSection,
  StaggerGrid,
  StaggerCard,
  AnimateOnScroll,
} from "./animated-sections";


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-900 text-white scroll-smooth">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-4 max-w-6xl mx-auto">
        <span className="text-xl font-bold tracking-tight">Stone AI&#8482;</span>
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:inline">
            Pricing
          </Link>
          <Link href="/sign-in" className="text-sm text-zinc-400 hover:text-white transition-colors">
            Sign In
          </Link>
          <Button asChild size="sm" className="bg-white text-black hover:bg-zinc-200 font-semibold">
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════
          Hero — Clean, Tesla-inspired, premium feel
         ═══════════════════════════════════════════════════════════════ */}
      <section className="relative px-4 sm:px-6 pt-16 sm:pt-24 pb-16 max-w-5xl mx-auto text-center overflow-hidden">
        {/* Subtle ambient light */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full blur-[100px] pointer-events-none" />

        <HeroSection>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            The workforce of the
            <br />
            <span className="bg-gradient-to-r from-zinc-300 via-white to-zinc-300 bg-clip-text text-transparent">
              future is here.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-4 leading-relaxed">
            42 AI specialists. Local GPU inference. Your data stays yours.
          </p>
          <p className="text-base text-zinc-500 max-w-md mx-auto mb-10">
            One platform. Instant responses. Starting at $0.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg" className="bg-white text-black hover:bg-zinc-200 font-bold text-lg px-8">
              <Link href="/sign-up">
                Start for Free <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-zinc-700 text-zinc-300 text-lg px-8 hover:bg-zinc-800"
            >
              <Link href="#pricing">See Plans</Link>
            </Button>
          </div>
        </HeroSection>
      </section>

      {/* Performance strip — clean horizontal stats */}
      <section className="px-4 sm:px-6 pb-12 max-w-4xl mx-auto">
        <StaggerGrid className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { value: "<100ms", label: "Response time", sub: "Local mode" },
            { value: "70B", label: "Parameters", sub: "Open-weight model" },
            { value: "$0", label: "Local messages", sub: "Unlimited" },
            { value: "42", label: "AI specialists", sub: "Every department" },
          ].map((s) => (
            <StaggerCard key={s.label}>
              <div className="text-center p-4 sm:p-5 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                <p className="text-2xl sm:text-3xl font-bold text-white">{s.value}</p>
                <p className="text-xs text-zinc-400 mt-1">{s.label}</p>
                <p className="text-[10px] text-zinc-600">{s.sub}</p>
              </div>
            </StaggerCard>
          ))}
        </StaggerGrid>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          Tabbed Content — Each section covers ONE topic
         ═══════════════════════════════════════════════════════════════ */}
      <LandingTabs
        tabs={[
          { id: "how", label: "How It Works", icon: <Cpu className="h-4 w-4" /> },
          { id: "agents", label: "AI Agents", icon: <Bot className="h-4 w-4" /> },
          { id: "bestie", label: "My Bestie", icon: <Heart className="h-4 w-4" /> },
          { id: "time", label: "Time Saved", icon: <Clock className="h-4 w-4" /> },
          { id: "community", label: "Community", icon: <Users className="h-4 w-4" /> },
          { id: "builders", label: "For Builders", icon: <Code className="h-4 w-4" /> },
        ]}
      >
        {/* ──────── TAB 1: How It Works ──────── */}
        <div className="px-4 sm:px-6 py-12 sm:py-20 max-w-5xl mx-auto">
          <ScrollSection>
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
              Two engines. <span className="text-zinc-400">You choose.</span>
            </h2>
            <p className="text-center text-zinc-400 mb-12 max-w-lg mx-auto">
              Local mode runs on our GPU — fast, free, and private.
              Smart mode adds GPT-4o when you need it — opt-in, clearly labeled.
            </p>
          </ScrollSection>

          {/* Architecture comparison — clean, not terminal red */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            <AnimateOnScroll>
              <Card className="bg-zinc-800/50 border-zinc-700/50 p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-zinc-700/50 flex items-center justify-center">
                    <Cpu className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Stone Engine (Local)</p>
                    <p className="text-xs text-zinc-500">Default on all tiers</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-zinc-300">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Sub-100ms response time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Data never leaves your network</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Unlimited messages (no per-token cost)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>70B parameter open-weight model</span>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-zinc-700/30">
                  <p className="text-xs text-zinc-400">Best for: everyday work, sensitive data, unlimited usage</p>
                </div>
              </Card>
            </AnimateOnScroll>

            <AnimateOnScroll delay={0.1}>
              <Card className="bg-zinc-800/50 border-zinc-700/50 p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-blue-900/30 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Smart Mode (Cloud)</p>
                    <p className="text-xs text-zinc-500">Opt-in on Builder+ tiers</p>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-zinc-300">
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>GPT-4o for complex reasoning</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>Data sent to OpenAI (you opt in per message)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>Daily cap protects your budget</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>Credit packs for extra when you need it</span>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-blue-900/10 border border-blue-800/20">
                  <p className="text-xs text-zinc-400">Best for: complex analysis, creative tasks, cutting-edge reasoning</p>
                </div>
              </Card>
            </AnimateOnScroll>
          </div>

          {/* 3 steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: "1", title: "Sign up free", desc: "No credit card. Instant access to 4 agents and unlimited local AI." },
              { step: "2", title: "Chat locally", desc: "Messages go to our GPU. Sub-100ms responses. Your data stays private." },
              { step: "3", title: "Add Smart mode", desc: "Upgrade to unlock GPT-4o, more agents, and cloud AI when you choose." },
            ].map((s) => (
              <AnimateOnScroll key={s.step} delay={Number(s.step) * 0.1}>
                <div className="rounded-xl bg-zinc-800/30 border border-zinc-700/30 p-5">
                  <span className="text-3xl font-bold text-zinc-700">{s.step}</span>
                  <h3 className="font-bold text-white mt-2 mb-1">{s.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{s.desc}</p>
                </div>
              </AnimateOnScroll>
            ))}
          </div>

          {/* Enterprise callout */}
          <AnimateOnScroll delay={0.3}>
            <Card className="bg-zinc-800/30 border-zinc-700/30 p-6 sm:p-8 mt-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex-1">
                  <Badge className="mb-2 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">Enterprise</Badge>
                  <h3 className="text-xl font-bold mb-1">Regulated industries welcome</h3>
                  <p className="text-sm text-zinc-400">
                    Local mode keeps sensitive data on-network by default. Smart mode is opt-in — you
                    control exactly when and if data touches the cloud.
                  </p>
                </div>
                <Button asChild variant="outline" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 shrink-0">
                  <Link href="/sign-up">Contact Sales</Link>
                </Button>
              </div>
            </Card>
          </AnimateOnScroll>
        </div>

        {/* ──────── TAB 2: AI Agents ──────── */}
        <div className="px-4 sm:px-6 py-12 sm:py-20 max-w-6xl mx-auto">
          <ScrollSection>
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
              42 specialists. <span className="text-zinc-400">Zero salaries.</span>
            </h2>
            <p className="text-center text-zinc-400 mb-12 max-w-2xl mx-auto">
              Each agent is a domain expert with persistent memory and industry frameworks.
              They produce client-ready deliverables — not generic AI output.
            </p>
          </ScrollSection>

          {/* Scenario: Business launch */}
          <AnimateOnScroll>
            <Card className="bg-zinc-800/30 border-zinc-700/30 p-6 sm:p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Rocket className="h-6 w-6 text-white" />
                <div>
                  <h3 className="text-lg font-bold">Launch a business this week</h3>
                  <p className="text-sm text-zinc-500">5 agents, 5 days, revenue-ready</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { day: "Mon", agent: "Startup Launcher", task: "Validate & plan" },
                  { day: "Tue", agent: "Business Plan", task: "Financials & model" },
                  { day: "Wed", agent: "Brand Agent", task: "Name & identity" },
                  { day: "Thu", agent: "Web Dev", task: "Landing page" },
                  { day: "Fri", agent: "Marketing", task: "Ads & funnels" },
                ].map((s) => (
                  <div key={s.day} className="rounded-lg bg-zinc-700/30 p-3 sm:p-4">
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">{s.day}</span>
                    <p className="text-sm font-semibold text-white mt-1">{s.agent}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{s.task}</p>
                  </div>
                ))}
              </div>
            </Card>
          </AnimateOnScroll>

          {/* One input, 12 outputs */}
          <AnimateOnScroll delay={0.1}>
            <Card className="bg-zinc-800/30 border-zinc-700/30 p-6 sm:p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <Network className="h-6 w-6 text-white" />
                <div>
                  <h3 className="text-lg font-bold">One idea, twelve deliverables</h3>
                  <p className="text-sm text-zinc-500">Agents build on each other&apos;s output</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                {[
                  "Blog series", "Email sequence", "30 days posts", "Video script",
                  "Keyword strategy", "Ad campaigns", "Landing pages", "Episode outline",
                  "Outreach emails", "Dashboard", "3 languages", "Client deck",
                ].map((output) => (
                  <div key={output} className="rounded-lg bg-zinc-700/20 p-3 text-center border border-zinc-700/30">
                    <p className="text-xs text-zinc-300 font-medium">{output}</p>
                  </div>
                ))}
              </div>
            </Card>
          </AnimateOnScroll>

          {/* Departments */}
          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            {[
              { icon: Briefcase, title: "Business Building", count: 14, examples: "AI Agency, SaaS, Sales, HR, PM, Dispatch, Claims", color: "text-blue-400" },
              { icon: Pen, title: "Content & Media", count: 7, examples: "YouTube, Content Studio, Copywriting, Blog, Podcast", color: "text-purple-400" },
              { icon: BarChart2, title: "Marketing & Sales", count: 4, examples: "Digital Marketing, Funnels, Lead Gen, Brand", color: "text-green-400" },
              { icon: Code, title: "Technical", count: 5, examples: "Web Dev, Code Assistant, Automation, Analytics", color: "text-amber-400" },
              { icon: TrendingUp, title: "Finance & Career", count: 4, examples: "Personal Finance, Trading, Resume, Real Estate", color: "text-emerald-400" },
              { icon: Brain, title: "Education & Wellness", count: 8, examples: "Health Coach, Tutor, Writing Coach, Guide", color: "text-pink-400" },
            ].map((cat) => (
              <StaggerCard key={cat.title}>
                <div className="rounded-xl bg-zinc-800/30 border border-zinc-700/30 p-4 h-full">
                  <cat.icon className={`h-5 w-5 ${cat.color} mb-2`} />
                  <h3 className="font-semibold text-sm mb-1">
                    {cat.title} <span className="text-zinc-600">({cat.count})</span>
                  </h3>
                  <p className="text-xs text-zinc-500">{cat.examples}</p>
                </div>
              </StaggerCard>
            ))}
          </StaggerGrid>

          {/* What makes them different — compact */}
          <AnimateOnScroll>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Zap, title: "RAG Knowledge", desc: "Domain-specific frameworks and real data — not hallucinations.", color: "text-amber-400" },
                { icon: Brain, title: "Persistent Memory", desc: "They remember your business. Session 50 is smarter than session 1.", color: "text-blue-400" },
                { icon: Terminal, title: "Production Output", desc: "Client-ready deliverables you can ship or sell directly.", color: "text-green-400" },
              ].map((item) => (
                <div key={item.title} className="rounded-xl bg-zinc-800/30 border border-zinc-700/30 p-4">
                  <item.icon className={`h-5 w-5 ${item.color} mb-2`} />
                  <h4 className="text-sm font-semibold mb-1">{item.title}</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </AnimateOnScroll>
        </div>

        {/* ──────── TAB 3: My Bestie ──────── */}
        <div className="px-4 sm:px-6 py-12 sm:py-20 max-w-5xl mx-auto">
          <ScrollSection>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-medium mb-6">
                <Heart className="h-3.5 w-3.5" />
                AI Companion
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Not an assistant. <span className="text-pink-400">A presence.</span>
              </h2>
              <p className="text-zinc-400 max-w-xl mx-auto">
                Your Bestie is a personal AI companion that remembers who you are — your personality,
                your life, your preferences. Every device. Every session.
              </p>
            </div>
          </ScrollSection>

          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { icon: Laptop, title: "Desktop & Laptop", desc: "Full chat experience in your browser — always one tab away.", status: "Live" },
              { icon: Smartphone, title: "Home Screen", desc: "Add to your phone's home screen. One tap, no app store.", status: "Live" },
              { icon: Globe, title: "Cross-Device Memory", desc: "Start on laptop, continue on phone. Same memories.", status: "Live" },
              { icon: Mic, title: "Voice Chat", desc: "Talk to your Bestie. Built on Web Speech API — no extra app needed.", status: "Coming Soon" },
            ].map((item) => (
              <StaggerCard key={item.title}>
                <Card className="bg-zinc-800/30 border-zinc-700/30 p-5 text-center h-full hover:border-pink-500/20 transition-colors">
                  <item.icon className="h-8 w-8 text-pink-400 mx-auto mb-3" />
                  <h3 className="font-bold text-white text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-3">{item.desc}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium ${
                    item.status === "Live"
                      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                      : "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                  }`}>
                    {item.status === "Live" ? <Check className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {item.status}
                  </span>
                </Card>
              </StaggerCard>
            ))}
          </StaggerGrid>

          <AnimateOnScroll>
            <div className="text-center">
              <p className="text-sm text-zinc-500 mb-4">
                Create yours in 3 steps. Choose a personality, pick a name, start talking.
              </p>
              <Button asChild size="lg" className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-lg px-8 font-semibold">
                <Link href="/sign-up">
                  Meet Your Bestie <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </AnimateOnScroll>
        </div>

        {/* ──────── TAB 4: Time Saved ──────── */}
        <div className="px-4 sm:px-6 py-12 sm:py-20 max-w-5xl mx-auto">
          <ScrollSection>
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
              Your Monday. <span className="text-zinc-400">Reimagined.</span>
            </h2>
            <p className="text-center text-zinc-400 mb-12 max-w-lg mx-auto">
              The same tasks. A fraction of the time. Here&apos;s what changes
              when 42 specialists handle the heavy lifting.
            </p>
          </ScrollSection>

          <AnimateOnScroll>
            <Card className="bg-zinc-800/30 border-zinc-700/30 p-6 sm:p-8 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Before */}
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-4">Without Stone AI</p>
                  <div className="space-y-3">
                    {[
                      { task: "Client proposal", time: "2.0 hours" },
                      { task: "Competitor research", time: "45 min" },
                      { task: "Social media content", time: "1 hour" },
                      { task: "Report formatting", time: "30 min" },
                      { task: "Email follow-ups", time: "1 hour" },
                    ].map((t) => (
                      <div key={t.task} className="flex items-center justify-between py-2 border-b border-zinc-700/30">
                        <span className="text-sm text-zinc-400">{t.task}</span>
                        <span className="text-sm text-zinc-500 font-mono">{t.time}</span>
                      </div>
                    ))}
                    <div className="pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-zinc-300">Total</span>
                        <span className="text-sm font-bold text-zinc-300 font-mono">~5.25 hours</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* After */}
                <div>
                  <p className="text-xs text-emerald-400 uppercase tracking-wider font-semibold mb-4">With Stone AI</p>
                  <div className="space-y-3">
                    {[
                      { task: "Proposal Agent", time: "8 min" },
                      { task: "Research Agent", time: "5 min" },
                      { task: "Social Media Agent", time: "12 min" },
                      { task: "Analytics Agent", time: "3 min" },
                      { task: "Sales Agent", time: "10 min" },
                    ].map((t) => (
                      <div key={t.task} className="flex items-center justify-between py-2 border-b border-emerald-500/10">
                        <span className="text-sm text-zinc-300">{t.task}</span>
                        <span className="text-sm text-emerald-400 font-mono font-semibold">{t.time}</span>
                      </div>
                    ))}
                    <div className="pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">Total</span>
                        <span className="text-sm font-bold text-emerald-400 font-mono">38 minutes</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </AnimateOnScroll>

          {/* Impact summary */}
          <StaggerGrid className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: "88%", label: "Time saved", sub: "on routine tasks" },
              { value: "42", label: "Specialists", sub: "across departments" },
              { value: "$0", label: "Local cost", sub: "per message" },
              { value: "24/7", label: "Available", sub: "no sick days" },
            ].map((s) => (
              <StaggerCard key={s.label}>
                <div className="text-center p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/30">
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-zinc-400 mt-1">{s.label}</p>
                  <p className="text-[10px] text-zinc-600">{s.sub}</p>
                </div>
              </StaggerCard>
            ))}
          </StaggerGrid>
        </div>

        {/* ──────── TAB 5: Community ──────── */}
        <div className="px-4 sm:px-6 py-12 sm:py-20 max-w-6xl mx-auto">
          <ScrollSection>
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
              The builders are <span className="text-zinc-400">already here.</span>
            </h2>
            <p className="text-center text-zinc-400 mb-12 max-w-2xl mx-auto">
              Founders, freelancers, and operators sharing what works.
              Real strategies from real users — no fluff.
            </p>
          </ScrollSection>

          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <StaggerCard>
              <Card className="bg-zinc-800/30 border-zinc-700/30 p-5 h-full">
                <MessageSquare className="h-6 w-6 text-blue-400 mb-3" />
                <h3 className="font-bold text-sm mb-2">Agent Strategies</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                  Prompt templates, workflow combos, and agent setups from daily users.
                </p>
                <div className="bg-zinc-700/20 rounded-lg p-3 border border-zinc-700/30">
                  <p className="text-xs text-zinc-500 italic">
                    &quot;Chained Proposal + Sales Agent. Closed $12K in 3 days.&quot;
                  </p>
                </div>
              </Card>
            </StaggerCard>
            <StaggerCard>
              <Card className="bg-zinc-800/30 border-zinc-700/30 p-5 h-full">
                <Trophy className="h-6 w-6 text-amber-400 mb-3" />
                <h3 className="font-bold text-sm mb-2">Wall of Wins</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                  Businesses launched, deals closed, products shipped. Real results.
                </p>
                <div className="bg-zinc-700/20 rounded-lg p-3 border border-zinc-700/30">
                  <p className="text-xs text-zinc-500 italic">
                    &quot;Built my SaaS MVP in 2 weeks. First customer on day 16.&quot;
                  </p>
                </div>
              </Card>
            </StaggerCard>
            <StaggerCard>
              <Card className="bg-zinc-800/30 border-zinc-700/30 p-5 h-full">
                <Users className="h-6 w-6 text-green-400 mb-3" />
                <h3 className="font-bold text-sm mb-2">Open Help</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                  No gatekeeping. Ask a question, get answers from people who&apos;ve done it.
                </p>
                <div className="bg-zinc-700/20 rounded-lg p-3 border border-zinc-700/30">
                  <p className="text-xs text-zinc-500 italic">
                    &quot;Asked about onboarding automation. Got 4 detailed agent combos.&quot;
                  </p>
                </div>
              </Card>
            </StaggerCard>
          </StaggerGrid>

          {/* Category bar — user loved this */}
          <AnimateOnScroll>
            <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 mb-8">
              {[
                { name: "General", icon: MessageSquare, color: "text-blue-400" },
                { name: "Tips", icon: Lightbulb, color: "text-amber-400" },
                { name: "Showcase", icon: Star, color: "text-purple-400" },
                { name: "Questions", icon: Brain, color: "text-green-400" },
                { name: "Features", icon: Rocket, color: "text-pink-400" },
                { name: "Business", icon: Briefcase, color: "text-emerald-400" },
                { name: "Feedback", icon: Heart, color: "text-red-400" },
              ].map((c) => (
                <div key={c.name} className="text-center p-2.5 rounded-lg bg-zinc-800/30 border border-zinc-700/30 hover:border-zinc-600/50 transition-colors">
                  <c.icon className={`h-4 w-4 ${c.color} mx-auto mb-1`} />
                  <p className="text-[11px] text-zinc-400 font-medium">{c.name}</p>
                </div>
              ))}
            </div>
          </AnimateOnScroll>

          <div className="text-center">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-500 text-lg px-8">
              <Link href="/sign-up">
                Join the Community <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* ──────── TAB 6: For Builders ──────── */}
        <div className="px-4 sm:px-6 py-12 sm:py-20 max-w-5xl mx-auto">
          <ScrollSection>
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
              Build with it. <span className="text-emerald-400">Sell it.</span>
            </h2>
            <p className="text-center text-zinc-400 mb-12 max-w-2xl mx-auto">
              Pro tier unlocks full REST API access. Build SaaS products, serve clients,
              and sell AI solutions under your own brand.
            </p>
          </ScrollSection>

          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: Terminal, title: "REST API", desc: "Simple key auth. 3,000+ requests/day. Any language.", color: "text-emerald-400" },
              { icon: Shield, title: "White-Label", desc: "No 'Powered by' requirement. Your brand, your pricing.", color: "text-amber-400" },
              { icon: Target, title: "$200/mo Flat", desc: "No per-token billing. No overage charges. Predictable costs.", color: "text-blue-400" },
            ].map((item) => (
              <StaggerCard key={item.title}>
                <div className="rounded-xl bg-zinc-800/30 border border-zinc-700/30 p-5 h-full">
                  <item.icon className={`h-6 w-6 ${item.color} mb-3`} />
                  <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{item.desc}</p>
                </div>
              </StaggerCard>
            ))}
          </StaggerGrid>

          <div className="text-center">
            <Button asChild variant="outline" size="lg" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 px-8">
              <Link href="/sign-up">
                Get API Access <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </LandingTabs>

      {/* ═══════════════════════════════════════════════════════════════
          Pricing — outside tabs, always visible
         ═══════════════════════════════════════════════════════════════ */}
      <PricingSection />

      {/* ═══════════════════════════════════════════════════════════════
          Closer — Cinematic finale
         ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900 via-zinc-800/50 to-zinc-900 pointer-events-none" />

        <div className="relative px-4 sm:px-6 py-20 sm:py-32 max-w-4xl mx-auto text-center">
          <AnimateOnScroll>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              You came here looking<br />for a tool.
              <br />
              <span className="text-zinc-400 mt-2 block">You found a team.</span>
            </h2>
          </AnimateOnScroll>

          <AnimateOnScroll delay={0.15}>
            <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
              42 agents. A companion that knows you. A community that has your back.
              And it starts at $0.
            </p>
          </AnimateOnScroll>

          {/* Status board */}
          <AnimateOnScroll delay={0.25}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12 max-w-2xl mx-auto">
              {[
                { label: "42 AI Agents", live: true },
                { label: "AI Bestie", live: true },
                { label: "Community", live: true },
                { label: "API Access", live: true },
                { label: "Cross-Device Sync", live: true },
                { label: "Home Screen Widget", live: true },
                { label: "Voice Chat", live: false },
                { label: "Mobile App", live: false },
              ].map((item) => (
                <div key={item.label} className="text-center p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/30">
                  <p className="text-xs font-medium text-zinc-300 mb-1">{item.label}</p>
                  <span className={`text-[10px] font-semibold ${item.live ? "text-emerald-400" : "text-amber-400"}`}>
                    {item.live ? "Live" : "Coming Soon"}
                  </span>
                </div>
              ))}
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll delay={0.35}>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-4">
              <Button asChild size="lg" className="bg-white text-black hover:bg-zinc-200 font-bold text-lg px-10 py-6 h-auto">
                <Link href="/sign-up">
                  Start Building — Free <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-zinc-700 text-zinc-300 text-lg px-8 py-6 h-auto">
                <Link href="#pricing">Compare Plans</Link>
              </Button>
            </div>
            <p className="text-xs text-zinc-600">No credit card. No trial. No catch.</p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <span className="text-lg font-bold">Stone AI&#8482;</span>
            <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
              Local-first AI for businesses that move.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-300 mb-3">Product</p>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link href="/sign-up" className="hover:text-white transition-colors">AI Agents</Link></li>
              <li><Link href="/sign-up" className="hover:text-white transition-colors">AI Bestie</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/sign-up" className="hover:text-white transition-colors">Community</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-300 mb-3">Company</p>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="mailto:support@stone-ai.net" className="hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-300 mb-3">Legal</p>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
              <li><Link href="/security" className="hover:text-white transition-colors">Security</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-zinc-600">&copy; 2026 Stone AI&#8482;. All rights reserved.</span>
          <span className="text-xs text-zinc-600">Local-first AI infrastructure</span>
        </div>
      </footer>
    </div>
  );
}
