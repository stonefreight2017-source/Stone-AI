# K-7: Golden Knowledge — Numerical Reference
# Curated numbers that agents frequently get wrong
# Palace USB Package — Golden Seed

---

## PURPOSE
LLMs hallucinate numbers more than any other type of fact. Port numbers, size limits,
timeout values, pricing — all frequently wrong. This seed provides a curated reference
of numbers that agents need to be accurate about. Organized for fast lookup.

---

## 1. COMMON NETWORK PORTS

### Well-Known Ports (0-1023)
| Port | Service | Protocol | Notes |
|------|---------|----------|-------|
| 20 | FTP Data | TCP | Active mode data transfer |
| 21 | FTP Control | TCP | Command/control channel |
| 22 | SSH/SFTP | TCP | Secure shell, secure file transfer |
| 23 | Telnet | TCP | NEVER use (unencrypted) |
| 25 | SMTP | TCP | Email sending (often blocked by ISPs) |
| 53 | DNS | TCP/UDP | Domain name resolution |
| 67/68 | DHCP | UDP | Server (67) / Client (68) |
| 80 | HTTP | TCP | Unencrypted web traffic |
| 110 | POP3 | TCP | Email retrieval |
| 123 | NTP | UDP | Network Time Protocol |
| 143 | IMAP | TCP | Email retrieval (keeps mail on server) |
| 443 | HTTPS | TCP | Encrypted web traffic (TLS) |
| 465 | SMTPS | TCP | SMTP over TLS (legacy, but revived) |
| 587 | SMTP Submission | TCP | Email sending (with STARTTLS) |
| 993 | IMAPS | TCP | IMAP over TLS |
| 995 | POP3S | TCP | POP3 over TLS |

### Development / Application Ports
| Port | Service | Notes |
|------|---------|-------|
| 3000 | Next.js / React dev | Default dev server |
| 3001 | Common alt dev port | When 3000 is taken |
| 4200 | Angular dev | Default ng serve |
| 5000 | Flask / Python | Default Flask dev |
| 5173 | Vite dev | Default Vite dev server |
| 5432 | PostgreSQL | Default PG port |
| 6379 | Redis | Default Redis port |
| 8080 | HTTP alt / Proxy | Common for dev servers, proxies |
| 8443 | HTTPS alt | Common for dev HTTPS |
| 8888 | Jupyter Notebook | Default Jupyter port |
| 9090 | Prometheus | Default metrics port |
| 9200 | Elasticsearch | HTTP API port |
| 9300 | Elasticsearch | Node communication |
| 27017 | MongoDB | Default Mongo port |

### Infrastructure Ports
| Port | Service |
|------|---------|
| 2375 | Docker daemon (unencrypted) |
| 2376 | Docker daemon (TLS) |
| 3306 | MySQL / MariaDB |
| 5672 | RabbitMQ (AMQP) |
| 6443 | Kubernetes API server |
| 8500 | Consul |
| 9092 | Kafka |
| 11211 | Memcached |
| 15672 | RabbitMQ Management UI |

---

## 2. HTTP TIMEOUTS & LIMITS

### Platform-Specific Timeouts
| Platform | Timeout | Notes |
|----------|---------|-------|
| Vercel Serverless (Hobby) | 10 seconds | Function execution time |
| Vercel Serverless (Pro) | 60 seconds | Function execution time |
| Vercel Serverless (Enterprise) | 900 seconds | Function execution time |
| Vercel Edge Functions | 30 seconds | Edge runtime |
| AWS Lambda | 900 seconds (15 min) | Maximum configurable |
| AWS API Gateway | 30 seconds | Hard limit, cannot increase |
| Cloudflare Workers | 30 seconds (paid) | 10ms CPU time free tier |
| Netlify Functions | 10 seconds (free), 26 seconds (paid) | Execution time |
| Heroku | 30 seconds | Request timeout |
| Nginx (default) | 60 seconds | proxy_read_timeout |

