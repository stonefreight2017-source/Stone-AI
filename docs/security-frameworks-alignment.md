# Security Frameworks Alignment

## Stone AI — Internal Reference Document

**Date**: March 14, 2026
**Classification**: Internal — supports security page claims and FTC compliance
**Purpose**: Map Stone AI's actual security controls to specific industry frameworks

---

## 1. Frameworks Stone AI Aligns With

### 1.1 OWASP Top 10 (2021)

**What it is**: The Open Worldwide Application Security Project's list of the 10 most critical web application security risks. Updated periodically; the 2021 edition is current.

**URL**: https://owasp.org/www-project-top-ten/

**Why we reference it**: OWASP Top 10 is the most widely recognized standard for web application security. It is referenced by PCI DSS, NIST, and most security auditors. Stone AI's codebase is audited against these 10 categories before every merge (per CLAUDE.md rule: "Audit all new features for OWASP top 10 before merge").

### 1.2 OWASP ASVS Level 1 (Application Security Verification Standard)

**What it is**: A framework of security requirements for designing, developing, and testing secure web applications. Level 1 covers "opportunistic" security — the minimum for all applications.

**URL**: https://owasp.org/www-project-application-security-verification-standard/

**Why we reference it**: ASVS Level 1 provides specific, testable requirements that map directly to our implementation (input validation, authentication, session management, encryption).

### 1.3 NIST Cybersecurity Framework (CSF) — Protect Function

**What it is**: The National Institute of Standards and Technology's framework for managing cybersecurity risk. The Protect function covers access control, data security, and protective technology.

**URL**: https://www.nist.gov/cyberframework

**Why we reference it**: NIST CSF is the US government's recommended cybersecurity framework. Stone AI's rate limiting, encryption, and access controls align with the Protect function categories.

### 1.4 CWE/SANS Top 25 Most Dangerous Software Weaknesses

**What it is**: A list of the most common and impactful software weaknesses that lead to vulnerabilities, maintained by MITRE and SANS Institute.

**URL**: https://cwe.mitre.org/top25/archive/2023/2023_top25_list.html

**Why we reference it**: Our input validation (Zod .strict()) and output encoding practices directly address CWE entries like CWE-79 (XSS), CWE-89 (SQL Injection), and CWE-20 (Improper Input Validation).

---

## 2. Control-to-Framework Mapping

### OWASP Top 10 (2021) Mapping

| OWASP Category | Stone AI Control | Implementation |
|---------------|-----------------|----------------|
| **A01: Broken Access Control** | Clerk server-side auth + role-based access | `src/lib/auth.ts` — all API routes verify session server-side. Tier-based agent access enforced in `tier-config.ts`. |
| **A02: Cryptographic Failures** | AES-256-GCM encryption | `src/lib/encryption.ts` — sensitive data encrypted at rest. HTTPS enforced in transit via Cloudflare SSL Full. |
| **A03: Injection** | Zod `.strict()` validation on all mutations | All API mutation schemas use Zod with `.strict()` mode. Prisma ORM parameterizes all queries (prevents SQL injection). |
| **A04: Insecure Design** | Security review before merge | OWASP top 10 audit required before merge (per codebase rules). Threat modeling on new features. |
| **A05: Security Misconfiguration** | CSP headers + security headers | Content Security Policy, X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security configured in middleware. |
| **A06: Vulnerable Components** | Dependency management | npm audit on dependencies. Vercel deployment platform handles infrastructure patching. |
| **A07: Identification and Auth Failures** | Clerk authentication | Server-side session verification. Short-lived tokens with automatic rotation. No custom auth implementation. |
| **A08: Software and Data Integrity** | Vercel deployment pipeline | Deployments through Vercel with build verification. No arbitrary code execution paths. |
| **A09: Security Logging and Monitoring** | Audit logging system | `src/lib/audit.ts` — security-relevant events logged. Monitoring for anomalous activity. |
| **A10: Server-Side Request Forgery** | Input validation + URL allowlisting | Avatar system blocks SVG data URIs. API endpoints validate and restrict outbound requests. |

### NIST CSF Protect Function Mapping

| NIST CSF Category | Stone AI Control | Implementation |
|-------------------|-----------------|----------------|
| **PR.AC (Access Control)** | Clerk auth + tier-based access | Role-based access control. Tier enforcement on agent access. |
| **PR.DS (Data Security)** | AES-256-GCM + HTTPS | Encryption at rest and in transit. No plaintext credential storage. |
| **PR.IP (Information Protection)** | CSP headers + Zod validation | Input/output validation. Content Security Policy. Security headers. |
| **PR.MA (Maintenance)** | Vercel managed infrastructure | Platform-managed updates and patching. |
| **PR.PT (Protective Technology)** | Rate limiting + WAF | Rate limiting on all endpoints. Cloudflare WAF and DDoS protection. |

