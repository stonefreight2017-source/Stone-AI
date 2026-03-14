# GDPR Compliance Playbook for AI SaaS

## Palace Knowledge Seed — Legal & Compliance Series
### Classification: Critical Regulatory Compliance
### Applicable To: Stone AI, Best AI Mobile, Stone AI Tools

---

## 1. Executive Summary

The General Data Protection Regulation (GDPR) is the world's most comprehensive data protection law, governing how organizations collect, process, store, and transfer personal data of individuals in the European Economic Area (EEA) and United Kingdom (UK). It applies to Stone AI regardless of where the company is based — if any EU/UK resident uses the service, GDPR applies.

This playbook provides a complete implementation guide: consent management, data subject access request (DSAR) handling, Data Processing Agreement (DPA) templates, international data transfer mechanisms, breach notification procedures, and Record of Processing Activities (ROPA). It is designed as an operational manual, not theoretical overview.

**Key Obligations Summary**:
- Lawful basis for every data processing activity
- Transparency about all data processing
- Data minimization and purpose limitation
- Data subject rights fulfillment within 30 days
- 72-hour breach notification to authorities
- Data Protection Impact Assessments for high-risk processing
- Records of Processing Activities
- Data Processing Agreements with all processors

---

## 2. GDPR Applicability Analysis

### 2.1 Territorial Scope (Article 3)

GDPR applies to Stone AI under **Article 3(2)**: The regulation applies to processing of personal data of data subjects who are in the EU by a controller or processor not established in the EU, where the processing activities relate to offering goods or services to data subjects in the EU.

**Why Stone AI is subject to GDPR**:
- The service is accessible from the EU
- There is no geo-blocking preventing EU access
- The service offers features (AI agents, Bestie) to anyone who registers
- Payment processing accepts EU payment methods
- The website is available in English (widely spoken in EU)

### 2.2 Key Roles

| Role | Entity | Explanation |
|------|--------|------------|
| Controller | Stone AI (your company) | Determines purposes and means of processing |
| Processor | Clerk | Processes auth data on your behalf |
| Processor | Stripe | Processes payment data on your behalf |
| Processor | Vercel | Processes hosting/request data on your behalf |
| Processor | Neon | Processes database storage on your behalf |
| Processor | Anthropic | Processes AI conversation data on your behalf |
| Sub-processor | AWS (via Neon) | Infrastructure under Neon's control |
| Sub-processor | Various (via Clerk, Stripe) | Sub-processors of your processors |
| Data Subject | Any EU/UK user | Individuals whose data you process |

### 2.3 Representative Requirement (Article 27)

Since Stone AI is not established in the EU but processes EU personal data, you must designate a representative in the EU. This can be:
- A company or individual in any EU member state
- Third-party EU representative services (cost: $1,000-5,000/year)
- The representative must be named in your privacy policy

---

## 3. Lawful Basis for Processing

### 3.1 Legal Bases (Article 6)

GDPR requires a lawful basis for every processing activity. The six bases are:

1. **Consent** (Art. 6(1)(a)): Freely given, specific, informed, unambiguous
2. **Contract** (Art. 6(1)(b)): Necessary to perform a contract with the data subject
3. **Legal obligation** (Art. 6(1)(c)): Necessary to comply with a legal obligation
4. **Vital interests** (Art. 6(1)(d)): Necessary to protect someone's life
5. **Public interest** (Art. 6(1)(e)): Necessary for public interest tasks
6. **Legitimate interests** (Art. 6(1)(f)): Necessary for legitimate interests, balanced against data subject rights

### 3.2 Stone AI Processing Activities and Legal Bases

