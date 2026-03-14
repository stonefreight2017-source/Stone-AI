# Tailwind CSS v4 Design System

## Deep Knowledge Seed — Palace LLM Reference

Complete reference for building design systems with Tailwind CSS v4's new CSS-first configuration. Covers the paradigm shift from JS config to CSS-native, design tokens, responsive patterns, dark mode, animations, and performance.

---

## 1. Tailwind v4: The Paradigm Shift

Tailwind v4 moves configuration from `tailwind.config.js` to CSS using the `@theme` directive. This is the single biggest change.

### Before (v3): JavaScript Config

```js
// tailwind.config.js (v3 - OLD)
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: { 500: '#6366f1' },
      },
    },
  },
};
```

### After (v4): CSS-First Config

```css
/* src/app/globals.css (v4 - NEW) */
@import "tailwindcss";

@theme {
  --color-brand-500: #6366f1;
}
```

### Key Changes in v4

1. **No `tailwind.config.js` needed** — configure in CSS with `@theme`
2. **Automatic content detection** — no `content` array needed (scans your project)
3. **CSS-native cascade layers** — `@layer base`, `@layer components`, `@layer utilities`
4. **Native CSS variables** — theme values are real CSS custom properties
5. **No PostCSS config required** — Tailwind v4 uses its own engine (Oxide)
6. **Import syntax**: `@import "tailwindcss"` replaces the three `@tailwind` directives

### Installation for Next.js 16

```bash
npm install tailwindcss @tailwindcss/postcss
```

```js
// postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

```css
/* src/app/globals.css */
@import "tailwindcss";
```

That's it. No `tailwind.config.js`, no content array, no additional plugins.

---

## 2. The @theme Directive

`@theme` is where you define your design tokens. Everything inside becomes a CSS custom property AND a Tailwind utility.

### Complete Theme Definition

```css
@import "tailwindcss";

@theme {
  /* ========== COLORS ========== */
  /* These generate: bg-brand-50, text-brand-500, border-brand-900, etc. */
  --color-brand-50: #eef2ff;
  --color-brand-100: #e0e7ff;
  --color-brand-200: #c7d2fe;
  --color-brand-300: #a5b4fc;
  --color-brand-400: #818cf8;
  --color-brand-500: #6366f1;
  --color-brand-600: #4f46e5;
  --color-brand-700: #4338ca;
  --color-brand-800: #3730a3;
  --color-brand-900: #312e81;
  --color-brand-950: #1e1b4b;

  /* Semantic colors */
  --color-success: #22c55e;
  --color-warning: #eab308;
  --color-error: #ef4444;
  --color-info: #3b82f6;

  /* ========== SPACING ========== */
  /* Custom spacing tokens (extend defaults) */
  --spacing-18: 4.5rem;
  --spacing-88: 22rem;
  --spacing-128: 32rem;

  /* ========== TYPOGRAPHY ========== */
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --font-display: "Cal Sans", "Inter", sans-serif;

  /* Font sizes: generates text-display-1, text-display-2, etc. */
  --text-display-1: 3.5rem;
  --text-display-1--line-height: 1.1;
  --text-display-1--letter-spacing: -0.02em;
  --text-display-1--font-weight: 800;

  --text-display-2: 2.5rem;
  --text-display-2--line-height: 1.2;
  --text-display-2--letter-spacing: -0.01em;
  --text-display-2--font-weight: 700;

  --text-body-lg: 1.125rem;
  --text-body-lg--line-height: 1.75;

  /* ========== SHADOWS ========== */
  --shadow-soft: 0 2px 8px -2px rgb(0 0 0 / 0.08), 0 2px 4px -2px rgb(0 0 0 / 0.04);
  --shadow-card: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-elevated: 0 10px 30px -5px rgb(0 0 0 / 0.15), 0 4px 6px -2px rgb(0 0 0 / 0.05);

  /* ========== BORDER RADIUS ========== */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-pill: 9999px;

  /* ========== ANIMATIONS ========== */
  --animate-fade-in: fade-in 0.3s ease-out;
  --animate-slide-up: slide-up 0.3s ease-out;
  --animate-slide-down: slide-down 0.2s ease-out;
  --animate-scale-in: scale-in 0.2s ease-out;
  --animate-spin-slow: spin 3s linear infinite;
  --animate-pulse-soft: pulse-soft 2s ease-in-out infinite;

  /* ========== BREAKPOINTS ========== */
  /* Override default breakpoints */
  --breakpoint-xs: 475px;
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;

  /* ========== Z-INDEX ========== */
  --z-dropdown: 50;
  --z-sticky: 100;
  --z-overlay: 200;
  --z-modal: 300;
  --z-toast: 400;
}

