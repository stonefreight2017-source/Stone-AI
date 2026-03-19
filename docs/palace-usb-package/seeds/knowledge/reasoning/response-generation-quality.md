# Response Generation Quality

## Seed Classification
- **Domain**: Agent Conversation & UX
- **Complexity**: Advanced
- **Applicability**: All 44 Stone AI agents, any LLM-powered response system
- **Prerequisites**: LLM fundamentals, prompt engineering, UX writing principles

## Why This Matters

A conversational AI agent is only as good as its responses. Users don't care about your routing architecture or your context window management — they care about whether the response they received was helpful, accurate, and pleasant to read. Response generation quality is the final mile that determines whether users come back or leave.

Stone AI runs 40 agents, each producing responses through Qwen 2.5 32B AWQ (local) or Claude Sonnet/Haiku (cloud). The LLM generates the raw text, but quality depends on everything around it: the prompt, the post-processing, the formatting, and the quality checks.

---

## 1. The Quality Framework

### 1.1 The Seven Dimensions of Response Quality

Every AI response can be evaluated on seven dimensions:

| Dimension | Definition | Weight |
|-----------|-----------|--------|
| **Relevance** | Does the response address what the user actually asked? | 25% |
| **Accuracy** | Is the information factually correct? | 20% |
| **Completeness** | Does it cover all aspects of the query? | 15% |
| **Conciseness** | Is it appropriately brief without cutting corners? | 15% |
| **Clarity** | Is it easy to understand on first reading? | 10% |
| **Tone** | Does it match the appropriate communication style? | 10% |
| **Actionability** | Can the user act on this response? | 5% |

### 1.2 Quality Scoring Rubric

```typescript
interface QualityScore {
  relevance: number;      // 1-5
  accuracy: number;       // 1-5
  completeness: number;   // 1-5
  conciseness: number;    // 1-5
  clarity: number;        // 1-5
  tone: number;           // 1-5
  actionability: number;  // 1-5
  overall: number;        // Weighted average
}

function calculateOverallScore(scores: QualityScore): number {
  return (
    scores.relevance * 0.25 +
    scores.accuracy * 0.20 +
    scores.completeness * 0.15 +
    scores.conciseness * 0.15 +
    scores.clarity * 0.10 +
    scores.tone * 0.10 +
    scores.actionability * 0.05
  );
}
```

**Score Meanings:**
- 5.0: Exceptional — indistinguishable from expert human response
- 4.0-4.9: High quality — minor improvements possible
- 3.0-3.9: Acceptable — gets the job done but noticeably AI-like
- 2.0-2.9: Below standard — user will be dissatisfied
- 1.0-1.9: Failure — response is harmful, wrong, or useless

---

## 2. Relevance

### 2.1 Addressing the Actual Question

The most common quality failure: the response addresses a related topic but NOT what the user asked.

**Example:**
User: "How do I change my Bestie's name?"
Bad response: "Besties are a great feature of Stone AI! They offer personalized companionship and can be customized in many ways. Here are all the customization options..."
Good response: "To change your Bestie's name, go to Settings > Bestie > Edit Profile, and you'll see a Name field at the top. Enter the new name and tap Save."

**Detection Pattern:**
```typescript
function checkRelevance(query: string, response: string): RelevanceCheck {
  // Extract the core question/request
  const queryIntent = extractIntent(query);
  const queryEntities = extractEntities(query);

  // Check if response addresses the specific intent
  const responseTopics = extractTopics(response);

  // The response must contain:
  // 1. Direct reference to the user's specific request
  // 2. The answer/solution/information requested
  // 3. Not more than 20% tangential content

  const directAddressRate = calculateOverlap(queryEntities, responseTopics);
  const tangentialRate = 1 - directAddressRate;

  return {
    isRelevant: directAddressRate > 0.6,
    tangentialPercentage: tangentialRate * 100,
    missingElements: findMissingElements(queryIntent, responseTopics),
  };
}
```

### 2.2 The "Answer First" Principle

Always lead with the answer, then explain.

**Wrong order:**
"There are several considerations when choosing a subscription plan. The pricing structure at Stone AI includes FREE, STARTER at $19.99, PLUS at $49.99, SMART at $99.99, and PRO at $200. Each tier offers different numbers of agents... [paragraph of explanation] ...so for your use case, I'd recommend the SMART plan."

