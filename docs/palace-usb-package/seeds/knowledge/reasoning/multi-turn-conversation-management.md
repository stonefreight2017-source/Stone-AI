# Multi-Turn Conversation Management

## Seed Classification
- **Domain**: Agent Conversation & UX
- **Complexity**: Advanced
- **Applicability**: All 44 Stone AI agents, any conversational AI system
- **Prerequisites**: Basic NLP understanding, state machine concepts, database fundamentals

## Why This Matters

Single-turn question-answering is trivial. The real test of a conversational AI agent is what happens across 5, 15, or 50 turns. Users don't think in isolated queries — they build on previous statements, reference earlier context, change their minds, go on tangents, and circle back. An agent that can't track all of this feels broken.

Stone AI's 40 agents each maintain multi-turn conversations with users who expect the agent to remember what was said three messages ago, understand pronouns that reference entities from ten messages ago, and gracefully handle topic shifts without losing the thread. This seed teaches how to build that capability from the ground up.

---

## 1. Conversation State Machines

### 1.1 The Fundamental Model

Every conversation is a state machine. At any point, the conversation is in a specific state, and each user message triggers a transition to a new state.

**Core States:**
- **IDLE**: No active conversation. Waiting for user input.
- **GATHERING**: Collecting information needed to fulfill a request.
- **PROCESSING**: Agent is working on a task (generating response, running code, querying data).
- **PRESENTING**: Delivering results to the user.
- **CLARIFYING**: Asking user to disambiguate or confirm something.
- **REPAIR**: Conversation went off track; attempting recovery.
- **HANDOFF**: Transferring to another agent.
- **CLOSING**: Wrapping up the conversation naturally.

**State Transition Rules:**
```
IDLE → GATHERING:     User sends a message requiring information collection
IDLE → PROCESSING:    User sends a complete, actionable request
GATHERING → PROCESSING: All required information collected
GATHERING → CLARIFYING: User response is ambiguous
PROCESSING → PRESENTING: Result ready
PRESENTING → IDLE:     User acknowledges or no follow-up expected
PRESENTING → GATHERING: User asks follow-up requiring more info
CLARIFYING → GATHERING: Clarification received
CLARIFYING → REPAIR:   Multiple clarifications fail
ANY → REPAIR:          Misunderstanding detected
ANY → HANDOFF:         Request outside agent's domain
```

### 1.2 State Persistence in Stone AI

Stone AI persists conversation state in PostgreSQL:

```typescript
interface ConversationState {
  conversationId: string;
  currentState: ConversationStateEnum;
  turnCount: number;
  activeTopics: Topic[];
  pendingSlots: Slot[];         // Information still needed
  filledSlots: FilledSlot[];    // Information collected
  entityRegistry: EntityMap;    // All entities mentioned
  lastTransition: StateTransition;
  metadata: {
    agentId: string;
    userId: string;
    startedAt: Date;
    lastActivityAt: Date;
    emotionalTone: ToneEnum;
  };
}
```

Each turn updates this state. The state object is loaded at the start of each turn and saved at the end. This ensures that if the server restarts mid-conversation, the agent picks up exactly where it left off.

### 1.3 Substates and Nested Flows

Real conversations have nested states. A user might be in the middle of configuring their Bestie (GATHERING state) when they ask a tangential question about pricing (which triggers a sub-conversation). The agent needs to:

1. Push the current state onto a stack
2. Handle the tangential request
3. Pop back to the previous state
4. Resume naturally: "Now, back to your Bestie setup — you were choosing a communication style."

**Implementation Pattern:**
```typescript
class ConversationStack {
  private stack: ConversationState[] = [];

  push(state: ConversationState): void {
    this.stack.push(structuredClone(state));
  }

  pop(): ConversationState | undefined {
    return this.stack.pop();
  }

  peek(): ConversationState | undefined {
    return this.stack[this.stack.length - 1];
  }

  depth(): number {
    return this.stack.length;
  }

  // Prevent infinite nesting — cap at 3 levels
  canPush(): boolean {
    return this.stack.length < 3;
  }
}
```

