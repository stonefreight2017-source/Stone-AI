# R-5: Golden Reasoning — Constraint Propagation
# Systematic constraint tracking for multi-constraint problems
# Palace USB Package — Golden Seed

---

## PURPOSE
Many problems involve satisfying multiple constraints simultaneously. LLMs frequently
solve for one constraint while violating another. This seed provides a systematic
method: list ALL constraints → check each → propagate implications → identify
conflicts → resolve. This turns constraint satisfaction from "keep everything in
your head" into a mechanical process.

---

## THE CONSTRAINT PROPAGATION METHOD

### Step-by-Step Protocol
```
1. ENUMERATE: List every constraint explicitly
2. CLASSIFY: Hard (must satisfy) vs Soft (prefer to satisfy)
3. CHECK: For each constraint, verify current solution satisfies it
4. PROPAGATE: Each constraint implies other constraints — trace them
5. CONFLICT: If two constraints contradict, identify the conflict
6. RESOLVE: Prioritize hard over soft; among equals, ask the user
7. VERIFY: Final solution satisfies all hard constraints
```

---

## DOMAIN 1: SYSTEM CONFIGURATION

### Example: Configuring a Next.js + Prisma + Vercel Deployment

**Step 1 — Enumerate ALL constraints:**
```
C1: Next.js App Router requires Node.js runtime for Server Components
C2: Prisma requires a database connection (connection string)
C3: Vercel serverless functions have 10s timeout (hobby) or 60s (pro)
C4: Prisma connection pooling needed for serverless (each invocation opens connection)
C5: Database must be accessible from Vercel's IP range
C6: Environment variables must be set in Vercel dashboard
C7: Prisma Client must be generated at build time (postinstall script)
C8: Build must complete within Vercel's build timeout (45 min hobby)
C9: Bundle size limit for serverless functions (50MB compressed)
C10: CORS must allow production domain
```

**Step 2 — Classify:**
```
HARD constraints (must satisfy):
C1, C2, C5, C6, C7 (app won't work without these)

SOFT constraints (prefer):
C3 (can upgrade plan), C4 (works without but leaks connections),
C8 (usually fine), C9 (usually fine), C10 (needed for cross-origin)
```

**Step 3 — Check current solution:**
```
C1: ✅ Using App Router with Node.js runtime (not Edge)
C2: ❌ DATABASE_URL not set in Vercel
C3: ⚠️ Some Prisma queries might exceed 10s on hobby
C4: ❌ No connection pooling configured
C5: ❓ Need to verify Neon allows all Vercel IPs
C6: ❌ Need to add all env vars
C7: ✅ postinstall script runs prisma generate
C8: ✅ Build takes ~3 minutes
C9: ✅ Bundle under 10MB
C10: ❌ CORS not configured yet
```

**Step 4 — Propagate implications:**
```
C2 implies → Need to set DATABASE_URL in Vercel
C4 implies → Need Prisma Accelerate or PgBouncer, which implies:
  → Need to update DATABASE_URL to use pooler URL
  → Need to add DIRECT_URL for migrations (non-pooled)
C5 implies → Neon's default allows all IPs, but if restricted, need Vercel IP list
C4 + C3 propagates → Connection pooling reduces query time (helps C3)
C10 implies → Need middleware.ts or route-level CORS headers
```

**Step 5 — Identify conflicts:**
```
CONFLICT: C2 (need connection string) + C4 (need pooled connection)
  → Resolution: Two URLs — DATABASE_URL (pooled) and DIRECT_URL (direct)

CONFLICT: C3 (timeout limit) + complex queries
  → Resolution: Optimize queries, add indexes, or upgrade Vercel plan
```

**Step 6 — Resolve:**
```
Priority order: C1 > C2 > C5 > C7 > C6 > C4 > C10 > C3 > C8 > C9

Action plan:
1. Set DATABASE_URL (pooled) and DIRECT_URL in Vercel env
2. Configure Prisma for connection pooling
3. Verify Neon accessibility
4. Add CORS middleware
5. Test with Vercel preview deployment
```

