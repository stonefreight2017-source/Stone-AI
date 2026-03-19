# Performance Optimization for React — Deep Knowledge Seed

> Stone AI Engineering Knowledge Base
> Scope: React memoization, bundle optimization, virtual scrolling, Core Web Vitals, profiling
> Stack: Next.js 16, TypeScript, React 19, Tailwind CSS

---

## Table of Contents

1. [React.memo, useMemo, useCallback](#reactmemo-usememo-usecallback)
2. [Bundle Analysis and Code Splitting](#bundle-analysis-and-code-splitting)
3. [Lazy Loading Routes and Components](#lazy-loading-routes-and-components)
4. [Virtual Scrolling](#virtual-scrolling)
5. [Debouncing and Throttling](#debouncing-and-throttling)
6. [Web Workers](#web-workers)
7. [Service Workers and Offline Caching](#service-workers-and-offline-caching)
8. [Core Web Vitals Optimization](#core-web-vitals-optimization)
9. [React DevTools Profiler](#react-devtools-profiler)
10. [Bundle Size Monitoring](#bundle-size-monitoring)
11. [Tree Shaking and Dead Code Elimination](#tree-shaking-and-dead-code-elimination)
12. [Real Optimization Examples](#real-optimization-examples)

---

## React.memo, useMemo, useCallback

### The Truth About Memoization

Most React performance advice is cargo-culted. The cost of memoization (comparing props, storing cached values) can exceed the cost of re-rendering. Here is when each tool actually helps — and when it hurts.

### React.memo — Preventing Component Re-renders

React.memo wraps a component to skip re-rendering when its props have not changed (shallow comparison). It is useful when a component:
1. Renders frequently due to parent state changes
2. Has expensive render logic (complex calculations, large DOM trees)
3. Receives the same props most of the time

```typescript
// GOOD USE: Expensive list item rendered inside a frequently-updating parent
import { memo } from 'react';

interface AgentCardProps {
  agent: Agent;
  onSelect: (id: string) => void;
}

// This component renders 42+ times in a grid.
// Parent re-renders on search input changes.
// Without memo, every card re-renders on every keystroke.
const AgentCard = memo(function AgentCard({ agent, onSelect }: AgentCardProps) {
  return (
    <div
      onClick={() => onSelect(agent.id)}
      className="rounded-lg border p-4 hover:border-primary transition-colors"
    >
      <div className="flex items-center gap-3">
        <img
          src={agent.avatarUrl}
          alt={agent.name}
          className="h-12 w-12 rounded-full"
        />
        <div>
          <h3 className="font-semibold">{agent.name}</h3>
          <span className="text-sm text-muted-foreground">
            {agent.category}
          </span>
        </div>
      </div>
      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
        {agent.description}
      </p>
    </div>
  );
});

// BAD USE: Simple component that rarely re-renders
// The memo overhead here exceeds the render cost.
const Label = memo(({ text }: { text: string }) => (
  <span className="text-sm font-medium">{text}</span>
));
// Just use: function Label({ text }: { text: string }) { ... }
```

### Custom Comparison Function

```typescript
// Use when shallow comparison is insufficient
interface ChatMessageProps {
  message: Message;
  isSelected: boolean;
  searchHighlight: string | null;
}

const ChatMessage = memo(
  function ChatMessage({ message, isSelected, searchHighlight }: ChatMessageProps) {
    // Expensive markdown rendering
    const rendered = renderMarkdown(message.content, searchHighlight);

    return (
      <div className={cn('p-4', isSelected && 'bg-accent')}>
        {rendered}
      </div>
    );
  },
  // Custom comparator: only re-render if message content or selection changes
  (prevProps, nextProps) => {
    return (
      prevProps.message.id === nextProps.message.id &&
      prevProps.message.content === nextProps.message.content &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.searchHighlight === nextProps.searchHighlight
    );
  }
);
```

### useMemo — Caching Expensive Computations

```typescript
// GOOD USE: Expensive computation that runs on every render
function AgentList({ agents, filters }: AgentListProps) {
  // Without useMemo, this sorts and filters on EVERY render
  // (typing in an unrelated input, toggling a checkbox, etc.)
  const filteredAgents = useMemo(() => {
    let result = agents;

    if (filters.category) {
      result = result.filter((a) => a.category === filters.category);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(searchLower) ||
          a.description.toLowerCase().includes(searchLower)
      );
    }

    // Expensive sort
    return result.sort((a, b) => {
      if (filters.sortBy === 'name') return a.name.localeCompare(b.name);
      if (filters.sortBy === 'popularity') return b.usageCount - a.usageCount;
      return a.number - b.number;
    });
  }, [agents, filters.category, filters.search, filters.sortBy]);

  return (
    <div className="grid grid-cols-4 gap-4">
      {filteredAgents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}

// GOOD USE: Preventing unnecessary child re-renders with object props
function ChatContainer({ messages }: { messages: Message[] }) {
  // Without useMemo, a new object is created every render,
  // causing children with this prop to always re-render
  const stats = useMemo(
    () => ({
      total: messages.length,
      userMessages: messages.filter((m) => m.role === 'user').length,
      assistantMessages: messages.filter((m) => m.role === 'assistant').length,
    }),
    [messages]
  );

  return <ChatStats stats={stats} />;
}

// BAD USE: Trivial computation
const fullName = useMemo(
  () => `${firstName} ${lastName}`,
  [firstName, lastName]
);
// Just use: const fullName = `${firstName} ${lastName}`;

// BAD USE: Memoizing a primitive
const isAdmin = useMemo(() => role === 'admin', [role]);
// Just use: const isAdmin = role === 'admin';
```

### useCallback — Stable Function References

```typescript
// GOOD USE: Callback passed to memo'd child component
function AgentSelector({ onSelect }: { onSelect: (agent: Agent) => void }) {
  const [search, setSearch] = useState('');

  // Without useCallback, a new function is created every render.
  // AgentCard is memo'd, but receives a new onSelect reference each time,
  // defeating the memo.
  const handleSelect = useCallback(
    (id: string) => {
      const agent = agents.find((a) => a.id === id);
      if (agent) onSelect(agent);
    },
    [agents, onSelect]
  );

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} onSelect={handleSelect} />
      ))}
    </div>
  );
}

// GOOD USE: Callback used in useEffect dependency array
function useAutoSave(content: string, conversationId: string) {
  const save = useCallback(async () => {
    await fetch(`/api/conversations/${conversationId}/draft`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  }, [content, conversationId]);

  useEffect(() => {
    const timer = setTimeout(save, 2000);
    return () => clearTimeout(timer);
  }, [save]);
}

// BAD USE: Callback not passed to children, not in dep arrays
function Form() {
  // This useCallback does nothing useful
  const handleSubmit = useCallback(() => {
    submitForm();
  }, []);
  // Just use: const handleSubmit = () => { submitForm(); };
}
```

### The Decision Framework

```
Should I memoize?
│
├─ Is the computation expensive (>1ms)? ──YES──► useMemo
│                                          NO
├─ Is a child component wrapped in memo()? ──YES──► useCallback for functions, useMemo for objects
│                                            NO
├─ Is the value used in a dependency array? ──YES──► useCallback/useMemo
│                                             NO
└─ Don't memoize. The render is fast enough.
```

---

## Bundle Analysis and Code Splitting

### Analyzing Your Bundle

```bash
# Install the bundle analyzer
npm install -D @next/bundle-analyzer

# next.config.ts
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);

# Run analysis
ANALYZE=true npm run build
```

### Dynamic Imports (Code Splitting)

```typescript
// Split heavy components that aren't needed on initial load
import dynamic from 'next/dynamic';

// Markdown renderer — only needed when viewing messages
const MarkdownRenderer = dynamic(
  () => import('@/components/markdown-renderer'),
  {
    loading: () => <div className="animate-pulse h-20 bg-muted rounded" />,
    ssr: false, // Don't render on server — it's a client interaction
  }
);

// Code editor — very heavy (~200KB), only needed in specific views
const CodeEditor = dynamic(
  () => import('@/components/code-editor').then((mod) => mod.CodeEditor),
  {
    loading: () => <CodeEditorSkeleton />,
    ssr: false,
  }
);

// Chart library — only needed on dashboard
const AnalyticsChart = dynamic(
  () => import('@/components/analytics-chart'),
  {
    loading: () => <ChartSkeleton />,
  }
);

// Emoji picker — heavy, only needed when user clicks emoji button
const EmojiPicker = dynamic(
  () => import('emoji-picker-react'),
  {
    loading: () => <div className="h-80 w-72 bg-muted rounded-lg" />,
    ssr: false,
  }
);
```

### Route-Level Code Splitting

Next.js 16 App Router automatically code-splits at the route level. Each `page.tsx` is its own bundle. To optimize further:

```typescript
// Parallel routes for independent loading
// src/app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  stats,      // @stats/page.tsx — loads independently
  activity,   // @activity/page.tsx — loads independently
}: {
  children: React.ReactNode;
  stats: React.ReactNode;
  activity: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-12 gap-4">
      <div className="col-span-8">{children}</div>
      <div className="col-span-4">
        <Suspense fallback={<StatsSkeleton />}>{stats}</Suspense>
        <Suspense fallback={<ActivitySkeleton />}>{activity}</Suspense>
      </div>
    </div>
  );
}
```

### Conditional Imports

```typescript
// Only load premium features for paid users
function PremiumFeatures({ tier }: { tier: string }) {
  if (tier === 'free') return null;

  // This import only loads if the user is on a paid tier
  const PremiumDashboard = dynamic(
    () => import('@/components/premium/dashboard'),
    { loading: () => <PremiumSkeleton /> }
  );

  return <PremiumDashboard />;
}

// Load based on feature flag
function FeatureGate({ flag, children }: { flag: string; children: React.ReactNode }) {
  const { isEnabled } = useFeatureFlag(flag);

  if (!isEnabled) return null;
  return <>{children}</>;
}
```

---

## Lazy Loading Routes and Components

### Image Optimization

```typescript
// next/image handles lazy loading automatically
import Image from 'next/image';

// Agent avatar — small, always in viewport
function AgentAvatar({ agent }: { agent: Agent }) {
  return (
    <Image
      src={agent.avatarUrl}
      alt={agent.name}
      width={48}
      height={48}
      className="rounded-full"
      // priority for above-the-fold images
      priority={false}
      // Placeholder while loading
      placeholder="blur"
      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN8/+F9PQAI8wNPvd7POQAAAABJRU5ErkJggg=="
    />
  );
}

// Hero image — above the fold, load immediately
function HeroSection() {
  return (
    <Image
      src="/images/hero.webp"
      alt="Stone AI"
      width={1200}
      height={630}
      priority // Preload this image
      className="w-full h-auto"
      sizes="100vw"
    />
  );
}

// Gallery with responsive sizes
function BackdropGallery({ backdrops }: { backdrops: Backdrop[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {backdrops.map((backdrop) => (
        <Image
          key={backdrop.id}
          src={backdrop.url}
          alt={backdrop.name}
          width={400}
          height={300}
          className="rounded-lg object-cover"
          // Responsive sizes for different breakpoints
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
          loading="lazy" // Default behavior — explicit for clarity
        />
      ))}
    </div>
  );
}
```

### Intersection Observer for Lazy Components

```typescript
// src/hooks/use-lazy-component.ts
'use client';

import { useEffect, useRef, useState } from 'react';

export function useLazyLoad(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element); // Only trigger once
        }
      },
      {
        rootMargin: '200px', // Start loading 200px before viewport
        ...options,
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isVisible };
}

// Usage: lazy-load a heavy section
function ForumSection() {
  const { ref, isVisible } = useLazyLoad();

  return (
    <div ref={ref}>
      {isVisible ? (
        <ForumPosts />
      ) : (
        <ForumSkeleton />
      )}
    </div>
  );
}
```

---

## Virtual Scrolling

### TanStack Virtual for Long Lists

```typescript
// npm install @tanstack/react-virtual
'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

interface VirtualChatProps {
  messages: Message[];
}

export function VirtualChatMessages({ messages }: VirtualChatProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    // Estimate row height — will be measured dynamically
    estimateSize: (index) => {
      const msg = messages[index];
      // Rough estimate based on content length
      const lines = Math.ceil(msg.content.length / 80);
      return Math.max(60, lines * 24 + 40);
    },
    overscan: 10, // Render 10 extra items above/below viewport
    // For chat: scroll to bottom behavior
    getItemKey: (index) => messages[index].id,
  });

  return (
    <div
      ref={parentRef}
      className="h-full overflow-auto"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const message = messages[virtualItem.index];

          return (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <ChatMessage message={message} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Scroll to bottom when new messages arrive
function ChatWithAutoScroll({ messages }: { messages: Message[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  // Auto-scroll to bottom on new messages (only if user is at bottom)
  useEffect(() => {
    if (isAtBottom && messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, {
        align: 'end',
        behavior: 'smooth',
      });
    }
  }, [messages.length, isAtBottom, virtualizer]);

  // Track scroll position
  const handleScroll = () => {
    const el = parentRef.current;
    if (!el) return;
    const threshold = 100;
    setIsAtBottom(
      el.scrollHeight - el.scrollTop - el.clientHeight < threshold
    );
  };

  return (
    <div ref={parentRef} onScroll={handleScroll} className="h-full overflow-auto">
      {/* ... virtual items ... */}
      {!isAtBottom && (
        <button
          onClick={() =>
            virtualizer.scrollToIndex(messages.length - 1, {
              align: 'end',
              behavior: 'smooth',
            })
          }
          className="fixed bottom-20 right-8 rounded-full bg-primary p-2 shadow-lg"
        >
          Scroll to bottom
        </button>
      )}
    </div>
  );
}
```

### Virtual Grid for Agent Gallery

```typescript
'use client';

import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualAgentGrid({ agents }: { agents: Agent[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const columns = 4; // Responsive: calculate based on container width
  const rowCount = Math.ceil(agents.length / columns);

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200, // Card height
    overscan: 3,
  });

  return (
    <div ref={parentRef} className="h-[calc(100vh-200px)] overflow-auto">
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const startIndex = virtualRow.index * columns;
          const rowAgents = agents.slice(startIndex, startIndex + columns);

          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
              }}
              className="grid grid-cols-4 gap-4 px-4"
            >
              {rowAgents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## Debouncing and Throttling

### Debounce Hook

```typescript
// src/hooks/use-debounce.ts
'use client';

import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage: search input
function AgentSearch() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data: agents } = useQuery({
    queryKey: ['agents', 'search', debouncedSearch],
    queryFn: () => fetchAgents({ search: debouncedSearch }),
    enabled: debouncedSearch.length >= 2, // Min 2 chars
  });

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search agents..."
      />
      {/* Results update 300ms after user stops typing */}
      <AgentResults agents={agents ?? []} />
    </div>
  );
}
```

### Debounced Callback

```typescript
// src/hooks/use-debounced-callback.ts
'use client';

import { useCallback, useRef } from 'react';

export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  ) as T;
}

// Usage: auto-save draft
function ChatDraft({ conversationId }: { conversationId: string }) {
  const [content, setContent] = useState('');

  const saveDraft = useDebouncedCallback(
    async (text: string) => {
      await fetch(`/api/conversations/${conversationId}/draft`, {
        method: 'PUT',
        body: JSON.stringify({ content: text }),
      });
    },
    1000 // Save 1 second after user stops typing
  );

  return (
    <textarea
      value={content}
      onChange={(e) => {
        setContent(e.target.value);
        saveDraft(e.target.value);
      }}
    />
  );
}
```

### Throttle Hook

```typescript
// src/hooks/use-throttle.ts
'use client';

import { useCallback, useRef } from 'react';

export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCallRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      const remaining = delay - (now - lastCallRef.current);

      if (remaining <= 0) {
        lastCallRef.current = now;
        callback(...args);
      } else {
        // Schedule trailing call
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          lastCallRef.current = Date.now();
          callback(...args);
        }, remaining);
      }
    },
    [callback, delay]
  ) as T;
}

// Usage: scroll position tracking (max once per 100ms)
function ScrollTracker() {
  const handleScroll = useThrottledCallback(() => {
    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const progress = scrollTop / (scrollHeight - window.innerHeight);
    // Update progress indicator
    setScrollProgress(progress);
  }, 100);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return null;
}

// Usage: window resize handler
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const handleResize = useThrottledCallback(() => {
    setSize({ width: window.innerWidth, height: window.innerHeight });
  }, 150);

  useEffect(() => {
    handleResize(); // Set initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return size;
}
```

---

## Web Workers

### Offloading Heavy Computation

```typescript
// src/workers/search-worker.ts
// This runs in a separate thread — no UI jank

interface SearchRequest {
  type: 'search';
  query: string;
  items: Array<{ id: string; name: string; description: string; tags: string[] }>;
}

interface SearchResult {
  type: 'result';
  matches: Array<{ id: string; score: number }>;
}

self.onmessage = (event: MessageEvent<SearchRequest>) => {
  const { query, items } = event.data;
  const queryLower = query.toLowerCase();
  const queryTerms = queryLower.split(/\s+/);

  const matches = items
    .map((item) => {
      let score = 0;

      // Exact name match
      if (item.name.toLowerCase() === queryLower) score += 100;
      // Name contains query
      else if (item.name.toLowerCase().includes(queryLower)) score += 50;

      // Term matching
      for (const term of queryTerms) {
        if (item.name.toLowerCase().includes(term)) score += 20;
        if (item.description.toLowerCase().includes(term)) score += 10;
        if (item.tags.some((t) => t.toLowerCase().includes(term))) score += 15;
      }

      return { id: item.id, score };
    })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);

  const response: SearchResult = { type: 'result', matches };
  self.postMessage(response);
};

// src/hooks/use-worker-search.ts
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useWorkerSearch<T extends { id: string }>(items: T[]) {
  const workerRef = useRef<Worker | null>(null);
  const [results, setResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/search-worker.ts', import.meta.url)
    );

    workerRef.current.onmessage = (event) => {
      setResults(event.data.matches.map((m: any) => m.id));
      setIsSearching(false);
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const search = useCallback(
    (query: string) => {
      if (!workerRef.current || !query.trim()) {
        setResults(items.map((i) => i.id));
        return;
      }

      setIsSearching(true);
      workerRef.current.postMessage({
        type: 'search',
        query,
        items,
      });
    },
    [items]
  );

  return { results, search, isSearching };
}
```

### Markdown Processing in Worker

```typescript
// src/workers/markdown-worker.ts
import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';
import hljs from 'highlight.js';

// Configure marked with syntax highlighting
marked.setOptions({
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
});

self.onmessage = async (event: MessageEvent<{ id: string; content: string }>) => {
  const { id, content } = event.data;

  // Heavy operation: parse markdown + sanitize HTML
  const html = await marked(content);
  const sanitized = DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'code', 'pre', 'h1', 'h2', 'h3',
      'ul', 'ol', 'li', 'a', 'blockquote', 'table', 'thead', 'tbody',
      'tr', 'th', 'td', 'img', 'span', 'div',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'class', 'title'],
  });

  self.postMessage({ id, html: sanitized });
};
```

---

## Service Workers and Offline Caching

### Basic Service Worker Setup

```typescript
// public/sw.js
const CACHE_NAME = 'stone-ai-v1';
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API calls: network first, fall back to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful GET responses
          if (request.method === 'GET' && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets: cache first
  if (
    url.pathname.match(/\.(js|css|png|jpg|svg|woff2)$/) ||
    url.pathname.startsWith('/_next/static/')
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        });
      })
    );
    return;
  }

  // Pages: network first, fall back to offline page
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request).then((cached) => {
        return cached || caches.match('/offline');
      });
    })
  );
});
```

### Registration

```typescript
// src/lib/register-sw.ts
export function registerServiceWorker() {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration.scope);

          // Check for updates every hour
          setInterval(() => registration.update(), 60 * 60 * 1000);
        })
        .catch((error) => {
          console.error('SW registration failed:', error);
        });
    });
  }
}
```

---

## Core Web Vitals Optimization

### LCP (Largest Contentful Paint)

Target: < 2.5 seconds

```typescript
// 1. Preload critical fonts
// src/app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Show fallback font immediately
  preload: true,
  variable: '--font-inter',
});

