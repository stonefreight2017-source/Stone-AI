# Java Concurrency & JVM Tuning

> Palace Knowledge Seed — Software Engineering Breadth
> For: All 44 agents + Three Heads | Format: RAG-optimized chunks

---

## 1. Virtual Threads (Project Loom — Java 21+)

Virtual threads are lightweight, JVM-managed threads. Create millions without OS thread overhead.

```java
// Traditional platform threads — expensive (~1MB stack each)
Thread platformThread = new Thread(() -> {
    System.out.println("Platform thread: " + Thread.currentThread());
});
platformThread.start();

// Virtual threads — cheap (~1KB, multiplexed onto platform threads)
Thread virtualThread = Thread.ofVirtual().start(() -> {
    System.out.println("Virtual thread: " + Thread.currentThread());
});

// Create millions of virtual threads — no problem
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    for (int i = 0; i < 1_000_000; i++) {
        final int id = i;
        executor.submit(() -> {
            // Each task gets its own virtual thread
            Thread.sleep(Duration.ofSeconds(1)); // Doesn't block OS thread!
            return fetchData(id);
        });
    }
} // Waits for all tasks to complete

// Spring Boot 3.2+: enable virtual threads
// application.properties:
// spring.threads.virtual.enabled=true
// All request handling threads become virtual automatically
```

### When to Use Virtual Threads vs Platform Threads

```java
// Virtual threads are IDEAL for I/O-bound work:
// - HTTP requests, database queries, file I/O
// - Each virtual thread blocks on I/O without blocking the OS thread

// Virtual threads are NOT for CPU-bound work:
// - They still run on platform threads underneath
// - CPU-bound tasks won't benefit — use ForkJoinPool instead

// CAUTION: Avoid synchronized blocks with virtual threads
// synchronized pins the virtual thread to its carrier (platform) thread

// BAD — pins virtual thread
synchronized (lock) {
    connection.query("SELECT ...");  // Blocks carrier thread
}

// GOOD — use ReentrantLock instead
private final ReentrantLock lock = new ReentrantLock();

lock.lock();
try {
    connection.query("SELECT ...");
} finally {
    lock.unlock();
}
```

---

## 2. CompletableFuture — Async Composition

```java
import java.util.concurrent.CompletableFuture;

public class AsyncService {

    private final HttpClient httpClient;
    private final UserRepository userRepository;

    // Chain async operations
    public CompletableFuture<UserProfile> getFullProfile(long userId) {
        return CompletableFuture.supplyAsync(() -> userRepository.findById(userId))
            .thenCompose(user -> {
                // Run two async operations in parallel
                CompletableFuture<List<Order>> orders = fetchOrders(user.getId());
                CompletableFuture<CreditScore> credit = fetchCreditScore(user.getSsn());

                return orders.thenCombine(credit, (o, c) ->
                    new UserProfile(user, o, c)
                );
            })
            .exceptionally(ex -> {
                log.error("Failed to build profile", ex);
                return UserProfile.empty();
            });
    }

    // Timeout handling
    public CompletableFuture<String> fetchWithTimeout(String url) {
        return CompletableFuture.supplyAsync(() -> httpGet(url))
            .orTimeout(5, TimeUnit.SECONDS)
            .exceptionally(ex -> {
                if (ex.getCause() instanceof TimeoutException) {
                    return "timeout_default";
                }
                throw new CompletionException(ex);
            });
    }

    // Wait for first successful result
    public CompletableFuture<String> fetchFromAnyMirror(List<String> mirrors) {
        CompletableFuture<String>[] futures = mirrors.stream()
            .map(url -> CompletableFuture.supplyAsync(() -> httpGet(url)))
            .toArray(CompletableFuture[]::new);

        return CompletableFuture.anyOf(futures)
            .thenApply(obj -> (String) obj);
    }

    // Collect all results
    public CompletableFuture<List<String>> fetchAll(List<String> urls) {
        List<CompletableFuture<String>> futures = urls.stream()
            .map(url -> CompletableFuture.supplyAsync(() -> httpGet(url)))
            .toList();

        return CompletableFuture.allOf(futures.toArray(new CompletableFuture[0]))
            .thenApply(v -> futures.stream()
                .map(CompletableFuture::join)
                .toList());
    }
}
```

---

## 3. Structured Concurrency (Java 21+ Preview)

