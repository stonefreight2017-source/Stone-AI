# Theory of Constraints

## Core Principle

Every system has ONE bottleneck that limits its throughput. Improving anything that is NOT the bottleneck is waste. Find the constraint, exploit it, then elevate it. This is the most efficient framework for optimization because it prevents you from optimizing the wrong thing.

## The 5-Step Process

```
STEP 1: IDENTIFY the constraint
  "What is the ONE thing that, if improved, would improve the whole system?"

  Method: Follow the work through the system. Where does it pile up?
  Where do things wait? That's the bottleneck.

  WARNING: The constraint is often NOT where you think it is.
  The loudest problem is rarely the actual bottleneck.

STEP 2: EXPLOIT the constraint
  "How do I get maximum output from the constraint WITHOUT adding resources?"

  This means: remove waste from the bottleneck. Every minute the
  constraint is idle is a minute the WHOLE SYSTEM is idle.

  Questions:
  - Is the constraint ever waiting for input?
  - Is the constraint doing work that could be done elsewhere?
  - Is the constraint producing output that gets wasted downstream?

STEP 3: SUBORDINATE everything else to the constraint
  "Every other part of the system should serve the constraint."

  This means: non-bottleneck resources should operate at the pace of
  the bottleneck, not at their own maximum capacity. Overproducing
  upstream of the bottleneck creates waste (inventory piles up).

STEP 4: ELEVATE the constraint
  "Now add resources/capacity to the constraint."

  This is where you invest: more hardware, more people, better tools,
  architectural changes. But ONLY after steps 1-3. Elevating without
  exploiting first wastes the investment.

STEP 5: REPEAT — the constraint has moved
  "After elevating, a NEW bottleneck emerges. Go back to Step 1."

  The constraint is never "solved" — it just moves to the next
  weakest link. This is a continuous process.
```

## Applied Examples

### Code Performance

**Scenario:** Stone AI dashboard takes 4 seconds to load.

```
STEP 1: IDENTIFY
  Measure each component:
  - Server receives request: 5ms
  - Auth check (Clerk): 150ms
  - Database query (agents): 800ms  ← CANDIDATE
  - Database query (user settings): 200ms
  - AI provider status check: 1200ms  ← CONSTRAINT
  - React render: 600ms
  - Network transfer: 300ms

  CONSTRAINT: AI provider status check (1200ms, 30% of total time)

STEP 2: EXPLOIT
  - Is this check needed on every page load? → No, only on chat page
  - Can it be cached? → Yes, status changes rarely, cache for 30 seconds
  - Can it be async? → Yes, load the page first, check status in background

  Result: Remove from critical path. Dashboard loads in 2.8 seconds.

STEP 3: SUBORDINATE
  - Don't optimize the 5ms server receipt time — it's irrelevant
  - Don't optimize auth (150ms) — it's not the bottleneck
  - Focus effort on the NEW constraint after exploiting

STEP 4: ELEVATE (if exploit wasn't enough)
  - Move status check to a WebSocket that maintains connection
  - Pre-fetch on login, not on page load

STEP 5: REPEAT
  New constraint: Database query (800ms). Now optimize THAT.
  - Missing index? N+1 query? Over-fetching columns?
```

### Team Productivity

**Scenario:** Feature development is too slow.

```
STEP 1: IDENTIFY
  Trace a feature from idea to production:
  - Idea → Requirements: 1 day
  - Requirements → Design: 2 days
  - Design → Development: 5 days
  - Development → Code Review: 3 days WAITING  ← CONSTRAINT
  - Code Review → Testing: 1 day
  - Testing → Deploy: 0.5 days

  CONSTRAINT: Code review wait time (3 days of idle waiting)
  Note: Development takes longest (5 days) but it's ACTIVE work.
  The constraint is the WAIT, not the work.

STEP 2: EXPLOIT
  - Why 3 days? → Reviewer is busy with their own development
  - Can reviews be smaller? → Yes, break PRs into smaller chunks
  - Can reviews be prioritized? → Yes, "review first, code second" policy
  - Can reviews be faster? → Yes, PR templates with review checklist

  Result: Review wait drops from 3 days to 0.5 days.

STEP 3: SUBORDINATE
  - Development should produce REVIEWABLE chunks, not massive PRs
  - Testing should prepare test plans DURING development, not after review
  - Don't add more developers — they'll just create more review queue

STEP 4: ELEVATE
  - Add automated checks (linting, type checking, test coverage) to
    reduce what humans need to review
  - Pair programming for complex features (eliminates review step)

STEP 5: REPEAT
  New constraint: Development (5 days). Now focus on developer productivity.
```

### Business Growth

