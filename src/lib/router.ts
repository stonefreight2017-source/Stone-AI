import { callModel } from "./llm";
import { loadPrompt } from "./agents";

export interface RouterDecision {
  agent:
    | "general_assistant"
    | "troubleshooting_specialist"
    | "dev_specialist"
    | "billing_specialist"
    | "saas_ops_specialist";
  priority: "low" | "normal" | "high" | "urgent";
  complexity: "low" | "medium" | "high";
  route: "local" | "cloud";
  confidence: number;
  reason: string;
}

function isValidDecision(value: unknown): value is RouterDecision {
  if (!value || typeof value !== "object") return false;

  const d = value as Record<string, unknown>;

  const validAgents = [
    "general_assistant",
    "troubleshooting_specialist",
    "dev_specialist",
    "billing_specialist",
    "saas_ops_specialist",
  ];

  const validPriority = ["low", "normal", "high", "urgent"];
  const validComplexity = ["low", "medium", "high"];
  const validRoute = ["local", "cloud"];

  return (
    validAgents.includes(String(d.agent)) &&
    validPriority.includes(String(d.priority)) &&
    validComplexity.includes(String(d.complexity)) &&
    validRoute.includes(String(d.route)) &&
    typeof d.confidence === "number" &&
    typeof d.reason === "string"
  );
}

export async function getRouterDecision(
  userMessage: string
): Promise<RouterDecision> {
  const routerPrompt = loadPrompt("router.txt");

  const raw = await callModel("local", [
    { role: "system", content: routerPrompt },
    { role: "user", content: userMessage },
  ]);

  const parsed = JSON.parse(raw) as RouterDecision;
  return parsed;
}

export async function safeRouterDecision(
  userMessage: string
): Promise<RouterDecision> {
  try {
    const decision = await getRouterDecision(userMessage);

    if (!isValidDecision(decision)) {
      throw new Error("Invalid router output");
    }

    return decision;
  } catch {
    return {
      agent: "general_assistant",
      priority: "normal",
      complexity: "medium",
      route: "local",
      confidence: 0.5,
      reason: "Router fallback used due to invalid or failed routing output.",
    };
  }
}

interface RuntimeHealth {
  localHealthy: boolean;
  localQueueTooLong: boolean;
}

export function chooseFinalRoute(
  decision: RouterDecision,
  health: RuntimeHealth
): "local" | "cloud" {
  if (!health.localHealthy) return "cloud";
  if (health.localQueueTooLong) return "cloud";
  if (decision.complexity === "high") return "cloud";
  if (decision.priority === "urgent") return "cloud";
  if (decision.confidence < 0.85) return "cloud";

  return decision.route;
}
