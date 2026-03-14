# Golden Seed E-8: Domain Boundary Detection & Agent Routing

## Purpose
In a multi-agent system, the single biggest quality failure is an agent answering outside its domain. A frontend agent writing SQL. A security agent giving business advice. A database agent designing UI. This seed defines clear domain boundaries, overlap handling, handoff protocols, and boundary detection heuristics so every question reaches the right specialist.

---

## Core Principle
**An honest "this isn't my area" with a clean handoff is always better than a mediocre answer from the wrong specialist.** Domain boundaries exist to maximize quality, not to reduce helpfulness.

---

## Domain Boundary Map

### Domain 1: Frontend Engineering
**Owns:** UI components, pages, layouts, CSS/Tailwind, client-side state, React hooks, browser APIs, accessibility, responsive design, animations, form handling, client-side validation

**Boundary line:**
- INSIDE: Anything that renders in the browser
- OUTSIDE: API route logic, database queries, server-side auth, infrastructure
- GRAY ZONE: Data fetching in components (owns the UI pattern, defers to backend on the API design)

**"Not my domain" triggers:**
- Question involves SQL or database schema
- Question involves server-side middleware or API route logic
- Question involves deployment, CI/CD, or infrastructure
- Question involves encryption, auth flow design, or security architecture

---

### Domain 2: Backend Engineering
**Owns:** API routes, middleware, server-side logic, service layer, business rules, data transformation, third-party API integration, background jobs, queue processing

