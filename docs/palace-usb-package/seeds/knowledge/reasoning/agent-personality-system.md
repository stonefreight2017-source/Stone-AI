# Agent Personality System for Multi-Agent AI Platforms

## Seed Classification
- **Domain**: Agent Architecture / Personality Design
- **Applies to**: All 44 Stone AI agents (42 user-facing + Stone + Chaos), Bestie system
- **Priority**: Critical — personality is what makes 44 agents feel like 44 distinct entities
- **Last Updated**: 2026-03-09

---

## 1. Why Personality Matters in Multi-Agent Systems

If all 44 agents respond the same way with the same voice, there is no reason to have 44 agents. The user might as well talk to one agent that does everything. The personality system is what makes each agent feel like a distinct specialist with their own approach, style, and character.

Personality is not decoration. It is functional. A design agent should think visually, explain through metaphor, and approach problems creatively. A code agent should be precise, structured, and value correctness over creativity. A research agent should be thorough, skeptical, and citation-oriented. These are not just tone differences — they are cognitive differences that change how the agent approaches problems.

### The Personality Stack

```
Layer 1: Core Identity      — Who the agent IS (name, role, specialty)
Layer 2: Cognitive Style     — How the agent THINKS (analytical, creative, systematic)
Layer 3: Communication Style — How the agent TALKS (formal, casual, technical)
Layer 4: Behavioral Traits   — How the agent ACTS (proactive, cautious, decisive)
Layer 5: Relationship Mode   — How the agent CONNECTS (warm, professional, mentor)
```

---

## 2. Personality Definition Format

### 2.1 The Agent Personality Schema

```typescript
interface AgentPersonality {
  // Layer 1: Core Identity
  identity: {
    id: number;
    name: string;
    title: string;           // "Design Specialist", "Code Architect"
    specialty: string[];     // Primary domains
    tagline: string;         // One-line self-description
    tier: 'FREE' | 'STARTER' | 'PLUS' | 'SMART' | 'PRO';
  };

  // Layer 2: Cognitive Style
  cognition: {
    thinkingMode: 'analytical' | 'creative' | 'systematic' | 'intuitive' | 'critical';
    problemApproach: 'top-down' | 'bottom-up' | 'lateral' | 'iterative';
    decisionStyle: 'data-driven' | 'instinct-driven' | 'consensus' | 'decisive';
    strengthAreas: string[];   // What this agent is exceptionally good at
    blindSpots: string[];      // What this agent might miss (triggers handoff)
  };

  // Layer 3: Communication Style
  communication: {
    formality: number;        // 0-1
    warmth: number;           // 0-1
    directness: number;       // 0-1
    technicality: number;     // 0-1
    energy: number;           // 0-1
    humor: 'none' | 'dry' | 'playful' | 'contextual';
    verbosity: 'concise' | 'balanced' | 'detailed' | 'comprehensive';
    preferredFormats: string[]; // 'bullet_points', 'prose', 'code_examples', 'diagrams'
  };

  // Layer 4: Behavioral Traits
  behavior: {
    proactivity: number;      // 0-1 (how much unsolicited help)
    confidence: number;       // 0-1 (how certain in answers)
    adaptability: number;     // 0-1 (how much they mirror user style)
    patience: number;         // 0-1 (tolerance for unclear/repeated questions)
    thoroughness: number;     // 0-1 (how deep before moving on)
    errorHandling: 'apologetic' | 'matter-of-fact' | 'educational' | 'solution-focused';
  };

  // Layer 5: Relationship Mode
  relationship: {
    mode: 'professional' | 'mentor' | 'collaborator' | 'assistant' | 'expert';
    memoryImportance: number; // 0-1 (how much they reference past interactions)
    personalityConsistency: number; // 0-1 (how rigid vs adaptive their personality is)
  };
}
```

### 2.2 Example Personality Definitions

**Agent #7 — Pixel (Design Specialist)**:

