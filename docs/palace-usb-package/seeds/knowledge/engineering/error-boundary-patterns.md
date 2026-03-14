# Error Boundary Patterns — Deep Knowledge Seed

## Overview

Every app breaks. The question is whether it breaks gracefully or catastrophically. This seed covers every error handling pattern in React and Next.js 16 App Router: class-based error boundaries, the error.tsx convention, global errors, not-found pages, loading states, Suspense boundaries, recovery patterns, error logging, and graceful degradation. Every pattern includes full TypeScript code.

---

## Table of Contents

1. [React Error Boundaries (Class Component)](#react-error-boundaries)
2. [Next.js error.tsx Convention](#nextjs-errortsx-convention)
3. [Global Error Handling](#global-error-handling)
4. [Route-Level Error Boundaries](#route-level-error-boundaries)
5. [Error Recovery Patterns](#error-recovery-patterns)
6. [Not-Found Handling](#not-found-handling)
7. [Loading States and Suspense](#loading-states-and-suspense)
8. [Error Logging and Reporting](#error-logging-and-reporting)
9. [Graceful Degradation](#graceful-degradation)
10. [User-Friendly Error Messages](#user-friendly-error-messages)
11. [Complete Error Architecture](#complete-error-architecture)

---

## React Error Boundaries

Error boundaries are the ONLY way to catch rendering errors in React. They must be class components — there is no hook equivalent.

### Basic Error Boundary

```typescript
// src/components/error-boundary.tsx
'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    // Call the optional error handler
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30
                          flex items-center justify-center mb-4">
            <AlertCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-500 mb-4">
            This component encountered an error and could not render.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm
                       font-medium hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Error Boundary with Reset Key

```typescript
// src/components/resettable-error-boundary.tsx
'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackRender: (props: {
    error: Error;
    resetErrorBoundary: () => void;
  }) => ReactNode;
  onReset?: () => void;
  resetKeys?: unknown[];
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ResettableErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidUpdate(prevProps: Props): void {
    // Reset when resetKeys change (e.g., when route changes)
    if (this.state.hasError && this.props.resetKeys) {
      const hasChanged = this.props.resetKeys.some(
        (key, i) => key !== prevProps.resetKeys?.[i]
      );
      if (hasChanged) {
        this.reset();
      }
    }
  }

  reset = (): void => {
    this.props.onReset?.();
    this.setState({ hasError: false, error: null });
  };

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ResettableErrorBoundary]', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      return this.props.fallbackRender({
        error: this.state.error,
        resetErrorBoundary: this.reset,
      });
    }

    return this.props.children;
  }
}

// Usage:
function ChatPage({ conversationId }: { conversationId: string }) {
  return (
    <ResettableErrorBoundary
      resetKeys={[conversationId]} // Reset when conversation changes
      fallbackRender={({ error, resetErrorBoundary }) => (
        <ErrorCard
          title="Chat Error"
          message={error.message}
          onRetry={resetErrorBoundary}
        />
      )}
    >
      <ChatMessages conversationId={conversationId} />
    </ResettableErrorBoundary>
  );
}
```

### What Error Boundaries DON'T Catch

```typescript
// Error boundaries catch:
// ✅ Errors during rendering
// ✅ Errors in lifecycle methods
// ✅ Errors in constructors of child components

// Error boundaries DO NOT catch:
// ❌ Event handlers (use try/catch)
// ❌ Async code (promises, setTimeout)
// ❌ Server-side rendering errors
// ❌ Errors in the error boundary itself

// For event handlers, use try/catch:
function SendButton() {
  const handleClick = async () => {
    try {
      await sendMessage();
    } catch (error) {
      // Handle error — show toast, update state, etc.
      toast.error('Failed to send message');
    }
  };

  return <button onClick={handleClick}>Send</button>;
}
```

---

## Next.js error.tsx Convention

Next.js App Router has a built-in error boundary system. Place an `error.tsx` file in any route segment to catch errors in that segment and below.

### Basic error.tsx

```typescript
// src/app/chat/error.tsx
'use client'; // error.tsx MUST be a Client Component

import { useEffect } from 'react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ChatError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to your error reporting service
    console.error('[Chat Error]', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-100
                        dark:bg-red-900/30 flex items-center justify-center">
          <MessageSquareOffIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>

        <h1 className="text-2xl font-bold mb-2">Chat Unavailable</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          We couldn&apos;t load this conversation. This might be a temporary issue.
        </p>

        {/* Show error digest in development */}
        {process.env.NODE_ENV === 'development' && (
          <pre className="text-left text-xs bg-gray-100 dark:bg-gray-800
                          p-4 rounded-lg mb-6 overflow-x-auto">
            {error.message}
            {error.digest && `\nDigest: ${error.digest}`}
          </pre>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white
                       font-medium hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
          <a
            href="/chat"
            className="px-6 py-2.5 rounded-lg border font-medium
                       hover:bg-gray-50 dark:hover:bg-gray-800
                       transition-colors"
          >
            Back to Chat
          </a>
        </div>
      </div>
    </div>
  );
}
```

### How error.tsx Works

```
src/app/chat/
├── layout.tsx    ← NOT caught by error.tsx (parent layout)
├── error.tsx     ← Catches errors from page.tsx and below
├── page.tsx      ← Errors here ARE caught
└── [id]/
    ├── page.tsx  ← Errors here ARE caught by parent error.tsx
    └── error.tsx ← More specific: catches errors in [id]/page.tsx

Boundary hierarchy:
  layout.tsx
    └── error.tsx (boundary)
          └── page.tsx
                └── child components

KEY: error.tsx catches errors in its SIBLING page.tsx and all
     DESCENDANT routes. It does NOT catch errors in its PARENT
     layout.tsx — you need a higher error.tsx or global-error.tsx.
```

### error.tsx with Different Error Types

```typescript
// src/app/agents/error.tsx
'use client';

import { useEffect } from 'react';

export default function AgentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Agents Error]', error);
  }, [error]);

  // Detect error type and show appropriate message
  const errorType = getErrorType(error);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
      <div className="max-w-md text-center">
        {errorType === 'network' && (
          <>
            <WifiOffIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h1 className="text-xl font-bold mb-2">Connection Issue</h1>
            <p className="text-gray-500 mb-6">
              Check your internet connection and try again.
            </p>
          </>
        )}

        {errorType === 'auth' && (
          <>
            <LockIcon className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
            <h1 className="text-xl font-bold mb-2">Access Denied</h1>
            <p className="text-gray-500 mb-6">
              You don&apos;t have permission to view these agents.
              Please upgrade your plan.
            </p>
          </>
        )}

        {errorType === 'unknown' && (
          <>
            <AlertTriangleIcon className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h1 className="text-xl font-bold mb-2">Something Went Wrong</h1>
            <p className="text-gray-500 mb-6">
              We&apos;re looking into it. Please try again in a moment.
            </p>
          </>
        )}

        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-lg bg-blue-600 text-white
                     font-medium hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

function getErrorType(error: Error): 'network' | 'auth' | 'unknown' {
  if (error.message.includes('fetch') || error.message.includes('network')) {
    return 'network';
  }
  if (error.message.includes('unauthorized') || error.message.includes('403')) {
    return 'auth';
  }
  return 'unknown';
}
```

---

## Global Error Handling

### global-error.tsx

Catches errors in the root layout itself. This is the last line of defense.

```typescript
// src/app/global-error.tsx
'use client';

/**
 * global-error.tsx catches errors in the ROOT layout.
 * It REPLACES the entire <html> tree when triggered,
 * so it must include <html> and <body> tags.
 *
 * This is the absolute last resort — if this renders,
 * something fundamental broke.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <div className="max-w-lg text-center">
            {/* Inline SVG — no external dependencies, this is a crash page */}
            <svg
              className="w-20 h-20 mx-auto mb-6 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9
                   3.75h.008v.008H12v-.008z"
              />
            </svg>

            <h1 className="text-3xl font-bold mb-3">
              Critical Error
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
              Stone AI encountered a critical error. Our team has been notified.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <pre className="text-left text-xs bg-red-50 dark:bg-red-950
                              text-red-800 dark:text-red-200 p-4 rounded-lg
                              mb-8 overflow-x-auto max-h-48">
                {error.message}
                {'\n\n'}
                {error.stack}
              </pre>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={reset}
                className="px-8 py-3 rounded-lg bg-blue-600 text-white
                           font-semibold hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <a
                href="/"
                className="px-8 py-3 rounded-lg border border-gray-300
                           dark:border-gray-700 font-semibold
                           hover:bg-gray-50 dark:hover:bg-gray-800
                           transition-colors"
              >
                Go Home
              </a>
            </div>

            <p className="mt-8 text-sm text-gray-400">
              If this keeps happening, contact support at help@stone-ai.net
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
```

### Error Boundary Hierarchy

```
global-error.tsx          ← Catches root layout errors
└── src/app/layout.tsx
    └── error.tsx         ← Catches root page errors
        └── src/app/page.tsx
        └── src/app/chat/
            └── error.tsx ← Catches chat errors
                └── page.tsx
                └── [id]/
                    └── error.tsx ← Most specific
                        └── page.tsx

