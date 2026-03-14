# Golden Seed E-7: Context Overflow Management

## Purpose
Every model has a finite context window. When conversations grow long, when retrieved context is large, when multiple seeds are loaded simultaneously — the model must decide what stays and what goes. Bad decisions here lead to forgotten instructions, missed context, and degraded response quality. This seed provides priority rules, compression strategies, and budget allocation frameworks for context management.

---

## The Context Budget Model

Think of the context window as a budget with fixed capacity. Every component consumes some of that budget:

```
TOTAL CONTEXT BUDGET (100%)
├── System Instructions (FIXED — never compressed)     ~5-10%
├── Active Seeds/Knowledge (VARIABLE)                   ~10-20%
├── Conversation History (GROWS over time)              ~20-50%
├── Retrieved Context (RAG results, documents)          ~10-20%
├── Current User Message (FIXED — never dropped)        ~5-10%
└── Generation Space (RESERVED for response)            ~15-25%
```

When total demand exceeds the budget, something must be compressed or dropped. The priority system below determines what.

---

## Priority Tiers (What to Keep vs. Drop)

### Tier 0: NEVER DROP (Immutable)
These survive no matter how tight the budget gets:
1. **Current user message** — the thing you're responding to
2. **Core system instructions** — role definition, safety guidelines
3. **Active constraints** — "don't" instructions, format requirements from this conversation
4. **Generation space** — minimum room to produce a useful response

### Tier 1: STRONGLY PRESERVE
Drop only under extreme pressure:
1. **Last 2-3 conversation turns** — immediate context for the current exchange
2. **Active task state** — what you're currently working on (multi-step task progress)
3. **User corrections** — "actually I meant X" moments that change interpretation
4. **Loaded seeds relevant to current query** — the knowledge you need RIGHT NOW

### Tier 2: PRESERVE IF POSSIBLE
First candidates for compression (but not removal):
1. **Earlier conversation turns** (turns 3-10) — compress to summaries
2. **Seeds relevant to the conversation topic** (but not the current query)
3. **Retrieved context that's partially relevant** — keep the relevant parts, drop the rest
4. **Code blocks from earlier turns** — summarize what they contained

### Tier 3: DROP WHEN NEEDED
Remove when budget is tight:
1. **Conversation turns beyond turn 10** — summarize to 1-2 sentences each
2. **Fully addressed questions and their answers** — the user moved on
3. **Seeds not relevant to current conversation** — reload if needed later
4. **Redundant context** — information that appears in multiple places
5. **Verbose explanations the user acknowledged** — compress to the key point

### Tier 4: ALWAYS DROP FIRST
These should never consume meaningful budget:
1. **Social pleasantries** (greetings, thanks, acknowledgments beyond turn 1)
2. **Failed attempts** that were corrected (keep only the correction)
3. **Repeated information** — deduplicate aggressively
4. **Formatting-heavy content** — tables, ASCII art, decorative elements from earlier turns

---

## Compression Strategies

### Strategy 1: Turn Summarization
**When:** Conversation history exceeds ~40% of context budget
**How:** Replace older turns with summaries

**Before compression:**
```
Turn 3 (User): [500 tokens about their database schema and the issue they're having with a migration]
Turn 3 (Assistant): [800 tokens of detailed migration fix with code]
Turn 4 (User): "That worked, thanks. Now about the API..."
Turn 4 (Assistant): [600 tokens about the API endpoint]
```

**After compression:**
```
[Turns 3-4 summary: Fixed Prisma migration issue with User model. Moved to API endpoint discussion.]
```

**Rules:**
- Preserve decisions made ("we chose X over Y")
- Preserve constraints established ("user doesn't want TypeScript")
- Preserve unresolved issues
- Drop resolved details

---

### Strategy 2: Code Block Compression
**When:** Large code blocks from earlier turns consume significant budget
**How:** Replace with descriptions

**Before:**
```
Turn 5 (Assistant): Here's the updated component:
[150 lines of React component code]
```

**After:**
```
Turn 5 (Assistant): [Provided updated PricingCard component with:
tier display, feature list, CTA button, responsive layout,
loading states. File: src/components/PricingCard.tsx]
```

**Rules:**
- Keep the most recent version of any code
- For code you're actively editing, keep the full text
- For code that was provided and accepted, compress to description
- Always note the file path so it can be re-read if needed

---

### Strategy 3: Context Deduplication
**When:** Same information appears in multiple places (seeds + conversation + retrieved docs)
**How:** Keep the most authoritative/detailed version, reference it from other locations

**Before:**
```
Seed: "PostgreSQL supports JSON columns via jsonb type..."
Retrieved doc: "PostgreSQL jsonb provides binary JSON storage..."
Conversation turn 2: "As I mentioned, PostgreSQL jsonb supports..."
```

**After:**
```
[PostgreSQL jsonb — covered in active seed. Used in conversation since turn 2.]
```

---

### Strategy 4: Selective Seed Loading
**When:** Multiple seeds are loaded but only some are relevant
**How:** Unload seeds that aren't needed for the current query

**Decision framework:**
```
For each loaded seed:
1. Is this seed relevant to the CURRENT query? → Keep
2. Was this seed used in the last 3 turns? → Keep (might need again)
3. Is this seed's topic still active in the conversation? → Keep compressed
4. None of the above? → Unload, note that it exists for reload
```

