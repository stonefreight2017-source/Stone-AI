# Mobile Push Notifications — Best AI Mobile

## Seed Classification
- **Domain**: Mobile Engineering
- **Application**: Best AI Mobile (Business #2)
- **Stack**: Expo Notifications, FCM, APNs
- **Audience**: Senior Frontend Engineer, Senior Backend Engineer (Mobile)

---

## 1. Push Notification Architecture

### Overview

Best AI Mobile uses **Expo Notifications** as the abstraction layer over FCM (Android) and APNs (iOS). The server-side notification dispatch runs on the Stone AI backend.

```
┌──────────────────┐     ┌──────────────────┐
│   Stone AI API   │────▶│  Expo Push API   │
│  (Notification   │     │  (push.expo.dev)  │
│   Service)       │     └────────┬─────────┘
└──────────────────┘              │
                           ┌──────┴──────┐
                           │             │
                    ┌──────┴──┐   ┌──────┴──┐
                    │   APNs  │   │   FCM   │
                    │  (iOS)  │   │(Android) │
                    └────┬────┘   └────┬────┘
                         │             │
                    ┌────┴────┐   ┌────┴────┐
                    │  iPhone │   │ Android │
                    │  Device │   │ Device  │
                    └─────────┘   └─────────┘
```

### Notification Types

| Type | Priority | Description | Deep Link |
|------|----------|-------------|-----------|
| `agent_response` | High | Agent replied to your message | `bestai://chat/{agentId}` |
| `bestie_checkin` | Default | Bestie daily check-in | `bestai://bestie` |
| `subscription_update` | High | Plan change, payment issue | `bestai://settings/subscription` |
| `new_agent` | Default | New agent available for your tier | `bestai://agents/{agentId}` |
| `system_alert` | High | Service update, maintenance | N/A |
| `promo` | Low | Promotional offer | `bestai://settings/subscription` |
| `referral_reward` | Default | Referral bonus credited | `bestai://settings` |
| `forum_reply` | Default | Someone replied to your forum post | `bestai://forum/{postId}` |

---

## 2. Client-Side Setup

### Permission Request and Token Registration

```typescript
// src/services/notifications/registration.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiClient } from '../api/client';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;

    // Suppress in-app display if user is on the same chat screen
    const currentScreen = navigationRef.current?.getCurrentRoute()?.name;
    const chatAgentId = (currentScreen === '[agentId]')
      ? navigationRef.current?.getCurrentRoute()?.params?.agentId
      : null;

    if (data.type === 'agent_response' && data.agentId === chatAgentId) {
      return {
        shouldShowAlert: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    }

    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    };
  },
});

export async function registerForPushNotifications(): Promise<string | null> {
  // Must be a physical device
  if (!Device.isDevice) {
    console.warn('Push notifications require a physical device');
    return null;
  }

  // Check existing permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  // Request permission if not granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Push notification permission not granted');
    return null;
  }

  // Get Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: Constants.expoConfig?.extra?.eas?.projectId,
  });

  const token = tokenData.data;

  // Android: Create notification channels
  if (Platform.OS === 'android') {
    await createAndroidChannels();
  }

  // Register token with server
  await registerTokenWithServer(token);

  return token;
}

async function registerTokenWithServer(token: string): Promise<void> {
  try {
    await apiClient.post('/api/mobile/device-token', {
      token,
      platform: Platform.OS,
      deviceName: Device.deviceName,
      osVersion: Device.osVersion,
    });
  } catch (error) {
    console.error('Failed to register push token:', error);
    // Queue for retry via sync engine
  }
}

async function createAndroidChannels(): Promise<void> {
  // Agent responses — high priority, custom sound
  await Notifications.setNotificationChannelAsync('agent-responses', {
    name: 'Agent Responses',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#6366F1',
    sound: 'agent_response.wav',
    description: 'Notifications when an AI agent responds to your message',
  });

  // Bestie check-ins
  await Notifications.setNotificationChannelAsync('bestie', {
    name: 'Bestie',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#EC4899',
    description: 'Daily check-ins and messages from your Bestie',
  });

  // Subscription & billing
  await Notifications.setNotificationChannelAsync('billing', {
    name: 'Subscription & Billing',
    importance: Notifications.AndroidImportance.HIGH,
    description: 'Important subscription and payment notifications',
  });

  // System alerts
  await Notifications.setNotificationChannelAsync('system', {
    name: 'System Alerts',
    importance: Notifications.AndroidImportance.HIGH,
    description: 'Service updates and maintenance notifications',
  });

  // Promotions
  await Notifications.setNotificationChannelAsync('promotions', {
    name: 'Promotions & Offers',
    importance: Notifications.AndroidImportance.LOW,
    description: 'Special offers and promotions',
  });
}
```

### Notification Handler

```typescript
// src/services/notifications/handler.ts
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { chatStore } from '@/src/stores/chatStore';
import { notificationStore } from '@/src/stores/notificationStore';
import { Platform, AppState } from 'react-native';

type NotificationType =
  | 'agent_response'
  | 'bestie_checkin'
  | 'subscription_update'
  | 'new_agent'
  | 'system_alert'
  | 'promo'
  | 'referral_reward'
  | 'forum_reply';

interface NotificationData {
  type: NotificationType;
  agentId?: string;
  conversationId?: string;
  postId?: string;
  deepLink?: string;
  [key: string]: any;
}

export class NotificationHandler {
  private responseListener: Notifications.Subscription | null = null;
  private receivedListener: Notifications.Subscription | null = null;

  start(): void {
    // Handle notification received while app is foregrounded
    this.receivedListener = Notifications.addNotificationReceivedListener(
      this.handleForegroundNotification
    );

    // Handle user tapping on a notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      this.handleNotificationTap
    );

    // Check if app was opened from a notification
    this.checkInitialNotification();
  }

  stop(): void {
    this.responseListener?.remove();
    this.receivedListener?.remove();
  }

  private handleForegroundNotification = (
    notification: Notifications.Notification
  ): void => {
    const data = notification.request.content.data as NotificationData;

    // Store in in-app notification center
    notificationStore.getState().addNotification({
      id: notification.request.identifier,
      type: data.type,
      title: notification.request.content.title ?? '',
      body: notification.request.content.body ?? '',
      data,
      timestamp: new Date().toISOString(),
      read: false,
    });

    // Type-specific foreground handling
    switch (data.type) {
      case 'agent_response':
        // Update chat store with new message indicator
        if (data.conversationId) {
          chatStore.getState().markNewMessage(data.conversationId);
        }
        break;

      case 'bestie_checkin':
        // Show in-app toast for bestie
        showInAppToast({
          title: notification.request.content.title ?? 'Bestie',
          message: notification.request.content.body ?? '',
          icon: 'bestie',
        });
        break;

      case 'subscription_update':
        // Refresh subscription status
        // queryClient.invalidateQueries(['subscription']);
        break;
    }
  };

  private handleNotificationTap = (
    response: Notifications.NotificationResponse
  ): void => {
    const data = response.notification.request.content.data as NotificationData;

    // Mark as read
    notificationStore
      .getState()
      .markRead(response.notification.request.identifier);

    // Navigate based on notification type
    this.navigateToContent(data);
  };

  private async checkInitialNotification(): Promise<void> {
    // Handle cold start from notification
    const response = await Notifications.getLastNotificationResponseAsync();
    if (response) {
      const data = response.notification.request.content.data as NotificationData;
      // Delay navigation to ensure the app is fully loaded
      setTimeout(() => this.navigateToContent(data), 500);
    }
  }

  private navigateToContent(data: NotificationData): void {
    switch (data.type) {
      case 'agent_response':
        if (data.agentId) {
          router.push(`/(tabs)/chat/${data.agentId}`);
        }
        break;

      case 'bestie_checkin':
        router.push('/(tabs)/bestie/');
        break;

      case 'subscription_update':
        router.push('/(tabs)/settings/subscription');
        break;

      case 'new_agent':
        if (data.agentId) {
          router.push(`/(tabs)/agents/${data.agentId}`);
        }
        break;

      case 'forum_reply':
        if (data.postId && data.deepLink) {
          router.push(data.deepLink as any);
        }
        break;

      case 'referral_reward':
        router.push('/(tabs)/settings/');
        break;

      default:
        // Default: open app to home
        router.push('/(tabs)/');
        break;
    }
  }
}

export const notificationHandler = new NotificationHandler();

// In-app toast helper
function showInAppToast(options: {
  title: string;
  message: string;
  icon: string;
}): void {
  // Using react-native-toast-message or custom toast component
  const Toast = require('react-native-toast-message').default;
  Toast.show({
    type: 'bestie',
    text1: options.title,
    text2: options.message,
    position: 'top',
    visibilityTime: 4000,
    topOffset: 60,
  });
}
```

---

## 3. Deep Linking from Notifications

### URL Scheme Configuration

```typescript
// Deep link handling for Best AI Mobile
// Supports both custom scheme (bestai://) and universal links (stone-ai.net/mobile/)

// app/_layout.tsx — Deep link handling in root layout
import { useEffect } from 'react';
import { Linking } from 'react-native';
import { router, useRootNavigationState } from 'expo-router';

export function useDeepLinkHandler() {
  const navigationState = useRootNavigationState();

  useEffect(() => {
    if (!navigationState?.key) return;

    // Handle deep links when app is already running
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Handle deep link that launched the app
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => subscription.remove();
  }, [navigationState?.key]);
}

function handleDeepLink(url: string): void {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname || parsed.hostname + parsed.pathname;

    // Route mapping
    const routes: Record<string, string> = {
      '/chat': '/(tabs)/chat/',
      '/agents': '/(tabs)/agents/',
      '/bestie': '/(tabs)/bestie/',
      '/settings': '/(tabs)/settings/',
      '/settings/subscription': '/(tabs)/settings/subscription',
    };

    // Dynamic routes
    const chatMatch = path.match(/\/chat\/(.+)/);
    if (chatMatch) {
      router.push(`/(tabs)/chat/${chatMatch[1]}`);
      return;
    }

    const agentMatch = path.match(/\/agents\/(.+)/);
    if (agentMatch) {
      router.push(`/(tabs)/agents/${agentMatch[1]}`);
      return;
    }

    // Static routes
    const route = routes[path];
    if (route) {
      router.push(route as any);
    }
  } catch (error) {
    console.error('Failed to handle deep link:', error);
  }
}
```

### Notification Payload with Deep Links

```typescript
// Server-side notification payload construction
// src/lib/notifications/sendPush.ts (Stone AI backend)

import { Expo, ExpoPushMessage } from 'expo-server-sdk';

const expo = new Expo();

interface NotificationPayload {
  userId: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any>;
  badge?: number;
  sound?: string;
  channelId?: string;
  priority?: 'default' | 'normal' | 'high';
  categoryId?: string;
}

export async function sendPushNotification(
  payload: NotificationPayload
): Promise<void> {
  // Get user's push tokens from database
  const tokens = await prisma.deviceToken.findMany({
    where: { userId: payload.userId, isActive: true },
    select: { token: true, platform: true },
  });

  if (tokens.length === 0) return;

  const messages: ExpoPushMessage[] = tokens.map((tokenRecord) => ({
    to: tokenRecord.token,
    title: payload.title,
    body: payload.body,
    data: {
      type: payload.type,
      ...payload.data,
    },
    sound: payload.sound ?? 'default',
    badge: payload.badge,
    channelId: payload.channelId ?? getChannelForType(payload.type),
    priority: payload.priority ?? 'default',
    categoryId: payload.categoryId,
  }));

  // Chunk and send
  const chunks = expo.chunkPushNotifications(messages);

  for (const chunk of chunks) {
    try {
      const receipts = await expo.sendPushNotificationsAsync(chunk);

      // Handle receipt errors
      for (const receipt of receipts) {
        if (receipt.status === 'error') {
          console.error('Push notification error:', receipt.message);

          if (receipt.details?.error === 'DeviceNotRegistered') {
            // Token is no longer valid — deactivate it
            await deactivateToken(receipt);
          }
        }
      }
    } catch (error) {
      console.error('Failed to send push notification chunk:', error);
    }
  }
}

function getChannelForType(type: string): string {
  const channelMap: Record<string, string> = {
    agent_response: 'agent-responses',
    bestie_checkin: 'bestie',
    subscription_update: 'billing',
    new_agent: 'agent-responses',
    system_alert: 'system',
    promo: 'promotions',
    referral_reward: 'billing',
    forum_reply: 'agent-responses',
  };
  return channelMap[type] ?? 'system';
}

// Notification trigger examples
export async function notifyAgentResponse(params: {
  userId: string;
  agentName: string;
  agentId: string;
  conversationId: string;
  preview: string;
}): Promise<void> {
  await sendPushNotification({
    userId: params.userId,
    type: 'agent_response',
    title: params.agentName,
    body: params.preview.substring(0, 100),
    data: {
      agentId: params.agentId,
      conversationId: params.conversationId,
      deepLink: `bestai://chat/${params.agentId}`,
    },
    sound: 'agent_response.wav',
    priority: 'high',
    channelId: 'agent-responses',
  });
}

