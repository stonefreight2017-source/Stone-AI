# Network Latency Diagnostics

> Computer Wiz Quality Seed — DNS, TLS, TTFB, CDN & Network Path Analysis

## Purpose

Network latency is the invisible tax on every user interaction. A 200ms database query means nothing if DNS resolution takes 500ms and TLS handshake adds another 300ms. This seed gives Wiz the tools to measure, diagnose, and optimize every hop between the user's browser and Stone AI's servers.

---

## 1. DNS Resolution Timing

### Understanding DNS Resolution

```
User types stone-ai.net →
  1. Browser DNS cache check (~0ms)
  2. OS DNS cache check (~0ms)
  3. Router DNS cache (~1-5ms)
  4. ISP recursive resolver (~10-50ms)
  5. Root nameserver → .net TLD → Cloudflare authoritative (~50-200ms)

Total: 0ms (cached) to 200ms+ (cold)
```

### Measuring DNS Resolution

```bash
# Basic DNS timing
dig stone-ai.net +stats
# Look for "Query time" at the bottom

# Detailed timing with multiple resolvers
dig @1.1.1.1 stone-ai.net +stats     # Cloudflare DNS
dig @8.8.8.8 stone-ai.net +stats     # Google DNS
dig @9.9.9.9 stone-ai.net +stats     # Quad9

# Full resolution chain timing
dig +trace stone-ai.net

# Using curl for DNS timing
curl -o /dev/null -s -w "\
  DNS Lookup:  %{time_namelookup}s\n\
  TCP Connect: %{time_connect}s\n\
  TLS Handshake: %{time_appconnect}s\n\
  TTFB: %{time_starttransfer}s\n\
  Total: %{time_total}s\n" https://stone-ai.net

# Windows-specific (PowerShell)
Measure-Command { Resolve-DnsName stone-ai.net }
```

### DNS Performance Issues

```
Issue: High DNS resolution time (>100ms)
Causes:
  - Authoritative nameserver is far from user
  - DNS record TTL too low (forces frequent lookups)
  - DNSSEC validation overhead
  - DNS provider performance

Stone AI Specifics (Cloudflare DNS):
  - Cloudflare proxy ON → DNS resolves to Cloudflare edge (fast globally)
  - TTL controlled by Cloudflare when proxied (auto = 300s)
  - For non-proxied records: set TTL to 3600s minimum

Optimization:
  1. Keep Cloudflare proxy ON (orange cloud) for all web traffic
  2. Use dns-prefetch in HTML: <link rel="dns-prefetch" href="//api.stone-ai.net">
  3. Preconnect for critical resources: <link rel="preconnect" href="//stone-ai.net">
```

### Monitoring DNS from Application

```javascript
const dns = require('dns');
const { performance } = require('perf_hooks');

async function measureDNS(hostname) {
  const start = performance.now();
  return new Promise((resolve, reject) => {
    dns.resolve4(hostname, (err, addresses) => {
      const duration = performance.now() - start;
      if (err) reject({ error: err.message, duration });
      else resolve({ addresses, duration: duration.toFixed(2) + 'ms' });
    });
  });
}

// Browser-side DNS timing via Resource Timing API
const resources = performance.getEntriesByType('resource');
for (const r of resources) {
  if (r.domainLookupEnd - r.domainLookupStart > 50) {
    console.warn(`Slow DNS for ${r.name}: ${(r.domainLookupEnd - r.domainLookupStart).toFixed(1)}ms`);
  }
}
```

---

## 2. TLS Handshake Analysis

### TLS Handshake Flow

```
TLS 1.2 (2 round trips):
  Client → Server: ClientHello (cipher suites, TLS version)
  Server → Client: ServerHello, Certificate, ServerHelloDone
  Client → Server: ClientKeyExchange, ChangeCipherSpec, Finished
  Server → Client: ChangeCipherSpec, Finished
  Total: 2 RTT (~100-200ms on 50ms latency)

TLS 1.3 (1 round trip):
  Client → Server: ClientHello + KeyShare
  Server → Client: ServerHello + KeyShare + EncryptedExtensions + Certificate + Finished
  Client → Server: Finished
  Total: 1 RTT (~50-100ms on 50ms latency)

TLS 1.3 0-RTT (resumed session):
  Client → Server: ClientHello + KeyShare + EarlyData
  Total: 0 RTT for early data!
```

