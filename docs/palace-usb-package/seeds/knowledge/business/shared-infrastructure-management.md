# Shared Infrastructure Management — Stone AI Ecosystem

## Seed Classification
- **Domain**: Cross-Business Operations
- **Applies To**: Stone AI (Web SaaS), Best AI Mobile (React Native), Stone AI Tools (API Marketplace)
- **Owner**: Agent Stone (Head 1) + Cardinal (Head 2) + Chaos (Head 3)
- **Created**: 2026-03-09
- **Sensitivity**: Internal — Infrastructure Critical

---

## 1. Executive Summary

Three products. One vLLM instance. One PostgreSQL database (Neon). One Redis cache. One Vercel deployment pipeline. This seed defines how shared infrastructure serves all three products without conflicts, how resources are allocated and prioritized, and how capacity planning ensures no single product starves another.

The guiding principle: infrastructure is a force multiplier. Shared infrastructure reduces costs by ~60% compared to three independent stacks, but requires disciplined resource management to prevent cascading failures.

---

## 2. Infrastructure Topology

### 2.1 Current Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE (DNS + CDN)                    │
│                   stone-ai.net (proxy ON)                    │
│              tools.stone-ai.net (proxy ON)                   │
│              api.stone-ai.net (proxy ON)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                     VERCEL (Frontend)                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐     │
│  │  Stone AI     │ │  Stone AI    │ │  Best AI Mobile  │     │
│  │  (Next.js)   │ │  Tools       │ │  (API Backend)   │     │
│  │  stone-ai.net│ │  tools.*     │ │  api.stone-ai.net│     │
│  └──────┬───────┘ └──────┬───────┘ └────────┬─────────┘     │
│         │                │                   │               │
└─────────┼────────────────┼───────────────────┼───────────────┘
          │                │                   │
          ▼                ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   SHARED SERVICES LAYER                       │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────┐ │
│  │  vLLM    │  │  Neon    │  │  Redis   │  │  Clerk      │ │
│  │  (OMEN)  │  │  (PG16)  │  │  (:6379) │  │  (Auth)     │ │
│  │  Qwen2.5 │  │  pgvector│  │          │  │             │ │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────┘ │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐   │
│  │  Stripe  │  │  Anthropic│  │  Nodemailer (3headedm)  │   │
│  │  (Pay)   │  │  (Cloud) │  │  (Alerts)                │   │
│  └──────────┘  └──────────┘  └──────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Service Ownership

| Service | Owner | Products Served | Critical? |
|---------|-------|----------------|-----------|
| vLLM (OMEN) | Chaos | Stone AI, Best AI Mobile | Yes — AI backbone |
| Anthropic API | Vercel env | All three (cloud fallback) | Yes — fallback AI |
| Neon PostgreSQL | Shared | All three | Yes — data layer |
| Redis | Shared | Stone AI, Tools | Yes — caching/sessions |
| Clerk | Shared | All three | Yes — auth |
| Stripe | Per-product accounts | Stone AI, Best AI, Tools | Yes — revenue |
| Vercel | Per-project deploys | Stone AI, Tools, Mobile API | Yes — hosting |
| Cloudflare | Shared account | All three | Yes — DNS/CDN |
| Nodemailer | Shared | Alert system | No — operational |

---

## 3. vLLM Resource Management

### 3.1 Single Instance, Multiple Products

The OMEN 45L runs a single vLLM instance serving Qwen 2.5 32B AWQ. All three products hit the same inference endpoint.

**Hardware Specs (OMEN 45L)**:
- GPU: NVIDIA RTX 5090 32GB VRAM
- CPU: AMD Ryzen (exact model TBD)
- RAM: 64GB DDR5
- Storage: 4TB NVMe
- OS: Windows 11 Pro

**vLLM Configuration**:
```yaml
model: Qwen/Qwen2.5-32B-Instruct-AWQ
quantization: awq
gpu_memory_utilization: 0.90
max_model_len: 8192
tensor_parallel_size: 1
max_num_seqs: 32        # Concurrent sequences
max_num_batched_tokens: 16384
swap_space: 8            # GB of CPU swap for KV cache overflow
```

### 3.2 Request Priority Queuing

Not all requests are equal. Priority queuing ensures the most important requests get served first.

