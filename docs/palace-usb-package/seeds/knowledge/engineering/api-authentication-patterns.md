# API Authentication Patterns for Stone AI Tools

## Seed Classification
- **Domain**: Backend Engineering / Security
- **Platform**: Stone AI Tools (tools.stone-ai.net)
- **Complexity**: Advanced
- **Prerequisites**: Cryptography basics, OAuth2, JWT, HTTP security headers
- **Last Updated**: 2026-03-09

---

## 1. Authentication Strategy Overview

### Authentication Methods Supported

```
Stone AI Tools Authentication Matrix:

┌────────────────────────┬───────────┬────────────┬───────────────┐
│ Method                 │ Use Case  │ Complexity │ Security      │
├────────────────────────┼───────────┼────────────┼───────────────┤
│ API Keys (Bearer)      │ Server    │ Low        │ High          │
│                        │ to Server │            │ (with hashing)│
├────────────────────────┼───────────┼────────────┼───────────────┤
│ OAuth2 Client Creds    │ Enterprise│ Medium     │ Highest       │
│                        │ Partners  │            │               │
├────────────────────────┼───────────┼────────────┼───────────────┤
│ Short-Lived JWT        │ Frontend  │ Medium     │ High          │
│ (from Dashboard)       │ Playground│            │               │
└────────────────────────┴───────────┴────────────┴───────────────┘

Primary: API Keys (99% of traffic)
Secondary: OAuth2 Client Credentials (enterprise partners)
Tertiary: Short-lived JWT (dashboard/playground only)
```

---

## 2. API Key Authentication

### 2.1 Key Format and Generation

```typescript
// File: src/services/api-key-service.ts

import { randomBytes, createHash, timingSafeEqual } from 'crypto';

/**
 * API Key Format: sat_{base62_random_43_chars}
 *
 * Breakdown:
 * - "sat_" prefix identifies this as a Stone AI Tools key
 * - 43 chars of base62 random data (~256 bits of entropy)
 * - Total length: 47 characters
 *
 * Example: sat_7kBxR2mN4pQ9vW1yZ3cA5eG8hJ0lT6uI2oS4fD
 */

const KEY_PREFIX = 'sat_';
const KEY_RANDOM_BYTES = 32; // 256 bits

interface GeneratedKey {
  fullKey: string;     // Complete key (shown to user ONCE)
  keyHash: string;     // SHA-256 hash (stored in database)
  keyPrefix: string;   // First 12 chars (for identification)
  checksum: string;    // Last 4 chars of hash (for quick validation)
}

export function generateApiKey(): GeneratedKey {
  // Generate cryptographically secure random bytes
  const randomPart = randomBytes(KEY_RANDOM_BYTES)
    .toString('base64url')
    .slice(0, 43);

  const fullKey = `${KEY_PREFIX}${randomPart}`;

  // Hash the key with SHA-256 for storage
  const keyHash = createHash('sha256')
    .update(fullKey)
    .digest('hex');

  return {
    fullKey,
    keyHash,
    keyPrefix: fullKey.slice(0, 12),  // "sat_7kBxR2mN"
    checksum: keyHash.slice(-4),       // Quick validation hint
  };
}

/**
 * Hash an API key for lookup.
 * Uses SHA-256 — same as what we stored during generation.
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Validate API key format before hashing/lookup.
 * Rejects obviously invalid keys early.
 */
export function validateKeyFormat(key: string): boolean {
  // Must start with sat_
  if (!key.startsWith(KEY_PREFIX)) return false;

  // Must be exactly 47 characters
  if (key.length !== 47) return false;

  // Random part must be base64url characters only
  const randomPart = key.slice(4);
  return /^[A-Za-z0-9_-]+$/.test(randomPart);
}
```

### 2.2 Key Storage Security

