# Mobile CI/CD Pipeline — Best AI Mobile

## Seed Classification
- **Domain**: Mobile Engineering / DevOps
- **Application**: Best AI Mobile (Business #2)
- **Stack**: EAS Build, EAS Submit, EAS Update, GitHub Actions
- **Audience**: Senior DevOps Engineer, Senior Frontend Engineer

---

## 1. Pipeline Architecture

```
Code Push → GitHub Actions → EAS Build → EAS Submit → App Store / Play Store
                │                │
                │                └─── EAS Update (OTA for JS-only changes)
                │
                ├── Unit Tests
                ├── Type Check
                ├── Lint
                └── E2E Tests (on merge to main)
```

### Branch Strategy

| Branch | Purpose | Build Type | Distribution |
|--------|---------|-----------|--------------|
| `main` | Production releases | Production | App Store / Play Store |
| `staging` | Pre-release testing | Preview | Internal testers (TestFlight/Internal) |
| `develop` | Active development | Development | Developer devices |
| `feature/*` | Feature branches | Development (on-demand) | PR review |

---

## 2. EAS Configuration

### eas.json

```json
{
  "cli": {
    "version": ">= 12.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": {
        "simulator": true
      },
      "env": {
        "EXPO_PUBLIC_ENVIRONMENT": "development",
        "EXPO_PUBLIC_API_URL": "http://localhost:3000/api",
        "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_test_xxx"
      }
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "buildConfiguration": "Release"
      },
      "android": {
        "buildType": "apk"
      },
      "env": {
        "EXPO_PUBLIC_ENVIRONMENT": "staging",
        "EXPO_PUBLIC_API_URL": "https://staging.stone-ai.net/api",
        "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_test_xxx",
        "EXPO_PUBLIC_SENTRY_DSN": "https://xxx@sentry.io/xxx"
      },
      "channel": "preview"
    },
    "production": {
      "ios": {
        "buildConfiguration": "Release",
        "autoIncrement": true
      },
      "android": {
        "buildType": "app-bundle",
        "autoIncrement": true
      },
      "env": {
        "EXPO_PUBLIC_ENVIRONMENT": "production",
        "EXPO_PUBLIC_API_URL": "https://stone-ai.net/api",
        "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_live_xxx",
        "EXPO_PUBLIC_SENTRY_DSN": "https://xxx@sentry.io/xxx"
      },
      "channel": "production"
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "founder@stone-ai.net",
        "ascAppId": "APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "production",
        "releaseStatus": "completed"
      }
    },
    "preview": {
      "ios": {
        "appleId": "founder@stone-ai.net",
        "ascAppId": "APP_STORE_CONNECT_APP_ID",
        "appleTeamId": "TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

---

## 3. GitHub Actions Workflows

### PR Check Workflow

```yaml
# .github/workflows/pr-check.yml
name: PR Check
on:
  pull_request:
    branches: [develop, staging, main]

jobs:
  quality:
    name: Code Quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx eslint . --max-warnings 0
      - run: npx prettier --check .

  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm test -- --coverage --ci
      - uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
```

### Build and Deploy Workflows

```yaml
# .github/workflows/preview.yml
name: Preview Build
on:
  push:
    branches: [staging]

jobs:
  build:
    name: EAS Preview Build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npm ci
      - run: eas build --platform all --profile preview --non-interactive

  submit-testflight:
    name: Submit to TestFlight
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas submit --platform ios --profile preview --non-interactive
```

```yaml
# .github/workflows/production.yml
name: Production Release
on:
  push:
    tags: ['v*']  # Triggered by version tags: v1.0.0, v1.1.0, etc.

jobs:
  test:
    name: Final Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm test -- --ci

  build:
    name: Production Build
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npm ci
      - run: eas build --platform all --profile production --non-interactive

  submit:
    name: Submit to Stores
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas submit --platform all --profile production --non-interactive

  notify:
    name: Notify Team
    needs: submit
    runs-on: ubuntu-latest
    steps:
      - name: Send notification
        run: |
          curl -X POST "${{ secrets.ALERT_WEBHOOK }}" \
            -H "Content-Type: application/json" \
            -d '{"title":"Best AI Mobile ${{ github.ref_name }} submitted to stores","type":"release"}'
```

---

## 4. OTA Updates with EAS Update

### When to Use OTA vs Full Build

| Change Type | Method | Review Required |
|-------------|--------|----------------|
| Bug fix in JS/TS | OTA Update | No |
| UI changes | OTA Update | No |
| New screen/feature | OTA Update | No |
| Native dependency change | Full Build | Yes (App Store) |
| App icon/splash change | Full Build | Yes |
| Permission changes | Full Build | Yes |
| SDK upgrade | Full Build | Yes |

### OTA Update Commands

```bash
# Push an update to preview channel (staging testers)
eas update --branch preview --message "Fix chat scroll bug"

# Push an update to production channel (all users)
eas update --branch production --message "Fix message rendering issue"

# Roll back to a previous update
eas update:rollback --branch production

# Check update status
eas update:list --branch production
```

### OTA Update Workflow

```yaml
# .github/workflows/ota-update.yml
name: OTA Update
on:
  workflow_dispatch:
    inputs:
      branch:
        description: 'Update channel (preview or production)'
        required: true
        type: choice
        options: [preview, production]
      message:
        description: 'Update message'
        required: true
        type: string

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm test -- --ci
      - run: eas update --branch ${{ inputs.branch }} --message "${{ inputs.message }}" --non-interactive
```

### Update Client Configuration

```typescript
// src/services/updates/updateChecker.ts
import * as Updates from 'expo-updates';
import { Alert, AppState } from 'react-native';

export async function checkForUpdates(): Promise<void> {
  if (__DEV__) return; // No updates in development

  try {
    const update = await Updates.checkForUpdateAsync();

    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();

      Alert.alert(
        'Update Available',
        'A new version is ready. Restart to apply?',
        [
          { text: 'Later', style: 'cancel' },
          {
            text: 'Restart',
            onPress: async () => {
              await Updates.reloadAsync();
            },
          },
        ]
      );
    }
  } catch (error) {
    // Silent fail — updates are non-critical
    console.log('Update check failed:', error);
  }
}

