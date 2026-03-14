# RAG Query Decomposition & Expansion

## Purpose
Users rarely write queries optimized for retrieval. They write natural language — ambiguous, multi-part, implicit. Query decomposition breaks complex questions into retrievable sub-queries. Query expansion reformulates queries to match how information is actually stored. This seed covers HyDE, multi-query retrieval, step-back prompting, sub-query decomposition, and contextual compression.

---

## The Core Problem

```
User query: "How does our billing system handle failed payments
             and what's the retry logic?"

What the user needs:
  1. How payment failures are detected
  2. What happens when a payment fails
  3. The retry schedule and logic
  4. Edge cases (card expired, insufficient funds, etc.)

What vector search finds with raw query:
  - Generic billing docs (low specificity)
  - Maybe the retry config (if lucky)
  - Misses: error handling, webhook processing, state machine
```

**The gap between what users ask and what retrieval finds is the #1 failure mode in production RAG systems.**

---

## Strategy 1: Sub-Query Decomposition

Break a complex query into independent, retrievable sub-queries. Run each sub-query against the index. Merge results.

### TypeScript Implementation

```typescript
interface SubQuery {
  query: string;
  intent: string;
  priority: number;
}

async function decomposeQuery(
  originalQuery: string,
  llmEndpoint: string
): Promise<SubQuery[]> {
  const prompt = `You are a query decomposition engine for a RAG system.

Given a user's question, break it into independent sub-questions that can each
be answered by searching a knowledge base separately.

Rules:
1. Each sub-question should be self-contained (no pronouns referring to other sub-questions)
2. Each sub-question should target ONE specific piece of information
3. Order by logical dependency (foundational questions first)
4. Include 2-5 sub-questions (no more)
5. Return JSON array only

User question: "${originalQuery}"

Return format:
[{"query": "...", "intent": "...", "priority": 1}, ...]`;

  const response = await fetch(llmEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      max_tokens: 500,
      temperature: 0,
    }),
  });

  const data = await response.json();
  return JSON.parse(data.text);
}

// Full pipeline: decompose → retrieve for each → merge
async function decomposedRetrieval(
  query: string,
  embedFn: (text: string) => Promise<number[]>,
  searchFn: (embedding: number[], topK: number) => Promise<SearchResult[]>,
  llmEndpoint: string
): Promise<SearchResult[]> {
  const subQueries = await decomposeQuery(query, llmEndpoint);

  // Retrieve for each sub-query in parallel
  const allResults = await Promise.all(
    subQueries.map(async (sq) => {
      const embedding = await embedFn(sq.query);
      const results = await searchFn(embedding, 10);
      return results.map((r) => ({
        ...r,
        sourceSubQuery: sq.query,
        subQueryPriority: sq.priority,
      }));
    })
  );

  // Flatten, deduplicate by document ID, sort by combined relevance
  const seen = new Set<string>();
  const merged: SearchResult[] = [];

  // Priority-weighted deduplication
  const flat = allResults
    .flat()
    .sort((a, b) => {
      // Higher priority sub-queries get preference
      if (a.subQueryPriority !== b.subQueryPriority) {
        return a.subQueryPriority - b.subQueryPriority;
      }
      return b.score - a.score;
    });

  for (const result of flat) {
    if (!seen.has(result.id)) {
      seen.add(result.id);
      merged.push(result);
    }
  }

  return merged;
}
```

### When To Decompose
- Query contains "and" joining distinct topics
- Query has multiple question marks
- Query references a process with multiple steps
- Query asks for comparison between things

### When NOT To Decompose
- Simple factual lookups ("What is the API rate limit?")
- Queries that are already atomic
- When latency budget doesn't allow multiple LLM calls

---

## Strategy 2: HyDE (Hypothetical Document Embeddings)

### What It Is
Instead of embedding the QUERY, generate a hypothetical ANSWER and embed THAT. The intuition: a hypothetical answer is more similar to the actual answer than the question is.

### Why It Works
```
Query:     "How do we handle webhook failures?"
HyDE doc:  "When a webhook delivery fails, the system retries with
            exponential backoff starting at 30 seconds. After 5 failed
            attempts, the webhook is marked as failed and an alert is
            sent to the ops channel..."

The HyDE document shares vocabulary and structure with the ACTUAL
documentation, making embedding similarity much higher.
```