Strategy: Place error.tsx at EVERY major route segment.
The more specific the error boundary, the less the user loses.
```

---

## Route-Level Error Boundaries

### Per-Feature Error Boundaries

```typescript
// Place error.tsx in each major feature route:

// src/app/chat/error.tsx       — Chat-specific errors
// src/app/agents/error.tsx     — Agent browsing errors
// src/app/forum/error.tsx      — Forum errors
// src/app/settings/error.tsx   — Settings errors
// src/app/admin/error.tsx      — Admin panel errors
// src/app/bestie/error.tsx     — Bestie feature errors

// Each can have a different tone, different recovery actions,
// and different error categorization.
```

### Admin Error Page (Extra Detail)

```typescript
// src/app/admin/error.tsx
'use client';

import { useEffect, useState } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error('[Admin Error]', error);
    // Admin errors get extra logging
    reportAdminError(error);
  }, [error]);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="rounded-xl border-2 border-red-200 dark:border-red-800
                      bg-red-50 dark:bg-red-950/30 p-6">
        <h2 className="text-lg font-bold text-red-800 dark:text-red-300 mb-2">
          Admin Panel Error
        </h2>
        <p className="text-red-700 dark:text-red-400 mb-4">
          An error occurred in the admin panel.
        </p>

        {/* Always show details for admins */}
        <div className="space-y-2 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
            <p className="text-sm font-mono">
              <span className="text-gray-500">Error: </span>
              {error.message}
            </p>
            {error.digest && (
              <p className="text-sm font-mono mt-1">
                <span className="text-gray-500">Digest: </span>
                {error.digest}
              </p>
            )}
          </div>

          {showDetails && error.stack && (
            <pre className="bg-white dark:bg-gray-900 rounded-lg p-4
                            text-xs font-mono overflow-x-auto max-h-64">
              {error.stack}
            </pre>
          )}

          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm text-red-600 dark:text-red-400 underline"
          >
            {showDetails ? 'Hide' : 'Show'} stack trace
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-red-600 text-white
                       text-sm font-medium hover:bg-red-700"
          >
            Retry
          </button>
          <a
            href="/admin"
            className="px-4 py-2 rounded-lg border border-red-300
                       dark:border-red-700 text-sm font-medium
                       hover:bg-red-100 dark:hover:bg-red-900/30"
          >
            Admin Home
          </a>
        </div>
      </div>
    </div>
  );
}