If nesting exceeds 3 levels, the agent should complete the current tangent before accepting another, or gently redirect: "I want to make sure I help you with everything — let me finish answering your pricing question, then we'll get back to Bestie setup."

---

## 2. Context Tracking Across Turns

### 2.1 The Context Window Challenge

Local LLMs like Qwen 2.5 32B AWQ have a 32K token context window. Cloud models like Claude have larger windows but still have limits. The challenge: as conversations grow, you can't fit everything into the prompt.

**Context Budget Allocation (32K tokens):**
- System prompt + agent personality: ~2K tokens
- Current turn (user message + space for response): ~4K tokens
- Recent conversation history: ~12K tokens
- Relevant long-term memory: ~6K tokens
- Tool/function definitions: ~4K tokens
- Safety/guardrail instructions: ~2K tokens
- Buffer for edge cases: ~2K tokens

This means roughly 12K tokens (~15-20 turns) of raw conversation history can fit. Beyond that, you need compression strategies.

### 2.2 Sliding Window with Summarization

The most effective approach combines a sliding window of recent turns with compressed summaries of older turns:

```typescript
interface ConversationContext {
  // Full detail — last N turns
  recentHistory: Turn[];           // Last 8-12 turns, verbatim

  // Compressed — older turns
  summaries: TurnSummary[];        // Key points from older turns

  // Extracted entities and facts
  entityRegistry: EntityMap;       // All entities mentioned anywhere
  factRegistry: FactMap;           // Stated facts and preferences

  // Conversation metadata
  topicHistory: TopicTransition[]; // What topics were discussed when
  decisionLog: Decision[];         // Any decisions user made
}
```

**Summarization Strategy:**
When a turn slides out of the recent window, extract:
1. Any entities introduced (names, products, dates)
2. Any decisions or preferences stated
3. Any questions asked but not yet answered
4. Any promises the agent made
5. The topic and user's emotional tone

Discard: filler words, pleasantries, repeated information, thinking-out-loud that led nowhere.

### 2.3 Reference Resolution

This is where most conversational AI breaks down. Users use pronouns, ellipsis, and implicit references constantly.

**Types of References:**

1. **Pronominal**: "Can you change **it**?" — What is "it"?
2. **Demonstrative**: "I want **that** one." — Which one?
3. **Elliptical**: "And the price?" — The price of what?
4. **Zero anaphora**: "Looks good." — What looks good?
5. **Bridging**: "The car is great. The engine is powerful." — Which engine? The car's engine (bridging inference).

**Resolution Algorithm:**
```
1. Identify referential expression in user message
2. Collect candidate antecedents from:
   a. Entities in previous turn (highest priority)
   b. Entities in conversation focus stack
   c. Entities in recent history (decaying priority)
   d. Entities in user profile (lowest priority)
3. Apply constraints:
   a. Gender/number agreement (if applicable)
   b. Semantic compatibility (verb requires animate subject, etc.)
   c. Recency bias (more recent = more likely)
   d. Topical relevance (entity in current topic > entity in old topic)
4. If exactly one candidate survives → resolve
5. If multiple candidates → use scoring heuristic or ask for clarification
6. If zero candidates → check if it's a new entity introduction
```

**Practical Example in Stone AI:**

User (Turn 1): "Tell me about the Code Agent."
Agent: "The Code Agent specializes in writing and reviewing code..."

User (Turn 2): "Can it also do Python?"
Reference: "it" → Code Agent (resolved via recency + semantic fit)
Agent: "Yes, the Code Agent handles Python, JavaScript, TypeScript..."

User (Turn 3): "What about Rush?"
Reference: Elliptical — "What about Rush" implicitly means "Tell me about Rush" (pattern matching to Turn 1)
Agent: "Rush is the Network Penetration Royal Guard..."

User (Turn 4): "Can he work with it?"
References: "he" → Rush (most recent animate entity), "it" → ambiguous (Code Agent? Python?)
Best action: Clarify — "Do you mean can Rush work with the Code Agent, or with Python specifically?"

