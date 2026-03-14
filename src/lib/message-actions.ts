/**
 * Message Actions — Edit, Regenerate, Copy, Version History
 *
 * Provides message editing (user messages only), regeneration (assistant
 * messages only), clipboard copy, and version tracking. All mutations
 * verify conversation ownership before proceeding.
 */
import { db } from "@/lib/db";
import type { Message } from "@/generated/prisma/client";

// ═══════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════

export interface MessageVersion {
  id: string;
  content: string;
  createdAt: Date;
  isActive: boolean;
}

interface EditResult {
  message: Message;
  staleCount: number;
}

// ═══════════════════════════════════════════
// OWNERSHIP VERIFICATION
// ═══════════════════════════════════════════

/**
 * Fetches a message and verifies the requesting user owns the conversation.
 * Throws if message not found or user doesn't own the conversation.
 */
async function getOwnedMessage(
  messageId: string,
  userId: string
): Promise<Message & { conversation: { userId: string } }> {
  const message = await db.message.findUnique({
    where: { id: messageId },
    include: {
      conversation: {
        select: { userId: true },
      },
    },
  });

  if (!message) {
    throw new Error("Message not found");
  }

  if (message.conversation.userId !== userId) {
    throw new Error("Unauthorized: you do not own this conversation");
  }

  return message;
}

// ═══════════════════════════════════════════
// EDIT MESSAGE
// ═══════════════════════════════════════════

/**
 * Edits a user message. Stores the original content as a version entry
 * in the message metadata (JSON in content prefix), updates the message
 * content, and marks all subsequent messages in the conversation as stale
 * by soft-deleting them (they remain in DB for version history but are
 * excluded from active chat).
 *
 * Only USER role messages can be edited.
 */
export async function editMessage(
  messageId: string,
  newContent: string,
  userId: string
): Promise<EditResult> {
  const message = await getOwnedMessage(messageId, userId);

  if (message.role !== "USER") {
    throw new Error("Only user messages can be edited");
  }

  if (!newContent.trim()) {
    throw new Error("Message content cannot be empty");
  }

  // Store the old content as a version before overwriting
  // Versions are tracked via a separate query pattern — we create a
  // lightweight "version snapshot" message with a special model marker.
  await db.message.create({
    data: {
      conversationId: message.conversationId,
      role: "USER",
      content: message.content,
      mode: message.mode,
      model: `__version__${messageId}`,
      createdAt: message.createdAt,
    },
  });

  // Update the message with new content
  const updated = await db.message.update({
    where: { id: messageId },
    data: { content: newContent.trim() },
  });

  // Mark all messages AFTER this one in the conversation as stale
  // by setting their model field to __stale__. This preserves them
  // for version history but excludes them from the active chat view.
  const staleResult = await db.message.updateMany({
    where: {
      conversationId: message.conversationId,
      createdAt: { gt: message.createdAt },
      model: { not: { startsWith: "__version__" } },
    },
    data: { model: "__stale__" },
  });

  return { message: updated, staleCount: staleResult.count };
}

// ═══════════════════════════════════════════
// REGENERATE RESPONSE
// ═══════════════════════════════════════════

/**
 * Marks an assistant message as superseded and prepares for regeneration.
 * The actual re-generation is triggered by the client calling the chat
 * endpoint again with the preceding user message.
 *
 * Only ASSISTANT role messages can be regenerated.
 *
 * Returns the preceding user message content so the client can re-send it.
 */
export async function regenerateResponse(
  messageId: string,
  userId: string
): Promise<{ precedingUserMessage: string; conversationId: string }> {
  const message = await getOwnedMessage(messageId, userId);

  if (message.role !== "ASSISTANT") {
    throw new Error("Only assistant messages can be regenerated");
  }

  // Store the old response as a version snapshot
  await db.message.create({
    data: {
      conversationId: message.conversationId,
      role: "ASSISTANT",
      content: message.content,
      mode: message.mode,
      model: `__version__${messageId}`,
      tokensIn: message.tokensIn,
      tokensOut: message.tokensOut,
      createdAt: message.createdAt,
    },
  });

  // Mark this message and all subsequent as stale
  await db.message.updateMany({
    where: {
      conversationId: message.conversationId,
      createdAt: { gte: message.createdAt },
      model: { not: { startsWith: "__version__" } },
    },
    data: { model: "__stale__" },
  });

  // Find the preceding user message to return for re-submission
  const precedingMessage = await db.message.findFirst({
    where: {
      conversationId: message.conversationId,
      role: "USER",
      createdAt: { lt: message.createdAt },
      model: { not: { startsWith: "__version__" } },
    },
    orderBy: { createdAt: "desc" },
    select: { content: true },
  });

  if (!precedingMessage) {
    throw new Error("No preceding user message found for regeneration");
  }

  return {
    precedingUserMessage: precedingMessage.content,
    conversationId: message.conversationId,
  };
}

// ═══════════════════════════════════════════
// COPY MESSAGE
// ═══════════════════════════════════════════

/**
 * Returns the raw content of a message for clipboard copy.
 * No ownership check needed — content is already visible to the user
 * in the chat UI. This is a convenience helper.
 */
export function copyMessage(content: string): string {
  return content;
}

// ═══════════════════════════════════════════
// MESSAGE VERSIONS
// ═══════════════════════════════════════════

/**
 * Returns the edit/regeneration history for a message.
 * Versions are stored as separate messages with model = "__version__<messageId>".
 * The current active version is the message itself.
 */
export async function getMessageVersions(
  messageId: string,
  userId: string
): Promise<MessageVersion[]> {
  const message = await getOwnedMessage(messageId, userId);

  // Fetch all version snapshots for this message
  const versionSnapshots = await db.message.findMany({
    where: {
      conversationId: message.conversationId,
      model: `__version__${messageId}`,
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
    },
  });

  // Build version list: historical versions + current active version
  const versions: MessageVersion[] = versionSnapshots.map((v) => ({
    id: v.id,
    content: v.content,
    createdAt: v.createdAt,
    isActive: false,
  }));

  // Add the current (active) version
  versions.push({
    id: message.id,
    content: message.content,
    createdAt: message.createdAt,
    isActive: true,
  });

  return versions;
}
