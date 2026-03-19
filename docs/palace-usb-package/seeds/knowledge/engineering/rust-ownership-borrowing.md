# Rust Ownership & Borrowing

> Palace Knowledge Seed — Software Engineering Breadth
> For: All 40 agents + Three Heads | Format: RAG-optimized chunks

---

## 1. Ownership Rules

Rust's ownership system enforces memory safety at compile time. Three rules:

1. Each value has exactly one owner.
2. When the owner goes out of scope, the value is dropped.
3. There can be either ONE mutable reference OR any number of immutable references (never both).

```rust
fn main() {
    // s1 owns the String
    let s1 = String::from("hello");

    // Move: s1's ownership transfers to s2. s1 is now INVALID.
    let s2 = s1;
    // println!("{}", s1); // ERROR: value used after move

    // Clone: deep copy, both s1_new and s3 own independent data
    let s1_new = String::from("hello");
    let s3 = s1_new.clone();
    println!("{} {}", s1_new, s3); // Both valid

    // Stack types (i32, f64, bool, char, tuples of Copy types) implement Copy
    let x = 42;
    let y = x; // Copy, not move. x is still valid.
    println!("{} {}", x, y); // Both valid
}
```

---

## 2. Move Semantics

When a value is moved, the original variable is invalidated. This prevents double-free and use-after-free.

```rust
fn take_ownership(s: String) {
    println!("Got: {}", s);
} // s is dropped here

fn give_ownership() -> String {
    String::from("new string") // Ownership transferred to caller
}

fn main() {
    let s = String::from("hello");
    take_ownership(s);
    // println!("{}", s); // ERROR: s was moved into take_ownership

    let s2 = give_ownership(); // s2 now owns the string
    println!("{}", s2); // Valid
}
```

### Move in Structs

```rust
struct User {
    name: String,
    email: String,
}

fn main() {
    let user1 = User {
        name: String::from("Alice"),
        email: String::from("alice@example.com"),
    };

    // Partial move — only name is moved
    let name = user1.name;
    // println!("{}", user1.name); // ERROR: name was moved
    println!("{}", user1.email); // OK — email wasn't moved

    // Struct update syntax — moves remaining fields
    let user2 = User {
        email: String::from("new@example.com"),
        ..user1 // Moves user1.name (already moved!) — would error
    };
}
```

---

## 3. Copy vs Clone

```rust
// Copy: implicit, bitwise copy. Only for stack-only types.
// Types that impl Copy: i32, f64, bool, char, &T, (i32, f64), [i32; 5]
// Types that DON'T: String, Vec<T>, Box<T>, any type owning heap data

#[derive(Debug, Clone, Copy)] // Copy requires Clone
struct Point {
    x: f64,
    y: f64,
}

#[derive(Debug, Clone)] // Clone but NOT Copy — has String (heap data)
struct Label {
    text: String,
    position: Point,
}

fn main() {
    let p1 = Point { x: 1.0, y: 2.0 };
    let p2 = p1; // Copy — p1 still valid
    println!("{:?} {:?}", p1, p2);

    let l1 = Label { text: String::from("hello"), position: p1 };
    let l2 = l1.clone(); // Must explicitly clone
    // let l3 = l1; // This would MOVE l1
    println!("{:?}", l1); // Only valid because we used clone(), not move
}
```

### Rule of Thumb
- Small, stack-only, no drop logic needed: derive `Copy`.
- Owns heap data or has custom `Drop`: only `Clone`, never `Copy`.
- You CANNOT implement both `Copy` and `Drop` on the same type.

---

## 4. References and Borrowing

Borrowing lets you access data without taking ownership.

```rust
// Immutable borrow: &T
fn calculate_length(s: &String) -> usize {
    s.len()
} // s goes out of scope, but since it doesn't own the String, nothing is dropped

// Mutable borrow: &mut T
fn push_exclamation(s: &mut String) {
    s.push('!');
}

fn main() {
    let mut s = String::from("hello");

    // Multiple immutable borrows — OK
    let r1 = &s;
    let r2 = &s;
    println!("{} {}", r1, r2);

    // Mutable borrow — OK because r1 and r2 are no longer used after this point
    let r3 = &mut s;
    r3.push_str(" world");
    println!("{}", r3);

    // ERROR: can't have immutable AND mutable borrows active simultaneously
    // let r4 = &s;
    // let r5 = &mut s;
    // println!("{} {}", r4, r5); // r4 and r5 both active — CONFLICT
}
```

### Non-Lexical Lifetimes (NLL)

Rust tracks when references are LAST USED, not when they go out of scope.

```rust
fn main() {
    let mut v = vec![1, 2, 3];

    let first = &v[0]; // Immutable borrow starts
    println!("{}", first); // Last use of `first`
    // Immutable borrow ENDS here (NLL)

    v.push(4); // Mutable borrow — OK because immutable borrow ended
}
```

