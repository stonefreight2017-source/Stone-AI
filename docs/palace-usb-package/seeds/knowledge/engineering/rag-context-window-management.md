# RAG Context Window Management

## Purpose
The context window is your most expensive resource. Every token you waste on irrelevant context is a token that could have carried useful information. This seed covers token budgeting, context compression, lost-in-the-middle mitigation, sliding window strategies, priority-based context loading, and truncation strategies for production RAG systems.

---

## The Token Budget Framework

### Understanding the Budget

```
Total Context Window (e.g., 32K tokens for Qwen 2.5 32B)
├── System Prompt:        ~500-2000 tokens (fixed)
├── Conversation History: ~500-4000 tokens (variable)
├── Retrieved Context:    ~2000-8000 tokens (variable)
├── User Query:           ~50-500 tokens (variable)
└── Reserved for Output:  ~1000-4000 tokens (MUST reserve)
```

**Critical rule**: Always reserve output tokens FIRST. If your model has 32K context and you want 4K output, you have 28K for everything else.

### Token Budget Calculator

```typescript
interface TokenBudget {
  totalWindow: number;
  systemPrompt: number;
  reservedOutput: number;
  conversationHistory: number;
  availableForContext: number;
}

function calculateTokenBudget(
  totalWindow: number,
  systemPromptTokens: number,
  conversationTokens: number,
  queryTokens: number,
  reservedOutputTokens: number = 4096,
  safetyMargin: number = 200 // buffer for tokenizer differences
): TokenBudget {
  const available = totalWindow
    - systemPromptTokens
    - conversationTokens
    - queryTokens
    - reservedOutputTokens
    - safetyMargin;

  return {
    totalWindow,
    systemPrompt: systemPromptTokens,
    reservedOutput: reservedOutputTokens,
    conversationHistory: conversationTokens,
    availableForContext: Math.max(0, available),
  };
}

// Approximate token counting (use tiktoken for accuracy with OpenAI models)
function estimateTokens(text: string): number {
  // Rough heuristic: 1 token ≈ 4 characters for English
  // More accurate: 1 token ≈ 3.5 chars for code-heavy content
  return Math.ceil(text.length / 3.8);
}
```

---

## The Lost-in-the-Middle Problem

### What It Is
LLMs pay more attention to information at the BEGINNING and END of the context window. Information in the middle gets partially ignored. This is empirically demonstrated across multiple model families.

### The Attention Curve
```
Attention Level
│
│ ████                              ████
│ █████                           ██████
│ ██████                        ████████
│ ████████                    ██████████
│ ██████████              ████████████
│ ██████████████████████████████████████
│
└────────────────────────────────────────
  Beginning         Middle            End
  (HIGH)           (LOW)           (HIGH)
```

### Mitigation Strategies

```typescript
// Strategy 1: Best-first ordering
// Put most relevant chunks at the beginning, then fill remaining
function bestFirstOrdering(
  chunks: Array<{ content: string; score: number }>,
  maxTokens: number
): string[] {
  // Already sorted by relevance score (highest first)
  const sorted = [...chunks].sort((a, b) => b.score - a.score);

  const selected: string[] = [];
  let currentTokens = 0;

  for (const chunk of sorted) {
    const chunkTokens = estimateTokens(chunk.content);
    if (currentTokens + chunkTokens > maxTokens) break;
    selected.push(chunk.content);
    currentTokens += chunkTokens;
  }

  return selected;
}

// Strategy 2: Sandwich ordering
// Most relevant at start AND end, least relevant in middle
function sandwichOrdering(
  chunks: Array<{ content: string; score: number }>,
  maxTokens: number
): string[] {
  const sorted = [...chunks].sort((a, b) => b.score - a.score);
  const selected = selectWithinBudget(sorted, maxTokens);

  if (selected.length <= 2) return selected.map((c) => c.content);

  // Interleave: best at positions 0 and N-1, next best at 1 and N-2, etc.
  const result: Array<{ content: string; score: number } | null> =
    new Array(selected.length).fill(null);

  let left = 0;
  let right = selected.length - 1;

  for (let i = 0; i < selected.length; i++) {
    if (i % 2 === 0) {
      result[left] = selected[i];
      left++;
    } else {
      result[right] = selected[i];
      right--;
    }
  }

  return result.filter(Boolean).map((c) => c!.content);
}

// Strategy 3: Key-facts-first summary
// Prepend a brief summary of ALL retrieved info before the chunks
async function keyFactsFirst(
  query: string,
  chunks: string[],
  llmEndpoint: string
): Promise<string> {
  const summaryPrompt = `Summarize the key facts from these chunks that are relevant to: "${query}"
