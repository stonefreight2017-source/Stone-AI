# Software-Layer Network Diagnostics — Wiz v3 Seed

> Computer Wiz (Royal Guard — The Diagnostician)
> Seed Class: Quality / Network Diagnostics (Software Layer)
> Version: 3.0 — Full Software + Hardware Diagnostic Coverage
> Created: 2026-03-09

---

## 1. Philosophy: The Network Is Not Magic

"It works on my machine" is almost always a network configuration difference. DNS, certificates, proxies, CORS, firewalls — the software network stack has at least a dozen places where things can go wrong between "I sent a request" and "I got a response." Wiz diagnoses each layer systematically.

**The Network Diagnostic Stack (top to bottom):**
```
Application Layer:  CORS, WebSocket, HTTP/2, API behavior
Presentation Layer: TLS/SSL, certificates, encryption
Session Layer:      Cookies, auth tokens, session management
Transport Layer:    TCP connections, ports, firewalls
Network Layer:      IP routing, NAT, VPN
Resolution Layer:   DNS, hosts file, DNS cache
Physical Layer:     See hardware-diagnostics.md
```

---

## 2. DNS Resolution Chains

### 2.1 How DNS Resolution Works

```
Your App → OS DNS Cache → hosts file → DNS Resolver (ISP/Cloudflare/Google)
                                                ↓
                                        Root Nameservers (.com)
                                                ↓
                                        TLD Nameservers (stone-ai.net)
                                                ↓
                                        Authoritative NS (Cloudflare)
                                                ↓
                                        IP Address returned
```

### 2.2 DNS Diagnostic Commands

```bash
# Basic lookup
nslookup stone-ai.net
nslookup stone-ai.net 8.8.8.8  # Use Google DNS specifically

# Detailed lookup with dig (more info than nslookup)
dig stone-ai.net
dig stone-ai.net +short          # Just the IP
dig stone-ai.net +trace          # Full resolution chain (root → TLD → auth)
dig stone-ai.net @8.8.8.8       # Query specific DNS server
dig stone-ai.net ANY             # All record types
dig stone-ai.net MX              # Mail records
dig stone-ai.net TXT             # TXT records (SPF, DKIM, verification)
dig stone-ai.net NS              # Nameservers
dig stone-ai.net CNAME           # CNAME records

# Check DNS propagation from multiple resolvers
for dns in 8.8.8.8 1.1.1.1 208.67.222.222 9.9.9.9; do
  echo "=== $dns ==="
  dig stone-ai.net @$dns +short
done

# Check TTL (Time To Live) — how long is the record cached?
dig stone-ai.net | grep -E "^stone-ai" | awk '{print "TTL:", $2, "seconds"}'

# Reverse lookup (IP → hostname)
dig -x 76.76.21.21 +short

# Check DNSSEC
dig stone-ai.net +dnssec

# Windows: flush DNS cache
ipconfig /flushdns

# Linux: flush DNS cache (systemd-resolved)
sudo systemd-resolve --flush-caches

# Windows: view DNS cache
ipconfig /displaydns | findstr "Record"

# Linux: view DNS cache stats
systemd-resolve --statistics
```

### 2.3 DNS Problem Decision Tree

