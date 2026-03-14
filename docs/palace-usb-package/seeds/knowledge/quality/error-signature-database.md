# Error Signature Database
## Pattern-Matchable Error Signatures with Root Cause and Fix

Version: 1.0 | Stack: Next.js 16 + Prisma 7 + Clerk + Stripe + vLLM + Node.js

---

## FORMAT

Each entry follows this structure:
```
SIGNATURE: Regex pattern matching the error
ROOT CAUSE: Why this happens
FIX: Exact steps to resolve
PREVENTION: How to never see this again
SEVERITY: LOW / MEDIUM / HIGH / CRITICAL
```

---

## 1. NEXT.JS ERRORS

### 1.1 Hydration Mismatch
```
SIGNATURE: /Hydration failed because the initial UI does not match what was rendered on the server/
ALT:       /Text content does not match server-rendered HTML/
ALT:       /Expected server HTML to contain a matching/

ROOT CAUSE (decision tree):
  ├─ Using Date/Math.random in component render → non-deterministic output
  ├─ Browser extension injecting DOM elements
  ├─ Conditional rendering based on typeof window !== 'undefined'
  ├─ Third-party script modifying DOM before hydration
  └─ CSS-in-JS generating different class names server vs client

FIX:
  1. Wrap client-only code in useEffect, not conditional render
  2. Use suppressHydrationWarning for intentionally dynamic content (dates)
  3. Use dynamic(() => import('...'), { ssr: false }) for client-only components
  4. Check for browser extensions in dev (use incognito)

PREVENTION:
  - Never use Date.now() or Math.random() in render path
  - Always use useEffect for client-only logic
  - ESLint rule: flag typeof window checks in render scope

SEVERITY: MEDIUM
```

### 1.2 RSC Serialization Error
```
SIGNATURE: /Error: Objects are not valid as a React child/
ALT:       /Only plain objects.*can be passed to Client Components from Server Components/
ALT:       /cannot be serialized as props/
ALT:       /Functions cannot be passed directly to Client Components/

ROOT CAUSE:
  ├─ Passing function as prop from Server Component to Client Component
  ├─ Passing class instance (Date, Map, Set) without serialization
  ├─ Passing Prisma model with BigInt or Decimal fields
  └─ Passing circular reference object

FIX:
  1. Functions: move to Client Component or use server actions
  2. Date objects: convert to .toISOString() before passing
  3. BigInt: convert to .toString() or Number() if safe
  4. Prisma models: use .toJSON() or manual serialization
     ```typescript
     // BAD
     const user = await prisma.user.findUnique({...});
     return <ClientComp user={user} />  // may have Date/BigInt fields

     // GOOD
     const user = await prisma.user.findUnique({...});
     return <ClientComp user={JSON.parse(JSON.stringify(user))} />
     ```
  5. Circular refs: restructure data or use superjson

PREVENTION:
  - Type props interface explicitly — catches non-serializable types at compile time
  - Always transform Prisma results before passing to Client Components

SEVERITY: HIGH
```

### 1.3 Middleware Redirect Loop
```
SIGNATURE: /ERR_TOO_MANY_REDIRECTS/
ALT:       /Redirect loop detected/
ALT:       Browser shows "This page isn't working" with redirect count

ROOT CAUSE:
  ├─ Middleware redirects /login → /login (matching its own redirect target)
  ├─ Clerk middleware + custom middleware both redirecting auth
  ├─ Middleware matches API routes that should be excluded
  └─ NextResponse.redirect without proper path exclusion

FIX:
  1. Add matcher config to exclude redirect targets:
     ```typescript
     export const config = {
       matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|sign-up).*)'],
     };
     ```
  2. In middleware, explicitly check current path before redirect:
     ```typescript
     if (req.nextUrl.pathname === '/login') return NextResponse.next();
     ```
  3. Check Clerk middleware isn't double-redirecting with custom auth logic

PREVENTION:
  - Middleware matcher MUST exclude redirect target paths
  - Log middleware execution in dev to trace redirect chains
  - Test middleware with curl -v -L --max-redirs 5

SEVERITY: HIGH
```

