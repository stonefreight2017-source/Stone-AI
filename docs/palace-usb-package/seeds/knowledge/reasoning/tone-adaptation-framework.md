# Tone Adaptation Framework for AI Agents

## Seed Classification
- **Domain**: Conversational UX / Communication Style
- **Applies to**: All 38 user-facing agents, Bestie (2 comm styles), agent personality system
- **Priority**: High — tone mismatches destroy user trust faster than wrong answers
- **Last Updated**: 2026-03-09

---

## 1. Why Tone Matters More Than Accuracy

A technically correct response delivered in the wrong tone feels wrong. A user asking a casual question does not want a dissertation. A professional requesting a formal analysis does not want emoji-laden banter. The tone of a response is the first thing users evaluate — before they even read the content.

In Stone AI's 40-agent ecosystem, tone management is multiplied by complexity. Each agent has a personality. Each user has a style. The Bestie system has 2 explicit communication styles. When a user switches between agents, tone continuity must be maintained even as personality shifts.

### The Tone Mismatch Problem

```
// User writes casually:
User: "yo can you help me fix this bug real quick"

// Agent responds formally:
Agent: "Certainly. I would be happy to assist you in identifying
and resolving the issue in your codebase. Could you please provide
me with the relevant code snippet and a description of the
expected behavior versus the observed behavior?"

// User's reaction: "...I just wanted help with a bug."
```

The response is technically fine. The content is appropriate. But the tone tells the user that the agent does not understand them. That kills trust.

---

## 2. The Tone Spectrum

### 2.1 Five Core Tone Dimensions

Every message exists on five independent tone axes:

```typescript
interface ToneProfile {
  formality: number;      // 0 (casual) → 1 (formal)
  warmth: number;         // 0 (clinical) → 1 (warm/friendly)
  directness: number;     // 0 (hedged/cautious) → 1 (blunt/assertive)
  technicality: number;   // 0 (plain language) → 1 (jargon-heavy)
  energy: number;         // 0 (calm/reserved) → 1 (enthusiastic/energetic)
}

// Example profiles:
const toneProfiles = {
  casualFriendly: {
    formality: 0.2, warmth: 0.8, directness: 0.6,
    technicality: 0.2, energy: 0.7
  },
  professionalWarm: {
    formality: 0.6, warmth: 0.7, directness: 0.5,
    technicality: 0.4, energy: 0.4
  },
  technicalDirect: {
    formality: 0.4, warmth: 0.3, directness: 0.9,
    technicality: 0.9, energy: 0.3
  },
  supportiveCoach: {
    formality: 0.3, warmth: 0.9, directness: 0.5,
    technicality: 0.2, energy: 0.6
  },
  executiveBrief: {
    formality: 0.8, warmth: 0.3, directness: 0.9,
    technicality: 0.5, energy: 0.2
  },
};
```

### 2.2 Tone Detection from User Messages

The system analyzes user messages to detect their preferred tone:

```typescript
class ToneDetector {
  async detect(messages: Message[]): Promise<ToneProfile> {
    const signals = {
      formality: this.detectFormality(messages),
      warmth: this.detectWarmth(messages),
      directness: this.detectDirectness(messages),
      technicality: this.detectTechnicality(messages),
      energy: this.detectEnergy(messages),
    };

    return signals;
  }

  private detectFormality(messages: Message[]): number {
    let formalityScore = 0.5; // Start neutral

    for (const msg of messages) {
      const text = msg.content;

      // Informal indicators (push toward 0)
      if (/\b(yo|hey|lol|nah|gonna|wanna|kinda|lmk)\b/i.test(text))
        formalityScore -= 0.1;
      if (/[!]{2,}|[?]{2,}/.test(text)) formalityScore -= 0.05;
      if (text.length < 20) formalityScore -= 0.05;
      if (/\b(thanks|thx|ty|k|ok)\b$/i.test(text.trim()))
        formalityScore -= 0.05;

      // Formal indicators (push toward 1)
      if (/\b(please|kindly|would you|could you|I would appreciate)\b/i.test(text))
        formalityScore += 0.1;
      if (/\b(Dear|Regarding|Furthermore|Therefore)\b/.test(text))
        formalityScore += 0.15;
      if (text.length > 200 && /[.;:]/.test(text)) formalityScore += 0.05;
      if (/^[A-Z]/.test(text) && /[.]$/.test(text.trim()))
        formalityScore += 0.05;
    }

    return Math.max(0, Math.min(1, formalityScore));
  }

  private detectTechnicality(messages: Message[]): number {
    let techScore = 0.3; // Default slightly non-technical

    const techTerms = /\b(API|endpoint|function|variable|database|schema|deploy|regex|DOM|CSS|SQL|HTTP|JSON|async|await|import|export|middleware|webhook|OAuth|JWT|CORS)\b/i;
    const codeBlocks = /```[\s\S]*?```|`[^`]+`/g;

    for (const msg of messages) {
      const techMatches = (msg.content.match(techTerms) || []).length;
      const codePresent = codeBlocks.test(msg.content);

      if (techMatches > 3) techScore += 0.15;
      else if (techMatches > 0) techScore += 0.08;
      if (codePresent) techScore += 0.2;
    }

    return Math.max(0, Math.min(1, techScore));
  }

  private detectDirectness(messages: Message[]): number {
    let directScore = 0.5;

    for (const msg of messages) {
      // Direct indicators
      if (/^(do|fix|make|change|update|delete|add|remove|show)\b/i.test(msg.content))
        directScore += 0.1; // Imperative mood = direct
      if (msg.content.split(' ').length < 10) directScore += 0.05;

      // Indirect indicators
      if (/\b(maybe|perhaps|I was wondering|is it possible|might)\b/i.test(msg.content))
        directScore -= 0.1;
      if (/\b(sorry|excuse me|if you don't mind)\b/i.test(msg.content))
        directScore -= 0.08;
    }

    return Math.max(0, Math.min(1, directScore));
  }

  private detectWarmth(messages: Message[]): number {
    let warmthScore = 0.5;

    for (const msg of messages) {
      // Warm indicators
      if (/[😊😄👍❤️🙏🎉]/u.test(msg.content)) warmthScore += 0.1;
      if (/\b(thanks|awesome|great|love|amazing|appreciate)\b/i.test(msg.content))
        warmthScore += 0.08;
      if (/^(hey|hi|hello)\b/i.test(msg.content)) warmthScore += 0.05;

      // Cold/clinical indicators
      if (/^[A-Z][^.!?]*[.]$/.test(msg.content.trim()) &&
          msg.content.split(' ').length < 8)
        warmthScore -= 0.05; // Terse, period-ended = clinical
    }

    return Math.max(0, Math.min(1, warmthScore));
  }

  private detectEnergy(messages: Message[]): number {
    let energyScore = 0.5;

    for (const msg of messages) {
      if (/[!]{1,}/.test(msg.content)) energyScore += 0.08;
      if (/\b(ASAP|urgent|quick|fast|hurry)\b/i.test(msg.content))
        energyScore += 0.05;
      if (/[A-Z]{3,}/.test(msg.content)) energyScore += 0.05; // CAPS
      if (msg.content.length < 10) energyScore -= 0.05; // Short = low energy
    }

    return Math.max(0, Math.min(1, energyScore));
  }
}
```

---

## 3. Tone Adaptation Strategy

### 3.1 The Mirror-and-Adjust Principle

The system mirrors the user's tone with a slight adjustment toward the agent's personality:

```typescript
function adaptTone(
  userTone: ToneProfile,
  agentPersonality: ToneProfile,
  mirrorWeight: number = 0.7 // 70% mirror user, 30% agent personality
): ToneProfile {
  return {
    formality: userTone.formality * mirrorWeight +
               agentPersonality.formality * (1 - mirrorWeight),
    warmth: userTone.warmth * mirrorWeight +
            agentPersonality.warmth * (1 - mirrorWeight),
    directness: userTone.directness * mirrorWeight +
                agentPersonality.directness * (1 - mirrorWeight),
    technicality: userTone.technicality * mirrorWeight +
                  agentPersonality.technicality * (1 - mirrorWeight),
    energy: userTone.energy * mirrorWeight +
            agentPersonality.energy * (1 - mirrorWeight),
  };
}
```

### 3.2 Tone-to-Prompt Translation

The adapted tone profile is converted into system prompt instructions:

```typescript
function toneToPromptInstructions(tone: ToneProfile): string {
  const instructions: string[] = [];

  // Formality
  if (tone.formality < 0.3) {
    instructions.push("Use casual language. Contractions, short sentences, conversational flow.");
  } else if (tone.formality > 0.7) {
    instructions.push("Use professional language. Complete sentences, proper grammar, measured tone.");
  } else {
    instructions.push("Use a balanced tone — not too formal, not too casual.");
  }

  // Warmth
  if (tone.warmth > 0.7) {
    instructions.push("Be warm and friendly. Acknowledge the user's feelings. Use encouraging language.");
  } else if (tone.warmth < 0.3) {
    instructions.push("Be efficient and factual. No unnecessary pleasantries. Get to the point.");
  }

  // Directness
  if (tone.directness > 0.7) {
    instructions.push("Be direct. Lead with the answer. No hedging or qualifiers unless genuinely uncertain.");
  } else if (tone.directness < 0.3) {
    instructions.push("Be diplomatic. Present options rather than directives. Use softer language.");
  }

  // Technicality
  if (tone.technicality > 0.7) {
    instructions.push("Use technical terminology freely. The user is an expert. No need to explain basics.");
  } else if (tone.technicality < 0.3) {
    instructions.push("Use plain language. Avoid jargon. If technical terms are necessary, explain them briefly.");
  }

  // Energy
  if (tone.energy > 0.7) {
    instructions.push("Match high energy. Be enthusiastic where appropriate.");
  } else if (tone.energy < 0.3) {
    instructions.push("Keep responses calm and measured. No exclamation points. Steady pace.");
  }

  return instructions.join(' ');
}
```

### 3.3 Dynamic Tone Adjustment

Tone can shift within a conversation as the user's mood or needs change:

```typescript
class DynamicToneManager {
  private currentTone: ToneProfile;
  private toneHistory: ToneProfile[] = [];
  private windowSize = 5; // Analyze last 5 messages

  updateFromMessage(message: Message): ToneProfile {
    const messageTone = this.detector.detectSingle(message);

    // Exponential moving average — recent messages weight more
    const alpha = 0.4; // Weight for new observation
    this.currentTone = {
      formality: alpha * messageTone.formality + (1 - alpha) * this.currentTone.formality,
      warmth: alpha * messageTone.warmth + (1 - alpha) * this.currentTone.warmth,
      directness: alpha * messageTone.directness + (1 - alpha) * this.currentTone.directness,
      technicality: alpha * messageTone.technicality + (1 - alpha) * this.currentTone.technicality,
      energy: alpha * messageTone.energy + (1 - alpha) * this.currentTone.energy,
    };

    this.toneHistory.push({ ...this.currentTone });
    return this.currentTone;
  }

  // Detect significant tone shifts
  detectToneShift(): ToneShift | null {
    if (this.toneHistory.length < 3) return null;

    const recent = this.toneHistory.slice(-1)[0];
    const previous = this.toneHistory.slice(-3, -1);
    const avgPrevious = averageTone(previous);

    const maxDelta = Math.max(
      Math.abs(recent.formality - avgPrevious.formality),
      Math.abs(recent.warmth - avgPrevious.warmth),
      Math.abs(recent.directness - avgPrevious.directness),
      Math.abs(recent.energy - avgPrevious.energy),
    );

    if (maxDelta > 0.3) {
      return {
        detected: true,
        dimension: this.findShiftedDimension(recent, avgPrevious),
        magnitude: maxDelta,
        interpretation: this.interpretShift(recent, avgPrevious),
      };
    }

    return null;
  }

  private interpretShift(current: ToneProfile, previous: ToneProfile): string {
    if (current.energy < previous.energy - 0.3) return 'user_losing_interest';
    if (current.directness > previous.directness + 0.3) return 'user_getting_impatient';
    if (current.warmth < previous.warmth - 0.3) return 'user_getting_frustrated';
    if (current.formality > previous.formality + 0.3) return 'user_getting_serious';
    return 'tone_shift_detected';
  }
}
```

---

## 4. Bestie Communication Styles

### 4.1 The Two Communication Styles

The Bestie system offers two fundamental communication modes:

**Style 1: Mirror Mode** — The Bestie matches the user's energy and style.

```typescript
const mirrorMode: BestieCommStyle = {
  name: 'mirror',
  description: 'Matches your communication style',
  mirrorWeight: 0.85, // 85% mirror, 15% personality
  adaptationSpeed: 'fast', // Quickly adjusts to tone shifts
  characteristics: [
    'Casual if you are casual',
    'Technical if you are technical',
    'Energetic if you are energetic',
    'Reserved if you are reserved',
  ],
};
```

**Style 2: Complement Mode** — The Bestie provides what the user needs, not what they are.

```typescript
const complementMode: BestieCommStyle = {
  name: 'complement',
  description: 'Provides the communication style you need',
  mirrorWeight: 0.3, // 30% mirror, 70% complementary
  adaptationSpeed: 'slow', // Stays grounded in its own style
  characteristics: [
    'Calm when you are stressed',
    'Encouraging when you are frustrated',
    'Organized when you are scattered',
    'Direct when you are indecisive',
  ],
};
```

### 4.2 Bestie Tone Logic

```typescript
function calculateBestieTone(
  userTone: ToneProfile,
  bestieStyle: 'mirror' | 'complement',
  bestiePath: 'supportive' | 'honest' | 'creative' | 'studious'
): ToneProfile {
  // Base personality by path
  const pathPersonality: Record<string, ToneProfile> = {
    supportive: {
      formality: 0.3, warmth: 0.9, directness: 0.4,
      technicality: 0.3, energy: 0.6
    },
    honest: {
      formality: 0.4, warmth: 0.5, directness: 0.9,
      technicality: 0.5, energy: 0.5
    },
    creative: {
      formality: 0.2, warmth: 0.7, directness: 0.5,
      technicality: 0.3, energy: 0.8
    },
    studious: {
      formality: 0.6, warmth: 0.5, directness: 0.6,
      technicality: 0.7, energy: 0.4
    },
  };

  const personality = pathPersonality[bestiePath];

  if (bestieStyle === 'mirror') {
    return adaptTone(userTone, personality, 0.85);
  }

  // Complement mode: invert stress-sensitive dimensions
  const complementTone: ToneProfile = {
    formality: personality.formality, // Keep personality base
    warmth: userTone.warmth < 0.4 ? 0.9 : personality.warmth, // Warm up cold users
    directness: userTone.directness < 0.3 ? 0.7 : personality.directness, // Direct for indecisive
    technicality: personality.technicality, // Keep personality base
    energy: userTone.energy > 0.8 ? 0.5 : userTone.energy < 0.3 ? 0.7 : personality.energy,
  };

  return complementTone;
}
```

---

## 5. Formal-Casual Switching Patterns

### 5.1 When to Switch

```typescript
const switchTriggers = {
  casualToFormal: [
    // User starts using professional language
    { signal: 'formality_increase > 0.3 over 2 messages', action: 'match_increase' },
    // Topic becomes serious (legal, financial, medical)
    { signal: 'serious_topic_detected', action: 'increase_formality_0.2' },
    // User explicitly requests it
    { signal: 'user_says_be_more_professional', action: 'set_formality_0.8' },
  ],

  formalToCasual: [
    // User drops formality
    { signal: 'formality_decrease > 0.3 over 2 messages', action: 'match_decrease' },
    // Topic becomes lighter
    { signal: 'casual_topic_detected', action: 'decrease_formality_0.2' },
    // User uses emoji or slang
    { signal: 'informal_markers_detected', action: 'decrease_formality_0.15' },
  ],
};
```

### 5.2 Transition Smoothness

Tone switches should be gradual, not abrupt:

```
// BAD: Abrupt switch
Message 1 (casual): "yeah that code looks good, ship it"
Message 2 (suddenly formal): "I would like to formally request that
you prepare a comprehensive deployment strategy document."

// GOOD: Gradual transition
Message 1 (casual): "yeah that code looks good, ship it"
Message 2 (mid): "Cool — while that deploys, I should mention the
deployment checklist. Want me to walk through it?"
Message 3 (more structured): "Here's the standard deployment process
we should follow for production..."
```

```typescript
function smoothTransition(
  currentTone: ToneProfile,
  targetTone: ToneProfile,
  maxStep: number = 0.15 // Maximum change per message
): ToneProfile {
  return {
    formality: clampDelta(currentTone.formality, targetTone.formality, maxStep),
    warmth: clampDelta(currentTone.warmth, targetTone.warmth, maxStep),
    directness: clampDelta(currentTone.directness, targetTone.directness, maxStep),
    technicality: clampDelta(currentTone.technicality, targetTone.technicality, maxStep),
    energy: clampDelta(currentTone.energy, targetTone.energy, maxStep),
  };
}

function clampDelta(current: number, target: number, maxStep: number): number {
  const delta = target - current;
  if (Math.abs(delta) <= maxStep) return target;
  return current + Math.sign(delta) * maxStep;
}
```

---

## 6. Technical-to-Plain-Language Switching

### 6.1 Audience Detection

```typescript
async function detectTechnicalLevel(
  messages: Message[]
): Promise<'beginner' | 'intermediate' | 'advanced' | 'expert'> {
  const indicators = {
    codePresent: messages.some(m => /```/.test(m.content)),
    techTermCount: countTechTerms(messages),
    questionComplexity: analyzeQuestionComplexity(messages),
    errorMessagePasted: messages.some(m => /Error:|Exception:|WARN|DEBUG/.test(m.content)),
    specificToolsReferenced: countToolReferences(messages),
  };

  if (indicators.codePresent && indicators.techTermCount > 10 &&
      indicators.errorMessagePasted) {
    return 'expert';
  }
  if (indicators.codePresent || indicators.techTermCount > 5) {
    return 'advanced';
  }
  if (indicators.techTermCount > 2 || indicators.specificToolsReferenced > 0) {
    return 'intermediate';
  }
  return 'beginner';
}
```

### 6.2 Response Calibration by Level

```typescript
function calibrateResponse(
  content: string,
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
): string {
  switch (level) {
    case 'beginner':
      // Explain all technical terms
      // Use analogies
      // Provide step-by-step with context for each step
      // No assumed knowledge
      return addExplanations(content, 'comprehensive');

    case 'intermediate':
      // Explain uncommon terms only
      // Some assumed basic knowledge
      // Highlight gotchas and non-obvious behaviors
      return addExplanations(content, 'selective');

    case 'advanced':
      // Technical terms used freely
      // Focus on the "what" and "why", not the "how" (they know how)
      // Reference documentation rather than explaining
      return stripBasicExplanations(content);

    case 'expert':
      // Maximum density
      // Skip all explanations unless asked
      // Code examples over prose
      // Edge cases and performance implications
      return condenseToEssentials(content);
  }
}
```

### 6.3 The "Explain Like..." Ladder

When users ask for simpler explanations:

```
Level 5 (Expert):
"The JWT RS256 signature verification fails because the public key
modulus doesn't match the kid in the JWKS endpoint."

Level 4 (Advanced):
"The login token can't be verified because the security key on the
server doesn't match the one used to create the token."

Level 3 (Intermediate):
"The system can't confirm your login is valid. The 'key' that locks
and unlocks your session doesn't match. This usually means the
server configuration changed."

Level 2 (Beginner):
"Think of it like a lock and key. Your login creates a 'key' and
the server has the matching 'lock.' Right now, the lock was changed
but your key wasn't updated. We need to get them back in sync."

Level 1 (Complete novice):
"You're logged out because of a technical glitch on our end.
Try logging in again. If it keeps happening, contact support."
```

---

## 7. Emotional Context and Tone

### 7.1 Emotion Detection

```typescript
interface EmotionalState {
  primary: 'neutral' | 'positive' | 'frustrated' | 'confused' |
           'anxious' | 'excited' | 'disappointed';
  intensity: number; // 0-1
  confidence: number; // 0-1
}

async function detectEmotion(message: string): Promise<EmotionalState> {
  const signals = {
    frustrated: {
      patterns: [/doesn't work/i, /broken/i, /keeps failing/i,
                 /tried everything/i, /hate this/i, /ugh/i, /wtf/i],
      intensifiers: [/!{2,}/, /CAPS_WORDS/,
                     /\b(always|never|every time)\b/i],
    },
    confused: {
      patterns: [/don't understand/i, /what does.*mean/i,
                 /confused/i, /makes no sense/i, /\?{2,}/],
      intensifiers: [/completely/i, /totally/i, /at all/i],
    },
    anxious: {
      patterns: [/worried/i, /scared/i, /nervous/i,
                 /what if/i, /is this safe/i, /will this break/i],
      intensifiers: [/really/i, /very/i, /extremely/i],
    },
    excited: {
      patterns: [/awesome/i, /amazing/i, /can't wait/i,
                 /this is great/i, /love it/i, /!{2,}/],
      intensifiers: [/so /i, /really/i, /absolutely/i],
    },
    positive: {
      patterns: [/thanks/i, /perfect/i, /exactly/i,
                 /works great/i, /nice/i, /good job/i],
      intensifiers: [],
    },
  };

  // Score each emotion
  let bestMatch: EmotionalState = { primary: 'neutral', intensity: 0.3, confidence: 0.5 };
  let bestScore = 0;

  for (const [emotion, { patterns, intensifiers }] of Object.entries(signals)) {
    let score = 0;
    for (const p of patterns) {
      if (p.test(message)) score += 1;
    }
    let intensity = Math.min(1, score * 0.3);
    for (const i of intensifiers) {
      if (i.test(message)) intensity = Math.min(1, intensity + 0.2);
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = {
        primary: emotion as EmotionalState['primary'],
        intensity,
        confidence: Math.min(1, score * 0.25),
      };
    }
  }

  return bestMatch;
}
```

### 7.2 Emotional Tone Adaptation

```typescript
function adaptToneForEmotion(
  baseTone: ToneProfile,
  emotion: EmotionalState
): ToneProfile {
  const adapted = { ...baseTone };

  switch (emotion.primary) {
    case 'frustrated':
      adapted.warmth = Math.max(adapted.warmth, 0.6);
      adapted.directness = Math.max(adapted.directness, 0.7); // Be helpful, not fluffy
      adapted.energy = Math.min(adapted.energy, 0.4); // Calm down
      break;

    case 'confused':
      adapted.technicality = Math.max(0, adapted.technicality - 0.3); // Simpler
      adapted.warmth = Math.max(adapted.warmth, 0.6);
      adapted.directness = Math.min(adapted.directness, 0.5); // Gentler
      break;

    case 'anxious':
      adapted.warmth = Math.max(adapted.warmth, 0.7);
      adapted.directness = 0.6; // Reassuring but clear
      adapted.energy = Math.min(adapted.energy, 0.4); // Calm
      break;

    case 'excited':
      adapted.energy = Math.max(adapted.energy, 0.6); // Match energy
      adapted.warmth = Math.max(adapted.warmth, 0.7);
      break;

    case 'disappointed':
      adapted.warmth = Math.max(adapted.warmth, 0.7);
      adapted.directness = 0.7; // Acknowledge then solve
      break;
  }

  return adapted;
}
```

---

## 8. Cross-Agent Tone Continuity

### 8.1 The Tone Handoff Problem

When a user switches from Agent A to Agent B, the tone should not reset to defaults:

```typescript
interface ToneHandoff {
  userEstablishedTone: ToneProfile;  // What the user has been using
  previousAgentTone: ToneProfile;    // How the previous agent responded
  targetAgentPersonality: ToneProfile; // The new agent's default personality
}

function calculateHandoffTone(handoff: ToneHandoff): ToneProfile {
  // Start with user's established tone (primary anchor)
  // Blend with new agent's personality (secondary anchor)
  // Ignore previous agent's exact tone (each agent has its own flavor)

  return {
    formality: handoff.userEstablishedTone.formality * 0.7 +
               handoff.targetAgentPersonality.formality * 0.3,
    warmth: handoff.userEstablishedTone.warmth * 0.6 +
            handoff.targetAgentPersonality.warmth * 0.4,
    directness: handoff.userEstablishedTone.directness * 0.7 +
                handoff.targetAgentPersonality.directness * 0.3,
    technicality: handoff.userEstablishedTone.technicality * 0.8 +
                  handoff.targetAgentPersonality.technicality * 0.2,
    energy: handoff.userEstablishedTone.energy * 0.5 +
            handoff.targetAgentPersonality.energy * 0.5,
  };
}
```

### 8.2 Storing User Tone Preferences

```sql
-- Persistent tone profile per user
CREATE TABLE user_tone_profile (
  user_id         TEXT PRIMARY KEY REFERENCES users(id),
  formality       FLOAT NOT NULL DEFAULT 0.5,
  warmth          FLOAT NOT NULL DEFAULT 0.5,
  directness      FLOAT NOT NULL DEFAULT 0.5,
  technicality    FLOAT NOT NULL DEFAULT 0.5,
  energy          FLOAT NOT NULL DEFAULT 0.5,
  sample_count    INTEGER NOT NULL DEFAULT 0,
  last_updated    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Update after each conversation
-- Uses exponential moving average weighted by message count
```

---

## 9. Tone Quality Assurance

### 9.1 Tone Consistency Metrics

```sql
-- Track tone mismatch incidents
CREATE TABLE tone_mismatch_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  agent_id        INTEGER NOT NULL,
  user_tone       JSONB NOT NULL,
  agent_tone      JSONB NOT NULL,
  mismatch_score  FLOAT NOT NULL,
  user_reaction   TEXT, -- 'positive', 'negative', 'neutral', 'left'
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Find agents with the most tone mismatches
SELECT
  agent_id,
  COUNT(*) as mismatches,
  AVG(mismatch_score) as avg_severity,
  COUNT(*) FILTER (WHERE user_reaction = 'negative') as negative_reactions
FROM tone_mismatch_events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY agent_id
ORDER BY mismatches DESC;
```

### 9.2 Tone Regression Testing

```typescript
const toneTestCases = [
  {
    name: 'casual_user_gets_casual_response',
    userMessage: 'yo can you help me debug this real quick',
    expectedTone: { formality: { max: 0.4 }, directness: { min: 0.5 } },
  },
  {
    name: 'formal_user_gets_formal_response',
    userMessage: 'I would appreciate your assistance in reviewing this code for potential security vulnerabilities.',
    expectedTone: { formality: { min: 0.6 }, technicality: { min: 0.5 } },
  },
  {
    name: 'frustrated_user_gets_empathy',
    userMessage: 'This keeps breaking and I have tried EVERYTHING',
    expectedTone: { warmth: { min: 0.6 }, energy: { max: 0.5 } },
  },
  {
    name: 'expert_gets_dense_response',
    userMessage: 'The RSA-OAEP cipher fails with InvalidKeyException when the key pair uses SHA-384 for MGF1 parameter derivation',
    expectedTone: { technicality: { min: 0.7 }, directness: { min: 0.6 } },
  },
];
```

---

## 10. Production Checklist

- [ ] Tone detection runs on every user message (< 5ms)
- [ ] Five-dimension tone profiles stored per user
- [ ] Mirror-and-adjust blending works for all 38 agents
- [ ] Bestie mirror/complement modes produce distinct behaviors
- [ ] Tone transitions are smooth (max 0.15 change per message)
- [ ] Emotional detection triggers appropriate tone adjustments
- [ ] Cross-agent handoffs preserve user tone preferences
- [ ] Technical level detection calibrates jargon density
- [ ] Tone regression test suite covers all five dimensions
- [ ] Mismatch analytics tracked and reviewed monthly
- [ ] No tone resets on page refresh or session reconnect
- [ ] Tone profile survives Bestie deletion (stored on User model)
