# R-1: Golden Reasoning — Chain-of-Thought Templates
# Ready-to-use CoT templates for 10 common problem types
# Palace USB Package — Golden Seed

---

## PURPOSE
Chain-of-thought (CoT) prompting dramatically improves reasoning quality in LLMs.
These templates provide pre-structured reasoning scaffolds so the 32B model
doesn't need to discover the reasoning pattern — it just fills in the slots.
Each template: trigger condition, step-by-step scaffold, verification checkpoint, output format.

---

## TEMPLATE 1: DEBUGGING

### Trigger Condition
User reports a bug, error, unexpected behavior, or asks "why isn't X working?"

### Reasoning Scaffold
```
STEP 1 — REPRODUCE: What exactly is the observed behavior?
  → Expected: [what should happen]
  → Actual: [what does happen]
  → Reproducible? [always / sometimes / only under condition X]

STEP 2 — ERROR ANALYSIS: What does the error message say?
  → Error type: [TypeError / SyntaxError / NetworkError / custom]
  → Error location: [file:line or stack trace summary]
  → Key phrase in error: [the most diagnostic part of the message]

STEP 3 — HYPOTHESIS GENERATION: What could cause this?
  → Hypothesis A: [most likely cause based on error]
  → Hypothesis B: [second most likely]
  → Hypothesis C: [less likely but worth checking]

STEP 4 — EVIDENCE GATHERING: What do I need to check?
  → For hypothesis A, check: [specific file, variable, config]
  → For hypothesis B, check: [specific file, variable, config]
  → For hypothesis C, check: [specific file, variable, config]

STEP 5 — ROOT CAUSE: Based on evidence, the root cause is:
  → [Identified cause with supporting evidence]
  → Why: [explanation of how this causes the observed behavior]

STEP 6 — FIX: The fix is:
  → Change: [specific code/config change]
  → Why this fixes it: [direct connection to root cause]
  → Side effects to watch: [anything this change could break]
```

### Verification Checkpoint
```
□ Does the fix address the root cause, not just the symptom?
□ Have I considered why this worked before (if it did)?
□ Could this fix break anything else?
□ Is there a test I should add to prevent regression?
```

### Output Format
```
**Bug**: [one-line description]
**Root cause**: [one-line cause]
**Fix**: [code change or configuration change]
**Why it works**: [one-line explanation]
**Regression prevention**: [test or validation to add]
```

---

## TEMPLATE 2: CODE REVIEW

### Trigger Condition
User asks to review code, PR, or check code quality.

### Reasoning Scaffold
```
STEP 1 — UNDERSTAND INTENT: What is this code trying to do?
  → Purpose: [business logic / feature / fix]
  → Context: [where does this fit in the application?]

STEP 2 — CORRECTNESS: Does the code do what it's supposed to?
  → Happy path: [does the main flow work?]
  → Edge cases: [null, empty, zero, max, concurrent, offline]
  → Error handling: [are errors caught and handled appropriately?]
  → Type safety: [TypeScript types correct and complete?]

STEP 3 — SECURITY: Are there security concerns?
  → Input validation: [all user input validated?]
  → Authorization: [access control enforced?]
  → Data exposure: [sensitive data in logs/responses?]
  → Injection risks: [SQL, XSS, command injection?]

STEP 4 — PERFORMANCE: Any performance concerns?
  → N+1 queries: [database calls in loops?]
  → Unnecessary computation: [expensive ops that could be cached?]
  → Memory: [large data structures, leaks?]
  → Bundle impact: [new dependencies, dead code?]

STEP 5 — MAINTAINABILITY: Is this code easy to maintain?
  → Naming: [clear, consistent naming?]
  → Structure: [single responsibility, appropriate abstraction?]
  → Comments: [complex logic explained? Over-commented?]
  → Tests: [testable? tested?]

STEP 6 — PATTERNS: Does it follow project conventions?
  → File organization: [in the right place?]
  → Coding style: [consistent with codebase?]
  → Error handling pattern: [matches project standard?]
  → Import style: [consistent?]
```

### Verification Checkpoint
```
□ Did I actually read every line, or did I skim?
□ Did I check the imports/dependencies?
□ Did I think about what happens when this fails?
□ Did I consider concurrent access?
□ Did I check for hardcoded values that should be configurable?
```

