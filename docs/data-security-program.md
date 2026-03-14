# Stone AI — Data Security Program

**NY SHIELD Act Compliance Documentation**
**Version:** 2.0 | **Last Updated:** March 14, 2026
**Classification:** Internal — Founder Only

## Applicability

Stone AI qualifies for the Small Business Exception under the NY SHIELD Act (businesses with fewer than 50 employees, less than $3M gross revenue in the last 3 fiscal years, and less than 5,000 records containing private information of NY residents). Stone AI maintains reasonable safeguards appropriate to its size, complexity, and the nature of the data it processes.

## Administrative Safeguards

- **Designated Security Coordinator:** Founder (Derrick Harrington) serves as the designated individual responsible for coordinating the security program
- **Risk Assessment:** Periodic review of internal and external risks to the security of personal information, including AI-specific threat vectors (prompt injection, model extraction, conversation data exposure)
- **Vendor Management:** Third-party service providers (Clerk, Stripe, Vercel, Neon, Cloudflare) are evaluated for adequate security practices and contractual data protection obligations
- **Training:** Security awareness integrated into development and operations workflow
- **Health Data Awareness:** Staff and systems are trained to recognize that users may disclose medical or health information during AI agent conversations, triggering enhanced data protection obligations under the NY SHIELD Act

## Technical Safeguards

- **Encryption at Rest:** AES-256-GCM for sensitive data fields in PostgreSQL
- **Encryption in Transit:** TLS 1.2+ (enforced via Cloudflare SSL Full mode)
- **Authentication:** Clerk-managed authentication with session management
- **API Key Security:** Salted hashing (never stored in plaintext)
- **Access Controls:** Role-based access, admin-only endpoints with authentication gates
- **Rate Limiting:** Per-endpoint rate limiting to prevent brute force and abuse
- **Security Headers:** CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- **Input Validation:** Zod strict schemas on all mutation endpoints; sanitization of user input
- **Audit Logging:** Security event logging for authentication, data access, and administrative actions
- **Monitoring:** System health monitoring, Docker container status checks, service availability monitoring

## AI-Specific Safeguards

- **Prompt Injection Prevention:** User inputs are sanitized before being passed to AI models. System prompts are isolated from user-supplied content. Input length limits and pattern detection are applied to identify and block injection attempts.
- **Conversation Isolation:** Each user's conversation data is scoped to their authenticated session. API endpoints enforce ownership checks (user ID validation) on all conversation read/write operations to prevent IDOR vulnerabilities. No cross-user data leakage is permitted at the application layer.
- **Model Access Controls:** The vLLM inference server is accessible only through the Cloudflare tunnel (`vllm.stone-ai.net`) with authentication. Direct access to vLLM ports (8000/8001) is restricted to the local Palace network. API keys for cloud AI providers (Anthropic) are stored as environment variables, never in source code.
- **System Prompt Protection:** Agent system prompts and personality configurations are treated as proprietary business IP. Agents are instructed not to disclose their system prompts. Responses are monitored for accidental prompt leakage.
- **AI Output Sanitization:** AI-generated responses are validated before delivery to prevent injection of malicious content, unauthorized data disclosure, or harmful outputs.
- **vLLM Server Security:** The local vLLM inference server runs on the Palace (OMEN) with network-level isolation. Cloudflare tunnel provides the only external access point, with Cloudflare WAF rules applied. Server access logs are monitored for unauthorized request patterns.

## Health Data Handling

Users may voluntarily disclose medical or health information during conversations with AI agents (e.g., discussing symptoms with a wellness agent, sharing health concerns). This data is subject to enhanced protections under the NY SHIELD Act's medical data provisions:

- **Recognition:** The system treats all conversation data as potentially containing health information. No separate health data category is maintained — all conversation data receives the highest applicable protection level.
- **Storage:** Health-related conversation data is encrypted at rest (AES-256-GCM) and in transit (TLS 1.2+), consistent with all conversation data.
- **Access:** Health data within conversations is accessible only to the authenticated user who created the conversation. No Stone AI personnel access conversation content except during authorized security investigations.
- **Retention:** Conversation data (including any health information) is deleted within 30 days of account deletion. Users may delete individual conversations at any time.
- **Breach Notification:** If a breach involves medical/health data, notification procedures include specifying the types of health information compromised and offering identity theft prevention services, per the NY SHIELD Act (see breach-response-plan.md, Section 4).
- **Disclaimer:** Stone AI agents do not provide medical advice. Users are informed that AI agents are not healthcare providers and that conversations are not protected by HIPAA (Stone AI is not a covered entity).

## Physical Safeguards

- **Cloud Infrastructure:** Hosted on Vercel (SOC 2 compliant) and Neon (SOC 2 compliant) — physical data center security managed by providers
- **Local Infrastructure:** Palace (OMEN) server secured in founder's premises with physical access controls
- **Data Disposal:** Account deletion triggers permanent data deletion within 30 days. Database backups follow provider retention policies (Neon: point-in-time recovery, configurable retention)

## Incident Response

See: breach-response-plan.md (Version 2.0, updated March 14, 2026 — includes AI-specific breach scenarios, 30-day notification deadline, health data provisions, and insurance requirements)

## Review Schedule

This program is reviewed and updated at minimum annually or whenever material changes occur in data processing practices, infrastructure, or applicable law.

## Contact

Stone AI, 4879 State Hwy 30, #183, Amsterdam, NY 12010
security@stone-ai.net
