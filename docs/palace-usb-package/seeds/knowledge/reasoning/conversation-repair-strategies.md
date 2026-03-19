# Conversation Repair Strategies

## Seed Classification
- **Domain**: Agent Conversation & UX
- **Complexity**: Advanced
- **Applicability**: All 44 Stone AI agents, any conversational AI system
- **Prerequisites**: Multi-turn conversation management, intent classification, emotional intelligence

## Why This Matters

Conversations go wrong. It's not a question of if — it's how often and how well you recover. Studies show that users who experience a well-handled conversation failure have HIGHER satisfaction than users who had a flawless but boring interaction. The recovery is the opportunity.

Stone AI's 40 agents will inevitably misunderstand users, give wrong answers, lose context, or hit dead ends. This seed teaches how to detect these failures and recover gracefully.

---

## 1. Taxonomy of Conversation Failures

### 1.1 Failure Types

```typescript
enum ConversationFailureType {
  // Agent misunderstood the user
  MISUNDERSTANDING = 'misunderstanding',

  // Agent gave incorrect information
  FACTUAL_ERROR = 'factual_error',

  // Agent can't fulfill the request
  CAPABILITY_LIMIT = 'capability_limit',

  // Conversation went off-topic
  TOPIC_DRIFT = 'topic_drift',

  // Agent is stuck in a loop
  REPETITION_LOOP = 'repetition_loop',

  // User and agent talking past each other
  CROSS_TALK = 'cross_talk',

  // User is confused by agent's response
  CLARITY_FAILURE = 'clarity_failure',

  // System error interrupted conversation
  SYSTEM_ERROR = 'system_error',

  // Agent didn't answer the question
  NON_ANSWER = 'non_answer',

  // Agent's tone was inappropriate
  TONE_MISMATCH = 'tone_mismatch',
}
```

### 1.2 Failure Severity Levels

```typescript
enum FailureSeverity {
  // Minor: User notices but conversation continues
  MINOR = 'minor',       // e.g., slight topic drift, minor tone issue

  // Moderate: Conversation is disrupted but recoverable
  MODERATE = 'moderate',  // e.g., misunderstanding, wrong answer

  // Severe: Conversation is fundamentally broken
  SEVERE = 'severe',      // e.g., loop, total inability to help

  // Critical: User trust is damaged
  CRITICAL = 'critical',  // e.g., wrong billing info, PII leak
}
```

### 1.3 Failure Detection Signals

```typescript
interface FailureSignal {
  signal: string;
  weight: number;        // How strong an indicator this is (0-1)
  failureTypes: ConversationFailureType[];
}

const FAILURE_SIGNALS: FailureSignal[] = [
  // Explicit user corrections
  { signal: 'user_says_no_wrong', weight: 0.95, failureTypes: ['misunderstanding', 'factual_error'] },
  { signal: 'user_repeats_question', weight: 0.85, failureTypes: ['non_answer', 'misunderstanding'] },
  { signal: 'user_says_not_what_i_meant', weight: 0.90, failureTypes: ['misunderstanding'] },

  // Frustration indicators
  { signal: 'user_uses_caps', weight: 0.60, failureTypes: ['cross_talk', 'clarity_failure'] },
  { signal: 'user_uses_punctuation_emphasis', weight: 0.50, failureTypes: ['cross_talk'] },
  { signal: 'user_message_gets_shorter', weight: 0.40, failureTypes: ['clarity_failure', 'tone_mismatch'] },
  { signal: 'user_sentiment_drops', weight: 0.70, failureTypes: ['misunderstanding', 'non_answer'] },

  // Pattern indicators
  { signal: 'same_question_third_time', weight: 0.95, failureTypes: ['non_answer', 'repetition_loop'] },
  { signal: 'agent_response_similar_to_previous', weight: 0.80, failureTypes: ['repetition_loop'] },
  { signal: 'conversation_length_exceeds_expected', weight: 0.50, failureTypes: ['capability_limit'] },

  // Structural indicators
  { signal: 'user_asks_for_human', weight: 1.0, failureTypes: ['capability_limit', 'critical'] },
  { signal: 'user_threatens_to_leave', weight: 0.90, failureTypes: ['critical'] },
  { signal: 'user_questions_agent_competence', weight: 0.85, failureTypes: ['capability_limit', 'non_answer'] },
];
```

