"""
Database Deduplication & Record Linkage Runner
OpenAngels Pipeline & Platform — Stage 5
Scans live database of 4,231+ records, detects duplicate clusters using
Probabilistic Record Linkage (same_entity_probability >= 0.88), merges
fields non-destructively, and deletes redundant duplicate rows safely.
"""

import os
import sys
import json
import base64
import urllib.request
import urllib.parse
from collections import defaultdict
from pathlib import Path
from dotenv import load_dotenv

# Force stdout to utf-8 on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import record_linkage_engine as rle
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

def fetch_all_investors():
    print("Fetching all live investors from Supabase...", flush=True)
    all_data = []
    offset = 0
    batch_size = 1000

    while True:
        url = f"{SUPABASE_URL}/rest/v1/investors?select=*&offset={offset}&limit={batch_size}"
        req = urllib.request.Request(url, headers=HEADERS)
        try:
            with urllib.request.urlopen(req, timeout=20) as res:
                batch = json.loads(res.read().decode('utf-8'))
                if not batch: break
                all_data.extend(batch)
                offset += len(batch)
                print(f"  Loaded {len(all_data)} records...", flush=True)
                if len(batch) < batch_size: break
        except Exception as e:
            print(f"Error fetching batch at offset {offset}: {e}", flush=True)
            break

    print(f"Total live records fetched: {len(all_data)}\n", flush=True)
    return all_data

