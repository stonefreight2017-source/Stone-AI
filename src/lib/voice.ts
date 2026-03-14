/**
 * ═══ Voice Capabilities — Speech-to-Text & Text-to-Speech ═══
 *
 * STT: Uses faster-whisper (local, CPU mode via WSL) for transcription.
 * TTS: Priority order — edge-tts (free, no key) → Google Cloud TTS → ElevenLabs.
 *
 * All voice processing runs on CPU to preserve GPU VRAM for vLLM inference.
 */

import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink, mkdtemp } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { getTierConfig } from "./tier-config";
import type { Tier } from "./tier-config";

const execAsync = promisify(exec);

// ═══════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════

export interface TranscriptionResult {
  text: string;
  language: string;
  duration: number;
  confidence: number;
}

export interface SynthesisOptions {
  voice?: string;
  provider?: "edge" | "google" | "elevenlabs";
}

export type TTSProvider = "edge" | "google" | "elevenlabs";

// ═══════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════

/** Supported audio input formats for STT */
export const SUPPORTED_AUDIO_FORMATS = ["webm", "wav", "mp3", "ogg", "m4a"] as const;
export type AudioFormat = (typeof SUPPORTED_AUDIO_FORMATS)[number];

/** Max audio duration for STT in seconds */
export const MAX_STT_DURATION_SECONDS = 300; // 5 minutes

/** Max text length for TTS in characters */
export const MAX_TTS_TEXT_LENGTH = 5000;

/** Daily voice minutes by tier — FREE=0, STARTER=10, PLUS=30, SMART=60, PRO=unlimited */
const VOICE_MINUTES_BY_TIER: Record<string, number> = {
  FREE: 0,
  STARTER: 10,
  PLUS: 30,
  SMART: 60,
  PRO: Infinity,
};

/** Default voices for edge-tts by locale */
const DEFAULT_EDGE_VOICES: Record<string, string> = {
  en: "en-US-AriaNeural",
  es: "es-ES-ElviraNeural",
  fr: "fr-FR-DeniseNeural",
  de: "de-DE-KatjaNeural",
  pt: "pt-BR-FranciscaNeural",
  ja: "ja-JP-NanamiNeural",
};

// ═══════════════════════════════════════════════════════════
// STT — Speech-to-Text (faster-whisper, CPU mode)
// ═══════════════════════════════════════════════════════════

/**
 * Transcribe audio using faster-whisper running in WSL (CPU mode, int8).
 *
 * Strategy:
 * 1. Write audio buffer to a temp file
 * 2. Call faster-whisper CLI via WSL with --device cpu --compute_type int8
 * 3. Parse the JSON output
 * 4. Clean up temp files
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  options?: { language?: string }
): Promise<TranscriptionResult> {
  const tempDir = await mkdtemp(join(tmpdir(), "stt-"));
  const inputPath = join(tempDir, "input.wav");
  const outputPath = join(tempDir, "output.json");

  try {
    // Write audio to temp file
    await writeFile(inputPath, audioBuffer);

    // Convert Windows path to WSL path
    const wslInputPath = windowsToWslPath(inputPath);
    const wslOutputPath = windowsToWslPath(outputPath);

    // Build faster-whisper command
    const langFlag = options?.language ? `--language ${options.language}` : "";
    const cmd = [
      "wsl",
      "--",
      "faster-whisper-cli",
      wslInputPath,
      "--device cpu",
      "--compute_type int8",
      "--output_format json",
      "--output_dir",
      wslOutputPath.replace(/\/[^/]+$/, ""), // directory only
      langFlag,
    ]
      .filter(Boolean)
      .join(" ");

    const { stdout, stderr } = await execAsync(cmd, {
      timeout: 120_000, // 2 minute timeout
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    // Parse result — faster-whisper outputs JSON with segments
    let result: TranscriptionResult;

    try {
      // Try reading the JSON output file first
      const outputContent = await readFile(
        outputPath.replace(/\.json$/, "") + ".json",
        "utf-8"
      );
      const parsed = JSON.parse(outputContent);
      result = parseWhisperOutput(parsed);
    } catch {
      // Fall back to parsing stdout
      result = parseWhisperStdout(stdout);
    }

    return result;
  } finally {
    // Clean up temp files
    await safeUnlink(inputPath);
    await safeUnlink(outputPath);
    await safeUnlink(tempDir).catch(() => {});
  }
}

/**
 * Parse faster-whisper JSON output format.
 */