Keep it to 3-5 bullet points. Be specific with numbers, names, and dates.

${chunks.join('\n---\n')}`;

  const summary = await callLLM(summaryPrompt, llmEndpoint);

  return `KEY FACTS:\n${summary}\n\nDETAILED CONTEXT:\n${chunks.join('\n---\n')}`;
}
```

---

## Context Compression

### Why Compress
- Retrieved chunks contain filler words, boilerplate, redundant phrasing
- A 500-token chunk might carry only 150 tokens of actual useful information
- Compression lets you fit more relevant information in the same budget

### Implementation

```typescript
// Method 1: LLM-based compression
async function compressContext(
  query: string,
  context: string,
  targetTokens: number,
  llmEndpoint: string
): Promise<string> {
  const prompt = `Compress the following context to approximately ${targetTokens} tokens while preserving ALL information relevant to this query: "${query}"

Rules:
- Keep specific numbers, dates, names, code snippets
- Remove filler phrases, redundant explanations, boilerplate
- Maintain factual accuracy — do NOT add information
- Use concise language

Context to compress:
${context}`;

  return await callLLM(prompt, llmEndpoint);
}

// Method 2: Extractive compression (faster, no LLM needed)
function extractiveCompress(
  query: string,
  context: string,
  queryEmbedding: number[],
  targetTokens: number
): string {
  // Split into sentences
  const sentences = context.match(/[^.!?]+[.!?]+/g) || [context];

  // Score each sentence by relevance to query
  const scored = sentences.map((sentence) => ({
    text: sentence.trim(),
    tokens: estimateTokens(sentence),
    // Simple keyword overlap score (use embeddings for better results)
    score: keywordOverlap(query, sentence),
  }));

  // Greedy selection by score within budget
  scored.sort((a, b) => b.score - a.score);

  const selected: string[] = [];
  let currentTokens = 0;

  for (const s of scored) {
    if (currentTokens + s.tokens > targetTokens) continue;
    selected.push(s.text);
    currentTokens += s.tokens;
  }

  // Restore original order for coherence
  const originalOrder = selected.sort(
    (a, b) => context.indexOf(a) - context.indexOf(b)
  );

  return originalOrder.join(' ');
}

function keywordOverlap(query: string, text: string): number {
  const queryWords = new Set(query.toLowerCase().split(/\s+/));
  const textWords = text.toLowerCase().split(/\s+/);
  let overlap = 0;
  for (const word of textWords) {
    if (queryWords.has(word)) overlap++;
  }
  return overlap / queryWords.size;
}

// Method 3: Hierarchical compression for long documents
async function hierarchicalCompress(
  query: string,
  chunks: string[],
  maxTokens: number,
  llmEndpoint: string
): Promise<string> {
  const totalTokens = chunks.reduce((sum, c) => sum + estimateTokens(c), 0);

  if (totalTokens <= maxTokens) {
    return chunks.join('\n---\n'); // Already fits
  }

  // Phase 1: Compress each chunk individually
  const compressionRatio = maxTokens / totalTokens;
  const compressed = await Promise.all(
    chunks.map((chunk) => {
      const targetPerChunk = Math.floor(
        estimateTokens(chunk) * compressionRatio * 0.9
      );
      return compressContext(query, chunk, targetPerChunk, llmEndpoint);
    })
  );

  const compressedTotal = compressed.reduce(
    (sum, c) => sum + estimateTokens(c), 0
  );

  if (compressedTotal <= maxTokens) {
    return compressed.join('\n---\n');
  }

  // Phase 2: If still too long, merge and compress again
  return compressContext(
    query,
    compressed.join('\n---\n'),
    maxTokens,
    llmEndpoint
  );
}
```

