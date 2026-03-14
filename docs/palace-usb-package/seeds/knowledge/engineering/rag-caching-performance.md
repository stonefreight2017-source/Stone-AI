# RAG Caching & Performance Optimization

## Purpose
RAG pipelines have multiple latency bottlenecks: embedding generation, vector search, reranking, and LLM generation. Each can be optimized independently. This seed covers semantic caching, embedding caching, ANN index tuning (HNSW/IVF for pgvector), precomputation strategies, cache invalidation, and batch embedding optimization.

---

## The RAG Latency Stack

```
Typical RAG Pipeline Latency Breakdown:
┌─────────────────────────┬────────────┬──────────┐
│ Stage                   │ Latency    │ % of Total│
├─────────────────────────┼────────────┼──────────┤
│ Query embedding         │ 20-100ms   │ 5-15%    │
│ Vector search (ANN)     │ 5-50ms     │ 2-10%    │
│ Reranking               │ 50-300ms   │ 10-30%   │
│ LLM generation          │ 500-3000ms │ 50-70%   │
│ Network overhead        │ 20-100ms   │ 5-10%    │
└─────────────────────────┴────────────┴──────────┘
```

**Rule of thumb**: Optimize the biggest bottleneck first. Usually that's LLM generation, but caching can eliminate the entire pipeline for repeated queries.

---

## Semantic Caching

### What It Is
Traditional caching uses exact key matching. Semantic caching matches queries by MEANING — "How do I reset my password?" and "I forgot my password, how do I fix it?" should hit the same cache entry.

### Implementation

```typescript
interface CacheEntry {
  queryEmbedding: number[];
  originalQuery: string;
  answer: string;
  contexts: string[];
  timestamp: number;
  hitCount: number;
  ttlMs: number;
}

class SemanticCache {
  constructor(
    private pool: any,
    private similarityThreshold: number = 0.95,
    private defaultTtlMs: number = 3600000 // 1 hour
  ) {}

  async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS semantic_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        query_embedding vector(1536),
        original_query TEXT NOT NULL,
        answer TEXT NOT NULL,
        contexts JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        hit_count INT DEFAULT 0
      );
      CREATE INDEX IF NOT EXISTS idx_cache_embedding
        ON semantic_cache USING ivfflat (query_embedding vector_cosine_ops)
        WITH (lists = 50);
    `);
  }

  async get(
    queryEmbedding: number[]
  ): Promise<{ answer: string; contexts: string[] } | null> {
    const result = await this.pool.query(
      `SELECT id, answer, contexts,
              1 - (query_embedding <=> $1::vector) as similarity
       FROM semantic_cache
       WHERE expires_at > NOW()
         AND 1 - (query_embedding <=> $1::vector) > $2
       ORDER BY query_embedding <=> $1::vector
       LIMIT 1`,
      [JSON.stringify(queryEmbedding), this.similarityThreshold]
    );

    if (result.rows.length === 0) return null;

    // Increment hit count
    await this.pool.query(
      `UPDATE semantic_cache SET hit_count = hit_count + 1 WHERE id = $1`,
      [result.rows[0].id]
    );

    return {
      answer: result.rows[0].answer,
      contexts: result.rows[0].contexts,
    };
  }

  async set(
    query: string,
    queryEmbedding: number[],
    answer: string,
    contexts: string[],
    ttlMs?: number
  ): Promise<void> {
    const ttl = ttlMs ?? this.defaultTtlMs;
    const expiresAt = new Date(Date.now() + ttl);

    await this.pool.query(
      `INSERT INTO semantic_cache (query_embedding, original_query, answer, contexts, expires_at)
       VALUES ($1::vector, $2, $3, $4, $5)`,
      [JSON.stringify(queryEmbedding), query, answer, JSON.stringify(contexts), expiresAt]
    );
  }

  async invalidateByTopic(topicKeywords: string[]): Promise<number> {
    // Invalidate cache entries that match certain topics
    const pattern = topicKeywords.map((k) => `%${k}%`).join(' OR original_query ILIKE ');
    const result = await this.pool.query(
      `DELETE FROM semantic_cache WHERE original_query ILIKE $1`,
      [`%${topicKeywords[0]}%`]
    );
    return result.rowCount ?? 0;
  }

  async cleanup(): Promise<void> {
    await this.pool.query(`DELETE FROM semantic_cache WHERE expires_at < NOW()`);
  }
}

