# Authentication & Authorization — Deep Dive

## Palace Knowledge Seed — Advanced Backend Engineering

### Overview

Auth is the gatekeeper for Stone AI. This seed covers Clerk webhook handling, RBAC patterns, the 5-tier permission system (FREE through PRO), session management, API key authentication, middleware chains, and secure patterns for the Stone AI stack (Next.js 16, Clerk, Prisma 7.4.2, PostgreSQL 16).

---

## 1. Clerk Integration Architecture

### Webhook Handling

```typescript
// src/app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const payload = await req.text();
  const headerPayload = await headers();

  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent;
  } catch {
    authLogger.error('Clerk webhook signature verification failed');
    return new Response('Invalid signature', { status: 401 });
  }

  // Process webhook event
  try {
    switch (evt.type) {
      case 'user.created':
        await handleUserCreated(evt.data);
        break;
      case 'user.updated':
        await handleUserUpdated(evt.data);
        break;
      case 'user.deleted':
        await handleUserDeleted(evt.data);
        break;
      case 'session.created':
        await handleSessionCreated(evt.data);
        break;
      case 'session.ended':
        await handleSessionEnded(evt.data);
        break;
      default:
        authLogger.debug({ type: evt.type }, 'Unhandled Clerk webhook event');
    }

    return new Response('OK', { status: 200 });
  } catch (error: any) {
    authLogger.error({ err: error, type: evt.type }, 'Clerk webhook processing failed');
    return new Response('Processing error', { status: 500 });
  }
}

async function handleUserCreated(data: any): Promise<void> {
  const { id, email_addresses, first_name, last_name, image_url } = data;
  const primaryEmail = email_addresses?.[0]?.email_address;

  await prisma.user.create({
    data: {
      clerkId: id,
      email: primaryEmail ?? '',
      name: [first_name, last_name].filter(Boolean).join(' ') || 'User',
      avatarUrl: image_url,
      tier: 'FREE',
      role: 'user',
      onboardingComplete: false,
      createdAt: new Date(),
    },
  });

  authLogger.info({ clerkId: id, email: primaryEmail }, 'User created from Clerk webhook');
}

async function handleUserUpdated(data: any): Promise<void> {
  const { id, email_addresses, first_name, last_name, image_url } = data;
  const primaryEmail = email_addresses?.[0]?.email_address;

  await prisma.user.update({
    where: { clerkId: id },
    data: {
      email: primaryEmail,
      name: [first_name, last_name].filter(Boolean).join(' '),
      avatarUrl: image_url,
      updatedAt: new Date(),
    },
  });
}

async function handleUserDeleted(data: any): Promise<void> {
  const { id } = data;

  // Soft delete — preserve audit trail
  await prisma.user.update({
    where: { clerkId: id },
    data: {
      deletedAt: new Date(),
      email: `deleted-${id}@stone-ai.net`,
      name: 'Deleted User',
    },
  });

  authLogger.info({ clerkId: id }, 'User soft-deleted from Clerk webhook');
}
```

---

## 2. Tier-Based Access Control (TBAC)

### Tier Hierarchy

