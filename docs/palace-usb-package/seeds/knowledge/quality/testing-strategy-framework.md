# Testing Strategy Framework
## Calibrated Testing Pyramid for Next.js + Prisma Stack

Version: 1.0 | Stack: Next.js 16 + Prisma 7 + Clerk + Stripe + vLLM | Runner: Vitest

---

## TESTING PYRAMID (Our Stack)

```
                    ┌──────────┐
                    │   E2E    │  5-10 critical user journeys
                    │ Playwright│  Slow, expensive, high confidence
                   ┌┴──────────┴┐
                   │  Integration │  API routes, DB, webhooks
                   │  fetch + DB  │  Medium speed, medium confidence
                  ┌┴──────────────┴┐
                  │      Unit       │  Pure functions, transforms, validators
                  │  Vitest/Jest    │  Fast, cheap, focused
                 ┌┴────────────────┴┐
                 │   Static Analysis  │  TypeScript, ESLint, Zod
                 │   Always running   │  Instant, catches 40% of bugs
                 └────────────────────┘
```

**Distribution target for Stone AI:**
- Static analysis: runs on every save (TypeScript + ESLint)
- Unit tests: ~60% of test suite (pure logic, Zod schemas, transforms)
- Integration tests: ~30% of test suite (API routes, DB operations)
- E2E tests: ~10% of test suite (critical flows only)
- Smoke tests: 5 requests, run on every deploy

---

## 1. UNIT TESTING

### What to Unit Test
```
YES — unit test these:
  ├─ Zod schema validation (input parsing)
  ├─ Price calculation logic
  ├─ Tier permission checks (canAccessAgent, canUseBestie)
  ├─ String transforms (slug generation, sanitization)
  ├─ Date logic (trial expiration, subscription renewal)
  ├─ Agent routing logic (which model for which tier)
  ├─ Rate limit token bucket math
  └─ Encryption/decryption helpers (AES-256-GCM)

NO — don't unit test these:
  ├─ React components (use integration/E2E instead)
  ├─ API routes (integration test territory)
  ├─ Prisma queries (integration test territory)
  └─ Third-party library behavior
```

### Mock Boundaries — Where to Draw the Line
```
MOCK these (external boundaries):
  ├─ prisma.*  → mock with vitest.mock or test DB
  ├─ clerk.*   → mock auth() to return test user
  ├─ stripe.*  → mock Stripe client methods
  ├─ fetch()   → mock external API calls
  └─ fs.*      → mock file system when testing logic (not I/O)

NEVER MOCK these (test the real thing):
  ├─ Your own utility functions
  ├─ Zod schemas (they ARE the unit)
  ├─ Type guards and narrowing functions
  ├─ Business logic functions
  └─ Math/string operations
```

### Prisma Mock Pattern
```typescript
import { vi } from 'vitest';

// Create mock Prisma client
const mockPrisma = {
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  agent: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  subscription: {
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  $transaction: vi.fn((fn) => fn(mockPrisma)),
};

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }));

// Usage in test:
test('getUserTier returns FREE for user without subscription', async () => {
  mockPrisma.subscription.findFirst.mockResolvedValue(null);
  const tier = await getUserTier('user-123');
  expect(tier).toBe('FREE');
});
```

### Clerk Mock Pattern
```typescript
import { vi } from 'vitest';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({
    userId: 'test-user-id',
    sessionId: 'test-session-id',
    orgId: null,
  })),
  currentUser: vi.fn(() => ({
    id: 'test-user-id',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    firstName: 'Test',
    lastName: 'User',
  })),
}));

// For testing unauthenticated flows:
test('returns 401 when not authenticated', async () => {
  const { auth } = await import('@clerk/nextjs/server');
  (auth as any).mockReturnValueOnce({ userId: null });
  // ... test your route
});
```

### Stripe Mock Pattern
```typescript
vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    customers: {
      create: vi.fn().mockResolvedValue({ id: 'cus_test123' }),
      retrieve: vi.fn().mockResolvedValue({ id: 'cus_test123', email: 'test@test.com' }),
    },
    subscriptions: {
      create: vi.fn().mockResolvedValue({ id: 'sub_test123', status: 'active' }),
      update: vi.fn().mockResolvedValue({ id: 'sub_test123', status: 'active' }),
      cancel: vi.fn().mockResolvedValue({ id: 'sub_test123', status: 'canceled' }),
    },
    webhooks: {
      constructEvent: vi.fn((body, sig, secret) => JSON.parse(body)),
    },
    checkout: {
      sessions: {
        create: vi.fn().mockResolvedValue({ url: 'https://checkout.stripe.com/test' }),
      },
    },
  })),
}));
```

