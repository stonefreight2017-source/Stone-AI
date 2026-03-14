# Golden Seed K-1: Domain Lookup Tables
# Seed: GOLD-K1 | Category: Golden Seeds | Topic: Structured Knowledge
# RAG Tags: lookup-table, domain-knowledge, terminology, definitions, reference, structured-data

---

## PURPOSE
Template and methodology for creating domain-specific lookup tables. Structured
key-value knowledge that agents CITE DIRECTLY instead of generating from memory.
When an agent needs a definition, a comparison, or a fact — look it up, don't generate it.

---

## 1. Why Lookup Tables?

```
The problem:
  Agent is asked: "What's the difference between authentication and authorization?"
  Without lookup: Agent generates from training data (may be imprecise, verbose, inconsistent)
  With lookup: Agent retrieves structured definition → Cites it → Adds context

Benefits:
  1. CONSISTENCY: Same definition every time, across all agents
  2. ACCURACY: Definitions are reviewed and verified by domain experts
  3. CITABILITY: Agent can say "According to our glossary..." (builds trust)
  4. UPDATABILITY: Change the table, all agents get the update
  5. SPEED: Retrieval is faster than generation for factual content
  6. ANTI-HALLUCINATION: Facts come from verified sources, not generation
```

---

## 2. Lookup Table Format

### Standard Format
```
TERM          | DEFINITION                              | CONTEXT                          | COMMON MISTAKES
--------------|-----------------------------------------|----------------------------------|----------------------------------
[term]        | [precise, 1-2 sentence definition]      | [when/where this term applies]   | [what people often get wrong]
```

### Format Rules
```
1. DEFINITION: Maximum 2 sentences. Must be self-contained (no "see also" as the definition).
2. CONTEXT: When would an agent need this term? What triggers retrieval?
3. COMMON MISTAKES: What do people (and LLMs) commonly get wrong about this term?
4. One term per row. No multi-term entries.
5. Alphabetical order within each table.
6. Include abbreviations as separate entries pointing to full term.
7. Date last verified for each table.
```

---

## 3. Technology Terms Lookup Table

```
TERM                    | DEFINITION                                                    | CONTEXT                                   | COMMON MISTAKES
------------------------|---------------------------------------------------------------|-------------------------------------------|------------------------------------------
API                     | Application Programming Interface. A contract defining how    | Any discussion of service integration,    | Confusing API with endpoint. An API is the
                        | software components communicate and exchange data.            | web services, or system architecture.     | entire contract; an endpoint is one URL.
API Gateway             | A service that sits between clients and backend services,     | Microservices architecture, serverless     | Thinking it's just a reverse proxy. Gateways
                        | handling routing, auth, rate limiting, and request transform.  | applications, API management.             | also handle auth, throttling, and transforms.
CDN                     | Content Delivery Network. Distributed servers that cache      | Static assets, media delivery, reducing   | Assuming CDN handles dynamic content well.
                        | content close to users for faster delivery.                   | latency for global users.                 | CDNs primarily optimize static content.
CI/CD                   | Continuous Integration / Continuous Deployment. Automated     | Software development workflow, DevOps,    | Conflating CI with CD. CI = merge + test.
                        | build, test, and deployment pipeline.                         | release management.                       | CD = automated deployment to production.
CORS                    | Cross-Origin Resource Sharing. Browser security mechanism     | Frontend calling APIs on different        | Thinking CORS is a server-side security
                        | controlling which origins can access resources.               | domains. Debugging "CORS error."          | feature. It's a browser policy, not a firewall.
CSP                     | Content Security Policy. HTTP header that restricts which     | Web security, preventing XSS,            | Setting CSP too permissively (unsafe-inline).
                        | resources a browser can load for a page.                      | compliance requirements.                  | CSP should be restrictive by default.
DNS                     | Domain Name System. Translates human-readable domain names   | Domain configuration, deployment,         | Not understanding DNS propagation delay
                        | (stone-ai.net) to IP addresses.                              | troubleshooting connectivity.             | (changes can take up to 48 hours globally).
gRPC                    | Google Remote Procedure Call. High-performance RPC framework  | Microservice communication, low-latency   | Using gRPC for browser clients without
                        | using Protocol Buffers and HTTP/2.                           | service-to-service calls.                 | gRPC-Web proxy (browsers can't do HTTP/2 gRPC).
IaC                     | Infrastructure as Code. Managing infrastructure through       | Cloud deployment, DevOps,                 | Treating IaC as one-time setup. IaC should
                        | version-controlled configuration files (Terraform, Pulumi).   | environment management.                   | be the ONLY way infra changes are made.
JWT                     | JSON Web Token. Compact, signed token for securely           | Authentication, API authorization,        | Storing sensitive data in JWT payload (it's
                        | transmitting claims between parties.                          | session management.                       | base64-encoded, not encrypted — anyone can read it).
mTLS                    | Mutual TLS. Both client and server present certificates to   | Service-to-service auth, zero trust,      | Thinking mTLS replaces application-level
                        | verify each other's identity.                                | high-security environments.               | authorization. mTLS is identity, not permission.
ORM                     | Object-Relational Mapping. Library that maps database tables | Database access in application code,      | Over-relying on ORM for complex queries.
                        | to programming language objects (e.g., Prisma, Sequelize).   | CRUD operations.                          | Raw SQL is often better for complex analytics.
REST                    | Representational State Transfer. Architectural style for      | Web APIs, CRUD operations,                | Thinking REST requires JSON. REST is an
                        | networked applications using HTTP methods on resources.        | resource-based API design.                | architectural style, not a data format.
RBAC                    | Role-Based Access Control. Authorization model where          | User permissions, admin features,         | Creating too many granular roles. Start with
                        | permissions are assigned to roles, and roles to users.        | multi-tenant applications.                | few broad roles, add granularity as needed.
SLA                     | Service Level Agreement. A contract guaranteeing specific     | Client contracts, vendor evaluation,      | Confusing SLA with SLO. SLA is the CONTRACT
                        | service metrics (uptime, latency, support response).         | compliance.                               | with consequences. SLO is the internal target.
SLO                     | Service Level Objective. An internal target for service       | Reliability engineering, incident         | Setting SLO = SLA. SLO should be STRICTER
                        | reliability (e.g., 99.95% availability).                     | response, error budget management.        | than SLA to provide safety margin.
SSR                     | Server-Side Rendering. HTML is generated on the server       | Next.js, SEO, initial page load,          | Confusing SSR with SSG. SSR generates on
                        | for each request, sent to the client fully rendered.          | dynamic content that needs SEO.           | each request. SSG generates at build time.
SSG                     | Static Site Generation. HTML is generated at build time,     | Blogs, documentation, landing pages,      | Using SSG for frequently changing content.
                        | not per request. Fastest possible page loads.                 | marketing sites.                          | SSG pages are stale until next build.
WebSocket               | Full-duplex communication protocol over a single TCP         | Real-time features, chat, notifications,  | Using WebSocket for request-response patterns.
                        | connection, enabling bidirectional data flow.                 | live updates, collaborative editing.      | HTTP is better for simple req/res flows.
```

