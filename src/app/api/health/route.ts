import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/security";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const { allowed } = await checkRateLimitAsync(`health:${ip}`, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let dbOk = false;

  try {
    await db.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  // vLLM connectivity check (non-blocking, 5s timeout)
  let vllmOk = false;
  let vllmError = "";
  const vllmUrl = process.env.VLLM_BASE_URL?.trim() ?? "http://localhost:8000/v1";
  try {
    const vllmResp = await fetch(`${vllmUrl}/models`, {
      headers: {
        Authorization: `Bearer ${process.env.VLLM_API_KEY ?? ""}`,
      },
      signal: AbortSignal.timeout(5000),
    });
    vllmOk = vllmResp.ok;
    if (!vllmResp.ok) {
      vllmError = `HTTP ${vllmResp.status}: ${await vllmResp.text().catch(() => "no body")}`;
    }
  } catch (e) {
    vllmError = e instanceof Error ? e.message : String(e);
  }

  // Public health check: only expose overall status, not infrastructure details
  return NextResponse.json({
    status: dbOk && vllmOk ? "ok" : "degraded",
    db: dbOk ? "ok" : "down",
    vllm: vllmOk ? "ok" : "down",
    vllmUrl: vllmUrl.slice(0, 40),
    ...(vllmError ? { vllmError } : {}),
  });
}