export async function notifyBestieCheckin(params: {
  userId: string;
  bestieName: string;
  message: string;
}): Promise<void> {
  await sendPushNotification({
    userId: params.userId,
    type: 'bestie_checkin',
    title: `${params.bestieName} wants to chat`,
    body: params.message,
    data: {
      deepLink: 'bestai://bestie',
    },
    channelId: 'bestie',
  });
}

export async function notifySubscriptionIssue(params: {
  userId: string;
  issue: 'payment_failed' | 'expiring_soon' | 'downgrade_pending';
}): Promise<void> {
  const messages = {
    payment_failed: {
      title: 'Payment Failed',
      body: 'Your subscription payment could not be processed. Please update your payment method.',
    },
    expiring_soon: {
      title: 'Subscription Expiring',
      body: 'Your subscription expires in 3 days. Renew to keep your agent access.',
    },
    downgrade_pending: {
      title: 'Plan Change Pending',
      body: 'Your plan will change at the end of your billing period.',
    },
  };

  const msg = messages[params.issue];

  await sendPushNotification({
    userId: params.userId,
    type: 'subscription_update',
    title: msg.title,
    body: msg.body,
    data: {
      issue: params.issue,
      deepLink: 'bestai://settings/subscription',
    },
    priority: 'high',
    channelId: 'billing',
  });
}
```

---

## 4. In-App Notification Center

```typescript
// src/stores/notificationStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '@/src/utils/storage';