### Assertion Patterns
```typescript
// Zod schema testing pattern
describe('chatInputSchema', () => {
  const validInputs = [
    { agentId: 'agent-1', message: 'Hello' },
    { agentId: 'agent-2', message: 'A'.repeat(10000) },
    { agentId: 'agent-3', message: 'Hello', sessionId: '550e8400-e29b-41d4-a716-446655440000' },
  ];

  const invalidInputs = [
    [{}, 'missing required fields'],
    [{ agentId: '', message: 'hi' }, 'empty agentId'],
    [{ agentId: 'a', message: '' }, 'empty message'],
    [{ agentId: 'a', message: 'hi', extra: 'field' }, 'extra field with .strict()'],
    [{ agentId: 123, message: 'hi' }, 'wrong type'],
  ];

  test.each(validInputs)('accepts valid input: %j', (input) => {
    expect(chatInputSchema.safeParse(input).success).toBe(true);
  });

  test.each(invalidInputs)('rejects invalid input: %s', (input, _reason) => {
    expect(chatInputSchema.safeParse(input).success).toBe(false);
  });
});
```

---

## 2. INTEGRATION TESTING

### API Route Testing with fetch
```typescript
/**
 * Integration test pattern for Next.js App Router API routes
 * Uses real route handler functions, mocked external services
 */

import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/agents/route';

describe('GET /api/agents', () => {
  test('returns agent list for authenticated user', async () => {
    // Mock auth to return valid user
    mockAuth({ userId: 'user-123' });
    // Mock DB to return test agents
    mockPrisma.agent.findMany.mockResolvedValue([
      { id: '1', name: 'Code Assistant', tier: 'FREE' },
      { id: '2', name: 'Web Developer', tier: 'STARTER' },
    ]);

    const req = new NextRequest('http://localhost:3000/api/agents');
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.agents).toHaveLength(2);
    expect(body.agents[0]).toHaveProperty('name');
  });

  test('returns 401 for unauthenticated request', async () => {
    mockAuth({ userId: null });

    const req = new NextRequest('http://localhost:3000/api/agents');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  test('filters agents by user tier', async () => {
    mockAuth({ userId: 'user-123' });
    mockUserTier('STARTER'); // User on STARTER tier

    const req = new NextRequest('http://localhost:3000/api/agents');
    const res = await GET(req);
    const body = await res.json();

    // STARTER gets 16 agents
    body.agents.forEach((agent: any) => {
      expect(['FREE', 'STARTER']).toContain(agent.tier);
    });
  });
});
```

### Database Integration with Test Transactions
```typescript
/**
 * DB integration pattern: wrap each test in a transaction, rollback after
 * Keeps test DB clean without slow seed/teardown
 */

import { PrismaClient } from '@prisma/client';

const testPrisma = new PrismaClient({
  datasources: { db: { url: process.env.TEST_DATABASE_URL } },
});

// Transaction-wrapped test helper
async function withTestTransaction<T>(
  fn: (tx: typeof testPrisma) => Promise<T>
): Promise<T> {
  // Prisma interactive transactions with rollback
  try {
    return await testPrisma.$transaction(async (tx) => {
      const result = await fn(tx as any);
      // Force rollback by throwing after getting result
      throw { __rollback: true, result };
    });
  } catch (e: any) {
    if (e.__rollback) return e.result;
    throw e;
  }
}

describe('User service (DB integration)', () => {
  test('createUser stores user correctly', async () => {
    await withTestTransaction(async (tx) => {
      const user = await tx.user.create({
        data: { clerkId: 'test-123', email: 'test@test.com', name: 'Test' },
      });

      expect(user.clerkId).toBe('test-123');
      expect(user.email).toBe('test@test.com');

      // Verify it's in the DB within this transaction
      const found = await tx.user.findUnique({ where: { clerkId: 'test-123' } });
      expect(found).not.toBeNull();
    });
    // Transaction rolled back — no test data left in DB
  });
});
```

### Webhook Simulation
```typescript
/**
 * Stripe webhook integration test
 * Simulates real webhook payload with valid signature
 */

import Stripe from 'stripe';
import { POST } from '@/app/api/webhooks/stripe/route';

function createTestWebhookEvent(type: string, data: object): string {
  const event = {
    id: `evt_test_${Date.now()}`,
    object: 'event',
    type,
    data: { object: data },
    created: Math.floor(Date.now() / 1000),
  };
  return JSON.stringify(event);
}

describe('Stripe Webhook Handler', () => {
  test('handles customer.subscription.created', async () => {
    const payload = createTestWebhookEvent('customer.subscription.created', {
      id: 'sub_test123',
      customer: 'cus_test123',
      status: 'active',
      items: { data: [{ price: { id: 'price_test_starter' } }] },
    });

    // Mock constructEvent to bypass signature verification in tests
    vi.spyOn(stripe.webhooks, 'constructEvent').mockReturnValue(JSON.parse(payload));

    const req = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: payload,
      headers: { 'stripe-signature': 'test-sig' },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // Verify side effects
    expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.any(Object),
        create: expect.objectContaining({ status: 'active' }),
      })
    );
  });

  test('returns 400 for invalid signature', async () => {
    vi.spyOn(stripe.webhooks, 'constructEvent').mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature');
    });

    const req = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      body: '{}',
      headers: { 'stripe-signature': 'bad-sig' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
```