### Request/Response Size Limits
| Platform/Context | Limit | Notes |
|-----------------|-------|-------|
| Vercel request body | 4.5 MB | Serverless function input |
| Vercel Edge request | 4.5 MB | Edge function input |
| AWS API Gateway | 10 MB | Request/response payload |
| AWS Lambda payload | 6 MB (sync), 256 KB (async) | Invocation payload |
| Cloudflare Workers | 100 MB (paid) | Request body |
| Next.js API body (default) | 1 MB | Configurable in next.config |
| Nginx (default) | 1 MB | client_max_body_size |
| Express (default) | 100 KB | body-parser default |
| HTTP/2 header | 16 KB typical | Varies by implementation |
| URL length | ~2,048 chars | Browser limit (not spec limit) |
| Cookie | 4 KB per cookie | Browser limit |
| localStorage | 5 MB per origin | Browser limit |
| sessionStorage | 5 MB per origin | Browser limit |

---

## 3. DATABASE LIMITS & NUMBERS

### PostgreSQL
| Parameter | Default/Limit | Notes |
|-----------|--------------|-------|
| Max connections | 100 (default) | Configurable, typically 200-500 |
| Max databases | No hard limit | Limited by shared_buffers |
| Max table size | 32 TB | Per table |
| Max row size | ~1.6 TB | With TOAST |
| Max column count | 250-1600 | Depends on column types |
| Max index size | 32 TB | Per index |
| Identifier length | 63 bytes | Table/column names |
| Text field max | 1 GB | Per field |
| JSONB max size | 1 GB | Per field |
| Integer types | smallint (2B), int (4B), bigint (8B) | -32K/2B/9.2Q max |

### PostgreSQL Integer Ranges
| Type | Size | Min | Max |
|------|------|-----|-----|
| smallint | 2 bytes | -32,768 | 32,767 |
| integer | 4 bytes | -2,147,483,648 | 2,147,483,647 |
| bigint | 8 bytes | -9,223,372,036,854,775,808 | 9,223,372,036,854,775,807 |
| serial | 4 bytes | 1 | 2,147,483,647 |
| bigserial | 8 bytes | 1 | 9,223,372,036,854,775,807 |

### Neon (Serverless PostgreSQL)
| Parameter | Free Tier | Pro |
|-----------|-----------|-----|
| Compute hours | 191.9 hrs/mo | 300 hrs/mo included |
| Storage | 0.5 GB | 10 GB included |
| Branches | 10 | Unlimited |
| Projects | 1 | 10 |
| History retention | 24 hours | 7 days |

### Prisma
| Parameter | Value | Notes |
|-----------|-------|-------|
| Max query timeout | 15 seconds | Default, configurable |
| Connection pool | 2-10 | Default based on CPU cores |
| Max batch size | 32,767 | createMany batch limit |
| Transaction timeout | 5 seconds | Default, configurable |
| Field name max | 63 chars | PostgreSQL identifier limit |

---

## 4. AI MODEL TOKEN LIMITS & PRICING (as of early 2025)

### Context Windows
| Model | Context Window | Notes |
|-------|---------------|-------|
| GPT-4o | 128K tokens | ~96K words |
| GPT-4o mini | 128K tokens | Budget option |
| GPT-4 Turbo | 128K tokens | |
| Claude 3.5 Sonnet | 200K tokens | ~150K words |
| Claude 3 Opus | 200K tokens | Most capable Claude |
| Claude 3 Haiku | 200K tokens | Fastest Claude |
| LLaMA 3 70B | 128K tokens | Open weights |
| LLaMA 3 8B | 128K tokens | Open weights |
| Qwen 2.5 32B | 32K tokens | Default, expandable |
| Mistral Large | 128K tokens | |
| Gemini 1.5 Pro | 2M tokens | Largest context window |

### Token Approximations
```
1 token ≈ 4 characters (English)
1 token ≈ 0.75 words (English)
1 word ≈ 1.3 tokens
100 tokens ≈ 75 words
1,000 tokens ≈ 750 words ≈ 1.5 pages
1 page of text ≈ 500-700 tokens
1 line of code ≈ 10-20 tokens
A typical function (20 lines) ≈ 200-400 tokens
```

