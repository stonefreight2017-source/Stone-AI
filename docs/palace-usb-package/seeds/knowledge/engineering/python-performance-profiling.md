# Python Performance & Profiling

> Palace Knowledge Seed — Software Engineering Breadth
> For: All 40 agents + Three Heads | Format: RAG-optimized chunks

---

## 1. cProfile — Function-Level Profiling

cProfile is built into Python. Zero install. Measures call counts and cumulative time per function.

```python
import cProfile
import pstats
from io import StringIO

def fibonacci(n: int) -> int:
    if n < 2:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Option 1: Profile from command line
# python -m cProfile -s cumtime my_script.py

# Option 2: Profile programmatically
profiler = cProfile.Profile()
profiler.enable()
result = fibonacci(30)
profiler.disable()

# Print sorted by cumulative time
stats = pstats.Stats(profiler, stream=StringIO())
stats.sort_stats('cumulative')
stats.print_stats(20)  # Top 20 functions
print(stats.stream.getvalue())

# Option 3: Context manager pattern
from contextlib import contextmanager

@contextmanager
def profile_block(sort_by: str = 'cumulative', limit: int = 20):
    profiler = cProfile.Profile()
    profiler.enable()
    try:
        yield profiler
    finally:
        profiler.disable()
        stats = pstats.Stats(profiler)
        stats.sort_stats(sort_by)
        stats.print_stats(limit)

with profile_block():
    result = fibonacci(25)
```

### Reading cProfile Output

```
   ncalls  tottime  percall  cumtime  percall filename:lineno(function)
  2692537    0.893    0.000    0.893    0.000 script.py:5(fibonacci)
        1    0.000    0.000    0.893    0.893 script.py:1(<module>)
```

- **ncalls**: Number of calls (including recursive)
- **tottime**: Time spent in this function only (excluding sub-calls)
- **cumtime**: Time including all sub-calls
- High ncalls + low tottime per call = potential for caching
- High tottime = optimization target

---

## 2. line_profiler — Line-by-Line Profiling

```bash
pip install line_profiler
```

```python
# Decorate functions to profile with @profile
# Then run: kernprof -l -v my_script.py

@profile  # type: ignore  # Added by kernprof
def process_data(data: list[dict]) -> list[dict]:
    results = []                              # line 1
    for item in data:                         # line 2 — how many iterations?
        cleaned = clean_text(item['text'])    # line 3 — slow?
        features = extract_features(cleaned)  # line 4 — slow?
        score = compute_score(features)       # line 5
        results.append({**item, 'score': score})  # line 6
    return sorted(results, key=lambda x: x['score'])  # line 7

# Output shows time per line:
# Line #  Hits    Time   Per Hit  % Time  Line Contents
#      3  10000   5.2s   0.5ms    52.0%   cleaned = clean_text(item['text'])
#      4  10000   3.1s   0.3ms    31.0%   features = extract_features(cleaned)
#      7      1   1.2s   1.2s     12.0%   return sorted(results, ...)
```

### Programmatic line_profiler Usage

```python
from line_profiler import LineProfiler

def target_function(n: int) -> int:
    total = 0
    for i in range(n):
        total += i * i
    return total

lp = LineProfiler()
lp.add_function(target_function)
lp.enable_by_count()

target_function(1_000_000)

lp.disable_by_count()
lp.print_stats()
```

---

## 3. memory_profiler — Memory Usage Tracking

```bash
pip install memory_profiler
```

```python
# Run: python -m memory_profiler my_script.py

from memory_profiler import profile

@profile
def create_large_structures():
    # This line allocates ~76 MB (10M floats * 8 bytes)
    big_list = [float(i) for i in range(10_000_000)]

    # This converts to set — additional ~200 MB
    big_set = set(big_list)

    # Delete list — frees ~76 MB
    del big_list

    return len(big_set)

# Output:
# Line #    Mem usage    Increment   Line Contents
#     5     50.0 MiB     0.0 MiB    big_list = [float(i)...]
#     5    126.0 MiB    76.0 MiB    (after completion)
#     8    326.0 MiB   200.0 MiB    big_set = set(big_list)
#    11    250.0 MiB   -76.0 MiB    del big_list
```

### Tracking Memory Over Time

```python
from memory_profiler import memory_usage

def my_function():
    data = list(range(1_000_000))
    return sum(data)

# Sample memory every 0.1 seconds
mem_usage = memory_usage(my_function, interval=0.1, max_usage=True)
print(f"Peak memory: {mem_usage} MiB")
```

