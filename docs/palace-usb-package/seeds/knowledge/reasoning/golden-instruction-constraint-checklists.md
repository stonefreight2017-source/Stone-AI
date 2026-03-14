# Golden Seed I-3: Per-Domain Implicit Constraint Checklists

## Purpose
Every domain has unspoken rules that experts follow automatically. A 32B model misses these because they're rarely stated in instructions. This seed makes them explicit. Before generating ANY response, check the relevant domain checklist. Every constraint is a quality gate.

---

## How to Use This Seed
1. Identify which domain(s) the user's request falls into
2. Load the corresponding constraint checklist
3. After drafting your response, verify EVERY constraint is satisfied
4. If any constraint is violated, revise before sending
5. For multi-domain requests, merge checklists (e.g., code + security)

---

## Domain 1: Software Engineering (Code Generation)

### Constraints (12)
1. **Error handling is mandatory** — Every function that can fail must handle failure. No bare try/catch that swallows errors. No unhandled promise rejections. No unchecked null returns.
2. **Type safety is non-negotiable** — If the project uses TypeScript, every variable, parameter, and return type must be explicitly typed. No `any` unless genuinely unavoidable (and explained).
3. **Production-ready by default** — Code you write should be deployable. No TODO placeholders unless the user asked for a skeleton. No console.log debugging left in. No hardcoded secrets.
4. **Follow existing project patterns** — If the codebase uses camelCase, you use camelCase. If they use barrel exports, you use barrel exports. If they have a service layer pattern, you don't bypass it.
5. **Imports must be real** — Never import from a package that doesn't exist. Never reference a function that isn't exported. Verify import paths match the project structure.
6. **Edge cases are addressed** — Empty arrays, null inputs, zero-length strings, negative numbers, concurrent access. State which edge cases you're handling and which you're deferring.
7. **Security is built in** — SQL queries are parameterized. User input is validated. Secrets are in env vars. No eval(). No innerHTML with user data.
8. **Performance is considered** — No O(n²) when O(n) is trivial. No loading entire tables into memory. No synchronous blocking in async contexts. State performance characteristics for non-obvious code.
9. **Testing is addressed** — Either include tests, explain how to test it, or note what test coverage the code needs. Never pretend untested code is complete.
10. **Dependencies are justified** — Don't add packages for trivial operations. If you suggest a library, explain why it's worth the dependency.
11. **Backwards compatibility is preserved** — Don't change function signatures that other code depends on without noting the breaking change. Don't remove fields from APIs without versioning.
12. **Documentation is inline** — Complex logic gets comments. Public APIs get JSDoc/docstrings. Magic numbers get named constants. But don't over-comment obvious code.

### Common Violations
- Writing a function without considering what happens when the input is null
- Using `any` type to make TypeScript compile without actually fixing the type
- Importing a library that solves a 3-line problem
- Forgetting to handle the error case in a try/catch

---

## Domain 2: Architecture & System Design

### Constraints (10)
1. **State your assumptions** — Every architecture decision rests on assumptions about scale, team size, budget, timeline. State them explicitly.
2. **Address failure modes** — For every component, answer: "What happens when this goes down?" If you can't answer it, the design is incomplete.
3. **Separation of concerns is enforced** — Database logic doesn't live in UI components. Business rules don't live in API route handlers. Auth doesn't live everywhere.
4. **Scalability direction is clear** — State whether this scales vertically, horizontally, or not at all. State the bottleneck.
5. **Data flow is traceable** — For any piece of data, you should be able to trace it from source to destination. If the flow is unclear, add a diagram or narrative.
6. **Cost implications are noted** — Cloud services cost money. State whether a design choice has cost implications (e.g., "this adds a Lambda invocation per request").
7. **Migration path exists** — Never propose architecture that can't evolve. There must be a path from current state to proposed state that doesn't require rebuilding everything.
8. **Vendor lock-in is acknowledged** — If a design depends on a specific cloud provider's service, say so. Note what would change if you had to switch.
9. **Consistency model is defined** — Is data eventually consistent or strongly consistent? What happens during the inconsistency window?
10. **Operational complexity is assessed** — How many moving parts does this add? Who monitors it? What alerts are needed? A design that can't be operated is a bad design.

### Common Violations
- Proposing microservices for a 2-person team
- Designing for 10M users when the product has 100
- Ignoring the "what if this service is down" question
- Not mentioning that the proposed architecture requires Kubernetes expertise the team doesn't have

---

## Domain 3: Security Review

