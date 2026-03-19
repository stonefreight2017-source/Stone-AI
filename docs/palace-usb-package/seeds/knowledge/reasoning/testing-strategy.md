# Testing Strategy

## Core Principle

Testing is not about coverage numbers. It's about confidence that the system works correctly where it MATTERS. Focus testing effort on the areas with the highest cost of failure: security boundaries, state transitions, and business logic.

## Testing Pyramid for Next.js + Prisma

```
                    /\
                   /  \          E2E Tests (5%)
                  /    \         — Critical user journeys only
                 /------\
                /        \       Integration Tests (25%)
               /          \      — API routes + DB + Auth
              /------------\
             /              \    Unit Tests (70%)
            /                \   — Business logic, utilities, pure functions
           /------------------\
```

### Layer 1: Unit Tests (70% of test effort)

**What to test:**
- Pure functions (calculations, transformations, validations)
- Business logic (tier permissions, pricing calculations, rate limit logic)
- Utility functions (formatters, parsers, helpers)
- Zod schemas (valid and invalid inputs)

**What NOT to test at this layer:**
- React components (test behavior, not implementation)
- Database queries (that's integration)
- API route handlers (that's integration)
- Third-party library behavior

**Example — Testing tier permissions:**
```typescript
// lib/tiers/permissions.test.ts
describe('canAccessAgent', () => {
  it('allows FREE user to access agents 1-4', () => {
    expect(canAccessAgent('FREE', 3)).toBe(true);
  });

  it('blocks FREE user from agent 5', () => {
    expect(canAccessAgent('FREE', 5)).toBe(false);
  });

  it('allows PRO user to access all 38 public agents', () => {
    expect(canAccessAgent('PRO', 42)).toBe(true);
  });

  it('blocks all users from hidden agent 44 (Chaos)', () => {
    expect(canAccessAgent('PRO', 44)).toBe(false);
  });
});
```

**Example — Testing Zod schemas:**
```typescript
// lib/schemas/subscription.test.ts
describe('SubscriptionUpdateSchema', () => {
  it('accepts valid tier change', () => {
    const result = SubscriptionUpdateSchema.safeParse({
      tier: 'SMART',
      interval: 'annual',
    });
    expect(result.success).toBe(true);
  });

  it('rejects unknown fields (.strict())', () => {
    const result = SubscriptionUpdateSchema.safeParse({
      tier: 'SMART',
      interval: 'annual',
      admin: true, // Injection attempt
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid tier', () => {
    const result = SubscriptionUpdateSchema.safeParse({
      tier: 'ULTRA_MEGA',
    });
    expect(result.success).toBe(false);
  });
});
```

### Layer 2: Integration Tests (25% of test effort)

**What to test:**
- API route handlers (request → response)
- Database operations (Prisma queries with test DB)
- Auth middleware (Clerk integration)
- Webhook handlers (Stripe webhooks)
- Service layer functions that touch multiple systems

**What NOT to test at this layer:**
- Individual UI component rendering
- Pure utility functions (that's unit)
- External service internals (mock them)

**Example — Testing an API route:**
```typescript
// app/api/agents/route.test.ts
describe('GET /api/agents', () => {
  it('returns agents for the user tier', async () => {
    // Setup: authenticated user on STARTER tier
    const req = createMockRequest({ userId: 'test-user', tier: 'STARTER' });
    const res = await GET(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.agents.length).toBeLessThanOrEqual(16);
  });

  it('returns 401 for unauthenticated requests', async () => {
    const req = createMockRequest({ userId: null });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it('does not return hidden agents', async () => {
    const req = createMockRequest({ userId: 'test-user', tier: 'PRO' });
    const res = await GET(req);
    const data = await res.json();

    const hiddenAgent = data.agents.find((a: any) => a.id === 44);
    expect(hiddenAgent).toBeUndefined();
  });
});
```

### Layer 3: E2E Tests (5% of test effort)

**What to test (ONLY critical user journeys):**
- Signup → first agent conversation → see results
- Upgrade path: FREE → STARTER (payment flow)
- Settings change that persists across sessions

**What NOT to test at this layer:**
- Every page and feature (too slow, too brittle)
- Edge cases (handle at unit/integration level)
- Visual appearance (use snapshot tests separately if needed)

**Keep E2E tests:**
- Under 10 total
- Each under 30 seconds
- Focused on the "golden path" users take

## ROI-Focused Testing Priority

Test these FIRST, in this order:

### Priority 1: Security Boundaries (HIGHEST ROI)

```
[] Auth checks on every API route
   - Unauthenticated → 401
   - Wrong tier → 403
   - Wrong user → 403 (can't access other user's data)

[] Input validation
   - Zod .strict() rejects extra fields
   - SQL injection attempts in all text inputs
   - XSS attempts in user-generated content

[] Rate limiting
   - Exceeding limits returns 429
   - Limits reset correctly after window

[] Sensitive operations
   - Billing changes require auth
   - Admin routes require admin role
   - Destructive operations require confirmation
```

### Priority 2: State Transitions

```
[] Subscription state changes
   - FREE → STARTER (correct access update)
   - STARTER → FREE (correct access revocation)
   - Monthly → Annual (correct pricing)
   - Active → Cancelled → Active (correct handling)

[] User lifecycle
   - Created → Onboarded → Active
   - Active → Churned → Reactivated

[] Bestie state
   - Created → Customized → Active
   - Active → Deleted (claims preserved on User)
```

### Priority 3: Business Logic

```
[] Pricing calculations
   - Monthly prices correct per tier
   - Annual discount applied correctly
   - Promo codes applied correctly

[] Agent access
   - Each tier sees correct agent count
   - Hidden agents truly hidden
   - Chaos only visible to founder

[] Referral logic
   - Code generation unique
   - Credit applied correctly
   - Self-referral prevented
```

### Priority 4: Error Handling

```
[] AI provider failures
   - Timeout → graceful error message
   - Rate limit → queue or fallback
   - Invalid response → safe handling

[] Database failures
   - Connection lost → retry or error
   - Constraint violation → user-friendly message

[] Payment failures
   - Card declined → clear message
   - Webhook failed → retry logic
```

## What NOT to Test

Avoid wasting time on:

```
[] Third-party library internals (Prisma, Clerk, Stripe SDK)
   - Trust they work. Test YOUR integration with them.

[] Simple getters/setters with no logic
   - No value. They can't be wrong.

[] Implementation details
   - Test BEHAVIOR not HOW it's implemented
   - "Does the function return the right value?" YES
   - "Does the function use Array.map internally?" DON'T CARE

[] CSS/Layout
   - Visual regression testing is a separate concern
   - Don't write unit tests for styling

[] Console output / logging
   - Test that the right things happen, not what gets logged
```

## Test Organization

```
project/
  __tests__/
    unit/
      lib/
        tiers/permissions.test.ts
        billing/pricing.test.ts
        schemas/validation.test.ts
    integration/
      api/
        agents.test.ts
        chat.test.ts
        billing.test.ts
    e2e/
      signup-flow.test.ts
      upgrade-flow.test.ts
```

## Testing Heuristics

```
"If this breaks, will a user notice?"
  YES → Test it
  NO → Consider skipping

"If this breaks, will we lose money?"
  YES → Test it thoroughly
  NO → Basic test is fine

"Has this broken before?"
  YES → Regression test (cover the specific failure)
  NO → Standard testing

"Is this easy to test?"
  YES → Test it (even if low risk — easy tests are free confidence)
  NO → Ask if the code should be restructured to be testable
```

## Integration

- **SOLID Principles** (especially DIP) make code testable
- **Code Smells** often indicate untestable code
- **Security seeds** define what security tests to write
- **Architecture Decisions** determine what level of testing each layer needs
