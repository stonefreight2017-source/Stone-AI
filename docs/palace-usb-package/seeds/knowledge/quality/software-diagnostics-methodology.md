# Software Diagnostics Methodology — Wiz v3 Seed

> Computer Wiz (Royal Guard — The Diagnostician)
> Seed Class: Quality / Software Diagnostics
> Version: 3.0 — Full Software + Hardware Diagnostic Coverage
> Created: 2026-03-09

---

## 1. Philosophy: Software Diagnostics Is Process of Elimination

Hardware diagnostics asks "is the component working?" Software diagnostics asks "where in the stack is the assumption wrong?" Every software failure is a broken assumption — about state, about input, about environment, about timing. The Wiz finds which assumption broke.

**The Three Laws of Software Diagnosis:**
1. The error message is a symptom, not the disease.
2. If you can't reproduce it, you don't understand it.
3. The fix that silences the error without explaining the root cause is not a fix — it's a time bomb.

---

## 2. Process Analysis — What's Running, What's Stuck, What's Eating Resources

### 2.1 Windows Process Analysis

```powershell
# List all processes sorted by CPU usage (top consumers first)
Get-Process | Sort-Object CPU -Descending | Select-Object -First 20 Name, Id, CPU, WorkingSet64, HandleCount

# Find process by name with full details
Get-Process -Name "node" | Format-List *

# Find what's listening on a specific port
Get-NetTCPConnection -LocalPort 3000 | Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, State, OwningProcess
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess

# Find processes consuming >500MB RAM
Get-Process | Where-Object { $_.WorkingSet64 -gt 500MB } | Sort-Object WorkingSet64 -Descending | Select-Object Name, Id, @{N='MB';E={[math]::Round($_.WorkingSet64/1MB,1)}}

# Process tree — find parent/child relationships
Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name, CommandLine | Where-Object { $_.Name -eq "node.exe" }

# Thread count per process (high thread count = potential thread leak)
Get-Process | Sort-Object Threads.Count -Descending | Select-Object -First 15 Name, Id, @{N='Threads';E={$_.Threads.Count}}, @{N='MB';E={[math]::Round($_.WorkingSet64/1MB,1)}}

# Handle count (high handles = potential handle leak)
Get-Process | Sort-Object HandleCount -Descending | Select-Object -First 15 Name, Id, HandleCount
```

### 2.2 Linux/WSL Process Analysis

```bash
# Top processes by CPU
ps aux --sort=-%cpu | head -20

# Top processes by memory
ps aux --sort=-%mem | head -20

# What's using a port
sudo lsof -i :3000
sudo ss -tlnp | grep 3000

# Process tree
pstree -p | grep node

# Open file descriptors per process (fd leak detection)
ls /proc/<PID>/fd | wc -l
# Or for all node processes:
for pid in $(pgrep node); do echo "PID $pid: $(ls /proc/$pid/fd 2>/dev/null | wc -l) fds"; done

# Strace a misbehaving process (see what syscalls it's making)
strace -p <PID> -c -t 2>&1 | head -50

# Memory map of a process
pmap <PID> | tail -1
```

### 2.3 Process State Interpretation

| State | Windows | Linux | Meaning |
|-------|---------|-------|---------|
| Running | Running | R | Actively executing |
| Waiting | WaitSleepJoin | S | Waiting for I/O or signal |
| Stopped | Suspended | T | Stopped by signal |
| Zombie | N/A | Z | Terminated but parent hasn't reaped |
| Disk Sleep | N/A | D | Uninterruptible I/O wait (dangerous — may indicate disk issues) |

**Red Flags in Process Analysis:**
- Process CPU at 100% for >30 seconds → infinite loop or crypto mining
- Process memory growing continuously → memory leak
- Handle count growing continuously → handle/fd leak
- Zombie processes accumulating → parent process not handling child exit
- Many processes in D state → disk I/O bottleneck or failing disk

---

## 3. Dependency Conflict Resolution

