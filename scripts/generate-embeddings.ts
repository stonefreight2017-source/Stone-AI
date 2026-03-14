/**
 * Generate vector embeddings for all AgentKnowledgeChunk records.
 *
 * Prerequisites:
 *   - Ollama running with nomic-embed-text model pulled
 *     (WSL: ollama serve & ollama pull nomic-embed-text)
 *   - OR OpenAI API key with credits in .env
 *   - PostgreSQL with pgvector extension enabled
 *
 * Run with: npx tsx scripts/generate-embeddings.ts
 *
 * Options:
 *   --force     Re-generate embeddings even if they already exist
 *   --dry-run   Show what would be done without writing to DB
 */

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const EMBED_DIM = 768;
const BATCH_DELAY_MS = 100; // Small delay between requests to avoid overwhelming Ollama

// --- Embedding providers ---

async function embedViaOllama(
  text: string,
  baseUrl: string,
  model: string
): Promise<number[] | null> {
  try {
    const res = await fetch(`${baseUrl}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, input: text.slice(0, 8000) }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const embedding = data.embeddings?.[0];
    if (embedding && Array.isArray(embedding) && embedding.length === EMBED_DIM) {
      return embedding;
    }
    if (embedding && Array.isArray(embedding) && embedding.length > 0) {
      console.warn(
        `  Warning: Ollama returned ${embedding.length}-dim vector, expected ${EMBED_DIM}. Truncating/padding.`
      );
      return normalizeToTargetDim(embedding, EMBED_DIM);
    }
    return null;
  } catch {
    return null;
  }
}

async function embedViaOpenAI(
  text: string,
  apiKey: string,
  model: string
): Promise<number[] | null> {
  try {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: text.slice(0, 8000),
        dimensions: EMBED_DIM,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0]?.embedding ?? null;
  } catch {
    return null;
  }
}

function normalizeToTargetDim(vec: number[], targetDim: number): number[] {
  if (vec.length === targetDim) return vec;
  if (vec.length > targetDim) return vec.slice(0, targetDim);
  const result = [...vec];
  while (result.length < targetDim) result.push(0);
  return result;
}

function validateEmbedding(embedding: number[]): boolean {
  if (!Array.isArray(embedding) || embedding.length !== EMBED_DIM) return false;
  for (const val of embedding) {
    if (typeof val !== "number" || !Number.isFinite(val)) return false;
  }
  return true;
}

// --- Detect available provider ---

async function detectProvider(): Promise<string> {
  const ollamaUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
  const ollamaModel = process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";

  // Check Ollama
  try {
    const res = await fetch(`${ollamaUrl}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = await res.json();
      const models = data.models?.map((m: { name: string }) => m.name) ?? [];
      const hasModel = models.some(
        (n: string) => n.startsWith(ollamaModel) || n.includes(ollamaModel)
      );
      if (hasModel) {
        console.log(`Provider: Ollama (${ollamaModel}) at ${ollamaUrl}`);
        return "ollama";
      }
      console.log(
        `Ollama is running but ${ollamaModel} not found. Available: ${models.join(", ")}`
      );
      console.log(`Run: ollama pull ${ollamaModel}`);
    }
  } catch {
    console.log("Ollama not available at", ollamaUrl);
  }

  // Check OpenAI
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    console.log("Provider: OpenAI (text-embedding-3-small)");
    return "openai";
  }

  console.log("Provider: hash fallback (dev only, not recommended for production)");
  return "hash";
}

// Hash fallback (same as embeddings.ts)
function hashEmbed(text: string, dim: number): number[] {
  const vec = new Float64Array(dim);
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const words = normalized.split(/\s+/).filter(Boolean);
  for (const word of words) {
    for (let i = 0; i <= word.length - 3; i++) {
      const trigram = word.slice(i, i + 3);
      let h = 0;
      for (let j = 0; j < trigram.length; j++)
        h = (h * 31 + trigram.charCodeAt(j)) & 0x7fffffff;
      vec[h % dim] += 1;
    }
    let wh = 0;
    for (let j = 0; j < word.length; j++)
      wh = (wh * 31 + word.charCodeAt(j)) & 0x7fffffff;
    vec[wh % dim] += 2;
  }
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm) || 1;
  const result: number[] = [];
  for (let i = 0; i < dim; i++) result.push(vec[i] / norm);
  return result;
}

