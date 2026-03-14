# Mobile Navigation Patterns — Best AI Mobile

## Seed Classification
- **Domain**: Mobile Engineering
- **Application**: Best AI Mobile (Business #2)
- **Stack**: Expo Router v4, React Navigation v7
- **Audience**: Senior Frontend Engineer

---

## 1. Navigation Architecture

### Overview

Best AI Mobile uses **Expo Router** (built on React Navigation v7) with file-based routing. The navigation structure mirrors common mobile patterns: tab bar for primary navigation, stacks for drilling into content, and modals for transient actions.

```
Root Stack
├── (auth)                    ← Unauthenticated group
│   ├── sign-in               ← Stack screen
│   ├── sign-up               ← Stack screen
│   └── onboarding/           ← Nested stack
│       ├── welcome
│       ├── select-plan
│       └── setup-bestie
├── (tabs)                    ← Authenticated tab group
│   ├── index (Home)          ← Tab 1
│   ├── chat/                 ← Tab 2 (Stack)
│   │   ├── index (list)
│   │   └── [agentId] (chat)
│   ├── agents/               ← Tab 3 (Stack)
│   │   ├── index (directory)
│   │   └── [agentId] (detail)
│   ├── bestie/               ← Tab 4 (Stack)
│   │   ├── index
│   │   └── customize
│   └── settings/             ← Tab 5 (Stack)
│       ├── index
│       ├── profile
│       ├── subscription
│       ├── security
│       └── language
└── +not-found                ← 404 modal
```

---

## 2. Tab Navigation

### Tab Configuration

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useTheme } from '@/src/theme';
import { chatStore } from '@/src/stores/chatStore';

export default function TabLayout() {
  const theme = useTheme();
  const totalUnread = chatStore((s) =>
    Object.values(s.unreadCounts).reduce((sum, c) => sum + c, 0)
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          height: Platform.select({ ios: 88, android: 64 }),
          paddingBottom: Platform.select({ ios: 28, android: 8 }),
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home' }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.colors.error,
            fontSize: 10,
          },
        }}
      />
      <Tabs.Screen name="agents" options={{ title: 'Agents' }} />
      <Tabs.Screen name="bestie" options={{ title: 'Bestie' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
```

---

## 3. Stack Navigation

### Shared Stack Configuration

```typescript
// src/utils/navigationConfig.ts
import { Platform } from 'react-native';
import { NativeStackNavigationOptions } from '@react-navigation/native-stack';

export function getDefaultStackOptions(theme: any): NativeStackNavigationOptions {
  return {
    headerStyle: { backgroundColor: theme.colors.background },
    headerTintColor: theme.colors.text,
    headerTitleStyle: { fontFamily: 'Inter-SemiBold', fontSize: 17 },
    headerShadowVisible: false,
    headerBackTitleVisible: false,
    contentStyle: { backgroundColor: theme.colors.background },
    animation: Platform.select({
      ios: 'default',          // iOS native push animation
      android: 'slide_from_right', // Slide on Android
    }),
    gestureEnabled: true,
    fullScreenGestureEnabled: true, // iOS: swipe from anywhere to go back
  };
}
```

---

## 4. Deep Linking

### Configuration

```typescript
// Expo Router handles deep linking automatically based on file structure
// Custom scheme: bestai://
// Universal links: stone-ai.net/mobile/

// Supported deep links:
// bestai://chat/agent-7          → /(tabs)/chat/agent-7
// bestai://agents                → /(tabs)/agents/
// bestai://agents/agent-42       → /(tabs)/agents/agent-42
// bestai://bestie                → /(tabs)/bestie/
// bestai://settings/subscription → /(tabs)/settings/subscription
// bestai://invite/REF_CODE       → Referral handling

// app.json linking config
{
  "expo": {
    "scheme": "bestai",
    "web": {
      "bundler": "metro"
    }
  }
}
```

### Universal Links Setup

```typescript
// Universal links require server-side configuration

// iOS: apple-app-site-association (hosted at stone-ai.net/.well-known/)
// Android: assetlinks.json (hosted at stone-ai.net/.well-known/)

// Handle universal links in the app
// app/_layout.tsx
import { useEffect } from 'react';
import { Linking } from 'react-native';
import { router } from 'expo-router';

export function useUniversalLinks() {
  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      const parsed = new URL(url);

      // Map web URLs to app routes
      if (parsed.hostname === 'stone-ai.net') {
        const path = parsed.pathname;

        if (path.startsWith('/mobile/chat/')) {
          const agentId = path.replace('/mobile/chat/', '');
          router.push(`/(tabs)/chat/${agentId}`);
        } else if (path.startsWith('/mobile/agents/')) {
          const agentId = path.replace('/mobile/agents/', '');
          router.push(`/(tabs)/agents/${agentId}`);
        } else if (path.startsWith('/invite/')) {
          const code = path.replace('/invite/', '');
          handleReferral(code);
        }
      }
    };

    const sub = Linking.addEventListener('url', handleUrl);
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl({ url });
    });

    return () => sub.remove();
  }, []);
}
```

---

## 5. Drawer Navigation (Optional)

```typescript
// If Best AI Mobile adds a drawer for quick access to recent chats:
// app/(tabs)/_layout.tsx with Drawer

import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Drawer wrapping tabs
export default function DrawerLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        screenOptions={{
          drawerType: 'front',
          drawerStyle: { width: 280 },
          swipeEnabled: true,
          swipeEdgeWidth: 50,
        }}
        drawerContent={(props) => <RecentChatsDrawer {...props} />}
      >
        <Drawer.Screen name="(tabs)" options={{ headerShown: false }} />
      </Drawer>
    </GestureHandlerRootView>
  );
}
```

---

## 6. Navigation State Persistence

### Save and Restore Navigation State

```typescript
// src/hooks/useNavigationPersistence.ts
import { useEffect, useRef } from 'react';
import { useNavigationState } from 'expo-router';
import { storage } from '@/src/utils/storage';

