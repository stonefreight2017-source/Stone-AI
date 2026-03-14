# Debugging Decision Trees — Application Debugging Methodology

> Palace Knowledge Seed: Engineering
> Domain: Full-stack debugging for Next.js + Prisma + Clerk + Stripe + vLLM
> Version: 1.0 | 2026-03-09

---

## Table of Contents

1. [Error Classification Framework](#1-error-classification-framework)
2. [The "What Changed?" Protocol](#2-the-what-changed-protocol)
3. [Binary Search for Bugs](#3-binary-search-for-bugs)
4. [Decision Tree: Blank Page](#4-decision-tree-blank-page)
5. [Decision Tree: 500 Internal Server Error](#5-decision-tree-500-internal-server-error)
6. [Decision Tree: Hydration Mismatch](#6-decision-tree-hydration-mismatch)
7. [Prisma Error Code Reference](#7-prisma-error-code-reference)
8. [Clerk Authentication Debugging](#8-clerk-authentication-debugging)
9. [Stripe Integration Debugging](#9-stripe-integration-debugging)
10. [React Query Debugging](#10-react-query-debugging)
11. [vLLM / AI Provider Debugging](#11-vllm--ai-provider-debugging)
12. [Production Debugging Playbook](#12-production-debugging-playbook)
13. [Cross-Cutting Patterns](#13-cross-cutting-patterns)

---

## 1. Error Classification Framework

Every error falls into one of these categories. Classify FIRST, then follow the appropriate decision tree.

### 1.1 Error Taxonomy

| Category | Symptoms | Typical Root Cause | Urgency |
|---|---|---|---|
| **Render Failure** | Blank page, white screen, nothing loads | JS crash, missing export, SSR error | P0 — users see nothing |
| **Server Error** | 500 response, error page, API failure | Unhandled exception, DB error, missing env var | P0 — feature broken |
| **Hydration Error** | Content flickers, console warnings, mismatched markup | Server/client HTML mismatch | P1 — functional but unstable |
| **Data Error** | Wrong data displayed, missing records, stale state | Query bug, cache issue, race condition | P1 — incorrect behavior |
| **Auth Error** | Redirect loops, 401/403, session loss | Token expiry, middleware misconfiguration | P0 — users locked out |
| **Payment Error** | Checkout fails, webhook rejected, subscription stuck | Stripe API error, webhook signature, plan mismatch | P0 — revenue impact |
| **Performance Error** | Slow load, timeout, memory spike | N+1 queries, missing index, memory leak | P2 — degraded experience |
| **Integration Error** | Third-party call fails, timeout, unexpected response | API change, rate limit, network issue | P1 — feature degraded |

### 1.2 Severity Matrix

```
P0 (Critical)  — Users cannot use the application or a core feature
                  Revenue is directly impacted
                  Data integrity is at risk
                  Drop everything. Fix now.

P1 (High)      — Feature is degraded but workaround exists
                  Affects subset of users
                  Non-revenue-critical path broken
                  Fix within the hour.

P2 (Medium)    — Performance degradation
                  UI inconsistency
                  Edge case failure
                  Fix within the day.

P3 (Low)       — Cosmetic issue
                  Dev-only tooling broken
                  Non-blocking warning
                  Fix when convenient.
```

### 1.3 First Response Protocol (Every Bug, Every Time)

Before you touch code, do these five things:

```
Step 1: REPRODUCE
  - Can you make it happen consistently?
  - What exact steps trigger it?
  - Does it happen in dev, prod, or both?

Step 2: CLASSIFY
  - Which category from the taxonomy above?
  - What severity?
  - How many users affected?

Step 3: ISOLATE
  - Client or server?
  - Which component/route/API?
  - Which commit introduced it? (see "What Changed?" protocol)

Step 4: GATHER
  - Browser console errors (exact text)
  - Server logs (exact text)
  - Network tab (status codes, response bodies)
  - Database state (relevant records)

Step 5: HYPOTHESIZE
  - Form exactly ONE hypothesis before changing code
  - State it explicitly: "I believe X is happening because Y"
  - Design a test that proves or disproves it
```

---

## 2. The "What Changed?" Protocol

The single most effective debugging technique. When something breaks, the answer is almost always in what changed recently.

### 2.1 The Seven Questions

Ask these in order. Stop as soon as you find the answer.

```
1. What code changed?
   → git log --oneline -20
   → git diff HEAD~5..HEAD --stat
   → Look at files touched in last 5 commits

2. What dependencies changed?
   → git diff HEAD~5..HEAD -- package.json
   → git diff HEAD~5..HEAD -- package-lock.json
   → Check for major version bumps

3. What environment changed?
   → .env / .env.local differences
   → Vercel environment variables dashboard
   → Node.js version change
   → New deployment region

4. What infrastructure changed?
   → Database migration ran?
   → New Neon branch?
   → Cloudflare settings?
   → DNS changes?

5. What third-party service changed?
   → Clerk dashboard changes (keys, settings, redirects)
   → Stripe webhook endpoints
   → API version updates from any provider

6. What data changed?
   → New records that break assumptions?
   → Null values where you expected data?
   → Schema drift between environments?

7. What time-dependent thing changed?
   → Token expiration
   → Trial period ending
   → Rate limit window resetting
   → Certificate expiry
```

### 2.2 Git Forensics

```bash
# What changed in the last day
git log --since="24 hours ago" --oneline --all

# What files were touched in the last 5 commits
git diff HEAD~5..HEAD --stat

# Show the exact diff that introduced a specific file change
git log -p -- src/app/api/some-route/route.ts

# Find which commit introduced a specific string
git log -S "problematicFunction" --oneline

# Find which commit deleted a specific string
git log -S "missingFunction" --oneline --diff-filter=D

# Blame a specific line range
git blame -L 45,60 src/lib/some-file.ts

# Compare current branch to main
git diff main..HEAD --stat
```

### 2.3 Environment Diff Checklist

```
Local (.env.local) vs Vercel (Environment Variables):

[ ] DATABASE_URL — same Neon project/branch?
[ ] NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY — dev vs prod key?
[ ] CLERK_SECRET_KEY — matches the publishable key's instance?
[ ] STRIPE_SECRET_KEY — test vs live?
[ ] STRIPE_WEBHOOK_SECRET — matches the endpoint?
[ ] NEXT_PUBLIC_APP_URL — http://localhost:3000 vs https://stone-ai.net?
[ ] ANTHROPIC_API_KEY — set in Vercel?
[ ] VLLM_BASE_URL — reachable from deployment environment?
```

---

## 3. Binary Search for Bugs

When you cannot identify the breaking change by inspection, use binary search to find the exact commit.

### 3.1 Git Bisect (Automated)

```bash
# Start bisect
git bisect start

# Mark current (broken) commit as bad
git bisect bad

# Mark a known-good commit as good (e.g., last week's deploy)
git bisect good abc1234

# Git checks out the middle commit. Test it.
# If it works:
git bisect good
# If it's broken:
git bisect bad

# Repeat until git identifies the exact breaking commit
# Git will say: "abc5678 is the first bad commit"

# When done:
git bisect reset
```

**Example**: Site was working Monday, broken Wednesday. You have 20 commits in between.

```
Monday (good) -------- 20 commits -------- Wednesday (bad)
                            |
                      bisect: commit 10
                      Test → still works → good
                            |
                      bisect: commit 15
                      Test → broken → bad
                            |
                      bisect: commit 12
                      Test → works → good
                            |
                      bisect: commit 13
                      Test → BROKEN → bad
                            |
              Result: commit 13 is the first bad commit
```

That's 4 tests instead of 20. For 100 commits, it's 7 tests instead of 100.

### 3.2 Code Binary Search (No Git History)

When the bug isn't tied to a specific commit (e.g., data-dependent), use code elimination:

```
Step 1: Comment out half the suspect code
Step 2: Does the bug still occur?
  YES → Bug is in the remaining half
  NO  → Bug is in the commented-out half
Step 3: Uncomment everything, comment out the identified half
Step 4: Comment out half of THAT section
Step 5: Repeat until you find the exact line
```

**Example**: A component renders blank.

```tsx
// Suspect: SomePage component with 6 child components
export default function SomePage() {
  return (
    <Layout>
      {/* Comment out bottom half */}
      <Header />
      <Sidebar />
      <MainContent />
      {/* <Footer /> */}
      {/* <Analytics /> */}
      {/* <ChatWidget /> */}
    </Layout>
  )
}
// Still blank? Bug is in Header, Sidebar, or MainContent
// Works? Bug is in Footer, Analytics, or ChatWidget
```

### 3.3 Network Binary Search

When an API chain fails, isolate which hop is broken:

```
Client → API Route → Service Layer → Prisma → Database

Test each boundary:
1. Hit the API route directly with curl/Postman → does it respond?
2. Call the service function directly in a test → does it return data?
3. Run the Prisma query directly → does it return results?
4. Run raw SQL in Neon console → does the data exist?

Wherever the chain breaks, that's your layer.
```

---

## 4. Decision Tree: Blank Page

A blank page means the user sees a white screen with no content. This is always P0.

### 4.1 Master Decision Tree

```
BLANK PAGE
│
├─ Check browser console
│  ├─ JavaScript error visible?
│  │  ├─ YES → Go to [4.2 JS Error Sub-tree]
│  │  └─ NO → Continue
│  │
│  ├─ Network errors (red entries)?
│  │  ├─ YES → Go to [4.3 Network Error Sub-tree]
│  │  └─ NO → Continue
│  │
│  └─ No errors at all?
│     └─ Go to [4.4 Silent Failure Sub-tree]
│
├─ Check "View Page Source" (not Inspect Element)
│  ├─ HTML is empty or just <div id="__next"></div>?
│  │  └─ SSR is failing → Go to [4.5 SSR Failure Sub-tree]
│  │
│  └─ HTML has content but page is blank?
│     └─ CSS/rendering issue → Go to [4.6 CSS/Render Sub-tree]
│
└─ Check server logs (terminal or Vercel)
   ├─ Errors visible?
   │  └─ Server-side crash → Follow the error message
   └─ No server logs at all?
      └─ Request isn't reaching the server → DNS/routing issue
```

### 4.2 JS Error Sub-tree

```
JAVASCRIPT ERROR IN CONSOLE
│
├─ "TypeError: Cannot read properties of undefined"
│  ├─ Check: Which variable is undefined?
│  ├─ Common cause: Data fetch returned null/undefined
│  ├─ Common cause: Component rendered before data loaded
│  ├─ Fix: Add null checks, loading states, optional chaining
│  └─ Example:
│     // BROKEN: assumes user always exists
│     const name = user.name
│     // FIXED: handle undefined
│     const name = user?.name ?? 'Unknown'
│
├─ "ReferenceError: X is not defined"
│  ├─ Check: Is the import missing?
│  ├─ Check: Is the variable name misspelled?
│  ├─ Check: Is the module installed? (node_modules)
│  └─ Fix: Add the import or install the package
│
├─ "SyntaxError: Unexpected token"
│  ├─ Check: Is a file being imported that isn't valid JS/TS?
│  ├─ Check: Is a server-only module being imported in client code?
│  ├─ Common: Importing a .json file without proper config
│  └─ Common: Missing 'use client' directive
│
├─ "ChunkLoadError" or "Loading chunk X failed"
│  ├─ Cause: Stale deployment — client has old JS, server has new
│  ├─ Fix (user): Hard refresh (Ctrl+Shift+R)
│  ├─ Fix (dev): Ensure builds are clean, check chunk naming
│  └─ Fix (persistent): Add error boundary with reload button
│
├─ "Minified React error #XXX"
│  ├─ Go to: https://reactjs.org/docs/error-decoder.html?invariant=XXX
│  ├─ Common #130: Element type is invalid (bad export/import)
│  ├─ Common #321: Server/client mismatch (hydration)
│  ├─ Common #418: Hydration failed (see Section 6)
│  └─ Common #423: More HTML on server than client (see Section 6)
│
└─ Error from a specific library?
   ├─ Clerk error → See Section 8
   ├─ Stripe error → See Section 9
   ├─ React Query error → See Section 10
   └─ Other: Search the exact error message, including quotes
```

### 4.3 Network Error Sub-tree

```
NETWORK ERRORS IN CONSOLE/NETWORK TAB
│
├─ 404 on a JavaScript bundle (.js file)
│  ├─ Stale build: The file existed in a previous build but not current
│  ├─ Fix: Clear .next directory, rebuild
│  ├─ Fix (Vercel): Redeploy
│  └─ Check: Is the _next/static path correct?
│
├─ 404 on an API route
│  ├─ Check: Does the route file exist at the correct path?
│  ├─ Check: Is the HTTP method correct (GET vs POST)?
│  ├─ Check: Is the route.ts file exporting the correct function name?
│  │  // Must be: export async function GET/POST/PUT/DELETE
│  └─ Check: Dynamic route segments match? [id] vs [slug]
│
├─ CORS error
│  ├─ "Access-Control-Allow-Origin" missing
│  ├─ Check: API route missing CORS headers?
│  ├─ Check: Calling wrong domain? (localhost vs stone-ai.net)
│  └─ Fix: Add CORS headers to API route or use Next.js API routes
│     // In next.config.js or route handler:
│     headers: { 'Access-Control-Allow-Origin': 'https://stone-ai.net' }
│
├─ net::ERR_CONNECTION_REFUSED
│  ├─ Server isn't running
│  ├─ Wrong port
│  └─ Firewall blocking
│
└─ net::ERR_NAME_NOT_RESOLVED
   ├─ DNS issue
   ├─ Wrong URL/domain
   └─ Check: NEXT_PUBLIC_APP_URL correct?
```

### 4.4 Silent Failure Sub-tree

```
NO ERRORS BUT BLANK PAGE
│
├─ Check: Is the page component exporting a default export?
│  // BROKEN:
│  export function Page() { ... }
│  // FIXED:
│  export default function Page() { ... }
│
├─ Check: Is the layout.tsx wrapping children correctly?
│  // BROKEN:
│  export default function Layout() { return <div>Layout</div> }
│  // FIXED:
│  export default function Layout({ children }) {
│    return <div>{children}</div>
│  }
│
├─ Check: Is a Suspense boundary or loading.tsx hanging?
│  // A Suspense fallback that never resolves = permanent loading
│  // Check: Is the suspended component's promise ever resolving?
│
├─ Check: Is an auth redirect looping?
│  // Open Network tab, look for 307/302 redirects
│  // Common: middleware redirects to /sign-in, which redirects back
│
├─ Check: Is CSS hiding everything?
│  // Inspect body → is it display:none or opacity:0?
│  // Check: Tailwind class that hides content (hidden, invisible, opacity-0)
│
└─ Check: Is the component returning null or empty fragment?
   // A condition that's always false:
   if (!data) return null  // data is ALWAYS undefined = always null
```

### 4.5 SSR Failure Sub-tree

```
SERVER-SIDE RENDERING FAILURE
│
├─ Check Vercel function logs (or terminal in dev)
│  ├─ "Error: NEXT_REDIRECT" — a redirect() call is being caught
│  ├─ "Error: Dynamic server usage" — static page doing dynamic things
│  ├─ "PrismaClientInitializationError" — DB connection failure
│  └─ Any unhandled error in a Server Component kills the entire page
│
├─ Common causes:
│  ├─ Server Component throws during render → entire page blank
│  ├─ Database unreachable during SSR → unhandled promise rejection
│  ├─ Missing environment variable on server → undefined access
│  └─ Import of client-only code in Server Component
│
├─ Diagnostic steps:
│  1. Add error.tsx to the route directory (if missing)
│  2. Add try/catch in the page component
│  3. Log the error server-side
│  4. Check if the error only happens in production
│     (often: env var missing in Vercel but present locally)
│
└─ Fix pattern:
   // Always wrap server data fetching:
   export default async function Page() {
     try {
       const data = await prisma.user.findMany()
       return <UserList users={data} />
     } catch (error) {
       console.error('Page SSR error:', error)
       return <ErrorDisplay message="Failed to load data" />
     }
   }
```

### 4.6 CSS/Render Sub-tree

```
HTML EXISTS BUT PAGE IS BLANK
│
├─ Check: Is Tailwind generating styles?
│  ├─ Is tailwind.config content array correct?
│  │  content: ['./src/**/*.{ts,tsx}']
│  ├─ Is the globals.css imported in layout.tsx?
│  └─ Are classes being purged incorrectly?
│
├─ Check: Is a CSS class hiding content?
│  ├─ overflow-hidden on a zero-height container
│  ├─ absolute positioning off-screen
│  ├─ z-index layering (something on top with background)
│  └─ dark mode class applying wrong colors (white on white)
│
├─ Check: Is a modal/overlay covering everything?
│  ├─ Dialog component rendered but not visible
│  ├─ Backdrop with high z-index
│  └─ Portal rendering outside expected container
│
└─ Quick diagnostic:
   // Add to the page temporarily:
   <div style={{ background: 'red', padding: 20, position: 'fixed',
     top: 0, left: 0, zIndex: 99999 }}>
     DEBUG: If you see this, the page IS rendering
   </div>
```

---

## 5. Decision Tree: 500 Internal Server Error

A 500 means the server crashed while handling the request. Always P0 for API routes that users depend on.

### 5.1 Master Decision Tree

```
500 INTERNAL SERVER ERROR
│
├─ WHERE is the 500 happening?
│  ├─ API route (/api/...) → [5.2 API Route 500]
│  ├─ Page load (SSR) → [5.3 SSR 500]
│  ├─ Server Action → [5.4 Server Action 500]
│  └─ Middleware → [5.5 Middleware 500]
│
├─ WHEN does it happen?
│  ├─ Every request → Deterministic bug (usually code error)
│  ├─ Intermittent → Resource issue (DB connection, rate limit, timeout)
│  ├─ After deployment → Regression (use "What Changed?" protocol)
│  └─ After some time → Resource leak, token expiry, connection pool
│
└─ Get the ACTUAL error:
   ├─ Dev: Check terminal output (full stack trace)
   ├─ Vercel: Runtime Logs → filter by 500 status
   ├─ Add logging if none exists:
   │  catch (error) {
   │    console.error('[API_NAME]', error.message, error.stack)
   │    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
   │  }
   └─ NEVER return the actual error message to the client in production
```

### 5.2 API Route 500 Sub-tree

```
API ROUTE RETURNS 500
│
├─ Check: Is the route handler wrapped in try/catch?
│  └─ NO → Any thrown error becomes an unhandled 500
│     Fix: Wrap entire handler in try/catch
│
├─ Check: Database errors?
│  ├─ PrismaClientKnownRequestError → See Section 7
│  ├─ PrismaClientInitializationError → DB connection issue
│  │  ├─ Check DATABASE_URL is set and correct
│  │  ├─ Check Neon project is active (not suspended)
│  │  ├─ Check connection pooling settings
│  │  └─ Check: Are you exceeding connection limits?
│  └─ PrismaClientValidationError → Query is malformed
│     ├─ Check: Are you passing the right types?
│     ├─ Check: Does the model match current schema?
│     └─ Run: npx prisma generate (schema might be out of sync)
│
├─ Check: Request body parsing?
│  ├─ await request.json() throws if body isn't valid JSON
│  ├─ Fix: Wrap in try/catch
│  │  let body
│  │  try { body = await request.json() }
│  │  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
│  └─ Check: Is the client sending Content-Type: application/json?
│
├─ Check: Zod validation?
│  ├─ .parse() throws on invalid data → must catch or use .safeParse()
│  ├─ .strict() rejects unknown keys → client sending extra fields?
│  └─ Pattern:
│     const result = schema.safeParse(body)
│     if (!result.success) {
│       return NextResponse.json({ error: result.error.issues }, { status: 400 })
│     }
│
├─ Check: Auth errors?
│  ├─ auth() returns null user → accessing .userId on null
│  ├─ Clerk API call fails → network/key issue
│  └─ Pattern:
│     const { userId } = await auth()
│     if (!userId) {
│       return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
│     }
│
├─ Check: External API failures?
│  ├─ Stripe API call throws → key issue, invalid params, rate limit
│  ├─ Anthropic API call throws → key issue, model unavailable
│  ├─ vLLM call throws → server unreachable, model not loaded
│  └─ All external calls MUST be in try/catch with specific error handling
│
└─ Check: Timeout?
   ├─ Vercel Serverless: 10s default (Pro: 60s, Enterprise: 900s)
   ├─ Vercel Edge: 30s
   ├─ Symptom: Function works locally but 500s on Vercel
   ├─ Fix: Optimize query, add caching, use streaming
   └─ Fix: Increase timeout in vercel.json:
      { "functions": { "src/app/api/slow-route/route.ts": { "maxDuration": 30 } } }
```

### 5.3 SSR 500 Sub-tree

```
PAGE RETURNS 500 DURING SERVER-SIDE RENDER
│
├─ Most common causes:
│  ├─ Server Component throws an unhandled error
│  ├─ Database query fails during page render
│  ├─ redirect() or notFound() called incorrectly
│  └─ Import of undefined/null module
│
├─ Diagnostic:
│  1. Check server logs for the actual error
│  2. If no error.tsx exists in the route, add one:
│     // src/app/some-route/error.tsx
│     'use client'
│     export default function Error({ error, reset }) {
│       console.error(error)
│       return <button onClick={() => reset()}>Retry</button>
│     }
│  3. Add try/catch to the page's data fetching
│  4. Check if the error is environment-specific
│
├─ redirect() and notFound() gotchas:
│  ├─ redirect() throws a NEXT_REDIRECT error internally
│  ├─ Do NOT wrap redirect() in try/catch — it will be caught
│  ├─ Pattern:
│     // BROKEN: redirect is caught by the catch
│     try {
│       if (!user) redirect('/sign-in')
│       const data = await fetchData()
│     } catch (e) {
│       // This catches the redirect!
│     }
│     // FIXED: redirect outside try/catch
│     if (!user) redirect('/sign-in')
│     try {
│       const data = await fetchData()
│     } catch (e) {
│       // Only catches real errors
│     }
│  └─ Same applies to notFound()
│
└─ Production-only 500:
   ├─ Check: All env vars set in Vercel?
   ├─ Check: Edge runtime compatibility? (some Node APIs unavailable)
   ├─ Check: Build-time vs runtime data fetching?
   └─ Check: Static generation failing? (ISR/SSG errors)
```

### 5.4 Server Action 500 Sub-tree

```
SERVER ACTION RETURNS 500
│
├─ Check: Is the action in a file with 'use server'?
│
├─ Check: Is the action receiving the right arguments?
│  ├─ FormData vs plain object — are you parsing correctly?
│  ├─ File uploads: Check size limits
│  └─ Type mismatches: FormData values are always strings
│
├─ Check: Is the action returning a serializable value?
│  ├─ Cannot return: Dates, Maps, Sets, class instances, functions
│  ├─ Must return: plain objects, arrays, strings, numbers, null
│  └─ Prisma objects: May contain BigInt or Decimal — convert first
│
└─ Debug pattern:
   'use server'
   export async function myAction(formData: FormData) {
     try {
       // ... action logic
       return { success: true, data: result }
     } catch (error) {
       console.error('[myAction]', error)
       return { success: false, error: 'Action failed' }
     }
   }
```

### 5.5 Middleware 500 Sub-tree

```
MIDDLEWARE CRASHES
│
├─ Middleware runs on EVERY request (unless matcher configured)
│  ├─ A crash here = entire site down
│  ├─ Always P0
│  └─ Middleware errors are often silent in the browser
│
├─ Common causes:
│  ├─ Clerk middleware misconfigured
│  ├─ Accessing Node.js APIs in Edge Runtime (middleware is Edge)
│  ├─ Throwing inside middleware without catching
│  └─ Infinite redirect loop
│
├─ Debug:
│  1. Add console.log to the top of middleware.ts
│  2. Check if the log appears (if not, middleware isn't running)
│  3. Add try/catch around the entire middleware
│  4. Return NextResponse.next() in the catch to prevent total failure
│
└─ Safe middleware pattern:
   export default async function middleware(req: NextRequest) {
     try {
       // Your middleware logic (Clerk, etc.)
       return clerkMiddleware(req)
     } catch (error) {
       console.error('[Middleware Error]', error)
       // Fail open — let the request through rather than crash
       return NextResponse.next()
     }
   }
```

---

## 6. Decision Tree: Hydration Mismatch

Hydration mismatches happen when the HTML rendered on the server doesn't match what the client expects. React 18+ treats these as errors.

### 6.1 Master Decision Tree

```
HYDRATION MISMATCH
│
├─ Read the error message carefully
│  ├─ "Text content does not match"
│  │  └─ Server rendered different text than client
│  │
│  ├─ "Expected server HTML to contain a matching <X> in <Y>"
│  │  └─ Server HTML has a tag that client doesn't expect
│  │
│  ├─ "Hydration failed because the server rendered HTML didn't match the client"
│  │  └─ General mismatch — structure differs
│  │
│  └─ "There was an error while hydrating this Suspense boundary"
│     └─ Suspense boundary content differs
│
├─ Identify the CAUSE
│  ├─ [6.2] Browser-only values used during SSR
│  ├─ [6.3] Date/time rendering
│  ├─ [6.4] Invalid HTML nesting
│  ├─ [6.5] Conditional rendering based on client state
│  ├─ [6.6] Third-party scripts/extensions
│  └─ [6.7] Random/dynamic values
│
└─ SEVERITY assessment
   ├─ Console warning only, app works → P2, fix when convenient
   ├─ Content flickers/changes on load → P1, fix soon
   └─ App crashes or becomes unresponsive → P0, fix now
```

### 6.2 Browser-Only Values

```
PROBLEM: Code references browser APIs during server render

Common offenders:
- window.innerWidth / window.innerHeight
- document.title / document.cookie
- localStorage.getItem()
- navigator.userAgent
- window.location (use usePathname() or useSearchParams() instead)

BROKEN:
  function MyComponent() {
    const width = window.innerWidth  // undefined on server!
    return <div>Width: {width}</div>
    // Server: "Width: " (undefined)
    // Client: "Width: 1920"
    // MISMATCH
  }

FIXED (Pattern 1 — useEffect):
  function MyComponent() {
    const [width, setWidth] = useState(0)
    useEffect(() => {
      setWidth(window.innerWidth)
    }, [])
    return <div>Width: {width}</div>
    // Server: "Width: 0"
    // Client first render: "Width: 0" (matches!)
    // Client after effect: "Width: 1920" (updates safely)
  }

FIXED (Pattern 2 — dynamic import with ssr: false):
  const ClientOnlyComponent = dynamic(
    () => import('./ClientOnlyComponent'),
    { ssr: false }
  )

FIXED (Pattern 3 — suppressHydrationWarning):
  // ONLY use this when the mismatch is intentional and harmless
  <time suppressHydrationWarning>{new Date().toLocaleString()}</time>
```

### 6.3 Date/Time Rendering

```
PROBLEM: Server and client are in different timezones

BROKEN:
  // Server (UTC) renders: "March 9, 2026 00:00"
  // Client (EST) renders: "March 8, 2026 19:00"
  <p>{new Date(timestamp).toLocaleDateString()}</p>

FIXED (Pattern 1 — Use UTC explicitly):
  <p>{new Date(timestamp).toISOString().split('T')[0]}</p>

FIXED (Pattern 2 — Client-only rendering):
  function DateDisplay({ timestamp }) {
    const [formatted, setFormatted] = useState('')
    useEffect(() => {
      setFormatted(new Date(timestamp).toLocaleDateString())
    }, [timestamp])
    return <time suppressHydrationWarning>{formatted || 'Loading...'}</time>
  }

FIXED (Pattern 3 — Intl with explicit timezone):
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC'
  }).format(new Date(timestamp))
```

### 6.4 Invalid HTML Nesting

```
PROBLEM: HTML spec violations cause browser to "fix" the DOM,
creating differences from what React rendered on the server

Common violations:
- <p> inside <p> (paragraphs cannot nest)
- <div> inside <p> (block element inside inline)
- <a> inside <a> (links cannot nest)
- <form> inside <form> (forms cannot nest)
- <li> without <ul>/<ol> parent
- Interactive element inside interactive element (<button> in <a>)

BROKEN:
  <p>
    Hello
    <div>World</div>  {/* Browser ejects this from the <p> */}
  </p>
  // Server: <p>Hello<div>World</div></p>
  // Browser: <p>Hello</p><div>World</div><p></p>  (auto-corrected)
  // React sees: mismatch!

FIXED:
  <div>
    <p>Hello</p>
    <div>World</div>
  </div>

DETECTION:
  // Use the W3C validator or React DevTools
  // Browser DevTools → Console → filter for "validateDOMNesting"
  // These warnings tell you exactly which nesting is invalid
```

### 6.5 Conditional Rendering Based on Client State

```
PROBLEM: Rendering different content based on state that differs
between server and client

BROKEN:
  function Nav() {
    const isLoggedIn = !!localStorage.getItem('token') // undefined on server
    return isLoggedIn ? <UserNav /> : <GuestNav />
    // Server always renders GuestNav
    // Client might render UserNav
    // MISMATCH
  }

FIXED (use auth state from server):
  // Pass auth state from server component to client component
  // Server Component:
  export default async function Layout({ children }) {
    const { userId } = await auth()
    return <Nav isLoggedIn={!!userId}>{children}</Nav>
  }

FIXED (defer to client):
  function Nav() {
    const [isLoggedIn, setIsLoggedIn] = useState(false) // matches server
    useEffect(() => {
      setIsLoggedIn(!!localStorage.getItem('token'))
    }, [])
    return isLoggedIn ? <UserNav /> : <GuestNav />
    // First render matches server (GuestNav)
    // Effect updates after hydration (safe)
  }
```

### 6.6 Third-Party Scripts and Browser Extensions

```
PROBLEM: Browser extensions or third-party scripts inject DOM elements
that weren't in the server HTML

Common culprits:
- Grammarly (adds <grammarly-extension> tags)
- Password managers (modify form elements)
- Ad blockers (remove/modify elements)
- Google Translate (wraps text in <font> tags)
- Dark mode extensions (add style elements)

DETECTION:
  1. Does the error go away in Incognito mode with extensions disabled?
  2. Does it happen in a different browser?
  3. Check the error message — does it mention an unexpected tag?

FIX:
  // You cannot prevent extensions from modifying the DOM
  // But you can suppress the warning on elements they target:
  <body suppressHydrationWarning>
    {children}
  </body>

  // Or use error boundaries to gracefully handle crashes:
  <ErrorBoundary fallback={<p>Something went wrong</p>}>
    <ProblematicComponent />
  </ErrorBoundary>
```

### 6.7 Random/Dynamic Values

```
PROBLEM: Using Math.random(), Date.now(), or crypto.randomUUID()
produces different values on server and client

BROKEN:
  function Component() {
    const id = crypto.randomUUID() // Different on server and client!
    return <div id={id}>Content</div>
  }

FIXED (use useId hook):
  function Component() {
    const id = useId() // React ensures same ID on server and client
    return <div id={id}>Content</div>
  }

FIXED (generate once and pass as prop):
  // Server Component:
  export default function Page() {
    const id = crypto.randomUUID()
    return <ClientComponent id={id} />
  }
  // Client Component receives consistent value
```

---

## 7. Prisma Error Code Reference

### 7.1 P2002 — Unique Constraint Violation

```
Error: Unique constraint failed on the fields: (`email`)

WHAT IT MEANS:
  You're trying to create or update a record with a value that already
  exists in a column (or combination of columns) that has a unique constraint.

COMMON SCENARIOS:

  1. Creating a user with an email that already exists
     prisma.user.create({ data: { email: 'exists@test.com' } })

  2. Updating a record to have a value that conflicts
     prisma.user.update({
       where: { id: 'user-1' },
       data: { email: 'already-taken@test.com' }
     })

  3. Race condition: two requests create the same record simultaneously
     // User double-clicks "Create" button

  4. Upsert with wrong unique identifier
     prisma.user.upsert({
       where: { clerkId: 'wrong-field' },  // Not finding existing record
       create: { email: 'dup@test.com' },   // Tries to create = conflict
       update: { ... }
     })

DEBUGGING STEPS:
  1. Read the error: which field(s) violated the constraint?
     → error.meta.target tells you: ['email'] or ['referralCode']
  2. Check the database: does a record with that value exist?
     SELECT * FROM "User" WHERE email = 'the-value';
  3. Check for race conditions: is this endpoint called rapidly?
  4. Check the Prisma schema: is the @@unique correct?

HANDLING PATTERN:
  import { Prisma } from '@prisma/client'

  try {
    await prisma.user.create({ data: { email, clerkId } })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const fields = error.meta?.target as string[]
        if (fields?.includes('email')) {
          return { error: 'Email already registered' }
        }
        if (fields?.includes('clerkId')) {
          // Clerk ID conflict — user already synced
          return { error: 'User already exists' }
        }
        if (fields?.includes('referralCode')) {
          // Regenerate referral code and retry
          return await createUserWithNewCode(data)
        }
      }
    }
    throw error // Re-throw unknown errors
  }

PREVENTION:
  // Use upsert when the record might already exist:
  await prisma.user.upsert({
    where: { clerkId: userId },
    create: { clerkId: userId, email, name },
    update: { email, name }  // Update if exists
  })

  // Add client-side debounce to prevent double-submission:
  const [isSubmitting, setIsSubmitting] = useState(false)
  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try { await submitForm() }
    finally { setIsSubmitting(false) }
  }
```

### 7.2 P2025 — Record Not Found

```
Error: An operation failed because it depends on one or more records
that were required but not found. Record to update not found.

WHAT IT MEANS:
  You're trying to update, delete, or read a record that doesn't exist.
  OR a required relation doesn't have a matching record.

COMMON SCENARIOS:

  1. Updating a record that was already deleted
     prisma.user.update({ where: { id: 'deleted-user' }, data: { ... } })

  2. Deleting a record that doesn't exist
     prisma.bestie.delete({ where: { id: 'nonexistent' } })

  3. Required relation not found
     prisma.chat.create({
       data: {
         userId: 'nonexistent-user',  // Foreign key doesn't exist
         message: 'hello'
       }
     })

  4. connectOrCreate with wrong where clause
     prisma.user.update({
       where: { id: userId },
       data: {
         bestie: { connect: { id: 'wrong-bestie-id' } }  // Doesn't exist
       }
     })

DEBUGGING STEPS:
  1. Check: Does the record exist?
     SELECT * FROM "User" WHERE id = 'the-id';
  2. Check: Was it recently deleted? (check audit log)
  3. Check: Is the ID format correct? (UUID vs CUID vs integer)
  4. Check: Race condition? (deleted between check and update)
  5. Check: Is the where clause matching the right field?
     → where: { clerkId: userId } vs where: { id: clerkId }

HANDLING PATTERN:
  try {
    const result = await prisma.user.update({
      where: { id: userId },
      data: updateData
    })
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return { error: 'Record not found', status: 404 }
      }
    }
    throw error
  }

PREVENTION:
  // Check existence before mutating (when the check matters for UX):
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
  // Now safe to update
  await prisma.user.update({ where: { id: userId }, data: updateData })

  // Or use updateMany (returns count instead of throwing):
  const { count } = await prisma.user.updateMany({
    where: { id: userId },
    data: updateData
  })
  if (count === 0) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }
```

### 7.3 P2003 — Foreign Key Constraint Violation

```
Error: Foreign key constraint failed on the field: `userId`

WHAT IT MEANS:
  You're creating/updating a record with a foreign key that references
  a record that doesn't exist in the related table. OR you're trying
  to delete a record that other records depend on.

COMMON SCENARIOS:

  1. Creating a chat message for a nonexistent user
     prisma.message.create({
       data: { userId: 'nonexistent', content: 'hello' }
     })

  2. Deleting a user who has related records
     prisma.user.delete({ where: { id: userId } })
     // Fails if user has messages, besties, subscriptions, etc.

  3. Setting a foreign key to a wrong/stale ID
     prisma.bestie.update({
       where: { id: bestieId },
       data: { userId: 'old-user-id-that-was-deleted' }
     })

  4. Migration created FK but data doesn't satisfy it
     // Added a required userId column but existing rows have no user

DEBUGGING STEPS:
  1. Which field failed? → error.meta.field_name
  2. What value was used for that field?
  3. Does the referenced record exist?
     SELECT * FROM "User" WHERE id = 'the-referenced-id';
  4. For deletion: what records reference this one?
     SELECT * FROM "Message" WHERE "userId" = 'user-being-deleted';
  5. Check Prisma schema: is the relation correct?
     model Message {
       userId String
       user   User @relation(fields: [userId], references: [id])
     }

HANDLING PATTERN:
  try {
    await prisma.message.create({
      data: { userId, content }
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        const field = error.meta?.field_name as string
        return { error: `Referenced ${field} does not exist`, status: 400 }
      }
    }
    throw error
  }

DELETION PATTERN (cascade or manual cleanup):
  // Option 1: Cascade in schema
  model Message {
    userId String
    user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
  }

  // Option 2: Manual cleanup (more control)
  async function deleteUserWithCleanup(userId: string) {
    return prisma.$transaction([
      prisma.message.deleteMany({ where: { userId } }),
      prisma.bestie.deleteMany({ where: { userId } }),
      prisma.subscription.deleteMany({ where: { userId } }),
      prisma.user.delete({ where: { id: userId } })
    ])
  }
```

### 7.4 Other Common Prisma Errors

```
P2000 — Value too long for column
  → Check your schema's @db.VarChar(N) constraints
  → The input exceeds the column's max length
  → Fix: Validate input length before saving

P2001 — Record not found (in where condition)
  → Similar to P2025 but for nested queries
  → A nested .connect() or .update() couldn't find the target

P2004 — Constraint violation (generic)
  → Check constraint, not-null constraint, or other DB-level constraint
  → Check: Are you sending null for a required field?

P2006 — Invalid value for field type
  → Sending a string where an integer is expected, etc.
  → Check your Zod schema matches Prisma schema types

P2011 — Null constraint violation
  → Required field received null
  → Check: Is the field required in schema but optional in your code?
  → Check: Is a default value missing?

P2014 — Required relation violation
  → Creating a record without connecting a required relation
  → Check: Does your create include all required relation connects?

P2021 — Table does not exist
  → Schema is out of sync with database
  → Run: npx prisma db push (dev) or npx prisma migrate deploy (prod)

P2022 — Column does not exist
  → Same as P2021 — schema/DB mismatch
  → Run: npx prisma generate && npx prisma db push

P2024 — Connection pool timeout
  → Too many concurrent connections
  → Fix: Use connection pooling (PgBouncer/Neon pooler)
  → Fix: Reduce pool size in DATABASE_URL: ?connection_limit=5
  → Fix: Close connections properly (avoid prisma.$connect() without $disconnect())

P2034 — Transaction conflict (write conflict / deadlock)
  → Two transactions tried to modify the same record
  → Fix: Retry the transaction
  → Fix: Reduce transaction scope
  → Pattern:
     async function withRetry(fn, retries = 3) {
       for (let i = 0; i < retries; i++) {
         try { return await fn() }
         catch (e) {
           if (e.code === 'P2034' && i < retries - 1) continue
           throw e
         }
       }
     }
```

---

## 8. Clerk Authentication Debugging

### 8.1 Decision Tree

```
CLERK AUTH ISSUE
│
├─ User can't sign in
│  ├─ Check: Is NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY set?
│  │  └─ Missing → blank sign-in component or error
│  ├─ Check: Is CLERK_SECRET_KEY set?
│  │  └─ Missing → API calls fail, middleware crashes
│  ├─ Check: Are dev/prod keys matching the environment?
│  │  └─ Dev key in prod (or vice versa) → auth fails silently
│  ├─ Check: Is the Clerk instance active?
│  │  └─ Clerk dashboard → check instance status
│  └─ Check: Is the sign-in URL correct?
│     └─ NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in (must match your route)
│
├─ Auth works but user data missing
│  ├─ Check: Is the webhook syncing users to your DB?
│  │  ├─ Clerk Dashboard → Webhooks → check delivery status
│  │  ├─ Check webhook URL: https://stone-ai.net/api/webhooks/clerk
│  │  ├─ Check webhook secret: CLERK_WEBHOOK_SECRET matches?
│  │  └─ Check: Is the webhook handler creating the user record?
│  ├─ Check: Is the user's clerkId in your User table?
│  │  └─ SELECT * FROM "User" WHERE "clerkId" = 'user_xxx';
│  └─ Check: Race condition — page loads before webhook processed?
│     └─ Add a "syncing" state or retry logic
│
├─ Redirect loop
│  ├─ Check middleware.ts matcher:
│  │  export const config = {
│  │    matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)']
│  │  }
│  ├─ Check: Is middleware protecting the sign-in page itself?
│  │  └─ Sign-in/sign-up routes MUST be public
│  ├─ Check: publicRoutes vs authMiddleware configuration
│  │  └─ Clerk v5 uses clerkMiddleware() with createRouteMatcher()
│  └─ Debug: Add logging to middleware
│     console.log('Middleware:', req.nextUrl.pathname, 'Auth:', !!userId)
│
├─ Session lost / user signed out randomly
│  ├─ Check: Cookie domain matches your deployment domain?
│  ├─ Check: HTTPS in production? (cookies may require secure context)
│  ├─ Check: Cloudflare settings interfering with cookies?
│  │  └─ Cloudflare → Caching → Cache Rules → exclude auth paths
│  └─ Check: SameSite cookie policy?
│
└─ Clerk API calls failing in API routes
   ├─ Check: Are you importing from '@clerk/nextjs/server'?
   ├─ Check: auth() vs currentUser() — which do you need?
   │  auth() → lightweight, returns { userId }
   │  currentUser() → full user object, makes API call
   ├─ Check: Are you calling auth() in a Client Component?
   │  └─ Client Components must use useAuth() or useUser()
   └─ Pattern for API routes:
      import { auth } from '@clerk/nextjs/server'

      export async function GET() {
        const { userId } = await auth()
        if (!userId) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        // ... rest of handler
      }
```

### 8.2 Clerk + Middleware Debugging

```
MIDDLEWARE ISSUES WITH CLERK
│
├─ clerkMiddleware() not protecting routes
│  ├─ Check: Is middleware.ts in the project root (or src/ if using src)?
│  ├─ Check: Is the matcher config exported?
│  ├─ Check: Clerk v5 syntax:
│  │  import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
│  │
│  │  const isPublicRoute = createRouteMatcher([
│  │    '/sign-in(.*)',
│  │    '/sign-up(.*)',
│  │    '/api/webhooks(.*)',
│  │    '/',
│  │  ])
│  │
│  │  export default clerkMiddleware(async (auth, request) => {
│  │    if (!isPublicRoute(request)) {
│  │      await auth.protect()
│  │    }
│  │  })
│  │
│  └─ Check: Are API routes that should be public listed?
│     → Webhook endpoints MUST be public (Clerk/Stripe can't auth)
│
├─ afterAuth redirect issues
│  ├─ Check: Are you redirecting to a route that's also protected?
│  ├─ Check: Is the redirect URL absolute or relative?
│  │  └─ Use relative paths in middleware redirects
│  └─ Check: Infinite redirect loop?
│     → Add a counter or check the current path before redirecting
│
└─ Clerk dev vs prod behavior differences
   ├─ Dev mode: More lenient, allows HTTP, shows debug info
   ├─ Prod mode: Requires HTTPS, strict cookie policy
   ├─ Check: Are you using the production Clerk instance?
   └─ Check: DNS and SSL properly configured?
```

### 8.3 Clerk Webhook Debugging

```
WEBHOOK NOT SYNCING USERS
│
├─ Step 1: Check Clerk Dashboard → Webhooks
│  ├─ Is the webhook endpoint listed and active?
│  ├─ Check recent deliveries — are they succeeding (200) or failing?
│  ├─ If failing: what's the response body?
│  └─ If no deliveries: is the event type subscribed? (user.created, user.updated, user.deleted)
│
├─ Step 2: Check the webhook endpoint code
│  ├─ Is CLERK_WEBHOOK_SECRET / WEBHOOK_SECRET set?
│  ├─ Is the svix signature being verified?
│  │  import { Webhook } from 'svix'
│  │  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!)
│  │  const evt = wh.verify(body, headers) // Throws if invalid
│  ├─ Is the raw body being passed (not parsed JSON)?
│  │  // BROKEN: body is already parsed
│  │  const body = await request.json()
│  │  wh.verify(JSON.stringify(body), headers) // Might fail
│  │  // FIXED: use raw body
│  │  const body = await request.text()
│  │  const evt = wh.verify(body, svixHeaders)
│  └─ Are the right headers being extracted?
│     const svixHeaders = {
│       'svix-id': request.headers.get('svix-id'),
│       'svix-timestamp': request.headers.get('svix-timestamp'),
│       'svix-signature': request.headers.get('svix-signature'),
│     }
│
├─ Step 3: Test locally
│  ├─ Use ngrok or Clerk's local tunnel
│  ├─ Update webhook URL to your tunnel URL
│  ├─ Create a test user in Clerk
│  ├─ Watch your server logs for the webhook payload
│  └─ Verify the user record is created in your DB
│
└─ Step 4: Common gotchas
   ├─ Webhook URL must be HTTPS in production
   ├─ Webhook route must be public (not behind auth middleware)
   ├─ Response must be 200 within 30 seconds or Clerk retries
   └─ Clerk retries failed webhooks with exponential backoff
```

---

## 9. Stripe Integration Debugging

### 9.1 Decision Tree

```
STRIPE ISSUE
│
├─ Checkout won't start
│  ├─ Check: Is STRIPE_SECRET_KEY set? (server-side)
│  ├─ Check: Is NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY set? (client-side)
│  ├─ Check: Test mode vs live mode keys?
│  │  └─ Test keys start with sk_test_ / pk_test_
│  │  └─ Live keys start with sk_live_ / pk_live_
│  ├─ Check: Is the price ID valid?
│  │  └─ stripe.prices.retrieve(priceId) — does it exist?
│  ├─ Check: Is the success/cancel URL correct?
│  │  └─ Must be absolute URL in production
│  │  └─ Must match your domain
│  └─ Check the error message:
│     try {
│       const session = await stripe.checkout.sessions.create({ ... })
│     } catch (error) {
│       console.error('Stripe checkout error:', error.message)
│       // error.type: 'StripeCardError', 'StripeInvalidRequestError', etc.
│     }
│
├─ Webhook not processing
│  ├─ Check: STRIPE_WEBHOOK_SECRET set?
│  │  └─ Starts with whsec_
│  ├─ Check: Webhook endpoint registered in Stripe Dashboard?
│  │  └─ Stripe Dashboard → Developers → Webhooks
│  ├─ Check: Event types subscribed?
│  │  └─ Must include: checkout.session.completed,
│  │     customer.subscription.created, customer.subscription.updated,
│  │     customer.subscription.deleted, invoice.payment_succeeded,
│  │     invoice.payment_failed
│  ├─ Check: Signature verification working?
│  │  const sig = request.headers.get('stripe-signature')
│  │  const body = await request.text()  // MUST be raw body
│  │  const event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
│  ├─ Check: Is the route public? (not behind auth middleware)
│  └─ Check: Recent webhook delivery attempts in Stripe Dashboard
│     → Shows request/response for each attempt
│
├─ Subscription status wrong
│  ├─ Check: What does Stripe say?
│  │  → Stripe Dashboard → Customers → find the customer → subscriptions
│  ├─ Check: What does your DB say?
│  │  → SELECT * FROM "Subscription" WHERE "userId" = 'xxx';
│  ├─ Common cause: Webhook didn't process → DB out of sync
│  ├─ Common cause: Webhook processed but mapped to wrong user
│  │  → Check: metadata.userId in the checkout session creation
│  └─ Fix: Manually sync from Stripe to your DB:
│     const sub = await stripe.subscriptions.retrieve(stripeSubId)
│     await prisma.subscription.update({
│       where: { stripeSubscriptionId: sub.id },
│       data: { status: sub.status, ... }
│     })
│
├─ Customer portal issues
│  ├─ Check: Is the portal configured?
│  │  → Stripe Dashboard → Settings → Customer portal
│  ├─ Check: Is the customer ID correct?
│  │  → Are you passing the Stripe customer ID (cus_xxx), not your user ID?
│  └─ Check: Return URL correct and absolute?
│
└─ Test mode vs live mode confusion
   ├─ Test mode: All keys have _test_. Use card 4242424242424242
   ├─ Live mode: All keys have _live_. Real charges.
   ├─ NEVER mix test and live keys — Stripe will reject requests
   ├─ Webhooks are environment-specific (separate endpoints for test/live)
   └─ Check: stripe.customers.list() — if you see test data, you're in test mode
```

### 9.2 Stripe Webhook Debugging Protocol

```
WEBHOOK VERIFICATION FAILING
│
├─ Error: "No signatures found matching the expected signature"
│  ├─ Cause 1: Wrong webhook secret
│  │  → Different secret for CLI (whsec_xxx) vs Dashboard (whsec_yyy)
│  │  → Local dev uses: stripe listen --forward-to localhost:3000/api/webhooks/stripe
│  │  → Production uses: Dashboard webhook endpoint secret
│  ├─ Cause 2: Body was parsed before verification
│  │  // BROKEN:
│  │  export async function POST(req) {
│  │    const body = await req.json()  // PARSED — signature won't match
│  │    stripe.webhooks.constructEvent(JSON.stringify(body), sig, secret)
│  │  }
│  │  // FIXED:
│  │  export async function POST(req) {
│  │    const body = await req.text()  // RAW — signature matches
│  │    stripe.webhooks.constructEvent(body, sig, secret)
│  │  }
│  └─ Cause 3: Middleware or proxy modified the request body
│     → Ensure no middleware transforms the body before the webhook route
│
├─ Error: "Webhook signature verification failed: timestamp outside tolerance"
│  └─ Clock skew between your server and Stripe
│  └─ Usually happens in dev with slow tunnels
│  └─ Fix: Pass { tolerance: 600 } (10 minutes) in dev only
│
└─ Local development testing:
   # Install Stripe CLI
   stripe login
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   # Copy the webhook signing secret (whsec_...) to .env.local
   # In another terminal, trigger test events:
   stripe trigger checkout.session.completed
```

### 9.3 Common Stripe Error Codes

```
card_declined           → Test: Use 4000000000000002
authentication_required → 3D Secure needed. Test: 4000002500003155
insufficient_funds      → Test: Use 4000000000009995
expired_card            → Test: Use 4000000000000069
processing_error        → Temporary Stripe issue. Retry.
rate_limit              → Too many API calls. Add retry with backoff.

resource_missing        → The ID doesn't exist (wrong environment?)
parameter_missing       → Required param not sent
parameter_invalid       → Wrong type or format

api_connection_error    → Network issue reaching Stripe
api_error               → Stripe internal error. Retry.
idempotency_error       → Same idempotency key with different params
```

---

## 10. React Query Debugging

### 10.1 Decision Tree

```
REACT QUERY ISSUE
│
├─ Data not loading
│  ├─ Check: Is QueryClientProvider wrapping the component tree?
│  │  └─ Must be in layout.tsx or a top-level provider
│  ├─ Check: Is the query key correct?
│  │  └─ useQuery({ queryKey: ['users', userId], ... })
│  │  └─ Key must be serializable and unique per data set
│  ├─ Check: Is the queryFn actually making the request?
│  │  └─ Add console.log inside queryFn
│  │  └─ Check Network tab — is the request being made?
│  ├─ Check: Is the query enabled?
│  │  └─ enabled: false will prevent the query from running
│  │  └─ enabled: !!userId — if userId is undefined, query won't run
│  └─ Check: Is the query erroring silently?
│     const { data, error, isError } = useQuery(...)
│     if (isError) console.error(error)
│
├─ Stale data / not refetching
│  ├─ Check: staleTime setting
│  │  └─ staleTime: Infinity means data NEVER goes stale
│  │  └─ staleTime: 0 (default) means data is immediately stale
│  ├─ Check: refetchOnWindowFocus
│  │  └─ Default is true — data refetches when you tab back
│  │  └─ Set to false if you don't want this
│  ├─ Check: Is the query key changing when it should?
│  │  └─ If key doesn't change, React Query serves cached data
│  │  └─ Include all variables that affect the data in the key:
│  │     queryKey: ['messages', chatId, page] // All three matter
│  ├─ Manual invalidation:
│  │  const queryClient = useQueryClient()
│  │  queryClient.invalidateQueries({ queryKey: ['users'] })
│  │  // This marks queries as stale and triggers refetch
│  └─ After mutation, invalidate related queries:
│     const mutation = useMutation({
│       mutationFn: updateUser,
│       onSuccess: () => {
│         queryClient.invalidateQueries({ queryKey: ['users'] })
│       }
│     })
│
├─ Too many requests / refetch storm
│  ├─ Check: Are query keys too granular?
│  │  └─ Every unique key = separate cache entry = separate request
│  ├─ Check: Is a component re-rendering and re-creating the queryFn?
│  │  └─ Unstable queryFn reference causes refetch
│  │  └─ Fix: Define queryFn outside the component or use useCallback
│  ├─ Check: staleTime too low?
│  │  └─ Increase staleTime to reduce refetches:
│  │     staleTime: 5 * 60 * 1000 // 5 minutes
│  ├─ Check: refetchInterval set?
│  │  └─ refetchInterval: 1000 = request every second
│  └─ Check: Multiple components using same query key?
│     └─ This is FINE — React Query deduplicates automatically
│     └─ But if keys differ slightly, no deduplication happens
│
├─ Mutation not working
│  ├─ Check: Is mutationFn correct?
│  │  const mutation = useMutation({
│  │    mutationFn: async (data) => {
│  │      const res = await fetch('/api/users', {
│  │        method: 'POST',
│  │        headers: { 'Content-Type': 'application/json' },
│  │        body: JSON.stringify(data)
│  │      })
│  │      if (!res.ok) throw new Error('Failed')
│  │      return res.json()
│  │    }
│  │  })
│  ├─ Check: Is mutation.mutate() being called?
│  │  └─ mutation.mutate(data) — NOT mutation.mutate — it needs args
│  ├─ Check: Is the error being swallowed?
│  │  onError: (error) => console.error('Mutation failed:', error)
│  └─ Check: Is the UI updating after mutation?
│     └─ Must invalidate queries OR use optimistic updates
│
└─ DevTools debugging
   ├─ Install @tanstack/react-query-devtools
   ├─ import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
   ├─ Add <ReactQueryDevtools initialIsOpen={false} /> to your layout
   └─ In dev: Shows all queries, their state, cache, and timing
```

### 10.2 React Query + Next.js Server Components

```
COMBINING REACT QUERY WITH SERVER COMPONENTS

PROBLEM: Server Components can't use hooks (useQuery is a hook)

PATTERN 1 — Server Component fetches, Client Component displays:
  // Server Component (page.tsx)
  export default async function Page() {
    const users = await prisma.user.findMany()
    return <UserList initialData={users} />
  }

  // Client Component (UserList.tsx)
  'use client'
  export function UserList({ initialData }) {
    const { data: users } = useQuery({
      queryKey: ['users'],
      queryFn: () => fetch('/api/users').then(r => r.json()),
      initialData,  // Use server data as initial, then React Query manages
    })
    return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>
  }

PATTERN 2 — Prefetch with HydrationBoundary (recommended):
  // Server Component
  import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query'

  export default async function Page() {
    const queryClient = new QueryClient()
    await queryClient.prefetchQuery({
      queryKey: ['users'],
      queryFn: () => prisma.user.findMany(),
    })
    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <UserList />
      </HydrationBoundary>
    )
  }

  // Client Component — uses the prefetched data automatically
  'use client'
  export function UserList() {
    const { data: users } = useQuery({
      queryKey: ['users'],
      queryFn: () => fetch('/api/users').then(r => r.json()),
    })
    return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>
  }
```

---

## 11. vLLM / AI Provider Debugging

### 11.1 Decision Tree

```
AI/LLM ISSUE
│
├─ vLLM not responding
│  ├─ Check: Is the vLLM server running?
│  │  → curl http://OMEN_IP:8000/v1/models
│  │  → Should return list of loaded models
│  ├─ Check: Is VLLM_BASE_URL correct?
│  │  → Must be reachable from wherever the code runs
│  │  → Local dev: direct IP. Vercel: must be publicly accessible or tunneled
│  ├─ Check: Is the model loaded?
│  │  → vLLM logs: "Loading model..." → "Model loaded"
│  │  → If OOM: model too large for GPU VRAM
│  ├─ Check: GPU available?
│  │  → nvidia-smi (on the OMEN host)
│  │  → Is another process using the GPU?
│  └─ Check: Network connectivity
│     → Firewall rules allowing the port?
│     → Correct network interface (0.0.0.0 vs 127.0.0.1)?
│
├─ vLLM slow or timing out
│  ├─ Check: Model quantization
│  │  → AWQ/GPTQ quantized models are faster
│  │  → Qwen 2.5 32B AWQ should fit in VRAM
│  ├─ Check: Concurrent requests?
│  │  → vLLM handles concurrency but has limits
│  │  → max_num_seqs setting in vLLM startup
│  ├─ Check: Input too long?
│  │  → Token limit exceeded → slow or error
│  │  → Trim conversation history
│  ├─ Check: Streaming vs non-streaming
│  │  → Non-streaming waits for full response (slow for long outputs)
│  │  → Use streaming for chat responses
│  └─ Fix: Add timeout and fallback
│     try {
│       const response = await fetch(vllmUrl, {
│         signal: AbortSignal.timeout(30000), // 30s timeout
│         ...options
│       })
│     } catch (error) {
│       if (error.name === 'TimeoutError') {
│         // Fall back to Anthropic
│         return await callAnthropic(prompt)
│       }
│     }
│
├─ Anthropic API errors
│  ├─ 401 Unauthorized
│  │  → ANTHROPIC_API_KEY wrong or missing
│  │  → Check: Is it set in Vercel environment variables?
│  ├─ 429 Rate Limited
│  │  → Too many requests or tokens per minute
│  │  → Implement exponential backoff
│  │  → Check your plan's rate limits
│  ├─ 500/503 Server Error
│  │  → Anthropic temporary issue. Retry with backoff.
│  ├─ 400 Bad Request
│  │  → Check: Model name correct? (claude-sonnet-4-20250514, etc.)
│  │  → Check: Message format correct?
│  │  → Check: Max tokens within limits?
│  └─ overloaded_error
│     → Anthropic at capacity. Retry after delay.
│     → Consider falling back to Haiku
│
├─ AI response quality issues
│  ├─ Incoherent responses
│  │  → Check: temperature setting (lower = more focused)
│  │  → Check: system prompt being sent?
│  │  → Check: conversation history too long? (model loses context)
│  ├─ Response cut off
│  │  → Check: max_tokens setting
│  │  → Increase max_tokens or implement continuation
│  ├─ Wrong persona/style
│  │  → Check: system prompt content
│  │  → Check: Is the right agent configuration being loaded?
│  └─ Repetitive responses
│     → Increase temperature slightly (0.7-0.9)
│     → Add presence_penalty/frequency_penalty
│     → Check: Is conversation history duplicated?
│
└─ Fallback chain debugging
   ├─ Expected chain: vLLM (local) → Anthropic Sonnet (cloud) → Haiku (Vercel)
   ├─ Check: Is fallback logic implemented correctly?
   ├─ Check: Each provider's availability independently
   ├─ Check: Error types triggering fallback (timeout vs 500 vs auth error)
   └─ Logging: Add logs at each fallback step
      console.log('[AI] Trying vLLM...')
      console.log('[AI] vLLM failed, trying Anthropic Sonnet...')
      console.log('[AI] Sonnet failed, trying Haiku fallback...')
```

### 11.2 Streaming Response Debugging

```
STREAMING NOT WORKING
│
├─ Check: Is the API route returning a ReadableStream?
│  return new Response(stream, {
│    headers: {
│      'Content-Type': 'text/event-stream',
│      'Cache-Control': 'no-cache',
│      'Connection': 'keep-alive',
│    }
│  })
│
├─ Check: Is the client consuming the stream correctly?
│  const response = await fetch('/api/chat', { method: 'POST', body })
│  const reader = response.body?.getReader()
│  const decoder = new TextDecoder()
│  while (true) {
│    const { done, value } = await reader.read()
│    if (done) break
│    const text = decoder.decode(value)
│    // Process SSE chunks
│  }
│
├─ Check: Is Vercel/Cloudflare buffering the response?
│  → Cloudflare may buffer streaming responses
│  → Add: 'X-Accel-Buffering': 'no' header
│  → Vercel Edge Runtime handles streaming better than Serverless
│
├─ Check: Is the SSE format correct?
│  → Each chunk must be: data: {json}\n\n
│  → Final chunk: data: [DONE]\n\n
│  → No extra whitespace or missing newlines
│
└─ Check: Is the stream closing properly?
   → Stream must be closed when done
   → Unclosed streams = memory leak and hung connections
   → Always close in finally block:
     const stream = new ReadableStream({
       async start(controller) {
         try {
           for await (const chunk of aiStream) {
             controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`))
           }
           controller.enqueue(encoder.encode('data: [DONE]\n\n'))
         } finally {
           controller.close()
         }
       }
     })
```

---

## 12. Production Debugging Playbook

### 12.1 Incident Response Protocol

```
PRODUCTION INCIDENT DETECTED
│
├─ MINUTE 0-2: ASSESS
│  ├─ What is broken? (specific feature/page/API)
│  ├─ How many users affected? (all / subset / one)
│  ├─ When did it start? (deployment? time-based? data-based?)
│  ├─ Is it getting worse? (spreading to other features?)
│  └─ What's the revenue impact? (billing affected? signups blocked?)
│
├─ MINUTE 2-5: STABILIZE
│  ├─ Can we roll back the last deployment?
│  │  → Vercel: Instant Rollback in dashboard
│  │  → Or: git revert HEAD && git push
│  ├─ Can we disable the broken feature without downtime?
│  │  → Feature flag / environment variable toggle
│  ├─ Can we redirect traffic away from the broken path?
│  │  → Cloudflare Page Rules / redirect rules
│  └─ Communicate: Is the issue visible enough to need a status update?
│
├─ MINUTE 5-15: DIAGNOSE
│  ├─ Run "What Changed?" protocol (Section 2)
│  ├─ Check Vercel Runtime Logs
│  ├─ Check Neon database dashboard (connection count, query latency)
│  ├─ Check Clerk dashboard (auth issues?)
│  ├─ Check Stripe dashboard (webhook failures?)
│  └─ Check Cloudflare analytics (traffic spike? attack?)
│
├─ MINUTE 15-30: FIX
│  ├─ Implement the minimal fix
│  ├─ Test locally if possible
│  ├─ Deploy to preview branch first (Vercel)
│  ├─ Verify the fix on preview
│  └─ Deploy to production
│
└─ AFTER RESOLUTION: POSTMORTEM
   ├─ What broke?
   ├─ Why did it break?
   ├─ How did we detect it? (monitoring? user report?)
   ├─ How long was it broken?
   ├─ What prevented faster detection?
   ├─ What prevents this class of bug in the future?
   └─ Action items with owners and deadlines
```

### 12.2 Vercel-Specific Debugging

```
VERCEL DEPLOYMENT ISSUES
│
├─ Build fails
│  ├─ Check: Build logs in Vercel dashboard
│  ├─ Common: TypeScript errors that don't appear in dev
│  │  → Dev uses --noEmit (lenient). Build uses strict checking.
│  │  → Fix: Run 'npx tsc --noEmit' locally before pushing
│  ├─ Common: Missing environment variables at build time
│  │  → NEXT_PUBLIC_* vars must be set at BUILD time
│  │  → Server-only vars can be runtime-only
│  ├─ Common: Package installation fails
│  │  → Check package-lock.json is committed
│  │  → Check for platform-specific packages (e.g., better-sqlite3)
│  └─ Common: Out of memory during build
│     → Increase build memory: NEXT_BUILD_MEMORY=4096
│
├─ Works locally, fails on Vercel
│  ├─ Environment: All vars set in Vercel dashboard?
│  ├─ Runtime: Serverless vs Edge — different API availability
│  ├─ Network: Can the function reach external services?
│  │  → vLLM on local network not reachable from Vercel
│  ├─ Timeout: Vercel functions have time limits
│  │  → Hobby: 10s, Pro: 60s
│  ├─ Size: Function too large (>50MB compressed)
│  │  → Check: Are you importing large packages?
│  └─ Region: Is the function deployed near the database?
│     → Vercel → Settings → Functions → Region
│     → Should match Neon database region
│
├─ Intermittent 500s in production
│  ├─ Cold start issues:
│  │  → First request after idle may be slow
│  │  → Prisma client initialization on cold start
│  │  → Fix: Keep Prisma client in global scope
│  │     import { PrismaClient } from '@prisma/client'
│  │     const globalForPrisma = global as unknown as { prisma: PrismaClient }
│  │     export const prisma = globalForPrisma.prisma || new PrismaClient()
│  │     if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
│  ├─ Connection pool exhaustion:
│  │  → Too many concurrent serverless functions
│  │  → Each opens its own connection
│  │  → Fix: Use Neon's connection pooler URL
│  │  → Fix: Set connection_limit=1 in serverless
│  └─ Memory limits:
│     → Serverless functions have limited memory
│     → Processing large payloads/images may OOM
│     → Fix: Stream large data, process in chunks
│
└─ Domain/DNS issues
   ├─ Check: Vercel → Domains → is the domain verified?
   ├─ Check: Cloudflare DNS records correct?
   │  → A record or CNAME pointing to Vercel
   │  → Proxy status: ON (orange cloud) for Cloudflare features
   ├─ Check: SSL certificate valid?
   │  → Cloudflare SSL mode: Full (not Flexible)
   │  → Vercel auto-provisions SSL — but Cloudflare can interfere
   ├─ Check: www vs non-www redirect working?
   └─ Check: Purge Cloudflare cache after DNS changes
```

### 12.3 Database Production Debugging

```
DATABASE ISSUES IN PRODUCTION
│
├─ Connection failures
│  ├─ Check: Neon project status (active / suspended)
│  │  → Free tier suspends after 5min inactivity
│  │  → First connection may take 2-5s to wake
│  ├─ Check: Connection string correct?
│  │  → Pooler URL (port 5432) vs direct URL (port 5432)
│  │  → Neon pooler: use connection pooling URL for serverless
│  ├─ Check: Connection limit reached?
│  │  → Neon free: 100 connections
│  │  → Each serverless function = 1 connection
│  │  → Fix: connection_limit=1 in URL params
│  └─ Check: SSL required?
│     → Neon requires SSL: sslmode=require in URL
│
├─ Slow queries
│  ├─ Identify: Which query is slow?
│  │  → Prisma logging:
│  │    new PrismaClient({ log: ['query', 'info', 'warn', 'error'] })
│  │  → Neon dashboard → Query stats
│  ├─ Common causes:
│  │  → Missing index on filtered/joined column
│  │  → N+1 queries (loading relations in a loop)
│  │  → Full table scan on large table
│  │  → Complex joins without proper indexing
│  ├─ Fix N+1:
│  │  // BROKEN: N+1
│  │  const users = await prisma.user.findMany()
│  │  for (const user of users) {
│  │    const sub = await prisma.subscription.findFirst({ where: { userId: user.id } })
│  │  }
│  │  // FIXED: include
│  │  const users = await prisma.user.findMany({
│  │    include: { subscription: true }
│  │  })
│  └─ Add index:
│     // In Prisma schema:
│     model Message {
│       userId  String
│       chatId  String
│       @@index([userId])
│       @@index([chatId, createdAt])
│     }
│
├─ Data integrity issues
│  ├─ Check: Are transactions used for multi-step operations?
│  │  await prisma.$transaction([
│  │    prisma.subscription.update(...),
│  │    prisma.user.update(...)
│  │  ])
│  ├─ Check: Race conditions on concurrent writes?
│  │  → Use optimistic concurrency:
│  │    await prisma.user.update({
│  │      where: { id: userId, version: currentVersion },
│  │      data: { ..., version: { increment: 1 } }
│  │    })
│  └─ Check: Orphaned records?
│     → Records whose foreign key references don't exist
│     → Run: SELECT * FROM "Message" WHERE "userId" NOT IN (SELECT id FROM "User")
│
└─ Migration issues
   ├─ Migration fails in production
   │  → Check: Does the migration require data transformation?
   │  → Check: Adding NOT NULL column without default to non-empty table?
   │  → Fix: Add with default, backfill, then optionally remove default
   ├─ Schema drift
   │  → prisma db pull → compare with schema.prisma
   │  → prisma migrate diff → see what's different
   └─ Rollback plan
      → Always have a rollback migration ready
      → Test migrations on a Neon branch first
      → Branch the database, test, merge or discard
```

---

## 13. Cross-Cutting Patterns

### 13.1 The Debug Logging Pattern

Add structured logging at every boundary. When an issue occurs, you can trace exactly what happened.

```typescript
// Standard log format for all API routes
function logRequest(routeName: string, context: Record<string, any>) {
  console.log(JSON.stringify({
    route: routeName,
    timestamp: new Date().toISOString(),
    ...context
  }))
}

// Usage in API route:
export async function POST(request: Request) {
  const startTime = Date.now()

  logRequest('POST /api/chat', { phase: 'start' })

  try {
    const { userId } = await auth()
    logRequest('POST /api/chat', { phase: 'auth', userId })

    const body = await request.json()
    logRequest('POST /api/chat', { phase: 'parse', messageLength: body.message?.length })

    const result = await processChat(body)
    logRequest('POST /api/chat', {
      phase: 'complete',
      duration: Date.now() - startTime,
      success: true
    })

    return NextResponse.json(result)
  } catch (error) {
    logRequest('POST /api/chat', {
      phase: 'error',
      duration: Date.now() - startTime,
      error: error.message,
      stack: error.stack
    })
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### 13.2 The Error Boundary Pattern

Never let one component crash the entire page.

```tsx
// Generic error boundary for any section
'use client'

import { Component, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 rounded border border-red-200">
          <p className="text-red-800">Something went wrong.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-2 text-sm text-red-600 underline"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

// Usage:
<ErrorBoundary fallback={<p>Chat failed to load</p>}>
  <ChatWidget />
</ErrorBoundary>
```

### 13.3 The Retry Pattern

For transient failures (network, rate limits, cold starts).

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    baseDelay?: number
    maxDelay?: number
    retryOn?: (error: any) => boolean
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    retryOn = () => true
  } = options

  let lastError: any

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt === maxRetries || !retryOn(error)) {
        throw error
      }

      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) + Math.random() * 1000,
        maxDelay
      )

      console.log(`[Retry] Attempt ${attempt + 1}/${maxRetries}, waiting ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// Usage:
const data = await withRetry(
  () => fetch('/api/data').then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    return r.json()
  }),
  {
    maxRetries: 3,
    retryOn: (error) => {
      // Only retry on transient errors
      const msg = error.message || ''
      return msg.includes('HTTP 500') ||
             msg.includes('HTTP 503') ||
             msg.includes('HTTP 429') ||
             msg.includes('fetch failed')
    }
  }
)
```

### 13.4 The Defensive Data Access Pattern

Never trust data from external sources.

```typescript
// Layer 1: Zod validation at the API boundary
import { z } from 'zod'

const CreateMessageSchema = z.object({
  chatId: z.string().uuid(),
  content: z.string().min(1).max(10000),
  agentId: z.number().int().min(1).max(44),
}).strict() // Reject unknown fields

export async function POST(request: Request) {
  const body = await request.json()
  const result = CreateMessageSchema.safeParse(body)

  if (!result.success) {
    return NextResponse.json({
      error: 'Validation failed',
      details: result.error.issues
    }, { status: 400 })
  }

  // result.data is now typed and validated
  const { chatId, content, agentId } = result.data
  // ...
}

// Layer 2: Null checks after database queries
const user = await prisma.user.findUnique({
  where: { clerkId: userId },
  include: { subscription: true }
})

if (!user) {
  return NextResponse.json({ error: 'User not found' }, { status: 404 })
}

// user is now narrowed to non-null
const tier = user.subscription?.tier ?? 'FREE'

// Layer 3: Safe access for nested optional data
const bestieConfig = user.bestie?.config
const communicationStyle = bestieConfig
  ? JSON.parse(bestieConfig).communicationStyle ?? 'friendly'
  : 'friendly'

// Layer 4: Type narrowing for discriminated unions
type ApiResponse =
  | { success: true; data: User }
  | { success: false; error: string }

function handleResponse(response: ApiResponse) {
  if (response.success) {
    // TypeScript knows response.data exists here
    console.log(response.data.name)
  } else {
    // TypeScript knows response.error exists here
    console.error(response.error)
  }
}
```

### 13.5 Environment-Specific Bug Checklist

When a bug appears in one environment but not another:

```
LOCAL ONLY (works on Vercel, fails locally):
  [ ] Missing .env.local variable
  [ ] Database URL pointing to wrong branch/project
  [ ] Port conflict with another service
  [ ] Hot module reload causing stale state
  [ ] Node.js version mismatch
  [ ] Package not installed (node_modules stale)
  Fix: rm -rf node_modules .next && npm install && npm run dev

VERCEL ONLY (works locally, fails on Vercel):
  [ ] Missing environment variable in Vercel dashboard
  [ ] NEXT_PUBLIC_* var not set at BUILD time
  [ ] Serverless function timeout (10s hobby / 60s pro)
  [ ] Function size limit exceeded
  [ ] Edge Runtime API not available (Node.js-only API used)
  [ ] vLLM unreachable from Vercel (local network only)
  [ ] Database cold start (Neon wake-up delay)
  [ ] Region mismatch (function in US, DB in EU)
  Fix: Check Vercel logs, add console.error in catch blocks

INTERMITTENT (sometimes works, sometimes doesn't):
  [ ] Race condition
  [ ] Connection pool exhaustion
  [ ] Rate limiting (Clerk, Stripe, Anthropic)
  [ ] Cold start timing
  [ ] Token/session expiry
  [ ] Concurrent deployment (old and new code running simultaneously)
  [ ] DNS propagation (Cloudflare cache)
  Fix: Add logging, check timing patterns, add retry logic

BROWSER-SPECIFIC:
  [ ] Safari vs Chrome behavior difference
  [ ] Mobile vs desktop viewport
  [ ] Browser extension interference
  [ ] Cookie policy differences (SameSite, Secure)
  [ ] Web API availability (e.g., crypto.subtle)
  Fix: Test in multiple browsers, check Can I Use for APIs
```

### 13.6 Quick Reference: Debug Commands

```bash
# === Local Development ===
# Clear everything and start fresh
rm -rf .next node_modules && npm install && npm run dev

# Check TypeScript errors (same as build check)
npx tsc --noEmit

# Check for lint issues
npx next lint

# Reset Prisma client
npx prisma generate

# Push schema to database (dev only)
npx prisma db push

# Open Prisma Studio (visual DB browser)
npx prisma studio

# Check database connectivity
npx prisma db pull

# === Git Debugging ===
# Find which commit broke something
git bisect start && git bisect bad && git bisect good <sha>

# See what changed in a file
git log -p --follow -- path/to/file.ts

# Find who changed a line
git blame path/to/file.ts

# === Network Debugging ===
# Test API route directly
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test"}' \
  -v

# Check if vLLM is responding
curl http://OMEN_IP:8000/v1/models

# Check if Neon is accessible
curl "postgresql://user:pass@host/db?sslmode=require" 2>&1

# === Vercel Debugging ===
# View recent logs
vercel logs --follow

# List deployments
vercel ls

# Check environment variables
vercel env ls

# Pull production env to local
vercel env pull .env.local

# === Docker Debugging ===
# Check running containers
docker ps

# View container logs
docker logs stoneai-db --tail 100

# Check database is accessible
docker exec stoneai-db pg_isready

# Connect to database
docker exec -it stoneai-db psql -U postgres -d stoneai
```

### 13.7 The Debugging Mindset

```
RULE 1: Read the error message. The WHOLE error message.
  - Most errors tell you exactly what's wrong
  - Copy the exact error text, search it
  - Look at the stack trace — which file, which line

RULE 2: Reproduce before you fix.
  - If you can't reproduce it, you can't verify the fix
  - Document exact reproduction steps
  - Automate the reproduction if possible (test case)

RULE 3: Change one thing at a time.
  - If you change 3 things and it works, you don't know which one fixed it
  - The other 2 changes might introduce new bugs
  - Be scientific: hypothesis → single change → test → confirm

RULE 4: Don't guess. Measure.
  - console.log > intuition
  - Network tab > assumptions about what's being sent
  - Database query > assumptions about what's stored
  - git diff > assumptions about what changed

RULE 5: Rubber duck it.
  - Explain the problem out loud (or in writing)
  - What do you expect to happen?
  - What actually happens?
  - What's the difference?
  - The answer often becomes obvious during the explanation

RULE 6: Fresh eyes.
  - Stuck for 30 minutes? Walk away for 5.
  - Stuck for 2 hours? Ask someone else to look.
  - The bug is never where you think it is after 2 hours of staring.

RULE 7: Check assumptions.
  - "This value is definitely X" — verify it with a log
  - "This function definitely runs" — verify with a log
  - "This API definitely returns Y" — verify with Network tab
  - Most bugs live in the gap between what you think is true and what IS true

RULE 8: Work from the error backward.
  - Start at the crash point
  - Trace backward: what called this? What passed this value?
  - Keep going until you find where reality diverged from expectation

RULE 9: When everything looks right, check the invisible.
  - Environment variables (case-sensitive, trailing whitespace)
  - File encoding (UTF-8 BOM, line endings)
  - Cache (browser, CDN, build cache, module cache)
  - Timing (race conditions, event ordering)
  - Scope (closures capturing stale values)

RULE 10: Document what you find.
  - Write down the root cause
  - Write down the fix
  - Write down how to prevent it
  - Future you will thank present you
```

---

## Appendix A: Error Message → Decision Tree Quick Map

| Error Message Contains | Go To |
|---|---|
| "Cannot read properties of undefined" | Section 4.2 |
| "Hydration failed" | Section 6 |
| "Text content does not match" | Section 6.2, 6.3 |
| "Unique constraint failed" / P2002 | Section 7.1 |
| "Record to update not found" / P2025 | Section 7.2 |
| "Foreign key constraint failed" / P2003 | Section 7.3 |
| "NEXT_REDIRECT" | Section 5.3 |
| "clerk" or "auth" error | Section 8 |
| "stripe" or "webhook" error | Section 9 |
| "ChunkLoadError" | Section 4.2 |
| "Minified React error" | Section 4.2 |
| "Connection pool timeout" / P2024 | Section 7.4 |
| "CORS" or "Access-Control" | Section 4.3 |
| "504 Gateway Timeout" | Section 5.2 (timeout) |
| "net::ERR_" | Section 4.3 |
| "PrismaClientInitializationError" | Section 5.2 |
| "rate limit" or 429 | Section 11.1 |
| "overloaded_error" | Section 11.1 |

## Appendix B: Stone AI Specific Debug Paths

```
AGENT NOT RESPONDING:
  1. Which agent? (number, tier)
  2. Is vLLM running? (local agents)
  3. Is Anthropic API key set? (cloud agents)
  4. Is the agent config loaded? (check DB)
  5. Is the user's tier sufficient for this agent?
  6. Check rate limiting — has the user exceeded their limit?

BESTIE NOT WORKING:
  1. Does the user have a bestie record in DB?
  2. Is the bestie config valid JSON?
  3. Is the user's tier eligible for bestie?
  4. Check: personality traits loaded?
  5. Check: communication style applied?

BILLING/SUBSCRIPTION MISMATCH:
  1. Check Stripe Dashboard — what's the actual subscription status?
  2. Check DB — what does our Subscription record say?
  3. Compare: If different, webhook probably failed
  4. Check Stripe webhook logs for failures
  5. Manual sync: Update DB from Stripe data
  6. Verify: User sees correct tier in the app

FORUM NOT LOADING:
  1. Check: API route returning data?
  2. Check: User authorized to see forum?
  3. Check: Database has forum records?
  4. Check: Pagination working? (empty first page?)

REFERRAL CODE NOT WORKING:
  1. Check: Code exists in DB? (@@unique on referralCode)
  2. Check: Code not already claimed?
  3. Check: Referrer and referee are different users?
  4. Check: Referral program active for user's tier?

BACKDROP NOT DISPLAYING:
  1. Check: Image URL accessible?
  2. Check: CORS headers on image host?
  3. Check: Image format supported?
  4. Check: User's tier has access to this backdrop?
  5. Check: Premium backdrop and user not premium?
```

---

*This document is a living reference. When you encounter a new error pattern that isn't covered here, add it to the appropriate section with the exact error message, root cause, and fix.*
