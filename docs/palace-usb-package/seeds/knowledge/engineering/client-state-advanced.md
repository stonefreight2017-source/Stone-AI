# Advanced Client State Management — Frontend Engineering Seed

> Deep knowledge seed for the Stone AI Palace USB Package.
> Covers Zustand store patterns, React Query for server state, nuqs for URL state, form state isolation, SSR hydration, performance optimization, and real-world Stone AI state architecture.

---

## Table of Contents

1. [State Categories in Next.js Apps](#state-categories-in-nextjs-apps)
2. [Zustand Store Fundamentals](#zustand-store-fundamentals)
3. [Store Slicing and Modular State](#store-slicing-and-modular-state)
4. [Zustand Middleware](#zustand-middleware)
5. [React Query as Server State Manager](#react-query-as-server-state-manager)
6. [Separating Server State from Client State](#separating-server-state-from-client-state)
7. [URL State with nuqs](#url-state-with-nuqs)
8. [Form State Isolation](#form-state-isolation)
9. [Cross-Component Communication](#cross-component-communication)
10. [State Hydration in SSR/RSC Context](#state-hydration-in-ssrrsc-context)
11. [Performance Optimization](#performance-optimization)
12. [Real-World Patterns: Stone AI Stores](#real-world-patterns-stone-ai-stores)

---

## State Categories in Next.js Apps

Not all state is created equal. Mixing state categories leads to stale data, unnecessary re-renders, and architecture that's impossible to reason about.

| Category | What It Is | Where It Lives | Examples |
|---|---|---|---|
| **Server State** | Data owned by the backend | React Query / SWR | User profile, agent list, chat history |
| **Client State** | UI-only state | Zustand / useState | Sidebar open, theme, selected tab |
| **URL State** | State encoded in the URL | nuqs / searchParams | Filters, pagination, search query |
| **Form State** | Ephemeral input state | react-hook-form / useState | Field values, validation errors |
| **Derived State** | Computed from other state | useMemo / selectors | Filtered lists, computed totals |

**The golden rule**: Never put server state in Zustand. Never put URL state in Zustand. Each state category has a purpose-built tool.

---

## Zustand Store Fundamentals

### Why Zustand Over Context

React Context re-renders ALL consumers when the context value changes. Zustand allows selective subscriptions — components only re-render when the specific slice they subscribe to changes.

```tsx
// React Context — EVERY consumer re-renders when ANY value changes
const AppContext = createContext<{
  sidebarOpen: boolean;
  theme: string;
  notifications: number;
}>({ sidebarOpen: false, theme: "dark", notifications: 0 });

// Zustand — components subscribe to specific slices
const useAppStore = create<AppStore>((set) => ({
  sidebarOpen: false,
  theme: "dark",
  notifications: 0,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));

// Only re-renders when sidebarOpen changes
const sidebarOpen = useAppStore((s) => s.sidebarOpen);
```

### Basic Store Pattern

```tsx
// src/stores/ui-store.ts
import { create } from "zustand";

interface UIState {
  // State
  sidebarOpen: boolean;
  sidebarWidth: number;
  activePanel: "chat" | "agents" | "settings" | null;
  commandPaletteOpen: boolean;

  // Actions
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  setActivePanel: (panel: UIState["activePanel"]) => void;
  toggleCommandPalette: () => void;
  reset: () => void;
}

const initialState = {
  sidebarOpen: true,
  sidebarWidth: 280,
  activePanel: null as UIState["activePanel"],
  commandPaletteOpen: false,
};

export const useUIStore = create<UIState>((set) => ({
  ...initialState,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  setSidebarWidth: (width) => set({ sidebarWidth: Math.max(200, Math.min(400, width)) }),

  setActivePanel: (panel) => set({ activePanel: panel }),

  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),

  reset: () => set(initialState),
}));
```

### Using Stores in Components

```tsx
"use client";

import { useUIStore } from "@/stores/ui-store";

function Sidebar() {
  // Subscribe to specific values only
  const isOpen = useUIStore((s) => s.sidebarOpen);
  const width = useUIStore((s) => s.sidebarWidth);
  const toggle = useUIStore((s) => s.toggleSidebar);

  if (!isOpen) return null;

  return (
    <aside style={{ width }}>
      <button onClick={toggle}>Close</button>
      {/* sidebar content */}
    </aside>
  );
}

// Accessing actions without subscribing to state
function SomeDeepComponent() {
  // getState() doesn't cause re-renders
  const handleClick = () => {
    useUIStore.getState().toggleCommandPalette();
  };

  return <button onClick={handleClick}>Open Command Palette</button>;
}
```

---

## Store Slicing and Modular State

### The Slice Pattern

For large apps, a single store becomes unwieldy. The slice pattern splits state into focused modules that are composed into one store.

```tsx
// src/stores/slices/chat-slice.ts
import type { StateCreator } from "zustand";

export interface ChatSlice {
  activeConversationId: string | null;
  inputValue: string;
  isStreaming: boolean;
  streamingMessageId: string | null;
  setActiveConversation: (id: string | null) => void;
  setInputValue: (value: string) => void;
  setStreaming: (isStreaming: boolean, messageId?: string) => void;
  clearInput: () => void;
}

export const createChatSlice: StateCreator<
  ChatSlice & UISlice,  // Full store type for cross-slice access
  [],
  [],
  ChatSlice
> = (set) => ({
  activeConversationId: null,
  inputValue: "",
  isStreaming: false,
  streamingMessageId: null,

  setActiveConversation: (id) =>
    set({ activeConversationId: id, inputValue: "" }),

  setInputValue: (value) => set({ inputValue: value }),

  setStreaming: (isStreaming, messageId) =>
    set({ isStreaming, streamingMessageId: messageId ?? null }),

  clearInput: () => set({ inputValue: "" }),
});
```

```tsx
// src/stores/slices/ui-slice.ts
import type { StateCreator } from "zustand";

export interface UISlice {
  sidebarOpen: boolean;
  theme: "dark" | "light" | "system";
  toggleSidebar: () => void;
  setTheme: (theme: UISlice["theme"]) => void;
}

export const createUISlice: StateCreator<
  ChatSlice & UISlice,
  [],
  [],
  UISlice
> = (set) => ({
  sidebarOpen: true,
  theme: "dark",
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setTheme: (theme) => set({ theme }),
});
```

### Composing Slices

```tsx
// src/stores/app-store.ts
import { create } from "zustand";
import { createChatSlice, type ChatSlice } from "./slices/chat-slice";
import { createUISlice, type UISlice } from "./slices/ui-slice";

type AppStore = ChatSlice & UISlice;

export const useAppStore = create<AppStore>()((...a) => ({
  ...createChatSlice(...a),
  ...createUISlice(...a),
}));
```

### Cross-Slice Access

Slices can read from other slices via `get()`:

```tsx
export const createChatSlice: StateCreator<
  ChatSlice & UISlice,
  [],
  [],
  ChatSlice
> = (set, get) => ({
  // ...
  setActiveConversation: (id) => {
    set({ activeConversationId: id, inputValue: "" });

    // Access UI slice to ensure sidebar is open when selecting a conversation
    if (!get().sidebarOpen) {
      get().toggleSidebar();
    }
  },
});
```

---

## Zustand Middleware

### persist — Survive Page Refresh

```tsx
// src/stores/settings-store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SettingsState {
  fontSize: number;
  codeTheme: string;
  soundEnabled: boolean;
  language: string;
  setFontSize: (size: number) => void;
  setCodeTheme: (theme: string) => void;
  toggleSound: () => void;
  setLanguage: (lang: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      fontSize: 14,
      codeTheme: "one-dark-pro",
      soundEnabled: true,
      language: "en",

      setFontSize: (size) => set({ fontSize: Math.max(10, Math.min(24, size)) }),
      setCodeTheme: (theme) => set({ codeTheme: theme }),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      setLanguage: (lang) => set({ language: lang }),
    }),
    {
      name: "stone-ai-settings",  // localStorage key
      storage: createJSONStorage(() => localStorage),

      // Only persist specific fields (not actions)
      partialize: (state) => ({
        fontSize: state.fontSize,
        codeTheme: state.codeTheme,
        soundEnabled: state.soundEnabled,
        language: state.language,
      }),

      // Version for migrations
      version: 1,

      // Migration function when version changes
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Record<string, unknown>;
        if (version === 0) {
          // v0 → v1: rename 'theme' to 'codeTheme'
          state.codeTheme = state.theme ?? "one-dark-pro";
          delete state.theme;
        }
        return state as SettingsState;
      },
    }
  )
);
```

### devtools — Redux DevTools Integration

```tsx
import { create } from "zustand";
import { devtools } from "zustand/middleware";

export const useChatStore = create<ChatState>()(
  devtools(
    (set) => ({
      messages: [],
      addMessage: (msg) =>
        set(
          (s) => ({ messages: [...s.messages, msg] }),
          false,  // don't replace state
          "chat/addMessage"  // action name for DevTools
        ),
    }),
    {
      name: "ChatStore",
      enabled: process.env.NODE_ENV === "development",
    }
  )
);
```

### immer — Immutable Updates with Mutable Syntax

```tsx
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface ConversationState {
  conversations: Record<string, Conversation>;
  updateMessage: (convId: string, msgId: string, content: string) => void;
  addReaction: (convId: string, msgId: string, emoji: string) => void;
}

export const useConversationStore = create<ConversationState>()(
  immer((set) => ({
    conversations: {},

    updateMessage: (convId, msgId, content) =>
      set((state) => {
        // Direct mutation is safe with immer!
        const msg = state.conversations[convId]?.messages.find(
          (m) => m.id === msgId
        );
        if (msg) {
          msg.content = content;
          msg.updatedAt = new Date().toISOString();
        }
      }),

    addReaction: (convId, msgId, emoji) =>
      set((state) => {
        const msg = state.conversations[convId]?.messages.find(
          (m) => m.id === msgId
        );
        if (msg) {
          msg.reactions = msg.reactions ?? [];
          msg.reactions.push({ emoji, userId: "current-user", timestamp: Date.now() });
        }
      }),
  }))
);
```

### Composing Multiple Middleware

```tsx
import { create } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// Order matters: outermost wraps first
// persist(devtools(immer(store)))
export const useStore = create<StoreType>()(
  persist(
    devtools(
      immer((set) => ({
        // store definition
      })),
      { name: "MyStore" }
    ),
    {
      name: "my-store-key",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

---

## React Query as Server State Manager

### Setup

```tsx
// src/providers/query-provider.tsx
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,      // 1 minute before data is stale
            gcTime: 5 * 60 * 1000,     // 5 minutes before garbage collection
            retry: 2,
            refetchOnWindowFocus: false, // Disable for chat app (too many refetches)
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
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
```

### Query Patterns

```tsx
// src/hooks/use-agents.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// Query key factory — single source of truth for all keys
export const agentKeys = {
  all: ["agents"] as const,
  lists: () => [...agentKeys.all, "list"] as const,
  list: (filters: AgentFilters) => [...agentKeys.lists(), filters] as const,
  details: () => [...agentKeys.all, "detail"] as const,
  detail: (id: string) => [...agentKeys.details(), id] as const,
};

// Fetch function
async function fetchAgents(filters: AgentFilters): Promise<Agent[]> {
  const params = new URLSearchParams();
  if (filters.tier) params.set("tier", filters.tier);
  if (filters.search) params.set("search", filters.search);

  const res = await fetch(`/api/agents?${params}`);
  if (!res.ok) throw new Error("Failed to fetch agents");
  return res.json();
}

// Query hook
export function useAgents(filters: AgentFilters = {}) {
  return useQuery({
    queryKey: agentKeys.list(filters),
    queryFn: () => fetchAgents(filters),
    staleTime: 5 * 60 * 1000,  // Agents don't change often
  });
}

// Single agent
export function useAgent(id: string) {
  return useQuery({
    queryKey: agentKeys.detail(id),
    queryFn: async () => {
      const res = await fetch(`/api/agents/${id}`);
      if (!res.ok) throw new Error("Agent not found");
      return res.json() as Promise<Agent>;
    },
    enabled: !!id,  // Don't fetch if no ID
  });
}
```

### Mutation with Optimistic Updates

```tsx
// src/hooks/use-update-profile.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileInput) => {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json() as Promise<User>;
    },

    // Optimistic update
    onMutate: async (newData) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ["profile"] });

      // Snapshot previous value
      const previousProfile = queryClient.getQueryData<User>(["profile"]);

      // Optimistically update
      queryClient.setQueryData<User>(["profile"], (old) =>
        old ? { ...old, ...newData } : old
      );

      return { previousProfile };
    },

    // Rollback on error
    onError: (_err, _newData, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(["profile"], context.previousProfile);
      }
    },

    // Refetch after mutation settles
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

// Usage in component
function ProfileForm() {
  const updateProfile = useUpdateProfile();

  const handleSubmit = (data: UpdateProfileInput) => {
    updateProfile.mutate(data, {
      onSuccess: () => {
        toast.success("Profile updated!");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={updateProfile.isPending}>
        {updateProfile.isPending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
```

### Infinite Queries (Chat History)

```tsx
// src/hooks/use-conversations.ts
import { useInfiniteQuery } from "@tanstack/react-query";

interface ConversationPage {
  conversations: Conversation[];
  nextCursor: string | null;
}

export function useConversations() {
  return useInfiniteQuery({
    queryKey: ["conversations"],
    queryFn: async ({ pageParam }): Promise<ConversationPage> => {
      const params = new URLSearchParams();
      if (pageParam) params.set("cursor", pageParam);
      params.set("limit", "20");

      const res = await fetch(`/api/conversations?${params}`);
      if (!res.ok) throw new Error("Failed to fetch conversations");
      return res.json();
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 30 * 1000,
  });
}

// Usage
function ConversationList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useConversations();

  const conversations = data?.pages.flatMap((p) => p.conversations) ?? [];

  return (
    <div>
      {conversations.map((convo) => (
        <ConversationItem key={convo.id} conversation={convo} />
      ))}
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
```

---

## Separating Server State from Client State

### The Architecture

```
┌─────────────────────────────────────────────┐
│                    Component                  │
│                                               │
│  Server State (React Query)                   │
│  ├── useAgents()         → agent list         │
│  ├── useConversations()  → chat history       │
│  └── useProfile()        → user data          │
│                                               │
│  Client State (Zustand)                       │
│  ├── useUIStore()        → sidebar, theme     │
│  ├── useChatStore()      → input, streaming   │
│  └── useSettingsStore()  → preferences        │
│                                               │
│  URL State (nuqs)                             │
│  ├── useQueryState("q")  → search query       │
│  └── useQueryState("tier") → tier filter      │
│                                               │
│  Form State (react-hook-form)                 │
│  └── useForm()           → field values       │
│                                               │
│  Derived State (useMemo)                      │
│  └── filteredAgents      → computed from above │
└─────────────────────────────────────────────┘
```

### Anti-Pattern: Server Data in Zustand

```tsx
// BAD — duplicating server state in Zustand
const useAgentStore = create((set) => ({
  agents: [],
  isLoading: false,
  fetchAgents: async () => {
    set({ isLoading: true });
    const res = await fetch("/api/agents");
    const agents = await res.json();
    set({ agents, isLoading: false });
  },
}));
// Problems: no caching, no deduplication, no refetch, no error retry,
// stale data when tab returns, manual loading states

// GOOD — React Query handles server state
function AgentList() {
  const { data: agents, isLoading } = useAgents();
  const selectedAgentId = useUIStore((s) => s.selectedAgentId);
  // React Query: server data. Zustand: which one is selected (UI state).
}
```

### When Zustand IS Appropriate for "Server" Data

The exception: ephemeral server data that doesn't need caching, deduplication, or background refetching. Example: streaming chat tokens.

```tsx
// This is fine — streaming tokens are ephemeral, not cacheable
const useChatStore = create<ChatStreamState>((set) => ({
  streamingTokens: "",
  isStreaming: false,

  appendToken: (token: string) =>
    set((s) => ({ streamingTokens: s.streamingTokens + token })),

  startStream: () => set({ streamingTokens: "", isStreaming: true }),

  endStream: () => set({ isStreaming: false }),
}));
```

---

## URL State with nuqs

### Why URL State

URL state is state that should survive:
- Page refresh
- Copy/paste the URL to share
- Browser back/forward navigation

Filters, search queries, pagination, sort order, and selected tabs are all URL state.

### Setup

```bash
npm install nuqs
```

```tsx
// src/app/layout.tsx or providers
import { NuqsAdapter } from "nuqs/adapters/next/app";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
```

### Basic Usage

```tsx
"use client";

import { useQueryState, parseAsString, parseAsInteger, parseAsStringEnum } from "nuqs";

function AgentFilterBar() {
  // String param: ?q=search-term
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));

  // Enum param: ?tier=STARTER
  const [tier, setTier] = useQueryState(
    "tier",
    parseAsStringEnum(["FREE", "STARTER", "PLUS", "SMART", "PRO"]).withDefault("FREE")
  );

  // Integer param: ?page=2
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

  return (
    <div className="flex gap-4">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value || null)}  // null removes param
        placeholder="Search agents..."
      />

      <select value={tier} onChange={(e) => setTier(e.target.value as any)}>
        <option value="FREE">Free</option>
        <option value="STARTER">Starter</option>
        <option value="PLUS">Plus</option>
        <option value="SMART">Smart</option>
        <option value="PRO">Pro</option>
      </select>

      <div className="flex gap-2">
        <button onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
        <span>Page {page}</span>
        <button onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </div>
  );
}
```

### Coordinating URL State with React Query

```tsx
"use client";

import { useQueryState, parseAsString, parseAsStringEnum } from "nuqs";
import { useAgents } from "@/hooks/use-agents";

function AgentBrowser() {
  const [search] = useQueryState("q", parseAsString.withDefault(""));
  const [tier] = useQueryState(
    "tier",
    parseAsStringEnum(["FREE", "STARTER", "PLUS", "SMART", "PRO"])
  );

  // URL state drives the query
  const { data: agents, isLoading } = useAgents({
    search: search || undefined,
    tier: tier || undefined,
  });

  return (
    <div>
      <AgentFilterBar />
      {isLoading ? <LoadingSkeleton /> : <AgentGrid agents={agents ?? []} />}
    </div>
  );
}
```

### Batched Updates

```tsx
"use client";

import { useQueryStates, parseAsString, parseAsInteger } from "nuqs";

function FilterPanel() {
  // Multiple params updated atomically
  const [filters, setFilters] = useQueryStates({
    q: parseAsString.withDefault(""),
    tier: parseAsString,
    page: parseAsInteger.withDefault(1),
    sort: parseAsString.withDefault("name"),
  });

  const resetFilters = () => {
    setFilters({
      q: null,
      tier: null,
      page: 1,
      sort: "name",
    });
  };

  return (
    <div>
      <input
        value={filters.q}
        onChange={(e) => setFilters({ q: e.target.value || null, page: 1 })}
      />
      <button onClick={resetFilters}>Reset</button>
    </div>
  );
}
```

---

## Form State Isolation

### Why Isolate Form State

Form state is temporary. It exists only while the user is editing. It should never leak into your global store or URL.

### react-hook-form Patterns

```tsx
"use client";

import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must be under 50 characters"),
  bio: z
    .string()
    .max(500, "Bio must be under 500 characters")
    .optional(),
  language: z.enum(["en", "es", "fr", "de", "ja", "pt"]),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    marketing: z.boolean(),
  }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

function ProfileSettingsForm({ defaultValues }: { defaultValues: ProfileFormData }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues,
  });

  const updateProfile = useUpdateProfile();

  const onSubmit: SubmitHandler<ProfileFormData> = async (data) => {
    await updateProfile.mutateAsync(data);
    reset(data);  // Reset dirty state with new values
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="displayName" className="text-sm font-medium text-stone-200">
          Display Name
        </label>
        <input
          id="displayName"
          {...register("displayName")}
          className="mt-1 w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2"
        />
        {errors.displayName && (
          <p className="mt-1 text-xs text-red-400">{errors.displayName.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="bio" className="text-sm font-medium text-stone-200">Bio</label>
        <textarea
          id="bio"
          {...register("bio")}
          rows={3}
          className="mt-1 w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2"
        />
        {errors.bio && (
          <p className="mt-1 text-xs text-red-400">{errors.bio.message}</p>
        )}
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-stone-200">Notifications</legend>
        <div className="mt-2 space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register("notifications.email")} />
            <span className="text-sm text-stone-300">Email notifications</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register("notifications.push")} />
            <span className="text-sm text-stone-300">Push notifications</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" {...register("notifications.marketing")} />
            <span className="text-sm text-stone-300">Marketing emails</span>
          </label>
        </div>
      </fieldset>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={!isDirty || isSubmitting}
          className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Changes"}
        </button>
        {isDirty && (
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-lg border border-stone-700 px-4 py-2 text-sm text-stone-300"
          >
            Discard
          </button>
        )}
      </div>
    </form>
  );
}
```

### Unsaved Changes Warning

```tsx
"use client";

import { useEffect } from "react";
import { useFormState } from "react-hook-form";

function UnsavedChangesGuard({ control }: { control: Control<any> }) {
  const { isDirty } = useFormState({ control });

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";  // Required for Chrome
      }
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  return null;
}
```

---

## Cross-Component Communication

### Without Prop Drilling

**Pattern 1**: Zustand (for UI state across unrelated components)

```tsx
// Any component can read/write without props
function DeepNestedChild() {
  const toggle = useUIStore((s) => s.toggleSidebar);
  return <button onClick={toggle}>Toggle Sidebar</button>;
}
```

**Pattern 2**: Custom Events (for truly decoupled communication)

```tsx
// src/lib/events.ts
type EventMap = {
  "chat:message-sent": { conversationId: string; messageId: string };
  "agent:selected": { agentId: string };
  "toast:show": { message: string; type: "success" | "error" | "info" };
};

class TypedEventEmitter {
  private emitter = new EventTarget();

  emit<K extends keyof EventMap>(event: K, data: EventMap[K]) {
    this.emitter.dispatchEvent(
      new CustomEvent(event, { detail: data })
    );
  }

  on<K extends keyof EventMap>(event: K, handler: (data: EventMap[K]) => void) {
    const listener = (e: Event) => handler((e as CustomEvent).detail);
    this.emitter.addEventListener(event, listener);
    return () => this.emitter.removeEventListener(event, listener);
  }
}

export const events = new TypedEventEmitter();
```

```tsx
// Hook for subscribing
"use client";

import { useEffect } from "react";
import { events } from "@/lib/events";

export function useEvent<K extends keyof EventMap>(
  event: K,
  handler: (data: EventMap[K]) => void
) {
  useEffect(() => {
    return events.on(event, handler);
  }, [event, handler]);
}

// Usage
function ChatPanel() {
  useEvent("agent:selected", ({ agentId }) => {
    // Open chat with selected agent
  });
}

function AgentList() {
  const handleSelect = (agentId: string) => {
    events.emit("agent:selected", { agentId });
  };
}
```

**Pattern 3**: React Query Cache as Communication Bus

```tsx
// Component A updates data
const queryClient = useQueryClient();
queryClient.setQueryData(["unread-count"], (old: number) => old + 1);

// Component B subscribes to the same key
const { data: unreadCount } = useQuery({
  queryKey: ["unread-count"],
  queryFn: fetchUnreadCount,
});
// Automatically re-renders when Component A updates the cache
```

---

## State Hydration in SSR/RSC Context

### The Hydration Problem

Server Components render on the server. Client Components hydrate on the client. If a Zustand store initializes with different values on server vs client, you get a hydration mismatch.

### Pattern 1: useEffect Guard

```tsx
"use client";

import { useEffect, useState } from "react";

function ThemeIndicator() {
  const theme = useSettingsStore((s) => s.theme);  // From persisted localStorage
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;  // Don't render until client-side
  return <span>{theme}</span>;
}
```

### Pattern 2: Store Hydration from Server Data

```tsx
// src/stores/user-store.ts
import { create } from "zustand";

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

// Hydration component — renders once to push server data into store
// src/components/store-hydrator.tsx
"use client";

import { useRef } from "react";
import { useUserStore } from "@/stores/user-store";

export function StoreHydrator({ user }: { user: User | null }) {
  const initialized = useRef(false);

  if (!initialized.current) {
    useUserStore.setState({ user });
    initialized.current = true;
  }

  return null;
}

// Usage in server layout
// src/app/(dashboard)/layout.tsx
import { StoreHydrator } from "@/components/store-hydrator";
import { currentUser } from "@clerk/nextjs/server";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();

  return (
    <>
      <StoreHydrator user={user ? serializeUser(user) : null} />
      {children}
    </>
  );
}
```

### Pattern 3: Zustand persist with onRehydrateStorage

```tsx
export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // ...
    }),
    {
      name: "stone-ai-settings",
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error("Failed to rehydrate settings:", error);
          }
          // Store is now hydrated from localStorage
        };
      },
    }
  )
);

// Check hydration status
function SettingsPanel() {
  const hasHydrated = useSettingsStore.persist.hasHydrated();

  if (!hasHydrated) return <SettingsSkeleton />;
  return <SettingsContent />;
}
```

---

## Performance Optimization

### Selective Subscriptions

```tsx
// BAD — re-renders on ANY store change
function Component() {
  const store = useAppStore();  // Subscribes to everything
  return <div>{store.sidebarOpen}</div>;
}

// GOOD — re-renders only when sidebarOpen changes
function Component() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  return <div>{sidebarOpen}</div>;
}
```

### Shallow Equality for Objects/Arrays

```tsx
import { useShallow } from "zustand/react/shallow";