---

## 4. Benchmarking Methodology

### Using `timeit` Correctly

```python
import timeit

# WRONG — single run is meaningless
import time
start = time.time()
result = my_function()
print(f"Took {time.time() - start:.4f}s")  # Noise dominates

# RIGHT — multiple runs, statistical analysis
# From command line:
# python -m timeit -n 1000 -r 5 "sum(range(10000))"

# Programmatic:
times = timeit.repeat(
    stmt="sum(range(10000))",
    number=1000,   # executions per trial
    repeat=5,      # number of trials
)
best = min(times) / 1000  # Best trial, per execution
print(f"Best: {best*1e6:.1f} µs")

# With setup code
times = timeit.repeat(
    setup="import numpy as np; a = np.random.randn(10000)",
    stmt="np.sort(a.copy())",
    number=100,
    repeat=5,
)
```

### `perf_counter_ns` for Manual Benchmarks

```python
import time
import statistics

def benchmark(func, *args, iterations=100, warmup=10, **kwargs):
    """Proper benchmarking with warmup and statistics."""
    # Warmup — JIT, cache warming
    for _ in range(warmup):
        func(*args, **kwargs)

    times = []
    for _ in range(iterations):
        start = time.perf_counter_ns()
        func(*args, **kwargs)
        elapsed = time.perf_counter_ns() - start
        times.append(elapsed)

    return {
        'mean_ns': statistics.mean(times),
        'median_ns': statistics.median(times),
        'stdev_ns': statistics.stdev(times),
        'min_ns': min(times),
        'p95_ns': sorted(times)[int(0.95 * len(times))],
    }

result = benchmark(sorted, list(range(10000, 0, -1)), iterations=200)
print(f"Mean: {result['mean_ns']/1e6:.2f} ms")
print(f"P95:  {result['p95_ns']/1e6:.2f} ms")
```

---

## 5. Multiprocessing vs Threading vs Asyncio

### When to Use What

| Workload | Solution | Why |
|----------|----------|-----|
| CPU-bound (math, compression) | `multiprocessing` | Bypasses GIL |
| I/O-bound, many connections | `asyncio` | Single thread, no overhead |
| I/O-bound, blocking libraries | `threading` | Simple, works with blocking I/O |
| CPU + I/O mixed | `multiprocessing` + `asyncio` | Process pool for CPU, async for I/O |

### Multiprocessing — CPU-Bound Work

```python
from multiprocessing import Pool
from concurrent.futures import ProcessPoolExecutor
import os

def cpu_heavy(n: int) -> int:
    """Simulate CPU work."""
    return sum(i * i for i in range(n))

# Using Pool
with Pool(processes=os.cpu_count()) as pool:
    results = pool.map(cpu_heavy, [10_000_000] * 8)

# Using ProcessPoolExecutor (higher-level API)
with ProcessPoolExecutor(max_workers=os.cpu_count()) as executor:
    futures = [executor.submit(cpu_heavy, 10_000_000) for _ in range(8)]
    results = [f.result() for f in futures]

# With progress tracking
from concurrent.futures import as_completed

with ProcessPoolExecutor() as executor:
    futures = {executor.submit(cpu_heavy, n): n for n in range(1_000_000, 10_000_001, 1_000_000)}
    for future in as_completed(futures):
        n = futures[future]
        print(f"n={n}: result={future.result()}")
```

### Threading — I/O-Bound Work

```python
from concurrent.futures import ThreadPoolExecutor
import urllib.request

urls = [f"https://httpbin.org/delay/{i}" for i in range(1, 6)]

def fetch(url: str) -> tuple[str, int]:
    with urllib.request.urlopen(url, timeout=10) as resp:
        return url, resp.status

# Sequential: ~15s
# Threaded: ~5s (limited by slowest request)
with ThreadPoolExecutor(max_workers=10) as executor:
    results = list(executor.map(fetch, urls))
```

### Asyncio — High-Concurrency I/O

```python
import asyncio
import aiohttp

async def fetch_all(urls: list[str]) -> list[str]:
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_one(session, url) for url in urls]
        return await asyncio.gather(*tasks)

async def fetch_one(session: aiohttp.ClientSession, url: str) -> str:
    async with session.get(url) as resp:
        return await resp.text()

# Can handle 1000s of concurrent connections on a single thread
results = asyncio.run(fetch_all(urls))
```

---

## 6. The GIL and Workarounds

The Global Interpreter Lock (GIL) prevents multiple threads from executing Python bytecode simultaneously. One thread holds the GIL at a time.

