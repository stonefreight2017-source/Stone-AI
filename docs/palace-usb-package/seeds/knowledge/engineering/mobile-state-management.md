# Mobile State Management — Best AI Mobile

## Seed Classification
- **Domain**: Mobile Engineering
- **Application**: Best AI Mobile (Business #2)
- **Stack**: Zustand, MMKV, React Query (TanStack Query)
- **Audience**: Senior Frontend Engineer

---

## 1. State Management Architecture

### State Categories

| Category | Tool | Persistence | Example |
|----------|------|-------------|---------|
| Server state | React Query | In-memory cache | Agents, messages, user profile |
| Client UI state | Zustand | MMKV (selective) | Theme, active tab, input drafts |
| Auth state | Zustand + SecureStore | Keychain/Keystore | Tokens, session |
| Settings | Zustand + MMKV | MMKV | Preferences, language, notifications |
| Offline data | SQLite | SQLite DB | Cached conversations, sync queue |

```
┌─────────────────────────────────────────────┐
│                 UI Components                │
├────────┬──────────┬──────────┬──────────────┤
│ Zustand│  React   │  Zustand │    SQLite    │
│ (UI)   │  Query   │(Settings)│  (Offline)   │
│        │ (Server) │          │              │
├────────┴──────────┴──────────┴──────────────┤
│  MMKV        HTTP/WS Cache   MMKV    SQLite │
│(Persist)     (In-Memory)    (Persist) (Disk) │
└─────────────────────────────────────────────┘
```

---

## 2. MMKV for Persistence

### MMKV Setup

MMKV is a key-value storage library developed by WeChat. It is 30x faster than AsyncStorage and uses memory-mapped files.

```typescript
// src/utils/storage.ts
import { MMKV } from 'react-native-mmkv';
import { StateStorage } from 'zustand/middleware';

// Main MMKV instance
export const mmkv = new MMKV({
  id: 'bestai-main',
  encryptionKey: undefined, // Set for encrypted storage
});

// Separate instance for sensitive data
export const secureMmkv = new MMKV({
  id: 'bestai-secure',
  // Encryption key should come from SecureStore on first launch
});

// Zustand-compatible storage adapter
export const mmkvStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const value = mmkv.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string): void => {
    mmkv.set(name, value);
  },
  removeItem: (name: string): void => {
    mmkv.delete(name);
  },
};

// React Query persistent cache adapter
export const queryStorage = {
  getItem: (key: string): string | undefined => {
    return mmkv.getString(key);
  },
  setItem: (key: string, value: string): void => {
    mmkv.set(key, value);
  },
  removeItem: (key: string): void => {
    mmkv.delete(key);
  },
};

// Utility functions
export const storage = {
  get: <T>(key: string): T | null => {
    const value = mmkv.getString(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },

  set: <T>(key: string, value: T): void => {
    mmkv.set(key, JSON.stringify(value));
  },

  remove: (key: string): void => {
    mmkv.delete(key);
  },

  clear: (): void => {
    mmkv.clearAll();
  },

  // MMKV-specific: fast boolean/number access without JSON parsing
  getBool: (key: string): boolean => mmkv.getBoolean(key) ?? false,
  setBool: (key: string, value: boolean): void => mmkv.set(key, value),
  getNum: (key: string): number => mmkv.getNumber(key) ?? 0,
  setNum: (key: string, value: number): void => mmkv.set(key, value),
};
```

---

## 3. Zustand Stores

### Auth Store

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/src/utils/storage';

interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  lastActiveAt: string | null;

  setAuthenticated: (auth: boolean, userId: string | null) => void;
  updateLastActive: () => void;
  reset: () => void;
}

export const authStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      userId: null,
      lastActiveAt: null,

      setAuthenticated: (auth, userId) =>
        set({
          isAuthenticated: auth,
          userId,
          lastActiveAt: new Date().toISOString(),
        }),

      updateLastActive: () =>
        set({ lastActiveAt: new Date().toISOString() }),

      reset: () =>
        set({
          isAuthenticated: false,
          userId: null,
          lastActiveAt: null,
        }),
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
```

### Chat Store

```typescript
// src/stores/chatStore.ts
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface ChatState {
  activeConversationId: string | null;
  drafts: Record<string, string>; // conversationId -> draft text
  unreadCounts: Record<string, number>;
  typingAgents: Set<string>; // agentIds currently typing

  setActiveConversation: (id: string | null) => void;
  saveDraft: (conversationId: string, text: string) => void;
  getDraft: (conversationId: string) => string;
  clearDraft: (conversationId: string) => void;
  markNewMessage: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
  setAgentTyping: (agentId: string, typing: boolean) => void;
}

