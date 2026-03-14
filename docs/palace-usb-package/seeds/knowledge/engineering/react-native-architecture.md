# React Native Architecture — Best AI Mobile

## Seed Classification
- **Domain**: Mobile Engineering
- **Application**: Best AI Mobile (Business #2)
- **Stack**: React Native + Expo, TypeScript, React Navigation v7
- **Audience**: Senior Frontend Engineer, Senior Backend Engineer (Mobile)

---

## 1. Expo vs Bare Workflow Decision

### Expo Managed Workflow

Best AI Mobile uses **Expo SDK 52+** with the managed workflow as the default path. The reasoning:

**Why Expo Managed**:
- EAS Build handles native compilation without local Xcode/Android Studio for most tasks
- OTA updates via `expo-updates` for instant JS-layer patches (critical for AI chat bug fixes)
- Expo Modules API provides access to native capabilities without ejecting
- Expo Router (file-based routing) aligns with Next.js mental model from Stone AI web
- Config plugins handle native configuration declaratively
- Prebuild system generates native projects when needed without permanent ejection

**When to Use Bare Workflow**:
- Custom native modules not covered by Expo Modules API
- Deep integration with third-party SDKs requiring native linking (rare with modern Expo)
- Performance-critical native code (e.g., custom audio processing for voice input)
- If a specific library absolutely requires manual native configuration

**Decision Framework**:
```
Does the feature need custom native code?
├── No → Expo Managed (default)
├── Yes, but Expo Module API covers it → Expo Managed + Config Plugin
├── Yes, needs light native access → Expo Managed + Expo Modules API (custom native module)
└── Yes, deep native integration required → Consider bare workflow for that module only
```

### Expo SDK Configuration

```json
// app.json
{
  "expo": {
    "name": "Best AI",
    "slug": "best-ai",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "scheme": "bestai",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0A0A0B"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "net.stone-ai.bestai",
      "buildNumber": "1",
      "infoPlist": {
        "NSMicrophoneUsageDescription": "Best AI uses your microphone for voice input to AI agents.",
        "NSFaceIDUsageDescription": "Best AI uses Face ID for secure authentication.",
        "UIBackgroundModes": ["fetch", "remote-notification"]
      }
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#0A0A0B"
      },
      "package": "net.stoneai.bestai",
      "versionCode": 1,
      "permissions": [
        "INTERNET",
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "USE_BIOMETRIC",
        "USE_FINGERPRINT"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-secure-store",
      "expo-local-authentication",
      "expo-notifications",
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 34,
            "targetSdkVersion": 34,
            "buildToolsVersion": "34.0.0",
            "kotlinVersion": "1.9.0",
            "enableProguardInReleaseBuilds": true,
            "enableShrinkResourcesInReleaseBuilds": true
          },
          "ios": {
            "deploymentTarget": "15.0",
            "flipper": false
          }
        }
      ],
      [
        "expo-splash-screen",
        {
          "backgroundColor": "#0A0A0B",
          "image": "./assets/splash-icon.png",
          "imageWidth": 200
        }
      ]
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

---

## 2. Project Structure

### Directory Layout

```
best-ai-mobile/
├── app/                          # Expo Router file-based routing
│   ├── (auth)/                   # Auth group (unauthenticated)
│   │   ├── _layout.tsx           # Auth layout (no tab bar)
│   │   ├── sign-in.tsx           # Sign in screen
│   │   ├── sign-up.tsx           # Sign up screen
│   │   └── onboarding/
│   │       ├── _layout.tsx       # Onboarding stack
│   │       ├── welcome.tsx       # Welcome screen
│   │       ├── select-plan.tsx   # Plan selection
│   │       └── setup-bestie.tsx  # Bestie configuration
│   ├── (tabs)/                   # Main tab group (authenticated)
│   │   ├── _layout.tsx           # Tab bar layout
│   │   ├── index.tsx             # Home / Dashboard
│   │   ├── chat/
│   │   │   ├── _layout.tsx       # Chat stack navigator
│   │   │   ├── index.tsx         # Chat list
│   │   │   └── [agentId].tsx     # Individual chat screen
│   │   ├── agents/
│   │   │   ├── _layout.tsx       # Agents stack
│   │   │   ├── index.tsx         # Agent directory
│   │   │   └── [agentId].tsx     # Agent detail
│   │   ├── bestie/
│   │   │   ├── _layout.tsx       # Bestie stack
│   │   │   ├── index.tsx         # Bestie home
│   │   │   └── customize.tsx     # Bestie customization
│   │   └── settings/
│   │       ├── _layout.tsx       # Settings stack
│   │       ├── index.tsx         # Settings home
│   │       ├── profile.tsx       # Profile editing
│   │       ├── subscription.tsx  # Subscription management
│   │       ├── security.tsx      # Security settings
│   │       └── language.tsx      # Language selection
│   ├── _layout.tsx               # Root layout
│   ├── +not-found.tsx            # 404 screen
│   └── +html.tsx                 # Custom HTML (web only)
├── src/
│   ├── components/               # Shared components
│   │   ├── ui/                   # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── BottomSheet.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   └── index.ts
│   │   ├── chat/                 # Chat-specific components
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── MessageList.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── TypingIndicator.tsx
│   │   │   ├── VoiceInput.tsx
│   │   │   ├── StreamingText.tsx
│   │   │   └── AgentHeader.tsx
│   │   ├── agents/               # Agent components
│   │   │   ├── AgentCard.tsx
│   │   │   ├── AgentGrid.tsx
│   │   │   ├── TierBadge.tsx
│   │   │   └── AgentAvatar.tsx
│   │   ├── bestie/               # Bestie components
│   │   │   ├── BestieAvatar.tsx
│   │   │   ├── TraitSelector.tsx
│   │   │   ├── StyleToggle.tsx
│   │   │   └── PathPicker.tsx
│   │   ├── common/               # Cross-cutting components
│   │   │   ├── ErrorBoundary.tsx
│   │   │   ├── LoadingScreen.tsx
│   │   │   ├── RefreshControl.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── PlatformView.tsx
│   │   └── layout/               # Layout components
│   │       ├── SafeArea.tsx
│   │       ├── KeyboardAvoid.tsx
│   │       └── StatusBarConfig.tsx
│   ├── hooks/                    # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useChat.ts
│   │   ├── useAgent.ts
│   │   ├── useBestie.ts
│   │   ├── useSubscription.ts
│   │   ├── useOfflineSync.ts
│   │   ├── useKeyboard.ts
│   │   ├── usePushNotifications.ts
│   │   ├── useBiometrics.ts
│   │   ├── useAppState.ts
│   │   └── useNetworkStatus.ts
│   ├── stores/                   # Zustand stores
│   │   ├── authStore.ts
│   │   ├── chatStore.ts
│   │   ├── agentStore.ts
│   │   ├── settingsStore.ts
│   │   ├── offlineStore.ts
│   │   └── notificationStore.ts
│   ├── services/                 # API and business logic
│   │   ├── api/
│   │   │   ├── client.ts         # Axios/fetch client with auth
│   │   │   ├── agents.ts         # Agent API calls
│   │   │   ├── chat.ts           # Chat API calls
│   │   │   ├── auth.ts           # Auth API calls
│   │   │   ├── bestie.ts         # Bestie API calls
│   │   │   ├── subscription.ts   # Subscription API calls
│   │   │   └── websocket.ts      # WebSocket manager
│   │   ├── offline/
│   │   │   ├── database.ts       # SQLite setup
│   │   │   ├── syncEngine.ts     # Sync coordinator
│   │   │   └── conflictResolver.ts
│   │   ├── notifications/
│   │   │   ├── handler.ts        # Notification handling
│   │   │   └── registration.ts   # Push registration
│   │   ├── security/
│   │   │   ├── keychain.ts       # Secure storage
│   │   │   ├── biometrics.ts     # Biometric auth
│   │   │   └── pinning.ts        # Certificate pinning
│   │   └── analytics/
│   │       ├── tracker.ts        # Event tracking
│   │       └── crashReporting.ts # Sentry setup
│   ├── utils/                    # Utility functions
│   │   ├── formatting.ts
│   │   ├── validation.ts
│   │   ├── platform.ts
│   │   ├── dates.ts
│   │   ├── colors.ts
│   │   └── constants.ts
│   ├── theme/                    # Theme system
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   ├── spacing.ts
│   │   ├── shadows.ts
│   │   ├── darkTheme.ts
│   │   ├── lightTheme.ts
│   │   └── index.ts
│   ├── i18n/                     # Internationalization
│   │   ├── config.ts
│   │   ├── en.ts
│   │   ├── es.ts
│   │   ├── fr.ts
│   │   ├── de.ts
│   │   ├── ja.ts
│   │   └── ko.ts
│   └── types/                    # TypeScript types
│       ├── agent.ts
│       ├── chat.ts
│       ├── user.ts
│       ├── bestie.ts
│       ├── subscription.ts
│       ├── navigation.ts
│       └── api.ts
├── assets/                       # Static assets
│   ├── fonts/
│   ├── images/
│   ├── animations/               # Lottie animations
│   └── sounds/                   # Notification sounds
├── __tests__/                    # Test files
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── e2e/
├── scripts/                      # Build/deploy scripts
│   ├── generate-icons.sh
│   └── bump-version.ts
├── app.json                      # Expo config
├── eas.json                      # EAS Build config
├── tsconfig.json
├── babel.config.js
├── metro.config.js
├── .env.local
├── .env.production
└── package.json
```

### Key Architectural Decisions

**File-Based Routing with Expo Router**:
Expo Router provides file-based routing similar to Next.js, which means the `app/` directory structure directly maps to navigation paths. This gives Stone AI developers a consistent mental model across web and mobile.

**Feature-Based Component Organization**:
Components are organized by feature domain (chat, agents, bestie) rather than by type (buttons, cards). This keeps related code together and makes it clear which components belong to which feature.

**Service Layer Separation**:
The `services/` directory contains all external communication logic. API calls, WebSocket management, offline sync, and analytics are all encapsulated here. Screens and components never make raw network calls — they go through services.

---

## 3. React Navigation v7 Setup

### Navigation Architecture

```typescript
// app/_layout.tsx — Root Layout
import { Stack } from 'expo-router';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { ThemeProvider } from '@/src/theme';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { queryClient } from '@/src/services/api/client';
import { tokenCache } from '@/src/services/security/keychain';
import { useOfflineSync } from '@/src/hooks/useOfflineSync';
import { useNotificationHandler } from '@/src/hooks/usePushNotifications';
import { SplashScreen } from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Inter-Regular': require('@/assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('@/assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('@/assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('@/assets/fonts/Inter-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
    >
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <ThemeProvider>
            <BottomSheetModalProvider>
              <AppNavigator />
            </BottomSheetModalProvider>
          </ThemeProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function AppNavigator() {
  const { isSignedIn, isLoaded } = useAuth();

  // Initialize background services
  useOfflineSync();
  useNotificationHandler();

  if (!isLoaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {isSignedIn ? (
        <Stack.Screen name="(tabs)" />
      ) : (
        <Stack.Screen name="(auth)" />
      )}
      <Stack.Screen
        name="+not-found"
        options={{ presentation: 'modal' }}
      />
    </Stack>
  );
}
```

### Tab Navigation Layout

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { useTheme } from '@/src/theme';
import { Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import {
  HomeIcon,
  ChatIcon,
  AgentsIcon,
  BestieIcon,
  SettingsIcon,
} from '@/src/components/ui/Icons';

export default function TabLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: Platform.select({
            ios: 'transparent',
            android: theme.colors.surface,
          }),
          borderTopColor: theme.colors.border,
          borderTopWidth: 0.5,
          height: Platform.select({ ios: 88, android: 64 }),
          paddingBottom: Platform.select({ ios: 28, android: 8 }),
          paddingTop: 8,
          elevation: 0,
        },
        tabBarBackground: Platform.OS === 'ios'
          ? () => (
              <BlurView
                intensity={80}
                tint={theme.isDark ? 'dark' : 'light'}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />
            )
          : undefined,
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 10,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <HomeIcon color={color} size={24} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <ChatIcon color={color} size={24} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="agents"
        options={{
          title: 'Agents',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <AgentsIcon color={color} size={24} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="bestie"
        options={{
          title: 'Bestie',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <BestieIcon color={color} size={24} />
            </AnimatedTabIcon>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon focused={focused}>
              <SettingsIcon color={color} size={24} />
            </AnimatedTabIcon>
          ),
        }}
      />
    </Tabs>
  );
}

function AnimatedTabIcon({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: withSpring(focused ? 1.15 : 1, {
          damping: 15,
          stiffness: 200,
        }),
      },
    ],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}
```

### Chat Stack Navigation

```typescript
// app/(tabs)/chat/_layout.tsx
import { Stack } from 'expo-router';
import { useTheme } from '@/src/theme';

export default function ChatLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.background,
        },
        headerTintColor: theme.colors.text,
        headerTitleStyle: {
          fontFamily: 'Inter-SemiBold',
          fontSize: 17,
        },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
        animation: 'slide_from_right',
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Chats',
          headerLargeTitle: true,
          headerSearchBarOptions: {
            placeholder: 'Search conversations...',
            onChangeText: (event) => {
              // Search logic
            },
          },
        }}
      />
      <Stack.Screen
        name="[agentId]"
        options={{
          headerTitle: '',
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}
```

### Deep Link Configuration

```typescript
// Deep linking scheme configuration
// app.json: "scheme": "bestai"
// Supports: bestai://chat/agent-42, bestai://agents, etc.

// Universal links configuration (iOS)
// apple-app-site-association hosted at stone-ai.net/.well-known/
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.net.stone-ai.bestai",
        "paths": [
          "/mobile/*",
          "/chat/*",
          "/agents/*",
          "/invite/*"
        ]
      }
    ]
  }
}

// Android App Links (assetlinks.json)
// Hosted at stone-ai.net/.well-known/assetlinks.json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "net.stoneai.bestai",
      "sha256_cert_fingerprints": ["SHA256_FINGERPRINT_HERE"]
    }
  }
]
```

---

## 4. Screen Patterns

### Standard Screen Template

```typescript
// Consistent screen pattern used throughout the app
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/theme';
import { StatusBar } from 'expo-status-bar';

interface ScreenProps {
  children: React.ReactNode;
  scrollable?: boolean;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  statusBarStyle?: 'light' | 'dark' | 'auto';
}

export function Screen({
  children,
  scrollable = false,
  edges = ['top', 'left', 'right'],
  statusBarStyle = 'auto',
}: ScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView
      edges={edges}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar style={statusBarStyle} />
      {scrollable ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={styles.content}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
```

### Data-Fetching Screen Pattern

```typescript
// Pattern for screens that fetch data from the API
import { useQuery } from '@tanstack/react-query';
import { Screen } from '@/src/components/layout/Screen';
import { ErrorBoundary } from '@/src/components/common/ErrorBoundary';
import { LoadingScreen } from '@/src/components/common/LoadingScreen';
import { EmptyState } from '@/src/components/common/EmptyState';
import { RefreshControl } from '@/src/components/common/RefreshControl';

export default function AgentDirectoryScreen() {
  const {
    data: agents,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentService.getAgents(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorBoundary error={error} retry={refetch} />;
  if (!agents?.length) return <EmptyState type="agents" />;

  return (
    <Screen>
      <FlatList
        data={agents}
        renderItem={({ item }) => <AgentCard agent={item} />}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        contentContainerStyle={{ padding: 16 }}
      />
    </Screen>
  );
}
```

### Modal Screen Pattern

```typescript
// Pattern for modal presentations (settings, pickers, confirmations)
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { BottomSheetModal, BottomSheetBackdrop } from '@gorhom/bottom-sheet';

// For iOS: use native modal presentation
// For Android: use bottom sheet for a more native feel
export function useAdaptiveModal() {
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const present = useCallback((route: string) => {
    if (Platform.OS === 'ios') {
      router.push({
        pathname: route,
        params: { presentation: 'modal' },
      });
    } else {
      bottomSheetRef.current?.present();
    }
  }, [router]);

  return { present, bottomSheetRef };
}
```

---

## 5. TypeScript Configuration

### TypeScript Setup

```json
// tsconfig.json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "paths": {
      "@/*": ["./*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/services/*": ["./src/services/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/theme/*": ["./src/theme/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/utils/*"],
      "@/i18n/*": ["./src/i18n/*"]
    },
    "plugins": [
      {
        "name": "expo-router/typescript"
      }
    ]
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    ".expo/types/**/*.ts",
    "expo-env.d.ts"
  ],
  "exclude": [
    "node_modules",
    "babel.config.js",
    "metro.config.js",
    "jest.config.js"
  ]
}
```

### Shared Types with Stone AI Web

```typescript
// src/types/shared.ts
// Types shared between Stone AI web and Best AI mobile
// These are maintained in a shared package or manually synced

export interface Agent {
  id: string;
  name: string;
  agentNumber: number;
  description: string;
  category: AgentCategory;
  tier: AgentTier;
  avatar: string;
  systemPrompt: string;
  capabilities: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AgentTier = 'FREE' | 'STARTER' | 'PLUS' | 'SMART' | 'PRO';
export type AgentCategory =
  | 'productivity'
  | 'creative'
  | 'technical'
  | 'business'
  | 'personal'
  | 'education';

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agentId: string;
  metadata?: MessageMetadata;
  createdAt: string;
}

export interface MessageMetadata {
  model?: string;
  tokens?: {
    prompt: number;
    completion: number;
  };
  latency?: number;
  offline?: boolean;
  synced?: boolean;
}

export interface Conversation {
  id: string;
  userId: string;
  agentId: string;
  title: string;
  lastMessage?: string;
  lastMessageAt: string;
  messageCount: number;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  clerkId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  tier: SubscriptionTier;
  language: SupportedLanguage;
  bestieId?: string;
  preferences: UserPreferences;
  createdAt: string;
}

export type SubscriptionTier = 'FREE' | 'STARTER' | 'PLUS' | 'SMART' | 'PRO';
export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'ja' | 'ko';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  hapticFeedback: boolean;
  notificationsEnabled: boolean;
  quietHoursStart?: string; // HH:mm
  quietHoursEnd?: string;
  biometricLock: boolean;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
}

export interface Bestie {
  id: string;
  userId: string;
  name: string;
  communicationStyle: 'casual' | 'professional';
  path: 'supportive' | 'challenger' | 'mentor' | 'companion';
  traits: string[]; // Up to 18 traits
  language: SupportedLanguage;
  avatar: BestieAvatar;
  createdAt: string;
  updatedAt: string;
}

export interface BestieAvatar {
  style: string;
  primaryColor: string;
  secondaryColor: string;
  expression: string;
}

export interface Subscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  platform: 'stripe' | 'apple' | 'google';
  externalId: string; // Stripe sub ID or App Store transaction ID
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  isAnnual: boolean;
}
```

### Platform-Specific Type Helpers

```typescript
// src/types/platform.ts
import { Platform } from 'react-native';

export type PlatformSpecific<IOS, Android> = typeof Platform.OS extends 'ios'
  ? IOS
  : Android;

// Utility for platform-specific values
export function platformSelect<T>(options: { ios: T; android: T; default?: T }): T {
  return Platform.select(options) ?? options.default ?? options.ios;
}

// Navigation types with Expo Router typed routes
export type AppRoutes =
  | '/(auth)/sign-in'
  | '/(auth)/sign-up'
  | '/(auth)/onboarding/welcome'
  | '/(auth)/onboarding/select-plan'
  | '/(auth)/onboarding/setup-bestie'
  | '/(tabs)/'
  | '/(tabs)/chat/'
  | `/(tabs)/chat/${string}`
  | '/(tabs)/agents/'
  | `/(tabs)/agents/${string}`
  | '/(tabs)/bestie/'
  | '/(tabs)/bestie/customize'
  | '/(tabs)/settings/'
  | '/(tabs)/settings/profile'
  | '/(tabs)/settings/subscription'
  | '/(tabs)/settings/security'
  | '/(tabs)/settings/language';
```

---

## 6. Metro Configuration

```javascript
// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable CSS support for web
config.resolver.sourceExts.push('css');

// SVG transformer for icons
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

config.resolver.assetExts = config.resolver.assetExts.filter(
  (ext) => ext !== 'svg'
);
config.resolver.sourceExts.push('svg');

// Tree shaking for production
config.transformer.minifierConfig = {
  compress: {
    drop_console: true,
    drop_debugger: true,
  },
};

module.exports = config;
```

---

## 7. Environment Configuration

```typescript
// src/utils/env.ts
// Type-safe environment variable access
import Constants from 'expo-constants';

interface AppConfig {
  apiUrl: string;
  wsUrl: string;
  clerkPublishableKey: string;
  sentryDsn: string;
  environment: 'development' | 'staging' | 'production';
  enableOfflineMode: boolean;
  enableAnalytics: boolean;
}

function getConfig(): AppConfig {
  const env = Constants.expoConfig?.extra?.environment ?? 'development';

  const configs: Record<string, AppConfig> = {
    development: {
      apiUrl: 'http://localhost:3000/api',
      wsUrl: 'ws://localhost:3000',
      clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!,
      sentryDsn: '',
      environment: 'development',
      enableOfflineMode: true,
      enableAnalytics: false,
    },
    staging: {
      apiUrl: 'https://staging.stone-ai.net/api',
      wsUrl: 'wss://staging.stone-ai.net',
      clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!,
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN!,
      environment: 'staging',
      enableOfflineMode: true,
      enableAnalytics: true,
    },
    production: {
      apiUrl: 'https://stone-ai.net/api',
      wsUrl: 'wss://stone-ai.net',
      clerkPublishableKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!,
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN!,
      environment: 'production',
      enableOfflineMode: true,
      enableAnalytics: true,
    },
  };

  return configs[env] ?? configs.development;
}

export const appConfig = getConfig();
```

---

## 8. Babel Configuration

```javascript
// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated must be last
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './',
            '@/components': './src/components',
            '@/hooks': './src/hooks',
            '@/services': './src/services',
            '@/stores': './src/stores',
            '@/theme': './src/theme',
            '@/types': './src/types',
            '@/utils': './src/utils',
            '@/i18n': './src/i18n',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
```

---

## 9. Stone AI Web ↔ Best AI Mobile Shared Architecture

### Shared Backend

Best AI Mobile connects to the **same Stone AI backend** (stone-ai.net). The API layer is shared:

```
Stone AI Web (Next.js)     Best AI Mobile (React Native)
        │                            │
        └────────┬───────────────────┘
                 │
         Stone AI API (/api/*)
                 │
         ┌───────┴───────┐
         │   Prisma ORM   │
         │    + Neon DB    │
         └───────┬───────┘
                 │
         PostgreSQL + pgvector
```

**Key architectural principle**: The mobile app is a **new client** to the existing backend, not a separate system. Agent definitions, subscription tiers, user profiles, and chat history are all shared.

### Mobile-Specific API Endpoints

Some endpoints are mobile-specific:

```
POST /api/mobile/device-token     — Register push notification token
POST /api/mobile/sync             — Bulk sync offline changes
GET  /api/mobile/sync/status      — Check sync status
POST /api/mobile/receipt/validate — Validate App Store/Play Store receipt
GET  /api/mobile/config           — Mobile-specific feature flags
POST /api/mobile/crash-report     — Crash report ingestion
```

### Shared Type Package Strategy

For launch, types are manually synced between web and mobile. Post-launch:

```
stone-ai-shared/
├── types/
│   ├── agent.ts
│   ├── chat.ts
│   ├── user.ts
│   └── subscription.ts
├── validators/
│   ├── agent.ts      # Zod schemas
│   └── chat.ts
└── constants/
    ├── tiers.ts
    └── agents.ts
```

This shared package would be published to a private npm registry and consumed by both projects.

---

## 10. Dependency Overview

### Core Dependencies

```json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "expo-status-bar": "~2.0.0",
    "expo-splash-screen": "~0.29.0",
    "expo-secure-store": "~14.0.0",
    "expo-local-authentication": "~15.0.0",
    "expo-notifications": "~0.29.0",
    "expo-updates": "~0.26.0",
    "expo-haptics": "~14.0.0",
    "expo-image": "~2.0.0",
    "expo-font": "~13.0.0",
    "expo-constants": "~17.0.0",
    "expo-device": "~7.0.0",
    "expo-crypto": "~14.0.0",

    "react": "18.3.1",
    "react-native": "0.76.0",
    "react-native-reanimated": "~3.16.0",
    "react-native-gesture-handler": "~2.20.0",
    "react-native-safe-area-context": "~4.12.0",
    "react-native-screens": "~4.1.0",
    "react-native-svg": "~15.8.0",

    "@clerk/clerk-expo": "^2.0.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^5.0.0",
    "react-native-mmkv": "^3.0.0",
    "axios": "^1.7.0",

    "@gorhom/bottom-sheet": "^5.0.0",
    "react-native-toast-message": "^2.0.0",
    "lottie-react-native": "^7.0.0",

    "@sentry/react-native": "^6.0.0",
    "react-native-purchases": "^8.0.0",

    "i18next": "^24.0.0",
    "react-i18next": "^15.0.0"
  },
  "devDependencies": {
    "@types/react": "~18.3.0",
    "typescript": "~5.6.0",
    "jest": "^29.0.0",
    "jest-expo": "~52.0.0",
    "@testing-library/react-native": "^12.0.0",
    "detox": "^20.0.0",
    "eslint": "^9.0.0",
    "prettier": "^3.0.0",
    "react-native-svg-transformer": "^1.0.0"
  }
}
```

This architecture gives Best AI Mobile a solid foundation that mirrors Stone AI's web patterns while being optimized for native mobile experiences. The shared backend means no data duplication, and the Expo managed workflow keeps development velocity high.
