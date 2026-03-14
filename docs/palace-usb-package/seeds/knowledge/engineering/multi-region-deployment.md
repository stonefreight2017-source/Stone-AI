# Multi-Region Deployment for Stone AI Tools

## Seed Classification
- **Domain**: DevOps / Infrastructure
- **Platform**: Stone AI Tools (tools.stone-ai.net)
- **Complexity**: Advanced
- **Prerequisites**: CDN, DNS, container orchestration, data replication
- **Last Updated**: 2026-03-09

---

## 1. Multi-Region Architecture

### Deployment Topology

```
Multi-Region Layout:

                    ┌─────────────────────┐
                    │    Cloudflare CDN    │
                    │  (Global Edge + WAF) │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │  US-EAST-1   │ │  EU-WEST-1   │ │  AP-SOUTH-1  │
     │              │ │              │ │              │
     │ ┌──────────┐ │ │ ┌──────────┐ │ │ ┌──────────┐ │
     │ │ Gateway  │ │ │ │ Gateway  │ │ │ │ Gateway  │ │
     │ │ Cluster  │ │ │ │ Cluster  │ │ │ │ Cluster  │ │
     │ └────┬─────┘ │ │ └────┬─────┘ │ │ └────┬─────┘ │
     │      │       │ │      │       │ │      │       │
     │ ┌────┴─────┐ │ │ ┌────┴─────┐ │ │ ┌────┴─────┐ │
     │ │  Agent   │ │ │ │  Agent   │ │ │ │  Agent   │ │
     │ │ Services │ │ │ │ Services │ │ │ │ Services │ │
     │ └────┬─────┘ │ │ └────┬─────┘ │ │ └────┬─────┘ │
     │      │       │ │      │       │ │      │       │
     │ ┌────┴─────┐ │ │ ┌────┴─────┐ │ │ ┌────┴─────┐ │
     │ │  Redis   │ │ │ │  Redis   │ │ │ │  Redis   │ │
     │ │ (local)  │ │ │ │ (local)  │ │ │ │ (local)  │ │
     │ └──────────┘ │ │ └──────────┘ │ │ └──────────┘ │
     └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
            │                │                │
            └────────────────┼────────────────┘
                             │
                    ┌────────┴────────┐
                    │  Neon Database  │
                    │  (Primary:      │
                    │   US-EAST-1)    │
                    │  Read replicas  │
                    │  per region     │
                    └─────────────────┘
```

### Region Selection Strategy

```
Region Priorities:

Tier 1 (Launch):
  - US-EAST-1 (Virginia) — Primary region, lowest latency for NA
  - Primary database, all services

Tier 2 (Scale):
  - EU-WEST-1 (Ireland) — European data residency
  - Read replica, full service stack

Tier 3 (Global):
  - AP-SOUTH-1 (Mumbai) — Asia-Pacific coverage
  - Read replica, agent services
```

---

## 2. Edge Deployment with Cloudflare Workers

### 2.1 Edge Functions