interface InAppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any>;
  timestamp: string;
  read: boolean;
}

interface NotificationStore {
  notifications: InAppNotification[];
  unreadCount: number;
  addNotification: (notification: InAppNotification) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
  removeNotification: (id: string) => void;
}

export const notificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) => {
        set((state) => {
          const updated = [notification, ...state.notifications].slice(0, 100);
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.read).length,
          };
        });
      },

      markRead: (id) => {
        set((state) => {
          const updated = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          );
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.read).length,
          };
        });
      },

      markAllRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      },

      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      removeNotification: (id) => {
        set((state) => {
          const updated = state.notifications.filter((n) => n.id !== id);
          return {
            notifications: updated,
            unreadCount: updated.filter((n) => !n.read).length,
          };
        });
      },
    }),
    {
      name: 'notification-store',
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => ({
        notifications: state.notifications.slice(0, 50),
        unreadCount: state.unreadCount,
      }),
    }
  )
);
```

```typescript
// src/components/common/NotificationBell.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { notificationStore } from '@/src/stores/notificationStore';
import { useTheme } from '@/src/theme';
import Animated, { useAnimatedStyle, withSpring, withSequence } from 'react-native-reanimated';
import { BellIcon } from '@/src/components/ui/Icons';

export function NotificationBell() {
  const router = useRouter();
  const theme = useTheme();
  const unreadCount = notificationStore((s) => s.unreadCount);

  const bellStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: unreadCount > 0
          ? withSequence(
              withSpring('10deg'),
              withSpring('-10deg'),
              withSpring('0deg')
            )
          : '0deg',
      },
    ],
  }));

  return (
    <Pressable
      onPress={() => router.push('/(tabs)/notifications')}
      hitSlop={8}
    >
      <Animated.View style={bellStyle}>
        <BellIcon color={theme.colors.text} size={24} />
        {unreadCount > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter-Bold',
  },
});
```

---

## 5. Quiet Hours

```typescript
// src/services/notifications/quietHours.ts
import * as Notifications from 'expo-notifications';
import { settingsStore } from '@/src/stores/settingsStore';

