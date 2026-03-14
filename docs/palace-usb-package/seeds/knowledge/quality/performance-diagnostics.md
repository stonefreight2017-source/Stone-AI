# Performance Diagnostics
## Profiling, Measurement, and Threshold Enforcement

Version: 1.0 | Stack: Next.js 16 + Prisma 7 + Neon + vLLM | Deploy: Vercel

---

## PERFORMANCE THRESHOLDS

```
| Operation              | Target   | Warn     | Critical  | Action at Critical           |
|------------------------|----------|----------|-----------|------------------------------|
| SSR page render        | <400ms   | >600ms   | >800ms    | Profile, optimize queries    |
| API read (GET)         | <50ms    | >80ms    | >100ms    | Check DB query, add cache    |
| API mutation (POST)    | <100ms   | >150ms   | >200ms    | Check transaction scope      |
| API with AI inference  | <5s      | >10s     | >30s      | Check model, reduce tokens   |
| WebSocket message      | <30ms    | >40ms    | >50ms     | Check event loop blocking    |
| Edge function cold     | <100ms   | >200ms   | >500ms    | Reduce bundle, split code    |
| DB query (simple)      | <10ms    | >30ms    | >50ms     | Check index, EXPLAIN ANALYZE |
| DB query (complex)     | <50ms    | >100ms   | >200ms    | Optimize query plan          |
| Time to First Byte     | <200ms   | >400ms   | >800ms    | Check SSR, middleware chain  |
| Largest Contentful P.  | <1.5s    | >2.5s    | >4s       | Optimize images, code split  |
```

---

## 1. MEMORY PROFILING

### Node.js Heap Snapshots
```typescript
/**
 * When to take heap snapshots:
 * - Memory usage growing over time (leak suspected)
 * - OOM crashes in production
 * - After processing large datasets
 */

// Manual heap snapshot trigger (dev only)
// Run with: node --inspect server.js
// Then in Chrome: chrome://inspect → "Take heap snapshot"

// Programmatic snapshot (for production diagnostics)
import v8 from 'v8';
import fs from 'fs';

function takeHeapSnapshot(label: string) {
  const filename = `/tmp/heap-${label}-${Date.now()}.heapsnapshot`;
  const stream = v8.writeHeapSnapshot(filename);
  console.log(`Heap snapshot written to: ${stream}`);
  return stream;
}

// Safe trigger: only when memory exceeds threshold
const HEAP_THRESHOLD = 512 * 1024 * 1024; // 512MB
setInterval(() => {
  const usage = process.memoryUsage();
  if (usage.heapUsed > HEAP_THRESHOLD) {
    console.warn(`Heap usage ${Math.round(usage.heapUsed / 1024 / 1024)}MB exceeds threshold`);
    // In production: log alert, don't auto-snapshot (I/O heavy)
  }
}, 30000); // Check every 30s
```

### Common Memory Leak Patterns
```
LEAK: Retained Closures
  SIGNATURE: Heap snapshot shows growing number of closures
  ROOT CAUSE: Event listener callbacks holding references to large objects
  FIX: Remove event listeners in cleanup (useEffect return, process.off)
  DETECTION:
    - Compare two heap snapshots taken 5 minutes apart
    - Look for growing "Detached DOM tree" or "Closure" counts

LEAK: Global Caches Without Eviction
  SIGNATURE: Map/Set growing unbounded
  ROOT CAUSE: Caching results without TTL or size limit
  FIX: Use LRU cache with max size:
    ```typescript
    // Simple LRU cache
    class LRUCache<K, V> {
      private cache = new Map<K, V>();
      constructor(private maxSize: number) {}
      get(key: K): V | undefined {
        const val = this.cache.get(key);
        if (val !== undefined) {
          this.cache.delete(key);
          this.cache.set(key, val); // Move to end (most recent)
        }
        return val;
      }
      set(key: K, val: V) {
        this.cache.delete(key);
        this.cache.set(key, val);
        if (this.cache.size > this.maxSize) {
          const oldest = this.cache.keys().next().value;
          this.cache.delete(oldest);
        }
      }
    }
    ```

LEAK: Prisma Client Instances
  SIGNATURE: Multiple PrismaClient instances in heap
  ROOT CAUSE: new PrismaClient() called per-request instead of singleton
  FIX: Use singleton pattern (see error-signature-database.md §2.3)
  DETECTION: grep -rn "new PrismaClient" src/ — should find exactly 1 occurrence

LEAK: ISR Cache Pressure
  SIGNATURE: Vercel function memory growing, eventual OOM
  ROOT CAUSE: Too many ISR-cached pages in memory
  FIX: Set revalidate intervals, reduce number of statically generated pages
  DETECTION: Monitor Vercel function memory in dashboard
```

