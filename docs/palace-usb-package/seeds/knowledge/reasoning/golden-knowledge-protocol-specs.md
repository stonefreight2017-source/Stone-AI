# K-3: Golden Knowledge — Protocol Specifications
# Full specification reference seeds for standards agents need
# Palace USB Package — Golden Seed

---

## PURPOSE
Agents frequently need to reference protocol specs, standards, and rules.
Embedding these as lookup tables eliminates hallucination on well-defined specs.
Each section is structured for single-hop retrieval.

---

## 1. OWASP TOP 10 (2021) — QUICK REFERENCE

| Rank | ID | Name | Description | Prevention |
|------|-----|------|-------------|------------|
| A01 | Broken Access Control | Users act outside intended permissions | Deny by default, enforce ownership checks, CORS, disable directory listing |
| A02 | Cryptographic Failures | Sensitive data exposed via weak/missing crypto | TLS everywhere, AES-256-GCM at rest, bcrypt/argon2 for passwords, no sensitive data in URLs |
| A03 | Injection | Untrusted data sent to interpreter | Parameterized queries, ORMs, input validation, Zod .strict() |
| A04 | Insecure Design | Missing/ineffective security controls by design | Threat modeling, secure design patterns, paved road methodology |
| A05 | Security Misconfiguration | Default configs, incomplete setup, verbose errors | Hardened defaults, minimal platform, disable unused features, CSP headers |
| A06 | Vulnerable Components | Using components with known vulnerabilities | npm audit, dependabot, track dependencies, remove unused |
| A07 | Auth Failures | Broken authentication/session management | MFA, rate limiting, secure session management, credential stuffing protection |
| A08 | Software/Data Integrity | Code/infra without integrity verification | Digital signatures, trusted repos, CI/CD integrity checks, SRI for CDN |
| A09 | Logging/Monitoring Failures | Insufficient logging/alerting | Log auth events, access control failures, server-side validation failures |
| A10 | SSRF | Server fetches user-supplied URL | Validate/sanitize URLs, deny by default, allowlist, no raw responses |

### OWASP Prevention Cheatsheet Per Attack Vector

**SQL Injection**
```
BAD:  `SELECT * FROM users WHERE id = '${userId}'`
GOOD: `SELECT * FROM users WHERE id = $1` (parameterized)
GOOD: `prisma.user.findUnique({ where: { id: userId } })` (ORM)
```

**XSS**
```
BAD:  element.innerHTML = userInput
GOOD: element.textContent = userInput
BAD:  <div dangerouslySetInnerHTML={{ __html: userInput }} />
GOOD: <div>{userInput}</div> (React auto-escapes)
GOOD: DOMPurify.sanitize(userInput) (when HTML is needed)
```

**CSRF**
```
- SameSite=Strict cookies (preferred)
- CSRF tokens for forms
- Check Origin/Referer headers
- Don't use GET for mutations
```

---

## 2. REST API DESIGN RULES

### URL Structure
```
# Resources are nouns, plural
GET    /api/users              → List users
GET    /api/users/:id          → Get single user
POST   /api/users              → Create user
PUT    /api/users/:id          → Replace user (full update)
PATCH  /api/users/:id          → Partial update
DELETE /api/users/:id          → Delete user

# Nested resources (max 2 levels deep)
GET    /api/users/:id/posts    → List user's posts
POST   /api/users/:id/posts    → Create post for user

# Filtering, sorting, pagination via query params
GET    /api/users?role=admin&sort=-created_at&page=2&limit=20

# Actions (when CRUD doesn't fit)
POST   /api/users/:id/activate → Custom action
POST   /api/posts/:id/publish  → Custom action
```

### Request/Response Conventions
```json
// Successful response (single resource)
{
  "data": { "id": "123", "name": "Stone", "email": "stone@example.com" },
  "meta": { "requestId": "req_abc123" }
}

// Successful response (collection)
{
  "data": [{ "id": "123" }, { "id": "456" }],
  "meta": { "total": 100, "page": 1, "limit": 20, "totalPages": 5 }
}

// Error response
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email is required",
    "details": [{ "field": "email", "message": "This field is required" }]
  }
}
```

### Versioning
```
# URL path versioning (most common, recommended)
/api/v1/users
/api/v2/users

# Header versioning (cleaner URLs)
Accept: application/vnd.myapi.v2+json

# Query parameter (easy but messy)
/api/users?version=2
```

