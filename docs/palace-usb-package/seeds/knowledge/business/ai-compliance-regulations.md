# AI Compliance Regulations — Comprehensive Guide

## Palace Knowledge Seed — Legal & Compliance Series
### Classification: Critical Regulatory Intelligence
### Applicable To: Stone AI, Best AI Mobile, Stone AI Tools

---

## 1. Executive Summary

Artificial intelligence regulation is the fastest-moving area of technology law globally. The EU AI Act became the first comprehensive AI law in 2024, US states are rapidly passing their own AI regulations, and federal agencies are increasing enforcement around AI transparency and fairness. For an AI SaaS company operating in this environment, compliance is not optional — it is a competitive advantage and an existential requirement.

This seed maps the complete regulatory landscape affecting Stone AI's operations: the EU AI Act's risk-based classification system, US state AI laws, federal agency guidance, AI transparency requirements, bias disclosure obligations, automated decision-making rules, and content labeling requirements. It provides actionable compliance steps for each regulation.

**Critical Timeline**: The EU AI Act's provisions are phasing in between 2024 and 2027. US state AI laws are being enacted and amended continuously. Compliance is an ongoing process, not a one-time event.

---

## 2. EU AI Act — Comprehensive Analysis

### 2.1 Overview and Structure

The EU AI Act (Regulation (EU) 2024/1689) is the world's first comprehensive AI law. It applies to any AI system that is placed on the market in or used within the EU, regardless of where the provider is based. This means Stone AI is subject to the EU AI Act if any EU resident uses the service.

**Key Principle**: Risk-based classification. The level of regulation scales with the level of risk the AI system poses.

### 2.2 Risk Categories

#### Unacceptable Risk (BANNED)
These AI practices are prohibited entirely:

| Prohibited Practice | Relevance to Stone AI |
|---------------------|----------------------|
| Social scoring by public authorities | Not applicable |
| Real-time remote biometric identification in public spaces (law enforcement) | Not applicable |
| Exploitation of vulnerabilities (age, disability, social situation) | Must ensure AI does not manipulate vulnerable users |
| Subliminal manipulation causing harm | Must ensure AI responses don't contain manipulative patterns |
| Emotion recognition in workplace/education | Not applicable (no emotion recognition features) |
| Untargeted scraping for facial recognition databases | Not applicable |
| Biometric categorization for sensitive attributes | Not applicable |
| Predictive policing based solely on profiling | Not applicable |

**Stone AI Compliance**: None of Stone AI's features fall into the unacceptable risk category. However, the AUP must prohibit users from using AI agents to attempt any of these banned practices.

#### High-Risk AI Systems
These require extensive compliance obligations:

| High-Risk Category | Examples | Stone AI Relevance |
|-------------------|----------|-------------------|
| Biometric identification | Facial recognition, fingerprinting | Not applicable |
| Critical infrastructure | Energy, water, transport management | Not applicable |
| Education | Student scoring, admission decisions | LOW — if education agents provide grading/assessment |
| Employment | Recruitment, performance evaluation, termination | LOW — if HR agents assist with hiring decisions |
| Essential services | Credit scoring, insurance, social benefits | LOW — if finance agents provide credit-related advice |
| Law enforcement | Risk assessment, evidence evaluation | Not applicable |
| Migration/asylum | Application processing, risk assessment | Not applicable |
| Justice/democracy | Sentencing assistance, legal research | LOW — if legal agents provide case analysis |

**Stone AI Assessment**: Stone AI's AI agents are general-purpose assistants, not specialized systems making consequential decisions in high-risk domains. However, if users use agents for high-risk purposes (e.g., using a finance agent to make credit decisions), the system should include disclaimers and not present outputs as authoritative decisions.

#### Limited Risk (TRANSPARENCY OBLIGATIONS)
This is the most relevant category for Stone AI. AI systems that interact with people must meet transparency requirements:

```
TRANSPARENCY OBLIGATIONS FOR LIMITED RISK AI:

1. DISCLOSURE: Users must be informed that they are interacting with an AI system
   (not a human). Stone AI compliance: AI agents and Bestie are clearly labeled as AI.

2. CONTENT MARKING: AI-generated content must be labeled as AI-generated when it
   could be mistaken for human-created content. Stone AI compliance: All AI outputs
   should carry appropriate labeling.

3. DEEPFAKE DISCLOSURE: AI-generated or manipulated images, audio, or video must be
   disclosed. Stone AI compliance: If any visual/audio generation features are added,
   outputs must be labeled.

4. EMOTION RECOGNITION: If the system detects emotions, users must be informed.
   Stone AI compliance: Not currently applicable.
```

