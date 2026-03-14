# Secrets Management

## Palace Knowledge Seed — Advanced Backend Engineering

### Overview

Secrets management is a non-negotiable security discipline. One leaked API key can compromise the entire platform. This seed covers environment variables, Vercel env configuration, rotation strategies, vault patterns, and the absolute rule: never hardcode secrets. All patterns are for the Stone AI stack (Next.js 16, Vercel, Neon, Clerk, Stripe, Anthropic).

---

## 1. The Cardinal Rule

**Never hardcode secrets. Not in code, not in comments, not in commits, not even temporarily.**

```typescript
// NEVER do this:
const apiKey = 'sk-ant-api03-XXXXXXXXX'; // CATASTROPHIC
const dbUrl = 'postgresql://user:password@host/db'; // CATASTROPHIC

// ALWAYS do this:
const apiKey = process.env.ANTHROPIC_API_KEY!;
const dbUrl = process.env.DATABASE_URL!;
```

---

## 2. Environment Variable Architecture

### Stone AI Secret Categories

```
CRITICAL (compromise = total breach):
├── DATABASE_URL
├── DIRECT_DATABASE_URL
├── CLERK_SECRET_KEY
├── STRIPE_SECRET_KEY
├── ANTHROPIC_API_KEY
├── AES_ENCRYPTION_KEY
└── ALERT_EMAIL_APP_PASSWORD

IMPORTANT (compromise = feature breach):
├── CLERK_WEBHOOK_SECRET
├── STRIPE_WEBHOOK_SECRET
├── R2_ACCESS_KEY_ID
├── R2_SECRET_ACCESS_KEY
├── REDIS_URL
├── VLLM_URL
└── CRON_SECRET

PUBLIC (safe to expose):
├── NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
├── NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
├── NEXT_PUBLIC_APP_URL
└── NEXT_PUBLIC_CLERK_SIGN_IN_URL
```

### Local Development

```env
# .env.local (NEVER committed to git)

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/stoneai?schema=public"
DIRECT_DATABASE_URL="postgresql://user:pass@localhost:5432/stoneai?schema=public"

# Auth
CLERK_SECRET_KEY="sk_test_xxxxx"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_xxxxx"
CLERK_WEBHOOK_SECRET="whsec_xxxxx"

# Payments
STRIPE_SECRET_KEY="sk_test_xxxxx"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_xxxxx"
STRIPE_WEBHOOK_SECRET="whsec_xxxxx"

# AI
ANTHROPIC_API_KEY="sk-ant-api03-xxxxx"
VLLM_URL="http://localhost:8000"

# Storage
R2_ENDPOINT="https://xxxx.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="xxxxx"
R2_SECRET_ACCESS_KEY="xxxxx"
R2_BUCKET="stone-ai-uploads"
R2_PUBLIC_URL="https://uploads.stone-ai.net"

# Redis
REDIS_URL="redis://localhost:6379"

# Email
ALERT_EMAIL="3headedm@gmail.com"
ALERT_EMAIL_APP_PASSWORD="xxxxx"

# Security
AES_ENCRYPTION_KEY="xxxxx"
CRON_SECRET="xxxxx"

# Founder
FOUNDER_CLERK_ID="user_xxxxx"
```

---

## 3. Vercel Environment Configuration

### Environment Scoping

```typescript
// Vercel supports three environment scopes:
// - Production: only production deployments
// - Preview: PR preview deployments
// - Development: `vercel dev` local runs

// CRITICAL: Production secrets should ONLY be in Production scope
// Preview should use TEST mode keys (Stripe test, Clerk dev, etc.)

// Vercel CLI setup:
// vercel env add STRIPE_SECRET_KEY production
// vercel env add STRIPE_SECRET_KEY preview (test mode key)
```

### Vercel Environment Variables Best Practices