// BAD — creates new object every render, always triggers re-render
function Component() {
  const { theme, fontSize } = useAppStore((s) => ({
    theme: s.theme,
    fontSize: s.fontSize,
  }));
}

// GOOD — shallow compare on the returned object
function Component() {
  const { theme, fontSize } = useAppStore(
    useShallow((s) => ({
      theme: s.theme,
      fontSize: s.fontSize,
    }))
  );
}
```

### Memoized Selectors

```tsx
// For expensive derived state, memoize the selector
import { useMemo } from "react";

function AgentList() {
  const agents = useAgentStore((s) => s.agents);
  const filter = useUIStore((s) => s.agentFilter);

  // Memoize the filtered result
  const filteredAgents = useMemo(
    () => agents.filter((a) => !filter || a.tier === filter),
    [agents, filter]
  );

  return (
    <div>
      {filteredAgents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}
```

### Avoiding Re-renders from Actions

```tsx
// BAD — subscribes to the action function (which is stable, but pattern is wrong)
function Component() {
  const { sidebarOpen, toggleSidebar } = useAppStore(
    useShallow((s) => ({ sidebarOpen: s.sidebarOpen, toggleSidebar: s.toggleSidebar }))
  );
}

// GOOD — separate subscriptions for state vs actions
function Component() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);
  // Actions are stable references, don't need shallow
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
}

