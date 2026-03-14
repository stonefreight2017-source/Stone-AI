# OWASP Top 10 — Operational Detection and Prevention

## Core Principle

This is NOT a description of what each vulnerability is. This is a set of RULES to check before every DB query, every HTML render, every API response, and every auth check. Detection patterns and prevention rules, calibrated for Next.js + Prisma + Clerk.

## A01: Broken Access Control

**Pre-code checklist (check BEFORE writing any endpoint):**
```
[] Does this endpoint check authentication? (Clerk session valid?)
[] Does this endpoint check authorization? (User has right tier/role?)
[] Does this endpoint verify resource ownership? (Resource belongs to this user?)
[] Is the auth check in middleware/server, NOT in client code?
[] Can changing a URL parameter (userId, conversationId) access another user's data?
```

**Detection pattern in code review:**
```typescript
// RED FLAG: No auth check
export async function GET(req: Request) {
  const { id } = req.params;
  return prisma.conversation.findUnique({ where: { id } }); // WHO is asking?
}

// RED FLAG: Auth check but no ownership check
export async function GET(req: Request) {
  const { userId } = auth(); // Good: knows WHO
  const { id } = req.params;
  return prisma.conversation.findUnique({ where: { id } }); // Bad: doesn't check ownership
}

// CORRECT: Auth + ownership
export async function GET(req: Request) {
  const { userId } = auth();
  if (!userId) return new Response('Unauthorized', { status: 401 });

  const { id } = req.params;
  const conversation = await prisma.conversation.findUnique({
    where: { id, userId }, // Ownership enforced at query level
  });
  if (!conversation) return new Response('Not found', { status: 404 });
  return Response.json(conversation);
}
```

**Rule:** EVERY query that retrieves user-specific data MUST include `userId` in the WHERE clause.

## A02: Cryptographic Failures

**Pre-code checklist:**
```
[] Sensitive data encrypted at rest? (AES-256-GCM for PII, API keys, tokens)
[] HTTPS enforced? (Cloudflare SSL Full + HSTS)
[] Passwords/secrets hashed, not encrypted? (bcrypt/argon2, not AES)
[] No secrets in client-side code? (Check .env vs .env.local)
[] No secrets in URLs or logs?
```

**Detection pattern:**
```typescript
// RED FLAG: Secret in URL
redirect(`/callback?token=${resetToken}`);

// RED FLAG: Logging sensitive data
console.log('User payment:', paymentMethod);

// RED FLAG: Hardcoded secret
const apiKey = 'sk-ant-api03-xxxxx'; // NEVER

// CORRECT:
const apiKey = process.env.ANTHROPIC_API_KEY;
// Env var, server-side only, not in client bundle
```

**Rule:** Before any `console.log` or error response: "Does this contain secrets, tokens, or PII?"

## A03: Injection

**Pre-code checklist:**
```
[] All DB queries use Prisma (parameterized by default)?
[] Any $queryRaw calls use parameterized syntax?
[] All user input passed through Zod validation before use?
[] No eval(), no template literals in SQL, no string concatenation in queries?
[] HTML output properly escaped? (React handles this by default)
```

**Detection pattern:**
```typescript
// RED FLAG: String interpolation in raw SQL
const result = await prisma.$queryRaw`
  SELECT * FROM users WHERE name = '${userName}'
`; // SQL injection!

// CORRECT: Parameterized
const result = await prisma.$queryRaw`
  SELECT * FROM users WHERE name = ${userName}
`; // Prisma parameterizes tagged template literals

// RED FLAG: dangerouslySetInnerHTML with user content
<div dangerouslySetInnerHTML={{ __html: userComment }} /> // XSS!

// CORRECT: Let React escape it
<div>{userComment}</div> // React escapes by default

// RED FLAG: eval with user input
eval(userProvidedCode); // Remote code execution!
// There is NO correct version. Never use eval with user input.
```

**Rule:** Before any DB query: "Is input parameterized?" Before any HTML render: "Is output encoded?"

## A04: Insecure Design

**Pre-code checklist:**
```
[] Has this feature been threat-modeled? (See threat-modeling.md)
[] Are business logic checks server-side? (Not just UI disabled buttons)
[] Is there a rate limit on this operation?
[] Is there an abuse scenario? (What if a user does this 10,000 times?)
```

**Rule:** "If I removed the frontend entirely and called the API directly, would my security controls still work?"

## A05: Security Misconfiguration

**Pre-code checklist:**
```
[] Default credentials changed? (DB, admin panels)
[] Error messages generic to users? (No stack traces, no internal paths)
[] Unnecessary HTTP methods disabled? (Only GET/POST/PUT/DELETE as needed)
[] Security headers set? (CSP, X-Frame-Options, X-Content-Type-Options)
[] Debug mode off in production?
[] Directory listing disabled?
```

