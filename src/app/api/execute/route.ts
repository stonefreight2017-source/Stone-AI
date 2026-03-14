/**
 * POST /api/execute — Secure code execution endpoint
 *
 * Executes user-submitted code in an isolated Docker container.
 * Requires authenticated Clerk session. Respects tier-based daily quotas.
 *
 * SECURITY:
 * - Auth required (Clerk session)
 * - Tier quota enforcement (FREE=0, STARTER=10, PLUS=30, SMART=100, PRO=500/day)
 * - Language whitelist (python, javascript, bash only)
 * - All executions logged for audit
 * - Docker isolation (see code-sandbox.ts for full security model)
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getOrCreateUser } from "@/lib/auth";
import { executeCodeWithQuota, isSupportedLanguage } from "@/lib/code-sandbox";
import { logAuditEvent, getClientIp } from "@/lib/audit";

// ═══ Request Validation ═══

const executeRequestSchema = z.object({
  code: z
    .string()
    .min(1, "Code must not be empty")
    .max(50_000, "Code exceeds maximum length of 50,000 characters"),
  language: z
    .enum(["python", "javascript", "bash"], {
      error: "Language must be one of: python, javascript, bash",
    }),
}).strict();

// ═══ POST Handler ═══

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Auth — require Clerk session
    let user;
    try {
      user = await getOrCreateUser();
    } catch {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const parsed = executeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.issues.map((i) => i.message),
        },
        { status: 400 }
      );
    }

    const { code, language } = parsed.data;

    // 3. Double-check language support (belt + suspenders with Zod enum)
    if (!isSupportedLanguage(language)) {
      return NextResponse.json(
        { error: `Unsupported language: ${language}` },
        { status: 400 }
      );
    }

    // 4. Execute code with quota enforcement
    const result = await executeCodeWithQuota(
      user.id,
      user.tier,
      code,
      language
    );

    // 5. Audit log (fire-and-forget)
    logAuditEvent({
      event: "admin.action" as const, // Using existing event type for code execution logging
      userId: user.id,
      ip: getClientIp(req.headers),
      metadata: {
        action: "code_execution",
        language,
        exitCode: result.exitCode,
        timedOut: result.timedOut,
        executionTime: result.executionTime,
        codeLength: code.length,
        quotaUsed: result.quotaUsed,
        quotaLimit: result.quotaLimit,
      },
    });

    // 6. Return result
    const latency = Date.now() - startTime;

    // Determine appropriate HTTP status
    // 429 if quota exceeded, 200 otherwise (even if code itself errored)
    if (result.quotaLimit === 0 || (result.quotaUsed > result.quotaLimit)) {
      return NextResponse.json(
        {
          error: "Code execution quota exceeded",
          stdout: result.stdout,
          stderr: result.stderr,
          quota: {
            used: result.quotaUsed,
            limit: result.quotaLimit,
          },
        },
        {
          status: 429,
          headers: { "X-Latency-Ms": String(latency) },
        }
      );
    }

    return NextResponse.json(
      {
        stdout: result.stdout,
        stderr: result.stderr,
        exitCode: result.exitCode,
        timedOut: result.timedOut,
        executionTime: result.executionTime,
        quota: {
          used: result.quotaUsed,
          limit: result.quotaLimit,
        },
      },
      {
        status: 200,
        headers: { "X-Latency-Ms": String(latency) },
      }
    );
  } catch (error) {
    console.error("[/api/execute] Unhandled error:", error);

    return NextResponse.json(
      { error: "Internal server error during code execution" },
      { status: 500 }
    );
  }
}