---

## DOMAIN 2: API DESIGN CONSTRAINTS

### Example: Designing a User Search Endpoint

**Enumerate constraints:**
```
C1: Must return paginated results (no unbounded queries)
C2: Must support text search across name and email
C3: Must respect authorization (users can only search within their org)
C4: Must not expose sensitive fields (password hash, internal IDs)
C5: Must be fast (< 200ms response time)
C6: Must support sorting by relevance, name, or date
C7: Must handle empty results gracefully
C8: Must rate-limit to prevent abuse (search is expensive)
C9: Must log searches for audit trail
C10: Must work with existing Prisma schema
```

**Propagation:**
```
C1 → Need cursor-based or offset pagination
  → Implies: response must include pagination metadata

C2 → Full-text search or LIKE queries
  → LIKE '%term%' can't use index → violates C5
  → Propagation: Need full-text search index in PostgreSQL
  → Or: Use trigram index (pg_trgm extension)

C3 → WHERE clause must always include orgId
  → Implies: orgId must come from authenticated session, NOT from request
  → Propagation: Middleware must inject orgId from auth context

C4 → SELECT must specify fields (not SELECT *)
  → Implies: Prisma select: { ... } must explicitly list safe fields

C5 + C2 → Full-text index required
  → Implies: Database migration needed
  → Implies: Build time for index on existing data

C6 + C5 → Sorting by relevance requires search ranking
  → PostgreSQL ts_rank function needed
  → Implies: Can't just use Prisma — need raw SQL for ranking

C8 → Rate limiter middleware on this endpoint
  → Different limit than other endpoints (lower, since search is expensive)
```

**Conflicts:**
```
CONFLICT: C5 (fast) vs C2 (text search on multiple fields)
  → Resolution: Add GIN index for full-text search. Accept slightly
    slower writes for much faster reads.

CONFLICT: C6 (sort by relevance) vs C10 (work with Prisma)
  → Resolution: Use Prisma.$queryRaw for the search query.
    Prisma handles the rest (CRUD, relations).

CONFLICT: C9 (log everything) vs C5 (fast)
  → Resolution: Async logging. Don't block the response for audit log.
```

**Final solution shape:**
```typescript
// Satisfies all hard constraints
GET /api/users/search?q=term&sort=relevance&cursor=abc&limit=20

// C3: orgId from auth (never from query params)
// C1: cursor-based pagination
// C2: Full-text search with pg_trgm or tsvector
// C4: select specific fields
// C5: Indexed search < 200ms
// C6: sort parameter
// C7: empty array with 200 OK
// C8: 30 req/min rate limit
// C9: async audit log
// C10: Prisma.$queryRaw for search, Prisma for everything else
```

---

## DOMAIN 3: SCHEDULING / RESOURCE ALLOCATION

### Example: Scheduling Background Jobs

**Constraints:**
```
C1: Email notifications must send within 5 minutes of trigger
C2: Report generation can take up to 10 minutes
C3: Maximum 5 concurrent background jobs (server limit)
C4: Database connection pool maximum 20 connections
C5: Each report job uses 3 database connections
C6: Each email job uses 1 database connection
C7: Peak time: 9am-5pm, ~100 email triggers/hour, ~10 reports/hour
C8: Jobs must retry on failure (max 3 attempts)
C9: Failed jobs must alert the team
C10: Jobs must not block the main API server
```

**Propagation:**
```
C3 + C7 → At peak: 100 emails/hr + 10 reports/hr
  → 100 emails / 60 min ≈ 2 emails/min
  → If each takes < 10s, 1 concurrent email job is enough
  → 10 reports / 60 min ≈ 1 report every 6 min
  → If each takes 10 min, ~2 concurrent reports at any time
  → Total: ~3 concurrent jobs at peak → fits C3

C4 + C5 + C6 → Worst case: 5 concurrent jobs
  → If all reports: 5 × 3 = 15 connections → fits C4 ✅
  → If 3 reports + 2 emails: 3×3 + 2×1 = 11 → fits C4 ✅
  → Still leaves 5-9 connections for API server

C1 → Email must process within 5 min
  → Queue must prioritize emails over reports
  → Implies: Priority queue needed (not just FIFO)

C8 + C2 → Report retry after 10 min job could take 30 min total
  → Acceptable? Depends on urgency of reports
  → Propagation: Reports should have longer timeout per attempt

C10 → Separate worker process (not in API server)
  → Implies: Redis queue (BullMQ) or separate worker service
  → Worker process manages its own connection pool
```

