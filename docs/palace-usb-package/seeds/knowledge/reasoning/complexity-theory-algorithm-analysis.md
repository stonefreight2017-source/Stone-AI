# Complexity Theory & Algorithm Analysis

## Purpose
Every engineering decision has a complexity tradeoff. Choosing between a hash map and a sorted array, deciding whether to precompute or compute on-the-fly, selecting an index type for pgvector — all require understanding algorithmic complexity. This seed covers Big-O analysis, P vs NP, amortized analysis, space-time tradeoffs, and practical applications to database query optimization and system design.

---

## Big-O Notation

### What It Means
Big-O describes how an algorithm's runtime (or space) grows as input size grows. It captures the WORST CASE and ignores constants and lower-order terms.

```
O(1)       → Constant     : Hash table lookup
O(log n)   → Logarithmic  : Binary search
O(n)       → Linear       : Scanning an array
O(n log n) → Linearithmic : Good sorting (merge sort, quicksort avg)
O(n²)      → Quadratic    : Nested loops, naive string matching
O(n³)      → Cubic        : Matrix multiplication (naive)
O(2^n)     → Exponential  : Brute-force subset enumeration
O(n!)      → Factorial    : Brute-force permutations
```

### Practical Impact (n = 1,000,000)

```python
import math

n = 1_000_000

complexities = {
    "O(1)": 1,
    "O(log n)": math.log2(n),
    "O(n)": n,
    "O(n log n)": n * math.log2(n),
    "O(n²)": n ** 2,
    "O(n³)": n ** 3,
    "O(2^n)": "∞ (heat death of universe)",
}

print(f"For n = {n:,}:")
for name, ops in complexities.items():
    if isinstance(ops, str):
        print(f"  {name:12} → {ops}")
    elif ops < 1e9:
        print(f"  {name:12} → {ops:,.0f} operations")
    else:
        print(f"  {name:12} → {ops:.2e} operations")

# At 1 billion ops/second:
# O(n log n) → ~0.02 seconds
# O(n²)     → ~11.6 DAYS
# O(n³)     → ~31,710 YEARS
```

### Analyzing Code Complexity

```python
# O(1) — Constant
def hash_lookup(dictionary, key):
    return dictionary.get(key)  # Hash table: O(1) average

# O(log n) — Logarithmic
def binary_search(sorted_array, target):
    left, right = 0, len(sorted_array) - 1
    while left <= right:                      # Halving search space each time
        mid = (left + right) // 2
        if sorted_array[mid] == target:
            return mid
        elif sorted_array[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    return -1

# O(n) — Linear
def linear_search(array, target):
    for i, item in enumerate(array):          # Touch each element once
        if item == target:
            return i
    return -1

# O(n log n) — Linearithmic
def merge_sort(array):
    if len(array) <= 1:
        return array
    mid = len(array) // 2
    left = merge_sort(array[:mid])            # log n levels of recursion
    right = merge_sort(array[mid:])           # n work at each level
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result

# O(n²) — Quadratic
def all_pairs_similarity(embeddings):
    n = len(embeddings)
    similarities = []
    for i in range(n):                        # n iterations
        for j in range(i + 1, n):             # n iterations (nested)
            sim = cosine_similarity(embeddings[i], embeddings[j])
            similarities.append((i, j, sim))
    return similarities

# O(2^n) — Exponential
def all_subsets(items):
    if len(items) == 0:
        return [[]]
    rest = all_subsets(items[1:])              # 2^n subsets total
    return rest + [[items[0]] + s for s in rest]
```

### Common Traps

