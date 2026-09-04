import os
import sys
import re
import time
import json
import random
import base64
import urllib.parse
import urllib.request
import urllib.error
from typing import List, Dict

# UTF-8 stdout
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# Global cooldown registry
_COOLDOWNS: Dict[str, float] = {}

USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0',
]

def get_random_headers() -> dict:
    return {
        'User-Agent': random.choice(USER_AGENTS),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive'
    }

def is_provider_available(name: str) -> bool:
    now = time.time()
    return now >= _COOLDOWNS.get(name, 0)

def set_provider_cooldown(name: str, seconds: int = 60):
    _COOLDOWNS[name] = time.time() + seconds

# ============================================================
# PROVIDER 1: DuckDuckGo API (ddgs package)
# ============================================================
def _search_ddg_api(query: str, max_results: int = 3, timeout: int = 6) -> List[dict]:
    if not is_provider_available('ddg_api'):
        return []
    try:
        from ddgs import DDGS
        res = list(DDGS().text(query, max_results=max_results))
        if res:
            return [{'title': r.get('title', ''), 'href': r.get('href', ''), 'body': r.get('body', '')} for r in res]
    except Exception as e:
        err = str(e).lower()
        if any(k in err for k in ['202', '429', 'ratelimit', 'vqd']):
            set_provider_cooldown('ddg_api', 90)
    return []

# ============================================================
# PROVIDER 2: DuckDuckGo HTML Direct (No API package dependency)
# ============================================================
def _search_ddg_html(query: str, max_results: int = 3, timeout: int = 6) -> List[dict]:
    if not is_provider_available('ddg_html'):
        return []
    url = "https://html.duckduckgo.com/html/"
    data = urllib.parse.urlencode({'q': query}).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=get_random_headers())
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            results = []
            for block in html.split('class="result results_links'):
                url_match = re.search(r'<a class="result__url"[^>]*href="([^"]+)"', block)
                title_match = re.search(r'<a[^>]*class="result__snippet"[^>]*>(.*?)</a>', block)
                name_match = re.search(r'<a[^>]*class="result__a"[^>]*>(.*?)</a>', block)
                if url_match:
                    raw_url = url_match.group(1).strip()
                    if 'uddg=' in raw_url:
                        qs = urllib.parse.parse_qs(urllib.parse.urlparse(raw_url).query)
                        clean_url = qs.get('uddg', [raw_url])[0]
                    else:
                        clean_url = raw_url
                    
                    title = re.sub(r'<[^>]+>', '', name_match.group(1)).strip() if name_match else ''
                    snippet = re.sub(r'<[^>]+>', '', title_match.group(1)).strip() if title_match else ''
                    results.append({'title': title, 'href': clean_url, 'body': snippet})
                    if len(results) >= max_results:
                        break
            return results
    except Exception:
        set_provider_cooldown('ddg_html', 60)
    return []

# ============================================================
# PROVIDER 3: Bing Search with Instant Base64 URL Decoder
# ============================================================
def _search_bing(query: str, max_results: int = 3, timeout: int = 6) -> List[dict]:
    if not is_provider_available('bing'):
        return []
    encoded = urllib.parse.quote_plus(query)
    url = f"https://www.bing.com/search?q={encoded}&setlang=en-US"
    req = urllib.request.Request(url, headers=get_random_headers())
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            results = []
            for m in re.finditer(r'<li class="b_algo"[^>]*>(.*?)</li>', html, re.DOTALL):
                block = m.group(1)
                link_m = re.search(r'<a\s+[^>]*href="([^"]+)"[^>]*>(.*?)</a>', block)
                if not link_m:
                    continue
                raw_href = link_m.group(1)
                title = re.sub(r'<[^>]+>', '', link_m.group(2)).strip()
                
                # Extract snippet
                snippet_m = re.search(r'<p[^>]*>(.*?)</p>', block)
                snippet = re.sub(r'<[^>]+>', '', snippet_m.group(1)).strip() if snippet_m else ''

                # Decode real destination URL if it's a Bing redirect /ck/a?
                clean_href = raw_href
                if 'bing.com/ck/a' in raw_href:
                    try:
                        parsed = urllib.parse.urlparse(raw_href)
                        qs = urllib.parse.parse_qs(parsed.query)
                        u_val = qs.get('u', [''])[0]
                        if u_val.startswith('a1'):
                            b64_str = u_val[2:]
                            padded = b64_str + '=' * ((4 - len(b64_str) % 4) % 4)
                            clean_href = base64.urlsafe_b64decode(padded).decode('utf-8', errors='ignore')
                    except Exception:
                        pass

                if clean_href and clean_href.startswith('http') and 'bing.com' not in clean_href:
                    results.append({'title': title, 'href': clean_href, 'body': snippet})
                    if len(results) >= max_results:
                        break
            return results
    except urllib.error.HTTPError as e:
        if e.code == 429:
            set_provider_cooldown('bing', 120)
    except Exception:
        pass
    return []

# ============================================================
# PROVIDER 4: Qwant Web API
# ============================================================
def _search_qwant(query: str, max_results: int = 3, timeout: int = 6) -> List[dict]:
    if not is_provider_available('qwant'):
        return []
    encoded = urllib.parse.quote_plus(query)
    url = f"https://api.qwant.com/v3/search/web?q={encoded}&count={max_results}&locale=en_US"
    headers = get_random_headers()
    headers['User-Agent'] = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            items = data.get('data', {}).get('result', {}).get('items', {}).get('mainline', [])
            results = []
            for item in items:
                for sub in item.get('items', []):
                    if sub.get('type') == 'web':
                        results.append({
                            'title': sub.get('title', ''),
                            'href': sub.get('url', ''),
                            'body': sub.get('desc', '')
                        })
                        if len(results) >= max_results:
                            return results
            return results
    except Exception:
        set_provider_cooldown('qwant', 60)
    return []

# ============================================================
# UNIFIED ROTATING SEARCH INTERFACE
# ============================================================
def search_multi_provider(query: str, max_results: int = 3, timeout: int = 8) -> List[dict]:
    """
    Unified multi-provider search with automatic fallback:
    1. DuckDuckGo API (fastest)
    2. DuckDuckGo Direct HTML (bypasses API rate-limits)
    3. Bing HTML (bypasses DDG blocks, instant base64 URL decoding)
    4. Qwant API (independent privacy engine)
    """
    if not query or not query.strip():
        return []

    providers = [
        ('DDG API', _search_ddg_api),
        ('DDG HTML', _search_ddg_html),
        ('Bing', _search_bing),
        ('Qwant', _search_qwant)
    ]

    for name, func in providers:
        try:
            results = func(query, max_results=max_results, timeout=timeout)
            if results:
                return results
        except Exception:
            continue

    # Soft pause before finishing if everything failed
    time.sleep(0.2)
    return []

if __name__ == "__main__":
    print("Testing Unified Multi-Provider Search Rotation Engine...")
    test_queries = [
        ('"Marc Andreessen" site:linkedin.com/in/', 2),
        ('Paul Graham Y Combinator investor', 2),
        ('"Naval Ravikant" email contact', 2)
    ]
    for q, count in test_queries:
        print(f"\n[Query] {q}")
        res = search_multi_provider(q, max_results=count)
        print(f"Found: {len(res)} results")
        for r in res:
            print(f"  • {r['href']}")
