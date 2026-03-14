# API Gateway Architecture for Stone AI Tools

## Seed Classification
- **Domain**: Backend Engineering / Infrastructure
- **Platform**: Stone AI Tools (tools.stone-ai.net)
- **Complexity**: Advanced
- **Prerequisites**: Networking fundamentals, HTTP protocol, distributed systems
- **Last Updated**: 2026-03-09

---

## 1. Gateway Architecture Overview

### What Is an API Gateway?

An API gateway is the single entry point for all client requests to Stone AI Tools. It sits between external developers and internal agent services, handling cross-cutting concerns like authentication, rate limiting, routing, transformation, and observability.

```
Developer Request Flow:

[Developer SDK/HTTP Client]
         │
         ▼
   ┌─────────────┐
   │   CDN/Edge   │  ← TLS termination, geo-routing, DDoS mitigation
   └──────┬──────┘
          │
          ▼
   ┌─────────────┐
   │  API Gateway │  ← Auth, rate limiting, routing, transformation
   └──────┬──────┘
          │
     ┌────┴────┐
     ▼         ▼
┌─────────┐ ┌─────────┐
│ Agent   │ │ Agent   │  ← Individual agent microservices
│ Service │ │ Service │
│    A    │ │    B    │
└─────────┘ └─────────┘
```

### Core Responsibilities

| Responsibility | Description | Priority |
|---|---|---|
| Request Routing | Direct requests to correct agent service | P0 |
| Authentication | Validate API keys, JWT tokens, OAuth2 | P0 |
| Rate Limiting | Per-tenant, per-endpoint throttling | P0 |
| Load Balancing | Distribute traffic across service instances | P0 |
| Circuit Breaking | Prevent cascade failures | P1 |
| Request/Response Transform | Normalize payloads, add headers | P1 |
| Caching | Cache idempotent responses | P1 |
| Observability | Logging, tracing, metrics emission | P0 |
| Health Checks | Monitor upstream service health | P0 |
| Usage Metering | Track API calls for billing | P0 |

### Architectural Decision: Build vs Buy

For Stone AI Tools, we use a **hybrid approach**:

```
Decision Matrix:

+-------------------+----------+-------------+-----------+
| Criteria          | Custom   | Kong/Tyk    | AWS APIGW |
+-------------------+----------+-------------+-----------+
| Tenant isolation  | Full     | Plugin-based| Limited   |
| Metering control  | Full     | Partial     | Built-in  |
| Agent routing     | Custom   | Generic     | Generic   |
| Cost at scale     | Low      | Medium      | High      |
| Ops overhead      | High     | Medium      | Low       |
| Lock-in risk      | None     | Low         | High      |
+-------------------+----------+-------------+-----------+

Decision: Custom gateway on Node.js/Fastify with selective
use of Cloudflare Workers at the edge.
```

---

## 2. Gateway Design Patterns

### 2.1 Request Pipeline Architecture

Every request flows through an ordered pipeline of middleware stages. Each stage can short-circuit the pipeline (e.g., auth failure returns 401 without hitting downstream).

```typescript
// Gateway Pipeline Definition
// File: src/gateway/pipeline.ts

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface PipelineStage {
  name: string;
  priority: number; // Lower = runs first
  execute: (req: GatewayRequest, res: GatewayResponse) => Promise<PipelineResult>;
}

interface GatewayRequest {
  raw: FastifyRequest;
  tenantId: string | null;
  apiKey: string | null;
  routeMatch: RouteMatch | null;
  metadata: Record<string, unknown>;
  startTime: bigint; // process.hrtime.bigint()
}

interface PipelineResult {
  action: 'continue' | 'short-circuit' | 'transform';
  statusCode?: number;
  body?: unknown;
  headers?: Record<string, string>;
}

// Ordered pipeline stages
const PIPELINE_STAGES: PipelineStage[] = [
  { name: 'request-id',      priority: 0,  execute: assignRequestId },
  { name: 'cors',            priority: 10, execute: handleCors },
  { name: 'ip-allowlist',    priority: 20, execute: checkIpAllowlist },
  { name: 'authentication',  priority: 30, execute: authenticateRequest },
  { name: 'tenant-resolve',  priority: 40, execute: resolveTenant },
  { name: 'rate-limit',      priority: 50, execute: enforceRateLimit },
  { name: 'route-match',     priority: 60, execute: matchRoute },
  { name: 'request-validate', priority: 70, execute: validateRequest },
  { name: 'request-transform', priority: 80, execute: transformRequest },
  { name: 'metering',        priority: 85, execute: recordUsage },
  { name: 'proxy',           priority: 90, execute: proxyToUpstream },
  { name: 'response-transform', priority: 100, execute: transformResponse },
];

async function executePipeline(req: GatewayRequest, res: GatewayResponse): Promise<void> {
  const sortedStages = [...PIPELINE_STAGES].sort((a, b) => a.priority - b.priority);

  for (const stage of sortedStages) {
    const stageStart = process.hrtime.bigint();

    try {
      const result = await stage.execute(req, res);

      // Emit stage timing metric
      metrics.histogram('gateway.stage.duration_ms', {
        stage: stage.name,
        tenant: req.tenantId ?? 'unknown',
      }, Number(process.hrtime.bigint() - stageStart) / 1_000_000);

      if (result.action === 'short-circuit') {
        res.status(result.statusCode ?? 500).send(result.body);
        return;
      }
    } catch (error) {
      logger.error('Pipeline stage failed', {
        stage: stage.name,
        requestId: req.metadata.requestId,
        error: error instanceof Error ? error.message : 'Unknown',
      });

      res.status(502).send({
        error: 'gateway_error',
        message: 'An internal gateway error occurred',
        requestId: req.metadata.requestId,
      });
      return;
    }
  }
}
```

### 2.2 Request ID Assignment

Every request gets a unique, traceable ID at the gateway edge before any processing occurs.

```typescript
// File: src/gateway/stages/request-id.ts

import { randomUUID } from 'crypto';

async function assignRequestId(req: GatewayRequest): Promise<PipelineResult> {
  // Honor client-provided request ID if present (for idempotency tracking)
  const clientRequestId = req.raw.headers['x-request-id'] as string | undefined;

  // Generate gateway request ID
  const gatewayRequestId = `gw_${randomUUID().replace(/-/g, '')}`;

  req.metadata.requestId = gatewayRequestId;
  req.metadata.clientRequestId = clientRequestId ?? null;
  req.metadata.receivedAt = new Date().toISOString();

  // Set response headers early
  req.metadata.responseHeaders = {
    'x-request-id': gatewayRequestId,
    'x-gateway-region': process.env.GATEWAY_REGION ?? 'us-east-1',
  };

  return { action: 'continue' };
}
```

### 2.3 The Sidecar Pattern for Agent Services

Each agent service runs with a sidecar that handles service mesh concerns:

```
┌────────────────────────────────────┐
│          Pod / Container Group      │
│                                    │
│  ┌──────────────┐  ┌────────────┐ │
│  │ Agent Service │  │  Sidecar   │ │
│  │              │◄─┤            │ │
│  │  - Business  │  │ - mTLS     │ │
│  │    logic     │  │ - Health   │ │
│  │  - Agent AI  │  │ - Metrics  │ │
│  │    calls     │  │ - Tracing  │ │
│  │              │  │ - Retry    │ │
│  └──────────────┘  └────────────┘ │
│                                    │
└────────────────────────────────────┘
```

---

## 3. Rate Limiting Per Tenant

### 3.1 Multi-Tier Rate Limiting Strategy

Stone AI Tools implements rate limiting at multiple layers to protect both the platform and individual tenants.

```
Rate Limit Layers:

Layer 1: Global (Edge/CDN)
  └── Protects entire platform from DDoS
  └── 10,000 req/sec global ceiling

Layer 2: Per-Tenant (Gateway)
  └── Enforces plan-based limits
  └── FREE: 100 req/min, STARTER: 1,000 req/min
  └── PLUS: 5,000 req/min, PRO: 20,000 req/min

Layer 3: Per-Endpoint (Gateway)
  └── Different limits for different agent APIs
  └── Expensive agents (SMART tier) have lower limits

Layer 4: Per-User Burst (Gateway)
  └── Short burst protection (10-second window)
  └── Prevents individual API key abuse
```

### 3.2 Token Bucket Implementation with Redis

```typescript
// File: src/gateway/rate-limiter/token-bucket.ts

import Redis from 'ioredis';

interface RateLimitConfig {
  maxTokens: number;       // Bucket capacity
  refillRate: number;      // Tokens added per second
  refillInterval: number;  // Refill check interval (ms)
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;         // Unix timestamp
  retryAfter: number;      // Seconds until retry
  limit: number;           // Total limit
}

const TIER_LIMITS: Record<string, RateLimitConfig> = {
  free:    { maxTokens: 100,   refillRate: 2,    refillInterval: 1000 },
  starter: { maxTokens: 1000,  refillRate: 17,   refillInterval: 1000 },
  plus:    { maxTokens: 5000,  refillRate: 84,   refillInterval: 1000 },
  pro:     { maxTokens: 20000, refillRate: 334,  refillInterval: 1000 },
};

// Lua script for atomic token bucket operation
const TOKEN_BUCKET_SCRIPT = `
  local key = KEYS[1]
  local max_tokens = tonumber(ARGV[1])
  local refill_rate = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])
  local requested = tonumber(ARGV[4])

  -- Get current bucket state
  local bucket = redis.call('HMGET', key, 'tokens', 'last_refill')
  local tokens = tonumber(bucket[1])
  local last_refill = tonumber(bucket[2])

  -- Initialize if new bucket
  if tokens == nil then
    tokens = max_tokens
    last_refill = now
  end

  -- Calculate refill
  local elapsed = now - last_refill
  local refill = math.floor(elapsed * refill_rate / 1000)
  tokens = math.min(max_tokens, tokens + refill)

  -- Check if request can be fulfilled
  local allowed = 0
  if tokens >= requested then
    tokens = tokens - requested
    allowed = 1
  end

  -- Update bucket
  redis.call('HMSET', key, 'tokens', tokens, 'last_refill', now)
  redis.call('EXPIRE', key, 3600) -- TTL: 1 hour of inactivity

  -- Calculate reset time
  local deficit = max_tokens - tokens
  local reset_ms = math.ceil(deficit / refill_rate * 1000)

  return {allowed, tokens, now + reset_ms, math.ceil((requested - tokens) / refill_rate)}
`;

class TokenBucketRateLimiter {
  private redis: Redis;
  private scriptSha: string | null = null;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async initialize(): Promise<void> {
    this.scriptSha = await this.redis.script('LOAD', TOKEN_BUCKET_SCRIPT) as string;
  }

  async checkLimit(
    tenantId: string,
    tier: string,
    endpoint?: string
  ): Promise<RateLimitResult> {
    const config = TIER_LIMITS[tier] ?? TIER_LIMITS.free;
    const key = endpoint
      ? `ratelimit:${tenantId}:${endpoint}`
      : `ratelimit:${tenantId}:global`;

    const now = Date.now();

    const result = await this.redis.evalsha(
      this.scriptSha!,
      1,
      key,
      config.maxTokens,
      config.refillRate,
      now,
      1 // requesting 1 token
    ) as number[];

    const [allowed, remaining, resetAt, retryAfter] = result;

    return {
      allowed: allowed === 1,
      remaining,
      resetAt: Math.ceil(resetAt / 1000),
      retryAfter: Math.max(0, retryAfter),
      limit: config.maxTokens,
    };
  }
}
```

### 3.3 Rate Limit Response Headers

Every response includes rate limit information so developers can implement client-side throttling:

```typescript
// File: src/gateway/stages/rate-limit-headers.ts

function setRateLimitHeaders(
  res: GatewayResponse,
  result: RateLimitResult
): void {
  // Standard headers (RFC 6585 + draft-ietf-httpapi-ratelimit-headers)
  res.setHeader('X-RateLimit-Limit', result.limit.toString());
  res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
  res.setHeader('X-RateLimit-Reset', result.resetAt.toString());

  // Draft standard headers (newer format)
  res.setHeader('RateLimit-Limit', result.limit.toString());
  res.setHeader('RateLimit-Remaining', result.remaining.toString());
  res.setHeader('RateLimit-Reset', result.resetAt.toString());

  if (!result.allowed) {
    res.setHeader('Retry-After', result.retryAfter.toString());
  }
}

// 429 response body format
interface RateLimitExceeded {
  error: 'rate_limit_exceeded';
  message: string;
  limit: number;
  remaining: 0;
  reset_at: string;      // ISO 8601
  retry_after: number;   // seconds
  upgrade_url: string;   // Link to upgrade plan
  docs_url: string;      // Link to rate limit docs
}

function buildRateLimitResponse(result: RateLimitResult, tier: string): RateLimitExceeded {
  return {
    error: 'rate_limit_exceeded',
    message: `Rate limit exceeded for ${tier} tier. Upgrade for higher limits.`,
    limit: result.limit,
    remaining: 0,
    reset_at: new Date(result.resetAt * 1000).toISOString(),
    retry_after: result.retryAfter,
    upgrade_url: 'https://tools.stone-ai.net/pricing',
    docs_url: 'https://tools.stone-ai.net/docs/rate-limits',
  };
}
```

### 3.4 Sliding Window Rate Limiting (Alternative)

For endpoints requiring more precise rate limiting (e.g., expensive AI agent calls):

```typescript
// Sliding window counter using Redis sorted sets
const SLIDING_WINDOW_SCRIPT = `
  local key = KEYS[1]
  local window_ms = tonumber(ARGV[1])
  local max_requests = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])
  local request_id = ARGV[4]

  -- Remove expired entries
  redis.call('ZREMRANGEBYSCORE', key, 0, now - window_ms)

  -- Count current requests in window
  local count = redis.call('ZCARD', key)

  if count < max_requests then
    -- Add this request
    redis.call('ZADD', key, now, request_id)
    redis.call('EXPIRE', key, math.ceil(window_ms / 1000) + 1)
    return {1, max_requests - count - 1}
  else
    -- Get oldest entry to calculate retry time
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    local retry_after = oldest[2] + window_ms - now
    return {0, retry_after}
  end
