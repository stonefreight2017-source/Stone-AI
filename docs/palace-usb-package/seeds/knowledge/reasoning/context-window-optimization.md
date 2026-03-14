# Context Window Optimization

## Core Principle

Qwen 2.5 32B has a 32K token context window. Every token matters. How you structure information within that window determines whether the model performs at 80% or 40% of its potential. This seed covers how to maximize information density and retrieval within the constraint.

## Context Window Budget

```
TOTAL: ~32,000 tokens (~24,000 words)

ALLOCATION:
  System prompt (reasoning preamble):  ~4,000 tokens  (12.5%)
  Specialist seeds (agent knowledge):  ~3,000-5,000 tokens  (10-15%)
  Conversation history:                ~20,000 tokens (62.5%)
  Response generation:                 ~3,000-5,000 tokens  (10-15%)

KEY CONSTRAINT: As conversation grows, history pushes out system prompt
effectiveness. Plan for this.
```

## Primacy and Recency Effects

LLMs pay the most attention to information at the BEGINNING and END of context. Information in the middle gets less attention.

```
STRUCTURE YOUR CONTEXT:
  ┌─────────────────────────────┐
  │  BEGINNING (high attention) │ ← Identity, critical rules, format
  │                             │
  │  MIDDLE (lower attention)   │ ← Conversation history, details
  │                             │
  │  END (high attention)       │ ← Current question, recent context
  └─────────────────────────────┘

IMPLICATIONS:
  1. Put the MOST IMPORTANT instructions at the VERY START of system prompt
     - Agent identity (who am I?)
     - Core rules (what must I always do?)
     - Output format (how should I respond?)

  2. Put CURRENT TASK details at the END, close to the user's message
     - Recent context summary
     - Current file contents
     - Specific constraints for this task

  3. MIDDLE can hold reference material
     - Knowledge seeds
     - Conversation history
     - Background information
```

## Separators and Headers for Quick Retrieval

The model retrieves information better when it's clearly delimited:

```
EFFECTIVE SEPARATORS:

  === SECTION: Identity ===
  [Identity information]

  === SECTION: Rules ===
  [Rules]

  === SECTION: Knowledge ===
  [Domain knowledge]

  === SECTION: Current Task ===
  [What to do now]

WHY THIS WORKS:
  - Explicit markers help the model "index" the context
  - When the model needs identity info, it searches for the Identity marker
  - Without markers, the model does a fuzzy scan of the entire context
```

### Recommended System Prompt Structure

```
=== IDENTITY ===
You are [Agent Name], a [Role].
[1-2 sentences of expertise description]

=== RULES (ALWAYS FOLLOW) ===
1. [Most important rule]
2. [Second most important rule]
3. [Third most important rule]

=== OUTPUT FORMAT ===
[Format template]

=== KNOWLEDGE ===
[Relevant seeds — 2-3 most applicable, not all 30]

=== BOUNDARIES ===
Expert in: [list]
NOT expert in: [list]
Escalate to: [list]

=== CURRENT CONTEXT ===
[Injected at runtime — current file, recent history summary, task details]
```

## Context Compression Without Losing Decision-Relevant Detail

As conversations get long, you need to compress history. Here's how to do it without losing what matters:

### What to Keep (Decision-Relevant)

```
KEEP:
  - Decisions made and WHY (reasoning behind choices)
  - Constraints established (what we agreed we can't/won't do)
  - Current state (what exists now, what's been built)
  - Open questions (what's still unresolved)
  - Error patterns (what we tried that didn't work)
```

### What to Compress (Intermediate Detail)

```
COMPRESS:
  - Step-by-step debugging that led to a conclusion
    → Keep: "The bug was in the auth middleware (missing userId check)"
    → Remove: The 15 messages of investigation
  - Code exploration
    → Keep: "File X has function Y that does Z"
    → Remove: The full file contents that were read
  - Discussion/brainstorming
    → Keep: "We decided to use approach A because [reasons]"
    → Remove: The discussion of approaches B and C
```

### What to Drop (Noise)

