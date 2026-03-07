import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { checkRateLimitAsync } from "@/lib/rate-limiter";
import { sanitizeUserInput } from "@/lib/security";
import { checkContentModeration, getViolationTitle, POLICY_VIOLATION_MESSAGE } from "@/lib/content-moderation";
import { z } from "zod";

const replySchema = z.object({
  content: z.string().min(2).max(5000),
}).strict();

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

    const sanitizedContent = sanitizeUserInput(parsed.data.content);

    // Content moderation — check for abuse before creating
    const modCheck = checkContentModeration(sanitizedContent);
    if (modCheck.flagged) {
      // Auto-notify the user with policy explanation
      await db.notification.create({
        data: {
          userId: user.id,
          type: "content_violation",
          title: getViolationTitle(modCheck.severity!),
          body: POLICY_VIOLATION_MESSAGE,
          href: "/app/community",
        },
      });

      return NextResponse.json(
        { error: "Your reply was flagged for violating community guidelines. Please review our policies — a notification has been sent to your account." },
        { status: 403 }
      );
    }

    const reply = await db.forumReply.create({
      data: {
        postId: id,
        userId: user.id,
        content: sanitizedContent,
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
