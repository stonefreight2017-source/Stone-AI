# FE-2: shadcn/ui + Tailwind Component Architecture Standards

## Purpose
Definitive reference for component patterns, Tailwind conventions, and theming in the Stone AI codebase. Every example is from actual files in `C:\Users\stone\stone-ai`.

---

## shadcn/ui Components In Use vs Available

### Currently Installed (14 components in `src/components/ui/`)
| Component | File | Used In |
|---|---|---|
| `animate` | `animate.tsx` | Landing page animations (framer-motion wrappers) |
| `avatar` | `avatar.tsx` | User avatars |
| `badge` | `badge.tsx` | Tier badges, status indicators |
| `button` | `button.tsx` | Everywhere — primary interaction element |
| `card` | `card.tsx` | Agent cards, pricing cards, feature sections |
| `dialog` | `dialog.tsx` | Modals (tier error, confirmations) |
| `dropdown-menu` | `dropdown-menu.tsx` | Context menus, mode selectors |
| `input` | `input.tsx` | Forms, settings |
| `scroll-area` | `scroll-area.tsx` | Conversation list, long content |
| `separator` | `separator.tsx` | Sidebar dividers, section breaks |
| `sheet` | `sheet.tsx` | Mobile sidebar, slide-out panels |
| `skeleton` | `skeleton.tsx` | Loading placeholders |
| `sonner` | `sonner.tsx` | Toast notifications (wraps sonner) |
| `textarea` | `textarea.tsx` | Chat input, long-form text |

### NOT Installed But Commonly Needed
When adding these, use `npx shadcn@latest add <name>`:
- `tabs` — Currently using custom tab implementations in landing page
- `select` — Form selects are likely custom
- `tooltip` — For icon-only buttons (many exist without tooltips)
- `popover` — For picker UIs
- `progress` — For upload/loading bars
- `switch` — For settings toggles
- `table` — For admin dashboard data
- `command` — For search/command palette
- `alert` — For inline warnings

---

## Component Architecture Patterns

### Pattern 1: shadcn/ui Base Components (CVA + Radix)
Standard shadcn pattern — `class-variance-authority` for variants, Radix primitives for behavior.

```typescript
// src/components/ui/button.tsx — THE reference pattern
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center...",  // base classes
  {
    variants: {
      variant: { default: "...", destructive: "...", outline: "...", ghost: "...", link: "..." },
      size: { default: "h-9 px-4", xs: "h-6...", sm: "h-8...", lg: "h-10...", icon: "size-9", "icon-xs": "size-6", "icon-sm": "size-8", "icon-lg": "size-10" },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);
```

**Key details:**
- Uses `data-slot` attributes for CSS targeting: `data-slot="button"`, `data-slot="card"`, etc.
- Uses `data-variant` and `data-size` for runtime introspection
- `asChild` pattern via `Slot.Root` — allows Button to render as Link: `<Button asChild><Link href="/">Go</Link></Button>`
- `cn()` utility (`clsx` + `tailwind-merge`) is THE way to merge classes — never concatenate strings

### Pattern 2: Card Compound Components
```typescript
// src/components/ui/card.tsx
// Named function exports (NOT default exports) — all cards use this:
export { Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent }

// Usage in codebase:
<Card className="bg-zinc-800/50 border-zinc-800">
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
</Card>
```

### Pattern 3: Feature Components (Domain-Specific)
Located in `src/components/<domain>/`. Always client components. Accept typed props.

```
src/components/
  chat/         ChatView, ChatInput, ModeSelector, ThinkingIndicator, MessageRenderer, MessageBubble
  layout/       AppShell, Sidebar, ConversationList
  backdrops/    BackdropManager, ParticleBackdrop, VantaBackdrop, CSSBackdrop
  bestie/       BestieCard, BestieChat, PersonalityPicker
  emotes/       EmotePicker, EmoteReaction
  avatars/      SVGAvatar, AvatarBuilder
  badges/       UserBadges
  billing/      TierBadge
  brand/        Insignia
  onboarding/   OnboardingWizard
  modals/       TierErrorModal
  ads/          TierGatedAd, AdSlot
  sales/        SalesWidget
  providers/    QueryProvider
```

