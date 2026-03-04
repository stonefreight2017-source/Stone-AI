import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAuditEvent } from "@/lib/audit";

// DELETE /api/user/api-keys/[id] — revoke an API key
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getOrCreateUser();
    const { id } = await params;

    const key = await db.apiKey.findFirst({
      where: { id, userId: user.id, revokedAt: null },
    });

    if (!key) {
      return NextResponse.json({ error: "Key not found" }, { status: 404 });
    }

    await db.apiKey.update({
      where: { id: key.id },
      data: { revokedAt: new Date() },
    });

    logAuditEvent({
      event: "api_key.revoked",
      userId: user.id,
      metadata: { keyId: key.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
