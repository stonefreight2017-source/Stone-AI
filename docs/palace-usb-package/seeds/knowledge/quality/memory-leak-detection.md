# Memory Leak Detection

> Computer Wiz Quality Seed — Node.js Memory Leak Identification, Analysis & Remediation

## Purpose

Memory leaks are silent killers. The application runs fine for hours, then response times degrade, garbage collection pauses grow, and eventually the process crashes with an out-of-memory error. This seed gives Wiz the complete toolkit for finding, diagnosing, and fixing memory leaks in Node.js applications — from closure leaks to event listener accumulation to native addon issues.

---

## 1. Understanding Node.js Memory Model

### V8 Memory Spaces

```
Heap Memory:
├── New Space (Young Generation)
│   ├── Semi-space A (active)
│   └── Semi-space B (inactive — used during Scavenge GC)
│   Size: 1-8MB per semi-space
│   GC: Scavenge (minor GC, very fast, ~1-2ms)
│
├── Old Space (Old Generation)
│   Size: Up to --max-old-space-size (default ~1.5GB on 64-bit)
│   GC: Mark-Sweep-Compact (major GC, can pause 100ms+)
│
├── Large Object Space
│   Objects > 256KB allocated directly here
│   GC: Mark-Sweep only (no compaction)
│
├── Code Space
│   JIT-compiled code
│
└── Map Space
    Hidden classes (object shapes/structures)

External Memory:
├── Buffers (ArrayBuffer, Buffer)
├── Native addon allocations
└── Not tracked by V8 GC — must be manually managed
```

### Memory Lifecycle

```
1. Allocation: Object created, placed in New Space
2. Survival: If object survives 2 Scavenge cycles → promoted to Old Space
3. Reference: As long as reachable from GC root → stays alive
4. Collection: When unreachable → eligible for GC
5. Reclamation: GC frees memory

LEAK = Object that SHOULD be unreachable but ISN'T due to unintended references
```

### Monitoring Memory in Real-Time

```javascript
// Basic memory monitoring
function getMemoryUsage() {
  const mem = process.memoryUsage();
  return {
    rss: (mem.rss / 1024 / 1024).toFixed(2) + ' MB',        // Total process memory
    heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(2) + ' MB', // V8 heap allocated
    heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(2) + ' MB',   // V8 heap used
    external: (mem.external / 1024 / 1024).toFixed(2) + ' MB',    // C++ objects (Buffers)
    arrayBuffers: (mem.arrayBuffers / 1024 / 1024).toFixed(2) + ' MB',
  };
}

// Periodic monitoring with trend detection
class MemoryMonitor {
  constructor(intervalMs = 30000) {
    this.history = [];
    this.interval = setInterval(() => this.sample(), intervalMs);
  }

  sample() {
    const mem = process.memoryUsage();
    this.history.push({
      timestamp: Date.now(),
      heapUsed: mem.heapUsed,
      rss: mem.rss,
      external: mem.external,
    });

    // Keep last 100 samples
    if (this.history.length > 100) this.history.shift();

    // Detect upward trend
    if (this.history.length >= 10) {
      const recent = this.history.slice(-10);
      const trend = this._calculateTrend(recent.map(s => s.heapUsed));
      if (trend > 0.5) { // Growing by >0.5 bytes per ms
        const growthRate = (trend * 1000 * 60 / 1024 / 1024).toFixed(2);
        console.warn(`[MEMORY WARNING] Heap growing at ${growthRate} MB/min`);
      }
    }
  }

  _calculateTrend(values) {
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumXX += i * i;
    }
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  }

  stop() {
    clearInterval(this.interval);
  }
}
```

---

## 2. Heap Snapshot Comparison Technique

### Three-Snapshot Method

This is the gold standard for leak detection:

