import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Capture 100% of errors
  sampleRate: 1.0,

  // Capture 10% of transactions in production
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Only enable when DSN is set
  enabled: !!(process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN),

  environment: process.env.NODE_ENV,
});
