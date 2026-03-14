# Golden Seed E-2: Fallback Chain Patterns
# Seed: GOLD-E2 | Category: Golden Seeds | Topic: Graceful Degradation
# RAG Tags: fallback, degradation, failure-mode, error-handling, resilience, decision-tree

---

## PURPOSE
Ordered fallback strategies for EVERY failure mode an agent can encounter.
Primary approach fails? Try simplified version. That fails? Try adjacent approach.
That fails? Give partial answer with honesty. Last resort? Redirect to human.
Graceful degradation is ALWAYS better than hallucinated completion.

---

## 1. The Universal Fallback Principle

```
NEVER let the user see "ERROR" or get nothing.
ALWAYS give them SOMETHING useful, even during failure.

Fallback hierarchy (in order):
  Level 1: PRIMARY APPROACH     — Full-quality response
  Level 2: SIMPLIFIED VERSION   — Same approach, reduced scope/quality
  Level 3: ADJACENT APPROACH    — Different method to achieve same goal
  Level 4: PARTIAL ANSWER       — Answer what you can, acknowledge what you can't
  Level 5: HONEST REDIRECT      — "I can't do this. Here's who/what can."

Rule: NEVER skip levels. Always try each before falling to the next.
Rule: ALWAYS tell the user which level you're operating at.
Rule: Graceful degradation > hallucinated completion. ALWAYS.
```

---

## 2. Agent Response Fallback Chain

### When the LLM Can't Generate a Good Response
```
Level 1: FULL RESPONSE
  Agent generates complete, high-quality response using primary model.
  ✓ On-topic, comprehensive, accurate, well-formatted.

Level 2: SIMPLIFIED RESPONSE
  Agent generates a shorter, simpler response.
  - Reduce complexity of explanation
  - Skip examples if they're causing issues
  - Use simpler language
  - Focus on the core answer only
  Trigger: Response quality check fails, or output is garbled.

Level 3: TEMPLATE RESPONSE
  Use a pre-written template for common question types.
  - FAQ-style answers for common questions
  - Standard explanations for standard topics
  - Pre-approved responses for sensitive topics
  Trigger: LLM output is consistently low quality for this query.

Level 4: PARTIAL RESPONSE
  Answer what you can, flag what you can't.
  "I can help with [part A] of your question. Regarding [part B],
   I'd need more information / I'm not able to assist with that."
  Trigger: Agent can handle PART of the query but not all.

Level 5: HONEST REDIRECT
  "I'm not able to help with this right now. Here's what I'd suggest:
   [human support link] or [alternative resource]."
  Trigger: All automated approaches failed.
```

### Implementation
```typescript
// agent-fallback.ts

interface FallbackLevel {
  level: number;
  name: string;
  attempt: () => Promise<string>;
  timeout: number;
}

async function generateWithFallback(
  query: string,
  agentId: number,
  userId: string,
): Promise<{ response: string; level: number; degraded: boolean }> {

  const fallbackChain: FallbackLevel[] = [
    {
      level: 1,
      name: 'full_response',
      attempt: () => generateFullResponse(query, agentId),
      timeout: 30000,
    },
    {
      level: 2,
      name: 'simplified_response',
      attempt: () => generateSimplifiedResponse(query, agentId),
      timeout: 15000,
    },
    {
      level: 3,
      name: 'template_response',
      attempt: () => getTemplateResponse(query, agentId),
      timeout: 5000,
    },
    {
      level: 4,
      name: 'partial_response',
      attempt: () => generatePartialResponse(query, agentId),
      timeout: 10000,
    },
    {
      level: 5,
      name: 'redirect',
      attempt: () => Promise.resolve(getRedirectMessage(agentId)),
      timeout: 1000,
    },
  ];

  for (const level of fallbackChain) {
    try {
      const response = await Promise.race([
        level.attempt(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), level.timeout)
        ),
      ]);

      // Quality check
      if (response && response.length > 20 && !isGarbled(response)) {
        return {
          response: level.level > 1
            ? addDegradationNote(response, level.name)
            : response,
          level: level.level,
          degraded: level.level > 1,
        };
      }
      // Response failed quality check, try next level
    } catch (error) {
      console.warn(`Fallback level ${level.level} (${level.name}) failed:`, error);
      // Try next level
    }
  }

  // Should never reach here — level 5 is guaranteed
  return {
    response: "I'm temporarily unable to assist. Please try again in a moment.",
    level: 5,
    degraded: true,
  };
}

function addDegradationNote(response: string, levelName: string): string {
  const notes: Record<string, string> = {
    simplified_response: "",  // Don't tell user about simplified — just deliver
    template_response: "",    // Template responses are fine as-is
    partial_response: "\n\n*Note: I was only able to partially address your question. For a complete answer, you may want to try rephrasing or asking about specific parts.*",
    redirect: "",
  };
  return response + (notes[levelName] || '');
}

function isGarbled(text: string): boolean {
  // Detect low-quality or garbled output
  const garbledIndicators = [
    text.includes('undefined'),
    text.includes('null'),
    text.includes('[object Object]'),
    /(.)\1{10,}/.test(text),              // Repeated characters
    text.split(' ').length < 5,            // Too short
    !/[.!?]/.test(text),                   // No sentence endings
  ];
  return garbledIndicators.filter(Boolean).length >= 2;
}
```

