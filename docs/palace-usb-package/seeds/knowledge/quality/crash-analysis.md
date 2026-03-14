# Crash Analysis
## Stack Trace Anatomy, Crash Classification, Reproduction, and Post-Mortems

Version: 1.0 | Stack: Next.js 16 + Prisma 7 + Clerk + Stripe + vLLM

---

## 1. STACK TRACE ANATOMY

### Next.js Stack Traces — Server vs Client

#### Server Component / API Route Error
```
Error: Cannot read properties of null (reading 'email')
    at getUserProfile (webpack-internal:///(rsc)/./src/lib/user.ts:23:15)
    at async Page (webpack-internal:///(rsc)/./src/app/dashboard/page.tsx:8:20)
    at async resolveServerComponent (...)
    at async renderToReadableStream (...)

READING THIS:
  ├─ "rsc" in path → Server Component error
  ├─ First line: the actual error
  ├─ "getUserProfile" at user.ts:23 → WHERE the error happened
  ├─ "Page" at page.tsx:8 → WHO called it
  ├─ "webpack-internal" → source maps not fully resolved
  └─ "resolveServerComponent" → Next.js internals (ignore)

TO GET REAL LINE NUMBERS:
  - Enable source maps in next.config.js
  - Or: match webpack path to actual file manually
  - "(rsc)" = React Server Component
  - "(ssr)" = Server-Side Rendering
  - "(app-pages-browser)" = Client-side
```

#### Client Component Error
```
Unhandled Runtime Error
TypeError: Cannot read properties of undefined (reading 'name')

Source
src/components/AgentCard.tsx (15:23) @ AgentCard

  13 | export function AgentCard({ agent }: Props) {
  14 |   return (
> 15 |     <div>{agent.name}</div>
     |                    ^
  16 |   );
  17 | }

READING THIS:
  ├─ "Unhandled Runtime Error" → client-side (browser)
  ├─ Source shows exact file and line → source maps working
  ├─ Arrow (^) points to exact character
  ├─ "agent" is undefined → prop not passed or null
  └─ Fix: add null check or fix parent component
```

#### Webpack Mangling — Decoding Production Traces
```
Production stack trace:
  Error: Minified React error #418
    at oe (/_next/static/chunks/app/layout-a1b2c3.js:1:23456)
    at pe (/_next/static/chunks/framework-d4e5f6.js:1:78901)

DECODING:
  1. "Minified React error #418" → look up at https://react.dev/errors/418
     → Error #418 = Hydration mismatch
  2. "oe" at layout-a1b2c3.js → minified function name
     → Enable source maps in production for debugging
     → Or: match chunk hash to build output
  3. NEVER deploy without source maps to error tracking (Sentry)

SENTRY CONFIGURATION for source map upload:
  // next.config.js
  const { withSentryConfig } = require('@sentry/nextjs');
  module.exports = withSentryConfig(nextConfig, {
    org: 'stone-ai',
    project: 'stone-ai-web',
    silent: true,
    hideSourceMaps: true, // Don't expose to users
  });
```

### Prisma Error Stack Traces
```
PrismaClientKnownRequestError:
Invalid `prisma.user.create()` invocation:
Unique constraint failed on the fields: (`email`)
    at RequestHandler.handleRequestError (/node_modules/.prisma/client/runtime/library.js:123:45)
    at RequestHandler.request (/node_modules/.prisma/client/runtime/library.js:89:12)
    at PrismaClient._request (/node_modules/.prisma/client/runtime/library.js:67:23)
    at createUser (/src/lib/user-service.ts:45:18)
    at POST (/src/app/api/users/route.ts:12:20)

READING THIS:
  ├─ "PrismaClientKnownRequestError" → Prisma recognized this error type
  ├─ "Unique constraint failed on the fields: (`email`)" → THE ANSWER
  ├─ Lines in node_modules/.prisma → Prisma internals (skip)
  ├─ "createUser" at user-service.ts:45 → YOUR code that triggered it
  └─ "POST" at route.ts:12 → THE API route handler

PRISMA ERROR CODE QUICK REF:
  P2002 → Unique constraint violation
  P2003 → Foreign key constraint violation
  P2025 → Record not found
  P2024 → Timeout (pool exhaustion)
  P1001 → Can't reach database
  P1008 → Operations timed out
```

