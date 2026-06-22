import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { INDEXABLE_ROUTES, SITE_URL } from '../src/seo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sitemapPath = path.resolve(__dirname, '..', 'public', 'sitemap.xml');

function xmlEscape(value) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const urls = INDEXABLE_ROUTES.map((route) => {
  const loc = new URL(route.path, SITE_URL).href;
  return [
    '  <url>',
    `    <loc>${xmlEscape(loc)}</loc>`,
    `    <lastmod>${route.lastmod}</lastmod>`,
    `    <changefreq>${route.changefreq}</changefreq>`,
    `    <priority>${route.priority}</priority>`,
    '  </url>',
  ].join('\n');
}).join('\n');

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  urls,
  '</urlset>',
  '',
].join('\n');

fs.writeFileSync(sitemapPath, sitemap, 'utf8');
console.log(`Generated sitemap with ${INDEXABLE_ROUTES.length} URLs`);