#### Minimal Risk
AI systems with minimal risk (e.g., spam filters, video game AI) have no specific obligations under the EU AI Act but may voluntarily adopt codes of practice.

### 2.3 General-Purpose AI (GPAI) Models

The EU AI Act has specific provisions for General-Purpose AI models, which are directly relevant to Stone AI's use of models like Qwen and Claude.

**GPAI Provider Obligations**:
1. Maintain technical documentation
2. Provide information and documentation to downstream deployers
3. Comply with EU copyright law (training data)
4. Publish a sufficiently detailed summary of training data

**GPAI with Systemic Risk** (models trained with >10^25 FLOPs):
- Additional model evaluation requirements
- Adversarial testing
- Track and report serious incidents
- Ensure cybersecurity protections

**Stone AI's Position**: Stone AI is a "deployer" of GPAI models (Qwen, Claude), not a provider. Deployers have lighter obligations but must:
- Use AI systems in accordance with provider instructions
- Implement appropriate technical and organizational measures
- Monitor AI system operation
- Report serious incidents
- Conduct fundamental rights impact assessments (for high-risk uses)

### 2.4 Compliance Timeline

| Date | Requirement |
|------|-------------|
| August 2024 | EU AI Act enters into force |
| February 2025 | Prohibited AI practices banned |
| August 2025 | GPAI model rules apply, governance structures active |
| August 2026 | High-risk AI system requirements apply |
| August 2027 | Full enforcement for all provisions |

### 2.5 Penalties

| Violation | Maximum Fine |
|-----------|-------------|
| Prohibited AI practices | €35 million or 7% of global annual turnover |
| High-risk system non-compliance | €15 million or 3% of global annual turnover |
| Providing incorrect information | €7.5 million or 1% of global annual turnover |
| SME/startup reduced fines | Lower of absolute amount or percentage (whichever is more favorable) |

---

## 3. US Federal AI Regulation

### 3.1 Executive Orders and Agency Guidance

The US has taken a sector-specific approach to AI regulation rather than a comprehensive law.

**Key Federal Actions**:

| Action | Agency | Relevance |
|--------|--------|-----------|
| Executive Order 14110 (2023) on Safe AI | White House | Sets government AI safety standards, influences industry norms |
| FTC AI Enforcement | FTC | Prohibits deceptive AI practices, requires truth in advertising about AI capabilities |
| EEOC AI Guidance | EEOC | AI in employment decisions must not discriminate |
| SEC AI Disclosure | SEC | Public companies must disclose material AI risks |
| NIST AI Risk Management Framework | NIST | Voluntary framework for AI risk management |
| Copyright Office AI Guidance | Copyright Office | AI-generated works not copyrightable without human authorship |
| FDA AI/ML Software | FDA | AI in medical devices — not directly applicable |

### 3.2 FTC Enforcement Actions

The FTC has been the most active federal AI enforcer. Key enforcement themes:

1. **Deceptive AI Claims**: Don't overclaim what your AI can do. If you say it's "accurate" or "reliable," you may need evidence to support that.

2. **Algorithmic Discrimination**: AI that produces discriminatory outcomes violates Section 5 of the FTC Act (unfair or deceptive practices).

3. **Data Minimization**: Only collect data necessary for AI to function. Excessive data collection violates FTC privacy principles.

4. **AI Transparency**: Disclose when users are interacting with AI. Disclose how AI makes decisions that affect users.

5. **Algorithmic Disgorgement**: The FTC has ordered companies to destroy AI models trained on improperly collected data. This is a nuclear enforcement option.

**Stone AI Compliance**:
- Never claim AI outputs are "accurate," "reliable," or "expert" without qualification
- Include clear AI disclaimers
- Minimize data collection for AI processing
- Disclose AI interaction clearly
- Maintain clean data practices for AI training

### 3.3 NIST AI Risk Management Framework (AI RMF)

The NIST AI RMF is voluntary but increasingly referenced by regulators and courts. Its four core functions:

1. **GOVERN**: Establish AI governance structures, policies, and accountability
2. **MAP**: Identify and categorize AI risks in context
3. **MEASURE**: Analyze and assess identified AI risks
4. **MANAGE**: Prioritize and respond to AI risks

**Stone AI Implementation**:
- Establish internal AI governance (the Three-Headed Monster structure naturally serves this)
- Document AI risks for each agent and feature
- Implement AI output monitoring for quality and safety
- Create response procedures for AI incidents

---

## 4. US State AI Laws