```typescript
// src/lib/env.ts
import { z } from 'zod';

// Validate ALL environment variables at startup
const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),
  DIRECT_DATABASE_URL: z.string().url(),

  // Auth
  CLERK_SECRET_KEY: z.string().startsWith('sk_'),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  CLERK_WEBHOOK_SECRET: z.string().min(1),

  // Payments
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),

  // AI
  ANTHROPIC_API_KEY: z.string().min(1),
  VLLM_URL: z.string().url().optional(),

  // Storage
  R2_ENDPOINT: z.string().url(),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET: z.string().min(1),

  // Redis
  REDIS_URL: z.string().min(1),

  // Email
  ALERT_EMAIL: z.string().email(),
  ALERT_EMAIL_APP_PASSWORD: z.string().min(1),

  // Security
  AES_ENCRYPTION_KEY: z.string().min(32),
  CRON_SECRET: z.string().min(16),

  // Founder
  FOUNDER_CLERK_ID: z.string().min(1),

  // Node
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type Env = z.infer<typeof envSchema>;

// Validate on import — fail fast if secrets are missing
let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) {
    const parsed = envSchema.safeParse(process.env);

    if (!parsed.success) {
      const missing = parsed.error.issues.map(
        (i) => `  ${i.path.join('.')}: ${i.message}`
      );
      console.error(
        `[ENV] Missing or invalid environment variables:\n${missing.join('\n')}`
      );

      // In production, this is fatal
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Missing required environment variables');
      }
    }

    _env = parsed.data ?? (process.env as unknown as Env);
  }

  return _env;
}

// Usage
const env = getEnv();
const stripeKey = env.STRIPE_SECRET_KEY;
```

---

## 4. Secret Rotation

### Rotation Strategy

```typescript
// src/lib/secrets/rotation.ts

interface SecretRotationConfig {
  name: string;
  rotationIntervalDays: number;
  lastRotated: Date;
  rotationSteps: string[];
}

const ROTATION_CONFIGS: SecretRotationConfig[] = [
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    rotationIntervalDays: 90,
    lastRotated: new Date('2026-01-01'),
    rotationSteps: [
      '1. Go to Stripe Dashboard → Webhooks',
      '2. Roll the signing secret (Stripe supports two active secrets during rotation)',
      '3. Update STRIPE_WEBHOOK_SECRET in Vercel env (Production)',
      '4. Deploy and verify webhook processing works',
      '5. Expire the old secret in Stripe',
    ],
  },
  {
    name: 'CLERK_WEBHOOK_SECRET',
    rotationIntervalDays: 90,
    lastRotated: new Date('2026-01-01'),
    rotationSteps: [
      '1. Go to Clerk Dashboard → Webhooks',
      '2. Create new webhook endpoint (or rotate existing)',
      '3. Update CLERK_WEBHOOK_SECRET in Vercel env',
      '4. Deploy and verify',
    ],
  },
  {
    name: 'R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY',
    rotationIntervalDays: 180,
    lastRotated: new Date('2026-01-01'),
    rotationSteps: [
      '1. Go to Cloudflare Dashboard → R2 → API Tokens',
      '2. Create new API token',
      '3. Update R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY in Vercel',
      '4. Deploy and verify uploads work',
      '5. Revoke old API token',
    ],
  },
  {
    name: 'AES_ENCRYPTION_KEY',
    rotationIntervalDays: 365,
    lastRotated: new Date('2026-01-01'),
    rotationSteps: [
      '1. Generate new AES-256 key',
      '2. Add both old and new keys to env (AES_ENCRYPTION_KEY_NEW)',
      '3. Deploy with dual-key support (decrypt with old or new, encrypt with new)',
      '4. Run re-encryption migration for all encrypted data',
      '5. Remove old key from env',
    ],
  },
];

function getSecretsNeedingRotation(): SecretRotationConfig[] {
  const now = new Date();
  return ROTATION_CONFIGS.filter((config) => {
    const daysSinceRotation = Math.floor(
      (now.getTime() - config.lastRotated.getTime()) / (1000 * 3600 * 24)
    );
    return daysSinceRotation >= config.rotationIntervalDays;
  });
}
```

### Dual-Key Decryption During Rotation

