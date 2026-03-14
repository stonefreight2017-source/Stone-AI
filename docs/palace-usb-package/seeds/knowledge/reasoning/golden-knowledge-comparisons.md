# K-6: Golden Knowledge — Structured Comparisons
# Side-by-side comparisons of commonly confused/compared technologies
# Palace USB Package — Golden Seed

---

## PURPOSE
Agents are frequently asked "which should I use?" This seed provides structured,
opinionated comparisons that eliminate hallucinated pros/cons. Each comparison
includes: dimensions table, when to use which, and migration considerations.

---

## 1. REACT vs VUE vs SVELTE

### Dimensions Table
| Dimension | React | Vue | Svelte |
|-----------|-------|-----|--------|
| **Release** | 2013 (Meta) | 2014 (Evan You) | 2016 (Rich Harris) |
| **Paradigm** | Library + ecosystem | Progressive framework | Compiler |
| **Learning curve** | Medium-high | Low-medium | Low |
| **Bundle size (min)** | ~40KB (+ ReactDOM) | ~33KB | ~2KB (no runtime) |
| **Reactivity** | Explicit (useState, setState) | Proxy-based (ref, reactive) | Compile-time ($: reactive, runes in v5) |
| **Template syntax** | JSX (JS + HTML) | Template (HTML + directives) | Template (HTML-like, enhanced) |
| **TypeScript** | Excellent (native JSX support) | Good (Volar) | Good (improving) |
| **State management** | Context, Redux, Zustand, Jotai | Pinia (official), Vuex (legacy) | Stores (built-in) |
| **SSR framework** | Next.js, Remix | Nuxt.js | SvelteKit |
| **Mobile** | React Native | Capacitor, NativeScript | Capacitor |
| **Job market** | Largest (by far) | Second largest | Growing but small |
| **Component style** | Function components + hooks | Options API or Composition API | Single-file components |
| **Ecosystem size** | Massive | Large | Medium |
| **Performance** | Good (virtual DOM overhead) | Good (optimized virtual DOM) | Excellent (no virtual DOM) |
| **Corporate backing** | Meta | Independent + sponsors | Vercel (Rich Harris hired) |

### When to Use Which
```
REACT when:
- Large team (most developers know React)
- Need React Native for mobile
- Complex state management needs
- Maximum ecosystem/library choice
- Enterprise project (most corporate adoption)
- Need Next.js specifically

VUE when:
- Smaller team, faster onboarding needed
- Progressive enhancement of existing app
- Template-based approach preferred over JSX
- Laravel/PHP ecosystem (strong Vue integration)
- Want official solutions (Pinia, Vue Router — all maintained by core team)

SVELTE when:
- Performance is critical (smallest bundle)
- Simpler mental model preferred
- New project without legacy constraints
- Building widgets/embeds (tiny bundle)
- Want less boilerplate
```

### Migration Considerations
```
React → Vue: Component structure similar, main diff is template vs JSX
React → Svelte: Major paradigm shift, simpler but different patterns
Vue → React: Learn JSX and hooks, lose some convenience
Any → Any: State management, routing, and SSR framework all change
```

---

## 2. POSTGRESQL vs MYSQL vs MONGODB

### Dimensions Table
| Dimension | PostgreSQL | MySQL | MongoDB |
|-----------|-----------|-------|---------|
| **Type** | Relational (ORDBMS) | Relational (RDBMS) | Document (NoSQL) |
| **Data model** | Tables + JSONB | Tables | JSON documents (BSON) |
| **Schema** | Strict (with JSONB flexibility) | Strict | Flexible (schema-optional) |
| **ACID compliance** | Full | Full (InnoDB) | Multi-doc transactions since 4.0 |
| **Joins** | Excellent (complex queries) | Good | Limited ($lookup) |
| **Full-text search** | Built-in (good) | Built-in (basic) | Atlas Search (good) |
| **JSON support** | JSONB (indexed, queryable) | JSON type (limited) | Native (it IS JSON) |
| **Vector search** | pgvector extension | No native | Atlas Vector Search |
| **Replication** | Streaming, logical | Built-in, Group Replication | Replica sets (automatic) |
| **Partitioning** | Native (declarative) | Native | Sharding (automatic) |
| **Extensions** | Rich (PostGIS, pgvector, etc.) | Limited (plugins) | N/A |
| **License** | PostgreSQL (permissive) | GPL (dual license) | SSPL (restrictive) |
| **Managed options** | Neon, Supabase, RDS, Cloud SQL | PlanetScale, RDS, Cloud SQL | Atlas, DocumentDB |
| **Best ORM** | Prisma, Drizzle | Prisma, Drizzle | Mongoose, Prisma |

