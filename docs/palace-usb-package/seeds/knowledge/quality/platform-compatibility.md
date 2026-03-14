# Platform Compatibility
## Windows/Linux Interop, ESM/CJS, Shell Differences, Runtime Constraints

Version: 1.0 | Dev: Windows 10 + Git Bash | Deploy: Vercel (Linux) | GPU: OMEN (Linux)

---

## 1. WINDOWS/LINUX INTEROP

### Path Separators
```
TRAP: Windows uses \ but Git Bash accepts /
DEPLOY: Vercel runs Linux which ONLY accepts /

RULE: Always use forward slashes in code. Always.

// BAD — breaks on Linux
const filePath = 'src\\components\\Chat.tsx';
const joined = path.join('src', 'components'); // OK — path.join handles this

// GOOD
const filePath = 'src/components/Chat.tsx';

// SAFE PATTERN for cross-platform:
import path from 'path';
const safePath = path.posix.join('src', 'components', 'Chat.tsx');

// In shell scripts:
# BAD
cd C:\Users\stone\project
# GOOD (Git Bash)
cd /c/Users/stone/project
# ALSO GOOD (Git Bash)
cd "C:/Users/stone/project"
```

### Line Endings
```
TRAP: Windows = CRLF (\r\n), Linux = LF (\n)
IMPACT: Git diffs full of whitespace changes, shell scripts fail on Linux

FIX — .gitattributes (MUST be in repo root):
  * text=auto
  *.ts text eol=lf
  *.tsx text eol=lf
  *.js text eol=lf
  *.json text eol=lf
  *.md text eol=lf
  *.sh text eol=lf
  *.css text eol=lf
  *.yaml text eol=lf
  *.yml text eol=lf

FIX — Git config:
  git config --global core.autocrlf input
  # Converts CRLF→LF on commit, preserves LF on checkout

DETECTION:
  # Find files with CRLF
  grep -rlP '\r\n' src/ --include="*.ts"
  # Or: file src/lib/prisma.ts → shows "with CRLF line terminators"
```

### Case Sensitivity
```
TRAP: Windows filesystem is case-INSENSITIVE. Linux is case-SENSITIVE.
IMPACT: import './MyComponent' works on Windows, fails on Linux if file is 'myComponent.tsx'

DETECTION:
  # TypeScript catches this with forceConsistentCasingInFileNames: true
  # Also caught by Vercel build (runs on Linux)

RULES:
  - All filenames: lowercase or kebab-case (my-component.tsx)
  - Exception: React components can be PascalCase (MyComponent.tsx)
  - NEVER have two files differing only by case in same directory
  - Test: git ls-files | sort -f | uniq -di → shows case conflicts

COMMON FAILURE:
  Developer renames MyFile.tsx to myFile.tsx on Windows
  Git doesn't detect the change (same file to case-insensitive FS)
  FIX: git mv MyFile.tsx temp.tsx && git mv temp.tsx myFile.tsx
```

### File Permissions
```
TRAP: Windows doesn't have Unix file permissions
IMPACT: Scripts committed from Windows lack execute permission

FIX:
  git update-index --chmod=+x scripts/deploy.sh
  git add scripts/deploy.sh

CHECK:
  git ls-files --stage scripts/ | grep -v "100755"
  → Any script without 755 = can't execute on Linux

RULE: All .sh files must have execute permission in git
```

---

## 2. ESM/CJS COMPATIBILITY

### Package.json "type" Field
```
"type": "module"  → All .js files are ESM (import/export)
"type": "commonjs" → All .js files are CJS (require/module.exports)
No "type" field   → Default is CJS

OVERRIDE BY EXTENSION:
  .mjs → Always ESM regardless of "type"
  .cjs → Always CJS regardless of "type"
  .ts  → Follows tsconfig module setting
  .tsx → Follows tsconfig module setting

STONE AI: Next.js handles this automatically for src/ files.
WATCH OUT: Config files at root (next.config.js, tailwind.config.js)
  → Must match the "type" field or use .mjs/.cjs extension
```