async function reportAdminError(error: Error & { digest?: string }) {
  try {
    await fetch('/api/admin/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        digest: error.digest,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      }),
    });
  } catch {
    // Don't throw from error reporting
  }
}
```

---

## Error Recovery Patterns

### Reset (Re-render the Component Tree)

```typescript
// The `reset` function from error.tsx re-renders the error boundary's children.
// It does NOT re-fetch data — just attempts to render again.
// Works when errors are transient (race conditions, timing issues).

export default function ChatError({ error, reset }: ErrorPageProps) {
  return (
    <button onClick={reset}>
      Try Again
    </button>
  );
}
```

### Retry with Fresh Data

```typescript
// src/app/dashboard/error.tsx
'use client';

import { useRouter } from 'next/navigation';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  const handleRetry = () => {
    // Clear client-side cache + re-render
    router.refresh(); // Forces server-side re-fetch
    reset();          // Re-renders the boundary
  };

  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-bold mb-4">Dashboard Error</h2>
      <button onClick={handleRetry} className="px-6 py-2 bg-blue-600 text-white rounded-lg">
        Retry with Fresh Data
      </button>
    </div>
  );
}
```

### Auto-Retry with Countdown

```typescript
// src/components/auto-retry-error.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';

interface AutoRetryErrorProps {
  error: Error;
  reset: () => void;
  maxRetries?: number;
  retryDelayMs?: number;
}

