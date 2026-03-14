# Rust Async & Concurrency

> Palace Knowledge Seed — Software Engineering Breadth
> For: All 44 agents + Three Heads | Format: RAG-optimized chunks

---

## 1. Async/Await Fundamentals

Rust async is zero-cost: futures compile to state machines with no heap allocation unless explicitly boxed.

```rust
use tokio;

// async fn returns impl Future<Output = T>
async fn fetch_data(url: &str) -> Result<String, reqwest::Error> {
    let response = reqwest::get(url).await?;
    let body = response.text().await?;
    Ok(body)
}

#[tokio::main]
async fn main() {
    match fetch_data("https://httpbin.org/get").await {
        Ok(body) => println!("Got {} bytes", body.len()),
        Err(e) => eprintln!("Error: {}", e),
    }
}
```

### Key Concepts

- **Futures are lazy**: They do nothing until `.await`ed or spawned.
- **`.await` yields**: The current task yields to the executor, which can run other tasks.
- **No hidden threads**: `async fn` runs on the thread pool managed by the runtime.

```rust
// This does NOTHING — future is created but never polled
async fn do_work() -> i32 { 42 }

fn main() {
    let _future = do_work(); // Future created, never awaited — WASTED
}
```

---

## 2. Tokio Runtime

Tokio is the most widely used async runtime. It provides a multi-threaded work-stealing scheduler.

```toml
# Cargo.toml
[dependencies]
tokio = { version = "1", features = ["full"] }
```

### Runtime Configuration

```rust
// Option 1: Macro — simple, multi-threaded
#[tokio::main]
async fn main() {
    // Uses multi-threaded runtime by default
}

// Option 2: Macro — single-threaded (for testing or simple apps)
#[tokio::main(flavor = "current_thread")]
async fn main() {
    // Single-threaded runtime
}

// Option 3: Manual runtime construction
fn main() {
    let rt = tokio::runtime::Builder::new_multi_thread()
        .worker_threads(4)
        .enable_all()
        .build()
        .unwrap();

    rt.block_on(async {
        println!("Running on custom runtime");
    });
}
```

---

## 3. Spawning Tasks

`tokio::spawn` creates a new concurrent task — similar to a green thread.

```rust
use tokio::task;

#[tokio::main]
async fn main() {
    // Spawn a task — runs concurrently
    let handle = task::spawn(async {
        // This runs on the tokio thread pool
        expensive_computation().await
    });

    // Do other work while task runs
    other_work().await;

    // Await the task's result
    let result = handle.await.unwrap(); // JoinError if task panics
    println!("Result: {}", result);
}

// Spawn many tasks concurrently
async fn process_batch(items: Vec<String>) -> Vec<String> {
    let mut handles = Vec::new();

    for item in items {
        let handle = task::spawn(async move {
            // `move` transfers ownership of `item` into the task
            process_item(item).await
        });
        handles.push(handle);
    }

    let mut results = Vec::new();
    for handle in handles {
        results.push(handle.await.unwrap());
    }
    results
}
```

### `spawn_blocking` — For CPU-Bound Work

```rust
use tokio::task;

async fn handle_request(data: Vec<u8>) -> Vec<u8> {
    // DON'T block the async runtime with CPU work
    // Move CPU-heavy work to a blocking thread
    let result = task::spawn_blocking(move || {
        // This runs on a separate thread pool for blocking operations
        compress(&data)
    }).await.unwrap();

    result
}
```

---

## 4. Send and Sync Traits

### `Send` — Can be transferred between threads

```rust
// Most types are Send. Notable exceptions:
// - Rc<T> (use Arc<T> instead)
// - raw pointers
// - types containing non-Send fields

// Futures must be Send to be spawned on multi-threaded runtime
// This FAILS:
use std::rc::Rc;
async fn not_send() {
    let rc = Rc::new(42);
    some_async_fn().await; // rc lives across .await — future is NOT Send
    println!("{}", rc);
}

// FIX: Use Arc instead of Rc
use std::sync::Arc;
async fn is_send() {
    let arc = Arc::new(42);
    some_async_fn().await;
    println!("{}", arc);
}

// FIX 2: Drop before .await
async fn also_send() {
    {
        let rc = Rc::new(42);
        println!("{}", rc);
    } // rc dropped here
    some_async_fn().await; // OK — rc doesn't cross .await
}
```

