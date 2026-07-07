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

export async function GET(request, { params }) {
  try {
    const { id } = params;
    let allUrls = [];

    if (id === 'static') {
      const staticPages = [
        '', '/contact', '/privacy', '/terms', '/gdpr', '/refund',
        '/investors/all', '/investors/saas', '/investors/ai', '/investors/fintech',
        '/investors/healthtech', '/investors/ecommerce', '/investors/edtech',
        '/investors/cleantech', '/investors/web3', '/investors/deeptech',
        '/investors/b2b', '/investors/b2c', '/investors/marketplace',
        '/investors/hardware', '/investors/gaming', '/investors/usa',
        '/investors/europe', '/investors/uk', '/investors/asia',
        '/investors/latam', '/investors/mena', '/investors/pre-seed',
        '/investors/seed', '/investors/series-a', '/investors/series-b',
        '/investors/series-c'
      ];

      allUrls = staticPages.map((route) => `
  <url>
    <loc>${absoluteUrl(route)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`);
    } else {
      const pageId = parseInt(id, 10);
      if (isNaN(pageId)) return new Response('Invalid ID', { status: 400 });

      const pageSize = 1200;
      const start = (pageId - 1) * pageSize;
      const end = start + pageSize - 1;

      const p1 = supabase.from('investors_secure').select('slug, created_at').not('slug', 'is', null).range(start, start + 599);
      const p2 = supabase.from('investors_secure').select('slug, created_at').not('slug', 'is', null).range(start + 600, end);
      
      const [res1, res2] = await Promise.all([p1, p2]);
      const data = [...(res1.data || []), ...(res2.data || [])];

      if (data && data.length > 0) {
        allUrls = data.map((inv) => `
  <url>
    <loc>${absoluteUrl(`/investor/${escapeXml(inv.slug)}`)}</loc>
    <lastmod>${inv.created_at ? new Date(inv.created_at).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`);
      }
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
    return new Response('Error generating sitemap', { status: 500 });
  }
}