| Processing Activity | Data Involved | Legal Basis | Justification |
|--------------------|---------------|-------------|---------------|
| Account creation | Name, email, password | Contract | Necessary to provide the service |
| Authentication | Login credentials, session tokens | Contract | Necessary to secure account access |
| AI conversation processing | Message text, AI responses | Contract | Core service functionality |
| Payment processing | Card details, billing address | Contract | Necessary for paid subscriptions |
| Bestie personalization | Personality config, preferences | Consent | User opts in to personalization |
| Usage analytics | Page views, feature usage | Legitimate interest | Service improvement, balanced against privacy |
| Security monitoring | IP, device info, access patterns | Legitimate interest | Fraud prevention and security |
| Error logging | Technical error data with user context | Legitimate interest | Service reliability |
| AI model improvement | Anonymized interaction data | Legitimate interest / Consent | Quality improvement (opt-out available) |
| Marketing emails | Email address, name | Consent | Explicit opt-in required |
| Cookie tracking (non-essential) | Browser data, usage patterns | Consent | Cookie consent required |
| Forum posts | Post content, username | Contract | User-initiated public sharing |
| Support tickets | Communication content | Contract | Service delivery |
| Legal compliance | Various, as required | Legal obligation | Tax, financial reporting, court orders |

### 3.3 Legitimate Interest Assessment (LIA)

For every processing activity based on legitimate interest, you must conduct and document an LIA:

```
LEGITIMATE INTEREST ASSESSMENT TEMPLATE:

Processing Activity: [Name]
Date of Assessment: [Date]
Assessor: [Name/Role]

STEP 1: PURPOSE TEST
- What is the legitimate interest? [Describe]
- Is the interest real and not speculative? [Yes/No + explanation]
- Is the interest lawful? [Yes/No]

STEP 2: NECESSITY TEST
- Is the processing necessary for the purpose? [Yes/No + explanation]
- Is there a less intrusive way to achieve the same purpose? [Yes/No + alternatives considered]
- Is the processing proportionate? [Yes/No + explanation]

STEP 3: BALANCING TEST
- What is the impact on individuals?
  - Nature of data: [Sensitive? Special category?]
  - Volume of data: [Minimal? Extensive?]
  - Expectations: [Would individuals expect this processing?]
  - Relationship: [Is there a direct relationship?]
  - Vulnerability: [Are data subjects children or otherwise vulnerable?]
- Does the individual's interest override the legitimate interest?
  - [Analysis and conclusion]

STEP 4: SAFEGUARDS
- What safeguards will be implemented?
  - [ ] Data minimization
  - [ ] Anonymization/pseudonymization
  - [ ] Access controls
  - [ ] Retention limits
  - [ ] Opt-out mechanism
  - [ ] Transparency (privacy policy disclosure)

CONCLUSION: [Processing is / is not justified under legitimate interest]
```

---

## 4. Consent Management

### 4.1 GDPR Consent Requirements (Article 7)

Valid GDPR consent must be:
- **Freely given**: No coercion, bundling, or imbalance of power
- **Specific**: Separate consent for separate purposes
- **Informed**: Clear explanation of what's being consented to
- **Unambiguous**: Clear affirmative action (no pre-ticked boxes)
- **Withdrawable**: Easy to withdraw as it was to give
- **Documented**: Record of when, how, and what was consented to

### 4.2 Consent Architecture

```
CONSENT MANAGEMENT SYSTEM REQUIREMENTS:

1. CONSENT COLLECTION:
   - Cookie consent banner with granular options
   - Marketing communication opt-in (separate from ToS acceptance)
   - AI data use consent (for optional processing like model improvement)
   - Bestie feature consent (personality data processing)

2. CONSENT STORAGE:
   Database schema for consent records:

   ConsentRecord {
     id          String   @id @default(cuid())
     userId      String
     consentType String   // "cookies_analytics", "cookies_marketing",
                          // "ai_training", "marketing_emails", "bestie_data"
     granted     Boolean
     timestamp   DateTime
     version     String   // Privacy policy version at time of consent
     method      String   // "banner_click", "settings_toggle", "registration"
     ipAddress   String?  // For evidence purposes
     userAgent   String?
     withdrawnAt DateTime?
   }

3. CONSENT WITHDRAWAL:
   - Settings page with toggle for each consent type
   - Withdrawal takes effect immediately
   - Record withdrawal timestamp
   - Cease processing within 24 hours of withdrawal

4. CONSENT REFRESH:
   - Re-obtain consent when privacy policy materially changes
   - Re-obtain consent annually for marketing
   - Re-obtain consent if processing purposes change
```

