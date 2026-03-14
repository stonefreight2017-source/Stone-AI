# Employment and Contractor Law for AI SaaS Companies

## Palace Knowledge Seed — Legal & Compliance Series
### Classification: Critical Legal Infrastructure
### Applicable To: Stone AI, Best AI Mobile, Stone AI Tools

---

## 1. Executive Summary

As the Three-Headed Monster grows, hiring decisions carry significant legal consequences. Misclassifying a worker as an independent contractor when they should be an employee is one of the most expensive mistakes a startup can make — it triggers back taxes, penalties, benefits liability, and potential lawsuits. New York State has some of the strictest worker classification laws in the country.

This seed covers the legal framework for hiring employees versus contractors, New York-specific labor laws, contractor agreement drafting, intellectual property assignment, and compliance requirements for a solo founder scaling a multi-business operation.

---

## 2. Employee vs. Independent Contractor Classification

### 2.1 Why Classification Matters

```
If you misclassify an employee as a contractor:

Federal consequences:
- Back payment of FICA taxes (employer's share: 7.65%)
- Back payment of FUTA taxes
- IRS penalties: up to $50 per unfiled W-2 + percentage of wages
- Potential fraud penalties if deemed willful

New York State consequences:
- Back payment of state unemployment insurance
- Back payment of workers' compensation insurance
- NY Department of Labor penalties: $50,000+ per instance
- NY Attorney General enforcement action
- Personal liability for the founder

Worker consequences:
- Worker gains right to overtime, benefits, minimum wage
- Worker gains right to unemployment insurance
- Worker gains right to workers' compensation
- Worker gains protection under anti-discrimination laws
```

### 2.2 The IRS 20-Factor Test

The IRS evaluates 20 factors grouped into three categories:

```typescript
interface WorkerClassificationAnalysis {
  // Behavioral Control: Does the company control HOW work is done?
  behavioralControl: {
    instructionsGiven: boolean;      // Detailed instructions = employee
    trainingProvided: boolean;       // Company-provided training = employee
    evaluationSystem: boolean;       // Performance reviews = employee
    workProcessControlled: boolean;  // Company dictates methods = employee
  };

  // Financial Control: Does the company control the business aspects?
  financialControl: {
    significantInvestment: boolean;  // Worker invests own tools = contractor
    unreimbursedExpenses: boolean;   // Worker pays own expenses = contractor
    opportunityForProfit: boolean;   // Can earn more through effort = contractor
    servicesOnMarket: boolean;       // Serves other clients = contractor
    paidByProject: boolean;          // Flat fee per project = contractor
  };

  // Type of Relationship: What is the nature of the relationship?
  relationship: {
    writtenContract: boolean;        // Having a contract alone doesn't determine
    benefits: boolean;               // Benefits provided = employee
    permanency: boolean;             // Ongoing relationship = employee
    keyActivity: boolean;            // Core business function = employee
    integralToOps: boolean;          // Part of daily operations = employee
  };

  classify(): 'employee' | 'contractor' | 'ambiguous' {
    // This is a TOTALITY OF CIRCUMSTANCES test
    // No single factor is determinative
    // When in doubt: employee is the safer classification
  }
}
```

### 2.3 New York's ABC Test (Strictest Standard)

New York uses the ABC Test for unemployment insurance purposes. Under this test, a worker is an EMPLOYEE unless ALL THREE conditions are met:

```
A) The worker is FREE FROM CONTROL AND DIRECTION in performing the work,
   both under the contract and in fact.

B) The service is performed OUTSIDE the usual course of business
   of the hiring entity, or is performed outside all places
   of business of the hiring entity.

C) The worker is CUSTOMARILY ENGAGED IN an independently established
   trade, occupation, or business of the same nature as the work performed.

ALL THREE must be true. Failing any one = EMPLOYEE.
```

**Practical examples for Stone AI**:

```
Scenario: Hiring a developer to build Stone AI features

A) Free from control? If you assign tasks, set deadlines, require
   specific hours, attend meetings → FAILS A → Employee

B) Outside usual course of business? Software development IS
   Stone AI's core business → FAILS B → Employee

C) Independently established? If developer has their own LLC,
   other clients, own tools → PASSES C

Result: FAILS B → Worker is an EMPLOYEE for NY purposes,
even if they pass A and C.

Scenario: Hiring a graphic designer for a one-time logo

A) Free from control? Designer chooses their own tools, schedule,
   methods → PASSES A

B) Outside usual course? Logo design is NOT Stone AI's core
   business (AI SaaS is) → PASSES B

C) Independently established? Designer has own studio, portfolio,
   other clients → PASSES C

Result: PASSES all three → Can be classified as CONTRACTOR
```

