# Python Advanced Patterns

> Palace Knowledge Seed — Software Engineering Breadth
> For: All 40 agents + Three Heads | Format: RAG-optimized chunks

---

## 1. Decorators — Function Decorators

Decorators wrap functions to add behavior without modifying the original. Always use `functools.wraps` to preserve metadata.

```python
import functools
import time
from typing import Any, Callable, TypeVar

F = TypeVar("F", bound=Callable[..., Any])

def timer(func: F) -> F:
    """Measure execution time of a function."""
    @functools.wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        print(f"{func.__name__} took {elapsed:.4f}s")
        return result
    return wrapper  # type: ignore

@timer
def expensive_computation(n: int) -> int:
    return sum(i * i for i in range(n))
```

### Parameterized Decorators

When a decorator needs arguments, you need a decorator factory — a function that returns a decorator.

```python
def retry(max_attempts: int = 3, delay: float = 1.0, exceptions: tuple = (Exception,)):
    """Retry a function on failure with exponential backoff."""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            last_exception = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    last_exception = e
                    if attempt < max_attempts:
                        sleep_time = delay * (2 ** (attempt - 1))
                        time.sleep(sleep_time)
            raise last_exception  # type: ignore
        return wrapper
    return decorator

@retry(max_attempts=5, delay=0.5, exceptions=(ConnectionError, TimeoutError))
def fetch_data(url: str) -> dict:
    ...
```

### Anti-Pattern: Forgetting `functools.wraps`

```python
# BAD — loses function name, docstring, module
def bad_decorator(func):
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper

@bad_decorator
def my_func():
    """Important docstring."""
    pass

print(my_func.__name__)  # "wrapper" — WRONG
print(my_func.__doc__)   # None — WRONG
```

---

## 2. Class-Based Decorators

Use `__call__` to make instances callable. Useful when decorator needs state.

```python
class CountCalls:
    """Track how many times a function is called."""

    def __init__(self, func: Callable) -> None:
        functools.update_wrapper(self, func)
        self.func = func
        self.call_count = 0

    def __call__(self, *args: Any, **kwargs: Any) -> Any:
        self.call_count += 1
        print(f"{self.func.__name__} called {self.call_count} times")
        return self.func(*args, **kwargs)

@CountCalls
def process_item(item: str) -> str:
    return item.upper()

process_item("hello")
process_item("world")
print(process_item.call_count)  # 2
```

### Class Decorator with Parameters

```python
class RateLimit:
    """Enforce minimum interval between calls."""

    def __init__(self, min_interval: float = 1.0):
        self.min_interval = min_interval
        self.last_call = 0.0

    def __call__(self, func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            now = time.monotonic()
            elapsed = now - self.last_call
            if elapsed < self.min_interval:
                time.sleep(self.min_interval - elapsed)
            self.last_call = time.monotonic()
            return func(*args, **kwargs)
        return wrapper

@RateLimit(min_interval=0.5)
def api_call(endpoint: str) -> dict:
    ...
```

---

## 3. Metaclasses

Metaclasses control class creation. The metaclass's `__new__` or `__init__` runs when the class is defined, not when instances are created.

```python
class SingletonMeta(type):
    """Metaclass that enforces singleton pattern."""
    _instances: dict = {}

    def __call__(cls, *args: Any, **kwargs: Any) -> Any:
        if cls not in cls._instances:
            cls._instances[cls] = super().__call__(*args, **kwargs)
        return cls._instances[cls]

class DatabaseConnection(metaclass=SingletonMeta):
    def __init__(self, url: str = "localhost:5432"):
        self.url = url

# Same instance every time
db1 = DatabaseConnection("host1")
db2 = DatabaseConnection("host2")
assert db1 is db2  # True
```

### Registry Metaclass

