# Mobile Performance Optimization — Best AI Mobile

## Seed Classification
- **Domain**: Mobile Engineering
- **Application**: Best AI Mobile (Business #2)
- **Stack**: React Native, Hermes, Reanimated, expo-image
- **Audience**: Senior Frontend Engineer

---

## 1. Performance Budget

### Target Metrics

| Metric | Target | Critical Threshold |
|--------|--------|--------------------|
| App startup (cold) | <2s | <3s |
| App startup (warm) | <500ms | <1s |
| TTI (Time to Interactive) | <2.5s | <4s |
| FPS during scroll | 60fps | >50fps |
| JS bundle size | <5MB | <8MB |
| Memory usage (idle) | <100MB | <150MB |
| Memory usage (chat) | <200MB | <300MB |
| API response rendering | <100ms | <300ms |

---

## 2. Hermes Engine

### Why Hermes

Hermes is the default JS engine for React Native. For Best AI Mobile, it provides:

- **Bytecode precompilation**: JS is compiled to bytecode at build time, not at runtime
- **Faster startup**: No JIT compilation needed on device launch
- **Lower memory**: Optimized garbage collector for mobile constraints
- **Smaller binary**: Hermes is smaller than JavaScriptCore

### Configuration

```json
// app.json — Hermes is enabled by default in Expo SDK 52+
{
  "expo": {
    "jsEngine": "hermes"
  }
}
```

### Hermes-Specific Optimizations

```typescript
// Hermes supports ES6+ but some patterns are faster than others

// FAST: Array methods that Hermes optimizes well
const filtered = items.filter((item) => item.active);
const mapped = items.map((item) => item.name);

// SLOWER on Hermes: Spread in hot paths
// Avoid in render loops:
const newObj = { ...obj, key: value }; // Creates new object each time

// FASTER: Direct mutation when safe (e.g., in reducers)
obj.key = value;

// FAST: for-of loops (Hermes optimizes these)
for (const item of items) {
  process(item);
}

// Watch out: Hermes doesn't support all Intl APIs
// Use polyfills selectively
import '@formatjs/intl-getcanonicallocales/polyfill';
import '@formatjs/intl-locale/polyfill';
import '@formatjs/intl-pluralrules/polyfill';
import '@formatjs/intl-numberformat/polyfill';
import '@formatjs/intl-datetimeformat/polyfill';
```

---

## 3. FlatList Optimization

### Optimized Message List

```typescript
// src/components/chat/OptimizedMessageList.tsx
import { useCallback, useMemo, memo } from 'react';
import { FlatList, ViewToken, Platform } from 'react-native';
import type { ChatMessage } from '@/src/types/shared';

// Memoized message item to prevent unnecessary re-renders
const MemoizedMessageBubble = memo(MessageBubble, (prev, next) => {
  return (
    prev.message.id === next.message.id &&
    prev.message.content === next.message.content &&
    prev.message.metadata?.synced === next.message.metadata?.synced
  );
});

export function OptimizedMessageList({ messages }: { messages: ChatMessage[] }) {
  // Stable key extractor
  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  // Memoized render function
  const renderItem = useCallback(
    ({ item, index }: { item: ChatMessage; index: number }) => (
      <MemoizedMessageBubble
        message={item}
        isConsecutive={index > 0 && messages[index - 1]?.role === item.role}
      />
    ),
    [messages]
  );

  // Estimated item size for faster initial render
  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: 80, // Average message height estimate
      offset: 80 * index,
      index,
    }),
    []
  );

  return (
    <FlatList
      data={messages}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      // Performance props
      removeClippedSubviews={Platform.OS === 'android'}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      windowSize={11} // Render 5 screens above + current + 5 below
      initialNumToRender={15}
      // Prevent layout thrashing
      contentContainerStyle={{ paddingHorizontal: 12 }}
      // Avoid re-creating scroll handler
      scrollEventThrottle={16}
      // Keep mounted items when scrolling
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
      }}
    />
  );
}
```

### FlatList Anti-Patterns to Avoid

```typescript
// BAD: Anonymous functions in renderItem (creates new ref every render)
<FlatList renderItem={({ item }) => <Item data={item} />} />

// GOOD: useCallback + memo
const renderItem = useCallback(({ item }) => <MemoItem data={item} />, []);
<FlatList renderItem={renderItem} />

// BAD: Inline styles (creates new object every render)
<FlatList contentContainerStyle={{ padding: 16 }} />

// GOOD: StyleSheet or useMemo
const styles = StyleSheet.create({ content: { padding: 16 } });
<FlatList contentContainerStyle={styles.content} />

// BAD: Complex computations inside renderItem
const renderItem = ({ item }) => {
  const processed = heavyComputation(item); // Runs on every render
  return <Item data={processed} />;
};

// GOOD: Pre-compute or memoize
const processedData = useMemo(() => data.map(heavyComputation), [data]);
```

---

## 4. Image Caching

### Using expo-image for Optimal Performance

```typescript
// src/components/ui/CachedImage.tsx
import { Image, ImageProps } from 'expo-image';
import { StyleSheet } from 'react-native';

// expo-image uses native caching (NSURLCache on iOS, OkHttp on Android)
// Much faster than react-native's Image component

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  fallback?: string;
}

export function CachedImage({ uri, fallback, style, ...props }: CachedImageProps) {
  return (
    <Image
      source={{ uri }}
      placeholder={fallback ? { uri: fallback } : undefined}
      contentFit="cover"
      transition={200}
      cachePolicy="memory-disk" // Cache in memory AND disk
      recyclingKey={uri} // Helps with list recycling
      style={style}
      {...props}
    />
  );
}

// Agent avatar with caching and placeholder
export function AgentAvatarImage({
  uri,
  size = 40,
}: {
  uri: string;
  size?: number;
}) {
  return (
    <Image
      source={{ uri }}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
      }}
      contentFit="cover"
      cachePolicy="memory-disk"
      placeholder={require('@/assets/images/agent-placeholder.png')}
      placeholderContentFit="cover"
      transition={150}
    />
  );
}

// Prefetch images for upcoming screens
export async function prefetchImages(urls: string[]): Promise<void> {
  await Promise.all(
    urls.map((url) => Image.prefetch(url))
  );
}

// Clear image cache (settings screen)
export async function clearImageCache(): Promise<void> {
  await Image.clearDiskCache();
  await Image.clearMemoryCache();
}
```

---

## 5. Memory Management

### Memory Monitoring

```typescript
// src/utils/memoryMonitor.ts
import { Platform, NativeModules } from 'react-native';
import { useEffect, useRef } from 'react';

// Monitor memory usage in development
export function useMemoryMonitor(label: string) {
  const previousMemory = useRef(0);

  useEffect(() => {
    if (__DEV__) {
      const interval = setInterval(() => {
        if (Platform.OS === 'android') {
          // Android: use performance API
          const used = (performance as any).memory?.usedJSHeapSize ?? 0;
          const delta = used - previousMemory.current;
          if (Math.abs(delta) > 1024 * 1024) { // Log if >1MB change
            console.log(
              `[Memory ${label}] ${(used / 1024 / 1024).toFixed(1)}MB (${delta > 0 ? '+' : ''}${(delta / 1024 / 1024).toFixed(1)}MB)`
            );
          }
          previousMemory.current = used;
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [label]);
}

// Cleanup patterns for memory leaks
export function useCleanup(cleanup: () => void) {
  useEffect(() => {
    return cleanup;
  }, []);
}
```

### Preventing Memory Leaks

```typescript
// Common memory leak patterns and fixes

// LEAK: Event listeners not cleaned up
useEffect(() => {
  const sub = EventEmitter.addListener('event', handler);
  return () => sub.remove(); // Always clean up
}, []);

// LEAK: Timers not cleared
useEffect(() => {
  const timer = setInterval(tick, 1000);
  return () => clearInterval(timer);
}, []);

// LEAK: Abort controllers not used for fetch
const fetchData = async (signal: AbortSignal) => {
  const response = await fetch(url, { signal });
  return response.json();
};

// LEAK: Large data held in state after unmount
// Use refs for data that doesn't need to trigger re-renders
const dataRef = useRef<LargeData | null>(null);

// Memory-efficient image handling
// Don't load full-res images in lists — use thumbnails
const thumbnailUri = `${imageUri}?w=200&q=75`;
```

---

## 6. Startup Time Optimization

### Splash Screen Strategy

```typescript
// app/_layout.tsx — Optimized startup
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

// Prevent splash from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Parallel initialization — don't serialize what can run concurrently
        await Promise.all([
          loadFonts(),
          initializeDatabase(),
          warmAuthCache(),
          prefetchCriticalData(),
        ]);
      } catch (error) {
        console.error('Startup error:', error);
      } finally {
        setAppReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (appReady) {
      // Hide splash after a brief delay for smooth transition
      SplashScreen.hideAsync();
    }
  }, [appReady]);

  if (!appReady) return null;
  return <AppContent />;
}

// Warm the auth cache so first authenticated request is instant
async function warmAuthCache() {
  const token = await keychain.getAuthToken();
  if (token) {
    tokenManager.setCachedToken(token);
  }
}

// Prefetch data needed on the home screen
async function prefetchCriticalData() {
  // Only fetch if we have a cached token
  const token = await keychain.getAuthToken();
  if (!token) return;

  try {
    await Promise.all([
      queryClient.prefetchQuery({ queryKey: ['agents'], queryFn: fetchAgents }),
      queryClient.prefetchQuery({ queryKey: ['conversations'], queryFn: fetchConversations }),
    ]);
  } catch {
    // Non-critical — app works without prefetched data
  }
}
```

### Lazy Loading Non-Critical Screens

```typescript
// Defer loading of settings, onboarding, and other non-initial screens
import { lazy, Suspense } from 'react';

// These screens are code-split and loaded on demand
const SettingsScreen = lazy(() => import('./settings'));
const OnboardingScreen = lazy(() => import('./onboarding'));

// Expo Router handles this automatically with file-based routing,
// but for manual optimization:
export function LazyScreen({ component: Component, ...props }: any) {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Component {...props} />
    </Suspense>
  );
}
```

---

## 7. Bundle Splitting

### Metro Bundle Analysis

```bash
# Analyze bundle size
npx react-native-bundle-visualizer

# Or with expo
npx expo export --platform ios --dump-sourcemap
npx source-map-explorer bundle.js
```

### Reducing Bundle Size

```typescript
// 1. Tree-shake imports — never import entire libraries
// BAD:
import _ from 'lodash';
_.debounce(fn, 300);

// GOOD:
import debounce from 'lodash/debounce';
debounce(fn, 300);

// 2. Use platform-specific extensions
// components/Button.ios.tsx  — iOS-specific implementation
// components/Button.android.tsx — Android-specific implementation
// Metro automatically picks the right file

// 3. Dynamic imports for heavy features
const loadMarkdownRenderer = async () => {
  const { default: Markdown } = await import('react-native-markdown-display');
  return Markdown;
};

// 4. Asset optimization
// Use WebP instead of PNG for images (30-50% smaller)
// Compress Lottie animations
// Strip unused icon glyphs from font files
```

### babel.config.js Optimizations

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Remove console.log in production
      ['transform-remove-console', { exclude: ['error', 'warn'] }],
      // Module resolver for cleaner imports
      ['module-resolver', { root: ['./'], alias: { '@': './' } }],
      // Reanimated MUST be last
      'react-native-reanimated/plugin',
    ],
  };
};
```

---

## 8. Network Performance

### Request Optimization

```typescript
// src/services/api/client.ts — Performance-optimized API client
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { appConfig } from '@/src/utils/env';
import { tokenManager } from '@/src/services/auth/tokenManager';

