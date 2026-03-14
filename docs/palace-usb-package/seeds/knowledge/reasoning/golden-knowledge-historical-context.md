# K-5: Golden Knowledge — Historical Context & Timelines
# Timeline-based knowledge for tech evolution and standards
# "As of [date], the standard is X, replacing Y"
# Palace USB Package — Golden Seed

---

## PURPOSE
Models frequently hallucinate about timelines, version histories, and the current
state of technology. This seed provides canonical timelines so agents can anchor
their answers to real dates. Critical for answering "what's current" questions
without fabricating version numbers.

---

## 1. WEB DEVELOPMENT TIMELINE

### JavaScript Framework Evolution
```
2006 — jQuery released (DOM manipulation made easy)
2010 — AngularJS (Google, two-way binding, MVC in browser)
2010 — Backbone.js (lightweight MVC)
2011 — Ember.js (convention over configuration)
2013 — React released by Facebook (virtual DOM, component model)
2014 — Vue.js released by Evan You (progressive framework)
2015 — ES6/ES2015 (let/const, arrow functions, classes, promises, modules)
2016 — Angular 2+ rewrite (TypeScript, complete rewrite of AngularJS)
2016 — Next.js released by Vercel (SSR for React)
2016 — Nuxt.js released (SSR for Vue)
2017 — async/await standardized in ES2017
2019 — Svelte 3 (compile-time framework, no virtual DOM)
2020 — React Server Components announced
2020 — Deno 1.0 released (secure JS/TS runtime by Node creator)
2021 — Next.js 12 (Rust compiler, middleware)
2021 — Remix released (full-stack React framework)
2022 — Next.js 13 (App Router, Server Components)
2022 — Bun 1.0 (fast JS runtime + bundler + package manager)
2023 — Astro 3.0 (content-first, islands architecture)
2023 — Next.js 14 (Server Actions stable)
2023 — Svelte 5 (runes — signals-based reactivity)
2024 — React 19 (Server Components stable, Actions, use() hook)
2024 — Next.js 15 (React 19, Turbopack stable)
2025 — Next.js 16 (current as of writing)
```

### CSS Evolution
```
2006 — CSS 2.1 finalized
2009 — CSS3 modules begin (border-radius, gradients, transitions)
2011 — Media queries widely supported (responsive design era)
2012 — Flexbox support begins
2013 — Bootstrap 3 dominates
2014 — CSS custom properties (variables) spec
2017 — CSS Grid Layout supported in major browsers
2017 — Tailwind CSS first release (utility-first)
2019 — Tailwind CSS 1.0
2020 — CSS :is(), :where(), :has() selectors
2021 — Tailwind CSS 2.0 (JIT mode)
2022 — Tailwind CSS 3.0 (JIT default, arbitrary values)
2022 — Container queries supported
2023 — CSS :has() selector supported in all major browsers
2023 — CSS nesting supported natively
2024 — Tailwind CSS 4.0
2024 — CSS Anchor Positioning
2025 — CSS Scope, @starting-style widely supported
```

### Node.js Major Versions
```
2009 — Node.js created by Ryan Dahl
2015 — Node.js 4.0 (io.js merger, LTS begins)
2017 — Node.js 8 (async/await native, npm 5)
2019 — Node.js 12 (ES modules support begins)
2020 — Node.js 14 (diagnostic reports, optional chaining)
2021 — Node.js 16 (Apple Silicon, Timers Promises API)
2022 — Node.js 18 (fetch API built-in, test runner, Watch mode)
2023 — Node.js 20 (stable test runner, permission model)
2024 — Node.js 22 (require() for ESM, WebSocket client)

Current LTS pattern:
- Even-numbered versions get LTS (18, 20, 22)
- LTS = 30 months of support
- Odd versions = current/experimental (6 months)
- Always use the current LTS for production
```