/* Keyframes for custom animations */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-down {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes pulse-soft {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
```

### How @theme Maps to Utilities

The naming convention determines the utility class generated:

| CSS Variable | Generated Utility |
|---|---|
| `--color-brand-500: #6366f1` | `bg-brand-500`, `text-brand-500`, `border-brand-500` |
| `--font-display: "Cal Sans"` | `font-display` |
| `--spacing-18: 4.5rem` | `p-18`, `m-18`, `gap-18`, `w-18`, `h-18` |
| `--shadow-soft: ...` | `shadow-soft` |
| `--radius-pill: 9999px` | `rounded-pill` |
| `--animate-fade-in: ...` | `animate-fade-in` |
| `--breakpoint-xs: 475px` | `xs:` prefix |
| `--text-display-1: 3.5rem` | `text-display-1` (includes line-height, weight, spacing) |

---

## 3. CSS Variables for Component Themes (shadcn pattern)

shadcn/ui uses a separate CSS variable pattern (NOT `@theme`) for component-level theming. These are raw CSS variables consumed by Tailwind's arbitrary value syntax or the `hsl()` function.

```css
/* These are NOT inside @theme — they're regular CSS variables */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.5rem;
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
    --sidebar-background: 0 0% 98%;
    --sidebar-foreground: 240 5.3% 26.1%;
    --sidebar-primary: 240 5.9% 10%;
    --sidebar-primary-foreground: 0 0% 98%;
    --sidebar-accent: 240 4.8% 95.9%;
    --sidebar-accent-foreground: 240 5.9% 10%;
    --sidebar-border: 220 13% 91%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }

  .dark {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --ring: 240 4.9% 83.9%;
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
    --sidebar-background: 240 5.9% 10%;
    --sidebar-foreground: 240 4.8% 95.9%;
    --sidebar-primary: 224.3 76.3% 48%;
    --sidebar-primary-foreground: 0 0% 100%;
    --sidebar-accent: 240 3.7% 15.9%;
    --sidebar-accent-foreground: 240 4.8% 95.9%;
    --sidebar-border: 240 3.7% 15.9%;
    --sidebar-ring: 217.2 91.2% 59.8%;
  }
}
```

### Connecting CSS Variables to @theme

In Tailwind v4, you bridge shadcn's CSS variables to Tailwind utilities via `@theme`:

```css
@theme inline {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));
  --color-chart-1: hsl(var(--chart-1));
  --color-chart-2: hsl(var(--chart-2));
  --color-chart-3: hsl(var(--chart-3));
  --color-chart-4: hsl(var(--chart-4));
  --color-chart-5: hsl(var(--chart-5));
  --color-sidebar-background: hsl(var(--sidebar-background));
  --color-sidebar-foreground: hsl(var(--sidebar-foreground));
  --color-sidebar-primary: hsl(var(--sidebar-primary));
  --color-sidebar-primary-foreground: hsl(var(--sidebar-primary-foreground));
  --color-sidebar-accent: hsl(var(--sidebar-accent));
  --color-sidebar-accent-foreground: hsl(var(--sidebar-accent-foreground));
  --color-sidebar-border: hsl(var(--sidebar-border));
  --color-sidebar-ring: hsl(var(--sidebar-ring));
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```

The `inline` keyword on `@theme inline` tells Tailwind not to generate CSS custom properties for these values (since they're already defined as raw CSS variables). This avoids duplication.

---

## 4. Responsive Design

### Breakpoint System

```css
@theme {
  --breakpoint-xs: 475px;
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;
}
```

### Mobile-First Patterns

```tsx
// Stack on mobile, row on desktop
<div className="flex flex-col md:flex-row gap-4">
  <Sidebar className="w-full md:w-64" />
  <Main className="flex-1" />
</div>

// Grid: 1 col → 2 cols → 3 cols → 4 cols
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>

// Hide/show at breakpoints
<nav className="hidden md:flex items-center gap-4">
  {/* Desktop nav */}
</nav>
<Button className="md:hidden" variant="ghost" size="icon">
  {/* Mobile menu trigger */}
  <MenuIcon />
</Button>

// Responsive text sizes
<h1 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold">
  Welcome to Stone AI
</h1>

// Responsive padding
<section className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
  {children}
</section>
```

### Container Queries (v4 native)

Container queries let components respond to their container size, not viewport:

```tsx
// Mark a container
<div className="@container">
  {/* Children can use @sm:, @md:, @lg: etc. */}
  <div className="flex flex-col @md:flex-row gap-4">
    <img className="w-full @md:w-48 rounded-lg" src={img} alt="" />
    <div className="flex-1">
      <h3 className="text-lg @lg:text-xl font-bold">{title}</h3>
      <p className="text-sm @lg:text-base text-muted-foreground">{desc}</p>
    </div>
  </div>
</div>

// Named containers
<div className="@container/sidebar">
  <nav className="@md/sidebar:flex-col @md/sidebar:items-start">
    {links}
  </nav>
</div>
```

Container query breakpoints:

| Prefix | Min width |
|---|---|
| `@xs:` | 320px (20rem) |
| `@sm:` | 384px (24rem) |
| `@md:` | 448px (28rem) |
| `@lg:` | 512px (32rem) |
| `@xl:` | 576px (36rem) |
| `@2xl:` | 672px (42rem) |

---

## 5. Dark Mode

### Class Strategy (recommended for shadcn)

```tsx
// src/app/layout.tsx
import { ThemeProvider } from "next-themes";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Dark Mode Utilities

```tsx
// Automatic via CSS variables (preferred)
<div className="bg-background text-foreground" />
// Renders white bg in light, dark bg in dark mode

// Explicit dark: prefix
<div className="bg-white dark:bg-gray-900" />
<div className="text-gray-900 dark:text-gray-100" />
<div className="border-gray-200 dark:border-gray-800" />

// Dark mode with opacity
<div className="bg-black/5 dark:bg-white/10" />

// Dark mode shadows
<div className="shadow-lg dark:shadow-none dark:ring-1 dark:ring-white/10" />

// Images that adapt
<img className="dark:brightness-90 dark:contrast-110" src={photo} alt="" />

// Invert for dark mode (icons, simple graphics)
<img className="dark:invert" src="/logo-dark.svg" alt="" />
```

### Theme Toggle Component

```tsx
"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoonIcon, SunIcon, MonitorIcon } from "lucide-react";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <SunIcon className="size-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <MoonIcon className="absolute size-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <SunIcon className="mr-2 size-4" /> Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <MoonIcon className="mr-2 size-4" /> Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <MonitorIcon className="mr-2 size-4" /> System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## 6. Animation Utilities

### Built-in Animations

```tsx
// Tailwind built-ins
<div className="animate-spin" />        // Continuous rotation
<div className="animate-ping" />        // Radar ping effect
<div className="animate-pulse" />       // Fade in/out
<div className="animate-bounce" />      // Bounce up/down
```

### Custom Animations via @theme

```css
@theme {
  --animate-fade-in: fade-in 0.3s ease-out forwards;
  --animate-fade-out: fade-out 0.2s ease-in forwards;
  --animate-slide-in-right: slide-in-right 0.3s ease-out;
  --animate-slide-in-left: slide-in-left 0.3s ease-out;
  --animate-slide-in-up: slide-in-up 0.3s ease-out;
  --animate-slide-in-down: slide-in-down 0.3s ease-out;
  --animate-scale-up: scale-up 0.2s ease-out;
  --animate-accordion-down: accordion-down 0.2s ease-out;
  --animate-accordion-up: accordion-up 0.2s ease-out;
  --animate-shimmer: shimmer 2s linear infinite;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(100%); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slide-in-left {
  from { opacity: 0; transform: translateX(-100%); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slide-in-up {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-in-down {
  from { opacity: 0; transform: translateY(-16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes scale-up {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes accordion-down {
  from { height: 0; }
  to { height: var(--radix-accordion-content-height); }
}

@keyframes accordion-up {
  from { height: var(--radix-accordion-content-height); }
  to { height: 0; }
}

@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
```

### Usage

```tsx
// Custom animations
<div className="animate-fade-in" />
<div className="animate-slide-in-up" />

// Conditional animation
<div className={cn(
  "transition-all duration-300",
  isVisible ? "animate-fade-in" : "opacity-0"
)} />

// Staggered animations with delay
<div className="animate-slide-in-up" style={{ animationDelay: "0ms" }} />
<div className="animate-slide-in-up" style={{ animationDelay: "100ms" }} />
<div className="animate-slide-in-up" style={{ animationDelay: "200ms" }} />

// Shimmer loading effect
<div className="animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent bg-[length:200%_100%]" />
```

### Transition Utilities

```tsx
// Hover transitions
<button className="transition-colors duration-200 hover:bg-accent" />
<div className="transition-transform duration-300 hover:scale-105" />
<a className="transition-opacity duration-150 hover:opacity-80" />

// Multiple transitions
<div className="transition-all duration-300 ease-in-out hover:shadow-lg hover:-translate-y-1" />

// Specific easing
<div className="transition-transform duration-500 ease-out" />
<div className="transition-opacity duration-200 ease-in" />

// Transform utilities
<div className="hover:scale-105 hover:rotate-1 active:scale-95" />
<div className="translate-x-0 group-hover:translate-x-2" />
```

---

## 7. Arbitrary Values, Properties, and Variants

### Arbitrary Values

When you need a one-off value not in your theme:

```tsx
// Arbitrary values with square brackets
<div className="w-[327px]" />
<div className="h-[calc(100vh-4rem)]" />
<div className="grid-cols-[1fr_2fr_1fr]" />
<div className="bg-[#1a1a2e]" />
<div className="text-[clamp(1rem,2.5vw,2rem)]" />
<div className="p-[var(--custom-padding)]" />

// With responsive/state
<div className="md:w-[600px] hover:bg-[#333]" />
```

### Arbitrary Properties

For CSS properties that don't have Tailwind utilities:

```tsx
// [property:value] syntax
<div className="[mask-image:linear-gradient(to_bottom,black,transparent)]" />
<div className="[text-wrap:balance]" />
<div className="[writing-mode:vertical-rl]" />
<div className="[clip-path:polygon(0_0,100%_0,100%_75%,0_100%)]" />
<div className="[backdrop-filter:blur(20px)_saturate(180%)]" />
```

### Arbitrary Variants

Custom selectors for states Tailwind doesn't cover:

```tsx
// Data attributes
<div className="[&[data-state=open]]:animate-fade-in" />
<div className="[&[data-state=closed]]:animate-fade-out" />

// Child selectors
<div className="[&>svg]:size-4 [&>svg]:text-muted-foreground" />
<div className="[&_p]:text-sm [&_p]:text-muted-foreground" />

// Pseudo-elements
<div className="[&::selection]:bg-brand-500/30" />

// Complex selectors
<div className="[&:not(:first-child)]:border-t" />
<div className="[&:has(input:focus)]:ring-2" />

// Combining with modifiers
<div className="hover:[&>span]:text-primary" />
<div className="group-hover/sidebar:[&_svg]:text-brand-500" />
```

---

## 8. Group and Peer Modifiers

### Group — Parent state affects children

```tsx
// Hover on parent → affects children
<div className="group cursor-pointer rounded-lg border p-4 hover:border-primary">
  <h3 className="font-bold group-hover:text-primary">Title</h3>
  <p className="text-muted-foreground group-hover:text-foreground">Description</p>
  <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
</div>

// Named groups (for nested)
<div className="group/card">
  <div className="group/header">
    <h3 className="group-hover/card:text-primary group-hover/header:underline">
      Title
    </h3>
  </div>
</div>
```

### Peer — Sibling state affects elements

```tsx
// Input validation state → affects message
<input className="peer" type="email" placeholder="Email" required />
<p className="invisible peer-invalid:visible text-sm text-destructive mt-1">
  Please enter a valid email.
</p>

// Checkbox checked → affects label
<input type="checkbox" className="peer sr-only" id="toggle" />
<label htmlFor="toggle" className="peer-checked:bg-primary peer-checked:text-white px-3 py-1 rounded-md cursor-pointer">
  Active
</label>
```

---

## 9. Layout Patterns

### Flexbox

```tsx
// Center everything
<div className="flex items-center justify-center min-h-screen" />

// Space between with wrap
<div className="flex flex-wrap items-center justify-between gap-4" />

// Sidebar + main content
<div className="flex min-h-screen">
  <aside className="w-64 shrink-0 border-r" />
  <main className="flex-1 overflow-auto" />
</div>

// Stack with auto-margin push
<div className="flex flex-col min-h-screen">
  <header className="h-16 border-b" />
  <main className="flex-1" />
  <footer className="mt-auto border-t py-4" />
</div>
```

### Grid

```tsx
// Dashboard layout
<div className="grid grid-cols-12 gap-4">
  <div className="col-span-12 lg:col-span-8">
    <MainChart />
  </div>
  <div className="col-span-12 lg:col-span-4">
    <SideStats />
  </div>
  <div className="col-span-12 sm:col-span-6 lg:col-span-3">
    <StatCard title="Users" value="2,847" />
  </div>
  <div className="col-span-12 sm:col-span-6 lg:col-span-3">
    <StatCard title="Revenue" value="$12,450" />
  </div>
  <div className="col-span-12 sm:col-span-6 lg:col-span-3">
    <StatCard title="Agents" value="44" />
  </div>
  <div className="col-span-12 sm:col-span-6 lg:col-span-3">
    <StatCard title="Uptime" value="99.9%" />
  </div>
</div>

// Auto-fill grid
<div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
  {cards.map(card => <Card key={card.id} {...card} />)}
</div>

// Subgrid (v4)
<div className="grid grid-cols-3 gap-4">
  <div className="grid grid-cols-subgrid col-span-3">
    {/* Children align to parent grid */}
  </div>
</div>
```

---

## 10. Plugin Authoring (v4)

In v4, plugins are written in CSS using `@plugin`:

```css
/* src/styles/plugins/glass.css */
@utility glass-sm {
  backdrop-filter: blur(4px) saturate(150%);
  background-color: rgb(255 255 255 / 0.7);

  @media (prefers-color-scheme: dark) {
    background-color: rgb(0 0 0 / 0.5);
  }
}

@utility glass-md {
  backdrop-filter: blur(12px) saturate(180%);
  background-color: rgb(255 255 255 / 0.75);

  @media (prefers-color-scheme: dark) {
    background-color: rgb(0 0 0 / 0.6);
  }
}

@utility glass-lg {
  backdrop-filter: blur(20px) saturate(200%);
  background-color: rgb(255 255 255 / 0.8);

  @media (prefers-color-scheme: dark) {
    background-color: rgb(0 0 0 / 0.7);
  }
}
```

```css
/* Import in globals.css */
@import "tailwindcss";
@import "./plugins/glass.css";
```

```tsx
// Usage
<div className="glass-md rounded-xl border border-white/20 p-6 shadow-lg">
  <h2 className="text-lg font-semibold">Glassmorphism Card</h2>
</div>
```

### Custom Variant Plugin

```css
@variant hocus (&:hover, &:focus-visible);
@variant not-first (&:not(:first-child));
@variant not-last (&:not(:last-child));
```

```tsx
<button className="hocus:bg-primary hocus:text-white">Hover or Focus</button>
<li className="not-first:border-t not-last:border-b">Item</li>
```

---

## 11. Performance Best Practices

### What Tailwind v4 Does Automatically

1. **Automatic content detection** — no manual `content` array
2. **JIT by default** — only generates classes you actually use
3. **Tree-shaking** — unused utilities never make it to the bundle

### Manual Optimizations

```tsx
// DO: Use Tailwind classes directly
<div className="p-4 text-sm text-gray-600" />

// DON'T: Construct classes dynamically (can't be tree-shaken)
const color = "red";
<div className={`text-${color}-500`} />  // BAD — won't work

// DO: Use complete class names with conditional logic
<div className={cn(
  "text-sm",
  isError ? "text-red-500" : "text-gray-600"
)} />

// DO: Safelist dynamic classes if absolutely needed
// In v4, use @source directive:
```

```css
/* Safelist specific patterns */
@source inline("bg-red-500 bg-green-500 bg-blue-500 bg-yellow-500");
```

### Avoiding Bloat

```tsx
// Instead of 20 one-off arbitrary values, add to @theme
// BAD (if used repeatedly):
<div className="w-[327px]" /> // one-off is fine
<div className="w-[327px]" /> // second usage = add to theme

// GOOD:
// @theme { --spacing-card: 327px; }
<div className="w-card" />

// Instead of inline styles, use arbitrary properties:
// BAD:
<div style={{ clipPath: "polygon(0 0, 100% 0, 100% 75%, 0 100%)" }} />
// GOOD:
<div className="[clip-path:polygon(0_0,100%_0,100%_75%,0_100%)]" />
```

---

## 12. Common Utility Patterns Cheat Sheet

### Typography

```tsx
<h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl" />
<h2 className="scroll-m-20 text-3xl font-semibold tracking-tight" />
<h3 className="scroll-m-20 text-2xl font-semibold tracking-tight" />
<h4 className="scroll-m-20 text-xl font-semibold tracking-tight" />
<p className="leading-7 [&:not(:first-child)]:mt-6" />
<p className="text-sm text-muted-foreground" />
<code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm" />
<span className="text-xl font-bold tabular-nums tracking-tight" />

// Truncation
<p className="truncate" />            // Single line
<p className="line-clamp-2" />        // Multi-line (2 lines)
<p className="line-clamp-3" />        // Multi-line (3 lines)
```

### Spacing & Sizing

```tsx
// Full-page layout
<div className="min-h-screen w-full" />
<div className="h-dvh w-dvw" />  // Dynamic viewport (accounts for mobile browser bars)

// Max width containers
<div className="mx-auto w-full max-w-screen-xl px-4 sm:px-6 lg:px-8" />
<div className="mx-auto max-w-prose" />  // ~65ch for reading

// Aspect ratios
<div className="aspect-video" />    // 16:9
<div className="aspect-square" />   // 1:1
<div className="aspect-[4/3]" />    // Custom
```

### Borders & Rings

```tsx
// Standard border
<div className="rounded-lg border border-border" />

// Focus ring (accessibility)
<button className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" />

// Divide (borders between children)
<div className="divide-y divide-border">
  <div className="py-2">Item 1</div>
  <div className="py-2">Item 2</div>
  <div className="py-2">Item 3</div>
</div>
```

### Gradients

```tsx
// Linear gradient
<div className="bg-gradient-to-r from-brand-500 to-brand-700" />
<div className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500" />

// Text gradient
<h1 className="bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent">
  Stone AI
</h1>

// Gradient with opacity stops
<div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
```

---

## 13. Stone AI Design Token Conventions

These are the conventions used throughout the Stone AI codebase:

### Color Semantics

| Token | Usage |
|---|---|
| `bg-background` / `text-foreground` | Page-level background and text |
| `bg-card` / `text-card-foreground` | Card surfaces |
| `bg-primary` / `text-primary-foreground` | Primary actions (buttons, links) |
| `bg-secondary` / `text-secondary-foreground` | Secondary actions |
| `bg-muted` / `text-muted-foreground` | Subdued backgrounds, helper text |
| `bg-accent` / `text-accent-foreground` | Hover states, highlights |
| `bg-destructive` | Dangerous actions (delete, remove) |
| `border-border` | Standard borders |
| `border-input` | Form input borders |
| `ring-ring` | Focus rings |

### Spacing Scale

Follow Tailwind's default 4px scale. Key stops for Stone AI:

| Class | Value | Usage |
|---|---|---|
| `gap-1` / `p-1` | 4px | Tight icon gaps |
| `gap-2` / `p-2` | 8px | Compact spacing |
| `gap-3` / `p-3` | 12px | Standard inline spacing |
| `gap-4` / `p-4` | 16px | Standard content spacing |
| `gap-6` / `p-6` | 24px | Section spacing |
| `gap-8` / `p-8` | 32px | Large section spacing |
| `py-12` / `py-16` | 48-64px | Page section padding |

### Border Radius

| Class | Usage |
|---|---|
| `rounded-sm` | Small elements (badges, tags) |
| `rounded-md` | Inputs, small cards |
| `rounded-lg` | Cards, dialogs |
| `rounded-xl` | Large cards, hero sections |
| `rounded-full` | Avatars, circular buttons |

---

## 14. Tailwind v4 Specifics to Remember

1. **`@import "tailwindcss"`** replaces the three `@tailwind` directives
2. **`@theme`** replaces `tailwind.config.js` `theme.extend`
3. **`@theme inline`** prevents double CSS variable output (use for shadcn bridge)
4. **`@utility`** replaces JS-based plugin utilities
5. **`@variant`** replaces JS-based plugin variants
6. **`@source`** replaces the `content` array and `safelist`
7. **`@plugin`** imports JS plugins (for complex plugins that need JS)
8. **Container queries** are built-in (`@container` + `@sm:`, `@md:`, etc.)
9. **`not-*` variants** are built-in (`not-hover:`, `not-first:`, etc.)
10. **`inert:` variant** for `inert` attribute styling
11. **3D transforms** built-in (`rotate-x-*`, `rotate-y-*`, `perspective-*`)
12. **Color mixing** via `bg-red-500/50` (opacity) or `color-mix()` in arbitrary values

This document covers every Tailwind v4 pattern needed for Stone AI production development. Reference the @theme section for design tokens and the responsive section for layout decisions.