```typescript
// SECURITY: API keys are NEVER stored in plaintext

// Database stores:
// 1. SHA-256 hash of the key (for lookup)
// 2. First 12 chars as prefix (for display/identification)
// 3. Key metadata (scopes, expiry, etc.)

// What we do NOT store:
// ✗ The full API key
// ✗ Reversible encryption of the key
// ✗ The key in any log file

// Lookup flow:
// 1. Developer sends: Authorization: Bearer sat_7kBxR2mN...
// 2. Gateway extracts the key
// 3. Gateway computes SHA-256 hash
// 4. Gateway looks up hash in database/cache
// 5. If match found → authenticated
```

### 2.3 Authentication Middleware

```typescript
// File: src/gateway/stages/authentication.ts

async function authenticateRequest(req: GatewayRequest): Promise<PipelineResult> {
  // Extract API key from Authorization header
  const authHeader = req.raw.headers['authorization'] as string | undefined;

  if (!authHeader) {
    return {
      action: 'short-circuit',
      statusCode: 401,
      body: {
        error: {
          code: 'missing_api_key',
          message: 'No API key provided. Include it in the Authorization header as: Bearer sat_...',
          docs_url: 'https://tools.stone-ai.net/docs/authentication',
        },
      },
      headers: {
        'WWW-Authenticate': 'Bearer realm="Stone AI Tools API"',
      },
    };
  }

  // Parse Bearer token
  const match = authHeader.match(/^Bearer\s+(sat_.+)$/i);
  if (!match) {
    return {
      action: 'short-circuit',
      statusCode: 401,
      body: {
        error: {
          code: 'invalid_auth_format',
          message: 'Authorization header must be in format: Bearer sat_...',
          docs_url: 'https://tools.stone-ai.net/docs/authentication',
        },
      },
    };
  }

  const apiKey = match[1];

  // Quick format validation (avoids unnecessary hashing)
  if (!validateKeyFormat(apiKey)) {
    return {
      action: 'short-circuit',
      statusCode: 401,
      body: {
        error: {
          code: 'invalid_api_key',
          message: 'The API key format is invalid',
        },
      },
    };
  }

  // Hash the key for lookup
  const keyHash = hashApiKey(apiKey);
  req.metadata.apiKeyHash = keyHash;

  // Lookup in cache first, then database (handled in tenant-resolve stage)
  return { action: 'continue' };
}
```

---

## 3. Scoped Permissions

### 3.1 Permission Scope Definitions

```typescript
// File: src/services/scopes.ts

/**
 * API Key Scopes — hierarchical permission system.
 *
 * Format: resource:action
 * Wildcard: resource:* (all actions on resource)
 */

const AVAILABLE_SCOPES = {
  // Agent scopes
  'agents:read':     'List and view agent details',
  'agents:invoke':   'Invoke agents (make API calls)',

  // Usage scopes
  'usage:read':      'View usage statistics and billing data',

  // Webhook scopes
  'webhooks:read':   'List and view webhooks',
  'webhooks:write':  'Create, update, and delete webhooks',

  // API key scopes (for key management APIs)
  'api-keys:read':   'List API keys (prefix only)',
  'api-keys:write':  'Create and revoke API keys',

  // Admin scopes
  'admin:read':      'View team members and settings',
  'admin:write':     'Manage team members and settings',
} as const;

type Scope = keyof typeof AVAILABLE_SCOPES;

// Default scopes for new API keys
const DEFAULT_SCOPES: Scope[] = ['agents:read', 'agents:invoke'];

// Scope presets for common use cases
const SCOPE_PRESETS = {
  'read-only': ['agents:read', 'usage:read'],
  'standard': ['agents:read', 'agents:invoke', 'usage:read'],
  'full': ['agents:read', 'agents:invoke', 'usage:read', 'webhooks:read', 'webhooks:write'],
  'admin': Object.keys(AVAILABLE_SCOPES) as Scope[],
};

// Plan-based scope restrictions
const PLAN_ALLOWED_SCOPES: Record<string, Scope[]> = {
  FREE: ['agents:read', 'agents:invoke', 'usage:read'],
  STARTER: ['agents:read', 'agents:invoke', 'usage:read', 'webhooks:read', 'webhooks:write'],
  PLUS: ['agents:read', 'agents:invoke', 'usage:read', 'webhooks:read', 'webhooks:write', 'api-keys:read'],
  PRO: Object.keys(AVAILABLE_SCOPES) as Scope[],
  ENTERPRISE: Object.keys(AVAILABLE_SCOPES) as Scope[],
};
```

