# K-2: Golden Knowledge — Decision Trees
# Flowchart-style seeds for top 20 decision paths per agent domain
# Converts multi-hop reasoning into single-hop retrieval
# Palace USB Package — Golden Seed

---

## PURPOSE
These decision trees transform complex multi-step reasoning into simple traversal.
A 32B model follows a flowchart faster than it reasons from scratch.
Each tree: 5-8 decision points deep. Mermaid-style text notation.

---

## TREE 1: DEBUGGING — "Why isn't my code working?"

```
START: Code produces unexpected behavior
  |
  ├─ Does it compile/parse without errors?
  |   ├─ NO → Read the error message
  |   |   ├─ Syntax error? → Check line number, look for typos, missing brackets/semicolons
  |   |   ├─ Type error? → Check variable types, function signatures, imports
  |   |   ├─ Import/module error? → Check file paths, package.json, node_modules
  |   |   └─ Unknown error → Google exact error string in quotes
  |   |
  |   └─ YES → Does it run without runtime errors?
  |       ├─ NO → Runtime error
  |       |   ├─ TypeError: Cannot read property of undefined/null
  |       |   |   → Trace the variable backward. Where was it supposed to be set?
  |       |   |   → Add console.log at each step to find where it becomes undefined
  |       |   ├─ RangeError → Check loops, recursion depth, array indices
  |       |   ├─ Network error → Check URL, CORS, server running, auth headers
  |       |   └─ Database error → Check connection string, schema, migrations
  |       |
  |       └─ YES → Wrong output (logic error)
  |           ├─ Is the input what you expect?
  |           |   ├─ NO → Fix input handling first
  |           |   └─ YES → Binary search the logic
  |           |       ├─ Add logging at midpoint of function
  |           |       ├─ Is midpoint output correct?
  |           |       |   ├─ YES → Bug is in second half
  |           |       |   └─ NO → Bug is in first half
  |           |       └─ Repeat until isolated to single operation
  |           |
  |           ├─ Is it a timing/async issue?
  |           |   ├─ Missing await?
  |           |   ├─ Race condition?
  |           |   └─ Callback executing before data ready?
  |           |
  |           └─ Is it a state mutation issue?
  |               ├─ Object passed by reference being modified?
  |               ├─ State updated but component not re-rendering?
  |               └─ Cache serving stale data?
```

## TREE 2: DEBUGGING — "It works locally but not in production"

```
START: Works on localhost, fails in deployment
  |
  ├─ Check environment variables
  |   ├─ All env vars set in production? → Verify each one
  |   ├─ Different values needed? (localhost URLs vs production URLs)
  |   └─ .env file not deployed? (it shouldn't be — check env config in hosting)
  |
  ├─ Check build vs dev mode
  |   ├─ Does `npm run build && npm start` work locally?
  |   |   ├─ NO → Fix build errors first. This IS the bug.
  |   |   └─ YES → Continue
  |   ├─ Are there dev-only dependencies used in production code?
  |   └─ Is there code that only runs in development? (process.env.NODE_ENV checks)
  |
  ├─ Check network/infrastructure
  |   ├─ DNS resolving correctly?
  |   ├─ SSL certificate valid?
  |   ├─ CORS headers correct for production domain?
  |   ├─ API endpoints using correct production URLs?
  |   └─ Database accessible from production server?
  |
  ├─ Check file system differences
  |   ├─ Case sensitivity (Windows vs Linux)
  |   |   → `import Component from './component'` works on Windows, fails on Linux
  |   ├─ File paths using backslashes?
  |   └─ Hardcoded absolute paths?
  |
  └─ Check hosting-specific limits
      ├─ Serverless function timeout?
      ├─ Memory limit exceeded?
      ├─ Cold start issues?
      └─ Request body size limit?
```

## TREE 3: ARCHITECTURE SELECTION — "Which architecture for my project?"

