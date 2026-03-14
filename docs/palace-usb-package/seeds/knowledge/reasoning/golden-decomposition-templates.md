# Golden Seed R-2: Decomposition Templates
# Seed: GOLD-R2 | Category: Golden Seeds | Topic: Problem Decomposition
# RAG Tags: decomposition, debugging, architecture, security, business, template, scaffold, methodology

---

## PURPOSE
Ready-to-use decomposition templates for common complex problems. Each template is a
plug-and-play scaffold that agents can immediately apply to structure their thinking.
Covers: debugging, architecture design, security assessment, business analysis,
code review, incident response, and feature planning.

---

## 1. Debugging Template

### REPRODUCE → ISOLATE → HYPOTHESIZE → TEST → FIX → VERIFY

```
STEP 1: REPRODUCE
  □ Can I reproduce the bug consistently?
  □ What are the exact steps to trigger it?
  □ What are the inputs? (request body, headers, user state)
  □ What environment? (dev, staging, prod, specific browser/OS)
  □ What is the expected behavior?
  □ What is the actual behavior?
  □ Is there an error message? What does it say exactly?
  □ When did it start happening? (recent deploy? data change?)

  Output: "The bug occurs when [steps]. Expected: [X]. Actual: [Y].
           Error: [message]. Environment: [details]."

STEP 2: ISOLATE
  □ Which component is failing? (frontend, API, database, external service)
  □ Does the bug occur with different inputs?
  □ Does the bug occur for different users?
  □ Does the bug occur at different times?
  □ Can I reproduce in a minimal test case?
  □ What changed recently? (git log, deploys, config changes)
  □ Check logs at the point of failure

  Output: "The failure point is in [component]. It's related to [specific
           condition]. It started after [change/event]."

STEP 3: HYPOTHESIZE
  □ Based on isolation, what are the top 3 possible causes?
  □ Rank by likelihood (most likely first)
  □ For each hypothesis, what evidence would confirm or deny it?

  Hypothesis 1 (most likely): [description]
    Confirm by: [test]
    Deny by: [test]

  Hypothesis 2: [description]
    Confirm by: [test]
    Deny by: [test]

  Hypothesis 3: [description]
    Confirm by: [test]
    Deny by: [test]

STEP 4: TEST
  □ Test hypothesis 1 first (most likely)
  □ If confirmed → move to fix
  □ If denied → test hypothesis 2
  □ Keep testing until root cause found
  □ If all hypotheses denied → expand isolation, generate new hypotheses

  Output: "Root cause confirmed: [description]. Evidence: [what proved it]."

STEP 5: FIX
  □ Implement the fix
  □ Is this fixing the ROOT CAUSE or just the symptom?
  □ Does the fix introduce any new risks?
  □ Write a regression test before or alongside the fix
  □ Get the fix reviewed

  Output: "[Code change with explanation of why this fixes the root cause]."

STEP 6: VERIFY
  □ Does the original reproduction case now work correctly?
  □ Do all existing tests pass?
  □ Does the regression test pass?
  □ Test edge cases related to the fix
  □ Deploy to staging and verify
  □ Monitor in production after deploy

  Output: "Fix verified. Regression test added. Deployed to [environment].
           Monitoring for [timeframe]."
```

---

## 2. Architecture Design Template

### REQUIREMENTS → CONSTRAINTS → OPTIONS → TRADEOFFS → DECISION → VALIDATION

