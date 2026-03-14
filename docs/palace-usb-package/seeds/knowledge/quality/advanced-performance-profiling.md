# Advanced Performance Profiling

> Computer Wiz Quality Seed — Deep Performance Analysis & Profiling Techniques

## Purpose

Performance profiling goes far beyond "it feels slow." This seed equips Wiz with systematic techniques for identifying exactly WHERE time is spent, WHY resources are consumed, and HOW to fix bottlenecks with surgical precision. From CPU flame graphs to async profiling, every technique here is battle-tested on production Node.js systems.

---

## 1. CPU Flame Graphs

### What Flame Graphs Show

Flame graphs visualize stack traces over time. The x-axis represents the total sample population (not time), and the y-axis represents stack depth. Wider bars mean more CPU time spent in that function.

### Generating Flame Graphs in Node.js

**Method 1: Using --prof flag**

```bash
# Record CPU profile
node --prof app.js

# Process the isolate log
node --prof-process isolate-0x*.log > processed.txt
```

**Method 2: Using 0x (recommended)**

```bash
# Install 0x
npm install -g 0x

# Profile your application
0x app.js

# For Next.js
0x -- node node_modules/.bin/next start
```

**Method 3: Using perf (Linux/WSL)**

```bash
# Record with perf
perf record -F 99 -p $(pgrep -f "node") -g -- sleep 30

# Generate flame graph
perf script | stackcollapse-perf.pl | flamegraph.pl > flame.svg
```

### Reading Flame Graphs

1. **Wide plateaus at top**: Hot functions consuming CPU directly
2. **Tall narrow stacks**: Deep call chains (potential optimization: reduce call depth)
3. **Wide bases**: Entry points called frequently
4. **Gaps**: Idle time or I/O wait (not shown in CPU-only flame graphs)

### Common Patterns to Look For

```
Pattern: Wide bar in JSON.parse/JSON.stringify
Diagnosis: Excessive serialization — consider streaming JSON or binary protocols

Pattern: Wide bar in RegExp execution
Diagnosis: Catastrophic backtracking — review regex complexity, use RE2

Pattern: Wide bar in crypto operations
Diagnosis: Synchronous crypto on main thread — move to worker threads

Pattern: Wide bar in GC (garbage collection)
Diagnosis: Memory pressure — investigate allocation patterns
```

### Differential Flame Graphs

Compare two profiles to see what changed:

```bash
# Generate two profiles
0x --output-dir ./before app.js  # baseline
0x --output-dir ./after app.js   # after change

# Use difffolded.pl to compare
difffolded.pl before.folded after.folded | flamegraph.pl > diff.svg
```

Red = regression (more CPU), blue = improvement (less CPU).

---

## 2. Memory Heap Snapshots

### Taking Heap Snapshots Programmatically

```javascript
const v8 = require('v8');
const fs = require('fs');

function takeHeapSnapshot(label = 'snapshot') {
  const snapshotStream = v8.writeHeapSnapshot();
  console.log(`Heap snapshot written to: ${snapshotStream}`);
  return snapshotStream;
}

// Trigger via signal (production-safe)
process.on('SIGUSR2', () => {
  console.log('SIGUSR2 received — taking heap snapshot');
  takeHeapSnapshot(`manual-${Date.now()}`);
});
```

### Heap Snapshot Comparison Technique

1. Take snapshot at baseline (app idle after startup)
2. Run the suspected leaking operation N times
3. Force garbage collection: `node --expose-gc` then `global.gc()`
4. Take second snapshot
5. Compare in Chrome DevTools → Memory → Load snapshots → Comparison view

### Key Metrics in Heap Snapshots

| Metric | Meaning | Healthy Range |
|--------|---------|---------------|
| Shallow Size | Memory held directly by object | Varies |
| Retained Size | Memory freed if object is GC'd | Watch for large retained sizes |
| Distance | Hops from GC root | High distance = complex reference chains |
| Alloc Count | Number of allocations | Spikes indicate allocation pressure |

### Heap Timeline Recording

```javascript
// In Chrome DevTools connected to Node.js:
// 1. Open chrome://inspect
// 2. Click "inspect" on your Node.js process
// 3. Memory tab → "Allocation instrumentation on timeline"
// 4. Record, perform actions, stop
// 5. Blue bars = still alive, gray = collected
```

---

## 3. Async Profiling

