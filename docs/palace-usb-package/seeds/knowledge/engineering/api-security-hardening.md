# API Security Hardening for Stone AI Tools

## Seed Classification
- **Domain**: Security Engineering
- **Platform**: Stone AI Tools (tools.stone-ai.net)
- **Complexity**: Advanced
- **Prerequisites**: OWASP, HTTP security, cryptography
- **Last Updated**: 2026-03-09

---

## 1. OWASP API Security Top 10 (2023)

### Threat Mitigation Matrix

```
OWASP API Top 10 — Stone AI Tools Coverage:

┌────┬──────────────────────────────────┬────────────┬─────────────────────────┐
│ #  │ Threat                           │ Risk       │ Mitigation              │
├────┼──────────────────────────────────┼────────────┼─────────────────────────┤
│ 1  │ Broken Object Level Auth (BOLA)  │ CRITICAL   │ RLS + tenant scoping    │
│ 2  │ Broken Authentication            │ CRITICAL   │ API key hashing, brute  │
│    │                                  │            │ force protection        │
│ 3  │ Broken Object Property Level Auth│ HIGH       │ Zod .strict(), explicit │
│    │                                  │            │ field selection         │
│ 4  │ Unrestricted Resource Consumption│ HIGH       │ Rate limiting, quotas,  │
│    │                                  │            │ request size limits     │
│ 5  │ Broken Function Level Auth       │ HIGH       │ Scoped permissions,     │
│    │                                  │            │ tier enforcement        │
│ 6  │ Unrestricted Access to Sensitive │ MEDIUM     │ Explicit field filtering│
│    │ Business Flows                   │            │ audit logging           │
│ 7  │ Server Side Request Forgery      │ HIGH       │ URL validation,         │
│    │ (SSRF)                           │            │ allowlisted domains     │
│ 8  │ Security Misconfiguration        │ MEDIUM     │ Hardened defaults, CSP, │
│    │                                  │            │ security headers        │
│ 9  │ Improper Inventory Management    │ LOW        │ OpenAPI spec as SSOT,   │
│    │                                  │            │ version tracking        │
│ 10 │ Unsafe Consumption of APIs       │ MEDIUM     │ Input validation on all │
│    │                                  │            │ upstream responses      │
└────┴──────────────────────────────────┴────────────┴─────────────────────────┘
```

---

## 2. Injection Prevention

### 2.1 Input Validation with Zod

```typescript
// File: src/lib/validation/schemas.ts

import { z } from 'zod';

// RULE: Every mutation endpoint uses Zod .strict()
// .strict() rejects unknown properties (prevents mass assignment)

const InvokeAgentSchema = z.object({
  prompt: z.string()
    .min(1, 'Prompt cannot be empty')
    .max(32_000, 'Prompt exceeds maximum length of 32,000 characters')
    .refine(
      (val) => !containsSqlInjection(val),
      'Input contains potentially dangerous patterns'
    ),
  context: z.record(z.unknown()).optional(),
  options: z.object({
    maxTokens: z.number().int().min(1).max(8000).default(1000),
    temperature: z.number().min(0).max(2).default(0.7),
    format: z.enum(['text', 'markdown', 'json', 'html']).default('text'),
    stream: z.boolean().default(false),
  }).strict().optional(),
}).strict();

const CreateWebhookSchema = z.object({
  url: z.string()
    .url('Must be a valid URL')
    .refine(
      (url) => {
        const parsed = new URL(url);
        // Block internal/private IPs (SSRF prevention)
        return !isPrivateUrl(parsed);
      },
      'URL must be a publicly accessible HTTPS endpoint'
    )
    .refine(
      (url) => new URL(url).protocol === 'https:',
      'Webhook URL must use HTTPS'
    ),
  events: z.array(z.enum([
    'agent.invocation.completed',
    'agent.invocation.failed',
    'usage.threshold.reached',
    'billing.payment.succeeded',
    'billing.payment.failed',
  ])).min(1, 'At least one event type is required'),
  description: z.string().max(500).optional(),
}).strict();

// SQL injection pattern detection
function containsSqlInjection(input: string): boolean {
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC)\b\s)/i,
    /(--|\/\*|\*\/|;)/,
    /(\bOR\b\s+\d+\s*=\s*\d+)/i,
    /('\s*(OR|AND)\s+')/i,
  ];

  // Only flag if multiple indicators present (reduce false positives)
  const matches = patterns.filter(p => p.test(input));
  return matches.length >= 2;
}
```

