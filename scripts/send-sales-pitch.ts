import nodemailer from "nodemailer";
import { sendFounderAlert } from "../src/lib/alert-system/send";
import { AlertAgent, AlertPriority, AlertType } from "../src/lib/alert-system/types";

async function main() {
  // --- 1. Sales pitch to prospect ---
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.ALERT_EMAIL_USER,
      pass: process.env.ALERT_EMAIL_PASS,
    },
  });

  const salesResult = await transport.sendMail({
    from: '"Stone AI" <3headedm@gmail.com>',
    to: "blazerduggar@gmail.com",
    subject: "Run Your Barbershop Like a Boss — AI That Gets the Industry | Stone AI",
    html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
  <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px; border-radius: 12px 12px 0 0;">
    <h1 style="color: #f8fafc; margin: 0; font-size: 24px;">Stone AI</h1>
    <p style="color: #94a3b8; margin: 8px 0 0 0; font-size: 14px;">Your AI-Powered Business Partner</p>
  </div>

  <div style="padding: 30px; background: #ffffff; border: 1px solid #e2e8f0;">
    <p style="font-size: 16px; line-height: 1.6;">What's good,</p>

    <p style="font-size: 16px; line-height: 1.6;">I heard you're looking to launch a <strong>barbershop company</strong>. That's a solid move — and I want to put something in front of you that's going to give you a serious edge before you even open the doors.</p>

    <p style="font-size: 16px; line-height: 1.6;">At <strong>Stone AI</strong>, we built a team of <strong>42 AI agents</strong> — not a chatbot, not a gimmick — real specialized AI that handles the business side so you can focus on what you do best: cutting hair and building culture.</p>

    <h2 style="color: #0f172a; font-size: 20px; margin-top: 24px;">Here's What Stone AI Does For Your Barbershop:</h2>

    <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0;">
      <p style="margin: 0 0 12px 0;"><strong>Brand Building Specialist</strong><br/>
      Build your barbershop brand from scratch. Logo direction, color palette, brand voice, social media identity — the whole package. Stand out from every other shop on the block.</p>

      <p style="margin: 0 0 12px 0;"><strong>Lead Generation Specialist</strong><br/>
      Fill your chairs before you even open. Local SEO strategies, Google Maps optimization, social media funnels, and community outreach plans that bring clients through the door on day one.</p>

      <p style="margin: 0 0 12px 0;"><strong>Sales Agent</strong><br/>
      Upsell services, create membership packages, build loyalty programs. Turn walk-ins into regulars and regulars into referral machines. Pricing strategies that maximize revenue per chair.</p>

      <p style="margin: 0 0 12px 0;"><strong>Content & Copywriting Studio</strong><br/>
      Social media posts, Instagram captions, TikTok scripts, flyers, grand opening promos, email campaigns. Content that makes your shop the one everyone's talking about.</p>

      <p style="margin: 0 0 12px 0;"><strong>Website Development Specialist</strong><br/>
      Professional website with online booking, service menu, gallery of your work, and client reviews. Look established from day one — even if you just signed the lease.</p>

      <p style="margin: 0 0 12px 0;"><strong>Project Management Coach</strong><br/>
      Opening a shop is a project — permits, buildout, equipment, hiring, marketing launch. This agent keeps every task on track, on time, and on budget. No balls dropped.</p>

      <p style="margin: 0 0 12px 0;"><strong>Personal Finance Advisor</strong><br/>
      Startup costs, cash flow projections, break-even analysis, tax planning for your new business. Know your numbers before you spend a dollar.</p>

      <p style="margin: 0;"><strong>Startup Launcher Specialist</strong><br/>
      Business plan, LLC formation guidance, licensing requirements, insurance checklist, supplier sourcing. Everything you need to go from idea to open sign.</p>
    </div>

    <h2 style="color: #0f172a; font-size: 20px; margin-top: 24px;">Why Barbershop Owners Choose Stone AI:</h2>
    <ul style="font-size: 16px; line-height: 1.8;">
      <li><strong>42 specialized agents</strong> — marketing, finance, branding, sales, web dev, and more in one subscription</li>
      <li><strong>Available 24/7</strong> — plan at midnight, get answers at 5 AM, work on your schedule</li>
      <li><strong>Built for entrepreneurs</strong> — these agents understand small business, not corporate fluff</li>
      <li><strong>Cheaper than one consultant</strong> — get an entire AI team for less than a single business advisor charges per hour</li>
    </ul>

    <h2 style="color: #0f172a; font-size: 20px; margin-top: 24px;">Pricing That Makes Sense:</h2>
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 0 0 8px 0; font-size: 18px; color: #16a34a;"><strong>Start for $9.99 Your First Month</strong></p>
      <p style="margin: 0 0 4px 0;">&#8226; <strong>STARTER</strong> — $19.99/mo — 16 agents: Brand Building, Sales, Content, Finance, Project Management</p>
      <p style="margin: 0 0 4px 0;">&#8226; <strong>PLUS</strong> — $49.99/mo — 30 agents: adds Lead Gen, Web Dev, E-Commerce, Data Analytics</p>
      <p style="margin: 0 0 4px 0;">&#8226; <strong>SMART</strong> — $79.99/mo (annual) — 39 agents: adds Digital Marketing, Startup Launcher, HR</p>
      <p style="margin: 0;">&#8226; <strong>PRO</strong> — $200/mo — All 42 agents, full access, no limits</p>
    </div>

    <p style="font-size: 16px; line-height: 1.6; margin-top: 24px;">Real talk — opening a barbershop is more than just being nice with the clippers. It's branding, marketing, finances, operations, and client acquisition all at once. <strong>Stone AI handles the business side so you handle the craft.</strong></p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="https://stone-ai.net" style="background: #3b82f6; color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold;">Check Out Stone AI</a>
    </div>

    <p style="font-size: 16px; line-height: 1.6;">Got questions? Hit reply — I read every one personally.</p>

    <p style="font-size: 16px; line-height: 1.6;">Let's get this shop off the ground.</p>

    <p style="font-size: 16px; margin-top: 24px;"><strong>Stone AI Team</strong><br/>
    <a href="https://stone-ai.net" style="color: #3b82f6;">stone-ai.net</a></p>
  </div>

  <div style="background: #f8fafc; padding: 16px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none; text-align: center;">
    <p style="color: #64748b; font-size: 12px; margin: 0;">Stone AI — Your AI-Powered Business Partner<br/>
    <a href="https://stone-ai.net" style="color: #64748b;">stone-ai.net</a></p>
  </div>
</div>
    `,
  });

  console.log("=== SALES PITCH EMAIL ===");
  console.log("Email sent! Message ID:", salesResult.messageId);
  console.log("Accepted:", salesResult.accepted);
  console.log("Response:", salesResult.response);

  // --- 2. Founder status alert ---
  const alertResult = await sendFounderAlert(
    {
      agent: AlertAgent.STONE,
      priority: AlertPriority.P2,
      alertType: AlertType.SEED_DELIVERABLE,
      title: "[STATUS] Barbershop pitch RESENT to blazerduggar@gmail.com",
      body: `STATUS REPORT — Stone (Head 1)

COMPLETED:
1. Barbershop sales pitch SENT to blazerduggar@gmail.com
   - Pitched: Brand Building, Lead Gen, Sales Agent, Content Studio, Web Dev, Project Mgmt, Finance, Startup Launcher
   - Highlighted $9.99 intro, STARTER/PLUS/SMART/PRO tiers
   - CTA: Visit stone-ai.net

2. Wave 1 Seed Build: 52/52 COMPLETE
   - AI/ML RAG meta-seeds: 8 built
   - Math foundations: 7 built
   - Software breadth (Python/Rust/Go/C++/Java): 13 built
   - Cloud architecture (AWS/GCP/Azure): 7 built
   - Cybersecurity depth: 5 built
   - Critical thinking: 3 built
   - Claude patterns: 4 built
   - Golden Seeds MVP (K-8, R-2, R-8, K-1, E-2): 5 built

3. Updated seed inventory: 379 → 431 total seeds

4. USB drive E: (DataOcean) detected and ready for transfer
   - Command: cp -r /c/Users/stone/stone-ai/docs/palace-usb-package/seeds /e/seeds

AWAITING:
- Founder approval to copy seeds to USB
- Inbox Manager cron setup (Option A/B/C)
- Golden seeds + token optimization proposal decisions (check inbox)

— Stone (Head 1)`,
      metadata: {
        sales_email_sent_to: "blazerduggar@gmail.com",
        seeds_built: 52,
        total_seeds: 431,
        usb_ready: true,
      },
    },
    0
  );

  console.log("\n=== FOUNDER STATUS ALERT ===");
  console.log("Success:", alertResult.success);
  console.log("Alert ID:", alertResult.alertId);
  if (alertResult.error) {
    console.log("Error:", alertResult.error);
  }
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
