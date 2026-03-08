# BE-3: Clerk Auth Integration Patterns (Dev to Prod)

## Purpose
Definitive reference for how Clerk authentication is wired into Stone AI, what the current dev-mode setup looks like, what must change for production, and where the gaps and blockers are.

## Key Patterns (from actual codebase)

### Clerk Packages & SDK Usage

Stone AI uses `@clerk/nextjs` with the Next.js 16 App Router. Two server-side imports are used:

```typescript
// src/lib/auth.ts
import { auth, currentUser } from "@clerk/nextjs/server";

// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
```

No Clerk React components are imported in backend code. Frontend uses Clerk's `<SignIn>`, `<SignUp>`, and `<UserButton>` components (outside backend scope).

### Middleware Integration (src/middleware.ts)

The entire app is wrapped in `clerkMiddleware()`. This is the ONLY middleware -- there is no middleware chain or composition. Clerk handles:

1. **Session extraction**: Automatically parses Clerk session cookies and makes `auth()` available.
2. **Public route bypass**: Routes matching `isPublicRoute` skip auth checks.
3. **Auth gate**: Non-public routes call `await auth()` -- if no userId, redirect to `/sign-in`.

The middleware matcher skips static assets:
```typescript
matcher: [
  "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  "/(api|trpc)(.*)",
]
```

### User Sync Pattern (src/lib/auth.ts -- getOrCreateUser)

This is the canonical auth function called by every authenticated route. It bridges Clerk and the local database:

```
1. auth()           -> Get Clerk userId from session
2. currentUser()    -> Get full Clerk user object (email, name)
3. db.user.upsert() -> Sync to Prisma User model by clerkId
```

The upsert ensures:
- New Clerk users get a DB record on first API call (no separate webhook needed for user creation)
- Email/name changes in Clerk propagate on next request
- The DB user is always returned with current Clerk data

Post-upsert side effects:
- **Free trial expiry**: If `freeTrialEndsAt < now` and no active subscription, auto-revert to FREE tier
- **Golden Egg badge**: If user has been on promo price for 365+ days, auto-award badge

### Session Validation Flow

Every authenticated request follows this exact path:

```
Browser request
  -> Clerk middleware (cookie -> session -> userId)
  -> Route handler calls getOrCreateUser()
     -> auth() extracts userId (throws "Unauthorized" if missing)
     -> currentUser() gets full profile
     -> db.user.upsert syncs to DB
     -> Returns Prisma User object with tier, badges, etc.
  -> Route uses User object for all authorization decisions
```

There is NO separate session table or token refresh logic in the app code -- Clerk handles all session lifecycle.

### Auth Helper Functions

