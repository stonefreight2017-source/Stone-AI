# Conversation Memory Architecture for AI Agents

## Seed Classification
- **Domain**: Systems Architecture / Memory Management
- **Applies to**: All Stone AI agents, PostgreSQL + pgvector backend, Qwen 2.5 32B context
- **Priority**: Critical — memory is what makes AI agents feel intelligent
- **Last Updated**: 2026-03-09

---

## 1. Why Memory Architecture Matters

An AI agent without memory is a stranger every time you talk to it. An AI agent with bad memory is worse — it remembers the wrong things, forgets the important things, and creates an uncanny valley where the user is never sure what the agent knows.

Stone AI's memory architecture must solve three problems simultaneously:
1. **Short-term**: What happened in this conversation (context window management)
2. **Medium-term**: What happened in recent conversations (session continuity)
3. **Long-term**: What the agent knows about this user across all time (user model)

Each layer has different storage, retrieval, and expiration characteristics.

---

## 2. The Three-Layer Memory Model

### 2.1 Layer 1: Working Memory (In-Context)

This is the conversation context window — what the model can "see" right now.

**Storage**: Qwen 2.5 32B context window (32,768 tokens)
**Duration**: Current conversation only
**Retrieval**: Instant (already in context)
**Cost**: Zero (no database query)

```typescript
interface WorkingMemory {
  systemPrompt: string;          // ~2-4K tokens
  agentPersonality: string;      // ~500-1K tokens
  userContext: string;            // ~500-1K tokens (injected from long-term)
  conversationHistory: Message[]; // Variable — managed by sliding window
  currentTask: string;           // ~200-500 tokens
  reservedForResponse: number;   // 4,096 tokens
}

// Token budget allocation
const TOKEN_BUDGET = {
  total: 32_768,
  system: 4_000,        // System prompt + agent identity
  userContext: 1_500,    // Injected from long-term memory
  history: 19_000,       // Conversation messages (sliding window)
  currentTask: 1_000,    // Current task description
  responseReserve: 4_096, // Max response length
  safetyMargin: 3_172,   // Buffer for token estimation errors
};
```

**Sliding Window Strategy**:

```typescript
class WorkingMemoryManager {
  private maxHistoryTokens = TOKEN_BUDGET.history;

  addMessage(message: Message, history: Message[]): Message[] {
    history.push(message);

    // Calculate total tokens
    let totalTokens = this.estimateTokens(history);

    while (totalTokens > this.maxHistoryTokens && history.length > 4) {
      // Never remove the first message (contains initial intent)
      // Never remove the last 3 messages (recent context)
      // Remove the oldest non-protected message
      const removeIndex = this.findOldestRemovable(history);

      if (removeIndex === -1) break;

      // Before removing, extract key facts to medium-term memory
      this.extractToMediumTerm(history[removeIndex]);

      history.splice(removeIndex, 1);
      totalTokens = this.estimateTokens(history);
    }

    return history;
  }

  private findOldestRemovable(history: Message[]): number {
    // Protected: index 0 (first message) and last 3
    const protectedIndices = new Set([0, history.length - 1,
      history.length - 2, history.length - 3]);

    for (let i = 1; i < history.length - 3; i++) {
      if (!protectedIndices.has(i) && !history[i].isPinned) {
        return i;
      }
    }
    return -1;
  }

  private async extractToMediumTerm(message: Message): Promise<void> {
    const facts = await extractKeyFacts(message.content);
    if (facts.length > 0) {
      await mediumTermMemory.store(message.userId, message.conversationId, facts);
    }
  }
}
```

### 2.2 Layer 2: Session Memory (PostgreSQL)

What happened in recent conversations. Stored in the database, retrieved when relevant.

**Storage**: PostgreSQL with JSONB
**Duration**: 30 days (configurable per tier)
**Retrieval**: Database query (~5-20ms)
**Cost**: Low (indexed queries)

