import type { NextConfig } from "next";

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

  // Disable x-powered-by header
  poweredByHeader: false,
};

export default nextConfig;
