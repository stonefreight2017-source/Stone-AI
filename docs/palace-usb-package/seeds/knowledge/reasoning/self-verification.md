# Self-Verification

## Core Principle

This is THE single highest-ROI technique for closing the quality gap between a 32B parameter model and a frontier model. After generating ANY response, re-read the original question and verify your answer actually addresses it. Most errors aren't reasoning failures — they're ANSWER-QUESTION MISMATCHES that go uncaught.

## The Verification Protocol

After generating your response, BEFORE delivering it:

```
STEP 1: RE-READ THE ORIGINAL QUESTION
  - Read it again. Not your memory of it — the actual text.
  - What was ACTUALLY asked? (Not what you assumed was asked.)

STEP 2: CHECK ALIGNMENT
  - Does my answer address what was ACTUALLY asked?
  - Did I answer a DIFFERENT question than the one posed?
  - Did I answer only PART of a multi-part question?
  - Did I add information that wasn't requested?

STEP 3: LIST 3 WAYS MY ANSWER COULD BE WRONG
  - Way 1: [Specific scenario where my answer fails]
  - Way 2: [Specific scenario where my answer fails]
  - Way 3: [Specific scenario where my answer fails]

  If any are PLAUSIBLE (not just theoretically possible):
  → Revise the answer to address the most likely failure

STEP 4: CONFIDENCE CHECK
  - Rate confidence 1-5 (see Confidence Calibration seed)
  - If below 3: STATE the uncertainty explicitly
  - If above 4: Force one devil's advocate argument
```

## Common Verification Failures

### 1. The Partial Answer
```
QUESTION: "What's the difference between vLLM and Anthropic routing,
           and when should each be used?"

BAD (partial): Explains what vLLM is and what Anthropic is.
  Misses: WHEN each should be used (half the question unanswered).

VERIFICATION CATCH: "The question has two parts: 'what's the difference'
  AND 'when should each be used'. I only answered the first part."

FIXED: Explains both the difference AND the decision criteria for routing.
```

### 2. The Assumed Question
```
QUESTION: "The chat page is slow."

BAD (assumed question): "Try adding React.memo to the message component
  and implementing virtualized scrolling."
  Problem: Assumed the performance issue is in React rendering.
  The actual issue might be API latency, database queries, or AI response time.

VERIFICATION CATCH: "The user stated a symptom, not a diagnosis.
  I jumped to a solution without understanding the cause."

FIXED: "To diagnose this, I'd need to know: Is it slow on initial load,
  or slow during conversation? What does the network tab show?
  Let me check the API response times first."
```

### 3. The Adjacent Answer
```
QUESTION: "How do I add a new tier between PLUS and SMART?"

BAD (adjacent): Explains the pros and cons of adding a new tier,
  discusses pricing strategy, suggests alternatives.
  Problem: Didn't answer HOW. Answered WHETHER.

VERIFICATION CATCH: "The question is HOW (implementation), not WHETHER
  (strategy). I answered the wrong question."

FIXED: Step-by-step implementation: 1) Update Prisma schema enum,
  2) Add tier config in TIER_CONFIG, 3) Update Stripe products,
  4) Update permission checks, 5) Update UI pricing page.
```

### 4. The Over-Answer
```
QUESTION: "What port does our PostgreSQL database run on?"

BAD (over-answer): "PostgreSQL typically runs on port 5432. In Stone AI,
  the database is hosted on Neon. Here's a comprehensive guide to
  PostgreSQL configuration, connection pooling, and performance tuning..."

VERIFICATION CATCH: "The question asks for a port number. The answer
  is '5432'. Everything else is scope creep."

FIXED: "Port 5432 (standard PostgreSQL port)."
```

## The 3 Ways Wrong Exercise

This is the most powerful part of self-verification. For every answer, force yourself to generate three specific failure modes:

```
ANSWER: "Use Redis for session storage."

WAY 1 WRONG: If the session data is complex/large (>1MB), Redis may
  not be the right choice — consider database-backed sessions.

WAY 2 WRONG: If the app runs on Vercel (serverless), Redis connections
  may not persist between invocations — need Upstash or similar.

WAY 3 WRONG: If sessions need to survive Redis restarts, need
  persistence configured (RDB/AOF), which adds complexity.

ASSESSMENT: Way 2 is plausible (Stone AI runs on Vercel).
REVISION: "Use Upstash Redis (serverless-compatible) for session storage,
  or use Clerk's built-in session management which handles this automatically."
```

## When to Verify

**ALWAYS verify:**
- Answers to questions about architecture or design
- Answers that recommend specific actions
- Answers to multi-part questions
- Answers where you're below confidence 4
- Code that handles security, billing, or auth

**Quick verify (Step 1-2 only):**
- Factual answers you're confident about
- Code formatting/style questions
- Simple lookups

**Skip verification:**
- Acknowledgments ("Got it, I'll do X")
- Direct quotes or lookups from provided context
- Repeating back instructions to confirm understanding

## Making Verification Automatic

The goal is to make self-verification a HABIT, not a conscious decision. Build it into your response generation:

```
PATTERN:
  1. Generate response
  2. [PAUSE — don't deliver yet]
  3. Re-read question
  4. Check: Does response match question?
  5. Check: 3 ways wrong — any plausible?
  6. Revise if needed
  7. Deliver

This adds ~10 seconds to response time but eliminates ~40% of errors.
That's the highest ROI investment in response quality possible.
```

## Integration

- **Chain of Thought** Step 5 IS self-verification (use this seed to strengthen it)
- **Confidence Calibration** provides the rating system for Step 4
- **Scope Control** prevents the over-answer failure mode
- Every other seed benefits from self-verification applied to its output
