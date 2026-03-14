# Cross-Language Design Patterns

> Palace Knowledge Seed — Software Engineering Breadth
> For: All 44 agents + Three Heads | Format: RAG-optimized chunks

---

## 1. Strategy Pattern

Defines a family of algorithms, encapsulates each, and makes them interchangeable.

### Python — First-Class Functions Replace Classes

```python
from typing import Callable

# Python doesn't need a Strategy interface — functions ARE strategies
def sort_by_price(products: list[dict]) -> list[dict]:
    return sorted(products, key=lambda p: p["price"])

def sort_by_rating(products: list[dict]) -> list[dict]:
    return sorted(products, key=lambda p: -p["rating"])

def sort_by_name(products: list[dict]) -> list[dict]:
    return sorted(products, key=lambda p: p["name"])

# Strategy is just a function parameter
def display_products(
    products: list[dict],
    strategy: Callable[[list[dict]], list[dict]] = sort_by_price,
) -> None:
    for p in strategy(products):
        print(f"{p['name']}: ${p['price']} ({p['rating']}★)")

# Usage
products = [
    {"name": "Widget", "price": 29.99, "rating": 4.5},
    {"name": "Gadget", "price": 49.99, "rating": 3.8},
]
display_products(products, sort_by_rating)
```

### Rust — Traits and Closures

```rust
// Trait-based strategy
trait PricingStrategy {
    fn calculate(&self, base_price: f64, quantity: u32) -> f64;
}

struct RegularPricing;
impl PricingStrategy for RegularPricing {
    fn calculate(&self, base_price: f64, quantity: u32) -> f64 {
        base_price * quantity as f64
    }
}

struct BulkDiscount { threshold: u32, discount: f64 }
impl PricingStrategy for BulkDiscount {
    fn calculate(&self, base_price: f64, quantity: u32) -> f64 {
        let total = base_price * quantity as f64;
        if quantity >= self.threshold {
            total * (1.0 - self.discount)
        } else {
            total
        }
    }
}

// Generic over any strategy
fn checkout<S: PricingStrategy>(strategy: &S, price: f64, qty: u32) -> f64 {
    strategy.calculate(price, qty)
}

// Or use closures — simpler for one-offs
fn checkout_fn(strategy: impl Fn(f64, u32) -> f64, price: f64, qty: u32) -> f64 {
    strategy(price, qty)
}
```

### Go — Interfaces (Implicit)

```go
// Go interfaces are satisfied implicitly — no "implements" keyword
type SortStrategy interface {
    Sort(items []Product) []Product
}

type ByPrice struct{}
func (ByPrice) Sort(items []Product) []Product {
    sort.Slice(items, func(i, j int) bool {
        return items[i].Price < items[j].Price
    })
    return items
}

type ByRating struct{}
func (ByRating) Sort(items []Product) []Product {
    sort.Slice(items, func(i, j int) bool {
        return items[i].Rating > items[j].Rating
    })
    return items
}

// Function type as strategy — Go idiom
type SortFunc func([]Product) []Product

func DisplayProducts(products []Product, strategy SortFunc) {
    for _, p := range strategy(products) {
        fmt.Printf("%s: $%.2f\n", p.Name, p.Price)
    }
}
```

### Java — Interface + Lambda

```java
@FunctionalInterface
interface PricingStrategy {
    double calculate(double basePrice, int quantity);
}

class OrderService {
    private PricingStrategy strategy;

    OrderService(PricingStrategy strategy) {
        this.strategy = strategy;
    }

    double checkout(double price, int qty) {
        return strategy.calculate(price, qty);
    }
}

// Usage — lambda replaces anonymous class
var regular = new OrderService((price, qty) -> price * qty);
var bulk = new OrderService((price, qty) ->
    qty >= 10 ? price * qty * 0.9 : price * qty
);
```

### TypeScript — Union Types and Functions

```typescript
type SortStrategy = (products: Product[]) => Product[];

const byPrice: SortStrategy = (products) =>
  [...products].sort((a, b) => a.price - b.price);

const byRating: SortStrategy = (products) =>
  [...products].sort((a, b) => b.rating - a.rating);

function displayProducts(products: Product[], strategy: SortStrategy = byPrice) {
  strategy(products).forEach(p =>
    console.log(`${p.name}: $${p.price}`)
  );
}
```

