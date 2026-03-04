import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";

// GET /api/forum/[id] — get single post with all replies
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    const user = await getOrCreateUser();
    const { id } = await params;

    const post = await db.forumPost.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            tier: true,
            _count: { select: { forumPosts: true } },
          },
        },
        replies: {
          orderBy: { createdAt: "asc" },
          take: 100, // Pagination: cap replies to prevent huge payloads
          include: {
            user: {
              select: {
                id: true,
                name: true,
                tier: true,
                _count: { select: { forumPosts: true } },
              },
            },
          },
        },
        likedBy: {
          where: { userId: user.id }, // Only check if current user liked it
          select: { userId: true },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({
      post: {
        id: post.id,
        title: post.title,
        content: post.content,
        category: post.category,
        pinned: post.pinned,
        locked: post.locked,
        likes: post.likes,
        likedByCurrentUser: post.likedBy.length > 0,
        author: {
          id: post.user.id,
          name: post.user.name || "Anonymous",
          tier: post.user.tier,
          postCount: post.user._count.forumPosts,
        },
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        replies: post.replies.map((r) => ({
          id: r.id,
          content: r.content,
          likes: r.likes,
          author: {
            id: r.user.id,
            name: r.user.name || "Anonymous",
            tier: r.user.tier,
            postCount: r.user._count.forumPosts,
          },
          createdAt: r.createdAt,
        })),
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to load post" }, { status: 500 });
  }
}
