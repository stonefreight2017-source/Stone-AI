# Data Breach Response Plan for AI SaaS Companies

## Palace Knowledge Seed — Legal & Compliance Series
### Classification: Critical Legal Infrastructure
### Applicable To: Stone AI, Best AI Mobile, Stone AI Tools

---

## 1. Executive Summary

A data breach is not a matter of "if" but "when." For an AI SaaS company handling user conversations, authentication data, payment information, and AI-generated content, a breach can be catastrophic — legally, financially, and reputationally.

New York's SHIELD Act (Stop Hacks and Improve Electronic Data Security Act) imposes strict notification requirements and mandates reasonable security safeguards. Federal laws (HIPAA if health data is involved, GLBA for financial data) add additional layers. GDPR and CCPA/CPRA apply if Stone AI serves users in those jurisdictions.

This seed provides a complete, actionable data breach response plan with specific procedures, communication templates, legal timelines, and forensic investigation steps.

---

## 2. New York SHIELD Act Requirements

### 2.1 What the SHIELD Act Covers

```typescript
const shieldAct = {
  effectiveDate: '2020-03-21',
  appliesTo: 'Any person or business that owns or licenses private information of NY residents',
  // Note: applies regardless of where the business is located

  privateInformation: {
    // Expanded definition under SHIELD Act
    includes: [
      // Traditional triggers (name + one of):
      'Social Security number',
      'Driver\'s license or state ID number',
      'Financial account number + access code',
      'Credit/debit card number + security code',

      // NEW triggers added by SHIELD (no name required):
      'Biometric information (fingerprints, voiceprints, retina scans)',
      'Username + password or security question',
      'Username + email + password (combination)',
    ],
  },

  breachDefinition: {
    // Expanded definition
    unauthorized: {
      access: 'unauthorized access to computerized data',
      acquisition: 'unauthorized acquisition of computerized data',
      // Does NOT require actual misuse — access alone triggers
    },
  },

  notificationRequirements: {
    timing: 'without unreasonable delay',
    // No specific number of days, but "expeditious" is expected
    // Industry standard: 30-60 days
    // Some argue 72 hours (GDPR influence)

    methods: {
      written: 'postal mail',
      electronic: 'email (if prior consent)',
      telephone: 'to affected individuals',
      // If >5,000 affected:
      substitute: 'email + conspicuous website posting + media notice',
    },

    contentRequired: [
      'Description of the breach',
      'Date or date range of the breach',
      'Types of private information compromised',
      'Contact information for the company',
      'Contact information for relevant government agencies',
      'Toll-free numbers for credit reporting agencies',
    ],

    governmentNotification: {
      nyAttorneyGeneral: 'required',
      nyDepartmentOfState: 'required (Division of Consumer Protection)',
      nyStatePoliceSuperintendent: 'required',
      // Must be notified within 10 days of notification to affected individuals
    },
  },

  securityRequirements: {
    // SHIELD Act mandates "reasonable safeguards"
    administrative: [
      'Designate employee(s) to coordinate security program',
      'Assess risks in data processing, transmission, storage',
      'Train employees on security program',
      'Select service providers that maintain safeguards',
    ],
    technical: [
      'Assess risks in network and software design',
      'Assess risks in information processing, transmission, storage',
      'Detect, prevent, respond to attacks',
      'Test and monitor effectiveness of controls',
    ],
    physical: [
      'Assess risks of information storage and disposal',
      'Detect, prevent, respond to intrusions',
      'Protect against unauthorized access during or after collection',
      'Dispose of private information within reasonable time after no longer needed',
    ],
  },
};
```

### 2.2 SHIELD Act Compliance for Stone AI