**Detection pattern in Next.js:**
```typescript
// RED FLAG: Detailed error in response
catch (error) {
  return Response.json({ error: error.message, stack: error.stack }, { status: 500 });
}

// CORRECT: Generic error to user, details in server log
catch (error) {
  console.error('Chat API error:', error); // Server-side only
  return Response.json(
    { error: 'Something went wrong', errorId: generateErrorId() },
    { status: 500 }
  );
}
```

**Rule:** Error responses to users contain: generic message + error ID. Error logs on server contain: everything.

## A06: Vulnerable and Outdated Components

**Pre-code checklist:**
```
[] npm audit run recently? (Check for known vulnerabilities)
[] Dependencies on latest stable? (Not bleeding edge, not outdated)
[] No unmaintained packages? (Check last commit date)
[] Lock file committed? (package-lock.json or pnpm-lock.yaml)
```

**Rule:** Run `npm audit` before every deploy. Fix critical/high. Document accepted risks for medium/low.

## A07: Identification and Authentication Failures

**Pre-code checklist:**
```
[] Using Clerk for auth? (Don't roll your own)
[] Session tokens httpOnly, secure, sameSite?
[] Session expiration set?
[] No credentials in URLs?
[] Rate limiting on login attempts?
```

**Detection pattern:**
```typescript
// RED FLAG: Custom auth implementation
function verifyPassword(input, stored) {
  return input === stored; // Plain text comparison!
}

// CORRECT: Use Clerk
const { userId } = auth(); // Clerk handles everything

// RED FLAG: userId from request body
const { userId, message } = await req.json();
// User can send any userId!

// CORRECT: userId from auth
const { userId } = auth(); // From verified session
const { message } = await req.json(); // Only user input from body
```

**Rule:** NEVER accept userId from the client. ALWAYS derive it from the authenticated session.

## A08: Software and Data Integrity Failures

**Pre-code checklist:**
```
[] Webhook signatures verified? (Stripe signing secret)
[] Dependencies from trusted sources? (npm registry, not random URLs)
[] CI/CD pipeline protected? (Branch protection, required reviews)
[] Serialized data validated before use? (Don't trust JSON from external sources)
```

**Detection pattern:**
```typescript
// RED FLAG: Unverified webhook
export async function POST(req: Request) {
  const event = await req.json(); // Trusting the payload!
  if (event.type === 'checkout.session.completed') {
    await upgradeUser(event.data.object.customer);
  }
}

// CORRECT: Verify webhook signature
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
  // Now safe to process
}
```

**Rule:** Every webhook endpoint MUST verify the signature before processing.

## A09: Security Logging and Monitoring Failures

**Pre-code checklist:**
```
[] Auth failures logged? (Failed logins, invalid tokens)
[] Access control failures logged? (403s with context)
[] Sensitive operations logged? (Billing changes, role changes, data exports)
[] Logs don't contain secrets? (No tokens, passwords, API keys in logs)
[] Log monitoring/alerting set up? (Know when attacks happen)
```

**What to log:**
```
ALWAYS LOG:
  - Authentication failures (who, when, from where)
  - Authorization failures (who tried to access what)
  - Billing operations (upgrades, downgrades, refunds)
  - Admin actions (user management, config changes)
  - Rate limit hits (who's being throttled)

NEVER LOG:
  - Passwords (even hashed)
  - Full API keys or tokens
  - Credit card numbers
  - Session tokens
  - Personal health/financial data
```

## A10: Server-Side Request Forgery (SSRF)

**Pre-code checklist:**
```
[] Does this endpoint make requests based on user input? (URLs, hostnames)
[] Is the destination restricted? (Allowlist, not blocklist)
[] Can the user make the server call internal services?
```

**Detection pattern:**
```typescript
// RED FLAG: Fetching user-provided URL
const response = await fetch(userProvidedUrl); // SSRF!
// User could provide: http://localhost:5432 (database)
// Or: http://169.254.169.254/latest/meta-data (cloud metadata)

// CORRECT: Validate and restrict
const allowedDomains = ['api.anthropic.com', 'api.stripe.com'];
const url = new URL(userProvidedUrl);
if (!allowedDomains.includes(url.hostname)) {
  return new Response('Forbidden', { status: 403 });
}
```

## Quick Security Review Checklist

Run through this for EVERY PR that touches API routes:

```
[] Auth present on protected endpoints?
[] userId from session, not request body?
[] Resource ownership validated in queries?
[] Input validated with Zod .strict()?
[] Error messages generic to users?
[] No secrets in client code or logs?
[] Rate limiting on sensitive operations?
[] Webhook signatures verified?
[] No raw SQL without parameterization?
[] No dangerouslySetInnerHTML with user content?
```

## Integration

- **Threat Modeling** provides the endpoint-level analysis
- **Defense in Depth** provides layered protection
- **Zero Trust Applied** provides the trust architecture
- **Testing Strategy** defines what security tests to write
