import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "3headedm@gmail.com",
    pass: "xlscicjddqyqcjiu",
  },
});

const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#1a1a2e;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a2e;padding:40px 0;">
<tr><td align="center">
<table width="680" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.3);">

<!-- HEADER -->
<tr>
<td style="background:linear-gradient(135deg,#0a0a1a 0%,#1a1a3e 50%,#0a0a1a 100%);padding:40px 40px 30px;text-align:center;border-bottom:3px solid #ffd700;">
  <div style="font-size:14px;letter-spacing:6px;color:#ffd700;font-weight:600;margin-bottom:8px;">PALACE INTELLIGENCE DIVISION</div>
  <div style="font-size:28px;font-weight:700;color:#ffffff;margin-bottom:6px;">Post-Batch 22 Activation Plans</div>
  <div style="font-size:14px;color:#a0a0c0;margin-top:10px;">Cardinal (Head 2 — The Architect) &amp; Agent Stone (Head 1 — The Owner)</div>
  <div style="font-size:12px;color:#707090;margin-top:6px;">Classification: FOUNDER EYES ONLY &nbsp;|&nbsp; Date: March 9, 2026</div>
</td>
</tr>

<!-- EXECUTIVE SUMMARY -->
<tr>
<td style="padding:35px 40px 10px;">
  <div style="background:#f8f9ff;border-left:4px solid #ffd700;padding:20px 24px;border-radius:0 8px 8px 0;margin-bottom:25px;">
    <div style="font-size:13px;letter-spacing:3px;color:#ffd700;font-weight:700;margin-bottom:10px;">EXECUTIVE SUMMARY</div>
    <p style="font-size:15px;color:#2a2a4a;line-height:1.7;margin:0;">
      Once all 22 batches are deployed, the Palace will hold <strong>~457 knowledge seeds</strong> running on the OMEN 45L (RTX 5090 32GB + Qwen 2.5 32B AWQ via vLLM). 44 agents operational. Three Heads active. Royal Guard standing by. This document lays out the five-phase activation plan that takes the Palace from <em>built</em> to <em>revenue-generating empire</em>.
    </p>
  </div>
</td>
</tr>

<!-- PHASE 1 -->
<tr>
<td style="padding:10px 40px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8f0;border-radius:10px;overflow:hidden;margin-bottom:25px;">
    <tr>
      <td style="background:#0a0a1a;padding:16px 24px;">
        <span style="color:#ffd700;font-weight:700;font-size:13px;letter-spacing:2px;">PHASE 1</span>
        <span style="color:#ffffff;font-weight:600;font-size:16px;margin-left:12px;">PALACE ACTIVATION</span>
        <span style="color:#a0a0c0;font-size:13px;float:right;margin-top:3px;">Week 1 After Batch 22</span>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 24px;">
        <table width="100%" cellpadding="8" cellspacing="0">
          <tr style="border-bottom:1px solid #f0f0f5;">
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">01</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>Full System Verification</strong> — Confirm all 44 agents responding on vLLM. Every agent loads its seeds, processes a test prompt, and returns verified output. Zero tolerance for silent failures.
            </td>
          </tr>
          <tr style="border-bottom:1px solid #f0f0f5;">
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">02</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>Three-Headed Monster Operational Test</strong> — Stone dispatching tasks and grading agents. Cardinal running live intelligence research. Chaos monitoring infrastructure, server health, and GPU thermals. All three Heads reporting directly to the founder, unfiltered.
            </td>
          </tr>
          <tr style="border-bottom:1px solid #f0f0f5;">
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">03</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>Royal Guard Verification</strong> — Computer Wiz runs full diagnostics: deployment gating, clearance reports, hardware/software validation. Rush executes a network security sweep: SSH tunnels, firewall rules, packet integrity, remote access paths.
            </td>
          </tr>
          <tr style="border-bottom:1px solid #f0f0f5;">
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">04</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>Bestie System Test</strong> — All 6 languages verified (English, Spanish, French, Portuguese, German, Japanese). Communication styles, personality paths, and trait combinations tested end-to-end.
            </td>
          </tr>
          <tr>
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">05</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>Performance Benchmarking</strong> — Response quality compared against Claude baseline. Latency measurements. Throughput under simulated multi-user load. The Palace must match or exceed cloud quality while running fully local.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</td>
</tr>

