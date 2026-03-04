import { createOpenAI } from "@ai-sdk/openai";

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
 * Cloud fallback provider — OpenAI GPT for SMART mode.
 * Only available to Smart and Pro tiers.
 *
 * ═══ SCALING REMINDER ═══
 * At 500+ SMART mode users, check your OpenAI usage tier.
 * Default rate limit is 500 RPM. Request tier 3+ at:
 * https://platform.openai.com/account/limits
 * At 2000+ users, consider adding a second cloud provider as fallback.
 */
export const cloud = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "",
  name: "openai",
});

/**
 * Get the appropriate model based on request mode.
 */
export function getModel(mode: "LOCAL" | "SMART") {
  if (mode === "SMART") {
    return cloud(process.env.OPENAI_MODEL ?? "gpt-4o");
  }
  return vllm(process.env.VLLM_MODEL ?? "meta-llama/Llama-3.1-70B-Instruct");
}

/**
 * System prompt for Stone AI assistant.
 */
export const SYSTEM_PROMPT = `You are Stone AI, a helpful, accurate, and concise AI assistant. You provide clear, well-structured responses. When you don't know something, you say so honestly. You can help with coding, writing, analysis, math, and general questions.`;
