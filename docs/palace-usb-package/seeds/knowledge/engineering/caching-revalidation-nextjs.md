# Caching & Revalidation in Next.js 16 — Deep Knowledge Seed

## Overview

Caching is the single biggest performance lever in Next.js. Get it right and your app feels instant. Get it wrong and users see stale data, ghost states, or unnecessary re-fetches that burn your API budget. This seed covers every caching layer in Next.js 16 (App Router), React Query client-side caching, and the real-world patterns Stone AI uses for chat, dashboards, settings, and agent data.

---

## Table of Contents

1. [Next.js 16 Caching Architecture](#nextjs-16-caching-architecture)
2. [fetch() Cache Options](#fetch-cache-options)
3. [Route Segment Configuration](#route-segment-configuration)
4. [unstable_cache and next/cache](#unstable_cache-and-nextcache)
5. [On-Demand Revalidation](#on-demand-revalidation)
6. [Tag-Based Cache Invalidation](#tag-based-cache-invalidation)
7. [Client-Side Caching with React Query](#client-side-caching-with-react-query)
8. [Cache Warming and Prefetching](#cache-warming-and-prefetching)
9. [ISR Patterns](#isr-patterns)
10. [Common Caching Bugs](#common-caching-bugs)
11. [Real-World Patterns](#real-world-patterns)

---

## Next.js 16 Caching Architecture

Next.js 16 has multiple caching layers that interact with each other. Understanding the full picture prevents confusion.

### The Four Cache Layers

```
┌─────────────────────────────────────────────────────┐
│  Layer 1: Request Memoization (React)               │
│  ─ Deduplicates identical fetch() calls in a        │
│    single render pass. Automatic. No config needed.  │
├─────────────────────────────────────────────────────┤
│  Layer 2: Data Cache (Next.js)                      │
│  ─ Persists fetch() results across requests.        │
│  ─ Survives deployments on Vercel.                  │
│  ─ Controlled by fetch options + route config.      │
├─────────────────────────────────────────────────────┤
│  Layer 3: Full Route Cache (Next.js)                │
│  ─ Caches the rendered HTML + RSC payload at build  │
│    time or on first request.                        │
│  ─ Static routes are fully cached.                  │
│  ─ Dynamic routes skip this cache.                  │
├─────────────────────────────────────────────────────┤
│  Layer 4: Router Cache (Client-side)                │
│  ─ In-memory cache of visited route segments.       │
│  ─ Enables instant back/forward navigation.         │
│  ─ Auto-invalidates after 30s (dynamic) / 5min     │
│    (static) in Next.js 16.                          │
└─────────────────────────────────────────────────────┘
```

### How They Interact

```
User Request
  │
  ▼
Router Cache (client) ──hit──▶ Instant render
  │ miss
  ▼
Full Route Cache (server) ──hit──▶ Return cached HTML/RSC
  │ miss
  ▼
Server Render
  │
  ├─▶ Request Memoization (dedup fetches within this render)
  │
  └─▶ Data Cache ──hit──▶ Return cached data
        │ miss
        ▼
      Origin (DB, API, etc.)
```

### Key Changes in Next.js 15/16

In Next.js 15+, the default caching behavior changed significantly:

```typescript
// Next.js 14: fetch() cached by default (force-cache)
// Next.js 15+: fetch() NOT cached by default (no-store)

// This means in Next.js 16, you must OPT IN to caching:
const data = await fetch('https://api.example.com/data', {
  cache: 'force-cache', // Explicitly enable caching
});

// Or use route segment config:
export const dynamic = 'force-static';
```

---

## fetch() Cache Options

### force-cache — Cache Until Revalidated

```typescript
// src/app/agents/page.tsx
// Fetches agent list and caches indefinitely until revalidated
async function getAgents() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/agents`, {
    cache: 'force-cache',
  });

  if (!res.ok) throw new Error('Failed to fetch agents');
  return res.json() as Promise<Agent[]>;
}

export default async function AgentsPage() {
  const agents = await getAgents();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}
```

### no-store — Always Fresh

```typescript
// src/app/chat/[conversationId]/page.tsx
// Chat messages must always be fresh
async function getMessages(conversationId: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/chat/${conversationId}/messages`,
    { cache: 'no-store' } // Never cache chat messages
  );

  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json() as Promise<Message[]>;
}
```

### next.revalidate — Time-Based Revalidation

```typescript
// src/app/forum/page.tsx
// Forum posts: fresh enough if updated every 60 seconds
async function getForumPosts() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/forum/posts`, {
    next: { revalidate: 60 }, // Revalidate every 60 seconds
  });

  if (!res.ok) throw new Error('Failed to fetch forum posts');
  return res.json() as Promise<ForumPost[]>;
}
```

### next.tags — Tag for On-Demand Revalidation

```typescript
// src/app/dashboard/page.tsx
async function getDashboardStats(userId: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/dashboard/stats?userId=${userId}`,
    {
      next: {
        revalidate: 300, // Background revalidate every 5 min
        tags: [`dashboard-${userId}`, 'dashboard-global'],
      },
    }
  );

  if (!res.ok) throw new Error('Failed to fetch dashboard stats');
  return res.json() as Promise<DashboardStats>;
}
```

### Combining Options

```typescript
// INVALID — cache and next.revalidate conflict
const res = await fetch(url, {
  cache: 'no-store',
  next: { revalidate: 60 }, // This is ignored when cache: 'no-store'
});

// VALID — revalidate implies force-cache with a timer
const res = await fetch(url, {
  next: { revalidate: 60 },
});

// VALID — force-cache with tags for on-demand revalidation
const res = await fetch(url, {
  cache: 'force-cache',
  next: { tags: ['my-data'] },
});
```

---

## Route Segment Configuration

### dynamic

Controls whether a route is static or dynamic at the segment level.

```typescript
// src/app/agents/page.tsx
// Force this page to be statically generated
export const dynamic = 'force-static';

// src/app/chat/page.tsx
// Force this page to be dynamically rendered every request
export const dynamic = 'force-dynamic';

// src/app/forum/page.tsx
// Let Next.js decide (default in Next.js 16)
export const dynamic = 'auto';

// src/app/settings/page.tsx
// Error if any dynamic function is used (cookies, headers, searchParams)
export const dynamic = 'error';
```

### revalidate

Sets the default revalidation time for all fetches in a segment.

```typescript
// src/app/help/page.tsx
// Help content: revalidate every hour
export const revalidate = 3600;

// src/app/help/layout.tsx
// This applies to ALL routes under /help
export const revalidate = 3600;

// src/app/chat/[id]/page.tsx
// Chat: never cache at the route level
export const revalidate = 0; // equivalent to dynamic = 'force-dynamic'
```

### fetchCache

Controls the default cache behavior for all fetch() calls in a segment.

```typescript
// src/app/admin/layout.tsx
// Admin pages: no caching by default (sensitive data)
export const fetchCache = 'default-no-store';

// Options:
// 'auto' (default) — respect individual fetch options
// 'default-cache' — default to force-cache unless fetch specifies otherwise
// 'only-cache' — all fetches use force-cache, error if no-store specified
// 'default-no-store' — default to no-store unless fetch specifies otherwise
// 'only-no-store' — all fetches use no-store, error if force-cache specified
// 'force-cache' — force all fetches to cache
// 'force-no-store' — force all fetches to not cache
```

### runtime

```typescript
// src/app/api/chat/route.ts
// Use Edge runtime for streaming responses
export const runtime = 'edge';

// src/app/api/admin/route.ts
// Use Node.js runtime for heavy processing
export const runtime = 'nodejs';
```

### Segment Config Inheritance

```
src/app/
├── layout.tsx          (revalidate = 3600)  ← applies to all routes
├── page.tsx            (inherits 3600)
├── chat/
│   ├── layout.tsx      (revalidate = 0)     ← overrides for /chat/*
│   └── [id]/
│       └── page.tsx    (inherits 0)
├── forum/
│   └── page.tsx        (revalidate = 60)    ← overrides just this page
└── admin/
    ├── layout.tsx      (fetchCache = 'default-no-store')
    └── page.tsx        (inherits no-store default)
```

**Rule: Child segment config overrides parent. Individual fetch() options override segment config.**

---

## unstable_cache and next/cache

### The Problem with Non-fetch Data

`fetch()` caching only works for... fetch calls. If you're reading from Prisma, a file, or computing something expensive, you need `unstable_cache` (now stable in Next.js 16 as `cache` from `next/cache`).

### Basic Pattern

```typescript
// src/lib/data/agents.ts
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

// Cache the result of a Prisma query
export const getAgentsByTier = unstable_cache(
  async (tier: string) => {
    return prisma.agent.findMany({
      where: { tier },
      orderBy: { displayOrder: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        avatar: true,
        tier: true,
        category: true,
      },
    });
  },
  ['agents-by-tier'], // Cache key prefix
  {
    revalidate: 3600,  // Revalidate every hour
    tags: ['agents'],  // Tag for on-demand revalidation
  }
);
```

### With Dynamic Keys

```typescript
// src/lib/data/user.ts
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

export const getUserProfile = unstable_cache(
  async (userId: string) => {
    return prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        tier: true,
        referralCode: true,
        settings: true,
      },
    });
  },
  ['user-profile'], // Base key
  {
    revalidate: 300,
    tags: ['user-profile'], // Will be combined with args for unique key
  }
);

// Usage in a Server Component
export default async function ProfilePage({ params }: { params: { userId: string } }) {
  const profile = await getUserProfile(params.userId);
  // ...
}
```

### Cache Function Factory

```typescript
// src/lib/cache.ts
import { unstable_cache } from 'next/cache';

type CacheConfig = {
  revalidate?: number;
  tags?: string[];
};

/**
 * Creates a cached version of any async function.
 * Standardizes cache key generation and tag management.
 */
export function createCachedFunction<TArgs extends unknown[], TResult>(
  fn: (...args: TArgs) => Promise<TResult>,
  keyPrefix: string,
  config: CacheConfig = {}
): (...args: TArgs) => Promise<TResult> {
  return unstable_cache(
    fn,
    [keyPrefix],
    {
      revalidate: config.revalidate ?? 300,
      tags: config.tags ?? [keyPrefix],
    }
  ) as (...args: TArgs) => Promise<TResult>;
}

// Usage:
export const getCachedForumPosts = createCachedFunction(
  async (category: string, page: number) => {
    return prisma.forumPost.findMany({
      where: { category },
      skip: (page - 1) * 20,
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  },
  'forum-posts',
  { revalidate: 60, tags: ['forum-posts'] }
);
```

### React cache() for Request Deduplication

```typescript
// src/lib/data/session.ts
import { cache } from 'react';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

// React cache() deduplicates within a single request/render
// Use this when multiple components need the same data
export const getCurrentUser = cache(async () => {
  const { userId } = await auth();
  if (!userId) return null;

  return prisma.user.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      name: true,
      email: true,
      tier: true,
      avatar: true,
    },
  });
});

// Now call getCurrentUser() in any Server Component —
// it only executes ONCE per request, even if called 10 times
```

### Difference: React cache() vs unstable_cache

```
React cache():
  ─ Deduplicates within ONE request
  ─ Does NOT persist across requests
  ─ Automatic — just wrap your function
  ─ No revalidation needed (dies with the request)

unstable_cache():
  ─ Persists across ALL requests
  ─ Survives deployments (on Vercel)
  ─ Requires explicit revalidation strategy
  ─ Needs cache keys and tags

Combine them:
  ─ Wrap unstable_cache result with React cache()
  ─ Gets both cross-request persistence AND
    within-request deduplication
```

```typescript
// Best of both worlds:
import { cache } from 'react';
import { unstable_cache } from 'next/cache';

const _getSettings = unstable_cache(
  async (userId: string) => {
    return prisma.settings.findUnique({ where: { userId } });
  },
  ['user-settings'],
  { revalidate: 600, tags: ['user-settings'] }
);

// Wrap with React cache for request dedup
export const getSettings = cache(_getSettings);
```

---

## On-Demand Revalidation

### revalidatePath

Invalidates the cache for an entire route path.

```typescript
// src/app/api/agents/[id]/route.ts
import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Update agent in database...
  const updated = await prisma.agent.update({
    where: { id: params.id },
    data: await request.json(),
  });

  // Invalidate the agents list page
  revalidatePath('/agents');

  // Invalidate the specific agent page
  revalidatePath(`/agents/${params.id}`);

  // Invalidate a layout (affects all child routes)
  revalidatePath('/agents', 'layout');

  return NextResponse.json(updated);
}
```

### revalidateTag

Invalidates all cache entries with a specific tag. More surgical than path.

```typescript
// src/app/api/forum/posts/route.ts
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const body = await request.json();

  const post = await prisma.forumPost.create({
    data: body,
  });

  // Invalidate all caches tagged with 'forum-posts'
  revalidateTag('forum-posts');

  return NextResponse.json(post, { status: 201 });
}
```

### Revalidation API Route (Webhook Pattern)

```typescript
// src/app/api/revalidate/route.ts
import { revalidateTag, revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const RevalidateSchema = z.object({
  type: z.enum(['tag', 'path']),
  value: z.string().min(1),
  secret: z.string(),
}).strict();

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = RevalidateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (parsed.data.secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (parsed.data.type === 'tag') {
    revalidateTag(parsed.data.value);
  } else {
    revalidatePath(parsed.data.value);
  }

  return NextResponse.json({
    revalidated: true,
    type: parsed.data.type,
    value: parsed.data.value,
    timestamp: Date.now(),
  });
}
```

### Server Action Revalidation

```typescript
// src/app/settings/actions.ts
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const UpdateSettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  language: z.string().min(2).max(5).optional(),
  notifications: z.boolean().optional(),
}).strict();

export async function updateSettings(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const rawData = Object.fromEntries(formData.entries());
  const data = UpdateSettingsSchema.parse(rawData);

  await prisma.settings.update({
    where: { userId },
    data,
  });

  // Revalidate the settings page
  revalidatePath('/settings');

  // Revalidate any cached user data
  revalidateTag('user-settings');
  revalidateTag(`user-${userId}`);
}
```

---

## Tag-Based Cache Invalidation

### Tagging Strategy

Design tags hierarchically for surgical invalidation:

```typescript
// src/lib/cache-tags.ts

/**
 * Cache tag conventions:
 *
 * Entity tags:     'agents', 'forum-posts', 'users'
 * Instance tags:   'agent-42', 'post-abc', 'user-xyz'
 * User scoped:     'user-xyz-settings', 'user-xyz-chat'
 * Collection tags: 'dashboard-global', 'forum-category-tech'
 * Tier tags:       'tier-free', 'tier-pro'
 */

export const CacheTags = {
  // Agent tags
  agents: () => 'agents' as const,
  agent: (id: string) => `agent-${id}` as const,
  agentsByTier: (tier: string) => `agents-tier-${tier}` as const,

  // User tags
  users: () => 'users' as const,
  user: (id: string) => `user-${id}` as const,
  userSettings: (id: string) => `user-${id}-settings` as const,
  userChat: (id: string) => `user-${id}-chat` as const,

  // Forum tags
  forumPosts: () => 'forum-posts' as const,
  forumPost: (id: string) => `forum-post-${id}` as const,
  forumCategory: (cat: string) => `forum-category-${cat}` as const,

  // Dashboard tags
  dashboardGlobal: () => 'dashboard-global' as const,
  dashboardUser: (id: string) => `dashboard-${id}` as const,

  // Bestie tags
  bestie: (userId: string) => `bestie-${userId}` as const,
} as const;
```

### Using Tags in Data Functions

```typescript
// src/lib/data/agents.ts
import { unstable_cache } from 'next/cache';
import { CacheTags } from '@/lib/cache-tags';

export const getAgent = unstable_cache(
  async (agentId: string) => {
    return prisma.agent.findUnique({
      where: { id: agentId },
    });
  },
  ['agent-detail'],
  {
    revalidate: 3600,
    tags: [CacheTags.agents(), /* dynamic tag added per-call */],
  }
);

// For dynamic tags, create a wrapper:
export async function getAgentCached(agentId: string) {
  return unstable_cache(
    async () => {
      return prisma.agent.findUnique({ where: { id: agentId } });
    },
    [`agent-${agentId}`],
    {
      revalidate: 3600,
      tags: [CacheTags.agents(), CacheTags.agent(agentId)],
    }
  )();
}
```

### Cascading Invalidation

```typescript
// src/lib/cache-invalidation.ts
import { revalidateTag } from 'next/cache';
import { CacheTags } from '@/lib/cache-tags';

export const CacheInvalidation = {
  /**
   * When an agent is updated:
   * - Invalidate the specific agent cache
   * - Invalidate the agents list
   * - Invalidate the tier it belongs to
   * - Invalidate the global dashboard (agent counts may change)
   */
  agentUpdated(agentId: string, tier: string) {
    revalidateTag(CacheTags.agent(agentId));
    revalidateTag(CacheTags.agents());
    revalidateTag(CacheTags.agentsByTier(tier));
    revalidateTag(CacheTags.dashboardGlobal());
  },

  /**
   * When a user changes tier:
   * - Invalidate all user-scoped caches
   * - Invalidate the agents list (different agents visible per tier)
   * - Invalidate dashboard
   */
  userTierChanged(userId: string) {
    revalidateTag(CacheTags.user(userId));
    revalidateTag(CacheTags.userSettings(userId));
    revalidateTag(CacheTags.dashboardUser(userId));
    revalidateTag(CacheTags.agents()); // Available agents change per tier
  },

  /**
   * When a forum post is created/updated:
   * - Invalidate the specific post
   * - Invalidate the posts list
   * - Invalidate the category list
   */
  forumPostChanged(postId: string, category: string) {
    revalidateTag(CacheTags.forumPost(postId));
    revalidateTag(CacheTags.forumPosts());
    revalidateTag(CacheTags.forumCategory(category));
  },

  /**
   * Nuclear option: invalidate everything for a user
   */
  userFullReset(userId: string) {
    revalidateTag(CacheTags.user(userId));
    revalidateTag(CacheTags.userSettings(userId));
    revalidateTag(CacheTags.userChat(userId));
    revalidateTag(CacheTags.dashboardUser(userId));
    revalidateTag(CacheTags.bestie(userId));
  },
};
```

---

## Client-Side Caching with React Query

### Provider Setup

```typescript
// src/providers/query-provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 30 seconds
            staleTime: 30 * 1000,

            // Keep unused data in memory for 5 minutes
            gcTime: 5 * 60 * 1000,

            // Don't refetch when window regains focus (noisy for chat apps)
            refetchOnWindowFocus: false,

            // Retry failed requests up to 2 times
            retry: 2,

            // Wait longer between retries
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Retry mutations once
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

### Query Hooks with Proper Cache Configuration

```typescript
// src/hooks/use-agents.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Agent } from '@prisma/client';

// Query key factory — consistent keys prevent cache bugs
export const agentKeys = {
  all: ['agents'] as const,
  lists: () => [...agentKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...agentKeys.lists(), filters] as const,
  details: () => [...agentKeys.all, 'detail'] as const,
  detail: (id: string) => [...agentKeys.details(), id] as const,
};

export function useAgents(tier?: string) {
  return useQuery({
    queryKey: agentKeys.list({ tier }),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (tier) params.set('tier', tier);

      const res = await fetch(`/api/agents?${params}`);
      if (!res.ok) throw new Error('Failed to fetch agents');
      return res.json() as Promise<Agent[]>;
    },
    // Agent list rarely changes — cache for 10 minutes
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: agentKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/agents/${id}`);
      if (!res.ok) throw new Error('Failed to fetch agent');
      return res.json() as Promise<Agent>;
    },
    staleTime: 10 * 60 * 1000,
    enabled: !!id, // Don't fetch if no ID
  });
}
```

### Chat Messages — Aggressive Freshness

```typescript
// src/hooks/use-chat.ts
'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';

export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  conversation: (id: string) => [...chatKeys.all, 'conversation', id] as const,
  messages: (conversationId: string) =>
    [...chatKeys.all, 'messages', conversationId] as const,
};

export function useMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(conversationId),
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({
        conversationId,
        cursor: pageParam ?? '',
        limit: '50',
      });

      const res = await fetch(`/api/chat/messages?${params}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json() as Promise<{
        messages: Message[];
        nextCursor: string | null;
      }>;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,

    // Chat messages: very short stale time
    staleTime: 5 * 1000, // 5 seconds
    gcTime: 60 * 1000,   // 1 minute in memory

    // Refetch when tab regains focus (might have new messages)
    refetchOnWindowFocus: true,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { conversationId: string; content: string; agentId: string }) => {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to send message');
      return res.json();
    },

    // Optimistic update: show message immediately
    onMutate: async (newMessage) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: chatKeys.messages(newMessage.conversationId),
      });

      // Snapshot previous messages
      const previousMessages = queryClient.getQueryData(
        chatKeys.messages(newMessage.conversationId)
      );

      // Optimistically add the new message
      queryClient.setQueryData(
        chatKeys.messages(newMessage.conversationId),
        (old: any) => {
          if (!old) return old;
          const optimisticMessage = {
            id: `temp-${Date.now()}`,
            content: newMessage.content,
            role: 'user',
            createdAt: new Date().toISOString(),
            status: 'sending',
          };
          return {
            ...old,
            pages: old.pages.map((page: any, i: number) =>
              i === 0
                ? { ...page, messages: [optimisticMessage, ...page.messages] }
                : page
            ),
          };
        }
      );

      return { previousMessages };
    },

    // Rollback on error
    onError: (_err, newMessage, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          chatKeys.messages(newMessage.conversationId),
          context.previousMessages
        );
      }
    },

    // Always refetch after mutation
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(variables.conversationId),
      });
      // Also refresh conversation list (last message preview, timestamp)
      queryClient.invalidateQueries({
        queryKey: chatKeys.conversations(),
      });
    },
  });
}
```

### staleTime vs gcTime Explained

```
staleTime (default: 0):
  ─ How long data is considered "fresh"
  ─ While fresh: no background refetches
  ─ After staleTime: data is "stale" but still shown
  ─ Stale data triggers background refetch on next access