`;
```

---

## 4. Request Routing

### 4.1 Route Configuration

Routes map incoming API paths to upstream agent services. Each route includes metadata for rate limiting, authentication requirements, and transformation rules.

```typescript
// File: src/gateway/routing/route-config.ts

interface RouteDefinition {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  pattern: string;             // Express-style path pattern
  upstream: UpstreamConfig;
  auth: AuthRequirement;
  rateLimit: EndpointRateLimit;
  cache?: CacheConfig;
  transform?: TransformConfig;
  version: string;             // API version this route belongs to
  deprecated?: boolean;
  sunset?: string;             // ISO date when route will be removed
  agentTier: AgentTier;        // Which subscription tier can access
}

interface UpstreamConfig {
  service: string;             // Service name in registry
  path: string;                // Path to forward to
  timeout: number;             // Request timeout in ms
  retries: number;             // Retry count on failure
  retryOn: number[];           // HTTP codes to retry on
  circuitBreaker: CircuitBreakerConfig;
}

interface EndpointRateLimit {
  windowMs: number;
  maxRequests: Record<string, number>; // Per tier
}

// Example route definitions
const AGENT_ROUTES: RouteDefinition[] = [
  {
    id: 'invoke-agent',
    method: 'POST',
    pattern: '/v1/agents/:agentId/invoke',
    upstream: {
      service: 'agent-executor',
      path: '/internal/execute/:agentId',
      timeout: 30_000,
      retries: 1,
      retryOn: [502, 503],
      circuitBreaker: {
        enabled: true,
        threshold: 5,
        resetTimeout: 30_000,
      },
    },
    auth: { type: 'api_key', scopes: ['agents:invoke'] },
    rateLimit: {
      windowMs: 60_000,
      maxRequests: { free: 10, starter: 100, plus: 500, pro: 2000 },
    },
    version: 'v1',
    agentTier: 'free',
  },
  {
    id: 'invoke-smart-agent',
    method: 'POST',
    pattern: '/v1/agents/smart/:agentId/invoke',
    upstream: {
      service: 'smart-agent-executor',
      path: '/internal/execute/smart/:agentId',
      timeout: 120_000,     // Smart agents get longer timeout
      retries: 0,           // No retries for expensive calls
      retryOn: [],
      circuitBreaker: {
        enabled: true,
        threshold: 3,
        resetTimeout: 60_000,
      },
    },
    auth: { type: 'api_key', scopes: ['agents:invoke', 'smart:access'] },
    rateLimit: {
      windowMs: 60_000,
      maxRequests: { free: 0, starter: 5, plus: 50, pro: 200 },
    },
    version: 'v1',
    agentTier: 'smart',
  },
  {
    id: 'list-agents',
    method: 'GET',
    pattern: '/v1/agents',
    upstream: {
      service: 'agent-catalog',
      path: '/internal/agents',
      timeout: 5_000,
      retries: 2,
      retryOn: [502, 503, 504],
      circuitBreaker: {
        enabled: true,
        threshold: 10,
        resetTimeout: 15_000,
      },
    },
    auth: { type: 'api_key', scopes: ['agents:read'] },
    rateLimit: {
      windowMs: 60_000,
      maxRequests: { free: 60, starter: 300, plus: 1000, pro: 5000 },
    },
    cache: {
      enabled: true,
      ttl: 300,         // 5 minutes
      varyBy: ['tenant', 'query'],
    },
    version: 'v1',
    agentTier: 'free',
  },
];
```

### 4.2 Path Matching and Parameter Extraction

```typescript
// File: src/gateway/routing/matcher.ts

import { pathToRegexp, match } from 'path-to-regexp';

interface RouteMatch {
  route: RouteDefinition;
  params: Record<string, string>;
  query: Record<string, string>;
}

class RouteMatcher {
  private compiledRoutes: Array<{
    route: RouteDefinition;
    matcher: ReturnType<typeof match>;
  }>;

  constructor(routes: RouteDefinition[]) {
    // Sort routes: more specific patterns first
    const sorted = [...routes].sort((a, b) => {
      const aSegments = a.pattern.split('/').length;
      const bSegments = b.pattern.split('/').length;
      if (aSegments !== bSegments) return bSegments - aSegments;
      // Static segments before parameterized ones
      const aParams = (a.pattern.match(/:/g) || []).length;
      const bParams = (b.pattern.match(/:/g) || []).length;
      return aParams - bParams;
    });

    this.compiledRoutes = sorted.map(route => ({
      route,
      matcher: match(route.pattern, { decode: decodeURIComponent }),
    }));
  }

  match(method: string, path: string): RouteMatch | null {
    for (const { route, matcher } of this.compiledRoutes) {
      if (route.method !== method) continue;

      const result = matcher(path);
      if (result) {
        return {
          route,
          params: result.params as Record<string, string>,
          query: {},
        };
      }
    }
    return null;
  }
}
```

### 4.3 Version-Based Routing

```typescript
// File: src/gateway/routing/version-router.ts

class VersionRouter {
  private routesByVersion: Map<string, RouteMatcher> = new Map();

  registerVersion(version: string, routes: RouteDefinition[]): void {
    this.routesByVersion.set(version, new RouteMatcher(routes));
  }

  resolve(method: string, path: string, headers: Record<string, string>): RouteMatch | null {
    // Strategy 1: URL path versioning (preferred)
    // /v1/agents/... → version = "v1"
    const urlVersionMatch = path.match(/^\/(v\d+)\//);
    if (urlVersionMatch) {
      const version = urlVersionMatch[1];
      const matcher = this.routesByVersion.get(version);
      if (matcher) {
        return matcher.match(method, path);
      }
    }

    // Strategy 2: Header versioning (fallback)
    // X-API-Version: 2024-01-15
    const headerVersion = headers['x-api-version'];
    if (headerVersion) {
      const mappedVersion = this.mapDateToVersion(headerVersion);
      const matcher = this.routesByVersion.get(mappedVersion);
      if (matcher) {
        const strippedPath = path.replace(/^\/v\d+/, '');
        return matcher.match(method, `/v${mappedVersion}${strippedPath}`);
      }
    }

    // Default: latest stable version
    const latestVersion = this.getLatestStableVersion();
    const matcher = this.routesByVersion.get(latestVersion);
    return matcher?.match(method, `/${latestVersion}${path}`) ?? null;
  }

  private mapDateToVersion(dateStr: string): string {
    // Map date-based versions to internal version numbers
    const versionMap: Record<string, string> = {
      '2025-01-01': 'v1',
      '2025-06-01': 'v2',
      '2026-01-01': 'v3',
    };

    // Find the latest version that doesn't exceed the requested date
    const sorted = Object.entries(versionMap)
      .sort(([a], [b]) => b.localeCompare(a));

    for (const [date, version] of sorted) {
      if (dateStr >= date) return version;
    }

    return 'v1';
  }

  private getLatestStableVersion(): string {
    const versions = [...this.routesByVersion.keys()].sort();
    return versions[versions.length - 1] ?? 'v1';
  }
}
```

