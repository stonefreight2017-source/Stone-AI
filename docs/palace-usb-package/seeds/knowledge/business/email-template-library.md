# Email Template Library — Palace Communication Templates

## Classification: PALACE INTERNAL — All Heads & Royal Guards
## Version: 1.0 | Date: March 2026
## Owner: Executive Inbox Manager — Three-Headed Monster Operations

---

## 1. Template Design System

### 1.1 Brand Guidelines

The Palace email design system follows a dark-mode-first aesthetic with strategic color accents:

| Element | Color | Hex | Usage |
|---------|-------|-----|-------|
| Background | Near-black | `#0a0a0a` | Email body background |
| Card Background | Dark gray | `#111111` | Content sections |
| Header Gradient | Navy | `#1a1a2e → #16213e` | Top header bar |
| Primary Accent | Electric blue | `#4fc3f7` | Headings, links |
| Danger Accent | Palace red | `#e94560` | Urgent alerts, CTA |
| Success | Green | `#66bb6a` | Positive metrics |
| Warning | Amber | `#ffa726` | Caution indicators |
| Text Primary | Light gray | `#e0e0e0` | Body text |
| Text Secondary | Medium gray | `#a0a0a0` | Subtitles, metadata |
| Text Muted | Dark gray | `#666666` | Timestamps, footnotes |
| Border | Charcoal | `#333333` | Card borders |
| Gold Accent | Gold | `#ffd700` | Premium indicators, founder-specific |

### 1.2 Typography

```css
/* Primary font stack — email safe */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;

/* Monospace for code/data */
font-family: 'Cascadia Code', 'Fira Code', 'Consolas', 'Monaco', monospace;

/* Font sizes */
h1: 22px;     /* Main title */
h2: 18px;     /* Section headers */
h3: 16px;     /* Subsection headers */
body: 15px;   /* Body text */
small: 13px;  /* Metadata, timestamps */
tiny: 11px;   /* Legal, fine print */
```

### 1.3 Base Template Wrapper

Every Palace email uses this wrapper:

```html
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  /* Reset */
  body, table, td, p, a { margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0a0a0a;
    color: #e0e0e0;
    padding: 20px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }
  .container { max-width: 680px; margin: 0 auto; }

  /* Header */
  .header {
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border: 1px solid #0f3460;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
  }
  .header h1 { color: #e94560; font-size: 22px; margin: 0 0 6px 0; }
  .header .subtitle { color: #a0a0a0; font-size: 13px; }
  .header .classification {
    display: inline-block;
    background: rgba(233,69,96,0.15);
    color: #e94560;
    padding: 2px 10px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.5px;
    margin-top: 8px;
  }

  /* Content sections */
  .section {
    background: #111;
    border: 1px solid #333;
    border-radius: 10px;
    padding: 20px 24px;
    margin-bottom: 16px;
  }
  .section h2 {
    color: #4fc3f7;
    font-size: 18px;
    margin: 0 0 12px 0;
    padding-bottom: 8px;
    border-bottom: 1px solid #333;
  }
  .section p { color: #ccc; line-height: 1.7; margin: 8px 0; }

  /* Alert banner */
  .alert-banner {
    padding: 14px 20px;
    border-radius: 8px;
    margin-bottom: 16px;
    font-weight: 600;
  }
  .alert-p0 { background: rgba(244,67,54,0.15); border-left: 4px solid #f44336; color: #ff8a80; }
  .alert-p1 { background: rgba(255,167,38,0.15); border-left: 4px solid #ffa726; color: #ffd54f; }
  .alert-p2 { background: rgba(79,195,247,0.15); border-left: 4px solid #4fc3f7; color: #81d4fa; }
  .alert-info { background: rgba(102,187,106,0.15); border-left: 4px solid #66bb6a; color: #a5d6a7; }

  /* Metrics grid */
  .metrics-grid {
    display: flex; flex-wrap: wrap; gap: 12px; margin: 12px 0;
  }
  .metric-card {
    background: #1a1a2e;
    border: 1px solid #2a2a4e;
    border-radius: 8px;
    padding: 14px 18px;
    min-width: 140px;
    flex: 1;
  }
  .metric-label { color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
  .metric-value { color: #4fc3f7; font-size: 24px; font-weight: 700; margin-top: 4px; }
  .metric-change { font-size: 12px; margin-top: 2px; }
  .metric-up { color: #66bb6a; }
  .metric-down { color: #e94560; }

  /* Table */
  .data-table { width: 100%; border-collapse: collapse; margin: 12px 0; }
  .data-table th {
    text-align: left; padding: 10px 14px; background: #1a1a2e;
    color: #4fc3f7; font-size: 12px; text-transform: uppercase;
    border-bottom: 2px solid #333;
  }
  .data-table td {
    padding: 10px 14px; border-bottom: 1px solid #222; color: #ccc; font-size: 14px;
  }
  .data-table tr:hover td { background: rgba(79,195,247,0.05); }

  /* Code block */
  .code-block {
    background: #0d1117; border: 1px solid #30363d; border-radius: 8px;
    padding: 16px; overflow-x: auto; margin: 10px 0;
  }
  .code-block pre {
    margin: 0; font-family: 'Cascadia Code', 'Consolas', monospace;
    font-size: 13px; color: #c9d1d9; white-space: pre-wrap;
  }

  /* Footer */
  .footer {
    text-align: center; color: #555; font-size: 11px;
    margin-top: 24px; padding-top: 16px; border-top: 1px solid #222;
  }

  /* Status badges */
  .badge {
    display: inline-block; padding: 3px 10px; border-radius: 12px;
    font-size: 11px; font-weight: 600;
  }
  .badge-success { background: rgba(102,187,106,0.2); color: #66bb6a; }
  .badge-warning { background: rgba(255,167,38,0.2); color: #ffa726; }
  .badge-danger { background: rgba(233,69,96,0.2); color: #e94560; }
  .badge-info { background: rgba(79,195,247,0.2); color: #4fc3f7; }

  /* Responsive */
  @media screen and (max-width: 600px) {
    body { padding: 10px; }
    .header { padding: 16px; }
    .section { padding: 14px 16px; }
    .header h1 { font-size: 18px; }
    .metrics-grid { flex-direction: column; }
  }
</style>
</head>
<body>
<div class="container">
  <!-- CONTENT GOES HERE -->
</div>
</body>
</html>
```