function parseWhisperOutput(parsed: Record<string, unknown>): TranscriptionResult {
  const segments = (parsed.segments ?? parsed.results ?? []) as Array<{
    text?: string;
    start?: number;
    end?: number;
    avg_logprob?: number;
    no_speech_prob?: number;
  }>;

  const text = segments
    .map((s) => (s.text ?? "").trim())
    .filter(Boolean)
    .join(" ");

  const duration =
    segments.length > 0
      ? (segments[segments.length - 1]?.end ?? 0) - (segments[0]?.start ?? 0)
      : 0;

  // Calculate average confidence from logprobs
  const avgLogprob =
    segments.length > 0
      ? segments.reduce((sum, s) => sum + (s.avg_logprob ?? -0.5), 0) / segments.length
      : -0.5;

  // Convert logprob to 0-1 confidence (approximate)
  const confidence = Math.max(0, Math.min(1, 1 + avgLogprob));

  return {
    text: text || "",
    language: (parsed.language as string) ?? "en",
    duration: Math.round(duration * 100) / 100,
    confidence: Math.round(confidence * 100) / 100,
  };
}

/**
 * Fallback: parse faster-whisper stdout when JSON file is unavailable.
 */
function parseWhisperStdout(stdout: string): TranscriptionResult {
  // faster-whisper prints lines like: [00:00.000 --> 00:05.320]  Text here
  const lines = stdout.split("\n").filter((l) => l.trim().length > 0);
  const textParts: string[] = [];
  let maxEnd = 0;

  for (const line of lines) {
    const match = line.match(
      /\[(\d+):(\d+\.\d+)\s*-->\s*(\d+):(\d+\.\d+)\]\s*(.*)/
    );
    if (match) {
      const endMin = parseInt(match[3], 10);
      const endSec = parseFloat(match[4]);
      const end = endMin * 60 + endSec;
      if (end > maxEnd) maxEnd = end;
      textParts.push(match[5].trim());
    }
  }

  return {
    text: textParts.join(" ") || stdout.trim(),
    language: "en",
    duration: Math.round(maxEnd * 100) / 100,
    confidence: 0.8, // default when no logprob data
  };
}

// ═══════════════════════════════════════════════════════════
// TTS — Text-to-Speech (edge-tts → Google Cloud TTS → ElevenLabs)
// ═══════════════════════════════════════════════════════════

/**
 * Synthesize speech from text.
 *
 * Provider priority:
 * 1. edge-tts (free, no API key, Microsoft Edge TTS API via Python package)
 * 2. Google Cloud TTS (requires GOOGLE_TTS_API_KEY env var)
 * 3. ElevenLabs (requires ELEVENLABS_API_KEY env var)
 */
export async function synthesizeSpeech(
  text: string,
  options?: SynthesisOptions
): Promise<Buffer> {
  if (!text || text.length === 0) {
    throw new VoiceError("Text is required for speech synthesis", "INVALID_INPUT");
  }

  if (text.length > MAX_TTS_TEXT_LENGTH) {
    throw new VoiceError(
      `Text exceeds maximum length of ${MAX_TTS_TEXT_LENGTH} characters`,
      "TEXT_TOO_LONG"
    );
  }

  const provider = options?.provider ?? selectTTSProvider();
  const voice = options?.voice;

  switch (provider) {
    case "edge":
      return synthesizeWithEdgeTTS(text, voice);
    case "google":
      return synthesizeWithGoogleTTS(text, voice);
    case "elevenlabs":
      return synthesizeWithElevenLabs(text, voice);
    default:
      throw new VoiceError(`Unknown TTS provider: ${provider}`, "INVALID_PROVIDER");
  }
}

/**
 * Auto-select the best available TTS provider.
 */
function selectTTSProvider(): TTSProvider {
  // edge-tts is always the default (free, no API key)
  // Only use cloud providers if explicitly requested via options
  return "edge";
}

/**
 * Synthesize speech using edge-tts (Python package, free Microsoft Edge TTS API).
 * Runs as a subprocess — no API key needed.
 */