---

## 5. Load Balancing

### 5.1 Load Balancing Strategies

```typescript
// File: src/gateway/balancer/strategies.ts

interface ServiceInstance {
  id: string;
  host: string;
  port: number;
  weight: number;
  healthy: boolean;
  activeConnections: number;
  responseTime: number;  // Rolling average in ms
  region: string;
}

// Strategy: Weighted Round Robin
class WeightedRoundRobin {
  private currentIndex = 0;
  private currentWeight = 0;

  select(instances: ServiceInstance[]): ServiceInstance | null {
    const healthy = instances.filter(i => i.healthy);
    if (healthy.length === 0) return null;

    const maxWeight = Math.max(...healthy.map(i => i.weight));
    const gcdWeight = this.gcd(healthy.map(i => i.weight));

    while (true) {
      this.currentIndex = (this.currentIndex + 1) % healthy.length;
      if (this.currentIndex === 0) {
        this.currentWeight -= gcdWeight;
        if (this.currentWeight <= 0) {
          this.currentWeight = maxWeight;
        }
      }

      if (healthy[this.currentIndex].weight >= this.currentWeight) {
        return healthy[this.currentIndex];
      }
    }
  }

  private gcd(values: number[]): number {
    return values.reduce((a, b) => {
      while (b) { [a, b] = [b, a % b]; }
      return a;
    });
  }
}

// Strategy: Least Connections
class LeastConnections {
  select(instances: ServiceInstance[]): ServiceInstance | null {
    const healthy = instances.filter(i => i.healthy);
    if (healthy.length === 0) return null;

    return healthy.reduce((min, inst) =>
      inst.activeConnections < min.activeConnections ? inst : min
    );
  }
}

// Strategy: Weighted Least Response Time
class WeightedLeastResponseTime {
  select(instances: ServiceInstance[]): ServiceInstance | null {
    const healthy = instances.filter(i => i.healthy);
    if (healthy.length === 0) return null;

    // Score = responseTime / weight (lower is better)
    return healthy.reduce((best, inst) => {
      const instScore = inst.responseTime / inst.weight;
      const bestScore = best.responseTime / best.weight;
      return instScore < bestScore ? inst : best;
    });
  }
}

// Strategy: Consistent Hashing (for sticky sessions / caching)
class ConsistentHash {
  private ring: Map<number, ServiceInstance> = new Map();
  private sortedKeys: number[] = [];
  private virtualNodes = 150; // Virtual nodes per instance

  rebuild(instances: ServiceInstance[]): void {
    this.ring.clear();
    const healthy = instances.filter(i => i.healthy);

    for (const inst of healthy) {
      for (let i = 0; i < this.virtualNodes; i++) {
        const hash = this.hash(`${inst.id}:${i}`);
        this.ring.set(hash, inst);
      }
    }

    this.sortedKeys = [...this.ring.keys()].sort((a, b) => a - b);
  }

  select(key: string): ServiceInstance | null {
    if (this.sortedKeys.length === 0) return null;

    const hash = this.hash(key);

    // Binary search for the first key >= hash
    let low = 0;
    let high = this.sortedKeys.length - 1;

    while (low < high) {
      const mid = (low + high) >>> 1;
      if (this.sortedKeys[mid] < hash) low = mid + 1;
      else high = mid;
    }

    // Wrap around if past the last key
    const ringKey = this.sortedKeys[low] ?? this.sortedKeys[0];
    return this.ring.get(ringKey) ?? null;
  }

  private hash(input: string): number {
    let hash = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = (hash * 0x01000193) >>> 0;
    }
    return hash;
  }
}
```

### 5.2 Load Balancer Selection Per Route

```typescript
// Different routes use different balancing strategies
const ROUTE_BALANCER_MAP: Record<string, LoadBalancerStrategy> = {
  // Agent invocations: least connections (distribute compute evenly)
  'invoke-agent': 'least-connections',
  'invoke-smart-agent': 'least-connections',

  // Catalog reads: round robin with caching (stateless, cacheable)
  'list-agents': 'weighted-round-robin',
  'get-agent': 'weighted-round-robin',

  // Streaming responses: consistent hash (maintains connection context)
  'stream-agent': 'consistent-hash',

  // Webhook delivery: weighted least response time
  'webhook-deliver': 'weighted-least-response-time',
};
```

---

## 6. Circuit Breakers

### 6.1 Circuit Breaker State Machine

```
Circuit Breaker States:

    ┌──────────────────────────────────────┐
    │                                      │
    ▼                                      │
┌────────┐  failure threshold  ┌────────┐  │
│ CLOSED │ ─────────────────► │  OPEN  │  │
│        │                    │        │  │
│ Normal │                    │ Reject │  │
│ traffic│                    │  all   │  │
└────────┘                    └───┬────┘  │
    ▲                             │       │
    │                        timeout      │
    │                             │       │
    │    success    ┌─────────────▼─┐     │
    └───────────────┤  HALF-OPEN    ├─────┘
                    │               │  failure
                    │ Allow limited │
                    │ test traffic  │
                    └───────────────┘
```

### 6.2 Implementation