**Unloaded seed reference:**
```
[Available but unloaded: Seed I-3 (Constraint Checklists), Seed E-4 (Adversarial Handlers).
Will reload if conversation returns to these topics.]
```

---

### Strategy 5: Retrieved Context Pruning
**When:** RAG retrieval returns more context than needed
**How:** Score relevance and keep only high-relevance chunks

**Relevance scoring:**
```
HIGH: Directly answers or supports the current query
MEDIUM: Related to the current topic but not the specific question
LOW: Tangentially related or from a different context
NONE: Retrieved but not relevant (embedding similarity ≠ semantic relevance)
```

**Action by score:**
- HIGH → Keep in full
- MEDIUM → Keep but compress (extract key sentences)
- LOW → Drop, note existence
- NONE → Drop silently

---

## Context Overflow Detection

### Warning Signals
1. **Response quality degradation** — answers become less specific, more generic
2. **Instruction forgetting** — earlier constraints are violated
3. **Context confusion** — mixing up details from different parts of the conversation
4. **Repetition** — restating things already covered (because the model "forgot" it was covered)
5. **Hallucination increase** — filling gaps in compressed context with fabricated details

### Proactive Management
Don't wait for overflow. Monitor continuously:

```
CONTEXT HEALTH CHECK (every 5+ turns):
1. Conversation length: [turns] → approaching compression threshold?
2. Active seeds loaded: [count] → any that can be unloaded?
3. Code blocks in history: [count, total size] → any that can be compressed?
4. Resolved topics: [list] → can these be summarized?
5. Estimated budget usage: [%] → is generation space being squeezed?
```

---

## Context Budget Allocation by Scenario

### Scenario 1: New Conversation (Early Turns)
```
System Instructions: 10%
Seeds: 15%
Conversation History: 5% (minimal)
Current Message: 10%
Generation Space: 60% (maximum room for detailed responses)
```

### Scenario 2: Active Coding Session (Turns 5-15)
```
System Instructions: 8%
Active Seeds: 10%
Conversation History: 35% (code blocks, decisions, context)
Current Message: 7%
Generation Space: 40% (still good)
```

### Scenario 3: Long Conversation (Turns 15+)
```
System Instructions: 8%
Active Seeds: 10%
Compressed History: 30% (summaries replacing full turns)
Recent History (last 3 turns): 15%
Current Message: 7%
Generation Space: 30% (getting tight — responses may need to be more focused)
```

### Scenario 4: Heavy RAG Retrieval
```
System Instructions: 8%
Active Seeds: 5% (reduce to essentials)
Conversation History: 20% (compress aggressively)
Retrieved Context: 25% (pruned to high-relevance only)
Current Message: 7%
Generation Space: 35%
```

---

## Compression Quality Rules

### What Compression Must Preserve
1. **Decisions and their rationale** — "We chose PostgreSQL because of pgvector support"
2. **Active constraints** — "User doesn't want external libraries"
3. **Unresolved issues** — "Still need to fix the login redirect"
4. **User preferences** — "User prefers functional components"
5. **Error context** — "The CORS error was caused by missing headers"
6. **File locations** — "Working on src/app/api/users/route.ts"

### What Compression Can Safely Drop
1. **Explanation of well-known concepts** — if you explained what REST is in turn 2, that explanation can go
2. **Intermediate debugging steps** — keep the conclusion, drop the trial-and-error
3. **Alternative approaches that were rejected** — keep only the chosen path
4. **Verbose code that was superseded** — keep only the latest version
5. **Pleasantries and filler** — "Great question!" "Happy to help!" "Let me think about this..."

### Compression Anti-Patterns
1. **Lossy compression of instructions** — never compress "don't use TypeScript" to "has TypeScript preferences" (ambiguous)
2. **Dropping correction context** — if the user corrected you, keeping the correction without the original loses the lesson
3. **Over-compressing recent turns** — the last 3 turns should almost never be compressed
4. **Compressing code you're actively editing** — current working code must remain in full

---

## Multi-Agent Context Sharing

When multiple agents are working on related tasks, context management becomes critical:

### Shared Context
- Project structure and file ownership
- Active constraints and requirements
- Decisions made by other agents that affect your work

### Per-Agent Context
- The specific files this agent is working on
- The specific task and success criteria
- Domain-specific seeds for this agent's specialty

### Handoff Context
When passing work between agents:
```
HANDOFF CONTEXT PACKAGE:
1. What was done: [completed work summary]
2. Current state: [where things stand]
3. Active constraints: [all constraints still in effect]
4. Known issues: [problems discovered but not yet fixed]
5. Files modified: [list with brief description of changes]
```

---

## Emergency Context Recovery

When context overflow has already degraded quality:

### Step 1: Acknowledge
"I want to make sure I have the full picture. Let me verify the current state of things."

### Step 2: Request Key Context
"Can you confirm:
1. What we're currently working on
2. Any constraints I should keep in mind
3. The specific issue with the current approach"

### Step 3: Rebuild
Reconstruct the essential context from the user's confirmation, not from degraded memory.

### Step 4: Resume
Continue with refreshed context, noting: "Thanks for the reset. Now, [continue with high-quality response]."

---

*Seed E-7 | Classification: Edge Case Handling | Priority: HIGH*
*Context is the model's working memory. Managing it well is the difference between a model that gets better over a long conversation and one that gets worse.*
