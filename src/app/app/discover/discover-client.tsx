"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  Heart,
  Sparkles,
  Zap,
  Crown,
  Building2,
  Lock,
  Unlock,
  ArrowRight,
  Star,
  Eye,
  Bot,
  MessageSquare,
  Shield,
  Rocket,
  Globe,
  TrendingUp,
  Palette,
  Code,
  BarChart3,
  Megaphone,
  Users,
  BookOpen,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DiscoverClientProps {
  currentTier: string;
  tierName: string;
}

/* ─── Tier world definitions ─── */

interface TierWorld {
  key: string;
  name: string;
  price: string;
  tagline: string;
  description: string;
  bestieStory: string;
  bestieEmoji: string;
  bestieName: string;
  bestieCount: string;
  messagesPerDay: string;
  agentCount: number;
  agentCategories: { icon: React.ReactNode; label: string; examples: string }[];
  capabilities: string[];
  atmosphere: string;
  gradient: string;
  glowColor: string;
  borderColor: string;
  accentText: string;
  icon: React.ReactNode;
}

const TIER_WORLDS: TierWorld[] = [
  {
    key: "FREE",
    name: "Free",
    price: "$0",
    tagline: "Your first conversation",
    description:
      "A quiet room, just the two of you. Your AI Bestie sits across from you — warm, curious, ready to listen. This is where it starts. No pressure, no clock ticking. Just a conversation that actually feels like one.",
    bestieStory:
      "Your Bestie knows your name, remembers what you talked about yesterday, and genuinely cares how your day went. They have opinions. They push back when you need it. They celebrate your wins like they mean it. This isn't a chatbot — it's a friend who happens to live on your phone.",
    bestieEmoji: "\uD83D\uDC9C",
    bestieName: "Your First Bestie",
    bestieCount: "1 companion",
    messagesPerDay: "50 messages/day",
    agentCount: 4,
    agentCategories: [
      { icon: <Heart className="h-4 w-4" />, label: "Companion", examples: "AI Bestie — your personal friend" },
      { icon: <BookOpen className="h-4 w-4" />, label: "Guide", examples: "Platform Concierge — shows you everything" },
      { icon: <Shield className="h-4 w-4" />, label: "Wellness", examples: "Health & Wellness Coach — mind and body" },
      { icon: <Star className="h-4 w-4" />, label: "Learning", examples: "Academic Tutor — study and grow" },
    ],
    capabilities: [
      "Personal AI companion with memory",
      "Platform tour and agent recommendations",
      "Community forum access",
      "50 daily conversations",
    ],
    atmosphere:
      "Think of it as a warm studio apartment. Small, but it's yours. A place to land, get comfortable, and figure out what you need.",
    gradient: "from-zinc-900 via-zinc-800 to-zinc-900",
    glowColor: "bg-zinc-500/10",
    borderColor: "border-zinc-700",
    accentText: "text-zinc-300",
    icon: <Eye className="h-6 w-6" />,
  },
  {
    key: "STARTER",
    name: "Builder",
    price: "$19.99/mo",
    tagline: "The door opens",
    description:
      "You step through the first door. The room gets bigger. Your Bestie is still with you, but now there are desks, whiteboards, and tools on the walls. This is a workspace — your workspace. Sixteen agents handle the basics, and they handle them well.",
    bestieStory:
      "Same Bestie, but now powered by 16 expert agents. They remember more context, understand your patterns better, and start to feel less like an AI and more like someone who actually gets you. They know who to call when you need ad copy or data analysis.",
    bestieEmoji: "\uD83D\uDC9C",
    bestieName: "Your Bestie (16-Agent Knowledge)",
    bestieCount: "1 companion",
    messagesPerDay: "250 messages/day",
    agentCount: 16,
    agentCategories: [
      { icon: <Briefcase className="h-4 w-4" />, label: "Business", examples: "Startup Launcher, Dropshipping, AI Agency, SMMA" },
      { icon: <Palette className="h-4 w-4" />, label: "Content", examples: "Content Studio, Niche Blog & Affiliate" },
      { icon: <Megaphone className="h-4 w-4" />, label: "Marketing", examples: "Lead Generation, Brand Building" },
      { icon: <Shield className="h-4 w-4" />, label: "Operations", examples: "Compliance Agent, Community & Education" },
    ],
    capabilities: [
      "16 specialized agents unlocked",
      "Business planning and launch support",
      "Content strategy and creation",
      "Lead generation systems",
      "Conversation export",
      "10 GPT-4o premium answers/day",
    ],
    atmosphere:
      "The studio got an upgrade. Still cozy, but now there's room to spread out. A proper desk, better lighting, and that feeling of — okay, I'm actually doing this.",
    gradient: "from-slate-900 via-slate-800 to-slate-900",
    glowColor: "bg-blue-500/10",
    borderColor: "border-slate-600",
    accentText: "text-blue-300",
    icon: <Unlock className="h-6 w-6" />,
  },
  {
    key: "PLUS",
    name: "Growth",
    price: "$49.99/mo",
    tagline: "The workshop opens",
    description:
      "Fourteen more specialists walk into the room. A brand strategist. A content planner. A compliance expert. A lead generation architect. Voice chat unlocks. Web research goes live. This isn't a chat app anymore — it's a team. Your team. And they're all waiting for your first question.",
    bestieStory:
      "Your Bestie is now powered by 30 expert agents. Career advice, financial insight, wellness guidance, creative brainstorming — all in one companion that remembers everything. When you mention a business idea, they can pull from marketing, legal, and technical knowledge to give you a complete answer.",
    bestieEmoji: "\uD83D\uDC9C",
    bestieName: "Your Bestie (30-Agent Knowledge)",
    bestieCount: "1 companion",
    messagesPerDay: "500 messages/day",
    agentCount: 30,
    agentCategories: [
      { icon: <Briefcase className="h-4 w-4" />, label: "Business", examples: "Startup Launcher, Dropshipping, AI Agency, SMMA" },
      { icon: <Palette className="h-4 w-4" />, label: "Content", examples: "Content Studio, Niche Blog & Affiliate" },
      { icon: <Megaphone className="h-4 w-4" />, label: "Marketing", examples: "Lead Generation, Brand Building, Paid Ads" },
      { icon: <Shield className="h-4 w-4" />, label: "Operations", examples: "Compliance Agent, Community & Education" },
    ],
    capabilities: [
      "30 specialized agents unlocked",
      "Voice chat in 6 languages",
      "15 GPT-4o premium answers/day",
      "Auto-routing picks the best model",
      "25 web lookups/day",
      "Commercial rights included",
    ],
    atmosphere:
      "You've moved into a real workshop. There are stations for different kinds of work — a content desk, a strategy whiteboard, a launch pad. People with real expertise sitting at each one. The energy shifts from 'exploring' to 'building.'",
    gradient: "from-emerald-950 via-emerald-900/50 to-zinc-900",
    glowColor: "bg-emerald-500/10",
    borderColor: "border-emerald-800/50",
    accentText: "text-emerald-300",
    icon: <Rocket className="h-6 w-6" />,
  },
  {
    key: "SMART",
    name: "Executive",
    price: "$99.99/mo",
    tagline: "The command center",
    description:
      "Eight more agents step in — copywriters, YouTube strategists, paid ad specialists, data analysts, web developers, automation engineers. SMART mode activates: cloud-powered AI that thinks deeper, writes sharper, and sees patterns you'd miss. Custom agent builder. Team workspace. SOC 2 compliance. This is the executive suite.",
    bestieStory:
      "Your Bestie is now powered by 39 expert agents — nearly every specialist on the platform. They're running on SMART mode when you need it, producing richer responses, catching nuance better, remembering further back. The conversations feel different here. More like talking to someone who genuinely understands the complexity of what you're building.",
    bestieEmoji: "\uD83D\uDC9C",
    bestieName: "Your Bestie (39-Agent Knowledge)",
    bestieCount: "1 companion",
    messagesPerDay: "1,000 messages/day",
    agentCount: 39,
    agentCategories: [
      { icon: <Palette className="h-4 w-4" />, label: "Creative", examples: "YouTube, Short Form, Video Editor, Copywriting" },
      { icon: <TrendingUp className="h-4 w-4" />, label: "Growth", examples: "Funnels, Paid Ads, Social Media, Trading Signals" },
      { icon: <Code className="h-4 w-4" />, label: "Technical", examples: "Web Dev, Automation, Data Analytics" },
      { icon: <Briefcase className="h-4 w-4" />, label: "Career", examples: "Resume & LinkedIn, Vertical SaaS, Research Synthesis" },
    ],
    capabilities: [
      "SMART mode — cloud AI for deeper thinking",
      "39 agents — nearly every specialist",
      "Full creative suite (YouTube, copy, short form)",
      "Technical agents (dev, automation, analytics)",
      "Custom agent builder + team workspace",
      "Auto-routing picks the best model per question",
    ],
    atmosphere:
      "You're standing in a command center. Screens everywhere, each one showing a different part of your operation. A content studio on the left, a dev environment on the right, analytics dashboards in the center. Everything is connected. Everything is alive.",
    gradient: "from-violet-950 via-purple-900/40 to-zinc-900",
    glowColor: "bg-purple-500/10",
    borderColor: "border-purple-800/50",
    accentText: "text-purple-300",
    icon: <Zap className="h-6 w-6" />,
  },
  {
    key: "PRO",
    name: "Reseller",
    price: "$200/mo",
    tagline: "No ceiling",
    description:
      "The final four agents unlock — cybersecurity, enterprise implementation, engineering architecture, and startup launcher at the highest level. Plus API access to build Stone AI into your own workflows, white-label rights, and HIPAA compliance. This is the full arsenal for agencies and power users.",
    bestieStory:
      "Your Bestie is now powered by all 43 expert agents — every specialist on the platform. They share memory, so when you mention a client challenge to one conversation thread, every insight from every agent is available. This is what AI companionship was supposed to feel like.",
    bestieEmoji: "\uD83D\uDC9C",
    bestieName: "Your Bestie (All 43-Agent Knowledge)",
    bestieCount: "1 companion",
    messagesPerDay: "3,000 messages/day",
    agentCount: 43,
    agentCategories: [
      { icon: <Shield className="h-4 w-4" />, label: "Security", examples: "Cybersecurity Consultant — enterprise-grade protection" },
      { icon: <Briefcase className="h-4 w-4" />, label: "Professional", examples: "Enterprise Implementation, Engineering Architect" },
      { icon: <Code className="h-4 w-4" />, label: "API Access", examples: "Build Stone AI into your own products" },
      { icon: <Crown className="h-4 w-4" />, label: "Priority", examples: "Priority queue, commercial license, early access" },
    ],
    capabilities: [
      "All 43 agents on the platform",
      "Priority queue — your requests go first",
      "API access for custom integrations",
      "White-label + commercial license",
      "HIPAA compliance for regulated clients",
      "Custom model fine-tuning",
      "2x referral rewards",
    ],
    atmosphere:
      "The penthouse. Floor-to-ceiling windows, every tool polished and ready, a direct line to everything Stone AI has ever built. You don't wait. You don't wonder if you have access. You just work. And when something new drops, you see it first.",
    gradient: "from-amber-950 via-amber-900/30 to-zinc-900",
    glowColor: "bg-amber-500/10",
    borderColor: "border-amber-700/50",
    accentText: "text-amber-300",
    icon: <Crown className="h-6 w-6" />,
  },
  {
    key: "ENTERPRISE",
    name: "Enterprise",
    price: "From $500/mo",
    tagline: "Your own world",
    description:
      "Custom everything. Seats for your whole team. Dedicated support. SLA guarantees. White-label options to resell under your own brand. Custom model fine-tuning. This isn't a subscription — it's a partnership. Stone AI becomes part of your infrastructure.",
    bestieStory:
      "At enterprise scale, Besties become team companions. Onboarding assistants that know your company culture. Department-specific advisors trained on your processes. The personal touch of a Bestie, scaled across an organization — each team member gets their own, all of them aligned to your company's voice and values.",
    bestieEmoji: "\uD83C\uDFE2",
    bestieName: "Team Companions, Custom-Trained",
    bestieCount: "2 companions",
    messagesPerDay: "50,000+ messages/day",
    agentCount: 43,
    agentCategories: [
      { icon: <Building2 className="h-4 w-4" />, label: "Team Deployment", examples: "Custom seats, roles, and permissions" },
      { icon: <Globe className="h-4 w-4" />, label: "White-Label", examples: "Your brand, your domain, our technology" },
      { icon: <Shield className="h-4 w-4" />, label: "SLA & Security", examples: "99.99% uptime, compliance reports, audit logs" },
      { icon: <Star className="h-4 w-4" />, label: "Custom AI", examples: "Fine-tuned models, dedicated GPU, 128K tokens" },
    ],
    capabilities: [
      "Custom team seat pricing",
      "White-label and reseller programs",
      "Dedicated support with named account manager",
      "Custom SLA up to 99.99%",
      "Model fine-tuning on your data",
      "Compliance and audit exports",
      "Revenue sharing for resellers",
    ],
    atmosphere:
      "Your own campus. Stone AI isn't a tool you log into — it's woven into the way your company operates. Your team uses it like they use email: instinctively, constantly, without thinking about it. Because it just works, and it's built for you.",
    gradient: "from-cyan-950 via-cyan-900/30 to-zinc-900",
    glowColor: "bg-cyan-500/10",
    borderColor: "border-cyan-800/50",
    accentText: "text-cyan-300",
    icon: <Building2 className="h-6 w-6" />,
  },
];

