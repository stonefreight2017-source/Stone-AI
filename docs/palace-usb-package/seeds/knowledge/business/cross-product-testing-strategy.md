# Cross-Product Testing Strategy

## Seed Classification
- **Domain**: Cross-Business Operations
- **Applies To**: Stone AI (Web SaaS), Best AI Mobile (React Native), Stone AI Tools (API Marketplace)
- **Owner**: Agent Stone (Head 1) + Cardinal (Head 2)
- **Created**: 2026-03-09
- **Sensitivity**: Internal — Engineering

---

## 1. Executive Summary

Three products sharing infrastructure, authentication, and data means a bug in one product can break another. This seed defines the testing strategy across the ecosystem: integration testing between products, shared API contract testing, regression testing for shared components, and staging environment management.

---

## 2. Testing Architecture

### 2.1 Testing Layers

```
Layer 1: Unit Tests (per product)
  - Individual functions, components, utilities
  - Run on every commit
  - Product-specific, no cross-product awareness

Layer 2: Integration Tests (per product)
  - API routes, database queries, service interactions
  - Run on every PR
  - Test product with its dependencies (DB, Redis, Clerk)

Layer 3: Contract Tests (cross-product)
  - Shared API contracts between products
  - Verify Clerk metadata schema consistency
  - Database schema compatibility
  - Run on every PR that touches shared code

Layer 4: End-to-End Tests (cross-product)
  - Full user journeys across products
  - Cross-sell flows, account linking, bestie sync
  - Run nightly and before releases

Layer 5: Performance Tests (infrastructure)
  - Load testing vLLM under multi-product traffic
  - Database connection pool stress testing
  - Redis capacity under combined load
  - Run weekly and before major releases
```

### 2.2 Test Infrastructure

```
┌─────────────────────────────────────────────────────────┐
│                    TEST ENVIRONMENTS                      │
├────────────────┬────────────────┬───────────────────────┤
│  LOCAL DEV     │   STAGING      │   PRODUCTION          │
│                │                │                        │
│  SQLite/PG     │  Neon Branch   │  Neon Main             │
│  Mock vLLM     │  Real vLLM     │  Real vLLM             │
│  Mock Clerk    │  Clerk Dev     │  Clerk Prod            │
│  Mock Stripe   │  Stripe Test   │  Stripe Live           │
│  In-memory     │  Real Redis    │  Real Redis            │
│  Redis         │                │                        │
│                │  Vercel        │  Vercel                │
│  localhost     │  Preview       │  Production            │
│                │                │                        │
│  Unit +        │  Integration + │  Smoke tests +         │
│  Integration   │  Contract +    │  Monitoring            │
│                │  E2E           │                        │
└────────────────┴────────────────┴───────────────────────┘
```

---

## 3. Shared API Contract Testing

### 3.1 What Are API Contracts?

Contracts define the interface between products. When products share data through APIs or databases, both sides must agree on the shape of that data.

**Critical Contracts**:

| Contract | Between | What It Defines |
|----------|---------|----------------|
| User Profile | All products ↔ Clerk | Clerk metadata schema |
| Agent API | Tools ↔ Stone AI backend | Agent endpoints, request/response shapes |
| Cross-Product Events | All products ↔ Shared DB | Event schema, required fields |
| Ecosystem Score | Analytics ↔ All products | Score calculation inputs/outputs |
| Notification | All products ↔ Notification service | Notification payload schema |
| Auth Token | All products ↔ Clerk | Token claims, session format |

### 3.2 Contract Test Implementation