### 1.4 Dynamic Import Failure
```
SIGNATURE: /Cannot find module '.*'/
ALT:       /Failed to load dynamic import/
ALT:       /ChunkLoadError: Loading chunk \d+ failed/

ROOT CAUSE:
  ├─ Import path is wrong (case sensitivity on Linux deploy vs Windows dev)
  ├─ Module not in dependencies (devDependencies only)
  ├─ Stale build cache serving old chunks after deploy
  └─ Dynamic import path is a variable (not statically analyzable)

FIX:
  1. Case sensitivity: verify exact filename casing matches import
  2. Dependencies: move from devDependencies to dependencies if runtime-needed
  3. Stale chunks: clear .next cache, redeploy
  4. Dynamic paths: use explicit string literals, not template literals
     ```typescript
     // BAD — bundler can't analyze
     const mod = await import(`./agents/${name}`);

     // GOOD — explicit mapping
     const agentModules = {
       stone: () => import('./agents/stone'),
       cardinal: () => import('./agents/cardinal'),
     };
     ```

PREVENTION:
  - CI runs on case-sensitive filesystem (Linux) to catch case mismatches
  - Never use variable import paths without explicit mapping

SEVERITY: MEDIUM
```

### 1.5 App Router Collision
```
SIGNATURE: /Conflicting route segment/
ALT:       /You cannot define a route group.*that conflicts/
ALT:       Two routes resolve to same path, last one wins silently

ROOT CAUSE:
  ├─ page.tsx and route.ts in same directory (can't have both)
  ├─ Parallel routes or intercepting routes with conflicting segments
  ├─ Route groups (parentheses) resolving to same URL
  └─ Catch-all [...slug] overlapping with explicit routes

FIX:
  1. page.tsx vs route.ts: choose one per directory
  2. Route groups: ensure (group1) and (group2) don't both have same sub-path
  3. Catch-all: make it the LAST resort, explicit routes take priority
  4. Check: `find app -name 'page.tsx' -o -name 'route.ts' | sort` for conflicts

PREVENTION:
  - Document route map in comments at top of each route file
  - Run `next build` — it will warn about conflicts

SEVERITY: MEDIUM
```

---

## 2. PRISMA ERRORS

### 2.1 P2002 — Unique Constraint Violation
```
SIGNATURE: /PrismaClientKnownRequestError.*P2002/
ALT:       /Unique constraint failed on the fields: \(`(.+)`\)/

ROOT CAUSE:
  ├─ Duplicate insert (user already exists, duplicate referral code)
  ├─ Race condition: two concurrent requests creating same record
  ├─ Upsert missing: using create when should use upsert
  └─ Migration added unique constraint to column with existing duplicates

FIX:
  1. Use upsert instead of create for idempotent operations:
     ```typescript
     await prisma.user.upsert({
       where: { email },
       update: { lastLogin: new Date() },
       create: { email, name },
     });
     ```
  2. Race condition: wrap in transaction with retry
     ```typescript
     try {
       await prisma.thing.create({ data });
     } catch (e) {
       if (e.code === 'P2002') {
         // Record already exists — fetch and return it
         return prisma.thing.findUnique({ where: { uniqueField } });
       }
       throw e;
     }
     ```
  3. Migration: clean duplicates BEFORE adding unique constraint

PREVENTION:
  - Always use upsert for user-facing creation endpoints
  - GS-5 IDEMPOTENCY: every create operation must handle duplicate gracefully

SEVERITY: MEDIUM
```

### 2.2 P2025 — Record Not Found
```
SIGNATURE: /PrismaClientKnownRequestError.*P2025/
ALT:       /An operation failed because it depends on.*required records? that (was|were) not found/

ROOT CAUSE:
  ├─ update/delete on non-existent record
  ├─ Related record deleted (cascade missing)
  ├─ Race condition: record deleted between check and operation
  └─ Wrong ID passed (client-side bug)

FIX:
  1. Use findUnique + null check before update/delete
  2. Or catch P2025 and return 404:
     ```typescript
     try {
       await prisma.agent.update({ where: { id }, data });
     } catch (e) {
       if (e.code === 'P2025') {
         return Response.json({ error: 'Not found' }, { status: 404 });
       }
       throw e;
     }
     ```
  3. Check cascade rules in schema.prisma for related deletions

PREVENTION:
  - Every update/delete endpoint must handle P2025 → 404
  - Add onDelete: Cascade or onDelete: SetNull explicitly in schema

SEVERITY: LOW
```

