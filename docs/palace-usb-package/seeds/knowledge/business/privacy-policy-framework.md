# Privacy Policy Framework for AI SaaS Companies

## Palace Knowledge Seed — Legal & Compliance Series
### Classification: Critical Legal Infrastructure
### Applicable To: Stone AI, Best AI Mobile, Stone AI Tools

---

## 1. Executive Summary

A privacy policy is a legally mandated document that discloses how your company collects, uses, stores, shares, and protects personal data. For AI SaaS companies, the privacy policy carries additional weight because AI systems inherently process large volumes of user data — conversations, behavioral patterns, preferences, and content — creating heightened privacy obligations.

This seed provides a comprehensive, multi-regulation compliant privacy policy framework covering GDPR (European Union), CCPA/CPRA (California), NY SHIELD Act (New York), and emerging state privacy laws. It is specifically designed for the Stone AI ecosystem, accounting for all third-party integrations (Clerk, Stripe, Vercel, Neon, Anthropic, vLLM) and AI-specific data processing activities.

**Why This Matters**: Privacy violations carry severe penalties — GDPR fines up to 4% of global annual revenue or €20 million (whichever is higher), CCPA penalties of $7,500 per intentional violation, plus class action exposure. Beyond penalties, privacy breaches destroy user trust — the single most valuable asset for an AI company asking users to share their thoughts with AI.

---

## 2. Data Collection Inventory

Before drafting any privacy policy, you must conduct a thorough data inventory. This maps every piece of personal data your system touches.

### 2.1 Data Collected Directly from Users

| Data Category | Specific Elements | Collection Point | Legal Basis (GDPR) |
|--------------|-------------------|------------------|-------------------|
| Identity Data | Name, email, username, profile photo | Registration (Clerk) | Contract performance |
| Authentication Data | Password hash, OAuth tokens, MFA settings | Login (Clerk) | Contract performance |
| Payment Data | Card last 4, billing address, transaction history | Checkout (Stripe) | Contract performance |
| Profile Data | Display name, avatar, preferences, tier | Settings page | Contract performance |
| Communication Data | Support tickets, feedback, forum posts | Various | Legitimate interest |
| Bestie Configuration | Personality traits, communication style, language | Bestie setup | Consent |
| AI Conversation Data | Chat messages, agent interactions, prompts | Chat interface | Contract performance |

### 2.2 Data Collected Automatically

| Data Category | Specific Elements | Collection Method | Legal Basis (GDPR) |
|--------------|-------------------|-------------------|-------------------|
| Device Data | Browser type, OS, screen resolution, device ID | HTTP headers, JS | Legitimate interest |
| Usage Data | Pages visited, features used, session duration, clicks | Analytics | Legitimate interest |
| Log Data | IP address, access times, error logs, request data | Server logs | Legitimate interest |
| Cookie Data | Session cookies, preference cookies, analytics cookies | Browser cookies | Consent (non-essential) |
| AI Interaction Metadata | Response times, model used, token counts, feedback | System telemetry | Legitimate interest |
| Location Data | Country, region, timezone (IP-derived, not precise) | IP geolocation | Legitimate interest |

### 2.3 Data Received from Third Parties

| Source | Data Received | Purpose |
|--------|--------------|---------|
| Clerk | Authentication events, session data, OAuth profile | User authentication |
| Stripe | Payment confirmation, subscription status, billing events | Payment processing |
| Vercel | Deployment analytics, performance data | Hosting and CDN |
| Anthropic (Claude) | AI model responses (processed, not stored by Anthropic per API terms) | AI features |
| Social OAuth (Google, GitHub, etc.) | Name, email, profile photo (if user connects) | Social login |

---

## 3. Privacy Policy Template Structure

### 3.1 Opening Statement and Scope

