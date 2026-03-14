import { createTransport } from 'nodemailer';

const EMAIL_USER = '3headedm@gmail.com';
const EMAIL_PASS = 'xlscicjddqyqcjiu';
const RECIPIENT = '3headedm@gmail.com';

const transport = createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});

// EMAIL 1 — Stone: 7-Day Pre-Launch Checklist
const stoneResult = await transport.sendMail({
  from: `"Stone — 3HM" <${EMAIL_USER}>`,
  to: RECIPIENT,
  subject: '[P2] STONE — 7-Day Pre-Launch Checklist Review',
  html: `
<h2>7-DAY PRE-LAUNCH CHECKLIST — WHAT WE CAN DO vs FOUNDER ONLY</h2>

<h3>WE CAN DO (18 items — agents execute fully):</h3>
<ul>
<li>Verify Domain Ownership &amp; WHOIS Privacy (Cloudflare config)</li>
<li>Audit ALL Vercel Environment Variables</li>
<li>Run Prisma Production Migration Check</li>
<li>Verify Vercel Deployment Settings</li>
<li>Finalize &amp; Publish Terms of Service (code edit)</li>
<li>Finalize &amp; Publish Privacy Policy (code edit)</li>
<li>Create Refund/Cancellation Policy (code edit)</li>
<li>Add Cookie Consent Banner (frontend component)</li>
<li>Agent Access Verification by Tier</li>
<li>Full Feature Walkthrough on Production</li>
<li>Security Spot-Check on Production</li>
<li>Performance Baseline (Lighthouse)</li>
<li>Final Pre-Launch Verification</li>
<li>Monitor Vercel, Neon, Cloudflare</li>
<li>Morning Triage — Review All Dashboards</li>
<li>Fix Critical Bugs</li>
<li>User Feedback Synthesis</li>
<li>Set Up Monitoring Cadence</li>
<li>Prepare Stone AI Tools Launch</li>
<li>Begin Best AI Mobile Planning</li>
</ul>

<h3>WE CAN PREP (12 items — agents do 80%+, founder approves):</h3>
<ul>
<li>Draft Operating Agreement (we draft, you review/sign)</li>
<li>Flip Stripe TEST to LIVE (we audit config, you activate)</li>
<li>Configure Stripe Tax (we research, you confirm settings)</li>
<li>Flip Clerk DEV to PRODUCTION (we prep env vars, you paste keys)</li>
<li>Add ANTHROPIC_API_KEY to Vercel (we verify needs, you paste key)</li>
<li>Cloudflare Production Hardening (we document settings, you apply)</li>
<li>End-to-End Payment Flow Test (we script tests, you use live card)</li>
<li>Prepare Launch Assets (we generate copy, you screenshot)</li>
<li>Go Live Announcement (we draft posts, you publish)</li>
<li>Monitor Stripe Dashboard (we build alerts, you watch)</li>
<li>Respond to First Users (we draft responses, you post)</li>
<li>First Revenue Reconciliation (we query data, you verify payouts)</li>
</ul>

<h3>FOUNDER ONLY (7 items — requires your personal action):</h3>
<ul>
<li>Secure PO Box (in-person, government ID required)</li>
<li>File LLC Formation (your SSN, personal info, legal consent)</li>
<li>Apply for EIN (your SSN, IRS requires responsible party)</li>
<li>Open Business Bank Account (identity verification, your signature)</li>
<li>File Trademark Applications (your legal name, $2,100 payment)</li>
</ul>

<p><strong>BOTTOM LINE:</strong> 30 of 37 items the team handles. 7 need the founder's hand — all legal/financial gates in Days 1-2. Once those are cleared, we run the rest without stopping.</p>
<p><strong>NOTE:</strong> Trina may have completed some founder-only items. Please confirm which of the 7 she's done so we can update the checklist.</p>
`,
});

console.log('EMAIL 1 (Stone) sent:', stoneResult.messageId);

// EMAIL 2 — Cardinal: Legal Compliance Checklist
const cardinalResult = await transport.sendMail({
  from: `"Cardinal — 3HM" <${EMAIL_USER}>`,
  to: RECIPIENT,
  subject: '[P2] CARDINAL — Legal Compliance Checklist Review',
  html: `
<h2>PRE-LAUNCH LEGAL COMPLIANCE — WHAT WE CAN DO vs FOUNDER ONLY</h2>

<h3>SECTION 1 — CRITICAL (before March 14)</h3>

<h4>WE CAN DO (8 items):</h4>
<ul>
<li>Fix governing law clause to "State of New York" — code edit in terms page</li>
<li>Add NY auto-renewal compliance language (GBL 527-a) — code edit</li>
<li>Add auto-renewal disclosure to checkout UI — code edit</li>
<li>Add promotional pricing disclosures — code edit</li>
<li>Add NY SHIELD Act compliance section — code edit in privacy policy</li>
<li>Add "Do Not Sell or Share" link — code edit, footer + settings</li>
<li>Add Vercel/Neon/Cloudflare as sub-processors — code edit in privacy</li>
<li>Add agent-specific disclaimers for high-risk agents — code edit</li>
</ul>

<h4>WE CAN PREP (3 items):</h4>
<ul>
<li>Review marketing copy for FTC compliance — we audit, you approve</li>
<li>Document data security program (1 page) — we draft, you sign off</li>
<li>Create breach response plan (1 page) — we draft, you approve</li>
</ul>

<h4>FOUNDER ONLY (5 items):</h4>
<ul>
<li>Form LLC — requires SSN, personal info</li>
<li>Obtain EIN — requires SSN, LLC confirmation</li>
<li>Open business bank account — identity verification</li>
<li>Get PO Box — in-person ID verification</li>
<li>Register for NY sales tax — needs EIN, your signature</li>
</ul>

<h3>SECTION 2 — HIGH (within 30 days)</h3>

<h4>WE CAN DO (7 items):</h4>
<ul>
<li>Cookie consent banner — frontend component</li>
<li>GDPR section in privacy policy — code edit</li>
<li>Open-source license audit — npx license-checker</li>
<li>WCAG 2.1 AA accessibility audit — Lighthouse/axe</li>
<li>Small claims exception in ToS — code edit</li>
<li>Electronic communications consent in ToS — code edit</li>
<li>Accessibility statement page at /accessibility — code edit</li>
</ul>

<h4>WE CAN PREP (4 items):</h4>
<ul>
<li>Draft LLC Operating Agreement — we draft, you sign</li>
<li>Verify NYC Local Law 144 — we research, you confirm</li>
<li>Contractor agreement template — we draft, lawyer blesses</li>
<li>Multi-state sales tax analysis — we research, you decide</li>
</ul>

<h4>FOUNDER ONLY (5 items):</h4>
<ul>
<li>File trademarks — USPTO, $2,100, your signature</li>
<li>E&amp;O Insurance — your application + payment</li>
<li>General Liability Insurance — your application + payment</li>
<li>Quarterly estimated tax payments — CPA advised</li>
<li>Register copyright — Copyright Office, your identity</li>
</ul>

<p><strong>BOTTOM LINE:</strong> 15 items agents handle fully. 7 more agents prep to near-completion. 10 require the founder's hand. The 8 critical code edits can start RIGHT NOW — zero dependencies on the founder's legal/financial tasks.</p>
`,
});

console.log('EMAIL 2 (Cardinal) sent:', cardinalResult.messageId);
console.log('Both emails sent successfully.');
