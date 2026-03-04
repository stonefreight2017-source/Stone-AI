import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { seedAgents } from "@/lib/agent-seed";

// POST /api/admin/agents — seed all agents into database
export async function POST() {
  try {
    await requireAdmin();
    await seedAgents();
    return NextResponse.json({ success: true, message: "Agents seeded" });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "Admin required" }, { status: 403 });
    }
    console.error("Seed agents:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