---

## 2. Detection Systems

### 2.1 Real-Time Failure Detection

Run after every agent response:

```typescript
async function detectConversationFailure(
  conversation: Conversation,
  latestUserMessage: string,
  latestAgentResponse: string
): Promise<FailureDetection | null> {
  const signals: DetectedSignal[] = [];

  // 1. Check for explicit correction words
  const correctionPatterns = [
    /\b(no|nope|wrong|incorrect|that'?s not)\b/i,
    /\bnot what (i|I) (meant|asked|said|want)/i,
    /\byou (misunderstood|didn'?t understand|got it wrong)/i,
    /\bi (said|asked|meant|want)/i,  // User restating = correction
  ];

  for (const pattern of correctionPatterns) {
    if (pattern.test(latestUserMessage)) {
      signals.push({ type: 'explicit_correction', weight: 0.9 });
    }
  }

  // 2. Check for question repetition
  const previousUserMessages = conversation.messages
    .filter(m => m.role === 'user')
    .slice(-5)
    .map(m => m.content);

  const similarity = computeMaxSimilarity(latestUserMessage, previousUserMessages);
  if (similarity > 0.7) {
    signals.push({ type: 'repeated_question', weight: similarity });
  }

  // 3. Check sentiment trend
  const sentimentHistory = await getSentimentHistory(conversation.id);
  if (sentimentHistory.length >= 3) {
    const trend = calculateTrend(sentimentHistory.slice(-3));
    if (trend < -0.3) {
      signals.push({ type: 'sentiment_declining', weight: Math.abs(trend) });
    }
  }

  // 4. Check for agent repetition
  const previousAgentMessages = conversation.messages
    .filter(m => m.role === 'assistant')
    .slice(-3)
    .map(m => m.content);

  const agentRepetition = computeMaxSimilarity(latestAgentResponse, previousAgentMessages);
  if (agentRepetition > 0.6) {
    signals.push({ type: 'agent_repeating', weight: agentRepetition });
  }

  // 5. Check for escalation language
  const escalationPatterns = [
    /\b(talk to|speak to|connect me|transfer|human|person|manager|supervisor)\b/i,
    /\b(useless|hopeless|terrible|worst|awful)\b/i,
    /\b(cancel|leave|quit|done with|fed up)\b/i,
  ];

  for (const pattern of escalationPatterns) {
    if (pattern.test(latestUserMessage)) {
      signals.push({ type: 'escalation_language', weight: 0.85 });
    }
  }

  // Calculate overall failure probability
  if (signals.length === 0) return null;

  const failureProbability = signals.reduce((sum, s) => sum + s.weight, 0) / signals.length;

  if (failureProbability > 0.5) {
    return {
      detected: true,
      probability: failureProbability,
      signals,
      suggestedRepairStrategy: selectRepairStrategy(signals),
    };
  }

  return null;
}
```

### 2.2 Proactive Failure Detection

Don't wait for the user to complain — detect problems before they manifest:

```typescript
async function proactiveFailureCheck(
  agentResponse: string,
  query: string,
  context: ConversationContext
): Promise<ProactiveCheck[]> {
  const checks: ProactiveCheck[] = [];

  // Check: Does the response actually answer the question?
  const relevanceScore = await checkRelevance(query, agentResponse);
  if (relevanceScore < 0.6) {
    checks.push({
      issue: 'response_may_not_answer_question',
      confidence: 1 - relevanceScore,
      suggestion: 'Add a direct answer before the explanation',
    });
  }

  // Check: Is the response too similar to the previous one?
  const previousResponse = context.lastAgentMessage;
  if (previousResponse) {
    const similarity = computeSimilarity(agentResponse, previousResponse);
    if (similarity > 0.7) {
      checks.push({
        issue: 'response_too_similar_to_previous',
        confidence: similarity,
        suggestion: 'Try a different approach or ask what specifically was unclear',
      });
    }
  }

  // Check: Does the response contain uncertain language without hedging?
  const uncertainClaims = findUnverifiedClaims(agentResponse);
  if (uncertainClaims.length > 0) {
    checks.push({
      issue: 'unhedged_uncertain_claims',
      confidence: 0.7,
      suggestion: 'Add confidence markers to uncertain statements',
    });
  }

  return checks;
}
```

---

## 3. Repair Strategies

### 3.1 The REPAIR Framework

**R**ecognize — Detect that something went wrong
**E**mpathize — Acknowledge the user's frustration
**P**arse — Understand what specifically went wrong
**A**lternate — Try a different approach
**I**ntegrate — Incorporate the correction into understanding
**R**esolve — Deliver the correct response

### 3.2 Misunderstanding Repair

**When the agent interpreted the question wrong:**

```typescript
function repairMisunderstanding(
  originalQuery: string,
  agentMisinterpretation: string,
  userCorrection: string
): RepairResponse {
  return {
    acknowledgment: "I misunderstood your question.",
    clarification: `I thought you were asking about ${agentMisinterpretation}, but you're actually asking about ${extractCorrectedIntent(userCorrection)}.`,
    newAttempt: generateNewResponse(originalQuery, userCorrection),
    check: "Is that more what you were looking for?",
  };
}
```

**Example Dialog:**
```
User: "How do I get more agents?"
Agent: "To create custom agents, you can use our Agent Builder in the dashboard..."
User: "No, I mean I want access to more of the existing agents."
Agent: "Got it — you're looking to unlock more agents, not create new ones.
        To access more agents, you can upgrade your plan:
        - STARTER ($19.99): 16 agents
        - PLUS ($49.99): 30 agents
        - SMART ($99.99): 39 agents
        - PRO ($200): 38 agents
        Which tier were you considering?"