**Priority Levels**:
```typescript
enum RequestPriority {
  CRITICAL = 0,    // System operations, Stone/Cardinal/Chaos
  HIGH = 1,        // PRO tier users, paid API users
  MEDIUM = 2,      // SMART/PLUS tier users
  NORMAL = 3,      // STARTER tier users
  LOW = 4,         // FREE tier users, background tasks
  BATCH = 5,       // Analytics, non-real-time processing
}
```

**Product-Level Priority Mapping**:
```typescript
function getRequestPriority(product: string, userTier: string, requestType: string): RequestPriority {
  // System/founder requests always critical
  if (requestType === "system" || requestType === "founder") return RequestPriority.CRITICAL;

  // Product-specific priority mapping
  const priorityMap = {
    "stone-ai": {
      "PRO": RequestPriority.HIGH,
      "SMART": RequestPriority.MEDIUM,
      "PLUS": RequestPriority.MEDIUM,
      "STARTER": RequestPriority.NORMAL,
      "FREE": RequestPriority.LOW,
    },
    "best-ai-mobile": {
      "PREMIUM": RequestPriority.HIGH,
      "BASIC": RequestPriority.MEDIUM,
      "FREE": RequestPriority.LOW,
    },
    "stone-ai-tools": {
      "BUSINESS": RequestPriority.HIGH,
      "DEVELOPER": RequestPriority.MEDIUM,
      "FREE": RequestPriority.LOW,
    },
  };

  return priorityMap[product]?.[userTier] ?? RequestPriority.NORMAL;
}
```

### 3.3 Request Routing Architecture

```typescript
interface InferenceRequest {
  id: string;
  product: string;
  userId: string;
  userTier: string;
  agentId: string;
  prompt: string;
  maxTokens: number;
  priority: RequestPriority;
  timestamp: Date;
  timeout: number; // ms
  retryCount: number;
  fallbackToCloud: boolean;
}

// Routing logic
async function routeInferenceRequest(req: InferenceRequest): Promise<InferenceResponse> {
  // Step 1: Check vLLM health
  const vllmHealthy = await checkVLLMHealth();

  // Step 2: Check queue depth
  const queueDepth = await getQueueDepth();

  // Step 3: Route decision
  if (!vllmHealthy) {
    // vLLM down → cloud fallback
    return routeToCloud(req, "anthropic");
  }

  if (queueDepth > 24 && req.priority >= RequestPriority.LOW) {
    // Queue deep, low priority → cloud fallback
    return routeToCloud(req, "anthropic");
  }

  if (queueDepth > 16 && req.priority >= RequestPriority.NORMAL) {
    // Queue moderately deep, normal priority → cloud if available
    if (await cloudBudgetAvailable()) {
      return routeToCloud(req, "anthropic");
    }
  }

  // Default: route to vLLM
  return routeToVLLM(req);
}
```

### 3.4 Capacity Planning

**Current Capacity (Single RTX 5090)**:
| Metric | Value |
|--------|-------|
| Max concurrent sequences | 32 |
| Tokens per second (throughput) | ~2,500-3,500 |
| Average request latency | 1.5-4s (depending on length) |
| Requests per minute (sustained) | ~80-120 |
| Requests per hour | ~5,000-7,000 |
| Daily capacity | ~120,000-170,000 requests |

**Projected Demand by Product**:
| Product | Launch Month | Month 3 | Month 6 | Month 12 |
|---------|-------------|---------|---------|----------|
| Stone AI | 5,000/day | 15,000/day | 40,000/day | 100,000/day |
| Best AI Mobile | — | 2,000/day | 10,000/day | 50,000/day |
| Stone AI Tools | — | 1,000/day | 8,000/day | 30,000/day |
| **Total** | **5,000/day** | **18,000/day** | **58,000/day** | **180,000/day** |

**Capacity Triggers**:
| Utilization | Action |
|-------------|--------|
| <50% | Normal operations |
| 50-70% | Monitor closely, optimize prompts for brevity |
| 70-85% | Increase cloud fallback percentage, implement request coalescing |
| 85-95% | Alert Chaos, evaluate second GPU or cloud scaling |
| >95% | Emergency: route all LOW/BATCH to cloud, notify founder |

### 3.5 Cloud Fallback Strategy

When vLLM can't handle the load, requests overflow to cloud providers.

