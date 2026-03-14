# Next.js 16 App Router — Production Patterns

> Palace Engineering Seed — Senior Frontend Engineer
> Stack: Next.js 16.1.6, React 19, TypeScript, Clerk Auth, Vercel Deployment
> Context: Stone AI SaaS — stone-ai.net, Neon DB, Cloudflare DNS, 44 agents

---

## Table of Contents

1. [Server Components vs Client Components](#1-server-components-vs-client-components)
2. [Server Actions vs API Routes](#2-server-actions-vs-api-routes)
3. [Streaming SSR with Suspense](#3-streaming-ssr-with-suspense)
4. [Middleware Patterns](#4-middleware-patterns)
5. [Route Groups & Layout Composition](#5-route-groups--layout-composition)
6. [Parallel Routes & Intercepting Routes](#6-parallel-routes--intercepting-routes)
7. [ISR Strategies](#7-isr-strategies)
8. [Edge Runtime vs Node Runtime](#8-edge-runtime-vs-node-runtime)
9. [Image Optimization](#9-image-optimization)
10. [Metadata & SEO](#10-metadata--seo)
11. [Error Boundaries](#11-error-boundaries)
12. [Route Handlers with Typing & Streaming](#12-route-handlers-with-typing--streaming)
13. [Auth Middleware with Clerk](#13-auth-middleware-with-clerk)

---

## 1. Server Components vs Client Components

### Decision Tree

```
Does this component...
│
├── Need useState, useEffect, useRef, or any hook?
│   └── CLIENT COMPONENT ('use client')
│
├── Need onClick, onChange, onSubmit, or any event handler?
│   └── CLIENT COMPONENT
│
├── Need browser APIs (window, document, localStorage)?
│   └── CLIENT COMPONENT
│
├── Need context (useContext)?
│   └── CLIENT COMPONENT
│
├── Need to use a client-only library (framer-motion, react-hook-form)?
│   └── CLIENT COMPONENT
│
├── Fetch data and render it (no interactivity)?
│   └── SERVER COMPONENT (default — no directive needed)
│
├── Read from database directly (Prisma, SQL)?
│   └── SERVER COMPONENT
│
├── Access server-only secrets (API keys, env vars)?
│   └── SERVER COMPONENT
│
├── Render markdown, format dates, transform data?
│   └── SERVER COMPONENT (keeps JS out of the bundle)
│
└── Large static content (terms of service, help pages)?
    └── SERVER COMPONENT (zero client JS)
```

### The Boundary Pattern: Server Shell + Client Island

```typescript
// app/app/chat/[conversationId]/page.tsx — SERVER COMPONENT
// Fetches data on the server, passes it down to interactive client parts

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { ChatPanel } from '@/components/chat/chat-panel';
import { ConversationHeader } from '@/components/chat/conversation-header';

interface Props {
  params: Promise<{ conversationId: string }>;
}

export default async function ChatPage({ params }: Props) {
  const { conversationId } = await params;
  const { userId } = await auth();

  if (!userId) redirect('/sign-in');

  // Direct DB access — no API call overhead
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId, userId },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      agent: true,
    },
  });

  if (!conversation) notFound();

  return (
    <div className="flex flex-col h-full">
      {/* Server-rendered header — no JS shipped */}
      <ConversationHeader
        title={conversation.title}
        agentName={conversation.agent.name}
        agentNumber={conversation.agent.number}
      />

      {/* Client boundary — interactive chat */}
      <ChatPanel
        conversationId={conversationId}
        initialMessages={conversation.messages.reverse()}
        agentId={conversation.agent.id}
      />
    </div>
  );
}

// components/chat/conversation-header.tsx — SERVER COMPONENT (no directive)
// Pure rendering. Zero client JS.
export function ConversationHeader({
  title,
  agentName,
  agentNumber,
}: {
  title: string;
  agentName: string;
  agentNumber: number | null;
}) {
  return (
    <header className="border-b px-6 py-4 flex items-center gap-3">
      <h1 className="text-lg font-semibold">{title}</h1>
      <span className="text-sm text-muted-foreground">
        {agentName}{agentNumber ? ` #${agentNumber}` : ''}
      </span>
    </header>
  );
}

// components/chat/chat-panel.tsx — CLIENT COMPONENT
'use client';

import { useChat } from '@/hooks/use-chat';

export function ChatPanel({
  conversationId,
  initialMessages,
  agentId,
}: {
  conversationId: string;
  initialMessages: Message[];
  agentId: string;
}) {
  const { messages, sendMessage, isStreaming, streamingText, cancelStream } =
    useChat(conversationId, { initialMessages });

  return (
    <div className="flex-1 flex flex-col">
      <MessageList messages={messages} streamingText={streamingText} />
      <ChatInput
        onSend={sendMessage}
        onCancel={cancelStream}
        isStreaming={isStreaming}
      />
    </div>
  );
}
```

### Common Mistake: Making Everything a Client Component

```typescript
// WRONG: Entire page is a client component for one button
'use client';

export default function AgentsPage() {
  const [search, setSearch] = useState('');
  const agents = useQuery({ queryKey: ['agents'], queryFn: fetchAgents });

  return (
    <div>
      <h1>Agents</h1>
      {/* 90% of this page is static rendering that doesn't need JS */}
      <input value={search} onChange={(e) => setSearch(e.target.value)} />
      {agents.data?.map((a) => (
        <AgentCard key={a.id} agent={a} />
      ))}
    </div>
  );
}

// RIGHT: Server component page with a small client island for search
// app/app/agents/page.tsx (SERVER)
import { prisma } from '@/lib/prisma';
import { AgentSearch } from '@/components/agents/agent-search';

export default async function AgentsPage() {
  const agents = await prisma.agent.findMany({
    orderBy: { number: 'asc' },
  });

  return (
    <div>
      <h1>Agents</h1>
      {/* Only the search + filtering is client-side */}
      <AgentSearch agents={agents} />
    </div>
  );
}
```

---

## 2. Server Actions vs API Routes

### Decision Tree

```
What is the operation?
│
├── MUTATION triggered by a form or button click?
│   ├── Progressive enhancement needed (works without JS)?
│   │   └── SERVER ACTION (form action={})
│   ├── Simple create/update/delete from a component?
│   │   └── SERVER ACTION (simpler, less boilerplate)
│   └── Needs fine-grained response control (streaming, custom headers)?
│       └── API ROUTE (route.ts)
│
├── QUERY/READ operation?
│   ├── Page load data?
│   │   └── SERVER COMPONENT (fetch in the component directly)
│   ├── Client-triggered fetch (search, infinite scroll)?
│   │   └── API ROUTE + React Query
│   └── Revalidation after mutation?
│       └── SERVER ACTION with revalidatePath/revalidateTag
│
├── WEBHOOK receiver (Stripe, Clerk)?
│   └── API ROUTE (needs raw body access, custom status codes)
│
├── STREAMING response (AI chat)?
│   └── API ROUTE (ReadableStream, SSE)
│
└── EXTERNAL API consumer (mobile app, third-party)?
    └── API ROUTE (REST endpoint)
```

### Server Action Examples

```typescript
// src/app/app/settings/actions.ts
'use server';

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50),
  bio: z.string().max(500).optional(),
}).strict();

export async function updateProfile(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const raw = {
    displayName: formData.get('displayName'),
    bio: formData.get('bio'),
  };

  const validated = updateProfileSchema.parse(raw);

  await prisma.user.update({
    where: { clerkId: userId },
    data: validated,
  });

  revalidatePath('/app/settings');
}

// Server action that returns data (for useActionState)
export async function createConversation(
  _prevState: { error?: string; conversationId?: string },
  formData: FormData
): Promise<{ error?: string; conversationId?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: 'Unauthorized' };

  const agentId = formData.get('agentId') as string;
  if (!agentId) return { error: 'Agent is required' };

  try {
    const conversation = await prisma.conversation.create({
      data: {
        userId,
        agentId,
        title: 'New conversation',
      },
    });

    revalidatePath('/app/chat');
    return { conversationId: conversation.id };
  } catch (err) {
    return { error: 'Failed to create conversation' };
  }
}

// Usage in component with useActionState (React 19)
'use client';

import { useActionState } from 'react';
import { createConversation } from './actions';

function NewConversationForm({ agentId }: { agentId: string }) {
  const [state, formAction, isPending] = useActionState(
    createConversation,
    { error: undefined, conversationId: undefined }
  );

  useEffect(() => {
    if (state.conversationId) {
      router.push(`/app/chat/${state.conversationId}`);
    }
  }, [state.conversationId]);

  return (
    <form action={formAction}>
      <input type="hidden" name="agentId" value={agentId} />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Start Conversation'}
      </button>
      {state.error && <p className="text-red-500">{state.error}</p>}
    </form>
  );
}
```

### API Route (When You Need More Control)

```typescript
// src/app/api/chat/route.ts — Streaming AI response
import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const chatSchema = z.object({
  conversationId: z.string().uuid(),
  message: z.string().min(1).max(10000),
}).strict();

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { conversationId, message } = parsed.data;

  // Verify conversation belongs to user
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId, userId },
  });
  if (!conversation) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Return streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const aiStream = await getAIResponse(conversation, message);

        for await (const chunk of aiStream) {
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(`\n\n[ERROR] ${err instanceof Error ? err.message : 'Unknown error'}`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
    },
  });
}
```

---

## 3. Streaming SSR with Suspense

### Skeleton Loading Pattern

```typescript
// app/app/chat/[conversationId]/loading.tsx
// Shown immediately while page.tsx awaits its data
export default function ChatLoading() {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Header skeleton */}
      <div className="border-b px-6 py-4 flex items-center gap-3">
        <div className="h-6 w-48 bg-muted rounded" />
        <div className="h-4 w-24 bg-muted rounded" />
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : ''}`}>
            <div className={`h-16 rounded-lg bg-muted ${
              i % 2 === 0 ? 'w-2/3' : 'w-1/2'
            }`} />
          </div>
        ))}
      </div>

      {/* Input skeleton */}
      <div className="border-t p-4">
        <div className="h-12 bg-muted rounded-lg" />
      </div>
    </div>
  );
}
```

### Granular Suspense Boundaries

```typescript
// app/app/dashboard/page.tsx
// Each section streams in independently as its data resolves
import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <div className="grid grid-cols-12 gap-6 p-6">
      {/* Usage stats — fast query, loads first */}
      <Suspense fallback={<StatsSkeleton />}>
        <UsageStats />
      </Suspense>

      {/* Recent conversations — medium query */}
      <Suspense fallback={<ConversationsSkeleton />}>
        <RecentConversations />
      </Suspense>

      {/* Agent recommendations — slow AI call */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <AgentRecommendations />
      </Suspense>
    </div>
  );
}

// Each is an async server component
async function UsageStats() {
  const { userId } = await auth();
  const stats = await prisma.usage.findUnique({ where: { userId } });
  return (
    <div className="col-span-12 grid grid-cols-4 gap-4">
      <StatCard label="Messages Today" value={stats?.messagesToday ?? 0} />
      <StatCard label="Agents Used" value={stats?.agentsUsed ?? 0} />
      <StatCard label="Conversations" value={stats?.totalConversations ?? 0} />
      <StatCard label="Plan" value={stats?.tier ?? 'FREE'} />
    </div>
  );
}

async function RecentConversations() {
  const { userId } = await auth();
  const conversations = await prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    take: 10,
    include: { agent: { select: { name: true, number: true } } },
  });

  return (
    <div className="col-span-8">
      <h2 className="text-lg font-semibold mb-4">Recent Conversations</h2>
      {conversations.map((c) => (
        <ConversationRow key={c.id} conversation={c} />
      ))}
    </div>
  );
}
```

### Streaming with Loading States Inside Client Components

```typescript
// For client components that need async data, use React Query + Suspense
'use client';

import { useSuspenseQuery } from '@tanstack/react-query';

function AgentDetailPanel({ agentId }: { agentId: string }) {
  // useSuspenseQuery integrates with the nearest Suspense boundary
  const { data: agent } = useSuspenseQuery({
    queryKey: queryKeys.agents.detail(agentId),
    queryFn: () => fetchAgent(agentId),
  });

  return (
    <div>
      <h2>{agent.name}</h2>
      <p>{agent.description}</p>
      <Badge tier={agent.minTier} />
    </div>
  );
}

// Wrap in Suspense at the parent level
function AgentSidebar({ agentId }: { agentId: string }) {
  return (
    <Suspense fallback={<AgentDetailSkeleton />}>
      <AgentDetailPanel agentId={agentId} />
    </Suspense>
  );
}
```

---

## 4. Middleware Patterns

### Stone AI Middleware Architecture

```typescript
// src/middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Route matchers
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)',
  '/pricing',
  '/help',
  '/forum',
  '/terms',
  '/privacy',
]);

const isAdminRoute = createRouteMatcher(['/admin(.*)']);
const isApiRoute = createRouteMatcher(['/api(.*)']);
const isAppRoute = createRouteMatcher(['/app(.*)']);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const { userId, sessionClaims } = await auth();

  // --- Public routes: no auth required ---
  if (isPublicRoute(request)) {
    // Redirect signed-in users away from auth pages
    if (userId && request.nextUrl.pathname.startsWith('/sign-in')) {
      return NextResponse.redirect(new URL('/app', request.url));
    }
    return NextResponse.next();
  }

  // --- All non-public routes require auth ---
  if (!userId) {
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect_url', request.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  // --- Admin routes: role check ---
  if (isAdminRoute(request)) {
    const role = sessionClaims?.metadata?.role;
    if (role !== 'admin' && role !== 'founder') {
      return NextResponse.redirect(new URL('/app', request.url));
    }
  }

  // --- Feature flags via headers ---
  const response = NextResponse.next();

  // Pass user tier to server components via headers
  const tier = sessionClaims?.metadata?.tier ?? 'FREE';
  response.headers.set('x-user-tier', tier);

  // Geo-based feature flag (Vercel provides geo headers)
  const country = request.geo?.country ?? 'US';
  response.headers.set('x-user-country', country);

  return response;
});

export const config = {
  matcher: [
    // Match all routes except static files and _next internals
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
```

### Rate Limiting in Middleware

```typescript
// Rate limiting pattern (with Redis via Upstash)
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(60, '1 m'), // 60 requests per minute
  analytics: true,
});

// Inside clerkMiddleware callback:
if (isApiRoute(request) && userId) {
  const { success, limit, remaining, reset } = await ratelimit.limit(userId);

  if (!success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }
}
```

---

## 5. Route Groups & Layout Composition

### Stone AI Route Structure

```
app/
├── (public)/                  # Public marketing pages — no auth layout
│   ├── layout.tsx             # Minimal layout: header + footer, no sidebar
│   ├── page.tsx               # Landing page (/)
│   ├── pricing/page.tsx       # /pricing
│   ├── help/page.tsx          # /help
│   └── forum/page.tsx         # /forum
│
├── (auth)/                    # Auth pages — centered card layout
│   ├── layout.tsx             # Centered container, branded background
│   ├── sign-in/[[...sign-in]]/page.tsx
│   └── sign-up/[[...sign-up]]/page.tsx
│
├── app/                       # Authenticated app — full app layout
│   ├── layout.tsx             # Sidebar + top bar + main content area
│   ├── page.tsx               # /app (dashboard)
│   ├── chat/
│   │   ├── page.tsx           # /app/chat (conversation list)
│   │   └── [conversationId]/
│   │       ├── page.tsx       # /app/chat/:id
│   │       ├── loading.tsx    # Streaming skeleton
│   │       └── error.tsx      # Error boundary
│   ├── agents/page.tsx        # /app/agents
│   ├── bestie/page.tsx        # /app/bestie
│   ├── settings/
│   │   ├── page.tsx           # /app/settings
│   │   └── billing/page.tsx   # /app/settings/billing
│   └── referrals/page.tsx     # /app/referrals
│
├── admin/                     # Admin panel — admin layout
│   ├── layout.tsx             # Admin nav, role-gated
│   ├── page.tsx               # /admin (dashboard)
│   ├── users/page.tsx         # /admin/users
│   └── agents/page.tsx        # /admin/agents
│
├── api/                       # API routes
│   ├── chat/route.ts
│   ├── agents/route.ts
│   ├── webhooks/
│   │   ├── stripe/route.ts
│   │   └── clerk/route.ts
│   └── [...]/route.ts
│
├── layout.tsx                 # Root layout: html, body, providers
├── not-found.tsx              # Global 404
└── global-error.tsx           # Global error boundary
```

### Layout Composition Pattern

```typescript
// app/layout.tsx — Root layout (wraps everything)
import { ClerkProvider } from '@clerk/nextjs';
import { QueryProvider } from '@/components/providers/query-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/sonner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-background font-sans antialiased">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              {children}
              <Toaster />
            </QueryProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

// app/app/layout.tsx — Authenticated app layout
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { TopBar } from '@/components/layout/top-bar';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

// app/(public)/layout.tsx — Public marketing layout
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <MarketingHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
```

---

## 6. Parallel Routes & Intercepting Routes

### Parallel Routes: Chat + Agent Panel Side by Side

```
app/app/chat/
├── layout.tsx
├── page.tsx
├── @conversation/
│   ├── default.tsx          # Shown when no conversation selected
│   └── [conversationId]/
│       └── page.tsx         # Main chat view
└── @agentpanel/
    ├── default.tsx          # Collapsed panel
    └── [conversationId]/
        └── page.tsx         # Agent info panel for current conversation
```

```typescript
// app/app/chat/layout.tsx
export default function ChatLayout({
  children,
  conversation,
  agentpanel,
}: {
  children: React.ReactNode;
  conversation: React.ReactNode;
  agentpanel: React.ReactNode;
}) {
  return (
    <div className="flex h-full">
      {/* Sidebar: conversation list */}
      <div className="w-72 border-r overflow-y-auto">
        {children}
      </div>

      {/* Main: active conversation */}
      <div className="flex-1">
        {conversation}
      </div>

      {/* Right panel: agent details */}
      <div className="w-80 border-l">
        {agentpanel}
      </div>
    </div>
  );
}
```

### Intercepting Routes: Modal Preview

```
app/app/agents/
├── page.tsx                         # Grid of all agents
├── [agentId]/
│   └── page.tsx                     # Full agent detail page
└── (.)agents/[agentId]/
    └── page.tsx                     # Modal overlay (intercepted)
```

```typescript
// app/app/agents/(.)agents/[agentId]/page.tsx
// This catches soft navigation from the agent grid and shows a modal
// Hard refresh or direct URL navigates to the full page version

import { Modal } from '@/components/ui/modal';

export default async function AgentModal({
  params,
}: {
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });

  if (!agent) return null;

  return (
    <Modal>
      <AgentDetailCard agent={agent} />
      <Link href={`/app/agents/${agentId}`} className="text-sm text-muted-foreground">
        Open full page
      </Link>
    </Modal>
  );
}
```

---

## 7. ISR Strategies

### Time-Based Revalidation

```typescript
// app/(public)/pricing/page.tsx
// Pricing rarely changes — revalidate every hour
export const revalidate = 3600; // seconds

export default async function PricingPage() {
  const plans = await prisma.plan.findMany({ orderBy: { price: 'asc' } });
  return <PricingGrid plans={plans} />;
}
```

### On-Demand Revalidation (Webhook-Triggered)

```typescript
// app/api/webhooks/stripe/route.ts
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  const event = await verifyStripeWebhook(request);

  switch (event.type) {
    case 'customer.subscription.updated':
      const userId = event.data.object.metadata.userId;

      // Revalidate this user's subscription data everywhere it appears
      revalidateTag(`user-subscription-${userId}`);

      // Revalidate the settings page for this user
      revalidatePath(`/app/settings/billing`);
      break;

    case 'product.updated':
      // Pricing changed — revalidate public pricing page
      revalidatePath('/pricing');
      revalidateTag('plans');
      break;
  }

  return NextResponse.json({ received: true });
}
```

### Tag-Based Revalidation

```typescript
// Using fetch with tags (in server components or route handlers)
async function getPlans() {
  const res = await fetch(`${process.env.API_URL}/plans`, {
    next: { tags: ['plans'] },
  });
  return res.json();
}

// Using unstable_cache with tags (for Prisma/direct DB calls)
import { unstable_cache } from 'next/cache';

const getCachedAgent = unstable_cache(
  async (agentId: string) => {
    return prisma.agent.findUnique({
      where: { id: agentId },
      include: { capabilities: true },
    });
  },
  ['agent-detail'],
  {
    tags: ['agents'],
    revalidate: 3600,
  }
);

// Invalidate when admin updates an agent
export async function updateAgent(agentId: string, data: AgentUpdate) {
  await prisma.agent.update({ where: { id: agentId }, data });
  revalidateTag('agents');
}
```

---

## 8. Edge Runtime vs Node Runtime

### Decision Tree

```
Does your route handler or middleware need...
│
├── Prisma / Node-only ORM?
│   └── NODE RUNTIME (Prisma doesn't run on Edge)
│
├── Node.js built-ins (fs, crypto, child_process)?
│   └── NODE RUNTIME
│
├── npm packages that use Node APIs?
│   └── NODE RUNTIME (check edge compatibility)
│
├── Only Web APIs (fetch, Response, TextEncoder, crypto.subtle)?
│   └── EDGE RUNTIME (faster cold starts, lower latency)
│
├── Simple auth checks, redirects, header manipulation?
│   └── EDGE RUNTIME (middleware runs on Edge by default)
│
├── Geolocation-based routing?
│   └── EDGE RUNTIME (request.geo available)
│
└── Large computation, heavy processing?
    └── NODE RUNTIME (Edge has CPU/memory limits)
```

### Explicit Runtime Selection

```typescript
// Edge runtime (fast cold starts, global distribution)
// app/api/health/route.ts
export const runtime = 'edge';

export function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    region: process.env.VERCEL_REGION,
  });
}

// Node runtime (default — full Node.js APIs)
// app/api/chat/route.ts
export const runtime = 'nodejs';
export const maxDuration = 60; // AI responses can take time

export async function POST(request: NextRequest) {
  // Can use Prisma, Node crypto, etc.
  const conversation = await prisma.conversation.findUnique(/* ... */);
  // ...
}
```

### Middleware is Always Edge

```typescript
// Middleware runs at the Edge by default — no Prisma here!
// For database checks in middleware, use a lightweight HTTP call
// or cache claims in the JWT via Clerk's session claims

// WRONG: This will fail
import { prisma } from '@/lib/prisma';
// prisma.user.findUnique(...) // ERROR: Prisma not available on Edge

// RIGHT: Use Clerk session claims for role checks
const role = sessionClaims?.metadata?.role;
```

---

## 9. Image Optimization

```typescript
// next/image: automatic optimization, WebP/AVIF, responsive
import Image from 'next/image';

// Static import: automatically gets dimensions, enables blur placeholder
import heroImage from '@/public/images/hero.png';

function HeroSection() {
  return (
    <Image
      src={heroImage}
      alt="Stone AI — Your AI workspace"
      priority // Above the fold — preload
      placeholder="blur" // Works with static imports
      className="rounded-2xl"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
    />
  );
}

// Dynamic images: explicit width/height or fill
function AgentAvatar({ agent }: { agent: Agent }) {
  return (
    <div className="relative w-12 h-12">
      <Image
        src={agent.avatarUrl || '/images/default-avatar.png'}
        alt={`${agent.name} avatar`}
        fill
        sizes="48px"
        className="rounded-full object-cover"
        // No priority — below the fold
      />
    </div>
  );
}

// Blur placeholder for dynamic images (generate at build or upload time)
function BackdropImage({ backdrop }: { backdrop: Backdrop }) {
  return (
    <Image
      src={backdrop.url}
      alt={backdrop.name}
      width={1920}
      height={1080}
      placeholder="blur"
      blurDataURL={backdrop.blurDataUrl} // Tiny base64 stored in DB
      className="w-full h-full object-cover"
      sizes="100vw"
      quality={85}
    />
  );
}

// next.config.ts image configuration
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};
```

---

## 10. Metadata & SEO

```typescript
// app/layout.tsx — Default metadata for the entire site
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://stone-ai.net'),
  title: {
    default: 'Stone AI — Your AI Workspace',
    template: '%s | Stone AI',
  },
  description: 'Access 44 specialized AI agents for every task. From coding to strategy, Stone AI has you covered.',
  keywords: ['AI', 'AI agents', 'AI workspace', 'chatbot', 'AI assistant'],
  authors: [{ name: 'Stone AI' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://stone-ai.net',
    siteName: 'Stone AI',
    title: 'Stone AI — Your AI Workspace',
    description: 'Access 44 specialized AI agents for every task.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Stone AI',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stone AI — Your AI Workspace',
    description: 'Access 44 specialized AI agents for every task.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// app/app/agents/[agentId]/page.tsx — Dynamic metadata
export async function generateMetadata({
  params,
}: {
  params: Promise<{ agentId: string }>;
}): Promise<Metadata> {
  const { agentId } = await params;
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });

  if (!agent) {
    return { title: 'Agent Not Found' };
  }

  return {
    title: `${agent.name} — Agent #${agent.number}`,
    description: agent.description,
    openGraph: {
      title: `${agent.name} — Stone AI Agent #${agent.number}`,
      description: agent.description,
      images: [
        {
          url: `/api/og/agent?id=${agentId}`,
          width: 1200,
          height: 630,
        },
      ],
    },
  };
}