```
SYMPTOM: "DNS resolution failed" / "ENOTFOUND" / "Name not resolved"
│
├─ Can you resolve OTHER domains?
│  ├─ NO → DNS server issue
│  │  ├─ Check DNS config: cat /etc/resolv.conf (Linux) or ipconfig /all (Windows)
│  │  ├─ Try alternative DNS: dig stone-ai.net @8.8.8.8
│  │  ├─ If alternative works → change DNS to 1.1.1.1 or 8.8.8.8
│  │  └─ If nothing works → network connectivity issue (not DNS)
│  │
│  └─ YES → This specific domain has issues
│     ├─ Is the domain registered? whois stone-ai.net
│     ├─ Are nameservers set? dig stone-ai.net NS
│     ├─ Is there a DNS record? dig stone-ai.net @<nameserver>
│     ├─ Recent DNS change? Check TTL — old record may be cached
│     │  ├─ Flush local cache: ipconfig /flushdns
│     │  └─ Wait for TTL to expire across resolvers
│     └─ Cloudflare proxy issue? Try dig stone-ai.net +trace
│
SYMPTOM: "DNS resolves to wrong IP"
│
├─ Check hosts file override:
│  ├─ Windows: type C:\Windows\System32\drivers\etc\hosts
│  ├─ Linux: cat /etc/hosts
│  └─ If entry exists → remove or update it
│
├─ Check DNS cache:
│  ├─ Flush and retry
│  └─ If persists → old record cached at resolver (wait for TTL)
│
├─ Multiple A records? (load balancing)
│  └─ dig stone-ai.net +short → may show multiple IPs (normal for Vercel)
│
└─ Check Cloudflare:
   ├─ Cloudflare proxy ON → resolves to Cloudflare IP (correct)
   ├─ Cloudflare proxy OFF → resolves to origin IP (direct)
   └─ If wrong → check Cloudflare dashboard DNS settings
```

---

## 3. Certificate Validation

### 3.1 TLS Certificate Chain

```
Trust hierarchy:
Root CA (pre-installed in OS/browser)
  └── Intermediate CA (bridges root to leaf)
      └── Leaf Certificate (your domain)

Stone AI chain:
  Root: ISRG Root X1 (Let's Encrypt) or Baltimore CyberTrust (Cloudflare)
  Intermediate: Cloudflare Inc ECC CA-3 (if Cloudflare proxy ON)
  Leaf: stone-ai.net (issued by Cloudflare or Let's Encrypt via Vercel)
```

### 3.2 Certificate Diagnostic Commands

```bash
# Check certificate details
openssl s_client -connect stone-ai.net:443 -servername stone-ai.net </dev/null 2>/dev/null | openssl x509 -noout -text

# Quick certificate info
openssl s_client -connect stone-ai.net:443 -servername stone-ai.net </dev/null 2>/dev/null | openssl x509 -noout -subject -issuer -dates -serial

# Example output:
# subject= /CN=stone-ai.net
# issuer= /C=US/O=Cloudflare, Inc./CN=Cloudflare Inc ECC CA-3
# notBefore=Mar  1 00:00:00 2026 GMT
# notAfter=Feb 28 23:59:59 2027 GMT

# Check certificate expiration
echo | openssl s_client -connect stone-ai.net:443 -servername stone-ai.net 2>/dev/null | openssl x509 -noout -enddate
# Output: notAfter=Feb 28 23:59:59 2027 GMT

# Check full certificate chain
openssl s_client -connect stone-ai.net:443 -servername stone-ai.net -showcerts </dev/null 2>/dev/null

# Verify certificate chain
openssl s_client -connect stone-ai.net:443 -servername stone-ai.net </dev/null 2>/dev/null | grep -E "Verify|depth"

# Check specific TLS version
openssl s_client -connect stone-ai.net:443 -tls1_2 </dev/null 2>/dev/null | grep "Protocol"
openssl s_client -connect stone-ai.net:443 -tls1_3 </dev/null 2>/dev/null | grep "Protocol"

# Check supported cipher suites
nmap --script ssl-enum-ciphers -p 443 stone-ai.net 2>/dev/null

# Test from Windows PowerShell
[Net.ServicePointManager]::SecurityProtocol
Invoke-WebRequest -Uri "https://stone-ai.net" -UseBasicParsing | Select-Object StatusCode, StatusDescription
```

### 3.3 Certificate Problem Decision Tree