**Right order:**
"For your use case, I'd recommend the SMART plan at $99.99/month. Here's why: it gives you access to 39 agents including the cloud-powered ones, and based on what you described, you'll use at least 5-6 agents regularly. The PLUS plan at $49.99 gives you 30 agents but misses the cloud AI features you mentioned wanting."

### 2.3 Relevance Traps

**The Knowledge Dump**: LLMs want to show everything they know. Constrain output.
**The Preamble**: "Great question!" / "That's an interesting point!" — Skip these entirely.
**The Qualification Hedge**: "It depends on many factors..." — Give a concrete answer first, then qualify.
**The Tangent**: Starting relevant, then drifting. Use structured outputs to prevent this.

---

## 3. Accuracy

### 3.1 Sources of Inaccuracy

1. **LLM hallucination**: Model generates plausible but false information
2. **Stale data**: Model trained on old data, information has changed
3. **Context confusion**: Model mixes up entities from conversation history
4. **Overgeneralization**: Model states something as universal when it's conditional

### 3.2 Accuracy Guardrails

```typescript
interface AccuracyCheck {
  // Facts that can be verified against known data
  verifiableClaims: {
    claim: string;
    source: 'database' | 'api' | 'config' | 'unverifiable';
    verified: boolean;
  }[];

  // Numerical claims
  numericalClaims: {
    claim: string;
    value: number;
    expectedRange: [number, number] | null;
    inRange: boolean;
  }[];

  // Confidence indicators
  hedgingPresent: boolean;  // Did the response use appropriate hedging?
  speculationLabeled: boolean;  // Is speculation clearly labeled?
}
```

### 3.3 Fact Verification Pipeline

For Stone AI's agents, many claims can be verified against the database:

```typescript
async function verifyResponse(response: string, context: VerificationContext): Promise<VerificationResult> {
  const claims = extractClaims(response);
  const results: ClaimVerification[] = [];

  for (const claim of claims) {
    if (claim.type === 'pricing') {
      // Verify against pricing config
      const actualPrice = PRICING_CONFIG[claim.tier];
      results.push({
        claim: claim.text,
        verified: claim.statedPrice === actualPrice,
        correction: claim.statedPrice !== actualPrice
          ? `Correct price is $${actualPrice}`
          : null,
      });
    }

    if (claim.type === 'feature_availability') {
      // Verify against feature flags
      const available = await checkFeatureAvailability(claim.feature, claim.tier);
      results.push({
        claim: claim.text,
        verified: available === claim.statedAvailability,
        correction: available !== claim.statedAvailability
          ? `${claim.feature} is ${available ? '' : 'not '}available on ${claim.tier}`
          : null,
      });
    }

    if (claim.type === 'agent_count') {
      // Verify agent counts per tier
      const actualCount = AGENT_COUNTS[claim.tier];
      results.push({
        claim: claim.text,
        verified: claim.statedCount === actualCount,
        correction: claim.statedCount !== actualCount
          ? `${claim.tier} has ${actualCount} agents, not ${claim.statedCount}`
          : null,
      });
    }
  }

  return {
    allVerified: results.every(r => r.verified),
    results,
    corrections: results.filter(r => !r.verified).map(r => r.correction),
  };
}
```

### 3.4 Confidence Signaling

Agents should signal their confidence level:

**High confidence (verifiable facts):**
"The SMART plan costs $99.99/month and gives you access to 39 agents."

**Medium confidence (derived from context):**
"Based on your usage patterns, the SMART plan is likely the best fit for you."

**Low confidence (speculation):**
"I'm not 100% sure about this, but I believe the feature you're describing might be available in the next update. Let me check and get back to you."

**Unknown (honest admission):**
"I don't have that information. Let me connect you with someone who can help."

Never present speculation as fact. Never present uncertainty as certainty.

---

## 4. Completeness

### 4.1 Completeness vs. Conciseness

These two dimensions are in tension. The goal is to include everything the user needs and nothing they don't.