### 3.2 Scope Enforcement Middleware

```typescript
// File: src/gateway/stages/scope-check.ts

// Endpoint-to-scope mapping
const ENDPOINT_SCOPES: Record<string, Scope[]> = {
  'GET /v1/agents':                    ['agents:read'],
  'GET /v1/agents/:agentId':           ['agents:read'],
  'POST /v1/agents/:agentId/invoke':   ['agents:invoke'],
  'GET /v1/usage':                     ['usage:read'],
  'GET /v1/usage/summary':             ['usage:read'],
  'GET /v1/webhooks':                  ['webhooks:read'],
  'POST /v1/webhooks':                 ['webhooks:write'],
  'PUT /v1/webhooks/:webhookId':       ['webhooks:write'],
  'DELETE /v1/webhooks/:webhookId':    ['webhooks:write'],
  'GET /v1/api-keys':                  ['api-keys:read'],
  'POST /v1/api-keys':                 ['api-keys:write'],
  'DELETE /v1/api-keys/:keyId':        ['api-keys:write'],
};

async function checkScopes(req: GatewayRequest): Promise<PipelineResult> {
  const route = req.routeMatch?.route;
  if (!route) return { action: 'continue' };

  const routeKey = `${route.method} ${route.pattern}`;
  const requiredScopes = ENDPOINT_SCOPES[routeKey];

  if (!requiredScopes || requiredScopes.length === 0) {
    return { action: 'continue' };
  }

  const keyScopes = req.metadata.scopes as string[] ?? [];

  // Check if key has all required scopes
  const hasAllScopes = requiredScopes.every(scope =>
    keyScopes.includes(scope) || keyScopes.includes(scope.split(':')[0] + ':*')
  );

  if (!hasAllScopes) {
    const missing = requiredScopes.filter(s => !keyScopes.includes(s));
    return {
      action: 'short-circuit',
      statusCode: 403,
      body: {
        error: {
          code: 'insufficient_scope',
          message: `This API key does not have the required scope(s): ${missing.join(', ')}`,
          required_scopes: requiredScopes,
          key_scopes: keyScopes,
          docs_url: 'https://tools.stone-ai.net/docs/authentication#scopes',
        },
      },
    };
  }

  return { action: 'continue' };
}
```

---

## 4. OAuth2 Client Credentials Flow

### 4.1 Overview

For enterprise partners who need machine-to-machine authentication with auto-rotating credentials.

```
OAuth2 Client Credentials Flow:

┌────────────┐                              ┌──────────────────┐
│  Partner   │                              │ Stone AI Tools   │
│  Server    │                              │ Auth Server      │
└─────┬──────┘                              └────────┬─────────┘
      │                                              │
      │  1. POST /oauth/token                        │
      │     client_id=xxx                            │
      │     client_secret=yyy                        │
      │     grant_type=client_credentials            │
      │     scope=agents:read agents:invoke          │
      │─────────────────────────────────────────────►│
      │                                              │
      │  2. 200 OK                                   │
      │     { access_token: "eyJ...",                │
      │       token_type: "bearer",                  │
      │       expires_in: 3600,                      │
      │       scope: "agents:read agents:invoke" }   │
      │◄─────────────────────────────────────────────│
      │                                              │
      │  3. GET /v1/agents                           │
      │     Authorization: Bearer eyJ...             │
      │─────────────────────────────────────────────►│ Stone AI Tools
      │                                              │ API Gateway
      │  4. 200 OK { data: [...] }                   │
      │◄─────────────────────────────────────────────│
      │                                              │
```

