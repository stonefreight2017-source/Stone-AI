# C++ Performance Engineering

> Palace Knowledge Seed — Software Engineering Breadth
> For: All 40 agents + Three Heads | Format: RAG-optimized chunks

---

## 1. Cache Optimization — Data-Oriented Design

Modern CPUs spend most time waiting for memory. L1 cache access: ~1ns. Main memory: ~100ns. 100x difference.

### Array of Structs (AoS) vs Struct of Arrays (SoA)

```cpp
// AoS — traditional OOP approach
// Each entity's data is scattered across memory
struct Entity_AoS {
    float x, y, z;        // Position (12 bytes)
    float vx, vy, vz;     // Velocity (12 bytes)
    int health;            // 4 bytes
    int team;              // 4 bytes
    char name[32];         // 32 bytes — HUGE, rarely accessed
    // Total: 64 bytes per entity
};

// If you only need position for physics, you load 64 bytes per entity
// but only use 12 — wasting 81% of cache bandwidth
void update_positions_aos(Entity_AoS* entities, int count) {
    for (int i = 0; i < count; ++i) {
        entities[i].x += entities[i].vx;
        entities[i].y += entities[i].vy;
        entities[i].z += entities[i].vz;
    }
}

// SoA — data-oriented approach
// Group by access pattern
struct Entities_SoA {
    float* x;    // All x positions contiguous
    float* y;    // All y positions contiguous
    float* z;    // All z positions contiguous
    float* vx;   // All x velocities contiguous
    float* vy;
    float* vz;
    int* health;
    int* team;
    // name stored separately — rarely needed
    int count;
};

// Now loading ONLY the data we need — perfect cache utilization
void update_positions_soa(Entities_SoA& e) {
    for (int i = 0; i < e.count; ++i) {
        e.x[i] += e.vx[i];  // Sequential access — cache prefetcher loves this
        e.y[i] += e.vy[i];
        e.z[i] += e.vz[i];
    }
}
// Benchmarks show 3-10x speedup for SoA on large datasets
```

### Hot/Cold Splitting

```cpp
// Separate frequently accessed data from rarely accessed data
struct ParticleHot {
    float x, y, z;     // Used every frame
    float vx, vy, vz;  // Used every frame
};

struct ParticleCold {
    std::string texture;   // Used at creation
    int creation_frame;    // Used for debugging
    float spawn_x, spawn_y, spawn_z;  // Used for respawn
};

// Hot data is contiguous — cold data accessed rarely
std::vector<ParticleHot> hot_data;   // Tight loop, every frame
std::vector<ParticleCold> cold_data; // Same index, accessed rarely
```

### Cache Line Awareness

```cpp
// Most CPUs: 64-byte cache lines
// False sharing: two threads writing to different variables on the same cache line

// BAD — false sharing between threads
struct Counters {
    int thread_0_count;  // Same cache line as thread_1_count
    int thread_1_count;  // Writes to either invalidate the whole line
};

// GOOD — pad to separate cache lines
struct alignas(64) PaddedCounter {
    int count;
};

struct Counters_Fixed {
    PaddedCounter thread_0;  // Own cache line
    PaddedCounter thread_1;  // Own cache line
};

// C++17 hardware_destructive_interference_size
#include <new>
struct alignas(std::hardware_destructive_interference_size) Counter {
    std::atomic<int> value{0};
};
```

---

## 2. SIMD Intrinsics

Single Instruction Multiple Data — process 4/8/16 values per instruction.