### 2.3 Pool Exhaustion (QueueFull)
```
SIGNATURE: /Timed out fetching a new connection from the connection pool/
ALT:       /QueueFull/
ALT:       /Can't reach database server/

ROOT CAUSE:
  ├─ Too many concurrent connections (serverless = many instances)
  ├─ Long-running transactions holding connections
  ├─ Missing connection pool configuration
  ├─ Prisma client instantiated per-request instead of singleton
  └─ Neon serverless driver not configured for connection pooling

FIX:
  1. Use singleton Prisma client:
     ```typescript
     // lib/prisma.ts
     const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
     export const prisma = globalForPrisma.prisma || new PrismaClient();
     if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
     ```
  2. Configure pool size in DATABASE_URL:
     `?connection_limit=10&pool_timeout=20`
  3. Use Neon's connection pooler endpoint (port 5432 pooled vs 5433 direct)
  4. Keep transactions short — no external API calls inside transactions

PREVENTION:
  - ALWAYS use singleton pattern for PrismaClient
  - Set connection_limit appropriate for deployment (serverless = lower)
  - Monitor pool usage in Neon dashboard
  - Neon pooler URL for serverless, direct URL for migrations only

SEVERITY: CRITICAL
```

### 2.4 Migration Drift
```
SIGNATURE: /The current database is not managed by Prisma Migrate/
ALT:       /Drift detected: Your database schema is not in sync/
ALT:       /prisma migrate status/ shows pending or failed migrations

ROOT CAUSE:
  ├─ Manual SQL executed directly on database
  ├─ Migration failed halfway (partial apply)
  ├─ Schema changed without generating migration
  └─ Different migration history between environments

FIX:
  1. Minor drift: `npx prisma db pull` → review → generate migration
  2. Major drift: `npx prisma migrate resolve --applied [migration_name]`
  3. Nuclear option (dev only): `npx prisma migrate reset` (DESTROYS DATA)
  4. Compare: `npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-url $DATABASE_URL`

PREVENTION:
  - NEVER run raw SQL that modifies schema without a migration
  - Run `prisma migrate status` in CI pipeline
  - Neon branching: use branches for schema experiments

SEVERITY: HIGH
```

---

## 3. TYPESCRIPT ERRORS

### 3.1 "Not Assignable to Type" Resolution Flowchart
```
ERROR: Type 'X' is not assignable to type 'Y'
  │
  ├─ Is X a superset of Y? (X has extra properties)
  │   ├─ YES → Use Pick<X, keyof Y> or explicit interface
  │   └─ NO → continue
  │
  ├─ Is Y a union type and X is missing a discriminant?
  │   ├─ YES → Add the discriminant field to X
  │   └─ NO → continue
  │
  ├─ Is this a null/undefined issue?
  │   ├─ YES → Add null check or use non-null assertion (only with evidence)
  │   └─ NO → continue
  │
  ├─ Is this Prisma-related? (Prisma types are exact)
  │   ├─ YES → Use Prisma.XGetPayload<{}> for return types
  │   └─ NO → continue
  │
  ├─ Is this a JSON field? (Prisma JSON = JsonValue)
  │   ├─ YES → Cast with Zod validation: schema.parse(jsonField) as MyType
  │   └─ NO → continue
  │
  └─ Last resort investigation:
      1. Hover both types in IDE — read the FULL expanded type
      2. Look for subtle differences: optional vs required, readonly vs mutable
      3. Check if generic parameter is inferred wrong
      4. NEVER use 'as any' — use 'as unknown as TargetType' if forced, with comment explaining why
```

### 3.2 Circular Dependency Detection
```
SIGNATURE: /Cannot access '.*' before initialization/
ALT:       /ReferenceError: Cannot access '.*' before initialization/
ALT:       Type appears as 'any' when it shouldn't (silent circular)

DETECTION:
  npx madge --circular --extensions ts,tsx src/

ROOT CAUSE:
  ├─ File A imports from File B, File B imports from File A
  ├─ Barrel exports (index.ts) creating hidden cycles
  └─ Type-only imports mixed with value imports

FIX:
  1. Extract shared types to a separate file (types.ts)
  2. Use type-only imports: import type { X } from './y'
  3. Break barrel export cycles: import directly from source file
  4. Restructure: move shared logic to a third file both can import

PREVENTION:
  - madge --circular in CI pipeline
  - ESLint: consistent-type-imports rule
  - Avoid deep barrel exports (index.ts re-exporting everything)

SEVERITY: MEDIUM
```

