import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { checkRateLimitAsync } from "@/lib/rate-limiter";
import { sanitizeUserInput } from "@/lib/security";
import { z } from "zod";

const feedbackSchema = z.object({
  type: z.enum(["QUESTION", "BUG", "FEATURE"]),
  message: z.string().min(10).max(5000),
});

// POST /api/feedback — submit feedback
export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser();

    // Rate limit: 3 feedbacks per minute
    const { allowed } = await checkRateLimitAsync(`feedback:${user.id}`, 3);
    if (!allowed) {
      return NextResponse.json({ error: "Please wait before sending another message" }, { status: 429 });
    }

    const body = await req.json();
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Message must be between 10 and 5000 characters" }, { status: 400 });
    }

    const feedback = await db.feedback.create({
      data: {
        userId: user.id,
        email: user.email,
        type: parsed.data.type,
        message: sanitizeUserInput(parsed.data.message),
      },
    });

    return NextResponse.json({ id: feedback.id, success: true });
  } catch {
    return NextResponse.json({ error: "Failed to submit feedback" }, { status: 500 });
  }
}

// GET /api/feedback — admin: list all feedback
export async function GET(req: NextRequest) {
  try {
    const user = await getOrCreateUser();
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim());
    if (!adminEmails.includes(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const url = new URL(req.url);
    const resolved = url.searchParams.get("resolved");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));

    const where: Record<string, unknown> = {};
    if (resolved === "true") where.resolved = true;
    if (resolved === "false") where.resolved = false;

    const [items, total] = await Promise.all([
      db.feedback.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * 20,
        take: 20,
        include: {
          user: { select: { name: true, email: true, tier: true } },
        },
      }),
      db.feedback.count({ where }),
    ]);

    return NextResponse.json({ items, total, page });
  } catch {
    return NextResponse.json({ error: "Failed to load feedback" }, { status: 500 });
  }
}
