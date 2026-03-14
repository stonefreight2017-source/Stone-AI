# Mobile Analytics & Tracking — Best AI Mobile

## Seed Classification
- **Domain**: Mobile Engineering
- **Application**: Best AI Mobile (Business #2)
- **Stack**: Sentry, custom analytics, React Native
- **Audience**: Senior Frontend Engineer, Senior Backend Engineer

---

## 1. Analytics Architecture

```
┌────────────────────────────────────────────┐
│          Best AI Mobile App                 │
│  ┌──────────┐  ┌────────────┐  ┌────────┐ │
│  │ Screen   │  │ Event      │  │ Crash  │ │
│  │ Tracking │  │ Tracking   │  │ Report │ │
│  └────┬─────┘  └─────┬──────┘  └───┬────┘ │
│       └───────────────┼─────────────┘      │
│                       │                     │
│              ┌────────┴────────┐            │
│              │ Analytics Queue │            │
│              │ (Batched Send)  │            │
│              └────────┬────────┘            │
└───────────────────────┼────────────────────┘
                        │
              ┌─────────┴──────────┐
              │                    │
        ┌─────┴─────┐      ┌──────┴──────┐
        │  Sentry   │      │ Stone AI    │
        │ (Crashes) │      │ Analytics   │
        │           │      │ Endpoint    │
        └───────────┘      └─────────────┘
```

---

## 2. Event Tracking

### Analytics Service

```typescript
// src/services/analytics/tracker.ts
import { Platform } from 'react-native';
import { appConfig } from '@/src/utils/env';
import { authStore } from '@/src/stores/authStore';
import { mmkv } from '@/src/utils/storage';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: string;
  sessionId: string;
  userId?: string;
  platform: string;
  appVersion: string;
}

interface ScreenViewEvent {
  screenName: string;
  path: string;
  previousScreen?: string;
  duration?: number;
}

class AnalyticsTracker {
  private queue: AnalyticsEvent[] = [];
  private sessionId: string;
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private screenEntryTime: number = 0;
  private currentScreen: string = '';

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  initialize(): void {
    if (!appConfig.enableAnalytics) return;

    // Flush events every 30 seconds
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30000);

    // Track app lifecycle
    this.track('app_open', {
      isFirstOpen: !mmkv.getBoolean('has_opened_before'),
    });
    mmkv.set('has_opened_before', true);
  }

  stop(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush(); // Final flush
  }

  track(name: string, properties?: Record<string, any>): void {
    if (!appConfig.enableAnalytics) return;

    const event: AnalyticsEvent = {
      name,
      properties: {
        ...properties,
        // Stripped of PII
      },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: authStore.getState().userId ?? undefined,
      platform: Platform.OS,
      appVersion: appConfig.environment,
    };

    this.queue.push(event);

    // Auto-flush if queue is large
    if (this.queue.length >= 50) {
      this.flush();
    }
  }

  trackScreenView(event: ScreenViewEvent): void {
    // Calculate time on previous screen
    const now = Date.now();
    if (this.currentScreen && this.screenEntryTime) {
      const duration = now - this.screenEntryTime;
      this.track('screen_exit', {
        screenName: this.currentScreen,
        duration,
      });
    }

    this.currentScreen = event.screenName;
    this.screenEntryTime = now;

    this.track('screen_view', {
      screenName: event.screenName,
      path: event.path,
      previousScreen: event.previousScreen,
    });
  }

  // Convenience methods for common events
  trackChat = {
    messageSent: (agentId: string, messageLength: number) =>
      this.track('chat_message_sent', { agentId, messageLength }),
    messageReceived: (agentId: string, latencyMs: number) =>
      this.track('chat_message_received', { agentId, latencyMs }),
    streamStarted: (agentId: string) =>
      this.track('chat_stream_started', { agentId }),
    streamStopped: (agentId: string, tokensGenerated: number) =>
      this.track('chat_stream_stopped', { agentId, tokensGenerated }),
    conversationCreated: (agentId: string) =>
      this.track('conversation_created', { agentId }),
    voiceInputUsed: () => this.track('voice_input_used'),
  };

  trackAgent = {
    viewed: (agentId: string, tier: string) =>
      this.track('agent_viewed', { agentId, tier }),
    favorited: (agentId: string) =>
      this.track('agent_favorited', { agentId }),
    unfavorited: (agentId: string) =>
      this.track('agent_unfavorited', { agentId }),
  };

  trackSubscription = {
    viewedPlans: () => this.track('subscription_plans_viewed'),
    selectedPlan: (tier: string, billingCycle: string) =>
      this.track('subscription_plan_selected', { tier, billingCycle }),
    purchaseStarted: (tier: string) =>
      this.track('subscription_purchase_started', { tier }),
    purchaseCompleted: (tier: string, price: number) =>
      this.track('subscription_purchase_completed', { tier, price }),
    purchaseFailed: (tier: string, error: string) =>
      this.track('subscription_purchase_failed', { tier, error }),
    cancelled: (tier: string, reason?: string) =>
      this.track('subscription_cancelled', { tier, reason }),
    restored: (tier: string) =>
      this.track('subscription_restored', { tier }),
  };

  trackBestie = {
    created: (traits: string[], style: string, path: string) =>
      this.track('bestie_created', { traitCount: traits.length, style, path }),
    interacted: () => this.track('bestie_interaction'),
    customized: () => this.track('bestie_customized'),
  };

  trackOnboarding = {
    started: () => this.track('onboarding_started'),
    stepCompleted: (step: string) =>
      this.track('onboarding_step_completed', { step }),
    completed: () => this.track('onboarding_completed'),
    skipped: (atStep: string) =>
      this.track('onboarding_skipped', { atStep }),
  };

  private async flush(): Promise<void> {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      await fetch(`${appConfig.apiUrl}/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${await getToken()}`,
        },
        body: JSON.stringify({ events }),
      });
    } catch {
      // Re-queue failed events (with limit to prevent memory issues)
      this.queue = [...events.slice(-100), ...this.queue].slice(-200);
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }
}

export const analytics = new AnalyticsTracker();
```

---

## 3. Screen View Tracking

```typescript
// src/hooks/useNavigationTracking.ts
import { usePathname, useSegments } from 'expo-router';
import { useEffect, useRef } from 'react';
import { analytics } from '@/src/services/analytics/tracker';

const SCREEN_NAMES: Record<string, string> = {
  '/': 'Home',
  '/chat': 'Chat List',
  '/agents': 'Agent Directory',
  '/bestie': 'Bestie Home',
  '/bestie/customize': 'Bestie Customize',
  '/settings': 'Settings',
  '/settings/profile': 'Profile',
  '/settings/subscription': 'Subscription',
  '/settings/security': 'Security',
  '/settings/language': 'Language',
};

export function useNavigationTracking() {
  const pathname = usePathname();
  const previousPath = useRef('');

  useEffect(() => {
    if (pathname === previousPath.current) return;

    let screenName = SCREEN_NAMES[pathname];
    if (!screenName) {
      if (pathname.match(/\/chat\/.+/)) screenName = 'Chat Screen';
      else if (pathname.match(/\/agents\/.+/)) screenName = 'Agent Detail';
      else screenName = pathname;
    }

    analytics.trackScreenView({
      screenName,
      path: pathname,
      previousScreen: previousPath.current,
    });

    previousPath.current = pathname;
  }, [pathname]);
}
```

---

## 4. Funnel Analytics

### Key Funnels to Track

```typescript
// Funnel 1: Onboarding → First Chat
// Steps: app_open → onboarding_started → onboarding_completed → conversation_created → chat_message_sent

// Funnel 2: Free → Paid Conversion
// Steps: subscription_plans_viewed → subscription_plan_selected → subscription_purchase_started → subscription_purchase_completed

// Funnel 3: Agent Discovery → Usage
// Steps: screen_view(Agent Directory) → agent_viewed → conversation_created → chat_message_sent

// Funnel 4: Bestie Setup
// Steps: onboarding_step(setup-bestie) → bestie_created → bestie_interaction

// Server-side funnel analysis query:
// SELECT
//   step,
//   COUNT(DISTINCT user_id) as users,
//   COUNT(DISTINCT user_id) * 100.0 / FIRST_VALUE(COUNT(DISTINCT user_id)) OVER (ORDER BY step_order) as conversion_pct
// FROM analytics_events
// WHERE name IN ('app_open', 'onboarding_completed', 'conversation_created', 'chat_message_sent')
// GROUP BY step
// ORDER BY step_order
```

---

## 5. Crash Reporting with Sentry

### Setup

```typescript
// src/services/analytics/crashReporting.ts
import * as Sentry from '@sentry/react-native';
import { appConfig } from '@/src/utils/env';
import { authStore } from '@/src/stores/authStore';

export function initCrashReporting(): void {
  if (!appConfig.sentryDsn) return;

  Sentry.init({
    dsn: appConfig.sentryDsn,
    environment: appConfig.environment,
    release: `best-ai-mobile@${APP_VERSION}`,
    dist: BUILD_NUMBER,

    // Performance monitoring
    tracesSampleRate: appConfig.environment === 'production' ? 0.2 : 1.0,
    profilesSampleRate: 0.1,

    // Session tracking
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30000,

    // Native crash handling
    enableNativeCrashHandling: true,
    enableNativeNagger: false,

    // Breadcrumbs
    maxBreadcrumbs: 100,
    enableAutoPerformanceTracing: true,
    enableNativeFramesTracking: true,

    // Privacy: strip PII
    beforeSend(event) {
      // Remove user email from error reports
      if (event.user) {
        delete event.user.email;
        delete event.user.ip_address;
      }

      // Remove message content from breadcrumbs
      event.breadcrumbs = event.breadcrumbs?.map((bc) => {
        if (bc.category === 'chat') {
          bc.message = '[REDACTED]';
        }
        return bc;
      });

      return event;
    },

    beforeBreadcrumb(breadcrumb) {
      // Don't log navigation to sensitive screens
      if (breadcrumb.category === 'navigation') {
        if (breadcrumb.data?.to?.includes('security')) {
          return null;
        }
      }
      return breadcrumb;
    },
  });
}

// Set user context after auth
export function setSentryUser(userId: string): void {
  Sentry.setUser({ id: userId });
}

export function clearSentryUser(): void {
  Sentry.setUser(null);
}

// Add custom context
export function setSentryContext(): void {
  const { preferences } = (require('@/src/stores/settingsStore')).settingsStore.getState();

  Sentry.setContext('app_settings', {
    theme: preferences.theme,
    language: preferences.language,
    offlineMode: true,
    biometricEnabled: preferences.biometricLock,
  });
}

// Custom error boundaries with Sentry
export function captureError(error: Error, context?: Record<string, any>): void {
  Sentry.captureException(error, {
    extra: context,
  });
}

// Performance transaction
export function startTransaction(name: string, op: string) {
  return Sentry.startTransaction({ name, op });
}
```

### Error Boundary with Sentry

```typescript
// src/components/common/SentryErrorBoundary.tsx
import * as Sentry from '@sentry/react-native';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/src/theme';

export const SentryErrorBoundary = Sentry.withErrorBoundary(
  ({ children }: { children: React.ReactNode }) => <>{children}</>,
  {
    fallback: ({ resetError }) => <ErrorFallback onRetry={resetError} />,
    showDialog: false, // Don't show Sentry's default dialog
  }
);

function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Something went wrong
      </Text>
      <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
        We've been notified and are working on a fix.
      </Text>
      <Pressable
        onPress={onRetry}
        style={[styles.button, { backgroundColor: theme.colors.primary }]}
      >
        <Text style={styles.buttonText}>Try Again</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontFamily: 'Inter-Bold', fontSize: 20, marginBottom: 8 },
  message: { fontFamily: 'Inter-Regular', fontSize: 16, textAlign: 'center', marginBottom: 24 },
  button: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  buttonText: { color: '#FFF', fontFamily: 'Inter-SemiBold', fontSize: 16 },
});
```

---

## 6. User Properties

```typescript
// Track user properties for segmentation
export function setUserProperties(properties: {
  tier: string;
  language: string;
  bestieActive: boolean;
  agentCount: number;
  daysSinceSignup: number;
  platform: string;
}): void {
  // Set on Sentry
  Sentry.setContext('user_properties', properties);

  // Send to analytics backend
  analytics.track('user_properties_updated', properties);
}

// Update on key events:
// - After sign in
// - After subscription change
// - After bestie creation
// - Weekly refresh
```

---

## 7. Privacy-Compliant Analytics

```typescript
// CRITICAL: Never log these to analytics:
// - Chat message content
// - User email addresses
// - Auth tokens
// - Payment details
// - Biometric data
// - IP addresses (stripped server-side)

// What IS safe to track:
// - Screen names (generic, not dynamic content)
// - Event names and counts
// - Message length (not content)
// - Agent IDs (public identifiers)
// - Subscription tier (not payment details)
// - Latency measurements
// - Error types (not error messages with user data)
// - Device type and OS version
// - App version

// Analytics opt-out
export function setAnalyticsEnabled(enabled: boolean): void {
  if (!enabled) {
    analytics.stop();
    Sentry.init({ enabled: false });
  }
  settingsStore.getState().updatePreferences({ analyticsEnabled: enabled });
}
```

---

## 8. Key Metrics Dashboard

### Engagement Metrics
- DAU / MAU ratio
- Average session length
- Messages sent per user per day
- Agents used per user per week
- Bestie interaction frequency

### Conversion Metrics
- Onboarding completion rate
- Free → Paid conversion rate
- Trial → Subscription conversion rate
- Plan upgrade rate

### Quality Metrics
- Crash-free session rate (target: >99.5%)
- API error rate
- Average response latency
- Offline sync success rate

### Retention Metrics
- Day 1, Day 7, Day 30 retention
- Churn rate by tier
- Reactivation rate

This analytics architecture gives Best AI Mobile comprehensive visibility into user behavior and app health while maintaining strict privacy standards and never logging personal content.
