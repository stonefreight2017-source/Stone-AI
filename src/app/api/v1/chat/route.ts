/**
 * Stone AI Public API v1 Chat Endpoint
 *
 * OpenAI-compatible chat completions API authenticated via Bearer API keys.
 * This endpoint does NOT use Clerk auth; it uses api-keys.ts for auth.
 *
 * MIDDLEWARE NOTE: /api/v1/(.*) is already in the public routes list in
 * src/middleware.ts, so Clerk will not intercept these requests.
 *
 * Format (OpenAI-compatible):
 *   POST /api/v1/chat
 *   Authorization: Bearer sk_stone_...
 *   { model?, messages: [{role, content}], stream?, agent?, mode? }
 *
 * Response (non-streaming):
 *   { id, object: "chat.completion", created, model, choices, usage }
 *
 * Response (streaming):
 *   SSE stream of { id, object: "chat.completion.chunk", choices: [{delta}] }
 */
import { NextRequest } from "next/server";
import { streamText, generateText } from "ai";
import { z } from "zod";
import { authenticateApiKey } from "@/lib/api-keys";
import { db } from "@/lib/db";
import { getModel, SYSTEM_PROMPT } from "@/lib/ai";
import { getTierConfig, canAccessAgent } from "@/lib/tier-config";
import {
  checkQuota,
  checkSmartQuota,
  incrementDailyUsage,
  incrementSmartUsage,
  decrementFreeSmartCredits,
  recordTokenUsage,
} from "@/lib/quota";
import type { Tier } from "@/lib/tier-config";

// ---------------------------------------------------------------------------
// Request schema - OpenAI-compatible with Stone AI extensions
// ---------------------------------------------------------------------------
const chatRequestSchema = z
  .object({
    model: z.string().optional(),
    messages: z
      .array(
        z.object({
          role: z.enum(["system", "user", "assistant"]),
          content: z.string(),
        })
      )
      .min(1),
    stream: z.boolean().optional().default(false),
    max_tokens: z.number().int().positive().optional(),
    temperature: z.number().min(0).max(2).optional(),
    // Stone AI extensions
    agent: z.string().optional(),
    mode: z.enum(["LOCAL", "SMART"]).optional().default("LOCAL"),
  })
  .strict();

// ---------------------------------------------------------------------------
// Error helper - OpenAI-compatible error envelope
// ---------------------------------------------------------------------------
function apiError(
  message: string,
  type: string,
  code: string,
  status: number
) {
  return Response.json({ error: { message, type, code } }, { status });
}

// ---------------------------------------------------------------------------
// Generate a completion ID
// ---------------------------------------------------------------------------
function completionId(): string {
  return "chatcmpl-" + crypto.randomUUID().replace(/-/g, "").slice(0, 24);
}

// ---------------------------------------------------------------------------
// OPTIONS handler for CORS preflight
// ---------------------------------------------------------------------------
export async function OPTIONS() {
  return new Response(null, { status: 204 });
}

