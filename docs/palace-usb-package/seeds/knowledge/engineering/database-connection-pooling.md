# Database Connection Pooling

## Palace Knowledge Seed — Advanced Backend Engineering

### Overview

Connection pooling is critical for PostgreSQL performance in serverless environments. This seed covers PgBouncer configuration, Prisma connection pool settings, the Neon serverless driver, connection limits, pool sizing formulas, and practical patterns for the Stone AI stack (Next.js 16, Prisma 7.4.2, PostgreSQL 16, Neon, Vercel).

---

## 1. The Serverless Connection Problem

### Why Pooling Matters

Each PostgreSQL connection consumes ~5-10MB of RAM. Vercel serverless functions spin up and down constantly, each creating new connections. Without pooling:

- 100 concurrent function invocations = 100 database connections
- PostgreSQL default max_connections = 100
- Result: `FATAL: too many connections for role` errors

### Neon's Architecture

Neon separates compute from storage. Connection limits depend on the compute size:

| Neon Plan | Max Connections | Recommended Pool Size |
|-----------|-----------------|----------------------|
| Free      | 100             | 20-30                |
| Launch    | 200             | 50-80                |
| Scale     | 500             | 100-200              |

---

## 2. Prisma Connection Pool Configuration

### Basic Configuration

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: {
        // Use pooled connection string for queries
        url: process.env.DATABASE_URL,
      },
    },
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### Connection String Parameters

```env
# .env

# Neon pooled connection (through PgBouncer)
DATABASE_URL="postgresql://user:pass@ep-cool-name-pooler.us-east-2.aws.neon.tech/stoneai?sslmode=require&pgbouncer=true&connection_limit=10&pool_timeout=15"

# Neon direct connection (for migrations, schema changes)
DIRECT_DATABASE_URL="postgresql://user:pass@ep-cool-name.us-east-2.aws.neon.tech/stoneai?sslmode=require"
```

### Prisma Schema Configuration

```prisma
// prisma/schema.prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_DATABASE_URL")
}
```

### Connection Limit Tuning

```typescript
// src/lib/prisma.ts — Advanced configuration

const CONNECTION_LIMITS = {
  // Vercel serverless: keep pools small per instance
  serverless: {
    connectionLimit: 5,
    poolTimeout: 15,
  },
  // Local development: can afford more
  development: {
    connectionLimit: 10,
    poolTimeout: 30,
  },
  // Long-running worker processes
  worker: {
    connectionLimit: 20,
    poolTimeout: 60,
  },
} as const;

function getConnectionConfig() {
  if (process.env.WORKER_MODE === 'true') return CONNECTION_LIMITS.worker;
  if (process.env.NODE_ENV === 'development') return CONNECTION_LIMITS.development;
  return CONNECTION_LIMITS.serverless;
}

// Append connection parameters to DATABASE_URL
function buildConnectionUrl(): string {
  const base = process.env.DATABASE_URL!;
  const config = getConnectionConfig();

  const url = new URL(base);
  url.searchParams.set('connection_limit', String(config.connectionLimit));
  url.searchParams.set('pool_timeout', String(config.poolTimeout));

  return url.toString();
}
```

---

## 3. Neon Serverless Driver

The `@neondatabase/serverless` driver uses WebSocket connections, ideal for edge runtimes where TCP isn't available.

```typescript
// src/lib/prisma-neon.ts
import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool } from '@neondatabase/serverless';

// For Vercel Edge Runtime
function createNeonPrismaClient(): PrismaClient {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5, // Max connections in the pool
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  const adapter = new PrismaNeon(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

// For Node.js runtime (standard Prisma)
function createStandardPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: {
      db: { url: process.env.DATABASE_URL },
    },
  });
}

// Auto-select based on runtime
export const prisma =
  typeof globalThis.WebSocket !== 'undefined'
    ? createNeonPrismaClient()
    : createStandardPrismaClient();
```

### Direct SQL with Neon Serverless

```typescript
// src/lib/neon-sql.ts
import { neon, neonConfig } from '@neondatabase/serverless';

// Configure for optimal serverless performance
neonConfig.fetchConnectionCache = true;
neonConfig.poolQueryViaFetch = true;

const sql = neon(process.env.DATABASE_URL!);

// Use for lightweight queries that don't need Prisma overhead
export async function quickQuery<T>(
  query: string,
  params: unknown[] = []
): Promise<T[]> {
  return sql(query, params) as Promise<T[]>;
}

// Usage in API route
export async function GET() {
  // Fast, pooled, no Prisma overhead
  const users = await quickQuery<{ id: string; tier: string }>(
    'SELECT id, tier FROM users WHERE tier = $1 LIMIT 10',
    ['PRO']
  );

  return Response.json(users);
}
```

---

## 4. PgBouncer Configuration

Neon includes PgBouncer, but understanding the settings matters for optimization.

### Transaction Mode vs Session Mode

```
# PgBouncer modes:
# - transaction: Connection returned to pool after each transaction (recommended for serverless)
# - session: Connection held for entire session (needed for prepared statements)
# - statement: Connection returned after each statement (most aggressive)

# Neon uses transaction mode by default with ?pgbouncer=true
```

