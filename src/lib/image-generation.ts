/**
 * ═══ IMAGE GENERATION MODULE ═══
 * Cloud-only image generation via DALL-E 3 (primary) with Replicate fallback.
 * Per-tier daily rate limits. Content moderation pre-filter.
 *
 * Environment variables required:
 *   OPENAI_API_KEY      — OpenAI API key (for DALL-E 3)
 *   REPLICATE_API_TOKEN — Replicate API token (fallback)
 *
 * CLOUD API ONLY — no local GPU, no local models.
 */

import { db } from "@/lib/db";
import type { Tier } from "@/lib/tier-config";

// ─── Types ───────────────────────────────────────────────────

export interface GeneratedImage {
  url: string;
  revisedPrompt: string;
  provider: string;
}

export interface ImageGenerationOptions {
  size?: "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
}

// ─── Per-Tier Daily Limits ───────────────────────────────────

const IMAGE_DAILY_LIMITS: Record<Tier, number> = {
  FREE: 0,
  STARTER: 5,
  PLUS: 15,
  SMART: 30,
  PRO: 100,
  ENTERPRISE: 500,
};

// ─── Content Moderation ──────────────────────────────────────

const BLOCKED_PATTERNS = [
  /\b(nude|naked|nsfw|porn|xxx|hentai|explicit)\b/i,
  /\b(gore|mutilation|dismember|torture)\b/i,
  /\b(child\s*(abuse|exploit|porn))\b/i,
  /\b(terrorist|bomb\s*making|weapon\s*of\s*mass)\b/i,
  /\b(deepfake|revenge\s*porn)\b/i,
];

function isPromptBlocked(prompt: string): boolean {
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(prompt));
}

// ─── Quota Check ─────────────────────────────────────────────

/**
 * Check whether the user has remaining image generation quota for today.
 * Returns true if allowed, false if quota exhausted.
 */
export async function checkImageQuota(
  userId: string,
  tier: Tier
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const limit = IMAGE_DAILY_LIMITS[tier];
  if (limit === 0) {
    return { allowed: false, used: 0, limit: 0 };
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Count today's image generations from the ImageGeneration audit log
  const used = await db.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*) as count FROM "ImageUsage" WHERE "userId" = $1 AND "createdAt" >= $2`,
    userId,
    todayStart
  );

  const count = Number(used[0]?.count ?? 0);
  return { allowed: count < limit, used: count, limit };
}

/**
 * Record an image generation for quota tracking.
 */
async function recordImageUsage(
  userId: string,
  provider: string,
  prompt: string
): Promise<void> {
  try {
    await db.$executeRawUnsafe(
      `INSERT INTO "ImageUsage" ("id", "userId", "provider", "prompt", "createdAt") VALUES (gen_random_uuid(), $1, $2, $3, NOW())`,
      userId,
      provider,
      prompt.slice(0, 500) // Truncate for storage
    );
  } catch {
    // Usage tracking is best-effort — don't break generation if tracking fails
    console.warn("image-generation: Failed to record usage");
  }
}

// ─── DALL-E 3 Provider ───────────────────────────────────────

async function generateWithDalle(
  prompt: string,
  options: ImageGenerationOptions
): Promise<GeneratedImage> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: options.size ?? "1024x1024",
      quality: options.quality ?? "standard",
      response_format: "url",
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message =
      (error as { error?: { message?: string } })?.error?.message ??
      `DALL-E API error: ${response.status}`;

    // If content policy violation, throw specific error
    if (response.status === 400 && message.includes("safety")) {
      throw new Error("CONTENT_POLICY_VIOLATION");
    }

    throw new Error(message);
  }

  const data = (await response.json()) as {
    data: { url: string; revised_prompt?: string }[];
  };

  const image = data.data[0];
  if (!image?.url) {
    throw new Error("No image returned from DALL-E");
  }

  return {
    url: image.url,
    revisedPrompt: image.revised_prompt ?? prompt,
    provider: "dall-e-3",
  };
}

// ─── Replicate Fallback Provider ─────────────────────────────

async function generateWithReplicate(
  prompt: string,
  options: ImageGenerationOptions
): Promise<GeneratedImage> {
  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    throw new Error("REPLICATE_API_TOKEN is not configured");
  }

  // Use SDXL on Replicate as fallback
  const response = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiToken}`,
    },
    body: JSON.stringify({
      version:
        "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      input: {
        prompt,
        width: options.size === "1792x1024" ? 1792 : 1024,
        height: options.size === "1024x1792" ? 1792 : 1024,
        num_outputs: 1,
        scheduler: "K_EULER",
        num_inference_steps: 50,
        guidance_scale: 7.5,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Replicate API error: ${response.status} — ${error}`);
  }

  const prediction = (await response.json()) as { id: string; urls: { get: string } };

  // Poll for completion (Replicate is async)
  const result = await pollReplicate(prediction.urls.get, apiToken);
  return {
    url: result,
    revisedPrompt: prompt,
    provider: "replicate-sdxl",
  };
}

async function pollReplicate(
  url: string,
  apiToken: string,
  maxAttempts = 60
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${apiToken}` },
    });

    if (!response.ok) {
      throw new Error(`Replicate poll error: ${response.status}`);
    }

    const data = (await response.json()) as {
      status: string;
      output?: string[];
      error?: string;
    };

    if (data.status === "succeeded" && data.output?.[0]) {
      return data.output[0];
    }

    if (data.status === "failed") {
      throw new Error(data.error ?? "Replicate generation failed");
    }
  }

  throw new Error("Replicate generation timed out");
}

// ─── Main Generation Function ────────────────────────────────

/**
 * Generate an image from a text prompt using cloud APIs.
 * Primary: DALL-E 3. Fallback: Replicate SDXL.
 *
 * @param prompt - Text description of the desired image
 * @param options - Size and quality options
 * @param userId - For usage tracking (optional, tracked externally if not provided)
 * @returns Generated image URL, revised prompt, and provider name
 */
export async function generateImage(
  prompt: string,
  options: ImageGenerationOptions = {},
  userId?: string
): Promise<GeneratedImage> {
  // Content moderation pre-filter
  if (isPromptBlocked(prompt)) {
    throw new Error("CONTENT_POLICY_VIOLATION");
  }

  if (prompt.trim().length < 3) {
    throw new Error("Prompt is too short. Please provide a more detailed description.");
  }

  if (prompt.length > 4000) {
    throw new Error("Prompt is too long. Maximum 4,000 characters.");
  }

  // Try DALL-E 3 first
  try {
    const result = await generateWithDalle(prompt, options);
    if (userId) {
      await recordImageUsage(userId, result.provider, prompt);
    }
    return result;
  } catch (dalleError) {
    // If content policy, don't fallback — it's a policy issue, not a provider issue
    if (
      dalleError instanceof Error &&
      dalleError.message === "CONTENT_POLICY_VIOLATION"
    ) {
      throw dalleError;
    }

    console.warn(
      "image-generation: DALL-E 3 failed, falling back to Replicate:",
      dalleError instanceof Error ? dalleError.message : dalleError
    );

    // Fallback to Replicate
    try {
      const result = await generateWithReplicate(prompt, options);
      if (userId) {
        await recordImageUsage(userId, result.provider, prompt);
      }
      return result;
    } catch (replicateError) {
      console.error(
        "image-generation: Both providers failed:",
        replicateError instanceof Error
          ? replicateError.message
          : replicateError
      );
      throw new Error(
        "Image generation is temporarily unavailable. Please try again later."
      );
    }
  }
}