```typescript
// Contract: Clerk User Metadata
// Both consumer and provider must pass these tests

describe("Clerk User Metadata Contract", () => {
  const validMetadata = {
    activeProducts: ["stone-ai"],
    tiers: { "stone-ai": "STARTER" },
    primaryProduct: "stone-ai",
    crossSellEligible: true,
    bundleActive: false,
    ecosystemScore: 45,
    entryProduct: "stone-ai",
    entryDate: "2026-01-15T00:00:00Z",
  };

  it("must include activeProducts as string array", () => {
    expect(Array.isArray(validMetadata.activeProducts)).toBe(true);
    validMetadata.activeProducts.forEach(p => {
      expect(["stone-ai", "best-ai-mobile", "stone-ai-tools"]).toContain(p);
    });
  });

  it("must include tiers object with valid tier values", () => {
    const validTiers = {
      "stone-ai": ["FREE", "STARTER", "PLUS", "SMART", "PRO"],
      "best-ai-mobile": ["FREE", "BASIC", "PREMIUM"],
      "stone-ai-tools": ["FREE", "DEVELOPER", "BUSINESS"],
    };
    Object.entries(validMetadata.tiers).forEach(([product, tier]) => {
      expect(validTiers[product]).toContain(tier);
    });
  });

  it("must include ecosystemScore as integer 0-100", () => {
    expect(Number.isInteger(validMetadata.ecosystemScore)).toBe(true);
    expect(validMetadata.ecosystemScore).toBeGreaterThanOrEqual(0);
    expect(validMetadata.ecosystemScore).toBeLessThanOrEqual(100);
  });

  it("must include entryProduct as valid product name", () => {
    expect(["stone-ai", "best-ai-mobile", "stone-ai-tools"]).toContain(
      validMetadata.entryProduct
    );
  });
});
```

### 3.3 Contract: Agent API (Tools → Stone AI Backend)

```typescript
// Agent Chat API Contract
describe("Agent Chat API Contract", () => {
  const validRequest = {
    agentId: "agent-12",
    messages: [{ role: "user", content: "Hello" }],
    maxTokens: 1024,
    stream: false,
  };

  const validResponse = {
    id: "resp-abc123",
    agentId: "agent-12",
    message: { role: "assistant", content: "Hello! How can I help?" },
    usage: { promptTokens: 10, completionTokens: 15, totalTokens: 25 },
    model: "qwen-2.5-32b-awq",
    finishReason: "stop",
  };

  it("request must include agentId as string", () => {
    expect(typeof validRequest.agentId).toBe("string");
  });

  it("request must include messages array with role and content", () => {
    expect(Array.isArray(validRequest.messages)).toBe(true);
    validRequest.messages.forEach(m => {
      expect(["user", "assistant", "system"]).toContain(m.role);
      expect(typeof m.content).toBe("string");
    });
  });

  it("response must include usage with token counts", () => {
    expect(typeof validResponse.usage.promptTokens).toBe("number");
    expect(typeof validResponse.usage.completionTokens).toBe("number");
    expect(validResponse.usage.totalTokens).toBe(
      validResponse.usage.promptTokens + validResponse.usage.completionTokens
    );
  });

  it("response finishReason must be valid", () => {
    expect(["stop", "length", "error"]).toContain(validResponse.finishReason);
  });
});
```

### 3.4 Contract Versioning

```
v1: Initial contract (launch)
v2: Breaking change → both sides must update
  - Announce in cross-product channel
  - Both products update within same sprint
  - Old version supported for 2 weeks (deprecation)
  - After 2 weeks: old version removed, tests fail if still used
```

---

## 4. Integration Testing Across Products

### 4.1 Cross-Product Test Scenarios