### 3.1 Node.js / npm Dependencies

```bash
# Show dependency tree (find version conflicts)
npm ls

# Show only problems
npm ls 2>&1 | grep -E "WARN|ERR|missing|invalid|extraneous"

# Find duplicate packages
npm ls --all | grep -E "deduped|@" | sort | uniq -c | sort -rn | head -20

# Check for outdated packages
npm outdated

# Audit for security vulnerabilities
npm audit

# Why is a package installed? (trace dependency chain)
npm explain <package-name>

# Nuclear option — clean install (removes node_modules and lockfile)
rm -rf node_modules package-lock.json && npm install

# Check for peer dependency issues
npm ls --all 2>&1 | grep "peer dep"

# Prisma-specific: check version alignment
npm ls prisma @prisma/client
# Both MUST be same version. Mismatch = silent failures.
```

**Common Stone AI Dependency Conflicts:**
- `@prisma/client` version != `prisma` CLI version → regenerate: `npx prisma generate`
- `next` version vs `react`/`react-dom` version mismatch → check Next.js compatibility matrix
- `@clerk/nextjs` version vs `next` version → Clerk publishes compatibility tables
- `tailwindcss` v3 vs v4 config format differences → check `tailwind.config.ts` syntax

### 3.2 Python Dependencies

```bash
# Check for broken dependencies
pip check

# Show dependency tree
pip install pipdeptree && pipdeptree

# Show conflicts
pipdeptree --warn fail

# List all installed with versions
pip freeze

# Check if virtualenv is active
which python
echo $VIRTUAL_ENV
python -c "import sys; print(sys.prefix)"
```

### 3.3 Dependency Conflict Decision Tree

```
SYMPTOM: "Module not found" or "Cannot resolve"
│
├─ Is the package in package.json / requirements.txt?
│  ├─ NO → npm install <package> / pip install <package>
│  └─ YES → Is it in node_modules / site-packages?
│     ├─ NO → npm install / pip install -r requirements.txt
│     └─ YES → Is the VERSION correct?
│        ├─ NO → Version conflict. Check npm ls <pkg> for tree.
│        └─ YES → Is the IMPORT PATH correct?
│           ├─ Check for typos, case sensitivity (Linux!)
│           ├─ Check tsconfig.json paths/baseUrl
│           └─ Check if ESM vs CJS mismatch
│
SYMPTOM: "Peer dependency conflict"
│
├─ npm ls to find the tree
├─ Can you upgrade the parent package?
│  ├─ YES → Upgrade and test
│  └─ NO → Use --legacy-peer-deps (last resort)
│
SYMPTOM: "Multiple versions of React"
│
├─ npm ls react → find duplicates
├─ Add resolutions/overrides in package.json
└─ Or dedupe: npm dedupe
```

---

## 4. Version Incompatibility Analysis

### 4.1 Compatibility Matrix for Stone AI Stack

| Component | Current Version | Must Be Compatible With |
|-----------|----------------|------------------------|
| Node.js | Check `node -v` | Next.js 16 requires Node 18.18+ |
| Next.js | 16.1.6 | React 19+, Prisma 6+ |
| Prisma | 7.4.2 | Node 18+, PostgreSQL 16 |
| TypeScript | Check `npx tsc --version` | Next.js 16 plugin |
| Clerk | Check `npm ls @clerk/nextjs` | Next.js 16 App Router |

### 4.2 Version Checking Commands

```bash
# Node.js ecosystem
node -v
npm -v
npx next --version
npx tsc --version
npx prisma --version

# Check runtime vs build versions match
node -e "console.log(process.versions)"

# Check if running under correct Node version
cat .nvmrc 2>/dev/null || cat .node-version 2>/dev/null
```