### Output Format
```
**Summary**: [1-2 sentence overview]
**Critical Issues** (must fix):
  1. [issue] → [fix]
**Suggestions** (should fix):
  1. [issue] → [fix]
**Nits** (nice to have):
  1. [issue] → [fix]
**What's good**: [positive feedback]
```

---

## TEMPLATE 3: ARCHITECTURE DECISION

### Trigger Condition
User asks "should I use X or Y?", "how should I structure this?", or needs design guidance.

### Reasoning Scaffold
```
STEP 1 — REQUIREMENTS: What are the actual requirements?
  → Functional: [what must it do?]
  → Non-functional: [performance, scale, security, budget]
  → Constraints: [tech stack, team skill, timeline, hosting]
  → Future: [anticipated growth, feature additions]

STEP 2 — OPTIONS: What are the viable options?
  → Option A: [description, key characteristics]
  → Option B: [description, key characteristics]
  → Option C: [description, key characteristics] (if applicable)

STEP 3 — EVALUATION MATRIX:
  → Criteria: [list the dimensions that matter for THIS decision]
  → Score each option against each criterion
  → Weight criteria by importance to THIS project

STEP 4 — TRADEOFFS: What am I giving up with each option?
  → Option A tradeoff: [what you lose vs what you gain]
  → Option B tradeoff: [what you lose vs what you gain]
  → Reversibility: [how hard to change later?]

STEP 5 — RECOMMENDATION:
  → My recommendation: [option + clear reason]
  → Primary justification: [the #1 reason]
  → Secondary justification: [supporting reason]
  → Risk mitigation: [how to reduce the downsides]

STEP 6 — IMPLEMENTATION: If they go with my recommendation:
  → First step: [immediate action]
  → Key decisions to make early: [things to lock in]
  → Things that can be deferred: [don't over-engineer upfront]
```

### Verification Checkpoint
```
□ Am I recommending this because it's truly best, or because I'm most familiar with it?
□ Did I actually consider the team's skill level and timeline?
□ Is this the simplest solution that meets requirements?
□ Can this be changed later if it's wrong?
□ Am I solving today's problem or a hypothetical future problem?
```

### Output Format
```
**Recommendation**: [option]
**Why**: [1-2 sentences]
**Tradeoffs**: [what you're giving up]
**Alternatives considered**: [brief mention of other options]
**First step**: [immediate action item]
```

---

## TEMPLATE 4: PERFORMANCE OPTIMIZATION

### Trigger Condition
User reports slowness, asks for optimization, or performance metrics are poor.

### Reasoning Scaffold
```
STEP 1 — MEASURE: What are the actual numbers?
  → Current metric: [load time, response time, throughput]
  → Target metric: [what "good enough" looks like]
  → Where measured: [browser, server, database, network]
  → Baseline: [is this a regression or always slow?]

STEP 2 — PROFILE: Where is the time spent?
  → Network: [DNS, TLS, download time]
  → Server: [compute, database queries, external API calls]
  → Client: [rendering, JavaScript execution, layout]
  → Database: [query time, connection overhead, lock waits]

STEP 3 — IDENTIFY BOTTLENECK: What's the #1 bottleneck?
  → Bottleneck: [specific operation]
  → Why: [this accounts for X% of total time]
  → Evidence: [profiler output, EXPLAIN ANALYZE, DevTools]

STEP 4 — OPTIMIZE: Fix the bottleneck
  → Strategy: [caching / indexing / parallelization / algorithm change / reduction]
  → Specific change: [exactly what to modify]
  → Expected improvement: [what this should reduce by]

STEP 5 — VERIFY: Did it actually help?
  → Re-measure with same methodology
  → Compare to baseline
  → Check for regressions in other metrics
  → If no improvement → return to STEP 2 (wrong bottleneck identified)

STEP 6 — NEXT BOTTLENECK: After fixing #1, what's now the bottleneck?
  → New bottleneck: [identified through re-profiling]
  → Is it worth optimizing further? [diminishing returns check]
```

### Verification Checkpoint
```
□ Did I measure before AND after?
□ Am I optimizing the actual bottleneck, not guessing?
□ Is the optimization worth the complexity it adds?
□ Did I check for regressions in other areas?
□ Am I prematurely optimizing something that doesn't matter?
```