```typescript
// src/lib/auth/tiers.ts

export const TIERS = ['FREE', 'STARTER', 'PLUS', 'SMART', 'PRO'] as const;
export type Tier = (typeof TIERS)[number];

// Numeric rank for comparison
const TIER_RANK: Record<Tier, number> = {
  FREE: 0,
  STARTER: 1,
  PLUS: 2,
  SMART: 3,
  PRO: 4,
};

export function tierRank(tier: string): number {
  return TIER_RANK[tier as Tier] ?? 0;
}

export function hasTierAccess(userTier: string, requiredTier: string): boolean {
  return tierRank(userTier) >= tierRank(requiredTier);
}

// Agent access by tier
const TIER_AGENT_LIMITS: Record<Tier, number> = {
  FREE: 4,
  STARTER: 16,
  PLUS: 30,
  SMART: 39,
  PRO: 38,
};

export function getAgentLimit(tier: string): number {
  return TIER_AGENT_LIMITS[tier as Tier] ?? 4;
}

export function canAccessAgent(userTier: string, agentNumber: number): boolean {
  const limit = getAgentLimit(userTier);
  return agentNumber <= limit;
}

// Feature access matrix
interface TierFeatures {
  maxBesties: number;
  hasForumAccess: boolean;
  hasApiAccess: boolean;
  hasCustomBackdrops: boolean;
  hasPremiumBackdrops: boolean;
  maxFileUploadMB: number;
  hasSemanticSearch: boolean;
  maxConversationHistory: number;
}

const TIER_FEATURES: Record<Tier, TierFeatures> = {
  FREE: {
    maxBesties: 0,
    hasForumAccess: true,
    hasApiAccess: false,
    hasCustomBackdrops: false,
    hasPremiumBackdrops: false,
    maxFileUploadMB: 5,
    hasSemanticSearch: false,
    maxConversationHistory: 10,
  },
  STARTER: {
    maxBesties: 1,
    hasForumAccess: true,
    hasApiAccess: false,
    hasCustomBackdrops: true,
    hasPremiumBackdrops: false,
    maxFileUploadMB: 25,
    hasSemanticSearch: false,
    maxConversationHistory: 50,
  },
  PLUS: {
    maxBesties: 1,
    hasForumAccess: true,
    hasApiAccess: true,
    hasCustomBackdrops: true,
    hasPremiumBackdrops: true,
    maxFileUploadMB: 50,
    hasSemanticSearch: true,
    maxConversationHistory: 200,
  },
  SMART: {
    maxBesties: 1,
    hasForumAccess: true,
    hasApiAccess: true,
    hasCustomBackdrops: true,
    hasPremiumBackdrops: true,
    maxFileUploadMB: 100,
    hasSemanticSearch: true,
    maxConversationHistory: 500,
  },
  PRO: {
    maxBesties: 1,
    hasForumAccess: true,
    hasApiAccess: true,
    hasCustomBackdrops: true,
    hasPremiumBackdrops: true,
    maxFileUploadMB: 200,
    hasSemanticSearch: true,
    maxConversationHistory: -1, // Unlimited
  },
};

export function getTierFeatures(tier: string): TierFeatures {
  return TIER_FEATURES[tier as Tier] ?? TIER_FEATURES.FREE;
}
```

---

## 3. RBAC (Role-Based Access Control)

```typescript
// src/lib/auth/rbac.ts

export type Role = 'user' | 'moderator' | 'admin' | 'founder';

interface Permission {
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  user: [
    { resource: 'profile', action: 'read' },
    { resource: 'profile', action: 'update' },
    { resource: 'conversation', action: 'create' },
    { resource: 'conversation', action: 'read' },
    { resource: 'forum.post', action: 'create' },
    { resource: 'forum.post', action: 'read' },
    { resource: 'settings', action: 'read' },
    { resource: 'settings', action: 'update' },
  ],
  moderator: [
    // Inherits all 'user' permissions plus:
    { resource: 'forum.post', action: 'delete' },
    { resource: 'forum.post', action: 'update' },
    { resource: 'user.profile', action: 'read' },
    { resource: 'reports', action: 'read' },
    { resource: 'reports', action: 'update' },
  ],
  admin: [
    // Inherits all 'moderator' permissions plus:
    { resource: 'users', action: 'manage' },
    { resource: 'agents', action: 'manage' },
    { resource: 'billing', action: 'read' },
    { resource: 'analytics', action: 'read' },
    { resource: 'settings.global', action: 'manage' },
  ],
  founder: [
    // Everything
    { resource: '*', action: 'manage' },
  ],
};

export function hasPermission(
  role: Role,
  resource: string,
  action: string
): boolean {
  // Founder has all permissions
  if (role === 'founder') return true;

  // Check role hierarchy
  const roles = getRoleHierarchy(role);

  for (const r of roles) {
    const permissions = ROLE_PERMISSIONS[r] ?? [];
    const hasIt = permissions.some(
      (p) =>
        (p.resource === resource || p.resource === '*') &&
        (p.action === action || p.action === 'manage')
    );
    if (hasIt) return true;
  }

  return false;
}

function getRoleHierarchy(role: Role): Role[] {
  switch (role) {
    case 'founder':
      return ['founder', 'admin', 'moderator', 'user'];
    case 'admin':
      return ['admin', 'moderator', 'user'];
    case 'moderator':
      return ['moderator', 'user'];
    case 'user':
      return ['user'];
  }
}
```