### 2.4 Safe Contractor Relationships

```typescript
const safeContractorCharacteristics = {
  // Signs that contractor classification is safe:
  strongIndicators: [
    'Has their own business entity (LLC, Corp)',
    'Has multiple clients (not dependent on you)',
    'Sets their own schedule and hours',
    'Uses their own tools and equipment',
    'Invoices for completed deliverables (not hours)',
    'Has their own website/portfolio',
    'Carries their own insurance',
    'Files their own taxes as a business',
  ],

  // Signs that contractor classification is risky:
  riskIndicators: [
    'Works exclusively for you',
    'Uses your equipment/tools/email',
    'Follows your schedule/hours',
    'Receives ongoing assignments (not discrete projects)',
    'Is integral to your core business operations',
    'Receives training from you',
    'Is paid regularly (weekly/monthly) vs. per project',
    'Cannot delegate work to others',
  ],
};
```

---

## 3. New York Labor Laws

### 3.1 Key NY Employment Requirements

```typescript
const nyLaborRequirements = {
  minimumWage: {
    nyc: 16.50,           // Per hour (2026)
    longIsland: 16.50,
    westchester: 16.50,
    restOfState: 15.50,
    tipped: {
      minimumCash: 11.00, // Must reach full minimum with tips
    },
  },

  overtime: {
    threshold: 40,         // Hours per week
    rate: 1.5,             // 1.5x regular rate
    exemptSalaryThreshold: {
      nyc: 1200,           // Per week (2026 estimate)
      restOfState: 1064.25,
    },
    // To be exempt from overtime, must meet BOTH:
    // 1. Salary above threshold
    // 2. Duties test (executive, administrative, professional, or computer)
  },

  paidFamilyLeave: {
    duration: '12 weeks',
    payRate: '67% of average weekly wage (capped)',
    eligibleAfter: '26 consecutive weeks of employment',
    fundedBy: 'employee payroll deductions',
  },

  sickLeave: {
    nyc: {
      accrual: '1 hour per 30 hours worked',
      maxUsage: '56 hours per year (5-99 employees)',
      paid: true,
    },
    nyState: {
      accrual: '1 hour per 30 hours worked',
      maxUsage: '40 hours per year (1-4 employees, <$1M net income)',
      paid: 'depends on employer size and income',
    },
  },

  payFrequency: {
    manual: 'bi-weekly (every two weeks)',
    clerical: 'semi-monthly',
    // Must pay within 7 days of end of pay period
  },

  notices: {
    wageNotice: {
      // NY Wage Theft Prevention Act
      required: 'at time of hire',
      contents: ['pay rate', 'pay frequency', 'overtime rate',
                 'employer name/address/phone', 'allowances'],
      languages: 'employee\'s primary language',
      acknowledgement: 'signed by employee',
    },
    payStub: {
      required: 'every pay period',
      contents: ['hours worked', 'rate', 'gross/net pay',
                 'deductions', 'allowances'],
    },
  },

  antiDiscrimination: {
    // NY Human Rights Law (one of the broadest in the US)
    protectedClasses: [
      'age', 'race', 'creed', 'color', 'national origin',
      'sexual orientation', 'gender identity', 'military status',
      'sex', 'disability', 'marital status', 'familial status',
      'domestic violence victim status', 'predisposing genetic characteristics',
      'prior arrest/conviction record', 'reproductive health decisions',
    ],
    appliesToEmployersOf: 1, // NY applies to ALL employers (even 1 employee)
  },
};
```

### 3.2 NY Freelance Isn't Free Act

This New York City law provides protections for freelancers (independent contractors):

```typescript
const freelanceIsntFreeAct = {
  applicableTo: 'freelance workers in NYC earning $800+ from a single hiring party',
  requirements: {
    writtenContract: {
      required: true,
      mustInclude: [
        'Names and addresses of both parties',
        'Itemization of services to be provided',
        'Value of services',
        'Rate and method of compensation',
        'Date payment is due (or mechanism to determine)',
      ],
    },
    timelyPayment: {
      deadline: '30 days after completion (unless contract specifies earlier)',
      penaltyForLatePayment: 'double damages + attorney\'s fees',
    },
    antiRetaliation: {
      protects: 'freelancer who asserts rights under the law',
      penalty: 'damages equal to the value of the contract',
    },
  },

  // Stone AI compliance:
  compliance: {
    allContractorsHaveWrittenAgreements: true,
    paymentTermsClearlDefined: true,
    invoiceProcessWithin30Days: true,
  },
};
```