```
PRIVACY POLICY

Last Updated: [Date]
Effective Date: [Date]
Version: [X.X]

[Company Name] ("we," "us," or "our") operates [Stone AI / Best AI / Stone AI Tools]
(the "Service"). This Privacy Policy explains how we collect, use, disclose, and
safeguard your personal information when you use our Service.

This Privacy Policy applies to all users of the Service, regardless of location.
Certain sections provide additional rights for residents of specific jurisdictions,
including the European Economic Area ("EEA"), United Kingdom ("UK"), California,
and other US states with comprehensive privacy laws.

By using the Service, you acknowledge that you have read and understood this Privacy
Policy. If you do not agree with our practices, please do not use the Service.
```

### 3.2 Information We Collect

Organize this section by collection method (directly provided, automatically collected, third-party sources) as detailed in Section 2 above. Use plain language and be exhaustive — omitting a data category creates legal exposure.

**Critical for AI companies**: You must disclose that AI conversations are processed and potentially stored. This is the most sensitive data you handle and the most likely source of user concern.

```
AI INTERACTION DATA:

When you use our AI features, including AI Agents and Bestie, we collect and process:

- The text of your messages and prompts sent to AI systems
- AI-generated responses provided to you
- Metadata about your interactions (timestamps, session identifiers, model used,
  response quality feedback)
- Your Bestie configuration choices (personality traits, communication style,
  preferred language)

This data is processed to:
(a) Provide the AI features you requested
(b) Maintain conversation context and continuity
(c) Improve AI response quality and safety
(d) Detect and prevent misuse of AI features
(e) Comply with applicable law

We implement encryption in transit (TLS 1.2+) and at rest (AES-256-GCM) for
all AI interaction data.
```

### 3.3 How We Use Your Information

Map each use to a legal basis. This is required by GDPR and considered best practice everywhere.

| Purpose | Data Used | Legal Basis (GDPR) | CCPA Business Purpose |
|---------|-----------|-------------------|----------------------|
| Provide the Service | All account data | Contract | Performing services |
| Process payments | Payment data | Contract | Performing services |
| AI feature delivery | Conversation data | Contract | Performing services |
| Safety and moderation | Conversation data, usage data | Legitimate interest | Security |
| Service improvement | Anonymized usage data | Legitimate interest | Internal research |
| AI model improvement | Anonymized, aggregated interaction data | Legitimate interest / Consent | Internal research |
| Customer support | Communication data, account data | Contract | Performing services |
| Security and fraud prevention | Log data, device data, IP | Legitimate interest | Security |
| Legal compliance | Various, as required | Legal obligation | Compliance |
| Marketing (with consent) | Email, name, preferences | Consent | Marketing |

### 3.4 Cookie Policy

The cookie policy can be embedded in the privacy policy or maintained as a separate document. For GDPR compliance, you need a cookie consent banner with granular opt-in/opt-out controls.

#### Cookie Categories

**Strictly Necessary Cookies** (No consent required):
| Cookie | Provider | Purpose | Duration |
|--------|----------|---------|----------|
| __clerk_session | Clerk | Authentication session | Session |
| __stripe_mid | Stripe | Fraud prevention | 1 year |
| csrf_token | Internal | CSRF protection | Session |
| cookie_consent | Internal | Stores consent preferences | 1 year |

**Functional Cookies** (Consent required in EU):
| Cookie | Provider | Purpose | Duration |
|--------|----------|---------|----------|
| theme_preference | Internal | UI theme selection | 1 year |
| language | Internal | Language preference | 1 year |
| sidebar_state | Internal | UI layout preference | 30 days |

**Analytics Cookies** (Consent required):
| Cookie | Provider | Purpose | Duration |
|--------|----------|---------|----------|
| _vercel_analytics | Vercel | Performance analytics | 24 hours |
| [any analytics provider] | [Provider] | Usage analytics | Varies |

**Marketing Cookies** (Consent required):
| Cookie | Provider | Purpose | Duration |
|--------|----------|---------|----------|
| [ad platform cookies if used] | [Provider] | Advertising | Varies |

#### Cookie Consent Implementation