---

## 5. Lifetimes

Lifetimes ensure references don't outlive the data they point to.

### Lifetime Elision Rules

The compiler infers lifetimes automatically in most cases:

1. Each reference parameter gets its own lifetime.
2. If there's exactly one input lifetime, it's assigned to all output lifetimes.
3. If one parameter is `&self` or `&mut self`, its lifetime is assigned to all output lifetimes.

```rust
// These are equivalent — compiler elides the lifetime
fn first_word(s: &str) -> &str { ... }
fn first_word<'a>(s: &'a str) -> &'a str { ... }
```

### Explicit Lifetimes — When Needed

```rust
// Compiler can't infer which input lifetime the output comes from
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let string1 = String::from("long string");
    let result;
    {
        let string2 = String::from("xyz");
        result = longest(string1.as_str(), string2.as_str());
        println!("{}", result); // OK — both string1 and string2 alive
    }
    // println!("{}", result); // ERROR if result references string2 (already dropped)
}
```

### Lifetime in Structs

```rust
// Struct holding a reference MUST declare the lifetime
struct Excerpt<'a> {
    text: &'a str, // This reference must live at least as long as the struct
}

impl<'a> Excerpt<'a> {
    // Rule 3: &self lifetime assigned to output
    fn first_sentence(&self) -> &str {
        self.text.split('.').next().unwrap_or(self.text)
    }
}

fn main() {
    let novel = String::from("Call me Ishmael. Some years ago...");
    let excerpt = Excerpt {
        text: novel.split('.').next().unwrap(),
    };
    println!("{}", excerpt.first_sentence());
}
```

### `'static` Lifetime

```rust
// 'static means the reference lives for the ENTIRE program
let s: &'static str = "hello"; // String literals are always 'static

// Common mistake: using 'static as a "fix" for lifetime errors
// BAD — don't slap 'static on everything
fn bad<'a>(s: &'a str) -> &'static str {
    // Can't return a local reference as 'static
    s // ERROR
}

// 'static in trait bounds means "no borrowed data" (owned types)
fn spawn_thread<T: Send + 'static>(val: T) {
    std::thread::spawn(move || {
        println!("thread owns val");
    });
}
```

---

## 6. Interior Mutability

When you need to mutate data behind an immutable reference. Moves borrow checking to runtime.

### `Cell<T>` — Copy Types Only

```rust
use std::cell::Cell;

struct Counter {
    count: Cell<u32>, // Can mutate even through &self
}

impl Counter {
    fn new() -> Self {
        Counter { count: Cell::new(0) }
    }

    fn increment(&self) { // Note: &self, not &mut self
        self.count.set(self.count.get() + 1);
    }

    fn get(&self) -> u32 {
        self.count.get()
    }
}
```

### `RefCell<T>` — Runtime Borrow Checking

```rust
use std::cell::RefCell;

struct Cache {
    data: RefCell<Vec<String>>,
}

impl Cache {
    fn new() -> Self {
        Cache { data: RefCell::new(Vec::new()) }
    }

    fn add(&self, item: String) {
        // borrow_mut() panics at runtime if already borrowed
        self.data.borrow_mut().push(item);
    }

    fn get_all(&self) -> Vec<String> {
        self.data.borrow().clone()
    }

    fn len(&self) -> usize {
        self.data.borrow().len()
    }
}

// DANGER: This panics at runtime!
fn will_panic() {
    let cache = Cache::new();
    let borrowed = cache.data.borrow(); // Immutable borrow
    cache.data.borrow_mut(); // PANIC: already borrowed immutably
}
```

### `Mutex<T>` — Thread-Safe Interior Mutability

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("Result: {}", *counter.lock().unwrap()); // 10
}
```

### When to Use Which

| Type | Thread-Safe | Overhead | Use Case |
|------|-------------|----------|----------|
| `Cell<T>` | No | Zero | Single-thread, Copy types |
| `RefCell<T>` | No | Runtime checks | Single-thread, any type |
| `Mutex<T>` | Yes | Lock overhead | Multi-thread |
| `RwLock<T>` | Yes | Lock overhead | Multi-thread, read-heavy |
| `AtomicU64` etc. | Yes | Minimal | Multi-thread, primitives |

---

## 7. Common Borrow Checker Errors and Fixes

### Error: Cannot borrow as mutable because it's already borrowed as immutable

```rust
// PROBLEM
let mut v = vec![1, 2, 3];
let first = &v[0];
v.push(4); // ERROR: v is borrowed immutably by `first`
println!("{}", first);

// FIX 1: Use first before mutating
let mut v = vec![1, 2, 3];
let first = v[0]; // Copy the value (i32 is Copy)
v.push(4);
println!("{}", first);