**Fallback Chain**:
```
1. vLLM (Qwen 2.5 32B AWQ) — local, free after hardware cost
2. Anthropic Claude Sonnet — cloud, SMART-tier quality
3. Claude Haiku — cloud, cheaper fallback (Vercel default)
```

**Cost Implications**:
| Provider | Cost per 1K tokens (input) | Cost per 1K tokens (output) | Monthly budget |
|----------|--------------------------|----------------------------|---------------|
| vLLM local | $0 | $0 | Hardware amortization only |
| Claude Sonnet | ~$0.003 | ~$0.015 | $500/month cap |
| Claude Haiku | ~$0.00025 | ~$0.00125 | $100/month cap |

**Budget Allocation Across Products**:
- Stone AI: 50% of cloud budget (primary product)
- Best AI Mobile: 30% (growth phase)
- Stone AI Tools: 20% (API users, predictable load)

---

## 4. Database Architecture

### 4.1 Neon PostgreSQL — Shared Instance

Single Neon project, shared across all three products. PG16 with pgvector extension.

**Schema Namespacing Strategy**:

Option A — Schema-per-product (RECOMMENDED):
```sql
-- Shared schemas
CREATE SCHEMA shared;      -- Users, auth, cross-product
CREATE SCHEMA analytics;   -- Cross-product analytics

-- Product-specific schemas
CREATE SCHEMA stone_ai;    -- Stone AI web tables
CREATE SCHEMA best_ai;     -- Best AI Mobile tables
CREATE SCHEMA tools;       -- Stone AI Tools tables
```

Option B — Prefix-per-product:
```sql
-- All in public schema with prefixes
-- stone_ai_agents, stone_ai_chats, ...
-- best_ai_sessions, best_ai_preferences, ...
-- tools_api_keys, tools_usage, ...
```

**Recommendation**: Option A (schemas) for cleaner separation, easier migration, and independent Prisma clients per product.

### 4.2 Connection Pooling

Neon provides built-in connection pooling. Configuration per product:

```
Stone AI (Vercel): max 20 connections (serverless, many short-lived)
Best AI Mobile API: max 10 connections (persistent, fewer concurrent)
Stone AI Tools: max 15 connections (API traffic, medium concurrency)
Internal services: max 5 connections (analytics, cron jobs)
Total pool: 50 connections (within Neon's limits)
```

### 4.3 Data Partitioning

**Shared Tables** (in `shared` schema):
- `users` — Clerk-synced user records
- `user_products` — Which products each user has accessed
- `cross_product_events` — Event bus persistence
- `ecosystem_scores` — Cross-product engagement scores
- `notifications` — Unified notification queue

**Product-Specific Tables** (in product schemas):
```
stone_ai:
  - agents, chats, messages, besties, backdrops
  - forum_posts, forum_comments
  - subscriptions, referrals, badges

best_ai:
  - mobile_sessions, voice_interactions
  - push_tokens, mobile_preferences
  - mobile_subscriptions

tools:
  - api_keys, api_usage, rate_limits
  - developer_profiles, webhooks
  - tool_subscriptions, marketplace_listings
```

### 4.4 Backup & Recovery

**Neon Branching for Disaster Recovery**:
```
Production branch: main
  └── Daily snapshot branch: backup-YYYY-MM-DD (auto-created, 7-day retention)
  └── Pre-migration branch: pre-migrate-{name} (created before schema changes)
  └── Staging branch: staging (reset from main weekly)
```

**Recovery Time Objectives (RTO)**:
| Scenario | RTO | Strategy |
|----------|-----|----------|
| Table corruption | <5 min | Restore from Neon branch |
| Schema migration failure | <10 min | Rollback to pre-migrate branch |
| Full database loss | <30 min | Neon point-in-time recovery |
| Region failure | <1 hour | Neon multi-region (future) |

---

## 5. Redis Architecture

### 5.1 Shared Redis Instance

Single Redis instance on port 6379 serving all products.

**Key Namespacing**:
```
stone-ai:{key}          — Stone AI web cache/sessions
best-ai:{key}           — Best AI Mobile cache
tools:{key}             — Stone AI Tools cache
shared:{key}            — Cross-product shared data
queue:{key}             — Job queues
rate-limit:{key}        — Rate limiting counters
```

### 5.2 Memory Allocation