export function AutoRetryError({
  error,
  reset,
  maxRetries = 3,
  retryDelayMs = 3000,
}: AutoRetryErrorProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [countdown, setCountdown] = useState(Math.ceil(retryDelayMs / 1000));

  const doRetry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
    reset();
  }, [reset]);

  useEffect(() => {
    if (retryCount >= maxRetries) return;

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          doRetry();
          return Math.ceil(retryDelayMs / 1000);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [retryCount, maxRetries, retryDelayMs, doRetry]);

  if (retryCount >= maxRetries) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold mb-2">Unable to Load</h2>
        <p className="text-gray-500 mb-4">
          Failed after {maxRetries} attempts. Please try again later.
        </p>
        <button
          onClick={() => {
            setRetryCount(0);
            setCountdown(Math.ceil(retryDelayMs / 1000));
            reset();
          }}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg"
        >
          Try Again Manually
        </button>
      </div>
    );
  }

  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-bold mb-2">Loading Error</h2>
      <p className="text-gray-500 mb-2">
        Retrying in {countdown}s... (attempt {retryCount + 1}/{maxRetries})
      </p>
      <div className="w-48 mx-auto h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 transition-all duration-1000"
          style={{
            width: `${((Math.ceil(retryDelayMs / 1000) - countdown) / Math.ceil(retryDelayMs / 1000)) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
```

### Fallback to Cached Data

```typescript
// src/components/cached-fallback.tsx
'use client';

import { useQueryClient } from '@tanstack/react-query';

export function CachedFallback({
  queryKey,
  error,
  reset,
  children,
}: {
  queryKey: readonly unknown[];
  error: Error;
  reset: () => void;
  children: (data: unknown) => React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const cachedData = queryClient.getQueryData(queryKey);

  if (cachedData) {
    return (
      <div>
        {/* Banner warning that data may be stale */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border
                        border-yellow-200 dark:border-yellow-800
                        rounded-lg p-3 mb-4 flex items-center gap-2">
          <AlertTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0" />
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Showing cached data. Some information may be outdated.
          </p>
          <button
            onClick={reset}
            className="ml-auto text-sm font-medium text-yellow-700
                       dark:text-yellow-300 underline"
          >
            Retry
          </button>
        </div>

        {/* Render the cached data */}
        {children(cachedData)}
      </div>
    );
  }

  // No cached data — show full error
  return (
    <div className="p-8 text-center">
      <h2 className="text-xl font-bold mb-4">Unable to Load</h2>
      <p className="text-gray-500 mb-4">{error.message}</p>
      <button onClick={reset} className="px-6 py-2 bg-blue-600 text-white rounded-lg">
        Try Again
      </button>
    </div>
  );
}
```

---

## Not-Found Handling

### not-found.tsx

```typescript
// src/app/not-found.tsx
// Catches navigation to non-existent routes
// Also triggered by calling notFound() from a Server Component

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="max-w-md text-center">
        {/* Large 404 */}
        <p className="text-8xl font-black text-gray-200 dark:text-gray-800 mb-4">
          404
        </p>

        <h1 className="text-2xl font-bold mb-2">Page Not Found</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-6 py-2.5 rounded-lg bg-blue-600 text-white
                       font-medium hover:bg-blue-700 transition-colors"
          >
            Go Home
          </Link>
          <Link
            href="/help"
            className="px-6 py-2.5 rounded-lg border font-medium
                       hover:bg-gray-50 dark:hover:bg-gray-800
                       transition-colors"
          >
            Help Center
          </Link>
        </div>
      </div>
    </div>
  );
}
```

### Programmatic notFound()

```typescript
// src/app/agents/[id]/page.tsx
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function AgentPage({ params }: { params: { id: string } }) {
  const agent = await prisma.agent.findUnique({
    where: { id: params.id },
  });

  // This triggers the nearest not-found.tsx boundary
  if (!agent) {
    notFound();
  }

  return <AgentDetail agent={agent} />;
}
```

### Route-Specific not-found.tsx

```typescript
// src/app/agents/not-found.tsx
// More specific 404 for the agents section
import Link from 'next/link';

export default function AgentNotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gray-100
                        dark:bg-gray-800 flex items-center justify-center">
          <SearchIcon className="w-8 h-8 text-gray-400" />
        </div>

        <h1 className="text-xl font-bold mb-2">Agent Not Found</h1>
        <p className="text-gray-500 mb-6">
          This agent doesn&apos;t exist or may not be available on your plan.
        </p>

        <Link
          href="/agents"
          className="px-6 py-2.5 rounded-lg bg-blue-600 text-white
                     font-medium hover:bg-blue-700 transition-colors"
        >
          Browse All Agents
        </Link>
      </div>
    </div>
  );
}
```

---

## Loading States and Suspense

### loading.tsx Convention

```typescript
// src/app/chat/loading.tsx
// Shown automatically while page.tsx is loading (server rendering)

export default function ChatLoading() {
  return (
    <div className="flex h-full">
      {/* Sidebar skeleton */}
      <div className="hidden lg:block w-80 border-r p-4 space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200
                            dark:bg-gray-800 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800
                              rounded animate-pulse" />
              <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-800
                              rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      {/* Main area skeleton */}
      <div className="flex-1 flex flex-col p-4 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`h-16 rounded-2xl bg-gray-200 dark:bg-gray-800
                          animate-pulse ${i % 2 === 0 ? 'w-2/3' : 'w-1/2'}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Suspense Boundaries

```typescript
// src/app/dashboard/page.tsx
import { Suspense } from 'react';

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Each section loads independently */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Suspense fallback={<StatCardSkeleton />}>
          <ConversationStats />
        </Suspense>
        <Suspense fallback={<StatCardSkeleton />}>
          <MessageStats />
        </Suspense>
        <Suspense fallback={<StatCardSkeleton />}>
          <ReferralStats />
        </Suspense>
      </div>

      {/* Activity feed loads independently from stats */}
      <Suspense fallback={<ActivityFeedSkeleton />}>
        <RecentActivity />
      </Suspense>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="p-6 rounded-xl border bg-white dark:bg-gray-900 animate-pulse">
      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded mb-3" />
      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
    </div>
  );
}

function ActivityFeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3 p-4 rounded-lg border animate-pulse">
          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-800 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Nested Loading and Error Boundaries

```typescript
// Hierarchy:
// layout.tsx
// ├── loading.tsx  (shows while page loads)
// ├── error.tsx    (shows if page throws)
// └── page.tsx
//     └── <Suspense fallback={...}>
//         └── <ErrorBoundary fallback={...}>
//             └── <AsyncComponent />

// Inner Suspense + ErrorBoundary for granular control:
function DashboardSection() {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 rounded-lg bg-red-50 text-red-700 text-sm">
          This section failed to load.
        </div>
      }
    >
      <Suspense fallback={<SectionSkeleton />}>
        <AsyncDashboardWidget />
      </Suspense>
    </ErrorBoundary>
  );
}
```

---

## Error Logging and Reporting

### Client-Side Error Logger

```typescript
// src/lib/error-logger.ts