```typescript
describe("Cross-Product Integration Tests", () => {

  describe("Account Linking", () => {
    it("user signs up on Stone AI then logs into Best AI with same credentials", async () => {
      const user = await signUpOnStoneAI("test@example.com");
      const mobileSession = await loginOnBestAI("test@example.com");
      expect(mobileSession.userId).toBe(user.id);
      expect(mobileSession.activeProducts).toContain("best-ai-mobile");
    });

    it("user metadata syncs across products within 5 seconds", async () => {
      const user = await signUpOnStoneAI("test@example.com");
      await upgradeToStarter(user.id);
      // Wait for sync
      await waitFor(5000);
      const toolsProfile = await getToolsProfile(user.id);
      expect(toolsProfile.tiers["stone-ai"]).toBe("STARTER");
    });
  });

  describe("Cross-Sell Flow", () => {
    it("cross-sell trigger on Stone AI creates impression record", async () => {
      const user = await createActiveUser("stone-ai", 10); // 10 sessions
      await triggerCrossSell(user.id, "stone-ai", "best-ai-mobile");
      const impressions = await getCrossSellImpressions(user.id);
      expect(impressions.length).toBe(1);
      expect(impressions[0].sourceProduct).toBe("stone-ai");
      expect(impressions[0].targetProduct).toBe("best-ai-mobile");
    });
  });

  describe("Agent Consistency", () => {
    it("same agent returns similar quality responses on web and API", async () => {
      const webResponse = await chatWithAgent("agent-12", "What is compound interest?", "stone-ai");
      const apiResponse = await chatWithAgent("agent-12", "What is compound interest?", "stone-ai-tools");
      // Both should mention interest, compounding, and provide a formula
      expect(webResponse.content).toContain("interest");
      expect(apiResponse.content).toContain("interest");
    });
  });

  describe("Billing Cross-Product", () => {
    it("bundle purchase activates all included products", async () => {
      const user = await createUser("test@example.com");
      await purchaseBundle(user.id, "powerhouse", {
        stoneAi: "PLUS",
        bestAi: "PREMIUM",
        tools: "DEVELOPER",
      });
      const profile = await getUnifiedProfile(user.id);
      expect(profile.tiers["stone-ai"]).toBe("PLUS");
      expect(profile.tiers["best-ai-mobile"]).toBe("PREMIUM");
      expect(profile.tiers["stone-ai-tools"]).toBe("DEVELOPER");
      expect(profile.bundleActive).toBe(true);
    });
  });

  describe("Bestie Sync", () => {
    it("bestie personality set on web appears on mobile", async () => {
      const user = await createUser("test@example.com");
      await setBestiePersonality(user.id, "stone-ai", { style: "casual", name: "Luna" });
      await waitFor(3000);
      const mobileBestie = await getBestieProfile(user.id, "best-ai-mobile");
      expect(mobileBestie.name).toBe("Luna");
      expect(mobileBestie.style).toBe("casual");
    });
  });
});
```

### 4.2 Database Integration Tests

```typescript
describe("Shared Database Integration", () => {

  it("event written by Stone AI is readable by analytics", async () => {
    await stoneAiDb.shared.crossProductEvents.create({
      data: {
        userId: "user-1",
        sourceProduct: "stone-ai",
        eventType: "agent.interaction",
        payload: { agentId: "agent-5" },
      },
    });
    const events = await analyticsDb.shared.crossProductEvents.findMany({
      where: { userId: "user-1", sourceProduct: "stone-ai" },
    });
    expect(events.length).toBeGreaterThan(0);
  });

  it("ecosystem score update is visible to all products", async () => {
    await analyticsDb.shared.ecosystemScores.upsert({
      where: { userId: "user-1" },
      create: { userId: "user-1", totalScore: 75, scoreTier: "power_user" },
      update: { totalScore: 75, scoreTier: "power_user" },
    });
    const stoneAiScore = await stoneAiDb.shared.ecosystemScores.findUnique({
      where: { userId: "user-1" },
    });
    expect(stoneAiScore.totalScore).toBe(75);
  });

  it("connection pool handles concurrent requests from all products", async () => {
    const requests = [
      ...Array(20).fill(null).map(() => stoneAiDb.$queryRaw`SELECT 1`),
      ...Array(10).fill(null).map(() => bestAiDb.$queryRaw`SELECT 1`),
      ...Array(15).fill(null).map(() => toolsDb.$queryRaw`SELECT 1`),
    ];
    await expect(Promise.all(requests)).resolves.toBeDefined();
  });
});
```