---

## 4. Business Terms Lookup Table

```
TERM                    | DEFINITION                                                    | CONTEXT                                   | COMMON MISTAKES
------------------------|---------------------------------------------------------------|-------------------------------------------|------------------------------------------
ARPU                    | Average Revenue Per User. Total revenue divided by total      | Revenue analysis, pricing optimization,   | Including free users in ARPU calculation
                        | paying users in a period.                                     | investor reporting.                       | (distorts the metric — use ARPPU instead).
CAC                     | Customer Acquisition Cost. Total sales + marketing cost       | Growth strategy, unit economics,          | Not including ALL acquisition costs (salary
                        | divided by number of new customers acquired.                  | profitability analysis.                   | of sales team, tools, content creation).
Churn Rate              | Percentage of customers who cancel/leave in a given period.   | Retention analysis, subscription health,  | Measuring churn monthly vs. annually without
                        | Monthly churn of 5% = ~46% annual churn.                     | forecasting.                              | specifying. Monthly 5% ≠ annual 5%.
CLV / LTV               | Customer Lifetime Value. Total revenue expected from a        | Pricing, acquisition strategy,            | Using CLV without accounting for churn.
                        | customer over their entire relationship with the business.    | profitability analysis.                   | CLV = ARPU × Average Customer Lifespan.
Conversion Rate         | Percentage of visitors/users who complete a desired action    | Funnel optimization, marketing,           | Comparing conversion rates across different
                        | (signup, purchase, upgrade).                                  | A/B testing.                              | funnels (homepage vs. landing page rates differ).
DAU / MAU               | Daily/Monthly Active Users. Count of unique users who        | Product engagement, growth metrics,       | Counting "active" without defining what
                        | perform a meaningful action in that period.                   | investor reporting.                       | "active" means (login? feature use? purchase?).
Freemium                | Business model offering a free tier with paid upgrades.      | SaaS pricing, growth strategy,            | Giving away too much in free tier (no
                        | Free tier drives adoption, paid tiers drive revenue.          | user acquisition.                         | incentive to upgrade) or too little (no value).
GMV                     | Gross Merchandise Value. Total value of goods/services        | Marketplace businesses, transaction       | Reporting GMV as revenue. GMV is total
                        | sold through a platform.                                      | volume, marketplace health.               | transactions; revenue is your cut/commission.
MRR                     | Monthly Recurring Revenue. Predictable revenue from active   | Subscription businesses, forecasting,     | Including one-time payments or annual plans
                        | subscriptions, normalized to a monthly amount.                | investor reporting.                       | without dividing by 12 for monthly view.
NPS                     | Net Promoter Score. Customer satisfaction metric based on     | Customer satisfaction, product quality,    | Surveying too infrequently or after only
                        | "How likely are you to recommend us?" (0-10 scale).           | churn prediction.                         | positive interactions (sampling bias).
PMF                     | Product-Market Fit. When a product satisfies strong market   | Startup strategy, product development,    | Declaring PMF based on vanity metrics.
                        | demand, evidenced by organic growth and retention.            | investment decisions.                     | True PMF = high retention + organic growth.
TAM / SAM / SOM         | Total/Serviceable/Obtainable Market. TAM = all potential     | Market analysis, investor pitches,        | Claiming TAM as achievable market size.
                        | customers. SAM = reachable ones. SOM = realistic capture.     | strategic planning.                       | SOM is what matters — TAM is theoretical.
Unit Economics          | Revenue and costs associated with a single unit (user,        | Business viability, scaling decisions,    | Ignoring marginal costs when calculating
                        | transaction, product). Determines if business model works.    | pricing strategy.                         | unit economics (server costs per user, etc.).
```

