# Defense in Depth

## Core Principle

No single security control is perfect. Defense in depth means layering multiple independent controls so that if one fails, others still protect the system. The question is never "Is this control good enough?" — it's "What happens WHEN this control fails?"

## The 4 Defense Layers Template

For any sensitive operation, ensure all 4 layers are present:

```
LAYER 1 — PERIMETER (Stop bad requests from entering)
  Network level: Cloudflare WAF, DDoS protection, IP filtering
  Application level: Rate limiting, input validation, CORS
  Question: "Can a malicious request even reach our code?"

LAYER 2 — AUTHENTICATION & AUTHORIZATION (Verify identity and permissions)
  Identity: Clerk session validation
  Authorization: Tier checks, role checks, resource ownership
  Question: "Even if a request reaches our code, is the caller allowed?"

LAYER 3 — DATA PROTECTION (Protect data even if auth fails)
  Encryption: AES-256-GCM at rest, HTTPS in transit
  Isolation: User data scoped by userId in all queries
  Minimization: Only store what's needed, only return what's needed
  Question: "Even if auth is bypassed, can they get useful data?"

LAYER 4 — DETECTION & RESPONSE (Know when layers fail)
  Logging: Security events logged with context
  Monitoring: Alerts on anomalous patterns
  Response: Incident playbook, automatic lockout
  Question: "If all above layers fail, do we know about it?"
```

## Applied to Stone AI Architecture

### Protecting User Conversations

```
SCENARIO: Attacker tries to read another user's chat history.

LAYER 1 — PERIMETER:
  - Cloudflare blocks known malicious IPs
  - Rate limiting prevents bulk enumeration of conversation IDs
  - Input validation rejects malformed conversation IDs
  ATTACKER STATUS: Blocked if using known attack patterns.
  IF BYPASSED → Layer 2.

LAYER 2 — AUTH & AUTHZ:
  - Clerk session required (no anonymous access)
  - ConversationId query includes userId: WHERE { id, userId }
  - Even with a valid conversation ID, wrong user gets 404
  ATTACKER STATUS: Must have a valid account AND the target's conversation ID.
  IF BYPASSED → Layer 3.

LAYER 3 — DATA PROTECTION:
  - Sensitive conversation content encrypted with AES-256-GCM
  - Encryption key derived from user-specific material
  - Even raw DB access doesn't yield readable conversations
  ATTACKER STATUS: Has encrypted data they can't read.
  IF BYPASSED → Layer 4.

LAYER 4 — DETECTION:
  - Unusual query patterns logged (many 404s = enumeration attempt)
  - Alerts on auth failures from same IP
  - Automatic temporary IP ban after 10 failed auth attempts
  RESULT: Even if attack succeeds, we know and can respond.
```

### Protecting Billing Operations

```
SCENARIO: Attacker tries to upgrade their tier without paying.

LAYER 1 — PERIMETER:
  - Rate limit tier change requests (max 3/day)
  - Zod .strict() rejects extra fields in upgrade request
  - CSP prevents script injection that could trigger upgrades
  IF BYPASSED → Layer 2.

LAYER 2 — AUTH & AUTHZ:
  - Clerk session validates identity
  - Tier changes ONLY processed via Stripe webhook, not direct API call
  - Webhook endpoint verifies Stripe signature (HMAC)
  - User cannot call the tier-change function directly
  IF BYPASSED → Layer 3.

LAYER 3 — DATA PROTECTION:
  - Stripe is the source of truth for subscription state
  - Local DB tier is a CACHE of Stripe state, not the authority
  - Even if local DB is modified, Stripe webhook reconciliation corrects it
  - Periodic Stripe sync verifies local state matches Stripe
  IF BYPASSED → Layer 4.

LAYER 4 — DETECTION:
  - All tier changes logged with timestamp, method, source
  - Alert on tier changes without corresponding Stripe event
  - Monthly reconciliation audit: local tiers vs Stripe subscriptions
  RESULT: Unauthorized upgrade is detected and reversed.
```

### Protecting Admin Functions

```
SCENARIO: Regular user tries to access admin endpoints.

LAYER 1 — PERIMETER:
  - Admin routes on a separate path (/api/admin/*)
  - Rate limiting on admin paths (stricter than user paths)
  - No admin routes discoverable from client-side code
  IF BYPASSED → Layer 2.

LAYER 2 — AUTH & AUTHZ:
  - Clerk session required
  - Admin role check from Clerk metadata (server-side, not client cookie)
  - Middleware-level check: request never reaches handler without admin role
  - Founder-only endpoints additionally check for founder role
  IF BYPASSED → Layer 3.

LAYER 3 — DATA PROTECTION:
  - Admin endpoints return paginated, filtered data (no full dumps)
  - Sensitive fields (payment details, passwords) excluded from admin views
  - Admin actions are write-protected with confirmation tokens
  IF BYPASSED → Layer 4.

LAYER 4 — DETECTION:
  - Every admin endpoint access logged (who, what, when)
  - Alert on admin access from new IP/device
  - Alert on bulk data requests
  - Admin actions create audit trail entries
  RESULT: Unauthorized admin access is logged and alerted.
```

## Building Defense in Depth for New Features

When adding any feature that handles sensitive data or actions:

```
STEP 1: Identify what you're protecting
  - What data/action needs protection?
  - What's the worst case if it's compromised?

STEP 2: Define each layer
  For each of the 4 layers, answer:
  - What control exists at this layer?
  - How does it fail? (Every control has failure modes)
  - What does the attacker see if this layer fails?

STEP 3: Verify independence
  - Do layers depend on each other? (They shouldn't)
  - If Layer 2 fails, does Layer 3 still work?
  - Can an attacker disable multiple layers with one action?

STEP 4: Test each layer independently
  - Disable Layer 1: Can Layer 2 stop the attack?
  - Disable Layer 2: Can Layer 3 protect the data?
  - Disable Layer 3: Does Layer 4 detect the breach?
```

## Common Gaps

### 1. All Security at One Layer
```
BAD: All security in the API route handler. If one handler misses
     a check, everything is exposed.

FIX: Auth in middleware (Layer 2), ownership in queries (Layer 3),
     monitoring across all requests (Layer 4).
```

### 2. Dependent Layers
```
BAD: Encryption key stored in the same database as encrypted data.
     Compromise one → compromise both.

FIX: Encryption keys in separate key management (env vars, KMS).
     DB compromise doesn't yield decryption capability.
```

### 3. Missing Detection Layer
```
BAD: Strong auth and encryption, but no logging or monitoring.
     If something goes wrong, you don't know until a user reports it.

FIX: Log security events. Alert on anomalies. Review logs regularly.
     You can't respond to what you can't see.
```

### 4. Security Theater
```
BAD: Impressive-looking controls that don't actually protect anything.
     Client-side auth checks. Obfuscated (not encrypted) data.
     Rate limiting by easily-spoofable header.

FIX: Every control must be server-side. Every control must be tested
     by actually attacking it. If you can bypass it in 5 minutes,
     it's not a control — it's decoration.
```

## Integration

- **Threat Modeling** identifies WHAT to protect at each layer
- **OWASP Operational** provides specific controls for each layer
- **Zero Trust Applied** provides the trust model that drives layer design
- **Inversion** helps identify how each layer could fail
- **Second-Order Effects** predicts what happens when a layer is breached
