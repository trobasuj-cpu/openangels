import { withSentryConfig } from "@sentry/nextjs/config";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/sitemap.xml', destination: '/api/sitemap-root' },
      { source: '/sitemap-index.xml', destination: '/api/sitemap-root' },
      { source: '/sitemap-static.xml', destination: '/api/sitemap-static' },
      { source: '/sitemap-1.xml', destination: '/api/sitemap-1' },
      { source: '/sitemap-2.xml', destination: '/api/sitemap-2' },
      { source: '/sitemap-3.xml', destination: '/api/sitemap-3' },
      { source: '/sitemap-4.xml', destination: '/api/sitemap-4' },
      { source: '/sitemap-5.xml', destination: '/api/sitemap/5' },
      { source: '/sitemap-6.xml', destination: '/api/sitemap/6' },
      { source: '/sitemap-7.xml', destination: '/api/sitemap/7' },
      { source: '/sitemap-8.xml', destination: '/api/sitemap/8' },
      { source: '/sitemap-9.xml', destination: '/api/sitemap/9' },
      { source: '/sitemap-10.xml', destination: '/api/sitemap/10' },
      { source: '/sitemap-:page(\\d+).xml', destination: '/api/sitemap/:page' },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: "beatsprom",
  project: "openangels",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  hideSourceMaps: true,
});