**Scenario:** Stone AI revenue isn't growing fast enough.

```
STEP 1: IDENTIFY
  Trace the revenue pipeline:
  - Visitors: 10,000/month
  - Signups: 500 (5% conversion)
  - Free→Paid: 15 (3% conversion)  ← CANDIDATE
  - Monthly churn: 4 users
  - Revenue per user: $45 average

  Math: 15 new paid - 4 churned = 11 net new per month = $495/month growth

  Where's the constraint?
  - 5% visitor→signup is actually decent
  - 3% free→paid is LOW  ← CONSTRAINT
  - Churn is manageable

  CONSTRAINT: Free-to-paid conversion (3%)

STEP 2: EXPLOIT
  - Why don't free users convert? What's the gap?
  - Are free users experiencing the product's value? (Do they USE 4 agents?)
  - Is the upgrade path clear? (Do they know what they're missing?)
  - Is the price objection or value objection?

  Actions without spending money:
  - Add "you've hit the free limit" messaging when users try agent #5
  - Show STARTER features in the UI with "upgrade" badges
  - Email free users who've been active 7+ days with conversion offer

STEP 3: SUBORDINATE
  - Don't spend on more traffic (that's not the constraint)
  - Don't add more features to paid tiers (users aren't seeing current value)
  - Focus marketing on CONVERSION, not awareness

STEP 4: ELEVATE
  - Improve onboarding to show value of paid features
  - Add the $9.99 first month promo prominently
  - Consider feature-limited trials of higher tiers

STEP 5: REPEAT
  If conversion doubles to 6% → 30 new paid - 4 churned = 26 net new
  New constraint might become: churn (need to improve retention)
  or traffic (need more visitors)
```

### Infrastructure

**Scenario:** Deployment pipeline is unreliable.

```
STEP 1: IDENTIFY
  Pipeline steps and failure rates:
  - Build: 95% success (5% fail on dependency issues)
  - Lint/Type check: 98% success
  - Tests: 80% success (20% flaky tests!)  ← CONSTRAINT
  - Deploy to staging: 99% success
  - Deploy to production: 97% success

  CONSTRAINT: Flaky tests (20% failure rate kills pipeline reliability)
  Overall pipeline success: 0.95 × 0.98 × 0.80 × 0.99 × 0.97 = 72%
  One in four deployments fails due to test flakiness alone.

STEP 2: EXPLOIT
  - Which tests are flaky? Track failure rates per test.
  - Are they timing-dependent? Add proper waits/mocks.
  - Are they order-dependent? Isolate test state.
  - Can flaky tests be quarantined? Run them separately,
    don't let them block the pipeline.

STEP 3: SUBORDINATE
  - Don't optimize build time (95% is fine)
  - Don't add more tests until existing ones are reliable
  - Every new test must pass 10 consecutive runs before merging

STEP 4: ELEVATE
  - Rewrite the worst flaky tests from scratch
  - Add test infrastructure (proper mocking, test databases, snapshots)
  - Implement automatic retry for known-flaky tests (temporary, with tracking)

STEP 5: REPEAT
  If tests reach 98% → pipeline becomes 0.95 × 0.98 × 0.98 × 0.99 × 0.97 = 88%
  New constraint: Build reliability (5% failure) or production deploy (3% failure)
```

## Finding the Real Constraint

The constraint is often hidden. Use these detection methods:

```
QUEUE METHOD: Where do things pile up and wait?
  - Code waiting for review = review is the constraint
  - Users waiting for AI responses = AI inference is the constraint
  - Features waiting for deploy = deploy pipeline is the constraint

UTILIZATION METHOD: What resource is at 100%?
  - CPU at 100% = compute is the constraint
  - Developer always busy = that developer is the constraint
  - API rate limit hit constantly = API capacity is the constraint

IMPACT METHOD: What single improvement would help the most?
  - If you could magically fix ONE thing, what would move the
    needle most? That's probably the constraint.
```

## Common Mistakes

1. **Optimizing non-constraints.** Making a fast step faster doesn't help. Only the bottleneck matters.
2. **Adding capacity everywhere.** Expensive and wasteful. Add capacity ONLY at the constraint.
3. **Confusing busy with bottleneck.** A resource can be busy without being the constraint. The constraint is where THROUGHPUT is limited.
4. **Skipping Step 2 (Exploit).** Jumping to Step 4 (Elevate/invest) without first extracting maximum value from what you have.

## Integration

- Use **Chain of Thought** to identify the constraint (Step 1)
- Use **First Principles** to understand WHY it's a constraint
- Use **Second-Order Effects** to predict what happens when you fix it (Step 5)
- Use **OODA** for fast constraint identification during incidents