Treats a group of concurrent tasks as a single unit of work.

```java
import java.util.concurrent.StructuredTaskScope;

public class OrderService {

    // All subtasks are bound to the scope's lifecycle
    public OrderSummary processOrder(long orderId) throws Exception {
        try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {

            // Fork subtasks — each runs in its own virtual thread
            Subtask<Order> orderTask = scope.fork(() -> fetchOrder(orderId));
            Subtask<Inventory> inventoryTask = scope.fork(() -> checkInventory(orderId));
            Subtask<Payment> paymentTask = scope.fork(() -> processPayment(orderId));

            // Wait for ALL subtasks to complete (or first failure)
            scope.join();

            // Throw if any subtask failed — cancels all others
            scope.throwIfFailed();

            // All succeeded — get results
            return new OrderSummary(
                orderTask.get(),
                inventoryTask.get(),
                paymentTask.get()
            );
        }
        // If any task fails, all others are cancelled automatically
        // No leaked threads, no dangling work
    }

    // ShutdownOnSuccess — return first successful result
    public String fetchFromFastest(List<String> urls) throws Exception {
        try (var scope = new StructuredTaskScope.ShutdownOnSuccess<String>()) {
            for (String url : urls) {
                scope.fork(() -> httpGet(url));
            }
            scope.join();
            return scope.result(); // First successful result
        }
    }
}
```

---

## 4. Garbage Collection Tuning

### G1GC (Default since Java 9)

```bash
# G1GC — good general-purpose collector
# Targets: pause time < 200ms, balanced throughput
java -XX:+UseG1GC \
     -XX:MaxGCPauseMillis=100 \          # Target max pause
     -XX:G1HeapRegionSize=16m \          # Region size (1-32MB)
     -XX:InitiatingHeapOccupancyPercent=45 \  # Start marking at 45% heap
     -XX:G1ReservePercent=10 \           # Reserve 10% for to-space
     -Xms4g -Xmx4g \                    # Fixed heap size (avoid resizing)
     -jar app.jar
```

### ZGC (Java 17+ Production Ready)

```bash
# ZGC — ultra-low latency
# Targets: pause time < 1ms regardless of heap size
# Best for: latency-sensitive apps, large heaps (multi-TB)
java -XX:+UseZGC \
     -XX:+ZGenerational \        # Generational ZGC (Java 21+, much better)
     -Xms8g -Xmx8g \
     -jar app.jar

# ZGC does most work concurrently — no stop-the-world for marking/compacting
# Trade-off: slightly lower throughput than G1, higher CPU usage
```

### Shenandoah GC

```bash
# Shenandoah — low-latency, similar to ZGC
# Available in OpenJDK (not Oracle JDK)
java -XX:+UseShenandoahGC \
     -Xms4g -Xmx4g \
     -jar app.jar
```

### GC Selection Guide

| GC | Max Pause | Throughput | Heap Size | Use Case |
|---|---|---|---|---|
| G1 | ~100-200ms | High | 4-64GB | General purpose |
| ZGC | <1ms | Medium-High | 8GB-16TB | Latency critical |
| Shenandoah | <10ms | Medium | 4-128GB | Latency sensitive |
| Parallel | ~seconds | Highest | 4-64GB | Batch processing |
| Serial | ~seconds | Low | <1GB | Single-core, containers |

---

## 5. JFR Profiling (Java Flight Recorder)

Zero-overhead profiling built into the JVM.

```bash
# Start recording
java -XX:StartFlightRecording=duration=60s,filename=recording.jfr -jar app.jar

# Start recording on demand
jcmd <pid> JFR.start name=profile duration=60s filename=recording.jfr

# Continuous recording with max size
java -XX:StartFlightRecording=maxsize=200m,maxage=12h,name=continuous \
     -jar app.jar

# Dump continuous recording
jcmd <pid> JFR.dump name=continuous filename=dump.jfr
```

### Programmatic JFR

