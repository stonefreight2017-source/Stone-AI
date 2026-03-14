# Context Window Management for AI Agents

## Seed Classification
- **Domain**: Systems Architecture / Token Management
- **Applies to**: Qwen 2.5 32B (32K context), Claude Sonnet (200K), all Stone AI agents
- **Priority**: Critical — context overflow = broken conversations
- **Last Updated**: 2026-03-09

---

## 1. The Context Window Constraint

Every AI model has a fixed context window — the total amount of text it can "see" at once. For Stone AI's primary model (Qwen 2.5 32B AWQ running on the OMEN), that window is 32,768 tokens. For the cloud fallback (Claude Sonnet), it is 200K tokens. For Haiku (Vercel fallback), it is 200K.

32K tokens is approximately 24,000 words or 100 pages of text. That sounds like a lot until you consider what goes into a conversation:

```
System prompt:           ~2,000-4,000 tokens
Agent personality:       ~500-1,000 tokens
User context (memory):   ~500-1,500 tokens
Conversation history:    ~15,000-25,000 tokens
Current task data:       ~500-2,000 tokens
Response reserve:        ~4,096 tokens
Safety margin:           ~2,000 tokens
                         ─────────────────
Total budget:            ~32,768 tokens
```

When the conversation exceeds the window, the model loses access to earlier context. Without management, this means:
- The model "forgets" what the user said 20 messages ago
- Repeated information and contradictions emerge
- Task continuity breaks down
- User trust is destroyed

Context window management is the difference between an AI that feels intelligent across long conversations and one that develops amnesia.

---

## 2. Token Budget Architecture

### 2.1 Budget Allocation

```typescript
interface TokenBudget {
  model: 'qwen-32b' | 'claude-sonnet' | 'claude-haiku';
  totalWindow: number;

  // Fixed allocations (do not change during conversation)
  fixed: {
    systemPrompt: number;       // Agent identity, rules, capabilities
    agentPersonality: number;   // Personality traits, style instructions
    safetyPrompt: number;       // Safety guardrails, content filters
    responseReserve: number;    // Max tokens for the response
    safetyMargin: number;       // Buffer for tokenizer estimation errors
  };

  // Dynamic allocations (managed during conversation)
  dynamic: {
    userContext: number;        // Injected from long-term memory
    conversationHistory: number; // The actual conversation
    currentTaskData: number;   // Files, code, data for current task
    handoffContext: number;    // Context from agent handoffs
  };
}

const BUDGETS: Record<string, TokenBudget> = {
  'qwen-32b': {
    model: 'qwen-32b',
    totalWindow: 32_768,
    fixed: {
      systemPrompt: 3_000,
      agentPersonality: 800,
      safetyPrompt: 500,
      responseReserve: 4_096,
      safetyMargin: 2_000,
    },
    dynamic: {
      userContext: 1_500,
      conversationHistory: 18_000,
      currentTaskData: 2_000,
      handoffContext: 872,
    },
  },
  'claude-sonnet': {
    model: 'claude-sonnet',
    totalWindow: 200_000,
    fixed: {
      systemPrompt: 4_000,
      agentPersonality: 1_000,
      safetyPrompt: 500,
      responseReserve: 8_192,
      safetyMargin: 5_000,
    },
    dynamic: {
      userContext: 3_000,
      conversationHistory: 170_000,
      currentTaskData: 5_000,
      handoffContext: 3_308,
    },
  },
};
```

### 2.2 Dynamic Budget Reallocation

When one section needs more space, steal from another:

```typescript
class BudgetManager {
  private budget: TokenBudget;
  private usage: Record<string, number> = {};

  reallocate(section: string, needed: number): boolean {
    const available = this.getAvailable(section);
    if (needed <= available) return true;

    const deficit = needed - available;

    // Try to steal from lower-priority sections
    const stealOrder = ['handoffContext', 'currentTaskData', 'userContext'];

    for (const source of stealOrder) {
      if (source === section) continue;

      const sourceAvailable = this.getAvailable(source);
      const stealable = Math.min(
        sourceAvailable,
        this.budget.dynamic[source] * 0.5 // Never steal more than 50%
      );

      if (stealable >= deficit) {
        this.budget.dynamic[source] -= deficit;
        this.budget.dynamic[section] += deficit;
        return true;
      }
    }

    return false; // Cannot reallocate enough
  }

  getAvailable(section: string): number {
    return (this.budget.dynamic[section] || 0) - (this.usage[section] || 0);
  }
}
```