### Output Format
```
**Current**: [metric]
**Bottleneck**: [what and where]
**Fix**: [specific change]
**Expected result**: [improved metric]
**Measured result**: [actual improvement]
```

---

## TEMPLATE 5: SECURITY AUDIT

### Trigger Condition
User asks about security, asks to audit code, or is implementing auth/permissions.

### Reasoning Scaffold
```
STEP 1 — THREAT MODEL: What are we protecting?
  → Assets: [user data, financial info, system access]
  → Attackers: [external hackers, malicious users, curious users]
  → Attack surface: [public APIs, user inputs, file uploads, admin panels]

STEP 2 — INPUT VALIDATION (OWASP A03):
  → Every user input identified: [forms, URLs, headers, files]
  → Validation implemented: [Zod schemas, type checks, allowlists]
  → Injection points: [SQL, XSS, command injection risks]

STEP 3 — AUTHENTICATION (OWASP A07):
  → Auth mechanism: [JWT, session, OAuth, Clerk]
  → Token storage: [HttpOnly cookies? localStorage? — if localStorage, flag it]
  → Session management: [expiry, refresh, revocation]
  → Rate limiting: [login attempts, password reset]

STEP 4 — AUTHORIZATION (OWASP A01):
  → Every endpoint checked: [can user A access user B's data?]
  → Role enforcement: [server-side, not just UI hiding?]
  → Direct object references: [IDs in URLs validated against ownership?]

STEP 5 — DATA PROTECTION:
  → Encryption at rest: [what's encrypted, with what algorithm]
  → Encryption in transit: [TLS configured? Forced?]
  → Sensitive data in logs: [check for PII, tokens, passwords in logs]
  → Secrets management: [env vars, no hardcoded secrets?]

STEP 6 — INFRASTRUCTURE:
  → Dependencies: [npm audit results, known vulnerabilities]
  → Headers: [CSP, HSTS, X-Content-Type-Options]
  → CORS: [properly restricted?]
  → Error handling: [generic errors to client, detailed in server logs?]
```

### Verification Checkpoint
```
□ Did I check EVERY endpoint, not just the ones that look risky?
□ Did I test with a non-admin user?
□ Could I access another user's data by changing an ID in the URL?
□ Are all secrets actually secret (not in repo, not in client bundle)?
□ Did I check the dependencies, not just the custom code?
```

### Output Format
```
**Risk Level**: [Critical / High / Medium / Low]
**Critical Findings**:
  1. [finding] → [impact] → [fix]
**High Findings**:
  1. [finding] → [impact] → [fix]
**Recommendations**:
  1. [improvement]
**Clean Areas**: [what's well-implemented]
```

---

## TEMPLATE 6: DATA ANALYSIS

### Trigger Condition
User has data and wants insights, or asks about metrics/trends.

### Reasoning Scaffold
```
STEP 1 — DATA QUALITY: Can I trust this data?
  → Missing values: [how many, which fields, random or systematic?]
  → Duplicates: [any duplicate records?]
  → Outliers: [extreme values — real or errors?]
  → Data types: [everything correctly typed?]
  → Sample size: [enough data for meaningful analysis?]

STEP 2 — DESCRIPTIVE: What does the data show?
  → Central tendency: [mean, median, mode]
  → Spread: [standard deviation, range, IQR]
  → Distribution: [normal, skewed, bimodal?]
  → Time trends: [increasing, decreasing, seasonal?]

STEP 3 — SEGMENTATION: Do different groups behave differently?
  → Segments tested: [user type, plan tier, geography, time period]
  → Significant differences: [which segments differ meaningfully?]
  → Sample size per segment: [enough for each group?]

STEP 4 — INSIGHT: What does this mean?
  → Primary insight: [the main takeaway]
  → Supporting evidence: [specific numbers that back this up]
  → Confidence level: [high/medium/low — be honest]
  → Alternative explanations: [what else could explain this pattern?]

STEP 5 — RECOMMENDATION: What should we do about it?
  → Action: [specific next step]
  → Expected impact: [what we expect to happen]
  → How to validate: [how to confirm the action worked]
```

### Verification Checkpoint
```
□ Am I confusing correlation with causation?
□ Is my sample size large enough for this conclusion?
□ Did I check for confounding variables?
□ Am I cherry-picking data that supports my hypothesis?
□ Did I state my assumptions and confidence level?
```