// 2. Priority images for above-the-fold content
<Image
  src="/hero.webp"
  priority  // Adds <link rel="preload">
  fetchPriority="high"
  alt="Hero"
  width={1200}
  height={630}
/>

// 3. Avoid layout shifts from dynamic content
// BAD: content jumps when data loads
function Header() {
  const { user } = useUser();
  return user ? <UserMenu user={user} /> : null; // Causes layout shift
}

// GOOD: reserve space
function Header() {
  const { user, isLoaded } = useUser();
  return (
    <div className="h-10 w-10"> {/* Fixed size container */}
      {isLoaded ? (
        user ? <UserMenu user={user} /> : <SignInButton />
      ) : (
        <Skeleton className="h-10 w-10 rounded-full" />
      )}
    </div>
  );
}

// 4. Inline critical CSS (Next.js does this automatically for CSS modules)
// Ensure Tailwind purges unused CSS in production
```

### INP (Interaction to Next Paint)

Target: < 200ms

```typescript
// 1. Keep event handlers fast — offload heavy work
function ChatInput({ onSend }: { onSend: (msg: string) => Promise<void> }) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const content = inputRef.current?.value;
    if (!content?.trim()) return;

    // Don't await — let the UI update immediately
    onSend(content).catch(console.error);

    // Clear input synchronously
    if (inputRef.current) inputRef.current.value = '';
  };

  return <form onSubmit={handleSubmit}>...</form>;
}

