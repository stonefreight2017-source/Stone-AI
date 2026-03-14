export async function selfCritique(
  response: string,
  agentSlug: string,
  userQuery: string
): Promise<string> {
  if (process.env.ENABLE_SELF_CRITIQUE !== "true") {
    return response;
  }

  try {
    const baseUrl = process.env.VLLM_BASE_URL || "http://localhost:8000/v1";
    const model = process.env.VLLM_MODEL || "Qwen/Qwen3-32B-AWQ";

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a quality reviewer. Review this AI assistant response for accuracy, helpfulness, professionalism, and safety. If it needs improvement, provide the improved version only. If it is already good, return it exactly unchanged. Do not add commentary.",
          },
          {
            role: "user",
            content: `Original query: ${userQuery}\n\nResponse to review:\n${response}`,
          },
        ],
        max_tokens: 2048,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) return response;

    const data = await res.json();
    const reviewed = data.choices?.[0]?.message?.content?.trim();
    return reviewed || response;
  } catch {
    return response;
  }
}