### The Async Problem

Traditional CPU profiling misses time spent waiting for I/O. A function might take 500ms wall-clock time but only 2ms of CPU time. Async profiling captures the full picture.

### Using Async Hooks for Profiling

```javascript
const async_hooks = require('async_hooks');
const fs = require('fs');

const asyncTracker = new Map();

const hook = async_hooks.createHook({
  init(asyncId, type, triggerAsyncId) {
    asyncTracker.set(asyncId, {
      type,
      triggerAsyncId,
      initTime: process.hrtime.bigint(),
      beforeTime: null,
      afterTime: null,
    });
  },
  before(asyncId) {
    const record = asyncTracker.get(asyncId);
    if (record) record.beforeTime = process.hrtime.bigint();
  },
  after(asyncId) {
    const record = asyncTracker.get(asyncId);
    if (record) {
      record.afterTime = process.hrtime.bigint();
      const waitTime = Number(record.beforeTime - record.initTime) / 1e6;
      const execTime = Number(record.afterTime - record.beforeTime) / 1e6;
      if (waitTime > 100) { // Log operations waiting >100ms
        fs.writeSync(1, `SLOW ASYNC [${record.type}]: wait=${waitTime.toFixed(1)}ms exec=${execTime.toFixed(1)}ms\n`);
      }
    }
  },
  destroy(asyncId) {
    asyncTracker.delete(asyncId);
  }
});

hook.enable();
```

### Async Context Tracking for Request Tracing

```javascript
const { AsyncLocalStorage } = require('async_hooks');

const requestContext = new AsyncLocalStorage();

// Middleware to establish context
function requestTracer(req, res, next) {
  const traceId = crypto.randomUUID();
  const context = {
    traceId,
    startTime: Date.now(),
    operations: [],
  };

  requestContext.run(context, () => {
    res.on('finish', () => {
      const ctx = requestContext.getStore();
      const totalTime = Date.now() - ctx.startTime;
      if (totalTime > 1000) {
        console.log(`SLOW REQUEST [${ctx.traceId}]: ${totalTime}ms`, ctx.operations);
      }
    });
    next();
  });
}

// Track individual async operations
function trackOperation(name, fn) {
  return async (...args) => {
    const ctx = requestContext.getStore();
    const start = Date.now();
    try {
      return await fn(...args);
    } finally {
      const duration = Date.now() - start;
      if (ctx) {
        ctx.operations.push({ name, duration });
      }
    }
  };
}
```

---

## 4. Node.js Clinic

### Clinic.js Suite

```bash
# Install
npm install -g clinic

# Clinic Doctor — overall health check
clinic doctor -- node app.js
# Generates HTML report with CPU, memory, event loop, and I/O analysis

# Clinic Bubbleprof — async operation visualization
clinic bubbleprof -- node app.js
# Shows async operation flow as bubble diagrams

# Clinic Flame — flame graph generation
clinic flame -- node app.js
# Produces interactive flame graph

# Clinic HeapProfiler — memory allocation tracking
clinic heapprofiler -- node app.js
# Shows allocation rates and patterns
```

### Interpreting Clinic Doctor Results

**Event Loop Delay**
- Green (< 20ms): Healthy
- Yellow (20-100ms): Monitor — some operations blocking
- Red (> 100ms): Critical — event loop is blocked

**CPU Usage**
- Sustained > 80%: Need to optimize CPU-bound work or offload to workers
- Spiky: Likely synchronous operations or GC pauses

**Memory RSS**
- Steadily growing: Memory leak
- Sawtooth pattern: Normal GC behavior
- Sudden jumps: Large allocations (check for buffer operations)

**Active Handles**
- Growing without bound: Resource leak (file handles, sockets, timers)
- Sudden drops: Mass cleanup or crash recovery

### Clinic Bubbleprof Patterns

```
Pattern: Large bubbles with long gaps between them
Diagnosis: Sequential async operations that should be parallelized

Pattern: Many small bubbles at the same level
Diagnosis: High concurrency — check if this is intentional

Pattern: One very large bubble dominating
Diagnosis: Single bottleneck operation (usually a slow query or external API)

Pattern: Bubbles growing over time
Diagnosis: Async operation leak — resources not being released
```

---

## 5. Chrome DevTools Performance Tab Deep Dive

### Connecting to Node.js