---

## 5. Security Terms Lookup Table

```
TERM                    | DEFINITION                                                    | CONTEXT                                   | COMMON MISTAKES
------------------------|---------------------------------------------------------------|-------------------------------------------|------------------------------------------
BOLA                    | Broken Object Level Authorization. API returns resources      | API security, authorization testing,      | Confusing BOLA with authentication bypass.
                        | without verifying the requester owns/can access them.         | OWASP API Top 10.                         | BOLA = authenticated user accessing OTHERS' data.
BFLA                    | Broken Function Level Authorization. API allows users to     | Admin endpoint security, role-based       | Assuming hidden endpoints are secure.
                        | call functions (e.g., admin actions) beyond their role.       | access control, privilege escalation.     | Obscurity is not security.
CSRF                    | Cross-Site Request Forgery. Attack where a malicious site    | Web form security, state-changing         | Thinking CSRF is prevented by CORS. CORS
                        | triggers actions on a site where the user is authenticated.   | operations, cookie-based auth.            | prevents reading responses, not sending requests.
CVE                     | Common Vulnerabilities and Exposures. Standardized ID for    | Vulnerability management, patching,       | Treating all CVEs equally. CVSS score
                        | publicly known security vulnerabilities (e.g., CVE-2021-X).  | security advisories.                      | matters — prioritize Critical and High.
Defense in Depth        | Security strategy using multiple layers of protection so     | Architecture design, security planning,   | Using it to justify not fixing vulnerabilities.
                        | if one layer fails, others still protect the system.          | risk management.                          | Each layer should work, not just exist.
IDOR                    | Insecure Direct Object Reference. User can access resources  | Same as BOLA (older terminology).         | IDOR and BOLA are the same vulnerability.
                        | by manipulating identifiers (IDs, filenames) in requests.     | API testing, parameter manipulation.      | BOLA is the modern OWASP term.
Least Privilege         | Principle that users/services should have only the minimum   | IAM configuration, role design,           | Granting broad permissions "temporarily"
                        | permissions needed to perform their function.                 | access control.                           | and forgetting to revoke them.
MFA                     | Multi-Factor Authentication. Requiring two or more           | Account security, compliance, zero trust, | Treating SMS-based MFA as equally secure
                        | verification factors (password + phone + biometric).          | admin access.                             | to TOTP or hardware keys. SMS is weakest.
OWASP                   | Open Worldwide Application Security Project. Community       | Security standards, vulnerability         | Treating OWASP Top 10 as a complete
                        | producing security tools, guides, and the Top 10 list.        | assessment, compliance.                   | security checklist. It's a starting point.
PII                     | Personally Identifiable Information. Data that can identify  | Privacy compliance, data handling,        | Excluding aggregate data that could be
                        | a specific individual (name, email, SSN, IP, location).       | GDPR/CCPA requirements.                   | de-anonymized. Context-dependent.
SSRF                    | Server-Side Request Forgery. Attacker makes the server       | URL processing, file fetching,            | Blocking only http://localhost. Attackers use
                        | send requests to internal resources the attacker can't reach. | webhook processing, image proxying.       | IPs (127.0.0.1), DNS rebinding, IPv6, etc.
XSS                     | Cross-Site Scripting. Injecting malicious scripts into       | User input display, HTML rendering,       | Only sanitizing input. Must also encode
                        | web pages viewed by other users.                              | content management.                       | output. Context matters (HTML vs. JS vs. URL).
Zero Day               | Vulnerability that is exploited before the vendor knows       | Threat assessment, incident response,     | Calling known, unpatched vulns "zero days."
                        | about it or has released a patch.                             | risk management.                          | Once disclosed, it's a "known vulnerability."
Zero Trust              | Security model that verifies every request regardless of     | Network security, access control,         | Thinking zero trust means no one is trusted.
                        | network location. "Never trust, always verify."               | modern architecture.                      | It means trust is VERIFIED, not assumed.
```