```

### 3.3 Factual Error Repair

**When the agent gave wrong information:**

```typescript
function repairFactualError(
  incorrectClaim: string,
  correction: string,
  source: string
): RepairResponse {
  return {
    acknowledgment: "You're right — I gave you incorrect information.",
    correction: `The correct information is: ${correction}`,
    source: source ? `(According to ${source})` : '',
    impact: assessImpact(incorrectClaim),
    // If the error could have caused user to take wrong action:
    undoAdvice: mayNeedUndo(incorrectClaim) ? `If you already ${impliedAction(incorrectClaim)}, here's how to undo that...` : null,
  };
}
```

**Critical Rule**: Never argue with the user about facts you're not 100% certain about. If the user says you're wrong and you're not sure, say: "Let me verify that. You may be right."

### 3.4 Dead End Repair

**When the agent can't help with the request:**

```typescript
function repairDeadEnd(
  request: string,
  reason: 'capability_limit' | 'knowledge_gap' | 'policy_restriction'
): RepairResponse {
  const strategies = {
    capability_limit: {
      message: "I can't do that directly, but here's what I CAN do:",
      alternatives: generateAlternatives(request),
      handoff: findCapableAgent(request),
    },
    knowledge_gap: {
      message: "I don't have enough information to answer that confidently.",
      alternatives: [
        "I can share what I do know and you can verify the gaps.",
        "I can connect you with someone who specializes in this.",
      ],
      handoff: findKnowledgeableAgent(request),
    },
    policy_restriction: {
      message: "I'm not able to help with that due to our policies.",
      alternatives: [
        "Here's what I can help with instead.",
        "I can explain our policy if that would be useful.",
      ],
      handoff: null,  // Don't hand off policy-restricted requests
    },
  };

  return strategies[reason];
}
```

### 3.5 Repetition Loop Repair

**When the conversation is going in circles:**

```typescript
function repairRepetitionLoop(conversation: Conversation): RepairResponse {
  // Detect the loop pattern
  const recentExchanges = conversation.messages.slice(-6);
  const loopPattern = detectLoopPattern(recentExchanges);

  if (loopPattern.type === 'user_repeats_agent_doesnt_adapt') {
    return {
      acknowledgment: "I realize I keep giving you the same type of answer and it's not helping.",
      breakout: "Let me try a completely different approach.",
      newApproach: generateAlternativeApproach(conversation),
      escalation: "Or if you'd prefer, I can connect you with a different agent who might have a fresh perspective.",
    };
  }

  if (loopPattern.type === 'clarification_loop') {
    return {
      acknowledgment: "We seem to be going back and forth. Let me make my best guess and you can correct me.",
      bestGuess: generateBestGuessResponse(conversation),
      check: "Is this close to what you need? If not, could you give me a specific example of what you're looking for?",
    };
  }

  if (loopPattern.type === 'mutual_misunderstanding') {
    return {
      acknowledgment: "I think we might be talking about different things.",
      reset: "Can we start over? In one sentence, what are you trying to accomplish?",
    };
  }
}
```

### 3.6 Tone Mismatch Repair

**When the agent's tone is wrong for the situation:**

```typescript
function repairToneMismatch(
  currentTone: ToneProfile,
  detectedUserState: UserEmotionalState
): ToneAdjustment {
  // User is upset, agent was too cheerful
  if (detectedUserState.frustration > 0.7 && currentTone.energy > 3) {
    return {
      newTone: { ...currentTone, energy: 1, warmth: 5, humor: 0 },
      transitionPhrase: "I can see this has been frustrating.",
    };
  }

  // User is casual, agent was too formal
  if (detectedUserState.casualLanguage > 0.8 && currentTone.formality > 4) {
    return {
      newTone: { ...currentTone, formality: 2, warmth: 4 },
      transitionPhrase: null,  // Just shift naturally, don't announce it
    };
  }

  // User is in a hurry, agent was too verbose
  if (detectedUserState.urgency > 0.7 && currentTone.energy < 3) {
    return {
      newTone: { ...currentTone, energy: 4, formality: 2 },
      transitionPhrase: "Let me get straight to the point.",
    };
  }
}
```

---

## 4. Clarification Requests

### 4.1 When to Clarify vs. When to Guess

```typescript
function shouldClarify(
  ambiguity: AmbiguityLevel,
  stakes: StakesLevel,
  conversationTurn: number
): 'clarify' | 'guess_and_confirm' | 'just_guess' {
  // High stakes (billing, deletion, security) → always clarify
  if (stakes === 'high') return 'clarify';

  // Low ambiguity → just guess
  if (ambiguity === 'low') return 'just_guess';

  // Early in conversation → clarify (building rapport)
  if (conversationTurn <= 2) return 'clarify';

  // Late in conversation after multiple clarifications → guess and confirm
  if (conversationTurn > 5) return 'guess_and_confirm';

  // Medium ambiguity, medium stakes → guess and confirm
  return 'guess_and_confirm';
}
```

### 4.2 Effective Clarification Questions

**Bad clarification**: "Could you be more specific?" (too vague)
**Bad clarification**: "What exactly do you mean by 'help with agents'?" (too broad)

**Good clarification**: "Are you looking to use an existing agent, or learn about what agents are available?" (two clear options)
**Good clarification**: "Just to make sure I help you with the right thing — is this about your billing, or about using the SMART plan's features?" (targeted options)

**Framework:**
```typescript
function generateClarificationQuestion(
  ambiguousMessage: string,
  candidates: IntentCandidate[]
): string {
  const topTwo = candidates.slice(0, 2);

  // Binary choice is ideal
  if (topTwo.length === 2) {
    return `Are you asking about ${topTwo[0].userFriendlyName}, or ${topTwo[1].userFriendlyName}?`;
  }

  // If we can't narrow to binary, offer options
  const options = candidates.slice(0, 3).map(c => c.userFriendlyName);
  return `I want to make sure I help you with the right thing. Were you looking for:\n${options.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\nOr something else?`;
}
```

### 4.3 Clarification Limits

**Rule**: Maximum 2 clarification questions before the agent must attempt an answer.

After 2 clarifications:
```typescript
function handleClarificationExhaustion(conversation: Conversation): string {
  const bestGuess = computeBestGuessIntent(conversation);

  return `Based on our conversation, I think you're looking for ${bestGuess.description}. Let me help you with that — and just let me know if I'm off track.

${generateResponseForIntent(bestGuess)}`;
}
```

---

## 5. Graceful Topic Changes

### 5.1 User-Initiated Topic Changes

Users don't always announce topic changes:

```
User: "Tell me about the Code Agent"
Agent: [explains Code Agent]
User: "What's the weather like?" ← abrupt topic change
```

**Handling:**
```typescript
function handleTopicChange(
  previousTopic: string,
  newTopic: string,
  agent: Agent
): TopicChangeResponse {
  // Is the new topic within this agent's scope?
  if (!agent.canHandle(newTopic)) {
    return {
      type: 'handoff',
      response: `That's outside my area, but I can connect you with the right agent for that. Did you want to continue our conversation about ${previousTopic} as well?`,
    };
  }

  // Is the new topic completely unrelated?
  const relatedness = topicSimilarity(previousTopic, newTopic);
  if (relatedness < 0.2) {
    return {
      type: 'clean_break',
      response: null, // Just answer the new question directly
      suspendPreviousTopic: true,
    };
  }

  // Topics are somewhat related
  return {
    type: 'natural_transition',
    response: null, // Transition naturally
    maintainPreviousContext: true,
  };
}
```

### 5.2 Agent-Initiated Topic Changes

Sometimes the agent needs to redirect:

**When the current topic is unproductive:**
"I want to make sure we solve your main issue. Can we come back to what you originally asked about — getting your billing sorted out?"

**When the user is going down a rabbit hole:**
"That's an interesting area, but it might not help with what you're trying to accomplish right now. Let's focus on setting up your agent first, and then we can explore that."

**When the conversation needs resetting:**
"We've covered a lot of ground. Let me summarize where we are and figure out the best next step."

### 5.3 The Parking Lot

When a user raises a valid topic that's not the priority:

```typescript
interface ParkingLot {
  items: {
    topic: string;
    userMessage: string;
    turnNumber: number;
    priority: 'low' | 'medium' | 'high';
  }[];
}

