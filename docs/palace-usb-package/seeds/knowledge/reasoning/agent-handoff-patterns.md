# Agent Handoff Patterns for Multi-Agent Systems

## Seed Classification
- **Domain**: Agent Architecture / Conversation Routing
- **Applies to**: Stone AI's 40-agent ecosystem, routing layer, context management
- **Priority**: Critical — handoffs are where multi-agent systems break
- **Last Updated**: 2026-03-09

---

## 1. The Handoff Problem

In a multi-agent system, the moment a user is transferred from one agent to another is the most fragile point in the entire experience. Every piece of context the user has built with Agent A must survive the transition to Agent B. If the user has to repeat themselves, the multi-agent system is worse than a single agent.

Stone AI has 40 agents (38 user-facing + Stone internal + Chaos founder-only). Users on higher tiers can access up to 38 agents in a single session. The handoff system must be invisible to the user — they should feel like they are talking to one system that happens to have different specialists, not like they are being bounced between disconnected chatbots.

### The Cost of Bad Handoffs

```
Bad handoff experience:
User → Agent A: "I need to build a landing page for my SaaS"
Agent A: "I can help with that! What's your product about?"
User: [explains product in detail]
Agent A: "This needs design work. Let me transfer you to Pixel."
Pixel: "Hi! I'm Pixel, the design agent. What can I help with?"
User: "...I just explained everything. Did you not get any of that?"
```

The user is now frustrated. They have lost trust in the system. They may leave.

```
Good handoff experience:
User → Agent A: "I need to build a landing page for my SaaS"
Agent A: "Got it. For the copy and layout, I'll bring in Pixel —
they're the design specialist. Everything you told me transfers."
Pixel: "Hey — I see you're building a landing page for [product].
You mentioned [key detail]. Let's start with the layout.
Hero section first?"
```

The user feels continuity. The system earns trust.

---

## 2. Context Preservation Architecture

### 2.1 The Handoff Context Package

Every handoff carries a structured context package:

```typescript
interface HandoffContext {
  // Source information
  sourceAgent: {
    id: number;
    name: string;
    specialty: string;
  };

  // Conversation state
  conversationSummary: string;         // Compressed conversation so far
  userIntent: string;                  // What the user is trying to accomplish
  taskProgress: {
    completed: string[];               // What's been done
    inProgress: string[];              // What's mid-stream
    pending: string[];                 // What still needs doing
  };

  // User context
  userPreferences: {
    communicationStyle: string;
    detailLevel: string;
    knownExpertise: string;
  };

  // Technical context
  relevantData: Record<string, unknown>; // Files, code, data from conversation
  conversationHistory: Message[];        // Last N messages for reference

  // Handoff metadata
  reason: string;                      // Why the handoff is happening
  urgency: 'low' | 'medium' | 'high';
  returnExpected: boolean;             // Should user come back to source?
  timestamp: Date;
}
```

### 2.2 Context Compression for Handoffs

Full conversation history is too large to pass between agents (32K token context windows). The system compresses context intelligently:

```typescript
async function compressForHandoff(
  conversation: Message[],
  targetAgent: AgentConfig
): Promise<CompressedContext> {
  // Step 1: Extract key facts (not full messages)
  const keyFacts = await extractKeyFacts(conversation);

  // Step 2: Filter for relevance to target agent
  const relevantFacts = keyFacts.filter(fact =>
    isRelevantToAgent(fact, targetAgent.specialty)
  );

  // Step 3: Include last 3 messages verbatim (recent context)
  const recentMessages = conversation.slice(-3);

  // Step 4: Summarize everything else
  const olderSummary = await summarize(
    conversation.slice(0, -3),
    { maxTokens: 500, focus: targetAgent.specialty }
  );

  return {
    summary: olderSummary,
    keyFacts: relevantFacts,
    recentMessages,
    totalTokens: estimateTokens(olderSummary + relevantFacts + recentMessages),
  };
}
```

### 2.3 Semantic Context with pgvector

For deep context preservation, conversation embeddings are stored and retrieved:

```sql
-- Store conversation context as embeddings
CREATE TABLE conversation_context (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  user_id       TEXT NOT NULL REFERENCES users(id),
  agent_id      INTEGER NOT NULL,
  content       TEXT NOT NULL,
  embedding     vector(1536) NOT NULL,
  context_type  TEXT NOT NULL, -- 'fact', 'preference', 'task', 'decision'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_context_embedding ON conversation_context
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Retrieve relevant context for a new agent
SELECT content, context_type,
  1 - (embedding <=> $1::vector) as similarity
FROM conversation_context
WHERE user_id = $2
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY embedding <=> $1::vector
LIMIT 10;
```

