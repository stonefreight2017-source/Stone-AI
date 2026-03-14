# CCPA/CPRA Compliance Guide for AI SaaS

## Palace Knowledge Seed — Legal & Compliance Series
### Classification: Critical Regulatory Compliance
### Applicable To: Stone AI, Best AI Mobile, Stone AI Tools

---

## 1. Executive Summary

The California Consumer Privacy Act (CCPA), as amended by the California Privacy Rights Act (CPRA), is the most comprehensive US state privacy law. It grants California residents extensive rights over their personal information and imposes significant obligations on businesses that collect or process their data. The CPRA amendments, fully operative since January 1, 2023, with enforcement by the California Privacy Protection Agency (CPPA), expanded consumer rights and created new business obligations.

Stone AI is subject to CCPA/CPRA if it meets any of the following thresholds (for the preceding calendar year):
- Annual gross revenue exceeding $25 million
- Buys, sells, or shares the personal information of 100,000 or more consumers or households
- Derives 50% or more of annual revenue from selling or sharing consumers' personal information

Even if Stone AI does not currently meet these thresholds, proactive compliance is strategically sound: the thresholds can be met quickly as the user base grows, and compliance demonstrates trust to California users (a massive market segment).

---

## 2. Key Definitions

### 2.1 Personal Information

CCPA defines "personal information" broadly: information that identifies, relates to, describes, is reasonably capable of being associated with, or could reasonably be linked, directly or indirectly, with a particular consumer or household.

**Categories under CCPA** (with Stone AI data mapping):

| CCPA Category | Stone AI Data | Collected? |
|--------------|---------------|-----------|
| A. Identifiers | Name, email, IP address, account name | Yes |
| B. Personal info per Cal. Civ. Code 1798.80 | Name, address, phone (if collected) | Partial |
| C. Protected characteristics | Age (if collected), gender (if in profile) | Minimal |
| D. Commercial information | Subscription history, transaction records | Yes |
| E. Biometric information | N/A | No |
| F. Internet activity | Browsing history, search history, interaction data | Yes |
| G. Geolocation data | Approximate location from IP | Yes |
| H. Sensory data | N/A | No |
| I. Professional/employment info | N/A (unless in user content) | No |
| J. Education information | N/A | No |
| K. Inferences | AI interaction patterns, preferences, behavior | Yes |
| L. Sensitive personal information | Account login (email + password via Clerk) | Yes |

### 2.2 Sensitive Personal Information (CPRA Addition)

CPRA created a new category of "sensitive personal information" with additional protections:
- Social security, driver's license, passport numbers
- Account login with required security/access code or password
- Financial account info with access code
- Precise geolocation
- Racial/ethnic origin, religious beliefs, union membership
- Contents of mail, email, text messages (unless business is intended recipient)
- Genetic data, biometric data for identification
- Health information, sex life/sexual orientation

**Stone AI sensitive data**: Account login credentials (processed by Clerk) and potentially the contents of AI conversations (which could contain anything the user shares).

### 2.3 Sale vs. Sharing

**Sale**: Disclosing personal information for monetary or other valuable consideration.

**Sharing** (CPRA addition): Disclosing personal information for cross-context behavioral advertising, whether or not for monetary consideration.

**Stone AI position**: Stone AI does NOT sell or share personal information under these definitions. Data shared with processors (Clerk, Stripe, Vercel, Neon, Anthropic) is for service delivery, not for monetary consideration or cross-context behavioral advertising.

---

## 3. Consumer Rights Under CCPA/CPRA

### 3.1 Right to Know (§ 1798.100, 1798.110, 1798.115)

Consumers have the right to request:
- Categories of personal information collected
- Specific pieces of personal information collected
- Categories of sources from which PI was collected
- Business or commercial purpose for collecting/selling PI
- Categories of third parties with whom PI is shared
- Specific pieces of PI the business has collected about the consumer