```
STEP 1: REQUIREMENTS
  Functional requirements (WHAT it must do):
    □ FR1: [requirement]
    □ FR2: [requirement]
    □ FR3: [requirement]

  Non-functional requirements (HOW WELL it must do it):
    □ NFR1: Performance — [specific targets: P95 < Xms, throughput > Y req/s]
    □ NFR2: Scalability — [specific targets: handle X users, Y data]
    □ NFR3: Reliability — [specific targets: X% uptime, RPO, RTO]
    □ NFR4: Security — [specific requirements: encryption, auth, compliance]
    □ NFR5: Cost — [budget constraints: < $X/month]
    □ NFR6: Maintainability — [team size, skill set]

  Output: Numbered list of requirements with acceptance criteria.

STEP 2: CONSTRAINTS
  Technical constraints:
    □ Existing technology stack? [list]
    □ Integration requirements? [systems that must interop]
    □ Infrastructure limitations? [cloud provider, region, etc.]
    □ Data constraints? [volume, velocity, variety, residency]

  Business constraints:
    □ Timeline? [hard deadlines]
    □ Budget? [monthly/total budget]
    □ Team? [size, skills, availability]
    □ Compliance? [regulations, certifications]

  Output: Numbered list of constraints that limit our options.

STEP 3: OPTIONS
  For each major architecture decision:
    Option A: [description]
      Components: [list]
      Technology: [specific tools/services]
      Cost estimate: [monthly]

    Option B: [description]
      Components: [list]
      Technology: [specific tools/services]
      Cost estimate: [monthly]

    Option C: [description] (if applicable)

  Output: 2-3 viable architecture options with component diagrams.

STEP 4: TRADEOFFS
  | Criterion        | Option A     | Option B     | Option C     |
  |------------------|-------------|-------------|-------------|
  | Performance      | [rating]    | [rating]    | [rating]    |
  | Scalability      | [rating]    | [rating]    | [rating]    |
  | Cost             | [rating]    | [rating]    | [rating]    |
  | Complexity       | [rating]    | [rating]    | [rating]    |
  | Time to market   | [rating]    | [rating]    | [rating]    |
  | Team fit         | [rating]    | [rating]    | [rating]    |
  | Vendor lock-in   | [rating]    | [rating]    | [rating]    |

  Output: Comparison matrix with clear winner per criterion.

STEP 5: DECISION
  Recommended: Option [X]
  Rationale: [Why this option best balances the tradeoffs given constraints]
  Key risks: [Top 3 risks with mitigation strategies]
  Migration path: [How to evolve if requirements change]
  Reversibility: [How hard is it to switch if this is wrong?]

  Output: Clear recommendation with documented reasoning.

STEP 6: VALIDATION
  □ Does the architecture satisfy ALL functional requirements?
  □ Does it meet non-functional requirements within constraints?
  □ Has it been reviewed by relevant stakeholders?
  □ Is there a prototype/POC to validate key assumptions?
  □ Is there a clear implementation plan?
  □ Are monitoring/observability concerns addressed?

  Output: Architecture Decision Record (ADR) documenting the decision.
```

---

## 3. Security Assessment Template

### THREAT MODEL → ATTACK SURFACE → VULNERABILITY → EXPLOIT → IMPACT → MITIGATION