---

## 6. Legal Terms Lookup Table

```
TERM                    | DEFINITION                                                    | CONTEXT                                   | COMMON MISTAKES
------------------------|---------------------------------------------------------------|-------------------------------------------|------------------------------------------
CCPA                    | California Consumer Privacy Act. Gives CA residents rights   | US privacy compliance, user data           | Assuming CCPA only applies to CA companies.
                        | to know, delete, and opt out of data sales.                  | handling, privacy policy.                  | It applies to ANY company handling CA data.
Data Controller         | Entity that determines the purposes and means of processing  | GDPR compliance, data processing          | Confusing controller with processor. The
                        | personal data. Decides WHAT data to collect and WHY.          | agreements, privacy policy.               | controller decides; the processor executes.
Data Processor          | Entity that processes personal data on behalf of the         | GDPR compliance, vendor management,       | Processors can become controllers if they
                        | controller, following the controller's instructions.          | cloud service agreements.                 | start making decisions about data use.
DMCA                    | Digital Millennium Copyright Act. US law addressing          | Content moderation, copyright claims,     | DMCA Safe Harbor only applies if you have
                        | copyright in the digital age, including Safe Harbor.          | hosting platforms.                        | a proper takedown process and respond promptly.
GDPR                    | General Data Protection Regulation. EU law governing         | EU user data, privacy compliance,         | Thinking GDPR only applies in the EU. It
                        | collection and processing of personal data of EU residents.   | consent management, data portability.     | applies to ANY company serving EU residents.
IP                      | Intellectual Property. Legal rights to creations of the mind | Business strategy, licensing, trademark,  | Confusing IP types. Copyright (automatic),
                        | including patents, trademarks, copyrights, trade secrets.     | competitor analysis.                      | trademark (registered), patent (applied for).
SCC                     | Standard Contractual Clauses. Pre-approved contract terms    | International data transfer (EU→US),      | Thinking SCCs alone are sufficient. Post-
                        | for transferring personal data outside the EU.                | GDPR compliance, vendor agreements.       | Schrems II requires supplementary measures.
Terms of Service        | Legal agreement between service provider and user defining   | User agreements, liability limitation,    | Making ToS too complex for users to read.
                        | rules of use, liability, and user obligations.               | content policies.                         | Key terms should be highlighted/summarized.
```

---

## 7. Creating New Lookup Tables

### Template for New Domain Tables
```markdown
# [Domain] Terms Lookup Table
# Last verified: YYYY-MM-DD
# Maintained by: [team/person]
# Entry count: [N]

TERM | DEFINITION | CONTEXT | COMMON MISTAKES
-----|------------|---------|----------------
[term] | [1-2 sentences, precise] | [when this applies] | [what people get wrong]
```

### Quality Criteria for New Entries
```
□ Definition is self-contained (no external references needed)
□ Definition is precise (not vague or overly broad)
□ Context helps RAG retrieval (includes trigger keywords)
□ Common mistakes add genuine value (not obvious)
□ No duplicate entries in any table
□ Alphabetically ordered
□ Verified by domain expert
□ Tested: Does an agent give better answers using this entry?
```

### Maintenance Schedule
```
MONTHLY:
  - Add terms encountered in agent interactions but not in tables
  - Verify accuracy of entries modified in the last month

QUARTERLY:
  - Full accuracy review of all entries
  - Remove obsolete terms
  - Add new industry terms
  - Verify "common mistakes" are still common

ANNUALLY:
  - Major revision of all tables
  - Add new domain tables if gaps identified
  - Archive deprecated terms (don't delete — may be needed for historical context)
```

---

## 8. Agent Integration

### How Agents Should Use Lookup Tables
```
1. RETRIEVAL: When agent encounters a term it's about to define,
   retrieve the lookup table entry instead of generating a definition.

2. CITATION: "According to our glossary, [term] is defined as [definition]."
   This builds trust and ensures consistency.

3. CORRECTION: If a user uses a term incorrectly (matching a "common mistake"),
   the agent can gently correct: "Just to clarify — [term] actually refers to
   [correct definition]. A common misconception is [common mistake]."

4. TEACHING: When explaining concepts that involve multiple terms,
   retrieve all relevant entries and weave them together.

5. CROSS-REFERENCE: If a user asks about term A and it relates to term B,
   retrieve both entries and explain the relationship.
```

---

*This golden seed provides the FOUNDATION for factual accuracy across all agents.
Lookup tables are living documents — they grow and improve over time.
Last validated: 2026-03.*
