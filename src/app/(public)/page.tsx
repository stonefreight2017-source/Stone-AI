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
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-xl font-bold">Stone AI™</span>
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

      {/* Hero — The Vision */}
      <section className="px-6 pt-20 pb-12 max-w-4xl mx-auto text-center relative">
        <HeroGlow />
        <HeroSection>
        <Badge className="mb-6 bg-amber-900/50 text-amber-300 border-amber-800">
          42 AI agents. One platform. Your advantage.
        </Badge>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
          You had the <span className="text-amber-400">idea</span>.
          <br />Now meet the <span className="text-blue-400">team</span>.
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-4 leading-relaxed">
          Building a company or working at one — 42 AI agents handle proposals,
          research, code, and operations for you.
        </p>
        <p className="text-lg text-zinc-500 max-w-xl mx-auto mb-10">
          Easier days. Better output. Smoother everything.
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

      {/* Chapter 1: Speed */}
      <section className="px-6 pb-20 max-w-4xl mx-auto">
        <ScrollSection>
        <p className="text-center text-sm text-zinc-500 uppercase tracking-widest mb-8">Chapter 1: The Speed Advantage</p>
        </ScrollSection>
        <StaggerGrid className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StaggerCard>
          <Card className="bg-zinc-900 border-zinc-800 p-5 text-center">
            <p className="text-3xl font-bold text-amber-400">&lt;100ms</p>
            <p className="text-xs text-zinc-500 mt-1">First token latency</p>
          </Card>
          </StaggerCard>
          <StaggerCard>
          <Card className="bg-zinc-900 border-zinc-800 p-5 text-center">
            <p className="text-3xl font-bold text-blue-400">70B</p>
            <p className="text-xs text-zinc-500 mt-1">Parameter model</p>
          </Card>
          </StaggerCard>
          <StaggerCard>
          <Card className="bg-zinc-900 border-zinc-800 p-5 text-center">
            <p className="text-3xl font-bold text-green-400">0ms</p>
            <p className="text-xs text-zinc-500 mt-1">Network round-trip</p>
          </Card>
          </StaggerCard>
          <StaggerCard>
          <Card className="bg-zinc-900 border-zinc-800 p-5 text-center">
            <p className="text-3xl font-bold text-purple-400">100%</p>
            <p className="text-xs text-zinc-500 mt-1">Data stays local</p>
          </Card>
          </StaggerCard>
        </StaggerGrid>
      </section>

      {/* Speed Comparison — Architecture Advantage */}
      <section className="px-6 pb-24 max-w-4xl mx-auto">
        <ScrollSection>
        <h2 className="text-3xl font-bold text-center mb-4">
          Your team doesn&apos;t wait. Neither should your AI.
        </h2>
        <p className="text-center text-zinc-400 mb-10 max-w-lg mx-auto">
          Most AI tools route your data through remote servers hundreds of miles away.
          We moved the intelligence to your network.
        </p>
        </ScrollSection>
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StaggerCard>
          {/* Traditional Cloud AI */}
          <Card className="bg-zinc-900 border-zinc-800 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Server className="h-5 w-5 text-zinc-500" />
              <span className="text-sm font-semibold text-zinc-400">Traditional Cloud AI</span>
            </div>
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-zinc-600 shrink-0" />
                <span className="text-sm text-zinc-400">Your message leaves your device</span>
              </div>
              <div className="h-5 border-l-2 border-dashed border-zinc-700 ml-[3px]" />
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-zinc-600 shrink-0" />
                <span className="text-sm text-zinc-400">Travels to a remote data center</span>
              </div>
              <div className="h-5 border-l-2 border-dashed border-zinc-700 ml-[3px]" />
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-zinc-600 shrink-0" />
                <span className="text-sm text-zinc-400">Processed on shared infrastructure</span>
              </div>
              <div className="h-5 border-l-2 border-dashed border-zinc-700 ml-[3px]" />
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-zinc-600 shrink-0" />
                <span className="text-sm text-zinc-400">Response travels back to you</span>
              </div>
            </div>
            <div className="bg-zinc-800/80 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-zinc-400">400–800ms</p>
              <p className="text-xs text-zinc-500 mt-1">Typical first-token latency</p>
            </div>
          </Card>

          </StaggerCard>
          <StaggerCard>
          {/* Stone AI Local */}
          <Card className="bg-zinc-900 border-amber-800/50 border-2 p-6">
            <div className="flex items-center gap-2 mb-5">
              <Cpu className="h-5 w-5 text-amber-400" />
              <span className="text-sm font-semibold text-amber-400">Stone AI™ Local Mode</span>
            </div>
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span className="text-sm text-zinc-300">Your message stays on your network</span>
              </div>
              <div className="h-5 border-l-2 border-amber-800/50 ml-[3px]" />
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span className="text-sm text-zinc-300">Processed on your local GPU</span>
              </div>
              <div className="h-5 border-l-2 border-amber-800/50 ml-[3px]" />
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                <span className="text-sm text-zinc-300">Response delivered instantly</span>
              </div>
            </div>
            <div className="bg-amber-950/50 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-amber-400">&lt;100ms</p>
              <p className="text-xs text-amber-300/60 mt-1">First-token latency on supported GPUs</p>
            </div>
          </Card>
          </StaggerCard>
        </StaggerGrid>
        <AnimateOnScroll delay={0.3}>
        <p className="text-[10px] text-zinc-600 mt-4 text-center max-w-lg mx-auto">
          Local mode performance varies by GPU hardware. Smart mode routes to GPT-4o cloud API
          when needed, with latency similar to other cloud providers.
        </p>
        </AnimateOnScroll>
      </section>

      {/* Chapter 2: Why This Is Different */}
      <section id="features" className="px-6 pb-24 max-w-5xl mx-auto">
        <ScrollSection>
        <p className="text-center text-sm text-zinc-500 uppercase tracking-widest mb-8">Chapter 2: Why This Changes Everything</p>
        </ScrollSection>
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StaggerCard>
            <Card className="bg-zinc-900 border-zinc-800 p-6 hover:border-zinc-700 transition-colors duration-300">
              <Gauge className="h-8 w-8 text-amber-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Unmatched speed</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Local GPU inference delivers answers before cloud AI even receives
                your request. Every response shows its latency — because we have
                nothing to hide.
              </p>
            </Card>
          </StaggerCard>
          <StaggerCard>
            <Card className="bg-zinc-900 border-zinc-800 p-6 hover:border-zinc-700 transition-colors duration-300">
              <Brain className="h-8 w-8 text-blue-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Frontier intelligence</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Running the latest open-weight 70B models — and always upgrading to
                the best available. Smart mode adds GPT-4o when you need the absolute
                cutting edge.
              </p>
            </Card>
          </StaggerCard>
          <StaggerCard>
            <Card className="bg-zinc-900 border-zinc-800 p-6 hover:border-zinc-700 transition-colors duration-300">
              <Shield className="h-8 w-8 text-green-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Total data sovereignty
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Conversations never leave your network. No third-party API calls
                on the free tier. HIPAA-friendly. GDPR-ready. Compliance by
                design.
              </p>
            </Card>
          </StaggerCard>
          <StaggerCard>
            <Card className="bg-zinc-900 border-zinc-800 p-6 hover:border-zinc-700 transition-colors duration-300">
              <DollarSign className="h-8 w-8 text-emerald-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Sustainably free
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                No API middleman means our free tier costs us almost nothing.
                No credit card, no trial, no catch. Upgrade when you need
                more speed or smarter models.
              </p>
            </Card>
          </StaggerCard>
        </StaggerGrid>
      </section>

      {/* Chapter 3: How It Works */}
      <section className="px-6 pb-24 max-w-4xl mx-auto">
        <ScrollSection>
          <p className="text-center text-sm text-zinc-500 uppercase tracking-widest mb-4">Chapter 3: Getting Started</p>
          <h2 className="text-3xl font-bold text-center mb-12">
            Three steps. Zero friction.
          </h2>
        </ScrollSection>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <AnimateOnScroll delay={0.1}>
              <div className="flex gap-4">
                <div className="shrink-0 h-10 w-10 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Sign up in seconds</h4>
                  <p className="text-sm text-zinc-400">
                    Free tier, no credit card. Whether you run a business or work at one — start immediately.
                  </p>
                </div>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll delay={0.2}>
              <div className="flex gap-4">
                <div className="shrink-0 h-10 w-10 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Chat with local AI</h4>
                  <p className="text-sm text-zinc-400">
                    Your messages go to a local GPU — not OpenAI, not the cloud.
                    Lightning-fast responses.
                  </p>
                </div>
              </div>
            </AnimateOnScroll>
            <AnimateOnScroll delay={0.3}>
              <div className="flex gap-4">
                <div className="shrink-0 h-10 w-10 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Unlock Smart mode</h4>
                  <p className="text-sm text-zinc-400">
                    Need GPT-4o? Smart and Pro tiers add cloud fallback for
                    complex tasks while keeping local as default.
                  </p>
                </div>
              </div>
            </AnimateOnScroll>
          </div>
          <AnimateOnScroll direction="right" delay={0.2}>
            <div className="flex items-center justify-center">
              <Card className="bg-zinc-900 border-zinc-800 p-6 w-full max-w-sm hover:border-zinc-700 transition-colors duration-300">
                <div className="flex items-center gap-3 mb-4">
                  <Server className="h-5 w-5 text-zinc-500" />
                  <span className="text-sm text-zinc-400">Infrastructure</span>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Inference</span>
                    <span className="text-green-400">Local GPU</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Data storage</span>
                    <span className="text-green-400">On-premise</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">External API calls</span>
                    <span className="text-green-400">Zero (free tier)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">First token latency</span>
                    <span className="text-amber-400">&lt;100ms</span>
                  </div>
                </div>
              </Card>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Enterprise */}
      <section className="px-6 pb-24 max-w-4xl mx-auto">
        <ScrollSection>
          <p className="text-center text-sm text-zinc-500 uppercase tracking-widest mb-8">For Serious Operations</p>
        </ScrollSection>
        <AnimateOnScroll>
        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-zinc-800 p-8 md:p-12 hover:border-zinc-700 transition-colors duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1">
              <Badge className="mb-3 bg-green-900/50 text-green-300 border-green-800">
                Enterprise Ready
              </Badge>
              <h3 className="text-2xl font-bold mb-2">
                Built for regulated industries
              </h3>
              <p className="text-zinc-400 leading-relaxed">
                Healthcare, legal, finance — if your data can't touch the cloud,
                Stone AI™ is the only answer. Local inference means true data
                sovereignty. No BAA needed when data never leaves your
                network.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="border-green-800 text-green-300 hover:bg-green-900/30 shrink-0"
            >
              <Link href="/sign-up">Contact Sales</Link>
            </Button>
          </div>
        </Card>
        </AnimateOnScroll>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* Chapter 4: Your AI Team */}
      <section id="agents" className="px-6 pb-24 max-w-6xl mx-auto">
        <ScrollSection>
        <div className="text-center mb-12">
          <p className="text-sm text-zinc-500 uppercase tracking-widest mb-4">Chapter 4: Meet Your Team</p>
          <Badge className="mb-4 bg-amber-900/50 text-amber-300 border-amber-800">
            <Bot className="h-3 w-3 mr-1" /> 42 Expert AI Agents
          </Badge>
          <h2 className="text-3xl font-bold mb-4">
            Plan it. Start it. Grow it. <span className="text-amber-400">Run it.</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            A strategist, a developer, a marketing team, a financial advisor,
            an HR manager, and a project lead — all ready on day one. Whether you&apos;re
            launching your own company or leveling up at your 9-to-5, these agents
            remember your work, learn your preferences, and produce output you can
            use immediately.
          </p>
        </div>
        </ScrollSection>

        {/* The Journey — How Your Business Grows With AI */}
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <StaggerCard>
          <Card className="bg-gradient-to-b from-blue-950/40 to-zinc-900 border-blue-900/30 p-6 hover:border-blue-800/50 transition-colors duration-300">
            <div className="h-10 w-10 rounded-full bg-blue-900/50 flex items-center justify-center mb-4">
              <Rocket className="h-5 w-5 text-blue-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Plan a business</h3>
            <p className="text-sm text-zinc-400 leading-relaxed mb-3">
              Use the Startup Launcher agent to validate ideas, write business
              plans, map revenue models, and build investor-ready pitch decks.
            </p>
            <ul className="space-y-1.5 text-xs text-zinc-500">
              <li className="flex items-center gap-2"><Check className="h-3 w-3 text-blue-400" /> Market research & competitor analysis</li>
              <li className="flex items-center gap-2"><Check className="h-3 w-3 text-blue-400" /> Financial projections & pricing</li>
              <li className="flex items-center gap-2"><Check className="h-3 w-3 text-blue-400" /> Go-to-market strategy</li>
            </ul>
          </Card>
          </StaggerCard>
          <StaggerCard>
          <Card className="bg-gradient-to-b from-purple-950/40 to-zinc-900 border-purple-900/30 p-6 hover:border-purple-800/50 transition-colors duration-300">
            <div className="h-10 w-10 rounded-full bg-purple-900/50 flex items-center justify-center mb-4">
              <Target className="h-5 w-5 text-purple-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Start a business</h3>
            <p className="text-sm text-zinc-400 leading-relaxed mb-3">
              Build your brand, website, and marketing from day one. The agents
              handle copywriting, web development, ad campaigns, and lead gen.
            </p>
            <ul className="space-y-1.5 text-xs text-zinc-500">
              <li className="flex items-center gap-2"><Check className="h-3 w-3 text-purple-400" /> Brand identity & website</li>
              <li className="flex items-center gap-2"><Check className="h-3 w-3 text-purple-400" /> Launch marketing campaigns</li>
              <li className="flex items-center gap-2"><Check className="h-3 w-3 text-purple-400" /> First 100 customers playbook</li>
            </ul>
          </Card>
          </StaggerCard>
          <StaggerCard>
          <Card className="bg-gradient-to-b from-amber-950/40 to-zinc-900 border-amber-900/30 p-6 hover:border-amber-800/50 transition-colors duration-300">
            <div className="h-10 w-10 rounded-full bg-amber-900/50 flex items-center justify-center mb-4">
              <TrendingUp className="h-5 w-5 text-amber-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Work smarter every day</h3>
            <p className="text-sm text-zinc-400 leading-relaxed mb-3">
              Running a company or working at one — AI handles the heavy lifting.
              Draft reports, research competitors, write proposals, and automate
              the repetitive stuff so you can focus on what matters.
            </p>
            <ul className="space-y-1.5 text-xs text-zinc-500">
              <li className="flex items-center gap-2"><Check className="h-3 w-3 text-amber-400" /> Persistent memory across sessions</li>
              <li className="flex items-center gap-2"><Check className="h-3 w-3 text-amber-400" /> Reports, emails, and presentations</li>
              <li className="flex items-center gap-2"><Check className="h-3 w-3 text-amber-400" /> 42 specialists, zero overhead</li>
            </ul>
          </Card>
          </StaggerCard>
        </StaggerGrid>

        {/* Agent Categories */}
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {[
            {
              icon: Briefcase,
              title: "Business Building",
              count: 14,
              examples: "AI Agency, SaaS, Sales, HR, Project Management, Dispatch, Claims, Compliance",
              color: "text-blue-400",
            },
            {
              icon: Pen,
              title: "Content & Media",
              count: 7,
              examples: "YouTube, Content Studio, Copywriting, Blog, Translation, Podcast, Video",
              color: "text-purple-400",
            },
            {
              icon: BarChart2,
              title: "Marketing & Sales",
              count: 4,
              examples: "Digital Marketing, Funnels, Lead Generation, Brand Strategy",
              color: "text-green-400",
            },
            {
              icon: Code,
              title: "Technical",
              count: 5,
              examples: "Web Dev, Coding Assistant, Automation, Data Analytics, Cybersecurity",
              color: "text-amber-400",
            },
            {
              icon: TrendingUp,
              title: "Finance & Career",
              count: 4,
              examples: "Personal Finance, Trading, Resume & LinkedIn, Real Estate",
              color: "text-emerald-400",
            },
            {
              icon: Brain,
              title: "Education & Wellness",
              count: 8,
              examples: "Health Coach, Academic Tutor, Bestie, Writing Coach, Platform Guide",
              color: "text-pink-400",
            },
          ].map((cat) => (
            <StaggerCard key={cat.title}>
              <Card className="bg-zinc-900 border-zinc-800 p-5 hover:border-zinc-700 transition-colors duration-300 h-full">
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
          <h3 className="text-lg font-bold mb-4">
            What makes Stone AI™ agents different from a regular chatbot?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-semibold">RAG Knowledge Base</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Each agent comes loaded with domain-specific frameworks,
                templates, and best practices. They reference real data, not
                generic AI hallucinations.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Brain className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-semibold">Persistent Memory</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Agents remember your business, clients, preferences, and past
                decisions. Session 50 is smarter than session 1 because the
                agent has learned YOU.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="h-4 w-4 text-green-400" />
                <span className="text-sm font-semibold">Business-Ready Output</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Every agent produces client-ready deliverables — proposals,
                scripts, copy, code, strategies — that you can use directly or
                sell as services.
              </p>
            </div>
          </div>
        </Card>
        </AnimateOnScroll>

        {/* CTA */}
        <AnimateOnScroll delay={0.2}>
        <div className="text-center">
          <p className="text-sm text-zinc-400 mb-4">
            42 specialized agents for founders, employees, and freelancers. Start with 4 free, unlock 16 with Builder, or get all 42 with Executive.
          </p>
          <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-500 text-lg px-8">
            <Link href="/sign-up">
              Explore All Agents <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
        </AnimateOnScroll>
      </section>

      {/* Chapter 5: The Community */}
      <section id="community" className="px-6 pb-24 max-w-4xl mx-auto">
        <ScrollSection>
          <p className="text-center text-sm text-zinc-500 uppercase tracking-widest mb-4">Chapter 5: You&apos;re Not Alone</p>
        </ScrollSection>
        <AnimateOnScroll>
        <Card className="bg-gradient-to-br from-zinc-900 to-blue-950/20 border-blue-900/30 p-8 md:p-12">
          <div className="text-center">
            <Badge className="mb-4 bg-blue-900/50 text-blue-300 border-blue-800">
              <Users className="h-3 w-3 mr-1" /> Customer Community
            </Badge>
            <h2 className="text-2xl font-bold mb-4">
              Learn from people who are already doing it
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto leading-relaxed mb-8">
              Join the Stone AI™ community where customers share tips, showcase
              their wins, and help each other get more out of every agent.
              Real strategies from real users — no fluff.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 max-w-lg mx-auto">
              <div className="text-center">
                <MessageSquare className="h-5 w-5 text-blue-400 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">Share tips & strategies</p>
              </div>
              <div className="text-center">
                <Star className="h-5 w-5 text-amber-400 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">Showcase your results</p>
              </div>
              <div className="text-center">
                <Users className="h-5 w-5 text-green-400 mx-auto mb-2" />
                <p className="text-xs text-zinc-400">Get help from the community</p>
              </div>
            </div>
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-500 text-lg px-8">
              <Link href="/sign-up">
                Join the Community <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </Card>
        </AnimateOnScroll>
      </section>

      {/* Chapter 6: Scale Beyond Yourself */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <ScrollSection>
        <div className="text-center mb-12">
          <p className="text-sm text-zinc-500 uppercase tracking-widest mb-4">Chapter 6: Scale Beyond Yourself</p>
          <Badge className="mb-4 bg-emerald-900/50 text-emerald-300 border-emerald-800">
            <Code className="h-3 w-3 mr-1" /> Reseller Program
          </Badge>
          <h2 className="text-3xl font-bold mb-4">
            Build with it. <span className="text-emerald-400">Sell it.</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Some people use Stone AI™ to run their own businesses. Others turn it
            into the business itself. Our Reseller tier gives you API access to
            build products, serve clients, and sell AI solutions — all under your brand.
          </p>
        </div>
        </ScrollSection>

        <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <StaggerCard>
          <Card className="bg-zinc-900 border-zinc-800 p-6 hover:border-zinc-700 transition-colors duration-300">
            <Code className="h-7 w-7 text-emerald-400 mb-4" />
            <h3 className="font-bold text-white mb-2">API Access</h3>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              Simple REST API with your API key. Send a message, get an AI
              response. Works with any language — Python, Node.js, Go, cURL.
            </p>
            <ul className="space-y-2 text-xs text-zinc-500">
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-400" /> 3,008 requests/day included
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-400" /> 10 concurrent connections
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-400" /> 32K token responses
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-emerald-400" /> Priority inference queue
              </li>
            </ul>
          </Card>
          </StaggerCard>

          <StaggerCard>
          <Card className="bg-zinc-900 border-zinc-800 p-6 hover:border-zinc-700 transition-colors duration-300">
            <DollarSign className="h-7 w-7 text-amber-400 mb-4" />
            <h3 className="font-bold text-white mb-2">Reseller Program</h3>
            <p className="text-sm text-zinc-400 leading-relaxed mb-4">
              White-label AI for your own products. Your customers interact
              with your brand — Stone AI™ powers the backend. Keep the margin.
            </p>
            <ul className="space-y-2 text-xs text-zinc-500">
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-amber-400" /> Build SaaS products on our API
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-amber-400" /> Set your own pricing to clients
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-amber-400" /> No "Powered by" requirement
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3 w-3 text-amber-400" /> Sub-100ms local inference speed
              </li>
            </ul>
          </Card>
          </StaggerCard>
        </StaggerGrid>

        {/* Use Cases */}
        <AnimateOnScroll>
        <Card className="bg-gradient-to-br from-zinc-900 to-emerald-950/20 border-emerald-900/30 p-6 md:p-8 mb-10">
          <h3 className="text-lg font-bold mb-4">What resellers are building</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Bot className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-semibold">AI Chatbots for Clients</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Agencies embed Stone AI™ into client websites as custom
                chatbots — charge $500-2,000/mo per client while paying
                $199/mo for the entire API.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-blue-400" />
                <span className="text-sm font-semibold">Automation Backends</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                SaaS builders use our API as the AI engine behind their
                products — content generators, data analyzers, report
                builders — without managing GPU infrastructure.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-purple-400" />
                <span className="text-sm font-semibold">Private AI Solutions</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Compliance-focused businesses offer local AI to regulated
                industries (healthcare, legal, finance) where data can't
                leave the network.
              </p>
            </div>
          </div>
        </Card>
        </AnimateOnScroll>

        {/* What sets us apart */}
        <AnimateOnScroll delay={0.1}>
        <Card className="bg-zinc-900 border-zinc-800 p-6 md:p-8 mb-10">
          <h3 className="text-lg font-bold mb-4">
            Why resellers choose Stone AI™ over OpenAI / Claude API
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "Fixed monthly cost", detail: "$199/mo flat — no per-token billing surprises" },
              { label: "Sub-100ms latency", detail: "Local GPU inference, faster than any cloud API" },
              { label: "Data sovereignty", detail: "Client data never leaves your network (free/local mode)" },
              { label: "No usage metering", detail: "3,008 requests/day included, no overage charges" },
              { label: "White-label ready", detail: "No branding requirements — it's your product" },
              { label: "Priority queue", detail: "Pro API requests always get first-in-line inference" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <Check className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-medium text-white">{item.label}</span>
                  <p className="text-xs text-zinc-500">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
        </AnimateOnScroll>

        {/* Reseller success agents */}
        <AnimateOnScroll delay={0.2}>
        <Card className="bg-zinc-900 border-zinc-800 p-6 md:p-8 mb-10">
          <h3 className="text-lg font-bold mb-2">
            Your reselling business comes with AI support
          </h3>
          <p className="text-xs text-zinc-400 mb-4">
            Pro subscribers get access to agents that help you build, market, and scale your reselling operation — plug and play.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { agent: "Sales Agent", help: "Find clients, write proposals, close deals" },
              { agent: "Copywriting Agent", help: "Write landing pages, ads, and email sequences" },
              { agent: "Business Plan Agent", help: "Structure your reselling business from day one" },
              { agent: "High-Ticket Funnel Agent", help: "Build sales funnels that convert" },
              { agent: "Social Media Agent", help: "Market your AI services across platforms" },
              { agent: "Compliance Agent", help: "Draft contracts and stay legally protected" },
            ].map((item) => (
              <div key={item.agent} className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                <span className="text-sm font-medium text-amber-400">{item.agent}</span>
                <p className="text-xs text-zinc-400 mt-1">{item.help}</p>
              </div>
            ))}
          </div>
        </Card>
        </AnimateOnScroll>

        <AnimateOnScroll delay={0.3}>
        <div className="text-center">
          <p className="text-sm text-zinc-400 mb-4">
            API access is included with the Pro plan ($199/mo). No additional fees. Businesses needing enhanced security or dedicated endpoints — Enterprise plans start at $500/mo.
          </p>
          <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-lg px-8">
            <Link href="/sign-up">
              Get API Access <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
        </AnimateOnScroll>
      </section>

      {/* Bring Your Bestie Anywhere */}
      <section className="px-6 py-16 bg-gradient-to-b from-zinc-950 to-zinc-900 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <ScrollSection>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-medium mb-6">
              <Zap className="h-3.5 w-3.5" />
              Always With You
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Bring your Bestie <span className="text-pink-400">anywhere.</span>
            </h2>
            <p className="text-zinc-400 max-w-xl mx-auto">
              Your AI companion doesn&apos;t live inside an app — it lives where you do.
              One keystroke from your search bar. One tap from your home screen.
              No extra permissions. No app switching. Just your AI, always there.
            </p>
          </div>
          </ScrollSection>

          <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <StaggerCard>
            <Card className="bg-zinc-900 border-zinc-800 p-6 text-center hover:border-zinc-700 transition-colors duration-300">
              <div className="text-3xl mb-3">{"\uD83D\uDD0D"}</div>
              <h3 className="font-semibold text-white mb-2">Search Bar</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Type a question in your browser&apos;s search bar — your Bestie answers instantly.
                No tab switching. No app opening. Just answers, right where you already type.
              </p>
            </Card>
            </StaggerCard>
            <StaggerCard>
            <Card className="bg-zinc-900 border-zinc-800 p-6 text-center hover:border-zinc-700 transition-colors duration-300">
              <div className="text-3xl mb-3">{"\uD83D\uDCF1"}</div>
              <h3 className="font-semibold text-white mb-2">Home Screen Widget</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                One tap on your phone&apos;s home screen and your Bestie is ready.
                No app load time. No login screen. Your companion, front and center.
              </p>
              <div className="inline-flex items-center gap-1 mt-3 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Clock className="h-3 w-3 text-amber-400" />
                <span className="text-[10px] text-amber-400 font-medium">Coming Soon</span>
              </div>
            </Card>
            </StaggerCard>
            <StaggerCard>
            <Card className="bg-zinc-900 border-zinc-800 p-6 text-center hover:border-zinc-700 transition-colors duration-300">
              <div className="text-3xl mb-3">{"\uD83C\uDF10"}</div>
              <h3 className="font-semibold text-white mb-2">Cross-Device Memory</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your Bestie remembers you across every device.
                Start a conversation on your laptop, pick it up on your phone.
                Same personality. Same memories. Same AI.
              </p>
              <div className="inline-flex items-center gap-1 mt-3 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Clock className="h-3 w-3 text-amber-400" />
                <span className="text-[10px] text-amber-400 font-medium">Coming Soon</span>
              </div>
            </Card>
            </StaggerCard>
          </StaggerGrid>

          <AnimateOnScroll delay={0.2}>
          <div className="text-center">
            <p className="text-zinc-500 text-sm mb-4">
              We believe AI should feel like a companion — not like an app that wants your data.
              Minimal permissions. Maximum presence.
            </p>
            <Button asChild size="lg" className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-lg px-8">
              <Link href="/sign-up">
                Meet Your Bestie <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <span className="text-lg font-bold text-white">Stone AI™</span>
            <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
              Private, fast, local-first AI for businesses that move.
            </p>
          </div>
          {/* Product */}
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
          {/* Company */}
          <div>
            <p className="text-sm font-semibold text-zinc-300 mb-3">Company</p>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li><Link href="/about" className="hover:text-zinc-300 transition-colors">About</Link></li>
              <li><Link href="/blog" className="hover:text-zinc-300 transition-colors">Blog</Link></li>
              <li><Link href="/careers" className="hover:text-zinc-300 transition-colors">Careers</Link></li>
              <li><Link href="mailto:support@stone-ai.net" className="hover:text-zinc-300 transition-colors">Contact</Link></li>
            </ul>
          </div>
          {/* Legal */}
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
          <span className="text-xs text-zinc-600">&copy; 2026 Stone AI™. All rights reserved.</span>
          <span className="text-xs text-zinc-600">Built with local-first AI infrastructure</span>
        </div>
      </footer>
    </div>
  );
}