async function synthesizeWithEdgeTTS(text: string, voice?: string): Promise<Buffer> {
  const tempDir = await mkdtemp(join(tmpdir(), "tts-"));
  const outputPath = join(tempDir, "output.mp3");

  try {
    const selectedVoice = voice ?? DEFAULT_EDGE_VOICES["en"];
    // Escape text for shell — replace quotes and newlines
    const escapedText = text
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, " ")
      .replace(/\r/g, "");

    const cmd = `edge-tts --voice "${selectedVoice}" --text "${escapedText}" --write-media "${outputPath}"`;

    await execAsync(cmd, {
      timeout: 60_000, // 1 minute timeout
      maxBuffer: 50 * 1024 * 1024, // 50MB for audio
    });

    const audioBuffer = await readFile(outputPath);

    if (audioBuffer.length === 0) {
      throw new VoiceError("edge-tts produced empty output", "TTS_FAILED");
    }

    return audioBuffer;
  } finally {
    await safeUnlink(outputPath);
    await safeUnlink(tempDir).catch(() => {});
  }
}

/**
 * Synthesize speech using Google Cloud Text-to-Speech API.
 * Requires GOOGLE_TTS_API_KEY environment variable.
 */
async function synthesizeWithGoogleTTS(text: string, voice?: string): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_TTS_API_KEY;
  if (!apiKey) {
    throw new VoiceError(
      "Google TTS API key not configured (GOOGLE_TTS_API_KEY)",
      "PROVIDER_UNAVAILABLE"
    );
  }

  const selectedVoice = voice ?? "en-US-Neural2-F";

  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: selectedVoice.split("-").slice(0, 2).join("-"),
          name: selectedVoice,
        },
        audioConfig: {
          audioEncoding: "MP3",
          sampleRateHertz: 24000,
          speakingRate: 1.0,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "unknown error");
    throw new VoiceError(
      `Google TTS API error (${response.status}): ${errorBody}`,
      "TTS_FAILED"
    );
  }

  const data = (await response.json()) as { audioContent?: string };
  if (!data.audioContent) {
    throw new VoiceError("Google TTS returned empty audio content", "TTS_FAILED");
  }

  return Buffer.from(data.audioContent, "base64");
}

/**
 * Synthesize speech using ElevenLabs API.
 * Requires ELEVENLABS_API_KEY environment variable.
 */
async function synthesizeWithElevenLabs(text: string, voice?: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new VoiceError(
      "ElevenLabs API key not configured (ELEVENLABS_API_KEY)",
      "PROVIDER_UNAVAILABLE"
    );
  }

  // Default to Rachel voice if none specified
  const voiceId = voice ?? "21m00Tcm4TlvDq8ikWAM";

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "unknown error");
    throw new VoiceError(
      `ElevenLabs API error (${response.status}): ${errorBody}`,
      "TTS_FAILED"
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.length === 0) {
    throw new VoiceError("ElevenLabs returned empty audio", "TTS_FAILED");
  }

  return buffer;
}

// ═══════════════════════════════════════════════════════════
// Quota — Voice Interaction Limits
// ═══════════════════════════════════════════════════════════

/**
 * Check if a user has remaining voice quota for their tier.
 *
 * Daily limits (minutes):
 * - FREE: 0 (voice disabled)
 * - STARTER: 10 minutes
 * - PLUS: 30 minutes
 * - SMART: 60 minutes
 * - PRO: unlimited
 *
 * Note: This checks the voiceInteraction perk from tier-config.ts first.
 * If voiceInteraction is false for a tier, voice is disabled regardless of minutes.
 */
export async function checkVoiceQuota(
  userId: string,
  tier: string
): Promise<{ allowed: boolean; minutesUsed: number; minutesLimit: number }> {
  const tierConfig = getTierConfig(tier as Tier);

  // Check if voice is enabled for this tier
  if (!tierConfig.perks.voiceInteraction) {
    return {
      allowed: false,
      minutesUsed: 0,
      minutesLimit: 0,
    };
  }

  const minutesLimit = VOICE_MINUTES_BY_TIER[tier] ?? 0;

  // PRO tier has unlimited voice
  if (minutesLimit === Infinity) {
    return {
      allowed: true,
      minutesUsed: 0,
      minutesLimit: Infinity,
    };
  }

  if (minutesLimit === 0) {
    return {
      allowed: false,
      minutesUsed: 0,
      minutesLimit: 0,
    };
  }

  // Track usage via a simple in-memory store with daily reset
  // In production, this should be backed by Redis or the database
  const minutesUsed = getVoiceUsageMinutes(userId);

  return {
    allowed: minutesUsed < minutesLimit,
    minutesUsed,
    minutesLimit,
  };
}