### Measuring TLS Performance

```bash
# OpenSSL connection test with timing
openssl s_client -connect stone-ai.net:443 -servername stone-ai.net < /dev/null 2>&1 | grep -E "Protocol|Cipher|Verify"

# TLS version and cipher check
curl -v --tlsv1.3 https://stone-ai.net 2>&1 | grep -E "SSL|TLS|cipher"

# Full connection timing breakdown
curl -o /dev/null -s -w "\
  DNS:        %{time_namelookup}s\n\
  TCP:        %{time_connect}s\n\
  TLS:        %{time_appconnect}s\n\
  Redirect:   %{time_redirect}s\n\
  TTFB:       %{time_starttransfer}s\n\
  Total:      %{time_total}s\n\
  TLS-only:   $(echo \"%{time_appconnect} - %{time_connect}\" | bc)s\n" \
  https://stone-ai.net

# Check certificate chain
openssl s_client -showcerts -connect stone-ai.net:443 < /dev/null 2>/dev/null | openssl x509 -noout -text | grep -E "Issuer|Subject|Not Before|Not After"
```

### TLS Optimization

```
1. Use TLS 1.3 (Cloudflare enables by default)
   - 1 RTT instead of 2
   - 0-RTT for returning visitors
   - Stronger ciphers, faster handshake

2. OCSP Stapling (Cloudflare does this automatically)
   - Server includes certificate validity proof
   - Eliminates client → CA round trip

3. HTTP/2 and HTTP/3
   - HTTP/2: Multiplexing over single TLS connection
   - HTTP/3 (QUIC): 0-RTT connection establishment

4. Session Resumption
   - TLS session tickets: client stores session, resumes without full handshake
   - Reduces subsequent connections to 1 RTT (TLS 1.2) or 0 RTT (TLS 1.3)

5. Certificate Chain Optimization
   - Keep chain short: leaf + intermediate only
   - Don't include root CA (browsers have it)
   - Use ECDSA certificates (smaller than RSA, faster)
```

---

## 3. TTFB Optimization

### What Contributes to TTFB

```
TTFB = DNS + TCP + TLS + Server Processing + Network Transit

Breakdown for stone-ai.net:
  DNS:        0-200ms (cached: 0ms, cold: 50-200ms)
  TCP:        10-100ms (depends on distance to Cloudflare edge)
  TLS:        10-150ms (TLS 1.3: ~50ms, TLS 1.2: ~100ms)
  Server:     50-500ms (Vercel function cold start + processing)
  Transit:    10-100ms (response first byte back to client)

TOTAL:        80-1050ms typical range
TARGET:       < 600ms for 95th percentile
```

### Measuring TTFB

```javascript
// Browser-side TTFB measurement
const navigation = performance.getEntriesByType('navigation')[0];
const ttfb = navigation.responseStart - navigation.requestStart;
console.log(`TTFB: ${ttfb.toFixed(0)}ms`);

// Detailed breakdown
const timing = {
  dns: navigation.domainLookupEnd - navigation.domainLookupStart,
  tcp: navigation.connectEnd - navigation.connectStart,
  tls: navigation.secureConnectionStart > 0
    ? navigation.connectEnd - navigation.secureConnectionStart
    : 0,
  request: navigation.responseStart - navigation.requestStart,
  ttfb: navigation.responseStart - navigation.fetchStart,
};

// Server-side TTFB tracking
function ttfbMiddleware(req, res, next) {
  const start = process.hrtime.bigint();

  const originalWrite = res.write;
  res.write = function(...args) {
    const ttfb = Number(process.hrtime.bigint() - start) / 1e6;
    res.setHeader('Server-Timing', `ttfb;dur=${ttfb.toFixed(1)}`);
    res.write = originalWrite;
    return originalWrite.apply(this, args);
  };

  next();
}
```

### TTFB Optimization Strategies