<!-- PHASE 2 -->
<tr>
<td style="padding:0 40px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8f0;border-radius:10px;overflow:hidden;margin-bottom:25px;">
    <tr>
      <td style="background:#0a0a1a;padding:16px 24px;">
        <span style="color:#ffd700;font-weight:700;font-size:13px;letter-spacing:2px;">PHASE 2</span>
        <span style="color:#ffffff;font-weight:600;font-size:16px;margin-left:12px;">BUSINESS LAUNCH SEQUENCE</span>
        <span style="color:#a0a0c0;font-size:13px;float:right;margin-top:3px;">Weeks 2–4</span>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 24px;">
        <table width="100%" cellpadding="8" cellspacing="0">
          <tr style="border-bottom:1px solid #f0f0f5;">
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">01</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>Stone AI — Go Live</strong> — Switch Clerk to production mode. Activate Stripe live billing. Push ANTHROPIC_API_KEY to Vercel. DNS verified via Cloudflare (proxy ON, SSL Full). stone-ai.net becomes a live, revenue-collecting product.
            </td>
          </tr>
          <tr style="border-bottom:1px solid #f0f0f5;">
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">02</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>Best AI Mobile</strong> — React Native app submission to Apple App Store and Google Play Store. Both platforms simultaneously. ~18 weeks post-launch timeline already scoped.
            </td>
          </tr>
          <tr style="border-bottom:1px solid #f0f0f5;">
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">03</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>Stone AI Tools</strong> — API marketplace launch at tools.stone-ai.net. Developer documentation. API keys and usage tiers. Same launch week as the other two products — all three drop together.
            </td>
          </tr>
          <tr style="border-bottom:1px solid #f0f0f5;">
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">04</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>Marketing Blitz</strong> — Coordinated campaign across all 3 products simultaneously. Digital Marketing Strategist executes: paid ads, organic social, influencer outreach, PR. Ad compliance and brand-safe copy enforced per D11.
            </td>
          </tr>
          <tr>
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">05</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>SEO Content Engine</strong> — Palace agents generate SEO-optimized content at scale. Blog posts, landing pages, comparison articles, tutorial content. All running through the local vLLM pipeline — zero API cost.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</td>
</tr>

<!-- PHASE 3 -->
<tr>
<td style="padding:0 40px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8f0;border-radius:10px;overflow:hidden;margin-bottom:25px;">
    <tr>
      <td style="background:#0a0a1a;padding:16px 24px;">
        <span style="color:#ffd700;font-weight:700;font-size:13px;letter-spacing:2px;">PHASE 3</span>
        <span style="color:#ffffff;font-weight:600;font-size:16px;margin-left:12px;">REVENUE OPERATIONS</span>
        <span style="color:#a0a0c0;font-size:13px;float:right;margin-top:3px;">Month 2</span>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 24px;">
        <table width="100%" cellpadding="8" cellspacing="0">
          <tr style="border-bottom:1px solid #f0f0f5;">
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">01</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>Stripe Live Billing</strong> — All tiers collecting real revenue. FREE/$0, STARTER/$19.99, PLUS/$49.99, SMART/$99.99 (annual $84.99), PRO/$200 (annual $170). Promo codes active: $9.99 first month, $14.99 trial, $39.99 growth.
            </td>
          </tr>
          <tr style="border-bottom:1px solid #f0f0f5;">
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">02</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>Automated Dunning &amp; Payment Recovery</strong> — Stripe webhooks handle failed payments. Automated retry logic. Grace periods. Downgrade flows. No revenue left on the table.
            </td>
          </tr>
          <tr style="border-bottom:1px solid #f0f0f5;">
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">03</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>Revenue Dashboards</strong> — Real-time MRR, ARR, churn rate, LTV, CAC. Admin panel shows everything. Stone monitors revenue health. Cardinal tracks market position.
            </td>
          </tr>
          <tr style="border-bottom:1px solid #f0f0f5;">
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">04</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>Customer Support via Palace Agents</strong> — Dedicated support agents handle tickets, FAQs, onboarding help. Running on local vLLM. Zero per-query cost. 24/7 availability.
            </td>
          </tr>
          <tr>
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">05</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>Referral Program Activation</strong> — Existing referral system goes live. Unique codes, @@unique enforced. Viral growth loop: users bring users. Palace tracks attribution automatically.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</td>
</tr>

