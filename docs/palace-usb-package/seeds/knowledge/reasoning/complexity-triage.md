# Complexity Triage

## Core Principle

Classify the problem BEFORE choosing an approach. The right method for a simple problem is wrong for a complex one, and vice versa. This is the operational version of Complexity Recognition — focused purely on "what do I DO with this problem?"

## The Classification Decision Tree

```
START: Can I solve this by following a known recipe?

  YES → SIMPLE
    Action: EXECUTE. Follow the recipe. Don't overthink.
    Time: Solve immediately.
    Risk: Low.
    Example: "Add a new page to the app" → follow Next.js conventions.

  NO → Do I know WHAT to investigate to find the solution?

    YES → COMPLICATED
      Action: ANALYZE then execute. Get expertise if needed.
      Time: Hours to days of analysis, then execute.
      Risk: Medium (analysis could be wrong, but knowable).
      Example: "Optimize this slow query" → profile, find bottleneck, fix.

    NO → Can I run small experiments safely?

      YES → COMPLEX
        Action: EXPERIMENT. Small probes, learn, adapt.
        Time: Iterative. Days to weeks of probe-learn-adapt cycles.
        Risk: High uncertainty, but managed by small bets.
        Example: "Will users want feature X?" → build MVP, measure.

      NO → Is this an emergency?

        YES → CHAOTIC
          Action: ACT NOW. Stabilize first, analyze later.
          Time: Immediate. Minutes.
          Risk: Very high, but inaction is worse.
          Example: "Production is down and we don't know why" → restart, then investigate.

        NO → You need more information before classifying.
          Action: RESEARCH for 30 minutes to reclassify.
```

## Response Protocols Per Category

### SIMPLE — Execute

```
PROTOCOL:
  1. Identify the pattern/recipe
  2. Apply it
  3. Verify the result
  4. Move on

RULES:
  - Don't over-engineer simple problems
  - Don't convene a meeting for a simple problem
  - Don't create abstractions for simple problems
  - Total time: minutes to hours

EXAMPLES:
  - Fix a typo in the UI → edit the string, deploy
  - Add an env variable → add to .env, add to Vercel, deploy
  - Update a dependency → npm update, test, deploy
  - Change copy text → find string, replace, deploy
```

### COMPLICATED — Analyze Then Execute

```
PROTOCOL:
  1. Define what you need to know
  2. Gather data (logs, metrics, code review)
  3. Apply expertise (yours or someone else's)
  4. Plan the solution
  5. Execute the plan
  6. Verify the result

RULES:
  - Analysis has a time limit (don't spiral)
  - Get expert input if you're not the expert
  - Document the solution for future reference
  - Total time: hours to days

EXAMPLES:
  - Database query optimization → EXPLAIN ANALYZE, find missing index, add it
  - Auth flow bug → trace the flow, find the gap, fix it
  - Performance issue → profile, identify bottleneck, optimize
  - Security vulnerability → identify vector, assess impact, patch
```

### COMPLEX — Experiment and Adapt

```
PROTOCOL:
  1. Acknowledge you can't predict the outcome
  2. Design a SAFE-TO-FAIL experiment
     - Small scope (affects few users)
     - Reversible (can undo quickly)
     - Measurable (know if it worked)
  3. Run the experiment
  4. Observe what actually happens (not what you expected)
  5. Amplify what works, dampen what doesn't
  6. Repeat

RULES:
  - NO big bang launches for complex problems
  - Accept that the first attempt will be wrong
  - Plan for iteration, not perfection
  - Total time: weeks to months of iterative cycles

EXAMPLES:
  - New pricing model → A/B test with 10% of users for 30 days
  - New feature design → ship to beta users, measure usage, iterate
  - Market positioning → try different messaging, measure conversion
  - Team process change → pilot with one team, measure productivity
```

### CHAOTIC — Stabilize First

```
PROTOCOL:
  1. ACT to stabilize (don't analyze yet)
  2. Establish basic order (something works, even if not optimal)
  3. NOW classify the underlying problem (it's probably Complex or Complicated)
  4. Apply the appropriate protocol

RULES:
  - Speed > correctness in the first step
  - Prefer reversible actions
  - Communicate what you're doing and why
  - Get to a non-chaotic state ASAP, then shift approach
  - Total time for stabilization: minutes to hours

EXAMPLES:
  - Production down → restart services, verify recovery, THEN investigate root cause
  - Data breach → revoke compromised credentials, assess scope, THEN fix vulnerability
  - Critical bug in billing → disable billing endpoint, manual fix for affected users, THEN fix code
```

## Triage Mistakes

### 1. Treating Complex as Complicated
```
SYMPTOM: Spending weeks analyzing a complex problem, expecting to find
         THE answer. The analysis never converges.
FIX: Stop analyzing. Start experimenting. Run a small probe.
```

### 2. Treating Complicated as Simple
```
SYMPTOM: Applying a quick fix that doesn't address the root cause.
         Problem keeps recurring.
FIX: Invest in proper analysis. The quick fix is creating technical debt.
```

### 3. Treating Simple as Complex
```
SYMPTOM: Running experiments and gathering data for a problem with
         a known solution. Overthinking.
FIX: Just do the obvious thing. Not everything needs exploration.
```

### 4. Treating Chaotic as Complicated
```
SYMPTOM: Trying to analyze while the building is on fire.
         Gathering data while users can't use the product.
FIX: Stabilize first. You can't analyze a system that's actively failing.
```

## The 30-Second Triage

For any incoming problem:

```
"Do I know exactly how to fix this?"
  YES → Simple. Fix it now.
  NO →

"Do I know what to investigate?"
  YES → Complicated. Schedule analysis time.
  NO →

"Is anything on fire?"
  YES → Chaotic. Stabilize NOW.
  NO → Complex. Design an experiment.
```

## Integration

- **Complexity Recognition** provides the theory behind this triage
- **OODA** provides the response loop for each category
- **Chain of Thought** is the analysis tool for Complicated problems
- **Tree of Thought** is the experiment design tool for Complex problems
- **Theory of Constraints** identifies which problem to triage first