// ALSO GOOD — use getState() for fire-and-forget actions
function Component() {
  const sidebarOpen = useAppStore((s) => s.sidebarOpen);

  const handleClick = () => {
    useAppStore.getState().toggleSidebar();
  };
}
```

### React Query Optimization

```tsx
// 1. Select only needed fields
const { data: agentName } = useQuery({
  queryKey: agentKeys.detail(id),
  queryFn: () => fetchAgent(id),
  select: (data) => data.name,  // Only re-renders when name changes
});

// 2. Structural sharing (enabled by default)
// React Query compares old and new data structurally
// If the data hasn't changed, the same reference is returned

// 3. Placeholder data for instant UX
const { data: agent } = useQuery({
  queryKey: agentKeys.detail(id),
  queryFn: () => fetchAgent(id),
  placeholderData: () => {
    // Use list data as placeholder for detail view
    return queryClient
      .getQueryData<Agent[]>(agentKeys.lists())
      ?.find((a) => a.id === id);
  },
});
```

---

## Real-World Patterns: Stone AI Stores

### Chat State Store

```tsx
// src/stores/chat-store.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";

interface ChatState {
  // Active conversation
  activeConversationId: string | null;
  activeAgentId: string | null;

  // Input
  inputValue: string;
  attachments: File[];