gcTime (default: 5 minutes):
  ─ How long UNUSED data stays in memory
  ─ Timer starts when query has NO active observers
  ─ (i.e., the component using the query unmounts)
  ─ After gcTime: data is garbage collected

Timeline:
  t=0:    Fetch data → data is FRESH
  t=30s:  staleTime expires → data is STALE (still shown!)
  t=30s:  User navigates to page → background refetch triggered
  t=30s:  Component unmounts → gcTime countdown begins
  t=5m30s: gcTime expires → data removed from cache
  t=6m:   User returns → full loading state, fresh fetch
```

### Per-Query Cache Tuning Guide

```typescript
// Tuning guidelines for Stone AI:
const CACHE_PROFILES = {
  // Static-ish data: agent definitions, tier info, help content
  static: { staleTime: 30 * 60 * 1000, gcTime: 60 * 60 * 1000 },

  // Semi-dynamic: forum posts, user profiles, settings
  semiDynamic: { staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000 },

  // Dynamic: dashboard stats, notifications
  dynamic: { staleTime: 30 * 1000, gcTime: 5 * 60 * 1000 },

  // Real-time: chat messages, typing indicators
  realTime: { staleTime: 5 * 1000, gcTime: 60 * 1000 },

  // Never cache: auth state, sensitive data
  noCache: { staleTime: 0, gcTime: 0 },
};
```

---

## Cache Warming and Prefetching

### Prefetching on Hover

```typescript
// src/components/agent-card.tsx
'use client';