```
SYMPTOM: "Certificate error" / "SSL handshake failed" / "ERR_CERT_*"
│
├─ ERR_CERT_DATE_INVALID / "certificate has expired"
│  ├─ Check: openssl ... -enddate
│  ├─ Expired → Renew certificate
│  │  ├─ Vercel: automatic (check Vercel dashboard → Domains)
│  │  ├─ Cloudflare: Universal SSL auto-renews (check Edge Certificates)
│  │  └─ Let's Encrypt: certbot renew --dry-run
│  └─ Not expired but error persists → Check system clock!
│     ├─ Wrong system time → cert appears expired
│     └─ Windows: w32tm /query /status | Linux: timedatectl
│
├─ ERR_CERT_AUTHORITY_INVALID / "self-signed certificate"
│  ├─ Missing intermediate certificate in chain
│  │  └─ Test: openssl s_client -showcerts → should show 2-3 certs
│  ├─ Self-signed cert (dev environment)
│  │  └─ Expected in dev. For Node.js: NODE_TLS_REJECT_UNAUTHORIZED=0 (ONLY in dev!)
│  └─ Corporate proxy intercepting HTTPS (MITM)
│     └─ Check issuer: if it's your company, not Cloudflare/Let's Encrypt → proxy
│
├─ ERR_CERT_COMMON_NAME_INVALID / "hostname mismatch"
│  ├─ Check: openssl ... -subject → does CN or SAN match your domain?
│  ├─ www.stone-ai.net vs stone-ai.net → need SAN for both
│  └─ Wildcard cert (*.stone-ai.net) doesn't cover bare domain
│
├─ ERR_SSL_VERSION_OR_CIPHER_MISMATCH
│  ├─ Server requires TLS 1.3 but client only supports 1.2
│  ├─ No common cipher suites
│  └─ Cloudflare: check SSL/TLS settings → Minimum TLS Version
│
└─ ERR_SSL_PROTOCOL_ERROR
   ├─ Connection reset during handshake
   ├─ Firewall blocking TLS traffic
   ├─ Server misconfiguration
   └─ Try: curl -vvv https://stone-ai.net 2>&1 | grep -i ssl
```

### 3.4 TLS Handshake Analysis

```bash
# Verbose TLS handshake (shows every step)
curl -vvv https://stone-ai.net 2>&1 | grep -E "^\*|^<|^>"

# Key lines to look for:
# * TLSv1.3 (OUT), TLS handshake, Client hello     ← client initiates
# * TLSv1.3 (IN), TLS handshake, Server hello       ← server responds
# * TLSv1.3 (IN), TLS handshake, Certificate        ← server sends cert
# * TLSv1.3 (IN), TLS handshake, Finished           ← handshake complete
# * SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384  ← negotiated cipher

# Time the TLS handshake specifically
curl -w "TLS handshake: %{time_appconnect}s\n" -o /dev/null -s https://stone-ai.net
# Good: < 100ms  |  Slow: 100-300ms  |  Bad: > 300ms

# If handshake is slow:
# 1. Large certificate chain? (reduce intermediates)
# 2. OCSP stapling disabled? (server must check revocation = extra round trip)
# 3. Server far away? (TLS requires round trips)
# 4. TLS 1.2 vs 1.3? (1.3 has fewer round trips)
```

---

## 4. Proxy Debugging

### 4.1 Proxy Configuration Sources

```bash
# Check environment variables
echo $HTTP_PROXY $HTTPS_PROXY $NO_PROXY
echo $http_proxy $https_proxy $no_proxy
# Note: Both uppercase and lowercase are checked by different tools

# Windows system proxy
netsh winhttp show proxy

# PowerShell
[System.Net.WebRequest]::DefaultWebProxy.GetProxy([Uri]"https://stone-ai.net")

# Git proxy
git config --global http.proxy
git config --global https.proxy

# npm proxy
npm config get proxy
npm config get https-proxy

# Docker proxy
docker info | grep -i proxy
# Check: ~/.docker/config.json and /etc/systemd/system/docker.service.d/http-proxy.conf
```

### 4.2 Proxy Problem Decision Tree