---

## Sliding Window for Conversation History

### The Problem
In multi-turn conversations, history grows unbounded. You need to decide what to keep and what to drop.

```typescript
interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  tokens: number;
}

interface WindowConfig {
  maxHistoryTokens: number;
  alwaysKeepFirst: number;    // Keep first N messages (establishes context)
  alwaysKeepLast: number;     // Keep last N messages (recent context)
  summarizeDropped: boolean;  // Summarize what we drop?
}

function slidingWindowHistory(
  messages: Message[],
  config: WindowConfig
): Message[] {
  const totalTokens = messages.reduce((sum, m) => sum + m.tokens, 0);

  if (totalTokens <= config.maxHistoryTokens) {
    return messages; // Everything fits
  }

  const keepFirst = messages.slice(0, config.alwaysKeepFirst);
  const keepLast = messages.slice(-config.alwaysKeepLast);
  const middle = messages.slice(config.alwaysKeepFirst, -config.alwaysKeepLast);

  const keepTokens = [...keepFirst, ...keepLast].reduce(
    (sum, m) => sum + m.tokens, 0
  );
  const availableForMiddle = config.maxHistoryTokens - keepTokens;

  // Take most recent middle messages that fit
  const selectedMiddle: Message[] = [];
  let middleTokens = 0;

  for (let i = middle.length - 1; i >= 0; i--) {
    if (middleTokens + middle[i].tokens > availableForMiddle) break;
    selectedMiddle.unshift(middle[i]);
    middleTokens += middle[i].tokens;
  }

  return [...keepFirst, ...selectedMiddle, ...keepLast];
}

// Enhanced: Summarize dropped history
async function slidingWindowWithSummary(
  messages: Message[],
  config: WindowConfig,
  llmEndpoint: string
): Promise<Message[]> {
  const result = slidingWindowHistory(messages, config);

  if (result.length === messages.length || !config.summarizeDropped) {
    return result;
  }

  // Find dropped messages
  const keptIds = new Set(result.map((m) => m.timestamp));
  const dropped = messages.filter((m) => !keptIds.has(m.timestamp));

  if (dropped.length === 0) return result;

  const summaryPrompt = `Summarize this conversation excerpt in 2-3 sentences, preserving key decisions, facts, and requests:
${dropped.map((m) => `${m.role}: ${m.content}`).join('\n')}`;

  const summary = await callLLM(summaryPrompt, llmEndpoint);

  const summaryMessage: Message = {
    role: 'system',
    content: `[Earlier conversation summary: ${summary}]`,
    timestamp: dropped[0].timestamp,
    tokens: estimateTokens(summary) + 10,
  };

  // Insert summary after the "keep first" messages
  return [
    ...result.slice(0, config.alwaysKeepFirst),
    summaryMessage,
    ...result.slice(config.alwaysKeepFirst),
  ];
}
```

---

## Priority-Based Context Loading

### The Multi-Source Priority Stack