---

## 3. Conversation History Management

### 3.1 Sliding Window Strategy

The primary strategy for managing conversation history:

```typescript
class SlidingWindowManager {
  private budget: number;

  constructor(historyBudget: number) {
    this.budget = historyBudget;
  }

  manage(messages: Message[]): ManagedHistory {
    const totalTokens = this.countTokens(messages);

    if (totalTokens <= this.budget) {
      return { messages, compressed: false, dropped: 0 };
    }

    // Strategy: Keep anchors, compress middle, keep recent
    return this.compressHistory(messages);
  }

  private compressHistory(messages: Message[]): ManagedHistory {
    // Anchor messages (always kept)
    const anchors = {
      first: messages[0],           // First user message (original intent)
      recent: messages.slice(-6),   // Last 6 messages (active context)
    };

    // Middle messages (candidates for compression)
    const middle = messages.slice(1, -6);

    // Phase 1: Summarize old agent responses (they are usually verbose)
    let compressed = this.summarizeAgentResponses(middle);

    // Phase 2: If still over budget, summarize user messages too
    if (this.countTokens([anchors.first, ...compressed, ...anchors.recent]) > this.budget) {
      compressed = this.summarizeConversationChunks(compressed);
    }

    // Phase 3: If STILL over budget, drop oldest compressed chunks
    while (this.countTokens([anchors.first, ...compressed, ...anchors.recent]) > this.budget
           && compressed.length > 0) {
      compressed.shift();
    }

    const result = [anchors.first, ...compressed, ...anchors.recent];

    return {
      messages: result,
      compressed: true,
      dropped: messages.length - result.length,
    };
  }

  private summarizeAgentResponses(messages: Message[]): Message[] {
    return messages.map(msg => {
      if (msg.role === 'assistant' && this.countTokens([msg]) > 500) {
        return {
          ...msg,
          content: `[Summary] ${this.quickSummarize(msg.content)}`,
          originalTokens: this.countTokens([msg]),
          compressed: true,
        };
      }
      return msg;
    });
  }

  private summarizeConversationChunks(messages: Message[]): Message[] {
    // Group messages into chunks of 4
    const chunks: Message[][] = [];
    for (let i = 0; i < messages.length; i += 4) {
      chunks.push(messages.slice(i, i + 4));
    }

    // Summarize each chunk into a single message
    return chunks.map(chunk => ({
      role: 'system' as const,
      content: `[Earlier in conversation] ${this.summarizeChunk(chunk)}`,
      compressed: true,
    }));
  }
}
```

### 3.2 Priority-Based Message Retention

Not all messages are equally important:

```typescript
interface MessagePriority {
  message: Message;
  priority: number; // 0-1, higher = keep longer
  reasons: string[];
}

function prioritizeMessages(messages: Message[]): MessagePriority[] {
  return messages.map((msg, index) => {
    let priority = 0.5;
    const reasons: string[] = [];

    // First message is always high priority
    if (index === 0) {
      priority += 0.3;
      reasons.push('first_message');
    }

    // Last 3 messages are always high priority
    if (index >= messages.length - 3) {
      priority += 0.4;
      reasons.push('recent');
    }

    // Messages with decisions or commitments
    if (/\b(decided|going with|let's do|yes|approved|confirmed)\b/i.test(msg.content)) {
      priority += 0.2;
      reasons.push('decision');
    }

    // Messages with code (likely task-relevant)
    if (/```/.test(msg.content)) {
      priority += 0.15;
      reasons.push('contains_code');
    }

    // Messages with specific data (numbers, names, configs)
    if (/\b\d{2,}\b/.test(msg.content) || /[A-Z][a-z]+(?:\s[A-Z][a-z]+)/.test(msg.content)) {
      priority += 0.1;
      reasons.push('specific_data');
    }

    // User messages slightly higher priority than agent messages
    if (msg.role === 'user') {
      priority += 0.1;
      reasons.push('user_message');
    }

    // Pinned messages
    if (msg.isPinned) {
      priority += 0.5;
      reasons.push('pinned');
    }

    return { message: msg, priority: Math.min(1, priority), reasons };
  });
}
```

### 3.3 Message Pinning

Users and agents can pin important messages that should never be compressed:

```typescript
interface PinnableMessage extends Message {
  isPinned: boolean;
  pinnedBy: 'user' | 'agent' | 'system';
  pinnedReason?: string;
}