```java
import jdk.jfr.*;

@Name("com.myapp.OrderProcessed")
@Label("Order Processed")
@Category({"Application", "Orders"})
@Description("Fired when an order is processed")
public class OrderProcessedEvent extends Event {

    @Label("Order ID")
    public long orderId;

    @Label("Amount")
    public double amount;

    @Label("Processing Time (ms)")
    @Timespan(Timespan.MILLISECONDS)
    public long processingTime;

    @Label("Success")
    public boolean success;
}

// Emit events
public Order processOrder(OrderRequest request) {
    OrderProcessedEvent event = new OrderProcessedEvent();
    event.orderId = request.getId();
    event.amount = request.getAmount();
    event.begin(); // Start timing

    try {
        Order order = doProcess(request);
        event.success = true;
        return order;
    } catch (Exception e) {
        event.success = false;
        throw e;
    } finally {
        event.processingTime = Duration.between(event.startTime, Instant.now()).toMillis();
        event.commit(); // Record the event
    }
}

// Read JFR recordings programmatically
try (var rs = RecordingFile.readAllEvents(Path.of("recording.jfr"))) {
    for (RecordedEvent event : rs) {
        if (event.getEventType().getName().equals("jdk.GCPhasePause")) {
            System.out.println("GC Pause: " + event.getDuration().toMillis() + "ms");
        }
    }
}
```

---

## 6. Java Memory Model — Happens-Before

The JMM defines when one thread's writes are visible to another thread.

```java
// Problem: Without happens-before, reads can see stale values
// The compiler and CPU can reorder instructions

// BAD — no happens-before guarantee
class Broken {
    private boolean ready = false;
    private int value = 0;

    void writer() {
        value = 42;        // Might be reordered AFTER ready = true
        ready = true;
    }

    void reader() {
        if (ready) {
            System.out.println(value); // Might print 0!
        }
    }
}

// FIX 1: volatile — establishes happens-before
class Fixed1 {
    private volatile boolean ready = false;
    private int value = 0;

    void writer() {
        value = 42;        // Guaranteed visible before ready = true
        ready = true;      // volatile write — full memory fence
    }

    void reader() {
        if (ready) {       // volatile read — sees all writes before volatile write
            System.out.println(value); // Always prints 42
        }
    }
}

// FIX 2: synchronized — establishes happens-before
class Fixed2 {
    private boolean ready = false;
    private int value = 0;
    private final Object lock = new Object();

    void writer() {
        synchronized (lock) {
            value = 42;
            ready = true;
        }
    }

    void reader() {
        synchronized (lock) {
            if (ready) {
                System.out.println(value); // Always 42
            }
        }
    }
}

// Happens-before rules:
// 1. Program order: A before B in same thread → A happens-before B
// 2. Monitor lock: unlock() happens-before subsequent lock()
// 3. Volatile: write happens-before subsequent read
// 4. Thread start: start() happens-before any action in started thread
// 5. Thread join: all actions in thread happen-before join() returns
// 6. Transitivity: A hb B and B hb C → A hb C
```

---

## 7. Concurrent Collections

```java
// ConcurrentHashMap — thread-safe, lock-striped (not one global lock)
ConcurrentHashMap<String, AtomicLong> counters = new ConcurrentHashMap<>();

// Atomic compute operations
counters.computeIfAbsent("requests", k -> new AtomicLong(0)).incrementAndGet();

// Bulk operations (parallel, no locking needed)
long total = counters.reduceValuesToLong(
    4,                          // parallelism threshold
    AtomicLong::get,           // transform
    0L,                        // identity
    Long::sum                  // reducer
);

// ConcurrentLinkedQueue — lock-free FIFO
ConcurrentLinkedQueue<Task> taskQueue = new ConcurrentLinkedQueue<>();
taskQueue.offer(new Task("work")); // Non-blocking
Task task = taskQueue.poll();       // Non-blocking, null if empty

// CopyOnWriteArrayList — reads are lock-free, writes copy
// Best for: many readers, few writers (e.g., listener lists)
CopyOnWriteArrayList<EventListener> listeners = new CopyOnWriteArrayList<>();
listeners.add(listener);        // Copies entire array
for (var l : listeners) {       // No locking needed
    l.onEvent(event);
}

// BlockingQueue — producer-consumer pattern
BlockingQueue<Job> queue = new LinkedBlockingQueue<>(1000);

// Producer
queue.put(new Job(data)); // Blocks if full

// Consumer
Job job = queue.take();   // Blocks if empty

// ArrayBlockingQueue — bounded, fair ordering option
BlockingQueue<Job> fairQueue = new ArrayBlockingQueue<>(100, true);
```

---

## 8. JVM Tuning Flags Reference