```typescript
const stoneAIShieldCompliance = {
  dataInventory: {
    // What private information does Stone AI hold?
    userAuthData: {
      type: 'username + email + password',
      storage: 'Clerk (third-party auth provider)',
      shieldTrigger: true,
      mitigation: 'Clerk manages auth data; Stone AI does not store passwords',
    },
    paymentData: {
      type: 'credit card information',
      storage: 'Stripe (PCI-compliant processor)',
      shieldTrigger: true,
      mitigation: 'Stone AI never sees full card numbers; Stripe tokenizes',
    },
    conversationData: {
      type: 'conversation content (may contain PII)',
      storage: 'Neon PostgreSQL',
      shieldTrigger: 'depends on content — user may share PII in conversations',
      mitigation: 'PII detection and sanitization in conversation pipeline',
    },
    biometricData: {
      type: 'none collected',
      shieldTrigger: false,
    },
  },

  safeguards: {
    administrative: {
      securityCoordinator: 'Founder (sole operator)',
      riskAssessment: 'documented',
      employeeTraining: 'N/A (sole operator)',
      vendorManagement: ['Clerk: SOC 2 Type II', 'Stripe: PCI DSS Level 1',
                         'Neon: SOC 2', 'Vercel: SOC 2 Type II'],
    },
    technical: {
      encryption: 'AES-256-GCM at rest, TLS 1.3 in transit',
      accessControl: 'Role-based, Clerk authentication',
      monitoring: 'Vercel analytics, Cloudflare security',
      testing: 'Zod validation, CSP headers, rate limiting',
    },
    physical: {
      serverSecurity: 'Cloud-hosted (Neon, Vercel) — provider managed',
      deviceSecurity: 'Founder devices encrypted, password protected',
      disposal: 'Cloud data deleted via API; local data securely wiped',
    },
  },
};
```

---

## 3. Breach Response Timeline

### 3.1 The First 72 Hours

```
HOUR 0: BREACH DETECTED
├── Confirm this is a real breach (not a false positive)
├── Do NOT shut down systems (preserve evidence)
├── Do NOT communicate publicly yet
├── Begin incident log (timestamp everything)
└── Activate incident response plan

HOUR 0-4: CONTAINMENT
├── Isolate affected systems
├── Revoke compromised credentials
├── Block attacker access (if ongoing)
├── Preserve forensic evidence (snapshots, logs)
└── Assess scope: what data, how many users, what access

HOUR 4-24: ASSESSMENT
├── Determine what data was accessed/exfiltrated
├── Identify affected users
├── Determine breach vector (how did they get in?)
├── Engage legal counsel
├── Engage forensic investigator (if needed)
└── Draft initial notification (do not send yet)

HOUR 24-48: LEGAL REVIEW
├── Legal counsel reviews breach scope
├── Determine notification obligations (which laws apply)
├── Review insurance coverage (cyber liability policy)
├── Prepare notification letters
├── Prepare government notifications
└── Prepare public statement (if needed)

HOUR 48-72: NOTIFICATION
├── Notify affected individuals
├── Notify NY Attorney General, DOS, State Police
├── Notify relevant federal agencies (if applicable)
├── Post notice on website (if >5,000 affected)
├── Prepare customer support for inquiries
└── Issue public statement (if warranted)
```

### 3.2 Incident Response Team

```typescript
interface IncidentResponseTeam {
  // For a solo founder operation:
  incidentCommander: {
    role: 'Founder',
    responsibilities: ['Decision authority', 'Communication approval',
                       'Resource allocation', 'Legal coordination'],
  };

  // External resources (pre-arranged):
  legalCounsel: {
    firm: '[Retained law firm]',
    specialty: 'Data breach and cybersecurity',
    contactMethod: 'Emergency phone number',
    retainerInPlace: boolean;
  };

  forensicInvestigator: {
    firm: '[Pre-vetted firm]',
    capabilities: ['Log analysis', 'Malware analysis', 'Data recovery'],
    contactMethod: 'Emergency phone number',
    retainerInPlace: boolean;
  };

  cyberInsurance: {
    carrier: '[Insurance carrier]',
    policyNumber: string;
    claimsLine: string;
    coverageIncludes: ['Forensic investigation', 'Legal fees',
                       'Notification costs', 'Credit monitoring',
                       'Crisis management', 'Business interruption'],
  };

  // Cloud providers (for their scope):
  cloudProviders: {
    neon: { securityContact: string; incidentProcess: string };
    vercel: { securityContact: string; incidentProcess: string };
    clerk: { securityContact: string; incidentProcess: string };
    stripe: { securityContact: string; incidentProcess: string };
    cloudflare: { securityContact: string; incidentProcess: string };
  };
}
```