```sql
CREATE TABLE conversation_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL REFERENCES users(id),
  agent_id        INTEGER NOT NULL,
  title           TEXT,
  summary         TEXT,          -- AI-generated summary
  key_facts       JSONB NOT NULL DEFAULT '[]',
  user_intent     TEXT,
  outcome         TEXT,          -- 'completed', 'abandoned', 'continued'
  message_count   INTEGER NOT NULL DEFAULT 0,
  first_message   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE conversation_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL REFERENCES conversation_sessions(id) ON DELETE CASCADE,
  role            TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content         TEXT NOT NULL,
  token_count     INTEGER NOT NULL,
  metadata        JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON conversation_sessions(user_id, last_message DESC);
CREATE INDEX idx_sessions_agent ON conversation_sessions(user_id, agent_id);
CREATE INDEX idx_messages_session ON conversation_messages(session_id, created_at);
CREATE INDEX idx_sessions_expiry ON conversation_sessions(expires_at)
  WHERE expires_at IS NOT NULL;

-- Session retention by tier
-- FREE: 7 days
-- STARTER: 14 days
-- PLUS: 30 days
-- SMART: 60 days
-- PRO: 90 days
```

**Session Summarization**:

When a conversation ends (or reaches a natural pause), the system generates a summary:

```typescript
async function summarizeSession(
  sessionId: string,
  messages: Message[]
): Promise<SessionSummary> {
  // Generate a concise summary focused on actionable information
  const summary = await generateSummary(messages, {
    maxLength: 500,
    focus: ['user_intent', 'decisions_made', 'tasks_completed',
            'tasks_remaining', 'preferences_learned'],
  });

  // Extract structured key facts
  const keyFacts = await extractKeyFacts(messages);

  // Determine outcome
  const outcome = detectOutcome(messages);

  await db.conversationSession.update({
    where: { id: sessionId },
    data: {
      summary: summary.text,
      keyFacts: keyFacts,
      outcome,
    },
  });

  return { summary, keyFacts, outcome };
}
```

### 2.3 Layer 3: Long-Term Memory (PostgreSQL + pgvector)

What the system knows about this user across all time. This is the user model.

**Storage**: PostgreSQL with pgvector for semantic search
**Duration**: Indefinite (grows and is pruned over time)
**Retrieval**: Semantic search (~10-50ms) or direct query
**Cost**: Medium (embedding generation + vector search)

```sql
-- Structured long-term memory
CREATE TABLE user_memory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL REFERENCES users(id),
  category        TEXT NOT NULL, -- 'preference', 'fact', 'skill', 'relationship', 'goal'
  key             TEXT NOT NULL,
  value           TEXT NOT NULL,
  confidence      FLOAT NOT NULL DEFAULT 0.5, -- How sure are we about this?
  source          TEXT NOT NULL,     -- Which conversation/event established this
  last_confirmed  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  times_referenced INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(user_id, category, key)
);

-- Semantic memory (vector-based)
CREATE TABLE user_semantic_memory (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL REFERENCES users(id),
  content         TEXT NOT NULL,
  embedding       vector(1536) NOT NULL,
  memory_type     TEXT NOT NULL, -- 'conversation_extract', 'user_statement', 'learned_preference'
  source_session  UUID REFERENCES conversation_sessions(id),
  importance      FLOAT NOT NULL DEFAULT 0.5,
  decay_rate      FLOAT NOT NULL DEFAULT 0.01, -- How fast this memory fades
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_memory_lookup
  ON user_memory(user_id, category);
CREATE INDEX idx_semantic_memory_user
  ON user_semantic_memory(user_id);
CREATE INDEX idx_semantic_memory_embedding
  ON user_semantic_memory USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

**Memory Categories and Examples**:

```typescript
const memoryCategories = {
  preference: {
    // How the user likes things
    examples: [
      { key: 'communication_style', value: 'casual, direct' },
      { key: 'detail_level', value: 'concise over verbose' },
      { key: 'code_style', value: 'TypeScript, functional, Zod validation' },
    ],
  },
  fact: {
    // Things about the user
    examples: [
      { key: 'industry', value: 'SaaS technology' },
      { key: 'role', value: 'founder' },
      { key: 'company', value: 'runs three businesses' },
    ],
  },
  skill: {
    // User's demonstrated capabilities
    examples: [
      { key: 'typescript', value: 'advanced' },
      { key: 'marketing', value: 'intermediate' },
      { key: 'design', value: 'beginner' },
    ],
  },
  relationship: {
    // User's connections and context
    examples: [
      { key: 'team_size', value: 'solo founder' },
      { key: 'bestie_configured', value: 'yes, supportive coach path' },
    ],
  },
  goal: {
    // What the user is working toward
    examples: [
      { key: 'current_project', value: 'launching Stone AI v2' },
      { key: 'learning_goal', value: 'improve marketing copy' },
    ],
  },
};
```

---

## 3. Memory Retrieval at Conversation Start

When a user opens a conversation with an agent, the system assembles relevant memory:

```typescript
async function assembleUserContext(
  userId: string,
  agentId: number,
  initialMessage: string
): Promise<UserContext> {
  // Parallel retrieval for speed
  const [
    structuredMemory,
    recentSessions,
    semanticMatches,
  ] = await Promise.all([
    // Get structured facts
    getStructuredMemory(userId),
    // Get recent conversation summaries
    getRecentSessions(userId, agentId, 5),
    // Get semantically relevant memories
    getSemanticMatches(userId, initialMessage, 10),
  ]);

  // Compile into a context string that fits the token budget
  return compileContext({
    structured: structuredMemory,
    sessions: recentSessions,
    semantic: semanticMatches,
    maxTokens: TOKEN_BUDGET.userContext,
    prioritize: agentId, // Prioritize memories relevant to this agent
  });
}

