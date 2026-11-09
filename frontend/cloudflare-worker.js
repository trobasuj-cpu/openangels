export * from './.open-next/worker.js';
import worker from './.open-next/worker.js';

function prepareResponseForCache(res) {
  const headers = new Headers(res.headers);
  headers.delete('set-cookie');
  const currentCc = headers.get('cache-control') || '';
  if (!currentCc.includes('max-age') && !currentCc.includes('s-maxage')) {
    headers.set('cache-control', 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400');
  }
  return new Response(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers,
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;

    // Only cache GET requests for public content (profiles, directories, hubs, sitemaps, static)
    // NEVER cache API routes, auth, crm, or admin
    const isPublicPage = method === 'GET' && 
      !url.pathname.startsWith('/api/') && 
      !url.pathname.startsWith('/admin') &&
      !url.pathname.startsWith('/crm');

    if (isPublicPage) {
      const cache = caches.default;
      const cacheUrl = new URL(request.url);
      cacheUrl.searchParams.delete('gclid');
      cacheUrl.searchParams.delete('fbclid');
      cacheUrl.searchParams.delete('utm_source');
      cacheUrl.searchParams.delete('utm_medium');
      cacheUrl.searchParams.delete('utm_campaign');
      cacheUrl.searchParams.delete('utm_term');
      cacheUrl.searchParams.delete('utm_content');
      
      const cacheKey = new Request(cacheUrl.toString(), {
        method: 'GET',
        headers: request.headers,
      });

      try {
        const cached = await cache.match(cacheKey);
        if (cached) {
          const hit = new Response(cached.body, cached);
          hit.headers.set('cf-cache-status', 'HIT');
          hit.headers.set('x-worker-cache', 'HIT');
          return hit;
        }
      } catch (err) {
        // Cache API fallback
      }

      const response = await worker.fetch(request, env, ctx);

      if (response && response.status === 200) {
        const cc = response.headers.get('cache-control') || '';
        const isExplicitNoStore = cc.includes('no-store') || cc.includes('private');

        if (!isExplicitNoStore || url.pathname.includes('sitemap') || url.pathname.startsWith('/investor') || url.pathname.startsWith('/directory')) {
          try {
            const cacheableResponse = prepareResponseForCache(response.clone());
            ctx.waitUntil(cache.put(cacheKey, cacheableResponse));
          } catch (err) {}
        }

        try {
          const res = new Response(response.body, response);
          res.headers.set('x-worker-cache', 'MISS');
          return res;
        } catch (err) {
          return response;
        }
      }

      return response;
    }

    return worker.fetch(request, env, ctx);
  }
};
