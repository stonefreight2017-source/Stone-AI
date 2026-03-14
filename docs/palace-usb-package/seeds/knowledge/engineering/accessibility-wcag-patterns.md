# Accessibility & WCAG Patterns — Frontend Engineering Seed

> Deep knowledge seed for the Stone AI Palace USB Package.
> Covers WCAG 2.1 AA compliance, keyboard navigation, screen reader support, ARIA patterns, color contrast, form accessibility, dialog patterns, data tables, testing tools, and Stone AI-specific accessibility patterns.

---

## Table of Contents

1. [WCAG 2.1 AA Compliance Overview](#wcag-21-aa-compliance-overview)
2. [Keyboard Navigation](#keyboard-navigation)
3. [Screen Reader Support](#screen-reader-support)
4. [Color Contrast Requirements](#color-contrast-requirements)
5. [Form Accessibility](#form-accessibility)
6. [Dialog & Modal Accessibility](#dialog--modal-accessibility)
7. [Data Table Accessibility](#data-table-accessibility)
8. [Skip Navigation Links](#skip-navigation-links)
9. [Semantic HTML](#semantic-html)
10. [Live Regions & Dynamic Content](#live-regions--dynamic-content)
11. [Testing Tools](#testing-tools)
12. [Stone AI Specific Patterns](#stone-ai-specific-patterns)
13. [WCAG Compliance Checklist](#wcag-compliance-checklist)

---

## WCAG 2.1 AA Compliance Overview

WCAG (Web Content Accessibility Guidelines) is organized into four principles — **POUR**:

| Principle | Meaning | Key Requirements |
|---|---|---|
| **Perceivable** | Users can perceive the content | Text alternatives, captions, contrast, resizable text |
| **Operable** | Users can operate the interface | Keyboard accessible, no seizure triggers, navigable |
| **Understandable** | Users can understand content | Readable, predictable, input assistance |
| **Robust** | Content works with assistive tech | Valid HTML, ARIA where needed, compatible |

### Conformance Levels

| Level | Standard | Requirement |
|---|---|---|
| **A** | Minimum | Basic accessibility — must meet |
| **AA** | Mid-range | The legal standard for most jurisdictions (ADA, EAA) |
| **AAA** | Highest | Enhanced — aspirational, not required |

**Stone AI targets: WCAG 2.1 Level AA.**

### Legal Context

- **ADA** (US): Web accessibility is increasingly enforced. Over 2,000 lawsuits/year.
- **EAA** (EU): European Accessibility Act — applies to digital products from June 2025.
- **Section 508** (US Gov): Federal agencies and contractors.

---

## Keyboard Navigation

### Focus Management Fundamentals

Every interactive element must be reachable and operable via keyboard.

| Key | Standard Behavior |
|---|---|
| `Tab` | Move focus to next focusable element |
| `Shift + Tab` | Move focus to previous focusable element |
| `Enter` / `Space` | Activate buttons, links, form submissions |
| `Escape` | Close modals, menus, dropdowns |
| `Arrow keys` | Navigate within composite widgets (tabs, menus, lists) |
| `Home` / `End` | Jump to first/last item in a list |

### Tab Order

```tsx
// Natural tab order follows DOM order — keep it logical

// BAD — visual order differs from DOM order (CSS reordering)
<div className="flex flex-col-reverse">
  <button>Second visually, first in DOM</button>
  <button>First visually, second in DOM</button>
</div>

// GOOD — DOM order matches visual order
<div className="flex flex-col">
  <button>First</button>
  <button>Second</button>
</div>

// Removing from tab order (but still focusable programmatically)
<div tabIndex={-1} ref={panelRef}>
  {/* Content that receives programmatic focus but isn't in tab order */}
</div>

// NEVER use tabIndex > 0 — it breaks natural tab order
// tabIndex={1} is an anti-pattern
```

### Focus Indicators

```tsx
// Tailwind focus styles
<button
  className={cn(
    "rounded-lg bg-amber-500 px-4 py-2 text-black",
    // Focus ring — must be visible on all backgrounds
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900"
  )}
>
  Click me
</button>

// IMPORTANT: Use focus-visible (not focus)
// focus-visible only shows on keyboard navigation, not mouse clicks
// This is better UX — mouse users don't need focus indicators

// Global focus styles in globals.css
// Ensures every focusable element has a visible indicator
```

```css
/* src/app/globals.css */
*:focus-visible {
  outline: 2px solid rgb(245 158 11); /* amber-500 */
  outline-offset: 2px;
}

/* Remove default outline since we handle it with focus-visible */
*:focus {
  outline: none;
}
```

### Focus Trapping

When a modal or dialog is open, focus must stay within it. Users should not be able to Tab into the page behind the modal.

```tsx
// src/hooks/use-focus-trap.ts
"use client";

import { useCallback, useEffect, useRef } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
  "[contenteditable]",
].join(", ");

export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Store current focus to restore later
    previousFocusRef.current = document.activeElement as HTMLElement;

    // Focus first focusable element in container
    const container = containerRef.current;
    if (!container) return;

    const firstFocusable = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    firstFocusable?.focus();

    return () => {
      // Restore focus when trap deactivates
      previousFocusRef.current?.focus();
    };
  }, [isActive]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isActive || e.key !== "Tab") return;

      const container = containerRef.current;
      if (!container) return;

      const focusableElements = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      );

      if (focusableElements.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      // Shift+Tab on first element → go to last
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
      // Tab on last element → go to first
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    },
    [isActive]
  );

  return { containerRef, handleKeyDown };
}
```

### Roving Tab Index (Composite Widgets)

For tab bars, toolbars, and menus, use a single tab stop with arrow keys to navigate between items.

```tsx
"use client";

import { useState, useCallback, useRef } from "react";

interface RovingTabIndexProps {
  items: { id: string; label: string }[];
  onSelect: (id: string) => void;
  activeId: string;
}

function TabList({ items, onSelect, activeId }: RovingTabIndexProps) {
  const [focusIndex, setFocusIndex] = useState(
    items.findIndex((i) => i.id === activeId)
  );
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let newIndex = focusIndex;

      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          e.preventDefault();
          newIndex = (focusIndex + 1) % items.length;
          break;
        case "ArrowLeft":
        case "ArrowUp":
          e.preventDefault();
          newIndex = (focusIndex - 1 + items.length) % items.length;
          break;
        case "Home":
          e.preventDefault();
          newIndex = 0;
          break;
        case "End":
          e.preventDefault();
          newIndex = items.length - 1;
          break;
        default:
          return;
      }

      setFocusIndex(newIndex);
      itemRefs.current[newIndex]?.focus();
    },
    [focusIndex, items.length]
  );

  return (
    <div role="tablist" aria-label="Sections" onKeyDown={handleKeyDown}>
      {items.map((item, index) => (
        <button
          key={item.id}
          ref={(el) => { itemRefs.current[index] = el; }}
          role="tab"
          aria-selected={item.id === activeId}
          tabIndex={index === focusIndex ? 0 : -1}
          onClick={() => onSelect(item.id)}
          className={cn(
            "px-4 py-2 text-sm",
            item.id === activeId
              ? "border-b-2 border-amber-500 text-amber-500"
              : "text-stone-400"
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
```

---

## Screen Reader Support

### ARIA Attributes Reference

| Attribute | Purpose | Example |
|---|---|---|
| `aria-label` | Label for elements without visible text | Icon buttons |
| `aria-labelledby` | Points to the ID of a visible label element | Sections, dialogs |
| `aria-describedby` | Points to additional descriptive text | Form error messages |
| `aria-hidden="true"` | Hides from screen readers (still visible) | Decorative icons |
| `aria-live` | Announces dynamic content changes | Chat messages, alerts |
| `aria-expanded` | Indicates expandable content state | Menus, accordions |
| `aria-current="page"` | Indicates current page in navigation | Nav links |
| `aria-busy` | Indicates loading state | Loading containers |
| `aria-invalid` | Indicates validation error | Form inputs |
| `role` | Defines the semantic role | Custom widgets |

### The First Rule of ARIA

**Use native HTML elements whenever possible.** ARIA is a supplement, not a replacement.

```tsx
// BAD — fake button with ARIA
<div role="button" tabIndex={0} onClick={handleClick} onKeyDown={handleKeyDown}>
  Click me
</div>

// GOOD — native button (free keyboard support, free semantics)
<button onClick={handleClick}>Click me</button>

// BAD — fake link with ARIA
<span role="link" tabIndex={0} onClick={() => router.push("/about")}>
  About
</span>

// GOOD — native link
<Link href="/about">About</Link>
```

### Icon Buttons

```tsx
// Icon buttons MUST have accessible names

// Option 1: aria-label
<button aria-label="Close dialog" onClick={onClose}>
  <XIcon className="h-5 w-5" aria-hidden="true" />
</button>

// Option 2: Visually hidden text
<button onClick={onClose}>
  <XIcon className="h-5 w-5" aria-hidden="true" />
  <span className="sr-only">Close dialog</span>
</button>

// Tailwind's sr-only class:
// position: absolute; width: 1px; height: 1px; padding: 0;
// margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0);
// white-space: nowrap; border-width: 0;
```

### Decorative vs Informative Images

```tsx
// Decorative image — hide from screen readers
<img src="/decorative-bg.png" alt="" aria-hidden="true" />

// Informative image — describe the content
<img src="/agent-avatar.png" alt="Stone AI Agent #12 — Code Reviewer" />

// Complex image — use aria-describedby for long descriptions
<figure>
  <img
    src="/architecture-diagram.png"
    alt="Stone AI system architecture"
    aria-describedby="arch-description"
  />
  <figcaption id="arch-description">
    Diagram showing the flow from user input through the API gateway to the
    agent orchestration layer, which routes to either local vLLM or cloud
    Anthropic Claude based on tier configuration.
  </figcaption>
</figure>
```

### Status Messages

```tsx
// Screen readers should announce status changes without stealing focus

// Toast notification
<div role="status" aria-live="polite">
  {toast && <p>{toast.message}</p>}
</div>

// Error alert
<div role="alert">
  {error && <p>Error: {error.message}</p>}
</div>

// Loading state
<div aria-busy={isLoading} aria-live="polite">
  {isLoading ? "Loading agents..." : `${agents.length} agents found`}
</div>
```

---

## Color Contrast Requirements

### WCAG AA Contrast Ratios

| Text Size | Minimum Ratio |
|---|---|
| Normal text (< 18px or < 14px bold) | **4.5:1** |
| Large text (>= 18px or >= 14px bold) | **3:1** |
| UI components and graphical objects | **3:1** |

### Stone AI Color Palette Contrast Check

```
Background: stone-950 (#0c0a09)

Text on stone-950:
  stone-100 (#f5f5f4) → 17.4:1 ✅ (primary text)
  stone-200 (#e7e5e4) → 14.3:1 ✅ (secondary text)
  stone-300 (#d6d3d1) → 11.2:1 ✅ (body text)
  stone-400 (#a8a29e) → 6.1:1  ✅ (muted text — passes AA normal)
  stone-500 (#78716c) → 3.7:1  ⚠️ (passes large text only)
  stone-600 (#57534e) → 2.4:1  ❌ (fails — don't use for text)
  amber-500 (#f59e0b) → 8.2:1  ✅ (accent — passes AA)
  amber-400 (#fbbf24) → 10.8:1 ✅

Interactive elements on stone-800 (#292524):
  stone-100 (#f5f5f4) → 12.5:1 ✅
  amber-500 (#f59e0b) → 5.9:1  ✅
```

### Don't Rely on Color Alone

```tsx
// BAD — color is the only indicator of error state
<input className={hasError ? "border-red-500" : "border-stone-700"} />

// GOOD — color + icon + text
<div>
  <input
    className={cn(
      "rounded-lg border px-3 py-2",
      hasError ? "border-red-500" : "border-stone-700"
    )}
    aria-invalid={hasError}
    aria-describedby={hasError ? "email-error" : undefined}
  />
  {hasError && (
    <p id="email-error" className="mt-1 flex items-center gap-1 text-xs text-red-400">
      <AlertCircleIcon className="h-3 w-3" aria-hidden="true" />
      Please enter a valid email address
    </p>
  )}
</div>
```

### High Contrast Mode Support

```tsx
// Tailwind doesn't have built-in forced-colors support, add manually
// src/app/globals.css

@media (forced-colors: active) {
  /* Windows High Contrast Mode */
  .btn-primary {
    border: 2px solid ButtonText;
  }

  .focus-ring {
    outline: 2px solid Highlight;
  }

  /* Ensure icons are visible */
  svg {
    forced-color-adjust: auto;
  }
}
```

---

## Form Accessibility

### Labels Are Non-Negotiable

Every form input must have an associated label. No exceptions.

```tsx
// Option 1: Explicit label (preferred)
<div>
  <label htmlFor="username" className="text-sm font-medium text-stone-200">
    Username
  </label>
  <input id="username" type="text" name="username" />
</div>

// Option 2: aria-label (for inputs without visible labels)
<input
  type="search"
  aria-label="Search agents"
  placeholder="Search agents..."
/>

// Option 3: aria-labelledby (label is elsewhere in the DOM)
<h2 id="settings-heading">Settings</h2>
<form aria-labelledby="settings-heading">
  {/* ... */}
</form>

// NEVER rely on placeholder as the only label
// BAD:
<input placeholder="Email" />
// Placeholder disappears when user types, leaving no label
```

### Required Fields

```tsx
<div>
  <label htmlFor="email" className="text-sm font-medium text-stone-200">
    Email
    <span className="ml-1 text-red-400" aria-hidden="true">*</span>
  </label>
  <input
    id="email"
    type="email"
    required
    aria-required="true"
    className="mt-1 w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2"
  />
  <p className="sr-only">Required field</p>
</div>
```

### Error Messages

```tsx
interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

function FormField({ id, label, error, required, children }: FormFieldProps) {
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-stone-200">
        {label}
        {required && (
          <span className="ml-1 text-red-400" aria-hidden="true">*</span>
        )}
      </label>

      {/* Clone child to inject aria attributes */}
      {React.cloneElement(children as React.ReactElement, {
        id,
        "aria-required": required,
        "aria-invalid": !!error,
        "aria-describedby": error ? errorId : undefined,
      })}

      {error && (
        <p id={errorId} className="flex items-center gap-1 text-xs text-red-400" role="alert">
          <AlertCircleIcon className="h-3 w-3" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}

// Usage
<FormField id="email" label="Email" error={errors.email?.message} required>
  <input
    type="email"
    className="w-full rounded-lg border border-stone-700 bg-stone-900 px-3 py-2"
    {...register("email")}
  />
</FormField>
```

### Form Submission Feedback

```tsx
function SubmitButton({ isSubmitting, isSuccess }: { isSubmitting: boolean; isSuccess: boolean }) {
  return (
    <div>
      <button
        type="submit"
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="rounded-lg bg-amber-500 px-4 py-2 text-black disabled:opacity-50"
      >
        {isSubmitting ? "Saving..." : "Save"}
      </button>

      {/* Announce result to screen readers */}
      <div aria-live="polite" className="sr-only">
        {isSubmitting && "Saving your changes..."}
        {isSuccess && "Changes saved successfully."}
      </div>
    </div>
  );
}
```

### Fieldset and Legend

```tsx
// Group related fields with fieldset/legend
<fieldset className="space-y-3 rounded-lg border border-stone-800 p-4">
  <legend className="px-2 text-sm font-medium text-stone-200">
    Notification Preferences
  </legend>

  <label className="flex items-center gap-2">
    <input type="checkbox" name="emailNotifications" />
    <span className="text-sm text-stone-300">Email notifications</span>
  </label>

  <label className="flex items-center gap-2">
    <input type="checkbox" name="pushNotifications" />
    <span className="text-sm text-stone-300">Push notifications</span>
  </label>
</fieldset>
```

---

## Dialog & Modal Accessibility

### Complete Accessible Modal

```tsx
"use client";

import { useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useFocusTrap } from "@/hooks/use-focus-trap";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
}: ModalProps) {
  const { containerRef, handleKeyDown } = useFocusTrap(isOpen);
  const titleId = "modal-title";
  const descriptionId = description ? "modal-description" : undefined;

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

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
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descriptionId}
          >
            <motion.div
              ref={containerRef}
              onKeyDown={handleKeyDown}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-xl border border-stone-700 bg-stone-900 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-stone-800 px-6 py-4">
                <h2
                  id={titleId}
                  className="text-lg font-semibold text-stone-100"
                >
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  aria-label="Close dialog"
                  className="rounded-md p-1 text-stone-400 hover:bg-stone-800 hover:text-stone-200 focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <XIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-4">
                {description && (
                  <p id={descriptionId} className="mb-4 text-sm text-stone-400">
                    {description}
                  </p>
                )}
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
```

### Confirmation Dialog

```tsx
function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <AccessibleModal isOpen={isOpen} onClose={onClose} title={title} description={message}>
      <div className="flex justify-end gap-3 pt-4">
        <button
          onClick={onClose}
          className="rounded-lg border border-stone-700 px-4 py-2 text-sm text-stone-300 hover:bg-stone-800"
        >
          {cancelLabel}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={cn(
            "rounded-lg px-4 py-2 text-sm font-medium",
            destructive
              ? "bg-red-600 text-white hover:bg-red-500"
              : "bg-amber-500 text-black hover:bg-amber-400"
          )}
          autoFocus  // Focus the primary action
        >
          {confirmLabel}
        </button>
      </div>
    </AccessibleModal>
  );
}
```

---

## Data Table Accessibility

### Accessible Table Pattern

```tsx
interface Column<T> {
  id: string;
  header: string;
  accessor: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface AccessibleTableProps<T> {
  columns: Column<T>[];
  data: T[];
  caption: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  onSort?: (columnId: string) => void;
}

function AccessibleTable<T extends { id: string }>({
  columns,
  data,
  caption,
  sortBy,
  sortDir,
  onSort,
}: AccessibleTableProps<T>) {
  return (
    <div className="overflow-x-auto" role="region" aria-label={caption} tabIndex={0}>
      <table className="w-full text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-stone-800">
            {columns.map((col) => (
              <th
                key={col.id}
                scope="col"
                aria-sort={
                  sortBy === col.id
                    ? sortDir === "asc"
                      ? "ascending"
                      : "descending"
                    : undefined
                }
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-stone-400"
              >
                {col.sortable && onSort ? (
                  <button
                    onClick={() => onSort(col.id)}
                    className="flex items-center gap-1 hover:text-stone-200"
                  >
                    {col.header}
                    {sortBy === col.id && (
                      <span aria-hidden="true">
                        {sortDir === "asc" ? "▲" : "▼"}
                      </span>
                    )}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id} className="border-b border-stone-800/50 hover:bg-stone-800/30">
              {columns.map((col) => (
                <td key={col.id} className="px-4 py-3 text-stone-300">
                  {col.accessor(row)}
                </td>
              ))}
            </tr>
          ))}
          {data.length === 0 && (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-stone-500"
              >
                No data found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
```

### Key Table Accessibility Rules

1. **Always include `<caption>`** — even if visually hidden (`sr-only`).
2. **Use `scope="col"` and `scope="row"`** — helps screen readers associate cells with headers.
3. **Use `aria-sort`** on sortable columns — announces sort state.
4. **Wrap in scrollable container** with `role="region"`, `aria-label`, and `tabIndex={0}` — makes scrollable region keyboard accessible.
5. **Don't use tables for layout** — only for tabular data.

---

## Skip Navigation Links

Skip links let keyboard users jump past repetitive navigation to the main content.

```tsx
// src/components/skip-nav.tsx
export function SkipNav() {
  return (
    <a
      href="#main-content"
      className={cn(
        "fixed left-4 top-4 z-[9999] rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-black",
        "opacity-0 -translate-y-full",
        "focus:opacity-100 focus:translate-y-0",
        "transition-all duration-200"
      )}
    >
      Skip to main content
    </a>
  );
}

// Usage in root layout
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SkipNav />
        <header>{/* navigation */}</header>
        <main id="main-content" tabIndex={-1}>
          {children}
        </main>
      </body>
    </html>
  );
}
```

### Multiple Skip Links

```tsx
function SkipNavMultiple() {
  return (
    <div className="fixed left-4 top-4 z-[9999] flex flex-col gap-1">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:rounded-lg focus:bg-amber-500 focus:px-4 focus:py-2 focus:text-black"
      >
        Skip to main content
      </a>
      <a
        href="#chat-input"
        className="sr-only focus:not-sr-only focus:rounded-lg focus:bg-amber-500 focus:px-4 focus:py-2 focus:text-black"
      >
        Skip to chat input
      </a>
      <a
        href="#sidebar-nav"
        className="sr-only focus:not-sr-only focus:rounded-lg focus:bg-amber-500 focus:px-4 focus:py-2 focus:text-black"
      >
        Skip to navigation
      </a>
    </div>
  );
}
```

---

## Semantic HTML

### Element Reference

| Element | Use For | NOT For |
|---|---|---|
| `<header>` | Page or section header | Generic container |
| `<nav>` | Primary navigation areas | Any set of links |
| `<main>` | Primary page content (1 per page) | Repeated content |
| `<article>` | Self-contained content | Sections of a page |
| `<section>` | Thematic grouping with heading | Generic container |
| `<aside>` | Side content, tangentially related | Primary content |
| `<footer>` | Page or section footer | Generic container |
| `<button>` | Clickable actions | Navigation (use `<a>`) |
| `<a>` | Navigation to a URL | Actions (use `<button>`) |
| `<h1>` - `<h6>` | Heading hierarchy | Styling bold text |

### Heading Hierarchy

```tsx
// GOOD — logical heading hierarchy
<main>
  <h1>Stone AI Agents</h1>              {/* One h1 per page */}

  <section>
    <h2>Free Tier Agents</h2>            {/* Major sections */}
    <article>
      <h3>Agent #1 — General Assistant</h3>  {/* Subsections */}
      <p>Description...</p>
    </article>
  </section>

  <section>
    <h2>Starter Tier Agents</h2>
    <article>
      <h3>Agent #5 — Code Reviewer</h3>
      <h4>Supported Languages</h4>        {/* Sub-subsection */}
    </article>
  </section>
</main>

// BAD — skipping levels
<h1>Agents</h1>
<h3>Free Tier</h3>      {/* Skipped h2! */}
<h5>Agent Details</h5>   {/* Skipped h4! */}
```

### Landmark Roles

Screen readers let users jump between landmarks. Native HTML elements provide these automatically:

```tsx
<header>     {/* role="banner" — automatic */}
<nav>        {/* role="navigation" — automatic */}
<main>       {/* role="main" — automatic */}
<aside>      {/* role="complementary" — automatic */}
<footer>     {/* role="contentinfo" — automatic */}

{/* Multiple navs should have labels */}
<nav aria-label="Main navigation">{/* primary nav */}</nav>
<nav aria-label="Agent categories">{/* secondary nav */}</nav>
```

---

## Live Regions & Dynamic Content

### aria-live for Dynamic Updates

```tsx
// Polite — waits for user to finish current activity
<div aria-live="polite">
  {searchResults.length} results found
</div>

// Assertive — interrupts immediately (use sparingly)
<div aria-live="assertive" role="alert">
  {error && `Error: ${error.message}`}
</div>

// Off — no announcements (default)
<div aria-live="off">
  {/* Content that changes but doesn't need announcing */}
</div>
```

### Chat Message Announcements

```tsx
function ChatMessageList({ messages }: { messages: Message[] }) {
  return (
    <div role="log" aria-label="Chat messages" aria-live="polite">
      {messages.map((msg) => (
        <div key={msg.id} className="flex gap-3 p-4">
          <div>
            <span className="sr-only">
              {msg.role === "user" ? "You said" : `${msg.agentName} said`}:
            </span>
            <p>{msg.content}</p>
            <time className="sr-only" dateTime={msg.timestamp.toISOString()}>
              {formatTime(msg.timestamp)}
            </time>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Loading State Announcements

```tsx
function LoadingAnnouncer({ isLoading, itemName }: { isLoading: boolean; itemName: string }) {
  return (
    <div aria-live="polite" className="sr-only">
      {isLoading ? `Loading ${itemName}...` : `${itemName} loaded.`}
    </div>
  );
}

// Usage
<LoadingAnnouncer isLoading={isLoading} itemName="agents" />
```

---

## Testing Tools

### Automated Testing

| Tool | Type | How to Use |
|---|---|---|
| **axe-core** | Library | `npm install axe-core` — run in tests or browser |
| **@axe-core/react** | React integration | Logs a11y violations to console in development |
| **Lighthouse** | Chrome DevTools | Audits > Accessibility (score 0-100) |
| **eslint-plugin-jsx-a11y** | ESLint plugin | Catches common issues at build time |

### axe-core in Development

```tsx
// src/app/layout.tsx (development only)
if (process.env.NODE_ENV === "development") {
  import("@axe-core/react").then((axe) => {
    import("react-dom").then((ReactDOM) => {
      axe.default(React, ReactDOM, 1000);
      // Logs violations to browser console every 1000ms
    });
  });
}
```

### ESLint Plugin

```bash
npm install -D eslint-plugin-jsx-a11y
```

```json
// .eslintrc.json
{
  "extends": ["next/core-web-vitals", "plugin:jsx-a11y/recommended"],
  "plugins": ["jsx-a11y"]
}
```

### Manual Testing Checklist

1. **Keyboard only**: Unplug mouse. Tab through entire app. Can you reach everything? Is focus visible?
2. **Screen reader**: Test with NVDA (Windows, free), VoiceOver (macOS, built-in), or JAWS (Windows, paid).
3. **Zoom**: Zoom browser to 200%. Does layout break? Is text readable?
4. **High contrast**: Enable Windows High Contrast Mode. Are all elements visible?
5. **Reduced motion**: Enable "Reduce motion" in OS settings. Do animations respect it?
6. **Color blindness**: Use Chrome DevTools > Rendering > Emulate vision deficiencies.

### Screen Reader Testing Scripts

```
Test: Navigation
1. Open page with screen reader
2. Press H to jump between headings — are they logical?
3. Press Tab to move through interactive elements — is order logical?
4. Press D to jump between landmarks — are regions labeled?

Test: Forms
1. Tab to first form field — is the label announced?
2. Leave required field empty — is error announced?
3. Submit form — is success/error announced?

Test: Chat Interface
1. Send a message — is the response announced via aria-live?
2. Tab to chat input — can you type and send with Enter?
3. Is the agent name announced with each message?
```

---

## Stone AI Specific Patterns

### Chat Interface Accessibility

```tsx
// src/components/chat/chat-container.tsx
function ChatContainer() {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div
      className="flex h-full flex-col"
      role="region"
      aria-label="Chat with AI agent"
    >
      {/* Messages area */}
      <div
        role="log"
        aria-label="Chat messages"
        aria-live="polite"
        className="flex-1 overflow-y-auto"
        tabIndex={0}  // Make scrollable area keyboard-focusable
      >
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        {isStreaming && (
          <div aria-live="off">
            {/* Don't announce streaming tokens — too noisy */}
            <StreamingMessage content={streamingContent} />
          </div>
        )}
        <div aria-live="polite" className="sr-only">
          {isStreaming
            ? "Agent is responding..."
            : lastMessage?.role === "assistant"
            ? "Agent response complete."
            : ""}
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-stone-800 p-4">
        <label htmlFor="chat-input" className="sr-only">
          Type your message
        </label>
        <textarea
          ref={inputRef}
          id="chat-input"
          aria-label="Type your message to the AI agent"
          placeholder="Type a message..."
          rows={1}
          className="w-full resize-none rounded-lg border border-stone-700 bg-stone-900 px-4 py-3"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <p className="mt-1 text-xs text-stone-500" id="chat-hint">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
```

### Agent Selection Accessibility

```tsx
// Agent cards as a selectable grid
function AgentSelectionGrid({ agents, selectedId, onSelect }: AgentSelectionProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Select an AI agent"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3"
    >
      {agents.map((agent) => (
        <button
          key={agent.id}
          role="radio"
          aria-checked={agent.id === selectedId}
          aria-label={`${agent.name} — ${agent.description}. ${agent.tier} tier.`}
          onClick={() => onSelect(agent.id)}
          className={cn(
            "rounded-xl border p-4 text-left transition-colors",
            "focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-900",
            agent.id === selectedId
              ? "border-amber-500 bg-amber-500/10"
              : "border-stone-800 hover:border-stone-600"
          )}
        >
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-full bg-stone-700 flex items-center justify-center"
              aria-hidden="true"
            >
              <span className="text-sm text-stone-300">{agent.name[0]}</span>
            </div>
            <div>
              <span className="block text-sm font-medium text-stone-100">
                {agent.name}
              </span>
              <span className="block text-xs text-stone-400">{agent.tier}</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-stone-400 line-clamp-2">
            {agent.description}
          </p>
        </button>
      ))}
    </div>
  );
}
```

### Sidebar Navigation Accessibility

```tsx
function SidebarNav({ items, currentPath }: { items: NavItem[]; currentPath: string }) {
  return (
    <nav aria-label="Main navigation">
      <ul role="list" className="space-y-1">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={currentPath === item.href ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                "focus-visible:ring-2 focus-visible:ring-amber-500",
                currentPath === item.href
                  ? "bg-stone-800 text-amber-500"
                  : "text-stone-400 hover:bg-stone-800/50 hover:text-stone-200"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className="ml-auto rounded-full bg-amber-500/10 px-2 py-0.5 text-xs text-amber-500"
                  aria-label={`${item.badge} new items`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
```

### Emote Picker Accessibility

```tsx
function EmotePicker({
  emotes,
  onSelect,
  isOpen,
  onClose,
}: EmotePickerProps) {
  const { containerRef, handleKeyDown } = useFocusTrap(isOpen);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={containerRef}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-label="Select an emote"
          aria-modal="true"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="rounded-xl border border-stone-700 bg-stone-900 p-4 shadow-xl"
        >
          <div
            role="grid"
            aria-label="Emotes"
            className="grid grid-cols-6 gap-2"
          >
            {emotes.map((emote) => (
              <button
                key={emote.id}
                onClick={() => {
                  onSelect(emote);
                  onClose();
                }}
                aria-label={emote.name}
                className="rounded-lg p-2 hover:bg-stone-800 focus-visible:ring-2 focus-visible:ring-amber-500"
              >
                <img
                  src={emote.url}
                  alt=""
                  aria-hidden="true"
                  className="h-8 w-8"
                />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

---

## WCAG Compliance Checklist

### Perceivable

- [ ] All images have meaningful `alt` text (or `alt=""` for decorative)
- [ ] Color is not the sole indicator of meaning
- [ ] Text contrast meets 4.5:1 (normal) or 3:1 (large)
- [ ] UI component contrast meets 3:1
- [ ] Content is readable at 200% zoom
- [ ] No information is conveyed only through sensory characteristics (color, shape, position)
- [ ] Audio/video has captions or transcripts (if applicable)

### Operable

- [ ] All functionality available via keyboard
- [ ] No keyboard traps (except modals with intentional focus trap)
- [ ] Focus indicators visible on all interactive elements
- [ ] Skip navigation link present
- [ ] Page titles are descriptive and unique
- [ ] Focus order is logical
- [ ] No content flashes more than 3 times per second
- [ ] Users can pause, stop, or hide auto-updating content
- [ ] Touch targets are at least 44x44px on mobile

### Understandable

- [ ] `<html lang="en">` attribute set
- [ ] Form labels associated with inputs
- [ ] Error messages are specific and helpful
- [ ] Required fields are indicated (not just by color)
- [ ] Navigation is consistent across pages
- [ ] No unexpected context changes on focus or input

### Robust

- [ ] Valid HTML (no duplicate IDs, proper nesting)
- [ ] ARIA attributes used correctly
- [ ] Custom widgets follow WAI-ARIA authoring practices
- [ ] Status messages use `aria-live` or `role="status"`
- [ ] Works with screen readers (NVDA, VoiceOver, JAWS)

---

*Stone AI Palace USB Package — Frontend Engineering Seed*
*Accessibility & WCAG Patterns v1.0*
