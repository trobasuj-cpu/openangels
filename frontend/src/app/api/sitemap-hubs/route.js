export const dynamic = 'force-dynamic';
import { absoluteUrl, INDUSTRY_PAGES, STAGE_SLUGS, GEO_REGIONS, POPULAR_HUBS } from '@/seo';

export async function GET() {
  const hubs = new Set();

  // 1. All Industry Pages
  INDUSTRY_PAGES.forEach(page => {
    if (page?.slug) hubs.add(`/investors/${page.slug}`);
  });

  // 2. All Stages
  Object.keys(STAGE_SLUGS).forEach(stage => {
    hubs.add(`/investors/${stage}`);
  });

  // 3. All Geos
  Object.keys(GEO_REGIONS).forEach(geo => {
    hubs.add(`/investors/${geo}`);
  });

  // 4. Popular Multi-facet Hubs
  POPULAR_HUBS.forEach(hub => {
    if (hub?.filters && hub.filters.length > 0) {
      hubs.add(`/investors/${hub.filters.join('/')}`);
    }
  });

  const urls = Array.from(hubs).map(path => `  <url>
    <loc>${absoluteUrl(path)}</loc>
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
