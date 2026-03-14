# Terms of Service Framework for AI SaaS Companies

## Palace Knowledge Seed — Legal & Compliance Series
### Classification: Critical Legal Infrastructure
### Applicable To: Stone AI, Best AI Mobile, Stone AI Tools

---

## 1. Executive Summary

A Terms of Service (ToS) agreement is the foundational legal contract between your SaaS platform and every user who accesses it. For AI-powered SaaS companies, the ToS carries additional complexity: you must address AI-generated content ownership, model behavior disclaimers, data processing for AI training, and the rapidly evolving regulatory landscape around artificial intelligence.

This seed provides a complete, production-ready framework for drafting Terms of Service across all three businesses in the Three-Headed Monster portfolio. It is tailored for a New York State-based founder operating nationally and internationally, with specific attention to AI-specific clauses that most generic ToS templates miss entirely.

**Why This Matters**: A poorly drafted ToS exposes you to unlimited liability, allows users to claim ownership of your AI outputs, creates regulatory violations, and provides no defense in disputes. A well-drafted ToS is your first line of legal defense and your clearest communication of expectations to users.

---

## 2. Structural Overview of a Complete AI SaaS ToS

### 2.1 Required Sections (Ordered)

Every ToS for an AI SaaS product should contain the following sections, in this general order:

1. **Acceptance of Terms** — How agreement is formed
2. **Definitions** — Key terms used throughout
3. **Account Registration and Security** — User responsibilities
4. **Description of Services** — What you provide
5. **AI-Specific Terms** — Content generation, limitations, disclaimers
6. **Acceptable Use Policy** — What users cannot do
7. **Subscription and Payment Terms** — Billing, renewals, refunds
8. **Intellectual Property Rights** — Ownership of platform, content, outputs
9. **User Content and Data** — What users upload, who owns it
10. **Privacy and Data Processing** — Reference to Privacy Policy
11. **Third-Party Services** — Integrations and their terms
12. **Disclaimers and Limitation of Liability** — Legal protections
13. **Indemnification** — User's obligation to defend you
14. **Termination** — How accounts end
15. **Dispute Resolution** — Arbitration, governing law, venue
16. **Modifications to Terms** — How you update the ToS
17. **Severability and Waiver** — Boilerplate legal provisions
18. **Contact Information** — How to reach you

### 2.2 Document Formatting Standards

- Use plain English wherever possible (required by some consumer protection laws)
- Bold or highlight any clauses that waive user rights
- Include a "Last Updated" date prominently at the top
- Provide a summary sidebar or FAQ for key provisions
- Ensure the document is accessible (screen reader compatible, proper heading structure)
- Version the document (v1.0, v1.1, etc.) for internal tracking

---

## 3. Detailed Clause Drafting Guide

### 3.1 Acceptance of Terms

This clause establishes that using the service constitutes agreement. For SaaS, this is typically "clickwrap" (user clicks "I agree") which is more enforceable than "browsewrap" (terms available via link).

**Key Elements**:
- Explicit statement that use constitutes acceptance
- Age requirement (13+ for general, 18+ for paid services, or parental consent)
- Authority clause (user represents they have authority to bind their organization if applicable)
- Reference to when terms become effective

**Template Language**:

```
By creating an account, accessing, or using [Service Name] ("Service"), you agree
to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms,
you may not access or use the Service.

If you are using the Service on behalf of an organization, you represent and warrant
that you have the authority to bind that organization to these Terms, and "you" refers
to both you individually and that organization.

You must be at least 13 years of age to use the Service. If you are under 18, you
represent that your parent or legal guardian has reviewed and agreed to these Terms
on your behalf. Paid features of the Service require you to be at least 18 years old
or the age of majority in your jurisdiction.
```

