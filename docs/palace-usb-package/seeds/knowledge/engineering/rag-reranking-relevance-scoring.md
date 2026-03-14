# RAG Reranking & Relevance Scoring

## Purpose
Reranking is the second-stage filtering that separates good RAG systems from great ones. Initial retrieval (ANN/vector search) optimizes for recall — get candidates fast. Reranking optimizes for precision — put the best candidates first. This seed covers cross-encoder reranking, MMR diversity, ColBERT late interaction, score normalization, and latency tradeoffs.

---

## The Two-Stage Retrieval Architecture

```
Query → Embedding → ANN Search (fast, recall-oriented)
                         ↓
                   Top-K candidates (K=50-200)
                         ↓
                   Reranker (slow, precision-oriented)
                         ↓
                   Top-N results (N=5-20)
                         ↓
                   LLM Context Window
```

**Why two stages?** Vector similarity (cosine/dot product) is a weak relevance signal. It captures semantic similarity but misses nuance — exact phrase matches, negation, conditional relevance. Cross-encoders process query+document jointly and catch what bi-encoders miss.

---

## Cross-Encoder Reranking

### What It Is
A cross-encoder takes (query, document) as a PAIR and outputs a single relevance score. Unlike bi-encoders (which encode query and document separately), cross-encoders see both simultaneously — enabling attention across query-document tokens.

### Why It's Better Than Cosine Similarity
- Handles negation: "cars that are NOT electric" — cosine similarity still returns electric car docs
- Handles specificity: "Python 3.12 asyncio changes" vs generic Python docs
- Handles conditional relevance: "best database for <10GB datasets" — cross-encoder understands the condition

### TypeScript Implementation

```typescript
// Using Cohere Rerank API
import { CohereClient } from 'cohere-ai';

interface RerankedResult {
  index: number;
  relevanceScore: number;
  document: string;
}

async function cohereRerank(
  query: string,
  documents: string[],
  topN: number = 10
): Promise<RerankedResult[]> {
  const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY,
  });

  const response = await cohere.rerank({
    query,
    documents,
    topN,
    model: 'rerank-english-v3.0',
  });

  return response.results.map((r) => ({
    index: r.index,
    relevanceScore: r.relevanceScore,
    document: documents[r.index],
  }));
}
```

```typescript
// Self-hosted cross-encoder reranking via local model API
interface CrossEncoderRequest {
  pairs: Array<[string, string]>;
}

async function localCrossEncoderRerank(
  query: string,
  documents: string[],
  topN: number = 10,
  endpoint: string = 'http://localhost:8080/rerank'
): Promise<RerankedResult[]> {
  const pairs = documents.map((doc) => [query, doc]);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pairs }),
  });

  const scores: number[] = await response.json();

  const scored = documents.map((doc, i) => ({
    index: i,
    relevanceScore: scores[i],
    document: doc,
  }));

  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return scored.slice(0, topN);
}
```

### Anti-Patterns
- **Reranking too many documents**: Cross-encoders are O(n) per query-doc pair. Reranking 1000 docs = 1000 forward passes. Keep initial retrieval to 50-200 candidates.
- **Reranking too few**: If you only retrieve 5 and rerank 5, reranking adds latency with no value. Retrieve 50+, rerank to 5-10.
- **Ignoring the score distribution**: A top score of 0.95 vs 0.12 means very different things. Use score thresholds, not just top-N.

---

## Maximal Marginal Relevance (MMR)

### What It Is
MMR balances relevance and diversity. Pure relevance ranking often returns near-duplicate chunks — 5 paragraphs saying the same thing. MMR penalizes redundancy.

### The Formula
```
MMR = argmax[λ * Sim(query, doc) - (1-λ) * max(Sim(doc, selected_docs))]
```
- λ = 1.0 → pure relevance (no diversity)
- λ = 0.0 → pure diversity (no relevance)
- λ = 0.5-0.7 → good balance for most RAG use cases

### TypeScript Implementation

```typescript
interface ScoredDocument {
  id: string;
  content: string;
  embedding: number[];
  relevanceScore: number;
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

function mmrRerank(
  queryEmbedding: number[],
  candidates: ScoredDocument[],
  topN: number,
  lambda: number = 0.6
): ScoredDocument[] {
  const selected: ScoredDocument[] = [];
  const remaining = [...candidates];

  while (selected.length < topN && remaining.length > 0) {
    let bestIdx = -1;
    let bestScore = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const doc = remaining[i];
      const relevance = cosineSimilarity(queryEmbedding, doc.embedding);

      // Max similarity to any already-selected document
      let maxSimToSelected = 0;
      for (const sel of selected) {
        const sim = cosineSimilarity(doc.embedding, sel.embedding);
        maxSimToSelected = Math.max(maxSimToSelected, sim);
      }

      const mmrScore = lambda * relevance - (1 - lambda) * maxSimToSelected;

      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIdx = i;
      }
    }

    if (bestIdx >= 0) {
      selected.push(remaining[bestIdx]);
      remaining.splice(bestIdx, 1);
    }
  }

  return selected;
}
```