```cpp
#include <immintrin.h>  // AVX/AVX2/SSE headers

// SSE — 128-bit (4 floats at once)
void add_arrays_sse(const float* a, const float* b, float* result, int n) {
    int i = 0;
    // Process 4 floats per iteration
    for (; i + 4 <= n; i += 4) {
        __m128 va = _mm_loadu_ps(&a[i]);     // Load 4 floats
        __m128 vb = _mm_loadu_ps(&b[i]);     // Load 4 floats
        __m128 vr = _mm_add_ps(va, vb);      // Add 4 pairs at once
        _mm_storeu_ps(&result[i], vr);       // Store 4 results
    }
    // Handle remaining elements
    for (; i < n; ++i) {
        result[i] = a[i] + b[i];
    }
}

// AVX2 — 256-bit (8 floats at once)
void add_arrays_avx(const float* a, const float* b, float* result, int n) {
    int i = 0;
    for (; i + 8 <= n; i += 8) {
        __m256 va = _mm256_loadu_ps(&a[i]);
        __m256 vb = _mm256_loadu_ps(&b[i]);
        __m256 vr = _mm256_add_ps(va, vb);
        _mm256_storeu_ps(&result[i], vr);
    }
    for (; i < n; ++i) {
        result[i] = a[i] + b[i];
    }
}

// Dot product with AVX2
float dot_product_avx(const float* a, const float* b, int n) {
    __m256 sum = _mm256_setzero_ps();
    int i = 0;
    for (; i + 8 <= n; i += 8) {
        __m256 va = _mm256_loadu_ps(&a[i]);
        __m256 vb = _mm256_loadu_ps(&b[i]);
        sum = _mm256_fmadd_ps(va, vb, sum);  // fused multiply-add
    }

    // Horizontal sum of 8 floats in sum
    __m128 hi = _mm256_extractf128_ps(sum, 1);
    __m128 lo = _mm256_castps256_ps128(sum);
    __m128 s = _mm_add_ps(hi, lo);
    s = _mm_hadd_ps(s, s);
    s = _mm_hadd_ps(s, s);
    float result = _mm_cvtss_f32(s);

    // Scalar remainder
    for (; i < n; ++i) {
        result += a[i] * b[i];
    }
    return result;
}
```

### Let the Compiler Auto-Vectorize

```cpp
// Often the compiler can vectorize simple loops automatically
// Enable with -O2 or -O3 and -march=native

// This WILL auto-vectorize with -O3
void multiply_scalar(float* data, int n, float factor) {
    for (int i = 0; i < n; ++i) {
        data[i] *= factor;
    }
}

// This WON'T auto-vectorize — loop dependency
void running_sum(float* data, int n) {
    for (int i = 1; i < n; ++i) {
        data[i] += data[i - 1];  // Each iteration depends on the previous
    }
}

// Hint: use __restrict__ to promise no aliasing
void add(float* __restrict__ result,
         const float* __restrict__ a,
         const float* __restrict__ b, int n) {
    for (int i = 0; i < n; ++i) {
        result[i] = a[i] + b[i];
    }
}
```

---

## 3. Memory Alignment

```cpp
#include <cstdlib>
#include <cstdint>

// alignas — specify alignment
struct alignas(16) Vec4 {
    float x, y, z, w;
};

struct alignas(32) AVXData {
    float data[8]; // 32-byte aligned for AVX
};

// Aligned allocation
void* ptr = std::aligned_alloc(64, 1024); // 64-byte aligned, 1024 bytes
std::free(ptr);

// C++17 aligned new/delete
struct alignas(64) CacheLine {
    std::array<int, 16> data;
};
auto* cl = new CacheLine;  // Automatically 64-byte aligned
delete cl;

// Check alignment at compile time
static_assert(alignof(Vec4) == 16, "Vec4 must be 16-byte aligned");
static_assert(sizeof(Vec4) == 16, "Vec4 must be exactly 16 bytes");
```

---

## 4. Profiling Tools

### perf (Linux)

```bash
# Record performance events
perf record -g ./my_program

# Show hotspots
perf report

# Cache miss analysis
perf stat -e cache-misses,cache-references,instructions,cycles ./my_program

# Branch prediction analysis
perf stat -e branch-misses,branches ./my_program

# Sample output:
# 1,234,567 cache-misses    # 2.3% of all cache refs
# 53,456,789 cache-references
# 5,678,901,234 instructions  # 1.42 insn per cycle
# 4,000,000,000 cycles
```

### Valgrind — Memory Analysis

```bash
# Memory leak detection
valgrind --leak-check=full --show-leak-kinds=all ./my_program

# Cache simulation
valgrind --tool=cachegrind ./my_program
cg_annotate cachegrind.out.<pid>

# Call graph profiling
valgrind --tool=callgrind ./my_program
kcachegrind callgrind.out.<pid>  # GUI viewer
```

### Intel VTune

```bash
# Hotspots analysis
vtune -collect hotspots -- ./my_program

# Memory access analysis
vtune -collect memory-access -- ./my_program

# Microarchitecture analysis
vtune -collect uarch-exploration -- ./my_program

# Threading analysis
vtune -collect threading -- ./my_program
```

### Quick In-Code Profiling

