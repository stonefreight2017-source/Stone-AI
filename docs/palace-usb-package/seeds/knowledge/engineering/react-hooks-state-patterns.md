# React Hooks & State Management Patterns

> Palace Engineering Seed — Senior Frontend Engineer
> Stack: React 19, Next.js 16, TypeScript, Zustand, React Query (TanStack Query v5)
> Context: Stone AI SaaS — 44 agents, chat streaming, Bestie system, real-time UI

---

## Table of Contents

1. [Custom Hook Composition](#1-custom-hook-composition)
2. [Stale Closure Problems & Solutions](#2-stale-closure-problems--solutions)
3. [useCallback / useMemo Decision Tree](#3-usecallback--usememo-decision-tree)
4. [React Query Patterns](#4-react-query-patterns)
5. [Zustand Store Design](#5-zustand-store-design)
6. [useOptimistic for Chat](#6-useoptimistic-for-chat)
7. [useTransition for Non-Blocking UI](#7-usetransition-for-non-blocking-ui)
8. [Ref Forwarding & useImperativeHandle](#8-ref-forwarding--useimperativehandle)
9. [Form State with react-hook-form + Zod](#9-form-state-with-react-hook-form--zod)
10. [Race Condition Prevention](#10-race-condition-prevention)
11. [Context vs Zustand vs React Query Decision Tree](#11-context-vs-zustand-vs-react-query-decision-tree)

---

## 1. Custom Hook Composition

### Principle: Single Responsibility, Composable Layers

Every custom hook should do ONE thing and do it well. Complex behavior comes from composing simple hooks, not from building monoliths.

### Building a useChat Hook (Stone AI Pattern)

```typescript
// Layer 1: Low-level stream consumption
function useStreamReader() {
  const [chunks, setChunks] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const startStream = useCallback(async (url: string, body: unknown) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsStreaming(true);
    setChunks([]);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const text = decoder.decode(value, { stream: true });
        setChunks(prev => [...prev, text]);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        // User cancelled — not an error
        return;
      }
      throw err;
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const fullText = useMemo(() => chunks.join(''), [chunks]);

  return { chunks, fullText, isStreaming, startStream, cancel };
}

// Layer 2: Message management
function useMessages(conversationId: string) {
  const queryClient = useQueryClient();

  const messagesQuery = useInfiniteQuery({
    queryKey: queryKeys.messages.list(conversationId),
    queryFn: ({ pageParam }) =>
      fetchMessages(conversationId, { cursor: pageParam, limit: 50 }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
  });

  const addOptimisticMessage = useCallback(
    (message: Message) => {
      queryClient.setQueryData(
        queryKeys.messages.list(conversationId),
        (old: InfiniteData<MessagesPage> | undefined) => {
          if (!old) return old;
          const newPages = [...old.pages];
          newPages[0] = {
            ...newPages[0],
            messages: [message, ...newPages[0].messages],
          };
          return { ...old, pages: newPages };
        }
      );
    },
    [queryClient, conversationId]
  );

  return { messagesQuery, addOptimisticMessage };
}

// Layer 3: Composed useChat hook
function useChat(conversationId: string) {
  const { fullText, isStreaming, startStream, cancel } = useStreamReader();
  const { messagesQuery, addOptimisticMessage } = useMessages(conversationId);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      setError(null);

      // Optimistic: show user message immediately
      const tempId = `temp-${Date.now()}`;
      addOptimisticMessage({
        id: tempId,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      });

      try {
        await startStream('/api/chat', {
          conversationId,
          message: content,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send');
      }
    },
    [conversationId, addOptimisticMessage, startStream]
  );

  return {
    messages: messagesQuery,
    streamingText: fullText,
    isStreaming,
    error,
    sendMessage,
    cancelStream: cancel,
  };
}
```

### Building a useBestie Hook

```typescript
// Bestie has personality, communication style, and conversation memory
function useBestie(userId: string) {
  const bestieQuery = useQuery({
    queryKey: queryKeys.bestie.detail(userId),
    queryFn: () => fetchBestie(userId),
    staleTime: 5 * 60 * 1000, // Bestie config rarely changes
  });

  const updateBestie = useMutation({
    mutationFn: (updates: Partial<BestieConfig>) =>
      patchBestie(userId, updates),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.bestie.detail(userId), data);
    },
  });

  // Derive computed state from bestie data
  const personalityLabel = useMemo(() => {
    if (!bestieQuery.data) return null;
    const { traits } = bestieQuery.data;
    return computePersonalityLabel(traits);
  }, [bestieQuery.data]);

  return {
    bestie: bestieQuery.data,
    isLoading: bestieQuery.isLoading,
    personalityLabel,
    updateBestie: updateBestie.mutate,
    isUpdating: updateBestie.isPending,
  };
}
```

### Building a useConversations Hook

```typescript
function useConversations(agentId?: string) {
  const queryClient = useQueryClient();

  const conversationsQuery = useQuery({
    queryKey: queryKeys.conversations.list(agentId),
    queryFn: () => fetchConversations({ agentId }),
    staleTime: 30 * 1000,
  });

  const createConversation = useMutation({
    mutationFn: (params: { agentId: string; title?: string }) =>
      postConversation(params),
    onSuccess: (newConvo) => {
      // Prepend new conversation to list
      queryClient.setQueryData(
        queryKeys.conversations.list(agentId),
        (old: Conversation[] | undefined) =>
          old ? [newConvo, ...old] : [newConvo]
      );
    },
  });

  const deleteConversation = useMutation({
    mutationFn: (id: string) => removeConversation(id),
    onMutate: async (id) => {
      // Optimistic removal
      await queryClient.cancelQueries({
        queryKey: queryKeys.conversations.list(agentId),
      });
      const previous = queryClient.getQueryData<Conversation[]>(
        queryKeys.conversations.list(agentId)
      );
      queryClient.setQueryData(
        queryKeys.conversations.list(agentId),
        (old: Conversation[] | undefined) =>
          old?.filter((c) => c.id !== id)
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      // Rollback on failure
      queryClient.setQueryData(
        queryKeys.conversations.list(agentId),
        context?.previous
      );
    },
  });

  return {
    conversations: conversationsQuery.data ?? [],
    isLoading: conversationsQuery.isLoading,
    createConversation: createConversation.mutateAsync,
    deleteConversation: deleteConversation.mutate,
  };
}
```

### Hook Composition Rules

1. **Never call hooks conditionally** — extract conditional logic into the hook itself
2. **Return stable references** — wrap callbacks in `useCallback`, derived data in `useMemo`
3. **Keep hooks pure** — side effects only in `useEffect` or event handlers
4. **Name hooks `use*`** — React relies on this convention for rule enforcement
5. **Accept primitives as args** — objects as args cause unnecessary re-renders

---

## 2. Stale Closure Problems & Solutions

### The Core Problem

Closures capture variable values at the time the closure is created. When state updates, old closures still reference old values.

### WRONG: Stale State in setInterval

```typescript
// BUG: count is always 0 inside the interval
function ChatTimer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      // 'count' is captured as 0 from the first render
      console.log('Current count:', count); // Always 0!
      setCount(count + 1); // Always sets to 1!
    }, 1000);

    return () => clearInterval(interval);
  }, []); // Empty deps = closure captures initial values only

  return <span>{count}</span>;
}
```

### RIGHT: Functional Updates

```typescript
function ChatTimer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      // Functional update: React gives us the CURRENT value
      setCount(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return <span>{count}</span>;
}
```

### WRONG: Stale Closure in Event Handler During Streaming

```typescript
function ChatInput({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSend = async (content: string) => {
    // BUG: If user sends two messages quickly, the second
    // handler captures 'messages' BEFORE the first message was added
    const response = await sendMessage(conversationId, content);
    setMessages([...messages, response]); // 'messages' is stale!
  };

  return <MessageInput onSend={handleSend} />;
}
```

### RIGHT: Ref + Functional Update

```typescript
function ChatInput({ conversationId }: { conversationId: string }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef(messages);
  messagesRef.current = messages; // Always up to date

  const handleSend = useCallback(async (content: string) => {
    const response = await sendMessage(conversationId, content);
    // Option A: functional update (preferred for simple cases)
    setMessages(prev => [...prev, response]);

    // Option B: ref (when you need to READ current state, not just update)
    // const current = messagesRef.current;
    // doSomethingWith(current);
  }, [conversationId]);

  return <MessageInput onSend={handleSend} />;
}
```

### WRONG: Stale Closure in Async Callback

```typescript
function AgentSelector() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const handleAgentSwitch = async (agentId: string) => {
    setSelectedAgent(null); // Clear current
    const agent = await fetchAgent(agentId);
    // BUG: If user clicks 3 agents fast, all 3 fetches complete
    // and the LAST one to resolve wins — not the last one CLICKED
    setSelectedAgent(agent);
  };

  return <AgentList onSelect={handleAgentSwitch} />;
}
```

### RIGHT: AbortController + Latest Request Tracking

```typescript
function AgentSelector() {
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const latestRequestRef = useRef(0);

  const handleAgentSwitch = useCallback(async (agentId: string) => {
    const requestId = ++latestRequestRef.current;
    setSelectedAgent(null);

    const agent = await fetchAgent(agentId);

    // Only update if this is still the latest request
    if (requestId === latestRequestRef.current) {
      setSelectedAgent(agent);
    }
  }, []);

  return <AgentList onSelect={handleAgentSwitch} />;
}
```

### The useLatest Pattern (Escape Hatch)

```typescript
// Generic hook for always-fresh values in callbacks
function useLatest<T>(value: T): React.MutableRefObject<T> {
  const ref = useRef(value);
  // Update ref synchronously on every render
  ref.current = value;
  return ref;
}

// Usage: stream handler that needs access to current conversation state
function useStreamHandler(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const latestMessages = useLatest(messages);

  const onStreamChunk = useCallback((chunk: string) => {
    // latestMessages.current is always fresh
    const lastMessage = latestMessages.current.at(-1);
    if (lastMessage?.role === 'assistant') {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: updated[updated.length - 1].content + chunk,
        };
        return updated;
      });
    }
  }, [latestMessages]);

  return { messages, onStreamChunk };
}
```

---

## 3. useCallback / useMemo Decision Tree

### When to Use useCallback

```
Is the function passed as a prop to a child component?
├── YES → Is the child wrapped in React.memo?
│   ├── YES → USE useCallback (prevents child re-render)
│   └── NO → SKIP (memo the child first, then add useCallback)
├── Is the function a dependency of useEffect/useMemo/useCallback?
│   ├── YES → USE useCallback (prevents infinite re-runs)
│   └── NO → SKIP
└── Is the function expensive to create? (almost never)
    ├── YES → USE useCallback
    └── NO → SKIP (default: don't use it)
```

### When to Use useMemo

```
Is the computation expensive? (>1ms for typical data)
├── YES → USE useMemo
├── NO → Is the result an object/array passed as a prop?
│   ├── YES → Is the child using React.memo or shallow comparison?
│   │   ├── YES → USE useMemo (preserves referential equality)
│   │   └── NO → SKIP
│   └── NO → Is the result a dependency of useEffect?
│       ├── YES → USE useMemo (prevents effect re-runs)
│       └── NO → SKIP (default: don't use it)
```

### WRONG: Premature Memoization

```typescript
// WRONG: Simple string concatenation doesn't need memoization
function AgentCard({ agent }: { agent: Agent }) {
  const displayName = useMemo(
    () => `${agent.name} (#${agent.number})`,
    [agent.name, agent.number]
  );

  // WRONG: inline handler with no memo child doesn't need useCallback
  const handleClick = useCallback(() => {
    console.log('clicked', agent.id);
  }, [agent.id]);

  return <div onClick={handleClick}>{displayName}</div>;
}
```

### RIGHT: Appropriate Memoization

```typescript
// RIGHT: No memoization needed for cheap operations with no memo children
function AgentCard({ agent }: { agent: Agent }) {
  const displayName = `${agent.name} (#${agent.number})`;

  return (
    <div onClick={() => console.log('clicked', agent.id)}>
      {displayName}
    </div>
  );
}

// RIGHT: useMemo for expensive computation
function AgentList({ agents, searchQuery }: Props) {
  // Filtering/sorting 44 agents is borderline, but with complex
  // matching logic it's worth memoizing
  const filteredAgents = useMemo(() => {
    return agents
      .filter(a => fuzzyMatch(a.name, searchQuery))
      .sort((a, b) => relevanceScore(b, searchQuery) - relevanceScore(a, searchQuery));
  }, [agents, searchQuery]);

  return (
    <div>
      {filteredAgents.map(agent => (
        <MemoizedAgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}

// RIGHT: useCallback because child is memoized
const MemoizedAgentCard = memo(function AgentCard({
  agent,
  onSelect,
}: {
  agent: Agent;
  onSelect: (id: string) => void;
}) {
  return (
    <div onClick={() => onSelect(agent.id)}>
      {agent.name}
    </div>
  );
});

function AgentSelector() {
  const [selected, setSelected] = useState<string | null>(null);

  // YES useCallback: passed to a memo'd child
  const handleSelect = useCallback((id: string) => {
    setSelected(id);
  }, []);

  return <MemoizedAgentCard agent={agent} onSelect={handleSelect} />;
}
```

### The React Compiler (React 19+) Changes Everything

React 19's compiler auto-memoizes. In projects using it:
- You almost never need manual `useMemo` / `useCallback`
- The compiler handles referential equality for props and dependencies
- Still useful for truly expensive computations you want to make explicit
- Stone AI: evaluate adoption when Next.js 16 stabilizes compiler support

---

## 4. React Query Patterns

### QueryKey Factory (Stone AI Pattern)

```typescript
// src/lib/query-keys.ts
// Hierarchical keys enable granular cache invalidation
export const queryKeys = {
  conversations: {
    all: ['conversations'] as const,
    list: (agentId?: string) =>
      agentId
        ? ['conversations', 'list', agentId] as const
        : ['conversations', 'list'] as const,
    detail: (id: string) => ['conversations', 'detail', id] as const,
  },
  messages: {
    all: ['messages'] as const,
    list: (conversationId: string) =>
      ['messages', 'list', conversationId] as const,
    infinite: (conversationId: string) =>
      ['messages', 'infinite', conversationId] as const,
  },
  agents: {
    all: ['agents'] as const,
    list: (tier?: string) =>
      tier ? ['agents', 'list', tier] : (['agents', 'list'] as const),
    detail: (id: string) => ['agents', 'detail', id] as const,
    stats: (id: string) => ['agents', 'stats', id] as const,
  },
  bestie: {
    all: ['bestie'] as const,
    detail: (userId: string) => ['bestie', 'detail', userId] as const,
    traits: (userId: string) => ['bestie', 'traits', userId] as const,
  },
  user: {
    all: ['user'] as const,
    profile: (id: string) => ['user', 'profile', id] as const,
    subscription: (id: string) => ['user', 'subscription', id] as const,
    usage: (id: string) => ['user', 'usage', id] as const,
  },
} as const;

// Usage: invalidate ALL conversation caches
// queryClient.invalidateQueries({ queryKey: queryKeys.conversations.all });

// Usage: invalidate only the list for a specific agent
// queryClient.invalidateQueries({ queryKey: queryKeys.conversations.list('agent-42') });
```

### Optimistic Updates for Chat

```typescript
function useSendMessage(conversationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) =>
      postMessage(conversationId, { content }),

    onMutate: async (content) => {
      // Cancel in-flight fetches to prevent overwriting our optimistic update
      await queryClient.cancelQueries({
        queryKey: queryKeys.messages.list(conversationId),
      });

      // Snapshot current data for rollback
      const previous = queryClient.getQueryData<Message[]>(
        queryKeys.messages.list(conversationId)
      );

      // Optimistically add the user's message
      const optimisticMessage: Message = {
        id: `optimistic-${Date.now()}`,
        conversationId,
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
        status: 'sending',
      };

      queryClient.setQueryData<Message[]>(
        queryKeys.messages.list(conversationId),
        (old) => [...(old ?? []), optimisticMessage]
      );

      return { previous, optimisticMessage };
    },

    onError: (_err, _content, context) => {
      // Rollback to snapshot
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.messages.list(conversationId),
          context.previous
        );
      }
    },

    onSettled: () => {
      // Always refetch to ensure server state is in sync
      queryClient.invalidateQueries({
        queryKey: queryKeys.messages.list(conversationId),
      });
    },
  });
}
```

### Infinite Query for Message History

```typescript
function useMessageHistory(conversationId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.messages.infinite(conversationId),

    queryFn: async ({ pageParam }) => {
      const res = await fetch(
        `/api/conversations/${conversationId}/messages?` +
          new URLSearchParams({
            cursor: pageParam ?? '',
            limit: '50',
            direction: 'older',
          })
      );
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json() as Promise<{
        messages: Message[];
        nextCursor: string | null;
      }>;
    },

    initialPageParam: undefined as string | undefined,

    getNextPageParam: (lastPage) => lastPage.nextCursor,

    // Messages are fetched newest-first but displayed oldest-first
    select: (data) => ({
      ...data,
      pages: [...data.pages].reverse(),
    }),

    // Keep previous data visible while fetching more
    placeholderData: keepPreviousData,

    staleTime: 30 * 1000,
  });
}

// In the component:
function MessageList({ conversationId }: { conversationId: string }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useMessageHistory(conversationId);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Load more when user scrolls to top
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop < 100 && hasNextPage && !isFetchingNextPage) {
      const prevHeight = el.scrollHeight;
      fetchNextPage().then(() => {
        // Preserve scroll position after prepending older messages
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight - prevHeight;
        });
      });
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const allMessages = data?.pages.flatMap((p) => p.messages) ?? [];

  return (
    <div ref={scrollRef} onScroll={handleScroll} className="overflow-y-auto">
      {isFetchingNextPage && <LoadingSpinner />}
      {allMessages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
    </div>
  );
}
```

### Prefetching

```typescript
// Prefetch conversation messages on hover
function ConversationItem({ convo }: { convo: Conversation }) {
  const queryClient = useQueryClient();

  const handleHover = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.messages.list(convo.id),
      queryFn: () => fetchMessages(convo.id, { limit: 50 }),
      staleTime: 60 * 1000, // Don't refetch if less than 1 min old
    });
  };

  return (
    <Link
      href={`/app/chat/${convo.id}`}
      onMouseEnter={handleHover}
      className="block p-3 hover:bg-muted rounded-lg"
    >
      {convo.title}
    </Link>
  );
}

// Prefetch agent data on route navigation
// In app/app/agents/page.tsx (server component)
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';

export default async function AgentsPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: queryKeys.agents.list(),
    queryFn: () => getAgents(), // Server-side fetch
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AgentGrid />
    </HydrationBoundary>
  );
}
```

### Cache Invalidation Strategies

```typescript
// Pattern 1: Cascading invalidation after conversation deletion
async function deleteConversation(id: string) {
  await fetch(`/api/conversations/${id}`, { method: 'DELETE' });

  // Invalidate the conversations list
  queryClient.invalidateQueries({
    queryKey: queryKeys.conversations.all,
  });

  // Remove messages cache for this conversation (don't refetch — it's gone)
  queryClient.removeQueries({
    queryKey: queryKeys.messages.list(id),
  });

  // Invalidate user usage stats (conversation count changed)
  queryClient.invalidateQueries({
    queryKey: queryKeys.user.usage(userId),
  });
}

// Pattern 2: Selective invalidation by predicate
queryClient.invalidateQueries({
  predicate: (query) => {
    const key = query.queryKey;
    // Invalidate all agent-related queries for a specific agent
    return (
      key[0] === 'agents' &&
      (key[2] === agentId || key.includes(agentId))
    );
  },
});

// Pattern 3: Stale time configuration for different data types
const queryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,        // 30s default
      gcTime: 5 * 60 * 1000,       // 5 min garbage collection
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
};