```
START: New project or major refactor
  |
  ├─ What type of application?
  |   ├─ Web application
  |   |   ├─ Content-heavy, SEO matters?
  |   |   |   ├─ YES → SSR/SSG framework (Next.js, Nuxt, Astro)
  |   |   |   |   ├─ Mostly static content? → Astro or Next.js SSG
  |   |   |   |   ├─ Dynamic but SEO critical? → Next.js SSR
  |   |   |   |   └─ Blog/docs? → Astro, Docusaurus, or static site generator
  |   |   |   └─ NO → SPA acceptable
  |   |   |       ├─ Complex state management? → React + state library
  |   |   |       ├─ Simple/medium complexity? → Vue or Svelte
  |   |   |       └─ Enterprise team? → Angular
  |   |   |
  |   |   ├─ Real-time features needed?
  |   |   |   ├─ Chat/notifications → WebSocket (Socket.io or native WS)
  |   |   |   ├─ Live updates → SSE or WebSocket
  |   |   |   └─ Collaborative editing → CRDT library (Yjs, Automerge)
  |   |   |
  |   |   └─ How many users expected?
  |   |       ├─ < 1K concurrent → Single server fine
  |   |       ├─ 1K-100K → Load balancer + multiple instances
  |   |       └─ 100K+ → CDN + edge functions + microservices
  |   |
  |   ├─ API/Backend service
  |   |   ├─ CRUD-heavy? → REST + ORM (Prisma, Drizzle)
  |   |   ├─ Complex queries from multiple clients? → GraphQL
  |   |   ├─ High-performance inter-service? → gRPC
  |   |   ├─ Serverless? → API routes (Next.js) or Lambda + API Gateway
  |   |   └─ Monolith or microservices?
  |   |       ├─ Small team (< 5 devs)? → Monolith. Always.
  |   |       ├─ Independent scaling needs? → Microservices
  |   |       └─ Start monolith, extract services when pain emerges
  |   |
  |   ├─ Mobile application
  |   |   ├─ Need native performance? → Swift/Kotlin
  |   |   ├─ Cross-platform, JS team? → React Native
  |   |   ├─ Cross-platform, Dart OK? → Flutter
  |   |   └─ Simple app, web team? → PWA or Capacitor
  |   |
  |   └─ CLI tool
  |       ├─ Simple script? → Bash or Python
  |       ├─ Distributed binary? → Go or Rust
  |       └─ Node ecosystem? → Commander.js or Yargs
  |
  └─ Database selection (see Tree 4)
```

## TREE 4: DATABASE SELECTION

```
START: Choosing a database
  |
  ├─ What kind of data?
  |   ├─ Structured, relational, transactions matter
  |   |   ├─ PostgreSQL (default choice — covers 90% of cases)
  |   |   |   ├─ Need full-text search? → PG built-in or add pgvector
  |   |   |   ├─ Need vector/embeddings? → PG + pgvector
  |   |   |   ├─ Need JSON flexibility? → PG JSONB columns
  |   |   |   └─ Need time-series? → PG + TimescaleDB extension
  |   |   ├─ MySQL → Legacy, WordPress, specific hosting requirements
  |   |   └─ SQLite → Embedded, single-user, prototyping, edge
  |   |
  |   ├─ Unstructured / schema-flexible
  |   |   ├─ Document store → MongoDB
  |   |   |   └─ But ask: could JSONB in PG handle this?
  |   |   |       ├─ YES (usually) → Use PG
  |   |   |       └─ NO (truly schema-less, massive scale) → MongoDB
  |   |   └─ Wide-column → Cassandra, ScyllaDB (massive write throughput)
  |   |
  |   ├─ Key-value / caching
  |   |   ├─ In-memory cache → Redis
  |   |   ├─ Session storage → Redis
  |   |   ├─ Message queue → Redis Streams or dedicated (RabbitMQ, Kafka)
  |   |   └─ Simple KV persistence → Redis with AOF or SQLite
  |   |
  |   ├─ Search
  |   |   ├─ Full-text search primary? → Elasticsearch or Meilisearch
  |   |   ├─ FTS as feature? → PG full-text or Algolia
  |   |   └─ Vector search? → pgvector, Pinecone, Qdrant, Weaviate
  |   |
  |   └─ Graph relationships
  |       ├─ Social networks, recommendation engines → Neo4j
  |       └─ Simple relations? → PG with recursive CTEs
  |
  ├─ Scale requirements?
  |   ├─ Single server handles it → PG (always start here)
  |   ├─ Read replicas needed → PG streaming replication
  |   ├─ Global distribution → CockroachDB, PlanetScale, Neon
  |   └─ Massive write throughput → Cassandra, ScyllaDB
  |
  └─ Managed vs self-hosted?
      ├─ Managed (recommended for most) → Neon, Supabase, PlanetScale, RDS
      └─ Self-hosted → Docker compose for dev, Kubernetes for prod
```

## TREE 5: SECURITY ASSESSMENT — "Is this code/system secure?"

