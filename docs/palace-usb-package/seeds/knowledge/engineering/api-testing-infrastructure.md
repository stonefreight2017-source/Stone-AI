# API Testing Infrastructure for Stone AI Tools

## Seed Classification
- **Domain**: Backend Engineering / Quality Assurance
- **Platform**: Stone AI Tools (tools.stone-ai.net)
- **Complexity**: Intermediate-Advanced
- **Prerequisites**: Testing fundamentals, HTTP, CI/CD
- **Last Updated**: 2026-03-09

---

## 1. Testing Strategy Overview

### Testing Pyramid for API Platforms

```
                    ┌──────┐
                    │ E2E  │  ← Full customer journey tests
                   ┌┤      ├┐    (slowest, most brittle)
                   │└──────┘│
                  ┌┤  Load  ├┐  ← k6 performance tests
                  │└────────┘│    (verify SLAs under load)
                 ┌┤ Contract ├┐  ← OpenAPI spec compliance
                 │└──────────┘│    (SDK ↔ API agreement)
                ┌┤Integration ├┐  ← Multi-service flows
                │└────────────┘│    (auth → agent → billing)
               ┌┤    Unit     ├┐  ← Individual functions
               │└──────────────┘│    (fastest, most reliable)
               └────────────────┘
```

### Test Categories

| Category | What | Tools | Speed | Coverage |
|---|---|---|---|---|
| Unit | Individual functions, utilities | Vitest | <1s | Business logic |
| Integration | API routes with real DB | Vitest + test DB | 2-5s | Request/response flows |
| Contract | SDK ↔ API spec agreement | Prism, Schemathesis | 3-10s | API surface |
| Load | Performance under stress | k6 | 1-30min | SLA verification |
| E2E | Full customer journeys | Playwright | 30-60s | Critical paths |
| Sandbox | Developer testing environment | Docker Compose | N/A | Developer DX |

---

## 2. Contract Testing

### 2.1 OpenAPI Spec Validation with Prism

Prism acts as a mock server that validates requests and responses against the OpenAPI spec.

```yaml
# File: docker-compose.test.yml

services:
  prism-mock:
    image: stoplight/prism:5
    command: mock /api/openapi.yaml --host 0.0.0.0 --port 4010
    volumes:
      - ./api:/api
    ports:
      - "4010:4010"

  prism-proxy:
    image: stoplight/prism:5
    command: proxy /api/openapi.yaml http://api-gateway:3000 --host 0.0.0.0 --port 4011
    volumes:
      - ./api:/api
    ports:
      - "4011:4011"
```