/**
 * Record voice usage for a user.
 * @param durationSeconds Duration of the voice interaction in seconds
 */
export function recordVoiceUsage(userId: string, durationSeconds: number): void {
  const minutes = durationSeconds / 60;
  const key = getUsageKey(userId);
  const current = voiceUsageStore.get(key) ?? 0;
  voiceUsageStore.set(key, current + minutes);
}

// ═══════════════════════════════════════════════════════════
// Voice Usage Store (in-memory, daily reset)
// ═══════════════════════════════════════════════════════════

/**
 * Simple in-memory voice usage tracking with daily reset.
 * Key format: "userId:YYYY-MM-DD"
 *
 * TODO: Replace with Redis or DB-backed tracking for multi-instance deployment.
 */
const voiceUsageStore = new Map<string, number>();

function getUsageKey(userId: string): string {
  const today = new Date().toISOString().split("T")[0];
  return `${userId}:${today}`;
}

function getVoiceUsageMinutes(userId: string): number {
  const key = getUsageKey(userId);
  return voiceUsageStore.get(key) ?? 0;
}

// Clean up stale entries every hour
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const today = new Date().toISOString().split("T")[0];
      for (const key of voiceUsageStore.keys()) {
        if (!key.endsWith(today)) {
          voiceUsageStore.delete(key);
        }
      }
    },
    60 * 60 * 1000
  );
}

// ═══════════════════════════════════════════════════════════
// Utilities
// ═══════════════════════════════════════════════════════════

/**
 * Convert a Windows file path to a WSL-compatible path.
 * e.g., C:\Users\admin\temp → /mnt/c/Users/admin/temp
 */
function windowsToWslPath(windowsPath: string): string {
  return windowsPath
    .replace(/^([A-Za-z]):/, (_match, drive: string) => `/mnt/${drive.toLowerCase()}`)
    .replace(/\\/g, "/");
}

/** Safely delete a file, ignoring errors if it doesn't exist */
async function safeUnlink(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch {
    // Ignore — file may not exist
  }
}

/**
 * Detect audio format from file extension or MIME type.
 */
export function detectAudioFormat(
  filename?: string,
  mimeType?: string
): AudioFormat | null {
  if (filename) {
    const ext = filename.split(".").pop()?.toLowerCase();
    if (ext && (SUPPORTED_AUDIO_FORMATS as readonly string[]).includes(ext)) {
      return ext as AudioFormat;
    }
  }

  if (mimeType) {
    const mimeMap: Record<string, AudioFormat> = {
      "audio/webm": "webm",
      "audio/wav": "wav",
      "audio/x-wav": "wav",
      "audio/wave": "wav",
      "audio/mpeg": "mp3",
      "audio/mp3": "mp3",
      "audio/ogg": "ogg",
      "audio/x-m4a": "m4a",
      "audio/mp4": "m4a",
    };
    return mimeMap[mimeType] ?? null;
  }

  return null;
}

/**
 * Validate audio buffer — basic sanity checks.
 */
export function validateAudioBuffer(buffer: Buffer): { valid: boolean; error?: string } {
  if (!buffer || buffer.length === 0) {
    return { valid: false, error: "Empty audio buffer" };
  }

  // Max 50MB audio file
  if (buffer.length > 50 * 1024 * 1024) {
    return { valid: false, error: "Audio file exceeds 50MB limit" };
  }

  return { valid: true };
}

// ═══════════════════════════════════════════════════════════
// Error handling
// ═══════════════════════════════════════════════════════════

export type VoiceErrorCode =
  | "INVALID_INPUT"
  | "TEXT_TOO_LONG"
  | "INVALID_PROVIDER"
  | "PROVIDER_UNAVAILABLE"
  | "TTS_FAILED"
  | "STT_FAILED"
  | "QUOTA_EXCEEDED"
  | "UNSUPPORTED_FORMAT"
  | "AUDIO_TOO_LONG";

export class VoiceError extends Error {
  code: VoiceErrorCode;

  constructor(message: string, code: VoiceErrorCode) {
    super(message);
    this.name = "VoiceError";
    this.code = code;
  }
}