export function isInQuietHours(): boolean {
  const { quietHoursStart, quietHoursEnd } = settingsStore.getState().preferences;

  if (!quietHoursStart || !quietHoursEnd) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = quietHoursStart.split(':').map(Number);
  const [endH, endM] = quietHoursEnd.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    // Same day range (e.g., 22:00 to 23:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Overnight range (e.g., 22:00 to 07:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

// Server-side quiet hours check
export async function shouldDeliverNotification(
  userId: string,
  type: string
): Promise<boolean> {
  // Always deliver critical notifications
  const criticalTypes = ['subscription_update', 'system_alert'];
  if (criticalTypes.includes(type)) return true;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { preferences: true },
  });

  const prefs = user?.preferences as any;
  if (!prefs?.quietHoursStart || !prefs?.quietHoursEnd) return true;
  if (!prefs?.notificationsEnabled) return false;

  // Check quiet hours in user's timezone
  // Implementation depends on storing user timezone
  return !isInQuietHoursForUser(
    prefs.quietHoursStart,
    prefs.quietHoursEnd,
    prefs.timezone ?? 'UTC'
  );
}
```

---

## 6. Notification Preferences UI

```typescript
// src/components/settings/NotificationPreferences.tsx
import { View, Switch, Text, StyleSheet } from 'react-native';
import { settingsStore } from '@/src/stores/settingsStore';
import { useTheme } from '@/src/theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useState } from 'react';

