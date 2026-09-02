import os
import sys
import json
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
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

def process_single_investor(inv):
    inv_id = inv['id']
    name = inv.get('name') or 'Investor'
    tw_url = inv.get('twitter_url')
    current_av = inv.get('avatar_url')
    slug = inv.get('slug') or inv_id

    # If already cached in Supabase Storage, skip
    if current_av and 'supabase.co/storage' in current_av:
        return {'status': 'already_cached', 'name': name, 'id': inv_id}

    # Resolve and upload avatar to Supabase Storage
    cached_url = ase.resolve_and_cache_avatar(
        name=name,
        twitter_url=tw_url,
        candidate_avatar_url=current_av,
        identifier=f"{slug}_{inv_id[:6]}"
    )

    if not cached_url:
        return {'status': 'no_image', 'name': name, 'id': inv_id}

    # Update database row with Supabase Storage URL
    patch_payload = json.dumps({'avatar_url': cached_url}).encode('utf-8')
    patch_req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/investors?id=eq.{inv_id}",
        data=patch_payload,
        headers=HEADERS,
        method='PATCH'
    )

    try:
        with urllib.request.urlopen(patch_req, timeout=8) as p_res:
            if p_res.status in (200, 204):
                return {'status': 'success', 'name': name, 'url': cached_url, 'id': inv_id}
            return {'status': 'db_error', 'name': name, 'id': inv_id, 'code': p_res.status}
    except Exception as err:
        return {'status': 'db_error', 'name': name, 'id': inv_id, 'error': str(err)}

def migrate_all_avatars(batch_size=500, max_workers=8):
    print("="*65)
    print("🚀 OpenAngels Full-Database Avatar Storage Migration Engine")
    print("="*65)

    ase.ensure_bucket_exists()

    total_cached = 0
    total_processed = 0
    offset = 0

    while True:
        # Query next chunk of investors
        query_url = (
            f"{SUPABASE_URL}/rest/v1/investors?"
            f"select=id,name,twitter_url,avatar_url,slug&"
            f"order=id.asc&"
            f"offset={offset}&"
            f"limit={batch_size}"
        )

        req = urllib.request.Request(query_url, headers=HEADERS)
        try:
            with urllib.request.urlopen(req, timeout=15) as res:
                batch = json.loads(res.read().decode('utf-8'))
        except Exception as e:
            print(f"❌ Error fetching chunk offset={offset}: {e}")
            break

        if not batch:
            print("✅ All database records processed!")
            break

        print(f"\n📦 Processing batch {offset + 1} - {offset + len(batch)} ({len(batch)} records)...", flush=True)

        # Process batch concurrently with ThreadPoolExecutor
        batch_cached = 0
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = {executor.submit(process_single_investor, inv): inv for inv in batch}
            for future in as_completed(futures):
                total_processed += 1
                try:
                    res = future.result()
                    if res['status'] == 'success':
                        batch_cached += 1
                        total_cached += 1
                        print(f"  [+] [{total_processed}] ✅ Cached: {res['name']}", flush=True)
                    elif res['status'] == 'already_cached':
                        pass
                    elif res['status'] == 'no_image':
                        pass
                except Exception as ex:
                    pass

        print(f"   ↳ Batch summary: +{batch_cached} avatars newly cached (Total cached so far: {total_cached})", flush=True)
        offset += len(batch)
        time.sleep(0.5)

    print("\n" + "="*65)
    print(f"🎉 FULL MIGRATION COMPLETE!")
    print(f"   Total records scanned : {total_processed}")
    print(f"   Total avatars in CDN  : {total_cached}")
    print("="*65)

if __name__ == "__main__":
    workers = int(sys.argv[1]) if len(sys.argv) > 1 else 8
    migrate_all_avatars(batch_size=500, max_workers=workers)
