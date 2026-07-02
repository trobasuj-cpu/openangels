export async function GET() {
  // We have 1 static sitemap and 5 investor sitemaps (for ~4700 investors, 1000 per page)
  const sitemaps = [
    'https://openangels.xyz/sitemap-static.xml',
    'https://openangels.xyz/sitemap-investors-1.xml',
    'https://openangels.xyz/sitemap-investors-2.xml',
    'https://openangels.xyz/sitemap-investors-3.xml',
    'https://openangels.xyz/sitemap-investors-4.xml',
    'https://openangels.xyz/sitemap-investors-5.xml',
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemaps
    .map(
      (url) => `
  <sitemap>
    <loc>${url}</loc>
  </sitemap>`
    )
    .join('')}
</sitemapindex>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate',
    },
  });
}