import { useQueryClient } from '@tanstack/react-query';
import { agentKeys } from '@/hooks/use-agents';
import Link from 'next/link';

export function AgentCard({ agent }: { agent: Agent }) {
  const queryClient = useQueryClient();

  const prefetchAgent = () => {
    queryClient.prefetchQuery({
      queryKey: agentKeys.detail(agent.id),
      queryFn: async () => {
        const res = await fetch(`/api/agents/${agent.id}`);
        return res.json();
      },
      staleTime: 10 * 60 * 1000,
    });
  };

  return (
    <Link
      href={`/agents/${agent.id}`}
      onMouseEnter={prefetchAgent}
      onFocus={prefetchAgent}
      className="block p-4 rounded-xl border border-gray-200
                 hover:border-blue-300 transition-colors"
    >
      <h3 className="font-semibold">{agent.name}</h3>
      <p className="text-sm text-gray-500">{agent.description}</p>
    </Link>
  );
}
```

### Next.js Route Prefetching

```typescript
// src/components/navigation/sidebar.tsx
import Link from 'next/link';

export function Sidebar() {
  return (
    <nav>
      {/* Next.js automatically prefetches <Link> routes on viewport entry */}
      <Link href="/chat" prefetch={true}>Chat</Link>
      <Link href="/agents" prefetch={true}>Agents</Link>
      <Link href="/forum" prefetch={true}>Forum</Link>

      {/* Disable prefetch for rarely-visited pages */}
      <Link href="/settings" prefetch={false}>Settings</Link>
      <Link href="/help" prefetch={false}>Help</Link>
    </nav>
  );
}
```

### Server-Side Cache Warming

```typescript
// src/app/layout.tsx
// Warm critical caches on app load
import { getAgentsByTier } from '@/lib/data/agents';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // These calls warm the unstable_cache for the most common data
  // Subsequent requests within revalidate period are instant
  void getAgentsByTier('FREE');   // Most users start here
  void getAgentsByTier('STARTER');

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### generateStaticParams for Static Generation

