import { createOpenAI } from "@ai-sdk/openai";

/**
 * vLLM provider — OpenAI-compatible API running locally.
 * Points to localhost:8000 where vLLM serves the model.
 */
export const vllm = createOpenAI({
  baseURL: process.env.VLLM_BASE_URL ?? "http://localhost:8000/v1",
  apiKey: "not-needed", // vLLM doesn't require an API key locally
  name: "vllm",
});

/**
 * Cloud fallback provider — OpenAI GPT for SMART mode.
 * Only available to Smart ($39) and Pro ($79) tiers.
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
