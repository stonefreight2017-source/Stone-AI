# Business Formation Guide for AI SaaS Companies

## Palace Knowledge Seed — Legal & Compliance Series
### Classification: Critical Business Infrastructure
### Applicable To: Stone AI, Best AI Mobile, Stone AI Tools

---

## 1. Executive Summary

Choosing and forming the right business entity is one of the most consequential decisions for a SaaS founder. The entity type determines personal liability protection, tax treatment, ability to raise capital, operational flexibility, and administrative burden. For an AI SaaS company based in New York State with plans for multiple product lines, the decision between LLC and C-Corp has long-term implications for everything from investor attraction to exit strategy.

This guide covers LLC vs. C-Corp analysis specific to AI SaaS, New York State formation procedures, EIN acquisition, operating agreement templates, registered agent requirements, annual filing obligations, and S-Corp tax election strategy.

---

## 2. LLC vs. C-Corp for AI SaaS

### 2.1 Comparison Matrix

| Factor | LLC | C-Corp | Best for Stone AI |
|--------|-----|--------|------------------|
| **Liability Protection** | Full personal asset protection | Full personal asset protection | Tie |
| **Tax Treatment (Default)** | Pass-through (single taxation) | Double taxation (corp + dividend) | LLC |
| **S-Corp Election** | Available | Available | LLC (simpler) |
| **VC/Institutional Investment** | Difficult (investors want C-Corp) | Standard | C-Corp (if raising) |
| **Stock Options/ESOP** | Complex (units/interests) | Standard (stock options, ISOs) | C-Corp (if hiring) |
| **QSBS Tax Exclusion** | Not available | Available (up to $10M gain excluded) | C-Corp |
| **Administrative Burden** | Lower (no board, fewer formalities) | Higher (board, minutes, resolutions) | LLC |
| **Flexibility** | High (custom operating agreement) | Lower (statutory requirements) | LLC |
| **State Fees (NY)** | $200 filing + publication (~$1,500+) | $125 filing, no publication | C-Corp |
| **Annual Maintenance (NY)** | Biennial filing ($9) + possible LLC fee | Biennial filing ($9) + franchise tax | Depends on income |
| **Exit/Acquisition** | More complex | Standard | C-Corp |
| **Multiple Product Lines** | Easy (single entity or series) | Easy (divisions or subsidiaries) | Tie |
| **Self-Employment Tax** | Subject to SE tax (unless S-Corp) | No SE tax (salary + dividends) | C-Corp or LLC+S-Corp |

### 2.2 Recommendation Framework

**Choose LLC if**:
- Bootstrapping without external investment
- Sole founder or small founding team
- Want maximum tax flexibility (pass-through + S-Corp election)
- Prefer simpler administration
- Not planning VC fundraising in the near term
- Want to minimize startup costs

**Choose C-Corp (Delaware) if**:
- Planning to raise VC or institutional investment
- Planning to offer stock options to employees
- Want QSBS tax benefits (Section 1202 — up to $10M capital gains exclusion)
- Planning for IPO or acquisition exit
- Want the most recognized corporate structure

**Choose C-Corp (NY) if**:
- Same as Delaware C-Corp but don't need Delaware's specialized business courts
- Want to avoid maintaining registration in two states

### 2.3 The Three-Business Structure Question

For Stone AI, Best AI Mobile, and Stone AI Tools, there are three structural approaches:

**Option A: Single Entity, Multiple Products**
- One LLC or Corp operates all three businesses
- Simplest to manage
- Shared liability (problem in one business affects all)
- Single tax return
- Recommended for: Early stage, bootstrapped

**Option B: Parent-Subsidiary Structure**
- Parent holding company (LLC or Corp)
- Each business is a subsidiary (LLC under the parent)
- Liability isolation between businesses
- More complex administration
- Recommended for: Growth stage, different risk profiles

**Option C: Separate Entities**
- Three independent LLCs or Corps
- Maximum liability isolation
- Most administrative burden
- Three tax returns
- Recommended for: When businesses have different investors or risk profiles

**Recommendation for Stone AI**: Start with Option A (single LLC with S-Corp election). As revenue grows and Best AI Mobile launches, evaluate moving to Option B for liability isolation. The single entity keeps things simple while you're building.

---

## 3. New York State LLC Formation

### 3.1 Step-by-Step Formation Process