```
COOKIE CONSENT REQUIREMENTS:

1. Display cookie consent banner on first visit
2. Allow granular control (accept all, reject all, customize)
3. Do not set non-essential cookies until consent is given
4. Store consent record with timestamp
5. Allow withdrawal of consent at any time
6. Re-obtain consent every 12 months
7. Do not use cookie walls (no "accept cookies or leave")
```

### 3.5 Data Sharing and Third-Party Disclosure

This section must identify every third party that receives user data. GDPR and CCPA both require this disclosure.

```
WE SHARE YOUR PERSONAL INFORMATION WITH THE FOLLOWING CATEGORIES OF RECIPIENTS:

SERVICE PROVIDERS (Data Processors under GDPR):

1. CLERK (Authentication)
   - Data shared: Email, name, authentication events, IP address
   - Purpose: User authentication and session management
   - Location: United States
   - DPA: In place
   - Privacy Policy: https://clerk.com/privacy

2. STRIPE (Payment Processing)
   - Data shared: Payment card details, billing address, email, transaction data
   - Purpose: Payment processing and subscription management
   - Location: United States (with global infrastructure)
   - PCI DSS: Level 1 certified
   - DPA: In place
   - Privacy Policy: https://stripe.com/privacy

3. VERCEL (Hosting and Deployment)
   - Data shared: Access logs, IP addresses, request data
   - Purpose: Application hosting, CDN, serverless functions
   - Location: Global edge network
   - DPA: In place
   - Privacy Policy: https://vercel.com/legal/privacy-policy

4. NEON (Database)
   - Data shared: All stored user data (encrypted at rest)
   - Purpose: Database hosting and management
   - Location: United States (AWS infrastructure)
   - DPA: In place
   - Privacy Policy: https://neon.tech/privacy

5. ANTHROPIC (AI Model Provider)
   - Data shared: Conversation text (for processing only)
   - Purpose: AI response generation
   - Data retention: Per Anthropic API terms — not used for training
   - Location: United States
   - DPA: In place
   - Privacy Policy: https://anthropic.com/privacy

6. CLOUDFLARE (DNS and Security)
   - Data shared: DNS queries, IP addresses
   - Purpose: DNS resolution, DDoS protection, SSL
   - Location: Global edge network
   - DPA: In place
   - Privacy Policy: https://cloudflare.com/privacypolicy

WE DO NOT:
- Sell your personal information (as defined under CCPA/CPRA)
- Share your personal information for cross-context behavioral advertising
- Disclose your AI conversation content to other users
- Provide data to data brokers
- Use your data for purposes unrelated to the Service without your consent
```

### 3.6 Data Retention Schedule

GDPR requires data minimization and storage limitation. Define specific retention periods for each data category.

| Data Category | Retention Period | Justification | Deletion Method |
|--------------|-----------------|---------------|-----------------|
| Account data | Duration of account + 30 days | Contract performance | Automated deletion |
| Payment records | 7 years after transaction | Tax/legal requirements | Automated archival + deletion |
| AI conversations | 90 days (active), then anonymized | Service improvement | Automated anonymization |
| Bestie configuration | Duration of account | Feature functionality | Account deletion cascade |
| Server logs | 90 days | Security and debugging | Automated rotation |
| Analytics data | 26 months (anonymized) | Service improvement | Automated aggregation |
| Support tickets | 3 years after resolution | Legal protection | Manual review + deletion |
| Cookie consent records | 3 years | Compliance evidence | Automated deletion |
| Marketing consent | Duration of consent + 3 years | Compliance evidence | Automated deletion |
| Backup data | 30 days rolling | Disaster recovery | Automated rotation |

```
DATA RETENTION:

We retain your personal information only for as long as necessary to fulfill the
purposes for which it was collected, comply with legal obligations, resolve disputes,
and enforce our agreements.

When personal data is no longer needed, we securely delete or anonymize it. Anonymized
data (which cannot be used to identify you) may be retained indefinitely for research
and statistical purposes.

You may request deletion of your data at any time (see "Your Rights" below). Certain
data may be retained after deletion requests to comply with legal obligations or
protect our legitimate interests.
```

### 3.7 International Data Transfers