### 2.4 Topic Threading

Conversations rarely stay on one topic. Users interleave topics, return to abandoned topics, and blend topics together.

**Topic Model:**
```typescript
interface Topic {
  id: string;
  name: string;
  keywords: string[];
  firstMentionTurn: number;
  lastMentionTurn: number;
  status: 'active' | 'suspended' | 'closed';
  relatedEntities: string[];
  subtopics: Topic[];
}

class TopicTracker {
  private topics: Map<string, Topic> = new Map();
  private activeStack: string[] = [];  // Stack of active topic IDs

  detectTopicShift(message: string, currentTopicId: string): TopicShiftResult {
    const messageKeywords = extractKeywords(message);
    const currentTopic = this.topics.get(currentTopicId);

    // Calculate overlap with current topic
    const currentOverlap = jaccardSimilarity(
      messageKeywords,
      currentTopic?.keywords || []
    );

    // Check for return to a suspended topic
    for (const [id, topic] of this.topics) {
      if (topic.status === 'suspended') {
        const overlap = jaccardSimilarity(messageKeywords, topic.keywords);
        if (overlap > 0.4) {
          return { type: 'RETURN', topicId: id, confidence: overlap };
        }
      }
    }

    // Low overlap with current topic = potential new topic
    if (currentOverlap < 0.2) {
      return { type: 'NEW', suggestedName: inferTopicName(messageKeywords), confidence: 1 - currentOverlap };
    }

    // Moderate overlap = subtopic or drift
    if (currentOverlap < 0.5) {
      return { type: 'DRIFT', direction: messageKeywords, confidence: 0.5 };
    }

    return { type: 'CONTINUE', confidence: currentOverlap };
  }
}
```

---

## 3. Memory Within Conversation

### 3.1 Working Memory Model

Think of conversation memory like human working memory — limited capacity, requires active maintenance, and decays without reinforcement.

**Three-Tier In-Conversation Memory:**

| Tier | Capacity | Duration | Content |
|------|----------|----------|---------|
| Immediate | Last 2-3 turns | Current exchange | Exact words, tone, specific details |
| Short-term | Last 8-12 turns | Current session segment | Key facts, entities, decisions |
| Session | Entire conversation | Full session | Topics covered, summarized exchanges, all decisions |

### 3.2 Entity Registry

Every entity mentioned in conversation gets tracked:

```typescript
interface Entity {
  id: string;
  type: 'person' | 'agent' | 'feature' | 'product' | 'concept' | 'date' | 'number' | 'other';
  canonicalName: string;
  aliases: string[];              // Other names used for this entity
  firstMention: number;           // Turn number
  lastMention: number;
  attributes: Map<string, any>;   // Known attributes
  salience: number;               // How important in current conversation (0-1)
  inFocus: boolean;               // Currently being discussed
}
```

**Salience Decay:**
Entity salience decays over turns:
```
salience(t) = salience(t-1) * 0.85  // 15% decay per turn
```
Each mention resets salience to 1.0. This natural decay means recent entities are always favored for reference resolution.

### 3.3 Decision and Commitment Tracking

When users make decisions or agents make commitments, these must be tracked explicitly:

```typescript
interface Decision {
  turn: number;
  type: 'user_choice' | 'agent_promise' | 'mutual_agreement';
  content: string;
  status: 'active' | 'superseded' | 'fulfilled';
  supersededBy?: string;  // If user changed their mind
}
```

Examples:
- User: "Let's go with the SMART plan." → Decision: user_choice, "Selected SMART pricing plan"
- Agent: "I'll set up your Bestie with a casual tone." → Decision: agent_promise, "Configure Bestie casual tone"
- User: "Actually, make it formal." → Previous decision superseded, new decision: "Configure Bestie formal tone"

Tracking these prevents the agent from contradicting itself or ignoring the user's latest preference.

---

## 4. Turn Management Patterns

### 4.1 Turn-Taking Protocol