function compileContext(params: ContextParams): UserContext {
  const sections: string[] = [];
  let tokenCount = 0;

  // Priority 1: Core user facts
  const coreFacts = params.structured
    .filter(m => m.confidence > 0.7 && m.times_referenced > 2)
    .map(m => `${m.key}: ${m.value}`);
  sections.push(`User Profile:\n${coreFacts.join('\n')}`);
  tokenCount += estimateTokens(sections[0]);

  // Priority 2: Recent session context
  if (params.sessions.length > 0 && tokenCount < params.maxTokens * 0.6) {
    const sessionSummaries = params.sessions
      .map(s => `[${formatDate(s.last_message)}] ${s.summary}`)
      .join('\n');
    sections.push(`Recent History:\n${sessionSummaries}`);
    tokenCount += estimateTokens(sections[sections.length - 1]);
  }

  // Priority 3: Semantically relevant memories
  if (params.semantic.length > 0 && tokenCount < params.maxTokens * 0.85) {
    const relevantMemories = params.semantic
      .filter(m => m.similarity > 0.7)
      .map(m => m.content);
    if (relevantMemories.length > 0) {
      sections.push(`Relevant Context:\n${relevantMemories.join('\n')}`);
    }
  }

  return {
    contextString: sections.join('\n\n'),
    tokenCount: estimateTokens(sections.join('\n\n')),
    sourceCount: {
      structured: coreFacts.length,
      sessions: params.sessions.length,
      semantic: params.semantic.filter(m => m.similarity > 0.7).length,
    },
  };
}
```

---

## 4. Memory Formation Pipeline

### 4.1 When Memories Are Created

Memories are created at specific points, not continuously:

```typescript
enum MemoryTrigger {
  // User explicitly states something
  USER_STATEMENT = 'user_statement',
  // "I'm a developer" → fact: role = developer

  // System infers from behavior
  BEHAVIORAL_INFERENCE = 'behavioral_inference',
  // User always writes TypeScript → skill: typescript = advanced

  // Conversation ends
  SESSION_END = 'session_end',
  // Summary + key facts extracted

  // User corrects the system
  USER_CORRECTION = 'user_correction',
  // "No, I said Python not JavaScript" → update skill, high confidence

