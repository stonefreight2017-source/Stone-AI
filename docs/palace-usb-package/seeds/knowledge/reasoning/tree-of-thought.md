# Tree of Thought Reasoning

## Core Principle

Instead of committing to one approach and hoping it works, generate multiple distinct approaches, project each forward, and evaluate before committing. This prevents the single-path trap where smaller models latch onto the first plausible idea and never consider alternatives.

## The ToT Template

```
PROBLEM STATEMENT: [What needs to be solved]

BRANCH 1: [Approach A — describe in one sentence]
  Step 1 forward: [What happens if we take this approach]
  Step 2 forward: [What happens next]
  Best case: [What success looks like]
  Worst case: [What failure looks like]
  Confidence: [1-5]
  Reversibility: [Easy / Hard / Impossible]

BRANCH 2: [Approach B — must be DISTINCTLY different from A]
  Step 1 forward: [What happens if we take this approach]
  Step 2 forward: [What happens next]
  Best case: [What success looks like]
  Worst case: [What failure looks like]
  Confidence: [1-5]
  Reversibility: [Easy / Hard / Impossible]

BRANCH 3: [Approach C — must be DISTINCTLY different from A and B]
  Step 1 forward: [What happens if we take this approach]
  Step 2 forward: [What happens next]
  Best case: [What success looks like]
  Worst case: [What failure looks like]
  Confidence: [1-5]
  Reversibility: [Easy / Hard / Impossible]

EVALUATION:
  Best worst-case outcome: [Which branch has the least bad failure mode?]
  Highest expected value: [Which branch has the best average outcome?]
  Most informative: [Which branch teaches us the most?]

DECISION: [Choose branch and state why]
```

## Pruning Rules: When to Kill a Branch Early

Kill a branch immediately if:
1. **Irreversible AND low confidence.** If you can't undo it and you're not sure it works, it's too risky.
2. **Worse than status quo in ALL scenarios.** If even the best case is worse than doing nothing, prune it.
3. **Depends on an unverified assumption.** If the branch only works if X is true, and you can't verify X, prune it or make verifying X the first step.
4. **Duplicates another branch.** If two branches converge to the same approach after Step 1, they're not distinct. Merge or replace one.
5. **Exceeds constraints.** If the branch requires resources, time, or expertise you don't have, prune it.

Keep a branch alive if:
- It has the best worst-case outcome (even if the best case is mediocre)
- It's highly reversible (low cost of being wrong)
- It generates useful information regardless of success

## Worked Examples

### Example 1: Architecture Decision

**Problem:** Stone AI chat is hitting rate limits on the Anthropic API. Need a solution.

```
BRANCH 1: Add request queuing with backpressure
  Step 1: Implement a Redis-based queue for AI requests
  Step 2: When rate limited, queue requests and process as capacity frees
  Best case: Zero dropped requests, graceful degradation under load
  Worst case: Queue backs up, users wait 30+ seconds, feel like the app is broken
  Confidence: 4/5
  Reversibility: Easy — remove queue, revert to direct calls

BRANCH 2: Implement tiered routing (vLLM first, Anthropic overflow)
  Step 1: Route all requests to local vLLM first
  Step 2: Only hit Anthropic API when vLLM is at capacity or for SMART tier
  Best case: 80% of requests never hit Anthropic, massive cost savings, no rate limits
  Worst case: vLLM quality is noticeably worse for some tasks, users complain
  Confidence: 3/5
  Reversibility: Easy — revert routing logic

BRANCH 3: Implement response caching for common queries
  Step 1: Cache AI responses for identical or near-identical prompts
  Step 2: Serve cached responses instantly, only hit API for novel queries
  Best case: 30-40% cache hit rate, fewer API calls, faster responses
  Worst case: Cache hits serve stale/wrong answers, users get confused
  Confidence: 2/5
  Reversibility: Easy — disable cache

EVALUATION:
  Best worst-case: Branch 1 (queuing) — worst case is slow, not wrong
  Highest expected value: Branch 2 (tiered routing) — solves cost AND rate limits
  Most informative: Branch 2 — reveals actual vLLM vs Anthropic quality gap

DECISION: Branch 2 (tiered routing)
  Why: Addresses root cause (too many Anthropic calls) rather than symptom
  (rate limiting). Also reduces costs. Branch 1 is the fallback if vLLM
  quality issues emerge. Branch 3 is a future optimization, not a primary fix.
```

