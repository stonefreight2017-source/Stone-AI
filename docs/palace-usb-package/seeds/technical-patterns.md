# STONE AI — TECHNICAL PATTERNS

Proven patterns from the Stone AI codebase. These are not theoretical — they are running in production. When you build or modify anything, follow these patterns. They exist because they work.

---

## NEXT.JS 16 APP ROUTER PATTERNS

**File structure:**
```
src/
  app/
    api/             # API routes (server-side only)
      chat/route.ts  # POST handler for chat messages
      stripe/
        checkout/route.ts
        webhook/route.ts
        portal/route.ts
    (dashboard)/     # Route groups for layout sharing
      page.tsx       # Dashboard page
    layout.tsx       # Root layout
  components/        # Shared React components
  lib/               # Server-side utilities, business logic
  generated/         # Prisma client output
  hooks/             # Client-side React hooks
  store/             # Client-side state management
  types/             # TypeScript type definitions
```

**API route pattern (every route follows this):**
```typescript
// src/app/api/example/route.ts
import { NextRequest } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { someSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const user = await getOrCreateUser();
    if (user.banned) {
      return Response.json({ error: "Account suspended" }, { status: 403 });
    }

    // 2. Parse & validate with Zod
    const body = await req.json();
    const parsed = someSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // 3. Business logic
    const result = await db.something.create({ data: parsed.data });

    // 4. Return response
    return Response.json(result);
  } catch (error) {
    console.error("[api/example]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

**Key rules:**
- Every API route authenticates first via `getOrCreateUser()` (Clerk-backed).
- Every mutation validates input with Zod `.strict()` schemas.
- Every route has a try/catch with a generic 500 error response (never leak internals).
- Use `Response.json()` not `NextResponse.json()` for standard responses.
- The chat route (`/api/chat`) is the HOT PATH — most-called route in the app. It has extensive comments documenting scaling checkpoints, security checkpoints, and debug strategies.

**Route organization:**
- Public routes are listed in `src/middleware.ts` via `createRouteMatcher()`.
- Everything NOT in the public list requires Clerk authentication.
- Stripe webhooks and Clerk webhooks are public (they have their own signature verification).

---

## PRISMA 7 QUERY PATTERNS

**Schema conventions:**
```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

- Enums for fixed sets: `Tier`, `SubscriptionStatus`, `Role`, `Mode`
- All IDs use `@id @default(cuid())` — not UUID, not auto-increment
- Timestamps: `createdAt DateTime @default(now())` + `updatedAt DateTime @updatedAt`
- Unique constraints: `@unique` on clerkId, email, stripeCustomerId, stripeSubscriptionId, referralCode
- Indexes on frequent query patterns: `@@index([userId, updatedAt])` for conversation listing
- Cascade deletes: `onDelete: Cascade` for owned data (messages when conversation deleted)
- SetNull for optional refs: `onDelete: SetNull` for agent/bestie references

**pgvector for semantic search:**
```prisma
// Vector column for embeddings
model AgentMemory {
  embedding Unsupported("vector(768)")?
}
```

**Similarity search query (raw SQL via Prisma):**
```typescript
const results = await db.$queryRaw`
  SELECT id, content, 1 - (embedding <=> ${vectorLiteral}::vector) AS similarity
  FROM "AgentMemory"
  WHERE "agentId" = ${agentId} AND "userId" = ${userId}
  ORDER BY embedding <=> ${vectorLiteral}::vector
  LIMIT ${TOP_K}
`;
```

- `<=>` is the cosine distance operator in pgvector.
- `1 - distance = similarity` (higher is more similar).
- Always filter by userId to prevent cross-user data leakage.
- TOP_K = 5 by default (tunable).

**Migration strategy:**
- `npx prisma migrate dev` for local development
- `npx prisma migrate deploy` for production (Neon)
- Never edit migration files after they have been applied
- Schema changes go through: modify schema.prisma → generate migration → test locally → deploy

---

## CLERK AUTH INTEGRATION

**Middleware pattern (src/middleware.ts):**
```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/stripe/webhook",  // Has its own Stripe signature verification
  "/api/webhooks/clerk",  // Has its own Clerk signature verification
  "/api/health",
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();  // Redirects to sign-in if not authenticated
  }
  // Security headers applied to every response
});
```

**User sync pattern (src/lib/auth.ts):**
```typescript
// getOrCreateUser() — called at the start of every authenticated API route
// 1. Gets Clerk userId from the session
// 2. Looks up user in DB by clerkId
// 3. If not found, creates a new User record with Clerk data
// 4. Returns the DB user (with tier, subscription status, etc.)
```

This pattern means Clerk owns authentication but our DB owns authorization (tier, banned status, quotas).

