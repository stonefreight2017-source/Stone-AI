import { NextRequest } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser();

    const body = await req.json();
    const { messageId, conversationId, signal } = body;

    if (!messageId || !conversationId || !signal) {
      return Response.json({ error: "messageId, conversationId, and signal are required" }, { status: 400 });
    }

    if (signal !== "positive" && signal !== "negative") {
      return Response.json({ error: "signal must be 'positive' or 'negative'" }, { status: 400 });
    }

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
