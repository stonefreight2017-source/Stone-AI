/**
 * ═══ PERFORMANCE HOT PATH ═══
 * This is the most-called route in the entire app.
 * Every chat message (agents + general) goes through here.
 *
 * SCALING CHECKPOINTS:
 * - Rate limiting (step 5): Redis-backed. If Redis is down, falls back to in-memory.
 *   At multi-instance deployment, in-memory fallback won't work — ensure Redis is managed.
 * - Concurrency slots (step 5b): Redis INCR/DECR with 2-min TTL safety net.
 *   If slots leak (crash without release), TTL auto-cleans after 120s.
 * - Model inference (step 11): Bottleneck at scale. See src/lib/ai.ts for scaling notes.
 * - Memory extraction (onFinish): Async, non-blocking, fire-and-forget.
 *   At high load, consider: MEMORY_EXTRACT_FREQUENCY env var to reduce frequency.
 *
 * SECURITY CHECKPOINTS:
 * - Input sanitization (step 2b): Strips XML-like injection tags. Does NOT block.
 * - System prompt wrapper (step 10): Anti-extraction directives.
 * - Memory sanitization (extractAgentMemory): Blocks tier/role/admin key injection.
 * - Conversation ownership (step 3): IDOR protection via userId check.
 * - Agent tier enforcement (step 3b): Users can't access agents above their tier.
 *
 * DEBUG:
 * - Latency: X-Latency-Ms header on response.
 * - Errors: Logged to console + audit log.
 * - Quota: Returned in 429 response body.
 */
