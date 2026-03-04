/**
 * ═══ BESTIE CHAT — PERFORMANCE & SECURITY NOTES ═══
 * Mirrors /api/chat with bestie-specific personality prompts.
 * Same scaling concerns apply — see /api/chat/route.ts header.
 *
 * ADDITIONAL BESTIE CONCERNS:
 * - Memory extraction fires on every 100+ char response (same as agents).
 *   Set MEMORY_EXTRACT_FREQUENCY=3 to reduce at scale.
 * - Bestie system prompts are ~800-1200 tokens (personality + memory context).
 *   These are rebuilt per request. If this becomes slow, cache them in Redis
 *   with a 5-minute TTL keyed by bestieId:userId.
 * - AgentMemory table stores bestie memories using bestieId as the agentId.
 *   At 5000+ besties, consider a cleanup job to prune old memories.
 *
 * EXPLOIT PREVENTION:
 * - Bestie ownership verified before chat (step 3).
 * - Input sanitized (step 2b). System prompt wrapped with security directives.
 * - Memory extraction sanitized (blocked keys: tier, role, admin, etc.).
 * - Users cannot chat with inactive/deleted besties.
 */
import { NextRequest } from "next/server";
import { streamText } from "ai";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { bestieChatSchema } from "@/lib/bestie-validators";
import { getTierConfig, isModeAllowed, getNextTier, getRequiredTierForMode } from "@/lib/tier-config";
import { checkRateLimit, acquireConcurrencySlot } from "@/lib/rate-limiter";
import { checkQuota, checkSmartQuota, incrementDailyUsage, incrementSmartUsage, recordTokenUsage } from "@/lib/quota";
import { getModel } from "@/lib/ai";
import { buildBestiePrompt } from "@/lib/bestie-prompt";
import { sanitizeUserInput } from "@/lib/security";
import { buildMemoryExtractionPrompt } from "@/lib/agent-memory";
import { storeBestieMemories } from "@/lib/bestie-memory";
import type { Tier } from "@/lib/tier-config";
import type { Role, Mode } from "@/generated/prisma/enums";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const user = await getOrCreateUser();
    if (user.banned) {
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

    const parsed = bestieChatSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const { message: rawMessage, conversationId, mode } = parsed.data;

    // 2b. Sanitize user input
    const message = sanitizeUserInput(rawMessage);

    // 3. Verify conversation ownership + load bestie
    const conversation = await db.conversation.findFirst({
      where: { id: conversationId, userId: user.id },
      select: {
        id: true,
        title: true,
        bestieId: true,
        bestie: {
          select: {
            id: true,
            name: true,
            personality: true,
            avatarEmoji: true,
            isActive: true,
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

    if (!conversation.bestie || !conversation.bestie.isActive) {
      return Response.json({ error: "Bestie not found or inactive" }, { status: 404 });
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

    // 4b. SMART mode hard cap — protect company margins
    if (mode === "SMART") {
      const smartQuota = await checkSmartQuota(user.id, tier);
      if (!smartQuota.allowed) {
        return Response.json(
          {
            code: "SMART_QUOTA_EXCEEDED",
            message: `You've used all ${smartQuota.smartMessagesPerDay} Smart mode messages for today. Switch to Local mode for unlimited fast responses.`,
            smartUsage: {
              sent: smartQuota.smartMessagesSentToday,
              limit: smartQuota.smartMessagesPerDay,
            },
            suggestion: "LOCAL",
          },
          { status: 429 }
        );
      }
    }

    // 5. Rate limit check
    const rateCheck = checkRateLimit(user.id, tierConfig.limits.requestsPerMinute);
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

    // 5b. Concurrent request enforcement
    const maxConcurrent = tierConfig.limits.concurrentRequests;
    const concurrency = await acquireConcurrencySlot(user.id, maxConcurrent);
    if (!concurrency.acquired) {
      return Response.json(
        {
          code: "TOO_MANY_CONCURRENT",
          message: "Too many simultaneous requests. Please wait for a response.",
        },
        { status: 429 }
      );
    }

    // 6. Quota check
    const quota = await checkQuota(user.id, tier);
    if (!quota.allowed) {
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
          offer: nextTier ? { targetTier: nextTier } : null,
        },
        { status: 429 }
      );
    }

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
      await incrementSmartUsage(user.id);
    } else {
      await incrementDailyUsage(user.id);
    }

    // 9. Build message history
    const contextLimit = tierConfig.perks.contextMessages;
    const allMessages = conversation.messages;
    const recentMessages = allMessages.slice(-contextLimit);

    const history = recentMessages.map((m) => ({
      role: m.role.toLowerCase() as "user" | "assistant" | "system",
      content: m.content,
    }));

    history.push({ role: "user", content: message });

    // 10. Build bestie system prompt (with memory + security wrapper)
    const systemPrompt = await buildBestiePrompt(
      conversation.bestie,
      user.id,
      user.name ?? undefined
    );

    // 11. Stream response
    const startTime = Date.now();
    const model = getModel(mode as "LOCAL" | "SMART");

    const result = streamText({
      model,
      system: systemPrompt,
      messages: history,
      maxOutputTokens: tierConfig.limits.maxResponseTokens,
      onFinish: async ({ text, usage: tokenUsage }) => {
        // Save assistant message
        await db.message.create({
          data: {
            conversationId: conversation.id,
            role: "ASSISTANT" as Role,
            content: text,
            mode: mode as Mode,
            model:
              mode === "SMART"
                ? (process.env.OPENAI_MODEL ?? "gpt-4o")
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
          const title = `Chat with ${conversation.bestie!.name}`;
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

        // Bestie memory extraction (async, non-blocking)
        if (text.length > 100) {
          extractBestieMemory(
            conversation.bestie!.id,
            user.id,
            message,
            text
          ).catch(() => {});
        }
      },
    });

    // 12. Return streaming response
    const firstTokenTime = Date.now() - startTime;
    return result.toTextStreamResponse({
      headers: {
        "X-Latency-Ms": String(firstTokenTime),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("POST /api/bestie/chat:", error instanceof Error ? error.message : "Unknown error");
    return Response.json(
      { code: "SERVICE_UNAVAILABLE", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}

const MEMORY_BLOCKED_KEYS = new Set([
  "tier", "role", "admin", "access_level", "permissions",
  "system_prompt", "instructions", "override", "privilege",
]);

async function extractBestieMemory(
  bestieId: string,
  userId: string,
  userMessage: string,
  assistantResponse: string
) {
  try {
    const { streamText: st } = await import("ai");
    const { getModel: gm } = await import("@/lib/ai");

    const conversationSummary = `User: ${userMessage.slice(0, 500)}\n\nBestie: ${assistantResponse.slice(0, 1000)}`;
    const prompt = buildMemoryExtractionPrompt(conversationSummary);

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
        const sanitized = sanitizeExtractedMemories(jsonMatch[0]);
        if (sanitized) {
          await storeBestieMemories(bestieId, userId, sanitized);
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

        if (MEMORY_BLOCKED_KEYS.has(lowerKey)) continue;
        if (lowerKey.includes("prompt") || lowerKey.includes("instruction")) continue;
        if (lowerKey.includes("override") || lowerKey.includes("privilege")) continue;

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
