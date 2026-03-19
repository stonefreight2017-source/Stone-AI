# DB-2: pgvector Embedding Storage & Query Optimization

## Purpose
Operational reference for the Senior Database Engineer working on Stone AI's vector search infrastructure. Covers the actual pgvector implementation, embedding pipeline, indexing strategies, query optimization, and scaling considerations on Neon PostgreSQL.

---

## Current Implementation (from actual codebase)

### Vector Column Definition
**Model**: `AgentKnowledgeChunk` in `prisma/schema.prisma`
```prisma
model AgentKnowledgeChunk {
  id        String   @id @default(cuid())
  agentId   String
  title     String
  content   String   @db.Text
  source    String?
  embedding Unsupported("vector(768)")?   // <-- pgvector column, nullable
  createdAt DateTime @default(now())

  agent Agent @relation(fields: [agentId], references: [id], onDelete: Cascade)
  @@index([agentId])
}
```

**Key facts:**
- Dimensionality: **768** (matches nomic-embed-text / local embedding models)
- Type: `Unsupported("vector(768)")` — Prisma has no native vector type
- Nullable: Yes (`?`) — chunks can exist without embeddings (embedding is generated asynchronously)
- **NO vector index exists** — all similarity searches currently do sequential scans

### Embedding Pipeline (src/lib/embeddings.ts)

```
User query → generateEmbedding() → validateEmbedding() → raw SQL similarity search
                    │
                    ├── Primary: vLLM /v1/embeddings endpoint (EMBEDDING_MODEL env var)
                    └── Fallback: hashEmbed() — deterministic trigram hash (dev/testing only)
```

**Constants:**
- `EMBED_DIM = 768` — embedding vector dimensions
- `TOP_K = 5` — default number of results returned
- Input truncation: `text.slice(0, 8000)` characters before embedding

**Embedding generation** (`generateEmbedding`):
1. Checks for `EMBEDDING_MODEL` env var
2. If set: calls vLLM at `VLLM_BASE_URL/embeddings` (default: `http://localhost:8000/v1`)
3. If not set or fails: falls back to `hashEmbed()` — a character trigram frequency vector, L2-normalized

**Validation** (`validateEmbedding`):
- Checks array length === 768
- Checks every value is a finite number (blocks NaN/Infinity injection)

### Features Using Embeddings

| Feature | How Embeddings Are Used |
|---|---|
| **Agent Knowledge (RAG)** | Each agent's knowledge chunks are embedded. When a user chats with an agent, the query is embedded and matched against that agent's chunks via cosine similarity. Top-K results are injected into the system prompt as `<reference_knowledge>`. |
| **Agent Seeding** | `src/lib/agent-seed.ts` creates knowledge chunks and calls `indexKnowledgeChunk()` to generate and store embeddings for each chunk. |