```bash
# Start Node.js with inspector
node --inspect app.js

# Start with break on first line
node --inspect-brk app.js

# For Next.js
NODE_OPTIONS='--inspect' next dev
```

### Performance Recording Workflow

1. **Open chrome://inspect** → click "inspect" on target
2. **Performance tab** → click Record (or Ctrl+E)
3. **Perform the operation** you want to profile
4. **Stop recording** → analyze the timeline

### Timeline Sections Explained

**Summary Pie Chart**
- Blue (Loading): Network requests, HTML parsing
- Yellow (Scripting): JavaScript execution
- Purple (Rendering): Style calculations, layout
- Green (Painting): Compositing, rasterizing
- Gray (System/Idle): OS-level or idle time

**Main Thread Flame Chart**
- Read top-to-bottom: caller → callee
- Width = duration
- Colors: Yellow = script, purple = layout, green = paint

**Key Metrics to Watch**

| Metric | Target | Critical |
|--------|--------|----------|
| Total Blocking Time (TBT) | < 200ms | > 600ms |
| Largest Contentful Paint (LCP) | < 2.5s | > 4s |
| First Input Delay (FID) | < 100ms | > 300ms |
| Cumulative Layout Shift (CLS) | < 0.1 | > 0.25 |
| Time to Interactive (TTI) | < 3.8s | > 7.3s |

### Identifying Long Tasks

Long tasks are any tasks > 50ms that block the main thread.

```javascript
// Programmatic detection of long tasks
const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.duration > 50) {
      console.warn('Long Task detected:', {
        duration: entry.duration,
        startTime: entry.startTime,
        name: entry.name,
      });
    }
  }
});

observer.observe({ entryTypes: ['longtask'] });
```

### Layout Thrashing Detection

```javascript
// BAD — forces synchronous layout
elements.forEach(el => {
  const height = el.offsetHeight; // Read
  el.style.height = height + 10 + 'px'; // Write — triggers layout
});

// GOOD — batch reads then writes
const heights = elements.map(el => el.offsetHeight); // All reads
elements.forEach((el, i) => {
  el.style.height = heights[i] + 10 + 'px'; // All writes
});
```

---

## 6. Event Loop Profiling

### Event Loop Lag Measurement

```javascript
const CHECK_INTERVAL = 100; // ms

let lastCheck = Date.now();
const lagHistory = [];

setInterval(() => {
  const now = Date.now();
  const lag = now - lastCheck - CHECK_INTERVAL;
  lastCheck = now;

  lagHistory.push({ timestamp: now, lag });
  if (lagHistory.length > 1000) lagHistory.shift();

  if (lag > 50) {
    console.warn(`Event loop lag: ${lag}ms`);
  }
}, CHECK_INTERVAL);

// Expose via health endpoint
function getEventLoopMetrics() {
  const recent = lagHistory.slice(-100);
  const lags = recent.map(r => r.lag);
  return {
    p50: percentile(lags, 50),
    p95: percentile(lags, 95),
    p99: percentile(lags, 99),
    max: Math.max(...lags),
    avg: lags.reduce((a, b) => a + b, 0) / lags.length,
  };
}
```

### Using perf_hooks for Precise Measurement

```javascript
const { monitorEventLoopDelay } = require('perf_hooks');

const h = monitorEventLoopDelay({ resolution: 20 });
h.enable();

// Read metrics periodically
setInterval(() => {
  console.log({
    min: h.min / 1e6,      // Convert ns to ms
    max: h.max / 1e6,
    mean: h.mean / 1e6,
    p50: h.percentile(50) / 1e6,
    p99: h.percentile(99) / 1e6,
    stddev: h.stddev / 1e6,
  });
  h.reset();
}, 10000);
```

---

## 7. Worker Thread Profiling

### Profiling Worker Threads

```javascript
const { Worker, isMainThread, parentPort } = require('worker_threads');

if (isMainThread) {
  // Main thread: spawn profiled worker
  const worker = new Worker(__filename, {
    execArgv: ['--cpu-prof', '--cpu-prof-dir=./profiles'],
  });

  worker.on('message', (msg) => {
    console.log('Worker result:', msg);
  });

  worker.on('exit', () => {
    console.log('Worker exited — CPU profile saved to ./profiles/');
  });
} else {
  // Worker thread: do the heavy work
  const result = heavyComputation();
  parentPort.postMessage(result);
}
```

