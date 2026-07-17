import { NextResponse } from 'next/server';

import axios, { endpoints } from 'src/utils/axios';

export async function GET() {
  let companyInfo = null;

  try {
    const res = await axios.get(endpoints.companyInfo);
    companyInfo = res.data;
  } catch (err) {
    companyInfo = null;
  }

  const name = companyInfo?.company_name ?? 'LEDARS';
  const logo = companyInfo?.logo ?? '/icons/icon-512x512.png';
  const favicon = companyInfo?.favicon ?? '/icons/icon-192x192.png';

  const manifest = {
    id: '/',
    name,
    short_name: name,
    description: `Human Resource Management System for ${name}`,
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    scope: '/',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    icons: [
      { src: logo, sizes: '512x512', type: 'image/png' },
      { src: favicon, sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
    ],
  };

  return NextResponse.json(manifest, {
    headers: { 'Content-Type': 'application/manifest+json' },
  });
}
