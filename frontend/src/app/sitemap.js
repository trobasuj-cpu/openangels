import { absoluteUrl } from '@/seo';
import { supabase } from '@/lib/supabase';

// Generate 5 sitemaps: 1 for static pages (id: 'static'), and 4 for investors (id: 0, 1, 2, 3)
export async function generateSitemaps() {
  return [
    { id: 'static' },
    { id: 0 },
    { id: 1 },
    { id: 2 },
    { id: 3 },
  ];
}

export default async function sitemap({ id }) {
  if (id === 'static') {
    const staticPages = [
      '',
      '/contact',
      '/privacy',
      '/terms',
      '/gdpr',
      '/refund',
      '/investors/all',
      '/investors/saas',
      '/investors/ai',
      '/investors/fintech',
      '/investors/healthtech',
      '/investors/ecommerce',
      '/investors/edtech',
      '/investors/cleantech',
      '/investors/web3',
      '/investors/deeptech',
      '/investors/b2b',
      '/investors/b2c',
      '/investors/marketplace',
      '/investors/hardware',
      '/investors/gaming',
      '/investors/usa',
      '/investors/europe',
      '/investors/uk',
      '/investors/asia',
      '/investors/latam',
      '/investors/mena',
      '/investors/pre-seed',
      '/investors/seed',
      '/investors/series-a',
      '/investors/series-b',
      '/investors/series-c',
    ];

    return staticPages.map((route) => ({
      url: absoluteUrl(route),
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: route === '' ? 1.0 : 0.8,
    }));
  }

  // Handle investor sitemaps (ids 0 to 3)
  const pageId = Number(id);
  const pageSize = 1200;
  const start = pageId * pageSize;
  const end = start + pageSize - 1;

  // Split into two requests of 600 to avoid PostgREST range limits or timeouts if any
  const p1 = supabase.from('investors_secure').select('slug, created_at').not('slug', 'is', null).range(start, start + 599);
  const p2 = supabase.from('investors_secure').select('slug, created_at').not('slug', 'is', null).range(start + 600, end);
  
  const [res1, res2] = await Promise.all([p1, p2]);
  const data = [...(res1.data || []), ...(res2.data || [])];

  return data.map((inv) => ({
    url: absoluteUrl(`/investor/${inv.slug}`),
    lastModified: inv.created_at ? new Date(inv.created_at) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));
}