```typescript
// src/app/agents/[id]/page.tsx
import { prisma } from '@/lib/prisma';

// Pre-generate pages for all agents at build time
export async function generateStaticParams() {
  const agents = await prisma.agent.findMany({
    select: { id: true },
  });

  return agents.map((agent) => ({
    id: agent.id,
  }));
}
```

---

## ISR Patterns

### Basic ISR

```typescript
// src/app/help/[slug]/page.tsx
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

// Revalidate every 24 hours
export const revalidate = 86400;

export async function generateStaticParams() {
  const articles = await prisma.helpArticle.findMany({
    select: { slug: true },
  });
  return articles.map((a) => ({ slug: a.slug }));
}

export default async function HelpArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await prisma.helpArticle.findUnique({
    where: { slug: params.slug },
  });

  if (!article) notFound();

  return (
    <article className="prose dark:prose-invert max-w-3xl mx-auto">
      <h1>{article.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: article.contentHtml }} />
    </article>
  );
}
```

### ISR + On-Demand Revalidation

```typescript
// src/app/api/admin/help/[slug]/route.ts
import { revalidatePath } from 'next/cache';

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const body = await request.json();

  // Admin updates help article
  await prisma.helpArticle.update({
    where: { slug: params.slug },
    data: body,
  });

  // Trigger ISR regeneration immediately instead of waiting 24h
  revalidatePath(`/help/${params.slug}`);

  return NextResponse.json({ revalidated: true });
}
```

