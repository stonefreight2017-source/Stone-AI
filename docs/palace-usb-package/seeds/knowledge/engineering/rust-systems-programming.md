# Rust Systems Programming

> Palace Knowledge Seed — Software Engineering Breadth
> For: All 40 agents + Three Heads | Format: RAG-optimized chunks

---

## 1. FFI — Calling C from Rust

Foreign Function Interface lets Rust call C code and vice versa.

### Declaring External C Functions

```rust
// Link to system libc
extern "C" {
    fn strlen(s: *const std::os::raw::c_char) -> usize;
    fn printf(format: *const std::os::raw::c_char, ...) -> std::os::raw::c_int;
}

fn main() {
    let c_string = std::ffi::CString::new("Hello from Rust!").unwrap();

    unsafe {
        let len = strlen(c_string.as_ptr());
        println!("C says length is: {}", len);
    }
}
```

### Wrapping a C Library

```rust
// bindings.rs — manual bindings for a C math library
use std::os::raw::{c_double, c_int};

#[link(name = "mymath")]  // Links to libmymath.so / mymath.lib
extern "C" {
    fn matrix_multiply(
        a: *const c_double,
        b: *const c_double,
        result: *mut c_double,
        rows_a: c_int,
        cols_a: c_int,
        cols_b: c_int,
    ) -> c_int;
}

// Safe Rust wrapper
pub fn safe_matrix_multiply(a: &[f64], b: &[f64], rows_a: usize, cols_a: usize, cols_b: usize) -> Result<Vec<f64>, String> {
    if a.len() != rows_a * cols_a {
        return Err("Matrix A dimensions mismatch".into());
    }
    if b.len() != cols_a * cols_b {
        return Err("Matrix B dimensions mismatch".into());
    }

    let mut result = vec![0.0f64; rows_a * cols_b];

    let status = unsafe {
        matrix_multiply(
            a.as_ptr(),
            b.as_ptr(),
            result.as_mut_ptr(),
            rows_a as c_int,
            cols_a as c_int,
            cols_b as c_int,
        )
    };

    if status == 0 {
        Ok(result)
    } else {
        Err(format!("matrix_multiply failed with status {}", status))
    }
}
```

### Using `bindgen` for Automatic Bindings

```toml
# Cargo.toml
[build-dependencies]
bindgen = "0.69"
```

```rust
// build.rs
fn main() {
    println!("cargo:rustc-link-lib=mylib");
    println!("cargo:rerun-if-changed=wrapper.h");

    let bindings = bindgen::Builder::default()
        .header("wrapper.h")
        .parse_callbacks(Box::new(bindgen::CargoCallbacks::new()))
        .generate()
        .expect("Unable to generate bindings");

    let out_path = std::path::PathBuf::from(std::env::var("OUT_DIR").unwrap());
    bindings.write_to_file(out_path.join("bindings.rs")).unwrap();
}

// src/lib.rs
include!(concat!(env!("OUT_DIR"), "/bindings.rs"));
```

---

## 2. FFI — Calling Rust from C

Expose Rust functions to C with `#[no_mangle]` and `extern "C"`.

```rust
// lib.rs — compiled as cdylib
use std::ffi::{CStr, CString};
use std::os::raw::c_char;

/// # Safety
/// `input` must be a valid null-terminated C string.
#[no_mangle]
pub unsafe extern "C" fn process_string(input: *const c_char) -> *mut c_char {
    if input.is_null() {
        return std::ptr::null_mut();
    }

    let c_str = unsafe { CStr::from_ptr(input) };
    let rust_str = match c_str.to_str() {
        Ok(s) => s,
        Err(_) => return std::ptr::null_mut(),
    };

    let result = rust_str.to_uppercase();
    let c_result = CString::new(result).unwrap();
    c_result.into_raw() // Caller must free with free_string()
}

/// # Safety
/// `s` must have been allocated by `process_string`.
#[no_mangle]
pub unsafe extern "C" fn free_string(s: *mut c_char) {
    if !s.is_null() {
        unsafe { drop(CString::from_raw(s)); }
    }
}

// Opaque types for C consumers
pub struct Engine {
    data: Vec<f64>,
    name: String,
}

#[no_mangle]
pub extern "C" fn engine_new() -> *mut Engine {
    Box::into_raw(Box::new(Engine {
        data: Vec::new(),
        name: String::from("default"),
    }))
}

#[no_mangle]
pub unsafe extern "C" fn engine_push(engine: *mut Engine, value: f64) {
    if let Some(engine) = unsafe { engine.as_mut() } {
        engine.data.push(value);
    }
}

#[no_mangle]
pub unsafe extern "C" fn engine_free(engine: *mut Engine) {
    if !engine.is_null() {
        unsafe { drop(Box::from_raw(engine)); }
    }
}
```

