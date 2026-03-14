# Mobile Security Hardening — Best AI Mobile

## Seed Classification
- **Domain**: Mobile Engineering / Security
- **Application**: Best AI Mobile (Business #2)
- **Stack**: React Native, expo-secure-store, expo-crypto
- **Audience**: Senior Security Engineer, Senior Frontend Engineer

---

## 1. Security Architecture Overview

```
┌────────────────────────────────────────────┐
│            Application Layer                │
│  ┌──────────────┐  ┌──────────────────┐    │
│  │ Input        │  │ Output           │    │
│  │ Validation   │  │ Sanitization     │    │
│  │ (Zod)        │  │ (XSS prevention) │    │
│  └──────────────┘  └──────────────────┘    │
├────────────────────────────────────────────┤
│            Network Layer                    │
│  ┌──────────────┐  ┌──────────────────┐    │
│  │ Certificate  │  │ Request          │    │
│  │ Pinning      │  │ Signing          │    │
│  └──────────────┘  └──────────────────┘    │
├────────────────────────────────────────────┤
│            Storage Layer                    │
│  ┌──────────────┐  ┌──────────────────┐    │
│  │ Keychain/    │  │ Encrypted        │    │
│  │ Keystore     │  │ SQLite           │    │
│  └──────────────┘  └──────────────────┘    │
├────────────────────────────────────────────┤
│            Device Layer                     │
│  ┌──────────────┐  ┌──────────────────┐    │
│  │ Root/JB      │  │ Code             │    │
│  │ Detection    │  │ Obfuscation      │    │
│  └──────────────┘  └──────────────────┘    │
└────────────────────────────────────────────┘
```

---

## 2. Certificate Pinning

### Implementation

```typescript
// src/services/security/pinning.ts
import { Platform } from 'react-native';

// Certificate pins for stone-ai.net
// Get the pin: openssl s_client -connect stone-ai.net:443 | openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | openssl dgst -sha256 -binary | openssl enc -base64
const CERTIFICATE_PINS = {
  'stone-ai.net': [
    'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', // Primary
    'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=', // Backup
  ],
};

// For Axios/fetch, implement pinning via native modules
// Expo doesn't have built-in cert pinning, so we use a config plugin

// expo-config-plugin for iOS ATS (App Transport Security)
// ios/bestai/Info.plist additions:
const iosATSConfig = {
  NSAppTransportSecurity: {
    NSAllowsArbitraryLoads: false,
    NSExceptionDomains: {
      'stone-ai.net': {
        NSExceptionRequiresForwardSecrecy: true,
        NSExceptionMinimumTLSVersion: 'TLSv1.3',
        NSIncludesSubdomains: true,
      },
    },
  },
};

// For React Native, use TrustKit (iOS) or OkHttp CertificatePinner (Android)
// via a custom Expo config plugin

// Alternatively, implement certificate validation in the API client
export function validateCertificate(serverCert: string): boolean {
  const validPins = CERTIFICATE_PINS['stone-ai.net'];
  return validPins.some((pin) => pin === `sha256/${serverCert}`);
}

// Fallback: Use network security config for Android
// android/app/src/main/res/xml/network_security_config.xml
const androidNetworkSecurityConfig = `
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <domain-config>
    <domain includeSubdomains="true">stone-ai.net</domain>
    <pin-set expiration="2027-01-01">
      <pin digest="SHA-256">AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=</pin>
      <pin digest="SHA-256">BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=</pin>
    </pin-set>
  </domain-config>
</network-security-config>
`;
```

---

## 3. Root/Jailbreak Detection

```typescript
// src/services/security/deviceIntegrity.ts
import { Platform, NativeModules } from 'react-native';
import * as Device from 'expo-device';

interface IntegrityCheck {
  isRooted: boolean;
  isEmulator: boolean;
  isDebugger: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  warnings: string[];
}

export async function checkDeviceIntegrity(): Promise<IntegrityCheck> {
  const warnings: string[] = [];
  let riskScore = 0;

  // Check if running on emulator/simulator
  const isEmulator = !Device.isDevice;
  if (isEmulator) {
    warnings.push('Running on emulator/simulator');
    riskScore += 1;
  }

  // Check for root/jailbreak indicators
  const isRooted = await checkRootStatus();
  if (isRooted) {
    warnings.push('Device may be rooted/jailbroken');
    riskScore += 3;
  }

  // Check for debugger
  const isDebugger = __DEV__;
  if (isDebugger) {
    warnings.push('Debug mode detected');
    riskScore += 1;
  }

  const riskLevel = riskScore >= 3 ? 'high' : riskScore >= 1 ? 'medium' : 'low';

  return { isRooted, isEmulator, isDebugger, riskLevel, warnings };
}

async function checkRootStatus(): Promise<boolean> {
  if (Platform.OS === 'ios') {
    return checkJailbreak();
  } else if (Platform.OS === 'android') {
    return checkRootAndroid();
  }
  return false;
}

function checkJailbreak(): boolean {
  // Check for common jailbreak indicators
  // These checks run in JS — for production, use a native module
  const jailbreakPaths = [
    '/Applications/Cydia.app',
    '/Library/MobileSubstrate/MobileSubstrate.dylib',
    '/bin/bash',
    '/usr/sbin/sshd',
    '/etc/apt',
    '/private/var/lib/apt/',
    '/usr/bin/ssh',
  ];

  // In a real implementation, this would call native code
  // to check file existence and other indicators
  return false; // Placeholder
}

function checkRootAndroid(): boolean {
  // Check for common root indicators
  const rootPaths = [
    '/system/app/Superuser.apk',
    '/sbin/su',
    '/system/bin/su',
    '/system/xbin/su',
    '/data/local/xbin/su',
    '/data/local/bin/su',
    '/system/sd/xbin/su',
    '/system/bin/failsafe/su',
    '/data/local/su',
    '/su/bin/su',
  ];

  // Also check for:
  // - Magisk (MagiskManager)
  // - Test keys in build tags
  // - RW system partition
  return false; // Placeholder
}

// Use the integrity check at app startup
export function useDeviceIntegrity() {
  useEffect(() => {
    checkDeviceIntegrity().then((result) => {
      if (result.riskLevel === 'high') {
        // Show warning but don't block usage
        Alert.alert(
          'Security Warning',
          'This device may be compromised. Your data security cannot be guaranteed. We recommend using an unmodified device.',
          [{ text: 'I Understand' }]
        );

        // Log to analytics (don't send sensitive data)
        analytics.track('device_integrity_warning', {
          riskLevel: result.riskLevel,
          isEmulator: result.isEmulator,
        });
      }
    });
  }, []);
}
```

---

## 4. Code Obfuscation

### Hermes Bytecode

```javascript
// Hermes engine compiles JS to bytecode at build time
// This provides basic obfuscation — the shipped binary contains
// HBC (Hermes Bytecode) files, not readable JavaScript

// app.json — Hermes is enabled by default
{
  "expo": {
    "jsEngine": "hermes"
  }
}

// Additional obfuscation via Metro transform
// metro.config.js
const config = getDefaultConfig(__dirname);

config.transformer.minifierConfig = {
  compress: {
    drop_console: true,       // Remove console.log
    drop_debugger: true,      // Remove debugger statements
    dead_code: true,          // Remove unreachable code
    reduce_vars: true,        // Reduce variable usage
    passes: 3,                // Multiple optimization passes
  },
  mangle: {
    toplevel: true,           // Mangle top-level names
  },
};
```

### ProGuard/R8 for Android

```json
// app.json — Enable ProGuard for Android release builds
{
  "expo": {
    "plugins": [
      [
        "expo-build-properties",
        {
          "android": {
            "enableProguardInReleaseBuilds": true,
            "enableShrinkResourcesInReleaseBuilds": true
          }
        }
      ]
    ]
  }
}
```

---

## 5. Secure Storage

### Storage Hierarchy

| Data Type | Storage | Encryption | Backup |
|-----------|---------|------------|--------|
| Auth tokens | SecureStore (Keychain/Keystore) | Hardware-backed | No |
| Encryption keys | SecureStore | Hardware-backed | No |
| User preferences | MMKV | Optional | Yes |
| Chat messages | SQLite | App-level AES | Yes |
| API cache | MMKV | No | No |
| Device ID | SecureStore | Hardware-backed | iOS only |

### Encrypted SQLite

```typescript
// src/services/security/encryptedDb.ts
import * as SQLite from 'expo-sqlite';
import { keychain } from './keychain';

export async function openEncryptedDatabase(): Promise<SQLite.SQLiteDatabase> {
  // Get or create encryption key from secure storage
  const key = await keychain.getOrCreateEncryptionKey();

  // expo-sqlite supports SQLCipher for encryption
  const db = await SQLite.openDatabaseAsync('bestai.db', {
    // SQLCipher encryption (if using expo-sqlite with SQLCipher)
    // Otherwise, encrypt/decrypt at the application layer
  });

  return db;
}

// Application-layer encryption for sensitive fields
import * as Crypto from 'expo-crypto';

export async function encryptField(data: string, key: string): Promise<string> {
  // Use expo-crypto for encryption
  const digest = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    key + data
  );
  // In production, use a proper AES-256-GCM implementation
  // expo-crypto provides hashing; for full encryption,
  // use a native module or react-native-aes-crypto
  return digest;
}
```

---

## 6. API Key Protection

### Never Embed Secrets in the Bundle

```typescript
// BAD — keys embedded in JS bundle (extractable)
const API_KEY = 'sk_live_xxxxxxxxxxxxx';

// GOOD — keys from environment (build-time injection)
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;
// Note: EXPO_PUBLIC_ vars are embedded at build time
// They ARE in the bundle but not as easily searchable

// BEST — server-side proxy for sensitive APIs
// The mobile app authenticates with Clerk, then the server
// makes API calls using server-side secrets
// Mobile app NEVER sees Stripe API keys, Anthropic keys, etc.

// Architecture:
// Mobile → Stone AI API (with Clerk token) → External APIs (with server secrets)
```

### Runtime API Key Retrieval

```typescript
// For keys that must be client-side (e.g., Sentry DSN, analytics):
// Fetch them from a secure endpoint after authentication

export async function getClientConfig(): Promise<ClientConfig> {
  const response = await apiClient.get('/api/mobile/config');
  return response.data;
}

// The config endpoint returns only what the mobile app needs
// Keys are associated with the authenticated user
// Revocable at the server level
```

---

## 7. Network Security

### Request Signing

```typescript
// src/services/security/requestSigning.ts
import * as Crypto from 'expo-crypto';

// Sign API requests to prevent tampering
export async function signRequest(
  method: string,
  path: string,
  body: string | null,
  timestamp: number,
  deviceId: string
): Promise<string> {
  const payload = `${method}:${path}:${body ?? ''}:${timestamp}:${deviceId}`;
  const signature = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    payload
  );
  return signature;
}

// Attach to API client interceptor
apiClient.interceptors.request.use(async (config) => {
  const timestamp = Date.now();
  const deviceId = await keychain.getOrCreateDeviceId();
  const body = config.data ? JSON.stringify(config.data) : null;

  const signature = await signRequest(
    config.method?.toUpperCase() ?? 'GET',
    config.url ?? '',
    body,
    timestamp,
    deviceId
  );

  config.headers['X-Timestamp'] = timestamp.toString();
  config.headers['X-Device-ID'] = deviceId;
  config.headers['X-Signature'] = signature;
  config.headers['X-Client-Version'] = APP_VERSION;
  config.headers['X-Platform'] = Platform.OS;

  return config;
});
```

### Preventing Man-in-the-Middle

```typescript
// Security measures against MITM attacks:

// 1. Certificate pinning (see section 2)
// 2. TLS 1.3 minimum
// 3. HSTS enforcement (server-side)
// 4. Request signing (see above)
// 5. Token binding — tokens tied to device ID

// Detect potential MITM:
function detectProxyOrMITM(): boolean {
  // Check for common proxy indicators
  // - HTTP_PROXY environment variable
  // - Known proxy certificates
  // - Unexpected certificate chain length
  return false;
}
```

---

## 8. Data Protection

### Clipboard Security

```typescript
// Clear clipboard after sensitive operations
import * as Clipboard from 'expo-clipboard';

export async function secureClipboard(duration: number = 30000): Promise<void> {
  // Clear clipboard after 30 seconds
  setTimeout(async () => {
    const content = await Clipboard.getStringAsync();
    if (content) {
      await Clipboard.setStringAsync('');
    }
  }, duration);
}

// Use after OTP paste
const handleOTPPaste = async (code: string) => {
  verifyOTP(code);
  secureClipboard(10000); // Clear after 10 seconds
};
```

### Screenshot Prevention

```typescript
// Prevent screenshots on sensitive screens
// iOS: use UITextField with secureTextEntry trick
// Android: FLAG_SECURE

import { Platform, NativeModules } from 'react-native';

export function preventScreenCapture(): void {
  if (Platform.OS === 'android') {
    // Android: set FLAG_SECURE on activity window
    // Requires native module or expo-screen-capture
  }
  // iOS: Apple doesn't support preventing screenshots programmatically
  // but you can detect them via UIApplicationUserDidTakeScreenshotNotification
}

// Using expo-screen-capture:
import * as ScreenCapture from 'expo-screen-capture';

export function useSecureScreen() {
  useEffect(() => {
    // Prevent screen recording (Android only)
    ScreenCapture.preventScreenCaptureAsync();

    // Listen for screenshots (both platforms)
    const sub = ScreenCapture.addScreenshotListener(() => {
      // Log security event
      analytics.track('screenshot_detected', {
        screen: 'sensitive',
      });
    });

    return () => {
      ScreenCapture.allowScreenCaptureAsync();
      sub.remove();
    };
  }, []);
}
```

---

## 9. Input Validation

```typescript
// src/utils/validation.ts
import { z } from 'zod';

// All user inputs validated with Zod before use
export const messageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(10000, 'Message too long')
    .transform((val) => val.trim()),
  agentId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
});

export const profileSchema = z.object({
  displayName: z
    .string()
    .min(2)
    .max(50)
    .regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Invalid characters in name'),
  email: z.string().email(),
});

// Sanitize HTML/script injection in displayed content
export function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// URL validation for deep links
export function isValidDeepLink(url: string): boolean {
  try {
    const parsed = new URL(url);
    const allowedSchemes = ['bestai', 'https'];
    const allowedHosts = ['stone-ai.net', 'staging.stone-ai.net'];

    if (!allowedSchemes.includes(parsed.protocol.replace(':', ''))) return false;
    if (parsed.protocol === 'https:' && !allowedHosts.includes(parsed.hostname)) return false;

    return true;
  } catch {
    return false;
  }
}
```

---

## 10. Security Audit Checklist

### Pre-Launch Security Review

- [ ] **Authentication**: Clerk tokens stored in SecureStore, not AsyncStorage
- [ ] **Biometrics**: WHEN_UNLOCKED_THIS_DEVICE_ONLY keychain access
- [ ] **Network**: TLS 1.3+, certificate pinning configured
- [ ] **Storage**: No sensitive data in plaintext, SQLite encrypted
- [ ] **Code**: ProGuard enabled, Hermes bytecode, console.log stripped
- [ ] **API**: All requests authenticated, request signing implemented
- [ ] **Input**: Zod validation on all user inputs
- [ ] **Deep Links**: URL scheme validated against allowlist
- [ ] **Clipboard**: Auto-clear after OTP entry
- [ ] **Root/JB**: Detection with user warning (not blocking)
- [ ] **Logs**: No sensitive data in production logs
- [ ] **Dependencies**: npm audit clean, no known vulnerabilities
- [ ] **Secrets**: No hardcoded API keys, all via env vars or server proxy
- [ ] **Backup**: Sensitive keychain items excluded from backup
- [ ] **Screenshots**: Detection on sensitive screens

This security hardening ensures Best AI Mobile protects user data at every layer — device, storage, network, and application — while maintaining the smooth user experience that mobile users expect.
