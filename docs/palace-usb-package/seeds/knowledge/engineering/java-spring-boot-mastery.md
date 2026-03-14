# Java Spring Boot Mastery

> Palace Knowledge Seed — Software Engineering Breadth
> For: All 44 agents + Three Heads | Format: RAG-optimized chunks

---

## 1. Dependency Injection

Spring's IoC container manages object creation and wiring.

```java
// Constructor injection — PREFERRED (immutable, testable)
@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    // Spring auto-injects all constructor params
    // @Autowired is optional on single-constructor classes (Spring 4.3+)
    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       EmailService emailService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
    }

    public User createUser(CreateUserRequest request) {
        String encoded = passwordEncoder.encode(request.password());
        User user = new User(request.name(), request.email(), encoded);
        User saved = userRepository.save(user);
        emailService.sendWelcome(saved.getEmail());
        return saved;
    }
}
```

### Configuration Classes

```java
@Configuration
public class AppConfig {

    @Bean
    public RestTemplate restTemplate(RestTemplateBuilder builder) {
        return builder
            .connectTimeout(Duration.ofSeconds(5))
            .readTimeout(Duration.ofSeconds(10))
            .build();
    }

    @Bean
    @Profile("production")
    public CacheManager cacheManager() {
        return new ConcurrentMapCacheManager("users", "sessions");
    }

    @Bean
    @ConditionalOnProperty(name = "features.audit", havingValue = "true")
    public AuditService auditService() {
        return new AuditServiceImpl();
    }
}
```

### Anti-Pattern: Field Injection

```java
// BAD — untestable, hides dependencies, allows circular deps
@Service
public class BadService {
    @Autowired
    private UserRepository userRepository; // Hidden dependency
    @Autowired
    private EmailService emailService;     // Can't see from outside
}

// Cannot create BadService without Spring — no constructor to call in tests
```

---

## 2. Aspect-Oriented Programming (AOP)

Cross-cutting concerns (logging, security, transactions) without polluting business logic.

```java
@Aspect
@Component
public class PerformanceAspect {

    private static final Logger log = LoggerFactory.getLogger(PerformanceAspect.class);

    // Pointcut: all public methods in service layer
    @Around("execution(* com.myapp.service..*(..))")
    public Object measurePerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        long start = System.nanoTime();
        String methodName = joinPoint.getSignature().toShortString();

        try {
            Object result = joinPoint.proceed();
            long elapsed = (System.nanoTime() - start) / 1_000_000;
            log.info("{} completed in {}ms", methodName, elapsed);
            return result;
        } catch (Exception e) {
            long elapsed = (System.nanoTime() - start) / 1_000_000;
            log.error("{} failed after {}ms: {}", methodName, elapsed, e.getMessage());
            throw e;
        }
    }
}

@Aspect
@Component
public class AuditAspect {

    @AfterReturning(
        pointcut = "@annotation(auditable)",
        returning = "result"
    )
    public void audit(JoinPoint joinPoint, Auditable auditable, Object result) {
        String action = auditable.action();
        String user = SecurityContextHolder.getContext()
            .getAuthentication().getName();
        log.info("AUDIT: {} performed {} -> {}", user, action, result);
    }
}

// Custom annotation
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface Auditable {
    String action();
}

// Usage
@Service
public class OrderService {
    @Auditable(action = "CREATE_ORDER")
    @Transactional
    public Order createOrder(OrderRequest request) {
        // Business logic — no audit code here
        return orderRepository.save(new Order(request));
    }
}
```

---

## 3. Spring Security — JWT + OAuth2

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/actuator/health").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((req, res, e) -> {
                    res.setStatus(401);
                    res.setContentType("application/json");
                    res.getWriter().write("{\"error\":\"Unauthorized\"}");
                })
            )
            .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}

// JWT Filter
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                     HttpServletResponse response,
                                     FilterChain chain)
            throws ServletException, IOException {

        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String token = header.substring(7);
        String username = jwtService.extractUsername(token);

        if (username != null &&
            SecurityContextHolder.getContext().getAuthentication() == null) {

            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (jwtService.isTokenValid(token, userDetails)) {
                var auth = new UsernamePasswordAuthenticationToken(
                    userDetails, null, userDetails.getAuthorities()
                );
                auth.setDetails(new WebAuthenticationDetailsSource()
                    .buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        chain.doFilter(request, response);
    }
}

// JWT Service
@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.expiration:86400000}") // 24 hours default
    private long expirationMs;

    public String generateToken(UserDetails userDetails) {
        return Jwts.builder()
            .subject(userDetails.getUsername())
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + expirationMs))
            .signWith(getSigningKey())
            .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secretKey));
    }
}
```

---

## 4. Reactive Streams with WebFlux

Non-blocking, event-driven programming for high-concurrency services.

```java
@RestController
@RequestMapping("/api/users")
public class UserReactiveController {

