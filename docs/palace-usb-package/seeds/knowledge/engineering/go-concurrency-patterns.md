# Go Concurrency Patterns

> Palace Knowledge Seed — Software Engineering Breadth
> For: All 44 agents + Three Heads | Format: RAG-optimized chunks

---

## 1. Goroutines

Goroutines are lightweight (2-8KB stack), multiplexed onto OS threads by the Go scheduler.

```go
package main

import (
    "fmt"
    "sync"
    "time"
)

func worker(id int) {
    fmt.Printf("Worker %d starting\n", id)
    time.Sleep(time.Second)
    fmt.Printf("Worker %d done\n", id)
}

func main() {
    // Launch goroutines
    for i := 0; i < 5; i++ {
        go worker(i) // Non-blocking — returns immediately
    }

    // BAD: using time.Sleep to wait for goroutines
    // time.Sleep(2 * time.Second)

    // GOOD: use WaitGroup (see below)
}
```

### Common Mistake: Loop Variable Capture

```go
// BAD — all goroutines may see the same value of i
for i := 0; i < 5; i++ {
    go func() {
        fmt.Println(i) // Captures variable, not value — may print 5 five times
    }()
}

// GOOD (Go 1.22+) — loop variables are per-iteration by default
// In Go 1.22+, the above code works correctly

// GOOD (Pre Go 1.22) — pass as parameter
for i := 0; i < 5; i++ {
    go func(id int) {
        fmt.Println(id) // Each goroutine gets its own copy
    }(i)
}
```

---

## 2. Channels — Unbuffered and Buffered

### Unbuffered Channels — Synchronous

```go
func main() {
    ch := make(chan string) // Unbuffered — sender blocks until receiver reads

    go func() {
        ch <- "hello" // Blocks until main goroutine receives
    }()

    msg := <-ch // Blocks until sender sends
    fmt.Println(msg)
}
```

### Buffered Channels — Async Up to Capacity

```go
func main() {
    ch := make(chan int, 3) // Buffer of 3 — can send 3 without blocking

    ch <- 1 // Doesn't block
    ch <- 2 // Doesn't block
    ch <- 3 // Doesn't block
    // ch <- 4 // WOULD BLOCK — buffer full

    fmt.Println(<-ch) // 1
    fmt.Println(<-ch) // 2
}
```

### Directional Channels

```go
// Send-only channel
func producer(ch chan<- int) {
    for i := 0; i < 10; i++ {
        ch <- i
    }
    close(ch) // Signal no more values
}

// Receive-only channel
func consumer(ch <-chan int) {
    for val := range ch { // Iterates until channel is closed
        fmt.Println(val)
    }
}

func main() {
    ch := make(chan int, 5)
    go producer(ch)
    consumer(ch)
}
```

### Anti-Pattern: Forgetting to Close Channels

```go
// BAD — consumer blocks forever
func bad() {
    ch := make(chan int)
    go func() {
        for i := 0; i < 5; i++ {
            ch <- i
        }
        // Never closes ch!
    }()
    for val := range ch { // Blocks forever after receiving 5 values
        fmt.Println(val)
    }
}

// GOOD — always close when done sending
func good() {
    ch := make(chan int)
    go func() {
        defer close(ch) // Close when goroutine exits
        for i := 0; i < 5; i++ {
            ch <- i
        }
    }()
    for val := range ch {
        fmt.Println(val)
    }
}
```

---

## 3. Select Statement

`select` waits on multiple channel operations. Like `switch` for channels.

```go
func main() {
    ch1 := make(chan string)
    ch2 := make(chan string)

    go func() {
        time.Sleep(1 * time.Second)
        ch1 <- "one"
    }()

    go func() {
        time.Sleep(2 * time.Second)
        ch2 <- "two"
    }()

    // Wait for whichever arrives first
    for i := 0; i < 2; i++ {
        select {
        case msg := <-ch1:
            fmt.Println("Received from ch1:", msg)
        case msg := <-ch2:
            fmt.Println("Received from ch2:", msg)
        }
    }
}
```

### Select with Timeout and Default

```go
func fetchWithTimeout(ch <-chan string, timeout time.Duration) (string, error) {
    select {
    case result := <-ch:
        return result, nil
    case <-time.After(timeout):
        return "", fmt.Errorf("timeout after %v", timeout)
    }
}

// Non-blocking channel operations
func tryReceive(ch <-chan int) (int, bool) {
    select {
    case val := <-ch:
        return val, true
    default:
        return 0, false // Don't block
    }
}

// Non-blocking send
func trySend(ch chan<- int, val int) bool {
    select {
    case ch <- val:
        return true
    default:
        return false // Channel full, don't block
    }
}
```

---

## 4. WaitGroups

Coordinate goroutine completion without channels.