---

## 4. Contractor Agreements

### 4.1 Essential Contract Elements

```typescript
interface ContractorAgreement {
  // Parties
  parties: {
    company: {
      name: 'Stone AI LLC', // Or appropriate entity
      address: string;
      representative: string;
    };
    contractor: {
      name: string;
      businessName?: string; // LLC/Corp if applicable
      address: string;
      ein?: string; // Employer ID number
    };
  };

  // Scope of Work
  scope: {
    description: string;          // Detailed description of deliverables
    deliverables: string[];       // Specific items to be delivered
    timeline: {
      startDate: Date;
      endDate: Date;
      milestones?: { date: Date; deliverable: string }[];
    };
    acceptanceCriteria: string;   // How "done" is defined
  };

  // Compensation
  compensation: {
    type: 'fixed_fee' | 'hourly' | 'milestone';
    amount: number;
    currency: 'USD';
    paymentSchedule: string;      // e.g., "Net 30 upon invoice"
    expenses: {
      reimbursable: boolean;
      preApprovalRequired: boolean;
      maxWithoutApproval: number;
    };
  };

  // Critical Clauses
  ipAssignment: IPAssignment;
  confidentiality: ConfidentialityClause;
  termination: TerminationClause;
  indemnification: IndemnificationClause;
  governingLaw: 'State of New York';
  disputeResolution: 'Arbitration' | 'Litigation';
}
```

### 4.2 Intellectual Property Assignment

This is the MOST CRITICAL clause in any contractor agreement. Without it, the contractor may own the IP they create.

```typescript
interface IPAssignment {
  // Work product assignment
  assignment: {
    scope: 'all',                // All work product created under this agreement
    includes: [
      'Source code',
      'Designs and artwork',
      'Documentation',
      'Inventions and discoveries',
      'Trade secrets and know-how',
      'All copyrights, patents, trademarks',
      'All derivative works',
    ];
    timing: 'upon_creation',     // IP transfers immediately, not upon payment
    worldwide: true;
    perpetual: true;
    irrevocable: true;
  };

  // Moral rights waiver (where applicable)
  moralRightsWaiver: {
    waived: true,
    jurisdictions: 'all applicable',
  };

  // Pre-existing IP
  preExistingIP: {
    excluded: true,              // Contractor's existing IP is not assigned
    licensedToCompany: true,     // But company gets license to use it
    listed: 'Exhibit A',        // Must be listed in an exhibit
  };

  // Works for hire (where applicable)
  workForHire: {
    declared: true,
    // Note: "Work for hire" for independent contractors only applies
    // to 9 specific categories under copyright law.
    // Assignment clause is the primary protection.
    fallback: 'assignment clause governs if work-for-hire fails',
  };

  // Cooperation
  cooperation: {
    furtherDocuments: true,      // Contractor will sign additional IP docs
    registerIPAssistance: true,  // Contractor assists with filings
    survivalAfterTermination: true,
  };
}
```

**Template IP Assignment Language**:

```
All Work Product created by Contractor in connection with this Agreement
shall be the sole and exclusive property of Company. Contractor hereby
irrevocably assigns to Company all right, title, and interest worldwide
in and to all Work Product, including all intellectual property rights
therein.

To the extent any Work Product is deemed a "work made for hire" under
17 U.S.C. § 101, it is hereby designated as such. To the extent any
Work Product does not qualify as a work made for hire, Contractor
hereby assigns and transfers to Company all right, title, and interest
in and to such Work Product, including all copyrights.

"Work Product" means all inventions, discoveries, designs, code,
documentation, works of authorship, and other materials created by
Contractor in the course of performing services under this Agreement.
```

### 4.3 Confidentiality / NDA

