import { INDEXABLE_ROUTES, absoluteUrl, INDUSTRY_PAGES, STAGE_SLUGS, GEO_REGIONS, POPULAR_HUBS } from '@/seo';

export async function GET() {
  const staticRoutes = INDEXABLE_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: new Date(route.lastmod).toISOString(),
    changeFrequency: route.changefreq,
    priority: parseFloat(route.priority),
  }));

  const hubRoutes = [];
  const stages = Object.keys(STAGE_SLUGS);
  const geos = Object.keys(GEO_REGIONS);

  for (const industry of INDUSTRY_PAGES) {
    for (const stage of stages) {
      hubRoutes.push({
        url: absoluteUrl(`/investors/${industry.slug}/${stage}`),
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
    for (const geo of geos.slice(0, 8)) {
      hubRoutes.push({
        url: absoluteUrl(`/investors/${industry.slug}/${geo}`),
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  }

  for (const hub of POPULAR_HUBS) {
    hubRoutes.push({
      url: absoluteUrl(`/investors/${hub.filters.join('/')}`),
      lastModified: new Date().toISOString(),
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  const allRoutes = [...staticRoutes, ...hubRoutes];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allRoutes
    .map(
      (route) => `
  <url>
    <loc>${route.url}</loc>
    <lastmod>${route.lastModified}</lastmod>
    <changefreq>${route.changeFrequency}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
    )
    .join('')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate',
    },
  });
}