**Not yet using embeddings** (but planned per Cardinal's research seeds):
- Chat context / conversation memory
- Semantic caching
- User behavior / preference embeddings
- Cross-agent search

### Raw SQL Operations (all in src/lib/embeddings.ts)

**Write — Indexing a chunk:**
```sql
UPDATE "AgentKnowledgeChunk" SET embedding = $1::vector WHERE id = $2
```
Called via `db.$queryRawUnsafe()` with the vector as a string `[0.1,0.2,...]` cast to `::vector`.

**Read — Similarity search:**
```sql
SELECT title, content, 1 - (embedding <=> $1::vector) as score
FROM "AgentKnowledgeChunk"
WHERE "agentId" = $2 AND embedding IS NOT NULL
ORDER BY embedding <=> $1::vector
LIMIT $3
```

**Distance function**: `<=>` (cosine distance). Score is computed as `1 - cosine_distance` so higher = more similar.

**Relevance threshold**: Results with `score <= 0.1` are filtered out in application code (`buildRagContext`).

---

## Conventions & Standards

### Distance Operators in pgvector

| Operator | Distance Metric | Use Case | Index Ops Class |
|---|---|---|---|
| `<=>` | Cosine distance | **Used by Stone AI** — best for normalized text embeddings | `vector_cosine_ops` |
| `<->` | L2 (Euclidean) distance | Image embeddings, spatial data | `vector_l2_ops` |
| `<#>` | Inner product (negative) | When vectors are already normalized (equivalent to cosine) | `vector_ip_ops` |

Stone AI uses cosine distance exclusively. All indexes should use `vector_cosine_ops`.

### Vector String Format
Vectors are passed as PostgreSQL string literals: `[0.1,0.2,...,0.n]` with explicit `::vector` cast. This is the only way to interact with pgvector through Prisma's `$queryRawUnsafe`.

### Embedding Model Consistency
The schema is hardcoded to `vector(768)`. If the embedding model changes dimensions, you must:
1. Update `EMBED_DIM` in `embeddings.ts`
2. Alter the column: `ALTER TABLE "AgentKnowledgeChunk" ALTER COLUMN embedding TYPE vector(NEW_DIM)`
3. Re-embed ALL existing chunks (old embeddings are incompatible)
4. Rebuild any vector indexes

---

## Indexing Strategies

### Current State: NO INDEX (Sequential Scan)
Every similarity query scans all rows where `agentId` matches and `embedding IS NOT NULL`. This is acceptable at current scale (~40 agents, likely hundreds of chunks total) but will not scale.

### When to Add an Index

| Row Count (with embeddings) | Action |
|---|---|
| < 1,000 | Sequential scan is fine. No index needed. |
| 1,000 - 10,000 | Add HNSW index. Noticeable query improvement. |
| 10,000 - 100,000 | HNSW required. Consider partitioning by agentId. |
| 100,000+ | HNSW with partitioning, or IVFFlat for cold/archival data. |

### HNSW (Hierarchical Navigable Small World) — Recommended

**Best for Stone AI because:**
- No training step required (works immediately after creation)
- Handles inserts without rebuild (critical for dynamic knowledge base)
- 99%+ recall at reasonable speed
- Neon supports HNSW natively

```sql
-- Create HNSW index (run CONCURRENTLY to avoid locking)
CREATE INDEX CONCURRENTLY idx_knowledge_embedding_hnsw
ON "AgentKnowledgeChunk"
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Tune search quality vs speed at query time
SET hnsw.ef_search = 40;  -- Default 40. Higher = better recall, slower.
```

**HNSW Parameters:**
| Parameter | Default | Recommendation | Effect |
|---|---|---|---|
| `m` | 16 | 16 (keep default) | Max connections per node. Higher = better recall, more memory |
| `ef_construction` | 64 | 64-128 | Build-time search width. Higher = better index quality, slower build |
| `ef_search` | 40 | 40-100 (set per query) | Query-time search width. Higher = better recall, slower query |

### IVFFlat (Inverted File with Flat Compression)

**Use only when:**
- Data is mostly static (rare inserts)
- Memory is constrained
- You have 100K+ vectors and need cheaper storage

```sql
-- Create IVFFlat index
CREATE INDEX CONCURRENTLY idx_knowledge_embedding_ivfflat
ON "AgentKnowledgeChunk"
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);  -- Set to sqrt(row_count)

-- Tune at query time
SET ivfflat.probes = 10;  -- Higher = better recall, slower
```

**IVFFlat gotcha**: Must REBUILD after significant data changes (`REINDEX INDEX idx_knowledge_embedding_ivfflat`). HNSW does not have this requirement.

### HNSW vs IVFFlat Decision Matrix

| Factor | HNSW | IVFFlat |
|---|---|---|
| Build time | Slower | Faster |
| Query speed | Faster | Good |
| Recall accuracy | 99%+ | 95-99% |
| Memory usage | Higher | Lower |
| Handles inserts | Yes (no rebuild) | Needs rebuild |
| Best for | Dynamic data (Stone AI) | Static/archival data |

---

## Query Optimization

### Current Query Analysis

The main similarity query:
```sql
SELECT title, content, 1 - (embedding <=> $1::vector) as score
FROM "AgentKnowledgeChunk"
WHERE "agentId" = $2 AND embedding IS NOT NULL
ORDER BY embedding <=> $1::vector
LIMIT 5
```

**Optimization opportunities:**

1. **Add the HNSW index** (biggest win — eliminates sequential scan)

2. **Partial index** — only index non-null embeddings:
   ```sql
   CREATE INDEX CONCURRENTLY idx_knowledge_embedding_hnsw
   ON "AgentKnowledgeChunk"
   USING hnsw (embedding vector_cosine_ops)
   WITH (m = 16, ef_construction = 64)
   WHERE embedding IS NOT NULL;
   ```

3. **Pre-filter by agentId** — pgvector 0.7+ supports filtered searches, but the planner may not always use the vector index with a WHERE clause on a different column. Two strategies:

   **Strategy A: Composite approach (partition by agentId)**
   If agents have large, distinct knowledge bases, create per-agent partitions.

   **Strategy B: Two-phase query (current approach is fine at scale)**
   The existing `WHERE "agentId" = $2` filters first, then sorts by distance. With a btree index on `agentId` and an HNSW index on `embedding`, PostgreSQL can combine them.

4. **Reduce dimensions if possible** — 768 dims is moderate. If switching to a model with 384 dims (e.g., all-MiniLM-L6-v2), queries and indexes get ~2x faster/smaller.

### Performance Tuning Tips

| Technique | Impact | When to Use |
|---|---|---|
| Add HNSW index | 10-100x faster queries | > 1K rows |
| Increase `ef_search` | Better recall, slower | Missing relevant results |
| Decrease `ef_search` | Faster, lower recall | Speed is priority |
| Filter score > threshold in app | Reduces noise | Already doing this (> 0.1) |
| Cache frequent query embeddings | Eliminates redundant embedding calls | Same queries repeated |
| Use connection pooling | Handles concurrent searches | Multiple users searching simultaneously |
| Limit content length in SELECT | Reduces I/O | Only need title for initial display |

### Monitoring Queries

```sql
-- Check if vector index is being used
EXPLAIN ANALYZE
SELECT title, content, 1 - (embedding <=> '[0.1,0.2,...]'::vector) as score
FROM "AgentKnowledgeChunk"
WHERE "agentId" = 'xxx' AND embedding IS NOT NULL
ORDER BY embedding <=> '[0.1,0.2,...]'::vector
LIMIT 5;
-- Look for "Index Scan using idx_knowledge_embedding_hnsw" vs "Seq Scan"

-- Count chunks with/without embeddings
SELECT
  COUNT(*) as total_chunks,
  COUNT(embedding) as with_embedding,
  COUNT(*) - COUNT(embedding) as without_embedding
FROM "AgentKnowledgeChunk";

-- Chunks per agent
SELECT a.name, COUNT(k.id) as chunks, COUNT(k.embedding) as indexed
FROM "Agent" a
LEFT JOIN "AgentKnowledgeChunk" k ON k."agentId" = a.id
GROUP BY a.name
ORDER BY chunks DESC;

-- Index size
SELECT pg_size_pretty(pg_relation_size('idx_knowledge_embedding_hnsw')) as index_size;

-- Table + index total size
SELECT pg_size_pretty(pg_total_relation_size('"AgentKnowledgeChunk"')) as total_size;
```

---

## DO / DON'T Rules

### DO
- Always validate embeddings before storage (check length === 768, all values finite) — already implemented in `validateEmbedding()`
- Always use parameterized `$queryRawUnsafe` with `$1::vector` cast — never string-interpolate vectors into SQL
- Always use `<=>` (cosine distance) for text embedding similarity — it is normalized and unit-agnostic
- Create HNSW indexes with `CONCURRENTLY` to avoid locking the table
- Monitor embedding coverage — chunks without embeddings are invisible to search
- Test embedding model changes on a Neon branch before production
- Keep `EMBED_DIM` constant in `embeddings.ts` synchronized with the `vector(N)` column definition
- Use the relevance threshold (currently `score > 0.1`) to avoid injecting irrelevant context into prompts

### DON'T
- Don't mix embedding models — vectors from different models are incompatible and will produce garbage similarity scores
- Don't change vector dimensions without re-embedding ALL existing data
- Don't use IVFFlat for a knowledge base that receives frequent inserts (use HNSW)
- Don't skip the `embedding IS NOT NULL` filter in queries — chunks may exist before their embedding is generated
- Don't store raw user input in embeddings without truncation — the current 8000-char limit exists for a reason
- Don't assume the hash-based fallback (`hashEmbed`) provides real semantic similarity — it is for dev/testing only
- Don't create vector indexes on small tables (< 1K rows) — the overhead exceeds the benefit
- Don't use `<->` (L2 distance) for text embeddings — cosine distance is standard for this use case

---

## Quick Reference

### Environment Variables
| Variable | Purpose | Default |
|---|---|---|
| `VLLM_BASE_URL` | vLLM server base URL | `http://localhost:8000/v1` |
| `EMBEDDING_MODEL` | Model name for vLLM embeddings endpoint | None (triggers hash fallback) |
| `DATABASE_URL` | PostgreSQL connection string (Neon) | Required |

### Key Functions (src/lib/embeddings.ts)
| Function | Purpose |
|---|---|
| `generateEmbedding(text)` | Generate 768-dim vector from text (vLLM or hash fallback) |
| `validateEmbedding(embedding)` | Validate vector length and finite values |
| `indexKnowledgeChunk(chunkId, content)` | Generate embedding and UPDATE the chunk row |
| `searchKnowledge(agentId, query, topK?)` | Cosine similarity search, returns scored results |
| `buildRagContext(agentId, query)` | Search + format results as prompt-injectable context |

### SQL Templates

```sql
-- Enable pgvector (already enabled on Neon)
CREATE EXTENSION IF NOT EXISTS vector;

-- Store an embedding
UPDATE "AgentKnowledgeChunk" SET embedding = $1::vector WHERE id = $2;

-- Similarity search (cosine)
SELECT title, content, 1 - (embedding <=> $1::vector) as score
FROM "AgentKnowledgeChunk"
WHERE "agentId" = $2 AND embedding IS NOT NULL
ORDER BY embedding <=> $1::vector
LIMIT 5;

-- Create HNSW index (recommended next step)
CREATE INDEX CONCURRENTLY idx_knowledge_embedding_hnsw
ON "AgentKnowledgeChunk"
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64)
WHERE embedding IS NOT NULL;

-- Check pgvector version
SELECT extversion FROM pg_extension WHERE extname = 'vector';
```

### Key File Paths
| File | Purpose |
|---|---|
| `prisma/schema.prisma` | Vector column definition (`Unsupported("vector(768)")`) |
| `src/lib/embeddings.ts` | All vector operations: embed, validate, index, search, RAG context |
| `src/lib/agent-seed.ts` | Seeds knowledge chunks and triggers embedding indexing |
| `src/lib/db.ts` | PrismaClient singleton (raw queries go through this) |
| `docs/chaos-seeds/CH-3-database-scaling-playbook.md` | Scaling reference for pgvector at high volume |

### Dimension Discrepancy Note
The schema and `embeddings.ts` use **768 dimensions** (nomic-embed-text). Some older seed scripts (`seeds-devops-marketing.ts`, `agent-knowledge-seeds.ts`) reference 1536 dimensions (OpenAI text-embedding-ada-002). The actual implementation is 768. If you encounter 1536 references in documentation or seed files, they are stale and should be corrected to 768.