### Pattern 4: Animation Components (Framer Motion Wrappers)
Located in `src/components/ui/animate.tsx` — reusable motion wrappers.

```typescript
// Available animation primitives:
AnimateOnScroll   // Triggers when element enters viewport (useInView + 2s safety timeout)
StaggerChildren   // Parent that staggers child animations
StaggerItem       // Child used inside StaggerChildren
FadeIn            // Simple opacity fade
SlideUp           // Fade + translate from below
PulseGlow         // Infinite pulse (decorative)
CountUp           // Number animation on scroll
```

**Safety pattern**: All `useInView`-based components include a 2-second `forceVisible` timeout to prevent content staying invisible if intersection observer fails.

### Pattern 5: Dynamic Imports for Heavy Components
```typescript
// src/components/backdrops/BackdropManager.tsx
const ParticleBackdrop = dynamic(() => import("./ParticleBackdrop"), { ssr: false });
const VantaBackdrop = dynamic(() => import("./VantaBackdrop"), { ssr: false });
```
Used for: three.js (Vanta), tsparticles — anything that needs `window` or is bundle-heavy.

---

## Tailwind CSS Conventions

### Version & Configuration
- **Tailwind CSS v4** — uses `@import "tailwindcss"` syntax in `globals.css` (NOT `@tailwind` directives)
- **No `tailwind.config.ts`** — Tailwind v4 uses CSS-based config via `@theme inline { ... }` in `globals.css`
- **shadcn integration**: `@import "shadcn/tailwind.css"` + `@import "tw-animate-css"`
- **Dark mode**: `@custom-variant dark (&:is(.dark *))` — class-based, hardcoded to dark in `<html className="dark">`

### Color System
The app is **dark-mode only**. Colors are defined as oklch CSS variables:

```css
/* globals.css — .dark block is the active theme */
.dark {
  --background: oklch(0.145 0 0);      /* Near black */
  --foreground: oklch(0.985 0 0);      /* Near white */
  --card: oklch(0.205 0 0);            /* Slightly lighter */
  --primary: oklch(0.922 0 0);         /* Light gray */
  --destructive: oklch(0.704 0.191 22.216);  /* Red */
  --border: oklch(1 0 0 / 10%);        /* White at 10% */
  --input: oklch(1 0 0 / 15%);         /* White at 15% */
}
```

### Dominant Color Classes (from actual usage)
| Purpose | Classes Used |
|---|---|
| Page background | `bg-zinc-950` or `bg-zinc-900` |
| Card/panel background | `bg-zinc-800/50`, `bg-zinc-800`, `bg-zinc-900` |
| Borders | `border-zinc-800`, `border-zinc-700`, `border-zinc-800/50` |
| Primary text | `text-white`, `text-zinc-100`, `text-zinc-200` |
| Secondary text | `text-zinc-300`, `text-zinc-400` |
| Muted text | `text-zinc-500`, `text-zinc-600` |
| Accent (brand) | `text-amber-400`, `bg-amber-600`, `bg-amber-900/20` |
| Success | `text-emerald-400`, `bg-emerald-900/20` |
| Error | `text-red-400`, `bg-red-900/30` |
| Interactive hover | `hover:bg-zinc-800`, `hover:bg-zinc-700`, `hover:text-white` |

### Spacing & Layout Patterns
| Pattern | Classes |
|---|---|
| Full-height flex column | `flex flex-col h-full` or `flex flex-col h-screen` |
| Centered content | `flex items-center justify-center` |
| Content max-width | `max-w-3xl mx-auto` (chat), `max-w-2xl w-full` (dashboard) |
| Sidebar width | `w-[280px]` (hardcoded, not responsive class) |
| Icon buttons | `h-8 w-8` container, `h-4 w-4` icon |
| Small icon buttons | `h-6 w-6` container, `h-3 w-3` icon |
| Section padding | `px-4 py-2`, `px-6 py-3` |
| Card gap/rounding | `rounded-xl`, `gap-3`, `gap-6` |

