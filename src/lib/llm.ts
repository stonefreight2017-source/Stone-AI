type RouteTarget = "local" | "cloud";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function callModel(
  route: RouteTarget,
  messages: ChatMessage[]
): Promise<string> {
  const baseUrl =
    route === "local"
      ? process.env.LOCAL_LLM_URL
      : process.env.CLOUD_LLM_URL;

  const apiKey =
    route === "local"
      ? process.env.LOCAL_LLM_API_KEY
      : process.env.CLOUD_LLM_API_KEY;

  const model =
    route === "local"
      ? process.env.LOCAL_MODEL_NAME
      : process.env.CLOUD_MODEL_NAME;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error(`Model call failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}
