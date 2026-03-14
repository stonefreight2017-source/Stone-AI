# Adversarial Thinking & Red Team Methodology
# Seed: REASON-1 | Category: Critical Thinking | Topic: Red Team Mindset
# RAG Tags: red-team, threat-modeling, stride, dread, attack-surface, pre-mortem, adversarial, code-review

---

## Purpose
Train agents to think like attackers across any domain. Red team mindset, attack surface
analysis, threat modeling (STRIDE, DREAD), abuse case design, pre-mortem analysis, and
"how would I break this?" methodology. Applied to code review, architecture, business.

---

## 1. The Red Team Mindset

### Core Principles
```
1. ASSUME EVERYTHING IS BREAKABLE
   Nothing is secure. Nothing is perfect. Your job is to find HOW it breaks.

2. THINK LIKE THE ATTACKER, NOT THE DEFENDER
   Defenders think about what they built.
   Attackers think about what they can exploit.
   The gap between these perspectives is where vulnerabilities live.

3. THE WEAKEST LINK WINS
   You don't need to break the strongest part.
   Find the weakest: the forgotten endpoint, the untested edge case,
   the human who clicks the link, the dependency nobody audited.

4. COMPLEXITY IS THE ENEMY OF SECURITY
   Every feature, every integration, every line of code is attack surface.
   Simple systems have fewer places to hide bugs.

5. SECOND-ORDER EFFECTS
   "If I break X, what else breaks?"
   Cascading failures, trust chain compromises, data propagation issues.

6. TIME IS AN ATTACK VECTOR
   Race conditions, TOCTOU (Time of Check to Time of Use),
   expired tokens still accepted, stale caches serving sensitive data.
```

### The "How Would I Break This?" Protocol
```
For ANY system, feature, or decision, ask these questions IN ORDER:

1. WHAT ARE THE ASSUMPTIONS?
   What does this system assume is always true?
   Each assumption is a potential attack vector.

   Example: "We assume the user sends their own userId in the request"
   Attack: Send someone else's userId (BOLA)

2. WHAT ARE THE INPUTS?
   Every input is a potential injection point.
   User inputs, API parameters, headers, cookies, environment variables,
   database values, file uploads, webhook payloads, configuration files.

3. WHAT ARE THE TRUST BOUNDARIES?
   Where does trusted data become untrusted?
   Where does control pass between components?
   Each boundary crossing is an attack opportunity.

4. WHAT HAPPENS WHEN THINGS FAIL?
   Error messages that leak information
   Fallback behaviors that bypass security
   Partial failures that leave data in inconsistent states
   Timeouts that leave locks held

5. WHAT ARE THE RACE CONDITIONS?
   Can two requests modify the same data simultaneously?
   Can a user change permissions mid-operation?
   Can a token expire during a multi-step process?

6. WHO BENEFITS FROM BREAKING THIS?
   Financial gain (bypass payments, steal credits)
   Data access (PII, trade secrets, credentials)
   Disruption (competitors, hacktivists)
   Ego (bug bounty hunters, resume padding)
```

---

## 2. Threat Modeling: STRIDE

### STRIDE Categories
```
S — SPOOFING (Identity)
  Can an attacker pretend to be someone else?
  - Stolen credentials
  - Session hijacking
  - Forged tokens/certificates
  - IP spoofing

  Stone AI examples:
  - Can a user forge a Clerk JWT?
  - Can a user impersonate another user's bestie?
  - Can a free user spoof a PRO tier?

T — TAMPERING (Integrity)
  Can an attacker modify data they shouldn't?
  - SQL injection modifying records
  - Man-in-the-middle modifying API responses
  - Manipulating client-side state
  - Modifying cookies or local storage

  Stone AI examples:
  - Can a user modify their subscription tier in the request?
  - Can a user tamper with agent responses before they're stored?
  - Can a user modify forum posts after moderation approval?

R — REPUDIATION (Non-repudiation)
  Can an attacker deny performing an action?
  - No audit logs
  - Logs can be modified
  - Actions not tied to authenticated identity
  - Timestamp manipulation

  Stone AI examples:
  - Can a user deny making a payment?
  - Can an admin deny deleting a user?
  - Are all agent interactions logged with user identity?

I — INFORMATION DISCLOSURE
  Can an attacker access data they shouldn't?
  - Verbose error messages
  - API over-exposure (returning extra fields)
  - Directory listing
  - Timing attacks
  - Memory leaks

  Stone AI examples:
  - Do error messages reveal database schema?
  - Does the user API return other users' data?
  - Can Chaos/Royal Guard endpoints be discovered by non-founders?

D — DENIAL OF SERVICE
  Can an attacker make the system unavailable?
  - Resource exhaustion (CPU, memory, disk, connections)
  - Algorithmic complexity attacks (regex DoS)
  - Rate limiting bypass
  - Distributed attacks

  Stone AI examples:
  - Can a user exhaust LLM capacity for other users?
  - Can a user create infinite chat sessions?
  - Can a user upload massive files?

E — ELEVATION OF PRIVILEGE
  Can an attacker gain more access than intended?
  - Vertical escalation (user → admin)
  - Horizontal escalation (user A → user B's data)
  - Parameter manipulation
  - Insecure direct object references

  Stone AI examples:
  - Can a FREE user access SMART agents?
  - Can a regular user access admin endpoints?
  - Can any user access founder-only Royal Guard agents?
```