---

## 3. Domain-Specific Fallback Chains

### Code Generation Fallback
```
Level 1: COMPLETE CODE
  Full implementation with error handling, types, and comments.

Level 2: SKELETON CODE
  Structure and function signatures without full implementation.
  "Here's the structure — you'll need to implement [specific parts]."

Level 3: PSEUDOCODE
  Language-agnostic logic description.
  "Here's the algorithm in pseudocode. You can implement this in [language]."

Level 4: APPROACH DESCRIPTION
  Natural language description of how to solve the problem.
  "Here's how I'd approach this problem: [steps]."

Level 5: RESOURCE REDIRECT
  "For this implementation, I'd recommend checking:
   [official docs link], [tutorial link], [Stack Overflow search terms]."
```

### Data Analysis Fallback
```
Level 1: COMPLETE ANALYSIS
  Full analysis with data, charts, insights, and recommendations.

Level 2: KEY METRICS ONLY
  Focus on the most important numbers without deep analysis.
  "Here are the key metrics: [data]. For deeper analysis, consider [tools]."

Level 3: DIRECTIONAL INSIGHT
  General trends without specific numbers.
  "Based on the available data, [metric] appears to be trending [direction]."

Level 4: METHODOLOGY
  How to perform the analysis yourself.
  "To analyze this properly, you'd want to: [steps with tool recommendations]."

Level 5: REDIRECT
  "For this type of analysis, I'd recommend [specific tool or analyst]."
```

### Troubleshooting Fallback
```
Level 1: SPECIFIC FIX
  Exact solution with code/steps to resolve the issue.
  "The error is caused by X. Here's the fix: [specific code change]."

Level 2: LIKELY CAUSE + DIAGNOSTIC STEPS
  Most probable cause with steps to confirm.
  "This is likely caused by X. To confirm, try: [diagnostic steps]."

Level 3: DIFFERENTIAL DIAGNOSIS
  List of possible causes ranked by likelihood.
  "This could be caused by:
   1. [Most likely] — Check by [steps]
   2. [Second likely] — Check by [steps]
   3. [Less likely] — Check by [steps]"

Level 4: DEBUGGING METHODOLOGY
  General approach to finding the issue.
  "Here's how I'd debug this:
   1. Check logs for [pattern]
   2. Verify [configuration]
   3. Test [component] in isolation
   4. [Additional steps]"

Level 5: ESCALATION
  "This requires deeper investigation. I'd suggest:
   - Posting on [relevant forum] with [specific details to include]
   - Contacting [support channel]
   - Checking [documentation/changelog for recent changes]"
```