**NY State Consideration**: New York does not have a specific age-of-consent law for digital services beyond federal COPPA (Children's Online Privacy Protection Act) requirements, but aligning with the 13+ standard provides federal compliance. If your AI generates content that could be inappropriate for minors, consider raising the minimum age to 18.

### 3.2 Definitions Section

Define every term that could be ambiguous. AI SaaS companies need more definitions than traditional SaaS because of the novel nature of AI outputs.

**Essential Definitions**:

| Term | Definition |
|------|-----------|
| Service | The software application, APIs, and related services provided by [Company] |
| AI Features | Any functionality that uses artificial intelligence, machine learning, or automated systems to generate, modify, analyze, or process content |
| AI Output | Any text, image, code, analysis, recommendation, or other content generated by the Service's AI Features |
| User Content | Any data, text, images, files, or other materials uploaded or submitted by you to the Service |
| Account | Your registered account with the Service |
| Subscription | Your paid plan, including tier, billing cycle, and associated features |
| Bestie | The AI companion feature available to paid subscribers |
| Agent | An AI-powered specialist tool within the Service designed for specific tasks |
| Intellectual Property | Patents, copyrights, trademarks, trade secrets, and other proprietary rights |
| Confidential Information | Non-public information designated as confidential or reasonably understood to be confidential |
| Personal Data | Information that identifies or can be used to identify a natural person |
| Third-Party Services | External services integrated with or accessed through the Service |

### 3.3 Account Registration and Security

**Key Elements**:
- Accurate information requirement
- One account per person (unless explicitly permitted)
- Password security responsibility
- Notification obligation for unauthorized access
- Right to refuse or terminate accounts

**Template Language**:

```
You agree to provide accurate, current, and complete information during registration
and to update such information to keep it accurate. You are responsible for
safeguarding your account credentials and for all activities that occur under your
account. You must immediately notify us at [security email] if you become aware of
any unauthorized use of your account.

We reserve the right to refuse registration, suspend, or terminate any account at
our sole discretion, including if we reasonably believe that account information is
inaccurate or that the account is being used in violation of these Terms.

You may not share your account credentials with any third party or allow multiple
individuals to use a single account, unless your Subscription plan explicitly permits
multiple users.
```

### 3.4 Description of Services

This section describes what you actually provide. Be specific enough to set expectations but flexible enough to allow product evolution.

**For Stone AI specifically**:

```
[Stone AI / Best AI / Stone AI Tools] provides an AI-powered platform offering:

- AI Agent interactions across [number] specialized domains
- AI Bestie companion feature (available on paid plans)
- Text-based AI conversations and task assistance
- [Additional features specific to each product]

The Service uses a combination of proprietary and third-party AI models to generate
responses. The specific models, capabilities, and features available may vary by
subscription tier and may change over time as we improve the Service.

We do not guarantee that the Service will be available at all times or that AI outputs
will be accurate, complete, or suitable for any particular purpose. AI Features are
tools designed to assist you, not to replace professional judgment in any domain
including but not limited to medical, legal, financial, or safety-critical decisions.
```

### 3.5 AI-Specific Terms (CRITICAL SECTION)

This is the most important differentiator between a generic SaaS ToS and one built for AI. Most legal disputes with AI companies will center on these clauses.

#### 3.5.1 AI Output Disclaimers

```
AI OUTPUT DISCLAIMER: The Service's AI Features generate outputs based on machine
learning models that process statistical patterns in training data. AI Outputs:

(a) May contain errors, inaccuracies, biases, or fabricated information
    ("hallucinations");
(b) Should not be relied upon as factual, professional, legal, medical, financial,
    or safety-critical advice;
(c) May not reflect the views, opinions, or positions of [Company Name];
(d) May vary in quality and relevance depending on the input provided;
(e) Are generated probabilistically and may produce different results for identical
    inputs at different times.

YOU ACKNOWLEDGE AND AGREE THAT YOU USE AI OUTPUTS AT YOUR OWN RISK AND THAT
[COMPANY NAME] IS NOT LIABLE FOR ANY DECISIONS, ACTIONS, OR CONSEQUENCES ARISING
FROM YOUR RELIANCE ON AI OUTPUTS.
```

#### 3.5.2 AI-Generated Content Ownership

This is one of the most legally unsettled areas. Current US copyright law (as of the Copyright Office's 2023 guidance and subsequent rulings) generally holds that purely AI-generated content is not copyrightable, but human-directed AI outputs with sufficient human creative input may be.

```
OWNERSHIP OF AI OUTPUTS:

(a) As between you and [Company Name], you retain any rights you may have in AI
    Outputs generated through your use of the Service, subject to applicable law.
(b) You acknowledge that the copyright status of AI-generated content is unsettled
    under applicable law, and [Company Name] makes no representation that AI Outputs
    are copyrightable or that you will have exclusive rights to any AI Output.
(c) [Company Name] does not claim ownership of AI Outputs generated for you, but
    retains all rights in the underlying AI models, algorithms, and systems used
    to generate such outputs.
(d) You acknowledge that other users may receive similar or identical AI Outputs
    in response to similar inputs, and such outputs are not exclusive to you.
(e) You are solely responsible for determining whether and how AI Outputs may be
    used in your specific context, including compliance with applicable intellectual
    property laws.
```

#### 3.5.3 AI Training and Data Use

```
USE OF DATA FOR AI IMPROVEMENT:

(a) We may use anonymized and aggregated interaction data to improve our AI models
    and Service quality, unless you opt out through your account settings.
(b) We will not use your User Content to train AI models that are made available to
    other users without your explicit consent.
(c) Conversations with AI Agents and Bestie features may be reviewed by our systems
    for safety, quality assurance, and abuse prevention purposes.
(d) You may request deletion of your interaction history through your account
    settings or by contacting [privacy email].
```

#### 3.5.4 Automated Decision-Making Disclosure

Under GDPR and emerging US state laws, users have rights regarding automated decision-making.

```
AUTOMATED DECISION-MAKING:

The Service uses automated systems to:
- Generate AI responses and content
- Recommend agents and features based on your usage patterns
- Moderate content for safety and compliance
- Determine subscription feature access based on your plan tier

These automated processes assist in delivering the Service but do not make decisions
that produce significant legal effects on you without human oversight. If you believe
an automated decision has adversely affected your rights, you may contact us at
[support email] to request human review.
```

### 3.6 Acceptable Use Policy

The AUP defines prohibited behaviors. For AI platforms, this is especially important because users may attempt to use AI to generate harmful, illegal, or abusive content.

**Prohibited Uses**:

```
You may not use the Service to:

(a) Generate, distribute, or facilitate content that is illegal, harmful,
    threatening, abusive, harassing, defamatory, or otherwise objectionable;
(b) Attempt to generate content that exploits, harms, or endangers minors;
(c) Generate or distribute malware, phishing content, or tools for cyberattacks;
(d) Impersonate any person or entity, or falsely represent AI-generated content
    as human-created in contexts where such disclosure is required;
(e) Circumvent, disable, or interfere with security features of the Service;
(f) Use automated scripts, bots, or scrapers to access the Service except through
    our published APIs;
(g) Reverse engineer, decompile, or attempt to extract the source code or AI models
    of the Service;
(h) Use the Service to develop competing AI products or services;
(i) Exceed rate limits or use the Service in a manner that degrades performance
    for other users;
(j) Use the Service for high-risk applications including but not limited to:
    autonomous weapons, real-time biometric identification for surveillance,
    social scoring, or critical infrastructure control;
(k) Generate content that infringes on any third party's intellectual property
    rights;
(l) Resell, sublicense, or commercially redistribute AI Outputs without a valid
    commercial license;
(m) Use the Service to generate spam, misleading advertising, or fraudulent content;
(n) Attempt to jailbreak, prompt-inject, or manipulate AI systems to bypass safety
    measures.

Violation of this Acceptable Use Policy may result in immediate suspension or
termination of your account without notice or refund.
```

### 3.7 Subscription and Payment Terms

**Key Elements for Tiered SaaS**:

```
SUBSCRIPTION PLANS AND BILLING:

(a) The Service offers multiple subscription tiers: Free, Starter, Plus, Smart,
    and Pro. Features available at each tier are described on our pricing page and
    may change from time to time.

(b) Paid subscriptions are billed [monthly/annually] in advance. By subscribing,
    you authorize [Company Name] to charge your designated payment method on a
    recurring basis until you cancel.

(c) AUTOMATIC RENEWAL: Your subscription will automatically renew at the end of
    each billing period at the then-current rate unless you cancel before the
    renewal date. THIS IS AN AUTOMATIC RENEWAL AGREEMENT UNDER NEW YORK GENERAL
    OBLIGATIONS LAW § 5-903.

(d) PRICE CHANGES: We will provide at least thirty (30) days' notice before any
    price increase takes effect for your subscription. Continued use after the
    effective date constitutes acceptance.

(e) PROMOTIONAL PRICING: Promotional or introductory pricing applies only for the
    specified period. After the promotional period, your subscription will renew at
    the standard rate.

(f) REFUNDS: [Define refund policy — see payment-compliance.md for requirements]

(g) FREE TIER: Free accounts are provided at our discretion and may be modified,
    limited, or discontinued at any time without notice.

(h) DOWNGRADES: If you downgrade your subscription tier, you may lose access to
    features and data associated with the higher tier. We are not responsible for
    any data loss resulting from a downgrade.
```

**NY State Auto-Renewal Law**: New York General Obligations Law § 5-903 requires:
- Clear and conspicuous disclosure of automatic renewal terms
- Affirmative consent to the renewal terms
- Acknowledgment that includes the renewal terms and cancellation policy
- Easy cancellation mechanism (online if you signed up online)

### 3.8 Intellectual Property Rights

```
INTELLECTUAL PROPERTY:

(a) PLATFORM IP: The Service, including all software, AI models, algorithms,
    designs, text, graphics, and other materials ("Platform IP") is owned by
    [Company Name] and protected by copyright, trademark, patent, trade secret,
    and other intellectual property laws. Nothing in these Terms grants you any
    right, title, or interest in the Platform IP except the limited license to
    use the Service as described herein.

(b) LICENSE TO USE: Subject to these Terms and your payment of applicable fees,
    we grant you a limited, non-exclusive, non-transferable, revocable license to
    access and use the Service for your personal or internal business purposes.

(c) TRADEMARKS: [Stone AI], [Best AI], [Stone AI Tools], [Three-Headed Monster],
    [Concept E], and associated logos and marks are trademarks of [Company Name].
    You may not use these marks without our prior written consent.

(d) FEEDBACK: If you provide suggestions, ideas, or feedback about the Service
    ("Feedback"), you grant us an irrevocable, perpetual, worldwide, royalty-free
    license to use, modify, and incorporate such Feedback into the Service without
    any obligation to you.

(e) USER CONTENT LICENSE: You retain ownership of your User Content. By uploading
    User Content to the Service, you grant us a worldwide, non-exclusive,
    royalty-free license to use, process, store, and display your User Content
    solely as necessary to provide and improve the Service.
```

### 3.9 Disclaimers and Limitation of Liability

This is the section that protects you from lawsuits. It must be conspicuous (typically in ALL CAPS or bold) to be enforceable.

```
DISCLAIMERS:

THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE. [COMPANY NAME] SPECIFICALLY
DISCLAIMS ALL IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
PURPOSE, AND NON-INFRINGEMENT.

[COMPANY NAME] DOES NOT WARRANT THAT:
(A) THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE;
(B) AI OUTPUTS WILL BE ACCURATE, COMPLETE, RELIABLE, OR FIT FOR ANY PURPOSE;
(C) ANY DEFECTS IN THE SERVICE WILL BE CORRECTED;
(D) THE SERVICE WILL MEET YOUR REQUIREMENTS OR EXPECTATIONS.

LIMITATION OF LIABILITY:

TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL [COMPANY NAME],
ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, OR AFFILIATES BE LIABLE FOR ANY:

(A) INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES;
(B) LOSS OF PROFITS, REVENUE, DATA, BUSINESS OPPORTUNITIES, OR GOODWILL;
(C) DAMAGES ARISING FROM YOUR USE OF OR RELIANCE ON AI OUTPUTS;
(D) COST OF PROCUREMENT OF SUBSTITUTE SERVICES;

REGARDLESS OF THE THEORY OF LIABILITY (CONTRACT, TORT, STRICT LIABILITY, OR
OTHERWISE), EVEN IF [COMPANY NAME] HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH
DAMAGES.

[COMPANY NAME]'S TOTAL CUMULATIVE LIABILITY FOR ALL CLAIMS ARISING OUT OF OR
RELATED TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF:
(A) THE AMOUNTS YOU PAID TO [COMPANY NAME] IN THE TWELVE (12) MONTHS PRECEDING
    THE CLAIM; OR
(B) ONE HUNDRED US DOLLARS ($100).

SOME JURISDICTIONS DO NOT ALLOW THE EXCLUSION OR LIMITATION OF CERTAIN DAMAGES.
IN SUCH JURISDICTIONS, OUR LIABILITY IS LIMITED TO THE MAXIMUM EXTENT PERMITTED
BY LAW.
```

**NY State Note**: New York courts generally enforce limitation of liability clauses in commercial contexts, but they must be clear, conspicuous, and not unconscionable. The 12-month lookback cap is standard and generally enforceable.

### 3.10 Indemnification

```
INDEMNIFICATION:

You agree to indemnify, defend, and hold harmless [Company Name] and its officers,
directors, employees, agents, and affiliates from and against any and all claims,
damages, losses, liabilities, costs, and expenses (including reasonable attorneys'
fees) arising out of or related to:

(a) Your use of the Service or AI Outputs;
(b) Your User Content;
(c) Your violation of these Terms;
(d) Your violation of any applicable law or regulation;
(e) Your infringement of any third party's rights;
(f) Any dispute between you and a third party arising from your use of the Service.

We reserve the right, at your expense, to assume the exclusive defense and control
of any matter subject to indemnification by you.
```

### 3.11 Termination

```
TERMINATION:

(a) BY YOU: You may terminate your account at any time through your account settings
    or by contacting [support email]. Termination of a paid subscription will take
    effect at the end of your current billing period. No partial refunds are provided
    for unused time in a billing period unless required by applicable law.

(b) BY US: We may suspend or terminate your account immediately, without prior notice,
    if we reasonably believe you have violated these Terms, the Acceptable Use Policy,
    or any applicable law. We may also terminate accounts that have been inactive for
    more than [12 months].

(c) EFFECT OF TERMINATION: Upon termination:
    - Your right to access the Service ceases immediately;
    - We may delete your account data after [30 days], unless we are required to
      retain it by law or legitimate business interest;
    - You may request an export of your User Content within [30 days] of termination;
    - Sections of these Terms that by their nature should survive termination will
      survive, including: Intellectual Property, Disclaimers, Limitation of Liability,
      Indemnification, and Dispute Resolution.

(d) NO LIABILITY FOR TERMINATION: [Company Name] will not be liable to you or any
    third party for any termination of your access to the Service.
```

### 3.12 Dispute Resolution

```
DISPUTE RESOLUTION:

(a) GOVERNING LAW: These Terms are governed by the laws of the State of New York,
    without regard to its conflict of laws provisions.

(b) INFORMAL RESOLUTION: Before filing any formal dispute, you agree to contact us
    at [legal email] and attempt to resolve the dispute informally for at least
    thirty (30) days.

(c) ARBITRATION: Any dispute not resolved informally shall be resolved by binding
    arbitration administered by the American Arbitration Association ("AAA") under
    its Consumer Arbitration Rules. The arbitration shall be conducted in
    [County, New York] or, at your election, by telephone or online. The
    arbitrator's decision shall be final and binding.

(d) CLASS ACTION WAIVER: YOU AGREE THAT ANY DISPUTE RESOLUTION PROCEEDINGS WILL
    BE CONDUCTED ONLY ON AN INDIVIDUAL BASIS AND NOT IN A CLASS, CONSOLIDATED,
    OR REPRESENTATIVE ACTION. IF FOR ANY REASON A CLAIM PROCEEDS IN COURT RATHER
    THAN IN ARBITRATION, YOU WAIVE ANY RIGHT TO A JURY TRIAL.

(e) SMALL CLAIMS EXCEPTION: Notwithstanding the above, either party may bring an
    individual action in small claims court for disputes within that court's
    jurisdictional limits.

(f) INJUNCTIVE RELIEF: Nothing in this section prevents [Company Name] from seeking
    injunctive or equitable relief in any court of competent jurisdiction to protect
    its intellectual property rights.
```

**NY State Note**: Arbitration clauses are generally enforceable in New York under the Federal Arbitration Act. The class action waiver has been upheld by the US Supreme Court in AT&T Mobility v. Concepcion and Epic Systems v. Lewis.

### 3.13 Modifications to Terms

```
MODIFICATIONS:

We may modify these Terms at any time by posting the updated Terms on the Service
and updating the "Last Updated" date. For material changes, we will provide notice
through:

(a) An email to the address associated with your account;
(b) A prominent notice within the Service; or
(c) Other means reasonably calculated to provide notice.

Your continued use of the Service after the effective date of modified Terms
constitutes your acceptance. If you do not agree to the modified Terms, you must
stop using the Service and may terminate your account.

For paid subscribers, material changes to Terms that reduce your rights will not
take effect until the start of your next billing period.
```

---

## 4. Product-Specific Customization Guide

### 4.1 Stone AI (Primary SaaS Platform)

Stone AI's ToS should emphasize:
- **44 AI Agents**: Describe the agent system, make clear agents are AI (not humans)
- **Tier-based access**: Clearly delineate which agents/features are available at each tier
- **Bestie feature**: Address the AI companion's limitations — it is not a therapist, friend, or substitute for human relationships
- **Emotes and social features**: Forum conduct rules, emote usage
- **Backdrops and customization**: Clarify that premium visual assets are licensed, not sold

Additional clause for Bestie:

```
AI COMPANION ("BESTIE") DISCLAIMER:

The Bestie feature provides an AI-simulated conversational companion for
entertainment and casual interaction purposes only. The Bestie:

(a) Is not a real person and does not have feelings, consciousness, or preferences;
(b) Is not a substitute for professional mental health services, counseling,
    therapy, or medical advice;
(c) May be modified, reset, or discontinued at any time;
(d) May not remember all past conversations or maintain perfect continuity;
(e) Should not be relied upon for emotional support in crisis situations.

If you are experiencing a mental health emergency, please contact the 988 Suicide
& Crisis Lifeline (call or text 988) or your local emergency services.
```

### 4.2 Best AI Mobile

Mobile app ToS should additionally include:
- **App Store compliance**: Reference to Apple App Store / Google Play terms
- **Mobile-specific permissions**: Camera, microphone, notifications, storage
- **Offline functionality limitations**: What works without internet
- **Push notification consent**: Separate from marketing communications
- **In-app purchases**: App store billing vs. direct billing rules

### 4.3 Stone AI Tools

Developer/tools platform ToS should additionally include:
- **API usage terms**: Rate limits, authentication, commercial use rights
- **Output attribution requirements**: When users must disclose AI generation
- **Integration responsibilities**: User's obligation for their downstream use
- **SLA terms**: Uptime commitments for paid API access
- **Data processing addendum**: For enterprise/business users

---

## 5. Implementation Checklist

### 5.1 Before Launch

- [ ] Draft ToS using this framework, customized per product
- [ ] Have ToS reviewed by a licensed attorney (NY bar preferred)
- [ ] Implement clickwrap agreement flow (checkbox + "I agree" button)
- [ ] Store timestamped record of each user's ToS acceptance
- [ ] Set up ToS version tracking system
- [ ] Create user-facing ToS summary/FAQ page
- [ ] Ensure ToS is accessible (WCAG 2.1 AA compliant)
- [ ] Configure email notification system for ToS updates

### 5.2 Ongoing Maintenance

- [ ] Review ToS quarterly for regulatory changes
- [ ] Update ToS when adding significant new features
- [ ] Monitor legal developments in AI regulation
- [ ] Track and respond to user ToS-related inquiries
- [ ] Maintain change log of all ToS modifications
- [ ] Re-obtain consent for material changes
- [ ] Annual legal review with counsel

### 5.3 Record-Keeping Requirements

Maintain records of:
- Each version of the ToS with effective dates
- Each user's acceptance (timestamp, IP address, ToS version)
- All notifications sent regarding ToS changes
- Any user disputes related to ToS provisions
- Attorney review correspondence and approvals

---

## 6. Common Legal Pitfalls for AI SaaS Companies

### 6.1 Pitfall: Overpromising AI Capabilities

Never describe your AI as "accurate," "reliable," "expert," or any term that could be construed as a warranty. Use language like "assists," "suggests," "generates," and always pair with disclaimers.

### 6.2 Pitfall: Unclear Content Ownership

The question "who owns AI outputs?" has no settled legal answer. Your ToS should acknowledge this uncertainty rather than make definitive claims that could be challenged. The safest approach: grant users a license to use outputs while retaining rights to the underlying models and systems.

### 6.3 Pitfall: Missing Auto-Renewal Disclosures

NY and many other states have strict auto-renewal disclosure laws. Failure to comply can result in the renewal being unenforceable and the user entitled to a full refund. Always:
- Disclose renewal terms clearly before initial purchase
- Send renewal reminders before charging
- Provide easy online cancellation

### 6.4 Pitfall: Inadequate Data Processing Terms

If you process personal data (you do — Clerk handles auth, Stripe handles payments), your ToS must reference your Privacy Policy and data processing practices. Failure to do so violates GDPR, CCPA, and creates liability.

### 6.5 Pitfall: No AI Safety Provisions

Without explicit AUP provisions against AI misuse, you could be held responsible for harmful AI outputs. Your AUP should specifically address AI-related misuse (jailbreaking, prompt injection, generating harmful content).

### 6.6 Pitfall: Ignoring Platform-Specific Rules

If Best AI is on the App Store, Apple's developer agreement requires specific terms in your ToS. Google Play has similar requirements. Failure to include these terms can result in app removal.

---

## 7. Regulatory Compliance Cross-Reference

| Regulation | Relevant ToS Sections | Key Requirement |
|-----------|----------------------|----------------|
| NY GOL § 5-903 | Payment Terms, Auto-Renewal | Clear renewal disclosure, easy cancellation |
| COPPA | Age Restrictions | Parental consent for under-13 users |
| GDPR Art. 13-14 | Privacy, AI Terms | Data processing transparency |
| CCPA/CPRA | Privacy, Data Terms | Consumer rights disclosure |
| EU AI Act | AI-Specific Terms | AI system transparency, risk classification |
| CAN-SPAM | Communications | Marketing email opt-out |
| ADA Title III | Accessibility | Accessible ToS document |
| FTC Act § 5 | All Sections | No unfair or deceptive practices |
| NY SHIELD Act | Data Security | Reasonable security measures |
| DMCA | Content, IP | Takedown procedures for infringing content |

---

## 8. Template Versioning Strategy

### Version Numbering
- **Major version** (1.0, 2.0): Significant structural changes, new legal requirements
- **Minor version** (1.1, 1.2): Clause additions, clarifications
- **Patch version** (1.1.1): Typo fixes, formatting

### Change Communication Matrix

| Change Type | Notice Required | Method | Lead Time |
|------------|----------------|--------|-----------|
| Major (rights reduction) | Yes | Email + In-app | 30 days |
| Major (rights expansion) | Recommended | Email | 15 days |
| Minor (new features) | Recommended | In-app | 7 days |
| Patch (formatting) | No | None | Immediate |

---

## 9. Enforcement Framework

### 9.1 Violation Response Tiers

**Tier 1 — Warning**: First-time minor violations (e.g., inadvertent AUP violation)
- Automated or manual warning email
- Account flagged for monitoring
- No service interruption

**Tier 2 — Temporary Suspension**: Repeated minor violations or first-time moderate violations
- 24-72 hour account suspension
- Required acknowledgment of violation before restoration
- Documented in account history

**Tier 3 — Permanent Termination**: Severe violations or repeated moderate violations
- Immediate account termination
- No refund for remaining subscription period
- Data retained per legal requirements, then deleted
- IP and email added to ban list

**Tier 4 — Legal Action**: Criminal activity, serious harm, or significant financial damage
- Account terminated
- Law enforcement notification if appropriate
- Legal proceedings initiated if warranted
- Evidence preserved for litigation

---

## 10. Annual Review Calendar

| Month | Review Activity |
|-------|----------------|
| January | Full ToS audit against current regulations |
| March | AI regulation updates review |
| May | Payment and billing terms review (pre-renewal season) |
| July | Mid-year regulatory check |
| September | Privacy and data terms review (pre-holiday traffic) |
| November | Year-end compliance review and next-year planning |

---

*This seed is a framework and educational resource. It does not constitute legal advice. All Terms of Service should be reviewed and approved by a licensed attorney before publication.*
