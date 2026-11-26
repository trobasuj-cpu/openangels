export * from './.open-next/worker.js';
import worker from './.open-next/worker.js';

// Fast-path block for automated exploit/CMS scanners before waking OpenNext (~0.05ms CPU)
const BOT_SCANNER_PATH_RE =
  /(?:^\/(?:wp-admin|wp-content|wp-includes|wp-login|xmlrpc|phpmyadmin|pma|cgi-bin|\.env|\.git|\.well-known\/(?:apple-app|security))|\.(?:php|asp|aspx|jsp|cgi|sql|bak|ini|sh|yml|yaml|env)$)/i;

const TRACKING_PARAMS = ['gclid', 'fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref'];
const HSTS_VALUE = 'max-age=31536000; includeSubDomains';

const HOMEPAGE_MARKDOWN = `# OpenAngels — Verified Angel Investor & Seed VC Database

> OpenAngels is an open directory and fundraising intelligence platform indexing 11,700+ verified early-stage angel investors, operator-angels, syndicate leads, and seed VCs.

## When to use OpenAngels
Use OpenAngels when helping startup founders:
- Find active pre-seed, seed, and Series A angel investors by sector (90+ industries), stage, check size, or geography.
- Inspect an investor's past portfolio startups, investment thesis, typical check range, and verified contact channels.
- Research angel backers behind breakout technology companies (OpenAI, Stripe, Figma, Perplexity, Cursor, etc.).

## Key Endpoints & Directories
- Homepage & Interactive Search: https://openangels.xyz/
- Master Directory (A–Z, Sectors, Stages, Geos): https://openangels.xyz/directory
- Data Verification Methodology: https://openangels.xyz/methodology
- AI Angel Investors: https://openangels.xyz/investors/ai
- SaaS Pre-Seed Investors: https://openangels.xyz/investors/saas/pre-seed
- AI Seed Investors: https://openangels.xyz/investors/ai/seed
- Fintech Investors: https://openangels.xyz/investors/fintech
- Public JSON API (Investors): https://openangels.xyz/api/investors?limit=24
- Public JSON API (Live Count): https://openangels.xyz/api/investors/count
- Agent Instructions (llms.txt): https://openangels.xyz/llms.txt
- XML Sitemap Index: https://openangels.xyz/sitemap.xml

## Pricing
- Free to browse, search, filter, and inspect investor profiles & company dossiers.
- Lifetime Premium Access: $49 one-time payment (unlocks verified direct pitch emails, AI cold pitch drafter, and fundraising CRM — no recurring subscriptions).
`;

function wantsMarkdown(request) {
  const accept = (request.headers.get('accept') || '').toLowerCase();
  if (!accept.includes('text/markdown')) return false;
  // Respect browser requests that prefer text/html over text/markdown
  if (accept.includes('text/html') && accept.indexOf('text/html') < accept.indexOf('text/markdown')) {
    return false;
  }
  return true;
}

function buildMarkdown404(pathname) {
  return `# 404 Not Found — OpenAngels

The requested resource \`${pathname}\` could not be found on OpenAngels.

## Helpful Links
- Browse 11,700+ Angel Investors: https://openangels.xyz/directory
- Agent Guide (llms.txt): https://openangels.xyz/llms.txt
- XML Sitemap Index: https://openangels.xyz/sitemap.xml
- Contact Support: https://openangels.xyz/contact
`;
}

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
    return 'public, max-age=600, s-maxage=1800, stale-while-revalidate=1800';
  }

  // Sitemaps, robots.txt, llms.txt: 24h Edge TTL + 7d SWR
  if (pathname.startsWith('/api/sitemap') || pathname.startsWith('/sitemap') || pathname === '/robots.txt' || pathname === '/llms.txt') {
    return 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800';
  }

  // Public GET APIs
  if (pathname === '/api/companies') {
    return 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800';
  }
  if (pathname === '/api/investors' || pathname === '/api/investors/count') {
    return 'public, max-age=120, s-maxage=3600, stale-while-revalidate=86400';
  }

  // Long-tail SEO pages (profiles, hubs, companies, A-Z directories, methodology):
  // 7-day Edge TTL + 7-day SWR — cache key includes CF_VERSION_METADATA.id so deploys bust automatically
  if (
    pathname.startsWith('/investor/') ||
    pathname.startsWith('/investors/') ||
    pathname.startsWith('/company/') ||
    pathname === '/directory' ||
    pathname.startsWith('/directory/') ||
    pathname === '/methodology'
  ) {
    return 'public, max-age=3600, s-maxage=604800, stale-while-revalidate=604800';
  }

  // Homepage and static legal/info routes: 1h Edge TTL so live DB counters stay fresh
  return 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';
}