If you have users outside the US (you will), you need to address cross-border data transfers — especially for EU/UK users whose data is subject to GDPR.

```
INTERNATIONAL DATA TRANSFERS:

Our Service is primarily operated from the United States. If you access the Service
from outside the United States, your personal data will be transferred to, stored,
and processed in the United States and other countries where our service providers
operate.

FOR EEA/UK USERS: We rely on the following transfer mechanisms to ensure adequate
protection for your personal data:

(a) Standard Contractual Clauses (SCCs) approved by the European Commission
(b) Data Privacy Framework certification of our service providers (where applicable)
(c) Your explicit consent for the transfer (where applicable)

We ensure that any third party processing personal data on our behalf provides
adequate safeguards as required by applicable data protection law.
```

### 3.8 Data Security Measures

```
DATA SECURITY:

We implement appropriate technical and organizational measures to protect your
personal data, including:

TECHNICAL MEASURES:
- Encryption in transit (TLS 1.2+) for all data communications
- Encryption at rest (AES-256-GCM) for sensitive data including AI conversations
- Secure authentication via Clerk with support for multi-factor authentication
- Content Security Policy (CSP) headers to prevent XSS attacks
- Rate limiting to prevent abuse and brute-force attacks
- Regular security assessments and vulnerability scanning
- Database-level access controls and encryption
- Automated backup with encrypted storage

ORGANIZATIONAL MEASURES:
- Access to personal data limited to authorized personnel on a need-to-know basis
- Security awareness requirements for all team members
- Incident response procedures (see data-breach-response-plan.md)
- Regular review of data processing activities
- Vendor security assessments before engaging new processors

No method of transmission over the Internet or electronic storage is 100% secure.
While we strive to protect your personal data, we cannot guarantee absolute security.
```

---

## 4. User Rights by Jurisdiction

### 4.1 GDPR Rights (EEA/UK Users)

```
IF YOU ARE IN THE EEA OR UK, YOU HAVE THE FOLLOWING RIGHTS:

1. RIGHT OF ACCESS (Art. 15): Request a copy of the personal data we hold about you.

2. RIGHT TO RECTIFICATION (Art. 16): Request correction of inaccurate or incomplete
   personal data.

3. RIGHT TO ERASURE (Art. 17): Request deletion of your personal data ("right to be
   forgotten"), subject to legal exceptions.

4. RIGHT TO RESTRICT PROCESSING (Art. 18): Request that we limit how we use your
   data in certain circumstances.

5. RIGHT TO DATA PORTABILITY (Art. 20): Receive your personal data in a structured,
   commonly used, machine-readable format and transmit it to another controller.

6. RIGHT TO OBJECT (Art. 21): Object to processing based on legitimate interests,
   including profiling. Object to processing for direct marketing at any time.

7. RIGHT NOT TO BE SUBJECT TO AUTOMATED DECISION-MAKING (Art. 22): Not be subject
   to decisions based solely on automated processing that produce legal or similarly
   significant effects.

8. RIGHT TO WITHDRAW CONSENT (Art. 7): Withdraw consent at any time, without
   affecting the lawfulness of processing before withdrawal.

9. RIGHT TO LODGE A COMPLAINT: File a complaint with your local data protection
   authority (supervisory authority).

To exercise these rights, contact us at [privacy email]. We will respond within
30 days (extendable by 60 days for complex requests). We may verify your identity
before processing your request. These rights are provided free of charge, except
for manifestly unfounded or excessive requests.
```

### 4.2 CCPA/CPRA Rights (California Residents)

