# RAG Agentic Patterns

## Purpose
Standard RAG is a single pass: retrieve, then generate. Agentic RAG adds loops, decisions, and tool use — the system can decide WHEN to retrieve, WHAT to retrieve, whether the retrieval was good enough, and whether to try again with a different strategy. This seed covers tool-augmented retrieval, iterative retrieval, self-reflective RAG, corrective RAG (CRAG), adaptive retrieval, and query routing to specialized indexes.

---

## The Agentic RAG Spectrum

```
Level 0: Naive RAG        → Always retrieve, always use retrieved context
Level 1: Adaptive RAG     → Decide WHETHER to retrieve
Level 2: Corrective RAG   → Evaluate retrieval quality, retry if bad
Level 3: Iterative RAG    → Multiple retrieval rounds, building context
Level 4: Self-Reflective  → Evaluate own answer, re-retrieve if needed
Level 5: Tool-Augmented   → Use retrieval as one tool among many
Level 6: Multi-Agent RAG  → Multiple specialized retrieval agents coordinate
```

Each level adds capability but also latency and complexity. Choose the right level for your use case.

---

## Level 1: Adaptive Retrieval (Decide When to Retrieve)

### The Problem
Not every query needs retrieval. "What is 2+2?" doesn't need a knowledge base lookup. Unnecessary retrieval adds latency and can inject confusing context.

### Implementation

```typescript
type RetrievalDecision = 'retrieve' | 'generate_directly' | 'clarify';

async function shouldRetrieve(
  query: string,
  conversationHistory: string[],
  llmEndpoint: string
): Promise<RetrievalDecision> {
  const prompt = `You are a routing agent. Given the user's query and conversation history, decide:

1. RETRIEVE — The query asks about specific facts, documents, policies, or domain knowledge that requires looking up information.
2. GENERATE_DIRECTLY — The query is conversational, mathematical, logical, or asks for general knowledge the model already knows (common sense, well-known facts, basic instructions).
3. CLARIFY — The query is too ambiguous to answer well. Ask for clarification.

Conversation: ${conversationHistory.slice(-3).join('\n')}
Query: ${query}

Respond with EXACTLY one word: RETRIEVE, GENERATE_DIRECTLY, or CLARIFY`;

  const response = await callLLM(prompt, llmEndpoint);
  const decision = response.trim().toUpperCase();

  const map: Record<string, RetrievalDecision> = {
    RETRIEVE: 'retrieve',
    GENERATE_DIRECTLY: 'generate_directly',
    CLARIFY: 'clarify',
  };

  return map[decision] ?? 'retrieve'; // Default to retrieving if uncertain
}

// Full adaptive pipeline
async function adaptiveRAG(
  query: string,
  history: string[],
  llmEndpoint: string,
  ragPipeline: (q: string) => Promise<{ answer: string; contexts: string[] }>
): Promise<{ answer: string; contexts: string[]; strategy: string }> {
  const decision = await shouldRetrieve(query, history, llmEndpoint);

  switch (decision) {
    case 'generate_directly':
      const directAnswer = await callLLM(
        `${history.join('\n')}\nUser: ${query}\nAssistant:`,
        llmEndpoint
      );
      return { answer: directAnswer, contexts: [], strategy: 'direct' };

    case 'clarify':
      return {
        answer: 'Could you provide more details about what you\'re looking for?',
        contexts: [],
        strategy: 'clarify',
      };

    case 'retrieve':
    default:
      const result = await ragPipeline(query);
      return { ...result, strategy: 'retrieve' };
  }
}
```

---

## Level 2: Corrective RAG (CRAG)

### The Core Idea
After retrieval, evaluate whether the retrieved documents are actually relevant. If not, try alternative retrieval strategies or fall back to the LLM's parametric knowledge.

### Implementation