### 2.2 SSRF Prevention

```typescript
// File: src/lib/security/ssrf-protection.ts

import { isIP } from 'net';

const BLOCKED_IP_RANGES = [
  /^127\./,                    // Loopback
  /^10\./,                     // Private Class A
  /^172\.(1[6-9]|2\d|3[01])\./, // Private Class B
  /^192\.168\./,               // Private Class C
  /^169\.254\./,               // Link-local
  /^0\./,                      // Current network
  /^100\.(6[4-9]|[7-9]\d|1[0-1]\d|12[0-7])\./, // CGNAT
  /^::1$/,                     // IPv6 loopback
  /^fc00:/,                    // IPv6 ULA
  /^fe80:/,                    // IPv6 link-local
];

const BLOCKED_HOSTNAMES = [
  'localhost',
  'metadata.google.internal',
  'metadata.google.com',
  '169.254.169.254',          // AWS/GCP metadata service
  'metadata.azure.com',
];

function isPrivateUrl(url: URL): boolean {
  const hostname = url.hostname.toLowerCase();

  // Block known dangerous hostnames
  if (BLOCKED_HOSTNAMES.includes(hostname)) return true;

  // Block if hostname is an IP address in private range
  if (isIP(hostname)) {
    for (const pattern of BLOCKED_IP_RANGES) {
      if (pattern.test(hostname)) return true;
    }
  }

  // Block non-HTTPS (except in development)
  if (url.protocol !== 'https:' && process.env.NODE_ENV === 'production') {
    return true;
  }

  return false;
}

/**
 * Validate URL before making outbound requests (webhooks, etc.)
 * Resolves DNS and checks the resolved IP.
 */
async function validateOutboundUrl(url: string): Promise<void> {
  const parsed = new URL(url);

  if (isPrivateUrl(parsed)) {
    throw new SecurityError('ssrf_blocked', 'URL resolves to a private/internal address');
  }

  // DNS resolution check — the hostname might resolve to a private IP
  const { resolve4 } = await import('dns/promises');
  try {
    const addresses = await resolve4(parsed.hostname);
    for (const addr of addresses) {
      for (const pattern of BLOCKED_IP_RANGES) {
        if (pattern.test(addr)) {
          throw new SecurityError('ssrf_blocked', `URL resolves to blocked IP: ${addr}`);
        }
      }
    }
  } catch (error) {
    if (error instanceof SecurityError) throw error;
    // DNS resolution failed — might be okay (could be IPv6 only)
  }
}
```

---

## 3. CORS Configuration

### 3.1 CORS for API Endpoints

```typescript
// File: src/gateway/middleware/cors.ts

interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
  credentials: boolean;
}

const CORS_CONFIG: CorsConfig = {
  allowedOrigins: [
    'https://tools.stone-ai.net',
    'https://www.tools.stone-ai.net',
    'https://stone-ai.net',
    // Sandbox/development
    ...(process.env.NODE_ENV !== 'production'
      ? ['http://localhost:3000', 'http://localhost:3001']
      : []),
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Authorization',
    'Content-Type',
    'X-Request-ID',
    'X-API-Version',
  ],
  exposedHeaders: [
    'X-Request-ID',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
    'Retry-After',
    'Deprecation',
    'Sunset',
  ],
  maxAge: 86400, // 24 hours
  credentials: false, // API keys, not cookies
};

async function handleCors(req: GatewayRequest): Promise<PipelineResult> {
  const origin = req.raw.headers.origin as string | undefined;

  // No origin header = not a CORS request (server-to-server)
  if (!origin) return { action: 'continue' };

  // Check if origin is allowed
  const isAllowed = CORS_CONFIG.allowedOrigins.some(allowed => {
    if (allowed === '*') return true;
    return origin === allowed;
  });

  if (!isAllowed) {
    // Don't include CORS headers — browser will block
    return { action: 'continue' };
  }

  // Set CORS headers
  req.metadata.responseHeaders = {
    ...(req.metadata.responseHeaders as Record<string, string> ?? {}),
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': CORS_CONFIG.allowedMethods.join(', '),
    'Access-Control-Allow-Headers': CORS_CONFIG.allowedHeaders.join(', '),
    'Access-Control-Expose-Headers': CORS_CONFIG.exposedHeaders.join(', '),
    'Access-Control-Max-Age': CORS_CONFIG.maxAge.toString(),
  };

  // Handle preflight
  if (req.raw.method === 'OPTIONS') {
    return {
      action: 'short-circuit',
      statusCode: 204,
      headers: req.metadata.responseHeaders as Record<string, string>,
    };
  }

  return { action: 'continue' };
}
```

