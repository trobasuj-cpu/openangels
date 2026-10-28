export async function GET() {
  const robotsTxt = `User-Agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /crm
Disallow: /monitoring

Sitemap: https://openangels.xyz/sitemap.xml
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate',
    },
  });
}