    private final UserReactiveService userService;

    @GetMapping
    public Flux<User> getAllUsers() {
        return userService.findAll()
            .delayElements(Duration.ofMillis(10)); // Backpressure-aware
    }

    @GetMapping("/{id}")
    public Mono<ResponseEntity<User>> getUser(@PathVariable String id) {
        return userService.findById(id)
            .map(ResponseEntity::ok)
            .defaultIfEmpty(ResponseEntity.notFound().build());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<User> createUser(@Valid @RequestBody Mono<CreateUserRequest> request) {
        return request.flatMap(userService::create);
    }

    // Server-Sent Events streaming
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<User> streamUsers() {
        return userService.streamUpdates()
            .doOnCancel(() -> log.info("Client disconnected"));
    }
}

@Service
public class UserReactiveService {

    private final ReactiveMongoRepository<User, String> repository;
    private final WebClient webClient;

    public Mono<User> create(CreateUserRequest request) {
        return Mono.just(request)
            .map(this::toEntity)
            .flatMap(repository::save)
            .flatMap(user ->
                sendWelcomeEmail(user.getEmail())
                    .thenReturn(user)
            )
            .doOnSuccess(u -> log.info("Created user: {}", u.getId()))
            .doOnError(e -> log.error("Failed to create user", e));
    }

    // Combine multiple async calls
    public Mono<UserProfile> getFullProfile(String userId) {
        Mono<User> user = repository.findById(userId);
        Mono<List<Order>> orders = webClient.get()
            .uri("/api/orders?userId={id}", userId)
            .retrieve()
            .bodyToFlux(Order.class)
            .collectList();
        Mono<CreditScore> credit = getCreditScore(userId);

        return Mono.zip(user, orders, credit)
            .map(tuple -> new UserProfile(
                tuple.getT1(), tuple.getT2(), tuple.getT3()
            ));
    }
}
```

---

## 5. JPA/Hibernate — N+1 Problem and Solutions

### The N+1 Problem

```java
@Entity
public class Author {
    @Id @GeneratedValue
    private Long id;
    private String name;

    @OneToMany(mappedBy = "author", fetch = FetchType.LAZY)
    private List<Book> books; // LAZY by default — loaded on access
}

// N+1 Problem:
// Query 1: SELECT * FROM author          → N authors
// Query 2..N+1: SELECT * FROM book WHERE author_id = ?  → one per author

List<Author> authors = authorRepository.findAll(); // 1 query
for (Author a : authors) {
    a.getBooks().size(); // N additional queries!
}
```

### Fix 1: JOIN FETCH (JPQL)

```java
public interface AuthorRepository extends JpaRepository<Author, Long> {

    @Query("SELECT DISTINCT a FROM Author a JOIN FETCH a.books")
    List<Author> findAllWithBooks(); // 1 query with JOIN
}
```

### Fix 2: @EntityGraph

```java
public interface AuthorRepository extends JpaRepository<Author, Long> {

    @EntityGraph(attributePaths = {"books"})
    @Override
    List<Author> findAll(); // Adds JOIN automatically
}
```

### Fix 3: Batch Fetching

```java
@Entity
public class Author {
    @OneToMany(mappedBy = "author")
    @BatchSize(size = 25) // Load books in batches of 25 authors
    private List<Book> books;
}
// Instead of N queries, uses ceil(N/25) queries
```

### Fix 4: Projections (Return Only What You Need)

```java
// Interface projection — Spring generates implementation
public interface AuthorSummary {
    String getName();
    int getBookCount();
}

public interface AuthorRepository extends JpaRepository<Author, Long> {

    @Query("SELECT a.name AS name, SIZE(a.books) AS bookCount FROM Author a")
    List<AuthorSummary> findAllSummaries(); // No entity loading at all