### 4.2 Token Endpoint Implementation

```typescript
// File: src/app/api/oauth/token/route.ts

import { z } from 'zod';
import jwt from 'jsonwebtoken';

const TokenRequestSchema = z.object({
  grant_type: z.literal('client_credentials'),
  client_id: z.string().min(1),
  client_secret: z.string().min(1),
  scope: z.string().optional(),
}).strict();

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type');

  let body: Record<string, string>;
  if (contentType?.includes('application/x-www-form-urlencoded')) {
    const formData = await req.formData();
    body = Object.fromEntries(formData.entries()) as Record<string, string>;
  } else {
    body = await req.json();
  }

  const parsed = TokenRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({
      error: 'invalid_request',
      error_description: 'Missing or invalid parameters',
    }, { status: 400 });
  }

  const { client_id, client_secret, scope } = parsed.data;

  // Validate client credentials
  const client = await db.raw.oauthClient.findUnique({
    where: { clientId: client_id },
    include: { tenant: true },
  });

  if (!client) {
    return Response.json({
      error: 'invalid_client',
      error_description: 'Client not found',
    }, { status: 401 });
  }

  // Verify client secret (stored as bcrypt hash)
  const secretValid = await bcrypt.compare(client_secret, client.clientSecretHash);
  if (!secretValid) {
    await auditLogger.log({
      tenantId: client.tenantId,
      action: 'oauth.auth_failed',
      resource: 'oauth_client',
      resourceId: client_id,
      details: { reason: 'invalid_secret' },
    });

    return Response.json({
      error: 'invalid_client',
      error_description: 'Invalid client credentials',
    }, { status: 401 });
  }

  // Parse and validate requested scopes
  const requestedScopes = scope?.split(' ').filter(Boolean) ?? client.defaultScopes;
  const allowedScopes = client.allowedScopes;

  const grantedScopes = requestedScopes.filter(s => allowedScopes.includes(s));
  if (grantedScopes.length === 0) {
    return Response.json({
      error: 'invalid_scope',
      error_description: `Requested scopes not allowed. Available: ${allowedScopes.join(' ')}`,
    }, { status: 400 });
  }

  // Generate JWT access token
  const accessToken = jwt.sign(
    {
      sub: client.tenantId,
      client_id: client_id,
      scope: grantedScopes.join(' '),
      tenant_plan: client.tenant.plan,
    },
    process.env.OAUTH_JWT_SECRET!,
    {
      algorithm: 'RS256',
      expiresIn: '1h',
      issuer: 'https://tools.stone-ai.net',
      audience: 'https://api.tools.stone-ai.net',
      jwtid: randomUUID(),
    }
  );

  // Audit log
  await auditLogger.log({
    tenantId: client.tenantId,
    action: 'oauth.token_issued',
    resource: 'oauth_client',
    resourceId: client_id,
    details: { scopes: grantedScopes },
  });

  return Response.json({
    access_token: accessToken,
    token_type: 'bearer',
    expires_in: 3600,
    scope: grantedScopes.join(' '),
  });
}
```

### 4.3 JWT Validation in Gateway

```typescript
// File: src/gateway/auth/jwt-validator.ts

import jwt from 'jsonwebtoken';

interface JWTPayload {
  sub: string;        // tenantId
  client_id: string;
  scope: string;
  tenant_plan: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
  jti: string;
}

class JWTValidator {
  private publicKey: string;
  private revokedTokens: Set<string> = new Set();

  constructor() {
    this.publicKey = process.env.OAUTH_JWT_PUBLIC_KEY!;
  }

  async validate(token: string): Promise<JWTPayload> {
    // Verify signature and claims
    const payload = jwt.verify(token, this.publicKey, {
      algorithms: ['RS256'],
      issuer: 'https://tools.stone-ai.net',
      audience: 'https://api.tools.stone-ai.net',
    }) as JWTPayload;

    // Check if token has been revoked
    if (this.revokedTokens.has(payload.jti)) {
      throw new Error('Token has been revoked');
    }

    // Check Redis for revoked tokens (updated by admin actions)
    const isRevoked = await redis.sismember('revoked_tokens', payload.jti);
    if (isRevoked) {
      this.revokedTokens.add(payload.jti); // Cache locally
      throw new Error('Token has been revoked');
    }

    return payload;
  }
}
```

