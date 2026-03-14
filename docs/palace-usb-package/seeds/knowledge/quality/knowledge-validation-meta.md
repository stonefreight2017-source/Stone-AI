# Knowledge Validation Meta-Framework
## The Gatekeeper's Own Tool — Validating Knowledge Seeds Before They Enter Agent Context

Version: 1.0 | Stack: Next.js + Prisma + Clerk + Stripe + vLLM | Last validated: 2026-03-08

---

## 1. ACCURACY VALIDATION

### Cross-Reference Protocol
```
FOR each claim in seed:
  1. Identify source (official docs, tested behavior, community consensus)
  2. Check version applicability:
     - Next.js claim? → verify against next@16.x docs
     - Prisma claim? → verify against prisma@7.x docs
     - Node claim? → verify against engines field in package.json
  3. Test against real scenario:
     - Can you construct a minimal repro that proves this claim?
     - If NO → flag as UNVERIFIED, add [UNVERIFIED] tag
  4. Check for version caveats:
     - "This works in Next.js 15+ but NOT in 14" → MUST be noted
     - Breaking changes between major versions → explicit callout
```

### Accuracy Checklist
- [ ] Every code snippet compiles/runs without modification
- [ ] Every regex pattern has been tested against at least 3 positive and 3 negative examples
- [ ] Every CLI command has been run on the target platform (Windows/Git Bash)
- [ ] Every API reference points to a real endpoint/method
- [ ] Every error message regex matches actual error output (not paraphrased)
- [ ] Version-specific claims include the version range

### Version Caveat Tags
```
[STABLE]       — Works across all supported versions
[VERSION:X.Y+] — Only works from version X.Y onward
[DEPRECATED]   — Scheduled for removal, include migration path
[UNVERIFIED]   — Not yet tested against real scenario
[PLATFORM:WIN] — Windows-specific behavior
[PLATFORM:NIX] — Linux/Mac-specific behavior
```

---

## 2. COMPLETENESS FRAMEWORK

### Coverage Distribution Target
```
Common cases (80% of real-world encounters):  MUST cover 100%
Edge cases (15% of encounters):               MUST cover 80%+
Catastrophic cases (5% — data loss, security): MUST cover 100%
```

### Completeness Audit Decision Tree
```
START → Does this seed cover a category?
  │
  ├─ YES → List all sub-scenarios in that category
  │   │
  │   ├─ For each sub-scenario:
  │   │   ├─ Is it common (>10% frequency)? → MUST be covered
  │   │   ├─ Is it an edge case (<10%)? → SHOULD be covered
  │   │   └─ Can it cause data loss/security breach? → MUST be covered regardless of frequency
  │   │
  │   └─ Coverage score = covered_scenarios / total_scenarios
  │       ├─ Score >= 0.90 → PASS
  │       ├─ Score 0.75-0.89 → CONDITIONAL PASS (note gaps)
  │       └─ Score < 0.75 → FAIL (expand seed)
  │
  └─ NO → Is this a reference/template seed?
      ├─ YES → Validate template covers stated use cases
      └─ NO → Flag: "Seed lacks categorical structure"
```

### Missing Scenario Detection
```
For any error/diagnostic seed, check:
  - Happy path documented?
  - First failure mode documented?
  - Cascading failure documented?
  - Recovery documented?
  - Prevention documented?

Missing any of the last 4 → incomplete for production use.
```

---

## 3. FRESHNESS TRACKING

### Expiration Protocol
```yaml
freshness_tags:
  evergreen:     "Pure logic/math — no expiration"
  stable:        "Review annually — framework core concepts"
  versioned:     "Review on major version bump"
  volatile:      "Review quarterly — API surfaces, cloud provider behavior"
  experimental:  "Review monthly — preview features, canary builds"
```

### Freshness Audit Checklist
- [ ] Every external URL has been checked for 200 status
- [ ] Every npm package reference matches current major version
- [ ] Every API endpoint reference matches current API surface
- [ ] Every config file format matches current schema
- [ ] No references to deprecated features without migration notes

### Staleness Detection Regex Patterns
```regex
# Catch hardcoded versions that may be stale
/next@\d+\.\d+/
/prisma@\d+\.\d+/
/"version":\s*"\d+\.\d+\.\d+"/

# Catch deprecated API patterns
/getInitialProps/          → deprecated in App Router
/getServerSideProps/       → use server components instead
/pages\/api\//             → use app/api/ route handlers
/new PrismaClient\(\)/     → should use singleton pattern
```

---

## 4. CONFLICT DETECTION & RESOLUTION

### Conflict Types
```
TYPE 1 — DIRECT CONTRADICTION
  Seed A says "always use X"
  Seed B says "never use X"
  → Resolution: Check which has higher specificity (more context = wins)
  → If equal: escalate to founder

TYPE 2 — SCOPE OVERLAP
  Seed A covers error X with fix Y
  Seed B covers error X with fix Z
  → Resolution: Both fixes may be valid for different root causes
  → Action: Merge into single entry with decision tree

TYPE 3 — VERSION CONFLICT
  Seed A: "Use method X" (valid for v14)
  Seed B: "Use method Y" (valid for v16)
  → Resolution: Keep both, tag with [VERSION:X.Y]

TYPE 4 — PLATFORM CONFLICT
  Seed A: "Run command X" (Linux)
  Seed B: "Run command Y" (Windows)
  → Resolution: Keep both, tag with [PLATFORM:*]
```