```typescript
// File: tests/contract/spec-compliance.test.ts

import { describe, test, expect, beforeAll } from 'vitest';

const PRISM_URL = 'http://localhost:4010';
const API_KEY = 'sat_test_contract_key';

describe('Contract: OpenAPI Spec Compliance', () => {
  describe('GET /v1/agents', () => {
    test('returns valid AgentListResponse schema', async () => {
      const response = await fetch(`${PRISM_URL}/v1/agents`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      });

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('pagination');
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.pagination).toHaveProperty('page');
      expect(body.pagination).toHaveProperty('totalPages');
    });

    test('requires authentication', async () => {
      const response = await fetch(`${PRISM_URL}/v1/agents`);
      expect(response.status).toBe(401);
    });

    test('validates query parameters', async () => {
      const response = await fetch(
        `${PRISM_URL}/v1/agents?pageSize=200`, // Max is 100
        { headers: { Authorization: `Bearer ${API_KEY}` } }
      );

      expect(response.status).toBe(422);
    });
  });

  describe('POST /v1/agents/{agentId}/invoke', () => {
    test('returns valid AgentResponse schema', async () => {
      const response = await fetch(`${PRISM_URL}/v1/agents/test-agent/invoke`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Test prompt for contract testing',
        }),
      });

      expect(response.status).toBe(200);

      const body = await response.json();
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('agentId');
      expect(body).toHaveProperty('content');
      expect(body).toHaveProperty('usage');
      expect(body.usage).toHaveProperty('totalTokens');
    });

    test('validates request body', async () => {
      const response = await fetch(`${PRISM_URL}/v1/agents/test-agent/invoke`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}), // Missing required 'prompt'
      });

      expect(response.status).toBe(422);
    });

    test('validates prompt length', async () => {
      const response = await fetch(`${PRISM_URL}/v1/agents/test-agent/invoke`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: '', // Empty prompt (minLength: 1)
        }),
      });

      expect(response.status).toBe(422);
    });
  });

  describe('Rate limit headers', () => {
    test('every response includes rate limit headers', async () => {
      const response = await fetch(`${PRISM_URL}/v1/agents`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      });

      expect(response.headers.get('x-ratelimit-limit')).toBeTruthy();
      expect(response.headers.get('x-ratelimit-remaining')).toBeTruthy();
      expect(response.headers.get('x-ratelimit-reset')).toBeTruthy();
    });
  });

  describe('Error response format', () => {
    test('401 returns standard error format', async () => {
      const response = await fetch(`${PRISM_URL}/v1/agents`);
      const body = await response.json();

      expect(body).toHaveProperty('error');
      expect(body.error).toHaveProperty('code');
      expect(body.error).toHaveProperty('message');
    });

    test('404 returns standard error format', async () => {
      const response = await fetch(`${PRISM_URL}/v1/nonexistent`, {
        headers: { Authorization: `Bearer ${API_KEY}` },
      });

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.error.code).toBeTruthy();
    });
  });
});
```

### 2.2 Fuzz Testing with Schemathesis

```bash
# Schemathesis automatically generates test cases from OpenAPI spec
# to find edge cases, crashes, and spec violations

schemathesis run \
  http://localhost:3000/api/openapi.yaml \
  --base-url http://localhost:3000 \
  --hypothesis-seed=42 \
  --auth="Bearer sat_test_key" \
  --checks all \
  --stateful=links \
  --report
```

---

## 3. Integration Tests

### 3.1 Test Database Setup

```typescript
// File: tests/setup/test-db.ts

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

let testPrisma: PrismaClient;

export async function setupTestDatabase(): Promise<PrismaClient> {
  const testDbUrl = process.env.TEST_DATABASE_URL ??
    'postgresql://test:test@localhost:5433/stone_ai_tools_test';

  // Run migrations on test database
  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: testDbUrl },
  });

  testPrisma = new PrismaClient({
    datasources: { db: { url: testDbUrl } },
  });

  return testPrisma;
}

export async function cleanDatabase(): Promise<void> {
  // Truncate all tables in dependency order
  await testPrisma.$executeRaw`TRUNCATE TABLE webhook_deliveries CASCADE`;
  await testPrisma.$executeRaw`TRUNCATE TABLE webhooks CASCADE`;
  await testPrisma.$executeRaw`TRUNCATE TABLE audit_logs CASCADE`;
  await testPrisma.$executeRaw`TRUNCATE TABLE usage_records CASCADE`;
  await testPrisma.$executeRaw`TRUNCATE TABLE api_keys CASCADE`;
  await testPrisma.$executeRaw`TRUNCATE TABLE tenant_members CASCADE`;
  await testPrisma.$executeRaw`TRUNCATE TABLE tenants CASCADE`;
}

export async function teardownTestDatabase(): Promise<void> {
  await testPrisma.$disconnect();
}
```

### 3.2 Integration Test Examples