// 2. Use CSS transitions instead of JS animations
// BAD: JS-driven animation blocks main thread
function Sidebar({ isOpen }: { isOpen: boolean }) {
  const [width, setWidth] = useState(isOpen ? 256 : 0);
  useEffect(() => {
    // Animating with JS = bad INP
    const interval = setInterval(() => {
      setWidth((w) => isOpen ? Math.min(w + 10, 256) : Math.max(w - 10, 0));
    }, 16);
    return () => clearInterval(interval);
  }, [isOpen]);
}

// GOOD: CSS transition — runs on compositor thread
function Sidebar({ isOpen }: { isOpen: boolean }) {
  return (
    <aside
      className={cn(
        'w-64 transition-transform duration-300 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      ...
    </aside>
  );
}

// 3. Use startTransition for non-urgent updates
import { startTransition, useState } from 'react';

function AgentFilter() {
  const [filter, setFilter] = useState('');
  const [filteredAgents, setFilteredAgents] = useState(allAgents);

  const handleChange = (value: string) => {
    // Update input immediately (urgent)
    setFilter(value);

    // Filter list can be deferred (non-urgent)
    startTransition(() => {
      setFilteredAgents(
        allAgents.filter((a) =>
          a.name.toLowerCase().includes(value.toLowerCase())
        )
      );
    });
  };
}
```

### CLS (Cumulative Layout Shift)

Target: < 0.1

```typescript
// 1. Always set dimensions on images and videos
<Image width={300} height={200} ... /> // Next.js Image handles this
<video width={640} height={360} ... />

// 2. Reserve space for async content
function AdBanner() {
  return (
    <div className="h-[250px] w-[300px]"> {/* Fixed dimensions */}
      <Suspense fallback={<div className="h-full w-full bg-muted animate-pulse" />}>
        <AdContent />
      </Suspense>
    </div>
  );
}

// 3. Avoid inserting content above existing content
// BAD: toast appears at top, pushes content down
// GOOD: toast appears at bottom or in fixed position
<Toaster position="bottom-right" />

// 4. Use min-height for dynamic sections
function ForumPosts() {
  return (
    <div className="min-h-[400px]"> {/* Prevents collapse during loading */}
      <Suspense fallback={<PostsSkeleton />}>
        <PostsList />
      </Suspense>
    </div>
  );
}

// 5. Font loading strategy
// The 'swap' display prevents invisible text (FOIT)
const inter = Inter({ display: 'swap', subsets: ['latin'] });
```

### Measuring Core Web Vitals

```typescript
// src/lib/web-vitals.ts
import { onCLS, onFID, onLCP, onINP, onTTFB, type Metric } from 'web-vitals';

function sendToAnalytics(metric: Metric) {
  // Send to your analytics endpoint
  fetch('/api/analytics/vitals', {
    method: 'POST',
    body: JSON.stringify({
      name: metric.name,
      value: metric.value,
      rating: metric.rating, // 'good', 'needs-improvement', 'poor'
      id: metric.id,
      navigationType: metric.navigationType,
    }),
    // Use keepalive to ensure the request completes even on page unload
    keepalive: true,
  });
}

export function reportWebVitals() {
  onCLS(sendToAnalytics);
  onFID(sendToAnalytics);
  onLCP(sendToAnalytics);
  onINP(sendToAnalytics);
  onTTFB(sendToAnalytics);
}

// src/app/layout.tsx
import { reportWebVitals } from '@/lib/web-vitals';

// Report in production only
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  reportWebVitals();
}
```

---

## React DevTools Profiler

### Using the Profiler

```typescript
// Wrap components you want to profile
import { Profiler, type ProfilerOnRenderCallback } from 'react';

const onRender: ProfilerOnRenderCallback = (
  id,           // "AgentList"
  phase,        // "mount" | "update" | "nested-update"
  actualDuration, // Time spent rendering this Profiler and descendants
  baseDuration,   // Time for a complete re-render without memoization
  startTime,      // When React started this render
  commitTime      // When React committed this render
) => {
  if (actualDuration > 16) { // Longer than one frame (60fps)
    console.warn(`Slow render: ${id} took ${actualDuration.toFixed(2)}ms`);
  }

  // In development, send to performance tracking
  if (process.env.NODE_ENV === 'development') {
    performance.mark(`react-render-${id}-${phase}`);
  }
};

function App() {
  return (
    <Profiler id="AgentList" onRender={onRender}>
      <AgentList />
    </Profiler>
  );
}
```

### Performance Debugging Patterns

```typescript
// Track why a component re-rendered
function useWhyDidYouRender<T extends Record<string, unknown>>(
  componentName: string,
  props: T
) {
  const previousProps = useRef<T>();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: unknown; to: unknown }> = {};

      allKeys.forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log(`[WhyRender] ${componentName}:`, changedProps);
      }
    }

    previousProps.current = props;
  });
}