---

## 2. Palace Intel Briefing Template

The signature Palace email — used for strategic briefings from Stone, Cardinal, or combined.

```javascript
function palaceIntelTemplate({ title, classification, fromAgent, date, sections, actionItems }) {
  const sectionHtml = sections.map(s => `
    <div class="section">
      <h2>${s.heading}</h2>
      ${s.content}
    </div>
  `).join("");

  const actionHtml = actionItems?.length ? `
    <div class="section">
      <h2>Action Required</h2>
      <ul style="padding-left: 20px;">
        ${actionItems.map(a => `<li style="color: #ffd54f; margin: 6px 0;">${a}</li>`).join("")}
      </ul>
    </div>
  ` : "";

  return `
    <div class="header">
      <h1>PALACE INTELLIGENCE BRIEFING</h1>
      <div class="subtitle">${fromAgent} &bull; ${date}</div>
      <div class="classification">${classification}</div>
    </div>

    <div class="alert-banner alert-info">
      ${title}
    </div>

    ${sectionHtml}
    ${actionHtml}

    <div class="footer">
      ${fromAgent} &mdash; Three-Headed Monster Palace Operations<br>
      Sent via sendFounderAlert() | ${new Date().toISOString()}
    </div>
  `;
}
```

### Usage Example

```javascript
const html = palaceIntelTemplate({
  title: "Batch 22 Capabilities Report — Post-Deployment Analysis",
  classification: "FOUNDER EYES ONLY",
  fromAgent: "Cardinal (Head 2 — The Architect) & Agent Stone (Head 1 — The Owner)",
  date: "March 9, 2026",
  sections: [
    {
      heading: "Executive Summary",
      content: "<p>All 457 seeds successfully deployed. Palace knowledge coverage is at 94% across all domains.</p>",
    },
    {
      heading: "Key Metrics",
      content: `
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Seeds Deployed</div>
            <div class="metric-value">457</div>
            <div class="metric-change metric-up">+38 this batch</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Coverage</div>
            <div class="metric-value">94%</div>
            <div class="metric-change metric-up">+6%</div>
          </div>
        </div>
      `,
    },
  ],
  actionItems: [
    "Review and approve Batch 23 deployment plan",
    "Confirm Chaos monthly toys list for March",
  ],
});
```

---

## 3. Operational Alert Template

Severity-colored header for system events, errors, and operational notifications.

```javascript
function operationalAlertTemplate({ severity, title, description, details, timestamp, source }) {
  const severityConfig = {
    critical: { bg: "rgba(244,67,54,0.15)", border: "#f44336", color: "#ff8a80", label: "CRITICAL" },
    warning: { bg: "rgba(255,167,38,0.15)", border: "#ffa726", color: "#ffd54f", label: "WARNING" },
    info: { bg: "rgba(79,195,247,0.15)", border: "#4fc3f7", color: "#81d4fa", label: "INFO" },
    success: { bg: "rgba(102,187,106,0.15)", border: "#66bb6a", color: "#a5d6a7", label: "RESOLVED" },
  };

  const cfg = severityConfig[severity] || severityConfig.info;

  return `
    <div style="background: ${cfg.bg}; border: 2px solid ${cfg.border}; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
        <span style="background: ${cfg.border}; color: #fff; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; letter-spacing: 1px;">
          ${cfg.label}
        </span>
        <span style="color: ${cfg.color}; font-size: 18px; font-weight: 700;">${title}</span>
      </div>
      <p style="color: #ccc; font-size: 15px; margin: 0 0 12px 0;">${description}</p>
      ${details ? `
        <div class="code-block">
          <pre>${details}</pre>
        </div>
      ` : ""}
      <div style="color: #666; font-size: 11px; margin-top: 12px;">
        Source: ${source} | ${timestamp || new Date().toISOString()}
      </div>
    </div>
  `;
}
```