**Dev vs Prod:**
- Dev mode: Clerk test keys, localhost redirect URLs
- Prod mode: Clerk production keys, stone-ai.net redirect URLs
- The switch requires updating CLERK_SECRET_KEY and NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY env vars
- Clerk webhooks sync user creation/deletion between Clerk and our DB

---

## STRIPE BILLING PATTERNS

**Checkout flow:**
```
User clicks "Subscribe" → POST /api/stripe/checkout
  → Creates Stripe Checkout Session with tier-specific price ID
  → Returns checkout URL
  → User completes payment on Stripe-hosted page
  → Stripe sends webhook to /api/stripe/webhook
  → Webhook handler updates user tier in DB
```

**Webhook handling pattern:**
```typescript
export async function POST(req: NextRequest) {
  const body = await req.text();  // Raw body for signature verification
  const sig = req.headers.get("stripe-signature")!;

  const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

  switch (event.type) {
    case "checkout.session.completed":
      // New subscription — upgrade user tier
      break;
    case "customer.subscription.updated":
      // Plan change — update tier
      break;
    case "customer.subscription.deleted":
      // Cancellation — downgrade to FREE
      break;
    case "invoice.payment_failed":
      // Failed payment — may need to downgrade
      break;
  }
}
```

**Tier gating pattern:**
```typescript
// Check if user can access an agent
const canAccess = canAccessAgent(user.tier, agent.minimumTier);
if (!canAccess) {
  return Response.json({
    error: "Upgrade required",
    requiredTier: agent.minimumTier,
    currentTier: user.tier,
  }, { status: 403 });
}
```

**Key rules:**
- Webhook endpoint is PUBLIC (no Clerk auth) — secured by Stripe signature verification only.
- Always use `req.text()` not `req.json()` for webhook body (signature verification needs raw string).
- Stripe customer ID and subscription ID stored on User model for future lookups.
- Portal endpoint creates Stripe Customer Portal session for self-serve management.
- Test mode: Use Stripe test keys and test card numbers (4242 4242 4242 4242).

---

## ZOD VALIDATION PATTERNS

**Every mutation schema uses `.strict()`:**
```typescript
// .strict() rejects any extra fields not defined in the schema
// This prevents mass-assignment attacks (user sending tier: "PRO" in body)
export const chatMessageSchema = z.object({
  message: z.string().min(1).max(32000)
    .refine((val) => val.trim().length > 0, "Message cannot be only whitespace"),
  conversationId: z.string().cuid(),
  mode: z.enum(["LOCAL", "SMART"]).default("LOCAL"),
}).strict();
```