```typescript
enum ContextPriority {
  CRITICAL = 4,    // Must include or answer will be wrong
  HIGH = 3,        // Strongly relevant
  MEDIUM = 2,      // Supporting information
  LOW = 1,         // Nice-to-have background
}

interface PrioritizedChunk {
  content: string;
  tokens: number;
  priority: ContextPriority;
  source: string;
  score: number;
}

function priorityBasedLoading(
  chunks: PrioritizedChunk[],
  maxTokens: number
): PrioritizedChunk[] {
  // Sort by priority (desc), then by relevance score within each priority
  const sorted = [...chunks].sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority;
    return b.score - a.score;
  });

  const selected: PrioritizedChunk[] = [];
  let currentTokens = 0;

  for (const chunk of sorted) {
    if (currentTokens + chunk.tokens > maxTokens) {
      // If it's CRITICAL priority, try to fit by compressing
      if (chunk.priority === ContextPriority.CRITICAL) {
        // Drop lowest priority selected chunk to make room
        const lowestIdx = findLowestPriorityIndex(selected);
        if (lowestIdx >= 0 && selected[lowestIdx].priority < ContextPriority.CRITICAL) {
          currentTokens -= selected[lowestIdx].tokens;
          selected.splice(lowestIdx, 1);
          if (currentTokens + chunk.tokens <= maxTokens) {
            selected.push(chunk);
            currentTokens += chunk.tokens;
          }
        }
      }
      continue;
    }
    selected.push(chunk);
    currentTokens += chunk.tokens;
  }

  return selected;
}

function findLowestPriorityIndex(chunks: PrioritizedChunk[]): number {
  let minPriority = Infinity;
  let minIdx = -1;
  for (let i = 0; i < chunks.length; i++) {
    if (chunks[i].priority < minPriority) {
      minPriority = chunks[i].priority;
      minIdx = i;
    }
  }
  return minIdx;
}
```

### Automatic Priority Assignment

```typescript
async function assignPriority(
  query: string,
  chunk: string,
  relevanceScore: number,
  llmEndpoint: string
): Promise<ContextPriority> {
  // Fast path: use score thresholds for obvious cases
  if (relevanceScore > 0.92) return ContextPriority.CRITICAL;
  if (relevanceScore < 0.3) return ContextPriority.LOW;

  // LLM classification for edge cases
  const prompt = `Given this query and context chunk, classify the priority:
Query: ${query}
Chunk: ${chunk.substring(0, 500)}

CRITICAL - Without this, the answer would be wrong or incomplete
HIGH - Directly relevant and adds important detail
MEDIUM - Somewhat relevant, provides supporting context
LOW - Tangentially related, background information only

Respond with ONE word: CRITICAL, HIGH, MEDIUM, or LOW`;

  const response = await callLLM(prompt, llmEndpoint);
  const label = response.trim().toUpperCase();

  const map: Record<string, ContextPriority> = {
    CRITICAL: ContextPriority.CRITICAL,
    HIGH: ContextPriority.HIGH,
    MEDIUM: ContextPriority.MEDIUM,
    LOW: ContextPriority.LOW,
  };

  return map[label] ?? ContextPriority.MEDIUM;
}
```

---

## Truncation Strategies

### Smart Truncation (Not Just Cutting Off at Token Limit)