```
STEP 1: NAME RESERVATION (Optional but recommended)
- Search NY DOS database: https://appext20.dos.ny.gov/corp_public/CORPSEARCH.ENTITY_SEARCH_ENTRY
- Name must include "LLC" or "Limited Liability Company"
- Name must be distinguishable from existing entities
- Reserve name: $20 fee, valid for 60 days
- File: Application for Reservation of Name

STEP 2: FILE ARTICLES OF ORGANIZATION
- File with NY Department of State, Division of Corporations
- Online: https://www.dos.ny.gov/corps/llcfaq.asp
- By mail: NYS Department of State, Division of Corporations,
  One Commerce Plaza, 99 Washington Avenue, Albany, NY 12231
- Filing fee: $200
- Required information:
  (a) LLC name
  (b) County of office (where LLC is located)
  (c) Secretary of State designated as agent for service of process
  (d) Address for forwarding of process
  (e) Effective date (filing date or future date up to 60 days)
  (f) Duration (perpetual unless specified)
  (g) Any other provisions (optional)
- Processing time: 7-14 business days (standard), expedited available

STEP 3: PUBLICATION REQUIREMENT (NY Specific — CRITICAL)
- Within 120 days of formation, publish notice in two newspapers
- One weekly and one daily newspaper
- Publication must be in the county where LLC office is located
- Must publish for six consecutive weeks
- After publication: file Certificate of Publication with DOS ($50 fee)
- Failure to publish: LLC cannot sue in NY courts (can still operate)
- Cost varies by county:
  - Manhattan: $1,000-$1,500+
  - Other NYC boroughs: $800-$1,200
  - Albany County: $200-$500
  - Other counties: $200-$600

  TIP: Form LLC in a cheaper county (e.g., Albany), then register to
  do business in your actual county. Publication is in formation county.
  Some attorneys recommend forming in cheaper counties solely for this reason.

STEP 4: OBTAIN EIN (Federal Tax ID)
- Apply online at IRS.gov: https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online
- Free, immediate issuance
- Required for: bank accounts, tax filing, hiring, payment processing (Stripe)
- Apply as: LLC (single-member or multi-member)
- If S-Corp election planned: still apply as LLC first

STEP 5: DRAFT OPERATING AGREEMENT
- Not filed with the state but legally required in NY
- Governs internal operations, member rights, profit distribution
- See Section 4 below for template

STEP 6: OPEN BUSINESS BANK ACCOUNT
- Required documents: Articles of Organization, EIN letter, Operating Agreement, photo ID
- Separate business account is essential for:
  - Liability protection (piercing corporate veil defense)
  - Tax compliance
  - Payment processing (Stripe business account)
  - Financial tracking

STEP 7: REGISTER FOR STATE TAXES
- NY sales tax: Register with NY Department of Taxation and Finance
  (SaaS is generally taxable in NY)
- NYC specific: Additional business taxes may apply if operating in NYC
- Online registration: https://www.tax.ny.gov/bus/register/

STEP 8: S-CORP ELECTION (Optional — see Section 6)
- File IRS Form 2553 within 75 days of formation
- Also file NY equivalent (CT-6) with NY Tax Department

STEP 9: BUSINESS LICENSES AND PERMITS
- NY State: Generally no state business license required for software
- Local: Check county/city requirements
- Home office: Verify zoning permits home-based business
```

### 3.2 Formation Costs Summary

| Item | Cost | Timeline |
|------|------|----------|
| Name reservation | $20 (optional) | 1 day |
| Articles of Organization | $200 | 7-14 days |
| Publication (varies by county) | $200-$1,500 | 6+ weeks |
| Certificate of Publication | $50 | After publication |
| EIN | Free | Immediate |
| Operating Agreement (self-drafted) | Free | 1-2 days |
| Operating Agreement (attorney) | $500-$2,000 | 1-2 weeks |
| Business bank account | Free-$25/month | 1 day |
| S-Corp election (Form 2553) | Free | 1-2 months processing |
| **Total (budget estimate)** | **$500-$2,000** | **8-12 weeks** |

---

## 4. Operating Agreement

### 4.1 Why It Matters

New York LLC Law § 417 requires every LLC to have an operating agreement. Even for a single-member LLC, the operating agreement:
- Defines ownership and management structure
- Establishes profit distribution rules
- Protects liability shield (courts may pierce the veil without one)
- Sets procedures for major decisions
- Governs what happens if members are added or leave

### 4.2 Operating Agreement Template (Single-Member)