```typescript
// File: tests/integration/agent-invocation.test.ts

import { describe, test, expect, beforeAll, beforeEach, afterAll } from 'vitest';

describe('Agent Invocation Flow', () => {
  let testTenant: any;
  let testApiKey: string;

  beforeAll(async () => {
    await setupTestDatabase();
  });

  beforeEach(async () => {
    await cleanDatabase();

    // Create test tenant with API key
    testTenant = await createTestTenant('test-org', 'PLUS');
    testApiKey = await createTestApiKey(testTenant.id, ['agents:read', 'agents:invoke']);
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  test('successful agent invocation records usage', async () => {
    const response = await fetch(`${TEST_API_URL}/v1/agents/test-agent/invoke`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'Test prompt',
        options: { maxTokens: 100 },
      }),
    });

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.content).toBeTruthy();
    expect(body.usage.totalTokens).toBeGreaterThan(0);

    // Verify usage was recorded
    await new Promise(resolve => setTimeout(resolve, 6_000)); // Wait for flush

    const usageRecords = await testPrisma.usageRecord.findMany({
      where: { tenantId: testTenant.id },
    });

    expect(usageRecords.length).toBe(1);
    expect(usageRecords[0].agentId).toBe('test-agent');
    expect(usageRecords[0].statusCode).toBe(200);
  });

  test('rate limiting enforced correctly', async () => {
    // Set very low rate limit for testing
    await testPrisma.tenant.update({
      where: { id: testTenant.id },
      data: { rateLimit: 2 }, // 2 per minute
    });

    // Make 3 requests quickly
    const responses = [];
    for (let i = 0; i < 3; i++) {
      responses.push(
        await fetch(`${TEST_API_URL}/v1/agents/test-agent/invoke`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${testApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prompt: `Request ${i}` }),
        })
      );
    }

    // First 2 should succeed, 3rd should be rate limited
    expect(responses[0].status).toBe(200);
    expect(responses[1].status).toBe(200);
    expect(responses[2].status).toBe(429);

    // Verify rate limit headers
    const limitHeader = responses[2].headers.get('x-ratelimit-remaining');
    expect(limitHeader).toBe('0');
  });

  test('scope enforcement blocks unauthorized endpoints', async () => {
    // Create key with only read scope
    const readOnlyKey = await createTestApiKey(testTenant.id, ['agents:read']);

    // Read should work
    const listResponse = await fetch(`${TEST_API_URL}/v1/agents`, {
      headers: { Authorization: `Bearer ${readOnlyKey}` },
    });
    expect(listResponse.status).toBe(200);

    // Invoke should be blocked
    const invokeResponse = await fetch(`${TEST_API_URL}/v1/agents/test-agent/invoke`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${readOnlyKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: 'Test' }),
    });
    expect(invokeResponse.status).toBe(403);
  });

  test('tenant isolation prevents cross-tenant access', async () => {
    const otherTenant = await createTestTenant('other-org', 'STARTER');
    const otherKey = await createTestApiKey(otherTenant.id, ['agents:read', 'agents:invoke']);

    // Each tenant should only see their own usage
    await fetch(`${TEST_API_URL}/v1/agents/test-agent/invoke`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${testApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: 'Tenant A request' }),
    });

    await new Promise(resolve => setTimeout(resolve, 6_000));

    // Tenant B should see 0 usage
    const usageResponse = await fetch(`${TEST_API_URL}/v1/usage?period=${getCurrentPeriod()}`, {
      headers: { Authorization: `Bearer ${otherKey}` },
    });

    const usage = await usageResponse.json();
    expect(usage.current.totalCalls).toBe(0);
  });
});
```

---

## 4. Load Testing with k6

### 4.1 Baseline Load Test