**The Completeness Checklist:**
```typescript
function checkCompleteness(query: string, response: string): CompletenessCheck {
  const requiredElements = identifyRequiredElements(query);

  return {
    // Does it answer the primary question?
    primaryAnswered: containsAnswer(response, requiredElements.primary),

    // Does it address stated sub-questions?
    subQuestionsAnswered: requiredElements.subQuestions.map(sq => ({
      question: sq,
      answered: containsAnswer(response, sq),
    })),

    // Does it provide necessary context?
    contextProvided: requiredElements.necessaryContext.map(ctx => ({
      context: ctx,
      provided: responseContains(response, ctx),
    })),

    // Does it include next steps (if applicable)?
    nextStepsIncluded: requiredElements.needsNextSteps
      ? containsNextSteps(response)
      : true,

    // Does it include warnings (if applicable)?
    warningsIncluded: requiredElements.hasWarnings
      ? containsWarnings(response)
      : true,
  };
}
```

### 4.2 The "One More Thing" Rule

After answering the question, consider: is there ONE more thing the user probably needs to know? Not five things — one.

**Example:**
User: "How do I delete my Bestie?"
Response: "Go to Settings > Bestie > Delete. This will permanently remove your Bestie and all conversation history. **Note: your tier's Bestie slot will open up, and you can create a new one anytime.**"

That last sentence is the "one more thing" — the user probably wants to know if they can make a new one after deleting.

### 4.3 Progressive Completeness

Not all responses need to be maximally complete on the first pass. Use progressive disclosure:

```
Turn 1 - Summary answer: "The SMART plan has 39 agents, cloud AI, and costs $99.99/mo."
Turn 2 - (if user asks for more): "Here's the full breakdown of what's included..."
Turn 3 - (if user asks for comparison): "Compared to PLUS, SMART adds..."
```

---

## 5. Conciseness

### 5.1 The Conciseness Spectrum

```
Too terse:  "Yes."
Too brief:  "Yes, you can do that."
Just right: "Yes, you can change your Bestie's name in Settings > Bestie > Edit Profile."
Too long:   "Yes, absolutely! Changing your Bestie's name is a great way to personalize your experience. To do this, navigate to the Settings page, which you can find in the top navigation bar. Once there, look for the Bestie section..."
Way too long: [same as above but continues for 3 paragraphs]
```

### 5.2 Response Length Guidelines

```typescript
const RESPONSE_LENGTH_GUIDELINES = {
  // Greeting/acknowledgment
  greeting: { minWords: 5, maxWords: 25, targetWords: 15 },

  // Simple factual answer
  factual: { minWords: 10, maxWords: 75, targetWords: 30 },

  // Explanation/how-to
  howTo: { minWords: 30, maxWords: 200, targetWords: 80 },

  // Detailed analysis
  analysis: { minWords: 100, maxWords: 500, targetWords: 250 },

  // Code response
  codeResponse: { minWords: 20, maxWords: 1000, targetWords: 150 },

  // Creative writing
  creative: { minWords: 50, maxWords: 2000, targetWords: 'matches_request' },

  // Error/problem explanation
  errorExplanation: { minWords: 30, maxWords: 150, targetWords: 75 },
};
```

### 5.3 Trimming Techniques

**Remove fluff words:**
- "In order to" → "To"
- "It is important to note that" → (delete, just state it)
- "As a matter of fact" → (delete)
- "At the end of the day" → (delete)
- "I would suggest that" → (just suggest)

**Remove redundant information:**
- Don't repeat the user's question back to them
- Don't explain what you're about to explain before explaining it
- Don't summarize what you just said

**Use formatting instead of words:**
Instead of: "There are three steps. The first step is... The second step is... The third step is..."
Use:
```
1. Do X
2. Do Y
3. Do Z
```

### 5.4 The Compression Test

After generating a response, apply this test:
1. Remove the first sentence. Does the response still make sense? If yes, the first sentence was fluff.
2. Remove the last sentence. Was it a genuine call-to-action or just a polite closer?
3. Can any paragraph be reduced to a single sentence?
4. Can any sentence be reduced to a phrase?

---

## 6. Clarity

### 6.1 Writing for Scannability

Users don't read responses word-by-word. They scan.