```
SYMPTOM: "Connection refused" or timeout through proxy
│
├─ Is the proxy set when it shouldn't be?
│  ├─ Unset: unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy
│  └─ Check all sources above — proxy can be set in many places
│
├─ Is the proxy NOT set when it should be?
│  ├─ Corporate network requiring proxy
│  ├─ Set: export HTTPS_PROXY=http://proxy.corp:8080
│  └─ Add NO_PROXY for internal services: export NO_PROXY=localhost,127.0.0.1,.internal
│
├─ PAC file issues (Proxy Auto-Configuration)
│  ├─ Check: Settings → Network → Proxy → Auto-detect or Use setup script
│  ├─ PAC file URL accessible? curl http://pac-url/proxy.pac
│  └─ PAC file returning correct proxy for your URL?
│
└─ Proxy auth required?
   └─ export HTTPS_PROXY=http://user:password@proxy:8080
```

### 4.3 Testing Connectivity Through and Without Proxy

```bash
# Test WITH proxy
curl -x http://proxy:8080 https://stone-ai.net

# Test WITHOUT proxy (bypass)
curl --noproxy '*' https://stone-ai.net

# Test if direct connection works
curl --connect-timeout 5 https://stone-ai.net

# Node.js: global-agent or https-proxy-agent for programmatic proxy support
```

---

## 5. CORS Troubleshooting

### 5.1 How CORS Works

```
CORS (Cross-Origin Resource Sharing) controls which websites can call your API.

Same-origin: https://stone-ai.net → https://stone-ai.net/api/chat ✅ (no CORS needed)
Cross-origin: https://other-site.com → https://stone-ai.net/api/chat ❌ (CORS blocks)

The browser sends a PREFLIGHT request (OPTIONS) before the actual request:

1. Browser → OPTIONS /api/chat (with Origin header)
2. Server → 200 with Access-Control-Allow-Origin, etc.
3. Browser → POST /api/chat (actual request)
4. Server → 200 with data + CORS headers

If step 2 fails or returns wrong headers → browser blocks step 3.
Server-to-server requests (Node.js, Python) DON'T have CORS — it's browser-only.
```

### 5.2 CORS Headers Reference

```
Access-Control-Allow-Origin: https://stone-ai.net  (or * for any origin)
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Request-ID
Access-Control-Allow-Credentials: true  (required for cookies/auth)
Access-Control-Max-Age: 86400  (preflight cache duration in seconds)
Access-Control-Expose-Headers: X-Request-ID  (headers the browser can read)

CRITICAL RULE: If Allow-Credentials is true, Allow-Origin CANNOT be *.
You must specify the exact origin.
```

### 5.3 CORS Debugging

```bash
# Simulate a CORS preflight request
curl -X OPTIONS https://stone-ai.net/api/chat \
  -H "Origin: https://other-site.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type, Authorization" \
  -v 2>&1 | grep -i "access-control"

# Check actual request CORS headers
curl -X POST https://stone-ai.net/api/chat \
  -H "Origin: https://stone-ai.net" \
  -H "Content-Type: application/json" \
  -v 2>&1 | grep -i "access-control"
```

### 5.4 CORS Decision Tree

```
SYMPTOM: "Access to fetch at '...' from origin '...' has been blocked by CORS policy"
│
├─ Read the FULL error message. It tells you exactly what's wrong:
│  │
│  ├─ "No 'Access-Control-Allow-Origin' header is present"
│  │  ├─ Server isn't returning CORS headers at all
│  │  ├─ Check: is the OPTIONS preflight handled?
│  │  ├─ Next.js API routes: add CORS headers in route handler
│  │  └─ Middleware: add CORS headers in middleware.ts
│  │
│  ├─ "The value of the 'Access-Control-Allow-Origin' header ... is not equal to the supplied origin"
│  │  ├─ Origin mismatch
│  │  ├─ Server returns: Access-Control-Allow-Origin: https://stone-ai.net
│  │  ├─ But request from: https://www.stone-ai.net (www mismatch)
│  │  ├─ Or: http vs https
│  │  └─ Fix: match the exact requesting origin, or add all valid origins
│  │
│  ├─ "Request header field X is not allowed by Access-Control-Allow-Headers"
│  │  ├─ Client sending a header not in Allow-Headers
│  │  └─ Add the header to Access-Control-Allow-Headers
│  │
│  ├─ "The value of the 'Access-Control-Allow-Credentials' header ... is not 'true'"
│  │  ├─ Request includes credentials (cookies) but server doesn't allow it
│  │  └─ Add: Access-Control-Allow-Credentials: true
│  │  └─ AND change Allow-Origin from * to specific origin
│  │
│  └─ "Method X is not allowed by Access-Control-Allow-Methods"
│     └─ Add the method to Access-Control-Allow-Methods
│
├─ Is it ONLY the preflight (OPTIONS) that fails?
│  ├─ Some servers don't handle OPTIONS at all
│  ├─ Vercel: Next.js API routes need explicit OPTIONS handler
│  └─ Check: does curl -X OPTIONS return 200?
│
└─ Does it work with Postman/curl but not browser?
   ├─ YES → This IS a CORS issue (Postman doesn't enforce CORS)
   └─ NO → This is a general API issue, not CORS
```

