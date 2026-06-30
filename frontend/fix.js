const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Fix Footer imports in app/ pages
      if (dir.includes('app\\') || dir.includes('app/')) {
        content = content.replace(/import Footer from '\.\.\/components\/Footer';/g, "import Footer from '@/components/Footer';");
        content = content.replace(/import \{ absoluteUrl.*\} from '\.\.\/seo\.js';/g, "import { absoluteUrl, INDUSTRY_PAGES, INVESTOR_COUNT, PRODUCT_NAME, SITE_URL } from '@/seo.js';");
      }

      // Fix imports in components
      if (dir.includes('components')) {
        content = content.replace(/from '\.\.\/seo\.js';/g, "from '@/seo.js';");
        
        // Add "use client" if there's useState or useEffect
        if ((content.includes('useState') || content.includes('useEffect')) && !content.includes('"use client"')) {
          content = '"use client";\n' + content;
        }

        // Fix the double fragment issue in FAQ and Footer
        if (content.includes('<>\n    <>')) {
          content = content.replace('<>\n    <>', '<>');
        }
      }

      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir('d:/Users/00001/openangels/next-frontend/src/app');
processDir('d:/Users/00001/openangels/next-frontend/src/components');
console.log("Fixes complete!");