```typescript
// src/lib/secrets/dual-key.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const CURRENT_KEY = process.env.AES_ENCRYPTION_KEY!;
const PREVIOUS_KEY = process.env.AES_ENCRYPTION_KEY_PREVIOUS; // Set during rotation

export function encrypt(plaintext: string): string {
  const iv = randomBytes(16);
  const cipher = createCipheriv(
    'aes-256-gcm',
    Buffer.from(CURRENT_KEY, 'hex'),
    iv
  );

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  // Format: iv:authTag:ciphertext:version
  return `${iv.toString('hex')}:${authTag}:${encrypted}:v2`;
}

export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const version = parts[3] ?? 'v1';

  // Try current key first
  try {
    return decryptWithKey(iv, authTag, encrypted, CURRENT_KEY);
  } catch {
    // Fall back to previous key during rotation period
    if (PREVIOUS_KEY) {
      try {
        return decryptWithKey(iv, authTag, encrypted, PREVIOUS_KEY);
      } catch {
        throw new Error('Decryption failed with both current and previous keys');
      }
    }
    throw new Error('Decryption failed');
  }
}

function decryptWithKey(
  iv: Buffer,
  authTag: Buffer,
  encrypted: string,
  key: string
): string {
  const decipher = createDecipheriv(
    'aes-256-gcm',
    Buffer.from(key, 'hex'),
    iv
  );
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

---

## 5. .gitignore Protection

```gitignore
# .gitignore — CRITICAL: Never commit secrets

# Environment files
.env
.env.local
.env.*.local
.env.development
.env.production
.env.test

# Credentials
*.pem
*.key
*.cert
credentials.json
service-account.json

# IDE settings that might contain secrets
.vscode/settings.json
.idea/

# OS files
.DS_Store
Thumbs.db
```

### Pre-Commit Hook for Secret Detection

```bash
#!/bin/bash
# .husky/pre-commit

# Check for common secret patterns
PATTERNS=(
  "sk_live_"      # Stripe live key
  "sk-ant-api"    # Anthropic key
  "sk_test_"      # Stripe test key
  "AKIA"          # AWS access key
  "password.*=.*['\"]" # Inline passwords
  "secret.*=.*['\"]"   # Inline secrets
)

for pattern in "${PATTERNS[@]}"; do
  if git diff --cached --diff-filter=ACMR | grep -qiE "$pattern"; then
    echo "ERROR: Potential secret detected in staged files!"
    echo "Pattern matched: $pattern"
    echo "Please remove secrets before committing."
    exit 1
  fi
done
```

---

## 6. Runtime Secret Access Patterns

```typescript
// src/lib/secrets/access.ts

// Pattern 1: Lazy loading — don't access secrets until needed
class SecretAccessor {
  private cache = new Map<string, string>();

  get(name: string): string {
    if (this.cache.has(name)) return this.cache.get(name)!;

    const value = process.env[name];
    if (!value) {
      throw new Error(`Missing required secret: ${name}`);
    }

    this.cache.set(name, value);
    return value;
  }

  // For optional secrets with fallback
  getOptional(name: string, fallback: string): string {
    return process.env[name] ?? fallback;
  }
}

export const secrets = new SecretAccessor();

// Pattern 2: Never log secrets
export function safeLog(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = [
    'password', 'secret', 'token', 'key', 'authorization',
    'cookie', 'credential', 'apiKey', 'api_key',
  ];

  const safe = { ...data };

  for (const key of Object.keys(safe)) {
    if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
      safe[key] = '[REDACTED]';
    }
  }

  return safe;
}

// Pattern 3: Secure secret comparison (timing-safe)
import { timingSafeEqual } from 'crypto';

export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  return timingSafeEqual(
    Buffer.from(a, 'utf-8'),
    Buffer.from(b, 'utf-8')
  );
}

// Usage: webhook signature verification
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  return secureCompare(signature, expected);
}
```

---

## 7. Cron Secret Protection

```typescript
// src/app/api/cron/daily/route.ts

export async function GET(req: Request) {
  // Vercel Cron sends a secret header
  const authHeader = req.headers.get('authorization');

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Don't reveal that this is a cron endpoint
    return new Response('Not Found', { status: 404 });
  }

  // Process cron job...
  return Response.json({ success: true });
}
```

---

## 8. Secret Audit and Monitoring

```typescript
// src/lib/secrets/audit.ts

