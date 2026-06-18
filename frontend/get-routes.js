import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getSitemapRoutes() {
  const sitemapPath = path.resolve(__dirname, 'public', 'sitemap.xml');
  if (!fs.existsSync(sitemapPath)) {
    return ['/'];
  }
  
  const content = fs.readFileSync(sitemapPath, 'utf8');
  const locRegex = /<loc>(.*?)<\/loc>/g;
  let match;
  const routes = [];
  
  while ((match = locRegex.exec(content)) !== null) {
    const url = match[1];
    const parsed = new URL(url);
    routes.push(parsed.pathname);
  }
  
  return routes;
}