### 4.3 Consent Granularity Matrix

| Consent Purpose | Collection Point | Default State | Bundled? |
|----------------|-----------------|---------------|----------|
| Essential cookies | Cookie banner | On (no consent needed) | N/A |
| Analytics cookies | Cookie banner | Off | No — separate toggle |
| Marketing cookies | Cookie banner | Off | No — separate toggle |
| Marketing emails | Registration + settings | Off | No — separate checkbox |
| AI training data use | Settings page | Off | No — separate toggle |
| Bestie personality data | Bestie setup | Presented at setup | No — specific consent |
| Third-party data sharing | Registration | Off | No — separate consent |

---

## 5. Data Subject Access Request (DSAR) Handling

### 5.1 DSAR Rights Overview

| Right | Article | Response Time | Can Charge Fee? |
|-------|---------|---------------|-----------------|
| Access | Art. 15 | 30 days | Free (excessive: reasonable fee) |
| Rectification | Art. 16 | 30 days | Free |
| Erasure | Art. 17 | 30 days | Free |
| Restrict processing | Art. 18 | 30 days | Free |
| Data portability | Art. 20 | 30 days | Free |
| Object to processing | Art. 21 | 30 days | Free |
| Automated decisions | Art. 22 | 30 days | Free |

**Extension**: Can extend by 60 additional days for complex requests, but must notify data subject within initial 30 days.

### 5.2 DSAR Processing Workflow

```
DAY 0: REQUEST RECEIVED
├── Log in DSAR tracking system
├── Assign reference number (DSAR-YYYY-NNNN)
├── Send acknowledgment email within 24 hours
├── Assign to privacy team member
└── Start 30-day clock

DAYS 1-3: VERIFICATION
├── Verify identity of requester
│   ├── Match email to account
│   ├── Request additional verification if needed (government ID, account details)
│   └── If unable to verify: request more info (clock pauses per Art. 12(6))
├── Verify authority (if acting on behalf of another)
│   └── Require written authorization + identity verification of both parties
└── Document verification steps taken

DAYS 3-5: SCOPE ASSESSMENT
├── Identify which rights are being exercised
├── Determine applicable exemptions
│   ├── Legal privilege
│   ├── Third-party data protection
│   ├── Disproportionate effort (inform data subject)
│   └── Manifestly unfounded or excessive
├── If extending timeline: notify data subject with reasons
└── Document scope assessment

DAYS 5-20: DATA COMPILATION
├── ACCESS REQUEST:
│   ├── Query main database (Neon/Prisma)
│   ├── Query Clerk for auth data
│   ├── Query Stripe for payment data (summary only — Stripe is controller for card data)
│   ├── Query server logs
│   ├── Query AI conversation history
│   ├── Query consent records
│   ├── Compile into structured format (JSON + human-readable)
│   └── Redact third-party personal data
│
├── ERASURE REQUEST:
│   ├── Determine which data can be deleted
│   ├── Identify legal retention requirements (tax: 7 years, legal: varies)
│   ├── Delete from main database
│   ├── Request deletion from processors (Clerk, relevant logs)
│   ├── Delete from backups within backup rotation period
│   ├── Anonymize any data that must be retained
│   └── Document what was deleted and what was retained (with justification)
│
├── RECTIFICATION REQUEST:
│   ├── Verify the correction requested
│   ├── Update data in main database
│   ├── Notify processors of correction
│   └── Confirm correction to data subject
│
├── PORTABILITY REQUEST:
│   ├── Export data in machine-readable format (JSON, CSV)
│   ├── Include only data provided by the data subject
│   ├── Include data processed by automated means
│   └── Prepare secure transfer method
│
└── OBJECTION:
    ├── Assess whether compelling legitimate grounds override
    ├── If no override: cease processing
    ├── If direct marketing: cease immediately (no override possible)
    └── Document assessment and outcome

DAYS 20-28: REVIEW AND DELIVERY
├── Review compiled data/actions for completeness
├── Legal review for complex requests
├── Prepare response letter
├── Deliver via secure method (encrypted email, secure portal)
└── Document delivery

DAY 30: DEADLINE
├── If not yet completed: ensure extension notice was sent
├── If completed: close request
└── Archive DSAR file for compliance records (retain 3 years)
```

