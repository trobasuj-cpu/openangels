import { absoluteUrl } from '@/seo';
import { supabase } from '@/lib/supabase';

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;'; case '>': return '&gt;'; case '&': return '&amp;';
      case "'": return '&apos;'; case '"': return '&quot;';
    }
  });
}

export async function GET() {
  try {
    const { data: rawData } = await supabase
      .from('investors_secure')
      .select('slug, created_at')
      .not('slug', 'is', null)
      .order('id')
      .range(2400, 3599);

    const data = rawData || [];

    let urls = data.map((inv) => `  <url>
    <loc>${absoluteUrl(`/investor/${escapeXml(inv.slug)}`)}</loc>
    <lastmod>${inv.created_at ? new Date(inv.created_at).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');

    if (!urls) {
      urls = `  <url>
    <loc>${absoluteUrl('/')}</loc>
    <changefreq>daily</changefreq>
    <priority>0.1</priority>
  </url>`;
    }

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
  } catch (e) {
    return new Response('Error generating sitemap', { status: 500 });
  }
}
