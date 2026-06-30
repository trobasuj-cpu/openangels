import os
import json
import urllib.request
import time
import sys
import subprocess
from urllib.parse import urlparse

# Force stdout to utf-8 if printing
sys.stdout.reconfigure(encoding='utf-8')

env_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', '.env')
env_vars = {}
if os.path.exists(env_path):
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            if '=' in line:
                key, val = line.strip().split('=', 1)
                env_vars[key.strip()] = val.strip().strip('"').strip("'")

url = env_vars.get("VITE_SUPABASE_URL")
key = env_vars.get("VITE_SUPABASE_SERVICE_ROLE_KEY")

HEADERS = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

CHECKED_FILE = os.path.join(os.path.dirname(__file__), "checked_twitter.txt")

def get_checked_ids():
    if not os.path.exists(CHECKED_FILE):
        return set()
    with open(CHECKED_FILE, "r") as f:
        return set(line.strip() for line in f if line.strip())

def mark_checked(investor_id):
    with open(CHECKED_FILE, "a") as f:
        f.write(f"{investor_id}\n")

def ddg_search(query, max_results=5, timeout=8):
    worker_script = os.path.join(os.path.dirname(__file__), 'ddg_worker.py')
    try:
        proc = subprocess.run(
            [sys.executable, worker_script, query],
            capture_output=True, text=True, timeout=timeout
        )
        if proc.returncode == 0:
            return json.loads(proc.stdout)
    except Exception:
        pass
    return []

# Common non-personal Twitter accounts to skip
SKIP_HANDLES = {
    'twitter', 'x', 'home', 'search', 'explore', 'settings',
    'i', 'login', 'signup', 'tos', 'privacy', 'about',
    'help', 'intent', 'share', 'hashtag'
}

def extract_twitter_url(results, investor_name=""):
    """Extract a Twitter/X profile URL from search results."""
    for r in results:
        href = r.get('href', '')
        # Match twitter.com/handle or x.com/handle patterns
        if 'twitter.com/' in href or 'x.com/' in href:
            parsed = urlparse(href)
            path_parts = [p for p in parsed.path.split('/') if p]
            
            if not path_parts:
                continue
            
            handle = path_parts[0].lower()
            
            # Skip non-profile pages
            if handle in SKIP_HANDLES:
                continue
            # Skip status/tweet links
            if len(path_parts) > 1 and path_parts[1] in ('status', 'statuses', 'lists', 'moments'):
                continue
            
            # Return clean X.com URL
            clean_url = f"https://x.com/{path_parts[0]}"
            return clean_url
    return None

def update_supabase(investor_id, twitter_url):
    update_url = f"{url}/rest/v1/investors?id=eq.{investor_id}"
    req = urllib.request.Request(
        update_url,
        data=json.dumps({"twitter_url": twitter_url}).encode('utf-8'),
        headers=HEADERS,
        method='PATCH'
    )
    try:
        with urllib.request.urlopen(req) as res:
            return res.status in [200, 204]
    except Exception as e:
        print(f"  [Error updating Supabase: {e}]")
        return False

def get_linkedin_handle(linkedin_url):
    """Extract the LinkedIn handle from a URL for disambiguation."""
    if not linkedin_url:
        return ''
    parsed = urlparse(linkedin_url)
    parts = [p for p in parsed.path.split('/') if p and p != 'in']
    return parts[0] if parts else ''

