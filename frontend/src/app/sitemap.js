import { INDEXABLE_ROUTES, absoluteUrl } from '@/seo';
import { supabase } from '@/lib/supabase';

export const revalidate = 86400; // Cache for 24 hours

export default async function sitemap() {
  const staticRoutes = INDEXABLE_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: new Date(route.lastmod),
    changeFrequency: route.changefreq,
    priority: parseFloat(route.priority),
  }));

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

  return [...staticRoutes, ...allInvestors];
}