---

## 2. Observer Pattern

### Python — Callback Lists

```python
from typing import Callable, Any

class EventEmitter:
    def __init__(self):
        self._handlers: dict[str, list[Callable]] = {}

    def on(self, event: str, handler: Callable) -> None:
        self._handlers.setdefault(event, []).append(handler)

    def emit(self, event: str, *args: Any) -> None:
        for handler in self._handlers.get(event, []):
            handler(*args)

# Usage
emitter = EventEmitter()
emitter.on("user_created", lambda user: send_welcome_email(user))
emitter.on("user_created", lambda user: create_audit_log("created", user))
emitter.emit("user_created", new_user)
```

### Rust — Trait Objects or Channels

```rust
use std::sync::mpsc;

// Channel-based observer — idiomatic Rust (avoids callback ownership issues)
enum UserEvent {
    Created(User),
    Updated(User),
    Deleted(u64),
}

fn setup_observers(rx: mpsc::Receiver<UserEvent>) {
    std::thread::spawn(move || {
        for event in rx {
            match event {
                UserEvent::Created(user) => {
                    send_welcome_email(&user);
                    create_audit_log("created", &user);
                }
                UserEvent::Updated(user) => {
                    create_audit_log("updated", &user);
                }
                UserEvent::Deleted(id) => {
                    create_audit_log("deleted_id", &id.to_string());
                }
            }
        }
    });
}
```

### Go — Channels ARE the Observer Pattern

```go
type EventBus struct {
    subscribers map[string][]chan Event
    mu          sync.RWMutex
}

func (eb *EventBus) Subscribe(topic string) <-chan Event {
    eb.mu.Lock()
    defer eb.mu.Unlock()
    ch := make(chan Event, 10)
    eb.subscribers[topic] = append(eb.subscribers[topic], ch)
    return ch
}

func (eb *EventBus) Publish(topic string, event Event) {
    eb.mu.RLock()
    defer eb.mu.RUnlock()
    for _, ch := range eb.subscribers[topic] {
        select {
        case ch <- event:
        default: // Don't block if subscriber is slow
        }
    }
}
```

### Java — Functional Observers

```java
import java.util.*;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Consumer;

class EventBus<T> {
    private final Map<String, List<Consumer<T>>> handlers = new ConcurrentHashMap<>();

    public void on(String event, Consumer<T> handler) {
        handlers.computeIfAbsent(event, k -> new CopyOnWriteArrayList<>()).add(handler);
    }

    public void emit(String event, T data) {
        handlers.getOrDefault(event, List.of()).forEach(h -> h.accept(data));
    }
}
```

---

## 3. Factory Pattern

### Python — Dictionary Dispatch

```python
class Serializer:
    _registry: dict[str, type] = {}

    def __init_subclass__(cls, format: str = "", **kwargs):
        super().__init_subclass__(**kwargs)
        if format:
            Serializer._registry[format] = cls

    @staticmethod
    def create(format: str) -> "Serializer":
        cls = Serializer._registry.get(format)
        if not cls:
            raise ValueError(f"Unknown format: {format}")
        return cls()

class JSONSerializer(Serializer, format="json"):
    def serialize(self, data): return json.dumps(data)

class XMLSerializer(Serializer, format="xml"):
    def serialize(self, data): return dict_to_xml(data)

# Auto-registered via __init_subclass__
s = Serializer.create("json")
```

### Rust — Enum + Match (No Factory Needed)

```rust
enum Shape {
    Circle { radius: f64 },
    Rectangle { width: f64, height: f64 },
    Triangle { base: f64, height: f64 },
}

impl Shape {
    fn area(&self) -> f64 {
        match self {
            Shape::Circle { radius } => std::f64::consts::PI * radius * radius,
            Shape::Rectangle { width, height } => width * height,
            Shape::Triangle { base, height } => 0.5 * base * height,
        }
    }

    // Factory method when needed
    fn from_str(s: &str, params: &[f64]) -> Result<Shape, String> {
        match s {
            "circle" => Ok(Shape::Circle { radius: params[0] }),
            "rect" => Ok(Shape::Rectangle { width: params[0], height: params[1] }),
            "tri" => Ok(Shape::Triangle { base: params[0], height: params[1] }),
            _ => Err(format!("Unknown shape: {}", s)),
        }
    }
}
// Rust's enums make the Factory pattern mostly unnecessary
```