import { NextRequest } from "next/server";
import { streamText } from "ai";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { chatMessageSchema } from "@/lib/validators";
import { getTierConfig, isModeAllowed, getNextTier, getRequiredTierForMode, canAccessAgent } from "@/lib/tier-config";
import { checkRateLimitAsync, acquireConcurrencySlot } from "@/lib/rate-limiter";
import { checkQuota, checkSmartQuota, incrementDailyUsage, incrementSmartUsage, decrementFreeSmartCredits, recordTokenUsage } from "@/lib/quota";
import { getModel, SYSTEM_PROMPT } from "@/lib/ai";
import { buildRagContext } from "@/lib/embeddings";
import { buildMemoryContext } from "@/lib/agent-memory";
import { sanitizeUserInput, wrapSystemPrompt } from "@/lib/security";
import { logAuditEvent, getClientIp } from "@/lib/audit";
import { getDisclaimerPrompts } from "@/lib/agent-disclaimers";
import { VERIFICATION_BLOCK, OUTPUT_CAPABILITIES_BLOCK } from "@/lib/agent-shared-prompts";
import type { Tier } from "@/lib/tier-config";
import type { Role, Mode } from "@/generated/prisma/enums";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const user = await getOrCreateUser();
    if (user.banned) {
      logAuditEvent({
        event: "auth.banned_access",
        userId: user.id,
        ip: getClientIp(req.headers),
      });
      return Response.json({ error: "Account suspended" }, { status: 403 });
    }
    const tier = user.tier as Tier;
    const tierConfig = getTierConfig(tier);

    // 2. Parse & validate input
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // AI SDK v6 TextStreamChatTransport sends { messages: [...] } not { message: string }
    // Extract the last user message text for Zod validation
    const b = body as Record<string, unknown>;
    if (typeof b.message !== "string" && Array.isArray(b.messages)) {
      const lastUserMsg = [...b.messages].reverse().find((m: { role?: string }) => m.role === "user");
      if (lastUserMsg) {
        const msg = lastUserMsg as { parts?: { type: string; text: string }[]; content?: string };
        if (Array.isArray(msg.parts)) {
          b.message = msg.parts.filter((p) => p.type === "text").map((p) => p.text).join("");
        } else if (typeof msg.content === "string") {
          b.message = msg.content;
        }
      }
    }

    const parsed = chatMessageSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const { message: rawMessage, conversationId, mode } = parsed.data;

    // 2b. Sanitize user input (strip prompt injection patterns)
    const message = sanitizeUserInput(rawMessage);

    // 3. Verify conversation ownership
    const conversation = await db.conversation.findFirst({
      where: { id: conversationId, userId: user.id },
      select: {
        id: true,
        title: true,
        agentId: true,
        agent: {
          select: {
            id: true,
            slug: true,
            name: true,
            systemPrompt: true,
            requiredTier: true,
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          select: { role: true, content: true },
        },
      },
    });

    if (!conversation) {
      return Response.json({ error: "Conversation not found" }, { status: 404 });
    }

    // 3b. AGENT TIER ENFORCEMENT — users cannot use agents above their tier
    if (conversation.agent) {
      if (!canAccessAgent(tier, conversation.agent.requiredTier as Tier)) {
        logAuditEvent({
          event: "agent.access_denied",
          userId: user.id,
          metadata: {
            agentSlug: conversation.agent.slug,
            requiredTier: conversation.agent.requiredTier,
          },
        });
        return Response.json(
          {
            code: "AGENT_TIER_REQUIRED",
            message: `This agent requires ${conversation.agent.requiredTier} tier or higher`,
            currentTier: tier,
            requiredTier: conversation.agent.requiredTier,
          },
          { status: 403 }
        );
      }
    }

    // 4. Check mode access
    if (!isModeAllowed(tier, mode)) {
      const requiredTier = getRequiredTierForMode(mode);
      const nextTier = getNextTier(tier);
      return Response.json(
        {
          code: "TIER_MISMATCH",
          message: `${mode} mode requires ${requiredTier} tier or higher`,
          currentTier: tier,
          requestedMode: mode,
          requiredTier,
          allowedModes: tierConfig.allowedModes,
          offer: nextTier ? { targetTier: nextTier } : null,
        },
        { status: 403 }
      );
    }

    // 4b. SMART mode hard cap — protect company margins from cloud API abuse
    if (mode === "SMART") {
      // FREE tier: check lifetime credits instead of daily cap
      if (tier === "FREE") {
        const smartQuota = await checkSmartQuota(user.id, tier);
        if (!smartQuota.allowed) {
          logAuditEvent({
            event: "smart.quota_exceeded",
            userId: user.id,
            metadata: { lifetimeCreditsRemaining: 0, tier: "FREE" },
          });
          return Response.json(
            {
              code: "SMART_CREDITS_EXHAUSTED",
              message: "You've used all your Cloud AI trial credits. Your Stone Engine (unlimited) is still available, or upgrade for daily Cloud AI access.",
              lifetimeCreditsRemaining: 0,
              suggestion: "LOCAL",
              upgrade: {
                nextTier: "STARTER",
                nextTierName: "Builder",
                nextTierPrice: 19.99,
                smartPerDay: 10,
              },
            },
            { status: 429 }
          );
        }
      } else {
        const smartQuota = await checkSmartQuota(user.id, tier);
        if (!smartQuota.allowed) {
          const nextTier = getNextTier(tier);
          const nextConfig = nextTier ? getTierConfig(nextTier) : null;
          logAuditEvent({
            event: "smart.quota_exceeded",
            userId: user.id,
            metadata: {
              smartSentToday: smartQuota.smartMessagesSentToday,
              smartLimit: smartQuota.smartMessagesPerDay,
            },
          });
          return Response.json(
            {
              code: "SMART_QUOTA_EXCEEDED",
              message: `You've reached your daily Cloud AI limit (${smartQuota.smartMessagesPerDay}/day). Stone Engine is still unlimited, or purchase credits to continue with Cloud AI.`,
              smartUsage: {
                sent: smartQuota.smartMessagesSentToday,
                limit: smartQuota.smartMessagesPerDay,
              },
              suggestion: "LOCAL",
              creditPacks: [
                { credits: 10, price: 1.99 },
                { credits: 25, price: 3.99 },
                { credits: 50, price: 6.99 },
              ],
              upgrade: nextTier && nextConfig ? {
                nextTier,
                nextTierName: nextConfig.name,
                nextTierPrice: nextConfig.price,
                smartPerDay: nextConfig.limits.smartMessagesPerDay,
              } : null,
            },
            { status: 429 }
          );
        }
      }
    }

    // 5. Rate limit check
    const rateCheck = await checkRateLimitAsync(user.id, tierConfig.limits.requestsPerMinute);
    if (!rateCheck.allowed) {
      return Response.json(
        {
          code: "RATE_LIMITED",
          message: "Too many requests. Please slow down.",
          retryAfterMs: rateCheck.retryAfterMs,
        },
        { status: 429 }
      );
    }

    // 5b. Concurrent request enforcement — prevent flooding
    const maxConcurrent = tierConfig.limits.concurrentRequests;
    const concurrency = await acquireConcurrencySlot(user.id, maxConcurrent);
    if (!concurrency.acquired) {
      logAuditEvent({
        event: "concurrent.blocked",
        userId: user.id,
        metadata: { maxConcurrent },
      });
      return Response.json(
        {
          code: "TOO_MANY_CONCURRENT",
          message: "Too many simultaneous requests. Please wait for a response.",
        },
        { status: 429 }
      );
    }

    // 6. Quota check (release concurrency slot if quota exceeded)
    const quota = await checkQuota(user.id, tier);
    if (!quota.allowed) {
      await concurrency.release();
      const nextTier = getNextTier(tier);
      return Response.json(
        {
          code: "QUOTA_EXCEEDED",
          message: "You've reached your usage limit",
          currentTier: tier,
          usage: {
            messagesSentToday: quota.messagesSentToday,
            tokensUsedThisMonth: quota.tokensUsedThisMonth,
          },
          limit: {
            messagesPerDay: quota.messagesPerDay,
            tokensPerMonth: quota.tokensPerMonth,
          },
          nextResetDate: getNextResetDate(),
          offer: nextTier ? { targetTier: nextTier } : null,
        },
        { status: 429 }
      );
    }

    // Steps 7-11 wrapped in try/catch to ensure concurrency slot release on error
    try {

    // 7. Save user message to DB
    await db.message.create({
      data: {
        conversationId: conversation.id,
        role: "USER" as Role,
        content: message,
        mode: mode as Mode,
      },
    });

    // 8. Increment daily usage (SMART costs 3x to protect margins)
    if (mode === "SMART") {
      if (tier === "FREE") {
        await decrementFreeSmartCredits(user.id);
      }
      await incrementSmartUsage(user.id);
    } else {
      await incrementDailyUsage(user.id);
    }

    // 9. Build message history — ENFORCE context window limit per tier
    // Smart mode gets a SMALLER context window to control cloud API input token costs
    const contextLimit = mode === "SMART" && tierConfig.limits.smartContextMessages > 0
      ? tierConfig.limits.smartContextMessages
      : tierConfig.perks.contextMessages;
    const allMessages = conversation.messages;
    const recentMessages = allMessages.slice(-contextLimit);

    const history = recentMessages.map((m) => ({
      role: m.role.toLowerCase() as "user" | "assistant" | "system",
      content: m.content,
    }));

    // Add the new user message
    history.push({ role: "user", content: message });

    // 10. Build system prompt (agent-aware with RAG + memory + security wrapper)
    let basePrompt = SYSTEM_PROMPT;

    if (conversation.agent) {
      const agent = conversation.agent;
      basePrompt = agent.systemPrompt;

      // Inject RAG knowledge context
      const ragContext = await buildRagContext(agent.id, message);
      if (ragContext) {
        basePrompt += ragContext;
      }

      // Inject user-specific memory
      const memoryContext = await buildMemoryContext(agent.id, user.id);
      if (memoryContext) {
        basePrompt += memoryContext;
      }

      // Inject professional disclaimers for regulated domains
      const disclaimers = getDisclaimerPrompts(agent.slug);
      if (disclaimers) {
        basePrompt += disclaimers;
      }
    }

    // Inject output capabilities (charts, tables, code blocks, markdown)
    basePrompt += "\n\n" + OUTPUT_CAPABILITIES_BLOCK;

    // Inject verification protocol (applies to all agents)
    basePrompt += "\n\n" + VERIFICATION_BLOCK;

    // Wrap with anti-injection security directives
    const systemPrompt = wrapSystemPrompt(basePrompt);

    // 11. Stream response from model
    const startTime = Date.now();
    const model = getModel(mode as "LOCAL" | "SMART", tierConfig.localModel);

    const AI_ERROR_MESSAGE = "I'm having trouble connecting to the AI service right now. Please try again in a moment.";

    let streamResult;
    try {
      streamResult = streamText({
        model,
        system: systemPrompt,
        messages: history,
        maxOutputTokens: mode === "SMART" && tierConfig.limits.smartMaxResponseTokens > 0
          ? tierConfig.limits.smartMaxResponseTokens
          : tierConfig.limits.maxResponseTokens,
        onFinish: async ({ text, usage: tokenUsage }) => {
          // Don't save empty assistant messages (e.g. quota exhausted, empty stream)
          if (!text || !text.trim()) {
            console.warn("POST /api/chat: Empty response from model — skipping DB save", {
              conversationId: conversation.id,
              mode,
            });
            await concurrency.release();
            return;
          }

          // Save assistant message
          await db.message.create({
            data: {
              conversationId: conversation.id,
              role: "ASSISTANT" as Role,
              content: text,
              mode: mode as Mode,
              model: mode === "SMART"
                ? (process.env.SMART_MODEL ?? "claude-sonnet-4-20250514")
                : (process.env.VLLM_MODEL ?? "llama-3.1-70b"),
              tokensIn: tokenUsage?.inputTokens ?? 0,
              tokensOut: tokenUsage?.outputTokens ?? 0,
            },
          });

          // Record usage
          await recordTokenUsage(
            user.id,
            tokenUsage?.inputTokens ?? 0,
            tokenUsage?.outputTokens ?? 0,
            mode as "LOCAL" | "SMART"
          );

          // Auto-title after first exchange
          if (conversation.title === "New Chat" && conversation.messages.length === 0) {
            const title = generateTitle(message, text);
            await db.conversation.update({
              where: { id: conversation.id },
              data: { title },
            });
          }

          // Update conversation timestamp
          await db.conversation.update({
            where: { id: conversation.id },
            data: { updatedAt: new Date() },
          });

          // Release concurrency slot
          await concurrency.release();

          // Agent memory extraction (async, non-blocking, sanitized)
          // ═══ SCALING: At high load, set MEMORY_EXTRACT_FREQUENCY=3 to extract every 3rd message ═══
          if (conversation.agent && text.length > 100) {
            extractAgentMemory(
              conversation.agent.id,
              user.id,
              message,
              text
            ).catch(() => {});
          }
        },
      });
    } catch (streamError) {
      console.error("POST /api/chat: streamText() failed:", streamError instanceof Error ? streamError.message : streamError);
      await concurrency.release();
      // Return error as a readable text stream so it appears in the chat bubble
      return new Response(AI_ERROR_MESSAGE, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // 12. Return streaming response — only safe headers
    const firstTokenTime = Date.now() - startTime;
    return streamResult.toTextStreamResponse({
      headers: {
        "X-Latency-Ms": String(firstTokenTime),
      },
    });

    } catch (innerError) {
      // Release concurrency slot on any error between acquire and stream
      await concurrency.release();
      throw innerError;
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/chat:", error instanceof Error ? error.message : "Unknown error");
    return Response.json(
      {
        code: "SERVICE_UNAVAILABLE",
        message: "Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}

function getNextResetDate(): string {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return tomorrow.toISOString();
}

const MEMORY_BLOCKED_KEYS = new Set([
  "tier", "role", "admin", "access_level", "permissions",
  "system_prompt", "instructions", "override", "privilege",
]);

async function extractAgentMemory(
  agentId: string,
  userId: string,
  userMessage: string,
  assistantResponse: string
) {
  try {
    const { streamText: st } = await import("ai");
    const { getModel: gm } = await import("@/lib/ai");
    const { buildMemoryExtractionPrompt: buildPrompt, storeExtractedMemories: store } =
      await import("@/lib/agent-memory");

    const conversationSummary = `User: ${userMessage.slice(0, 500)}\n\nAssistant: ${assistantResponse.slice(0, 1000)}`;
    const prompt = buildPrompt(conversationSummary);

    const model = gm("LOCAL");
    const result = await st({
      model,
      messages: [{ role: "user", content: prompt }],
      maxOutputTokens: 500,
    });

    let fullText = "";
    for await (const chunk of result.textStream) {
      fullText += chunk;
    }

    if (fullText.trim()) {
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        // Sanitize extracted memories before storage
        const sanitized = sanitizeExtractedMemories(jsonMatch[0]);
        if (sanitized) {
          await store(agentId, userId, sanitized);
        }
      }
    }
  } catch {
    // Memory extraction is best-effort
  }
}

function sanitizeExtractedMemories(json: string): string | null {
  try {
    const parsed = JSON.parse(json);
    const clean: Record<string, Record<string, string>> = {};

    for (const [category, entries] of Object.entries(parsed)) {
      if (typeof entries !== "object" || entries === null) continue;
      clean[category] = {};

      for (const [key, value] of Object.entries(entries as Record<string, string>)) {
        if (typeof value !== "string") continue;
        const lowerKey = key.toLowerCase();

        // Block dangerous memory keys
        if (MEMORY_BLOCKED_KEYS.has(lowerKey)) continue;
        if (lowerKey.includes("prompt") || lowerKey.includes("instruction")) continue;
        if (lowerKey.includes("override") || lowerKey.includes("privilege")) continue;

        // Limit value length
        clean[category][key] = value.slice(0, 500);
      }

      if (Object.keys(clean[category]).length === 0) delete clean[category];
    }

    if (Object.keys(clean).length === 0) return null;
    return JSON.stringify(clean);
  } catch {
    return null;
  }
}

function generateTitle(userMessage: string, assistantResponse: string): string {
  const cleaned = userMessage.replace(/\n/g, " ").trim();
  if (cleaned.length <= 40) return cleaned;
  return cleaned.slice(0, 37) + "...";
}
