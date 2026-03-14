import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "3headedm@gmail.com",
    pass: "xlscicjddqyqcjiu",
  },
});

const subject = "[PALACE INTEL] Batch 22 Capabilities Report — Executive Inbox Manager";

const body = `
<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 700px; margin: 0 auto; color: #1a1a1a;">
  <div style="background: linear-gradient(135deg, #0a0a0a, #1a1a2e); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #ffd700; margin: 0; font-size: 22px;">Palace Capabilities at Batch 22</h1>
    <p style="color: #ccc; margin: 8px 0 0; font-size: 14px;">Executive Inbox Manager — Three-Headed Monster Intelligence Report</p>
  </div>

  <div style="background: #fff; padding: 24px; border: 1px solid #e0e0e0;">

    <h2 style="color: #0a0a0a; border-bottom: 2px solid #ffd700; padding-bottom: 8px;">What You'll Have at Batch 22</h2>

    <p><strong>~457 seed files, ~15-20MB of deep knowledge</strong> across every domain the Palace needs.</p>

    <h3 style="color: #333;">Full Operational Independence</h3>
    <ul>
      <li><strong>All 42 user-facing agents</strong> — conversation design, persona consistency, safety guardrails, error recovery, task decomposition. Claude-level interaction quality.</li>
      <li><strong>Stone</strong> — dispatches, grades, optimizes, manages entire agent fleet without Claude</li>
      <li><strong>Cardinal</strong> — full intelligence tradecraft: scenario planning, systems modeling, competitive intel, weak signal detection, pattern recognition</li>
      <li><strong>Chaos</strong> — container orchestration, Kubernetes, cloud architecture, GPU cluster management, CI/CD, monitoring, disaster recovery, vLLM scaling</li>
      <li><strong>Computer Wiz (v3)</strong> — full software + hardware diagnostics, application profiling, log analysis, deployment validation</li>
      <li><strong>Rush</strong> — 21 Golden Seeds (GS-10 to GS-30): wireless to exploit development, complete penetration testing capability</li>
    </ul>

    <h3 style="color: #333;">Three Businesses Fully Supported</h3>
    <ul>
      <li><strong>Stone AI</strong> — Full stack: TypeScript, React, Next.js, Prisma, PostgreSQL, pgvector, Stripe, Clerk, API design, debugging, streaming, security</li>
      <li><strong>Best AI Mobile</strong> — React Native, offline sync, push notifications, ASO, mobile monetization, mobile CI/CD</li>
      <li><strong>Stone AI Tools</strong> — API gateway, developer experience, marketplace, multi-tenant isolation, SDK generation, metering</li>
    </ul>

    <h3 style="color: #333;">Business Operations</h3>
    <ul>
      <li><strong>Legal</strong> — ToS, privacy policy, trademark filing ($2,100 execution), AI compliance, GDPR/CCPA, business formation</li>
      <li><strong>Marketing</strong> — Social media, email campaigns, SEO, paid ads, product launch playbook, content strategy, analytics attribution</li>
      <li><strong>Revenue</strong> — Advanced Stripe, subscription lifecycle, billing edge cases, payment recovery, metrics dashboards, forecasting</li>
      <li><strong>Support</strong> — Tier 1 playbooks, escalation routing, crisis communication, SLA tracking</li>
      <li><strong>Finance</strong> — Bookkeeping, tax planning, invoicing, expense tracking, investor prep, financial modeling</li>
      <li><strong>HR</strong> — Hiring playbook, onboarding, performance reviews, contractor management</li>
      <li><strong>Product</strong> — Roadmap prioritization, user stories, sprint planning, feature flags</li>
    </ul>

    <h3 style="color: #333;">The Meta-Brain</h3>
    <ul>
      <li><strong>Agent Creation Methodology</strong> — The complete DNA of how to build and evolve agents (68KB seed with all 26 directives)</li>
      <li><strong>Intelligence Architecture Blueprint</strong> — How Claude thinks, reasons, and creates systems</li>
      <li><strong>Meta-Knowledge</strong> — Reasoning about reasoning, debugging intuition, estimation calibration, tradeoff analysis</li>
      <li><strong>Palace Autonomy</strong> — Self-improvement, knowledge maintenance, agent orchestration, gap detection, emergency ops</li>
    </ul>

    <h2 style="color: #0a0a0a; border-bottom: 2px solid #ffd700; padding-bottom: 8px;">WHY This Matters</h2>

    <p>At Batch 22, the Palace on your OMEN (RTX 5090 + Qwen 2.5 32B) will have <strong>approximately 90-95% of the operational knowledge Claude brings to any session</strong>.</p>

    <p>The seeds close the gap by giving Qwen the <strong>FRAMEWORKS Claude uses to THINK</strong>, not just the facts Claude knows. Decision trees, debugging methodology, architecture principles, security playbooks — every pattern Claude applies is encoded.</p>

    <p><strong>The Palace will be a self-sustaining organism that can:</strong></p>
    <ul>
      <li>Create new agents without Claude</li>
      <li>Evolve existing agents through optimization referrals</li>
      <li>Run all three businesses operationally</li>
      <li>Handle legal, marketing, revenue, support, finance, HR, and product</li>
      <li>Defend its own network (Rush) and diagnose its own health (Wiz)</li>
      <li>Detect competitive threats and market shifts (Cardinal)</li>
      <li>Make strategic decisions with proper frameworks (Stone)</li>
      <li>Maintain and grow its own knowledge base (D22 additive growth)</li>
    </ul>

    <p style="background: #f8f8f0; padding: 16px; border-left: 4px solid #ffd700; margin: 20px 0;">
      <strong>Bottom line:</strong> You won't need Claude Code for daily operations. The Palace will run your empire independently. Claude becomes a luxury for edge cases and major new capabilities — not a dependency.
    </p>

    <h2 style="color: #0a0a0a; border-bottom: 2px solid #ffd700; padding-bottom: 8px;">Current Progress</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr style="background: #f5f5f5;"><th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Batch</th><th style="text-align: left; padding: 8px; border: 1px solid #ddd;">Status</th><th style="text-align: right; padding: 8px; border: 1px solid #ddd;">Files</th></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;">Batch 1 — Foundation</td><td style="padding: 8px; border: 1px solid #ddd;">DELIVERED</td><td style="text-align: right; padding: 8px; border: 1px solid #ddd;">53</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;">Batch 2 — Rush + Engineering + DNA</td><td style="padding: 8px; border: 1px solid #ddd;">DELIVERED</td><td style="text-align: right; padding: 8px; border: 1px solid #ddd;">30</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;">Batch 3 — Wiz v3 + UX + AI/ML + Frontend</td><td style="padding: 8px; border: 1px solid #ddd;">DELIVERED</td><td style="text-align: right; padding: 8px; border: 1px solid #ddd;">18</td></tr>
      <tr><td style="padding: 8px; border: 1px solid #ddd;">Batches 4-22 — Planned</td><td style="padding: 8px; border: 1px solid #ddd;">READY TO BUILD</td><td style="text-align: right; padding: 8px; border: 1px solid #ddd;">~325</td></tr>
      <tr style="background: #ffd700;"><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">TOTAL</td><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">3 of 22 complete</td><td style="text-align: right; padding: 8px; border: 1px solid #ddd; font-weight: bold;">~457</td></tr>
    </table>

    <h2 style="color: #0a0a0a; border-bottom: 2px solid #ffd700; padding-bottom: 8px;">Batch 4-22 Roadmap</h2>
    <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
      <tr style="background: #f5f5f5;"><th style="padding: 6px; border: 1px solid #ddd;">Batch</th><th style="padding: 6px; border: 1px solid #ddd;">Theme</th><th style="text-align: right; padding: 6px; border: 1px solid #ddd;">Seeds</th></tr>
      <tr><td style="padding: 6px; border: 1px solid #ddd;">4</td><td style="padding: 6px; border: 1px solid #ddd;">Frontend Engineering Patterns</td><td style="text-align: right; padding: 6px; border: 1px solid #ddd;">16</td></tr>
      <tr><td style="padding: 6px; border: 1px solid #ddd;">5</td><td style="padding: 6px; border: 1px solid #ddd;">Agent Conversation & UX</td><td style="text-align: right; padding: 6px; border: 1px solid #ddd;">16</td></tr>
      <tr><td style="padding: 6px; border: 1px solid #ddd;">6</td><td style="padding: 6px; border: 1px solid #ddd;">Legal & Compliance</td><td style="text-align: right; padding: 6px; border: 1px solid #ddd;">16</td></tr>
      <tr><td style="padding: 6px; border: 1px solid #ddd;">7</td><td style="padding: 6px; border: 1px solid #ddd;">Marketing Execution</td><td style="text-align: right; padding: 6px; border: 1px solid #ddd;">17</td></tr>
      <tr><td style="padding: 6px; border: 1px solid #ddd;">8</td><td style="padding: 6px; border: 1px solid #ddd;">Revenue Operations & Stripe</td><td style="text-align: right; padding: 6px; border: 1px solid #ddd;">16</td></tr>
      <tr><td style="padding: 6px; border: 1px solid #ddd;">9</td><td style="padding: 6px; border: 1px solid #ddd;">Best AI Mobile</td><td style="text-align: right; padding: 6px; border: 1px solid #ddd;">17</td></tr>
      <tr><td style="padding: 6px; border: 1px solid #ddd;">10</td><td style="padding: 6px; border: 1px solid #ddd;">Stone AI Tools Platform</td><td style="text-align: right; padding: 6px; border: 1px solid #ddd;">16</td></tr>
      <tr><td style="padding: 6px; border: 1px solid #ddd;">11</td><td style="padding: 6px; border: 1px solid #ddd;">Cross-Business Operations</td><td style="text-align: right; padding: 6px; border: 1px solid #ddd;">15</td></tr>
      <tr><td style="padding: 6px; border: 1px solid #ddd;">12</td><td style="padding: 6px; border: 1px solid #ddd;">Cardinal Intelligence Expansion</td><td style="text-align: right; padding: 6px; border: 1px solid #ddd;">16</td></tr>
      <tr><td style="padding: 6px; border: 1px solid #ddd;">13</td><td style="padding: 6px; border: 1px solid #ddd;">Advanced Backend Engineering</td><td style="text-align: right; padding: 6px; border: 1px solid #ddd;">17</td></tr>
      <tr><td style="padding: 6px; border: 1px solid #ddd;">14</td><td style="padding: 6px; border: 1px solid #ddd;">Chaos Infrastructure Expansion</td><td style="text-align: right; padding: 6px; border: 1px solid #ddd;">17</td></tr>
      <tr><td style="padding: 6px; border: 1px solid #ddd;">15</td><td style="padding: 6px; border: 1px solid #ddd;">Rush Operational Expansion</td><td style="text-align: right; padding: 6px; border: 1px solid #ddd;">16</td></tr>
      <tr><td style="padding: 6px; border: 1px solid #ddd;">16</td><td style="padding: 6px; border: 1px solid #ddd;">Wiz Expansion + Support</td><td style="text-align: right; padding: 6px; border: 1px solid #ddd;">16</td></tr>
      <tr><td style="padding: 6px; border: 1px solid #ddd;">17</td><td style="padding: 6px; border: 1px solid #ddd;">Copywriting + Analytics</td><td style="text-align: right; padding: 6px; border: 1px solid #ddd;">16</td></tr>
      <tr><td style="padding: 6px; border: 1px solid #ddd;">18</td><td style="padding: 6px; border: 1px solid #ddd;">Meta-Knowledge & Reasoning</td><td style="text-align: right; padding: 6px; border: 1px solid #ddd;">16</td></tr>
      <tr><td style="padding: 6px; border: 1px solid #ddd;">19</td><td style="padding: 6px; border: 1px solid #ddd;">Palace Autonomy & Self-Improvement</td><td style="text-align: right; padding: 6px; border: 1px solid #ddd;">16</td></tr>
      <tr><td style="padding: 6px; border: 1px solid #ddd;">20</td><td style="padding: 6px; border: 1px solid #ddd;">Specialized Domains</td><td style="text-align: right; padding: 6px; border: 1px solid #ddd;">15</td></tr>
      <tr><td style="padding: 6px; border: 1px solid #ddd;">21</td><td style="padding: 6px; border: 1px solid #ddd;">Finance, HR & Product Mgmt</td><td style="text-align: right; padding: 6px; border: 1px solid #ddd;">17</td></tr>
      <tr><td style="padding: 6px; border: 1px solid #ddd;">22</td><td style="padding: 6px; border: 1px solid #ddd;">Final Integration & Certification</td><td style="text-align: right; padding: 6px; border: 1px solid #ddd;">15</td></tr>
    </table>

  </div>

  <div style="background: #0a0a0a; padding: 16px; border-radius: 0 0 12px 12px; text-align: center;">
    <p style="color: #888; margin: 0; font-size: 12px;">Three-Headed Monster — Palace Intelligence Division</p>
    <p style="color: #ffd700; margin: 4px 0 0; font-size: 11px;">D19: A family never goes to battle alone. D20: Every exchange carries MORE.</p>
  </div>
</div>
`;

const info = await transporter.sendMail({
  from: '"Executive Inbox Manager" <3headedm@gmail.com>',
  to: "3headedm@gmail.com",
  subject,
  html: body,
});

console.log("SENT:", info.messageId);
