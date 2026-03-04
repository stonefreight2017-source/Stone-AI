import { db } from "@/lib/db";

/**
 * Bestie Memory System
 *
 * Separate from AgentMemory to avoid FK constraint issues.
 * Each bestie maintains per-user memory that persists across sessions.
 */

export async function getBestieMemory(
  bestieId: string,
  userId: string
) {
  return db.bestieMemory.findMany({
    where: { bestieId, userId },
    orderBy: { updatedAt: "desc" },
    select: { key: true, value: true, updatedAt: true },
  });
}

export async function setBestieMemory(
  bestieId: string,
  userId: string,
  key: string,
  value: string
) {
  await db.bestieMemory.upsert({
    where: {
      bestieId_userId_key: { bestieId, userId, key },
    },
    create: { bestieId, userId, key, value },
    update: { value },
  });
}

/**
 * Build memory context string for injection into bestie prompts.
 */
export async function buildBestieMemoryContext(
  bestieId: string,
  userId: string
): Promise<string> {
  const memories = await getBestieMemory(bestieId, userId);

  if (memories.length === 0) return "";

  const grouped: Record<string, string[]> = {};
  for (const m of memories) {
    const category = m.key.split(":")[0] || "general";
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(`- ${m.key.split(":").slice(1).join(":") || m.key}: ${m.value}`);
  }

  const sections = Object.entries(grouped)
    .map(([cat, items]) => `[${cat.toUpperCase()}]\n${items.join("\n")}`)
    .join("\n\n");

  return `\n\n<user_memory>\nYou have the following memory about this user from past sessions:\n\n${sections}\n\nUse this memory to personalize responses. Reference past context naturally. Update your understanding as new information emerges.\n</user_memory>`;
}

/**
 * Parse and store extracted memories from LLM response.
 */
export async function storeBestieMemories(
  bestieId: string,
  userId: string,
  extractedJson: string
) {
  try {
    const parsed = JSON.parse(extractedJson);

    for (const [category, entries] of Object.entries(parsed)) {
      if (typeof entries !== "object" || entries === null) continue;

      for (const [key, value] of Object.entries(entries as Record<string, string>)) {
        if (typeof value !== "string") continue;
        await setBestieMemory(bestieId, userId, `${category}:${key}`, value);
      }
    }
  } catch {
    // Invalid JSON from LLM — skip silently
  }
}