```typescript
type RetrievalQuality = 'correct' | 'ambiguous' | 'incorrect';

interface CRAGResult {
  answer: string;
  contexts: string[];
  quality: RetrievalQuality;
  strategy: string;
  attempts: number;
}

async function correctiveRAG(
  query: string,
  retrieveFn: (q: string, strategy: string) => Promise<string[]>,
  llmEndpoint: string,
  maxAttempts: number = 3
): Promise<CRAGResult> {
  const strategies = ['semantic', 'keyword', 'hybrid', 'web_search'];
  let bestContexts: string[] = [];
  let bestQuality: RetrievalQuality = 'incorrect';
  let attempts = 0;

  for (const strategy of strategies) {
    if (attempts >= maxAttempts) break;
    attempts++;

    const contexts = await retrieveFn(query, strategy);

    // Evaluate retrieval quality
    const quality = await evaluateRetrievalQuality(
      query, contexts, llmEndpoint
    );

    if (quality === 'correct') {
      bestContexts = contexts;
      bestQuality = quality;
      break;
    }

    if (quality === 'ambiguous' && bestQuality !== 'correct') {
      bestContexts = contexts;
      bestQuality = quality;
    }
  }

  // Generate answer based on quality assessment
  let answer: string;

  if (bestQuality === 'correct') {
    answer = await generateWithContext(query, bestContexts, llmEndpoint);
  } else if (bestQuality === 'ambiguous') {
    // Refine context — extract only relevant parts
    const refined = await refineContext(query, bestContexts, llmEndpoint);
    answer = await generateWithContext(query, refined, llmEndpoint);
  } else {
    // No good retrieval — fall back to parametric knowledge with caveat
    answer = await callLLM(
      `Answer this question based on your general knowledge. If you're not confident, say so.\n\nQuestion: ${query}`,
      llmEndpoint
    );
  }

  return {
    answer,
    contexts: bestContexts,
    quality: bestQuality,
    strategy: strategies[attempts - 1],
    attempts,
  };
}

async function evaluateRetrievalQuality(
  query: string,
  contexts: string[],
  llmEndpoint: string
): Promise<RetrievalQuality> {
  if (contexts.length === 0) return 'incorrect';

  const prompt = `Evaluate whether these retrieved documents are relevant to answering the query.

Query: ${query}

Retrieved Documents:
${contexts.map((c, i) => `[${i + 1}] ${c.substring(0, 300)}`).join('\n\n')}

Assessment:
- CORRECT: At least one document contains information that directly answers or is highly relevant to the query
- AMBIGUOUS: Documents are somewhat related but may not fully answer the query
- INCORRECT: Documents are irrelevant to the query

Respond with EXACTLY one word: CORRECT, AMBIGUOUS, or INCORRECT`;

  const response = await callLLM(prompt, llmEndpoint);
  const label = response.trim().toUpperCase();

  const map: Record<string, RetrievalQuality> = {
    CORRECT: 'correct',
    AMBIGUOUS: 'ambiguous',
    INCORRECT: 'incorrect',
  };

  return map[label] ?? 'ambiguous';
}

async function refineContext(
  query: string,
  contexts: string[],
  llmEndpoint: string
): Promise<string[]> {
  const prompt = `Given the query, extract ONLY the sentences from the context that are relevant.
Remove irrelevant information. Keep facts, numbers, and specific details.

Query: ${query}
Context: ${contexts.join('\n---\n')}

Output ONLY the relevant sentences, one per line.`;

  const response = await callLLM(prompt, llmEndpoint);
  return response.split('\n').filter((line: string) => line.trim().length > 0);
}

async function generateWithContext(
  query: string,
  contexts: string[],
  llmEndpoint: string
): Promise<string> {
  const prompt = `Answer the following question using ONLY the provided context. If the context doesn't contain enough information, say so.

Context:
${contexts.join('\n---\n')}

Question: ${query}`;

  return await callLLM(prompt, llmEndpoint);
}
```

---

## Level 3: Iterative Retrieval

### The Pattern
For complex questions, one retrieval round isn't enough. The answer to the first sub-question informs what you need to retrieve next.

```typescript
interface IterativeRAGState {
  originalQuery: string;
  subQueries: string[];
  retrievedContexts: Map<string, string[]>;
  partialAnswers: string[];
  iteration: number;
  maxIterations: number;
}