```
STEP 1: THREAT MODEL
  System: [what are we assessing?]
  Assets: [what are we protecting?]
    □ User data (PII, credentials, conversations)
    □ System integrity (code, configuration, infrastructure)
    □ Service availability (uptime, performance)
    □ Business assets (revenue, reputation, IP)

  Threat actors:
    □ External attacker (motivation: data theft, disruption)
    □ Insider threat (motivation: data theft, sabotage)
    □ Automated bot (motivation: scraping, abuse, DDoS)
    □ Competitor (motivation: intelligence, disruption)
    □ Nation state (motivation: intelligence, disruption — low probability)

  Output: Asset inventory + threat actor profiles.

STEP 2: ATTACK SURFACE
  Entry points:
    □ API endpoints (list all, especially unauthenticated ones)
    □ Web interface (forms, file uploads, user-generated content)
    □ Authentication flows (login, password reset, OAuth)
    □ Third-party integrations (webhooks, callbacks, APIs)
    □ Admin interfaces (management portals, CLIs)
    □ Infrastructure (exposed ports, management interfaces)

  Data flows:
    □ Where does sensitive data enter the system?
    □ Where is it processed?
    □ Where is it stored?
    □ Where does it leave the system?
    □ Who can access it at each stage?

  Output: Attack surface map with entry points and data flow diagram.

STEP 3: VULNERABILITY IDENTIFICATION
  Per STRIDE (Spoofing, Tampering, Repudiation, Info Disclosure, DoS, Elevation):
    □ S: Can someone impersonate a user/service?
    □ T: Can someone modify data in transit or at rest?
    □ R: Can someone deny performing an action?
    □ I: Can someone access data they shouldn't?
    □ D: Can someone make the service unavailable?
    □ E: Can someone gain higher privileges?

  For each vulnerability:
    ID: [unique identifier]
    Type: [STRIDE category]
    Description: [what is the vulnerability]
    Location: [where in the system]
    Prerequisites: [what the attacker needs]

  Output: Vulnerability inventory with IDs and classifications.

STEP 4: EXPLOIT ASSESSMENT
  For each vulnerability:
    □ How would an attacker exploit this?
    □ What tools/skills are needed?
    □ How long would it take?
    □ Would it be detected?
    □ Can it be automated?

  DREAD score:
    D (Damage):         [1-10]
    R (Reproducibility): [1-10]
    E (Exploitability):  [1-10]
    A (Affected Users):  [1-10]
    D (Discoverability): [1-10]
    Average: [(D+R+E+A+D)/5]

  Output: Prioritized list of exploitable vulnerabilities.

STEP 5: IMPACT ANALYSIS
  For each exploitable vulnerability:
    □ What is the worst-case outcome?
    □ How many users affected?
    □ What data is exposed?
    □ What is the financial impact?
    □ What is the regulatory impact? (GDPR, CCPA fines)
    □ What is the reputation impact?
    □ How long to recover?

  Output: Impact assessment per vulnerability, sorted by severity.

STEP 6: MITIGATION PLAN
  For each vulnerability (prioritized by DREAD × Impact):
    □ Prevention: How to prevent the attack
    □ Detection: How to detect if it happens
    □ Response: What to do if it's exploited
    □ Timeline: When to implement (immediate, this sprint, next quarter)
    □ Owner: Who is responsible
    □ Cost: Effort/resources required

  Output: Prioritized remediation plan with owners and timelines.
```

---

## 4. Business Decision Template

### GOAL → METRICS → CONSTRAINTS → OPTIONS → RISKS → DECISION

```
STEP 1: GOAL
  What are we trying to achieve?
    □ Primary goal: [specific, measurable outcome]
    □ Secondary goals: [nice-to-haves]
    □ Anti-goals: [what we're explicitly NOT trying to do]
    □ Time horizon: [when do we need results by?]

  "We want to [achieve X] by [date] because [reason]."

STEP 2: METRICS
  How will we measure success?
    □ Primary metric: [the ONE number that defines success]
    □ Supporting metrics: [2-3 additional indicators]
    □ Guardrail metrics: [things that must NOT get worse]
    □ Current baselines: [where are these metrics today?]
    □ Targets: [where do these metrics need to be?]

  "Success = [primary metric] reaches [target] while [guardrail] stays above [threshold]."

STEP 3: CONSTRAINTS
    □ Budget: [available resources]
    □ Time: [deadline, runway]
    □ People: [team availability, skills]
    □ Technical: [platform limitations, dependencies]
    □ Legal/regulatory: [compliance requirements]
    □ Brand: [reputation considerations]

STEP 4: OPTIONS
  Option A: [name]
    Description: [what we'd do]
    Effort: [time/cost estimate]
    Expected outcome: [metric impact]
    Pros: [advantages]
    Cons: [disadvantages]

  Option B: [name]
    [same structure]

  Option C: Do nothing
    Description: Maintain status quo
    Expected outcome: [what happens if we don't act?]
    This is ALWAYS an option. Sometimes it's the right one.

STEP 5: RISKS
  For each option:
    Risk 1: [what could go wrong]
      Probability: [high/medium/low]
      Impact: [high/medium/low]
      Mitigation: [how to reduce risk]

    Risk 2: [what could go wrong]
      [same structure]

  Reversibility assessment:
    "If this decision is wrong, can we undo it? At what cost?"

STEP 6: DECISION
  Recommended: Option [X]

  Reasoning:
    1. [First reason, linked to goals and metrics]
    2. [Second reason, linked to constraints]
    3. [Third reason, linked to risk assessment]

  Implementation plan:
    Week 1: [actions]
    Week 2: [actions]
    Review point: [when to evaluate if it's working]

  Decision criteria for pivoting:
    "If [metric] hasn't improved by [X%] after [timeframe], we will [pivot action]."
```