**Implementation Requirements**:
- Provide at least two methods to submit requests (web form, toll-free number for businesses with physical presence, email)
- Verify consumer identity before fulfilling request
- Respond within 45 days (extendable by 45 additional days with notice)
- Provide information for the preceding 12-month period (or since January 1, 2022 for CPRA)
- Free of charge (except for manifestly unfounded or excessive requests)
- Cannot require account creation to submit a request

### 3.2 Right to Delete (§ 1798.105)

Consumers can request deletion of their personal information. Business must:
- Delete PI from records
- Direct service providers and contractors to delete
- Notify third parties who purchased or received PI to delete

**Exceptions** (PI may be retained if needed to):
- Complete the transaction for which it was collected
- Provide goods/services requested by the consumer
- Perform under a contract with the consumer
- Detect security incidents, protect against deceptive activity
- Debug to identify and repair errors
- Exercise free speech or other legal rights
- Comply with the California Electronic Communications Privacy Act
- Engage in scientific, historical, or statistical research in the public interest
- Comply with a legal obligation
- Make other internal and lawful uses compatible with collection context

### 3.3 Right to Correct (§ 1798.106 — CPRA Addition)

Consumers can request correction of inaccurate personal information. Business must:
- Use commercially reasonable efforts to correct information
- Consider the nature of the PI and purpose of processing
- Instruct service providers and contractors to correct

### 3.4 Right to Opt-Out of Sale/Sharing (§ 1798.120, 1798.135)

If a business sells or shares PI:
- Must provide a "Do Not Sell or Share My Personal Information" link
- Must honor Global Privacy Control (GPC) signals
- Must wait at least 12 months before asking consumer to opt back in
- Cannot discriminate against consumers who opt out

**Stone AI**: Since Stone AI does not sell or share PI, this right is less operationally significant, but the privacy policy should clearly state this, and the system should respect GPC signals as a best practice.

### 3.5 Right to Limit Use of Sensitive PI (§ 1798.121 — CPRA Addition)

Consumers can direct businesses to limit use of sensitive PI to:
- What is necessary to perform the services/provide the goods requested
- Certain specified business purposes (security, short-term transient use, quality/safety maintenance, etc.)

Must provide a "Limit the Use of My Sensitive Personal Information" link if using sensitive PI beyond necessary purposes.

### 3.6 Right to Non-Discrimination (§ 1798.125)

Cannot discriminate against consumers who exercise their rights by:
- Denying goods or services
- Charging different prices
- Providing different quality of service
- Suggesting any of the above

**Exception**: Can offer financial incentives for collection/sale of PI, but must notify consumer and obtain opt-in consent.

---

## 4. Business Obligations

### 4.1 Privacy Notice Requirements

The privacy notice (privacy policy) must disclose, at or before the point of collection:

```
REQUIRED DISCLOSURES:

1. CATEGORIES OF PI COLLECTED AND PURPOSE:
   For each category of PI collected, state:
   - The category (using CCPA categories)
   - The business or commercial purpose for collection
   - Whether it is sold or shared
   - The retention period or criteria for determining retention

2. CATEGORIES OF PI DISCLOSED FOR BUSINESS PURPOSE:
   - List each category disclosed
   - Name the category of third-party recipient

3. CATEGORIES OF PI SOLD OR SHARED:
   - List each category sold or shared
   - If none: explicitly state "We do not sell or share personal information"

4. SENSITIVE PI:
   - Categories of sensitive PI collected
   - Whether it is sold or shared
   - Whether use is limited

5. CONSUMER RIGHTS:
   - Description of each right
   - How to exercise each right
   - Verification process

6. CONTACT INFORMATION:
   - Email address for privacy inquiries
   - Mailing address
   - Toll-free number (if you have a physical California presence)

7. DATE OF LAST UPDATE

8. FINANCIAL INCENTIVES:
   - If offered, describe the terms
   - How consumers can opt in
   - How to withdraw
   - Explanation of why the incentive is not discriminatory
```

### 4.2 Notice at Collection

At or before the point of collecting personal information, you must provide:
- Categories of PI to be collected
- Purpose for each category
- Whether PI is sold or shared
- Retention period for each category
- Link to full privacy policy

