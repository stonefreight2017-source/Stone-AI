import { db } from "@/lib/db";

// Embedding dimensions — matches nomic-embed-text v1.5 output
const EMBED_DIM = 768;

// Tiered RAG depth — higher tiers get more knowledge chunks retrieved
export const TIERED_TOP_K: Record<string, number> = {
  FREE: 2,
  STARTER: 3,
  PLUS: 5,
  SMART: 7,
  PRO: 10,
};
const TOP_K = 5; // Default fallback

/**
 * Embedding result — includes the vector plus metadata about which provider generated it.
 * This enables embedding versioning: callers can store the provider/model alongside the vector
 * so mixed-provider embeddings can be detected and re-indexed when needed.
 */
export interface EmbeddingResult {
  embedding: number[];
  provider: string;
  model: string;
}

/**
 * Embedding provider priority:
 * 1. OpenAI (cloud) — text-embedding-3-small, works everywhere including Vercel
 * 2. Ollama (local or remote via Cloudflare tunnel) — nomic-embed-text, free
 * 3. vLLM embedding endpoint (if a separate embedding model is loaded)
 * 4. Hash fallback (dev/testing only) — deterministic trigram hashing
 *
 * OpenAI is first because it's the only provider guaranteed to work on Vercel.
 * Locally, if you prefer Ollama, unset OPENAI_API_KEY or EMBEDDING_MODEL.
 */

/**
 * Generate embedding using the best available provider.
 * Returns the embedding vector plus provider/model metadata.
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  const truncated = text.slice(0, 8000);
  const tried: string[] = [];

  // 1. Try OpenAI embeddings API (works on Vercel — top priority for production)
  const openaiKey = process.env.OPENAI_API_KEY;
  const embeddingModel = process.env.EMBEDDING_MODEL;

  if (openaiKey && embeddingModel) {
    tried.push(`openai/${embeddingModel}`);
    try {
      const res = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: embeddingModel,
          input: truncated,
          dimensions: EMBED_DIM,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        const data = await res.json();
        return {
          embedding: data.data[0].embedding,
          provider: "openai",
          model: embeddingModel,
        };
      } else {
        const errText = await res.text().catch(() => "unknown");
        console.warn(`[embeddings] OpenAI returned ${res.status}: ${errText.slice(0, 200)}`);
      }
    } catch (err) {
      console.warn(`[embeddings] OpenAI fetch failed:`, err instanceof Error ? err.message : err);
    }
  }

  // 2. Try Ollama (local or remote via Cloudflare tunnel)
  // OLLAMA_BASE_URL can be http://localhost:11434 (local) or https://vllm.stone-ai.net (tunnel)
  const ollamaUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  const ollamaModel = process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";

  tried.push(`ollama/${ollamaModel}@${ollamaUrl}`);
  try {
    const res = await fetch(`${ollamaUrl}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel,
        input: truncated,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (res.ok) {
      const data = await res.json();
      // Ollama /api/embed returns { embeddings: [[...]] }
      const embedding = data.embeddings?.[0];
      if (embedding && Array.isArray(embedding) && embedding.length > 0) {
        const normalized =
          embedding.length === EMBED_DIM
            ? embedding
            : normalizeToTargetDim(embedding, EMBED_DIM);
        return {
          embedding: normalized,
          provider: "ollama",
          model: ollamaModel,
        };
      }
    }
  } catch {
    // Ollama not available, fall through
  }

  // 3. Try vLLM embedding endpoint (if a separate embedding model is loaded)
  const vllmUrl = process.env.VLLM_EMBED_URL;
  const vllmEmbedModel = process.env.VLLM_EMBED_MODEL;

  if (vllmUrl && vllmEmbedModel) {
    tried.push(`vllm/${vllmEmbedModel}@${vllmUrl}`);
    try {
      const res = await fetch(`${vllmUrl}/v1/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: vllmEmbedModel,
          input: truncated,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) {
        const data = await res.json();
        const embedding = data.data[0].embedding;
        const normalized =
          embedding.length === EMBED_DIM
            ? embedding
            : normalizeToTargetDim(embedding, EMBED_DIM);
        return {
          embedding: normalized,
          provider: "vllm",
          model: vllmEmbedModel,
        };
      }
    } catch {
      // vLLM embed not available, fall through
    }
  }

  // 4. Deterministic hash-based embedding fallback (dev/testing only)
  console.warn(
    `[embeddings] WARNING: All embedding providers failed. Falling back to hash embedding (NOT suitable for production).\n` +
      `[embeddings] Providers tried: ${tried.join(" -> ")}\n` +
      `[embeddings] To fix: Set OPENAI_API_KEY + EMBEDDING_MODEL env vars on Vercel, or ensure Ollama is reachable at OLLAMA_BASE_URL.`
  );
  return {
    embedding: hashEmbed(truncated, EMBED_DIM),
    provider: "hash-fallback",
    model: "trigram-hash",
  };
}

/**
 * Truncate or pad an embedding vector to match the target dimensionality.
 */
