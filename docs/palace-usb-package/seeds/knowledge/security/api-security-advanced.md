# API Security Advanced
# Seed: SEC-3 | Category: Cybersecurity | Topic: Advanced API Security
# RAG Tags: bola, bfla, api-gateway, jwt, graphql, rate-limiting, owasp-api, broken-auth

---

## Purpose
Advanced API security beyond the basics. OWASP API Security Top 10, broken authorization
patterns (BOLA, BFLA), JWT pitfalls, GraphQL-specific attacks, rate limiting bypass techniques,
and API gateway security patterns. Every agent building or reviewing APIs must know these.

---

## 1. OWASP API Security Top 10 (2023)

```
API1: Broken Object Level Authorization (BOLA)
  Attacker changes object ID in request to access other users' data.
  GET /api/users/123/orders → GET /api/users/456/orders

API2: Broken Authentication
  Weak auth mechanisms, credential stuffing, token issues.

API3: Broken Object Property Level Authorization
  API returns more data than needed, or allows modifying restricted fields.

API4: Unrestricted Resource Consumption
  No rate limiting, no pagination limits, large payload attacks.

API5: Broken Function Level Authorization (BFLA)
  Regular user accesses admin endpoints.
  POST /api/admin/users/delete

API6: Unrestricted Access to Sensitive Business Flows
  Automated abuse of business logic (ticket scalping, coupon fraud).

API7: Server-Side Request Forgery (SSRF)
  API fetches user-supplied URLs, attacker targets internal services.

API8: Security Misconfiguration
  Default configs, unnecessary HTTP methods, verbose errors, missing CORS.

API9: Improper Inventory Management
  Old API versions still running, undocumented endpoints, shadow APIs.

API10: Unsafe Consumption of Third-Party APIs
  Blindly trusting data from third-party APIs without validation.
```

---

## 2. BOLA (Broken Object Level Authorization)

### The #1 API Vulnerability
```
BOLA is the most common and most dangerous API vulnerability.
It occurs when the API doesn't verify that the requesting user
has permission to access the specific object they're requesting.

Attack example:
  1. User A is authenticated (valid JWT/session)
  2. User A requests: GET /api/chats/chat_abc123 (their chat)
  3. User A changes ID: GET /api/chats/chat_def456 (User B's chat)
  4. API returns User B's chat data because it only checked authentication, not authorization

This is NOT an auth bypass — the user IS authenticated.
It's an AUTHORIZATION failure — the API doesn't check ownership.
```

### BOLA Prevention Pattern
```typescript
// VULNERABLE — Only checks authentication, not ownership
app.get('/api/chats/:chatId', authMiddleware, async (req, res) => {
  const chat = await prisma.chat.findUnique({
    where: { id: req.params.chatId },
  });
  if (!chat) return res.status(404).json({ error: 'Not found' });
  return res.json(chat);  // BUG: Returns any user's chat!
});

// SECURE — Checks both authentication AND ownership
app.get('/api/chats/:chatId', authMiddleware, async (req, res) => {
  const userId = req.auth.userId;  // From Clerk/JWT

  const chat = await prisma.chat.findUnique({
    where: {
      id: req.params.chatId,
      userId: userId,  // CRITICAL: Filter by authenticated user
    },
  });

  if (!chat) return res.status(404).json({ error: 'Not found' });
  return res.json(chat);
});

// EVEN BETTER — Use a service layer that always scopes by user
class ChatService {
  async getChat(userId: string, chatId: string) {
    const chat = await prisma.chat.findFirst({
      where: { id: chatId, userId },  // Always scoped
    });
    if (!chat) throw new NotFoundError('Chat not found');
    return chat;
  }

  async listChats(userId: string, page: number, limit: number) {
    return prisma.chat.findMany({
      where: { userId },  // Always scoped
      skip: (page - 1) * limit,
      take: Math.min(limit, 100),  // Cap pagination
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

### BOLA Testing Checklist
```
For EVERY API endpoint that returns or modifies a resource:
  □ Try accessing with a different user's auth token
  □ Try replacing IDs with other valid IDs
  □ Try sequential IDs (if using numeric IDs)
  □ Try UUIDs from other users (captured from other requests)
  □ Try accessing after permission change (role downgrade)
  □ Try accessing deleted user's resources
  □ Try with admin endpoints using regular user tokens