---

## 5. Code Review Template

### CORRECTNESS → SECURITY → PERFORMANCE → MAINTAINABILITY → TESTING

```
STEP 1: CORRECTNESS
  □ Does the code do what the PR description says?
  □ Does it handle edge cases? (null, empty, boundary values)
  □ Does it handle errors properly? (try/catch, error types, user messaging)
  □ Are there race conditions or concurrency issues?
  □ Does it follow the type system correctly? (no any, proper generics)
  □ Does it match the API contract? (request/response shapes)

STEP 2: SECURITY
  □ Input validation with Zod .strict()?
  □ Authentication check present?
  □ Authorization check (BOLA/BFLA) present?
  □ SQL injection possible? (parameterized queries used?)
  □ XSS possible? (output encoding used?)
  □ Sensitive data exposure? (passwords, tokens, PII in logs?)
  □ Rate limiting applied?
  □ CSRF protection for state-changing operations?

STEP 3: PERFORMANCE
  □ N+1 query problems? (use include/join instead of loop)
  □ Missing database indexes for new queries?
  □ Unnecessary data fetching? (select only needed fields)
  □ Proper caching where appropriate?
  □ Expensive operations in hot paths?
  □ Bundle size impact? (new dependencies justified?)
  □ Memory leaks? (event listeners cleaned up, connections closed?)

STEP 4: MAINTAINABILITY
  □ Is the code readable without comments?
  □ Are functions/components small and focused?
  □ Is there duplicated logic that should be extracted?
  □ Are naming conventions consistent with the codebase?
  □ Is the abstraction level appropriate? (not over/under-engineered)
  □ Would a new team member understand this code?
  □ Are magic numbers/strings replaced with named constants?

STEP 5: TESTING
  □ Are there unit tests for the new code?
  □ Do tests cover happy path AND error paths?
  □ Are edge cases tested?
  □ Is test coverage adequate? (not just coverage %, but meaningful coverage)
  □ Are tests independent? (no shared state between tests)
  □ Can tests run in CI reliably? (no flaky tests)
```

---

## 6. Feature Planning Template

### PROBLEM → USERS → SOLUTION → SCOPE → IMPLEMENTATION → LAUNCH