```typescript
interface TruncationConfig {
  maxTokens: number;
  preserveStart: boolean;     // Keep beginning of each chunk
  preserveEnd: boolean;       // Keep end of each chunk
  preserveCodeBlocks: boolean;// Never cut mid-code-block
  ellipsisMarker: string;     // What to insert at truncation point
}

function smartTruncate(
  text: string,
  config: TruncationConfig
): string {
  const tokens = estimateTokens(text);
  if (tokens <= config.maxTokens) return text;

  const targetChars = config.maxTokens * 3.8; // Approximate char target

  if (config.preserveCodeBlocks) {
    return truncatePreservingCode(text, targetChars, config.ellipsisMarker);
  }

  if (config.preserveStart && config.preserveEnd) {
    const halfChars = Math.floor(targetChars / 2);
    const start = text.substring(0, halfChars);
    const end = text.substring(text.length - halfChars);
    return `${start}\n${config.ellipsisMarker}\n${end}`;
  }

  if (config.preserveStart) {
    // Cut at the last sentence boundary before the limit
    const truncated = text.substring(0, targetChars);
    const lastSentence = truncated.lastIndexOf('. ');
    if (lastSentence > targetChars * 0.7) {
      return truncated.substring(0, lastSentence + 1) + `\n${config.ellipsisMarker}`;
    }
    return truncated + `\n${config.ellipsisMarker}`;
  }

  // preserveEnd
  const truncated = text.substring(text.length - targetChars);
  const firstSentence = truncated.indexOf('. ');
  if (firstSentence > 0 && firstSentence < targetChars * 0.3) {
    return `${config.ellipsisMarker}\n` + truncated.substring(firstSentence + 2);
  }
  return `${config.ellipsisMarker}\n` + truncated;
}

function truncatePreservingCode(
  text: string,
  targetChars: number,
  ellipsis: string
): string {
  // Find code block boundaries
  const codeBlockRegex = /```[\s\S]*?```/g;
  const codeBlocks: Array<{ start: number; end: number }> = [];
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    codeBlocks.push({ start: match.index, end: match.index + match[0].length });
  }

  // Find the safe cut point (not inside a code block)
  let cutPoint = targetChars;
  for (const block of codeBlocks) {
    if (cutPoint > block.start && cutPoint < block.end) {
      // We're inside a code block — either include or exclude it
      if (block.end - block.start < targetChars * 0.3) {
        cutPoint = block.end; // Include the whole block
      } else {
        cutPoint = block.start; // Exclude the whole block
      }
    }
  }

  return text.substring(0, cutPoint) + `\n${ellipsis}`;
}
```

---

## Context Window Monitoring

```typescript
interface ContextWindowMetrics {
  totalTokens: number;
  systemPromptTokens: number;
  historyTokens: number;
  retrievedContextTokens: number;
  queryTokens: number;
  availableForOutput: number;
  utilizationPercent: number;
  wastedTokens: number; // Retrieved but likely irrelevant
}

function monitorContextUsage(
  systemPrompt: string,
  history: string,
  contexts: Array<{ content: string; relevanceScore: number }>,
  query: string,
  maxWindow: number
): ContextWindowMetrics {
  const systemTokens = estimateTokens(systemPrompt);
  const historyTokens = estimateTokens(history);
  const queryTokens = estimateTokens(query);

  const contextTokens = contexts.reduce(
    (sum, c) => sum + estimateTokens(c.content), 0
  );

  // "Wasted" = tokens from chunks with low relevance scores
  const wastedTokens = contexts
    .filter((c) => c.relevanceScore < 0.4)
    .reduce((sum, c) => sum + estimateTokens(c.content), 0);

  const totalUsed = systemTokens + historyTokens + contextTokens + queryTokens;

  return {
    totalTokens: totalUsed,
    systemPromptTokens: systemTokens,
    historyTokens,
    retrievedContextTokens: contextTokens,
    queryTokens,
    availableForOutput: maxWindow - totalUsed,
    utilizationPercent: (totalUsed / maxWindow) * 100,
    wastedTokens,
  };
}
```

---

## Anti-Patterns

| Anti-Pattern | Why It Fails | Fix |
|---|---|---|
| Stuffing max chunks regardless | Wastes tokens on low-relevance content | Use score thresholds |
| Fixed chunk count (always top-5) | Ignores score distribution | Use adaptive selection |
| No output token reservation | Model truncates mid-answer | Always reserve 2-4K tokens |
| Ignoring conversation history growth | Context overflow in long conversations | Sliding window + summary |
| Same context format for all queries | "Show me code" needs code blocks, not prose summaries | Adaptive formatting |
| Truncating code blocks mid-line | Broken syntax = confusion for LLM | Preserve code boundaries |

---

## Key Takeaways

- Token budget is zero-sum: every token for context is a token not available for output
- Lost-in-the-middle is real: put your best content first and last
- Compression can 2-3x your effective context capacity
- Priority-based loading ensures critical info never gets bumped for background noise
- Smart truncation preserves meaning; naive truncation destroys it
- Monitor utilization — if you're consistently using <50% of available context, you're under-retrieving