```python
# TRAP 1: Hidden O(n) in O(1)-looking code
my_list = [1, 2, 3, ..., 1000000]
5 in my_list        # O(n)! List membership is linear
5 in my_set         # O(1) — set membership is constant

# TRAP 2: String concatenation in a loop
result = ""
for item in items:
    result += str(item)  # O(n²) total! Each += copies the entire string
# Fix: use ''.join() — O(n) total
result = ''.join(str(item) for item in items)

# TRAP 3: Nested database queries (N+1 problem)
# O(n) queries when O(1) is possible
for user in users:                    # n iterations
    orders = db.query(                # 1 query each = n queries total
        "SELECT * FROM orders WHERE user_id = %s", user.id
    )
# Fix: batch query
all_orders = db.query(
    "SELECT * FROM orders WHERE user_id = ANY(%s)",
    [u.id for u in users]
)  # 1 query total
```

---

## Space Complexity

### Memory Matters Too

```python
# O(1) space — in-place
def reverse_array_inplace(arr):
    left, right = 0, len(arr) - 1
    while left < right:
        arr[left], arr[right] = arr[right], arr[left]
        left += 1
        right -= 1
    # No extra space needed (just two pointers)

# O(n) space — creates new structure
def reverse_array_copy(arr):
    return arr[::-1]  # New array of size n

# O(n²) space — adjacency matrix
def create_adjacency_matrix(n):
    return [[0] * n for _ in range(n)]  # n² entries

# Space-time tradeoff example:
# Fibonacci with O(1) space, O(n) time
def fib_iterative(n):
    if n <= 1: return n
    a, b = 0, 1
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b

# Fibonacci with O(n) space, O(n) time (memoization)
def fib_memo(n, cache={}):
    if n in cache: return cache[n]
    if n <= 1: return n
    cache[n] = fib_memo(n-1) + fib_memo(n-2)
    return cache[n]
```

---

## Space-Time Tradeoffs in Practice

### The Core Decision Matrix

| Situation | Trade Space for Time | Trade Time for Space |
|---|---|---|
| Lookup table / cache | Store precomputed results | Compute on every request |
| Database index | Extra disk space, faster queries | No index, slower queries |
| Embedding storage | Store full vectors (fast search) | Compress/quantize (slower search) |
| Inverted index | Store word→doc mapping | Scan all docs for each query |
| Materialized view | Store precomputed query results | Run query each time |

### Caching as a Space-Time Tradeoff

```python
# Without cache: O(expensive) per call, O(1) space
def compute_embedding_no_cache(text, model):
    return model.encode(text)  # 50-100ms per call

# With cache: O(1) per cached call, O(n*d) space
# n = number of cached items, d = embedding dimensions
class EmbeddingCacheExample:
    def __init__(self, model, max_cache=100000):
        self.cache = {}
        self.model = model
        self.max_cache = max_cache

    def get_embedding(self, text):
        if text in self.cache:
            return self.cache[text]  # O(1) lookup

        embedding = self.model.encode(text)  # Expensive
        if len(self.cache) < self.max_cache:
            self.cache[text] = embedding  # Store for later

        return embedding

# Space cost: 100,000 items * 1536 floats * 4 bytes = ~585 MB
# Time savings: eliminate 99% of embedding computations (for repeated queries)
```

---

## Amortized Analysis

### What It Is
Some operations are expensive sometimes but cheap most of the time. Amortized analysis averages the cost over a sequence of operations.

### Classic Example: Dynamic Array

```python
class DynamicArray:
    """
    Append is O(1) AMORTIZED even though individual appends can be O(n).

    When the array is full, we double its size (O(n) copy).
    But this doubling happens at positions 1, 2, 4, 8, 16, ...
    Total cost for n inserts: n + n/2 + n/4 + n/8 + ... ≈ 2n = O(n)
    Amortized cost per insert: O(n)/n = O(1)
    """
    def __init__(self):
        self.data = [None] * 4  # Initial capacity
        self.size = 0
        self.capacity = 4

    def append(self, item):
        if self.size == self.capacity:
            # Double the array — O(n) operation
            new_data = [None] * (self.capacity * 2)
            for i in range(self.size):
                new_data[i] = self.data[i]
            self.data = new_data
            self.capacity *= 2

        self.data[self.size] = item
        self.size += 1

# Python lists already do this! list.append() is O(1) amortized.
```