### TypeScript Versions
```
2012 — TypeScript 0.8 released by Microsoft
2014 — TypeScript 1.0
2016 — TypeScript 2.0 (strict null checks, control flow analysis)
2018 — TypeScript 3.0 (project references, unknown type)
2020 — TypeScript 4.0 (variadic tuple types, labeled tuples)
2023 — TypeScript 5.0 (decorators, const type params, bundler resolution)
2023 — TypeScript 5.2 (using declarations, decorator metadata)
2024 — TypeScript 5.4 (NoInfer, groupBy)
2024 — TypeScript 5.5 (inferred type predicates)
2024 — TypeScript 5.6 (iterator helpers)
2025 — TypeScript 5.7+ (current)

Key: TypeScript follows semver-ish but MAJOR version bumps
don't necessarily mean breaking changes. 4.9 → 5.0 was relatively smooth.
```

---

## 2. CLOUD COMPUTING TIMELINE

### AWS (Amazon Web Services)
```
2006 — S3 and EC2 launched (cloud computing begins)
2007 — SimpleDB (early NoSQL)
2009 — RDS (managed relational databases)
2009 — VPC (Virtual Private Cloud)
2012 — DynamoDB (NoSQL), Redshift (data warehouse)
2014 — Lambda launched (serverless computing begins)
2016 — API Gateway, Step Functions
2017 — Fargate (serverless containers)
2018 — CDK (Cloud Development Kit)
2019 — EventBridge, App Mesh
2020 — Graviton2 processors (ARM-based, cost-effective)
2022 — Lambda SnapStart (faster cold starts)
2023 — Graviton3, Amazon Bedrock (managed AI)
2024 — Graviton4, Amazon Q (AI assistant)
```

### Cloud Provider Market Share (approximate, 2024-2025)
```
AWS:    ~31% (market leader, broadest service catalog)
Azure:  ~25% (strong enterprise, Microsoft integration)
GCP:    ~11% (strong in AI/ML, data analytics, Kubernetes)
Others: ~33% (Alibaba, Oracle, IBM, etc.)
```

### Serverless/Edge Platform Evolution
```
2014 — AWS Lambda (first major serverless)
2016 — Azure Functions
2017 — Google Cloud Functions
2017 — Cloudflare Workers (edge computing)
2018 — Vercel (formerly ZEIT, serverless Next.js hosting)
2019 — Netlify Functions
2020 — Deno Deploy
2021 — Cloudflare Workers KV, Durable Objects
2022 — Vercel Edge Functions
2023 — Vercel Edge Runtime, Cloudflare D1 (edge SQLite)
2024 — Cloudflare Workers AI (inference at edge)
```

---

## 3. AI/ML TIMELINE

### Large Language Models
```
2017 — Transformer architecture (Google's "Attention Is All You Need")
2018 — GPT-1 (117M params, OpenAI)
2018 — BERT (340M params, Google, bidirectional)
2019 — GPT-2 (1.5B params, "too dangerous to release")
2020 — GPT-3 (175B params, few-shot learning breakthrough)
2021 — Codex (GPT-3 fine-tuned for code, powers GitHub Copilot)
2022 — ChatGPT launched (GPT-3.5, conversational AI goes mainstream)
2022 — Stable Diffusion (open-source image generation)
2022 — LLaMA leaked/released by Meta
2023 — GPT-4 (multimodal, massive improvement)
2023 — Claude 2 (Anthropic, 100K context)
2023 — LLaMA 2 (open-source, commercial license)
2023 — Mistral 7B (efficient small model)
2023 — Mixtral 8x7B (mixture of experts)
2024 — Claude 3 family (Opus, Sonnet, Haiku)
2024 — GPT-4o (omni, multimodal, faster)
2024 — LLaMA 3 (8B, 70B, 405B)
2024 — Qwen 2.5 series (Alibaba, strong multilingual)
2024 — DeepSeek V3 (strong reasoning, open weights)
2025 — Claude 3.5/4 (improved reasoning)
2025 — GPT-4.5, GPT-5 class models
2025 — Open-weight models reach near-frontier quality at 32B-70B scale
```

### AI/ML Infrastructure
```
2015 — TensorFlow (Google)
2016 — PyTorch (Meta/Facebook)
2017 — Hugging Face founded (model hub)
2020 — JAX gains traction (Google, functional ML)
2021 — GitHub Copilot preview
2022 — Stable Diffusion, DALL-E 2
2022 — LangChain (LLM application framework)
2023 — AutoGPT, BabyAGI (autonomous agents hype)
2023 — vLLM (fast LLM inference, PagedAttention)
2023 — Ollama (local LLM running made easy)
2024 — RAG becomes standard architecture
2024 — AI agents become production-ready
2024 — vLLM, TensorRT-LLM, SGLang mature for production inference
2025 — Agentic workflows mainstream
```