// Structured data (JSON-LD)
export default async function AgentPage({ params }: Props) {
  const agent = await getAgent(params.agentId);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `Stone AI — ${agent.name}`,
    description: agent.description,
    applicationCategory: 'BusinessApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AgentDetail agent={agent} />
    </>
  );
}
```

---

## 11. Error Boundaries

### Hierarchy

```
global-error.tsx       # Catches root layout errors (replaces entire page)
├── app/
│   ├── error.tsx      # Catches errors in app/* routes
│   ├── not-found.tsx  # 404 for app/* routes
│   └── chat/
│       ├── error.tsx  # Catches errors only in chat routes
│       └── [id]/
│           └── error.tsx  # Most specific: only this conversation
```

```typescript
// app/app/chat/[conversationId]/error.tsx
'use client'; // Error boundaries MUST be client components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error('Chat error:', error);
    // In production: Sentry, LogRocket, etc.
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground max-w-md">
          {error.message === 'NEXT_NOT_FOUND'
            ? "This conversation doesn't exist or you don't have access."
            : 'There was an error loading this conversation. Please try again.'}
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
      </div>
      <div className="flex gap-3">
        <Button onClick={reset} variant="default">
          Try Again
        </Button>
        <Button
          onClick={() => window.location.href = '/app/chat'}
          variant="outline"
        >
          Back to Conversations
        </Button>
      </div>
    </div>
  );
}