def run_control_group():
    """Run on the control group: investors with Email AND LinkedIn but NO Twitter."""
    print("Starting Twitter parser on CONTROL GROUP...")
    print("(Investors with Email + LinkedIn but no Twitter)")
    print()
    
    checked_ids = get_checked_ids()
    print(f"Loaded {len(checked_ids)} already checked IDs.")
    
    # Fetch all investors and filter locally
    all_targets = []
    offset = 0
    limit = 100
    
    while True:
        req_url = f"{url}/rest/v1/investors?select=id,name,email,linkedin_url,twitter_url&limit={limit}&offset={offset}"
        req = urllib.request.Request(req_url, headers=HEADERS)
        try:
            with urllib.request.urlopen(req) as res:
                data = json.loads(res.read().decode('utf-8'))
        except Exception as e:
            print(f"Error fetching data: {e}")
            break
        
        if not data:
            break
        
        for inv in data:
            # Control group filter: has email AND linkedin, but NO twitter
            if inv.get('email') and inv.get('linkedin_url') and not inv.get('twitter_url'):
                inv_id = str(inv['id'])
                if inv_id not in checked_ids:
                    all_targets.append(inv)
        
        if len(data) < limit:
            break
        offset += limit
    
    total = len(all_targets)
    print(f"Control group size (after excluding checked): {total}")
    print()
    
    success = 0
    
    for i, inv in enumerate(all_targets, 1):
        inv_id = str(inv['id'])
        name = inv.get('name', 'Unknown')
        linkedin_url = inv.get('linkedin_url', '')
        linkedin_handle = get_linkedin_handle(linkedin_url)
        
        print(f"[{i}/{total}] Processing: {name}...", end="", flush=True)
        
        # Strategy 1: Direct name search on twitter/x
        query1 = f'"{name}" site:x.com'
        found_url = None
        res1 = ddg_search(query1, max_results=5)
        found_url = extract_twitter_url(res1, name)
        
        # Strategy 2: Try with linkedin handle for disambiguation
        if not found_url and linkedin_handle:
            query2 = f'"{name}" "{linkedin_handle}" twitter'
            res2 = ddg_search(query2, max_results=5)
            found_url = extract_twitter_url(res2, name)
        
        # Strategy 3: Try twitter.com domain
        if not found_url:
            query3 = f'"{name}" site:twitter.com'
            res3 = ddg_search(query3, max_results=5)
            found_url = extract_twitter_url(res3, name)
        
        if found_url:
            print(f" FOUND: {found_url}")
            if update_supabase(inv_id, found_url):
                success += 1
        else:
            print(" X")
        
        mark_checked(inv_id)
        checked_ids.add(inv_id)
        time.sleep(1)  # anti-rate-limit
    
    print(f"\n=== Control Group DONE! Found: {success} / {total} ===")

def run_full_scale():
    """Run on all investors missing Twitter."""
    print("Starting FULL SCALE Twitter parser...")
    
    checked_ids = get_checked_ids()
    print(f"Loaded {len(checked_ids)} already checked IDs.")
    
    # Count total missing
    count_url = f"{url}/rest/v1/investors?twitter_url=is.null"
    count_headers = HEADERS.copy()
    count_headers['Prefer'] = 'count=exact'
    count_headers['Range-Unit'] = 'items'
    count_headers['Range'] = '0-0'
    total_remaining = 0
    try:
        req = urllib.request.Request(count_url, headers=count_headers)
        with urllib.request.urlopen(req) as res:
            cr = res.headers.get('Content-Range', '')
            if cr and '/' in cr:
                total_remaining = int(cr.split('/')[1])
    except Exception:
        pass
    print(f"Total investors missing Twitter in database: {total_remaining}")
    
    success = 0
    total_processed = 0
    offset = 0
    limit = 100
    
    while True:
        req_url = f"{url}/rest/v1/investors?select=id,name,email,linkedin_url,twitter_url&limit={limit}&offset={offset}"
        req = urllib.request.Request(req_url, headers=HEADERS)
        try:
            with urllib.request.urlopen(req) as res:
                data = json.loads(res.read().decode('utf-8'))
        except Exception as e:
            print(f"Error fetching data: {e}")
            break
        
        if not data:
            break
        
        for inv in data:
            inv_id = str(inv['id'])
            # Skip if already has twitter
            if inv.get('twitter_url'):
                continue
            if inv_id in checked_ids:
                continue
            
            name = inv.get('name', 'Unknown')
            linkedin_url = inv.get('linkedin_url', '')
            linkedin_handle = get_linkedin_handle(linkedin_url)
            
            total_processed += 1
            print(f"[{total_processed}/{total_remaining}] Processing: {name}...", end="", flush=True)
            
            found_url = None
            
            # Strategy 1: Direct name search on x.com
            query1 = f'"{name}" site:x.com'
            res1 = ddg_search(query1, max_results=5)
            found_url = extract_twitter_url(res1, name)
            
            # Strategy 2: Try with linkedin handle
            if not found_url and linkedin_handle:
                query2 = f'"{name}" "{linkedin_handle}" twitter'
                res2 = ddg_search(query2, max_results=5)
                found_url = extract_twitter_url(res2, name)
            
            # Strategy 3: Try twitter.com domain
            if not found_url:
                query3 = f'"{name}" site:twitter.com'
                res3 = ddg_search(query3, max_results=5)
                found_url = extract_twitter_url(res3, name)
            
            if found_url:
                print(f" FOUND: {found_url}")
                if update_supabase(inv_id, found_url):
                    success += 1
            else:
                print(" X")
            
            mark_checked(inv_id)
            checked_ids.add(inv_id)
            time.sleep(1)
        
        if len(data) < limit:
            break
        offset += limit
    
    print(f"\n=== Full Scale Parsing DONE! Found: {success} / {total_processed} ===")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--full', action='store_true', help='Run full scale instead of control group')
    args = parser.parse_args()
    
    if args.full:
        run_full_scale()
    else:
        run_control_group()