### 3.3 Declaration Conflicts
```
SIGNATURE: /Duplicate identifier '.*'/
ALT:       /Subsequent property declarations must have the same type/
ALT:       /All declarations of '.*' must have identical modifiers/

ROOT CAUSE:
  ├─ Same interface declared in multiple .d.ts files
  ├─ @types package conflicts with built-in types
  ├─ Ambient declaration conflicts (global.d.ts vs library types)
  └─ tsconfig includes overlapping paths

FIX:
  1. Check which files declare the conflicting type:
     ```bash
     grep -r "interface ConflictingName" --include="*.d.ts"
     ```
  2. Exclude conflicting .d.ts in tsconfig: "exclude": ["node_modules/bad-types"]
  3. Use declaration merging intentionally or rename one
  4. Pin @types packages to avoid auto-update conflicts

PREVENTION:
  - Lock @types versions in package.json
  - Keep global type declarations in a single global.d.ts
  - Review tsconfig paths for overlaps

SEVERITY: LOW
```

---

## 4. CLERK ERRORS

### 4.1 JWT Errors — Distinct Shapes
```
EXPIRED TOKEN:
  SIGNATURE: /Token has expired/
  ALT:       /JWT.*exp.*claim/
  FIX: Token refresh should happen automatically. If persistent:
    - Check clock skew between server and Clerk
    - Verify session middleware is running
    - Check Clerk SDK version (older versions had refresh bugs)

MALFORMED TOKEN:
  SIGNATURE: /Malformed JWT/
  ALT:       /Invalid token format/
  ALT:       /jwt must be a string/
  FIX: Token is corrupted or truncated
    - Check Authorization header isn't double-encoded
    - Verify token isn't being modified by middleware/proxy
    - Check for URL encoding issues in cookie values

MISSING KEY:
  SIGNATURE: /CLERK_SECRET_KEY.*not found/
  ALT:       /Missing Clerk.*key/
  ALT:       /clerk.*publishable.*key.*required/
  FIX: Environment variable missing
    - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY for client
    - CLERK_SECRET_KEY for server
    - Check Vercel env vars dashboard for production

WRONG ENVIRONMENT:
  SIGNATURE: /Invalid API key.*test.*live/
  ALT:       /API key mismatch/
  FIX: Test key used in prod or vice versa
    - pk_test_ / sk_test_ = development ONLY
    - pk_live_ / sk_live_ = production ONLY
    - NEVER mix environments

SEVERITY: HIGH (auth failures block all functionality)
```

---

## 5. STRIPE ERRORS

### 5.1 Webhook Signature Mismatch
```
SIGNATURE: /No signatures found matching the expected signature for payload/
ALT:       /Webhook signature verification failed/
ALT:       /stripe\.webhooks\.constructEvent.*error/

ROOT CAUSE:
  ├─ Wrong webhook secret (test vs live, or different endpoint)
  ├─ Request body was parsed (JSON.parse) before verification
  ├─ Proxy/CDN modified the request body
  └─ Webhook secret rotated but env var not updated

FIX:
  1. Verify STRIPE_WEBHOOK_SECRET matches the endpoint in Stripe dashboard
  2. Use raw body for verification:
     ```typescript
     // app/api/webhooks/stripe/route.ts
     export async function POST(req: Request) {
       const body = await req.text(); // RAW text, not .json()
       const sig = req.headers.get('stripe-signature')!;
       const event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
     }
     ```
  3. Disable body parsing in Next.js (App Router handles this with req.text())
  4. Check: Stripe dashboard → Webhooks → endpoint → signing secret

PREVENTION:
  - ALWAYS use req.text() not req.json() for webhook routes
  - Separate webhook secrets for test vs live environments
  - Test with Stripe CLI: stripe listen --forward-to localhost:3000/api/webhooks/stripe

SEVERITY: CRITICAL (billing events lost)
```

### 5.2 Idempotency Collision
```
SIGNATURE: /Keys for idempotent requests can only be used with the same parameters/
ALT:       /IdempotencyError/

ROOT CAUSE:
  ├─ Same idempotency key used for different request bodies
  ├─ Retry logic using stale idempotency key after parameter change
  └─ Idempotency key generation not including all relevant parameters

FIX:
  1. Generate idempotency key from request content hash:
     ```typescript
     const idempotencyKey = crypto
       .createHash('sha256')
       .update(JSON.stringify({ userId, priceId, action }))
       .digest('hex');
     ```
  2. Or use unique per-attempt keys: `${userId}_${action}_${Date.now()}`
  3. For retries: reuse the SAME key with the SAME parameters

PREVENTION:
  - Include all variable parameters in idempotency key generation
  - GS-5 IDEMPOTENCY: all Stripe operations must be idempotent

SEVERITY: HIGH
```