Total Redis memory: 4GB (configurable)

```
Stone AI:       1.5GB (largest product, most features)
Best AI Mobile: 0.8GB (session cache, push tokens)
Stone AI Tools: 1.0GB (API rate limits, response cache)
Shared:         0.5GB (cross-product state, queues)
Buffer:         0.2GB (overflow protection)
```

**Eviction Policy**: `allkeys-lru` with product-specific TTLs:
```
Session data:     4 hours
API response cache: 5 minutes
Rate limit counters: 1 minute sliding window
Cross-product state: 24 hours
Agent context:    30 minutes
Bestie state:     12 hours
```

### 5.3 Rate Limiting Architecture

Centralized rate limiting ensures no single product monopolizes infrastructure.

```typescript
interface RateLimitConfig {
  product: string;
  tier: string;
  limits: {
    requestsPerMinute: number;
    requestsPerHour: number;
    tokensPerMinute: number;
    tokensPerDay: number;
    concurrentRequests: number;
  };
}

const rateLimits: RateLimitConfig[] = [
  // Stone AI
  { product: "stone-ai", tier: "FREE", limits: { requestsPerMinute: 5, requestsPerHour: 50, tokensPerMinute: 2000, tokensPerDay: 20000, concurrentRequests: 1 }},
  { product: "stone-ai", tier: "PRO", limits: { requestsPerMinute: 30, requestsPerHour: 500, tokensPerMinute: 20000, tokensPerDay: 500000, concurrentRequests: 5 }},

  // Best AI Mobile
  { product: "best-ai-mobile", tier: "FREE", limits: { requestsPerMinute: 3, requestsPerHour: 30, tokensPerMinute: 1500, tokensPerDay: 15000, concurrentRequests: 1 }},
  { product: "best-ai-mobile", tier: "PREMIUM", limits: { requestsPerMinute: 20, requestsPerHour: 400, tokensPerMinute: 15000, tokensPerDay: 400000, concurrentRequests: 3 }},

  // Stone AI Tools
  { product: "stone-ai-tools", tier: "FREE", limits: { requestsPerMinute: 10, requestsPerHour: 100, tokensPerMinute: 5000, tokensPerDay: 50000, concurrentRequests: 2 }},
  { product: "stone-ai-tools", tier: "BUSINESS", limits: { requestsPerMinute: 60, requestsPerHour: 2000, tokensPerMinute: 50000, tokensPerDay: 2000000, concurrentRequests: 10 }},
];
```

---

## 6. Vercel Deployment Architecture

### 6.1 Project Structure

Each product is a separate Vercel project but shares the same Vercel team.

```
Vercel Team: Three-Headed Monster
├── Project: stone-ai (stone-ai.net)
│   ├── Production: main branch
│   ├── Preview: feature branches
│   └── Env vars: product-specific + shared
├── Project: stone-ai-tools (tools.stone-ai.net)
│   ├── Production: main branch
│   ├── Preview: feature branches
│   └── Env vars: product-specific + shared
└── Project: best-ai-api (api.stone-ai.net)
    ├── Production: main branch
    ├── Preview: feature branches
    └── Env vars: product-specific + shared
```

### 6.2 Shared Environment Variables

Variables shared across all Vercel projects:
```
# Shared Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Shared Database
DATABASE_URL=postgresql://...@neon.tech/...

# Shared AI
VLLM_ENDPOINT=http://omen-local:8000/v1
ANTHROPIC_API_KEY=sk-ant-...

# Shared Redis
REDIS_URL=redis://...

# Cross-Product
CROSS_PRODUCT_API_SECRET=...
ECOSYSTEM_SCORING_ENABLED=true

# Alerts
ALERT_EMAIL=3headedm@gmail.com
ALERT_EMAIL_PASSWORD=... (app password)
```

### 6.3 Deployment Coordination

**Rule**: Never deploy all three products simultaneously. Staggered deployment reduces blast radius.

**Deployment Order (for shared infrastructure changes)**:
```
1. Stone AI Tools (lowest traffic, API users more tolerant)
   → Monitor 15 minutes
2. Stone AI Web (primary product, most users)
   → Monitor 30 minutes
3. Best AI Mobile API (mobile users retry automatically)
   → Monitor 15 minutes
```