### Key Model Specifications (Reference)
```
GPT-4o:     128K context, ~$2.50/$10 per 1M tokens (in/out)
Claude Sonnet: 200K context, ~$3/$15 per 1M tokens
Claude Haiku:  200K context, ~$0.25/$1.25 per 1M tokens
LLaMA 3 70B: 128K context, open weights, self-hostable
Qwen 2.5 32B AWQ: 32K context, quantized, self-hostable on consumer GPU
Mistral Large: 128K context, strong reasoning

Note: Prices and specs change frequently. Verify current pricing
at provider websites before making cost estimates.
```

---

## 4. CYBERSECURITY TIMELINE

### Major Framework & Standard Releases
```
2004 — PCI DSS v1.0 (payment card security)
2013 — NIST Cybersecurity Framework v1.0
2014 — Heartbleed (OpenSSL vulnerability, CVE-2014-0160)
2014 — Shellshock (Bash vulnerability)
2016 — GDPR adopted (enforced May 2018)
2017 — WannaCry ransomware (global impact)
2017 — OWASP Top 10 updated
2018 — GDPR enforcement begins (May 25)
2018 — California Consumer Privacy Act (CCPA) signed
2020 — SolarWinds supply chain attack
2021 — Log4Shell (CVE-2021-44228, critical Java vulnerability)
2021 — OWASP Top 10 updated (current version)
2023 — NIST Cybersecurity Framework v2.0 draft
2023 — SEC cybersecurity disclosure rules (4 business days)
2024 — NIS2 Directive enforcement (EU)
2024 — NIST CSF 2.0 finalized
2025 — AI-specific security frameworks emerging
```

### TLS/SSL Evolution
```
1995 — SSL 2.0 (NEVER USE — broken)
1996 — SSL 3.0 (NEVER USE — POODLE attack)
1999 — TLS 1.0 (deprecated 2020)
2006 — TLS 1.1 (deprecated 2020)
2008 — TLS 1.2 (minimum acceptable as of 2024)
2018 — TLS 1.3 (current standard, faster handshake, better security)

Rule: Support TLS 1.2 and 1.3 ONLY. Disable everything older.
```

### Authentication Evolution
```
Basic Auth → API Keys → OAuth 1.0 → OAuth 2.0 → OIDC → Passkeys/WebAuthn
                                                          ↑ current frontier

2007 — OAuth 1.0
2012 — OAuth 2.0 (simplified, more flexible)
2014 — OpenID Connect (identity layer on OAuth 2.0)
2019 — WebAuthn/FIDO2 standard (passwordless)
2022 — Passkeys announced (Apple, Google, Microsoft)
2023 — Passkeys widely available
2024 — Passkeys becoming mainstream adoption
```

---

## 5. DATABASE TIMELINE

### PostgreSQL
```
1996 — PostgreSQL 6.0 (name change from Postgres95)
2005 — PostgreSQL 8.0 (Windows support, point-in-time recovery)
2010 — PostgreSQL 9.0 (streaming replication, hot standby)
2016 — PostgreSQL 9.6 (parallel query)
2017 — PostgreSQL 10 (logical replication, native partitioning)
2018 — PostgreSQL 11 (JIT compilation)
2019 — PostgreSQL 12 (JSON path, CTE inlining)
2020 — PostgreSQL 13 (incremental sorting, deduplication)
2021 — PostgreSQL 14 (multirange types, JSON subscripting)
2022 — PostgreSQL 15 (MERGE command, JSON logging)
2023 — PostgreSQL 16 (logical replication from standbys, I/O monitoring)
2024 — PostgreSQL 17 (incremental backup, new JSON functions)

Key extensions:
- pgvector (2023+): Vector similarity search for AI/embeddings
- PostGIS: Geospatial data
- TimescaleDB: Time-series data
- pg_cron: Scheduled jobs
- pgBouncer: Connection pooling
```