### 4.3 Common Version Incompatibility Symptoms

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `SyntaxError: Unexpected token` at import | ESM/CJS mismatch or wrong Node version | Check `"type": "module"` in package.json, Node version |
| `TypeError: X is not a function` | Breaking API change between versions | Check changelog, pin to working version |
| `Cannot find module` after upgrade | Package renamed or restructured exports | Check package docs for import path changes |
| Build works, runtime fails | Dev dependency used at runtime | Move package from devDependencies to dependencies |
| Works locally, fails in CI/deploy | Different Node/npm version in CI | Pin versions in CI config, use `.nvmrc` |

---

## 5. Environment Variable Debugging

### 5.1 The Environment Variable Debugging Protocol

```bash
# List all environment variables (careful in shared terminals — may contain secrets)
printenv | sort

# Check specific variable
echo $DATABASE_URL
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# Windows PowerShell
[System.Environment]::GetEnvironmentVariables() | Sort-Object Key
$env:DATABASE_URL

# Check if .env file exists and is being loaded
ls -la .env .env.local .env.development .env.production 2>/dev/null

# Check .env file contents (CAREFUL: contains secrets)
# Only in secure terminal, never in logs
cat .env.local | grep -v "^#" | grep -v "^$"

# Next.js specific: NEXT_PUBLIC_ prefix required for client-side access
grep "NEXT_PUBLIC_" .env.local

# Verify environment at runtime
node -e "console.log('NODE_ENV:', process.env.NODE_ENV)"
```

### 5.2 Common Environment Variable Issues

**Problem: Variable set but app doesn't see it**
```
Root Causes:
1. Variable set in wrong .env file (.env vs .env.local vs .env.production)
2. Next.js: Missing NEXT_PUBLIC_ prefix for client-side access
3. Docker: Not passed via -e flag or docker-compose environment
4. Shell: Set in wrong shell session (not exported)
5. Vercel: Set but not deployed to correct environment (preview vs production)
```

**Problem: Variable has wrong value**
```
Root Causes:
1. Multiple .env files with overlapping keys (precedence order matters)
2. Trailing whitespace in .env file value
3. Quotes included literally (KEY="value" → value includes quotes)
4. Variable interpolation not working (${VAR} in .env)
5. Cached value from previous build (Next.js embeds env at build time)
```

**Next.js .env Precedence (highest to lowest):**
1. `process.env` (set in shell / deployment platform)
2. `.env.$(NODE_ENV).local` (e.g., `.env.development.local`)
3. `.env.local` (not loaded in test)
4. `.env.$(NODE_ENV)` (e.g., `.env.development`)
5. `.env`

### 5.3 Environment Variable Decision Tree

```
SYMPTOM: App can't connect to database/service
│
├─ Is the env var SET? (echo $VAR)
│  ├─ NO → Check .env file exists, check loading mechanism
│  └─ YES → Is the VALUE correct?
│     ├─ Check for typos, trailing spaces, wrong quotes
│     ├─ Check connection string format
│     └─ Test connection manually:
│        ├─ DB: psql "$DATABASE_URL" -c "SELECT 1"
│        ├─ Redis: redis-cli -u "$REDIS_URL" ping
│        └─ HTTP: curl -I "$API_URL/health"
│
SYMPTOM: "NEXT_PUBLIC_X is undefined" in browser
│
├─ Does the variable name start with NEXT_PUBLIC_?
│  ├─ NO → Rename it. Client-side Next.js REQUIRES the prefix.
│  └─ YES → Was the app REBUILT after adding the variable?
│     ├─ NO → Rebuild. Next.js embeds env vars at BUILD time.
│     └─ YES → Check browser DevTools → Sources → search for the value
```

---

## 6. PATH Issues and Resolution

### 6.1 PATH Debugging

```bash
# Show full PATH
echo $PATH | tr ':' '\n'

# Windows PowerShell
$env:PATH -split ';' | ForEach-Object { $_ }

# Find where a command resolves to
which node
where node  # Windows
command -v node  # POSIX

# Check if multiple versions exist
which -a node  # Shows ALL matches in PATH order
where node  # Windows shows all matches

# Common Stone AI PATH issues:
# 1. nvm not loading — node not found
# 2. Global npm packages not in PATH
npm config get prefix  # This + /bin should be in PATH
# 3. Prisma CLI not found
npx prisma --version  # Use npx to bypass PATH issues
```

