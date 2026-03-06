import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrCreateUser } from "@/lib/auth";
import { logAuditEvent, getClientIp } from "@/lib/audit";
import { z } from "zod";

const moderateSchema = z.object({
  action: z.enum(["pin", "unpin", "lock", "unlock", "delete"]),
});

// POST /api/forum/[id]/moderate — admin moderation actions
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getOrCreateUser();

    // Admin check
    const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());
    if (!adminEmails.includes(user.email.toLowerCase())) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = moderateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const { action } = parsed.data;

    const post = await db.forumPost.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    switch (action) {
      case "pin":
        await db.forumPost.update({ where: { id }, data: { pinned: true } });
        break;
      case "unpin":
        await db.forumPost.update({ where: { id }, data: { pinned: false } });
        break;
      case "lock":
        await db.forumPost.update({ where: { id }, data: { locked: true } });
        break;
      case "unlock":
        await db.forumPost.update({ where: { id }, data: { locked: false } });
        break;
      case "delete":
        await db.forumPost.delete({ where: { id } });
        break;
    }

    logAuditEvent({
      event: "admin.action",
      userId: user.id,
      ip: getClientIp(req.headers),
      metadata: { action: `forum.${action}`, postId: id, postTitle: post.title },
    });

    return NextResponse.json({ success: true, action });
  } catch {
    return NextResponse.json({ error: "Moderation action failed" }, { status: 500 });
  }
}
