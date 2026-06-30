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
      
      // Replace react-router-dom Link with next/link
      content = content.replace(/import\s+\{\s*Link\s*\}\s+from\s+['"]react-router-dom['"];/g, "import Link from 'next/link';");
      
      // Remove Helmet imports
      content = content.replace(/import\s+\{\s*Helmet\s*\}\s+from\s+['"]react-helmet-async['"];/g, "");
      
      // Remove <Helmet>...</Helmet> blocks
      content = content.replace(/<Helmet>[\s\S]*?<\/Helmet>/g, "");

      // Fix `to=` to `href=` in <Link> tags
      content = content.replace(/<Link([^>]*?)to=/g, "<Link$1href=");

      fs.writeFileSync(fullPath, content);
    }
  }
}

processDir('d:/Users/00001/openangels/next-frontend/src/app');
processDir('d:/Users/00001/openangels/next-frontend/src/components');
console.log("Cleanup complete!");
