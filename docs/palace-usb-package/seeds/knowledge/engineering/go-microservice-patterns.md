# Go Microservice Patterns

> Palace Knowledge Seed — Software Engineering Breadth
> For: All 44 agents + Three Heads | Format: RAG-optimized chunks

---

## 1. HTTP Servers with `net/http`

Go's standard library is production-ready for HTTP services.

```go
package main

import (
    "context"
    "encoding/json"
    "fmt"
    "log/slog"
    "net/http"
    "os"
    "os/signal"
    "syscall"
    "time"
)

type APIResponse struct {
    Data    any    `json:"data,omitempty"`
    Error   string `json:"error,omitempty"`
    TraceID string `json:"trace_id,omitempty"`
}

func writeJSON(w http.ResponseWriter, status int, data any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    json.NewEncoder(w).Encode(data)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
    writeJSON(w, http.StatusOK, APIResponse{
        Data: map[string]string{
            "status": "healthy",
            "time":   time.Now().UTC().Format(time.RFC3339),
        },
    })
}

func usersHandler(w http.ResponseWriter, r *http.Request) {
    switch r.Method {
    case http.MethodGet:
        users := []map[string]any{
            {"id": 1, "name": "Alice"},
            {"id": 2, "name": "Bob"},
        }
        writeJSON(w, http.StatusOK, APIResponse{Data: users})

    case http.MethodPost:
        var input struct {
            Name  string `json:"name"`
            Email string `json:"email"`
        }
        if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
            writeJSON(w, http.StatusBadRequest, APIResponse{Error: "invalid JSON"})
            return
        }
        if input.Name == "" {
            writeJSON(w, http.StatusBadRequest, APIResponse{Error: "name required"})
            return
        }
        writeJSON(w, http.StatusCreated, APIResponse{Data: input})

    default:
        http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
    }
}

func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/health", healthHandler)
    mux.HandleFunc("/api/users", usersHandler)

    server := &http.Server{
        Addr:         ":8080",
        Handler:      mux,
        ReadTimeout:  10 * time.Second,
        WriteTimeout: 30 * time.Second,
        IdleTimeout:  60 * time.Second,
    }

    // Start server in goroutine
    go func() {
        slog.Info("Server starting", "addr", server.Addr)
        if err := server.ListenAndServe(); err != http.ErrServerClosed {
            slog.Error("Server failed", "error", err)
            os.Exit(1)
        }
    }()

    // Wait for interrupt
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
    <-quit

    // Graceful shutdown
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()
    if err := server.Shutdown(ctx); err != nil {
        slog.Error("Shutdown failed", "error", err)
    }
    slog.Info("Server stopped")
}
```

---

## 2. Router with Chi

Chi is a lightweight, idiomatic router that composes with `net/http`.

```go
import (
    "github.com/go-chi/chi/v5"
    "github.com/go-chi/chi/v5/middleware"
)

func NewRouter(userService *UserService) http.Handler {
    r := chi.NewRouter()

    // Built-in middleware
    r.Use(middleware.RequestID)
    r.Use(middleware.RealIP)
    r.Use(middleware.Logger)
    r.Use(middleware.Recoverer)
    r.Use(middleware.Timeout(30 * time.Second))
    r.Use(middleware.Compress(5))

    // Custom middleware
    r.Use(corsMiddleware)

    // Health check — no auth needed
    r.Get("/health", healthHandler)

    // API routes
    r.Route("/api/v1", func(r chi.Router) {
        // Public routes
        r.Post("/auth/login", loginHandler)
        r.Post("/auth/register", registerHandler)

        // Protected routes
        r.Group(func(r chi.Router) {
            r.Use(authMiddleware)

            r.Route("/users", func(r chi.Router) {
                r.Get("/", userService.List)
                r.Post("/", userService.Create)

                r.Route("/{userID}", func(r chi.Router) {
                    r.Use(userCtx) // Load user into context
                    r.Get("/", userService.Get)
                    r.Put("/", userService.Update)
                    r.Delete("/", userService.Delete)
                })
            })
        })
    })

    return r
}

// Extract URL parameter
func (s *UserService) Get(w http.ResponseWriter, r *http.Request) {
    userID := chi.URLParam(r, "userID")
    // Or from context if loaded by middleware:
    user := r.Context().Value(userCtxKey).(*User)
    writeJSON(w, http.StatusOK, user)
}
```

---

## 3. Middleware Chains