```
START: Security review
  |
  ├─ INPUT VALIDATION (OWASP A03)
  |   ├─ Is ALL user input validated?
  |   |   ├─ Form fields → Zod/Yup schema validation
  |   |   ├─ URL parameters → Type checking + allowlist
  |   |   ├─ Headers → Sanitize before use
  |   |   ├─ File uploads → Type check, size limit, scan
  |   |   └─ API body → Schema validation (Zod .strict())
  |   ├─ SQL injection possible?
  |   |   ├─ Using parameterized queries/ORM? → OK
  |   |   └─ String concatenation in queries? → CRITICAL FIX
  |   ├─ XSS possible?
  |   |   ├─ User content rendered as HTML? → Sanitize (DOMPurify)
  |   |   ├─ dangerouslySetInnerHTML used? → Audit every instance
  |   |   └─ SVG uploads? → Block or sanitize aggressively
  |   └─ Command injection?
  |       ├─ User input in shell commands? → NEVER. Use libraries instead.
  |       └─ User input in file paths? → Path traversal risk. Validate.
  |
  ├─ AUTHENTICATION (OWASP A07)
  |   ├─ Passwords hashed? → bcrypt/argon2 with salt
  |   ├─ Session management?
  |   |   ├─ JWT → Short expiry, refresh tokens, secure storage
  |   |   ├─ Cookies → HttpOnly, Secure, SameSite=Strict
  |   |   └─ Token in localStorage? → XSS risk. Move to HttpOnly cookie.
  |   ├─ MFA available? → Should be for admin/sensitive operations
  |   └─ Rate limiting on login? → Must have. Prevents brute force.
  |
  ├─ AUTHORIZATION (OWASP A01)
  |   ├─ Can user A access user B's data?
  |   |   ├─ Every query filtered by authenticated user ID?
  |   |   ├─ Direct object reference? → Check ownership before return
  |   |   └─ Admin routes protected? → Middleware check, not just UI hiding
  |   ├─ API routes all have auth middleware?
  |   └─ Role escalation possible?
  |       ├─ Can user modify their own role? → Must not.
  |       └─ Can user access admin endpoints? → Verify server-side.
  |
  ├─ DATA PROTECTION
  |   ├─ Sensitive data encrypted at rest? → AES-256-GCM
  |   ├─ HTTPS everywhere? → Force redirect HTTP → HTTPS
  |   ├─ Secrets in code/repo? → Move to env vars. Rotate compromised ones.
  |   ├─ Logging sensitive data? → Audit logs for PII exposure
  |   └─ CORS configured correctly?
  |       ├─ Allow-Origin: * → ONLY for public APIs
  |       └─ Credentials + specific origins → Correct for authenticated APIs
  |
  └─ INFRASTRUCTURE
      ├─ Dependencies up to date? → npm audit / dependabot
      ├─ CSP headers set? → Content-Security-Policy configured
      ├─ Error messages leak info? → Generic errors to client, detailed in logs
      └─ Backups tested? → Restore test monthly minimum
```

## TREE 6: PERFORMANCE DIAGNOSIS — "Why is it slow?"

```
START: Application is slow
  |
  ├─ WHERE is it slow?
  |   ├─ Initial page load
  |   |   ├─ Bundle too large? → Analyze with webpack-bundle-analyzer
  |   |   |   ├─ > 500KB JS → Code split, lazy load, tree shake
  |   |   |   ├─ Large dependency? → Find lighter alternative
  |   |   |   └─ Duplicate packages? → Resolve with resolutions field
  |   |   ├─ Too many HTTP requests? → Combine, use HTTP/2
  |   |   ├─ Images not optimized? → WebP, lazy loading, CDN
  |   |   └─ No caching? → Cache-Control headers, service worker
  |   |
  |   ├─ API response time
  |   |   ├─ Database query slow?
  |   |   |   ├─ Missing index? → EXPLAIN ANALYZE the query
  |   |   |   ├─ N+1 query problem? → Use includes/joins
  |   |   |   ├─ Full table scan? → Add WHERE clause, indexes
  |   |   |   ├─ Too much data returned? → Pagination, select specific fields
  |   |   |   └─ Connection pool exhausted? → Increase pool, fix connection leaks
  |   |   ├─ External API call slow?
  |   |   |   ├─ Cache the response → Redis, in-memory, or HTTP cache
  |   |   |   ├─ Make it async → Background job, return immediately
  |   |   |   └─ Timeout and fallback → Don't let external services block you
  |   |   └─ Computation heavy?
  |   |       ├─ Move to background worker
  |   |       ├─ Cache computed results
  |   |       └─ Optimize algorithm (check time complexity)
  |   |
  |   ├─ UI interaction lag
  |   |   ├─ Too many re-renders? → React DevTools profiler
  |   |   |   ├─ Missing React.memo on expensive components
  |   |   |   ├─ Missing useMemo/useCallback for expensive computations
  |   |   |   └─ State updates causing cascade re-renders
  |   |   ├─ Layout thrashing? → Batch DOM reads/writes
  |   |   ├─ Long-running JS blocking main thread? → Web Worker
  |   |   └─ Heavy animation? → Use CSS transforms, will-change, requestAnimationFrame
  |   |
  |   └─ Memory issues
  |       ├─ Memory leak?
  |       |   ├─ Event listeners not cleaned up? → Remove in cleanup/unmount
  |       |   ├─ Intervals/timeouts not cleared? → clearInterval in cleanup
  |       |   ├─ Growing array/object never pruned? → Implement eviction
  |       |   └─ Closures holding references? → Check for retained scopes
  |       └─ Heap too large? → Profile with Chrome DevTools Memory tab
```

