import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import puppeteer from 'puppeteer';
import { getSitemapRoutes } from './get-routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, 'dist');
const port = 3000;

async function run() {
  console.log('Starting prerender...');
  
  // 1. Start a static server for the SPA
  const app = express();
  app.use(express.static(distPath));
  // SPA fallback
  app.use((req, res) => {
    res.sendFile(path.resolve(distPath, 'index.html'));
  });
  
  const server = app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });

  // 2. Launch Puppeteer
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const routes = getSitemapRoutes();
  
  // 3. Render each route
  for (const route of routes) {
    const url = `http://localhost:${port}${route}`;
    console.log(`Prerendering ${route}...`);
    
    try {
      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
      
      // Get the rendered HTML
      const html = await page.content();
      
      // Determine where to save it
      let filePath = path.join(distPath, route);
      if (!filePath.endsWith('.html')) {
        filePath = path.join(filePath, 'index.html');
      }
      
      // Create directories if they don't exist
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Save the file
      fs.writeFileSync(filePath, html);
    } catch (err) {
      console.error(`Failed to prerender ${route}:`, err.message);
    }
  }

  // 4. Cleanup
  await browser.close();
  server.close();
  console.log('Prerender complete!');
}

run();