  // User expresses preference
  USER_PREFERENCE = 'user_preference',
  // "Don't give me long explanations" → preference: detail_level = concise
}
```

### 4.2 Memory Extraction Pipeline

```typescript
class MemoryExtractor {
  async extractFromMessage(
    message: Message,
    conversation: Conversation
  ): Promise<MemoryCandidate[]> {
    const candidates: MemoryCandidate[] = [];

    // Check for explicit statements
    const statements = await detectExplicitStatements(message.content);
    for (const stmt of statements) {
      candidates.push({
        category: classifyStatement(stmt),
        key: stmt.key,
        value: stmt.value,
        confidence: 0.9, // User said it directly
        trigger: MemoryTrigger.USER_STATEMENT,
      });
    }

    // Check for preference expressions
    const preferences = await detectPreferences(message.content);
    for (const pref of preferences) {
      candidates.push({
        category: 'preference',
        key: pref.key,
        value: pref.value,
        confidence: 0.85,
        trigger: MemoryTrigger.USER_PREFERENCE,
      });
    }

    // Check for corrections
    if (conversation.messages.length >= 2) {
      const corrections = await detectCorrections(
        message.content,
        conversation.messages.slice(-3)
      );
      for (const correction of corrections) {
        candidates.push({
          category: correction.category,
          key: correction.key,
          value: correction.newValue,
          confidence: 0.95, // Corrections are very reliable
          trigger: MemoryTrigger.USER_CORRECTION,
          replaces: correction.oldValue,
        });
      }
    }

    return candidates;
  }

  async processCandidate(
    userId: string,
    candidate: MemoryCandidate
  ): Promise<void> {
    // Check if this memory already exists
    const existing = await db.userMemory.findUnique({
      where: {
        userId_category_key: {
          userId,
          category: candidate.category,
          key: candidate.key,
        },
      },
    });

    if (existing) {
      // Update existing memory
      if (candidate.confidence > existing.confidence ||
          candidate.trigger === MemoryTrigger.USER_CORRECTION) {
        await db.userMemory.update({
          where: { id: existing.id },
          data: {
            value: candidate.value,
            confidence: candidate.confidence,
            lastConfirmed: new Date(),
            timesReferenced: existing.timesReferenced + 1,
          },
        });
      } else {
        // Just bump the reference count and confirmation time
        await db.userMemory.update({
          where: { id: existing.id },
          data: {
            lastConfirmed: new Date(),
            timesReferenced: existing.timesReferenced + 1,
          },
        });
      }
    } else {
      // Create new memory
      await db.userMemory.create({
        data: {
          userId,
          category: candidate.category,
          key: candidate.key,
          value: candidate.value,
          confidence: candidate.confidence,
          source: candidate.sourceSessionId,
        },
      });
    }

    // Also create semantic embedding for vector search
    const embedding = await generateEmbedding(
      `${candidate.category}: ${candidate.key} = ${candidate.value}`
    );
    await db.userSemanticMemory.create({
      data: {
        userId,
        content: `${candidate.key}: ${candidate.value}`,
        embedding,
        memoryType: candidate.trigger,
        importance: candidate.confidence,
      },
    });
  }
}
```

---

## 5. Memory Decay and Pruning

### 5.1 Memory Decay Model

Not all memories should live forever. The system uses a decay model inspired by human memory:

```typescript
interface MemoryDecayConfig {
  // Base half-life by category (in days)
  halfLife: {
    preference: 180,    // Preferences are stable
    fact: 365,          // Facts rarely change
    skill: 90,          // Skills evolve
    relationship: 120,  // Relationships shift
    goal: 30,           // Goals change frequently
  };

  // Factors that slow decay
  stabilizers: {
    highConfidence: 2.0,      // Confident memories decay 2x slower
    frequentlyReferenced: 1.5, // Often-used memories stay longer
    userCorrected: 3.0,       // User corrections are very sticky
    recentlyConfirmed: 2.0,   // Recently validated memories persist
  };
}

