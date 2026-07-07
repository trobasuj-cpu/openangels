import { absoluteUrl } from '@/seo';
import { supabase } from '@/lib/supabase';

function escapeXml(unsafe) { return unsafe.replace(/[<>&'\"]/g, function (c) { switch (c) { case '<': return '&lt;'; case '>': return '&gt;'; case '&': return '&amp;'; case '\'': return '&apos;'; case '\"': return '&quot;'; } }); }

export async function GET() {
  try {
    let allUrls = [];
    
    // Fetch remaining investors (3600 to 4799)
    const p1 = supabase.from('investors_secure').select('slug, created_at').not('slug', 'is', null).range(3600, 4599);
    const p2 = supabase.from('investors_secure').select('slug, created_at').not('slug', 'is', null).range(4600, 4799);
    
    const [res1, res2] = await Promise.all([p1, p2]);
    const data = [...(res1.data || []), ...(res2.data || [])];

    if (data && data.length > 0) {
      const investorUrls = data.map((inv) => `
  <url>
    <loc>${absoluteUrl(`/investor/${escapeXml(inv.slug)}`)}</loc>
    <lastmod>${inv.created_at ? new Date(inv.created_at).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
      allUrls = allUrls.concat(investorUrls);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.join('')}
</urlset>`;

    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate',
      },
    });
  } catch (error) {
    console.error('Sitemap error:', error);
    return new Response('Error', { status: 500 });
  }
}