### 5.5 Next.js CORS Implementation

```typescript
// Option 1: Per-route CORS headers
// app/api/chat/route.ts
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://stone-ai.net',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Option 2: Middleware (applies to all API routes)
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request: Request) {
  const origin = request.headers.get('origin');
  const allowedOrigins = ['https://stone-ai.net', 'https://www.stone-ai.net'];

  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 200 });
    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.headers.set('Access-Control-Allow-Credentials', 'true');
    }
    return response;
  }

  const response = NextResponse.next();
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
  return response;
}
```

---

## 6. WebSocket Debugging

### 6.1 WebSocket Connection Lifecycle

```
1. HTTP Upgrade Request:
   GET /ws HTTP/1.1
   Upgrade: websocket
   Connection: Upgrade
   Sec-WebSocket-Key: xxx
   Sec-WebSocket-Version: 13

2. HTTP 101 Switching Protocols:
   HTTP/1.1 101 Switching Protocols
   Upgrade: websocket
   Connection: Upgrade
   Sec-WebSocket-Accept: xxx

3. Bidirectional message exchange (frames)

4. Close handshake (close frame with status code)
```

### 6.2 WebSocket Diagnostic Tools

```bash
# wscat — CLI WebSocket client
# npm install -g wscat
wscat -c wss://stone-ai.net/ws

# With headers
wscat -c wss://stone-ai.net/ws -H "Authorization: Bearer token"

# Chrome DevTools:
# Network tab → filter "WS" → click connection → Messages tab
# Shows all frames sent/received with timestamps

# Common WebSocket issues:
# 1. Connection drops after 60s → proxy/load balancer timeout
# 2. "WebSocket connection to '...' failed" → upgrade blocked by proxy
# 3. "Error during WebSocket handshake: Unexpected response code: 400" → server not handling upgrade
```

### 6.3 WebSocket on Vercel

```
Vercel does NOT support persistent WebSocket connections (serverless architecture).

Alternatives for Stone AI:
1. Server-Sent Events (SSE) — one-way server → client (works on Vercel)
2. Polling — client polls API every N seconds
3. External WebSocket service (Pusher, Ably, Socket.io with external server)
4. Vercel Edge Functions with streaming (for AI response streaming)

Current Stone AI approach:
- AI chat responses: SSE streaming via ReadableStream
- Real-time updates: Consider Pusher or polling for chat notifications
```

---

## 7. HTTP/2 Issues

### 7.1 HTTP/2 Diagnostics

```bash
# Check if site supports HTTP/2
curl -I --http2 https://stone-ai.net 2>&1 | head -1
# HTTP/2 200 ← supports HTTP/2
# HTTP/1.1 200 ← fallback to HTTP/1.1

# Verbose HTTP/2 info
curl -vvv --http2 https://stone-ai.net 2>&1 | grep -E "ALPN|HTTP/2|h2"

# Chrome: DevTools → Network → Protocol column (shows h2 for HTTP/2)
# Enable column: right-click header row → check "Protocol"
```