async function iterativeRAG(
  query: string,
  retrieveFn: (q: string) => Promise<string[]>,
  llmEndpoint: string,
  maxIterations: number = 3
): Promise<{ answer: string; allContexts: string[]; iterations: number }> {
  const state: IterativeRAGState = {
    originalQuery: query,
    subQueries: [query],
    retrievedContexts: new Map(),
    partialAnswers: [],
    iteration: 0,
    maxIterations,
  };

  while (state.iteration < state.maxIterations) {
    state.iteration++;

    // Retrieve for current sub-queries
    for (const sq of state.subQueries) {
      if (state.retrievedContexts.has(sq)) continue;
      const contexts = await retrieveFn(sq);
      state.retrievedContexts.set(sq, contexts);
    }

    // Attempt to answer with all accumulated context
    const allContexts = Array.from(state.retrievedContexts.values()).flat();
    const attemptPrompt = `Given the following context, answer the question. If you need more information to fully answer, state what specific information is missing.

Context:
${allContexts.join('\n---\n')}

Question: ${state.originalQuery}

If you can fully answer the question, start with "FINAL ANSWER:" followed by your answer.
If you need more information, start with "NEED MORE:" followed by what specific information would help.`;

    const attempt = await callLLM(attemptPrompt, llmEndpoint);

    if (attempt.startsWith('FINAL ANSWER:')) {
      return {
        answer: attempt.replace('FINAL ANSWER:', '').trim(),
        allContexts,
        iterations: state.iteration,
      };
    }

    // Generate new sub-queries based on what's missing
    const missingInfo = attempt.replace('NEED MORE:', '').trim();
    const newQueriesPrompt = `Based on the original question and missing information, generate 1-2 specific search queries.

Original question: ${state.originalQuery}
Missing information: ${missingInfo}

Output one query per line, nothing else.`;

    const newQueries = await callLLM(newQueriesPrompt, llmEndpoint);
    state.subQueries = newQueries
      .split('\n')
      .map((q: string) => q.trim())
      .filter((q: string) => q.length > 0)
      .slice(0, 2);
  }

  // Max iterations reached — generate best answer with what we have
  const allContexts = Array.from(state.retrievedContexts.values()).flat();
  const finalAnswer = await generateWithContext(
    query, allContexts, llmEndpoint
  );

  return {
    answer: finalAnswer,
    allContexts,
    iterations: state.iteration,
  };
}
```

---

## Level 4: Self-Reflective RAG

### The Pattern
Generate an answer, then critique it. If the critique finds issues, re-retrieve and regenerate.

```typescript
interface ReflectionResult {
  isAccurate: boolean;
  issues: string[];
  suggestedQueries: string[];
}

async function selfReflectiveRAG(
  query: string,
  retrieveFn: (q: string) => Promise<string[]>,
  llmEndpoint: string,
  maxReflections: number = 2
): Promise<{ answer: string; reflections: number; finalConfidence: number }> {
  let contexts = await retrieveFn(query);
  let answer = await generateWithContext(query, contexts, llmEndpoint);
  let reflections = 0;

  for (let i = 0; i < maxReflections; i++) {
    reflections++;
    const reflection = await reflectOnAnswer(
      query, answer, contexts, llmEndpoint
    );

    if (reflection.isAccurate) break;

    // Re-retrieve with suggested queries
    for (const sq of reflection.suggestedQueries) {
      const newContexts = await retrieveFn(sq);
      contexts = [...contexts, ...newContexts];
    }

    // Regenerate with enriched context
    answer = await generateWithContext(query, contexts, llmEndpoint);
  }

  const confidence = await assessConfidence(query, answer, contexts, llmEndpoint);

  return { answer, reflections, finalConfidence: confidence };
}

async function reflectOnAnswer(
  query: string,
  answer: string,
  contexts: string[],
  llmEndpoint: string
): Promise<ReflectionResult> {
  const prompt = `You are a critical reviewer. Evaluate this answer for accuracy and completeness.

Question: ${query}

Answer: ${answer}

Available Context:
${contexts.map((c, i) => `[${i + 1}] ${c.substring(0, 200)}`).join('\n')}

Check for:
1. Claims not supported by the context (hallucination)
2. Important information in the context that the answer missed
3. Logical errors or contradictions
4. Ambiguous statements that should be more specific

Respond in JSON:
{
  "isAccurate": true/false,
  "issues": ["issue 1", "issue 2"],
  "suggestedQueries": ["query to find missing info"]
}`;

  const response = await callLLM(prompt, llmEndpoint);
  return JSON.parse(response);
}