### OWASP ASVS Level 1 Mapping (Selected Requirements)

| ASVS Requirement | Stone AI Implementation |
|-----------------|------------------------|
| V1.1: Secure SDLC | OWASP audit before merge. Security review process. |
| V2.1: Password Security | Delegated to Clerk (industry-standard auth provider). |
| V3.1: Session Management | Clerk handles session tokens. Short-lived, auto-rotated. |
| V5.1: Input Validation | Zod `.strict()` on all mutation schemas. Server-side validation. |
| V6.1: Cryptography | AES-256-GCM for sensitive data. TLS 1.2+ in transit. |
| V8.1: Data Protection | No plaintext secrets. Environment variables for credentials. |
| V14.1: HTTP Security | CSP, HSTS, X-Frame-Options, X-Content-Type-Options headers. |

### CWE/SANS Top 25 Mapping (Selected Entries)

| CWE ID | Weakness | Stone AI Mitigation |
|--------|----------|-------------------|
| CWE-79 | Cross-Site Scripting (XSS) | CSP headers. React's default output encoding. Input sanitization. |
| CWE-89 | SQL Injection | Prisma ORM with parameterized queries. No raw SQL. |
| CWE-20 | Improper Input Validation | Zod `.strict()` on all API mutations. |
| CWE-78 | OS Command Injection | No user-controlled shell execution in production. |
| CWE-287 | Improper Authentication | Clerk server-side auth. No custom auth. |
| CWE-862 | Missing Authorization | Tier-based access control enforced server-side. |
| CWE-311 | Missing Encryption | AES-256-GCM at rest. HTTPS in transit. |

---

## 3. What We Do NOT Have (Transparency)

| Certification / Standard | Status | Notes |
|--------------------------|--------|-------|
| **SOC 2 Type I/II** | Not certified | Requires third-party audit ($20,000-$50,000+). Planned post-revenue. |
| **ISO 27001** | Not certified | Requires formal ISMS and third-party audit. Future consideration. |
| **HIPAA** | Not compliant | Stone AI does not process protected health information (PHI). |
| **PCI DSS** | Not directly applicable | Payment processing delegated to Stripe (PCI DSS Level 1 certified). |
| **FedRAMP** | Not authorized | Required only for US federal government contracts. |
| **GDPR DPA** | Template available | Data Processing Agreement template exists at `docs/dpa-template.md`. |

**Critical distinction**: "Aligned with" does NOT mean "certified by." Stone AI implements security practices that follow the principles and recommendations of these frameworks, but has not undergone formal third-party audits for certification. This distinction must be clear in all marketing and legal materials.

---

## 4. Recommended Language for Public Use

### Security Page — Primary Description
> "Stone AI implements security practices aligned with OWASP Top 10 (2021) guidelines, NIST Cybersecurity Framework principles, and OWASP Application Security Verification Standard (ASVS) Level 1 requirements."

### Encryption Section
> "Sensitive data is protected using AES-256-GCM encryption at rest, aligned with OWASP Top 10 A02 (Cryptographic Failures) guidelines. All data in transit is encrypted via TLS with HTTPS enforced across the entire platform."

### Authentication Section
> "Stone AI uses Clerk for authentication with server-side session verification, short-lived tokens, and automatic rotation — aligned with OWASP Top 10 A07 (Identification and Authentication Failures) and ASVS V2/V3 requirements."

### Input Validation Section
> "All user input is validated using strict schema validation (Zod with .strict() mode) on both client and server side, with parameterized database queries via Prisma ORM — aligned with OWASP Top 10 A03 (Injection) and CWE-20/CWE-89 mitigations."

### Infrastructure Section
> "Production infrastructure is protected by Cloudflare WAF and DDoS protection with Content Security Policy headers, rate limiting on all endpoints, and automated threat detection — aligned with NIST CSF Protect Function (PR.PT) requirements."

### Disclaimer (footer or fine print)
> "Stone AI's security practices are aligned with the referenced frameworks but have not been independently certified through formal third-party audits. 'Aligned with' indicates that our controls follow the principles and recommendations of these standards."

---

## 5. Frameworks Section for Security Page

The following frameworks should be listed on the security page:

1. **OWASP Top 10 (2021)** — Web application security risk mitigation
2. **OWASP ASVS Level 1** — Application security verification baseline
3. **NIST Cybersecurity Framework (Protect)** — Data protection and access control
4. **CWE/SANS Top 25** — Dangerous software weakness prevention

---

*Document prepared by Cardinal (Head 2) — The Architect*
*Stone AI Internal Security Intelligence Report*
