# Serverless & Edge Patterns

## Palace Knowledge Seed — Advanced Backend Engineering

### Overview

Vercel's serverless and edge runtimes define the execution model for Stone AI. This seed covers Edge Functions, middleware at the edge, geolocation routing, A/B testing, cold start optimization, and practical patterns for the Stone AI stack (Next.js 16, Vercel, Cloudflare DNS).

---

## 1. Runtime Selection

### When to Use Edge vs Node.js

```typescript
// Edge Runtime: Fast, lightweight, limited APIs
// - Middleware (auth checks, redirects, headers)
// - Simple API routes (JSON responses)
// - Geolocation-based routing
// - A/B testing
// - Rate limiting checks
// Max execution: 30 seconds (Vercel Pro)

// Node.js Runtime: Full Node.js APIs
// - Database queries (Prisma)
// - File processing (Sharp)
// - Complex business logic
// - Streaming AI responses
// Max execution: 60 seconds (Vercel Pro)

// Choosing runtime per route:
// src/app/api/agents/route.ts
export const runtime = 'nodejs'; // Needs Prisma

// src/app/api/geo/route.ts
export const runtime = 'edge'; // Lightweight, needs speed
```

---

## 2. Edge Middleware

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware(async (auth, req: NextRequest) => {
  const response = NextResponse.next();

  // Security headers (applied at edge — fastest possible)
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Geolocation-based features
  const country = req.geo?.country ?? 'US';
  const city = req.geo?.city;
  const region = req.geo?.region;

  response.headers.set('X-User-Country', country);

  // Block sanctioned countries (compliance)
  const blockedCountries = ['KP', 'IR', 'SY', 'CU'];
  if (blockedCountries.includes(country)) {
    return new NextResponse('Service not available in your region', {
      status: 451,
    });
  }

  // Maintenance mode check
  const maintenanceMode = req.cookies.get('bypass-maintenance')?.value !== 'true';
  if (maintenanceMode && await isMaintenanceMode()) {
    // Allow API health checks through
    if (!req.nextUrl.pathname.startsWith('/api/health')) {
      return NextResponse.rewrite(new URL('/maintenance', req.url));
    }
  }

  return response;
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

async function isMaintenanceMode(): Promise<boolean> {
  // Check edge-compatible KV or header flag
  // Vercel Edge Config is ideal here
  return false;
}
```

---

## 3. Geolocation Routing

```typescript
// src/lib/edge/geo-routing.ts

interface GeoConfig {
  country: string;
  preferredProvider: 'vllm' | 'anthropic';
  latencyRegion: string;
  currency: string;
  language: string;
}

const GEO_CONFIGS: Record<string, Partial<GeoConfig>> = {
  US: { latencyRegion: 'us-east', currency: 'USD', language: 'en' },
  GB: { latencyRegion: 'eu-west', currency: 'GBP', language: 'en' },
  DE: { latencyRegion: 'eu-west', currency: 'EUR', language: 'de' },
  JP: { latencyRegion: 'ap-northeast', currency: 'JPY', language: 'ja' },
  BR: { latencyRegion: 'sa-east', currency: 'BRL', language: 'pt' },
};

export function getGeoConfig(country: string): GeoConfig {
  const config = GEO_CONFIGS[country] ?? {};

  return {
    country,
    preferredProvider: config.preferredProvider ?? 'vllm',
    latencyRegion: config.latencyRegion ?? 'us-east',
    currency: config.currency ?? 'USD',
    language: config.language ?? 'en',
  };
}

// Edge API route with geo-aware response
// src/app/api/pricing/route.ts
export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const country = req.geo?.country ?? 'US';
  const geoConfig = getGeoConfig(country);

  // Return pricing in local currency
  const pricing = getPricingForCurrency(geoConfig.currency);

  return NextResponse.json(pricing, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600',
      'CDN-Cache-Control': 'public, s-maxage=86400',
      'Vary': 'X-Vercel-IP-Country', // Cache varies by country
    },
  });
}
```

---

## 4. A/B Testing at the Edge

```typescript
// src/lib/edge/ab-testing.ts

interface ABTest {
  name: string;
  variants: { id: string; weight: number }[];
  isActive: boolean;
}