```typescript
// File: edge/worker.ts
// Runs on Cloudflare Workers at 300+ edge locations

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // 1. Static asset serving (CDN cached)
    if (url.pathname.startsWith('/docs/') || url.pathname.startsWith('/static/')) {
      return env.ASSETS.fetch(request);
    }

    // 2. Health check (edge-local, no origin)
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        edge: request.cf?.colo,
        timestamp: new Date().toISOString(),
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // 3. API requests — route to nearest origin
    if (url.pathname.startsWith('/v1/')) {
      return routeToNearestOrigin(request, env);
    }

    // 4. Default — proxy to primary origin
    return fetch(request);
  },
};

async function routeToNearestOrigin(request: Request, env: Env): Promise<Response> {
  const continent = request.cf?.continent ?? 'NA';
  const country = request.cf?.country ?? 'US';

  // Select origin based on geographic proximity
  let origin: string;

  // Data residency check
  const tenantRegion = request.headers.get('X-Tenant-Region');
  if (tenantRegion) {
    origin = REGION_ORIGINS[tenantRegion];
  } else {
    // Geo-route based on request origin
    switch (continent) {
      case 'EU':
        origin = env.ORIGIN_EU;
        break;
      case 'AS':
      case 'OC':
        origin = env.ORIGIN_AP;
        break;
      default:
        origin = env.ORIGIN_US;
    }
  }

  // Add routing headers
  const modifiedRequest = new Request(origin + new URL(request.url).pathname + new URL(request.url).search, {
    method: request.method,
    headers: {
      ...Object.fromEntries(request.headers.entries()),
      'X-Edge-Location': request.cf?.colo ?? 'unknown',
      'X-Edge-Country': country,
      'X-Origin-Region': origin.includes('eu') ? 'eu-west-1' : origin.includes('ap') ? 'ap-south-1' : 'us-east-1',
    },
    body: request.body,
  });

  const response = await fetch(modifiedRequest);

  // Add edge headers to response
  const modifiedResponse = new Response(response.body, response);
  modifiedResponse.headers.set('X-Edge-Location', request.cf?.colo ?? 'unknown');
  modifiedResponse.headers.set('X-Origin-Region', origin.includes('eu') ? 'eu-west-1' : 'us-east-1');

  return modifiedResponse;
}

const REGION_ORIGINS: Record<string, string> = {
  'us-east-1': 'https://us-east.api.tools.stone-ai.net',
  'eu-west-1': 'https://eu-west.api.tools.stone-ai.net',
  'ap-south-1': 'https://ap-south.api.tools.stone-ai.net',
};
```

### 2.2 CDN Caching for API Responses

```typescript
// File: edge/cache-config.ts

// Cacheable API endpoints (GET only, public data)
const CACHE_CONFIG: Record<string, CacheRule> = {
  // Agent catalog — cached 5 minutes at edge
  'GET /v1/agents': {
    ttl: 300,
    staleWhileRevalidate: 60,
    varyBy: ['Accept', 'X-API-Version'],
    tags: ['agents-catalog'],
  },

  // Individual agent details — cached 5 minutes
  'GET /v1/agents/:agentId': {
    ttl: 300,
    staleWhileRevalidate: 60,
    varyBy: ['Accept', 'X-API-Version'],
    tags: ['agents-catalog'],
  },

  // OpenAPI spec — cached 1 hour
  'GET /v1/openapi.yaml': {
    ttl: 3600,
    staleWhileRevalidate: 300,
  },

  // NEVER cache:
  // POST endpoints (mutations)
  // Usage endpoints (per-tenant data)
  // Webhook endpoints (per-tenant config)
  // API key endpoints (sensitive)
};
```

---

## 3. Geo-Routing

### 3.1 DNS-Based Routing

```
DNS Configuration (Cloudflare):

api.tools.stone-ai.net
  │
  ├── Latency-based routing (Cloudflare Load Balancing)
  │   ├── Pool: us-east (primary, weight: 1.0)
  │   │   └── Origins: us-east-1a, us-east-1b, us-east-1c
  │   ├── Pool: eu-west (weight: 1.0)
  │   │   └── Origins: eu-west-1a, eu-west-1b
  │   └── Pool: ap-south (weight: 1.0)
  │       └── Origins: ap-south-1a, ap-south-1b
  │
  └── Fallback: us-east (if other regions fail)

Health checks: Every 30s per origin
Failover: Automatic, <60s detection
```

### 3.2 Application-Level Routing

