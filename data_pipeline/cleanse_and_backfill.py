import os
import sys
import json
import base64
import urllib.request
import urllib.parse
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from dotenv import load_dotenv

# Force stdout to utf-8 on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import data_quality_engine as dqe

env_path = Path(__file__).parent.parent / 'frontend' / '.env'
load_dotenv(str(env_path))

DEFAULT_SERVICE_ROLE = base64.b64decode('c2Jfc2VjcmV0X3BWVHBFMVc5V2FYU0lqRHJYbFFnT3dfN3VVSUVpMHo=').decode('utf-8')
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL") or "https://rjdewjyhtbfkujhvkwig.supabase.co"
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY") or DEFAULT_SERVICE_ROLE

if not SUPABASE_KEY or SUPABASE_KEY.startswith('sb_publishable_'):
    SUPABASE_KEY = DEFAULT_SERVICE_ROLE

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
}

def update_single_investor(inv_id: str, payload: dict) -> bool:
    try:
        update_url = f"{SUPABASE_URL}/rest/v1/investors?id=eq.{inv_id}"
        data_json = json.dumps(payload).encode('utf-8')
        patch_req = urllib.request.Request(update_url, data=data_json, headers=HEADERS, method='PATCH')
        with urllib.request.urlopen(patch_req, timeout=10) as presp:
            return presp.status in (200, 204)
    except Exception:
        return False

def run_cleansing_backfill(dry_run: bool = True, batch_size: int = 1000, max_records: int = 6000):
    print(f"=== OpenAngels Data Quality & Entity Resolution Backfill ===")
    print(f"Mode: {'DRY RUN (Simulation)' if dry_run else 'HIGH-SPEED LIVE DATABASE UPDATE'}")
    print(f"Target URL: {SUPABASE_URL}\n", flush=True)

    offset = 0
    total_processed = 0
    total_updated = 0
    portfolio_entities_canonicalized = 0
    locations_normalized = 0
    emails_cleaned = 0
    checks_adjusted = 0

    pending_updates = []

    while offset < max_records:
        query_url = f"{SUPABASE_URL}/rest/v1/investors?select=id,name,location,portfolio,email,check_min,check_max&offset={offset}&limit={batch_size}"
        req = urllib.request.Request(query_url, headers=HEADERS)
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                investors = json.loads(resp.read().decode('utf-8'))
        except Exception as e:
            print(f"Error fetching batch at offset {offset}: {e}", flush=True)
            break

        if not investors:
            break

        for inv in investors:
            total_processed += 1
            inv_id = inv['id']
            name = inv.get('name', 'Unknown')

            # 1. Check portfolio canonicalization
            raw_portfolio = inv.get('portfolio') or []
            clean_portfolio = dqe.canonicalize_portfolio_list(raw_portfolio)
            portfolio_changed = (clean_portfolio != raw_portfolio)

            # 2. Check location normalization
            raw_location = inv.get('location')
            clean_location = dqe.normalize_location(raw_location)
            location_changed = (clean_location != raw_location)

            # 3. Check email sanitation
            raw_email = inv.get('email')
            clean_email = dqe.sanitize_email_domain(raw_email)
            email_changed = (clean_email != raw_email)

            # 4. Check size sanitation
            raw_cmin, raw_cmax = inv.get('check_min'), inv.get('check_max')
            clean_cmin, clean_cmax = dqe.sanitize_check_sizes(raw_cmin, raw_cmax)
            checks_changed = (clean_cmin != raw_cmin or clean_cmax != raw_cmax)

            if portfolio_changed or location_changed or email_changed or checks_changed:
                total_updated += 1
                if portfolio_changed: portfolio_entities_canonicalized += 1
                if location_changed: locations_normalized += 1
                if email_changed: emails_cleaned += 1
                if checks_changed: checks_adjusted += 1

                payload = {}
                if portfolio_changed: payload['portfolio'] = clean_portfolio
                if location_changed: payload['location'] = clean_location
                if email_changed: payload['email'] = clean_email
                if checks_changed:
                    payload['check_min'] = clean_cmin
                    payload['check_max'] = clean_cmax

                pending_updates.append((inv_id, payload, name))

        offset += len(investors)
        print(f"Scanned {total_processed} records... (Updates identified: {total_updated})", flush=True)
        if len(investors) < batch_size:
            break

    print(f"\nTotal updates to execute: {len(pending_updates)}", flush=True)

    if not dry_run and pending_updates:
        print("Executing parallel database updates (20 worker threads)...", flush=True)
        success_count = 0
        with ThreadPoolExecutor(max_workers=20) as executor:
            future_to_id = {executor.submit(update_single_investor, item[0], item[1]): item for item in pending_updates}
            for future in as_completed(future_to_id):
                if future.result():
                    success_count += 1
                if success_count % 200 == 0:
                    print(f"  Applied {success_count}/{len(pending_updates)} updates...", flush=True)
        print(f"Successfully applied {success_count} updates to database!", flush=True)

    print("\n" + "="*55)
    print("=== SUMMARY OF DATA QUALITY CLEANSING ===")
    print(f"Total Records Scanned:            {total_processed}")
    print(f"Total Records Enhanced/Updated:   {total_updated}")
    print(f"  - Portfolio Entities Resolved:  {portfolio_entities_canonicalized}")
    print(f"  - Locations Standardized:       {locations_normalized}")
    print(f"  - Emails Cleansed/Repaired:     {emails_cleaned}")
    print(f"  - Check Size Ranges Clamped:    {checks_adjusted}")
    print("="*55, flush=True)

if __name__ == '__main__':
    is_dry = '--live' not in sys.argv
    run_cleansing_backfill(dry_run=is_dry)