```
OPERATING AGREEMENT OF [COMPANY NAME] LLC

This Operating Agreement ("Agreement") is entered into as of [Date], by
[Founder Name] ("Member"), the sole member of [Company Name] LLC ("Company").

ARTICLE 1: FORMATION AND NAME
1.1 The Company was formed on [Date] by filing Articles of Organization with
    the New York Department of State.
1.2 The name of the Company is [Company Name] LLC.
1.3 The Company's principal office is at [Address].

ARTICLE 2: PURPOSE
2.1 The Company is formed for the purpose of developing, marketing, and
    operating software-as-a-service (SaaS) products, including but not limited
    to artificial intelligence applications, mobile applications, and related
    technology services, and any other lawful business activity.

ARTICLE 3: TERM
3.1 The Company shall have perpetual existence unless dissolved in accordance
    with this Agreement or applicable law.

ARTICLE 4: MEMBERSHIP
4.1 The sole Member of the Company is:
    Name: [Founder Name]
    Address: [Address]
    Membership Interest: 100%
    Capital Contribution: $[Amount]

4.2 Additional members may be admitted only with the written consent of the
    existing Member(s) and execution of an amended Operating Agreement.

ARTICLE 5: MANAGEMENT
5.1 The Company shall be member-managed. The Member shall have full authority
    to manage the business and affairs of the Company.
5.2 The Member may appoint officers, managers, or agents as needed.
5.3 Major decisions requiring Member approval include:
    (a) Selling or disposing of all or substantially all Company assets
    (b) Merging or consolidating the Company
    (c) Incurring debt exceeding $[Amount]
    (d) Admitting new members
    (e) Dissolving the Company
    (f) Amending this Agreement

ARTICLE 6: CAPITAL CONTRIBUTIONS
6.1 The Member has contributed $[Amount] as initial capital.
6.2 No Member shall be required to make additional contributions without consent.
6.3 No interest shall be paid on capital contributions.

ARTICLE 7: ALLOCATIONS AND DISTRIBUTIONS
7.1 All profits and losses shall be allocated to the Member in proportion to
    their membership interest (100%).
7.2 Distributions shall be made at the sole discretion of the Member, subject
    to the Company's ability to meet its obligations.
7.3 [If S-Corp elected]: Distributions shall be made in sufficient amounts to
    cover the Member's tax liability arising from Company income.

ARTICLE 8: TAX MATTERS
8.1 The Company shall be treated as a [disregarded entity / S-Corporation] for
    federal income tax purposes.
8.2 The Member is designated as the Tax Matters Member.
8.3 The Company shall maintain books and records in accordance with [cash/accrual]
    method of accounting.
8.4 The Company's fiscal year shall end on December 31.

ARTICLE 9: BANKING
9.1 The Company shall maintain one or more bank accounts at financial institutions
    selected by the Member.
9.2 Company funds shall not be commingled with personal funds of the Member.

ARTICLE 10: LIMITATION OF LIABILITY AND INDEMNIFICATION
10.1 The Member shall not be personally liable for any debts, obligations, or
     liabilities of the Company solely by reason of being a Member.
10.2 The Company shall indemnify the Member and any manager, officer, or agent
     for actions taken in good faith and in the Company's best interest.

ARTICLE 11: DISSOLUTION
11.1 The Company shall be dissolved upon:
     (a) Written consent of the Member
     (b) Entry of a judicial decree of dissolution
     (c) Any event required by law
11.2 Upon dissolution, Company assets shall be distributed in the following order:
     (a) Payment of debts and obligations
     (b) Setting aside reserves for contingent liabilities
     (c) Distribution to the Member

ARTICLE 12: INTELLECTUAL PROPERTY
12.1 All intellectual property created by or for the Company, including but not
     limited to software, AI models, trademarks, trade secrets, and copyrights,
     shall be the sole property of the Company.
12.2 The Member assigns to the Company all right, title, and interest in any
     intellectual property created in connection with Company business.

ARTICLE 13: GENERAL PROVISIONS
13.1 GOVERNING LAW: This Agreement shall be governed by the laws of the State
     of New York.
13.2 AMENDMENTS: This Agreement may be amended only by written instrument
     signed by the Member.
13.3 SEVERABILITY: If any provision is held invalid, the remainder shall
     continue in full force.
13.4 ENTIRE AGREEMENT: This Agreement constitutes the entire agreement among
     the parties regarding the Company.

IN WITNESS WHEREOF, the Member has executed this Agreement as of the date
first written above.

Member: ________________________
Name: [Founder Name]
Date: [Date]
```