```bash
# Memory sizing
-Xms4g          # Initial heap size
-Xmx4g          # Max heap size (set equal to Xms to avoid resizing)
-Xss512k        # Thread stack size (reduce for many threads)
-XX:MaxMetaspaceSize=256m  # Class metadata limit

# GC logging (Java 11+)
-Xlog:gc*:file=gc.log:time,uptime,level,tags:filecount=5,filesize=10m

# Container-aware (Java 10+, on by default in Java 11+)
-XX:+UseContainerSupport
-XX:MaxRAMPercentage=75.0   # Use 75% of container memory limit

# Performance flags
-XX:+AlwaysPreTouch          # Pre-touch heap pages on startup
-XX:+UseStringDeduplication  # G1 only — dedup identical strings
-XX:+UseCompressedOops       # Default for heaps < 32GB
-XX:+OptimizeStringConcat    # Optimize string concatenation

# Diagnostics
-XX:+HeapDumpOnOutOfMemoryError
-XX:HeapDumpPath=/var/log/heapdump.hprof
-XX:+ExitOnOutOfMemoryError  # Crash fast, let orchestrator restart

# Native memory tracking
-XX:NativeMemoryTracking=summary
# Then: jcmd <pid> VM.native_memory summary
```

### Container Best Practices

```bash
# Dockerfile for Java in containers
FROM eclipse-temurin:21-jre-alpine

# Let JVM detect container limits
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 \
               -XX:+UseG1GC \
               -XX:+ExitOnOutOfMemoryError \
               -XX:+HeapDumpOnOutOfMemoryError \
               -Xlog:gc*:stdout:time"

COPY app.jar /app.jar
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app.jar"]
```

---

## 9. Common Performance Patterns

```java
// 1. String concatenation in loops
// BAD — creates N intermediate String objects
String result = "";
for (String s : strings) {
    result += s; // O(n²) — copies entire string each time
}

// GOOD — StringBuilder
StringBuilder sb = new StringBuilder(estimatedSize);
for (String s : strings) {
    sb.append(s); // O(n) amortized
}
String result = sb.toString();

// BEST — String.join or Collectors.joining
String result = String.join(", ", strings);
String result = strings.stream().collect(Collectors.joining(", "));

// 2. Boxing/unboxing overhead
// BAD — boxes every int
List<Integer> boxed = new ArrayList<>();
for (int i = 0; i < 1_000_000; i++) {
    boxed.add(i); // Auto-boxing: int → Integer object
}
int sum = boxed.stream().mapToInt(Integer::intValue).sum();

// GOOD — primitive streams
int sum = IntStream.range(0, 1_000_000).sum(); // No boxing

// 3. HashMap initial capacity
// BAD — rehashes multiple times as it grows
Map<String, Object> map = new HashMap<>(); // Default capacity 16

// GOOD — pre-size to avoid rehashing
int expectedSize = 1000;
Map<String, Object> map = HashMap.newHashMap(expectedSize); // Java 19+
// Or: new HashMap<>(expectedSize * 4 / 3 + 1) for load factor 0.75

// 4. Record patterns for immutable data (Java 16+)
// Before:
public class Point {
    private final double x, y;
    // constructor, getters, equals, hashCode, toString...
}

// After:
public record Point(double x, double y) {} // All generated
```

---

## 10. Anti-Patterns Summary

| Anti-Pattern | Fix |
|---|---|
| `synchronized` with virtual threads | Use `ReentrantLock` |
| Unbounded thread pools | Use bounded pools or virtual threads |
| `Thread.sleep()` for coordination | Use `CountDownLatch`, `Phaser`, or `CompletableFuture` |
| Premature GC tuning | Profile first with JFR, then tune |
| `-Xmx` too large in containers | Use `MaxRAMPercentage` |
| `Double-Checked Locking` without volatile | Add `volatile` or use `Holder` pattern |
| Blocking in `CompletableFuture` chains | Use `thenCompose` / `thenCombine` |
| Ignoring thread-safety of collections | Use `ConcurrentHashMap`, not `Collections.synchronizedMap` |
| `Executors.newCachedThreadPool()` | Unbounded — use `newFixedThreadPool` or virtual threads |
| Not setting heap dump on OOM | Always add `-XX:+HeapDumpOnOutOfMemoryError` |