### 5.3 DSAR Response Letter Template

```
Subject: Response to Your Data Protection Request — Ref: DSAR-[XXXX]

Dear [Name],

Thank you for your request received on [date] regarding your personal data held
by [Company Name]. Your reference number is DSAR-[XXXX].

We have processed your request in accordance with the General Data Protection
Regulation (GDPR). Below is our response:

[FOR ACCESS REQUESTS:]
Attached you will find a complete copy of the personal data we hold about you,
organized by category. This includes:
- Account information
- AI interaction history
- Payment transaction summaries
- Usage data
- Consent records

The data is provided in [JSON/CSV] format. A human-readable summary is also
included.

[FOR ERASURE REQUESTS:]
We have deleted the following personal data:
- [List categories deleted]

The following data has been retained as required by law:
- [List categories retained with legal basis]
  - Tax records: Retained for 7 years per [applicable law]
  - [Other retained data with justification]

Data deleted from our live systems will be purged from backups within our
[30-day] backup rotation cycle.

[FOR ANY REQUEST:]
If you have questions about this response or wish to exercise additional rights,
please contact us at [privacy email].

If you are unsatisfied with our response, you have the right to lodge a complaint
with your local data protection supervisory authority.

Sincerely,
[Name/Title]
[Company Name]
[privacy email]
```

---

## 6. Data Processing Agreements (DPA)

### 6.1 DPA Requirements (Article 28)

Every processor relationship requires a DPA. The DPA must include:

1. Subject matter and duration of processing
2. Nature and purpose of processing
3. Type of personal data processed
4. Categories of data subjects
5. Controller's obligations and rights
6. Processor obligations (detailed below)

### 6.2 Processor Obligations (Must Be in DPA)

```
REQUIRED DPA CLAUSES:

1. Process data only on documented instructions from controller
2. Ensure persons processing data are bound by confidentiality
3. Implement appropriate security measures (Art. 32)
4. Engage sub-processors only with controller's authorization
5. Assist controller with DSAR fulfillment
6. Assist controller with security, breach notification, DPIAs
7. Delete or return all personal data after service ends
8. Make available all information necessary for compliance audits
9. Inform controller if an instruction infringes GDPR
```

### 6.3 DPA Template