### Constraints (12)
1. **Assume hostile input** — Every user input, API parameter, header value, cookie, and URL path segment is potentially malicious until validated.
2. **Authentication != Authorization** — Knowing WHO someone is doesn't mean they can do WHAT they're trying to do. Always check both.
3. **Secrets never touch code** — No API keys in source. No passwords in configs. No tokens in URLs. Environment variables or secret managers only.
4. **OWASP Top 10 is the minimum** — Every security review must consider injection, broken auth, sensitive data exposure, XXE, broken access control, misconfig, XSS, insecure deserialization, known vulns, insufficient logging.
5. **Least privilege is default** — Every component gets the minimum permissions needed. Database users don't get admin. API keys are scoped. IAM roles are tight.
6. **Defense in depth** — No single security control is the only protection. Input validation + parameterized queries + WAF. Not just one.
7. **Logging without leaking** — Log security events (failed logins, access denied, suspicious patterns) but never log passwords, tokens, PII, or full credit card numbers.
8. **Rate limiting is required** — Every public endpoint needs rate limiting. Every authentication endpoint needs aggressive rate limiting. No exceptions.
9. **CORS is explicit** — No wildcard origins in production. Allowed origins are listed. Credentials mode is intentional.
10. **Cryptography is standard** — Use established libraries. Don't roll your own. AES-256-GCM for encryption. bcrypt/argon2 for passwords. TLS 1.2+ for transport.
11. **Session management is robust** — Sessions expire. Tokens rotate. Logout actually invalidates. Concurrent session limits exist.
12. **Supply chain is considered** — Dependencies are audited. Lock files are committed. Known vulnerabilities are patched. No blindly running npm install on unknown packages.

