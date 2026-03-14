import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 100% of errors
  sampleRate: 1.0,

  // Capture 10% of transactions in production for performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Replay is off by default — enable when needed
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Only enable in production when DSN is set
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment tag
  environment: process.env.NODE_ENV,

  // Filter out common non-errors that pollute Sentry
  ignoreErrors: [
    // Browser extensions and third-party scripts
    "ResizeObserver loop",
    "ResizeObserver loop completed with undelivered notifications",
    // Chunk loading failures (network issues, deployments)
    "ChunkLoadError",
    "Loading chunk",
    "Failed to fetch dynamically imported module",
    // Browser navigation aborts
    "AbortError",
    "The operation was aborted",
    "cancelled",
    // Network errors that aren't actionable
    "NetworkError",
    "Network request failed",
    "Load failed",
    // Next.js hydration (usually benign)
    "Hydration failed",
    "There was an error while hydrating",
    "Minified React error #418",
    "Minified React error #423",
  ],

  denyUrls: [
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
    /^moz-extension:\/\//i,
  ],

  beforeSend(event) {
    // Drop events without a DSN (safety net)
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) return null;
    return event;
  },
});
