const fs = require('fs');
const content = fs.readFileSync('public/sitemap.xml', 'utf8');
// Remove UTF-8 BOM if present (EF BB BF = \uFEFF)
const noBom = content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
// Normalize to Unix line endings
const clean = noBom.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
// Write back without BOM (Node.js default)
fs.writeFileSync('public/sitemap.xml', clean, 'utf8');
const size = fs.statSync('public/sitemap.xml').size;
const first40 = clean.substring(0, 40);
console.log('Done. Size:', size, 'bytes');
console.log('First 40 chars:', first40);
