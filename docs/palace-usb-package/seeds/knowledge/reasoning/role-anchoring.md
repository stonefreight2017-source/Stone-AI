# Role Anchoring

## Core Principle

Smaller models drift from their assigned role during long conversations. The system prompt fades as context fills with conversation history. Role anchoring provides techniques to keep Qwen in character throughout an entire session, not just at the start.

## The Role Definition Template

Every agent system prompt should include ALL of these components:

```
IDENTITY:
  "You are [name/title]. Your expertise is [specific domain]."
  Be specific. "Senior Backend Engineer" is better than "developer."

EXPERTISE BOUNDARIES:
  "You are an expert in: [list specific technologies/domains]"
  "You are NOT an expert in: [list what's outside your scope]"
  This prevents the model from confidently answering outside its domain.

OUTPUT FORMAT:
  "Always structure your responses as: [format description]"
  "Use [specific formatting] for [specific content types]"
  Explicit format instructions reduce drift in response style.

PROHIBITED BEHAVIORS:
  "Never [specific behavior]."
  "Do not [specific action]."
  Explicit prohibitions are more effective than hoping the model avoids things.

ESCALATION TRIGGERS:
  "If you encounter [situation], respond with: 'This is outside my
   expertise. This should be handled by [specific agent/role].'"
  Gives the model a script for when it's out of scope.
```

## Applied Examples

### Backend Engineer Agent

```
IDENTITY:
  You are a Senior Backend Engineer specializing in Node.js, TypeScript,
  Next.js API routes, and Prisma ORM.

EXPERTISE BOUNDARIES:
  Expert in: API design, database queries, server-side logic, middleware,
             authentication integration, error handling, performance optimization.
  NOT expert in: Frontend components, CSS/styling, UI design, DevOps,
                 infrastructure, machine learning, mobile development.

OUTPUT FORMAT:
  - Code solutions include: the file path, the complete code change,
    and a brief explanation of WHY this approach was chosen.
  - Always specify error handling for each code block.
  - Always mention which files need to change.

PROHIBITED BEHAVIORS:
  - Never suggest frontend component changes. If frontend changes are
    needed, say "A frontend change is needed for [X] — this should be
    handled by the Frontend Engineer."
  - Never modify the Prisma schema. Say "A schema change is needed —
    this should be handled by the Database Engineer."
  - Never guess at environment variables. If an env var is needed,
    specify its name and expected format.

ESCALATION TRIGGERS:
  - Prisma schema changes → Database Engineer
  - Frontend component work → Frontend Engineer
  - Auth provider configuration → Security Engineer
  - Deployment issues → DevOps Engineer
```

## Persona Drift Countermeasures

### What Drift Looks Like

```
EARLY IN CONVERSATION (on-character):
  "As a Backend Engineer, I'd implement this API route using Prisma
   with proper error handling and input validation..."

AFTER 10+ EXCHANGES (drifting):
  "I think we should redesign the UI to use a card layout, and also
   maybe reconsider the pricing strategy..."
  (A Backend Engineer wouldn't say this)
```

### Countermeasure 1: Periodic Re-Anchoring

Insert re-anchoring prompts at regular intervals in the conversation:

```
TECHNIQUE: After every 5 exchanges, the system inserts:
  "[ROLE CHECK: You are the Senior Backend Engineer. Your scope is
   API routes, database queries, and server-side logic. Stay in scope.]"

This is invisible to the user but reminds the model of its role.
```

### Countermeasure 2: Scope Boundary Enforcement

```
TECHNIQUE: When the model's response touches out-of-scope areas, the
system catches it and redirects:

  "Your response included frontend recommendations. As the Backend
   Engineer, focus only on server-side aspects. Revise your response
   to stay within your expertise."
```

### Countermeasure 3: Identity Preamble in Every Response

```
TECHNIQUE: The model begins each response by internally confirming its role:

  [Internal: I am the Backend Engineer. This question is about API
   performance. This is within my scope. I will focus on server-side
   optimization only.]

  "The API latency issue is likely in the database query layer..."
```

### Countermeasure 4: Format Anchoring

```
TECHNIQUE: Consistent output format reinforces role.

  Backend Engineer always outputs:
  ## Analysis
  [What the issue is]

  ## Solution
  [Code changes with file paths]

  ## Files Changed
  [List of files]

  When the format stays consistent, the role stays consistent.
  When the format drifts, the role is drifting.
```

## Multi-Agent Conversation Role Preservation

When multiple agents interact, role confusion is the biggest risk:

```
RULES:
  1. Each agent's system prompt includes: "Other agents may suggest work
     in your domain. Evaluate their suggestions but make your own decisions
     based on your expertise."

  2. Each agent states its identity at the start of each response:
     "[Backend Engineer]: Regarding the database query optimization..."

  3. Agents never take on another agent's work:
     "The Frontend Engineer suggested adding server-side rendering.
      I can confirm the API supports this, but the implementation
      should be handled by the Frontend Engineer."

  4. Handoffs are explicit:
     "I've completed the API route. The Frontend Engineer needs to:
      1. Call GET /api/agents with the user token
      2. Handle the response shape: { agents: Agent[], total: number }"
```

## Role Anchoring for Different Agent Types

### Technical Agents (Backend, Frontend, DB, Security)
```
Strong anchoring needed for: expertise boundaries, tool usage, code format
Drift risk: Answering questions outside their domain with false confidence
Countermeasure: Explicit "NOT expert in" list in system prompt
```

### Strategic Agents (Stone, Cardinal)
```
Strong anchoring needed for: decision-making frameworks, reporting style
Drift risk: Getting into implementation details instead of strategy
Countermeasure: "Your role is strategy and direction, not implementation.
               Direct implementation work to the appropriate specialist."
```

### Creative Agents (Copywriting, Marketing)
```
Strong anchoring needed for: brand voice, format, audience
Drift risk: Technical jargon creeping in, losing brand voice
Countermeasure: Include brand voice examples in system prompt,
               re-anchor with brand guidelines periodically
```

## Measuring Role Adherence

```
CHECKLIST after each agent response:
[] Did the response stay within the agent's expertise domain?
[] Did the response use the correct output format?
[] Did the response avoid prohibited behaviors?
[] Did the response escalate appropriately for out-of-scope items?
[] Would a human with this job title write a similar response?
```

## Integration

- **Output Format Discipline** provides the format anchoring details
- **Context Window Optimization** ensures role information stays in context
- **Scope Control** provides the "stay in your lane" framework
- **Confidence Calibration** prevents false confidence outside the agent's domain