### Implications for Prisma

```typescript
// Transaction mode limitations:
// 1. No prepared statements (Prisma handles this)
// 2. No SET commands that persist across queries
// 3. No LISTEN/NOTIFY
// 4. No advisory locks across transactions

// BAD: This won't work in transaction mode
async function badPattern() {
  await prisma.$executeRaw`SET search_path TO custom_schema`;
  // Next query might use a different connection!
  await prisma.user.findMany(); // Different connection — SET is lost
}

// GOOD: Use transactions to keep the same connection
async function goodPattern() {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SET LOCAL search_path TO custom_schema`;
    // Same connection within the transaction
    const users = await tx.user.findMany();
    return users;
  });
}
```

---

## 5. Pool Sizing Formula

### How Many Connections?

```
Optimal pool size per instance = (Number of CPU cores * 2) + Number of disk spindles

For serverless (Vercel):
- Each function instance is single-threaded
- No local disk I/O (all network to Neon)
- Recommended: 3-10 connections per instance

Total pool budget:
- Neon max_connections: 100 (free) / 200 (launch) / 500 (scale)
- Reserve 10-20% for admin connections
- Divide remaining by expected max concurrent function instances

Example:
  Neon Scale plan: 500 max connections
  Reserve: 50 for admin/monitoring
  Available: 450
  Expected max functions: 50
  Pool per function: 450 / 50 = 9 connections per instance
```

```typescript
// src/lib/pool-config.ts

interface PoolConfig {
  connectionLimit: number;
  poolTimeout: number;
  idleTimeout: number;
}

function calculatePoolSize(): PoolConfig {
  const maxConnections = parseInt(process.env.DB_MAX_CONNECTIONS ?? '100');
  const reservedConnections = Math.ceil(maxConnections * 0.15);
  const available = maxConnections - reservedConnections;

  // Estimate max concurrent Vercel functions
  // Vercel Pro: up to 1000 concurrent invocations
  // But not all will be active simultaneously
  const estimatedConcurrentFunctions = parseInt(
    process.env.ESTIMATED_CONCURRENT_FUNCTIONS ?? '50'
  );

  const poolPerFunction = Math.max(
    2,
    Math.floor(available / estimatedConcurrentFunctions)
  );

  return {
    connectionLimit: Math.min(poolPerFunction, 15), // Cap at 15 per function
    poolTimeout: 15, // seconds to wait for a connection
    idleTimeout: 30, // seconds before idle connection is released
  };
}
```

---

## 6. Connection Health Monitoring

```typescript
// src/lib/db/health.ts
import { prisma } from '@/lib/prisma';

interface ConnectionHealth {
  isHealthy: boolean;
  latencyMs: number;
  activeConnections: number;
  idleConnections: number;
  maxConnections: number;
  waitingQueries: number;
}