```python
class PluginRegistry(type):
    """Auto-register all subclasses."""
    registry: dict[str, type] = {}

    def __new__(mcs, name: str, bases: tuple, namespace: dict) -> type:
        cls = super().__new__(mcs, name, bases, namespace)
        if bases:  # Don't register the base class itself
            mcs.registry[name.lower()] = cls
        return cls

class Plugin(metaclass=PluginRegistry):
    def execute(self) -> None:
        raise NotImplementedError

class CSVPlugin(Plugin):
    def execute(self) -> None:
        print("Processing CSV")

class JSONPlugin(Plugin):
    def execute(self) -> None:
        print("Processing JSON")

# Auto-discovered
print(PluginRegistry.registry)  # {'csvplugin': <class 'CSVPlugin'>, ...}
plugin = PluginRegistry.registry["csvplugin"]()
plugin.execute()
```

### When to Use Metaclasses vs Simpler Alternatives

- **`__init_subclass__`** (Python 3.6+): Preferred for most registration/validation. Simpler.
- **Class decorators**: Good for modifying a single class.
- **Metaclasses**: Only when you need deep control over class creation across an entire hierarchy.

```python
# PREFER this over metaclass for simple registration
class Plugin:
    _registry: dict[str, type] = {}

    def __init_subclass__(cls, **kwargs: Any) -> None:
        super().__init_subclass__(**kwargs)
        Plugin._registry[cls.__name__.lower()] = cls
```

---

## 4. Descriptors

Descriptors control attribute access via `__get__`, `__set__`, `__delete__`. They power `property`, `classmethod`, `staticmethod`.

```python
class Validated:
    """Descriptor that validates values on assignment."""

    def __init__(self, validator: Callable[[Any], bool], error_msg: str = "Invalid value"):
        self.validator = validator
        self.error_msg = error_msg

    def __set_name__(self, owner: type, name: str) -> None:
        self.public_name = name
        self.private_name = f"_{name}"

    def __get__(self, obj: Any, objtype: type | None = None) -> Any:
        if obj is None:
            return self
        return getattr(obj, self.private_name, None)

    def __set__(self, obj: Any, value: Any) -> None:
        if not self.validator(value):
            raise ValueError(f"{self.public_name}: {self.error_msg} (got {value!r})")
        setattr(obj, self.private_name, value)

class User:
    name = Validated(lambda v: isinstance(v, str) and len(v) > 0, "must be non-empty string")
    age = Validated(lambda v: isinstance(v, int) and 0 <= v <= 150, "must be int 0-150")
    email = Validated(lambda v: isinstance(v, str) and "@" in v, "must contain @")

    def __init__(self, name: str, age: int, email: str):
        self.name = name
        self.age = age
        self.email = email

user = User("Alice", 30, "alice@example.com")
# user.age = -1  # ValueError: age: must be int 0-150 (got -1)
```

---

## 5. Context Managers

### Using `__enter__`/`__exit__`

```python
import sqlite3

class DatabaseTransaction:
    """Context manager for database transactions with auto-rollback."""

    def __init__(self, db_path: str):
        self.db_path = db_path
        self.conn: sqlite3.Connection | None = None

    def __enter__(self) -> sqlite3.Cursor:
        self.conn = sqlite3.connect(self.db_path)
        return self.conn.cursor()

    def __exit__(self, exc_type, exc_val, exc_tb) -> bool:
        if self.conn:
            if exc_type is None:
                self.conn.commit()
            else:
                self.conn.rollback()
            self.conn.close()
        return False  # Don't suppress exceptions

with DatabaseTransaction("app.db") as cursor:
    cursor.execute("INSERT INTO users (name) VALUES (?)", ("Alice",))
```

### Using `contextlib.contextmanager`

```python
from contextlib import contextmanager
import os
import tempfile

@contextmanager
def temporary_directory():
    """Create a temp dir, yield it, clean up after."""
    tmpdir = tempfile.mkdtemp()
    try:
        yield tmpdir
    finally:
        import shutil
        shutil.rmtree(tmpdir, ignore_errors=True)

with temporary_directory() as d:
    filepath = os.path.join(d, "data.txt")
    with open(filepath, "w") as f:
        f.write("temporary data")
```

### Async Context Managers