---

## 5. API Key Rotation

### 5.1 Zero-Downtime Key Rotation

```typescript
// File: src/services/key-rotation.ts

/**
 * Key rotation flow:
 * 1. Developer creates a new key
 * 2. Developer updates their application to use the new key
 * 3. Developer revokes the old key
 *
 * We also support "roll" which creates a new key with the same
 * scopes and a grace period where both old and new keys work.
 */

class KeyRotationService {
  async rollKey(tenantId: string, oldKeyId: string): Promise<RollResult> {
    const oldKey = await db.withTenant(tenantId, (tx) =>
      tx.apiKey.findUnique({
        where: { id: oldKeyId },
        select: {
          id: true,
          name: true,
          scopes: true,
          ipAllowlist: true,
          tenantId: true,
          createdBy: true,
        },
      })
    );

    if (!oldKey) {
      throw new NotFoundError('api_key_not_found', 'API key not found');
    }

    // Generate new key with same scopes
    const { fullKey, keyHash, keyPrefix } = generateApiKey();

    const [newKey] = await db.withTenant(tenantId, (tx) =>
      Promise.all([
        // Create new key
        tx.apiKey.create({
          data: {
            tenantId,
            name: `${oldKey.name} (rotated)`,
            keyHash,
            keyPrefix,
            scopes: oldKey.scopes,
            ipAllowlist: oldKey.ipAllowlist,
            createdBy: oldKey.createdBy,
            metadata: {
              rotatedFrom: oldKeyId,
              rotatedAt: new Date().toISOString(),
            },
          },
        }),

        // Mark old key for grace period expiry (24 hours)
        tx.apiKey.update({
          where: { id: oldKeyId },
          data: {
            metadata: {
              rotatedTo: 'pending', // Will be updated with new key ID
              gracePeriodEnds: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            },
          },
        }),
      ])
    );

    // Schedule old key revocation after grace period
    await jobQueue.add('api-key:revoke', { keyId: oldKeyId }, {
      delay: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Invalidate cache for old key
    await redis.del(`tenant:apikey:${oldKey.keyHash}`);

    await auditLogger.log({
      tenantId,
      action: 'api_key.rotated',
      resource: 'api_key',
      resourceId: oldKeyId,
      details: { newKeyId: newKey.id, gracePeriodHours: 24 },
    });

    return {
      newKey: {
        id: newKey.id,
        key: fullKey,    // Full key shown only once
        prefix: keyPrefix,
        scopes: oldKey.scopes,
      },
      oldKey: {
        id: oldKeyId,
        gracePeriodEnds: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    };
  }
}
```

---

## 6. Rate Limit Headers

### 6.1 Standard Rate Limit Response Headers