### `Sync` — Can be accessed from multiple threads simultaneously

```rust
// T is Sync if &T is Send
// RefCell is NOT Sync (use Mutex instead)
// Cell is NOT Sync (use AtomicU64 etc. instead)

use std::sync::Mutex;
use std::sync::Arc;

// Shared state across async tasks
struct SharedState {
    counter: Mutex<u64>,         // Sync — safe to share
    data: tokio::sync::RwLock<Vec<String>>, // Async-aware lock
}

async fn increment(state: Arc<SharedState>) {
    // For short critical sections, std::sync::Mutex is fine
    let mut counter = state.counter.lock().unwrap();
    *counter += 1;

    // For locks held across .await, use tokio::sync::Mutex
    let mut data = state.data.write().await;
    data.push(format!("entry-{}", counter));
}
```

---

## 5. Channels

### `mpsc` — Multiple Producer, Single Consumer

```rust
use tokio::sync::mpsc;

#[tokio::main]
async fn main() {
    // Bounded channel — backpressure when full
    let (tx, mut rx) = mpsc::channel::<String>(100);

    // Spawn producers
    for i in 0..5 {
        let tx = tx.clone();
        tokio::spawn(async move {
            for j in 0..10 {
                tx.send(format!("producer-{}: msg-{}", i, j)).await.unwrap();
            }
        });
    }

    // Drop the original sender so the channel closes when all clones are dropped
    drop(tx);

    // Consumer
    while let Some(msg) = rx.recv().await {
        println!("Received: {}", msg);
    }
    println!("All producers finished");
}
```

### `oneshot` — Single Value, Once

```rust
use tokio::sync::oneshot;

async fn compute_result(tx: oneshot::Sender<u64>) {
    let result = expensive_computation().await;
    tx.send(result).unwrap(); // Send exactly once
}

async fn main() {
    let (tx, rx) = oneshot::channel();
    tokio::spawn(compute_result(tx));

    // Wait for the result
    let result = rx.await.unwrap();
    println!("Got: {}", result);
}
```

### `broadcast` — Multiple Consumers

```rust
use tokio::sync::broadcast;

#[tokio::main]
async fn main() {
    let (tx, _) = broadcast::channel::<String>(100);

    // Each subscriber gets its own receiver
    let mut rx1 = tx.subscribe();
    let mut rx2 = tx.subscribe();

    tokio::spawn(async move {
        while let Ok(msg) = rx1.recv().await {
            println!("Subscriber 1: {}", msg);
        }
    });

    tokio::spawn(async move {
        while let Ok(msg) = rx2.recv().await {
            println!("Subscriber 2: {}", msg);
        }
    });

    // Both subscribers receive every message
    tx.send("hello".to_string()).unwrap();
    tx.send("world".to_string()).unwrap();

    tokio::time::sleep(std::time::Duration::from_millis(100)).await;
}
```

### `watch` — Latest Value Only

```rust
use tokio::sync::watch;

#[tokio::main]
async fn main() {
    let (tx, mut rx) = watch::channel("initial".to_string());

    tokio::spawn(async move {
        // Only gets the LATEST value, not every value
        while rx.changed().await.is_ok() {
            let val = rx.borrow().clone();
            println!("Config updated: {}", val);
        }
    });

    tx.send("updated-1".to_string()).unwrap();
    tx.send("updated-2".to_string()).unwrap();
    // Receiver might only see "updated-2" — skips intermediate values
}
```

---

## 6. `select!` — Racing Futures

`select!` waits for the first future to complete.