**Implementation**: Registration page, checkout page, and any data collection form must include a conspicuous privacy notice link and, ideally, a concise summary of data collection.

### 4.3 Service Provider and Contractor Agreements

CCPA/CPRA requires written agreements with service providers and contractors:

```
REQUIRED CONTRACT PROVISIONS:

For Service Providers (processes PI on business's behalf):
1. Specify the business purpose for processing
2. Prohibit selling or sharing the PI
3. Prohibit retaining, using, or disclosing PI outside the business relationship
4. Prohibit combining PI with data from other sources (with exceptions)
5. Require compliance with CCPA/CPRA
6. Grant business the right to take reasonable steps to ensure compliance
7. Require notification of inability to meet obligations
8. Require assistance with consumer rights requests

For Contractors (receives PI from business):
Same as service providers, plus:
- Certification that contractor understands restrictions
- Business has right to monitor compliance
```

### 4.4 Data Minimization (CPRA Addition)

```
DATA MINIMIZATION REQUIREMENTS:

1. Collection must be reasonably necessary and proportionate to the purpose
2. Processing must be compatible with disclosed purposes
3. Retention must not exceed what is reasonably necessary for the disclosed purpose
4. Must establish retention schedules for each category of PI
5. Must disclose retention periods in privacy notice

IMPLEMENTATION:
- Audit all data collection for necessity
- Remove any data fields not required for stated purposes
- Implement automated retention enforcement
- Document justification for each data point collected
```

---

## 5. Opt-Out Mechanisms

### 5.1 Global Privacy Control (GPC)

The CPPA has confirmed that businesses must honor GPC browser signals as valid opt-out requests.

```
GPC IMPLEMENTATION:

1. DETECTION:
   Check for GPC signal in HTTP request headers:
   Sec-GPC: 1

   Or via JavaScript:
   navigator.globalPrivacyControl === true

2. RESPONSE:
   When GPC signal is detected:
   - Treat as opt-out of sale/sharing for that browser/device
   - Do not set marketing or tracking cookies
   - Do not share data with third parties for advertising
   - Log the GPC signal detection for compliance records

3. SCOPE:
   GPC applies to the browser/device, not necessarily the user account
   (unless you can link the signal to an authenticated user, in which
   case apply it account-wide)

4. CONFLICT RESOLUTION:
   If user previously opted in but GPC is detected:
   - GPC controls (CPPA guidance)
   - Do not override GPC with prior opt-in
```

### 5.2 "Do Not Sell or Share" Link

Even if you don't sell or share PI, having this link demonstrates good faith and prepares for future changes:

```
IMPLEMENTATION:

- Prominent link on homepage footer: "Do Not Sell or Share My Personal Information"
- Link leads to opt-out mechanism (toggle in account settings or dedicated page)
- No account creation required to submit opt-out
- Confirmation of opt-out provided
- Takes effect within 15 business days
- Record opt-out with timestamp
```

### 5.3 "Limit Use of Sensitive PI" Link

```
IMPLEMENTATION:

- Link on homepage footer: "Limit the Use of My Sensitive Personal Information"
- Link leads to controls for limiting sensitive PI use
- Must be separate from "Do Not Sell or Share" link
- Can combine with "Do Not Sell or Share" into single link:
  "Your Privacy Choices" (with required opt-out icon)
```

---

## 6. Consumer Request Handling

### 6.1 Request Submission Methods

```
REQUIRED METHODS:
1. Online web form (designated email address also acceptable)
2. Toll-free phone number (only if physical CA presence)

RECOMMENDED ADDITIONAL METHODS:
3. Account settings self-service (for authenticated users)
4. In-app request mechanism (for mobile app)
```

### 6.2 Identity Verification

```
VERIFICATION STANDARDS:

NON-ACCOUNT HOLDERS:
- Match at least two data points to records
- Examples: email address + name, phone number + email
- For access to specific pieces: match three data points + signed declaration
- Never collect new PI solely for verification

ACCOUNT HOLDERS:
- Verify through existing account authentication
- Re-authenticate if request is submitted outside account settings
- For high-risk requests (deletion, specific pieces): additional verification step

AUTHORIZED AGENTS:
- Written authorization signed by consumer
- Verify consumer's identity independently
- Registered agent: proof of registration with CA Secretary of State
- Power of attorney: legal documentation
```