function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: appConfig.apiUrl,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
      'Accept-Encoding': 'gzip', // Compress responses
      'X-Client': 'best-ai-mobile',
    },
  });

  // Auth header injection
  client.interceptors.request.use(async (config) => {
    const token = await tokenManager.getValidToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Response caching headers
  client.interceptors.response.use((response) => {
    // ETag / Last-Modified for conditional requests
    const etag = response.headers['etag'];
    if (etag) {
      cacheETag(response.config.url!, etag);
    }
    return response;
  });

  return client;
}

export const apiClient = createApiClient();

// Request deduplication — prevent duplicate in-flight requests
const pendingRequests = new Map<string, Promise<any>>();

export async function deduplicatedGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const key = `${url}${JSON.stringify(config?.params ?? {})}`;

  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }

  const promise = apiClient.get<T>(url, config).then((r) => r.data);
  pendingRequests.set(key, promise);

  try {
    return await promise;
  } finally {
    pendingRequests.delete(key);
  }
}
```

---

## 9. Animation Performance

### Reanimated Best Practices

```typescript
// Run animations on the UI thread — never on JS thread

// GOOD: worklet-based animation (runs on UI thread)
const animatedStyle = useAnimatedStyle(() => {
  'worklet';
  return {
    opacity: withTiming(isVisible.value ? 1 : 0),
    transform: [{ translateY: withSpring(offset.value) }],
  };
});