function parkTopic(parkingLot: ParkingLot, topic: string, message: string, turn: number): string {
  parkingLot.items.push({ topic, userMessage: message, turnNumber: turn, priority: 'medium' });

  return `Good point about ${topic}. Let me note that — I'll come back to it after we finish with ${getCurrentTopic()}.`;
}

function checkParkingLot(parkingLot: ParkingLot, currentTopicResolved: boolean): string | null {
  if (!currentTopicResolved || parkingLot.items.length === 0) return null;

  const nextItem = parkingLot.items.shift();
  return `Earlier you mentioned ${nextItem.topic}. Would you like to talk about that now?`;
}
```

---

## 6. Dead-End Recovery

### 6.1 Types of Dead Ends

1. **Agent can't help**: Request is outside the agent's capabilities
2. **Insufficient information**: Agent needs data it can't access
3. **User's goal is impossible**: What the user wants can't be done
4. **System limitation**: Technical constraint prevents fulfillment

### 6.2 Recovery Strategies by Type

```typescript
const DEAD_END_RECOVERY: Record<string, RecoveryStrategy> = {
  agent_cant_help: {
    steps: [
      'acknowledge_limitation',
      'suggest_alternative_agent',
      'offer_partial_help',
    ],
    template: "I'm not the best agent for this, but {agentName} can help. Want me to transfer you? In the meantime, here's what I can tell you: {partialAnswer}",
  },

  insufficient_info: {
    steps: [
      'explain_what_is_needed',
      'ask_for_specific_data',
      'offer_to_work_with_partial_info',
    ],
    template: "To answer that, I'd need {specificInfo}. Could you provide that? If not, I can give you a general answer based on what I know.",
  },

  impossible_goal: {
    steps: [
      'acknowledge_the_goal',
      'explain_why_impossible',
      'suggest_alternatives',
    ],
    template: "I understand you want to {goal}. Unfortunately, that's not possible because {reason}. However, here are some alternatives:\n{alternatives}",
  },

  system_limitation: {
    steps: [
      'apologize_briefly',
      'explain_limitation',
      'provide_workaround',
      'set_expectation',
    ],
    template: "I'm running into a system limitation. {explanation}. Here's a workaround: {workaround}. {timeline_if_applicable}",
  },
};
```

### 6.3 The Escalation Ladder

When conversation repair fails:

```
Level 1: Same agent, different approach
  ↓ (failed)
