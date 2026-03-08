# CH-5: Edge Deployment & Global Latency Optimization
**Agent**: Chaos (Agent #44) | **Priority**: P2 | **Date**: 2026-03-07
**Stack**: Vercel (Next.js), Cloudflare (CDN + Workers), Neon (US-East), OMEN (local inference)

---

## 1. Current Latency Baseline (Estimated by Region)

### Architecture Latency Breakdown
```
User Request → Cloudflare Edge (1-5ms) → Vercel Serverless (50-200ms) → Neon DB (5-50ms)
                                        → Cloudflare Tunnel → OMEN vLLM (200-5000ms)
```

### Estimated P50 Latency by Region

| Region | Static Page | API Call (no AI) | AI Inference | Notes |
|---|---|---|---|---|
| US-East (origin) | 30ms | 100ms | 500-2000ms | Closest to Neon + Vercel |
| US-West | 50ms | 150ms | 600-2200ms | +50ms network hop |
| Europe | 100ms | 250ms | 800-2500ms | +150ms transatlantic |
| Asia | 200ms | 400ms | 1200-3000ms | +300ms to US-East |
| Australia | 250ms | 500ms | 1500-3500ms | +400ms to US-East |

### Latency Budget Targets

| Interaction Type | Target P50 | Target P95 | Current Estimate |
|---|---|---|---|
| Page load (static) | <200ms | <500ms | 30-250ms (varies by region) |
| Page load (SSR) | <500ms | <1s | 100-500ms |
| API response (CRUD) | <200ms | <500ms | 100-400ms |
| AI first token (TTFT) | <1s | <3s | 500-2000ms |
| AI full response | <5s | <15s | 2-15s (depends on length) |
| Search (vector) | <300ms | <800ms | 100-500ms |

---

## 2. Vercel Edge Functions for AI Workloads

### What Edge Functions CAN Do
- Auth token validation (JWT verify at edge, skip origin round-trip)
- Request routing and rewriting
- A/B test assignment
- Geolocation-based personalization
- Rate limiting (basic, per-IP)
- Response header injection
- Redirect logic
- Static response caching

### What Edge Functions CANNOT Do (limitations)
- No long-running compute (max 30s on Vercel Edge, vs 300s for serverless)
- No native database connections (must use HTTP-based DB drivers)
- Limited to Edge Runtime APIs (no Node.js fs, child_process, etc.)
- Cannot run AI inference directly
- 128MB memory limit

### Recommended Edge Middleware for Stone AI

```typescript
// middleware.ts — runs at Cloudflare/Vercel edge
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Add security headers at edge (free, zero latency cost)
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 2. Geo-routing header (available to API routes)
  const country = request.geo?.country || 'US';
  const region = request.geo?.region || 'unknown';
  response.headers.set('X-User-Country', country);
  response.headers.set('X-User-Region', region);

  // 3. Bot detection quick-reject
  const ua = request.headers.get('user-agent') || '';
  if (isSuspiciousUA(ua) && request.nextUrl.pathname.startsWith('/api/')) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 4. Maintenance mode toggle (flip without redeploy)
  if (process.env.MAINTENANCE_MODE === 'true') {
    return NextResponse.rewrite(new URL('/maintenance', request.url));
  }

  return response;
}

function isSuspiciousUA(ua: string): boolean {
  const blocked = ['sqlmap', 'nikto', 'gobuster', 'dirbuster', 'nuclei'];
  return blocked.some(b => ua.toLowerCase().includes(b)) || ua === '';
}
```

---

## 3. Static Asset & API Response Caching

### Static Asset Caching (already handled by Next.js + Vercel + Cloudflare)
```
/_next/static/* → Immutable, cached forever (content-hash in filename)
/images/*       → Cache-Control: public, max-age=31536000, immutable
/fonts/*        → Cache-Control: public, max-age=31536000, immutable
```

### API Response Caching Strategy

| Endpoint | Cacheable? | Cache-Control | Cache Key |
|---|---|---|---|
| /api/agents (list) | YES | s-maxage=300 (5 min) | URL only |
| /api/agents/:id | YES | s-maxage=60 | URL only |
| /api/chat | NO | no-store | N/A (streaming) |
| /api/forum/posts | YES | s-maxage=30 | URL + page params |
| /api/user/profile | NO | private, no-cache | N/A (per-user) |
| /api/billing/plans | YES | s-maxage=3600 (1 hr) | URL only |
| /api/health/* | NO | no-cache | N/A |

### Implementing Caching in API Routes
```typescript
// src/app/api/agents/route.ts
export async function GET() {
  const agents = await prismaRead.agent.findMany({
    where: { isPublic: true },
  });

  return NextResponse.json(agents, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'CDN-Cache-Control': 'public, max-age=300',  // Cloudflare-specific
      'Vary': 'Accept-Encoding',
    },
  });
}
```

### Cloudflare Cache Rules (supplement Vercel)
```
Rule 1: Cache API responses with Cache-Control headers
  Match: hostname eq "stone-ai.net" and starts_with(http.request.uri.path, "/api/agents")
  Cache: Respect origin Cache-Control

Rule 2: Bypass cache for authenticated API calls
  Match: http.cookie contains "session" and starts_with(http.request.uri.path, "/api/")
  Cache: Bypass

Rule 3: Cache static pages aggressively
  Match: hostname eq "stone-ai.net" and not starts_with(http.request.uri.path, "/api/")
  Cache: Cache Everything, Edge TTL 1 hour
```

---

## 4. Edge Inference Feasibility

### Current State (2026)
- **Cloudflare Workers AI**: Supports models up to 70B on edge GPUs
- Available models include Llama, Mistral, Gemma families
- Inference latency: 10-50ms for small models at edge
- **No custom model upload yet** (only catalog models)

### Feasibility for Stone AI

| Use Case | Edge Feasible? | Model | Benefit |
|---|---|---|---|
| Intent classification | YES | Small classifier (2B) | Route to correct agent faster |
| Content moderation | YES | Toxicity classifier | Block bad content at edge |
| Query rewriting | MAYBE | Small instruct model | Better search queries |
| Full agent response | NO | Qwen 32B too large | Must use OMEN or cloud |
| Embedding generation | MAYBE | Small embedding model | Faster vector search prep |

### Recommended Edge AI Architecture (future)
```
User Request
  ↓
[Cloudflare Workers AI]
  ├── Intent classification (2B model, <50ms)
  ├── Content moderation (toxicity check, <30ms)
  └── Route decision:
        ├── Simple query → Edge-cached response
        ├── Agent query → OMEN vLLM (via tunnel)
        └── Complex/SMART → OpenAI GPT-4o (cloud)
```

### Implementation (when ready)
```typescript
// Cloudflare Worker for intent classification
export default {
  async fetch(request: Request, env: Env) {
    if (request.method === 'POST' && new URL(request.url).pathname === '/api/classify') {
      const { message } = await request.json();

      // Run lightweight classifier at edge
      const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: 'Classify this message as: greeting, question, task, complaint. Respond with one word.' },
          { role: 'user', content: message }
        ],
        max_tokens: 10,
      });

      return new Response(JSON.stringify({ intent: result.response }));
    }
    // Pass through to Vercel for everything else
    return fetch(request);
  }
};
```

---

## 5. Cloudflare Workers for Non-Inference Compute

### High-Value Worker Use Cases

#### 5a. Request Preprocessing
```typescript
// Strip PII before logging, add request ID, normalize headers
addEventListener('fetch', event => {
  const request = event.request;
  const newHeaders = new Headers(request.headers);
  newHeaders.set('X-Request-ID', crypto.randomUUID());
  newHeaders.set('X-Request-Timestamp', Date.now().toString());

  // Strip sensitive headers from logs
  newHeaders.delete('Cookie');
  newHeaders.delete('Authorization');

  event.respondWith(fetch(request, { headers: newHeaders }));
});
```

#### 5b. Geographic Load Balancing
```typescript
// Route to closest inference endpoint (future multi-region)
export default {
  async fetch(request: Request, env: Env) {
    const country = request.cf?.country || 'US';

    // Future: route to regional inference endpoints
    const backends = {
      'US': 'https://us.stone-ai.net',
      'EU': 'https://eu.stone-ai.net',  // future
      'default': 'https://stone-ai.net',
    };

    const backend = backends[country] || backends['default'];
    return fetch(backend + new URL(request.url).pathname, request);
  }
};
```

#### 5c. Response Streaming Optimization
```typescript
// For AI streaming responses, the Worker can add buffering
// to reduce the number of small chunks sent to the client
export default {
  async fetch(request: Request) {
    const response = await fetch(request);

    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      // Pass through SSE streams directly (no buffering for AI chat)
      return response;
    }

    return response;
  }
};
```

#### 5d. API Response Caching with Cache API
```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const cache = caches.default;
    const cacheKey = new Request(request.url, request);

    // Check cache first
    let response = await cache.match(cacheKey);
    if (response) return response;

    // Fetch from origin
    response = await fetch(request);

    // Cache if cacheable
    if (response.ok && response.headers.get('Cache-Control')?.includes('s-maxage')) {
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
    }

    return response;
  }
};
```

---

## 6. Database Query Optimization for Remote Users

### Problem: Neon is in US-East-2. Users in Asia add 300ms+ per DB query.

### Solutions (ordered by effort)

#### 6a. Aggressive Server-Side Caching (LOW effort)
```typescript
// Cache DB results in Vercel's serverless function memory
// Good for data that changes infrequently

import { unstable_cache } from 'next/cache';

export const getCachedAgents = unstable_cache(
  async () => {
    return prismaRead.agent.findMany({ where: { isPublic: true } });
  },
  ['agents-list'],
  { revalidate: 300 }  // 5 minutes
);
```

#### 6b. Cloudflare KV for Global Data (MEDIUM effort)
```typescript
// Store frequently-read data in Cloudflare KV (global, <50ms reads)
// Good for: agent configs, pricing tiers, feature flags

// Write (on change):
await env.STONE_KV.put('agents:public', JSON.stringify(agents), {
  expirationTtl: 300
});

// Read (from any edge location):
const agents = JSON.parse(await env.STONE_KV.get('agents:public'));
```

#### 6c. Redis Edge Cache (MEDIUM effort)
```typescript
// Use Upstash Redis (serverless, global replication)
// or keep existing Redis for US-East users
// Add Upstash for global edge caching

import { Redis } from '@upstash/redis';
const redis = Redis.fromEnv();

async function getCachedData(key: string, fetcher: () => Promise<any>, ttl: number) {
  const cached = await redis.get(key);
  if (cached) return cached;

  const fresh = await fetcher();
  await redis.setex(key, ttl, JSON.stringify(fresh));
  return fresh;
}
```

#### 6d. Neon Read Replica (future, when multi-region available)
- Neon's roadmap includes multi-region read replicas
- When available: deploy read replica in EU and Asia
- Route read queries to nearest replica based on user geo

---

## 7. Performance Budgets

### Per-Page Budgets

| Page | JS Bundle | LCP Target | INP Target | CLS Target |
|---|---|---|---|---|
| Landing (/) | <150KB | <1.5s | <100ms | <0.05 |
| Dashboard | <250KB | <2.0s | <150ms | <0.1 |
| Chat | <200KB | <2.0s | <100ms | <0.05 |
| Agent Select | <150KB | <1.5s | <100ms | <0.05 |
| Forum | <200KB | <2.0s | <150ms | <0.1 |
| Settings | <150KB | <2.0s | <200ms | <0.05 |
| Admin | <300KB | <3.0s | <200ms | <0.1 |

### API Response Time Budgets

| Endpoint Category | P50 | P95 | P99 |
|---|---|---|---|
| Auth operations | <100ms | <300ms | <1s |
| CRUD operations | <150ms | <500ms | <1s |
| List/search | <200ms | <600ms | <1.5s |
| AI inference (TTFT) | <1s | <3s | <5s |
| AI inference (full) | <5s | <15s | <30s |
| File upload | <500ms | <2s | <5s |

### Network Budgets

| Metric | Budget |
|---|---|
| Total page weight (initial load) | <500KB |
| Total page weight (with lazy load) | <2MB |
| Number of requests (initial) | <30 |
| Time to Interactive | <3.5s (3G) |
| First Contentful Paint | <1.8s |

---

## 8. Real-User Metrics (RUM) Monitoring Setup

### Option 1: Vercel Analytics + Speed Insights (RECOMMENDED - minimal effort)
```bash
npm install @vercel/analytics @vercel/speed-insights
```

```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

**What you get**:
- Core Web Vitals (LCP, INP, CLS) from real users
- Page-level performance breakdown
- Geographic performance distribution
- Device/browser breakdown
- Vercel dashboard integration

### Option 2: Custom RUM with web-vitals library (more control)
```typescript
// src/lib/rum.ts
import { onLCP, onINP, onCLS, onFCP, onTTFB } from 'web-vitals';

function sendMetric(metric: any) {
  // Send to your analytics endpoint
  const body = {
    name: metric.name,
    value: metric.value,
    rating: metric.rating,  // 'good', 'needs-improvement', 'poor'
    delta: metric.delta,
    id: metric.id,
    page: window.location.pathname,
    country: document.querySelector('meta[name="user-country"]')?.getAttribute('content'),
    timestamp: Date.now(),
  };

  // Use sendBeacon for reliability (won't be cancelled on page unload)
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/rum', JSON.stringify(body));
  } else {
    fetch('/api/rum', { method: 'POST', body: JSON.stringify(body), keepalive: true });
  }
}

export function initRUM() {
  onLCP(sendMetric);
  onINP(sendMetric);
  onCLS(sendMetric);
  onFCP(sendMetric);
  onTTFB(sendMetric);
}
```

### Option 3: Cloudflare Web Analytics (free, privacy-respecting)
```html
<!-- Add to layout — no JS bundle impact (loaded async from CF edge) -->
<script
  defer
  src='https://static.cloudflareinsights.com/beacon.min.js'
  data-cf-beacon='{"token": "YOUR_TOKEN"}'
></script>
```

**What you get**: Page views, Web Vitals, country breakdown, referrers. All from Cloudflare edge, no impact on page performance.

### Recommended Setup (use all three)
```
Layer 1: Cloudflare Web Analytics  → Free, lightweight, global overview
Layer 2: Vercel Speed Insights     → Detailed per-page Web Vitals
Layer 3: Custom RUM (future)       → When you need custom metrics or AI-specific tracking
```

### Alerting on Performance Regression
```typescript
// src/app/api/rum/route.ts (if using custom RUM)
export async function POST(request: Request) {
  const metric = await request.json();

  // Alert on poor Core Web Vitals
  if (metric.rating === 'poor') {
    // Log to Redis for aggregation
    await redis.lpush(`rum:poor:${metric.name}`, JSON.stringify({
      value: metric.value,
      page: metric.page,
      timestamp: metric.timestamp,
    }));

    // If >10 poor ratings in 5 minutes, alert
    const recentPoor = await redis.llen(`rum:poor:${metric.name}`);
    if (recentPoor > 10) {
      await sendAlert(`Performance alert: ${recentPoor} poor ${metric.name} ratings in last 5 minutes`);
    }
  }

  return new Response('ok');
}
```

---

## Summary: Implementation Roadmap

### Phase 1: Quick Wins (implement now, <1 day total)

| Action | Effort | Impact |
|---|---|---|
| Add Vercel Analytics + Speed Insights | 15 min | Visibility into real performance |
| Add Cloudflare Web Analytics | 5 min | Free global performance data |
| Set Cache-Control on cacheable API routes | 1 hour | Reduce origin hits 50%+ |
| Add security headers in middleware | 30 min | Security + minor perf |
| Enable Cloudflare cache rules | 30 min | Edge caching for static content |

### Phase 2: Optimization (post-launch)

| Action | Effort | Impact |
|---|---|---|
| Implement edge middleware for auth/routing | 2 hours | Faster auth checks |
| Add Cloudflare KV for global config data | 4 hours | <50ms reads worldwide |
| Set performance budgets in CI | 2 hours | Prevent regressions |
| Custom RUM endpoint with alerting | 4 hours | Proactive perf monitoring |

### Phase 3: Global Scale (when >30% non-US traffic)

| Action | Effort | Impact |
|---|---|---|
| Cloudflare Workers for preprocessing | 8 hours | Edge compute for routing |
| Edge AI for intent classification | 16 hours | Faster first response |
| Neon multi-region read replicas | 4 hours | <100ms DB reads globally |
| Upstash Redis for global caching | 4 hours | <50ms cache reads globally |