### Amortized Analysis for Semantic Cache

```python
# Cache cleanup is O(n) but runs infrequently
class AmortizedCache:
    def __init__(self, max_size=10000, cleanup_threshold=0.9):
        self.cache = {}
        self.max_size = max_size
        self.cleanup_threshold = cleanup_threshold
        self.access_count = {}

    def get(self, key):
        """O(1) — always fast"""
        if key in self.cache:
            self.access_count[key] = self.access_count.get(key, 0) + 1
            return self.cache[key]
        return None

    def put(self, key, value):
        """O(1) amortized — occasionally O(n) for cleanup"""
        if len(self.cache) >= self.max_size * self.cleanup_threshold:
            self._cleanup()  # O(n log n) but happens rarely

        self.cache[key] = value
        self.access_count[key] = 0

    def _cleanup(self):
        """Remove least-accessed entries. O(n log n) from sorting."""
        sorted_keys = sorted(
            self.access_count.keys(),
            key=lambda k: self.access_count[k]
        )
        # Remove bottom 25%
        remove_count = len(sorted_keys) // 4
        for key in sorted_keys[:remove_count]:
            del self.cache[key]
            del self.access_count[key]
```

---

## P vs NP (Simplified)

### The Key Distinction
- **P**: Problems solvable in polynomial time (O(n^k) for some constant k). We can FIND the answer efficiently.
- **NP**: Problems where we can VERIFY a given answer in polynomial time, but finding it might be exponential.
- **NP-Complete**: The hardest problems in NP. If you can solve any one of them in polynomial time, you can solve ALL of them.

### Why It Matters for Engineering

```python
# P problem: Sorting — O(n log n)
# We can always find the sorted order efficiently
sorted_data = sorted(data)  # Done

# NP-Complete problem: Optimal subset selection
# "Find the subset of RAG chunks that maximizes coverage while minimizing tokens"
# This is a variant of the knapsack problem (NP-Complete)

# In practice, we use APPROXIMATIONS for NP-hard problems:

# Greedy approximation for set cover (chunk selection)
def greedy_chunk_selection(chunks, query_aspects, max_tokens):
    """
    Select chunks that cover the most query aspects within token budget.
    Greedy: pick the chunk that covers the most uncovered aspects each step.
    Not optimal, but O(n * m) instead of O(2^n).
    """
    selected = []
    covered = set()
    remaining_tokens = max_tokens

    while remaining_tokens > 0:
        best_chunk = None
        best_new_coverage = 0

        for chunk in chunks:
            if chunk in selected:
                continue
            if chunk['tokens'] > remaining_tokens:
                continue

            new_coverage = len(chunk['aspects'] - covered)
            if new_coverage > best_new_coverage:
                best_new_coverage = new_coverage
                best_chunk = chunk

        if best_chunk is None or best_new_coverage == 0:
            break

        selected.append(best_chunk)
        covered |= best_chunk['aspects']
        remaining_tokens -= best_chunk['tokens']

    return selected
```

---

## Database Query Optimization

### Index Complexity

```python
# Understanding database index costs
index_complexities = {
    "No index (sequential scan)": {
        "search": "O(n)",
        "insert": "O(1)",
        "space": "O(0)",
        "when": "Small tables (<1000 rows), full table scans needed",
    },
    "B-Tree index": {
        "search": "O(log n)",
        "insert": "O(log n)",
        "space": "O(n)",
        "when": "Equality and range queries, ordered data",
    },
    "Hash index": {
        "search": "O(1) average",
        "insert": "O(1) average",
        "space": "O(n)",
        "when": "Equality queries only, no range support",
    },
    "GIN index (full-text)": {
        "search": "O(log n) per term",
        "insert": "O(n) for update",
        "space": "O(n * terms)",
        "when": "Full-text search, JSONB containment",
    },
    "HNSW (pgvector)": {
        "search": "O(log n) approximate",
        "insert": "O(log n)",
        "space": "O(n * m) where m = connections per node",
        "when": "Vector similarity search, ANN queries",
    },
    "IVFFlat (pgvector)": {
        "search": "O(n/lists * probes)",
        "insert": "O(1) but periodic O(n) rebuild",
        "space": "O(n)",
        "when": "Vector search, lower memory than HNSW",
    },
}
```

