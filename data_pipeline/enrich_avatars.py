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

def fetch_direct_twitter_avatar(username):
    """Fetches direct pbs.twimg.com CDN avatar URL using Microlink API."""
    try:
        url = f"https://api.microlink.io/?url=https://x.com/{username}"
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode('utf-8'))
            img_url = data.get('data', {}).get('image', {}).get('url')
            if img_url and 'twimg.com' in img_url:
                return img_url
    except Exception:
        pass
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

def enrich_avatars(batch_size=50):
    print("=== Starting Direct CDN Investor Avatar Enrichment ===")
    
    # Query investors with unavatar or null avatar_url
    query_url = f"{SUPABASE_URL}/rest/v1/investors_secure?or=(avatar_url.is.null,avatar_url.ilike.*unavatar.io*)&select=id,name,twitter_url,website,linkedin_url&limit={batch_size}"
    req = urllib.request.Request(query_url, headers=HEADERS)
    
    try:
        with urllib.request.urlopen(req) as res:
            investors = json.loads(res.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching investors from Supabase: {e}")
        return

    print(f"Found {len(investors)} investors to enrich with direct CDN avatars.\n")

    updated_count = 0
    for idx, inv in enumerate(investors, 1):
        inv_id = inv['id']
        name = inv['name']
        tw_url = inv.get('twitter_url')
        web_url = inv.get('website')

        avatar_candidate = None
        source = None

        # Method 1: Direct Twitter pbs.twimg.com Avatar
        tw_user = get_twitter_username(tw_url)
        if tw_user:
            candidate = fetch_direct_twitter_avatar(tw_user)
            if candidate:
                avatar_candidate = candidate
                source = f"Direct Twitter CDN ({tw_user})"

        # Method 2: Clearbit Logo from domain
        if not avatar_candidate and web_url:
            domain = extract_domain(web_url)
            if domain:
                candidate = f"https://logo.clearbit.com/{domain}"
                avatar_candidate = candidate
                source = f"Domain ({domain})"

        if not avatar_candidate:
            print(f"[{idx}/{len(investors)}] {name}: No direct avatar found.")
            continue

        print(f"[{idx}/{len(investors)}] {name} -> {source}...", end="", flush=True)

        # Update Supabase
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
                    print(f" ✅ Saved!")
        except Exception as e:
            print(f" ❌ Error: {e}")

        time.sleep(0.3)

    print("\n" + "="*50)
    print(f"SUMMARY: Successfully updated {updated_count} direct CDN avatars out of {len(investors)} processed.")
    print("="*50)

if __name__ == "__main__":
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 50
    enrich_avatars(batch_size=limit)
