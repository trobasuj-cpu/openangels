export const dynamic = 'force-dynamic';
import { absoluteUrl } from '@/seo';

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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://fluhgqbfesctqefazjln.supabase.co';
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy';

    const res = await fetch(`${supabaseUrl}/rest/v1/investors_secure?select=slug,created_at&slug=not.is.null&order=id.asc&offset=1200&limit=1200`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
      next: { revalidate: 3600 }
    });

    const data = res.ok ? await res.json() : [];

    let urls = (data || []).map((inv) => `  <url>
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
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${absoluteUrl('/')}</loc>
    <changefreq>daily</changefreq>
    <priority>0.1</priority>
  </url>
</urlset>`;
    return new Response(fallbackXml, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }
}
