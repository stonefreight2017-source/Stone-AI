# RAG Pipeline Design for Stone AI Agent Memory

> Palace Knowledge Seed — AI/ML Operations
> Category: Engineering / Retrieval-Augmented Generation
> Version: 1.0 | Created: 2026-03-09
> Dependency: Integrates with `pgvector-semantic-search.md`, `prompt-engineering-patterns.md`

---

## Table of Contents

1. [RAG Architecture Overview](#rag-architecture-overview)
2. [Chunking Strategies](#chunking-strategies)
3. [Embedding Model Selection](#embedding-model-selection)
4. [Vector Storage with pgvector](#vector-storage-with-pgvector)
5. [Retrieval Patterns](#retrieval-patterns)
6. [Reranking Strategies](#reranking-strategies)
7. [Hybrid Search](#hybrid-search)
8. [Context Injection into Prompts](#context-injection-into-prompts)
9. [Handling Irrelevant Retrieval](#handling-irrelevant-retrieval)
10. [Agent Memory Types](#agent-memory-types)
11. [Implementation with Prisma + pgvector + Next.js](#implementation)
12. [Performance Optimization](#performance-optimization)
13. [Complete RAG Pipeline Code](#complete-rag-pipeline-code)

---

## RAG Architecture Overview

Retrieval-Augmented Generation (RAG) combines retrieval (finding relevant documents) with generation (LLM producing responses). For the Palace, RAG is the primary mechanism for giving agents accurate, up-to-date knowledge without retraining models.

### Why RAG for the Palace

- **Anti-hallucination**: Agents respond from retrieved facts, not parametric memory
- **Dynamic knowledge**: Update knowledge by updating documents, not retraining
- **Cost-effective**: Smaller models + good retrieval outperform larger models alone
- **Personalization**: Per-user memory without per-user fine-tuning
- **Auditability**: Every response can trace back to source documents

### Pipeline Architecture

```
User Query
    │
    ▼
┌─────────────────┐
│  Query Processing │ ← Expand, rephrase, extract entities
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────┐
│  Vector Search   │────▶│  BM25 Keyword    │
│  (Semantic)      │     │  Search          │
└────────┬────────┘     └────────┬─────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│         Reciprocal Rank Fusion          │
│         (Combine & Deduplicate)         │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Cross-Encoder Reranking         │
│         (Precision refinement)          │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         Context Assembly                │
│  (Format, truncate, inject into prompt) │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         LLM Generation                  │
│  (Qwen 2.5 / Claude with context)      │
└─────────────────────────────────────────┘
```

### Data Ingestion Pipeline

Before retrieval can happen, documents must be processed and stored:

```
Source Documents
    │
    ▼
┌─────────────────┐
│  Document Loader │ ← PDF, MD, HTML, code files, DB records
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Text Extraction │ ← Strip formatting, normalize
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Chunking      │ ← Split into retrievable units
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Embedding      │ ← Convert chunks to vectors
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  pgvector Store  │ ← Store vectors + metadata + original text
└─────────────────┘
```

---

## Chunking Strategies

Chunking is the most impactful decision in a RAG pipeline. Bad chunks produce bad retrieval regardless of everything else downstream.

### Fixed-Size Chunking

Split text into chunks of N tokens/characters with overlap.

```typescript
interface FixedChunkConfig {
  chunkSize: number;      // tokens per chunk
  chunkOverlap: number;   // overlapping tokens between adjacent chunks
}

const fixedSizeChunk = (
  text: string,
  config: FixedChunkConfig = { chunkSize: 512, chunkOverlap: 64 }
): string[] => {
  const words = text.split(/\s+/);
  const chunks: string[] = [];
  const stepSize = config.chunkSize - config.chunkOverlap;

  for (let i = 0; i < words.length; i += stepSize) {
    const chunk = words.slice(i, i + config.chunkSize).join(' ');
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
  }

  return chunks;
};
```

**Tradeoffs:**
| Aspect | Assessment |
|--------|-----------|
| Simplicity | Highest — easy to implement and debug |
| Semantic coherence | Low — splits mid-sentence, mid-paragraph |
| Retrieval quality | Medium — overlap helps but doesn't eliminate boundary issues |
| Best for | Large document ingestion, initial prototyping |

**Recommended sizes for Palace:**
- Short-form (chat history, messages): 256 tokens, 32 overlap
- Medium-form (documentation, guides): 512 tokens, 64 overlap
- Long-form (research, analysis): 1024 tokens, 128 overlap

### Semantic Chunking

Split at natural semantic boundaries (sentences, paragraphs, sections).

```typescript
const semanticChunk = (
  text: string,
  maxChunkTokens: number = 512
): string[] => {
  // Split into paragraphs first
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    const combinedTokens = estimateTokens(currentChunk + '\n\n' + paragraph);

    if (combinedTokens > maxChunkTokens && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = paragraph;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  // Handle oversized paragraphs by splitting at sentence boundaries
  return chunks.flatMap(chunk => {
    if (estimateTokens(chunk) > maxChunkTokens * 1.5) {
      return splitBySentence(chunk, maxChunkTokens);
    }
    return [chunk];
  });
};

const splitBySentence = (text: string, maxTokens: number): string[] => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if (estimateTokens(current + sentence) > maxTokens && current.length > 0) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }

  if (current.trim().length > 0) {
    chunks.push(current.trim());
  }

  return chunks;
};
```

**Tradeoffs:**
| Aspect | Assessment |
|--------|-----------|
| Simplicity | Medium — needs sentence/paragraph detection |
| Semantic coherence | High — respects natural boundaries |
| Retrieval quality | High — chunks are self-contained ideas |
| Best for | Documentation, knowledge bases, structured content |

### Code-Aware Chunking

For code files, chunk at function/class/module boundaries.

```typescript
const codeChunk = (
  code: string,
  language: 'typescript' | 'python' | 'sql',
  maxChunkTokens: number = 1024
): CodeChunk[] => {
  const chunks: CodeChunk[] = [];

  // TypeScript: split at export/function/class/interface boundaries
  if (language === 'typescript') {
    const patterns = [
      /^export\s+(default\s+)?(async\s+)?function\s+/m,
      /^export\s+(default\s+)?class\s+/m,
      /^export\s+(default\s+)?interface\s+/m,
      /^export\s+const\s+\w+\s*=/m,
      /^(async\s+)?function\s+/m,
      /^class\s+/m,
    ];

    const sections = splitByPatterns(code, patterns);

    for (const section of sections) {
      if (estimateTokens(section.content) <= maxChunkTokens) {
        chunks.push({
          content: section.content,
          type: section.type,
          startLine: section.startLine,
          endLine: section.endLine,
        });
      } else {
        // Oversized function — include signature + first N lines
        const lines = section.content.split('\n');
        const truncated = lines.slice(0, 50).join('\n') + '\n// ... truncated';
        chunks.push({
          content: truncated,
          type: section.type,
          startLine: section.startLine,
          endLine: section.startLine + 50,
          truncated: true,
        });
      }
    }
  }

  return chunks;
};
```

### Hierarchical Chunking

Create parent-child chunk relationships for multi-resolution retrieval.

```typescript
interface HierarchicalChunk {
  id: string;
  parentId: string | null;
  level: 'document' | 'section' | 'paragraph' | 'sentence';
  content: string;
  summary: string;       // LLM-generated summary of this chunk
  children: string[];    // child chunk IDs
  metadata: ChunkMetadata;
}

const hierarchicalChunk = async (
  document: Document
): Promise<HierarchicalChunk[]> => {
  const chunks: HierarchicalChunk[] = [];

  // Level 0: Document summary
  const docSummary = await summarize(document.content, 200); // 200 token summary
  const docChunk: HierarchicalChunk = {
    id: `doc-${document.id}`,
    parentId: null,
    level: 'document',
    content: document.content,
    summary: docSummary,
    children: [],
    metadata: { source: document.source, createdAt: document.createdAt },
  };
  chunks.push(docChunk);

  // Level 1: Sections (by headings or major breaks)
  const sections = splitBySections(document.content);
  for (const [i, section] of sections.entries()) {
    const sectionId = `sec-${document.id}-${i}`;
    docChunk.children.push(sectionId);

    const sectionSummary = await summarize(section.content, 100);
    const sectionChunk: HierarchicalChunk = {
      id: sectionId,
      parentId: docChunk.id,
      level: 'section',
      content: section.content,
      summary: sectionSummary,
      children: [],
      metadata: { ...docChunk.metadata, heading: section.heading },
    };
    chunks.push(sectionChunk);

    // Level 2: Paragraphs
    const paragraphs = section.content.split(/\n\n+/);
    for (const [j, paragraph] of paragraphs.entries()) {
      if (paragraph.trim().length < 20) continue; // Skip tiny fragments
      const paraId = `para-${document.id}-${i}-${j}`;
      sectionChunk.children.push(paraId);

      chunks.push({
        id: paraId,
        parentId: sectionId,
        level: 'paragraph',
        content: paragraph,
        summary: paragraph.slice(0, 100), // First 100 chars as quick summary
        children: [],
        metadata: sectionChunk.metadata,
      });
    }
  }

  return chunks;
};
```

**When to use hierarchical chunking:**
- Large knowledge bases with structured documents
- Queries that need both overview and detail
- When you want to retrieve a paragraph but show surrounding section context

### Chunking Strategy Selection Guide

| Content Type | Recommended Strategy | Chunk Size | Overlap |
|-------------|---------------------|-----------|---------|
| Chat messages | Fixed-size | 256 tokens | 32 |
| Documentation | Semantic | 512 tokens | N/A (natural boundaries) |
| Code files | Code-aware | 1024 tokens | N/A (function boundaries) |
| Research reports | Hierarchical | Multi-level | N/A |
| API specs | Semantic | 256 tokens | N/A |
| User feedback | Sentence-level | 128 tokens | 0 |

---

## Embedding Model Selection

Embedding models convert text chunks into dense vectors. The choice of model affects retrieval quality, speed, and infrastructure.

### Local Models (vLLM / Palace Infrastructure)

**GTE-Base (thenlper/gte-base)**
- Dimensions: 768
- Max tokens: 512
- Performance: Strong general-purpose, good for code
- Size: ~110M params
- Speed: Fast on CPU, very fast on GPU
- **Palace recommendation**: Primary embedding model for local deployment

```typescript
// Using with Hugging Face transformers via API
const embedWithGTE = async (texts: string[]): Promise<number[][]> => {
  const response = await fetch('http://localhost:8001/embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'thenlper/gte-base',
      input: texts,
    }),
  });

  const data = await response.json();
  return data.embeddings;
};
```

**Nomic Embed (nomic-ai/nomic-embed-text-v1.5)**
- Dimensions: 768 (configurable: 64, 128, 256, 512, 768)
- Max tokens: 8192 (long context!)
- Performance: Excellent for documents, slightly behind on code
- Size: ~137M params
- Special: Supports Matryoshka embeddings (variable dimensions)
- **Palace recommendation**: Best for long documents and research content

```typescript
// Nomic with Matryoshka — use smaller dimensions for speed, larger for accuracy
const embedWithNomic = async (
  texts: string[],
  dimensions: 64 | 128 | 256 | 512 | 768 = 768
): Promise<number[][]> => {
  const response = await fetch('http://localhost:8001/embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'nomic-ai/nomic-embed-text-v1.5',
      input: texts.map(t => `search_document: ${t}`), // Nomic uses prefixes
      dimensions,
    }),
  });

  const data = await response.json();
  return data.embeddings;
};
```

### Cloud Models

**OpenAI text-embedding-3-small**
- Dimensions: 1536 (configurable down to 256)
- Max tokens: 8191
- Performance: Strong across all domains
- Cost: $0.02 per 1M tokens
- **Palace recommendation**: Cloud fallback when local is unavailable

```typescript
import OpenAI from 'openai';

const openai = new OpenAI();

const embedWithOpenAI = async (
  texts: string[],
  dimensions: number = 1536
): Promise<number[][]> => {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
    dimensions,
  });

  return response.data.map(d => d.embedding);
};
```

### Model Comparison Matrix

| Model | Dims | Max Tokens | Speed | Quality | Cost | Best For |
|-------|------|-----------|-------|---------|------|----------|
| GTE-Base | 768 | 512 | Fast | Good | Free (local) | General purpose, code |
| Nomic v1.5 | 64-768 | 8192 | Medium | Great | Free (local) | Long documents |
| text-embedding-3-small | 256-1536 | 8191 | Fast (API) | Great | $0.02/1M | Cloud fallback |

### Embedding Model Selection for Palace

```typescript
type EmbeddingProvider = 'local-gte' | 'local-nomic' | 'openai';

const selectEmbeddingModel = (config: {
  contentType: 'code' | 'documentation' | 'chat' | 'research';
  averageChunkLength: number; // in tokens
  isLocalAvailable: boolean;
}): EmbeddingProvider => {
  // Always prefer local when available
  if (config.isLocalAvailable) {
    // Long content → Nomic (8K context)
    if (config.averageChunkLength > 512) return 'local-nomic';
    // Code → GTE (better code understanding)
    if (config.contentType === 'code') return 'local-gte';
    // Default → GTE (faster)
    return 'local-gte';
  }

  // Cloud fallback
  return 'openai';
};
```

---

## Vector Storage with pgvector

The Palace already uses PostgreSQL 16 with pgvector. This section covers schema design and query patterns specific to RAG.

> Cross-reference: `pgvector-semantic-search.md` for foundational pgvector operations.

### Schema Design

```sql
-- Core embeddings table
CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chunk_id TEXT NOT NULL UNIQUE,
  document_id TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  embedding vector(768) NOT NULL,  -- Match your embedding model dimensions
  metadata JSONB NOT NULL DEFAULT '{}',

  -- Chunk hierarchy
  parent_chunk_id TEXT REFERENCES document_embeddings(chunk_id),
  chunk_level TEXT NOT NULL DEFAULT 'paragraph',  -- document, section, paragraph

  -- Search optimization
  content_tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,

  -- Tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Scoping
  agent_domain TEXT,  -- Which agent domain this belongs to
  user_id TEXT,       -- For per-user memory (NULL = shared knowledge)
  tier TEXT            -- Minimum tier to access this content
);

-- Vector similarity index (IVFFlat for large datasets)
CREATE INDEX idx_embeddings_vector ON document_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Full-text search index for hybrid search
CREATE INDEX idx_embeddings_tsv ON document_embeddings USING gin(content_tsv);

-- Metadata and scoping indexes
CREATE INDEX idx_embeddings_domain ON document_embeddings(agent_domain);
CREATE INDEX idx_embeddings_user ON document_embeddings(user_id);
CREATE INDEX idx_embeddings_document ON document_embeddings(document_id);
CREATE INDEX idx_embeddings_level ON document_embeddings(chunk_level);
```

### Prisma Schema

```prisma
model DocumentEmbedding {
  id            String   @id @default(uuid())
  chunkId       String   @unique @map("chunk_id")
  documentId    String   @map("document_id")
  content       String
  summary       String?
  embedding     Unsupported("vector(768)")
  metadata      Json     @default("{}")

  parentChunkId String?  @map("parent_chunk_id")
  parent        DocumentEmbedding? @relation("ChunkHierarchy", fields: [parentChunkId], references: [chunkId])
  children      DocumentEmbedding[] @relation("ChunkHierarchy")
  chunkLevel    String   @default("paragraph") @map("chunk_level")

  agentDomain   String?  @map("agent_domain")
  userId        String?  @map("user_id")
  tier          String?

  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  @@index([agentDomain])
  @@index([userId])
  @@index([documentId])
  @@map("document_embeddings")
}
```

### Ingestion

```typescript
const ingestDocument = async (
  document: {
    id: string;
    content: string;
    source: string;
    agentDomain?: string;
    userId?: string;
  },
  chunkingStrategy: 'fixed' | 'semantic' | 'code' | 'hierarchical' = 'semantic'
): Promise<number> => {
  // 1. Chunk the document
  let chunks: { content: string; metadata: Record<string, unknown> }[];

  switch (chunkingStrategy) {
    case 'fixed':
      chunks = fixedSizeChunk(document.content, { chunkSize: 512, chunkOverlap: 64 })
        .map(c => ({ content: c, metadata: {} }));
      break;
    case 'semantic':
      chunks = semanticChunk(document.content, 512)
        .map(c => ({ content: c, metadata: {} }));
      break;
    case 'code':
      chunks = codeChunk(document.content, 'typescript', 1024)
        .map(c => ({ content: c.content, metadata: { type: c.type, startLine: c.startLine } }));
      break;
    case 'hierarchical':
      const hierarchical = await hierarchicalChunk(document);
      chunks = hierarchical.map(c => ({
        content: c.content,
        metadata: { level: c.level, summary: c.summary, parentId: c.parentId },
      }));
      break;
  }

  // 2. Generate embeddings in batches
  const batchSize = 32;
  let totalIngested = 0;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const embeddings = await embedTexts(batch.map(c => c.content));

    // 3. Store in pgvector
    const values = batch.map((chunk, j) => ({
      chunkId: `${document.id}-${i + j}`,
      documentId: document.id,
      content: chunk.content,
      embedding: embeddings[j],
      metadata: { ...chunk.metadata, source: document.source },
      agentDomain: document.agentDomain,
      userId: document.userId,
    }));

    // Use raw SQL for vector insertion (Prisma doesn't natively support vector type)
    for (const val of values) {
      await prisma.$executeRaw`
        INSERT INTO document_embeddings (chunk_id, document_id, content, embedding, metadata, agent_domain, user_id)
        VALUES (
          ${val.chunkId},
          ${val.documentId},
          ${val.content},
          ${val.embedding}::vector,
          ${val.metadata}::jsonb,
          ${val.agentDomain},
          ${val.userId}
        )
        ON CONFLICT (chunk_id) DO UPDATE SET
          content = EXCLUDED.content,
          embedding = EXCLUDED.embedding,
          metadata = EXCLUDED.metadata,
          updated_at = NOW()
      `;
    }

    totalIngested += batch.length;
  }

  return totalIngested;
};
```

---

## Retrieval Patterns

### Top-K Retrieval

The simplest pattern: find the K most similar chunks to the query.

```typescript
const topKRetrieval = async (
  queryEmbedding: number[],
  options: {
    k: number;
    agentDomain?: string;
    userId?: string;
    chunkLevel?: string;
  }
): Promise<RetrievedChunk[]> => {
  const { k = 5, agentDomain, userId, chunkLevel } = options;

  const results = await prisma.$queryRaw<RetrievedChunk[]>`
    SELECT
      chunk_id,
      content,
      summary,
      metadata,
      chunk_level,
      1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
    FROM document_embeddings
    WHERE 1=1
      ${agentDomain ? Prisma.sql`AND agent_domain = ${agentDomain}` : Prisma.empty}
      ${userId ? Prisma.sql`AND (user_id = ${userId} OR user_id IS NULL)` : Prisma.empty}
      ${chunkLevel ? Prisma.sql`AND chunk_level = ${chunkLevel}` : Prisma.empty}
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT ${k}
  `;

  return results;
};
```

### Maximum Marginal Relevance (MMR)

MMR balances relevance with diversity — prevents retrieving 5 chunks that all say the same thing.

```typescript
const mmrRetrieval = async (
  queryEmbedding: number[],
  options: {
    k: number;           // Final number of results
    fetchK: number;      // Candidates to consider (fetch more, select diverse subset)
    lambda: number;      // 0.0 = max diversity, 1.0 = max relevance. Default 0.5
    agentDomain?: string;
    userId?: string;
  }
): Promise<RetrievedChunk[]> => {
  const { k = 5, fetchK = 20, lambda = 0.5, agentDomain, userId } = options;

  // Step 1: Get top fetchK candidates by similarity
  const candidates = await topKRetrieval(queryEmbedding, {
    k: fetchK,
    agentDomain,
    userId,
  });

  if (candidates.length === 0) return [];

  // Step 2: MMR selection
  const selected: RetrievedChunk[] = [];
  const remaining = [...candidates];

  // Select first by pure relevance
  selected.push(remaining.shift()!);

  while (selected.length < k && remaining.length > 0) {
    let bestScore = -Infinity;
    let bestIndex = 0;

    for (let i = 0; i < remaining.length; i++) {
      const relevance = remaining[i].similarity;

      // Maximum similarity to any already-selected chunk
      const maxSimilarityToSelected = Math.max(
        ...selected.map(s =>
          cosineSimilarity(
            remaining[i].embedding,
            s.embedding
          )
        )
      );

      // MMR score: balance relevance and diversity
      const mmrScore = lambda * relevance - (1 - lambda) * maxSimilarityToSelected;

      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIndex = i;
      }
    }

    selected.push(remaining.splice(bestIndex, 1)[0]);
  }

  return selected;
};
```

**When to use MMR:**
- Agent queries that could match many similar documents
- Knowledge bases with redundant content
- When you want comprehensive coverage of a topic, not just the closest match

### Threshold Filtering

Only return chunks above a minimum similarity score.

```typescript
const thresholdRetrieval = async (
  queryEmbedding: number[],
  options: {
    k: number;
    threshold: number;  // Minimum similarity (0.0 to 1.0)
    agentDomain?: string;
  }
): Promise<RetrievedChunk[]> => {
  const { k = 5, threshold = 0.65, agentDomain } = options;

  const results = await prisma.$queryRaw<RetrievedChunk[]>`
    SELECT
      chunk_id,
      content,
      metadata,
      1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
    FROM document_embeddings
    WHERE 1 - (embedding <=> ${queryEmbedding}::vector) >= ${threshold}
      ${agentDomain ? Prisma.sql`AND agent_domain = ${agentDomain}` : Prisma.empty}
    ORDER BY embedding <=> ${queryEmbedding}::vector
    LIMIT ${k}
  `;

  return results;
};
```

**Threshold guidelines:**
| Threshold | Meaning | Use Case |
|-----------|---------|----------|
| 0.85+ | Very high confidence match | Exact answer retrieval |
| 0.70-0.85 | Strong relevance | Standard knowledge retrieval |
| 0.55-0.70 | Moderate relevance | Broad topic exploration |
| Below 0.55 | Weak match | Probably irrelevant — don't use |

### Parent-Child Retrieval

Retrieve at paragraph level but return the parent section for context.

```typescript
const parentChildRetrieval = async (
  queryEmbedding: number[],
  options: { k: number; agentDomain?: string }
): Promise<RetrievedChunkWithContext[]> => {
  // Retrieve at paragraph level (most specific)
  const paragraphs = await topKRetrieval(queryEmbedding, {
    ...options,
    chunkLevel: 'paragraph',
  });

  // For each matched paragraph, fetch its parent section
  const results: RetrievedChunkWithContext[] = [];

  for (const para of paragraphs) {
    const parentId = (para.metadata as any)?.parentId;

    let parentContent: string | null = null;
    if (parentId) {
      const parent = await prisma.$queryRaw<{ content: string }[]>`
        SELECT content FROM document_embeddings WHERE chunk_id = ${parentId}
      `;
      parentContent = parent[0]?.content ?? null;
    }

    results.push({
      ...para,
      parentContext: parentContent,
    });
  }

  return results;
};
```

---

## Reranking Strategies

Initial retrieval (vector search) is fast but imprecise. Reranking uses a more powerful model to re-score candidates for precision.

### Cross-Encoder Reranking

Cross-encoders process query-document pairs jointly, producing more accurate relevance scores than embedding similarity.

```typescript
interface RerankResult {
  chunk: RetrievedChunk;
  rerankScore: number;
}

const crossEncoderRerank = async (
  query: string,
  candidates: RetrievedChunk[],
  topN: number = 5
): Promise<RerankResult[]> => {
  // Option A: Local cross-encoder model
  const response = await fetch('http://localhost:8002/rerank', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'cross-encoder/ms-marco-MiniLM-L-6-v2',
      query,
      documents: candidates.map(c => c.content),
    }),
  });

  const scores: number[] = await response.json();

  // Sort by rerank score and take top N
  return candidates
    .map((chunk, i) => ({ chunk, rerankScore: scores[i] }))
    .sort((a, b) => b.rerankScore - a.rerankScore)
    .slice(0, topN);
};
```

### Cohere Rerank (Cloud Option)

```typescript
const cohereRerank = async (
  query: string,
  candidates: RetrievedChunk[],
  topN: number = 5
): Promise<RerankResult[]> => {
  const response = await fetch('https://api.cohere.ai/v1/rerank', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.COHERE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'rerank-english-v3.0',
      query,
      documents: candidates.map(c => c.content),
      top_n: topN,
    }),
  });

  const data = await response.json();

  return data.results.map((r: any) => ({
    chunk: candidates[r.index],
    rerankScore: r.relevance_score,
  }));
};
```

### LLM-as-Reranker (Zero-Cost Local Option)

Use Qwen 2.5 itself to score relevance — no additional model needed.

```typescript
const llmRerank = async (
  query: string,
  candidates: RetrievedChunk[],
  topN: number = 5
): Promise<RerankResult[]> => {
  const scored: RerankResult[] = [];

  // Process in parallel batches
  const batchSize = 5;
  for (let i = 0; i < candidates.length; i += batchSize) {
    const batch = candidates.slice(i, i + batchSize);
    const promises = batch.map(async (chunk) => {
      const prompt = `On a scale of 0 to 10, how relevant is this document to the query?

Query: ${query}

Document: ${chunk.content.slice(0, 500)}

Respond with ONLY a number from 0 to 10.`;

      const response = await callLLM(prompt, { temperature: 0, maxTokens: 5 });
      const score = parseFloat(response.trim()) || 0;
      return { chunk, rerankScore: score / 10 };
    });

    scored.push(...await Promise.all(promises));
  }

  return scored
    .sort((a, b) => b.rerankScore - a.rerankScore)
    .slice(0, topN);
};
```

**Reranking strategy selection:**
| Strategy | Latency | Quality | Cost | Best For |
|----------|---------|---------|------|----------|
| Cross-encoder (local) | ~50ms | High | Free | Default recommendation |
| Cohere Rerank | ~200ms | Very High | $1/1K queries | Cloud deployments |
| LLM-as-reranker | ~500ms | Good | Free (local) | No additional model budget |
| No reranking | 0ms | Baseline | Free | Simple queries, fast responses |

---

## Hybrid Search

Combine semantic (vector) search with keyword (BM25) search for best-of-both-worlds retrieval.

### Why Hybrid

- **Vector search** excels at: semantic meaning, paraphrases, conceptual similarity
- **Vector search** struggles with: exact terms, acronyms, proper nouns, code identifiers
- **BM25 keyword search** excels at: exact matches, rare terms, proper nouns
- **BM25 keyword search** struggles with: synonyms, conceptual queries

Hybrid search covers both weaknesses.

### Reciprocal Rank Fusion (RRF)

RRF combines ranked lists from different retrieval methods into a single ranking.

```typescript
const hybridSearch = async (
  query: string,
  queryEmbedding: number[],
  options: {
    k: number;
    agentDomain?: string;
    userId?: string;
    vectorWeight?: number;  // 0.0-1.0, default 0.6
  }
): Promise<RetrievedChunk[]> => {
  const { k = 5, agentDomain, userId, vectorWeight = 0.6 } = options;
  const keywordWeight = 1 - vectorWeight;
  const rrfK = 60; // RRF constant — standard value

  // Run both searches in parallel
  const [vectorResults, keywordResults] = await Promise.all([
    // Semantic search
    prisma.$queryRaw<{ chunk_id: string; content: string; metadata: any; rank: number }[]>`
      SELECT
        chunk_id, content, metadata,
        ROW_NUMBER() OVER (ORDER BY embedding <=> ${queryEmbedding}::vector) AS rank
      FROM document_embeddings
      WHERE 1=1
        ${agentDomain ? Prisma.sql`AND agent_domain = ${agentDomain}` : Prisma.empty}
        ${userId ? Prisma.sql`AND (user_id = ${userId} OR user_id IS NULL)` : Prisma.empty}
      ORDER BY embedding <=> ${queryEmbedding}::vector
      LIMIT ${k * 3}
    `,

    // Full-text keyword search
    prisma.$queryRaw<{ chunk_id: string; content: string; metadata: any; rank: number }[]>`
      SELECT
        chunk_id, content, metadata,
        ROW_NUMBER() OVER (ORDER BY ts_rank(content_tsv, plainto_tsquery('english', ${query})) DESC) AS rank
      FROM document_embeddings
      WHERE content_tsv @@ plainto_tsquery('english', ${query})
        ${agentDomain ? Prisma.sql`AND agent_domain = ${agentDomain}` : Prisma.empty}
        ${userId ? Prisma.sql`AND (user_id = ${userId} OR user_id IS NULL)` : Prisma.empty}
      ORDER BY ts_rank(content_tsv, plainto_tsquery('english', ${query})) DESC
      LIMIT ${k * 3}
    `,
  ]);

  // RRF fusion
  const scores = new Map<string, {
    chunk: { chunk_id: string; content: string; metadata: any };
    score: number;
  }>();

  for (const result of vectorResults) {
    const rrfScore = vectorWeight * (1 / (rrfK + result.rank));
    scores.set(result.chunk_id, {
      chunk: result,
      score: rrfScore,
    });
  }

  for (const result of keywordResults) {
    const rrfScore = keywordWeight * (1 / (rrfK + result.rank));
    const existing = scores.get(result.chunk_id);
    if (existing) {
      existing.score += rrfScore; // Boost chunks found by both methods
    } else {
      scores.set(result.chunk_id, { chunk: result, score: rrfScore });
    }
  }

  // Sort by combined RRF score and return top-k
  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(s => ({
      chunkId: s.chunk.chunk_id,
      content: s.chunk.content,
      metadata: s.chunk.metadata,
      similarity: s.score, // Combined RRF score
    }));
};
```

### Weight Tuning Guide

| Query Type | Vector Weight | Keyword Weight | Reasoning |
|-----------|--------------|----------------|-----------|
| Conceptual ("how does auth work?") | 0.8 | 0.2 | Meaning > exact terms |
| Exact ("ClerkProvider error") | 0.3 | 0.7 | Exact term matching critical |
| Mixed ("fix the Prisma migration bug") | 0.6 | 0.4 | Balance of both |
| Code ("useEffect cleanup function") | 0.4 | 0.6 | Code identifiers matter |

---

## Context Injection into Prompts

How retrieved context is formatted and injected into the prompt dramatically affects generation quality.

### Context Formatting Patterns

**Simple numbered list:**
```typescript
const formatContextSimple = (chunks: RetrievedChunk[]): string => {
  return chunks
    .map((c, i) => `[${i + 1}] ${c.content}`)
    .join('\n\n---\n\n');
};
```

**With source attribution:**
```typescript
const formatContextWithSources = (chunks: RetrievedChunk[]): string => {
  return chunks
    .map((c, i) => {
      const source = (c.metadata as any)?.source || 'Unknown';
      return `[Source ${i + 1}: ${source}]\n${c.content}`;
    })
    .join('\n\n---\n\n');
};
```

**Structured XML format (best for Qwen 2.5):**
```typescript
const formatContextXML = (chunks: RetrievedChunk[]): string => {
  return `<retrieved_context>
${chunks.map((c, i) => `
  <document id="${i + 1}" source="${(c.metadata as any)?.source || 'unknown'}" relevance="${c.similarity?.toFixed(2)}">
    ${c.content}
  </document>
`).join('')}
</retrieved_context>`;
};
```

### Injection Template

```typescript
const buildRAGPrompt = (
  systemPrompt: string,
  context: RetrievedChunk[],
  userMessage: string,
  contextConfidence: 'high' | 'medium' | 'low'
): Message[] => {
  const contextBlock = formatContextXML(context);

  const groundingInstruction = contextConfidence === 'high'
    ? 'Answer using the retrieved context. Cite sources using [N] notation.'
    : contextConfidence === 'medium'
    ? 'Use the retrieved context if relevant. If the context doesn\'t fully answer the question, you may supplement with your knowledge but clearly distinguish between sourced and unsourced claims.'
    : 'The retrieved context may not be directly relevant. Use your best judgment. If you use context, cite it. If you rely on general knowledge, say so.';

  return [
    { role: 'system', content: systemPrompt },
    {
      role: 'system',
      content: `## Retrieved Context\n${contextBlock}\n\n## Grounding Instructions\n${groundingInstruction}`,
    },
    { role: 'user', content: userMessage },
  ];
};
```

---

## Handling Irrelevant Retrieval

Not every query has relevant documents in the knowledge base. Handling this gracefully prevents the model from forcing irrelevant context into its response.

### Confidence-Based Fallback

```typescript
const retrieveWithFallback = async (
  query: string,
  options: RetrievalOptions
): Promise<{ chunks: RetrievedChunk[]; confidence: 'high' | 'medium' | 'low' | 'none' }> => {
  const queryEmbedding = await embedText(query);
  const chunks = await thresholdRetrieval(queryEmbedding, {
    ...options,
    threshold: 0.55, // Low threshold to get candidates
  });

  if (chunks.length === 0) {
    return { chunks: [], confidence: 'none' };
  }

  const avgSimilarity = chunks.reduce((sum, c) => sum + (c.similarity || 0), 0) / chunks.length;
  const topSimilarity = chunks[0]?.similarity || 0;

  // Classify confidence
  let confidence: 'high' | 'medium' | 'low';
  if (topSimilarity >= 0.80 && avgSimilarity >= 0.70) {
    confidence = 'high';
  } else if (topSimilarity >= 0.65 && avgSimilarity >= 0.55) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  // Filter out low-relevance chunks for high/medium confidence
  const filtered = confidence === 'low'
    ? chunks.filter(c => (c.similarity || 0) >= 0.60)
    : chunks.filter(c => (c.similarity || 0) >= 0.55);

  return { chunks: filtered, confidence };
};
```

### Fallback Strategies

```typescript
const handleRetrievalResult = async (
  query: string,
  agentConfig: AgentConfig,
  retrievalResult: { chunks: RetrievedChunk[]; confidence: string }
): Promise<Message[]> => {
  switch (retrievalResult.confidence) {
    case 'high':
      // Full RAG — ground response entirely in context
      return buildRAGPrompt(agentConfig.systemPrompt, retrievalResult.chunks, query, 'high');

    case 'medium':
      // Partial RAG — use context but allow supplementation
      return buildRAGPrompt(agentConfig.systemPrompt, retrievalResult.chunks, query, 'medium');

    case 'low':
      // Minimal RAG — context available but low relevance
      return buildRAGPrompt(agentConfig.systemPrompt, retrievalResult.chunks, query, 'low');

    case 'none':
      // No RAG — pure generation with acknowledgment
      return [
        { role: 'system', content: agentConfig.systemPrompt },
        {
          role: 'system',
          content: 'No relevant context was found in the knowledge base for this query. Respond based on your training knowledge. If the question requires specific Palace/Stone AI knowledge that you don\'t have, say so clearly.',
        },
        { role: 'user', content: query },
      ];

    default:
      return buildRAGPrompt(agentConfig.systemPrompt, retrievalResult.chunks, query, 'low');
  }
};
```

---

## Agent Memory Types

Palace agents need different types of memory for different purposes.

### Episodic Memory (Conversation History)

What happened in this conversation and recent conversations.

```typescript
interface EpisodicMemory {
  conversationId: string;
  userId: string;
  agentId: number;
  messages: Message[];
  summary?: string;       // LLM-generated summary for old conversations
  keyFacts: string[];     // Extracted facts from conversation
  createdAt: Date;
  lastAccessedAt: Date;
}

const storeEpisodicMemory = async (
  conversation: Conversation,
  userId: string,
  agentId: number
): Promise<void> => {
  // Extract key facts from the conversation
  const keyFacts = await extractKeyFacts(conversation.messages);

  // Generate summary for long conversations
  const summary = conversation.messages.length > 20
    ? await summarizeConversation(conversation.messages)
    : undefined;

  // Store conversation embedding for retrieval
  const text = summary || conversation.messages.map(m => m.content).join('\n');
  const embedding = await embedText(text);

  await prisma.$executeRaw`
    INSERT INTO document_embeddings (chunk_id, document_id, content, summary, embedding, metadata, agent_domain, user_id, chunk_level)
    VALUES (
      ${`episodic-${conversation.id}`},
      ${`conv-${conversation.id}`},
      ${text},
      ${summary},
      ${embedding}::vector,
      ${JSON.stringify({ type: 'episodic', keyFacts, agentId, messageCount: conversation.messages.length })}::jsonb,
      ${`agent-${agentId}`},
      ${userId},
      'document'
    )
    ON CONFLICT (chunk_id) DO UPDATE SET
      content = EXCLUDED.content,
      summary = EXCLUDED.summary,
      embedding = EXCLUDED.embedding,
      metadata = EXCLUDED.metadata,
      updated_at = NOW()
  `;
};
```

### Semantic Memory (Facts and Knowledge)

What the agent knows — facts, preferences, domain knowledge.

```typescript
interface SemanticMemory {
  fact: string;
  confidence: number;
  source: string;          // Where this fact came from
  category: string;        // Domain category
  validUntil?: Date;       // For time-sensitive facts
  contradicts?: string[];  // IDs of facts this supersedes
}

const storeSemanticMemory = async (
  facts: SemanticMemory[],
  agentDomain: string,
  userId?: string
): Promise<void> => {
  for (const fact of facts) {
    const embedding = await embedText(fact.fact);

    // Check for contradictions with existing facts
    const existing = await thresholdRetrieval(embedding, {
      k: 3,
      threshold: 0.85, // Very high — nearly identical facts
      agentDomain,
    });

    // If highly similar fact exists, update rather than duplicate
    if (existing.length > 0 && existing[0].similarity! > 0.90) {
      await prisma.$executeRaw`
        UPDATE document_embeddings
        SET content = ${fact.fact},
            embedding = ${embedding}::vector,
            metadata = ${JSON.stringify({
              type: 'semantic',
              confidence: fact.confidence,
              source: fact.source,
              category: fact.category,
              validUntil: fact.validUntil,
            })}::jsonb,
            updated_at = NOW()
        WHERE chunk_id = ${existing[0].chunkId}
      `;
    } else {
      await prisma.$executeRaw`
        INSERT INTO document_embeddings (chunk_id, document_id, content, embedding, metadata, agent_domain, user_id, chunk_level)
        VALUES (
          ${`semantic-${crypto.randomUUID()}`},
          ${`facts-${agentDomain}`},
          ${fact.fact},
          ${embedding}::vector,
          ${JSON.stringify({
            type: 'semantic',
            confidence: fact.confidence,
            source: fact.source,
            category: fact.category,
            validUntil: fact.validUntil,
          })}::jsonb,
          ${agentDomain},
          ${userId},
          'paragraph'
        )
      `;
    }
  }
};
```

### Procedural Memory (How-To Knowledge)

How to do things — procedures, workflows, patterns that have worked before.

```typescript
interface ProceduralMemory {
  taskType: string;         // What kind of task
  procedure: string;        // Step-by-step procedure
  prerequisites: string[];  // What needs to be true before starting
  successCriteria: string;  // How to know it worked
  lastUsed: Date;
  successRate: number;      // 0.0 to 1.0 — tracked over time
  agentType: string;        // Which agent type uses this
}

const retrieveProceduralMemory = async (
  taskDescription: string,
  agentType: string,
  topK: number = 3
): Promise<ProceduralMemory[]> => {
  const embedding = await embedText(taskDescription);

  const results = await prisma.$queryRaw<any[]>`
    SELECT content, metadata,
      1 - (embedding <=> ${embedding}::vector) AS similarity
    FROM document_embeddings
    WHERE chunk_level = 'procedure'
      AND agent_domain = ${agentType}
      AND (metadata->>'successRate')::float >= 0.7
    ORDER BY embedding <=> ${embedding}::vector
    LIMIT ${topK}
  `;

  return results.map(r => ({
    ...JSON.parse(r.metadata),
    procedure: r.content,
  }));
};
```

### Memory Integration in Agent Prompts

```typescript
const buildMemoryAwarePrompt = async (
  agentConfig: AgentConfig,
  userId: string,
  currentQuery: string
): Promise<string> => {
  const queryEmbedding = await embedText(currentQuery);

  // Retrieve all three memory types in parallel
  const [episodic, semantic, procedural] = await Promise.all([
    // Recent conversations with this user
    topKRetrieval(queryEmbedding, {
      k: 3,
      agentDomain: `agent-${agentConfig.id}`,
      userId,
    }),

    // Relevant facts
    topKRetrieval(queryEmbedding, {
      k: 5,
      agentDomain: agentConfig.domain,
    }),

    // Relevant procedures
    retrieveProceduralMemory(currentQuery, agentConfig.type, 2),
  ]);

  return `
${agentConfig.systemPrompt}

## Your Memory

### Recent Context with This User
${episodic.map(e => e.content).join('\n---\n') || 'No previous interactions found.'}

### Relevant Knowledge
${semantic.map(s => `- ${s.content}`).join('\n') || 'No specific knowledge retrieved.'}

### Known Procedures
${procedural.map(p => `Task: ${p.taskType}\nSteps: ${p.procedure}\nSuccess rate: ${(p.successRate * 100).toFixed(0)}%`).join('\n---\n') || 'No relevant procedures found.'}
`.trim();
};
```

---

## Implementation

Complete Next.js API route implementation for the Palace RAG pipeline.

### API Route: `/api/rag/ingest`

```typescript
// src/app/api/rag/ingest/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { embedTexts } from '@/lib/embeddings';
import { semanticChunk } from '@/lib/chunking';
import { auth } from '@clerk/nextjs/server';

const IngestSchema = z.object({
  documentId: z.string().min(1),
  content: z.string().min(10),
  source: z.string().min(1),
  agentDomain: z.string().optional(),
  chunkingStrategy: z.enum(['fixed', 'semantic', 'code']).default('semantic'),
  metadata: z.record(z.unknown()).optional(),
}).strict();

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Admin-only endpoint
  const user = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!user?.isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = IngestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { documentId, content, source, agentDomain, chunkingStrategy, metadata } = parsed.data;

  try {
    // Chunk the content
    const chunks = semanticChunk(content, 512);

    // Generate embeddings in batches
    const batchSize = 32;
    let totalIngested = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const embeddings = await embedTexts(batch);

      for (let j = 0; j < batch.length; j++) {
        await prisma.$executeRaw`
          INSERT INTO document_embeddings (chunk_id, document_id, content, embedding, metadata, agent_domain, chunk_level)
          VALUES (
            ${`${documentId}-${i + j}`},
            ${documentId},
            ${batch[j]},
            ${embeddings[j]}::vector,
            ${JSON.stringify({ source, chunkIndex: i + j, ...metadata })}::jsonb,
            ${agentDomain},
            'paragraph'
          )
          ON CONFLICT (chunk_id) DO UPDATE SET
            content = EXCLUDED.content,
            embedding = EXCLUDED.embedding,
            metadata = EXCLUDED.metadata,
            updated_at = NOW()
        `;
        totalIngested++;
      }
    }

    return NextResponse.json({
      success: true,
      documentId,
      chunksIngested: totalIngested,
    });
  } catch (error) {
    console.error('Ingestion error:', error);
    return NextResponse.json({ error: 'Ingestion failed' }, { status: 500 });
  }
}
```

### API Route: `/api/rag/query`

```typescript
// src/app/api/rag/query/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { embedText } from '@/lib/embeddings';
import { auth } from '@clerk/nextjs/server';

const QuerySchema = z.object({
  query: z.string().min(1).max(2000),
  agentDomain: z.string().optional(),
  topK: z.number().int().min(1).max(20).default(5),
  threshold: z.number().min(0).max(1).default(0.65),
  searchType: z.enum(['vector', 'keyword', 'hybrid']).default('hybrid'),
  includeMetadata: z.boolean().default(true),
}).strict();

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = QuerySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { query, agentDomain, topK, threshold, searchType } = parsed.data;

  try {
    const queryEmbedding = await embedText(query);

    let results;

    switch (searchType) {
      case 'vector':
        results = await prisma.$queryRaw`
          SELECT chunk_id, content, metadata, chunk_level,
            1 - (embedding <=> ${queryEmbedding}::vector) AS similarity
          FROM document_embeddings
          WHERE 1 - (embedding <=> ${queryEmbedding}::vector) >= ${threshold}
            ${agentDomain ? Prisma.sql`AND agent_domain = ${agentDomain}` : Prisma.empty}
          ORDER BY embedding <=> ${queryEmbedding}::vector
          LIMIT ${topK}
        `;
        break;

      case 'keyword':
        results = await prisma.$queryRaw`
          SELECT chunk_id, content, metadata, chunk_level,
            ts_rank(content_tsv, plainto_tsquery('english', ${query})) AS similarity
          FROM document_embeddings
          WHERE content_tsv @@ plainto_tsquery('english', ${query})
            ${agentDomain ? Prisma.sql`AND agent_domain = ${agentDomain}` : Prisma.empty}
          ORDER BY ts_rank(content_tsv, plainto_tsquery('english', ${query})) DESC
          LIMIT ${topK}
        `;
        break;

      case 'hybrid':
      default:
        // Use the hybridSearch function from earlier in this document
        results = await hybridSearch(query, queryEmbedding, { k: topK, agentDomain });
        break;
    }

    return NextResponse.json({
      query,
      results,
      count: (results as any[]).length,
      searchType,
    });
  } catch (error) {
    console.error('Query error:', error);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }
}
```

---

## Performance Optimization

### Embedding Cache

Avoid re-embedding identical or near-identical queries.

```typescript
import { LRUCache } from 'lru-cache';

const embeddingCache = new LRUCache<string, number[]>({
  max: 10000,        // Cache up to 10K embeddings
  ttl: 1000 * 60 * 60, // 1 hour TTL
});

const cachedEmbed = async (text: string): Promise<number[]> => {
  // Normalize text for cache key
  const key = text.toLowerCase().trim().replace(/\s+/g, ' ');

  const cached = embeddingCache.get(key);
  if (cached) return cached;

  const embedding = await embedText(text);
  embeddingCache.set(key, embedding);
  return embedding;
};
```

### Batch Retrieval for Multi-Agent Dispatch

When dispatching to multiple agents, batch their context retrieval.

```typescript
const batchRetrieveForAgents = async (
  query: string,
  agentDomains: string[]
): Promise<Map<string, RetrievedChunk[]>> => {
  const queryEmbedding = await cachedEmbed(query);

  // Run all domain-specific retrievals in parallel
  const results = await Promise.all(
    agentDomains.map(async (domain) => ({
      domain,
      chunks: await thresholdRetrieval(queryEmbedding, {
        k: 5,
        threshold: 0.65,
        agentDomain: domain,
      }),
    }))
  );

  return new Map(results.map(r => [r.domain, r.chunks]));
};
```

### Index Maintenance

```sql
-- Rebuild IVFFlat index periodically (after significant data changes)
-- Run during off-peak hours
REINDEX INDEX CONCURRENTLY idx_embeddings_vector;

-- Vacuum to reclaim space from deleted/updated rows
VACUUM ANALYZE document_embeddings;

-- Monitor index effectiveness
SELECT
  schemaname, tablename, indexname,
  idx_scan AS times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE tablename = 'document_embeddings';
```

### Connection Pooling for vLLM Embeddings

```typescript
import { Agent } from 'undici';

// Persistent connection pool for local embedding service
const embeddingAgent = new Agent({
  connect: { timeout: 5000 },
  pipelining: 10,
  connections: 5,
  keepAliveTimeout: 30000,
});

const embedWithPool = async (texts: string[]): Promise<number[][]> => {
  const response = await fetch('http://localhost:8001/embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'thenlper/gte-base', input: texts }),
    // @ts-ignore — undici dispatcher
    dispatcher: embeddingAgent,
  });

  const data = await response.json();
  return data.embeddings;
};
```

### Performance Benchmarks (Targets for Palace)

| Operation | Target Latency | Notes |
|-----------|---------------|-------|
| Single embedding (GTE-Base) | < 10ms | GPU, single text |
| Batch embedding (32 texts) | < 50ms | GPU, batched |
| Vector search (top-5) | < 20ms | With IVFFlat index |
| Keyword search (top-5) | < 15ms | With GIN index |
| Hybrid search (top-5) | < 40ms | Both searches parallel |
| Cross-encoder rerank (5 docs) | < 100ms | Local model |
| Full RAG pipeline | < 200ms | End-to-end, excluding LLM generation |

---

## Quick Reference

### Pipeline Selection by Use Case

| Use Case | Chunking | Embedding | Search | Rerank | Confidence |
|----------|----------|-----------|--------|--------|-----------|
| Agent chat memory | Fixed (256) | GTE-Base | Vector | None | Threshold 0.70 |
| Knowledge base Q&A | Semantic (512) | GTE-Base | Hybrid | Cross-encoder | Threshold 0.65 |
| Code search | Code-aware (1024) | GTE-Base | Hybrid | LLM-reranker | Threshold 0.60 |
| Research retrieval | Hierarchical | Nomic | Hybrid + MMR | Cross-encoder | Threshold 0.70 |
| User preference memory | Sentence (128) | GTE-Base | Vector | None | Threshold 0.80 |

### Failure Modes and Mitigations

| Failure | Symptom | Mitigation |
|---------|---------|-----------|
| Bad chunking | Relevant info split across chunks | Use semantic chunking with overlap |
| Embedding drift | Old and new embeddings incompatible | Re-embed on model change |
| Over-retrieval | Too much context dilutes signal | Reranking + strict top-k |
| Under-retrieval | Missing relevant context | Hybrid search + lower threshold |
| Hallucination despite RAG | Model ignores context | Stronger grounding instructions |
| Stale knowledge | Outdated facts retrieved | TTL on semantic memory + re-ingestion |

---

*This seed is maintained by the Senior Backend Engineer (AI/ML specialist). Last updated: 2026-03-09.*
*Cross-references: `pgvector-semantic-search.md`, `prompt-engineering-patterns.md`, `multi-agent-coordination.md`*