**Conflicts:**
```
CONFLICT: C1 (email in 5 min) vs C3 (max 5 concurrent)
  → At peak, if 5 long reports are running, new emails are blocked
  → Resolution: Reserve 2 slots for emails, 3 for reports
  → Or: Separate queues with separate concurrency limits

CONFLICT: C8 (retry 3x) vs C4 (connection limit)
  → Retrying means more total job executions → more connection usage
  → Resolution: Exponential backoff on retry (delay between attempts)
  → This spreads connection usage over time
```

---

## DOMAIN 4: PRICING / BUSINESS CONSTRAINTS

### Example: Designing Stone AI Pricing Tiers

**Constraints:**
```
C1: Free tier must attract users (enough value to try)
C2: Free tier must not attract freeloaders (limited enough to convert)
C3: Paid tiers must have clear upgrade motivation
C4: Each tier must be profitable (cost per user < revenue per user)
C5: Price points must be psychologically acceptable
C6: Annual discount must incentivize commitment (15-20% off)
C7: Agents must be gated by tier (not all agents free)
C8: AI costs (API calls) scale with usage
C9: Promotional prices must not undercut annual pricing permanently
C10: Enterprise must justify premium with exclusive features
```

**Propagation:**
```
C1 + C2 → Free tier: enough agents to demo, not enough for real work
  → 4 agents satisfies both (can try the platform, needs upgrade for full use)

C3 + C7 → Each tier adds agents
  → FREE=4, STARTER=16, PLUS=30, SMART=39, PRO=42
  → Clear progression: each tier roughly doubles or adds 50%

C4 + C8 → Higher tiers use more AI → cost scales
  → SMART tier includes Claude Sonnet (expensive) → must price accordingly
  → $99.99/mo for SMART must cover API costs per user
  → If avg SMART user makes 500 Claude Sonnet requests/mo:
    500 × ~1000 tokens × ($3 + $15) / 1M = ~$9/mo API cost
    → $99.99 revenue - $9 cost = $90.99 margin ✅

C5 → Pricing anchors: $19.99, $49.99, $99.99, $200
  → All under psychological barriers (not $20, $50, $100, $200)
  → Exception: PRO at $200 is a round number → signals premium

C6 → Annual: 15% off for PRO ($170/mo), 20% off for SMART ($79.99/mo)
  → Verify: annual price × 12 > monthly × 10 (user saves but we still profit)

C9 → Promos: $9.99 first month, $14.99 trial, $39.99 growth
  → Must not be available permanently → time-limited
  → $9.99 < annual monthly equivalent → OK as loss leader
  → After promo, user upgrades or churns
```

**Conflicts:**
```
CONFLICT: C1 (generous free) vs C4 (profitable)
  → Free users cost money (hosting, bandwidth) but pay nothing
  → Resolution: Cap free tier resources (rate limits, storage limits)
  → Accept free tier as customer acquisition cost

CONFLICT: C6 (annual discount) vs C9 (promotional pricing)
  → If promo is $9.99/mo and annual STARTER is $16.99/mo...
    customer takes promo, not annual
  → Resolution: Promos are MONTHLY only, no annual promo pricing
  → Or: Promo is "first month" only, then regular price
```

---

## DOMAIN 5: SYSTEM DESIGN CONSTRAINTS

### Example: Designing a Real-Time Chat Feature

