import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "https://deac8030caffb32e27edcbc0cc5a513b@o4512043944116224.ingest.us.sentry.io/4512043957944320",

  // Sample only 5% of client traces to keep browser overhead light
  tracesSampleRate: 0.05,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