### Dynamic ISR — Not Known at Build Time

```typescript
// src/app/forum/[postId]/page.tsx

// Allow dynamic paths that weren't generated at build time
export const dynamicParams = true;

// Revalidate every 5 minutes
export const revalidate = 300;

export async function generateStaticParams() {
  // Only pre-generate the top 100 most popular posts
  const posts = await prisma.forumPost.findMany({
    orderBy: { viewCount: 'desc' },
    take: 100,
    select: { id: true },
  });

  return posts.map((p) => ({ postId: p.id }));
}

// Posts not in the top 100 are generated on-demand (ISR)
// First request: dynamic render + cache result
// Subsequent requests within 5 min: serve cached version
```

---

## Common Caching Bugs

### Bug 1: Stale Data After Mutation

**Symptom**: User updates settings, navigates away, comes back — sees old data.

```typescript
// BAD: Forgot to invalidate cache after mutation
export async function updateUserName(name: string) {
  await fetch('/api/user', {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
  // ❌ React Query still has old data cached!
}

// GOOD: Invalidate the right cache keys
export function useUpdateUserName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      });
      return res.json();
    },
    onSuccess: () => {
      // ✅ Invalidate all user-related queries
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
  });
}
```

### Bug 2: Over-Caching Dynamic Data

**Symptom**: User A sees User B's data.