### STRIDE Threat Model Template
```
System: Stone AI Chat API
Component: POST /api/chat

| STRIDE | Threat | Likelihood | Impact | Mitigation |
|--------|--------|-----------|--------|------------|
| S | User forges JWT to impersonate another user | Low | Critical | Clerk handles JWT, verify issuer/audience |
| S | User changes userId in request body | High | Critical | Extract userId from JWT, never from body |
| T | User modifies agentId to access higher-tier agent | High | Medium | Server-side tier check before agent access |
| T | User injects malicious content into chat history | Medium | High | Input sanitization, output encoding |
| R | User denies sending inappropriate content | Medium | Low | All messages logged with userId and timestamp |
| I | Error response reveals database connection string | Low | Critical | Generic error messages in production |
| I | Chat API returns other users' conversations | Medium | Critical | BOLA check: filter by authenticated userId |
| D | User sends 10,000 requests/minute | Medium | High | Rate limiting: 50 req/min per user |
| D | User sends 100KB message to cause LLM timeout | Medium | Medium | Input length limit: 10,000 characters |
| E | FREE user accesses Agent #20 (PLUS tier) | High | Medium | Server-side tier validation on every request |
| E | Regular user accesses /api/admin/* | Medium | Critical | requirePermission('admin') middleware |
```

---

## 3. DREAD Risk Assessment

### DREAD Scoring (1-10 each)
```
D — Damage:         How much damage if exploited?
R — Reproducibility: How easy to reproduce the attack?
E — Exploitability:  How much expertise/effort to exploit?
A — Affected Users:  How many users affected?
D — Discoverability: How easy to find the vulnerability?

Score each 1-10, then average for overall risk:
  Risk = (D + R + E + A + D) / 5

Risk levels:
  8-10: Critical — Fix immediately
  5-7:  High — Fix in current sprint
  3-4:  Medium — Fix in next release
  1-2:  Low — Track and fix when convenient

Example: BOLA in chat API
  Damage:         9 (full access to other users' conversations)
  Reproducibility: 10 (just change the ID in the URL)
  Exploitability:  9 (no special tools needed)
  Affected Users:  10 (all users)
  Discoverability: 8 (obvious to anyone who looks at the API)
  Risk: (9+10+9+10+8)/5 = 9.2 → CRITICAL, fix IMMEDIATELY
```

---

## 4. Attack Surface Analysis

### Mapping Attack Surface
```
For any application, map:

ENTRY POINTS (where data enters the system):
  ├── User interfaces (web forms, mobile inputs)
  ├── API endpoints (REST, GraphQL, WebSocket)
  ├── File upload endpoints
  ├── Webhook receivers
  ├── Email processing
  ├── OAuth callbacks
  ├── Admin interfaces
  └── CLI tools / management scripts

DATA STORES (where sensitive data lives):
  ├── Database tables (user data, credentials, PII)
  ├── File storage (uploads, exports, backups)
  ├── Cache (session data, tokens)
  ├── Logs (may contain sensitive data)
  ├── Environment variables
  └── Configuration files

TRUST BOUNDARIES (where trust changes):
  ├── Internet → Application (untrusted → trusted)
  ├── Application → Database (app → privileged access)
  ├── User → Admin (different permission levels)
  ├── Service → Service (cross-service trust)
  ├── Third-party API → Application (external → internal)
  └── Client-side → Server-side (always untrusted → validated)

EXTERNAL DEPENDENCIES:
  ├── Third-party APIs (Clerk, Stripe, Anthropic)
  ├── npm packages (supply chain)
  ├── Base Docker images
  ├── CDN / DNS providers
  ├── Cloud provider services
  └── Email service
```