```python
import aiohttp

class AsyncHTTPClient:
    def __init__(self, base_url: str):
        self.base_url = base_url
        self.session: aiohttp.ClientSession | None = None

    async def __aenter__(self) -> "AsyncHTTPClient":
        self.session = aiohttp.ClientSession(base_url=self.base_url)
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb) -> None:
        if self.session:
            await self.session.close()

    async def get(self, path: str) -> dict:
        assert self.session is not None
        async with self.session.get(path) as resp:
            return await resp.json()
```

---

## 6. Async/Await Deep Dive

### Event Loop Fundamentals

```python
import asyncio

async def fetch_page(url: str, delay: float) -> str:
    """Simulate an async HTTP fetch."""
    print(f"Fetching {url}...")
    await asyncio.sleep(delay)  # Non-blocking wait
    return f"Content from {url}"

async def main():
    # Run concurrently with gather
    results = await asyncio.gather(
        fetch_page("https://api.example.com/a", 2.0),
        fetch_page("https://api.example.com/b", 1.0),
        fetch_page("https://api.example.com/c", 3.0),
    )
    # Total time: ~3s (not 6s) because they run concurrently
    for r in results:
        print(r)

asyncio.run(main())
```

### TaskGroups (Python 3.11+)

```python
async def main():
    async with asyncio.TaskGroup() as tg:
        task1 = tg.create_task(fetch_page("url1", 1.0))
        task2 = tg.create_task(fetch_page("url2", 2.0))
    # All tasks complete or all cancelled on first exception
    print(task1.result(), task2.result())
```

### Async Generators

```python
async def async_range(start: int, stop: int, delay: float = 0.1):
    """Yield values with async delays between them."""
    for i in range(start, stop):
        await asyncio.sleep(delay)
        yield i

async def main():
    async for value in async_range(0, 10, 0.05):
        print(value)
```

### Anti-Pattern: Blocking the Event Loop

```python
# BAD — blocks the entire event loop
async def bad_example():
    time.sleep(5)  # NEVER do this in async code

# GOOD — use asyncio.sleep or run_in_executor
async def good_example():
    await asyncio.sleep(5)

# GOOD — for CPU-bound or blocking I/O
async def run_blocking():
    loop = asyncio.get_running_loop()
    result = await loop.run_in_executor(None, some_blocking_function)
```

---

## 7. Generators and Coroutines

### Generator Pipelines

```python
from typing import Generator, Iterator
import csv
import io

def read_lines(text: str) -> Generator[str, None, None]:
    for line in text.strip().split("\n"):
        yield line

def parse_csv(lines: Iterator[str]) -> Generator[dict, None, None]:
    reader = csv.DictReader(lines)
    for row in reader:
        yield row

def filter_active(rows: Iterator[dict]) -> Generator[dict, None, None]:
    for row in rows:
        if row.get("status") == "active":
            yield row

# Pipeline — memory efficient, processes one row at a time
data = "name,status\nAlice,active\nBob,inactive\nCharlie,active"
pipeline = filter_active(parse_csv(read_lines(data)))
for record in pipeline:
    print(record)
```

### `send()` — Two-Way Generators

```python
def running_average() -> Generator[float, float, None]:
    """Generator that receives values and yields running average."""
    total = 0.0
    count = 0
    while True:
        value = yield (total / count if count else 0.0)
        total += value
        count += 1

avg = running_average()
next(avg)           # Prime the generator
print(avg.send(10)) # 10.0
print(avg.send(20)) # 15.0
print(avg.send(30)) # 20.0
```

---

## 8. Dataclasses vs Pydantic

### Dataclasses — Lightweight, No Validation

```python
from dataclasses import dataclass, field
from datetime import datetime

@dataclass(frozen=True, slots=True)
class Event:
    name: str
    timestamp: datetime
    tags: list[str] = field(default_factory=list)
    _id: int = field(default=0, repr=False)

    def __post_init__(self):
        # Limited validation — manual
        if not self.name:
            raise ValueError("name cannot be empty")

event = Event(name="deploy", timestamp=datetime.now())
# event.name = "x"  # FrozenInstanceError — immutable
```

### Pydantic v2 — Full Validation, Serialization