### GIL Impact

```python
import threading
import time

counter = 0

def increment(n: int):
    global counter
    for _ in range(n):
        counter += 1  # NOT thread-safe — race condition

# This is both slow AND incorrect
threads = [threading.Thread(target=increment, args=(1_000_000,)) for _ in range(4)]
for t in threads:
    t.start()
for t in threads:
    t.join()
print(counter)  # Less than 4_000_000 — race condition!
```

### GIL Workarounds

```python
# 1. multiprocessing — separate processes, separate GILs
from multiprocessing import Pool
# Each process has its own GIL

# 2. C extensions release the GIL
# NumPy, Pandas, scikit-learn release GIL during computation
# → threading works fine for NumPy-heavy code

# 3. ctypes/cffi — call C code that releases the GIL
import ctypes
lib = ctypes.CDLL("./mylib.so")
# C code runs without GIL

# 4. Subinterpreters (Python 3.12+) — experimental
# Each subinterpreter has its own GIL

# 5. Free-threaded Python (3.13+ experimental)
# python3.13t — builds without GIL
# pip install --config-settings=setup-args=-Dgil=disabled ...
```

---

## 7. Cython Basics

Cython compiles Python-like code to C for 10-100x speedups on CPU-bound code.

```python
# fibonacci.pyx — Cython source file
# cython: language_level=3

def fib_python(int n):
    """Still uses Python objects — minimal speedup."""
    if n < 2:
        return n
    return fib_python(n - 1) + fib_python(n - 2)

cpdef long fib_cython(int n):
    """C types + cpdef = callable from Python AND C. 50-100x faster."""
    if n < 2:
        return n
    return fib_cython(n - 1) + fib_cython(n - 2)

# Typed memoryviews for NumPy arrays
import numpy as np
cimport numpy as cnp

def compute_distances(double[:, :] points):
    """Typed memoryview — direct C-level array access."""
    cdef int n = points.shape[0]
    cdef double[:, :] result = np.zeros((n, n))
    cdef int i, j
    cdef double dx, dy, dist

    for i in range(n):
        for j in range(i + 1, n):
            dx = points[i, 0] - points[j, 0]
            dy = points[i, 1] - points[j, 1]
            dist = (dx * dx + dy * dy) ** 0.5
            result[i, j] = dist
            result[j, i] = dist
    return np.asarray(result)
```

### setup.py for Cython

```python
from setuptools import setup
from Cython.Build import cythonize
import numpy as np

setup(
    ext_modules=cythonize("fibonacci.pyx"),
    include_dirs=[np.get_include()],
)
# Build: python setup.py build_ext --inplace
```

---

## 8. Numba JIT — Zero-Effort Speedup

Numba JIT-compiles Python functions to machine code using LLVM. Best for numeric code.

```python
from numba import njit, prange
import numpy as np

@njit
def mandelbrot_pixel(c_real: float, c_imag: float, max_iter: int) -> int:
    z_real, z_imag = 0.0, 0.0
    for i in range(max_iter):
        z_real_new = z_real * z_real - z_imag * z_imag + c_real
        z_imag = 2 * z_real * z_imag + c_imag
        z_real = z_real_new
        if z_real * z_real + z_imag * z_imag > 4.0:
            return i
    return max_iter

@njit(parallel=True)
def mandelbrot(width: int, height: int, max_iter: int = 100) -> np.ndarray:
    """Parallel Mandelbrot set computation."""
    result = np.zeros((height, width), dtype=np.int32)
    for j in prange(height):  # prange = parallel range
        for i in range(width):
            c_real = (i - width / 2) * 4.0 / width
            c_imag = (j - height / 2) * 4.0 / height
            result[j, i] = mandelbrot_pixel(c_real, c_imag, max_iter)
    return result

# First call compiles (~1s). Subsequent calls are fast.
img = mandelbrot(2000, 2000, 200)  # ~100x faster than pure Python
```

### Numba Limitations

```python
# WORKS with Numba:
# - NumPy arrays, scalars, tuples
# - Basic math, loops, conditionals
# - NumPy functions (most)

# DOES NOT WORK with Numba:
# - Dictionaries (limited support with numba.typed.Dict)
# - Sets, strings (limited)
# - Classes (use @jitclass for limited support)
# - Pandas DataFrames
# - Third-party libraries inside @njit

# Fallback: use @njit with cache=True to avoid recompilation
@njit(cache=True)
def cached_func(x):
    return x * 2 + 1
```

---

## 9. PyPy — Drop-In JIT Replacement