// Override per query:
// User profile: rarely changes → 5 min stale
// Messages: changes often → 10 sec stale
// Agent list: static → 30 min stale
// Subscription: changes on payment → 1 min stale
```

---

## 5. Zustand Store Design

### Slice Pattern (Stone AI)

```typescript
// src/stores/app-store.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// --- Types ---
interface UISlice {
  sidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  activePanel: 'chat' | 'agents' | 'settings' | null;
  toggleSidebar: () => void;
  setTheme: (theme: UISlice['theme']) => void;
  setActivePanel: (panel: UISlice['activePanel']) => void;
}

interface ChatSlice {
  streamingMessageId: string | null;
  streamingContent: string;
  inputDraft: Record<string, string>; // conversationId -> draft
  setStreaming: (messageId: string | null, content?: string) => void;
  appendStreamChunk: (chunk: string) => void;
  setInputDraft: (conversationId: string, draft: string) => void;
}

interface NotificationSlice {
  unreadCount: number;
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  setUnreadCount: (count: number) => void;
}

type AppStore = UISlice & ChatSlice & NotificationSlice;

// --- Slice Creators ---
const createUISlice = (set: SetState): UISlice => ({
  sidebarOpen: true,
  theme: 'system',
  activePanel: null,

  toggleSidebar: () =>
    set(
      (state) => { state.sidebarOpen = !state.sidebarOpen; },
      false,
      'ui/toggleSidebar'
    ),

  setTheme: (theme) =>
    set(
      (state) => { state.theme = theme; },
      false,
      'ui/setTheme'
    ),

  setActivePanel: (panel) =>
    set(
      (state) => { state.activePanel = panel; },
      false,
      'ui/setActivePanel'
    ),
});