// FIX 2: Clone the data
let mut v = vec![String::from("hello")];
let first = v[0].clone(); // Clone, not borrow
v.push(String::from("world"));
println!("{}", first);
```

### Error: Moved value used

```rust
// PROBLEM
let s = String::from("hello");
let v = vec![s];
println!("{}", s); // ERROR: s was moved into v

// FIX 1: Clone
let s = String::from("hello");
let v = vec![s.clone()];
println!("{}", s);

// FIX 2: Use references
let s = String::from("hello");
let v: Vec<&String> = vec![&s];
println!("{}", s);
```

### Error: Returns a reference to data owned by the current function

```rust
// PROBLEM
fn create_greeting() -> &str {
    let s = String::from("hello");
    &s // ERROR: s is dropped at end of function
}

// FIX: Return owned data
fn create_greeting() -> String {
    String::from("hello") // Transfer ownership to caller
}
```

### Error: Cannot move out of borrowed content

```rust
// PROBLEM
fn first_element(v: &Vec<String>) -> String {
    v[0] // ERROR: can't move out of borrowed Vec
}

// FIX 1: Clone
fn first_element(v: &Vec<String>) -> String {
    v[0].clone()
}

// FIX 2: Return reference
fn first_element(v: &[String]) -> &str {
    &v[0]
}

// FIX 3: Take ownership of Vec
fn first_element(mut v: Vec<String>) -> String {
    v.remove(0)
}
```

---

## 8. Patterns for Working With the Borrow Checker

### Pattern: Split Borrows on Struct Fields

```rust
struct Game {
    player: Player,
    enemies: Vec<Enemy>,
    score: u32,
}

impl Game {
    // Can borrow different fields mutably at the same time
    fn update(&mut self) {
        // This works because player and enemies are separate fields
        update_player(&mut self.player, &self.enemies);
        self.score += 1;
    }
}

fn update_player(player: &mut Player, enemies: &[Enemy]) {
    // Can mutate player while reading enemies
}
```

### Pattern: Entry API for Maps

```rust
use std::collections::HashMap;

let mut map = HashMap::new();

// BAD — two lookups
if !map.contains_key("key") {
    map.insert("key", vec![1]);
} else {
    map.get_mut("key").unwrap().push(1);
}

// GOOD — one lookup with Entry API
map.entry("key")
    .and_modify(|v| v.push(1))
    .or_insert_with(|| vec![1]);

// Or simpler:
map.entry("key").or_default().push(1);
```

### Pattern: Temporary Variables to Shorten Borrows

```rust
// PROBLEM
let mut map = HashMap::new();
map.insert("a", vec![1, 2, 3]);
let values = map.get("a").unwrap(); // Immutable borrow
map.insert("b", values.clone()); // ERROR: map is borrowed

// FIX: Let the immutable borrow end first
let values = map.get("a").unwrap().clone(); // Clone and drop borrow
map.insert("b", values); // OK
```

---

## 9. Slice Patterns and Borrowing

```rust
fn process_slice(data: &[i32]) -> i32 {
    // Slices are fat pointers: (pointer, length)
    // Borrowing a slice doesn't require knowing the container type
    data.iter().sum()
}

fn main() {
    let vec = vec![1, 2, 3, 4, 5];
    let array = [1, 2, 3, 4, 5];

    // Both Vec and array can be borrowed as slices
    println!("{}", process_slice(&vec));
    println!("{}", process_slice(&array));
    println!("{}", process_slice(&vec[1..4])); // Sub-slice

    // String slices work the same way
    fn first_word(s: &str) -> &str {
        let bytes = s.as_bytes();
        for (i, &byte) in bytes.iter().enumerate() {
            if byte == b' ' {
                return &s[..i];
            }
        }
        s
    }

    let s = String::from("hello world");
    let word = first_word(&s); // &String auto-derefs to &str
    println!("{}", word); // "hello"
}
```

---

## 10. Anti-Patterns Summary

| Anti-Pattern | Fix |
|---|---|
| `.clone()` everywhere to silence borrow checker | Restructure code, use references |
| `'static` on everything | Use proper lifetime parameters |
| `RefCell` when `Cell` suffices | Use `Cell` for Copy types |
| Returning references to local variables | Return owned values |
| Giant structs preventing split borrows | Break into smaller structs |
| Using `Rc<RefCell<T>>` as default | Only when shared ownership + mutation needed |
| Ignoring `Arc` vs `Rc` distinction | `Rc` is single-thread, `Arc` is multi-thread |
| `unwrap()` on `Mutex::lock()` in production | Handle poisoned locks |
| Holding locks across await points | Release lock before await |
| Fighting the borrow checker with unsafe | Redesign your data flow |
