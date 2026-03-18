import { NextRequest } from "next/server";
import { z } from "zod";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";

const signalSchema = z.object({
  messageId: z.string().min(1),
  conversationId: z.string().min(1),
  signal: z.enum(["positive", "negative"]),
}).strict();

export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = signalSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const { messageId, conversationId, signal } = parsed.data;

    // Verify conversation ownership
    const conversation = await db.conversation.findFirst({
      where: { id: conversationId, userId: user.id },
      select: {
        id: true,
        agent: { select: { slug: true } },
      },
    });

    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Get the message and its preceding user message
    const targetMessage = await db.message.findFirst({
      where: { id: messageId, conversationId },
    });

    if (!targetMessage) {
      return Response.json({ error: "Message not found" }, { status: 404 });
    }

    // Find the preceding user message
    const precedingMessage = await db.message.findFirst({
      where: {
        conversationId,
        createdAt: { lt: targetMessage.createdAt },
        role: "USER",
      },
      orderBy: { createdAt: "desc" },
    });

    await db.feedbackSignal.create({
      data: {
        userId: user.id,
        conversationId,
        messageId,
        signal,
        agentSlug: conversation.agent?.slug || "general",
        userMessage: precedingMessage?.content || "",
        assistantMessage: targetMessage.content,
      },
    });

    return Response.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/feedback/signal:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