### Example 2: Bug Fix Strategy

**Problem:** Users report that Bestie conversations sometimes lose context mid-conversation.

```
BRANCH 1: Database investigation — check if messages are being dropped
  Step 1: Query conversation logs for reported users, look for gaps
  Step 2: If gaps found, trace the save path for race conditions
  Best case: Find a clear bug (missing await, transaction failure), fix it
  Worst case: Data looks fine, problem is elsewhere, time spent investigating DB
  Confidence: 3/5
  Reversibility: N/A (investigation, not a change)

BRANCH 2: Context window investigation — check if we're exceeding limits
  Step 1: Log the actual token count being sent to the AI per request
  Step 2: If exceeding context window, messages are being silently truncated
  Best case: Find that long conversations overflow, fix by implementing
            summarization or sliding window
  Worst case: Token counts are fine, problem is elsewhere
  Confidence: 4/5
  Reversibility: N/A (investigation, not a change)

BRANCH 3: Prompt construction investigation — check message ordering
  Step 1: Log the exact prompt being sent to the AI, including system prompt
  Step 2: Check if messages are ordered correctly, if system prompt is
          consuming too much space, if conversation history is complete
  Best case: Find that message ordering is wrong or system prompt is too large
  Worst case: Prompt looks correct, problem is elsewhere
  Confidence: 3/5
  Reversibility: N/A (investigation, not a change)

EVALUATION:
  Since all three are investigations (no risk), run them in parallel.
  Branch 2 has highest confidence — context window overflow is the most
  common cause of "lost context" in LLM applications.

DECISION: Run Branch 2 first (highest probability), then 1 and 3 if needed.
  Add token count logging immediately — this is useful diagnostic
  data regardless of root cause.
```

### Example 3: Feature Design

**Problem:** Users want to share agent conversations with others.

```
BRANCH 1: Public share links (read-only)
  Step 1: Generate unique URLs for conversations, anyone with link can view
  Step 2: Add privacy controls (share/unshare toggle per conversation)
  Best case: Viral sharing, new users discover Stone AI through shared content
  Worst case: Users accidentally share sensitive conversations, privacy incident
  Confidence: 4/5
  Reversibility: Hard — once shared, links may be cached/bookmarked

BRANCH 2: Team/workspace sharing (authenticated)
  Step 1: Add team concept — users can invite others to a workspace
  Step 2: Shared conversations visible to team members only
  Best case: Enterprise use case unlocked, higher-tier conversions
  Worst case: Complex to build, delays other features, low adoption if
             users are mostly individual
  Confidence: 2/5
  Reversibility: Hard — complex feature with data model changes

BRANCH 3: Export to PDF/markdown
  Step 1: Add "Export conversation" button, generates downloadable file
  Step 2: Users share via their own channels (email, Slack, etc.)
  Best case: Simple to build, users get what they need, no privacy risk to us
  Worst case: Less viral than share links, no new user acquisition
  Confidence: 5/5
  Reversibility: Easy — remove button

EVALUATION:
  Best worst-case: Branch 3 (export) — zero privacy risk, easy to build
  Highest expected value: Branch 1 (public links) — viral potential
  Most informative: Branch 1 — reveals if users actually share

DECISION: Build Branch 3 first (1-2 days), then Branch 1 with strong
  privacy defaults (share OFF by default, confirmation dialog, expiring links).
  Skip Branch 2 until enterprise demand is validated.
```

## Generating Distinct Branches

The most common ToT failure is generating three branches that are actually the same idea with different wording. Force distinctness by using these categories:

1. **Fix the symptom** vs **Fix the root cause** vs **Change the system so the problem can't occur**
2. **Build it** vs **Buy it** vs **Work around it**
3. **Optimize the current approach** vs **Replace with a different approach** vs **Remove the need entirely**
4. **Quick and reversible** vs **Thorough and permanent** vs **Experimental and informative**

## Integration

- Use **Chain of Thought** to develop each branch
- Apply **First Principles** when branches seem too similar (you're not thinking deeply enough)
- Use **Inversion** to generate worst-case scenarios for each branch
- Apply **Confidence Calibration** to each branch's probability assessment
- When a branch involves multiple steps, use **Dependency Mapping** to sequence them