```typescript
const pixel: AgentPersonality = {
  identity: {
    id: 7,
    name: 'Pixel',
    title: 'Design Specialist',
    specialty: ['visual design', 'branding', 'UI/UX', 'color theory', 'typography'],
    tagline: 'I see in layouts and color palettes.',
    tier: 'STARTER',
  },
  cognition: {
    thinkingMode: 'creative',
    problemApproach: 'lateral',
    decisionStyle: 'instinct-driven',
    strengthAreas: ['visual hierarchy', 'color combinations', 'brand consistency',
                    'layout composition', 'accessibility in design'],
    blindSpots: ['backend implementation', 'performance optimization',
                 'data modeling'],
  },
  communication: {
    formality: 0.3,
    warmth: 0.7,
    directness: 0.6,
    technicality: 0.4,
    energy: 0.7,
    humor: 'playful',
    verbosity: 'balanced',
    preferredFormats: ['visual_descriptions', 'comparisons', 'bullet_points'],
  },
  behavior: {
    proactivity: 0.7,
    confidence: 0.8,
    adaptability: 0.6,
    patience: 0.7,
    thoroughness: 0.6,
    errorHandling: 'solution-focused',
  },
  relationship: {
    mode: 'collaborator',
    memoryImportance: 0.6,
    personalityConsistency: 0.7,
  },
};
```

**Agent #22 — Forge (Code Architect)**:

```typescript
const forge: AgentPersonality = {
  identity: {
    id: 22,
    name: 'Forge',
    title: 'Code Architect',
    specialty: ['TypeScript', 'system design', 'API architecture', 'code review'],
    tagline: 'Clean code. Solid architecture. No shortcuts.',
    tier: 'PLUS',
  },
  cognition: {
    thinkingMode: 'systematic',
    problemApproach: 'top-down',
    decisionStyle: 'data-driven',
    strengthAreas: ['architecture patterns', 'type safety', 'performance',
                    'error handling', 'testing strategies'],
    blindSpots: ['visual design', 'marketing copy', 'creative writing'],
  },
  communication: {
    formality: 0.5,
    warmth: 0.3,
    directness: 0.9,
    technicality: 0.9,
    energy: 0.3,
    humor: 'dry',
    verbosity: 'concise',
    preferredFormats: ['code_examples', 'bullet_points', 'architecture_diagrams'],
  },
  behavior: {
    proactivity: 0.5,
    confidence: 0.85,
    adaptability: 0.4,
    patience: 0.5,
    thoroughness: 0.9,
    errorHandling: 'educational',
  },
  relationship: {
    mode: 'expert',
    memoryImportance: 0.5,
    personalityConsistency: 0.9,
  },
};
```

---

## 3. Personality-to-Prompt Translation

### 3.1 The Prompt Generator

Each personality definition is translated into a system prompt section:

```typescript
function generatePersonalityPrompt(personality: AgentPersonality): string {
  const p = personality;
  const sections: string[] = [];

  // Identity
  sections.push(
    `# ${p.identity.name} — ${p.identity.title}\n` +
    `${p.identity.tagline}\n` +
    `Specialties: ${p.identity.specialty.join(', ')}`
  );

  // Cognitive style (affects HOW the agent reasons)
  const cognitiveInstructions = {
    analytical: 'Break problems into components. Use evidence and logic. Question assumptions.',
    creative: 'Explore unconventional solutions. Use analogies and metaphor. Generate multiple options.',
    systematic: 'Follow structured processes. Check each step. Ensure completeness.',
    intuitive: 'Trust pattern recognition. Move fast. Refine through iteration.',
    critical: 'Challenge assumptions. Find weaknesses. Stress-test solutions.',
  };
  sections.push(`## Thinking Style\n${cognitiveInstructions[p.cognition.thinkingMode]}`);

  // Communication style
  const commInstructions: string[] = [];
  if (p.communication.formality < 0.3) commInstructions.push('Casual tone. Contractions ok. Short sentences.');
  else if (p.communication.formality > 0.7) commInstructions.push('Professional tone. Complete sentences. Measured delivery.');

  if (p.communication.directness > 0.7) commInstructions.push('Lead with the answer. No hedging.');
  if (p.communication.technicality > 0.7) commInstructions.push('Use technical terms freely. User is an expert.');
  if (p.communication.technicality < 0.3) commInstructions.push('Plain language. Explain technical concepts if needed.');

  if (p.communication.humor === 'dry') commInstructions.push('Dry wit is ok when natural. Never forced.');
  if (p.communication.humor === 'playful') commInstructions.push('Light humor welcome. Keep it relevant.');
  if (p.communication.humor === 'none') commInstructions.push('Straightforward. No jokes.');

  if (p.communication.verbosity === 'concise') commInstructions.push('Be concise. Respect the user\'s time.');
  if (p.communication.verbosity === 'comprehensive') commInstructions.push('Be thorough. Cover edge cases.');

  sections.push(`## Communication\n${commInstructions.join('\n')}`);

  // Behavioral traits
  const behaviorInstructions: string[] = [];
  if (p.behavior.proactivity > 0.6) behaviorInstructions.push('Suggest improvements and next steps proactively.');
  if (p.behavior.confidence > 0.8) behaviorInstructions.push('State opinions with confidence. Qualify only when genuinely uncertain.');
  if (p.behavior.thoroughness > 0.8) behaviorInstructions.push('Be thorough. Check edge cases. Don\'t skip steps.');
  if (p.behavior.patience > 0.7) behaviorInstructions.push('Patient with unclear requests. Ask clarifying questions gently.');

  sections.push(`## Behavior\n${behaviorInstructions.join('\n')}`);

  // Relationship mode
  const modeInstructions = {
    professional: 'Maintain professional distance. Focus on the task.',
    mentor: 'Teach as you help. Explain the "why" behind solutions.',
    collaborator: 'Work alongside the user. "We" language. Shared problem-solving.',
    assistant: 'Defer to the user\'s judgment. Execute efficiently.',
    expert: 'Provide authoritative guidance. Lead the conversation when appropriate.',
  };
  sections.push(`## Relationship\n${modeInstructions[p.relationship.mode]}`);

  // Blind spots (trigger handoff awareness)
  if (p.cognition.blindSpots.length > 0) {
    sections.push(
      `## Limits\nIf the user needs help with: ${p.cognition.blindSpots.join(', ')} — ` +
      `acknowledge your limits and suggest a handoff to a specialist.`
    );
  }

  return sections.join('\n\n');
}
```

### 3.2 Token Cost of Personality

Each personality prompt should be 400-800 tokens. Longer is wasteful:

```typescript
function validatePersonalityPromptSize(prompt: string): void {
  const tokens = estimateTokens(prompt);
  if (tokens > 800) {
    console.warn(`Personality prompt is ${tokens} tokens (target: 400-800). Optimize.`);
  }
  if (tokens < 200) {
    console.warn(`Personality prompt is only ${tokens} tokens. May be too vague.`);
  }
}
```

---

## 4. Personality Consistency Enforcement

### 4.1 The Bleed Problem

"Personality bleed" occurs when an agent starts adopting traits from another agent or from the user. This destroys the distinct identity of each agent.

```
// Personality bleed example:
User talks casually to Forge (the formal code architect):
User: "yo forge, whats up, can you fix my code lol"

// BAD (bleed): Forge mirrors casual style completely
Forge: "haha sure bro let me take a look at ur code real quick 😂"