// --- Main ---

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const dryRun = args.includes("--dry-run");

  console.log("=== Stone AI — Embedding Generation ===\n");

  const provider = await detectProvider();

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  const db = new PrismaClient({ adapter });

  try {
    // Get all chunks, optionally filtering to those without embeddings
    const whereClause = force ? {} : undefined;
    let chunks: { id: string; title: string; content: string; agentId: string }[];

    if (force) {
      chunks = await db.agentKnowledgeChunk.findMany({
        select: { id: true, title: true, content: true, agentId: true },
      });
    } else {
      // Only chunks without embeddings — use raw query since Prisma can't filter on Unsupported type
      chunks = await db.$queryRawUnsafe<
        { id: string; title: string; content: string; agentId: string }[]
      >(
        `SELECT id, title, content, "agentId" FROM "AgentKnowledgeChunk" WHERE embedding IS NULL`
      );
    }

    console.log(`\nFound ${chunks.length} chunks to embed${force ? " (--force)" : ""}`);

    if (chunks.length === 0) {
      console.log("Nothing to do. All chunks already have embeddings.");
      console.log(
        'Run with --force to regenerate all embeddings.'
      );
      return;
    }

    if (dryRun) {
      console.log("\n--dry-run: Would generate embeddings for:");
      for (const chunk of chunks) {
        console.log(`  - ${chunk.title} (${chunk.content.length} chars)`);
      }
      return;
    }

    // Generate embeddings
    const ollamaUrl = process.env.OLLAMA_BASE_URL ?? "http://localhost:11434";
    const ollamaModel = process.env.OLLAMA_EMBED_MODEL ?? "nomic-embed-text";
    const openaiKey = process.env.OPENAI_API_KEY ?? "";
    const openaiModel = process.env.EMBEDDING_MODEL ?? "text-embedding-3-small";

    let success = 0;
    let failed = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const progress = `[${i + 1}/${chunks.length}]`;

      let embedding: number[] | null = null;

      if (provider === "ollama") {
        embedding = await embedViaOllama(chunk.content, ollamaUrl, ollamaModel);
      } else if (provider === "openai") {
        embedding = await embedViaOpenAI(chunk.content, openaiKey, openaiModel);
      }

      // Fallback to hash if provider failed
      if (!embedding) {
        if (provider !== "hash") {
          console.warn(`${progress} ${provider} failed for "${chunk.title}", using hash fallback`);
        }
        embedding = hashEmbed(chunk.content, EMBED_DIM);
      }

      if (!validateEmbedding(embedding)) {
        console.error(`${progress} INVALID embedding for "${chunk.title}" — skipping`);
        failed++;
        continue;
      }

      // Store embedding
      const vecStr = `[${embedding.join(",")}]`;
      await db.$queryRawUnsafe(
        `UPDATE "AgentKnowledgeChunk" SET embedding = $1::vector WHERE id = $2`,
        vecStr,
        chunk.id
      );

      console.log(
        `${progress} ${chunk.title} (${chunk.content.length} chars) — ${provider}`
      );
      success++;

      // Small delay to avoid hammering the embedding service
      if (i < chunks.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
      }
    }

    console.log(`\n=== Results ===`);
    console.log(`  Success: ${success}`);
    console.log(`  Failed:  ${failed}`);
    console.log(`  Total:   ${chunks.length}`);

    // Verify
    const embeddedCount = await db.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM "AgentKnowledgeChunk" WHERE embedding IS NOT NULL`
    );
    const totalCount = await db.agentKnowledgeChunk.count();
    console.log(
      `\n  DB: ${embeddedCount[0].count}/${totalCount} chunks have embeddings`
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
