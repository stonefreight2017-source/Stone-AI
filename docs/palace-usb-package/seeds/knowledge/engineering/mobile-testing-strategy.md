# Mobile Testing Strategy — Best AI Mobile

## Seed Classification
- **Domain**: Mobile Engineering
- **Application**: Best AI Mobile (Business #2)
- **Stack**: Jest, Detox, React Native Testing Library, EAS
- **Audience**: Senior Frontend Engineer

---

## 1. Testing Pyramid

```
         ┌─────────┐
         │  E2E    │  ← Detox (critical user flows)
         │  Tests  │     ~10% of tests
        ┌┴─────────┴┐
        │ Integration │  ← RNTL (screen-level)
        │   Tests     │     ~30% of tests
       ┌┴─────────────┴┐
       │  Unit Tests    │  ← Jest (logic, hooks, utils)
       │                │     ~60% of tests
       └────────────────┘
```

---

## 2. Jest Unit Tests

### Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterSetup: ['<rootDir>/jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@sentry/react-native|react-native-svg|react-native-reanimated|react-native-gesture-handler|react-native-mmkv|@gorhom/.*))',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@/services/(.*)$': '<rootDir>/src/services/$1',
    '^@/stores/(.*)$': '<rootDir>/src/stores/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 75,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Setup File

```typescript
// jest.setup.ts
import '@testing-library/react-native/extend-expect';

// Mock expo modules
jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
}));

jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getExpoPushTokenAsync: jest.fn().mockResolvedValue({ data: 'mock-token' }),
  setNotificationHandler: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  setBadgeCountAsync: jest.fn(),
  getBadgeCountAsync: jest.fn().mockResolvedValue(0),
}));

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn().mockResolvedValue(true),
  isEnrolledAsync: jest.fn().mockResolvedValue(true),
  authenticateAsync: jest.fn().mockResolvedValue({ success: true }),
  supportedAuthenticationTypesAsync: jest.fn().mockResolvedValue([1]),
  AuthenticationType: { FINGERPRINT: 1, FACIAL_RECOGNITION: 2 },
  SecurityLevel: { BIOMETRIC_STRONG: 2 },
  getEnrolledLevelAsync: jest.fn().mockResolvedValue(2),
}));

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn().mockImplementation(() => {
    const store = new Map<string, any>();
    return {
      getString: (key: string) => store.get(key),
      set: (key: string, value: any) => store.set(key, value),
      delete: (key: string) => store.delete(key),
      getBoolean: (key: string) => store.get(key),
      getNumber: (key: string) => store.get(key),
      clearAll: () => store.clear(),
    };
  }),
}));

// Mock Reanimated
jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock')
);

// Silence specific warnings in tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.('Animated:')) return;
  originalWarn(...args);
};
```

### Testing Utilities

```typescript
// __tests__/utils/renderWithProviders.tsx
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/src/theme';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface CustomRenderOptions extends RenderOptions {
  queryClient?: QueryClient;
}

export function renderWithProviders(
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}
```

### Unit Test Examples

```typescript
// __tests__/services/offline/syncQueue.test.ts
import { syncQueue } from '@/src/services/offline/syncQueue';
import { localDb } from '@/src/services/offline/database';

// Mock the database
jest.mock('@/src/services/offline/database');

describe('SyncQueue', () => {
  beforeEach(async () => {
    await localDb.initialize();
  });

  it('enqueues an item with pending status', async () => {
    await syncQueue.enqueue({
      entityType: 'message',
      entityId: 'msg-1',
      operation: 'create',
      payload: { content: 'Hello' },
    });

    const pending = await syncQueue.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].entityType).toBe('message');
    expect(pending[0].status).toBe('pending');
  });

  it('marks items as completed', async () => {
    await syncQueue.enqueue({
      entityType: 'message',
      entityId: 'msg-1',
      operation: 'create',
      payload: { content: 'Hello' },
    });

    const pending = await syncQueue.getPending();
    await syncQueue.markCompleted(pending[0].id);

    const remaining = await syncQueue.getPending();
    expect(remaining).toHaveLength(0);
  });

  it('respects retry limits', async () => {
    await syncQueue.enqueue({
      entityType: 'message',
      entityId: 'msg-1',
      operation: 'create',
      payload: { content: 'Hello' },
    });

    const pending = await syncQueue.getPending();

    // Fail 5 times (default max retries)
    for (let i = 0; i < 5; i++) {
      await syncQueue.markFailed(pending[0].id, 'Network error');
    }

    // Should no longer appear in pending
    const remaining = await syncQueue.getPending();
    expect(remaining).toHaveLength(0);
  });
});
```

```typescript
// __tests__/hooks/useChat.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useChat } from '@/src/hooks/useChat';
import { chatService } from '@/src/services/api/chat';

jest.mock('@/src/services/api/chat');

describe('useChat', () => {
  it('sends a message and adds it to the list', async () => {
    const mockMessages = [
      { id: '1', role: 'user', content: 'Hi', agentId: 'a1', createdAt: new Date().toISOString() },
    ];

    (chatService.getMessages as jest.Mock).mockResolvedValue(mockMessages);
    (chatService.streamMessage as jest.Mock).mockImplementation(
      async (params, callbacks) => {
        callbacks.onToken('Hello ');
        callbacks.onToken('there!');
        callbacks.onComplete({
          id: '2',
          role: 'assistant',
          content: 'Hello there!',
          agentId: 'a1',
          createdAt: new Date().toISOString(),
        });
      }
    );

    const { result } = renderHook(() => useChat('a1'));

    // Wait for initial load
    await act(async () => {});

    expect(result.current.messages).toHaveLength(1);

    // Send message
    await act(async () => {
      result.current.sendMessage('Hi');
    });

    // Should have user message + agent response
    expect(result.current.messages).toHaveLength(3);
    expect(result.current.messages[2].content).toBe('Hello there!');
  });
});
```

---

## 3. Component Testing with RNTL

```typescript
// __tests__/components/chat/MessageBubble.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { MessageBubble } from '@/src/components/chat/MessageBubble';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

jest.mock('expo-clipboard');

describe('MessageBubble', () => {
  const userMessage = {
    id: '1',
    conversationId: 'conv-1',
    role: 'user' as const,
    content: 'Hello, can you help me?',
    agentId: 'agent-1',
    createdAt: new Date().toISOString(),
  };

  const agentMessage = {
    id: '2',
    conversationId: 'conv-1',
    role: 'assistant' as const,
    content: 'Of course! How can I assist you today?',
    agentId: 'agent-1',
    createdAt: new Date().toISOString(),
  };

  it('renders user message with correct alignment', () => {
    render(<MessageBubble message={userMessage} />);
    expect(screen.getByText('Hello, can you help me?')).toBeTruthy();
  });

  it('renders agent message', () => {
    render(<MessageBubble message={agentMessage} agentName="Pixel" />);
    expect(screen.getByText('Of course! How can I assist you today?')).toBeTruthy();
  });

  it('triggers haptic on long press', () => {
    render(<MessageBubble message={userMessage} />);
    fireEvent(screen.getByText(userMessage.content), 'longPress');
    expect(Haptics.impactAsync).toHaveBeenCalledWith(
      Haptics.ImpactFeedbackStyle.Medium
    );
  });

  it('shows offline indicator for unsynced messages', () => {
    const offlineMsg = {
      ...userMessage,
      metadata: { offline: true, synced: false },
    };
    render(<MessageBubble message={offlineMsg} />);
    expect(screen.getByText('Pending sync')).toBeTruthy();
  });
});
```

```typescript
// __tests__/components/chat/ChatInput.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ChatInput } from '@/src/components/chat/ChatInput';

describe('ChatInput', () => {
  it('calls onSend with trimmed text', () => {
    const onSend = jest.fn();
    render(<ChatInput onSend={onSend} />);

    const input = screen.getByPlaceholderText('Message...');
    fireEvent.changeText(input, '  Hello World  ');
    fireEvent.press(screen.getByTestId('send-button'));

    expect(onSend).toHaveBeenCalledWith('Hello World');
  });

  it('does not send empty messages', () => {
    const onSend = jest.fn();
    render(<ChatInput onSend={onSend} />);

    const input = screen.getByPlaceholderText('Message...');
    fireEvent.changeText(input, '   ');
    // Send button should not be visible for empty text
  });

  it('shows stop button while streaming', () => {
    const onStop = jest.fn();
    render(<ChatInput onSend={jest.fn()} onStopStreaming={onStop} isStreaming />);

    fireEvent.press(screen.getByTestId('send-button'));
    expect(onStop).toHaveBeenCalled();
  });
});
```

---

## 4. Mocking Native Modules

```typescript
// __mocks__/react-native-reanimated.ts
// Reanimated mock for jest
const Reanimated = require('react-native-reanimated/mock');

Reanimated.default.call = () => {};

module.exports = {
  ...Reanimated,
  useAnimatedStyle: (cb: any) => cb(),
  useSharedValue: (value: any) => ({ value }),
  withSpring: (value: any) => value,
  withTiming: (value: any) => value,
  withRepeat: (value: any) => value,
  withDelay: (_: any, value: any) => value,
  withSequence: (...values: any[]) => values[values.length - 1],
  interpolate: jest.fn(),
  interpolateColor: jest.fn(),
  runOnJS: (fn: any) => fn,
  FadeInDown: { delay: () => ({ springify: () => ({}) }) },
  FadeIn: { duration: () => ({}) },
  FadeOut: { duration: () => ({}) },
  Layout: { springify: () => ({}) },
};
```

```typescript
// __mocks__/@clerk/clerk-expo.ts
export const useAuth = jest.fn(() => ({
  isSignedIn: true,
  isLoaded: true,
  userId: 'user-1',
  getToken: jest.fn().mockResolvedValue('mock-token'),
  signOut: jest.fn(),
}));

export const useUser = jest.fn(() => ({
  user: {
    id: 'user-1',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    firstName: 'Test',
    lastName: 'User',
  },
}));

export const useSignIn = jest.fn(() => ({
  signIn: { create: jest.fn() },
  setActive: jest.fn(),
  isLoaded: true,
}));

export const useSignUp = jest.fn(() => ({
  signUp: { create: jest.fn() },
  setActive: jest.fn(),
  isLoaded: true,
}));

export const ClerkProvider = ({ children }: any) => children;
export const ClerkLoaded = ({ children }: any) => children;
```

---

## 5. Detox E2E Tests

### Detox Configuration

```javascript
// .detoxrc.js
module.exports = {
  testRunner: {
    args: {
      config: 'e2e/jest.config.js',
      _: ['e2e'],
    },
  },
  apps: {
    'ios.release': {
      type: 'ios.app',
      build: 'npx expo run:ios --configuration Release',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/bestai.app',
    },
    'android.release': {
      type: 'android.apk',
      build: 'npx expo run:android --variant release',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: { type: 'iPhone 15' },
    },
    emulator: {
      type: 'android.emulator',
      device: { avdName: 'Pixel_6_API_34' },
    },
  },
  configurations: {
    'ios.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'android.release': {
      device: 'emulator',
      app: 'android.release',
    },
  },
};
```

### E2E Test Examples

```typescript
// e2e/auth.test.ts
import { by, device, element, expect } from 'detox';

describe('Authentication Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  it('should show sign-in screen on first launch', async () => {
    await expect(element(by.text('Welcome Back'))).toBeVisible();
    await expect(element(by.text('Sign in to Best AI'))).toBeVisible();
  });

  it('should sign in with email and password', async () => {
    await element(by.id('email-input')).typeText('test@stone-ai.net');
    await element(by.id('password-input')).typeText('TestPassword123!');
    await element(by.text('Sign In')).tap();

    // Should navigate to home screen
    await waitFor(element(by.text('Home')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
```

```typescript
// e2e/chat.test.ts
describe('Chat Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: false });
  });

  it('should navigate to chat and send a message', async () => {
    // Navigate to chat tab
    await element(by.text('Chat')).tap();
    await expect(element(by.text('Chats'))).toBeVisible();

    // Start new chat with first available agent
    await element(by.id('new-chat-button')).tap();
    await element(by.id('agent-card-0')).tap();

    // Type and send message
    await element(by.id('chat-input')).typeText('Hello, can you help me?');
    await element(by.id('send-button')).tap();

    // Verify message appears
    await expect(element(by.text('Hello, can you help me?'))).toBeVisible();

    // Wait for agent response
    await waitFor(element(by.id('agent-message')))
      .toBeVisible()
      .withTimeout(15000);
  });

  it('should persist messages after navigating away and back', async () => {
    // Go to home
    await element(by.text('Home')).tap();

    // Come back to chat
    await element(by.text('Chat')).tap();

    // Previous message should still be there
    await expect(element(by.text('Hello, can you help me?'))).toBeVisible();
  });
});
```

---

## 6. CI with EAS

```yaml
# eas.json — Test configuration
{
  "build": {
    "test": {
      "ios": {
        "simulator": true,
        "image": "latest"
      },
      "android": {
        "buildType": "apk",
        "image": "latest"
      },
      "env": {
        "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_test_xxx",
        "EXPO_PUBLIC_API_URL": "https://staging.stone-ai.net/api"
      }
    }
  }
}
```

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v4

  e2e-ios:
    runs-on: macos-latest
    needs: unit-tests
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npx expo prebuild --platform ios
      - run: brew tap wix/brew && brew install applesimutils
      - run: npx detox build --configuration ios.release
      - run: npx detox test --configuration ios.release --cleanup
```

---

## 7. Test Coverage Targets

| Area | Target | Priority |
|------|--------|----------|
| API services | 90% | Critical |
| Sync engine | 90% | Critical |
| Auth flows | 85% | Critical |
| Zustand stores | 85% | High |
| Custom hooks | 80% | High |
| UI components | 70% | Medium |
| Navigation | 60% (E2E) | Medium |
| Utility functions | 95% | High |

This testing strategy ensures Best AI Mobile ships with confidence — unit tests catch logic bugs, component tests verify UI behavior, and E2E tests validate critical user journeys across the full stack.