```typescript
// File: src/gateway/circuit-breaker/breaker.ts

enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open',
}

interface CircuitBreakerConfig {
  failureThreshold: number;     // Failures before opening
  resetTimeout: number;         // Ms before trying half-open
  halfOpenMaxCalls: number;     // Concurrent calls allowed in half-open
  successThreshold: number;     // Successes in half-open before closing
  monitorWindow: number;        // Window for counting failures (ms)
  failureRateThreshold: number; // Percentage (0-100)
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number[] = [];  // Timestamps of failures
  private successes = 0;
  private halfOpenCalls = 0;
  private lastStateChange = Date.now();
  private config: CircuitBreakerConfig;

  constructor(
    private serviceName: string,
    config: Partial<CircuitBreakerConfig> = {}
  ) {
    this.config = {
      failureThreshold: config.failureThreshold ?? 5,
      resetTimeout: config.resetTimeout ?? 30_000,
      halfOpenMaxCalls: config.halfOpenMaxCalls ?? 3,
      successThreshold: config.successThreshold ?? 3,
      monitorWindow: config.monitorWindow ?? 60_000,
      failureRateThreshold: config.failureRateThreshold ?? 50,
    };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.canExecute()) {
      metrics.counter('circuit_breaker.rejected', { service: this.serviceName });
      throw new CircuitOpenError(
        this.serviceName,
        this.estimateRecoveryTime()
      );
    }

    if (this.state === CircuitState.HALF_OPEN) {
      this.halfOpenCalls++;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private canExecute(): boolean {
    switch (this.state) {
      case CircuitState.CLOSED:
        return true;

      case CircuitState.OPEN:
        // Check if reset timeout has elapsed
        if (Date.now() - this.lastStateChange >= this.config.resetTimeout) {
          this.transitionTo(CircuitState.HALF_OPEN);
          return true;
        }
        return false;

      case CircuitState.HALF_OPEN:
        return this.halfOpenCalls < this.config.halfOpenMaxCalls;
    }
  }

  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      this.halfOpenCalls--;

      if (this.successes >= this.config.successThreshold) {
        this.transitionTo(CircuitState.CLOSED);
      }
    }

    // Clean old failure records
    this.pruneFailures();
  }

  private onFailure(): void {
    const now = Date.now();
    this.failures.push(now);
    this.pruneFailures();

    if (this.state === CircuitState.HALF_OPEN) {
      this.transitionTo(CircuitState.OPEN);
      return;
    }

    if (this.state === CircuitState.CLOSED) {
      const recentFailures = this.failures.length;
      if (recentFailures >= this.config.failureThreshold) {
        this.transitionTo(CircuitState.OPEN);
      }
    }
  }

  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChange = Date.now();

    // Reset counters on state change
    if (newState === CircuitState.HALF_OPEN) {
      this.successes = 0;
      this.halfOpenCalls = 0;
    } else if (newState === CircuitState.CLOSED) {
      this.failures = [];
      this.successes = 0;
    }

    logger.warn('Circuit breaker state change', {
      service: this.serviceName,
      from: oldState,
      to: newState,
    });

    metrics.gauge('circuit_breaker.state', {
      service: this.serviceName,
      state: newState,
    }, newState === CircuitState.OPEN ? 1 : 0);
  }

  private pruneFailures(): void {
    const cutoff = Date.now() - this.config.monitorWindow;
    this.failures = this.failures.filter(t => t > cutoff);
  }

  private estimateRecoveryTime(): number {
    const elapsed = Date.now() - this.lastStateChange;
    return Math.max(0, this.config.resetTimeout - elapsed);
  }

  getState(): CircuitState {
    return this.state;
  }
}

class CircuitOpenError extends Error {
  constructor(
    public serviceName: string,
    public retryAfter: number
  ) {
    super(`Circuit breaker open for ${serviceName}. Retry after ${retryAfter}ms`);
    this.name = 'CircuitOpenError';
  }
}
```

### 6.3 Circuit Breaker Registry

```typescript
// File: src/gateway/circuit-breaker/registry.ts

class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreaker>();

  getOrCreate(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    let breaker = this.breakers.get(serviceName);
    if (!breaker) {
      breaker = new CircuitBreaker(serviceName, config);
      this.breakers.set(serviceName, breaker);
    }
    return breaker;
  }

  getStatus(): Record<string, { state: string; service: string }> {
    const status: Record<string, { state: string; service: string }> = {};
    for (const [name, breaker] of this.breakers) {
      status[name] = {
        service: name,
        state: breaker.getState(),
      };
    }
    return status;
  }

  // Expose for admin dashboard
  forceOpen(serviceName: string): void {
    const breaker = this.breakers.get(serviceName);
    if (breaker) {
      // Used for manual circuit breaking during incidents
      (breaker as any).transitionTo(CircuitState.OPEN);
    }
  }
}
```

---

## 7. Health Checks

### 7.1 Multi-Layer Health Check System

```typescript
// File: src/gateway/health/checker.ts

interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latency: number;
  lastCheck: string;
  details?: Record<string, unknown>;
}

interface GatewayHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  timestamp: string;
  checks: HealthCheckResult[];
}

class HealthChecker {
  private checkIntervalMs = 10_000; // Check every 10 seconds
  private results = new Map<string, HealthCheckResult>();
  private timer: NodeJS.Timeout | null = null;

  constructor(private services: ServiceRegistry) {}

  start(): void {
    this.timer = setInterval(() => this.runAllChecks(), this.checkIntervalMs);
    this.runAllChecks(); // Run immediately
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
  }

  async runAllChecks(): Promise<void> {
    const services = this.services.getAllInstances();

    await Promise.allSettled(
      services.map(async (service) => {
        const result = await this.checkService(service);
        this.results.set(service.id, result);

        // Update service health in registry
        this.services.updateHealth(service.id, result.status === 'healthy');
      })
    );
  }

  private async checkService(service: ServiceInstance): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      const response = await fetch(
        `http://${service.host}:${service.port}/health`,
        {
          method: 'GET',
          signal: AbortSignal.timeout(5_000),
          headers: { 'X-Health-Check': 'gateway' },
        }
      );

      const latency = Date.now() - start;

      if (response.ok) {
        const body = await response.json();
        return {
          service: service.id,
          status: latency > 3000 ? 'degraded' : 'healthy',
          latency,
          lastCheck: new Date().toISOString(),
          details: body,
        };
      }

      return {
        service: service.id,
        status: response.status >= 500 ? 'unhealthy' : 'degraded',
        latency,
        lastCheck: new Date().toISOString(),
        details: { statusCode: response.status },
      };
    } catch (error) {
      return {
        service: service.id,
        status: 'unhealthy',
        latency: Date.now() - start,
        lastCheck: new Date().toISOString(),
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      };
    }
  }

  getGatewayHealth(): GatewayHealth {
    const checks = [...this.results.values()];
    const unhealthyCount = checks.filter(c => c.status === 'unhealthy').length;
    const degradedCount = checks.filter(c => c.status === 'degraded').length;

    let status: GatewayHealth['status'] = 'healthy';
    if (unhealthyCount > 0) status = 'unhealthy';
    else if (degradedCount > 0) status = 'degraded';

    return {
      status,
      version: process.env.GATEWAY_VERSION ?? '0.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      checks,
    };
  }
}
```

### 7.2 Liveness vs Readiness Probes

```typescript
// File: src/gateway/health/probes.ts

// Liveness: Is the gateway process alive?
// Returns 200 if process is running, regardless of upstream health
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'alive',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Readiness: Can the gateway accept traffic?
// Returns 200 only if critical dependencies are available
app.get('/readyz', async (req, res) => {
  const health = healthChecker.getGatewayHealth();

  // Gateway is ready only if core services are healthy
  const criticalServices = ['agent-executor', 'auth-service', 'billing-service'];
  const criticalChecks = health.checks.filter(c =>
    criticalServices.some(s => c.service.startsWith(s))
  );

  const allCriticalHealthy = criticalChecks.every(c => c.status !== 'unhealthy');

  if (allCriticalHealthy) {
    res.status(200).json(health);
  } else {
    res.status(503).json(health);
  }
});

// Detailed health: Full status for monitoring dashboards
app.get('/health/detailed', (req, res) => {
  // Require admin authentication for detailed health
  if (!isAdminRequest(req)) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const health = healthChecker.getGatewayHealth();
  const circuitBreakers = circuitBreakerRegistry.getStatus();
  const rateLimitStats = rateLimiter.getStats();

  res.status(200).json({
    ...health,
    circuitBreakers,
    rateLimitStats,
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
  });
});
```

---

## 8. Request/Response Transformation

### 8.1 Request Transformation Pipeline

```typescript
// File: src/gateway/transform/request.ts