### When To Use MMR
- User asks a broad question → you want diverse coverage
- Knowledge base has redundant/overlapping content
- You're stuffing many chunks into context → diversity prevents wasting tokens on repetition

### When NOT To Use MMR
- User asks a very specific factual question → you want the single best match
- Documents are already de-duplicated at ingestion time
- Latency is critical and you can't afford the O(n*k) MMR loop

---

## ColBERT Late Interaction

### What It Is
ColBERT (Contextualized Late Interaction over BERT) is a middle ground between bi-encoders and cross-encoders. It encodes query and document separately (like bi-encoders) but computes fine-grained token-level similarity at query time (like cross-encoders).

### How It Works
1. Encode query → matrix of token embeddings (Q x D dimensions)
2. Encode document → matrix of token embeddings (N x D dimensions)
3. For each query token, find max similarity across all document tokens
4. Sum the max similarities → relevance score

```
Score = Σ_i max_j(Q_i · D_j)
```

### Why It Matters for RAG
- **Speed**: Document embeddings are precomputed and stored. Only query encoding + MaxSim happens at query time.
- **Quality**: Token-level matching catches exact phrases, rare terms, and specific entities that bag-of-embedding approaches miss.
- **Scalability**: With PLAID (Performance-optimized Late Interaction Driver), ColBERT can search millions of documents in milliseconds.

### TypeScript Integration Pattern

```typescript
// Using a ColBERT server (e.g., Stanford's ColBERT or RAGatouille)
interface ColBERTSearchResult {
  docId: string;
  score: number;
  content: string;
}

async function colbertSearch(
  query: string,
  collectionName: string,
  topK: number = 20,
  endpoint: string = 'http://localhost:8893'
): Promise<ColBERTSearchResult[]> {
  const response = await fetch(`${endpoint}/api/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      collection: collectionName,
      k: topK,
    }),
  });

  const data = await response.json();
  return data.results;
}

// Hybrid: ColBERT + pgvector
async function hybridSearch(
  query: string,
  queryEmbedding: number[],
  pgPool: any,
  colbertEndpoint: string
): Promise<ScoredDocument[]> {
  // Run both searches in parallel
  const [vectorResults, colbertResults] = await Promise.all([
    pgPool.query(
      `SELECT id, content, 1 - (embedding <=> $1::vector) as score
       FROM documents
       ORDER BY embedding <=> $1::vector
       LIMIT 50`,
      [JSON.stringify(queryEmbedding)]
    ),
    colbertSearch(query, 'main', 50, colbertEndpoint),
  ]);

  // Reciprocal Rank Fusion to combine
  return reciprocalRankFusion(vectorResults.rows, colbertResults);
}
```

---

## Score Normalization

### The Problem
Different retrieval methods produce scores on different scales:
- Cosine similarity: [-1, 1] (usually [0, 1] for normalized embeddings)
- Cohere Rerank: [0, 1]
- BM25: unbounded positive
- ColBERT: unbounded positive
- Cross-encoder logits: unbounded

You can't compare or combine raw scores from different sources.

### Normalization Strategies

```typescript
// Min-Max normalization — maps to [0, 1]
function minMaxNormalize(scores: number[]): number[] {
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const range = max - min;
  if (range === 0) return scores.map(() => 1);
  return scores.map((s) => (s - min) / range);
}

// Z-Score normalization — mean=0, std=1
function zScoreNormalize(scores: number[]): number[] {
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const std = Math.sqrt(
    scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length
  );
  if (std === 0) return scores.map(() => 0);
  return scores.map((s) => (s - mean) / std);
}

// Sigmoid normalization — soft mapping to (0, 1)
function sigmoidNormalize(scores: number[], temperature: number = 1): number[] {
  return scores.map((s) => 1 / (1 + Math.exp(-s / temperature)));
}
```

### Reciprocal Rank Fusion (RRF)

The go-to method for combining ranked lists from different sources. Doesn't require score normalization — works purely on rank positions.

```typescript
interface RankedItem {
  id: string;
  content: string;
  [key: string]: any;
}