---

## 3. E2E TESTING

### Critical User Journeys (Playwright)
```typescript
/**
 * E2E tests for Stone AI critical paths
 * Run with: npx playwright test
 */

import { test, expect } from '@playwright/test';

// Auth state seeding — Clerk test mode
async function loginAsTestUser(page: any) {
  // Use Clerk's testing token approach
  await page.goto('/sign-in');
  await page.fill('[name="identifier"]', 'test@stone-ai.net');
  await page.fill('[name="password"]', process.env.TEST_USER_PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

test.describe('Critical Journey: Signup → Chat', () => {
  test('new user can sign up and chat with free agent', async ({ page }) => {
    // 1. Visit landing page
    await page.goto('/');
    await expect(page).toHaveTitle(/Stone AI/);

    // 2. Navigate to sign up
    await page.click('text=Get Started');
    await page.waitForURL('/sign-up');

    // 3. Sign up (Clerk handles this UI)
    // In test mode, use Clerk test helpers or pre-seeded user

    // 4. Complete onboarding
    await page.waitForURL('/onboarding');
    await page.click('text=Continue');

    // 5. Navigate to chat
    await page.goto('/chat');
    await expect(page.locator('[data-testid="agent-selector"]')).toBeVisible();

    // 6. Select a free agent
    await page.click('[data-testid="agent-selector"]');
    await page.click('text=Code Assistant'); // Free tier agent

    // 7. Send message
    await page.fill('[data-testid="chat-input"]', 'Hello, can you help me?');
    await page.click('[data-testid="send-button"]');

    // 8. Verify response appears
    await expect(page.locator('[data-testid="agent-response"]')).toBeVisible({ timeout: 30000 });
  });
});

test.describe('Critical Journey: Upgrade Flow', () => {
  test('free user sees upgrade prompt for paid agent', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/chat');

    // Try to access a STARTER-tier agent
    await page.click('[data-testid="agent-selector"]');
    await page.click('text=Web Developer'); // STARTER tier

    // Should see upgrade prompt
    await expect(page.locator('text=Upgrade')).toBeVisible();
  });
});

test.describe('Critical Journey: Billing', () => {
  test('user can navigate to billing and see current plan', async ({ page }) => {
    await loginAsTestUser(page);
    await page.goto('/settings/billing');

    await expect(page.locator('text=Current Plan')).toBeVisible();
    await expect(page.locator('text=FREE')).toBeVisible();
  });
});
```

### Playwright Configuration for Next.js
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

---

## 4. SMOKE TESTING

### 5 Requests Proving Prod is Alive
```bash
#!/bin/bash
# smoke.sh — run after every deploy
BASE="${1:-https://stone-ai.net}"
PASS=0; FAIL=0

check() {
  local name="$1" url="$2" expect="$3"
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url")
  if [ "$status" = "$expect" ]; then
    echo "  PASS  $name ($status)"
    ((PASS++))
  else
    echo "  FAIL  $name (expected $expect, got $status)"
    ((FAIL++))
  fi
}

echo "Smoke testing $BASE"
check "Health endpoint"    "$BASE/api/health"     200
check "Auth check"         "$BASE/api/auth/check" 401
check "Agent list"         "$BASE/api/agents"     200
check "Home page"          "$BASE"                200
check "Static assets"      "$BASE/favicon.ico"    200

echo ""
echo "Results: $PASS/5 passed"
[ "$FAIL" -gt 0 ] && exit 1
```

---

## 5. PROPERTY-BASED TESTING

### Fast-Check for Zod Schemas
```typescript
import * as fc from 'fast-check';
import { z } from 'zod';

/**
 * Property: If Zod says it's valid, it should survive round-trip serialization
 * Property: If Zod says it's invalid, safeParse should return { success: false }
 */

function testSchemaRoundTrip(schema: z.ZodSchema, arbitrary: fc.Arbitrary<unknown>) {
  describe(`Schema round-trip: ${schema.description || 'unnamed'}`, () => {
    test('valid inputs survive JSON round-trip', () => {
      fc.assert(
        fc.property(arbitrary, (input) => {
          const parsed = schema.parse(input);
          const roundTripped = JSON.parse(JSON.stringify(parsed));
          const reParsed = schema.safeParse(roundTripped);
          return reParsed.success;
        }),
        { numRuns: 100 }
      );
    });

    test('random garbage never causes unhandled exception', () => {
      fc.assert(
        fc.property(fc.anything(), (input) => {
          const result = schema.safeParse(input);
          return typeof result.success === 'boolean';
        }),
        { numRuns: 200 }
      );
    });
  });
}
```