// BAD: State-driven animation (causes JS thread render)
const [opacity, setOpacity] = useState(1);
// This triggers a full re-render!
<View style={{ opacity }} />

// Use interpolation instead of conditionals in worklets
const backgroundColor = interpolateColor(
  progress.value,
  [0, 1],
  ['#000000', '#FFFFFF']
);

// Avoid calling runOnJS in hot animation paths
// If you must communicate with JS, batch updates
const onScrollEnd = useCallback(() => {
  'worklet';
  // Only call JS thread when animation completes
  runOnJS(handleScrollEnd)();
}, []);
```

---

## 10. Profiling and Monitoring

### Development Profiling

```typescript
// Enable Hermes profiler for CPU profiling
// In dev menu: "Start/Stop Profiling"
// Or programmatically:

if (__DEV__) {
  // React DevTools Profiler
  // Wrap components with <Profiler> to measure render times
  <Profiler id="MessageList" onRender={onRenderCallback}>
    <MessageList messages={messages} />
  </Profiler>
}

function onRenderCallback(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number,
) {
  if (actualDuration > 16) { // Longer than 1 frame
    console.warn(`[Perf] ${id} ${phase}: ${actualDuration.toFixed(1)}ms`);
  }
}

// Flipper integration for detailed profiling
// Enabled by default in development builds
```

### Production Performance Monitoring

```typescript
// src/services/analytics/performanceMonitor.ts
import * as Sentry from '@sentry/react-native';