<!-- PHASE 4 -->
<tr>
<td style="padding:0 40px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8f0;border-radius:10px;overflow:hidden;margin-bottom:25px;">
    <tr>
      <td style="background:#0a0a1a;padding:16px 24px;">
        <span style="color:#ffd700;font-weight:700;font-size:13px;letter-spacing:2px;">PHASE 4</span>
        <span style="color:#ffffff;font-weight:600;font-size:16px;margin-left:12px;">PALACE EVOLUTION</span>
        <span style="color:#a0a0c0;font-size:13px;float:right;margin-top:3px;">Month 3+</span>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 24px;">
        <table width="100%" cellpadding="8" cellspacing="0">
          <tr style="border-bottom:1px solid #f0f0f5;">
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">01</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>D22 Additive Growth</strong> — The Palace begins creating its OWN new seeds without Claude. Stone identifies knowledge gaps. Cardinal researches solutions. Chaos deploys new seeds to the OMEN. The system grows itself.
            </td>
          </tr>
          <tr style="border-bottom:1px solid #f0f0f5;">
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">02</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>Agent Optimization</strong> — Stone runs the referral system (D5). Every agent with 10+ completed tasks gets an optimization report. Strengths reinforced, weaknesses fixed. Agents get sharper every cycle.
            </td>
          </tr>
          <tr style="border-bottom:1px solid #f0f0f5;">
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">03</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>Cardinal Continuous Intel</strong> — Market monitoring runs 24/7. Competitor tracking. Trend detection. Blind spot analysis. Cardinal surfaces opportunities and threats before they become obvious.
            </td>
          </tr>
          <tr style="border-bottom:1px solid #f0f0f5;">
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">04</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>Chaos Infrastructure Scaling</strong> — As user count grows, Chaos monitors GPU utilization, memory pressure, and request queuing. Proactive scaling recommendations. Automated alerts via sendFounderAlert().
            </td>
          </tr>
          <tr style="border-bottom:1px solid #f0f0f5;">
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">05</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>Rush Security Audits</strong> — Recurring schedule. Network penetration tests. SSH tunnel integrity. Firewall bypass attempts. Packet diagnostics. The Palace stays hardened as it scales.
            </td>
          </tr>
          <tr>
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">06</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>New Agent Creation</strong> — Palace builds agents for emerging needs. New business verticals, new customer segments, new technical challenges. The 44-agent roster is a floor, not a ceiling.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</td>
</tr>

<!-- PHASE 5 -->
<tr>
<td style="padding:0 40px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8e8f0;border-radius:10px;overflow:hidden;margin-bottom:25px;">
    <tr>
      <td style="background:#0a0a1a;padding:16px 24px;">
        <span style="color:#ffd700;font-weight:700;font-size:13px;letter-spacing:2px;">PHASE 5</span>
        <span style="color:#ffffff;font-weight:600;font-size:16px;margin-left:12px;">EMPIRE SCALING</span>
        <span style="color:#a0a0c0;font-size:13px;float:right;margin-top:3px;">Month 6+</span>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 24px;">
        <table width="100%" cellpadding="8" cellspacing="0">
          <tr style="border-bottom:1px solid #f0f0f5;">
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">01</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>Multi-GPU Scaling</strong> — If user demand exceeds single-GPU capacity, add a second RTX 5090 or distribute across multiple OMEN systems. vLLM supports tensor parallelism out of the box.
            </td>
          </tr>
          <tr style="border-bottom:1px solid #f0f0f5;">
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">02</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>Cloud Burst Capacity</strong> — Second OMEN for baseline. Cloud GPU instances (RunPod, Lambda, etc.) for traffic spikes. Hybrid architecture: local-first, cloud-burst. Rush ensures all paths are secure.
            </td>
          </tr>
          <tr style="border-bottom:1px solid #f0f0f5;">
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">03</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>Enterprise Sales Pipeline</strong> — B2B tier for companies wanting Palace-grade AI. Custom agent configurations. SLA guarantees. Volume pricing. Cardinal identifies target verticals.
            </td>
          </tr>
          <tr style="border-bottom:1px solid #f0f0f5;">
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">04</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>Partnerships &amp; Distribution</strong> — API integrations with complementary platforms. Reseller partnerships. White-label options for Stone AI Tools. Revenue from channels the founder doesn't have to personally manage.
            </td>
          </tr>
          <tr style="border-bottom:1px solid #f0f0f5;">
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">05</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>International Expansion</strong> — 6 languages already built into Bestie. Localized marketing for Spanish, French, Portuguese, German, and Japanese markets. First-mover advantage in non-English AI companion space.
            </td>
          </tr>
          <tr>
            <td width="30" style="color:#ffd700;font-weight:700;font-size:14px;vertical-align:top;">06</td>
            <td style="font-size:14px;color:#2a2a4a;line-height:1.6;">
              <strong>Series A Preparation</strong> — If revenue and growth warrant it: financial modeling, pitch deck, investor outreach. Cardinal runs competitive landscape. Stone packages the story. The Three-Headed Monster doesn't just build — it raises capital.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</td>