### Memory Usage Monitoring Script
```typescript
function logMemoryUsage(label: string) {
  const usage = process.memoryUsage();
  console.log(`[Memory:${label}]`, {
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
    external: `${Math.round(usage.external / 1024 / 1024)}MB`,
  });
}

// Thresholds for alerts
const MEMORY_THRESHOLDS = {
  heapUsed: { warn: 256 * 1024 * 1024, critical: 512 * 1024 * 1024 },
  rss:      { warn: 512 * 1024 * 1024, critical: 1024 * 1024 * 1024 },
};
```

---

## 2. CPU PROFILING

### Event Loop Lag Detection
```typescript
/**
 * Event loop lag = time between scheduled callback and actual execution
 * Healthy: < 10ms | Warn: > 50ms | Critical: > 100ms
 */

function measureEventLoopLag(): Promise<number> {
  return new Promise(resolve => {
    const start = performance.now();
    setImmediate(() => {
      resolve(performance.now() - start);
    });
  });
}

// Continuous monitoring
let lagSamples: number[] = [];
setInterval(async () => {
  const lag = await measureEventLoopLag();
  lagSamples.push(lag);
  if (lagSamples.length > 100) lagSamples.shift();

  const avg = lagSamples.reduce((a, b) => a + b, 0) / lagSamples.length;
  if (avg > 50) {
    console.warn(`Event loop lag: ${avg.toFixed(1)}ms (avg of ${lagSamples.length} samples)`);
  }
}, 1000);
```

### Long Sync Operation Detection
```
PROBLEM: Synchronous operations blocking event loop in API routes
SYMPTOMS: All requests slow down simultaneously, not just one

DETECTION CHECKLIST:
  [ ] Search for fs.readFileSync, fs.writeFileSync in API routes
      grep -rn "Sync(" src/app/api/ --include="*.ts"

  [ ] Search for large JSON.parse calls
      grep -rn "JSON.parse" src/app/api/ --include="*.ts"
      Check: is the input bounded? Could it be multi-MB?

  [ ] Search for CPU-intensive loops
      grep -rn "for.*\.length\|while.*true" src/app/api/ --include="*.ts"
      Check: is the iteration count bounded?

  [ ] Search for synchronous crypto
      grep -rn "crypto\.\(.*Sync\|pbkdf2Sync\|scryptSync\)" src/ --include="*.ts"
      FIX: Use async variants (pbkdf2, scrypt)

FIX PATTERN:
  - Replace sync with async equivalent
  - Move CPU work to worker thread
  - Add pagination for large data processing
  - Stream instead of buffer-then-process
```

### N+1 Query Detection
```
PROBLEM: Fetching related records in a loop instead of using includes/joins
SYMPTOMS: API endpoint makes 100 DB queries instead of 1-2

DETECTION:
  1. Enable Prisma query logging:
     ```typescript
     const prisma = new PrismaClient({
       log: [{ emit: 'event', level: 'query' }],
     });
     prisma.$on('query', (e) => {
       console.log(`Query: ${e.query} (${e.duration}ms)`);
     });
     ```

  2. Count queries per request:
     ```typescript
     let queryCount = 0;
     prisma.$on('query', () => queryCount++);
     // After request: if queryCount > 10, likely N+1
     ```

  3. Pattern to grep for:
     ```
     // BAD — N+1 pattern
     const users = await prisma.user.findMany();
     for (const user of users) {
       const posts = await prisma.post.findMany({ where: { userId: user.id } });
     }

     // GOOD — single query with include
     const users = await prisma.user.findMany({
       include: { posts: true },
     });
     ```

  grep -rn "for.*of.*await.*prisma\." src/ --include="*.ts"
  → Any match is a potential N+1
```