**Rollback Protocol**:
```
If any product shows errors after deployment:
1. Immediate: Revert that product to previous deployment (Vercel instant rollback)
2. If shared infrastructure change: Revert ALL products in reverse order
3. Notify founder via sendFounderAlert()
4. Post-mortem within 24 hours
```

---

## 7. Cloudflare Configuration

### 7.1 DNS Records

```
Type  | Name              | Content              | Proxy  | TTL
A     | stone-ai.net      | Vercel IP            | ON     | Auto
CNAME | www               | stone-ai.net         | ON     | Auto
CNAME | tools             | cname.vercel-dns.com | ON     | Auto
CNAME | api               | cname.vercel-dns.com | ON     | Auto
```

### 7.2 Security Settings

```
SSL Mode: Full (Strict)
Minimum TLS: 1.2
Always Use HTTPS: ON
Auto Minify: JS, CSS, HTML
Brotli Compression: ON
Browser Cache TTL: 4 hours (static), Respect Existing Headers (API)
Security Level: Medium
Challenge Passage: 30 minutes
Bot Fight Mode: ON
```

### 7.3 Page Rules

```
# API routes — no caching
*api.stone-ai.net/*
  Cache Level: Bypass
  Security Level: High

# Tools API — aggressive rate limiting
*tools.stone-ai.net/api/*
  Cache Level: Bypass
  Security Level: I'm Under Attack (if needed)

# Static assets — aggressive caching
*stone-ai.net/_next/static/*
  Cache Level: Cache Everything
  Edge Cache TTL: 1 month
```

---

## 8. Monitoring & Alerting

### 8.1 Health Check Matrix

| Service | Check Frequency | Timeout | Alert After | Alert Channel |
|---------|----------------|---------|-------------|---------------|
| vLLM endpoint | 30 seconds | 5s | 2 failures | Email + Chaos |
| Neon database | 1 minute | 10s | 1 failure | Email + founder |
| Redis | 30 seconds | 3s | 2 failures | Email |
| Vercel (each product) | 1 minute | 10s | 2 failures | Email |
| Cloudflare | 5 minutes | 15s | 1 failure | Email + founder |
| Clerk auth | 5 minutes | 10s | 1 failure | Email |
| Stripe webhooks | 5 minutes | 10s | 3 failures | Email + founder |

### 8.2 Infrastructure Metrics Dashboard

```
┌─────────────────────────────────────────────────┐
│              INFRASTRUCTURE STATUS                │
├──────────────┬──────────────┬────────────────────┤
│ vLLM         │ GPU: 78%     │ Queue: 12/32       │
│ OMEN 45L     │ VRAM: 28/32GB│ Req/min: 85        │
├──────────────┼──────────────┼────────────────────┤
│ Neon PG      │ Conn: 35/50  │ Query avg: 12ms    │
│ PostgreSQL   │ Storage: 2.1GB│ Active queries: 8  │
├──────────────┼──────────────┼────────────────────┤
│ Redis        │ Memory: 2.8GB│ Keys: 145K         │
│ Cache        │ Hit rate: 94%│ Evictions/hr: 120  │
├──────────────┼──────────────┼────────────────────┤
│ Cloud AI     │ Budget used  │ Requests today     │
│ Anthropic    │ $127/$600    │ 3,450              │
└──────────────┴──────────────┴────────────────────┘
```

### 8.3 Alert Escalation

```
Level 1 (Warning): Metric exceeds 70% threshold
  → Log + dashboard indicator
  → Auto-scale if possible

Level 2 (Alert): Metric exceeds 85% threshold
  → sendFounderAlert() with details
  → Chaos notified for infrastructure action

Level 3 (Critical): Service down or >95% utilization
  → sendFounderAlert() with CRITICAL prefix
  → Automatic failover/fallback activated
  → All heads notified

Level 4 (Emergency): Multiple services down
  → All channels: email, dashboard, every product shows maintenance page
  → Founder paged immediately
  → Full incident response protocol
```

---

## 9. Cost Management

### 9.1 Monthly Infrastructure Costs