### TypeScript Implementation

```typescript
async function hydeRetrieval(
  query: string,
  llmEndpoint: string,
  embedFn: (text: string) => Promise<number[]>,
  searchFn: (embedding: number[], topK: number) => Promise<SearchResult[]>,
  numHypothetical: number = 3
): Promise<SearchResult[]> {
  // Generate hypothetical documents
  const hydePrompt = `Given the following question, write a short paragraph
that would be a plausible answer found in technical documentation.
Do not hedge or say "I don't know." Write as if you are the documentation.
Write ${numHypothetical} different versions, each taking a different angle.

Question: "${query}"

Return as JSON array of strings.`;

  const llmResponse = await fetch(llmEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: hydePrompt,
      max_tokens: 800,
      temperature: 0.7, // Some variation helps diversity
    }),
  });

  const hypotheticalDocs: string[] = JSON.parse(
    (await llmResponse.json()).text
  );

  // Embed all hypothetical docs + original query
  const allTexts = [query, ...hypotheticalDocs];
  const embeddings = await Promise.all(allTexts.map(embedFn));

  // Average the embeddings (query + hypothetical docs)
  const avgEmbedding = averageEmbeddings(embeddings);

  // Search with averaged embedding
  return searchFn(avgEmbedding, 20);
}

function averageEmbeddings(embeddings: number[][]): number[] {
  const dim = embeddings[0].length;
  const avg = new Array(dim).fill(0);
  for (const emb of embeddings) {
    for (let i = 0; i < dim; i++) {
      avg[i] += emb[i];
    }
  }
  for (let i = 0; i < dim; i++) {
    avg[i] /= embeddings.length;
  }
  return avg;
}
```

### Anti-Patterns
- **HyDE with factual queries**: "What is the port number for Redis?" — HyDE adds latency with no benefit. The query itself is fine.
- **HyDE with ambiguous queries**: If the LLM generates a wrong hypothetical answer, it can MISLEAD retrieval. Always include the original query embedding as part of the search.
- **Too many hypothetical docs**: 3-5 is the sweet spot. More than 5 dilutes the signal.

---

## Strategy 3: Multi-Query Retrieval

Generate multiple rephrasings of the same query. Retrieve for each. Union the results.

```typescript
async function multiQueryRetrieval(
  query: string,
  llmEndpoint: string,
  embedFn: (text: string) => Promise<number[]>,
  searchFn: (embedding: number[], topK: number) => Promise<SearchResult[]>
): Promise<SearchResult[]> {
  const rephrasingPrompt = `Generate 4 different ways to ask the following
question. Each rephrasing should use different vocabulary and angle, but
seek the same information. Return as a JSON array of strings.

Original question: "${query}"`;

  const response = await fetch(llmEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: rephrasingPrompt,
      max_tokens: 400,
      temperature: 0.4,
    }),
  });

  const rephrasings: string[] = JSON.parse((await response.json()).text);
  const allQueries = [query, ...rephrasings];

  // Retrieve for each query variation
  const resultSets = await Promise.all(
    allQueries.map(async (q) => {
      const emb = await embedFn(q);
      return searchFn(emb, 15);
    })
  );

  // RRF fusion across all result sets
  return reciprocalRankFusion(...resultSets);
}

function reciprocalRankFusion(
  ...lists: SearchResult[][]
): SearchResult[] {
  const k = 60;
  const scores = new Map<string, { result: SearchResult; score: number }>();

  for (const list of lists) {
    for (let rank = 0; rank < list.length; rank++) {
      const item = list[rank];
      const existing = scores.get(item.id);
      const contribution = 1 / (k + rank + 1);

      if (existing) {
        existing.score += contribution;
      } else {
        scores.set(item.id, { result: item, score: contribution });
      }
    }
  }

  return Array.from(scores.values())
    .sort((a, b) => b.score - a.score)
    .map(({ result, score }) => ({ ...result, score }));
}
```

### Multi-Query vs HyDE
| Aspect | Multi-Query | HyDE |
|--------|------------|------|
| What it generates | Question rephrasings | Answer approximations |
| Best for | Vocabulary mismatch | Concept-level retrieval |
| LLM quality needed | Low (rephrasing is easy) | Medium (answer quality matters) |
| Risk | Low (all queries are valid) | Medium (wrong answer misleads) |
| Latency | N embedding calls | N embedding calls + longer generation |

