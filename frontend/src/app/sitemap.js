import { INDEXABLE_ROUTES, absoluteUrl, INDUSTRY_PAGES, STAGE_SLUGS, GEO_REGIONS, POPULAR_HUBS } from '@/seo';
import { supabase } from '@/lib/supabase';

export const revalidate = 86400; // Cache for 24 hours

// Step 1: Declare sitemap parts (numeric IDs required by Next.js)
// 0 = static + hubs, 1-5 = investor pages (1000 each)
export async function generateSitemaps() {
  return [
    { id: 0 },  // Static routes + SEO hubs
    { id: 1 },  // Investors 0-999
    { id: 2 },  // Investors 1000-1999
    { id: 3 },  // Investors 2000-2999
    { id: 4 },  // Investors 3000-3999
    { id: 5 },  // Investors 4000+
  ];
}

// Step 2: Generate URLs for each part
export default async function sitemap({ id }) {
  // Part 0: Static routes + SEO hubs
  if (id === 0) {
    const staticRoutes = INDEXABLE_ROUTES.map((route) => ({
      url: absoluteUrl(route.path),
      lastModified: new Date(route.lastmod),
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

    for (const hub of POPULAR_HUBS) {
      hubRoutes.push({
        url: absoluteUrl(`/investors/${hub.filters.join('/')}`),
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }

    return [...staticRoutes, ...hubRoutes];
  }

  // Parts 1-5: Investor pages (1000 per chunk)
  const page = id - 1; // id=1 → offset 0, id=2 → offset 1000, etc.
  const limit = 1000;
  const offset = page * limit;

  try {
    const { data, error } = await supabase
      .from('investors_secure')
      .select('slug, created_at')
      .not('slug', 'is', null)
      .range(offset, offset + limit - 1);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    return data.map((inv) => ({
      url: absoluteUrl(`/investor/${inv.slug}`),
      lastModified: inv.created_at ? new Date(inv.created_at) : new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    }));
  } catch (error) {
    console.error(`Sitemap investor fetch error (part ${id}):`, error);
    return [];
  }
}