## TREE 7: BUSINESS STRATEGY — "Should we build this feature?"

```
START: Feature request or idea
  |
  ├─ Who is asking?
  |   ├─ Multiple customers → Higher priority
  |   ├─ Single large customer → Evaluate dependency risk
  |   ├─ Internal team → Validate against user data
  |   └─ Founder intuition → Validate with 3 customer conversations
  |
  ├─ Does it align with current goals?
  |   ├─ NO → Park it. "Post-launch problem."
  |   └─ YES → Continue
  |
  ├─ Effort estimation
  |   ├─ Can it ship in < 1 week? → Strong candidate for quick win
  |   ├─ 1-4 weeks? → Needs clear ROI justification
  |   └─ > 1 month? → Must be strategic. Defer if possible.
  |
  ├─ Impact assessment
  |   ├─ Revenue impact → Will it directly increase MRR?
  |   |   ├─ New customers? → How many, at what price?
  |   |   ├─ Reduce churn? → What % of churning users cite this need?
  |   |   └─ Upsell opportunity? → Can it be premium-only?
  |   ├─ User experience → Does it remove a top-3 complaint?
  |   └─ Technical debt → Does building it now make future work easier?
  |
  ├─ Opportunity cost
  |   ├─ What are we NOT building while we build this?
  |   ├─ Is the alternative more impactful?
  |   └─ Can we achieve 80% of the value with 20% of the effort?
  |
  └─ Decision
      ├─ High impact + low effort → BUILD NOW
      ├─ High impact + high effort → PLAN AND SCHEDULE
      ├─ Low impact + low effort → BACKLOG (build during downtime)
      └─ Low impact + high effort → REJECT
```

## TREE 8: DATA ANALYSIS — "What does this data tell us?"

```
START: Data question or dataset
  |
  ├─ What is the question?
  |   ├─ Descriptive → "What happened?"
  |   |   ├─ Summarize: count, mean, median, min, max, std dev
  |   |   ├─ Segment: group by relevant dimensions
  |   |   ├─ Visualize: time series, distribution, top-N
  |   |   └─ Anomalies: outliers, missing data, unexpected patterns
  |   |
  |   ├─ Diagnostic → "Why did it happen?"
  |   |   ├─ Correlate: which variables move together?
  |   |   ├─ Segment: which user groups show different behavior?
  |   |   ├─ Timeline: what changed before the metric shifted?
  |   |   └─ CAUTION: Correlation ≠ causation (see R-7)
  |   |
  |   ├─ Predictive → "What will happen?"
  |   |   ├─ Trend analysis: linear regression on time series
  |   |   ├─ Cohort analysis: how do cohorts behave over time?
  |   |   ├─ Confidence intervals: state uncertainty explicitly
  |   |   └─ Assumptions: list what must hold true for prediction
  |   |
  |   └─ Prescriptive → "What should we do?"
  |       ├─ A/B test design → Hypothesis, sample size, duration
  |       ├─ Optimization → Define objective, constraints, variables
  |       └─ Decision framework → Expected value calculation
  |
  ├─ Data quality check (ALWAYS DO FIRST)
  |   ├─ Missing values → How many? Random or systematic?
  |   ├─ Duplicates → Identify and decide: keep first, last, or dedupe
  |   ├─ Data types correct? → Dates as dates, numbers as numbers
  |   ├─ Outliers → Real extremes or data errors?
  |   └─ Sample size sufficient? → Minimum 30 for stats, more for segments
  |
  └─ Reporting
      ├─ Lead with the insight, not the methodology
      ├─ One key finding per visualization
      ├─ State confidence level and limitations
      └─ Recommend specific action based on findings
```

## TREE 9: API ERROR HANDLING — "What HTTP status code?"

