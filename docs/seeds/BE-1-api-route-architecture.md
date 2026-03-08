# BE-1: API Route Architecture & Middleware Chain Standards

## Purpose
Definitive reference for how Stone AI API routes are structured, what middleware runs before them, how auth/rate-limiting/validation are layered, and the canonical error response format. Every backend change must conform to these patterns.

## Key Patterns (from actual codebase)

### Route File Locations
All API routes live under `src/app/api/` using Next.js 16 App Router conventions. Each `route.ts` exports named functions matching HTTP methods (GET, POST, PATCH, DELETE). There are 46 route files as of March 2026.

### Middleware Chain (src/middleware.ts)
A single Clerk middleware wraps all requests. Execution order:

1. **Route matching** -- `createRouteMatcher` classifies the request as public or protected.
2. **Auth gate** -- Non-public routes: extract `userId` via `await auth()`. If missing, redirect to `/sign-in?redirect_url=<original>`.
3. **Security headers** -- Applied to EVERY response (13 headers total): X-Frame-Options DENY, CSP, HSTS 1yr, no-cache, COEP/COOP/CORP, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin.
4. **Auth page relaxation** -- `/sign-in` and `/sign-up` paths get Cross-Origin headers removed so Clerk iframes render.
5. **API-specific headers** -- All `/api/*` routes get `Cache-Control: no-store, no-cache, must-revalidate, private`.
6. **CORS for /api/v1/** -- Origin allowlist check (`CORS_ALLOWED_ORIGINS` env or defaults). Only POST + OPTIONS. Max-age 86400.
7. **Strip server identification** -- `X-Powered-By` and `Server` headers deleted.

### Public Routes (no auth required)
Defined in middleware.ts `isPublicRoute`:
- Static pages: `/`, `/pricing`, `/terms`, `/privacy`, `/acceptable-use`, `/refund`, `/reseller-agreement`, `/about`, `/blog`, `/security`
- Auth pages: `/sign-in(.*)`, `/sign-up(.*)`
- Webhooks: `/api/stripe/webhook`
- Health: `/api/health`
- Enterprise (public form): `/api/enterprise/(.*)`
- External API (key-authed separately): `/api/v1/(.*)`

### Authenticated Routes (Clerk session required)
Everything not in the public list. Auth is obtained via `getOrCreateUser()` from `src/lib/auth.ts`, which:
- Calls `auth()` for Clerk userId
- Calls `currentUser()` for email/name
- Upserts the DB User record by clerkId
- Auto-expires free trials
- Auto-awards Golden Egg badge (365+ days on promo)

Quick auth (no DB user needed): `requireAuth()` returns just the userId string.

### Admin Routes (email allowlist)
Routes under `/api/admin/*` call `requireAdmin()` from `src/lib/admin.ts`:
- Calls `getOrCreateUser()` first (Clerk auth)
- Checks `user.email` against `ADMIN_EMAILS` env var (comma-separated, lowercased)
- Throws "Forbidden" if not matched

### API Key Routes (/api/v1/*)
`/api/v1/chat` uses Bearer token auth via `authenticateApiKey()` from `src/lib/api-keys.ts`:
- Extracts token from `Authorization: Bearer sk_stone_...`
- SHA-256 hashes the raw key, looks up in `ApiKey` table
- Returns associated User or null
- PRO tier required (`tier !== "PRO"` returns 403)

### Canonical Route Handler Pattern (POST /api/chat as reference)
The hot-path chat route defines the 12-step pattern all mutation routes follow:

```
Step 1:  Authenticate (getOrCreateUser + banned check)
Step 2:  Parse & validate (req.json() + Zod schema)
Step 2b: Sanitize input (sanitizeUserInput)
Step 3:  Ownership verification (conversation.userId === user.id)
Step 3b: Tier enforcement (canAccessAgent)
Step 4:  Mode access check (isModeAllowed)
Step 4b: SMART quota hard cap (checkSmartQuota)
Step 5:  Rate limit (checkRateLimitAsync)
Step 5b: Concurrency slot (acquireConcurrencySlot)
Step 6:  Quota check (checkQuota -- daily msgs + monthly tokens)
Step 7:  Save user message to DB
Step 8:  Increment usage counters
Step 9:  Build context (history + RAG + memory)
Step 10: Build system prompt (agent prompt + security wrapper)
Step 11: Stream response (streamText from Vercel AI SDK)
Step 12: Return streaming response with X-Latency-Ms header
```

### Zod Validation Patterns
- `chatMessageSchema`: message (1-32000 chars, no whitespace-only), conversationId (cuid), mode (LOCAL|SMART)
- `bestieChatSchema`: same but 4000 char limit
- `createPostSchema`: uses `.strict()` -- rejects extra fields (security requirement)
- `enterpriseSchema`: uses `.strict()` -- server-side price recalculation ignores client prices
- All forum/bestie schemas use exact enum arrays for allowed values

### Rate Limiting Integration (src/lib/rate-limiter.ts)
- **Primary**: Redis sliding window (sorted set, 60s window, atomic pipeline)
- **Fallback**: In-memory Map (per-instance only -- NOT safe for multi-instance prod)
- **Concurrency limiter**: Redis INCR/DECR with 120s TTL safety net
- Rate limits are per-user, keyed by userId. Health endpoint uses IP-based key.
- Per-tier limits from `tierConfig.limits.requestsPerMinute` (FREE=3, STARTER=10, PLUS=15, SMART=25, PRO=30)

### Error Response Format
Two patterns used consistently:

**Simple errors** (auth, not found):
```json
{ "error": "Unauthorized" }           // 401
{ "error": "Conversation not found" } // 404
{ "error": "Account suspended" }      // 403
```

**Rich errors** (quota, rate limit, tier mismatch) -- include actionable upgrade data:
```json
{
  "code": "QUOTA_EXCEEDED",
  "message": "You've reached your usage limit",
  "currentTier": "FREE",
  "usage": { "messagesSentToday": 100, "tokensUsedThisMonth": 200000 },
  "limit": { "messagesPerDay": 100, "tokensPerMonth": 200000 },
  "nextResetDate": "2026-03-08T00:00:00.000Z",
  "offer": { "targetTier": "STARTER" }
}
```

**Rate limit errors** always include `retryAfterMs`.
**SMART quota errors** include `creditPacks` array and `suggestion: "LOCAL"`.

### Audit Logging
`logAuditEvent()` from `src/lib/audit.ts` is fire-and-forget (never blocks request). Events: auth.banned_access, agent.access_denied, rate_limit.hit, injection.detected, smart.quota_exceeded, tier.upgraded, tier.downgraded, api_key.*, concurrent.blocked. Stored in raw SQL `AuditLog` table (auto-created on first use).

## DO / DON'T Rules

- **DO** follow the 12-step pattern for any new mutation route that touches AI or user data.
- **DO** use `getOrCreateUser()` as the canonical auth entry point -- never call `auth()` directly in routes.
- **DO** check `user.banned` immediately after auth on every mutation route.
- **DO** use Zod `.strict()` on all schemas that accept external input to mutation endpoints.
- **DO** return rich error objects with `code`, `message`, and upgrade path for quota/tier errors.
- **DO** release concurrency slots in both success and error paths (try/finally pattern).
- **DO** log security events via `logAuditEvent()` -- never skip audit on auth failures or access denials.
- **DON'T** add new public routes without updating the `isPublicRoute` matcher in middleware.ts.
- **DON'T** use `req.body` directly -- always parse with `req.json()` in a try/catch, then validate with Zod.
- **DON'T** expose internal error details to clients -- use `sanitizeErrorForClient()` from security.ts.
- **DON'T** trust client-sent prices or tier values -- always recalculate server-side (see enterprise route).
- **DON'T** create new admin endpoints without calling `requireAdmin()`.
- **DON'T** rely on in-memory rate limiting in production -- always ensure Redis is available.

## Quick Reference

| Auth Method | Used By | Implementation |
|---|---|---|
| Clerk session (middleware) | All non-public routes | `getOrCreateUser()` in src/lib/auth.ts |
| Admin email allowlist | /api/admin/* | `requireAdmin()` in src/lib/admin.ts |
| API key Bearer token | /api/v1/* | `authenticateApiKey()` in src/lib/api-keys.ts |
| Stripe webhook signature | /api/stripe/webhook | `stripe.webhooks.constructEvent()` inline |
| IP-based (public) | /api/health, /api/enterprise | `getClientIp()` + rate limit only |
| CSRF origin check | /api/enterprise | `validateOrigin()` in src/lib/security.ts |

| Status Code | When Used |
|---|---|
| 400 | Invalid JSON, Zod validation failure |
| 401 | Missing/invalid auth (Clerk session or API key) |
| 403 | Banned, tier mismatch, agent access denied, CSRF fail |
| 404 | Conversation/agent/bestie not found |
| 409 | Duplicate resource (e.g., bestie name conflict) |
| 429 | Rate limited, quota exceeded, too many concurrent |
| 500 | Unhandled error (sanitized message only) |

| Key File | Purpose |
|---|---|
| src/middleware.ts | Global middleware: auth gate, security headers, CORS |
| src/lib/auth.ts | getOrCreateUser(), requireAuth() |
| src/lib/admin.ts | requireAdmin() |
| src/lib/api-keys.ts | API key generation, hashing, authentication |
| src/lib/security.ts | Input sanitization, prompt wrapping, CSRF, IP extraction |
| src/lib/rate-limiter.ts | Redis/in-memory sliding window + concurrency slots |
| src/lib/quota.ts | Daily message + monthly token + SMART quota checks |
| src/lib/validators.ts | Shared Zod schemas (chatMessageSchema) |
| src/lib/audit.ts | Fire-and-forget security event logging |
| src/lib/tier-config.ts | All tier limits, perks, pricing, agent access rules |