```go
// Middleware signature: func(next http.Handler) http.Handler

// Logging middleware
func loggingMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()

        // Wrap ResponseWriter to capture status code
        wrapped := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

        next.ServeHTTP(wrapped, r)

        slog.Info("request",
            "method", r.Method,
            "path", r.URL.Path,
            "status", wrapped.statusCode,
            "duration", time.Since(start),
            "ip", r.RemoteAddr,
        )
    })
}

type responseWriter struct {
    http.ResponseWriter
    statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
    rw.statusCode = code
    rw.ResponseWriter.WriteHeader(code)
}

// Auth middleware
func authMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        token := r.Header.Get("Authorization")
        if token == "" {
            writeJSON(w, http.StatusUnauthorized, APIResponse{Error: "missing token"})
            return
        }

        claims, err := validateJWT(token)
        if err != nil {
            writeJSON(w, http.StatusUnauthorized, APIResponse{Error: "invalid token"})
            return
        }

        // Add claims to context
        ctx := context.WithValue(r.Context(), claimsKey, claims)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// Rate limiting middleware
func rateLimitMiddleware(rps int) func(http.Handler) http.Handler {
    limiter := rate.NewLimiter(rate.Limit(rps), rps*2)
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            if !limiter.Allow() {
                writeJSON(w, http.StatusTooManyRequests, APIResponse{Error: "rate limited"})
                return
            }
            next.ServeHTTP(w, r)
        })
    }
}

// CORS middleware
func corsMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Access-Control-Allow-Origin", "*")
        w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

        if r.Method == http.MethodOptions {
            w.WriteHeader(http.StatusNoContent)
            return
        }
        next.ServeHTTP(w, r)
    })
}
```

---

## 4. gRPC with Protobuf

```protobuf
// proto/user.proto
syntax = "proto3";
package user;
option go_package = "myapp/proto/user";

service UserService {
    rpc GetUser(GetUserRequest) returns (GetUserResponse);
    rpc ListUsers(ListUsersRequest) returns (ListUsersResponse);
    rpc CreateUser(CreateUserRequest) returns (CreateUserResponse);
    rpc StreamUpdates(StreamRequest) returns (stream UserUpdate);
}

message GetUserRequest {
    int64 id = 1;
}

message GetUserResponse {
    User user = 1;
}

message User {
    int64 id = 1;
    string name = 2;
    string email = 3;
    string created_at = 4;
}

message ListUsersRequest {
    int32 page_size = 1;
    string page_token = 2;
}

message ListUsersResponse {
    repeated User users = 1;
    string next_page_token = 2;
}

message CreateUserRequest {
    string name = 1;
    string email = 2;
}

message CreateUserResponse {
    User user = 1;
}

message StreamRequest {}
message UserUpdate {
    string action = 1;
    User user = 2;
}
```

### gRPC Server Implementation

```go
import (
    "google.golang.org/grpc"
    "google.golang.org/grpc/codes"
    "google.golang.org/grpc/status"
    pb "myapp/proto/user"
)

type userServer struct {
    pb.UnimplementedUserServiceServer
    store UserStore
}

func (s *userServer) GetUser(ctx context.Context, req *pb.GetUserRequest) (*pb.GetUserResponse, error) {
    if req.Id <= 0 {
        return nil, status.Error(codes.InvalidArgument, "id must be positive")
    }

    user, err := s.store.Get(ctx, req.Id)
    if err != nil {
        if errors.Is(err, ErrNotFound) {
            return nil, status.Errorf(codes.NotFound, "user %d not found", req.Id)
        }
        return nil, status.Error(codes.Internal, "internal error")
    }

    return &pb.GetUserResponse{
        User: &pb.User{
            Id:    user.ID,
            Name:  user.Name,
            Email: user.Email,
        },
    }, nil
}

// Server-side streaming
func (s *userServer) StreamUpdates(req *pb.StreamRequest, stream pb.UserService_StreamUpdatesServer) error {
    updates := s.store.Subscribe()
    defer s.store.Unsubscribe(updates)

    for {
        select {
        case update := <-updates:
            if err := stream.Send(&pb.UserUpdate{
                Action: update.Action,
                User:   userToProto(update.User),
            }); err != nil {
                return err
            }
        case <-stream.Context().Done():
            return nil
        }
    }
}

func main() {
    lis, err := net.Listen("tcp", ":50051")
    if err != nil {
        log.Fatalf("failed to listen: %v", err)
    }

    s := grpc.NewServer(
        grpc.UnaryInterceptor(loggingInterceptor),
        grpc.StreamInterceptor(streamLoggingInterceptor),
    )
    pb.RegisterUserServiceServer(s, &userServer{store: NewUserStore()})

    slog.Info("gRPC server starting", "addr", ":50051")
    if err := s.Serve(lis); err != nil {
        log.Fatalf("failed to serve: %v", err)
    }
}
```

---

## 5. Graceful Shutdown Pattern