```typescript
interface ConfidentialityClause {
  definition: {
    // What counts as confidential
    includes: [
      'Source code and algorithms',
      'Business plans and strategies',
      'Customer data and user information',
      'Financial information',
      'Technical specifications and architecture',
      'Marketing plans and pricing strategies',
      'API keys, credentials, and security configurations',
      'Any information marked "Confidential"',
    ];
    excludes: [
      'Publicly available information',
      'Information known before this agreement',
      'Information received from third parties without restriction',
      'Information independently developed',
    ];
  };

  obligations: {
    useRestriction: 'only for performing services under this agreement';
    disclosureRestriction: 'no disclosure to any third party';
    securityMeasures: 'reasonable measures to protect confidentiality';
    returnOnTermination: 'all materials returned or destroyed';
  };

  duration: '3 years after termination'; // or 'perpetual for trade secrets'

  specialProvisions: {
    // For Stone AI specifically:
    userDataAccess: 'only if necessary, encrypted, audit logged';
    codeAccess: 'only to assigned repositories';
    credentialAccess: 'temporary, revoked on completion';
    apiKeyAccess: 'scoped, rotated after engagement';
  };
}
```

---

## 5. Hiring Process Compliance

### 5.1 Before Hiring

```typescript
const preHiringChecklist = {
  // Determine classification first
  workerClassification: {
    analyzeWith: 'IRS 20-factor test + NY ABC test',
    documentAnalysis: true,
    legalReview: 'recommended for first hire',
  },

  // Required registrations (if hiring employees)
  employerRegistrations: {
    ein: 'Federal EIN (already have if business registered)',
    nyDol: 'NY Department of Labor employer registration',
    nyWorkersComp: 'Workers compensation insurance',
    nyDisabilityInsurance: 'NY statutory disability insurance',
    paidFamilyLeave: 'Paid family leave coverage',
    suta: 'State unemployment tax account',
  },

  // Required for contractors
  contractorSetup: {
    w9Form: 'Collect W-9 from contractor',
    writtenAgreement: 'Signed contractor agreement',
    scopeDocument: 'Detailed scope of work',
    ipAssignment: 'Signed IP assignment',
    nda: 'Signed confidentiality agreement',
    insuranceVerification: 'Verify contractor has own insurance',
  },
};
```

### 5.2 During Engagement

```typescript
const ongoingCompliance = {
  employees: {
    payroll: {
      frequency: 'bi-weekly minimum (NY)',
      taxWithholding: ['federal income', 'state income', 'city income',
                       'social security', 'medicare', 'SUTA', 'disability'],
      paystubs: 'every pay period with required details',
    },
    records: {
      timeRecords: '6 years (NY requirement)',
      payRecords: '6 years',
      i9Forms: '3 years after hire or 1 year after termination',
      taxDocuments: '4 years minimum',
    },
    ongoingNotices: {
      annualWageNotice: 'required (NY Wage Theft Prevention Act)',
      benefitsNotices: 'as required by plan',
    },
  },

  contractors: {
    invoicing: {
      process: 'contractor submits invoice for completed deliverables',
      payment: 'within 30 days (NYC Freelance Isn\'t Free Act)',
      noTimeTracking: 'do NOT track contractor hours (employee indicator)',
    },
    records: {
      w9: 'keep on file',
      contracts: 'keep for duration + 6 years',
      invoices: 'keep for 7 years (IRS)',
      form1099: 'issue annually if $600+ paid',
    },
    boundaries: {
      // DO NOT do these with contractors (creates employee relationship):
      doNot: [
        'Require specific work hours',
        'Provide company email address',
        'Include in company meetings',
        'Provide company equipment',
        'Provide training on how to do the work',
        'Set deadlines for how quickly to work (only for deliverables)',
        'Prohibit working for others',
        'Supervise day-to-day work activities',
      ],
    },
  },
};
```

---

## 6. Tax Obligations

### 6.1 Employer Tax Requirements

```typescript
const taxObligations = {
  federal: {
    fica: {
      socialSecurity: { rate: 0.062, wageBase: 168_600 }, // 2026 estimate
      medicare: { rate: 0.0145, noWageCap: true },
      additionalMedicare: { rate: 0.009, above: 200_000 }, // Employee only
    },
    futa: {
      rate: 0.006, // After state credit
      wageBase: 7_000,
    },
    incomeTaxWithholding: 'based on W-4',
    filingSchedule: {
      form941: 'quarterly',
      form940: 'annual',
      w2: 'annual (by Jan 31)',
      w3: 'annual (by Jan 31)',
    },
  },

  newYork: {
    stateIncomeTax: 'withholding based on IT-2104',
    suta: {
      rate: 'varies by employer experience rating',
      wageBase: 12_500, // 2026 estimate
    },
    mta: {
      // Metropolitan Transportation Authority surcharge
      rate: 0.0034,
      applicableTo: 'employers in MTA district',
    },
    disability: {
      rate: 0.005, // Of wages
      cap: 0.60,   // Per week from employee
      // Employer funds the rest
    },
    paidFamilyLeave: {
      rate: 'set annually',
      fundedBy: 'employee payroll deductions',
    },
  },

  // Contractor tax obligations (no withholding by company)
  contractors: {
    form1099NEC: {
      threshold: 600,       // Issue if paid $600+ in a year
      dueDate: 'January 31',
      filingMethod: 'IRS e-file or paper',
    },
    noWithholding: true,    // Do NOT withhold taxes for contractors
    noBenefits: true,       // Do NOT provide benefits to contractors
  },
};
```