```
DATA PROCESSING AGREEMENT

Between:
Controller: [Your Company Name], [Address]
Processor: [Vendor Name], [Address]

Effective Date: [Date]

1. DEFINITIONS
   "Personal Data," "Processing," "Controller," "Processor," "Data Subject,"
   and "Supervisory Authority" have the meanings given in the GDPR.

2. SCOPE OF PROCESSING
   2.1 Subject Matter: [Description of service provided]
   2.2 Duration: For the term of the underlying service agreement
   2.3 Nature: [Automated/manual processing for service delivery]
   2.4 Purpose: [Specific purpose — authentication/payments/hosting/etc.]
   2.5 Types of Personal Data: [List specific data types]
   2.6 Categories of Data Subjects: [Users/customers/employees]

3. PROCESSOR OBLIGATIONS
   3.1 Process Personal Data only on documented instructions from Controller,
       including transfers to third countries, unless required by law.
   3.2 Ensure all persons authorized to process Personal Data are bound by
       confidentiality obligations.
   3.3 Implement and maintain appropriate technical and organizational security
       measures pursuant to Article 32 of the GDPR, including:
       (a) Encryption of Personal Data in transit and at rest
       (b) Measures to ensure ongoing confidentiality, integrity, availability
       (c) Regular testing and evaluation of security measures
   3.4 Not engage another processor (sub-processor) without prior written
       authorization of the Controller. Where authorized, impose equivalent
       obligations on the sub-processor.
   3.5 Assist the Controller in fulfilling its obligations to respond to Data
       Subject requests under Articles 15-22 of the GDPR.
   3.6 Assist the Controller in ensuring compliance with Articles 32-36 of the
       GDPR (security, breach notification, DPIA, prior consultation).
   3.7 At the Controller's choice, delete or return all Personal Data after the
       end of the provision of services, and delete existing copies unless
       retention is required by law.
   3.8 Make available to the Controller all information necessary to demonstrate
       compliance with this Agreement and the GDPR, and allow for and contribute
       to audits.
   3.9 Immediately inform the Controller if an instruction infringes the GDPR
       or other applicable data protection provisions.

4. SUB-PROCESSORS
   4.1 Processor shall maintain an up-to-date list of sub-processors.
   4.2 Processor shall notify Controller of any intended changes to sub-processors
       at least [30 days] in advance.
   4.3 Controller may object to a new sub-processor within [15 days] of notification.
   4.4 Processor remains fully liable for sub-processor compliance.

5. DATA BREACH NOTIFICATION
   5.1 Processor shall notify Controller without undue delay, and in any event
       within [24/48 hours], upon becoming aware of a Personal Data breach.
   5.2 Notification shall include:
       (a) Nature of the breach, categories and number of data subjects affected
       (b) Name and contact of Processor's data protection contact
       (c) Likely consequences of the breach
       (d) Measures taken or proposed to address the breach

6. INTERNATIONAL TRANSFERS
   6.1 Processor shall not transfer Personal Data outside the EEA unless:
       (a) Transfer is to a country with an adequacy decision
       (b) Standard Contractual Clauses are in place
       (c) Other valid transfer mechanism under Chapter V of the GDPR
   6.2 [Attach Standard Contractual Clauses if applicable]

7. AUDIT RIGHTS
   7.1 Controller may audit Processor's compliance with this Agreement upon
       [30 days'] written notice, no more than [once per year].
   7.2 Processor shall cooperate with audits and provide reasonable access.

8. LIABILITY AND INDEMNIFICATION
   8.1 Each party shall be liable for damages caused by processing in violation
       of the GDPR, in accordance with Article 82 of the GDPR.
   8.2 Processor shall indemnify Controller for any fines, penalties, or damages
       arising from Processor's breach of this Agreement or the GDPR.

9. TERM AND TERMINATION
   9.1 This Agreement continues for the duration of the service agreement.
   9.2 Upon termination, Processor shall comply with Section 3.7 (deletion/return).

10. GOVERNING LAW
    This Agreement is governed by [applicable law].

SIGNATURES:

Controller: _________________ Date: _________
Processor:  _________________ Date: _________
```

---

## 7. International Data Transfers

### 7.1 Transfer Mechanisms

| Mechanism | Description | Applicability |
|-----------|-------------|---------------|
| Adequacy Decision | EU Commission determines country provides adequate protection | US: Partial (Data Privacy Framework) |
| Standard Contractual Clauses (SCCs) | Pre-approved contract clauses | Most common mechanism |
| Binding Corporate Rules | For intra-group transfers | Not applicable (single entity) |
| Explicit Consent | User consents to transfer | Backup mechanism only |
| Data Privacy Framework | US-EU agreement | If vendor is certified |

### 7.2 EU-US Data Privacy Framework

The EU-US Data Privacy Framework (DPF) replaced the invalidated Privacy Shield. US organizations can self-certify to the DPF.