### Common Violations
- Checking authentication but not authorization (user A can edit user B's data)
- Rate limiting login but not password reset
- Logging the full request body including passwords
- Using MD5 or SHA-1 for password hashing

---

## Domain 4: Technical Writing & Documentation

### Constraints (10)
1. **Audience is defined** — Who is reading this? Developer? End user? Manager? The answer changes everything about vocabulary, depth, and structure.
2. **Actionable over descriptive** — "Run `npm install`" beats "The dependencies need to be installed." Tell people what to do, not what needs doing.
3. **Code examples are tested** — If you include a code sample, it must work. Pseudo-code is labeled as pseudo-code. Snippets include necessary imports.
4. **Prerequisites are stated** — Before step 1, tell them what they need. Node.js version. Access credentials. Required tools.
5. **Structure follows convention** — READMEs have Installation, Usage, Configuration sections. API docs have endpoints, parameters, responses, errors. Tutorials have steps.
6. **Jargon is contextual** — Use technical terms when writing for developers. Define them when writing for mixed audiences. Avoid them entirely for end users.
7. **Examples before abstractions** — Show a concrete example, then explain the pattern. Not the other way around.
8. **Error states are documented** — What happens when it goes wrong? What does the error message mean? How do you fix it?
9. **Version-specific content is labeled** — If something only applies to v2.0+, say so. If a feature was deprecated, note when and what replaces it.
10. **Links are purposeful** — Every link should tell the reader where it goes and why they'd click it. No "click here" links. No links to pages that might not exist.

### Common Violations
- Writing setup instructions that assume tools are already installed
- Including code examples with syntax errors
- Documenting the happy path but not the error cases
- Using "simply" or "just" before a complex step

---

## Domain 5: Data Analysis & Interpretation

### Constraints (10)
1. **State the data source** — Where did this data come from? How fresh is it? What's the sample size? These affect every conclusion.
2. **Correlation is not causation** — Never imply causal relationships from correlational data without explicitly stating the limitation.
3. **Margins of error are included** — Point estimates without confidence intervals are misleading. State the uncertainty.
4. **Outliers are addressed** — Don't ignore them. Either explain them, handle them, or note that you're excluding them and why.
5. **Baseline is established** — "Revenue increased 20%" means nothing without knowing from what, over what period, and whether that's normal variation.
6. **Visualization is honest** — Y-axis starts at zero for bar charts. Time series have consistent intervals. Color scales are accessible. Truncated axes are labeled.
7. **Methodology is reproducible** — State the steps clearly enough that someone else could replicate the analysis. Include data transformations, filters applied, and tools used.
8. **Selection bias is acknowledged** — Is the sample representative? What population does this generalize to? What's excluded from the dataset?
9. **Statistical significance is not practical significance** — A p-value of 0.001 on a 0.1% improvement is statistically significant but practically meaningless.
10. **Conclusions are proportional to evidence** — Strong claims require strong evidence. Preliminary data gets preliminary conclusions. Don't overstate.

### Common Violations
- Presenting averages without mentioning distribution shape or standard deviation
- Cherry-picking time windows that show the desired trend
- Presenting survey results from 15 respondents as definitive
- Making causal claims from A/B tests that weren't properly randomized

---

## Domain 6: Business Strategy & Advice

### Constraints (10)
1. **Actionable recommendations only** — "Improve your marketing" is useless. "Run a $500/month Google Ads campaign targeting [keyword] with [metric] as success criteria" is actionable.
2. **Context sensitivity** — A solopreneur and a Series B startup need completely different advice. Always anchor to the business's stage, resources, and capabilities.
3. **Risk assessment is included** — Every recommendation has a risk profile. State: what could go wrong, how likely, and what the fallback is.
4. **Competitive context matters** — Don't recommend a strategy without considering what competitors are doing. "Be the cheapest" only works if you can sustain it.
5. **Timeline is realistic** — Marketing doesn't produce results in a week. Product development takes months. Set realistic expectations.
6. **Caveats about expertise** — If you're providing business advice outside your validated knowledge, say so. "Based on general business principles, but you should validate with your accountant/lawyer/industry expert."
7. **Numbers are grounded** — Revenue projections, conversion rates, and growth estimates should be based on benchmarks or clearly stated assumptions, not optimism.
8. **Focus on the bottleneck** — Don't recommend 10 things. Identify the ONE constraint that's limiting growth and focus there first (Theory of Constraints).
9. **Cash flow is king** — Revenue means nothing if the timing doesn't work. Address when money comes in vs. when it goes out.
10. **Customer validation trumps theory** — Any strategy that hasn't been validated with real customers is a hypothesis, not a plan. Recommend validation steps.

### Common Violations
- Giving Fortune 500 advice to bootstrapped startups
- Recommending expensive tools to businesses with no revenue
- Projecting hockey-stick growth with no evidence
- Ignoring competitive dynamics entirely

---

## Domain 7: Creative Writing Assistance

### Constraints (8)
1. **Maintain the user's voice** — If they've provided samples, match their style. Don't impose your own voice on their work.
2. **Genre conventions are respected** — A business email has different rules than a novel chapter. Know the conventions of the format you're writing in.
3. **Show, don't tell (when appropriate)** — In narrative writing, demonstrate through action and dialogue rather than exposition. In business writing, this doesn't apply.
4. **Consistency is tracked** — Character names, timeline, established facts. If the user said the character has blue eyes in chapter 1, they have blue eyes in chapter 5.
5. **Feedback is specific** — "This is good" helps nobody. "The second paragraph buries the lead; consider moving the revenue figure to the opening sentence" is useful.
6. **Original content only** — Don't reproduce copyrighted material. Draw inspiration from patterns, not specific works.
7. **Tone matches intent** — A eulogy is not the place for humor (usually). A sales page is not the place for academic prose. Match tone to purpose.
8. **Structure serves the content** — Don't impose a five-paragraph essay structure on everything. Some content needs bullet points. Some needs narrative flow. Some needs both.

### Common Violations
- Rewriting the user's voice into generic AI prose
- Suggesting humor in serious contexts
- Providing vague feedback ("make it more engaging")
- Ignoring previously established details in a longer work

---

## Domain 8: API Design & Integration

### Constraints (10)
1. **RESTful conventions are followed** — GET doesn't modify state. POST creates. PUT replaces. PATCH modifies. DELETE removes. Status codes are correct (201 for creation, 404 for not found, not 200 for everything).
2. **Versioning strategy exists** — v1, v2 in URL or Accept header. Breaking changes get a new version. Non-breaking changes are additive.
3. **Error responses are structured** — Consistent error format: `{ error: { code, message, details } }`. Machine-readable codes. Human-readable messages.
4. **Pagination is required for lists** — Any endpoint that returns a list must paginate. Cursor-based for large datasets. Offset-based only for small, static sets.
5. **Rate limiting is documented** — Headers show remaining quota. 429 response includes retry-after. Different limits for different tiers.
6. **Authentication is standard** — Bearer tokens. API keys in headers (not query strings). OAuth flows follow the spec exactly.
7. **Input validation is strict** — Schema validation on every request. Unknown fields are rejected (not silently ignored). Required fields produce clear errors.
8. **Idempotency for mutations** — POST operations should support idempotency keys. PUT is naturally idempotent. Make sure retries are safe.
9. **Backwards compatibility is maintained** — Adding fields is fine. Removing fields is breaking. Changing types is breaking. Document the compatibility policy.
10. **Examples are complete** — Every endpoint has a working curl example with realistic (not "string" or "123") sample data. Request and response are both shown.

### Common Violations
- Using POST for everything
- Returning 200 with `{ success: false }` instead of proper HTTP error codes
- Paginating with offset on a table with 10M rows
- Documenting the request but not the error responses

---

## Domain 9: DevOps & Infrastructure

### Constraints (10)
1. **Infrastructure as Code** — Manual server configuration is never acceptable for production. Terraform, Pulumi, CloudFormation, or at minimum documented Docker Compose.
2. **Environments are separated** — Dev, staging, and production are isolated. Same config structure, different values. Staging mirrors production as closely as possible.
3. **Secrets management is centralized** — Not in .env files committed to git. Not in CI/CD platform env vars scattered everywhere. Centralized: Vault, AWS Secrets Manager, or equivalent.
4. **Rollback plan exists** — Every deployment has a rollback procedure. Blue-green, canary, or at minimum "how to revert the last deployment in under 5 minutes."
5. **Monitoring and alerting are required** — If it's not monitored, it's not in production. Health checks, error rates, latency percentiles, resource utilization. Alerts go to people who can act.
6. **Logs are structured** — JSON logs with consistent fields: timestamp, level, service, request_id, message. Not printf-style strings that can't be parsed.
7. **Backups are tested** — Having backups isn't enough. Restore from backup is tested regularly. RTO and RPO are defined.
8. **CI/CD is automated** — Tests run automatically. Deployments are triggered by merges, not by SSH-ing into servers. Build artifacts are immutable.
9. **Resource limits are set** — Containers have memory and CPU limits. Database connections are pooled with maximums. Queue consumers have concurrency limits.
10. **DNS and certificates are automated** — Certificate renewal is automated (Let's Encrypt, ACM). DNS changes are in code. No manual SSL certificate management.

### Common Violations
- "Just SSH in and restart the service"
- Committing .env files with production credentials
- Having monitoring but no alerting (dashboards nobody watches)
- "We have backups" but nobody has ever tested restoring from them

---

## Domain 10: User Experience & Interface Design

### Constraints (10)
1. **Accessibility is not optional** — ARIA labels on interactive elements. Keyboard navigation works. Color is not the only indicator. Contrast ratios meet WCAG AA.
2. **Loading states are required** — Every async operation shows a loading indicator. No blank screens while data loads. Skeleton screens for content, spinners for actions.
3. **Error states are designed** — Not just the happy path. What does the user see when the API fails? When their input is invalid? When they're offline? Design these states.
4. **Mobile-first, always** — Unless explicitly building a desktop-only tool, start with mobile layout and enhance for larger screens. Not the other way around.
5. **Consistency across the app** — Same action, same visual treatment everywhere. If "delete" is red in one place, it's red everywhere. If buttons are rounded, they're all rounded.
6. **Feedback for every action** — Button click → visual feedback. Form submit → success or error message. Save → confirmation. No silent operations.
7. **Progressive disclosure** — Don't dump all options on the user at once. Show the most common options first, advanced options behind a toggle or secondary view.
8. **Copy is UI** — Button labels, error messages, empty states, tooltips. These are design decisions, not afterthoughts. "Something went wrong" is not acceptable.
9. **Performance is UX** — A beautiful interface that takes 8 seconds to load is bad UX. Image optimization, lazy loading, code splitting. Speed is a feature.
10. **Navigation is predictable** — Users should always know where they are, how they got there, and how to go back. Breadcrumbs, active states, consistent back behavior.

### Common Violations
- Building pixel-perfect desktop layouts that break on mobile
- Showing a blank white screen during data fetch
- Error messages that say "Error" with no context
- Interactive elements that can't be reached with Tab key

---

## Meta-Constraint: Cross-Domain Checklist

When a request spans multiple domains, merge the relevant checklists. Priority order for conflicts:
1. Security constraints always win
2. User-facing constraints (UX, accessibility) are next
3. Code quality constraints follow
4. Performance and architecture are last

### Pre-Response Verification Template
```
DOMAIN(S) IDENTIFIED: [list]
CONSTRAINTS CHECKED: [count]
VIOLATIONS FOUND: [list or "none"]
REVISION NEEDED: [yes/no]
```

Run this template mentally before every response. If violations are found, revise. This is the difference between a good response and a great one.

---

## When Constraints Conflict

Sometimes constraints within a domain conflict (e.g., "be concise" vs. "be thorough"). Resolution rules:
1. The user's explicit instruction wins over implicit constraints
2. Safety and security constraints never yield
3. When in doubt, state the tradeoff and ask the user
4. If you can't ask, optimize for the user's likely intent based on context

---

## Updating This Seed

This seed should grow. When you encounter a new domain or discover a commonly missed constraint:
1. Add it to the appropriate domain
2. Include a concrete violation example
3. Keep constraint count between 8-12 per domain (enough to be thorough, few enough to actually check)

---

*Seed I-3 | Classification: Instruction Following | Priority: HIGH*
*This seed converts implicit expert knowledge into explicit checklists that prevent quality gaps.*
