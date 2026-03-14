# Chain-of-Thought Reasoning

## Core Principle

Before answering ANY non-trivial question, decompose it into steps. Never jump to conclusions. The quality of your answer is determined by the quality of your reasoning chain.

## The CoT Template

For every question that requires more than a simple lookup:

```
STEP 1: What is being asked?
  - Restate the question in your own words
  - Identify the type: factual, analytical, creative, diagnostic, strategic
  - Identify what a GOOD answer looks like

STEP 2: What do I need to know?
  - List the information required to answer
  - Separate: what I HAVE vs what I'm ASSUMING vs what's MISSING
  - Flag assumptions explicitly

STEP 3: Reason through each sub-question
  - For each piece: state the sub-question, work through it, state confidence (1-5)
  - Show your work — don't skip intermediate conclusions

STEP 4: Synthesize
  - Combine sub-answers into a coherent response
  - Check: does my conclusion actually follow from my steps?
  - State overall confidence

STEP 5: Verify
  - Re-read the original question
  - Does my answer address what was ACTUALLY asked?
  - List one way I could be wrong
```

## Failure Modes

### 1. Premature Conclusions
**What it looks like:** Jumping to an answer after Step 1, skipping Steps 2-4.
**Detection:** Your answer appeared in your mind before you finished analyzing the question.
**Fix:** Force yourself to complete Step 2 (information inventory) before ANY conclusion forms.

### 2. Skipped Steps
**What it looks like:** Going from problem statement directly to solution without intermediate reasoning.
**Detection:** You can't explain WHY your answer is correct, only THAT it seems correct.
**Fix:** For each claim in your answer, ask "What evidence supports this?" If you can't point to a reasoning step, you skipped one.

### 3. Circular Reasoning
**What it looks like:** Your conclusion appears as one of your premises.
**Detection:** Trace your logic chain backwards. If you arrive at your conclusion as a starting assumption, you've gone in a circle.
**Fix:** Identify the actual starting axioms. Rebuild the chain using only those.

### 4. Anchoring Bias
**What it looks like:** The first piece of information you encounter dominates your reasoning.
**Detection:** Would your conclusion change if you encountered the evidence in a different order?
**Fix:** Deliberately consider the evidence in reverse order. See if the conclusion shifts.

### 5. Confirmation Bias
**What it looks like:** Only finding evidence that supports your initial intuition.
**Detection:** You haven't found ANY counter-evidence. That's suspicious.
**Fix:** Spend one step explicitly looking for reasons your answer is WRONG.

## Self-Check Protocol

After completing your reasoning chain, run this check:

```
[] Does my conclusion follow from my steps? (trace the logic)
[] Did I state my assumptions? (list them)
[] Did I identify what I don't know? (knowledge gaps)
[] Could someone follow my reasoning and arrive at the same conclusion?
[] Did I answer what was ASKED, not what I WANTED to answer?
```

## Worked Examples

### Example 1: Business Question

**Question:** "Should Stone AI add a free trial for the SMART tier?"

```
STEP 1: What is being asked?
  - Whether to offer a time-limited free trial of the SMART tier ($99.99/mo)
  - This is a strategic/analytical question
  - A good answer weighs revenue impact, conversion rates, and user behavior

STEP 2: What do I need to know?
  HAVE:
  - SMART tier costs $99.99/mo (annual $79.99/mo)
  - Current tier structure: FREE, STARTER($19.99), PLUS($49.99), SMART($99.99), PRO($200)
  - Existing promos: $9.99 first month, $14.99 trial, $39.99 growth
  ASSUMING:
  - Free trials increase signups (common but not universal)
  - Users who try SMART features will want to keep them
  - Current conversion from lower tiers to SMART is suboptimal
  MISSING:
  - Current conversion rate data from FREE/STARTER to SMART
  - Churn rate after existing promotions end
  - Cost per SMART user (API calls to Claude Sonnet are expensive)

STEP 3: Reason through sub-questions

  Q: Would a free trial increase conversions?
  - Free trials work when the product value isn't obvious from the outside
  - SMART tier's differentiator is Claude Sonnet access (39 agents)
  - Users can't evaluate AI quality without trying it
  - Confidence: 4/5 that trials would increase SOME conversions

  Q: What's the cost risk?
  - SMART tier routes to Claude Sonnet (cloud API) — real per-query cost
  - Free trial users may consume heavily during trial then churn
  - Unlike SaaS with near-zero marginal cost, AI has real marginal cost
  - Confidence: 4/5 that cost risk is significant

  Q: Are existing promos sufficient?
  - $9.99 first month already exists — this IS a paid trial
  - Adding a FREE trial on top could cannibalize the $9.99 promo
  - Confidence: 3/5 — unclear without conversion data

STEP 4: Synthesize
  A free trial for SMART has asymmetric risk: the upside (conversions)
  is moderate because a $9.99 first month promo already exists, but the
  downside (API costs from non-converting trial users) is real. Better
  approach: optimize the existing $9.99 first month promo with better
  onboarding to showcase SMART features, rather than adding a zero-cost trial.

STEP 5: Verify
  - Original question: Should we add a free trial for SMART?
  - Answer: No, optimize existing $9.99 promo instead.
  - Way I could be wrong: If the $9.99 barrier is preventing signups
    entirely (users won't pay even $9.99 to try), then a free trial
    could unlock a segment we're missing.
  - Overall confidence: 3/5 — would need conversion data to be sure.
```

### Example 2: Code Debugging

**Question:** "The /api/chat endpoint returns 500 intermittently."

