# FE-1: Next.js 16 App Router Patterns & Pitfalls

## Purpose
Actionable reference for the Senior Frontend Engineer working on Stone AI's Next.js 16 (package: next@15.5.12, eslint-config-next@16.1.6) codebase. Every pattern below is grounded in actual files from `C:\Users\stone\stone-ai`.

---

## Route Architecture (Actual Codebase)

### Route Group Layout
```
src/app/
  layout.tsx            ← Root layout (Server Component). Providers: ClerkProvider, QueryProvider, Toaster.
  (auth)/               ← Auth route group — centered Clerk sign-in/sign-up
    layout.tsx           ← Simple flex-center wrapper, NO providers
    loading.tsx          ← Spinner (Loader2) — only route group with a loading boundary
    sign-in/[[...sign-in]]/page.tsx
    sign-up/[[...sign-up]]/page.tsx
  (public)/             ← Public marketing pages — NO auth required
    layout.tsx           ← Passthrough (<>{children}</>), exists to isolate from app layout
    page.tsx             ← Landing page (Server Component, massive ~1600 lines)
    about/page.tsx
    blog/page.tsx
    terms/page.tsx, privacy/page.tsx, security/page.tsx, etc.
  app/                  ← Authenticated app shell
    layout.tsx           ← Server Component: calls getOrCreateUser(), passes data to client wrapper
    app-shell-wrapper.tsx ← Client Component: sidebar, onboarding redirect, referral tracking
    page.tsx             ← Dashboard/home (Client Component — suggestion chips)
    chat/[id]/page.tsx   ← Dynamic route with async params
    agents/page.tsx      ← Server Component thin wrapper -> client marketplace
    billing/page.tsx     ← Server Component data fetch -> client presentation
    settings/page.tsx    ← Server Component data fetch -> client presentation
    bestie/page.tsx, bestie/create/page.tsx, bestie/chat/[conversationId]/page.tsx
    community/page.tsx, admin/page.tsx, support/page.tsx
    discover/page.tsx, promotions/page.tsx, onboarding/page.tsx
```

### Three Layout Tiers
1. **Root** (`src/app/layout.tsx`) — ClerkProvider (dark theme), font variables, QueryProvider, Toaster
2. **Route Group** — `(auth)` centers content; `(public)` is passthrough; `app/` fetches user + wraps in AppShell
3. **No nested page-level layouts** — Pages are either server fetchers or direct client components

---

## Server vs Client Component Patterns

### THE CODEBASE PATTERN: "Server Fetcher + Client Presenter"
This is the dominant pattern in `/app/`:

```
// page.tsx (Server Component — NO "use client")
import { getOrCreateUser } from "@/lib/auth";
import { SomeClient } from "./some-client";

export default async function SomePage() {
  const user = await getOrCreateUser();
  // Serialize data, pass as props
  return <SomeClient user={{ ...serializedData }} />;
}
```

**Files using this pattern:**
- `app/agents/page.tsx` → `agent-marketplace.tsx`
- `app/billing/page.tsx` → `billing-client.tsx`
- `app/settings/page.tsx` → `settings-client.tsx`
- `app/community/page.tsx` → `community-client.tsx`
- `app/support/page.tsx` → `support-client.tsx`
- `app/discover/page.tsx` → `discover-client.tsx`
- `app/promotions/page.tsx` → `promotions-client.tsx`

**Files that are direct client pages (no server wrapper):**
- `app/page.tsx` — Dashboard home (no data fetch needed)
- `app/onboarding/page.tsx` — Wizard (client-only)
- `app/bestie/create/page.tsx` — Creation flow
- `app/bestie/page.tsx` — Bestie hub

### Dynamic Route Params (Next.js 15+ Breaking Change)
In Next.js 15+, `params` is a **Promise**. The codebase handles this correctly:

```typescript
// src/app/app/chat/[id]/page.tsx
interface ChatPageProps {
  params: Promise<{ id: string }>;  // <-- Promise, not direct object
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { id } = await params;      // <-- Must await
  return <ChatViewWrapper conversationId={id} />;
}
```

---

## Error Boundary Architecture

### Three-Level Error Handling
1. **`global-error.tsx`** — Catches root layout failures. Uses inline styles (no Tailwind — CSS may not load). Includes full `<html>/<body>` tags. This is the nuclear fallback.
2. **`error.tsx`** — Catches errors in the app segment. Uses `"use client"`, has `reset()` and navigation to `/app`. Uses shadcn Button.
3. **`not-found.tsx`** — Server Component (no `"use client"`). Uses Link + Button with `asChild` pattern.

