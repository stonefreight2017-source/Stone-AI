import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { checkRateLimitAsync } from "@/lib/rate-limiter";
import { sanitizeUserInput } from "@/lib/security";
import { z } from "zod";

const replySchema = z.object({
  content: z.string().min(2).max(5000),
});

// POST /api/forum/[id]/replies — add reply to a post
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getOrCreateUser();

    // Rate limit: 5 replies per minute
    const { allowed } = await checkRateLimitAsync(`forum:reply:${user.id}`, 5);
    if (!allowed) {
      return NextResponse.json({ error: "Please wait before replying again" }, { status: 429 });
    }

    const post = await db.forumPost.findUnique({
      where: { id },
      select: { id: true, userId: true, locked: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    if (post.locked) {
      return NextResponse.json({ error: "This post is locked" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = replySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Reply must be between 2 and 5000 characters" },
        { status: 400 }
      );
    }

    const reply = await db.forumReply.create({
      data: {
        postId: id,
        userId: user.id,
        content: sanitizeUserInput(parsed.data.content),
      },
      include: {
        user: { select: { id: true, name: true, tier: true } },
      },
    });

    // Notify post author (if not replying to own post)
    if (post.userId !== user.id) {
      db.notification.create({
        data: {
          userId: post.userId,
          type: "forum_reply",
          title: "New reply to your post",
          body: `${user.name || "Someone"} replied to your discussion`,
          href: `/app/community?post=${id}`,
        },
      }).catch(() => {}); // fire-and-forget
    }

    return NextResponse.json({
      reply: {
        id: reply.id,
        content: reply.content,
        likes: 0,
        author: {
          id: reply.user.id,
          name: reply.user.name || "Anonymous",
          tier: reply.user.tier,
        },
        createdAt: reply.createdAt,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to post reply" }, { status: 500 });
  }
}