### .mjs/.cjs Rules
```
.mjs FILES:
  ✓ import x from 'y'
  ✓ export default x
  ✓ export { x, y }
  ✓ import.meta.url
  ✗ require()           → ReferenceError
  ✗ module.exports       → ReferenceError
  ✗ __dirname            → ReferenceError
  ✗ __filename           → ReferenceError

.cjs FILES:
  ✓ require('x')
  ✓ module.exports = x
  ✓ __dirname
  ✓ __filename
  ✗ import x from 'y'   → SyntaxError (top-level)
  ✗ import.meta          → SyntaxError
  ✓ import('x')          → Dynamic import WORKS in CJS

INTEROP:
  // ESM importing CJS: usually works
  import cjsModule from './legacy.cjs'; // gets default export

  // CJS importing ESM: must use dynamic import
  const esmModule = await import('./modern.mjs'); // async only!
```

### Dynamic Import vs Require
```
| Feature           | require()              | import()                |
|-------------------|------------------------|-------------------------|
| Sync/Async        | Synchronous            | Asynchronous (Promise)  |
| Works in ESM      | NO                     | YES                     |
| Works in CJS      | YES                    | YES                     |
| Caching           | Cached after first load| Cached after first load |
| Tree-shakeable    | NO                     | YES                     |
| Conditional       | YES (in if blocks)     | YES (in if blocks)      |

RULE: Use import() for dynamic loading in all contexts.
```

---

## 3. SHELL COMPATIBILITY

### Git Bash vs PowerShell vs CMD
```
| Operation          | Git Bash          | PowerShell           | CMD              |
|--------------------|-------------------|----------------------|------------------|
| Env var read       | $VAR              | $env:VAR             | %VAR%            |
| Env var set        | export VAR=val    | $env:VAR = "val"     | set VAR=val      |
| Path separator     | /                 | \ or /               | \                |
| Null device        | /dev/null         | $null                | NUL              |
| Pipe               | |                 | |                    | |                |
| String concat      | "${A}${B}"        | "$A$B"               | %A%%B%           |
| Glob               | *.txt             | Get-ChildItem *.txt  | dir *.txt        |
| Delete file        | rm file           | Remove-Item file     | del file         |
| Delete dir         | rm -rf dir        | Remove-Item -Recurse | rmdir /s /q dir  |
| Current dir        | pwd               | Get-Location         | cd               |
| Process list       | ps aux            | Get-Process          | tasklist         |
| Which command      | which cmd         | Get-Command cmd      | where cmd        |

STONE AI STANDARD: Git Bash for all development
  - All scripts written for Bash
  - All docs use Bash syntax
  - Agent commands target Git Bash
```

### Shebang Lines
```bash
#!/bin/bash          → Standard Bash
#!/usr/bin/env bash  → More portable (finds bash in PATH)
#!/usr/bin/env node  → Node.js scripts

# WINDOWS TRAP: Shebangs ignored on Windows
# Git Bash: respects shebangs for scripts run with ./script.sh
# PowerShell/CMD: ignores shebangs completely
# node scripts: shebang works if run with: node script.js

# RULE: Include shebang for Linux compatibility
# but also add npm script entry for Windows convenience:
# "scripts": { "deploy": "bash scripts/deploy.sh" }
```

### Environment Variable Syntax
```bash
# Setting env vars for a single command:

# Git Bash / Linux:
DATABASE_URL=postgres://... npm run dev

# PowerShell:
$env:DATABASE_URL = "postgres://..."; npm run dev

# CMD:
set DATABASE_URL=postgres://... && npm run dev

# CROSS-PLATFORM SOLUTION: Use dotenv or .env files
# Or: cross-env package
# npx cross-env DATABASE_URL=postgres://... npm run dev
```

---

## 4. NODE.JS VERSION COMPATIBILITY

### Feature Availability by Version
```
| Feature                    | Node 18 | Node 20 | Node 22 |
|----------------------------|---------|---------|---------|
| fetch() global             | YES(exp)| YES     | YES     |
| Web Streams                | YES(exp)| YES     | YES     |
| structuredClone            | YES     | YES     | YES     |
| import.meta.resolve        | NO      | YES(exp)| YES     |
| --env-file flag            | NO      | YES     | YES     |
| Module.register()          | NO      | YES     | YES     |
| WebSocket (client)         | NO      | NO      | YES(exp)|
| Single executable (SEA)    | YES(exp)| YES(exp)| YES     |
| Permission model           | NO      | YES(exp)| YES     |

STONE AI: Target Node 20+ (Vercel default)
```