// Track secret access for auditing
export async function auditSecretAccess(
  secretName: string,
  accessedBy: string,
  context: string
): Promise<void> {
  // Log to structured logger (Pino)
  logger.info({
    audit: true,
    type: 'SECRET_ACCESS',
    secret: secretName, // Name only, never the value
    accessedBy,
    context,
    timestamp: new Date().toISOString(),
  });
}

// Check for exposed secrets in error responses
export function sanitizeErrorResponse(error: any): string {
  let message = String(error?.message ?? error);

  // Strip anything that looks like a secret
  const patterns = [
    /sk_[a-zA-Z0-9_-]{20,}/g,     // Stripe keys
    /sk-ant-[a-zA-Z0-9_-]{20,}/g, // Anthropic keys
    /sai_[a-zA-Z0-9_-]{20,}/g,    // Stone AI API keys
    /postgresql:\/\/[^@\s]+@/g,    // Connection strings
    /redis:\/\/[^@\s]+@/g,         // Redis URLs
    /Bearer [a-zA-Z0-9._-]{20,}/g, // JWT/Bearer tokens
  ];

  for (const pattern of patterns) {
    message = message.replace(pattern, '[REDACTED]');
  }

  return message;
}
```

---

## 9. Emergency Secret Revocation

```typescript
// src/lib/secrets/emergency.ts

// If a secret is compromised, this is the runbook:
const REVOCATION_RUNBOOK = {
  DATABASE_URL: [
    '1. Reset password in Neon dashboard immediately',
    '2. Update DATABASE_URL in Vercel env (Production)',
    '3. Redeploy all environments',
    '4. Audit recent database access logs',
    '5. Check for data exfiltration',
  ],
  STRIPE_SECRET_KEY: [
    '1. Roll Stripe API key in Stripe Dashboard immediately',
    '2. Update STRIPE_SECRET_KEY in Vercel env',
    '3. Redeploy',
    '4. Review recent Stripe API logs for unauthorized activity',
    '5. Notify affected users if payment data was at risk',
  ],
  ANTHROPIC_API_KEY: [
    '1. Revoke key in Anthropic Console',
    '2. Generate new key',
    '3. Update ANTHROPIC_API_KEY in Vercel env',
    '4. Redeploy',
    '5. Check API usage for unauthorized calls',
  ],
  CLERK_SECRET_KEY: [
    '1. Rotate key in Clerk Dashboard → API Keys',
    '2. Update CLERK_SECRET_KEY in Vercel env',
    '3. Redeploy',
    '4. Force-expire all active sessions (Clerk Dashboard)',
    '5. Audit sign-in logs for suspicious activity',
  ],
  AES_ENCRYPTION_KEY: [
    '1. Generate new key immediately',
    '2. Set old key as AES_ENCRYPTION_KEY_PREVIOUS',
    '3. Set new key as AES_ENCRYPTION_KEY',
    '4. Deploy with dual-key support',
    '5. Run re-encryption migration for ALL encrypted data',
    '6. Remove old key after re-encryption completes',
    '7. Assess what data may have been decrypted',
  ],
};
```

---

## Summary

| Principle | Implementation | Stone AI Practice |
|-----------|---------------|------------------|
| Never hardcode | Environment variables only | `.env.local` + Vercel env |
| Validate at startup | Zod schema validation | Fail fast if secrets missing |
| Scope correctly | Production vs Preview | Live keys only in Production |
| Rotate regularly | 90-day cycle | Automated reminders |
| Dual-key during rotation | Previous key fallback | AES key rotation pattern |
| Pre-commit scanning | Husky hook | Block secret commits |
| Timing-safe comparison | `timingSafeEqual` | Webhook verification |
| Sanitize errors | Regex redaction | Never leak in responses |
| Audit access | Structured logging | Track who uses what |
| Emergency runbook | Per-secret procedures | Ready for any compromise |

Secrets management is a continuous discipline, not a one-time setup. Every secret in Stone AI has a defined owner, rotation schedule, and revocation procedure.