---

## Strategy 4: Step-Back Prompting

Ask a more general version of the query first, retrieve broad context, then answer the specific question.

```typescript
async function stepBackRetrieval(
  specificQuery: string,
  llmEndpoint: string,
  embedFn: (text: string) => Promise<number[]>,
  searchFn: (embedding: number[], topK: number) => Promise<SearchResult[]>
): Promise<{ broadContext: SearchResult[]; specificContext: SearchResult[] }> {
  // Generate step-back question
  const stepBackPrompt = `Given this specific question, generate a broader,
more general question that would provide useful background context.

Specific: "Why did our p99 latency spike on March 5th?"
Step-back: "How does our system's latency monitoring and alerting work?"

Specific: "How do I fix error code E-4012 in the payment module?"
Step-back: "What is the payment module's error handling architecture?"

Specific: "${specificQuery}"
Step-back:`;

  const response = await fetch(llmEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: stepBackPrompt,
      max_tokens: 100,
      temperature: 0,
    }),
  });

  const stepBackQuery = (await response.json()).text.trim();

  // Retrieve for both broad and specific queries
  const [broadEmb, specificEmb] = await Promise.all([
    embedFn(stepBackQuery),
    embedFn(specificQuery),
  ]);

  const [broadContext, specificContext] = await Promise.all([
    searchFn(broadEmb, 10),
    searchFn(specificEmb, 10),
  ]);

  return { broadContext, specificContext };
}
```

### When Step-Back Helps
- Debugging questions ("Why did X fail?") — need architectural context
- "How to" questions about complex systems — need overview first
- Questions about edge cases — need to understand the normal flow first

---

## Strategy 5: Contextual Compression

After retrieval, compress the retrieved documents to only include parts relevant to the query. Reduces token usage and removes noise.

```typescript
async function contextualCompression(
  query: string,
  documents: string[],
  llmEndpoint: string,
  maxTokensPerDoc: number = 200
): Promise<string[]> {
  const compressionPrompts = documents.map(
    (doc) => `Given the following question and document, extract ONLY the
sentences or fragments from the document that are relevant to answering the
question. If nothing is relevant, return "NOT_RELEVANT".

Question: ${query}

Document:
${doc}

Relevant extract:`
  );

  // Compress all documents in parallel
  const compressed = await Promise.all(
    compressionPrompts.map(async (prompt) => {
      const response = await fetch(llmEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          max_tokens: maxTokensPerDoc,
          temperature: 0,
        }),
      });
      return (await response.json()).text.trim();
    })
  );

  // Filter out irrelevant docs
  return compressed.filter((c) => c !== 'NOT_RELEVANT' && c.length > 20);
}
```

### Compression Anti-Patterns
- **Compressing already-short chunks**: If chunks are 100-200 tokens, compression adds latency with little token savings.
- **Lossy compression of code**: LLM compression can mangle code examples. Only compress prose.
- **Compressing before reranking**: Rerank first (on full text), then compress (to save context tokens).

---

## Strategy 6: Query Routing

Route different query types to different retrieval strategies.

```typescript
type QueryType = 'factual' | 'conceptual' | 'procedural' | 'debugging' | 'comparison';

interface RoutingDecision {
  queryType: QueryType;
  strategies: string[];
  indexes: string[];
}

async function routeQuery(
  query: string,
  llmEndpoint: string
): Promise<RoutingDecision> {
  const routingPrompt = `Classify this query and recommend retrieval strategy.

Query types:
- factual: Looking for a specific fact, number, config value
- conceptual: Understanding a concept, architecture, design decision
- procedural: How to do something step by step
- debugging: Why something went wrong, error investigation
- comparison: Comparing options, tradeoffs, alternatives

Query: "${query}"

Return JSON: {"queryType": "...", "strategies": [...], "indexes": [...]}