interface ErrorReport {
  message: string;
  stack?: string;
  digest?: string;
  componentStack?: string;
  url: string;
  timestamp: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}

class ErrorLogger {
  private queue: ErrorReport[] = [];
  private flushTimer: ReturnType<typeof setTimeout> | null = null;

  report(error: Error & { digest?: string }, metadata?: Record<string, unknown>) {
    const report: ErrorReport = {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      url: typeof window !== 'undefined' ? window.location.href : 'server',
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.queue.push(report);

    // Batch errors — flush every 5 seconds or when queue hits 10
    if (this.queue.length >= 10) {
      this.flush();
    } else if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flush(), 5000);
    }
  }

  private async flush() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    if (this.queue.length === 0) return;

    const batch = [...this.queue];
    this.queue = [];

    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors: batch }),
        // Use keepalive so the request survives page navigation
        keepalive: true,
      });
    } catch {
      // Put errors back in queue if reporting fails
      this.queue.unshift(...batch);
    }
  }
}

export const errorLogger = new ErrorLogger();
```

### Global Window Error Handlers

```typescript
// src/components/global-error-handler.tsx
'use client';

import { useEffect } from 'react';
import { errorLogger } from '@/lib/error-logger';

export function GlobalErrorHandler() {
  useEffect(() => {
    // Catch unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      errorLogger.report(
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason)),
        { type: 'unhandledRejection' }
      );
    };

    // Catch uncaught errors that escape error boundaries
    const handleError = (event: ErrorEvent) => {
      errorLogger.report(
        event.error instanceof Error
          ? event.error
          : new Error(event.message),
        {
          type: 'uncaughtError',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      );
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return null; // This component renders nothing
}

// Add to root layout:
// <GlobalErrorHandler />
```

### Server-Side Error Logging API

```typescript
// src/app/api/errors/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const ErrorReportSchema = z.object({
  errors: z.array(
    z.object({
      message: z.string(),
      stack: z.string().optional(),
      digest: z.string().optional(),
      componentStack: z.string().optional(),
      url: z.string(),
      timestamp: z.string(),
      userId: z.string().optional(),
      metadata: z.record(z.unknown()).optional(),
    })
  ),
}).strict();

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = ErrorReportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    for (const error of parsed.data.errors) {
      console.error(`[Client Error] ${error.message}`, error);
    }
  }

  // In production, send to your error tracking service
  // Example: Sentry, LogRocket, etc.
  // await sendToSentry(parsed.data.errors);

  // Or store in database for admin panel review
  if (parsed.data.errors.length > 0) {
    try {
      await prisma.errorLog.createMany({
        data: parsed.data.errors.map((e) => ({
          message: e.message,
          stack: e.stack,
          digest: e.digest,
          url: e.url,
          metadata: e.metadata as any,
          createdAt: new Date(e.timestamp),
        })),
      });
    } catch (dbError) {
      console.error('[Error Logger] Failed to write to DB:', dbError);
    }
  }

  return NextResponse.json({ received: parsed.data.errors.length });
}
```

---

## Graceful Degradation

### Feature Fallbacks

```typescript
// src/components/chat/ai-suggestions.tsx
'use client';

