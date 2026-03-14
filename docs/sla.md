# Stone AI Service Level Agreement (SLA)

**Effective Date:** March 14, 2026
**Last Updated:** March 14, 2026
**Company:** Stone AI LLC (S-Corp election)
**Founder:** Derrick Harrington
**Address:** 4879 State Hwy 30, #183, Amsterdam, NY 12010

---

## 1. Overview

This Service Level Agreement ("SLA") describes the uptime commitments, measurement methodology, and service credit remedies that Stone AI provides to eligible paid subscribers. This SLA is incorporated by reference into the Stone AI Terms of Service.

Stone AI's infrastructure combines local AI inference (Qwen 2.5 32B AWQ on dedicated GPU hardware) with cloud AI fallback (Anthropic Claude), providing redundancy that most competitors in the AI SaaS space do not offer. This SLA formalizes our commitment to reliability.

---

## 2. Definitions

- **"Downtime"** means any period of five (5) or more consecutive minutes during which the Stone AI platform returns HTTP 5xx server errors or is completely unreachable, as measured by Stone AI's internal monitoring systems.
- **"Monthly Uptime Percentage"** means the total number of minutes in a calendar month minus Downtime minutes, divided by the total number of minutes in that calendar month, multiplied by 100. Formula: `(Total Minutes - Downtime Minutes) / Total Minutes x 100`
- **"Measurement Period"** means each calendar month (UTC).
- **"Service Credit"** means a percentage credit applied to the customer's next monthly billing cycle, calculated against the monthly subscription fee for the affected month.
- **"Scheduled Maintenance"** means planned maintenance for which Stone AI provides at least twenty-four (24) hours advance notice via email or in-app notification.

---

## 3. SLA Tiers

Service level commitments vary by subscription tier:

| Subscription Tier | Monthly Uptime Target | Service Credits | Credit Schedule |
|---|---|---|---|
| **Free** | No SLA (best-effort) | None | N/A |
| **Starter (Builder)** | 99.0% | Informational only — no credits | N/A |
| **Plus (Growth)** | 99.0% | Informational only — no credits | N/A |
| **Smart (Executive)** | 99.5% | Yes — see Section 4 | Standard |
| **Pro (Reseller)** | 99.5% | Yes — see Section 4 | Enhanced |
| **Enterprise** | Custom (up to 99.9%) | Custom — negotiated per contract | Custom |

### 3.1 Free Tier

The Free tier is provided on a best-effort basis. Stone AI makes no uptime guarantees and offers no remedies for service interruptions on the Free tier.

### 3.2 Starter and Plus Tiers

Starter (Builder) and Plus (Growth) subscribers receive an informational uptime target of 99.0% monthly uptime. This target reflects Stone AI's operational goal but does not entitle subscribers to service credits or other remedies if the target is not met. Subscribers on these tiers who require uptime guarantees should upgrade to the Smart or Pro tier.

### 3.3 Smart and Pro Tiers

Smart (Executive) and Pro (Reseller) subscribers are entitled to the service credit schedule described in Section 4 if the Monthly Uptime Percentage falls below 99.5% in any Measurement Period, subject to the exclusions in Section 5.

### 3.4 Enterprise Tier

Enterprise subscribers receive custom SLA terms negotiated as part of their enterprise agreement. Custom SLAs may include uptime targets up to 99.9%, dedicated infrastructure, and tailored remedies. Contact sales@stone-ai.net for enterprise SLA details.

---

## 4. Service Credit Schedule

The following service credits apply to **Smart** and **Pro** tier subscribers only:

| Monthly Uptime Percentage | Service Credit (% of Monthly Fee) |
|---|---|
| Below 99.5% but at or above 99.0% | 10% |
| Below 99.0% but at or above 95.0% | 25% |
| Below 95.0% | 50% (maximum) |

### 4.1 Credit Cap

Service credits shall not exceed fifty percent (50%) of the customer's monthly subscription fee for the affected Measurement Period. This is the maximum aggregate credit for any single month, regardless of the number or duration of Downtime incidents.

### 4.2 How to Request Credits

To receive a service credit, the customer must submit a credit request to support@stone-ai.net within thirty (30) days of the end of the Measurement Period in which the Downtime occurred. The request must include:

