import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { checkRateLimitAsync } from "@/lib/rate-limiter";

// POST /api/forum/[id]/like — toggle like on a post
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const user = await getOrCreateUser();

    // Rate limit: 10 likes per minute
    const { allowed } = await checkRateLimitAsync(`forum:like:${user.id}`, 10);
    if (!allowed) {
      return NextResponse.json({ error: "Please slow down" }, { status: 429 });
    }

    const post = await db.forumPost.findUnique({
      where: { id: postId },
      select: { id: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const existingLike = await db.forumLike.findUnique({
      where: { userId_postId: { userId: user.id, postId } },
    });

    if (existingLike) {
      // Unlike
      await db.$transaction([
        db.forumLike.delete({ where: { id: existingLike.id } }),
        db.forumPost.update({
          where: { id: postId },
          data: { likes: { decrement: 1 } },
        }),
      ]);
      return NextResponse.json({ liked: false });
    } else {
      // Like
      await db.$transaction([
        db.forumLike.create({
          data: { userId: user.id, postId },
        }),
        db.forumPost.update({
          where: { id: postId },
          data: { likes: { increment: 1 } },
        }),
      ]);
      return NextResponse.json({ liked: true });
    }
  } catch {
    return NextResponse.json({ error: "Failed to toggle like" }, { status: 500 });
  }
}
