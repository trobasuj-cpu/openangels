import os
import json
import urllib.request
import time
import sys
import subprocess
from urllib.parse import urlparse
from ddgs import DDGS

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

CHECKED_FILE = os.path.join(os.path.dirname(__file__), "checked_linkedin.txt")

def get_checked_ids():
    if not os.path.exists(CHECKED_FILE):
        return set()
    with open(CHECKED_FILE, "r") as f:
        return set(line.strip() for line in f if line.strip())

def mark_checked(investor_id):
    with open(CHECKED_FILE, "a") as f:
        f.write(f"{investor_id}\n")

def ddg_search(query, max_results=3, timeout=8):
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

def extract_linkedin_url(results):
    for r in results:
        href = r.get('href', '')
        if 'linkedin.com/in/' in href:
            parsed = urlparse(href)
            clean_url = f"https://www.linkedin.com{parsed.path}"
            return clean_url
    return None

def update_supabase(investor_id, linkedin_url):
    update_url = f"{url}/rest/v1/investors_secure?id=eq.{investor_id}"
    req = urllib.request.Request(
        update_url,
        data=json.dumps({"linkedin_url": linkedin_url}).encode('utf-8'),
        headers=HEADERS,
        method='PATCH'
    )
    try:
        with urllib.request.urlopen(req) as res:
            return res.status in [200, 204]
    except Exception as e:
        print(f"  [Error updating Supabase: {e}]")
        return False

def get_total_remaining():
    req_url = f"{url}/rest/v1/investors_secure?linkedin_url=is.null"
    headers = HEADERS.copy()
    headers['Prefer'] = 'count=exact'
    headers['Range-Unit'] = 'items'
    headers['Range'] = '0-0'
    req = urllib.request.Request(req_url, headers=headers)
    try:
        with urllib.request.urlopen(req) as res:
            content_range = res.headers.get('Content-Range', '')
            # format: 0-0/3142
            if content_range and '/' in content_range:
                return int(content_range.split('/')[1])
    except Exception:
        pass
    return 0

def run_full_scale():
    print("Starting full scale LinkedIn parser...")
    
    total_remaining = get_total_remaining()
    print(f"Total investors missing LinkedIn in database: {total_remaining}")
    
    checked_ids = get_checked_ids()
    print(f"Loaded {len(checked_ids)} already checked IDs in this run.")
    
    success = 0
    total_processed = 0
    limit = 100
    offset = 0
    
    while True:
        req_url = f"{url}/rest/v1/investors_secure?select=id,name,bio,twitter_url,linkedin_url&limit={limit}&offset={offset}"
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
            # Filter locally
            if inv.get('linkedin_url'):
                continue
            if inv_id in checked_ids:
                continue
                
            name = inv.get('name', 'Unknown')
            twitter = inv.get('twitter_url', '')
            
            total_processed += 1
            print(f"[{total_processed}/{total_remaining}] Processing: {name}...", end="", flush=True)
            
            twitter_handle = ''
            if twitter:
                parts = [p for p in twitter.split('/') if p and p != 'twitter.com' and p != 'x.com']
                if parts:
                    twitter_handle = parts[-1]
                    
            query1 = f'"{name}" site:linkedin.com/in/'
            query2 = f'"{name}" "{twitter_handle}" site:linkedin.com/in/' if twitter_handle else None
            
            found_url = None
            res1 = ddg_search(query1, max_results=3)
            found_url = extract_linkedin_url(res1)
            
            if not found_url and query2:
                res2 = ddg_search(query2, max_results=3)
                found_url = extract_linkedin_url(res2)
                
            if found_url:
                print(f" FOUND: {found_url}")
                if update_supabase(inv_id, found_url):
                    success += 1
            else:
                print(" X")
                
            mark_checked(inv_id)
            checked_ids.add(inv_id)
            time.sleep(1) # anti-rate-limit
            
        if len(data) < limit:
            break
        offset += limit

    print(f"\n=== Full Scale Parsing DONE! Found: {success} / {total_processed} ===")

if __name__ == "__main__":
    run_full_scale()