function calculateMemoryStrength(
  memory: UserMemory,
  config: MemoryDecayConfig
): number {
  const baseHalfLife = config.halfLife[memory.category];

  // Apply stabilizers
  let effectiveHalfLife = baseHalfLife;
  if (memory.confidence > 0.8) effectiveHalfLife *= config.stabilizers.highConfidence;
  if (memory.timesReferenced > 5) effectiveHalfLife *= config.stabilizers.frequentlyReferenced;

  // Calculate current strength (exponential decay)
  const daysSinceConfirmed = daysBetween(memory.lastConfirmed, new Date());
  const strength = Math.pow(0.5, daysSinceConfirmed / effectiveHalfLife);

  return strength; // 0 to 1
}
```

### 5.2 Pruning Strategy

```typescript
async function pruneMemories(userId: string): Promise<PruneResult> {
  const memories = await db.userMemory.findMany({ where: { userId } });

  const toDelete: string[] = [];
  const toDowngrade: string[] = [];

  for (const memory of memories) {
    const strength = calculateMemoryStrength(memory, DECAY_CONFIG);

    if (strength < 0.1) {
      toDelete.push(memory.id);
    } else if (strength < 0.3 && memory.confidence < 0.5) {
      toDowngrade.push(memory.id);
    }
  }

  // Delete weak memories
  if (toDelete.length > 0) {
    await db.userMemory.deleteMany({ where: { id: { in: toDelete } } });
    await db.userSemanticMemory.deleteMany({
      where: { userId, content: { in: toDelete.map(id => getContent(id)) } }
    });
  }

  // Downgrade borderline memories
  if (toDowngrade.length > 0) {
    await db.userMemory.updateMany({
      where: { id: { in: toDowngrade } },
      data: { confidence: { decrement: 0.1 } },
    });
  }

  return { deleted: toDelete.length, downgraded: toDowngrade.length };
}

// Run pruning daily via cron
// SELECT user_id FROM users WHERE last_active > NOW() - INTERVAL '90 days'
// For each active user, run pruneMemories
```

---

## 6. Semantic Recall with pgvector

### 6.1 Embedding Strategy

```typescript
async function generateEmbedding(text: string): Promise<number[]> {
  // Use a local embedding model or API
  // For Stone AI: use the same Qwen model for embeddings
  // or a dedicated embedding model (e.g., sentence-transformers)

  const response = await embeddingModel.encode(text);
  return response.embedding; // 1536-dimensional vector
}

// Store with metadata for filtered retrieval
async function storeSemanticMemory(
  userId: string,
  content: string,
  metadata: {
    type: string;
    sessionId?: string;
    agentId?: number;
    importance: number;
  }
): Promise<void> {
  const embedding = await generateEmbedding(content);

  await db.userSemanticMemory.create({
    data: {
      userId,
      content,
      embedding,
      memoryType: metadata.type,
      sourceSession: metadata.sessionId,
      importance: metadata.importance,
    },
  });
}
```

### 6.2 Retrieval Queries

```sql
-- Find memories relevant to a user's current message
-- $1 = embedding of current message
-- $2 = user_id
-- $3 = minimum similarity threshold
SELECT
  content,
  memory_type,
  importance,
  1 - (embedding <=> $1::vector) as similarity,
  created_at
FROM user_semantic_memory
WHERE user_id = $2
  AND 1 - (embedding <=> $1::vector) > $3
ORDER BY
  (1 - (embedding <=> $1::vector)) * importance DESC
LIMIT 10;

-- Find memories relevant to a specific agent context
-- Weights memories that were created during sessions with the same agent
SELECT
  usm.content,
  usm.memory_type,
  usm.importance,
  1 - (usm.embedding <=> $1::vector) as similarity,
  CASE WHEN cs.agent_id = $4 THEN 1.5 ELSE 1.0 END as agent_boost
FROM user_semantic_memory usm
LEFT JOIN conversation_sessions cs ON usm.source_session = cs.id
WHERE usm.user_id = $2
  AND 1 - (usm.embedding <=> $1::vector) > $3
ORDER BY
  (1 - (usm.embedding <=> $1::vector)) * usm.importance
  * CASE WHEN cs.agent_id = $4 THEN 1.5 ELSE 1.0 END DESC
