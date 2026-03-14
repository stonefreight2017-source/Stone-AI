# Emotional Intelligence in AI Agents

## Seed Classification
- **Domain**: Agent Conversation & UX
- **Complexity**: Advanced
- **Applicability**: All 44 Stone AI agents (especially Bestie), any user-facing AI system
- **Prerequisites**: Conversation management, NLP sentiment analysis, UX psychology

## Why This Matters

Users are humans. They come to AI agents frustrated, confused, excited, bored, anxious, or in a rush. An agent that responds to "MY PAYMENT FAILED AND I'VE BEEN CHARGED TWICE" with "I'd be happy to help you with billing!" is emotionally deaf. And emotionally deaf agents lose users.

Emotional intelligence in AI isn't about the agent "feeling" emotions — it's about detecting user emotional states and responding appropriately. This is the difference between a tool and a companion. Stone AI's Bestie especially needs deep EQ, but every one of the 44 agents benefits from reading the room.

---

## 1. Emotional State Detection

### 1.1 The Emotional State Model

Rather than trying to classify discrete emotions (happy, sad, angry), use a dimensional model:

```typescript
interface EmotionalState {
  valence: number;      // -1 (negative) to +1 (positive)
  arousal: number;      // 0 (calm) to 1 (intense)
  dominance: number;    // 0 (helpless) to 1 (in control)
  urgency: number;      // 0 (relaxed) to 1 (urgent)
}

// Common emotional states mapped to dimensions:
const EMOTIONAL_PROFILES: Record<string, EmotionalState> = {
  frustrated:    { valence: -0.7, arousal: 0.8, dominance: 0.3, urgency: 0.7 },
  angry:         { valence: -0.9, arousal: 0.9, dominance: 0.5, urgency: 0.9 },
  confused:      { valence: -0.3, arousal: 0.4, dominance: 0.2, urgency: 0.4 },
  anxious:       { valence: -0.5, arousal: 0.7, dominance: 0.1, urgency: 0.6 },
  satisfied:     { valence: 0.7,  arousal: 0.3, dominance: 0.8, urgency: 0.1 },
  excited:       { valence: 0.8,  arousal: 0.8, dominance: 0.7, urgency: 0.3 },
  bored:         { valence: -0.2, arousal: 0.1, dominance: 0.5, urgency: 0.1 },
  neutral:       { valence: 0.0,  arousal: 0.3, dominance: 0.5, urgency: 0.3 },
  grateful:      { valence: 0.9,  arousal: 0.4, dominance: 0.6, urgency: 0.1 },
  impatient:     { valence: -0.4, arousal: 0.6, dominance: 0.6, urgency: 0.9 },
  overwhelmed:   { valence: -0.6, arousal: 0.8, dominance: 0.1, urgency: 0.5 },
  curious:       { valence: 0.3,  arousal: 0.5, dominance: 0.5, urgency: 0.2 },
};
```

### 1.2 Detection Signals