### API Pricing (approximate, per 1M tokens, as of early 2025)
| Model | Input | Output | Notes |
|-------|-------|--------|-------|
| GPT-4o | $2.50 | $10.00 | |
| GPT-4o mini | $0.15 | $0.60 | Budget option |
| Claude 3.5 Sonnet | $3.00 | $15.00 | |
| Claude 3 Haiku | $0.25 | $1.25 | |
| Claude 3 Opus | $15.00 | $75.00 | Most expensive |
| Gemini 1.5 Pro | $3.50 | $10.50 | |
| Gemini 1.5 Flash | $0.075 | $0.30 | Cheapest major model |

**Self-hosted (Stone AI Palace)**: Qwen 2.5 32B AWQ on RTX 5090 (32GB VRAM)
- Cost: electricity only (~$0.15-0.30/hr GPU power draw)
- No per-token cost after hardware investment

---

## 5. LATENCY BENCHMARKS

### Memory/Storage Hierarchy
| Operation | Latency | Notes |
|-----------|---------|-------|
| L1 cache reference | ~1 ns | |
| L2 cache reference | ~4 ns | |
| L3 cache reference | ~10 ns | |
| RAM access | ~100 ns | |
| NVMe SSD read | ~10-25 μs | Random 4KB read |
| SATA SSD read | ~50-100 μs | Random 4KB read |
| HDD seek | ~5-10 ms | Mechanical seek |

### Network Latency
| Operation | Latency | Notes |
|-----------|---------|-------|
| Same datacenter | 0.5-1 ms | Between servers |
| Same region (AWS) | 1-2 ms | Between AZs |
| US coast to coast | 40-80 ms | Round trip |
| US to Europe | 80-120 ms | Round trip |
| US to Asia | 150-250 ms | Round trip |
| DNS lookup | 1-100 ms | Cached vs uncached |
| TLS handshake | 10-50 ms | Per connection |
| CDN edge | 5-30 ms | From user to nearest edge |

### Database Operations
| Operation | Latency | Notes |
|-----------|---------|-------|
| Simple PG query (indexed) | 1-5 ms | SELECT by primary key |
| Complex PG query | 10-100 ms | JOINs, aggregations |
| Full table scan (1M rows) | 100-1000 ms | Without proper index |
| Redis GET | 0.1-0.5 ms | In-memory |
| Redis SET | 0.1-0.5 ms | In-memory |
| MongoDB find (indexed) | 1-10 ms | With index |

### Web Performance Budgets
| Metric | Good | Needs Work | Poor |
|--------|------|-----------|------|
| LCP (Largest Contentful Paint) | < 2.5s | 2.5-4s | > 4s |
| FID (First Input Delay) | < 100ms | 100-300ms | > 300ms |
| CLS (Cumulative Layout Shift) | < 0.1 | 0.1-0.25 | > 0.25 |
| INP (Interaction to Next Paint) | < 200ms | 200-500ms | > 500ms |
| TTFB (Time to First Byte) | < 800ms | 800ms-1.8s | > 1.8s |
| Total page weight | < 1 MB | 1-3 MB | > 3 MB |
| JavaScript bundle | < 200 KB | 200-500 KB | > 500 KB |

---

## 6. RATE LIMITS BY SERVICE

### Clerk (Authentication)
| Endpoint | Limit |
|----------|-------|
| Frontend API | 50 req/10s per user |
| Backend API | 20 req/s per key |
| Sign-in attempts | 10/min per IP |

### Stripe
| Plan | Limit | Notes |
|------|-------|-------|
| Test mode | 25 req/s | Per API key |
| Live mode | 100 req/s | Per API key |
| Webhook delivery | 5 retries | Over 3 days |

### GitHub API
| Auth Type | Limit |
|-----------|-------|
| Unauthenticated | 60 req/hr per IP |
| Authenticated (token) | 5,000 req/hr |
| GitHub App | 5,000 req/hr per installation |
| Search API | 30 req/min (authenticated) |

### Vercel
| Resource | Hobby | Pro |
|----------|-------|-----|
| Deployments | 100/day | 6,000/day |
| Serverless function invocations | 100K/day | 1M/day |
| Edge function invocations | 500K/day | 5M/day |
| Build minutes | 6,000/mo | 24,000/mo |