```typescript
// File: src/gateway/routing/geo-router.ts

interface RegionConfig {
  id: string;
  name: string;
  endpoint: string;
  dbReadReplica: string;
  redisEndpoint: string;
  healthy: boolean;
  services: string[];  // Available services in this region
}

const REGIONS: RegionConfig[] = [
  {
    id: 'us-east-1',
    name: 'US East (Virginia)',
    endpoint: 'https://us-east.api.tools.stone-ai.net',
    dbReadReplica: process.env.DB_READ_US_EAST!,
    redisEndpoint: process.env.REDIS_US_EAST!,
    healthy: true,
    services: ['agent-executor', 'smart-agent-executor', 'billing', 'auth'],
  },
  {
    id: 'eu-west-1',
    name: 'EU West (Ireland)',
    endpoint: 'https://eu-west.api.tools.stone-ai.net',
    dbReadReplica: process.env.DB_READ_EU_WEST!,
    redisEndpoint: process.env.REDIS_EU_WEST!,
    healthy: true,
    services: ['agent-executor', 'auth'],
  },
  {
    id: 'ap-south-1',
    name: 'Asia Pacific (Mumbai)',
    endpoint: 'https://ap-south.api.tools.stone-ai.net',
    dbReadReplica: process.env.DB_READ_AP_SOUTH!,
    redisEndpoint: process.env.REDIS_AP_SOUTH!,
    healthy: true,
    services: ['agent-executor', 'auth'],
  },
];

class GeoRouter {
  /**
   * Select the best region for a request.
   * Priority: tenant preference > data residency > latency
   */
  selectRegion(req: GatewayRequest): RegionConfig {
    // 1. Tenant-specified region (data residency)
    const tenantRegion = req.metadata.tenantSettings?.preferredRegion;
    if (tenantRegion) {
      const region = REGIONS.find(r => r.id === tenantRegion && r.healthy);
      if (region) return region;
    }

    // 2. Data residency requirements (GDPR)
    const dataResidency = req.metadata.tenantSettings?.dataResidency;
    if (dataResidency === 'eu') {
      const euRegion = REGIONS.find(r => r.id.startsWith('eu') && r.healthy);
      if (euRegion) return euRegion;
    }

    // 3. Edge-detected location
    const edgeRegion = req.raw.headers['x-origin-region'] as string;
    if (edgeRegion) {
      const region = REGIONS.find(r => r.id === edgeRegion && r.healthy);
      if (region) return region;
    }

    // 4. Default to primary
    return REGIONS.find(r => r.id === 'us-east-1')!;
  }
}
```

---

## 4. Data Residency Compliance

### 4.1 GDPR Data Residency

```typescript
// File: src/services/data-residency.ts

/**
 * Data residency enforcement for GDPR and other regulations.
 *
 * Rules:
 * - EU tenants' data stays in EU region
 * - Tenant can choose preferred region
 * - Agent execution happens in the tenant's region
 * - Billing data may be in US (with tenant consent)
 */

interface DataResidencyConfig {
  tenantDataRegion: string;       // Where tenant data is stored
  executionRegion: string;        // Where agents run
  billingRegion: string;          // Where billing data lives
  logsRegion: string;             // Where logs are retained
  backupRegion: string;           // Where backups are stored
}

const RESIDENCY_POLICIES: Record<string, DataResidencyConfig> = {
  'eu': {
    tenantDataRegion: 'eu-west-1',
    executionRegion: 'eu-west-1',
    billingRegion: 'eu-west-1',
    logsRegion: 'eu-west-1',
    backupRegion: 'eu-west-1',
  },
  'us': {
    tenantDataRegion: 'us-east-1',
    executionRegion: 'us-east-1',
    billingRegion: 'us-east-1',
    logsRegion: 'us-east-1',
    backupRegion: 'us-east-1',
  },
  'global': {
    tenantDataRegion: 'us-east-1',  // Primary
    executionRegion: 'nearest',      // Nearest healthy region
    billingRegion: 'us-east-1',
    logsRegion: 'us-east-1',
    backupRegion: 'us-east-1',
  },
};

class DataResidencyService {
  async setTenantResidency(tenantId: string, residency: string): Promise<void> {
    const policy = RESIDENCY_POLICIES[residency];
    if (!policy) throw new ValidationError('Invalid residency option');

    await db.raw.tenant.update({
      where: { id: tenantId },
      data: {
        settings: {
          dataResidency: residency,
          preferredRegion: policy.tenantDataRegion,
        },
      },
    });

    // If switching to EU, schedule data migration
    if (residency === 'eu') {
      await jobQueue.add('tenant:migrate-data-region', {
        tenantId,
        targetRegion: 'eu-west-1',
      });
    }
  }
}
```

---

## 5. Failover Strategy

### 5.1 Automatic Failover