// Usage in RAG pipeline
async function ragWithCache(
  query: string,
  cache: SemanticCache,
  embeddingEndpoint: string,
  ragPipeline: (query: string, embedding: number[]) => Promise<{ answer: string; contexts: string[] }>
): Promise<{ answer: string; contexts: string[]; cached: boolean }> {
  const queryEmbedding = await getTextEmbedding(query, embeddingEndpoint);

  // Check cache first
  const cached = await cache.get(queryEmbedding);
  if (cached) {
    return { ...cached, cached: true };
  }

  // Cache miss — run full pipeline
  const result = await ragPipeline(query, queryEmbedding);

  // Store in cache (don't await — fire and forget)
  cache.set(query, queryEmbedding, result.answer, result.contexts).catch(console.error);

  return { ...result, cached: false };
}
```

### Cache Similarity Threshold Tuning

```
Threshold = 0.99 → Almost exact match only. High precision, low hit rate.
Threshold = 0.95 → Good balance. Catches paraphrases.
Threshold = 0.90 → Aggressive caching. Risk of wrong cache hits.
Threshold = 0.85 → Too aggressive. Different questions will match.

Recommendation: Start at 0.95, measure false hit rate, adjust.
```

---

## Embedding Caching

### The Problem
Embedding the same text repeatedly wastes compute. Common in:
- Re-indexing unchanged documents
- Multiple queries containing the same phrases
- Test/dev environments running the same queries

### Implementation

```typescript
import { createHash } from 'crypto';

class EmbeddingCache {
  private memoryCache: Map<string, number[]> = new Map();
  private maxMemoryEntries: number;

  constructor(
    private pool: any,
    maxMemoryEntries: number = 10000
  ) {
    this.maxMemoryEntries = maxMemoryEntries;
  }

  private hashText(text: string): string {
    return createHash('sha256').update(text).digest('hex');
  }

  async getOrCompute(
    text: string,
    computeFn: (text: string) => Promise<number[]>
  ): Promise<number[]> {
    const hash = this.hashText(text);

    // L1: Memory cache
    const memCached = this.memoryCache.get(hash);
    if (memCached) return memCached;

    // L2: Database cache
    const dbResult = await this.pool.query(
      `SELECT embedding FROM embedding_cache WHERE text_hash = $1`,
      [hash]
    );
    if (dbResult.rows.length > 0) {
      const embedding = dbResult.rows[0].embedding;
      this.memoryCache.set(hash, embedding);
      return embedding;
    }

    // L3: Compute
    const embedding = await computeFn(text);

    // Store in both caches
    this.memoryCache.set(hash, embedding);
    if (this.memoryCache.size > this.maxMemoryEntries) {
      // Evict oldest entry
      const firstKey = this.memoryCache.keys().next().value;
      if (firstKey) this.memoryCache.delete(firstKey);
    }

    await this.pool.query(
      `INSERT INTO embedding_cache (text_hash, embedding, created_at)
       VALUES ($1, $2::vector, NOW())
       ON CONFLICT (text_hash) DO NOTHING`,
      [hash, JSON.stringify(embedding)]
    ).catch(console.error); // Don't fail on cache write errors

    return embedding;
  }
}
```

---

## pgvector ANN Index Tuning

### HNSW vs IVFFlat

```
HNSW (Hierarchical Navigable Small World):
  ✓ Better recall at same speed
  ✓ No training step required
  ✓ Good for dynamic datasets (frequent inserts)
  ✗ Higher memory usage (2-3x index size)
  ✗ Slower index build time

IVFFlat (Inverted File with Flat quantization):
  ✓ Lower memory usage
  ✓ Faster index build
  ✓ Good for static datasets
  ✗ Requires training (needs data before building)
  ✗ Lower recall at same speed
  ✗ Degrades with many inserts (needs periodic rebuild)
```

### HNSW Parameter Tuning

```sql
-- Create HNSW index
CREATE INDEX idx_chunks_hnsw ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Tune search quality at query time
SET hnsw.ef_search = 100;  -- Higher = better recall, slower
```

```typescript
// HNSW parameter guide
interface HNSWConfig {
  m: number;              // Connections per node (default: 16)
  efConstruction: number; // Build-time quality (default: 64)
  efSearch: number;       // Query-time quality (default: 40)
}