### When to Use Which
```
POSTGRESQL (default choice for 90% of projects):
- Complex queries with joins
- Need JSONB flexibility within relational model
- Need extensions (vectors, geospatial, time-series)
- ACID transactions critical
- Need advanced SQL features (CTEs, window functions, LATERAL)
- Want one database that does everything

MYSQL:
- WordPress or PHP ecosystem
- Simple read-heavy workloads
- Existing MySQL expertise/infrastructure
- PlanetScale (MySQL-compatible distributed)
- Legacy application compatibility

MONGODB:
- Truly schema-less data (every document different)
- Rapid prototyping where schema evolves daily
- Document-oriented data that doesn't need joins
- IoT or logging (high write throughput)
- CAUTION: Most projects that start with MongoDB eventually wish they'd used PG
```

### Migration Considerations
```
MySQL → PostgreSQL:
- Syntax differences (LIMIT/OFFSET same, but many functions differ)
- AUTO_INCREMENT → SERIAL/IDENTITY
- ENUM handling differs
- Tools: pgLoader, AWS DMS

MongoDB → PostgreSQL:
- Major paradigm shift
- Documents → Tables + JSONB columns
- Embedded documents → Foreign keys or JSONB
- $lookup → JOIN
- Tools: custom ETL scripts

PostgreSQL → MySQL:
- Lose: CTEs (recursive), window functions (some), JSONB indexing, extensions
- Rarely recommended — PG is a superset of MySQL capabilities
```

---

## 3. AWS vs GCP vs AZURE

### Dimensions Table
| Dimension | AWS | GCP | Azure |
|-----------|-----|-----|-------|
| **Market share** | ~31% | ~11% | ~25% |
| **Strength** | Broadest services, most mature | AI/ML, data analytics, Kubernetes | Enterprise, Microsoft integration |
| **Compute** | EC2, Lambda, Fargate | Compute Engine, Cloud Functions, Cloud Run | VMs, Functions, Container Apps |
| **Kubernetes** | EKS | GKE (best managed K8s) | AKS |
| **Serverless** | Lambda (pioneer) | Cloud Functions, Cloud Run | Azure Functions |
| **Database** | RDS, DynamoDB, Aurora | Cloud SQL, Spanner, Firestore | SQL Database, Cosmos DB |
| **Storage** | S3 (industry standard) | Cloud Storage | Blob Storage |
| **CDN** | CloudFront | Cloud CDN | Azure CDN / Front Door |
| **AI/ML** | SageMaker, Bedrock | Vertex AI (strongest) | Azure OpenAI, Azure ML |
| **Identity** | IAM, Cognito | IAM, Firebase Auth | Active Directory, Entra ID |
| **Pricing model** | Pay-as-you-go, reserved, spot | Sustained use discounts, committed | Pay-as-you-go, reserved |
| **Free tier** | 12 months + always-free | $300 credit + always-free | $200 credit + always-free |
| **CLI** | aws cli | gcloud cli | az cli |
| **IaC** | CloudFormation, CDK | Deployment Manager, Terraform | ARM/Bicep, Terraform |
| **Learning curve** | High (most services) | Medium | High (enterprise complexity) |

