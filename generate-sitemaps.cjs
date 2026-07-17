const fs = require('fs');
const path = require('path');
const appDir = path.join('d:', 'Users', '00001', 'openangels', 'frontend', 'src', 'app');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// sitemap-index.xml
const indexDir = path.join(appDir, 'sitemap-index.xml');
ensureDir(indexDir);
fs.writeFileSync(path.join(indexDir, 'route.js'), `export async function GET() {
  const sitemaps = [
    'https://openangels.xyz/sitemap-static.xml',
    'https://openangels.xyz/sitemap-1.xml',
    'https://openangels.xyz/sitemap-2.xml',
    'https://openangels.xyz/sitemap-3.xml',
    'https://openangels.xyz/sitemap-4.xml',
  ];
  const xml = \`<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  \${sitemaps.map((url) => \`
  <sitemap>
    <loc>\${url}</loc>
  </sitemap>\`).join('')}
</sitemapindex>\`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate' },
  });
}
`);

// sitemap-static.xml
const staticDir = path.join(appDir, 'sitemap-static.xml');
ensureDir(staticDir);
fs.writeFileSync(path.join(staticDir, 'route.js'), `import { absoluteUrl } from '@/seo';
export async function GET() {
  const staticPages = [
    '', '/contact', '/privacy', '/terms', '/gdpr', '/refund',
    '/investors/all', '/investors/saas', '/investors/ai', '/investors/fintech',
    '/investors/healthtech', '/investors/ecommerce', '/investors/edtech',
    '/investors/cleantech', '/investors/web3', '/investors/deeptech',
    '/investors/b2b', '/investors/b2c', '/investors/marketplace',
    '/investors/hardware', '/investors/gaming', '/investors/usa',
    '/investors/europe', '/investors/uk', '/investors/asia',
    '/investors/latam', '/investors/mena', '/investors/pre-seed',
    '/investors/seed', '/investors/series-a', '/investors/series-b',
    '/investors/series-c'
  ];
  const allUrls = staticPages.map((route) => \`
  <url>
    <loc>\${absoluteUrl(route)}</loc>
    <lastmod>\${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>\${route === '' ? '1.0' : '0.8'}</priority>
  </url>\`).join('');
  const xml = \`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\${allUrls}</urlset>\`;
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate' },
  });
}
`);

// sitemap-1 to 4
for (let i = 1; i <= 4; i++) {
  const sitemapDir = path.join(appDir, `sitemap-${i}.xml`);
  ensureDir(sitemapDir);
  const start = (i - 1) * 1200;
  const end = start + 1199;
  
  fs.writeFileSync(path.join(sitemapDir, 'route.js'), `import { absoluteUrl } from '@/seo';
import { supabase } from '@/lib/supabase';

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;'; case '>': return '&gt;'; case '&': return '&amp;';
      case '\\'': return '&apos;'; case '"': return '&quot;';
    }
  });
}

export async function GET() {
  try {
    const p1 = supabase.from('investors_secure').select('slug, created_at, bio, industry, industries, email, linkedin_url, twitter_url, website').not('slug', 'is', null).range(${start}, ${start + 599});
    const p2 = supabase.from('investors_secure').select('slug, created_at, bio, industry, industries, email, linkedin_url, twitter_url, website').not('slug', 'is', null).range(${start + 600}, ${end});
    const [res1, res2] = await Promise.all([p1, p2]);
    const rawData = [...(res1.data || []), ...(res2.data || [])];

    // Filter out thin content profiles
    const data = rawData.filter(inv => {
      const hasRealBio = inv.bio && !inv.bio.includes("Found via automated") && !inv.bio.includes("Extracted from public");
      const rawInd = inv.industry || inv.industries;
      const hasTags = Array.isArray(rawInd) ? rawInd.length > 0 : !!rawInd;
      const hasSocial = !!inv.email || !!inv.linkedin_url || !!inv.twitter_url || !!inv.website;
      return hasRealBio || hasTags || hasSocial;
    });

    const urls = data.map((inv) => \`
  <url>
    <loc>\${absoluteUrl(\`/investor/\${escapeXml(inv.slug)}\`)}</loc>
    <lastmod>\${inv.created_at ? new Date(inv.created_at).toISOString() : new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>\`).join('');

    const xml = \`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\${urls}</urlset>\`;

    return new Response(xml, {
      headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate' },
    });
  } catch (error) {
    console.error('Sitemap error:', error);
    return new Response('Error', { status: 500 });
  }
}
`);
}
console.log('Successfully generated all explicit route.js files');
