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
    const start = 2400;
    const end = 3599;

    const p1 = supabase.from('investors_secure').select('slug, created_at, bio, industry, industries, email, linkedin_url, twitter_url, website').not('slug', 'is', null).range(start, start + 599);
    const p2 = supabase.from('investors_secure').select('slug, created_at, bio, industry, industries, email, linkedin_url, twitter_url, website').not('slug', 'is', null).range(start + 600, end);
    
    const [res1, res2] = await Promise.all([p1, p2]);
    const rawData = [...(res1.data || []), ...(res2.data || [])];
    const data = rawData.filter(inv => {
      const hasRealBio = inv.bio && !inv.bio.includes("Found via automated") && !inv.bio.includes("Extracted from public");
      const rawInd = inv.industry || inv.industries;
      const hasTags = Array.isArray(rawInd) ? rawInd.length > 0 : !!rawInd;
      const hasSocial = !!inv.email || !!inv.linkedin_url || !!inv.twitter_url || !!inv.website;
      return hasRealBio || hasTags || hasSocial;
    });

    const urls = data.map((inv) => `
  <url>
    <loc>${absoluteUrl(`/investor/${escapeXml(inv.slug)}`)}</loc>
    <lastmod>${inv.created_at ? new Date(inv.created_at).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('');

    let xmlUrls = urls;
    if (!xmlUrls) {
      xmlUrls = `
  <url>
    <loc>${absoluteUrl('/')}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <priority>0.1</priority>
  </url>`;
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${xmlUrls}</urlset>`;

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