```
1. Take Snapshot A (baseline — after warmup)
2. Perform the suspected leaking action N times (e.g., 100 API requests)
3. Force GC
4. Take Snapshot B
5. Perform the action N more times
6. Force GC
7. Take Snapshot C

Compare B→C (not A→B, which includes warmup artifacts)
Objects that grew between B and C are leak candidates.
```

### Programmatic Heap Snapshots

```javascript
const v8 = require('v8');
const fs = require('fs');
const path = require('path');

class HeapSnapshotManager {
  constructor(outputDir = '/tmp/heap-snapshots') {
    this.outputDir = outputDir;
    this.snapshots = [];
    fs.mkdirSync(outputDir, { recursive: true });
  }

  take(label = '') {
    // Force GC first (requires --expose-gc flag)
    if (global.gc) {
      global.gc();
      global.gc(); // Double GC to collect weak references
    }

    const filename = `heap-${label}-${Date.now()}.heapsnapshot`;
    const filepath = path.join(this.outputDir, filename);

    v8.writeHeapSnapshot(filepath);
    this.snapshots.push(filepath);

    const mem = process.memoryUsage();
    console.log(`Snapshot saved: ${filepath}`);
    console.log(`Heap used: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB`);

    return filepath;
  }

  // Expose via HTTP endpoint for production use
  registerEndpoint(app) {
    app.get('/debug/heap-snapshot', (req, res) => {
      const auth = req.headers['x-debug-token'];
      if (auth !== process.env.DEBUG_TOKEN) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const filepath = this.take(req.query.label || 'manual');
      res.json({ path: filepath, size: fs.statSync(filepath).size });
    });
  }
}
```

### Analyzing Snapshots in Chrome DevTools

```
1. Open Chrome DevTools (F12)
2. Memory tab
3. Load snapshot files
4. Switch to "Comparison" view (select two snapshots)
5. Sort by "# Delta" or "Size Delta"
6. Look for:
   - Constructors with growing instance counts
   - Strings accumulating (often from log buffers)
   - Arrays growing without bound
   - Closures holding references to large objects

Key columns:
  # New: Objects allocated since last snapshot
  # Deleted: Objects freed since last snapshot
  # Delta: Net change (positive = potential leak)
  Alloc. Size: Total size of new allocations
  Freed Size: Total size of freed memory
  Size Delta: Net memory change (positive = leak)
```

---

## 3. Common Leak Patterns in Node.js

### Pattern 1: Closure Leaks

```javascript
// LEAK: Closure holds reference to large data
function processLargeData(data) {
  const processed = transform(data); // 'data' is huge

  return function getResult() {
    // This closure captures the entire scope,
    // including 'data' which is no longer needed
    return processed.summary;
  };
}

// FIX: Null out large references
function processLargeData(data) {
  const processed = transform(data);
  data = null; // Release the reference

  return function getResult() {
    return processed.summary;
  };
}

// LEAK: Timer closure holding request context
function handleRequest(req, res) {
  const largeBody = req.body; // Could be MB of data

  setTimeout(() => {
    logAnalytics(largeBody); // Holds largeBody for 30 seconds
  }, 30000);

  res.json({ ok: true });
}

// FIX: Extract only what's needed
function handleRequest(req, res) {
  const analyticsData = {
    path: req.path,
    method: req.method,
    bodySize: JSON.stringify(req.body).length,
  };

  setTimeout(() => {
    logAnalytics(analyticsData); // Only holds small object
  }, 30000);

  res.json({ ok: true });
}
```

### Pattern 2: Event Listener Leaks

