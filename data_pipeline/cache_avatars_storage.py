import os
import sys
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path
from dotenv import load_dotenv

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import avatar_storage_engine as ase

# UTF-8 stdout
sys.stdout.reconfigure(encoding='utf-8')

env_path = Path(__file__).parent.parent / 'frontend' / '.env'
load_dotenv(str(env_path))

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or "https://rjdewjyhtbfkujhvkwig.supabase.co"
SUPABASE_KEY = ase.SUPABASE_KEY

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}

def migrate_avatars_to_storage(batch_limit=100, pause_delay=0.3):
    print("="*60)
    print("🚀 OpenAngels Supabase Storage Avatar Cacher")
    print("="*60)
    
    ase.ensure_bucket_exists()
    
    # Query investors whose avatar is not yet in Supabase Storage
    query_url = (
        f"{SUPABASE_URL}/rest/v1/investors?"
        f"or=(avatar_url.not.ilike.*supabase.co*,avatar_url.is.null)&"
        f"or=(twitter_url.not.is.null,avatar_url.not.is.null)&"
        f"select=id,name,twitter_url,avatar_url,slug&"
        f"order=verified.desc,created_at.asc&"
        f"limit={batch_limit}"
    )
    
    req = urllib.request.Request(query_url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            investors = json.loads(res.read().decode('utf-8'))
    except Exception as e:
        print(f"❌ Error fetching candidates from Supabase: {e}")
        return

    print(f"Found {len(investors)} candidates to cache into Supabase Storage.\n")
    
    cached_count = 0
    skipped_count = 0
    
    for idx, inv in enumerate(investors, 1):
        inv_id = inv['id']
        name = inv.get('name') or 'Investor'
        tw_url = inv.get('twitter_url')
        current_av = inv.get('avatar_url')
        slug = inv.get('slug') or inv_id

        # Skip if already cached
        if current_av and 'supabase.co/storage' in current_av:
            skipped_count += 1
            continue

        print(f"[{idx}/{len(investors)}] {name}...", end="", flush=True)
        
        # Download and cache into Supabase Storage
        cached_url = ase.resolve_and_cache_avatar(
            name=name,
            twitter_url=tw_url,
            candidate_avatar_url=current_av,
            identifier=f"{slug}_{inv_id[:6]}"
        )
        
        if not cached_url:
            print(" ⚠️  No image available (will use initials badge).")
            continue
            
        # Update database with new Supabase Storage URL
        patch_payload = json.dumps({'avatar_url': cached_url}).encode('utf-8')
        patch_req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/investors?id=eq.{inv_id}",
            data=patch_payload,
            headers=HEADERS,
            method='PATCH'
        )
        
        try:
            with urllib.request.urlopen(patch_req, timeout=6) as p_res:
                if p_res.status in (200, 204):
                    cached_count += 1
                    print(f" ✅ Cached: {cached_url.split('/')[-1]}")
                else:
                    print(f" ⚠️  DB update returned status {p_res.status}")
        except Exception as err:
            print(f" ❌ DB update error: {err}")
            
        time.sleep(pause_delay)

    print("\n" + "="*60)
    print(f"SUMMARY: Successfully cached {cached_count} avatars to Supabase Storage! (Processed {len(investors)})")
    print("="*60)

if __name__ == "__main__":
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 100
    migrate_avatars_to_storage(batch_limit=limit)