### Worker Pool Performance Monitoring

```javascript
class MonitoredWorkerPool {
  constructor(size, workerScript) {
    this.workers = [];
    this.taskQueue = [];
    this.metrics = {
      totalTasks: 0,
      completedTasks: 0,
      totalWaitTime: 0,
      totalExecTime: 0,
      errors: 0,
    };

    for (let i = 0; i < size; i++) {
      this.workers.push({
        worker: new Worker(workerScript),
        busy: false,
        tasksCompleted: 0,
      });
    }
  }

  async execute(task) {
    this.metrics.totalTasks++;
    const queuedAt = Date.now();

    const workerSlot = this.workers.find(w => !w.busy);
    if (!workerSlot) {
      return new Promise((resolve, reject) => {
        this.taskQueue.push({ task, queuedAt, resolve, reject });
      });
    }

    return this._runOnWorker(workerSlot, task, queuedAt);
  }

  _runOnWorker(slot, task, queuedAt) {
    slot.busy = true;
    const waitTime = Date.now() - queuedAt;
    this.metrics.totalWaitTime += waitTime;

    return new Promise((resolve, reject) => {
      const startTime = Date.now();

      slot.worker.once('message', (result) => {
        const execTime = Date.now() - startTime;
        this.metrics.totalExecTime += execTime;
        this.metrics.completedTasks++;
        slot.tasksCompleted++;
        slot.busy = false;

        // Process queue
        if (this.taskQueue.length > 0) {
          const next = this.taskQueue.shift();
          this._runOnWorker(slot, next.task, next.queuedAt)
            .then(next.resolve)
            .catch(next.reject);
        }

        resolve(result);
      });

      slot.worker.postMessage(task);
    });
  }

  getMetrics() {
    return {
      ...this.metrics,
      avgWaitTime: this.metrics.totalWaitTime / this.metrics.completedTasks,
      avgExecTime: this.metrics.totalExecTime / this.metrics.completedTasks,
      queueDepth: this.taskQueue.length,
      busyWorkers: this.workers.filter(w => w.busy).length,
      workerUtilization: this.workers.map(w => ({
        busy: w.busy,
        tasksCompleted: w.tasksCompleted,
      })),
    };
  }
}
```

---

## 8. V8 Engine Internals for Profiling

### Understanding V8 Optimization Tiers

```
Tier 0: Interpreter (Ignition) — no optimization, fast startup
Tier 1: Sparkplug — baseline compiler, quick compilation
Tier 2: Maglev — mid-tier optimizing compiler
Tier 3: TurboFan — full optimizing compiler, slow to compile, fast to run
```

### Detecting Deoptimizations

```bash
# Run with deopt logging
node --trace-deopt app.js 2>&1 | grep "deoptimizing"

# More detailed: trace optimizations and deoptimizations
node --trace-opt --trace-deopt app.js > opt-log.txt 2>&1
```

### Common Deoptimization Causes

```javascript
// 1. Hidden class changes (polymorphic access)
// BAD
function Point(x, y) {
  this.x = x;
  this.y = y;
}
const p1 = new Point(1, 2);
p1.z = 3; // Changes hidden class — deopt

// GOOD
function Point(x, y, z = undefined) {
  this.x = x;
  this.y = y;
  this.z = z;
}

// 2. Megamorphic call sites
// BAD — function called with different shapes
function process(obj) {
  return obj.value; // V8 can't optimize if obj has many different shapes
}
process({ value: 1, a: 2 });
process({ value: 1, b: 2 });
process({ value: 1, c: 2 });
// ... many different shapes = megamorphic = slow

// 3. Arguments object leaking
// BAD
function bad() {
  return arguments; // Prevents optimization
}

// GOOD
function good(...args) {
  return args;
}
```

### V8 Memory Spaces

```
New Space (Young Generation): 1-8MB, fast allocation, frequent minor GC (Scavenge)
Old Space (Old Generation): Large, infrequent major GC (Mark-Sweep-Compact)
Large Object Space: Objects > 256KB go directly here
Code Space: Compiled code (JIT output)
Map Space: Hidden classes (object shapes)
```

```bash
# Monitor V8 GC activity
node --trace-gc app.js

# Detailed GC stats
node --trace-gc --trace-gc-verbose app.js

# GC summary
node --gc-global --max-old-space-size=4096 app.js
```