interface TransformConfig {
  addHeaders?: Record<string, string>;
  removeHeaders?: string[];
  pathRewrite?: Record<string, string>;
  bodyTransform?: 'passthrough' | 'wrap' | 'custom';
  queryTransform?: Record<string, string>;
}

async function transformRequest(req: GatewayRequest): Promise<PipelineResult> {
  const transform = req.routeMatch?.route.transform;
  if (!transform) return { action: 'continue' };

  // Add internal headers for upstream services
  const upstreamHeaders: Record<string, string> = {
    'x-tenant-id': req.tenantId!,
    'x-request-id': req.metadata.requestId as string,
    'x-forwarded-for': req.raw.ip,
    'x-gateway-timestamp': Date.now().toString(),
    'x-api-version': req.routeMatch!.route.version,
    ...(transform.addHeaders ?? {}),
  };

  // Remove headers that shouldn't reach upstream
  const headersToRemove = [
    'authorization',  // Re-injected as internal auth
    'host',
    ...(transform.removeHeaders ?? []),
  ];

  // Apply path rewrite
  let upstreamPath = req.routeMatch!.route.upstream.path;
  for (const [param, value] of Object.entries(req.routeMatch!.params)) {
    upstreamPath = upstreamPath.replace(`:${param}`, value);
  }

  req.metadata.upstreamHeaders = upstreamHeaders;
  req.metadata.upstreamPath = upstreamPath;
  req.metadata.headersToRemove = headersToRemove;

  return { action: 'continue' };
}
```

### 8.2 Response Transformation

```typescript
// File: src/gateway/transform/response.ts

async function transformResponse(req: GatewayRequest, res: GatewayResponse): Promise<PipelineResult> {
  // Add standard Stone AI Tools response headers
  const responseHeaders: Record<string, string> = {
    'x-request-id': req.metadata.requestId as string,
    'x-response-time': `${Date.now() - Number(req.startTime)}ms`,
    'x-powered-by': 'Stone AI Tools',
    'x-api-version': req.routeMatch?.route.version ?? 'unknown',
  };

  // Add deprecation headers if applicable
  if (req.routeMatch?.route.deprecated) {
    responseHeaders['Deprecation'] = 'true';
    responseHeaders['Sunset'] = req.routeMatch.route.sunset ?? '';
    responseHeaders['Link'] = `<https://tools.stone-ai.net/docs/migration>; rel="successor-version"`;
  }

  // Wrap error responses in standard format
  if (res.statusCode >= 400) {
    const body = res.getBody();
    const standardError = {
      error: {
        code: getErrorCode(res.statusCode),
        message: body?.message ?? getDefaultMessage(res.statusCode),
        request_id: req.metadata.requestId,
        docs_url: `https://tools.stone-ai.net/docs/errors/${getErrorCode(res.statusCode)}`,
      },
    };

    res.setBody(standardError);
  }

  for (const [key, value] of Object.entries(responseHeaders)) {
    res.setHeader(key, value);
  }

  return { action: 'continue' };
}
```

---

## 9. Gateway Caching

### 9.1 Response Cache with Redis

```typescript
// File: src/gateway/cache/response-cache.ts

interface CacheConfig {
  enabled: boolean;
  ttl: number;          // Seconds
  varyBy: string[];     // Fields to include in cache key
  maxSize?: number;     // Max cached response size in bytes
  staleWhileRevalidate?: number; // Serve stale while refreshing
}

class ResponseCache {
  constructor(private redis: Redis) {}

  async get(req: GatewayRequest): Promise<CachedResponse | null> {
    const cacheConfig = req.routeMatch?.route.cache;
    if (!cacheConfig?.enabled) return null;

    // Only cache GET requests
    if (req.raw.method !== 'GET') return null;

    const key = this.buildCacheKey(req, cacheConfig.varyBy);
    const cached = await this.redis.get(key);

    if (!cached) return null;

    const parsed: CachedResponse = JSON.parse(cached);

    // Check stale-while-revalidate
    const age = Date.now() - parsed.cachedAt;
    const maxAge = cacheConfig.ttl * 1000;
    const staleWindow = (cacheConfig.staleWhileRevalidate ?? 0) * 1000;

    if (age > maxAge + staleWindow) {
      // Too stale, delete and miss
      await this.redis.del(key);
      return null;
    }

    if (age > maxAge) {
      // Stale but within revalidate window — serve stale, trigger background refresh
      parsed.isStale = true;
    }

    parsed.headers['x-cache'] = parsed.isStale ? 'STALE' : 'HIT';
    parsed.headers['age'] = Math.floor(age / 1000).toString();

    return parsed;
  }

  async set(req: GatewayRequest, response: GatewayResponse): Promise<void> {
    const cacheConfig = req.routeMatch?.route.cache;
    if (!cacheConfig?.enabled) return;
    if (req.raw.method !== 'GET') return;
    if (response.statusCode !== 200) return;

    const body = response.getBody();
    const bodyStr = JSON.stringify(body);

    // Don't cache responses that are too large
    if (cacheConfig.maxSize && bodyStr.length > cacheConfig.maxSize) return;

    const key = this.buildCacheKey(req, cacheConfig.varyBy);
    const cached: CachedResponse = {
      statusCode: 200,
      headers: response.getHeaders(),
      body,
      cachedAt: Date.now(),
      isStale: false,
    };

    await this.redis.setex(key, cacheConfig.ttl, JSON.stringify(cached));
  }

  private buildCacheKey(req: GatewayRequest, varyBy: string[]): string {
    const parts = [
      'cache',
      req.raw.method,
      req.raw.url,
    ];

    for (const field of varyBy) {
      switch (field) {
        case 'tenant':
          parts.push(`t:${req.tenantId}`);
          break;
        case 'query':
          parts.push(`q:${req.raw.url?.split('?')[1] ?? ''}`);
          break;
        case 'accept':
          parts.push(`a:${req.raw.headers.accept ?? ''}`);
          break;
      }
    }

    return parts.join(':');
  }
}
```

---

## 10. Proxy and Upstream Communication

### 10.1 HTTP Proxy with Retry and Timeout

```typescript
// File: src/gateway/proxy/upstream-proxy.ts

interface ProxyOptions {
  service: string;
  path: string;
  method: string;
  headers: Record<string, string>;
  body?: unknown;
  timeout: number;
  retries: number;
  retryOn: number[];
}

class UpstreamProxy {
  constructor(
    private serviceRegistry: ServiceRegistry,
    private loadBalancer: LoadBalancerRegistry,
    private circuitBreakers: CircuitBreakerRegistry
  ) {}