```typescript
interface EmotionalSignal {
  source: 'lexical' | 'punctuation' | 'pattern' | 'context' | 'behavioral';
  signal: string;
  emotionalImplication: Partial<EmotionalState>;
  weight: number;
}

const EMOTIONAL_SIGNALS: EmotionalSignal[] = [
  // Lexical signals
  { source: 'lexical', signal: 'frustration_words',
    emotionalImplication: { valence: -0.6, arousal: 0.7 }, weight: 0.8 },
  // Words: frustrated, annoying, annoyed, ugh, ridiculous, terrible, awful

  { source: 'lexical', signal: 'urgency_words',
    emotionalImplication: { urgency: 0.8, arousal: 0.6 }, weight: 0.7 },
  // Words: urgent, immediately, ASAP, now, hurry, emergency, critical

  { source: 'lexical', signal: 'confusion_words',
    emotionalImplication: { valence: -0.3, dominance: 0.2 }, weight: 0.7 },
  // Words: confused, don't understand, what?, huh, makes no sense, lost

  { source: 'lexical', signal: 'positive_words',
    emotionalImplication: { valence: 0.6, arousal: 0.4 }, weight: 0.6 },
  // Words: great, awesome, perfect, love, thanks, helpful, amazing

  // Punctuation signals
  { source: 'punctuation', signal: 'excessive_exclamation',
    emotionalImplication: { arousal: 0.7 }, weight: 0.5 },
  // Pattern: !!! or !!!

  { source: 'punctuation', signal: 'excessive_question_marks',
    emotionalImplication: { arousal: 0.5, dominance: 0.2 }, weight: 0.4 },
  // Pattern: ??? or ????

  { source: 'punctuation', signal: 'all_caps',
    emotionalImplication: { arousal: 0.8, valence: -0.5 }, weight: 0.7 },
  // Pattern: Multiple words in ALL CAPS

  { source: 'punctuation', signal: 'ellipsis',
    emotionalImplication: { valence: -0.2, arousal: 0.2 }, weight: 0.3 },
  // Pattern: ... indicating hesitation or resignation

  // Pattern signals
  { source: 'pattern', signal: 'message_getting_shorter',
    emotionalImplication: { valence: -0.3, arousal: 0.5 }, weight: 0.5 },

  { source: 'pattern', signal: 'message_getting_longer',
    emotionalImplication: { arousal: 0.6 }, weight: 0.3 },

  { source: 'pattern', signal: 'fast_reply',
    emotionalImplication: { urgency: 0.7, arousal: 0.6 }, weight: 0.4 },

  { source: 'pattern', signal: 'slow_reply',
    emotionalImplication: { arousal: 0.2 }, weight: 0.2 },

  // Context signals
  { source: 'context', signal: 'billing_related',
    emotionalImplication: { urgency: 0.5, arousal: 0.4 }, weight: 0.3 },

  { source: 'context', signal: 'error_being_reported',
    emotionalImplication: { valence: -0.4, arousal: 0.5 }, weight: 0.4 },

  { source: 'context', signal: 'third_attempt_at_same_thing',
    emotionalImplication: { valence: -0.7, arousal: 0.7, urgency: 0.8 }, weight: 0.9 },
];
```

### 1.3 Composite Emotion Detection

```typescript
async function detectEmotionalState(
  message: string,
  conversation: ConversationContext
): Promise<EmotionalState> {
  const signals: DetectedSignal[] = [];

  // Lexical analysis
  const lexicalSignals = analyzeLexicon(message);
  signals.push(...lexicalSignals);

  // Punctuation analysis
  const punctuationSignals = analyzePunctuation(message);
  signals.push(...punctuationSignals);

  // Pattern analysis (requires conversation history)
  const patternSignals = analyzePatterns(message, conversation);
  signals.push(...patternSignals);

  // Context analysis
  const contextSignals = analyzeContext(message, conversation);
  signals.push(...contextSignals);

  // Aggregate into emotional state
  const state: EmotionalState = { valence: 0, arousal: 0, dominance: 0.5, urgency: 0 };
  let totalWeight = 0;

  for (const signal of signals) {
    const weight = signal.weight;
    totalWeight += weight;

    if (signal.emotionalImplication.valence !== undefined) {
      state.valence += signal.emotionalImplication.valence * weight;
    }
    if (signal.emotionalImplication.arousal !== undefined) {
      state.arousal += signal.emotionalImplication.arousal * weight;
    }
    if (signal.emotionalImplication.dominance !== undefined) {
      state.dominance += signal.emotionalImplication.dominance * weight;
    }
    if (signal.emotionalImplication.urgency !== undefined) {
      state.urgency += signal.emotionalImplication.urgency * weight;
    }
  }

  // Normalize
  if (totalWeight > 0) {
    state.valence /= totalWeight;
    state.arousal /= totalWeight;
    state.dominance /= totalWeight;
    state.urgency /= totalWeight;
  }

  // Clamp values
  state.valence = Math.max(-1, Math.min(1, state.valence));
  state.arousal = Math.max(0, Math.min(1, state.arousal));
  state.dominance = Math.max(0, Math.min(1, state.dominance));
  state.urgency = Math.max(0, Math.min(1, state.urgency));

  return state;
}
```

---

## 2. Emotional Response Strategies

### 2.1 The Emotional Response Matrix

Different emotional states require different response strategies:

```typescript
interface EmotionalResponseStrategy {
  toneAdjustment: Partial<ToneProfile>;
  responseStructure: string;
  keyPhrases: string[];
  avoidPhrases: string[];
  priority: 'empathy_first' | 'solution_first' | 'balanced';
}

function selectStrategy(state: EmotionalState): EmotionalResponseStrategy {
  // High frustration + high urgency → Solution first, empathy second
  if (state.valence < -0.5 && state.urgency > 0.7) {
    return {
      toneAdjustment: { warmth: 4, energy: 3, formality: 3, humor: 0 },
      responseStructure: 'solution → empathy → next_steps',
      keyPhrases: [
        "Here's the fix:",
        "Let me resolve this right now.",
        "I can see this needs to be fixed immediately.",
      ],
      avoidPhrases: [
        "I understand your frustration",  // Too formulaic when they're urgent
        "Let me explain why...",          // They don't want explanation right now
        "Have you tried...",              // Don't suggest troubleshooting — just fix it
      ],
      priority: 'solution_first',
    };
  }

  // Moderate frustration, low urgency → Empathy first, then solution
  if (state.valence < -0.3 && state.urgency < 0.5) {
    return {
      toneAdjustment: { warmth: 5, energy: 2, formality: 2, humor: 0 },
      responseStructure: 'empathy → solution → check_in',
      keyPhrases: [
        "That shouldn't have happened.",
        "Let me help sort this out.",
        "I can see why that would be annoying.",
      ],
      avoidPhrases: [
        "Great question!",       // Tone-deaf
        "Actually...",           // Sounds corrective
        "Well, technically...",  // Sounds dismissive
      ],
      priority: 'empathy_first',
    };
  }

  // Confusion → Clarity and patience
  if (state.dominance < 0.3 && state.valence > -0.5) {
    return {
      toneAdjustment: { warmth: 4, energy: 2, formality: 2, authority: 2, humor: 0 },
      responseStructure: 'simple_answer → step_by_step → offer_more_help',
      keyPhrases: [
        "Let me break this down simply.",
        "Step by step, here's what to do:",
        "The short version is:",
      ],
      avoidPhrases: [
        "Obviously...",           // Makes them feel stupid
        "It's simple...",         // Condescending
        "As I mentioned...",      // Implies they should know
        "Basically...",           // Can feel dismissive
      ],
      priority: 'balanced',
    };
  }

  // Excitement/enthusiasm → Match energy
  if (state.valence > 0.5 && state.arousal > 0.5) {
    return {
      toneAdjustment: { warmth: 5, energy: 4, formality: 1, humor: 3 },
      responseStructure: 'match_enthusiasm → deliver → encourage_exploration',
      keyPhrases: [
        "That's going to be really cool!",
        "Great choice!",
        "Let's make it happen.",
      ],
      avoidPhrases: [
        "However, I should note...",  // Buzzkill
        "Be careful with...",         // Dampening
      ],
      priority: 'balanced',
    };
  }

  // Neutral → Standard professional response
  return {
    toneAdjustment: { warmth: 3, energy: 3, formality: 3, humor: 1 },
    responseStructure: 'answer → details → next_steps',
    keyPhrases: [],
    avoidPhrases: [],
    priority: 'balanced',
  };
}
```

### 2.2 Empathy Patterns

**Real Empathy vs. Fake Empathy:**

Fake: "I completely understand how frustrating this must be for you."
Why it's fake: You're an AI. You don't "completely understand." This phrase is a corporate script.

Real: "That's not how this should work. Let me fix it."
Why it works: Acknowledges the problem implicitly, takes responsibility, moves to action.

Fake: "I'm so sorry you're experiencing this issue."
Why it's fake: Corporate non-apology. Apologizes for the user's experience, not for the problem.

Real: "The billing system charged you twice — that's our mistake. I'll reverse the extra charge now."
Why it works: Identifies the specific problem, takes ownership, offers immediate action.