```typescript
// BAD: Caching user-specific data without user-scoped keys
export const getUserData = unstable_cache(
  async () => {
    const { userId } = await auth(); // ❌ auth() is dynamic!
    return prisma.user.findUnique({ where: { clerkId: userId } });
  },
  ['user-data'], // ❌ Same key for ALL users!
  { revalidate: 300 }
);

// GOOD: Include user ID in the cache key
export async function getUserData() {
  const { userId } = await auth();
  if (!userId) return null;

  return unstable_cache(
    async () => {
      return prisma.user.findUnique({ where: { clerkId: userId } });
    },
    [`user-data-${userId}`], // ✅ Unique per user
    { revalidate: 300, tags: [`user-${userId}`] }
  )();
}
```

### Bug 3: Cache Key Mismatch

**Symptom**: Data never seems to cache, or wrong data is returned.

```typescript
// BAD: React Query key doesn't match what's being fetched
useQuery({
  queryKey: ['agents', tier],           // Key says tier = "FREE"
  queryFn: () => fetch('/api/agents'),  // ❌ Fetches ALL agents
});

// BAD: Inconsistent key factories
// File A: queryKey: ['user', 'profile', userId]
// File B: queryKey: ['users', 'profile', userId]  // 'user' vs 'users'!

// GOOD: Centralized key factory (see agentKeys pattern above)
useQuery({
  queryKey: agentKeys.list({ tier }),
  queryFn: () => fetch(`/api/agents?tier=${tier}`),
});
```