---

## 9. Production Profiling Strategies

### Low-Overhead Continuous Profiling

```javascript
const v8 = require('v8');

class ProductionProfiler {
  constructor(options = {}) {
    this.sampleRate = options.sampleRate || 0.01; // 1% of requests
    this.maxDuration = options.maxDuration || 30000; // 30s max
    this.outputDir = options.outputDir || '/tmp/profiles';
  }

  shouldProfile() {
    return Math.random() < this.sampleRate;
  }

  async profileRequest(req, handler) {
    if (!this.shouldProfile()) {
      return handler(req);
    }

    const session = new inspector.Session();
    session.connect();

    session.post('Profiler.enable');
    session.post('Profiler.start');

    const timeout = setTimeout(() => {
      this._stopAndSave(session, 'timeout');
    }, this.maxDuration);

    try {
      const result = await handler(req);
      clearTimeout(timeout);
      await this._stopAndSave(session, req.url);
      return result;
    } catch (err) {
      clearTimeout(timeout);
      await this._stopAndSave(session, `error-${req.url}`);
      throw err;
    }
  }

  _stopAndSave(session, label) {
    return new Promise((resolve) => {
      session.post('Profiler.stop', (err, { profile }) => {
        if (!err && profile) {
          const filename = `${this.outputDir}/profile-${label}-${Date.now()}.cpuprofile`;
          fs.writeFileSync(filename, JSON.stringify(profile));
        }
        session.disconnect();
        resolve();
      });
    });
  }
}
```

### Metrics Collection for Dashboards

```javascript
const { collectDefaultMetrics, Counter, Histogram, Gauge } = require('prom-client');

// Collect default Node.js metrics
collectDefaultMetrics({ prefix: 'stoneai_' });

// Custom metrics
const httpRequestDuration = new Histogram({
  name: 'stoneai_http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});

const activeConnections = new Gauge({
  name: 'stoneai_active_connections',
  help: 'Number of active connections',
});

const dbQueryDuration = new Histogram({
  name: 'stoneai_db_query_duration_seconds',
  help: 'Duration of database queries',
  labelNames: ['operation', 'table'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5],
});

// Middleware to track HTTP metrics
function metricsMiddleware(req, res, next) {
  const start = process.hrtime.bigint();
  activeConnections.inc();

  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e9;
    httpRequestDuration.observe(
      { method: req.method, route: req.route?.path || req.path, status_code: res.statusCode },
      duration
    );
    activeConnections.dec();
  });

  next();
}
```

---

## 10. Next.js Specific Profiling

### Server Component Profiling

```javascript
// next.config.js — enable profiling
module.exports = {
  experimental: {
    instrumentationHook: true,
  },
};

// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { setupProfiler } = await import('./lib/profiler');
    setupProfiler();
  }
}
```

### Measuring Server Component Render Time

```javascript
// lib/profiler.ts
const componentTimings = new Map();

export function profileComponent(name, renderFn) {
  return async function ProfiledComponent(props) {
    const start = performance.now();
    const result = await renderFn(props);
    const duration = performance.now() - start;

    const timings = componentTimings.get(name) || [];
    timings.push(duration);
    if (timings.length > 100) timings.shift();
    componentTimings.set(name, timings);

    if (duration > 100) {
      console.warn(`[SLOW COMPONENT] ${name}: ${duration.toFixed(1)}ms`);
    }

    return result;
  };
}
```

### Bundle Analysis

```bash
# Install analyzer
npm install @next/bundle-analyzer

# next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({ /* config */ });

# Run analysis
ANALYZE=true npm run build
```

### Route Segment Timing

```javascript
// Measure individual route segments
export async function generateMetadata({ params }) {
  const start = performance.now();
  // ... metadata generation
  console.log(`[PERF] generateMetadata: ${(performance.now() - start).toFixed(1)}ms`);
}

export default async function Page({ params }) {
  const timings = {};

  let start = performance.now();
  const data = await fetchData(params.id);
  timings.dataFetch = performance.now() - start;

  start = performance.now();
  const processed = processData(data);
  timings.processing = performance.now() - start;

  console.log(`[PERF] Page render timings:`, timings);

  return <Component data={processed} />;
}
```

---

## 11. Profiling Checklist for Wiz

### Pre-Profiling

