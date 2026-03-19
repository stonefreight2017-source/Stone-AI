# C++ Modern Features (C++17/20/23)

> Palace Knowledge Seed — Software Engineering Breadth
> For: All 40 agents + Three Heads | Format: RAG-optimized chunks

---

## 1. Smart Pointers

### `unique_ptr` — Exclusive Ownership

```cpp
#include <memory>
#include <string>
#include <vector>

class Resource {
public:
    Resource(std::string name) : name_(std::move(name)) {
        std::cout << "Created: " << name_ << "\n";
    }
    ~Resource() {
        std::cout << "Destroyed: " << name_ << "\n";
    }
    void use() { std::cout << "Using: " << name_ << "\n"; }

private:
    std::string name_;
};

void example() {
    // Create with make_unique (C++14+) — exception-safe
    auto res = std::make_unique<Resource>("file_handle");
    res->use();

    // Transfer ownership
    auto res2 = std::move(res);
    // res is now nullptr
    assert(res == nullptr);

    // unique_ptr in containers
    std::vector<std::unique_ptr<Resource>> resources;
    resources.push_back(std::make_unique<Resource>("db_conn"));
    resources.push_back(std::make_unique<Resource>("cache"));

    // Custom deleter
    auto file_ptr = std::unique_ptr<FILE, decltype(&fclose)>(
        fopen("data.txt", "r"), &fclose
    );
} // All resources automatically freed in reverse order
```

### `shared_ptr` — Shared Ownership with Reference Counting

```cpp
void example() {
    auto shared = std::make_shared<Resource>("shared_data");
    // Reference count: 1

    {
        auto copy = shared; // Reference count: 2
        copy->use();
    } // copy destroyed, reference count: 1

    // Still alive — reference count > 0
    shared->use();
} // Reference count: 0, resource destroyed

// DANGER: Circular references cause memory leaks
struct Node {
    std::shared_ptr<Node> next; // Creates cycle if two nodes point to each other
};

// FIX: Use weak_ptr to break cycles
struct SafeNode {
    std::shared_ptr<SafeNode> next;
    std::weak_ptr<SafeNode> prev; // Doesn't count toward reference count
};
```

### `weak_ptr` — Non-Owning Observer

```cpp
void example() {
    std::weak_ptr<Resource> observer;

    {
        auto shared = std::make_shared<Resource>("temp");
        observer = shared; // Doesn't increase ref count

        if (auto locked = observer.lock()) {
            // locked is a shared_ptr — resource is alive
            locked->use();
        }
    } // shared destroyed — resource freed

    // observer is now expired
    assert(observer.expired());
    assert(observer.lock() == nullptr);
}
```

### Anti-Pattern: Raw `new` and `delete`

```cpp
// BAD — manual memory management
Resource* r = new Resource("bad");
// ... if exception thrown here, memory leaks
delete r;

// GOOD — RAII with smart pointers
auto r = std::make_unique<Resource>("good");
// Automatically freed even if exception thrown
```

---

## 2. RAII — Resource Acquisition Is Initialization

```cpp
// Lock guard — RAII for mutexes
class DatabaseConnection {
    std::mutex mtx_;
    std::vector<std::string> results_;

public:
    void query(const std::string& sql) {
        std::lock_guard<std::mutex> lock(mtx_); // Locked on construction
        results_.push_back(execute(sql));
    } // Unlocked on destruction — even if exception thrown

    // C++17: std::scoped_lock for multiple mutexes (deadlock-free)
    void transfer(DatabaseConnection& other) {
        std::scoped_lock lock(mtx_, other.mtx_); // Locks both atomically
        // ... transfer data
    }
};

// File RAII wrapper
class FileHandle {
    FILE* fp_;

public:
    explicit FileHandle(const char* path, const char* mode)
        : fp_(fopen(path, mode)) {
        if (!fp_) throw std::runtime_error("Failed to open file");
    }

    ~FileHandle() {
        if (fp_) fclose(fp_);
    }

    // Non-copyable
    FileHandle(const FileHandle&) = delete;
    FileHandle& operator=(const FileHandle&) = delete;

    // Movable
    FileHandle(FileHandle&& other) noexcept : fp_(other.fp_) {
        other.fp_ = nullptr;
    }
    FileHandle& operator=(FileHandle&& other) noexcept {
        if (this != &other) {
            if (fp_) fclose(fp_);
            fp_ = other.fp_;
            other.fp_ = nullptr;
        }
        return *this;
    }

    FILE* get() { return fp_; }
};
```