| Function | File | Returns | Use When |
|---|---|---|---|
| `getOrCreateUser()` | src/lib/auth.ts | Full Prisma User | Need user data (tier, badges, email) |
| `requireAuth()` | src/lib/auth.ts | userId string | Only need to verify auth, no DB query |
| `requireAdmin()` | src/lib/admin.ts | Full Prisma User | Admin-only endpoints |
| `authenticateApiKey()` | src/lib/api-keys.ts | Prisma User or null | /api/v1/* routes (no Clerk session) |

### Current Dev Mode Setup

Detected in admin health endpoint:
```typescript
clerkMode: (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "")
  .startsWith("pk_test_") ? "development" : "production"
```

Current state: **Development mode** (`pk_test_*` key).

Dev mode characteristics:
- Clerk dashboard at clerk.com shows "Development" instance
- Sign-in uses Clerk's development auth pages (hosted or embedded)
- Email verification may be relaxed
- No production domain verification required
- Session cookies use development signing keys

### Environment Variables for Clerk

From `src/lib/env-check.ts`:

| Variable | Required | Current State |
|---|---|---|
| `CLERK_SECRET_KEY` | YES | Set (sk_test_*) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | YES | Set (pk_test_*) |

From middleware.ts CSP and connect-src:
- `https://clerk.stone-ai.net` -- Custom Clerk domain (configured in Clerk dashboard)
- `https://*.clerk.accounts.dev` -- Clerk's development domain fallback

### Auth Pages Configuration

Middleware relaxes Cross-Origin policies for auth pages:
```typescript
if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
  response.headers.delete("Cross-Origin-Embedder-Policy");
  response.headers.delete("Cross-Origin-Opener-Policy");
  response.headers.delete("Cross-Origin-Resource-Policy");
  response.headers.delete("Content-Security-Policy");
}
```

This is necessary because Clerk renders via iframes/popups that need cross-origin access.

### Webhook Situation: NO Clerk Webhook Exists

There is **no Clerk webhook endpoint** in the codebase. User creation is handled by `getOrCreateUser()` on first API call, not by a webhook. This means:
- User deletion in Clerk dashboard does NOT propagate to the DB
- Email changes in Clerk propagate only when the user makes their next request
- Account deactivation in Clerk is NOT reflected in Stone AI until next request

The Stripe webhook (`/api/stripe/webhook`) exists and handles subscription lifecycle, but there is no equivalent for Clerk events.

### CSP Configuration for Clerk

The Content-Security-Policy in middleware.ts allows Clerk domains in:
- `script-src`: `https://clerk.stone-ai.net`, `https://*.clerk.accounts.dev`
- `connect-src`: `https://clerk.stone-ai.net`, `https://*.clerk.accounts.dev`, `https://clerk-telemetry.com`
- `frame-src`: `https://clerk.stone-ai.net`, `https://*.clerk.accounts.dev`

### Banned User Handling

Banning is done at the application level (not Clerk level). The `user.banned` field is checked after `getOrCreateUser()`:
```typescript
if (user.banned) {
  logAuditEvent({ event: "auth.banned_access", userId: user.id, ip: ... });
  return Response.json({ error: "Account suspended" }, { status: 403 });
}
```

This check exists in: `/api/chat`, `/api/bestie/chat`, `/api/bestie` CRUD, `/api/v1/chat`.

## Dev-to-Prod Migration Checklist

### Must Do Before Going Live

1. **Switch Clerk instance to Production**
   - Create production instance in Clerk dashboard
   - Get new `CLERK_SECRET_KEY` (sk_live_*) and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (pk_live_*)
   - Set both on Vercel environment variables

2. **Configure custom domain**
   - Verify `clerk.stone-ai.net` as Clerk's production domain
   - Update Cloudflare DNS with Clerk's required CNAME records
   - CSP in middleware.ts already allows `clerk.stone-ai.net` -- no code change needed

3. **Remove development domains from CSP**
   - Remove `https://*.clerk.accounts.dev` from script-src, connect-src, frame-src
   - This prevents dev Clerk infrastructure from being used in production

4. **Set up Clerk webhook endpoint** (NEW -- does not exist yet)
   - Create `/api/clerk/webhook/route.ts`
   - Handle events: `user.deleted`, `user.updated`, `session.revoked`
   - On `user.deleted`: soft-delete or deactivate the User record + archive conversations
   - On `user.updated`: sync email/name to DB (currently only syncs on next request)
   - Verify webhook signatures using Clerk's `svix` library
   - Add `/api/clerk/webhook` to public routes in middleware.ts

5. **Add ANTHROPIC_API_KEY to Vercel** (blocker noted in MEMORY.md)
   - Required for SMART mode and LOCAL fallback on Vercel
   - Without this, ALL inference fails in production

### Should Do

6. **Enable Clerk email verification** in production
   - Dev mode may have relaxed email verification
   - Production should require verified email before account creation

7. **Sync banned status to Clerk**
   - Currently banning is app-level only. Consider calling Clerk's `users.updateUser()` to also ban at Clerk level, preventing sign-in entirely.

8. **Session lifetime review**
   - Clerk's default session lifetime may be too long for a paid SaaS
   - Consider configuring shorter session expiry in Clerk dashboard

9. **Rate limit the auth redirect**
   - Currently, unauthenticated requests to protected routes redirect to `/sign-in` with no rate limit
   - A bot could generate excessive Clerk-hosted page loads

### Known Gaps / Blockers

| Gap | Risk | Priority |
|---|---|---|
| No Clerk webhook | User deletion in Clerk leaves orphaned DB records | P1 |
| ANTHROPIC_API_KEY not on Vercel | All inference fails in prod | P0 |
| Clerk still in dev mode | Cannot verify custom domain, sessions use test keys | P0 |
| dev domains in CSP | Minor security exposure (dev infra accessible from prod) | P2 |
| Banned users can still sign in | They get 403 on every API call but can access static pages | P3 |

## DO / DON'T Rules

- **DO** always use `getOrCreateUser()` as the single entry point for authenticated routes. It handles upsert, trial expiry, and badge awarding.
- **DO** check `user.banned` immediately after auth in every mutation route.
- **DO** keep the middleware as a single Clerk wrapper -- never add custom middleware outside of `clerkMiddleware()`.
- **DO** update the `isPublicRoute` matcher when adding any new public endpoint.
- **DO** add the Clerk webhook endpoint before production launch.
- **DON'T** call `auth()` directly in route handlers -- use `getOrCreateUser()` or `requireAuth()`.
- **DON'T** store Clerk session tokens in the database -- Clerk manages all session state.
- **DON'T** assume email/name sync is real-time -- it only happens on the user's next authenticated request.
- **DON'T** use `pk_test_*` or `sk_test_*` keys in production -- they use Clerk's development infrastructure.
- **DON'T** remove the Cross-Origin header relaxation for `/sign-in` and `/sign-up` -- Clerk will break.

## Quick Reference

| File | Clerk Integration Point |
|---|---|
| src/middleware.ts | `clerkMiddleware()` -- global auth gate, public route matcher |
| src/lib/auth.ts | `auth()`, `currentUser()` -- session extraction + DB sync |
| src/lib/admin.ts | Uses `getOrCreateUser()` + email allowlist |
| src/lib/env-check.ts | Validates CLERK_SECRET_KEY and publishable key exist |
| src/app/api/admin/health/route.ts | Reports Clerk mode (dev vs prod) in infraStatus |

| Clerk Function | Where Used | Purpose |
|---|---|---|
| `auth()` | auth.ts | Extract userId from session cookie |
| `currentUser()` | auth.ts | Get full profile (email, name) from Clerk |
| `clerkMiddleware()` | middleware.ts | Wrap all routes with session management |
| `createRouteMatcher()` | middleware.ts | Define public routes that skip auth |