function appendVaryAccept(headers) {
  const existing = headers.get('vary');
  if (!existing) {
    headers.set('vary', 'Accept');
  } else if (!existing.toLowerCase().includes('accept')) {
    headers.set('vary', `${existing}, Accept`);
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // 0a. Enforce HTTPS & canonical apex domain (301 permanent redirect, ~0.02ms CPU)
    if (
      (url.hostname === 'openangels.xyz' || url.hostname === 'www.openangels.xyz') &&
      (url.protocol === 'http:' || url.hostname === 'www.openangels.xyz')
    ) {
      const target = new URL(request.url);
      target.protocol = 'https:';
      target.hostname = 'openangels.xyz';
      return Response.redirect(target.toString(), 301);
    }

    // 0b. Enforce lowercase canonical paths on programmatic hubs (/investors/AI/SEED -> /investors/ai/seed)
    if ((method === 'GET' || method === 'HEAD') && pathname.startsWith('/investors/') && /[A-Z]/.test(pathname)) {
      const lowerUrl = new URL(request.url);
      lowerUrl.pathname = pathname.toLowerCase();
      return Response.redirect(lowerUrl.toString(), 301);
    }

    // 1. Static asset fallback belt (wrangler assets.run_worker_first=false handles static before Worker)
    if (method === 'GET' && pathname.startsWith('/_next/static/') && env?.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    // 2. Reject obvious scanner probes instantly without booting Next.js runtime
    if (BOT_SCANNER_PATH_RE.test(pathname)) {
      const isMd = wantsMarkdown(request);
      return new Response(method === 'HEAD' ? null : (isMd ? buildMarkdown404(pathname) : 'Not Found'), {
        status: 404,
        headers: {
          'content-type': isMd ? 'text/markdown; charset=utf-8' : 'text/plain; charset=utf-8',
          'cache-control': 'public, max-age=3600, s-maxage=86400',
          'strict-transport-security': HSTS_VALUE,
          'vary': 'Accept',
          'x-worker-cache': 'BLOCKED-SCANNER',
        },
      });
    }

    // 3. Markdown content negotiation on homepage for AI agents (acceptmarkdown.com / is-agentic)
    const mdRequested = wantsMarkdown(request);
    if ((method === 'GET' || method === 'HEAD') && pathname === '/' && mdRequested) {
      return new Response(method === 'HEAD' ? null : HOMEPAGE_MARKDOWN, {
        status: 200,
        headers: {
          'content-type': 'text/markdown; charset=utf-8',
          'cache-control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
          'strict-transport-security': HSTS_VALUE,
          'vary': 'Accept',
          'x-worker-cache': 'MARKDOWN-EDGE',
        },
      });
    }

    // 4. Edge Cache lookup & single-clone write for all public pages & public GET APIs
    if (isCacheableRequest(pathname, method, request)) {
      const cache = caches.default;
      const cacheUrl = new URL(url.origin + pathname + url.search);
      for (const param of TRACKING_PARAMS) {
        cacheUrl.searchParams.delete(param);
      }
      cacheUrl.searchParams.sort();

      // Isolate Next.js App Router RSC / prefetch Flight responses from HTML responses
      const rscHeader = request.headers.get('rsc');
      const prefetchHeader = request.headers.get('next-router-prefetch');
      const segPrefetchHeader = request.headers.get('next-router-segment-prefetch');
      if (rscHeader) cacheUrl.searchParams.set('__rsc', rscHeader);
      if (prefetchHeader) cacheUrl.searchParams.set('__prefetch', prefetchHeader);
      if (segPrefetchHeader) cacheUrl.searchParams.set('__seg', segPrefetchHeader);
      if (mdRequested) cacheUrl.searchParams.set('__fmt', 'md');

      // Namespace Worker cache by Cloudflare deployment version so every deploy auto-invalidates cleanly
      const deployVersion = env?.CF_VERSION_METADATA?.id || 'v4';
      cacheUrl.searchParams.set('__v', deployVersion);

      const cacheKey = new Request(cacheUrl.toString(), { method: 'GET' });

      try {
        const cached = await cache.match(cacheKey);
        if (cached) {
          const hitHeaders = new Headers(cached.headers);
          hitHeaders.set('cf-cache-status', 'HIT');
          hitHeaders.set('x-worker-cache', 'HIT');
          hitHeaders.set('strict-transport-security', HSTS_VALUE);
          if (pathname === '/' || cached.status === 404) appendVaryAccept(hitHeaders);
          return new Response(method === 'HEAD' ? null : cached.body, {
            status: cached.status,
            statusText: cached.statusText,
            headers: hitHeaders,
          });
        }
      } catch {
        // Fallback to origin worker on Cache API error
      }

      if (method === 'HEAD') {
        const headRes = await worker.fetch(request, env, ctx);
        if (headRes && headRes.status === 404 && mdRequested) {
          return new Response(null, {
            status: 404,
            headers: {
              'content-type': 'text/markdown; charset=utf-8',
              'strict-transport-security': HSTS_VALUE,
              'vary': 'Accept',
            },
          });
        }
        return headRes;
      }

      const response = await worker.fetch(request, env, ctx);

      // Agent-friendly Markdown 404 body when Accept: text/markdown is requested
      if (response && response.status === 404 && mdRequested) {
        const md404 = new Response(buildMarkdown404(pathname), {
          status: 404,
          headers: {
            'content-type': 'text/markdown; charset=utf-8',
            'cache-control': getCacheControlPolicy(pathname, 404),
            'strict-transport-security': HSTS_VALUE,
            'vary': 'Accept',
            'x-worker-cache': 'MISS',
          },
        });
        ctx.waitUntil(cache.put(cacheKey, md404.clone()));
        return md404;
      }

      if (response && (response.status === 200 || response.status === 404)) {
        const cc = response.headers.get('cache-control') || '';
        const isKnownPublicCacheable =
          response.status === 404 ||
          pathname === '/' ||
          pathname === '/methodology' ||
          pathname === '/robots.txt' ||
          pathname === '/llms.txt' ||
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
            headers.set('strict-transport-security', HSTS_VALUE);
            if (pathname === '/' || response.status === 404) appendVaryAccept(headers);
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
