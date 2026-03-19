import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

/**
 * Custom fetch wrapper for vLLM that:
 * 1. Injects chat_template_kwargs to disable Qwen3's <think> reasoning mode
 * 2. Detects Cloudflare 403 JavaScript challenges and throws a clear error
 *
 * Without (1), Qwen3 spends the entire token budget on invisible
 * internal reasoning (<think> tags) and returns ZERO visible output.
 *
 * Without (2), Vercel serverless functions get a 403 HTML page from
 * Cloudflare's Bot Fight Mode when calling vllm.stone-ai.net, and the
 * AI SDK silently returns an empty response instead of triggering fallback.
 */
const vllmFetch: typeof globalThis.fetch = async (input, init) => {
  if (init?.body && typeof init.body === "string") {
    try {
      const body = JSON.parse(init.body);
      body.chat_template_kwargs = { enable_thinking: false };
      init = { ...init, body: JSON.stringify(body) };
    } catch {
      // Not JSON — pass through unchanged
    }
  }

  // Add browser User-Agent so Cloudflare Bot Fight Mode doesn't block the request
  const headers = new Headers(init?.headers);
  if (!headers.has("User-Agent")) {
    headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36");
  }
  init = { ...init, headers };

  const response = await globalThis.fetch(input, init);

  // Detect Cloudflare JavaScript challenge (403 with HTML instead of JSON).
  // This happens when Vercel's serverless IPs are flagged by Cloudflare's
  // Bot Fight Mode / Browser Integrity Check on the vllm.stone-ai.net tunnel.
  if (response.status === 403) {
    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("text/html")) {
      throw new Error("VLLM_CLOUDFLARE_BLOCKED: Cloudflare returned 403 JS challenge — vLLM tunnel unreachable from this environment");
    }
  }

  return response;
};

/**
 * vLLM provider — OpenAI-compatible API running locally on the Palace.
 * Points to localhost:8000 where vLLM serves Qwen3-32B-AWQ.
 *
 * For Vercel production, set VLLM_BASE_URL to the Cloudflare tunnel:
 *   VLLM_BASE_URL=https://vllm.stone-ai.net/v1
 *
 * ═══ CRITICAL: THINKING MODE DISABLED ═══
 * Qwen3 models have a <think> reasoning mode that consumes the entire
 * token budget on invisible internal reasoning. The custom fetch wrapper
 * above injects chat_template_kwargs: { enable_thinking: false } into
 * every request to prevent this. The vLLM server also has
 * --default-chat-template-kwargs set, but this is defense-in-depth.
 *
 * ═══ SCALING REMINDER ═══
 * When daily active users exceed ~50, switch to a cloud endpoint:
 *   VLLM_BASE_URL=https://api.together.xyz/v1    (Together AI)
 *   VLLM_BASE_URL=https://api.fireworks.ai/inference/v1  (Fireworks)
 *   VLLM_BASE_URL=https://api.groq.com/openai/v1  (Groq)
 * Also set VLLM_API_KEY to your provider's API key.
 * No code changes needed — the OpenAI-compatible interface works the same.
 *
 * Monitor: GET /api/admin/health → scaling.alerts
 */
export const vllm = createOpenAI({
  baseURL: process.env.VLLM_BASE_URL?.trim() ?? "http://localhost:8000/v1",
  apiKey: process.env.VLLM_API_KEY?.trim() ?? "not-needed",
  name: "vllm",
  fetch: vllmFetch,
});

/**
 * Cloud provider — Anthropic Claude. OPTIONAL FALLBACK only.
 *
 * vLLM is the PRIMARY provider for ALL tiers and ALL modes.
 * Anthropic is used ONLY when:
 *   1. ENABLE_CLOUD_FALLBACK=true AND vLLM is unreachable, OR
 *   2. FORCE_CLOUD_SMART=true (overrides vLLM for SMART mode only)
 *
 * ═══ INDEPENDENCE ═══
 * The Palace can run the entire web app on local vLLM with zero
 * cloud dependency. Anthropic is a safety net, not a requirement.
 */
export const cloud = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

