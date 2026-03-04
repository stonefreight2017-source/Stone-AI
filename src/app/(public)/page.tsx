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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PricingSection } from "./pricing-section";


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <span className="text-xl font-bold">Stone AI™</span>
        <div className="flex items-center gap-4">
          <Link
            href="/#pricing"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/sign-in"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Button asChild size="sm">
            <Link href="/sign-up">Get Started Free</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-20 pb-12 max-w-4xl mx-auto text-center">
        <Badge className="mb-6 bg-amber-900/50 text-amber-300 border-amber-800">
          Sub-100ms responses. Frontier-class intelligence.
        </Badge>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
          The <span className="text-amber-400">fastest</span>,{" "}
          <span className="text-blue-400">smartest</span> AI
          <br />you can actually own
        </h1>
        <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          While others wait 500ms+ for cloud APIs, Stone AI™ thinks locally at
          GPU speed. Smarter models, faster answers, total privacy.
          This is AI without the lag, the limits, or the leaks.
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
      </section>

      {/* Speed + Intelligence Stats */}
      <section className="px-6 pb-20 max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900 border-zinc-800 p-5 text-center">
            <p className="text-3xl font-bold text-amber-400">&lt;100ms</p>
            <p className="text-xs text-zinc-500 mt-1">First token latency</p>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 p-5 text-center">
            <p className="text-3xl font-bold text-blue-400">70B</p>
            <p className="text-xs text-zinc-500 mt-1">Parameter model</p>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 p-5 text-center">
            <p className="text-3xl font-bold text-green-400">0ms</p>
            <p className="text-xs text-zinc-500 mt-1">Network round-trip</p>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 p-5 text-center">
            <p className="text-3xl font-bold text-purple-400">100%</p>
            <p className="text-xs text-zinc-500 mt-1">Data stays local</p>
          </Card>
        </div>
      </section>

      {/* Speed Comparison */}
      <section className="px-6 pb-24 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">
          Speed isn't a feature. It's the foundation.
        </h2>
        <p className="text-center text-zinc-400 mb-10 max-w-lg mx-auto">
          Every millisecond of latency is friction between you and your answer.
          We eliminated the biggest bottleneck: the network.
        </p>
        <Card className="bg-zinc-900 border-zinc-800 p-6">
          <div className="space-y-4">
            {[
              { name: "Stone AI™ (Local)", latency: 65, color: "bg-amber-400", width: "6.5%" },
              { name: "ChatGPT", latency: 450, color: "bg-zinc-600", width: "45%" },
              { name: "Claude", latency: 520, color: "bg-zinc-600", width: "52%" },
              { name: "Gemini", latency: 680, color: "bg-zinc-600", width: "68%" },
            ].map((item) => (
              <div key={item.name} className="flex items-center gap-4">
                <span className="text-sm text-zinc-400 w-32 shrink-0 text-right">
                  {item.name}
                </span>
                <div className="flex-1 h-6 bg-zinc-800 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all flex items-center justify-end pr-2`}
                    style={{ width: `max(${item.width}, 60px)` }}
                  >
                    <span className="text-[10px] font-bold text-zinc-900">
                      {item.latency}ms
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-zinc-600 mt-3 text-center">
            Typical first-token latency based on internal benchmarks. Cloud provider estimates reflect publicly available API performance data and may vary. Stone AI™ local inference benchmarked on NVIDIA RTX 5090. Actual performance depends on hardware, network conditions, and query complexity.
          </p>
        </Card>
      </section>

      {/* Value Props — Speed + Intelligence + Privacy + Value */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-zinc-900 border-zinc-800 p-6">
            <Gauge className="h-8 w-8 text-amber-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Unmatched speed</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Local GPU inference delivers answers before cloud AI even receives
              your request. Every response shows its latency — because we have
              nothing to hide.
            </p>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 p-6">
            <Brain className="h-8 w-8 text-blue-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Frontier intelligence</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Running the latest open-weight 70B models — and always upgrading to
              the best available. Smart mode adds GPT-4o when you need the absolute
              cutting edge.
            </p>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 p-6">
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
          <Card className="bg-zinc-900 border-zinc-800 p-6">
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
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 pb-24 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12">
          How it works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="shrink-0 h-10 w-10 rounded-full bg-blue-900/50 flex items-center justify-center text-blue-400 font-bold">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-1">Sign up in seconds</h4>
                <p className="text-sm text-zinc-400">
                  Free tier, no credit card. Start chatting immediately.
                </p>
              </div>
            </div>
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
          </div>
          <div className="flex items-center justify-center">
            <Card className="bg-zinc-900 border-zinc-800 p-6 w-full max-w-sm">
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
        </div>
      </section>

      {/* Enterprise callout */}
      <section className="px-6 pb-24 max-w-4xl mx-auto">
        <Card className="bg-gradient-to-br from-zinc-900 to-zinc-900/50 border-zinc-800 p-8 md:p-12">
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
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* AI Agents Section — Outcome-Driven */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-amber-900/50 text-amber-300 border-amber-800">
            <Bot className="h-3 w-3 mr-1" /> 30 Expert AI Agents
          </Badge>
          <h2 className="text-3xl font-bold mb-4">
            Plan it. Start it. <span className="text-amber-400">Run it.</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Stone AI™ agents aren't chatbots — they're business partners. From
            validating your first idea to managing multiple companies, each
            agent is a domain expert that delivers real work you can use
            immediately or sell to clients.
          </p>
        </div>

        {/* Outcome Journey */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="bg-gradient-to-b from-blue-950/40 to-zinc-900 border-blue-900/30 p-6">
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
          <Card className="bg-gradient-to-b from-purple-950/40 to-zinc-900 border-purple-900/30 p-6">
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
          <Card className="bg-gradient-to-b from-amber-950/40 to-zinc-900 border-amber-900/30 p-6">
            <div className="h-10 w-10 rounded-full bg-amber-900/50 flex items-center justify-center mb-4">
              <TrendingUp className="h-5 w-5 text-amber-400" />
            </div>
            <h3 className="font-bold text-white mb-2">Run multiple companies</h3>
            <p className="text-sm text-zinc-400 leading-relaxed mb-3">
              Scale with AI. Each agent remembers your businesses, clients,
              and past decisions. Manage operations across ventures without
              hiring a full team.
            </p>
            <ul className="space-y-1.5 text-xs text-zinc-500">
              <li className="flex items-center gap-2"><Check className="h-3 w-3 text-amber-400" /> Persistent memory per business</li>
              <li className="flex items-center gap-2"><Check className="h-3 w-3 text-amber-400" /> Automated reporting & analytics</li>
              <li className="flex items-center gap-2"><Check className="h-3 w-3 text-amber-400" /> 26 specialists, zero payroll</li>
            </ul>
          </Card>
        </div>

        {/* Agent Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {[
            {
              icon: Briefcase,
              title: "Business Building",
              count: 12,
              examples: "AI Agency, SaaS Builder, SMMA, Sales, Dispatch, Claims, Compliance",
              color: "text-blue-400",
            },
            {
              icon: Pen,
              title: "Content & Media",
              count: 5,
              examples: "YouTube, Content Studio, Short Form, Blog & Affiliate",
              color: "text-purple-400",
            },
            {
              icon: BarChart2,
              title: "Marketing & Sales",
              count: 4,
              examples: "Funnel Builder, Paid Ads, Copywriting, Social Media",
              color: "text-green-400",
            },
            {
              icon: Code,
              title: "Technical",
              count: 5,
              examples: "Web Dev, Automation, Data Analytics, Cybersecurity",
              color: "text-amber-400",
            },
            {
              icon: TrendingUp,
              title: "Finance & Career",
              count: 2,
              examples: "Trading Signals, Resume & LinkedIn",
              color: "text-emerald-400",
            },
            {
              icon: Brain,
              title: "Startup & Engineering",
              count: 2,
              examples: "Startup Launcher, Engineering Architect",
              color: "text-pink-400",
            },
          ].map((cat) => (
            <Card key={cat.title} className="bg-zinc-900 border-zinc-800 p-5">
              <cat.icon className={`h-6 w-6 ${cat.color} mb-3`} />
              <h3 className="font-semibold text-sm mb-1">
                {cat.title}
                <span className="text-zinc-500 font-normal ml-2">({cat.count})</span>
              </h3>
              <p className="text-xs text-zinc-500">{cat.examples}</p>
            </Card>
          ))}
        </div>

        {/* What makes them different */}
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

        {/* CTA */}
        <div className="text-center">
          <p className="text-sm text-zinc-400 mb-4">
            All 30 agents are premium. Unlock your first 11 agents with Plus ($29.99/mo).
          </p>
          <Button asChild size="lg" className="bg-amber-600 hover:bg-amber-500 text-lg px-8">
            <Link href="/sign-up">
              Explore All Agents <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Community Section */}
      <section className="px-6 pb-24 max-w-4xl mx-auto">
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
      </section>

      {/* API + Reseller Section */}
      <section className="px-6 pb-24 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-emerald-900/50 text-emerald-300 border-emerald-800">
            <Code className="h-3 w-3 mr-1" /> Pro Exclusive
          </Badge>
          <h2 className="text-3xl font-bold mb-4">
            Build on Stone AI™. <span className="text-emerald-400">Resell intelligence.</span>
          </h2>
          <p className="text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Pro members get full API access to build AI-powered products,
            automate workflows, or resell AI capabilities to their own
            clients — all backed by our local-first infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Card className="bg-zinc-900 border-zinc-800 p-6">
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

          <Card className="bg-zinc-900 border-zinc-800 p-6">
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
        </div>

        {/* Use Cases */}
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

        {/* What sets us apart */}
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

        {/* Reseller success agents */}
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
      </section>

      {/* Mobile App Coming Soon */}
      <section className="px-6 py-16 bg-gradient-to-b from-zinc-950 to-zinc-900 border-t border-zinc-800">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium mb-6">
            <Clock className="h-3.5 w-3.5" />
            Coming Soon
          </div>
          <h2 className="text-3xl font-bold mb-4">
            Take Stone AI™ everywhere.
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto mb-3">
            <span className="text-amber-400 font-semibold">Best AI™</span> — the mobile companion app — is coming to iOS and Android.
            All your agents, your AI Bestie, and your business tools in your pocket.
          </p>
          <p className="text-zinc-500 text-sm mb-6">
            Get started on the web today. Your account will carry over seamlessly when the app launches.
          </p>
          <Button asChild size="lg" className="bg-white text-black hover:bg-zinc-200 gap-2 px-8">
            <Link href="/sign-up">
              Start Free on Web <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-sm text-zinc-500">
            Stone AI™ — Private, fast, local-first AI.
          </span>
          <div className="flex gap-6 text-sm text-zinc-500">
            <Link href="/terms" className="hover:text-zinc-300">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-zinc-300">
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