### Cloudflare
| Plan | Workers Requests |
|------|-----------------|
| Free | 100,000/day |
| Paid ($5/mo) | 10M/mo included |
| R2 free tier | 10M Class A + 1M Class B + 10 GB storage/mo |

### Anthropic API
| Tier | RPM | TPM (tokens/min) |
|------|-----|-------------------|
| Tier 1 | 50 | 40,000 |
| Tier 2 | 1,000 | 80,000 |
| Tier 3 | 2,000 | 160,000 |
| Tier 4 | 4,000 | 400,000 |

---

## 7. SIZE LIMITS & CONVERSIONS

### Data Size Units
```
1 KB = 1,024 bytes (KiB technically, but KB commonly used)
1 MB = 1,024 KB = 1,048,576 bytes
1 GB = 1,024 MB = 1,073,741,824 bytes
1 TB = 1,024 GB = 1,099,511,627,776 bytes

Storage vendors use decimal (1 GB = 1,000,000,000 bytes)
OS uses binary (1 GiB = 1,073,741,824 bytes)
This is why a "500 GB" drive shows as ~465 GB in the OS.
```

### Common File Sizes (Approximate)
| File Type | Typical Size |
|-----------|-------------|
| favicon.ico | 1-15 KB |
| Minified CSS file | 10-50 KB |
| Minified JS bundle | 50-500 KB |
| JPEG photo (web) | 100-500 KB |
| WebP photo (web) | 50-200 KB |
| PNG screenshot | 200 KB - 2 MB |
| SVG icon | 1-10 KB |
| Font file (WOFF2) | 20-50 KB |
| React app bundle | 200-800 KB |
| Docker image (Node.js) | 100-500 MB |
| Docker image (Alpine) | 5-50 MB |
| PostgreSQL dump (10K rows) | 1-10 MB |
| LLM weights (7B, Q4) | ~4 GB |
| LLM weights (32B, AWQ) | ~18 GB |
| LLM weights (70B, Q4) | ~40 GB |

### JavaScript Number Limits
```
Number.MAX_SAFE_INTEGER = 9,007,199,254,740,991 (2^53 - 1)
Number.MIN_SAFE_INTEGER = -9,007,199,254,740,991
Number.MAX_VALUE = 1.7976931348623157e+308
Number.MIN_VALUE = 5e-324
Number.EPSILON = 2.220446049250313e-16

Use BigInt for integers larger than MAX_SAFE_INTEGER
JSON.parse() loses precision for large integers — use BigInt or string
```

---

## 8. COMMON CONVERSION FACTORS

### Time
```
1 second = 1,000 milliseconds (ms)
1 millisecond = 1,000 microseconds (μs)
1 microsecond = 1,000 nanoseconds (ns)

Cron: * * * * * = min hour dayMonth month dayWeek
"every 5 min" = */5 * * * *
"daily at 3am" = 0 3 * * *
"weekly Monday 9am" = 0 9 * * 1

Unix timestamp: seconds since 1970-01-01T00:00:00Z
JavaScript Date: milliseconds since epoch
Current (early 2025): ~1,740,000,000 seconds
```

### Bandwidth/Speed
```
1 Mbps = 1,000,000 bits per second
1 Mbps = 125 KB/s (divide by 8)
1 Gbps = 125 MB/s

Typical speeds:
Home internet: 100-1000 Mbps download
Cloud server: 1-10 Gbps
SSD sequential read: 500 MB/s (SATA) to 7,000 MB/s (NVMe)
```

### Resolution/Display
```
HD:     1280 × 720   (720p)
Full HD: 1920 × 1080  (1080p)
2K:     2560 × 1440  (1440p)
4K:     3840 × 2160  (2160p)
5K:     5120 × 2880

Tailwind breakpoints (default):
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
2xl: 1536px
```

---

## 9. PRICING REFERENCE (Common Services, Early 2025)

### Hosting
| Service | Free Tier | Paid Start |
|---------|-----------|------------|
| Vercel | Hobby (generous) | $20/mo Pro |
| Netlify | Free tier | $19/mo Pro |
| Cloudflare Pages | Free (unlimited bandwidth) | $5/mo Workers |
| Railway | $5/mo credit | Usage-based |
| Fly.io | 3 shared VMs free | Usage-based |
| DigitalOcean Droplet | — | $4/mo (1GB) |
| AWS EC2 (t3.micro) | 750 hrs/mo (12 months) | ~$7.50/mo |