// Usage in development
function AgentCard(props: AgentCardProps) {
  if (process.env.NODE_ENV === 'development') {
    useWhyDidYouRender('AgentCard', props);
  }

  return <div>...</div>;
}
```

---

## Bundle Size Monitoring

### Size Limit Configuration

```json
// package.json
{
  "size-limit": [
    {
      "path": ".next/static/chunks/**/*.js",
      "limit": "250 KB",
      "gzip": true
    },
    {
      "path": ".next/static/chunks/pages/chat*.js",
      "limit": "100 KB",
      "name": "Chat page JS"
    },
    {
      "path": ".next/static/chunks/pages/agents*.js",
      "limit": "80 KB",
      "name": "Agents page JS"
    }
  ]
}
```

### Import Cost Awareness

```typescript
// BAD: Importing entire lodash (72KB gzipped)
import _ from 'lodash';
_.debounce(fn, 300);

// GOOD: Import specific function (1KB gzipped)
import debounce from 'lodash/debounce';
debounce(fn, 300);

// BEST: Use native JS or tiny alternative
// Debounce is simple enough to write yourself (see hooks above)

// BAD: date-fns full import (36KB)
import { format } from 'date-fns';

// GOOD: Specific import path
import format from 'date-fns/format';

// BEST: Use Intl API when possible
new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(date);