export async function checkDatabaseHealth(): Promise<ConnectionHealth> {
  const start = Date.now();

  try {
    // Simple query to check connectivity
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;

    // Get connection statistics
    const stats = await prisma.$queryRaw<any[]>`
      SELECT
        numbackends as active_connections,
        (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') as max_connections
      FROM pg_stat_database
      WHERE datname = current_database()
    `;

    const pgStats = stats[0] ?? {};

    // Check for waiting queries
    const waiting = await prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count
      FROM pg_stat_activity
      WHERE wait_event_type = 'Lock'
        AND datname = current_database()
    `;

    return {
      isHealthy: latencyMs < 5000,
      latencyMs,
      activeConnections: pgStats.active_connections ?? 0,
      idleConnections: 0, // PgBouncer manages this
      maxConnections: pgStats.max_connections ?? 100,
      waitingQueries: Number(waiting[0].count),
    };
  } catch (error: any) {
    return {
      isHealthy: false,
      latencyMs: Date.now() - start,
      activeConnections: -1,
      idleConnections: -1,
      maxConnections: -1,
      waitingQueries: -1,
    };
  }
}

// Health check API route
// src/app/api/health/db/route.ts
export async function GET() {
  const health = await checkDatabaseHealth();

  return Response.json(health, {
    status: health.isHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
```

---

## 7. Connection Error Handling

```typescript
// src/lib/db/resilience.ts

// Common Prisma/PG connection errors
const RETRIABLE_ERRORS = [
  'P2024', // Timed out fetching a connection from the pool
  'P2028', // Transaction API error (connection lost)
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'Connection terminated unexpectedly',
  'too many connections',
  'connection is insecure',
];

function isRetriableError(error: any): boolean {
  const message = error?.message ?? '';
  const code = error?.code ?? '';

  return RETRIABLE_ERRORS.some(
    (pattern) =>
      message.includes(pattern) || code === pattern
  );
}

// Retry wrapper for database operations
export async function withDbRetry<T>(
  operation: () => Promise<T>,
  options?: { maxRetries?: number; baseDelay?: number }
): Promise<T> {
  const maxRetries = options?.maxRetries ?? 3;
  const baseDelay = options?.baseDelay ?? 500;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt === maxRetries || !isRetriableError(error)) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(
        `[DB] Retry ${attempt}/${maxRetries} after ${delay}ms:`,
        error.message
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Unreachable');
}

// Usage
const user = await withDbRetry(() =>
  prisma.user.findUnique({ where: { clerkId: userId } })
);

// Transaction with retry
const result = await withDbRetry(() =>
  prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { clerkId: userId },
      data: { tier: newTier },
    });
    await tx.auditLog.create({
      data: { action: 'TIER_CHANGE', userId: user.id, details: { newTier } },
    });
    return user;
  })
);
```

---

## 8. Connection Pooling for Different Workloads

```typescript
// src/lib/db/workload-pools.ts

// Different Prisma clients for different workload patterns

// Fast queries — small pool, short timeout
export const fastQueryClient = new PrismaClient({
  datasources: {
    db: {
      url: appendParams(process.env.DATABASE_URL!, {
        connection_limit: '3',
        pool_timeout: '5',
      }),
    },
  },
});

// Reporting/analytics — larger pool, longer timeout
export const reportingClient = new PrismaClient({
  datasources: {
    db: {
      url: appendParams(process.env.DATABASE_URL!, {
        connection_limit: '5',
        pool_timeout: '30',
      }),
    },
  },
});

// Migration client — direct connection, no pooler
export const migrationClient = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_DATABASE_URL },
  },
});

function appendParams(url: string, params: Record<string, string>): string {
  const parsed = new URL(url);
  for (const [key, value] of Object.entries(params)) {
    parsed.searchParams.set(key, value);
  }
  return parsed.toString();
}
```

---

## 9. Prisma Accelerate (Alternative)

Prisma Accelerate provides a managed connection pool as a global proxy.

```typescript
// src/lib/prisma-accelerate.ts
import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      // Accelerate URL replaces the direct connection
      url: process.env.PRISMA_ACCELERATE_URL,
    },
  },
}).$extends(withAccelerate());

// Usage with caching
const users = await prisma.user.findMany({
  where: { tier: 'PRO' },
  cacheStrategy: {
    ttl: 60,     // Cache for 60 seconds
    swr: 300,    // Serve stale for 5 minutes while revalidating
  },
});
```

---

## 10. Monitoring Pool Performance

```typescript
// src/lib/db/pool-metrics.ts

interface PoolMetrics {
  totalQueries: number;
  poolWaits: number;     // Times a query had to wait for a connection
  poolTimeouts: number;  // Times no connection was available
  avgQueryMs: number;
  p95QueryMs: number;
  connectionErrors: number;
}

class PoolMonitor {
  private metrics = {
    totalQueries: 0,
    poolWaits: 0,
    poolTimeouts: 0,
    queryTimes: [] as number[],
    connectionErrors: 0,
  };

  recordQuery(durationMs: number): void {
    this.metrics.totalQueries++;
    this.metrics.queryTimes.push(durationMs);

    // Keep only last 1000 query times
    if (this.metrics.queryTimes.length > 1000) {
      this.metrics.queryTimes = this.metrics.queryTimes.slice(-1000);
    }
  }

  recordPoolWait(): void {
    this.metrics.poolWaits++;
  }

  recordTimeout(): void {
    this.metrics.poolTimeouts++;
  }

  recordError(): void {
    this.metrics.connectionErrors++;
  }

  getMetrics(): PoolMetrics {
    const sorted = [...this.metrics.queryTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sorted.length * 0.95);

    return {
      totalQueries: this.metrics.totalQueries,
      poolWaits: this.metrics.poolWaits,
      poolTimeouts: this.metrics.poolTimeouts,
      avgQueryMs:
        sorted.length > 0
          ? sorted.reduce((a, b) => a + b, 0) / sorted.length
          : 0,
      p95QueryMs: sorted[p95Index] ?? 0,
      connectionErrors: this.metrics.connectionErrors,
    };
  }
}

export const poolMonitor = new PoolMonitor();

// Prisma middleware for monitoring
prisma.$use(async (params, next) => {
  const start = Date.now();

  try {
    const result = await next(params);
    poolMonitor.recordQuery(Date.now() - start);
    return result;
  } catch (error: any) {
    if (error.code === 'P2024') {
      poolMonitor.recordTimeout();
    } else if (isRetriableError(error)) {
      poolMonitor.recordError();
    }
    throw error;
  }
});
```

---

## Summary

| Component | Recommendation | Stone AI Setting |
|-----------|---------------|-----------------|
| Prisma pool per function | 3-10 connections | 5 (serverless), 10 (dev) |
| Pool timeout | 10-30 seconds | 15 seconds |
| Neon pooler | Always use `?pgbouncer=true` | Yes, transaction mode |
| Direct connection | Migrations only | `DIRECT_DATABASE_URL` |
| Neon serverless driver | Edge runtime | `@neondatabase/serverless` |
| Retry logic | 3 attempts, exponential backoff | Yes, via `withDbRetry` |
| Health monitoring | Check latency and connection count | `/api/health/db` endpoint |
| Idle timeout | 30 seconds | Neon manages this |

Connection pooling is foundational — get it wrong and the database becomes the bottleneck; get it right and PostgreSQL handles thousands of concurrent serverless function invocations.