---

## 3. Move Semantics

```cpp
class Buffer {
    std::unique_ptr<char[]> data_;
    size_t size_;

public:
    Buffer(size_t size) : data_(std::make_unique<char[]>(size)), size_(size) {
        std::cout << "Allocated " << size_ << " bytes\n";
    }

    // Copy constructor — expensive
    Buffer(const Buffer& other) : data_(std::make_unique<char[]>(other.size_)), size_(other.size_) {
        std::memcpy(data_.get(), other.data_.get(), size_);
        std::cout << "Copied " << size_ << " bytes\n";
    }

    // Move constructor — cheap (steal resources)
    Buffer(Buffer&& other) noexcept : data_(std::move(other.data_)), size_(other.size_) {
        other.size_ = 0;
        std::cout << "Moved (zero-cost)\n";
    }

    // Move assignment
    Buffer& operator=(Buffer&& other) noexcept {
        if (this != &other) {
            data_ = std::move(other.data_);
            size_ = other.size_;
            other.size_ = 0;
        }
        return *this;
    }
};

// Perfect forwarding
template<typename T, typename... Args>
std::unique_ptr<T> make(Args&&... args) {
    return std::make_unique<T>(std::forward<Args>(args)...);
}

// std::move doesn't move — it CASTS to rvalue reference
// The actual move happens in the move constructor/assignment
Buffer a(1024);
Buffer b = std::move(a); // a is now in a valid but unspecified state
```

---

## 4. C++20 Concepts

Concepts replace SFINAE for constraining templates. Much cleaner error messages.

```cpp
#include <concepts>
#include <type_traits>

// Define a concept
template<typename T>
concept Numeric = std::is_arithmetic_v<T>;

template<typename T>
concept Printable = requires(T t, std::ostream& os) {
    { os << t } -> std::same_as<std::ostream&>;
};

template<typename T>
concept Container = requires(T t) {
    { t.begin() } -> std::input_or_output_iterator;
    { t.end() } -> std::input_or_output_iterator;
    { t.size() } -> std::convertible_to<std::size_t>;
};

template<typename T>
concept Hashable = requires(T t) {
    { std::hash<T>{}(t) } -> std::convertible_to<std::size_t>;
};

// Use concepts to constrain templates
template<Numeric T>
T add(T a, T b) {
    return a + b;
}

// Requires clause
template<typename T>
    requires Container<T> && Printable<typename T::value_type>
void print_all(const T& container) {
    for (const auto& item : container) {
        std::cout << item << " ";
    }
    std::cout << "\n";
}

// Concept in auto parameters (C++20 abbreviated templates)
void process(Container auto const& c) {
    for (const auto& item : c) {
        // ...
    }
}

// Combining concepts
template<typename T>
concept Serializable = Printable<T> && requires(T t) {
    { t.serialize() } -> std::convertible_to<std::string>;
    { T::deserialize(std::string{}) } -> std::same_as<T>;
};
```

---

## 5. C++20 Ranges

Ranges compose algorithms lazily — no intermediate containers.

```cpp
#include <ranges>
#include <vector>
#include <string>
#include <algorithm>

namespace rv = std::ranges::views;

void example() {
    std::vector<int> nums = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10};

    // Pipe syntax — lazy evaluation
    auto result = nums
        | rv::filter([](int n) { return n % 2 == 0; })  // Even only
        | rv::transform([](int n) { return n * n; })     // Square
        | rv::take(3);                                    // First 3

    for (int val : result) {
        std::cout << val << " ";  // 4 16 36
    }

    // Generate infinite sequences
    auto fibonacci = rv::iota(0)
        | rv::transform([a = 0, b = 1](int) mutable {
            int result = a;
            int next = a + b;
            a = b;
            b = next;
            return result;
        })
        | rv::take(10);

    // String processing
    std::string csv = "alice,bob,charlie,dave";
    for (auto word : csv | rv::split(',')) {
        std::string_view sv(word.begin(), word.end());
        std::cout << sv << "\n";
    }

    // Zip (C++23)
    std::vector<std::string> names = {"Alice", "Bob", "Charlie"};
    std::vector<int> ages = {30, 25, 35};

    for (auto [name, age] : rv::zip(names, ages)) {
        std::cout << name << " is " << age << "\n";
    }

    // Chunk and slide (C++23)
    auto chunks = nums | rv::chunk(3);    // [[1,2,3], [4,5,6], [7,8,9], [10]]
    auto windows = nums | rv::slide(3);   // [[1,2,3], [2,3,4], [3,4,5], ...]
}
```