const AB_TESTS: ABTest[] = [
  {
    name: 'pricing-page-v2',
    variants: [
      { id: 'control', weight: 50 },
      { id: 'variant-a', weight: 25 },
      { id: 'variant-b', weight: 25 },
    ],
    isActive: true,
  },
  {
    name: 'onboarding-flow',
    variants: [
      { id: 'original', weight: 70 },
      { id: 'simplified', weight: 30 },
    ],
    isActive: true,
  },
];

export function assignVariant(
  testName: string,
  userId?: string
): string | null {
  const test = AB_TESTS.find((t) => t.name === testName && t.isActive);
  if (!test) return null;

  // Deterministic assignment based on userId (consistent experience)
  if (userId) {
    const hash = simpleHash(`${testName}:${userId}`);
    const bucket = hash % 100;

    let cumulative = 0;
    for (const variant of test.variants) {
      cumulative += variant.weight;
      if (bucket < cumulative) return variant.id;
    }
  }

  // Random assignment for anonymous users
  const random = Math.random() * 100;
  let cumulative = 0;
  for (const variant of test.variants) {
    cumulative += variant.weight;
    if (random < cumulative) return variant.id;
  }

  return test.variants[0].id;
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Middleware integration
export function applyABTests(
  req: NextRequest,
  response: NextResponse,
  userId?: string
): NextResponse {
  for (const test of AB_TESTS) {
    if (!test.isActive) continue;

    // Check for existing assignment in cookie
    const cookieKey = `ab-${test.name}`;
    const existing = req.cookies.get(cookieKey)?.value;

    const variant = existing ?? assignVariant(test.name, userId);

    if (variant) {
      // Set cookie for consistent experience
      if (!existing) {
        response.cookies.set(cookieKey, variant, {
          maxAge: 30 * 24 * 3600, // 30 days
          path: '/',
          sameSite: 'lax',
        });
      }

      // Add header for server components to read
      response.headers.set(`X-AB-${test.name}`, variant);
    }
  }

  return response;
}
```

---

## 5. Cold Start Optimization

```typescript
// src/lib/edge/cold-start.ts

// Strategy 1: Minimize imports — only import what you need
// BAD: import * as everything from 'heavy-library';
// GOOD: import { specificFunction } from 'heavy-library/specific-module';

// Strategy 2: Lazy initialization
let _prismaClient: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (!_prismaClient) {
    _prismaClient = new PrismaClient();
  }
  return _prismaClient;
}

// Strategy 3: Pre-warm critical paths
// Vercel Cron can ping functions to keep them warm
// vercel.json
// { "crons": [{ "path": "/api/health", "schedule": "*/5 * * * *" }] }

// Strategy 4: Edge Config for fast reads
// import { get } from '@vercel/edge-config';
// const value = await get('feature-flag-name'); // ~1ms read

// Strategy 5: Streaming to reduce TTFB
export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send headers immediately
      controller.enqueue(encoder.encode('{"status":"loading"'));

      // Do expensive work
      const data = await fetchExpensiveData();

      // Send results
      controller.enqueue(
        encoder.encode(`,"data":${JSON.stringify(data)}}`)
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/json' },
  });
}
```

---

## 6. Edge-Compatible Patterns

```typescript
// src/lib/edge/patterns.ts

// Pattern 1: Edge-compatible rate limiting (no Redis dependency)
// Uses Vercel KV (which is Redis-compatible but edge-accessible)

// Pattern 2: JWT validation at edge (no database call)
import { jwtVerify } from 'jose';

async function verifyTokenAtEdge(token: string): Promise<{ userId: string } | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
    const { payload } = await jwtVerify(token, secret);
    return { userId: payload.sub as string };
  } catch {
    return null;
  }
}

// Pattern 3: Feature flags at edge
const FEATURE_FLAGS: Record<string, boolean> = {
  'semantic-search': true,
  'new-onboarding': false,
  'premium-backdrops': true,
  'bestie-v2': false,
};

export function isFeatureEnabled(flag: string): boolean {
  return FEATURE_FLAGS[flag] ?? false;
}

