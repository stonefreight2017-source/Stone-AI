import { streamText } from "ai";
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getModel } from "@/lib/ai";
import { buildRagContext } from "@/lib/embeddings";
import { checkRateLimitAsync } from "@/lib/rate-limiter";
import { sanitizeUserInput, wrapSystemPrompt, getClientIp, validateOrigin } from "@/lib/security";

const messageSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      })
    )
    .max(30),
  sessionId: z.string().uuid(),
  configSnapshot: z.string().max(2000).optional(),
});

// Cache agent ID at module level
let cachedAgentId: string | null = null;

async function getAgentId(): Promise<string | null> {
  if (cachedAgentId) return cachedAgentId;
  const agent = await db.agent.findUnique({
    where: { slug: "enterprise-sales-advisor" },
    select: { id: true },
  });
  if (agent) cachedAgentId = agent.id;
  return cachedAgentId;
}

export async function POST(req: NextRequest) {
  // CSRF: validate origin on public endpoint
  if (!validateOrigin(req.headers)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Rate limit by IP (uses Vercel-trusted headers, not spoofable x-forwarded-for)
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimitAsync(`enterprise-chat:${ip}`, 10);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait a moment." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)),
        },
      }
    );
  }

  // Parse and validate
  let body: z.infer<typeof messageSchema>;
  try {
    const raw = await req.json();
    body = messageSchema.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Sanitize all user messages
  const sanitizedMessages = body.messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.role === "user" ? sanitizeUserInput(m.content) : m.content,
  }));

  // Get last user message for RAG
  const lastUserMsg = [...sanitizedMessages]
    .reverse()
    .find((m) => m.role === "user");
  if (!lastUserMsg) {
    return new Response(JSON.stringify({ error: "No user message found" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Resolve agent + build context
  const agentId = await getAgentId();
  let ragContext = "";
  if (agentId) {
    ragContext = await buildRagContext(agentId, lastUserMsg.content);
  }

  // Build system prompt
  const agent = agentId
    ? await db.agent.findUnique({
        where: { id: agentId },
        select: { systemPrompt: true },
      })
    : null;

  const basePrompt = agent?.systemPrompt || FALLBACK_SYSTEM_PROMPT;

  const configSection = body.configSnapshot
    ? `\n\n<current_configuration>\nThe prospect has currently configured:\n${sanitizeUserInput(body.configSnapshot)}\n</current_configuration>`
    : "";

  const systemPrompt = wrapSystemPrompt(
    basePrompt + configSection + (ragContext ? "\n\n" + ragContext : "")
  );

  // Stream response
  const result = streamText({
    model: getModel("LOCAL"),
    system: systemPrompt,
    messages: sanitizedMessages,
    maxOutputTokens: 1024,
  });

  // Return plain text stream (no Vercel AI SDK data protocol — widget uses raw fetch)
  return result.toTextStreamResponse();
}

const FALLBACK_SYSTEM_PROMPT = `You are the Stone AI Enterprise Advisor. Help prospects configure and purchase enterprise plans. Be helpful, concise, and knowledgeable about enterprise features and pricing.`;