```go
import "sync"

func processItems(items []string) {
    var wg sync.WaitGroup

    for _, item := range items {
        wg.Add(1)
        go func(item string) {
            defer wg.Done()
            // Process item
            fmt.Println("Processing:", item)
        }(item)
    }

    wg.Wait() // Block until all goroutines call Done()
    fmt.Println("All items processed")
}
```

### Anti-Pattern: Adding to WaitGroup Inside Goroutine

```go
// BAD — race condition: main might reach wg.Wait() before wg.Add(1) runs
for _, item := range items {
    go func(item string) {
        wg.Add(1) // TOO LATE — might run after Wait()
        defer wg.Done()
        process(item)
    }(item)
}
wg.Wait()

// GOOD — Add before spawning
for _, item := range items {
    wg.Add(1) // Before goroutine launch
    go func(item string) {
        defer wg.Done()
        process(item)
    }(item)
}
wg.Wait()
```

---

## 5. Context — Cancellation and Propagation

`context.Context` carries deadlines, cancellation signals, and request-scoped values.

```go
import "context"

func fetchData(ctx context.Context, url string) ([]byte, error) {
    req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
    if err != nil {
        return nil, err
    }

    resp, err := http.DefaultClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    return io.ReadAll(resp.Body)
}

func main() {
    // Cancel after 5 seconds
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel() // Always call cancel to release resources

    data, err := fetchData(ctx, "https://api.example.com/slow")
    if err != nil {
        if ctx.Err() == context.DeadlineExceeded {
            fmt.Println("Request timed out")
        }
        return
    }
    fmt.Println("Got data:", len(data), "bytes")
}
```

### Context Cancellation in Worker Goroutines

```go
func longRunningWorker(ctx context.Context, id int, results chan<- int) {
    for i := 0; ; i++ {
        select {
        case <-ctx.Done():
            fmt.Printf("Worker %d cancelled: %v\n", id, ctx.Err())
            return
        default:
            // Do work
            result := expensiveComputation(i)
            select {
            case results <- result:
            case <-ctx.Done():
                return
            }
        }
    }
}

func main() {
    ctx, cancel := context.WithCancel(context.Background())
    results := make(chan int, 100)

    for i := 0; i < 4; i++ {
        go longRunningWorker(ctx, i, results)
    }

    // Collect results for 10 seconds, then cancel all workers
    timer := time.After(10 * time.Second)
    for {
        select {
        case r := <-results:
            fmt.Println("Result:", r)
        case <-timer:
            cancel() // Cancel all workers
            return
        }
    }
}
```

### Context Values — Request-Scoped Data

```go
type contextKey string

const (
    requestIDKey contextKey = "requestID"
    userIDKey    contextKey = "userID"
)

func withRequestID(ctx context.Context, id string) context.Context {
    return context.WithValue(ctx, requestIDKey, id)
}

func getRequestID(ctx context.Context) string {
    if id, ok := ctx.Value(requestIDKey).(string); ok {
        return id
    }
    return "unknown"
}

// Usage in middleware
func loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        id := uuid.New().String()
        ctx := withRequestID(r.Context(), id)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

---

## 6. Pipeline Pattern

Chain stages connected by channels. Each stage is a goroutine.

```go
// Stage 1: Generate numbers
func generate(ctx context.Context, nums ...int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for _, n := range nums {
            select {
            case out <- n:
            case <-ctx.Done():
                return
            }
        }
    }()
    return out
}

// Stage 2: Square each number
func square(ctx context.Context, in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for n := range in {
            select {
            case out <- n * n:
            case <-ctx.Done():
                return
            }
        }
    }()
    return out
}

// Stage 3: Filter (keep even)
func filterEven(ctx context.Context, in <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for n := range in {
            if n%2 == 0 {
                select {
                case out <- n:
                case <-ctx.Done():
                    return
                }
            }
        }
    }()
    return out
}

func main() {
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    // Pipeline: generate → square → filterEven
    pipeline := filterEven(ctx, square(ctx, generate(ctx, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10)))

    for val := range pipeline {
        fmt.Println(val) // 4, 16, 36, 64, 100
    }
}
```

---

## 7. Fan-Out / Fan-In

Fan-out: multiple goroutines reading from the same channel.
Fan-in: multiple channels merged into one.

```go
// Fan-out: distribute work across N workers
func fanOut(ctx context.Context, input <-chan int, workers int) []<-chan int {
    channels := make([]<-chan int, workers)
    for i := 0; i < workers; i++ {
        channels[i] = worker(ctx, input)
    }
    return channels
}

func worker(ctx context.Context, input <-chan int) <-chan int {
    out := make(chan int)
    go func() {
        defer close(out)
        for val := range input {
            result := heavyProcess(val)
            select {
            case out <- result:
            case <-ctx.Done():
                return
            }
        }
    }()
    return out
}

