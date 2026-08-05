import os

def create_sitemap_route(filename, start_idx, end_idx):
    code = f'''import {{ absoluteUrl }} from '@/seo';
import {{ supabase }} from '@/lib/supabase';

function escapeXml(unsafe) {{
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, function (c) {{
    switch (c) {{
      case '<': return '&lt;'; case '>': return '&gt;'; case '&': return '&amp;';
      case '\'': return '&apos;'; case '"': return '&quot;';
    }}
  }});
}}

export async function GET() {{
  try {{
    const {{ data: rawData }} = await supabase
      .from('investors_secure')
      .select('slug, created_at')
      .not('slug', 'is', null)
      .order('id')
      .range({start_idx}, {end_idx});

    const data = rawData || [];

    let urls = data.map((inv) => `  <url>
    <loc>\${{absoluteUrl(`/investor/\${{escapeXml(inv.slug)}}`)}}</loc>
    <lastmod>\${{inv.created_at ? new Date(inv.created_at).toISOString() : new Date().toISOString()}}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\\n');

    if (!urls) {{
      urls = `  <url>
    <loc>\${{absoluteUrl('/')}}</loc>
    <changefreq>daily</changefreq>
    <priority>0.1</priority>
  </url>`;
    }}

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
\${{urls}}
</urlset>`;

    return new Response(xml, {{
      headers: {{
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
      }},
    }});
  }} catch (e) {{
    return new Response('Error generating sitemap', {{ status: 500 }});
  }}
}}
'''
    path = f'd:/Users/00001/openangels/frontend/src/app/api/{filename}/route.js'
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(code)

create_sitemap_route('sitemap-1', 0, 1199)
create_sitemap_route('sitemap-2', 1200, 2399)
create_sitemap_route('sitemap-3', 2400, 3599)
create_sitemap_route('sitemap-4', 3600, 4999)

# Write static sitemap
static_code = '''import { absoluteUrl } from '@/seo';

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
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
'''
with open('d:/Users/00001/openangels/frontend/src/app/api/sitemap-static/route.js', 'w', encoding='utf-8') as f:
    f.write(static_code)

print("All sitemap API routes generated!")
