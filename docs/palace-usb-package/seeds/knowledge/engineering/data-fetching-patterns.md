# Data Fetching Patterns — Deep Knowledge Seed

> Stone AI Engineering Knowledge Base
> Scope: Server Components, TanStack Query v5, Server Actions, Streaming, Pagination
> Stack: Next.js 16, TypeScript, Prisma, React Suspense

---

## Table of Contents

1. [Server Components Data Fetching](#server-components-data-fetching)
2. [TanStack Query v5 Client-Side Fetching](#tanstack-query-v5-client-side-fetching)
3. [Parallel, Dependent, and Prefetched Queries](#parallel-dependent-and-prefetched-queries)
4. [SWR vs React Query](#swr-vs-react-query)
5. [Server Actions for Mutations](#server-actions-for-mutations)
6. [Streaming with Suspense](#streaming-with-suspense)
7. [Error Handling](#error-handling)
8. [Loading States and Skeletons](#loading-states-and-skeletons)
9. [Pagination Patterns](#pagination-patterns)
10. [Real-World Examples](#real-world-examples)

---

## Server Components Data Fetching

### The Fundamental Shift

In Next.js 16 with the App Router, React Server Components (RSC) are the default. Components defined in the `app/` directory are server components unless marked with `"use client"`. This means you can fetch data directly at the component level without useEffect, useState, or any client-side fetching library.

### Direct Database Access in Server Components

```typescript
// src/app/agents/page.tsx
// This is a Server Component — runs ONLY on the server
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { AgentGrid } from '@/components/agents/agent-grid';

// Agent tier limits
const TIER_LIMITS: Record<string, number> = {
  free: 4,
  starter: 16,
  plus: 30,
  smart: 39,
  pro: 38,
};

export default async function AgentsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Direct Prisma query — no API route needed
  const user = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { tier: true },
  });

  const tier = user?.tier ?? 'free';
  const limit = TIER_LIMITS[tier] ?? 4;

  const agents = await prisma.agent.findMany({
    where: { isActive: true },
    orderBy: { number: 'asc' },
    take: limit,
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      number: true,
      tier: true,
      avatarUrl: true,
    },
  });

  // Data passed as props — serialized automatically
  return <AgentGrid agents={agents} userTier={tier} />;
}
```

### Fetching with External APIs

```typescript
// src/app/dashboard/page.tsx
import { auth } from '@clerk/nextjs/server';

interface DashboardStats {
  totalChats: number;
  messagesThisWeek: number;
  favoriteAgent: string;
  tokensUsed: number;
  tokensLimit: number;
}

async function getDashboardStats(userId: string): Promise<DashboardStats> {
  // Internal API call from server component
  const res = await fetch(`${process.env.INTERNAL_API_URL}/stats/${userId}`, {
    // Control caching behavior
    next: {
      revalidate: 60, // Revalidate every 60 seconds
      tags: ['dashboard-stats'], // Tag for on-demand revalidation
    },
    headers: {
      Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch stats: ${res.status}`);
  }

  return res.json();
}

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  const stats = await getDashboardStats(userId);

  return (
    <div className="grid grid-cols-2 gap-4 p-6">
      <StatCard title="Total Chats" value={stats.totalChats} />
      <StatCard title="Messages This Week" value={stats.messagesThisWeek} />
      <StatCard title="Favorite Agent" value={stats.favoriteAgent} />
      <TokenUsageBar used={stats.tokensUsed} limit={stats.tokensLimit} />
    </div>
  );
}
```

### Caching Strategies in Server Components

```typescript
// No caching — always fresh (dynamic rendering)
const data = await fetch(url, { cache: 'no-store' });

// Static — cached until redeployment
const data = await fetch(url, { cache: 'force-cache' });

// Time-based revalidation (ISR)
const data = await fetch(url, { next: { revalidate: 3600 } });

// Tag-based on-demand revalidation
const data = await fetch(url, { next: { tags: ['agents'] } });

// Revalidate from Server Action or Route Handler
import { revalidateTag, revalidatePath } from 'next/cache';

export async function updateAgent(id: string, data: AgentUpdate) {
  await prisma.agent.update({ where: { id }, data });
  revalidateTag('agents');          // Revalidate by tag
  revalidatePath('/agents');        // Revalidate specific path
  revalidatePath('/agents/[id]', 'page'); // Revalidate dynamic route
}
```

### Using unstable_cache for Database Queries

```typescript
import { unstable_cache } from 'next/cache';
import { prisma } from '@/lib/prisma';

// Cache database queries with tags
const getCachedAgents = unstable_cache(
  async (tier: string, limit: number) => {
    return prisma.agent.findMany({
      where: { isActive: true },
      orderBy: { number: 'asc' },
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        number: true,
        tier: true,
      },
    });
  },
  ['agents-list'], // Cache key prefix
  {
    tags: ['agents'],
    revalidate: 300, // 5 minutes
  }
);

// Usage in server component
export default async function AgentsPage() {
  const agents = await getCachedAgents('free', 4);
  return <AgentGrid agents={agents} />;
}
```

---

## TanStack Query v5 Client-Side Fetching

### Setup and Configuration

```typescript
// src/providers/query-provider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is fresh for 5 minutes — no refetch during this window
            staleTime: 5 * 60 * 1000,
            // Keep unused data in cache for 30 minutes
            gcTime: 30 * 60 * 1000, // renamed from cacheTime in v5
            // Retry failed requests 2 times with exponential backoff
            retry: 2,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Don't refetch on window focus in dev (annoying)
            refetchOnWindowFocus: process.env.NODE_ENV === 'production',
          },
          mutations: {
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

### useQuery Patterns

```typescript
// src/hooks/use-agents.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import type { Agent } from '@/types';

// Define query keys as constants for consistency
export const agentKeys = {
  all: ['agents'] as const,
  lists: () => [...agentKeys.all, 'list'] as const,
  list: (filters: AgentFilters) => [...agentKeys.lists(), filters] as const,
  details: () => [...agentKeys.all, 'detail'] as const,
  detail: (id: string) => [...agentKeys.details(), id] as const,
};

interface AgentFilters {
  category?: string;
  tier?: string;
  search?: string;
}

async function fetchAgents(filters: AgentFilters): Promise<Agent[]> {
  const params = new URLSearchParams();
  if (filters.category) params.set('category', filters.category);
  if (filters.tier) params.set('tier', filters.tier);
  if (filters.search) params.set('search', filters.search);

  const res = await fetch(`/api/agents?${params}`);

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export function useAgents(filters: AgentFilters = {}) {
  return useQuery({
    queryKey: agentKeys.list(filters),
    queryFn: () => fetchAgents(filters),
    // Only fetch when component mounts, not on every render
    staleTime: 10 * 60 * 1000,
    // Keep previous data while refetching with new filters
    placeholderData: (previousData) => previousData,
  });
}

// Individual agent fetch
async function fetchAgent(id: string): Promise<Agent> {
  const res = await fetch(`/api/agents/${id}`);
  if (!res.ok) throw new Error(`Agent not found: ${id}`);
  return res.json();
}

export function useAgent(id: string) {
  return useQuery({
    queryKey: agentKeys.detail(id),
    queryFn: () => fetchAgent(id),
    enabled: !!id, // Don't fetch if id is empty
  });
}
```

### useMutation Patterns

```typescript
// src/hooks/use-chat-mutations.ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { chatKeys } from './use-chat';

interface SendMessageInput {
  conversationId: string;
  content: string;
  agentId: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SendMessageInput): Promise<Message> => {
      const res = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to send message');
      }

      return res.json();
    },

    // Optimistic update — show message immediately
    onMutate: async (input) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: chatKeys.messages(input.conversationId),
      });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData<Message[]>(
        chatKeys.messages(input.conversationId)
      );

      // Optimistically add the user message
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: input.content,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Message[]>(
        chatKeys.messages(input.conversationId),
        (old = []) => [...old, optimisticMessage]
      );

      return { previousMessages };
    },

    // On success, replace optimistic data with real data
    onSuccess: (newMessage, input) => {
      queryClient.setQueryData<Message[]>(
        chatKeys.messages(input.conversationId),
        (old = []) =>
          old.map((msg) =>
            msg.id.startsWith('temp-') ? newMessage : msg
          )
      );
    },

    // On error, rollback to previous state
    onError: (_error, input, context) => {
      if (context?.previousMessages) {
        queryClient.setQueryData(
          chatKeys.messages(input.conversationId),
          context.previousMessages
        );
      }
    },

    // Always refetch after mutation settles
    onSettled: (_data, _error, input) => {
      queryClient.invalidateQueries({
        queryKey: chatKeys.messages(input.conversationId),
      });
    },
  });
}

// Settings update mutation
export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<UserSettings>) => {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!res.ok) throw new Error('Failed to update settings');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      // Also invalidate dependent queries
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
    },
  });
}

// Delete mutation with confirmation
export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete conversation');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
    },
  });
}
```

### useInfiniteQuery for Paginated Data

```typescript
// src/hooks/use-chat-messages.ts
'use client';

import { useInfiniteQuery } from '@tanstack/react-query';

interface MessagesPage {
  messages: Message[];
  nextCursor: string | null;
  hasMore: boolean;
}

export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  messages: (conversationId: string) =>
    [...chatKeys.all, 'messages', conversationId] as const,
};

export function useChatMessages(conversationId: string) {
  return useInfiniteQuery({
    queryKey: chatKeys.messages(conversationId),
    queryFn: async ({ pageParam }): Promise<MessagesPage> => {
      const params = new URLSearchParams();
      if (pageParam) params.set('cursor', pageParam);
      params.set('limit', '50');

      const res = await fetch(
        `/api/conversations/${conversationId}/messages?${params}`
      );

      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    // For chat: load oldest messages first (reverse chronological)
    // Pages are in reverse order — newest page first
    select: (data) => ({
      pages: [...data.pages].reverse(),
      pageParams: [...data.pageParams].reverse(),
    }),
    enabled: !!conversationId,
    staleTime: 0, // Chat messages should always be fresh
  });
}

// Usage in component
function ChatMessages({ conversationId }: { conversationId: string }) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useChatMessages(conversationId);

  const messages = data?.pages.flatMap((page) => page.messages) ?? [];

  // Intersection observer to load more messages
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) return <ChatSkeleton />;
  if (isError) return <ErrorMessage error={error} />;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Load more trigger at the top (for reverse scroll) */}
      <div ref={loadMoreRef}>
        {isFetchingNextPage && <LoadingSpinner size="sm" />}
      </div>

      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
    </div>
  );
}
```

---

## Parallel, Dependent, and Prefetched Queries

### Parallel Queries

```typescript
// Multiple independent queries that run simultaneously
'use client';

import { useQuery, useQueries } from '@tanstack/react-query';

// Option 1: Multiple useQuery calls (auto-parallel)
function DashboardPage() {
  const agents = useQuery({ queryKey: ['agents'], queryFn: fetchAgents });
  const stats = useQuery({ queryKey: ['stats'], queryFn: fetchStats });
  const notifications = useQuery({
    queryKey: ['notifications'],
    queryFn: fetchNotifications,
  });

  // All three queries fire simultaneously
  const isLoading = agents.isLoading || stats.isLoading || notifications.isLoading;

  if (isLoading) return <DashboardSkeleton />;

  return (
    <div>
      <AgentList agents={agents.data!} />
      <StatsGrid stats={stats.data!} />
      <NotificationList notifications={notifications.data!} />
    </div>
  );
}

// Option 2: useQueries for dynamic parallel queries
function AgentComparison({ agentIds }: { agentIds: string[] }) {
  const agentQueries = useQueries({
    queries: agentIds.map((id) => ({
      queryKey: agentKeys.detail(id),
      queryFn: () => fetchAgent(id),
      staleTime: 5 * 60 * 1000,
    })),
    // v5: combine results
    combine: (results) => ({
      data: results.map((r) => r.data).filter(Boolean),
      isLoading: results.some((r) => r.isLoading),
      isError: results.some((r) => r.isError),
    }),
  });

  if (agentQueries.isLoading) return <ComparisonSkeleton />;

  return <ComparisonTable agents={agentQueries.data} />;
}
```

### Dependent (Serial) Queries

```typescript
// Query that depends on the result of another query
function UserConversations() {
  // First: get the current user
  const userQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: fetchCurrentUser,
  });

  // Second: get conversations using the user ID
  const conversationsQuery = useQuery({
    queryKey: ['conversations', userQuery.data?.id],
    queryFn: () => fetchConversations(userQuery.data!.id),
    // Only run when user data is available
    enabled: !!userQuery.data?.id,
  });

  // Third: get unread counts using conversation IDs
  const unreadQuery = useQuery({
    queryKey: ['unread', conversationsQuery.data?.map((c) => c.id)],
    queryFn: () =>
      fetchUnreadCounts(conversationsQuery.data!.map((c) => c.id)),
    enabled: !!conversationsQuery.data && conversationsQuery.data.length > 0,
  });

  if (userQuery.isLoading) return <UserSkeleton />;
  if (conversationsQuery.isLoading) return <ConversationListSkeleton />;

  return (
    <ConversationList
      conversations={conversationsQuery.data ?? []}
      unreadCounts={unreadQuery.data ?? {}}
    />
  );
}
```

### Prefetching

```typescript
// Prefetch on hover — load data before user clicks
'use client';

import { useQueryClient } from '@tanstack/react-query';

function AgentCard({ agent }: { agent: Agent }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleMouseEnter = () => {
    // Prefetch agent details when user hovers
    queryClient.prefetchQuery({
      queryKey: agentKeys.detail(agent.id),
      queryFn: () => fetchAgent(agent.id),
      staleTime: 5 * 60 * 1000,
    });
  };

  const handleClick = () => {
    router.push(`/agents/${agent.id}`);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      className="cursor-pointer rounded-lg border p-4 hover:border-primary transition-colors"
    >
      <h3>{agent.name}</h3>
      <p>{agent.description}</p>
    </div>
  );
}

// Prefetch from server component (hydration)
// src/app/agents/page.tsx
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';

export default async function AgentsPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: agentKeys.lists(),
    queryFn: () => fetchAgentsFromDB(),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AgentListClient />
    </HydrationBoundary>
  );
}
```

### Query Invalidation Patterns

```typescript
const queryClient = useQueryClient();

// Invalidate a single query
queryClient.invalidateQueries({ queryKey: agentKeys.detail('123') });

// Invalidate all agent queries (list + details)
queryClient.invalidateQueries({ queryKey: agentKeys.all });

// Invalidate all lists but keep details cached
queryClient.invalidateQueries({ queryKey: agentKeys.lists() });

// Invalidate with predicate
queryClient.invalidateQueries({
  predicate: (query) =>
    query.queryKey[0] === 'agents' &&
    (query.queryKey[2] as AgentFilters)?.tier === 'free',
});

// Remove queries entirely (useful for logout)
queryClient.removeQueries({ queryKey: ['user'] });
queryClient.clear(); // Remove everything
```

---

## SWR vs React Query

### When to Use Each

| Feature | TanStack Query v5 | SWR |
|---|---|---|
| Bundle size | ~13KB | ~4KB |
| Mutations | Built-in useMutation with optimistic updates | Manual with mutate() |
| Infinite queries | useInfiniteQuery | useSWRInfinite |
| Parallel queries | useQueries | Multiple useSWR calls |
| Devtools | Official devtools | Community devtools |
| Prefetching | queryClient.prefetchQuery | preload() |
| Offline support | Built-in | Plugin required |
| Query cancellation | AbortController integration | Manual |
| Dependent queries | enabled option | Conditional return |
| Cache persistence | persistQueryClient plugin | Custom |
| TypeScript | Excellent | Good |

### Recommendation for Stone AI

Use TanStack Query for the main application because:
1. Mutations are central (chat, settings, billing) — useMutation with optimistic updates is a major win
2. Infinite scroll in chat requires useInfiniteQuery
3. Complex cache invalidation patterns across related data
4. DevTools help debug data flow issues

Use SWR for simpler use cases:
1. Static data displays (public pages, docs)
2. Simple GET-only data where mutations are via server actions
3. When bundle size is critical (4KB vs 13KB)

### SWR Pattern (For Reference)

```typescript
'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function AgentList() {
  const { data, error, isLoading, mutate } = useSWR<Agent[]>(
    '/api/agents',
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
    }
  );

  if (isLoading) return <AgentListSkeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div>
      {data?.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}
```

---

## Server Actions for Mutations

### Basic Server Actions

```typescript
// src/app/actions/agent-actions.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const FavoriteAgentSchema = z.object({
  agentId: z.string().uuid(),
}).strict();

export async function toggleFavoriteAgent(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const parsed = FavoriteAgentSchema.parse({
    agentId: formData.get('agentId'),
  });

  const existing = await prisma.favoriteAgent.findUnique({
    where: {
      userId_agentId: {
        userId,
        agentId: parsed.agentId,
      },
    },
  });

  if (existing) {
    await prisma.favoriteAgent.delete({
      where: { id: existing.id },
    });
  } else {
    await prisma.favoriteAgent.create({
      data: {
        userId,
        agentId: parsed.agentId,
      },
    });
  }

  revalidatePath('/agents');
}

// With typed return value
const UpdateProfileSchema = z.object({
  displayName: z.string().min(2).max(50),
  bio: z.string().max(500).optional(),
}).strict();

type ActionResult = {
  success: boolean;
  error?: string;
};

export async function updateProfile(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: 'Unauthorized' };

    const data = UpdateProfileSchema.parse({
      displayName: formData.get('displayName'),
      bio: formData.get('bio'),
    });

    await prisma.user.update({
      where: { clerkId: userId },
      data,
    });

    revalidatePath('/settings');
    return { success: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    return { success: false, error: 'Failed to update profile' };
  }
}
```

### Using Server Actions with useActionState

```typescript
// src/components/settings/profile-form.tsx
'use client';

import { useActionState } from 'react';
import { updateProfile } from '@/app/actions/agent-actions';

export function ProfileForm({ currentName, currentBio }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, {
    success: false,
  });

  return (
    <form action={formAction}>
      <div className="space-y-4">
        <div>
          <label htmlFor="displayName">Display Name</label>
          <input
            id="displayName"
            name="displayName"
            defaultValue={currentName}
            disabled={isPending}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        <div>
          <label htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            name="bio"
            defaultValue={currentBio}
            disabled={isPending}
            rows={4}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>

        {state.error && (
          <div role="alert" className="rounded-md bg-red-50 p-3 text-red-700">
            {state.error}
          </div>
        )}

        {state.success && (
          <div className="rounded-md bg-green-50 p-3 text-green-700">
            Profile updated successfully!
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-primary px-4 py-2 text-white disabled:opacity-50"
        >
          {isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
```

### Server Actions with TanStack Query

```typescript
// Combining server actions with React Query for optimistic updates
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleFavoriteAgent } from '@/app/actions/agent-actions';

export function useFavoriteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (agentId: string) => {
      const formData = new FormData();
      formData.set('agentId', agentId);
      return toggleFavoriteAgent(formData);
    },
    onMutate: async (agentId) => {
      await queryClient.cancelQueries({ queryKey: ['favorites'] });

      const previous = queryClient.getQueryData<string[]>(['favorites']);

      queryClient.setQueryData<string[]>(['favorites'], (old = []) =>
        old.includes(agentId)
          ? old.filter((id) => id !== agentId)
          : [...old, agentId]
      );

      return { previous };
    },
    onError: (_err, _agentId, context) => {
      queryClient.setQueryData(['favorites'], context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });
}
```

---

## Streaming with Suspense

### Suspense Boundaries

```typescript
// src/app/chat/page.tsx
import { Suspense } from 'react';

export default function ChatPage() {
  return (
    <div className="flex h-screen">
      {/* Sidebar loads independently */}
      <Suspense fallback={<SidebarSkeleton />}>
        <ConversationSidebar />
      </Suspense>

      <main className="flex-1 flex flex-col">
        {/* Chat header loads fast (minimal data) */}
        <Suspense fallback={<HeaderSkeleton />}>
          <ChatHeader />
        </Suspense>

        {/* Messages are the heavy load */}
        <Suspense fallback={<MessagesSkeleton />}>
          <ChatMessages />
        </Suspense>

        {/* Input is static — no suspense needed */}
        <ChatInput />
      </main>
    </div>
  );
}
```

### Streaming Server Components

```typescript
// src/app/dashboard/page.tsx
import { Suspense } from 'react';

// This component fetches fast data
async function QuickStats() {
  const stats = await getQuickStats(); // ~100ms
  return <StatsGrid stats={stats} />;
}

// This component fetches slow data
async function DetailedAnalytics() {
  const analytics = await getDetailedAnalytics(); // ~2000ms
  return <AnalyticsChart data={analytics} />;
}

// This component fetches medium data
async function RecentActivity() {
  const activity = await getRecentActivity(); // ~500ms
  return <ActivityFeed items={activity} />;
}

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-12 gap-4 p-6">
      {/* Fast section renders first */}
      <div className="col-span-12">
        <Suspense fallback={<StatsGridSkeleton />}>
          <QuickStats />
        </Suspense>
      </div>

      {/* Medium section streams in next */}
      <div className="col-span-8">
        <Suspense fallback={<ActivitySkeleton />}>
          <RecentActivity />
        </Suspense>
      </div>

      {/* Slow section streams in last */}
      <div className="col-span-4">
        <Suspense fallback={<AnalyticsSkeleton />}>
          <DetailedAnalytics />
        </Suspense>
      </div>
    </div>
  );
}
```

### Streaming AI Responses (SSE Pattern)

```typescript
// src/hooks/use-chat-stream.ts
'use client';

import { useState, useCallback, useRef } from 'react';

interface StreamOptions {
  agentId: string;
  conversationId: string;
  onToken: (token: string) => void;
  onComplete: (fullResponse: string) => void;
  onError: (error: Error) => void;
}

export function useChatStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stream = useCallback(async (
    message: string,
    options: StreamOptions
  ) => {
    setIsStreaming(true);
    abortControllerRef.current = new AbortController();
    let fullResponse = '';

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          agentId: options.agentId,
          conversationId: options.conversationId,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        throw new Error(`Stream failed: ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              options.onComplete(fullResponse);
              return;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                fullResponse += parsed.content;
                options.onToken(parsed.content);
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      }

      options.onComplete(fullResponse);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        options.onComplete(fullResponse); // Partial response
      } else {
        options.onError(error instanceof Error ? error : new Error(String(error)));
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { stream, stop, isStreaming };
}

// Usage in chat component
function ChatInterface({ agentId, conversationId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const { stream, stop, isStreaming } = useChatStream();

  const handleSend = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Stream AI response
    setStreamingContent('');
    await stream(content, {
      agentId,
      conversationId,
      onToken: (token) => {
        setStreamingContent((prev) => prev + token);
      },
      onComplete: (fullResponse) => {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: fullResponse,
            createdAt: new Date().toISOString(),
          },
        ]);
        setStreamingContent('');
      },
      onError: (error) => {
        console.error('Stream error:', error);
        // Show error toast
      },
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {streamingContent && (
          <ChatMessage
            message={{
              id: 'streaming',
              role: 'assistant',
              content: streamingContent,
              createdAt: new Date().toISOString(),
            }}
            isStreaming
          />
        )}
      </div>
      <ChatInput
        onSend={handleSend}
        onStop={stop}
        isLoading={isStreaming}
      />
    </div>
  );
}
```

---

## Error Handling

### Error Boundaries

```typescript
// src/components/error-boundary.tsx
'use client';

import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error, errorInfo);
    // Log to error tracking service
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <h2 className="text-lg font-semibold text-destructive">
              Something went wrong
            </h2>
            <p className="mt-2 text-muted-foreground">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-4 rounded-md bg-primary px-4 py-2 text-primary-foreground"
            >
              Try Again
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

// Next.js App Router error.tsx
// src/app/chat/error.tsx
'use client';

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <h2 className="text-xl font-semibold">Chat Error</h2>
      <p className="text-muted-foreground">
        {error.message || 'Failed to load chat'}
      </p>
      <button
        onClick={reset}
        className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
      >
        Try Again
      </button>
    </div>
  );
}
```

### Query Error Handling

```typescript
// Global error handler for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error instanceof Error && error.message.includes('4')) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      onError: (error) => {
        // Global mutation error handler
        if (error instanceof Error) {
          if (error.message.includes('401')) {
            // Redirect to sign-in
            window.location.href = '/sign-in';
          } else if (error.message.includes('429')) {
            toast.error('Rate limit exceeded. Please wait a moment.');
          } else {
            toast.error(error.message || 'Something went wrong');
          }
        }
      },
    },
  },
});