```toml
# Cargo.toml
[lib]
crate-type = ["cdylib"]  # Produces .so/.dylib/.dll
```

```c
// C consumer
#include <stdio.h>

// Declarations matching Rust exports
typedef struct Engine Engine;
extern Engine* engine_new(void);
extern void engine_push(Engine* engine, double value);
extern void engine_free(Engine* engine);
extern char* process_string(const char* input);
extern void free_string(char* s);

int main() {
    Engine* e = engine_new();
    engine_push(e, 3.14);
    engine_push(e, 2.71);
    engine_free(e);

    char* result = process_string("hello from c");
    printf("Rust says: %s\n", result);
    free_string(result);
    return 0;
}
```

---

## 3. Unsafe Blocks — When and Why

`unsafe` lets you do 5 things that the compiler can't verify:

1. Dereference raw pointers
2. Call unsafe functions
3. Access mutable statics
4. Implement unsafe traits
5. Access fields of `union`s

### Raw Pointers

```rust
fn main() {
    let mut value = 42;

    // Creating raw pointers is safe
    let r1 = &value as *const i32;
    let r2 = &mut value as *mut i32;

    // Dereferencing requires unsafe
    unsafe {
        println!("r1 = {}", *r1);
        *r2 = 100;
        println!("r2 = {}", *r2);
    }
}
```

### Safe Abstraction Over Unsafe Code

```rust
/// Split a mutable slice at an index — safe API, unsafe implementation.
fn split_at_mut(slice: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
    let len = slice.len();
    assert!(mid <= len);

    let ptr = slice.as_mut_ptr();

    unsafe {
        (
            std::slice::from_raw_parts_mut(ptr, mid),
            std::slice::from_raw_parts_mut(ptr.add(mid), len - mid),
        )
    }
}

fn main() {
    let mut v = vec![1, 2, 3, 4, 5, 6];
    let (left, right) = split_at_mut(&mut v, 3);
    left[0] = 100;
    right[0] = 200;
    println!("{:?}", v); // [100, 2, 3, 200, 5, 6]
}
```

### Unsafe Traits

```rust
// Send and Sync are unsafe traits — incorrect implementation = UB
// Only implement when you've proven thread safety

struct MyWrapper(*mut u8);

// ONLY do this if MyWrapper is genuinely safe to send between threads
unsafe impl Send for MyWrapper {}
unsafe impl Sync for MyWrapper {}
```

### Rules for Using Unsafe

1. **Minimize unsafe blocks** — keep them as small as possible.
2. **Document safety invariants** — explain WHY it's safe in comments.
3. **Wrap in safe APIs** — unsafe internals, safe external interface.
4. **Use `#[deny(unsafe_op_in_unsafe_fn)]`** — require explicit unsafe even inside unsafe fns.
5. **Use Miri for testing** — `cargo +nightly miri test` detects undefined behavior.

---

## 4. `no_std` for Embedded

`#![no_std]` removes the standard library dependency, using only `core` (and optionally `alloc`).

```rust
#![no_std]
#![no_main]

use core::panic::PanicInfo;

// Embedded — no OS, no heap by default
// Only core library available: Option, Result, iterators, etc.

#[panic_handler]
fn panic(_info: &PanicInfo) -> ! {
    loop {} // Hang on panic — no OS to return to
}

#[no_mangle]
pub extern "C" fn _start() -> ! {
    // Entry point — no main() in no_std
    let x = 42;
    let y = x * 2;

    // Can't use println!, String, Vec, etc. without alloc
    // Can use arrays, slices, iterators, core::fmt

    loop {}
}
```

