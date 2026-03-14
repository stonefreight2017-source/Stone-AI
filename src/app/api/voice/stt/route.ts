/**
 * ═══ Voice STT API — Speech-to-Text ═══
 *
 * POST /api/voice/stt
 * Accepts audio (multipart/form-data or raw audio body).
 * Transcribes using faster-whisper (local, CPU mode via WSL).
 *
 * Supported formats: webm, wav, mp3, ogg, m4a
 * Max duration: 5 minutes
 * Auth: Clerk session required
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { getTierConfig } from "@/lib/tier-config";
import type { Tier } from "@/lib/tier-config";
import {
  transcribeAudio,
  checkVoiceQuota,
  recordVoiceUsage,
  detectAudioFormat,
  validateAudioBuffer,
  VoiceError,
  SUPPORTED_AUDIO_FORMATS,
  MAX_STT_DURATION_SECONDS,
} from "@/lib/voice";

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

    // 4. Extract audio from request
    let audioBuffer: Buffer;
    let audioFormat: string | null = null;

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      // Multipart form data — expect a "file" field
      const formData = await req.formData();
      const file = formData.get("file");

      if (!file || !(file instanceof Blob)) {
        return NextResponse.json(
          { error: "No audio file provided. Send a 'file' field in multipart form data." },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuffer);

      // Detect format from filename or MIME type
      const filename = file instanceof File ? file.name : undefined;
      audioFormat = detectAudioFormat(filename, file.type);
    } else if (
      contentType.startsWith("audio/") ||
      contentType === "application/octet-stream"
    ) {
      // Raw audio body
      const arrayBuffer = await req.arrayBuffer();
      audioBuffer = Buffer.from(arrayBuffer);
      audioFormat = detectAudioFormat(undefined, contentType);
    } else {
      return NextResponse.json(
        {
          error: "Invalid content type. Use multipart/form-data or send raw audio with audio/* content type.",
          supportedFormats: [...SUPPORTED_AUDIO_FORMATS],
        },
        { status: 400 }
      );
    }

    // 5. Validate audio
    const validation = validateAudioBuffer(audioBuffer);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    if (audioFormat && !(SUPPORTED_AUDIO_FORMATS as readonly string[]).includes(audioFormat)) {
      return NextResponse.json(
        {
          error: `Unsupported audio format: ${audioFormat}`,
          supportedFormats: [...SUPPORTED_AUDIO_FORMATS],
        },
        { status: 400 }
      );
    }

    // 6. Extract optional language hint from query params or form data
    const language =
      req.nextUrl.searchParams.get("language") ?? undefined;

    // 7. Transcribe
    const result = await transcribeAudio(audioBuffer, { language });

    // 8. Validate duration
    if (result.duration > MAX_STT_DURATION_SECONDS) {
      return NextResponse.json(
        {
          error: `Audio duration (${Math.round(result.duration)}s) exceeds maximum of ${MAX_STT_DURATION_SECONDS}s (5 minutes)`,
        },
        { status: 400 }
      );
    }

    // 9. Record usage
    recordVoiceUsage(user.id, result.duration);

    // 10. Return result
    const latency = Date.now() - startTime;

    return NextResponse.json(
      {
        text: result.text,
        language: result.language,
        duration: result.duration,
        confidence: result.confidence,
      },
      {
        status: 200,
        headers: {
          "X-Latency-Ms": String(latency),
        },
      }
    );
  } catch (error) {
    const latency = Date.now() - startTime;

    if (error instanceof VoiceError) {
      const statusMap: Record<string, number> = {
        INVALID_INPUT: 400,
        UNSUPPORTED_FORMAT: 400,
        AUDIO_TOO_LONG: 400,
        QUOTA_EXCEEDED: 429,
        STT_FAILED: 502,
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

    console.error("[voice/stt] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: { "X-Latency-Ms": String(latency) } }
    );
  }
}