### Query Plan Analysis

```python
# PostgreSQL EXPLAIN output interpretation
query_plan_guide = {
    "Seq Scan": {
        "complexity": "O(n)",
        "meaning": "Reading every row — no index used",
        "action": "Add an index if this table is large",
    },
    "Index Scan": {
        "complexity": "O(log n + k) where k = matching rows",
        "meaning": "Using B-tree index efficiently",
        "action": "Good — this is what you want",
    },
    "Index Only Scan": {
        "complexity": "O(log n)",
        "meaning": "All needed data is in the index (covering index)",
        "action": "Best possible — no table access needed",
    },
    "Bitmap Index Scan": {
        "complexity": "O(log n + k)",
        "meaning": "Index builds a bitmap, then scans matching rows",
        "action": "Good for large result sets",
    },
    "Nested Loop": {
        "complexity": "O(n * m) worst case",
        "meaning": "For each row in outer, scan inner",
        "action": "OK for small inner tables, bad for large ones",
    },
    "Hash Join": {
        "complexity": "O(n + m)",
        "meaning": "Build hash table of smaller table, probe with larger",
        "action": "Good — linear in both table sizes",
    },
    "Sort": {
        "complexity": "O(n log n)",
        "meaning": "Sorting results (ORDER BY, DISTINCT, merge join)",
        "action": "Can be avoided with sorted index",
    },
}
```

---

## Practical Complexity Decision Guide

| Problem | Naive | Optimized | How |
|---|---|---|---|
| Find duplicate embeddings | O(n^2) pairwise | O(n log n) sort + scan | Sort by first component, compare neighbors |
| k-nearest neighbors | O(n) per query | O(log n) per query | HNSW index |
| Full-text search | O(n * |query|) | O(|query| * log n) | Inverted index (GIN) |
| Batch deduplication | O(n^2) | O(n) | Hash-based deduplication |
| Graph shortest path | O(V^2) Dijkstra | O(E log V) with heap | Priority queue Dijkstra |
| Matrix multiplication | O(n^3) | O(n^2.37) Strassen | Not worth it until n > 1000 |
| Regex matching | O(2^m) backtracking | O(n * m) NFA | Avoid catastrophic backtracking |

---

## Anti-Patterns

| Anti-Pattern | Complexity Impact | Fix |
|---|---|---|
| List instead of set for membership | O(n) per check instead of O(1) | Use sets for membership tests |
| String concatenation in loop | O(n^2) total | Use array + join |
| N+1 database queries | O(n) queries | Batch query with IN/ANY |
| Sorting then taking top-k | O(n log n) | Use heap: O(n log k) |
| Recomputing unchanged values | O(expensive) repeatedly | Cache/memoize |
| No index on WHERE/JOIN columns | O(n) per query | Add appropriate index |
| Exponential regex patterns | O(2^n) backtracking | Rewrite regex or use NFA-based engine |

---

## Key Takeaways

- Big-O tells you how your system scales. An O(n^2) algorithm on 1000 items might be fine, but on 1,000,000 items it's fatal.
- Constants matter in practice — O(n) with a constant of 100 is slower than O(n log n) with a constant of 1 for reasonable n.
- Space-time tradeoffs are the core engineering decision: caching, indexing, and precomputation all trade space for time.
- NP-hard problems (optimal subset selection, graph coloring) need approximation algorithms — don't try to solve them exactly.
- Database index choice directly determines query complexity: B-tree for range, hash for equality, HNSW for vectors.
- Amortized analysis explains why dynamic arrays and caches work — expensive operations are rare enough to average out.
- Always profile before optimizing — the bottleneck is often not where you think it is.