```cpp
#include <chrono>
#include <iostream>

class ScopedTimer {
    std::string name_;
    std::chrono::high_resolution_clock::time_point start_;

public:
    explicit ScopedTimer(std::string name) : name_(std::move(name)),
        start_(std::chrono::high_resolution_clock::now()) {}

    ~ScopedTimer() {
        auto end = std::chrono::high_resolution_clock::now();
        auto us = std::chrono::duration_cast<std::chrono::microseconds>(end - start_).count();
        std::cout << name_ << ": " << us << " us\n";
    }
};

void heavy_function() {
    ScopedTimer timer("heavy_function");
    // ... code being timed
} // Timer prints duration on scope exit
```

---

## 5. Compiler Optimization Flags

```bash
# GCC/Clang optimization levels
-O0  # No optimization (debug builds)
-O1  # Basic optimizations (fast compile)
-O2  # Standard optimization (production default)
-O3  # Aggressive optimization (auto-vectorization, loop unrolling)
-Os  # Optimize for size
-Ofast  # -O3 + fast-math (breaks IEEE floating point!)

# Architecture-specific
-march=native    # Use all CPU features available
-march=x86-64-v3 # AVX2 baseline (good for modern x86)
-mtune=native    # Tune for current CPU without breaking portability

# Link-time optimization (LTO) — whole-program optimization
-flto  # Enable at compile AND link time
# Can give 5-20% speedup by inlining across translation units

# Profile-guided optimization (PGO) — best performance
# Step 1: Instrument
g++ -fprofile-generate -O2 main.cpp -o main_instrumented
# Step 2: Run representative workload
./main_instrumented typical_input.dat
# Step 3: Optimize using collected profile
g++ -fprofile-use -O2 main.cpp -o main_optimized
# PGO can give 10-30% speedup — branch prediction, inlining decisions

# Useful warnings
-Wall -Wextra -Wpedantic -Werror
```

---

## 6. Lock-Free Data Structures

```cpp
#include <atomic>
#include <optional>

// Lock-free stack (Treiber stack)
template<typename T>
class LockFreeStack {
    struct Node {
        T data;
        Node* next;
        Node(T val) : data(std::move(val)), next(nullptr) {}
    };

    std::atomic<Node*> head_{nullptr};

public:
    void push(T value) {
        auto* new_node = new Node(std::move(value));
        new_node->next = head_.load(std::memory_order_relaxed);
        // CAS loop — retry if another thread pushed between load and store
        while (!head_.compare_exchange_weak(
            new_node->next, new_node,
            std::memory_order_release,
            std::memory_order_relaxed)) {
            // new_node->next is updated to current head by CAS failure
        }
    }

    std::optional<T> pop() {
        Node* old_head = head_.load(std::memory_order_relaxed);
        while (old_head && !head_.compare_exchange_weak(
            old_head, old_head->next,
            std::memory_order_acquire,
            std::memory_order_relaxed)) {
            // old_head updated by CAS failure
        }
        if (!old_head) return std::nullopt;

        T value = std::move(old_head->data);
        delete old_head; // WARNING: ABA problem — use hazard pointers in production
        return value;
    }

    ~LockFreeStack() {
        while (pop().has_value()) {}
    }
};
```

### SPSC Ring Buffer (Single Producer Single Consumer)

```cpp
template<typename T, size_t Capacity>
class SPSCQueue {
    static_assert((Capacity & (Capacity - 1)) == 0, "Capacity must be power of 2");

    std::array<T, Capacity> buffer_;
    alignas(64) std::atomic<size_t> head_{0}; // Written by consumer
    alignas(64) std::atomic<size_t> tail_{0}; // Written by producer

    static constexpr size_t mask = Capacity - 1;

public:
    bool push(const T& value) {
        size_t tail = tail_.load(std::memory_order_relaxed);
        size_t next_tail = (tail + 1) & mask;

        if (next_tail == head_.load(std::memory_order_acquire)) {
            return false; // Full
        }

        buffer_[tail] = value;
        tail_.store(next_tail, std::memory_order_release);
        return true;
    }

    std::optional<T> pop() {
        size_t head = head_.load(std::memory_order_relaxed);

        if (head == tail_.load(std::memory_order_acquire)) {
            return std::nullopt; // Empty
        }

        T value = buffer_[head];
        head_.store((head + 1) & mask, std::memory_order_release);
        return value;
    }
};
```

---

## 7. Memory Pools

Avoid heap fragmentation and allocation overhead by pre-allocating memory.