### Go — Constructor Functions

```go
// Go doesn't have classes or inheritance — use constructor functions
type Logger interface {
    Log(msg string)
}

type consoleLogger struct{}
func (l *consoleLogger) Log(msg string) { fmt.Println(msg) }

type fileLogger struct{ file *os.File }
func (l *fileLogger) Log(msg string) { fmt.Fprintln(l.file, msg) }

// Factory function
func NewLogger(logType string) (Logger, error) {
    switch logType {
    case "console":
        return &consoleLogger{}, nil
    case "file":
        f, err := os.OpenFile("app.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
        if err != nil {
            return nil, err
        }
        return &fileLogger{file: f}, nil
    default:
        return nil, fmt.Errorf("unknown logger type: %s", logType)
    }
}
```

### Java — Abstract Factory

```java
// Java is where Factory patterns shine — they originated here
interface NotificationFactory {
    Notification create(String recipient, String message);
}

class EmailNotificationFactory implements NotificationFactory {
    private final SmtpClient client;

    EmailNotificationFactory(SmtpClient client) {
        this.client = client;
    }

    @Override
    public Notification create(String recipient, String message) {
        return new EmailNotification(client, recipient, message);
    }
}

class SmsNotificationFactory implements NotificationFactory {
    private final SmsGateway gateway;

    SmsNotificationFactory(SmsGateway gateway) {
        this.gateway = gateway;
    }

    @Override
    public Notification create(String recipient, String message) {
        return new SmsNotification(gateway, recipient, message);
    }
}
```

---

## 4. Builder Pattern

### Python — Fluent Builder with Dataclass

```python
from dataclasses import dataclass, field

@dataclass
class HttpRequest:
    method: str = "GET"
    url: str = ""
    headers: dict[str, str] = field(default_factory=dict)
    body: str | None = None
    timeout: float = 30.0

    class Builder:
        def __init__(self):
            self._request = HttpRequest()

        def method(self, method: str) -> "HttpRequest.Builder":
            self._request.method = method
            return self

        def url(self, url: str) -> "HttpRequest.Builder":
            self._request.url = url
            return self

        def header(self, key: str, value: str) -> "HttpRequest.Builder":
            self._request.headers[key] = value
            return self

        def body(self, body: str) -> "HttpRequest.Builder":
            self._request.body = body
            return self

        def build(self) -> "HttpRequest":
            if not self._request.url:
                raise ValueError("URL is required")
            return self._request

req = (HttpRequest.Builder()
    .method("POST")
    .url("https://api.example.com/users")
    .header("Content-Type", "application/json")
    .body('{"name": "Alice"}')
    .build())
```

### Rust — Builder with Type-State (Compile-Time Safety)

```rust
// Type-state builder — compiler enforces required fields
struct HttpRequestBuilder<Url = NoUrl> {
    method: String,
    url: Url,
    headers: Vec<(String, String)>,
    body: Option<String>,
}

struct NoUrl;
struct HasUrl(String);

impl HttpRequestBuilder<NoUrl> {
    fn new() -> Self {
        HttpRequestBuilder {
            method: "GET".to_string(),
            url: NoUrl,
            headers: Vec::new(),
            body: None,
        }
    }

    fn url(self, url: impl Into<String>) -> HttpRequestBuilder<HasUrl> {
        HttpRequestBuilder {
            method: self.method,
            url: HasUrl(url.into()),
            headers: self.headers,
            body: self.body,
        }
    }
}

impl HttpRequestBuilder<HasUrl> {
    fn build(self) -> HttpRequest {
        HttpRequest {
            method: self.method,
            url: self.url.0,
            headers: self.headers,
            body: self.body,
        }
    }
}

// Shared methods
impl<U> HttpRequestBuilder<U> {
    fn method(mut self, method: impl Into<String>) -> Self {
        self.method = method.into();
        self
    }
    fn header(mut self, key: impl Into<String>, val: impl Into<String>) -> Self {
        self.headers.push((key.into(), val.into()));
        self
    }
    fn body(mut self, body: impl Into<String>) -> Self {
        self.body = Some(body.into());
        self
    }
}

// .build() only available when URL is set — COMPILE-TIME enforcement
let req = HttpRequestBuilder::new()
    .method("POST")
    .url("https://api.example.com")
    .header("Content-Type", "application/json")
    .build(); // Only compiles because .url() was called
```