---

## 5. Registered Agent Requirements

### 5.1 What a Registered Agent Does

A registered agent receives legal documents (lawsuits, subpoenas, government notices) on behalf of the LLC. In New York, the Secretary of State is automatically designated as agent for service of process in the Articles of Organization, but you must provide a forwarding address.

### 5.2 Options

| Option | Cost | Pros | Cons |
|--------|------|------|------|
| Self (personal address) | Free | No cost | Home address on public record |
| Commercial registered agent | $50-$300/year | Privacy, reliability, compliance alerts | Annual cost |
| Attorney | $200-$500/year | Legal expertise | Higher cost |

**Recommendation**: Use a commercial registered agent service for privacy (keeps home address off public filings) and reliability (never misses a document).

---

## 6. S-Corp Tax Election

### 6.1 Why S-Corp for a SaaS LLC

The S-Corp election (filing IRS Form 2553) allows an LLC to be taxed as an S-Corporation while maintaining LLC legal structure. The primary benefit is self-employment tax savings.

```
EXAMPLE: $150,000 annual profit

WITHOUT S-CORP (Schedule C):
- Self-employment tax (15.3%): $21,068 (on 92.35% of profit)
- Income tax (assume 24% bracket): $36,000
- Total tax: ~$57,068

WITH S-CORP:
- Reasonable salary: $80,000
  - Payroll tax (15.3% employer + employee): $12,240
  - Income tax on salary: $19,200
- Distribution: $70,000
  - NO self-employment tax
  - Income tax (24%): $16,800
- Total tax: ~$48,240

SAVINGS: ~$8,828/year

The savings increase as profit increases. At $200K profit, savings can
exceed $15,000/year.
```

### 6.2 S-Corp Requirements

1. **Reasonable Salary**: Must pay yourself a reasonable salary for your role. IRS scrutinizes salaries that are too low relative to profits.
2. **Payroll**: Must run payroll (can use Gusto, ADP, or similar — $40-100/month)
3. **Filing**: File Form 1120-S (S-Corp tax return) + Schedule K-1
4. **Deadlines**: Form 2553 must be filed within 75 days of formation (or by March 15 for calendar year)
5. **State Filing**: NY Form CT-6 for NY S-Corp election

### 6.3 When S-Corp Makes Sense

- Net profit exceeds $40,000-$50,000/year (below this, payroll costs eat the tax savings)
- Founder is actively working in the business
- Business is profitable and distributing cash
- Plan to keep profits rather than reinvest everything

### 6.4 When S-Corp Does NOT Make Sense

- Early stage with little or no profit
- Reinvesting all revenue (no distributions)
- Plan to raise VC (convert to C-Corp first)
- Multiple classes of stock needed (S-Corp allows only one class)

---

## 7. Annual Filing and Compliance Obligations

### 7.1 New York State Requirements

| Obligation | Frequency | Deadline | Cost | Filed With |
|-----------|-----------|----------|------|-----------|
| Biennial Statement | Every 2 years | Anniversary month | $9 | NY DOS |
| NY LLC Publication | Once (within 120 days) | 120 days of formation | $250-$1,500 | County newspapers + NY DOS |
| NY Sales Tax Return | Quarterly or annual | 20th of month after quarter | N/A | NY Tax Dept |
| NYC Unincorporated Business Tax | Annual (if NYC) | March 15 (with extension) | 4% of net income | NYC Finance |
| Annual Report (if C-Corp) | Annual | Anniversary month | Varies | NY DOS |

### 7.2 Federal Requirements

| Obligation | Frequency | Deadline | Filed With |
|-----------|-----------|----------|-----------|
| Form 1040 + Schedule C (if disregarded) | Annual | April 15 | IRS |
| Form 1120-S (if S-Corp) | Annual | March 15 | IRS |
| Form 941 (payroll, if S-Corp) | Quarterly | End of month after quarter | IRS |
| Form W-2 (if S-Corp) | Annual | January 31 | IRS + Employee |
| Form 1099-NEC (contractors) | Annual | January 31 | IRS + Contractor |
| Estimated tax payments | Quarterly | 4/15, 6/15, 9/15, 1/15 | IRS |
| BOI Report (Beneficial Ownership) | Once + updates | Within 90 days of formation | FinCEN |

### 7.3 Beneficial Ownership Information (BOI) Report