**Stone AI vendor DPF status**:
| Vendor | DPF Certified? | Alternative Mechanism |
|--------|---------------|----------------------|
| Clerk | Check at dataprivacyframework.gov | SCCs |
| Stripe | Yes | SCCs + DPF |
| Vercel | Check | SCCs |
| Neon | Check | SCCs |
| Anthropic | Check | SCCs |
| Cloudflare | Yes | SCCs + DPF |

### 7.3 Transfer Impact Assessment (TIA)

Post-Schrems II, you must assess whether the destination country provides adequate protection, even when using SCCs.

```
TRANSFER IMPACT ASSESSMENT TEMPLATE:

Transfer: [Description]
Source: [EU/EEA country]
Destination: United States
Legal Mechanism: SCCs + DPF (where applicable)

1. LAWS OF DESTINATION COUNTRY:
   - Does US law provide essentially equivalent protection to GDPR?
   - Key concern: FISA Section 702 surveillance powers
   - Mitigation: DPF includes new safeguards (proportionality, necessity)
   - Additional safeguards: encryption, access controls, data minimization

2. SUPPLEMENTARY MEASURES:
   Technical:
   - End-to-end encryption where feasible
   - Pseudonymization of personal data
   - Access controls limiting who can view data

   Organizational:
   - DPAs with all processors
   - Transparency reporting
   - Resistance to government access requests unless legally compelled

   Contractual:
   - SCCs with all processors
   - Notification obligation if processor receives government access request

3. ASSESSMENT CONCLUSION:
   With the DPF framework, SCCs, and supplementary measures in place,
   the transfers provide adequate protection for EU personal data.
```

---

## 8. Data Breach Notification (72-Hour Rule)

### 8.1 Breach Notification Requirements

```
GDPR BREACH NOTIFICATION TIMELINE:

HOUR 0: Breach discovered or reported
├── Activate incident response team
├── Begin containment measures
├── Start documenting everything
└── Assess scope and risk

WITHIN 72 HOURS: Notify supervisory authority (Art. 33)
├── UNLESS the breach is unlikely to result in a risk to individuals
├── Notification must include:
│   (a) Nature of breach (categories + approx. number of data subjects)
│   (b) Name and contact of DPO or privacy contact
│   (c) Likely consequences
│   (d) Measures taken or proposed
├── If full information not yet available: provide in phases
└── Document reasons if notification exceeds 72 hours

WITHOUT UNDUE DELAY: Notify affected data subjects (Art. 34)
├── Required when breach likely results in HIGH risk to individuals
├── Must be in clear, plain language
├── Must include:
│   (a) Nature of the breach
│   (b) Name and contact of DPO or privacy contact
│   (c) Likely consequences
│   (d) Measures taken and measures individuals can take
├── May use public communication if individual notice is disproportionate
└── NOT required if:
    - Data was encrypted (unintelligible to unauthorized)
    - Subsequent measures eliminate high risk
    - Disproportionate effort (use public communication instead)
```

### 8.2 Supervisory Authority Notification Template

```
DATA BREACH NOTIFICATION TO SUPERVISORY AUTHORITY

Date of Notification: [Date]
Reference: [Internal reference]

1. CONTROLLER DETAILS
   Name: [Company Name]
   Address: [Address]
   Contact: [Privacy contact email and phone]
   EU Representative: [Name and contact]

2. NATURE OF THE BREACH
   Date/time breach occurred: [Date/time, if known]
   Date/time breach discovered: [Date/time]
   Type of breach: [Confidentiality / Integrity / Availability]
   Description: [What happened]

3. CATEGORIES AND NUMBERS
   Approximate number of data subjects affected: [Number]
   Categories of data subjects: [Users, employees, etc.]
   Categories of personal data: [Names, emails, conversations, etc.]
   Approximate number of personal data records: [Number]

4. LIKELY CONSEQUENCES
   [Description of likely consequences for data subjects]

5. MEASURES TAKEN
   Containment measures: [What was done to stop the breach]
   Mitigation measures: [What was done to reduce impact]
   Prevention measures: [What will be done to prevent recurrence]

6. ADDITIONAL INFORMATION
   [Any other relevant details]
   [Statement that additional information will be provided if available]

Submitted by: [Name, Title]
```