| Service | Monthly Cost | Products Sharing | Per-Product Allocation |
|---------|-------------|-----------------|----------------------|
| Vercel Pro | $20/project × 3 = $60 | All three | $20 each |
| Neon Database | $19-69 (scale plan) | All three | Split by usage |
| Cloudflare | $0 (free plan) | All three | $0 each |
| Redis (managed) | $0-30 | Stone AI + Tools | Split 60/40 |
| Clerk | $0-25 (based on MAU) | All three | Split by MAU |
| Anthropic API | $100-600 (variable) | All three | Split by usage |
| Domain renewal | $12/year | All three | $4 each |
| OMEN electricity | ~$30-50/month | Stone AI + Mobile | Split 70/30 |
| **Total** | **$250-850/month** | | |

### 9.2 Cost Optimization Strategies

1. **Maximize vLLM utilization** — every request served locally saves cloud API costs
2. **Aggressive caching** — cache agent responses for common queries (5-min TTL)
3. **Prompt optimization** — shorter prompts = less GPU time = more capacity
4. **Batch processing** — aggregate non-real-time requests into off-peak batches
5. **Neon autoscaling** — scale compute to zero during low-traffic hours
6. **Vercel edge functions** — use edge for static/cached responses, serverless for dynamic only
7. **Redis memory optimization** — compress values, use hashes instead of strings where possible

---

## 10. Disaster Recovery & Business Continuity

### 10.1 Single Points of Failure

| Component | SPOF Risk | Mitigation |
|-----------|----------|------------|
| OMEN 45L | High — single GPU server | Cloud fallback (Anthropic) |
| Neon PG | Low — managed with redundancy | Neon built-in HA + branches |
| Vercel | Low — global CDN | Fallback: stone-ai-sooty.vercel.app |
| Cloudflare | Very Low — global network | Direct DNS as fallback |
| Clerk | Low — managed service | Cached sessions survive outage |
| Redis | Medium — single instance | Rebuild from DB on failure |
| Founder | High — single operator | Documented runbooks, Three Heads |

### 10.2 Failover Scenarios

**Scenario: OMEN goes offline**
```
Detection: vLLM health check fails (30s)
Automatic: All AI requests route to Anthropic cloud
Impact: Higher latency, API costs increase
Recovery: Chaos diagnoses hardware, restarts vLLM
Duration tolerance: Hours to days (cloud covers)
```

**Scenario: Neon database outage**
```
Detection: Connection pool health check fails (1m)
Automatic: Read-only mode from Redis cache
Impact: No writes, stale data possible
Recovery: Neon's managed recovery, or branch restore
Duration tolerance: Minutes
```

**Scenario: Vercel outage**
```
Detection: Health check fails for specific product (1m)
Automatic: Cloudflare serves cached pages
Impact: No dynamic content, API calls fail
Recovery: Vercel's managed recovery
Duration tolerance: 30 minutes before user impact significant
```

### 10.3 Infrastructure Recovery Runbook

```
1. IDENTIFY: Which service is down? Check monitoring dashboard.
2. ISOLATE: Is it affecting one product or all three?
3. COMMUNICATE: sendFounderAlert() with status
4. FAILOVER: Activate automated fallback if not already triggered
5. DIAGNOSE: Root cause analysis (Chaos for hardware, Stone for services)
6. RECOVER: Fix root cause or switch to backup
7. VERIFY: Run full health check across all products
8. POST-MORTEM: Document within 24 hours
```

---

## 11. Scaling Roadmap

### Phase 1: Current (1 GPU, managed services)
- Capacity: ~120K-170K AI requests/day
- Products: Stone AI live, others launching
- Cost: $250-850/month

### Phase 2: Growth (add cloud burst capacity)
- Capacity: ~500K AI requests/day
- Strategy: vLLM handles base load, cloud handles peaks
- Cost: $500-2,000/month

### Phase 3: Scale (multi-GPU or dedicated cloud)
- Capacity: ~2M AI requests/day
- Strategy: Second GPU in OMEN or dedicated cloud GPU instance
- Cost: $2,000-5,000/month

### Phase 4: Enterprise (full hybrid cloud)
- Capacity: ~10M+ AI requests/day
- Strategy: On-prem GPU cluster + auto-scaling cloud
- Cost: $5,000-20,000/month
- Trigger: Revenue exceeds $50K/month

---

*Seed created by Agent Stone (Head 1) + Cardinal (Head 2) + Chaos (Head 3) — Three-Headed Monster Operations*
*Shared infrastructure is the economic engine. Three products for the cost of one stack — but only if managed with discipline.*