### 6.2 PATH Resolution Order

The shell searches PATH left to right, using the FIRST match. This means:
- If `/usr/local/bin/node` (v22) comes before `/usr/bin/node` (v18), you get v22
- nvm/fnm prepend their managed version to PATH to override system Node
- Windows searches current directory FIRST (security risk), then PATH

### 6.3 DLL / Shared Library Conflicts

**Windows DLL Issues:**
```powershell
# Find which DLL a process loaded
Get-Process -Name "node" | Select-Object -ExpandProperty Modules | Select-Object FileName

# Check for missing DLLs (use Dependency Walker or dumpbin)
dumpbin /dependents node.exe

# SxS (Side-by-Side) assembly issues
# Check: Event Viewer → Application → Source: SideBySide
```

**Linux Shared Library Issues:**
```bash
# Check library dependencies
ldd $(which node)

# Find missing libraries
ldd $(which node) | grep "not found"

# Library search path
echo $LD_LIBRARY_PATH
ldconfig -p | grep <library-name>
```

---

## 7. Service State Analysis

### 7.1 Windows Services

```powershell
# List all services with status
Get-Service | Sort-Object Status, Name | Format-Table Name, Status, StartType

# Check specific service
Get-Service -Name "postgresql*"
Get-Service -Name "docker*"
Get-Service -Name "Redis"

# Service details including dependencies
Get-Service -Name "postgresql-x64-16" | Format-List *

# What services depend on this service?
Get-Service -Name "postgresql-x64-16" -DependentServices

# What does this service depend on?
Get-Service -Name "postgresql-x64-16" -RequiredServices

# Service recovery options (what happens on crash)
sc qfailure "postgresql-x64-16"

# Start/Stop/Restart
Restart-Service -Name "postgresql-x64-16" -Force
Start-Service -Name "postgresql-x64-16"
Stop-Service -Name "postgresql-x64-16" -Force

# Check service log (recent events)
Get-EventLog -LogName Application -Source "postgresql*" -Newest 10
```

### 7.2 Linux/WSL Services (systemd)

```bash
# List all services
systemctl list-units --type=service

# Check specific service
systemctl status postgresql
systemctl status docker
systemctl status redis

# Service logs (last 50 lines)
journalctl -u postgresql --no-pager -n 50

# Follow service logs in real-time
journalctl -u postgresql -f

# Service dependencies
systemctl list-dependencies postgresql

# Check if service is enabled (starts on boot)
systemctl is-enabled postgresql

# Restart with status check
sudo systemctl restart postgresql && systemctl status postgresql
```

### 7.3 Docker Container Analysis

```bash
# List all containers (including stopped)
docker ps -a

# Check specific container health
docker inspect stoneai-db --format='{{.State.Status}} {{.State.Health.Status}}'

# Container logs (last 100 lines)
docker logs stoneai-db --tail 100

# Follow container logs
docker logs stoneai-db -f

# Container resource usage
docker stats stoneai-db --no-stream

# Check container environment
docker exec stoneai-db env

# Check container networking
docker exec stoneai-db cat /etc/hosts
docker network inspect bridge
```

---

## 8. Decision Trees — The Big Three

### 8.1 Decision Tree: "App Won't Start"