```
START: API returns an error or needs to return one
  |
  ├─ Client error (4xx)
  |   ├─ Request is malformed/invalid → 400 Bad Request
  |   ├─ Not authenticated → 401 Unauthorized
  |   ├─ Authenticated but not allowed → 403 Forbidden
  |   ├─ Resource not found → 404 Not Found
  |   ├─ Method not allowed → 405 Method Not Allowed
  |   ├─ Conflict (duplicate, version mismatch) → 409 Conflict
  |   ├─ Validation failed (semantic) → 422 Unprocessable Entity
  |   ├─ Rate limited → 429 Too Many Requests
  |   └─ Request body too large → 413 Payload Too Large
  |
  ├─ Server error (5xx)
  |   ├─ Unhandled exception → 500 Internal Server Error
  |   ├─ Upstream service failed → 502 Bad Gateway
  |   ├─ Server overloaded → 503 Service Unavailable
  |   └─ Upstream timeout → 504 Gateway Timeout
  |
  └─ Success (2xx)
      ├─ GET returned data → 200 OK
      ├─ POST created resource → 201 Created
      ├─ Request accepted, processing async → 202 Accepted
      ├─ DELETE succeeded, no body → 204 No Content
      └─ PUT/PATCH updated → 200 OK (with body) or 204 (without)
```

## TREE 10: INCIDENT RESPONSE — "Production is down"

```
START: Alert or user report of outage
  |
  ├─ IMMEDIATE (first 5 minutes)
  |   ├─ Is the site actually down or is it the reporter's connection?
  |   |   ├─ Check from multiple sources: uptime monitor, different network
  |   |   └─ Check status pages of dependencies (Vercel, Neon, Clerk, etc.)
  |   ├─ What is the blast radius?
  |   |   ├─ All users? → P0 — drop everything
  |   |   ├─ Some users? → P1 — work immediately
  |   |   ├─ Single feature? → P2 — work soon
  |   |   └─ Cosmetic issue? → P3 — queue it
  |   └─ Communicate: "We're aware and investigating."
  |
  ├─ DIAGNOSE (5-15 minutes)
  |   ├─ Check deployment logs → Did a deploy just happen?
  |   |   ├─ YES → Rollback immediately. Investigate later.
  |   |   └─ NO → Continue
  |   ├─ Check error logs → What errors are spiking?
  |   ├─ Check metrics → CPU, memory, connections, request rate
  |   ├─ Check external services → Database up? Auth provider up? APIs up?
  |   └─ Recent changes → Config change? DNS change? Certificate expiry?
  |
  ├─ MITIGATE (15-30 minutes)
  |   ├─ Can you rollback? → Do it. Fix forward later.
  |   ├─ Can you disable the broken feature? → Feature flag it off.
  |   ├─ Can you scale up? → Add instances if load-related.
  |   ├─ Can you failover? → Switch to backup if available.
  |   └─ Is it a third-party outage? → Communicate timeline, enable fallbacks.
  |
  └─ POST-INCIDENT
      ├─ Write incident report: timeline, cause, fix, prevention
      ├─ Identify monitoring gaps → Add alerts for this scenario
      ├─ Update runbook → Document the fix for next time
      └─ Schedule preventive work → Don't just fix, prevent recurrence
```

## TREE 11: GIT WORKFLOW — "What do I do with Git?"

```
START: Git operation needed
  |
  ├─ Starting new work
  |   ├─ Create branch from main → git checkout -b feature/description
  |   ├─ Branch naming: feature/, fix/, chore/, docs/
  |   └─ Pull latest main first → git pull origin main
  |
  ├─ During development
  |   ├─ Commit frequently → Small, atomic commits
  |   ├─ Message format → "verb: description" (add, fix, update, remove, refactor)
  |   ├─ Unstaged changes you want to discard?
  |   |   ├─ Specific file → git checkout -- file
  |   |   └─ Everything → git stash (recoverable) vs git checkout . (destructive)
  |   └─ Need to undo last commit?
  |       ├─ Keep changes → git reset --soft HEAD~1
  |       ├─ Unstage changes → git reset HEAD~1
  |       └─ Discard everything → git reset --hard HEAD~1 (DANGEROUS)
  |
  ├─ Ready to merge
  |   ├─ Push branch → git push -u origin branch-name
  |   ├─ Create PR → gh pr create
  |   ├─ Merge conflicts?
  |   |   ├─ Rebase onto main → git rebase main
  |   |   ├─ Resolve conflicts in each file
  |   |   ├─ git add resolved files → git rebase --continue
  |   |   └─ Too messy? → git rebase --abort, try merge instead
  |   └─ Merge strategy
  |       ├─ Squash merge → Clean history (default for PRs)
  |       ├─ Merge commit → Preserves branch history
  |       └─ Rebase → Linear history (advanced)
  |
  └─ Emergency
      ├─ Revert a merge → git revert -m 1 <merge-commit-hash>
      ├─ Find when bug was introduced → git bisect
      └─ Accidentally pushed secrets → Rotate immediately, use BFG to scrub history
```

## TREE 12: COST ESTIMATION — "How much will this cost to run?"

