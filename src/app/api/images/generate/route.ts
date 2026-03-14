/**
 * ═══ IMAGE GENERATION API ═══
 * POST /api/images/generate
 *
 * Generates images from text prompts using cloud APIs (DALL-E 3 / Replicate).
 * Requires Clerk auth. Per-tier daily quotas enforced.
 *
 * Request:  { prompt: string, size?: "1024x1024"|"1792x1024"|"1024x1792", quality?: "standard"|"hd" }
 * Response: { url: string, revisedPrompt: string, provider: string }
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { getOrCreateUser } from "@/lib/auth";
import { generateImage, checkImageQuota } from "@/lib/image-generation";
import { logAuditEvent, getClientIp } from "@/lib/audit";
import type { Tier } from "@/lib/tier-config";

const imageRequestSchema = z
  .object({
    prompt: z
      .string()
      .min(3, "Prompt must be at least 3 characters")
      .max(4000, "Prompt is too long (max 4,000 characters)")
      .refine((val) => val.trim().length >= 3, "Prompt cannot be only whitespace"),
    size: z
      .enum(["1024x1024", "1792x1024", "1024x1792"])
      .optional()
      .default("1024x1024"),
    quality: z.enum(["standard", "hd"]).optional().default("standard"),
  })
  .strict();

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

    // 2. Parse & validate input
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const parsed = imageRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json(
        {
          error: "Invalid input",
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    const { prompt, size, quality } = parsed.data;

    // 3. Check tier quota
    const quota = await checkImageQuota(user.id, tier);
    if (!quota.allowed) {
      logAuditEvent({
        event: "image.quota_exceeded",
        userId: user.id,
        metadata: { tier, used: quota.used, limit: quota.limit },
      });

      if (quota.limit === 0) {
        return Response.json(
          {
            error:
              "Image generation is not available on the Free plan. Upgrade to Builder or higher to generate images.",
            code: "IMAGE_TIER_REQUIRED",
            currentTier: tier,
          },
          { status: 403 }
        );
      }

      return Response.json(
        {
          error: `You've reached your daily image generation limit (${quota.limit}/day). Try again tomorrow.`,
          code: "IMAGE_QUOTA_EXCEEDED",
          usage: { used: quota.used, limit: quota.limit },
        },
        { status: 429 }
      );
    }

    // 4. Generate image
    logAuditEvent({
      event: "image.generate_start",
      userId: user.id,
      metadata: { tier, size, quality, promptLength: prompt.length },
    });

    const startTime = Date.now();

    const result = await generateImage(prompt, { size, quality }, user.id);

    const latencyMs = Date.now() - startTime;

    logAuditEvent({
      event: "image.generate_success",
      userId: user.id,
      metadata: {
        provider: result.provider,
        latencyMs,
        size,
        quality,
      },
    });

    // 5. Return result
    return Response.json(
      {
        url: result.url,
        revisedPrompt: result.revisedPrompt,
        provider: result.provider,
      },
      {
        headers: { "X-Latency-Ms": String(latencyMs) },
      }
    );
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      error instanceof Error &&
      error.message === "CONTENT_POLICY_VIOLATION"
    ) {
      return Response.json(
        {
          error:
            "Your prompt was flagged for content policy violations. Please revise and try again.",
          code: "CONTENT_POLICY_VIOLATION",
        },
        { status: 400 }
      );
    }

    console.error(
      "POST /api/images/generate:",
      error instanceof Error ? error.message : "Unknown error"
    );
    return Response.json(
      {
        error: "Image generation failed. Please try again.",
        code: "SERVICE_UNAVAILABLE",
      },
      { status: 500 }
    );
  }
}
