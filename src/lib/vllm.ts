/**
 * vLLM management utilities.
 * Communicates with the vLLM server's OpenAI-compatible API
 * and admin endpoints.
 */

const VLLM_BASE = process.env.VLLM_BASE_URL ?? "http://127.0.0.1:8000/v1";
const VLLM_ROOT = VLLM_BASE.replace(/\/v1$/, "");

export interface VllmStatus {
  online: boolean;
  model: string | null;
  uptime: number | null;
  tokensPerSecond: number | null;
  gpuUtilization: number | null;
}

export interface VllmModel {
  id: string;
  object: string;
  owned_by: string;
}

/**
 * Check vLLM server health and get loaded model info.
 */
export async function getVllmStatus(): Promise<VllmStatus> {
  try {
    const [modelsRes, metricsRes] = await Promise.allSettled([
      fetch(`${VLLM_BASE}/models`, { signal: AbortSignal.timeout(3000) }),
      fetch(`${VLLM_ROOT}/metrics`, { signal: AbortSignal.timeout(3000) }),
    ]);

    let model: string | null = null;
    if (modelsRes.status === "fulfilled" && modelsRes.value.ok) {
      const data = await modelsRes.value.json();
      model = data.data?.[0]?.id ?? null;
    }

    let tokensPerSecond: number | null = null;
    let gpuUtilization: number | null = null;
    if (metricsRes.status === "fulfilled" && metricsRes.value.ok) {
      const text = await metricsRes.value.text();
      // Parse Prometheus metrics
      const tpsMatch = text.match(/vllm:avg_generation_throughput_toks_per_s\s+([\d.]+)/);
      if (tpsMatch) tokensPerSecond = parseFloat(tpsMatch[1]);
      const gpuMatch = text.match(/vllm:gpu_cache_usage_perc\s+([\d.]+)/);
      if (gpuMatch) gpuUtilization = parseFloat(gpuMatch[1]) * 100;
    }

    return {
      online: model !== null,
      model,
      uptime: null, // vLLM doesn't expose uptime directly
      tokensPerSecond,
      gpuUtilization,
    };
  } catch {
    return {
      online: false,
      model: null,
      uptime: null,
      tokensPerSecond: null,
      gpuUtilization: null,
    };
  }
}

/**
 * Model registry — known models that work well on RTX 5090 (24-32GB VRAM).
 * These are curated recommendations, not an exhaustive list.
 */
export interface ModelOption {
  id: string;
  name: string;
  params: string;
  quantization: string;
  vramGb: number;
  strengths: string[];
  benchmarkScore: number; // composite benchmark 0-100
  speed: "fast" | "medium" | "slow";
  recommended: boolean;
}

export const MODEL_REGISTRY: ModelOption[] = [
  {
    id: "meta-llama/Llama-3.1-70B-Instruct",
    name: "Llama 3.1 70B",
    params: "70B",
    quantization: "Q4_K_M",
    vramGb: 22,
    strengths: ["General", "Code", "Reasoning"],
    benchmarkScore: 82,
    speed: "medium",
    recommended: true,
  },
  {
    id: "meta-llama/Llama-3.3-70B-Instruct",
    name: "Llama 3.3 70B",
    params: "70B",
    quantization: "Q4_K_M",
    vramGb: 22,
    strengths: ["General", "Code", "Multilingual"],
    benchmarkScore: 85,
    speed: "medium",
    recommended: false,
  },
  {
    id: "mistralai/Mistral-Large-Instruct-2411",
    name: "Mistral Large 2",
    params: "123B",
    quantization: "Q3_K_M",
    vramGb: 28,
    strengths: ["Reasoning", "Code", "Analysis"],
    benchmarkScore: 88,
    speed: "slow",
    recommended: false,
  },
  {
    id: "deepseek-ai/DeepSeek-V3",
    name: "DeepSeek V3",
    params: "67B",
    quantization: "Q4_K_M",
    vramGb: 20,
    strengths: ["Code", "Math", "Reasoning"],
    benchmarkScore: 86,
    speed: "fast",
    recommended: false,
  },
  {
    id: "Qwen/Qwen2.5-72B-Instruct",
    name: "Qwen 2.5 72B",
    params: "72B",
    quantization: "Q4_K_M",
    vramGb: 23,
    strengths: ["Multilingual", "General", "Code"],
    benchmarkScore: 84,
    speed: "medium",
    recommended: false,
  },
];

/**
 * Get the current model config from environment.
 */
export function getCurrentModelConfig() {
  return {
    modelId: process.env.VLLM_MODEL ?? "meta-llama/Llama-3.1-70B-Instruct",
    baseUrl: process.env.VLLM_BASE_URL ?? "http://127.0.0.1:8000/v1",
    maxConcurrent: parseInt(process.env.VLLM_MAX_CONCURRENT ?? "10", 10),
  };
}
