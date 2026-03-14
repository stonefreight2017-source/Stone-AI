# Stone AI — Breach Response Plan

**Version:** 2.0
**Last Updated:** March 14, 2026
**Classification:** Internal — Founder Only

## 1. Detection

- Monitor security audit logs for unauthorized access patterns
- Review Cloudflare security events for anomalous traffic
- Monitor Neon database access logs for unusual queries
- Check Clerk authentication logs for bulk credential failures
- Automated alerts via system health monitoring
- Monitor vLLM server logs for unusual request patterns or unauthorized access attempts
- Monitor conversation API endpoints for abnormal access patterns (potential IDOR attempts)

## 2. Assessment (within 24 hours)

- Identify the type of data compromised (account info, conversations, payment refs, health/medical data, etc.)
- Determine the number of affected users
- Identify the attack vector and whether it is ongoing
- Preserve evidence (logs, database snapshots, network captures)
- Engage legal counsel if breach involves >100 users
- Determine whether compromised data includes medical/health information (triggers enhanced NY SHIELD Act obligations — see Section 4)

## 3. Containment

- Revoke compromised API keys and sessions
- Rotate database credentials if applicable
- Block identified attack vectors (IP bans, WAF rules via Cloudflare)
- Disable affected endpoints if necessary
- If AI-specific breach: isolate affected agent(s), disable Cloudflare tunnel to vLLM if tunnel compromise suspected, rotate vLLM API keys
- Document all containment actions with timestamps

## 4. Notification — New York SHIELD Act Compliance

**Individual Notice (required for any breach of NY residents' private information):**
- Notify affected NY residents within 30 days of breach discovery (hard deadline per NY SHIELD Act amendment effective December 21, 2024)
- Methods: email (primary), written notice (secondary), conspicuous website posting (if >500K affected or email/mail cost >$250K)
- Include: description of the incident, types of data affected, contact information, relevant state agency contacts
- If medical/health data is involved: notification must specify the types of health information compromised and include information about identity theft prevention services

**Regulatory Notice (if 500+ NY residents affected):**
- Notify NY Attorney General within 10 business days
- Notify NY Division of State Police within 10 business days
- Notify NY Department of State within 10 business days
- Submission: AG website (https://ag.ny.gov/data-breach-report) + written notice

**If 5,000+ NY residents affected:**
- Additionally notify consumer reporting agencies

## 5. AI-Specific Breach Scenarios

The following scenarios are specific to Stone AI's AI agent platform and require tailored response procedures:

### 5a. Prompt Injection Data Leak
**Scenario:** An attacker crafts prompts designed to extract other users' data from AI agent responses (e.g., manipulating system prompts to reveal conversation history, user details, or training data from other sessions).
**Detection:** Anomalous prompt patterns, unusually long or structured inputs, agent responses containing data from other users' sessions.
**Response:** Immediately disable the affected agent. Audit all conversations from the suspected attack window. Notify affected users whose data may have been exposed. Review and harden prompt injection defenses (input sanitization, system prompt isolation).

### 5b. Model Extraction Attack
**Scenario:** Systematic probing of AI agents to replicate agent behavior, extract system prompts, or reverse-engineer agent capabilities and personality configurations.
**Detection:** High-volume, systematic query patterns from a single user or IP. Queries designed to elicit system prompt disclosure. Unusual API usage patterns.
**Response:** Rate-limit or block the offending user/IP. Audit exposed system prompt content. Assess competitive damage. Rotate or modify affected agent system prompts if significant extraction occurred.

### 5c. Conversation Data Exposure
**Scenario:** IDOR (Insecure Direct Object Reference) or authentication bypass on conversation API endpoints allowing an attacker to access other users' conversation histories.
**Detection:** Access logs showing conversation IDs accessed by non-owner users. Authentication anomalies on `/api/conversations` endpoints.
**Response:** Immediately patch the authorization vulnerability. Audit all conversation access logs to determine scope of exposure. Notify all users whose conversations were accessed. This constitutes a data breach requiring full Section 4 notification procedures.

### 5d. vLLM Server Compromise
**Scenario:** Unauthorized access to the local vLLM inference server via the Cloudflare tunnel (`vllm.stone-ai.net`) or direct network access to the Palace.
**Detection:** Unauthorized requests to vLLM ports (8000/8001). Unusual Cloudflare tunnel activity. Unexpected processes on the Palace server.
**Response:** Immediately disable the Cloudflare tunnel. Shut down vLLM services. Audit server access logs. Check for data exfiltration. Rebuild vLLM environment if compromise is confirmed. Rotate all credentials. Assess whether any user data was processed during the compromise window.

## 6. Data Inventory — Types of Data at Risk

| Data Category | Storage Location | Encryption | Notes |
|---|---|---|---|
| Account info (email, name) | Clerk + Neon DB | TLS in transit | Clerk-managed |
| Conversations & messages | Neon DB | AES-256-GCM at rest, TLS in transit | May contain user-disclosed health/medical data |
| Payment references | Stripe + Neon DB | Stripe PCI DSS | No raw card numbers stored |
| API keys | Neon DB | Salted hash | Never stored plaintext |
| Health/medical data | Neon DB (within conversations) | AES-256-GCM at rest, TLS in transit | Users may share health data with AI agents; triggers NY SHIELD Act medical data provisions |
| Agent system prompts | Neon DB + source code | Application-level access controls | Proprietary business IP |
| vLLM inference data | Palace local (in-memory) | Network-level (Cloudflare tunnel) | Transient — not persisted after inference |

## 7. Insurance Coverage

**Technology Errors & Omissions (Tech E&O) Insurance:** Stone AI should obtain Technology E&O coverage to protect against claims arising from AI service failures, data breaches, incorrect AI outputs, or security incidents. This coverage is critical for an AI SaaS platform and should include:
- Cyber liability / data breach response costs
- Professional liability for AI-generated advice or outputs
- Network security liability
- Media liability (for AI-generated content)

**Status:** Coverage to be obtained prior to production launch. Founder to evaluate policies and bind coverage.

## 8. Remediation

- Root cause analysis within 72 hours
- Patch vulnerability
- Update security measures to prevent recurrence
- Document lessons learned
- Update this plan if gaps are identified
- For AI-specific incidents: update prompt injection defenses, conversation isolation mechanisms, and access controls as needed

## 9. Contact Information

- **Founder:** Derrick Harrington — 3headedm@gmail.com
- **Legal:** legal@stone-ai.net
- **Support (public):** support@stone-ai.net
- **Mailing:** Stone AI, 4879 State Hwy 30, #183, Amsterdam, NY 12010