### 6.3 Response Timeline

```
CONSUMER REQUEST RESPONSE TIMELINE:

Day 0: Request received
├── Acknowledge receipt within 10 business days
├── Inform consumer of verification process
└── Start 45-day clock

Days 1-10: Verification
├── Verify consumer identity
├── If unable to verify: request additional info
│   └── Clock pauses until verification complete
└── Document verification steps

Days 10-35: Processing
├── Compile responsive information
├── Perform requested action (deletion, correction)
├── Notify service providers/contractors
└── Prepare response

Day 45: Response deadline
├── Deliver response to consumer
├── If extension needed: notify consumer before Day 45
│   └── Extension: up to 45 additional days (total 90)
├── Log completion
└── Retain request records for 24 months

IMPORTANT: Responses must be:
- Free of charge
- In a portable, readily usable format (for access/portability)
- Delivered via the consumer's preferred method (mail or electronic)
- Cover the 12-month period preceding the request
```

### 6.4 Request Tracking and Reporting

CCPA requires businesses to compile and publish annual metrics:

```
ANNUAL PRIVACY REQUEST METRICS (required if ≥10 million CA consumers):

For each type of request (know, delete, correct, opt-out, limit):
1. Number of requests received
2. Number of requests complied with (in whole or in part)
3. Number of requests denied
4. Median number of days to respond

INTERNAL TRACKING (recommended for all businesses):
- Request volume by type and month
- Average and median response times
- Denial reasons and frequency
- Verification failure rates
- Service provider compliance rates
```

---

## 7. Enforcement and Penalties

### 7.1 California Privacy Protection Agency (CPPA)

The CPPA is the dedicated enforcement agency created by CPRA:
- Investigates complaints and violations
- Issues regulations and guidance
- Conducts audits
- Imposes administrative fines

### 7.2 Penalty Structure

| Violation Type | Maximum Penalty |
|---------------|----------------|
| Unintentional violation | $2,500 per violation |
| Intentional violation | $7,500 per violation |
| Violation involving minors (under 16) | $7,500 per violation |
| Failure to implement reasonable security (data breach) | Statutory damages $100-$750 per consumer per incident, or actual damages |

**Note**: "Per violation" typically means per affected consumer, per incident. A data breach affecting 10,000 California residents could result in penalties of $25 million to $75 million.

### 7.3 Private Right of Action

Consumers have a private right of action under CCPA for data breaches resulting from a business's failure to implement and maintain reasonable security procedures:
- Statutory damages: $100-$750 per consumer per incident
- Actual damages (if greater)
- Injunctive or declaratory relief
- Any other relief the court deems proper

**30-day cure period**: Consumer must give business 30 days' written notice before filing suit. If the business cures and provides written statement of cure + assurance of no recurrence, no suit can proceed (does not apply to CPPA enforcement).

---

## 8. AI-Specific CCPA/CPRA Considerations

### 8.1 AI Conversations as Personal Information

AI conversation data qualifies as personal information under CCPA when it can be linked to a specific consumer. This means:
- Right to Know includes AI conversation history
- Right to Delete includes AI conversation data
- Right to Portability includes AI interaction data in usable format

### 8.2 Inferences from AI Interactions

CCPA Category K (Inferences) specifically covers conclusions drawn from personal information to create profiles. AI systems inherently create inferences:
- Agent recommendations based on usage patterns
- Bestie personality adaptations
- Feature suggestions based on behavior

These inferences are personal information subject to all CCPA rights.

### 8.3 Automated Decision-Making

CPRA's regulations address automated decision-making technology (ADMT). The CPPA has proposed regulations requiring:
- Pre-use notice to consumers about ADMT
- Right to opt out of ADMT for significant decisions
- Right to access information about ADMT logic
- Right to request human review of ADMT decisions

