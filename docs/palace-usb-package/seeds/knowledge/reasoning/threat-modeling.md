# Threat Modeling — STRIDE Applied to Web Apps

## Core Principle

Every API endpoint is an attack surface. Threat modeling forces you to think like an attacker BEFORE you ship, not after you get breached. STRIDE gives you a systematic way to find vulnerabilities instead of hoping you'll think of them.

## STRIDE Categories

```
S — Spoofing:     Can someone pretend to be someone else?
T — Tampering:    Can someone modify data they shouldn't?
R — Repudiation:  Can someone deny they did something?
I — Information Disclosure: Can someone see data they shouldn't?
D — Denial of Service: Can someone make the system unavailable?
E — Elevation of Privilege: Can someone gain access they shouldn't have?
```

## The Endpoint Threat Model Template

For EVERY API endpoint, answer these questions:

```
ENDPOINT: [Method] [Path]
PURPOSE: [What it does]
AUTH: [Who can call it]

SPOOFING:
  - Who can call this endpoint?
  - How is the caller authenticated?
  - Can the auth token be stolen/forged?
  - Can someone call this pretending to be another user?

TAMPERING:
  - What data does this endpoint accept?
  - Is all input validated? (Zod .strict()?)
  - Can the request body be modified in transit?
  - Can someone modify data that should be immutable?

REPUDIATION:
  - Is this action logged?
  - Can someone perform this action and deny it?
  - Is the audit trail tamper-proof?

INFORMATION DISCLOSURE:
  - What data does the response contain?
  - Does it include data the caller shouldn't see?
  - Do error messages leak internal details?
  - Is PII exposed in URLs, logs, or error responses?

DENIAL OF SERVICE:
  - Is this endpoint rate-limited?
  - Can it be called with inputs that cause expensive operations?
  - Can a single user exhaust shared resources?

ELEVATION OF PRIVILEGE:
  - Can a FREE user access SMART features through this endpoint?
  - Can a regular user access admin functionality?
  - Can manipulating the request body change the user's role/tier?
```

## Applied to Stone AI Endpoints

### Example 1: POST /api/chat

```
ENDPOINT: POST /api/chat
PURPOSE: Send a message and get an AI response
AUTH: Authenticated users with appropriate tier

SPOOFING:
  - Auth: Clerk session token required
  - Risk: Session token in cookie — httpOnly, secure, sameSite
  - Check: Is Clerk session validated on every request?
  - Check: Is the userId taken from the SESSION, not the request body?
    (Never trust client-sent userId)

TAMPERING:
  - Accepts: message text, agentId, conversationId
  - Risk: User sends agentId they don't have access to (tier bypass)
  - Check: Server validates user's tier permits the requested agent
  - Check: Zod .strict() rejects extra fields (no admin:true injection)
  - Check: conversationId belongs to the authenticated user (IDOR prevention)

REPUDIATION:
  - Messages are stored in DB with userId and timestamp
  - Risk: User claims they didn't send a message
  - Mitigation: Audit log with immutable timestamps

INFORMATION DISCLOSURE:
  - Response includes AI-generated text
  - Risk: AI leaks system prompt or other users' data
  - Check: System prompt is never included in user-visible responses
  - Check: Error messages don't expose model details, API keys, or stack traces

DENIAL OF SERVICE:
  - AI calls are expensive (compute + API cost)
  - Risk: User sends thousands of messages to drain resources
  - Check: Rate limiting per user per minute
  - Check: Message length limit
  - Check: Concurrent request limit per user

ELEVATION OF PRIVILEGE:
  - Risk: FREE user tries to use SMART agent by changing agentId
  - Check: Server-side tier check, not client-side
  - Risk: User modifies request to change AI provider (force Anthropic)
  - Check: AI routing logic is server-side only
```

### Example 2: POST /api/billing/upgrade

