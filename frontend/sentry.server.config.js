// Server-side Sentry tracing is intentionally disabled on Cloudflare Workers Free Tier
// to preserve the 10ms per-invocation CPU budget during SSR and API execution.
// Client-side error capture remains active in sentry.client.config.js.
export {};