### Database Category Evolution
```
1970s — Relational model (Codd), SQL invented
1980s — Oracle, DB2, commercial RDBMS era
1995 — MySQL (open source RDBMS)
1996 — PostgreSQL (advanced open source RDBMS)
2007 — MongoDB (document store, "NoSQL" movement begins)
2009 — Redis (in-memory key-value store)
2010 — Cassandra (wide-column, distributed)
2012 — DynamoDB (AWS managed NoSQL)
2014 — CockroachDB (distributed SQL)
2017 — PlanetScale / Vitess (MySQL-compatible, distributed)
2019 — FaunaDB (serverless)
2021 — Neon (serverless PostgreSQL with branching)
2022 — Supabase gains traction (open-source Firebase alternative on PG)
2023 — Turso/libSQL (edge SQLite)
2023 — Vector databases surge (Pinecone, Qdrant, Weaviate, ChromaDB)
2024 — SQLite renaissance (edge computing, Cloudflare D1)
```

### ORM/Query Builder Evolution (JavaScript)
```
2011 — Sequelize (first major Node.js ORM)
2013 — Knex.js (query builder)
2016 — TypeORM (TypeScript ORM)
2019 — Prisma 2.0 preview (schema-first, type-safe)
2021 — Prisma 3.0 (stable, widely adopted)
2022 — Drizzle ORM (TypeScript, SQL-like, lightweight)
2023 — Prisma 5.0 (faster, serverless-ready)
2024 — Drizzle gains significant adoption
2025 — Prisma 6-7 (current, accelerate, pulse)

Current recommendation (2025):
- Prisma: Best DX, type-safety, migrations. Use for most projects.
- Drizzle: SQL-like syntax, lighter weight, better edge support.
- Raw SQL with pg: Maximum control for complex queries.
```

---

## 6. PROTOCOL VERSION REFERENCE

### HTTP
```
HTTP/1.0 (1996) — One request per connection
HTTP/1.1 (1997) — Persistent connections, chunked transfer
HTTP/2   (2015) — Multiplexing, header compression, server push
HTTP/3   (2022) — QUIC (UDP-based), improved performance

Current standard: HTTP/2 is default. HTTP/3 gaining adoption.
Most CDNs and browsers support HTTP/3 as of 2024.
```

### ECMAScript (JavaScript)
```
ES5     (2009) — "use strict", JSON, Array methods
ES6     (2015) — let/const, arrow functions, classes, promises, modules
ES2016  — Array.includes, ** operator
ES2017  — async/await, Object.entries/values
ES2018  — Rest/spread for objects, async iteration
ES2019  — Array.flat/flatMap, Object.fromEntries
ES2020  — Optional chaining (?.), nullish coalescing (??)
ES2021  — String.replaceAll, Promise.any, logical assignment
ES2022  — Top-level await, .at() method, Error.cause
ES2023  — Array.findLast, Hashbang grammar, change-by-copy methods
ES2024  — Grouping (Object.groupBy), Promise.withResolvers
ES2025  — Iterator helpers, Set methods, RegExp escaping
```

### Unicode
```
UTF-8:  Variable length (1-4 bytes), backward-compatible with ASCII
        → Default for web, JSON, most modern systems
UTF-16: Variable length (2 or 4 bytes)
        → JavaScript internal string encoding, Windows API
UTF-32: Fixed length (4 bytes)
        → Rarely used (wastes space)

Rule: Always use UTF-8 for storage and transmission.
JavaScript uses UTF-16 internally but this rarely matters in practice.
```

---

## 7. DEPLOYMENT PLATFORM EVOLUTION

### Hosting Generations
```
Gen 1 (1990s-2000s): Shared hosting, FTP upload, cPanel
Gen 2 (2006-2015): Cloud VMs (EC2, DigitalOcean, Linode)
Gen 3 (2015-2020): PaaS (Heroku, Elastic Beanstalk)
Gen 4 (2018-present): Serverless (Lambda, Vercel, Cloudflare Workers)
Gen 5 (2022-present): Edge computing (Cloudflare Workers, Deno Deploy)

Current best practices (2025):
- Static sites → Vercel, Netlify, Cloudflare Pages (free)
- Next.js apps → Vercel (best integration)
- APIs → Vercel serverless, Cloudflare Workers, AWS Lambda
- Full control → Docker on Fly.io, Railway, or VPS
- Enterprise → AWS/GCP/Azure with Kubernetes
```