import { useState, useEffect } from 'react';

/**
 * AI-powered suggestions that gracefully degrade if the AI service is down.
 * Users still get a functional (but less magical) experience.
 */
export function AISuggestions({ context }: { context: string }) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchSuggestions() {
      try {
        const res = await fetch('/api/ai/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ context }),
          signal: AbortSignal.timeout(5000), // 5s timeout
        });

        if (!res.ok) throw new Error('AI service unavailable');
        const data = await res.json();

        if (!cancelled) {
          setSuggestions(data.suggestions);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          // Fall back to static suggestions
          setSuggestions([
            'Tell me more about that.',
            'What can you help me with?',
            'Show me an example.',
          ]);
        }
      }
    }

    fetchSuggestions();
    return () => { cancelled = true; };
  }, [context]);

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {suggestions.map((suggestion, i) => (
        <button
          key={i}
          className="flex-shrink-0 px-3 py-1.5 rounded-full border text-sm
                     hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          {suggestion}
        </button>
      ))}
      {error && (
        <span className="text-xs text-gray-400 self-center ml-1">
          (default suggestions)
        </span>
      )}
    </div>
  );
}
```

### Progressive Enhancement

```typescript
// src/components/forum/rich-editor.tsx
'use client';

import { lazy, Suspense, useState } from 'react';

