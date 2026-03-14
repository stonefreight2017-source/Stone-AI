# RAG Chunking Strategies — Optimal Document Segmentation for Retrieval

> Palace Knowledge Seed — AI/ML Engineering
> Category: Engineering / Retrieval-Augmented Generation
> Version: 1.0 | Created: 2026-03-10
> Dependency: Integrates with `rag-pipeline-design.md`, `pgvector-semantic-search.md`, `embedding-model-selection-tuning.md`

---

## Table of Contents

1. [Why Chunking Matters](#1-why-chunking-matters)
2. [Semantic Chunking](#2-semantic-chunking)
3. [Recursive Character Splitting](#3-recursive-character-splitting)
4. [Sentence-Window Chunking](#4-sentence-window-chunking)
5. [Parent-Child Chunking](#5-parent-child-chunking)
6. [Document-Specific Strategies](#6-document-specific-strategies)
7. [Chunk Size Optimization](#7-chunk-size-optimization)
8. [Overlap Strategies](#8-overlap-strategies)
9. [Metadata Enrichment](#9-metadata-enrichment)
10. [pgvector-Specific Considerations](#10-pgvector-specific-considerations)
11. [TypeScript Implementations](#11-typescript-implementations)
12. [Decision Matrix](#12-decision-matrix)
13. [Anti-Patterns](#13-anti-patterns)
14. [Production Checklist](#14-production-checklist)

---

## 1. Why Chunking Matters

Chunking is the most underestimated part of RAG. Your retrieval quality is bounded by your chunking quality. If you chunk poorly, no amount of embedding model quality, reranking sophistication, or prompt engineering will save you.

### The Core Problem

LLMs have context windows. Documents exceed those windows. You must split documents into retrievable units. The question is: **what constitutes a meaningful unit of information?**

A chunk that's too small loses context. A chunk that's too large dilutes relevance. A chunk that splits mid-thought introduces noise. A chunk that ignores document structure throws away free semantic boundaries.

### Impact on the Full Pipeline

```
Poor Chunking → Fragmented Embeddings → Noisy Retrieval → Irrelevant Context → Bad Generation
Good Chunking → Coherent Embeddings → Precise Retrieval → Relevant Context → Accurate Generation
```

The difference between good and bad chunking is often 15-30% retrieval accuracy — measured by whether the correct chunk appears in top-k results for a query.

### Stone AI Context

Palace agents retrieve knowledge seeds and conversation history. Seeds are structured markdown (like this document). Conversations are multi-turn with role boundaries. Agent memories are short factual statements. Each content type needs a different chunking strategy. One size does not fit all.

---

## 2. Semantic Chunking

Semantic chunking splits text at meaning boundaries rather than arbitrary character or token counts. It uses embeddings to detect where topics shift.

### How It Works

1. Split the document into sentences (or small segments)
2. Embed each sentence
3. Compute cosine similarity between adjacent sentence embeddings
4. Where similarity drops below a threshold, that's a semantic boundary
5. Group sentences between boundaries into chunks

### Why It's Superior for Knowledge Content

Traditional splitting doesn't know that paragraph 3 and paragraph 4 discuss the same concept while paragraph 5 shifts to a new topic. Semantic chunking detects this transition by measuring embedding distance between adjacent segments.

### Implementation

```typescript
import { embed } from '@/lib/embeddings';

interface SemanticChunk {
  content: string;
  startIndex: number;
  endIndex: number;
  sentenceCount: number;
}

interface SemanticChunkOptions {
  breakpointThreshold: number; // percentile threshold, e.g., 0.5 = 50th percentile
  minChunkSize: number;        // minimum characters per chunk
  maxChunkSize: number;        // maximum characters per chunk
}

function splitIntoSentences(text: string): string[] {
  // Split on sentence boundaries, preserving the delimiter
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .filter(s => s.trim().length > 0);
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function semanticChunk(
  text: string,
  options: SemanticChunkOptions = {
    breakpointThreshold: 0.5,
    minChunkSize: 200,
    maxChunkSize: 2000,
  }
): Promise<SemanticChunk[]> {
  const sentences = splitIntoSentences(text);
  if (sentences.length <= 1) {
    return [{ content: text, startIndex: 0, endIndex: text.length, sentenceCount: 1 }];
  }

  // Embed all sentences in batch
  const embeddings = await Promise.all(
    sentences.map(s => embed(s))
  );

  // Compute similarity between adjacent sentences
  const similarities: number[] = [];
  for (let i = 0; i < embeddings.length - 1; i++) {
    similarities.push(cosineSimilarity(embeddings[i], embeddings[i + 1]));
  }

  // Find breakpoints using percentile threshold
  const sorted = [...similarities].sort((a, b) => a - b);
  const thresholdIndex = Math.floor(sorted.length * options.breakpointThreshold);
  const threshold = sorted[thresholdIndex];

  // Identify breakpoint indices (where similarity drops below threshold)
  const breakpoints: number[] = [];
  for (let i = 0; i < similarities.length; i++) {
    if (similarities[i] < threshold) {
      breakpoints.push(i + 1); // break AFTER this sentence
    }
  }

  // Group sentences into chunks
  const chunks: SemanticChunk[] = [];
  let start = 0;
  let charIndex = 0;

  for (const bp of [...breakpoints, sentences.length]) {
    const chunkSentences = sentences.slice(start, bp);
    const content = chunkSentences.join(' ');

    if (content.length >= options.minChunkSize || chunks.length === 0) {
      chunks.push({
        content,
        startIndex: charIndex,
        endIndex: charIndex + content.length,
        sentenceCount: chunkSentences.length,
      });
      charIndex += content.length + 1;
      start = bp;
    } else {
      // Merge small chunk with previous
      if (chunks.length > 0) {
        const prev = chunks[chunks.length - 1];
        prev.content += ' ' + content;
        prev.endIndex = charIndex + content.length;
        prev.sentenceCount += chunkSentences.length;
      }
      charIndex += content.length + 1;
      start = bp;
    }
  }

  // Enforce max chunk size by splitting oversized chunks
  const finalChunks: SemanticChunk[] = [];
  for (const chunk of chunks) {
    if (chunk.content.length > options.maxChunkSize) {
      const mid = Math.floor(chunk.sentenceCount / 2);
      const firstHalf = sentences.slice(0, mid).join(' ');
      const secondHalf = sentences.slice(mid).join(' ');
      finalChunks.push({ ...chunk, content: firstHalf });
      finalChunks.push({ ...chunk, content: secondHalf });
    } else {
      finalChunks.push(chunk);
    }
  }

  return finalChunks;
}
```

### Tuning the Threshold

- **Low threshold (0.3)**: Few breakpoints, larger chunks, preserves broad context
- **Medium threshold (0.5)**: Balanced, good default for mixed content
- **High threshold (0.7)**: Many breakpoints, smaller chunks, captures fine-grained topic shifts

For Palace knowledge seeds, use 0.4-0.5. The content is structured and coherent within sections, so you want fewer false breakpoints.

---

## 3. Recursive Character Splitting

The workhorse strategy popularized by LangChain. It recursively splits text using a hierarchy of separators, trying the largest separator first and falling back to smaller ones.

### Separator Hierarchy

```
\n\n  → Paragraph boundaries (preferred)
\n    → Line boundaries
.     → Sentence boundaries
      → Word boundaries (last resort)
```

### Why "Recursive"

It doesn't just split on the first separator it finds. It splits at the highest-level separator that produces chunks within the target size. If a paragraph is too long, it falls back to splitting on newlines. If a line is too long, it falls back to sentences.

### Implementation

```typescript
interface RecursiveChunkOptions {
  chunkSize: number;      // target chunk size in characters
  chunkOverlap: number;   // overlap between chunks in characters
  separators: string[];   // ordered from most preferred to least
}

function recursiveCharacterSplit(
  text: string,
  options: RecursiveChunkOptions = {
    chunkSize: 1000,
    chunkOverlap: 200,
    separators: ['\n\n', '\n', '. ', ' '],
  }
): string[] {
  const { chunkSize, chunkOverlap, separators } = options;

  if (text.length <= chunkSize) {
    return [text.trim()].filter(t => t.length > 0);
  }

  // Find the best separator for this text
  let bestSeparator = separators[separators.length - 1];
  for (const sep of separators) {
    if (text.includes(sep)) {
      bestSeparator = sep;
      break;
    }
  }

  const splits = text.split(bestSeparator);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const split of splits) {
    const candidate = currentChunk
      ? currentChunk + bestSeparator + split
      : split;

    if (candidate.length <= chunkSize) {
      currentChunk = candidate;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }

      // If this single split exceeds chunk size, recurse with next separator
      if (split.length > chunkSize) {
        const remainingSeparators = separators.slice(
          separators.indexOf(bestSeparator) + 1
        );
        if (remainingSeparators.length > 0) {
          const subChunks = recursiveCharacterSplit(split, {
            chunkSize,
            chunkOverlap,
            separators: remainingSeparators,
          });
          chunks.push(...subChunks);
          currentChunk = '';
        } else {
          // Last resort: hard split at chunkSize
          for (let i = 0; i < split.length; i += chunkSize - chunkOverlap) {
            chunks.push(split.slice(i, i + chunkSize).trim());
          }
          currentChunk = '';
        }
      } else {
        currentChunk = split;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // Apply overlap
  if (chunkOverlap > 0 && chunks.length > 1) {
    return applyOverlap(chunks, chunkOverlap);
  }

  return chunks;
}

function applyOverlap(chunks: string[], overlap: number): string[] {
  const overlapped: string[] = [chunks[0]];

  for (let i = 1; i < chunks.length; i++) {
    const prevChunk = chunks[i - 1];
    const overlapText = prevChunk.slice(-overlap);
    overlapped.push(overlapText + chunks[i]);
  }

  return overlapped;
}
```

### When to Use

Recursive character splitting is the right default when:
- You don't know the document structure ahead of time
- Documents are heterogeneous (mixed prose, lists, code)
- You need predictable chunk sizes for embedding models
- Speed matters more than perfect semantic boundaries

---

## 4. Sentence-Window Chunking

This strategy embeds individual sentences for precision retrieval but returns a surrounding window of sentences for context. It solves the "too small to be useful, too big to be precise" problem.

### How It Works

1. Split document into sentences
2. Embed each sentence individually (small, precise vectors)
3. At retrieval time, find the most relevant sentence
4. Expand to N sentences before and after the match
5. Return the expanded window as context

### Why It Works

Small chunks embed precisely — the vector for "HNSW uses a layered graph structure" is highly specific and will match relevant queries. But that sentence alone isn't useful context for an LLM. By expanding to the surrounding window, you get precision in retrieval and richness in generation.

### Implementation

```typescript
interface SentenceWindow {
  sentence: string;
  index: number;
  embedding?: number[];
}

interface WindowedResult {
  centralSentence: string;
  windowedContent: string;
  centralIndex: number;
  windowStart: number;
  windowEnd: number;
  similarity: number;
}

class SentenceWindowChunker {
  private sentences: string[] = [];
  private windowSize: number;

  constructor(windowSize: number = 3) {
    this.windowSize = windowSize; // sentences before and after
  }

  prepareSentences(text: string): SentenceWindow[] {
    this.sentences = text
      .split(/(?<=[.!?])\s+/)
      .filter(s => s.trim().length > 10); // filter noise

    return this.sentences.map((sentence, index) => ({
      sentence: sentence.trim(),
      index,
    }));
  }

  expandWindow(matchIndex: number): string {
    const start = Math.max(0, matchIndex - this.windowSize);
    const end = Math.min(this.sentences.length - 1, matchIndex + this.windowSize);
    return this.sentences.slice(start, end + 1).join(' ');
  }

  async retrieve(
    query: string,
    topK: number = 5
  ): Promise<WindowedResult[]> {
    // In production, this queries pgvector for the top-k sentence matches
    // then expands each match to its surrounding window
    // Pseudo-code for the retrieval step:
    const results = await prisma.$queryRaw<Array<{
      sentence: string;
      sentence_index: number;
      similarity: number;
    }>>`
      SELECT sentence, sentence_index,
        1 - (embedding <=> ${queryEmbedding}::vector) as similarity
      FROM sentence_embeddings
      WHERE document_id = ${docId}
      ORDER BY embedding <=> ${queryEmbedding}::vector
      LIMIT ${topK}
    `;

    return results.map(r => ({
      centralSentence: r.sentence,
      windowedContent: this.expandWindow(r.sentence_index),
      centralIndex: r.sentence_index,
      windowStart: Math.max(0, r.sentence_index - this.windowSize),
      windowEnd: Math.min(
        this.sentences.length - 1,
        r.sentence_index + this.windowSize
      ),
      similarity: r.similarity,
    }));
  }
}
```

### Storage Cost

Sentence-window chunking stores more vectors (one per sentence vs one per paragraph). For a 10,000-word document:
- Paragraph chunking: ~40 vectors
- Sentence-window chunking: ~400 vectors
- Storage increase: ~10x vectors, but each vector is the same size

With pgvector HNSW, 400 vectors vs 40 vectors is negligible. The index handles millions. The tradeoff is ingestion time, not query time.

### Window Size Selection

- **Window = 1**: Tight context, good for factual Q&A
- **Window = 3**: Balanced, good default for most content
- **Window = 5**: Broad context, good for narrative or argument retrieval
- **Window = 7+**: Diminishing returns, approaching paragraph-level chunks

---

## 5. Parent-Child Chunking

Store two levels of chunks: small "child" chunks for precise retrieval, linked to larger "parent" chunks for rich context. When a child matches, return the parent.

### Architecture

```
Document
  ├── Parent Chunk 1 (500-1000 tokens)
  │     ├── Child Chunk 1a (100-200 tokens) ← embedded & searchable
  │     ├── Child Chunk 1b (100-200 tokens) ← embedded & searchable
  │     └── Child Chunk 1c (100-200 tokens) ← embedded & searchable
  ├── Parent Chunk 2 (500-1000 tokens)
  │     ├── Child Chunk 2a ← embedded & searchable
  │     └── Child Chunk 2b ← embedded & searchable
  └── ...
```

### Database Schema

```sql
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id),
  parent_id UUID REFERENCES document_chunks(id), -- NULL for parent chunks
  content TEXT NOT NULL,
  chunk_type TEXT NOT NULL CHECK (chunk_type IN ('parent', 'child')),
  embedding vector(1536), -- only populated for child chunks
  chunk_index INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index only child embeddings (parents don't need vector search)
CREATE INDEX idx_child_embeddings ON document_chunks
  USING hnsw (embedding vector_cosine_ops)
  WHERE chunk_type = 'child' AND embedding IS NOT NULL;
```

### Retrieval Query

```sql
-- Find relevant children, return their parents
WITH matched_children AS (
  SELECT id, parent_id, content,
    1 - (embedding <=> $1::vector) as similarity
  FROM document_chunks
  WHERE chunk_type = 'child'
    AND embedding IS NOT NULL
  ORDER BY embedding <=> $1::vector
  LIMIT 5
)
SELECT DISTINCT ON (p.id)
  p.id as parent_id,
  p.content as parent_content,
  mc.similarity as best_child_similarity,
  mc.content as matched_child_content
FROM matched_children mc
JOIN document_chunks p ON p.id = mc.parent_id
ORDER BY p.id, mc.similarity DESC;
```

### Implementation

```typescript
interface ParentChildChunk {
  parentContent: string;
  children: {
    content: string;
    index: number;
  }[];
}

function parentChildChunk(
  text: string,
  parentSize: number = 2000,
  childSize: number = 400,
  childOverlap: number = 50
): ParentChildChunk[] {
  // First: create parent chunks
  const parents = recursiveCharacterSplit(text, {
    chunkSize: parentSize,
    chunkOverlap: 0, // no overlap at parent level
    separators: ['\n\n', '\n'],
  });

  // Then: split each parent into children
  return parents.map(parentContent => {
    const children = recursiveCharacterSplit(parentContent, {
      chunkSize: childSize,
      chunkOverlap: childOverlap,
      separators: ['\n', '. ', ' '],
    });

    return {
      parentContent,
      children: children.map((content, index) => ({ content, index })),
    };
  });
}

async function ingestParentChild(
  documentId: string,
  text: string
): Promise<void> {
  const chunks = parentChildChunk(text);

  for (const chunk of chunks) {
    // Insert parent (no embedding)
    const parent = await prisma.documentChunk.create({
      data: {
        documentId,
        content: chunk.parentContent,
        chunkType: 'parent',
        chunkIndex: chunks.indexOf(chunk),
        parentId: null,
      },
    });

    // Insert children with embeddings
    for (const child of chunk.children) {
      const embedding = await embed(child.content);
      await prisma.$executeRaw`
        INSERT INTO document_chunks (id, document_id, parent_id, content, chunk_type, embedding, chunk_index)
        VALUES (gen_random_uuid(), ${documentId}::uuid, ${parent.id}::uuid,
          ${child.content}, 'child', ${embedding}::vector, ${child.index})
      `;
    }
  }
}
```

### When to Use Parent-Child

- Long documents where local precision matters but broad context is needed
- Technical documentation with sections that build on each other
- Knowledge seeds — match a specific concept, return the full section

---

## 6. Document-Specific Strategies

### Code Chunking

Code has natural boundaries that text-based splitters destroy. Never split a function in half.

```typescript
interface CodeChunk {
  content: string;
  type: 'function' | 'class' | 'import' | 'module' | 'block';
  name?: string;
  language: string;
}

function chunkTypeScript(code: string): CodeChunk[] {
  const chunks: CodeChunk[] = [];

  // Split by top-level declarations
  // Regex patterns for common TypeScript structures
  const patterns = [
    // Named exports and functions
    /(?:export\s+)?(?:async\s+)?function\s+\w+[\s\S]*?(?=\n(?:export|function|class|interface|type|const|let|var)\s|\n*$)/g,
    // Classes
    /(?:export\s+)?class\s+\w+[\s\S]*?(?=\n(?:export|function|class)\s|\n*$)/g,
    // Interfaces and types
    /(?:export\s+)?(?:interface|type)\s+\w+[\s\S]*?(?=\n(?:export|function|class|interface|type)\s|\n*$)/g,
  ];

  // Simpler approach: split on blank lines between top-level declarations
  const blocks = code.split(/\n\n(?=(?:export\s+)?(?:async\s+)?(?:function|class|interface|type|const|let))/);

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    let type: CodeChunk['type'] = 'block';
    let name: string | undefined;

    if (trimmed.match(/(?:export\s+)?class\s+(\w+)/)) {
      type = 'class';
      name = trimmed.match(/class\s+(\w+)/)?.[1];
    } else if (trimmed.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/)) {
      type = 'function';
      name = trimmed.match(/function\s+(\w+)/)?.[1];
    } else if (trimmed.match(/^import\s/)) {
      type = 'import';
    }

    chunks.push({ content: trimmed, type, name, language: 'typescript' });
  }

  return chunks;
}
```

### Markdown Chunking

Markdown has explicit structure via headers. Use them.

```typescript
interface MarkdownChunk {
  content: string;
  heading: string;
  headingLevel: number;
  headingHierarchy: string[]; // ["## Section", "### Subsection"]
}

function chunkMarkdown(markdown: string): MarkdownChunk[] {
  const lines = markdown.split('\n');
  const chunks: MarkdownChunk[] = [];
  let currentContent: string[] = [];
  let currentHeading = 'Document Start';
  let currentLevel = 0;
  const headingStack: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);

    if (headingMatch) {
      // Save previous chunk
      if (currentContent.length > 0) {
        const content = currentContent.join('\n').trim();
        if (content.length > 0) {
          chunks.push({
            content,
            heading: currentHeading,
            headingLevel: currentLevel,
            headingHierarchy: [...headingStack],
          });
        }
      }

      // Update heading state
      const level = headingMatch[1].length;
      const heading = headingMatch[2];
      currentHeading = heading;
      currentLevel = level;
      currentContent = [line];

      // Maintain heading hierarchy
      while (headingStack.length > 0) {
        const lastLevel = headingStack[headingStack.length - 1]
          .match(/^(#{1,6})/)?.[1].length ?? 0;
        if (lastLevel >= level) {
          headingStack.pop();
        } else {
          break;
        }
      }
      headingStack.push(line);
    } else {
      currentContent.push(line);
    }
  }

  // Don't forget the last chunk
  if (currentContent.length > 0) {
    const content = currentContent.join('\n').trim();
    if (content.length > 0) {
      chunks.push({
        content,
        heading: currentHeading,
        headingLevel: currentLevel,
        headingHierarchy: [...headingStack],
      });
    }
  }

  return chunks;
}
```

### Conversation Chunking

Chat histories have natural turn boundaries. Never split mid-turn.

```typescript
interface ConversationChunk {
  content: string;
  turnCount: number;
  roles: string[];
  startTurn: number;
  endTurn: number;
}

interface ConversationTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function chunkConversation(
  turns: ConversationTurn[],
  turnsPerChunk: number = 4,
  overlapTurns: number = 1
): ConversationChunk[] {
  const chunks: ConversationChunk[] = [];

  for (let i = 0; i < turns.length; i += turnsPerChunk - overlapTurns) {
    const chunkTurns = turns.slice(i, i + turnsPerChunk);
    if (chunkTurns.length === 0) break;

    const content = chunkTurns
      .map(t => `${t.role}: ${t.content}`)
      .join('\n\n');

    chunks.push({
      content,
      turnCount: chunkTurns.length,
      roles: [...new Set(chunkTurns.map(t => t.role))],
      startTurn: i,
      endTurn: i + chunkTurns.length - 1,
    });
  }

  return chunks;
}
```

---

## 7. Chunk Size Optimization

Chunk size is the single most impactful parameter in your RAG pipeline. The right size depends on your content, embedding model, and retrieval use case.

### Benchmark Data (Typical Results)

| Chunk Size | Retrieval Precision@5 | Retrieval Recall@5 | Embedding Quality | Context Efficiency |
|------------|----------------------|--------------------|--------------------|-------------------|
| 128 tokens | 0.82 | 0.45 | High (focused) | Low (many chunks needed) |
| 256 tokens | 0.78 | 0.58 | High | Medium |
| 512 tokens | 0.71 | 0.72 | Medium-High | High |
| 1024 tokens | 0.63 | 0.81 | Medium | Very High |
| 2048 tokens | 0.52 | 0.88 | Low (diluted) | Very High (few chunks) |

### Key Tradeoffs

**Small chunks (128-256 tokens)**:
- Higher precision: the embedding closely represents the content
- Lower recall: might miss relevant content split across chunks
- More vectors to store and search
- Best for: factual Q&A, specific lookups, entity-rich content

**Medium chunks (512 tokens)**:
- Balanced precision and recall
- Good default for most applications
- Best for: general-purpose RAG, mixed content types

**Large chunks (1024+ tokens)**:
- Higher recall: more likely to contain the answer somewhere
- Lower precision: the embedding is an average of many concepts
- Fewer vectors to store
- Best for: summarization, broad topic retrieval, narrative content

### Embedding Model Constraints

Each embedding model has a maximum input length. Chunks exceeding this are truncated, losing information silently.

| Model | Max Tokens | Recommended Chunk Size |
|-------|-----------|----------------------|
| text-embedding-3-small | 8191 | 256-512 |
| text-embedding-3-large | 8191 | 512-1024 |
| BGE-small-en-v1.5 | 512 | 256-400 |
| BGE-large-en-v1.5 | 512 | 256-400 |
| Nomic Embed v1.5 | 8192 | 512-1024 |
| GTE-large | 512 | 256-400 |
| E5-large-v2 | 512 | 256-400 |

**Critical rule**: Never set chunk size larger than your embedding model's context window. The model will silently truncate and your embeddings will be incomplete.

### Measuring What Works for Your Data

```typescript
async function evaluateChunkSize(
  documents: string[],
  queries: Array<{ query: string; expectedChunkContent: string }>,
  chunkSizes: number[]
): Promise<Record<number, { precision: number; recall: number }>> {
  const results: Record<number, { precision: number; recall: number }> = {};

  for (const size of chunkSizes) {
    let hits = 0;
    let total = queries.length;

    for (const doc of documents) {
      const chunks = recursiveCharacterSplit(doc, {
        chunkSize: size,
        chunkOverlap: Math.floor(size * 0.15),
        separators: ['\n\n', '\n', '. ', ' '],
      });

      // Embed and index chunks (simplified)
      const chunkEmbeddings = await Promise.all(chunks.map(c => embed(c)));

      for (const q of queries) {
        const queryEmbedding = await embed(q.query);
        const similarities = chunkEmbeddings.map(e => cosineSimilarity(queryEmbedding, e));
        const topK = similarities
          .map((sim, idx) => ({ sim, idx }))
          .sort((a, b) => b.sim - a.sim)
          .slice(0, 5);

        // Check if expected content appears in top-k chunks
        const found = topK.some(({ idx }) =>
          chunks[idx].includes(q.expectedChunkContent)
        );
        if (found) hits++;
      }
    }

    results[size] = {
      precision: hits / total,
      recall: hits / total, // simplified
    };
  }

  return results;
}
```

---

## 8. Overlap Strategies

Overlap prevents information loss at chunk boundaries. When you split "The HNSW algorithm uses layered graphs. Each layer reduces connections by half." between two chunks, neither chunk has the full concept. Overlap ensures both chunks contain the boundary content.

### Overlap Sizing

- **10% overlap**: Minimal safety net. Covers split sentences. Use for structured content with natural boundaries.
- **15% overlap**: Good default. Covers most boundary concepts.
- **20% overlap**: Conservative. Use for dense technical content where every sentence matters.
- **25%+ overlap**: Diminishing returns. You're storing significant duplicate content.

### Token-Based vs Character-Based Overlap

Character-based overlap is simpler but can split mid-word. Token-based overlap is more accurate but requires a tokenizer.

```typescript
function overlapByTokens(
  chunks: string[],
  overlapTokens: number,
  tokenize: (text: string) => string[],
  detokenize: (tokens: string[]) => string
): string[] {
  if (chunks.length <= 1) return chunks;

  const overlapped: string[] = [chunks[0]];

  for (let i = 1; i < chunks.length; i++) {
    const prevTokens = tokenize(chunks[i - 1]);
    const overlapContent = detokenize(
      prevTokens.slice(-overlapTokens)
    );
    overlapped.push(overlapContent + ' ' + chunks[i]);
  }

  return overlapped;
}
```

### Overlap Anti-Pattern: Duplicate Retrieval

Overlap means the same content exists in multiple chunks. When querying, you might retrieve chunk N and chunk N+1 that share 20% of their content. Deduplicate after retrieval:

```typescript
function deduplicateChunks(
  chunks: Array<{ content: string; similarity: number }>,
  overlapThreshold: number = 0.8
): Array<{ content: string; similarity: number }> {
  const unique: Array<{ content: string; similarity: number }> = [];

  for (const chunk of chunks) {
    const isDuplicate = unique.some(u => {
      const shorter = Math.min(u.content.length, chunk.content.length);
      const overlap = longestCommonSubstring(u.content, chunk.content);
      return overlap.length / shorter > overlapThreshold;
    });

    if (!isDuplicate) {
      unique.push(chunk);
    }
  }

  return unique;
}
```

---

## 9. Metadata Enrichment

Chunks without metadata are anonymous text fragments. Metadata makes retrieval filterable, traceable, and contextual.

### Essential Metadata Fields

```typescript
interface ChunkMetadata {
  // Source identification
  documentId: string;
  documentTitle: string;
  documentType: 'knowledge_seed' | 'conversation' | 'user_memory' | 'code';

  // Position context
  sectionHeading: string;       // nearest heading above this chunk
  headingHierarchy: string[];   // full path: ["# Title", "## Section", "### Sub"]
  chunkIndex: number;           // position within document
  totalChunks: number;          // total chunks in document

  // Temporal context
  createdAt: string;            // ISO timestamp
  updatedAt: string;            // when source was last modified

  // Semantic hints
  keywords: string[];           // extracted key terms
  entities: string[];           // named entities
  category: string;             // broad topic category

  // Agent context (Stone AI specific)
  agentId?: string;             // which agent this is relevant to
  tier?: string;                // subscription tier relevance
  seedId?: string;              // knowledge seed identifier
}
```

### Enrichment Pipeline

```typescript
async function enrichChunk(
  content: string,
  sourceDocument: Document,
  chunkIndex: number,
  totalChunks: number,
  sectionContext: { heading: string; hierarchy: string[] }
): Promise<ChunkMetadata> {
  // Extract keywords using TF-IDF or simple frequency
  const keywords = extractKeywords(content, 5);

  // Extract named entities (can use LLM or regex for known patterns)
  const entities = extractEntities(content);

  return {
    documentId: sourceDocument.id,
    documentTitle: sourceDocument.title,
    documentType: sourceDocument.type,
    sectionHeading: sectionContext.heading,
    headingHierarchy: sectionContext.hierarchy,
    chunkIndex,
    totalChunks,
    createdAt: new Date().toISOString(),
    updatedAt: sourceDocument.updatedAt.toISOString(),
    keywords,
    entities,
    category: sourceDocument.category,
  };
}
```

### Metadata-Filtered Retrieval

```sql
-- Find chunks about "HNSW" from engineering seeds only
SELECT content, metadata,
  1 - (embedding <=> $1::vector) as similarity
FROM document_chunks
WHERE metadata->>'documentType' = 'knowledge_seed'
  AND metadata->>'category' = 'engineering'
  AND embedding IS NOT NULL
ORDER BY embedding <=> $1::vector
LIMIT 10;
```

---

## 10. pgvector-Specific Considerations

### Chunk Size and HNSW Performance

HNSW index build time and memory usage scale with the number of vectors, not the content length. But chunk size determines vector count:

| Document Size | 256-token chunks | 512-token chunks | 1024-token chunks |
|--------------|-----------------|-----------------|------------------|
| 10K words | ~160 vectors | ~80 vectors | ~40 vectors |
| 100K words | ~1,600 vectors | ~800 vectors | ~400 vectors |
| 1M words | ~16,000 vectors | ~8,000 vectors | ~4,000 vectors |

HNSW build time is O(N * log(N)) and memory is O(N * M) where M is the connections parameter. Halving your vector count by doubling chunk size saves significant index build time.

### Batch Ingestion Strategy

```typescript
async function batchIngestChunks(
  chunks: Array<{ content: string; metadata: ChunkMetadata }>,
  batchSize: number = 100
): Promise<void> {
  // Embed in batches to respect rate limits and optimize throughput
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);

    // Parallel embedding within batch
    const embeddings = await Promise.all(
      batch.map(chunk => embed(chunk.content))
    );

    // Bulk insert using raw SQL for performance
    const values = batch.map((chunk, idx) => ({
      content: chunk.content,
      embedding: embeddings[idx],
      metadata: chunk.metadata,
    }));

    // Use a single INSERT with multiple value rows
    await prisma.$executeRaw`
      INSERT INTO document_chunks (id, content, embedding, metadata, created_at)
      SELECT
        gen_random_uuid(),
        v.content,
        v.embedding::vector,
        v.metadata::jsonb,
        NOW()
      FROM jsonb_to_recordset(${JSON.stringify(values)}::jsonb)
        AS v(content text, embedding text, metadata jsonb)
    `;
  }

  // Rebuild HNSW index after bulk insert for optimal performance
  await prisma.$executeRaw`REINDEX INDEX idx_chunk_embeddings`;
}
```

### Index Maintenance After Chunking Changes

If you change your chunking strategy, you must re-embed and re-index everything. There's no way to "update" an HNSW index incrementally after a structural change. Plan for this:

1. Create new chunks with new strategy
2. Embed all new chunks
3. Insert into a new table or with a version column
4. Swap the live table/version
5. Drop the old data

---

## 11. TypeScript Implementations

### Universal Chunker Factory

```typescript
type ChunkStrategy =
  | 'semantic'
  | 'recursive'
  | 'sentence-window'
  | 'parent-child'
  | 'markdown'
  | 'code'
  | 'conversation';

interface ChunkResult {
  content: string;
  metadata: Record<string, unknown>;
  strategy: ChunkStrategy;
}

interface ChunkerConfig {
  strategy: ChunkStrategy;
  chunkSize?: number;
  chunkOverlap?: number;
  windowSize?: number;
  breakpointThreshold?: number;
}

async function chunk(
  content: string,
  config: ChunkerConfig
): Promise<ChunkResult[]> {
  const {
    strategy,
    chunkSize = 512,
    chunkOverlap = 100,
    windowSize = 3,
    breakpointThreshold = 0.5,
  } = config;

  switch (strategy) {
    case 'semantic':
      return (await semanticChunk(content, {
        breakpointThreshold,
        minChunkSize: Math.floor(chunkSize * 0.5),
        maxChunkSize: chunkSize * 2,
      })).map(c => ({
        content: c.content,
        metadata: { startIndex: c.startIndex, endIndex: c.endIndex },
        strategy,
      }));

    case 'recursive':
      return recursiveCharacterSplit(content, {
        chunkSize,
        chunkOverlap,
        separators: ['\n\n', '\n', '. ', ' '],
      }).map((c, i) => ({
        content: c,
        metadata: { chunkIndex: i },
        strategy,
      }));

    case 'markdown':
      return chunkMarkdown(content).map(c => ({
        content: c.content,
        metadata: {
          heading: c.heading,
          headingLevel: c.headingLevel,
          headingHierarchy: c.headingHierarchy,
        },
        strategy,
      }));

    case 'code':
      return chunkTypeScript(content).map(c => ({
        content: c.content,
        metadata: { type: c.type, name: c.name, language: c.language },
        strategy,
      }));

    case 'conversation':
      // Requires pre-parsed turns; handle at a higher level
      throw new Error('Use chunkConversation() directly with parsed turns');

    case 'parent-child':
      // Returns flat list; parent-child relationship tracked via metadata
      const pcChunks = parentChildChunk(content, chunkSize * 2, chunkSize);
      return pcChunks.flatMap(pc =>
        pc.children.map(child => ({
          content: child.content,
          metadata: {
            parentPreview: pc.parentContent.slice(0, 200),
            childIndex: child.index,
          },
          strategy,
        }))
      );

    case 'sentence-window':
      const sw = new SentenceWindowChunker(windowSize);
      return sw.prepareSentences(content).map(s => ({
        content: s.sentence,
        metadata: { sentenceIndex: s.index, windowSize },
        strategy,
      }));

    default:
      throw new Error(`Unknown chunking strategy: ${strategy}`);
  }
}
```

---

## 12. Decision Matrix

Use this table to pick the right strategy for your content type:

| Content Type | Best Strategy | Chunk Size | Overlap | Notes |
|-------------|---------------|------------|---------|-------|
| Knowledge seeds (markdown) | Markdown + parent-child | Section-based | 0% (natural boundaries) | Split on headers, embed subsections |
| API documentation | Markdown | Section-based | 10% | Each endpoint is a natural chunk |
| Code files | Code-aware | Function/class | 0% | Never split mid-function |
| Chat history | Conversation | 4-6 turns | 1 turn | Preserve turn boundaries |
| User memories | None (already atomic) | N/A | N/A | Short facts, embed as-is |
| Long-form articles | Semantic or recursive | 512 tokens | 15% | Semantic for quality, recursive for speed |
| Legal documents | Sentence-window | Sentence | Window=5 | Precise clause retrieval, broad context |
| Product descriptions | Recursive | 256 tokens | 10% | Short, focused chunks |
| Forum posts | Conversation | Per-post | 0% | Each post is a natural unit |
| PDF reports | Recursive + metadata | 512 tokens | 15% | Enrich with page numbers, section titles |

### Decision Flowchart

```
Is the content structured (markdown, code, HTML)?
├── YES → Does it have headers/sections?
│         ├── YES → Markdown chunking with header hierarchy
│         └── NO → Code-aware chunking (by function/class)
└── NO → Is precision more important than recall?
          ├── YES → Sentence-window (embed sentences, retrieve windows)
          └── NO → Is the content homogeneous?
                    ├── YES → Recursive with 512 tokens
                    └── NO → Semantic chunking (detect topic shifts)
```

---

## 13. Anti-Patterns

### Anti-Pattern 1: Splitting Mid-Sentence

**Wrong**:
```
Chunk 1: "HNSW uses a hierarchical graph structure where each layer contains"
Chunk 2: "fewer nodes than the layer below, enabling logarithmic search time."
```

Neither chunk is semantically complete. The embedding for chunk 1 doesn't capture "logarithmic search time" and chunk 2 doesn't capture "HNSW" or "hierarchical graph."

**Fix**: Always split on sentence boundaries at minimum. Use separators that respect linguistic units.

### Anti-Pattern 2: Ignoring Document Structure

**Wrong**: Using recursive character splitting on markdown when the document has clear ## headers.

**Fix**: Use markdown-aware chunking. Headers are free semantic boundaries — don't ignore them.

### Anti-Pattern 3: Uniform Chunk Sizes for Mixed Content

**Wrong**: Using 512-token chunks for a repository containing code files, markdown docs, and chat logs.

**Fix**: Route each document type to its appropriate chunking strategy. Use the decision matrix above.

### Anti-Pattern 4: No Overlap

**Wrong**: Zero overlap between chunks.

**Why it's bad**: Concepts at boundaries are split. If a user asks about something that spans a chunk boundary, neither chunk will score highly for the query.

**Fix**: 10-20% overlap for prose content. 0% only for content with natural boundaries (sections, functions).

### Anti-Pattern 5: Chunking Without Metadata

**Wrong**: Storing chunks as anonymous text blobs with no source tracking.

**Why it's bad**: You can't filter by document type, section, date, or category. Every query searches everything. And you can't trace retrieved content back to its source.

**Fix**: Attach metadata at chunking time. It's much harder to retrofit later.

### Anti-Pattern 6: Re-embedding on Every Query

**Wrong**: Chunking and embedding documents at query time.

**Fix**: Chunk and embed at ingestion time. Store embeddings in pgvector. Query time should only embed the query itself.

### Anti-Pattern 7: Chunk Size Larger Than Model Context

**Wrong**: Using 2048-token chunks with BGE-small (512 token limit).

**Why it's bad**: The model silently truncates. Your embedding represents only the first 512 tokens. The rest is invisible to search.

**Fix**: Always check your embedding model's max input length. Set chunk size to 80% of that maximum.

---

## 14. Production Checklist

- [ ] Chunking strategy selected based on content type (not arbitrary)
- [ ] Chunk size validated against embedding model's max input length
- [ ] Overlap configured (10-20% for prose, 0% for structured content)
- [ ] Metadata attached at chunk time (source, section, timestamps)
- [ ] Deduplication logic in place for overlap-caused duplicate retrieval
- [ ] Batch ingestion pipeline tested with realistic data volumes
- [ ] pgvector HNSW index parameters tuned for your vector count
- [ ] Chunk quality evaluated with test queries and expected results
- [ ] Document-type routing implemented (markdown vs code vs conversation)
- [ ] Re-chunking/re-embedding migration plan documented for strategy changes

---

> This seed is designed for RAG retrieval. Each section is self-contained and can be retrieved independently. Metadata-enriched chunks from this document should include the section heading and the strategy name for filtered retrieval.