function normalizeToTargetDim(vec: number[], targetDim: number): number[] {
  if (vec.length === targetDim) return vec;
  if (vec.length > targetDim) return vec.slice(0, targetDim);
  // Pad with zeros
  const result = [...vec];
  while (result.length < targetDim) result.push(0);
  return result;
}

/**
 * Deterministic hash-based pseudo-embedding.
 * Not as good as a real model but provides basic similarity matching
 * via character n-gram frequency vectors.
 */
function hashEmbed(text: string, dim: number): number[] {
  const vec = new Float64Array(dim);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const words = normalized.split(/\s+/).filter(Boolean);

  // Character trigram frequency hashing
  for (const word of words) {
    for (let i = 0; i <= word.length - 3; i++) {
      const trigram = word.slice(i, i + 3);
      const hash = trigramHash(trigram, dim);
      vec[hash] += 1;
    }
    // Also hash whole words
    const wh = trigramHash(word, dim);
    vec[wh] += 2;
  }

  // L2 normalize
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  const result: number[] = [];
  for (let i = 0; i < dim; i++) result.push(vec[i] / norm);
  return result;
}

function trigramHash(s: string, dim: number): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
  }
  return h % dim;
}

/**
 * Validate embedding vector — ensure all values are finite numbers
 * and the vector has the expected dimensionality.
 * Prevents NaN/Infinity injection into the vector database.
 */
function validateEmbedding(embedding: number[]): boolean {
  if (!Array.isArray(embedding) || embedding.length !== EMBED_DIM) return false;
  for (const val of embedding) {
    if (typeof val !== "number" || !Number.isFinite(val)) return false;
  }
  return true;
}

/**
 * Index a knowledge chunk — generate embedding and store it.
 * Returns the provider/model used so callers can track embedding versions.
 */
export async function indexKnowledgeChunk(
  chunkId: string,
  content: string
): Promise<{ provider: string; model: string } | null> {
  const result = await generateEmbedding(content);

  if (!validateEmbedding(result.embedding)) {
    console.warn(
      `[embeddings] Invalid embedding generated (provider: ${result.provider}), skipping chunk:`,
      chunkId
    );
    return null;
  }

  const vecStr = `[${result.embedding.join(",")}]`;

  const embeddingModelTag = `${result.provider}/${result.model}`;

  await db.$queryRawUnsafe(
    `UPDATE "AgentKnowledgeChunk" SET embedding = $1::vector, "embeddingModel" = $3 WHERE id = $2`,
    vecStr,
    chunkId,
    embeddingModelTag
  );

  return { provider: result.provider, model: result.model };
}

/**
 * Search result from knowledge base — includes a providerMismatch flag
 * that indicates whether the query embedding provider matched the stored chunks.
 */
export interface KnowledgeSearchResult {
  title: string;
  content: string;
  score: number;
  providerMismatch?: boolean;
}

/**
 * Search an agent's knowledge base for chunks relevant to the query.
 * Returns top-K most similar chunks.
 *
 * T-8 FIX: Filters by embeddingModel provider to prevent cross-provider
 * cosine similarity (e.g. Ollama embeddings vs OpenAI embeddings produce
 * meaningless scores). Falls back to unfiltered results with a degraded
 * confidence flag if no provider-matched chunks exist.
 */