### With `alloc` (Heap Allocation Without Full Std)

```rust
#![no_std]
extern crate alloc;

use alloc::string::String;
use alloc::vec::Vec;
use alloc::format;

// Must provide a global allocator
use linked_list_allocator::LockedHeap;

#[global_allocator]
static ALLOCATOR: LockedHeap = LockedHeap::empty();

fn init_heap() {
    unsafe {
        ALLOCATOR.lock().init(HEAP_START as *mut u8, HEAP_SIZE);
    }
}
```

### Embedded HAL Pattern

```rust
#![no_std]
#![no_main]

use cortex_m_rt::entry;
use stm32f4xx_hal::{pac, prelude::*};

#[entry]
fn main() -> ! {
    let dp = pac::Peripherals::take().unwrap();
    let rcc = dp.RCC.constrain();
    let clocks = rcc.cfgr.sysclk(84.MHz()).freeze();

    let gpioa = dp.GPIOA.split();
    let mut led = gpioa.pa5.into_push_pull_output();

    loop {
        led.set_high();
        cortex_m::asm::delay(8_000_000);
        led.set_low();
        cortex_m::asm::delay(8_000_000);
    }
}
```

---

## 5. WASM — Compiling Rust to WebAssembly

### Using `wasm-pack`

```bash
# Install
cargo install wasm-pack

# Create project
cargo new --lib my-wasm-lib
```

```toml
# Cargo.toml
[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "0.2"
js-sys = "0.3"
web-sys = { version = "0.3", features = ["console", "Document", "Element", "HtmlElement"] }
```

```rust
// src/lib.rs
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn fibonacci(n: u32) -> u64 {
    if n < 2 {
        return n as u64;
    }
    let mut a: u64 = 0;
    let mut b: u64 = 1;
    for _ in 2..=n {
        let temp = a + b;
        a = b;
        b = temp;
    }
    b
}

#[wasm_bindgen]
pub struct ImageProcessor {
    width: u32,
    height: u32,
    pixels: Vec<u8>,
}

#[wasm_bindgen]
impl ImageProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new(width: u32, height: u32) -> ImageProcessor {
        ImageProcessor {
            width,
            height,
            pixels: vec![0; (width * height * 4) as usize],
        }
    }

    pub fn pixels(&self) -> *const u8 {
        self.pixels.as_ptr()
    }

    pub fn grayscale(&mut self) {
        for chunk in self.pixels.chunks_exact_mut(4) {
            let gray = (0.299 * chunk[0] as f64
                + 0.587 * chunk[1] as f64
                + 0.114 * chunk[2] as f64) as u8;
            chunk[0] = gray;
            chunk[1] = gray;
            chunk[2] = gray;
            // chunk[3] = alpha, unchanged
        }
    }
}

// Calling JavaScript from Rust
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn greet(name: &str) {
    log(&format!("Hello, {}!", name));
}
```

```bash
# Build
wasm-pack build --target web
# Output: pkg/ directory with .wasm, .js glue, .d.ts types
```

```javascript
// JavaScript consumer
import init, { fibonacci, ImageProcessor, greet } from './pkg/my_wasm_lib.js';

async function main() {
    await init();

    console.log(fibonacci(50)); // Instant — Rust speed in browser
    greet("Palace");

    const processor = new ImageProcessor(800, 600);
    processor.grayscale();
}
main();
```

---

## 6. Error Handling — `thiserror` and `anyhow`

### `thiserror` — For Library Error Types