---

## TEMPLATE 7: COST ESTIMATION

### Trigger Condition
User asks "how much will this cost?" or needs budget planning.

### Reasoning Scaffold
```
STEP 1 — IDENTIFY COST COMPONENTS:
  → Fixed costs: [hosting, domains, services with flat monthly fees]
  → Variable costs: [per-user, per-request, per-GB costs]
  → One-time costs: [setup, migration, initial development]
  → Hidden costs: [bandwidth overages, support, maintenance time]

STEP 2 — ESTIMATE USAGE:
  → Users: [expected MAU/DAU — be realistic]
  → Requests: [requests per user per session × sessions per day]
  → Storage: [data per user × number of users × retention]
  → Compute: [function invocations, server hours]

STEP 3 — CALCULATE:
  → Monthly cost per component: [line by line]
  → Total monthly: [sum]
  → Annual: [monthly × 12 or annual pricing if discounted]
  → Per-user cost: [total / users — unit economics check]

STEP 4 — SCENARIOS:
  → Low estimate (conservative): [minimum realistic usage]
  → Medium estimate (expected): [most likely usage]
  → High estimate (growth): [if usage 3-5x exceeds expectations]

STEP 5 — OPTIMIZATION:
  → Can we use free tiers? [where we're under limits]
  → Reserved pricing? [committed use discounts]
  → Cheaper alternatives? [equivalent services at lower cost]
  → What to watch: [cost triggers that need attention]
```

### Verification Checkpoint
```
□ Did I account for ALL cost components (not just obvious ones)?
□ Are my usage estimates realistic, not optimistic?
□ Did I include the cost of growth (variable costs scale)?
□ Did I check if free tiers actually cover our needs?
□ Is the per-user cost sustainable for our pricing model?
```

---

## TEMPLATE 8: MIGRATION PLANNING

### Trigger Condition
User wants to migrate between technologies, platforms, or versions.

### Reasoning Scaffold
```
STEP 1 — SCOPE: What exactly is being migrated?
  → From: [current technology/version/platform]
  → To: [target technology/version/platform]
  → What's included: [code, data, configurations, DNS, users]
  → What's NOT included: [things that stay the same]

STEP 2 — RISK ASSESSMENT:
  → Breaking changes: [what will break during migration?]
  → Data integrity: [risk of data loss or corruption?]
  → Downtime: [how long will the service be unavailable?]
  → Rollback plan: [how to undo if migration fails?]

STEP 3 — DEPENDENCY MAP:
  → What depends on what we're migrating? [downstream consumers]
  → What does the migrated system depend on? [upstream dependencies]
  → Order of operations: [what must be migrated first?]

STEP 4 — EXECUTION PLAN:
  → Phase 1 — Preparation: [backup, set up target, test environment]
  → Phase 2 — Migration: [step-by-step migration procedure]
  → Phase 3 — Validation: [verify everything works]
  → Phase 4 — Cutover: [switch traffic/DNS/configuration]
  → Phase 5 — Cleanup: [remove old system, update docs]

STEP 5 — TESTING:
  → Pre-migration: [test the migration in staging first]
  → During: [smoke tests at each step]
  → Post-migration: [full regression test]
  → User acceptance: [key users verify functionality]
```

### Verification Checkpoint
```
□ Did I back up EVERYTHING before starting?
□ Did I test the migration in a non-production environment?
□ Do I have a rollback plan that actually works?
□ Did I communicate downtime to affected users?
□ Did I check that all integrations still work after migration?
```

---

## TEMPLATE 9: INCIDENT RESPONSE

### Trigger Condition
Production issue, outage, data breach, or critical error.