  // Streaming
  isStreaming: boolean;
  streamingContent: string;
  streamingMessageId: string | null;

  // UI
  isInputFocused: boolean;
  scrollPosition: number;
  showScrollToBottom: boolean;

  // Actions
  setActiveConversation: (id: string | null, agentId?: string) => void;
  setInputValue: (value: string) => void;
  addAttachment: (file: File) => void;
  removeAttachment: (index: number) => void;
  clearInput: () => void;

  // Streaming actions
  startStreaming: (messageId: string) => void;
  appendStreamToken: (token: string) => void;
  endStreaming: () => void;

  // UI actions
  setInputFocused: (focused: boolean) => void;
  setScrollPosition: (position: number) => void;
  setShowScrollToBottom: (show: boolean) => void;
}

export const useChatStore = create<ChatState>()(
  devtools(
    (set) => ({
      activeConversationId: null,
      activeAgentId: null,
      inputValue: "",
      attachments: [],
      isStreaming: false,
      streamingContent: "",
      streamingMessageId: null,
      isInputFocused: false,
      scrollPosition: 0,
      showScrollToBottom: false,

      setActiveConversation: (id, agentId) =>
        set(
          {
            activeConversationId: id,
            activeAgentId: agentId ?? null,
            inputValue: "",
            attachments: [],
            streamingContent: "",
            isStreaming: false,
          },
          false,
          "chat/setActiveConversation"
        ),

      setInputValue: (value) =>
        set({ inputValue: value }, false, "chat/setInputValue"),

      addAttachment: (file) =>
        set(
          (s) => ({ attachments: [...s.attachments, file] }),
          false,
          "chat/addAttachment"
        ),

      removeAttachment: (index) =>
        set(
          (s) => ({
            attachments: s.attachments.filter((_, i) => i !== index),
          }),
          false,
          "chat/removeAttachment"
        ),

      clearInput: () =>
        set({ inputValue: "", attachments: [] }, false, "chat/clearInput"),

      startStreaming: (messageId) =>
        set(
          { isStreaming: true, streamingContent: "", streamingMessageId: messageId },
          false,
          "chat/startStreaming"
        ),

      appendStreamToken: (token) =>
        set(
          (s) => ({ streamingContent: s.streamingContent + token }),
          false,
          "chat/appendStreamToken"
        ),

      endStreaming: () =>
        set(
          { isStreaming: false, streamingMessageId: null },
          false,
          "chat/endStreaming"
        ),

      setInputFocused: (focused) => set({ isInputFocused: focused }),
      setScrollPosition: (position) => set({ scrollPosition: position }),
      setShowScrollToBottom: (show) => set({ showScrollToBottom: show }),
    }),
    { name: "ChatStore", enabled: process.env.NODE_ENV === "development" }
  )
);
```

### Settings Store (Persisted)

```tsx
// src/stores/settings-store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface SettingsState {
  // Appearance
  theme: "dark" | "light" | "system";
  fontSize: number;
  chatBubbleStyle: "modern" | "classic";
  backdropId: string | null;

  // Behavior
  enterToSend: boolean;
  soundEnabled: boolean;
  showTimestamps: boolean;
  compactMode: boolean;

  // Accessibility
  reducedMotion: boolean;
  highContrast: boolean;

  // Actions
  updateSettings: (partial: Partial<Omit<SettingsState, "updateSettings" | "resetSettings">>) => void;
  resetSettings: () => void;
}

