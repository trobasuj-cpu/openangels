// Edge-runtime Sentry tracing is intentionally disabled on Cloudflare Workers Free Tier
// to avoid OpenTelemetry instrumentation CPU overhead against the 10ms CPU limit.
export {};
