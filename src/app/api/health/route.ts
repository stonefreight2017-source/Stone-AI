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

  // Temporary search diagnostic — simulates exact chat route search logic
  // ?simulate=1&msg=12010&history=hair+salon+near+me||I'd+be+happy+to+help
  const simulate = req.nextUrl.searchParams.get("simulate");
  const searchQuery = req.nextUrl.searchParams.get("search");

  if (simulate) {
    try {
      const { lookupZip } = await import("@/lib/zip-lookup");
      const message = req.nextUrl.searchParams.get("msg") || "12010";
      const historyRaw = req.nextUrl.searchParams.get("history") || "";
      const historyMsgs = historyRaw.split("||").filter(Boolean).map((h, i) => ({
        role: (i % 2 === 0 ? "user" : "assistant") as "user" | "assistant",
        content: h.replace(/\+/g, " "),
      }));
      // Add current message
      historyMsgs.push({ role: "user", content: message });

      const msgLower = message.toLowerCase();
      const recentContext = historyMsgs.slice(-4).map(m => m.content.toLowerCase()).join(" ");
      const combinedContext = msgLower + " " + recentContext;

      const locationKeywords = ["near me", "near ", "closest", "nearby", "restaurant", "store", "shop", "dealership", "where can i", "where is", "find a", "find me", "best place", "places to", "local ", "salon", "barber", "hotel"];
      const hasLocationKeyword = locationKeywords.some(kw => combinedContext.includes(kw));
      const zipMatch = message.match(/\b(\d{5})\b/);

      const diag: Record<string, unknown> = {
        message,
        historyMsgs: historyMsgs.map(m => `${m.role}: ${m.content.substring(0, 50)}`),
        msgLower,
        recentContext: recentContext.substring(0, 200),
        combinedContext: combinedContext.substring(0, 200),
        hasLocationKeyword,
        zipMatch: zipMatch?.[1] ?? "none",
        wouldSearch: hasLocationKeyword || !!zipMatch,
      };

      if (hasLocationKeyword || zipMatch) {
        let finalSearchQuery = message;
        const zipCode = zipMatch?.[1] ?? recentContext.match(/\b(\d{5})\b/)?.[1];
        let locationStr = "";
        if (zipCode) {
          const zipInfo = lookupZip(zipCode);
          diag.zipInfo = zipInfo;
          if (zipInfo) locationStr = `${zipInfo.city}, ${zipInfo.stateCode} ${zipCode}`;
        }
        diag.locationStr = locationStr;

        if (message.trim().length < 20 && historyMsgs.length >= 2) {
          const prevUserMsgs = historyMsgs.filter(m => m.role === "user").slice(-3);
          const questionMsg = prevUserMsgs.find(m => {
            const lower = m.content.toLowerCase();
            return locationKeywords.some(kw => lower.includes(kw));
          });
          diag.questionMsg = questionMsg?.content ?? "NONE FOUND";
          if (questionMsg) {
            finalSearchQuery = questionMsg.content.replace(/\b(near me|to me|close to me|around me|near\s*)$/gi, "").trim();
            if (locationStr) finalSearchQuery = `${finalSearchQuery} near ${locationStr}`;
          }
        } else if (locationStr) {
          finalSearchQuery = message.replace(/\b\d{5}\b/, locationStr);
        }

        const searchTypeParam = hasLocationKeyword ? "places" as const : "search" as const;
        diag.finalSearchQuery = finalSearchQuery;
        diag.searchType = searchTypeParam;

        // Actually run the search
        const response = await searchWeb(finalSearchQuery, 5, searchTypeParam);
        const formatted = formatSearchResults(response.results);
        diag.searchProvider = response.provider;
        diag.searchResultCount = response.results.length;
        diag.searchCached = response.cached;
        diag.firstResult = response.results[0]?.title ?? "NONE";
        diag.formattedLength = formatted.length;
        diag.formattedPreview = formatted.substring(0, 300);
      }

      return NextResponse.json(diag);
    } catch (err) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "unknown", stack: err instanceof Error ? err.stack?.split("\n").slice(0, 3) : undefined });
    }
  }

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
