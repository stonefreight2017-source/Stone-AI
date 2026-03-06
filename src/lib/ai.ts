import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";

/**
 * vLLM provider — OpenAI-compatible API running locally.
 * Points to localhost:8000 where vLLM serves the model.
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
  baseURL: process.env.VLLM_BASE_URL ?? "http://localhost:8000/v1",
  apiKey: process.env.VLLM_API_KEY ?? "not-needed",
  name: "vllm",
});

/**
 * Cloud provider — Anthropic Claude for SMART mode and Vercel fallback.
 * Available to all paid tiers (Builder and above).
 * Also used as emergency fallback when local model is down.
 *
 * ═══ SCALING REMINDER ═══
 * At 500+ SMART mode users, check your Anthropic usage tier.
 * At 2000+ users, consider adding a second cloud provider as fallback.
 */
export const cloud = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY ?? "",
});

/**
 * Get the appropriate model based on request mode and user tier.
 *
 * LOCAL mode: Uses the tier's assigned local model
 *   - Free tier: Llama 3.1 8B (fast, good for basics)
 *   - Paid tiers: Llama 3.1 70B (full capability)
 *
 * SMART mode: Uses cloud model (Claude Sonnet) for all paid tiers
 *
 * Cloud fallback: When local model is unavailable, paid tiers
 * automatically fall back to cloud. This counts against Smart quota.
 */
export function getModel(mode: "LOCAL" | "SMART", tierLocalModel?: string) {
  if (mode === "SMART") {
    return cloud(process.env.SMART_MODEL ?? "claude-sonnet-4-20250514");
  }

  // In production (Vercel), vLLM at localhost isn't available.
  // Fall back to Claude Haiku for LOCAL mode until a cloud
  // inference provider (Groq, Together, Fireworks) is configured.
  const vllmUrl = process.env.VLLM_BASE_URL ?? "http://localhost:8000/v1";
  const isLocalhost = vllmUrl.includes("localhost") || vllmUrl.includes("127.0.0.1");
  const isVercel = !!process.env.VERCEL;

  if (isLocalhost && isVercel) {
    return cloud(process.env.LOCAL_FALLBACK_MODEL ?? "claude-haiku-4-5-20251001");
  }

  const model = tierLocalModel ?? process.env.VLLM_MODEL ?? "meta-llama/Llama-3.1-70B-Instruct";
  return vllm(model);
}

/**
 * System prompt for Stone AI assistant.
 */
export const SYSTEM_PROMPT = `You are Stone AI, a helpful, accurate, and concise AI assistant. You provide clear, well-structured responses. When you don't know something, you say so honestly. You can help with coding, writing, analysis, math, and general questions.`;