async function assessConfidence(
  query: string,
  answer: string,
  contexts: string[],
  llmEndpoint: string
): Promise<number> {
  const prompt = `Rate your confidence that this answer correctly and completely addresses the question, on a scale of 0.0 to 1.0.

Question: ${query}
Answer: ${answer}
Context available: ${contexts.length} documents

Consider: Is the answer supported by context? Is it complete? Are there any hedged or uncertain statements?

Respond with ONLY a number between 0.0 and 1.0.`;

  const response = await callLLM(prompt, llmEndpoint);
  return parseFloat(response.trim()) || 0.5;
}
```

---

## Level 5: Tool-Augmented Retrieval

### The Pattern
Retrieval is just one tool. The agent can also calculate, query databases, call APIs, or run code.

```typescript
interface Tool {
  name: string;
  description: string;
  execute: (input: string) => Promise<string>;
}

async function toolAugmentedRAG(
  query: string,
  tools: Tool[],
  llmEndpoint: string,
  maxSteps: number = 5
): Promise<{ answer: string; toolCalls: Array<{ tool: string; input: string; output: string }> }> {
  const toolDescriptions = tools
    .map((t) => `- ${t.name}: ${t.description}`)
    .join('\n');

  const toolCalls: Array<{ tool: string; input: string; output: string }> = [];
  let context = '';

  for (let step = 0; step < maxSteps; step++) {
    const prompt = `You are an AI assistant with access to these tools:
${toolDescriptions}

User question: ${query}

${context ? `Information gathered so far:\n${context}\n` : ''}

Decide your next action. Either:
1. Use a tool: respond with "TOOL: <tool_name>\nINPUT: <input>"
2. Give final answer: respond with "ANSWER: <your answer>"

Choose wisely — only use tools when needed.`;

    const response = await callLLM(prompt, llmEndpoint);

    if (response.startsWith('ANSWER:')) {
      return {
        answer: response.replace('ANSWER:', '').trim(),
        toolCalls,
      };
    }

    if (response.startsWith('TOOL:')) {
      const lines = response.split('\n');
      const toolName = lines[0].replace('TOOL:', '').trim();
      const toolInput = lines[1]?.replace('INPUT:', '').trim() ?? '';

      const tool = tools.find((t) => t.name === toolName);
      if (!tool) {
        context += `\n[Error: Tool "${toolName}" not found]\n`;
        continue;
      }

      try {
        const output = await tool.execute(toolInput);
        toolCalls.push({ tool: toolName, input: toolInput, output });
        context += `\n[${toolName}(${toolInput})] → ${output}\n`;
      } catch (error) {
        context += `\n[${toolName} error: ${error}]\n`;
      }
    }
  }

  // Max steps reached
  const fallbackAnswer = await callLLM(
    `Based on this information, answer: ${query}\n\nContext: ${context}`,
    llmEndpoint
  );

  return { answer: fallbackAnswer, toolCalls };
}

// Example tools
const ragTools: Tool[] = [
  {
    name: 'search_docs',
    description: 'Search the knowledge base for relevant documents. Input: search query string.',
    execute: async (input: string) => {
      const results = await vectorSearch(input);
      return results.map((r) => r.content).join('\n---\n');
    },
  },
  {
    name: 'calculate',
    description: 'Perform mathematical calculations. Input: mathematical expression.',
    execute: async (input: string) => {
      try {
        // Safe eval for math only
        const result = Function(`"use strict"; return (${input})`)();
        return String(result);
      } catch {
        return 'Error: Invalid expression';
      }
    },
  },
  {
    name: 'query_database',
    description: 'Query the database for structured data. Input: natural language question about data.',
    execute: async (input: string) => {
      // Convert natural language to SQL (with safety checks)
      const sql = await naturalLanguageToSQL(input);
      const result = await pool.query(sql);
      return JSON.stringify(result.rows.slice(0, 20));
    },
  },
];
```

---

## Query Routing to Specialized Indexes

```typescript
interface IndexConfig {
  name: string;
  description: string;
  tableName: string;
  embeddingColumn: string;
  contentColumn: string;
  topK: number;
}

