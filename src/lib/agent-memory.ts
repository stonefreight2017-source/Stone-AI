import { db } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/encryption";

/**
 * Agent Memory System
 *
 * Each agent maintains per-user memory that persists across sessions.
 * Memory is structured as key-value pairs with categories:
 * - preferences: User's working style, tone, industry
 * - context: Business details, project info, past decisions
 * - learnings: What worked, what didn't, patterns observed
 * - history: Summary of past interactions and outcomes
 *
 * All memory values are encrypted at rest using AES-256-GCM.
 * Backward compatible: reads handle both encrypted and legacy plaintext values.
 */

/**
 * Decrypt a value, falling back to plaintext for legacy unencrypted data.
 */
function safeDecrypt(value: string): string {
  try {
    return decrypt(value);
  } catch {
    // Legacy plaintext data — return as-is
    return value;
  }
}

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
  return memories.map((m) => ({
    ...m,
    value: safeDecrypt(m.value),
  }));
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
  const encryptedValue = encrypt(value);
  await db.agentMemory.upsert({
    where: {
      agentId_userId_key: { agentId, userId, key },
    },
    create: { agentId, userId, key, value: encryptedValue },
    update: { value: encryptedValue },
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
 * Estimate token count from a string (~4 chars per token).
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Build memory context string for injection into prompts.
 * Formats all stored memories as structured context.
 *
 * Options:
 * - maxTokens: token budget for the memory context block (default 1000).
 *   If over budget, oldest memories are dropped first.
 */
export async function buildMemoryContext(
  agentId: string,
  userId: string,
  options?: { maxTokens?: number }
): Promise<string> {
  const maxTokens = options?.maxTokens ?? 1000;
  const memories = await getAgentMemory(agentId, userId);

  if (memories.length === 0) return "";

  // Memories are ordered by updatedAt desc (newest first).
  // If over budget, drop oldest (last in array) first.
  const wrapper = `\n\n<user_memory>\nYou have the following memory about this user from past sessions:\n\n\n\nUse this memory to personalize responses. Reference past context naturally. Update your understanding as new information emerges.\n</user_memory>`;
  const wrapperTokens = estimateTokens(wrapper);
  let availableTokens = maxTokens - wrapperTokens;

  // Build memory lines from newest to oldest, stop when budget exhausted
  const includedMemories: MemoryEntry[] = [];
  for (const m of memories) {
    const line = `- ${m.key.split(":").slice(1).join(":") || m.key}: ${m.value}`;
    const lineTokens = estimateTokens(line + "\n");
    if (lineTokens > availableTokens) break;
    includedMemories.push(m);
    availableTokens -= lineTokens;
  }

  if (includedMemories.length === 0) return "";

  const grouped: Record<string, string[]> = {};
  for (const m of includedMemories) {
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
