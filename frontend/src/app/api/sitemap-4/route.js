export const dynamic = 'force-dynamic';
import { absoluteUrl } from '@/seo';
import { createClient } from '@supabase/supabase-js';

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
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://rjdewjyhtbfkujhvkwig.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ial7j5MzK6ni3y-Y8YszGg_7ZeV-2D3';

    const supabase = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
    
    // Fetch remaining investors (3000 to 5000)
    const { data, error } = await supabase
      .from('investors_public')
      .select('slug, created_at')
      .not('slug', 'is', null)
      .order('created_at', { ascending: false })
      .range(3000, 4999);

    if (error) throw error;

    const urls = (data || []).map((inv) => `  <url>
    <loc>${absoluteUrl(`/investor/${escapeXml(inv.slug)}`)}</loc>
    <lastmod>${inv.created_at ? new Date(inv.created_at).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n');

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
    console.error('Sitemap-4 error:', e);
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
      status: 500
    });
  }
}