### Clerk Middleware Chain Traces
```
ClerkError: Clerk: auth() was called but Clerk can't detect usage of clerkMiddleware()
    at auth (/node_modules/@clerk/nextjs/dist/server.js:XXX)
    at GET (/src/app/api/protected/route.ts:5:20)

READING THIS:
  ├─ Clerk can't find middleware → middleware.ts missing or misconfigured
  ├─ Check: does middleware.ts export clerkMiddleware?
  ├─ Check: does matcher config include this route?
  └─ Check: is middleware.ts at the project root (not inside app/)?

COMMON CLERK STACK PATTERNS:
  "auth() was called but" → middleware not running for this route
  "Invalid API key"       → wrong CLERK_SECRET_KEY for environment
  "Session not found"     → token expired or cookie missing
  "User not found"        → clerkId doesn't match any user
```

---

## 2. CRASH CLASSIFICATION

### Decision Tree: What Type of Crash Is This?
```
START → Read the first line of the error
  │
  ├─ "TypeError: Cannot read properties of null/undefined"
  │   → NULL REFERENCE
  │   ├─ Check: is the variable supposed to be populated?
  │   ├─ Check: is this a race condition (data not loaded yet)?
  │   └─ Fix: add null check, fix data loading, or fix caller
  │
  ├─ "TypeError:" (other)
  │   → TYPE ERROR
  │   ├─ "X is not a function" → calling non-function (wrong import?)
  │   ├─ "X is not iterable" → for..of on non-array
  │   └─ "Assignment to constant" → reassigning const
  │
  ├─ "SyntaxError:"
  │   → PARSE ERROR
  │   ├─ "Unexpected token" → JSON.parse on non-JSON
  │   ├─ "Cannot use import" → ESM/CJS mismatch
  │   └─ "Unexpected end of input" → truncated data
  │
  ├─ "Error: connect ECONNREFUSED" / "ETIMEDOUT" / "ENOTFOUND"
  │   → NETWORK ERROR
  │   ├─ ECONNREFUSED → target service down
  │   ├─ ETIMEDOUT → network slow or firewall blocking
  │   └─ ENOTFOUND → DNS resolution failed (wrong hostname)
  │
  ├─ "Error: ENOMEM" / "JavaScript heap out of memory"
  │   → OUT OF MEMORY
  │   ├─ Check: memory-intensive operation? (large file, big query)
  │   ├─ Check: memory leak? (growing over time)
  │   └─ Fix: stream, paginate, or increase memory limit
  │
  ├─ "AbortError" / "TimeoutError" / "504"
  │   → TIMEOUT
  │   ├─ Vercel function timeout (10s hobby, 60s pro)
  │   ├─ Database query timeout
  │   └─ External API timeout
  │
  ├─ "PrismaClient" in error
  │   → DATABASE ERROR (see error-signature-database.md §2)
  │
  ├─ "Clerk" in error
  │   → AUTH ERROR (see error-signature-database.md §4)
  │
  ├─ "Stripe" in error
  │   → PAYMENT ERROR (see error-signature-database.md §5)
  │
  └─ Process exits with no error / signal
      → SIGNAL CRASH
      ├─ SIGKILL → OOM killer (Linux) or forced termination
      ├─ SIGTERM → graceful shutdown request
      └─ SIGSEGV → native code crash (C/C++ binding)
```