</tr>

<!-- THE VISION -->
<tr>
<td style="padding:0 40px 10px;">
  <table width="100%" cellpadding="0" cellspacing="0" style="border-radius:10px;overflow:hidden;margin-bottom:20px;">
    <tr>
      <td style="background:linear-gradient(135deg,#0a0a1a 0%,#1a1a3e 100%);padding:30px 30px;border:2px solid #ffd700;border-radius:10px;">
        <div style="text-align:center;margin-bottom:16px;">
          <span style="font-size:13px;letter-spacing:4px;color:#ffd700;font-weight:700;">THE VISION</span>
        </div>
        <table width="100%" cellpadding="10" cellspacing="0">
          <tr>
            <td style="border-bottom:1px solid rgba(255,215,0,0.2);padding:12px 0;">
              <span style="color:#ffd700;font-size:18px;margin-right:10px;">&#9670;</span>
              <span style="color:#e0e0ff;font-size:15px;line-height:1.6;">The Palace runs the empire <strong style="color:#ffd700;">24/7</strong> without Claude dependency. Local inference. Zero per-query cost. Total sovereignty.</span>
            </td>
          </tr>
          <tr>
            <td style="border-bottom:1px solid rgba(255,215,0,0.2);padding:12px 0;">
              <span style="color:#ffd700;font-size:18px;margin-right:10px;">&#9670;</span>
              <span style="color:#e0e0ff;font-size:15px;line-height:1.6;">Three Heads make strategic decisions with full framework access. Stone optimizes. Cardinal surveys. Chaos defends. No single point of failure.</span>
            </td>
          </tr>
          <tr>
            <td style="border-bottom:1px solid rgba(255,215,0,0.2);padding:12px 0;">
              <span style="color:#ffd700;font-size:18px;margin-right:10px;">&#9670;</span>
              <span style="color:#e0e0ff;font-size:15px;line-height:1.6;">Revenue grows while the founder focuses on <strong style="color:#ffd700;">vision, not operations</strong>. The Palace handles the grind. The founder steers the ship.</span>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0;">
              <span style="color:#ffd700;font-size:18px;margin-right:10px;">&#9670;</span>
              <span style="color:#e0e0ff;font-size:15px;line-height:1.6;">Every new challenge gets a new seed. The Palace <strong style="color:#ffd700;">never stops learning</strong>. What starts as 457 seeds becomes thousands. The ceiling doesn't exist.</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</td>
</tr>