```

---

## 3. BFLA (Broken Function Level Authorization)

### Attack Pattern
```
BFLA occurs when the API doesn't verify the user's ROLE/PERMISSIONS
for the endpoint being called.

Attack examples:
  Regular user calls: DELETE /api/admin/users/456     (admin function)
  Regular user calls: PUT /api/users/456/role         (elevate privileges)
  Regular user calls: GET /api/admin/analytics         (admin data)
  Regular user calls: POST /api/agents/create          (above their tier)

Common causes:
  - "Security by obscurity" — endpoint isn't in the UI but exists
  - Missing middleware on admin routes
  - Role check only on frontend, not backend
  - Inconsistent middleware application across route groups
```

### BFLA Prevention
```typescript
// middleware/authorization.ts
import { z } from 'zod';

type Permission = 'read' | 'write' | 'admin' | 'founder';

interface RolePermissions {
  [role: string]: Permission[];
}

const ROLE_PERMISSIONS: RolePermissions = {
  free: ['read'],
  starter: ['read', 'write'],
  plus: ['read', 'write'],
  smart: ['read', 'write'],
  pro: ['read', 'write'],
  admin: ['read', 'write', 'admin'],
  founder: ['read', 'write', 'admin', 'founder'],
};

// Middleware factory — specify required permissions per route
export function requirePermission(...permissions: Permission[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.auth?.role;

    if (!userRole) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userPermissions = ROLE_PERMISSIONS[userRole] || [];
    const hasPermission = permissions.every(p => userPermissions.includes(p));

    if (!hasPermission) {
      // Log the attempt — potential attack
      await auditLog.warn({
        event: 'bfla_attempt',
        userId: req.auth.userId,
        userRole,
        requiredPermissions: permissions,
        endpoint: req.originalUrl,
        method: req.method,
        ip: req.ip,
      });

      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
}

// Route setup
app.get('/api/admin/users', requirePermission('admin'), adminController.listUsers);
app.delete('/api/admin/users/:id', requirePermission('admin'), adminController.deleteUser);
app.get('/api/admin/analytics', requirePermission('admin'), adminController.getAnalytics);
app.post('/api/founder/chaos', requirePermission('founder'), founderController.chaosCommand);

// Agent tier enforcement
const AGENT_TIER_LIMITS: Record<string, number[]> = {
  free: [1, 2, 3, 4],                    // Agents 1-4
  starter: Array.from({length: 16}, (_, i) => i + 1),
  plus: Array.from({length: 30}, (_, i) => i + 1),
  smart: Array.from({length: 39}, (_, i) => i + 1),
  pro: Array.from({length: 42}, (_, i) => i + 1),
  // Royal Guards and Chaos: founder only, not in this list
};

export function requireAgentAccess(agentId: number) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userTier = req.auth?.tier || 'free';

    // Royal Guards and Chaos — founder only
    if (agentId > 42 || ['computerWiz', 'rush'].includes(req.params.agentSlug)) {
      if (req.auth?.role !== 'founder') {
        return res.status(403).json({ error: 'Access denied' });
      }
      return next();
    }

    const allowedAgents = AGENT_TIER_LIMITS[userTier] || [];
    if (!allowedAgents.includes(agentId)) {
      return res.status(403).json({
        error: 'Agent not available on your plan',
        requiredTier: getRequiredTier(agentId),
      });
    }

    next();
  };
}
```

---

## 4. JWT Security Pitfalls

### Critical JWT Vulnerabilities
```
1. ALGORITHM NONE ATTACK
   JWT header: {"alg": "none"}
   Attack: Strip signature, set algorithm to "none"
   Many libraries accept unsigned JWTs if alg=none

   Defense: ALWAYS validate algorithm. Whitelist accepted algorithms.

2. ALGORITHM CONFUSION (RS256 → HS256)
   Server uses RS256 (asymmetric). Attacker sets header to HS256.
   Attacker signs JWT using the PUBLIC key as HMAC secret.
   Server verifies with public key as HMAC secret — signature validates!

   Defense: Explicitly specify expected algorithm in verification.