### 5.3 Test vs Live Contamination
```
SIGNATURE: /No such.*in.*mode/
ALT:       /This API key is.*test.*but.*live/
ALT:       Customers/subscriptions disappear between environments

ROOT CAUSE:
  ├─ Test mode customer ID used with live API key
  ├─ Webhook from test mode hitting live endpoint
  ├─ price_* IDs are different between test and live
  └─ .env has mixed test/live keys

FIX:
  1. Audit ALL Stripe env vars — they must be from the SAME mode
  2. Price IDs: maintain separate mapping for test vs live
     ```typescript
     const PRICES = {
       test: { starter: 'price_test_xxx', plus: 'price_test_yyy' },
       live: { starter: 'price_live_xxx', plus: 'price_live_yyy' },
     };
     const mode = process.env.STRIPE_SECRET_KEY?.startsWith('sk_test_') ? 'test' : 'live';
     ```
  3. Webhook endpoints: separate URLs for test vs live in Stripe dashboard

PREVENTION:
  - Env validation at startup (Gate 1) catches mixed keys
  - Never hardcode price IDs — use env vars or config mapping
  - Stripe CLI for local testing: stripe listen --forward-to localhost:3000/...

SEVERITY: CRITICAL
```

---

## 6. NODE RUNTIME ERRORS

### 6.1 ENOMEM — Out of Memory
```
SIGNATURE: /FATAL ERROR:.*JavaScript heap out of memory/
ALT:       /ENOMEM/
ALT:       /Allocation failed.*process out of memory/

ROOT CAUSE:
  ├─ Large dataset loaded into memory (entire table, huge JSON)
  ├─ Memory leak (event listeners, closures, global cache)
  ├─ Next.js ISR caching too many pages
  └─ Vercel serverless function exceeding 1GB memory limit

FIX:
  1. Increase memory (temporary): NODE_OPTIONS=--max-old-space-size=4096
  2. Stream large datasets instead of loading into memory
  3. Pagination: never SELECT * without LIMIT
  4. Find leak: node --inspect + Chrome DevTools heap snapshot
  5. Vercel: check function memory config, upgrade plan if needed

PREVENTION:
  - All DB queries have LIMIT or pagination
  - Streaming responses for large payloads
  - Monitor memory usage in production dashboard

SEVERITY: CRITICAL
```

### 6.2 EMFILE — File Descriptor Exhaustion
```
SIGNATURE: /EMFILE.*too many open files/
ALT:       /Error: EMFILE/

ROOT CAUSE:
  ├─ File handles not being closed (missing .close() or try/finally)
  ├─ Too many concurrent file operations
  ├─ OS ulimit too low for the workload
  └─ graceful-fs not handling concurrent access

FIX:
  1. Always close file handles in finally blocks
  2. Use graceful-fs: `const fs = require('graceful-fs')` (auto-retry on EMFILE)
  3. Increase ulimit: `ulimit -n 65536`
  4. Batch file operations instead of opening thousands concurrently

PREVENTION:
  - Use streaming APIs for large file operations
  - Limit concurrent file operations with a semaphore/queue

SEVERITY: HIGH
```

### 6.3 Unhandled Rejection
```
SIGNATURE: /UnhandledPromiseRejectionWarning/
ALT:       /unhandledRejection/
ALT:       Process exits with code 1, no clear error message

ROOT CAUSE:
  ├─ async function without try/catch
  ├─ Promise without .catch()
  ├─ Forgotten await (promise rejected but nobody's listening)
  └─ Event handler throwing inside async callback

FIX:
  1. Add global handler for diagnostics:
     ```typescript
     process.on('unhandledRejection', (reason, promise) => {
       console.error('Unhandled Rejection at:', promise, 'reason:', reason);
       // Log to Sentry/monitoring
     });
     ```
  2. Find the unhandled promise: Node 16+ shows the stack trace
  3. Add try/catch or .catch() to the identified async operation

PREVENTION:
  - ESLint: no-floating-promises, no-misused-promises
  - All async route handlers wrapped in try/catch
  - Global rejection handler for monitoring (not silencing)

SEVERITY: HIGH
```