---

## 3. Handoff Trigger Patterns

### 3.1 User-Initiated Handoff

The user explicitly asks for a different agent:

```
User: "Can I talk to the coding agent?"
User: "I need help with design, not writing"
User: "Switch me to Agent #12"
```

**Handling**:
```typescript
async function handleUserInitiatedHandoff(
  request: string,
  currentConversation: Conversation,
  userTier: Tier
): Promise<HandoffResult> {
  const targetAgent = parseAgentRequest(request);

  // Check tier access
  if (!hasAccess(userTier, targetAgent.id)) {
    return {
      success: false,
      message: `${targetAgent.name} is available on the ${requiredTier(targetAgent.id)} plan.
                Want me to help you with this instead?`,
    };
  }

  // Build context package
  const context = await compressForHandoff(
    currentConversation.messages,
    targetAgent
  );

  // Execute handoff
  return executeHandoff(currentConversation, targetAgent, context);
}
```

### 3.2 System-Initiated Handoff

The current agent determines that another agent would serve the user better:

```typescript
interface HandoffDecision {
  shouldHandoff: boolean;
  reason: string;
  targetAgent: number;
  confidence: number; // 0-1, must be > 0.8 to auto-handoff
}

async function evaluateHandoffNeed(
  message: string,
  currentAgent: AgentConfig,
  conversation: Conversation
): Promise<HandoffDecision> {
  // Check if the user's request is outside current agent's specialty
  const intentMatch = await scoreIntentMatch(message, currentAgent);

  if (intentMatch.score < 0.4) {
    // Strong mismatch — suggest handoff
    const bestAgent = await findBestAgent(message, conversation.userTier);
    return {
      shouldHandoff: true,
      reason: `User's request is about ${intentMatch.detectedDomain},
               which is ${bestAgent.name}'s specialty`,
      targetAgent: bestAgent.id,
      confidence: bestAgent.matchScore,
    };
  }

  if (intentMatch.score < 0.6) {
    // Moderate mismatch — can handle but suboptimal
    // Only suggest if the better agent is significantly better
    const bestAgent = await findBestAgent(message, conversation.userTier);
    if (bestAgent.matchScore - intentMatch.score > 0.3) {
      return {
        shouldHandoff: true,
        reason: `${bestAgent.name} would handle this significantly better`,
        targetAgent: bestAgent.id,
        confidence: bestAgent.matchScore,
      };
    }
  }

  return { shouldHandoff: false, reason: '', targetAgent: 0, confidence: 0 };
}
```

### 3.3 Escalation Handoff

When an agent cannot resolve an issue and needs to escalate:

```typescript
const escalationRules = {
  // Agent fails twice on same request → escalate
  repeatedFailure: {
    threshold: 2,
    target: 'stone', // Agent Stone handles escalations
    priority: 'high',
  },

  // User expresses frustration → escalate
  frustrationDetected: {
    signals: ['this is useless', 'let me talk to someone else',
              'you keep getting it wrong', 'never mind'],
    target: 'stone',
    priority: 'critical',
  },

  // Technical limit hit → escalate to appropriate specialist
  technicalLimit: {
    triggers: ['context_window_full', 'unsupported_format', 'api_error'],
    target: 'dynamic', // Determined by error type
    priority: 'medium',
  },
};
```

---

## 4. The 44-Agent Routing Matrix

### 4.1 Agent Capability Map

```typescript
interface AgentCapability {
  id: number;
  name: string;
  primaryDomain: string;
  secondaryDomains: string[];
  handoffTargets: number[];      // Agents this one commonly hands off to
  handoffSources: number[];      // Agents that commonly hand off to this one
  contextNeeds: string[];        // What context this agent needs from handoffs
}

// Example routing relationships
const routingMatrix: Record<number, number[]> = {
  // Writing agent → Design, Research, Code
  1: [7, 15, 22],
  // Design agent → Writing, Code, Marketing
  7: [1, 22, 30],
  // Research agent → Writing, Analysis, Strategy
  15: [1, 18, 25],
  // Code agent → Design, Testing, DevOps
  22: [7, 28, 33],
  // ... (full matrix for all 38 user-facing agents)
};
```

### 4.2 Multi-Step Handoff Chains

Some tasks require a chain of agents:

```
User: "I need a complete blog post with custom illustrations
       and SEO optimization"

