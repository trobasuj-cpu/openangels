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
    for (const stage of stages) {
      hubRoutes.push({
        url: absoluteUrl(`/investors/${industry.slug}/${stage}`),
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
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

  // Fetch ALL investors with pagination (Supabase default limit is 1000)
  let allInvestors = [];
  try {
    let allData = [];
    let from = 0;
    const pageSize = 1000;

    while (true) {
      const { data, error } = await supabase
        .from('investors_secure')
        .select('slug, created_at')
        .not('slug', 'is', null)
        .range(from, from + pageSize - 1);

      if (error) throw error;
      if (!data || data.length === 0) break;
      allData = allData.concat(data);
      if (data.length < pageSize) break;
      from += pageSize;
    }

    allInvestors = allData.map((inv) => ({
      url: absoluteUrl(`/investor/${inv.slug}`),
      lastModified: inv.created_at ? new Date(inv.created_at) : new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Sitemap investor fetch error:', error);
  }

  return [...staticRoutes, ...hubRoutes, ...allInvestors];
}