```go
func main() {
    // Initialize dependencies
    db, err := sql.Open("postgres", os.Getenv("DATABASE_URL"))
    if err != nil {
        slog.Error("Failed to connect to database", "error", err)
        os.Exit(1)
    }

    cache := redis.NewClient(&redis.Options{
        Addr: os.Getenv("REDIS_URL"),
    })

    // Build application
    app := NewApp(db, cache)
    httpServer := &http.Server{
        Addr:    ":8080",
        Handler: app.Router(),
    }

    // Start servers
    errCh := make(chan error, 1)
    go func() {
        if err := httpServer.ListenAndServe(); err != http.ErrServerClosed {
            errCh <- err
        }
    }()

    // Wait for signal
    quit := make(chan os.Signal, 1)
    signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

    select {
    case err := <-errCh:
        slog.Error("Server error", "error", err)
    case sig := <-quit:
        slog.Info("Shutting down", "signal", sig)
    }

    // Graceful shutdown — order matters
    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    // 1. Stop accepting new requests
    if err := httpServer.Shutdown(ctx); err != nil {
        slog.Error("HTTP shutdown error", "error", err)
    }

    // 2. Close cache connections
    if err := cache.Close(); err != nil {
        slog.Error("Redis close error", "error", err)
    }

    // 3. Close database last
    if err := db.Close(); err != nil {
        slog.Error("Database close error", "error", err)
    }

    slog.Info("Shutdown complete")
}
```

---

## 6. Health Checks

```go
type HealthChecker struct {
    checks map[string]func(context.Context) error
}

func NewHealthChecker() *HealthChecker {
    return &HealthChecker{
        checks: make(map[string]func(context.Context) error),
    }
}

func (h *HealthChecker) AddCheck(name string, check func(context.Context) error) {
    h.checks[name] = check
}

func (h *HealthChecker) Handler() http.HandlerFunc {
    return func(w http.ResponseWriter, r *http.Request) {
        ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
        defer cancel()

        status := "healthy"
        httpStatus := http.StatusOK
        results := make(map[string]string)

        for name, check := range h.checks {
            if err := check(ctx); err != nil {
                status = "unhealthy"
                httpStatus = http.StatusServiceUnavailable
                results[name] = fmt.Sprintf("FAIL: %v", err)
            } else {
                results[name] = "OK"
            }
        }

        writeJSON(w, httpStatus, map[string]any{
            "status":  status,
            "checks":  results,
            "version": BuildVersion,
        })
    }
}

// Usage
func main() {
    health := NewHealthChecker()

    health.AddCheck("database", func(ctx context.Context) error {
        return db.PingContext(ctx)
    })

    health.AddCheck("redis", func(ctx context.Context) error {
        return cache.Ping(ctx).Err()
    })

    health.AddCheck("disk", func(ctx context.Context) error {
        var stat syscall.Statfs_t
        if err := syscall.Statfs("/", &stat); err != nil {
            return err
        }
        freePercent := float64(stat.Bavail) / float64(stat.Blocks) * 100
        if freePercent < 10 {
            return fmt.Errorf("disk space low: %.1f%% free", freePercent)
        }
        return nil
    })

    mux.HandleFunc("/health", health.Handler())
    mux.HandleFunc("/health/live", func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        w.Write([]byte("OK"))
    })
}
```

---

## 7. Structured Logging with slog

```go
import "log/slog"

func setupLogger(env string) *slog.Logger {
    var handler slog.Handler

    switch env {
    case "production":
        handler = slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
            Level:     slog.LevelInfo,
            AddSource: true,
        })
    default:
        handler = slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{
            Level: slog.LevelDebug,
        })
    }

    logger := slog.New(handler)
    slog.SetDefault(logger)
    return logger
}

// Usage throughout the app
func processOrder(ctx context.Context, orderID string) error {
    logger := slog.With(
        "order_id", orderID,
        "trace_id", getTraceID(ctx),
    )

    logger.Info("Processing order")

    if err := validateOrder(orderID); err != nil {
        logger.Error("Order validation failed",
            "error", err,
            "step", "validation",
        )
        return err
    }

    logger.Info("Order processed successfully",
        "duration_ms", time.Since(start).Milliseconds(),
    )
    return nil
}

// Middleware that adds request context to logger
func loggerMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        logger := slog.With(
            "method", r.Method,
            "path", r.URL.Path,
            "remote_addr", r.RemoteAddr,
            "request_id", middleware.GetReqID(r.Context()),
        )
        ctx := context.WithValue(r.Context(), loggerKey, logger)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}
```

---

## 8. Dependency Injection

Go uses constructor injection — pass dependencies as function/struct parameters.

