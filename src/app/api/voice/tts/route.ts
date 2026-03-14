/**
 * ═══ Voice TTS API — Text-to-Speech ═══
 *
 * POST /api/voice/tts
 * Accepts JSON: { text: string, voice?: string, provider?: "edge" | "google" | "elevenlabs" }
 * Returns audio buffer with Content-Type: audio/mpeg
 *
 * Default provider: edge-tts (free, no API key, Microsoft Edge TTS via Python package)
 * Premium providers: Google Cloud TTS, ElevenLabs (require API keys)
 *
 * Max text length: 5000 characters
 * Auth: Clerk session required
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUser } from "@/lib/auth";
import { getTierConfig } from "@/lib/tier-config";
import type { Tier } from "@/lib/tier-config";
import {
  synthesizeSpeech,
  checkVoiceQuota,
  recordVoiceUsage,
  VoiceError,
  MAX_TTS_TEXT_LENGTH,
} from "@/lib/voice";

/**
 * Input validation schema — Zod .strict() per security rules.
 */
const ttsRequestSchema = z
  .object({
    text: z
      .string()
      .min(1, "Text is required")
      .max(MAX_TTS_TEXT_LENGTH, `Text exceeds maximum of ${MAX_TTS_TEXT_LENGTH} characters`),
    voice: z.string().optional(),
    provider: z.enum(["edge", "google", "elevenlabs"]).optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Authenticate
    const user = await getOrCreateUser();
    if (user.banned) {
      return NextResponse.json({ error: "Account suspended" }, { status: 403 });
    }

    const tier = user.tier as Tier;
    const tierConfig = getTierConfig(tier);

    // 2. Check voice feature access
    if (!tierConfig.perks.voiceInteraction) {
      return NextResponse.json(
        {
          error: "Voice interaction is not available on your current plan",
          upgrade: true,
        },
        { status: 403 }
      );
    }

    // 3. Check voice quota
    const quota = await checkVoiceQuota(user.id, tier);
    if (!quota.allowed) {
      return NextResponse.json(
        {
          error: "Daily voice quota exceeded",
          minutesUsed: quota.minutesUsed,
          minutesLimit: quota.minutesLimit,
        },
        { status: 429 }
      );
    }

    // 4. Parse & validate input
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = ttsRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const { text, voice, provider } = parsed.data;

    // 5. Restrict premium providers to higher tiers
    if (provider === "elevenlabs" && tier !== "PRO" && tier !== "SMART") {
      return NextResponse.json(
        {
          error: "ElevenLabs TTS is available on Executive (SMART) and Reseller (PRO) plans only",
          upgrade: true,
        },
        { status: 403 }
      );
    }

    if (provider === "google" && tier !== "PRO" && tier !== "SMART" && tier !== "PLUS") {
      return NextResponse.json(
        {
          error: "Google Cloud TTS is available on Growth (PLUS) and above plans only",
          upgrade: true,
        },
        { status: 403 }
      );
    }

    // 6. Synthesize speech
    const audioBuffer = await synthesizeSpeech(text, { voice, provider });

    // 7. Record usage — estimate duration from text length
    // Rough estimate: ~150 words per minute, ~5 chars per word → ~750 chars/min
    const estimatedDurationSeconds = Math.max(1, (text.length / 750) * 60);
    recordVoiceUsage(user.id, estimatedDurationSeconds);

    // 8. Return audio
    const latency = Date.now() - startTime;

    return new NextResponse(new Uint8Array(audioBuffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audioBuffer.length),
        "X-Latency-Ms": String(latency),
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    const latency = Date.now() - startTime;

    if (error instanceof VoiceError) {
      const statusMap: Record<string, number> = {
        INVALID_INPUT: 400,
        TEXT_TOO_LONG: 400,
        INVALID_PROVIDER: 400,
        PROVIDER_UNAVAILABLE: 503,
        TTS_FAILED: 502,
        QUOTA_EXCEEDED: 429,
      };
      const status = statusMap[error.code] ?? 500;

      return NextResponse.json(
        { error: error.message, code: error.code },
        { status, headers: { "X-Latency-Ms": String(latency) } }
      );
    }

    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("[voice/tts] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "X-Latency-Ms": String(latency) } }
    );
  }
}
