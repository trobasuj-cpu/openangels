import { absoluteUrl } from '@/seo';
import { supabase } from '@/lib/supabase';

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

export async function GET() {
  try {
    const start = 0;
    const end = 1199;

    const p1 = supabase.from('investors_secure').select('slug, created_at').not('slug', 'is', null).range(start, start + 599);
    const p2 = supabase.from('investors_secure').select('slug, created_at').not('slug', 'is', null).range(start + 600, end);
    
    const [res1, res2] = await Promise.all([p1, p2]);
    const data = [...(res1.data || []), ...(res2.data || [])];

    const urls = data.map((inv) => `
  <url>
    <loc>${absoluteUrl(`/investor/${escapeXml(inv.slug)}`)}</loc>
    <lastmod>${inv.created_at ? new Date(inv.created_at).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

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