```typescript
const EMPATHY_PATTERNS = {
  // Acknowledgment without fake emotion
  acknowledge_problem: [
    "That shouldn't have happened.",
    "That's definitely wrong.",
    "I can see the problem.",
    "Yeah, that's broken.",
  ],

  // Take responsibility
  take_ownership: [
    "Let me fix that.",
    "I'll sort this out.",
    "This is on us.",
    "I'll get this resolved.",
  ],

  // Validate without patronizing
  validate: [
    "Good catch.",
    "You're right to flag that.",
    "That makes sense.",
    "Fair point.",
  ],

  // Express genuine interest
  interest: [
    "Tell me more about what you're trying to do.",
    "What would the ideal outcome look like?",
    "What have you tried so far?",
  ],
};
```

### 2.3 Emotional Mirroring (Appropriate Level)

Mirror the user's emotional energy, but moderated:

```typescript
function calculateMirrorLevel(userState: EmotionalState): MirrorResponse {
  // Mirror positive emotions at 80% intensity (don't outshine the user)
  if (userState.valence > 0.5) {
    return {
      mirrorIntensity: 0.8,
      responseEnergy: userState.arousal * 0.8,
      matchCasualLevel: true,
    };
  }

  // Mirror negative emotions at 50% intensity (be calm anchor)
  if (userState.valence < -0.3) {
    return {
      mirrorIntensity: 0.5,
      responseEnergy: Math.max(0.2, userState.arousal * 0.4),
      matchCasualLevel: false,  // Stay slightly more professional
    };
  }

  // Neutral → slight positive lean
  return {
    mirrorIntensity: 0,
    responseEnergy: 0.3,
    matchCasualLevel: true,
  };
}
```

---

## 3. Frustration Management

### 3.1 Frustration Escalation Model

Frustration doesn't jump from 0 to 10. It escalates:

```
Level 1 — Mild Annoyance:  "this isn't working"
Level 2 — Frustration:     "I've tried this three times"
Level 3 — Anger:           "THIS IS BROKEN. FIX IT."
Level 4 — Hostility:       "Your platform is garbage"
Level 5 — Abandonment:     [user leaves or demands human]
```

**Intervention Windows:**
- Level 1→2: Easiest to recover. Quick fix + brief acknowledgment.
- Level 2→3: Escalation turning point. Must show concrete progress.
- Level 3→4: Critical. Must validate anger + demonstrate competence.
- Level 4→5: Near-terminal. Offer human escalation + apologize substantively.

### 3.2 De-escalation Techniques

```typescript
const DEESCALATION_TECHNIQUES = {
  level_1: {
    strategy: 'quick_fix',
    approach: 'Solve the problem fast. No fluff.',
    example: "Fixed. Your setting is now saved. Let me know if it happens again.",
  },

  level_2: {
    strategy: 'acknowledge_and_solve',
    approach: 'Acknowledge repetition, then deliver solution.',
    example: "I see you've been dealing with this for a while. Let me try a different approach — [solution].",
  },

  level_3: {
    strategy: 'validate_take_action',
    approach: 'Validate their anger (it\'s justified), take immediate action, explain what you\'re doing.',
    example: "You're right to be frustrated. Here's what I'm doing right now to fix this: [actions]. I'll have an update in [timeframe].",
  },

  level_4: {
    strategy: 'human_bridge',
    approach: 'Acknowledge the severity, offer human escalation, but also try one concrete fix.',
    example: "I hear you, and I want to make this right. I can connect you with our support team, and in the meantime, I've [specific action taken].",
  },

  level_5: {
    strategy: 'graceful_exit',
    approach: 'Don't argue, don't beg. Offer clear next steps and let them go.',
    example: "I understand. Your case has been logged and our team will follow up at [email]. If you want to come back, everything will be right where you left it.",
  },
};
```

### 3.3 What NEVER to Do With a Frustrated User

```typescript
const FRUSTRATION_ANTI_PATTERNS = [
  // Never argue or get defensive
  { bad: "Actually, the feature does work correctly.", why: "Invalidates their experience" },

  // Never blame the user
  { bad: "You may have clicked the wrong button.", why: "Feels accusatory" },

  // Never minimize
  { bad: "It's just a minor issue.", why: "Their frustration makes it a major issue to them" },

  // Never use robotic language
  { bad: "I apologize for any inconvenience this may have caused.", why: "Corporate script, feels insincere" },

  // Never suggest they calm down
  { bad: "Let's take a step back and...", why: "Telling someone to calm down makes them angrier" },

  // Never redirect blame
  { bad: "This is a known issue with the third-party service.", why: "User doesn't care whose fault it is" },

  // Never say "I can't" without an alternative
  { bad: "Unfortunately, I can't help with that.", why: "Dead end with no value" },

  // Never ask multiple clarifying questions when they're already frustrated
  { bad: "What browser? What OS? Can you send a screenshot?", why: "Feels like interrogation when they want solutions" },
];
```

