export const maxDuration = 60;

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
import { VERIFICATION_BLOCK, OUTPUT_CAPABILITIES_BLOCK, GENERAL_KNOWLEDGE_BLOCK, RESPONSE_QUALITY_BLOCK } from "@/lib/agent-shared-prompts";
import { buildTierCapabilityBlock } from "@/lib/tier-capabilities";
import { assemblePrompt, getTokenEstimate } from "@/lib/golden-egg";
import { buildAnswerContext } from "@/lib/answer-bank";
import { guardCheck, buildGuardPrompt } from "@/lib/agent-guard";
import type { Tier } from "@/lib/tier-config";
import type { Role, Mode } from "@/generated/prisma/enums";
import { checkCache, saveToCache } from "@/lib/semantic-cache";
import { scoreResponse } from "@/lib/quality-scorer";
import { trackEvent } from "@/lib/journey-tracker";
import { extractAndSaveMemories as extractLongTermMemories, buildMemoryPrompt } from "@/lib/memory-manager";
import { traceChat } from "@/lib/monitoring";
import { selfCritique } from "@/lib/self-critique";
import { searchWeb, formatSearchResults, checkSearchQuota, incrementSearchUsage } from "@/lib/web-search";

/**
 * ═══ GOLDEN EGG A/B TEST FLAG ═══
 *
 * When enabled, replaces the legacy per-agent systemPrompt with the Golden Egg
 * architecture: a compact universal shell + egg-type behavioral block + targeted
 * nearest-neighbor referrals. This reduces prompt overhead by ~50%
 * (from ~8,350 tokens down to ~4,180 tokens per request).
 *
 * How to enable: set USE_GOLDEN_EGG=true in your .env file.
 * Default: false (legacy prompt assembly, no behavior change).
 *
 * The golden egg produces the BASE system prompt only. RAG context, user memory,
 * disclaimers, output capabilities, and verification blocks are still appended
 * after — identical to the legacy path.
 */