```
START: Estimating infrastructure costs
  |
  ├─ Hosting
  |   ├─ Static site → $0-20/mo (Vercel free, Netlify free, Cloudflare Pages free)
  |   ├─ Dynamic site (SSR)
  |   |   ├─ Low traffic (< 100K visits/mo) → Vercel hobby $0, Pro $20/mo
  |   |   ├─ Medium (100K-1M) → Vercel Pro $20/mo + usage
  |   |   └─ High (1M+) → Vercel Enterprise or self-hosted ($100-500/mo)
  |   └─ API-only backend
  |       ├─ Serverless → Pay per invocation ($0.20 per 1M requests typical)
  |       ├─ Container → $5-50/mo depending on size
  |       └─ Dedicated server → $20-200/mo
  |
  ├─ Database
  |   ├─ Small (< 10K rows) → Free tier anywhere (Neon, Supabase, PlanetScale)
  |   ├─ Medium (10K-1M rows) → $15-50/mo
  |   ├─ Large (1M-100M rows) → $50-500/mo
  |   └─ Enterprise (100M+) → $500+/mo, likely need DBA
  |
  ├─ AI/ML
  |   ├─ API calls (OpenAI/Anthropic)
  |   |   ├─ GPT-4o: ~$2.50/1M input tokens, $10/1M output tokens
  |   |   ├─ Claude Sonnet: ~$3/1M input, $15/1M output
  |   |   ├─ Claude Haiku: ~$0.25/1M input, $1.25/1M output
  |   |   └─ Estimate: avg 1K tokens per request → multiply by expected requests
  |   └─ Self-hosted
  |       ├─ GPU rental: $0.50-4/hr depending on GPU
  |       └─ Own hardware: CAPEX then electricity only
  |
  ├─ Storage
  |   ├─ S3/R2: $0.023/GB/mo (first 50TB)
  |   ├─ CDN bandwidth: $0.085/GB (AWS) or $0 (Cloudflare)
  |   └─ Estimate: user uploads × average size × retention period
  |
  └─ Third-party services
      ├─ Auth (Clerk): Free to 10K MAUs, then $0.02/MAU
      ├─ Email (SendGrid): 100/day free, then $15/mo
      ├─ Monitoring (Sentry): Free tier, then $26/mo
      └─ Search (Algolia): 10K requests free, then $1/1K requests
```

## TREE 13: DEPLOYMENT STRATEGY

```
START: Ready to deploy
  |
  ├─ First deployment ever?
  |   ├─ Choose hosting → See Tree 12 for cost considerations
  |   ├─ Set up CI/CD → GitHub Actions, Vercel auto-deploy
  |   ├─ Configure env vars → Different for staging and production
  |   ├─ Set up domain → DNS records (A or CNAME)
  |   ├─ SSL certificate → Auto with Vercel/Cloudflare, Let's Encrypt otherwise
  |   └─ Set up monitoring → Error tracking, uptime, performance
  |
  ├─ Routine deployment
  |   ├─ Tests pass? → Required before merge
  |   ├─ Preview deployment reviewed? → Check staging/preview URL
  |   ├─ Database migrations needed?
  |   |   ├─ YES → Run migration BEFORE deploying new code
  |   |   ├─ Breaking change? → Needs multi-step migration
  |   |   └─ Rollback plan → Can the migration be reversed?
  |   └─ Feature flags? → Ship code behind flag, enable separately
  |
  └─ Risky deployment
      ├─ Blue-green → Run old and new, switch traffic
      ├─ Canary → Send 5% of traffic to new version, monitor
      ├─ Rolling → Update instances one at a time
      └─ Rollback plan → How to revert within 5 minutes
```

## TREE 14: REACT COMPONENT DESIGN

```
START: Building a React component
  |
  ├─ What kind of component?
  |   ├─ UI primitive (button, input, card) → Generic, fully configurable props
  |   ├─ Feature component (sidebar, dashboard) → Domain-specific, data-aware
  |   └─ Page/route component → Minimal logic, compose feature components
  |
  ├─ State management
  |   ├─ Local only? → useState
  |   ├─ Shared between siblings? → Lift state to parent
  |   ├─ Deep prop drilling? → Context or state library
  |   ├─ Server state? → React Query / SWR
  |   └─ Complex state logic? → useReducer
  |
  ├─ Performance considerations
  |   ├─ Renders too often? → React.memo + profiler
  |   ├─ Expensive computation? → useMemo
  |   ├─ Callback causing child re-renders? → useCallback
  |   ├─ Large list? → Virtualization (react-window, tanstack-virtual)
  |   └─ Heavy component? → React.lazy + Suspense
  |
  └─ Testing
      ├─ Pure logic? → Unit test with Jest
      ├─ User interaction? → React Testing Library
      ├─ Visual? → Storybook + visual regression
      └─ Full flow? → Playwright E2E
```

