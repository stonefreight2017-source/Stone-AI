import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkRateLimitAsync } from "@/lib/rate-limiter";
import { sanitizeUserInput } from "@/lib/security";
import { getModel } from "@/lib/ai";
import { generateText } from "ai";
import { indexKnowledgeChunk } from "@/lib/embeddings";

const logSchema = z.object({
  sessionId: z.string().uuid(),
  outcome: z.enum(["submitted", "abandoned"]),
  messageCount: z.number().int().min(0).max(100),
  transcript: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      })
    )
    .max(20),
  configSnapshot: z.string().max(5000).optional(),
});

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const rl = await checkRateLimitAsync(`enterprise-log:${ip}`, 3);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  let body: z.infer<typeof logSchema>;
  try {
    const raw = await req.json();
    body = logSchema.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Get or create system user
  let systemUser = await db.user.findFirst({
    where: { email: "enterprise@stone-ai.net" },
  });
  if (!systemUser) {
    systemUser = await db.user.create({
      data: {
        clerkId: `system_enterprise_${Date.now()}`,
        email: "enterprise@stone-ai.net",
        name: "Enterprise Inquiries",
      },
    });
  }

  // Store feedback record (sync)
  const logData = {
    sessionId: body.sessionId,
    outcome: body.outcome,
    messageCount: body.messageCount,
    configSnapshot: body.configSnapshot || null,
    timestamp: new Date().toISOString(),
  };

  await db.feedback.create({
    data: {
      userId: systemUser.id,
      email: "enterprise@stone-ai.net",
      type: "FEATURE",
      message: sanitizeUserInput(
        `[SALES_LOG] ${JSON.stringify(logData)}`
      ),
    },
  });

  // Fire-and-forget: extract patterns from transcript
  if (body.transcript.length >= 2) {
    extractPatterns(body.transcript, body.outcome, body.sessionId).catch(
      () => {}
    );
  }

  return NextResponse.json({ ok: true });
}

async function extractPatterns(
  transcript: { role: string; content: string }[],
  outcome: string,
  sessionId: string
) {
  const agent = await db.agent.findUnique({
    where: { slug: "enterprise-sales-advisor" },
    select: { id: true },
  });
  if (!agent) return;

  const conversationText = transcript
    .map((m) => `${m.role}: ${m.content}`)
    .join("\n");

  const { text } = await generateText({
    model: getModel("LOCAL"),
    maxOutputTokens: 512,
    system: `You are a sales conversation analyst. Extract structured patterns from enterprise sales conversations. Output ONLY a JSON object with these fields:
- objections_raised: string[] (concerns the prospect raised)
- effective_responses: string[] (advisor responses that moved conversation forward)
- trigger_topics: string[] (hidden programs or upsell topics that were discussed)
- outcome_factors: string[] (reasons for the outcome)
- recommended_improvements: string[] (what could be done better)
- key_insight: string (one-sentence summary of the most important pattern)

Be concise. Each array should have 1-3 items max.`,
    prompt: `Conversation outcome: ${outcome}\n\nTranscript:\n${conversationText}`,
  });

  // Create knowledge chunk from extraction
  const chunk = await db.agentKnowledgeChunk.create({
    data: {
      agentId: agent.id,
      title: `Sales Pattern: ${outcome} conversation (${sessionId.slice(0, 8)})`,
      content: `Extracted from ${outcome} enterprise sales conversation.\n\n${text}`,
      source: "sales-extraction",
    },
  });

  await indexKnowledgeChunk(chunk.id, chunk.content);
}
