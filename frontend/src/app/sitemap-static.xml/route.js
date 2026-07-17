import { absoluteUrl } from '@/seo';
export async function GET() {
  const staticPages = [
    '', '/contact', '/privacy', '/terms', '/gdpr', '/refund',
    '/investors/all', '/investors/saas', '/investors/ai', '/investors/fintech',
    '/investors/healthtech', '/investors/ecommerce', '/investors/edtech',
    '/investors/cleantech', '/investors/web3', '/investors/deeptech',
    '/investors/b2b', '/investors/b2c', '/investors/marketplace',
    '/investors/hardware', '/investors/gaming', '/investors/usa',
    '/investors/europe', '/investors/uk', '/investors/asia',
    '/investors/latam', '/investors/mena', '/investors/pre-seed',
    '/investors/seed', '/investors/series-a', '/investors/series-b',
    '/investors/series-c'
  ];
  const allUrls = staticPages.map((route) => `
  <url>
    <loc>${absoluteUrl(route)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`).join('');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${allUrls}</urlset>`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate' },
  });
}