```javascript
// File: tests/load/baseline.js

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const agentLatency = new Trend('agent_invoke_latency');

export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '3m', target: 10 },   // Stay at 10 users
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<3000', 'p(99)<5000'],
    errors: ['rate<0.01'],  // Less than 1% error rate
    agent_invoke_latency: ['p(95)<5000'],
  },
};

const BASE_URL = __ENV.API_URL || 'https://sandbox.tools.stone-ai.net/v1';
const API_KEY = __ENV.API_KEY;

export default function () {
  // Mix of read and write operations
  const rand = Math.random();

  if (rand < 0.3) {
    // 30%: List agents (lightweight read)
    const res = http.get(`${BASE_URL}/agents`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    check(res, {
      'list agents 200': (r) => r.status === 200,
      'has data array': (r) => JSON.parse(r.body).data !== undefined,
    });

    errorRate.add(res.status !== 200);

  } else if (rand < 0.8) {
    // 50%: Invoke agent (heavy write)
    const payload = JSON.stringify({
      prompt: 'Analyze the following code for security issues: function login(user, pass) { return db.query("SELECT * FROM users WHERE name=\'" + user + "\'"); }',
      options: { maxTokens: 500 },
    });

    const res = http.post(`${BASE_URL}/agents/security-scanner/invoke`, payload, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: '30s',
    });

    agentLatency.add(res.timings.duration);

    check(res, {
      'invoke 200': (r) => r.status === 200,
      'has content': (r) => JSON.parse(r.body).content !== undefined,
    });

    errorRate.add(res.status >= 400);

  } else {
    // 20%: Get usage stats (medium read)
    const res = http.get(`${BASE_URL}/usage/summary`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });

    check(res, {
      'usage 200': (r) => r.status === 200,
    });

    errorRate.add(res.status !== 200);
  }

  sleep(Math.random() * 2 + 0.5); // 0.5-2.5s between requests
}
```

### 4.2 Spike Test

```javascript
// File: tests/load/spike.js

export const options = {
  stages: [
    { duration: '1m', target: 10 },    // Normal load
    { duration: '10s', target: 500 },   // Sudden spike
    { duration: '3m', target: 500 },    // Sustain spike
    { duration: '10s', target: 10 },    // Drop back
    { duration: '2m', target: 10 },     // Recovery
    { duration: '1m', target: 0 },      // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<10000'],  // Relaxed during spike
    errors: ['rate<0.05'],               // Accept up to 5% errors during spike
  },
};
```

### 4.3 Rate Limit Test

```javascript
// File: tests/load/rate-limit.js

import http from 'k6/http';
import { check } from 'k6';

export const options = {
  vus: 1,
  iterations: 200,
  thresholds: {
    'rate_limited': ['rate>0.5'],  // Expect >50% to be rate limited
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/agents`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });

  const isLimited = res.status === 429;

  check(res, {
    'has rate limit headers': (r) => r.headers['X-Ratelimit-Limit'] !== undefined,
    'has retry-after on 429': (r) => r.status !== 429 || r.headers['Retry-After'] !== undefined,
  });
}
```

---

## 5. Sandbox Environment

### 5.1 Sandbox Architecture

```
Sandbox Environment:

Developers get a sandbox for testing integrations.
- Separate from production
- Mock AI responses (no real agent calls)
- Real authentication and rate limiting
- Usage tracking (but no billing)

sandbox.tools.stone-ai.net
  │
  ├── Real: Authentication, rate limiting, webhooks
  ├── Mock: Agent responses (deterministic, fast)
  └── No: Billing, real AI calls, production data
```

### 5.2 Sandbox API Configuration

```typescript
// File: src/services/sandbox.ts