```
IF YOU ARE A CALIFORNIA RESIDENT, YOU HAVE THE FOLLOWING RIGHTS UNDER THE
CALIFORNIA CONSUMER PRIVACY ACT (CCPA) AS AMENDED BY THE CALIFORNIA PRIVACY
RIGHTS ACT (CPRA):

1. RIGHT TO KNOW: Request disclosure of the categories and specific pieces of
   personal information we have collected about you, the sources of collection,
   our purposes for collecting, and the third parties with whom we share it.

2. RIGHT TO DELETE: Request deletion of your personal information, subject to
   certain exceptions.

3. RIGHT TO CORRECT: Request correction of inaccurate personal information.

4. RIGHT TO OPT-OUT OF SALE/SHARING: We do not sell your personal information or
   share it for cross-context behavioral advertising. If this changes, we will
   provide a "Do Not Sell or Share My Personal Information" link.

5. RIGHT TO LIMIT USE OF SENSITIVE PERSONAL INFORMATION: Request that we limit
   our use of sensitive personal information to what is necessary to provide
   the Service.

6. RIGHT TO NON-DISCRIMINATION: We will not discriminate against you for
   exercising your privacy rights.

CATEGORIES OF PERSONAL INFORMATION COLLECTED (per CCPA categories):
- Identifiers (name, email, IP address)
- Commercial information (subscription history, transaction data)
- Internet activity (browsing history, interaction with the Service)
- Geolocation data (approximate, IP-derived)
- Inferences drawn from the above (AI interaction patterns, preferences)
- Sensitive personal information: Account login credentials (processed by Clerk)

To exercise your rights: Email [privacy email] or use our privacy request form
at [URL]. We will verify your identity and respond within 45 days (extendable
by 45 days with notice).

You may designate an authorized agent to submit requests on your behalf with
written authorization.
```

### 4.3 New York Residents

```
IF YOU ARE A NEW YORK RESIDENT:

While New York does not currently have a comprehensive consumer privacy law
equivalent to CCPA, we comply with:

- NY SHIELD Act: We implement reasonable safeguards for your private information
  and will notify you in the event of a data breach as required by law.
- NY General Business Law § 899-aa: We will provide breach notification within
  the timeframes required by law.

As state privacy laws continue to evolve, we will update this section to reflect
any new requirements.
```

### 4.4 Other US State Privacy Laws

```
ADDITIONAL US STATE RIGHTS:

Residents of the following states may have additional privacy rights under their
respective state laws:

- Colorado (CPA): Right to access, correct, delete, data portability, opt-out
- Connecticut (CTDPA): Right to access, correct, delete, data portability, opt-out
- Virginia (VCDPA): Right to access, correct, delete, data portability, opt-out
- Utah (UCPA): Right to access, delete, data portability, opt-out
- Texas (TDPSA): Right to access, correct, delete, data portability, opt-out
- Oregon (OCPA): Right to access, correct, delete, data portability, opt-out
- Montana (MCDPA): Right to access, correct, delete, data portability, opt-out

To exercise rights under any state law, contact us at [privacy email]. We will
process your request in accordance with applicable law.
```

---

## 5. Children's Privacy

```
CHILDREN'S PRIVACY:

The Service is not directed to children under 13 years of age. We do not knowingly
collect personal information from children under 13. If you are a parent or guardian
and believe we have collected personal information from your child under 13, please
contact us at [privacy email] and we will delete such information promptly.

Users between 13 and 18 may use the Service with parental consent and supervision.
We encourage parents to monitor their children's online activities and help enforce
this Privacy Policy.

In compliance with the Children's Online Privacy Protection Act (COPPA), we:
- Do not knowingly collect data from children under 13
- Will delete any data identified as belonging to a child under 13
- Do not condition participation on unnecessary data collection from minors
```

---

## 6. AI-Specific Privacy Disclosures

### 6.1 AI Data Processing Transparency