const NAV_STATE_KEY = 'navigation_state';

// Save navigation state so users return to where they left off
export function useNavigationPersistence() {
  const state = useNavigationState();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Don't save on first render (it's the restored state)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Debounced save
    const timer = setTimeout(() => {
      if (state) {
        storage.set(NAV_STATE_KEY, state);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [state]);
}

export function getPersistedNavigationState(): any {
  return storage.get(NAV_STATE_KEY);
}

export function clearPersistedNavigationState(): void {
  storage.remove(NAV_STATE_KEY);
}
```

---

## 7. Modal Patterns

```typescript
// Modals in Expo Router

// 1. Full-screen modal (new screen)
// app/modal.tsx
export default function ModalScreen() {
  return <View>...</View>;
}

// Present it:
router.push('/modal');

// In layout, configure as modal:
<Stack.Screen
  name="modal"
  options={{
    presentation: 'modal',
    animation: 'slide_from_bottom',
  }}
/>

// 2. Bottom sheet modal (partial overlay)
// Using @gorhom/bottom-sheet
import BottomSheet, { BottomSheetBackdrop } from '@gorhom/bottom-sheet';

function AgentPickerSheet() {
  const snapPoints = useMemo(() => ['50%', '90%'], []);

  return (
    <BottomSheet
      snapPoints={snapPoints}
      backdropComponent={(props) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} />
      )}
      enablePanDownToClose
    >
      <AgentList />
    </BottomSheet>
  );
}

// 3. Alert/confirmation (native feel)
import { Alert, Platform } from 'react-native';

function confirmDelete(onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm('Delete this conversation?')) onConfirm();
    return;
  }

  Alert.alert(
    'Delete Conversation',
    'This action cannot be undone.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onConfirm },
    ]
  );
}
```

---

## 8. Navigation Transitions

```typescript
// Custom transitions for different navigation contexts

// Slide from right (default for push)
<Stack.Screen options={{ animation: 'slide_from_right' }} />

// Slide from bottom (for modals)
<Stack.Screen options={{ animation: 'slide_from_bottom' }} />

// Fade (for tab switches or modal dismiss)
<Stack.Screen options={{ animation: 'fade' }} />

// iOS-style card with gesture
<Stack.Screen
  options={{
    animation: 'default',
    gestureEnabled: true,
    gestureDirection: 'horizontal',
    fullScreenGestureEnabled: true,
  }}
/>

// Custom transition with Reanimated
import { SharedTransition, withSpring } from 'react-native-reanimated';

const customTransition = SharedTransition.custom((values) => {
  'worklet';
  return {
    height: withSpring(values.targetHeight),
    width: withSpring(values.targetWidth),
    originX: withSpring(values.targetOriginX),
    originY: withSpring(values.targetOriginY),
  };
});
```

---

## 9. Navigation Guards

```typescript
// Protect routes based on subscription tier
// src/hooks/useRouteGuard.ts
import { useEffect } from 'react';
import { router, usePathname } from 'expo-router';
import { useSubscription } from './useSubscription';

// Routes that require specific tiers
const TIER_ROUTES: Record<string, string[]> = {
  STARTER: [],
  PLUS: ['/(tabs)/agents/premium-agent'],
  SMART: [],
  PRO: [],
};

export function useRouteGuard() {
  const pathname = usePathname();
  const { tier } = useSubscription();

  useEffect(() => {
    // Check if current route requires a higher tier
    const requiredTier = Object.entries(TIER_ROUTES).find(([_, routes]) =>
      routes.some((route) => pathname.startsWith(route))
    );

    if (requiredTier) {
      const tierOrder = ['FREE', 'STARTER', 'PLUS', 'SMART', 'PRO'];
      const userTierIndex = tierOrder.indexOf(tier);
      const requiredTierIndex = tierOrder.indexOf(requiredTier[0]);

      if (userTierIndex < requiredTierIndex) {
        router.replace('/(tabs)/settings/subscription');
      }
    }
  }, [pathname, tier]);
}
```

---

## 10. Navigation Analytics

```typescript
// Track screen views for analytics
// src/hooks/useNavigationTracking.ts
import { usePathname, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { analytics } from '@/src/services/analytics/tracker';

export function useNavigationTracking() {
  const pathname = usePathname();
  const segments = useSegments();
  const previousPath = useRef<string>('');

  useEffect(() => {
    if (pathname !== previousPath.current) {
      analytics.trackScreenView({
        screenName: getScreenName(pathname, segments),
        path: pathname,
        previousScreen: previousPath.current,
      });
      previousPath.current = pathname;
    }
  }, [pathname, segments]);
}

function getScreenName(pathname: string, segments: string[]): string {
  // Map paths to friendly names
  const nameMap: Record<string, string> = {
    '/': 'Home',
    '/chat': 'Chat List',
    '/agents': 'Agent Directory',
    '/bestie': 'Bestie Home',
    '/settings': 'Settings',
    '/settings/profile': 'Profile',
    '/settings/subscription': 'Subscription',
  };

  // Dynamic routes
  if (pathname.match(/\/chat\/.+/)) return 'Chat Screen';
  if (pathname.match(/\/agents\/.+/)) return 'Agent Detail';

  return nameMap[pathname] ?? pathname;
}
```

This navigation architecture gives Best AI Mobile native-feeling navigation with proper deep linking, gesture support, state persistence, and analytics tracking — all built on the proven Expo Router / React Navigation stack.