```javascript
// LEAK: Adding listeners without removing them
class ChatService {
  constructor(eventBus) {
    this.eventBus = eventBus;
  }

  handleConnection(socket) {
    // Every connection adds a listener — never removed!
    this.eventBus.on('broadcast', (msg) => {
      socket.send(msg);
    });
  }
}
// After 10,000 connections: 10,000 listeners on 'broadcast'

// FIX: Clean up on disconnect
class ChatService {
  constructor(eventBus) {
    this.eventBus = eventBus;
  }

  handleConnection(socket) {
    const handler = (msg) => socket.send(msg);
    this.eventBus.on('broadcast', handler);

    socket.on('close', () => {
      this.eventBus.removeListener('broadcast', handler);
    });
  }
}

// DETECTION: Node.js warns at 11 listeners per event
// Increase for legitimate cases:
emitter.setMaxListeners(50);
// Or detect programmatically:
if (emitter.listenerCount('event') > 100) {
  console.error('Possible listener leak on "event"');
}
```

### Pattern 3: Unbounded Caches/Maps

```javascript
// LEAK: Cache that never evicts
const cache = new Map();

function getCachedData(key) {
  if (cache.has(key)) return cache.get(key);
  const data = expensiveLookup(key);
  cache.set(key, data); // Grows forever!
  return data;
}

// FIX: Use LRU cache with size limit
class LRUCache {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key);
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) this.cache.delete(key);
    this.cache.set(key, value);

    if (this.cache.size > this.maxSize) {
      // Delete oldest entry
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }
}

// ALTERNATIVE: WeakMap for object-keyed caches
// Entries are automatically GC'd when key is GC'd
const weakCache = new WeakMap();
```

### Pattern 4: Unresolved Promises

```javascript
// LEAK: Promise that never resolves, holding references
function waitForEvent(emitter, event) {
  return new Promise((resolve) => {
    emitter.on(event, resolve); // If event never fires, promise + closure live forever
  });
}

// FIX: Add timeout
function waitForEvent(emitter, event, timeoutMs = 30000) {
  return new Promise((resolve, reject) => {
    const handler = (data) => {
      clearTimeout(timer);
      resolve(data);
    };

    const timer = setTimeout(() => {
      emitter.removeListener(event, handler);
      reject(new Error(`Timeout waiting for ${event}`));
    }, timeoutMs);

    emitter.once(event, handler); // 'once' auto-removes after first fire
  });
}
```

### Pattern 5: Circular References with External Resources

```javascript
// LEAK: Object holds resource, resource holds object
class Connection {
  constructor(pool) {
    this.pool = pool;
    this.data = Buffer.alloc(1024 * 1024); // 1MB buffer
    pool.connections.add(this); // Pool references connection
  }

  close() {
    // If close() is never called, the circular ref prevents GC
    // (V8 handles pure JS circular refs, but not if one side is native)
  }
}

// FIX: Use WeakRef and FinalizationRegistry
class ConnectionPool {
  constructor() {
    this.connections = new Set();
    this.registry = new FinalizationRegistry((ref) => {
      console.log('Connection was garbage collected without close()');
      this.connections.delete(ref);
    });
  }

  create() {
    const conn = new Connection(this);
    const weakRef = new WeakRef(conn);
    this.connections.add(weakRef);
    this.registry.register(conn, weakRef);
    return conn;
  }
}
```

### Pattern 6: Global State Accumulation

```javascript
// LEAK: Global arrays/objects that grow
const requestLog = []; // Grows with every request!

app.use((req, res, next) => {
  requestLog.push({
    time: Date.now(),
    path: req.path,
    headers: req.headers, // Headers can be large
  });
  next();
});

// FIX: Use ring buffer or external storage
class RingBuffer {
  constructor(size = 1000) {
    this.buffer = new Array(size);
    this.index = 0;
    this.size = size;
  }

  push(item) {
    this.buffer[this.index % this.size] = item;
    this.index++;
  }

  getRecent(count = 10) {
    const start = Math.max(0, this.index - count);
    return Array.from({ length: Math.min(count, this.index) }, (_, i) =>
      this.buffer[(start + i) % this.size]
    );
  }
}
```

---

## 4. WeakRef and FinalizationRegistry

### WeakRef Patterns

