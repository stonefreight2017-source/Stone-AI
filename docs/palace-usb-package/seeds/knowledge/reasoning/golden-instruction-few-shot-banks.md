# Golden Seed I-7: Gold-Standard Few-Shot Exemplar Banks

## Purpose
Few-shot examples are the fastest way to teach a model what "good" looks like in a specific domain. This seed provides curated input-output pairs that demonstrate ideal response quality, format, and depth. When retrieved before generation, these exemplars anchor the model's output to expert-level standards.

---

## How to Use This Seed
1. Identify the domain of the user's request
2. Load 2-3 relevant exemplars from that domain
3. Use them as internal reference points (not copy targets) for your response
4. Match the quality, structure, and depth demonstrated in the exemplars
5. Adapt to the specific query — exemplars show the PATTERN, not the exact answer

---

## Bank 1: Code Generation Exemplars

### Exemplar 1.1: Function with Error Handling

**User Input:** "Write a TypeScript function that fetches a user by ID from the database and returns their profile."

**Ideal Output:**
```typescript
import { prisma } from '@/lib/prisma';
import { UserProfile } from '@/types/user';

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  if (!userId || typeof userId !== 'string') {
    throw new Error('getUserProfile requires a valid string userId');
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        tier: true,
        createdAt: true,
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      tier: user.tier,
      memberSince: user.createdAt,
    };
  } catch (error) {
    console.error(`Failed to fetch user profile for ${userId}:`, error);
    throw new Error('Unable to fetch user profile');
  }
}
```

Key decisions: Input validation before DB call. Selective fields via `select` (not loading entire user record). Null return for missing users (not an error). Error logged with context before re-throwing.

**Why this is gold:** Input validation, typed parameters and return, selective querying, proper error handling, logging with context, clean separation between DB model and return type.

---

### Exemplar 1.2: React Component

**User Input:** "Create a React component for a pricing card that shows plan name, price, features, and a CTA button."

**Ideal Output:**
```tsx
interface PricingCardProps {
  planName: string;
  price: number;
  period: 'monthly' | 'annual';
  features: string[];
  ctaText: string;
  onSelect: () => void;
  isPopular?: boolean;
  isCurrentPlan?: boolean;
}

export function PricingCard({
  planName,
  price,
  period,
  features,
  ctaText,
  onSelect,
  isPopular = false,
  isCurrentPlan = false,
}: PricingCardProps) {
  return (
    <div className={cn(
      'relative rounded-2xl border p-6 flex flex-col',
      isPopular ? 'border-primary shadow-lg scale-105' : 'border-border',
      isCurrentPlan && 'opacity-75'
    )}>
      {isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
          Most Popular
        </span>
      )}

      <h3 className="text-lg font-semibold">{planName}</h3>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-bold">${price}</span>
        <span className="text-muted-foreground">/{period === 'annual' ? 'yr' : 'mo'}</span>
      </div>

      <ul className="mt-6 flex-1 space-y-3">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm">
            <CheckIcon className="h-4 w-4 text-green-500 shrink-0" />
            {feature}
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        disabled={isCurrentPlan}
        className={cn(
          'mt-6 w-full rounded-lg py-2.5 text-sm font-medium transition-colors',
          isPopular
            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
          isCurrentPlan && 'cursor-not-allowed'
        )}
      >
        {isCurrentPlan ? 'Current Plan' : ctaText}
      </button>
    </div>
  );
}
```

Fully typed props with sensible defaults. Handles edge states (popular badge, current plan disabled state). Uses Tailwind with shadcn patterns. Accessible button states. Flexible via props, not hardcoded.

---

### Exemplar 1.3: API Route Handler

**User Input:** "Write a Next.js API route that updates a user's settings."

**Ideal Output:**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().min(2).max(5).optional(),
  notifications: z.boolean().optional(),
  timezone: z.string().max(50).optional(),
}).strict();