**Stone AI compliance**: Treat AI agent outputs as ADMT where they could influence significant decisions. Include disclaimers and human review options.

### 8.4 AI Model Training

If user data is used to train or improve AI models:
- This is a "business purpose" that must be disclosed
- Consumers can exercise Right to Delete (removing their data from training sets may be technically impractical — disclose this)
- If data is sold or shared with third parties for model training, opt-out rights apply
- Anonymized data used for training is excluded from CCPA (truly anonymized, not pseudonymized)

---

## 9. Compliance Checklist

### 9.1 Policy and Documentation

- [ ] Privacy policy includes all CCPA/CPRA required disclosures
- [ ] Notice at collection implemented at all data collection points
- [ ] Data inventory completed and mapped to CCPA categories
- [ ] Retention schedule established and disclosed for each PI category
- [ ] Service provider/contractor agreements updated with CCPA terms
- [ ] Annual privacy metrics compiled (if applicable)

### 9.2 Consumer Rights Infrastructure

- [ ] Web form for consumer requests is live and accessible
- [ ] Identity verification process is documented and tested
- [ ] DSAR fulfillment workflow is operational and tested end-to-end
- [ ] 45-day response timeline tracking is in place
- [ ] Data export in portable format is functional
- [ ] Data deletion cascade works across all systems and processors
- [ ] Correction mechanism is operational

### 9.3 Opt-Out Mechanisms

- [ ] GPC signal detection is implemented and tested
- [ ] "Do Not Sell or Share" link is on homepage footer (or "Your Privacy Choices")
- [ ] "Limit Use of Sensitive PI" link is available
- [ ] Opt-out takes effect within 15 business days
- [ ] Opt-out records are maintained with timestamps
- [ ] No re-solicitation of opt-out consumers for 12 months

### 9.4 Technical Measures

- [ ] Reasonable security procedures are implemented (encryption, access controls)
- [ ] Data minimization audit completed
- [ ] Automated retention enforcement is active
- [ ] Audit logging tracks all PI access and processing
- [ ] Cookie consent manages non-essential cookies

### 9.5 Ongoing Compliance

- [ ] Quarterly review of data practices
- [ ] Annual privacy policy review and update
- [ ] Service provider agreement annual review
- [ ] Consumer request metrics tracking
- [ ] Staff training on CCPA/CPRA requirements
- [ ] Monitor CPPA rulemaking and enforcement actions

---

## 10. CCPA vs. GDPR Comparison

| Aspect | CCPA/CPRA | GDPR |
|--------|-----------|------|
| Scope | California residents | EU/EEA/UK residents |
| Applicability trigger | Revenue/data volume thresholds | Any processing of EU data |
| Legal basis required | No (notice and opt-out model) | Yes (consent, contract, etc.) |
| Consent model | Opt-out | Opt-in |
| Right to know | Yes (12-month lookback) | Yes (access right) |
| Right to delete | Yes (with exceptions) | Yes (with exceptions) |
| Right to correct | Yes | Yes |
| Data portability | Yes | Yes |
| Opt-out of sale | Yes | N/A (sale requires consent) |
| Automated decisions | Emerging (CPPA regulations) | Yes (Art. 22) |
| Breach notification | AG + consumers (varies) | 72 hours to authority |
| Penalties | $2,500-$7,500 per violation | Up to 4% revenue / €20M |
| Private right of action | Data breaches only | Generally through DPAs |
| Enforcement | CPPA + AG | Data Protection Authorities |
| DPAs required | Service provider agreements | Data Processing Agreements |
| DPO required | No | Yes (in many cases) |

**Key Takeaway**: If you comply with GDPR, you are largely compliant with CCPA/CPRA, but there are CCPA-specific requirements (notice at collection format, opt-out links, GPC, annual metrics) that GDPR compliance alone does not cover.

---

*This guide provides a CCPA/CPRA compliance framework. It does not constitute legal advice. Consult a licensed attorney with expertise in California privacy law for compliance decisions. Monitor CPPA rulemaking for regulatory updates.*
