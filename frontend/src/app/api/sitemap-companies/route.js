export const dynamic = 'force-dynamic';
import { absoluteUrl } from '@/seo';
import { KNOWN_COMPANIES } from '@/lib/companyData';
import companiesCache from '@/lib/companies_cache.json';

export async function GET() {
  const companySlugs = new Set();

  if (KNOWN_COMPANIES) {
    Object.keys(KNOWN_COMPANIES).forEach(slug => companySlugs.add(slug.toLowerCase().trim()));
  }

  if (companiesCache) {
    Object.keys(companiesCache).forEach(slug => companySlugs.add(slug.toLowerCase().trim()));
  }

  const urls = Array.from(companySlugs).map(slug => `  <url>
    <loc>${absoluteUrl(`/company/${encodeURIComponent(slug)}`)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