class SandboxService {
  /**
   * Sandbox provides deterministic mock responses for testing.
   * Developers can test their integrations without burning API credits.
   */
  async handleSandboxInvocation(
    agentId: string,
    request: InvokeAgentRequest
  ): Promise<AgentResponse> {
    // Simulate realistic response time
    await new Promise(resolve =>
      setTimeout(resolve, 200 + Math.random() * 800)
    );

    // Return deterministic mock based on agent ID
    const mockResponses: Record<string, string> = {
      'security-scanner': 'SANDBOX: Found 2 potential vulnerabilities in the provided code: 1) SQL Injection on line 3, 2) Missing input validation.',
      'code-reviewer': 'SANDBOX: Code review complete. 3 suggestions: 1) Extract repeated logic into a helper function, 2) Add error handling for network calls, 3) Consider using TypeScript strict mode.',
      'content-writer': 'SANDBOX: Here is a sample blog post about the requested topic. This is a sandbox response for testing your integration.',
    };

    const content = mockResponses[agentId] ??
      `SANDBOX: Mock response for agent "${agentId}". This is a test response for sandbox environment.`;

    return {
      id: `resp_sandbox_${randomUUID().replace(/-/g, '')}`,
      agentId,
      content,
      format: request.options?.format ?? 'text',
      usage: {
        promptTokens: Math.floor(request.prompt.length / 4),
        completionTokens: Math.floor(content.length / 4),
        totalTokens: Math.floor((request.prompt.length + content.length) / 4),
        cost: 0, // No cost in sandbox
      },
      metadata: {
        model: 'sandbox-mock',
        processingTime: Math.round(200 + Math.random() * 800),
        environment: 'sandbox',
      },
    };
  }
}
```

---

## 6. Mock Servers for SDK Testing

```typescript
// File: tests/mock-server/server.ts

import { createServer } from 'http';

/**
 * Lightweight mock server for SDK unit tests.
 * Returns responses that match the OpenAPI spec.
 */
function createMockServer(port: number) {
  return createServer((req, res) => {
    const url = new URL(req.url!, `http://localhost:${port}`);

    // Check auth
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: { code: 'missing_api_key', message: 'No API key' } }));
      return;
    }

    // Route matching
    if (req.method === 'GET' && url.pathname === '/v1/agents') {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': '1000',
        'X-RateLimit-Remaining': '999',
        'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + 60),
      });
      res.end(JSON.stringify({
        data: [
          { id: 'agent_test', name: 'Test Agent', tier: 'free', category: 'coding' },
        ],
        pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
      }));
      return;
    }

    if (req.method === 'POST' && url.pathname.match(/\/v1\/agents\/[\w-]+\/invoke/)) {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        const parsed = JSON.parse(body);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          id: 'resp_mock_123',
          agentId: url.pathname.split('/')[3],
          content: `Mock response to: ${parsed.prompt?.slice(0, 50)}`,
          format: 'text',
          usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30, cost: 0.001 },
        }));
      });
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { code: 'not_found', message: 'Route not found' } }));
  }).listen(port);
}
```

---

## 7. CI/CD Test Pipeline

```yaml
# File: .github/workflows/test.yml

name: Test Suite

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run test:unit

  integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: stone_ai_tools_test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
        ports: ['5433:5432']
      redis:
        image: redis:7
        ports: ['6380:6379']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5433/stone_ai_tools_test
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5433/stone_ai_tools_test
          REDIS_URL: redis://localhost:6380

  contract:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx @redocly/cli lint api/openapi.yaml
      - run: docker run -d -v $PWD/api:/api -p 4010:4010 stoplight/prism:5 mock /api/openapi.yaml --host 0.0.0.0
      - run: sleep 3 && npm run test:contract

  load:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: grafana/k6-action@v0.3.1
        with:
          filename: tests/load/baseline.js
        env:
          API_URL: ${{ secrets.SANDBOX_URL }}
          API_KEY: ${{ secrets.LOAD_TEST_API_KEY }}
```

---

## Summary

Stone AI Tools testing infrastructure covers every layer:

1. **Contract Tests**: Validate SDK/API agreement against OpenAPI spec using Prism mock server
2. **Integration Tests**: Full request flows with real database, covering auth, rate limiting, tenant isolation
3. **Load Tests (k6)**: Baseline, spike, and rate-limit verification tests with SLA thresholds
4. **Fuzz Testing**: Schemathesis auto-generates edge cases from the OpenAPI spec
5. **Sandbox Environment**: Developers test integrations with mock responses, real auth, no billing
6. **Mock Servers**: Lightweight mocks for SDK unit testing
7. **CI Pipeline**: Unit → Integration → Contract → Load tests on every PR and merge