PyPy is an alternative Python interpreter with a built-in JIT compiler. Pure Python code runs 5-20x faster.

```bash
# Install PyPy
# Download from pypy.org or use conda
conda install -c conda-forge pypy3.10

# Run your script with PyPy instead of CPython
pypy3 my_script.py
```

### When PyPy Helps

| Scenario | Speedup |
|----------|---------|
| Tight loops with Python objects | 10-20x |
| String processing | 5-10x |
| Dictionary-heavy code | 5-15x |
| NumPy-heavy code | 0.5-1x (no benefit, may be slower) |
| C extensions | 0x (not compatible) |

### PyPy Best Practices

```python
# PyPy is best for:
# - Pure Python code with lots of loops
# - Web servers (Tornado, Twisted work great on PyPy)
# - Parsing, text processing
# - Algorithmic code

# PyPy is bad for:
# - NumPy/SciPy heavy workloads (use CPython)
# - Code that relies on C extensions (many don't work)
# - Short-lived scripts (JIT warmup cost)
```

---

## 10. Profiling Decision Tree

```
Is it slow?
├── Measure first (don't guess)
│   ├── cProfile → find which FUNCTIONS are slow
│   └── line_profiler → find which LINES are slow
│
├── Is it CPU-bound?
│   ├── Can you vectorize with NumPy? → DO IT (10-100x)
│   ├── Pure numeric loops? → Numba @njit (10-100x)
│   ├── Complex logic? → Cython (10-50x)
│   ├── Embarrassingly parallel? → multiprocessing (Nx for N cores)
│   └── Entire application? → Try PyPy (5-20x)
│
├── Is it I/O-bound?
│   ├── Many concurrent connections? → asyncio
│   ├── Few blocking calls? → threading
│   └── Mixed CPU + I/O? → Process pool + async
│
├── Is it memory-bound?
│   ├── memory_profiler → find where memory grows
│   ├── Use generators instead of lists
│   ├── Use __slots__ on classes
│   ├── Use numpy arrays instead of Python lists
│   └── Process in chunks (pandas chunksize, etc.)
│
└── Algorithm-bound?
    ├── Check Big-O complexity
    ├── Use better data structures (dict/set for lookups)
    └── Cache repeated computations (functools.lru_cache)
```

---

## 11. Quick Optimization Wins

```python
# 1. lru_cache for expensive pure functions
from functools import lru_cache

@lru_cache(maxsize=1024)
def expensive_lookup(key: str) -> dict:
    return database.query(key)

# 2. __slots__ for memory reduction on many instances
class Point:
    __slots__ = ('x', 'y', 'z')
    def __init__(self, x: float, y: float, z: float):
        self.x, self.y, self.z = x, y, z
# 40-50% less memory per instance vs regular class

# 3. Local variable access is faster than global
def fast_loop():
    local_range = range  # Cache builtin lookup
    local_len = len
    result = []
    append = result.append  # Cache method lookup
    for i in local_range(1_000_000):
        append(i * i)
    return result

# 4. Use collections.deque for FIFO queues
from collections import deque
q = deque(maxlen=1000)  # O(1) append and popleft
# list.pop(0) is O(n)!

# 5. str.join() instead of concatenation
# BAD — O(n²) string copying
result = ""
for s in strings:
    result += s

# GOOD — O(n)
result = "".join(strings)

# 6. dict.get() with default instead of try/except
value = my_dict.get('key', default_value)  # Faster than try/except

# 7. Set operations for membership testing
allowed = {'admin', 'editor', 'viewer'}  # O(1) lookup
if role in allowed:  # Fast
    pass
# vs
allowed_list = ['admin', 'editor', 'viewer']  # O(n) lookup
if role in allowed_list:  # Slow for large lists
    pass
```

---

## 12. Anti-Patterns in Performance Work

| Anti-Pattern | Fix |
|---|---|
| Optimizing before profiling | ALWAYS profile first |
| Premature micro-optimization | Focus on algorithmic complexity |
| Ignoring warmup in benchmarks | Warmup JIT, caches, OS scheduler |
| Single-run timing | Use `timeit` with multiple runs |
| Optimizing cold path code | Focus on hot paths (80/20 rule) |
| Using threading for CPU work | Use multiprocessing |
| `global` for shared state | Use queues or shared memory |
| Profiling in production | Use sampling profilers (py-spy) |
| Not checking algorithm complexity | O(n) vs O(n²) matters more than micro-opts |
| Loading all data into memory | Stream/chunk process large datasets |