### API Fuzzing
```typescript
/**
 * Fuzz API endpoints with random payloads
 * Property: No input should cause a 500 error
 */

const fuzzEndpoints = [
  { method: 'POST', path: '/api/chat', contentType: 'application/json' },
  { method: 'POST', path: '/api/settings', contentType: 'application/json' },
  { method: 'POST', path: '/api/feedback', contentType: 'application/json' },
];

describe('API Fuzzing', () => {
  for (const endpoint of fuzzEndpoints) {
    test(`${endpoint.method} ${endpoint.path} never returns 500 for random input`, () => {
      fc.assert(
        fc.asyncProperty(fc.anything(), async (randomPayload) => {
          const res = await fetch(`http://localhost:3000${endpoint.path}`, {
            method: endpoint.method,
            headers: { 'Content-Type': endpoint.contentType },
            body: JSON.stringify(randomPayload),
          });
          // 400, 401, 403, 422 are fine. 500 is NOT.
          return res.status !== 500;
        }),
        { numRuns: 50 }
      );
    });
  }
});
```

### State Machine Testing
```typescript
/**
 * Model-based test: subscription state machine
 * States: FREE → TRIAL → ACTIVE → PAST_DUE → CANCELED
 */

type SubState = 'FREE' | 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED';

const validTransitions: Record<SubState, SubState[]> = {
  FREE:     ['TRIAL', 'ACTIVE'],
  TRIAL:    ['ACTIVE', 'CANCELED'],
  ACTIVE:   ['PAST_DUE', 'CANCELED'],
  PAST_DUE: ['ACTIVE', 'CANCELED'],
  CANCELED: ['ACTIVE'], // Can resubscribe
};

test('subscription state machine only allows valid transitions', () => {
  fc.assert(
    fc.property(
      fc.constantFrom<SubState>('FREE', 'TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED'),
      fc.constantFrom<SubState>('FREE', 'TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED'),
      (from, to) => {
        const allowed = validTransitions[from].includes(to);
        const result = attemptTransition(from, to);
        if (allowed) {
          expect(result.success).toBe(true);
        } else {
          expect(result.success).toBe(false);
          expect(result.error).toContain('Invalid transition');
        }
      }
    ),
    { numRuns: 100 }
  );
});
```

---

## 6. WHEN NOT TO TEST

### Diminishing Returns Analysis
```
DO NOT test:
  ├─ Pure pass-through functions (just delegates to another function)
  │   Example: export const getUser = (id) => prisma.user.findUnique({ where: { id } })
  │   Why: You'd be testing Prisma, not your code
  │
  ├─ Every agent variant (44 agents with similar behavior)
  │   Instead: Test the agent framework once, spot-check 3-4 agents
  │   Why: Agent differences are in prompts, not code paths
  │
  ├─ UI pixel-perfect styling
  │   Instead: Snapshot test for structural changes, visual review for style
  │   Why: CSS testing is brittle, low ROI
  │
  ├─ Third-party library internals
  │   Example: Don't test that Stripe creates a customer correctly
  │   Instead: Test that YOUR code calls Stripe correctly
  │
  └─ Trivial getters/setters with no logic
      Why: TypeScript already validates these at compile time

DO test even if it seems simple:
  ├─ Security boundaries (auth checks, input validation)
  ├─ Money-related logic (pricing, billing, tier limits)
  ├─ Data integrity (unique constraints, required fields)
  └─ Error handling (does the catch block do the right thing?)
```

### Test ROI Decision Tree
```
Is this code on a critical path (auth, billing, chat)?
  ├─ YES → test it regardless of complexity
  └─ NO → continue

Does this code handle money or user data?
  ├─ YES → test it regardless of complexity
  └─ NO → continue

Is this code likely to break during refactoring?
  ├─ YES → test it (regression protection)
  └─ NO → continue

Is this code complex (>10 lines of logic, multiple branches)?
  ├─ YES → test it (bug prevention)
  └─ NO → probably skip (TypeScript catches the rest)
```

---

## CI PIPELINE ORDER

```
1. Install dependencies    (npm ci)
2. Static analysis         (tsc --noEmit && npm run lint)
3. Unit tests              (vitest run --reporter=verbose)
4. Integration tests       (vitest run --config vitest.integration.config.ts)
5. Build                   (npm run build)
6. Smoke tests             (against preview deployment)
7. E2E tests               (playwright test — only on main branch merges)
8. Deploy gate             (all above pass → promote to production)
```