```rust
use tokio::sync::mpsc;
use tokio::time::{sleep, Duration};

async fn process_with_timeout(mut rx: mpsc::Receiver<String>) {
    loop {
        tokio::select! {
            // Branch 1: Receive a message
            Some(msg) = rx.recv() => {
                println!("Processing: {}", msg);
            }

            // Branch 2: Timeout after 5 seconds of inactivity
            _ = sleep(Duration::from_secs(5)) => {
                println!("Idle timeout — shutting down");
                break;
            }
        }
    }
}

// select! with biased — check branches in order (no random selection)
async fn priority_processing(
    mut high: mpsc::Receiver<String>,
    mut low: mpsc::Receiver<String>,
) {
    loop {
        tokio::select! {
            biased; // Always check high priority first

            Some(msg) = high.recv() => {
                println!("HIGH: {}", msg);
            }
            Some(msg) = low.recv() => {
                println!("LOW: {}", msg);
            }
            else => break,
        }
    }
}
```

---

## 7. Graceful Shutdown

```rust
use tokio::signal;
use tokio::sync::{broadcast, mpsc};

#[tokio::main]
async fn main() {
    // Shutdown signal channel
    let (shutdown_tx, _) = broadcast::channel::<()>(1);

    // Spawn worker tasks
    let mut handles = Vec::new();
    for id in 0..4 {
        let mut shutdown_rx = shutdown_tx.subscribe();
        let handle = tokio::spawn(async move {
            loop {
                tokio::select! {
                    // Normal work
                    _ = do_work(id) => {}

                    // Shutdown signal received
                    _ = shutdown_rx.recv() => {
                        println!("Worker {} shutting down gracefully", id);
                        cleanup(id).await;
                        break;
                    }
                }
            }
        });
        handles.push(handle);
    }

    // Wait for Ctrl+C
    signal::ctrl_c().await.expect("Failed to listen for ctrl+c");
    println!("Shutdown signal received");

    // Notify all workers
    let _ = shutdown_tx.send(());

    // Wait for all workers to finish with a timeout
    let shutdown_timeout = tokio::time::Duration::from_secs(10);
    match tokio::time::timeout(shutdown_timeout, async {
        for handle in handles {
            let _ = handle.await;
        }
    }).await {
        Ok(()) => println!("Clean shutdown complete"),
        Err(_) => println!("Shutdown timed out — forcing exit"),
    }
}

async fn do_work(id: usize) {
    tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
}

async fn cleanup(id: usize) {
    println!("Worker {} cleanup done", id);
}
```

---

## 8. Actor Pattern

Encapsulate state behind a task that processes messages sequentially.

```rust
use tokio::sync::{mpsc, oneshot};

// Messages the actor can receive
enum CacheMessage {
    Get {
        key: String,
        respond_to: oneshot::Sender<Option<String>>,
    },
    Set {
        key: String,
        value: String,
    },
    Delete {
        key: String,
    },
}

// Actor state
struct CacheActor {
    data: std::collections::HashMap<String, String>,
    receiver: mpsc::Receiver<CacheMessage>,
}

impl CacheActor {
    fn new(receiver: mpsc::Receiver<CacheMessage>) -> Self {
        CacheActor {
            data: std::collections::HashMap::new(),
            receiver,
        }
    }

    async fn run(mut self) {
        while let Some(msg) = self.receiver.recv().await {
            match msg {
                CacheMessage::Get { key, respond_to } => {
                    let value = self.data.get(&key).cloned();
                    let _ = respond_to.send(value);
                }
                CacheMessage::Set { key, value } => {
                    self.data.insert(key, value);
                }
                CacheMessage::Delete { key } => {
                    self.data.remove(&key);
                }
            }
        }
    }
}

// Handle — cloneable, Send, used by callers
#[derive(Clone)]
struct CacheHandle {
    sender: mpsc::Sender<CacheMessage>,
}

impl CacheHandle {
    fn new() -> Self {
        let (sender, receiver) = mpsc::channel(256);
        let actor = CacheActor::new(receiver);
        tokio::spawn(actor.run());
        CacheHandle { sender }
    }

    async fn get(&self, key: String) -> Option<String> {
        let (tx, rx) = oneshot::channel();
        self.sender.send(CacheMessage::Get {
            key,
            respond_to: tx,
        }).await.unwrap();
        rx.await.unwrap()
    }

    async fn set(&self, key: String, value: String) {
        self.sender.send(CacheMessage::Set { key, value }).await.unwrap();
    }
}

#[tokio::main]
async fn main() {
    let cache = CacheHandle::new();

    cache.set("user:1".into(), "Alice".into()).await;
    let user = cache.get("user:1".into()).await;
    println!("User: {:?}", user); // Some("Alice")
}
```

