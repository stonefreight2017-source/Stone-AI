import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/security";
import { searchWeb, formatSearchResults } from "@/lib/web-search";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const { allowed } = await checkRateLimitAsync(`health:${ip}`, 60);
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  // Temporary search diagnostic — ?search=hair+salons+near+Amsterdam+NY+12010
  const searchQuery = req.nextUrl.searchParams.get("search");
  if (searchQuery) {
    try {
      const searchType = req.nextUrl.searchParams.get("type") === "places" ? "places" as const : "search" as const;
      const response = await searchWeb(searchQuery, 5, searchType);
      const formatted = formatSearchResults(response.results);
      return NextResponse.json({
        query: searchQuery,
        searchType,
        provider: response.provider,
        resultCount: response.results.length,
        cached: response.cached,
        results: response.results,
        formatted: formatted.substring(0, 2000),
        env: {
          SERPER_PROXY_URL: process.env.SERPER_PROXY_URL ? "SET" : "NOT SET",
          SERPER_API_KEY: process.env.SERPER_API_KEY ? "SET" : "NOT SET",
        },
      });
    } catch (err) {
      return NextResponse.json({
        error: err instanceof Error ? err.message : "unknown",
        env: {
          SERPER_PROXY_URL: process.env.SERPER_PROXY_URL ? "SET" : "NOT SET",
          SERPER_API_KEY: process.env.SERPER_API_KEY ? "SET" : "NOT SET",
        },
      });
    }
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