---

## 4. Middleware Chain

```typescript
// src/lib/auth/middleware.ts
import { auth } from '@clerk/nextjs/server';

type AuthenticatedRequest = Request & {
  auth: { userId: string; role: Role; tier: Tier };
};

// Authentication middleware
export function requireAuth(handler: (req: AuthenticatedRequest) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    const { userId } = await auth();

    if (!userId) {
      throw new AuthenticationError();
    }

    // Fetch user from cache/database
    const user = await getUserCached(userId);
    if (!user) {
      throw new AuthenticationError('User account not found');
    }

    if (user.deletedAt) {
      throw new AuthenticationError('Account has been deleted');
    }

    (req as any).auth = {
      userId: user.clerkId,
      role: user.role as Role,
      tier: user.tier as Tier,
    };

    return handler(req as AuthenticatedRequest);
  };
}

// Tier requirement middleware
export function requireTier(minimumTier: Tier) {
  return (handler: (req: AuthenticatedRequest) => Promise<Response>) => {
    return requireAuth(async (req: AuthenticatedRequest) => {
      if (!hasTierAccess(req.auth.tier, minimumTier)) {
        throw new TierAccessError(
          minimumTier,
          req.auth.tier,
          'this feature'
        );
      }
      return handler(req);
    });
  };
}

// Role requirement middleware
export function requireRole(minimumRole: Role) {
  return (handler: (req: AuthenticatedRequest) => Promise<Response>) => {
    return requireAuth(async (req: AuthenticatedRequest) => {
      if (!hasPermission(req.auth.role, '*', 'read')) {
        // Simple role hierarchy check
        const roleRanks: Record<Role, number> = {
          user: 0, moderator: 1, admin: 2, founder: 3,
        };
        if ((roleRanks[req.auth.role] ?? 0) < (roleRanks[minimumRole] ?? 0)) {
          throw new AuthorizationError(
            `This action requires ${minimumRole} role`
          );
        }
      }
      return handler(req);
    });
  };
}

// Permission-based middleware
export function requirePermission(resource: string, action: string) {
  return (handler: (req: AuthenticatedRequest) => Promise<Response>) => {
    return requireAuth(async (req: AuthenticatedRequest) => {
      if (!hasPermission(req.auth.role, resource, action)) {
        throw new AuthorizationError(
          `Missing permission: ${action} on ${resource}`
        );
      }
      return handler(req);
    });
  };
}

// Composable middleware chain
export function compose(...middlewares: Array<(handler: any) => any>) {
  return (handler: any) => {
    return middlewares.reduceRight((h, mw) => mw(h), handler);
  };
}

// Usage examples:
// Simple auth
export const GET = requireAuth(async (req) => {
  return Response.json({ userId: req.auth.userId });
});

// Tier + auth
export const POST = requireTier('PLUS')(async (req) => {
  // Only PLUS tier and above can access
  return Response.json({ success: true });
});

// Admin only
export const DELETE = requireRole('admin')(async (req) => {
  return Response.json({ deleted: true });
});

// Composed middleware
export const PUT = compose(
  requireTier('SMART'),
  requirePermission('settings', 'update')
)(async (req: AuthenticatedRequest) => {
  return Response.json({ updated: true });
});
```

---

## 5. API Key Authentication