Level 2: Same agent, explicit strategy change ("Let me try this differently")
  ↓ (failed)
Level 3: Hand off to specialized agent
  ↓ (failed)
Level 4: Hand off to support agent with full context
  ↓ (failed)
Level 5: Human support (if available) or asynchronous follow-up
```

```typescript
class EscalationManager {
  private attempts: Map<string, number> = new Map();

  shouldEscalate(conversationId: string, failureType: string): EscalationAction {
    const key = `${conversationId}:${failureType}`;
    const currentLevel = this.attempts.get(key) || 0;
    this.attempts.set(key, currentLevel + 1);

    const ESCALATION_LADDER = [
      { level: 1, action: 'retry_different_approach', description: 'Same agent tries again differently' },
      { level: 2, action: 'explicit_strategy_change', description: 'Agent announces strategy change' },
      { level: 3, action: 'handoff_specialist', description: 'Transfer to domain specialist' },
      { level: 4, action: 'handoff_support', description: 'Transfer to support with full context' },
      { level: 5, action: 'human_escalation', description: 'Escalate to human support' },
    ];

    return ESCALATION_LADDER[Math.min(currentLevel, 4)];
  }
}
```

---

## 7. Context Preservation During Repair

### 7.1 What to Keep

When repairing a conversation, preserving context is critical. The user should never have to repeat information.

```typescript
interface RepairContext {
  // Always preserve
  userIdentity: UserProfile;           // Who they are
  originalRequest: string;             // What they originally asked
  statedPreferences: Preference[];     // What they said they want
  providedInformation: FilledSlot[];   // Info they already gave
  decisionsAlreadyMade: Decision[];    // Choices they made

  // Sometimes preserve
  conversationSummary: string;         // If relevant to the repair
  previousAgentContext: AgentState;     // If same agent continues