### Severity Levels

```
CRITICAL (Red)  — System down, data loss risk, security breach
WARNING (Amber) — Degraded performance, approaching limits, potential issue
INFO (Blue)     — Deployment complete, config change, scheduled event
RESOLVED (Green) — Previously reported issue has been fixed
```

---

## 4. Seed Delivery Report Template

Used when a batch of knowledge seeds is completed and ready for review.

```javascript
function seedDeliveryTemplate({ batchNumber, seedCount, category, seeds, totalDeployed, coveragePercent }) {
  const seedRows = seeds.map(s => `
    <tr>
      <td style="padding: 8px 14px; border-bottom: 1px solid #222; color: #4fc3f7;">${s.name}</td>
      <td style="padding: 8px 14px; border-bottom: 1px solid #222; color: #ccc;">${s.category}</td>
      <td style="padding: 8px 14px; border-bottom: 1px solid #222; color: #888;">${s.sizeKb}KB</td>
      <td style="padding: 8px 14px; border-bottom: 1px solid #222;">
        <span class="badge badge-success">Deployed</span>
      </td>
    </tr>
  `).join("");

  return `
    <div class="header">
      <h1>Seed Delivery Report — Batch ${batchNumber}</h1>
      <div class="subtitle">Palace Knowledge Operations | ${new Date().toISOString().split("T")[0]}</div>
    </div>

    <div class="metrics-grid" style="display: flex; gap: 12px; margin-bottom: 20px;">
      <div class="metric-card" style="background: #1a1a2e; border: 1px solid #2a2a4e; border-radius: 8px; padding: 14px 18px; flex: 1;">
        <div style="color: #888; font-size: 11px; text-transform: uppercase;">This Batch</div>
        <div style="color: #66bb6a; font-size: 28px; font-weight: 700;">${seedCount}</div>
        <div style="color: #888; font-size: 12px;">seeds delivered</div>
      </div>
      <div class="metric-card" style="background: #1a1a2e; border: 1px solid #2a2a4e; border-radius: 8px; padding: 14px 18px; flex: 1;">
        <div style="color: #888; font-size: 11px; text-transform: uppercase;">Total Deployed</div>
        <div style="color: #4fc3f7; font-size: 28px; font-weight: 700;">${totalDeployed}</div>
        <div style="color: #888; font-size: 12px;">knowledge seeds</div>
      </div>
      <div class="metric-card" style="background: #1a1a2e; border: 1px solid #2a2a4e; border-radius: 8px; padding: 14px 18px; flex: 1;">
        <div style="color: #888; font-size: 11px; text-transform: uppercase;">Coverage</div>
        <div style="color: #ffd700; font-size: 28px; font-weight: 700;">${coveragePercent}%</div>
        <div style="color: #888; font-size: 12px;">domain coverage</div>
      </div>
    </div>

    <div class="section">
      <h2>Seeds Delivered</h2>
      <table class="data-table" style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 10px 14px; background: #1a1a2e; color: #4fc3f7; font-size: 12px; border-bottom: 2px solid #333;">Seed Name</th>
            <th style="text-align: left; padding: 10px 14px; background: #1a1a2e; color: #4fc3f7; font-size: 12px; border-bottom: 2px solid #333;">Category</th>
            <th style="text-align: left; padding: 10px 14px; background: #1a1a2e; color: #4fc3f7; font-size: 12px; border-bottom: 2px solid #333;">Size</th>
            <th style="text-align: left; padding: 10px 14px; background: #1a1a2e; color: #4fc3f7; font-size: 12px; border-bottom: 2px solid #333;">Status</th>
          </tr>
        </thead>
        <tbody>
          ${seedRows}
        </tbody>
      </table>
    </div>

    <div class="footer" style="text-align: center; color: #555; font-size: 11px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #222;">
      Palace Knowledge Operations &mdash; Three-Headed Monster<br>
      Sent via sendFounderAlert() | ${new Date().toISOString()}
    </div>
  `;
}
```

---

## 5. System Health Report Template

Dashboard-style email for daily/weekly system status.