Strategy options: ["direct", "decompose", "hyde", "multi_query", "step_back"]
Index options: ["code", "docs", "config", "logs", "all"]`;

  const response = await fetch(llmEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: routingPrompt,
      max_tokens: 200,
      temperature: 0,
    }),
  });

  return JSON.parse((await response.json()).text);
}

// Master orchestrator
async function intelligentRetrieval(
  query: string,
  llmEndpoint: string,
  embedFn: (text: string) => Promise<number[]>,
  searchFn: (embedding: number[], topK: number) => Promise<SearchResult[]>
): Promise<SearchResult[]> {
  const routing = await routeQuery(query, llmEndpoint);

  switch (routing.queryType) {
    case 'factual':
      // Direct retrieval — fast, no decomposition needed
      const emb = await embedFn(query);
      return searchFn(emb, 10);

    case 'conceptual':
      // HyDE works well for conceptual queries
      return hydeRetrieval(query, llmEndpoint, embedFn, searchFn);

    case 'procedural':
      // Decompose into steps
      return decomposedRetrieval(query, embedFn, searchFn, llmEndpoint);

    case 'debugging':
      // Step-back to get architecture context + specific search
      const { broadContext, specificContext } = await stepBackRetrieval(
        query, llmEndpoint, embedFn, searchFn
      );
      return [...specificContext, ...broadContext];

    case 'comparison':
      // Multi-query to cover both sides of comparison
      return multiQueryRetrieval(query, llmEndpoint, embedFn, searchFn);

    default:
      const defaultEmb = await embedFn(query);
      return searchFn(defaultEmb, 10);
  }
}
```

---

## Pipeline Composition

The real power is combining strategies. Here's a production pipeline:

```typescript
async function productionRetrievalPipeline(
  userQuery: string,
  config: PipelineConfig
): Promise<RetrievalResult> {
  // Step 1: Route the query
  const routing = await routeQuery(userQuery, config.llmEndpoint);

  // Step 2: Apply appropriate expansion strategy
  let expandedQueries: string[];
  if (routing.strategies.includes('decompose')) {
    const subQueries = await decomposeQuery(userQuery, config.llmEndpoint);
    expandedQueries = subQueries.map((sq) => sq.query);
  } else if (routing.strategies.includes('multi_query')) {
    expandedQueries = await generateRephrasings(userQuery, config.llmEndpoint);
  } else {
    expandedQueries = [userQuery];
  }

  // Step 3: Retrieve for all expanded queries
  const allResults = await Promise.all(
    expandedQueries.map(async (q) => {
      const emb = await config.embedFn(q);
      return config.searchFn(emb, 30);
    })
  );

  // Step 4: Fuse results
  let fused = reciprocalRankFusion(...allResults);

  // Step 5: Rerank (if budget allows)
  if (config.enableReranking && fused.length > 5) {
    fused = await crossEncoderRerank(userQuery, fused, 15);
  }

  // Step 6: Compress
  if (config.enableCompression) {
    const compressed = await contextualCompression(
      userQuery,
      fused.map((f) => f.content),
      config.llmEndpoint
    );
    fused = fused.slice(0, compressed.length).map((f, i) => ({
      ...f,
      content: compressed[i],
    }));
  }

  // Step 7: Apply score threshold
  fused = fused.filter((f) => f.score > config.scoreThreshold);

  return {
    results: fused.slice(0, config.maxResults),
    metadata: {
      routing,
      expandedQueries,
      totalCandidates: allResults.flat().length,
      afterReranking: fused.length,
    },
  };
}
```

---

## Decision Matrix

| User Query Pattern | Best Strategy | Latency Impact | Quality Impact |
|-------------------|---------------|----------------|----------------|
| Simple fact lookup | Direct | None | Baseline |
| "What is X and how does Y?" | Decomposition | +200-400ms | +30-50% |
| Technical jargon mismatch | Multi-Query | +150-300ms | +20-35% |
| "Explain the architecture of..." | HyDE | +200-500ms | +25-40% |
| "Why did X fail?" | Step-Back | +200-400ms | +30-45% |
| Long, rambling question | Compression | +100-200ms | +15-25% (token savings) |
| Unknown query type | Route first | +50-100ms | Varies |

---

## Key Takeaways

- Raw user queries are rarely optimal for retrieval — always consider transformation
- Decomposition handles multi-part queries; HyDE handles vocabulary mismatch; Multi-Query handles rephrasing gaps
- Step-back prompting is underrated — it provides the architectural context debugging questions need
- Query routing prevents applying expensive strategies to simple queries
- Compression saves tokens but should happen AFTER reranking, not before
- Always preserve the original query as one of the search vectors — expansions can drift
- Measure the marginal gain of each strategy on YOUR data — not all strategies help all domains