const createChatSlice = (set: SetState): ChatSlice => ({
  streamingMessageId: null,
  streamingContent: '',
  inputDraft: {},

  setStreaming: (messageId, content = '') =>
    set(
      (state) => {
        state.streamingMessageId = messageId;
        state.streamingContent = content;
      },
      false,
      'chat/setStreaming'
    ),

  appendStreamChunk: (chunk) =>
    set(
      (state) => {
        state.streamingContent += chunk;
      },
      false,
      'chat/appendStreamChunk'
    ),

  setInputDraft: (conversationId, draft) =>
    set(
      (state) => {
        state.inputDraft[conversationId] = draft;
      },
      false,
      'chat/setInputDraft'
    ),
});

const createNotificationSlice = (set: SetState): NotificationSlice => ({
  unreadCount: 0,
  toasts: [],

  addToast: (toast) =>
    set(
      (state) => {
        state.toasts.push({ ...toast, id: crypto.randomUUID() });
      },
      false,
      'notification/addToast'
    ),

  dismissToast: (id) =>
    set(
      (state) => {
        state.toasts = state.toasts.filter((t) => t.id !== id);
      },
      false,
      'notification/dismissToast'
    ),

  setUnreadCount: (count) =>
    set(
      (state) => { state.unreadCount = count; },
      false,
      'notification/setUnreadCount'
    ),
});