### Go — Functional Options Pattern (Replaces Builder)

```go
type Server struct {
    host    string
    port    int
    timeout time.Duration
    maxConn int
    tls     bool
}

type Option func(*Server)

func WithPort(port int) Option {
    return func(s *Server) { s.port = port }
}

func WithTimeout(d time.Duration) Option {
    return func(s *Server) { s.timeout = d }
}

func WithTLS(enabled bool) Option {
    return func(s *Server) { s.tls = enabled }
}

func WithMaxConnections(n int) Option {
    return func(s *Server) { s.maxConn = n }
}

func NewServer(host string, opts ...Option) *Server {
    s := &Server{
        host:    host,
        port:    8080,
        timeout: 30 * time.Second,
        maxConn: 100,
    }
    for _, opt := range opts {
        opt(s)
    }
    return s
}

// Usage
server := NewServer("localhost",
    WithPort(9090),
    WithTimeout(60*time.Second),
    WithTLS(true),
)
```

---

## 5. Adapter Pattern

### Python — Duck Typing Makes Adapters Trivial

```python
# Old interface
class LegacyPaymentGateway:
    def make_payment(self, amount_cents: int, card_number: str) -> bool:
        # Old API
        return True

# New interface expected by the system
class PaymentProcessor:
    def charge(self, amount: float, payment_method: dict) -> dict:
        raise NotImplementedError

# Adapter
class LegacyPaymentAdapter(PaymentProcessor):
    def __init__(self, legacy: LegacyPaymentGateway):
        self.legacy = legacy

    def charge(self, amount: float, payment_method: dict) -> dict:
        amount_cents = int(amount * 100)
        card = payment_method["card_number"]
        success = self.legacy.make_payment(amount_cents, card)
        return {"success": success, "amount": amount}
```

### Rust — Trait Impl on Newtype

```rust
// External type you can't modify
struct LegacyDatabase {
    // ...
}
impl LegacyDatabase {
    fn raw_query(&self, sql: &str) -> Vec<Vec<String>> { vec![] }
}

// Your trait
trait DataStore {
    fn find_by_id(&self, table: &str, id: u64) -> Option<Record>;
}

// Newtype wrapper — adapts LegacyDatabase to DataStore
struct LegacyAdapter(LegacyDatabase);

impl DataStore for LegacyAdapter {
    fn find_by_id(&self, table: &str, id: u64) -> Option<Record> {
        let sql = format!("SELECT * FROM {} WHERE id = {}", table, id);
        let rows = self.0.raw_query(&sql);
        rows.first().map(|row| parse_record(row))
    }
}
```

### Go — Interface Wrapping

```go
// Adapter is just implementing an interface by wrapping another type
type OldLogger struct{}
func (l *OldLogger) WriteLog(level int, message string) {}

type Logger interface {
    Info(msg string)
    Error(msg string)
}

type LoggerAdapter struct {
    old *OldLogger
}

func (a *LoggerAdapter) Info(msg string)  { a.old.WriteLog(1, msg) }
func (a *LoggerAdapter) Error(msg string) { a.old.WriteLog(3, msg) }

// LoggerAdapter satisfies Logger interface automatically
var _ Logger = (*LoggerAdapter)(nil) // Compile-time check
```

---

## 6. Command Pattern

### TypeScript — Objects as Commands