As of 2024, the Corporate Transparency Act requires most LLCs and corporations to file a BOI report with FinCEN:
- Report beneficial owners (anyone with 25%+ ownership or substantial control)
- File within 90 days of formation (for new entities)
- Update within 30 days of any changes
- No annual filing — only initial + updates
- Free to file online at https://boiefiling.fincen.gov

**Note**: BOI reporting requirements have been subject to legal challenges. Verify current status before filing.

---

## 8. Tax Planning Considerations

### 8.1 SaaS Revenue Tax Treatment

- SaaS subscription revenue is generally ordinary business income
- NY treats SaaS as taxable for sales tax purposes
- Digital products/services: Sales tax nexus rules vary by state
- Economic nexus: Many states require sales tax collection if >$100K revenue or 200 transactions in the state

### 8.2 Deductible Business Expenses

| Expense | Deductibility | Notes |
|---------|--------------|-------|
| Cloud hosting (Vercel, Neon) | 100% | Ordinary business expense |
| API costs (Anthropic, Clerk, Stripe) | 100% | Ordinary business expense |
| Domain, DNS (Cloudflare) | 100% | Ordinary business expense |
| Home office | Simplified: $5/sq ft up to 300 sq ft | Or actual expenses (proportional) |
| Computer equipment | 100% (Section 179) | Full deduction in year of purchase |
| Software subscriptions | 100% | Ordinary business expense |
| Professional services (legal, accounting) | 100% | Ordinary business expense |
| Trademark filing | Amortize over 15 years | Section 197 intangible |
| Health insurance (self-employed) | 100% above-the-line deduction | If S-Corp: paid through payroll |
| Retirement contributions | Up to limits | SEP-IRA, Solo 401(k) |

### 8.3 Estimated Tax Payment Schedule

| Quarter | Payment Due | Period Covered |
|---------|------------|---------------|
| Q1 | April 15 | Jan 1 – Mar 31 |
| Q2 | June 15 | Apr 1 – May 31 |
| Q3 | September 15 | Jun 1 – Aug 31 |
| Q4 | January 15 (next year) | Sep 1 – Dec 31 |

**Safe harbor**: Pay 100% of prior year's tax liability (110% if AGI > $150K) to avoid underpayment penalties.

---

## 9. Insurance Considerations

| Insurance Type | Purpose | Estimated Cost | Priority |
|---------------|---------|---------------|----------|
| General Liability | Covers bodily injury, property damage claims | $400-$1,000/year | High |
| Professional Liability (E&O) | Covers claims of negligence, errors in service | $500-$2,000/year | High |
| Cyber Liability | Covers data breaches, cyber incidents | $500-$3,000/year | Critical |
| Media Liability | Covers IP infringement, defamation in content | $500-$1,500/year | Medium |
| Directors & Officers (D&O) | Covers management decisions (if corp) | $1,000-$5,000/year | If C-Corp |
| Workers' Comp | Required if employees | Varies | If hiring |
| Business Property | Covers equipment loss/damage | $300-$800/year | Medium |

**Priority for AI SaaS**: Cyber liability insurance is the highest priority. A data breach or AI incident could have significant financial consequences.

---

## 10. Multi-Business Entity Planning

### 10.1 Phase 1: Single Entity (Current)

```
[Founder]
    └── Stone AI LLC (S-Corp election)
        ├── Product: Stone AI (stone-ai.net)
        ├── Product: Best AI Mobile (planned)
        └── Product: Stone AI Tools (tools.stone-ai.net, planned)
```

### 10.2 Phase 2: Holding Company (When Revenue Justifies)

```
[Founder]
    └── [Holding Company] LLC
        ├── Stone AI LLC (SaaS platform)
        ├── Best AI Mobile LLC (mobile app)
        └── Stone AI Tools LLC (developer tools)
```

**Trigger for Phase 2**: When any product has materially different risk profile, different investors, or annual revenue exceeds $500K.

### 10.3 Phase 3: C-Corp Conversion (If Raising Capital)

```
[Founder]
    └── [Company Name] Inc. (Delaware C-Corp)
        ├── Stone AI (division or subsidiary)
        ├── Best AI Mobile (division or subsidiary)
        └── Stone AI Tools (division or subsidiary)
```

**Trigger for Phase 3**: Seeking institutional investment, planning stock option grants, or exit planning.

---

*This guide provides business formation information for educational purposes. It does not constitute legal or tax advice. Consult a licensed attorney and CPA for formation and tax decisions specific to your situation.*