```
APP WON'T START
│
├─ 1. Is there an error message?
│  ├─ YES → Read it carefully. Go to specific error section below.
│  └─ NO → Check logs: stdout, stderr, Event Viewer, journalctl
│
├─ 2. Common startup errors:
│  │
│  ├─ "EADDRINUSE" / "port already in use"
│  │  ├─ Find what's using the port: lsof -i :PORT / Get-NetTCPConnection
│  │  ├─ Kill it or change your port
│  │  └─ Common: leftover dev server, Docker container on same port
│  │
│  ├─ "Cannot find module X"
│  │  ├─ Run npm install
│  │  ├─ If persists: rm -rf node_modules && npm install
│  │  ├─ Check if package is in dependencies (not just devDependencies)
│  │  └─ Check import path casing (Linux is case-sensitive)
│  │
│  ├─ "DATABASE_URL" or connection error
│  │  ├─ Is the env var set? echo $DATABASE_URL
│  │  ├─ Is the database running? docker ps / Get-Service postgresql*
│  │  ├─ Can you connect manually? psql $DATABASE_URL -c "SELECT 1"
│  │  └─ Check: host, port, user, password, database name, SSL mode
│  │
│  ├─ "SyntaxError" at startup
│  │  ├─ Wrong Node.js version? node -v
│  │  ├─ TypeScript not compiled? npx tsc --noEmit
│  │  └─ ESM/CJS mismatch? Check package.json "type" field
│  │
│  ├─ "EACCES" / "Permission denied"
│  │  ├─ File permissions: ls -la <file>
│  │  ├─ Port below 1024 on Linux? Need sudo or capabilities
│  │  └─ Windows: Run as Administrator
│  │
│  ├─ Process starts and immediately exits (exit code 1)
│  │  ├─ Unhandled exception at startup
│  │  ├─ Check: node --trace-uncaught app.js
│  │  └─ Check: is a required config file missing?
│  │
│  └─ Process starts but no response on expected port
│     ├─ Is it binding to 0.0.0.0 vs 127.0.0.1?
│     ├─ Firewall blocking? (Windows Defender, iptables)
│     └─ Check actual listen address in logs
│
└─ 3. Nuclear restart procedure:
   ├─ Kill all related processes
   ├─ Clear caches: rm -rf .next node_modules/.cache
   ├─ Fresh install: rm -rf node_modules && npm install
   ├─ Regenerate: npx prisma generate
   └─ Start with verbose logging: DEBUG=* npm run dev
```

### 8.2 Decision Tree: "App Crashes on Load"

```
APP CRASHES ON LOAD (starts, then dies)
│
├─ 1. WHEN does it crash?
│  │
│  ├─ Immediately on first request
│  │  ├─ Middleware error (check middleware.ts)
│  │  ├─ Layout component error (check layout.tsx)
│  │  ├─ Missing server-side env var
│  │  └─ Database migration not applied: npx prisma migrate deploy
│  │
│  ├─ After a few seconds
│  │  ├─ Timeout on external service (DB, Auth, AI)
│  │  ├─ Memory spike → OOM kill
│  │  └─ Infinite loop triggered by specific data
│  │
│  ├─ After a few minutes of usage
│  │  ├─ Memory leak (growing heap)
│  │  ├─ Connection pool exhaustion (Prisma: too many clients)
│  │  ├─ File descriptor leak
│  │  └─ Event listener leak (MaxListenersExceededWarning)
│  │
│  └─ Random/intermittent
│     ├─ Race condition
│     ├─ External service flapping
│     └─ Resource contention (CPU/memory pressure from other processes)
│
├─ 2. Check crash artifacts:
│  ├─ Exit code: 137 = OOM killed, 1 = unhandled error, 139 = segfault
│  ├─ Core dumps: ls /tmp/core.* or check Windows minidumps
│  ├─ Node.js: --abort-on-uncaught-exception for core dump
│  └─ Vercel: Functions tab → check invocation errors
│
└─ 3. Crash investigation commands:
   ├─ node --max-old-space-size=4096 app.js  (give more memory to test)
   ├─ node --trace-warnings app.js  (show warning origins)
   ├─ NODE_OPTIONS='--max-old-space-size=4096' npm run dev
   └─ Monitor: watch -n 1 "ps aux | grep node"
```

### 8.3 Decision Tree: "App Runs Slow"