---

## 4. Forensic Investigation

### 4.1 Evidence Preservation

```typescript
const evidencePreservation = {
  // CRITICAL: Preserve evidence BEFORE remediation
  // Fixing the vulnerability destroys evidence if not preserved first

  immediateActions: [
    'Take snapshots of affected systems/databases',
    'Capture memory dumps if systems are live',
    'Export all access logs for the breach period',
    'Export all authentication logs',
    'Export all database query logs',
    'Export all API access logs',
    'Screenshot any visible compromise indicators',
    'Preserve email headers if phishing was involved',
  ],

  logSources: {
    vercel: {
      accessLogs: 'Vercel dashboard > Logs',
      deploymentLogs: 'Vercel dashboard > Deployments',
      functionLogs: 'Vercel dashboard > Functions',
      retentionPeriod: '30 days (export immediately)',
    },
    neon: {
      queryLogs: 'Neon dashboard > Query logs',
      connectionLogs: 'Neon dashboard > Connections',
      retentionPeriod: 'varies by plan',
    },
    cloudflare: {
      accessLogs: 'Cloudflare dashboard > Analytics',
      firewallLogs: 'Cloudflare dashboard > Security',
      retentionPeriod: '30-90 days depending on plan',
    },
    clerk: {
      authLogs: 'Clerk dashboard > Users > Activity',
      sessionLogs: 'Clerk dashboard > Sessions',
    },
  },

  chainOfCustody: {
    // For legal proceedings, evidence must have documented chain of custody
    hashAllEvidence: true,          // SHA-256 hash of all files
    timestampCollection: true,      // When was each piece collected
    documentCollector: true,        // Who collected it
    secureStorage: true,            // Encrypted, access-controlled
    noModification: true,           // Evidence is read-only after collection
  },
};
```

### 4.2 Breach Vector Analysis

```typescript
const commonBreachVectors = {
  // Assess each vector to determine how the breach occurred
  credentialCompromise: {
    indicators: [
      'Login from unusual IP/location',
      'Login outside normal hours',
      'Multiple failed login attempts followed by success',
      'API key used from unauthorized source',
    ],
    investigation: [
      'Review Clerk auth logs for anomalous sessions',
      'Check if API keys were exposed in public repos',
      'Review .env files for accidental commits',
      'Check if credentials were reused from other breaches',
    ],
  },

  applicationVulnerability: {
    indicators: [
      'Unusual API call patterns',
      'SQL injection attempts in logs',
      'Unauthorized data access via API',
      'IDOR (insecure direct object reference) exploitation',
    ],
    investigation: [
      'Review API logs for unusual query patterns',
      'Check for missing authorization checks on endpoints',
      'Review Zod validation coverage on all mutation routes',
      'Check for exposed internal endpoints',
    ],
  },

  thirdPartyCompromise: {
    indicators: [
      'Breach announced by vendor (Clerk, Neon, Vercel, Stripe)',
      'Unusual activity originating from vendor IPs',
      'Data accessed that is only stored at vendor',
    ],
    investigation: [
      'Contact vendor security team immediately',
      'Review vendor\'s breach notification',
      'Determine what data was at the vendor',
      'Review vendor\'s forensic report',
    ],
  },

  insiderThreat: {
    indicators: [
      'Access to data outside normal scope',
      'Large data exports',
      'Activity after hours or from unusual locations',
    ],
    investigation: [
      'Review access logs for the individual',
      'Check for unauthorized data exports',
      'Review file access patterns',
    ],
  },
};
```

