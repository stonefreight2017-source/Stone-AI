# Embedding Model Selection and Tuning — From Vectors to Value

> Palace Knowledge Seed — AI/ML Engineering
> Category: Engineering / Embeddings & Retrieval
> Version: 1.0 | Created: 2026-03-10
> Dependency: Integrates with `rag-chunking-strategies.md`, `pgvector-semantic-search.md`, `vector-similarity-distance-metrics.md`

---

## Table of Contents

1. [Embedding Fundamentals](#1-embedding-fundamentals)
2. [Dense Embedding Models](#2-dense-embedding-models)
3. [Sparse Embeddings](#3-sparse-embeddings)
4. [Hybrid Search — Dense + Sparse](#4-hybrid-search--dense--sparse)
5. [Dimension Selection](#5-dimension-selection)
6. [Domain Adaptation and Fine-Tuning](#6-domain-adaptation-and-fine-tuning)
7. [Matryoshka Embeddings](#7-matryoshka-embeddings)
8. [Normalization](#8-normalization)
9. [Batch Embedding and Caching](#9-batch-embedding-and-caching)
10. [pgvector Integration](#10-pgvector-integration)
11. [vLLM Embedding Endpoint](#11-vllm-embedding-endpoint)
12. [Evaluation and Benchmarking](#12-evaluation-and-benchmarking)
13. [Cost Comparison](#13-cost-comparison)
14. [Anti-Patterns](#14-anti-patterns)
15. [Production Implementation](#15-production-implementation)

---

## 1. Embedding Fundamentals

An embedding is a dense vector representation of text in a continuous high-dimensional space. Similar texts produce vectors that are close together. Dissimilar texts produce vectors that are far apart. This geometric property is what makes semantic search possible.

### How Embeddings Work

Text goes in, a fixed-length array of floats comes out. The model has learned, during training on millions of text pairs, which texts are semantically related. That knowledge is encoded in the mapping from text to vector positions.

```typescript
// Conceptual flow
const text = "How do I configure HNSW index parameters?";
const embedding: number[] = await embedModel.encode(text);
// Returns: [0.023, -0.041, 0.088, ..., -0.012] (1536 floats for OpenAI)
```

### Why Embedding Selection Matters

The embedding model is the lens through which your RAG system sees the world. A model trained primarily on web content will poorly represent medical terminology. A model with 384 dimensions cannot capture the same nuance as one with 1536 dimensions. A model with a 512-token context window will silently truncate your 800-token chunks.

Choosing the wrong embedding model is the most expensive mistake in a RAG pipeline because you don't discover it until users report bad retrieval, and fixing it requires re-embedding your entire corpus.

---

## 2. Dense Embedding Models

Dense embeddings represent text as fixed-length vectors where every dimension carries information. These are the standard for semantic search.

### OpenAI Models

**text-embedding-3-small**
- Dimensions: 1536 (default), supports 256-1536 via Matryoshka
- Max input: 8191 tokens
- MTEB average: 62.3
- Cost: $0.02 / 1M tokens
- Best for: Cost-sensitive production, good baseline quality

**text-embedding-3-large**
- Dimensions: 3072 (default), supports 256-3072 via Matryoshka
- Max input: 8191 tokens
- MTEB average: 64.6
- Cost: $0.13 / 1M tokens
- Best for: Maximum quality when cost isn't primary concern

```typescript
import OpenAI from 'openai';

const openai = new OpenAI();

async function embedOpenAI(
  texts: string[],
  model: 'text-embedding-3-small' | 'text-embedding-3-large' = 'text-embedding-3-small',
  dimensions?: number
): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model,
    input: texts,
    ...(dimensions && { dimensions }), // Matryoshka dimension reduction
  });

  return response.data
    .sort((a, b) => a.index - b.index)
    .map(d => d.embedding);
}

// Usage with dimension reduction
const fullEmbeddings = await embedOpenAI(["query text"], 'text-embedding-3-small');
// 1536 dimensions

const compactEmbeddings = await embedOpenAI(["query text"], 'text-embedding-3-small', 512);
// 512 dimensions — still useful, lower storage cost
```

### BGE (BAAI General Embedding)

Open-source models from BAAI. Run locally, no API costs.

**BGE-small-en-v1.5**: 384 dims, 512 token limit, MTEB 51.7
**BGE-base-en-v1.5**: 768 dims, 512 token limit, MTEB 53.3
**BGE-large-en-v1.5**: 1024 dims, 512 token limit, MTEB 54.3
**BGE-M3**: 1024 dims, 8192 token limit, multilingual, dense+sparse hybrid

BGE models use a query instruction prefix for asymmetric search:

```typescript
// BGE requires different formatting for queries vs documents
const queryText = "Represent this sentence for searching relevant passages: " + userQuery;
const documentText = chunkContent; // No prefix for documents
```

### E5 (EmbEddings from bidirEctional Encoder rEpresentations)

Microsoft's embedding family. Strong on retrieval benchmarks.

**E5-small-v2**: 384 dims, 512 tokens, MTEB 49.0
**E5-base-v2**: 768 dims, 512 tokens, MTEB 50.3
**E5-large-v2**: 1024 dims, 512 tokens, MTEB 52.0
**E5-Mistral-7B-instruct**: 4096 dims, 32K tokens, MTEB 66.6

E5 models also use instruction prefixes:

```typescript
// E5 prefix format
const queryText = "query: " + userQuery;
const documentText = "passage: " + chunkContent;
```

### GTE (General Text Embeddings)

Alibaba's embedding models. Competitive with larger models at smaller sizes.

**GTE-small**: 384 dims, 512 tokens
**GTE-base**: 768 dims, 512 tokens
**GTE-large**: 1024 dims, 512 tokens
**GTE-Qwen2-1.5B-instruct**: 1536 dims, 32K tokens

### Nomic Embed

Open-source, long-context, Matryoshka support.

**Nomic Embed v1.5**: 768 dims, 8192 tokens, MTEB 55.3
- Supports Matryoshka (truncatable dimensions)
- Supports task-type prefixes: search_query, search_document, classification, clustering

```typescript
// Nomic prefix format
const queryText = "search_query: " + userQuery;
const documentText = "search_document: " + chunkContent;
```

### Model Selection Summary

| Use Case | Recommended Model | Why |
|----------|------------------|-----|
| Production SaaS (Stone AI) | text-embedding-3-small | Cost-effective, high quality, no infra |
| Maximum quality, cost OK | text-embedding-3-large | Best MTEB scores from API models |
| Self-hosted, budget | BGE-small-en-v1.5 | Smallest, fastest, decent quality |
| Self-hosted, quality | BGE-M3 or Nomic v1.5 | Long context, hybrid search support |
| Multilingual | BGE-M3 | 100+ languages, dense+sparse |
| Local dev/testing | Nomic v1.5 | Open, fast, good quality |

---

## 3. Sparse Embeddings

Sparse embeddings represent text as high-dimensional vectors where most values are zero. Only dimensions corresponding to relevant terms have non-zero weights. They excel at exact term matching.

### BM25

BM25 is the gold standard for keyword search. Not technically an embedding model, but produces sparse representations used identically in retrieval.

```sql
-- PostgreSQL full-text search (BM25-like)
-- Create a tsvector column for BM25-style search
ALTER TABLE document_chunks ADD COLUMN tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

CREATE INDEX idx_chunks_tsv ON document_chunks USING gin(tsv);

-- Query
SELECT id, content,
  ts_rank_cd(tsv, plainto_tsquery('english', 'HNSW index parameters')) as rank
FROM document_chunks
WHERE tsv @@ plainto_tsquery('english', 'HNSW index parameters')
ORDER BY rank DESC
LIMIT 10;
```

### SPLADE (Sparse Lexical and Expansion Model)

SPLADE is a learned sparse model. Unlike BM25, it expands queries with related terms. Searching "dog" might activate dimensions for "canine," "pet," "puppy."

- Trained end-to-end for retrieval
- Handles synonyms and term expansion
- Produces sparse vectors (30K+ dimensions, 100-300 non-zero)
- Better than BM25 on most benchmarks

### When Sparse Beats Dense

- **Exact term matching**: "error code E-4502" — dense models might match semantically similar errors; sparse ensures exact match
- **Rare terminology**: Dense models underperform on domain-specific jargon not well-represented in training data
- **Named entities**: Person names, product names, specific identifiers
- **Boolean-style queries**: When users search for specific terms they expect to find

---

## 4. Hybrid Search — Dense + Sparse

The best retrieval combines dense (semantic) and sparse (lexical) search. Dense catches meaning. Sparse catches exact terms. Together, they cover each other's blind spots.

### Reciprocal Rank Fusion (RRF)

RRF is the standard method for combining two ranked lists into one. It's simple, effective, and doesn't require calibrating scores across different models.

```typescript
interface SearchResult {
  id: string;
  content: string;
  score: number;
}

function reciprocalRankFusion(
  denseResults: SearchResult[],
  sparseResults: SearchResult[],
  k: number = 60, // RRF constant, typically 60
  denseWeight: number = 0.7,
  sparseWeight: number = 0.3
): SearchResult[] {
  const scores = new Map<string, { score: number; content: string }>();

  // Score dense results
  denseResults.forEach((result, rank) => {
    const rrfScore = denseWeight * (1 / (k + rank + 1));
    const existing = scores.get(result.id);
    scores.set(result.id, {
      score: (existing?.score ?? 0) + rrfScore,
      content: result.content,
    });
  });

  // Score sparse results
  sparseResults.forEach((result, rank) => {
    const rrfScore = sparseWeight * (1 / (k + rank + 1));
    const existing = scores.get(result.id);
    scores.set(result.id, {
      score: (existing?.score ?? 0) + rrfScore,
      content: result.content,
    });
  });

  // Sort by combined score
  return Array.from(scores.entries())
    .map(([id, { score, content }]) => ({ id, content, score }))
    .sort((a, b) => b.score - a.score);
}
```

### Full Hybrid Search in pgvector + PostgreSQL

```typescript
async function hybridSearch(
  query: string,
  topK: number = 10,
  denseWeight: number = 0.7
): Promise<SearchResult[]> {
  const queryEmbedding = await embed(query);

  const results = await prisma.$queryRaw<SearchResult[]>`
    WITH dense_results AS (
      SELECT id, content,
        ROW_NUMBER() OVER (ORDER BY embedding <=> ${queryEmbedding}::vector) as rank
      FROM document_chunks
      WHERE embedding IS NOT NULL
      ORDER BY embedding <=> ${queryEmbedding}::vector
      LIMIT ${topK * 2}
    ),
    sparse_results AS (
      SELECT id, content,
        ROW_NUMBER() OVER (ORDER BY ts_rank_cd(tsv, plainto_tsquery('english', ${query})) DESC) as rank
      FROM document_chunks
      WHERE tsv @@ plainto_tsquery('english', ${query})
      ORDER BY ts_rank_cd(tsv, plainto_tsquery('english', ${query})) DESC
      LIMIT ${topK * 2}
    ),
    combined AS (
      SELECT
        COALESCE(d.id, s.id) as id,
        COALESCE(d.content, s.content) as content,
        COALESCE(${denseWeight}::float * (1.0 / (60 + d.rank)), 0) +
        COALESCE(${1 - denseWeight}::float * (1.0 / (60 + s.rank)), 0) as score
      FROM dense_results d
      FULL OUTER JOIN sparse_results s ON d.id = s.id
    )
    SELECT id, content, score
    FROM combined
    ORDER BY score DESC
    LIMIT ${topK}
  `;

  return results;
}
```

### Weight Tuning

- **0.7 dense / 0.3 sparse**: Good default for general content
- **0.5 / 0.5**: When content has lots of specific terms (technical docs, code)
- **0.8 / 0.2**: When queries are conceptual ("how does X work?")
- **0.3 / 0.7**: When queries are specific lookups ("error ERR_CONNECTION_REFUSED fix")

---

## 5. Dimension Selection

Embedding dimensions directly affect storage cost, query speed, and retrieval quality.

### Dimension Comparison

| Dimensions | Storage per Vector | Storage per 1M Vectors | HNSW Memory | Quality (Relative) |
|-----------|-------------------|----------------------|-------------|-------------------|
| 256 | 1 KB | 1 GB | ~4 GB | 85-90% of max |
| 384 | 1.5 KB | 1.5 GB | ~6 GB | 90-93% of max |
| 512 | 2 KB | 2 GB | ~8 GB | 93-95% of max |
| 768 | 3 KB | 3 GB | ~12 GB | 95-97% of max |
| 1024 | 4 KB | 4 GB | ~16 GB | 97-99% of max |
| 1536 | 6 KB | 6 GB | ~24 GB | 99-100% of max |
| 3072 | 12 KB | 12 GB | ~48 GB | 100% |

### The Diminishing Returns Curve

Going from 256 to 512 dimensions buys you significant quality. Going from 1536 to 3072 buys you almost nothing for most use cases. The practical sweet spot is:

- **384**: Budget self-hosted deployments, prototyping
- **768**: Balanced cost/quality for most production systems
- **1536**: When retrieval quality is paramount (Stone AI production)

### Storage Calculation for Stone AI

```
Palace knowledge seeds: ~200 documents × ~50 chunks each = 10,000 vectors
Agent memories per user: ~500 vectors
At 1,000 users: 500,000 memory vectors + 10,000 seed vectors = 510,000 vectors

At 1536 dimensions:
510,000 × 6 KB = 3.06 GB raw vector storage
HNSW index overhead: ~4x = 12.24 GB index memory

At 768 dimensions:
510,000 × 3 KB = 1.53 GB raw vector storage
HNSW index overhead: ~4x = 6.12 GB index memory
```

For Stone AI at current scale, 1536 dimensions is fine. At 100K+ users, dimension reduction becomes worth evaluating.

---

## 6. Domain Adaptation and Fine-Tuning

General-purpose embeddings are trained on web crawl data. They work well for general text but underperform on domain-specific content: medical terminology, legal jargon, code constructs, gaming slang.

### When to Fine-Tune

Fine-tune embeddings when:
- Your domain vocabulary isn't well-represented in general training data
- Retrieval accuracy on your test set is below acceptable thresholds
- You have domain-specific training pairs (query, relevant document)

Don't fine-tune when:
- You have fewer than 1,000 training pairs
- Your content is general-purpose (news, blog posts, common topics)
- The baseline model already achieves acceptable retrieval accuracy

### Contrastive Fine-Tuning

The most effective approach: train the model to pull relevant pairs closer and push irrelevant pairs apart.

```python
# Using sentence-transformers (Python — training typically done in Python)
from sentence_transformers import SentenceTransformer, InputExample, losses
from torch.utils.data import DataLoader

model = SentenceTransformer('BAAI/bge-base-en-v1.5')

# Training data: (query, positive_passage, negative_passage) triplets
train_examples = [
    InputExample(texts=[
        "How to configure HNSW parameters",
        "HNSW index accepts m (connections per layer) and ef_construction parameters",
        "PostgreSQL VACUUM reclaims storage from deleted rows"
    ]),
    # ... thousands more triplets
]

train_dataloader = DataLoader(train_examples, shuffle=True, batch_size=16)
train_loss = losses.TripletLoss(model)

model.fit(
    train_objectives=[(train_dataloader, train_loss)],
    epochs=3,
    warmup_steps=100,
    output_path='./fine-tuned-palace-embeddings'
)
```

### Generating Training Pairs from Existing Data

You don't always need labeled data. Generate training pairs from your existing content:

```typescript
// Use LLM to generate synthetic queries for existing chunks
async function generateTrainingPairs(
  chunks: string[]
): Promise<Array<{ query: string; positive: string }>> {
  const pairs: Array<{ query: string; positive: string }> = [];

  for (const chunk of chunks) {
    const response = await llm.generate({
      prompt: `Given this text passage, generate 3 diverse questions that this passage would answer. Return as JSON array of strings.

Passage: ${chunk}

Questions:`,
    });

    const questions = JSON.parse(response) as string[];
    for (const q of questions) {
      pairs.push({ query: q, positive: chunk });
    }
  }

  return pairs;
}
```

---

## 7. Matryoshka Embeddings

Matryoshka Representation Learning (MRL) trains embeddings so that the first N dimensions form a valid, lower-dimensional embedding. You can truncate a 1536-dim vector to 512 dims and it still works — with graceful quality degradation.

### How It Works

During training, the loss function is computed at multiple dimension checkpoints. The model learns to pack the most important information into the early dimensions.

```
Full vector:    [d1, d2, d3, d4, ..., d1536]  → 100% quality
First 768:      [d1, d2, d3, d4, ..., d768]   → ~97% quality
First 512:      [d1, d2, d3, d4, ..., d512]   → ~95% quality
First 256:      [d1, d2, d3, d4, ..., d256]   → ~90% quality
```

### Models with Matryoshka Support

- **OpenAI text-embedding-3-small/large**: Native support via `dimensions` parameter
- **Nomic Embed v1.5**: Supports 64, 128, 256, 512, 768 dimensions
- **BGE-M3**: Partial support (best at native 1024)

### Practical Use: Progressive Retrieval

Use Matryoshka for multi-stage retrieval — fast coarse search with small dimensions, then precise reranking with full dimensions:

```typescript
async function progressiveRetrieval(
  query: string,
  topK: number = 10
): Promise<SearchResult[]> {
  // Stage 1: Fast search with 256-dim embeddings
  const coarseEmbedding = await embedOpenAI([query], 'text-embedding-3-small', 256);

  const candidates = await prisma.$queryRaw`
    SELECT id, content, full_embedding
    FROM document_chunks
    ORDER BY embedding_256 <=> ${coarseEmbedding[0]}::vector(256)
    LIMIT ${topK * 5}
  `;

  // Stage 2: Rerank with full 1536-dim embeddings
  const fullQueryEmbedding = await embedOpenAI([query], 'text-embedding-3-small');

  const reranked = candidates
    .map(c => ({
      ...c,
      similarity: cosineSimilarity(fullQueryEmbedding[0], c.full_embedding),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return reranked;
}
```

### Storage Strategy with Matryoshka

```sql
-- Store both compact and full embeddings
ALTER TABLE document_chunks
  ADD COLUMN embedding_256 vector(256),  -- for fast coarse search
  ADD COLUMN embedding_full vector(1536); -- for precise reranking

-- Index only the compact embedding for speed
CREATE INDEX idx_chunks_embed_256 ON document_chunks
  USING hnsw (embedding_256 vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

---

## 8. Normalization

### L2 Normalization

L2 normalization scales a vector so its magnitude (L2 norm) equals 1. After normalization, cosine similarity equals dot product, which is faster to compute.

```typescript
function l2Normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (norm === 0) return vector;
  return vector.map(v => v / norm);
}
```

### When to Normalize

- **Always normalize** before storing if using cosine distance (`<=>` in pgvector)
- **Don't normalize** if using L2 distance (`<->`) and magnitude matters
- **Most API models** (OpenAI, Cohere) return pre-normalized embeddings
- **Self-hosted models** may or may not normalize — check documentation

### Impact on Similarity Scores

Normalized vectors produce cosine similarities in [-1, 1]. In practice, text embeddings almost always produce positive similarities (0 to 1) because text vectors rarely point in opposite directions.

| Similarity Score | Interpretation |
|-----------------|---------------|
| 0.90+ | Very high similarity — near-duplicate or paraphrase |
| 0.80-0.90 | High similarity — same topic, closely related |
| 0.70-0.80 | Moderate similarity — related topics |
| 0.50-0.70 | Low similarity — loosely related |
| Below 0.50 | Not meaningfully related |

These ranges are approximate and vary by model. Always calibrate thresholds against your specific model and data.

---

## 9. Batch Embedding and Caching

### Batch Processing

Never embed one text at a time in production. API calls have fixed overhead (network latency, connection setup). Batch to amortize it.

```typescript
async function batchEmbed(
  texts: string[],
  batchSize: number = 100,
  model: string = 'text-embedding-3-small'
): Promise<number[][]> {
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const response = await openai.embeddings.create({
      model,
      input: batch,
    });

    const sorted = response.data
      .sort((a, b) => a.index - b.index)
      .map(d => d.embedding);

    allEmbeddings.push(...sorted);

    // Respect rate limits
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return allEmbeddings;
}
```

### Embedding Cache

Cache embeddings to avoid re-computing for repeated content. Use a content hash as the cache key.

```typescript
import crypto from 'crypto';

class EmbeddingCache {
  private cache = new Map<string, number[]>();

  private hash(text: string, model: string, dims: number): string {
    return crypto
      .createHash('sha256')
      .update(`${model}:${dims}:${text}`)
      .digest('hex');
  }

  async getOrEmbed(
    text: string,
    embedFn: (text: string) => Promise<number[]>,
    model: string = 'default',
    dims: number = 1536
  ): Promise<number[]> {
    const key = this.hash(text, model, dims);

    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }

    const embedding = await embedFn(text);
    this.cache.set(key, embedding);
    return embedding;
  }
}

// For production, use Redis instead of in-memory Map
async function getCachedEmbedding(
  text: string,
  model: string
): Promise<number[] | null> {
  const key = `embed:${model}:${crypto.createHash('sha256').update(text).digest('hex')}`;
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  return null;
}

async function setCachedEmbedding(
  text: string,
  model: string,
  embedding: number[]
): Promise<void> {
  const key = `embed:${model}:${crypto.createHash('sha256').update(text).digest('hex')}`;
  await redis.set(key, JSON.stringify(embedding), 'EX', 86400 * 30); // 30-day TTL
}
```

---

## 10. pgvector Integration

### Storing Embeddings with Prisma

Prisma doesn't have native vector type support. Use raw SQL for vector operations.

```typescript
// Ingestion: store chunk with embedding
async function storeChunkEmbedding(
  chunkId: string,
  content: string,
  embedding: number[]
): Promise<void> {
  const vectorString = `[${embedding.join(',')}]`;

  await prisma.$executeRaw`
    UPDATE document_chunks
    SET embedding = ${vectorString}::vector,
        updated_at = NOW()
    WHERE id = ${chunkId}::uuid
  `;
}

// Retrieval: find similar chunks
async function findSimilarChunks(
  queryEmbedding: number[],
  topK: number = 5,
  minSimilarity: number = 0.7
): Promise<Array<{ id: string; content: string; similarity: number }>> {
  const vectorString = `[${queryEmbedding.join(',')}]`;

  return prisma.$queryRaw`
    SELECT id, content,
      1 - (embedding <=> ${vectorString}::vector) as similarity
    FROM document_chunks
    WHERE embedding IS NOT NULL
    HAVING 1 - (embedding <=> ${vectorString}::vector) >= ${minSimilarity}
    ORDER BY embedding <=> ${vectorString}::vector
    LIMIT ${topK}
  `;
}
```

### Index Type Selection

**HNSW (Hierarchical Navigable Small World)**:
- Better query performance
- Higher memory usage
- Slower to build
- Supports incremental inserts
- Best for: production workloads, read-heavy

**IVFFlat (Inverted File with Flat Compression)**:
- Faster to build
- Lower memory usage
- Requires periodic retraining (REINDEX) as data changes
- Best for: large datasets, write-heavy, budget memory

```sql
-- HNSW index (recommended for Stone AI)
CREATE INDEX idx_chunks_hnsw ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- IVFFlat index (alternative for large scale)
CREATE INDEX idx_chunks_ivfflat ON document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

---

## 11. vLLM Embedding Endpoint

When running vLLM locally (Palace infrastructure), you can use the OpenAI-compatible `/v1/embeddings` endpoint with supported embedding models.

### Setup

```bash
# Start vLLM with an embedding model
python -m vllm.entrypoints.openai.api_server \
  --model BAAI/bge-base-en-v1.5 \
  --task embed \
  --port 8001 \
  --max-model-len 512
```

### TypeScript Client

```typescript
const VLLM_EMBEDDING_URL = process.env.VLLM_EMBEDDING_URL || 'http://localhost:8001';

async function embedLocal(texts: string[]): Promise<number[][]> {
  const response = await fetch(`${VLLM_EMBEDDING_URL}/v1/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'BAAI/bge-base-en-v1.5',
      input: texts,
    }),
  });

  if (!response.ok) {
    throw new Error(`vLLM embedding failed: ${response.status}`);
  }

  const data = await response.json();
  return data.data
    .sort((a: any, b: any) => a.index - b.index)
    .map((d: any) => d.embedding);
}
```

### Embedding Model Serving Considerations

- Embedding models are much smaller than generation models (BGE-base is ~440MB vs Qwen 32B at ~17GB quantized)
- Can run alongside your generation model on the same GPU with minimal VRAM impact
- Throughput is high: thousands of embeddings per second on a single GPU
- Latency is low: 5-20ms per batch vs 50-200ms for API calls

---

## 12. Evaluation and Benchmarking

### MTEB (Massive Text Embedding Benchmark)

MTEB is the standard benchmark for embedding models. It covers 58 datasets across 8 tasks: Classification, Clustering, Pair Classification, Reranking, Retrieval, STS, Summarization, and BitextMining.

**Key MTEB scores (retrieval subset, 2025-2026)**:

| Model | MTEB Retrieval | Dimensions | Open Source |
|-------|---------------|-----------|------------|
| text-embedding-3-large | 55.4 | 3072 | No |
| text-embedding-3-small | 51.5 | 1536 | No |
| E5-Mistral-7B-instruct | 56.9 | 4096 | Yes |
| BGE-M3 | 48.2 | 1024 | Yes |
| BGE-large-en-v1.5 | 47.1 | 1024 | Yes |
| Nomic Embed v1.5 | 47.0 | 768 | Yes |
| GTE-large | 45.1 | 1024 | Yes |

### Custom Evaluation

MTEB scores tell you about general quality. Your evaluation must measure performance on YOUR data.

```typescript
interface EvalResult {
  model: string;
  precision_at_5: number;
  recall_at_5: number;
  mrr: number; // Mean Reciprocal Rank
  latency_ms: number;
}

async function evaluateModel(
  modelName: string,
  embedFn: (texts: string[]) => Promise<number[][]>,
  testSet: Array<{ query: string; relevantChunkIds: string[] }>,
  chunks: Array<{ id: string; content: string }>
): Promise<EvalResult> {
  const startTime = Date.now();

  // Embed all chunks
  const chunkEmbeddings = await embedFn(chunks.map(c => c.content));

  let totalPrecision = 0;
  let totalRecall = 0;
  let totalMRR = 0;

  for (const test of testSet) {
    const queryEmbedding = (await embedFn([test.query]))[0];

    // Find top-5 most similar chunks
    const similarities = chunkEmbeddings.map((ce, idx) => ({
      id: chunks[idx].id,
      similarity: cosineSimilarity(queryEmbedding, ce),
    }));

    const topK = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    // Precision@5: how many of top-5 are relevant
    const relevantInTopK = topK.filter(r => test.relevantChunkIds.includes(r.id));
    totalPrecision += relevantInTopK.length / 5;

    // Recall@5: how many relevant docs appear in top-5
    totalRecall += relevantInTopK.length / test.relevantChunkIds.length;

    // MRR: reciprocal rank of first relevant result
    const firstRelevantRank = topK.findIndex(r => test.relevantChunkIds.includes(r.id));
    totalMRR += firstRelevantRank >= 0 ? 1 / (firstRelevantRank + 1) : 0;
  }

  const latency = Date.now() - startTime;

  return {
    model: modelName,
    precision_at_5: totalPrecision / testSet.length,
    recall_at_5: totalRecall / testSet.length,
    mrr: totalMRR / testSet.length,
    latency_ms: latency / testSet.length,
  };
}
```

---

## 13. Cost Comparison

### API Cost per 1M Tokens (as of 2026)

| Provider | Model | Cost / 1M Tokens | Dimensions | Notes |
|----------|-------|------------------|-----------|-------|
| OpenAI | text-embedding-3-small | $0.02 | 1536 | Best cost/quality ratio |
| OpenAI | text-embedding-3-large | $0.13 | 3072 | Premium quality |
| Cohere | embed-english-v3.0 | $0.10 | 1024 | Includes reranking |
| Voyage AI | voyage-large-2 | $0.12 | 1536 | Strong on code |
| Self-hosted | BGE-base-en-v1.5 | ~$0.001* | 768 | GPU cost only |
| Self-hosted | Nomic Embed v1.5 | ~$0.001* | 768 | GPU cost only |
| vLLM local | Any supported | $0.00 | Varies | Already running |

*Self-hosted costs assume shared GPU with other workloads. Dedicated GPU cost would be ~$0.01-0.05 per 1M tokens depending on hardware.

### Cost Projection for Stone AI

```
Monthly embedding volume estimate:
- New knowledge seeds: ~50 docs × 50 chunks × 500 tokens = 1.25M tokens
- New agent memories: ~1,000 users × 10 memories × 100 tokens = 1M tokens
- Query embeddings: ~1,000 users × 50 queries/day × 30 days × 50 tokens = 75M tokens
Total: ~77.25M tokens/month

At text-embedding-3-small ($0.02/1M):
77.25 × $0.02 = $1.55/month

At text-embedding-3-large ($0.13/1M):
77.25 × $0.13 = $10.04/month

At vLLM local (already running):
$0.00/month incremental cost
```

---

## 14. Anti-Patterns

### Anti-Pattern 1: Using General Embeddings for Specialized Domains

**Wrong**: Using text-embedding-3-small for medical records without evaluating retrieval quality.

**Why**: General models may not distinguish between "myocardial infarction" and "cardiac arrest" as well as a domain-fine-tuned model would.

**Fix**: Evaluate baseline retrieval on your domain data. If accuracy is below threshold, fine-tune or use a domain-specific model.

### Anti-Pattern 2: Ignoring Dimension vs Quality Tradeoff

**Wrong**: Always using the maximum dimensions because "bigger is better."

**Why**: Going from 768 to 3072 dimensions quadruples storage and memory costs while only improving quality by 1-3% for most use cases.

**Fix**: Start with 768 or 1536. Only increase if evaluation shows meaningful quality improvement.

### Anti-Pattern 3: Mixing Embedding Models

**Wrong**: Embedding some chunks with model A and other chunks with model B, then searching across both.

**Why**: Different models produce vectors in different spaces. Cosine similarity between vectors from different models is meaningless.

**Fix**: Use one model for all chunks in a collection. If you switch models, re-embed everything.

### Anti-Pattern 4: No Embedding Cache

**Wrong**: Re-embedding the same query text on every request.

**Fix**: Cache query embeddings with a content hash key. Cache TTL of 24-72 hours is typically safe.

### Anti-Pattern 5: Ignoring Model Input Limits

**Wrong**: Sending 2000-token chunks to a model with a 512-token limit.

**Why**: The model silently truncates. Your embedding only represents the first 512 tokens.

**Fix**: Check model's max input length. Set chunk size to 80% of the limit.

### Anti-Pattern 6: Not Using Prefix Instructions

**Wrong**: Embedding queries and documents identically with BGE or E5 models.

**Why**: These models are trained with asymmetric prefixes. Without them, retrieval quality drops significantly.

**Fix**: Always use the model-specific prefix: "Represent this sentence for searching relevant passages: " for BGE queries, "query: " for E5 queries.

---

## 15. Production Implementation

### Unified Embedding Service for Stone AI

```typescript
import { Redis } from 'ioredis';
import crypto from 'crypto';

type EmbeddingProvider = 'openai' | 'vllm' | 'local';

interface EmbeddingConfig {
  provider: EmbeddingProvider;
  model: string;
  dimensions: number;
  maxTokens: number;
  batchSize: number;
}

const CONFIGS: Record<string, EmbeddingConfig> = {
  production: {
    provider: 'openai',
    model: 'text-embedding-3-small',
    dimensions: 1536,
    maxTokens: 8191,
    batchSize: 100,
  },
  local: {
    provider: 'vllm',
    model: 'BAAI/bge-base-en-v1.5',
    dimensions: 768,
    maxTokens: 512,
    batchSize: 256,
  },
};

class EmbeddingService {
  private config: EmbeddingConfig;
  private redis: Redis;

  constructor(env: 'production' | 'local' = 'production') {
    this.config = CONFIGS[env];
    this.redis = new Redis(process.env.REDIS_URL);
  }

  private cacheKey(text: string): string {
    const hash = crypto.createHash('sha256').update(text).digest('hex');
    return `embed:${this.config.model}:${this.config.dimensions}:${hash}`;
  }

  async embed(text: string): Promise<number[]> {
    // Check cache
    const cached = await this.redis.get(this.cacheKey(text));
    if (cached) return JSON.parse(cached);

    const [embedding] = await this.embedBatch([text]);

    // Cache for 30 days
    await this.redis.set(
      this.cacheKey(text),
      JSON.stringify(embedding),
      'EX',
      86400 * 30
    );

    return embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const results: number[][] = new Array(texts.length);
    const uncachedIndices: number[] = [];
    const uncachedTexts: string[] = [];

    // Check cache for each text
    await Promise.all(texts.map(async (text, i) => {
      const cached = await this.redis.get(this.cacheKey(text));
      if (cached) {
        results[i] = JSON.parse(cached);
      } else {
        uncachedIndices.push(i);
        uncachedTexts.push(text);
      }
    }));

    // Embed uncached texts in batches
    for (let i = 0; i < uncachedTexts.length; i += this.config.batchSize) {
      const batch = uncachedTexts.slice(i, i + this.config.batchSize);
      const embeddings = await this.callProvider(batch);

      for (let j = 0; j < embeddings.length; j++) {
        const originalIndex = uncachedIndices[i + j];
        results[originalIndex] = embeddings[j];

        // Cache result
        await this.redis.set(
          this.cacheKey(batch[j]),
          JSON.stringify(embeddings[j]),
          'EX',
          86400 * 30
        );
      }
    }

    return results;
  }

  private async callProvider(texts: string[]): Promise<number[][]> {
    switch (this.config.provider) {
      case 'openai':
        return this.callOpenAI(texts);
      case 'vllm':
        return this.callVLLM(texts);
      default:
        throw new Error(`Unknown provider: ${this.config.provider}`);
    }
  }

  private async callOpenAI(texts: string[]): Promise<number[][]> {
    const openai = new OpenAI();
    const response = await openai.embeddings.create({
      model: this.config.model,
      input: texts,
      dimensions: this.config.dimensions,
    });
    return response.data
      .sort((a, b) => a.index - b.index)
      .map(d => d.embedding);
  }

  private async callVLLM(texts: string[]): Promise<number[][]> {
    const response = await fetch(
      `${process.env.VLLM_URL || 'http://localhost:8001'}/v1/embeddings`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          input: texts,
        }),
      }
    );
    const data = await response.json();
    return data.data
      .sort((a: any, b: any) => a.index - b.index)
      .map((d: any) => d.embedding);
  }
}

// Export singleton
export const embeddings = new EmbeddingService(
  process.env.NODE_ENV === 'production' ? 'production' : 'local'
);
```

---

> This seed is designed for RAG retrieval. Each section is self-contained and can be retrieved independently. When chunking this document, use markdown-aware splitting by headers. Each ## section provides complete coverage of its topic.
