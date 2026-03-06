import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { z } from "zod";

const onboardingSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("complete") }),
  z.object({ action: z.literal("skip") }),
  z.object({ action: z.literal("set-goals"), goals: z.array(z.string().max(200)).min(1).max(20) }),
  z.object({ action: z.literal("update-step"), step: z.number().int().min(0).max(5) }),
]);

// GET /api/onboarding — get onboarding status
export async function GET() {
  try {
    const user = await getOrCreateUser();
    return NextResponse.json({
      onboardingCompleted: user.onboardingCompleted,
      onboardingStep: user.onboardingStep,
      onboardingGoals: user.onboardingGoals,
      onboardingSkippedAt: user.onboardingSkippedAt,
      tier: user.tier,
      name: user.name,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/onboarding — update onboarding progress
export async function PATCH(req: NextRequest) {
  try {
    const user = await getOrCreateUser();
    const body = await req.json();
    const parsed = onboardingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const data = parsed.data;

    if (data.action === "complete") {
      await db.user.update({
        where: { id: user.id },
        data: { onboardingCompleted: true, onboardingStep: 5 },
      });
      return NextResponse.json({ success: true, onboardingCompleted: true });
    }

    if (data.action === "skip") {
      await db.user.update({
        where: { id: user.id },
        data: { onboardingCompleted: true, onboardingSkippedAt: new Date() },
      });
      return NextResponse.json({ success: true, skipped: true });
    }

    if (data.action === "set-goals") {
      await db.user.update({
        where: { id: user.id },
        data: { onboardingGoals: data.goals },
      });
      return NextResponse.json({ success: true, goals: data.goals });
    }

    if (data.action === "update-step") {
      await db.user.update({
        where: { id: user.id },
        data: { onboardingStep: data.step },
      });
      return NextResponse.json({ success: true, step: data.step });
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