```
1. Edge Caching (Cloudflare)
   - Cache static pages at the edge
   - Use Cache-Control headers properly
   - Stone AI: Cache landing pages, agent listings, help articles

2. Serverless Function Optimization
   - Minimize cold start time (smaller bundles)
   - Keep functions warm with ping endpoint
   - Use edge functions for latency-critical paths

3. Database Query Optimization
   - Connection pooling (Neon pooler)
   - Query caching where appropriate
   - Read replicas for read-heavy paths

4. Response Streaming
   - Start sending HTML before all data is ready
   - Next.js streaming SSR with Suspense
   - Send above-the-fold content first

5. Preloading and Prefetching
   - <link rel="preload"> for critical resources
   - <link rel="prefetch"> for likely next pages
   - Next.js automatic prefetching for <Link> components
```

---

## 4. CDN Routing Analysis

### Understanding CDN Routing

```
User → Anycast IP → Nearest Cloudflare PoP → Origin (Vercel)

Cloudflare has 300+ PoPs worldwide. Request routing:
  1. DNS resolves to Cloudflare anycast IP
  2. BGP routing sends packet to nearest PoP
  3. PoP checks cache → if HIT, serves directly
  4. If MISS → routes to origin (Vercel edge network)
  5. Vercel edge → Vercel function → response

Potential issues:
  - BGP routing sends to wrong PoP (ISP routing quirks)
  - PoP capacity issues → request rerouted to distant PoP
  - Origin fetch latency (Vercel region vs user location)
```

### Diagnosing CDN Performance

```bash
# Check which Cloudflare PoP is serving you
curl -sI https://stone-ai.net | grep cf-ray
# cf-ray: 1234567890-IAD  ← IAD = Washington DC PoP

# Full CDN headers analysis
curl -sI https://stone-ai.net | grep -E "cf-|x-vercel|cache-control|age|server"
# cf-cache-status: HIT/MISS/DYNAMIC/BYPASS
# x-vercel-cache: HIT/MISS/STALE
# age: 300 (seconds since cached)

# Test from different locations (use online tools or VPN)
# Cloudflare Trace endpoint:
curl https://stone-ai.net/cdn-cgi/trace
# Shows: loc=US, colo=IAD, tls=TLSv1.3, http=h2
```

### CDN Cache Strategy for Stone AI

```
Static Assets (CSS, JS, images):
  Cache-Control: public, max-age=31536000, immutable
  → Cached at CDN edge indefinitely (use content hashing for cache busting)

Landing Pages:
  Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
  → CDN caches for 1 hour, serves stale while revalidating for 24h

API Responses:
  Cache-Control: private, no-cache
  → Never cached at CDN (user-specific data)

Agent Listings:
  Cache-Control: public, s-maxage=300, stale-while-revalidate=3600
  → CDN caches for 5 minutes, stale for 1 hour

Help Articles:
  Cache-Control: public, s-maxage=86400, stale-while-revalidate=604800
  → CDN caches for 1 day, stale for 1 week
```

---

## 5. Traceroute Interpretation

### Understanding Traceroute

```bash
# Basic traceroute
traceroute stone-ai.net        # Linux/Mac
tracert stone-ai.net           # Windows

# MTR (better — combines ping + traceroute)
mtr stone-ai.net               # Linux
# Shows: Loss%, Snt, Last, Avg, Best, Wrst, StDev per hop

# TCP traceroute (bypasses ICMP blocking)
traceroute -T -p 443 stone-ai.net
```

### Reading Traceroute Results

```
Hop  Host                    Loss%  Avg(ms)  Interpretation
1    192.168.1.1             0%     1.2      Local router — normal
2    10.0.0.1                0%     8.5      ISP gateway — normal
3    isp-router.example.com  0%     15.3     ISP backbone — normal
4    * * *                   100%   —        ICMP blocked — NOT a problem if next hop responds
5    cloudflare-edge.net     0%     22.1     Cloudflare PoP — good latency
6    172.71.x.x              0%     23.0     Cloudflare internal — destination

COMMON MISINTERPRETATION:
  Hop 4 showing * * * does NOT mean a problem.
  Many routers deprioritize/block ICMP. Only worry if:
  - Loss continues for ALL subsequent hops
  - Latency increases dramatically at that hop

REAL PROBLEMS:
  - Consistent >5% loss at a hop AND downstream hops
  - Latency jump of >50ms at a single hop (congestion point)
  - Latency decreasing between hops (ICMP timing artifact — ignore)
```