// Tuning recommendations by dataset size
function recommendHNSWConfig(
  numDocuments: number,
  prioritizeRecall: boolean = true
): HNSWConfig {
  if (numDocuments < 10000) {
    return { m: 16, efConstruction: 64, efSearch: prioritizeRecall ? 200 : 40 };
  }
  if (numDocuments < 100000) {
    return { m: 24, efConstruction: 100, efSearch: prioritizeRecall ? 200 : 100 };
  }
  if (numDocuments < 1000000) {
    return { m: 32, efConstruction: 128, efSearch: prioritizeRecall ? 300 : 100 };
  }
  // 1M+
  return { m: 48, efConstruction: 200, efSearch: prioritizeRecall ? 400 : 200 };
}
```

### IVFFlat Parameter Tuning

```sql
-- Create IVFFlat index (requires data to be present first)
CREATE INDEX idx_chunks_ivf ON document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Tune search quality at query time
SET ivfflat.probes = 10;  -- Higher = better recall, slower
```

```typescript
// IVFFlat parameter guide
function recommendIVFConfig(numDocuments: number): { lists: number; probes: number } {
  // Rule of thumb: lists ≈ sqrt(numDocuments)
  const lists = Math.max(1, Math.round(Math.sqrt(numDocuments)));

  // Probes: 1-10% of lists for good recall
  const probes = Math.max(1, Math.round(lists * 0.05));

  return { lists, probes };
}
```

### Benchmarking Your Index

```typescript
async function benchmarkIndex(
  pool: any,
  testQueries: Array<{ embedding: number[]; expectedIds: string[] }>,
  efSearchValues: number[] = [40, 100, 200, 400]
): Promise<void> {
  for (const efSearch of efSearchValues) {
    await pool.query(`SET hnsw.ef_search = ${efSearch}`);

    let totalLatency = 0;
    let totalRecall = 0;

    for (const query of testQueries) {
      const start = Date.now();
      const result = await pool.query(
        `SELECT id FROM document_chunks
         ORDER BY embedding <=> $1::vector
         LIMIT 10`,
        [JSON.stringify(query.embedding)]
      );
      totalLatency += Date.now() - start;

      // Calculate recall
      const returnedIds = new Set(result.rows.map((r: any) => r.id));
      const hits = query.expectedIds.filter((id) => returnedIds.has(id)).length;
      totalRecall += hits / query.expectedIds.length;
    }

    const avgLatency = totalLatency / testQueries.length;
    const avgRecall = totalRecall / testQueries.length;

    console.log(`ef_search=${efSearch}: avg_latency=${avgLatency.toFixed(1)}ms, recall@10=${(avgRecall * 100).toFixed(1)}%`);
  }
}
```

---

## Batch Embedding Optimization

### The Problem
Embedding one document at a time wastes API calls and throughput. Most embedding APIs and local models support batching.

```typescript
async function batchEmbed(
  texts: string[],
  batchSize: number = 32,
  embeddingEndpoint: string,
  concurrency: number = 3
): Promise<number[][]> {
  const batches: string[][] = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    batches.push(texts.slice(i, i + batchSize));
  }

  const results: number[][] = new Array(texts.length);

  // Process batches with controlled concurrency
  const semaphore = new Semaphore(concurrency);

  await Promise.all(
    batches.map(async (batch, batchIdx) => {
      await semaphore.acquire();
      try {
        const response = await fetch(embeddingEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ input: batch }),
        });

        const data = await response.json();
        const embeddings = data.data.map((d: any) => d.embedding);

        for (let i = 0; i < embeddings.length; i++) {
          results[batchIdx * batchSize + i] = embeddings[i];
        }
      } finally {
        semaphore.release();
      }
    })
  );

  return results;
}

class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    return new Promise<void>((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift()!;
      next();
    } else {
      this.permits++;
    }
  }
}
```

---

## Precomputation Strategies

### Precompute Common Query Patterns

```typescript
// Identify and precompute answers for frequent query patterns
async function precomputeFrequentQueries(
  pool: any,
  cache: SemanticCache,
  ragPipeline: (q: string, e: number[]) => Promise<{ answer: string; contexts: string[] }>,
  embeddingEndpoint: string
): Promise<void> {
  // Get frequently asked queries (from logs)
  const frequent = await pool.query(
    `SELECT query, COUNT(*) as freq
     FROM query_logs
     WHERE created_at > NOW() - INTERVAL '7 days'
     GROUP BY query
     HAVING COUNT(*) > 5
     ORDER BY freq DESC
     LIMIT 100`
  );

  for (const row of frequent.rows) {
    const embedding = await getTextEmbedding(row.query, embeddingEndpoint);

    // Check if already cached
    const existing = await cache.get(embedding);
    if (existing) continue;

    // Run pipeline and cache
    const result = await ragPipeline(row.query, embedding);
    await cache.set(row.query, embedding, result.answer, result.contexts, 86400000); // 24h TTL
  }
}
```

### Precompute Document Summaries

```typescript
// At ingestion time, precompute summaries for each document
async function precomputeDocumentSummary(
  documentId: string,
  chunks: string[],
  llmEndpoint: string,
  pool: any
): Promise<void> {
  const fullText = chunks.join('\n');

  const prompt = `Summarize this document in 3-5 sentences, covering the main topics and key facts:
${fullText.substring(0, 8000)}`; // Truncate for LLM context

  const summary = await callLLM(prompt, llmEndpoint);

  await pool.query(
    `UPDATE documents SET summary = $1, summary_updated_at = NOW()
     WHERE id = $2`,
    [summary, documentId]
  );
}
```

---

## Cache Invalidation Strategies

### Event-Based Invalidation

```typescript
interface InvalidationEvent {
  type: 'document_updated' | 'document_deleted' | 'schema_changed' | 'manual';
  documentId?: string;
  topics?: string[];
  timestamp: number;
}

