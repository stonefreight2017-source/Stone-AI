import { db } from "@/lib/db";

interface ExportMessage {
  role: string;
  content: string;
  model: string | null;
  mode: string | null;
  createdAt: Date;
}

interface ConversationData {
  id: string;
  title: string;
  agentName: string | null;
  agentSlug: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages: ExportMessage[];
}

/**
 * Fetch a conversation with all messages for export.
 * Verifies user ownership. Returns null if not found or not owned by user.
 */
async function fetchConversation(
  conversationId: string,
  userId: string
): Promise<ConversationData | null> {
  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, userId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          role: true,
          content: true,
          model: true,
          mode: true,
          createdAt: true,
        },
      },
      agent: {
        select: { name: true, slug: true },
      },
    },
  });

  if (!conversation) return null;

  return {
    id: conversation.id,
    title: conversation.title,
    agentName: conversation.agent?.name ?? null,
    agentSlug: conversation.agent?.slug ?? null,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    messages: conversation.messages.map((m) => ({
      role: m.role,
      content: m.content,
      model: m.model,
      mode: m.mode,
      createdAt: m.createdAt,
    })),
  };
}

/**
 * Format a role enum value into a human-readable label.
 */
function formatRole(role: string): string {
  switch (role) {
    case "USER":
      return "You";
    case "ASSISTANT":
      return "AI";
    case "SYSTEM":
      return "System";
    default:
      return role;
  }
}

/**
 * Format a timestamp for display in exports.
 */
function formatTimestamp(date: Date): string {
  return date.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");
}

/**
 * Export conversation as Markdown with agent name, timestamps, and code blocks preserved.
 */
export async function exportAsMarkdown(
  conversationId: string,
  userId: string
): Promise<string | null> {
  const data = await fetchConversation(conversationId, userId);
  if (!data) return null;

  const lines: string[] = [
    `# ${data.title}`,
    "",
  ];

  if (data.agentName) {
    lines.push(`**Agent:** ${data.agentName}`);
  }
  lines.push(`**Date:** ${formatTimestamp(data.createdAt)}`);
  lines.push(`**Messages:** ${data.messages.length}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  for (const msg of data.messages) {
    const role = formatRole(msg.role);
    const time = formatTimestamp(msg.createdAt);

    lines.push(`### ${role}`);
    lines.push(`*${time}*`);
    lines.push("");
    // Content is added as-is — code blocks in the original content are already
    // fenced with ``` and will render correctly in markdown.
    lines.push(msg.content);
    lines.push("");
    lines.push("---");
    lines.push("");
  }

  lines.push(`*Exported from Stone AI on ${new Date().toISOString()}*`);

  return lines.join("\n");
}

/**
 * Export conversation as plain text.
 */
export async function exportAsText(
  conversationId: string,
  userId: string
): Promise<string | null> {
  const data = await fetchConversation(conversationId, userId);
  if (!data) return null;

  const lines: string[] = [
    `Conversation: ${data.title}`,
    `Date: ${formatTimestamp(data.createdAt)}`,
  ];

  if (data.agentName) {
    lines.push(`Agent: ${data.agentName}`);
  }

  lines.push("---");
  lines.push("");

  for (const msg of data.messages) {
    const role = formatRole(msg.role);
    const time = formatTimestamp(msg.createdAt);
    lines.push(`[${role}] (${time})`);
    lines.push(msg.content);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Export conversation as structured JSON.
 */
export async function exportAsJSON(
  conversationId: string,
  userId: string,
  exporterName: string
): Promise<object | null> {
  const data = await fetchConversation(conversationId, userId);
  if (!data) return null;

  return {
    title: data.title,
    agent: data.agentName,
    createdAt: data.createdAt.toISOString(),
    updatedAt: data.updatedAt.toISOString(),
    messageCount: data.messages.length,
    messages: data.messages.map((m) => ({
      role: m.role,
      content: m.content,
      model: m.model,
      mode: m.mode,
      timestamp: m.createdAt.toISOString(),
    })),
    exportedAt: new Date().toISOString(),
    exportedBy: exporterName,
  };
}
