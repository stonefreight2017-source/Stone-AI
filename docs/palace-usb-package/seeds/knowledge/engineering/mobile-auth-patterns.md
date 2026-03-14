# Mobile Auth Patterns — Best AI Mobile

## Seed Classification
- **Domain**: Mobile Engineering / Security
- **Application**: Best AI Mobile (Business #2)
- **Stack**: Clerk Mobile SDK, expo-secure-store, expo-local-authentication
- **Audience**: Senior Frontend Engineer, Senior Security Engineer

---

## 1. Clerk Mobile SDK Integration

### Setup and Configuration

```typescript
// src/services/auth/clerkConfig.ts
import { ClerkProvider, useAuth, useUser, useSignIn, useSignUp } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

// Token cache using secure storage
export const tokenCache = {
  async getToken(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore getToken error:', error);
      return null;
    }
  },
  async saveToken(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStore saveToken error:', error);
    }
  },
  async clearToken(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStore clearToken error:', error);
    }
  },
};

// Clerk publishable key from environment
export const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
```

### Root Layout with Clerk Provider

```typescript
// app/_layout.tsx (auth portion)
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { tokenCache, CLERK_PUBLISHABLE_KEY } from '@/src/services/auth/clerkConfig';

export default function RootLayout() {
  return (
    <ClerkProvider
      publishableKey={CLERK_PUBLISHABLE_KEY}
      tokenCache={tokenCache}
    >
      <ClerkLoaded>
        <AppContent />
      </ClerkLoaded>
    </ClerkProvider>
  );
}

function AppContent() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <SplashScreen />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {isSignedIn ? (
        <Stack.Screen name="(tabs)" />
      ) : (
        <Stack.Screen name="(auth)" />
      )}
    </Stack>
  );
}
```

### Sign-In Flow

```typescript
// app/(auth)/sign-in.tsx
import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/src/components/layout/Screen';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { useTheme } from '@/src/theme';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const theme = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = useCallback(async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        router.replace('/(tabs)/');
      } else {
        // Handle MFA, email verification, etc.
        handleSignInStatus(result);
      }
    } catch (err: any) {
      const message = err.errors?.[0]?.longMessage ?? 'Sign in failed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, email, password, signIn, setActive, router]);

  // OAuth sign-in (Google, Apple)
  const handleOAuth = useCallback(
    async (strategy: 'oauth_google' | 'oauth_apple') => {
      if (!isLoaded) return;

      try {
        const redirectUrl = AuthSession.makeRedirectUri({
          scheme: 'bestai',
          path: '/oauth-callback',
        });

        const result = await signIn.create({
          strategy,
          redirectUrl,
        });

        const url =
          result.firstFactorVerification.externalVerificationRedirectURL;

        if (url) {
          const browserResult = await WebBrowser.openAuthSessionAsync(
            url.toString(),
            redirectUrl
          );

          if (browserResult.type === 'success') {
            // Complete the OAuth flow
            const { createdSessionId } = await signIn.reload();
            if (createdSessionId) {
              await setActive({ session: createdSessionId });
              router.replace('/(tabs)/');
            }
          }
        }
      } catch (err: any) {
        setError(err.errors?.[0]?.longMessage ?? 'OAuth sign in failed');
      }
    },
    [isLoaded, signIn, setActive, router]
  );

  return (
    <Screen scrollable>
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Welcome Back
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Sign in to Best AI
        </Text>

        {error ? (
          <View style={[styles.errorBox, { backgroundColor: theme.colors.errorBg }]}>
            <Text style={{ color: theme.colors.error }}>{error}</Text>
          </View>
        ) : null}

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
        />

        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          autoComplete="password"
        />

        <Button
          title="Sign In"
          onPress={handleSignIn}
          loading={isLoading}
          disabled={!email || !password}
        />

        <View style={styles.divider}>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
          <Text style={{ color: theme.colors.textSecondary }}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
        </View>

        {Platform.OS === 'ios' && (
          <Button
            title="Continue with Apple"
            variant="outline"
            icon="apple"
            onPress={() => handleOAuth('oauth_apple')}
          />
        )}

        <Button
          title="Continue with Google"
          variant="outline"
          icon="google"
          onPress={() => handleOAuth('oauth_google')}
        />

        <View style={styles.footer}>
          <Text style={{ color: theme.colors.textSecondary }}>
            Don't have an account?{' '}
          </Text>
          <Pressable onPress={() => router.push('/(auth)/sign-up')}>
            <Text style={{ color: theme.colors.primary, fontFamily: 'Inter-SemiBold' }}>
              Sign Up
            </Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontFamily: 'Inter-Bold', fontSize: 28, textAlign: 'center' },
  subtitle: { fontFamily: 'Inter-Regular', fontSize: 16, textAlign: 'center', marginTop: 8, marginBottom: 32 },
  errorBox: { padding: 12, borderRadius: 8, marginBottom: 16 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  dividerLine: { flex: 1, height: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
});
```

---

## 2. Biometric Authentication

### Biometric Setup

```typescript
// src/services/security/biometrics.ts
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

export interface BiometricCapabilities {
  isAvailable: boolean;
  biometricType: 'fingerprint' | 'facial' | 'iris' | 'none';
  isEnrolled: boolean;
  securityLevel: 'none' | 'weak' | 'strong';
}

export const biometricService = {
  async getCapabilities(): Promise<BiometricCapabilities> {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    let biometricType: BiometricCapabilities['biometricType'] = 'none';
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometricType = 'facial';
    } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometricType = 'fingerprint';
    } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      biometricType = 'iris';
    }

    const securityLevel = await LocalAuthentication.getEnrolledLevelAsync();

    return {
      isAvailable: compatible,
      biometricType,
      isEnrolled: enrolled,
      securityLevel:
        securityLevel === LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG
          ? 'strong'
          : securityLevel === LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK
            ? 'weak'
            : 'none',
    };
  },

  async authenticate(reason?: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: reason ?? 'Authenticate to continue',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false, // Allow PIN/pattern as fallback
        fallbackLabel: 'Use passcode',
      });

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed',
      };
    }
  },

  getBiometricLabel(type: BiometricCapabilities['biometricType']): string {
    switch (type) {
      case 'facial':
        return Platform.OS === 'ios' ? 'Face ID' : 'Face Unlock';
      case 'fingerprint':
        return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
      case 'iris':
        return 'Iris Scan';
      default:
        return 'Biometric';
    }
  },
};
```

### Biometric Lock Screen

```typescript
// src/components/auth/BiometricLock.tsx
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { biometricService } from '@/src/services/security/biometrics';
import { settingsStore } from '@/src/stores/settingsStore';
import { useAppState } from '@/src/hooks/useAppState';
import { useTheme } from '@/src/theme';
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { LockIcon, FingerprintIcon, FaceIdIcon } from '@/src/components/ui/Icons';

interface BiometricLockProps {
  children: React.ReactNode;
}

export function BiometricLock({ children }: BiometricLockProps) {
  const [isLocked, setIsLocked] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('none');
  const biometricEnabled = settingsStore((s) => s.preferences.biometricLock);
  const appState = useAppState();
  const theme = useTheme();

  useEffect(() => {
    if (biometricEnabled) {
      biometricService.getCapabilities().then((caps) => {
        setBiometricType(caps.biometricType);
      });
    }
  }, [biometricEnabled]);

  // Lock when app goes to background
  useEffect(() => {
    if (biometricEnabled && appState === 'background') {
      setIsLocked(true);
    }
  }, [appState, biometricEnabled]);

  // Auto-authenticate when lock is shown
  useEffect(() => {
    if (isLocked && biometricEnabled) {
      authenticate();
    }
  }, [isLocked]);

  const authenticate = useCallback(async () => {
    const result = await biometricService.authenticate(
      'Unlock Best AI'
    );
    if (result.success) {
      setIsLocked(false);
    }
  }, []);

  if (!isLocked || !biometricEnabled) {
    return <>{children}</>;
  }

  return (
    <View style={[styles.lockScreen, { backgroundColor: theme.colors.background }]}>
      <LockIcon color={theme.colors.textSecondary} size={64} />
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Best AI is Locked
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
        {biometricService.getBiometricLabel(biometricType as any)} to unlock
      </Text>
      <Pressable style={styles.unlockButton} onPress={authenticate}>
        {biometricType === 'facial' ? (
          <FaceIdIcon color={theme.colors.primary} size={48} />
        ) : (
          <FingerprintIcon color={theme.colors.primary} size={48} />
        )}
        <Text style={[styles.unlockText, { color: theme.colors.primary }]}>
          Tap to unlock
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  lockScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginTop: 24,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    marginTop: 8,
  },
  unlockButton: {
    alignItems: 'center',
    marginTop: 48,
    padding: 24,
  },
  unlockText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    marginTop: 12,
  },
});
```

---

## 3. Secure Token Storage

### Keychain/Keystore Integration

```typescript
// src/services/security/keychain.ts
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// SecureStore options for maximum security
const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  // iOS: stored in Keychain with highest protection
  // Android: stored in Android Keystore, encrypted
};

const KEYS = {
  AUTH_TOKEN: 'bestai_auth_token',
  REFRESH_TOKEN: 'bestai_refresh_token',
  BIOMETRIC_KEY: 'bestai_biometric_key',
  ENCRYPTION_KEY: 'bestai_encryption_key',
  SESSION_DATA: 'bestai_session_data',
  DEVICE_ID: 'bestai_device_id',
} as const;

export const keychain = {
  // Auth tokens
  async saveAuthToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.AUTH_TOKEN, token, SECURE_OPTIONS);
  },

  async getAuthToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.AUTH_TOKEN);
  },

  async saveRefreshToken(token: string): Promise<void> {
    await SecureStore.setItemAsync(KEYS.REFRESH_TOKEN, token, SECURE_OPTIONS);
  },

  async getRefreshToken(): Promise<string | null> {
    return SecureStore.getItemAsync(KEYS.REFRESH_TOKEN);
  },

  // Session management
  async saveSession(data: object): Promise<void> {
    await SecureStore.setItemAsync(
      KEYS.SESSION_DATA,
      JSON.stringify(data),
      SECURE_OPTIONS
    );
  },

  async getSession(): Promise<object | null> {
    const data = await SecureStore.getItemAsync(KEYS.SESSION_DATA);
    return data ? JSON.parse(data) : null;
  },

  // Device ID (generated once, persists across reinstalls on iOS)
  async getOrCreateDeviceId(): Promise<string> {
    let deviceId = await SecureStore.getItemAsync(KEYS.DEVICE_ID);
    if (!deviceId) {
      deviceId = generateSecureId();
      await SecureStore.setItemAsync(KEYS.DEVICE_ID, deviceId, SECURE_OPTIONS);
    }
    return deviceId;
  },

  // Clear all secure data (sign out)
  async clearAll(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.AUTH_TOKEN),
      SecureStore.deleteItemAsync(KEYS.REFRESH_TOKEN),
      SecureStore.deleteItemAsync(KEYS.SESSION_DATA),
      SecureStore.deleteItemAsync(KEYS.BIOMETRIC_KEY),
    ]);
  },

  // Encryption key for local data
  async getOrCreateEncryptionKey(): Promise<string> {
    let key = await SecureStore.getItemAsync(KEYS.ENCRYPTION_KEY);
    if (!key) {
      key = generateSecureKey();
      await SecureStore.setItemAsync(KEYS.ENCRYPTION_KEY, key, SECURE_OPTIONS);
    }
    return key;
  },
};

function generateSecureId(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

function generateSecureKey(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}
```

### Token Refresh Flow

```typescript
// src/services/auth/tokenManager.ts
import { useAuth } from '@clerk/clerk-expo';
import { keychain } from '../security/keychain';

class TokenManager {
  private refreshPromise: Promise<string> | null = null;
  private getToken: (() => Promise<string | null>) | null = null;

  setTokenGetter(getter: () => Promise<string | null>): void {
    this.getToken = getter;
  }

  async getValidToken(): Promise<string | null> {
    if (!this.getToken) return null;

    try {
      // Clerk handles token refresh internally
      const token = await this.getToken();
      if (token) {
        await keychain.saveAuthToken(token);
      }
      return token;
    } catch (error) {
      // Fallback to cached token for offline scenarios
      return keychain.getAuthToken();
    }
  }

  // Token refresh with deduplication
  async refreshToken(): Promise<string | null> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const token = await this.getToken?.();
        if (token) {
          await keychain.saveAuthToken(token);
        }
        return token ?? null;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }
}

export const tokenManager = new TokenManager();

// Hook to wire up Clerk's token getter
export function useTokenManager() {
  const { getToken } = useAuth();

  useEffect(() => {
    tokenManager.setTokenGetter(() => getToken());
  }, [getToken]);
}
```

---

## 4. Session Management

### Session State Machine

```typescript
// src/services/auth/sessionManager.ts
import { AppState, AppStateStatus } from 'react-native';
import { keychain } from '../security/keychain';
import { settingsStore } from '@/src/stores/settingsStore';

type SessionState = 'active' | 'backgrounded' | 'locked' | 'expired' | 'signed_out';

interface SessionConfig {
  backgroundLockTimeout: number;  // ms before requiring re-auth after background
  maxSessionAge: number;          // ms before session expires completely
  extendOnActivity: boolean;      // Extend session on user activity
}

const DEFAULT_SESSION_CONFIG: SessionConfig = {
  backgroundLockTimeout: 5 * 60 * 1000,  // 5 minutes
  maxSessionAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  extendOnActivity: true,
};

class SessionManager {
  private state: SessionState = 'active';
  private backgroundTimestamp: number | null = null;
  private config: SessionConfig;
  private listeners: Set<(state: SessionState) => void> = new Set();

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
  }

  start(): void {
    AppState.addEventListener('change', this.handleAppStateChange);
  }

  private handleAppStateChange = (nextState: AppStateStatus): void => {
    if (nextState === 'background' || nextState === 'inactive') {
      this.backgroundTimestamp = Date.now();
      this.setState('backgrounded');
    } else if (nextState === 'active') {
      this.handleForeground();
    }
  };

  private handleForeground(): void {
    if (!this.backgroundTimestamp) {
      this.setState('active');
      return;
    }

    const elapsed = Date.now() - this.backgroundTimestamp;
    this.backgroundTimestamp = null;

    const biometricEnabled = settingsStore.getState().preferences.biometricLock;

    if (elapsed > this.config.backgroundLockTimeout && biometricEnabled) {
      this.setState('locked');
    } else {
      this.setState('active');
    }
  }

  unlock(): void {
    this.setState('active');
  }

  signOut(): void {
    this.setState('signed_out');
  }

  getState(): SessionState {
    return this.state;
  }

  private setState(newState: SessionState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.listeners.forEach((fn) => fn(newState));
    }
  }

  onStateChange(listener: (state: SessionState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const sessionManager = new SessionManager();
```

### Auth Guard Hook

```typescript
// src/hooks/useAuth.ts
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import { useEffect } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { tokenManager } from '@/src/services/auth/tokenManager';
import { sessionManager } from '@/src/services/auth/sessionManager';

export function useAuth() {
  const { isSignedIn, isLoaded, signOut, getToken } = useClerkAuth();
  const { user } = useUser();
  const router = useRouter();
  const segments = useSegments();

  // Wire up token manager
  useEffect(() => {
    tokenManager.setTokenGetter(() => getToken());
  }, [getToken]);

  // Route protection
  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isSignedIn && inAuthGroup) {
      router.replace('/(tabs)/');
    } else if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    }
  }, [isSignedIn, isLoaded, segments]);

  const handleSignOut = async () => {
    sessionManager.signOut();
    await signOut();
    // Clear local secure data
    const { keychain } = await import('@/src/services/security/keychain');
    await keychain.clearAll();
  };

  return {
    isSignedIn,
    isLoaded,
    user,
    signOut: handleSignOut,
  };
}
```

---

## 5. Multi-Factor Authentication

```typescript
// src/services/auth/mfa.ts
import { useSignIn } from '@clerk/clerk-expo';

export function useMFA() {
  const { signIn, setActive } = useSignIn();

  const verifyTOTP = async (code: string): Promise<boolean> => {
    try {
      const result = await signIn!.attemptSecondFactor({
        strategy: 'totp',
        code,
      });

      if (result.status === 'complete') {
        await setActive!({ session: result.createdSessionId });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const verifySMS = async (code: string): Promise<boolean> => {
    try {
      const result = await signIn!.attemptSecondFactor({
        strategy: 'phone_code',
        code,
      });

      if (result.status === 'complete') {
        await setActive!({ session: result.createdSessionId });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const sendSMSCode = async (phoneNumberId: string): Promise<void> => {
    await signIn!.prepareSecondFactor({
      strategy: 'phone_code',
      phoneNumberId,
    });
  };

  return { verifyTOTP, verifySMS, sendSMSCode };
}
```

---

## 6. Sign-Up and Onboarding Flow

```typescript
// app/(auth)/sign-up.tsx
import { useSignUp } from '@clerk/clerk-expo';
import { useState, useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSignUp = useCallback(async () => {
    if (!isLoaded) return;

    try {
      await signUp.create({
        emailAddress: email,
        password,
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({
        strategy: 'email_code',
      });

      setPendingVerification(true);
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage ?? 'Sign up failed');
    }
  }, [isLoaded, email, password, signUp]);

  const handleVerification = useCallback(async () => {
    if (!isLoaded) return;

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        // Navigate to onboarding
        router.replace('/(auth)/onboarding/welcome');
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.longMessage ?? 'Verification failed');
    }
  }, [isLoaded, code, signUp, setActive, router]);

  if (pendingVerification) {
    return (
      <Screen scrollable>
        <View style={styles.container}>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            We sent a code to {email}
          </Text>
          <Input
            label="Verification Code"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
            autoFocus
          />
          <Button title="Verify" onPress={handleVerification} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scrollable>
      <View style={styles.container}>
        <Text style={styles.title}>Create Account</Text>
        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <PasswordStrengthMeter password={password} />
        <Button title="Create Account" onPress={handleSignUp} />
        <View style={styles.footer}>
          <Text>Already have an account? </Text>
          <Pressable onPress={() => router.push('/(auth)/sign-in')}>
            <Text style={styles.link}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
```

---

## 7. Platform-Specific Auth Patterns

### Apple Sign-In (iOS Required)

```typescript
// src/services/auth/appleAuth.ts
// Apple requires Apple Sign In option if any social login is offered on iOS
import * as AppleAuthentication from 'expo-apple-authentication';
import { useSignIn } from '@clerk/clerk-expo';

export function useAppleAuth() {
  const { signIn, setActive } = useSignIn();

  const signInWithApple = async (): Promise<boolean> => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Use the identity token with Clerk
      if (credential.identityToken) {
        const result = await signIn!.create({
          strategy: 'oauth_apple',
          token: credential.identityToken,
        });

        if (result.status === 'complete') {
          await setActive!({ session: result.createdSessionId });
          return true;
        }
      }

      return false;
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        return false; // User cancelled
      }
      throw error;
    }
  };

  return { signInWithApple };
}
```

### Google Sign-In

```typescript
// src/services/auth/googleAuth.ts
import * as Google from 'expo-auth-session/providers/google';
import { useSignIn } from '@clerk/clerk-expo';

export function useGoogleAuth() {
  const { signIn, setActive } = useSignIn();

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success' && response.authentication?.idToken) {
      handleGoogleToken(response.authentication.idToken);
    }
  }, [response]);

  const handleGoogleToken = async (idToken: string) => {
    try {
      const result = await signIn!.create({
        strategy: 'oauth_google',
        token: idToken,
      });

      if (result.status === 'complete') {
        await setActive!({ session: result.createdSessionId });
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
    }
  };

  return {
    signInWithGoogle: () => promptAsync(),
    isReady: !!request,
  };
}
```

---

## 8. Auth State Persistence

```typescript
// src/hooks/useAuthPersistence.ts
import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { keychain } from '@/src/services/security/keychain';
import { authStore } from '@/src/stores/authStore';

// Persist auth state to survive app restarts
export function useAuthPersistence() {
  const { isSignedIn, userId, getToken } = useAuth();

  useEffect(() => {
    if (isSignedIn && userId) {
      // Store session info securely
      keychain.saveSession({
        userId,
        signedInAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      });

      // Cache token for offline use
      getToken().then((token) => {
        if (token) {
          keychain.saveAuthToken(token);
        }
      });

      // Update auth store
      authStore.getState().setAuthenticated(true, userId);
    } else {
      authStore.getState().setAuthenticated(false, null);
    }
  }, [isSignedIn, userId]);

  // Periodically refresh token in background
  useEffect(() => {
    if (!isSignedIn) return;

    const interval = setInterval(async () => {
      try {
        const token = await getToken({ skipCache: true });
        if (token) {
          await keychain.saveAuthToken(token);
        }
      } catch {
        // Token refresh failed — cached token is still valid
      }
    }, 10 * 60 * 1000); // Every 10 minutes

    return () => clearInterval(interval);
  }, [isSignedIn, getToken]);
}
```

---

## 9. Security Checklist for Mobile Auth

1. **Never store tokens in AsyncStorage** — use SecureStore (Keychain/Keystore)
2. **Always use WHEN_UNLOCKED_THIS_DEVICE_ONLY** for keychain accessibility
3. **Biometric fallback to device passcode** — never leave users locked out
4. **Token rotation** — Clerk handles this automatically with short-lived JWTs
5. **Certificate pinning** — prevents MITM attacks on auth endpoints (see security-hardening seed)
6. **Root/jailbreak detection** — warn users on compromised devices
7. **Clipboard protection** — clear clipboard after pasting OTP codes
8. **Session timeout** — lock app after configurable background duration
9. **Secure WebView for OAuth** — use expo-web-browser, not in-app WebView
10. **No hardcoded secrets** — all keys come from environment variables

This auth architecture gives Best AI Mobile enterprise-grade security while maintaining the smooth UX mobile users expect, with seamless integration to Stone AI's existing Clerk authentication system.