class CacheInvalidator {
  constructor(
    private cache: SemanticCache,
    private pool: any
  ) {}

  async handleEvent(event: InvalidationEvent): Promise<void> {
    switch (event.type) {
      case 'document_updated':
      case 'document_deleted':
        if (event.documentId) {
          // Find topics/keywords from the document
          const doc = await this.pool.query(
            `SELECT content FROM document_chunks WHERE document_id = $1 LIMIT 5`,
            [event.documentId]
          );
          const keywords = extractKeywords(
            doc.rows.map((r: any) => r.content).join(' ')
          );
          await this.cache.invalidateByTopic(keywords);
        }
        break;

      case 'schema_changed':
        // Nuclear option — clear everything
        await this.pool.query(`DELETE FROM semantic_cache`);
        break;

      case 'manual':
        if (event.topics) {
          await this.cache.invalidateByTopic(event.topics);
        }
        break;
    }
  }
}

function extractKeywords(text: string): string[] {
  // Simple keyword extraction — use TF-IDF or KeyBERT for production
  const words = text.toLowerCase().split(/\s+/);
  const freq = new Map<string, number>();

  for (const word of words) {
    if (word.length < 4) continue; // Skip short words
    freq.set(word, (freq.get(word) ?? 0) + 1);
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}
```

---

## Performance Monitoring

```typescript
interface PerformanceMetrics {
  cacheHitRate: number;
  avgEmbeddingLatencyMs: number;
  avgSearchLatencyMs: number;
  avgRerankLatencyMs: number;
  avgGenerationLatencyMs: number;
  avgTotalLatencyMs: number;
  p95TotalLatencyMs: number;
  queriesPerSecond: number;
}

class PerformanceMonitor {
  private latencies: Map<string, number[]> = new Map();
  private cacheHits: number = 0;
  private cacheMisses: number = 0;

  recordLatency(stage: string, ms: number): void {
    if (!this.latencies.has(stage)) this.latencies.set(stage, []);
    this.latencies.get(stage)!.push(ms);
  }

  recordCacheResult(hit: boolean): void {
    if (hit) this.cacheHits++;
    else this.cacheMisses++;
  }

  getMetrics(): PerformanceMetrics {
    const getAvg = (stage: string) => {
      const vals = this.latencies.get(stage) ?? [];
      return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    const getP95 = (stage: string) => {
      const vals = [...(this.latencies.get(stage) ?? [])].sort((a, b) => a - b);
      if (vals.length === 0) return 0;
      return vals[Math.floor(vals.length * 0.95)];
    };

    const total = this.cacheHits + this.cacheMisses;

    return {
      cacheHitRate: total > 0 ? this.cacheHits / total : 0,
      avgEmbeddingLatencyMs: getAvg('embedding'),
      avgSearchLatencyMs: getAvg('search'),
      avgRerankLatencyMs: getAvg('rerank'),
      avgGenerationLatencyMs: getAvg('generation'),
      avgTotalLatencyMs: getAvg('total'),
      p95TotalLatencyMs: getP95('total'),
      queriesPerSecond: 0, // Calculated externally
    };
  }

  reset(): void {
    this.latencies.clear();
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}
```

---

## Anti-Patterns

| Anti-Pattern | Why It Fails | Fix |
|---|---|---|
| No caching at all | Same queries re-run full pipeline | Semantic cache with 0.95 threshold |
| Exact-match caching only | Misses paraphrases | Semantic similarity matching |
| Never invalidating cache | Stale answers persist | TTL + event-based invalidation |
| Default HNSW params forever | Suboptimal recall/speed tradeoff | Benchmark and tune for your data |
| Embedding one-at-a-time | 100x slower than batching | Batch with controlled concurrency |
| No latency monitoring | Can't identify bottlenecks | Instrument every pipeline stage |
| Caching everything | Cache pollution, memory waste | Only cache queries with score > threshold |

---

## Key Takeaways

- Semantic caching can eliminate 30-60% of your RAG pipeline calls for production workloads
- pgvector HNSW with tuned ef_search gives the best recall/speed tradeoff for most cases
- Batch embedding with concurrency control maximizes throughput without overwhelming the model server
- Cache invalidation is harder than caching — design for it from the start
- Monitor every stage independently — the bottleneck shifts as your system evolves
- Precompute frequently asked queries during off-peak hours