// Auto-pin rules
const autoPinRules = [
  {
    name: 'user_requirements',
    detect: (msg: Message) => msg.role === 'user' &&
      /\b(must|need|require|important|critical)\b/i.test(msg.content) &&
      msg.content.length > 50,
    reason: 'Contains user requirements',
  },
  {
    name: 'shared_code',
    detect: (msg: Message) => msg.role === 'user' && /```\w+\n[\s\S]{200,}/.test(msg.content),
    reason: 'Contains substantial code',
  },
  {
    name: 'decisions',
    detect: (msg: Message) => /\b(decided|final decision|going with option)\b/i.test(msg.content),
    reason: 'Contains a decision',
  },
];
```

---

## 4. Prompt Compression Techniques

### 4.1 System Prompt Optimization

The system prompt is the largest fixed cost. Every token saved here is a token available for conversation:

```typescript
// BEFORE optimization (3,800 tokens):
const verbosePrompt = `
You are Agent #7, also known as Pixel. You are a design specialist
agent that is part of the Stone AI platform. Your primary role is to
help users with all aspects of visual design, including but not limited
to logo creation, color palette generation, layout design, typography
selection, and branding guidance. You should always be creative and
helpful while maintaining professional standards...
[800 more words of instructions]
`;

// AFTER optimization (1,200 tokens):
const optimizedPrompt = `
# Pixel (Agent #7) — Design Specialist

## Core
Visual design: logos, palettes, layouts, typography, branding.
Creative but professional. Show, don't just describe.

## Rules
- ASK before designing (confirm requirements)
- SHOW alternatives (never just one option)
- EXPLAIN design choices (users learn from reasoning)
- FORMAT: use markdown for text, describe visuals precisely

## Limits
- No final production files (describe what to build)
- Handoff to Agent #22 for code implementation
- Handoff to Agent #1 for copy/text content
`;

// Savings: 2,600 tokens → redirected to conversation history
```

### 4.2 Conversation Summarization

When the context window fills up, summarize older parts:

```typescript
async function summarizeForContext(
  messages: Message[],
  options: {
    maxTokens: number;
    preserveDecisions: boolean;
    preserveCode: boolean;
    preserveUserPreferences: boolean;
  }
): Promise<string> {
  // Extract key information before summarizing
  const extracted = {
    decisions: options.preserveDecisions
      ? extractDecisions(messages)
      : [],
    codeBlocks: options.preserveCode
      ? extractCodeBlocks(messages).slice(-3) // Keep last 3 code blocks
      : [],
    preferences: options.preserveUserPreferences
      ? extractPreferences(messages)
      : [],
  };

  // Summarize the conversation narrative
  const narrative = await callModel({
    prompt: `Summarize this conversation in ${options.maxTokens} tokens.
             Focus on: what the user wants, what's been done, what's remaining.
             Be factual, not narrative.`,
    messages,
    maxTokens: options.maxTokens - estimateTokens(JSON.stringify(extracted)),
  });

  // Combine summary with preserved elements
  const parts = [
    `[Conversation Summary]\n${narrative}`,
    extracted.decisions.length > 0
      ? `[Decisions Made]\n${extracted.decisions.join('\n')}`
      : '',
    extracted.codeBlocks.length > 0
      ? `[Relevant Code]\n${extracted.codeBlocks.join('\n\n')}`
      : '',
    extracted.preferences.length > 0
      ? `[User Preferences]\n${extracted.preferences.join('\n')}`
      : '',
  ].filter(Boolean);

  return parts.join('\n\n');
}
```

### 4.3 Smart Truncation

When you must cut content, cut intelligently:

```typescript
function smartTruncate(
  content: string,
  maxTokens: number
): string {
  const currentTokens = estimateTokens(content);
  if (currentTokens <= maxTokens) return content;

  // Strategy 1: Remove redundant whitespace
  let trimmed = content.replace(/\n{3,}/g, '\n\n').replace(/  +/g, ' ');

  if (estimateTokens(trimmed) <= maxTokens) return trimmed;

  // Strategy 2: Shorten verbose phrases
  const verbosePatterns: [RegExp, string][] = [
    [/In order to/gi, 'To'],
    [/It is important to note that/gi, 'Note:'],
    [/As mentioned previously/gi, '(as noted)'],
    [/\bbasically\b/gi, ''],
    [/\bactually\b/gi, ''],
    [/\bfor example/gi, 'e.g.'],
    [/\bthat being said/gi, ''],
    [/\bin other words/gi, 'i.e.'],
  ];

  for (const [pattern, replacement] of verbosePatterns) {
    trimmed = trimmed.replace(pattern, replacement);
  }

  if (estimateTokens(trimmed) <= maxTokens) return trimmed;

  // Strategy 3: Truncate from the middle (keep start and end)
  const lines = trimmed.split('\n');
  const keepStart = Math.ceil(lines.length * 0.4);
  const keepEnd = Math.ceil(lines.length * 0.3);

  return [
    ...lines.slice(0, keepStart),
    '\n[... earlier content summarized ...]\n',
    ...lines.slice(-keepEnd),
  ].join('\n');
}
```

---

## 5. Model-Specific Strategies

### 5.1 Qwen 2.5 32B (32K Window — Primary, Local)

```typescript
const qwenStrategy: ContextStrategy = {
  totalWindow: 32_768,
  approach: 'aggressive_compression',

  rules: {
    // Compress agent responses after 10 messages
    compressAfterMessages: 10,
    // Summarize every 8 messages into a 200-token summary
    summarizeChunkSize: 8,
    summaryMaxTokens: 200,
    // Always keep last 6 messages verbatim
    keepRecentCount: 6,
    // Maximum single message size
    maxMessageTokens: 3_000,
    // Truncate code blocks over 1000 tokens
    maxCodeBlockTokens: 1_000,
  },

  tokenizer: 'qwen2-tokenizer',
  tokensPerWord: 1.3, // Qwen's tokenizer ratio for English
};
```

### 5.2 Claude Sonnet (200K Window — SMART Tier Cloud)

```typescript
const claudeStrategy: ContextStrategy = {
  totalWindow: 200_000,
  approach: 'generous_retention',

  rules: {
    // Much later compression (200K gives room)
    compressAfterMessages: 100,
    summarizeChunkSize: 20,
    summaryMaxTokens: 500,
    keepRecentCount: 20,
    maxMessageTokens: 10_000,
    maxCodeBlockTokens: 5_000,
  },

  tokenizer: 'claude-tokenizer',
  tokensPerWord: 1.2,
};
```

### 5.3 Model Switching During Conversation

When a conversation moves from local (Qwen) to cloud (Claude) or vice versa:

```typescript
async function handleModelSwitch(
  conversation: Conversation,
  fromModel: string,
  toModel: string
): Promise<void> {
  const fromBudget = BUDGETS[fromModel];
  const toBudget = BUDGETS[toModel];

  if (toBudget.totalWindow > fromBudget.totalWindow) {
    // Moving to larger context — expand compressed summaries if available
    await expandCompressedSections(conversation, toBudget);
  } else {
    // Moving to smaller context — compress immediately
    await compressForTarget(conversation, toBudget);
  }
}
```

---

## 6. Token Counting and Estimation

### 6.1 Fast Token Estimation

Exact token counting requires the tokenizer. For real-time use, estimate:

```typescript
class TokenEstimator {
  // Fast estimation (no tokenizer call)
  static estimate(text: string, model: string = 'qwen-32b'): number {
    const ratios = {
      'qwen-32b': 1.3,      // tokens per word
      'claude-sonnet': 1.2,
      'claude-haiku': 1.2,
    };

    const wordCount = text.split(/\s+/).length;
    const codeBonus = (text.match(/```/g) || []).length * 5; // Code blocks use more tokens
    const specialChars = (text.match(/[^\w\s]/g) || []).length * 0.5;

    return Math.ceil(wordCount * ratios[model] + codeBonus + specialChars);
  }

  // Exact count (tokenizer call — slower)
  static async exact(text: string, model: string): Promise<number> {
    const tokenizer = await loadTokenizer(model);
    return tokenizer.encode(text).length;
  }

  // Batch estimation for multiple messages
  static estimateMessages(messages: Message[], model: string): number {
    let total = 0;
    for (const msg of messages) {
      total += this.estimate(msg.content, model);
      total += 4; // Per-message overhead (role tokens, formatting)
    }
    return total;
  }
}
```

### 6.2 Token Budget Monitoring

```typescript
class TokenMonitor {
  private budget: TokenBudget;
  private currentUsage: Record<string, number> = {};
  private warningThreshold = 0.85; // Warn at 85%

