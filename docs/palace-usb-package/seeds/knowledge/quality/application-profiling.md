# Application Profiling — Wiz v3 Seed

> Computer Wiz (Royal Guard — The Diagnostician)
> Seed Class: Quality / Application Profiling
> Version: 3.0 — Full Software + Hardware Diagnostic Coverage
> Created: 2026-03-09

---

## 1. Philosophy: Profiling Is Measurement, Not Guessing

"The app is slow" is not a diagnosis. "The `/api/chat` endpoint spends 340ms in a Prisma query that does a sequential scan on the messages table" IS a diagnosis. Profiling replaces intuition with data. The Wiz never guesses — the Wiz measures.

**The Profiling Protocol:**
1. Reproduce the problem consistently
2. Measure baseline (before any fix)
3. Profile to identify the bottleneck
4. Fix the specific bottleneck
5. Measure again (prove the fix worked)
6. If still slow, go back to step 3 (the next bottleneck is now visible)

**Amdahl's Law Reminder:** If a function takes 5% of total time, making it infinitely fast only improves total performance by 5%. Always fix the BIGGEST bottleneck first.

---

## 2. CPU Profiling Methodology

### 2.1 What CPU Profiling Tells You

CPU profiling answers: "Where is my code spending compute time?" It shows you which functions are consuming the most CPU cycles, how deep call stacks go, and where hot paths exist.

**Two types of CPU profiles:**
- **Sampling profiler:** Periodically checks what the CPU is executing. Low overhead, statistical accuracy. Best for production.
- **Instrumentation profiler:** Wraps every function call with timing. Exact but high overhead. Best for development.

### 2.2 Node.js CPU Profiling

```bash
# Method 1: Built-in V8 profiler (generates v8.log)
node --prof app.js
# Process the output:
node --prof-process isolate-*.log > processed.txt

# Method 2: Chrome DevTools (RECOMMENDED for development)
node --inspect app.js
# Open chrome://inspect → click "inspect" → Performance tab → Record

# Method 3: Generate CPU profile programmatically
node --cpu-prof --cpu-prof-dir=./profiles app.js
# Generates .cpuprofile file → open in Chrome DevTools

# Method 4: Using v8-profiler-next in code
# npm install v8-profiler-next
```

```javascript
// Programmatic CPU profiling (useful for profiling specific operations)
const { Session } = require('inspector');
const fs = require('fs');

const session = new Session();
session.connect();

function startProfiling() {
  session.post('Profiler.enable', () => {
    session.post('Profiler.start');
  });
}

function stopProfiling(filename = 'profile.cpuprofile') {
  session.post('Profiler.stop', (err, { profile }) => {
    if (!err) {
      fs.writeFileSync(filename, JSON.stringify(profile));
      console.log(`Profile saved to ${filename}`);
    }
  });
}

// Usage: startProfiling() → do work → stopProfiling()
```

### 2.3 Reading CPU Profiles

**In Chrome DevTools (Performance tab):**
- **Flame Chart (bottom-up):** Wide bars = slow functions. Tall stacks = deep call chains.
- **Bottom-Up view:** Shows which functions consumed the most total time.
- **Call Tree (top-down):** Shows entry points → where time flows.
- **Self Time:** Time in the function itself (not its callees).
- **Total Time:** Time in the function AND everything it calls.

**What to look for:**
- Functions with high "Self Time" → optimize the function itself
- Functions with high "Total Time" but low "Self Time" → they call something slow
- Repeated identical call stacks → hot loop
- JSON.parse / JSON.stringify with high time → large payload serialization
- RegExp functions → potentially catastrophic backtracking

### 2.4 Python CPU Profiling

```python
# Method 1: cProfile (built-in, most common)
import cProfile
cProfile.run('main()', 'output.prof')

# Or from command line:
# python -m cProfile -o output.prof app.py

# Analyze results:
import pstats
stats = pstats.Stats('output.prof')
stats.sort_stats('cumulative')
stats.print_stats(20)  # Top 20 functions

# Method 2: py-spy (sampling profiler, no code changes needed)
# pip install py-spy
# py-spy top --pid <PID>           # Live top-like view
# py-spy record -o profile.svg --pid <PID>  # Flame graph SVG
# py-spy record -o profile.svg -- python app.py  # Profile from start

# Method 3: line_profiler (line-by-line timing)
# pip install line_profiler
# Decorate functions with @profile, then:
# kernprof -l -v app.py
```