```typescript
// File: src/gateway/failover/failover-manager.ts

class FailoverManager {
  private regionHealth = new Map<string, boolean>();
  private failoverActive = new Map<string, string>(); // region -> fallback

  async checkRegionHealth(): Promise<void> {
    for (const region of REGIONS) {
      try {
        const response = await fetch(`${region.endpoint}/healthz`, {
          signal: AbortSignal.timeout(5_000),
        });

        const wasHealthy = this.regionHealth.get(region.id) ?? true;
        const isHealthy = response.ok;

        this.regionHealth.set(region.id, isHealthy);

        if (wasHealthy && !isHealthy) {
          await this.activateFailover(region.id);
        } else if (!wasHealthy && isHealthy) {
          await this.deactivateFailover(region.id);
        }
      } catch {
        const wasHealthy = this.regionHealth.get(region.id) ?? true;
        this.regionHealth.set(region.id, false);

        if (wasHealthy) {
          await this.activateFailover(region.id);
        }
      }
    }
  }

  private async activateFailover(failedRegion: string): Promise<void> {
    // Find best fallback region
    const fallback = REGIONS.find(r =>
      r.id !== failedRegion &&
      this.regionHealth.get(r.id) !== false
    );

    if (!fallback) {
      logger.error('NO HEALTHY REGIONS AVAILABLE', { failedRegion });
      await sendFounderAlert({
        alertType: 'infrastructure.critical',
        title: '[CRITICAL] All regions unhealthy',
        body: `Region ${failedRegion} failed and no healthy fallback available.`,
      });
      return;
    }

    this.failoverActive.set(failedRegion, fallback.id);

    logger.error('Region failover activated', {
      failedRegion,
      fallbackRegion: fallback.id,
    });

    // Update Cloudflare DNS/LB to redirect traffic
    await this.updateLoadBalancer(failedRegion, fallback.id);

    await sendFounderAlert({
      alertType: 'infrastructure.failover',
      title: `[FAILOVER] ${failedRegion} → ${fallback.id}`,
      body: `Region ${failedRegion} is unhealthy. Traffic redirected to ${fallback.id}.`,
    });
  }

  private async deactivateFailover(recoveredRegion: string): Promise<void> {
    const wasFailedOver = this.failoverActive.get(recoveredRegion);
    if (!wasFailedOver) return;

    this.failoverActive.delete(recoveredRegion);

    logger.info('Region recovered, deactivating failover', {
      recoveredRegion,
      previousFallback: wasFailedOver,
    });

    // Restore original DNS/LB configuration
    await this.restoreLoadBalancer(recoveredRegion);

    await sendFounderAlert({
      alertType: 'infrastructure.recovery',
      title: `[RECOVERED] ${recoveredRegion} back online`,
      body: `Region ${recoveredRegion} has recovered. Traffic restored.`,
    });
  }

  getActiveRegion(requestedRegion: string): string {
    return this.failoverActive.get(requestedRegion) ?? requestedRegion;
  }
}
```

---

## 6. Database Replication

### 6.1 Neon Read Replicas

```typescript
// File: src/lib/db/regional-client.ts

import { PrismaClient } from '@prisma/client';

/**
 * Regional database client that routes reads to local replicas
 * and writes to the primary.
 */
class RegionalDatabaseClient {
  private primary: PrismaClient;
  private readReplicas: Map<string, PrismaClient> = new Map();

  constructor() {
    // Primary (writes always go here)
    this.primary = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL! } },
    });

    // Read replicas per region
    if (process.env.DB_READ_US_EAST) {
      this.readReplicas.set('us-east-1', new PrismaClient({
        datasources: { db: { url: process.env.DB_READ_US_EAST } },
      }));
    }

    if (process.env.DB_READ_EU_WEST) {
      this.readReplicas.set('eu-west-1', new PrismaClient({
        datasources: { db: { url: process.env.DB_READ_EU_WEST } },
      }));
    }

    if (process.env.DB_READ_AP_SOUTH) {
      this.readReplicas.set('ap-south-1', new PrismaClient({
        datasources: { db: { url: process.env.DB_READ_AP_SOUTH } },
      }));
    }
  }

  /**
   * Get a read client for the current region.
   * Falls back to primary if no replica available.
   */
  reader(region?: string): PrismaClient {
    const currentRegion = region ?? process.env.CURRENT_REGION ?? 'us-east-1';
    return this.readReplicas.get(currentRegion) ?? this.primary;
  }

  /**
   * Get the write client (always primary).
   */
  writer(): PrismaClient {
    return this.primary;
  }
}

export const regionalDb = new RegionalDatabaseClient();
```