---

## 4. Request Validation

### 4.1 Request Size Limits

```typescript
// File: src/gateway/middleware/request-limits.ts

const REQUEST_LIMITS = {
  default: {
    maxBodySize: 1 * 1024 * 1024,    // 1MB default
    maxHeaderSize: 8 * 1024,           // 8KB headers
    maxUrlLength: 2048,                // 2KB URL
  },
  routes: {
    'invoke-agent': {
      maxBodySize: 5 * 1024 * 1024,   // 5MB for agent invocations (code context)
    },
    'create-webhook': {
      maxBodySize: 64 * 1024,          // 64KB for webhook config
    },
  },
};

async function enforceRequestLimits(req: GatewayRequest): Promise<PipelineResult> {
  // URL length
  if ((req.raw.url?.length ?? 0) > REQUEST_LIMITS.default.maxUrlLength) {
    return {
      action: 'short-circuit',
      statusCode: 414,
      body: { error: { code: 'url_too_long', message: 'Request URL exceeds maximum length' } },
    };
  }

  // Header size
  const headerSize = Object.entries(req.raw.headers)
    .reduce((sum, [k, v]) => sum + k.length + (typeof v === 'string' ? v.length : 0), 0);

  if (headerSize > REQUEST_LIMITS.default.maxHeaderSize) {
    return {
      action: 'short-circuit',
      statusCode: 431,
      body: { error: { code: 'headers_too_large', message: 'Request headers exceed maximum size' } },
    };
  }

  // Body size
  const contentLength = parseInt(req.raw.headers['content-length'] as string ?? '0', 10);
  const routeId = req.routeMatch?.route.id ?? 'default';
  const maxBody = (REQUEST_LIMITS.routes as any)[routeId]?.maxBodySize ?? REQUEST_LIMITS.default.maxBodySize;

  if (contentLength > maxBody) {
    return {
      action: 'short-circuit',
      statusCode: 413,
      body: {
        error: {
          code: 'request_too_large',
          message: `Request body (${formatBytes(contentLength)}) exceeds maximum (${formatBytes(maxBody)})`,
        },
      },
    };
  }

  return { action: 'continue' };
}
```

### 4.2 Content-Type Validation

```typescript
// File: src/gateway/middleware/content-type.ts

async function validateContentType(req: GatewayRequest): Promise<PipelineResult> {
  // Only check for methods that have bodies
  if (!['POST', 'PUT', 'PATCH'].includes(req.raw.method)) {
    return { action: 'continue' };
  }

  const contentType = req.raw.headers['content-type'] as string | undefined;

  // Require Content-Type for body methods
  if (!contentType) {
    return {
      action: 'short-circuit',
      statusCode: 415,
      body: {
        error: {
          code: 'missing_content_type',
          message: 'Content-Type header is required for POST/PUT/PATCH requests. Use application/json.',
        },
      },
    };
  }

  // Only accept application/json
  if (!contentType.includes('application/json')) {
    return {
      action: 'short-circuit',
      statusCode: 415,
      body: {
        error: {
          code: 'unsupported_content_type',
          message: `Content-Type ${contentType} is not supported. Use application/json.`,
        },
      },
    };
  }

  return { action: 'continue' };
}
```

---

## 5. Abuse Detection

### 5.1 Anomaly Detection