### Attack Surface Reduction Checklist
```
For each entry point:
  □ Is authentication required? (If not, why not?)
  □ Is authorization checked? (BOLA and BFLA)
  □ Is input validated? (Zod .strict(), length limits)
  □ Is rate limiting applied?
  □ Are error messages generic?
  □ Is the endpoint documented? (Undocumented = shadow API)
  □ Can it be removed or restricted?

For each data store:
  □ Is data encrypted at rest?
  □ Is data encrypted in transit?
  □ Is access logged?
  □ Are backups encrypted?
  □ Is PII minimized? (Don't store what you don't need)
  □ Is there a data retention policy?

For each trust boundary:
  □ Is input re-validated at the boundary?
  □ Is output sanitized at the boundary?
  □ Are credentials scoped to minimum required?
  □ Is the boundary logged/monitored?
```

---

## 5. Abuse Case Design

### What Are Abuse Cases?
```
Use cases describe INTENDED behavior:
  "User creates an account and logs in"

Abuse cases describe UNINTENDED exploitation:
  "Attacker creates 10,000 accounts to abuse free tier"
  "Attacker creates account with XSS in display name"
  "Attacker uses stolen credentials to log in as another user"

For every use case, generate at least 3 abuse cases.
```

### Abuse Case Template
```
FEATURE: Referral System
USE CASE: User refers a friend and earns a reward

ABUSE CASES:
1. Self-referral:
   Attack: User creates second account to refer themselves
   Impact: Free rewards without genuine referrals
   Defense: @@unique constraint on referral, email domain matching, IP tracking

2. Referral farming:
   Attack: User creates bot army of fake accounts, all use referral code
   Impact: Massive reward accumulation
   Defense: Account age + activity requirements before reward granted

3. Referral code brute force:
   Attack: User tries random referral codes to find valid ones
   Impact: Unauthorized referral tracking
   Defense: Rate limit referral code attempts, use non-guessable codes

4. Referral reward timing exploit:
   Attack: Referred user upgrades, referrer gets reward, referred user immediately cancels
   Impact: Reward granted for non-genuine conversion
   Defense: Delay reward until referred user maintains subscription for 30 days

5. Referral link injection:
   Attack: Referral link embedded in phishing email
   Impact: Reputation damage, association with spam
   Defense: Monitor referral link distribution, ability to disable codes
```

---

## 6. Pre-Mortem Analysis

### The Pre-Mortem Protocol
```
Traditional post-mortem: "The system failed. Why did it fail?"
Pre-mortem:              "Assume the system WILL fail. How did it fail?"

The pre-mortem is the most powerful adversarial thinking tool for business decisions.

Process:
  1. Describe the plan/feature/deployment
  2. Fast-forward: "It's 6 months from now. This failed spectacularly."
  3. Each person writes: "It failed because..."
  4. Collect all failure scenarios
  5. Rank by likelihood and impact
  6. Build mitigations for the top scenarios
  7. Decide: Do we proceed (with mitigations) or abort?
```

### Pre-Mortem Template
```
PROJECT: Launch Stone AI on Vercel with production Stripe
DATE: 2026-03-10

SCENARIO: "It's September 2026. The launch failed. Why?"

FAILURE MODES:
1. "Stripe keys leaked because env vars were visible in client-side code"
   Likelihood: Medium | Impact: Critical
   Mitigation: Server-only env vars (STRIPE_SECRET_KEY never prefixed with NEXT_PUBLIC_)
   Pre-check: Grep codebase for Stripe keys in client components

2. "vLLM server was overwhelmed — 50 concurrent users crashed it"
   Likelihood: High | Impact: High
   Mitigation: Queue-based architecture, rate limiting, Haiku fallback
   Pre-check: Load test vLLM with simulated concurrent users

3. "A user exploited bestie to generate harmful content that went viral"
   Likelihood: Medium | Impact: Critical
   Mitigation: Content policy enforcement, output filtering, incident response plan
   Pre-check: Red team bestie with adversarial prompts

4. "Neon database hit connection limit during peak hours"
   Likelihood: High | Impact: High
   Mitigation: Connection pooling (Neon's built-in pooler), Prisma connection limit
   Pre-check: Verify pooler configuration, load test database connections

5. "A competitor copied our agent prompts because they were exposed in client-side code"
   Likelihood: Medium | Impact: Medium
   Mitigation: All agent system prompts server-side only, never sent to client
   Pre-check: Audit network tab in browser dev tools during agent interactions
```