```typescript
// File: src/gateway/middleware/rate-limit-headers.ts

/**
 * Rate limit information is included in EVERY response.
 * This allows developers to implement client-side throttling.
 *
 * Headers follow the IETF draft:
 * https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/
 */

interface RateLimitInfo {
  limit: number;           // Max requests in window
  remaining: number;       // Remaining requests in window
  reset: number;           // Unix timestamp when window resets
  retryAfter?: number;     // Seconds to wait (only on 429)
}

function setRateLimitHeaders(res: Response, info: RateLimitInfo): void {
  // Standard headers (widely supported)
  res.headers.set('X-RateLimit-Limit', info.limit.toString());
  res.headers.set('X-RateLimit-Remaining', info.remaining.toString());
  res.headers.set('X-RateLimit-Reset', info.reset.toString());

  // IETF draft headers (newer standard)
  res.headers.set('RateLimit-Limit', info.limit.toString());
  res.headers.set('RateLimit-Remaining', info.remaining.toString());
  res.headers.set('RateLimit-Reset', info.reset.toString());

  // Plan info (helpful for developers)
  res.headers.set('X-RateLimit-Policy', `${info.limit};w=60`); // Per minute

  if (info.retryAfter !== undefined) {
    res.headers.set('Retry-After', info.retryAfter.toString());
  }
}

// 429 response body
function rateLimitExceededBody(info: RateLimitInfo, plan: string): object {
  return {
    error: {
      code: 'rate_limit_exceeded',
      message: `Rate limit of ${info.limit} requests per minute exceeded for ${plan} plan.`,
      limit: info.limit,
      remaining: 0,
      reset_at: new Date(info.reset * 1000).toISOString(),
      retry_after: info.retryAfter,
      upgrade_url: 'https://tools.stone-ai.net/pricing',
      docs_url: 'https://tools.stone-ai.net/docs/rate-limits',
    },
  };
}
```

---

## 7. Security Best Practices

### 7.1 Key Security Checklist

```
API Key Security Measures:

Storage:
[x] Keys hashed with SHA-256 before storage
[x] Only hash stored in database (never plaintext)
[x] Key prefix stored separately for identification
[x] Full key shown only once at creation time

Transport:
[x] TLS required for all API traffic (HTTPS only)
[x] HSTS header prevents downgrade attacks
[x] Keys transmitted via Authorization header (not URL params)
[x] Keys never logged (masked in all log entries)

Access Control:
[x] Scoped permissions (principle of least privilege)
[x] Per-key IP allowlisting (optional)
[x] Key expiration support
[x] Immediate revocation capability
[x] Tenant suspension disables all keys

Monitoring:
[x] Failed authentication attempts tracked
[x] Anomalous usage patterns trigger alerts
[x] Key usage audited (last used, frequency)
[x] Automatic lockout after repeated failures

Key Hygiene:
[x] Key rotation support with grace period
[x] Guidance to never embed keys in client-side code
[x] Guidance to use environment variables
[x] Maximum key age recommendations
```

### 7.2 Brute Force Protection

```typescript
// File: src/gateway/security/brute-force.ts

class BruteForceProtection {
  private readonly MAX_FAILURES = 10;
  private readonly WINDOW_MS = 60_000;   // 1 minute
  private readonly LOCKOUT_MS = 300_000; // 5 minutes

  async checkAndRecord(ip: string, keyPrefix: string, success: boolean): Promise<boolean> {
    const key = `auth_failures:${ip}`;

    if (success) {
      // Reset failure counter on success
      await redis.del(key);
      return true;
    }

    // Record failure
    const failures = await redis.incr(key);
    if (failures === 1) {
      await redis.pexpire(key, this.WINDOW_MS);
    }

    // Check if locked out
    if (failures >= this.MAX_FAILURES) {
      await redis.pexpire(key, this.LOCKOUT_MS);

      logger.warn('Auth brute force lockout', {
        ip,
        keyPrefix,
        failures,
        lockoutMs: this.LOCKOUT_MS,
      });

      // Alert security team for sustained attacks
      if (failures >= this.MAX_FAILURES * 3) {
        await alertSecurityTeam(ip, failures);
      }

      return false; // Locked out
    }

    return true; // Not yet locked out
  }

  async isLockedOut(ip: string): Promise<boolean> {
    const failures = parseInt(await redis.get(`auth_failures:${ip}`) ?? '0', 10);
    return failures >= this.MAX_FAILURES;
  }
}
```

### 7.3 Key Leak Detection