### When to Use Which
```
AWS when:
- Need the broadest service catalog
- Team has AWS experience
- Want the most documentation/community support
- Startup (AWS Activate program is generous)
- Need specific AWS services (DynamoDB, SQS, etc.)

GCP when:
- AI/ML is core to your product
- Heavy Kubernetes usage (GKE is best)
- BigQuery for data analytics
- Want simpler pricing (sustained use discounts)
- Firebase for mobile apps

AZURE when:
- Enterprise with existing Microsoft agreements
- Need Active Directory integration
- .NET stack
- Azure OpenAI (direct OpenAI model access)
- Government/compliance requirements (most certifications)
```

---

## 4. REST vs GraphQL vs gRPC

### Dimensions Table
| Dimension | REST | GraphQL | gRPC |
|-----------|------|---------|------|
| **Protocol** | HTTP/1.1+ | HTTP/1.1+ | HTTP/2 |
| **Data format** | JSON (typically) | JSON | Protocol Buffers (binary) |
| **Schema** | OpenAPI/Swagger (optional) | SDL (required, self-documenting) | .proto files (required) |
| **Typing** | Weak (depends on docs) | Strong (introspection) | Strong (code generation) |
| **Over-fetching** | Common (fixed response shape) | Solved (client specifies fields) | N/A (defined messages) |
| **Under-fetching** | Common (multiple requests needed) | Solved (nested queries) | N/A (defined messages) |
| **Caching** | HTTP caching (excellent) | Complex (POST requests) | Custom |
| **Real-time** | SSE, WebSocket (separate) | Subscriptions (built-in) | Streaming (bi-directional) |
| **File upload** | Native (multipart/form-data) | Complex (spec extension) | Streaming |
| **Browser support** | Native | Native | Requires grpc-web proxy |
| **Learning curve** | Low | Medium | High |
| **Tooling** | Mature (Postman, curl) | Good (GraphiQL, Apollo DevTools) | Good (grpcurl, BloomRPC) |
| **Performance** | Good | Good (can be worse with complex queries) | Excellent (binary, HTTP/2) |

### When to Use Which
```
REST when:
- Public API (most developers expect REST)
- Simple CRUD operations
- HTTP caching is important
- Team is familiar with REST
- Microservices with simple interactions
- 90% of web APIs should be REST

GraphQL when:
- Multiple client types need different data shapes (web, mobile, TV)
- Complex, nested data with relationships
- Rapid frontend iteration (frontend picks its data)
- BFF (Backend for Frontend) pattern
- DON'T use for simple CRUD — overkill

gRPC when:
- Internal microservice-to-microservice communication
- High performance required (binary protocol)
- Bi-directional streaming needed
- Polyglot services (code gen for any language)
- NOT for browser-facing APIs (without grpc-web)
```

---

## 5. DOCKER vs PODMAN

### Dimensions Table
| Dimension | Docker | Podman |
|-----------|--------|--------|
| **Architecture** | Client-server (daemon) | Daemonless |
| **Root required** | Yes (daemon runs as root) | No (rootless by default) |
| **CLI compatibility** | Docker CLI | Drop-in Docker CLI compatible |
| **Compose** | docker-compose / docker compose | podman-compose |
| **Desktop app** | Docker Desktop (paid for enterprise) | Podman Desktop (free) |
| **OCI compliance** | Yes | Yes |
| **Pod support** | No native pods | Native pod support (like K8s pods) |
| **Systemd integration** | Limited | Native (generate systemd units) |
| **License** | Docker Desktop: paid for >250 employees | Free (Apache 2.0) |
| **Image format** | OCI, Docker | OCI, Docker |
| **Build** | docker build (BuildKit) | podman build (Buildah) |
| **Registry** | Docker Hub (default) | Any OCI registry |

### When to Use Which
```
DOCKER when:
- Team knows Docker (default industry standard)
- Need Docker Desktop features
- Using Docker Compose extensively
- CI/CD pipelines expect Docker
- Most tutorials/docs assume Docker

PODMAN when:
- Security-conscious (rootless, daemonless)
- Enterprise (avoid Docker Desktop licensing)
- Linux server (better systemd integration)
- Need pod concept without Kubernetes
- Red Hat/Fedora ecosystem

Migration: alias docker=podman works for most commands
```