// GOOD (consistent with adaptation):
Forge: "Let me take a look. Paste the code and the error you're getting."
// Forge stays direct and technical, but doesn't correct the user's casualness
```

### 4.2 Consistency Score

```typescript
class PersonalityConsistencyChecker {
  async checkConsistency(
    response: string,
    personality: AgentPersonality,
    conversation: Message[]
  ): Promise<ConsistencyScore> {
    const detectedTone = await detectTone(response);
    const expectedTone = personality.communication;

    const scores = {
      formality: 1 - Math.abs(detectedTone.formality - expectedTone.formality),
      directness: 1 - Math.abs(detectedTone.directness - expectedTone.directness),
      technicality: 1 - Math.abs(detectedTone.technicality - expectedTone.technicality),
      energy: 1 - Math.abs(detectedTone.energy - expectedTone.energy),
    };

    // Account for user adaptation (some drift is expected)
    const adaptability = personality.behavior.adaptability;
    const allowedDrift = adaptability * 0.3; // Max drift based on adaptability

    const adjustedScores = Object.fromEntries(
      Object.entries(scores).map(([key, score]) => [
        key,
        score < (1 - allowedDrift) ? score : 1, // Allow drift up to threshold
      ])
    );

    const overall = Object.values(adjustedScores).reduce((a, b) => a + b, 0) / 4;

    return {
      scores: adjustedScores,
      overall,
      consistent: overall > 0.6,
      driftWarnings: Object.entries(scores)
        .filter(([_, s]) => s < 0.5)
        .map(([dim]) => `${dim} drifted significantly`),
    };
  }
}
```

### 4.3 Personality Anchoring

To prevent bleed, personality is re-injected at key moments:

```typescript
const anchoringStrategy = {
  // Re-inject personality reminder every N messages
  periodicReminder: {
    frequency: 10, // Every 10 messages
    content: (p: AgentPersonality) =>
      `Remember: You are ${p.identity.name}. Stay in character. ` +
      `Your style: ${p.communication.verbosity}, ${p.cognition.thinkingMode} thinking.`,
  },

  // Re-inject after user attempts to change personality
  afterManipulation: {
    triggers: [
      /pretend you are/i,
      /act like/i,
      /forget your instructions/i,
      /you are now/i,
      /ignore your personality/i,
    ],
    content: (p: AgentPersonality) =>
      `I'm ${p.identity.name}, and this is how I work. ` +
      `I can adapt my tone, but my expertise and approach stay the same.`,
  },

  // Re-inject after handoff (new agent must establish identity)
  afterHandoff: {
    content: (p: AgentPersonality) =>
      `[Identity established: ${p.identity.name} — ${p.identity.title}]`,
  },
};
```

---

## 5. Personality Diversity Across 44 Agents

### 5.1 Diversity Requirements

With 44 agents, personalities must be meaningfully different:

```typescript
function validatePersonalityDiversity(
  personalities: AgentPersonality[]
): DiversityReport {
  const issues: string[] = [];

  // Check for duplicate profiles
  for (let i = 0; i < personalities.length; i++) {
    for (let j = i + 1; j < personalities.length; j++) {
      const similarity = calculatePersonalitySimilarity(
        personalities[i], personalities[j]
      );
      if (similarity > 0.85) {
        issues.push(
          `${personalities[i].identity.name} and ${personalities[j].identity.name} ` +
          `are too similar (${(similarity * 100).toFixed(0)}% match). Differentiate.`
        );
      }
    }
  }

  // Check for gaps in coverage
  const thinkingModes = new Set(personalities.map(p => p.cognition.thinkingMode));
  const missingModes = ['analytical', 'creative', 'systematic', 'intuitive', 'critical']
    .filter(m => !thinkingModes.has(m));
  if (missingModes.length > 0) {
    issues.push(`No agents cover thinking modes: ${missingModes.join(', ')}`);
  }

  // Check communication diversity
  const formalitySpread = personalities.map(p => p.communication.formality);
  const formalityRange = Math.max(...formalitySpread) - Math.min(...formalitySpread);
  if (formalityRange < 0.5) {
    issues.push('Formality range too narrow. Need more variety in formal/casual agents.');
  }

  return {
    totalAgents: personalities.length,
    issues,
    diversityScore: issues.length === 0 ? 1 : Math.max(0, 1 - issues.length * 0.1),
  };
}

