export * from './.open-next/worker.js';
import worker from './.open-next/worker.js';

// Fast-path block for automated exploit/CMS scanners before waking OpenNext (~0.05ms CPU)
const BOT_SCANNER_PATH_RE =
  /(?:^\/(?:wp-admin|wp-content|wp-includes|wp-login|xmlrpc|phpmyadmin|pma|cgi-bin|\.env|\.git|\.well-known\/(?:apple-app|security))|\.(?:php|asp|aspx|jsp|cgi|sql|bak|ini|sh|yml|yaml|env)$)/i;

const TRACKING_PARAMS = ['gclid', 'fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref'];

function isCacheablePublicApi(pathname, request) {
  // Never cache authenticated API calls (e.g., Premium Bearer token unlocks private emails)
  if (request.headers.has('authorization')) return false;
  if (pathname === '/api/investors' || pathname === '/api/investors/count' || pathname === '/api/companies') {
    return true;
  }
  if (pathname.startsWith('/api/sitemap')) {
    return true;
  }
  return false;
}

function isCacheableRequest(pathname, method, request) {
  if (method !== 'GET' && method !== 'HEAD') return false;
  if (request.headers.has('next-action')) return false;
  if (pathname.startsWith('/admin') || pathname.startsWith('/crm')) return false;
  if (pathname.startsWith('/api/')) {
    return isCacheablePublicApi(pathname, request);
  }
  return true;
}

function getCacheControlPolicy(pathname, status) {
  if (status === 404) {
    // Cache 404s for 30 min on Edge to absorb scanner/broken-link crawl spikes
    return 'public, max-age=600, s-maxage=1800, stale-while-revalidate=1800';
  }

  // Sitemaps: 24h Edge TTL + 7d SWR (auto-invalidated on deploy via CF_VERSION_METADATA.id)
  if (pathname.startsWith('/api/sitemap') || pathname.startsWith('/sitemap')) {
    return 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';
  }

  // Public GET APIs
  if (pathname === '/api/companies') {
    return 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800';
  }
  if (pathname === '/api/investors' || pathname === '/api/investors/count') {
    return 'public, max-age=120, s-maxage=3600, stale-while-revalidate=86400';
  }

  // Long-tail SEO pages (thousands of profiles, hubs, companies, A-Z directories):
  // 7-day Edge TTL + 7-day SWR — cache key includes CF_VERSION_METADATA.id so deploys bust automatically
  if (
    pathname.startsWith('/investor/') ||
    pathname.startsWith('/investors/') ||
    pathname.startsWith('/company/') ||
    pathname === '/directory' ||
    pathname.startsWith('/directory/')
  ) {
    return 'public, max-age=3600, s-maxage=604800, stale-while-revalidate=604800';
  }

  // Homepage and static legal/info routes: 1h Edge TTL so live DB counters stay fresh
  return 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // 1. Static asset fallback belt (wrangler assets.run_worker_first=false handles static before Worker)
    if (method === 'GET' && pathname.startsWith('/_next/static/') && env?.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    // 2. Reject obvious scanner probes instantly without booting Next.js runtime
    if (BOT_SCANNER_PATH_RE.test(pathname)) {
      return new Response('Not Found', {
        status: 404,
        headers: {
          'content-type': 'text/plain; charset=utf-8',
          'cache-control': 'public, max-age=3600, s-maxage=86400',
          'x-worker-cache': 'BLOCKED-SCANNER',
        },
      });
    }

    // 3. Edge Cache lookup & single-clone write for all public pages & public GET APIs
    if (isCacheableRequest(pathname, method, request)) {
      const cache = caches.default;
      const cacheUrl = new URL(url.origin + pathname + url.search);
      for (const param of TRACKING_PARAMS) {
        cacheUrl.searchParams.delete(param);
      }
      cacheUrl.searchParams.sort();

      // Isolate Next.js App Router RSC / prefetch Flight responses from HTML responses
      // so client-side <Link> prefetches can never poison document HTML in caches.default.
      const rscHeader = request.headers.get('rsc');
      const prefetchHeader = request.headers.get('next-router-prefetch');
      const segPrefetchHeader = request.headers.get('next-router-segment-prefetch');
      if (rscHeader) cacheUrl.searchParams.set('__rsc', rscHeader);
      if (prefetchHeader) cacheUrl.searchParams.set('__prefetch', prefetchHeader);
      if (segPrefetchHeader) cacheUrl.searchParams.set('__seg', segPrefetchHeader);

      // Namespace Worker cache by Cloudflare deployment version so every deploy auto-invalidates cleanly
      const deployVersion = env?.CF_VERSION_METADATA?.id || 'v3';
      cacheUrl.searchParams.set('__v', deployVersion);

      const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });

      try {
        const cached = await cache.match(cacheKey);
        if (cached) {
          const hitHeaders = new Headers(cached.headers);
          hitHeaders.set('cf-cache-status', 'HIT');
          hitHeaders.set('x-worker-cache', 'HIT');
          return new Response(method === 'HEAD' ? null : cached.body, {
            status: cached.status,
            statusText: cached.statusText,
            headers: hitHeaders,
          });
        }
      } catch {
        // Fallback to origin worker on Cache API error
      }

      // Never store empty HEAD responses into the GET cache
      if (method === 'HEAD') {
        return worker.fetch(request, env, ctx);
      }

      const response = await worker.fetch(request, env, ctx);

      if (response && (response.status === 200 || response.status === 404)) {
        const cc = response.headers.get('cache-control') || '';
        // Next.js App Router emits `private, no-cache, no-store` on all dynamic SSR routes
        // (e.g. /directory/[letter] using searchParams) and on all notFound() 404 responses.
        // Force-cache known public routes & 404s (auth/admin/crm/private APIs are already excluded above).
        const isKnownPublicCacheable =
          response.status === 404 ||
          pathname === '/' ||
          pathname.startsWith('/investor/') ||
          pathname.startsWith('/investors/') ||
          pathname.startsWith('/company/') ||
          pathname === '/directory' ||
          pathname.startsWith('/directory/') ||
          pathname.startsWith('/sitemap') ||
          pathname.startsWith('/api/sitemap') ||
          pathname === '/api/investors' ||
          pathname === '/api/investors/count' ||
          pathname === '/api/companies';

        if (isKnownPublicCacheable || !cc.includes('private')) {
          try {
            const headers = new Headers(response.headers);
            headers.delete('set-cookie');
            headers.set('cache-control', getCacheControlPolicy(pathname, response.status));
            headers.set('x-worker-cache', 'MISS');

            // Single Response wrapper + single .clone() (eliminates double stream teeing)
            const outResponse = new Response(response.body, {
              status: response.status,
              statusText: response.statusText,
              headers,
            });
            ctx.waitUntil(cache.put(cacheKey, outResponse.clone()));
            return outResponse;
          } catch {
            return response;
          }
        }
      }

      return response;
    }

    return worker.fetch(request, env, ctx);
  },
};