### Reasoning Scaffold
```
STEP 1 — ASSESS (first 2 minutes):
  → What is happening: [describe the incident objectively]
  → Impact: [who is affected, how many, how severely]
  → Severity: [P0 all down / P1 major feature / P2 minor / P3 cosmetic]
  → Timeline: [when did it start, is it ongoing?]

STEP 2 — COMMUNICATE (first 5 minutes):
  → Acknowledge: [team/users know we're investigating]
  → Assign: [who is working on this]
  → Channel: [where updates go]

STEP 3 — DIAGNOSE (5-15 minutes):
  → Recent changes: [deployments, config changes, external events]
  → Logs: [what do error logs show?]
  → Metrics: [CPU, memory, error rate, traffic patterns]
  → External: [are dependencies up? (check status pages)]

STEP 4 — MITIGATE (ASAP):
  → Can we rollback? [fastest fix for deployment issues]
  → Can we disable the broken feature? [feature flag]
  → Can we redirect traffic? [failover]
  → Can we scale? [if load-related]
  → Temporary workaround? [even if not perfect]

STEP 5 — RESOLVE:
  → Root cause identified: [what actually caused it]
  → Fix implemented: [what we changed]
  → Fix verified: [how we confirmed it's working]
  → All-clear communicated: [team/users know it's resolved]

STEP 6 — POST-MORTEM:
  → Timeline: [minute-by-minute what happened]
  → Root cause: [deep cause, not just proximate]
  → What went well: [in our response]
  → What could improve: [in our response]
  → Action items: [prevent recurrence, improve detection]
```

---

## TEMPLATE 10: FEATURE DESIGN

### Trigger Condition
User wants to build a new feature and needs design guidance.

### Reasoning Scaffold
```
STEP 1 — USER STORY: Who needs this and why?
  → User: [who will use this feature?]
  → Need: [what problem does it solve for them?]
  → Value: [why does this matter to the business?]
  → Success metric: [how do we know it's working?]

STEP 2 — REQUIREMENTS:
  → Must have: [non-negotiable requirements]
  → Should have: [important but can compromise on details]
  → Nice to have: [defer to v2 if needed]
  → Must NOT have: [explicit exclusions to prevent scope creep]

STEP 3 — DESIGN:
  → Data model: [what data needs to be stored?]
  → API design: [what endpoints/actions?]
  → UI flow: [user journey from start to finish]
  → State management: [where does state live?]
  → Error states: [what can go wrong and how to handle it?]

STEP 4 — IMPLEMENTATION PLAN:
  → Database: [schema changes, migrations]
  → Backend: [API routes, business logic]
  → Frontend: [components, pages, state]
  → Order: [what to build first — usually DB → API → UI]

STEP 5 — EDGE CASES:
  → Empty state: [no data yet — what shows?]
  → Error state: [network failure, validation error]
  → Loading state: [what shows while data loads?]
  → Permissions: [who can access this?]
  → Scale: [what if 10x more data/users than expected?]

STEP 6 — TESTING PLAN:
  → Unit tests: [business logic]
  → Integration tests: [API endpoints]
  → E2E tests: [critical user paths]
  → Manual testing: [what to verify visually]
```

### Verification Checkpoint
```
□ Does this solve the user's actual problem?
□ Is this the simplest version that delivers value?
□ Have I accounted for error states and edge cases?
□ Can this be built incrementally (MVP first)?
□ Does this fit within the existing architecture?
```

---

## META: HOW TO USE THESE TEMPLATES

### For the Agent (32B Model)
1. Identify which template matches the user's request
2. Work through EVERY step in order — don't skip
3. Fill in the specific details for this situation
4. Run the verification checkpoint before outputting
5. Format the output as specified

### Template Selection Guide
```
User says "it's broken/not working" → TEMPLATE 1 (Debugging)
User says "review this code" → TEMPLATE 2 (Code Review)
User says "should I use X or Y" → TEMPLATE 3 (Architecture Decision)
User says "it's slow" → TEMPLATE 4 (Performance)
User says "is this secure" → TEMPLATE 5 (Security Audit)
User shows data/metrics → TEMPLATE 6 (Data Analysis)
User asks "how much will this cost" → TEMPLATE 7 (Cost Estimation)
User says "migrate/upgrade/switch" → TEMPLATE 8 (Migration)
User says "production is down" → TEMPLATE 9 (Incident Response)
User says "build/design this feature" → TEMPLATE 10 (Feature Design)
```

### Combining Templates
Complex requests may need multiple templates. For example:
- "Review this PR and check for performance issues" → Template 2 + Template 4
- "Should we migrate our database and how much will it cost?" → Template 3 + Template 8 + Template 7

**Embedding hint**: Each template (## TEMPLATE N) is an independent retrieval unit.
The template title + trigger condition are the retrieval keys.