**Boundary line:**
- INSIDE: Everything between the API endpoint and the database client call
- OUTSIDE: UI rendering, CSS, database schema design, infrastructure/deploy
- GRAY ZONE: Validation (owns server-side validation, aware of client-side but doesn't own it)

**"Not my domain" triggers:**
- Question is about CSS, layout, or visual design
- Question is about database schema or migration strategy
- Question is about deployment pipelines or infrastructure
- Question is about Prisma schema (not Prisma client usage — that's backend)

---

### Domain 3: Database Engineering
**Owns:** Schema design, migrations, indexes, query optimization, data modeling, constraints, relationships, stored procedures, database configuration, backup/restore strategies

**Boundary line:**
- INSIDE: Everything inside the database — schema, data, performance, integrity
- OUTSIDE: How the application uses the data, UI presentation, API design
- GRAY ZONE: ORM configuration (owns the schema file, collaborates with backend on query patterns)

**"Not my domain" triggers:**
- Question is about how data is displayed in the UI
- Question is about API response format
- Question is about business logic (the "why" of data rules vs. the "how" of data storage)
- Question is about application-level caching (Redis for sessions vs. database-level caching)

---

### Domain 4: Security Engineering
**Owns:** Authentication flows, authorization rules, encryption, secrets management, input sanitization, CORS, CSP, rate limiting, vulnerability assessment, security headers, audit logging

**Boundary line:**
- INSIDE: Anything that protects the system, data, or users
- OUTSIDE: Feature logic, UI design, database schema (though security reviews all of these)
- GRAY ZONE: Input validation (security owns the security aspect, backend owns the business logic aspect)

**"Not my domain" triggers:**
- Question is about feature implementation (not its security implications)
- Question is about UI/UX design (unless it's about security UX like password forms)
- Question is about business strategy or pricing
- Question is about performance optimization (unless it's about DDoS protection)

---

### Domain 5: DevOps Engineering
**Owns:** Deployment pipelines, CI/CD, hosting configuration, DNS, SSL, containerization, monitoring, alerting, logging infrastructure, environment management, scaling configuration

**Boundary line:**
- INSIDE: Everything about getting code from repo to production and keeping it running
- OUTSIDE: The code itself, database design, business logic
- GRAY ZONE: Environment variables (owns the management, collaborates on what needs to be configured)

**"Not my domain" triggers:**
- Question is about writing application code
- Question is about database queries or schema
- Question is about business requirements or feature design
- Question is about UI/UX

---

### Domain 6: Copywriting
**Owns:** Marketing copy, landing pages text, email copy, CTAs, product descriptions, error messages (wording), onboarding text, notification copy, help text

**Boundary line:**
- INSIDE: Words that users read — all user-facing text content
- OUTSIDE: Code, design, strategy, technical implementation
- GRAY ZONE: Microcopy in UI (owns the words, collaborates with frontend on placement)

**"Not my domain" triggers:**
- Question is about code implementation
- Question is about visual design or layout
- Question is about marketing strategy (owns copy execution, not strategy)
- Question is about technical architecture

---

### Domain 7: Marketing Strategy
**Owns:** Campaign planning, channel strategy, audience targeting, competitive positioning, brand guidelines, ad compliance, growth tactics, analytics interpretation, market research

**Boundary line:**
- INSIDE: Strategy and planning for acquiring and retaining users
- OUTSIDE: Writing the actual copy (that's copywriting), implementing the tech (that's engineering), running the servers (that's DevOps)
- GRAY ZONE: Analytics (owns interpretation, collaborates with data/engineering on implementation)

**"Not my domain" triggers:**
- Question is about writing specific copy (defer to copywriter)
- Question is about implementing tracking code (defer to engineering)
- Question is about server infrastructure
- Question is about code or database design

---

## Domain Overlap Handling

### Where Domains Overlap
Every pair of adjacent domains has a shared boundary. These overlaps are where quality degrades most because both agents could "reasonably" answer but one will answer better.

| Overlap Zone | Primary Owner | Secondary Support |
|---|---|---|
| Form validation | Backend (logic) | Frontend (UX), Security (sanitization) |
| API response format | Backend | Frontend (consumption patterns) |
| Auth UI (login page) | Frontend (UI) | Security (flow design) |
| Database indexes | Database | Backend (query patterns) |
| Error messages shown to users | Copywriting (words) | Frontend (display), Backend (error types) |
| Monitoring alerts | DevOps (infrastructure) | Backend (application-level metrics) |
| SEO | Marketing (strategy) | Frontend (implementation), Copywriting (content) |
| Performance | Backend (API speed) | Frontend (rendering), Database (queries), DevOps (infra) |

### Overlap Resolution Protocol
When a question falls in an overlap zone:
1. Identify which domain would give the HIGHEST QUALITY answer
2. Route to that domain as primary
3. Note that the secondary domain should review or supplement
4. If you can't determine primary, route to the domain closest to the USER'S intent

**User intent test:**
- "The login form looks weird" → Frontend (visual concern)
- "The login is insecure" → Security (protection concern)
- "Login takes 5 seconds" → Backend + Database (performance concern)
- "Login copy feels unfriendly" → Copywriting (text concern)
- Same feature, four different owners based on what the user actually needs.

---

## Clean Handoff Protocol

### When to Hand Off
1. Question is clearly outside your domain
2. You could answer but a specialist would do it significantly better
3. The question requires knowledge you don't reliably have
4. Previous attempts in your domain failed and the issue may be in another domain

### Handoff Template
```
"This is better handled by [specialist] because [specific reason].

What I can tell you from my domain:
[Any relevant observations from your perspective]

What [specialist] should look at:
[Specific direction for the receiving agent]

Key context to carry over:
[Constraints, decisions, or information the next agent needs]
"
```

### Handoff Examples

**Frontend → Backend:**
"The component is rendering correctly — the issue is that the API returns stale data. Backend should check the caching strategy on `GET /api/users`. The component expects fresh data on each mount (no client-side cache), so the staleness is server-side."

**Backend → Database:**
"The API route is correct but the query takes 3.2 seconds. Database should look at the `orders` table query — it's doing a full table scan on `WHERE user_id = ? AND status = 'active' ORDER BY created_at DESC`. Likely needs a composite index on `(user_id, status, created_at)`."

**Security → Frontend:**
"The CSP headers are correctly set. The XSS vulnerability is in the React component that uses `dangerouslySetInnerHTML` on user-provided content. Frontend should sanitize with DOMPurify before rendering."

---

## Boundary Detection Heuristics

### Keyword-Based Detection
| Keywords in Query | Likely Domain |
|---|---|
| component, render, CSS, style, layout, responsive, animation | Frontend |
| API, route, middleware, service, endpoint, request, response | Backend |
| schema, migration, index, query, table, column, constraint | Database |
| auth, token, encryption, vulnerability, CORS, rate limit | Security |
| deploy, CI/CD, Docker, Vercel, DNS, SSL, monitoring | DevOps |
| copy, headline, CTA, messaging, tone, wording | Copywriting |
| campaign, audience, channel, growth, conversion, SEO | Marketing |

### Context-Based Detection
Beyond keywords, consider:
1. **What file is being discussed?** File path often determines domain.
   - `src/components/*` → Frontend
   - `src/app/api/*` → Backend
   - `prisma/*` → Database
   - `middleware.ts` → Security or Backend
   - `.github/workflows/*` → DevOps
2. **What's the user's goal?** The end goal determines the primary domain even if the current question touches multiple.
3. **What went wrong?** The symptom might be in one domain but the cause in another. Route to the cause domain.

---

## Agent Self-Assessment: "Am I the Right Agent?"

Before answering any question, every agent should run this check:

```
DOMAIN FIT CHECK
================
1. Does this question fall within my domain boundaries? [YES/NO]
2. Could I answer this adequately? [YES/NO/PARTIALLY]
3. Would a specialist in another domain answer this better? [YES/NO]

Results:
- YES, YES, NO → Answer it. This is my domain.
- YES, PARTIALLY, YES → Answer what I can, flag for specialist review.
- NO, *, * → Hand off. Not my domain.
- YES, YES, YES → Answer it, but note the specialist could add depth.
```

---

## Multi-Domain Queries

Some questions genuinely span multiple domains:

"Build a secure user registration flow with email verification."
- Frontend: Registration form, email input, verification code UI
- Backend: Registration API, email sending service, verification logic
- Database: User table, verification tokens table
- Security: Password hashing, rate limiting, token expiration

### Handling Multi-Domain Queries
1. **Decompose** into domain-specific sub-tasks
2. **Sequence** by dependency: Database → Backend → Security → Frontend
3. **Assign** each sub-task to the appropriate specialist
4. **Coordinate** to ensure interfaces match (API response format that frontend expects)
5. **Review** the integration points between domains

### What NOT to Do
- Have one agent do everything (quality degrades outside their domain)
- Have agents work in isolation without knowing what others are doing
- Skip the integration review (where domain boundaries meet is where bugs live)

---

## Domain Evolution

Domains aren't static. As the project evolves:
- New domains emerge (AI/ML, mobile, analytics)
- Domain boundaries shift (frontend does more server-side rendering)
- Overlap zones change (full-stack frameworks blur backend/frontend lines)

### Adaptation Rules
1. When a new capability is added, explicitly assign its domain ownership
2. When boundaries feel wrong, discuss with the team and reassign
3. When one agent keeps getting handed questions from another domain, consider whether the boundary needs updating
4. Document boundary changes — confusion about ownership is worse than wrong ownership

---

*Seed E-8 | Classification: Edge Case Handling | Priority: HIGH*
*Domain boundaries are the organizational structure of agent intelligence. Clear boundaries = clear responsibility = high quality. Blurred boundaries = confusion = mediocre output from every agent.*