```rust
use thiserror::Error;

#[derive(Error, Debug)]
pub enum DatabaseError {
    #[error("connection failed: {0}")]
    ConnectionFailed(String),

    #[error("query failed: {query}")]
    QueryFailed {
        query: String,
        #[source]
        source: sqlx::Error,
    },

    #[error("record not found: {table}.{id}")]
    NotFound { table: String, id: i64 },

    #[error("migration error")]
    Migration(#[from] MigrationError), // Auto impl From<MigrationError>

    #[error(transparent)]
    Other(#[from] std::io::Error), // Transparent — delegates Display to inner
}

// Usage in library code
pub fn get_user(id: i64) -> Result<User, DatabaseError> {
    let conn = connect().map_err(|e| DatabaseError::ConnectionFailed(e.to_string()))?;

    conn.query_one("SELECT * FROM users WHERE id = $1", &[&id])
        .map_err(|source| DatabaseError::QueryFailed {
            query: format!("SELECT user {}", id),
            source,
        })
}
```

### `anyhow` — For Application Error Handling

```rust
use anyhow::{Context, Result, bail, ensure};

// Result is anyhow::Result<T> = Result<T, anyhow::Error>
fn load_config(path: &str) -> Result<Config> {
    let content = std::fs::read_to_string(path)
        .with_context(|| format!("Failed to read config file: {}", path))?;

    let config: Config = serde_json::from_str(&content)
        .context("Failed to parse config JSON")?;

    ensure!(config.port > 0, "Port must be positive, got {}", config.port);

    if config.workers == 0 {
        bail!("Workers count cannot be zero");
    }

    Ok(config)
}

fn main() -> Result<()> {
    let config = load_config("config.json")?;
    run_server(config)?;
    Ok(())
}
```

### When to Use Which

| Crate | Use For | Why |
|-------|---------|-----|
| `thiserror` | Libraries | Callers need to match on error variants |
| `anyhow` | Applications | Just propagate errors with context |
| Both | Large apps | `thiserror` for domain errors, `anyhow` at the top level |

---

## 7. Serde Serialization

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiResponse {
    pub status_code: u16,
    pub message: String,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<serde_json::Value>,

    #[serde(default)]
    pub errors: Vec<String>,

    #[serde(rename = "type")]
    pub response_type: ResponseType,

    #[serde(with = "chrono::serde::ts_seconds")]
    pub timestamp: chrono::DateTime<chrono::Utc>,

    #[serde(skip)]
    pub internal_id: u64, // Not serialized
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "kind", content = "value")]
pub enum ResponseType {
    Success,
    Error,
    Redirect(String),
}

// Custom serialization
use serde::Serializer;

fn serialize_as_hex<S>(bytes: &[u8], serializer: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    serializer.serialize_str(&hex::encode(bytes))
}

#[derive(Serialize)]
struct Hash {
    #[serde(serialize_with = "serialize_as_hex")]
    digest: Vec<u8>,
}

// Usage
fn main() -> Result<(), Box<dyn std::error::Error>> {
    let response = ApiResponse {
        status_code: 200,
        message: "OK".into(),
        data: Some(serde_json::json!({"users": 42})),
        errors: vec![],
        response_type: ResponseType::Success,
        timestamp: chrono::Utc::now(),
        internal_id: 0,
    };

    // To JSON
    let json = serde_json::to_string_pretty(&response)?;
    println!("{}", json);

    // From JSON
    let parsed: ApiResponse = serde_json::from_str(&json)?;

    // To/from other formats
    let yaml = serde_yaml::to_string(&response)?;
    let toml_str = toml::to_string(&response)?;
    let msgpack = rmp_serde::to_vec(&response)?;

    Ok(())
}
```

---

## 8. Anti-Patterns Summary

| Anti-Pattern | Fix |
|---|---|
| `unsafe` without safety docs | Document every invariant |
| Large unsafe blocks | Minimize — only the exact unsafe op |
| Leaking memory from FFI | Always pair alloc/free functions |
| `#[no_mangle]` on generics | Generic functions can't be `extern "C"` |
| Passing Rust objects to C without boxing | Use `Box::into_raw` / `Box::from_raw` |
| WASM without `wasm-opt` | Always optimize: `wasm-opt -Oz` |
| Using `String` in no_std without alloc | Use `&str`, `heapless::String`, or `arrayvec` |
| `unwrap()` in FFI boundary | Return error codes; panics across FFI = UB |
| Ignoring `Send`/`Sync` for FFI types | Implement manually only when provably safe |
| Not using `CString`/`CStr` for C strings | Raw `*const u8` misses null termination |