**Rules:**
- `.strict()` on ALL mutation schemas. No exceptions. This is a security requirement.
- Use `.cuid()` validator for ID fields (matches Prisma's cuid generation).
- Use `.refine()` for custom validation logic (e.g., no whitespace-only messages).
- Use `.default()` for optional fields with sensible defaults.
- Validate BEFORE any database operation. Never trust client input.

---

## COMPONENT PATTERNS (shadcn/ui + Tailwind)

**shadcn/ui usage:**
- Components live in `src/components/ui/` (shadcn primitives) and `src/components/` (app-specific).
- shadcn components are customized via Tailwind classes, not by modifying the component source.
- Use `cn()` utility (from `@/lib/utils`) for conditional class merging.

**Tailwind conventions:**
- Dark mode first: `dark:bg-zinc-900 bg-white`
- Responsive: `md:grid-cols-2 grid-cols-1`
- Spacing: Use Tailwind scale (p-4, gap-6, etc.), never arbitrary pixel values
- Colors: Use CSS variables from shadcn theme (`hsl(var(--primary))`) for consistency

---

## SECURITY PATTERNS

**Content Security Policy (CSP):**
Applied in middleware to every response. Whitelists:
- Scripts: self + Clerk + Cloudflare challenges/insights
- Connections: self + Clerk + Stripe + Cloudflare + WebSocket
- Frames: self + Clerk + Stripe + Cloudflare
- Objects: none. Frame ancestors: none (no embedding).

**Rate limiting:**
- Redis-backed sliding window algorithm.
- Falls back to in-memory Map if Redis is unavailable (WARNING: per-instance only in serverless).
- Concurrency slots via Redis INCR/DECR with 2-minute TTL safety net.
- Per-tier limits: FREE gets lowest limits, PRO gets highest.

**AES-256-GCM encryption:**
Used for encrypting sensitive stored data (bestie memories, agent memories with personal info). Pattern:
```typescript
// Encrypt before storage
const encrypted = encrypt(sensitiveData, encryptionKey);
// Decrypt on retrieval
const decrypted = decrypt(encrypted, encryptionKey);
```

**Input sanitization:**
- `sanitizeUserInput()` detects and neutralizes prompt injection patterns.
- `wrapSystemPrompt()` adds anti-extraction directives around system prompts.
- `detectSystemPromptLeakage()` checks AI output for accidental prompt disclosure.
- Memory sanitization blocks tier/role/admin key injection into agent memories.

**Avatar XSS prevention:**
- SVG data URIs blocked entirely.
- Only png/jpeg/webp/gif base64 data URIs allowed.
- External URLs validated against allowlist (Clerk CDN, Gravatar).

**Security headers (middleware.ts):**
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
- Content-Security-Policy: comprehensive policy (see CSP section)
- Cache-Control: no-store (prevents sensitive data caching)
- Cross-Origin-Opener-Policy: same-origin

---

## DATABASE PATTERNS

**Index strategy:**
- Composite indexes on frequent query patterns: `@@index([userId, updatedAt])`
- Single-column indexes on foreign keys used in JOINs
- Unique indexes on business identifiers: clerkId, email, stripeCustomerId, referralCode

**Seed data:**
- Agent definitions loaded from `src/lib/agent-definitions.ts` and synced to DB
- Seed script: `prisma/seed.ts` — idempotent, safe to run multiple times

**Connection management:**
- Prisma client instantiated once as singleton in `src/lib/db.ts`
- Neon serverless driver handles connection pooling automatically
- No manual connection pool configuration needed

---

## vLLM INTEGRATION — MODEL ROUTING & FALLBACK CHAIN

**Architecture:**
```
User Request → getModel(mode, tierLocalModel)
  ├── mode === "SMART" → Anthropic Claude Sonnet
  ├── mode === "LOCAL" + vLLM available → vLLM (Qwen 2.5 32B AWQ)
  ├── mode === "LOCAL" + on Vercel (no localhost vLLM) → Claude Haiku fallback
  └── mode === "LOCAL" + custom VLLM_BASE_URL → cloud inference provider
```

**Provider setup:**
```typescript
// vLLM — OpenAI-compatible API
const vllm = createOpenAI({
  baseURL: process.env.VLLM_BASE_URL ?? "http://localhost:8000/v1",
  apiKey: process.env.VLLM_API_KEY ?? "not-needed",
});

// Cloud — Anthropic
const cloud = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

**Streaming pattern (chat route):**
```typescript
const result = streamText({
  model: getModel(mode, tierConfig.localModel),
  messages: [...systemMessages, ...conversationHistory],
  // onFinish callback for async post-processing (memory extraction, token counting)
});

return result.toDataStreamResponse({
  headers: { "X-Latency-Ms": String(Date.now() - start) },
});
```

**Key design decisions:**
- vLLM uses the OpenAI-compatible API format — switching from local to any cloud OpenAI-compatible provider requires only changing the base URL and API key. Zero code changes.
- The Vercel fallback to Claude Haiku exists because localhost:8000 is not reachable from Vercel's serverless functions. When a real cloud inference provider is configured (Together, Fireworks, Groq), the fallback is no longer needed.
- SMART mode always goes to Anthropic Claude Sonnet regardless of where the app is running.
- Token usage is recorded per-user for quota enforcement and cost tracking.

**Scaling path:**
```
Phase 1 (now): vLLM on Palace (OMEN) for local dev, Claude Haiku on Vercel
Phase 2 (50+ users): Cloud inference provider for LOCAL mode (Groq/Together/Fireworks)
Phase 3 (500+ users): Multiple cloud providers with load balancing
```

---

## ERROR HANDLING CONVENTIONS

**API routes:** Always catch at the top level. Log the real error server-side, return generic message to client.
```typescript
catch (error) {
  console.error("[api/route-name]", error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
```

**Audit logging:** Security-relevant events (auth failures, rate limit hits, injection attempts) go to the AuditLog table via `logAuditEvent()`.

**Client-facing errors:** Always include `error` field in JSON response. For upgrade prompts, include `requiredTier` and `currentTier` so the frontend can show the right upsell.

---

## ENVIRONMENT VARIABLES (key ones)

```env
# Database
DATABASE_URL=           # Neon PostgreSQL connection string

# Auth
CLERK_SECRET_KEY=       # Server-side Clerk key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=  # Client-side Clerk key

# Payments
STRIPE_SECRET_KEY=      # Stripe API key
STRIPE_WEBHOOK_SECRET=  # Webhook signature verification

# AI
VLLM_BASE_URL=          # vLLM endpoint (default: http://localhost:8000/v1)
VLLM_MODEL=             # Model name for vLLM
ANTHROPIC_API_KEY=      # Cloud AI provider
SMART_MODEL=            # Claude model for SMART mode
LOCAL_FALLBACK_MODEL=   # Fallback when vLLM unavailable on Vercel

# Infrastructure
REDIS_HOST=             # Rate limiter backend
REDIS_PORT=             # Default 6379

# Security
ENCRYPTION_KEY=         # AES-256-GCM key for data encryption
```

**Rule:** Never commit .env files. Never log API keys. Never return credentials in API responses.
