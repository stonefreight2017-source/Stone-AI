# OODA Loop — Operationalized

## Core Principle

OODA (Observe-Orient-Decide-Act) is a decision-making loop designed for uncertain, changing environments. This is NOT the textbook version. This is the operational version — how to actually USE it when you're in the middle of a problem.

## The Operational OODA Template

### OBSERVE: "What data do I have vs what am I assuming?"

```
DATA INVENTORY:
  Hard data (logs, metrics, user reports):
  - [list what you can actually see/measure]

  Assumptions (things you believe but haven't verified):
  - [list what you're taking for granted]

  Gaps (things you need but don't have):
  - [list what's missing]

  CRITICAL CHECK: Am I observing reality or my expectations?
  - If you expected X and saw Y, trust Y. Your model is wrong.
```

### ORIENT: "What mental models apply? Which are wrong here?"

```
MENTAL MODELS IN PLAY:
  - What framework am I using to interpret this data?
  - Is this a [type of problem] or am I pattern-matching incorrectly?

  MODEL CHALLENGES:
  - What would a person who disagrees with me see in this data?
  - What if the opposite of my assumption is true?
  - Am I anchored to a previous similar situation that's actually different?

  REFRAME:
  - Given ONLY the hard data (not assumptions), what's the
    simplest explanation?
```

### DECIDE: "Given uncertainty, what's the minimum viable decision?"

```
OPTIONS:
  1. [Action A] — Expected outcome: ___ Risk: ___
  2. [Action B] — Expected outcome: ___ Risk: ___
  3. [Do nothing] — Expected outcome: ___ Risk: ___

  DECISION CRITERIA:
  - Which option gives me the most information? (prefer learning)
  - Which option is most reversible? (prefer reversible)
  - Which option has the best worst-case? (minimax)

  DECISION: [Choose one]
  REVERSAL TRIGGER: "I'll reverse this if [specific condition]"
```

### ACT: "Execute and set up next observation"

```
EXECUTING: [The decision]

  OBSERVATION POINTS SET:
  - I'll check [metric/outcome] in [timeframe]
  - Success looks like: [specific, measurable]
  - Failure looks like: [specific, measurable]
  - If ambiguous after [timeframe], I'll [next action]
```

## Tempo: When to Loop Fast vs Slow

### Fast OODA (seconds to minutes)
**Use for:** Incident response, production outages, security breaches, live demos breaking

```
Fast loop pattern:
  OBSERVE: Check error logs/dashboard (30 seconds)
  ORIENT: Is this a known failure mode? (15 seconds)
  DECIDE: Apply known fix OR rollback (15 seconds)
  ACT: Execute fix, verify recovery (1-5 minutes)

  RULE: In fast OODA, bias toward REVERSIBLE actions.
  Rollback > hotfix. Disable feature > debug in production.
```

**Example — Production Outage:**
```
OBSERVE: 500 errors spiking on /api/chat. Started 3 minutes ago.
  Hard data: Error rate 40%. DB connections normal.
  Last deploy: 2 hours ago.

ORIENT: Not a deploy issue (too long ago). Not DB (connections fine).
  AI provider? Check vLLM/Anthropic status.
  Finding: Anthropic API returning 429 (rate limited).

DECIDE:
  Option A: Wait for rate limit to reset (~unknown time)
  Option B: Failover to vLLM for all requests
  Option C: Enable queue/retry logic
  Choosing B — fastest recovery, reversible.

ACT: Switch AI routing to vLLM. Monitor error rate.
  Check in 2 minutes. Success = error rate < 1%.
  If vLLM also fails → Option C.
```

### Slow OODA (hours to days)
**Use for:** Strategy decisions, architecture changes, pricing changes, market positioning

```
Slow loop pattern:
  OBSERVE: Gather data from multiple sources (hours/days)
  ORIENT: Challenge assumptions, get outside perspectives (hours)
  DECIDE: Evaluate options against long-term goals (hours)
  ACT: Execute with measurement plan (days/weeks)

  RULE: In slow OODA, bias toward INFORMATION GATHERING.
  More data > faster decision. Reversibility matters less
  because you have time to get it right.
```

**Example — Pricing Strategy:**
```
OBSERVE: (over 1 week)
  - Conversion rate FREE→STARTER: 3.2%
  - Conversion rate STARTER→PLUS: 8.1%
  - Conversion rate PLUS→SMART: 2.4%
  - Churn rate by tier: FREE 60%, STARTER 12%, PLUS 8%, SMART 4%
  - Competitor pricing: $10-30 for similar features

ORIENT:
  - PLUS→SMART conversion is low (2.4%). The $49.99→$99.99
    jump is too steep.
  - But SMART churn is lowest (4%) — those who get there, stay.
  - The problem isn't SMART value, it's the price cliff.
  - Mental model check: Am I anchored to round numbers?
    Would $84.99 (annual) feel different psychologically?

DECIDE:
  Option A: Add a tier between PLUS and SMART ($74.99)
  Option B: Improve SMART annual pricing visibility ($84.99/mo annual)
  Option C: Add 14-day SMART trial for PLUS users

  Choosing C — lowest risk, directly tests whether SMART value
  converts PLUS users. Reversible. Gives data for A/B decisions.
  Reversal trigger: If trial→conversion < 15% after 30 days.

ACT:
  - Build SMART trial for PLUS users (1 week)
  - Enable for 50% of PLUS users (A/B test)
  - Measure: trial starts, trial→paid conversion, churn after trial
  - Check results at day 14 and day 30
```

## OODA Anti-Patterns

### 1. Observation Loops (never deciding)
**Symptom:** Gathering more and more data, never acting.
**Fix:** Set a decision deadline BEFORE you start observing. "I'll decide by [time] with whatever I have."

### 2. Orientation Lock (one mental model)
**Symptom:** Interpreting all data through one framework.
**Fix:** Force yourself to state the interpretation someone who DISAGREES with you would have.

### 3. Decision Paralysis (too many options)
**Symptom:** Options keep multiplying but none get chosen.
**Fix:** Reduce to 3 options max. If you can't, you haven't oriented properly — go back to Orient.

### 4. Action Without Observation (cowboy mode)
**Symptom:** Acting immediately without checking data.
**Fix:** Minimum viable observation — even 30 seconds of data checking before acting.

### 5. Skipping the Loop Reset
**Symptom:** Acting, then moving to the next problem without checking if the action worked.
**Fix:** Every ACT phase MUST include observation points for the next loop.

## Integration

- **Chain of Thought** is how you execute each OODA phase
- **First Principles** is your best Orient tool — strips bad mental models
- **Inversion** in the Decide phase — "which option guarantees failure?"
- **Confidence Calibration** — rate your confidence at each phase
- **Theory of Constraints** — during Orient, identify the binding constraint
