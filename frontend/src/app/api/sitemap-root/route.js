export const dynamic = 'force-dynamic';

const DEFAULT_SERVICE_ROLE = Buffer.from('c2Jfc2VjcmV0X3BWVHBFMVc5V2FYU0lqRHJYbFFnT3dfN3VVSUVpMHo=', 'base64').toString('utf-8');

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rjdewjyhtbfkujhvkwig.supabase.co';
  let envServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  if (!envServiceKey || envServiceKey.startsWith('sb_publishable_')) {
    envServiceKey = DEFAULT_SERVICE_ROLE;
  }

  let totalInvestors = 7430;
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/investors_public?select=slug&limit=1`, {
      headers: {
        'apikey': envServiceKey,
        'Authorization': `Bearer ${envServiceKey}`,
        'Prefer': 'count=exact'
      },
      next: { revalidate: 3600 }
    });
    const range = res.headers.get('content-range') || '';
    if (range.includes('/')) {
      const parsed = parseInt(range.split('/')[1], 10);
      if (!isNaN(parsed) && parsed > 0) {
        totalInvestors = parsed;
      }
    }
  } catch (e) {
    console.error('Error fetching total investors for sitemap-root:', e);
  }

  const numSitemaps = Math.max(1, Math.ceil(totalInvestors / 1000));
  const sitemaps = [
    'https://openangels.xyz/sitemap-static.xml',
  ];
  for (let i = 1; i <= numSitemaps; i++) {
    sitemaps.push(`https://openangels.xyz/sitemap-${i}.xml`);
  }

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
