# R-7: Golden Reasoning — Causal Templates
# Causal reasoning enforcement for root cause analysis
# Palace USB Package — Golden Seed

---

## PURPOSE
LLMs have a strong bias toward correlation-based reasoning ("X happened near Y,
so X caused Y"). This seed enforces rigorous causal reasoning: evidence for and
against each hypothesis, explicit consideration of alternative explanations, and
systematic elimination. This is the difference between "guessing the cause" and
"proving the cause."

---

## THE CAUSAL REASONING PROTOCOL

### Standard Template
```
OBSERVATION: [What happened — factual, no interpretation]

POSSIBLE CAUSES:
  A: [First hypothesis]
  B: [Second hypothesis]
  C: [Third hypothesis]

EVIDENCE FOR EACH:
  A: [What supports hypothesis A]
  B: [What supports hypothesis B]
  C: [What supports hypothesis C]

EVIDENCE AGAINST EACH:
  A: [What contradicts hypothesis A]
  B: [What contradicts hypothesis B]
  C: [What contradicts hypothesis C]

CAUSAL TESTS:
  - Temporal: Did the cause precede the effect?
  - Mechanism: Is there a plausible mechanism?
  - Counterfactual: If the cause were absent, would the effect still occur?
  - Dose-response: Does more of the cause produce more of the effect?
  - Consistency: Is this pattern reproducible?

MOST LIKELY CAUSE: [selected hypothesis]
CONFIDENCE: [high/medium/low]
REMAINING UNCERTAINTY: [what would increase confidence]
```

---

## DOMAIN 1: BUG CAUSATION

### Template: "Why did this bug appear?"

```
OBSERVATION: Feature X stopped working after deployment Y.

POSSIBLE CAUSES:
  A: Code change in deployment Y broke feature X
  B: Database schema change broke a query
  C: Environment variable changed or missing
  D: Third-party dependency update introduced breaking change
  E: Infrastructure issue (resource exhaustion, timeout change)

SYSTEMATIC INVESTIGATION:

For A (code change):
  Evidence FOR:
    □ Feature worked before deployment Y, broke after
    □ Deployment Y touched files related to feature X
    □ git diff shows relevant changes
  Evidence AGAINST:
    □ Feature X's code was not modified in deployment Y
    □ The changes were to an unrelated module
  Test: Rollback deployment Y → does feature X work again?

For B (database change):
  Evidence FOR:
    □ A migration ran with deployment Y
    □ Error logs show database-related errors
    □ Query returns different shape than code expects
  Evidence AGAINST:
    □ No migration was included in deployment Y
    □ Database queries work fine in direct testing
  Test: Run the feature's queries directly against the database

For C (environment variable):
  Evidence FOR:
    □ Feature uses env vars that could have been changed
    □ Different behavior between environments
    □ Error suggests missing configuration
  Evidence AGAINST:
    □ All env vars verified present and correct
    □ Same env vars work in staging
  Test: Log env var values (redacted) at feature entry point

For D (dependency update):
  Evidence FOR:
    □ package-lock.json changed in deployment Y
    □ Known breaking changes in updated package
    □ Error trace points to third-party code
  Evidence AGAINST:
    □ No dependency updates in deployment Y
    □ Dependencies haven't changed
  Test: Revert to previous package-lock.json

For E (infrastructure):
  Evidence FOR:
    □ Works locally but not in production
    □ Error is timeout or resource-related
    □ Other features are also slow/broken
  Evidence AGAINST:
    □ Only this specific feature is broken
    □ Infrastructure metrics show normal
  Test: Check hosting provider status, check resource metrics
```

### Worked Example
```
OBSERVATION: User avatars stopped loading. All show default placeholder.

POSSIBLE CAUSES:
  A: Avatar URL generation code broken
  B: Storage bucket permissions changed
  C: CDN/CORS configuration changed
  D: Image processing service down
  E: Database avatar URL field empty/corrupted

Investigation:
  - Check network tab: Avatar requests returning 403 Forbidden
    → This eliminates A (URLs are being generated — they're just being rejected)
    → This eliminates E (URLs exist, they're just not accessible)
    → This points to B or C (permission/access issue)

  - Check CORS headers on response: No CORS headers present
    → This points to C (CORS misconfiguration)

  - Check Cloudflare settings: CORS rule was accidentally deleted
    → CONFIRMED: Cause is C

  - Counterfactual: If CORS rule were present, would avatars load?
    → Restore rule → avatars load immediately ✅

ROOT CAUSE: CORS rule for storage bucket was deleted during
  a Cloudflare configuration cleanup.
CONFIDENCE: High (fix confirmed the cause)
PREVENTION: Add CORS rules to infrastructure-as-code,
  add monitoring for CORS header presence.
```

---

## DOMAIN 2: PERFORMANCE DEGRADATION

### Template: "Why did performance get worse?"

```
OBSERVATION: API response time increased from 200ms to 2000ms.

TIMELINE ANALYSIS (critical for performance):
  When did it start?
  Was it gradual or sudden?
  Does it affect all endpoints or specific ones?
  Does it correlate with traffic patterns?

POSSIBLE CAUSES:
  A: Database query performance degraded
     - Missing index on growing table
     - N+1 query problem
     - Lock contention from concurrent writes
     - Table bloat (need VACUUM)

  B: Increased traffic/load
     - More users than infrastructure can handle
     - Bot traffic / DDoS
     - Traffic spike from marketing campaign

  C: External service slowdown
     - API dependency is slow (auth provider, payment, AI)
     - DNS resolution slow
     - CDN issue

  D: Code change introduced inefficiency
     - New feature added expensive computation
     - Removed caching accidentally
     - Added synchronous blocking call

  E: Resource exhaustion
     - Memory leak over time
     - Connection pool exhausted
     - Disk full (can't write temp files)

INVESTIGATION ORDER (fastest to check first):
  1. Check external service status pages (2 min)
  2. Check error logs for obvious issues (2 min)
  3. Check resource metrics: CPU, memory, connections (2 min)
  4. Check traffic patterns for anomalies (2 min)
  5. Check recent deployments (git log, 2 min)
  6. Database: EXPLAIN ANALYZE on slow queries (5 min)
  7. Profile the specific slow endpoint (10 min)

CAUSAL VERIFICATION:
  □ Temporal: Performance was fine before [timestamp]. What changed at that time?
  □ Mechanism: How does the identified cause lead to +1800ms latency?
  □ Specificity: If cause is database, are ALL endpoints slow or just DB-heavy ones?
  □ Dose-response: Does the slowness correlate with load? (more traffic = slower?)
```

---

## DOMAIN 3: USER CHURN ANALYSIS

### Template: "Why are users leaving?"

```
OBSERVATION: Monthly churn increased from 5% to 8% over 3 months.

POSSIBLE CAUSES:
  A: Product quality/reliability issues
     Evidence: Support tickets, error rates, uptime metrics
     Test: Did churn increase after a bug-introducing release?

  B: Competitor offering better value
     Evidence: Exit survey mentions, competitor launches, pricing comparison
     Test: Are churned users signing up for a specific competitor?

  C: Pricing/value mismatch
     Evidence: Which tier has highest churn? Time-to-churn after price change?
     Test: Did churn increase after a pricing change?

  D: Poor onboarding (new users churn fast)
     Evidence: Time between signup and churn, feature adoption rate
     Test: Do users who complete onboarding churn less?

  E: Seasonal/external factors
     Evidence: Same pattern last year? Industry-wide trend?
     Test: Is churn elevated across similar products?

  F: Specific cohort effect
     Evidence: Is churn concentrated in a specific user segment?
     Test: Segment churn by: acquisition channel, plan tier, geography, usage level

ANTI-PATTERN: CORRELATION ≠ CAUSATION
  "We launched feature X and churn increased"
  → Did churn increase BECAUSE of feature X?
  → Or did something else happen at the same time?
  → Or was churn already trending up before the launch?
  → Check: Was the trend already in motion? (pre-existing trend)
  → Check: Did something else change simultaneously? (confounding variable)
```

---

## DOMAIN 4: SYSTEM FAILURE ANALYSIS

### Template: "Why did the system go down?"

```
OBSERVATION: Production outage at [time], lasting [duration].

TIMELINE (reconstruct minute by minute):
  T-10min: [what was happening before the incident]
  T-0: [first sign of trouble — alert, error, user report]
  T+5min: [escalation, who was notified]
  T+15min: [diagnosis activities]
  T+30min: [mitigation applied]
  T+Xmin: [resolution confirmed]

CAUSAL CHAIN (not just root cause — the full chain):
```

Example:
```
CHAIN:
  1. Marketing sent email blast to 50,000 users (trigger)
  2. 15,000 users clicked link within 10 minutes (amplifier)
  3. 15,000 concurrent requests hit the API (overload)
  4. Database connection pool (20 max) exhausted (bottleneck)
  5. New requests queue and timeout (cascade)
  6. Vercel function timeout at 10s (failure)
  7. Users see 500 errors, retry, making it worse (feedback loop)
  8. Auto-scaling can't keep up because DB is the bottleneck (constraint)

ROOT CAUSE: Connection pool sized for normal traffic (20),
  not for traffic spikes from marketing campaigns.

PROXIMATE CAUSE: Marketing email blast without warning to engineering.

CONTRIBUTING FACTORS:
  - No auto-scaling for database connections
  - No rate limiting on public pages
  - No communication protocol between marketing and engineering
  - No load testing for traffic spikes

PREVENTION:
  1. Increase connection pool to 100 (or use PgBouncer)
  2. Add rate limiting on all public endpoints
  3. Create marketing → engineering notification for campaigns
  4. Load test for 10x normal traffic before campaigns
  5. Add alert for connection pool utilization > 80%
```

---

## DOMAIN 5: SECURITY INCIDENT ANALYSIS

### Template: "How were we breached / how could we be breached?"

```
OBSERVATION: [Unauthorized access / data exposure / suspicious activity]

ATTACK CHAIN ANALYSIS (Cyber Kill Chain):
  1. Reconnaissance: How did attacker find the target?
  2. Weaponization: What tool/exploit was prepared?
  3. Delivery: How was the attack delivered?
  4. Exploitation: What vulnerability was exploited?
  5. Installation: Was persistence established?
  6. Command & Control: Is there ongoing access?
  7. Actions on Objectives: What did the attacker do/take?

POSSIBLE ATTACK VECTORS:
  A: Credential compromise
     - Phished password
     - Reused password from breached site
     - Brute force (if no rate limiting)
     - Token/session hijacking

  B: Application vulnerability
     - SQL injection
     - XSS leading to session theft
     - IDOR (accessing other users' data via ID manipulation)
     - SSRF (server making requests to internal services)

  C: Supply chain
     - Compromised dependency (malicious npm package)
     - Compromised CI/CD pipeline
     - Compromised third-party service

  D: Infrastructure
     - Exposed database (public internet access)
     - Default credentials on service
     - Unpatched vulnerability in server/OS

  E: Social engineering
     - Phishing email to team member
     - Pretexting (impersonating support/admin)
     - Physical access (USB drop, tailgating)

EVIDENCE COLLECTION:
  □ Access logs: Who accessed what, when, from where?
  □ Error logs: Failed attempts before success?
  □ Database logs: Unusual queries?
  □ Network logs: Unusual outbound traffic?
  □ Git history: Unauthorized changes?
  □ Third-party logs: Suspicious API activity?
```

---

## CORRELATION ≠ CAUSATION: EXPLICIT PATTERNS

### Pattern 1: Coincidental Timing
```
"We deployed feature X and user engagement dropped"
WRONG: Feature X caused engagement drop
CHECK: Did something else happen the same day?
  - Holiday/weekend?
  - Competitor launch?
  - External event (news, weather)?
  - Different user cohort in the data?
```

### Pattern 2: Confounding Variable
```
"Users who use feature X have higher retention"
WRONG: Feature X causes retention
CHECK: What confounds this?
  - Power users discover feature X AND are inherently more retained
  - The confound: engagement level (causes both X usage and retention)
  - Test: Do users who START using feature X see improved retention?
    (compare before/after, not users who use vs don't)
```

### Pattern 3: Reverse Causation
```
"Countries with more hospitals have more disease"
WRONG: Hospitals cause disease
CORRECT: Disease causes hospital construction (reverse causation)
CHECK: Could the effect be causing the cause instead?
```

### Pattern 4: Simpson's Paradox
```
Treatment A: 80% success overall
Treatment B: 90% success overall
→ B is better? Not necessarily.

Breakdown by severity:
  Mild cases: A=90%, B=95% (B better)
  Severe cases: A=70%, B=75% (B better)
  But B treats mostly mild cases, A treats mostly severe

  Overall averages are misleading when groups are unequal in size.
CHECK: Always segment by relevant variables before concluding.
```

### Pattern 5: Survivorship Bias
```
"Successful startups all use [technique X]"
WRONG: Technique X leads to success
CHECK: Did failed startups also use technique X?
  - If yes → technique X doesn't differentiate
  - You're only seeing survivors, not the full population
```

### Pattern 6: Regression to the Mean
```
"User had their worst month ever, then improved after we intervened"
WRONG: Our intervention caused the improvement
CHECK: Extreme values naturally regress toward the average
  - An unusually bad month is likely followed by a normal month
  - This would happen with OR without intervention
  - Test: Did users who had bad months WITHOUT intervention also improve?
```

---

## CAUSAL REASONING CHECKLIST

Before claiming X caused Y, verify:

```
□ TEMPORAL ORDER: Did X happen before Y? (Cause precedes effect)
□ MECHANISM: Can I explain HOW X leads to Y? (Plausible mechanism)
□ COUNTERFACTUAL: If X had not happened, would Y still have occurred?
□ DOSE-RESPONSE: Does more X lead to more Y?
□ SPECIFICITY: Does X specifically predict Y (not just anything)?
□ CONSISTENCY: Is this reproducible? Does it happen every time?
□ NO CONFOUNDERS: Have I ruled out other variables that cause both X and Y?
□ NOT REVERSE: Could Y be causing X instead?
□ NOT COINCIDENCE: Is the sample size large enough to rule out chance?
□ NOT SURVIVORSHIP: Am I looking at the full population?
```

---

## CAUSAL INVESTIGATION FLOWCHART

```
START: "X happened. Why?"
  |
  ├─ Generate hypotheses (minimum 3)
  |   ├─ Most obvious cause
  |   ├─ Second most likely
  |   └─ Contrarian/unlikely (check anyway)
  |
  ├─ For each hypothesis:
  |   ├─ What evidence would CONFIRM it?
  |   ├─ What evidence would REFUTE it?
  |   └─ Collect that evidence
  |
  ├─ Eliminate hypotheses that are refuted
  |
  ├─ For remaining hypotheses:
  |   ├─ Run causal tests (temporal, mechanism, counterfactual)
  |   └─ Check for confounders
  |
  ├─ Select most supported hypothesis
  |   ├─ State confidence level
  |   └─ State remaining uncertainty
  |
  └─ Verify:
      ├─ Fix based on identified cause
      ├─ Does the fix resolve the issue?
      ├─ YES → Cause confirmed
      └─ NO → Return to hypothesis generation
```

---

## USAGE GUIDE

For any "why did this happen" question:
1. Use the standard causal reasoning template
2. Generate at least 3 hypotheses
3. Collect evidence for AND against each
4. Run causal tests
5. Check correlation ≠ causation patterns
6. State confidence and uncertainty

**Embedding hint**: The standard template, domain-specific templates, and
the correlation ≠ causation patterns are independent retrieval units.
Retrieve the standard template + the relevant domain template for any
causal reasoning task.