### CI/CD Evolution
```
2005 — Hudson/Jenkins (self-hosted CI/CD)
2011 — Travis CI (cloud CI, open-source friendly)
2012 — CircleCI
2015 — GitLab CI/CD
2017 — Drone CI
2018 — GitHub Actions announced
2019 — GitHub Actions GA (dominates for GitHub repos)
2020 — GitHub Actions becomes de facto standard for open source
2024 — GitHub Actions mature, extensive marketplace

Current recommendation (2025):
- GitHub repos → GitHub Actions (no contest)
- GitLab repos → GitLab CI/CD
- Complex pipelines → Consider Buildkite, Earthly
- Self-hosted → Gitea + Woodpecker, or Jenkins (legacy)
```

---

## 8. REGULATORY/COMPLIANCE TIMELINE

### Data Privacy Laws
```
1995 — EU Data Protection Directive
2016 — GDPR adopted (enforced May 2018)
2018 — California Consumer Privacy Act (CCPA)
2020 — CCPA enforcement begins (July)
2020 — Brazil LGPD enforcement
2023 — California Privacy Rights Act (CPRA) amends CCPA
2024 — EU AI Act adopted
2025 — EU AI Act enforcement begins (phased)

Key requirements:
GDPR: Consent, right to erasure, data portability, breach notification (72h)
CCPA/CPRA: Right to know, delete, opt-out of data sale
PCI DSS: Encrypt card data, access controls, regular testing
HIPAA: PHI encryption, access controls, audit trails
SOC 2: Security, availability, processing integrity, confidentiality, privacy
```

---

## 9. PACKAGE MANAGER EVOLUTION

```
2010 — npm (Node Package Manager)
2012 — Bower (frontend packages — now defunct)
2016 — Yarn (Facebook, deterministic installs, workspaces)
2017 — npx (run packages without installing)
2020 — pnpm gains traction (efficient disk usage, strict node_modules)
2022 — Bun package manager (fastest)
2022 — npm workspaces
2024 — pnpm widely adopted for monorepos

Current recommendation (2025):
- Solo/small projects → npm (default, no install needed)
- Monorepos → pnpm (strict, fast, disk-efficient)
- Speed priority → Bun (fastest but newer ecosystem)
- Legacy/existing → Yarn if already using it
```

---

## 10. GPU/HARDWARE FOR AI TIMELINE

```
2016 — NVIDIA P100 (first Pascal architecture for AI)
2017 — NVIDIA V100 (Volta, tensor cores introduced, 16GB/32GB)
2020 — NVIDIA A100 (Ampere, 40GB/80GB, transformative for LLM training)
2020 — Apple M1 (ARM-based, integrated GPU)
2022 — NVIDIA H100 (Hopper, 80GB, fastest transformer training)
2022 — AMD MI250X (competitive for training)
2023 — NVIDIA H200 (141GB HBM3e)
2023 — Apple M3 (improved ML cores)
2024 — NVIDIA B100/B200 (Blackwell, massive throughput increase)
2024 — AMD MI300X (192GB HBM3, competitive with H100)
2024 — Apple M4 (enhanced Neural Engine)
2025 — NVIDIA B300, GB300 (next gen Blackwell)
2025 — Consumer: RTX 5090 (32GB GDDR7)

Consumer GPU for local LLM inference (2025):
- RTX 4090 (24GB) → Can run 7B-13B models well, 32B quantized
- RTX 5090 (32GB) → Can run 32B models at good quality (AWQ/GPTQ)
- 2x RTX 4090 (48GB) → Can run 70B quantized models
- RAM: 64GB minimum for running vLLM with 32B models
```

---

## USAGE GUIDE

When answering "what's current" or "what version" questions:
1. Check the relevant timeline in this seed
2. Cite the specific date/version
3. Note if something is deprecated or superseded

**Embedding hint**: Each numbered section (## N.) is an independent retrieval unit.
The section title + first line identifies the content.

**Important caveat**: Technology moves fast. These timelines are accurate as of
early 2025. For anything newer, verify with web search or official docs.
