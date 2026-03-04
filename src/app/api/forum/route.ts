import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { checkRateLimitAsync } from "@/lib/rate-limiter";
import { sanitizeUserInput } from "@/lib/security";
import { checkContentModeration, getViolationTitle, POLICY_VIOLATION_MESSAGE } from "@/lib/content-moderation";
import { z } from "zod";

const VALID_CATEGORIES = ["GENERAL", "TIPS", "SHOWCASE", "AGENTS", "BUSINESS", "TECHNICAL", "FEEDBACK"];

// GET /api/forum — list posts with pagination + filtering
export async function GET(req: NextRequest) {
  try {
    // Require authentication for forum access
    await getOrCreateUser();

    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "20")));
    const sort = url.searchParams.get("sort") || "newest"; // newest, popular, pinned

    const where: Record<string, unknown> = {};
    if (category && category !== "ALL") {
      // Validate category against allowed values
      if (!VALID_CATEGORIES.includes(category)) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
      }
      where.category = category;
    }

    let orderBy: Record<string, string>[] = [{ createdAt: "desc" }];
    if (sort === "popular") {
      orderBy = [{ likes: "desc" }, { createdAt: "desc" }];
    } else if (sort === "pinned") {
      orderBy = [{ pinned: "desc" }, { createdAt: "desc" }];
    }

    const [posts, total, totalMembers, proMembers] = await Promise.all([
      db.forumPost.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              tier: true,
              _count: { select: { forumPosts: true } },
            },
          },
          _count: { select: { replies: true, likedBy: true } },
        },
      }),
      db.forumPost.count({ where }),
      db.user.count({ where: { forumPosts: { some: {} } } }),
      db.user.count({ where: { tier: "PRO", forumPosts: { some: {} } } }),
    ]);

    return NextResponse.json({
      posts: posts.map((p) => ({
        id: p.id,
        title: p.title,
        content: p.content.slice(0, 300),
        category: p.category,
        pinned: p.pinned,
        locked: p.locked,
        likes: p.likes,
        replyCount: p._count.replies,
        author: {
          id: p.user.id,
          name: p.user.name || "Anonymous",
          tier: p.user.tier,
          postCount: p.user._count.forumPosts,
        },
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      communityStats: {
        totalDiscussions: total,
        totalMembers,
        proMembers,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}

const createPostSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10).max(10000),
  category: z.enum(["GENERAL", "TIPS", "SHOWCASE", "AGENTS", "BUSINESS", "TECHNICAL", "FEEDBACK"]),
});

// POST /api/forum — create a new post
export async function POST(req: NextRequest) {
  try {
    const user = await getOrCreateUser();

    // Rate limit: 2 posts per minute
    const { allowed } = await checkRateLimitAsync(`forum:post:${user.id}`, 2);
    if (!allowed) {
      return NextResponse.json({ error: "Please wait before posting again" }, { status: 429 });
    }

    const body = await req.json();
    const parsed = createPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const title = sanitizeUserInput(parsed.data.title);
    const content = sanitizeUserInput(parsed.data.content);
    const { category } = parsed.data;

    // Content moderation — check title and content for abuse
    const titleCheck = checkContentModeration(title);
    const contentCheck = checkContentModeration(content);
    const violation = titleCheck.flagged ? titleCheck : contentCheck.flagged ? contentCheck : null;

    if (violation) {
      // Auto-notify the user with policy explanation
      await db.notification.create({
        data: {
          userId: user.id,
          type: "content_violation",
          title: getViolationTitle(violation.severity!),
          body: POLICY_VIOLATION_MESSAGE,
          href: "/app/community",
        },
      });

      return NextResponse.json(
        { error: "Your post was flagged for violating community guidelines. Please review our policies — a notification has been sent to your account." },
        { status: 403 }
      );
    }

    const post = await db.forumPost.create({
      data: {
        userId: user.id,
        title,
        content,
        category,
      },
      include: {
        user: { select: { id: true, name: true, tier: true } },
      },
    });

    return NextResponse.json({
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category,
        likes: 0,
        replyCount: 0,
        author: {
          id: post.user.id,
          name: post.user.name || "Anonymous",
          tier: post.user.tier,
        },
        createdAt: post.createdAt,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