---

## 9. Record of Processing Activities (ROPA)

### 9.1 ROPA Requirements (Article 30)

Organizations must maintain a record of processing activities. This is a living document that must be kept current.

### 9.2 ROPA Template

```
RECORD OF PROCESSING ACTIVITIES — [COMPANY NAME]

Date: [Last Updated]
Controller: [Company Name], [Address], [Contact]
EU Representative: [Name], [Address], [Contact]
Data Protection Contact: [Name], [Email]

PROCESSING ACTIVITY 1: User Account Management
├── Purpose: Create and manage user accounts for service delivery
├── Categories of data subjects: Registered users
├── Categories of personal data: Name, email, profile data, preferences
├── Recipients: Clerk (processor), Neon (processor)
├── International transfers: US (SCCs + DPF)
├── Retention: Duration of account + 30 days
├── Security measures: Encryption, access controls, MFA
└── Legal basis: Contract performance (Art. 6(1)(b))

PROCESSING ACTIVITY 2: AI Conversation Processing
├── Purpose: Deliver AI agent and Bestie conversation features
├── Categories of data subjects: Users of AI features
├── Categories of personal data: Conversation text, interaction metadata
├── Recipients: Anthropic (processor), Neon (processor)
├── International transfers: US (SCCs)
├── Retention: 90 days active, then anonymized
├── Security measures: AES-256-GCM encryption, access controls
└── Legal basis: Contract performance (Art. 6(1)(b))

PROCESSING ACTIVITY 3: Payment Processing
├── Purpose: Process subscription payments and manage billing
├── Categories of data subjects: Paid subscribers
├── Categories of personal data: Card last 4, billing address, transaction history
├── Recipients: Stripe (processor)
├── International transfers: US (SCCs + DPF)
├── Retention: 7 years (tax/legal requirement)
├── Security measures: PCI DSS (via Stripe), tokenization
└── Legal basis: Contract performance (Art. 6(1)(b))

PROCESSING ACTIVITY 4: Security and Fraud Prevention
├── Purpose: Detect and prevent unauthorized access and fraud
├── Categories of data subjects: All users
├── Categories of personal data: IP addresses, device info, access patterns
├── Recipients: Cloudflare (processor), Vercel (processor)
├── International transfers: US/Global (SCCs + DPF)
├── Retention: 90 days (server logs)
├── Security measures: Encryption, rate limiting, access controls
└── Legal basis: Legitimate interest (Art. 6(1)(f))

PROCESSING ACTIVITY 5: Analytics and Service Improvement
├── Purpose: Understand usage patterns and improve service quality
├── Categories of data subjects: All users
├── Categories of personal data: Usage data, feature interaction data (anonymized)
├── Recipients: Vercel Analytics (processor)
├── International transfers: US/Global (SCCs)
├── Retention: 26 months (anonymized)
├── Security measures: Anonymization, aggregation, access controls
└── Legal basis: Legitimate interest (Art. 6(1)(f)) / Consent for cookies

PROCESSING ACTIVITY 6: Marketing Communications
├── Purpose: Send promotional emails and product updates
├── Categories of data subjects: Users who have opted in
├── Categories of personal data: Email, name, subscription tier
├── Recipients: [Email provider] (processor)
├── International transfers: US (SCCs)
├── Retention: Until consent withdrawn + 3 years
├── Security measures: Encryption, unsubscribe mechanism
└── Legal basis: Consent (Art. 6(1)(a))

PROCESSING ACTIVITY 7: Customer Support
├── Purpose: Respond to user inquiries and resolve issues
├── Categories of data subjects: Users who contact support
├── Categories of personal data: Communication content, account data
├── Recipients: [Support platform] (processor), Neon (processor)
├── International transfers: US (SCCs)
├── Retention: 3 years after resolution
├── Security measures: Access controls, encryption
└── Legal basis: Contract performance (Art. 6(1)(b))
```