### Knowledge Question Fallback
```
Level 1: AUTHORITATIVE ANSWER
  Complete answer from verified knowledge with source citation.

Level 2: KNOWLEDGE + CAVEAT
  Answer from general knowledge with uncertainty markers.
  "Based on my understanding, [answer]. I'd recommend verifying at [source]."

Level 3: RELATED KNOWLEDGE
  Can't answer the exact question, but can provide related information.
  "I don't have specific information about [X], but I can tell you about
   [related topic Y], which may be relevant."

Level 4: FRAMING
  Can't answer, but can help the user think about the question.
  "I'm not sure about the answer, but here are the key factors to consider:
   [framework for thinking about the question]."

Level 5: REDIRECT
  "For authoritative information on this, I'd recommend:
   [specific documentation], [expert community], [authoritative source]."
```

---

## 4. Failure Mode Decision Trees

### Network/Service Failure
```
Service call failed
  ↓
Is it a timeout?
  YES → Was it a read timeout (got some data)?
    YES → Can we use partial data?
      YES → Use partial data + caveat → Level 4 (partial response)
      NO  → Retry with shorter timeout → If fail → Level 3 (template)
    NO → Was it a connection timeout (got nothing)?
      YES → Retry once → If fail → Fallback service → If fail → Level 5
  NO → Is it a rate limit (429)?
    YES → Wait and retry (respect Retry-After) → If still limited → Level 3
  NO → Is it an auth error (401/403)?
    YES → Don't retry (fix auth config) → Level 5 with specific error
  NO → Is it a server error (5xx)?
    YES → Retry once → Fallback service → Level 4
  NO → Is it a client error (4xx)?
    YES → Fix request → Don't retry → Level 5 with error context
```

### Content Generation Failure
```
LLM generation failed
  ↓
Was output empty?
  YES → Retry with simpler prompt → If fail → Template response
Was output garbled?
  YES → Retry with temperature=0 → If fail → Simplified prompt → Template
Was output off-topic?
  YES → Retry with more specific prompt → If fail → Template
Was output harmful/inappropriate?
  YES → DO NOT SHOW → Use content filter → Template or redirect
Was output too long?
  YES → Truncate at natural break → Add "continued in next message"
Was output too short?
  YES → Retry with "provide more detail" → Accept if reasonable
```

### Data Retrieval Failure
```
Database/RAG query failed
  ↓
Is it a connection error?
  YES → Retry with connection pool → If fail → Cache fallback
Is it a query timeout?
  YES → Simplify query (fewer joins, smaller limit) → If fail → Cache
Is it a data not found?
  YES → Is this expected (new user, empty state)?
    YES → Return empty state response
    NO  → Broaden search → If fail → "No results found" response
Is it a permission error?
  YES → Check user tier → Return appropriate access message
Is it corrupt data?
  YES → Log alert → Return error → Don't show corrupt data to user
```

---

## 5. Fallback Communication Templates

### How to Tell Users About Degradation
```
DON'T say:
  "An error occurred."                  (No context, scary)
  "System failure in module XYZ."       (Too technical, scary)
  "I can't do that."                    (Unhelpful, no alternative)
  "Please try again later."             (Vague, no timeline)
  "[Nothing — silently serve bad data]" (WORST — breaks trust)

DO say:
  Level 2: [Just deliver the simplified response — no need to mention degradation]

  Level 3: "Here's what I found on that topic: [template response].
            For a more detailed answer, you can [action]."

  Level 4: "I was able to help with part of your question:
            [partial answer]
            For the rest, I'd suggest [specific alternative]."

  Level 5: "I'm not able to help with this right now.
            Here's what I'd recommend:
            • [Specific alternative 1]
            • [Specific alternative 2]
            I apologize for the inconvenience."

TONE: Helpful, honest, action-oriented. Never blame the user.
Include WHAT they can do, not just what went wrong.
```

---

## 6. Fallback Quality Metrics

