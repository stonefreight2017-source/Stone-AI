import { NextRequest } from "next/server";
import { streamText } from "ai";
import { authenticateApiKey } from "@/lib/api-keys";
import { db } from "@/lib/db";
import { chatMessageSchema } from "@/lib/validators";
import { getTierConfig, canAccessAgent, isModeAllowed } from "@/lib/tier-config";
import { checkRateLimit } from "@/lib/rate-limiter";
import { checkQuota, checkSmartQuota, incrementDailyUsage, incrementSmartUsage, decrementFreeSmartCredits, recordTokenUsage } from "@/lib/quota";
import { getModel, SYSTEM_PROMPT } from "@/lib/ai";
import { buildRagContext } from "@/lib/embeddings";
import { buildMemoryContext } from "@/lib/agent-memory";
import { sanitizeUserInput, wrapSystemPrompt } from "@/lib/security";
import { logAuditEvent, getClientIp } from "@/lib/audit";
import { getDisclaimerPrompts } from "@/lib/agent-disclaimers";
import { VERIFICATION_BLOCK } from "@/lib/agent-shared-prompts";
import type { Tier } from "@/lib/tier-config";
import type { Role, Mode } from "@/generated/prisma/enums";

// POST /api/v1/chat — API key authenticated chat endpoint
export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate via API key
    const user = await authenticateApiKey(req.headers.get("authorization"));
    if (!user) {
      logAuditEvent({
        event: "api_key.invalid",
        ip: getClientIp(req.headers),
      });
      return Response.json({ error: "Invalid API key" }, { status: 401 });
    }

    // 1b. Check banned status
    if (user.banned) {
      logAuditEvent({
        event: "auth.banned_access",
        userId: user.id,
        ip: getClientIp(req.headers),
      });
      return Response.json({ error: "Account suspended" }, { status: 403 });
    }

    const tier = user.tier as Tier;
    if (tier !== "PRO") {
      return Response.json(
        { error: "API access requires Pro tier" },
        { status: 403 }
      );
    }

    const tierConfig = getTierConfig(tier);

    // 2. Parse input
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = chatMessageSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Invalid input" }, { status: 400 });
    }

    const { message: rawMessage, conversationId, mode } = parsed.data;

    // 2b. Sanitize user input
    const message = sanitizeUserInput(rawMessage);

    // 3. Verify conversation ownership — include agent data
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

    // 3b. Agent tier enforcement
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
          { error: `This agent requires ${conversation.agent.requiredTier} tier or higher` },
          { status: 403 }
        );
      }
    }

    // 3c. Mode access check
    if (!isModeAllowed(tier, mode)) {
      return Response.json(
        { error: `${mode} mode not available on your plan` },
        { status: 403 }
      );
    }

    // 3d. SMART mode hard cap — protect margins from cloud API abuse
    if (mode === "SMART") {
      const smartQuota = await checkSmartQuota(user.id, tier);
      if (!smartQuota.allowed) {
        logAuditEvent({
          event: "smart.quota_exceeded",
          userId: user.id,
          metadata: { endpoint: "v1/chat", smartSentToday: smartQuota.smartMessagesSentToday },
        });
        return Response.json(
          {
            error: "Smart mode quota exceeded",
            smartUsage: { sent: smartQuota.smartMessagesSentToday, limit: smartQuota.smartMessagesPerDay },
            creditPacks: [
              { credits: 10, price: 1.99 },
              { credits: 25, price: 3.99 },
              { credits: 50, price: 6.99 },
            ],
          },
          { status: 429 }
        );
      }
    }

    // 4. Rate limit
    const rateCheck = checkRateLimit(`api:${user.id}`, tierConfig.limits.requestsPerMinute);
    if (!rateCheck.allowed) {
      logAuditEvent({
        event: "rate_limit.hit",
        userId: user.id,
        metadata: { endpoint: "v1/chat" },
      });
      return Response.json(
        { error: "Rate limited", retryAfterMs: rateCheck.retryAfterMs },
        { status: 429 }
      );
    }

    // 5. Quota check
    const quota = await checkQuota(user.id, tier);
    if (!quota.allowed) {
      return Response.json({ error: "Quota exceeded" }, { status: 429 });
    }

    // 6. Save user message
    await db.message.create({
      data: {
        conversationId: conversation.id,
        role: "USER" as Role,
        content: message,
        mode: mode as Mode,
      },
    });

    if (mode === "SMART") {
      await incrementSmartUsage(user.id);
    } else {
      await incrementDailyUsage(user.id);
    }

    // 7. Build history — enforce context window limit
    const contextLimit = tierConfig.perks.contextMessages;
    const allMessages = conversation.messages;
    const recentMessages = allMessages.slice(-contextLimit);

    const history = recentMessages.map((m) => ({
      role: m.role.toLowerCase() as "user" | "assistant" | "system",
      content: m.content,
    }));
    history.push({ role: "user", content: message });

    // 8. Build system prompt (agent-aware with RAG + memory + security)
    let basePrompt = SYSTEM_PROMPT;

    if (conversation.agent) {
      const agent = conversation.agent;
      basePrompt = agent.systemPrompt;

      const ragContext = await buildRagContext(agent.id, message);
      if (ragContext) basePrompt += ragContext;

      const memoryContext = await buildMemoryContext(agent.id, user.id);
      if (memoryContext) basePrompt += memoryContext;

      // Inject professional disclaimers for regulated domains
      const disclaimers = getDisclaimerPrompts(agent.slug);
      if (disclaimers) basePrompt += disclaimers;
    }

    // Inject verification protocol (applies to all agents)
    basePrompt += "\n\n" + VERIFICATION_BLOCK;

    const systemPrompt = wrapSystemPrompt(basePrompt);

    // 9. Stream
    const model = getModel(mode as "LOCAL" | "SMART", tierConfig.localModel);

    const result = streamText({
      model,
      system: systemPrompt,
      messages: history,
      maxOutputTokens: tierConfig.limits.maxResponseTokens,
      onFinish: async ({ text, usage: tokenUsage }) => {
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

        await recordTokenUsage(
          user.id,
          tokenUsage?.inputTokens ?? 0,
          tokenUsage?.outputTokens ?? 0,
          mode as "LOCAL" | "SMART"
        );

        await db.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        });
      },
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("POST /api/v1/chat:", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
