import os

def create_route(filename, code):
    path = f'd:/Users/00001/openangels/frontend/src/app/api/{filename}/route.js'
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(code)

# 1. Sitemap Index
index_code = """export const dynamic = 'force-dynamic';

export async function GET() {
  const sitemaps = [
    'https://openangels.xyz/sitemap-static.xml',
    'https://openangels.xyz/sitemap-1.xml',
    'https://openangels.xyz/sitemap-2.xml',
    'https://openangels.xyz/sitemap-3.xml',
    'https://openangels.xyz/sitemap-4.xml',
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map((url) => `  <sitemap>
    <loc>${url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`).join('\\n')}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
"""
create_route('sitemap-index', index_code)

# 2. Sitemap Static
static_code = """export const dynamic = 'force-dynamic';
import { absoluteUrl } from '@/seo';

export async function GET() {
  const staticPages = [
    '/',
    '/directory',
    '/crm',
    '/contact',
    '/privacy',
    '/terms',
    '/gdpr',
    '/refund',
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(path => `  <url>
    <loc>${absoluteUrl(path)}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${path === '/' ? '1.0' : '0.8'}</priority>
  </url>`).join('\\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
"""
create_route('sitemap-static', static_code)

# 3. Dynamic investor sitemaps 1-4
def make_investor_sitemap(offset, limit):
    return """export const dynamic = 'force-dynamic';
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

    const res = await fetch(`${supabaseUrl}/rest/v1/investors_secure?select=slug,created_at&slug=not.is.null&order=id.asc&offset=""" + str(offset) + """&limit=""" + str(limit) + """`, {
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
  </url>`).join('\\n');

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
"""

create_route('sitemap-1', make_investor_sitemap(0, 1200))
create_route('sitemap-2', make_investor_sitemap(1200, 1200))
create_route('sitemap-3', make_investor_sitemap(2400, 1200))
create_route('sitemap-4', make_investor_sitemap(3600, 1400))
print("All 6 sitemap routes generated successfully!")