// Pattern 4: Request coalescing — batch similar edge requests
class RequestCoalescer {
  private pending = new Map<string, Promise<any>>();

  async coalesce<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (this.pending.has(key)) {
      return this.pending.get(key) as Promise<T>;
    }

    const promise = fetcher().finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }
}
```

---

## 7. Vercel-Specific Optimizations

```typescript
// src/lib/edge/vercel.ts

// ISR (Incremental Static Regeneration) for semi-static content
// src/app/agents/page.tsx
export const revalidate = 3600; // Revalidate every hour

// On-demand revalidation
// src/app/api/revalidate/route.ts
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(req: Request) {
  const { secret, path, tag } = await req.json();

  if (secret !== process.env.REVALIDATION_SECRET) {
    return Response.json({ error: 'Invalid secret' }, { status: 401 });
  }

  if (path) revalidatePath(path);
  if (tag) revalidateTag(tag);

  return Response.json({ revalidated: true, now: Date.now() });
}

// Vercel Blob for file storage (edge-compatible)
// import { put, del } from '@vercel/blob';

// Vercel KV for edge-compatible Redis
// import { kv } from '@vercel/kv';
// await kv.set('key', 'value', { ex: 3600 });
// const value = await kv.get('key');

// Function configuration
// src/app/api/heavy-computation/route.ts
export const maxDuration = 60; // 60 seconds max (Vercel Pro)
export const dynamic = 'force-dynamic'; // Never cache
```

---

## 8. Edge Caching Strategy

```typescript
// src/lib/edge/caching.ts

// Cache-Control patterns for different content types
const CACHE_POLICIES = {
  // Static assets — cache forever (immutable)
  static: 'public, max-age=31536000, immutable',

  // Agent list — cache 1 hour, serve stale for 10 min during revalidation
  agents: 'public, s-maxage=3600, stale-while-revalidate=600',

  // User-specific data — never cache at CDN
  private: 'private, no-cache, no-store',

  // API responses — cache briefly at CDN
  api: 'public, s-maxage=60, stale-while-revalidate=30',

  // Pricing — cache 24 hours
  pricing: 'public, s-maxage=86400, stale-while-revalidate=3600',
};

export function setCacheHeaders(
  response: NextResponse,
  policy: keyof typeof CACHE_POLICIES,
  vary?: string[]
): NextResponse {
  response.headers.set('Cache-Control', CACHE_POLICIES[policy]);

  if (vary) {
    response.headers.set('Vary', vary.join(', '));
  }

  // Vercel-specific: CDN-level cache control
  response.headers.set(
    'CDN-Cache-Control',
    CACHE_POLICIES[policy]
  );

  return response;
}
```

---

## 9. Error Handling at the Edge

```typescript
// src/lib/edge/error-handling.ts

// Edge functions have limited error context — handle gracefully
export function edgeErrorResponse(
  error: unknown,
  fallbackMessage: string = 'Service error'
): Response {
  const status = error instanceof Response ? error.status : 500;
  const message = error instanceof Error ? error.message : fallbackMessage;

  return new Response(
    JSON.stringify({
      error: {
        message: status === 500 ? fallbackMessage : message,
        status,
      },
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    }
  );
}

// Timeout wrapper for edge functions
export async function withEdgeTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 25_000
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fn();
  } finally {
    clearTimeout(timeout);
  }
}
```

---

## Summary

| Pattern | Runtime | Stone AI Use Case |
|---------|---------|------------------|
| Auth middleware | Edge | Every request authentication |
| Geolocation routing | Edge | Currency/language detection |
| A/B testing | Edge | Pricing page variants |
| Feature flags | Edge | Gradual feature rollout |
| Rate limiting | Edge | Pre-filter before Node.js |
| AI streaming | Node.js | SSE for chat responses |
| Database queries | Node.js | Prisma operations |
| Image processing | Node.js | Avatar/backdrop optimization |
| Cache headers | Edge | CDN cache management |
| ISR | Build + Edge | Agent list, pricing pages |

The edge handles fast, lightweight operations (auth, routing, caching) while Node.js handles heavy lifting (database, AI, file processing). This split maximizes performance while keeping capabilities available.
