export async function GET() {
  // RFC 9309 compliant: all major search & AI search engines (Googlebot, Bingbot, Yandex,
  // OAI-SearchBot, ChatGPT-User, PerplexityBot, Claude-SearchBot, Applebot-Extended)
  // inherit the wildcard block cleanly so Disallow rules are strictly honored.
  const robotsTxt = `User-Agent: *
Allow: /
Allow: /sitemap*.xml
Allow: /api/sitemap*
Disallow: /api/
Disallow: /admin/
Disallow: /crm
Disallow: /monitoring

# Block aggressive non-search scraper bots to protect serverless CPU & bandwidth
User-Agent: Bytespider
Disallow: /

User-Agent: PetalBot
Disallow: /

User-Agent: MJ12bot
Disallow: /

User-Agent: DotBot
Disallow: /

User-Agent: BLEXBot
Disallow: /

User-Agent: DataForSeoBot
Disallow: /

Sitemap: https://openangels.xyz/sitemap.xml
`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