```go
// Repository interface
type UserRepository interface {
    Get(ctx context.Context, id int64) (*User, error)
    List(ctx context.Context, limit, offset int) ([]*User, error)
    Create(ctx context.Context, user *User) error
    Update(ctx context.Context, user *User) error
    Delete(ctx context.Context, id int64) error
}

// PostgreSQL implementation
type postgresUserRepo struct {
    db *sql.DB
}

func NewPostgresUserRepo(db *sql.DB) UserRepository {
    return &postgresUserRepo{db: db}
}

func (r *postgresUserRepo) Get(ctx context.Context, id int64) (*User, error) {
    var u User
    err := r.db.QueryRowContext(ctx,
        "SELECT id, name, email, created_at FROM users WHERE id = $1", id,
    ).Scan(&u.ID, &u.Name, &u.Email, &u.CreatedAt)
    if err == sql.ErrNoRows {
        return nil, ErrNotFound
    }
    return &u, err
}

// Service layer
type UserService struct {
    repo   UserRepository
    cache  CacheService
    logger *slog.Logger
}

func NewUserService(repo UserRepository, cache CacheService, logger *slog.Logger) *UserService {
    return &UserService{
        repo:   repo,
        cache:  cache,
        logger: logger,
    }
}

// Wire it all together in main
func main() {
    logger := setupLogger(os.Getenv("ENV"))
    db := setupDB()
    cache := setupRedis()

    userRepo := NewPostgresUserRepo(db)
    cacheService := NewRedisCacheService(cache)
    userService := NewUserService(userRepo, cacheService, logger)
    userHandler := NewUserHandler(userService)

    r := chi.NewRouter()
    r.Route("/api/users", userHandler.Routes)
}
```

---

## 9. Testing Patterns

```go
import "testing"

// Table-driven tests
func TestValidateEmail(t *testing.T) {
    tests := []struct {
        name  string
        email string
        valid bool
    }{
        {"valid email", "alice@example.com", true},
        {"no at sign", "alice.example.com", false},
        {"no domain", "alice@", false},
        {"empty", "", false},
        {"unicode", "alice@examplé.com", true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got := ValidateEmail(tt.email)
            if got != tt.valid {
                t.Errorf("ValidateEmail(%q) = %v, want %v", tt.email, got, tt.valid)
            }
        })
    }
}

// Mock for testing
type mockUserRepo struct {
    users map[int64]*User
}

func newMockUserRepo() *mockUserRepo {
    return &mockUserRepo{users: make(map[int64]*User)}
}

func (m *mockUserRepo) Get(ctx context.Context, id int64) (*User, error) {
    u, ok := m.users[id]
    if !ok {
        return nil, ErrNotFound
    }
    return u, nil
}

func (m *mockUserRepo) Create(ctx context.Context, user *User) error {
    m.users[user.ID] = user
    return nil
}

// Integration test with test server
func TestGetUserEndpoint(t *testing.T) {
    repo := newMockUserRepo()
    repo.users[1] = &User{ID: 1, Name: "Alice", Email: "alice@test.com"}

    svc := NewUserService(repo, newMockCache(), slog.Default())
    handler := NewUserHandler(svc)

    r := chi.NewRouter()
    r.Route("/api/users", handler.Routes)

    ts := httptest.NewServer(r)
    defer ts.Close()

    resp, err := http.Get(ts.URL + "/api/users/1")
    if err != nil {
        t.Fatal(err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        t.Errorf("expected 200, got %d", resp.StatusCode)
    }

    var result APIResponse
    json.NewDecoder(resp.Body).Decode(&result)
    // Assert on result...
}

// Parallel tests
func TestConcurrentAccess(t *testing.T) {
    t.Parallel() // Run concurrently with other parallel tests

    // Subtests can also be parallel
    for i := 0; i < 10; i++ {
        t.Run(fmt.Sprintf("worker-%d", i), func(t *testing.T) {
            t.Parallel()
            // Each subtest runs concurrently
        })
    }
}
```

---

## 10. Anti-Patterns Summary

| Anti-Pattern | Fix |
|---|---|
| No request timeouts | Always set `ReadTimeout`, `WriteTimeout` |
| Panic in handlers | Use recovery middleware |
| Global state / init() | Constructor injection |
| No graceful shutdown | Signal handling + `server.Shutdown()` |
| fmt.Println for logging | Use `slog` structured logging |
| Concrete types in signatures | Use interfaces for testability |
| No health checks | Add `/health`, `/health/live`, `/health/ready` |
| Ignoring context cancellation | Check `ctx.Done()` in long operations |
| No request ID tracking | Add request ID middleware |
| Monolithic main() | Break into `NewRouter()`, `NewApp()`, etc. |