### 4.1 Colorado AI Act (SB 24-205)

**Effective**: February 1, 2026

**Key Requirements**:
- Applies to "high-risk AI systems" that make or substantially factor into consequential decisions
- Consequential decisions: education, employment, financial services, healthcare, housing, insurance, legal services, government services
- Developers and deployers must use "reasonable care" to protect consumers from algorithmic discrimination
- Deployers must: provide notice, describe AI system's purpose, provide opportunity for human review, provide appeal process

**Stone AI Impact**: Medium — if agents assist with employment, financial, or legal decisions, those interactions may qualify as high-risk.

### 4.2 Illinois AI Video Interview Act

**Requires**: Employers using AI to analyze video interviews must notify applicants, explain AI use, obtain consent, limit sharing, and destroy video within 30 days of applicant's request.

**Stone AI Impact**: Low — unless enterprise customers use the platform for video-related HR.

### 4.3 New York City Local Law 144 (Automated Employment Decision Tools)

**Requires**: Employers using AEDT must conduct annual bias audits, publish results, and notify candidates.

**Stone AI Impact**: Low-medium — if NYC-based businesses use agents for employment-related tasks.

### 4.4 California AI Transparency Act (SB 942)

**Effective**: January 1, 2026

**Key Requirements**:
- AI providers with over 1 million monthly users must provide AI detection tools
- Must include manifest (visible) and latent (metadata) disclosures in AI-generated content
- Applies to text, image, audio, and video content
- Must provide free AI detection tools

**Stone AI Impact**: LOW currently (under 1 million users), but compliance preparation is wise.

### 4.5 California AB 2013 (AI Training Data Transparency)

**Effective**: January 1, 2026

**Requires**: Developers of AI systems must post on their website a summary of data used to train the AI, including data sources, whether it includes personal information, and how data was collected.

**Stone AI Impact**: Medium — as a deployer using third-party models, you should ensure Anthropic and Qwen model providers comply and reference their disclosures.

### 4.6 Texas Responsible AI Governance Act (HB 1709)

**Effective**: September 1, 2025

**Key Requirements**:
- Deployers of high-risk AI must implement risk management policies
- Must conduct impact assessments
- Must provide notice to individuals affected by high-risk AI decisions
- Attorney General enforcement

**Stone AI Impact**: Medium — Texas users using agents for consequential decisions.

### 4.7 Emerging State Legislation Tracking

| State | Bill | Status | Key Focus |
|-------|------|--------|-----------|
| Connecticut | SB 2 | Enacted 2024 | AI in employment, insurance |
| Virginia | HB 2094 | Pending | Comprehensive AI governance |
| Massachusetts | HD 4139 | Pending | AI transparency and accountability |
| Washington | SB 5838 | Pending | AI in public services |
| New York State | Multiple | Pending | Various AI regulation bills |
| Maryland | HB 1264 | Pending | AI discrimination prevention |
| New Jersey | A4947 | Pending | AI impact assessments |

---

## 5. AI Transparency Requirements

### 5.1 Universal Transparency Principles

Regardless of specific regulations, the following transparency measures are emerging as baseline requirements across jurisdictions:

```
MINIMUM AI TRANSPARENCY REQUIREMENTS:

1. AI IDENTIFICATION: Clearly disclose that content is generated by or with AI.
   Implementation: Label all AI agent responses, Bestie interactions, and generated
   content with clear AI indicators.

2. AI CAPABILITY DISCLOSURE: Accurately describe what the AI can and cannot do.
   Implementation: Agent descriptions should accurately reflect capabilities and
   limitations.

3. DATA USE DISCLOSURE: Explain how user data is used in AI processing.
   Implementation: Privacy policy AI section (see privacy-policy-framework.md).

4. DECISION EXPLANATION: When AI influences a decision, explain how.
   Implementation: Provide reasoning or context for agent recommendations when
   they touch consequential domains.

5. HUMAN OVERSIGHT: Disclose availability of human review/override.
   Implementation: Make clear how users can escalate beyond AI or request human
   support.

6. MODEL INFORMATION: Disclose which AI models power features (at a general level).
   Implementation: Mention in technical documentation that the service uses a
   combination of proprietary and third-party AI models.
```

### 5.2 Content Labeling Requirements

```
AI CONTENT LABELING MATRIX:

| Content Type | Labeling Requirement | Implementation |
|-------------|---------------------|----------------|
| Text responses | "AI-generated" indicator | UI label on all AI responses |
| Recommendations | "AI-suggested" indicator | Label on agent recommendations |
| Automated actions | "Automated" indicator | Label on any auto-triggered features |
| Forum AI content | Clear AI attribution | Prevent AI content in forums without label |
| Exported content | Metadata label | Include AI generation metadata in exports |
| API responses | Header flag | X-AI-Generated: true header |
```