### Loading Boundary
Only `(auth)/loading.tsx` exists. The app segment relies on React Query loading states within client components rather than route-level `loading.tsx` files.

---

## Metadata Patterns

### Root Metadata (Static Export)
```typescript
// src/app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: "Stone AI -- Local-First AI Chat",
    template: "%s | Stone AI",   // <-- Child pages use template
  },
  description: "Private, fast AI chat powered by local GPU inference...",
};
```

### Web App Manifest (Dynamic)
```typescript
// src/app/manifest.ts — function export, NOT static JSON
export default function manifest(): MetadataRoute.Manifest {
  return { name: "Stone AI...", start_url: "/app/chat", display: "standalone", ... };
}
```

**No per-page metadata exports found** — pages rely on the root template. Opportunity: add `metadata` exports to key pages (billing, agents, settings) for better SEO on public routes.

---

## DO Rules

1. **DO use the "Server Fetcher + Client Presenter" pattern** for any page that needs user/db data. Server component fetches, serializes to plain objects, passes as props.
2. **DO await `params`** in dynamic routes — it's a Promise in Next.js 15+.
3. **DO serialize dates to ISO strings** before passing to client components (see `settings/page.tsx`: `createdAt: user.createdAt.toISOString()`).
4. **DO use route groups `()` for layout isolation** — `(auth)`, `(public)`, and `app/` each get independent layouts without affecting URL structure.
5. **DO keep `global-error.tsx` dependency-free** — inline styles only, full HTML document, no imports from the design system.
6. **DO use `Suspense` boundaries** around client components that fetch (see `billing/page.tsx`).
7. **DO create `-client.tsx` companion files** next to `page.tsx` when the page needs interactivity. Naming convention: `billing-client.tsx`, `settings-client.tsx`, `community-client.tsx`.
8. **DO use `suppressHydrationWarning`** on `<html>` and `<body>` when using theming/Clerk (already in root layout).

## DON'T Rules

1. **DON'T add `"use client"` to page.tsx files that fetch server data** — the server fetcher must remain a Server Component. Put interactivity in the companion `-client.tsx` file.
2. **DON'T pass non-serializable objects** (Prisma models, Date objects, functions) as props from server to client components.
3. **DON'T create `loading.tsx` in every route** — the codebase uses React Query's `isLoading` state within client components. Only add route-level loading if you need Suspense streaming for a server component.
4. **DON'T nest layouts deeper than 2 levels** — the codebase is flat: root -> route group -> pages. No per-feature sub-layouts.
5. **DON'T use `router.push()` from Server Components** — only use `redirect()` from `next/navigation` in server code. Client components use `useRouter().push()`.
6. **DON'T import server-only modules (db, auth) in files marked `"use client"`** — this will fail at build. The boundary is enforced by the companion file pattern.
7. **DON'T forget that `[[...slug]]` (optional catch-all) is used for Clerk routes** — changing those patterns will break auth.
8. **DON'T add providers inside route group layouts** — all providers live in root `layout.tsx`. Route group layouts are thin wrappers only.

---

## Quick Reference

| What | Where | Type |
|---|---|---|
| Root providers | `src/app/layout.tsx` | Server (wraps client providers) |
| Auth pages | `src/app/(auth)/` | Centered layout + Clerk components |
| Public/marketing | `src/app/(public)/` | Server Components (SSR for SEO) |
| App shell | `src/app/app/layout.tsx` + `app-shell-wrapper.tsx` | Server fetch -> Client shell |
| Error (app) | `src/app/error.tsx` | Client Component |
| Error (global) | `src/app/global-error.tsx` | Client Component (inline styles) |
| 404 | `src/app/not-found.tsx` | Server Component |
| Loading | `src/app/(auth)/loading.tsx` | Server Component (only one) |
| Manifest | `src/app/manifest.ts` | Dynamic function export |
| State mgmt | `src/store/app-store.ts` | Zustand (client-only) |
| Data fetching | `src/hooks/use-*.ts` | React Query hooks (client) |
| CSS entry | `src/app/globals.css` | Tailwind v4 + custom keyframes |

### Key Dependencies
- `next@15.5.12` (eslint-config-next@16.1.6)
- `react@19.2.3` / `react-dom@19.2.3`
- `@clerk/nextjs@6.39.0` (auth)
- `@tanstack/react-query@5.90.21` (client data)
- `zustand@5.0.11` (client state)
- `@ai-sdk/react@3.0.112` + `ai@6.0.110` (chat streaming)
- `framer-motion@12.35.0` (animations)