### 7.2 Common HTTP/2 Problems

```
Problem: Site falls back to HTTP/1.1
  Cause: Server or intermediary doesn't support HTTP/2
  Check: ALPN negotiation in TLS handshake
  Fix: Enable HTTP/2 in server config (Vercel/Cloudflare handle this automatically)

Problem: HTTP/2 push not working
  Note: HTTP/2 push is being deprecated. Don't rely on it.

Problem: Multiplexing not helping performance
  Cause: Head-of-line blocking at TCP level
  Note: HTTP/3 (QUIC) solves this — check Cloudflare settings

Problem: Large headers causing HPACK issues
  Cause: Too many cookies or custom headers exceeding HPACK table size
  Fix: Reduce cookie size, minimize custom headers
```

---

## 8. Redirect Loop Debugging

```bash
# Follow redirects and show each hop
curl -L -v https://stone-ai.net 2>&1 | grep -E "^< HTTP|^< [Ll]ocation"

# Limit redirects (detect loops)
curl -L --max-redirs 5 https://stone-ai.net

# Common redirect loops:
# 1. HTTP → HTTPS → HTTP → HTTPS (SSL misconfiguration)
#    Cloudflare: Enable "Always Use HTTPS" + set SSL to "Full (Strict)"
#
# 2. www → non-www → www (DNS/redirect misconfiguration)
#    Pick one (non-www for Stone AI) and redirect the other
#
# 3. /path → /path/ → /path (trailing slash inconsistency)
#    Configure consistent trailing slash behavior in Next.js:
#    next.config.ts: { trailingSlash: false }
#
# 4. Auth redirect loop: /dashboard → /login → /dashboard
#    Middleware sending authenticated users to login
#    Check: middleware.ts auth logic for incorrect condition
```

---

## 9. Stone AI Specific Network Issues

### 9.1 Vercel Cold Starts

```
SYMPTOM: First request after idle period takes 2-5 seconds

CAUSE: Serverless function instance was recycled. New instance must:
  1. Download function code
  2. Initialize Node.js runtime
  3. Load modules (Prisma, Clerk, etc.)
  4. Establish DB connection
  5. THEN handle the request

DIAGNOSIS:
  - Vercel Dashboard → Functions → check "Cold Start" label
  - curl timing: TTFB > 2s on first request, < 200ms on subsequent

MITIGATION:
  1. Reduce bundle size (smaller = faster cold start)
     - Check: npx @next/bundle-analyzer
     - Dynamic imports for heavy deps
  2. Prisma: use Data Proxy for connection pooling
  3. Use Vercel Edge Functions for latency-critical paths (no cold start)
  4. Vercel Pro: Fluid Compute (functions stay warm longer)
  5. External warm-up: cron job pinging critical endpoints every 5 min
```

### 9.2 Neon Connection Timeouts

```
SYMPTOM: "Connection terminated unexpectedly" or "Connection pool timeout"

CAUSES:
  1. Neon compute auto-suspends after 5 min of inactivity
     - First query after suspend takes 1-3 seconds (compute wake-up)
  2. Connection limit exceeded (Neon Free: 100 connections)
  3. Connection idle timeout (Neon closes idle connections after ~5 min)
  4. Vercel serverless: each function instance opens new connections

DIAGNOSIS:
  psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
  psql $DATABASE_URL -c "SELECT state, count(*) FROM pg_stat_activity GROUP BY state;"

FIXES:
  1. Use Neon connection pooling URL (PgBouncer):
     DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/dbname?pgbouncer=true
  2. Prisma connection pool settings:
     datasource db {
       url = env("DATABASE_URL")
       // Connection pool settings in PrismaClient:
       // new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } })
     }
  3. Set connection limit in Prisma:
     ?connection_limit=5 in DATABASE_URL (per serverless instance)
  4. Disable Neon auto-suspend for production (Neon Pro feature)
```

### 9.3 Clerk API Latency