### Conflict Resolution Protocol
```
1. Identify conflicting claims
2. Classify conflict type (1-4 above)
3. Check recency — newer version-specific claim wins over older
4. Check specificity — more specific context wins over general
5. Check evidence — tested claim wins over theoretical
6. If still unresolved → flag for founder review
7. Document resolution as precedent for future conflicts
```

---

## 5. USEFULNESS VALIDATION

### The GS-Failure Test
```
FOR each Golden Seed failure mode (GS-1 through GS-7):
  1. Simulate the failure condition
  2. Present the seed to an agent (or simulate agent reasoning)
  3. Ask: "Given this seed, can the agent now AVOID or FIX this failure?"

  GS-1 (Brace Audit):     Can agent detect unbalanced braces BEFORE writing?
  GS-2 (ESM Strict):      Can agent avoid require() in .mjs context?
  GS-3 (Command Validate): Can agent produce correct shell command for target platform?
  GS-4 (Pre-Flight):      Can agent identify scope issues before execution?
  GS-5 (Idempotency):     Can agent verify operation is safe to repeat?
  GS-6 (Observation):     Can agent predict output before running?
  GS-7 (Proof of Life):   Can agent validate that deployed artifact is actually working?
```

### Usefulness Score
```
Score each seed 1-5:
  5 — Agent can solve problem it previously couldn't
  4 — Agent solves problem faster/more reliably
  3 — Agent avoids a common mistake
  2 — Agent has better context but same capability
  1 — Nice to know, no measurable impact

Target: Every seed scores 3+ on at least one GS-failure test
Below 3 → seed needs rework or demotion to reference-only
```

---

## 6. FORMAT STANDARDS

### Required Formats (by content type)
```
Diagnostic content    → Decision trees (ASCII flowcharts)
Process content       → Numbered checklists with checkboxes
Error matching        → Regex patterns with test cases
Code solutions        → Complete, copy-paste-ready templates
Configuration         → Full file snippets (not fragments)
Thresholds/limits     → Tables with columns: metric | warn | critical | action
```

### Anti-Patterns (NEVER use these in seeds)
```
BAD:  "There are many reasons this could fail..."
GOOD: Decision tree with 5 specific reasons and their fixes

BAD:  "Consider using a different approach..."
GOOD: "Replace X with Y. Here's the code: [template]"

BAD:  "This is an advanced topic..."
GOOD: Step 1, Step 2, Step 3 with exact commands

BAD:  Long prose paragraphs explaining concepts
GOOD: Checklists, tables, decision trees, code blocks
```

---

## 7. INTEGRATION TESTING

### Seed Integration Test Protocol
```
BEFORE adding seed to agent context:
  1. Measure agent performance on 5 representative tasks (baseline)
  2. Add seed to context
  3. Re-run same 5 tasks (post-seed)
  4. Compare:
     - Task completion rate: must not decrease
     - Error rate: must not increase
     - Time to solution: should decrease or stay same
     - Quality of output: should increase or stay same

PASS criteria:
  - No metric worsened
  - At least one metric improved
  - No new failure modes introduced
```

### Context Window Budget
```
Each seed consumes agent context window.
Budget allocation:
  - Core identity + instructions:  ~2000 tokens (fixed)
  - Golden Seeds (GS-1 to GS-7):  ~3500 tokens (fixed)
  - Quality seeds (this package):  ~5000 tokens MAX
  - Task-specific context:         remaining tokens

If a quality seed exceeds 1500 tokens → SPLIT into:
  - Summary (always loaded, <500 tokens)
  - Detail (loaded on-demand when relevant)
```

### Regression Check After Seed Update
```
When ANY seed is modified:
  1. Run the GS-failure test suite against modified seed
  2. Check for new conflicts with existing seeds (Section 4)
  3. Verify format compliance (Section 6)
  4. Re-run integration test (this section)
  5. Update freshness tag
  6. Log change in seed changelog
```

---

## QUICK REFERENCE: Validation Checklist for New Seeds

```
[ ] Accuracy: Every claim verified against docs or tested
[ ] Completeness: Common (100%), edge (80%+), catastrophic (100%)
[ ] Freshness: Version tags applied, expiration set
[ ] No conflicts: Checked against all existing seeds
[ ] Usefulness: Scores 3+ on at least one GS-failure test
[ ] Format: Decision trees/checklists/templates — no prose essays
[ ] Integration: Tested in agent context, no regressions
[ ] Size: Under 1500 tokens (or split into summary + detail)
[ ] Self-contained: Agent can use this file alone without dependencies
[ ] Stone AI specific: References our stack, our agents, our failures
```