/**
 * Whether Anthropic cloud fallback is enabled.
 * Set ENABLE_CLOUD_FALLBACK=true in .env to allow falling back to
 * Anthropic when vLLM is unreachable. Default: false (full independence).
 */
const cloudFallbackEnabled = process.env.ENABLE_CLOUD_FALLBACK?.trim() === "true";

/**
 * Whether to force SMART mode to use Anthropic cloud instead of vLLM.
 * Set FORCE_CLOUD_SMART=true in .env to route SMART requests to Claude Sonnet.
 * Default: false (SMART mode uses vLLM like everything else).
 */
const forceCloudSmart = process.env.FORCE_CLOUD_SMART?.trim() === "true";

/**
 * Get the appropriate model based on request mode and user tier.
 *
 * ═══ vLLM-FIRST ROUTING (Palace Independence) ═══
 *
 * ALL modes route to vLLM by default:
 *   - LOCAL mode: vLLM Qwen3-32B-AWQ (RTX 5090, fast + capable)
 *   - SMART mode: vLLM Qwen3-32B-AWQ (same model, premium quota/limits apply)
 *
 * Cloud fallback (Anthropic) is OPTIONAL and controlled by env vars:
 *   - FORCE_CLOUD_SMART=true → SMART mode uses Claude Sonnet instead of vLLM
 *   - ENABLE_CLOUD_FALLBACK=true → If vLLM URL is localhost on Vercel, fall back to cloud
 *
 * For Vercel deployment, set VLLM_BASE_URL=https://vllm.stone-ai.net/v1
 * to route through the Cloudflare tunnel to the Palace's vLLM server.
 */
export function getModel(mode: "LOCAL" | "SMART", tierLocalModel?: string) {
  const vllmUrl = process.env.VLLM_BASE_URL?.trim() ?? "http://localhost:8000/v1";
  const isLocalhost = vllmUrl.includes("localhost") || vllmUrl.includes("127.0.0.1");
  const isVercel = !!process.env.VERCEL;

  // SMART mode: use cloud (Claude Sonnet) when forced, or fall back to cloud on Vercel with no tunnel
  if (mode === "SMART") {
    if (forceCloudSmart && process.env.ANTHROPIC_API_KEY) {
      return cloud(process.env.SMART_MODEL ?? "claude-sonnet-4-20250514");
    }
    // On Vercel with localhost URL (no tunnel): fall back to cloud for SMART too
    if (isLocalhost && isVercel && process.env.ANTHROPIC_API_KEY) {
      return cloud(process.env.SMART_MODEL ?? "claude-sonnet-4-20250514");
    }
    const smartModel = process.env.VLLM_SMART_MODEL?.trim()
      ?? process.env.VLLM_MODEL?.trim()
      ?? tierLocalModel
      ?? "/home/stones/models/qwen3-32b-awq";
    return vllm(smartModel);
  }

  // LOCAL mode: always vLLM
  // On Vercel with localhost URL (no tunnel configured): fall back to cloud if enabled
  if (isLocalhost && isVercel && process.env.ANTHROPIC_API_KEY) {
    return cloud(process.env.LOCAL_FALLBACK_MODEL ?? "claude-haiku-4-5-20251001");
  }

  // On Vercel with cloud fallback enabled: use cloud provider directly.
  // This handles the case where VLLM_BASE_URL points to a Cloudflare tunnel
  // but Cloudflare's Bot Fight Mode blocks Vercel's serverless function IPs
  // with a 403 JavaScript challenge.
  if (isVercel && cloudFallbackEnabled && process.env.ANTHROPIC_API_KEY) {
    return cloud(process.env.LOCAL_FALLBACK_MODEL ?? "claude-haiku-4-5-20251001");
  }

  // Prefer env var over tier config (env var is environment-specific, tier config is code)
  const model = process.env.VLLM_MODEL?.trim() ?? tierLocalModel ?? "/home/stones/models/qwen3-32b-awq";
  return vllm(model);
}

/**
 * System prompt for Stone AI assistant.
 */
export const SYSTEM_PROMPT = `You are Stone AI, a helpful, accurate, and concise AI assistant. You provide clear, well-structured responses. When you don't know something, you say so honestly. You can help with coding, writing, analysis, math, and general questions.`;