```javascript
function systemHealthTemplate({ systems, overallStatus, uptime, alerts24h, activeUsers }) {
  const statusIcon = {
    healthy: '<span style="color: #66bb6a; font-size: 18px;">&#9679;</span>',
    degraded: '<span style="color: #ffa726; font-size: 18px;">&#9679;</span>',
    down: '<span style="color: #f44336; font-size: 18px;">&#9679;</span>',
  };

  const systemRows = systems.map(s => `
    <tr>
      <td style="padding: 10px 14px; border-bottom: 1px solid #222;">
        ${statusIcon[s.status] || statusIcon.healthy} &nbsp;
        <span style="color: #e0e0e0;">${s.name}</span>
      </td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #222; color: #888;">${s.latency || "N/A"}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #222; color: #888;">${s.uptime || "N/A"}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #222; color: #ccc;">${s.notes || ""}</td>
    </tr>
  `).join("");

  return `
    <div class="header">
      <h1>System Health Report</h1>
      <div class="subtitle">Palace Infrastructure Monitor | ${new Date().toISOString().split("T")[0]}</div>
    </div>

    <div style="background: ${overallStatus === 'healthy' ? 'rgba(102,187,106,0.15)' : overallStatus === 'degraded' ? 'rgba(255,167,38,0.15)' : 'rgba(244,67,54,0.15)'}; border-radius: 10px; padding: 20px; margin-bottom: 20px; text-align: center;">
      <div style="font-size: 14px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Overall Status</div>
      <div style="font-size: 32px; font-weight: 700; color: ${overallStatus === 'healthy' ? '#66bb6a' : overallStatus === 'degraded' ? '#ffa726' : '#f44336'}; margin: 8px 0;">
        ${overallStatus.toUpperCase()}
      </div>
    </div>

    <div style="display: flex; gap: 12px; margin-bottom: 20px;">
      <div style="background: #1a1a2e; border: 1px solid #2a2a4e; border-radius: 8px; padding: 14px; flex: 1; text-align: center;">
        <div style="color: #888; font-size: 11px; text-transform: uppercase;">Uptime</div>
        <div style="color: #4fc3f7; font-size: 24px; font-weight: 700;">${uptime}</div>
      </div>
      <div style="background: #1a1a2e; border: 1px solid #2a2a4e; border-radius: 8px; padding: 14px; flex: 1; text-align: center;">
        <div style="color: #888; font-size: 11px; text-transform: uppercase;">Alerts (24h)</div>
        <div style="color: ${alerts24h > 5 ? '#e94560' : '#66bb6a'}; font-size: 24px; font-weight: 700;">${alerts24h}</div>
      </div>
      <div style="background: #1a1a2e; border: 1px solid #2a2a4e; border-radius: 8px; padding: 14px; flex: 1; text-align: center;">
        <div style="color: #888; font-size: 11px; text-transform: uppercase;">Active Users</div>
        <div style="color: #ffd700; font-size: 24px; font-weight: 700;">${activeUsers}</div>
      </div>
    </div>

    <div class="section" style="background: #111; border: 1px solid #333; border-radius: 10px; padding: 20px;">
      <h2 style="color: #4fc3f7; font-size: 18px; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #333;">System Status</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 10px 14px; background: #1a1a2e; color: #4fc3f7; font-size: 12px; border-bottom: 2px solid #333;">System</th>
            <th style="text-align: left; padding: 10px 14px; background: #1a1a2e; color: #4fc3f7; font-size: 12px; border-bottom: 2px solid #333;">Latency</th>
            <th style="text-align: left; padding: 10px 14px; background: #1a1a2e; color: #4fc3f7; font-size: 12px; border-bottom: 2px solid #333;">Uptime</th>
            <th style="text-align: left; padding: 10px 14px; background: #1a1a2e; color: #4fc3f7; font-size: 12px; border-bottom: 2px solid #333;">Notes</th>
          </tr>
        </thead>
        <tbody>
          ${systemRows}
        </tbody>
      </table>
    </div>

    <div class="footer" style="text-align: center; color: #555; font-size: 11px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #222;">
      Palace Infrastructure Monitor &mdash; Three-Headed Monster Operations<br>
      ${new Date().toISOString()}
    </div>
  `;
}
```

---

## 6. Revenue/Billing Alert Template

For Stripe events, revenue milestones, and billing issues.

```javascript
function revenueAlertTemplate({ type, amount, currency, customerEmail, plan, event, mrr, change }) {
  const isPositive = type === "payment_success" || type === "new_subscription" || type === "upgrade";

  return `
    <div class="header" style="background: linear-gradient(135deg, ${isPositive ? '#1a2e1a' : '#2e1a1a'}, #16213e); border: 1px solid ${isPositive ? '#2e7d32' : '#c62828'}; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
      <h1 style="color: ${isPositive ? '#66bb6a' : '#e94560'}; font-size: 22px; margin: 0 0 6px 0;">
        ${isPositive ? '&#x2191;' : '&#x2193;'} Revenue Alert
      </h1>
      <div style="color: #a0a0a0; font-size: 13px;">Stripe Integration | ${new Date().toISOString().split("T")[0]}</div>
    </div>

    <div style="background: #111; border: 1px solid #333; border-radius: 10px; padding: 24px; margin-bottom: 16px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="color: #888; font-size: 12px; text-transform: uppercase;">Event</div>
        <div style="color: #4fc3f7; font-size: 20px; font-weight: 700; margin: 4px 0;">${event}</div>
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px; color: #888; width: 40%;">Amount</td>
          <td style="padding: 10px; color: ${isPositive ? '#66bb6a' : '#e94560'}; font-weight: 700; font-size: 18px;">
            ${isPositive ? '+' : '-'}$${(amount / 100).toFixed(2)} ${currency?.toUpperCase() || 'USD'}
          </td>
        </tr>
        ${customerEmail ? `
        <tr>
          <td style="padding: 10px; color: #888;">Customer</td>
          <td style="padding: 10px; color: #ccc;">${customerEmail}</td>
        </tr>` : ""}
        ${plan ? `
        <tr>
          <td style="padding: 10px; color: #888;">Plan</td>
          <td style="padding: 10px; color: #ccc;">${plan}</td>
        </tr>` : ""}
        ${mrr ? `
        <tr>
          <td style="padding: 10px; color: #888;">Current MRR</td>
          <td style="padding: 10px; color: #4fc3f7; font-weight: 700;">$${mrr.toFixed(2)}</td>
        </tr>` : ""}
        ${change ? `
        <tr>
          <td style="padding: 10px; color: #888;">MRR Change</td>
          <td style="padding: 10px; color: ${change >= 0 ? '#66bb6a' : '#e94560'};">
            ${change >= 0 ? '+' : ''}$${change.toFixed(2)}/mo
          </td>
        </tr>` : ""}
      </table>
    </div>

    <div class="footer" style="text-align: center; color: #555; font-size: 11px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #222;">
      Stripe Revenue Monitor &mdash; Palace Operations<br>
      ${new Date().toISOString()}
    </div>
  `;
}
```