// BAD: moment.js (72KB + locales)
import moment from 'moment';

// GOOD: dayjs (2KB) or native Intl
import dayjs from 'dayjs';
```

---

## Tree Shaking and Dead Code Elimination

### Writing Tree-Shakeable Code

```typescript
// BAD: Default export prevents tree shaking of individual functions
// utils.ts
export default {
  formatDate: (d: Date) => { ... },
  formatCurrency: (n: number) => { ... },
  formatNumber: (n: number) => { ... },
};

// GOOD: Named exports are tree-shakeable
// utils.ts
export function formatDate(d: Date): string { ... }
export function formatCurrency(n: number): string { ... }
export function formatNumber(n: number): string { ... }

// BAD: Barrel file that re-exports everything
// components/index.ts
export * from './button';
export * from './input';
export * from './dialog';
export * from './select';
export * from './chart';    // 50KB chart library pulled in everywhere

// GOOD: Import directly from the file you need
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Chart imported only where needed

// Checking if tree shaking works:
// next.config.ts
module.exports = {
  experimental: {
    optimizePackageImports: [
      'lucide-react',     // Icon library — only include used icons
      '@radix-ui/react-icons',
      'date-fns',
    ],
  },
};
```

### Side Effect Free Modules

```json
// package.json — mark your code as side-effect free
{
  "sideEffects": [
    "*.css",
    "*.global.ts"
  ]
}
```

---

## Real Optimization Examples

### Chat App Performance

```typescript
// Problem: Chat re-renders all messages when new ones arrive
// Solution: Memoize individual messages + virtual scrolling

