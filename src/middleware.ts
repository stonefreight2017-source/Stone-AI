import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { healthLimit, webhookLimit, authenticatedLimit } from "@/lib/rate-limit";
import type { RateLimitResult } from "@/lib/rate-limit";

// Allowed origins for CORS — overrides Vercel's default Access-Control-Allow-Origin: *
const ALLOWED_ORIGINS = [
  'https://stone-ai.net',
  'https://www.stone-ai.net',
  'https://tools.stone-ai.net',
  'https://app.stone-ai.net',
];

// Public routes — no authentication required
const isPublicRoute = createRouteMatcher([
  "/",
  "/terms",
  "/privacy",
  "/cookies",
  "/enterprise(.*)",
  "/reseller-agreement",
  "/about",
  "/blog",
  "/security",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/stripe/webhook",
  "/api/webhooks/clerk",
  "/api/health",
  "/api/internal/(.*)", // Internal endpoints — auth handled by secret header
  "/api/enterprise/(.*)",
  "/api/v1/(.*)", // API key auth handled separately
  "/api/internal/(.*)", // Internal alert system — secured by x-alert-secret header
  "/chat",
  "/api/chat",
  "/pricing",
  "/accessibility",
  "/refund-policy",
  "/sla",
  "/.well-known/(.*)",
  "/sitemap.xml",
  "/robots.txt",
]);

// Security headers applied to every response
// Modeled after Cloudflare, Stripe, and Discord security posture
const SECURITY_HEADERS: Record<string, string> = {
  // Prevent clickjacking — page cannot be embedded in iframes
  "X-Frame-Options": "DENY",
  // Block MIME type sniffing — prevents XSS via content-type confusion
  "X-Content-Type-Options": "nosniff",
  // Strict referrer policy — don't leak URLs to third parties
  "Referrer-Policy": "strict-origin-when-cross-origin",
  // Permissions policy — disable dangerous browser features
  "Permissions-Policy":
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  // XSS protection (legacy browsers)
  "X-XSS-Protection": "1; mode=block",
  // Content Security Policy — defense-in-depth against XSS, data injection
  "Content-Security-Policy": [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''} https://clerk.stone-ai.net https://*.clerk.accounts.dev https://challenges.cloudflare.com https://static.cloudflareinsights.com https://va.vercel-scripts.com`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://clerk.stone-ai.net https://*.clerk.accounts.dev https://api.stripe.com https://challenges.cloudflare.com https://clerk-telemetry.com wss:",
    "frame-src 'self' https://clerk.stone-ai.net https://*.clerk.accounts.dev https://js.stripe.com https://challenges.cloudflare.com",
    "worker-src 'self' blob:",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
  ].join("; "),
  // HSTS — force HTTPS for 1 year, include subdomains
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  // Prevent caching of sensitive API responses
  "Cache-Control": "no-store, no-cache, must-revalidate, private",
  // Cross-Origin policies — prevent data leakage to other origins
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "credentialless",
};

// API-specific headers (override some general headers for API routes)
const API_CACHE_HEADER = "no-store, no-cache, must-revalidate, private";

export default clerkMiddleware(async (auth, req) => {
  const pathname = req.nextUrl.pathname;
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  // ---------------------------------------------------------------------------
  // Rate limiting (applied before auth to block floods early)
  // ---------------------------------------------------------------------------
  let rateLimitResult: RateLimitResult | null = null;

  if (pathname === "/api/health") {
    rateLimitResult = healthLimit(ip);
  } else if (pathname.startsWith("/api/webhooks/")) {
    rateLimitResult = webhookLimit(ip);
  }

  // If a public-route rate limit was hit, short-circuit with 429
  if (rateLimitResult && !rateLimitResult.success) {
    const retryAfter = Math.ceil((rateLimitResult.reset - Date.now()) / 1000);
    return new Response(
      JSON.stringify({ error: "Too many requests", retryAfter }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(rateLimitResult.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(rateLimitResult.reset),
        },
      },
    );
  }

  // Protect non-public routes — redirect unauthenticated users to sign-in
  if (!isPublicRoute(req)) {
    const { userId } = await auth();
    if (!userId) {
      // API routes: return 401 JSON instead of redirect (prevents route enumeration)
      if (pathname.startsWith('/api/')) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const signInUrl = new URL("/sign-in", req.url);
      signInUrl.searchParams.set("redirect_url", req.url);
      return NextResponse.redirect(signInUrl);
    }
  }

  // Authenticated API rate limiting — apply after auth so we have the userId
  if (pathname.startsWith("/api/") && !rateLimitResult) {
    const { userId } = await auth();
    if (userId) {
      rateLimitResult = authenticatedLimit(userId);
      if (!rateLimitResult.success) {
        const retryAfter = Math.ceil(
          (rateLimitResult.reset - Date.now()) / 1000,
        );
        return new Response(
          JSON.stringify({ error: "Too many requests", retryAfter }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(retryAfter),
              "X-RateLimit-Limit": String(rateLimitResult.limit),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": String(rateLimitResult.reset),
            },
          },
        );
      }
    }
  }

  // Create response with security headers
  const response = NextResponse.next();

  // Apply all security headers
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // Auth pages (sign-in/sign-up) need relaxed policies for Clerk to render
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
    response.headers.delete("Cross-Origin-Embedder-Policy");
    response.headers.delete("Cross-Origin-Opener-Policy");
    response.headers.delete("Cross-Origin-Resource-Policy");
    response.headers.delete("Content-Security-Policy");
  }

  // API routes: ensure no caching, add rate limit + CORS headers
  if (pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", API_CACHE_HEADER);

    // Attach rate limit headers so clients can track their budget
    if (rateLimitResult) {
      response.headers.set("X-RateLimit-Limit", String(rateLimitResult.limit));
      response.headers.set(
        "X-RateLimit-Remaining",
        String(rateLimitResult.remaining),
      );
      response.headers.set("X-RateLimit-Reset", String(rateLimitResult.reset));
    }

    // CORS for API v1 (external API access) — allowlisted origins only
    if (pathname.startsWith("/api/v1/")) {
      const origin = req.headers.get("origin");
      const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? "https://stone-ai.net,https://app.stone-ai.net,https://www.stone-ai.net").split(",");
      if (origin && allowedOrigins.includes(origin)) {
        response.headers.set("Access-Control-Allow-Origin", origin);
        response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
        response.headers.set(
          "Access-Control-Allow-Headers",
          "Content-Type, Authorization"
        );
        response.headers.set("Access-Control-Max-Age", "86400");
      }
    }
  }

  // Override Vercel's default Access-Control-Allow-Origin: * with explicit origin check
  const origin = req.headers.get('origin');
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  } else {
    // Explicitly set to our primary domain to override Vercel's wildcard
    response.headers.set('Access-Control-Allow-Origin', 'https://stone-ai.net');
  }

  // Strip server identification headers
  response.headers.delete("X-Powered-By");
  response.headers.delete("Server");
  response.headers.delete("X-Vercel-Id");
  response.headers.delete("X-Vercel-Cache");
  response.headers.delete("X-Matched-Path");
  response.headers.delete("X-Nextjs-Prerender");
  response.headers.delete("X-Nextjs-Stale-Time");

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