```python
from pydantic import BaseModel, Field, field_validator, model_validator
from datetime import datetime

class Event(BaseModel):
    model_config = {"frozen": True, "str_strip_whitespace": True}

    name: str = Field(min_length=1, max_length=100)
    timestamp: datetime
    tags: list[str] = Field(default_factory=list)
    priority: int = Field(ge=1, le=5, default=3)

    @field_validator("tags")
    @classmethod
    def validate_tags(cls, v: list[str]) -> list[str]:
        return [tag.lower().strip() for tag in v if tag.strip()]

    @model_validator(mode="after")
    def check_urgent_has_tags(self) -> "Event":
        if self.priority == 5 and not self.tags:
            raise ValueError("Priority 5 events must have at least one tag")
        return self

# Auto-validates, auto-serializes
event = Event(name="deploy", timestamp="2025-01-01T00:00:00", tags=["  Prod  "])
print(event.model_dump_json())
```

### When to Use Which

| Feature | dataclass | Pydantic |
|---------|-----------|----------|
| Validation | Manual | Automatic |
| Serialization | Manual | Built-in |
| Performance | Faster creation | Faster validation |
| External data | No | Yes — JSON, dicts, forms |
| Internal models | Yes | Overkill |

---

## 9. Advanced Type Hints

### Protocol — Structural Subtyping (Duck Typing with Types)

```python
from typing import Protocol, runtime_checkable

@runtime_checkable
class Renderable(Protocol):
    def render(self) -> str: ...

class HTMLWidget:
    def render(self) -> str:
        return "<div>widget</div>"

class JSONResponse:
    def render(self) -> str:
        return '{"status": "ok"}'

def display(item: Renderable) -> None:
    print(item.render())

# Works — HTMLWidget has .render() -> str, so it satisfies Renderable
display(HTMLWidget())
display(JSONResponse())

# Runtime check works too
assert isinstance(HTMLWidget(), Renderable)
```

### TypeVar and Generic Classes

```python
from typing import TypeVar, Generic

T = TypeVar("T")
K = TypeVar("K")
V = TypeVar("V")

class Stack(Generic[T]):
    def __init__(self) -> None:
        self._items: list[T] = []

    def push(self, item: T) -> None:
        self._items.append(item)

    def pop(self) -> T:
        if not self._items:
            raise IndexError("Stack is empty")
        return self._items.pop()

    def peek(self) -> T:
        if not self._items:
            raise IndexError("Stack is empty")
        return self._items[-1]

stack: Stack[int] = Stack()
stack.push(38)
value: int = stack.pop()  # Type checker knows this is int
```

### ParamSpec — Preserving Function Signatures

```python
from typing import ParamSpec, TypeVar, Callable

P = ParamSpec("P")
R = TypeVar("R")

def log_call(func: Callable[P, R]) -> Callable[P, R]:
    """Decorator that preserves the exact signature of the wrapped function."""
    @functools.wraps(func)
    def wrapper(*args: P.args, **kwargs: P.kwargs) -> R:
        print(f"Calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@log_call
def add(a: int, b: int) -> int:
    return a + b

# Type checker sees add(a: int, b: int) -> int — signature preserved
result = add(1, 2)
```

### TypeGuard for Type Narrowing

```python
from typing import TypeGuard

def is_string_list(val: list[object]) -> TypeGuard[list[str]]:
    return all(isinstance(item, str) for item in val)

def process(data: list[object]) -> None:
    if is_string_list(data):
        # Type checker now knows data is list[str]
        print(", ".join(data))  # No type error
```

---

## 10. Anti-Patterns Summary

| Anti-Pattern | Fix |
|---|---|
| Mutable default args `def f(x=[])` | Use `None` + create inside |
| Bare `except:` | Catch specific exceptions |
| `type()` for checking | Use `isinstance()` |
| Global mutable state | Dependency injection or context |
| Deep inheritance trees | Composition + protocols |
| Ignoring `__slots__` | Add `slots=True` on dataclasses |
| String concatenation in loops | Use `"".join()` or f-strings |
| Not closing resources | Context managers (`with`) |
| `import *` | Explicit imports |
| Nested callbacks | async/await or generator pipelines |