---

## 5. Communication Templates

### 5.1 User Notification Letter

```
Subject: Important Security Notice from Stone AI

Dear [User Name],

We are writing to inform you of a data security incident that may have
affected your Stone AI account.

WHAT HAPPENED
On [date], we discovered that [brief description of what happened].
The incident occurred between [start date] and [end date].

WHAT INFORMATION WAS INVOLVED
The following types of information may have been affected:
- [List specific data types]

WHAT WE ARE DOING
We have taken the following steps:
- Secured our systems and closed the vulnerability
- Engaged cybersecurity experts to investigate
- Notified law enforcement and applicable regulators
- [Any additional steps taken]

WHAT YOU CAN DO
We recommend the following protective steps:
- Change your Stone AI password immediately
- If you used the same password on other services, change those too
- Monitor your accounts for any suspicious activity
- [Additional recommendations based on data type]

[If payment data]: We recommend monitoring your credit card statements
and consider placing a fraud alert with the credit bureaus:
- Equifax: 1-800-525-6285
- Experian: 1-888-397-3742
- TransUnion: 1-800-680-7289

FOR MORE INFORMATION
If you have questions, please contact us at:
Email: security@stone-ai.net
[Phone number if available]

We take the security of your information seriously and sincerely
apologize for this incident.

Sincerely,
[Founder Name]
Founder, Stone AI
```

### 5.2 Government Notification

```typescript
interface GovernmentNotification {
  // NY Attorney General notification
  nyAG: {
    form: 'Online submission at ag.ny.gov',
    requiredInfo: [
      'Company name and contact information',
      'Description of the breach',
      'Date of breach and date of discovery',
      'Number of NY residents affected',
      'Types of private information compromised',
      'Steps taken to remediate',
      'Copy of notification sent to affected individuals',
    ],
    deadline: '10 days after notifying affected individuals',
  };

  // NY State Police
  nyStatePolice: {
    method: 'Written notification',
    deadline: '10 days after notifying affected individuals',
  };

  // NY Division of Consumer Protection
  nyDCP: {
    method: 'Written notification',
    deadline: '10 days after notifying affected individuals',
  };
}
```

### 5.3 Public Statement (If Needed)

```
Stone AI Security Update — [Date]

We recently identified a security incident that affected some of our
users' data. We want to be transparent about what happened, what we've
done, and what it means for you.

[Brief, factual description]

We have:
✓ Secured our systems
✓ Notified affected users individually
✓ Engaged external security experts
✓ Reported to relevant authorities

If you received a notification from us, please follow the steps
outlined in that communication. If you did not receive a notification,
your account was not affected.

We take security seriously and are implementing additional safeguards
to prevent similar incidents.

For questions: security@stone-ai.net
```

---

## 6. Post-Breach Actions

### 6.1 Remediation Checklist

```
After the immediate breach is contained:

□ Root cause identified and documented
□ Vulnerability patched/remediated
□ Compromised credentials rotated
□ All API keys rotated
□ All access tokens invalidated
□ Security audit of similar systems completed
□ Additional monitoring deployed
□ Incident report finalized
□ Insurance claim filed (if applicable)
□ Legal counsel review of all communications
□ User notification sent within required timeframe
□ Government notifications filed within 10 days
□ Credit monitoring offered (if financial data exposed)
□ Post-incident review scheduled (30 days after)
```

### 6.2 Lessons Learned Process

```typescript
interface PostIncidentReview {
  scheduledDate: Date; // 30 days after incident resolution
  participants: string[];
  agenda: [
    'Timeline review: what happened when',
    'Root cause analysis: why it happened',
    'Detection review: how was it found, could we have found it sooner',
    'Response review: what went well, what could improve',
    'Communication review: were notifications timely and accurate',
    'Technical review: what security improvements are needed',
    'Process review: what procedural changes are needed',
    'Action items: specific improvements with owners and deadlines',
  ];
  output: 'Written report with action items and deadlines';
}
```

