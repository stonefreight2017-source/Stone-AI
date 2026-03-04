import { db } from "@/lib/db";

/**
 * Agent Memory System
 *
 * Each agent maintains per-user memory that persists across sessions.
 * Memory is structured as key-value pairs with categories:
 * - preferences: User's working style, tone, industry
 * - context: Business details, project info, past decisions
 * - learnings: What worked, what didn't, patterns observed
 * - history: Summary of past interactions and outcomes
 */

export interface MemoryEntry {
  key: string;
  value: string;
  updatedAt: Date;
}

/**
 * Get all memory entries for an agent-user pair.
 */
export async function getAgentMemory(
  agentId: string,
  userId: string
): Promise<MemoryEntry[]> {
  const memories = await db.agentMemory.findMany({
    where: { agentId, userId },
    orderBy: { updatedAt: "desc" },
    select: { key: true, value: true, updatedAt: true },
  });
  return memories;
}

/**
 * Set a memory entry. Creates or updates.
 */
export async function setAgentMemory(
  agentId: string,
  userId: string,
  key: string,
  value: string
) {
  await db.agentMemory.upsert({
    where: {
      agentId_userId_key: { agentId, userId, key },
    },
    create: { agentId, userId, key, value },
    update: { value },
  });
}

/**
 * Delete a memory entry.
 */
export async function deleteAgentMemory(
  agentId: string,
  userId: string,
  key: string
) {
  await db.agentMemory.deleteMany({
    where: { agentId, userId, key },
  });
}

/**
 * Build memory context string for injection into prompts.
 * Formats all stored memories as structured context.
 */
export async function buildMemoryContext(
  agentId: string,
  userId: string
): Promise<string> {
  const memories = await getAgentMemory(agentId, userId);

  if (memories.length === 0) return "";

  const grouped: Record<string, string[]> = {};
  for (const m of memories) {
    const category = m.key.split(":")[0] || "general";
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(`- ${m.key.split(":").slice(1).join(":")||m.key}: ${m.value}`);
  }

  const sections = Object.entries(grouped)
    .map(([cat, items]) => `[${cat.toUpperCase()}]\n${items.join("\n")}`)
    .join("\n\n");

  return `\n\n<user_memory>\nYou have the following memory about this user from past sessions:\n\n${sections}\n\nUse this memory to personalize responses. Reference past context naturally. Update your understanding as new information emerges.\n</user_memory>`;
}

/**
 * Extract learnings from a completed conversation.
 * Called after a conversation ends or reaches a natural break.
 * Uses the LLM to identify what should be remembered.
 */
export function buildMemoryExtractionPrompt(
  conversationSummary: string
): string {
  return `Analyze this conversation and extract key information to remember about this user for future sessions. Return ONLY a JSON object with these categories (omit empty categories):

{
  "preferences": { "key": "value" pairs for user preferences, style, tone },
  "context": { "key": "value" pairs for business details, project info },
  "learnings": { "key": "value" pairs for what worked, patterns observed },
  "history": { "key": "value" pairs summarizing key outcomes or decisions }
}

Conversation:
${conversationSummary}

Return ONLY valid JSON. No explanation.`;
}

/**
 * Parse and store extracted memories from LLM response.
 */
export async function storeExtractedMemories(
  agentId: string,
  userId: string,
  extractedJson: string
) {
  try {
    const parsed = JSON.parse(extractedJson);

    for (const [category, entries] of Object.entries(parsed)) {
      if (typeof entries !== "object" || entries === null) continue;

      for (const [key, value] of Object.entries(entries as Record<string, string>)) {
        if (typeof value !== "string") continue;
        await setAgentMemory(agentId, userId, `${category}:${key}`, value);
      }
    }
  } catch {
    // Invalid JSON from LLM — skip silently
  }
}