```typescript
interface Command {
  execute(): void;
  undo(): void;
}

class AddTextCommand implements Command {
  constructor(
    private editor: TextEditor,
    private text: string,
    private position: number,
  ) {}

  execute() {
    this.editor.insertAt(this.position, this.text);
  }

  undo() {
    this.editor.deleteAt(this.position, this.text.length);
  }
}

class CommandHistory {
  private history: Command[] = [];
  private undone: Command[] = [];

  execute(command: Command) {
    command.execute();
    this.history.push(command);
    this.undone = []; // Clear redo stack
  }

  undo() {
    const cmd = this.history.pop();
    if (cmd) {
      cmd.undo();
      this.undone.push(cmd);
    }
  }

  redo() {
    const cmd = this.undone.pop();
    if (cmd) {
      cmd.execute();
      this.history.push(cmd);
    }
  }
}
```

### Rust — Enum Commands (Idiomatic)

```rust
enum EditorCommand {
    Insert { position: usize, text: String },
    Delete { position: usize, length: usize, deleted: String },
    Replace { position: usize, old: String, new_text: String },
}

impl EditorCommand {
    fn execute(&self, buffer: &mut String) {
        match self {
            EditorCommand::Insert { position, text } => {
                buffer.insert_str(*position, text);
            }
            EditorCommand::Delete { position, length, .. } => {
                buffer.drain(*position..*position + *length);
            }
            EditorCommand::Replace { position, old, new_text } => {
                buffer.replace_range(*position..*position + old.len(), new_text);
            }
        }
    }

    fn undo(&self, buffer: &mut String) {
        match self {
            EditorCommand::Insert { position, text } => {
                buffer.drain(*position..*position + text.len());
            }
            EditorCommand::Delete { position, deleted, .. } => {
                buffer.insert_str(*position, deleted);
            }
            EditorCommand::Replace { position, old, new_text } => {
                buffer.replace_range(*position..*position + new_text.len(), old);
            }
        }
    }
}
```

---

## 7. When Language Idioms Replace Patterns

| Pattern | Python | Rust | Go | Java | TypeScript |
|---------|--------|------|-----|------|-----------|
| Strategy | Functions | Closures/Traits | Func types/Interfaces | Lambdas/Interfaces | Functions |
| Observer | Callbacks | Channels | Channels | Listeners | EventEmitter |
| Factory | `__init_subclass__` / dict | Enum variants | Constructor funcs | Abstract Factory | Union types |
| Builder | Kwargs / dataclass | Type-state builder | Functional options | Fluent builder | Object spread |
| Iterator | Generators | `impl Iterator` | `range` / channels | `Stream` API | Generators |
| Singleton | Module-level variable | `lazy_static!` / `OnceLock` | `sync.Once` | Enum singleton | Module scope |
| Decorator | `@decorator` (first-class) | Newtype wrapper | Middleware func | AOP / Proxy | Higher-order func |
| Template Method | ABC with default methods | Default trait methods | Embedding | Abstract class | Abstract class |

### Key Insight: Pattern Complexity Varies by Language

- **Python**: First-class functions eliminate most structural patterns. Metaclasses and descriptors handle the rest.
- **Rust**: Enums + pattern matching eliminate many GoF patterns. Traits provide interface-like abstraction. Ownership rules out some patterns entirely.
- **Go**: Interfaces are implicit — any type that has the methods satisfies the interface. Channels replace callback-based patterns. Composition over inheritance (embedding).
- **Java**: Where most GoF patterns originated. Still useful but modern Java (records, sealed classes, lambdas) simplifies many.
- **TypeScript**: Union types, mapped types, and first-class functions make many patterns unnecessary. Type system is more expressive than Java's.

---

## 8. Cross-Language Anti-Patterns

| Anti-Pattern | Why It's Bad | Language-Specific Fix |
|---|---|---|
| Overusing inheritance | Tight coupling, fragile base class | Python: composition. Rust: traits. Go: embedding. Java: interfaces. |
| Singleton for everything | Hidden global state, untestable | All: Dependency injection |
| God Object | Too many responsibilities | All: Single Responsibility Principle |
| Primitive Obsession | `string` for everything | Python: dataclass. Rust: newtype. Go: named types. Java: records. TS: branded types. |
| Applying Java patterns to Go | Go has no classes/generics-first design | Go: Use interfaces, embedding, channels |
| Using OOP patterns in Rust | Fighting the borrow checker | Rust: Use enums, traits, functional patterns |
| Callback hell | Deep nesting, hard to reason about | All: async/await, channels, or reactive streams |
