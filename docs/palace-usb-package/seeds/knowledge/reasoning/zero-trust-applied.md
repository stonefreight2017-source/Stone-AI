# Zero Trust — Applied to Our Stack

## Core Principle

Zero trust means: never trust, always verify. Not the network, not the client, not the adjacent service, not even your own code running in a different context. Every boundary is a verification point.

## The Four Rules

### Rule 1: Never Trust the Client

```
PRINCIPLE: Anything from the client can be fabricated.

WHAT THIS MEANS IN PRACTICE:
  - userId: ALWAYS from server-side session, NEVER from request body
  - Role/tier: ALWAYS from server-side lookup, NEVER from cookie or header
  - Prices: ALWAYS from server config, NEVER from form submission
  - Feature flags: ALWAYS from server, NEVER from localStorage
  - Form data: ALWAYS validated server-side, even if validated client-side too

EXAMPLE — Wrong:
  const { userId, tier, agentId } = await req.json();
  // Client controls all three values!

EXAMPLE — Right:
  const { userId } = auth(); // From Clerk session
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const tier = user.subscription.tier; // From database
  const { agentId } = RequestSchema.parse(await req.json()); // Only user input validated
```

The frontend is a CONVENIENCE for the user. The server is the AUTHORITY.

### Rule 2: Never Trust the Network

```
PRINCIPLE: All network traffic can be intercepted or spoofed.

WHAT THIS MEANS IN PRACTICE:
  - HTTPS everywhere, no exceptions (Cloudflare SSL Full mode)
  - API keys never in URLs (use headers or body)
  - Webhooks verified by signature (Stripe signing secret)
  - Internal services authenticate to each other (not "it's on localhost so it's safe")
  - CORS configured to allow only your domains

EXAMPLE — Wrong:
  // "It's internal, so no auth needed"
  const dbStatus = await fetch('http://localhost:5432/status');

EXAMPLE — Right:
  // Internal calls still authenticated
  const dbStatus = await fetch('http://localhost:5432/status', {
    headers: { Authorization: `Bearer ${process.env.INTERNAL_API_KEY}` }
  });
```

### Rule 3: Validate Every Boundary

```
PRINCIPLE: Every time data crosses a boundary, validate it again.

BOUNDARIES IN NEXT.JS:
  Client → Server (API route): Validate with Zod .strict()
  Server → Database (Prisma): Prisma parameterizes, but validate types
  External → Server (webhooks): Verify signature, validate schema
  Server → External (API calls): Validate response before using

EXAMPLE — Right:
  // Webhook boundary
  const event = verifyStripeSignature(body, signature); // Verify source
  const data = WebhookSchema.parse(event.data); // Validate structure

  // API response boundary
  const aiResponse = await callAnthropic(prompt);
  const validated = AIResponseSchema.parse(aiResponse); // Don't trust external service
```

### Rule 4: Expire Aggressively

```
PRINCIPLE: Time-limited access. Shorter is safer.

WHAT THIS MEANS IN PRACTICE:
  - Session tokens: expire in hours, not days
  - API keys: rotate on a schedule (monthly for non-critical, weekly for critical)
  - Temporary URLs: expire in minutes
  - Cache entries: TTL appropriate to sensitivity (lower TTL for sensitive data)
  - Password reset links: expire in 15-30 minutes
  - Invite links: expire in 48 hours

EXAMPLE:
  // Share link with expiration
  const shareLink = await createShareLink({
    conversationId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  });

  // When accessing:
  if (shareLink.expiresAt < new Date()) {
    return new Response('Link expired', { status: 410 });
  }
```

## Zero Trust Applied to Stone AI Components

### Clerk (Auth Provider)
```
TRUST LEVEL: Verified but limited
  - Trust Clerk's session tokens (they're signed)
  - Verify session on EVERY request (don't cache auth state)
  - Don't trust Clerk metadata for authorization without server-side check
  - If Clerk goes down: fail CLOSED (deny access), not open
```

### Stripe (Payment Provider)
```
TRUST LEVEL: Verified but limited
  - Trust Stripe webhooks ONLY with signature verification
  - Trust Stripe as source of truth for subscription state
  - Don't trust client-reported payment status
  - Reconcile Stripe state with local DB periodically
  - If Stripe goes down: maintain last known state, don't change tiers
```

### AI Providers (vLLM / Anthropic)
```
TRUST LEVEL: Untrusted output
  - AI responses are UNTRUSTED USER CONTENT (even though they come from our own models)
  - Sanitize AI output before rendering in HTML
  - Don't let AI output influence auth or authorization decisions
  - Rate limit AI calls independently of user rate limits
  - If AI provider returns errors: graceful fallback, don't expose error details to user
```

### Database (PostgreSQL via Prisma)
```
TRUST LEVEL: Trusted store, untrusted content
  - Trust the database to store and retrieve correctly
  - Don't trust the CONTENT (it may have been written by a compromised process)
  - Always validate data shape when reading, not just when writing
  - Use least-privilege database roles (read-only where possible)
  - Connection encrypted (SSL to Neon)
```

## Zero Trust Checklist for New Features

```
[] Client input: All validated server-side with Zod .strict()?
[] Identity: Derived from session, not from client?
[] Authorization: Checked at server, not just hidden in UI?
[] Data access: Scoped to authenticated user?
[] External data: Validated before use?
[] Secrets: In env vars, not in code?
[] Connections: Encrypted (HTTPS/SSL)?
[] Tokens: Time-limited?
[] Errors: Don't leak internals?
[] Failures: Fail closed (deny), not open (allow)?
```

## The "Fail Closed" Principle

When a security check fails or is unavailable, the DEFAULT must be to DENY access, not grant it.

```
WRONG (fail open):
  try {
    const isAuthorized = await checkAuth(userId);
    if (!isAuthorized) return deny();
  } catch {
    // Auth service down — let them through
    return allow(); // DANGEROUS
  }

RIGHT (fail closed):
  try {
    const isAuthorized = await checkAuth(userId);
    if (!isAuthorized) return deny();
    return allow();
  } catch {
    // Auth service down — deny access
    return deny(); // SAFE
  }
```

## Integration

- **Defense in Depth** provides the layered structure that zero trust operates within
- **Threat Modeling** identifies which boundaries need the strongest verification
- **OWASP Operational** provides the specific validation rules at each boundary
- **Feedback Loops** — zero trust prevents the security erosion delayed loop
