export async function GET() {
  const robotsTxt = `User-Agent: *
Allow: /
Allow: /sitemap*.xml
Allow: /api/sitemap*
Disallow: /api/
Disallow: /admin/
Disallow: /crm
Disallow: /monitoring

# Search Engines & Web Crawlers
User-Agent: Googlebot
Allow: /

User-Agent: Bingbot
Allow: /

User-Agent: Yandex
Allow: /

# Modern AI Search & Answer Engines
User-Agent: OAI-SearchBot
Allow: /

User-Agent: ChatGPT-User
Allow: /

User-Agent: PerplexityBot
Allow: /

User-Agent: Claude-SearchBot
Allow: /

User-Agent: Applebot-Extended
Allow: /

Sitemap: https://openangels.xyz/sitemap.xml
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate',
    },
  });
}