```typescript
// src/lib/auth/api-keys.ts
import { randomBytes, createHash } from 'crypto';

// Generate API key pair
export function generateApiKey(): { key: string; hash: string; prefix: string } {
  const key = `sai_${randomBytes(32).toString('base64url')}`;
  const prefix = key.slice(0, 12); // For identification
  const hash = hashApiKey(key);
  return { key, hash, prefix };
}

function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

// Store API key
export async function createApiKey(
  userId: string,
  name: string
): Promise<{ key: string; id: string }> {
  const { key, hash, prefix } = generateApiKey();

  const apiKey = await prisma.apiKey.create({
    data: {
      userId,
      name,
      keyHash: hash,
      keyPrefix: prefix,
      lastUsedAt: null,
      expiresAt: new Date(Date.now() + 365 * 24 * 3600_000), // 1 year
    },
  });

  // Return the full key only once — we only store the hash
  return { key, id: apiKey.id };
}

// Validate API key
export async function validateApiKey(key: string): Promise<{
  valid: boolean;
  userId?: string;
  tier?: string;
}> {
  if (!key.startsWith('sai_')) {
    return { valid: false };
  }

  const hash = hashApiKey(key);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
    include: { user: { select: { clerkId: true, tier: true, deletedAt: true } } },
  });

  if (!apiKey) return { valid: false };

  // Check expiration
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return { valid: false };
  }

  // Check revocation
  if (apiKey.revokedAt) return { valid: false };

  // Check user
  if (apiKey.user.deletedAt) return { valid: false };

  // Update last used
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    valid: true,
    userId: apiKey.user.clerkId,
    tier: apiKey.user.tier,
  };
}

// API key middleware
export function requireApiKey(handler: (req: AuthenticatedRequest) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    const authHeader = req.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer sai_')) {
      throw new AuthenticationError('Valid API key required');
    }

    const key = authHeader.slice(7); // Remove 'Bearer '
    const result = await validateApiKey(key);

    if (!result.valid) {
      throw new AuthenticationError('Invalid or expired API key');
    }

    (req as any).auth = {
      userId: result.userId,
      tier: result.tier,
      role: 'user' as Role, // API keys are always user-level
    };

    return handler(req as AuthenticatedRequest);
  };
}
```

---

## 6. Session Management

```typescript
// src/lib/auth/session.ts

interface EnrichedSession {
  userId: string;
  clerkId: string;
  tier: Tier;
  role: Role;
  features: TierFeatures;
  agentLimit: number;
}

// Cache enriched session data in Redis
export async function getEnrichedSession(
  clerkUserId: string
): Promise<EnrichedSession | null> {
  // Check cache first
  const cached = await redis.get(`session:${clerkUserId}`);
  if (cached) return JSON.parse(cached);

  // Fetch from database
  const user = await prisma.user.findUnique({
    where: { clerkId: clerkUserId },
    select: {
      id: true,
      clerkId: true,
      tier: true,
      role: true,
      deletedAt: true,
    },
  });

  if (!user || user.deletedAt) return null;

  const session: EnrichedSession = {
    userId: user.id,
    clerkId: user.clerkId,
    tier: user.tier as Tier,
    role: user.role as Role,
    features: getTierFeatures(user.tier),
    agentLimit: getAgentLimit(user.tier),
  };

  // Cache for 5 minutes
  await redis.setex(
    `session:${clerkUserId}`,
    300,
    JSON.stringify(session)
  );

  return session;
}

// Invalidate session cache when user changes
export async function invalidateSession(clerkUserId: string): Promise<void> {
  await redis.del(`session:${clerkUserId}`);
}
```

---

## 7. Resource Ownership Validation

```typescript
// src/lib/auth/ownership.ts

// Ensure users can only access their own resources
export async function validateOwnership(
  userId: string,
  resourceType: string,
  resourceId: string
): Promise<boolean> {
  switch (resourceType) {
    case 'conversation':
      const conversation = await prisma.conversation.findUnique({
        where: { id: resourceId },
        select: { userId: true },
      });
      return conversation?.userId === userId;

    case 'bestie':
      const bestie = await prisma.bestie.findUnique({
        where: { id: resourceId },
        select: { userId: true },
      });
      return bestie?.userId === userId;

    case 'settings':
      return true; // Users always own their own settings

    case 'apiKey':
      const key = await prisma.apiKey.findUnique({
        where: { id: resourceId },
        select: { userId: true },
      });
      return key?.userId === userId;

    default:
      return false;
  }
}

// Middleware for resource ownership
export function requireOwnership(resourceType: string, paramName: string = 'id') {
  return (handler: (req: AuthenticatedRequest) => Promise<Response>) => {
    return requireAuth(async (req: AuthenticatedRequest) => {
      const url = new URL(req.url);
      const resourceId = url.searchParams.get(paramName);

      if (!resourceId) {
        throw new ValidationError('Resource ID required');
      }

      const isOwner = await validateOwnership(
        req.auth.userId,
        resourceType,
        resourceId
      );

      // Admins can bypass ownership checks
      if (!isOwner && req.auth.role !== 'admin' && req.auth.role !== 'founder') {
        throw new AuthorizationError('You do not own this resource');
      }

      return handler(req);
    });
  };
}
```