interface NotificationSetting {
  key: string;
  label: string;
  description: string;
  channelId: string;
}

const NOTIFICATION_SETTINGS: NotificationSetting[] = [
  {
    key: 'agentResponses',
    label: 'Agent Responses',
    description: 'Get notified when an agent replies to your message',
    channelId: 'agent-responses',
  },
  {
    key: 'bestieCheckins',
    label: 'Bestie Check-ins',
    description: 'Daily messages from your Bestie',
    channelId: 'bestie',
  },
  {
    key: 'billing',
    label: 'Subscription & Billing',
    description: 'Payment reminders and plan changes',
    channelId: 'billing',
  },
  {
    key: 'promotions',
    label: 'Promotions',
    description: 'Special offers and new features',
    channelId: 'promotions',
  },
];

export function NotificationPreferences() {
  const theme = useTheme();
  const preferences = settingsStore((s) => s.preferences);
  const updatePreferences = settingsStore((s) => s.updatePreferences);

  return (
    <View style={styles.container}>
      {/* Master toggle */}
      <View style={[styles.row, { borderBottomColor: theme.colors.border }]}>
        <View>
          <Text style={[styles.label, { color: theme.colors.text }]}>
            Push Notifications
          </Text>
          <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
            Enable or disable all notifications
          </Text>
        </View>
        <Switch
          value={preferences.notificationsEnabled}
          onValueChange={(value) =>
            updatePreferences({ notificationsEnabled: value })
          }
          trackColor={{ true: theme.colors.primary }}
        />
      </View>

      {/* Individual channels */}
      {preferences.notificationsEnabled &&
        NOTIFICATION_SETTINGS.map((setting) => (
          <View
            key={setting.key}
            style={[styles.row, { borderBottomColor: theme.colors.border }]}
          >
            <View style={styles.labelContainer}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                {setting.label}
              </Text>
              <Text
                style={[styles.description, { color: theme.colors.textSecondary }]}
              >
                {setting.description}
              </Text>
            </View>
            <Switch
              value={preferences[setting.key as keyof typeof preferences] as boolean}
              onValueChange={(value) =>
                updatePreferences({ [setting.key]: value })
              }
              trackColor={{ true: theme.colors.primary }}
            />
          </View>
        ))}

      {/* Quiet hours */}
      {preferences.notificationsEnabled && (
        <QuietHoursSection />
      )}
    </View>
  );
}