---

## 7. Red Team Applied to Code Review

### Adversarial Code Review Checklist
```
For EVERY code review, ask:

INPUT HANDLING:
  □ Where does user input enter this code?
  □ Is it validated with Zod .strict()? (Stone AI requirement)
  □ Can the input be null, undefined, or empty string?
  □ What happens with extremely long input?
  □ Can the input contain special characters? SQL? HTML? JS?
  □ Is the input used in a database query? (SQL injection risk)
  □ Is the input displayed to other users? (XSS risk)
  □ Is the input used in a file path? (path traversal risk)
  □ Is the input used in a system command? (command injection risk)

AUTHENTICATION & AUTHORIZATION:
  □ Does this endpoint require authentication?
  □ Is the user's identity verified from the token, not the request body?
  □ Is object-level authorization checked? (BOLA)
  □ Is function-level authorization checked? (BFLA)
  □ Can a lower-tier user access this feature?

STATE & CONCURRENCY:
  □ Can two requests race on the same data?
  □ Is there a TOCTOU vulnerability? (check then act)
  □ What happens if this operation is interrupted midway?
  □ Is there proper transaction handling?

ERROR HANDLING:
  □ Do error messages reveal internal details?
  □ Does the error path bypass security checks?
  □ Is the error logged with appropriate detail?
  □ Does the catch block actually handle the error?

DEPENDENCIES:
  □ Are new dependencies necessary?
  □ Do they have known vulnerabilities?
  □ Are they maintained and widely used?
  □ Do they execute post-install scripts?
```

---

## 8. Red Team Applied to Architecture

### Architecture Attack Patterns
```
1. SINGLE POINT OF FAILURE
   "If this one component goes down, does everything fail?"
   Look for: Single database, single region, single DNS provider

2. BLAST RADIUS
   "If this component is compromised, what else is exposed?"
   Look for: Shared credentials, flat networks, over-privileged services

3. DATA FLOW ANALYSIS
   "Where does sensitive data flow, and can it leak at any point?"
   Trace PII from input → processing → storage → display → deletion

4. DEPENDENCY CHAIN ANALYSIS
   "What happens when a third-party service goes down?"
   Map: Clerk down → no auth → complete outage
        Stripe down → no payments → degraded but functional
        Anthropic down → no SMART agents → fallback to Haiku

5. SCALING ATTACK
   "Can an attacker force us to auto-scale to bankruptcy?"
   Look for: Uncapped auto-scaling, no budget alerts, no WAF
```

---

## 9. Red Team Applied to Business Strategy

### Business Adversarial Thinking
```
1. COMPETITIVE ATTACK
   "If I were our competitor, how would I beat us?"
   - Undercut on pricing
   - Clone our best features
   - Target our best customers
   - File IP complaints
   - Hire our key people

2. MARKET RISK
   "What external change would destroy our business model?"
   - Free alternative emerges (OpenAI makes agents free)
   - Regulation changes (AI regulation restricts our product)
   - Platform risk (Vercel/Cloudflare changes terms)
   - Technology shift (new paradigm makes our approach obsolete)

3. INTERNAL RISK
   "What internal failure would be catastrophic?"
   - Key person dependency (founder unavailable)
   - Data breach (reputation + legal)
   - Technical debt accumulation (can't ship features)
   - Cash flow (expenses exceed revenue before profitability)

4. CUSTOMER ADVERSARIAL
   "How would a customer abuse our service?"
   - Exceed tier limits through workarounds
   - Use our agents to generate harmful content
   - Scrape our agent prompts/knowledge
   - Use referral system for fraud
   - Chargeback after consuming service
```

---

## 10. The Red Team Mindset Summary

```
BEFORE you build anything, ask: "How would I break this?"
BEFORE you ship anything, ask: "What did I miss?"
BEFORE you trust anything, ask: "What if this lies?"
AFTER something works, ask: "Why does it work? Could it work differently than I think?"

The best defender is someone who has learned to think like an attacker.
The best architect is someone who has learned to see their own blind spots.
The best leader is someone who has imagined their own failure.

Adversarial thinking is not pessimism. It is PREPAREDNESS.
```

---

*This seed is maintained by the Security & Strategy team. Last validated: 2026-03.*