// Fan-in: merge multiple channels into one
func fanIn(ctx context.Context, channels ...<-chan int) <-chan int {
    var wg sync.WaitGroup
    merged := make(chan int)

    output := func(ch <-chan int) {
        defer wg.Done()
        for val := range ch {
            select {
            case merged <- val:
            case <-ctx.Done():
                return
            }
        }
    }

    wg.Add(len(channels))
    for _, ch := range channels {
        go output(ch)
    }

    go func() {
        wg.Wait()
        close(merged)
    }()

    return merged
}

func main() {
    ctx, cancel := context.WithCancel(context.Background())
    defer cancel()

    input := generate(ctx, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
    workers := fanOut(ctx, input, 4)
    results := fanIn(ctx, workers...)

    for result := range results {
        fmt.Println(result)
    }
}
```

---

## 8. Worker Pool

Fixed number of workers processing jobs from a shared queue.

```go
type Job struct {
    ID   int
    Data string
}

type Result struct {
    JobID  int
    Output string
    Err    error
}

func workerPool(ctx context.Context, numWorkers int, jobs <-chan Job) <-chan Result {
    results := make(chan Result, numWorkers)
    var wg sync.WaitGroup

    for i := 0; i < numWorkers; i++ {
        wg.Add(1)
        go func(workerID int) {
            defer wg.Done()
            for job := range jobs {
                select {
                case <-ctx.Done():
                    return
                default:
                    output, err := processJob(job)
                    results <- Result{
                        JobID:  job.ID,
                        Output: output,
                        Err:    err,
                    }
                }
            }
        }(i)
    }

    go func() {
        wg.Wait()
        close(results)
    }()

    return results
}

func processJob(job Job) (string, error) {
    // Simulate work
    time.Sleep(100 * time.Millisecond)
    return fmt.Sprintf("processed-%s", job.Data), nil
}

func main() {
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    jobs := make(chan Job, 100)
    go func() {
        defer close(jobs)
        for i := 0; i < 50; i++ {
            jobs <- Job{ID: i, Data: fmt.Sprintf("item-%d", i)}
        }
    }()

    results := workerPool(ctx, 8, jobs)
    for result := range results {
        if result.Err != nil {
            fmt.Printf("Job %d failed: %v\n", result.JobID, result.Err)
        } else {
            fmt.Printf("Job %d: %s\n", result.JobID, result.Output)
        }
    }
}
```

---

## 9. Rate Limiting

```go
import "golang.org/x/time/rate"

// Token bucket rate limiter
func rateLimitedProcessor(ctx context.Context, items <-chan string) {
    // 10 events per second, burst of 5
    limiter := rate.NewLimiter(rate.Limit(10), 5)

    for item := range items {
        // Wait blocks until a token is available
        if err := limiter.Wait(ctx); err != nil {
            fmt.Println("Rate limiter cancelled:", err)
            return
        }
        go processItem(item)
    }
}

// Manual rate limiting with time.Ticker
func tickerRateLimiter(items <-chan string, rps int) {
    ticker := time.NewTicker(time.Second / time.Duration(rps))
    defer ticker.Stop()

    for item := range items {
        <-ticker.C // Wait for next tick
        go processItem(item)
    }
}

// Bursty rate limiter
func burstyLimiter() {
    // Allow bursts of 3
    bursty := make(chan time.Time, 3)

    // Pre-fill burst capacity
    for i := 0; i < cap(bursty); i++ {
        bursty <- time.Now()
    }

    // Refill at steady rate
    go func() {
        for t := range time.Tick(200 * time.Millisecond) {
            bursty <- t
        }
    }()

    // Use: <-bursty before each operation
    for i := 0; i < 10; i++ {
        <-bursty
        fmt.Println("Request", i, time.Now())
    }
}
```

---

## 10. Anti-Patterns Summary

| Anti-Pattern | Fix |
|---|---|
| Goroutine leak (no exit path) | Always use `ctx.Done()` or close channels |
| Sending on closed channel (panic) | Only sender closes; use `sync.Once` |
| Shared memory without sync | Use channels or `sync.Mutex` |
| `time.Sleep` for synchronization | Use `WaitGroup`, channels, or `context` |
| Unbounded goroutine spawning | Use worker pools with fixed concurrency |
| Ignoring channel direction | Use `chan<-` and `<-chan` in function signatures |
| Context values for control flow | Use context only for request-scoped data |
| `sync.Mutex` across network calls | Use channels for long-lived operations |
| Forgetting `defer cancel()` | ALWAYS defer cancel on context creation |
| Not checking `ctx.Err()` in loops | Check in every long-running loop iteration |