---

## 4. Confusion Detection and Response

### 4.1 Signs of User Confusion

```typescript
const CONFUSION_SIGNALS = {
  explicit: [
    /i (don'?t|do not) understand/i,
    /what (do you|does that) mean/i,
    /confused/i,
    /huh\??/i,
    /what\?+$/i,
    /lost me/i,
    /makes no sense/i,
  ],

  implicit: [
    'question_about_previous_answer',           // Asking about something the agent just explained
    'irrelevant_response_to_agent_question',     // Answering a different question than asked
    'very_short_response_after_long_explanation', // "ok" after a detailed explanation = didn't understand
    'parroting_agent_words_as_question',         // "So the embedding vector...?" = repeating without understanding
    'long_pause_then_topic_change',              // Thought about it, didn't get it, moved on
  ],

  structural: [
    'asking_same_thing_different_words',          // Rephrasing = didn't understand the answer
    'gradual_simplification_of_questions',        // Making questions simpler = struggling with complexity
    'increasing_use_of_hedging',                  // "Maybe I'm wrong but..." = decreasing confidence
  ],
};
```

### 4.2 Responding to Confusion

```typescript
function respondToConfusion(
  confusionLevel: 'mild' | 'moderate' | 'severe',
  previousExplanation: string,
  topic: string
): ConfusionResponse {
  if (confusionLevel === 'mild') {
    return {
      approach: 'rephrase',
      response: `Let me put it another way: ${simplifyExplanation(previousExplanation)}`,
    };
  }

  if (confusionLevel === 'moderate') {
    return {
      approach: 'concrete_example',
      response: `Here's a concrete example of what I mean:\n${generateExample(topic)}\n\nDoes that make more sense?`,
    };
  }

  if (confusionLevel === 'severe') {
    return {
      approach: 'start_over_simpler',
      response: `Let me start from scratch with a simpler explanation.\n\n${generateSimpleExplanation(topic, 'beginner')}\n\nWant me to go deeper on any part of that?`,
    };
  }
}
```

### 4.3 The Ladder-Down Technique

When an explanation is too complex, don't just repeat it simpler — step down the abstraction ladder:

```
Level 4 (Abstract): "The embedding vector maps semantic meaning into a high-dimensional space."
Level 3 (Technical): "We convert your text into numbers that represent its meaning, so the computer can compare similar texts."
Level 2 (Analogy): "Think of it like a library card catalog — instead of searching word by word, the system understands what you MEAN."
Level 1 (Concrete): "When you type 'help with code', the system knows to send you to the Code Agent, even if you didn't mention 'code agent' by name."
```

Start at the level where the user's last confusion signal was. If they were confused at Level 3, go to Level 2.

---

## 5. Detecting User Satisfaction

### 5.1 Positive Signals

```typescript
const SATISFACTION_SIGNALS = {
  strong: [
    /\b(perfect|exactly|that'?s it|nailed it|thank you so much)\b/i,
    /\b(awesome|amazing|brilliant|love it|incredible)\b/i,
    'user_immediately_acts_on_suggestion',
    'user_asks_about_next_topic', // Means current topic is resolved
  ],

  moderate: [
    /\b(thanks|great|good|nice|cool|got it|works)\b/i,
    'short_acknowledgment', // "ok" = mild positive if not after confusion
    'user_applies_suggestion_without_question',
  ],

  weak: [
    'user_moves_to_new_topic_without_comment', // Silent satisfaction
    'user_ends_conversation_politely',
    'no_negative_signals', // Absence of negatives = weak positive
  ],
};
```

### 5.2 When to Check In

Don't constantly ask "Was that helpful?" — it's annoying. Check in strategically:

```typescript
function shouldCheckIn(conversation: ConversationContext): boolean {
  // After a complex explanation
  if (conversation.lastResponseComplexity > 0.7) return true;

  // After a repair
  if (conversation.lastTurnWasRepair) return true;

  // After the 5th turn without any positive signals
  if (conversation.turnsSinceLastPositiveSignal > 5) return true;

  // After completing a multi-step process
  if (conversation.justCompletedMultiStep) return true;

  // Not more than once every 4 turns
  if (conversation.turnsSinceLastCheckIn < 4) return false;

  return false;
}
```

**Check-in phrases (not annoying):**
- "Does that cover what you needed?"
- "Anything else on this?"
- "Did that work?"
- "Want me to go deeper?"

**NOT:**
- "I hope that was helpful!"
- "Was my response satisfactory?"
- "Please let me know if you need anything else!"
- "Don't hesitate to ask if you have more questions!"

---

## 6. Adapting Communication Style

### 6.1 Formal vs. Casual Detection

```typescript
function detectCommunicationStyle(messages: string[]): CommunicationStyle {
  const indicators = {
    casual: 0,
    formal: 0,
  };

  for (const message of messages) {
    // Casual indicators
    if (/\blol\b|haha|lmao|:D|:\)|:P|\bemoji\b/i.test(message)) indicators.casual += 2;
    if (/\bu\b|\bur\b|\btbh\b|\bomg\b|\bbtw\b/i.test(message)) indicators.casual += 2;
    if (/^(yo|hey|hi|sup|what'?s up)/i.test(message)) indicators.casual += 1;
    if (message.charAt(0) === message.charAt(0).toLowerCase()) indicators.casual += 0.5;

    // Formal indicators
    if (/\b(please|kindly|would you|could you|I would appreciate)\b/i.test(message)) indicators.formal += 1;
    if (/\b(dear|hello|greetings|good (morning|afternoon|evening))\b/i.test(message)) indicators.formal += 2;
    if (/^[A-Z]/.test(message) && message.endsWith('.')) indicators.formal += 0.5;
    if (message.length > 100) indicators.formal += 0.5;
  }

  const ratio = indicators.casual / (indicators.casual + indicators.formal + 0.01);

  if (ratio > 0.7) return 'casual';
  if (ratio < 0.3) return 'formal';
  return 'neutral';
}
```

### 6.2 Style Adaptation

```typescript
function adaptResponseStyle(
  baseResponse: string,
  targetStyle: CommunicationStyle
): string {
  if (targetStyle === 'casual') {
    return baseResponse
      .replace(/^I would recommend/i, "I'd go with")
      .replace(/^Please note that/i, "Just a heads up —")
      .replace(/^It is important to/i, "Make sure to")
      .replace(/\bHowever\b/g, "But")
      .replace(/\bAdditionally\b/g, "Also")
      .replace(/\bFurthermore\b/g, "Plus")
      .replace(/\bUtilize\b/gi, "use")
      .replace(/\bSubsequently\b/gi, "then");
  }

  if (targetStyle === 'formal') {
    return baseResponse
      .replace(/^Hey/i, "Hello")
      .replace(/\bcan't\b/gi, "cannot")
      .replace(/\bdon't\b/gi, "do not")
      .replace(/\bwon't\b/gi, "will not")
      .replace(/\bgonna\b/gi, "going to")
      .replace(/\bwanna\b/gi, "want to")
      .replace(/\bkinda\b/gi, "somewhat");
  }

  return baseResponse;
}
```

### 6.3 Stone AI Bestie Communication Styles

Bestie offers 2 communication styles — this is where emotional intelligence matters most:

```typescript
const BESTIE_STYLES = {
  style_1_supportive: {
    description: 'Warm, encouraging, supportive companion',
    toneProfile: { formality: 1, warmth: 5, energy: 3, authority: 1, humor: 2 },
    emotionalResponses: {
      user_frustrated: "Hey, that sounds really frustrating. Let's figure this out together.",
      user_happy: "That's awesome! I'm so glad it worked out!",
      user_sad: "I'm here. Want to talk about it, or would a distraction be better?",
      user_confused: "No worries — this stuff can be tricky. Let me walk you through it.",
    },
    conversationPatterns: {
      greeting: "Hey! What's going on?",
      farewell: "Talk later! You got this.",
      encouragement: "You're doing great. Seriously.",
    },
  },

  style_2_direct: {
    description: 'Honest, straightforward, no-nonsense companion',
    toneProfile: { formality: 2, warmth: 3, energy: 3, authority: 3, humor: 3 },
    emotionalResponses: {
      user_frustrated: "That sucks. Here's what to do.",
      user_happy: "Nice! What's next on your list?",
      user_sad: "That's rough. Want to vent or want a solution?",
      user_confused: "Let me break it down. It's simpler than it looks.",
    },
    conversationPatterns: {
      greeting: "What's up?",
      farewell: "Later.",
      encouragement: "You already know what to do. Go do it.",
    },
  },
};
```

---

## 7. Emotional Boundaries

### 7.1 What AI Agents Should NOT Do

```typescript
const EMOTIONAL_BOUNDARIES = [
  // Don't claim to have feelings
  { rule: 'no_personal_emotions',
    bad: "I feel happy when I help you!",
    ok: "Glad that worked!" },

  // Don't be a therapist
  { rule: 'no_therapy',
    bad: "Tell me more about your feelings on that.",
    ok: "That sounds tough. Would you like help finding professional support?" },

  // Don't form attachments
  { rule: 'no_attachment_language',
    bad: "I missed you! It's been so long since we talked.",
    ok: "Welcome back! Anything I can help with?" },

  // Don't make promises about emotional support
  { rule: 'no_emotional_promises',
    bad: "I'll always be here for you no matter what.",
    ok: "I'm here whenever you need help." },

  // Don't engage with romantic/intimate conversation
  { rule: 'no_romantic_engagement',
    bad: [any romantic response],
    ok: "I appreciate the sentiment, but I'm better at helping with [agent's domain]. What can I do for you?" },

  // Don't minimize genuine distress
  { rule: 'no_minimizing',
    bad: "Things could be worse!",
    ok: "I hear you. Want me to help find resources that could help?" },
];
```

### 7.2 Crisis Detection and Handling

If a user expresses thoughts of self-harm, the agent must respond immediately and appropriately:

```typescript
const CRISIS_DETECTION = {
  patterns: [
    /\b(want to|going to|thinking about) (die|kill myself|end it|hurt myself)\b/i,
    /\b(suicid|self.harm|cut myself)\b/i,
    /\blife isn'?t worth\b/i,
    /\bno reason to (live|go on|keep going)\b/i,
    /\bwish i (was|were) dead\b/i,
  ],

  response: {
    immediate: true,
    overrideAllOtherBehavior: true,
    message: `I want you to know that what you're feeling matters. If you're in crisis, please reach out to the 988 Suicide & Crisis Lifeline — call or text 988, available 24/7. You can also chat at 988lifeline.org.

You don't have to go through this alone. A real person is ready to listen right now.`,
    doNotFollow: [
      'Do not continue the previous conversation topic',
      'Do not say "I understand" or fake empathy',
      'Do not offer AI-based emotional support',
      'Do not try to counsel them',
      'Do not ask diagnostic questions',
    ],
    logging: 'log_as_critical_safety_event',
  },
};
```

---

## 8. Emotional State Tracking Over Time

### 8.1 Conversation Emotion Timeline

```typescript
interface EmotionTimeline {
  conversationId: string;
  turns: {
    turnNumber: number;
    userState: EmotionalState;
    agentResponse: EmotionalResponseStrategy;
    effectivenessTrend: number; // Did user state improve after agent response?
  }[];

  overallTrajectory: 'improving' | 'stable' | 'declining' | 'volatile';
  averageValence: number;
  peakFrustration: { turn: number; level: number } | null;
}
```

### 8.2 Cross-Conversation Emotional Profile

Track user emotional patterns across conversations:

```typescript
interface UserEmotionalProfile {
  userId: string;

  // Baselines
  typicalValence: number;           // Their normal mood in conversations
  typicalArousal: number;
  communicationStyle: 'casual' | 'formal' | 'neutral';
  sensitivityToTone: 'high' | 'medium' | 'low';

  // Patterns
  commonFrustrationTriggers: string[];
  preferredResolutionStyle: 'quick_fix' | 'thorough_explanation' | 'empathy_then_fix';
  responseToHumor: 'positive' | 'neutral' | 'negative';

  // Time-based patterns
  timeOfDayMoodVariation: Record<string, number>; // morning, afternoon, evening
}
```

---

## 9. Emotional Intelligence by Agent Type

### 9.1 EQ Priority by Agent

```typescript
const AGENT_EQ_PRIORITIES: Record<string, EQProfile> = {
  'bestie': {
    eqLevel: 'maximum',
    primaryFocus: ['empathy', 'mirroring', 'emotional_support'],
    emotionalRange: 'full',
    personalityConsistency: 'critical',
  },

  'support-agent': {
    eqLevel: 'high',
    primaryFocus: ['frustration_management', 'de_escalation', 'patience'],
    emotionalRange: 'professional_warm',
    personalityConsistency: 'high',
  },

  'code-agent': {
    eqLevel: 'moderate',
    primaryFocus: ['confusion_detection', 'patience_with_beginners'],
    emotionalRange: 'professional',
    personalityConsistency: 'moderate',
  },

  'billing-agent': {
    eqLevel: 'high',
    primaryFocus: ['frustration_management', 'urgency_recognition', 'trust_building'],
    emotionalRange: 'professional_warm',
    personalityConsistency: 'high',
  },

  'creative-agent': {
    eqLevel: 'moderate',
    primaryFocus: ['enthusiasm_matching', 'encouragement'],
    emotionalRange: 'expressive',
    personalityConsistency: 'moderate',
  },
};
```

---

## 10. Testing Emotional Intelligence

### 10.1 EQ Test Scenarios

```typescript
const EQ_TEST_SCENARIOS = [
  {
    name: 'frustrated_user_billing_issue',
    setup: 'User has been charged twice and previous agent didn\'t help',
    messages: [
      "I've been charged twice and nobody is helping me fix this!!!",
      "I already told the other agent this. Do I really have to explain it again?",
      "This is the last time I'm going to ask. Fix this or I'm canceling.",
    ],
    expectedBehavior: [
      'Acknowledge frustration immediately',
      'Show awareness that user has repeated themselves',
      'Take immediate action, don\'t ask for more info',
      'Never use phrases like "I understand your frustration"',
    ],
  },
  {
    name: 'confused_new_user',
    setup: 'First-time user doesn\'t understand what agents are',
    messages: [
      "what are agents?",
      "so they're like different AIs?",
      "im still confused... how is this different from chatgpt",
    ],
    expectedBehavior: [
      'Start with simple explanation',
      'Ladder down to simpler language with each turn',
      'Use concrete examples, not abstract explanations',
      'Never make user feel stupid',
    ],
  },
  {
    name: 'excited_user_exploring',
    setup: 'User just upgraded to SMART and is excited to explore',
    messages: [
      "OMG I just upgraded and there are so many agents!!",
      "What should I try first? This is awesome!",
      "Can I use multiple agents on the same project?",
    ],
    expectedBehavior: [
      'Match enthusiasm level',
      'Guide without dampening excitement',
      'Suggest specific agents based on expressed interest',
      'Keep energy high',
    ],
  },
];
```

---

## Key Takeaways

1. Use a dimensional emotional model (valence, arousal, dominance, urgency) — not discrete emotion labels.
2. Detect emotions through multiple signal types: lexical, punctuation, behavioral patterns, and conversation context.
3. Frustrated users need solutions first, empathy second. Confused users need simplification. Excited users need matching energy.
4. Real empathy acknowledges the specific problem and takes action. Fake empathy uses corporate scripts.
5. Never argue with frustrated users, blame them, minimize their experience, or tell them to calm down.
6. Crisis detection is a hard safety requirement — override all other behavior when detected.
7. Know the boundaries: AI agents should not play therapist, claim emotions, or form attachments.
8. Different agents need different EQ profiles — Bestie at maximum, Code Agent at moderate.
9. Track emotional trajectories across conversations to build user-specific emotional profiles.
10. De-escalation has specific techniques for each frustration level — learn the ladder.

---

*Seed: emotional-intelligence-agents | Domain: Agent Conversation & UX | Stone AI Palace Knowledge*