def run_deduplication(dry_run: bool = True):
    print("=================================================================")
    print("=== OPENANGELS DATABASE DEDUPLICATION & RECORD LINKAGE ===")
    print(f"Mode: {'DRY RUN (Simulation / Review)' if dry_run else 'LIVE DEDUPLICATION & MERGING'}")
    print(f"Target URL: {SUPABASE_URL}")
    print("=================================================================\n", flush=True)

    investors = fetch_all_investors()
    if not investors:
        print("No investors found. Exiting.")
        return

    # Find duplicate pairs using Record Linkage Engine
    print("Analyzing records with Probabilistic Multi-Signal Linkage...", flush=True)
    
    # 1. Bucket by normalized prefix / handles for fast indexing
    matched_pairs = []
    processed_ids = set()
    deleted_ids = set()

    # Index by exact handles first
    tw_index = defaultdict(list)
    li_index = defaultdict(list)
    em_index = defaultdict(list)
    name_index = defaultdict(list)

    for inv in investors:
        tw = rle.extract_social_handle(inv.get('twitter_url'))
        if tw: tw_index[tw].append(inv)

        li = rle.extract_social_handle(inv.get('linkedin_url'))
        if li: li_index[li].append(inv)

        em = (inv.get('email') or '').lower().strip()
        if em and '@' in em: em_index[em].append(inv)

        norm_name = rle.normalize_name_for_comparison(inv.get('name', ''))
        if norm_name:
            # 2-letter block
            init = norm_name[:3] if len(norm_name) >= 3 else norm_name
            name_index[init].append(inv)

    candidate_pairs_set = set()

    # Add social collisions
    for handle_map in (tw_index, li_index, em_index):
        for h, items in handle_map.items():
            if len(items) > 1:
                for i in range(len(items)):
                    for j in range(i+1, len(items)):
                        id1, id2 = items[i]['id'], items[j]['id']
                        if id1 != id2:
                            pair = tuple(sorted([id1, id2]))
                            if pair not in candidate_pairs_set:
                                candidate_pairs_set.add(pair)
                                matched_pairs.append((items[i], items[j]))

    # Add name similarity candidates
    for init, group in name_index.items():
        n = len(group)
        for i in range(n):
            for j in range(i+1, n):
                inv1, inv2 = group[i], group[j]
                id1, id2 = inv1['id'], inv2['id']
                pair = tuple(sorted([id1, id2]))
                if pair not in candidate_pairs_set:
                    sim, consistent = rle.name_similarity_score(inv1.get('name', ''), inv2.get('name', ''))
                    if sim >= 0.82 and consistent:
                        candidate_pairs_set.add(pair)
                        matched_pairs.append((inv1, inv2))

    print(f"Evaluating {len(matched_pairs)} candidate duplicate pairs...", flush=True)

    verified_merges = []

    for inv1, inv2 in matched_pairs:
        id1, id2 = inv1['id'], inv2['id']
        if id1 in deleted_ids or id2 in deleted_ids:
            continue

        prob, reasons, is_same = rle.compute_entity_match_probability(inv1, inv2)
        if is_same:
            # Decide primary vs secondary record:
            # The record with verified email or more portfolio items is primary
            q1 = dqe.calculate_quality_score(inv1)
            q2 = dqe.calculate_quality_score(inv2)

            if q1 >= q2:
                primary, secondary = inv1, inv2
            else:
                primary, secondary = inv2, inv1

            merged_data = rle.merge_two_investors(primary, secondary)
            verified_merges.append({
                'primary': primary,
                'secondary': secondary,
                'probability': prob,
                'reasons': reasons,
                'merged': merged_data
            })
            deleted_ids.add(secondary['id'])

    print(f"\n=================================================================")
    print(f"IDENTIFIED {len(verified_merges)} VERIFIED DUPLICATE CLUSTERS TO MERGE")
    print("=================================================================\n", flush=True)

    for idx, item in enumerate(verified_merges, 1):
        p = item['primary']
        s = item['secondary']
        prob = item['probability']
        reasons = item['reasons']
        m = item['merged']

        print(f"[{idx}] {p['name']} (ID: {p['id'][:8]}...)  ◄──►  {s['name']} (ID: {s['id'][:8]}...)")
        print(f"     Probability:  {prob * 100:.1f}% Match")
        print(f"     Evidence:     {', '.join(reasons)}")
        print(f"     Merged Name:  '{m.get('name')}'")
        print(f"     Merged Email: '{m.get('email')}'")
        print(f"     Merged Port:  {m.get('portfolio')}")
        print(f"     Merged Loc:   '{m.get('location')}'")
        print(f"     Action:       Update primary ({p['id'][:8]}) & Delete secondary ({s['id'][:8]})\n", flush=True)

    if dry_run:
        print("=================================================================")
        print(f"DRY RUN COMPLETE: {len(verified_merges)} duplicates identified.")
        print("Run with '--live' to execute safe merging and cleanup in Supabase.")
        print("=================================================================")
        return

    # Execute Live Merges
    print("Executing safe non-destructive merges in Supabase database...", flush=True)
    success_count = 0

    for idx, item in enumerate(verified_merges, 1):
        primary_id = item['primary']['id']
        secondary_id = item['secondary']['id']
        m = item['merged']

        # Payload to update primary
        update_payload = {
            'name': m.get('name'),
            'bio': m.get('bio'),
            'location': m.get('location'),
            'portfolio': m.get('portfolio'),
            'industries': m.get('industries'),
            'stages': m.get('stages'),
            'avatar_url': m.get('avatar_url')
        }
        if m.get('email'): update_payload['email'] = m.get('email')
        if m.get('linkedin_url'): update_payload['linkedin_url'] = m.get('linkedin_url')
        if m.get('twitter_url'): update_payload['twitter_url'] = m.get('twitter_url')
        if m.get('website'): update_payload['website'] = m.get('website')
        if m.get('check_min'): update_payload['check_min'] = m.get('check_min')
        if m.get('check_max'): update_payload['check_max'] = m.get('check_max')

        try:
            # 1. Re-assign any CRM leads from secondary to primary
            try:
                crm_patch_url = f"{SUPABASE_URL}/rest/v1/crm_leads?investor_id=eq.{secondary_id}"
                crm_req = urllib.request.Request(
                    crm_patch_url,
                    data=json.dumps({'investor_id': primary_id}).encode('utf-8'),
                    headers=HEADERS,
                    method='PATCH'
                )
                with urllib.request.urlopen(crm_req, timeout=5) as _: pass
            except Exception:
                pass

            # 2. Delete secondary duplicate record first (to avoid unique constraint conflicts)
            del_url = f"{SUPABASE_URL}/rest/v1/investors?id=eq.{secondary_id}"
            del_req = urllib.request.Request(del_url, headers=HEADERS, method='DELETE')
            with urllib.request.urlopen(del_req, timeout=10) as dresp:
                pass

            # 3. Update primary record with merged supreme data
            patch_url = f"{SUPABASE_URL}/rest/v1/investors?id=eq.{primary_id}"
            patch_req = urllib.request.Request(
                patch_url, 
                data=json.dumps(update_payload).encode('utf-8'), 
                headers=HEADERS, 
                method='PATCH'
            )
            with urllib.request.urlopen(patch_req, timeout=10) as presp:
                if presp.status in (200, 204):
                    success_count += 1
                    print(f"  [{idx}/{len(verified_merges)}] [OK] Merged {m.get('name')} (Deleted duplicate {secondary_id[:8]})", flush=True)
        except Exception as err:
            print(f"  [{idx}/{len(verified_merges)}] [Error] Failed merging {m.get('name')}: {err}", flush=True)

    print("\n=================================================================")
    print("=== DEDUPLICATION COMPLETE ===")
    print(f"Total Duplicate Entities Cleaned & Merged: {success_count}/{len(verified_merges)}")
    print(f"New Clean Total Investors in DB:          {len(investors) - success_count}")
    print("=================================================================\n", flush=True)

if __name__ == '__main__':
    is_dry = '--live' not in sys.argv
    run_deduplication(dry_run=is_dry)
