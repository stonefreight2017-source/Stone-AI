# Complexity Recognition

## Core Principle

Different types of problems require fundamentally different approaches. Applying a complicated solution to a complex problem fails. Applying a complex solution to a simple problem wastes resources. Classify the problem FIRST, then choose the approach.

## The Cynefin Framework (Operational)

### 1. SIMPLE (Clear) — "Known knowns"

**Characteristics:**
- Cause and effect are obvious and repeatable
- Best practices exist and work every time
- Anyone with basic training can handle it
- "If X, then Y" — always

**Detection signals:**
- You've solved this exact problem before with the same solution
- A checklist or runbook exists
- There's a "right answer" everyone agrees on
- Failure comes from not following the known process

**Correct approach:** Sense → Categorize → Respond
- Identify what type of problem it is
- Apply the known best practice
- Don't overthink it — just execute

**Examples in Stone AI context:**
- Adding a new static page: follow the Next.js page template
- Updating copy text: find the string, replace it
- Adding a new environment variable: follow the env setup checklist

**Danger:** Complacency. Simple problems can become complicated if context changes and you don't notice.

### 2. COMPLICATED — "Known unknowns"

**Characteristics:**
- Cause and effect exist but require expertise to find
- Multiple right answers exist; experts may disagree on which is best
- Analysis leads to a good solution
- Predictable once you understand it, but understanding takes work

**Detection signals:**
- You need to investigate before you can solve
- An expert would know the answer, but it's not obvious to everyone
- There are multiple valid approaches with different tradeoffs
- The problem is solvable with enough analysis

**Correct approach:** Sense → Analyze → Respond
- Gather data
- Apply expert knowledge
- Choose among good options based on context
- The solution can be planned in advance

**Examples in Stone AI context:**
- Optimizing a slow database query: requires analysis but the solution is deterministic
- Choosing between caching strategies: expert decision with clear tradeoffs
- Configuring Cloudflare security rules: complicated but documented

**Danger:** Analysis paralysis. You have enough information to decide — stop analyzing and act.

### 3. COMPLEX — "Unknown unknowns"

**Characteristics:**
- Cause and effect are only clear IN RETROSPECT
- The system is unpredictable — small changes can have large effects
- Emergent behavior: the whole is different from the sum of parts
- No expert can predict outcomes with confidence
- The system changes as you interact with it

**Detection signals:**
- Experts disagree fundamentally (not just on details)
- Past solutions don't work even though the problem looks similar
- The problem keeps shifting as you try to solve it
- Unintended consequences keep appearing
- "It depends" is the honest answer to most questions

**Correct approach:** Probe → Sense → Respond
- Run small, safe-to-fail experiments
- Observe what happens (don't predict)
- Amplify what works, dampen what doesn't
- Accept that you're navigating, not engineering

**Examples in Stone AI context:**
- User behavior with a new feature: you CANNOT predict how users will use it
- Market positioning: the competitive landscape changes as you enter it
- Scaling from 100 to 10,000 users: problems emerge that don't exist at small scale
- Team culture as you grow: adding people changes dynamics unpredictably

**Danger:** Trying to "engineer" a solution. Complex systems resist planned outcomes. Experiment instead.

### 4. CHAOTIC — "No knowns"

**Characteristics:**
- No relationship between cause and effect is discoverable
- The situation is turbulent and unstable
- Waiting for information makes things worse
- Any action is better than no action

**Detection signals:**
- Multiple crises simultaneously
- Normal processes have broken down
- Nobody knows what's happening
- The situation is deteriorating rapidly

**Correct approach:** Act → Sense → Respond
- Take immediate action to stabilize
- Create enough order to assess
- Move the situation from chaotic to complex
- Then probe and experiment

**Examples in Stone AI context:**
- Major security breach in progress: act first (shut down access), analyze after
- Production completely down with unknown cause: restart services, then investigate
- Data corruption discovered: stop writes, snapshot current state, then figure out scope

**Danger:** Staying in crisis mode after stabilization. Once things are stable, shift to Complex or Complicated approach.

## Warning Signs of Emergence and Nonlinearity

Your problem has moved from Complicated to Complex when:

```
[] Adding more resources doesn't proportionally improve outcomes
[] The system produces unexpected behaviors nobody designed
[] Optimization of individual parts degrades overall performance
[] Historical data stops predicting future performance
[] Stakeholders' models of the system conflict fundamentally
[] Small changes produce disproportionately large effects
[] The same intervention produces different results each time
```

## When "Just Add More" Stops Working

A critical recognition point: many problems seem simple at small scale (add more servers, add more features, add more people) but become complex at larger scale.

**Scaling thresholds where simple stops working:**

```
USERS:
  <100: Everything is simple. Fix bugs manually. Personal support.
  100-1000: Complicated. Need monitoring, automated support, performance tuning.
  1000-10000: Complex. User behavior patterns emerge. Features interact unpredictably.
  >10000: Systems effects. Your product IS a platform. Emergent communities.

CODEBASE:
  <10K lines: Simple. One person understands everything.
  10K-100K: Complicated. Need architecture, documentation, conventions.
  100K-1M: Complex. Nobody understands the whole system. Emergent bugs.
  >1M: Need organizational structure around the code.

TEAM:
  1-3 people: Simple. Direct communication. Shared context.
  4-8: Complicated. Need processes, code review, documentation.
  9-20: Complex. Communication overhead. Subteams form. Culture emerges.
  >20: Organizational design IS the product.
```

## Classification Checklist

Before solving any problem, classify it:

```
1. Can I solve this with a known recipe?
   YES → SIMPLE. Follow the recipe.
   NO → Continue.

2. Can an expert analyze this and plan a solution?
   YES → COMPLICATED. Get expertise, analyze, plan, execute.
   NO → Continue.

3. Is this unpredictable but explorable through experiments?
   YES → COMPLEX. Probe with safe-to-fail experiments.
   NO → Continue.

4. Is this a crisis requiring immediate action?
   YES → CHAOTIC. Act first, analyze later.
```

## Integration

- **Chain of Thought** works for Simple and Complicated problems
- **Tree of Thought** works for Complicated and Complex problems (multiple approaches)
- **OODA** works for all categories but especially Chaotic (fast loop) and Complex (slow loop)
- **First Principles** helps when you've misclassified a problem as simpler than it is
- **Feedback Loops** are the mechanism that makes Complex systems unpredictable