```typescript
// File: src/gateway/security/anomaly-detector.ts

class AnomalyDetector {
  /**
   * Detect abnormal request patterns that may indicate abuse.
   */
  async analyze(req: GatewayRequest): Promise<AnomalyResult> {
    const tenantId = req.tenantId;
    if (!tenantId) return { suspicious: false };

    const signals: AnomalySignal[] = [];

    // 1. Unusual request rate (sudden spike)
    const recentRate = await this.getRecentRequestRate(tenantId);
    const historicalRate = await this.getHistoricalRequestRate(tenantId);
    if (recentRate > historicalRate * 5) {
      signals.push({
        type: 'rate_spike',
        severity: 'medium',
        details: { recentRate, historicalRate },
      });
    }

    // 2. Many different endpoints in short time (scanning)
    const uniqueEndpoints = await this.getUniqueEndpointsInWindow(tenantId, 60_000);
    if (uniqueEndpoints > 20) {
      signals.push({
        type: 'endpoint_scanning',
        severity: 'high',
        details: { uniqueEndpoints },
      });
    }

    // 3. High error rate (brute forcing or fuzzing)
    const errorRate = await this.getRecentErrorRate(tenantId);
    if (errorRate > 0.5) {
      signals.push({
        type: 'high_error_rate',
        severity: 'medium',
        details: { errorRate },
      });
    }

    // 4. Requests from many different IPs (credential sharing)
    const uniqueIps = await this.getUniqueIpsInWindow(tenantId, 3600_000);
    if (uniqueIps > 50) {
      signals.push({
        type: 'ip_diversity',
        severity: 'low',
        details: { uniqueIps },
      });
    }

    if (signals.length > 0) {
      const maxSeverity = signals.reduce(
        (max, s) => SEVERITY_ORDER[s.severity] > SEVERITY_ORDER[max] ? s.severity : max,
        'low' as string
      );

      // Log for security review
      logger.warn('Anomaly detected', {
        tenantId,
        signals,
        maxSeverity,
        requestId: req.metadata.requestId,
      });

      // Auto-block on critical severity
      if (maxSeverity === 'critical') {
        await this.blockTenant(tenantId, signals);
      }

      return {
        suspicious: true,
        signals,
        severity: maxSeverity,
      };
    }

    return { suspicious: false };
  }

  private async getRecentRequestRate(tenantId: string): Promise<number> {
    const key = `anomaly:rate:${tenantId}`;
    const count = parseInt(await redis.get(key) ?? '0', 10);
    return count;
  }

  private async getRecentErrorRate(tenantId: string): Promise<number> {
    const total = parseInt(await redis.get(`anomaly:total:${tenantId}`) ?? '1', 10);
    const errors = parseInt(await redis.get(`anomaly:errors:${tenantId}`) ?? '0', 10);
    return errors / Math.max(total, 1);
  }
}

const SEVERITY_ORDER: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};
```

---

## 6. IP Allowlisting

### 6.1 Per-Tenant IP Allowlisting

```typescript
// File: src/gateway/security/ip-allowlist.ts

class IpAllowlistService {
  async checkIpAllowlist(req: GatewayRequest): Promise<PipelineResult> {
    const allowlist = req.metadata.ipAllowlist as string[] ?? [];

    // No allowlist configured = all IPs allowed
    if (allowlist.length === 0) return { action: 'continue' };

    const clientIp = this.getClientIp(req);

    const isAllowed = allowlist.some(entry => {
      if (entry.includes('/')) {
        // CIDR notation: 203.0.113.0/24
        return this.isIpInCidr(clientIp, entry);
      }
      // Exact IP match
      return clientIp === entry;
    });

    if (!isAllowed) {
      logger.warn('IP not in allowlist', {
        tenantId: req.tenantId,
        clientIp,
        allowlist,
      });

      return {
        action: 'short-circuit',
        statusCode: 403,
        body: {
          error: {
            code: 'ip_not_allowed',
            message: `Request from IP ${clientIp} is not in the allowlist for this API key.`,
            help: 'Update your API key IP allowlist in the dashboard.',
            docs_url: 'https://tools.stone-ai.net/docs/authentication#ip-allowlist',
          },
        },
      };
    }

    return { action: 'continue' };
  }

  private getClientIp(req: GatewayRequest): string {
    // Trust Cloudflare's CF-Connecting-IP header
    return (req.raw.headers['cf-connecting-ip'] as string) ??
           (req.raw.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ??
           req.raw.ip;
  }

  private isIpInCidr(ip: string, cidr: string): boolean {
    const [range, bits] = cidr.split('/');
    const mask = ~(Math.pow(2, 32 - parseInt(bits, 10)) - 1);
    const ipNum = this.ipToNumber(ip);
    const rangeNum = this.ipToNumber(range);
    return (ipNum & mask) === (rangeNum & mask);
  }

  private ipToNumber(ip: string): number {
    return ip.split('.').reduce((sum, octet) => (sum << 8) + parseInt(octet, 10), 0) >>> 0;
  }
}
```

---

## 7. Security Headers

