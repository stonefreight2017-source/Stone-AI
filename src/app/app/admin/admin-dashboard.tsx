"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Server,
  Cpu,
  Users,
  MessageSquare,
  Zap,
  AlertTriangle,
  CheckCircle,
  ArrowUpCircle,
  Loader2,
  Brain,
  Gauge,
  Shield,
  Bot,
  TrendingUp,
  TrendingDown,
  BarChart2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface ModelInfo {
  id: string;
  name: string;
  params: string;
  quantization: string;
  vramGb: number;
  strengths: string[];
  benchmarkScore: number;
  speed: "fast" | "medium" | "slow";
  recommended: boolean;
}

interface AdminStatus {
  vllm: {
    online: boolean;
    model: string | null;
    tokensPerSecond: number | null;
    gpuUtilization: number | null;
  };
  model: {
    current: string;
    currentInfo: ModelInfo | null;
    betterAlternatives: ModelInfo[];
    shouldSwitch: boolean;
    switchReason: string | null;
  };
  stats: {
    totalUsers: number;
    totalMessages: number;
    messagesToday: number;
  };
  registry: ModelInfo[];
}

const SPEED_COLORS = {
  fast: "text-green-400",
  medium: "text-amber-400",
  slow: "text-red-400",
};

export function AdminDashboard() {
  const queryClient = useQueryClient();
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery<AdminStatus>({
    queryKey: ["admin-status"],
    queryFn: async () => {
      const res = await fetch("/api/admin/status");
      if (!res.ok) throw new Error("Failed to fetch status");
      return res.json();
    },
    refetchInterval: 10_000,
  });

  const { data: agentData } = useQuery<{
    totalAgentConversations: number;
    totalAgents: number;
    activeAgents: number;
    unusedAgents: number;
    agentUsage: {
      agentId: string;
      slug: string;
      name: string;
      tier: string;
      category: string;
      totalConversations: number;
      last7dConversations: number;
      last30dConversations: number;
      uniqueUsers: number;
    }[];
  }>({
    queryKey: ["admin-agent-analytics"],
    queryFn: async () => {
      const res = await fetch("/api/admin/agents");
      if (!res.ok) throw new Error("Failed to fetch agent analytics");
      return res.json();
    },
    refetchInterval: 60_000, // Poll every 60s
  });

  const deployModel = useMutation({
    mutationFn: async (modelId: string) => {
      const res = await fetch("/api/admin/model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelId }),
      });
      if (!res.ok) throw new Error("Deploy failed");
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Model updated to ${data.modelId}`);
      if (data.instructions) {
        data.instructions.forEach((i: string) => toast.info(i, { duration: 10000 }));
      }
      queryClient.invalidateQueries({ queryKey: ["admin-status"] });
      setSelectedModel(null);
    },
    onError: () => toast.error("Failed to deploy model"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-full text-red-400">
        Failed to load admin dashboard
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Server className="h-4 w-4 text-zinc-500" />
              <span className="text-xs text-zinc-500">vLLM Status</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "h-2.5 w-2.5 rounded-full",
                  data.vllm.online ? "bg-green-400" : "bg-red-400"
                )}
              />
              <span className="font-semibold">
                {data.vllm.online ? "Online" : "Offline"}
              </span>
            </div>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-zinc-500" />
              <span className="text-xs text-zinc-500">Total Users</span>
            </div>
            <span className="text-2xl font-bold">{data.stats.totalUsers}</span>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="h-4 w-4 text-zinc-500" />
              <span className="text-xs text-zinc-500">Messages Today</span>
            </div>
            <span className="text-2xl font-bold">
              {data.stats.messagesToday}
            </span>
          </Card>
          <Card className="bg-zinc-900 border-zinc-800 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-zinc-500" />
              <span className="text-xs text-zinc-500">Tokens/sec</span>
            </div>
            <span className="text-2xl font-bold">
              {data.vllm.tokensPerSecond?.toFixed(1) ?? "—"}
            </span>
          </Card>
        </div>

        {/* Should Switch Alert */}
        {data.model.shouldSwitch && (
          <Card className="bg-amber-900/20 border-amber-800 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-300">
                  Better model available
                </h3>
                <p className="text-sm text-amber-400/80 mt-1">
                  {data.model.switchReason}
                </p>
                <Button
                  size="sm"
                  className="mt-3 bg-amber-600 hover:bg-amber-500"
                  onClick={() =>
                    setSelectedModel(data.model.betterAlternatives[0]?.id ?? null)
                  }
                >
                  <ArrowUpCircle className="h-4 w-4 mr-2" />
                  View Upgrade
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Current Model */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Current Model</h2>
          <Card className="bg-zinc-900 border-zinc-800 p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Cpu className="h-5 w-5 text-blue-400" />
                  <span className="font-semibold text-lg">
                    {data.model.currentInfo?.name ?? data.model.current}
                  </span>
                  {!data.model.shouldSwitch && (
                    <Badge className="bg-green-900/50 text-green-300 border-green-800 text-[10px]">
                      <CheckCircle className="h-3 w-3 mr-1" /> Best Available
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-zinc-400 mt-1">
                  {data.model.current}
                </p>
                {data.model.currentInfo && (
                  <div className="flex flex-wrap gap-3 mt-3 text-sm">
                    <span className="text-zinc-400">
                      <Brain className="h-3.5 w-3.5 inline mr-1" />
                      {data.model.currentInfo.params} params
                    </span>
                    <span className="text-zinc-400">
                      <Gauge className="h-3.5 w-3.5 inline mr-1" />
                      Score: {data.model.currentInfo.benchmarkScore}/100
                    </span>
                    <span
                      className={SPEED_COLORS[data.model.currentInfo.speed]}
                    >
                      <Zap className="h-3.5 w-3.5 inline mr-1" />
                      {data.model.currentInfo.speed}
                    </span>
                    <span className="text-zinc-400">
                      <Shield className="h-3.5 w-3.5 inline mr-1" />
                      {data.model.currentInfo.vramGb}GB VRAM
                    </span>
                  </div>
                )}
                {data.model.currentInfo?.strengths && (
                  <div className="flex gap-1.5 mt-3">
                    {data.model.currentInfo.strengths.map((s) => (
                      <Badge
                        key={s}
                        className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px]"
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {data.vllm.gpuUtilization !== null && (
                <div className="text-right">
                  <span className="text-xs text-zinc-500">GPU Cache</span>
                  <p className="text-lg font-bold">
                    {data.vllm.gpuUtilization.toFixed(0)}%
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>

        <Separator className="bg-zinc-800" />

        {/* Model Registry */}
        <div>
          <h2 className="text-lg font-semibold mb-1">Model Intelligence</h2>
          <p className="text-sm text-zinc-500 mb-4">
            Curated models optimized for your RTX 5090. Sorted by benchmark
            score.
          </p>

          <div className="space-y-3">
            {data.registry
              .sort((a, b) => b.benchmarkScore - a.benchmarkScore)
              .map((model) => {
                const isCurrent = model.id === data.model.current;
                const isSelected = selectedModel === model.id;

                return (
                  <Card
                    key={model.id}
                    className={cn(
                      "bg-zinc-900 border-zinc-800 p-4 transition-colors",
                      isSelected && "ring-2 ring-blue-500",
                      isCurrent && "border-green-800/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{model.name}</span>
                          <span
                            className={cn(
                              "text-xs font-bold",
                              model.benchmarkScore >= 85
                                ? "text-green-400"
                                : model.benchmarkScore >= 80
                                  ? "text-amber-400"
                                  : "text-zinc-500"
                            )}
                          >
                            {model.benchmarkScore}/100
                          </span>
                          <span
                            className={cn(
                              "text-xs",
                              SPEED_COLORS[model.speed]
                            )}
                          >
                            {model.speed}
                          </span>
                          {isCurrent && (
                            <Badge className="bg-green-900/50 text-green-300 text-[10px]">
                              Active
                            </Badge>
                          )}
                          {model.recommended && (
                            <Badge className="bg-blue-900/50 text-blue-300 text-[10px]">
                              Recommended
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1">
                          {model.params} | {model.quantization} |{" "}
                          {model.vramGb}GB VRAM |{" "}
                          {model.strengths.join(", ")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!isCurrent && (
                          <Button
                            size="sm"
                            variant={isSelected ? "default" : "outline"}
                            className={
                              isSelected
                                ? "bg-blue-600 hover:bg-blue-500"
                                : "border-zinc-700"
                            }
                            disabled={deployModel.isPending}
                            onClick={() => {
                              if (isSelected) {
                                deployModel.mutate(model.id);
                              } else {
                                setSelectedModel(model.id);
                              }
                            }}
                          >
                            {deployModel.isPending &&
                            isSelected ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : null}
                            {isSelected ? "Confirm Deploy" : "Deploy"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>

        {/* Agent Usage Analytics */}
        {agentData && (
          <>
            <Separator className="bg-zinc-800" />
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-amber-400" />
                  Agent Usage Analytics
                </h2>
                <div className="flex gap-3 text-xs text-zinc-500">
                  <span>{agentData.totalAgents} total</span>
                  <span className="text-green-400">{agentData.activeAgents} active</span>
                  <span className="text-zinc-600">{agentData.unusedAgents} unused</span>
                </div>
              </div>

              {/* Top stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <Card className="bg-zinc-900 border-zinc-800 p-3">
                  <p className="text-[10px] text-zinc-500 uppercase">Total Agent Conversations</p>
                  <p className="text-xl font-bold">{agentData.totalAgentConversations}</p>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800 p-3">
                  <p className="text-[10px] text-zinc-500 uppercase">Active Agents (1+ convos)</p>
                  <p className="text-xl font-bold text-green-400">{agentData.activeAgents}</p>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800 p-3">
                  <p className="text-[10px] text-zinc-500 uppercase">Unused Agents</p>
                  <p className="text-xl font-bold text-zinc-600">{agentData.unusedAgents}</p>
                </Card>
              </div>

              {/* Agent table */}
              <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800 text-xs text-zinc-500">
                        <th className="text-left p-3 font-medium">Agent</th>
                        <th className="text-left p-3 font-medium">Tier</th>
                        <th className="text-right p-3 font-medium">Total</th>
                        <th className="text-right p-3 font-medium">7d</th>
                        <th className="text-right p-3 font-medium">30d</th>
                        <th className="text-right p-3 font-medium">Users</th>
                        <th className="text-right p-3 font-medium">Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agentData.agentUsage
                        .sort((a, b) => b.totalConversations - a.totalConversations)
                        .map((agent) => {
                          const trend = agent.last30dConversations > 0
                            ? ((agent.last7dConversations / (agent.last30dConversations / 4.3)) * 100 - 100)
                            : 0;
                          return (
                            <tr key={agent.agentId} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <Bot className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                                  <span className={agent.totalConversations === 0 ? "text-zinc-600" : "text-zinc-200"}>
                                    {agent.name}
                                  </span>
                                </div>
                              </td>
                              <td className="p-3">
                                <Badge className={cn("text-[10px] px-1.5 py-0", {
                                  "bg-zinc-700 text-zinc-300": agent.tier === "FREE",
                                  "bg-blue-900/50 text-blue-300": agent.tier === "STARTER",
                                  "bg-purple-900/50 text-purple-300": agent.tier === "PLUS",
                                  "bg-amber-900/50 text-amber-300": agent.tier === "SMART",
                                  "bg-red-900/50 text-red-300": agent.tier === "PRO",
                                })}>
                                  {agent.tier}
                                </Badge>
                              </td>
                              <td className="p-3 text-right font-mono">{agent.totalConversations}</td>
                              <td className="p-3 text-right font-mono">{agent.last7dConversations}</td>
                              <td className="p-3 text-right font-mono">{agent.last30dConversations}</td>
                              <td className="p-3 text-right font-mono">{agent.uniqueUsers}</td>
                              <td className="p-3 text-right">
                                {agent.totalConversations > 0 ? (
                                  <span className={cn("flex items-center justify-end gap-1 text-xs", {
                                    "text-green-400": trend > 0,
                                    "text-red-400": trend < 0,
                                    "text-zinc-500": trend === 0,
                                  })}>
                                    {trend > 0 ? <TrendingUp className="h-3 w-3" /> : trend < 0 ? <TrendingDown className="h-3 w-3" /> : null}
                                    {trend > 0 ? "+" : ""}{trend.toFixed(0)}%
                                  </span>
                                ) : (
                                  <span className="text-zinc-700 text-xs">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </>
        )}

        {/* Guide Section */}
        <Separator className="bg-zinc-800" />
        <div>
          <h2 className="text-lg font-semibold mb-3">Quick Guide</h2>
          <Card className="bg-zinc-900 border-zinc-800 p-5 space-y-4 text-sm text-zinc-400">
            <div>
              <h4 className="font-medium text-zinc-200 mb-1">
                When should I switch models?
              </h4>
              <p>
                Watch the "Better model available" alert above. It appears when a
                model in our registry scores 3+ points higher than your current
                model. Higher score = smarter answers.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-zinc-200 mb-1">
                What do the scores mean?
              </h4>
              <p>
                Benchmark scores combine performance across reasoning, code,
                math, and general knowledge. 90+ is frontier-class. 80-89 is
                excellent. Below 80 is outdated.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-zinc-200 mb-1">
                Speed vs Intelligence tradeoff?
              </h4>
              <p>
                Larger models (123B) are smarter but slower. Smaller quantized
                models (67B) are faster but slightly less capable. For most
                users, 70B Q4 is the sweet spot on RTX 5090.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-zinc-200 mb-1">
                How do I deploy a new model?
              </h4>
              <ol className="list-decimal list-inside space-y-1 mt-1">
                <li>Click "Deploy" on the model you want</li>
                <li>Click "Confirm Deploy" to update the config</li>
                <li>
                  Follow the restart instructions (restart vLLM with the new
                  model ID)
                </li>
                <li>The dashboard will update once the new model is online</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium text-zinc-200 mb-1">
                How do I know if a new model exists?
              </h4>
              <p>
                This registry is updated with each Stone AI release. Check back
                periodically, or watch for the yellow alert banner at the top of
                this page.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