LIMIT 10;
```

### 6.3 Hybrid Retrieval (Structured + Semantic)

```typescript
async function hybridRetrieve(
  userId: string,
  query: string,
  agentId: number
): Promise<RetrievedMemory[]> {
  const queryEmbedding = await generateEmbedding(query);

  // Parallel retrieval
  const [structured, semantic] = await Promise.all([
    // Structured: exact key-value lookups
    db.userMemory.findMany({
      where: { userId, confidence: { gte: 0.5 } },
      orderBy: { timesReferenced: 'desc' },
      take: 20,
    }),
    // Semantic: vector similarity search
    db.$queryRaw`
      SELECT content, memory_type, importance,
        1 - (embedding <=> ${queryEmbedding}::vector) as similarity
      FROM user_semantic_memory
      WHERE user_id = ${userId}
        AND 1 - (embedding <=> ${queryEmbedding}::vector) > 0.6
      ORDER BY (1 - (embedding <=> ${queryEmbedding}::vector)) * importance DESC
      LIMIT 15
    `,
  ]);

  // Merge and deduplicate
  const merged = mergeResults(structured, semantic);

  // Rank by relevance to current context
  return rankByRelevance(merged, query, agentId);
}
```

---

## 7. Cross-Agent Memory Sharing

### 7.1 Shared vs. Agent-Specific Memory

Some memories belong to the user globally. Others are specific to an agent's domain:

```typescript
interface MemoryVisibility {
  // Global memories — all agents can see
  global: {
    categories: ['preference', 'fact', 'relationship'],
    examples: [
      'communication_style: casual',
      'industry: SaaS technology',
      'name: Jordan',
    ],
  };

  // Agent-scoped memories — only relevant agent sees
  agentScoped: {
    categories: ['skill', 'goal'],
    scope: 'agent_domain', // Coding skills → code agents, writing skills → writing agents
    examples: [
      'typescript_level: advanced (code agents only)',
      'marketing_goal: improve CTAs (marketing agents only)',
    ],
  };

  // Conversation-private memories — only within one conversation
  conversationPrivate: {
    categories: ['task_state', 'temporary_preference'],
    examples: [
      'working_on: blog post about AI trends',
      'temporary: wants bullet points not paragraphs for this task',
    ],
  };
}
```

### 7.2 Memory Synchronization

When a user interacts with Agent A and reveals information relevant to Agent B:

```typescript
async function syncMemoryAcrossAgents(
  userId: string,
  memory: MemoryCandidate,
  sourceAgentId: number
): Promise<void> {
  // Determine which agents should receive this memory
  const visibility = determineVisibility(memory);

  if (visibility === 'global') {
    // Store in shared user memory — all agents see it
    await storeUserMemory(userId, memory);
  } else if (visibility === 'agent_scoped') {
    // Store with agent domain tag
    const relevantDomains = mapToDomains(memory);
    await storeUserMemory(userId, memory, { domains: relevantDomains });
  }
  // conversation_private memories are not synced
}
```

---

## 8. Privacy and Security

### 8.1 Memory Access Controls

```typescript
const memoryAccessRules = {
  // Users can view their own memories
  userCanView: true,

  // Users can delete specific memories
  userCanDelete: true,

  // Users can export all their memory data (GDPR)
  userCanExport: true,

  // Memories are encrypted at rest
  encryptionRequired: true,
  encryptionAlgorithm: 'AES-256-GCM',

  // No memory data in logs
  loggingExcluded: true,

  // Memory is deleted when user deletes account
  cascadeDelete: true,

  // No cross-user memory leakage
  isolationLevel: 'strict',
};
```

### 8.2 PII in Memory

```typescript
async function sanitizeBeforeStorage(
  content: string
): Promise<{ sanitized: string; piiDetected: PIIItem[] }> {
  const piiPatterns = {
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
    address: /\b\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|blvd)\b/gi,
  };

  let sanitized = content;
  const piiDetected: PIIItem[] = [];

  for (const [type, pattern] of Object.entries(piiPatterns)) {
    const matches = content.match(pattern);
    if (matches) {
      for (const match of matches) {
        piiDetected.push({ type, value: match, redacted: true });
        sanitized = sanitized.replace(match, `[REDACTED_${type.toUpperCase()}]`);
      }
    }
  }

  return { sanitized, piiDetected };
}
```

### 8.3 User Memory Dashboard

Users should be able to see and manage what the AI remembers about them:

```typescript
// API endpoint: GET /api/memory
async function getUserMemory(userId: string): Promise<MemoryDashboard> {
  const [structured, sessionCount, semanticCount] = await Promise.all([
    db.userMemory.findMany({
      where: { userId },
      orderBy: { lastConfirmed: 'desc' },
    }),
    db.conversationSession.count({ where: { userId } }),
    db.userSemanticMemory.count({ where: { userId } }),
  ]);

  return {
    memories: structured.map(m => ({
      id: m.id,
      category: m.category,
      key: m.key,
      value: m.value,
      confidence: m.confidence,
      lastConfirmed: m.lastConfirmed,
      canDelete: true,
    })),
    stats: {
      totalStructured: structured.length,
      totalSessions: sessionCount,
      totalSemantic: semanticCount,
    },
  };
}