// Per-query error handling
function AgentDetail({ agentId }: { agentId: string }) {
  const { data, error, isError, refetch } = useAgent(agentId);

  if (isError) {
    if (error.message.includes('404')) {
      return <NotFound message="Agent not found" />;
    }
    if (error.message.includes('403')) {
      return <UpgradePrompt message="Upgrade to access this agent" />;
    }
    return (
      <ErrorState
        message={error.message}
        onRetry={() => refetch()}
      />
    );
  }

  return data ? <AgentProfile agent={data} /> : null;
}
```

### API Response Error Types

```typescript
// src/lib/api-error.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static fromResponse(res: Response, body?: any): ApiError {
    return new ApiError(
      body?.message || body?.error || `HTTP ${res.status}`,
      res.status,
      body?.code,
      body?.details
    );
  }

  get isUnauthorized() { return this.status === 401; }
  get isForbidden() { return this.status === 403; }
  get isNotFound() { return this.status === 404; }
  get isRateLimit() { return this.status === 429; }
  get isServerError() { return this.status >= 500; }
}

// Typed fetch wrapper
export async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    throw ApiError.fromResponse(res, body);
  }

  return body as T;
}
```

---

## Loading States and Skeletons

```typescript
// src/components/skeletons/chat-skeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';

export function ChatMessageSkeleton() {
  return (
    <div className="flex gap-3 p-4">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <ChatMessageSkeleton key={i} />
      ))}
    </div>
  );
}