### Distinct Error Shapes — Quick Pattern Match
```
| Shape                           | Category    | First Action              |
|---------------------------------|-------------|---------------------------|
| Cannot read properties of null  | Null ref    | Find what's null, add check|
| X is not a function             | Type error  | Check import, check type   |
| Unexpected token < in JSON      | Parse error | API returned HTML not JSON |
| ECONNREFUSED 127.0.0.1:5432    | Network     | Start database             |
| P2002 Unique constraint         | Database    | Use upsert                 |
| FATAL ERROR: heap out of memory | OOM         | Find leak or reduce load   |
| Minified React error #418       | Hydration   | Fix server/client mismatch |
| NEXT_NOT_FOUND                  | 404         | Check route/file exists    |
| 504 FUNCTION_INVOCATION_TIMEOUT | Timeout     | Optimize or increase limit |
```

---

## 3. SENTRY PATTERNS

### Error Grouping Strategy
```
Sentry groups errors by "fingerprint". Customize for our stack:

// sentry.client.config.ts
Sentry.init({
  beforeSend(event) {
    // Group Prisma errors by error code
    if (event.exception?.values?.[0]?.type === 'PrismaClientKnownRequestError') {
      const code = extractPrismaCode(event);
      event.fingerprint = ['prisma', code];
    }

    // Group Clerk errors by type
    if (event.exception?.values?.[0]?.type?.includes('Clerk')) {
      event.fingerprint = ['clerk', event.exception.values[0].type];
    }

    // Strip user data from error reports
    if (event.request?.data) {
      event.request.data = '[REDACTED]';
    }

    return event;
  },
});
```

### Custom Context for Stone AI
```typescript
// Add context to every error for faster debugging
Sentry.setContext('stone_ai', {
  userTier: session?.user?.tier,
  agentId: currentAgent?.id,
  agentName: currentAgent?.name,
  modelUsed: inferenceConfig.model,
  requestId: headers.get('x-request-id'),
});

// Breadcrumbs — trace what happened before the crash
Sentry.addBreadcrumb({
  category: 'agent',
  message: `Agent ${agentId} called with ${promptTokens} tokens`,
  level: 'info',
});

Sentry.addBreadcrumb({
  category: 'db',
  message: `Prisma query: user.findUnique`,
  level: 'info',
});
```

---

## 4. REPRODUCTION METHODOLOGY

### Stack Trace to Minimal Repro
```
STEP 1: LOCATE
  Read stack trace → identify YOUR code (not framework internals)
  File + line number → open that file

STEP 2: UNDERSTAND
  What function is it? What inputs does it expect?
  What was the actual input that caused the crash?
  (Check Sentry breadcrumbs, request logs, user report)

STEP 3: ISOLATE
  Can you reproduce with a unit test?
    → Write test with the failing input
    → If it fails: you have a repro

  Can you reproduce with an API call?
    → curl/fetch with the failing parameters
    → If it fails: you have a repro

  Can you reproduce only under specific conditions?
    → Document the conditions: auth state, DB state, timing

STEP 4: MINIMIZE
  Start with the full failing scenario
  Remove elements one at a time:
    - Remove optional parameters → still fails?
    - Simplify the input → still fails?
    - Remove middleware → still fails?
    - Use fresh DB → still fails?
  Goal: smallest possible reproduction case

STEP 5: DOCUMENT
  ```
  ## Reproduction Steps
  1. [Precondition — DB state, auth state, env]
  2. [Action — exact request/interaction]
  3. [Expected — what should happen]
  4. [Actual — what happens instead, including error]
  ```
```

