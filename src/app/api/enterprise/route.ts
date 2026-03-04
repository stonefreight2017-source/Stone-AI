import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimitAsync } from "@/lib/rate-limiter";
import { sanitizeUserInput, getClientIp, validateOrigin } from "@/lib/security";
import { z } from "zod";

const enterpriseSchema = z.object({
  config: z.object({
    seats: z.number().min(3).max(200),
    apiRequests: z.number().min(5000).max(100000),
    concurrent: z.number().min(5).max(100),
    support: z.enum(["standard", "priority", "dedicated"]),
    sla: z.enum(["99.5", "99.9", "99.99"]),
    auditLogExport: z.boolean(),
    complianceReports: z.boolean(),
    model: z.enum(["standard", "fine-tuning", "dedicated-gpu"]),
    responseTokens: z.number().min(32000).max(128000),
    billingPeriod: z.enum(["monthly", "semiannual", "annual"]),
    financing: z.enum(["none", "net-30", "net-60", "net-90"]).default("none"),
    companyName: z.string().min(1).max(200),
    contactEmail: z.string().email().max(200),
  }),
  estimatedMonthly: z.number().min(0),
  estimatedTotal: z.number().min(0),
  billingPeriod: z.string(),
});

// Server-side price calculation to prevent client-side manipulation
function calculateServerPrice(config: z.infer<typeof enterpriseSchema>["config"]): {
  monthly: number;
  total: number;
} {
  let monthly = 0;

  // Base: $8/seat/mo
  monthly += config.seats * 8;

  // API tier pricing
  if (config.apiRequests > 50000) monthly += 200;
  else if (config.apiRequests > 20000) monthly += 100;
  else if (config.apiRequests > 10000) monthly += 50;

  // Support
  if (config.support === "dedicated") monthly += 300;
  else if (config.support === "priority") monthly += 100;

  // SLA
  if (config.sla === "99.99") monthly += 500;
  else if (config.sla === "99.9") monthly += 150;

  // Add-ons
  if (config.auditLogExport) monthly += 50;
  if (config.complianceReports) monthly += 100;

  // Model
  if (config.model === "dedicated-gpu") monthly += 400;
  else if (config.model === "fine-tuning") monthly += 200;

  // Tokens
  if (config.responseTokens > 64000) monthly += 100;

  // Concurrent
  if (config.concurrent > 50) monthly += 150;
  else if (config.concurrent > 20) monthly += 75;

  // Billing period discount
  const periods: Record<string, { months: number; discount: number }> = {
    monthly: { months: 1, discount: 0 },
    semiannual: { months: 6, discount: 0.1 },
    annual: { months: 12, discount: 0.2 },
  };
  const period = periods[config.billingPeriod] || periods.monthly;
  const discounted = monthly * (1 - period.discount);
  const total = discounted * period.months;

  return { monthly: Math.round(discounted), total: Math.round(total) };
}

export async function POST(req: NextRequest) {
  try {
    // CSRF: validate origin
    if (!validateOrigin(req.headers)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Rate limit by IP (Vercel-trusted headers)
    const ip = getClientIp(req.headers);
    const { allowed } = await checkRateLimitAsync(
      `enterprise:${ip}`,
      3
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = enterpriseSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid configuration. Please check your selections." },
        { status: 400 }
      );
    }

    const { config, billingPeriod } = parsed.data;

    // Server-side price calculation (never trust client-sent prices)
    const serverPrice = calculateServerPrice(config);

    const referenceId = `ENT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Build structured message for storage
    const message = JSON.stringify(
      {
        referenceId,
        companyName: sanitizeUserInput(config.companyName),
        contactEmail: sanitizeUserInput(config.contactEmail),
        seats: config.seats,
        apiRequests: config.apiRequests,
        concurrent: config.concurrent,
        support: config.support,
        sla: config.sla,
        auditLogExport: config.auditLogExport,
        complianceReports: config.complianceReports,
        model: config.model,
        responseTokens: config.responseTokens,
        billingPeriod,
        financing: config.financing,
        estimatedMonthly: serverPrice.monthly,
        estimatedTotal: serverPrice.total,
      },
      null,
      2
    );

    // Store as Feedback using atomic upsert for system user (prevents race condition)
    try {
      const systemUser = await db.user.upsert({
        where: { email: "enterprise@stone-ai.net" },
        update: {},
        create: {
          clerkId: "system_enterprise",
          email: "enterprise@stone-ai.net",
          name: "Enterprise Inquiries",
        },
      });

      await db.feedback.create({
        data: {
          userId: systemUser.id,
          email: sanitizeUserInput(config.contactEmail),
          type: "FEATURE",
          message: `[ENTERPRISE] ${message}`,
        },
      });
    } catch (dbError) {
      // Log but don't fail the request — the inquiry is still valid
      console.error("Failed to store enterprise inquiry:", dbError);
    }

    return NextResponse.json({
      success: true,
      estimatedMonthly: serverPrice.monthly,
      estimatedTotal: serverPrice.total,
      referenceId,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit enterprise inquiry. Please try again." },
      { status: 500 }
    );
  }
}