  // Never preserve
  incorrectAssumptions: string[];      // Wrong interpretations — discard
  staleContext: string[];              // Old context that led to failure
}
```

### 7.2 Context Handoff for Agent Switches

When repairing requires a different agent:

```typescript
async function prepareHandoffContext(
  conversation: Conversation,
  fromAgent: string,
  toAgent: string,
  reason: string
): Promise<HandoffPackage> {
  return {
    summary: `User originally asked: "${conversation.originalRequest}". ${fromAgent} was unable to help because: ${reason}.`,
    userPreferences: conversation.extractedPreferences,
    filledSlots: conversation.filledSlots,
    failedApproaches: conversation.failedApproaches.map(a => a.description),
    emotionalState: conversation.currentEmotionalState,
    urgency: conversation.urgencyLevel,
    doNotRepeat: conversation.failedApproaches.map(a => a.suggestion),
  };
}
```

The receiving agent MUST use this context and MUST NOT repeat approaches that already failed.

---

## 8. Repair Language Patterns

### 8.1 Acknowledgment Phrases (Graded by Severity)

```typescript
const ACKNOWLEDGMENT_PHRASES = {
  minor: [
    "Let me clarify that.",
    "Good catch.",
    "Let me correct myself.",
  ],
  moderate: [
    "I misunderstood your question. Let me try again.",
    "That wasn't the right answer. Here's the correct information.",
    "I got that wrong. Let me fix it.",
  ],
  severe: [
    "I've been approaching this the wrong way. Let me start fresh.",
    "I apologize — I've been giving you the wrong information. Here's what's actually correct.",
    "I'm clearly not understanding what you need. Can we reset?",
  ],
  critical: [
    "I gave you incorrect information that could have caused a problem. I'm correcting it now.",
    "I need to flag that my previous answer was wrong. The correct answer is:",
    "This is important — please disregard my earlier response about [X]. The actual answer is:",
  ],
};
```

### 8.2 Transition Phrases

```typescript
const TRANSITION_PHRASES = {
  // After correction, before new attempt
  retry: [
    "Let me try again with a different approach.",
    "Here's a better answer:",
    "Looking at this from a different angle:",
  ],

  // After clarification received
  post_clarification: [
    "Thanks for clarifying. So you're looking for:",
    "Got it. With that in mind:",
    "Now I understand. Here's what I can tell you:",
  ],

  // Transitioning to different topic
  topic_shift: [
    "Now, about your other question:",
    "Moving on to what you mentioned earlier:",
    "Let's tackle the next thing:",
  ],

  // After dead end, offering alternatives
  alternative: [
    "While I can't do exactly that, here's what I can offer:",
    "The closest thing to what you're asking is:",
    "Here are some options that might work:",
  ],
};
```

### 8.3 Phrases to NEVER Use

```typescript
const BANNED_REPAIR_PHRASES = [
  "I'm just an AI...",                    // Deflection, unhelpful
  "That's not my fault.",                 // Blame-shifting
  "You didn't explain clearly.",          // Blaming the user
  "As I already mentioned...",            // Condescending
  "I already told you that.",             // Hostile
  "That's not what you asked.",           // Argumentative
  "I can't help with that.",              // Dead end without alternatives
  "There's nothing I can do.",            // Gives up
  "Have you tried googling it?",          // Dismissive
  "I'm sorry you feel that way.",         // Non-apology
];
```

---

## 9. Automated Repair Pipelines

### 9.1 Pre-Send Repair Check

Before sending any response, check if it would trigger a repair need:

```typescript
async function preSendRepairCheck(
  proposedResponse: string,
  conversation: Conversation,
  query: string
): Promise<{ send: boolean; repaired?: string; reason?: string }> {
  // Check 1: Does it actually answer the question?
  const answersQuestion = await checkAnswersQuestion(proposedResponse, query);
  if (!answersQuestion) {
    const repairedResponse = await regenerateWithFocus(query, conversation);
    return { send: false, repaired: repairedResponse, reason: 'non_answer' };
  }

  // Check 2: Is it too similar to a previous response that the user rejected?
  const previousRejected = conversation.messages
    .filter(m => m.role === 'assistant' && m.wasRejected);
  for (const rejected of previousRejected) {
    if (computeSimilarity(proposedResponse, rejected.content) > 0.6) {
      const alternativeResponse = await regenerateWithConstraint(
        query, conversation, `Do NOT use an approach similar to: ${rejected.content}`
      );
      return { send: false, repaired: alternativeResponse, reason: 'similar_to_rejected' };
    }
  }

  // Check 3: Does it contradict something the agent said earlier?
  const contradiction = await findContradiction(proposedResponse, conversation.agentMessages);
  if (contradiction) {
    const resolved = await resolveContradiction(proposedResponse, contradiction);
    return { send: false, repaired: resolved, reason: 'self_contradiction' };
  }

  return { send: true };
}
```

### 9.2 Post-Failure Analysis

After a conversation that involved repair, analyze what went wrong:

```typescript
interface PostRepairAnalysis {
  conversationId: string;
  failureType: ConversationFailureType;
  failureTurn: number;
  detectionDelay: number;        // How many turns until detected
  repairStrategy: string;
  repairSuccessful: boolean;
  turnsToRecover: number;
  rootCause: string;
  preventionRecommendation: string;
}