### Pagination Patterns
```
# Offset-based (simple, can be slow on large datasets)
GET /api/users?page=3&limit=20
→ OFFSET = (page - 1) * limit = 40

# Cursor-based (performant, recommended for large datasets)
GET /api/users?cursor=eyJpZCI6MTAwfQ&limit=20
→ WHERE id > cursor_id ORDER BY id LIMIT 20

# Keyset-based (best for time-sorted data)
GET /api/events?after=2024-01-15T10:00:00Z&limit=50
```

---

## 3. HTTP STATUS CODES — COMPLETE GUIDE

### 1xx Informational
| Code | Name | Use |
|------|------|-----|
| 100 | Continue | Client should continue sending request body |
| 101 | Switching Protocols | Upgrading to WebSocket |
| 103 | Early Hints | Preload resources before final response |

### 2xx Success
| Code | Name | Use |
|------|------|-----|
| 200 | OK | Standard success (GET, PUT, PATCH, DELETE with body) |
| 201 | Created | Resource created (POST). Include Location header. |
| 202 | Accepted | Request accepted, processing async |
| 204 | No Content | Success, no body (DELETE, PUT without return) |

### 3xx Redirection
| Code | Name | Use |
|------|------|-----|
| 301 | Moved Permanently | URL permanently changed. Cached by browsers. |
| 302 | Found | Temporary redirect (often misused — prefer 307) |
| 304 | Not Modified | Client cache is still valid |
| 307 | Temporary Redirect | Like 302 but preserves HTTP method |
| 308 | Permanent Redirect | Like 301 but preserves HTTP method |

### 4xx Client Error
| Code | Name | Use |
|------|------|-----|
| 400 | Bad Request | Malformed syntax, invalid parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 405 | Method Not Allowed | HTTP method not supported for this route |
| 408 | Request Timeout | Client took too long |
| 409 | Conflict | Resource conflict (duplicate, version mismatch) |
| 410 | Gone | Resource permanently deleted (stronger than 404) |
| 413 | Payload Too Large | Request body exceeds limit |
| 415 | Unsupported Media Type | Content-Type not supported |
| 422 | Unprocessable Entity | Syntactically valid but semantically wrong |
| 429 | Too Many Requests | Rate limit exceeded |

### 5xx Server Error
| Code | Name | Use |
|------|------|-----|
| 500 | Internal Server Error | Unhandled server exception |
| 502 | Bad Gateway | Upstream server returned invalid response |
| 503 | Service Unavailable | Server overloaded or in maintenance |
| 504 | Gateway Timeout | Upstream server didn't respond in time |

---

## 4. GIT WORKFLOW STANDARDS

### Conventional Commits
```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

**Types:**
| Type | Description | Example |
|------|-------------|---------|
| feat | New feature | feat(auth): add OAuth2 login |
| fix | Bug fix | fix(api): handle null user response |
| docs | Documentation | docs: update API endpoint list |
| style | Formatting only | style: fix indentation in utils |
| refactor | Neither fix nor feature | refactor: extract validation logic |
| perf | Performance improvement | perf(db): add index on user_email |
| test | Adding/fixing tests | test: add unit tests for billing |
| chore | Maintenance | chore: update dependencies |
| ci | CI/CD changes | ci: add deploy workflow |
| build | Build system changes | build: update webpack config |
| revert | Revert previous commit | revert: feat(auth): add OAuth2 login |

**Breaking changes:**
```
feat(api)!: change user response format

BREAKING CHANGE: The user object no longer includes the `password` field.
Old: { id, email, password }
New: { id, email }
```

### Branch Naming
```
feature/add-user-auth
fix/null-pointer-dashboard
chore/update-dependencies
docs/api-documentation
hotfix/production-crash-fix
release/v2.1.0
```

### Git Flow Summary
```
main ← production-ready code
  └─ develop ← integration branch
       ├─ feature/x ← feature work
       ├─ feature/y ← feature work
       └─ release/v1.0 ← release prep
            └─ hotfix/critical-fix ← emergency patch
```

### Trunk-Based Development (Simpler)
```
main ← always deployable
  ├─ feature/x ← short-lived (< 2 days)
  └─ feature/y ← short-lived (< 2 days)
```

---

## 5. SEMANTIC VERSIONING (SemVer 2.0.0)

```
MAJOR.MINOR.PATCH

MAJOR → Breaking changes (incompatible API changes)
MINOR → New features (backward-compatible additions)
PATCH → Bug fixes (backward-compatible fixes)

Pre-release: 1.0.0-alpha.1, 1.0.0-beta.2, 1.0.0-rc.1
Build metadata: 1.0.0+20240115