---

## 6. NEXT.JS vs REMIX vs NUXT

### Dimensions Table
| Dimension | Next.js | Remix | Nuxt |
|-----------|---------|-------|------|
| **Framework for** | React | React | Vue |
| **Rendering** | SSR, SSG, ISR, RSC | SSR, streaming | SSR, SSG, ISR |
| **Data loading** | Server Components, fetch, Server Actions | Loaders (per route) | useFetch, useAsyncData |
| **Mutations** | Server Actions | Actions (form-based) | Server API routes |
| **Routing** | File-based (App Router) | File-based | File-based |
| **Deployment** | Vercel (best), any Node host | Any Node host, Cloudflare | Vercel, Netlify, any Node host |
| **Bundle size** | Medium (RSC reduces client JS) | Small (progressive enhancement) | Medium |
| **TypeScript** | First-class | First-class | First-class |
| **Community** | Largest | Growing | Large (Vue ecosystem) |
| **Corporate backer** | Vercel | Shopify | NuxtLabs |
| **Philosophy** | Full-featured, batteries-included | Web standards, progressive enhancement | Convention over configuration |
| **Complexity** | High (many rendering modes) | Low-medium (simpler model) | Medium |

### When to Use Which
```
NEXT.JS when:
- React is your framework of choice
- Need maximum flexibility (SSR, SSG, ISR, RSC)
- Deploying to Vercel (best experience)
- Need large ecosystem and community
- SEO is important
- Stone AI uses Next.js — this is our default

REMIX when:
- Want simpler mental model than Next.js
- Progressive enhancement matters (forms work without JS)
- Deploying to Cloudflare Workers or other edge
- Want to lean into web standards
- Smaller project, less framework magic wanted

NUXT when:
- Vue is your framework of choice
- Want convention-over-configuration approach
- Server routes built-in
- Auto-imports preferred
```

---

## 7. PRISMA vs DRIZZLE vs TYPEORM vs RAW SQL

### Dimensions Table
| Dimension | Prisma | Drizzle | TypeORM | Raw SQL |
|-----------|--------|---------|---------|---------|
| **Approach** | Schema-first ORM | SQL-like query builder | Decorator-based ORM | Direct SQL strings |
| **Type safety** | Excellent (generated types) | Excellent (inferred) | Good (decorators) | None (unless typed manually) |
| **Learning curve** | Low-medium | Low (if you know SQL) | Medium | Must know SQL |
| **Schema definition** | schema.prisma (DSL) | TypeScript | TypeScript decorators | SQL DDL |
| **Migrations** | prisma migrate (auto-generated) | drizzle-kit (auto-generated) | TypeORM CLI | Manual SQL files |
| **Query complexity** | Simple-medium (escape to raw for complex) | Any SQL expressible in TS | Medium-high | Unlimited |
| **Serverless/Edge** | Prisma Accelerate, adapter | Native edge support | Poor (heavy) | Native |
| **Bundle size** | Large (engine binary) | Small | Large | Zero |
| **Relations** | include/select (explicit) | SQL joins (explicit) | Eager/lazy loading | Manual joins |
| **Performance** | Good (some overhead) | Excellent (thin layer) | Moderate | Best (no abstraction) |
| **Community** | Largest (JS ORM) | Fast-growing | Mature but stagnating | Universal |

### When to Use Which
```
PRISMA when:
- Want best developer experience and type safety
- Team includes devs who don't know SQL well
- Standard CRUD operations dominate
- Want auto-generated migrations
- Using Neon/Supabase/PlanetScale (good integration)
- Stone AI uses Prisma — this is our default

DRIZZLE when:
- Want SQL-like syntax in TypeScript
- Edge/serverless deployment (smaller bundle)
- Performance-sensitive applications
- Team knows SQL and wants control
- Monorepo or library authoring

TYPEORM when:
- Legacy project already using it
- Coming from Java/C# (familiar patterns)
- NestJS project (common pairing)
- NOT recommended for new projects

RAW SQL when:
- Complex queries that ORMs can't express
- Maximum performance critical path
- One-off scripts or migrations
- Team of SQL experts
```