  recordUsage(section: string, tokens: number): void {
    this.currentUsage[section] = (this.currentUsage[section] || 0) + tokens;
    this.checkThresholds();
  }

  private checkThresholds(): void {
    const totalUsed = Object.values(this.currentUsage).reduce((a, b) => a + b, 0);
    const totalBudget = this.budget.totalWindow;
    const utilization = totalUsed / totalBudget;

    if (utilization > 0.95) {
      // Critical — must compress NOW
      this.emit('critical', {
        utilization,
        message: 'Context window at 95%. Immediate compression required.',
        action: 'force_compress',
      });
    } else if (utilization > this.warningThreshold) {
      // Warning — start compressing proactively
      this.emit('warning', {
        utilization,
        message: `Context window at ${Math.round(utilization * 100)}%.`,
        action: 'proactive_compress',
      });
    }
  }

  getReport(): BudgetReport {
    const sections = {};
    for (const [section, allocated] of Object.entries(this.budget.dynamic)) {
      sections[section] = {
        allocated,
        used: this.currentUsage[section] || 0,
        available: allocated - (this.currentUsage[section] || 0),
        utilization: ((this.currentUsage[section] || 0) / allocated * 100).toFixed(1) + '%',
      };
    }
    return {
      model: this.budget.model,
      totalWindow: this.budget.totalWindow,
      totalUsed: Object.values(this.currentUsage).reduce((a, b) => a + b, 0),
      sections,
    };
  }
}
```

---

## 7. Long Conversation Handling

### 7.1 Conversation Segmentation

For very long conversations, split into logical segments:

```typescript
async function segmentLongConversation(
  messages: Message[]
): Promise<ConversationSegment[]> {
  const segments: ConversationSegment[] = [];
  let currentSegment: Message[] = [];
  let currentTopic: string | null = null;

  for (const msg of messages) {
    const topic = await detectTopic(msg.content);

    if (currentTopic && topic !== currentTopic && currentSegment.length >= 4) {
      // Topic changed — close current segment
      segments.push({
        messages: currentSegment,
        topic: currentTopic,
        summary: await summarizeSegment(currentSegment),
        tokenCount: TokenEstimator.estimateMessages(currentSegment, 'qwen-32b'),
      });
      currentSegment = [];
    }

    currentSegment.push(msg);
    currentTopic = topic;
  }

  // Close final segment
  if (currentSegment.length > 0) {
    segments.push({
      messages: currentSegment,
      topic: currentTopic || 'general',
      summary: await summarizeSegment(currentSegment),
      tokenCount: TokenEstimator.estimateMessages(currentSegment, 'qwen-32b'),
    });
  }

  return segments;
}
```

### 7.2 Segment-Based Context Assembly

```typescript
async function assembleContext(
  segments: ConversationSegment[],
  currentMessage: string,
  budget: number
): Promise<AssembledContext> {
  let used = 0;
  const included: (Message | { role: 'system'; content: string })[] = [];

  // Always include last segment fully
  const lastSegment = segments[segments.length - 1];
  included.push(...lastSegment.messages);
  used += lastSegment.tokenCount;

  // For older segments, include summaries ranked by relevance
  const olderSegments = segments.slice(0, -1);
  const relevanceScores = await Promise.all(
    olderSegments.map(s => scoreRelevance(s.summary, currentMessage))
  );

  const ranked = olderSegments
    .map((seg, i) => ({ segment: seg, relevance: relevanceScores[i] }))
    .sort((a, b) => b.relevance - a.relevance);

  for (const { segment } of ranked) {
    const summaryTokens = TokenEstimator.estimate(segment.summary, 'qwen-32b');
    if (used + summaryTokens <= budget) {
      included.unshift({
        role: 'system',
        content: `[Earlier: ${segment.topic}] ${segment.summary}`,
      });
      used += summaryTokens;
    }
  }

  return { messages: included, totalTokens: used };
}
```

---

## 8. User-Facing Context Indicators

Users should know when context management is active:

```typescript
interface ContextIndicator {
  // Show in chat UI
  totalMessages: number;
  visibleToAgent: number;     // How many messages the agent can "see"
  summarizedMessages: number; // How many were compressed
  contextUtilization: number; // 0-100%