```
APP RUNS SLOW
│
├─ 1. WHERE is it slow?
│  │
│  ├─ Page load (initial)
│  │  ├─ Server-side rendering slow → profile getServerSideProps / Server Components
│  │  ├─ Large JavaScript bundle → analyze: npx next build && npx @next/bundle-analyzer
│  │  ├─ Slow database queries → check Prisma query logs
│  │  ├─ Unoptimized images → use next/image
│  │  └─ Too many waterfalls → check for sequential awaits that could be parallel
│  │
│  ├─ API response slow
│  │  ├─ Database query slow → EXPLAIN ANALYZE on the query
│  │  ├─ Missing index → check query plan for Seq Scan
│  │  ├─ N+1 query problem → use Prisma include/select
│  │  ├─ External API call slow → add timeout, consider caching
│  │  └─ Cold start (serverless) → check function size, dependencies
│  │
│  ├─ UI interaction slow (client-side)
│  │  ├─ Too many re-renders → React DevTools Profiler
│  │  ├─ Large list without virtualization → use react-window
│  │  ├─ Heavy computation on main thread → use Web Worker
│  │  ├─ Memory leak → Chrome DevTools → Memory tab
│  │  └─ Layout thrashing → check for forced reflows
│  │
│  └─ Everything slow
│     ├─ CPU maxed? (other process hogging)
│     ├─ Disk full? df -h
│     ├─ Network saturated? Check bandwidth
│     ├─ Swap thrashing? (too little RAM) → free -h, check swap usage
│     └─ Thermal throttling? (see hardware-diagnostics.md)
│
├─ 2. Measurement commands:
│  ├─ API timing: curl -w "\nDNS: %{time_namelookup}s\nConnect: %{time_connect}s\nTLS: %{time_appconnect}s\nTTFB: %{time_starttransfer}s\nTotal: %{time_total}s\n" -o /dev/null -s URL
│  ├─ Database: Enable Prisma query logging (log: ['query'] in PrismaClient)
│  ├─ Node.js event loop: node --inspect + Chrome DevTools Performance tab
│  └─ Frontend: Chrome DevTools → Performance → Record → Interact → Stop
│
└─ 3. Quick wins:
   ├─ Add database indexes for frequent queries
   ├─ Enable Prisma connection pooling
   ├─ Use React.memo / useMemo / useCallback for expensive renders
   ├─ Add Cache-Control headers for static assets
   └─ Use dynamic() imports for heavy components
```

---

## 9. Node.js Specific Deep Diagnostics

### 9.1 Heap Snapshots

```javascript
// Take a heap snapshot programmatically
const v8 = require('v8');
const fs = require('fs');

// Write heap snapshot to file
const snapshotStream = v8.writeHeapSnapshot();
console.log(`Heap snapshot written to: ${snapshotStream}`);

// Or via command line:
// node --heapsnapshot-signal=SIGUSR2 app.js
// Then: kill -USR2 <PID>  (Linux/Mac)

// Load snapshot in Chrome DevTools:
// 1. Open chrome://inspect
// 2. Memory tab → Load
// 3. Compare snapshots to find leaks (take 2+ over time)
```

**Heap Snapshot Analysis Checklist:**
1. Take snapshot at startup (baseline)
2. Exercise the suspected leaky operation 10-50 times
3. Force GC: `global.gc()` (requires `--expose-gc` flag)
4. Take second snapshot
5. Compare: look for objects with growing "Retained Size"
6. Sort by "Retained Size" to find biggest offenders
7. Check "Distance" — objects with high distance from GC root are suspicious

### 9.2 Event Loop Lag Detection