---

## 8. TESTING: JEST vs VITEST vs PLAYWRIGHT vs CYPRESS

### Dimensions Table
| Dimension | Jest | Vitest | Playwright | Cypress |
|-----------|------|--------|------------|---------|
| **Type** | Unit/Integration | Unit/Integration | E2E | E2E |
| **Speed** | Moderate | Fast (Vite-native) | Fast (parallel) | Moderate |
| **Browser** | jsdom (simulated) | jsdom/happy-dom | Real browsers | Real browsers |
| **Language** | JavaScript/TypeScript | JavaScript/TypeScript | JS/TS/Python/Java/C# | JavaScript/TypeScript |
| **Browsers** | None (simulated) | None (simulated) | Chromium, Firefox, WebKit | Chrome, Firefox, Edge |
| **API testing** | Possible but not designed for it | Possible but not designed for it | Good (API context) | Good (cy.request) |
| **Component testing** | React Testing Library | React Testing Library | Component testing (experimental) | Component testing |
| **Parallel** | Worker threads | Worker threads | Full parallel (browsers) | Limited (paid Dashboard) |
| **Visual testing** | Snapshot only | Snapshot only | Screenshots, video | Screenshots, video |
| **CI support** | Excellent | Excellent | Excellent | Good |

### When to Use Which
```
JEST when:
- Existing project already using Jest
- CRA (Create React App) projects
- Non-Vite build system

VITEST when:
- New project (default recommendation)
- Using Vite, Next.js, or Nuxt
- Want faster test execution
- Drop-in Jest API compatibility

PLAYWRIGHT when:
- E2E testing (default recommendation)
- Need multi-browser testing
- Need API + UI testing together
- Cross-platform testing needed

CYPRESS when:
- Team already knows Cypress
- Want visual test runner during development
- Simpler debugging experience preferred
```

---

## 9. STATE MANAGEMENT: REDUX vs ZUSTAND vs JOTAI vs CONTEXT

### Dimensions Table
| Dimension | Redux Toolkit | Zustand | Jotai | React Context |
|-----------|--------------|---------|-------|---------------|
| **Paradigm** | Single store, reducers | Single store, simple API | Atomic state | Provider tree |
| **Boilerplate** | Medium (RTK reduces it) | Minimal | Minimal | Minimal |
| **DevTools** | Excellent (Redux DevTools) | Redux DevTools compatible | Jotai DevTools | React DevTools |
| **Middleware** | Built-in (RTK) | Middleware support | Derived atoms | None |
| **Async** | RTK Query, createAsyncThunk | Built-in | Built-in | useEffect + useState |
| **Bundle size** | ~12KB | ~1KB | ~3KB | 0 (built-in) |
| **Re-renders** | Optimized (selectors) | Optimized (selectors) | Optimized (atomic) | Triggers full tree re-render |
| **Learning curve** | Medium | Low | Low | Low |
| **Server state** | RTK Query | No (use React Query) | No (use React Query) | No |

### When to Use Which
```
REACT CONTEXT when:
- Theme, locale, auth state (rarely changing)
- Small app with simple state
- DON'T use for frequently changing state (causes re-renders)

ZUSTAND when:
- Need global state without Redux complexity
- Simple API preferred
- Small-medium state needs
- Default recommendation for most React apps

JOTAI when:
- Fine-grained reactivity needed
- Many independent pieces of state
- Bottom-up state design preferred
- Derived/computed state is common

REDUX TOOLKIT when:
- Large team needs strict patterns
- Complex state logic with many reducers
- Need excellent DevTools for debugging
- Enterprise application with established Redux patterns
```

---

## 10. HOSTING: VERCEL vs NETLIFY vs CLOUDFLARE PAGES vs RAILWAY

