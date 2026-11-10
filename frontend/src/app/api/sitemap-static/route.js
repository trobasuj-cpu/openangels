export const dynamic = 'force-dynamic';
import { absoluteUrl } from '@/seo';

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

const STATIC_LASTMOD = '2026-11-09T12:00:00.000Z';

export async function GET() {
  const staticPages = [
    '/',
    '/directory',
    ...LETTERS.map((l) => `/directory/${l}`),
    '/contact',
    '/privacy',
    '/terms',
    '/gdpr',
    '/refund',
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(path => `  <url>
    <loc>${absoluteUrl(path)}</loc>
    <lastmod>${STATIC_LASTMOD}</lastmod>
    <changefreq>${path === '/' ? 'daily' : 'weekly'}</changefreq>
    <priority>${path === '/' ? '1.0' : path.startsWith('/directory') ? '0.9' : '0.7'}</priority>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