// --- Combined Store ---
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      immer((...args) => ({
        ...createUISlice(...args),
        ...createChatSlice(...args),
        ...createNotificationSlice(...args),
      })),
      {
        name: 'stone-ai-app',
        // Only persist UI preferences, not transient state
        partialize: (state) => ({
          sidebarOpen: state.sidebarOpen,
          theme: state.theme,
          inputDraft: state.inputDraft,
        }),
      }
    ),
    { name: 'StoneAI' }
  )
);
```

### Selectors That Prevent Re-Renders

```typescript
// WRONG: Selecting the whole store causes re-render on ANY change
function ChatPanel() {
  // This component re-renders when sidebar, theme, toasts, ANYTHING changes
  const store = useAppStore();
  return <div>{store.streamingContent}</div>;
}

// WRONG: Creating a new object in the selector — always fails ===
function ChatPanel() {
  // New object every time → always re-renders
  const { streamingContent, isStreaming } = useAppStore((state) => ({
    streamingContent: state.streamingContent,
    isStreaming: state.streamingMessageId !== null,
  }));
}

// RIGHT: Select individual primitives
function ChatPanel() {
  const streamingContent = useAppStore((state) => state.streamingContent);
  const streamingMessageId = useAppStore((state) => state.streamingMessageId);
  const isStreaming = streamingMessageId !== null;

  return <div>{isStreaming ? streamingContent : null}</div>;
}