// app/not-found.tsx — Global 404
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6">
      <div className="text-center space-y-3">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Link href="/" className="btn-primary">
        Go Home
      </Link>
    </div>
  );
}

// app/global-error.tsx — Catches root layout failures
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <button onClick={reset} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
```

---

## 12. Route Handlers with Typing & Streaming

### Typed Route Handlers

```typescript
// src/app/api/agents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

// GET /api/agents?tier=STARTER&search=code
const getAgentsSchema = z.object({
  tier: z.enum(['FREE', 'STARTER', 'PLUS', 'SMART', 'PRO']).optional(),
  search: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = getAgentsSchema.safeParse(searchParams);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid parameters', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const agents = await prisma.agent.findMany({
    where: {
      ...(parsed.data.tier && { minTier: parsed.data.tier }),
      ...(parsed.data.search && {
        name: { contains: parsed.data.search, mode: 'insensitive' },
      }),
    },
    orderBy: { number: 'asc' },
  });

  return NextResponse.json(agents);
}

// Dynamic route segment
// src/app/api/agents/[agentId]/route.ts
interface RouteContext {
  params: Promise<{ agentId: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { agentId } = await context.params;
  const agent = await prisma.agent.findUnique({ where: { id: agentId } });

  if (!agent) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(agent);
}
```

### Streaming Route Handler (SSE Pattern)

```typescript
// src/app/api/chat/stream/route.ts
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  // Create SSE stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        send('status', { status: 'thinking' });

