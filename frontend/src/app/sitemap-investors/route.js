import { absoluteUrl } from '@/seo';
import { supabase } from '@/lib/supabase';

export async function GET(request) {
  // Use Next.js searchParams to get ?page=X
  const { searchParams } = new URL(request.url);
  const pageParam = searchParams.get('page');
  const pageNum = parseInt(pageParam, 10);
  
  if (isNaN(pageNum) || pageNum < 1 || pageNum > 10) {
    return new Response('Not Found or missing page parameter', { status: 404 });
  }

  const limit = 1000;
  const offset = (pageNum - 1) * limit;

  try {
    const { data, error } = await supabase
      .from('investors_secure')
      .select('slug, created_at')
      .not('slug', 'is', null)
      .range(offset, offset + limit - 1);

    if (error) throw error;
    
    // If no data, return empty urlset
    const investors = data || [];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${investors
    .map(
      (inv) => `
  <url>
    <loc>${absoluteUrl(`/investor/${inv.slug}`)}</loc>
    <lastmod>${inv.created_at ? new Date(inv.created_at).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
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
  } catch (error) {
    console.error(`Sitemap investors ${pageNum} fetch error:`, error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