    // DTO projection — even more control
    @Query("SELECT new com.myapp.dto.AuthorDTO(a.id, a.name, COUNT(b)) " +
           "FROM Author a LEFT JOIN a.books b GROUP BY a.id, a.name")
    List<AuthorDTO> findAllDTOs();
}
```

---

## 6. Spring Boot 3 Features

```java
// Records as configuration properties
@ConfigurationProperties(prefix = "app")
public record AppProperties(
    String name,
    int maxRetries,
    Duration timeout,
    SecurityProperties security
) {
    public record SecurityProperties(
        String jwtSecret,
        Duration tokenExpiration
    ) {}
}

// application.yml
// app:
//   name: MyApp
//   max-retries: 3
//   timeout: 30s
//   security:
//     jwt-secret: ${JWT_SECRET}
//     token-expiration: 24h

// Problem Details (RFC 7807) for error responses
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(UserNotFoundException.class)
    public ProblemDetail handleNotFound(UserNotFoundException ex) {
        ProblemDetail detail = ProblemDetail.forStatusAndDetail(
            HttpStatus.NOT_FOUND, ex.getMessage()
        );
        detail.setTitle("User Not Found");
        detail.setProperty("userId", ex.getUserId());
        detail.setProperty("timestamp", Instant.now());
        return detail;
    }
}

// HTTP Interfaces (declarative HTTP client, Spring 6.1+)
public interface UserClient {

    @GetExchange("/api/users/{id}")
    User getUser(@PathVariable String id);

    @PostExchange("/api/users")
    User createUser(@RequestBody CreateUserRequest request);
}

@Configuration
public class ClientConfig {
    @Bean
    public UserClient userClient(RestClient.Builder builder) {
        RestClient restClient = builder
            .baseUrl("https://api.example.com")
            .build();
        return HttpServiceProxyFactory
            .builderFor(RestClientAdapter.create(restClient))
            .build()
            .createClient(UserClient.class);
    }
}
```

---

## 7. GraalVM Native Image

Compile Spring Boot to native binary — instant startup, low memory.

```xml
<!-- pom.xml -->
<build>
    <plugins>
        <plugin>
            <groupId>org.graalvm.buildtools</groupId>
            <artifactId>native-maven-plugin</artifactId>
        </plugin>
    </plugins>
</build>
```

```bash
# Build native image
mvn -Pnative native:compile

# Result: standalone binary, no JVM needed
# Startup: ~50ms (vs ~2s for JVM)
# Memory: ~50MB (vs ~200MB for JVM)
```

### Runtime Hints for Reflection

```java
// GraalVM needs to know about reflection at build time
@RegisterReflectionForBinding({User.class, Order.class})
@Configuration
public class NativeConfig {
}

// Or implement RuntimeHintsRegistrar
public class MyHints implements RuntimeHintsRegistrar {
    @Override
    public void registerHints(RuntimeHints hints, ClassLoader classLoader) {
        hints.reflection()
            .registerType(User.class, MemberCategory.values());
        hints.resources()
            .registerPattern("templates/*.html");
    }
}
```

---

## 8. Testing Patterns

```java
// Unit test with mocks
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock EmailService emailService;
    @InjectMocks UserService userService;

    @Test
    void createUser_savesAndSendsEmail() {
        var request = new CreateUserRequest("Alice", "alice@test.com", "pass123");
        when(passwordEncoder.encode("pass123")).thenReturn("encoded");
        when(userRepository.save(any())).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });

        User result = userService.createUser(request);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getName()).isEqualTo("Alice");
        verify(emailService).sendWelcome("alice@test.com");
        verify(userRepository).save(argThat(u ->
            u.getPassword().equals("encoded")
        ));
    }
}

// Integration test with test containers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
class UserIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired TestRestTemplate restTemplate;

    @Test
    void createAndGetUser() {
        var request = new CreateUserRequest("Bob", "bob@test.com", "pass");

        ResponseEntity<User> createResponse = restTemplate.postForEntity(
            "/api/users", request, User.class
        );

        assertThat(createResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        Long userId = createResponse.getBody().getId();

        ResponseEntity<User> getResponse = restTemplate.getForEntity(
            "/api/users/{id}", User.class, userId
        );

        assertThat(getResponse.getBody().getName()).isEqualTo("Bob");
    }
}
```

---

## 9. Anti-Patterns Summary

| Anti-Pattern | Fix |
|---|---|
| Field injection (`@Autowired` on fields) | Constructor injection |
| FetchType.EAGER on collections | LAZY + JOIN FETCH when needed |
| Catching `Exception` broadly | Catch specific exceptions |
| `@Transactional` on private methods | Must be on public methods (proxy-based AOP) |
| Business logic in controllers | Service layer handles logic |
| Not using projections | DTOs/projections for read queries |
| Missing `@Transactional(readOnly=true)` | Add for read-only operations (perf boost) |
| Hardcoded config values | `@ConfigurationProperties` or `@Value` |
| No connection pool tuning | Configure HikariCP (`maximumPoolSize`, etc.) |
| Testing with `@SpringBootTest` for unit tests | Use `@MockitoExtension` — faster, isolated |