// Check for updates when app comes to foreground
export function useUpdateChecker() {
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkForUpdates();
      }
    });

    // Initial check
    checkForUpdates();

    return () => sub.remove();
  }, []);
}
```

---

## 5. Version Management

### Automated Version Bumping

```typescript
// scripts/bump-version.ts
import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';

type BumpType = 'patch' | 'minor' | 'major';

function bumpVersion(type: BumpType) {
  const appJson = JSON.parse(readFileSync('app.json', 'utf-8'));
  const [major, minor, patch] = appJson.expo.version.split('.').map(Number);

  let newVersion: string;
  switch (type) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
  }

  appJson.expo.version = newVersion;
  writeFileSync('app.json', JSON.stringify(appJson, null, 2));

  // EAS handles buildNumber/versionCode auto-increment
  console.log(`Version bumped to ${newVersion}`);

  // Create git tag
  execSync(`git add app.json`);
  execSync(`git commit -m "chore: bump version to ${newVersion}"`);
  execSync(`git tag v${newVersion}`);

  console.log(`Tagged as v${newVersion}`);
  console.log(`Run 'git push && git push --tags' to trigger production build`);
}

// Usage: npx ts-node scripts/bump-version.ts patch
const type = process.argv[2] as BumpType;
if (!['patch', 'minor', 'major'].includes(type)) {
  console.error('Usage: bump-version.ts <patch|minor|major>');
  process.exit(1);
}
bumpVersion(type);
```

---

## 6. Beta Distribution

### TestFlight (iOS)

```bash
# Build and submit to TestFlight
eas build --platform ios --profile preview
eas submit --platform ios --profile preview

# Testers receive via TestFlight app
# Internal testers: auto-approved, up to 100
# External testers: requires brief App Store review, up to 10,000
```

### Internal Distribution (Android)

```bash
# Build APK for direct distribution
eas build --platform android --profile preview

# OR submit to Google Play internal testing track
eas submit --platform android --profile preview
```

### Internal Build Distribution

```bash
# Build for internal distribution (both platforms)
eas build --platform all --profile preview

# Download links available at:
# https://expo.dev/accounts/[account]/projects/best-ai/builds

# Or use EAS CLI to get download URL
eas build:list --platform ios --profile preview --limit 1
```

---

## 7. Environment Secrets Management

```bash
# Set secrets on EAS (never commit these to git)
eas secret:create --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "pk_live_xxx" --scope project
eas secret:create --name EXPO_PUBLIC_SENTRY_DSN --value "https://xxx@sentry.io/xxx" --scope project
eas secret:create --name SENTRY_AUTH_TOKEN --value "sntrys_xxx" --scope project

# GitHub Actions secrets (set in repo settings)
# EXPO_TOKEN — EAS authentication
# CODECOV_TOKEN — Code coverage
# ALERT_WEBHOOK — Deployment notification
```

---

## 8. Release Checklist

### Pre-Release

- [ ] All tests passing (unit + E2E)
- [ ] TypeScript compiles without errors
- [ ] Version bumped in app.json
- [ ] Changelog updated
- [ ] Sentry release created with source maps
- [ ] Tested on physical devices (iOS + Android)
- [ ] Offline mode tested
- [ ] Push notifications tested
- [ ] Deep links tested
- [ ] Accessibility checked

### Post-Release

- [ ] Monitor Sentry for crash spikes
- [ ] Monitor app store reviews
- [ ] Verify OTA update channel works
- [ ] Check analytics for adoption rate
- [ ] Archive build artifacts

This CI/CD pipeline gives Best AI Mobile automated quality gates, seamless deployment to both app stores, and instant OTA updates for JavaScript-layer fixes — minimizing time-to-fix while maintaining app store compliance.
