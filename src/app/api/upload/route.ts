/**
 * POST /api/upload — File upload and text extraction endpoint.
 *
 * Accepts multipart/form-data with a single file field named "file".
 * Validates against tier limits, parses the file, and returns extracted text.
 *
 * Files are NOT persisted — all processing is in-memory only.
 *
 * Auth: Requires Clerk session.
 * Rate: Inherits general API rate limits (no separate upload rate limit yet).
 */

import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUser } from "@/lib/auth";
import { validateUpload, parseFile } from "@/lib/file-parser";
import { logAuditEvent, getClientIp } from "@/lib/audit";
import type { Tier } from "@/lib/tier-config";

/** Max form data size we'll accept (slightly above PRO's 50MB limit to allow headers) */
const MAX_FORM_SIZE = 55 * 1024 * 1024; // 55 MB

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate
    const user = await getOrCreateUser();
    if (user.banned) {
      logAuditEvent({
        event: "auth.banned_access",
        userId: user.id,
        ip: getClientIp(req.headers),
      });
      return NextResponse.json({ error: "Account suspended" }, { status: 403 });
    }

    const tier = user.tier as Tier;

    // 2. Parse multipart form data
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: "Invalid form data. Send a multipart/form-data request with a 'file' field." },
        { status: 400 }
      );
    }

    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No file provided. Include a 'file' field in the form data." },
        { status: 400 }
      );
    }

    // 3. Validate file against tier limits
    const validation = validateUpload(file.size, file.type, tier);
    if (!validation.valid) {
      logAuditEvent({
        event: "upload.rejected",
        userId: user.id,
        metadata: {
          filename: file.name,
          mimeType: file.type,
          size: file.size,
          reason: validation.error ?? "unknown",
        },
      });
      return NextResponse.json(
        { error: validation.error, code: "UPLOAD_VALIDATION_FAILED" },
        { status: 400 }
      );
    }

    // 4. Safety check — reject unexpectedly large payloads
    if (file.size > MAX_FORM_SIZE) {
      return NextResponse.json(
        { error: "File exceeds maximum allowed size." },
        { status: 413 }
      );
    }

    // 5. Read file into buffer (in-memory only — no disk persistence)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 6. Parse and extract text
    const result = await parseFile(buffer, file.type, file.name, tier);

    // 7. Audit log successful upload
    logAuditEvent({
      event: "upload.success",
      userId: user.id,
      metadata: {
        filename: file.name,
        mimeType: file.type,
        size: file.size,
        extractedWords: result.metadata.words,
        truncated: result.metadata.truncated,
        format: result.metadata.format,
      },
    });

    // 8. Return extracted text and metadata
    return NextResponse.json({
      text: result.text,
      metadata: result.metadata,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.error("POST /api/upload:", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json(
      { error: "Failed to process file. Please try again.", code: "UPLOAD_ERROR" },
      { status: 500 }
    );
  }
}
