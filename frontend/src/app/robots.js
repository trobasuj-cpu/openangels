export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/crm/',
      ],
    },
    sitemap: 'https://openangels.xyz/sitemap.xml',
  };
}
