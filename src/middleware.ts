import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public routes — no authentication required
const isPublicRoute = createRouteMatcher([
  "/",
  "/pricing",
  "/terms",
  "/privacy",
  "/acceptable-use",
  "/refund",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/stripe/webhook",
  "/api/health",
  "/api/v1/(.*)", // API key auth handled separately
  "/api/enterprise/(.*)", // Public enterprise endpoints (sales widget)
  "/enterprise",
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
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  // XSS protection (legacy browsers)
  "X-XSS-Protection": "1; mode=block",
  // Content Security Policy — defense-in-depth against XSS, data injection
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://clerk.stone-ai.net https://*.clerk.accounts.dev",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://clerk.stone-ai.net https://*.clerk.accounts.dev https://api.stripe.com wss:",
    "frame-src 'self' https://clerk.stone-ai.net https://*.clerk.accounts.dev https://js.stripe.com",
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
  "Cross-Origin-Opener-Policy": "same-origin",
  "Cross-Origin-Resource-Policy": "same-origin",
  "Cross-Origin-Embedder-Policy": "credentialless",
};

// API-specific headers (override some general headers for API routes)
const API_CACHE_HEADER = "no-store, no-cache, must-revalidate, private";

export default clerkMiddleware(async (auth, req) => {
  // Protect non-public routes
  if (!isPublicRoute(req)) {
    await auth.protect();
  }

  // Create response with security headers
  const response = NextResponse.next();

  // Apply all security headers
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // API routes: ensure no caching, add CORS headers
  if (req.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("Cache-Control", API_CACHE_HEADER);

    // CORS for API v1 (external API access)
    if (req.nextUrl.pathname.startsWith("/api/v1/")) {
      const origin = req.headers.get("origin");
      // Allow CORS for API key-authenticated endpoints
      if (origin) {
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

  // Strip server identification headers
  response.headers.delete("X-Powered-By");
  response.headers.delete("Server");

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
