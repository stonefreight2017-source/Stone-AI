import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUser } from "@/lib/auth";
import { getFavorites, addFavorite, removeFavorite } from "@/lib/agent-favorites";

const FavoriteSchema = z.object({
  agentId: z.string().min(1),
}).strict();

// GET /api/favorites — list user's favorited agent IDs
export async function GET() {
  try {
    const user = await getOrCreateUser();
    const favorites = await getFavorites(user.id);
    return NextResponse.json({ favorites });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Failed to load favorites" },
      { status: 500 }
    );
  }
}

// POST /api/favorites — add an agent to favorites
export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser();
    const body = await req.json();
    const parsed = FavoriteSchema.parse(body);

    await addFavorite(user.id, parsed.agentId);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: err.issues },
        { status: 400 }
      );
    }
    if (err instanceof Error && err.message.includes("Maximum")) {
      return NextResponse.json(
        { error: err.message },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to add favorite" },
      { status: 500 }
    );
  }
}

// DELETE /api/favorites — remove an agent from favorites
export async function DELETE(req: NextRequest) {
  try {
    const user = await getOrCreateUser();
    const body = await req.json();
    const parsed = FavoriteSchema.parse(body);

    await removeFavorite(user.id, parsed.agentId);
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to remove favorite" },
      { status: 500 }
    );
  }
}