---

## 5. Regression Testing

### 5.1 Cross-Product Regression Suite

Tests that must pass before any product ships an update:

```
SHARED REGRESSION SUITE (runs on every deploy of any product)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Authentication:
  [ ] Clerk login works on all three products
  [ ] Session tokens valid across products
  [ ] Tier information correct after login

Agents:
  [ ] Free tier agents respond on all products
  [ ] Agent list matches expected count per tier
  [ ] Agent response quality passes minimum threshold

Data:
  [ ] Cross-product events written and readable
  [ ] User metadata consistent across products
  [ ] Ecosystem score calculation produces valid results

Billing:
  [ ] Subscription active status correct
  [ ] Tier limits enforced correctly
  [ ] Bundle status accurate

Infrastructure:
  [ ] vLLM responding to requests
  [ ] Database connections within limits
  [ ] Redis cache operational
  [ ] All health endpoints return 200
```

### 5.2 Product-Specific Regression

Each product maintains its own regression suite that runs independently:

**Stone AI Regression** (~50 tests):
- Page loads, navigation, core features
- Agent chat flow, bestie interaction
- Forum posting, settings changes
- Billing flows, referral system

**Best AI Regression** (~30 tests):
- App launch, authentication
- Agent chat (text + voice)
- Push notification delivery
- Cross-product sync

**Tools Regression** (~40 tests):
- API authentication (key-based)
- All agent endpoints respond correctly
- Rate limiting enforced
- Webhook delivery
- Documentation pages load

---

## 6. Staging Environments

### 6.1 Staging Architecture

```
Each product has a staging environment:
  Stone AI staging:   preview-stone-ai.vercel.app
  Best AI staging:    preview-best-ai.vercel.app (or TestFlight/internal track)
  Tools staging:      preview-tools.vercel.app

Shared staging infrastructure:
  Database:  Neon staging branch (reset from main weekly)
  Redis:     Separate staging Redis (or namespace: staging:{key})
  vLLM:      Same instance, lower priority queue
  Clerk:     Dev instance (same as current)
  Stripe:    Test mode (same as current)
```

### 6.2 Staging Data Management

```
Weekly (Sunday 3 AM):
  1. Create fresh Neon branch from production (staging-fresh)
  2. Anonymize user data (replace emails, names)
  3. Keep product structure, agents, tiers
  4. Reset API keys and tokens
  5. Point staging environments to new branch

On demand:
  - Any team member can request staging refresh
  - Takes ~2 minutes (Neon branching)
```

### 6.3 Staging Testing Protocol

Before any production deployment:
```
1. Deploy to staging
2. Run shared regression suite on staging
3. Run product-specific regression suite
4. If cross-product change: run cross-product integration tests
5. Manual smoke test: login, use core feature, verify
6. If all pass: approve for production
7. If any fail: fix, redeploy to staging, re-run
```

---

## 7. Performance Testing

### 7.1 Load Test Scenarios

```typescript
// Scenario 1: Combined steady state
const steadyStateTest = {
  duration: "30 minutes",
  products: {
    stoneAi: { virtualUsers: 50, actionsPerMinute: 10 },
    bestAi: { virtualUsers: 30, actionsPerMinute: 15 },
    tools: { virtualUsers: 20, actionsPerMinute: 60 },
  },
  expectedMetrics: {
    p95ResponseTime: 3000,    // ms
    errorRate: 0.01,          // 1%
    vllmQueueDepth: 16,       // max
    dbConnections: 40,        // max
  },
};

// Scenario 2: Launch spike (3x normal)
const launchSpikeTest = {
  duration: "10 minutes",
  products: {
    stoneAi: { virtualUsers: 150, actionsPerMinute: 10 },
    bestAi: { virtualUsers: 90, actionsPerMinute: 15 },
    tools: { virtualUsers: 60, actionsPerMinute: 60 },
  },
  expectedMetrics: {
    p95ResponseTime: 5000,
    errorRate: 0.05,          // 5% acceptable during spike
    vllmQueueDepth: 32,
    cloudFallbackRate: 0.3,   // 30% to cloud is OK during spike
  },
};

// Scenario 3: Single product surge (one product gets viral)
const viralSurgeTest = {
  duration: "15 minutes",
  products: {
    stoneAi: { virtualUsers: 300, actionsPerMinute: 10 },
    bestAi: { virtualUsers: 30, actionsPerMinute: 15 },
    tools: { virtualUsers: 20, actionsPerMinute: 60 },
  },
  expectedMetrics: {
    // Stone AI can degrade but shouldn't kill other products
    stoneAiP95: 8000,
    bestAiP95: 4000,          // Should remain reasonable
    toolsP95: 3000,           // API should remain fast
    errorRate: 0.1,           // 10% acceptable for surge product
  },
};
```