```javascript
// Simple event loop lag monitor
let lastCheck = Date.now();
setInterval(() => {
  const now = Date.now();
  const lag = now - lastCheck - 1000; // Expected 1000ms interval
  if (lag > 100) {
    console.warn(`Event loop lag: ${lag}ms`);
  }
  lastCheck = now;
}, 1000);

// Using perf_hooks (built-in, more accurate)
const { monitorEventLoopDelay } = require('perf_hooks');
const histogram = monitorEventLoopDelay({ resolution: 20 });
histogram.enable();

setInterval(() => {
  console.log({
    min: histogram.min / 1e6,      // Convert ns to ms
    max: histogram.max / 1e6,
    mean: histogram.mean / 1e6,
    p99: histogram.percentile(99) / 1e6,
  });
  histogram.reset();
}, 5000);
```

**Event Loop Lag Thresholds:**
- < 10ms: Healthy
- 10-50ms: Mild congestion — monitor
- 50-100ms: Significant — find the blocking operation
- > 100ms: Critical — user-facing latency guaranteed
- > 1000ms: Broken — something is synchronously blocking

### 9.3 Unhandled Rejection & Exception Tracking

```javascript
// MUST have in every Node.js application
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Log to monitoring, DON'T exit — let process manager handle
});

process.on('uncaughtException', (error, origin) => {
  console.error('Uncaught Exception:', error, 'Origin:', origin);
  // This IS fatal — log, clean up, exit
  process.exit(1);
});

// Node.js 15+: unhandled rejections throw by default
// Check with: node --unhandled-rejections=strict app.js
// Options: throw (default), warn, none, strict

// Common causes of unhandled rejections in Next.js:
// 1. Missing await on async function
// 2. .catch() not chained on Promise
// 3. async event handler without try/catch
// 4. Prisma query without error handling
```

### 9.4 Memory Usage Monitoring

```javascript
// Check current memory usage
const used = process.memoryUsage();
console.log({
  rss: `${Math.round(used.rss / 1024 / 1024)} MB`,           // Total allocated
  heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`, // V8 heap allocated
  heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,  // V8 heap used
  external: `${Math.round(used.external / 1024 / 1024)} MB`,   // C++ bound objects
  arrayBuffers: `${Math.round(used.arrayBuffers / 1024 / 1024)} MB`
});

// Memory thresholds for Stone AI (typical Next.js app):
// RSS < 300MB: Normal
// RSS 300-500MB: Monitor
// RSS 500MB-1GB: Investigate
// RSS > 1GB: Memory leak or misconfiguration
// Vercel serverless: 1GB default max, 3GB on Pro
```

---

## 10. Diagnostic Reporting Template

When Wiz completes a software diagnostic, report using this structure:

```
## Software Diagnostic Report — [Date]

### System Under Test
- Application: [name, version]
- Environment: [dev/staging/prod]
- OS: [details]
- Runtime: [Node.js version, etc.]

### Symptom
[What the user/system reported]

### Root Cause
[The actual underlying issue — be specific]

### Evidence
[Commands run, output observed, logs reviewed]

### Fix Applied
[What was changed and why]

### Verification
[How we confirmed the fix works]

### Prevention
[What should be done to prevent recurrence]

### Risk Assessment
[Any remaining risks or related issues found during investigation]
```

---

## 11. Quick Reference: "I Need to Debug X" Jump Table

| I need to debug... | Start here |
|--------------------|-----------|
| Why app won't start | Section 8.1 Decision Tree |
| Why app crashes | Section 8.2 Decision Tree |
| Why app is slow | Section 8.3 Decision Tree |
| Process using too much CPU | Section 2 Process Analysis |
| Memory leak | Section 9.1 Heap Snapshots + 9.4 Memory Monitoring |
| Module not found | Section 3 Dependency Conflicts |
| Wrong version running | Section 4 Version Incompatibility |
| Env var not working | Section 5 Environment Variables |
| Service won't start | Section 7 Service State Analysis |
| Command not found | Section 6 PATH Issues |
| Event loop blocked | Section 9.2 Event Loop Lag |
| Unhandled errors | Section 9.3 Rejection Tracking |

---

*This seed transforms Wiz from hardware-only to full-stack diagnostician. Every software problem is a broken assumption — find the assumption, find the fix.*