---

## 3. NETWORK DIAGNOSTICS

### Waterfall Analysis
```
Tool: Chrome DevTools → Network tab → record page load
Or: Lighthouse CI in pipeline

CHECK LIST:
  [ ] No render-blocking scripts in <head> without async/defer
  [ ] CSS loaded before JS (paint earlier)
  [ ] API calls parallelized (not sequential)
  [ ] Images use next/image (automatic optimization)
  [ ] Third-party scripts loaded with strategy="lazyOnload"

COMMON WATERFALL ISSUES:
  1. Sequential API calls in useEffect chains
     FIX: Use Promise.all() or React Server Components
  2. Large JavaScript bundle blocking interaction
     FIX: dynamic(() => import(...), { ssr: false })
  3. Unoptimized images loading before viewport
     FIX: next/image with priority={true} only for above-fold
```

### Edge Function Cold Start Measurement
```bash
# Measure cold start by deploying, waiting, then hitting endpoint
# First request after idle period = cold start

# Measurement script:
for i in {1..5}; do
  curl -o /dev/null -s -w "attempt $i: %{time_total}s\n" https://stone-ai.net/api/health
  sleep 1
done

# First request: cold start (typically 100-500ms)
# Subsequent: warm (typically 10-50ms)

# If cold start > 500ms, check:
#   - Bundle size of the route handler
#   - Number of imports (each import = cold start penalty)
#   - Middleware chain length
```

---

## 4. DATABASE DIAGNOSTICS

### EXPLAIN ANALYZE Reading Guide
```sql
-- Run this in Neon console or via prisma.$queryRaw
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM "User" WHERE email = 'test@test.com';

-- Key metrics to check:
-- Planning Time:  should be < 1ms
-- Execution Time: should match our thresholds
-- Seq Scan: BAD on large tables (>1000 rows) — means no index
-- Index Scan: GOOD — using an index
-- Nested Loop: OK for small joins, BAD for large ones
-- Hash Join: GOOD for large joins
-- Rows Removed by Filter: HIGH number = index not selective enough
```

### Reading Decision Tree
```
Is it a Seq Scan on a large table?
  ├─ YES → Missing index. Create one:
  │   CREATE INDEX idx_user_email ON "User"(email);
  └─ NO → continue

Is "Rows Removed by Filter" > 10x returned rows?
  ├─ YES → Index exists but not selective. Consider composite index.
  └─ NO → continue

Is there a Nested Loop with high row count?
  ├─ YES → Consider rewriting as JOIN or using include in Prisma
  └─ NO → continue

Is Planning Time > 5ms?
  ├─ YES → Too many indexes or complex query. Simplify.
  └─ NO → continue

Is Execution Time within threshold?
  ├─ YES → Query is fine
  └─ NO → Profile further: check locks, connection pool, network latency
```

### Index Usage Analysis
```sql
-- Find unused indexes (bloat without benefit)
SELECT
  indexrelname AS index_name,
  idx_scan AS times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- If times_used = 0 and index is large → candidate for removal
-- EXCEPTION: unique indexes serve constraint purpose even if not scanned

-- Find missing indexes (slow queries without index)
SELECT
  relname AS table,
  seq_scan,
  idx_scan,
  seq_scan - idx_scan AS too_many_seq_scans
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan
ORDER BY too_many_seq_scans DESC;
```

### Query Plan Regression Detection
```
PROTOCOL:
  1. Before migration/deploy: EXPLAIN ANALYZE on critical queries, save output
  2. After migration/deploy: EXPLAIN ANALYZE same queries, compare
  3. Alert if:
     - Execution time increased > 2x
     - Seq Scan replaced Index Scan
     - New Nested Loop appeared
     - Rows scanned increased > 5x

CRITICAL QUERIES TO BASELINE:
  - User lookup by clerkId (every auth check)
  - Agent list by tier (every page load)
  - Chat message insert (every message)
  - Subscription lookup by userId (every tier check)
  - Referral lookup by code (every referral redemption)
```