3. JWK INJECTION
   JWT header includes a "jku" or "jwk" field with attacker-controlled key.
   Server fetches key from attacker's URL to verify signature.

   Defense: Never fetch keys from JWT-specified URLs. Use hardcoded JWKS endpoints.

4. KID INJECTION
   JWT header "kid" field used in database query or file path.
   SQL injection: {"kid": "1' UNION SELECT 'secret'--"}
   Path traversal: {"kid": "../../../etc/passwd"}

   Defense: Validate kid format strictly. Use parameterized queries.

5. WEAK SECRETS
   HS256 with guessable secret: "secret", "password", company name
   Tool: hashcat can crack weak JWT secrets offline

   Defense: Use RS256/ES256 (asymmetric) or 256+ bit random HS256 secret.
```

### Secure JWT Implementation
```typescript
// jwt-security.ts — Secure JWT verification patterns

import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

// OPTION 1: Clerk-based (what Stone AI uses)
// Clerk handles JWT issuance and verification. Use their SDK.
// This is the SAFEST option — don't roll your own auth.

// OPTION 2: If you must verify JWTs yourself
const ALLOWED_ALGORITHMS = ['RS256', 'ES256'] as const; // NEVER include 'none' or 'HS256' with public key

// Clerk JWKS endpoint
const client = jwksClient({
  jwksUri: 'https://clerk.stone-ai.net/.well-known/jwks.json',
  cache: true,
  cacheMaxAge: 600000,      // Cache keys for 10 minutes
  rateLimit: true,
  jwksRequestsPerMinute: 10,
});

function getSigningKey(header: jwt.JwtHeader): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!header.kid) {
      return reject(new Error('Missing kid in JWT header'));
    }

    // Validate kid format (prevent injection)
    if (!/^[a-zA-Z0-9_-]+$/.test(header.kid)) {
      return reject(new Error('Invalid kid format'));
    }

    client.getSigningKey(header.kid, (err, key) => {
      if (err) return reject(err);
      resolve(key!.getPublicKey());
    });
  });
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      (header, callback) => {
        getSigningKey(header)
          .then(key => callback(null, key))
          .catch(err => callback(err));
      },
      {
        algorithms: [...ALLOWED_ALGORITHMS],  // WHITELIST algorithms
        issuer: 'https://clerk.stone-ai.net', // Verify issuer
        audience: 'stone-ai-api',             // Verify audience
        clockTolerance: 30,                   // 30s clock skew tolerance
        maxAge: '1h',                         // Reject tokens older than 1 hour
      },
      (err, decoded) => {
        if (err) return reject(err);
        resolve(decoded as JWTPayload);
      }
    );
  });
}

// Token refresh pattern
// Short-lived access tokens (15-60 min) + long-lived refresh tokens (7-30 days)
// Access token: Used for API calls, stateless verification
// Refresh token: Stored in httpOnly cookie, used to get new access token
// Rotation: Issue new refresh token on each use, invalidate old one
```

---

## 5. GraphQL Security

### GraphQL-Specific Attacks
```
1. INTROSPECTION ATTACK
   Query: { __schema { types { name fields { name } } } }
   Reveals entire API schema — all types, fields, mutations
   Defense: Disable introspection in production

2. BATCHING ATTACK
   Send multiple queries in one request to bypass rate limiting:
   [
     {"query": "{ user(id: 1) { password } }"},
     {"query": "{ user(id: 2) { password } }"},
     ... (1000 queries in one HTTP request)
   ]
   Defense: Limit batch size, rate limit by query count not HTTP request count

3. DEPTH ATTACK (Nested Queries)
   { user { friends { friends { friends { friends { ... } } } } } }
   Causes exponential database queries
   Defense: Max query depth (typically 7-10 levels)

4. ALIAS ATTACK
   { a1: user(id:1) { name } a2: user(id:2) { name } ... a1000: user(id:1000) { name } }
   Bypass rate limiting by aliasing the same field
   Defense: Limit number of aliases per query

