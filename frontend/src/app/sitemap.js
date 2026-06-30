import { INDEXABLE_ROUTES, absoluteUrl } from '@/seo';

export const revalidate = 86400; // Cache for 24 hours

export default async function sitemap() {
  return INDEXABLE_ROUTES.map((route) => ({
    url: absoluteUrl(route.path),
    lastModified: new Date(route.lastmod),
    changeFrequency: route.changefreq,
    priority: parseFloat(route.priority),
  }));
}