```typescript
// File: src/gateway/middleware/security-headers.ts

function setSecurityHeaders(res: GatewayResponse): void {
  // Prevent caching of authenticated responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');

  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0'); // Disabled — use CSP instead
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // HSTS (force HTTPS)
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  // Content Security Policy for API responses
  res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");

  // Prevent content sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Remove server identification
  res.removeHeader('X-Powered-By');
  res.removeHeader('Server');
}
```

---

## 8. API Key Security

```typescript
// File: src/lib/security/key-security.ts

// Key security measures:

// 1. Never log full API keys
function sanitizeForLogging(obj: Record<string, unknown>): Record<string, unknown> {
  const result = { ...obj };
  for (const [key, value] of Object.entries(result)) {
    if (typeof value === 'string' && value.startsWith('sat_')) {
      result[key] = `${value.slice(0, 12)}...`;
    }
    if (key.toLowerCase().includes('key') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('token')) {
      if (typeof value === 'string' && value.length > 8) {
        result[key] = `${value.slice(0, 4)}...[REDACTED]`;
      }
    }
  }
  return result;
}

// 2. Constant-time comparison for key verification
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// 3. Key entropy validation
function validateKeyEntropy(key: string): boolean {
  // Ensure key has sufficient randomness
  const uniqueChars = new Set(key).size;
  return uniqueChars >= 20; // At least 20 unique characters
}
```

---

## 9. Rate Limiting as Security

```typescript
// Security-focused rate limiting (separate from billing rate limits)

const SECURITY_RATE_LIMITS = {
  // Auth endpoint protection
  'auth-failures': {
    window: 60_000,      // 1 minute
    maxAttempts: 10,     // 10 failed attempts
    lockoutDuration: 300_000, // 5 minute lockout
  },

  // API key creation (prevent mass key generation)
  'key-creation': {
    window: 3600_000,    // 1 hour
    maxAttempts: 10,     // 10 keys per hour
  },

  // Webhook creation (prevent SSRF scanning)
  'webhook-creation': {
    window: 3600_000,
    maxAttempts: 20,
  },

  // Account creation (prevent spam accounts)
  'account-creation': {
    window: 86400_000,   // 1 day
    maxPerIp: 3,         // 3 accounts per IP per day
  },
};
```

---

## 10. Security Audit Checklist

```
Pre-Launch Security Checklist:

Authentication:
[x] API keys hashed with SHA-256 (never plaintext storage)
[x] Brute force protection (IP-based lockout)
[x] Key leak detection (GitHub secret scanning)
[x] Constant-time comparison for key validation
[x] API key rotation with zero-downtime grace period

Authorization:
[x] Row-Level Security (RLS) on all tenant tables
[x] Application-level tenant scoping (defense in depth)
[x] Scoped permissions per API key
[x] Tier-based agent access enforcement
[x] Cross-tenant query prevention middleware

Input Validation:
[x] Zod .strict() on all mutation schemas
[x] Request size limits per endpoint
[x] Content-Type enforcement
[x] SQL injection pattern detection
[x] SSRF prevention for webhook URLs

Transport:
[x] TLS-only (HSTS with preload)
[x] Security headers (CSP, X-Frame-Options, etc.)
[x] CORS properly configured

Rate Limiting:
[x] Per-tenant rate limits (token bucket)
[x] Per-endpoint rate limits
[x] Auth failure rate limiting
[x] Spending caps and usage quotas

Monitoring:
[x] Anomaly detection for abuse patterns
[x] Audit logging for all auth events
[x] Security alerts for suspicious activity
[x] IP allowlisting per API key

Data Protection:
[x] Sensitive field redaction in logs
[x] No API keys in URLs
[x] GDPR data export capability
[x] Tenant data deletion (hard delete with grace period)
```

---

## Summary

Stone AI Tools API security is layered defense-in-depth:

1. **OWASP API Top 10**: Every threat addressed with specific mitigations
2. **Injection Prevention**: Zod strict validation, SQL pattern detection, SSRF blocking
3. **CORS**: Strict origin allowlist, proper preflight handling, exposed rate limit headers
4. **Request Validation**: Size limits, content-type enforcement, URL length limits
5. **Abuse Detection**: Anomaly scoring (rate spikes, scanning, error rates, IP diversity)
6. **IP Allowlisting**: Per-API-key CIDR and exact IP filtering
7. **Security Headers**: HSTS, CSP, X-Content-Type-Options, no server identification
8. **Key Security**: SHA-256 hashing, constant-time comparison, entropy validation, log redaction