```
DROP:
  - Pleasantries ("Thanks!", "Got it", "Makes sense")
  - Repeated information (same fact stated multiple times)
  - Superseded decisions (we decided X, then changed to Y — drop X)
  - Tool output that's been summarized
  - Error messages that have been resolved
```

### Compression Template

```
=== CONVERSATION SUMMARY (replacing messages 1-50) ===

DECISIONS MADE:
  1. Using Prisma for DB access (chosen over raw SQL for type safety)
  2. Chat API uses tiered routing (vLLM for FREE/STARTER, Anthropic for SMART+)

CURRENT STATE:
  - Chat API route complete and tested
  - Frontend chat component in progress (messages display, input pending)
  - Auth middleware integrated

OPEN ISSUES:
  - Rate limiting not yet implemented on /api/chat
  - Error handling needs standardization

CONSTRAINTS:
  - Must stay under 3s response time
  - Cannot modify Prisma schema without migration plan

=== END SUMMARY ===
```

## Seed Selection Strategy

Don't inject all 30 reasoning seeds into every agent. Select based on the agent's role:

```
BACKEND ENGINEER:
  - chain-of-thought.md (always)
  - self-verification.md (always)
  - code-smells.md (code quality)
  - solid-principles.md (design decisions)
  - owasp-operational.md (security-aware coding)

SECURITY ENGINEER:
  - chain-of-thought.md (always)
  - self-verification.md (always)
  - threat-modeling.md (core skill)
  - defense-in-depth.md (core skill)
  - zero-trust-applied.md (core skill)

STRATEGIC AGENT (Stone/Cardinal):
  - chain-of-thought.md (always)
  - self-verification.md (always)
  - first-principles.md (strategy)
  - second-order-effects.md (consequence mapping)
  - theory-of-constraints.md (optimization)

GENERAL PURPOSE:
  - chain-of-thought.md (always)
  - self-verification.md (always)
  - confidence-calibration.md (always)
  [+ 1-2 role-specific seeds]
```

## Token Budgeting Per Seed

```
COMPACT SEEDS (use full):          ~1,000-1,500 tokens each
  - self-verification.md
  - scope-control.md
  - confidence-calibration.md

MEDIUM SEEDS (use full or summary): ~2,000-3,000 tokens each
  - chain-of-thought.md
  - first-principles.md
  - ooda-operationalized.md
  - theory-of-constraints.md

LARGE SEEDS (always summarize):    ~3,000-5,000 tokens each
  - code-smells.md
  - architecture-decisions.md
  - owasp-operational.md
  - threat-modeling.md

For large seeds, extract the TEMPLATES and CHECKLISTS.
Drop the worked examples (those are for learning, not runtime).
```

## Runtime Context Injection

```
TECHNIQUE: Dynamic context injection based on the task

IF task involves code review:
  → Inject: code-smells.md (compact), solid-principles.md (compact)

IF task involves security:
  → Inject: threat-modeling.md (checklist only), owasp-operational.md (rules only)

IF task involves architecture:
  → Inject: architecture-decisions.md (decision trees only)

IF task involves strategy:
  → Inject: first-principles.md (template), second-order-effects.md (template)

ALWAYS inject:
  → chain-of-thought.md (template section only, ~500 tokens)
  → self-verification.md (protocol only, ~300 tokens)
  → confidence-calibration.md (scale only, ~200 tokens)
```

## Monitoring Context Usage

```
TRACK:
  - System prompt size (should be stable, ~4K tokens)
  - Seed injection size (should be 3-5K tokens per task)
  - Conversation history size (grows — needs compression)
  - Available response tokens (should never be <2K)

WARNING THRESHOLDS:
  - History > 20K tokens → compress old messages
  - Available response < 2K tokens → aggressive compression needed
  - Total context > 30K tokens → approaching limit, quality will degrade
```

## Integration

- **Role Anchoring** defines what goes in the Identity section
- **Output Format Discipline** defines the Format section
- All other seeds are the knowledge that gets injected based on task type
- **Scope Control** prevents context bloat from scope creep
