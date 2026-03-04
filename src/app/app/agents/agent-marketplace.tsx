"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Cpu, Layers, Megaphone, Package, Printer, Palette, Target,
  Youtube, PenTool, Film, Smartphone, FileText, Funnel, BarChart2,
  Share2, Type, GraduationCap, Code, Terminal, PieChart, ShieldCheck,
  TrendingUp, UserCheck, Rocket, Building2, HardHat, Bot,
  Lock, Zap, Brain, ArrowRight, Search, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TIER_CONFIG } from "@/lib/tier-config";
import type { Tier } from "@/lib/tier-config";

const ICON_MAP: Record<string, React.ElementType> = {
  cpu: Cpu, layers: Layers, megaphone: Megaphone, package: Package,
  printer: Printer, palette: Palette, target: Target, youtube: Youtube,
  "pen-tool": PenTool, film: Film, smartphone: Smartphone,
  "file-text": FileText, funnel: Funnel, "bar-chart-2": BarChart2,
  "share-2": Share2, type: Type, "graduation-cap": GraduationCap,
  code: Code, terminal: Terminal, "pie-chart": PieChart,
  "shield-check": ShieldCheck, "trending-up": TrendingUp,
  "user-check": UserCheck, rocket: Rocket, "building-2": Building2,
  "hard-hat": HardHat, bot: Bot,
};

const CATEGORY_LABELS: Record<string, string> = {
  BUSINESS: "Business Building",
  CONTENT: "Content & Media",
  MARKETING: "Marketing & Sales",
  EDUCATION: "Education & Community",
  TECHNICAL: "Technical",
  FINANCE: "Finance & Career",
};

const TIER_BADGE_COLOR: Record<string, string> = {
  FREE: "bg-zinc-700 text-zinc-300",
  STARTER: "bg-blue-900/50 text-blue-300",
  PLUS: "bg-indigo-900/50 text-indigo-300",
  SMART: "bg-purple-900/50 text-purple-300",
  PRO: "bg-amber-900/50 text-amber-300",
};

interface AgentData {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  requiredTier: string;
  unlocked: boolean;
  capabilities: string[];
  businessUse: string;
}

export default function AgentMarketplace({ userTier }: { userTier: string }) {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((data) => {
        setAgents(data.agents || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = agents.filter((a) => {
    if (selectedCategory !== "ALL" && a.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.capabilities.some((c) => c.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const categories = ["ALL", ...Object.keys(CATEGORY_LABELS)];

  async function startAgentChat(agentId: string) {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentId }),
    });
    const data = await res.json();
    if (data.conversation) {
      router.push(`/app/chat/${data.conversation.id}`);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-zinc-500">Loading agents...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      {/* Hero */}
      <div className="px-6 pt-8 pb-6 border-b border-zinc-800">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <Bot className="h-8 w-8 text-amber-400" />
            <h1 className="text-2xl font-bold">AI Agent Marketplace</h1>
          </div>
          <p className="text-zinc-400 max-w-2xl mb-2">
            Expert AI agents that don't just chat — they <strong className="text-white">perform tasks</strong>,{" "}
            <strong className="text-white">generate deliverables</strong>, and{" "}
            <strong className="text-white">run business operations</strong>.
            Each agent learns your preferences and gets smarter every session.
          </p>
          <p className="text-sm text-amber-400/80">
            <Zap className="inline h-3.5 w-3.5 mr-1" />
            Use agents to serve clients, build businesses, and automate your workflow.
            They do the work — you deliver the results.
          </p>
        </div>
      </div>

      {/* Educational Banner */}
      <div className="px-6 py-4 bg-blue-950/30 border-b border-blue-900/30">
        <div className="max-w-5xl mx-auto flex items-start gap-3">
          <Brain className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-blue-300 font-medium mb-1">
              These agents actually work. Here's what that means:
            </p>
            <ul className="text-xs text-blue-400/80 space-y-0.5">
              <li>• They write proposals, scripts, ad copy, code, and analysis — not just suggestions</li>
              <li>• They remember your business, clients, and preferences across sessions</li>
              <li>• They learn from every conversation and optimize their output for YOU</li>
              <li>• Use them to serve your own clients and charge for the deliverables they produce</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-zinc-800">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search agents by name, skill, or use case..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
              aria-label="Search agents"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? "bg-amber-600 text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                }`}
              >
                {cat === "ALL" ? "All" : CATEGORY_LABELS[cat] || cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Grid */}
      <div className="px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-xs text-zinc-500 mb-4">
            {filtered.length} agent{filtered.length !== 1 ? "s" : ""} available
            {selectedCategory !== "ALL" && ` in ${CATEGORY_LABELS[selectedCategory]}`}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((agent) => {
              const IconComp = ICON_MAP[agent.icon] || Bot;
              const isExpanded = expandedAgent === agent.id;
              const tierPrice = TIER_CONFIG[agent.requiredTier as Tier]?.price ?? 0;

              return (
                <Card
                  key={agent.id}
                  className={`bg-zinc-900 border-zinc-800 p-4 flex flex-col transition-all ${
                    !agent.unlocked ? "opacity-75" : ""
                  }`}
                >
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`shrink-0 h-10 w-10 rounded-lg flex items-center justify-center ${
                      agent.unlocked ? "bg-amber-900/30" : "bg-zinc-800"
                    }`}>
                      {agent.unlocked ? (
                        <IconComp className="h-5 w-5 text-amber-400" />
                      ) : (
                        <Lock className="h-4 w-4 text-zinc-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{agent.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className={`text-[10px] px-1.5 py-0 ${TIER_BADGE_COLOR[agent.requiredTier]}`}>
                          {agent.requiredTier === "FREE" ? "Free" : `${agent.requiredTier} — $${tierPrice}/mo`}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
                    {agent.description}
                  </p>

                  {/* Capabilities Preview */}
                  {agent.capabilities.length > 0 && (
                    <div className="mb-3">
                      <button
                        onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                        className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition-colors"
                      >
                        <Zap className="h-3 w-3" />
                        What this agent can do
                        <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </button>

                      {isExpanded && (
                        <div className="mt-2 space-y-1.5">
                          {agent.capabilities.map((cap, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className="h-1 w-1 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                              <span className="text-[11px] text-zinc-300">{cap}</span>
                            </div>
                          ))}
                          {agent.businessUse && (
                            <div className="mt-2 p-2 bg-blue-950/30 rounded border border-blue-900/30">
                              <p className="text-[10px] text-blue-400 font-medium mb-1">
                                💼 How to make money with this agent:
                              </p>
                              <p className="text-[10px] text-blue-300/80 leading-relaxed">
                                {agent.businessUse}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action */}
                  <div className="mt-auto pt-2">
                    {agent.unlocked ? (
                      <Button
                        size="sm"
                        className="w-full bg-amber-600 hover:bg-amber-500 text-sm"
                        onClick={() => startAgentChat(agent.id)}
                      >
                        Start Session <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-zinc-700 text-zinc-400 text-sm"
                        onClick={() => router.push("/app/billing")}
                      >
                        <Lock className="mr-1.5 h-3 w-3" />
                        Upgrade to {agent.requiredTier}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 text-zinc-500">
              <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No agents match your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
