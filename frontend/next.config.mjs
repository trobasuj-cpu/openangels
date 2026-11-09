import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rjdewjyhtbfkujhvkwig.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ial7j5MzK6ni3y-Y8YszGg_7ZeV-2D3',
  },
  async rewrites() {
    return [
      { source: '/sitemap.xml', destination: '/api/sitemap-root' },
      { source: '/sitemap-index.xml', destination: '/api/sitemap-root' },
      { source: '/sitemap_index.xml', destination: '/api/sitemap-root' },
      // Fresh URL never seen by Google Search Console (bypasses stale "Couldn't fetch" state from the Vercel 402 outage)
      { source: '/sitemap-main.xml', destination: '/api/sitemap-root' },
      { source: '/sitemap-static.xml', destination: '/api/sitemap-static' },
      { source: '/sitemap-hubs.xml', destination: '/api/sitemap-hubs' },
      { source: '/sitemap-companies.xml', destination: '/api/sitemap-companies' },
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
      { source: '/sitemap-11.xml', destination: '/api/sitemap/11' },
      { source: '/sitemap-12.xml', destination: '/api/sitemap/12' },
      { source: '/sitemap-:page(\\d+).xml', destination: '/api/sitemap/:page' },
    ];
  },
};

export default nextConfig;