---

## 3. Memory Profiling

### 3.1 Node.js Memory Profiling

**Understanding V8 Memory:**
```
V8 Memory Layout:
├── Heap (managed by GC)
│   ├── New Space (young generation) — short-lived objects, fast GC
│   ├── Old Space (old generation) — survived 2+ GC cycles
│   ├── Large Object Space — objects > ~512KB
│   ├── Code Space — compiled code (JIT)
│   └── Map Space — hidden classes / shapes
├── Stack — function call frames, local variables
└── External — C++ bound memory (Buffers, etc.)
```

```javascript
// Monitor memory in real-time
setInterval(() => {
  const mem = process.memoryUsage();
  console.log({
    rss: `${(mem.rss / 1024 / 1024).toFixed(1)} MB`,
    heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(1)} MB`,
    heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`,
    external: `${(mem.external / 1024 / 1024).toFixed(1)} MB`,
    arrayBuffers: `${(mem.arrayBuffers / 1024 / 1024).toFixed(1)} MB`,
  });
}, 5000);
```

**Heap Snapshot Methodology (Finding Memory Leaks):**

```bash
# Take heap snapshots at intervals
# 1. Start app with --inspect
node --inspect app.js

# 2. Open chrome://inspect → Memory tab
# 3. Take Snapshot #1 (baseline)
# 4. Perform the leaky operation 10-50 times
# 5. Force GC: click the trash can icon in DevTools
# 6. Take Snapshot #2
# 7. Compare: Select Snapshot #2 → change dropdown to "Comparison" → compare with Snapshot #1
```

**What to look for in heap comparisons:**
- **Objects with positive "# Delta"** — these are accumulating
- **Large "Size Delta"** — these are consuming the most new memory
- **Retained Size** — total memory held alive by this object (including references)
- **Retaining Tree** — shows WHY an object isn't being garbage collected (what's holding a reference)

**Common Node.js Memory Leaks:**

| Leak Pattern | Cause | Fix |
|-------------|-------|-----|
| Growing array/map | Unbounded cache without eviction | Use LRU cache with max size |
| Event listeners | Adding listeners without removing | removeListener on cleanup |
| Closures | Closure captures large scope | Minimize closure scope |
| Global variables | Accidental global (missing `const/let`) | Use strict mode, linting |
| Timers | setInterval without clearInterval | Always clear on shutdown |
| Streams | Not consuming readable stream | Pipe or resume |
| Prisma Client | Creating new PrismaClient per request | Singleton pattern |
| Next.js module scope | Module-level variables in API routes | Use request-scoped data |

```javascript
// Common leak: Prisma Client created per request (WRONG)
// This creates a new connection pool EVERY request
export async function GET() {
  const prisma = new PrismaClient(); // LEAK!
  const data = await prisma.user.findMany();
  return Response.json(data);
}

// Correct: Singleton Prisma Client
import { prisma } from '@/lib/prisma'; // Shared instance
export async function GET() {
  const data = await prisma.user.findMany();
  return Response.json(data);
}
```

### 3.2 Python Memory Profiling

```python
# Method 1: memory_profiler (line-by-line memory)
# pip install memory_profiler
from memory_profiler import profile

@profile
def my_function():
    a = [i for i in range(1000000)]
    b = {i: i*2 for i in range(1000000)}
    del b
    return a

# python -m memory_profiler app.py

# Method 2: tracemalloc (built-in, Python 3.4+)
import tracemalloc
tracemalloc.start()

# ... run code ...

snapshot = tracemalloc.take_snapshot()
top_stats = snapshot.statistics('lineno')
for stat in top_stats[:10]:
    print(stat)

# Method 3: objgraph (find reference chains)
# pip install objgraph
import objgraph
objgraph.show_most_common_types(limit=20)
objgraph.show_growth(limit=10)  # Call twice to see what's growing
# objgraph.show_backrefs(obj, filename='refs.png')  # Visualize references
```

### 3.3 Memory Leak Detection Decision Tree

