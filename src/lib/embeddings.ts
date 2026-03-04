import { db } from "@/lib/db";

// Embedding dimensions — matches nomic-embed-text / local models
const EMBED_DIM = 768;
const TOP_K = 5;

/**
 * Generate embedding via vLLM embedding endpoint or fallback.
 * vLLM supports /v1/embeddings when loaded with an embedding model.
 * Falls back to a simple TF-IDF-like hash for dev/testing.
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const baseUrl = process.env.VLLM_BASE_URL ?? "http://localhost:8000/v1";
  const embeddingModel = process.env.EMBEDDING_MODEL;

  if (embeddingModel) {
    try {
      const res = await fetch(`${baseUrl}/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: embeddingModel,
          input: text.slice(0, 8000),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return data.data[0].embedding;
      }
    } catch {
      // Fall through to hash-based fallback
    }
  }

  // Deterministic hash-based embedding fallback (dev/testing only)
  // Good enough for basic similarity — replaced by real model in production
  return hashEmbed(text, EMBED_DIM);
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
 */
export async function indexKnowledgeChunk(chunkId: string, content: string) {
  const embedding = await generateEmbedding(content);

  if (!validateEmbedding(embedding)) {
    console.warn("Invalid embedding generated, skipping chunk:", chunkId);
    return;
  }

  const vecStr = `[${embedding.join(",")}]`;

  await db.$queryRawUnsafe(
    `UPDATE "AgentKnowledgeChunk" SET embedding = $1::vector WHERE id = $2`,
    vecStr,
    chunkId
  );
}

/**
 * Search an agent's knowledge base for chunks relevant to the query.
 * Returns top-K most similar chunks.
 */
export async function searchKnowledge(
  agentId: string,
  query: string,
  topK: number = TOP_K
): Promise<{ title: string; content: string; score: number }[]> {
  const embedding = await generateEmbedding(query);

  if (!validateEmbedding(embedding)) {
    return []; // Return empty results on invalid embedding
  }

  const vecStr = `[${embedding.join(",")}]`;

  const results = await db.$queryRawUnsafe<
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

  return results;
}

/**
 * Build RAG context string from knowledge search results.
 * Injected into the prompt before the user's message.
 */
export async function buildRagContext(
  agentId: string,
  query: string
): Promise<string> {
  const chunks = await searchKnowledge(agentId, query, TOP_K);

  if (chunks.length === 0) return "";

  const relevantChunks = chunks.filter((c) => c.score > 0.1);
  if (relevantChunks.length === 0) return "";

  const context = relevantChunks
    .map((c) => `[${c.title}]\n${c.content}`)
    .join("\n\n---\n\n");

  return `\n\n<reference_knowledge>\n${context}\n</reference_knowledge>\n\nUse the reference knowledge above to inform your response when relevant. Cite specific frameworks or data points when applicable.`;
}