---

## 7. Redis Replication Strategy

```typescript
// File: src/lib/cache/regional-redis.ts

/**
 * Each region has its own Redis instance for:
 * - Rate limiting (must be local for low latency)
 * - Session cache (local for speed)
 * - Usage counters (local, aggregated to primary periodically)
 *
 * Cross-region data is synced via PostgreSQL or
 * Redis Streams for critical events.
 */

class RegionalRedis {
  private instances: Map<string, Redis> = new Map();

  constructor() {
    const regions = ['us-east-1', 'eu-west-1', 'ap-south-1'];
    for (const region of regions) {
      const url = process.env[`REDIS_${region.replace(/-/g, '_').toUpperCase()}`];
      if (url) {
        this.instances.set(region, new Redis(url));
      }
    }
  }

  local(): Redis {
    const region = process.env.CURRENT_REGION ?? 'us-east-1';
    return this.instances.get(region)!;
  }

  primary(): Redis {
    return this.instances.get('us-east-1')!;
  }

  // Sync critical data across regions (e.g., revoked API keys)
  async syncAcrossRegions(key: string, value: string, ttl?: number): Promise<void> {
    const promises = [];
    for (const [, redis] of this.instances) {
      if (ttl) {
        promises.push(redis.setex(key, ttl, value));
      } else {
        promises.push(redis.set(key, value));
      }
    }
    await Promise.allSettled(promises);
  }
}
```

---

## 8. Deployment Pipeline

```yaml
# File: .github/workflows/deploy-multi-region.yml

name: Multi-Region Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and push container
        run: |
          docker build -t stone-ai-tools-gateway .
          docker push $REGISTRY/stone-ai-tools-gateway:${{ github.sha }}

  deploy-us-east:
    needs: build
    runs-on: ubuntu-latest
    environment: production-us-east
    steps:
      - name: Deploy to US East
        run: |
          kubectl --context us-east-1 set image deployment/gateway \
            gateway=$REGISTRY/stone-ai-tools-gateway:${{ github.sha }}
          kubectl --context us-east-1 rollout status deployment/gateway

  deploy-eu-west:
    needs: deploy-us-east  # Sequential: US first, then EU
    runs-on: ubuntu-latest
    environment: production-eu-west
    steps:
      - name: Deploy to EU West
        run: |
          kubectl --context eu-west-1 set image deployment/gateway \
            gateway=$REGISTRY/stone-ai-tools-gateway:${{ github.sha }}
          kubectl --context eu-west-1 rollout status deployment/gateway

  deploy-ap-south:
    needs: deploy-eu-west
    runs-on: ubuntu-latest
    environment: production-ap-south
    steps:
      - name: Deploy to AP South
        run: |
          kubectl --context ap-south-1 set image deployment/gateway \
            gateway=$REGISTRY/stone-ai-tools-gateway:${{ github.sha }}
          kubectl --context ap-south-1 rollout status deployment/gateway

  verify:
    needs: [deploy-us-east, deploy-eu-west, deploy-ap-south]
    runs-on: ubuntu-latest
    steps:
      - name: Run synthetic checks
        run: |
          for region in us-east eu-west ap-south; do
            curl -f "https://${region}.api.tools.stone-ai.net/healthz" || exit 1
          done
```

---

## Summary

Multi-region deployment for Stone AI Tools:

1. **Edge Layer**: Cloudflare Workers at 300+ locations for TLS termination, geo-routing, and CDN caching
2. **Regional Origins**: US-East (primary), EU-West, AP-South — each with gateway, agent services, and Redis
3. **Geo-Routing**: DNS-based latency routing with application-level data residency enforcement
4. **Data Residency**: GDPR-compliant EU data residency option, per-tenant configuration
5. **Failover**: Automatic region failover with health checks every 30 seconds, <60s detection
6. **Database**: Neon primary in US-East with read replicas per region, writes routed to primary
7. **Redis**: Local instances per region for rate limiting and caching, cross-region sync for critical data
8. **Deployment**: Sequential rollout (US → EU → AP) with health verification between regions