const specializedIndexes: IndexConfig[] = [
  {
    name: 'documentation',
    description: 'Product documentation, guides, tutorials, and how-to articles',
    tableName: 'doc_chunks',
    embeddingColumn: 'embedding',
    contentColumn: 'content',
    topK: 10,
  },
  {
    name: 'code',
    description: 'Source code, API references, code examples, and technical implementations',
    tableName: 'code_chunks',
    embeddingColumn: 'code_embedding',
    contentColumn: 'content',
    topK: 8,
  },
  {
    name: 'support',
    description: 'Customer support tickets, FAQ, troubleshooting guides, known issues',
    tableName: 'support_chunks',
    embeddingColumn: 'embedding',
    contentColumn: 'content',
    topK: 5,
  },
  {
    name: 'policy',
    description: 'Terms of service, privacy policy, billing rules, compliance documents',
    tableName: 'policy_chunks',
    embeddingColumn: 'embedding',
    contentColumn: 'content',
    topK: 5,
  },
];

async function routeQuery(
  query: string,
  llmEndpoint: string
): Promise<IndexConfig[]> {
  const indexDescriptions = specializedIndexes
    .map((idx) => `- ${idx.name}: ${idx.description}`)
    .join('\n');

  const prompt = `Given this query, which knowledge indexes should be searched? Select 1-2 most relevant.

Available indexes:
${indexDescriptions}

Query: ${query}

Respond with index names separated by commas (e.g., "documentation,code"). Choose the most relevant.`;

  const response = await callLLM(prompt, llmEndpoint);
  const selectedNames = response.split(',').map((n: string) => n.trim().toLowerCase());

  return specializedIndexes.filter((idx) =>
    selectedNames.includes(idx.name.toLowerCase())
  );
}

async function routedSearch(
  query: string,
  queryEmbedding: number[],
  pool: any,
  llmEndpoint: string
): Promise<Array<{ content: string; score: number; source: string }>> {
  const selectedIndexes = await routeQuery(query, llmEndpoint);

  const results = await Promise.all(
    selectedIndexes.map(async (idx) => {
      const result = await pool.query(
        `SELECT ${idx.contentColumn} as content,
                1 - (${idx.embeddingColumn} <=> $1::vector) as score
         FROM ${idx.tableName}
         ORDER BY ${idx.embeddingColumn} <=> $1::vector
         LIMIT $2`,
        [JSON.stringify(queryEmbedding), idx.topK]
      );

      return result.rows.map((r: any) => ({
        content: r.content,
        score: r.score,
        source: idx.name,
      }));
    })
  );

  return results.flat().sort((a, b) => b.score - a.score);
}
```

---

## Decision Matrix: Which Pattern When

| Scenario | Pattern | Level | Latency Impact |
|---|---|---|---|
| Simple factual queries | Standard RAG | 0 | None |
| Mixed queries (some need retrieval, some don't) | Adaptive | 1 | +50ms routing |
| Noisy knowledge base | Corrective (CRAG) | 2 | +200-500ms eval |
| Complex multi-part questions | Iterative | 3 | 2-3x baseline |
| High-stakes accuracy requirements | Self-Reflective | 4 | 2-4x baseline |
| Questions needing calculation + retrieval | Tool-Augmented | 5 | Variable |
| Multiple knowledge domains | Query Routing | 1-2 | +50-100ms |

---

## Anti-Patterns

- **Always retrieving**: Wastes latency on queries that don't need it. Use adaptive retrieval.
- **Infinite loops**: Always cap iterations/reflections. Set maxAttempts.
- **Reflection without action**: If reflection finds issues but doesn't trigger re-retrieval, it's wasted compute.
- **Over-routing**: Querying 5 indexes when 1 would suffice. Route to 1-2 max.
- **No fallback**: If all retrieval strategies fail, fall back to parametric knowledge with a confidence disclaimer.
- **Hiding the strategy from users**: In production, log which strategy was used. Essential for debugging.

---

## Key Takeaways

- Standard RAG is Level 0. Most production systems should be at Level 1-2 minimum.
- Adaptive retrieval (decide when to retrieve) saves 30-50% of unnecessary retrievals.
- CRAG (corrective RAG) catches bad retrievals before they pollute answers.
- Iterative retrieval handles complex queries that standard single-pass RAG cannot.
- Self-reflection adds a quality gate but doubles latency — use for high-stakes queries.
- Tool augmentation makes RAG part of a larger agent toolkit, not the whole system.
- Always set iteration limits. Agentic loops without bounds will burn tokens and time.
