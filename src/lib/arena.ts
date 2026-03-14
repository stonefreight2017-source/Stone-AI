import { db } from "@/lib/db";

export async function runArenaMatch(
  queryText: string,
  agentSlugA: string,
  agentSlugB: string
): Promise<{ winner: string; scoreA: number; scoreB: number; reason: string }> {
  const baseUrl = process.env.VLLM_BASE_URL || "http://localhost:8000/v1";
  const model = process.env.VLLM_MODEL || "Qwen/Qwen3-32B-AWQ";

  // Get both agents
  const [agentA, agentB] = await Promise.all([
    db.agent.findUnique({ where: { slug: agentSlugA }, select: { systemPrompt: true } }),
    db.agent.findUnique({ where: { slug: agentSlugB }, select: { systemPrompt: true } }),
  ]);

  const promptA = agentA?.systemPrompt || "You are a helpful assistant.";
  const promptB = agentB?.systemPrompt || "You are a helpful assistant.";

  // Generate both responses in parallel
  const [responseA, responseB] = await Promise.all([
    callVllm(baseUrl, model, promptA, queryText),
    callVllm(baseUrl, model, promptB, queryText),
  ]);

  // Judge
  const judgePrompt = `You are an impartial judge. Compare these two AI responses to the same query and determine which is better.

Query: ${queryText.slice(0, 500)}

Response A:
${responseA.slice(0, 1500)}

Response B:
${responseB.slice(0, 1500)}

Score each response 0.0-1.0 and pick a winner. Respond with ONLY this JSON:
{"winner": "A" or "B", "scoreA": 0.0, "scoreB": 0.0, "reason": "brief explanation"}`;

  const judgeResult = await callVllm(baseUrl, model, "You are an impartial AI judge. Respond only with JSON.", judgePrompt);

  let winner = agentSlugA;
  let scoreA = 0.5;
  let scoreB = 0.5;
  let reason = "Could not parse judge response";

  try {
    const jsonMatch = judgeResult.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      winner = parsed.winner === "B" ? agentSlugB : agentSlugA;
      scoreA = Math.max(0, Math.min(1, parsed.scoreA || 0.5));
      scoreB = Math.max(0, Math.min(1, parsed.scoreB || 0.5));
      reason = parsed.reason || "No reason provided";
    }
  } catch {
    // Use defaults
  }

  // Save to DB
  await db.arenaMatch.create({
    data: {
      queryText,
      agentSlugA,
      agentSlugB,
      responseA,
      responseB,
      winnerSlug: winner,
      judgeScoreA: scoreA,
      judgeScoreB: scoreB,
      judgeReason: reason,
    },
  });

  return { winner, scoreA, scoreB, reason };
}

async function callVllm(
  baseUrl: string,
  model: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
      max_tokens: 1500,
      temperature: 0.7,
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!res.ok) throw new Error(`vLLM returned ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}