// ---------------------------------------------------------------------------
// POST /api/v1/chat
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // 1. Authenticate via Bearer token
  const authHeader = req.headers.get("authorization");
  const user = await authenticateApiKey(authHeader);
  if (!user) {
    return apiError(
      "Invalid or missing API key. Provide a valid Bearer token.",
      "authentication_error",
      "invalid_api_key",
      401
    );
  }

  // Banned check
  if (user.banned) {
    return apiError(
      "Account suspended.",
      "authentication_error",
      "account_suspended",
      403
    );
  }

  // 2. Check API access perk
  const tier = user.tier as Tier;
  const tierConfig = getTierConfig(tier);
  if (!tierConfig.perks.apiAccess) {
    return apiError(
      "API access requires a tier with API access enabled. Current tier: " + tier,
      "permission_error",
      "api_access_denied",
      403
    );
  }

  // 3. Parse and validate request body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError(
      "Invalid JSON in request body.",
      "invalid_request_error",
      "invalid_json",
      400
    );
  }

  const parsed = chatRequestSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    const path = firstIssue?.path.join(".") ?? "unknown";
    const msg = firstIssue?.message ?? "validation failed";
    return apiError(
      "Invalid request: " + path + " - " + msg,
      "invalid_request_error",
      "invalid_params",
      400
    );
  }

  const {
    messages,
    stream,
    max_tokens,
    agent: agentSlug,
    mode,
  } = parsed.data;

  // 4. Resolve agent (optional)
  let systemPrompt = SYSTEM_PROMPT;
  let agentRecord: {
    id: string;
    slug: string;
    name: string;
    systemPrompt: string;
    requiredTier: string;
  } | null = null;

  if (agentSlug) {
    agentRecord = await db.agent.findFirst({
      where: { slug: agentSlug },
      select: {
        id: true,
        slug: true,
        name: true,
        systemPrompt: true,
        requiredTier: true,
      },
    });

    if (!agentRecord) {
      return apiError(
        "Agent not found or inactive: " + agentSlug,
        "invalid_request_error",
        "agent_not_found",
        404
      );
    }

    // Tier enforcement for agent access
    if (
      !canAccessAgent(
        tier,
        agentRecord.requiredTier as Tier,
        agentRecord.slug
      )
    ) {
      return apiError(
        "Agent requires " + agentRecord.requiredTier + " tier or higher. Your tier: " + tier,
        "permission_error",
        "agent_tier_required",
        403
      );
    }

    systemPrompt = agentRecord.systemPrompt;
  }

  // 5. SMART mode quota check
  if (mode === "SMART") {
    const smartQuota = await checkSmartQuota(user.id, tier);
    if (!smartQuota.allowed) {
      const quotaMsg = tier === "FREE"
        ? "Free SMART trial credits exhausted. Use LOCAL mode or upgrade."
        : "SMART daily limit reached (" + smartQuota.smartMessagesPerDay + "/day). Use LOCAL mode or upgrade.";
      return apiError(quotaMsg, "rate_limit_error", "smart_quota_exceeded", 429);
    }
  }

  // 6. General quota check
  const quota = await checkQuota(user.id, tier);
  if (!quota.allowed) {
    return apiError(
      "Usage quota exceeded. Messages today: " +
        quota.messagesSentToday + "/" + quota.messagesPerDay +
        ". Tokens this month: " +
        quota.tokensUsedThisMonth + "/" + quota.tokensPerMonth,
      "rate_limit_error",
      "quota_exceeded",
      429
    );
  }

  // 7. Increment usage counters
  if (mode === "SMART") {
    if (tier === "FREE") {
      await decrementFreeSmartCredits(user.id);
    }
    await incrementSmartUsage(user.id);
  } else {
    await incrementDailyUsage(user.id);
  }

  // 8. Build messages array for the model
  // If the caller provides their own system message, skip our system prompt
  const hasSystemMessage = messages.some((m) => m.role === "system");
  const modelMessages = messages.map((m) => ({
    role: m.role as "system" | "user" | "assistant",
    content: m.content,
  }));

  // 9. Select model and determine token limits
  const model = getModel(mode, tierConfig.localModel);
  const maxTokens =
    max_tokens ??
    (mode === "SMART" && tierConfig.limits.smartMaxResponseTokens > 0
      ? tierConfig.limits.smartMaxResponseTokens
      : tierConfig.limits.maxResponseTokens);

  // Trim context to tier limit
  const contextLimit =
    mode === "SMART" && tierConfig.limits.smartContextMessages > 0
      ? tierConfig.limits.smartContextMessages
      : tierConfig.perks.contextMessages;
  const trimmedMessages = modelMessages.slice(-contextLimit);

  const id = completionId();
  const created = Math.floor(Date.now() / 1000);
  const modelName =
    mode === "SMART"
      ? (process.env.FORCE_CLOUD_SMART === "true"
          ? (process.env.SMART_MODEL ?? "claude-sonnet-4-20250514")
          : (process.env.VLLM_SMART_MODEL ?? process.env.VLLM_MODEL ?? "/mnt/c/models/qwen3-32b-awq"))
      : (process.env.VLLM_MODEL ?? "/mnt/c/models/qwen3-32b-awq");

  // ---------------------------------------------------------------------------
  // 10a. Streaming response (SSE, OpenAI-compatible)
  // ---------------------------------------------------------------------------
  if (stream) {
    try {
      const streamResult = streamText({
        model,
        system: hasSystemMessage ? undefined : systemPrompt,
        messages: trimmedMessages,
        maxOutputTokens: maxTokens,
        onFinish: async ({ usage: tokenUsage }) => {
          await recordTokenUsage(
            user.id,
            tokenUsage?.inputTokens ?? 0,
            tokenUsage?.outputTokens ?? 0,
            mode
          );
        },
      });

      // Convert AI SDK text stream to OpenAI SSE format
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of (await streamResult).textStream) {
              const payload = {
                id,
                object: "chat.completion.chunk",
                created,
                model: modelName,
                choices: [
                  {
                    index: 0,
                    delta: { content: chunk },
                    finish_reason: null,
                  },
                ],
              };
              controller.enqueue(
                encoder.encode("data: " + JSON.stringify(payload) + "\n\n")
              );
            }

            // Final chunk with finish_reason
            const finalPayload = {
              id,
              object: "chat.completion.chunk",
              created,
              model: modelName,
              choices: [
                {
                  index: 0,
                  delta: {},
                  finish_reason: "stop",
                },
              ],
            };
            controller.enqueue(
              encoder.encode("data: " + JSON.stringify(finalPayload) + "\n\n")
            );
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch {
            const errPayload = {
              error: {
                message: "Stream interrupted. Please retry.",
                type: "server_error",
                code: "stream_error",
              },
            };
            controller.enqueue(
              encoder.encode("data: " + JSON.stringify(errPayload) + "\n\n")
            );
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Latency-Ms": String(Date.now() - startTime),
        },
      });
    } catch {
      return apiError(
        "Failed to connect to AI service. Please retry.",
        "server_error",
        "model_unavailable",
        503
      );
    }
  }

  // ---------------------------------------------------------------------------
  // 10b. Non-streaming response
  // ---------------------------------------------------------------------------
  try {
    const result = await generateText({
      model,
      system: hasSystemMessage ? undefined : systemPrompt,
      messages: trimmedMessages,
      maxOutputTokens: maxTokens,
    });

    const text = result.text ?? "";
    const promptTokens = result.usage?.inputTokens ?? 0;
    const completionTokens = result.usage?.outputTokens ?? 0;

    // Record usage
    await recordTokenUsage(user.id, promptTokens, completionTokens, mode);

    return Response.json(
      {
        id,
        object: "chat.completion",
        created,
        model: modelName,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: text,
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: promptTokens,
          completion_tokens: completionTokens,
          total_tokens: promptTokens + completionTokens,
        },
      },
      {
        headers: {
          "X-Latency-Ms": String(Date.now() - startTime),
        },
      }
    );
  } catch {
    return apiError(
      "Failed to generate response. Please retry.",
      "server_error",
      "model_unavailable",
      503
    );
  }
}