### Network Path Analysis

```bash
# Identify the bottleneck hop
# Look for where latency jumps significantly:

Hop 5: 25ms    ← normal
Hop 6: 120ms   ← JUMP! This hop or the link to it is the bottleneck
Hop 7: 125ms   ← incremental increase, not the problem

# Submarine cable detection (intercontinental jump)
Hop 5 (NYC):  25ms
Hop 6 (LDN): 90ms   ← 65ms jump = transatlantic cable (~70ms is normal)

# Congestion detection
Morning: Hop 6 = 25ms
Evening: Hop 6 = 180ms   ← Same hop, much slower = congestion
```

---

## 6. HTTP/2 and HTTP/3 Diagnostics

### HTTP/2 Connection Analysis

```bash
# Check if HTTP/2 is in use
curl -v --http2 https://stone-ai.net 2>&1 | grep "< HTTP/"
# Should show: < HTTP/2 200

# Check ALPN negotiation
openssl s_client -alpn h2,http/1.1 -connect stone-ai.net:443 < /dev/null 2>&1 | grep "ALPN"
# ALPN protocol: h2
```

```javascript
// Browser-side protocol detection
const entries = performance.getEntriesByType('resource');
for (const entry of entries) {
  console.log(`${entry.name}: ${entry.nextHopProtocol}`);
  // Shows: "h2" for HTTP/2, "h3" for HTTP/3
}
```

### HTTP/3 (QUIC) Verification

```bash
# Check HTTP/3 support
curl --http3 https://stone-ai.net 2>&1 | head -5
# Requires curl 7.66+ with HTTP/3 support

# Check Alt-Svc header (how browsers discover HTTP/3)
curl -sI https://stone-ai.net | grep alt-svc
# alt-svc: h3=":443"; ma=86400
```

### Multiplexing Efficiency

```javascript
// Measure concurrent request performance
async function measureMultiplexing(url, count = 10) {
  const start = performance.now();

  const requests = Array.from({ length: count }, () =>
    fetch(url).then(r => r.text())
  );

  await Promise.all(requests);
  const total = performance.now() - start;

  // With HTTP/2 multiplexing, total should be close to single request time
  // With HTTP/1.1, total ≈ single_request * (count / max_connections)
  console.log(`${count} requests in ${total.toFixed(0)}ms (${(total / count).toFixed(0)}ms avg)`);
}
```

---

## 7. Latency Budget for Stone AI

### Request Latency Budget

```
Component          Target    Max     Notes
─────────────────────────────────────────────
DNS Resolution     0ms       50ms    Should be cached
TCP Connect        15ms      50ms    To Cloudflare edge
TLS Handshake      20ms      75ms    TLS 1.3 + session resumption
CDN Edge           5ms       20ms    Cloudflare processing
Origin Fetch       50ms      200ms   Vercel function
DB Query           20ms      100ms   Neon via pooled connection
AI Processing      200ms     2000ms  vLLM/Claude (streaming start)
Response Transit   15ms      50ms    First byte back to user
─────────────────────────────────────────────
TOTAL TTFB         325ms     2545ms  Non-AI: <500ms target
```

### Monitoring Network Performance