### Bug 4: Caching Errors

**Symptom**: A temporary API error gets cached, showing error state for 5 minutes.

```typescript
// BAD: React Query caches failed queries
useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  gcTime: 5 * 60 * 1000, // Error cached for 5 minutes!
});

// GOOD: Don't cache errors, or cache them briefly
useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  retry: 3,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
  // React Query v5 default: errors are NOT cached (gcTime: 0 for errors)
  // But be explicit if you override gcTime globally
});
```

### Bug 5: unstable_cache with Closures

**Symptom**: Cached function always returns the same result regardless of arguments.

```typescript
// BAD: Variable captured in closure, not passed as argument
let currentTier = 'FREE';

export const getAgents = unstable_cache(
  async () => {
    // ❌ currentTier is captured at cache creation time!
    return prisma.agent.findMany({ where: { tier: currentTier } });
  },
  ['agents'],
  { revalidate: 3600 }
);

// GOOD: Pass variables as arguments to the cached function
export const getAgents = unstable_cache(
  async (tier: string) => {
    return prisma.agent.findMany({ where: { tier } });
  },
  ['agents-by-tier'],
  { revalidate: 3600 }
);
```

### Bug 6: Router Cache Showing Old Pages

**Symptom**: User navigates back and sees a stale version of the page.

```typescript
// The Router Cache (client-side) caches visited routes in memory.
// In Next.js 16: dynamic pages cached for 30 seconds, static for 5 minutes.

// Solution 1: Force refresh after mutation
import { useRouter } from 'next/navigation';

function AfterUpdate() {
  const router = useRouter();

  const handleSave = async () => {
    await saveData();
    router.refresh(); // ✅ Clears Router Cache for current route
  };
}

// Solution 2: Opt out of Router Cache for a route
// (Not directly configurable per-route in Next.js 16)
// Use dynamic = 'force-dynamic' to make the route always fresh on server
```

### Debugging Checklist

```
□ Is the data actually being cached? (Check Network tab)
□ Which cache layer is serving it? (Data Cache, Route Cache, or React Query)
□ Is the cache key unique per user/context?
□ After mutation, am I invalidating the right tags/keys?
□ Am I using router.refresh() for client-side Router Cache?
□ Is revalidatePath/revalidateTag running in a Server Action or Route Handler?
  (They don't work in Server Components)
□ Is there a middleware rewrite changing the path?
  (Can cause cache key mismatches)
□ In development mode, caching behaves differently.
  (force-dynamic is applied more often)
```

---

## Real-World Patterns

### Pattern 1: Chat App Caching Strategy

```typescript
// Chat requires a mix of strategies:
// - Conversation list: semi-dynamic (React Query, 30s stale)
// - Messages: real-time (React Query, 5s stale + optimistic updates)
// - Agent definitions: static-ish (server cache, 1h revalidation)
// - User profile: semi-dynamic (server cache, 5min + on-demand)

// src/app/chat/layout.tsx
// Server-side: cache agent list
import { getAgentsByTier } from '@/lib/data/agents';

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  // Warm the agent cache — used by agent selector in chat
  const agents = await getAgentsByTier('ALL');

  return (
    <div className="flex h-screen">
      <ConversationSidebar />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

// src/components/chat/conversation-sidebar.tsx
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { chatKeys } from '@/hooks/use-chat';

export function ConversationSidebar() {
  const { data: conversations, isLoading } = useQuery({
    queryKey: chatKeys.conversations(),
    queryFn: async () => {
      const res = await fetch('/api/chat/conversations');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    staleTime: 30 * 1000,    // 30s — conversations update when you chat
    refetchOnWindowFocus: true, // Check for new conversations
    refetchInterval: 60 * 1000, // Poll every 60s for new messages
  });

  if (isLoading) return <ConversationSidebarSkeleton />;

  return (
    <aside className="w-72 border-r overflow-y-auto">
      {conversations?.map((conv: any) => (
        <ConversationItem key={conv.id} conversation={conv} />
      ))}
    </aside>
  );
}
```

### Pattern 2: Dashboard with Mixed Cache Sources