5. FIELD SUGGESTION LEAK
   Send query with typo: { usr { name } }
   Response: "Did you mean 'user'?" — reveals field names even with introspection off
   Defense: Disable field suggestions in production

6. DIRECTIVE OVERLOAD
   Apply excessive directives to cause processing overhead
   Defense: Limit directive count per query
```

### GraphQL Security Configuration
```typescript
// graphql-security.ts — Apollo Server security configuration
import { ApolloServer } from '@apollo/server';
import depthLimit from 'graphql-depth-limit';
import { createComplexityLimitRule } from 'graphql-validation-complexity';

const server = new ApolloServer({
  typeDefs,
  resolvers,

  // Disable introspection in production
  introspection: process.env.NODE_ENV !== 'production',

  // Query complexity and depth limits
  validationRules: [
    depthLimit(10),                          // Max 10 levels deep
    createComplexityLimitRule(1000, {         // Max complexity score of 1000
      scalarCost: 1,
      objectCost: 2,
      listFactor: 10,                         // Lists multiply cost
      introspectionListFactor: 2,
    }),
  ],

  // Disable field suggestions in production
  includeStacktraceInErrorResponses: false,

  plugins: [
    // Rate limiting by query complexity
    {
      async requestDidStart() {
        return {
          async didResolveOperation(requestContext) {
            // Count aliases
            const aliasCount = countAliases(requestContext.document);
            if (aliasCount > 20) {
              throw new Error('Too many aliases in query');
            }
          },
        };
      },
    },
  ],
});

// Batch query limiting
// If using Apollo, set allowBatchedHttpRequests: false
// Or limit batch size:
const MAX_BATCH_SIZE = 5;
app.use('/graphql', (req, res, next) => {
  if (Array.isArray(req.body) && req.body.length > MAX_BATCH_SIZE) {
    return res.status(400).json({ error: `Max ${MAX_BATCH_SIZE} queries per batch` });
  }
  next();
});
```

---

## 6. Rate Limiting Bypass Techniques

### Common Bypass Methods (And Defenses)
```
1. IP ROTATION
   Attack: Use different IPs (proxies, VPNs, cloud IPs) to bypass IP-based rate limiting
   Defense: Rate limit by authenticated user ID, not just IP
   Defense: Require authentication for sensitive endpoints

2. HEADER MANIPULATION
   Attack: Change X-Forwarded-For header to fake different source IPs
   Defense: Trust X-Forwarded-For only from known proxies (e.g., Cloudflare)
   Defense: Use Cloudflare's CF-Connecting-IP (can't be spoofed)

3. PARAMETER POLLUTION
   Attack: Send same parameter multiple times: ?id=1&id=2&id=3
   Some frameworks process each differently, some bypass validation
   Defense: Use framework that rejects duplicate parameters

4. ENDPOINT VARIATION
   Attack: /api/login vs /API/LOGIN vs /api/login/ vs /api/login?x=1
   Defense: Normalize paths before rate limiting (lowercase, strip trailing slash)

5. METHOD SWITCHING
   Attack: POST /api/data → PUT /api/data → PATCH /api/data
   Defense: Rate limit across all methods for same resource

6. DISTRIBUTED ATTACK
   Attack: Coordinate requests across many clients (botnet)
   Defense: Global rate limiting (total across all sources)
   Defense: CAPTCHA on suspicious patterns
```

### Production Rate Limiting
```typescript
// rate-limiter.ts — Multi-layer rate limiting

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Layer 1: Per-user rate limiting (primary defense)
const userLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1m'),  // 100 req/min per user
  prefix: 'rl:user',
  analytics: true,
});

// Layer 2: Per-IP rate limiting (catches unauthenticated abuse)
const ipLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, '1m'),   // 30 req/min per IP
  prefix: 'rl:ip',
});

// Layer 3: Global rate limiting (DDoS protection)
const globalLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10000, '1m'), // 10K req/min total
  prefix: 'rl:global',
});

// Layer 4: Endpoint-specific limits
const sensitiveEndpointLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '15m'),    // 5 attempts per 15min
  prefix: 'rl:sensitive',
});