Examples:
1.0.0 → 1.0.1  (bug fix)
1.0.1 → 1.1.0  (new feature, backward-compatible)
1.1.0 → 2.0.0  (breaking change)
```

### Version Range Syntax (npm)
```
^1.2.3  → >=1.2.3 <2.0.0    (compatible with major)
~1.2.3  → >=1.2.3 <1.3.0    (compatible with minor)
>=1.2.3 → >=1.2.3            (at least this version)
1.2.x   → >=1.2.0 <1.3.0    (any patch in 1.2)
*       → any version         (dangerous — avoid)
```

---

## 6. JWT STRUCTURE

```
header.payload.signature

HEADER (base64url encoded):
{
  "alg": "HS256",      // Algorithm: HS256, RS256, ES256
  "typ": "JWT"         // Token type
}

PAYLOAD (base64url encoded):
{
  "sub": "user_123",    // Subject (user ID)
  "iss": "stone-ai",    // Issuer
  "aud": "stone-ai",    // Audience
  "exp": 1700000000,    // Expiration (Unix timestamp)
  "iat": 1699999000,    // Issued at
  "nbf": 1699999000,    // Not before
  "jti": "unique-id",   // JWT ID (for revocation)
  // Custom claims:
  "role": "admin",
  "tier": "PRO"
}

SIGNATURE:
HMACSHA256(base64url(header) + "." + base64url(payload), secret)
```

### JWT Best Practices
```
DO:
- Keep payloads small (< 1KB)
- Use short expiration (15 min for access tokens)
- Use refresh tokens for long sessions (7-30 days)
- Store in HttpOnly, Secure, SameSite=Strict cookies
- Validate ALL claims on every request
- Use RS256 for distributed systems (public key verification)