## TREE 15: PRISMA/DATABASE OPERATIONS

```
START: Database operation needed
  |
  ├─ Schema change
  |   ├─ New model → Add to schema.prisma → npx prisma migrate dev
  |   ├─ New field on existing model
  |   |   ├─ Optional field → Add with ? → migrate
  |   |   ├─ Required field on populated table
  |   |   |   ├─ Has default? → Add with @default() → migrate
  |   |   |   └─ No default? → Two-step: add optional → backfill → make required
  |   |   └─ Relation → @relation with foreign key field
  |   ├─ Rename field → @map("old_column_name") to avoid data loss
  |   ├─ Delete field → Remove from schema → migrate (DATA LOSS — backup first)
  |   └─ Index needed? → @@index([field]) for query performance
  |
  ├─ Query optimization
  |   ├─ N+1 problem → Use include: {} or select: {} with nested
  |   ├─ Pagination → cursor-based (performant) or skip/take (simple)
  |   ├─ Count without fetching → prisma.model.count()
  |   ├─ Aggregate → prisma.model.aggregate({ _avg, _sum, _count })
  |   └─ Raw SQL needed → prisma.$queryRaw
  |
  └─ Common pitfalls
      ├─ Forgot to generate client → npx prisma generate after schema change
      ├─ Migration drift → npx prisma migrate reset (DEV ONLY — destroys data)
      ├─ Connection limit → Use connection pooling (PgBouncer, Prisma Accelerate)
      └─ Enum changes → Some DBs need manual migration for enum updates
```

## TREE 16: TYPESCRIPT TYPE ERRORS

```
START: TypeScript error
  |
  ├─ "Type X is not assignable to type Y"
  |   ├─ Missing property → Add the property or make it optional in the type
  |   ├─ Wrong type → Check what the function/component expects
  |   ├─ null/undefined → Add null check or use optional chaining (?.)
  |   └─ Union type → Narrow with type guard (if/typeof/in/instanceof)
  |
  ├─ "Property does not exist on type"
  |   ├─ Object might be the wrong type → Check variable assignment
  |   ├─ Property exists but type is too narrow → Widen type or add to interface
  |   └─ Optional property → Use optional chaining: obj?.property
  |
  ├─ "Cannot find module"
  |   ├─ Package not installed → npm install package-name
  |   ├─ Missing type definitions → npm install @types/package-name
  |   ├─ Path alias not configured → Check tsconfig.json paths
  |   └─ File doesn't exist → Check spelling and file extension
  |
  ├─ Generic type issues
  |   ├─ "Type argument not assignable" → Check generic constraints
  |   ├─ Inferred type wrong → Explicitly provide type parameter
  |   └─ Complex generics → Simplify or use type assertion (as Type) as escape hatch
  |
  └─ Quick fixes (when stuck)
      ├─ Type assertion → value as Type (use sparingly, masks errors)
      ├─ Non-null assertion → value! (dangerous, only when certain)
      ├─ @ts-ignore → Last resort. ALWAYS add comment explaining why.
      └─ unknown → Safer than any. Forces you to narrow before use.
```

## TREE 17: TESTING STRATEGY

```
START: What tests to write
  |
  ├─ Unit tests (fast, isolated)
  |   ├─ Pure functions → Test input/output pairs
  |   ├─ Utils/helpers → Test edge cases and error handling
  |   ├─ Hooks → Test with renderHook (testing-library)
  |   └─ State logic → Test reducers, state machines
  |
  ├─ Integration tests (medium speed)
  |   ├─ API routes → Supertest or fetch with test database
  |   ├─ Database operations → Test with seeded test DB
  |   ├─ Component + API → Mock API, test full component behavior
  |   └─ Auth flows → Test protected routes with mock auth
  |
  ├─ E2E tests (slow, high value)
  |   ├─ Critical paths only → Sign up, purchase, core feature
  |   ├─ Tool → Playwright (recommended) or Cypress
  |   └─ Run in CI → Not blocking on PR (too slow), run on merge to main
  |
  └─ What NOT to test
      ├─ Third-party library internals
      ├─ Implementation details (test behavior, not code structure)
      ├─ Trivial code (getters, simple mappings)
      └─ CSS/styling (use visual regression tools instead)
```

## TREE 18: NEXT.JS ROUTING DECISIONS