### Dimensions Table
| Dimension | Vercel | Netlify | Cloudflare Pages | Railway |
|-----------|--------|---------|-----------------|---------|
| **Best for** | Next.js | Static + Jamstack | Static + Workers | Full-stack, Docker |
| **Free tier** | Generous (hobby) | Generous | Very generous | $5/mo credit |
| **Serverless functions** | Yes (Edge + Node) | Yes (Node, Go, Rust) | Workers (V8 isolates) | Full server |
| **Edge functions** | Yes | Yes (limited) | Native (all Workers) | No |
| **Database** | Vercel Postgres, KV, Blob | No managed DB | D1 (SQLite), KV, R2 | Yes (Postgres, MySQL, Redis) |
| **Build minutes** | 6000/mo free | 300/mo free | 500/mo free | Usage-based |
| **Bandwidth** | 100GB free | 100GB free | Unlimited | Usage-based |
| **Custom domains** | Yes | Yes | Yes | Yes |
| **Preview deploys** | Yes (excellent) | Yes (good) | Yes | Yes |
| **Docker support** | No | No | No | Yes (native) |
| **Monorepo** | Turborepo (native) | Basic | Basic | Good |
| **Pricing** | Free → $20/mo Pro | Free → $19/mo Pro | Free → $5/mo | Usage-based |

### When to Use Which
```
VERCEL when:
- Next.js application (best-in-class integration)
- Need preview deployments for PRs
- Edge functions needed
- Stone AI's deployment platform

NETLIFY when:
- Static site or Jamstack application
- Want simple form handling
- Identity/auth features built-in
- Already invested in Netlify ecosystem

CLOUDFLARE PAGES when:
- Want cheapest option (unlimited bandwidth)
- Edge-first architecture
- Using Cloudflare for DNS already
- Building with Workers/D1

RAILWAY when:
- Need Docker containers
- Full-stack app with database
- Background workers/cron jobs
- Want simple Heroku-like experience
```

---

## 11. AUTH: CLERK vs AUTH.JS vs SUPABASE AUTH vs FIREBASE AUTH

### Dimensions Table
| Dimension | Clerk | Auth.js (NextAuth) | Supabase Auth | Firebase Auth |
|-----------|-------|-------------------|---------------|---------------|
| **Type** | Managed service | Library (self-hosted) | Managed (part of Supabase) | Managed (Google) |
| **Cost** | Free to 10K MAU, then $0.02/MAU | Free (self-hosted) | Free to 50K MAU | Free to 10K/month |
| **UI components** | Yes (pre-built, customizable) | Basic (community) | Basic | FirebaseUI |
| **MFA** | Yes | Community plugins | Yes | Yes |
| **Social login** | 20+ providers | 60+ providers | Built-in (10+) | Built-in (10+) |
| **Organization/teams** | Yes (built-in) | No (manual) | No (manual) | No (manual) |
| **Session management** | Managed | Cookie-based | JWT | Firebase SDK |
| **User management UI** | Dashboard (excellent) | None | Dashboard (basic) | Console |
| **Webhooks** | Yes | No | Yes | Cloud Functions |
| **Next.js integration** | Excellent (middleware) | Good (built for Next.js) | Good | Fair |
| **Lock-in** | Medium (proprietary) | None (open source) | Low (open source) | High (Google) |

### When to Use Which
```
CLERK when:
- Want fastest integration with best DX
- Need organization/team features
- Pre-built UI components valued
- Budget allows per-MAU pricing
- Stone AI uses Clerk — this is our default

AUTH.JS when:
- Want zero vendor lock-in
- Self-hosted requirement
- Need maximum provider support
- Budget-conscious (free)

SUPABASE AUTH when:
- Already using Supabase for database
- Want row-level security integration
- Open-source preference

FIREBASE AUTH when:
- Already in Google/Firebase ecosystem
- Mobile app (React Native, Flutter)
- Need phone number auth
```

---

## USAGE GUIDE

When answering "should I use X or Y?" questions:
1. Find the relevant comparison in this seed
2. Check the dimensions table for factual comparison
3. Check the "when to use which" for the recommendation
4. Consider migration implications if switching

**Embedding hint**: Each numbered comparison (## N.) is an independent retrieval unit.
Chunk at the comparison level, not the sub-section level.
