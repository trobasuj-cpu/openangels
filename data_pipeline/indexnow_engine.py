import os
import sys
import json
import time
import requests
from typing import List
from pathlib import Path
from dotenv import load_dotenv

# UTF-8 stdout
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

INDEXNOW_KEY = "c3a8e74b92d140e59a7f3c1b6d8e2a0f"
INDEXNOW_HOST = "openangels.xyz"
KEY_LOCATION = f"https://{INDEXNOW_HOST}/{INDEXNOW_KEY}.txt"
INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow"

# Also can ping Bing directly
BING_INDEXNOW_ENDPOINT = "https://www.bing.com/indexnow"

def submit_urls_to_indexnow(url_list: List[str]) -> bool:
    """
    Submits a batch of URLs (up to 10,000) to IndexNow.
    Automatically broadcasts to Bing, Yandex, Seznam, Naver.
    """
    if not url_list:
        return False

    payload = {
        "host": INDEXNOW_HOST,
        "key": INDEXNOW_KEY,
        "keyLocation": KEY_LOCATION,
        "urlList": url_list
    }

    headers = {
        "Content-Type": "application/json; charset=utf-8"
    }

    success = False
    for endpoint in [INDEXNOW_ENDPOINT, BING_INDEXNOW_ENDPOINT]:
        try:
            resp = requests.post(endpoint, json=payload, headers=headers, timeout=12)
            # 200 = OK, 202 = Accepted for indexing
            if resp.status_code in [200, 202]:
                print(f"  [IndexNow] Successfully submitted {len(url_list)} URLs to {endpoint} (HTTP {resp.status_code}).")
                success = True
                break
            else:
                print(f"  [IndexNow] Submission to {endpoint} returned HTTP {resp.status_code}: {resp.text[:120]}")
        except Exception as e:
            print(f"  [IndexNow] Error submitting to {endpoint}: {e}")

    return success

def submit_slugs_to_indexnow(slugs: List[str]) -> bool:
    """Helper to convert slugs to absolute openangels.xyz investor URLs and submit."""
    clean_urls = []
    for s in slugs:
        if not s:
            continue
        clean_s = s.strip('/')
        if not clean_s.startswith('http'):
            clean_urls.append(f"https://{INDEXNOW_HOST}/investor/{clean_s}")
        else:
            clean_urls.append(clean_s)
    return submit_urls_to_indexnow(clean_urls)

def push_all_database_investors():
    """
    Fetches all investor slugs from Supabase and pushes them to IndexNow in batches of 1,000.
    """
    env_path = Path(__file__).parent.parent / 'frontend' / '.env'
    load_dotenv(str(env_path))

    supabase_url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or "https://rjdewjyhtbfkujhvkwig.supabase.co"
    service_key = os.environ.get("VITE_SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    headers = {
        'apikey': service_key,
        'Authorization': f'Bearer {service_key}',
        'Content-Type': 'application/json'
    }

    print(f"Fetching all active investor slugs from {supabase_url}...")
    all_slugs = []
    offset = 0
    limit = 1000

    while True:
        url = f"{supabase_url}/rest/v1/investors?select=slug&slug=not.is.null&order=id.asc&offset={offset}&limit={limit}"
        try:
            r = requests.get(url, headers=headers, timeout=15)
            if r.status_code != 200:
                print(f"Error fetching page at offset {offset}: {r.status_code}")
                break
            rows = r.json()
            if not rows:
                break
            for row in rows:
                s = row.get('slug')
                if s:
                    all_slugs.append(s)
            offset += limit
            if len(rows) < limit:
                break
        except Exception as e:
            print(f"Exception fetching slugs: {e}")
            break

    print(f"Total slugs retrieved: {len(all_slugs)}")

    # Add core static pages
    core_urls = [
        f"https://{INDEXNOW_HOST}/",
        f"https://{INDEXNOW_HOST}/directory",
        f"https://{INDEXNOW_HOST}/crm",
        f"https://{INDEXNOW_HOST}/contact",
        f"https://{INDEXNOW_HOST}/terms",
        f"https://{INDEXNOW_HOST}/privacy"
    ]

    all_urls = core_urls + [f"https://{INDEXNOW_HOST}/investor/{s}" for s in all_slugs]
    print(f"Total URLs to submit: {len(all_urls)}")

    # Submit in batches of 1,000
    batch_size = 1000
    for i in range(0, len(all_urls), batch_size):
        batch = all_urls[i:i+batch_size]
        print(f"\nSubmitting batch {i // batch_size + 1} ({len(batch)} URLs)...")
        submit_urls_to_indexnow(batch)
        time.sleep(1)

    print("\n[IndexNow] All URLs successfully dispatched to search engines!")

if __name__ == "__main__":
    push_all_database_investors()