In text-based conversation, turn-taking is simpler than in speech, but there are still patterns to manage:

**Agent Turn Strategies:**
1. **Yield**: End with a question or open prompt. User's turn next.
2. **Hold**: Indicate more is coming. "Let me also check..." — agent keeps the floor.
3. **Offer**: Present information and optionally invite response. "Here's what I found. Want me to go deeper?"
4. **Transfer**: Hand the turn to another agent. "Let me connect you with the Code Agent for this."

**Anti-Patterns:**
- **Turn hogging**: Agent sends multiple long messages without giving user a chance to respond.
- **Premature yield**: Agent asks a question when it has enough information to proceed.
- **Dead air**: Agent processes for too long without a progress indicator.

### 4.2 Handling Concurrent Information Needs

Sometimes the agent needs multiple pieces of information from the user. Two strategies:

**Sequential Slot Filling:**
```
Agent: "What's your preferred language?"
User: "Python"
Agent: "And what framework?"
User: "FastAPI"
Agent: "Last question — what database?"
User: "PostgreSQL"
```
Pro: Clear, simple. Con: Tedious for users.

**Batch Slot Filling:**
```
Agent: "I need a few details to set this up: preferred language, framework, and database. You can answer all at once or one at a time."
User: "Python, FastAPI, and Postgres"
```
Pro: Efficient for experienced users. Con: Can overwhelm new users.

**Adaptive Strategy**: Start with batch for users who seem experienced (long, detailed messages, technical vocabulary). Fall back to sequential if the batch response is incomplete or confused.

### 4.3 Long-Running Operations

Some agent tasks take time (code generation, data analysis, complex searches). Managing turns during these:

```typescript
interface LongRunningTurn {
  // Acknowledge immediately
  acknowledgment: string;      // "Working on that now..."

  // Progress updates (if operation > 5 seconds)
  progressUpdates: {
    intervalMs: number;        // How often to update
    format: 'percentage' | 'stage' | 'dots';
  };

  // Partial results (if possible)
  streamPartials: boolean;     // Stream results as they come

  // Completion
  completionMessage: string;   // Final result delivery

  // Timeout handling
  timeoutMs: number;           // Max time before giving up
  timeoutMessage: string;      // "This is taking longer than expected..."
}
```

---

## 5. Conversation Flow Patterns

### 5.1 The Question-Answer-Followup (QAF) Pattern

The most common conversational pattern:

```
User:  Question about X
Agent: Answer about X + optional follow-up offer
User:  Follow-up question about X (deeper or tangential)
Agent: Deeper answer + check if satisfied
User:  Acknowledgment or new question
```

**Key Implementation Detail**: The agent should anticipate the most likely follow-up and preemptively include relevant information. If a user asks "What does the Code Agent do?", the agent should mention its capabilities AND common next questions ("It can also review existing code, debug issues, and explain algorithms").

### 5.2 The Progressive Disclosure Pattern

Don't dump everything at once. Layer information:

```
Layer 1 (Always): One-sentence summary
Layer 2 (On request): Key details and examples
Layer 3 (On request): Deep technical explanation
Layer 4 (On request): Edge cases and advanced usage
```

**Implementation:**
```typescript
function generateResponse(query: string, depth: number = 1): string {
  const layers = buildResponseLayers(query);

  let response = layers[0];  // Always include summary

  for (let i = 1; i < Math.min(depth, layers.length); i++) {
    response += '\n\n' + layers[i];
  }

  if (depth < layers.length) {
    response += '\n\nWould you like more detail on any of this?';
  }

  return response;
}
```

### 5.3 The Guided Navigation Pattern

When users don't know what they want, guide them:

```
Agent: "I can help you with several things:
        1. Setting up agents
        2. Customizing your Bestie
        3. Managing your subscription
        4. Forum and community features
        What interests you?"
User:  "Agents"
Agent: "Great! With agents, I can:
        - Explain what each agent does
        - Help you use a specific agent
        - Recommend agents for your use case
        What would you like?"
```