  async forward(req: GatewayRequest): Promise<ProxyResponse> {
    const route = req.routeMatch!.route;
    const upstream = route.upstream;

    const options: ProxyOptions = {
      service: upstream.service,
      path: req.metadata.upstreamPath as string,
      method: req.raw.method,
      headers: req.metadata.upstreamHeaders as Record<string, string>,
      body: req.raw.body,
      timeout: upstream.timeout,
      retries: upstream.retries,
      retryOn: upstream.retryOn,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= options.retries; attempt++) {
      try {
        // Select instance via load balancer
        const instances = this.serviceRegistry.getInstances(options.service);
        const balancer = this.loadBalancer.get(route.id);
        const instance = balancer.select(instances);

        if (!instance) {
          throw new Error(`No healthy instances for ${options.service}`);
        }

        // Execute through circuit breaker
        const breaker = this.circuitBreakers.getOrCreate(
          `${options.service}:${instance.id}`,
          upstream.circuitBreaker
        );

        const response = await breaker.execute(async () => {
          const url = `http://${instance.host}:${instance.port}${options.path}`;

          const res = await fetch(url, {
            method: options.method,
            headers: {
              'Content-Type': 'application/json',
              ...options.headers,
            },
            body: options.body ? JSON.stringify(options.body) : undefined,
            signal: AbortSignal.timeout(options.timeout),
          });

          // Track response time for load balancing decisions
          this.serviceRegistry.recordResponseTime(
            instance.id,
            Date.now() - Number(req.startTime)
          );

          return res;
        });

        // Check if we should retry this response
        if (options.retryOn.includes(response.status) && attempt < options.retries) {
          lastError = new Error(`Upstream returned ${response.status}`);
          await this.backoff(attempt);
          continue;
        }

        return {
          statusCode: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          body: await response.json(),
        };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (error instanceof CircuitOpenError) {
          // Don't retry circuit-open errors
          return {
            statusCode: 503,
            headers: { 'Retry-After': Math.ceil(error.retryAfter / 1000).toString() },
            body: {
              error: 'service_unavailable',
              message: `Service ${options.service} is temporarily unavailable`,
              retry_after: Math.ceil(error.retryAfter / 1000),
            },
          };
        }

        if (attempt < options.retries) {
          await this.backoff(attempt);
          continue;
        }
      }
    }

    // All retries exhausted
    return {
      statusCode: 502,
      headers: {},
      body: {
        error: 'bad_gateway',
        message: 'Unable to reach upstream service',
        details: lastError?.message,
      },
    };
  }

  private backoff(attempt: number): Promise<void> {
    // Exponential backoff with jitter
    const base = Math.min(1000 * Math.pow(2, attempt), 10_000);
    const jitter = Math.random() * base * 0.1;
    return new Promise(resolve => setTimeout(resolve, base + jitter));
  }
}
```

---

## 11. Service Discovery and Registry

### 11.1 Service Registry

```typescript
// File: src/gateway/discovery/service-registry.ts

class ServiceRegistry {
  private instances = new Map<string, ServiceInstance[]>();
  private healthStatus = new Map<string, boolean>();

  register(serviceName: string, instance: ServiceInstance): void {
    const existing = this.instances.get(serviceName) ?? [];
    existing.push(instance);
    this.instances.set(serviceName, existing);
    this.healthStatus.set(instance.id, true);

    logger.info('Service registered', { service: serviceName, instance: instance.id });
  }

  deregister(instanceId: string): void {
    for (const [service, instances] of this.instances) {
      const filtered = instances.filter(i => i.id !== instanceId);
      if (filtered.length !== instances.length) {
        this.instances.set(service, filtered);
        this.healthStatus.delete(instanceId);
        logger.info('Service deregistered', { service, instance: instanceId });
      }
    }
  }

  getInstances(serviceName: string): ServiceInstance[] {
    const instances = this.instances.get(serviceName) ?? [];
    return instances.map(i => ({
      ...i,
      healthy: this.healthStatus.get(i.id) ?? false,
    }));
  }

  getAllInstances(): ServiceInstance[] {
    const all: ServiceInstance[] = [];
    for (const instances of this.instances.values()) {
      all.push(...instances);
    }
    return all;
  }

  updateHealth(instanceId: string, healthy: boolean): void {
    const wasHealthy = this.healthStatus.get(instanceId);
    this.healthStatus.set(instanceId, healthy);

    if (wasHealthy !== healthy) {
      logger.warn('Service health changed', {
        instance: instanceId,
        from: wasHealthy,
        to: healthy,
      });
    }
  }

  recordResponseTime(instanceId: string, ms: number): void {
    for (const instances of this.instances.values()) {
      const instance = instances.find(i => i.id === instanceId);
      if (instance) {
        // Exponential moving average
        instance.responseTime = instance.responseTime * 0.7 + ms * 0.3;
        break;
      }
    }
  }
}
```

---

## 12. Gateway Metrics and Observability

### 12.1 Key Metrics to Track

```typescript
// File: src/gateway/metrics/gateway-metrics.ts

// Request metrics
metrics.histogram('gateway.request.duration_ms', {
  tenant: tenantId,
  method: req.method,
  route: routeId,
  status: res.statusCode,
  version: apiVersion,
});

metrics.counter('gateway.request.total', {
  tenant: tenantId,
  method: req.method,
  route: routeId,
  status: res.statusCode,
});

// Rate limit metrics
metrics.counter('gateway.rate_limit.checked', { tenant: tenantId, tier });
metrics.counter('gateway.rate_limit.exceeded', { tenant: tenantId, tier });

// Circuit breaker metrics
metrics.gauge('gateway.circuit_breaker.state', {
  service: serviceName,
}, stateValue); // 0=closed, 1=half-open, 2=open

// Upstream metrics
metrics.histogram('gateway.upstream.duration_ms', {
  service: serviceName,
  instance: instanceId,
});
metrics.counter('gateway.upstream.errors', {
  service: serviceName,
  error_type: errorType,
});

// Cache metrics
metrics.counter('gateway.cache.hit', { route: routeId });
metrics.counter('gateway.cache.miss', { route: routeId });
metrics.counter('gateway.cache.stale', { route: routeId });
```

### 12.2 Structured Logging

```typescript
// Every request gets a structured log entry
logger.info('request_completed', {
  requestId: req.metadata.requestId,
  tenantId: req.tenantId,
  method: req.raw.method,
  path: req.raw.url,
  statusCode: res.statusCode,
  duration: Date.now() - Number(req.startTime),
  userAgent: req.raw.headers['user-agent'],
  ip: req.raw.ip,
  route: req.routeMatch?.route.id,
  version: req.routeMatch?.route.version,
  cacheStatus: res.getHeader('x-cache') ?? 'BYPASS',
  rateLimitRemaining: res.getHeader('x-ratelimit-remaining'),
  upstream: {
    service: req.routeMatch?.route.upstream.service,
    duration: req.metadata.upstreamDuration,
    retries: req.metadata.retryCount,
  },
});
```

---

## 13. Gateway Configuration Management

### 13.1 Dynamic Configuration

```typescript
// File: src/gateway/config/dynamic-config.ts

interface GatewayConfig {
  globalRateLimit: number;
  tierLimits: Record<string, RateLimitConfig>;
  circuitBreakerDefaults: CircuitBreakerConfig;
  cacheDefaults: CacheConfig;
  maintenanceMode: boolean;
  blockedTenants: string[];
  featureFlags: Record<string, boolean>;
}

