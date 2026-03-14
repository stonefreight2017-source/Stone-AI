import { db } from "@/lib/db";

export async function scoreResponse(
  userMessage: string,
  assistantMessage: string,
  agentSlug: string,
  messageId: string
): Promise<void> {
  if (process.env.ENABLE_QUALITY_SCORING !== "true") return;

  try {
    const prompt = `You are an AI response quality judge. Score the following AI assistant response on these criteria (0.0 to 1.0):
- relevance: How relevant is the response to the user's question?
- accuracy: How accurate and factual is the response?
- completeness: How thorough and complete is the response?
- tone: How professional and appropriate is the tone?

User message: ${userMessage.slice(0, 500)}

Assistant response: ${assistantMessage.slice(0, 1500)}

Respond with ONLY a JSON object, no other text:
{"relevance": 0.0, "accuracy": 0.0, "completeness": 0.0, "tone": 0.0}`;

    let scores: { relevance: number; accuracy: number; completeness: number; tone: number } | null = null;

    // Primary: Groq (different model = more honest scores)
    const groqKey = process.env.GROQ_API_KEY;
    if (groqKey) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 200,
            temperature: 0.1,
          }),
          signal: AbortSignal.timeout(15000),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content?.trim() || "";
          const jsonMatch = text.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            scores = JSON.parse(jsonMatch[0]);
          }
        }
      } catch {
        // Fall through to vLLM
      }
    }

    // Fallback: local vLLM
    if (!scores) {
      try {
        const baseUrl = process.env.VLLM_BASE_URL || "http://localhost:8000/v1";
        const model = process.env.VLLM_MODEL || "Qwen/Qwen3-32B-AWQ";

        const res = await fetch(`${baseUrl}/chat/completions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 200,
            temperature: 0.1,
          }),
          signal: AbortSignal.timeout(30000),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.choices?.[0]?.message?.content?.trim() || "";
          const jsonMatch = text.match(/\{[\s\S]*?\}/);
          if (jsonMatch) {
            scores = JSON.parse(jsonMatch[0]);
          }
        }
      } catch {
        // Give up
      }
    }

    if (!scores) return;

    const relevance = Math.max(0, Math.min(1, scores.relevance || 0));
    const accuracy = Math.max(0, Math.min(1, scores.accuracy || 0));
    const completeness = Math.max(0, Math.min(1, scores.completeness || 0));
    const tone = Math.max(0, Math.min(1, scores.tone || 0));
    const overallScore = relevance * 0.3 + accuracy * 0.3 + completeness * 0.2 + tone * 0.2;

    await db.qualityScore.create({
      data: {
        messageId,
        agentSlug,
        relevance,
        accuracy,
        completeness,
        tone,
        overallScore,
        flagged: overallScore < 0.5,
      },
    });
  } catch (error) {
    console.warn("[quality-scorer] Error:", error instanceof Error ? error.message : error);
  }
}