---

## 8. Security Headers and CSRF

```typescript
// src/middleware.ts — Security headers
import { NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );

  // CSP
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.stone-ai.net",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.clerk.com https://api.stripe.com wss:",
      "frame-src https://js.stripe.com",
    ].join('; ')
  );

  // CSRF protection for API mutations
  if (
    request.nextUrl.pathname.startsWith('/api') &&
    ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)
  ) {
    const origin = request.headers.get('origin');
    const allowedOrigins = [
      'https://stone-ai.net',
      'https://www.stone-ai.net',
      process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '',
    ].filter(Boolean);

    if (origin && !allowedOrigins.includes(origin)) {
      // Allow webhooks (they have their own verification)
      if (!request.nextUrl.pathname.startsWith('/api/webhooks')) {
        return new NextResponse('Forbidden', { status: 403 });
      }
    }
  }

  return response;
}
```

---

## 9. Founder-Only Access (Royal Guard)

```typescript
// src/lib/auth/founder.ts

const FOUNDER_CLERK_ID = process.env.FOUNDER_CLERK_ID!;

export function isFounder(clerkId: string): boolean {
  return clerkId === FOUNDER_CLERK_ID;
}

// Founder-only middleware — for Royal Guard features, Chaos, etc.
export function requireFounder(
  handler: (req: AuthenticatedRequest) => Promise<Response>
) {
  return requireAuth(async (req: AuthenticatedRequest) => {
    if (!isFounder(req.auth.userId)) {
      // Don't even acknowledge the endpoint exists
      throw new NotFoundError('Resource');
    }
    return handler(req);
  });
}

// Royal Guard access — hidden agents that don't appear in any list
export async function getRoyalGuardAgents(
  clerkId: string
): Promise<any[] | null> {
  if (!isFounder(clerkId)) return null;

  return prisma.agent.findMany({
    where: {
      isRoyalGuard: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      // No number field — Royal Guards have no numbers
    },
  });
}
```

---

## 10. Testing Auth Patterns

```typescript
// __tests__/auth/rbac.test.ts
import { describe, it, expect } from 'vitest';

describe('RBAC', () => {
  it('should allow user to read their own profile', () => {
    expect(hasPermission('user', 'profile', 'read')).toBe(true);
  });

  it('should deny user from managing other users', () => {
    expect(hasPermission('user', 'users', 'manage')).toBe(false);
  });

  it('should allow admin to manage users', () => {
    expect(hasPermission('admin', 'users', 'manage')).toBe(true);
  });

  it('should allow founder to do everything', () => {
    expect(hasPermission('founder', 'anything', 'manage')).toBe(true);
  });
});

describe('Tier Access', () => {
  it('should allow PRO user to access SMART features', () => {
    expect(hasTierAccess('PRO', 'SMART')).toBe(true);
  });

  it('should deny FREE user from STARTER features', () => {
    expect(hasTierAccess('FREE', 'STARTER')).toBe(false);
  });

  it('should map agent access correctly', () => {
    expect(canAccessAgent('FREE', 4)).toBe(true);
    expect(canAccessAgent('FREE', 5)).toBe(false);
    expect(canAccessAgent('PRO', 38)).toBe(true);
  });
});
```

---

## Summary

| Layer | Implementation | Purpose |
|-------|---------------|---------|
| Authentication | Clerk + webhooks | Identity verification |
| Session enrichment | Redis-cached user data | Fast auth context |
| Tier-based access | 5-tier hierarchy | Feature gating by subscription |
| Role-based access | 4-role hierarchy | Admin/moderator capabilities |
| API key auth | SHA-256 hashed keys | Programmatic access |
| Resource ownership | Per-resource validation | Users access only their data |
| Founder-only | Hidden endpoints | Royal Guard, Chaos access |
| Security headers | CSP, CSRF, XSS | Defense in depth |

Auth in Stone AI is layered: every request passes through authentication, then tier/role checks, then resource ownership validation. No shortcut paths exist.