### 5.3 Model Card Requirements

The EU AI Act and industry best practices require documentation of AI systems in the form of "model cards" or system documentation:

```
MODEL CARD TEMPLATE:

Model/System Name: [Agent Name / Feature Name]
Version: [X.X]
Last Updated: [Date]

PURPOSE:
- Intended use cases
- NOT intended for (out-of-scope uses)

ARCHITECTURE:
- Base model(s) used (e.g., Qwen 2.5 32B, Claude Sonnet)
- Fine-tuning or customization applied
- System prompt approach

PERFORMANCE:
- Evaluation metrics
- Known accuracy limitations
- Benchmark results (if available)

LIMITATIONS:
- Known failure modes
- Bias considerations
- Domain limitations
- Language limitations

DATA:
- Training data summary (refer to model provider)
- Evaluation data description
- No personal data used in customization

ETHICAL CONSIDERATIONS:
- Potential for misuse
- Mitigation measures implemented
- Monitoring approach

MAINTENANCE:
- Update frequency
- Feedback incorporation process
- Incident reporting channel
```

---

## 6. Bias Disclosure and Fairness Requirements

### 6.1 Regulatory Requirements for Bias

| Regulation | Bias Requirement |
|-----------|-----------------|
| EU AI Act | High-risk AI must undergo bias testing; document and mitigate bias |
| FTC Act | AI causing discriminatory outcomes = unfair practice |
| EEOC Guidance | AI in employment must not discriminate on protected characteristics |
| Colorado AI Act | Reasonable care to avoid algorithmic discrimination |
| NYC LL 144 | Annual bias audit for employment AI |
| NIST AI RMF | Bias identification and management as core function |

### 6.2 Bias Monitoring Framework

```
BIAS MONITORING FOR STONE AI:

1. INPUT BIAS: Monitor whether certain demographic groups receive different quality
   of AI responses. Track response quality across user segments.

2. OUTPUT BIAS: Review AI outputs for biased language, stereotypes, or discriminatory
   content. Implement automated bias detection in responses.

3. ACCESS BIAS: Ensure AI features are equally accessible across subscription tiers
   without discriminatory impact on protected groups.

4. FEEDBACK BIAS: Monitor whether user feedback mechanisms introduce bias into AI
   improvement processes.

5. DOCUMENTATION: Maintain records of bias testing, results, and mitigation actions.

6. REPORTING: Prepare annual bias assessment reports (required by some regulations,
   best practice for all).
```

### 6.3 Bias Testing Methodology

```
BIAS TESTING PROTOCOL:

Phase 1: Test Set Development
- Create test prompts covering sensitive topics (race, gender, age, disability,
  religion, national origin, sexual orientation)
- Include prompts in multiple languages
- Cover all agent specialties

Phase 2: Response Analysis
- Run test prompts through all AI models
- Analyze responses for differential treatment
- Check for stereotypes, offensive content, or exclusionary language
- Compare response quality across demographic contexts

Phase 3: Mitigation
- Update system prompts to address identified biases
- Implement output filtering for biased content
- Add safety layers for sensitive topics

Phase 4: Documentation
- Record all test results
- Document mitigation actions taken
- Track bias metrics over time
- Publish transparency report (if required by regulation)
```

---

## 7. Automated Decision-Making Rules

### 7.1 GDPR Article 22

```
GDPR AUTOMATED DECISION-MAKING RULES:

Right: Users have the right not to be subject to decisions based solely on
automated processing that produce legal or similarly significant effects.

WHEN IT APPLIES:
- The decision is solely automated (no human involvement)
- The decision produces legal effects (contracts, rights) OR
- Similarly significantly affects the individual (employment, credit, insurance)

EXCEPTIONS (where automated decisions ARE allowed):
- Necessary for a contract
- Authorized by EU/member state law
- Based on explicit consent

SAFEGUARDS REQUIRED (even with exceptions):
- Right to obtain human intervention
- Right to express their point of view
- Right to contest the decision
- Explanation of the logic involved

STONE AI IMPLEMENTATION:
Stone AI's AI agents provide ASSISTANCE and SUGGESTIONS. They do not make binding
decisions on behalf of users. To maintain this status:
- Never frame AI outputs as final decisions
- Always include "this is AI-generated assistance" language
- Provide clear pathways for human review
- Do not automate actions with legal consequences without human confirmation
```