---

## 6. Coroutines (C++20)

### Generator with `co_yield`

```cpp
#include <coroutine>
#include <iostream>
#include <optional>

// Minimal generator implementation
template<typename T>
class Generator {
public:
    struct promise_type {
        T current_value;

        Generator get_return_object() {
            return Generator{
                std::coroutine_handle<promise_type>::from_promise(*this)
            };
        }
        std::suspend_always initial_suspend() { return {}; }
        std::suspend_always final_suspend() noexcept { return {}; }
        std::suspend_always yield_value(T value) {
            current_value = std::move(value);
            return {};
        }
        void return_void() {}
        void unhandled_exception() { std::terminate(); }
    };

    using handle_type = std::coroutine_handle<promise_type>;

    explicit Generator(handle_type h) : handle_(h) {}
    ~Generator() { if (handle_) handle_.destroy(); }

    // Non-copyable, movable
    Generator(const Generator&) = delete;
    Generator(Generator&& other) noexcept : handle_(other.handle_) {
        other.handle_ = nullptr;
    }

    bool next() {
        handle_.resume();
        return !handle_.done();
    }

    T value() const { return handle_.promise().current_value; }

    // Range-based for loop support
    struct iterator {
        handle_type handle;
        bool done;

        iterator& operator++() {
            handle.resume();
            done = handle.done();
            return *this;
        }
        T operator*() const { return handle.promise().current_value; }
        bool operator!=(std::default_sentinel_t) const { return !done; }
    };

    iterator begin() {
        handle_.resume();
        return {handle_, handle_.done()};
    }
    std::default_sentinel_t end() { return {}; }

private:
    handle_type handle_;
};

// Usage — lazy sequence generation
Generator<int> range(int start, int end) {
    for (int i = start; i < end; ++i) {
        co_yield i;
    }
}

Generator<int> fibonacci() {
    int a = 0, b = 1;
    while (true) {
        co_yield a;
        int next = a + b;
        a = b;
        b = next;
    }
}

int main() {
    for (int val : range(0, 10)) {
        std::cout << val << " ";
    }

    auto fib = fibonacci();
    for (int i = 0; i < 15 && fib.next(); ++i) {
        std::cout << fib.value() << " ";
    }
}
```

---

## 7. `std::optional`, `std::variant`, `std::expected`

### `std::optional` — Nullable Values

```cpp
#include <optional>

std::optional<User> find_user(int id) {
    auto it = users.find(id);
    if (it != users.end()) {
        return it->second;
    }
    return std::nullopt; // No value
}

void example() {
    auto user = find_user(38);

    // Check and access
    if (user.has_value()) {
        std::cout << user->name << "\n";
    }

    // value_or — default if empty
    auto name = find_user(99)
        .transform([](const User& u) { return u.name; }) // C++23
        .value_or("Unknown");

    // Monadic operations (C++23)
    auto result = find_user(38)
        .and_then([](const User& u) -> std::optional<Address> {
            return u.address; // May also be optional
        })
        .transform([](const Address& a) {
            return a.city;
        })
        .value_or("Unknown City");
}
```

### `std::variant` — Type-Safe Union

```cpp
#include <variant>
#include <string>

using Value = std::variant<int, double, std::string, bool>;

// Visit pattern — exhaustive handling
struct ValuePrinter {
    void operator()(int v) const { std::cout << "int: " << v; }
    void operator()(double v) const { std::cout << "double: " << v; }
    void operator()(const std::string& v) const { std::cout << "string: " << v; }
    void operator()(bool v) const { std::cout << "bool: " << (v ? "true" : "false"); }
};

void example() {
    Value v = 42;
    std::visit(ValuePrinter{}, v);

    v = "hello";
    std::visit(ValuePrinter{}, v);

    // Lambda visitor (C++17)
    auto visitor = [](auto&& arg) {
        using T = std::decay_t<decltype(arg)>;
        if constexpr (std::is_same_v<T, int>) {
            std::cout << "int: " << arg;
        } else if constexpr (std::is_same_v<T, std::string>) {
            std::cout << "string: " << arg;
        }
    };
    std::visit(visitor, v);

    // Check current type
    if (std::holds_alternative<std::string>(v)) {
        auto& s = std::get<std::string>(v);
    }

    // Safe get with get_if
    if (auto* p = std::get_if<int>(&v)) {
        std::cout << "It's an int: " << *p;
    }
}
```