```
HOW WE USE AI AND YOUR DATA:

TRANSPARENCY ABOUT AI PROCESSING:

1. WHAT AI PROCESSES: When you use AI features, your message text is sent to AI
   models (both locally hosted and cloud-based) for processing. The AI model
   generates a response based on your input and its training.

2. WHAT AI DOES NOT PROCESS: Your payment information, authentication credentials,
   and personally identifiable information are not sent to AI models as part of
   conversation processing.

3. AI MODEL PROVIDERS: We use:
   - Self-hosted models (vLLM + Qwen) for standard AI features
   - Anthropic Claude for advanced AI features (Smart tier)
   - These providers process your conversation text to generate responses

4. AI TRAINING: We do not use your individual conversations to train AI models
   that serve other users without your explicit consent. We may use anonymized,
   aggregated interaction patterns to improve service quality.

5. CONVERSATION STORAGE: AI conversations are stored in encrypted form in our
   database. You can view and delete your conversation history through your
   account settings.

6. AI SAFETY MONITORING: Conversations may be automatically flagged by safety
   systems for review if they contain content that violates our Acceptable Use
   Policy. This is automated processing for safety purposes.
```

### 6.2 Automated Profiling Disclosure

```
AUTOMATED PROFILING:

We use automated systems to:

1. RECOMMENDATION: Suggest relevant AI agents based on your query context and
   usage patterns. This does not produce legal effects and you can use any
   available agent regardless of recommendations.

2. CONTENT MODERATION: Automatically screen content for safety violations. Flagged
   content may be reviewed by safety systems or, in serious cases, by authorized
   personnel.

3. FRAUD DETECTION: Analyze usage patterns to detect and prevent fraudulent activity,
   abuse, and terms violations.

4. FEATURE PERSONALIZATION: Customize your experience based on your subscription
   tier, preferences, and usage patterns.

None of these automated processes make decisions that produce legal effects or
similarly significant effects on you. If you believe an automated process has
adversely affected you, contact us at [privacy email].
```

---

## 7. Data Subject Access Request (DSAR) Processing

### 7.1 DSAR Workflow

```
Step 1: Request Received (Day 0)
  → Log request with timestamp
  → Send acknowledgment to requester
  → Assign to privacy team

Step 2: Identity Verification (Days 1-3)
  → Verify requester's identity (email match, account verification)
  → If authorized agent: verify written authorization
  → If verification fails: request additional proof

Step 3: Scope Determination (Days 3-5)
  → Identify which rights are being exercised
  → Determine applicable jurisdiction and law
  → Assess any exemptions or limitations

Step 4: Data Collection (Days 5-15)
  → Query all systems for requester's data
  → Compile data from: Database, Clerk, Stripe, logs, backups
  → Format data in machine-readable format (JSON/CSV)

Step 5: Review and Response (Days 15-25)
  → Review collected data for third-party information to redact
  → Prepare response package
  → Legal review for complex requests

Step 6: Delivery (Before Day 30/45)
  → Deliver response via secure method
  → Log completion
  → Update records of processing
```

### 7.2 DSAR Response Templates

**Acknowledgment Template**:
```
Subject: Privacy Request Received — Reference [REF-XXXX]

Dear [Name],

We have received your privacy request submitted on [date]. Your reference number
is [REF-XXXX].

We will process your request in accordance with applicable data protection law
and respond within:
- 30 days (GDPR)
- 45 days (CCPA/CPRA)

If we need additional time or information, we will contact you.

For questions about your request, contact [privacy email] with your reference number.
```

**Data Export Template (JSON structure)**:
```json
{
  "data_export": {
    "generated_date": "YYYY-MM-DD",
    "reference": "REF-XXXX",
    "identity": {
      "name": "...",
      "email": "...",
      "account_created": "...",
      "subscription_tier": "..."
    },
    "profile_data": { ... },
    "conversation_history": [ ... ],
    "payment_history": [ ... ],
    "login_history": [ ... ],
    "consent_records": [ ... ],
    "data_sharing_log": [ ... ]
  }
}
```

---

## 8. Privacy by Design Implementation

### 8.1 Technical Privacy Controls

| Control | Implementation | Status |
|---------|---------------|--------|
| Data minimization | Only collect data necessary for each feature | Required |
| Purpose limitation | Technical enforcement of data use boundaries | Required |
| Storage limitation | Automated retention enforcement and deletion | Required |
| Encryption at rest | AES-256-GCM for all PII | Implemented |
| Encryption in transit | TLS 1.2+ for all connections | Implemented |
| Access controls | Role-based access, principle of least privilege | Required |
| Audit logging | Log all access to personal data | Required |
| Data pseudonymization | Hash identifiers where possible | Recommended |
| Automated deletion | Cron jobs to enforce retention schedules | Required |
| Consent management | Granular consent tracking system | Required |