---

## 7. Scaling Considerations

### 7.1 When to Hire Employees vs. Contractors

```typescript
const hiringDecisionMatrix = {
  // Use CONTRACTORS when:
  useContractors: [
    'Discrete project with clear deliverables and end date',
    'Specialized skill not needed long-term',
    'Work is outside your core business',
    'Worker has their own established business',
    'You need flexibility and no long-term commitment',
    'Work can be done with minimal direction',
  ],

  // Use EMPLOYEES when:
  useEmployees: [
    'Ongoing role with no clear end date',
    'Core business function (development, support)',
    'Need to control how and when work is done',
    'Want to build team culture and loyalty',
    'Role requires access to sensitive systems/data',
    'Training is required for the specific role',
  ],

  // Stone AI specific guidance:
  stoneAIGuidance: {
    // Phase 1: Solo founder (current)
    phase1: 'All work done by founder + AI agents. No hiring needed.',

    // Phase 2: First hires
    phase2: {
      contractors: ['Logo designer', 'Legal review', 'Security audit',
                    'Marketing copywriter', 'Tax accountant'],
      employees: 'Not yet — all can be project-based',
    },

    // Phase 3: Growth
    phase3: {
      contractors: ['Specialized development projects', 'Design work',
                    'Content creation', 'Marketing campaigns'],
      employees: ['Full-time developer (if needed)', 'Customer support (if volume demands)'],
    },
  },
};
```

---

## 8. Common Mistakes to Avoid

```
1. CALLING SOMEONE A "CONTRACTOR" DOESN'T MAKE THEM ONE
   The label on the contract does not matter. What matters is the
   reality of the working relationship. A judge looks at facts, not titles.

2. HAVING A CONTRACT DOESN'T PROVE CONTRACTOR STATUS
   A written contract is necessary but not sufficient. The IRS and
   NY DOL look at the actual working relationship, not the paperwork.

3. PAYING BY THE HOUR DOESN'T AUTOMATICALLY MEAN EMPLOYEE
   But it's a strong indicator. Fixed-fee per deliverable is safer
   for contractor classification.

4. "THEY WANTED TO BE A CONTRACTOR" IS NOT A DEFENSE
   Worker consent to contractor classification does not override
   the law. If the relationship looks like employment, it IS employment.

5. USING A CONTRACTOR FOR CORE BUSINESS WORK
   In New York, if the work is part of your usual course of business,
   it fails the B prong of the ABC test → Employee.

6. NOT GETTING IP ASSIGNMENT IN WRITING
   Without a signed IP assignment, the contractor may own what they create.
   This is especially dangerous for code, designs, and content.

7. GIVING CONTRACTORS COMPANY EMAIL/TOOLS
   This is strong evidence of an employment relationship.
   Contractors use their own email, tools, and equipment.
```

---

## 9. Production Checklist

- [ ] Worker classification analysis completed before any hire
- [ ] NY ABC test applied to all potential contractors
- [ ] Written contractor agreements in place with all clauses
- [ ] IP assignment clause signed before work begins
- [ ] Confidentiality/NDA signed before work begins
- [ ] W-9 collected from all contractors
- [ ] 1099-NEC issued annually to contractors paid $600+
- [ ] No employee-like behavior with contractors (hours, email, tools)
- [ ] Payment within 30 days (NYC Freelance Isn't Free Act)
- [ ] Contract includes detailed scope of work and acceptance criteria
- [ ] Pre-existing IP listed in Exhibit A of contract
- [ ] All contractor agreements specify NY governing law
- [ ] Records retention: contracts kept for engagement + 6 years
- [ ] If hiring employees: all NY registrations completed
- [ ] If hiring employees: payroll tax withholding configured
- [ ] Legal counsel consulted for first hire in each classification