```
ENDPOINT: POST /api/billing/upgrade
PURPOSE: Upgrade user's subscription tier
AUTH: Authenticated users

SPOOFING:
  - Auth: Clerk session + Stripe customer verification
  - Risk: Someone upgrades another user's account (unlikely but check)
  - Check: Stripe customer ID is looked up from auth, never from request

TAMPERING:
  - Accepts: target tier, billing interval, promo code
  - Risk: User sends a tier with modified pricing
  - Check: Server looks up pricing from TIER_CONFIG, never from client
  - Check: Promo code validated server-side, discount calculated server-side
  - Check: Zod .strict() on all inputs

REPUDIATION:
  - All billing changes logged with timestamps
  - Stripe provides independent audit trail
  - Risk: Disputes — "I didn't authorize this charge"
  - Mitigation: Stripe handles disputes with their own evidence

INFORMATION DISCLOSURE:
  - Response may include payment method details
  - Risk: Full card number in response (should never happen)
  - Check: Only last 4 digits, card brand in response
  - Check: No Stripe secret keys in client-side code

DENIAL OF SERVICE:
  - Rapid upgrade/downgrade cycling
  - Risk: Generates many Stripe API calls, webhook events
  - Check: Rate limit tier changes (max 3 per day)
  - Check: Cooldown period between changes

ELEVATION OF PRIVILEGE:
  - Risk: User upgrades without paying
  - Check: Tier change ONLY happens via Stripe webhook confirmation,
    never on the upgrade request itself
  - Risk: User modifies webhook to fake a successful payment
  - Check: Webhook signature verification (Stripe signing secret)
```

### Example 3: GET /api/admin/users

```
ENDPOINT: GET /api/admin/users
PURPOSE: List all users for admin dashboard
AUTH: Admin role required

SPOOFING:
  - Auth: Clerk session + admin role check
  - Risk: Regular user accesses admin endpoint
  - Check: Role check is in middleware, not just UI-level
  - Check: Admin role comes from server (Clerk metadata), not from
    client cookie or request header

TAMPERING:
  - Accepts: pagination, filters, search query
  - Risk: SQL injection in search parameter
  - Check: Prisma parameterizes all queries automatically
  - Check: Search term sanitized and length-limited

REPUDIATION:
  - Admin actions should be separately logged
  - Risk: Admin views user data without accountability
  - Check: Admin access logged with admin userId and timestamp

INFORMATION DISCLOSURE:
  - Returns user data — PII risk
  - Risk: Exposing passwords, tokens, payment details
  - Check: Response includes only necessary fields (name, email, tier, status)
  - Check: No password hashes, no Stripe tokens, no session tokens
  - Check: Pagination prevents dumping entire user table

DENIAL OF SERVICE:
  - Large dataset queries
  - Risk: Requesting all users without pagination crashes server
  - Check: Mandatory pagination with max page size
  - Check: Search queries are indexed

ELEVATION OF PRIVILEGE:
  - Risk: Admin endpoint allows writing (should be read-only for listing)
  - Check: GET endpoint only — no mutations on this route
  - Risk: Admin can see founder-only data (Chaos agent)
  - Check: Founder-level data requires founder role, not just admin
```

## Threat Model Checklist (Quick Version)

For every new endpoint before shipping:

```
[] Auth: Is the caller authenticated?
[] Authz: Is the caller AUTHORIZED for this specific action?
[] Input: Is ALL input validated with Zod .strict()?
[] Ownership: Does the resource belong to the authenticated user?
[] Output: Does the response contain only necessary data?
[] Errors: Are error messages generic to the user, detailed in logs?
[] Rate limit: Is this endpoint rate-limited?
[] Logging: Is this action logged for audit?
[] IDOR: Can changing an ID parameter access another user's data?
[] Injection: Are queries parameterized? Is output encoded?
```

## Prioritizing Threats

Not all threats are equal. Prioritize by:

```
CRITICAL (fix before shipping):
  - Auth bypass (anyone can call authenticated endpoints)
  - IDOR (users can access other users' data)
  - Injection (SQL, XSS, command injection)
  - Billing bypass (access paid features without paying)

HIGH (fix within first sprint):
  - Missing rate limiting on expensive operations
  - Information leakage in error messages
  - Missing audit logging on sensitive operations

MEDIUM (fix when convenient):
  - Overly broad API responses (returning more data than needed)
  - Missing rate limiting on non-sensitive operations
  - Incomplete input validation (valid but unnecessary fields accepted)

LOW (track for later):
  - Denial of service beyond basic rate limiting
  - Repudiation for non-sensitive operations
  - Information disclosure in non-sensitive responses
```

## Integration

- **OWASP Operational** provides specific detection rules for each threat
- **Defense in Depth** provides layered mitigations
- **Zero Trust Applied** provides the trust model
- **OODA** provides the incident response loop when a threat is exploited
- **Inversion** helps identify what an attacker would do