```javascript
// WeakRef: Reference that doesn't prevent GC
class ImageCache {
  constructor() {
    this.cache = new Map(); // key → WeakRef<Image>
  }

  set(key, image) {
    this.cache.set(key, new WeakRef(image));
  }

  get(key) {
    const ref = this.cache.get(key);
    if (!ref) return undefined;

    const image = ref.deref(); // Returns undefined if GC'd
    if (!image) {
      this.cache.delete(key); // Clean up dead entry
      return undefined;
    }
    return image;
  }
}
```

### FinalizationRegistry for Cleanup

```javascript
// Automatically clean up when objects are GC'd
const registry = new FinalizationRegistry((heldValue) => {
  console.log(`Object with ID ${heldValue} was garbage collected`);
  // Clean up associated resources
  externalResourceMap.delete(heldValue);
});

function createTrackedObject(id) {
  const obj = { id, data: new ArrayBuffer(1024 * 1024) };
  registry.register(obj, id); // When obj is GC'd, callback fires with id
  return obj;
}

// IMPORTANT: FinalizationRegistry callbacks are NOT guaranteed to fire
// Don't rely on them for critical cleanup — use explicit close()/dispose()
```

---

## 5. Garbage Collection Tuning

### GC Flags

```bash
# Increase old space (default ~1.5GB)
node --max-old-space-size=4096 app.js  # 4GB

# Increase new space (default ~16MB total for both semi-spaces)
node --max-semi-space-size=64 app.js  # 64MB per semi-space

# Expose GC for manual triggering (debugging only!)
node --expose-gc app.js

# Trace GC events
node --trace-gc app.js
# Output: [12345:0x...] 42 ms: Scavenge 20.1 (25.0) -> 18.5 (26.0) MB, 1.2 / 0.0 ms
#         [pid:address] time_since_start: GC_type from_size (allocated) -> to_size (allocated), gc_time / external_time

# Detailed GC logging
node --trace-gc-verbose --trace-gc-nvp app.js

# GC statistics
node --gc-global app.js
```

### Interpreting GC Logs

```
Scavenge: Minor GC (young generation)
  Normal: < 5ms, happening frequently
  Problem: > 10ms or happening every few ms

Mark-Sweep: Major GC (old generation)
  Normal: < 100ms, happening infrequently
  Problem: > 200ms, frequent pauses

Mark-Compact: Major GC with compaction
  Normal: < 200ms, rare
  Problem: Very frequent = high memory pressure

Incremental Marking: Spread across multiple steps
  Reduces pause times but increases total GC time
```

### GC-Friendly Code Patterns

```javascript
// 1. Reuse objects instead of creating new ones
// BAD:
function processItems(items) {
  return items.map(item => ({
    id: item.id,
    value: item.value * 2,
    processed: true,
  })); // Creates N new objects
}

// GOOD (when performance critical):
const resultPool = [];
let poolIndex = 0;

function processItems(items) {
  poolIndex = 0;
  for (const item of items) {
    if (!resultPool[poolIndex]) {
      resultPool[poolIndex] = { id: 0, value: 0, processed: false };
    }
    resultPool[poolIndex].id = item.id;
    resultPool[poolIndex].value = item.value * 2;
    resultPool[poolIndex].processed = true;
    poolIndex++;
  }
  return resultPool.slice(0, poolIndex);
}

// 2. Avoid creating short-lived closures in hot paths
// BAD:
array.forEach(item => process(item));
// GOOD:
for (const item of array) process(item);

// 3. Use TypedArrays for numerical data
// BAD:
const coords = [];
for (let i = 0; i < 10000; i++) {
  coords.push({ x: Math.random(), y: Math.random() });
}

// GOOD:
const coordsX = new Float64Array(10000);
const coordsY = new Float64Array(10000);
for (let i = 0; i < 10000; i++) {
  coordsX[i] = Math.random();
  coordsY[i] = Math.random();
}
```

---

## 6. External Memory Leaks

### Buffer Leaks