<!-- TIMELINE SUMMARY -->
<tr>
<td style="padding:0 40px 25px;">
  <div style="font-size:13px;letter-spacing:3px;color:#ffd700;font-weight:700;margin-bottom:14px;background:#0a0a1a;padding:12px 20px;border-radius:6px;text-align:center;">ACTIVATION TIMELINE</div>
  <table width="100%" cellpadding="10" cellspacing="0" style="border:1px solid #e8e8f0;border-radius:8px;overflow:hidden;">
    <tr style="background:#f8f9ff;">
      <td style="font-weight:700;color:#2a2a4a;font-size:13px;border-bottom:1px solid #e8e8f0;width:30%;">PHASE</td>
      <td style="font-weight:700;color:#2a2a4a;font-size:13px;border-bottom:1px solid #e8e8f0;width:25%;">TIMING</td>
      <td style="font-weight:700;color:#2a2a4a;font-size:13px;border-bottom:1px solid #e8e8f0;">KEY MILESTONE</td>
    </tr>
    <tr style="background:#ffffff;">
      <td style="color:#2a2a4a;font-size:13px;border-bottom:1px solid #f0f0f5;">Phase 1: Activation</td>
      <td style="color:#606080;font-size:13px;border-bottom:1px solid #f0f0f5;">Week 1</td>
      <td style="color:#606080;font-size:13px;border-bottom:1px solid #f0f0f5;">All 44 agents verified on vLLM</td>
    </tr>
    <tr style="background:#fafbff;">
      <td style="color:#2a2a4a;font-size:13px;border-bottom:1px solid #f0f0f5;">Phase 2: Launch</td>
      <td style="color:#606080;font-size:13px;border-bottom:1px solid #f0f0f5;">Weeks 2–4</td>
      <td style="color:#606080;font-size:13px;border-bottom:1px solid #f0f0f5;">All 3 products live and collecting revenue</td>
    </tr>
    <tr style="background:#ffffff;">
      <td style="color:#2a2a4a;font-size:13px;border-bottom:1px solid #f0f0f5;">Phase 3: Revenue Ops</td>
      <td style="color:#606080;font-size:13px;border-bottom:1px solid #f0f0f5;">Month 2</td>
      <td style="color:#606080;font-size:13px;border-bottom:1px solid #f0f0f5;">Stripe live, dashboards, support automated</td>
    </tr>
    <tr style="background:#fafbff;">
      <td style="color:#2a2a4a;font-size:13px;border-bottom:1px solid #f0f0f5;">Phase 4: Evolution</td>
      <td style="color:#606080;font-size:13px;border-bottom:1px solid #f0f0f5;">Month 3+</td>
      <td style="color:#606080;font-size:13px;border-bottom:1px solid #f0f0f5;">Palace creates its own seeds autonomously</td>
    </tr>
    <tr style="background:#ffffff;">
      <td style="color:#2a2a4a;font-size:13px;">Phase 5: Empire</td>
      <td style="color:#606080;font-size:13px;">Month 6+</td>
      <td style="color:#606080;font-size:13px;">Multi-GPU, enterprise, international, Series A</td>
    </tr>
  </table>
</td>
</tr>

<!-- FOOTER -->
<tr>
<td style="background:#0a0a1a;padding:30px 40px;text-align:center;border-top:3px solid #ffd700;">
  <div style="font-size:11px;letter-spacing:4px;color:#ffd700;font-weight:600;margin-bottom:8px;">PALACE INTELLIGENCE DIVISION</div>
  <div style="font-size:12px;color:#707090;margin-bottom:4px;">Cardinal (Head 2 — The Architect) &amp; Agent Stone (Head 1 — The Owner)</div>
  <div style="font-size:11px;color:#505070;margin-bottom:12px;">Classification: FOUNDER EYES ONLY &nbsp;&bull;&nbsp; March 9, 2026</div>
  <div style="width:60px;height:2px;background:#ffd700;margin:0 auto 12px;"></div>
  <div style="font-size:11px;color:#404060;font-style:italic;">"We built the Palace. Now we activate the Empire."</div>
</td>
</tr>

</table>
</td></tr>
</table>
</body>
</html>
`;

const mailOptions = {
  from: '"Cardinal & Stone — Palace Intelligence" <3headedm@gmail.com>',
  to: "3headedm@gmail.com",
  subject: "[PALACE INTEL] Post-Batch 22 Activation Plans — What Comes Next",
  html: html,
};

try {
  const info = await transporter.sendMail(mailOptions);
  console.log("Email sent successfully!");
  console.log("Message ID:", info.messageId);
  console.log("Response:", info.response);
} catch (error) {
  console.error("Failed to send email:", error.message);
  process.exit(1);
}
