# Responsive Layout System — Deep Knowledge Seed

## Overview

Stone AI serves users on desktop, tablet, and mobile. Every layout must be mobile-first, fluid, and accessible. This seed covers the full responsive system: Tailwind v4 utilities, layout primitives, the Stone AI sidebar+main pattern, mobile navigation, container queries, typography scaling, touch targets, viewport units, and complete TSX examples.

---

## Table of Contents

1. [Mobile-First Philosophy](#mobile-first-philosophy)
2. [Tailwind v4 Responsive Utilities](#tailwind-v4-responsive-utilities)
3. [Layout Primitives](#layout-primitives)
4. [Sidebar + Main Content Layout](#sidebar--main-content-layout)
5. [Mobile Navigation Patterns](#mobile-navigation-patterns)
6. [Container Queries](#container-queries)
7. [Responsive Typography](#responsive-typography)
8. [Image and Media Patterns](#image-and-media-patterns)
9. [Touch Target Sizing](#touch-target-sizing)
10. [Viewport Units](#viewport-units)
11. [Breakpoint Strategy](#breakpoint-strategy)
12. [Complete Layout Examples](#complete-layout-examples)

---

## Mobile-First Philosophy

Mobile-first means writing base styles for mobile, then layering on complexity with breakpoints. Not the other way around.

```
WRONG (desktop-first):
  .sidebar { width: 280px; display: block; }
  @media (max-width: 768px) { .sidebar { display: none; } }

RIGHT (mobile-first):
  .sidebar { display: none; }
  @media (min-width: 768px) { .sidebar { display: block; width: 280px; } }
```

In Tailwind, this is the default. Unprefixed utilities apply to ALL screen sizes. Breakpoint prefixes apply at that size AND UP.

```tsx
// Mobile: stack vertically, 1 column
// md (768px+): 2 columns side by side
// lg (1024px+): 3 columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} item={item} />)}
</div>
```

---

## Tailwind v4 Responsive Utilities

### Default Breakpoints

```
sm:  640px   — Large phones, landscape
md:  768px   — Tablets
lg:  1024px  — Small laptops, tablets landscape
xl:  1280px  — Desktop
2xl: 1536px  — Large desktop
```

### Custom Breakpoints in Tailwind v4

```css
/* src/app/globals.css */
@import "tailwindcss";

@theme {
  --breakpoint-xs: 475px;    /* Small phones */
  --breakpoint-3xl: 1920px;  /* Ultra-wide */
}
```

### Range Breakpoints (Tailwind v4)

```tsx
// Tailwind v4 supports max-width with 'max-' prefix
<div className="max-md:px-4">
  {/* Padding only below md (< 768px) */}
</div>

// Range: only between md and lg
<div className="md:max-lg:grid-cols-2">
  {/* 2 columns only between 768px and 1023px */}
</div>
```

### Common Responsive Patterns

```tsx
// Responsive padding
<div className="px-4 sm:px-6 lg:px-8">

// Responsive gap
<div className="gap-4 md:gap-6 lg:gap-8">

// Show/hide by breakpoint
<div className="hidden md:block">Desktop only</div>
<div className="md:hidden">Mobile only</div>

// Responsive text alignment
<h1 className="text-center md:text-left">

// Responsive flex direction
<div className="flex flex-col md:flex-row">
```

---

## Layout Primitives

### Flex Column (Stack)

```tsx
// src/components/ui/stack.tsx
interface StackProps {
  children: React.ReactNode;
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const gapMap = {
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
} as const;

export function Stack({ children, gap = 'md', className = '' }: StackProps) {
  return (
    <div className={`flex flex-col ${gapMap[gap]} ${className}`}>
      {children}
    </div>
  );
}

// Usage
<Stack gap="lg">
  <Header />
  <MainContent />
  <Footer />
</Stack>
```

### Flex Row (Inline)

```tsx
// src/components/ui/inline.tsx
interface InlineProps {
  children: React.ReactNode;
  gap?: 'sm' | 'md' | 'lg';
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  wrap?: boolean;
  className?: string;
}

const alignMap = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
} as const;

const justifyMap = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
} as const;

export function Inline({
  children,
  gap = 'md',
  align = 'center',
  justify = 'start',
  wrap = false,
  className = '',
}: InlineProps) {
  return (
    <div
      className={`flex ${wrap ? 'flex-wrap' : ''} ${gapMap[gap]}
        ${alignMap[align]} ${justifyMap[justify]} ${className}`}
    >
      {children}
    </div>
  );
}
```

### Container

```tsx
// src/components/ui/container.tsx
interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const sizeMap = {
  sm: 'max-w-2xl',     // 672px
  md: 'max-w-4xl',     // 896px
  lg: 'max-w-6xl',     // 1152px
  xl: 'max-w-7xl',     // 1280px
  full: 'max-w-full',
} as const;

export function Container({ children, size = 'xl', className = '' }: ContainerProps) {
  return (
    <div className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${sizeMap[size]} ${className}`}>
      {children}
    </div>
  );
}
```

### Responsive Grid

```tsx
// src/components/ui/grid.tsx
interface GridProps {
  children: React.ReactNode;
  cols?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Grid({ children, cols, gap = 'md', className = '' }: GridProps) {
  // Generate responsive grid-cols classes
  const colClasses = [
    `grid-cols-${cols?.default ?? 1}`,
    cols?.sm && `sm:grid-cols-${cols.sm}`,
    cols?.md && `md:grid-cols-${cols.md}`,
    cols?.lg && `lg:grid-cols-${cols.lg}`,
    cols?.xl && `xl:grid-cols-${cols.xl}`,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={`grid ${colClasses} ${gapMap[gap]} ${className}`}>
      {children}
    </div>
  );
}

// Usage
<Grid cols={{ default: 1, sm: 2, lg: 3, xl: 4 }} gap="lg">
  {agents.map(agent => <AgentCard key={agent.id} agent={agent} />)}
</Grid>
```

---

## Sidebar + Main Content Layout

This is the core Stone AI layout pattern: a collapsible sidebar on the left, main content on the right.

### Desktop: Sidebar Always Visible

```tsx
// src/components/layout/app-shell.tsx
'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Desktop sidebar — hidden on mobile */}
      <aside className="hidden md:flex md:w-64 lg:w-72 md:flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      <MobileNav open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header with hamburger */}
        <header className="flex items-center h-14 px-4 border-b md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100
                       dark:hover:bg-gray-800"
            aria-label="Open menu"
          >
            <MenuIcon className="w-5 h-5" />
          </button>
          <span className="ml-3 font-semibold">Stone AI</span>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
```

### Sidebar Component

```tsx
// src/components/layout/sidebar.tsx
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/chat', label: 'Chat', icon: ChatIcon },
  { href: '/agents', label: 'Agents', icon: AgentsIcon },
  { href: '/forum', label: 'Forum', icon: ForumIcon },
  { href: '/bestie', label: 'Bestie', icon: BestieIcon },
  { href: '/help', label: 'Help', icon: HelpIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full w-full border-r bg-gray-50
                    dark:bg-gray-900 dark:border-gray-800">
      {/* Logo */}
      <div className="flex items-center h-14 px-4 border-b
                      dark:border-gray-800">
        <Link href="/" className="flex items-center gap-2">
          <StoneAILogo className="w-8 h-8" />
          <span className="font-bold text-lg">Stone AI</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg
                text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User section at bottom */}
      <div className="p-3 border-t dark:border-gray-800">
        <UserMenu />
      </div>
    </div>
  );
}
```

### Collapsible Sidebar (Desktop)

```tsx
// src/components/layout/collapsible-sidebar.tsx
'use client';

import { useState } from 'react';

export function CollapsibleSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`hidden md:flex flex-col border-r bg-gray-50
        dark:bg-gray-900 dark:border-gray-800 transition-all duration-300
        ${collapsed ? 'w-16' : 'w-64 lg:w-72'}`}
    >
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-4 -right-3 z-10 w-6 h-6 rounded-full
                   border bg-white dark:bg-gray-800 shadow-sm
                   flex items-center justify-center"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        <ChevronIcon
          className={`w-4 h-4 transition-transform
            ${collapsed ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Nav items — show only icons when collapsed */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

---

## Mobile Navigation Patterns

### Drawer (Overlay Sidebar)

```tsx
// src/components/layout/mobile-nav.tsx
'use client';

import { useEffect, useRef } from 'react';
import { Sidebar } from './sidebar';

interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when drawer is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  // Close on route change
  const pathname = usePathname();
  useEffect(() => {
    onClose();
  }, [pathname, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className="absolute inset-y-0 left-0 w-72 bg-white dark:bg-gray-900
                   shadow-xl animate-in slide-in-from-left duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-lg
                     hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Close menu"
        >
          <XIcon className="w-5 h-5" />
        </button>

        <Sidebar />
      </div>
    </div>
  );
}
```

### Bottom Navigation (Mobile Tab Bar)

```tsx
// src/components/layout/bottom-nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/chat', label: 'Chat', icon: ChatIcon },
  { href: '/agents', label: 'Agents', icon: AgentsIcon },
  { href: '/forum', label: 'Forum', icon: ForumIcon },
  { href: '/settings', label: 'More', icon: MoreIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden
                 border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg
                 safe-area-inset-bottom"
    >
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center
                w-full h-full gap-0.5 text-xs font-medium
                transition-colors
                ${isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400'
                }`}
            >
              <Icon className="w-6 h-6" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
```

### Safe Area for Bottom Nav Content

```tsx
// When using bottom nav, main content needs bottom padding
// to avoid being hidden behind the nav bar

// src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <AppShell>
          {/* Add bottom padding on mobile for the bottom nav */}
          <div className="pb-20 md:pb-0">
            {children}
          </div>
        </AppShell>
        <BottomNav />
      </body>
    </html>
  );
}
```

---

## Container Queries

Container queries let components respond to their container's size, not the viewport. Critical for reusable components in different layout contexts.

### Setup in Tailwind v4

```css
/* Tailwind v4 has native container query support */
/* No plugin needed — it's built in */
```

### Basic Container Query

```tsx
// src/components/agent-card.tsx
export function AgentCard({ agent }: { agent: Agent }) {
  return (
    // Mark this as a container
    <div className="@container">
      <div className="flex flex-col @sm:flex-row @sm:items-center gap-3 p-4
                      rounded-xl border">
        {/* Avatar: small in narrow containers, larger in wide ones */}
        <div className="w-10 h-10 @sm:w-12 @sm:h-12 @md:w-14 @md:h-14
                        rounded-full overflow-hidden flex-shrink-0">
          <img src={agent.avatar} alt="" className="w-full h-full object-cover" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm @sm:text-base truncate">
            {agent.name}
          </h3>
          {/* Description: hidden in narrow containers, visible in wide */}
          <p className="hidden @md:block text-sm text-gray-500 line-clamp-2">
            {agent.description}
          </p>
          <span className="text-xs text-gray-400">{agent.tier}</span>
        </div>

        {/* Action button: icon-only narrow, full in wide */}
        <button className="@sm:px-4 @sm:py-2 p-2 rounded-lg bg-blue-600
                           text-white text-sm">
          <span className="hidden @sm:inline">Start Chat</span>
          <ChatIcon className="w-5 h-5 @sm:hidden" />
        </button>
      </div>
    </div>
  );
}
```

### Named Containers

```tsx
// Named containers prevent ambiguity with nested containers
<div className="@container/sidebar">
  <div className="@sm/sidebar:text-lg">
    Responds to sidebar container width
  </div>
</div>

<div className="@container/main">
  <div className="@sm/main:grid-cols-2">
    Responds to main container width
  </div>
</div>
```

### Container Query Breakpoints

```
@xs:   width >= 20rem  (320px)
@sm:   width >= 24rem  (384px)
@md:   width >= 28rem  (448px)
@lg:   width >= 32rem  (512px)
@xl:   width >= 36rem  (576px)
@2xl:  width >= 42rem  (672px)
@3xl:  width >= 48rem  (768px)
@4xl:  width >= 56rem  (896px)
@5xl:  width >= 64rem  (1024px)
```

---

## Responsive Typography

### Type Scale

```tsx
// src/components/ui/typography.tsx

// Responsive heading that scales with viewport
export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold
                   tracking-tight text-gray-900 dark:text-gray-100">
      {children}
    </h1>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xl sm:text-2xl font-semibold
                   text-gray-900 dark:text-gray-100">
      {children}
    </h2>
  );
}

export function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base sm:text-lg font-semibold
                   text-gray-900 dark:text-gray-100">
      {children}
    </h3>
  );
}

export function BodyText({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm sm:text-base leading-relaxed
                  text-gray-600 dark:text-gray-400">
      {children}
    </p>
  );
}

export function SmallText({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">
      {children}
    </span>
  );
}
```

### Fluid Typography with clamp()

```tsx
// For truly fluid typography that doesn't jump at breakpoints
<h1
  className="font-bold tracking-tight"
  style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)' }}
>
  Stone AI
</h1>

// In Tailwind v4, you can use arbitrary values:
<h1 className="text-[clamp(1.5rem,4vw,3rem)] font-bold tracking-tight">
  Stone AI
</h1>
```

### Text Truncation Patterns

```tsx
// Single line truncation
<p className="truncate">Long text that gets cut off...</p>

// Multi-line truncation (line-clamp)
<p className="line-clamp-2">
  This text will show up to 2 lines and then get truncated with an
  ellipsis. Works great for card descriptions.
</p>

// Responsive line-clamp
<p className="line-clamp-2 md:line-clamp-3 lg:line-clamp-none">
  Mobile: 2 lines. Tablet: 3 lines. Desktop: full text.
</p>
```

---

## Image and Media Patterns

### Responsive Images with next/image

```tsx
import Image from 'next/image';

// Fill: image fills its container (responsive by nature)
export function HeroBanner({ src }: { src: string }) {
  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden">
      <Image
        src={src}
        alt="Hero banner"
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 1200px"
        className="object-cover"
        priority // Above the fold — load immediately
      />
    </div>
  );
}

// Responsive sizing with sizes attribute
export function BlogImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={1200}
      height={630}
      sizes="(max-width: 640px) 100vw,
             (max-width: 1024px) 75vw,
             800px"
      className="w-full h-auto rounded-lg"
    />
  );
}
```

### Responsive Aspect Ratios

```tsx
// Video embed with responsive aspect ratio
<div className="relative w-full aspect-video">
  <iframe
    src="https://www.youtube.com/embed/..."
    className="absolute inset-0 w-full h-full rounded-lg"
    allowFullScreen
  />
</div>

// Square aspect ratio for avatars/thumbnails
<div className="relative w-full aspect-square rounded-full overflow-hidden">
  <Image src={avatar} alt="" fill className="object-cover" />
</div>

// Custom aspect ratio
<div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden">
  <Image src={photo} alt="" fill className="object-cover" />
</div>
```

### Responsive Media Grid

```tsx
// Instagram-style grid that adapts to screen size
export function MediaGrid({ images }: { images: string[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2">
      {images.map((src, i) => (
        <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
          <Image
            src={src}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw,
                   (max-width: 768px) 33vw,
                   25vw"
            className="object-cover hover:scale-105 transition-transform"
          />
        </div>
      ))}
    </div>
  );
}
```

---

## Touch Target Sizing

Minimum 48x48px touch targets for mobile accessibility. This is a WCAG 2.5.8 requirement.

### Button Sizing

```tsx
// src/components/ui/button.tsx
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  // Base: minimum 44px height, 48px with padding
  `inline-flex items-center justify-center font-medium
   rounded-lg transition-colors focus-visible:outline-none
   focus-visible:ring-2 focus-visible:ring-blue-500
   disabled:opacity-50 disabled:pointer-events-none`,
  {
    variants: {
      size: {
        sm: 'h-9 px-3 text-sm',          // 36px — desktop only
        md: 'h-10 sm:h-10 px-4 text-sm min-h-[44px] sm:min-h-0',
        lg: 'h-12 px-6 text-base',       // 48px — great for mobile
        icon: 'h-10 w-10 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0',
      },
      // ...
    },
    defaultVariants: {
      size: 'md',
    },
  }
);
```

### Touch-Friendly List Items

```tsx
// Minimum 48px height for tappable list items
export function NavigationList({ items }: { items: NavItem[] }) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="flex items-center gap-3 px-3 py-3
                       min-h-[48px] rounded-lg
                       hover:bg-gray-100 dark:hover:bg-gray-800
                       active:bg-gray-200 dark:active:bg-gray-700"
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
```

### Touch Target Spacing

```tsx
// When targets are close together, add extra spacing on mobile
<div className="flex gap-2 sm:gap-1">
  <button className="p-3 sm:p-2 rounded-lg">Edit</button>
  <button className="p-3 sm:p-2 rounded-lg">Delete</button>
</div>

// For icon buttons that are too small, add invisible touch area
<button className="relative p-1 group">
  <SmallIcon className="w-4 h-4" />
  {/* Invisible touch area extending the target */}
  <span className="absolute -inset-2 sm:hidden" aria-hidden="true" />
</button>
```

---

## Viewport Units

### The dvh Problem

On mobile browsers, `100vh` doesn't account for the dynamic toolbar (URL bar). Use `dvh` instead.

```tsx
// BAD: 100vh on mobile leaves content behind the URL bar
<div className="h-screen"> {/* h-screen = 100vh */}

// GOOD: dvh accounts for the dynamic viewport
<div className="h-dvh">

// Available viewport units:
// h-svh — Small viewport height (toolbar always showing)
// h-lvh — Large viewport height (toolbar hidden)
// h-dvh — Dynamic viewport height (adjusts as toolbar shows/hides)
```

### Common dvh Patterns

```tsx
// Full-screen app shell
<div className="h-dvh flex flex-col overflow-hidden">
  <header className="h-14 flex-shrink-0 border-b">
    {/* Header */}
  </header>
  <main className="flex-1 overflow-y-auto">
    {/* Scrollable content */}
  </main>
</div>

// Chat layout: input pinned to bottom, messages fill remaining space
<div className="flex flex-col h-dvh">
  <header className="h-14 flex-shrink-0" />
  <div className="flex-1 overflow-y-auto p-4">
    {/* Messages */}
  </div>
  <div className="flex-shrink-0 border-t p-4">
    {/* Input */}
  </div>
</div>

// Modal that fills the mobile screen
<div className="fixed inset-0 h-dvh w-full z-50 md:h-auto md:inset-auto
                md:top-1/2 md:-translate-y-1/2 md:left-1/2 md:-translate-x-1/2
                md:max-w-lg md:rounded-xl">
  {/* Modal content */}
</div>
```

### Viewport Width for Full-Bleed

```tsx
// Full-bleed section that breaks out of container
<div className="relative left-1/2 right-1/2 -mx-[50vw] w-screen bg-blue-50">
  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
    {/* Content stays contained */}
  </div>
</div>
```

---

## Breakpoint Strategy

### When to Use Each Breakpoint

```
Base (0px):
  — Single column layout
  — Stack everything vertically
  — Full-width elements
  — Bottom navigation
  — Hamburger menu for sidebar
  — Larger touch targets

sm (640px):
  — Some 2-column grids
  — Wider cards with horizontal layouts
  — Slightly larger text in some places
  — Used sparingly — most changes happen at md

md (768px) — THE BIG ONE:
  — Switch from mobile to desktop layout
  — Show sidebar, hide hamburger
  — Hide bottom nav
  — 2-3 column grids
  — Table layouts (instead of cards)
  — Smaller touch targets OK

lg (1024px):
  — 3-4 column grids
  — Wider sidebar
  — More whitespace
  — Larger typography
  — Side-by-side panels (chat + sidebar)

xl (1280px):
  — Maximum content width kicks in
  — 4+ column grids
  — Generous spacing

2xl (1536px):
  — Rarely needed
  — Ultra-wide accommodations
  — Dashboard data density
```

### Responsive Testing Checklist

```
□ 320px  — iPhone SE (smallest common phone)
□ 375px  — iPhone standard
□ 390px  — iPhone 14/15
□ 430px  — iPhone 14/15 Pro Max
□ 768px  — iPad portrait
□ 1024px — iPad landscape / small laptop
□ 1280px — Standard laptop
□ 1440px — Large laptop
□ 1920px — Full HD desktop
□ 2560px — QHD monitor
```

---

## Complete Layout Examples

### Chat Page Layout

```tsx
// src/app/chat/[id]/page.tsx
// Full responsive chat layout with conversation sidebar
export default function ChatPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex h-full">
      {/* Conversation list sidebar — hidden on mobile */}
      <div className="hidden lg:flex lg:w-80 lg:flex-shrink-0 border-r">
        <ConversationList activeId={params.id} />
      </div>

      {/* Chat area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Chat header */}
        <div className="flex items-center h-14 px-4 border-b flex-shrink-0">
          {/* Back button on mobile (goes to conversation list) */}
          <Link href="/chat" className="lg:hidden p-2 -ml-2 mr-2 rounded-lg
                                        hover:bg-gray-100">
            <ChevronLeftIcon className="w-5 h-5" />
          </Link>
          <AgentInfo agentId={params.id} />
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
          <MessageList conversationId={params.id} />
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 border-t p-4">
          <ChatInput conversationId={params.id} />
        </div>
      </div>
    </div>
  );
}
```

### Settings Page Layout

```tsx
// src/app/settings/page.tsx
export default function SettingsPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <Container size="lg">
        <div className="py-6 sm:py-10">
          <PageTitle>Settings</PageTitle>

          {/* Settings navigation + content */}
          <div className="mt-6 flex flex-col lg:flex-row gap-6 lg:gap-10">
            {/* Settings nav — horizontal scroll on mobile, vertical on desktop */}
            <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible
                            lg:w-48 flex-shrink-0 pb-2 lg:pb-0
                            border-b lg:border-b-0 lg:border-r
                            -mx-4 px-4 lg:mx-0 lg:px-0 lg:pr-6">
              {settingsSections.map((section) => (
                <Link
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex-shrink-0 px-3 py-2 rounded-lg text-sm
                             font-medium whitespace-nowrap
                             hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  {section.label}
                </Link>
              ))}
            </nav>

            {/* Settings content */}
            <div className="flex-1 space-y-8 min-w-0">
              <ProfileSection />
              <AppearanceSection />
              <NotificationSection />
              <BillingSection />
              <DangerZone />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
```

### Agent Grid Page

```tsx
// src/app/agents/page.tsx
export default async function AgentsPage() {
  const agents = await getAgents();

  return (
    <Container size="xl">
      <div className="py-6 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-center
                        sm:justify-between gap-4 mb-6">
          <PageTitle>Agents</PageTitle>

          {/* Filter bar */}
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0
                          -mx-4 px-4 sm:mx-0 sm:px-0">
            {tiers.map((tier) => (
              <button
                key={tier}
                className="flex-shrink-0 px-4 py-2 rounded-full text-sm
                           font-medium border transition-colors
                           hover:bg-gray-50 dark:hover:bg-gray-800
                           min-h-[44px] sm:min-h-0"
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* Responsive agent grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
                        xl:grid-cols-4 gap-4 sm:gap-6">
          {agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>
    </Container>
  );
}
```

### Responsive Table / Card Hybrid

```tsx
// Tables on desktop, cards on mobile
export function UserTable({ users }: { users: User[] }) {
  return (
    <>
      {/* Desktop: Table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Tier</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Joined</th>
              <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar src={user.avatar} size="sm" />
                    <div>
                      <p className="font-medium text-sm">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <TierBadge tier={user.tier} />
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <UserActions userId={user.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {users.map((user) => (
          <div
            key={user.id}
            className="p-4 rounded-xl border bg-white dark:bg-gray-900"
          >
            <div className="flex items-center gap-3 mb-3">
              <Avatar src={user.avatar} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user.name}</p>
                <p className="text-sm text-gray-500 truncate">{user.email}</p>
              </div>
              <TierBadge tier={user.tier} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Joined {formatDate(user.createdAt)}
              </span>
              <UserActions userId={user.id} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
```

---

## Summary

1. **Mobile-first always**: Base styles for mobile, add complexity with breakpoints.
2. **md (768px) is the main breakpoint**: Mobile vs desktop layout switch happens here.
3. **Use dvh, not vh**: On mobile, `100vh` includes the URL bar. `dvh` adjusts dynamically.
4. **48px minimum touch targets**: Buttons, links, list items must be tappable on mobile.
5. **Container queries for components**: When a component lives in different-sized containers, use `@container` instead of viewport breakpoints.
6. **Sidebar + main is the Stone AI pattern**: Hidden sidebar on mobile with drawer, visible sidebar on md+.
7. **Bottom nav on mobile**: 4-5 tabs max, replace sidebar navigation.
8. **Table-to-card pattern**: Tables on desktop, stacked cards on mobile.
9. **Fluid typography with clamp()**: Avoids jumpy text at breakpoints.
10. **Test at 320px**: iPhone SE is still the smallest common viewport.