### Database
| Service | Free Tier | Paid Start |
|---------|-----------|------------|
| Neon | 0.5 GB, 1 project | $19/mo Pro |
| Supabase | 500 MB, 2 projects | $25/mo Pro |
| PlanetScale | 5 GB, 1B reads/mo | $39/mo Scaler |
| Redis Cloud | 30 MB | $7/mo |
| MongoDB Atlas | 512 MB | $57/mo (M10) |

### Auth
| Service | Free Tier | Paid Start |
|---------|-----------|------------|
| Clerk | 10K MAU | $0.02/MAU after |
| Firebase Auth | 10K/mo verifications | Free (generous) |
| Auth0 | 7,500 MAU | $23/mo Essential |
| Supabase Auth | 50K MAU | Included in Pro |

### Domain & DNS
| Service | Pricing |
|---------|---------|
| .com domain | ~$10-15/yr |
| .net domain | ~$10-15/yr |
| .io domain | ~$30-50/yr |
| .ai domain | ~$50-80/yr |
| Cloudflare DNS | Free (any plan) |
| Cloudflare Proxy (CDN) | Free (basic) |

---

## 10. SECURITY NUMBERS

### Password/Hashing
```
bcrypt cost factor:
- 10 (default): ~100ms to hash — good for most apps
- 12: ~300ms — better security
- 14: ~1s — high security
- Each increment doubles the time

AES key sizes:
- AES-128: 128-bit key (adequate)
- AES-192: 192-bit key
- AES-256: 256-bit key (recommended — Stone AI standard)

RSA key sizes:
- 2048-bit: Minimum acceptable (valid until ~2030)
- 3072-bit: Recommended
- 4096-bit: High security

Ed25519: 256-bit (modern, fast, secure — preferred for SSH)
```

### Token/Session Lengths
```
JWT typical: 200-2000 bytes
Session ID: 128 bits minimum (32 hex chars)
CSRF token: 128 bits minimum
API key: 32-64 characters typical
Password minimum: 12 characters (NIST 800-63B)
TOTP code: 6 digits, 30-second window
```

### Certificate Lifetimes
```
Let's Encrypt: 90 days (auto-renew at 60)
Commercial CA: 1 year max (since 2020)
Cloudflare Universal SSL: Auto-managed
Code signing: 1-3 years typical
```

---

## 11. REGEX QUICK REFERENCE NUMBERS

### Common Patterns with Numeric Constraints
```
Email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ (simplified)
IPv4: /^(\d{1,3}\.){3}\d{1,3}$/ (basic, doesn't validate 0-255)
UUID v4: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
Phone (US): /^\+1\d{10}$/ or /^\(\d{3}\) \d{3}-\d{4}$/
Hex color: /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i
Semver: /^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?(\+[a-zA-Z0-9.]+)?$/
ISO date: /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/
```

---

## 12. ENVIRONMENT VARIABLE CONVENTIONS

### Standard Variables
```
NODE_ENV=development|production|test
PORT=3000
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://localhost:6379
NEXTAUTH_URL=https://stone-ai.net
NEXTAUTH_SECRET=<random 32+ chars>
NEXT_PUBLIC_*=<exposed to client>

Naming convention:
- SCREAMING_SNAKE_CASE
- NEXT_PUBLIC_ prefix = available in client bundle (Next.js)
- VITE_ prefix = available in client bundle (Vite)
- Never prefix secrets with NEXT_PUBLIC_ or VITE_
```

---

## USAGE GUIDE

When an agent needs a specific number (port, limit, price, size):
1. Look it up in the relevant section of this seed
2. Use the exact number, not an approximation
3. If the number might have changed (pricing, limits), note "as of early 2025"

**Embedding hint**: Each numbered section (## N.) is an independent retrieval unit.
Tables within sections should not be split across chunks.

**Important caveat**: Pricing and limits change frequently. For production
decisions, always verify current numbers at the provider's website.