```
START: Adding a page/route in Next.js
  |
  ├─ Page route
  |   ├─ Static page → page.tsx in route folder
  |   ├─ Dynamic route → [param]/page.tsx
  |   ├─ Catch-all → [...slug]/page.tsx
  |   ├─ Optional catch-all → [[...slug]]/page.tsx
  |   └─ Route group (no URL impact) → (groupName)/page.tsx
  |
  ├─ Data fetching
  |   ├─ Static data (build time) → Default in App Router (RSC)
  |   ├─ Dynamic data (per request) → Add `export const dynamic = 'force-dynamic'`
  |   ├─ Revalidate periodically → `export const revalidate = 60` (seconds)
  |   ├─ Client-side data → useEffect + fetch or React Query/SWR
  |   └─ Server action → 'use server' function, form action
  |
  ├─ Layout
  |   ├─ Shared layout → layout.tsx (wraps children, preserved on navigation)
  |   ├─ Loading state → loading.tsx (automatic Suspense boundary)
  |   ├─ Error handling → error.tsx (error boundary)
  |   ├─ Not found → not-found.tsx
  |   └─ Metadata → export const metadata or generateMetadata()
  |
  └─ API route
      ├─ route.ts in route folder
      ├─ Export named functions: GET, POST, PUT, DELETE, PATCH
      ├─ Use NextRequest/NextResponse
      └─ Middleware → middleware.ts at project root
```

## TREE 19: CSS/STYLING DECISIONS

```
START: Styling a component
  |
  ├─ Using Tailwind CSS (Stone AI default)
  |   ├─ Layout → flex, grid, space-x, space-y, gap
  |   ├─ Responsive → sm: md: lg: xl: 2xl: prefixes
  |   ├─ Dark mode → dark: prefix
  |   ├─ Hover/focus → hover: focus: active: prefixes
  |   ├─ Animation → animate-spin, animate-pulse, transition-all
  |   └─ Custom values → arbitrary values [color:#hex] or extend in config
  |
  ├─ Using shadcn/ui components
  |   ├─ Need a standard UI element? → Check shadcn/ui library first
  |   ├─ Customization → Modify in components/ui/ after installation
  |   ├─ Variants → Use cva() for variant-based styling
  |   └─ New component → npx shadcn@latest add component-name
  |
  └─ Common patterns
      ├─ Center everything → flex items-center justify-center
      ├─ Sticky header → sticky top-0 z-50
      ├─ Truncate text → truncate (or line-clamp-N)
      ├─ Scrollable container → overflow-auto or overflow-y-scroll
      ├─ Aspect ratio → aspect-video or aspect-square
      └─ Glass effect → bg-white/10 backdrop-blur-md
```

## TREE 20: ERROR MESSAGE INTERPRETATION

```
START: Encountered an error message
  |
  ├─ Node.js / JavaScript
  |   ├─ "ENOENT" → File or directory not found. Check path.
  |   ├─ "EADDRINUSE" → Port already in use. Kill process or change port.
  |   ├─ "ECONNREFUSED" → Target server not running. Start it.
  |   ├─ "ENOMEM" → Out of memory. Increase Node --max-old-space-size.
  |   ├─ "ERR_MODULE_NOT_FOUND" → Import path wrong or package not installed.
  |   ├─ "Maximum call stack size exceeded" → Infinite recursion.
  |   └─ "Unhandled promise rejection" → Missing .catch() or try/catch on await.
  |
  ├─ Next.js specific
  |   ├─ "Hydration mismatch" → Server and client rendered different HTML
  |   |   → Check: conditional rendering based on window/document
  |   |   → Fix: useEffect for client-only content, suppressHydrationWarning
  |   ├─ "Server Component cannot use hooks" → Add 'use client' directive
  |   ├─ "Dynamic server usage" → Page trying to be static but uses dynamic data
  |   └─ "Module not found: Can't resolve" → Check import path and package install
  |
  ├─ Prisma
  |   ├─ "P2002" → Unique constraint violation. Duplicate value.
  |   ├─ "P2003" → Foreign key constraint failed. Referenced record doesn't exist.
  |   ├─ "P2025" → Record not found for update/delete.
  |   ├─ "P1001" → Can't reach database. Check connection string.
  |   └─ "P2021" → Table doesn't exist. Run migrations.
  |
  └─ Git
      ├─ "CONFLICT" → Merge conflict. Resolve manually.
      ├─ "detached HEAD" → Not on a branch. Checkout a branch.
      ├─ "rejected (non-fast-forward)" → Remote has changes you don't. Pull first.
      └─ "fatal: not a git repository" → Not in a git repo. Run git init.
```

---

## USAGE GUIDE

These trees are designed for single-hop retrieval. The agent:
1. Identifies the user's problem category
2. Retrieves the relevant tree
3. Follows the flowchart to reach the answer
4. No multi-step reasoning needed — the reasoning is pre-baked into the tree

For the 32B model, this converts 5-8 reasoning steps into 1 retrieval + 1 traversal.

**Embedding hint**: Each tree should be chunked as a single unit. Do not split trees across chunks.
The tree title + START line is the retrieval key.
