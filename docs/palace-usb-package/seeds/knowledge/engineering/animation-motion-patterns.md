# Animation & Motion Patterns — Frontend Engineering Seed

> Deep knowledge seed for the Stone AI Palace USB Package.
> Covers CSS transitions, Tailwind animation utilities, Framer Motion with Next.js 16, micro-interactions, loading states, accessibility, and GPU-accelerated performance patterns.

---

## Table of Contents

1. [CSS Transitions with Tailwind](#css-transitions-with-tailwind)
2. [CSS Animations with Tailwind](#css-animations-with-tailwind)
3. [Custom Keyframes in Tailwind Config](#custom-keyframes-in-tailwind-config)
4. [Framer Motion Integration with Next.js 16](#framer-motion-integration-with-nextjs-16)
5. [Page Transition Animations](#page-transition-animations)
6. [List & Layout Animations](#list--layout-animations)
7. [Scroll-Triggered Animations](#scroll-triggered-animations)
8. [Micro-Interactions](#micro-interactions)
9. [Loading Animations](#loading-animations)
10. [Reduced Motion Accessibility](#reduced-motion-accessibility)
11. [Performance & GPU Acceleration](#performance--gpu-acceleration)
12. [Real-World Patterns: Stone AI](#real-world-patterns-stone-ai)

---

## CSS Transitions with Tailwind

### Fundamentals

Tailwind ships transition utilities that map directly to CSS `transition` properties. The key classes:

| Utility | CSS Property | Purpose |
|---|---|---|
| `transition-all` | `transition-property: all` | Animate all changed properties |
| `transition-colors` | `transition-property: color, background-color, border-color, ...` | Only color changes |
| `transition-opacity` | `transition-property: opacity` | Fade effects |
| `transition-transform` | `transition-property: transform` | Movement, scale, rotation |
| `transition-shadow` | `transition-property: box-shadow` | Shadow depth changes |
| `duration-150` / `duration-300` / `duration-500` | `transition-duration` | Timing in ms |
| `ease-in` / `ease-out` / `ease-in-out` / `ease-linear` | `transition-timing-function` | Easing curves |
| `delay-100` / `delay-300` | `transition-delay` | Start delay |

### Choosing the Right Transition Scope

**Rule of thumb**: Never use `transition-all` in production unless you explicitly need every property to animate. It triggers transitions on properties you didn't intend (padding, margin, etc.) and forces the browser to watch every computed style.

```tsx
// BAD — animates everything including layout properties
<button className="transition-all duration-300 hover:bg-blue-600 hover:px-6">
  Click me
</button>

// GOOD — only animates what changes
<button className="transition-colors duration-300 hover:bg-blue-600">
  Click me
</button>

// GOOD — multiple specific transitions
<button className="transition-[color,background-color,transform] duration-300 hover:bg-blue-600 hover:scale-105">
  Click me
</button>
```

### Duration Guidelines

| Duration | Use Case |
|---|---|
| `duration-75` to `duration-150` | Micro-interactions (button press, checkbox toggle) |
| `duration-200` to `duration-300` | Standard UI transitions (hover states, dropdowns) |
| `duration-500` | Larger movements (sidebar slide, panel expand) |
| `duration-700` to `duration-1000` | Page-level transitions, hero animations |

Anything above 500ms feels sluggish for interactive elements. Anything below 100ms is often imperceptible.

### Easing Curves

```tsx
// Tailwind defaults
<div className="ease-linear" />    // constant speed — use for looping animations only
<div className="ease-in" />        // slow start — use for EXIT animations
<div className="ease-out" />       // slow end — use for ENTER animations
<div className="ease-in-out" />    // slow start and end — use for state toggles

// Custom cubic-bezier in tailwind.config.ts
// Add to theme.extend.transitionTimingFunction
// 'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
// 'smooth-out': 'cubic-bezier(0.22, 1, 0.36, 1)',
```

**The natural motion rule**: Objects in the real world accelerate and decelerate. `ease-out` for entrances (the element "arrives"), `ease-in` for exits (the element "leaves"). Never use `ease-linear` for interactive transitions — it feels robotic.

### Combining Transitions

```tsx
// Hover card with multiple transition properties
function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div
      className={cn(
        "group rounded-xl border border-stone-800 bg-stone-900 p-6",
        "transition-[transform,box-shadow,border-color] duration-300 ease-out",
        "hover:scale-[1.02] hover:border-stone-600 hover:shadow-lg hover:shadow-stone-900/50"
      )}
    >
      <h3 className="text-lg font-semibold text-stone-100 transition-colors duration-300 group-hover:text-amber-400">
        {title}
      </h3>
      <p className="mt-2 text-sm text-stone-400">{description}</p>
    </div>
  );
}
```

---

## CSS Animations with Tailwind

### Built-in Animation Utilities

Tailwind includes four animation utilities out of the box:

```tsx
// Spinner — continuous rotation
<svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
</svg>

// Pulse — opacity fade in/out (skeleton screens)
<div className="animate-pulse bg-stone-700 h-4 w-48 rounded" />

// Ping — expanding ring (notification dot)
<span className="relative flex h-3 w-3">
  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
  <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500" />
</span>

// Bounce — vertical bounce
<div className="animate-bounce">
  <ChevronDownIcon className="h-6 w-6" />
</div>
```

### Controlling Animation Play State

```tsx
// Pause animation on hover
<div className="animate-spin hover:[animation-play-state:paused]" />

// Conditional animation
<div className={cn("transition-opacity", isLoading ? "animate-pulse" : "")} />
```

---

## Custom Keyframes in Tailwind Config

### Defining Custom Animations

```ts
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  theme: {
    extend: {
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-out": {
          "0%": { opacity: "1", transform: "translateY(0)" },
          "100%": { opacity: "0", transform: "translateY(8px)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "scale-in": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 5px rgba(251, 191, 36, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(251, 191, 36, 0.6)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "fade-out": "fade-out 0.3s ease-in",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "slide-in-left": "slide-in-left 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        shimmer: "shimmer 2s linear infinite",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        float: "float 3s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
      },
    },
  },
};

export default config;
```

### Using Custom Animations

```tsx
// Chat message entrance
function ChatMessage({ message, index }: { message: Message; index: number }) {
  return (
    <div
      className="animate-fade-in"
      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}
    >
      <div className="flex gap-3 p-4">
        <Avatar src={message.avatar} />
        <div className="flex-1">
          <p className="text-sm text-stone-300">{message.content}</p>
        </div>
      </div>
    </div>
  );
}

// Notification with glow
function NotificationBadge({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <span className="animate-glow-pulse rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-black">
      {count}
    </span>
  );
}
```

---

## Framer Motion Integration with Next.js 16

### Installation and Setup

```bash
npm install framer-motion
```

**Critical Next.js 16 rule**: Framer Motion uses React context internally and must be used in Client Components only. Any component using `motion` must have `"use client"` at the top.

### Basic Motion Components

```tsx
"use client";

import { motion } from "framer-motion";

// Fade in on mount
function FadeIn({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// Scale on hover
function HoverScale({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {children}
    </motion.div>
  );
}
```

### Variants Pattern — The Most Important Framer Motion Concept

Variants let you define named animation states and orchestrate children automatically.

```tsx
"use client";

import { motion, type Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

function AgentGrid({ agents }: { agents: Agent[] }) {
  return (
    <motion.div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {agents.map((agent) => (
        <motion.div key={agent.id} variants={itemVariants}>
          <AgentCard agent={agent} />
        </motion.div>
      ))}
    </motion.div>
  );
}
```

### Spring Physics

Framer Motion's spring animations feel more natural than CSS easing curves because they model real physics.

```tsx
// Spring types
const gentleSpring = { type: "spring", stiffness: 120, damping: 14 };
const bouncySpring = { type: "spring", stiffness: 300, damping: 10 };
const stiffSpring  = { type: "spring", stiffness: 400, damping: 30 };

// Common patterns
<motion.div
  whileHover={{ scale: 1.05 }}
  transition={{ type: "spring", stiffness: 300, damping: 20 }}
/>

// Toggle with spring
function ToggleSwitch({ isOn, onToggle }: { isOn: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "flex h-6 w-11 items-center rounded-full p-1 transition-colors",
        isOn ? "bg-amber-500" : "bg-stone-700"
      )}
    >
      <motion.div
        className="h-4 w-4 rounded-full bg-white shadow-md"
        animate={{ x: isOn ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}
```

---

## Page Transition Animations

### AnimatePresence for Route Transitions

`AnimatePresence` detects when direct children are removed from the React tree and plays exit animations before unmounting.

```tsx
// src/components/page-transition.tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";

const pageVariants: Variants = {
  initial: { opacity: 0, y: 12 },
  enter: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="enter"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### Using PageTransition in Layout

```tsx
// src/app/(dashboard)/layout.tsx
import { PageTransition } from "@/components/page-transition";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
```

### AnimatePresence Modes

```tsx
// "wait" — exit completes before enter starts (cleanest, slight delay)
<AnimatePresence mode="wait">

// "sync" — enter and exit happen simultaneously (overlapping)
<AnimatePresence mode="sync">

// "popLayout" — exiting elements are removed from layout flow immediately
<AnimatePresence mode="popLayout">
```

### Modal / Dialog Transitions

```tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, children }: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          {/* Modal content */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="w-full max-w-md rounded-xl border border-stone-700 bg-stone-900 p-6 shadow-2xl">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

---

## List & Layout Animations

### Staggered List with Variants

```tsx
"use client";

import { motion, type Variants } from "framer-motion";

const listVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.25, ease: "easeOut" },
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};

function ChatHistory({ conversations }: { conversations: Conversation[] }) {
  return (
    <motion.ul
      className="space-y-1"
      variants={listVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {conversations.map((convo) => (
          <motion.li
            key={convo.id}
            variants={itemVariants}
            exit="exit"
            layout
            className="rounded-lg px-3 py-2 hover:bg-stone-800"
          >
            <span className="text-sm text-stone-300">{convo.title}</span>
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  );
}
```

### Layout Animations

The `layout` prop on `motion` components triggers smooth animations when the component's layout position changes (e.g., reordering, filtering, resizing).

```tsx
"use client";

import { motion, LayoutGroup } from "framer-motion";

function FilterableAgentList({ agents, filter }: { agents: Agent[]; filter: string }) {
  const filtered = agents.filter((a) =>
    filter === "all" ? true : a.tier === filter
  );

  return (
    <LayoutGroup>
      <motion.div className="grid grid-cols-3 gap-4" layout>
        <AnimatePresence mode="popLayout">
          {filtered.map((agent) => (
            <motion.div
              key={agent.id}
              layout
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <AgentCard agent={agent} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </LayoutGroup>
  );
}
```

### Shared Layout Animations (Tabs, Highlights)

```tsx
"use client";

import { motion } from "framer-motion";

function TabBar({ tabs, activeTab, onSelect }: TabBarProps) {
  return (
    <div className="flex gap-1 rounded-lg bg-stone-800 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={cn(
            "relative rounded-md px-4 py-2 text-sm font-medium transition-colors",
            activeTab === tab.id ? "text-white" : "text-stone-400 hover:text-stone-200"
          )}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="active-tab-bg"
              className="absolute inset-0 rounded-md bg-stone-700"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
```

---

## Scroll-Triggered Animations

### Intersection Observer Hook

```tsx
"use client";

import { useEffect, useRef, useState } from "react";

interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useInView({
  threshold = 0.1,
  rootMargin = "0px",
  triggerOnce = true,
}: UseInViewOptions = {}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          if (triggerOnce) observer.unobserve(element);
        } else if (!triggerOnce) {
          setIsInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isInView };
}
```

### Scroll-Triggered Fade In

```tsx
"use client";

import { motion, useInView as useFramerInView } from "framer-motion";
import { useRef } from "react";

function ScrollFadeIn({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const isInView = useFramerInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// Usage on landing page
function LandingFeatures() {
  return (
    <section className="space-y-24 py-20">
      {features.map((feature) => (
        <ScrollFadeIn key={feature.id}>
          <FeatureSection feature={feature} />
        </ScrollFadeIn>
      ))}
    </section>
  );
}
```

### Scroll Progress Indicator

```tsx
"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-50 h-0.5 origin-left bg-amber-500"
      style={{ scaleX }}
    />
  );
}
```

### Parallax Scroll Effect

```tsx
"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

function ParallaxHero() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div ref={ref} className="relative h-screen overflow-hidden">
      <motion.div className="absolute inset-0" style={{ y }}>
        <div className="h-full w-full bg-gradient-to-b from-stone-900 to-amber-900/20" />
      </motion.div>
      <motion.div
        className="relative z-10 flex h-full items-center justify-center"
        style={{ opacity }}
      >
        <h1 className="text-6xl font-bold text-white">Stone AI</h1>
      </motion.div>
    </div>
  );
}
```

---

## Micro-Interactions

### Button Feedback

```tsx
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  isLoading?: boolean;
}

export function AnimatedButton({
  children,
  variant = "primary",
  isLoading,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.02 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      disabled={disabled || isLoading}
      className={cn(
        "relative inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium",
        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
        variant === "primary" && "bg-amber-500 text-black hover:bg-amber-400",
        variant === "secondary" && "border border-stone-600 text-stone-200 hover:bg-stone-800",
        variant === "ghost" && "text-stone-400 hover:text-stone-200 hover:bg-stone-800",
        (disabled || isLoading) && "cursor-not-allowed opacity-50",
        className
      )}
      {...props}
    >
      {isLoading && (
        <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4" fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      )}
      {children}
    </motion.button>
  );
}
```

### Hover Card with Depth

```tsx
"use client";

import { motion } from "framer-motion";

function DepthCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="rounded-xl border border-stone-800 bg-stone-900 p-6"
      whileHover={{
        y: -4,
        boxShadow: "0 20px 40px -12px rgba(0, 0, 0, 0.5)",
        borderColor: "rgb(120, 113, 108)",  // stone-500
      }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

### Focus Ring Animation

```tsx
// Tailwind-only approach (no JS needed)
<input
  className={cn(
    "rounded-lg border border-stone-700 bg-stone-900 px-3 py-2 text-stone-100",
    "outline-none ring-0",
    "transition-[box-shadow,border-color] duration-200",
    "focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20",
    "placeholder:text-stone-500"
  )}
  placeholder="Type a message..."
/>
```

### Icon Rotation / Collapse Toggle

```tsx
"use client";

import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

function CollapsibleSection({
  title,
  children,
  isOpen,
  onToggle,
}: {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-stone-800">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-medium text-stone-200">{title}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="h-4 w-4 text-stone-400" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

### Ripple Effect

```tsx
"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export function RippleButton({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { id, x, y }]);
    setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== id)), 600);

    props.onClick?.(e);
  }, [props]);

  return (
    <button
      {...props}
      onClick={handleClick}
      className="relative overflow-hidden rounded-lg bg-amber-500 px-6 py-3 text-sm font-medium text-black"
    >
      {children}
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            className="absolute rounded-full bg-white/30"
            style={{ left: ripple.x, top: ripple.y }}
            initial={{ width: 0, height: 0, x: 0, y: 0, opacity: 0.5 }}
            animate={{ width: 300, height: 300, x: -150, y: -150, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ))}
      </AnimatePresence>
    </button>
  );
}
```

---

## Loading Animations

### Skeleton Screens

```tsx
// Generic skeleton component
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-stone-800", className)} />
  );
}

// Chat message skeleton
function ChatMessageSkeleton() {
  return (
    <div className="flex gap-3 p-4">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

// Agent card skeleton
function AgentCardSkeleton() {
  return (
    <div className="rounded-xl border border-stone-800 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-8 w-24" />
    </div>
  );
}
```

### Shimmer Effect

```tsx
// CSS approach via Tailwind
function ShimmerSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-md",
        "bg-gradient-to-r from-stone-800 via-stone-700 to-stone-800",
        "bg-[length:200%_100%]",
        className
      )}
    />
  );
}

// Full page loading state
function PageLoadingSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <ShimmerSkeleton className="h-8 w-48" />
        <ShimmerSkeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <AgentCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
```

### Progress Bar

```tsx
"use client";

import { motion } from "framer-motion";

function ProgressBar({ value, max = 100 }: { value: number; max?: number }) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-stone-800">
      <motion.div
        className="h-full rounded-full bg-amber-500"
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      />
    </div>
  );
}

// Indeterminate progress
function IndeterminateProgress() {
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-stone-800">
      <motion.div
        className="h-full w-1/3 rounded-full bg-amber-500"
        animate={{ x: ["-100%", "400%"] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
```

### Typing Indicator (Chat)

```tsx
"use client";

import { motion } from "framer-motion";

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="h-2 w-2 rounded-full bg-stone-500"
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
      <span className="ml-2 text-xs text-stone-500">Agent is thinking...</span>
    </div>
  );
}
```

---

## Reduced Motion Accessibility

### The prefers-reduced-motion Media Query

Users with vestibular disorders or motion sensitivity can enable "Reduce motion" in their OS settings. **We must respect this.**

### Tailwind Approach

```tsx
// Tailwind's motion-reduce and motion-safe utilities
<div className={cn(
  "motion-safe:animate-fade-in",  // Only animate if user hasn't reduced motion
  "motion-reduce:opacity-100",     // Instant appearance for reduced motion
)} />

// Transition that respects preference
<button className={cn(
  "motion-safe:transition-transform motion-safe:duration-200",
  "motion-safe:hover:scale-105",
  "motion-reduce:hover:brightness-110",  // Alternative non-motion feedback
)}>
  Click me
</button>
```

### Framer Motion Approach

```tsx
"use client";

import { useReducedMotion } from "framer-motion";

function AnimatedSection({ children }: { children: React.ReactNode }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.4,
        ease: "easeOut",
      }}
    >
      {children}
    </motion.div>
  );
}
```

### Global Reduced Motion Configuration

```tsx
// Create a provider that sets Framer Motion defaults
"use client";

import { LazyMotion, domAnimation, MotionConfig } from "framer-motion";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        {children}
      </MotionConfig>
    </LazyMotion>
  );
}

// When reducedMotion="user", Framer Motion automatically:
// - Sets duration to 0 when prefers-reduced-motion is enabled
// - Skips spring calculations
// - Immediately resolves to the target state
```

### CSS Global Fallback

```css
/* In your global.css — the nuclear option */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Performance & GPU Acceleration

### The Compositing Model

Browsers render in three stages:
1. **Layout** (reflow) — position, size, flow
2. **Paint** — colors, text, shadows, borders
3. **Composite** — layers composited by the GPU

**Goal**: Keep animations in the composite stage only. The only properties that are composite-only are:
- `transform` (translate, scale, rotate)
- `opacity`

Everything else triggers layout or paint.

### What to Animate (and What NOT to)

| SAFE (composite-only) | AVOID (triggers layout) | AVOID (triggers paint) |
|---|---|---|
| `transform: translateX/Y` | `width`, `height` | `color` |
| `transform: scale` | `margin`, `padding` | `background-color` |
| `transform: rotate` | `top`, `left`, `right`, `bottom` | `border-color` |
| `opacity` | `font-size` | `box-shadow` |
| `filter` (GPU on most browsers) | `line-height` | `text-shadow` |

```tsx
// BAD — animates width (triggers layout every frame)
<motion.div animate={{ width: isOpen ? 280 : 0 }} />

// GOOD — animates translateX (composite only)
<motion.div
  animate={{ x: isOpen ? 0 : -280 }}
  style={{ width: 280 }}
/>

// BAD — animates height for accordion
<motion.div animate={{ height: isOpen ? "auto" : 0 }} />
// This one is acceptable because there's no composite-only alternative
// for height. Use it sparingly and keep content minimal.
```

### will-change Optimization

The `will-change` CSS property tells the browser to promote an element to its own compositor layer before the animation starts.

```tsx
// Tailwind utility
<div className="will-change-transform" />
<div className="will-change-[opacity,transform]" />

// IMPORTANT: will-change is a HINT, not a directive
// - Only use it on elements that WILL animate
// - Remove it after animation completes (or only add it on hover/focus)
// - Too many will-change elements = excessive memory usage

// Pattern: add will-change on hover, animate on interaction
<div className="hover:will-change-transform active:scale-95 transition-transform" />
```

### contain Property for Isolation

```tsx
// Isolate layout calculations
<div className="[contain:layout]">
  {/* Changes inside this container won't trigger reflow outside */}
  <motion.div animate={{ y: [0, -10, 0] }} />
</div>

// Full containment (layout + paint + size)
<div className="[contain:strict]" style={{ width: 300, height: 200 }}>
  {/* Fully isolated — browser knows nothing inside affects outside */}
</div>
```

### LazyMotion for Bundle Size

```tsx
// Default Framer Motion import is ~30KB gzipped
// LazyMotion with domAnimation is ~16KB

"use client";

import { LazyMotion, domAnimation, m } from "framer-motion";

// Use `m` instead of `motion` — same API, tree-shakeable
function OptimizedComponent() {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Content
      </m.div>
    </LazyMotion>
  );
}
```

### Animation Frame Budget

At 60fps, each frame has ~16.67ms. If your animation computation + render exceeds this, frames drop.

```tsx
// Debug: monitor frame rate in development
"use client";

import { useEffect, useRef } from "react";

function FPSCounter() {
  const frameRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animId: number;
    const loop = (now: number) => {
      frameRef.current++;
      if (now - lastTimeRef.current >= 1000) {
        if (fpsRef.current) {
          fpsRef.current.textContent = `${frameRef.current} FPS`;
        }
        frameRef.current = 0;
        lastTimeRef.current = now;
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  if (process.env.NODE_ENV !== "development") return null;
  return (
    <div
      ref={fpsRef}
      className="fixed bottom-2 right-2 z-[9999] rounded bg-black/80 px-2 py-1 text-xs text-green-400 font-mono"
    />
  );
}
```

---

## Real-World Patterns: Stone AI

### Animated Sidebar (Collapsible)

```tsx
"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";

const sidebarVariants = {
  expanded: { width: 280 },
  collapsed: { width: 64 },
};

const labelVariants = {
  expanded: { opacity: 1, x: 0, display: "block" },
  collapsed: { opacity: 0, x: -10, display: "none" },
};

export function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <motion.aside
      className="flex h-screen flex-col border-r border-stone-800 bg-stone-950"
      variants={sidebarVariants}
      animate={isExpanded ? "expanded" : "collapsed"}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between px-4">
        <motion.span
          variants={labelVariants}
          className="text-lg font-bold text-amber-500"
        >
          Stone AI
        </motion.span>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="rounded-md p-1.5 text-stone-400 hover:bg-stone-800 hover:text-stone-200"
        >
          <motion.div
            animate={{ rotate: isExpanded ? 0 : 180 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </motion.div>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => (
          <NavItem
            key={item.href}
            item={item}
            isExpanded={isExpanded}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-stone-800 p-3">
        <motion.div variants={labelVariants} className="text-xs text-stone-500">
          v1.0.0
        </motion.div>
      </div>
    </motion.aside>
  );
}

function NavItem({ item, isExpanded }: { item: NavItemType; isExpanded: boolean }) {
  const isActive = usePathname() === item.href;

  return (
    <Link
      href={item.href}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
        "transition-colors duration-200",
        isActive
          ? "bg-stone-800 text-amber-500"
          : "text-stone-400 hover:bg-stone-800/50 hover:text-stone-200"
      )}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      <motion.span
        variants={labelVariants}
        className="truncate"
      >
        {item.label}
      </motion.span>
      {item.badge && isExpanded && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="ml-auto rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-500"
        >
          {item.badge}
        </motion.span>
      )}
    </Link>
  );
}
```

### Chat Message Entrance Animation

```tsx
"use client";

import { motion, type Variants } from "framer-motion";

const messageVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.25,
      ease: "easeOut",
    },
  },
};

interface ChatMessageProps {
  message: {
    id: string;
    role: "user" | "assistant";
    content: string;
    agentName?: string;
    agentAvatar?: string;
    timestamp: Date;
  };
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      layout
      className={cn(
        "flex gap-3 px-4 py-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.1 }}
        className="shrink-0"
      >
        {isUser ? (
          <div className="h-8 w-8 rounded-full bg-amber-500 flex items-center justify-center">
            <span className="text-xs font-bold text-black">You</span>
          </div>
        ) : (
          <div className="h-8 w-8 rounded-full bg-stone-700 flex items-center justify-center">
            <span className="text-xs text-stone-300">
              {message.agentName?.[0] ?? "AI"}
            </span>
          </div>
        )}
      </motion.div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5",
          isUser
            ? "rounded-br-md bg-amber-500 text-black"
            : "rounded-bl-md bg-stone-800 text-stone-100"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        <time
          className={cn(
            "mt-1 block text-[10px]",
            isUser ? "text-amber-800" : "text-stone-500"
          )}
        >
          {new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }).format(message.timestamp)}
        </time>
      </div>
    </motion.div>
  );
}
```

### Streaming Message Animation (Token by Token)

```tsx
"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

function StreamingMessage({ tokens }: { tokens: string[] }) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount < tokens.length) {
      const timer = setTimeout(() => {
        setVisibleCount((c) => c + 1);
      }, 30);  // 30ms per token for natural reading speed
      return () => clearTimeout(timer);
    }
  }, [visibleCount, tokens.length]);

  return (
    <div className="text-sm text-stone-100 leading-relaxed">
      {tokens.slice(0, visibleCount).map((token, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          {token}
        </motion.span>
      ))}
      {visibleCount < tokens.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-1.5 h-4 ml-0.5 bg-amber-500 align-text-bottom"
        />
      )}
    </div>
  );
}
```

### Notification Toast with Exit Animation

```tsx
"use client";

import { AnimatePresence, motion } from "framer-motion";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col-reverse gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className={cn(
              "flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg",
              toast.type === "success" && "border-green-800 bg-green-950 text-green-200",
              toast.type === "error" && "border-red-800 bg-red-950 text-red-200",
              toast.type === "info" && "border-stone-700 bg-stone-900 text-stone-200",
            )}
          >
            <span className="text-sm">{toast.message}</span>
            <button
              onClick={() => onDismiss(toast.id)}
              className="ml-2 text-stone-400 hover:text-stone-200"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

---

## Quick Reference: Animation Decision Tree

```
Is it a simple hover/focus state?
  → YES: Use Tailwind transitions (transition-colors, duration-200)
  → NO: ↓

Is it a mount/unmount animation?
  → YES: Use Framer Motion + AnimatePresence
  → NO: ↓

Is it a list reorder or filter?
  → YES: Use Framer Motion layout + AnimatePresence
  → NO: ↓

Is it scroll-triggered?
  → YES: Use Framer Motion useInView or useScroll
  → NO: ↓

Is it a looping/continuous animation?
  → YES: Use Tailwind animate-* or CSS @keyframes
  → NO: ↓

Is it a complex orchestration (stagger, sequence)?
  → YES: Use Framer Motion variants with staggerChildren
  → NO: Use Tailwind transitions
```

---

## Common Mistakes

1. **Animating layout properties**: Avoid animating `width`, `height`, `padding`, `margin`. Use `transform` instead.
2. **Forgetting AnimatePresence**: Without it, exit animations never fire — components just vanish.
3. **Missing `key` prop**: AnimatePresence requires a unique `key` on its direct children to detect additions/removals.
4. **Over-animating**: Not every element needs to animate. Reserve motion for meaningful state changes.
5. **Ignoring reduced motion**: Always provide `motion-safe:` prefixes or `useReducedMotion()`.
6. **Using `transition-all`**: Transitions every property, including ones you didn't intend. Be specific.
7. **`will-change` everywhere**: Promotes too many elements to GPU layers, increasing memory usage.
8. **Framer Motion in Server Components**: Any component using `motion` must be `"use client"`.

---

*Stone AI Palace USB Package — Frontend Engineering Seed*
*Animation & Motion Patterns v1.0*