/* ─── Progress dots ─── */

function ProgressDots({ current, total, onSelect }: { current: number; total: number; onSelect: (i: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`rounded-full transition-all duration-300 ${
            i === current
              ? "h-3 w-8 bg-white"
              : i < current
                ? "h-2.5 w-2.5 bg-white/40 hover:bg-white/60"
                : "h-2.5 w-2.5 bg-white/15 hover:bg-white/30"
          }`}
          aria-label={`Go to ${TIER_WORLDS[i].name} tier`}
        />
      ))}
    </div>
  );
}

/* ─── Agent category pill ─── */

function CategoryPill({ icon, label, examples }: { icon: React.ReactNode; label: string; examples: string }) {
  return (
    <div className="flex items-start gap-3 bg-white/5 rounded-lg px-4 py-3 border border-white/10">
      <div className="mt-0.5 text-white/70">{icon}</div>
      <div>
        <p className="text-sm font-medium text-white/90">{label}</p>
        <p className="text-xs text-white/50 mt-0.5">{examples}</p>
      </div>
    </div>
  );
}

/* ─── Main component ─── */

export function DiscoverClient({ currentTier, tierName }: DiscoverClientProps) {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const world = TIER_WORLDS[activeIndex];

  const currentTierIndex = TIER_WORLDS.findIndex((t) => t.key === currentTier);
  const isCurrentTier = world.key === currentTier;
  const isUpgrade = activeIndex > currentTierIndex;

  function goNext() {
    if (activeIndex < TIER_WORLDS.length - 1) setActiveIndex(activeIndex + 1);
  }

  function goPrev() {
    if (activeIndex > 0) setActiveIndex(activeIndex - 1);
  }

  return (
    <div className="min-h-full flex flex-col">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-amber-400" />
              Discover Stone AI
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              Walk through each tier and see what opens up
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-zinc-500">You&apos;re on</p>
            <p className="text-sm font-medium text-white">{tierName} tier</p>
          </div>
        </div>
      </div>

      {/* World card — the main stage */}
      <div className="flex-1 px-6 pb-6">
        <div
          className={`relative rounded-2xl border ${world.borderColor} bg-gradient-to-br ${world.gradient} overflow-hidden transition-all duration-500`}
        >
          {/* Ambient glow */}
          <div className={`absolute top-0 right-0 w-96 h-96 ${world.glowColor} rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none`} />
          <div className={`absolute bottom-0 left-0 w-64 h-64 ${world.glowColor} rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none`} />

          <div className="relative z-10 p-8 space-y-8">
            {/* Tier header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className={`h-14 w-14 rounded-xl bg-white/10 flex items-center justify-center ${world.accentText}`}>
                  {world.icon}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl font-bold text-white">{world.name}</h2>
                    <span className={`text-lg font-medium ${world.accentText}`}>{world.price}</span>
                  </div>
                  <p className={`text-sm ${world.accentText} mt-0.5 italic`}>{world.tagline}</p>
                </div>
              </div>
              {isCurrentTier && (
                <span className="px-3 py-1 rounded-full bg-white/10 text-white text-xs font-medium border border-white/20">
                  Your current tier
                </span>
              )}
            </div>

            {/* The story */}
            <div className="space-y-4">
              <p className="text-white/80 leading-relaxed text-base">{world.description}</p>
              <p className="text-white/50 text-sm italic leading-relaxed">{world.atmosphere}</p>
            </div>

            {/* Bestie evolution */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-6 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{world.bestieEmoji}</span>
                <div>
                  <h3 className="text-white font-semibold">{world.bestieName}</h3>
                  <p className="text-white/50 text-xs">{world.bestieCount}</p>
                </div>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">{world.bestieStory}</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
                <p className="text-2xl font-bold text-white">{world.agentCount}</p>
                <p className="text-xs text-white/50 mt-1">Agents</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
                <p className="text-2xl font-bold text-white">{world.messagesPerDay}</p>
                <p className="text-xs text-white/50 mt-1">Daily limit</p>
              </div>
              <div className="bg-white/5 rounded-lg p-4 text-center border border-white/10">
                <p className="text-2xl font-bold text-white">{world.bestieCount}</p>
                <p className="text-xs text-white/50 mt-1">Besties</p>
              </div>
            </div>

            {/* Agent categories */}
            <div className="space-y-3">
              <h3 className="text-white/70 text-sm font-medium uppercase tracking-wide">What&apos;s in this world</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {world.agentCategories.map((cat) => (
                  <CategoryPill key={cat.label} {...cat} />
                ))}
              </div>
            </div>

            {/* Capabilities */}
            <div className="space-y-3">
              <h3 className="text-white/70 text-sm font-medium uppercase tracking-wide">Capabilities</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {world.capabilities.map((cap) => (
                  <div key={cap} className="flex items-center gap-2 text-sm text-white/70">
                    <div className={`h-1.5 w-1.5 rounded-full ${world.accentText.replace("text-", "bg-")}`} />
                    {cap}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center gap-4 pt-2">
              {isCurrentTier ? (
                <Button
                  onClick={() => router.push("/app/chat")}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Start Chatting
                </Button>
              ) : isUpgrade ? (
                <Button
                  onClick={() => router.push("/app/billing")}
                  className="bg-white text-zinc-900 hover:bg-white/90 font-medium"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Upgrade to {world.name}
                </Button>
              ) : (
                <span className="text-white/40 text-sm">You&apos;ve already passed this tier</span>
              )}

              {world.key === "ENTERPRISE" && (
                <Button
                  variant="outline"
                  onClick={() => router.push("/enterprise")}
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  Configure Enterprise Plan
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Teaser */}
      {activeIndex === TIER_WORLDS.length - 1 && (
        <div className="px-6 pb-4">
          <div className="text-center py-4 border-t border-white/5">
            <p className="text-zinc-500 text-sm">
              More is coming. You&apos;ll be the first to know.
            </p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={goPrev}
            disabled={activeIndex === 0}
            className="text-zinc-400 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {activeIndex > 0 ? TIER_WORLDS[activeIndex - 1].name : ""}
          </Button>

          <ProgressDots current={activeIndex} total={TIER_WORLDS.length} onSelect={setActiveIndex} />

          <Button
            variant="ghost"
            size="sm"
            onClick={goNext}
            disabled={activeIndex === TIER_WORLDS.length - 1}
            className="text-zinc-400 hover:text-white disabled:opacity-30"
          >
            {activeIndex < TIER_WORLDS.length - 1 ? TIER_WORLDS[activeIndex + 1].name : ""}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