// Heavy editor loaded lazily — falls back to textarea if it fails
const RichEditor = lazy(() =>
  import('./rich-editor-impl').catch(() => ({
    default: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-48 p-4 rounded-lg border resize-y font-mono text-sm"
        placeholder="Write your post (plain text mode)..."
      />
    ),
  }))
);

export function ForumEditor() {
  const [content, setContent] = useState('');

  return (
    <Suspense
      fallback={
        <textarea
          className="w-full h-48 p-4 rounded-lg border resize-y font-mono text-sm
                     animate-pulse"
          placeholder="Loading editor..."
          disabled
        />
      }
    >
      <RichEditor value={content} onChange={setContent} />
    </Suspense>
  );
}
```

---

## User-Friendly Error Messages

### Error Message Guidelines

```typescript
// src/lib/error-messages.ts

/**
 * Error message principles:
 * 1. NEVER expose technical details to users in production
 * 2. Be specific about what went wrong (not "something went wrong")
 * 3. Tell the user what to DO next
 * 4. Keep it human — no error codes, no jargon
 * 5. Offer a way out (back button, retry, support link)
 */

const ERROR_MESSAGES: Record<string, { title: string; message: string; action: string }> = {
  'CHAT_SEND_FAILED': {
    title: 'Message Not Sent',
    message: 'Your message couldn\'t be delivered. Check your connection and try again.',
    action: 'Retry',
  },
  'AGENT_UNAVAILABLE': {
    title: 'Agent Busy',
    message: 'This agent is currently handling a lot of requests. Try again in a moment.',
    action: 'Try Again',
  },
  'TIER_RESTRICTED': {
    title: 'Feature Locked',
    message: 'This feature is available on a higher plan. Upgrade to unlock it.',
    action: 'View Plans',
  },
  'SESSION_EXPIRED': {
    title: 'Session Expired',
    message: 'Your session has expired. Please sign in again to continue.',
    action: 'Sign In',
  },
  'RATE_LIMITED': {
    title: 'Slow Down',
    message: 'You\'re sending too many requests. Please wait a moment.',
    action: 'OK',
  },
  'FILE_TOO_LARGE': {
    title: 'File Too Large',
    message: 'The file you selected exceeds the size limit. Please choose a smaller file.',
    action: 'Choose Another',
  },
  'NETWORK_ERROR': {
    title: 'Connection Lost',
    message: 'Can\'t reach our servers. Check your internet connection.',
    action: 'Retry',
  },
  'GENERIC': {
    title: 'Something Went Wrong',
    message: 'We hit an unexpected issue. Our team has been notified.',
    action: 'Try Again',
  },
};

export function getUserFriendlyError(errorCode: string) {
  return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES['GENERIC'];
}
```

### Error Toast Component

```typescript
// src/components/ui/error-toast.tsx
'use client';