### Engine Field Enforcement
```jsonc
// package.json — enforce minimum Node version
{
  "engines": {
    "node": ">=20.0.0",
    "npm": ">=10.0.0"
  }
}

// .npmrc — make engines field actually enforce
// engine-strict=true

// .nvmrc — for nvm users
// 20
```

### Version Switching Traps
```
TRAP: Different Node version in dev vs CI vs production
  - Dev: whatever's installed (maybe 18)
  - CI: GitHub Actions default (maybe 20)
  - Vercel: configured in project settings (maybe 22)

FIX:
  1. Pin version in .nvmrc
  2. Pin version in package.json engines
  3. Pin version in GitHub Actions: uses: actions/setup-node@v4 with node-version-file: '.nvmrc'
  4. Pin version in Vercel project settings

TRAP: Global packages installed on different Node version
  FIX: Use npx for CLI tools, never rely on global installs
```

---

## 5. VERCEL RUNTIME CONSTRAINTS

### Edge Runtime Restrictions
```
Edge Functions (middleware.ts, edge routes) CANNOT use:
  ✗ Node.js fs module
  ✗ Node.js child_process
  ✗ Node.js crypto (some methods)
  ✗ Node.js net / tls / http
  ✗ __dirname / __filename
  ✗ process.env (limited — only NEXT_PUBLIC_* and explicitly allowed)
  ✗ Dynamic require()
  ✗ Native Node modules (anything with .node bindings)

Edge Functions CAN use:
  ✓ fetch()
  ✓ Web Crypto API (crypto.subtle)
  ✓ TextEncoder / TextDecoder
  ✓ URL / URLSearchParams
  ✓ Headers / Request / Response
  ✓ structuredClone
  ✓ setTimeout / setInterval (limited)
  ✓ console.log

IMPACT: Prisma does NOT work in Edge runtime
  → Database queries must be in Node.js runtime API routes
  → Middleware cannot query DB directly
```

### Serverless Function Limits
```
| Limit                    | Hobby  | Pro     | Enterprise |
|--------------------------|--------|---------|------------|
| Function size (zipped)   | 50MB   | 50MB    | 50MB       |
| Execution time           | 10s    | 60s     | 900s       |
| Memory                   | 1024MB | 1024MB  | 3008MB     |
| Concurrent executions    | 10     | 1000    | Custom     |
| Response body size       | 4.5MB  | 4.5MB   | 4.5MB      |

STONE AI IMPLICATIONS:
  - AI responses that take >60s → need streaming (ReadableStream)
  - Large agent context → watch function size after bundling
  - Concurrent chat users → Pro plan minimum
  - File uploads → 4.5MB limit on response (use presigned URLs for larger)
```

### Middleware Limitations
```
MIDDLEWARE RUNS ON EDGE — inherits all edge restrictions

ADDITIONAL MIDDLEWARE LIMITS:
  - 1MB size limit for middleware bundle
  - Cannot set response body (only headers, redirects, rewrites)
  - Runs on EVERY matched request — keep it fast
  - Cannot use Prisma (no Node.js runtime)
  - Clerk middleware: works but adds ~50ms cold start

MIDDLEWARE ORDER:
  Next.js middleware runs BEFORE route handler
  Multiple middleware? Only ONE middleware.ts file supported
  Chain logic inside that file:

  export async function middleware(req: NextRequest) {
    // 1. Security headers
    const res = addSecurityHeaders(req);
    // 2. Rate limiting (in-memory or edge KV)
    if (isRateLimited(req)) return rateLimitResponse();
    // 3. Auth (Clerk)
    return clerkMiddleware(req);
  }
```

---

## QUICK REFERENCE: Platform Decision Matrix

```
| Situation                    | Decision                              |
|------------------------------|---------------------------------------|
| Writing a file path in code  | Use forward slashes or path.posix     |
| Writing a shell script       | Target Git Bash (#!/usr/bin/env bash) |
| Setting env var in script    | Use cross-env or .env file            |
| Importing a module           | Use ESM import (never require)        |
| Config file at root          | Use .mjs extension for ESM clarity    |
| Need DB in middleware        | Can't — move to API route             |
| Large AI response            | Use streaming (ReadableStream)        |
| File naming                  | kebab-case or PascalCase for React    |
| Line endings                 | LF always — enforce via .gitattributes|
| Node version                 | Pin everywhere: .nvmrc + engines      |
```