export const chatStore = create<ChatState>()(
  immer((set, get) => ({
    activeConversationId: null,
    drafts: {},
    unreadCounts: {},
    typingAgents: new Set(),

    setActiveConversation: (id) => {
      set((state) => {
        state.activeConversationId = id;
        if (id) {
          state.unreadCounts[id] = 0;
        }
      });
    },

    saveDraft: (conversationId, text) => {
      set((state) => {
        if (text.trim()) {
          state.drafts[conversationId] = text;
        } else {
          delete state.drafts[conversationId];
        }
      });
    },

    getDraft: (conversationId) => {
      return get().drafts[conversationId] ?? '';
    },

    clearDraft: (conversationId) => {
      set((state) => {
        delete state.drafts[conversationId];
      });
    },

    markNewMessage: (conversationId) => {
      set((state) => {
        if (conversationId !== state.activeConversationId) {
          state.unreadCounts[conversationId] =
            (state.unreadCounts[conversationId] ?? 0) + 1;
        }
      });
    },

    clearUnread: (conversationId) => {
      set((state) => {
        state.unreadCounts[conversationId] = 0;
      });
    },

    setAgentTyping: (agentId, typing) => {
      set((state) => {
        if (typing) {
          state.typingAgents.add(agentId);
        } else {
          state.typingAgents.delete(agentId);
        }
      });
    },
  }))
);
```

### Settings Store

```typescript
// src/stores/settingsStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/src/utils/storage';
import type { UserPreferences, SupportedLanguage } from '@/src/types/shared';

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  hapticFeedback: true,
  notificationsEnabled: true,
  quietHoursStart: undefined,
  quietHoursEnd: undefined,
  biometricLock: false,
  fontSize: 'medium',
  reducedMotion: false,
};

interface SettingsState {
  preferences: UserPreferences;
  language: SupportedLanguage;
  hasCompletedOnboarding: boolean;

  updatePreferences: (partial: Partial<UserPreferences>) => void;
  setLanguage: (lang: SupportedLanguage) => void;
  completeOnboarding: () => void;
  resetPreferences: () => void;
}

export const settingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      preferences: DEFAULT_PREFERENCES,
      language: 'en',
      hasCompletedOnboarding: false,

      updatePreferences: (partial) =>
        set((state) => ({
          preferences: { ...state.preferences, ...partial },
        })),

      setLanguage: (lang) => set({ language: lang }),

      completeOnboarding: () => set({ hasCompletedOnboarding: true }),

      resetPreferences: () => set({ preferences: DEFAULT_PREFERENCES }),
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
```

### Agent Store

```typescript
// src/stores/agentStore.ts
import { create } from 'zustand';

interface AgentState {
  favoriteAgentIds: string[];
  recentAgentIds: string[];
  searchQuery: string;
  selectedCategory: string | null;

  toggleFavorite: (agentId: string) => void;
  addRecent: (agentId: string) => void;
  setSearchQuery: (query: string) => void;
  setCategory: (category: string | null) => void;
}

export const agentStore = create<AgentState>()((set) => ({
  favoriteAgentIds: [],
  recentAgentIds: [],
  searchQuery: '',
  selectedCategory: null,

  toggleFavorite: (agentId) =>
    set((state) => ({
      favoriteAgentIds: state.favoriteAgentIds.includes(agentId)
        ? state.favoriteAgentIds.filter((id) => id !== agentId)
        : [...state.favoriteAgentIds, agentId],
    })),

  addRecent: (agentId) =>
    set((state) => ({
      recentAgentIds: [
        agentId,
        ...state.recentAgentIds.filter((id) => id !== agentId),
      ].slice(0, 10), // Keep last 10
    })),

  setSearchQuery: (query) => set({ searchQuery: query }),
  setCategory: (category) => set({ selectedCategory: category }),
}));
```

---

## 4. React Query Mobile Patterns

### Query Client Configuration

```typescript
// src/services/api/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { onlineManager, focusManager } from '@tanstack/react-query';

// Configure online status from NetInfo
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

// Refetch on app focus (foreground)
focusManager.setEventListener((setFocused) => {
  const subscription = AppState.addEventListener('change', (status) => {
    setFocused(status === 'active');
  });
  return () => subscription.remove();
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Mobile-optimized defaults
      staleTime: 5 * 60 * 1000,      // 5 minutes — reduce refetches on mobile
      gcTime: 30 * 60 * 1000,         // 30 minutes garbage collection
      retry: 2,                        // Retry failed requests twice
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      refetchOnWindowFocus: true,      // Refetch when app comes to foreground
      refetchOnReconnect: true,        // Refetch when network reconnects
      networkMode: 'offlineFirst',     // Show cached data while offline
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});
```

### Query Hooks

```typescript
// src/hooks/useAgents.ts
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { agentService } from '@/src/services/api/agents';
import type { Agent, AgentTier } from '@/src/types/shared';