### 7.2 US Automated Decision-Making Requirements

Various US states are implementing automated decision-making requirements:

| Requirement | Jurisdictions | Stone AI Action |
|------------|---------------|-----------------|
| Notice of automated decision | CO, CT, TX, NYC | Disclose AI involvement in consequential contexts |
| Right to opt out | CO, CT, VA | Provide human alternative for consequential decisions |
| Impact assessment | CO, TX | Conduct and document assessments |
| Bias audit | NYC (employment) | Annual audit if employment-related |
| Explanation right | CO, CT | Explain AI reasoning when requested |
| Human review right | CO, CT, TX | Provide human escalation path |

---

## 8. Industry-Specific AI Regulations

### 8.1 Financial Services AI

If Stone AI agents provide financial advice or analysis:
- SEC: AI investment advice may require investment adviser registration
- CFPB: AI in lending decisions must comply with fair lending laws (ECOA, Fair Housing Act)
- State regulators: Financial advice AI may need state-specific licensing

**Mitigation**: Include prominent disclaimers that financial agent outputs are not financial advice and should not replace professional financial advisors.

### 8.2 Healthcare AI

If Stone AI agents provide health-related information:
- FDA: AI providing clinical decision support may be regulated as a medical device
- HIPAA: If processing protected health information, HIPAA compliance required
- State medical practice acts: AI cannot practice medicine

**Mitigation**: Include disclaimers that health agent outputs are informational only and not medical advice. Never collect or process PHI without HIPAA compliance.

### 8.3 Legal Services AI

If Stone AI agents provide legal information:
- State bar unauthorized practice of law (UPL) rules
- AI cannot provide "legal advice" — only "legal information"
- Must clearly distinguish between information and advice

**Mitigation**: Prominent disclaimers on legal-related agents. "This is legal information, not legal advice. Consult an attorney for advice specific to your situation."

---

## 9. Compliance Action Plan for Stone AI

### 9.1 Immediate Actions (Current)

1. **AI Labeling**: Ensure all AI interactions are clearly labeled as AI-generated
2. **Disclaimers**: Implement domain-specific disclaimers (financial, legal, medical, etc.)
3. **AUP Update**: Prohibit high-risk uses in acceptable use policy
4. **Privacy Policy**: Add AI-specific data processing disclosures
5. **Transparency**: Publish general information about AI models used

### 9.2 Short-Term (Next 6 Months)

1. **Bias Testing**: Conduct initial bias assessment across all agents
2. **Model Documentation**: Create basic model cards for each agent category
3. **DSAR Capability**: Implement ability to export and delete AI conversation data
4. **Cookie Consent**: Implement GDPR-compliant consent management
5. **Impact Assessment**: Conduct initial AI impact assessment

### 9.3 Medium-Term (6-12 Months)

1. **Bias Monitoring**: Implement ongoing bias monitoring system
2. **Incident Response**: Create AI-specific incident response procedures
3. **Transparency Report**: Publish first AI transparency report
4. **International Compliance**: Map compliance obligations per jurisdiction
5. **Vendor Compliance**: Ensure all AI model providers meet compliance requirements

### 9.4 Ongoing

1. **Regulatory Monitoring**: Track new AI regulations (see regulatory-monitoring-system.md)
2. **Quarterly Reviews**: Review compliance posture quarterly
3. **Training**: Keep team updated on AI regulation developments
4. **Documentation**: Maintain comprehensive compliance documentation
5. **Legal Review**: Annual legal review of AI compliance

---

## 10. Compliance Documentation Requirements

### 10.1 Required Records

| Document | Requirement Source | Update Frequency |
|----------|-------------------|-----------------|
| AI System Inventory | EU AI Act | Quarterly |
| Risk Assessment | EU AI Act, State Laws | Annual + on change |
| Bias Testing Results | EU AI Act, State Laws | Annual |
| Model Cards | EU AI Act, Industry Practice | Per model update |
| Data Processing Records | GDPR Art. 30 | Continuous |
| Impact Assessments | EU AI Act, State Laws | Annual + on change |
| Incident Reports | EU AI Act | As needed |
| Transparency Reports | Industry Practice | Annual |
| Compliance Audit Results | Internal | Quarterly |
| Training Records | EU AI Act | Per training event |

---

*This seed provides regulatory intelligence as of early 2026. AI regulation is evolving rapidly. Monitor regulatory developments continuously using the framework in regulatory-monitoring-system.md. This is not legal advice — consult qualified legal counsel for compliance decisions.*