### Reproduction Difficulty Levels
```
EASY (reproduce in 5 min):
  - Deterministic: same input always crashes
  - No state dependency: fresh DB, any user
  - Example: bad Zod schema, missing null check

MEDIUM (reproduce in 30 min):
  - State-dependent: needs specific DB records
  - Auth-dependent: needs specific user tier/role
  - Example: P2025 on deleted record, tier check edge case

HARD (reproduce in hours):
  - Race condition: timing-dependent
  - Load-dependent: only under concurrent requests
  - Environment-dependent: only in production, not local
  - Example: pool exhaustion, Vercel cold start + timeout combo

VERY HARD (may not reproduce locally):
  - Production-only: Vercel edge behavior, Neon connection pooling
  - Hardware-dependent: GPU memory state, thermal throttling
  - Intermittent: happens 1 in 1000 requests
  - Strategy: instrument with logging, wait for next occurrence
```

---

## 5. POST-MORTEM TEMPLATE

```markdown
# Post-Mortem: [INCIDENT TITLE]

## Date: YYYY-MM-DD
## Severity: LOW / MEDIUM / HIGH / CRITICAL
## Duration: X minutes/hours
## Affected Users: estimated count or percentage

---

## What Happened
[1-3 sentences describing the user-visible impact]

## Timeline
- HH:MM — [First sign of issue]
- HH:MM — [Alert triggered / user report]
- HH:MM — [Investigation started]
- HH:MM — [Root cause identified]
- HH:MM — [Fix deployed]
- HH:MM — [Confirmed resolved]

## Root Cause
[Technical explanation of WHY this happened]
[Include: what assumption was wrong, what edge case was missed]

## How It Was Detected
[Alert? User report? Monitoring? Accident?]

## How It Was Fixed
[Exact fix — code change, config change, rollback, etc.]
[Include commit hash or PR link]

## How It Will Be Prevented
[Systemic fix — not just "be more careful"]
- [ ] Test added: [description of new test]
- [ ] Monitoring added: [what alert was created]
- [ ] Process change: [what changed in our workflow]
- [ ] Documentation updated: [what was clarified]

## Tests Added
[List specific test files/cases added to prevent recurrence]
- test/regression/[incident-name].test.ts
  - Tests the specific input that caused the crash
  - Tests similar edge cases

## Lessons Learned
[What did we learn that applies beyond this incident?]
[Add to Stone's pattern library if applicable]

---

## Checklist
- [ ] Root cause identified and documented
- [ ] Fix deployed and verified
- [ ] Regression test written and passing
- [ ] Monitoring/alerting added
- [ ] Pattern library updated (if applicable)
- [ ] Affected users notified (if applicable)
```

### Post-Mortem Quality Checklist
```
A good post-mortem:
  [ ] Has a root cause, not just a symptom
      BAD: "The server crashed"
      GOOD: "Prisma pool exhausted because connection_limit was 5 but we had 20 concurrent users"

  [ ] Has a systemic prevention, not just a patch
      BAD: "We fixed the bug"
      GOOD: "We added pool monitoring with alert at 70% utilization"

  [ ] Has tests proving the fix works
      BAD: "We tested manually"
      GOOD: "regression/pool-exhaustion.test.ts simulates 20 concurrent connections"

  [ ] Is blameless — focuses on systems, not people
      BAD: "Developer X forgot to add a null check"
      GOOD: "Our code review checklist didn't include null safety verification"

  [ ] Identifies detection gaps
      "We didn't notice for 2 hours because we had no alert for X"
      → Add alert for X
```

---

## QUICK REFERENCE: First Response by Error Type

```
| Error Type         | First 30 Seconds                          |
|--------------------|-------------------------------------------|
| Null reference     | Find the null variable, trace where it's set|
| Type error         | Check the import and the caller            |
| Network error      | Check target service status                |
| OOM                | Check recent queries/operations for size   |
| Timeout            | Check which operation is slow (DB? API?)   |
| Database (Prisma)  | Check error code → error-signature-database |
| Auth (Clerk)       | Check env vars, middleware config           |
| Payment (Stripe)   | Check webhook secret, key environment      |
| Hydration          | Find server/client render difference       |
| GPU (CUDA)         | Check nvidia-smi, temperature, VRAM        |
```