export function initPerformanceMonitoring(): void {
  Sentry.init({
    dsn: appConfig.sentryDsn,
    tracesSampleRate: 0.2, // 20% of transactions
    profilesSampleRate: 0.1, // 10% of transactions get CPU profiles
    enableAutoPerformanceTracing: true,
    enableNativeFramesTracking: true,
  });
}

// Custom performance spans
export function measureAsync<T>(
  name: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const transaction = Sentry.startTransaction({ name, op: operation });
  const span = transaction.startChild({ op: 'function', description: name });

  return fn().finally(() => {
    span.finish();
    transaction.finish();
  });
}

// Track screen load times
export function useScreenPerformance(screenName: string) {
  useEffect(() => {
    const transaction = Sentry.startTransaction({
      name: screenName,
      op: 'navigation',
    });

    return () => {
      transaction.finish();
    };
  }, [screenName]);
}
```

### Performance Checklist

1. **FlatList**: Use `memo`, `keyExtractor`, `getItemLayout`, `windowSize`
2. **Images**: Use `expo-image` with `cachePolicy="memory-disk"`, prefetch critical images
3. **Animations**: All on UI thread via Reanimated worklets
4. **Re-renders**: Profile with React DevTools, eliminate unnecessary renders
5. **Bundle**: Analyze with bundle visualizer, tree-shake imports, lazy load screens
6. **Network**: Deduplicate requests, use ETags, compress payloads
7. **Startup**: Parallel initialization, prefetch critical data, warm caches
8. **Memory**: Clean up listeners/timers, use refs for non-UI data, monitor leaks
9. **Hermes**: Ensure Hermes is enabled, use Hermes-friendly patterns
10. **Monitoring**: Sentry performance traces in production, Flipper in development

This performance optimization strategy ensures Best AI Mobile runs at 60fps on mid-range devices while keeping startup time under 2 seconds and memory usage under control.