  // Warnings
  nearingLimit: boolean;      // > 80% utilization
  summaryActive: boolean;     // Summarization is compressing history
  message?: string;           // Human-readable status
}

function getContextIndicator(
  monitor: TokenMonitor,
  messages: Message[],
  managedMessages: ManagedHistory
): ContextIndicator {
  const report = monitor.getReport();
  const utilization = report.totalUsed / report.totalWindow * 100;

  return {
    totalMessages: messages.length,
    visibleToAgent: managedMessages.messages.length,
    summarizedMessages: managedMessages.dropped,
    contextUtilization: Math.round(utilization),
    nearingLimit: utilization > 80,
    summaryActive: managedMessages.compressed,
    message: managedMessages.compressed
      ? `Agent is working with a summary of your earlier messages (${managedMessages.dropped} summarized)`
      : undefined,
  };
}
```

---

## 9. Testing Context Management

### 9.1 Test Scenarios

```typescript
const contextTests = [
  {
    name: 'short_conversation_no_compression',
    messageCount: 10,
    expectedCompression: false,
    expectedDropped: 0,
  },
  {
    name: 'medium_conversation_light_compression',
    messageCount: 30,
    expectedCompression: true,
    expectedMaxDropped: 10,
  },
  {
    name: 'long_conversation_heavy_compression',
    messageCount: 100,
    expectedCompression: true,
    expectedRecentKept: 6,
    expectedFirstKept: true,
  },
  {
    name: 'code_heavy_conversation',
    messageCount: 20,
    avgCodeBlockSize: 500, // tokens
    expectedCodePreservation: 'last_3_blocks',
  },
  {
    name: 'decision_preservation',
    messages: generateConversationWithDecisions(50),
    expectedDecisionsPreserved: true,
  },
  {
    name: 'model_switch_qwen_to_claude',
    initialModel: 'qwen-32b',
    switchToModel: 'claude-sonnet',
    expectedContextExpansion: true,
  },
];
```

---

## 10. Production Checklist

- [ ] Token budget defined for all three models (Qwen, Sonnet, Haiku)
- [ ] Sliding window preserves first message + last 6 messages
- [ ] Agent responses compressed after 10 messages
- [ ] Conversation summarization generates < 200 token summaries per chunk
- [ ] Priority-based retention scores all messages
- [ ] Message pinning works for user, agent, and system pins
- [ ] System prompt optimized to minimum viable tokens
- [ ] Smart truncation removes verbose phrases before cutting content
- [ ] Token estimation accurate to within 10% of exact count
- [ ] Budget monitoring warns at 85%, forces compression at 95%
- [ ] Long conversations segmented by topic
- [ ] Model switching handles context expansion and compression
- [ ] User-facing context indicator shows summarization status
- [ ] Code blocks preserved with higher priority than prose
- [ ] Decisions and user requirements never dropped from context
- [ ] Load testing: context management adds < 50ms latency