// RIGHT: Use shallow equality for object selectors
import { useShallow } from 'zustand/react/shallow';

function ChatPanel() {
  const { streamingContent, streamingMessageId } = useAppStore(
    useShallow((state) => ({
      streamingContent: state.streamingContent,
      streamingMessageId: state.streamingMessageId,
    }))
  );
}

// RIGHT: Pre-defined selector hooks for common patterns
export const useIsStreaming = () =>
  useAppStore((state) => state.streamingMessageId !== null);

export const useStreamingContent = () =>
  useAppStore((state) => state.streamingContent);

export const useSidebarOpen = () =>
  useAppStore((state) => state.sidebarOpen);

export const useTheme = () =>
  useAppStore((state) => state.theme);
```

### Zustand Middleware Stack

```typescript
// Order matters: outermost wraps innermost
// devtools(persist(immer(store)))
// This means:
// 1. immer: enables mutable-style updates
// 2. persist: saves/loads from storage
// 3. devtools: sends actions to Redux DevTools

// Custom middleware example: logging
const logMiddleware = (config) => (set, get, api) =>
  config(
    (...args) => {
      const prevState = get();
      set(...args);
      const nextState = get();
      if (process.env.NODE_ENV === 'development') {
        console.group('Zustand Update');
        console.log('Prev:', prevState);
        console.log('Next:', nextState);
        console.groupEnd();
      }
    },
    get,
    api
  );