// Fetch all agents (cached aggressively — agent list doesn't change often)
export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: () => agentService.getAll(),
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000,    // 1 hour
    select: (data) => {
      // Sort: favorites first, then by tier, then by name
      const favorites = agentStore.getState().favoriteAgentIds;
      return data.sort((a, b) => {
        const aFav = favorites.includes(a.id) ? -1 : 0;
        const bFav = favorites.includes(b.id) ? -1 : 0;
        return aFav - bFav || a.name.localeCompare(b.name);
      });
    },
  });
}

// Fetch agents by tier
export function useAgentsByTier(tier: AgentTier) {
  return useQuery({
    queryKey: ['agents', 'tier', tier],
    queryFn: () => agentService.getByTier(tier),
    staleTime: 30 * 60 * 1000,
  });
}

// Single agent detail
export function useAgent(agentId: string) {
  return useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => agentService.getById(agentId),
    enabled: !!agentId,
    // Use the agents list cache as initial data
    initialData: () => {
      return queryClient.getQueryData<Agent[]>(['agents'])
        ?.find((a) => a.id === agentId);
    },
  });
}
```

```typescript
// src/hooks/useConversations.ts
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { chatService } from '@/src/services/api/chat';

export function useConversations() {
  return useInfiniteQuery({
    queryKey: ['conversations'],
    queryFn: ({ pageParam }) =>
      chatService.getConversations({ cursor: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) =>
      chatService.deleteConversation(conversationId),
    onMutate: async (conversationId) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['conversations'] });
      const previousData = queryClient.getQueryData(['conversations']);

      queryClient.setQueryData(['conversations'], (old: any) => ({
        ...old,
        pages: old.pages.map((page: any) => ({
          ...page,
          items: page.items.filter((c: any) => c.id !== conversationId),
        })),
      }));

      return { previousData };
    },
    onError: (_err, _id, context) => {
      // Rollback on error
      queryClient.setQueryData(['conversations'], context?.previousData);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
```

---

## 5. Background Refresh

### Prefetching on App Resume

```typescript
// src/hooks/useBackgroundRefresh.ts
import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

export function useBackgroundRefresh() {
  const queryClient = useQueryClient();
  const appState = useRef(AppState.currentState);
  const lastRefresh = useRef(Date.now());

  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextState: AppStateStatus) => {
        if (
          appState.current.match(/inactive|background/) &&
          nextState === 'active'
        ) {
          const elapsed = Date.now() - lastRefresh.current;

          // Refresh conversations if backgrounded for >2 minutes
          if (elapsed > 2 * 60 * 1000) {
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
          }

          // Refresh agents if backgrounded for >30 minutes
          if (elapsed > 30 * 60 * 1000) {
            queryClient.invalidateQueries({ queryKey: ['agents'] });
          }

          lastRefresh.current = Date.now();
        }

        appState.current = nextState;
      }
    );

    return () => subscription.remove();
  }, [queryClient]);
}
```

---

## 6. Zustand Selectors for Performance

```typescript
// Performance-optimized selectors — prevent unnecessary re-renders

// BAD: This re-renders whenever ANY chatStore state changes
const { drafts, unreadCounts } = chatStore();

// GOOD: Only re-render when specific slice changes
const draft = chatStore((s) => s.drafts[conversationId]);
const unread = chatStore((s) => s.unreadCounts[conversationId] ?? 0);

// GOOD: Shallow comparison for objects
import { useShallow } from 'zustand/react/shallow';
const { favoriteAgentIds, recentAgentIds } = agentStore(
  useShallow((s) => ({
    favoriteAgentIds: s.favoriteAgentIds,
    recentAgentIds: s.recentAgentIds,
  }))
);

// GOOD: Derived state with useMemo
const totalUnread = chatStore((s) => {
  return Object.values(s.unreadCounts).reduce((sum, count) => sum + count, 0);
});
```

---

## 7. State Hydration on App Launch

```typescript
// src/services/stateHydration.ts
import { queryClient } from './api/queryClient';
import { localDb } from './offline/database';
import { conversationRepo } from './offline/repositories/conversationRepo';

// Hydrate React Query cache from local SQLite database on app launch
export async function hydrateStateFromLocalDb(): Promise<void> {
  await localDb.initialize();

  // Load cached conversations into React Query
  const conversations = await conversationRepo.getAll({ limit: 50 });
  if (conversations.length > 0) {
    queryClient.setQueryData(['conversations'], {
      pages: [{ items: conversations, nextCursor: null }],
      pageParams: [undefined],
    });
  }

  // Load cached agents
  const db = localDb.getDb();
  const agents = await db.getAllAsync('SELECT * FROM agents WHERE is_active = 1');
  if (agents.length > 0) {
    queryClient.setQueryData(['agents'], agents);
  }
}
```

This state management architecture keeps Best AI Mobile responsive with instant UI updates, efficient re-renders, and seamless offline-to-online transitions. Zustand handles client state with minimal boilerplate, React Query manages server state with smart caching, and MMKV provides the fastest possible persistence layer.