// API endpoint: DELETE /api/memory/:id
async function deleteMemory(userId: string, memoryId: string): Promise<void> {
  // Verify ownership
  const memory = await db.userMemory.findFirst({
    where: { id: memoryId, userId },
  });

  if (!memory) throw new Error('Memory not found');

  await db.userMemory.delete({ where: { id: memoryId } });

  // Also remove associated semantic memories
  await db.userSemanticMemory.deleteMany({
    where: { userId, content: { contains: memory.key } },
  });
}

// API endpoint: DELETE /api/memory/all
async function deleteAllMemory(userId: string): Promise<void> {
  await Promise.all([
    db.userMemory.deleteMany({ where: { userId } }),
    db.userSemanticMemory.deleteMany({ where: { userId } }),
    db.conversationSession.deleteMany({ where: { userId } }),
    db.conversationMessages.deleteMany({
      where: { session: { userId } }
    }),
  ]);
}
```

---

## 9. Performance Optimization

### 9.1 Caching Strategy

```typescript
// Redis cache for frequently accessed memories
class MemoryCache {
  private redis: Redis;
  private ttl = 3600; // 1 hour cache

  async getUserContext(userId: string): Promise<UserContext | null> {
    const cached = await this.redis.get(`memory:context:${userId}`);
    if (cached) return JSON.parse(cached);
    return null;
  }

  async setUserContext(userId: string, context: UserContext): Promise<void> {
    await this.redis.setex(
      `memory:context:${userId}`,
      this.ttl,
      JSON.stringify(context)
    );
  }

  // Invalidate when new memories are created
  async invalidate(userId: string): Promise<void> {
    await this.redis.del(`memory:context:${userId}`);
  }
}
```

### 9.2 Query Optimization

```sql
-- Materialized view for fast user context assembly
CREATE MATERIALIZED VIEW user_context_summary AS
SELECT
  um.user_id,
  jsonb_object_agg(um.key, um.value) FILTER (WHERE um.category = 'preference') as preferences,
  jsonb_object_agg(um.key, um.value) FILTER (WHERE um.category = 'fact') as facts,
  jsonb_object_agg(um.key, um.value) FILTER (WHERE um.category = 'skill') as skills,
  (SELECT COUNT(*) FROM conversation_sessions cs WHERE cs.user_id = um.user_id) as session_count,
  (SELECT MAX(last_message) FROM conversation_sessions cs WHERE cs.user_id = um.user_id) as last_active
FROM user_memory um
WHERE um.confidence > 0.5
GROUP BY um.user_id;

CREATE UNIQUE INDEX idx_context_summary_user ON user_context_summary(user_id);

-- Refresh periodically (every 15 minutes)
REFRESH MATERIALIZED VIEW CONCURRENTLY user_context_summary;
```

---

## 10. Production Checklist

- [ ] Three-layer memory model implemented (working, session, long-term)
- [ ] Sliding window manages 32K token context without data loss
- [ ] Session summaries generated at conversation end
- [ ] pgvector indexes created and tuned (ivfflat with appropriate list count)
- [ ] Memory extraction pipeline runs on every message
- [ ] PII detection and sanitization before storage
- [ ] Memory decay and pruning runs daily for active users
- [ ] Cross-agent memory sharing respects visibility rules
- [ ] User memory dashboard API endpoints implemented
- [ ] Redis caching layer reduces database queries
- [ ] GDPR compliance: export and delete all user memory on request
- [ ] Memory isolation: no cross-user leakage possible
- [ ] AES-256-GCM encryption at rest for all memory tables
- [ ] Tier-based session retention configured and enforced
- [ ] Load testing: memory retrieval under 50ms at p99 for 100K users
