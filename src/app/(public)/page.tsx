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
import { Insignia } from "@/components/brand/Insignia";
import { PricingSection } from "./pricing-section";
import { LandingTabs } from "./landing-tabs";
import { LandingLanguageToggle } from "./landing-language-toggle";
import {
  HeroSection,
  ScrollSection,
  StaggerGrid,
  StaggerCard,
  AnimateOnScroll,
} from "./animated-sections";


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-900 text-white scroll-smooth relative">
      {/* ── Themed backdrop: dot grid + radial glows + noise ── */}
      <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
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
        {/* Mid-page glow — warm amber (aligns with Bestie section) */}
        <div className="absolute top-[45%] right-[-10%] w-[600px] h-[600px] rounded-full bg-amber-500/[0.03] blur-[150px]" />
        {/* Bottom glow — subtle purple (pricing/closer area) */}
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
      {/* Insignia — centered */}
      <div className="flex justify-center pt-8 pb-4">
        <Insignia size={18} />
      </div>

      {/* Nav */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-3 max-w-6xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-bold text-white hover:text-zinc-200 transition-colors tracking-wide">
            Stone AI
          </Link>
          <LandingLanguageToggle />
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          <Link href="#promotions" className="text-sm text-zinc-400 hover:text-white transition-colors hidden sm:inline">
            Deals
          </Link>
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

        <HeroSection>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
            The workforce of the
            <br />
            <span className="bg-gradient-to-r from-zinc-300 via-white to-zinc-300 bg-clip-text text-transparent">
              future is here.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-4 leading-relaxed">
            43 AI specialists that think so you don't have to. Your data stays yours.
          </p>
          <p className="text-base text-zinc-500 max-w-md mx-auto mb-6">
            One platform. Instant responses. Starting at $0.
          </p>

          {/* Promo callout */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-medium animate-pulse">
              <Sparkles className="h-4 w-4" />
              Launch Deals: Start at $9.99/mo
            </div>
          </div>

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
            { value: "43", label: "AI thinkers", sub: "So you don't have to" },
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
              Local mode answers before you finish reading the question — fast, free, and completely private.
              Smart mode brings in GPT-4o when you hit something complex — you choose when, every time.
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
                    <span>Answers in under 100ms — faster than switching to a Google tab</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Your financials, client names, and strategy stay on our servers — never shared</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Unlimited messages — no surprise bill at the end of the month</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>70B parameter model — the same class of AI that powers enterprise tools</span>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-zinc-700/30">
                  <p className="text-xs text-zinc-400">Best for: daily brainstorming, sensitive client work, running up the score without watching the meter</p>
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
                    <span>GPT-4o for the questions that stump everything else — contracts, analysis, strategy</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>You choose per message — cloud only fires when you pull the trigger</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>Daily cap means no runaway costs — your budget stays exactly where you set it</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-blue-400 shrink-0" />
                    <span>Credit packs for crunch time — big pitch week, product launch, tax season</span>
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-blue-900/10 border border-blue-800/20">
                  <p className="text-xs text-zinc-400">Best for: investor decks, legal reviews, competitive analysis, anything that needs the sharpest mind in the room</p>
                </div>
              </Card>
            </AnimateOnScroll>
          </div>

          {/* 3 steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: "1", title: "Sign up free", desc: "Google, Apple, Outlook, Yahoo — pick your login. No credit card, no forms. You're chatting with 4 AI agents before your coffee gets cold." },
              { step: "2", title: "Chat locally", desc: "Ask anything — the agent thinks through angles, weighs options, and delivers the answer before you finish the thought. Your data never leaves our network." },
              { step: "3", title: "Add Smart mode", desc: "Hit a wall? Flip on GPT-4o for the heavy stuff. You pick when. You control the cost." },
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
                  <h3 className="text-xl font-bold mb-1">Healthcare, finance, legal — we built for you</h3>
                  <p className="text-sm text-zinc-400">
                    Patient records, financial models, case files — they stay on our network by default.
                    Cloud mode only activates when you say so. Your compliance team will love the audit trail.
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
              43 specialists. <span className="text-zinc-400">Zero salaries.</span>
            </h2>
            <p className="text-center text-zinc-400 mb-4 max-w-2xl mx-auto">
              Imagine walking into an office where every desk is staffed — marketing, legal, finance,
              dev, HR, sales — and they already know your business. That's what this feels like.
            </p>
            <p className="text-center text-emerald-400/80 text-sm mb-12 max-w-lg mx-auto">
              Most of this runs on local AI — so you're getting pro-level output without paying per question.
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Zap, title: "Deep Reasoning", desc: "Each agent doesn't just retrieve info — it thinks in your domain. Financial Agent reasons in cashflow models. Marketing Agent thinks in conversion funnels. You get expert analysis, not generic guesses.", color: "text-amber-400" },
                { icon: Clock, title: "Saves Thinking Time", desc: "The hardest part isn't typing — it's figuring out what to say. Our agents handle strategy, angle selection, prioritization, and analysis. You just review and ship.", color: "text-cyan-400" },
                { icon: Brain, title: "Persistent Memory", desc: "Tell your Marketing Agent your brand voice once. Three months later, it still nails the tone. Tell your Bestie your goals — she remembers months later. No re-explaining, ever.", color: "text-blue-400" },
                { icon: Terminal, title: "Production Output", desc: "Proposals, contracts, ad copy, code — hand it to the client or ship it to production. Done.", color: "text-green-400" },
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
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-6">
                <Heart className="h-3.5 w-3.5" />
                AI Right Hand
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Not a chatbot. <span className="text-amber-400">Up to 43 experts in one best friend.</span>
              </h2>
              <p className="text-zinc-400 max-w-xl mx-auto mb-3">
                Powered by up to 43 specialized AI agents — career strategist,
                financial advisor, fitness coach, creative director, and more. Your Bestie{`'`}s knowledge scales with your plan —
                from 4 expert agents on Free to the full roster of 43 on Executive. Upgrade your plan, upgrade your Bestie{`'`}s brain.
              </p>
              <p className="text-zinc-500 max-w-lg mx-auto text-sm">
                Pick 2 communication styles and she blends them into someone uniquely yours.
                Casual + intellectual? She texts like a smart friend. Hype + blunt? An energized straight-shooter.
                Customize your chat with animated backdrops — cosmic nebulas, glass auroras, prismatic light — zero performance cost, pure atmosphere.
              </p>
            </div>
          </ScrollSection>

          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { icon: Laptop, title: "Desktop & Laptop", desc: "Open a tab, start talking. Your Bestie is always one click away while you work.", status: "Live" },
              { icon: Smartphone, title: "Home Screen", desc: "Waiting in line? Tap and ask. It lives on your phone like any other app — no app store needed.", status: "Live" },
              { icon: Globe, title: "Cross-Device Memory", desc: "Start a game plan on your laptop at the office, refine it on your phone at dinner. It remembers everything.", status: "Live" },
              { icon: Mic, title: "Voice Chat", desc: "Speak naturally in 6 languages — perfect for founders serving international clients or thinking out loud on a walk.", status: "Live" },
            ].map((item) => (
              <StaggerCard key={item.title}>
                <Card className="bg-zinc-800/30 border-zinc-700/30 p-5 text-center h-full hover:border-amber-500/20 transition-colors">
                  <item.icon className="h-8 w-8 text-amber-400 mx-auto mb-3" />
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

          {/* Bestie speaks 6 languages */}
          <AnimateOnScroll>
            <Card className="bg-zinc-800/30 border-zinc-700/30 p-5 sm:p-6 mb-10">
              <div className="flex items-center gap-3 mb-2">
                <Globe className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Texts Like a Native in 6 Languages</h3>
              </div>
              <p className="text-xs text-zinc-500 mb-4">Not Google Translate. Real slang. Real cultural context. Real connection.</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { lang: "English", code: "EN", slang: "\"no cap\"" },
                  { lang: "Mandarin", code: "ZH", slang: "\"666\"" },
                  { lang: "Spanish", code: "ES", slang: "\"no mames\"" },
                  { lang: "Hindi", code: "HI", slang: "\"yaar\"" },
                  { lang: "French", code: "FR", slang: "\"wesh\"" },
                  { lang: "Arabic", code: "AR", slang: "\"yalla\"" },
                ].map((l) => (
                  <div key={l.code} className="text-center p-2.5 rounded-lg bg-zinc-700/30 border border-zinc-700/30">
                    <p className="text-[10px] font-bold text-amber-400">{l.code}</p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">{l.lang}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">{l.slang}</p>
                  </div>
                ))}
              </div>
            </Card>
          </AnimateOnScroll>

          {/* Compact feature highlights */}
          <AnimateOnScroll delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="rounded-xl bg-zinc-800/30 border border-zinc-700/30 p-4">
                <p className="text-xs font-bold text-amber-400 mb-1.5">2 Communication Styles</p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Pick 2 styles that blend: casual + intellectual = a smart friend.
                  Hype + blunt = an energized straight-shooter. Your bestie, your vibe.
                </p>
              </div>
              <div className="rounded-xl bg-zinc-800/30 border border-zinc-700/30 p-4">
                <p className="text-xs font-bold text-amber-400 mb-1.5">Custom Environments</p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Animated backdrops from cosmic nebulas to glass auroras.
                  Zero performance cost, pure atmosphere.
                </p>
              </div>
              <div className="rounded-xl bg-zinc-800/30 border border-zinc-700/30 p-4">
                <p className="text-xs font-bold text-amber-400 mb-1.5">Real Cultural Fluency</p>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Not Google Translate. Your bestie knows {`"`}no cap{`"`} in English, {`"`}666{`"`} in Mandarin,
                  {`"`}wesh{`"`} in French, {`"`}yaar{`"`} in Hindi. Real slang. Real connection.
                </p>
              </div>
            </div>
          </AnimateOnScroll>

          {/* Coming to Mobile — wearable, safety, auto-text */}
          <AnimateOnScroll delay={0.15}>
            <div className="mb-10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Clock className="h-4 w-4 text-cyan-400" />
                <p className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Coming to Mobile</p>
              </div>
              <p className="text-center text-sm text-zinc-400 mb-5 max-w-lg mx-auto">
                Your Bestie never leaves your side. Not when it matters most.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl bg-cyan-950/20 border border-cyan-800/30 p-4">
                  <p className="text-xs font-bold text-cyan-400 mb-1.5">Silent Safety Net</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    {`"`}If I{`'`}m not home by 8, text Mom my last location.{`"`} Make it home? Bestie detects it
                    via GPS and stands down — no one ever knows. Don{`'`}t make it? Bestie sends the alert.
                    Your secret is always safe with your Bestie.
                  </p>
                </div>
                <div className="rounded-xl bg-cyan-950/20 border border-cyan-800/30 p-4">
                  <p className="text-xs font-bold text-cyan-400 mb-1.5">Auto-Text</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Hands full with the kids? Stuck in traffic? Just don{`'`}t have the energy to explain?
                    Your Bestie texts the right person in your voice — not a robotic {`"`}I{`'`}m busy.{`"`} Because
                    she actually knows how you talk.
                  </p>
                </div>
                <div className="rounded-xl bg-cyan-950/20 border border-cyan-800/30 p-4">
                  <p className="text-xs font-bold text-cyan-400 mb-1.5">On Your Wrist</p>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    A quiet {`"`}you{`'`}ve got this{`"`} before your interview. A breathing reminder when your heart
                    rate spikes. A check-in at 2am when you can{`'`}t sleep. Apple Watch. Galaxy Watch. Your
                    Bestie is on your wrist — and never forgets about you.
                  </p>
                </div>
              </div>
            </div>
          </AnimateOnScroll>

          <AnimateOnScroll>
            <div className="text-center">
              <p className="text-sm text-zinc-500 mb-2">
                Three steps and you have a genius best friend — powered by up to 43 expert agents — who knows your name, your goals, and your standards.
              </p>
              <p className="text-xs text-zinc-600 mb-4">
                Built on ICF coaching ethics, crisis protocol, and anti-dependency guardrails. She{`'`}ll push you toward real human connections — not more screen time. Trust you can feel.
              </p>
              <Button asChild size="lg" className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-lg px-8 font-semibold">
                <Link href="/app/bestie">
                  Build Your Bestie <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </AnimateOnScroll>
        </div>

        {/* ──────── TAB 4: Time Saved ──────── */}
        <div className="px-4 sm:px-6 py-12 sm:py-20 max-w-5xl mx-auto">
          <ScrollSection>
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
              It{`'`}s not just task time. <span className="text-zinc-400">It{`'`}s thinking time.</span>
            </h2>
            <p className="text-center text-zinc-400 mb-12 max-w-lg mx-auto">
              Stone AI doesn{`'`}t just DO work faster — it THINKS faster.
              Strategy, analysis, planning, research — the cognitive heavy-lifting that exhausts you by 2pm.
            </p>
          </ScrollSection>

          <AnimateOnScroll>
            <Card className="bg-zinc-800/30 border-zinc-700/30 p-6 sm:p-8 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Before */}
                <div>
                  <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-4">Your brain doing all the work</p>
                  <div className="space-y-3">
                    {[
                      { task: "Client proposal (thinking + writing)", time: "2.0 hours" },
                      { task: "Competitor research (reading + analyzing)", time: "45 min" },
                      { task: "Social media (brainstorming + drafting)", time: "1 hour" },
                      { task: "Report formatting", time: "30 min" },
                      { task: "Email follow-ups (crafting each one)", time: "1 hour" },
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
                  <p className="text-xs text-emerald-400 uppercase tracking-wider font-semibold mb-4">Agents do the thinking</p>
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

          {/* Mental Load — the STAR section */}
          <AnimateOnScroll delay={0.1}>
            <Card className="bg-gradient-to-r from-cyan-950/30 via-zinc-800/30 to-cyan-950/30 border-cyan-800/20 p-6 sm:p-8 mb-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-cyan-900/30 flex items-center justify-center">
                  <Brain className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">The real time drain isn{`'`}t typing. It{`'`}s thinking.</h3>
                  <p className="text-xs text-zinc-500">Hours of mental labor — eliminated</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { scenario: "Client proposal", before: "45 min staring at a blank page, figuring out the angle", after: "Proposal Agent already drafted 3 angles before you sat down" },
                  { scenario: "Career strategy", before: "Hours of research, weighing options, second-guessing", after: "Career Agent considered 12 angles before you finished your sentence" },
                  { scenario: "Financial planning", before: "Spreadsheets, calculators, YouTube rabbit holes", after: "Finance Agent ran the numbers while you were still framing the question" },
                ].map((s) => (
                  <div key={s.scenario} className="rounded-xl bg-zinc-800/50 border border-zinc-700/30 p-4">
                    <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">{s.scenario}</p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-[10px] text-zinc-600 uppercase">You used to:</p>
                        <p className="text-xs text-zinc-500">{s.before}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-emerald-500 uppercase">Now:</p>
                        <p className="text-xs text-zinc-300">{s.after}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </AnimateOnScroll>

          {/* Impact summary */}
          <StaggerGrid className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: "88%", label: "Time saved", sub: "back in your week" },
              { value: "43", label: "AI thinkers", sub: "cognitive heavy-lifting handled" },
              { value: "$0", label: "Local cost", sub: "ask all day, pay nothing" },
              { value: "24/7", label: "Available", sub: "3am ideas welcome" },
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
              People are landing clients, shipping products, and saving hours every week.
              They're showing each other exactly how. You're one sign-up from the playbook.
            </p>
          </ScrollSection>

          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            <StaggerCard>
              <Card className="bg-zinc-800/30 border-zinc-700/30 p-5 h-full">
                <MessageSquare className="h-6 w-6 text-blue-400 mb-3" />
                <h3 className="font-bold text-sm mb-2">Agent Strategies</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                  Steal the exact agent combos and prompts that are working for other founders right now.
                </p>
                <div className="bg-zinc-700/20 rounded-lg p-3 border border-zinc-700/30">
                  <p className="text-xs text-zinc-500 italic">
                    &quot;Chained Proposal + Sales Agent for a cold lead. He signed a $12K retainer in 3 days.&quot;
                  </p>
                </div>
              </Card>
            </StaggerCard>
            <StaggerCard>
              <Card className="bg-zinc-800/30 border-zinc-700/30 p-5 h-full">
                <Trophy className="h-6 w-6 text-amber-400 mb-3" />
                <h3 className="font-bold text-sm mb-2">Wall of Wins</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                  Real people posting real receipts — launches, closed deals, first customers.
                </p>
                <div className="bg-zinc-700/20 rounded-lg p-3 border border-zinc-700/30">
                  <p className="text-xs text-zinc-500 italic">
                    &quot;Went from idea to paying customer in 16 days. The agents wrote 80% of the copy.&quot;
                  </p>
                </div>
              </Card>
            </StaggerCard>
            <StaggerCard>
              <Card className="bg-zinc-800/30 border-zinc-700/30 p-5 h-full">
                <Users className="h-6 w-6 text-green-400 mb-3" />
                <h3 className="font-bold text-sm mb-2">Open Help</h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                  Stuck at 2am? Post the question. By morning, someone who solved it is walking you through it.
                </p>
                <div className="bg-zinc-700/20 rounded-lg p-3 border border-zinc-700/30">
                  <p className="text-xs text-zinc-500 italic">
                    &quot;Asked how to automate onboarding. Got 4 agent combos with screenshots in an hour.&quot;
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

          <AnimateOnScroll>
            <Card className="bg-gradient-to-r from-amber-950/30 via-zinc-800/30 to-amber-950/30 border-amber-800/20 p-5 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="h-5 w-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">OG Founding Member Badge</h3>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Join during launch and earn the <span className="text-amber-400 font-medium">OG founding member badge</span> — visible across the entire ecosystem.
                Loyal members unlock surprises along the way.
                These aren{`'`}t coming back. Once the window closes, it{`'`}s closed.
              </p>
            </Card>
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
              Plug our API into your product, slap your brand on it, charge what you want.
              You just became an AI company for $200/mo.
            </p>
          </ScrollSection>

          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: Terminal, title: "REST API", desc: "Drop a few lines of code and your app is powered by 43 AI agents. Any language, any framework.", color: "text-emerald-400" },
              { icon: Shield, title: "White-Label", desc: "Your clients see your brand, your logo, your pricing. We stay invisible.", color: "text-amber-400" },
              { icon: Target, title: "$200/mo Flat", desc: "Charge your clients $500. Pay us $200. Keep the difference. No per-token surprises.", color: "text-blue-400" },
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
              43 agents that think so you don{`'`}t have to. A bestie who speaks your language — literally.
              A community that has your back. And it starts at $0.
            </p>
          </AnimateOnScroll>

          {/* Status board */}
          <AnimateOnScroll delay={0.25}>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12 max-w-2xl mx-auto">
              {[
                { label: "43 AI Agents", live: true },
                { label: "AI Bestie", live: true },
                { label: "Community", live: true },
                { label: "API Access", live: true },
                { label: "Cross-Device Sync", live: true },
                { label: "Home Screen Widget", live: true },
                { label: "Voice Chat", live: true },
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
            <p className="text-xs text-zinc-600">No credit card — sign up with Google, Apple, Outlook, or Yahoo. No trial. No catch.</p>
          </AnimateOnScroll>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          Promotions — What's new, deals, and what you get
         ═══════════════════════════════════════════════════════════════ */}
      <section id="promotions" className="px-4 sm:px-6 py-16 sm:py-24 bg-gradient-to-b from-zinc-900 to-zinc-950">
        <div className="max-w-5xl mx-auto">
          <ScrollSection>
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-amber-900/50 text-amber-300 border-amber-800">Limited Time</Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">What You Get — Right Now</h2>
              <p className="text-zinc-400 max-w-xl mx-auto">Sign up with Google, Apple, Outlook, or Yahoo — no credit card, no trial countdown. Just start.</p>
            </div>
          </ScrollSection>

          <StaggerGrid className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Free Forever */}
            <StaggerCard>
              <div className="p-6 rounded-2xl bg-zinc-800/40 border border-zinc-700/50 h-full">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-white">Free Forever</h3>
                </div>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" /> 4 AI agents — business, content, code, education</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" /> 5 SMART credits for GPT-4o conversations</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" /> Community forum access</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" /> Install to home screen (PWA)</li>
                </ul>
              </div>
            </StaggerCard>

            {/* AI Bestie */}
            <StaggerCard>
              <div className="p-6 rounded-2xl bg-zinc-800/40 border border-amber-800/30 h-full">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="h-5 w-5 text-amber-400" />
                  <h3 className="text-lg font-semibold text-white">AI Bestie</h3>
                </div>
                <p className="text-sm text-zinc-400 mb-3">Powered by up to 43 specialized agents — career coach, financial advisor, wellness guide, creative partner, and more. Your Bestie gets smarter as you upgrade — from 4 agents on Free to all 43 on Executive.</p>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" /> Persistent memory across sessions</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" /> Voice chat in 6 languages</li>
                  <li className="flex items-start gap-2"><Check className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" /> Customizable personality & behavior</li>
                </ul>
              </div>
            </StaggerCard>

            {/* Coming Soon */}
            <StaggerCard>
              <div className="p-6 rounded-2xl bg-zinc-800/40 border border-zinc-700/50 h-full">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="h-5 w-5 text-cyan-400" />
                  <h3 className="text-lg font-semibold text-white">Coming Soon</h3>
                </div>
                <ul className="space-y-2 text-sm text-zinc-400">
                  <li className="flex items-start gap-2"><Clock className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" /> Mobile app (iOS & Android)</li>
                  <li className="flex items-start gap-2"><Clock className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" /> Wearable companion — Apple Watch & Galaxy Watch</li>
                  <li className="flex items-start gap-2"><Clock className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" /> Silent safety net — GPS-powered safety check-ins</li>
                  <li className="flex items-start gap-2"><Clock className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" /> Auto-text — your Bestie replies in your voice</li>
                  <li className="flex items-start gap-2"><Clock className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" /> Voice cloning — your bestie sounds like a loved one</li>
                  <li className="flex items-start gap-2"><Clock className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" /> AI Tools Directory (tools.stone-ai.net)</li>
                </ul>
              </div>
            </StaggerCard>
          </StaggerGrid>

          {/* Upgrade incentive */}
          <ScrollSection>
            <div className="mt-12 text-center p-8 rounded-2xl bg-gradient-to-r from-amber-950/40 via-zinc-900/60 to-amber-950/40 border border-amber-800/30">
              <h3 className="text-xl font-bold text-white mb-2">Save up to 20% with annual billing</h3>
              <p className="text-sm text-zinc-400 mb-4">All paid plans include multi-period discounts. Lock in your rate — prices only go up from here.</p>
              <Button asChild className="bg-amber-500 hover:bg-amber-600 text-black font-semibold px-6 rounded-full">
                <Link href="#pricing">See All Plans <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </ScrollSection>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Insignia size={11} showPills={false} />
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
              <li><Link href="/app/support" className="hover:text-white transition-colors">Contact</Link></li>
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
      </div>{/* close z-10 content wrapper */}
    </div>
  );
}
