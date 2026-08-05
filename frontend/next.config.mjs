/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      { source: '/sitemap-index.xml', destination: '/api/sitemap-root' },
      { source: '/sitemap-static.xml', destination: '/api/sitemap-static' },
      { source: '/sitemap-1.xml', destination: '/api/sitemap-1' },
      { source: '/sitemap-2.xml', destination: '/api/sitemap-2' },
      { source: '/sitemap-3.xml', destination: '/api/sitemap-3' },
      { source: '/sitemap-4.xml', destination: '/api/sitemap-4' },
    ];
  },
};

export default nextConfig;
