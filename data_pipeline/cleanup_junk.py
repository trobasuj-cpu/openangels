"""
Cleanup script: removes junk entries from investors_secure
and clears NOT_FOUND email values.
"""
import os
import json
import urllib.request
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).parent.parent / 'frontend' / '.env'
load_dotenv(str(env_path))

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_SERVICE_ROLE_KEY")

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

# Known junk names from today's scraper run
JUNK_SLUGS = [
    'angel-investors-california-connect-with-investors',
    'angel-investor-business-get-funded-angel-investors',
    'transactglobal-results-on-x-live-posts-updates',
    'the-seed-100-the-best-early-stage-investors',
]

def delete_by_slug(slug):
    url = f"{SUPABASE_URL}/rest/v1/investors_secure?slug=eq.{slug}"
    req = urllib.request.Request(url, headers=HEADERS, method='DELETE')
    try:
        with urllib.request.urlopen(req) as res:
            print(f"  [x] Deleted '{slug}' (status {res.status})")
            return True
    except Exception as e:
        print(f"  [!] Failed to delete '{slug}': {e}")
        return False

def clear_not_found_emails():
    """Find all investors with email='NOT_FOUND' and clear them."""
    url = f"{SUPABASE_URL}/rest/v1/investors_secure?email=eq.NOT_FOUND&select=id,name"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode('utf-8'))
            print(f"\nFound {len(data)} investors with email='NOT_FOUND'")
            for inv in data:
                patch_url = f"{SUPABASE_URL}/rest/v1/investors_secure?id=eq.{inv['id']}"
                patch_req = urllib.request.Request(
                    patch_url,
                    data=json.dumps({"email": None}).encode('utf-8'),
                    headers=HEADERS,
                    method='PATCH'
                )
                try:
                    with urllib.request.urlopen(patch_req):
                        print(f"  [OK] Cleared NOT_FOUND for: {inv.get('name', inv['id'])}")
                except Exception as e:
                    print(f"  [!] Failed to clear for {inv['id']}: {e}")
    except Exception as e:
        print(f"Error fetching NOT_FOUND entries: {e}")

if __name__ == "__main__":
    print("=== Cleaning up junk entries ===\n")
    
    print("1. Removing known junk records...")
    for slug in JUNK_SLUGS:
        delete_by_slug(slug)
    
    print("\n2. Clearing NOT_FOUND email values...")
    clear_not_found_emails()
    
    print("\n=== Cleanup complete! ===")