### 6.4 Event Loop Blocking
```
SIGNATURE: No explicit error — symptoms: high latency, timeouts, frozen responses
DETECTION:
  - API requests that normally take 50ms suddenly take 5000ms
  - Multiple requests queuing up
  - Server appears "hung" but CPU is at 100%

ROOT CAUSE:
  ├─ Synchronous file I/O in request handler (fs.readFileSync)
  ├─ CPU-intensive computation (JSON.parse on huge payload, crypto)
  ├─ Large regex on large input (ReDoS)
  ├─ Synchronous iteration over large array
  └─ console.log in hot path (I/O bound)

FIX:
  1. Replace sync operations with async equivalents
  2. Move CPU-intensive work to worker thread
  3. Audit regex for catastrophic backtracking
  4. Stream large JSON instead of JSON.parse on full body
  5. Remove/reduce logging in hot paths

PREVENTION:
  - ESLint: no-sync (ban sync fs methods)
  - Event loop lag monitoring: blocked-at or clinic.js
  - Load test API routes to catch blocking under concurrency

SEVERITY: HIGH
```

---

## 7. ESM/CJS ERRORS

### 7.1 Require in ESM
```
SIGNATURE: /require is not defined in ES module scope/
ALT:       /ReferenceError: require is not defined/
ALT:       /Must use import to load ES Module/

ROOT CAUSE:
  ├─ File is .mjs or package.json has "type": "module"
  ├─ Using require() in a file that's treated as ESM
  └─ Dependency uses require() but project is ESM

FIX:
  1. Replace require with import:
     ```typescript
     // BAD
     const fs = require('fs');
     // GOOD
     import fs from 'fs';
     ```
  2. For dynamic require: use createRequire
     ```typescript
     import { createRequire } from 'module';
     const require = createRequire(import.meta.url);
     const pkg = require('./package.json');
     ```
  3. For JSON: use assert { type: 'json' } or createRequire

PREVENTION:
  - GS-2 ESM STRICT MODE: no require() in any .mjs or ESM context
  - ESLint: no-restricted-globals for require in ESM files

SEVERITY: MEDIUM
```

### 7.2 'this' Undefined in ESM
```
SIGNATURE: /TypeError: Cannot read properties of undefined/
  (when 'this' is undefined at module top level)

ROOT CAUSE: In ESM, top-level 'this' is undefined (not globalThis)

FIX:
  1. Replace 'this' with 'globalThis' for global access
  2. Don't use 'this' at module top level
  3. In classes/objects: 'this' works normally — issue is only top-level

PREVENTION:
  - ESLint: no-invalid-this
  - Never assume 'this' at module level

SEVERITY: LOW
```

### 7.3 Const Reassignment / Scope Issues
```
SIGNATURE: /TypeError: Assignment to constant variable/
ALT:       /SyntaxError: Identifier '.*' has already been declared/

ROOT CAUSE:
  ├─ Attempting to reassign a const
  ├─ Variable declared twice in same scope (let/const)
  └─ Temporal dead zone: accessing let/const before declaration

FIX:
  1. Use let for variables that need reassignment
  2. Check for duplicate declarations in same scope
  3. TDZ: move declaration above first usage

SEVERITY: LOW
```

---

## 8. vLLM ERRORS

### 8.1 OOM During Prefill
```
SIGNATURE: /torch\.cuda\.OutOfMemoryError/
ALT:       /CUDA out of memory.*Tried to allocate/
ALT:       /RuntimeError:.*CUDA.*out of memory/

ROOT CAUSE:
  ├─ Prompt too long for available VRAM
  ├─ KV cache consuming too much VRAM
  ├─ Multiple concurrent requests exceeding VRAM budget
  └─ Model quantization settings wrong (loading FP16 instead of AWQ)

FIX:
  1. Check model is loaded with correct quantization:
     --quantization awq (for Qwen 2.5 32B AWQ)
  2. Reduce max_model_len to fit VRAM
  3. Reduce max_num_seqs (concurrent sequences)
  4. Clear VRAM: restart vLLM process
  5. For RTX 5090 (32GB GDDR7): Qwen 2.5 32B AWQ should fit with headroom

PREVENTION:
  - Set --gpu-memory-utilization 0.85 (leave 15% headroom)
  - Monitor VRAM usage: nvidia-smi -l 1
  - Set max prompt length limits in API layer

SEVERITY: CRITICAL
```

