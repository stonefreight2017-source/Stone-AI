# SEO & Metadata in Next.js 16 — Frontend Engineering Seed

> Deep knowledge seed for the Stone AI Palace USB Package.
> Covers the Next.js 16 Metadata API, Open Graph images, JSON-LD structured data, sitemaps, robots.txt, canonical URLs, and Stone AI-specific SEO patterns.

---

## Table of Contents

1. [Next.js 16 Metadata API Overview](#nextjs-16-metadata-api-overview)
2. [Static Metadata](#static-metadata)
3. [Dynamic Metadata with generateMetadata](#dynamic-metadata-with-generatemetadata)
4. [Open Graph Images](#open-graph-images)
5. [Twitter Card Configuration](#twitter-card-configuration)
6. [JSON-LD Structured Data](#json-ld-structured-data)
7. [Sitemap Generation](#sitemap-generation)
8. [robots.txt Configuration](#robotstxt-configuration)
9. [Canonical URLs & Alternate Languages](#canonical-urls--alternate-languages)
10. [Social Sharing Preview Optimization](#social-sharing-preview-optimization)
11. [Stone AI Specific SEO Patterns](#stone-ai-specific-seo-patterns)
12. [SEO Audit Checklist](#seo-audit-checklist)

---

## Next.js 16 Metadata API Overview

Next.js 16 uses a file-based and export-based metadata system in the App Router. There are two approaches:

1. **Static metadata**: Export a `metadata` object from `layout.tsx` or `page.tsx`
2. **Dynamic metadata**: Export a `generateMetadata` function for runtime-computed metadata

**Resolution order**: Metadata merges from root layout down to the page. Deeper segments override shallower ones. Page-level metadata overrides layout-level metadata for the same fields.

```
app/layout.tsx          → base metadata (site name, default OG image)
  app/(marketing)/layout.tsx → marketing-specific defaults
    app/(marketing)/pricing/page.tsx → pricing page metadata
```

### Metadata Files

Next.js also supports special file-based metadata:

| File | Purpose |
|---|---|
| `favicon.ico` | Browser tab icon (placed in `app/`) |
| `icon.tsx` | Dynamic icon generation |
| `apple-icon.tsx` | Apple touch icon |
| `opengraph-image.tsx` | Dynamic OG image generation |
| `twitter-image.tsx` | Dynamic Twitter card image |
| `sitemap.ts` | Sitemap generation |
| `robots.ts` | robots.txt generation |
| `manifest.ts` | Web app manifest |

---

## Static Metadata

### Root Layout Metadata

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  // Core
  title: {
    default: "Stone AI — Your AI-Powered Team",
    template: "%s | Stone AI",  // Pages can set just the page name
  },
  description:
    "44 specialized AI agents at your command. Chat, collaborate, and build with AI that understands your workflow.",

  // Base URL for resolving relative URLs
  metadataBase: new URL("https://stone-ai.net"),

  // Keywords (less SEO weight now but still indexed)
  keywords: [
    "AI agents",
    "AI chat",
    "AI assistant",
    "Stone AI",
    "AI team",
    "productivity AI",
  ],

  // Author
  authors: [{ name: "Stone AI", url: "https://stone-ai.net" }],
  creator: "Stone AI",
  publisher: "Stone AI",

  // Robots defaults
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Open Graph defaults
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://stone-ai.net",
    siteName: "Stone AI",
    title: "Stone AI — Your AI-Powered Team",
    description:
      "44 specialized AI agents at your command. Chat, collaborate, and build with AI.",
    images: [
      {
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "Stone AI — Your AI-Powered Team",
      },
    ],
  },

  // Twitter defaults
  twitter: {
    card: "summary_large_image",
    title: "Stone AI — Your AI-Powered Team",
    description:
      "44 specialized AI agents at your command.",
    images: ["/og-default.png"],
    creator: "@stoneai",
  },

  // Icons
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },

  // Manifest
  manifest: "/site.webmanifest",

  // Verification
  verification: {
    google: "google-site-verification-token-here",
    // yandex: "...",
    // yahoo: "...",
  },

  // Category
  category: "technology",
};
```

### Page-Level Static Metadata

```tsx
// src/app/(marketing)/pricing/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",  // Renders as "Pricing | Stone AI" via template
  description:
    "Choose the plan that fits your needs. Free, Starter, Plus, Smart, and Pro tiers with AI agents for every workflow.",
  openGraph: {
    title: "Stone AI Pricing — Plans for Every Team",
    description:
      "From free to pro — find the perfect AI agent tier.",
    images: [{ url: "/og-pricing.png", width: 1200, height: 630 }],
  },
};

export default function PricingPage() {
  return <PricingContent />;
}
```

---

## Dynamic Metadata with generateMetadata

Use `generateMetadata` when metadata depends on route params, database queries, or external data.

### Agent Page Dynamic Metadata

```tsx
// src/app/(dashboard)/agents/[agentId]/page.tsx
import type { Metadata, ResolvingMetadata } from "next";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface AgentPageProps {
  params: Promise<{ agentId: string }>;
}

export async function generateMetadata(
  { params }: AgentPageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { agentId } = await params;

  const agent = await prisma.agent.findUnique({
    where: { id: agentId },
    select: { name: true, description: true, tier: true, avatar: true },
  });

  if (!agent) {
    return { title: "Agent Not Found" };
  }

  // Access parent metadata (from layout) if needed
  const previousImages = (await parent).openGraph?.images || [];

  return {
    title: agent.name,
    description: agent.description,
    openGraph: {
      title: `${agent.name} — Stone AI Agent`,
      description: agent.description,
      images: [
        {
          url: `/api/og/agent?name=${encodeURIComponent(agent.name)}&tier=${agent.tier}`,
          width: 1200,
          height: 630,
          alt: `${agent.name} AI Agent`,
        },
        ...previousImages,
      ],
    },
  };
}

export default async function AgentPage({ params }: AgentPageProps) {
  const { agentId } = await params;
  // ... render agent page
}
```

### User Profile Dynamic Metadata

```tsx
// src/app/(dashboard)/profile/[username]/page.tsx
import type { Metadata } from "next";

interface ProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    select: { username: true, displayName: true, bio: true, avatarUrl: true },
  });

  if (!user) {
    return {
      title: "User Not Found",
      robots: { index: false },  // Don't index 404-like pages
    };
  }

  return {
    title: user.displayName ?? user.username,
    description: user.bio ?? `${user.displayName}'s profile on Stone AI`,
    openGraph: {
      title: `${user.displayName ?? user.username} on Stone AI`,
      images: user.avatarUrl
        ? [{ url: user.avatarUrl, width: 256, height: 256 }]
        : [],
    },
    // Prevent indexing private profiles
    robots: {
      index: true,  // or false for private profiles
      follow: true,
    },
  };
}
```

### generateMetadata Best Practices

1. **Fetch only what you need**: Use `select` in Prisma to minimize data transfer.
2. **Next.js deduplicates fetches**: If your page component fetches the same data, Next.js will deduplicate the request automatically when using `fetch()`. With Prisma, consider a cached helper.
3. **Handle missing data gracefully**: Always check for null/undefined.
4. **Don't index error states**: Set `robots: { index: false }` for not-found or error pages.
5. **Keep descriptions under 160 characters**: Search engines truncate longer descriptions.

```tsx
// Shared data fetching helper with caching
import { cache } from "react";

export const getAgent = cache(async (agentId: string) => {
  return prisma.agent.findUnique({
    where: { id: agentId },
  });
});

// Now both generateMetadata and the page component call getAgent()
// and it only executes once per request
```

---

## Open Graph Images

### Static OG Images

Place images in `public/`:
- `public/og-default.png` — 1200x630px (recommended)
- `public/og-pricing.png` — custom per page

### Dynamic OG Image Generation with Route Handlers

```tsx
// src/app/api/og/agent/route.tsx
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const name = searchParams.get("name") ?? "AI Agent";
  const tier = searchParams.get("tier") ?? "FREE";

  const tierColors: Record<string, string> = {
    FREE: "#a8a29e",     // stone-400
    STARTER: "#22c55e",  // green-500
    PLUS: "#3b82f6",     // blue-500
    SMART: "#a855f7",    // purple-500
    PRO: "#f59e0b",      // amber-500
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0c0a09",  // stone-950
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Logo area */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "#f59e0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: "bold",
              color: "#000",
            }}
          >
            S
          </div>
          <span style={{ fontSize: "28px", color: "#f5f5f4", fontWeight: "bold" }}>
            Stone AI
          </span>
        </div>

        {/* Agent name */}
        <h1
          style={{
            fontSize: "64px",
            fontWeight: "bold",
            color: "#fafaf9",
            margin: "0 0 16px 0",
            textAlign: "center",
          }}
        >
          {name}
        </h1>

        {/* Tier badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 20px",
            borderRadius: "9999px",
            backgroundColor: `${tierColors[tier]}20`,
            border: `2px solid ${tierColors[tier]}`,
          }}
        >
          <span
            style={{
              fontSize: "18px",
              fontWeight: "600",
              color: tierColors[tier],
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {tier} TIER
          </span>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "16px", color: "#78716c" }}>
            stone-ai.net
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
```

### File-Based OG Image Generation

```tsx
// src/app/(marketing)/pricing/opengraph-image.tsx
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Stone AI Pricing Plans";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0c0a09",
          color: "#fafaf9",
        }}
      >
        <h1 style={{ fontSize: "56px", fontWeight: "bold", margin: "0 0 20px" }}>
          Plans for Every Team
        </h1>
        <div style={{ display: "flex", gap: "24px", fontSize: "20px" }}>
          <span style={{ color: "#a8a29e" }}>Free</span>
          <span style={{ color: "#22c55e" }}>Starter $19.99</span>
          <span style={{ color: "#3b82f6" }}>Plus $49.99</span>
          <span style={{ color: "#a855f7" }}>Smart $99.99</span>
          <span style={{ color: "#f59e0b" }}>Pro $200</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
```

### OG Image Best Practices

1. **Dimensions**: 1200x630px is the standard. Facebook, LinkedIn, and Twitter all support it.
2. **Text size**: At least 40px for primary text — images are often shown small.
3. **Safe zones**: Keep important content away from edges (at least 60px margin).
4. **Contrast**: Light text on dark background or vice versa. No subtle colors.
5. **File size**: Keep under 1MB. OG images that take too long to generate may time out.
6. **Caching**: Add `Cache-Control` headers for generated images.

```tsx
// In route handler, add caching
return new ImageResponse(jsx, {
  width: 1200,
  height: 630,
  headers: {
    "Cache-Control": "public, max-age=86400, s-maxage=86400",  // 24h
  },
});
```

---

## Twitter Card Configuration

### Card Types

| Type | Preview |
|---|---|
| `summary` | Small image left, text right |
| `summary_large_image` | Large image top, text bottom |
| `app` | App install card |
| `player` | Video/audio player |

### Configuration

```tsx
// In metadata export
export const metadata: Metadata = {
  twitter: {
    card: "summary_large_image",
    title: "Stone AI — Your AI-Powered Team",
    description: "44 specialized AI agents at your command.",
    images: ["/og-default.png"],  // Falls back to OG image if not specified
    creator: "@stoneai",
    site: "@stoneai",
  },
};
```

### Twitter vs Open Graph Priority

Twitter's crawler checks for Twitter-specific meta tags first, then falls back to Open Graph. In Next.js, if you set `openGraph` but not `twitter`, the OG values will be used. Set both when you want different text/images for Twitter vs other platforms.

```tsx
// Different copy for Twitter (shorter, more punchy)
export const metadata: Metadata = {
  openGraph: {
    title: "Stone AI — Your AI-Powered Team of 44 Specialized Agents",
    description:
      "Chat, collaborate, and build with AI agents designed for every workflow. From coding to marketing to strategy.",
  },
  twitter: {
    card: "summary_large_image",
    title: "44 AI agents. One team. Your workflow.",  // Shorter for Twitter
    description: "The AI team you've been waiting for. Try Stone AI free.",
  },
};
```

---

## JSON-LD Structured Data

JSON-LD helps search engines understand the content of your pages. It powers rich snippets (star ratings, FAQs, breadcrumbs, etc.).

### Adding JSON-LD to Pages

```tsx
// src/components/json-ld.tsx
interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
```

### Organization Schema (Root Layout)

```tsx
// src/app/layout.tsx
import { JsonLd } from "@/components/json-ld";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Stone AI",
            url: "https://stone-ai.net",
            logo: "https://stone-ai.net/logo.png",
            sameAs: [
              "https://twitter.com/stoneai",
              "https://github.com/stonefreight2017-source/Stone-AI",
            ],
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "customer support",
              email: "support@stone-ai.net",
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
```

### SaaS Product Schema

```tsx
// src/app/(marketing)/page.tsx (landing page)
<JsonLd
  data={{
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Stone AI",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://stone-ai.net",
    description: "AI-powered team of 44 specialized agents for chat, collaboration, and productivity.",
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
        description: "4 AI agents, basic features",
      },
      {
        "@type": "Offer",
        name: "Starter",
        price: "19.99",
        priceCurrency: "USD",
        billingIncrement: "P1M",
        description: "16 AI agents, Bestie companion",
      },
      {
        "@type": "Offer",
        name: "Plus",
        price: "49.99",
        priceCurrency: "USD",
        billingIncrement: "P1M",
        description: "30 AI agents, advanced features",
      },
      {
        "@type": "Offer",
        name: "Smart",
        price: "99.99",
        priceCurrency: "USD",
        billingIncrement: "P1M",
        description: "39 AI agents, Claude Sonnet powered",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "200",
        priceCurrency: "USD",
        billingIncrement: "P1M",
        description: "38 AI agents, full access",
      },
    ],
  }}
/>
```

### FAQ Schema (Help Page)

```tsx
// src/app/(marketing)/help/page.tsx
const faqs = [
  {
    question: "How many AI agents does Stone AI have?",
    answer: "Stone AI has 44 specialized AI agents, with 42 available to users based on their subscription tier.",
  },
  {
    question: "What AI models does Stone AI use?",
    answer: "Stone AI uses a combination of local vLLM with Qwen 2.5 32B and Anthropic Claude Sonnet for cloud-powered responses.",
  },
  // ... more FAQs
];

<JsonLd
  data={{
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  }}
/>
```

### Breadcrumb Schema

```tsx
// src/components/breadcrumbs.tsx
import { JsonLd } from "@/components/json-ld";

interface BreadcrumbItem {
  name: string;
  href: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: `https://stone-ai.net${item.href}`,
          })),
        }}
      />
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-stone-400">
        {items.map((item, index) => (
          <span key={item.href} className="flex items-center gap-2">
            {index > 0 && <span>/</span>}
            {index === items.length - 1 ? (
              <span className="text-stone-200">{item.name}</span>
            ) : (
              <a href={item.href} className="hover:text-stone-200 transition-colors">
                {item.name}
              </a>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}
```

---

## Sitemap Generation

### Static Sitemap

```tsx
// src/app/sitemap.ts
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://stone-ai.net";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/forum`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    },
  ];
}
```

### Dynamic Sitemap with Database Entries

```tsx
// src/app/sitemap.ts
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://stone-ai.net";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/pricing`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/help`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  ];

  // Dynamic: public agent pages
  const agents = await prisma.agent.findMany({
    where: { isPublic: true },
    select: { id: true, updatedAt: true },
  });

  const agentPages: MetadataRoute.Sitemap = agents.map((agent) => ({
    url: `${baseUrl}/agents/${agent.id}`,
    lastModified: agent.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Dynamic: forum posts (if public)
  const forumPosts = await prisma.forumPost.findMany({
    where: { isPublic: true },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 1000,  // Limit to most recent
  });

  const forumPages: MetadataRoute.Sitemap = forumPosts.map((post) => ({
    url: `${baseUrl}/forum/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.5,
  }));

  return [...staticPages, ...agentPages, ...forumPages];
}
```

### Multiple Sitemaps (Large Sites)

```tsx
// src/app/sitemap.ts — sitemap index
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://stone-ai.net/sitemap-static.xml",
      lastModified: new Date(),
    },
    {
      url: "https://stone-ai.net/sitemap-agents.xml",
      lastModified: new Date(),
    },
    {
      url: "https://stone-ai.net/sitemap-forum.xml",
      lastModified: new Date(),
    },
  ];
}

// Then create separate route handlers for each
// src/app/sitemap-agents.xml/route.ts
```

---

## robots.txt Configuration

### File-Based

```tsx
// src/app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",         // API routes
          "/dashboard/",   // Authenticated pages
          "/admin/",       // Admin panel
          "/settings/",    // User settings
          "/chat/",        // Chat sessions (private)
          "/_next/",       // Next.js internals
        ],
      },
      {
        // Block AI scrapers if desired
        userAgent: "GPTBot",
        disallow: "/",
      },
      {
        userAgent: "ChatGPT-User",
        disallow: "/",
      },
      {
        userAgent: "CCBot",
        disallow: "/",
      },
    ],
    sitemap: "https://stone-ai.net/sitemap.xml",
  };
}
```

### Environment-Aware robots.txt

```tsx
// src/app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const isProduction = process.env.VERCEL_ENV === "production";

  if (!isProduction) {
    // Block all crawlers on preview/staging
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/admin/", "/settings/", "/chat/"],
    },
    sitemap: "https://stone-ai.net/sitemap.xml",
  };
}
```

---

## Canonical URLs & Alternate Languages

### Canonical URLs

Canonical URLs tell search engines which version of a page is the "official" one, preventing duplicate content issues.

```tsx
// Automatic via metadataBase
export const metadata: Metadata = {
  metadataBase: new URL("https://stone-ai.net"),
  // Next.js will automatically generate canonical URLs based on the route
};

// Explicit canonical
export const metadata: Metadata = {
  alternates: {
    canonical: "/pricing",  // Resolves to https://stone-ai.net/pricing
  },
};

// Dynamic canonical for pages with query params
export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { agentId } = await params;
  return {
    alternates: {
      canonical: `/agents/${agentId}`,  // Strips query params from canonical
    },
  };
}
```

### Alternate Languages (i18n)

```tsx
export const metadata: Metadata = {
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/en",
      "es-ES": "/es",
      "fr-FR": "/fr",
      "de-DE": "/de",
      "ja-JP": "/ja",
      "pt-BR": "/pt",
    },
  },
};
```

### hreflang for Dynamic Pages

```tsx
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, slug } = await params;

  return {
    alternates: {
      canonical: `/${locale}/${slug}`,
      languages: {
        "en-US": `/en/${slug}`,
        "es-ES": `/es/${slug}`,
        "fr-FR": `/fr/${slug}`,
      },
    },
  };
}
```

---

## Social Sharing Preview Optimization

### Testing Tools

| Platform | Tool URL |
|---|---|
| Facebook / Meta | https://developers.facebook.com/tools/debug/ |
| Twitter / X | https://cards-dev.twitter.com/validator |
| LinkedIn | https://www.linkedin.com/post-inspector/ |
| Open Graph | https://www.opengraph.xyz/ |
| General | https://metatags.io/ |

### Common Issues and Fixes

**Problem**: Social platforms show outdated preview
**Fix**: Use the platform's debug tool to force a cache refresh.

**Problem**: Image not showing
**Fix**: Ensure the OG image URL is absolute (starts with `https://`), the image is accessible (not behind auth), and the image is at least 200x200px.

**Problem**: Wrong title/description
**Fix**: Check metadata resolution order. Page metadata overrides layout metadata. Use browser dev tools to inspect `<head>` tags.

### Preview Component for Development

```tsx
// src/components/dev/social-preview.tsx (development only)
"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface MetaTags {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: string;
}

export function SocialPreviewDevTool() {
  const pathname = usePathname();
  const [meta, setMeta] = useState<MetaTags | null>(null);

  useEffect(() => {
    const getMeta = (name: string) =>
      document.querySelector(`meta[property="${name}"], meta[name="${name}"]`)?.getAttribute("content") ?? "";

    setMeta({
      title: document.title,
      description: getMeta("description"),
      ogTitle: getMeta("og:title"),
      ogDescription: getMeta("og:description"),
      ogImage: getMeta("og:image"),
      twitterCard: getMeta("twitter:card"),
    });
  }, [pathname]);

  if (process.env.NODE_ENV !== "development" || !meta) return null;

  return (
    <div className="fixed bottom-4 left-4 z-[9999] w-96 rounded-lg border border-stone-700 bg-stone-900 p-4 text-xs shadow-2xl">
      <h3 className="mb-2 font-bold text-amber-500">Social Preview</h3>
      {/* Google */}
      <div className="mb-3 rounded bg-white p-2 text-black">
        <div className="text-blue-700 text-sm">{meta.title}</div>
        <div className="text-green-700 text-xs">stone-ai.net{pathname}</div>
        <div className="text-gray-600">{meta.description?.slice(0, 160)}</div>
      </div>
      {/* OG card */}
      <div className="rounded bg-stone-800 overflow-hidden">
        {meta.ogImage && (
          <img src={meta.ogImage} alt="OG Preview" className="w-full h-32 object-cover" />
        )}
        <div className="p-2">
          <div className="text-stone-400 text-[10px] uppercase">stone-ai.net</div>
          <div className="text-stone-100 text-sm font-medium">{meta.ogTitle}</div>
          <div className="text-stone-400">{meta.ogDescription?.slice(0, 100)}</div>
        </div>
      </div>
    </div>
  );
}
```

---

## Stone AI Specific SEO Patterns

### Landing Page SEO

```tsx
// src/app/(marketing)/page.tsx
import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";

export const metadata: Metadata = {
  title: "Stone AI — Your AI-Powered Team of 44 Agents",
  description:
    "Meet your AI team. 44 specialized agents for coding, writing, marketing, strategy, and more. Free to start, powerful at scale.",
  keywords: [
    "AI agents",
    "AI team",
    "AI assistant",
    "AI chat",
    "productivity AI",
    "AI coding assistant",
    "AI writing assistant",
    "Stone AI",
  ],
  openGraph: {
    type: "website",
    title: "Stone AI — Your AI-Powered Team",
    description: "44 specialized AI agents. Free to start.",
    url: "https://stone-ai.net",
    images: [
      {
        url: "/og-landing.png",
        width: 1200,
        height: 630,
        alt: "Stone AI — 44 AI Agents, One Team",
      },
    ],
  },
};

export default function LandingPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Stone AI",
          url: "https://stone-ai.net",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://stone-ai.net/search?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }}
      />
      {/* Page content */}
    </>
  );
}
```

### Pricing Page SEO

```tsx
// src/app/(marketing)/pricing/page.tsx
export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Stone AI pricing: Free ($0), Starter ($19.99/mo), Plus ($49.99/mo), Smart ($99.99/mo), Pro ($200/mo). Start free, upgrade anytime.",
  openGraph: {
    title: "Stone AI Pricing — Plans for Every Team",
    description:
      "From free to pro. 4 to 38 AI agents. Find your perfect tier.",
  },
};
```

### Agent Discovery Pages

```tsx
// src/app/(marketing)/agents/page.tsx
export const metadata: Metadata = {
  title: "AI Agents",
  description:
    "Explore 44 specialized AI agents. From coding and debugging to writing, marketing, and business strategy.",
  openGraph: {
    title: "Meet the Stone AI Agents",
    description: "44 specialists. Every workflow covered.",
  },
};
```

### noindex for Authenticated Routes

```tsx
// src/app/(dashboard)/layout.tsx
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};
```

---

## SEO Audit Checklist

### Technical SEO

- [ ] `metadataBase` set in root layout
- [ ] Every page has unique `title` and `description`
- [ ] `robots.ts` blocks private routes
- [ ] `sitemap.ts` includes all public pages
- [ ] Canonical URLs set for pages with query params
- [ ] 404 pages return proper 404 status code
- [ ] Redirect chains are minimal (max 1 hop)
- [ ] Page load time under 3 seconds (Core Web Vitals)

### Content SEO

- [ ] Title tags under 60 characters
- [ ] Meta descriptions under 160 characters
- [ ] H1 on every page, only one H1
- [ ] Proper heading hierarchy (H1 > H2 > H3)
- [ ] Alt text on all images
- [ ] Internal linking between related pages

### Open Graph / Social

- [ ] OG image set for every public page (1200x630)
- [ ] OG title and description differ from meta title/description when needed
- [ ] Twitter card configured
- [ ] Tested on Facebook debugger, Twitter validator, LinkedIn inspector

### Structured Data

- [ ] Organization schema on root
- [ ] SoftwareApplication schema on landing page
- [ ] FAQ schema on help page
- [ ] Breadcrumb schema on hierarchical pages
- [ ] Tested with Google Rich Results Test

### Performance (SEO Impact)

- [ ] Core Web Vitals passing (LCP < 2.5s, INP < 200ms, CLS < 0.1)
- [ ] Images optimized with Next.js `<Image />` component
- [ ] Fonts preloaded or using `next/font`
- [ ] Critical CSS inlined (Next.js handles this)
- [ ] JavaScript bundle reasonable (<200KB first load)

---

*Stone AI Palace USB Package — Frontend Engineering Seed*
*SEO & Metadata in Next.js 16 v1.0*