const defaults = {
  theme: "dark" as const,
  fontSize: 14,
  chatBubbleStyle: "modern" as const,
  backdropId: null,
  enterToSend: true,
  soundEnabled: true,
  showTimestamps: false,
  compactMode: false,
  reducedMotion: false,
  highContrast: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...defaults,

      updateSettings: (partial) => set(partial),

      resetSettings: () => set(defaults),
    }),
    {
      name: "stone-ai-settings",
      storage: createJSONStorage(() => localStorage),
      version: 2,
      partialize: (state) => {
        // Strip actions from persisted state
        const { updateSettings, resetSettings, ...data } = state;
        return data;
      },
    }
  )
);
```

### UI State Store

```tsx
// src/stores/ui-store.ts
import { create } from "zustand";

interface UIState {
  // Layout
  sidebarOpen: boolean;
  sidebarWidth: number;
  rightPanelOpen: boolean;
  rightPanelContent: "agent-info" | "settings" | "help" | null;

  // Modals
  activeModal: string | null;
  modalProps: Record<string, unknown>;

  // Command palette
  commandPaletteOpen: boolean;

  // Actions
  toggleSidebar: () => void;
  setSidebarWidth: (w: number) => void;
  openRightPanel: (content: NonNullable<UIState["rightPanelContent"]>) => void;
  closeRightPanel: () => void;
  openModal: (id: string, props?: Record<string, unknown>) => void;
  closeModal: () => void;
  toggleCommandPalette: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  sidebarWidth: 280,
  rightPanelOpen: false,
  rightPanelContent: null,
  activeModal: null,
  modalProps: {},
  commandPaletteOpen: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  setSidebarWidth: (w) => set({ sidebarWidth: Math.max(200, Math.min(400, w)) }),