---

## 9. Concurrency Patterns

### Semaphore — Limit Concurrency

```rust
use std::sync::Arc;
use tokio::sync::Semaphore;

async fn process_with_limit(urls: Vec<String>, max_concurrent: usize) {
    let semaphore = Arc::new(Semaphore::new(max_concurrent));
    let mut handles = Vec::new();

    for url in urls {
        let sem = semaphore.clone();
        let handle = tokio::spawn(async move {
            let _permit = sem.acquire().await.unwrap(); // Wait for permit
            let result = fetch(&url).await;
            // _permit dropped here — releases the slot
            result
        });
        handles.push(handle);
    }

    for handle in handles {
        let _ = handle.await;
    }
}
```

### Rate Limiting with Token Bucket

```rust
use tokio::time::{interval, Duration};
use tokio::sync::mpsc;

async fn rate_limited_processor(
    mut rx: mpsc::Receiver<String>,
    requests_per_second: u64,
) {
    let mut ticker = interval(Duration::from_millis(1000 / requests_per_second));

    while let Some(item) = rx.recv().await {
        ticker.tick().await; // Wait for next tick
        tokio::spawn(async move {
            process(item).await;
        });
    }
}
```

### JoinSet — Structured Task Spawning (Tokio 1.20+)

```rust
use tokio::task::JoinSet;

async fn process_all(items: Vec<String>) -> Vec<String> {
    let mut set = JoinSet::new();

    for item in items {
        set.spawn(async move {
            process_item(item).await
        });
    }

    let mut results = Vec::new();
    while let Some(res) = set.join_next().await {
        match res {
            Ok(value) => results.push(value),
            Err(e) => eprintln!("Task panicked: {}", e),
        }
    }
    results
}
```

---

## 10. Common Async Anti-Patterns

### Holding std::sync::Mutex Across .await

```rust
// BAD — can cause deadlocks
async fn bad(data: Arc<std::sync::Mutex<Vec<String>>>) {
    let mut guard = data.lock().unwrap();
    some_async_fn().await; // Lock held across .await!
    guard.push("value".into());
}

// GOOD — use tokio::sync::Mutex for async-aware locking
async fn good(data: Arc<tokio::sync::Mutex<Vec<String>>>) {
    let mut guard = data.lock().await;
    some_async_fn().await;
    guard.push("value".into());
}

// BETTER — minimize lock scope
async fn better(data: Arc<std::sync::Mutex<Vec<String>>>) {
    let value = some_async_fn().await;
    data.lock().unwrap().push(value); // Lock held briefly, no .await
}
```

### Anti-Patterns Summary

| Anti-Pattern | Fix |
|---|---|
| `Rc` across `.await` | Use `Arc` |
| `std::sync::Mutex` across `.await` | Use `tokio::sync::Mutex` or minimize scope |
| Blocking in async (CPU work, `std::fs`) | Use `spawn_blocking` |
| Spawning without join | Use `JoinSet` or collect handles |
| Unbounded channels | Use bounded channels for backpressure |
| `select!` without cancel safety | Understand cancellation semantics |
| `async fn` for sync work | Only use async for I/O-bound operations |
| Not handling `JoinError` | Tasks can panic — handle `Err` variant |
| Polling in a loop (busy-wait) | Use `.await`, channels, or `Notify` |
| Giant async functions | Break into smaller futures for readability |