export async function rateLimit(req: Request): Promise<void> {
  // Normalize path for consistent rate limiting
  const normalizedPath = req.path.toLowerCase().replace(/\/+$/, '');

  // Get real IP (Cloudflare)
  const ip = req.headers['cf-connecting-ip'] as string || req.ip;

  // Global check first (cheapest)
  const globalResult = await globalLimiter.limit('global');
  if (!globalResult.success) {
    throw new RateLimitError('Service rate limit exceeded', globalResult.reset);
  }

  // IP-based
  const ipResult = await ipLimiter.limit(ip);
  if (!ipResult.success) {
    throw new RateLimitError('IP rate limit exceeded', ipResult.reset);
  }

  // User-based (if authenticated)
  if (req.auth?.userId) {
    const userResult = await userLimiter.limit(req.auth.userId);
    if (!userResult.success) {
      throw new RateLimitError('User rate limit exceeded', userResult.reset);
    }
  }

  // Sensitive endpoint (login, password reset, payment)
  const sensitiveEndpoints = ['/api/auth', '/api/billing', '/api/admin'];
  if (sensitiveEndpoints.some(e => normalizedPath.startsWith(e))) {
    const key = `${req.auth?.userId || ip}:${normalizedPath}`;
    const result = await sensitiveEndpointLimiter.limit(key);
    if (!result.success) {
      await auditLog.warn({
        event: 'sensitive_endpoint_rate_limited',
        userId: req.auth?.userId,
        ip,
        endpoint: normalizedPath,
      });
      throw new RateLimitError('Too many attempts', result.reset);
    }
  }
}
```

---

## 7. API Gateway Security

### Gateway-Level Protections
```
API Gateway should handle:
  1. TLS termination (enforce TLS 1.2+)
  2. Authentication (validate tokens before reaching backend)
  3. Rate limiting (first line of defense)
  4. Request validation (schema validation, size limits)
  5. IP allowlisting/denylisting
  6. WAF integration (OWASP rules, bot detection)
  7. Request/response transformation (strip internal headers)
  8. Logging and monitoring (every request logged)

Configuration checklist:
  □ Max request body size: 1MB (adjust per endpoint)
  □ Request timeout: 30 seconds
  □ Allowed HTTP methods: GET, POST, PUT, DELETE, PATCH (no TRACE, OPTIONS only for CORS)
  □ Required headers: Content-Type, Authorization
  □ CORS: Restrict to known origins (https://stone-ai.net)
  □ Remove server headers: X-Powered-By, Server, Via
  □ Add security headers: HSTS, X-Content-Type-Options, X-Frame-Options
```

---

## 8. API Security Testing

### Automated API Security Testing
```bash
# OWASP ZAP — automated API scanning
docker run -t owasp/zap2docker-stable zap-api-scan.py \
  -t https://stone-ai.net/api/openapi.json \
  -f openapi \
  -r api-security-report.html

# Nuclei — template-based vulnerability scanner
nuclei -u https://stone-ai.net/api -t api/ -severity high,critical

# API endpoint discovery
# Use wordlists to find undocumented/shadow endpoints
ffuf -u https://stone-ai.net/api/FUZZ \
  -w /usr/share/wordlists/api-endpoints.txt \
  -mc 200,201,401,403 \
  -o api-discovery.json
```

### Manual Testing Checklist
```
For EVERY endpoint:
  □ Test without authentication (expect 401)
  □ Test with expired token (expect 401)
  □ Test with wrong user's token (BOLA check — expect 403/404)
  □ Test with lower-privilege role (BFLA check — expect 403)
  □ Test with invalid input (SQL injection, XSS, SSRF payloads)
  □ Test with oversized payload (expect 413)
  □ Test with missing required fields (expect 400 with clear error)
  □ Test with extra fields (should be rejected if .strict() is used)
  □ Test rate limiting (exceed limit, verify 429)
  □ Test CORS (request from unauthorized origin)
  □ Verify error responses don't leak internal details
  □ Verify response only includes requested fields (no data over-exposure)
```

---

*This seed is maintained by the Security team. Last validated: 2026-03.*