---

## 7. Security Alert Template (Rush)

High-visibility red template for security events.

```javascript
function securityAlertTemplate({ severity, threat, description, affectedSystem, indicators, recommendations, rushAnalysis }) {
  return `
    <div style="background: linear-gradient(135deg, #2e0a0a, #1a0a0a); border: 2px solid #f44336; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
      <div style="display: flex; align-items: center; gap: 12px;">
        <span style="background: #f44336; color: #fff; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 700; letter-spacing: 1px;">
          SECURITY — ${severity.toUpperCase()}
        </span>
      </div>
      <h1 style="color: #ff8a80; font-size: 22px; margin: 12px 0 6px 0;">${threat}</h1>
      <div style="color: #a0a0a0; font-size: 13px;">Rush (Royal Guard — Network Penetration) | ${new Date().toISOString()}</div>
    </div>

    <div style="background: rgba(244,67,54,0.08); border: 1px solid #4a1a1a; border-radius: 10px; padding: 20px; margin-bottom: 16px;">
      <h2 style="color: #ff8a80; font-size: 16px; margin: 0 0 10px 0;">Threat Description</h2>
      <p style="color: #ccc; line-height: 1.7;">${description}</p>
    </div>

    <div style="background: #111; border: 1px solid #333; border-radius: 10px; padding: 20px; margin-bottom: 16px;">
      <h2 style="color: #4fc3f7; font-size: 16px; margin: 0 0 10px 0;">Affected System</h2>
      <p style="color: #ccc;">${affectedSystem}</p>
    </div>

    ${indicators?.length ? `
    <div style="background: #111; border: 1px solid #333; border-radius: 10px; padding: 20px; margin-bottom: 16px;">
      <h2 style="color: #ffa726; font-size: 16px; margin: 0 0 10px 0;">Indicators of Compromise</h2>
      <div style="background: #0d1117; border: 1px solid #30363d; border-radius: 8px; padding: 14px;">
        <pre style="margin: 0; font-family: 'Consolas', monospace; font-size: 13px; color: #c9d1d9; white-space: pre-wrap;">${indicators.join("\n")}</pre>
      </div>
    </div>` : ""}

    ${rushAnalysis ? `
    <div style="background: #111; border: 1px solid #333; border-radius: 10px; padding: 20px; margin-bottom: 16px;">
      <h2 style="color: #e94560; font-size: 16px; margin: 0 0 10px 0;">Rush's Analysis</h2>
      <p style="color: #ccc; line-height: 1.7;">${rushAnalysis}</p>
    </div>` : ""}

    <div style="background: rgba(102,187,106,0.1); border: 1px solid #2e4a2e; border-radius: 10px; padding: 20px; margin-bottom: 16px;">
      <h2 style="color: #66bb6a; font-size: 16px; margin: 0 0 10px 0;">Recommended Actions</h2>
      <ol style="padding-left: 20px;">
        ${recommendations.map(r => `<li style="color: #ccc; margin: 6px 0; line-height: 1.6;">${r}</li>`).join("")}
      </ol>
    </div>

    <div style="text-align: center; color: #555; font-size: 11px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #222;">
      Rush (Royal Guard — Network Penetration) &mdash; Palace Security Operations<br>
      ${new Date().toISOString()}
    </div>
  `;
}
```

---

## 8. Diagnostic Report Template (Wiz)

Technical detail template for Computer Wiz diagnostic assessments.