**Enumerate:**
```
C1: Messages must appear within 500ms of sending
C2: Must support 1000 concurrent users
C3: Message history must persist (not lost on disconnect)
C4: Must work on mobile browsers (no native WebSocket issues)
C5: Must handle reconnection gracefully (network switches)
C6: Must show typing indicators
C7: Must show read receipts
C8: Must fit within Vercel serverless architecture
C9: Must not exceed database connection limits
C10: Messages must be ordered correctly (no out-of-order display)
```

**Propagation and Conflicts:**
```
C1 + C8 → CONFLICT: Vercel serverless is stateless → can't hold WebSocket connections
  → Resolution options:
    a) Use a third-party real-time service (Pusher, Ably, Soketi)
    b) Use Vercel's Edge Runtime with streaming
    c) Use Server-Sent Events instead of WebSocket
    d) Self-host WebSocket server separately

C2 + C9 → 1000 concurrent users, each with potential DB queries
  → Can't give each user a persistent DB connection
  → Resolution: Cache recent messages in Redis, query DB only for history

C3 + C10 → Messages must persist AND maintain order
  → Use database sequence/timestamp for ordering
  → Write to DB on send, read from cache for real-time

C5 → Reconnection must resync missed messages
  → Client sends "last seen message ID" on reconnect
  → Server sends all messages after that ID

C6 + C8 → Typing indicators are ephemeral (no persistence needed)
  → Use real-time channel only (no DB write)
  → Publish to topic, auto-expires
```

**Architecture decision (satisfying all constraints):**
```
- Pusher/Ably for real-time (C1, C2, C4, C5, C6, C8)
- PostgreSQL for persistence (C3, C10)
- Redis for caching recent messages (C9)
- API routes for sending messages: validate → save to DB → publish to channel
- Client: optimistic UI (show sent message immediately, confirm async)
```

---

## CONSTRAINT TRACKING TEMPLATE

Use this template for any multi-constraint problem:

```markdown
## Problem: [description]

### Constraints
| ID | Constraint | Type | Status |
|----|-----------|------|--------|
| C1 | [description] | HARD | ❌/⚠️/✅ |
| C2 | [description] | HARD | ❌/⚠️/✅ |
| C3 | [description] | SOFT | ❌/⚠️/✅ |

### Propagation
- C1 implies → [consequence]
- C2 + C3 together imply → [combined consequence]

### Conflicts
- C1 vs C4: [description of conflict]
  → Resolution: [how to resolve]

### Solution
[Solution that satisfies all HARD constraints and maximizes SOFT constraints]

### Verification
□ C1: [how verified]
□ C2: [how verified]
□ C3: [how verified]
```

---

## COMMON CONSTRAINT PATTERNS

### Pattern 1: Resource Contention
```
Multiple components compete for limited resource
Example: DB connections, CPU cores, memory, API rate limits
Resolution: Pool + queue + priority + backpressure
```

### Pattern 2: Speed vs Safety
```
Fast operation conflicts with thorough validation
Example: Fast page load vs comprehensive security checks
Resolution: Async validation, progressive enhancement, caching
```

### Pattern 3: Flexibility vs Consistency
```
Letting users do anything conflicts with maintaining invariants
Example: Custom fields vs schema validation
Resolution: Bounded flexibility (allow within constraints)
```

### Pattern 4: Cost vs Performance
```
Faster/more performant costs more money
Example: CDN bandwidth, larger server, premium database
Resolution: Optimize what you can, pay for what you must, measure ROI
```

### Pattern 5: User Experience vs Security
```
Security measures make UX worse
Example: CAPTCHA, MFA, session timeouts
Resolution: Risk-based authentication, remember trusted devices, progressive security
```

---

## USAGE GUIDE

When facing any multi-constraint problem:
1. STOP and enumerate ALL constraints before solving
2. Use the constraint tracking template
3. Propagate implications systematically
4. Identify conflicts explicitly
5. Resolve conflicts by priority (hard > soft)
6. Verify the final solution against ALL constraints

**Embedding hint**: The constraint propagation method and the tracking template
are the primary retrieval units. Domain examples are secondary — retrieve
the one matching the user's domain.