```javascript
// Client-side performance monitoring
class NetworkMonitor {
  constructor() {
    this.metrics = [];
    this._observeResources();
    this._observeNavigation();
  }

  _observeResources() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
          this.metrics.push({
            url: entry.name,
            dns: entry.domainLookupEnd - entry.domainLookupStart,
            tcp: entry.connectEnd - entry.connectStart,
            tls: entry.secureConnectionStart > 0
              ? entry.connectEnd - entry.secureConnectionStart : 0,
            ttfb: entry.responseStart - entry.requestStart,
            download: entry.responseEnd - entry.responseStart,
            total: entry.duration,
            protocol: entry.nextHopProtocol,
            size: entry.transferSize,
          });
        }
      }
    });
    observer.observe({ entryTypes: ['resource'] });
  }

  _observeNavigation() {
    window.addEventListener('load', () => {
      const nav = performance.getEntriesByType('navigation')[0];
      this.navigation = {
        dns: nav.domainLookupEnd - nav.domainLookupStart,
        tcp: nav.connectEnd - nav.connectStart,
        tls: nav.secureConnectionStart > 0
          ? nav.connectEnd - nav.secureConnectionStart : 0,
        ttfb: nav.responseStart - nav.fetchStart,
        domParsing: nav.domInteractive - nav.responseEnd,
        domContentLoaded: nav.domContentLoadedEventEnd - nav.fetchStart,
        load: nav.loadEventEnd - nav.fetchStart,
      };
    });
  }

  getSummary() {
    const apiCalls = this.metrics.filter(m => m.url.includes('/api/'));
    return {
      navigation: this.navigation,
      apiCalls: {
        count: apiCalls.length,
        avgTTFB: apiCalls.reduce((sum, m) => sum + m.ttfb, 0) / apiCalls.length,
        p95TTFB: percentile(apiCalls.map(m => m.ttfb), 95),
        avgTotal: apiCalls.reduce((sum, m) => sum + m.total, 0) / apiCalls.length,
      },
    };
  }
}
```

---

## 8. Diagnostic Toolkit Commands

### Quick Network Health Check

```bash
# Full connection diagnostic
echo "=== DNS ==="
dig +short stone-ai.net
echo "=== PING ==="
ping -c 5 stone-ai.net
echo "=== CURL TIMING ==="
curl -o /dev/null -s -w "DNS: %{time_namelookup}s\nTCP: %{time_connect}s\nTLS: %{time_appconnect}s\nTTFB: %{time_starttransfer}s\nTotal: %{time_total}s\nHTTP: %{http_version}\nSize: %{size_download} bytes\n" https://stone-ai.net
echo "=== HEADERS ==="
curl -sI https://stone-ai.net | grep -E "cf-|cache|server|content-type|x-vercel"
```

### Continuous Latency Monitoring

```bash
# Monitor TTFB every 10 seconds
while true; do
  echo -n "$(date +%H:%M:%S) TTFB: "
  curl -o /dev/null -s -w "%{time_starttransfer}s\n" https://stone-ai.net
  sleep 10
done
```

### WebSocket Latency Test

```javascript
// Test WebSocket connection latency (if Stone AI uses WS)
function measureWebSocketLatency(url) {
  return new Promise((resolve) => {
    const ws = new WebSocket(url);
    const results = [];
    let pingSent;

    ws.onopen = () => {
      for (let i = 0; i < 10; i++) {
        setTimeout(() => {
          pingSent = Date.now();
          ws.send(JSON.stringify({ type: 'ping', ts: pingSent }));
        }, i * 1000);
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'pong') {
        results.push(Date.now() - data.ts);
        if (results.length === 10) {
          ws.close();
          resolve({
            min: Math.min(...results),
            max: Math.max(...results),
            avg: results.reduce((a, b) => a + b) / results.length,
            p95: results.sort((a, b) => a - b)[Math.floor(results.length * 0.95)],
          });
        }
      }
    };
  });
}
```

---

## Stone AI Application Notes

- **Cloudflare proxy**: Always ON for stone-ai.net — provides CDN, TLS, DDoS protection
- **Cloudflare SSL mode**: Full (strict) — end-to-end encryption
- **Vercel edge network**: Automatically routes to nearest Vercel region
- **Neon DB location**: Match Vercel function region to Neon region for lowest DB latency
- **AI streaming**: TTFB for AI responses = time to first token; stream immediately
- **Preconnect**: Add `<link rel="preconnect">` for Clerk, Stripe, and any third-party domains
- **HTTP/3**: Enabled on Cloudflare by default — significant improvement for high-latency connections

---

*Computer Wiz — The Diagnostician. Every millisecond of latency has a name, an address, and a fix.*