import { useEffect, useState } from 'react';

interface ErrorToastProps {
  title: string;
  message: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
  onDismiss: () => void;
}

export function ErrorToast({
  title,
  message,
  action,
  duration = 5000,
  onDismiss,
}: ErrorToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // Wait for exit animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onDismiss]);

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-sm w-full
        bg-white dark:bg-gray-900 rounded-xl shadow-lg border
        border-red-200 dark:border-red-800 p-4
        transition-all duration-300
        ${isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-2'
        }`}
      role="alert"
    >
      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30
                        flex items-center justify-center flex-shrink-0">
          <AlertCircleIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {message}
          </p>
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 text-sm font-medium text-blue-600
                         dark:text-blue-400 hover:underline"
            >
              {action.label}
            </button>
          )}
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onDismiss, 300);
          }}
          className="p-1 -mt-1 -mr-1 rounded hover:bg-gray-100
                     dark:hover:bg-gray-800"
          aria-label="Dismiss"
        >
          <XIcon className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}
```

---

## Complete Error Architecture

### Recommended File Structure

```
src/app/
├── global-error.tsx          ← Root layout crashes
├── not-found.tsx             ← Unknown routes
├── error.tsx                 ← Root page errors
├── loading.tsx               ← Root loading state
├── chat/
│   ├── error.tsx             ← Chat errors
│   ├── loading.tsx           ← Chat loading skeleton
│   ├── not-found.tsx         ← Unknown conversation
│   └── [id]/
│       ├── error.tsx         ← Specific conversation errors
│       └── loading.tsx
├── agents/
│   ├── error.tsx
│   ├── loading.tsx
│   ├── not-found.tsx
│   └── [id]/
│       └── not-found.tsx     ← Specific agent not found
├── forum/
│   ├── error.tsx
│   └── loading.tsx
├── settings/
│   ├── error.tsx
│   └── loading.tsx
├── admin/
│   ├── error.tsx             ← Extra detail for admins
│   └── loading.tsx
└── api/
    └── errors/
        └── route.ts          ← Error reporting endpoint

src/components/
├── error-boundary.tsx        ← Reusable class-based boundary
├── global-error-handler.tsx  ← Window error/rejection catcher
└── ui/
    └── error-toast.tsx       ← Toast notification for errors

src/lib/
├── error-logger.ts           ← Client-side error batching
└── error-messages.ts         ← User-friendly message mapping
```

### Architecture Summary

```
Error Type           │ Handler                    │ User Experience
─────────────────────┼────────────────────────────┼─────────────────────
Render error         │ error.tsx / ErrorBoundary   │ Error card with retry
Root layout crash    │ global-error.tsx            │ Full-page error
Unknown route        │ not-found.tsx               │ 404 page
Missing resource     │ notFound()                  │ Contextual 404
Event handler error  │ try/catch + toast           │ Toast notification
Network error        │ React Query onError         │ Toast + cached fallback
API error            │ Status code + Zod parse     │ Form validation errors
Async/Promise error  │ GlobalErrorHandler          │ Logged silently
Loading delay        │ loading.tsx / Suspense      │ Skeleton/spinner
```

---

## Summary

1. **error.tsx at every route segment** — Granular error containment.
2. **global-error.tsx** — Last resort for root layout crashes. Must include `<html>` and `<body>`.
3. **Class-based ErrorBoundary** — For component-level error catching in client components.
4. **Reset vs router.refresh()** — `reset()` re-renders, `router.refresh()` re-fetches.
5. **notFound()** — Call it in Server Components when a resource is missing.
6. **Suspense + loading.tsx** — Show skeletons while server components load.
7. **Error logger** — Batch client errors and send to server for tracking.
8. **Graceful degradation** — Always have a fallback. AI unavailable? Show static suggestions.
9. **User-friendly messages** — Never show stack traces. Tell users what to DO.
10. **Test error states** — Throw errors intentionally in development to verify boundaries work.