export async function searchKnowledge(
  agentId: string,
  query: string,
  topK: number = TOP_K
): Promise<KnowledgeSearchResult[]> {
  const result = await generateEmbedding(query);

  if (!validateEmbedding(result.embedding)) {
    return []; // Return empty results on invalid embedding
  }

  if (result.provider === "hash-fallback") {
    console.warn(
      `[embeddings] searchKnowledge using hash-fallback for agent ${agentId} — results will be low quality`
    );
  }

  const vecStr = `[${result.embedding.join(",")}]`;
  const providerPrefix = result.provider; // e.g. "openai", "ollama", "vllm", "hash-fallback"

  // T-8: First, try provider-matched chunks only (plus legacy 'unknown' chunks)
  const providerMatchedResults = await db.$queryRawUnsafe<
    { title: string; content: string; score: number }[]
  >(
    `SELECT title, content, 1 - (embedding <=> $1::vector) as score
     FROM "AgentKnowledgeChunk"
     WHERE "agentId" = $2
       AND embedding IS NOT NULL
       AND ("embeddingModel" LIKE $4 || '/%' OR "embeddingModel" = 'unknown' OR "embeddingModel" IS NULL)
     ORDER BY embedding <=> $1::vector
     LIMIT $3`,
    vecStr,
    agentId,
    topK,
    providerPrefix
  );

  if (providerMatchedResults.length > 0) {
    return providerMatchedResults;
  }

  // T-8: No chunks matched the current provider — fall back to all chunks
  // but flag as degraded (cross-provider cosine similarity is unreliable)
  console.warn(
    `[embeddings] T-8 PROVIDER MISMATCH: Current provider "${providerPrefix}" ` +
      `has no matching chunks for agent ${agentId}. Stored chunks may use a different ` +
      `embedding model. Falling back to unfiltered results with degraded confidence.`
  );

  const unfilteredResults = await db.$queryRawUnsafe<
    { title: string; content: string; score: number }[]
  >(
    `SELECT title, content, 1 - (embedding <=> $1::vector) as score
     FROM "AgentKnowledgeChunk"
     WHERE "agentId" = $2 AND embedding IS NOT NULL
     ORDER BY embedding <=> $1::vector
     LIMIT $3`,
    vecStr,
    agentId,
    topK
  );

  // Mark all results as provider-mismatched so callers can handle accordingly
  return unfilteredResults.map((r) => ({ ...r, providerMismatch: true }));
}

/**
 * Estimate token count from a string (~4 chars per token).
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Build RAG context string from knowledge search results.
 * Injected into the prompt before the user's message.
 *
 * Tiered RAG: higher tiers retrieve more knowledge chunks,
 * making agents smarter at premium tiers with the same base model.
 * FREE=2, STARTER=3, PLUS=5, SMART=7, PRO=10
 *
 * Options:
 * - relevanceThreshold: minimum similarity score to include a chunk (default 0.3)
 * - maxTokens: token budget for the entire RAG context block (default 3000)
 * - topK: max number of chunks to retrieve from the vector DB (default 5)
 */
export async function buildRagContext(
  agentId: string,
  query: string,
  options?: { relevanceThreshold?: number; maxTokens?: number; topK?: number; userTier?: string }
): Promise<string> {
  const relevanceThreshold = options?.relevanceThreshold ?? 0.3;
  const maxTokens = options?.maxTokens ?? 3000;
  const topK = options?.topK ?? (options?.userTier ? (TIERED_TOP_K[options.userTier] || TIERED_TOP_K.FREE) : TOP_K);

  const chunks = await searchKnowledge(agentId, query, topK);

  if (chunks.length === 0) return "";

  // T-8: Detect provider mismatch — degraded confidence
  const hasMismatch = chunks.some((c) => c.providerMismatch);
  if (hasMismatch) {
    console.warn(
      `[embeddings] buildRagContext: provider mismatch detected for agent ${agentId}. ` +
        `Relevance scores may be unreliable. Consider re-indexing chunks with the current embedding provider.`
    );
  }

  // Filter by relevance threshold (sorted by score descending from DB)
  // When provider-mismatched, lower the threshold since scores are unreliable
  const effectiveThreshold = hasMismatch
    ? Math.min(relevanceThreshold, 0.1)
    : relevanceThreshold;
  const relevantChunks = chunks.filter((c) => c.score > effectiveThreshold);
  if (relevantChunks.length === 0) return "";

  // Token budgeting: drop lowest-scored chunks first until under budget
  // Chunks are already sorted by score desc from the DB query
  const wrapper = `\n\n<reference_knowledge>\n\n</reference_knowledge>\n\nUse the reference knowledge above to inform your response when relevant. Cite specific frameworks or data points when applicable.`;
  const wrapperTokens = estimateTokens(wrapper);
  const separatorTokens = estimateTokens("\n\n---\n\n");
  let availableTokens = maxTokens - wrapperTokens;

  // Build from highest-scored to lowest, tracking token usage
  const includedChunks: { title: string; content: string; score: number }[] =
    [];
  for (const chunk of relevantChunks) {
    const chunkText = `[${chunk.title}]\n${chunk.content}`;
    const chunkTokens =
      estimateTokens(chunkText) +
      (includedChunks.length > 0 ? separatorTokens : 0);

    if (chunkTokens > availableTokens) {
      // Skip this chunk — doesn't fit in remaining budget
      continue;
    }

    includedChunks.push(chunk);
    availableTokens -= chunkTokens;
  }

  if (includedChunks.length === 0) return "";

  const context = includedChunks
    .map((c) => `[${c.title}]\n${c.content}`)
    .join("\n\n---\n\n");

  return `\n\n<reference_knowledge>\n${context}\n</reference_knowledge>\n\nUse the reference knowledge above to inform your response when relevant. Cite specific frameworks or data points when applicable.`;
}
