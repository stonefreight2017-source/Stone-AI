/**
 * VERSION A (REVERSED) — "The Proof"
 * No story. No narrative arc. Just evidence.
 * Minimal text. Maximum data. Dark premium.
 * Tabbed like B. Mobile-first. All contradictions fixed.
 * Different concept: let the PRODUCT speak, not the copy.
 */
import Link from "next/link";
import {
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
  Clock,
  Cpu,
  Smartphone,
  Laptop,
  Globe,
  Heart,
  Lightbulb,
  Trophy,
  Star,
  Network,
  Terminal,
  Mic,
  Brain,
  Zap,
  Shield,
  Target,
  Sparkles,
  ChevronRight,
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
    <div className="min-h-screen bg-zinc-950 text-white scroll-smooth">
      {/* Nav — ultra-clean */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-4 max-w-6xl mx-auto border-b border-zinc-800/50">
        <span className="text-lg font-bold tracking-tight text-white">
          Stone<span className="text-amber-400">.</span>AI
        </span>
        <div className="flex items-center gap-3 sm:gap-5">
          <Link href="#pricing" className="text-sm text-zinc-500 hover:text-white transition-colors hidden sm:inline">
            Pricing
          </Link>
          <Link href="/sign-in" className="text-sm text-zinc-500 hover:text-white transition-colors">
            Sign In
          </Link>
          <Button asChild size="sm" className="bg-amber-500 text-black hover:bg-amber-400 font-semibold">
            <Link href="/sign-up">Start Free</Link>
          </Button>
        </div>
      </nav>

      {/* Hero — Product-first. Numbers. No fluff. */}
      <section className="px-4 sm:px-6 pt-16 sm:pt-28 pb-12 sm:pb-16 max-w-5xl mx-auto">
        <HeroSection>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <Badge className="mb-4 bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">
                42 AI agents. 1 platform. $0 to start.
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-4">
                AI that works<br />
                <span className="text-amber-400">for</span> you.
              </h1>
              <p className="text-lg text-zinc-400 mb-6 leading-relaxed max-w-md">
                Local GPU inference. 42 specialist agents. Persistent memory.
                Your data stays private by default.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild size="lg" className="bg-amber-500 text-black hover:bg-amber-400 font-bold text-lg px-8">
                  <Link href="/sign-up">
                    Get Started <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-zinc-700 text-zinc-300 px-6">
                  <Link href="#pricing">See Plans</Link>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { value: "<100ms", label: "Local response", desc: "GPU inference" },
                { value: "70B", label: "Parameters", desc: "Open-weight" },
                { value: "42", label: "Agents", desc: "Every department" },
                { value: "$0", label: "Local mode", desc: "Unlimited msgs" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-zinc-800/60 border border-zinc-700/40 p-4 sm:p-5">
                  <p className="text-2xl sm:text-3xl font-bold text-white">{s.value}</p>
                  <p className="text-xs text-zinc-400 mt-1 font-medium">{s.label}</p>
                  <p className="text-[10px] text-zinc-600">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </HeroSection>
      </section>

      {/* Tabbed Content */}
      <LandingTabs
        className="border-t border-zinc-800/50"
        tabs={[
          { id: "engine", label: "The Engine", icon: <Cpu className="h-4 w-4" /> },
          { id: "team", label: "Your Team", icon: <Bot className="h-4 w-4" /> },
          { id: "bestie", label: "Bestie", icon: <Heart className="h-4 w-4" /> },
          { id: "results", label: "Results", icon: <TrendingUp className="h-4 w-4" /> },
          { id: "community", label: "Community", icon: <Users className="h-4 w-4" /> },
          { id: "api", label: "API", icon: <Terminal className="h-4 w-4" /> },
        ]}
      >
        {/* TAB 1: The Engine */}
        <div className="px-4 sm:px-6 py-12 sm:py-20 max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Two modes. You pick.</h2>
          <p className="text-zinc-500 mb-10 max-w-lg">
            Local mode keeps everything on-network. Smart mode adds cloud AI when you opt in.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <Card className="bg-zinc-800/40 border-zinc-700/40 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Cpu className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="font-bold">Stone Engine</p>
                  <p className="text-xs text-zinc-500">Local GPU &middot; All tiers</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {["Sub-100ms first token", "Data never leaves your network", "Unlimited messages, $0 cost", "70B open-weight model"].map((t) => (
                  <div key={t} className="flex items-center gap-2 text-sm text-zinc-300">
                    <Check className="h-4 w-4 text-amber-400 shrink-0" /> {t}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="bg-zinc-800/40 border-zinc-700/40 p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-bold">Smart Mode</p>
                  <p className="text-xs text-zinc-500">Cloud &middot; Opt-in &middot; Builder+</p>
                </div>
              </div>
              <div className="space-y-2.5">
                {["GPT-4o for complex reasoning", "You choose when data goes to cloud", "Daily cap + credit packs", "Clearly labeled in every chat"].map((t) => (
                  <div key={t} className="flex items-center gap-2 text-sm text-zinc-300">
                    <Check className="h-4 w-4 text-blue-400 shrink-0" /> {t}
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center p-5 rounded-xl bg-zinc-800/30 border border-zinc-700/30">
            <span className="text-sm text-zinc-400 shrink-0">Get started:</span>
            <div className="flex flex-wrap gap-2">
              {["Sign up free", "Chat with local AI", "Add Smart mode when ready"].map((step, i) => (
                <span key={step} className="flex items-center gap-1.5 text-sm text-zinc-300">
                  <span className="h-5 w-5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                  {step}
                  {i < 2 && <ChevronRight className="h-3 w-3 text-zinc-600" />}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8 p-5 rounded-xl bg-zinc-800/30 border border-emerald-500/10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
              <div className="flex-1">
                <p className="font-semibold text-sm">Regulated industries</p>
                <p className="text-xs text-zinc-500">Local mode keeps sensitive data on-network. Smart mode is opt-in. You control the boundary.</p>
              </div>
              <Button asChild variant="outline" size="sm" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 shrink-0">
                <Link href="/sign-up">Contact Sales</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* TAB 2: Your Team */}
        <div className="px-4 sm:px-6 py-12 sm:py-20 max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">42 specialists. One platform.</h2>
          <p className="text-zinc-500 mb-10 max-w-lg">
            Domain experts with persistent memory. They produce deliverables, not chat responses.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
            {[
              { icon: Briefcase, title: "Business", count: 14, agents: "Startup, SaaS, Sales, HR, PM, Dispatch, Claims, Compliance", color: "text-blue-400", bg: "bg-blue-500/5" },
              { icon: Pen, title: "Content", count: 7, agents: "YouTube, Studio, Copy, Blog, Translation, Podcast", color: "text-purple-400", bg: "bg-purple-500/5" },
              { icon: BarChart2, title: "Marketing", count: 4, agents: "Digital Marketing, Funnels, Lead Gen, Brand", color: "text-green-400", bg: "bg-green-500/5" },
              { icon: Code, title: "Technical", count: 5, agents: "Web Dev, Code, Automation, Analytics, Cyber", color: "text-amber-400", bg: "bg-amber-500/5" },
              { icon: TrendingUp, title: "Finance", count: 4, agents: "Personal Finance, Trading, Resume, Real Estate", color: "text-emerald-400", bg: "bg-emerald-500/5" },
              { icon: Brain, title: "Wellness", count: 8, agents: "Health Coach, Tutor, Bestie, Writing Coach", color: "text-pink-400", bg: "bg-pink-500/5" },
            ].map((d) => (
              <div key={d.title} className={`rounded-xl ${d.bg} border border-zinc-700/30 p-4`}>
                <div className="flex items-center gap-2 mb-2">
                  <d.icon className={`h-5 w-5 ${d.color}`} />
                  <span className="font-semibold text-sm">{d.title}</span>
                  <span className="text-xs text-zinc-600 ml-auto">{d.count}</span>
                </div>
                <p className="text-xs text-zinc-500">{d.agents}</p>
              </div>
            ))}
          </div>

          <Card className="bg-zinc-800/30 border-zinc-700/30 p-6 mb-8">
            <p className="text-sm font-semibold text-zinc-400 mb-4">Example: Launch a business in 5 days</p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { day: "Mon", agent: "Startup Launcher" },
                { day: "Tue", agent: "Business Plan" },
                { day: "Wed", agent: "Brand Agent" },
                { day: "Thu", agent: "Web Dev" },
                { day: "Fri", agent: "Marketing" },
              ].map((s) => (
                <div key={s.day} className="rounded-lg bg-zinc-700/20 p-3 text-center">
                  <p className="text-[10px] text-zinc-600 uppercase font-semibold">{s.day}</p>
                  <p className="text-xs font-medium text-zinc-300 mt-1">{s.agent}</p>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: Zap, title: "RAG Knowledge", desc: "Industry frameworks & real data.", color: "text-amber-400" },
              { icon: Brain, title: "Memory", desc: "Remembers you across sessions.", color: "text-blue-400" },
              { icon: Terminal, title: "Production Output", desc: "Ship it. Don't edit it.", color: "text-green-400" },
            ].map((f) => (
              <div key={f.title} className="rounded-xl bg-zinc-800/30 border border-zinc-700/30 p-4">
                <f.icon className={`h-5 w-5 ${f.color} mb-2`} />
                <p className="text-sm font-semibold mb-0.5">{f.title}</p>
                <p className="text-xs text-zinc-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* TAB 3: Bestie */}
        <div className="px-4 sm:px-6 py-12 sm:py-20 max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-medium mb-4">
              <Heart className="h-3 w-3" /> AI Companion
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3">
              Your Bestie. <span className="text-pink-400">Everywhere.</span>
            </h2>
            <p className="text-zinc-500 max-w-md mx-auto">
              A personal companion that remembers you across every device and session.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { icon: Laptop, title: "Browser", status: "Live", desc: "Full chat, any device" },
              { icon: Smartphone, title: "Home Screen", status: "Live", desc: "One tap, no app store" },
              { icon: Globe, title: "Sync", status: "Live", desc: "Cross-device memory" },
              { icon: Mic, title: "Voice", status: "Soon", desc: "Web Speech API" },
            ].map((c) => (
              <div key={c.title} className="rounded-xl bg-zinc-800/30 border border-zinc-700/30 p-4 text-center">
                <c.icon className="h-7 w-7 text-pink-400 mx-auto mb-2" />
                <p className="text-sm font-semibold mb-0.5">{c.title}</p>
                <p className="text-[10px] text-zinc-500 mb-2">{c.desc}</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  c.status === "Live" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                }`}>{c.status}</span>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button asChild size="lg" className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 font-semibold px-8">
              <Link href="/sign-up">
                Create Your Bestie <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>

        {/* TAB 4: Results */}
        <div className="px-4 sm:px-6 py-12 sm:py-20 max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Same tasks. 88% less time.</h2>
          <p className="text-zinc-500 mb-10 max-w-lg">Real comparison. One Monday morning.</p>

          <Card className="bg-zinc-800/30 border-zinc-700/30 p-5 sm:p-8 mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-zinc-700/30">
                    <th className="text-left py-3 text-zinc-500 font-medium">Task</th>
                    <th className="text-right py-3 text-zinc-500 font-medium">Manual</th>
                    <th className="text-right py-3 text-amber-400 font-medium">Stone AI</th>
                    <th className="text-right py-3 text-emerald-400 font-medium hidden sm:table-cell">Saved</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { task: "Client proposal", before: "2h 00m", after: "8m", saved: "92%" },
                    { task: "Competitor research", before: "45m", after: "5m", saved: "89%" },
                    { task: "Social media (month)", before: "1h 00m", after: "12m", saved: "80%" },
                    { task: "Report formatting", before: "30m", after: "3m", saved: "90%" },
                    { task: "Email follow-ups", before: "1h 00m", after: "10m", saved: "83%" },
                  ].map((row) => (
                    <tr key={row.task} className="border-b border-zinc-800/30">
                      <td className="py-3 text-zinc-300">{row.task}</td>
                      <td className="py-3 text-right text-zinc-500 font-mono">{row.before}</td>
                      <td className="py-3 text-right text-amber-400 font-mono font-semibold">{row.after}</td>
                      <td className="py-3 text-right text-emerald-400 font-mono hidden sm:table-cell">{row.saved}</td>
                    </tr>
                  ))}
                  <tr className="font-bold">
                    <td className="py-3 text-white">Total</td>
                    <td className="py-3 text-right text-zinc-400 font-mono">5h 15m</td>
                    <td className="py-3 text-right text-amber-400 font-mono">38m</td>
                    <td className="py-3 text-right text-emerald-400 font-mono hidden sm:table-cell">88%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { value: "4h 37m", label: "Saved per day" },
              { value: "23h", label: "Saved per week" },
              { value: "92h", label: "Saved per month" },
              { value: "$0", label: "Local mode cost" },
            ].map((s) => (
              <div key={s.label} className="text-center p-4 rounded-xl bg-zinc-800/30 border border-zinc-700/30">
                <p className="text-xl sm:text-2xl font-bold text-amber-400">{s.value}</p>
                <p className="text-xs text-zinc-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* TAB 5: Community */}
        <div className="px-4 sm:px-6 py-12 sm:py-20 max-w-5xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Builders helping builders.</h2>
          <p className="text-zinc-500 mb-10 max-w-lg">Real strategies. Real results. No fluff.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: MessageSquare, title: "Strategies", desc: "Agent combos and prompt templates.", quote: "Proposal + Sales Agent = $12K in 3 days.", color: "text-blue-400" },
              { icon: Trophy, title: "Wins", desc: "Businesses launched, products shipped.", quote: "SaaS MVP in 2 weeks. First customer day 16.", color: "text-amber-400" },
              { icon: Users, title: "Help", desc: "Ask anything. Get real answers.", quote: "4 detailed agent combos I never considered.", color: "text-green-400" },
            ].map((c) => (
              <Card key={c.title} className="bg-zinc-800/30 border-zinc-700/30 p-5 h-full">
                <c.icon className={`h-6 w-6 ${c.color} mb-3`} />
                <h3 className="font-bold text-sm mb-1">{c.title}</h3>
                <p className="text-xs text-zinc-400 mb-3">{c.desc}</p>
                <p className="text-xs text-zinc-600 italic">&quot;{c.quote}&quot;</p>
              </Card>
            ))}
          </div>

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
              <div key={c.name} className="text-center p-2.5 rounded-lg bg-zinc-800/30 border border-zinc-700/30">
                <c.icon className={`h-4 w-4 ${c.color} mx-auto mb-1`} />
                <p className="text-[11px] text-zinc-400">{c.name}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-500 px-8">
              <Link href="/sign-up">Join <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>

        {/* TAB 6: API */}
        <div className="px-4 sm:px-6 py-12 sm:py-20 max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Build on Stone AI.</h2>
          <p className="text-zinc-500 mb-10 max-w-lg">Pro tier. REST API. White-label. $200/mo flat.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {[
              { title: "3,000+ req/day", desc: "Simple API key auth. Any language." },
              { title: "White-label", desc: "No branding requirement. Your product." },
              { title: "$200/mo flat", desc: "No per-token billing. Predictable costs." },
            ].map((f) => (
              <div key={f.title} className="rounded-xl bg-zinc-800/30 border border-zinc-700/30 p-5">
                <p className="font-bold text-sm text-emerald-400 mb-1">{f.title}</p>
                <p className="text-xs text-zinc-500">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button asChild variant="outline" size="lg" className="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 px-8">
              <Link href="/sign-up">Get API Access <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </LandingTabs>

      <PricingSection />

      {/* Closer — minimal */}
      <section className="px-4 sm:px-6 py-20 sm:py-28 max-w-3xl mx-auto text-center">
        <AnimateOnScroll>
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            42 agents.<br />$0 to start.
          </h2>
          <p className="text-zinc-500 mb-8">No credit card. No trial. No catch.</p>
        </AnimateOnScroll>

        <AnimateOnScroll delay={0.15}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-10 max-w-lg mx-auto">
            {[
              { label: "Agents", live: true },
              { label: "Bestie", live: true },
              { label: "Community", live: true },
              { label: "API", live: true },
              { label: "Cross-Device", live: true },
              { label: "Home Screen", live: true },
              { label: "Voice Chat", live: false },
              { label: "Mobile App", live: false },
            ].map((item) => (
              <div key={item.label} className="text-center py-2 px-3 rounded-lg bg-zinc-800/40 border border-zinc-700/30">
                <p className="text-[11px] text-zinc-400">{item.label}</p>
                <span className={`text-[10px] font-semibold ${item.live ? "text-emerald-400" : "text-amber-400"}`}>
                  {item.live ? "Live" : "Soon"}
                </span>
              </div>
            ))}
          </div>
        </AnimateOnScroll>

        <AnimateOnScroll delay={0.25}>
          <Button asChild size="lg" className="bg-amber-500 text-black hover:bg-amber-400 font-bold text-lg px-10 py-6 h-auto">
            <Link href="/sign-up">
              Start Free <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </AnimateOnScroll>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="col-span-2 md:col-span-1">
            <span className="text-lg font-bold">Stone<span className="text-amber-400">.</span>AI</span>
            <p className="text-xs text-zinc-600 mt-2">Local-first AI infrastructure.</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-400 mb-2">Product</p>
            <ul className="space-y-1.5 text-xs text-zinc-600">
              <li><Link href="/sign-up" className="hover:text-white transition-colors">Agents</Link></li>
              <li><Link href="/sign-up" className="hover:text-white transition-colors">Bestie</Link></li>
              <li><Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-400 mb-2">Company</p>
            <ul className="space-y-1.5 text-xs text-zinc-600">
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><a href="mailto:support@stone-ai.net" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-400 mb-2">Legal</p>
            <ul className="space-y-1.5 text-xs text-zinc-600">
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-6 pt-4 border-t border-zinc-800/50 text-center">
          <span className="text-[10px] text-zinc-700">&copy; 2026 Stone AI&#8482;</span>
        </div>
      </footer>
    </div>
  );
}