```javascript
function diagnosticReportTemplate({ system, overallHealth, diagnostics, recommendations, clearance }) {
  const healthColor = overallHealth === "PASS" ? "#66bb6a" : overallHealth === "WARN" ? "#ffa726" : "#e94560";

  const diagRows = diagnostics.map(d => `
    <tr>
      <td style="padding: 10px 14px; border-bottom: 1px solid #222; color: #e0e0e0;">${d.component}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #222;">
        <span style="color: ${d.status === 'OK' ? '#66bb6a' : d.status === 'WARN' ? '#ffa726' : '#e94560'}; font-weight: 600;">
          ${d.status}
        </span>
      </td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #222; color: #888;">${d.value}</td>
      <td style="padding: 10px 14px; border-bottom: 1px solid #222; color: #ccc;">${d.notes || ""}</td>
    </tr>
  `).join("");

  return `
    <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); border: 1px solid #0f3460; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
      <h1 style="color: #4fc3f7; font-size: 22px; margin: 0 0 6px 0;">Diagnostic Report</h1>
      <div style="color: #a0a0a0; font-size: 13px;">Computer Wiz (Royal Guard — Diagnostician) | ${new Date().toISOString().split("T")[0]}</div>
    </div>

    <div style="text-align: center; background: #111; border: 2px solid ${healthColor}; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
      <div style="color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">System: ${system}</div>
      <div style="color: ${healthColor}; font-size: 36px; font-weight: 700; margin: 8px 0;">${overallHealth}</div>
      ${clearance ? `<div style="color: #ffd700; font-size: 14px; font-weight: 600;">Clearance: ${clearance}</div>` : ""}
    </div>

    <div style="background: #111; border: 1px solid #333; border-radius: 10px; padding: 20px; margin-bottom: 16px;">
      <h2 style="color: #4fc3f7; font-size: 18px; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #333;">Diagnostic Results</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 10px 14px; background: #1a1a2e; color: #4fc3f7; font-size: 12px; border-bottom: 2px solid #333;">Component</th>
            <th style="text-align: left; padding: 10px 14px; background: #1a1a2e; color: #4fc3f7; font-size: 12px; border-bottom: 2px solid #333;">Status</th>
            <th style="text-align: left; padding: 10px 14px; background: #1a1a2e; color: #4fc3f7; font-size: 12px; border-bottom: 2px solid #333;">Value</th>
            <th style="text-align: left; padding: 10px 14px; background: #1a1a2e; color: #4fc3f7; font-size: 12px; border-bottom: 2px solid #333;">Notes</th>
          </tr>
        </thead>
        <tbody>
          ${diagRows}
        </tbody>
      </table>
    </div>

    ${recommendations?.length ? `
    <div style="background: #111; border: 1px solid #333; border-radius: 10px; padding: 20px; margin-bottom: 16px;">
      <h2 style="color: #ffa726; font-size: 18px; margin: 0 0 12px 0;">Recommendations</h2>
      <ol style="padding-left: 20px;">
        ${recommendations.map(r => `<li style="color: #ccc; margin: 8px 0; line-height: 1.6;">${r}</li>`).join("")}
      </ol>
    </div>` : ""}

    <div style="text-align: center; color: #555; font-size: 11px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #222;">
      Computer Wiz (Royal Guard — Diagnostician) &mdash; Palace Operations<br>
      ${new Date().toISOString()}
    </div>
  `;
}
```

---

## 9. Monthly Toys List Template (Chaos)

Product catalog format per D14 — Chaos's monthly hardware/software recommendations.