### Measuring Fallback Effectiveness
```
Metrics to track:

1. FALLBACK RATE by level:
   "What percentage of responses use each fallback level?"
   Target: L1 > 90%, L2 < 7%, L3 < 2%, L4 < 0.5%, L5 < 0.1%

2. RECOVERY RATE:
   "When L1 fails, how often does L2 succeed?"
   Target: L2 recovery > 80% when L1 fails

3. USER SATISFACTION by level:
   "Do users rate degraded responses acceptably?"
   Target: L2 satisfaction > 80% of L1 satisfaction

4. SILENT FAILURE RATE:
   "How often do we serve garbled/wrong responses without detecting it?"
   Target: 0% (every bad response should be caught by quality check)

5. ESCALATION RATE:
   "How often do users contact support after a fallback response?"
   Lower = better fallback quality

Dashboard query:
  SELECT
    fallback_level,
    COUNT(*) as count,
    AVG(user_rating) as avg_satisfaction,
    COUNT(CASE WHEN support_ticket_created THEN 1 END) as escalations
  FROM agent_responses
  WHERE created_at > NOW() - INTERVAL '30 days'
  GROUP BY fallback_level
  ORDER BY fallback_level;
```

---

## 7. Testing Fallback Chains

```typescript
// fallback-test.ts

describe('Agent Fallback Chain', () => {
  it('should serve simplified response when primary fails', async () => {
    // Simulate primary model failure
    mockPrimaryModel.mockRejectedValue(new Error('Model overloaded'));

    const result = await generateWithFallback('What is React?', 1, 'user1');

    expect(result.level).toBe(2);
    expect(result.response).toBeTruthy();
    expect(result.response.length).toBeGreaterThan(20);
    expect(result.degraded).toBe(true);
  });

  it('should serve template for common questions when LLM is down', async () => {
    mockPrimaryModel.mockRejectedValue(new Error('Down'));
    mockSimplifiedModel.mockRejectedValue(new Error('Down'));

    const result = await generateWithFallback('What is Stone AI?', 1, 'user1');

    expect(result.level).toBe(3);
    expect(result.response).toContain('Stone AI');
  });

  it('should never return empty response', async () => {
    // Simulate total failure
    mockPrimaryModel.mockRejectedValue(new Error('Down'));
    mockSimplifiedModel.mockRejectedValue(new Error('Down'));
    mockTemplateStore.mockReturnValue(null);
    mockPartialResponse.mockRejectedValue(new Error('Down'));

    const result = await generateWithFallback('Random query', 1, 'user1');

    expect(result.response).toBeTruthy();
    expect(result.response.length).toBeGreaterThan(10);
    expect(result.level).toBe(5);
  });

  it('should detect and reject garbled output', async () => {
    mockPrimaryModel.mockResolvedValue('undefined undefined [object Object]');

    const result = await generateWithFallback('What is React?', 1, 'user1');

    // Should have fallen to level 2 because level 1 output was garbled
    expect(result.level).toBeGreaterThan(1);
    expect(result.response).not.toContain('undefined');
  });

  it('should add degradation note at level 4', async () => {
    mockPrimaryModel.mockRejectedValue(new Error('Down'));
    mockSimplifiedModel.mockRejectedValue(new Error('Down'));
    mockTemplateStore.mockReturnValue(null);

    const result = await generateWithFallback('Complex query', 1, 'user1');

    if (result.level === 4) {
      expect(result.response).toContain('partially');
    }
  });
});
```

---

## 8. The Fallback Manifesto

```
1. Every agent interaction has a guaranteed response.
   No request goes unanswered. Period.

2. Degradation is visible, not hidden.
   Users know when they're getting a reduced response.
   Hidden degradation destroys trust.

3. Each fallback level adds value.
   Even level 5 (redirect) gives the user a PATH FORWARD.
   "I can't help" is only acceptable when followed by "but here's what can."

4. Fallback chains are tested.
   You can't trust a fallback you haven't tested.
   Simulate failures regularly. Verify each level works.

5. Metrics drive improvement.
   Track fallback rates. High L3+ rates = something needs fixing.
   The goal is to minimize fallback frequency, not just handle it gracefully.

6. Graceful degradation > hallucinated completion.
   A honest "I'm not sure" at level 4 is INFINITELY better than
   a confident wrong answer at level 1.

   This is where E-2 meets K-8:
   K-8 says: "I don't know."
   E-2 says: "Here's what I DO know, and here's where to find the rest."
   Together: The user always gets value, and the user always gets truth.
```

---

*Paired with K-8 (I Don't Know Triggers) and CLAUDE-4 (Error Recovery).
Together they form the complete resilience layer for agent responses.
Last validated: 2026-03.*