### 8.2 Privacy Impact Assessment (PIA) Triggers

Conduct a PIA before:
- Adding new AI features that process personal data
- Integrating new third-party services
- Changing data retention periods
- Processing new categories of personal data
- Deploying AI models trained on user data
- Expanding to new jurisdictions
- Implementing new profiling or automated decision-making

---

## 9. Compliance Monitoring

### 9.1 Quarterly Privacy Review Checklist

- [ ] Review all third-party DPAs are current
- [ ] Verify data retention schedules are being enforced
- [ ] Audit access logs for unauthorized data access
- [ ] Review and update data inventory
- [ ] Check cookie consent implementation is functioning
- [ ] Verify DSAR response times are within legal limits
- [ ] Review any data breaches or near-misses
- [ ] Update privacy policy for any changes to data practices
- [ ] Review AI model provider terms for privacy changes
- [ ] Test data export and deletion functionality

### 9.2 Annual Privacy Audit

- Full data mapping exercise
- Third-party vendor privacy assessment
- Penetration testing of data access controls
- Employee/contractor privacy training
- Privacy policy legal review
- DSAR process effectiveness review
- Cookie consent audit
- International transfer mechanism review

---

## 10. Product-Specific Privacy Considerations

### 10.1 Stone AI
- Bestie feature stores personality configuration — must be deletable
- Agent conversations may contain sensitive user information
- Forum posts are semi-public — clarify in policy
- Emotes and social features track interaction patterns

### 10.2 Best AI Mobile
- Mobile device identifiers (IDFA/GAID) collection
- Push notification token storage
- App analytics (crash reports, usage data)
- Camera/microphone permissions (if applicable)
- Location data (if applicable)
- App store privacy nutrition labels required

### 10.3 Stone AI Tools
- API key management and storage
- Developer usage analytics
- Integration data flows through tools
- B2B data processing (additional DPA requirements)
- API call logging and retention

---

## 11. Vendor Privacy Management

### 11.1 DPA Requirements

Every vendor that processes personal data on your behalf requires a Data Processing Agreement (DPA). Key DPA elements:

1. Subject matter and duration of processing
2. Nature and purpose of processing
3. Types of personal data processed
4. Categories of data subjects
5. Obligations and rights of the controller
6. Processor's security obligations
7. Sub-processor management
8. Data breach notification obligations
9. Audit rights
10. Data return or deletion upon termination

### 11.2 Current Vendor DPA Status

| Vendor | Role | DPA Status | Review Date |
|--------|------|-----------|-------------|
| Clerk | Processor | Required | Quarterly |
| Stripe | Processor | Required | Quarterly |
| Vercel | Processor | Required | Quarterly |
| Neon | Processor | Required | Quarterly |
| Anthropic | Processor | Required | Quarterly |
| Cloudflare | Processor | Required | Quarterly |

---

## 12. Privacy Policy Update Protocol

### 12.1 When to Update

- New data collection practices
- New third-party integrations
- New AI features or models
- Regulatory changes
- Business model changes
- New jurisdictions served
- Merger or acquisition
- Data breach lessons learned

### 12.2 Update Notification Requirements

| Change Type | GDPR Requirement | CCPA Requirement | Best Practice |
|------------|-----------------|-----------------|--------------|
| Material change | Notify before processing | Update at collection | Email + in-app notice, 30 days |
| Minor change | Update policy | Update policy | In-app notice, 7 days |
| New third party | Update policy + DPA | Update policy | Email notice, 14 days |
| New data category | Notify + possible new consent | Update policy | Email + consent refresh |

---

*This seed is a framework and educational resource. It does not constitute legal advice. All privacy policies should be reviewed and approved by a licensed attorney and, where applicable, a qualified data protection officer before publication.*