export function AgentCardSkeleton() {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function AgentGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <AgentCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Loading.tsx files for route-level loading
// src/app/agents/loading.tsx
export default function AgentsLoading() {
  return (
    <div className="p-6">
      <Skeleton className="h-8 w-48 mb-6" />
      <AgentGridSkeleton count={12} />
    </div>
  );
}

// Shimmer loading effect for content areas
export function ContentSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-muted rounded"
          style={{ width: `${Math.random() * 40 + 60}%` }}
        />
      ))}
    </div>
  );
}
```

---

## Pagination Patterns

### Offset-Based Pagination

```typescript
// src/hooks/use-paginated-agents.ts
'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';

interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function usePaginatedAgents(page: number, pageSize = 12) {
  return useQuery({
    queryKey: ['agents', 'paginated', { page, pageSize }],
    queryFn: async (): Promise<PaginatedResponse<Agent>> => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      return apiFetch(`/api/agents?${params}`);
    },
    placeholderData: keepPreviousData, // Keep old data while fetching new page
  });
}

// Component
function PaginatedAgentList() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isPlaceholderData } = usePaginatedAgents(page);

  return (
    <div>
      <div className={cn(
        'grid grid-cols-4 gap-4',
        isPlaceholderData && 'opacity-50 transition-opacity'
      )}>
        {data?.data.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      <div className="flex items-center justify-between mt-6">
        <p className="text-sm text-muted-foreground">
          Page {data?.page} of {data?.totalPages} ({data?.total} agents)
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={isPlaceholderData || !data || page >= data.totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
```

### Cursor-Based Pagination

```typescript
// API route handler
// src/app/api/conversations/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const cursor = req.nextUrl.searchParams.get('cursor');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');

  const conversations = await prisma.conversation.findMany({
    where: { userId },
    take: limit + 1, // Fetch one extra to check if there are more
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1, // Skip the cursor item itself
    }),
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      updatedAt: true,
      agent: { select: { name: true, avatarUrl: true } },
      _count: { select: { messages: true } },
    },
  });

  const hasMore = conversations.length > limit;
  const data = hasMore ? conversations.slice(0, -1) : conversations;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return NextResponse.json({
    conversations: data,
    nextCursor,
    hasMore,
  });
}
```

### Infinite Scroll Pattern

```typescript
// src/components/conversations/conversation-list.tsx
'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';

