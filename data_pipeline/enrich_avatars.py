import os
import sys
import json
import time
import re
import urllib.parse
import urllib.request
from pathlib import Path
from dotenv import load_dotenv

# Force stdout encoding to UTF-8
sys.stdout.reconfigure(encoding='utf-8')

env_path = Path(__file__).parent.parent / 'frontend' / '.env'
load_dotenv(str(env_path))

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_SERVICE_ROLE_KEY")

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}

def get_twitter_username(url):
    if not url:
        return None
    url = url.split('?')[0].rstrip('/')
    parts = url.split('/')
    if len(parts) > 0:
        username = parts[-1]
        if username and username.lower() not in ['nfx', 'terms', 'privacy', 'intent', 'search']:
            return username
    return None

def extract_domain(url):
    if not url:
        return None
    try:
        if not url.startswith('http'):
            url = 'http://' + url
        parsed = urllib.parse.urlparse(url)
        netloc = parsed.netloc.lower()
        if netloc.startswith('www.'):
            netloc = netloc[4:]
        if any(x in netloc for x in ['linkedin.com', 'twitter.com', 'x.com', 'google.com', 'medium.com', 'substack.com']):
            return None
        return netloc if '.' in netloc else None
    except Exception:
        return None

def verify_image_url(url):
    """Checks if image URL returns HTTP 200 and image content type."""
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'}, method='HEAD')
        with urllib.request.urlopen(req, timeout=4) as res:
            ct = res.headers.get('Content-Type', '')
            if res.status == 200 and ('image' in ct or 'octet-stream' in ct or res.length > 500):
                return True
    except Exception:
        pass
    return False

def enrich_avatars(batch_size=100):
    print("=== Starting Investor Avatar Enrichment Pipeline ===")
    
    # 1. Fetch investors without avatar_url
    query_url = f"{SUPABASE_URL}/rest/v1/investors_secure?avatar_url=is.null&select=id,name,twitter_url,website,linkedin_url&limit={batch_size}"
    req = urllib.request.Request(query_url, headers=HEADERS)
    
    try:
        with urllib.request.urlopen(req) as res:
            investors = json.loads(res.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching investors from Supabase: {e}")
        return

    print(f"Found {len(investors)} investors without avatar_url to enrich.\n")

    updated_count = 0
    for idx, inv in enumerate(investors, 1):
        inv_id = inv['id']
        name = inv['name']
        tw_url = inv.get('twitter_url')
        web_url = inv.get('website')

        avatar_candidate = None
        source = None

        # Method 1: Twitter Avatar
        tw_user = get_twitter_username(tw_url)
        if tw_user:
            candidate = f"https://unavatar.io/x/{tw_user}?ttl=30d"
            avatar_candidate = candidate
            source = f"Twitter (@{tw_user})"

        # Method 2: Clearbit Logo from personal website
        if not avatar_candidate and web_url:
            domain = extract_domain(web_url)
            if domain:
                candidate = f"https://logo.clearbit.com/{domain}"
                avatar_candidate = candidate
                source = f"Domain ({domain})"

        if not avatar_candidate:
            print(f"[{idx}/{len(investors)}] {name}: No Twitter/Website found. Skipping.")
            continue

        print(f"[{idx}/{len(investors)}] {name} ({source})...", end="", flush=True)

        # Update Supabase with valid candidate
        patch_payload = json.dumps({'avatar_url': avatar_candidate}).encode('utf-8')
        patch_req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/investors_secure?id=eq.{inv_id}",
            data=patch_payload,
            headers=HEADERS,
            method='PATCH'
        )

        try:
            with urllib.request.urlopen(patch_req) as p_res:
                if p_res.status in (200, 204):
                    updated_count += 1
                    print(f" ✅ Avatar Set!")
        except Exception as e:
            print(f" ❌ Patch error: {e}")

        time.sleep(0.1)

    print("\n" + "="*50)
    print(f"SUMMARY: Successfully enriched {updated_count} investor avatars out of {len(investors)} processed.")
    print("="*50)

if __name__ == "__main__":
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 200
    enrich_avatars(batch_size=limit)