Chain: Research (#15) → Writing (#1) → Design (#7) → SEO (#30)

Step 1: Research gathers topic data and outlines
Step 2: Writing creates the draft using research output
Step 3: Design creates illustrations matching the content
Step 4: SEO optimizes headings, meta, and keywords
```

**Chain Orchestration**:

```typescript
interface HandoffChain {
  id: string;
  userId: string;
  originalRequest: string;
  steps: ChainStep[];
  currentStep: number;
  aggregatedContext: HandoffContext;
  status: 'active' | 'paused' | 'completed' | 'failed';
}

interface ChainStep {
  agentId: number;
  task: string;
  input: unknown;
  output: unknown | null;
  status: 'pending' | 'active' | 'completed' | 'failed';
  startedAt: Date | null;
  completedAt: Date | null;
}

async function executeChain(chain: HandoffChain): Promise<ChainResult> {
  for (let i = chain.currentStep; i < chain.steps.length; i++) {
    const step = chain.steps[i];

    // Notify user of transition
    await notifyUser(chain.userId,
      `Moving to step ${i + 1}: ${getAgentName(step.agentId)} is working on ${step.task}`
    );

    // Execute step with accumulated context
    const result = await executeWithAgent(
      step.agentId,
      step.task,
      { ...chain.aggregatedContext, previousStepOutput: chain.steps[i-1]?.output }
    );

    if (result.success) {
      step.output = result.data;
      step.status = 'completed';
      step.completedAt = new Date();

      // Add this step's output to accumulated context
      chain.aggregatedContext = mergeContext(chain.aggregatedContext, result.context);
    } else {
      step.status = 'failed';
      return handleChainFailure(chain, i, result.error);
    }
  }

  return { success: true, chain };
}
```

---

## 5. Handoff UX Patterns

### 5.1 The Seamless Transition

The user barely notices the switch:

```
Agent (Writing): "Your blog post is ready. I noticed you mentioned
wanting illustrations — Pixel can create those to match your content.
Transferring now."

Pixel: "I've read your blog post. Here's what I'm thinking for
illustrations: [specific suggestions based on content].
Which direction do you prefer?"
```

### 5.2 The Informed Choice

The user decides whether to switch:

```
Agent (Writing): "I can take a shot at the technical diagram,
but honestly, Pixel would do a better job. Want me to:
1. Try it myself (faster, might not be as polished)
2. Hand off to Pixel (better result, they'll have full context)"
```

### 5.3 The Round-Trip

The user goes to another agent and comes back:

```typescript
async function handleRoundTrip(
  conversation: Conversation,
  sourceAgent: number,
  targetAgent: number,
  task: string
): Promise<void> {
  // Save bookmark in source conversation
  const bookmark = await createBookmark(conversation, {
    reason: `Visiting ${getAgentName(targetAgent)} for ${task}`,
    returnContext: conversation.messages.slice(-5),
  });

  // Execute handoff
  await executeHandoff(conversation, targetAgent, {
    returnTo: sourceAgent,
    returnBookmark: bookmark.id,
    task,
  });
}

// When user returns:
async function handleReturn(
  userId: string,
  bookmarkId: string
): Promise<string> {
  const bookmark = await getBookmark(bookmarkId);
  return `Welcome back! You left off here: ${bookmark.reason}.
          ${bookmark.returnContext ? 'Picking up where we stopped.' : ''}
          What's next?`;
}
```

### 5.4 The Parallel Handoff

Multiple agents work simultaneously:

```
User: "I need a pitch deck — slides, script, and financial projections"

System: "I'm putting three agents on this:
- Pixel for slide design
- Agent #1 for the script
- Agent #18 for financial modeling

They'll work with the context you've given me.
I'll assemble everything when they're done."
```

```typescript
async function parallelHandoff(
  userId: string,
  tasks: { agentId: number; task: string }[],
  sharedContext: HandoffContext
): Promise<ParallelResult> {
  // Launch all agents concurrently
  const promises = tasks.map(t =>
    executeWithAgent(t.agentId, t.task, sharedContext)
  );

  const results = await Promise.allSettled(promises);

  // Assemble results
  const assembled = results.map((r, i) => ({
    agent: tasks[i].agentId,
    task: tasks[i].task,
    success: r.status === 'fulfilled',
    output: r.status === 'fulfilled' ? r.value : null,
    error: r.status === 'rejected' ? r.reason : null,
  }));

  return { assembled, allSucceeded: assembled.every(a => a.success) };
}
```

---

## 6. Context Window Management During Handoffs

### 6.1 The Token Budget Problem

Each agent has a 32K token context window (Qwen 2.5). A handoff context package must fit within the target agent's available budget:

```typescript
function calculateHandoffBudget(
  targetAgent: AgentConfig
): number {
  const totalWindow = 32_768; // Qwen 2.5 32B context
  const systemPrompt = targetAgent.systemPromptTokens; // ~2-4K
  const reservedForResponse = 4_096; // Max response
  const reservedForUserMessages = 8_000; // Future conversation

  return totalWindow - systemPrompt - reservedForResponse - reservedForUserMessages;
  // Typically ~16-18K tokens available for handoff context
}

async function fitContextToBudget(
  context: HandoffContext,
  budget: number
): Promise<HandoffContext> {
  let currentTokens = estimateTokens(context);

  if (currentTokens <= budget) return context;

  // Progressive compression
  // 1. Reduce conversation history
  while (currentTokens > budget && context.conversationHistory.length > 3) {
    context.conversationHistory.shift();
    currentTokens = estimateTokens(context);
  }

  // 2. Summarize remaining history
  if (currentTokens > budget) {
    context.conversationSummary = await summarize(
      context.conversationHistory,
      { maxTokens: Math.floor(budget * 0.3) }
    );
    context.conversationHistory = context.conversationHistory.slice(-2);
    currentTokens = estimateTokens(context);
  }

  // 3. Trim relevant data
  if (currentTokens > budget) {
    context.relevantData = prioritizeData(context.relevantData, budget - currentTokens);
  }

  return context;
}
```

### 6.2 Smart Context Prioritization

Not all context is equally important. The system ranks context by relevance to the target agent:

```typescript
interface ContextPriority {
  essential: string[];    // Must include — user intent, key decisions
  important: string[];    // Should include — preferences, constraints
  helpful: string[];      // Nice to have — background, history
  optional: string[];     // Include if space allows
}

function prioritizeContext(
  context: HandoffContext,
  targetAgent: AgentConfig
): ContextPriority {
  return {
    essential: [
      context.userIntent,
      context.taskProgress.inProgress.join(', '),
      ...context.conversationHistory.slice(-2).map(m => m.content),
    ],
    important: [
      JSON.stringify(context.userPreferences),
      context.taskProgress.completed.join(', '),
      context.reason,
    ],
    helpful: [
      context.conversationSummary,
      context.taskProgress.pending.join(', '),
    ],
    optional: [
      JSON.stringify(context.relevantData),
      ...context.conversationHistory.slice(0, -2).map(m => m.content),
    ],
  };
}
```

---

## 7. Error Handling in Handoffs

### 7.1 Target Agent Unavailable

```typescript
async function handleAgentUnavailable(
  targetAgent: number,
  context: HandoffContext,
  userTier: Tier
): Promise<HandoffResult> {
  // Try fallback agents in the same domain
  const fallbacks = getFallbackAgents(targetAgent, userTier);

  for (const fallback of fallbacks) {
    if (await isAvailable(fallback.id)) {
      return {
        success: true,
        message: `${getAgentName(targetAgent)} is busy right now.
                  ${fallback.name} handles similar work — connecting you.`,
        agent: fallback,
      };
    }
  }

  // No fallback available — current agent keeps the task
  return {
    success: false,
    message: `All specialists are tied up. I'll handle this myself —
              might take a slightly different approach, but I've got
              the context.`,
    agent: null,
  };
}
```

### 7.2 Context Loss Recovery

```typescript
async function recoverLostContext(
  userId: string,
  conversationId: string
): Promise<RecoveredContext> {
  // Check persistent storage
  const storedContext = await db.conversationContext.findMany({
    where: { userId, conversationId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  if (storedContext.length > 0) {
    return {
      recovered: true,
      context: reconstructFromStored(storedContext),
      message: "I recovered the context from our earlier conversation.",
    };
  }

  // Check semantic memory via pgvector
  const semanticRecovery = await searchSemanticMemory(userId, conversationId);

  if (semanticRecovery.length > 0) {
    return {
      recovered: true,
      context: reconstructFromSemantic(semanticRecovery),
      message: "I found some context from our earlier work. Let me confirm — [summary]. Is that right?",
    };
  }

  // Full loss — ask user to re-state
  return {
    recovered: false,
    context: null,
    message: "I'm sorry — I lost track of where we were. Can you give me a quick recap?",
  };
}
```

### 7.3 Handoff Loop Prevention

```typescript
const MAX_HANDOFFS_PER_SESSION = 5;
const MAX_HANDOFFS_PER_MINUTE = 2;

async function preventHandoffLoop(
  userId: string,
  sessionId: string,
  proposedHandoff: HandoffDecision
): Promise<boolean> {
  const recentHandoffs = await getRecentHandoffs(userId, sessionId);

  // Too many handoffs total
  if (recentHandoffs.length >= MAX_HANDOFFS_PER_SESSION) {
    await notifyUser(userId,
      "I've been bouncing you around too much. Let me stick with this agent and work through it."
    );
    return false;
  }

  // Too many handoffs in quick succession
  const lastMinute = recentHandoffs.filter(
    h => h.timestamp > Date.now() - 60_000
  );
  if (lastMinute.length >= MAX_HANDOFFS_PER_MINUTE) {
    return false;
  }

  // Circular handoff detection (A → B → A)
  if (recentHandoffs.length >= 2) {
    const lastTwo = recentHandoffs.slice(-2);
    if (lastTwo[0].sourceAgent === proposedHandoff.targetAgent) {
      await notifyUser(userId,
        "We'd be going back to where we started. Let me handle this here."
      );
      return false;
    }
  }

  return true;
}
```

---

## 8. Handoff Analytics

### 8.1 Metrics to Track

```sql
CREATE TABLE handoff_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  session_id      UUID NOT NULL,
  source_agent    INTEGER NOT NULL,
  target_agent    INTEGER NOT NULL,
  handoff_type    TEXT NOT NULL, -- 'user_initiated', 'system_initiated', 'escalation'
  reason          TEXT NOT NULL,
  context_tokens  INTEGER NOT NULL, -- Size of handoff context
  success         BOOLEAN NOT NULL,
  user_repeated_info BOOLEAN DEFAULT FALSE, -- Did user have to re-explain?
  resolution_after_handoff BOOLEAN, -- Was the task resolved?
  satisfaction_signal TEXT, -- Detected sentiment after handoff
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Handoff success rate by agent pair
SELECT
  source_agent,
  target_agent,
  COUNT(*) as total_handoffs,
  AVG(CASE WHEN success THEN 1 ELSE 0 END) as success_rate,
  AVG(CASE WHEN user_repeated_info THEN 1 ELSE 0 END) as repeat_rate,
  AVG(CASE WHEN resolution_after_handoff THEN 1 ELSE 0 END) as resolution_rate
FROM handoff_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY source_agent, target_agent
ORDER BY total_handoffs DESC;
```

### 8.2 Quality Signals

The system detects whether a handoff was successful:

```typescript
async function evaluateHandoffQuality(
  handoffId: string,
  postHandoffMessages: Message[]
): Promise<HandoffQuality> {
  return {
    // Did the user re-explain their problem?
    userRepeatedInfo: await detectRepetition(postHandoffMessages),

    // Did the user express frustration?
    frustrationDetected: await detectFrustration(postHandoffMessages),

    // Was the task resolved within 5 messages of handoff?
    quickResolution: postHandoffMessages.length <= 5 &&
      await detectTaskCompletion(postHandoffMessages),

    // Did the user leave immediately after handoff?
    immediateAbandonment: postHandoffMessages.length <= 1,
  };
}
```

---

## 9. Production Implementation Checklist

- [ ] Handoff context package is structured and typed
- [ ] Context compression fits within target agent's token budget
- [ ] pgvector semantic memory stores conversation context
- [ ] User-initiated handoffs parse natural language agent requests
- [ ] System-initiated handoffs require > 0.8 confidence
- [ ] Escalation rules are configured for all failure modes
- [ ] Handoff loop prevention is active (max 5/session, no circular)
- [ ] Round-trip bookmarks preserve return context
- [ ] Parallel handoffs aggregate results correctly
- [ ] All 38 user-facing agents have routing relationships defined
- [ ] Handoff analytics table is instrumented
- [ ] Quality evaluation runs post-handoff
- [ ] Tier access is checked before every handoff
- [ ] Fallback agents are configured for every specialty domain
- [ ] Error recovery handles context loss gracefully
