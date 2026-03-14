# First Principles Thinking

## Core Principle

Most reasoning builds on assumptions inherited from others. First principles thinking strips away assumptions to find bedrock truths, then rebuilds from there. This is how you avoid cargo-culting solutions that don't fit your actual problem.

## The 5-Layer Drill Template

For any claim, assumption, or proposed solution, drill through these layers:

```
LAYER 1 — Surface Claim
  "What is being stated or proposed?"
  Write the claim as a single sentence.

LAYER 2 — Underlying Assumption
  "What must be true for this claim to hold?"
  List every assumption. Be ruthless — most claims rest on 3-5 unexamined assumptions.

LAYER 3 — Evidence for Each Assumption
  "What evidence supports each assumption?"
  For each assumption from Layer 2:
  - Direct evidence (data, measurements, observations)
  - Indirect evidence (analogies, expert opinions)
  - No evidence (just convention or habit)
  Mark each: SUPPORTED / WEAK / UNSUPPORTED

LAYER 4 — Alternative Explanations
  "What else could explain the same observations?"
  For each assumption marked WEAK or UNSUPPORTED:
  - Generate 2-3 alternative explanations
  - Could the opposite be true?

LAYER 5 — Bedrock Truth
  "What do I actually KNOW vs what am I GUESSING?"
  State only what survives all four layers above.
  This is your foundation. Build from here.
```

## Decision Rule

After drilling:
- If bedrock truth supports the original claim → proceed with confidence
- If bedrock truth contradicts the claim → reject it, no matter how popular it is
- If bedrock truth is insufficient → you need more data before deciding

## Worked Examples

### Business Example: "We Need More Features"

```
LAYER 1 — Surface Claim
  "Stone AI needs more features to compete."

LAYER 2 — Underlying Assumptions
  A1: Users leave because of missing features
  A2: Competitors win because they have more features
  A3: More features = more value to users
  A4: We have the resources to build and maintain more features
  A5: Users can discover and use additional features

LAYER 3 — Evidence
  A1: WEAK — Do we have exit survey data? Or are users leaving
      because of bugs, performance, or confusion?
  A2: UNSUPPORTED — Have we asked churned users if they went to
      a competitor? Which competitor? For which feature?
  A3: WEAK — Feature bloat is a known anti-pattern. More features
      can decrease usability. Value ≠ feature count.
  A4: UNSUPPORTED — Each feature has ongoing maintenance cost.
      44 agents already. Each new feature multiplies test surface.
  A5: WEAK — If users don't find existing features, adding more
      won't help. Discoverability may be the actual problem.

LAYER 4 — Alternatives
  A1 alt: Users leave because onboarding doesn't show them
          existing features' value
  A2 alt: Competitors win on marketing/distribution, not features
  A3 alt: Fewer, polished features > many rough features
  A5 alt: Users need better guidance, not more options

LAYER 5 — Bedrock Truth
  KNOW: We have 44 agents across 5 tiers
  KNOW: Feature count is already high
  DON'T KNOW: Why users actually churn
  DON'T KNOW: What competitors are doing that works

  CONCLUSION: "We need more features" is unsupported.
  The real question is: "Why are users leaving?"
  Get churn data before building anything new.
```

### Code Example: "The API Is Slow"