### Responsive Breakpoints
Minimal responsive design detected. Key patterns:
- `hidden sm:inline` — Hide conversation title on mobile (ChatView)
- `grid-cols-2` — Suggestion grid (no responsive override)
- Sidebar uses a toggle (Zustand state) rather than responsive breakpoints

**Note**: The app is primarily desktop-focused with mobile handled through the sidebar toggle pattern rather than breakpoint-based layouts.

### Custom Animations (globals.css)
Three animation systems coexist:

1. **Landing page**: `animate-float`, `animate-gradient`, `animate-fade-in-up` (CSS keyframes)
2. **Backdrop system**: `animate-backdrop-aurora`, `-sunset`, `-ocean`, `-cosmic`, `-emerald`, `-fire`, `-nebula`, `-glass-aurora`, `-prismatic` (CSS keyframes, 10-40s durations)
3. **Emote system**: 21 animation classes (`emote-bounce`, `emote-pop`, `emote-pulse`, etc.) with `prefers-reduced-motion: reduce` support
4. **Badge shimmer**: `badge-golden-egg-shimmer` with `::after` pseudo-element

All emote animations respect `prefers-reduced-motion` via a single media query block.

---

## Component Naming Conventions

| Convention | Example | Where |
|---|---|---|
| PascalCase files | `ChatView.tsx`, `AppShell.tsx` | `src/components/` |
| kebab-case files | `billing-client.tsx`, `agent-marketplace.tsx` | `src/app/` companion files |
| Named exports | `export function Button(...)` | All ui/ components |
| Default exports | `export default function SomePage()` | All page.tsx files |
| Interface suffix Props | `ChatViewProps`, `AppShellProps` | Inline in component files |
| `-client.tsx` suffix | `billing-client.tsx`, `settings-client.tsx` | Client companion to server page |
| `-wrapper.tsx` suffix | `app-shell-wrapper.tsx`, `chat-view-wrapper.tsx` | Thin client bridge |

---

## Theming Approach

### Dark Mode: Hardcoded, Not Toggled
```html
<!-- src/app/layout.tsx -->
<html lang="en" className="dark scroll-smooth" suppressHydrationWarning>
```
- The `dark` class is always present — no theme switcher exists
- `next-themes` is installed (`^0.4.6`) but **not actively used** in any layout/provider
- All color choices assume dark background — no light-mode variants needed

### Clerk Theme Integration
```typescript
<ClerkProvider appearance={{ baseTheme: dark }}>
```
Clerk components (UserButton, SignIn, SignUp) use the `dark` base theme from `@clerk/themes`.

### Brand Colors
- **Amber** is the primary brand accent: `text-amber-400`, `bg-gradient-to-br from-amber-600 to-amber-800`
- Used for: Stone AI avatar, "Deals & Trials" nav item, pricing highlights, CTA gradients
- **Blue** is secondary accent: `bg-blue-500` (notification badges), chart colors

---

## State Management Architecture

### Zustand Store (`src/store/app-store.ts`)
Small, flat store — no nested objects, no async actions:
- `sidebarOpen` / `toggleSidebar` — UI state
- `activeChatId` / `setActiveChatId` — Navigation state
- `selectedMode` — "LOCAL" | "SMART"
- `tierError` / `setTierError` — Modal trigger state

### React Query Hooks (`src/hooks/`)
- `use-user.ts` — User profile + tier info (60s stale time)
- `use-conversation.ts` — Single conversation data
- `use-conversations.ts` — Conversation list + create mutation

### Pattern: Zustand for UI state, React Query for server state
Never mix these. Zustand holds ephemeral client state. React Query holds cached server data.