export async function PATCH(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updateSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const settings = await prisma.userSettings.update({
      where: { userId },
      data: parsed.data,
    });

    return NextResponse.json({ settings }, { status: 200 });
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
```

Auth check first. Zod validation with `.strict()`. PATCH not PUT (partial updates). Structured error responses with correct HTTP status codes. No data leakage in error messages.

---

## Bank 2: Debugging Exemplars

### Exemplar 2.1: Error Diagnosis

**User Input:** "I'm getting 'Cannot read properties of undefined (reading map)' when rendering my component."

**Ideal Output:**
The error means you're calling `.map()` on a variable that's `undefined` at render time. This almost always happens when data hasn't loaded yet.

**Most likely cause:** Your component renders before the data fetch completes.

**Fix (pick the one that matches your setup):**

1. **If using `useState` with `useEffect`:**
```tsx
const [items, setItems] = useState<Item[]>([]); // Initialize as empty array, not undefined
```

2. **If the data comes from props:**
```tsx
// Add a guard
{items?.map(item => ...)}
// Or provide a default
const { items = [] } = props;
```

3. **If using a data fetching hook:**
```tsx
const { data, isLoading } = useQuery(...);
if (isLoading) return <Skeleton />;
// Now data is guaranteed to exist
```

**How to find the exact line:** The browser console error includes a component stack trace. The last component listed before the error is where `.map()` is called on undefined. Check what variable `.map()` is called on and trace where it gets its value.

**Why this is gold:** Immediate diagnosis. Multiple solution paths based on common setups. Teaches the user how to find it themselves next time. No unnecessary preamble.

---

### Exemplar 2.2: Performance Issue

**User Input:** "My Next.js page takes 8 seconds to load. How do I debug this?"

**Ideal Output:**
8 seconds means something specific is blocking. Here's a systematic diagnostic:

**Step 1: Identify WHERE the time is spent**
- Open Chrome DevTools → Network tab → reload the page
- Look for: one slow request (API/data), many small requests (waterfall), or slow JS execution (bundle)

**Step 2: Branch based on findings**

**If one API call is slow (>2s):**
```bash
# Check server-side timing
console.time('db-query');
const data = await prisma.user.findMany({ ... });
console.timeEnd('db-query');
```
- Add database indexes for the query's WHERE/ORDER BY columns
- Check if you're loading more data than needed (use `select` or `take`)

**If the JavaScript bundle is large (>500KB):**
```bash
# Analyze bundle
npx @next/bundle-analyzer
```
- Look for: large dependencies loaded on initial page, missing dynamic imports
- Fix: `dynamic(() => import('./HeavyComponent'), { ssr: false })`

**If it's a waterfall of requests:**
- Multiple sequential API calls → parallelize with `Promise.all`
- Multiple component-level fetches → lift data fetching to page level

**Step 3: Verify**
After each change, measure again. Don't guess whether it helped.

---

## Bank 3: Architecture Advice Exemplars

### Exemplar 3.1: Technology Decision

**User Input:** "Should I use Redis or PostgreSQL for my rate limiting?"

**Ideal Output:**
**Use Redis.** Here's why:

Rate limiting requires atomic increment-and-check operations at high frequency with automatic expiration. Redis is purpose-built for this:
- `INCR` + `EXPIRE` is atomic and O(1)
- In-memory = sub-millisecond latency
- Built-in TTL means old windows clean themselves up
- No connection pool pressure on your main database

PostgreSQL CAN do it but shouldn't:
- Every rate limit check is a database query competing with your application queries
- Row-level locking on a frequently-updated counter creates contention
- You'd need a cron job or trigger to clean up expired entries
- It adds 5-20ms per request vs Redis's <1ms

**The exception:** If you're on a PaaS with no Redis available and your traffic is under 100 req/sec, PostgreSQL is acceptable to avoid adding infrastructure. Use an `ON CONFLICT DO UPDATE` with `pg_advisory_xact_lock` for atomicity.

**Implementation:**
```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }
  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
  };
}
```

---

## Bank 4: Security Review Exemplars

### Exemplar 4.1: Code Security Review

**User Input:** "Review this API route for security issues:" [user provides code with `req.body.userId` used directly]

**Ideal Output:**
**3 security issues found, 1 critical:**

**CRITICAL — Broken Access Control (IDOR)**
```typescript
// VULNERABLE: User controls which userId's data they access
const data = await prisma.user.findUnique({ where: { id: req.body.userId } });
```
Any authenticated user can pass any `userId` and access other users' data.

**Fix:** Use the authenticated user's ID from the session, never from the request body:
```typescript
const { userId } = await auth(); // From Clerk/session
const data = await prisma.user.findUnique({ where: { id: userId } });
```

**HIGH — No Input Validation**
`req.body` is used directly without schema validation. An attacker can send unexpected fields, wrong types, or oversized payloads.

**Fix:** Add Zod validation with `.strict()`:
```typescript
const schema = z.object({ /* expected fields */ }).strict();
const parsed = schema.safeParse(req.body);
if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
```

**MEDIUM — Missing Rate Limiting**
This endpoint has no rate limiting. An attacker could enumerate user data at scale.

**Fix:** Add rate limiting middleware (see rate limiting seed or use `@upstash/ratelimit`).

---

## Bank 5: Business Analysis Exemplars

### Exemplar 5.1: Pricing Strategy

**User Input:** "I'm thinking of raising my SaaS price from $29 to $49/month. Thoughts?"

**Ideal Output:**
A 69% price increase is significant. Whether it works depends on three things:

**1. Value-to-price ratio after the increase**
- At $29, your product needed to save or earn users ~$60/month to feel like a deal (2x perceived value rule)
- At $49, that threshold becomes ~$100/month
- Question: Does your product deliver $100+/month in value? If yes, $49 is still underpriced.

**2. Competitive positioning**
- Where does $49 put you relative to alternatives?
- If competitors are at $39, you need a clear differentiator to justify the premium
- If competitors are at $79, you're still the value option

**3. Churn risk on existing customers**
- Grandfather existing customers at $29 (or $39 compromise) for 6-12 months
- New customers get $49 from day one
- This prevents churn shock while you validate the new price

**Recommended approach:**
1. Raise to $49 for new signups immediately
2. Email existing customers: price going to $39 in 60 days (partial increase, shows respect)
3. Measure: new signup rate at $49 vs historical at $29. If conversion drops <20%, the higher revenue per customer likely compensates
4. After 6 months, assess whether existing customers should go to $49

---

## Bank 6: Content Writing Exemplars

### Exemplar 6.1: Technical Blog Introduction

**User Input:** "Write an intro paragraph for a blog post about database indexing."

**Ideal Output:**
"Your database query was fast with 1,000 rows. At 100,000 rows it's slow. At 1,000,000 it's unusable. The query hasn't changed — the data has. This is where indexing transforms your database from searching every row (like reading every page of a book to find one sentence) to jumping directly to the answer (like using the book's index). This post covers how database indexes actually work, when to add them, and the tradeoffs that nobody mentions in the tutorials."

**Why this is gold:** Opens with a relatable problem. Escalates the stakes. Provides an analogy. Sets clear expectations for the article. No filler, no "In today's world of big data..."

---

### Exemplar 6.2: Error Message Copy

**User Input:** "Write a user-friendly error message for when a payment fails."

**Ideal Output:**
**Heading:** Payment didn't go through

**Body:** We couldn't process your payment. This usually happens when:
- Your card was declined by your bank
- The card number or expiration date has a typo
- Your card doesn't allow international transactions

**CTA:** Try again with the same card, or use a different payment method.

**Subtext:** You haven't been charged. If the problem continues, contact support@example.com.

**Why this is gold:** No blame ("your payment failed" not "you entered wrong info"). Lists common causes without being accusatory. Reassures about charges. Clear next step. Support escape hatch.

---

## Bank 7: Data Analysis Exemplars

### Exemplar 7.1: Metric Interpretation

**User Input:** "Our conversion rate dropped from 3.2% to 2.8% this month. What should we do?"

**Ideal Output:**
First, let's determine if this is signal or noise.

**Statistical check:** With your traffic volume (~10K visitors/month), the difference between 3.2% and 2.8% could be normal variation. At 10K visitors, your 95% confidence interval for a 3% conversion rate is roughly 2.7% to 3.3%. A drop to 2.8% is within normal fluctuation.

**If traffic is higher (50K+):** This is likely a real drop. Investigate:
1. **Segment the data** — Did all channels drop, or just one? (Organic vs paid vs direct)
2. **Check for changes** — Did the site change? New deploy? Different ad creative? Seasonal pattern?
3. **Funnel analysis** — Where are you losing them? Landing page → signup form → payment → completion. Which step's conversion dropped?

**Action depends on cause:**
- One channel dropped → fix that channel's landing page or targeting
- All channels dropped → something site-wide changed (speed, UX, pricing)
- Seasonal → compare to same month last year before panicking

**Don't do:** Panic-redesign the entire funnel based on one month's data.

---

## Bank 8: API Design Exemplars

### Exemplar 8.1: Endpoint Design

**User Input:** "Design an API endpoint for searching products."

**Ideal Output:**
```
GET /api/v1/products/search
```

**Query Parameters:**
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| q | string | yes | — | Search query (min 2 chars) |
| category | string | no | all | Filter by category slug |
| minPrice | number | no | 0 | Minimum price filter |
| maxPrice | number | no | — | Maximum price filter |
| sort | enum | no | relevance | relevance, price_asc, price_desc, newest |
| page | number | no | 1 | Page number (1-indexed) |
| limit | number | no | 20 | Results per page (max 100) |

**Success Response (200):**
```json
{
  "results": [
    {
      "id": "prod_abc123",
      "name": "Product Name",
      "price": 29.99,
      "category": "tools",
      "thumbnail": "https://cdn.example.com/img/prod_abc123.webp",
      "rating": 4.5,
      "reviewCount": 128
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalResults": 347,
    "totalPages": 18,
    "hasNextPage": true
  },
  "query": {
    "q": "screwdriver",
    "appliedFilters": { "category": "tools" }
  }
}
```

**Error Responses:**
- `400`: Invalid parameters (q too short, limit >100, invalid sort value)
- `429`: Rate limit exceeded (include Retry-After header)

**Design decisions:** GET because it's a read operation. Pagination metadata included so clients don't have to calculate. Applied filters echoed back for debugging. Thumbnail URL, not full image — client controls image size. Rating included to avoid N+1 for common display patterns.

---

## Exemplar Selection Criteria

When choosing which exemplars to reference for a given query:

1. **Domain match** — Use exemplars from the same domain as the user's request
2. **Complexity match** — Simple query? Use a simpler exemplar. Complex? Use the most complex one available.
3. **Format match** — If the user wants code, reference code exemplars. If they want analysis, reference analysis exemplars.
4. **Don't copy, calibrate** — The exemplar shows the quality bar. Your response should hit the same bar with the user's specific content.
5. **2-3 exemplars maximum** — More than 3 creates noise. Pick the most relevant ones.

---

*Seed I-7 | Classification: Instruction Following | Priority: HIGH*
*Few-shot exemplars are the most efficient way to communicate quality expectations. One good example teaches more than ten pages of rules.*