```typescript
// File: src/services/key-leak-detection.ts

/**
 * Detect leaked API keys from:
 * - GitHub secret scanning webhooks
 * - Manual reports
 * - Automated scanning
 */

class KeyLeakDetector {
  /**
   * Handle GitHub secret scanning alert.
   * GitHub detects our key format (sat_...) in public repos.
   */
  async handleGitHubAlert(alert: GitHubSecretAlert): Promise<void> {
    const { secret, source } = alert;

    // Hash the leaked key to find it in our database
    const keyHash = hashApiKey(secret);
    const apiKey = await db.raw.apiKey.findUnique({
      where: { keyHash },
      include: { tenant: true },
    });

    if (!apiKey) {
      logger.info('GitHub alert for unknown key', { prefix: secret.slice(0, 12) });
      return;
    }

    if (apiKey.revokedAt) {
      logger.info('GitHub alert for already-revoked key', { keyId: apiKey.id });
      return;
    }

    // Immediately revoke the leaked key
    await db.raw.apiKey.update({
      where: { id: apiKey.id },
      data: {
        revokedAt: new Date(),
        metadata: {
          revokedReason: 'leaked',
          leakSource: source,
          leakDetectedAt: new Date().toISOString(),
        },
      },
    });

    // Invalidate cache
    await redis.del(`tenant:apikey:${keyHash}`);

    // Notify tenant
    await sendEmail(apiKey.tenant.billingEmail, 'api-key-leaked', {
      keyPrefix: apiKey.keyPrefix,
      source: source,
      revokedAt: new Date().toISOString(),
      newKeyUrl: 'https://tools.stone-ai.net/dashboard/api-keys',
    });

    // Audit log
    await auditLogger.log({
      tenantId: apiKey.tenantId,
      action: 'api_key.leaked_and_revoked',
      resource: 'api_key',
      resourceId: apiKey.id,
      details: { source, leakDetectedAt: new Date().toISOString() },
    });

    logger.error('API key leaked and auto-revoked', {
      tenantId: apiKey.tenantId,
      keyId: apiKey.id,
      source,
    });
  }
}
```

---

## 8. Dashboard Session Authentication

```typescript
// File: src/app/api/dashboard/session-token/route.ts

/**
 * Short-lived tokens for the dashboard and playground.
 * Issued when a logged-in user (via Clerk) needs to make
 * API calls from the browser (e.g., playground).
 */

export async function POST(req: Request) {
  const { userId } = await requireClerkAuth(req);

  // Get user's tenant
  const membership = await db.raw.tenantMember.findFirst({
    where: { userId },
    include: { tenant: true },
  });

  if (!membership) {
    return Response.json({ error: 'no_tenant' }, { status: 403 });
  }

  // Issue a short-lived JWT for browser use
  const sessionToken = jwt.sign(
    {
      sub: membership.tenantId,
      userId,
      role: membership.role,
      scope: 'dashboard',
      type: 'session',
    },
    process.env.SESSION_JWT_SECRET!,
    {
      algorithm: 'HS256',
      expiresIn: '15m', // 15 minutes max
      issuer: 'tools.stone-ai.net',
    }
  );

  return Response.json({
    token: sessionToken,
    expiresIn: 900,
    type: 'session',
  });
}
```

---

## Summary

Stone AI Tools authentication is layered and defense-in-depth:

1. **API Keys**: Primary method — SHA-256 hashed storage, scoped permissions, IP allowlisting, automatic expiry
2. **OAuth2 Client Credentials**: For enterprise partners — RS256 JWT tokens, 1-hour expiry, scope validation
3. **Session Tokens**: For dashboard/playground — short-lived (15min), HS256, limited scope
4. **Key Rotation**: Zero-downtime rolling with 24-hour grace period
5. **Brute Force Protection**: IP-based lockout after 10 failures, security team alerts
6. **Leak Detection**: GitHub secret scanning integration, auto-revocation, tenant notification
7. **Rate Limit Headers**: Every response includes limit/remaining/reset information
8. **Audit Trail**: Every authentication event (success and failure) is logged