### 8.2 CUDA Illegal Memory Access
```
SIGNATURE: /CUDA error: an illegal memory access was encountered/
ALT:       /RuntimeError: CUDA error: illegal memory access/
ALT:       /cuda.*illegal.*memory/i

ROOT CAUSE:
  ├─ GPU driver bug or incompatibility
  ├─ Hardware failure (VRAM cell failure)
  ├─ CUDA toolkit version mismatch with driver
  └─ Corrupted model weights

FIX:
  1. Restart vLLM process (may clear transient issue)
  2. Check nvidia-smi for errors/warnings
  3. Verify CUDA toolkit matches driver: nvidia-smi shows CUDA version
  4. Re-download model weights if corruption suspected
  5. If persistent: run GPU memory test, check temperatures

PREVENTION:
  - Keep GPU drivers updated
  - Monitor GPU temperature (throttle at 83C, danger at 90C+)
  - Hardware diagnostics: see hardware-diagnostics.md

SEVERITY: CRITICAL
```

### 8.3 Tokenizer Mismatch
```
SIGNATURE: /Tokenizer.*not found/
ALT:       /tokenizer.*mismatch/i
ALT:       Garbage output despite correct prompt (wrong tokenization)

ROOT CAUSE:
  ├─ Wrong tokenizer loaded for model
  ├─ Tokenizer files missing from model directory
  ├─ HuggingFace token not set for gated models
  └─ Custom chat template not applied

FIX:
  1. Verify tokenizer matches model: check model card on HuggingFace
  2. Ensure all tokenizer files present: tokenizer.json, tokenizer_config.json
  3. Set --tokenizer flag if auto-detection fails
  4. For chat: use --chat-template with correct Jinja template

PREVENTION:
  - Always download complete model directory (not individual files)
  - Test tokenization independently before deployment

SEVERITY: HIGH
```

### 8.4 Hung Inference
```
SIGNATURE: No error — request never returns, timeout after 30-60s
DETECTION:
  - API requests to vLLM hang indefinitely
  - nvidia-smi shows 0% GPU utilization despite pending requests
  - vLLM logs show request received but no generation output

ROOT CAUSE:
  ├─ Deadlock in scheduling (rare vLLM bug)
  ├─ Infinite generation (no stop token matched)
  ├─ GPU hung (hardware issue)
  └─ Python GIL contention under high concurrency

FIX:
  1. Set --max-tokens to reasonable limit (e.g., 4096)
  2. Set request timeout in API layer (30s for most, 120s for long generation)
  3. Restart vLLM if unresponsive
  4. Check GPU state: nvidia-smi — if GPU shows "ERR", hard reset needed

PREVENTION:
  - Always set max_tokens in API requests
  - Implement request timeout at API gateway level
  - Health check pinging vLLM every 30s, auto-restart if unresponsive

SEVERITY: CRITICAL
```

---

## 9. QUICK LOOKUP TABLE

```
| Error Pattern (grep-friendly)         | Section | Severity |
|---------------------------------------|---------|----------|
| Hydration failed                      | 1.1     | MEDIUM   |
| Objects are not valid as a React child| 1.2     | HIGH     |
| ERR_TOO_MANY_REDIRECTS               | 1.3     | HIGH     |
| Cannot find module                    | 1.4     | MEDIUM   |
| P2002                                 | 2.1     | MEDIUM   |
| P2025                                 | 2.2     | LOW      |
| Timed out fetching.*connection pool   | 2.3     | CRITICAL |
| not assignable to type                | 3.1     | MEDIUM   |
| Cannot access.*before initialization  | 3.2     | MEDIUM   |
| Token has expired                     | 4.1     | HIGH     |
| Malformed JWT                         | 4.1     | HIGH     |
| CLERK_SECRET_KEY.*not found           | 4.1     | HIGH     |
| No signatures found matching          | 5.1     | CRITICAL |
| IdempotencyError                      | 5.2     | HIGH     |
| JavaScript heap out of memory         | 6.1     | CRITICAL |
| EMFILE.*too many open files           | 6.2     | HIGH     |
| UnhandledPromiseRejection             | 6.3     | HIGH     |
| require is not defined in ES module   | 7.1     | MEDIUM   |
| CUDA out of memory                    | 8.1     | CRITICAL |
| CUDA error: illegal memory access     | 8.2     | CRITICAL |
| Tokenizer.*not found                  | 8.3     | HIGH     |
```