### `std::expected` (C++23) — Error Handling

```cpp
#include <expected>
#include <system_error>

enum class ParseError {
    InvalidFormat,
    OutOfRange,
    Empty,
};

std::expected<int, ParseError> parse_int(std::string_view sv) {
    if (sv.empty()) return std::unexpected(ParseError::Empty);

    int result = 0;
    for (char c : sv) {
        if (c < '0' || c > '9') {
            return std::unexpected(ParseError::InvalidFormat);
        }
        result = result * 10 + (c - '0');
    }
    return result;
}

void example() {
    auto result = parse_int("42");
    if (result) {
        std::cout << "Parsed: " << *result;
    } else {
        std::cout << "Error: " << static_cast<int>(result.error());
    }

    // Monadic operations
    auto final_value = parse_int("123")
        .transform([](int v) { return v * 2; })
        .and_then([](int v) -> std::expected<int, ParseError> {
            if (v > 1000) return std::unexpected(ParseError::OutOfRange);
            return v;
        })
        .value_or(-1);
}
```

---

## 8. Structured Bindings (C++17)

```cpp
#include <map>
#include <tuple>

// With tuples
auto get_user_info() {
    return std::tuple{42, std::string("Alice"), 30.5};
}

auto [id, name, score] = get_user_info();

// With maps
std::map<std::string, int> scores = {{"Alice", 95}, {"Bob", 87}};

for (const auto& [name, score] : scores) {
    std::cout << name << ": " << score << "\n";
}

// With insert results
auto [it, inserted] = scores.insert({"Charlie", 92});
if (inserted) {
    std::cout << "Inserted: " << it->first << "\n";
}

// With structs
struct Point { double x, y, z; };
Point p{1.0, 2.0, 3.0};
auto [x, y, z] = p;

// With arrays
int arr[] = {1, 2, 3};
auto [a, b, c] = arr;
```

---

## 9. `constexpr` and Compile-Time Computation

```cpp
// constexpr functions — evaluated at compile time when possible
constexpr int factorial(int n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

// Guaranteed compile-time evaluation
constexpr int fact10 = factorial(10); // Computed at compile time

// constexpr if — compile-time branching (C++17)
template<typename T>
auto stringify(T value) {
    if constexpr (std::is_same_v<T, std::string>) {
        return value; // No conversion needed
    } else if constexpr (std::is_arithmetic_v<T>) {
        return std::to_string(value);
    } else {
        static_assert(false, "Unsupported type");
    }
}

// consteval — MUST be evaluated at compile time (C++20)
consteval int compile_time_only(int n) {
    return n * n;
}

int x = compile_time_only(5);  // OK — compile time
// int y = compile_time_only(runtime_value);  // ERROR — must be compile time

// constexpr containers (C++20)
constexpr auto make_array() {
    std::array<int, 5> arr{};
    for (int i = 0; i < 5; ++i) {
        arr[i] = i * i;
    }
    return arr;
}
constexpr auto squares = make_array(); // {0, 1, 4, 9, 16} — compile time

// constexpr virtual functions (C++20)
struct Base {
    constexpr virtual int value() const = 0;
};

struct Derived : Base {
    constexpr int value() const override { return 42; }
};
```

---

## 10. Anti-Patterns Summary

| Anti-Pattern | Fix |
|---|---|
| Raw `new`/`delete` | `make_unique` / `make_shared` |
| `void*` for type erasure | `std::variant`, `std::any`, templates |
| C-style casts `(int)x` | `static_cast`, `dynamic_cast`, etc. |
| Manual resource cleanup | RAII — destructors handle cleanup |
| `#define` constants | `constexpr`, `const`, `inline` |
| Macro functions | Templates or `constexpr` functions |
| Raw arrays | `std::array`, `std::vector`, `std::span` |
| `NULL` | `nullptr` |
| Ignoring move semantics | Add move constructor/assignment for heap-owning types |
| `shared_ptr` by default | Use `unique_ptr` unless sharing is required |
| Circular `shared_ptr` refs | Use `weak_ptr` to break cycles |
| Exception specs `throw()` | Use `noexcept` |