class DynamicConfigManager {
  private config: GatewayConfig;
  private redis: Redis;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor(redis: Redis, defaultConfig: GatewayConfig) {
    this.redis = redis;
    this.config = defaultConfig;
  }

  start(): void {
    this.pollInterval = setInterval(() => this.refresh(), 30_000);
    this.refresh();
  }

  private async refresh(): Promise<void> {
    try {
      const raw = await this.redis.get('gateway:config');
      if (raw) {
        const updated = JSON.parse(raw) as Partial<GatewayConfig>;
        this.config = { ...this.config, ...updated };
        logger.debug('Gateway config refreshed');
      }
    } catch (error) {
      logger.error('Failed to refresh gateway config', { error });
      // Keep existing config on failure
    }
  }

  get(): GatewayConfig {
    return this.config;
  }

  isMaintenanceMode(): boolean {
    return this.config.maintenanceMode;
  }

  isTenantBlocked(tenantId: string): boolean {
    return this.config.blockedTenants.includes(tenantId);
  }

  isFeatureEnabled(flag: string): boolean {
    return this.config.featureFlags[flag] ?? false;
  }
}
```

---

## 14. Deployment Architecture

### 14.1 Production Topology

```
Production Gateway Deployment:

                    Internet
                       │
                       ▼
              ┌─────────────────┐
              │   Cloudflare    │
              │   (CDN + WAF)   │
              └────────┬────────┘
                       │
           ┌───────────┼───────────┐
           ▼           ▼           ▼
    ┌────────────┐ ┌────────────┐ ┌────────────┐
    │  Gateway   │ │  Gateway   │ │  Gateway   │
    │  Instance  │ │  Instance  │ │  Instance  │
    │     #1     │ │     #2     │ │     #3     │
    └─────┬──────┘ └──────┬─────┘ └─────┬──────┘
          │               │              │
          └───────────────┼──────────────┘
                          │
                  ┌───────┴───────┐
                  │   Redis       │
                  │   Cluster     │
                  │ (rate limits, │
                  │  config,      │
                  │  sessions)    │
                  └───────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐   ┌──────────┐   ┌──────────┐
    │  Agent   │   │  Agent   │   │  Agent   │
    │ Service  │   │ Service  │   │ Service  │
    │ Cluster  │   │ Cluster  │   │ Cluster  │
    └──────────┘   └──────────┘   └──────────┘
```

### 14.2 Auto-Scaling Rules

```yaml
# Gateway auto-scaling configuration
autoscaling:
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        targetAverageUtilization: 60
    - type: Pods
      pods:
        metric:
          name: gateway_active_connections
        target:
          averageValue: 500
    - type: External
      external:
        metric:
          name: gateway_request_queue_depth
        target:
          averageValue: 100
```

---

## 15. Error Handling Strategy

### 15.1 Standardized Error Responses

```typescript
// File: src/gateway/errors/error-codes.ts

const ERROR_CATALOG = {
  // 4xx Client Errors
  'invalid_api_key':       { status: 401, message: 'The API key provided is invalid or expired' },
  'missing_api_key':       { status: 401, message: 'No API key was provided. Include it in the Authorization header' },
  'insufficient_scope':    { status: 403, message: 'Your API key does not have the required scope for this endpoint' },
  'tenant_suspended':      { status: 403, message: 'Your account has been suspended. Contact support@stone-ai.net' },
  'rate_limit_exceeded':   { status: 429, message: 'Rate limit exceeded. See response headers for reset time' },
  'route_not_found':       { status: 404, message: 'The requested endpoint does not exist' },
  'method_not_allowed':    { status: 405, message: 'This HTTP method is not supported for this endpoint' },
  'validation_error':      { status: 422, message: 'Request validation failed. Check the errors array for details' },
  'request_too_large':     { status: 413, message: 'Request body exceeds maximum allowed size' },
  'tier_not_authorized':   { status: 403, message: 'Your subscription tier does not include access to this agent' },

  // 5xx Server Errors
  'gateway_error':         { status: 500, message: 'An internal gateway error occurred' },
  'service_unavailable':   { status: 503, message: 'The requested service is temporarily unavailable' },
  'bad_gateway':           { status: 502, message: 'Unable to reach the upstream service' },
  'gateway_timeout':       { status: 504, message: 'The upstream service did not respond in time' },
} as const;

// Standard error response format
interface ApiError {
  error: {
    code: keyof typeof ERROR_CATALOG;
    message: string;
    request_id: string;
    timestamp: string;
    docs_url: string;
    details?: Record<string, unknown>;
    errors?: Array<{        // For validation errors
      field: string;
      message: string;
      code: string;
    }>;
  };
}
```

---

## 16. Security Considerations

### 16.1 Gateway Security Checklist

```
Security Layers:

[ ] TLS termination at edge (Cloudflare)
[ ] mTLS between gateway and upstream services
[ ] Request size limits (10MB default, configurable per route)
[ ] Header injection prevention (strip hop-by-hop headers)
[ ] Request timeout enforcement (prevent slowloris)
[ ] IP allowlisting per tenant (optional feature)
[ ] API key hashing (never store plaintext keys)
[ ] Rate limiting at multiple layers
[ ] Request validation against OpenAPI schema
[ ] SQL injection prevention in query parameters
[ ] CORS configuration per tenant
[ ] Security headers on all responses
[ ] Audit logging for all authentication events
[ ] Anomaly detection for unusual traffic patterns
```

### 16.2 Internal Authentication Between Services

```typescript
// Gateway adds signed internal token for upstream services
function signInternalRequest(req: GatewayRequest): string {
  const payload = {
    tenantId: req.tenantId,
    requestId: req.metadata.requestId,
    scopes: req.metadata.scopes,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 30, // 30 second validity
  };

  return jwt.sign(payload, process.env.INTERNAL_JWT_SECRET!, {
    algorithm: 'HS256',
    issuer: 'stone-ai-gateway',
  });
}
```

---

## Summary

This seed covers the complete API gateway architecture for Stone AI Tools:

1. **Pipeline Architecture**: Ordered middleware stages with short-circuit capability
2. **Rate Limiting**: Multi-tier token bucket and sliding window implementations via Redis
3. **Request Routing**: Pattern matching, version resolution, dynamic route configuration
4. **Load Balancing**: Multiple strategies (round robin, least connections, consistent hash)
5. **Circuit Breakers**: Three-state machine protecting against cascade failures
6. **Health Checks**: Liveness, readiness, and detailed probes with automatic service deregistration
7. **Caching**: Response caching with stale-while-revalidate support
8. **Proxy**: Upstream forwarding with retry, timeout, and backoff
9. **Observability**: Metrics, structured logging, and distributed tracing
10. **Security**: Multi-layer protection from edge to upstream

The gateway is the backbone of Stone AI Tools — every API call flows through it, making its reliability and performance critical to the platform's success.
