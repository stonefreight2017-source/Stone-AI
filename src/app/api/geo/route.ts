import { NextRequest } from "next/server";
import { getComplianceRules } from "@/lib/geo-compliance";
import { checkRateLimitAsync } from "@/lib/rate-limiter";
import { getClientIp } from "@/lib/security";

/**
 * GET /api/geo — Returns jurisdiction-specific compliance settings for the client.
 * Used by the Bestie chat UI to adjust disclosure intervals and crisis resources.
 * No auth required — returns only public compliance info based on IP location.
 */
export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const { allowed } = await checkRateLimitAsync(`geo:${ip}`, 30);
  if (!allowed) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const rules = getComplianceRules(req.headers);

  return Response.json({
    jurisdiction: rules.jurisdiction,
    countryCode: rules.countryCode,
    requiresAiDisclosure: rules.requiresAiDisclosure,
    redisclosureIntervalMs: rules.redisclosureIntervalMs,
    crisisResources: rules.crisisResources,
    minimumAge: rules.minimumAge,
  });
}