```
LAYER 1 — Surface Claim
  "The /api/agents endpoint is slow and needs optimization."

LAYER 2 — Underlying Assumptions
  A1: The endpoint IS slow (not just perceived as slow)
  A2: The slowness is in our code (not network/client)
  A3: Optimization will fix it (vs architectural change)
  A4: This endpoint's performance matters (is it on a critical path?)

LAYER 3 — Evidence
  A1: NEED DATA — What's the p50/p95/p99 latency? What's "slow"?
      200ms? 2s? 20s? "Slow" without numbers is meaningless.
  A2: WEAK — Is the database query slow? Is it the AI call?
      Is it serialization? Is it the client re-rendering?
  A3: WEAK — If the bottleneck is a downstream AI call that takes
      3 seconds, optimizing our code from 50ms to 5ms doesn't matter.
  A4: SUPPORTED — Agent listing is on the main dashboard,
      users hit it every session.

LAYER 4 — Alternatives
  A1 alt: The endpoint is fast but the UI renders slowly
  A2 alt: The database is the bottleneck (missing index, N+1 query)
  A3 alt: Caching eliminates the problem without code optimization
  A3 alt: The real fix is pagination (don't load all 44 agents at once)

LAYER 5 — Bedrock Truth
  KNOW: The endpoint serves agent data for the dashboard
  KNOW: It's on a critical user path
  DON'T KNOW: Actual latency numbers
  DON'T KNOW: Where in the stack the time is spent

  CONCLUSION: Before optimizing anything, measure.
  Add timing to: DB query, business logic, serialization,
  network transfer. Optimize the slowest component,
  not the one you assume is slow.
```

### Security Example: "We Need More Encryption"

```
LAYER 1 — Surface Claim
  "We should encrypt more data to improve security."

LAYER 2 — Underlying Assumptions
  A1: More encryption = more security
  A2: Our current encryption is insufficient
  A3: The threat we're defending against requires encryption
  A4: We can manage the additional key management complexity
  A5: Encrypted data is safe even if accessed

LAYER 3 — Evidence
  A1: WEAK — Encryption protects data at rest and in transit.
      It does NOT protect against: auth bypass, injection, IDOR,
      logic bugs, social engineering, insider threats.
  A2: NEED DATA — Current: AES-256-GCM for sensitive fields,
      HTTPS for transit, hashed secrets. What's NOT encrypted
      that should be?
  A3: WEAK — What's the actual threat model? If the threat is
      SQL injection, encryption doesn't help (the app decrypts
      before serving). If the threat is DB server compromise,
      encryption at rest helps.
  A4: WEAK — Key management is where encryption fails in practice.
      More encryption = more keys = more rotation = more
      complexity = more things to go wrong.
  A5: UNSUPPORTED — If the application decrypts data to serve it,
      and the attacker exploits the application, the encryption
      is bypassed entirely.

LAYER 4 — Alternatives
  A1 alt: Better access controls might be more effective than
          more encryption
  A3 alt: The actual threat is authorization (IDOR), not
          data-at-rest exposure
  A4 alt: Simplifying the security model may be safer than
          adding encryption complexity

LAYER 5 — Bedrock Truth
  KNOW: AES-256-GCM is already in use for sensitive fields
  KNOW: HTTPS is enforced
  KNOW: Encryption doesn't prevent application-level attacks
  DON'T KNOW: What the specific threat is that prompted this

  CONCLUSION: "More encryption" is not a security strategy.
  Start with: What specific attack are we defending against?
  Then choose the control that addresses THAT attack.
  Often the answer is better authorization, not more encryption.
```

## When to Apply First Principles

**Always use when:**
- Someone says "we should" or "we need to" without data
- A solution is proposed before the problem is defined
- You're copying what a competitor/tutorial does without understanding why
- The same problem keeps recurring despite fixes
- A decision feels obvious — obvious decisions deserve the most scrutiny

**Skip when:**
- The problem is well-understood and the solution is proven
- You're following an established, validated pattern
- Time pressure requires action over analysis (switch to OODA)

## Common Traps

1. **Stopping at Layer 2.** Identifying assumptions feels productive but isn't enough. You must evaluate them.
2. **Accepting weak evidence.** "Everyone does it this way" is not evidence. It's convention.
3. **Analysis paralysis.** First principles is for DECISIONS, not for everything. Don't drill 5 layers deep on what color a button should be.
4. **Rebuilding everything.** Finding that an assumption is wrong doesn't mean the whole solution is wrong. Surgical replacement, not full rebuilds.

## Integration

- Use **Chain of Thought** to structure the drill process
- Feed bedrock truths into **Tree of Thought** for solution generation
- Apply **Confidence Calibration** to each layer's evidence assessment
- Use **Theory of Constraints** to identify which bedrock truth matters most