        const aiStream = await callAIProvider(body);

        for await (const token of aiStream) {
          // Filter think tokens (Stone AI specific)
          if (token.type === 'think') continue;

          send('token', { content: token.content });
        }

        send('done', { messageId: aiStream.messageId });
      } catch (err) {
        send('error', {
          message: err instanceof Error ? err.message : 'Stream failed',
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
```

---

## 13. Auth Middleware with Clerk

### Session Claims for Authorization

```typescript
// Clerk dashboard: Configure custom session claims
// Session claims template (in Clerk Dashboard > Sessions):
{
  "metadata": {
    "role": "{{user.public_metadata.role}}",
    "tier": "{{user.public_metadata.tier}}",
    "onboarded": "{{user.public_metadata.onboarded}}"
  }
}

// Use in middleware (Edge-compatible — no DB call needed)
export default clerkMiddleware(async (auth, request) => {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    // Handle unauthenticated
    return;
  }

  // Tier-gated routes
  const tier = sessionClaims?.metadata?.tier as string ?? 'FREE';
  const tierLevel = { FREE: 0, STARTER: 1, PLUS: 2, SMART: 3, PRO: 4 };

  // Smart agents require SMART tier or above
  if (request.nextUrl.pathname.startsWith('/app/agents/smart')) {
    if ((tierLevel[tier] ?? 0) < tierLevel.SMART) {
      return NextResponse.redirect(new URL('/pricing', request.url));
    }
  }

  // Onboarding redirect
  const onboarded = sessionClaims?.metadata?.onboarded;
  if (
    !onboarded &&
    request.nextUrl.pathname.startsWith('/app') &&
    !request.nextUrl.pathname.startsWith('/app/onboarding')
  ) {
    return NextResponse.redirect(new URL('/app/onboarding', request.url));
  }
});

// Server-side auth in server components
import { auth, currentUser } from '@clerk/nextjs/server';

export default async function SettingsPage() {
  const { userId, sessionClaims } = await auth();
  const user = await currentUser();

  const tier = sessionClaims?.metadata?.tier ?? 'FREE';
  const isAdmin = sessionClaims?.metadata?.role === 'admin';

  return (
    <div>
      <h1>Settings</h1>
      <p>Plan: {tier}</p>
      {isAdmin && <AdminPanel />}
    </div>
  );
}

// Protect server actions
'use server';

export async function deleteAccount() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  // Double-check ownership in server action
  await prisma.user.delete({ where: { clerkId: userId } });
  revalidatePath('/');
}
```

### Webhook Handler (Clerk User Events)

```typescript
// src/app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix';
import { headers } from 'next/headers';

export async function POST(request: NextRequest) {
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  const payload = await request.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);

  let event: WebhookEvent;
  try {
    event = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'user.created':
      await prisma.user.create({
        data: {
          clerkId: event.data.id,
          email: event.data.email_addresses[0]?.email_address,
          tier: 'FREE',
        },
      });
      break;

    case 'user.deleted':
      if (event.data.id) {
        await prisma.user.delete({ where: { clerkId: event.data.id } });
      }
      break;
  }

  return NextResponse.json({ received: true });
}
```

---

## Quick Reference: File Conventions

| File | Purpose | Runtime |
|------|---------|---------|
| `page.tsx` | Route UI | Server (default) |
| `layout.tsx` | Shared wrapper | Server (default) |
| `loading.tsx` | Suspense fallback | Server |
| `error.tsx` | Error boundary | Client (required) |
| `not-found.tsx` | 404 page | Server |
| `global-error.tsx` | Root error boundary | Client (required) |
| `route.ts` | API endpoint | Node (default) or Edge |
| `middleware.ts` | Request interceptor | Edge (always) |
| `default.tsx` | Parallel route fallback | Server |
| `template.tsx` | Re-mounted layout | Server |
| `opengraph-image.tsx` | OG image generation | Node or Edge |

---

*Seed maintained by Senior Frontend Engineer. Last updated: 2026-03-09.*