function QuietHoursSection() {
  const theme = useTheme();
  const preferences = settingsStore((s) => s.preferences);
  const updatePreferences = settingsStore((s) => s.updatePreferences);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
        Quiet Hours
      </Text>
      <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
        Pause non-critical notifications during these hours
      </Text>

      <View style={styles.timeRow}>
        <Text style={{ color: theme.colors.text }}>From</Text>
        <Pressable onPress={() => setShowStartPicker(true)}>
          <Text style={[styles.timeValue, { color: theme.colors.primary }]}>
            {preferences.quietHoursStart ?? '22:00'}
          </Text>
        </Pressable>
        <Text style={{ color: theme.colors.text }}>To</Text>
        <Pressable onPress={() => setShowEndPicker(true)}>
          <Text style={[styles.timeValue, { color: theme.colors.primary }]}>
            {preferences.quietHoursEnd ?? '07:00'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 0.5,
  },
  labelContainer: { flex: 1, marginRight: 16 },
  label: { fontFamily: 'Inter-Medium', fontSize: 16 },
  description: { fontFamily: 'Inter-Regular', fontSize: 13, marginTop: 2 },
  section: { marginTop: 24 },
  sectionTitle: { fontFamily: 'Inter-SemiBold', fontSize: 18, marginBottom: 4 },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  timeValue: { fontFamily: 'Inter-SemiBold', fontSize: 16 },
});
```

---

## 7. Badge Management

```typescript
// src/services/notifications/badgeManager.ts
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export const badgeManager = {
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  },

  async incrementBadge(): Promise<void> {
    const current = await Notifications.getBadgeCountAsync();
    await Notifications.setBadgeCountAsync(current + 1);
  },

  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  },

  async syncBadgeWithUnread(): Promise<void> {
    const { unreadCount } = (await import('@/src/stores/notificationStore')).notificationStore.getState();
    await Notifications.setBadgeCountAsync(unreadCount);
  },
};
```

---

## 8. Testing Push Notifications

```typescript
// scripts/test-push.ts
// Local testing utility for push notifications

import * as Notifications from 'expo-notifications';

export async function sendLocalTestNotification(type: string): Promise<void> {
  const notifications: Record<string, any> = {
    agent_response: {
      title: 'Agent 7 — Pixel',
      body: 'I\'ve finished analyzing your design. Here are my suggestions...',
      data: { type: 'agent_response', agentId: 'agent-7' },
    },
    bestie_checkin: {
      title: 'Luna wants to chat',
      body: 'Hey! How\'s your day going? I noticed you haven\'t checked in today.',
      data: { type: 'bestie_checkin' },
    },
    subscription_update: {
      title: 'Payment Failed',
      body: 'Your subscription payment could not be processed.',
      data: { type: 'subscription_update', issue: 'payment_failed' },
    },
  };

  const notification = notifications[type];
  if (!notification) {
    console.error(`Unknown notification type: ${type}`);
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: notification,
    trigger: { seconds: 2 },
  });
}
```

This notification architecture ensures Best AI Mobile delivers timely, relevant notifications while respecting user preferences, quiet hours, and platform-specific capabilities.
