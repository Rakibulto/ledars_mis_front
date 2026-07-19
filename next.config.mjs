import path from 'node:path';

import withPWA from 'next-pwa';

const isStaticExport = 'false';

const nextConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})({
  productionBrowserSourceMaps: false,
  trailingSlash: true,
  allowedDevOrigins: ['localhost', '127.0.0.1', '192.168.2.133'],
  env: {
    BUILD_STATIC_EXPORT: isStaticExport,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
    webpackMemoryOptimizations: true,
    cpus: process.env.VERCEL ? 1 : undefined,
  },
  modularizeImports: {
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
    '@mui/material': {
      transform: '@mui/material/{{member}}',
    },
    '@mui/lab': {
      transform: '@mui/lab/{{member}}',
    },
  },
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      src: path.resolve('./src'),
    };

    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });

    // Disable minification on Vercel to reduce peak build memory usage
    if (process.env.VERCEL) {
      config.optimization.minimize = false;
    }

    return config;
  },
  ...(isStaticExport === 'true' && {
    output: 'export',
  }),
});

export default nextConfig;