---

## DO Rules

1. **DO use `cn()` for all class merging** — `cn("base-classes", conditional && "extra", className)`. Never use template literals for Tailwind classes.
2. **DO use named exports for components** in `src/components/`. Default exports are ONLY for `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`.
3. **DO use `data-slot` attributes** on shadcn components for CSS targeting consistency.
4. **DO lazy-load heavy components** with `dynamic(() => import(...), { ssr: false })` for anything using three.js, canvas, or browser-only APIs.
5. **DO use zinc color scale** for all neutral UI elements. The codebase is zinc-based, not gray or slate.
6. **DO follow the `-client.tsx` naming convention** for client companion files next to server pages.
7. **DO keep the Zustand store flat** — no nested objects, no async thunks. Simple set/get only.
8. **DO include `prefers-reduced-motion` support** when adding CSS animations.
9. **DO use `lucide-react` for all icons** — it's the only icon library in the project. Standard size: `h-4 w-4` in buttons, `h-5 w-5` standalone.
10. **DO use `toast` from `sonner`** for user notifications — it's wired into the root layout via `<Toaster />`.

## DON'T Rules

1. **DON'T add light-mode styles** — the app is dark-only. The `dark` class is hardcoded on `<html>`. Adding light variants is wasted code.
2. **DON'T create new Tailwind config files** — Tailwind v4 uses `@theme inline` in `globals.css`. No `tailwind.config.ts` exists or should exist.
3. **DON'T use `@tailwind base/components/utilities`** — Tailwind v4 uses `@import "tailwindcss"` syntax.
4. **DON'T install new icon libraries** — use `lucide-react` exclusively. If an icon doesn't exist, find the closest match.
5. **DON'T use inline styles** except in `global-error.tsx` (which can't rely on CSS loading). All other components use Tailwind classes.
6. **DON'T create context providers** for new features — use Zustand for client UI state, React Query for server state. No React Context.
7. **DON'T mix `bg-gray-*` or `bg-slate-*`** — the entire app uses `zinc` scale. Mixing scales creates visible inconsistency.
8. **DON'T add responsive breakpoints without checking mobile sidebar behavior** — the app uses a toggle pattern, not responsive hiding. New responsive code must work with the `sidebarOpen` state.
9. **DON'T use `default export` for components in `src/components/`** — only pages get default exports. Components use named exports for better refactoring support and tree-shaking.
10. **DON'T import from `@radix-ui/*` directly** — the project uses the unified `radix-ui` package (`^1.4.3`). Import pattern: `import { Slot } from "radix-ui"`.

---

## Quick Reference

### Adding a New shadcn Component
```bash
npx shadcn@latest add <component-name>
# Installs to src/components/ui/<name>.tsx
# Uses the project's existing Tailwind v4 + oklch theme automatically
```

### Creating a New Page (Checklist)
1. Create `src/app/app/<feature>/page.tsx` (Server Component — fetch data)
2. Create `src/app/app/<feature>/<feature>-client.tsx` (Client Component — render UI)
3. Server page calls `getOrCreateUser()`, serializes data, passes to client
4. Client component adds `"use client"` at top
5. Use existing shadcn components from `src/components/ui/`
6. Add sidebar nav link in `src/components/layout/Sidebar.tsx`

### Creating a New Reusable Component (Checklist)
1. Create `src/components/<domain>/<ComponentName>.tsx`
2. Add `"use client"` if it uses hooks, event handlers, or browser APIs
3. Use named export: `export function ComponentName({ ... }: ComponentNameProps) {}`
4. Accept `className` prop and merge with `cn()` for flexibility
5. Use `lucide-react` for icons, zinc scale for colors, amber for brand accents

### File Size Reference (from codebase)
- UI primitives: 20-90 lines (button, card, input)
- Feature components: 50-330 lines (ChatView at 327 is the largest)
- Page companions: 30-200 lines
- Landing page: ~1600 lines (outlier — could be split)