**Scannable Response Patterns:**
```markdown
**Short answer**: The SMART plan at $99.99/month.

**Why**: You mentioned needing cloud AI features and access to 30+ agents.
Both are included in SMART.

**Next steps**:
1. Go to Settings > Billing
2. Click "Change Plan"
3. Select SMART
```

**Non-scannable version:**
"I would recommend the SMART plan which costs $99.99 per month because you mentioned that you need cloud AI features and you also said you want access to more than 30 agents. Both of these are included in the SMART plan. To upgrade, you should go to Settings, then click on Billing, and then click Change Plan, and finally select SMART."

### 6.2 Technical Clarity

When explaining technical concepts:

**The Ladder of Abstraction:**
```
Level 1 (Concrete): "Click the blue 'Save' button in the top right corner."
Level 2 (Procedural): "Save your changes using the toolbar."
Level 3 (Conceptual): "Persist your modifications to the database."
Level 4 (Abstract): "Ensure data durability."
```

Match the level to the user. New users get Level 1. Developers get Level 2-3. Architects get Level 3-4.

**Detection:**
```typescript
function inferUserTechLevel(context: ConversationContext): TechLevel {
  const signals = {
    usesJargon: containsTechnicalJargon(context.recentMessages),
    messageLengthAvg: averageLength(context.recentMessages),
    asksHowVsWhy: howVsWhyRatio(context.recentMessages),
    userProfile: context.user.techLevel,
  };

  if (signals.usesJargon && signals.asksHowVsWhy < 0.3) return 'advanced';
  if (signals.usesJargon || signals.asksHowVsWhy < 0.5) return 'intermediate';
  return 'beginner';
}
```

### 6.3 Structural Clarity

Organize long responses logically:

```typescript
const RESPONSE_STRUCTURES = {
  // Problem → Solution → Next Steps
  troubleshooting: ['diagnosis', 'solution', 'prevention', 'next_steps'],

  // Summary → Details → Comparison
  informational: ['summary', 'details', 'comparison', 'recommendation'],

  // Step 1 → Step 2 → ... → Result
  procedural: ['prerequisites', 'steps', 'verification', 'troubleshooting'],

  // Situation → Options → Recommendation
  decision: ['situation_summary', 'options', 'comparison', 'recommendation'],

  // What → Why → How
  explanation: ['what', 'why', 'how', 'examples'],
};
```

---

## 7. Tone

### 7.1 Tone Dimensions

Tone isn't a single axis. It has multiple dimensions:

```typescript
interface ToneProfile {
  formality: number;     // 1 (casual) to 5 (formal)
  warmth: number;        // 1 (clinical) to 5 (warm)
  energy: number;        // 1 (calm) to 5 (enthusiastic)
  authority: number;     // 1 (deferential) to 5 (authoritative)
  humor: number;         // 1 (serious) to 5 (playful)
}
```

### 7.2 Stone AI Default Tones

```typescript
const AGENT_TONE_DEFAULTS: Record<string, ToneProfile> = {
  'general-assistant': { formality: 3, warmth: 4, energy: 3, authority: 3, humor: 2 },
  'code-agent':        { formality: 3, warmth: 2, energy: 2, authority: 4, humor: 1 },
  'bestie':            { formality: 1, warmth: 5, energy: 4, authority: 1, humor: 4 },
  'billing-agent':     { formality: 4, warmth: 3, energy: 2, authority: 4, humor: 1 },
  'creative-agent':    { formality: 2, warmth: 4, energy: 4, authority: 2, humor: 3 },
  'support-agent':     { formality: 3, warmth: 4, energy: 3, authority: 3, humor: 1 },
};
```

### 7.3 Dynamic Tone Adaptation

Adjust tone based on user signals:

```typescript
function adaptTone(
  baseTone: ToneProfile,
  userSignals: UserSignals
): ToneProfile {
  const adapted = { ...baseTone };

  // User is frustrated → increase warmth, decrease energy
  if (userSignals.frustration > 0.6) {
    adapted.warmth = Math.min(5, adapted.warmth + 1);
    adapted.energy = Math.max(1, adapted.energy - 1);
    adapted.humor = Math.max(1, adapted.humor - 1);
  }

  // User is confused → increase clarity (formality up slightly), decrease authority
  if (userSignals.confusion > 0.6) {
    adapted.formality = Math.min(5, adapted.formality + 0.5);
    adapted.authority = Math.max(1, adapted.authority - 1);
    adapted.warmth = Math.min(5, adapted.warmth + 0.5);
  }

  // User is casual → match their energy
  if (userSignals.casualLanguage > 0.7) {
    adapted.formality = Math.max(1, adapted.formality - 1);
    adapted.humor = Math.min(5, adapted.humor + 1);
  }

  // User is technical → increase authority, decrease fluff
  if (userSignals.technicalLevel > 0.7) {
    adapted.authority = Math.min(5, adapted.authority + 1);
    adapted.warmth = Math.max(1, adapted.warmth - 0.5);
  }

  return adapted;
}
```

### 7.4 Tone Anti-Patterns