// BEFORE (slow with 100+ messages):
function ChatMessages({ messages }: { messages: Message[] }) {
  return (
    <div className="overflow-y-auto h-full">
      {messages.map((msg) => (
        <div key={msg.id} className="p-4">
          <MarkdownRenderer content={msg.content} /> {/* Heavy */}
        </div>
      ))}
    </div>
  );
}

// AFTER (smooth with 10,000+ messages):
const MemoizedMessage = memo(function MemoizedMessage({
  message,
}: {
  message: Message;
}) {
  return (
    <div className="p-4" data-role={message.role}>
      <MarkdownRenderer content={message.content} />
    </div>
  );
}, (prev, next) => prev.message.id === next.message.id);

function ChatMessages({ messages }: { messages: Message[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => Math.max(60, Math.ceil(messages[i].content.length / 80) * 24 + 40),
    overscan: 10,
    getItemKey: (i) => messages[i].id,
  });

  return (
    <div ref={parentRef} className="overflow-y-auto h-full">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
        {virtualizer.getVirtualItems().map((item) => (
          <div
            key={item.key}
            ref={virtualizer.measureElement}
            data-index={item.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${item.start}px)`,
            }}
          >
            <MemoizedMessage message={messages[item.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Agent Grid Optimization

```typescript
// Problem: 38 agent cards re-render when search input changes
// Solution: Separate state, memo cards, debounce search

function OptimizedAgentGrid({ agents }: { agents: Agent[] }) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 200);

  // Only recompute when debounced search changes (not on every keystroke)
  const filtered = useMemo(() => {
    if (!debouncedSearch) return agents;
    const lower = debouncedSearch.toLowerCase();
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(lower) ||
        a.description.toLowerCase().includes(lower)
    );
  }, [agents, debouncedSearch]);

  // Stable callback for memo'd children
  const handleSelect = useCallback((id: string) => {
    router.push(`/agents/${id}`);
  }, [router]);

  return (
    <div>
      <SearchInput value={search} onChange={setSearch} />
      <div className="grid grid-cols-4 gap-4 mt-4">
        {filtered.map((agent) => (
          <MemoizedAgentCard
            key={agent.id}
            agent={agent}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}

const MemoizedAgentCard = memo(function AgentCard({
  agent,
  onSelect,
}: {
  agent: Agent;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      onClick={() => onSelect(agent.id)}
      className="rounded-lg border p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <Image
        src={agent.avatarUrl}
        alt={agent.name}
        width={48}
        height={48}
        className="rounded-full"
      />
      <h3 className="mt-2 font-semibold">{agent.name}</h3>
      <p className="text-sm text-muted-foreground line-clamp-2">
        {agent.description}
      </p>
    </div>
  );
});
```

### Settings Page — Preventing Unnecessary Re-renders

```typescript
// Problem: changing one setting re-renders the entire form
// Solution: split into isolated sections with their own state

function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Each section manages its own state independently */}
      <Suspense fallback={<SettingsSkeleton />}>
        <ProfileSection />
      </Suspense>
      <Suspense fallback={<SettingsSkeleton />}>
        <NotificationSection />
      </Suspense>
      <Suspense fallback={<SettingsSkeleton />}>
        <AppearanceSection />
      </Suspense>
      <Suspense fallback={<SettingsSkeleton />}>
        <PrivacySection />
      </Suspense>
    </div>
  );
}

// Each section is an independent client component with its own data
function NotificationSection() {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  // Toggling a notification checkbox only re-renders THIS section
  const handleToggle = (key: keyof NotificationSettings) => {
    if (!settings) return;
    updateSettings.mutate({
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key],
      },
    });
  };

  return (
    <section className="rounded-lg border p-6">
      <h2 className="text-lg font-semibold">Notifications</h2>
      <div className="mt-4 space-y-3">
        <Toggle
          label="Email notifications"
          checked={settings?.notifications.email ?? false}
          onChange={() => handleToggle('email')}
        />
        <Toggle
          label="Push notifications"
          checked={settings?.notifications.push ?? false}
          onChange={() => handleToggle('push')}
        />
        <Toggle
          label="Marketing emails"
          checked={settings?.notifications.marketing ?? false}
          onChange={() => handleToggle('marketing')}
        />
      </div>
    </section>
  );
}
```

---

## Performance Checklist

| Category | Check | Impact |
|---|---|---|
| Images | Use next/image with proper sizes/priority | LCP |
| Fonts | preload + display: swap | LCP, CLS |
| JS | Dynamic imports for below-fold components | FCP, TTI |
| CSS | Tailwind purge in production | FCP |
| Data | Server Components for initial data | TTFB, LCP |
| Lists | Virtual scrolling for 100+ items | INP |
| Input | Debounce search/filter (200-300ms) | INP |
| Memoization | React.memo for list items in updating parents | INP |
| Animations | CSS transitions over JS animations | INP, CLS |
| Bundle | Tree-shake imports, analyze regularly | FCP, TTI |
| Caching | staleTime > 0 in React Query | Network |
| Workers | Offload markdown/search to Web Workers | INP |
| Prefetching | Prefetch on hover for likely navigations | Navigation |

---

*This seed covers the full performance optimization surface for Stone AI's React frontend. The key principle: measure before optimizing, optimize the bottleneck (not everything), and remember that the fastest code is the code that does not run.*