1. The customer's account email address
2. The date(s) and approximate time(s) of the Downtime incident(s)
3. A brief description of the impact experienced

Stone AI will review the request and verify the Downtime against its internal monitoring records. If confirmed, the service credit will be applied to the customer's next billing cycle within fifteen (15) business days of approval.

### 4.3 Credit Application

Service credits are applied as a credit to the customer's next monthly billing cycle. Credits are not transferable, are not redeemable for cash, and may not be applied to other Stone AI products or services. Credits do not carry over beyond one billing cycle.

---

## 5. Exclusions

The following events are excluded from Downtime calculations and do not qualify for service credits:

1. **Scheduled Maintenance.** Planned maintenance windows for which Stone AI provides at least twenty-four (24) hours advance notice. Stone AI will make reasonable efforts to schedule maintenance during low-usage periods (typically 2:00 AM - 6:00 AM Eastern Time).

2. **Force Majeure.** Events beyond Stone AI's reasonable control, including but not limited to: natural disasters, pandemics, acts of war or terrorism, government actions, internet backbone failures, widespread power grid outages, or any other event that would constitute force majeure under the Stone AI Terms of Service.

3. **Third-Party Service Outages.** Service disruptions caused by outages or degraded performance of third-party services that Stone AI depends on, including but not limited to:
   - Anthropic (cloud AI inference provider)
   - Clerk (authentication provider)
   - Stripe (payment processing)
   - Cloudflare (DNS, CDN, and DDoS protection)
   - Neon (cloud database hosting)
   - Vercel (application hosting)

4. **Customer-Caused Issues.** Service disruptions resulting from the customer's own actions, including but not limited to: exceeding published rate limits, abuse of the API, account suspension due to Terms of Service violations, or issues with the customer's network, device, or browser.

5. **Beta and Preview Features.** Any features, agents, or services explicitly designated as "beta," "preview," "experimental," or "early access" are excluded from this SLA.

6. **Free Tier.** The Free tier is not covered by this SLA.

---

## 6. Sole and Exclusive Remedy

Service credits as described in Section 4 are the customer's sole and exclusive remedy for any failure by Stone AI to meet the uptime targets described in this SLA. This SLA does not modify or supersede the limitation of liability provisions in the Stone AI Terms of Service.

---

## 7. Infrastructure and Redundancy

Stone AI's architecture is designed for resilience:

- **Primary Inference:** Local AI inference on dedicated GPU hardware (NVIDIA RTX 5090, 32GB VRAM) running Qwen 2.5 32B AWQ via vLLM. This provides low-latency responses without dependence on external AI providers.
- **Cloud Fallback:** When local inference is unavailable or under heavy load, requests are routed to Anthropic Claude (cloud AI), ensuring continued service availability.
- **Application Hosting:** Vercel edge network with global distribution.
- **Database:** Neon PostgreSQL with automated backups and point-in-time recovery.
- **CDN and Security:** Cloudflare with DDoS protection and SSL encryption.

This dual-inference architecture (local + cloud) provides a level of redundancy that most AI SaaS platforms in our competitive category do not offer.

---

## 8. Monitoring and Reporting

Stone AI monitors service availability continuously using internal health check endpoints and third-party monitoring tools. In the event of a service disruption:

1. Stone AI will acknowledge the incident and begin investigation.
2. Status updates will be communicated via the Stone AI status page and/or email to affected subscribers.
3. A post-incident summary will be made available for qualifying Downtime events affecting Smart, Pro, and Enterprise subscribers upon request.

---

## 9. SLA Modifications

Stone AI reserves the right to modify this SLA at any time. Material changes will be communicated to eligible subscribers via email at least thirty (30) days before taking effect. Changes to the SLA will not retroactively reduce credits already earned. The most current version of this SLA is always available at [stone-ai.net/sla](https://stone-ai.net/sla).

---

## 10. Contact

For SLA-related inquiries, credit requests, or enterprise SLA negotiations:

**Stone AI LLC**
4879 State Hwy 30, #183
Amsterdam, NY 12010

- **Support:** support@stone-ai.net
- **Sales (Enterprise SLA):** sales@stone-ai.net
- **Legal:** legal@stone-ai.net