```

---

## 6. useOptimistic for Chat

React 19's `useOptimistic` is purpose-built for this. It manages temporary optimistic state that automatically reverts when the action completes.

```typescript
// React 19 useOptimistic pattern for Stone AI chat
function ChatMessages({
  messages,
  conversationId,
}: {
  messages: Message[];
  conversationId: string;
}) {
  const [optimisticMessages, addOptimisticMessage] = useOptimistic(
    messages,
    (currentMessages, newMessage: Message) => [
      ...currentMessages,
      { ...newMessage, status: 'sending' as const },
    ]
  );

  async function sendAction(formData: FormData) {
    const content = formData.get('message') as string;
    if (!content.trim()) return;

    // Show message immediately with "sending" status
    addOptimisticMessage({
      id: `optimistic-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
      status: 'sending',
    });

    // Server action or API call
    await sendMessage(conversationId, content);
    // When this resolves, React replaces optimistic state
    // with the real 'messages' prop (which now includes the server response)
  }

  return (
    <div>
      {optimisticMessages.map((msg) => (
        <ChatMessage
          key={msg.id}
          message={msg}
          isPending={msg.status === 'sending'}
        />
      ))}
      <form action={sendAction}>
        <input name="message" />
        <SubmitButton />
      </form>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Sending...' : 'Send'}
    </button>
  );
}
```

---

## 7. useTransition for Non-Blocking UI

```typescript
// Heavy filter/search that shouldn't block typing
function AgentSearch() {
  const [query, setQuery] = useState('');
  const [filteredAgents, setFilteredAgents] = useState<Agent[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value); // High priority: update input immediately

    startTransition(() => {
      // Low priority: can be interrupted by typing
      const results = performExpensiveSearch(allAgents, value);
      setFilteredAgents(results);
    });
  };

  return (
    <div>
      <input value={query} onChange={handleSearch} placeholder="Search agents..." />
      {isPending && <Spinner className="absolute right-2 top-2" />}
      <AgentGrid agents={filteredAgents} />
    </div>
  );
}

// Navigation transition: show stale content while loading
function ConversationNav() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleConversationSwitch = (id: string) => {
    startTransition(() => {
      router.push(`/app/chat/${id}`);
    });
  };

  return (
    <nav className={isPending ? 'opacity-70 pointer-events-none' : ''}>
      {conversations.map((c) => (
        <button key={c.id} onClick={() => handleConversationSwitch(c.id)}>
          {c.title}
        </button>
      ))}
    </nav>
  );
}
```

---

## 8. Ref Forwarding & useImperativeHandle

```typescript
// Custom ChatInput component that exposes focus and clear methods
interface ChatInputHandle {
  focus: () => void;
  clear: () => void;
  getValue: () => string;
  insertAtCursor: (text: string) => void;
}

const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(
  function ChatInput({ onSubmit, disabled, placeholder }, ref) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus();
      },
      clear: () => {
        if (textareaRef.current) {
          textareaRef.current.value = '';
          // Trigger resize if auto-growing
          textareaRef.current.style.height = 'auto';
        }
      },
      getValue: () => textareaRef.current?.value ?? '',
      insertAtCursor: (text: string) => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const before = el.value.substring(0, start);
        const after = el.value.substring(end);
        el.value = before + text + after;
        el.selectionStart = el.selectionEnd = start + text.length;
        el.focus();
      },
    }), []);

    return (
      <textarea
        ref={textareaRef}
        disabled={disabled}
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSubmit(textareaRef.current?.value ?? '');
          }
        }}
      />
    );
  }
);

// Parent usage:
function ChatPanel() {
  const inputRef = useRef<ChatInputHandle>(null);

  const handleStreamComplete = () => {
    // Auto-focus input when AI finishes responding
    inputRef.current?.focus();
  };

  const handleAgentSwitch = () => {
    inputRef.current?.clear();
    inputRef.current?.focus();
  };

  return (
    <ChatInput
      ref={inputRef}
      onSubmit={handleSend}
      placeholder="Message Stone AI..."
    />
  );
}
```

---

## 9. Form State with react-hook-form + Zod

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Shared Zod schema (reuse between client and server)
const bestieConfigSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(30, 'Name must be under 30 characters')
    .regex(/^[a-zA-Z0-9\s]+$/, 'No special characters'),
  communicationStyle: z.enum(['casual', 'professional']),
  traits: z
    .array(z.string())
    .min(3, 'Pick at least 3 traits')
    .max(18, 'Maximum 18 traits'),
  language: z.enum(['en', 'es', 'fr', 'de', 'pt', 'ja']),
  path: z.enum(['supportive', 'challenging', 'analytical', 'creative']),
  avatarUrl: z
    .string()
    .url('Must be a valid URL')
    .regex(/\.(png|jpeg|jpg|webp|gif)$/i, 'Only png/jpeg/webp/gif allowed')
    .optional()
    .or(z.literal('')),
}).strict(); // .strict() per security directive D7

type BestieConfig = z.infer<typeof bestieConfigSchema>;

function BestieSettings({ userId }: { userId: string }) {
  const { bestie, updateBestie, isUpdating } = useBestie(userId);

  const form = useForm<BestieConfig>({
    resolver: zodResolver(bestieConfigSchema),
    defaultValues: {
      name: bestie?.name ?? '',
      communicationStyle: bestie?.communicationStyle ?? 'casual',
      traits: bestie?.traits ?? [],
      language: bestie?.language ?? 'en',
      path: bestie?.path ?? 'supportive',
      avatarUrl: bestie?.avatarUrl ?? '',
    },
  });

  const onSubmit = form.handleSubmit(async (data) => {
    try {
      await updateBestie(data);
      form.reset(data); // Reset dirty state
    } catch (err) {
      form.setError('root', {
        message: err instanceof Error ? err.message : 'Update failed',
      });
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label htmlFor="name">Bestie Name</label>
        <input
          id="name"
          {...form.register('name')}
          className={form.formState.errors.name ? 'border-red-500' : ''}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-red-500">
            {form.formState.errors.name.message}
          </p>
        )}
      </div>

      <div>
        <label>Traits ({form.watch('traits').length}/18)</label>
        <TraitPicker
          selected={form.watch('traits')}
          onChange={(traits) => form.setValue('traits', traits, {
            shouldValidate: true,
            shouldDirty: true,
          })}
          max={18}
        />
        {form.formState.errors.traits && (
          <p className="text-sm text-red-500">
            {form.formState.errors.traits.message}
          </p>
        )}
      </div>

      {form.formState.errors.root && (
        <div className="bg-red-100 text-red-700 p-3 rounded">
          {form.formState.errors.root.message}
        </div>
      )}

      <button
        type="submit"
        disabled={isUpdating || !form.formState.isDirty}
        className="btn-primary"
      >
        {isUpdating ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}
```

---

## 10. Race Condition Prevention

### Problem: User Sends Message While Previous Streams

```typescript
// WRONG: No guard against concurrent sends
function ChatInput({ onSend }: { onSend: (msg: string) => Promise<void> }) {
  const handleSubmit = async (content: string) => {
    // If user clicks "Send" while previous message is streaming,
    // two streams run concurrently and interleave tokens
    await onSend(content);
  };
}

// RIGHT: Mutex-style guard with AbortController
function useSerializedChat(conversationId: string) {
  const abortRef = useRef<AbortController | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  const sendMessage = useCallback(async (content: string) => {
    // Abort any in-flight stream
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsProcessing(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, message: content }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      // Stream the response
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (controller.signal.aborted) break;

        const chunk = decoder.decode(value, { stream: true });
        useAppStore.getState().appendStreamChunk(chunk);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      throw err;
    } finally {
      if (!controller.signal.aborted) {
        setIsProcessing(false);
        useAppStore.getState().setStreaming(null);
        queryClient.invalidateQueries({
          queryKey: queryKeys.messages.list(conversationId),
        });
      }
    }
  }, [conversationId, queryClient]);

  return { sendMessage, isProcessing };
}
```

### Double-Click Prevention

```typescript
// Hook: prevent double-click/double-submit
function useGuardedAction<T extends (...args: any[]) => Promise<any>>(
  action: T
): [T, boolean] {
  const [isPending, setIsPending] = useState(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => { mountedRef.current = false; };
  }, []);

  const guarded = useCallback(async (...args: Parameters<T>) => {
    if (isPending) return;
    setIsPending(true);
    try {
      return await action(...args);
    } finally {
      if (mountedRef.current) setIsPending(false);
    }
  }, [action, isPending]) as T;

  return [guarded, isPending];
}

// Usage:
function DeleteButton({ conversationId }: { conversationId: string }) {
  const [handleDelete, isDeleting] = useGuardedAction(
    useCallback(async () => {
      await deleteConversation(conversationId);
    }, [conversationId])
  );

  return (
    <button onClick={handleDelete} disabled={isDeleting}>
      {isDeleting ? 'Deleting...' : 'Delete'}
    </button>
  );
}
```

---

## 11. Context vs Zustand vs React Query Decision Tree

```
What kind of state is this?
│
├── SERVER STATE (data from API/DB)?
│   └── USE REACT QUERY
│       - Messages, conversations, agents, user profile, subscription
│       - Handles caching, refetching, stale data, optimistic updates
│       - Never put server state in Zustand
│
├── CLIENT-ONLY STATE shared across distant components?
│   └── USE ZUSTAND
│       - Theme, sidebar state, streaming content, input drafts
│       - Active panel, notification toasts, unread counts
│       - Anything that multiple unrelated components read/write
│
├── CLIENT-ONLY STATE shared between parent and close children?
│   └── Props or Composition first. Context if prop drilling > 3 levels.
│       - Form state within a form
│       - Modal open/close within a section
│       - Selected tab within a tab group
│
├── THEME / AUTH / LOCALE (rarely changes, many consumers)?
│   └── USE CONTEXT
│       - Clerk's auth context (already provided)
│       - next-intl locale context
│       - Provider-pattern config (QueryClient, theme)
│
└── LOCAL STATE (one component only)?
    └── USE useState / useReducer
        - Input value, hover state, toggle, animation state
        - Form field values (or react-hook-form for complex forms)
        - Ephemeral UI state that dies with the component
```

### Anti-Patterns to Avoid

```typescript
// ANTI-PATTERN: Server state in Zustand
// DON'T: Now you have to manually sync, invalidate, handle loading/error
const useStore = create((set) => ({
  agents: [],
  fetchAgents: async () => {
    const agents = await fetch('/api/agents').then(r => r.json());
    set({ agents }); // Stale the moment another user modifies agents
  },
}));

// DO: Use React Query — it handles all of this
const useAgents = () => useQuery({
  queryKey: queryKeys.agents.list(),
  queryFn: fetchAgents,
});

// ANTI-PATTERN: Context for frequently changing values
// DON'T: Every keystroke re-renders every consumer
const SearchContext = createContext<{
  query: string;
  setQuery: (q: string) => void;
} | null>(null);

// DO: Use Zustand — only subscribed selectors re-render
const useSearchStore = create((set) => ({
  query: '',
  setQuery: (query: string) => set({ query }),
}));

// ANTI-PATTERN: Zustand for local toggle state
// DON'T: Global state for something only one component uses
const useStore = create((set) => ({
  isDropdownOpen: false,
  toggleDropdown: () => set((s) => ({ isDropdownOpen: !s.isDropdownOpen })),
}));

// DO: Just use useState
function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);
}
```

---

## Quick Reference Cheat Sheet

| Pattern | Hook/Tool | When |
|---------|-----------|------|
| Server data | React Query | Always for API data |
| Global UI state | Zustand | Sidebar, theme, streaming |
| Local UI state | useState | Toggles, inputs, hover |
| Complex local state | useReducer | Multi-field forms, state machines |
| Expensive computation | useMemo | Only if truly expensive |
| Stable callback | useCallback | Only for memo'd children or deps |
| Non-blocking update | useTransition | Search, navigation, heavy filters |
| Optimistic UI | useOptimistic | Form submissions, chat sends |
| Expose child API | useImperativeHandle | Focus, scroll, clear methods |
| Always-fresh value | useRef + sync | Callbacks needing current state |
| Form validation | react-hook-form + Zod | Any form with validation |
| Race prevention | AbortController + ref | Streaming, concurrent fetches |

---

*Seed maintained by Senior Frontend Engineer. Last updated: 2026-03-09.*