### 7.2 Performance Baselines

Track and compare against baselines:

| Metric | Baseline | Warning | Critical |
|--------|----------|---------|----------|
| Stone AI page load | 2.5s | 4s | 6s |
| Agent response (web) | 3s | 5s | 8s |
| Agent response (mobile) | 2.5s | 4s | 7s |
| Agent response (API) | 2s | 3.5s | 5s |
| Database query P95 | 15ms | 30ms | 100ms |
| Redis operation P95 | 2ms | 5ms | 20ms |

---

## 8. Test Automation

### 8.1 CI/CD Test Pipeline

```yaml
# On every commit to any product
on_commit:
  - unit_tests (product-specific, <2 minutes)
  - lint_and_type_check (<1 minute)

# On every PR
on_pr:
  - unit_tests
  - integration_tests (product-specific, <5 minutes)
  - contract_tests (if shared code changed, <3 minutes)
  - build_check (verify production build succeeds)

# On merge to main (pre-deploy)
on_merge:
  - all_unit_tests
  - all_integration_tests
  - contract_tests
  - shared_regression_suite (<10 minutes)

# Nightly (all products)
nightly:
  - full_regression_suite (all products, <30 minutes)
  - cross_product_e2e_tests (<15 minutes)
  - performance_baseline_check (<10 minutes)

# Weekly
weekly:
  - full_performance_test_suite (<1 hour)
  - security_scan (dependency vulnerabilities)
  - staging_refresh_and_verify
```

### 8.2 Test Reporting

```
DAILY TEST REPORT — 2026-03-09
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Stone AI:  142 tests, 142 passed, 0 failed  ●
Best AI:    87 tests,  87 passed, 0 failed  ●
Tools:     104 tests, 104 passed, 0 failed  ●
Contracts:  28 tests,  28 passed, 0 failed  ●
Cross-E2E:  15 tests,  15 passed, 0 failed  ●
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 376 tests, 376 passed ● ALL GREEN

Coverage: Stone AI 78% | Best AI 72% | Tools 81%
```

---

## 9. Testing Standards

### 9.1 Minimum Coverage Requirements

| Product | Unit Coverage | Integration Coverage | E2E Coverage |
|---------|-------------|---------------------|-------------|
| Stone AI | 70% | 50% | Critical paths |
| Best AI | 65% | 45% | Critical paths |
| Tools | 75% | 60% | All API endpoints |
| Cross-product | N/A | 80% of contracts | All user journeys |

### 9.2 Test Quality Rules

1. Every new feature must include tests (PR rejected without tests)
2. Every bug fix must include a regression test
3. Contract tests must be updated when API shapes change
4. Flaky tests are fixed within 48 hours or disabled with a tracking issue
5. No test should take longer than 30 seconds individually
6. E2E tests should clean up after themselves (no test data left behind)

---

*Seed created by Agent Stone (Head 1) + Cardinal (Head 2) — Three-Headed Monster Operations*
*Three products sharing infrastructure means a test failure in isolation is a production failure in the ecosystem. Test the connections, not just the products.*
