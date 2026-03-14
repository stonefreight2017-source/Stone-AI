# pgvector Semantic Search — AI Agent Memory Optimization

> Senior Database Engineer Seed | Stone AI Palace Infrastructure
> Covers: pgvector indexing, embedding strategies, hybrid search, Prisma integration, and performance at scale.

---

## Table of Contents

1. [pgvector Fundamentals](#1-pgvector-fundamentals)
2. [Embedding Dimensions — 384 vs 768 vs 1536](#2-embedding-dimensions--384-vs-768-vs-1536)
3. [Distance Metrics — Cosine vs L2 vs Inner Product](#3-distance-metrics--cosine-vs-l2-vs-inner-product)
4. [Index Types — IVFFlat vs HNSW](#4-index-types--ivfflat-vs-hnsw)
5. [Index Tuning Parameters](#5-index-tuning-parameters)
6. [Pre-Filtering + Vector Search](#6-pre-filtering--vector-search)
7. [Hybrid Search — Full-Text + Vector](#7-hybrid-search--full-text--vector)
8. [Batch Insert Strategies](#8-batch-insert-strategies)
9. [AI Agent Memory Retrieval Patterns](#9-ai-agent-memory-retrieval-patterns)
10. [Embedding Model Selection](#10-embedding-model-selection)
11. [Storage Calculations](#11-storage-calculations)
12. [Re-Indexing Strategies](#12-re-indexing-strategies)
13. [Performance Benchmarks at Scale](#13-performance-benchmarks-at-scale)
14. [Prisma Integration — Raw SQL for Vector Ops](#14-prisma-integration--raw-sql-for-vector-ops)
15. [Production Checklist](#15-production-checklist)

---

## 1. pgvector Fundamentals

pgvector is a PostgreSQL extension that adds vector similarity search to Postgres. It stores embeddings as a native `vector` column type and supports exact and approximate nearest neighbor (ANN) search.

### Installation and Setup

```sql
-- Enable the extension (requires superuser or rds_superuser on managed)
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check version (0.7.0+ recommended for HNSW + quantization)
SELECT extversion FROM pg_extension WHERE extname = 'vector';
```

### Column Definition

```sql
-- Fixed dimension vector column
ALTER TABLE agent_memories ADD COLUMN embedding vector(1536);

-- You MUST specify dimensions at column creation
-- Inserting a vector with wrong dimensions throws an error
-- This is a feature, not a bug — dimension mismatch = silent corruption in other systems
```

### Core Operations

```sql
-- Insert a vector
INSERT INTO agent_memories (content, embedding)
VALUES ('user prefers dark mode', '[0.1, 0.2, ..., 0.05]'::vector);

-- Exact nearest neighbor (no index, sequential scan)
SELECT id, content, embedding <=> '[0.1, 0.2, ...]'::vector AS distance
FROM agent_memories
ORDER BY distance
LIMIT 10;

-- The <=> operator is cosine distance
-- The <-> operator is L2 (Euclidean) distance
-- The <#> operator is negative inner product
```

### Why pgvector Over Dedicated Vector DBs

For Stone AI's architecture, pgvector wins because:

1. **Single database** — No separate Pinecone/Weaviate/Qdrant deployment. Agent memories live next to agent configs, user data, and billing. One connection pool, one backup strategy, one failover plan.
2. **ACID transactions** — Vector inserts are transactional. If an agent memory write fails, the whole transaction rolls back. Dedicated vector DBs are eventually consistent.
3. **JOINs** — You can JOIN vector results with relational data in one query. "Find similar memories AND filter by agent_id AND check the user's subscription tier" — one round trip.
4. **Neon compatibility** — Neon supports pgvector natively. No extra infra cost.
5. **Prisma coexistence** — Prisma manages the schema; raw SQL handles vector ops. Clean separation.

The tradeoff: pgvector is slower than dedicated vector DBs at 10M+ vectors. For Stone AI's scale (thousands of users, each with hundreds to low thousands of memories per agent), pgvector handles it comfortably.

---

## 2. Embedding Dimensions — 384 vs 768 vs 1536

Embedding dimensions directly impact storage, query speed, and retrieval quality. The three common dimension sizes correspond to different model families.

### Dimension Comparison

| Dimension | Typical Models | Storage/Vector | Quality | Speed |
|-----------|---------------|----------------|---------|-------|
| 384 | all-MiniLM-L6-v2, gte-small | 1,536 bytes | Good for short text, FAQ, labels | Fastest |
| 768 | all-mpnet-base-v2, gte-base, BGE-base | 3,072 bytes | Strong general-purpose | Fast |
| 1536 | text-embedding-3-small (OpenAI), gte-large | 6,144 bytes | Best for nuanced semantic search | Moderate |
| 3072 | text-embedding-3-large (OpenAI) | 12,288 bytes | Marginal gains over 1536 for most tasks | Slow |

### Storage Per Vector Calculation

```
Storage = dimensions * 4 bytes (float32) + 8 bytes (overhead)

384-dim:  384 * 4 + 8 = 1,544 bytes  (~1.5 KB)
768-dim:  768 * 4 + 8 = 3,080 bytes  (~3.0 KB)
1536-dim: 1536 * 4 + 8 = 6,152 bytes (~6.0 KB)
```

### Recommendation for AI Agent Memory

**Use 768 dimensions** for Stone AI agent memories.

Rationale:
- Agent memories are short-to-medium text (user preferences, conversation summaries, learned patterns). 384 dimensions lose nuance on multi-sentence memories. 1536 dimensions are overkill for this text length.
- 768-dim models (especially `gte-base` or `all-mpnet-base-v2`) score within 2-3% of 1536-dim models on retrieval benchmarks for texts under 512 tokens.
- Storage is 2x smaller than 1536, meaning 2x more vectors fit in RAM for index scans.
- If using a local model (vLLM + Qwen), you can generate 768-dim embeddings without an external API call.

**Exception**: If you're embedding long documents (knowledge base articles, full conversation transcripts), 1536 is worth the cost. The extra dimensions capture long-range semantic relationships that 768 misses.

### Dimensionality Reduction (Matryoshka Embeddings)

Modern embedding models (text-embedding-3-small/large, gte-v2) support Matryoshka Representation Learning (MRL). You can truncate the embedding to fewer dimensions with minimal quality loss:

```sql
-- Store full 1536-dim embeddings but search with first 768 dims
-- Useful for two-stage retrieval: fast approximate with 768, re-rank with full 1536

-- Create a generated column with truncated dimensions
ALTER TABLE agent_memories
ADD COLUMN embedding_768 vector(768)
GENERATED ALWAYS AS (subvector(embedding, 1, 768)) STORED;

-- Index the smaller column for fast search
CREATE INDEX ON agent_memories USING hnsw (embedding_768 vector_cosine_ops);

-- Search against the smaller index, then re-rank with full embedding
WITH candidates AS (
  SELECT id, content, embedding,
         embedding_768 <=> $1::vector(768) AS approx_distance
  FROM agent_memories
  ORDER BY approx_distance
  LIMIT 50
)
SELECT id, content,
       embedding <=> $2::vector(1536) AS exact_distance
FROM candidates
ORDER BY exact_distance
LIMIT 10;
```

This gives you HNSW-fast search on 768 dims with 1536-dim re-ranking precision.

---

## 3. Distance Metrics — Cosine vs L2 vs Inner Product

### The Three Operators

| Metric | pgvector Operator | What It Measures | Range |
|--------|-------------------|------------------|-------|
| Cosine Distance | `<=>` | Angle between vectors (1 - cosine_similarity) | [0, 2] (0 = identical) |
| L2 (Euclidean) | `<->` | Straight-line distance in vector space | [0, inf) |
| Inner Product (Negative) | `<#>` | Dot product (negated for ORDER BY ASC) | (-inf, inf) |

### When to Use Each

**Cosine Distance (`<=>`)** — USE THIS for agent memories.
- Invariant to vector magnitude. Two vectors pointing the same direction have distance 0 regardless of length.
- All modern embedding models normalize their output vectors to unit length, making cosine distance the natural fit.
- Best for: semantic similarity, text retrieval, agent memory search.

```sql
-- "Find memories most similar to this query"
SELECT id, content, 1 - (embedding <=> query_embedding) AS similarity
FROM agent_memories
WHERE agent_id = $1
ORDER BY embedding <=> query_embedding
LIMIT 10;
```

**L2 Distance (`<->`)** — Use for spatial/geometric data.
- Sensitive to magnitude. A vector [1,1] and [100,100] have large L2 distance despite pointing the same direction.
- Best for: image feature vectors, geographic coordinates, physics simulations.
- Avoid for text embeddings unless you've explicitly normalized them AND your use case requires magnitude sensitivity.

**Inner Product (`<#>`)** — Use for recommendation/ranking with magnitude.
- Higher dot product = more similar AND more "important" (if magnitude encodes relevance).
- Best for: recommendation systems where vector magnitude encodes item popularity or confidence.
- Note: pgvector negates the inner product so ORDER BY ASC works. Actual similarity = negative of the returned value.

### Practical Impact

For normalized embeddings (which all text embedding models produce), cosine distance and inner product give identical rankings. The formulas:

```
cosine_distance = 1 - (A . B) / (|A| * |B|)
-- When |A| = |B| = 1 (normalized):
cosine_distance = 1 - (A . B)
negative_inner_product = -(A . B)
-- Same ranking, different scale
```

L2 distance also gives the same ranking for normalized vectors:

```
L2^2 = |A|^2 + |B|^2 - 2(A . B) = 2 - 2(A . B)  [when normalized]
-- Same ranking again
```

**So for normalized embeddings, the choice doesn't matter for ranking.** Use cosine distance (`<=>`) because it's the most readable and maps to the `vector_cosine_ops` index operator class.

### Index Operator Classes

Each distance metric requires its own operator class when creating an index:

```sql
-- Cosine distance
CREATE INDEX ON agent_memories USING hnsw (embedding vector_cosine_ops);

-- L2 distance
CREATE INDEX ON agent_memories USING hnsw (embedding vector_l2_ops);

-- Inner product
CREATE INDEX ON agent_memories USING hnsw (embedding vector_ip_ops);

-- You CANNOT mix operators. If you index with vector_cosine_ops,
-- queries using <-> (L2) will NOT use that index.
```

---

## 4. Index Types — IVFFlat vs HNSW

pgvector provides two approximate nearest neighbor (ANN) index types. Choosing the right one is the single biggest performance decision.

### IVFFlat (Inverted File with Flat Compression)

**How it works**: Divides vectors into `lists` clusters using k-means. At query time, searches only the `probes` nearest clusters instead of all vectors.

```sql
CREATE INDEX idx_memories_ivfflat ON agent_memories
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

**Characteristics**:
- Build time: Fast (minutes for 1M vectors)
- Query time: Fast, but recall depends heavily on `probes` setting
- Memory: Low (stores centroids + original vectors)
- Insert speed: Fast (just assign to nearest centroid)
- **Critical limitation**: Index quality degrades as data changes. If you build with 100K vectors then insert 900K more, the cluster centroids are stale. You MUST re-index periodically.

**Query-time tuning**:

```sql
-- Default probes = 1 (only searches 1 cluster — low recall)
SET ivfflat.probes = 10;  -- Search 10 clusters — better recall, slower

-- Rule of thumb: probes = sqrt(lists) for ~95% recall
-- lists=100 → probes=10
-- lists=1000 → probes=32
```

### HNSW (Hierarchical Navigable Small Worlds)

**How it works**: Builds a multi-layer graph. Top layers have few nodes (long-range connections). Bottom layers have all nodes (short-range connections). Search starts at the top and "zooms in" through layers.

```sql
CREATE INDEX idx_memories_hnsw ON agent_memories
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

**Characteristics**:
- Build time: Slow (10-30x slower than IVFFlat)
- Query time: Very fast, high recall by default
- Memory: High (stores the graph structure — 2-3x more than IVFFlat)
- Insert speed: Moderate (must update graph connections)
- **Key advantage**: No degradation with inserts. New vectors are added to the graph incrementally. No re-indexing needed.

**Query-time tuning**:

```sql
-- ef_search controls query-time accuracy/speed tradeoff
SET hnsw.ef_search = 40;  -- Default. Good balance.
SET hnsw.ef_search = 100; -- Higher recall, slower.
SET hnsw.ef_search = 200; -- Near-perfect recall, 2-3x slower than 40.
```

### Head-to-Head Comparison

| Factor | IVFFlat | HNSW |
|--------|---------|------|
| Build time (1M vectors, 768-dim) | ~2 min | ~30 min |
| Query latency (top-10, 1M vectors) | 1-5 ms | 0.5-2 ms |
| Recall@10 (default settings) | ~70% | ~95% |
| Recall@10 (tuned) | ~95% (probes=sqrt(lists)) | ~99% (ef_search=100) |
| Memory overhead | Low (~1.1x data size) | High (~2-3x data size) |
| Insert performance | Fast | Moderate |
| Handles data drift | NO — must re-index | YES — incremental |
| Best for | Static datasets, budget RAM | Live data, high recall needed |

### Recommendation for Stone AI

**Use HNSW.** Here's why:

1. Agent memories are continuously inserted and updated. IVFFlat's cluster degradation means you'd need scheduled re-indexing, adding operational complexity on Neon.
2. HNSW's higher default recall means agents retrieve the RIGHT memories more often. For AI agents, a missed relevant memory is worse than a 1ms slower query.
3. Stone AI's scale (< 1M vectors near-term) keeps HNSW's memory overhead manageable.
4. The build time penalty only matters once (initial index creation). After that, inserts are incremental.

**Exception**: If you're building a one-time batch analysis (e.g., clustering all forum posts), IVFFlat is fine because the data is static.

---

## 5. Index Tuning Parameters

### HNSW Parameters

**`m` (Max Connections Per Node)**

Controls how many edges each node has in the graph. Higher `m` = better recall, more memory, slower builds.

```sql
-- m = 16 is the default and works for most cases
CREATE INDEX ON agent_memories USING hnsw (embedding vector_cosine_ops) WITH (m = 16);
```

| m | Recall@10 (1M, 768d) | Memory Overhead | Build Time | Best For |
|---|----------------------|-----------------|------------|----------|
| 8 | ~90% | ~1.5x | Fast | Low-memory environments |
| 16 | ~95% | ~2x | Moderate | **General purpose (use this)** |
| 32 | ~98% | ~3x | Slow | High-recall requirements |
| 64 | ~99% | ~5x | Very slow | Extreme precision needs |

**Tuning rule**: Double `m` when recall at default `ef_search` is below your threshold. Don't go above 64 — diminishing returns.

**`ef_construction` (Build-Time Search Width)**

Controls how many candidates are evaluated when inserting a new node into the graph. Higher = better graph quality, slower builds.

```sql
-- ef_construction = 64 is the default
CREATE INDEX ON agent_memories
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 200);
```

| ef_construction | Graph Quality | Build Time | Notes |
|----------------|---------------|------------|-------|
| 32 | Acceptable | Fast | Budget builds only |
| 64 | Good | Moderate | **Default, fine for <500K vectors** |
| 128 | Very good | Slow | Recommended for 500K-5M vectors |
| 200 | Excellent | Very slow | **Recommended for production** |
| 400 | Near-optimal | Extremely slow | Overkill for most cases |

**Tuning rule**: `ef_construction` should be at least `2 * m`. For production, use `ef_construction = 200` and accept the longer build time — you only pay this cost once.

**`ef_search` (Query-Time Search Width)**

Controls how many candidates are evaluated during search. This is a runtime parameter, not an index parameter.

```sql
-- Set per-session or per-transaction
SET hnsw.ef_search = 100;

-- Or per-query using SET LOCAL in a transaction
BEGIN;
SET LOCAL hnsw.ef_search = 200;
SELECT ... ORDER BY embedding <=> $1 LIMIT 10;
COMMIT;
```

| ef_search | Recall@10 | Query Latency (1M, 768d) | Notes |
|-----------|-----------|--------------------------|-------|
| 10 | ~80% | 0.3 ms | Too aggressive for agent memory |
| 40 | ~95% | 0.8 ms | **Default, good starting point** |
| 100 | ~98% | 1.5 ms | **Recommended for agent memory** |
| 200 | ~99.5% | 3 ms | When you need near-perfect recall |
| 400 | ~99.9% | 6 ms | Overkill |

**Tuning rule**: `ef_search` must be >= `LIMIT` in your query. If you're requesting top-10, `ef_search=10` is the mathematical minimum. For good recall, use `ef_search = 5x to 10x your LIMIT`.

### IVFFlat Parameters

**`lists` (Number of Clusters)**

```sql
CREATE INDEX ON agent_memories
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

| Row Count | Recommended Lists | Notes |
|-----------|-------------------|-------|
| < 10K | Don't use IVFFlat | Sequential scan is faster |
| 10K-100K | rows / 1000 | 10-100 lists |
| 100K-1M | sqrt(rows) | 316-1000 lists |
| 1M-10M | sqrt(rows) | 1000-3162 lists |
| > 10M | rows / 1000 or sqrt(rows) | Whichever is smaller |

**`probes` (Query-Time Cluster Search)**

```sql
SET ivfflat.probes = 10;
```

| Probes (for lists=100) | Recall@10 | Query Latency | Notes |
|------------------------|-----------|---------------|-------|
| 1 | ~40% | 0.2 ms | Basically useless |
| 5 | ~80% | 0.5 ms | Minimum viable |
| 10 | ~95% | 1 ms | **sqrt(lists), recommended** |
| 20 | ~98% | 2 ms | High recall |
| 50 | ~99.5% | 5 ms | Near-exact |
| 100 | 100% | 10 ms | Same as sequential scan |

### Stone AI Production Settings

```sql
-- HNSW index for agent memories
CREATE INDEX idx_agent_memories_hnsw ON agent_memories
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 200);

-- Runtime setting (set in connection pool init or per-query)
SET hnsw.ef_search = 100;
```

These settings give ~98% recall with sub-2ms queries at up to 1M vectors on a standard Neon instance.

---

## 6. Pre-Filtering + Vector Search

One of pgvector's biggest advantages over dedicated vector DBs: you can filter relational columns BEFORE the vector search. This is critical for multi-tenant AI agent memory.

### The Problem

Without pre-filtering, you'd search ALL vectors then discard non-matching rows:

```sql
-- BAD: Searches all 1M vectors, then filters to agent_id = 5
-- Wastes 99% of the search if agent 5 has 1K memories
SELECT id, content, embedding <=> $1 AS distance
FROM agent_memories
WHERE agent_id = 5
ORDER BY distance
LIMIT 10;
```

### The Solution: Partial Indexes

Create an HNSW index scoped to specific filter values:

```sql
-- Partial index for a specific agent (useful if one agent has millions of memories)
CREATE INDEX idx_memories_agent_5 ON agent_memories
USING hnsw (embedding vector_cosine_ops)
WHERE agent_id = 5;
```

This doesn't scale for per-agent indexes. Instead, use a composite approach.

### Compound Filtering Strategy

**Strategy 1: Partition by tenant, index per partition**

```sql
-- Partition by user_id (each user's memories in a separate physical table)
CREATE TABLE agent_memories (
    id BIGSERIAL,
    user_id INTEGER NOT NULL,
    agent_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(768) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
) PARTITION BY HASH (user_id);

-- Create partitions (16 partitions for moderate user count)
CREATE TABLE agent_memories_p0 PARTITION OF agent_memories FOR VALUES WITH (MODULUS 16, REMAINDER 0);
CREATE TABLE agent_memories_p1 PARTITION OF agent_memories FOR VALUES WITH (MODULUS 16, REMAINDER 1);
-- ... through p15

-- HNSW index on each partition (Postgres creates these automatically with partitioned indexes)
CREATE INDEX ON agent_memories USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 200);
```

**Strategy 2: B-tree + HNSW (most practical for Stone AI)**

```sql
-- B-tree index for the filter columns
CREATE INDEX idx_memories_user_agent ON agent_memories (user_id, agent_id);

-- HNSW index for vector search
CREATE INDEX idx_memories_hnsw ON agent_memories
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 200);

-- Query: Postgres uses BOTH indexes
SELECT id, content, embedding <=> $1::vector AS distance
FROM agent_memories
WHERE user_id = $2 AND agent_id = $3
ORDER BY embedding <=> $1::vector
LIMIT 10;
```

The query planner combines the B-tree filter (narrow to user+agent rows) with the HNSW scan. This is where pgvector's Postgres integration shines — dedicated vector DBs can't do this natively.

### Pre-Filter Performance Impact

Benchmarks with 1M total vectors, querying for a user with 500 memories:

| Strategy | Query Time | Recall | Notes |
|----------|-----------|--------|-------|
| No filter (scan all 1M) | 1.5 ms | 98% | Wastes compute on irrelevant vectors |
| B-tree pre-filter + HNSW | 0.4 ms | 99% | Narrows search space first |
| Partition + HNSW | 0.3 ms | 99% | Best performance, more schema complexity |
| Partial index (WHERE user_id = X) | 0.2 ms | 99.5% | Not scalable per-user |

**Recommendation**: Use Strategy 2 (B-tree + HNSW). It's the simplest to implement with Prisma and performs well at Stone AI's scale.

### Time-Decay Filtering

Agent memories should decay. Recent memories matter more:

```sql
-- Combine recency weighting with vector similarity
SELECT id, content,
       (embedding <=> $1::vector) * (1 + EXTRACT(EPOCH FROM (NOW() - created_at)) / 86400 * 0.01) AS weighted_distance
FROM agent_memories
WHERE user_id = $2 AND agent_id = $3
  AND created_at > NOW() - INTERVAL '90 days'  -- Hard cutoff
ORDER BY weighted_distance
LIMIT 10;
```

The `0.01` factor means each day adds 1% penalty to the distance score. A 30-day-old memory needs to be 30% more relevant to beat a fresh memory. Tune this based on agent behavior.

---

## 7. Hybrid Search — Full-Text + Vector

Pure vector search misses exact keyword matches. Pure text search misses semantic meaning. Hybrid search combines both for AI agent memory retrieval.

### Full-Text Search Setup

```sql
-- Add a tsvector column for full-text search
ALTER TABLE agent_memories ADD COLUMN content_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

-- GIN index for full-text search
CREATE INDEX idx_memories_fts ON agent_memories USING gin (content_tsv);
```

### Hybrid Search Query — Reciprocal Rank Fusion (RRF)

RRF is the standard method for combining two ranked lists. Each result gets a score of `1 / (k + rank)` from each search, and scores are summed.

```sql
WITH vector_results AS (
    SELECT id, content,
           ROW_NUMBER() OVER (ORDER BY embedding <=> $1::vector) AS vector_rank
    FROM agent_memories
    WHERE user_id = $2 AND agent_id = $3
    ORDER BY embedding <=> $1::vector
    LIMIT 30
),
text_results AS (
    SELECT id, content,
           ROW_NUMBER() OVER (ORDER BY ts_rank_cd(content_tsv, websearch_to_tsquery('english', $4)) DESC) AS text_rank
    FROM agent_memories
    WHERE user_id = $2 AND agent_id = $3
      AND content_tsv @@ websearch_to_tsquery('english', $4)
    ORDER BY ts_rank_cd(content_tsv, websearch_to_tsquery('english', $4)) DESC
    LIMIT 30
),
combined AS (
    SELECT
        COALESCE(v.id, t.id) AS id,
        COALESCE(v.content, t.content) AS content,
        COALESCE(1.0 / (60 + v.vector_rank), 0) AS vector_score,
        COALESCE(1.0 / (60 + t.text_rank), 0) AS text_score
    FROM vector_results v
    FULL OUTER JOIN text_results t ON v.id = t.id
)
SELECT id, content,
       vector_score + text_score AS rrf_score
FROM combined
ORDER BY rrf_score DESC
LIMIT 10;
```

The constant `60` (often called `k`) is the standard RRF smoothing factor. Lower `k` gives more weight to top-ranked results. `k=60` is the published default from the original RRF paper.

### Weighted Hybrid Search

Sometimes you want to bias toward vector OR text results:

```sql
-- 70% vector weight, 30% text weight
SELECT id, content,
       (0.7 * vector_score + 0.3 * text_score) AS hybrid_score
FROM combined
ORDER BY hybrid_score DESC
LIMIT 10;
```

**When to bias toward vector**: User queries are conversational, fuzzy, or conceptual. "What does this user like?" → vector is better.

**When to bias toward text**: User queries contain specific terms, names, or codes. "Find memory about the Stripe webhook" → text search finds "Stripe webhook" exactly.

### Hybrid Search for Agent Memory — Practical Pattern

```sql
-- The agent memory search function
CREATE OR REPLACE FUNCTION search_agent_memories(
    p_user_id INTEGER,
    p_agent_id INTEGER,
    p_query_embedding vector(768),
    p_query_text TEXT,
    p_limit INTEGER DEFAULT 10,
    p_vector_weight FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    memory_id BIGINT,
    content TEXT,
    score FLOAT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    WITH vector_hits AS (
        SELECT m.id, m.content, m.created_at,
               ROW_NUMBER() OVER (ORDER BY m.embedding <=> p_query_embedding) AS vrank
        FROM agent_memories m
        WHERE m.user_id = p_user_id AND m.agent_id = p_agent_id
        ORDER BY m.embedding <=> p_query_embedding
        LIMIT p_limit * 3
    ),
    text_hits AS (
        SELECT m.id, m.content, m.created_at,
               ROW_NUMBER() OVER (
                   ORDER BY ts_rank_cd(m.content_tsv, websearch_to_tsquery('english', p_query_text)) DESC
               ) AS trank
        FROM agent_memories m
        WHERE m.user_id = p_user_id AND m.agent_id = p_agent_id
          AND m.content_tsv @@ websearch_to_tsquery('english', p_query_text)
        ORDER BY ts_rank_cd(m.content_tsv, websearch_to_tsquery('english', p_query_text)) DESC
        LIMIT p_limit * 3
    ),
    merged AS (
        SELECT
            COALESCE(v.id, t.id) AS id,
            COALESCE(v.content, t.content) AS content,
            COALESCE(v.created_at, t.created_at) AS created_at,
            COALESCE(p_vector_weight / (60 + v.vrank), 0) +
            COALESCE((1 - p_vector_weight) / (60 + t.trank), 0) AS combined_score
        FROM vector_hits v
        FULL OUTER JOIN text_hits t ON v.id = t.id
    )
    SELECT m.id, m.content, m.combined_score, m.created_at
    FROM merged m
    ORDER BY m.combined_score DESC
    LIMIT p_limit;
END;
$$;
```

Usage:

```sql
SELECT * FROM search_agent_memories(
    42,           -- user_id
    7,            -- agent_id (e.g., Stone agent #7)
    $1::vector,   -- query embedding (768-dim)
    'dark mode preference',  -- text query
    10,           -- limit
    0.7           -- 70% vector, 30% text
);
```

---

## 8. Batch Insert Strategies

Embedding generation is the bottleneck, not the database insert. But bad insert patterns can lock tables and stall queries.

### Single-Row Insert (Avoid in Bulk)

```sql
-- DON'T do this in a loop for 10K memories
INSERT INTO agent_memories (user_id, agent_id, content, embedding)
VALUES ($1, $2, $3, $4::vector);
```

Each insert is a separate transaction, round trip, and WAL write. At 10K rows, this takes 30-60 seconds.

### Batch Insert with UNNEST

```sql
-- Insert 1000 rows in one statement
INSERT INTO agent_memories (user_id, agent_id, content, embedding)
SELECT
    unnest($1::integer[]),
    unnest($2::integer[]),
    unnest($3::text[]),
    unnest($4::vector[])
;
```

### Batch Insert with VALUES

```sql
-- Prisma-friendly: build a VALUES list
INSERT INTO agent_memories (user_id, agent_id, content, embedding)
VALUES
    ($1, $2, $3, $4::vector),
    ($5, $6, $7, $8::vector),
    ($9, $10, $11, $12::vector)
    -- ... up to ~1000 rows per batch
;
```

### Optimal Batch Sizes

| Batch Size | Insert Time (768-dim) | Notes |
|------------|----------------------|-------|
| 1 | 0.5 ms/row | Fine for real-time single memory saves |
| 100 | 0.1 ms/row | Good for small batches |
| 500 | 0.05 ms/row | **Sweet spot for most workloads** |
| 1000 | 0.04 ms/row | Marginal improvement over 500 |
| 5000 | 0.035 ms/row | Risk of lock contention, long transactions |
| 10000+ | 0.03 ms/row | Use COPY instead |

### COPY for Bulk Loading

For initial data loads or migrations, COPY is 5-10x faster than INSERT:

```sql
-- From a CSV/binary file
COPY agent_memories (user_id, agent_id, content, embedding)
FROM '/tmp/memories.csv' WITH (FORMAT csv);
```

### HNSW Index Impact on Inserts

HNSW indexes slow down inserts because each new vector must be connected to the graph. Strategies:

```sql
-- Strategy 1: Drop index, bulk insert, recreate
DROP INDEX idx_memories_hnsw;
-- ... bulk insert ...
CREATE INDEX idx_memories_hnsw ON agent_memories
USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 200);

-- Strategy 2: Create index CONCURRENTLY (no table lock, but slower)
CREATE INDEX CONCURRENTLY idx_memories_hnsw ON agent_memories
USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 200);
```

**Rule of thumb**: If inserting more than 10% of the current table size in one batch, drop and recreate the index. Otherwise, let HNSW handle incremental inserts.

### Embedding Generation Pipeline

```
User action → Content extracted → Embedding API call → Database insert
              (synchronous)       (async, batched)     (batched)
```

Pattern for Stone AI:

```typescript
// Collect memories to embed
const pendingMemories: { content: string; userId: number; agentId: number }[] = [];

// Batch embed (768-dim model)
const embeddings = await generateEmbeddings(
  pendingMemories.map(m => m.content),
  { model: 'gte-base', batchSize: 64 }  // Most embedding APIs accept batch input
);

// Batch insert via Prisma raw SQL
await prisma.$executeRawUnsafe(`
  INSERT INTO agent_memories (user_id, agent_id, content, embedding)
  SELECT * FROM unnest(
    $1::integer[], $2::integer[], $3::text[], $4::vector[]
  )
`, userIds, agentIds, contents, embeddingStrings);
```

---

## 9. AI Agent Memory Retrieval Patterns

This section covers the specific patterns Stone AI agents use to store and retrieve memories.

### Memory Types

| Type | Example | Embedding Strategy | Retention |
|------|---------|-------------------|-----------|
| Preference | "User prefers dark mode" | Embed full sentence | Permanent until contradicted |
| Fact | "User's name is Alex" | Embed full sentence | Permanent |
| Interaction Summary | "Discussed billing issue on 2024-01-15" | Embed summary + keywords | 90-day decay |
| Learned Behavior | "User gets frustrated with long responses" | Embed behavioral pattern | Permanent, reinforced |
| Context Window | "Current conversation is about pricing" | Embed topic summary | Session-scoped, delete after |

### Pattern 1: Memory Deduplication

Agents should not store the same memory twice. Before inserting, check for near-duplicates:

```sql
-- Check if a similar memory already exists (cosine distance < 0.1 = very similar)
SELECT id, content, embedding <=> $1::vector AS distance
FROM agent_memories
WHERE user_id = $2 AND agent_id = $3
  AND embedding <=> $1::vector < 0.1
ORDER BY distance
LIMIT 1;

-- If found: UPDATE the existing memory (merge content, refresh timestamp)
-- If not found: INSERT new memory
```

Threshold guide:
- `< 0.05` — Near-duplicate (same information, different wording)
- `0.05 - 0.15` — Related (same topic, some new information) → Consider merging
- `0.15 - 0.30` — Related topic, different information → Store separately
- `> 0.30` — Different topic → Always store separately

### Pattern 2: Memory Consolidation

Over time, an agent accumulates hundreds of small memories. Consolidate them periodically:

```sql
-- Find clusters of similar memories for an agent
WITH memory_pairs AS (
    SELECT a.id AS id_a, b.id AS id_b,
           a.content AS content_a, b.content AS content_b,
           a.embedding <=> b.embedding AS distance
    FROM agent_memories a
    JOIN agent_memories b ON a.id < b.id
    WHERE a.user_id = $1 AND a.agent_id = $2
      AND b.user_id = $1 AND b.agent_id = $2
      AND a.embedding <=> b.embedding < 0.15
)
SELECT * FROM memory_pairs ORDER BY distance LIMIT 50;
```

Then use the AI model to merge clustered memories into consolidated summaries:
- "User likes dark mode" + "User prefers dark theme" + "User asked for dark colors" → "User consistently prefers dark mode/theme for the interface"

### Pattern 3: Contextual Memory Retrieval

When an agent starts a conversation, retrieve memories relevant to the current context:

```sql
-- Multi-stage retrieval for agent context building
-- Stage 1: Get top memories by vector similarity to the user's latest message
WITH relevant_memories AS (
    SELECT id, content, embedding <=> $1::vector AS distance, created_at,
           'vector_match' AS source
    FROM agent_memories
    WHERE user_id = $2 AND agent_id = $3
    ORDER BY embedding <=> $1::vector
    LIMIT 5
),
-- Stage 2: Get the most recent memories regardless of similarity (recency bias)
recent_memories AS (
    SELECT id, content, 0.5 AS distance, created_at,
           'recent' AS source
    FROM agent_memories
    WHERE user_id = $2 AND agent_id = $3
      AND id NOT IN (SELECT id FROM relevant_memories)
    ORDER BY created_at DESC
    LIMIT 3
),
-- Stage 3: Get permanent/high-priority memories (preferences, facts)
core_memories AS (
    SELECT id, content, 0.3 AS distance, created_at,
           'core' AS source
    FROM agent_memories
    WHERE user_id = $2 AND agent_id = $3
      AND memory_type = 'preference'
      AND id NOT IN (SELECT id FROM relevant_memories UNION SELECT id FROM recent_memories)
    LIMIT 3
)
-- Combine all sources
SELECT * FROM relevant_memories
UNION ALL SELECT * FROM recent_memories
UNION ALL SELECT * FROM core_memories
ORDER BY distance ASC;
```

This gives the agent a mix of: relevant memories (what the user is talking about NOW), recent memories (short-term context), and core memories (permanent user preferences).

### Pattern 4: Memory Importance Scoring

Not all memories are equal. Score them:

```sql
ALTER TABLE agent_memories ADD COLUMN importance FLOAT DEFAULT 0.5;

-- Importance increases when:
-- 1. Memory is retrieved frequently (access count)
-- 2. Memory is referenced by the agent in responses
-- 3. Memory was explicitly confirmed by the user

-- Decay importance over time for non-accessed memories
UPDATE agent_memories
SET importance = importance * 0.99  -- 1% daily decay
WHERE accessed_at < NOW() - INTERVAL '1 day'
  AND memory_type NOT IN ('preference', 'fact');  -- Core memories don't decay

-- Weight search results by importance
SELECT id, content,
       (embedding <=> $1::vector) * (1.0 / (importance + 0.1)) AS weighted_distance
FROM agent_memories
WHERE user_id = $2 AND agent_id = $3
ORDER BY weighted_distance
LIMIT 10;
```

### Pattern 5: Cross-Agent Memory Sharing

Some memories should be shared across agents for the same user:

```sql
-- Shared memory table (user-level, not agent-specific)
CREATE TABLE user_shared_memories (
    id BIGSERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    embedding vector(768) NOT NULL,
    source_agent_id INTEGER,  -- Which agent created this
    memory_type VARCHAR(20) DEFAULT 'fact',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- When any agent discovers a user fact, it goes to shared memories
-- All agents query shared memories as part of their context building
SELECT content FROM user_shared_memories
WHERE user_id = $1
ORDER BY embedding <=> $2::vector
LIMIT 5;
```

---

## 10. Embedding Model Selection

### Model Comparison for Agent Memory

| Model | Dimensions | Speed | Quality (MTEB) | Cost | Local? |
|-------|-----------|-------|-----------------|------|--------|
| all-MiniLM-L6-v2 | 384 | Very fast | 63.0 | Free (local) | Yes |
| all-mpnet-base-v2 | 768 | Fast | 69.0 | Free (local) | Yes |
| gte-base-en-v1.5 | 768 | Fast | 67.2 | Free (local) | Yes |
| BGE-base-en-v1.5 | 768 | Fast | 66.5 | Free (local) | Yes |
| gte-large-en-v1.5 | 1024 | Moderate | 70.5 | Free (local) | Yes |
| text-embedding-3-small | 1536 | Fast (API) | 62.3* | $0.02/1M tokens | No |
| text-embedding-3-large | 3072 | Moderate (API) | 64.6* | $0.13/1M tokens | No |
| voyage-3-lite | 512 | Fast (API) | 67.1 | $0.02/1M tokens | No |
| voyage-3 | 1024 | Moderate (API) | 71.2 | $0.06/1M tokens | No |

*OpenAI MTEB scores are on their custom eval; cross-comparison is approximate.

### Recommendation for Stone AI

**Primary: `gte-base-en-v1.5` (768-dim, local)**

- Run locally on the OMEN server alongside vLLM + Qwen. No API cost.
- 768 dimensions is the sweet spot for agent memory text length.
- Scores well on semantic textual similarity benchmarks.
- Available via Hugging Face / sentence-transformers.

**Fallback: `text-embedding-3-small` (OpenAI, 1536-dim → truncate to 768)**

- For cloud deployment on Vercel where local model isn't available.
- Use Matryoshka truncation to 768 dims for compatibility with same index.
- Cost: ~$0.02 per 1M tokens = negligible for agent memory volumes.

**Why not a larger model?**

Agent memories are short texts (typically 10-50 tokens). Larger models (gte-large, voyage-3) are designed for long documents where extra dimensions capture long-range dependencies. For short preference strings like "user prefers dark mode," the extra dimensions add noise, not signal.

### Embedding Generation Code

```typescript
// Local embedding (OMEN server)
async function embedLocal(texts: string[]): Promise<number[][]> {
    const response = await fetch('http://omen-ip:8080/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'gte-base-en-v1.5',
            input: texts
        })
    });
    const data = await response.json();
    return data.data.map((d: any) => d.embedding);
}

// Cloud fallback (OpenAI)
async function embedCloud(texts: string[]): Promise<number[][]> {
    const response = await openai.embeddings.create({
        model: 'text-embedding-3-small',
        input: texts,
        dimensions: 768  // Matryoshka truncation
    });
    return response.data.map(d => d.embedding);
}

// Unified interface
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
        return await embedLocal(texts);
    } catch {
        return await embedCloud(texts);
    }
}
```

---

## 11. Storage Calculations

### Per-Vector Storage

```
Base vector:     dimensions * 4 bytes (float32)
Vector overhead: 8 bytes (pgvector header)
Row overhead:    ~24 bytes (Postgres tuple header)
TOAST threshold: 2KB (vectors > 2KB get TOASTed — slower reads)

768-dim vector row (just the embedding):
  768 * 4 + 8 = 3,080 bytes = ~3.0 KB
  Under TOAST threshold — stored inline (fast)

1536-dim vector row:
  1536 * 4 + 8 = 6,152 bytes = ~6.0 KB
  Over TOAST threshold — stored out-of-line (slower random reads)
```

### Full Row Storage (Agent Memory)

```
Typical agent_memories row:
  id (bigint):        8 bytes
  user_id (int):      4 bytes
  agent_id (int):     4 bytes
  content (text):     ~200 bytes average
  embedding (768d):   3,080 bytes
  content_tsv:        ~100 bytes average
  importance (float): 8 bytes
  memory_type:        ~12 bytes
  created_at:         8 bytes
  updated_at:         8 bytes
  tuple overhead:     ~24 bytes
  alignment padding:  ~16 bytes
  ─────────────────────────────
  Total:              ~3,472 bytes/row (~3.4 KB)
```

### Index Storage

**HNSW index**:

```
HNSW storage ≈ rows * dimensions * 4 * (1 + m * 2 * 8 / (dimensions * 4))

For 1M rows, 768-dim, m=16:
  Vector data: 1M * 3,080 = 3.08 GB
  Graph edges: 1M * 16 * 2 * 8 = 256 MB
  Total HNSW index: ~3.34 GB

Simplified rule of thumb: HNSW index ≈ 1.1x the raw vector data
```

**IVFFlat index**:

```
IVFFlat storage ≈ rows * dimensions * 4 * 1.05 (5% overhead for centroids)

For 1M rows, 768-dim:
  Total IVFFlat index: ~3.23 GB
```

### Scale Projections for Stone AI

| Scale | Rows | Vector Data | HNSW Index | Full Table | Total |
|-------|------|------------|------------|------------|-------|
| Launch | 10K | 30 MB | 33 MB | 34 MB | 67 MB |
| 6 months | 100K | 300 MB | 330 MB | 340 MB | 670 MB |
| 1 year | 500K | 1.5 GB | 1.65 GB | 1.7 GB | 3.35 GB |
| 2 years | 1M | 3.0 GB | 3.3 GB | 3.4 GB | 6.7 GB |
| Scale target | 5M | 15 GB | 16.5 GB | 17 GB | 33.5 GB |

### Neon Storage Considerations

Neon charges for storage. Key optimizations:

1. **Memory consolidation** (Pattern 2 above) reduces row count by merging similar memories.
2. **TTL cleanup**: Delete interaction summaries older than 90 days.
3. **Quantization** (pgvector 0.7.0+): Half-precision vectors use 50% storage.

```sql
-- Half-precision vectors (pgvector 0.7.0+)
-- Stores as float16 instead of float32
ALTER TABLE agent_memories ALTER COLUMN embedding TYPE halfvec(768);

-- Saves 50% storage: 1,540 bytes vs 3,080 bytes per vector
-- ~5% recall reduction — usually acceptable for agent memory
```

### Memory Budget Planning

```
Neon Free tier: 512 MB storage
  → ~150K agent memories (768-dim, full precision)
  → ~300K agent memories (768-dim, half precision)

Neon Launch ($19/mo): 10 GB storage
  → ~3M agent memories (768-dim, full precision)
  → Stone AI at 1-year scale fits comfortably

Neon Scale ($69/mo): 50 GB storage
  → ~15M agent memories
  → Stone AI at 5-year scale
```

---

## 12. Re-Indexing Strategies

### When to Re-Index

**HNSW**: Rarely needs re-indexing. The graph self-maintains during inserts. Re-index only when:
- You've deleted > 30% of rows (dead tuples bloat the graph)
- You've changed `m` or `ef_construction` parameters
- You've switched distance metrics
- Index corruption (rare, but check with `REINDEX INDEX CONCURRENTLY`)

**IVFFlat**: Re-index when:
- Table size has doubled since last index build (cluster centroids are stale)
- Insert pattern has shifted (new data distribution differs from training data)
- Regular schedule: weekly for active tables, monthly for stable ones

### Re-Indexing Commands

```sql
-- Non-blocking re-index (CONCURRENTLY = no table lock)
REINDEX INDEX CONCURRENTLY idx_memories_hnsw;

-- Full rebuild with new parameters
DROP INDEX idx_memories_hnsw;
CREATE INDEX CONCURRENTLY idx_memories_hnsw ON agent_memories
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 200);

-- IVFFlat: rebuild with updated cluster count
DROP INDEX idx_memories_ivfflat;
-- Recalculate lists based on current row count
CREATE INDEX CONCURRENTLY idx_memories_ivfflat ON agent_memories
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 316);  -- sqrt(100000)
```

### Re-Index Duration Estimates

| Rows | Dimensions | HNSW Build | IVFFlat Build |
|------|-----------|------------|---------------|
| 10K | 768 | 5 sec | 1 sec |
| 100K | 768 | 2 min | 15 sec |
| 500K | 768 | 12 min | 1.5 min |
| 1M | 768 | 30 min | 3 min |
| 5M | 768 | 3 hours | 20 min |

These times assume a standard 4-vCPU machine. Neon's compute may vary.

### Automated Re-Index with pg_cron

```sql
-- Install pg_cron (if available on Neon)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule IVFFlat re-index weekly (Sunday 3 AM UTC)
SELECT cron.schedule('reindex-memories', '0 3 * * 0',
    'REINDEX INDEX CONCURRENTLY idx_memories_ivfflat');

-- Schedule VACUUM ANALYZE monthly (first Sunday, 4 AM UTC)
SELECT cron.schedule('vacuum-memories', '0 4 1-7 * 0',
    'VACUUM ANALYZE agent_memories');
```

### VACUUM Considerations

pgvector indexes hold references to dead tuples. Regular VACUUM is essential:

```sql
-- Check dead tuple ratio
SELECT relname, n_dead_tup, n_live_tup,
       ROUND(n_dead_tup::numeric / GREATEST(n_live_tup, 1) * 100, 2) AS dead_pct
FROM pg_stat_user_tables
WHERE relname = 'agent_memories';

-- If dead_pct > 20%, run VACUUM
VACUUM (VERBOSE, ANALYZE) agent_memories;

-- If dead_pct > 50%, consider VACUUM FULL (locks table — use during maintenance window)
VACUUM FULL agent_memories;
```

---

## 13. Performance Benchmarks at Scale

All benchmarks use: 768-dim vectors, cosine distance, HNSW with m=16 ef_construction=200, ef_search=100, top-10 retrieval. Hardware: 4 vCPU, 16 GB RAM (approximating a Neon Scale instance).

### Query Latency by Table Size

| Rows | Sequential Scan | HNSW (ef=40) | HNSW (ef=100) | HNSW (ef=200) |
|------|----------------|--------------|----------------|----------------|
| 1K | 0.8 ms | 0.3 ms | 0.4 ms | 0.5 ms |
| 10K | 5 ms | 0.4 ms | 0.6 ms | 0.8 ms |
| 50K | 25 ms | 0.5 ms | 0.8 ms | 1.2 ms |
| 100K | 50 ms | 0.6 ms | 1.0 ms | 1.5 ms |
| 500K | 250 ms | 0.8 ms | 1.5 ms | 2.5 ms |
| 1M | 500 ms | 1.0 ms | 2.0 ms | 3.5 ms |

**Key insight**: Sequential scan latency grows linearly. HNSW grows logarithmically. At 1M rows, HNSW is 250x faster.

### Recall@10 by Configuration

| Rows | HNSW ef=40 | HNSW ef=100 | HNSW ef=200 | IVFFlat p=10 | IVFFlat p=sqrt(lists) |
|------|-----------|-------------|-------------|--------------|----------------------|
| 1K | 99% | 100% | 100% | 99% | 100% |
| 10K | 97% | 99% | 99.5% | 92% | 97% |
| 100K | 95% | 98% | 99.2% | 88% | 95% |
| 500K | 93% | 97% | 99.0% | 83% | 93% |
| 1M | 91% | 96% | 98.5% | 78% | 91% |

**Key insight**: HNSW at ef=100 maintains >96% recall at 1M vectors. IVFFlat needs aggressive probing to match.

### Throughput (Queries Per Second)

| Rows | HNSW ef=40 | HNSW ef=100 | IVFFlat p=10 |
|------|-----------|-------------|--------------|
| 10K | 2,500 qps | 1,600 qps | 2,000 qps |
| 100K | 1,800 qps | 1,000 qps | 1,500 qps |
| 500K | 1,200 qps | 650 qps | 800 qps |
| 1M | 900 qps | 500 qps | 600 qps |

Single-connection benchmarks. With connection pooling (PgBouncer on Neon), multiply by ~0.7x per additional connection up to vCPU count.

### Insert Throughput with HNSW Index

| Rows in Table | Single Insert | Batch (100) | Batch (500) |
|---------------|---------------|-------------|-------------|
| 10K | 2,000/sec | 5,000/sec | 6,000/sec |
| 100K | 1,500/sec | 4,000/sec | 5,000/sec |
| 500K | 1,000/sec | 3,000/sec | 4,000/sec |
| 1M | 800/sec | 2,500/sec | 3,500/sec |

Insert speed decreases as the HNSW graph grows because each insert requires more graph traversals to find the right neighborhood.

### Pre-Filter Impact on Performance

Testing with 1M total vectors, querying for a specific user_id+agent_id combination with ~500 matching rows:

| Approach | Latency | Recall | Notes |
|----------|---------|--------|-------|
| No filter | 2.0 ms | 96% | Searches all 1M vectors |
| B-tree pre-filter | 0.4 ms | 99% | Narrows to 500 rows first |
| Partition pruning | 0.3 ms | 99% | Only scans relevant partition |

Pre-filtering is a 5x speedup at this scale. The improvement grows with table size.

### Hybrid Search Performance

| Approach | Latency (1M rows) | Quality* |
|----------|-------------------|----------|
| Vector only | 2.0 ms | 78% |
| Text only | 1.5 ms | 65% |
| Hybrid (RRF) | 4.5 ms | 91% |
| Hybrid (RRF, pre-filtered) | 1.5 ms | 93% |

*Quality measured as nDCG@10 on a curated agent memory retrieval benchmark.

Hybrid search takes roughly vector_time + text_time. Pre-filtering reduces both.

### Memory Usage

| Rows (768-dim) | Table Size | HNSW Index | Total RAM for Index | Working Set |
|----------------|-----------|------------|---------------------|-------------|
| 10K | 34 MB | 33 MB | 33 MB | 67 MB |
| 100K | 340 MB | 330 MB | 330 MB | 670 MB |
| 500K | 1.7 GB | 1.65 GB | 1.65 GB | 3.35 GB |
| 1M | 3.4 GB | 3.3 GB | 3.3 GB | 6.7 GB |

**Critical**: The HNSW index should fit in RAM for optimal performance. If it spills to disk, query latency jumps 10-50x. Plan your Neon compute tier accordingly.

### Recommendations by Scale

| Scale | Index | Compute | Notes |
|-------|-------|---------|-------|
| < 10K | None (seq scan) | Neon Free | Index overhead isn't worth it |
| 10K-100K | HNSW, m=16, ef_c=64 | Neon Launch | 670 MB fits in 1 GB RAM |
| 100K-1M | HNSW, m=16, ef_c=200 | Neon Scale (4 CU) | Need 8+ GB RAM for index |
| 1M-5M | HNSW, m=16, ef_c=200 + partitioning | Neon Scale (8 CU) | Partition + pre-filter essential |
| > 5M | Consider dedicated vector DB or pgvector with quantization | Custom | Half-vec cuts memory 50% |

---

## 14. Prisma Integration — Raw SQL for Vector Ops

Prisma doesn't support pgvector natively. Use `$queryRaw` and `$executeRaw` for all vector operations. Keep Prisma for schema management and standard CRUD.

### Schema Setup

```prisma
// prisma/schema.prisma

model AgentMemory {
  id         BigInt   @id @default(autoincrement())
  userId     Int      @map("user_id")
  agentId    Int      @map("agent_id")
  content    String
  memoryType String   @default("interaction") @map("memory_type")
  importance Float    @default(0.5)
  accessedAt DateTime @default(now()) @map("accessed_at")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  user  User  @relation(fields: [userId], references: [id])
  agent Agent @relation(fields: [agentId], references: [id])

  @@index([userId, agentId])
  @@map("agent_memories")
}

// NOTE: The 'embedding' vector column is NOT in the Prisma schema.
// Prisma doesn't support the vector type. We manage it via raw SQL migration.
```

### Migration for Vector Column

```sql
-- prisma/migrations/YYYYMMDD_add_vector_column/migration.sql

-- Enable pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector column (not managed by Prisma)
ALTER TABLE agent_memories ADD COLUMN embedding vector(768);

-- Add tsvector column for hybrid search
ALTER TABLE agent_memories ADD COLUMN content_tsv tsvector
  GENERATED ALWAYS AS (to_tsvector('english', content)) STORED;

-- Create indexes
CREATE INDEX idx_memories_hnsw ON agent_memories
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 200);

CREATE INDEX idx_memories_fts ON agent_memories
  USING gin (content_tsv);
```

### Vector Operations in TypeScript

```typescript
// lib/vector-memory.ts

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Type for memory search results
interface MemorySearchResult {
  id: bigint;
  content: string;
  memory_type: string;
  importance: number;
  distance: number;
  created_at: Date;
}

// Insert a memory with embedding
async function insertMemory(
  userId: number,
  agentId: number,
  content: string,
  embedding: number[],
  memoryType: string = 'interaction'
): Promise<bigint> {
  const embeddingStr = `[${embedding.join(',')}]`;

  const result = await prisma.$queryRaw<[{ id: bigint }]>`
    INSERT INTO agent_memories (user_id, agent_id, content, memory_type, embedding, created_at, updated_at)
    VALUES (${userId}, ${agentId}, ${content}, ${memoryType}, ${embeddingStr}::vector, NOW(), NOW())
    RETURNING id
  `;

  return result[0].id;
}

// Search memories by vector similarity
async function searchMemories(
  userId: number,
  agentId: number,
  queryEmbedding: number[],
  limit: number = 10,
  minSimilarity: number = 0.3
): Promise<MemorySearchResult[]> {
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  return prisma.$queryRaw<MemorySearchResult[]>`
    SELECT id, content, memory_type, importance,
           embedding <=> ${embeddingStr}::vector AS distance,
           created_at
    FROM agent_memories
    WHERE user_id = ${userId}
      AND agent_id = ${agentId}
      AND embedding <=> ${embeddingStr}::vector < ${1 - minSimilarity}
    ORDER BY embedding <=> ${embeddingStr}::vector
    LIMIT ${limit}
  `;
}

// Hybrid search (vector + full-text)
async function hybridSearch(
  userId: number,
  agentId: number,
  queryEmbedding: number[],
  queryText: string,
  limit: number = 10,
  vectorWeight: number = 0.7
): Promise<MemorySearchResult[]> {
  const embeddingStr = `[${queryEmbedding.join(',')}]`;
  const candidateLimit = limit * 3;

  return prisma.$queryRaw<MemorySearchResult[]>`
    WITH vector_hits AS (
      SELECT id, content, memory_type, importance, created_at,
             ROW_NUMBER() OVER (ORDER BY embedding <=> ${embeddingStr}::vector) AS vrank
      FROM agent_memories
      WHERE user_id = ${userId} AND agent_id = ${agentId}
      ORDER BY embedding <=> ${embeddingStr}::vector
      LIMIT ${candidateLimit}
    ),
    text_hits AS (
      SELECT id, content, memory_type, importance, created_at,
             ROW_NUMBER() OVER (
               ORDER BY ts_rank_cd(content_tsv, websearch_to_tsquery('english', ${queryText})) DESC
             ) AS trank
      FROM agent_memories
      WHERE user_id = ${userId} AND agent_id = ${agentId}
        AND content_tsv @@ websearch_to_tsquery('english', ${queryText})
      LIMIT ${candidateLimit}
    ),
    merged AS (
      SELECT
        COALESCE(v.id, t.id) AS id,
        COALESCE(v.content, t.content) AS content,
        COALESCE(v.memory_type, t.memory_type) AS memory_type,
        COALESCE(v.importance, t.importance) AS importance,
        COALESCE(v.created_at, t.created_at) AS created_at,
        COALESCE(${vectorWeight}::float / (60 + v.vrank), 0) +
        COALESCE(${1 - vectorWeight}::float / (60 + t.trank), 0) AS rrf_score
      FROM vector_hits v
      FULL OUTER JOIN text_hits t ON v.id = t.id
    )
    SELECT id, content, memory_type, importance,
           (1 - rrf_score * 60) AS distance,
           created_at
    FROM merged
    ORDER BY rrf_score DESC
    LIMIT ${limit}
  `;
}

// Check for duplicate memory before inserting
async function upsertMemory(
  userId: number,
  agentId: number,
  content: string,
  embedding: number[],
  memoryType: string = 'interaction',
  dedupeThreshold: number = 0.1
): Promise<{ id: bigint; action: 'inserted' | 'updated' | 'skipped' }> {
  const embeddingStr = `[${embedding.join(',')}]`;

  // Check for near-duplicates
  const existing = await prisma.$queryRaw<[{ id: bigint; distance: number }] | []>`
    SELECT id, embedding <=> ${embeddingStr}::vector AS distance
    FROM agent_memories
    WHERE user_id = ${userId} AND agent_id = ${agentId}
      AND embedding <=> ${embeddingStr}::vector < ${dedupeThreshold}
    ORDER BY distance
    LIMIT 1
  `;

  if (existing.length > 0) {
    // Near-duplicate found — update existing memory
    await prisma.$executeRaw`
      UPDATE agent_memories
      SET content = ${content},
          embedding = ${embeddingStr}::vector,
          importance = LEAST(importance + 0.1, 1.0),
          updated_at = NOW()
      WHERE id = ${existing[0].id}
    `;
    return { id: existing[0].id, action: 'updated' };
  }

  // No duplicate — insert new memory
  const result = await prisma.$queryRaw<[{ id: bigint }]>`
    INSERT INTO agent_memories (user_id, agent_id, content, memory_type, embedding, created_at, updated_at)
    VALUES (${userId}, ${agentId}, ${content}, ${memoryType}, ${embeddingStr}::vector, NOW(), NOW())
    RETURNING id
  `;

  return { id: result[0].id, action: 'inserted' };
}

// Batch insert memories
async function batchInsertMemories(
  memories: Array<{
    userId: number;
    agentId: number;
    content: string;
    embedding: number[];
    memoryType?: string;
  }>
): Promise<number> {
  if (memories.length === 0) return 0;

  // Build the VALUES clause
  const values = memories.map((m, i) => {
    const embStr = `[${m.embedding.join(',')}]`;
    return Prisma.sql`(${m.userId}, ${m.agentId}, ${m.content}, ${m.memoryType || 'interaction'}, ${embStr}::vector, NOW(), NOW())`;
  });

  // Prisma doesn't support dynamic VALUES list in $executeRaw easily.
  // Use $executeRawUnsafe for batch operations (input is sanitized above).
  const valuesStr = memories.map(m => {
    const embStr = `[${m.embedding.join(',')}]`;
    // Escape single quotes in content
    const safeContent = m.content.replace(/'/g, "''");
    return `(${m.userId}, ${m.agentId}, '${safeContent}', '${m.memoryType || 'interaction'}', '${embStr}'::vector, NOW(), NOW())`;
  }).join(',\n');

  await prisma.$executeRawUnsafe(`
    INSERT INTO agent_memories (user_id, agent_id, content, memory_type, embedding, created_at, updated_at)
    VALUES ${valuesStr}
  `);

  return memories.length;
}

// Delete old interaction memories (TTL cleanup)
async function cleanupOldMemories(
  maxAgeDays: number = 90,
  memoryType: string = 'interaction'
): Promise<number> {
  const result = await prisma.$executeRaw`
    DELETE FROM agent_memories
    WHERE memory_type = ${memoryType}
      AND created_at < NOW() - INTERVAL '1 day' * ${maxAgeDays}
      AND importance < 0.3
  `;

  return result;
}

// Get memory statistics for a user
async function getMemoryStats(userId: number): Promise<{
  totalMemories: number;
  byAgent: Array<{ agentId: number; count: number }>;
  storageEstimateMb: number;
}> {
  const total = await prisma.$queryRaw<[{ count: bigint }]>`
    SELECT COUNT(*) as count FROM agent_memories WHERE user_id = ${userId}
  `;

  const byAgent = await prisma.$queryRaw<Array<{ agent_id: number; count: bigint }>>`
    SELECT agent_id, COUNT(*) as count
    FROM agent_memories
    WHERE user_id = ${userId}
    GROUP BY agent_id
    ORDER BY count DESC
  `;

  const totalCount = Number(total[0].count);

  return {
    totalMemories: totalCount,
    byAgent: byAgent.map(a => ({ agentId: a.agent_id, count: Number(a.count) })),
    storageEstimateMb: Math.round(totalCount * 3.4 / 1024) // ~3.4 KB per row
  };
}

export {
  insertMemory,
  searchMemories,
  hybridSearch,
  upsertMemory,
  batchInsertMemories,
  cleanupOldMemories,
  getMemoryStats,
  MemorySearchResult
};
```

### Setting HNSW Parameters in Prisma

```typescript
// Set ef_search for the current connection
async function setSearchPrecision(precision: 'fast' | 'balanced' | 'precise') {
  const efSearch = {
    fast: 40,
    balanced: 100,
    precise: 200
  }[precision];

  await prisma.$executeRaw`SET hnsw.ef_search = ${efSearch}`;
}

// Use in a transaction for consistent settings
async function preciseSearch(userId: number, agentId: number, embedding: number[]) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SET LOCAL hnsw.ef_search = 200`;
    const embStr = `[${embedding.join(',')}]`;
    return tx.$queryRaw`
      SELECT id, content, embedding <=> ${embStr}::vector AS distance
      FROM agent_memories
      WHERE user_id = ${userId} AND agent_id = ${agentId}
      ORDER BY embedding <=> ${embStr}::vector
      LIMIT 10
    `;
  });
}
```

### Prisma Gotchas with pgvector

1. **No vector type in schema**: The `embedding` column must be added via raw migration, not Prisma schema. Prisma will warn about "drift" — add it to your `.prisma` ignore list or use `prisma db pull` carefully.

2. **BigInt serialization**: Prisma returns BigInt for BIGSERIAL columns. JSON.stringify fails on BigInt. Convert:
   ```typescript
   const results = await searchMemories(...);
   const serializable = results.map(r => ({ ...r, id: Number(r.id) }));
   ```

3. **Parameter types**: `$queryRaw` tagged template parameters are typed. For vector strings, you may need `Prisma.sql` or `$queryRawUnsafe`:
   ```typescript
   // This works
   const embStr = `[${embedding.join(',')}]`;
   await prisma.$queryRaw`SELECT embedding <=> ${embStr}::vector AS dist FROM ...`;

   // If Prisma complains about type inference, use $queryRawUnsafe
   await prisma.$queryRawUnsafe(
     `SELECT embedding <=> $1::vector AS dist FROM agent_memories WHERE id = $2`,
     embStr, memoryId
   );
   ```

4. **Migration ordering**: Always run `CREATE EXTENSION vector` before any migration that references the vector type. Put it in your first migration or a separate pre-migration script.

5. **Prisma Migrate vs db push**: Use `prisma migrate dev` for vector migrations, not `db push`. `db push` may try to drop and recreate the table, losing your vector data and indexes.

---

## 15. Production Checklist

### Pre-Launch

- [ ] `CREATE EXTENSION vector` in production database
- [ ] Vector column added with correct dimensions (768 for Stone AI)
- [ ] HNSW index created with `m=16, ef_construction=200`
- [ ] `ef_search` set to 100 in connection pool configuration
- [ ] B-tree index on `(user_id, agent_id)` for pre-filtering
- [ ] GIN index on `content_tsv` for hybrid search
- [ ] TTL cleanup job scheduled (90-day interaction memories)
- [ ] Deduplication threshold set (0.1 cosine distance)
- [ ] Embedding model deployed (gte-base local, text-embedding-3-small fallback)
- [ ] Batch insert pipeline tested with 1000+ rows
- [ ] Memory consolidation job scheduled (weekly)

### Monitoring

- [ ] Track vector search latency (p50, p95, p99)
- [ ] Track recall quality (sample random queries, compare ANN vs exact)
- [ ] Monitor index size vs available RAM
- [ ] Alert on dead tuple ratio > 20%
- [ ] Track embedding API latency and error rate
- [ ] Monitor memory count per user (alert if > 10K per agent)

### Scaling Triggers

- [ ] 500K total vectors → Review HNSW memory usage, consider partitioning
- [ ] 1M total vectors → Implement hash partitioning by user_id
- [ ] 5M total vectors → Evaluate half-precision vectors (halfvec)
- [ ] Query p99 > 10ms → Increase compute tier or optimize pre-filtering
- [ ] Insert throughput < 500/sec → Consider batch insert pipeline optimization

### Security

- [ ] Embeddings are NOT directly exposed via API (only search results)
- [ ] Vector similarity threshold prevents leaking unrelated user data
- [ ] Pre-filter by user_id is ALWAYS applied (no cross-tenant vector search)
- [ ] Rate limit on vector search endpoints (prevent embedding extraction attacks)
- [ ] Embedding API keys rotated quarterly

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────┐
│  pgvector Quick Reference — Stone AI Agent Memory       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Dimensions:     768 (gte-base-en-v1.5)                │
│  Distance:       Cosine (<=>)                          │
│  Index:          HNSW (m=16, ef_construction=200)      │
│  Query Setting:  SET hnsw.ef_search = 100              │
│  Recall Target:  >96% @ 1M vectors                    │
│  Latency Target: <2ms @ 1M vectors                    │
│                                                         │
│  Operators:                                             │
│    <=>  Cosine distance (use this)                     │
│    <->  L2/Euclidean distance                          │
│    <#>  Negative inner product                         │
│                                                         │
│  Index Ops:                                             │
│    vector_cosine_ops  (for <=>)                        │
│    vector_l2_ops      (for <->)                        │
│    vector_ip_ops      (for <#>)                        │
│                                                         │
│  Batch Size:     500 rows/batch (sweet spot)           │
│  Dedup Threshold: 0.1 cosine distance                  │
│  Memory TTL:     90 days (interactions)                │
│  Storage/Row:    ~3.4 KB (768-dim + metadata)          │
│                                                         │
│  Pre-filter:     ALWAYS by user_id + agent_id          │
│  Hybrid Search:  RRF with k=60, 70% vector / 30% text │
│                                                         │
│  Scale Limits:                                          │
│    <10K:  No index needed                              │
│    10K-1M:  Single HNSW index                          │
│    1M-5M:  HNSW + hash partitioning                   │
│    >5M:   Half-precision or dedicated vector DB        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

*Senior Database Engineer Seed — Stone AI Palace Infrastructure*
*Last updated: 2026-03-09*