This narrows down intent through structured conversation rather than requiring the user to formulate a precise query upfront.

### 5.4 The Repair and Recovery Pattern

When the agent detects a misunderstanding:

```
Detection Signals:
- User says "no", "that's not what I meant", "wrong"
- User repeats their original question
- User's message contradicts the agent's assumption
- Sentiment drops (frustration indicators)

Recovery Steps:
1. Acknowledge the error: "I misunderstood. Let me try again."
2. State what you thought they meant: "I thought you were asking about X."
3. Ask for clarification: "Could you tell me more about what you need?"
4. Never blame the user: NOT "You weren't clear." YES "Let me make sure I understand."
```

---

## 6. Conversation Boundaries and Guardrails

### 6.1 Maximum Turn Limits

Conversations that go on too long without resolution indicate a problem:

```typescript
const TURN_LIMITS = {
  simpleQuery: 6,        // Should resolve in ~3 turns
  complexTask: 20,       // Multi-step tasks
  onboarding: 15,        // First-time setup
  troubleshooting: 25,   // Debugging can take longer
  openEnded: 50,         // Creative/exploratory chats
};
```

At 80% of the limit, the agent should summarize progress and ask if the user wants to continue or try a different approach. At the limit, offer to escalate or save the conversation state for later.

### 6.2 Off-Topic Detection

Agents have defined specialties. When a conversation drifts outside an agent's domain:

```typescript
function isOnTopic(message: string, agent: AgentConfig): TopicCheck {
  const domainKeywords = agent.domainKeywords;
  const messageEmbedding = embed(message);
  const domainEmbedding = agent.domainEmbedding;

  const similarity = cosineSimilarity(messageEmbedding, domainEmbedding);

  if (similarity > 0.7) return { onTopic: true };
  if (similarity > 0.4) return { onTopic: true, drifting: true };
  if (similarity > 0.2) return { onTopic: false, relatedAgent: findBetterAgent(message) };
  return { onTopic: false, needsHandoff: true };
}
```

### 6.3 Conversation Reset

Sometimes the best move is a clean start:

**When to offer reset:**
- User is visibly frustrated after multiple repair attempts
- The conversation state is deeply confused
- User explicitly asks to "start over"

**Reset Procedure:**
1. Save conversation history (never delete — useful for analytics)
2. Clear working state (slots, entities, topic stack)
3. Keep user preferences and profile information
4. Acknowledge the reset: "Let's start fresh. What can I help you with?"

---

## 7. Stone AI Multi-Turn Implementation

### 7.1 Database Schema for Conversation State

