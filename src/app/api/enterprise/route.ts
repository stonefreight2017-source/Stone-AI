import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimitAsync } from "@/lib/rate-limiter";
import { sanitizeUserInput } from "@/lib/security";
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

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP — public endpoint, no auth required
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";
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

    const { config, estimatedMonthly, estimatedTotal, billingPeriod } =
      parsed.data;

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
        estimatedMonthly,
        estimatedTotal,
      },
      null,
      2
    );

    // Try to store as Feedback if we can find/create a system user
    // Enterprise inquiries use FEATURE type with [ENTERPRISE] prefix
    try {
      // Find or use a system user for unauthenticated submissions
      let systemUser = await db.user.findFirst({
        where: { email: "enterprise@stone-ai.net" },
      });
      if (!systemUser) {
        systemUser = await db.user.create({
          data: {
            clerkId: `system_enterprise_${Date.now()}`,
            email: "enterprise@stone-ai.net",
            name: "Enterprise Inquiries",
          },
        });
      }

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
      estimatedMonthly,
      estimatedTotal,
      referenceId,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to submit enterprise inquiry. Please try again." },
      { status: 500 }
    );
  }
}
