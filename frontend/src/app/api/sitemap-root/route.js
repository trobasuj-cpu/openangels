export const dynamic = 'force-dynamic';

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
  </sitemap>`).join('\n')}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400',
    },
  });
}