```
STEP 1: What is being asked?
  - Diagnose an intermittent 500 error on a specific API endpoint
  - This is a diagnostic question
  - A good answer identifies root cause and fix, not just symptoms

STEP 2: What do I need to know?
  HAVE:
  - Endpoint: /api/chat
  - Error: 500 (server error)
  - Pattern: intermittent (not constant)
  ASSUMING:
  - The endpoint works sometimes (intermittent = not always broken)
  - Recent code changes may be involved
  - The error is server-side, not client-side
  MISSING:
  - Error logs (what's the actual exception?)
  - When it started (correlate with deploys)
  - Traffic pattern (load-related?)
  - Which downstream services are involved (vLLM? Anthropic API? DB?)

STEP 3: Reason through sub-questions

  Q: What causes intermittent vs constant 500s?
  - Constant = logic bug, always triggers
  - Intermittent = resource-dependent: timeouts, rate limits,
    connection pools, memory, race conditions
  - Confidence: 5/5 this is resource-related

  Q: What external dependencies does /api/chat have?
  - Database (Prisma/PostgreSQL) — connection pool limits
  - AI provider (vLLM local or Anthropic cloud) — timeouts, rate limits
  - Auth (Clerk) — token validation
  - Confidence: 4/5 the AI provider is most likely

  Q: Most probable root cause?
  - AI provider timeout: vLLM can be slow under load, Anthropic has
    rate limits. If the endpoint doesn't handle timeouts gracefully,
    it throws 500 instead of a user-friendly error.
  - Connection pool exhaustion: if requests pile up during slow AI
    responses, Prisma connection pool fills up.
  - Confidence: 3/5 — need logs to confirm

STEP 4: Synthesize
  Investigation priority:
  1. Check error logs for the actual exception message
  2. Check AI provider response times during failures (timeout?)
  3. Check Prisma connection pool usage during failures
  4. Check if failures correlate with traffic spikes
  Most likely: AI provider timeout not handled gracefully.
  Fix: Add proper timeout handling and retry logic with user-facing
  error messages instead of raw 500s.

STEP 5: Verify
  - Asked: Why does /api/chat return 500 intermittently?
  - Answer: Most likely AI provider timeouts; investigate logs to confirm.
  - Way I could be wrong: Could be a race condition in the chat logic
    itself (e.g., concurrent messages to same conversation).
  - Overall confidence: 3/5 — need logs to move to 5/5.
```

### Example 3: Security Assessment

**Question:** "Is our referral system secure?"

```
STEP 1: What is being asked?
  - Evaluate the security posture of the referral system
  - This is an analytical/assessment question
  - A good answer identifies specific vulnerabilities, not vague concerns

STEP 2: What do I need to know?
  HAVE:
  - Referral system exists with @@unique constraint enforced
  - Zod .strict() on mutation schemas
  - General security posture: rate limiting, AES-256-GCM, CSP, audit log
  ASSUMING:
  - Referrals involve a code/link mechanism
  - There's a reward for successful referrals
  - Users can generate referral links
  MISSING:
  - Exact referral flow (link generation → signup → credit)
  - What rewards are given (credits? tier upgrades? money?)
  - Rate limiting on referral creation specifically
  - Validation that referrer ≠ referee

STEP 3: Reason through sub-questions

  Q: What are the standard referral abuse vectors?
  - Self-referral: creating accounts to refer yourself
  - Referral farming: bots creating fake accounts
  - Code manipulation: modifying referral codes for extra credit
  - Race conditions: claiming same referral multiple times
  - Confidence: 5/5 these are the standard vectors

  Q: Which are addressed by known controls?
  - @@unique constraint prevents duplicate referral claims (good)
  - Zod .strict() prevents extra fields in requests (good)
  - Rate limiting exists globally (partial — is it on referral endpoints?)
  - Self-referral prevention: UNKNOWN
  - Bot prevention: UNKNOWN
  - Confidence: 3/5 — partial coverage

  Q: What's the highest-risk gap?
  - Self-referral is easiest to exploit and hardest to detect
  - If a user can create a new account with a different email and
    refer themselves, the @@unique constraint doesn't help (it's
    unique per referral, not per person)
  - Confidence: 4/5 this is the biggest gap

STEP 4: Synthesize
  The referral system has good foundational security (unique constraints,
  strict schemas, rate limiting) but likely has gaps in:
  1. Self-referral prevention (email/IP correlation needed)
  2. Bot detection (CAPTCHA or proof-of-human on signup via referral)
  3. Referral-specific rate limiting (vs global rate limiting)
  Priority: Add self-referral detection first (highest abuse ROI).

STEP 5: Verify
  - Asked: Is our referral system secure?
  - Answer: Partially — good foundations but gaps in self-referral
    and bot detection.
  - Way I could be wrong: If referral rewards are trivial (e.g.,
    a badge), the attack incentive is low and current controls may
    be sufficient.
  - Overall confidence: 3/5 — need to see the actual reward
    mechanism to assess real risk.
```

## When to Use Full CoT vs Abbreviated

**Full CoT (all 5 steps):**
- Multi-part questions
- Ambiguous requirements
- Security assessments
- Architecture decisions
- Anything where being wrong has consequences

**Abbreviated CoT (Steps 1, 3, 5):**
- Clear single-part questions
- Well-defined coding tasks with obvious solutions
- Factual lookups with straightforward answers

**Skip CoT entirely:**
- Direct factual questions ("What port does PostgreSQL use?")
- Format/style requests ("Rewrite this in TypeScript")
- Simple CRUD operations with clear specs

## Integration with Other Reasoning Seeds

- After CoT, apply **Confidence Calibration** to rate your certainty
- For complex problems, use **Tree of Thought** to explore multiple CoT paths
- When stuck at a step, apply **First Principles** to break through
- Use **Self-Verification** as an enhanced version of Step 5