function reciprocalRankFusion(
  ...rankedLists: RankedItem[][]
): Array<RankedItem & { rrfScore: number }> {
  const k = 60; // Standard RRF constant
  const scoreMap = new Map<string, { item: RankedItem; score: number }>();

  for (const list of rankedLists) {
    for (let rank = 0; rank < list.length; rank++) {
      const item = list[rank];
      const existing = scoreMap.get(item.id);
      const rrfContribution = 1 / (k + rank + 1);

      if (existing) {
        existing.score += rrfContribution;
      } else {
        scoreMap.set(item.id, { item, score: rrfContribution });
      }
    }
  }

  return Array.from(scoreMap.values())
    .sort((a, b) => b.score - a.score)
    .map(({ item, score }) => ({ ...item, rrfScore: score }));
}
```

---

## Decision Matrix: When To Rerank vs Skip

| Scenario | Rerank? | Method | Reasoning |
|----------|---------|--------|-----------|
| Simple factual lookup | No | — | Top-1 vector result is usually sufficient |
| Complex multi-part question | Yes | Cross-encoder | Need to assess holistic relevance |
| High-stakes (medical, legal) | Yes | Cross-encoder + human review | Precision critical |
| Chatbot with <200ms budget | Maybe | ColBERT or skip | Cross-encoders too slow |
| Hybrid search (BM25 + vector) | Yes | RRF minimum | Must combine score scales |
| Redundant knowledge base | Yes | MMR | Diversity prevents token waste |
| Multi-language queries | Yes | Multilingual cross-encoder | Vector similarity degrades cross-language |

---

## Latency Tradeoffs

### Measured Latencies (Typical, 50 candidates)

| Method | Latency | Quality Gain |
|--------|---------|-------------|
| No reranking | 0ms | Baseline |
| MMR (in-memory) | 2-5ms | +10-15% diversity |
| ColBERT (local) | 10-30ms | +15-25% relevance |
| Cohere Rerank API | 100-300ms | +20-35% relevance |
| Local cross-encoder (GPU) | 50-150ms | +20-30% relevance |
| Local cross-encoder (CPU) | 200-800ms | +20-30% relevance |

### Optimization Strategies

```typescript
// Strategy 1: Conditional reranking — only rerank when initial scores are ambiguous
async function conditionalRerank(
  query: string,
  candidates: ScoredDocument[],
  threshold: number = 0.15
): Promise<ScoredDocument[]> {
  if (candidates.length === 0) return [];

  // If top score is much higher than #2, skip reranking
  const scoreDiff = candidates[0].relevanceScore - candidates[1]?.relevanceScore;
  if (scoreDiff > threshold) {
    return candidates; // Clear winner, no reranking needed
  }

  // Scores are close — reranking will help
  return await cohereRerank(
    query,
    candidates.map((c) => c.content),
    10
  ).then((results) =>
    results.map((r) => ({
      ...candidates[r.index],
      relevanceScore: r.relevanceScore,
    }))
  );
}

// Strategy 2: Async reranking with fallback
async function rerankWithTimeout(
  query: string,
  candidates: ScoredDocument[],
  timeoutMs: number = 500
): Promise<ScoredDocument[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const reranked = await cohereRerank(
      query,
      candidates.map((c) => c.content),
      10
    );
    clearTimeout(timeout);
    return reranked.map((r) => ({
      ...candidates[r.index],
      relevanceScore: r.relevanceScore,
    }));
  } catch {
    clearTimeout(timeout);
    // Fallback to original vector ranking
    return candidates.slice(0, 10);
  }
}
```

---

## Score Thresholding

Don't just take top-N. Use score thresholds to avoid injecting irrelevant context.

```typescript
interface ThresholdConfig {
  absoluteMin: number;      // Hard floor — nothing below this
  relativeDropoff: number;  // Max allowed drop from top score (ratio)
  maxResults: number;       // Hard cap
}

function applyScoreThreshold(
  results: RerankedResult[],
  config: ThresholdConfig = {
    absoluteMin: 0.3,
    relativeDropoff: 0.5,
    maxResults: 10,
  }
): RerankedResult[] {
  if (results.length === 0) return [];

  const topScore = results[0].relevanceScore;
  const threshold = Math.max(
    config.absoluteMin,
    topScore * config.relativeDropoff
  );

  return results
    .filter((r) => r.relevanceScore >= threshold)
    .slice(0, config.maxResults);
}
```

---

## Production Checklist

1. **Always log reranking scores** — you need this data to tune thresholds
2. **A/B test reranking** — measure actual answer quality, not just retrieval metrics
3. **Monitor reranker latency p99** — spikes indicate model loading issues or batch size problems
4. **Set fallback behavior** — if reranker is down, fall back to vector-only gracefully
5. **Cache reranking results** — same query + same candidates = same reranking (deterministic models)
6. **Batch reranking requests** — if multiple users query similar things, batch the cross-encoder calls
7. **Profile your score distribution** — if 90% of results score > 0.8, your threshold is too low

---

## Key Takeaways

- Reranking is the highest-ROI improvement you can make to a RAG pipeline after getting basic retrieval working
- Cross-encoders are the gold standard for quality; ColBERT is the best latency/quality tradeoff
- MMR handles diversity; RRF handles score fusion from multiple sources
- Always have a fallback path when reranking fails or times out
- Score thresholds prevent garbage from entering your LLM context window
- Measure everything — the right reranking strategy depends on YOUR data and YOUR latency budget