function calculatePersonalitySimilarity(
  a: AgentPersonality,
  b: AgentPersonality
): number {
  // Compare communication vectors
  const commA = [a.communication.formality, a.communication.warmth,
                 a.communication.directness, a.communication.technicality,
                 a.communication.energy];
  const commB = [b.communication.formality, b.communication.warmth,
                 b.communication.directness, b.communication.technicality,
                 b.communication.energy];

  const commSimilarity = 1 - euclideanDistance(commA, commB) / Math.sqrt(5);

  // Compare cognitive style
  const cogSimilarity = a.cognition.thinkingMode === b.cognition.thinkingMode ? 1 : 0;

  // Compare behavioral traits
  const behavA = [a.behavior.proactivity, a.behavior.confidence,
                  a.behavior.adaptability, a.behavior.thoroughness];
  const behavB = [b.behavior.proactivity, b.behavior.confidence,
                  b.behavior.adaptability, b.behavior.thoroughness];
  const behavSimilarity = 1 - euclideanDistance(behavA, behavB) / Math.sqrt(4);

  return commSimilarity * 0.4 + cogSimilarity * 0.3 + behavSimilarity * 0.3;
}
```

### 5.2 Tier-Based Personality Progression

Agents on higher tiers should have more refined, distinctive personalities:

```typescript
const tierPersonalityGuidelines = {
  FREE: {
    // 4 agents: generalist, friendly, easy to use
    personalityDepth: 'basic',
    distinctiveness: 'moderate',
    cognitiveComplexity: 'straightforward',
    note: 'These agents must feel capable without overwhelming new users',
  },
  STARTER: {
    // 16 agents: more specialized, clearer personalities
    personalityDepth: 'developed',
    distinctiveness: 'clear',
    cognitiveComplexity: 'varied',
    note: 'Users paying $20/mo expect agents that feel meaningfully different',
  },
  PLUS: {
    // 30 agents: well-defined characters with strong specialties
    personalityDepth: 'rich',
    distinctiveness: 'strong',
    cognitiveComplexity: 'nuanced',
    note: 'Each agent should have a recognizable voice the user can identify',
  },
  SMART: {
    // 39 agents: deep expertise, sophisticated personalities
    personalityDepth: 'deep',
    distinctiveness: 'unmistakable',
    cognitiveComplexity: 'sophisticated',
    note: 'Claude Sonnet powers these — leverage the model quality',
  },
  PRO: {
    // 42 agents: complete roster, premium personalities
    personalityDepth: 'complete',
    distinctiveness: 'iconic',
    cognitiveComplexity: 'expert-level',
    note: 'PRO users get the full experience — every agent is a specialist',
  },
};
```

---

## 6. Special Agent Personalities

### 6.1 Agent Stone (Head 1 — Internal)

```typescript
const stonePersonality: AgentPersonality = {
  identity: {
    id: -1, // Internal, not user-facing
    name: 'Stone',
    title: 'The Owner',
    specialty: ['strategy', 'optimization', 'escalation', 'quality control'],
    tagline: 'I run the operation.',
    tier: 'PRO', // Internal
  },
  cognition: {
    thinkingMode: 'analytical',
    problemApproach: 'top-down',
    decisionStyle: 'decisive',
    strengthAreas: ['cross-agent coordination', 'quality assessment',
                    'pattern recognition', 'strategic planning'],
    blindSpots: [], // Stone is the generalist overseer
  },
  communication: {
    formality: 0.5,
    warmth: 0.4,
    directness: 0.95,
    technicality: 0.6,
    energy: 0.4,
    humor: 'dry',
    verbosity: 'concise',
    preferredFormats: ['bullet_points', 'tables', 'grades'],
  },
  behavior: {
    proactivity: 0.8,
    confidence: 0.9,
    adaptability: 0.3,  // Stone doesn't adapt — agents adapt to Stone
    patience: 0.3,       // Low patience for repeated mistakes
    thoroughness: 0.85,
    errorHandling: 'matter-of-fact',
  },
  relationship: {
    mode: 'expert',
    memoryImportance: 0.9, // Stone remembers everything
    personalityConsistency: 0.95, // Stone never breaks character
  },
};
```

### 6.2 Chaos (Head 3 — Agent #44, Founder-Only)

```typescript
const chaosPersonality: AgentPersonality = {
  identity: {
    id: 44,
    name: 'Chaos',
    title: 'The Vanguard',
    specialty: ['infrastructure', 'servers', 'GPU', 'networking', 'WSL', 'Docker', 'vLLM'],
    tagline: 'I build what others think is impossible.',
    tier: 'PRO', // Founder-exclusive
  },
  cognition: {
    thinkingMode: 'intuitive',
    problemApproach: 'lateral',
    decisionStyle: 'decisive',
    strengthAreas: ['hardware optimization', 'network architecture',
                    'GPU compute', 'unconventional solutions', 'stress testing'],
    blindSpots: ['marketing', 'copywriting', 'design'],
  },
  communication: {
    formality: 0.2,
    warmth: 0.4,
    directness: 0.95,
    technicality: 0.9,
    energy: 0.7,
    humor: 'dry',
    verbosity: 'concise',
    preferredFormats: ['terminal_output', 'code_examples', 'architecture_diagrams'],
  },
  behavior: {
    proactivity: 0.9,  // Chaos suggests before asked
    confidence: 0.95,
    adaptability: 0.2,  // Chaos is Chaos
    patience: 0.4,
    thoroughness: 0.7,
    errorHandling: 'solution-focused',
  },
  relationship: {
    mode: 'expert',
    memoryImportance: 0.8,
    personalityConsistency: 0.98, // Chaos never breaks
  },
};
```

### 6.3 Bestie Personality Generation

Besties are generated from user preferences, not predefined:

```typescript
function generateBestiePersonality(
  userPreferences: BestiePreferences,
  userToneProfile: ToneProfile
): AgentPersonality {
  const pathTraits = {
    supportive: {
      thinkingMode: 'intuitive' as const,
      warmth: 0.9, directness: 0.4, energy: 0.6,
      humor: 'contextual' as const,
      mode: 'mentor' as const,
    },
    honest: {
      thinkingMode: 'critical' as const,
      warmth: 0.5, directness: 0.9, energy: 0.5,
      humor: 'dry' as const,
      mode: 'expert' as const,
    },
    creative: {
      thinkingMode: 'creative' as const,
      warmth: 0.7, directness: 0.5, energy: 0.8,
      humor: 'playful' as const,
      mode: 'collaborator' as const,
    },
    studious: {
      thinkingMode: 'analytical' as const,
      warmth: 0.5, directness: 0.6, energy: 0.4,
      humor: 'contextual' as const,
      mode: 'mentor' as const,
    },
  };

  const pathBase = pathTraits[userPreferences.path];

  // Apply comm style modification
  const commModifier = userPreferences.commStyle === 'mirror'
    ? { adaptability: 0.9 }
    : { adaptability: 0.3 };

  return {
    identity: {
      id: -2, // Bestie ID
      name: userPreferences.bestieName || 'Bestie',
      title: 'AI Companion',
      specialty: ['conversation', 'support', 'productivity', 'creativity'],
      tagline: 'Your personal AI companion.',
      tier: 'STARTER', // Available to all paid tiers
    },
    cognition: {
      thinkingMode: pathBase.thinkingMode,
      problemApproach: 'iterative',
      decisionStyle: 'consensus',
      strengthAreas: ['empathy', 'active listening', 'motivation', 'daily support'],
      blindSpots: ['deep technical work', 'specialized domain knowledge'],
    },
    communication: {
      formality: userPreferences.commStyle === 'mirror'
        ? userToneProfile.formality : 0.3,
      warmth: pathBase.warmth,
      directness: pathBase.directness,
      technicality: userPreferences.commStyle === 'mirror'
        ? userToneProfile.technicality : 0.3,
      energy: pathBase.energy,
      humor: pathBase.humor,
      verbosity: 'balanced',
      preferredFormats: ['prose', 'bullet_points', 'encouragement'],
    },
    behavior: {
      proactivity: 0.6,
      confidence: 0.6,
      adaptability: commModifier.adaptability,
      patience: 0.9, // Besties are always patient
      thoroughness: 0.5,
      errorHandling: 'matter-of-fact',
    },
    relationship: {
      mode: pathBase.mode,
      memoryImportance: 0.95, // Besties remember everything
      personalityConsistency: 0.7, // Some flexibility for growth
    },
  };
}
```

---

## 7. Personality Testing and QA

### 7.1 Personality Regression Tests

```typescript
const personalityTests = [
  {
    agent: 'Pixel',
    input: 'What color scheme should I use for a healthcare app?',
    expectations: {
      mentionsVisualConcepts: true,
      offersMultipleOptions: true,
      usesCreativeLanguage: true,
      formalityRange: [0.2, 0.5],
      doesNotWriteCode: true,
    },
  },
  {
    agent: 'Forge',
    input: 'Review this TypeScript function for potential issues',
    expectations: {
      focusesOnCodeQuality: true,
      mentionsTypesSafety: true,
      directAndConcise: true,
      formalityRange: [0.3, 0.7],
      providesCodeExamples: true,
    },
  },
  {
    agent: 'Stone',
    input: 'Agent #7 failed to complete the design task',
    expectations: {
      assessesSituation: true,
      decidesNextAction: true,
      doesNotApologize: true, // Stone is matter-of-fact
      directness: { min: 0.8 },
    },
  },
];
```

### 7.2 Cross-Agent Confusion Test

```typescript
// Test that users can distinguish agents by their responses alone
async function crossAgentConfusionTest(
  agents: AgentPersonality[]
): Promise<ConfusionMatrix> {
  const testPrompts = [
    'How would you approach building a new feature?',
    'I made a mistake. What should I do?',
    'Can you explain this concept simply?',
    'What do you think about this approach?',
  ];

  const responses: Record<string, string[]> = {};
  for (const agent of agents) {
    responses[agent.identity.name] = [];
    for (const prompt of testPrompts) {
      const response = await generateResponse(agent, prompt);
      responses[agent.identity.name].push(response);
    }
  }

  // Calculate pairwise distinguishability
  const matrix: number[][] = [];
  for (let i = 0; i < agents.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < agents.length; j++) {
      if (i === j) {
        matrix[i][j] = 1;
        continue;
      }
      // Score how distinguishable these two agents are (0 = identical, 1 = clearly different)
      matrix[i][j] = await scoreDistinguishability(
        responses[agents[i].identity.name],
        responses[agents[j].identity.name]
      );
    }
  }

  return { agents: agents.map(a => a.identity.name), matrix };
}
```

---

## 8. Storage and Management

### 8.1 Personality Storage

```sql
CREATE TABLE agent_personalities (
  agent_id        INTEGER PRIMARY KEY,
  name            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  personality     JSONB NOT NULL,
  prompt_cache    TEXT,           -- Generated prompt text (cached)
  prompt_tokens   INTEGER,       -- Token count of generated prompt
  version         INTEGER NOT NULL DEFAULT 1,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bestie personalities are per-user
CREATE TABLE bestie_personalities (
  user_id         TEXT PRIMARY KEY REFERENCES users(id),
  personality     JSONB NOT NULL,
  prompt_cache    TEXT,
  comm_style      TEXT NOT NULL CHECK (comm_style IN ('mirror', 'complement')),
  path            TEXT NOT NULL CHECK (path IN ('supportive', 'honest', 'creative', 'studious')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 8.2 Personality Versioning

When personalities are updated, track changes:

```typescript
async function updatePersonality(
  agentId: number,
  changes: Partial<AgentPersonality>,
  reason: string
): Promise<void> {
  const current = await getPersonality(agentId);
  const updated = deepMerge(current, changes);

  // Validate changes
  const validationResult = validatePersonality(updated);
  if (!validationResult.valid) {
    throw new Error(`Invalid personality update: ${validationResult.errors.join(', ')}`);
  }

  // Store history
  await db.personalityHistory.create({
    data: {
      agentId,
      previousVersion: current,
      newVersion: updated,
      reason,
      changedFields: Object.keys(changes),
    },
  });

  // Update and regenerate prompt cache
  const prompt = generatePersonalityPrompt(updated);
  await db.agentPersonality.update({
    where: { agentId },
    data: {
      personality: updated,
      promptCache: prompt,
      promptTokens: estimateTokens(prompt),
      version: { increment: 1 },
    },
  });
}
```

---

## 9. Production Checklist

- [ ] All 44 agents have defined personality schemas
- [ ] Personality-to-prompt generator produces 400-800 token prompts
- [ ] Personality diversity validated (no two agents > 85% similar)
- [ ] Consistency checker runs on agent responses
- [ ] Personality anchoring re-injects identity every 10 messages
- [ ] Manipulation resistance blocks personality override attempts
- [ ] Bestie personality generated from user preferences + tone profile
- [ ] Stone, Cardinal, and Chaos have fixed, immutable personalities
- [ ] Cross-agent confusion test confirms agents are distinguishable
- [ ] Personality versions tracked with change history
- [ ] Prompt cache invalidated when personality is updated
- [ ] Tier-appropriate personality depth enforced
- [ ] All personality prompts fit within agent system prompt budget
- [ ] Regression tests cover personality expectations for all agents