const USE_GOLDEN_EGG = process.env.USE_GOLDEN_EGG === "true";

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

    // Strip extra fields before .strict() validation — keep only schema-defined keys
    // This preserves security (.strict() still rejects unknown fields) while allowing
    // the AI SDK to send additional transport fields like `messages`, `id`, etc.
    const sanitizedBody = {
      message: b.message,
      conversationId: b.conversationId,
      mode: b.mode,
    };

    const parsed = chatMessageSchema.safeParse(sanitizedBody);
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
            description: true,
            systemPrompt: true,
            requiredTier: true,
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

    // 3b. DEACTIVATED AGENT CHECK — block messages to deactivated agents
    if (conversation.agent && !conversation.agent.isActive) {
      return Response.json(
        { error: "This agent is currently unavailable", code: "AGENT_DEACTIVATED" },
        { status: 403 }
      );
    }

    // 3c. AGENT TIER ENFORCEMENT — users cannot use agents above their tier
    if (conversation.agent) {
      if (!canAccessAgent(tier, conversation.agent.requiredTier as Tier, conversation.agent.slug)) {
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
            error: `This agent requires ${conversation.agent.requiredTier} tier or higher`,
            code: "AGENT_TIER_REQUIRED",
            currentTier: tier,
            requiredTier: conversation.agent.requiredTier,
          },
          { status: 403 }
        );
      }
    }

    // 3d. AGENT EXPLOITATION GUARD — check every user message before it reaches the LLM
    if (conversation.agent) {
      const guardResult = guardCheck(conversation.agent.slug, message, tier, conversationId);
      if (!guardResult.allowed) {
        console.warn(`[GUARD-BLOCK] agent=${conversation.agent.slug} type=${guardResult.exploitationType} tier=${tier}`);
        logAuditEvent({
          event: "guard.exploitation_blocked",
          userId: user.id,
          metadata: {
            agentSlug: conversation.agent.slug,
            exploitationType: guardResult.exploitationType ?? "unknown",
            tier,
          },
        });
        return new Response(JSON.stringify({
          role: 'assistant',
          content: guardResult.reason || "I can't help with that request.",
          ...(guardResult.redirect ? { redirect: guardResult.redirect } : {}),
          ...(guardResult.tierUpgrade ? { tierUpgrade: guardResult.tierUpgrade } : {}),
        }), { headers: { 'Content-Type': 'application/json' } });
      }
    }

    // 4. Check mode access
    if (!isModeAllowed(tier, mode)) {
      const requiredTier = getRequiredTierForMode(mode);
      const nextTier = getNextTier(tier);
      return Response.json(
        {
          error: `${mode} mode requires ${requiredTier} tier or higher`,
          code: "TIER_MISMATCH",
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
              error: "You've used all your Cloud AI trial credits. Your Stone Engine (unlimited) is still available, or upgrade for daily Cloud AI access.",
              code: "SMART_CREDITS_EXHAUSTED",
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
          // Check for bonus credits before rejecting
          const currentUser = await db.user.findUnique({
            where: { id: user.id },
            select: { smartCreditsBonus: true },
          });

          if (currentUser && currentUser.smartCreditsBonus > 0) {
            // Deduct a bonus credit and allow the request
            await db.user.update({
              where: { id: user.id },
              data: { smartCreditsBonus: { decrement: 1 } },
            });
            logAuditEvent({
              event: "admin.action",
              userId: user.id,
              metadata: {
                action: "bonus_credit_used",
                remaining: currentUser.smartCreditsBonus - 1,
              },
            });
            // Fall through — request is allowed via bonus credit
          } else {
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
                error: `You've reached your daily Cloud AI limit (${smartQuota.smartMessagesPerDay}/day). Stone Engine is still unlimited, or purchase credits to continue with Cloud AI.`,
                code: "SMART_QUOTA_EXCEEDED",
                smartUsage: {
                  sent: smartQuota.smartMessagesSentToday,
                  limit: smartQuota.smartMessagesPerDay,
                },
                suggestion: "LOCAL",
                creditPacks: true,
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
    }

    // 5. Rate limit check
    const rateCheck = await checkRateLimitAsync(user.id, tierConfig.limits.requestsPerMinute);
    if (!rateCheck.allowed) {
      return Response.json(
        {
          error: "Too many requests. Please slow down.",
          code: "RATE_LIMITED",
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
          error: "Too many simultaneous requests. Please wait for a response.",
          code: "TOO_MANY_CONCURRENT",
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
          error: "You've reached your usage limit",
          code: "QUOTA_EXCEEDED",
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

      // ═══ PROMPT ASSEMBLY — PREFIX CACHING OPTIMIZED ═══
      // STATIC PREFIX (identical per agent, cached by vLLM):
      //   1. GENERAL_KNOWLEDGE_BLOCK
      //   2. RESPONSE_QUALITY_BLOCK
      //   3. Agent specialist systemPrompt (Golden Egg or legacy)
      //   4. Guard prompt + disclaimers (static per agent)
      //   5. VERIFICATION_BLOCK (compressed)
      //   6. OUTPUT_CAPABILITIES_BLOCK (compressed)
      // DYNAMIC SUFFIX (changes per request, NOT cached):
      //   7. TACI tier block (varies by user tier)
      //   8. Answer bank + RAG context (varies by query)
      //   9. User memory / long-term memory
      //  10. User's current message (in history)

      // --- STATIC PREFIX ---

      // 1 & 2. General Knowledge + Response Quality (universal, identical every request)
      // 3. Agent specialist systemPrompt
      if (USE_GOLDEN_EGG) {
        try {
          basePrompt = assemblePrompt(agent.slug, {
            slug: agent.slug,
            name: agent.name,
            description: agent.description ?? "",
            systemPrompt: agent.systemPrompt,
          });
        } catch (goldenEggErr) {
          console.error(`[GOLDEN-EGG-FALLBACK] assemblePrompt failed for ${agent.slug}:`, goldenEggErr);
          basePrompt = agent.systemPrompt;
        }
      } else {
        basePrompt = agent.systemPrompt;
      }

      basePrompt = GENERAL_KNOWLEDGE_BLOCK + "\n\n" + RESPONSE_QUALITY_BLOCK + "\n\n" + basePrompt;

      // 4a. Guard prompt (static per agent, golden egg only)
      if (USE_GOLDEN_EGG) {
        const guardPrompt = buildGuardPrompt(agent.slug, tier);
        if (guardPrompt) {
          basePrompt += "\n\n" + guardPrompt;
        }
      }

      // 4b. Professional disclaimers (static per agent slug)
      const disclaimers = getDisclaimerPrompts(agent.slug);
      if (disclaimers) {
        basePrompt += disclaimers;
      }

      // 5. Compressed verification protocol
      basePrompt += "\n\n" + VERIFICATION_BLOCK;

      // 6. Compressed output format
      basePrompt += "\n\n" + OUTPUT_CAPABILITIES_BLOCK;

      // --- DYNAMIC SUFFIX ---

      // 7. Tier-aware capability enhancements (TACI — varies by user tier)
      const tierCapabilityBlock = buildTierCapabilityBlock(agent.slug, tier);
      if (tierCapabilityBlock) {
        basePrompt += tierCapabilityBlock;
      }

      // 8a. Answer Injection — check for verified answers before RAG (golden egg only)
      let answerContext: string | null = null;
      if (USE_GOLDEN_EGG) {
        answerContext = await buildAnswerContext(agent.slug, message);
        if (answerContext) {
          basePrompt += answerContext;
          if (process.env.NODE_ENV === "development" || process.env.LOG_PROMPT_STATS === "true") {
            console.log(`[ANSWER-BANK] Hit for ${agent.slug}: ${getTokenEstimate(answerContext)} tokens`);
          }
        }
      }

      // 8b. RAG knowledge context (token-budgeted, varies by query)
      const RAG_TOKEN_BUDGET = answerContext ? 1000 : 3000;
      const MEMORY_TOKEN_BUDGET = 1000;

      const ragContext = await buildRagContext(agent.id, message, {
        relevanceThreshold: 0.3,
        maxTokens: RAG_TOKEN_BUDGET,
        userTier: tier,
      });
      if (ragContext) {
        basePrompt += ragContext;
      }

      // 9a. User-specific memory (token-budgeted, varies by user)
      const memoryContext = await buildMemoryContext(agent.id, user.id, {
        maxTokens: MEMORY_TOKEN_BUDGET,
      });
      if (memoryContext) {
        basePrompt += memoryContext;
      }

      // 9b. Long-term memory (MemGPT-style working + recall memory)
      try {
        const longMemoryContext = await buildMemoryPrompt(agent.id, user.id);
        if (longMemoryContext) {
          basePrompt += longMemoryContext;
        }
      } catch {
        // Long-term memory is best-effort
      }
    } else {
      // Non-agent conversations: still get verification + output format
      basePrompt += "\n\n" + VERIFICATION_BLOCK;
      basePrompt += "\n\n" + OUTPUT_CAPABILITIES_BLOCK;
    }

    // 9c. Web search — detect location-based or factual questions and inject real search results
    let searchData = "";
    {
      const msgLower = message.toLowerCase();
      const recentContext = history.slice(-4).map((m) => m.content.toLowerCase()).join(" ");
      const combinedContext = msgLower + " " + recentContext;

      const locationKeywords = ["near me", "near ", "closest", "nearby", "restaurant", "store", "shop", "dealership", "where can i", "where is", "find a", "find me", "best place", "places to", "local ", "salon", "barber", "hotel", "pharmacy", "gas station", "grocery"];
      const hasLocationKeyword = locationKeywords.some((kw) => combinedContext.includes(kw));
      const zipMatch = message.match(/\b(\d{5})\b/) || recentContext.match(/\b(\d{5})\b/);

      if (hasLocationKeyword || zipMatch) {
        try {
          const hasQuota = await checkSearchQuota(user.id, tier);
          if (hasQuota) {
            // Build the best search query from conversation context
            let searchQuery = message;

            // If current message is short (like just a ZIP), pull the actual question from history
            if (message.trim().length < 20 && history.length >= 2) {
              const prevUserMsgs = history.filter((m) => m.role === "user").slice(-3);
              const questionMsg = prevUserMsgs.find((m) => {
                const lower = m.content.toLowerCase();
                return locationKeywords.some((kw) => lower.includes(kw));
              });
              if (questionMsg) {
                searchQuery = questionMsg.content.replace(/\b(near me|to me|close to me|around me)\b/gi, "").trim();
                if (zipMatch) {
                  searchQuery = `${searchQuery} near ${zipMatch[1]}`;
                }
              }
            }

            console.warn(`[web-search] query="${searchQuery}" tier=${tier}`);
            const searchResponse = await searchWeb(searchQuery, 5);
            console.warn(`[web-search] provider=${searchResponse.provider} results=${searchResponse.results.length}`);

            if (searchResponse.results.length > 0) {
              searchData = formatSearchResults(searchResponse.results);
              await incrementSearchUsage(user.id);
            }
          }
        } catch (err) {
          console.warn("[web-search] Error:", err instanceof Error ? err.message : "unknown");
          // Search failures never block chat
        }
      }
    }

    if (searchData) {
      basePrompt += `\n\n<web_search_data role="system">\nSYSTEM-PROVIDED WEB RESULTS — use these to answer the user accurately. Present the information naturally WITHOUT reproducing these tags or this wrapper. Do NOT fabricate any business names, addresses, or details not found below.\n${searchData}\n</web_search_data>`;
    }

    // Wrap with anti-injection security directives
    const systemPrompt = wrapSystemPrompt(basePrompt);

    // Golden Egg instrumentation — log prompt sizes for A/B comparison
    if (process.env.NODE_ENV === "development" || process.env.LOG_PROMPT_STATS === "true") {
      const agentSlug = conversation.agent?.slug ?? "general";
      const tokenEst = getTokenEstimate(systemPrompt);
      console.log(`[PROMPT-STATS] agent=${agentSlug} mode=${USE_GOLDEN_EGG ? "golden-egg" : "legacy"} tokens≈${tokenEst} chars=${systemPrompt.length}`);
    }

    // 11. Stream response from model
    const startTime = Date.now();

    // Semantic cache check — return cached response if available
    if (process.env.ENABLE_SEMANTIC_CACHE === "true" && conversation.agent) {
      try {
        const cached = await checkCache(conversation.agent.slug, message);
        if (cached) {
          // Save user message to DB before returning cached response
          // (already saved above in step 7)
          return new Response(cached, {
            headers: { "Content-Type": "text/plain; charset=utf-8", "X-Cache": "HIT" },
          });
        }
      } catch {
        // Cache miss or error — continue with normal flow
      }
    }

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
        onFinish: async ({ text: rawText, usage: tokenUsage }) => {
          // Strip Qwen 3 think tags — internal reasoning must never be stored or shown
          const text = rawText.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

          // Don't save empty assistant messages (e.g. quota exhausted, empty stream)
          if (!text) {
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
                ? (process.env.FORCE_CLOUD_SMART === "true"
                    ? (process.env.SMART_MODEL ?? "claude-sonnet-4-20250514")
                    : (process.env.VLLM_SMART_MODEL ?? process.env.VLLM_MODEL ?? "/mnt/c/models/qwen3-32b-awq"))
                : (process.env.VLLM_MODEL ?? "/mnt/c/models/qwen3-32b-awq"),
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

          // ═══ MASTERPIECE ENHANCEMENTS (fire-and-forget, never break main flow) ═══
          try { trackEvent(user.id, conversation.agent?.slug || "general", "conversation_message"); } catch {}
          try { scoreResponse(message, text, conversation.agent?.slug || "general", ""); } catch {}
          try { extractLongTermMemories(conversation.agent?.id, user.id, message, text); } catch {}
          try {
            traceChat({
              userId: user.id,
              agentSlug: conversation.agent?.slug || "general",
              input: message,
              output: text,
              tokensIn: tokenUsage?.inputTokens ?? 0,
              tokensOut: tokenUsage?.outputTokens ?? 0,
              latencyMs: Date.now() - startTime,
              mode,
              tier,
            });
          } catch {}
          if (process.env.ENABLE_SEMANTIC_CACHE === "true" && conversation.agent) {
            try { saveToCache(conversation.agent.slug, message, text); } catch {}
          }
          if (process.env.ENABLE_SELF_CRITIQUE === "true") {
            try { selfCritique(text, conversation.agent?.slug || "general", message); } catch {}
          }
        },
      });
    } catch (streamError) {
      const errMsg = streamError instanceof Error ? streamError.message : String(streamError);
      const errStack = streamError instanceof Error ? streamError.stack : "";
      const errName = streamError instanceof Error ? streamError.name : "Unknown";
      // Extract upstream status/body from AI SDK errors for debugging
      const statusCode = (streamError as Record<string, unknown>)?.statusCode ?? (streamError as Record<string, unknown>)?.status;
      const responseBody = (streamError as Record<string, unknown>)?.responseBody ?? (streamError as Record<string, unknown>)?.data;
      const cause = (streamError as Record<string, unknown>)?.cause;
      console.error("POST /api/chat: streamText() FAILED", {
        errorName: errName,
        errorMessage: errMsg,
        statusCode,
        responseBody: typeof responseBody === "string" ? responseBody.slice(0, 500) : responseBody,
        cause: cause instanceof Error ? cause.message : cause,
        errorStack: errStack?.split("\n").slice(0, 5).join("\n"),
        mode,
        vllmBaseUrl: process.env.VLLM_BASE_URL?.slice(0, 40),
        vllmModel: process.env.VLLM_MODEL,
        hasVllmKey: !!process.env.VLLM_API_KEY,
        isVercel: !!process.env.VERCEL,
      });
      await concurrency.release();
      // Return error as a readable text stream so it appears in the chat bubble
      return new Response(AI_ERROR_MESSAGE, {
        status: 200,
        headers: { "Content-Type": "text/plain; charset=utf-8" },
      });
    }

    // 12. Return streaming response — only safe headers
    // Strip Qwen 3 <think> tags from vLLM responses before they reach the user.
    // Internal reasoning can leak rule names and architecture details.
    const firstTokenTime = Date.now() - startTime;
    const rawStream = streamResult.textStream;
    const thinkStripStream = new ReadableStream<string>({
      async start(controller) {
        let buffer = "";
        for await (const chunk of rawStream) {
          buffer += chunk;
          // Flush everything before any potential <think> tag
          while (true) {
            const openIdx = buffer.indexOf("<think>");
            if (openIdx === -1) {
              // No open tag — check if buffer might end with a partial "<think"
              // Keep last 6 chars in case "<think" is split across chunks
              const safeEnd = buffer.length - 6;
              if (safeEnd > 0) {
                controller.enqueue(buffer.slice(0, safeEnd));
                buffer = buffer.slice(safeEnd);
              }
              break;
            }
            // Emit everything before the <think> tag
            if (openIdx > 0) {
              controller.enqueue(buffer.slice(0, openIdx));
            }
            const closeIdx = buffer.indexOf("</think>", openIdx);
            if (closeIdx === -1) {
              // Tag opened but not closed yet — hold entire remainder in buffer
              buffer = buffer.slice(openIdx);
              break;
            }
            // Full <think>...</think> found — strip it and continue scanning
            buffer = buffer.slice(closeIdx + 8); // 8 = "</think>".length
          }
        }
        // Flush remaining buffer (strip any unclosed think tag at the very end)
        buffer = buffer.replace(/<think>[\s\S]*$/, "");
        if (buffer) {
          controller.enqueue(buffer);
        }
        controller.close();
      },
    });

    const encoder = new TextEncoder();
    const byteStream = new ReadableStream({
      async start(controller) {
        let bytesEnqueued = 0;
        const reader = thinkStripStream.getReader();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            const encoded = encoder.encode(value);
            controller.enqueue(encoded);
            bytesEnqueued += encoded.byteLength;
          }
        }
        // If vLLM returned nothing (empty stream), send a user-visible error
        // instead of silently closing with an empty body (HTTP 200 + 0 bytes).
        if (bytesEnqueued === 0) {
          console.warn("POST /api/chat: stream completed with 0 bytes — injecting fallback error message");
          controller.enqueue(encoder.encode(AI_ERROR_MESSAGE));
        }
        controller.close();
      },
    });

    return new Response(byteStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Latency-Ms": String(firstTokenTime),
        "X-Search-Injected": String(!!searchData),
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
      { error: "Something went wrong. Please try again.", code: "SERVICE_UNAVAILABLE" },
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
