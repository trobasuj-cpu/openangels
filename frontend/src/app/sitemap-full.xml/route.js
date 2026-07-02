import { absoluteUrl } from '@/seo';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 1. Get static pages
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

    let allUrls = staticPages.map((route) => `
  <url>
    <loc>${absoluteUrl(route)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`);

    // 2. Fetch ALL investors in batches (Supabase limits to 1000 per request)
    let hasMore = true;
    let offset = 0;
    const limit = 1000;

    while (hasMore) {
      const { data, error } = await supabase
        .from('investors_secure')
        .select('slug, created_at')
        .not('slug', 'is', null)
        .range(offset, offset + limit - 1);

      if (error) throw error;

      if (data && data.length > 0) {
        const investorUrls = data.map((inv) => `
  <url>
    <loc>${absoluteUrl(`/investor/${inv.slug}`)}</loc>
    <lastmod>${inv.created_at ? new Date(inv.created_at).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
        allUrls = allUrls.concat(investorUrls);
        offset += limit;
      } else {
        hasMore = false;
      }
    }

    // 3. Generate single XML string
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.join('')}
</urlset>`;

    // Return the response, cached statically
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