```sql
-- Conversation sessions
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  agent_id TEXT NOT NULL,
  state JSONB NOT NULL DEFAULT '{}',
  turn_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'
);

-- Individual messages
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  turn_number INTEGER NOT NULL,
  tokens_used INTEGER,
  entities_extracted JSONB DEFAULT '[]',
  topic_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extracted entities for fast lookup
CREATE TABLE conversation_entities (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  entity_type TEXT NOT NULL,
  canonical_name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  first_mention_turn INTEGER NOT NULL,
  last_mention_turn INTEGER NOT NULL,
  salience FLOAT DEFAULT 1.0,
  attributes JSONB DEFAULT '{}'
);

-- Conversation summaries for compression
CREATE TABLE conversation_summaries (
  id UUID PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  turn_range_start INTEGER NOT NULL,
  turn_range_end INTEGER NOT NULL,
  summary TEXT NOT NULL,
  key_entities TEXT[] DEFAULT '{}',
  key_decisions JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.2 Context Assembly Pipeline

When a new user message arrives:

```typescript
async function assembleContext(conversationId: string, newMessage: string): Promise<PromptContext> {
  // 1. Load conversation state
  const conversation = await db.conversations.findUnique({ where: { id: conversationId } });

  // 2. Load recent messages (last 12 turns = 24 messages)
  const recentMessages = await db.messages.findMany({
    where: { conversationId },
    orderBy: { turnNumber: 'desc' },
    take: 24,
  });

  // 3. Load summaries of older turns
  const oldestRecentTurn = recentMessages[recentMessages.length - 1]?.turnNumber || 0;
  const summaries = await db.conversationSummaries.findMany({
    where: {
      conversationId,
      turnRangeEnd: { lt: oldestRecentTurn },
    },
    orderBy: { turnRangeStart: 'asc' },
  });

  // 4. Load active entities
  const entities = await db.conversationEntities.findMany({
    where: { conversationId, salience: { gt: 0.1 } },
    orderBy: { salience: 'desc' },
  });

  // 5. Assemble the context
  return {
    systemPrompt: buildSystemPrompt(conversation.agentId),
    conversationSummary: summaries.map(s => s.summary).join('\n'),
    recentHistory: recentMessages.reverse().map(formatMessage),
    activeEntities: entities.map(formatEntity),
    currentMessage: newMessage,
    conversationState: conversation.state,
  };
}
```

### 7.3 Post-Turn Processing

After the agent generates a response:

```typescript
async function postTurnProcessing(
  conversationId: string,
  userMessage: string,
  agentResponse: string,
  turnNumber: number
): Promise<void> {
  // 1. Extract entities from both messages
  const userEntities = extractEntities(userMessage);
  const agentEntities = extractEntities(agentResponse);

  // 2. Update entity registry
  await updateEntityRegistry(conversationId, [...userEntities, ...agentEntities], turnNumber);

  // 3. Detect topic shifts
  const topicShift = await detectTopicShift(conversationId, userMessage);
  if (topicShift.type !== 'CONTINUE') {
    await handleTopicShift(conversationId, topicShift);
  }

  // 4. Decay salience on all entities not mentioned this turn
  await decayEntitySalience(conversationId, turnNumber);

  // 5. Check if summarization needed (every 10 turns)
  if (turnNumber % 10 === 0) {
    await summarizeOldTurns(conversationId, turnNumber - 20, turnNumber - 10);
  }

  // 6. Update conversation state
  await updateConversationState(conversationId, {
    turnCount: turnNumber,
    lastActivityAt: new Date(),
  });

  // 7. Track decisions
  const decisions = extractDecisions(userMessage, agentResponse);
  if (decisions.length > 0) {
    await recordDecisions(conversationId, decisions, turnNumber);
  }
}
```

---

## 8. Advanced Patterns

### 8.1 Conversation Branching

Sometimes users want to explore "what if" scenarios without committing:

```typescript
interface ConversationBranch {
  branchId: string;
  parentBranchId: string | null;
  branchPoint: number;        // Turn number where branch started
  description: string;        // "What if I chose SMART plan instead"
  state: ConversationState;   // Independent state for this branch
}
```

This is particularly useful for agents helping with decisions — the user can explore multiple options without losing context.

### 8.2 Multi-Party Conversations

Stone AI scenarios where multiple agents participate in one conversation:

1. User asks a question that spans multiple domains
2. Primary agent handles the conversation
3. Primary agent calls specialist agents behind the scenes
4. Results are synthesized and presented as a unified response

The user sees one conversation; the system manages multiple agent interactions.

### 8.3 Conversation Resumption

When a user returns to a previous conversation:

```typescript
async function resumeConversation(conversationId: string): Promise<ResumptionContext> {
  const conversation = await loadConversation(conversationId);
  const lastActivity = conversation.lastActivityAt;
  const timeSince = Date.now() - lastActivity.getTime();

  // Less than 5 minutes — seamless continuation
  if (timeSince < 5 * 60 * 1000) {
    return { type: 'seamless', greeting: null };
  }

  // Less than 1 hour — brief recap
  if (timeSince < 60 * 60 * 1000) {
    return {
      type: 'brief_recap',
      greeting: `Welcome back! We were discussing ${conversation.currentTopic}.`,
    };
  }

  // Less than 24 hours — fuller recap
  if (timeSince < 24 * 60 * 60 * 1000) {
    return {
      type: 'full_recap',
      greeting: `Hi again! Earlier today we talked about ${summarizeTopics(conversation)}. Would you like to continue where we left off, or start something new?`,
    };
  }

  // More than 24 hours — reintroduction
  return {
    type: 'reintroduction',
    greeting: `Welcome back! It's been a while. Last time, we covered: ${summarizeKeyPoints(conversation)}. Want to pick up from there?`,
  };
}
```

### 8.4 Conversation Forking for A/B Testing

For optimizing conversation flows, Stone AI can fork conversations:

```typescript
interface ABTest {
  testId: string;
  variants: {
    control: ConversationFlowConfig;
    treatment: ConversationFlowConfig;
  };
  metrics: string[];  // What to measure
  assignment: (userId: string) => 'control' | 'treatment';
}
```

This allows testing different conversation strategies (e.g., batch vs. sequential slot filling) and measuring which performs better.

---

## 9. Common Pitfalls

### 9.1 Context Pollution
**Problem**: Including irrelevant old context that confuses the LLM.
**Solution**: Aggressive summarization and entity salience decay. Only include context that's relevant to the current topic.

### 9.2 Lost References
**Problem**: User says "the thing we discussed earlier" and agent can't find it.
**Solution**: Maintain comprehensive entity registry with aliases. Never fully delete entities — just reduce salience.

### 9.3 State Corruption
**Problem**: Conversation state becomes inconsistent (e.g., slot marked as filled but the entity was deleted).
**Solution**: State validation on every turn. If corruption detected, log it, repair what's possible, and smoothly continue.

### 9.4 Infinite Clarification Loops
**Problem**: Agent keeps asking for clarification and user keeps giving ambiguous answers.
**Solution**: After 2 clarification attempts, make a best guess and confirm: "I think you mean X. Is that right?" If wrong, offer specific options rather than open-ended questions.

### 9.5 Over-Remembering
**Problem**: Agent references something the user said 30 turns ago that's no longer relevant, making the user uncomfortable.
**Solution**: Salience decay. Don't reference old information unless the user brings it up again or it's directly relevant.

---

## 10. Testing Multi-Turn Conversations

### 10.1 Conversation Scenario Tests

Define test scenarios as multi-turn scripts:

```typescript
const testScenario: ConversationTest = {
  name: "Topic switch and return",
  turns: [
    { user: "Tell me about the Code Agent", expectContains: ["code", "programming"] },
    { user: "How much does SMART plan cost?", expectContains: ["$99.99", "SMART"] },
    { user: "Going back to the Code Agent, can it do Python?", expectContains: ["Python", "Code Agent"] },
  ],
  assertions: [
    { type: "topic_tracked", topics: ["Code Agent", "Pricing", "Code Agent"] },
    { type: "entity_maintained", entity: "Code Agent", throughTurn: 3 },
  ],
};
```

### 10.2 Stress Testing

- **Long conversations**: 50+ turns to test memory management
- **Rapid topic switching**: Change topic every turn
- **Ambiguity flood**: Every message uses pronouns with multiple antecedents
- **Contradiction injection**: User contradicts their earlier statements

### 10.3 Metrics to Track

- **Reference resolution accuracy**: How often does the agent correctly resolve pronouns?
- **Topic continuity**: Does the agent maintain topic awareness across turns?
- **Context utilization**: Does the agent use relevant context from earlier turns?
- **State consistency**: Does the conversation state remain valid throughout?

---

## Key Takeaways

1. Every conversation is a state machine — model it explicitly.
2. Context windows are finite — use tiered memory with summarization.
3. Reference resolution is the hardest problem — track entities religiously.
4. Topic threading requires active tracking — topics don't manage themselves.
5. Turn management is an art — know when to yield, hold, or offer.
6. Always have a recovery path — conversations will go wrong.
7. Test with multi-turn scenarios, not single-turn queries.
8. Persist everything in the database — server restarts shouldn't kill conversations.

---

*Seed: multi-turn-conversation-management | Domain: Agent Conversation & UX | Stone AI Palace Knowledge*