---

## 7. Breach Prevention

### 7.1 Security Measures Matrix

```typescript
const preventionMatrix = {
  authentication: {
    measures: [
      'Clerk handles auth (SOC 2 Type II)',
      'MFA available for all users',
      'Session management with automatic timeout',
      'Credential rotation schedule for API keys',
    ],
    reviewFrequency: 'quarterly',
  },

  dataProtection: {
    measures: [
      'AES-256-GCM encryption at rest',
      'TLS 1.3 in transit',
      'PII detection and sanitization pipeline',
      'Database access via connection pooling only',
      'No direct database access from client',
    ],
    reviewFrequency: 'quarterly',
  },

  applicationSecurity: {
    measures: [
      'Zod .strict() validation on all mutations',
      'CSP headers configured',
      'Rate limiting on all endpoints',
      'Input sanitization',
      'CORS properly configured',
      'No eval() or dynamic code execution',
    ],
    reviewFrequency: 'monthly',
  },

  monitoring: {
    measures: [
      'Cloudflare WAF and DDoS protection',
      'Vercel deployment monitoring',
      'Error tracking and alerting',
      'Audit logging for sensitive operations',
    ],
    reviewFrequency: 'continuous',
  },

  vendorSecurity: {
    measures: [
      'All vendors SOC 2 certified',
      'Vendor security review before adoption',
      'Minimal data sharing with vendors',
      'Regular vendor security assessment review',
    ],
    reviewFrequency: 'annually',
  },
};
```

---

## 8. Insurance Coverage

### 8.1 Cyber Liability Insurance

```typescript
const cyberInsuranceGuidance = {
  // Essential for any SaaS company
  coverageTypes: {
    firstParty: {
      // Covers YOUR costs
      includes: [
        'Forensic investigation costs',
        'Notification costs',
        'Credit monitoring services',
        'Crisis management/PR',
        'Business interruption',
        'Data recovery/restoration',
        'Cyber extortion/ransomware',
      ],
    },
    thirdParty: {
      // Covers OTHERS' claims against you
      includes: [
        'Legal defense costs',
        'Regulatory fines and penalties',
        'Privacy liability (user lawsuits)',
        'Media liability (defamation from AI)',
        'PCI DSS fines (payment card breach)',
      ],
    },
  },

  recommendedLimits: {
    startup: { min: 1_000_000, recommended: 2_000_000 },
    growth: { min: 2_000_000, recommended: 5_000_000 },
    scale: { min: 5_000_000, recommended: 10_000_000 },
  },

  estimatedCost: {
    // For a SaaS company with <$1M revenue
    annual: '$1,500 - $5,000',
    factors: ['Revenue', 'Data volume', 'Industry', 'Security posture',
              'Claims history', 'Number of records'],
  },
};
```

---

## 9. Production Checklist

- [ ] Incident response plan documented and accessible
- [ ] Incident response team identified (founder + external resources)
- [ ] Legal counsel retained for data breach matters
- [ ] Forensic investigation firm pre-vetted
- [ ] Cyber liability insurance policy in place
- [ ] Evidence preservation procedures documented
- [ ] Communication templates drafted and reviewed by counsel
- [ ] NY AG, State Police, DCP notification procedures documented
- [ ] Data inventory completed (what private information is held, where)
- [ ] SHIELD Act safeguards implemented (administrative, technical, physical)
- [ ] All vendor security certifications verified
- [ ] API key rotation schedule established
- [ ] Monitoring and alerting configured for breach indicators
- [ ] Incident log template ready for use
- [ ] Post-incident review process defined
- [ ] Annual tabletop exercise scheduled (practice the plan)
- [ ] Breach notification can be sent within 48-72 hours of determination