```javascript
// LEAK: Buffers allocated but never freed
const bufferCache = [];

function processFile(filepath) {
  const buf = fs.readFileSync(filepath);
  bufferCache.push(buf); // Accumulates!
  return analyze(buf);
}

// DETECTION: Check process.memoryUsage().external
// If external grows but heapUsed doesn't → Buffer/native leak

// LEAK: Streams not properly consumed
const readable = fs.createReadStream('large-file.txt');
// If you add a 'data' listener but never 'end' or 'error',
// the stream stays open and buffers accumulate

// FIX: Always handle stream lifecycle
const readable = fs.createReadStream('large-file.txt');
readable.on('data', (chunk) => { /* process */ });
readable.on('end', () => { /* cleanup */ });
readable.on('error', (err) => {
  readable.destroy();
  // handle error
});

// BEST: Use pipeline
const { pipeline } = require('stream/promises');
await pipeline(
  fs.createReadStream('input.txt'),
  transformStream,
  fs.createWriteStream('output.txt')
);
// Automatically handles cleanup on error
```

### Native Addon Memory

```javascript
// Native addons (C/C++ via N-API) allocate outside V8 heap
// They MUST manually free memory

// Detection: RSS grows but heapUsed stays stable
// RSS = Resident Set Size = total process memory
// heapUsed = only V8 JS heap

// If RSS - heapTotal is growing → native/external leak

function detectNativeLeak() {
  const mem = process.memoryUsage();
  const nativeMemory = mem.rss - mem.heapTotal - mem.external;
  return {
    nativeEstimate: (nativeMemory / 1024 / 1024).toFixed(2) + ' MB',
    rss: (mem.rss / 1024 / 1024).toFixed(2) + ' MB',
    heapTotal: (mem.heapTotal / 1024 / 1024).toFixed(2) + ' MB',
    external: (mem.external / 1024 / 1024).toFixed(2) + ' MB',
  };
}
```

---

## 7. Production Memory Leak Detection

### Automated Leak Detection System

```javascript
class LeakDetector {
  constructor(options = {}) {
    this.sampleIntervalMs = options.sampleInterval || 60000; // 1 min
    this.windowSize = options.windowSize || 30; // 30 samples
    this.growthThreshold = options.growthThreshold || 0.1; // 10% growth
    this.samples = [];
    this.alerts = [];
  }

  start() {
    this.timer = setInterval(() => {
      const mem = process.memoryUsage();
      this.samples.push({
        timestamp: Date.now(),
        heapUsed: mem.heapUsed,
        rss: mem.rss,
        external: mem.external,
      });

      if (this.samples.length > this.windowSize) {
        this.samples.shift();
      }

      if (this.samples.length >= this.windowSize) {
        this._analyze();
      }
    }, this.sampleIntervalMs);
  }

  _analyze() {
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];

    const heapGrowth = (last.heapUsed - first.heapUsed) / first.heapUsed;
    const rssGrowth = (last.rss - first.rss) / first.rss;

    if (heapGrowth > this.growthThreshold) {
      this._alert('heap', heapGrowth, first.heapUsed, last.heapUsed);
    }

    if (rssGrowth > this.growthThreshold) {
      this._alert('rss', rssGrowth, first.rss, last.rss);
    }
  }

  _alert(type, growth, from, to) {
    const alert = {
      type,
      growth: (growth * 100).toFixed(1) + '%',
      from: (from / 1024 / 1024).toFixed(2) + ' MB',
      to: (to / 1024 / 1024).toFixed(2) + ' MB',
      timestamp: Date.now(),
      windowMinutes: (this.sampleIntervalMs * this.windowSize) / 60000,
    };

    console.error(`[MEMORY LEAK ALERT] ${type} grew ${alert.growth} over ${alert.windowMinutes} minutes`);
    this.alerts.push(alert);

    // Auto-take heap snapshot on first alert
    if (this.alerts.length === 1) {
      const v8 = require('v8');
      v8.writeHeapSnapshot();
    }
  }

  stop() {
    clearInterval(this.timer);
  }
}
```