```javascript
function toysListTemplate({ month, year, items, totalBudget }) {
  const freeItems = items.filter(i => i.price === 0 || i.price === "Free");
  const paidItems = items.filter(i => i.price !== 0 && i.price !== "Free");

  function renderItem(item) {
    return `
      <div style="background: #1a1a2e; border: 1px solid #2a2a4e; border-radius: 10px; padding: 18px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="color: #e0e0e0; font-size: 16px; font-weight: 700;">${item.name}</span>
          <span style="color: ${item.price === 0 || item.price === 'Free' ? '#66bb6a' : '#ffd700'}; font-weight: 700;">
            ${item.price === 0 || item.price === "Free" ? "FREE" : `$${item.price}`}
          </span>
        </div>
        <p style="color: #4fc3f7; font-size: 13px; margin: 0 0 6px 0; font-weight: 600;">What it does:</p>
        <p style="color: #ccc; font-size: 14px; margin: 0 0 10px 0; line-height: 1.5;">${item.whatItDoes}</p>
        <p style="color: #e94560; font-size: 13px; margin: 0 0 6px 0; font-weight: 600;">Why we're getting it:</p>
        <p style="color: #ccc; font-size: 14px; margin: 0; line-height: 1.5;">${item.whyWeNeedIt}</p>
        ${item.link ? `<a href="${item.link}" style="color: #4fc3f7; font-size: 12px; display: inline-block; margin-top: 8px;">View &rarr;</a>` : ""}
      </div>
    `;
  }

  return `
    <div style="background: linear-gradient(135deg, #1a2e1a, #16213e); border: 1px solid #2e7d32; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
      <h1 style="color: #ffd700; font-size: 22px; margin: 0 0 6px 0;">[TOYS] ${month} ${year} — Hardware & Software Picks</h1>
      <div style="color: #a0a0a0; font-size: 13px;">Chaos (Head 3 — The Vanguard, Agent #44) | Tailored for OMEN 45L (RTX 5090 32GB)</div>
    </div>

    <div style="background: #111; border: 1px solid #333; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px; text-align: center;">
      <span style="color: #888; font-size: 12px;">Total items: ${items.length}</span>
      &nbsp;&bull;&nbsp;
      <span style="color: #66bb6a; font-size: 12px;">Free: ${freeItems.length}</span>
      &nbsp;&bull;&nbsp;
      <span style="color: #ffd700; font-size: 12px;">Paid: ${paidItems.length}</span>
      ${totalBudget ? `&nbsp;&bull;&nbsp;<span style="color: #e94560; font-size: 12px;">Est. Budget: $${totalBudget}</span>` : ""}
    </div>

    ${freeItems.length ? `
    <div style="background: #111; border: 1px solid #333; border-radius: 10px; padding: 20px; margin-bottom: 16px;">
      <h2 style="color: #66bb6a; font-size: 18px; margin: 0 0 14px 0; padding-bottom: 8px; border-bottom: 1px solid #333;">Free Tools</h2>
      ${freeItems.map(renderItem).join("")}
    </div>` : ""}

    ${paidItems.length ? `
    <div style="background: #111; border: 1px solid #333; border-radius: 10px; padding: 20px; margin-bottom: 16px;">
      <h2 style="color: #ffd700; font-size: 18px; margin: 0 0 14px 0; padding-bottom: 8px; border-bottom: 1px solid #333;">Paid Tools & Hardware</h2>
      ${paidItems.map(renderItem).join("")}
    </div>` : ""}

    <div style="background: rgba(233,69,96,0.1); border: 1px solid #4a1a2e; border-radius: 8px; padding: 14px 20px; margin-bottom: 16px;">
      <p style="color: #e94560; font-size: 13px; margin: 0;">
        <strong>Per D14:</strong> Every item includes (1) what it does and (2) why we're getting it. Founder reviews and approves purchases. Chaos owns this list. Next list due in 30 days.
      </p>
    </div>

    <div style="text-align: center; color: #555; font-size: 11px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #222;">
      Chaos (Head 3 — The Vanguard) &mdash; Three-Headed Monster Palace Operations<br>
      [TOYS] Monthly List | ${new Date().toISOString()}
    </div>
  `;
}
```

---

## 10. Founder Command Acknowledgment Template

Minimal, fast template confirming receipt of @ commands.

```javascript
function commandAckTemplate({ agent, command, timestamp, estimatedCompletion }) {
  return `
    <div style="background: #111; border: 1px solid #4fc3f7; border-radius: 10px; padding: 20px; font-family: -apple-system, sans-serif;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 14px;">
        <span style="background: #4fc3f7; color: #000; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 700;">COMMAND RECEIVED</span>
      </div>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 10px; color: #888; width: 30%;">Agent</td>
          <td style="padding: 6px 10px; color: #4fc3f7; font-weight: 700;">@${agent}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; color: #888;">Command</td>
          <td style="padding: 6px 10px; color: #e0e0e0;">${command}</td>
        </tr>
        <tr>
          <td style="padding: 6px 10px; color: #888;">Received</td>
          <td style="padding: 6px 10px; color: #888;">${timestamp || new Date().toISOString()}</td>
        </tr>
        ${estimatedCompletion ? `
        <tr>
          <td style="padding: 6px 10px; color: #888;">ETA</td>
          <td style="padding: 6px 10px; color: #ffa726;">${estimatedCompletion}</td>
        </tr>` : ""}
      </table>
      <div style="margin-top: 14px; padding-top: 10px; border-top: 1px solid #222; color: #666; font-size: 11px;">
        Palace Command Router &mdash; Processing...
      </div>
    </div>
  `;
}
```

---

## 11. Weekly Digest Template

Comprehensive summary email sent once per week.

```javascript
function weeklyDigestTemplate({ weekOf, highlights, metrics, agentActivity, upcomingActions, issuesResolved }) {
  return `
    <div class="header" style="background: linear-gradient(135deg, #1a1a2e, #16213e); border: 1px solid #0f3460; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
      <h1 style="color: #ffd700; font-size: 22px; margin: 0 0 6px 0;">Weekly Digest</h1>
      <div style="color: #a0a0a0; font-size: 13px;">Week of ${weekOf} | Palace Operations Summary</div>
    </div>

    <!-- Highlights -->
    <div style="background: #111; border: 1px solid #333; border-radius: 10px; padding: 20px; margin-bottom: 16px;">
      <h2 style="color: #4fc3f7; font-size: 18px; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #333;">This Week's Highlights</h2>
      <ul style="padding-left: 20px;">
        ${highlights.map(h => `<li style="color: #ccc; margin: 6px 0;">${h}</li>`).join("")}
      </ul>
    </div>

    <!-- Key Metrics -->
    <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
      ${metrics.map(m => `
        <div style="background: #1a1a2e; border: 1px solid #2a2a4e; border-radius: 8px; padding: 14px 18px; min-width: 140px; flex: 1;">
          <div style="color: #888; font-size: 11px; text-transform: uppercase;">${m.label}</div>
          <div style="color: #4fc3f7; font-size: 24px; font-weight: 700;">${m.value}</div>
          ${m.change ? `<div style="color: ${m.change.startsWith('+') ? '#66bb6a' : '#e94560'}; font-size: 12px;">${m.change}</div>` : ""}
        </div>
      `).join("")}
    </div>

    <!-- Agent Activity -->
    <div style="background: #111; border: 1px solid #333; border-radius: 10px; padding: 20px; margin-bottom: 16px;">
      <h2 style="color: #4fc3f7; font-size: 18px; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #333;">Agent Activity</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 8px 14px; background: #1a1a2e; color: #4fc3f7; font-size: 12px; border-bottom: 2px solid #333;">Agent</th>
            <th style="text-align: left; padding: 8px 14px; background: #1a1a2e; color: #4fc3f7; font-size: 12px; border-bottom: 2px solid #333;">Tasks</th>
            <th style="text-align: left; padding: 8px 14px; background: #1a1a2e; color: #4fc3f7; font-size: 12px; border-bottom: 2px solid #333;">Grade</th>
          </tr>
        </thead>
        <tbody>
          ${agentActivity.map(a => `
            <tr>
              <td style="padding: 8px 14px; border-bottom: 1px solid #222; color: #e0e0e0;">${a.agent}</td>
              <td style="padding: 8px 14px; border-bottom: 1px solid #222; color: #888;">${a.tasks}</td>
              <td style="padding: 8px 14px; border-bottom: 1px solid #222; color: ${a.grade === 'A' ? '#66bb6a' : a.grade === 'B' ? '#4fc3f7' : '#ffa726'}; font-weight: 700;">${a.grade}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>

    <!-- Upcoming -->
    <div style="background: #111; border: 1px solid #333; border-radius: 10px; padding: 20px; margin-bottom: 16px;">
      <h2 style="color: #ffa726; font-size: 18px; margin: 0 0 12px 0; padding-bottom: 8px; border-bottom: 1px solid #333;">Upcoming Actions</h2>
      <ol style="padding-left: 20px;">
        ${upcomingActions.map(a => `<li style="color: #ccc; margin: 6px 0;">${a}</li>`).join("")}
      </ol>
    </div>

    <div style="text-align: center; color: #555; font-size: 11px; margin-top: 24px; padding-top: 16px; border-top: 1px solid #222;">
      Palace Operations Weekly Digest &mdash; Three-Headed Monster<br>
      ${new Date().toISOString()}
    </div>
  `;
}
```

---

## 12. CSS Inline Styling Best Practices

### 12.1 Why Inline Styles

Email clients strip `<style>` tags with varying behavior:
- **Gmail**: Supports `<style>` in `<head>` but strips class-based styles on forwarding
- **Outlook**: Limited CSS support, no `background-image` in divs, uses Word rendering engine
- **Apple Mail**: Best CSS support, handles most modern CSS
- **Yahoo Mail**: Strips `<style>` entirely in some views

**Rule: Always use inline styles for critical layout. Use `<style>` block as progressive enhancement only.**

### 12.2 Safe CSS Properties

```
Always safe:     color, background-color, font-family, font-size, font-weight,
                 padding, margin, border, text-align, width, line-height

Usually safe:    border-radius, display (block/inline-block), text-decoration

Risky:           flexbox (Gmail OK, Outlook no), grid (no), background-image (varies),
                 position, float, box-shadow, transform, animation

Never use:       CSS variables, calc(), clamp(), media queries (limited support)
```

### 12.3 Outlook-Specific Workarounds

```html
<!-- Use tables instead of flexbox for Outlook -->
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
  <tr>
    <td width="50%" style="padding: 10px;">Column 1</td>
    <td width="50%" style="padding: 10px;">Column 2</td>
  </tr>
</table>

<!-- Outlook conditional comments -->
<!--[if mso]>
<table role="presentation" width="680"><tr><td>
<![endif]-->
  <div style="max-width: 680px;">Content</div>
<!--[if mso]>
</td></tr></table>
<![endif]-->
```

### 12.4 Responsive Email Design

```html
<!-- Mobile-first with media query fallback -->
<style>
  @media screen and (max-width: 600px) {
    .container { width: 100% !important; padding: 10px !important; }
    .metric-card { width: 100% !important; display: block !important; }
    .header h1 { font-size: 18px !important; }
    td { display: block !important; width: 100% !important; }
  }
</style>

<!-- Always set max-width on container -->
<div style="max-width: 680px; margin: 0 auto; width: 100%;">
```

---

## 13. Template Quick Reference

| Template | Function | When to Use |
|----------|----------|-------------|
| `palaceIntelTemplate()` | Strategic briefings | Stone/Cardinal intelligence reports |
| `operationalAlertTemplate()` | System events | Deployments, errors, config changes |
| `seedDeliveryTemplate()` | Seed batch reports | After knowledge seed deployment |
| `systemHealthTemplate()` | Health dashboards | Daily/weekly health checks |
| `revenueAlertTemplate()` | Billing events | Stripe webhooks, revenue milestones |
| `securityAlertTemplate()` | Security events | Rush threat detection, breaches |
| `diagnosticReportTemplate()` | Diagnostics | Wiz health checks, clearance reports |
| `toysListTemplate()` | Monthly recommendations | Chaos D14 toys list |
| `commandAckTemplate()` | Command receipt | After @ command parsed |
| `weeklyDigestTemplate()` | Weekly summary | Every Sunday |

---

*Email Template Library — Three-Headed Monster Palace Operations*
*Classification: PALACE INTERNAL | Version 1.0 | March 2026*