```
SYMPTOM: Auth checks adding 200-500ms to every request

DIAGNOSIS:
  curl -w "TTFB: %{time_starttransfer}s\n" -o /dev/null -s \
    -H "Authorization: Bearer <session_token>" \
    https://api.clerk.com/v1/me

CAUSES:
  1. Clerk session token validation is a network call
  2. Cold Clerk SDK initialization
  3. Geographic distance to Clerk servers

FIXES:
  1. Use Clerk's session token JWT verification (local, no network call)
     - Clerk SDK does this automatically with CLERK_SECRET_KEY
  2. Cache auth results per request (middleware sets, routes read)
  3. Edge middleware: runs closer to user, faster auth
  4. Avoid redundant auth checks (middleware + route handler both checking)
```

### 9.4 Cloudflare-Specific Issues

```
SYMPTOM: "Error 522" (Connection timed out)
  - Cloudflare can't reach origin (Vercel)
  - Check: is Vercel up? vercel.com/status
  - Check: DNS pointing to correct Vercel CNAME?
  - dig stone-ai.net → should resolve to Vercel IPs through Cloudflare

SYMPTOM: "Error 524" (A timeout occurred)
  - Origin server took too long to respond
  - Cloudflare timeout: 100 seconds (Free), 600 seconds (Enterprise)
  - Fix: optimize the slow endpoint

SYMPTOM: "Error 521" (Web server is down)
  - Origin server refusing connections
  - Check: Vercel deployment status

SYMPTOM: SSL "too many redirects"
  - Cloudflare SSL set to "Flexible" but Vercel forces HTTPS
  - Fix: Set Cloudflare SSL to "Full (Strict)"

SYMPTOM: Mixed content warnings
  - HTTP resources loaded on HTTPS page
  - Fix: Cloudflare → SSL/TLS → Edge Certificates → "Always Use HTTPS" ON
  - Fix: Ensure all resource URLs use https:// or protocol-relative //
```

---

## 10. Network Diagnostic Quick Reference

### 10.1 The Network Debugging Sequence

```
SYMPTOM: "Can't connect to [service]"
│
├─ Step 1: Can you RESOLVE the hostname?
│  nslookup hostname
│  ├─ NO → DNS issue (Section 2)
│  └─ YES ↓
│
├─ Step 2: Can you REACH the IP?
│  ping -c 3 <IP>
│  ├─ NO → Network routing issue, firewall, or server down
│  └─ YES ↓
│
├─ Step 3: Can you CONNECT to the port?
│  curl -v telnet://<host>:<port> (or: nc -zv <host> <port>)
│  ├─ NO → Firewall blocking port, service not listening
│  └─ YES ↓
│
├─ Step 4: Does TLS work?
│  openssl s_client -connect <host>:443
│  ├─ NO → Certificate issue (Section 3)
│  └─ YES ↓
│
├─ Step 5: Does HTTP work?
│  curl -v https://<host>/
│  ├─ NO → Application error, CORS, redirect loop
│  └─ YES → Connection works! Issue is in application logic.
│
└─ At each step: is there a PROXY in the way? (Section 4)
```

### 10.2 One-Line Diagnostics

```bash
# Full connection timing breakdown
curl -w "\nDNS: %{time_namelookup}\nConnect: %{time_connect}\nTLS: %{time_appconnect}\nTTFB: %{time_starttransfer}\nTotal: %{time_total}\n" -o /dev/null -s https://stone-ai.net

# Check if port is open
nc -zv stone-ai.net 443 2>&1

# MTU path discovery (find packet size issues)
ping -M do -s 1472 stone-ai.net

# Traceroute (find where packets are being lost)
traceroute stone-ai.net
# Windows: tracert stone-ai.net

# Check for packet loss
ping -c 100 stone-ai.net | tail -3

# Current network connections
ss -tunapl  # Linux
netstat -an  # Windows
```

---

*This seed gives Wiz the tools to diagnose every software-layer network problem between the browser and the database. When the network lies — and it always lies — Wiz finds the truth.*