async function analyzeRepair(conversation: Conversation): Promise<PostRepairAnalysis> {
  const failures = conversation.detectedFailures;

  for (const failure of failures) {
    return {
      conversationId: conversation.id,
      failureType: failure.type,
      failureTurn: failure.turnNumber,
      detectionDelay: failure.detectedAtTurn - failure.turnNumber,
      repairStrategy: failure.repairStrategyUsed,
      repairSuccessful: failure.wasResolved,
      turnsToRecover: failure.wasResolved
        ? failure.resolvedAtTurn - failure.detectedAtTurn
        : -1,
      rootCause: await analyzeRootCause(conversation, failure),
      preventionRecommendation: await generatePreventionAdvice(failure),
    };
  }
}
```

---

## 10. Repair Metrics and Monitoring

### 10.1 Key Metrics

```typescript
const REPAIR_METRICS = {
  // Failure rates
  failureRate: 'conversations_with_failures / total_conversations',
  failuresByType: 'count_by_failure_type',

  // Detection quality
  detectionLatency: 'turns_between_failure_and_detection',
  falsePositiveRate: 'false_detections / total_detections',
  missedFailureRate: 'undetected_failures / total_failures',

  // Recovery quality
  repairSuccessRate: 'successful_repairs / total_repair_attempts',
  turnsToRecover: 'average_turns_from_detection_to_resolution',
  escalationRate: 'repairs_requiring_escalation / total_repairs',

  // User impact
  postRepairSatisfaction: 'user_satisfaction_after_repair',
  postRepairChurnRate: 'users_who_leave_after_repair',
  repeatFailureRate: 'same_failure_type_in_next_conversation',
};
```

### 10.2 Alerting Thresholds

```typescript
const REPAIR_ALERTS = [
  {
    metric: 'failureRate',
    threshold: 0.2,
    severity: 'warning',
    message: 'More than 20% of conversations are experiencing failures',
  },
  {
    metric: 'repairSuccessRate',
    threshold: 0.7, // Below 70%
    direction: 'below',
    severity: 'critical',
    message: 'Repair success rate has dropped below 70%',
  },
  {
    metric: 'escalationRate',
    threshold: 0.3,
    severity: 'critical',
    message: 'More than 30% of repairs require escalation — agents not self-recovering',
  },
  {
    metric: 'detectionLatency',
    threshold: 3, // More than 3 turns
    severity: 'warning',
    message: 'Average failure detection taking more than 3 turns — users are suffering',
  },
];
```

---

## Key Takeaways

1. Conversation failures are inevitable — plan for them, don't prevent all of them.
2. Detect failures from user signals: repetition, frustration language, explicit corrections, declining sentiment.
3. Use the REPAIR framework: Recognize, Empathize, Parse, Alternate, Integrate, Resolve.
4. Maximum 2 clarifications before attempting an answer with best guess.
5. Never blame the user. Never argue about facts you're uncertain about. Never repeat failed approaches.
6. Preserve context during repairs — users should never have to repeat themselves.
7. The escalation ladder provides a clear path when self-repair fails.
8. Pre-send checks can catch many failures before users see them.
9. Track repair metrics — high failure rates or low recovery rates indicate systemic issues.
10. Well-handled repairs actually increase user satisfaction and trust.

---

*Seed: conversation-repair-strategies | Domain: Agent Conversation & UX | Stone AI Palace Knowledge*