```
STEP 1: PROBLEM
  □ What problem are we solving?
  □ Who has this problem? (specific user persona)
  □ How severe is it? (frequency × impact)
  □ What do users do today? (current workaround)
  □ What evidence do we have? (user feedback, data, interviews)

  "Users who [persona] struggle with [problem] because [reason].
   Currently they [workaround]. This happens [frequency]."

STEP 2: USERS
  □ Who is the primary user?
  □ What is their skill level?
  □ What tier are they on? (does this require paid tier?)
  □ How many users will this affect?
  □ What does success look like FOR THE USER?

STEP 3: SOLUTION
  □ What is the proposed solution? (1-2 sentences)
  □ What are alternative solutions? (and why not those)
  □ What is the minimum viable version?
  □ What is the ideal version? (post-MVP)
  □ User flow: [step-by-step from user's perspective]

STEP 4: SCOPE
  MVP (must have for launch):
    □ [Feature 1]
    □ [Feature 2]
    □ [Feature 3]

  V2 (post-launch iteration):
    □ [Enhancement 1]
    □ [Enhancement 2]

  Out of scope (explicitly not doing):
    □ [Thing we're not building]
    □ [Thing we're not building]

STEP 5: IMPLEMENTATION
  Technical approach:
    □ Frontend changes: [components, pages]
    □ Backend changes: [API endpoints, services]
    □ Database changes: [schema, migrations]
    □ Infrastructure changes: [if any]

  Effort estimate:
    □ Frontend: [days]
    □ Backend: [days]
    □ Testing: [days]
    □ Total: [days]

  Dependencies:
    □ [Blocked by / required before]

  Risks:
    □ [Technical risk + mitigation]
    □ [Timeline risk + mitigation]

STEP 6: LAUNCH
  □ Feature flag? [yes/no, flag name]
  □ Rollout plan: [% of users, timeline]
  □ Monitoring: [key metrics to watch]
  □ Rollback plan: [how to undo if problems]
  □ Documentation: [user docs, internal docs]
  □ Communication: [changelog, email, in-app]
  □ Success criteria: [what metric at what level = success]
  □ Review date: [when to evaluate results]
```

---

## 7. Incident Response Template

### DETECT → ASSESS → CONTAIN → INVESTIGATE → REMEDIATE → REVIEW

```
STEP 1: DETECT
  □ What was detected? [specific alert/observation]
  □ When was it detected? [timestamp UTC]
  □ How was it detected? [monitoring, user report, automated alert]
  □ Who detected it? [person/system]

STEP 2: ASSESS
  □ Severity: [SEV1/SEV2/SEV3/SEV4]
  □ Impact: [who is affected, what is affected]
  □ Scope: [how widespread]
  □ Active threat? [is an attacker currently in the system?]
  □ Data exposure? [is sensitive data at risk?]

STEP 3: CONTAIN
  □ Immediate action taken: [what was done]
  □ Affected systems isolated? [how]
  □ Evidence preserved? [memory dump, logs, snapshots]
  □ Stakeholders notified? [who, when]

STEP 4: INVESTIGATE
  □ Root cause identified: [what happened]
  □ Timeline reconstructed: [sequence of events]
  □ Attack vector: [how did it happen]
  □ Data impact: [what data was accessed/modified/exfiltrated]
  □ Indicators of Compromise: [IOCs found]

STEP 5: REMEDIATE
  □ Vulnerability patched: [what was fixed]
  □ Compromised credentials rotated: [which ones]
  □ Affected users notified: [if applicable]
  □ Systems restored: [verification steps]
  □ Monitoring enhanced: [new alerts added]

STEP 6: REVIEW
  □ Post-incident review scheduled: [date]
  □ Timeline documented
  □ Lessons learned identified
  □ Action items created with owners
  □ Process improvements documented
  □ Similar vulnerabilities identified and queued for fix
```

---

## 8. How to Use These Templates

```
FOR AGENTS:
  1. Identify the problem type (debugging, architecture, security, etc.)
  2. Pull the relevant template
  3. Work through each step IN ORDER — don't skip steps
  4. Document the output of each step
  5. Present findings using the template structure

FOR HUMANS:
  1. Use templates as thinking scaffolds — they prevent blind spots
  2. Not every checkbox applies to every situation — skip irrelevant ones
  3. Templates are starting points — add domain-specific steps as needed
  4. Share completed templates with the team for review
  5. Save completed templates as documentation

THE KEY INSIGHT:
  These templates work because they force COMPLETENESS.
  The most common debugging failure is skipping the reproduce step.
  The most common architecture failure is skipping the constraints step.
  The most common security failure is skipping the threat model step.
  Templates prevent the "I forgot to consider X" problem.
```

---

*This golden seed provides plug-and-play decomposition scaffolds for every major
problem type. Templates prevent blind spots and ensure thorough analysis.
Last validated: 2026-03.*