---

## 10. Data Protection Impact Assessment (DPIA)

### 10.1 When DPIA Is Required (Article 35)

A DPIA is mandatory when processing is likely to result in high risk, including:
- Systematic and extensive profiling with significant effects
- Large-scale processing of special category data
- Systematic monitoring of publicly accessible areas
- New technologies combined with high-risk processing
- Processing that could prevent data subjects from exercising rights

**Stone AI DPIA Triggers**:
- New AI model deployment (new technology)
- Processing AI conversations at scale (large-scale processing)
- Bestie personality profiling (systematic profiling)
- Any new feature collecting sensitive data

### 10.2 DPIA Template

```
DATA PROTECTION IMPACT ASSESSMENT

Project/Feature: [Name]
Date: [Date]
Assessor: [Name/Role]
Status: [Draft / Final / Approved]

1. DESCRIPTION OF PROCESSING
   - What data will be processed?
   - How will it be processed?
   - What technology is used?
   - Who will have access?
   - How long will data be retained?

2. NECESSITY AND PROPORTIONALITY
   - Is the processing necessary for the stated purpose?
   - Is there a less intrusive alternative?
   - How will data quality be ensured?
   - What information will be provided to data subjects?
   - How will data subject rights be supported?
   - What measures ensure processor compliance?
   - What safeguards for international transfers?

3. RISK ASSESSMENT
   | Risk | Likelihood | Severity | Risk Level | Mitigation |
   |------|-----------|----------|------------|------------|
   | Unauthorized access | [L/M/H] | [L/M/H] | [L/M/H] | [Measure] |
   | Data breach | [L/M/H] | [L/M/H] | [L/M/H] | [Measure] |
   | Function creep | [L/M/H] | [L/M/H] | [L/M/H] | [Measure] |
   | Re-identification | [L/M/H] | [L/M/H] | [L/M/H] | [Measure] |
   | Discrimination | [L/M/H] | [L/M/H] | [L/M/H] | [Measure] |
   | Loss of control | [L/M/H] | [L/M/H] | [L/M/H] | [Measure] |

4. MEASURES TO ADDRESS RISKS
   For each identified risk:
   - Technical measure: [Description]
   - Organizational measure: [Description]
   - Expected residual risk: [L/M/H]

5. CONSULTATION
   - Data subjects consulted? [Yes/No — how]
   - DPO consulted? [Yes/No — opinion]
   - Supervisory authority consulted? [Yes/No — required if high residual risk]

6. APPROVAL
   Approved by: [Name/Role]
   Date: [Date]
   Review date: [Date — typically annual]
```

---

## 11. Implementation Priorities

### 11.1 Phase 1 — Foundation (Weeks 1-4)
1. Complete data inventory and ROPA
2. Draft and publish GDPR-compliant privacy policy
3. Implement cookie consent management
4. Establish DSAR processing workflow
5. Designate EU representative (if serving EU users)

### 11.2 Phase 2 — Agreements (Weeks 5-8)
1. Execute DPAs with all processors (Clerk, Stripe, Vercel, Neon, Anthropic)
2. Verify international transfer mechanisms (SCCs/DPF)
3. Document legitimate interest assessments
4. Implement consent management system

### 11.3 Phase 3 — Operations (Weeks 9-12)
1. Conduct DPIAs for AI features
2. Implement data retention automation
3. Build data export and deletion tools
4. Test DSAR fulfillment process end-to-end
5. Establish breach response procedures

### 11.4 Phase 4 — Maintenance (Ongoing)
1. Quarterly compliance reviews
2. Annual DPIA reviews
3. ROPA updates with every processing change
4. Regulatory monitoring for GDPR updates
5. Training and awareness

---

*This playbook provides a GDPR compliance framework. It does not constitute legal advice. GDPR compliance should be validated by a qualified data protection professional or attorney with expertise in EU data protection law.*
