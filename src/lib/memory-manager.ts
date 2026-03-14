import { db } from "@/lib/db";

export async function getWorkingMemory(agentId: string, userId: string) {
  return db.agentMemoryLong.findMany({
    where: { agentId, userId, tier: "working" },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });
}

export async function saveWorkingMemory(
  agentId: string,
  userId: string,
  key: string,
  value: string
): Promise<void> {
  await db.agentMemoryLong.upsert({
    where: { agentId_userId_key_tier: { agentId, userId, key, tier: "working" } },
    update: { value, accessCount: { increment: 1 }, updatedAt: new Date() },
    create: { agentId, userId, tier: "working", key, value, importance: 0.5 },
  });
}

export async function promoteToRecall(
  agentId: string,
  userId: string,
  key: string,
  value: string
): Promise<void> {
  await db.agentMemoryLong.upsert({
    where: { agentId_userId_key_tier: { agentId, userId, key, tier: "recall" } },
    update: { value, accessCount: { increment: 1 }, updatedAt: new Date() },
    create: { agentId, userId, tier: "recall", key, value, importance: 0.7 },
  });
}

export async function searchRecall(
  agentId: string,
  userId: string,
  query: string
) {
  return db.$queryRawUnsafe<{ key: string; value: string; importance: number }[]>(
    `SELECT key, value, importance FROM "AgentMemoryLong"
     WHERE "agentId" = $1 AND "userId" = $2 AND tier = 'recall'
     AND (key ILIKE $3 OR value ILIKE $3)
     ORDER BY importance DESC LIMIT 10`,
    agentId,
    userId,
    `%${query}%`
  );
}

export async function saveArchival(
  agentId: string,
  userId: string,
  key: string,
  value: string
): Promise<void> {
  await db.agentMemoryLong.upsert({
    where: { agentId_userId_key_tier: { agentId, userId, key, tier: "archival" } },
    update: { value, updatedAt: new Date() },
    create: { agentId, userId, tier: "archival", key, value, importance: 0.3 },
  });
}

export async function buildMemoryPrompt(
  agentId: string,
  userId: string
): Promise<string> {
  try {
    const working = await getWorkingMemory(agentId, userId);
    const recall = await db.agentMemoryLong.findMany({
      where: { agentId, userId, tier: "recall" },
      orderBy: { importance: "desc" },
      take: 5,
    });

    if (working.length === 0 && recall.length === 0) return "";

    const lines: string[] = ["\n\n<agent_memory>"];

    if (working.length > 0) {
      lines.push("[Working Memory - Recent Context]");
      for (const m of working) {
        lines.push(`- ${m.key}: ${m.value}`);
      }
    }

    if (recall.length > 0) {
      lines.push("[Recall Memory - Important Facts]");
      for (const m of recall) {
        lines.push(`- ${m.key}: ${m.value}`);
      }
    }

    lines.push("</agent_memory>");
    return lines.join("\n");
  } catch {
    return "";
  }
}

export async function extractAndSaveMemories(
  agentId: string | undefined,
  userId: string,
  userMessage: string,
  assistantResponse: string
): Promise<void> {
  if (process.env.ENABLE_MEMORY_EXTRACTION !== "true") return;
  if (!agentId) return;

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
              "Extract key facts from this conversation that would be useful to remember for future interactions. Return a JSON object where keys are short fact labels and values are the fact content. Only extract genuinely useful facts (user preferences, business details, goals). If nothing worth remembering, return {}.",
          },
          {
            role: "user",
            content: `User: ${userMessage.slice(0, 500)}\n\nAssistant: ${assistantResponse.slice(0, 1000)}`,
          },
        ],
        max_tokens: 300,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return;

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "";
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) return;

    const facts = JSON.parse(jsonMatch[0]);
    for (const [key, value] of Object.entries(facts)) {
      if (typeof value === "string" && value.length > 0 && key.length > 0) {
        await saveWorkingMemory(agentId, userId, key.slice(0, 100), value.slice(0, 500));
      }
    }
  } catch {
    // Silently skip — memory extraction is best-effort
  }
}