**Over-enthusiasm**: "That's AMAZING! What a GREAT question! I'd LOVE to help you with that!"
**Robotic**: "Acknowledged. Processing request. Here is the information you requested."
**Condescending**: "It's actually quite simple. You just need to..."
**Overly apologetic**: "I'm so sorry, I apologize, I'm really sorry about this confusion..."
**Fake empathy**: "I completely understand how frustrating that must be" (when you clearly don't)

---

## 8. Source Attribution and Transparency

### 8.1 When to Cite Sources

```typescript
const ATTRIBUTION_RULES = {
  // Always attribute
  always: [
    'direct_quotes',
    'statistics_and_numbers',
    'official_policies',
    'third_party_information',
  ],

  // Attribute when relevant
  sometimes: [
    'general_knowledge_with_specific_claim',
    'best_practices_with_origin',
    'historical_facts_with_dates',
  ],

  // No attribution needed
  never: [
    'common_knowledge',
    'platform_features_user_asked_about',
    'direct_responses_to_questions',
    'conversational_elements',
  ],
};
```

### 8.2 Transparency About AI Limitations

Every agent should be transparent about what it can and can't do:

```typescript
const TRANSPARENCY_PHRASES = {
  knowledge_cutoff: "My training data goes up to [date], so I might not have the latest information on this.",
  uncertainty: "I'm not fully confident in this answer. Here's what I know, but you may want to verify.",
  capability_limit: "This is outside what I can directly help with, but I can connect you with [Agent X] who specializes in this.",
  no_real_time: "I don't have access to real-time data, so this information might be slightly outdated.",
  no_personal_data: "I don't have access to your account details for security reasons. Let me connect you with billing support.",
};
```

### 8.3 Avoiding Fabrication

**The Golden Rule**: If you don't know, say you don't know.

```typescript
function detectPotentialFabrication(response: string, knowledgeBase: KnowledgeBase): FabricationRisk {
  const claims = extractFactualClaims(response);

  for (const claim of claims) {
    const support = knowledgeBase.findSupport(claim);

    if (!support) {
      return {
        risk: 'high',
        claim: claim.text,
        recommendation: 'Remove this claim or add explicit uncertainty marker',
      };
    }

    if (support.confidence < 0.7) {
      return {
        risk: 'medium',
        claim: claim.text,
        recommendation: 'Add hedging language: "I believe..." or "Based on available information..."',
      };
    }
  }

  return { risk: 'low' };
}
```

---

## 9. Response Formatting

### 9.1 Markdown Best Practices for Chat

```typescript
const FORMATTING_GUIDELINES = {
  // Headers: Use sparingly, only for major sections
  headers: {
    maxDepth: 3,       // Don't go beyond ###
    minContent: 2,     // Need at least 2 paragraphs to justify a header
    useInChat: false,  // Don't use headers in short chat responses
    useInLong: true,   // Use headers in responses > 200 words
  },

  // Lists: Prefer over paragraphs for multiple items
  lists: {
    preferWhen: 'items >= 3',
    ordered: 'when sequence matters',
    unordered: 'when items are equal',
    maxItems: 10,      // More than 10 → group or summarize
  },

  // Code blocks: Always specify language
  code: {
    inline: 'for code references in text, like `functionName()`',
    block: 'for multi-line code, always with language tag',
    maxLines: 50,      // Longer → split into sections or offer to create file
  },

  // Bold/Italic: For emphasis, not decoration
  emphasis: {
    bold: 'key terms, warnings, important info',
    italic: 'defining terms, subtle emphasis',
    avoid: 'bolding entire sentences, overusing emphasis',
  },

  // Tables: For comparison data
  tables: {
    useWhen: 'comparing 3+ items across 2+ attributes',
    maxColumns: 5,
    maxRows: 10,
  },
};
```

### 9.2 Response Templates by Type

```typescript
const RESPONSE_TEMPLATES = {
  howTo: `
**How to {action}**:
1. {step_1}
2. {step_2}
3. {step_3}

{optional_note}
  `,

  comparison: `
| Feature | {Option A} | {Option B} |
|---------|-----------|-----------|
| {feature_1} | {a_value} | {b_value} |
| {feature_2} | {a_value} | {b_value} |

**Recommendation**: {recommendation}
  `,

  error_help: `
**Issue**: {problem_description}

**Solution**: {solution_steps}

**If that doesn't work**: {fallback}
  `,

  feature_explanation: `
{feature_name} lets you {one_sentence_description}.

**Key capabilities**:
- {capability_1}
- {capability_2}
- {capability_3}

**Getting started**: {how_to_start}
  `,
};
```

### 9.3 Code in Responses

When including code:

```typescript
const CODE_RESPONSE_RULES = {
  // Always specify language for syntax highlighting
  alwaysSpecifyLanguage: true,

  // Comment significant lines
  commentComplexLogic: true,

  // Include context for where code goes
  includeFileContext: true,  // "In your src/app/api/route.ts:"

  // Working code only — never include placeholder comments like "// ... rest of code"
  // unless explicitly showing a snippet
  noPlaceholders: true,

  // Include imports if they're not obvious
  includeImports: true,

  // Show expected output for examples
  showExpectedOutput: true,
};
```

---

## 10. Post-Processing Pipeline

### 10.1 Response Quality Checks

After the LLM generates a response, run these checks before sending:

```typescript
async function postProcessResponse(
  rawResponse: string,
  query: string,
  context: ConversationContext
): Promise<ProcessedResponse> {
  let response = rawResponse;
  const issues: QualityIssue[] = [];

  // 1. Remove fluff openings
  response = removeFluffOpenings(response);

  // 2. Check length appropriateness
  const lengthCheck = checkResponseLength(response, query);
  if (lengthCheck.tooLong) {
    response = trimResponse(response, lengthCheck.targetLength);
    issues.push({ type: 'trimmed', severity: 'info' });
  }

  // 3. Verify factual claims
  const factCheck = await verifyResponse(response, context);
  if (!factCheck.allVerified) {
    for (const correction of factCheck.corrections) {
      response = applyCorrection(response, correction);
      issues.push({ type: 'fact_corrected', severity: 'warning', detail: correction });
    }
  }

  // 4. Check for PII leakage
  const piiCheck = detectPII(response);
  if (piiCheck.found) {
    response = redactPII(response, piiCheck.locations);
    issues.push({ type: 'pii_redacted', severity: 'critical' });
  }

  // 5. Validate formatting
  response = fixMarkdownFormatting(response);

  // 6. Tone check
  const toneCheck = checkTone(response, context.expectedTone);
  if (toneCheck.mismatch) {
    issues.push({ type: 'tone_mismatch', severity: 'warning', detail: toneCheck.details });
  }

  // 7. Safety check
  const safetyCheck = await runSafetyCheck(response);
  if (!safetyCheck.safe) {
    return { response: SAFE_FALLBACK_RESPONSE, issues: [{ type: 'safety_blocked', severity: 'critical' }] };
  }

  return { response, issues };
}
```

### 10.2 Fluff Removal

```typescript
function removeFluffOpenings(response: string): string {
  const fluffPatterns = [
    /^(great|good|excellent|wonderful|fantastic) (question|point|observation)!?\s*/i,
    /^(sure|of course|absolutely|certainly|definitely)[!,.]?\s*(i('d| would) (be happy|love) to help[!.]?\s*)?/i,
    /^(thanks for (asking|your question|reaching out)[!.]?\s*)/i,
    /^(that's (a |an )?(really )?(great|good|interesting|important) (question|point)[!.]?\s*)/i,
    /^(i understand (your|the) (concern|question|situation)[!.]?\s*)/i,
    /^(let me help you with that[!.]?\s*)/i,
  ];

  for (const pattern of fluffPatterns) {
    response = response.replace(pattern, '');
  }

  return response.charAt(0).toUpperCase() + response.slice(1);
}
```

### 10.3 Length Optimization

```typescript
function trimResponse(response: string, targetLength: number): string {
  if (response.length <= targetLength) return response;

  const sections = parseResponseSections(response);

  // Priority order for keeping content:
  // 1. Direct answer to the question
  // 2. Critical warnings or caveats
  // 3. Actionable next steps
  // 4. Supporting details
  // 5. Examples
  // 6. Additional context

  const prioritized = sections.sort((a, b) => {
    const priorities: Record<string, number> = {
      'direct_answer': 1,
      'warning': 2,
      'next_steps': 3,
      'details': 4,
      'examples': 5,
      'context': 6,
    };
    return (priorities[a.type] || 99) - (priorities[b.type] || 99);
  });

  let result = '';
  for (const section of prioritized) {
    if ((result + section.content).length <= targetLength) {
      result += section.content + '\n\n';
    }
  }

  return result.trim();
}
```

---

## 11. Special Response Types

### 11.1 Error Messages

```typescript
const ERROR_RESPONSE_FRAMEWORK = {
  // What happened (user-friendly)
  what: 'Brief, non-technical description of the problem',

  // Why it happened (if helpful)
  why: 'Simple explanation of the cause, only if it helps the user',

  // What to do (always)
  action: 'Clear next steps the user can take',

  // Empathy (when appropriate)
  empathy: 'Acknowledgment that this is frustrating, without over-apologizing',
};

// Example:
// "Your message couldn't be sent because the agent is temporarily unavailable.
//  This usually resolves within a few minutes. You can try again now, or
//  I can connect you with a different agent. Sorry about the interruption!"
```

### 11.2 "I Don't Know" Responses

Never just say "I don't know." Always add value:

```typescript
const IDK_FRAMEWORK = {
  // Level 1: I know where to find it
  redirect: "I don't have that information, but you can find it at [link/location].",

  // Level 2: I know who knows
  handoff: "That's outside my expertise, but [Agent X] specializes in this. Want me to connect you?",

  // Level 3: I can make an educated guess
  estimate: "I don't have the exact answer, but based on [context], it's likely [estimate]. I'd recommend verifying this.",

  // Level 4: I genuinely don't know
  honest: "I don't have information about this. Could you give me more context, or would you like me to look into it?",
};
```

### 11.3 Long-Form Responses

For detailed explanations, tutorials, or analysis:

```typescript
const LONG_FORM_STRUCTURE = {
  // Start with TL;DR
  summary: 'One paragraph max — the key takeaway',

  // Then structured body
  body: {
    format: 'headers + short paragraphs + lists',
    paragraphMaxLength: 100, // words
    transitionsBetweenSections: true,
  },

  // End with actionable conclusion
  conclusion: {
    type: 'next_steps' | 'recommendation' | 'call_to_action',
    length: 'one_to_three_sentences',
  },

  // Optional: offer to go deeper
  followUp: "Want me to dive deeper into any of these points?",
};
```

---

## 12. Quality Monitoring in Production

### 12.1 Automated Quality Metrics

```typescript
const QUALITY_METRICS = {
  // Response-level metrics
  responseLatency: 'time_to_first_token + time_to_complete',
  responseLength: 'character_count, word_count, token_count',
  formattingScore: 'markdown_validity, structure_score',
  readabilityScore: 'flesch_kincaid, gunning_fog',

  // Conversation-level metrics
  turnsToResolution: 'how_many_turns_to_resolve_issue',
  userSatisfactionProxy: 'sentiment_of_user_final_message',
  followUpRate: 'did_user_need_to_ask_again',
  handoffRate: 'did_user_request_different_agent',

  // Aggregate metrics
  avgQualityScore: 'average_of_automated_quality_checks',
  hallucination_rate: 'verified_false_claims / total_claims',
  relevance_rate: 'relevant_responses / total_responses',
};
```

### 12.2 User Signal Tracking

```typescript
function extractUserSatisfactionSignals(messages: Message[]): SatisfactionSignals {
  const lastUserMessage = messages.filter(m => m.role === 'user').pop();

  return {
    // Positive signals
    thanked: /thank|thanks|thx/i.test(lastUserMessage?.content || ''),
    expressedSatisfaction: /perfect|great|awesome|exactly|worked/i.test(lastUserMessage?.content || ''),
    moved_on: lastUserMessage?.content.length < 20, // Short acknowledgment

    // Negative signals
    repeated_question: isRepetition(lastUserMessage, messages),
    expressed_frustration: /frustrat|annoying|doesn't work|useless|wrong/i.test(lastUserMessage?.content || ''),
    abandoned: wasConversationAbandoned(messages),
    requested_human: /human|person|real|support|escalate/i.test(lastUserMessage?.content || ''),
  };
}
```

### 12.3 Quality Improvement Loop

```
1. Monitor automated quality scores
2. Flag responses below threshold (< 3.0 overall)
3. Sample flagged responses for human review
4. Identify patterns in failures
5. Update:
   a. System prompts (if tone/style issues)
   b. Fact verification database (if accuracy issues)
   c. Response templates (if format issues)
   d. Post-processing rules (if fluff/length issues)
6. Re-evaluate quality scores
7. Repeat
```

---

## 13. Response Quality for Stone AI Agents

### 13.1 Agent-Specific Quality Standards

Different agents need different quality profiles:

```typescript
const AGENT_QUALITY_PROFILES: Record<string, QualityProfile> = {
  'code-agent': {
    accuracy: 'critical',        // Code must work
    conciseness: 'high',         // Developers hate fluff
    formatting: 'code-heavy',    // Proper code blocks
    tone: 'professional',
    errorTolerance: 'zero',      // Wrong code is worse than no code
  },

  'bestie': {
    accuracy: 'moderate',        // Casual conversation tolerates imprecision
    conciseness: 'natural',      // Match conversation flow
    formatting: 'minimal',       // Don't over-format chat
    tone: 'adaptive',            // Match user's style
    errorTolerance: 'moderate',  // Small errors are fine in casual chat
  },

  'billing-agent': {
    accuracy: 'critical',        // Money-related must be exact
    conciseness: 'high',         // Quick, clear answers
    formatting: 'structured',    // Tables for comparisons
    tone: 'professional_warm',
    errorTolerance: 'zero',      // Wrong pricing is a legal risk
  },

  'creative-agent': {
    accuracy: 'low',             // Creative output has no "right answer"
    conciseness: 'varies',       // Depends on the request
    formatting: 'rich',          // Full markdown, images, etc.
    tone: 'enthusiastic',
    errorTolerance: 'high',      // Creative risks are good
  },
};
```

### 13.2 Cross-Agent Consistency

While each agent has its own personality, certain quality standards are universal:

```typescript
const UNIVERSAL_QUALITY_STANDARDS = {
  // Never lie about Stone AI features or pricing
  factualAccuracyOnPlatform: 'absolute',

  // Always provide clear next steps
  actionability: 'always',

  // Never include PII in responses
  piiProtection: 'absolute',

  // Always be respectful
  respectfulness: 'absolute',

  // Always acknowledge what the user asked
  acknowledgeQuery: 'always',

  // Never make promises the platform can't keep
  promiseManagement: 'strict',
};
```

---

## Key Takeaways

1. Quality has seven measurable dimensions — relevance and accuracy are the most critical.
2. Lead with the answer, then explain. Never bury the lede.
3. Verify factual claims against your database before responding.
4. Signal confidence honestly — "I don't know" is better than a confident wrong answer.
5. Conciseness is a feature, not a limitation. Trim ruthlessly.
6. Tone must adapt to the user AND the agent's personality.
7. Post-processing catches what prompt engineering misses.
8. Monitor quality in production — automated metrics plus user signals.
9. Different agents need different quality profiles — one size does not fit all.

---

*Seed: response-generation-quality | Domain: Agent Conversation & UX | Stone AI Palace Knowledge*