```
SYMPTOM: Memory growing over time
│
├─ 1. Is RSS growing or just heap?
│  ├─ RSS growing, heap stable → External/native memory leak (Buffers, C++ addons)
│  └─ Heap growing → JavaScript object leak
│
├─ 2. Take two heap snapshots 5 minutes apart
│  ├─ Compare: what objects are accumulating?
│  │
│  ├─ Strings growing → Log accumulation, string concatenation in loop, template caching
│  ├─ Arrays growing → Unbounded collection, event history, message queue
│  ├─ Closures growing → Event listeners not removed, callbacks not cleaned up
│  ├─ Map/Set growing → Cache without eviction policy
│  └─ Objects with specific constructor → trace back to creation site
│
├─ 3. Check retaining tree for accumulated objects
│  ├─ Retained by global/module scope → Accidental global or module-level cache
│  ├─ Retained by event emitter → Listener leak
│  ├─ Retained by timer → setInterval reference
│  └─ Retained by promise → Unresolved promise chain
│
└─ 4. Common fixes:
   ├─ Add WeakRef/WeakMap for caches that don't need to prevent GC
   ├─ Add max size + eviction to all caches
   ├─ Use AbortController for cancellable operations
   ├─ Clear intervals/timeouts on component unmount
   └─ Use --max-old-space-size to crash early (fail fast) rather than slow death
```

---

## 4. I/O Bottleneck Detection

### 4.1 Identifying I/O Bottlenecks

I/O bottlenecks manifest as: high latency despite low CPU usage. The CPU is waiting for disk, network, or database.

```bash
# Linux/WSL: Check I/O wait
iostat -x 1 5
# %iowait > 20% = disk bottleneck
# await > 10ms for SSD = slow I/O
# %util > 80% = disk saturated

# Linux: Per-process I/O
iotop -o  # Shows only processes doing I/O

# Linux: File descriptor usage
ls /proc/<PID>/fd | wc -l
cat /proc/<PID>/io  # Read/write bytes per process
```

```powershell
# Windows: Disk performance
Get-Counter '\PhysicalDisk(*)\Avg. Disk sec/Read', '\PhysicalDisk(*)\Avg. Disk sec/Write', '\PhysicalDisk(*)\% Disk Time' -SampleInterval 2 -MaxSamples 5

# Windows: Per-process I/O
Get-Process | Sort-Object -Property @{Expression={$_.IO.ReadBytes + $_.IO.WriteBytes}} -Descending | Select-Object -First 10 Name, Id, @{N='ReadMB';E={[math]::Round(($_.IO.ReadBytes)/1MB,1)}}, @{N='WriteMB';E={[math]::Round(($_.IO.WriteBytes)/1MB,1)}}
```

### 4.2 Database I/O (Prisma/PostgreSQL)

```bash
# Enable Prisma query logging
# In schema.prisma or PrismaClient constructor:
# new PrismaClient({ log: ['query', 'warn', 'error'] })

# Or with timing:
# new PrismaClient({
#   log: [{ emit: 'event', level: 'query' }]
# })
# prisma.$on('query', (e) => {
#   console.log(`Query: ${e.query} — Duration: ${e.duration}ms`)
# })
```

```sql
-- PostgreSQL: Find slow queries
SELECT query, calls, mean_exec_time, total_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;

-- Analyze a specific query
EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)
SELECT * FROM "Message" WHERE "chatId" = 'xxx' ORDER BY "createdAt" DESC LIMIT 50;

-- What to look for:
-- Seq Scan on large table → needs index
-- Nested Loop with high rows → N+1 or missing join index
-- Sort with high cost → add index on sort column
-- Hash Join with large hash → consider index join
```

### 4.3 Network I/O

```bash
# Measure API endpoint timing breakdown
curl -w "\n---\nDNS:        %{time_namelookup}s\nConnect:    %{time_connect}s\nTLS:        %{time_appconnect}s\nPretransfer: %{time_pretransfer}s\nRedirect:   %{time_redirect}s\nTTFB:       %{time_starttransfer}s\nTotal:      %{time_total}s\nSize:       %{size_download} bytes\n" -o /dev/null -s https://stone-ai.net/api/health

# Interpretation:
# DNS > 100ms → DNS resolver slow, consider DNS caching
# Connect > 100ms → Network latency to server
# TLS > 200ms → TLS handshake slow (cert chain too long?)
# TTFB > 500ms → Server processing slow
# Total - TTFB = download time (large response?)
```

---

## 5. Thread Analysis

### 5.1 Node.js Threading Model

Node.js is single-threaded for JavaScript but uses threads for I/O:

```
Main Thread (Event Loop):
├── JavaScript execution (SINGLE THREADED)
├── Microtask queue (Promises, queueMicrotask)
├── Macrotask queue (setTimeout, setInterval, setImmediate)
└── I/O callbacks (file, network, DNS)

libuv Thread Pool (default 4 threads):
├── File system operations (fs.readFile, etc.)
├── DNS lookups (dns.lookup, NOT dns.resolve)
├── Crypto operations (crypto.pbkdf2, crypto.randomBytes)
└── Compression (zlib)

Worker Threads (explicit):
├── CPU-intensive work you offload manually
└── Each worker has its own V8 instance and event loop
```

```bash
# Check/increase UV thread pool size (default: 4)
# Set BEFORE requiring any modules:
UV_THREADPOOL_SIZE=16 node app.js

# Monitor thread pool usage (indirect — watch for stalled operations)
# If fs operations or DNS lookups are slow but CPU is idle → thread pool exhaustion
# Symptoms: simple file reads taking 100ms+, DNS lookups queueing
```

### 5.2 Thread-Related Performance Issues

```
SYMPTOM: Event loop lag but CPU not maxed
│
├─ Thread pool exhaustion?
│  ├─ Many concurrent fs operations → increase UV_THREADPOOL_SIZE
│  ├─ Many DNS lookups → use dns.resolve (uses c-ares, not thread pool)
│  └─ Heavy crypto → consider moving to worker thread
│
├─ Long-running synchronous operation?
│  ├─ JSON.parse of huge payload → stream parser
│  ├─ Regular expression on large string → optimize regex
│  ├─ Synchronous file operations (fs.readFileSync) → use async
│  └─ Tight loop processing → break into chunks with setImmediate
│
└─ Garbage collection pauses?
   ├─ node --trace-gc app.js  (log GC events)
   ├─ Long GC pauses (>50ms) → reduce heap pressure
   ├─ Frequent GC → too many short-lived objects
   └─ Use --expose-gc and global.gc() to force GC at controlled times
```

---

## 6. Node.js Clinic.js Suite

### 6.1 Clinic Doctor — Overall Health

```bash
# Install
npm install -g clinic

# Run doctor (automated diagnosis)
clinic doctor -- node app.js
# Makes requests → generates HTML report
# Identifies: event loop delay, memory, CPU, I/O issues

# With specific load:
clinic doctor --on-port 'autocannon localhost:$PORT' -- node app.js
```

**Doctor Report Interpretation:**
- **Event Loop:** Green = healthy. Yellow/Red = blocked or delayed.
- **CPU:** Constant 100% = compute-bound. Spiky = GC pauses.
- **Memory:** Steady growth = leak. Sawtooth = normal GC pattern.
- **Handles:** Growing active handles = resource leak.

### 6.2 Clinic Flame — CPU Flame Graphs

```bash
# Generate flame graph
clinic flame -- node app.js

# With load:
clinic flame --on-port 'autocannon -d 10 localhost:$PORT' -- node app.js
```

**Reading Flame Graphs:**
- **X-axis:** NOT time. Width = percentage of total samples where this function was on the stack.
- **Y-axis:** Call depth. Bottom = entry point, top = leaf function.
- **Wide bars at top** = functions spending a lot of time (optimize these)
- **Wide bars at bottom** = called frequently (hot paths)
- **Color:** Usually random. Some tools color by: module (red=app, blue=node core, green=npm)

**Common patterns:**
- Wide `JSON.parse` bar → large payloads, consider streaming
- Wide anonymous function → add names for clarity
- Wide `_compile` → heavy module loading (cold start)
- Deep narrow tower → deep recursion (may be fine if not wide)

### 6.3 Clinic Bubbleprof — Async Flow

```bash
# Visualize async operations
clinic bubbleprof -- node app.js

# With load:
clinic bubbleprof --on-port 'autocannon -d 10 localhost:$PORT' -- node app.js
```

**Bubbleprof shows:**
- **Bubbles** = groups of async operations
- **Lines** = data flow between groups
- **Size** = time spent
- **Color** = type (I/O, compute, etc.)
- Use this to find: sequential operations that could be parallel, slow I/O operations, unnecessary async chains

### 6.4 0x — Standalone Flame Graphs

```bash
# Install
npm install -g 0x

# Generate flame graph
0x app.js
# Output: flame graph HTML file

# With specific flags
0x --collect-only -- node --max-old-space-size=4096 app.js
# Generates profile data for later analysis
0x --visualize-only <profile-dir>
```

---

## 7. Browser Profiling

### 7.1 Chrome DevTools Performance Tab

**Recording a Performance Profile:**
1. Open DevTools (F12) → Performance tab
2. Click Record (or Ctrl+E)
3. Perform the slow interaction
4. Stop recording
5. Analyze the flame chart

