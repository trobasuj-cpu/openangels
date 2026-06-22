import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import puppeteer from 'puppeteer';
import { getSitemapRoutes } from './get-routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, 'dist');

async function listen(app) {
  return new Promise((resolve) => {
    const server = app.listen(0, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

async function run() {
  console.log('Starting prerender...');

  const app = express();
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });

  const server = await listen(app);
  const port = server.address().port;
  console.log(`Server running on http://127.0.0.1:${port}`);

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1366, height: 900, deviceScaleFactor: 1 });

  const routes = [...new Set(getSitemapRoutes())];

  for (const route of routes) {
    const url = `http://127.0.0.1:${port}${route}`;
    console.log(`Prerendering ${route}...`);

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await page.waitForSelector('h1, main', { timeout: 15000 }).catch(() => {});
      // Extra wait for Supabase async data to load and render
      await new Promise((resolve) => setTimeout(resolve, 2500));

      const html = await page.content();
      let filePath = path.join(distPath, route);
      if (!filePath.endsWith('.html')) {
        filePath = path.join(filePath, 'index.html');
      }

      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, html, 'utf8');
    } catch (err) {
      console.error(`Failed to prerender ${route}:`, err.message);
    }
  }

  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  console.log('Prerender complete!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