- [ ] Identify the specific symptom: slow response, high CPU, memory growth, etc.
- [ ] Establish baseline metrics before changes
- [ ] Ensure profiling environment matches production (same data volume, similar load)
- [ ] Disable other monitoring that might skew results
- [ ] Document the exact steps to reproduce

### During Profiling

- [ ] Use the right tool for the symptom (CPU profile for CPU, heap snapshot for memory)
- [ ] Record multiple runs for statistical significance
- [ ] Profile under realistic load, not just single requests
- [ ] Monitor system-level metrics alongside application profiles
- [ ] Capture before AND after profiles for any change

### Post-Profiling

- [ ] Identify the top 3 hotspots (don't try to fix everything)
- [ ] Validate that the fix actually improves the metric
- [ ] Check for regressions in other areas
- [ ] Document findings for future reference
- [ ] Update performance baselines

### Profiling Tool Selection Matrix

| Symptom | Primary Tool | Secondary Tool |
|---------|-------------|----------------|
| High CPU | 0x flame graph | Clinic Doctor |
| Memory growth | Heap snapshots | Clinic HeapProfiler |
| Slow responses | Async profiling | Clinic Bubbleprof |
| Event loop lag | perf_hooks monitor | Clinic Doctor |
| Slow initial load | Bundle analyzer | Chrome Performance |
| Database slow | pg_stat_statements | Prisma logging |
| Network latency | Chrome Network tab | curl timing |

---

## 12. Performance Budget System

### Defining Budgets

```javascript
const PERFORMANCE_BUDGETS = {
  // Server-side budgets
  apiResponseTime: { p50: 100, p95: 500, p99: 1000 }, // ms
  dbQueryTime: { p50: 10, p95: 50, p99: 200 },
  serverRenderTime: { p50: 50, p95: 200, p99: 500 },

  // Client-side budgets
  bundleSize: { main: 200_000, vendor: 300_000, total: 500_000 }, // bytes gzipped
  lcp: 2500, // ms
  fid: 100,
  cls: 0.1,
  tti: 3800,

  // Resource budgets
  memoryRSS: 512 * 1024 * 1024, // 512MB
  eventLoopLag: { p95: 20, p99: 50 }, // ms
  activeHandles: 1000,
};

function checkBudget(metric, value, budget) {
  if (typeof budget === 'number') {
    return value <= budget;
  }
  // Percentile budgets
  return Object.entries(budget).every(([key, limit]) => {
    return value[key] <= limit;
  });
}
```

### Automated Budget Monitoring

```javascript
class PerformanceBudgetMonitor {
  constructor(budgets) {
    this.budgets = budgets;
    this.violations = [];
  }

  check(metricName, value) {
    const budget = this.budgets[metricName];
    if (!budget) return;

    const passed = checkBudget(metricName, value, budget);
    if (!passed) {
      const violation = {
        metric: metricName,
        value,
        budget,
        timestamp: Date.now(),
        severity: this._calculateSeverity(value, budget),
      };
      this.violations.push(violation);
      this._alert(violation);
    }
  }

  _calculateSeverity(value, budget) {
    const limit = typeof budget === 'number' ? budget : Math.max(...Object.values(budget));
    const actual = typeof value === 'number' ? value : Math.max(...Object.values(value));
    const ratio = actual / limit;

    if (ratio > 2) return 'critical';
    if (ratio > 1.5) return 'warning';
    return 'info';
  }

  _alert(violation) {
    console.error(`[BUDGET VIOLATION] ${violation.metric}: ${JSON.stringify(violation.value)} exceeds ${JSON.stringify(violation.budget)} (${violation.severity})`);
  }
}
```

---

## Stone AI Application Notes

- **Primary profiling target**: API routes serving agent responses (highest latency impact)
- **Bundle budget**: Monitor client-side JS for agent chat interface — keep interactive fast
- **Database profiling**: Prisma query logging + pg_stat_statements on Neon
- **Memory monitoring**: Critical for vLLM proxy and long-running agent sessions
- **Event loop health**: Agent tool execution can block — ensure async patterns
- **Worker threads**: Consider for heavy agent processing (document parsing, data analysis)
- **Production profiling**: Use 1% sampling rate on Vercel functions
- **Flame graphs**: Generate weekly during active development, review for regressions

---

*Computer Wiz — The Diagnostician. Performance is measured, not guessed.*
