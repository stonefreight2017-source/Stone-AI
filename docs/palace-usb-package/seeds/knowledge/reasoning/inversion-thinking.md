# Inversion Thinking

## Core Principle

Instead of asking "How do I succeed?", ask "How do I guarantee failure?" then avoid those things. Smaller models default to forward-only thinking — they rush toward solutions. Inversion forces you to map the failure space first, which often reveals risks that forward thinking misses entirely.

## The Inversion Template

```
STEP 1: State the goal clearly
  "I want to [specific outcome]."

STEP 2: List 5+ ways to GUARANTEE failure
  "If I wanted to absolutely, certainly FAIL at this, I would..."
  - Be specific. Vague failures ("do a bad job") don't help.
  - Think about: neglect, wrong priorities, wrong timing, wrong audience,
    ignoring feedback, over-engineering, under-engineering.

STEP 3: Invert each failure into a principle
  For each guaranteed failure, state the opposite as a rule to follow.

STEP 4: Prioritize by impact
  Rank the inverted principles. The failures that are most likely AND
  most catastrophic become your highest-priority guardrails.
```

## Worked Examples

### Example 1: Launching Stone AI Successfully

```
GOAL: Launch Stone AI as a profitable, growing SaaS product.

GUARANTEED FAILURES:
1. Ship with critical bugs in billing (users charged wrong amounts,
   double charges, can't cancel)
2. Make onboarding confusing so users never discover core value
   (44 agents, but users don't know which to use)
3. Price so high that free-tier users never convert (no stepping
   stone between $0 and $19.99)
4. Ignore performance — AI responses take 10+ seconds, users leave
5. No monitoring — site goes down and we find out from Twitter
6. Build features nobody asked for while ignoring bugs users report
7. Make the free tier so good nobody needs to pay

INVERTED PRINCIPLES (prioritized):
1. BILLING MUST BE BULLETPROOF — Test every payment path.
   Verify charges, refunds, cancellations, tier changes,
   annual-to-monthly switches. This is trust.
2. ONBOARDING MUST SHOW VALUE IN 60 SECONDS — Guide new users
   to one successful agent interaction immediately. Don't
   overwhelm with 44 options.
3. PERFORMANCE IS A FEATURE — AI response time under 3 seconds
   or users leave. Measure, optimize, cache.
4. MONITOR EVERYTHING — Uptime checks, error rates, billing
   anomalies. Know before users do.
5. FREE TIER = TASTE, NOT MEAL — 4 agents is enough to hook,
   not enough to satisfy. The upgrade must feel natural.
6. FIX BUGS BEFORE FEATURES — Reported bugs are higher priority
   than new features. Always.
7. PRICE THE STEPPING STONES — $9.99 first month promo bridges
   the $0-to-$19.99 gap. Make sure users know about it.
```

### Example 2: Retaining Users

```
GOAL: Keep users subscribed and active month over month.

GUARANTEED FAILURES:
1. Never follow up after signup — user forgets the product exists
2. Make it hard to cancel (dark patterns) — generates hatred and chargebacks
3. Never add new value — same product month 6 as month 1
4. Ignore power users — they churn to competitors who reward engagement
5. Break things in updates — users lose trust when features they rely on break

INVERTED PRINCIPLES:
1. RE-ENGAGE PROACTIVELY — Email/notification when user hasn't
   visited in 7 days. Show them what's new.
2. MAKE CANCELLATION EASY — One click. Offer a pause option.
   Easy cancellation builds trust and reduces chargebacks.
3. SHIP IMPROVEMENTS MONTHLY — Users need to see the product
   getting better. Changelog, release notes, "what's new" prompts.
4. REWARD POWER USERS — OG badges, early access, feedback channels.
   Power users are your evangelists.
5. DON'T BREAK WHAT WORKS — Test before deploy. Rollback plan
   for every release. Canary deploys.
```

### Example 3: Securing the Platform

```
GOAL: Prevent security breaches and protect user data.

GUARANTEED FAILURES:
1. Trust client-side input — let users send whatever they want to APIs
2. Use the same error messages for everything — leak stack traces,
   DB schemas, internal paths
3. Never rotate secrets — same API keys for years
4. Give every service full database access — one compromise = total breach
5. Skip auth checks on "internal" endpoints — assume network = trusted

INVERTED PRINCIPLES:
1. VALIDATE EVERYTHING SERVER-SIDE — Zod .strict() on every mutation.
   Never trust req.body without validation.
2. GENERIC ERROR MESSAGES TO USERS — Log details server-side, show
   users only "Something went wrong" + error ID for support.
3. ROTATE SECRETS ON A SCHEDULE — API keys, DB passwords, JWT secrets.
   Automate if possible.
4. LEAST PRIVILEGE — Each service gets only the DB access it needs.
   Read-only where possible.
5. ZERO TRUST INTERNALLY — Every endpoint validates auth.
   No endpoint is "internal only." Assume the network is compromised.
```

## Why Smaller Models Need This

Smaller models (including 32B parameter models) have a strong forward-reasoning bias:
- They see a goal and immediately generate steps toward it
- They rarely spontaneously consider failure modes
- They over-weight the "happy path" and under-weight edge cases

Inversion compensates for this by forcing failure-mode analysis BEFORE solution generation. It's a mechanical process that doesn't require the intuition that larger models develop from broader training.

## When to Use Inversion

**Always:**
- Before any launch or release
- When designing security controls
- When creating a new feature spec
- When the stakes of failure are high

**Sometimes:**
- When you're stuck on a forward approach
- When a plan feels "too easy" — inversion reveals what you're missing

**Skip:**
- Routine tasks with well-known solutions
- Time-critical responses where forward action is more valuable

## Common Mistakes

1. **Being too vague.** "Do a bad job" is not useful. "Ship without testing the Stripe webhook handler" is useful.
2. **Not prioritizing.** All failures are not equal. A billing bug is worse than a CSS glitch.
3. **Stopping at inversion.** The inverted principles must become ACTION ITEMS, not just observations.
4. **Only inverting once.** Re-run inversion at each project phase. The failure modes at launch differ from the failure modes at scale.

## Integration

- Feed inverted principles into **Chain of Thought** as constraints
- Use **Second-Order Effects** to trace what happens if a failure occurs despite precautions
- Apply **Theory of Constraints** to identify which failure would be most catastrophic
- Use **OODA** to respond when a failure actually happens
