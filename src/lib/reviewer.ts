import { callModel } from "./llm";
import { loadPrompt } from "./agents";
import { RouterDecision } from "./router";

interface ReviewResult {
  status: "approve" | "revise";
  reason: string;
  fix?: string;
}

export function shouldReview(
  decision: RouterDecision,
  finalRoute: "local" | "cloud"
): boolean {
  if (decision.complexity === "high") return true;
  if (finalRoute === "cloud") return true;
  if (decision.confidence < 0.85) return true;
  if (decision.priority === "urgent") return true;

  return false;
}

export async function reviewAnswer(
  userMessage: string,
  draftAnswer: string
): Promise<ReviewResult> {
  const reviewerPrompt = loadPrompt("reviewer.txt");

  const raw = await callModel("local", [
    { role: "system", content: reviewerPrompt },
    {
      role: "user",
      content: `User message:\n${userMessage}\n\nDraft answer:\n${draftAnswer}`,
    },
  ]);

  return JSON.parse(raw) as ReviewResult;
}