### Pool Saturation Monitoring
```sql
-- Check current connections (Neon)
SELECT count(*) FROM pg_stat_activity;

-- Check connection states
SELECT state, count(*)
FROM pg_stat_activity
GROUP BY state;

-- Healthy: mostly 'idle', few 'active'
-- Unhealthy: many 'active' or 'idle in transaction'

-- Thresholds (for Neon serverless):
-- Total connections < 50%  of pool max → GREEN
-- Total connections 50-70% of pool max → YELLOW
-- Total connections > 70%  of pool max → RED → investigate
```

---

## 5. SAFE PROFILING PRACTICES

### Sampling vs Tracing
```
SAMPLING PROFILER (safe for production):
  - Takes periodic snapshots of call stack
  - Low overhead (1-5% CPU)
  - Good for finding hot functions
  - Node.js: --prof flag, then process with --prof-process
  - Chrome DevTools: Performance tab with CPU sampling

TRACING PROFILER (dev/staging only):
  - Records every function call entry/exit
  - High overhead (10-50% CPU)
  - Precise timing but slows down the system
  - Node.js: --trace-events-enabled
  - NEVER use in production

RECOMMENDATION:
  Production: sampling only, triggered by high CPU alert
  Staging: tracing during load tests
  Development: tracing during feature development
```

### Safe Heap Snapshot Triggers
```
SAFE TO SNAPSHOT:
  ├─ Development: anytime
  ├─ Staging: during load test cooldown (not during peak)
  ├─ Production: ONLY when:
  │   1. Memory has exceeded 70% of limit
  │   2. Instance is being drained (no new requests)
  │   3. Snapshot is written to /tmp (not persistent storage)
  │   4. Snapshot is fetched and deleted within 5 minutes

UNSAFE TO SNAPSHOT:
  ├─ During peak traffic (pauses the process)
  ├─ On instance handling real-time connections
  ├─ Repeatedly (each snapshot is ~500MB+)
  └─ Without disk space check first
```

---

## 6. PERFORMANCE DEBUGGING FLOWCHART

```
SYMPTOM: Slow page load
  │
  ├─ Is TTFB > 800ms? → Server-side issue
  │   ├─ Check SSR time (next build analyzer)
  │   ├─ Check DB query time (Prisma logging)
  │   ├─ Check middleware chain time
  │   └─ Check external API calls during render
  │
  ├─ Is LCP > 2.5s? → Client-side rendering issue
  │   ├─ Check image optimization (next/image)
  │   ├─ Check bundle size (next build output)
  │   ├─ Check code splitting (dynamic imports)
  │   └─ Check third-party script impact
  │
  └─ Is FID > 100ms? → JavaScript execution issue
      ├─ Check hydration time
      ├─ Check event handler complexity
      └─ Check for long tasks (>50ms)

SYMPTOM: Slow API endpoint
  │
  ├─ Is it slow on first call only? → Cold start
  │   ├─ Reduce imports in route file
  │   └─ Check Vercel function region
  │
  ├─ Is it slow on every call? → Logic issue
  │   ├─ Profile DB queries (N+1?)
  │   ├─ Check for sync operations
  │   └─ Check external API call time
  │
  └─ Is it slow under load only? → Scaling issue
      ├─ Check connection pool saturation
      ├─ Check event loop lag
      └─ Check Vercel concurrency limits

SYMPTOM: Slow AI response
  │
  ├─ Is vLLM health OK? → Check model load
  ├─ Is VRAM usage > 90%? → Reduce concurrent requests
  ├─ Is prompt > 8000 tokens? → Reduce context window
  └─ Is it the first request? → Model warmup needed
```

---

## QUICK REFERENCE: Measurement Commands

```bash
# Page load performance
lighthouse https://stone-ai.net --output json --quiet

# API endpoint timing
curl -o /dev/null -s -w "DNS: %{time_namelookup}\nConnect: %{time_connect}\nTTFB: %{time_starttransfer}\nTotal: %{time_total}\n" https://stone-ai.net/api/health

# Bundle analysis
ANALYZE=true npm run build  # if next-bundle-analyzer configured

# Node.js CPU profile (dev)
node --prof server.js
node --prof-process isolate-*.log > profile.txt

# Memory usage
node -e "console.log(process.memoryUsage())"

# DB query timing (via Prisma)
# Enable in PrismaClient: log: ['query']
```