```typescript
// src/app/dashboard/page.tsx
import { unstable_cache } from 'next/cache';
import { CacheTags } from '@/lib/cache-tags';
import { auth } from '@clerk/nextjs/server';

// Global stats: cached for 5 minutes, shared across all users
const getGlobalStats = unstable_cache(
  async () => {
    const [userCount, messageCount, agentCount] = await Promise.all([
      prisma.user.count(),
      prisma.message.count(),
      prisma.agent.count(),
    ]);
    return { userCount, messageCount, agentCount };
  },
  ['global-stats'],
  { revalidate: 300, tags: [CacheTags.dashboardGlobal()] }
);

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // User-specific stats: cached per-user for 2 minutes
  const getUserStats = unstable_cache(
    async () => {
      const [convCount, messageCount, referralCount] = await Promise.all([
        prisma.conversation.count({ where: { userId } }),
        prisma.message.count({ where: { conversation: { userId } } }),
        prisma.referral.count({ where: { referrerId: userId } }),
      ]);
      return { convCount, messageCount, referralCount };
    },
    [`user-stats-${userId}`],
    { revalidate: 120, tags: [CacheTags.dashboardUser(userId)] }
  );

  const [globalStats, userStats] = await Promise.all([
    getGlobalStats(),
    getUserStats(),
  ]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      <StatCard title="Your Conversations" value={userStats.convCount} />
      <StatCard title="Your Messages" value={userStats.messageCount} />
      <StatCard title="Your Referrals" value={userStats.referralCount} />
      <StatCard title="Total Users" value={globalStats.userCount} />
      <StatCard title="Total Messages" value={globalStats.messageCount} />
      <StatCard title="Available Agents" value={globalStats.agentCount} />
    </div>
  );
}
```

### Pattern 3: Settings Page — Cache on Read, Invalidate on Write

```typescript
// src/lib/data/settings.ts
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { CacheTags } from '@/lib/cache-tags';

const _getSettings = (userId: string) =>
  unstable_cache(
    async () => {
      return prisma.userSettings.findUnique({
        where: { userId },
      });
    },
    [`settings-${userId}`],
    { revalidate: 600, tags: [CacheTags.userSettings(userId)] }
  )();

// Request-level dedup
export const getSettings = cache(_getSettings);

// src/app/settings/page.tsx
import { getSettings } from '@/lib/data/settings';
import { auth } from '@clerk/nextjs/server';
import { SettingsForm } from '@/components/settings/settings-form';

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const settings = await getSettings(userId);

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <SettingsForm initialSettings={settings} />
    </div>
  );
}

// src/app/settings/actions.ts
'use server';

import { revalidateTag } from 'next/cache';
import { CacheTags } from '@/lib/cache-tags';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

const SettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.string().min(2).max(5),
  emailNotifications: z.boolean(),
  chatSoundEnabled: z.boolean(),
}).strict();

export async function saveSettings(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const data = SettingsSchema.parse(Object.fromEntries(formData));

  await prisma.userSettings.update({
    where: { userId },
    data,
  });

  // Invalidate the settings cache for this user
  revalidateTag(CacheTags.userSettings(userId));

  // Also invalidate user profile (settings affect display)
  revalidateTag(CacheTags.user(userId));
}
```

---

## Quick Reference

| Data Type | Server Cache | Client Cache (React Query) | Revalidation |
|-----------|-------------|---------------------------|--------------|
| Agent definitions | `unstable_cache` 1h | `staleTime: 10min` | On-demand (admin edit) |
| Chat messages | None (always fresh) | `staleTime: 5s` + optimistic | Instant (mutation) |
| Conversation list | None | `staleTime: 30s` + polling | Instant (new message) |
| User profile | `unstable_cache` 5min | `staleTime: 2min` | On-demand (profile edit) |
| Settings | `unstable_cache` 10min | N/A (server component) | On-demand (save) |
| Dashboard stats | `unstable_cache` 5min | `staleTime: 30s` | Time-based + on-demand |
| Forum posts | `unstable_cache` 1min | `staleTime: 1min` | On-demand (new post) |
| Help articles | ISR 24h | N/A (static page) | On-demand (admin edit) |
| Backdrops | `force-cache` | `staleTime: 30min` | On-demand (rarely changes) |
| Tier/pricing | `force-cache` | `staleTime: 1h` | On deploy |

---

## Summary

1. **Default in Next.js 16**: fetch() is NOT cached. Opt in explicitly.
2. **Server data**: Use `unstable_cache` with tags for Prisma queries.
3. **Deduplication**: Use React `cache()` for within-request dedup.
4. **Client data**: Use React Query with appropriate staleTime per data type.
5. **Invalidation**: Prefer `revalidateTag` over `revalidatePath` for precision.
6. **Chat**: Real-time needs short staleTime + optimistic updates.
7. **Static content**: ISR with on-demand revalidation for instant updates.
8. **Debug**: Check all four cache layers when data seems stale.
