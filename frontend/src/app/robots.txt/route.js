import { absoluteUrl } from '@/seo';

export async function GET() {
  const robotsTxt = `User-Agent: *
Allow: /
Disallow: /api/
Disallow: /crm/

Sitemap: https://openangels.xyz/sitemap-1.xml
Sitemap: https://openangels.xyz/sitemap-2.xml
Sitemap: https://openangels.xyz/sitemap-3.xml
Sitemap: https://openangels.xyz/sitemap-4.xml
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate',
    },
  });
}