export function ConversationList() {
  const { ref, inView } = useInView({ threshold: 0 });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['conversations'],
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ limit: '20' });
      if (pageParam) params.set('cursor', pageParam);
      return apiFetch(`/api/conversations?${params}`);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
  });

  // Auto-fetch when sentinel comes into view
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const conversations = data?.pages.flatMap((p) => p.conversations) ?? [];

  if (isLoading) return <ConversationListSkeleton />;

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground">No conversations yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Start chatting with an agent to see your conversations here
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y">
      {conversations.map((conv) => (
        <ConversationItem key={conv.id} conversation={conv} />
      ))}

      {/* Sentinel element for infinite scroll */}
      <div ref={ref} className="py-4 text-center">
        {isFetchingNextPage && <LoadingSpinner size="sm" />}
        {!hasNextPage && conversations.length > 20 && (
          <p className="text-xs text-muted-foreground">
            You have reached the end
          </p>
        )}
      </div>
    </div>
  );
}
```

---

## Real-World Examples

### Chat Message Fetching (Full Implementation)

```typescript
// src/hooks/use-conversation.ts
'use client';

import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-error';
import { useChatStream } from './use-chat-stream';

export function useConversation(conversationId: string | null) {
  const queryClient = useQueryClient();
  const { stream, stop, isStreaming } = useChatStream();

  // Fetch conversation metadata
  const conversation = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => apiFetch(`/api/conversations/${conversationId}`),
    enabled: !!conversationId,
  });

  // Fetch messages with infinite scroll
  const messages = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({ limit: '50' });
      if (pageParam) params.set('cursor', pageParam);
      return apiFetch(`/api/conversations/${conversationId}/messages?${params}`);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!conversationId,
    staleTime: 0,
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async ({ content, useStreaming }: { content: string; useStreaming: boolean }) => {
      if (!conversationId) throw new Error('No conversation selected');

      if (useStreaming) {
        return new Promise<string>((resolve, reject) => {
          stream(content, {
            agentId: conversation.data?.agentId,
            conversationId,
            onToken: () => {},
            onComplete: resolve,
            onError: reject,
          });
        });
      }

      return apiFetch('/api/chat/messages', {
        method: 'POST',
        body: JSON.stringify({
          conversationId,
          content,
          agentId: conversation.data?.agentId,
        }),
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Create new conversation
  const createConversation = useMutation({
    mutationFn: (agentId: string) =>
      apiFetch('/api/conversations', {
        method: 'POST',
        body: JSON.stringify({ agentId }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  const allMessages = messages.data?.pages.flatMap((p) => p.messages) ?? [];

  return {
    conversation: conversation.data,
    messages: allMessages,
    isLoadingConversation: conversation.isLoading,
    isLoadingMessages: messages.isLoading,
    sendMessage,
    createConversation,
    fetchOlderMessages: messages.fetchNextPage,
    hasOlderMessages: messages.hasNextPage,
    isStreaming,
    stopStreaming: stop,
  };
}
```

### Agent List with Filtering and Search

```typescript
// src/hooks/use-agent-list.ts
'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from './use-debounce';
import { useState, useMemo } from 'react';

interface UseAgentListOptions {
  userTier: string;
}

export function useAgentList({ userTier }: UseAgentListOptions) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search, 300);
  const queryClient = useQueryClient();

  const { data: agents = [], isLoading, isError } = useQuery({
    queryKey: agentKeys.list({
      search: debouncedSearch,
      category: category ?? undefined,
      tier: userTier,
    }),
    queryFn: () =>
      apiFetch<Agent[]>(
        `/api/agents?${new URLSearchParams({
          ...(debouncedSearch && { search: debouncedSearch }),
          ...(category && { category }),
          tier: userTier,
        })}`
      ),
  });

  // Client-side category aggregation
  const categories = useMemo(() => {
    const cats = new Set(agents.map((a) => a.category));
    return Array.from(cats).sort();
  }, [agents]);

  // Prefetch agent details on hover
  const prefetchAgent = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: agentKeys.detail(id),
      queryFn: () => apiFetch<Agent>(`/api/agents/${id}`),
      staleTime: 5 * 60 * 1000,
    });
  };

  return {
    agents,
    isLoading,
    isError,
    search,
    setSearch,
    category,
    setCategory,
    categories,
    prefetchAgent,
  };
}

// Component using the hook
function AgentListPage() {
  const { user } = useUser();
  const tier = (user?.publicMetadata?.tier as string) ?? 'free';

  const {
    agents,
    isLoading,
    search,
    setSearch,
    category,
    setCategory,
    categories,
    prefetchAgent,
  } = useAgentList({ userTier: tier });

  return (
    <div className="p-6 space-y-6">
      <div className="flex gap-4">
        <input
          type="search"
          placeholder="Search agents..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-md border px-3 py-2"
        />
        <select
          value={category ?? ''}
          onChange={(e) => setCategory(e.target.value || null)}
          className="rounded-md border px-3 py-2"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <AgentGridSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onMouseEnter={() => prefetchAgent(agent.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Settings CRUD Operations

```typescript
// src/hooks/use-settings.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface UserSettings {
  displayName: string;
  email: string;
  bio: string;
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    marketing: boolean;
  };
  privacy: {
    showProfile: boolean;
    showActivity: boolean;
  };
}

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => apiFetch<UserSettings>('/api/settings'),
    staleTime: 10 * 60 * 1000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<UserSettings>) =>
      apiFetch<UserSettings>('/api/settings', {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),

    // Optimistic update
    onMutate: async (updates) => {
      await queryClient.cancelQueries({ queryKey: ['settings'] });
      const previous = queryClient.getQueryData<UserSettings>(['settings']);

      queryClient.setQueryData<UserSettings>(['settings'], (old) =>
        old ? { ...old, ...updates } : old
      );

      return { previous };
    },

    onError: (_err, _updates, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['settings'], context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });
}

// Theme-specific setting with immediate feedback
export function useThemeSetting() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  const setTheme = (theme: 'light' | 'dark' | 'system') => {
    // Apply immediately to DOM
    document.documentElement.classList.remove('light', 'dark');
    if (theme !== 'system') {
      document.documentElement.classList.add(theme);
    }

    // Persist to server
    updateSettings.mutate({ theme });
  };

  return {
    theme: settings?.theme ?? 'system',
    setTheme,
    isPending: updateSettings.isPending,
  };
}
```

---

## Quick Reference

| Pattern | When to Use | Key API |
|---|---|---|
| Server Component fetch | Initial page data, SEO content | `async function Page()` |
| unstable_cache | Cached DB queries in server components | `unstable_cache(fn, keys, opts)` |
| useQuery | Read-only client data | `useQuery({ queryKey, queryFn })` |
| useMutation | Create/update/delete operations | `useMutation({ mutationFn, onSuccess })` |
| useInfiniteQuery | Paginated/infinite scroll data | `useInfiniteQuery({ getNextPageParam })` |
| Optimistic updates | Instant UI feedback | `onMutate` + rollback in `onError` |
| Server Actions | Form submissions, simple mutations | `'use server'` + `useActionState` |
| SSE streaming | AI chat responses | `ReadableStream` + `EventSource` |
| Prefetching | Hover-to-load, route prefetch | `queryClient.prefetchQuery()` |
| HydrationBoundary | Server-to-client data handoff | `dehydrate(queryClient)` |

---

*This seed covers every data fetching pattern used in Stone AI's frontend. The key principle: fetch on the server when you can (zero client JS), use React Query when you need interactivity (optimistic updates, infinite scroll, real-time), and use Server Actions for form-based mutations.*
