import { INDEXABLE_ROUTES, absoluteUrl, INDUSTRY_PAGES, STAGE_SLUGS, GEO_REGIONS, POPULAR_HUBS } from '@/seo';
import { supabase } from '@/lib/supabase';

export const revalidate = 86400; // Cache for 24 hours

export default async function sitemap() {
  const staticRoutes = INDEXABLE_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: new Date(route.lastmod),
    changeFrequency: route.changefreq,
    priority: parseFloat(route.priority),
  }));

  // Programmatic SEO hub routes (industry x stage, industry x geo)
  const hubRoutes = [];
  const stages = Object.keys(STAGE_SLUGS);
  const geos = Object.keys(GEO_REGIONS);

  for (const industry of INDUSTRY_PAGES) {
    // Industry + Stage
    for (const stage of stages) {
      hubRoutes.push({
        url: absoluteUrl(`/investors/${industry.slug}/${stage}`),
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
    // Industry + Top Geos (limit to avoid sitemap bloat)
    for (const geo of geos.slice(0, 8)) {
      hubRoutes.push({
        url: absoluteUrl(`/investors/${industry.slug}/${geo}`),
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  }

  // Popular Hubs (3-segment cross-filters)
  for (const hub of POPULAR_HUBS) {
    hubRoutes.push({
      url: absoluteUrl(`/investors/${hub.filters.join('/')}`),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  // Fetch all investors to include in sitemap
  let allInvestors = [];
  try {
    const { data } = await supabase
      .from('investors_secure')
      .select('id, slug, updated_at');
    
    if (data) {
      allInvestors = data.map((inv) => ({
        url: absoluteUrl(`/investor/${inv.slug || inv.id}`),
        lastModified: inv.updated_at ? new Date(inv.updated_at) : new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      }));
    }
  } catch (error) {
    console.error('Sitemap investor fetch error:', error);
  }

  return [...staticRoutes, ...hubRoutes, ...allInvestors];
}
