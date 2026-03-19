import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // Fix turbopack root detection when parent dirs have lockfiles
  turbopack: {
    root: process.cwd(),
  },

  // Security headers — defense-in-depth layer alongside middleware
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "off" },
          { key: "X-Download-Options", value: "noopen" },
          { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
        ],
      },
      {
        // Prevent caching on all API routes
        source: "/api/(.*)",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, private" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
    ];
  },

  // Redirect /app/chat to /app (chat lives at /app, not /app/chat)
  async redirects() {
    return [
      {
        source: "/app/chat",
        destination: "/app",
        permanent: true,
      },
    ];
  },

  // Disable x-powered-by header
  poweredByHeader: false,
};

export default withSentryConfig(nextConfig, {
  // Suppress Sentry CLI logs during build
  silent: true,

  // Disable source map upload (needs SENTRY_AUTH_TOKEN — enable post-launch)
  sourcemaps: {
    disable: true,
  },

  // Disable automatic release creation (needs auth token)
  release: {
    create: false,
  },

  // Disable telemetry to Sentry
  telemetry: false,
});