### Memory Pressure Handler

```javascript
// Graceful degradation under memory pressure
const MAX_HEAP = 0.85; // 85% of max

function checkMemoryPressure() {
  const mem = process.memoryUsage();
  const heapLimit = v8.getHeapStatistics().heap_size_limit;
  const usage = mem.heapUsed / heapLimit;

  if (usage > MAX_HEAP) {
    console.error(`[CRITICAL] Heap usage at ${(usage * 100).toFixed(1)}%`);

    // Emergency measures:
    // 1. Clear non-essential caches
    globalCache.clear();

    // 2. Force GC if available
    if (global.gc) global.gc();

    // 3. Reject new requests temporarily
    isAcceptingRequests = false;

    // 4. Take diagnostic snapshot
    v8.writeHeapSnapshot();

    // 5. Re-enable after GC
    setTimeout(() => {
      isAcceptingRequests = true;
    }, 5000);
  }
}

setInterval(checkMemoryPressure, 10000);
```

---

## 8. Diagnostic Workflow for Wiz

### Memory Leak Investigation Checklist

```
STEP 1: Confirm the Leak
  [ ] Monitor RSS and heapUsed over 30+ minutes
  [ ] Verify steady growth (not just GC sawtooth)
  [ ] Note growth rate (MB/hour)

STEP 2: Classify the Leak
  [ ] heapUsed growing? → JS heap leak
  [ ] external growing? → Buffer/native leak
  [ ] RSS growing but heap stable? → Native addon or OS-level leak

STEP 3: Isolate the Trigger
  [ ] Does leak happen at idle? → Background task or timer leak
  [ ] Only under load? → Request-correlated leak
  [ ] After specific action? → Feature-specific leak

STEP 4: Capture Evidence
  [ ] Take three snapshots using the three-snapshot method
  [ ] Compare snapshots in Chrome DevTools
  [ ] Identify growing object types

STEP 5: Find the Retention Path
  [ ] In snapshot comparison, click on growing constructor
  [ ] Examine "Retainers" panel
  [ ] Follow the reference chain from GC root to leaked object
  [ ] Identify the unintended reference

STEP 6: Fix and Verify
  [ ] Apply fix
  [ ] Re-run the same load test
  [ ] Verify heapUsed is stable over 30+ minutes
  [ ] Confirm no new leaks introduced
```

### Common Culprits in Next.js/Stone AI

```
1. Prisma Client: Don't create new PrismaClient per request
   → Use singleton pattern (already in Stone AI's lib/prisma.ts)

2. Event Emitters in API routes: Server-side listeners accumulating
   → Clean up on response finish

3. In-memory session stores: Growing without TTL
   → Use Redis or database-backed sessions

4. Agent conversation history: Unlimited array growth
   → Cap at N messages, summarize older ones

5. Middleware caches: Rate limiter maps without expiry
   → Use TTL-based cache (e.g., node-cache with stdTTL)

6. WebSocket connections: Listeners not cleaned on disconnect
   → Always clean up in 'close' handler

7. Clerk webhook handlers: Accumulating event handlers
   → Use once() or clean up after processing
```

---

## Stone AI Application Notes

- **Singleton Prisma client**: Essential — multiple instances = connection pool leak
- **Agent message arrays**: Cap conversation history per session, offload to DB
- **Rate limiter memory**: Use Redis-backed rate limiting in production
- **File upload buffers**: Stream to storage, never hold full file in memory
- **vLLM proxy responses**: Stream response bodies, don't buffer entire AI responses
- **Monitoring endpoint**: Add `/api/health/memory` for Wiz to check remotely
- **Vercel functions**: Short-lived, but watch for cold start memory initialization patterns

---

*Computer Wiz — The Diagnostician. Memory leaks don't hide from systematic investigation.*