DON'T:
- Store JWTs in localStorage (XSS vulnerable)
- Put sensitive data in payload (it's base64, not encrypted)
- Use "none" algorithm (attack vector)
- Make tokens too long-lived
- Forget to check expiration
```

---

## 7. OAUTH2 FLOWS

### Authorization Code Flow (Recommended for web apps)
```
1. User clicks "Login with Provider"
2. App redirects to: provider.com/authorize?
     response_type=code
     &client_id=YOUR_CLIENT_ID
     &redirect_uri=YOUR_CALLBACK_URL
     &scope=openid profile email
     &state=RANDOM_STATE_VALUE

3. User authenticates with provider
4. Provider redirects to: YOUR_CALLBACK_URL?code=AUTH_CODE&state=STATE

5. Server exchanges code for tokens:
   POST provider.com/token
   {
     grant_type: "authorization_code",
     code: AUTH_CODE,
     client_id: YOUR_CLIENT_ID,
     client_secret: YOUR_CLIENT_SECRET,
     redirect_uri: YOUR_CALLBACK_URL
   }

6. Receive: { access_token, refresh_token, id_token, expires_in }
```

### Authorization Code + PKCE (for SPAs and mobile apps)
```
Same as above, but:
- Generate code_verifier (random 43-128 chars)
- Generate code_challenge = base64url(SHA256(code_verifier))
- Send code_challenge in step 2
- Send code_verifier in step 5
- No client_secret needed (public client)
```

### Client Credentials Flow (Machine-to-machine)
```
POST provider.com/token
{
  grant_type: "client_credentials",
  client_id: YOUR_CLIENT_ID,
  client_secret: YOUR_CLIENT_SECRET,
  scope: "api:read api:write"
}
→ Returns access_token (no refresh token, no user context)
```

### Refresh Token Flow
```
POST provider.com/token
{
  grant_type: "refresh_token",
  refresh_token: STORED_REFRESH_TOKEN,
  client_id: YOUR_CLIENT_ID
}
→ Returns new access_token (and optionally new refresh_token)
```

---

## 8. CORS RULES

### What CORS Blocks
```
Browser makes cross-origin request (different domain, port, or protocol)
→ Browser sends preflight OPTIONS request (for non-simple requests)
→ Server must respond with appropriate CORS headers
→ If headers missing/wrong → browser blocks the response
```

### CORS Headers
```
# Allow specific origin (production)
Access-Control-Allow-Origin: https://stone-ai.net

# Allow any origin (public API only)
Access-Control-Allow-Origin: *

# Allowed methods
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS

# Allowed request headers
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With

# Allow credentials (cookies, auth headers)
Access-Control-Allow-Credentials: true
# NOTE: Cannot use * with credentials. Must specify exact origin.

# Cache preflight for 1 hour
Access-Control-Max-Age: 3600

# Expose custom response headers to client
Access-Control-Expose-Headers: X-Total-Count, X-Request-Id
```

### Simple Requests (No Preflight)
```
Methods: GET, HEAD, POST
Content-Types: application/x-www-form-urlencoded, multipart/form-data, text/plain
No custom headers
```

### Preflight Required When
```
- Methods: PUT, PATCH, DELETE
- Custom headers: Authorization, Content-Type: application/json
- Any non-simple request
```

### Next.js CORS Configuration
```typescript
// middleware.ts or route handler
export async function GET(request: NextRequest) {
  const response = NextResponse.json(data);
  response.headers.set('Access-Control-Allow-Origin', 'https://stone-ai.net');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Handle preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://stone-ai.net',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
```

---

## 9. CONTENT SECURITY POLICY (CSP) REFERENCE

```
# Full CSP header example
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{random}' https://cdn.example.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://api.example.com wss://ws.example.com;
  frame-src 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
```

### Directive Reference
| Directive | Controls | Common Values |
|-----------|----------|---------------|
| default-src | Fallback for all | 'self' |
| script-src | JavaScript | 'self' 'nonce-xxx' specific-domains |
| style-src | CSS | 'self' 'unsafe-inline' (needed for many frameworks) |
| img-src | Images | 'self' data: https: (allow all HTTPS images) |
| connect-src | Fetch, XHR, WS | 'self' api-domains websocket-domains |
| font-src | Fonts | 'self' fonts.gstatic.com |
| frame-src | iframes | 'none' or specific embed domains |
| media-src | Audio/video | 'self' |
| object-src | Plugins | 'none' (always) |
| base-uri | <base> element | 'self' |
| form-action | Form submissions | 'self' |
| frame-ancestors | Who can embed you | 'none' (prevents clickjacking) |

---

## 10. HTTP CACHING

```
# Static assets (CSS, JS, images) — long cache + content hash
Cache-Control: public, max-age=31536000, immutable
# File name includes hash: style.a1b2c3.css

# API responses — short cache, revalidate
Cache-Control: private, max-age=60, must-revalidate
ETag: "abc123"

# Never cache (sensitive data, personalized content)
Cache-Control: no-store
# Note: no-cache doesn't prevent caching — it requires revalidation

# Stale-while-revalidate (serve stale, update in background)
Cache-Control: public, max-age=60, stale-while-revalidate=600
```

### Cache-Control Directives
| Directive | Meaning |
|-----------|---------|
| public | Any cache can store (CDN, browser) |
| private | Only browser can store (not CDN) |
| no-store | Don't cache at all |
| no-cache | Cache but revalidate every time |
| max-age=N | Fresh for N seconds |
| s-maxage=N | CDN-specific max-age |
| must-revalidate | Don't serve stale |
| immutable | Content will never change (use with hashed filenames) |
| stale-while-revalidate=N | Serve stale for N seconds while fetching fresh |

---

## 11. COMMON SECURITY HEADERS

```
# Prevent MIME sniffing
X-Content-Type-Options: nosniff

# Prevent clickjacking (deprecated in favor of CSP frame-ancestors)
X-Frame-Options: DENY

# Enable browser XSS filter (legacy, still useful)
X-XSS-Protection: 1; mode=block

# Control referrer information
Referrer-Policy: strict-origin-when-cross-origin

# Restrict browser features
Permissions-Policy: camera=(), microphone=(), geolocation=()

# Force HTTPS
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload

# Prevent DNS prefetch abuse
X-DNS-Prefetch-Control: off
```

---

## 12. RATE LIMITING STANDARDS

### Common Patterns
```
# Token bucket (most common)
- Bucket size: max burst capacity
- Refill rate: tokens per second
- Each request costs 1 token
- Example: 100 bucket, 10/sec refill → 100 burst, sustained 10/sec

# Sliding window
- Count requests in rolling time window
- Example: 100 requests per 60 seconds, sliding

# Fixed window
- Count requests in fixed time intervals
- Simpler but allows bursts at window boundaries
```

### Standard Response
```
HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1699999999

{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Try again in 30 seconds.",
    "retryAfter": 30
  }
}
```

### Recommended Limits by Endpoint Type
| Endpoint | Limit | Window |
|----------|-------|--------|
| Login attempts | 5 | 15 min |
| Password reset | 3 | 1 hour |
| API read | 100 | 1 min |
| API write | 30 | 1 min |
| File upload | 10 | 1 hour |
| Search | 30 | 1 min |
| Webhook | 1000 | 1 min |

---

## USAGE GUIDE

These specs are canonical references. When an agent needs to:
- Validate a security implementation → Check against OWASP section
- Design an API → Follow REST rules section
- Choose an HTTP status code → Look up the status code table
- Configure authentication → Reference JWT and OAuth2 sections
- Set up CORS → Follow the CORS rules exactly
- Version a release → Follow SemVer rules

**Embedding hint**: Each numbered section is an independent retrieval unit.
Section headers are the retrieval keys.
