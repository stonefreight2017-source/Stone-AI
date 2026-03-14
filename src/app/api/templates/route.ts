import { NextRequest, NextResponse } from "next/server";
import { getAllTemplates, getTemplatesForAgent, getTemplatesByCategory } from "@/lib/prompt-templates";

// GET /api/templates — public, no auth required
// ?agent=slug  → templates for that agent's category
// ?category=X  → templates for a specific category
// (no params)  → all templates
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const agentSlug = searchParams.get("agent");
    const category = searchParams.get("category");

    if (agentSlug) {
      const templates = await getTemplatesForAgent(agentSlug);
      return NextResponse.json({ templates });
    }

    if (category) {
      const templates = getTemplatesByCategory(category);
      return NextResponse.json({ templates });
    }

    const templates = getAllTemplates();
    return NextResponse.json({ templates });
  } catch {
    return NextResponse.json(
      { error: "Failed to load templates" },
      { status: 500 }
    );
  }
}
