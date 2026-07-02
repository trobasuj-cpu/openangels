import { absoluteUrl } from '@/seo';

export async function GET() {
  const robotsTxt = `User-Agent: *
Allow: /
Disallow: /api/
Disallow: /crm/

Sitemap: https://openangels.xyz/sitemap-static.xml
Sitemap: https://openangels.xyz/sitemap-investors-1.xml
Sitemap: https://openangels.xyz/sitemap-investors-2.xml
Sitemap: https://openangels.xyz/sitemap-investors-3.xml
Sitemap: https://openangels.xyz/sitemap-investors-4.xml
Sitemap: https://openangels.xyz/sitemap-investors-5.xml
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate',
    },
  });
}