  openRightPanel: (content) =>
    set({ rightPanelOpen: true, rightPanelContent: content }),

  closeRightPanel: () =>
    set({ rightPanelOpen: false, rightPanelContent: null }),

  openModal: (id, props = {}) =>
    set({ activeModal: id, modalProps: props }),

  closeModal: () =>
    set({ activeModal: null, modalProps: {} }),

  toggleCommandPalette: () =>
    set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
}));
```

---

## Quick Reference: State Decision Tree

```
Where does the data come from?
├── Server/API → React Query
├── URL (shareable) → nuqs
├── User input (temporary) → react-hook-form or useState
└── UI-only (client) → Zustand
    ├── Needs to persist? → Zustand + persist middleware
    ├── Shared across routes? → Zustand (global store)
    └── Local to one component? → useState
```

---

## Common Mistakes

1. **Server data in Zustand**: Use React Query. It handles caching, deduplication, background refetch, and error retry.
2. **URL state in Zustand**: Filters and search params belong in the URL. Use nuqs.
3. **Subscribing to the entire store**: Always use selectors: `useStore((s) => s.specificField)`.
4. **Forgetting shallow equality**: When selecting objects/arrays, use `useShallow`.
5. **Persisting actions**: Use `partialize` to strip functions from persisted state.
6. **Hydration mismatches**: Guard client-only state with `mounted` check or `useEffect`.
7. **Too many stores**: Start with 2-3 stores (UI, chat, settings). Split only when needed.
8. **Not using query key factories**: Hardcoded query keys lead to cache invalidation bugs.

---

*Stone AI Palace USB Package — Frontend Engineering Seed*
*Advanced Client State Management v1.0*