```cpp
#include <vector>
#include <cassert>

template<typename T, size_t BlockSize = 4096>
class MemoryPool {
    struct Block {
        alignas(T) char data[sizeof(T) * BlockSize];
    };

    std::vector<std::unique_ptr<Block>> blocks_;
    std::vector<T*> free_list_;
    size_t used_in_current_ = BlockSize; // Force first allocation

    void allocate_block() {
        auto block = std::make_unique<Block>();
        T* start = reinterpret_cast<T*>(block->data);
        for (size_t i = 0; i < BlockSize; ++i) {
            free_list_.push_back(start + i);
        }
        blocks_.push_back(std::move(block));
    }

public:
    template<typename... Args>
    T* create(Args&&... args) {
        if (free_list_.empty()) {
            allocate_block();
        }

        T* ptr = free_list_.back();
        free_list_.pop_back();
        return new (ptr) T(std::forward<Args>(args)...); // Placement new
    }

    void destroy(T* ptr) {
        if (ptr) {
            ptr->~T(); // Explicit destructor call
            free_list_.push_back(ptr); // Return to free list
        }
    }

    ~MemoryPool() {
        // Note: does NOT call destructors on live objects
        // User must destroy() all objects before pool destruction
    }
};

// Usage
struct Particle {
    float x, y, z;
    float vx, vy, vz;
    int lifetime;
};

void example() {
    MemoryPool<Particle> pool;

    std::vector<Particle*> particles;
    for (int i = 0; i < 100000; ++i) {
        particles.push_back(pool.create(
            Particle{0, 0, 0, 1.0f, 0, 0, 100}
        ));
    }
    // Allocation: near-zero overhead after first block

    for (auto* p : particles) {
        pool.destroy(p);
    }
    // Deallocation: near-zero overhead (just push to free list)
}
```

---

## 8. Branch Prediction Optimization

```cpp
// Use [[likely]] and [[unlikely]] (C++20) to hint the compiler
int process(int value) {
    if (value > 0) [[likely]] {
        return fast_path(value);
    } else [[unlikely]] {
        return error_handling(value);
    }
}

// Sort data to improve branch prediction
// Sorted data: branch predictor learns the pattern
// Random data: ~50% misprediction rate
void sum_positives(const std::vector<int>& data) {
    // With sorted data: branch predictor nails it after transition point
    // With random data: mispredicts ~50% of the time (5-15ns penalty each)
    int sum = 0;
    for (int x : data) {
        if (x > 0) {
            sum += x;
        }
    }
}

// Branchless alternative — no branch predictor needed
void sum_positives_branchless(const std::vector<int>& data) {
    int sum = 0;
    for (int x : data) {
        sum += x * (x > 0); // Branchless — always executes both
    }
}

// std::clamp is often branchless
int clamped = std::clamp(value, 0, 255);
```

---

## 9. Compile-Time Computation for Zero-Cost Abstractions

```cpp
// Compile-time lookup table
constexpr auto generate_sin_table() {
    std::array<float, 360> table{};
    for (int i = 0; i < 360; ++i) {
        table[i] = static_cast<float>(
            std::sin(i * 3.14159265358979 / 180.0)
        );
    }
    return table;
}

constexpr auto SIN_TABLE = generate_sin_table(); // Computed at compile time
// Runtime cost: zero — just a lookup

// Compile-time string hashing
constexpr uint32_t fnv1a(const char* str) {
    uint32_t hash = 2166136261u;
    while (*str) {
        hash ^= static_cast<uint32_t>(*str++);
        hash *= 16777619u;
    }
    return hash;
}

// Use in switch statements
void handle_command(const char* cmd) {
    switch (fnv1a(cmd)) {
        case fnv1a("start"):   start(); break;
        case fnv1a("stop"):    stop();  break;
        case fnv1a("restart"): restart(); break;
        default: unknown(cmd); break;
    }
}
```

---

## 10. Anti-Patterns Summary

| Anti-Pattern | Fix |
|---|---|
| AoS for hot loops | SoA or hot/cold splitting |
| Ignoring cache locality | Contiguous memory, sequential access |
| Virtual calls in hot loops | CRTP, templates, or devirtualize |
| `std::list` for everything | `std::vector` — cache friendly |
| Allocating in hot paths | Memory pools, pre-allocation |
| No PGO for production builds | Profile-guided optimization |
| Hand-written SIMD for simple loops | Let compiler auto-vectorize first |
| Locks for SPSC scenarios | Lock-free SPSC queue |
| `shared_ptr` in hot paths | `unique_ptr` or raw (with care) |
| Ignoring branch prediction | Sort data, use branchless code |
| `std::map` for lookup | `std::unordered_map`, `flat_map`, or sorted vector |
| `-O0` in benchmarks | Always benchmark with `-O2` or `-O3` |
