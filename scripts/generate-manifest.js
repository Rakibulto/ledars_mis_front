const fs = require('fs');
const path = require('path');

const name = process.env.NEXT_PUBLIC_COMPANY_NAME || 'LEDARS';
const themeColor = process.env.NEXT_PUBLIC_MANIFEST_THEME_COLOR || '#ffffff';
const backgroundColor = process.env.NEXT_PUBLIC_MANIFEST_BACKGROUND_COLOR || '#ffffff';

const icons = [
  {
    src: process.env.NEXT_PUBLIC_MANIFEST_ICON_96 || '/icons/icon-96x96.png',
    sizes: '96x96',
    type: 'image/png',
  },
  {
    src: process.env.NEXT_PUBLIC_MANIFEST_ICON_152 || '/icons/icon-152x152.png',
    sizes: '152x152',
    type: 'image/png',
  },
  {
    src: process.env.NEXT_PUBLIC_MANIFEST_ICON_192 || '/icons/icon-192x192.png',
    sizes: '192x192',
    type: 'image/png',
  },
  {
    src: process.env.NEXT_PUBLIC_MANIFEST_ICON_512 || '/icons/icon-512x512.png',
    sizes: '512x512',
    type: 'image/png',
  },
];

const manifest = {
  id: '/',
  name,
  short_name: name,
  theme_color: themeColor,
  background_color: backgroundColor,
  display: 'standalone',
  orientation: 'portrait',
  scope: '/',
  start_url: '/',
  description: `Human Resource Management System for ${name}`,
  icons,
};

const outPath = path.join(__dirname, '..', 'public', 'manifest.json');
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));
console.log(`Generated ${outPath} (name="${name}")`);