**Key Panels:**
- **Summary:** Time breakdown — Scripting, Rendering, Painting, Idle
- **Bottom-Up:** Functions sorted by self time
- **Call Tree:** Top-down execution flow
- **Event Log:** Individual events with timing

**Performance Metrics to Watch:**
| Metric | Good | Needs Work | Poor |
|--------|------|------------|------|
| FCP (First Contentful Paint) | < 1.8s | 1.8-3.0s | > 3.0s |
| LCP (Largest Contentful Paint) | < 2.5s | 2.5-4.0s | > 4.0s |
| FID (First Input Delay) | < 100ms | 100-300ms | > 300ms |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.1-0.25 | > 0.25 |
| INP (Interaction to Next Paint) | < 200ms | 200-500ms | > 500ms |
| TTFB (Time to First Byte) | < 800ms | 800-1800ms | > 1800ms |

### 7.2 Chrome DevTools Memory Tab

**Heap Snapshot (find what's using memory):**
1. Memory tab → Heap snapshot → Take snapshot
2. Sort by "Retained Size" to find biggest objects
3. Filter by constructor name to find specific types

**Allocation instrumentation on timeline:**
1. Memory tab → Allocation instrumentation on timeline
2. Perform actions → Stop
3. Blue bars = allocations that are still alive (potential leaks)
4. Grey bars = allocations that were GC'd (normal)

**Allocation sampling:**
- Lower overhead than timeline
- Good for production-like profiling
- Shows which functions allocate the most memory

### 7.3 Lighthouse Profiling

```bash
# CLI Lighthouse (can run headlessly in CI)
npx lighthouse https://stone-ai.net --output html --output-path ./lighthouse-report.html

# With specific categories
npx lighthouse https://stone-ai.net --only-categories=performance --output json

# Chrome DevTools: Lighthouse tab → Analyze page load
```

**Lighthouse Categories:**
- **Performance:** Core Web Vitals, loading, interactivity
- **Accessibility:** Screen reader, contrast, ARIA
- **Best Practices:** HTTPS, no console errors, image aspect ratios
- **SEO:** Meta tags, crawlability, mobile-friendly

### 7.4 Coverage Tab

**Find unused JavaScript and CSS:**
1. DevTools → Ctrl+Shift+P → "Coverage"
2. Click reload button in Coverage panel
3. Interact with the page
4. See percentage of unused code per file

**Interpretation:**
- Red bars = unused code (dead code or lazy-loadable)
- Green bars = executed code
- Large files with >50% red → candidates for code splitting

```javascript
// Next.js dynamic import (code split heavy components)
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('@/components/HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false, // Skip server-side render if client-only
});
```

---

## 8. Decision Tree: "Slow Page"

```
PAGE IS SLOW
│
├─ 1. WHERE is the slowness?
│  │
│  ├─ Initial page load slow (TTFB high)?
│  │  ├─ Server-side issue. Profile the server:
│  │  │  ├─ Slow database query? (check Prisma logs)
│  │  │  ├─ Slow external API call? (Clerk, AI provider)
│  │  │  ├─ Server Component doing too much work?
│  │  │  ├─ Vercel cold start? (check function logs)
│  │  │  └─ Large page data? (check response size)
│  │  └─ Use: curl timing breakdown (Section 4.3)
│  │
│  ├─ Page loads fast but interaction is slow?
│  │  ├─ Client-side issue. Profile in browser:
│  │  │  ├─ Too many React re-renders? (React DevTools Profiler)
│  │  │  ├─ Heavy computation on click? (Performance tab flame chart)
│  │  │  ├─ Large list without virtualization?
│  │  │  ├─ Memory leak causing GC pauses? (Memory tab)
│  │  │  └─ Layout thrashing? (forced reflows in performance trace)
│  │  └─ Use: Chrome DevTools Performance tab
│  │
│  ├─ Everything slow (all pages)?
│  │  ├─ Infrastructure issue:
│  │  │  ├─ Server overloaded? (CPU/memory)
│  │  │  ├─ Database connection pool exhausted?
│  │  │  ├─ Network issue? (CDN, DNS)
│  │  │  └─ Rate limited by external service?
│  │  └─ Use: Vercel Analytics, DB metrics, network diagnostics
│  │
│  └─ Slow on some devices only?
│     ├─ Client performance issue:
│     │  ├─ Mobile CPU throttling
│     │  ├─ Large bundle on slow connection
│     │  └─ Animation/rendering on weak GPU
│     └─ Use: Lighthouse with mobile simulation
│
├─ 2. MEASURE before fixing:
│  ├─ Lighthouse score
│  ├─ Web Vitals (LCP, FID, CLS, INP)
│  ├─ API response time (curl -w)
│  ├─ Database query time (Prisma logs)
│  └─ Bundle size (next build output)
│
└─ 3. Common fixes by category:
   ├─ Server: Add caching, optimize queries, add indexes
   ├─ Client: Code split, virtualize lists, memoize, lazy load
   ├─ Network: CDN, compression, smaller payloads, fewer requests
   └─ Database: Indexes, query optimization, connection pooling
```

---

## 9. Decision Tree: "High Memory"

```
MEMORY USAGE IS HIGH
│
├─ 1. Is it GROWING or STABLE?
│  │
│  ├─ Stable at high level:
│  │  ├─ Large dataset loaded into memory? → Stream or paginate
│  │  ├─ Large cache? → Set max size, add eviction
│  │  ├─ Many loaded modules? → Code split, lazy imports
│  │  ├─ Large --max-old-space-size? → Might be appropriate
│  │  └─ Measure: is the heap mostly used or mostly allocated?
│  │     ├─ heapUsed close to heapTotal → memory is genuinely needed
│  │     └─ heapUsed << heapTotal → V8 over-allocated (may be fine)
│  │
│  └─ Growing over time (LEAK):
│     ├─ Take two heap snapshots 5 min apart
│     ├─ Compare → find accumulating objects
│     ├─ Check retaining tree → find what holds references
│     └─ Common leak sources:
│        ├─ Event listeners not removed
│        ├─ Closures capturing scope
│        ├─ Caches without max size
│        ├─ Global arrays/maps accumulating data
│        ├─ Prisma Client created per request
│        ├─ Unreferenced intervals (setInterval without clear)
│        └─ Unresolved promises holding callbacks
│
├─ 2. BROWSER memory high:
│  ├─ Detached DOM nodes? (DevTools Memory → filter "Detached")
│  ├─ Large images not lazy loaded?
│  ├─ Many tabs/components mounted simultaneously?
│  ├─ WebSocket holding message history?
│  └─ React state growing unboundedly?
│
└─ 3. Quick checks:
   ├─ process.memoryUsage() every 10 seconds (Node.js)
   ├─ Chrome DevTools → Performance Monitor → JS Heap Size
   ├─ Vercel → Functions → Memory usage per invocation
   └─ Docker: docker stats --no-stream <container>
```

---

## 10. Profiling Checklist for Stone AI

Before any performance investigation, run this checklist:

```
[ ] Reproduction steps documented
[ ] Baseline measurement taken (before changes)
[ ] Environment identified (dev/staging/prod, local/Vercel)
[ ] Profiling tool selected:
    [ ] Server performance → Prisma query logs + Node.js --inspect
    [ ] Client performance → Chrome DevTools Performance tab
    [ ] Memory leak → Heap snapshots (Node.js or browser)
    [ ] Bundle size → next build + bundle analyzer
    [ ] Overall page → Lighthouse
    [ ] API latency → curl timing
[ ] Profile captured and saved
[ ] Bottleneck identified with evidence (not guessing)
[ ] Fix applied targeting the specific bottleneck
[ ] Post-fix measurement taken
[ ] Improvement quantified (X ms → Y ms, X% improvement)
```

---

## 11. Performance Budgets for Stone AI

| Metric | Budget | Action if exceeded |
|--------|--------|-------------------|
| LCP | < 2.5s | Optimize server response, lazy load below fold |
| INP | < 200ms | Reduce JS execution, optimize event handlers |
| CLS | < 0.1 | Set explicit dimensions, avoid dynamic content injection |
| TTFB | < 800ms | Check server, DB queries, cold starts |
| JS Bundle (per route) | < 200KB gzipped | Code split, tree shake, lazy load |
| API response (p95) | < 500ms | Optimize queries, add caching |
| Database query (p95) | < 100ms | Add indexes, optimize query |
| Time to Interactive | < 3.5s | Reduce JS, defer non-critical |
| Total page weight | < 1MB | Compress images, minimize JS/CSS |

---

*This seed gives Wiz the precision tools to measure, analyze, and fix performance problems at every layer. Never guess — always measure.*
