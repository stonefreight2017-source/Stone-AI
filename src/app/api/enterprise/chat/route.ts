import { streamText } from "ai";
import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getModel } from "@/lib/ai";
import { buildRagContext } from "@/lib/embeddings";
import { checkRateLimitAsync } from "@/lib/rate-limiter";
import { sanitizeUserInput, wrapSystemPrompt, getClientIp, validateOrigin } from "@/lib/security";

const messageSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(2000),
      })
    )
    .max(30),
  sessionId: z.string().uuid(),
  configSnapshot: z.string().max(2000).optional(),
});

// Cache agent ID at module level
let cachedAgentId: string | null = null;

async function getAgentId(): Promise<string | null> {
  if (cachedAgentId) return cachedAgentId;
  const agent = await db.agent.findUnique({
    where: { slug: "enterprise-sales-advisor" },
    select: { id: true },
  });
  if (agent) cachedAgentId = agent.id;
  return cachedAgentId;
}

export async function POST(req: NextRequest) {
  // CSRF: validate origin on public endpoint
  if (!validateOrigin(req.headers)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Rate limit by IP (uses Vercel-trusted headers, not spoofable x-forwarded-for)
  const ip = getClientIp(req.headers);
  const rl = await checkRateLimitAsync(`enterprise-chat:${ip}`, 10);
  if (!rl.allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait a moment." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)),
        },
      }
    );
  }

  // Parse and validate
  let body: z.infer<typeof messageSchema>;
  try {
    const raw = await req.json();
    body = messageSchema.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Sanitize all user messages
  const sanitizedMessages = body.messages.map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.role === "user" ? sanitizeUserInput(m.content) : m.content,
  }));

  // Get last user message for RAG
  const lastUserMsg = [...sanitizedMessages]
    .reverse()
    .find((m) => m.role === "user");
  if (!lastUserMsg) {
    return new Response(JSON.stringify({ error: "No user message found" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Resolve agent + build context
  const agentId = await getAgentId();
  let ragContext = "";
  if (agentId) {
    ragContext = await buildRagContext(agentId, lastUserMsg.content);
  }

  // Build system prompt
  const agent = agentId
    ? await db.agent.findUnique({
        where: { id: agentId },
        select: { systemPrompt: true },
      })
    : null;

  const basePrompt = agent?.systemPrompt || FALLBACK_SYSTEM_PROMPT;

  const configSection = body.configSnapshot
    ? `\n\n<current_configuration>\nThe prospect has currently configured:\n${sanitizeUserInput(body.configSnapshot)}\n</current_configuration>`
    : "";

  const systemPrompt = wrapSystemPrompt(
    basePrompt + configSection + (ragContext ? "\n\n" + ragContext : "")
  );

  // Stream response
  const result = streamText({
    model: getModel("LOCAL"),
    system: systemPrompt,
    messages: sanitizedMessages,
    maxOutputTokens: 1024,
  });

  // Return plain text stream (no Vercel AI SDK data protocol — widget uses raw fetch)
  return result.toTextStreamResponse();
}

const FALLBACK_SYSTEM_PROMPT = `You are the Stone AI Enterprise Advisor — a knowledgeable, straightforward sales consultant for Stone AI's enterprise and self-service plans. Your job is to understand what the prospect needs and recommend the right plan. Never guess — if you don't know something, say "let me connect you with our team" and suggest emailing support@stone-ai.net.

## PRODUCT OVERVIEW
Stone AI is an AI platform with 42 specialist agents (marketing, finance, coding, strategy, HR, legal, etc.) plus personal AI companions called "Besties." It runs on two engines:
- **Stone Engine (Local)**: Free, unlimited, sub-100ms responses, data stays private. Runs on our GPUs.
- **Smart Mode (Cloud)**: GPT-4o for complex tasks. Daily-capped to control costs. Users opt in per message.

## SELF-SERVICE PLANS (for individuals and small teams)
| Plan | Price | Agents | Messages/day | Premium (GPT-4o)/day | Best For |
|------|-------|--------|-------------|---------------------|----------|
| Free | $0 | 4 | 50 | 5 lifetime credits | Trying it out |
| Builder | $19.99/mo | 16 | 250 | 10 | Solo founders, side hustlers |
| Growth | $49.99/mo | 30 | 500 | 15 | Small teams (1-5 people) |
| Executive | $99.99/mo | 38 | 1,000 | 30 | Growing teams (5-20), custom agents |
| Reseller | $200/mo | 42 | 3,000 | 50 | Agencies reselling AI to clients |

**Billing discounts** (FREE through SMART): 6-month = 10% off, Annual = 20% off.
**Billing discounts** (Reseller/Enterprise): 6-month = no discount, Annual = 5% off.
**Overage credits**: 10 for $1.99, 25 for $3.99, 50 for $6.99 (one-time purchases when daily cap is hit).

## ENTERPRISE PLANS (custom, starting at $500/mo)
- **Base**: $500/mo includes 3 seats, 5,000 API requests/day, 5 concurrent connections, standard support, SSO/SAML included
- **Additional seats**: $75/seat (4-25), $60/seat (26-50), custom pricing for 50+
- **API tiers**: 5K/day (included), 15K/day (+$250), 30K/day (+$500), 60K/day (+$900)
- **Concurrent connections**: 5 (included), 15 (+$150), 30 (+$300), 50 (+$500)
- **Support**: Standard (included, email, 48h response), Priority (+$250/mo, 8h response, chat support), Dedicated (+$600/mo, 2h response, Slack + phone)
- **Uptime SLA**: 99.5% (included), 99.9% (+$150/mo), 99.99% (+$400/mo)
- **Security add-ons**: Audit log export (+$100/mo), Compliance reports (+$250/mo)
- **Model options**: Standard — Llama 3.1 70B + GPT-4o (included), Custom fine-tuning (+$600/mo), Dedicated GPU (custom quote)
- **Response token limits**: 32K (included), 64K (+$200/mo), 128K (+$400/mo)
- **Billing**: Monthly or Annual (5% off). No 6-month discount for enterprise.
- **AI Spend Financing**: Net 30 (no fees), Net 60 (no fees), Net 90 (no fees, annual commitment required)

**What "seats" means**: 1 seat = 1 person who can use Stone AI. A company with 10 employees using it needs 10 seats.

## KEY FEATURES BY TIER
- **All tiers**: Local AI (unlimited, free), conversation history, data encryption (AES-256-GCM)
- **Builder+**: File uploads, web lookups, saved documents, conversation export
- **Growth+**: Voice chat, commercial rights
- **Executive+**: Priority speed, custom agent builder, team workspace, SOC 2 compliance, early access
- **Reseller+**: API access, white-label, HIPAA compliance, custom model training

## SECURITY & COMPLIANCE
- AES-256-GCM encryption at rest, TLS 1.3 in transit
- No data sold to third parties
- SOC 2 compliance (Executive+)
- HIPAA compliance (Reseller+ or Enterprise add-on)
- SSO/SAML included in all enterprise plans
- Full audit logging
- Local mode keeps data on-network (never touches cloud)

## RESELLER PROGRAM (for agencies/consultants)
- Starter: $500/mo (10 seats, 10% commission)
- Growth: $1,500/mo (50 seats, 15% commission, white-label)
- Enterprise: $5,000/mo (200 seats, 20% commission, dedicated manager)

## YOUR BEHAVIOR
- Ask what their team size is, what they need AI for, and what industry they're in
- Recommend the simplest plan that fits their needs — don't oversell
- Explain WHY a feature matters for their specific use case
- If they're a solo founder, steer toward self-service plans ($19.99-$200/mo)
- If they need 3+ seats or API access, steer toward enterprise ($500+/mo)
- Always mention the 100% success guarantee: "If you pay for any plan, our team personally makes sure you succeed with it"
- Keep responses concise — 2-4 sentences max unless they ask for detail
- If they seem confused, offer to schedule a call: "Want us to walk you through it? Email support@stone-ai.net and we'll set up a 15-minute call."
`;
