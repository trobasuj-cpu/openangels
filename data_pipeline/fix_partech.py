import os
import json
import urllib.request

env_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', '.env')
env_vars = {}
with open(env_path, 'r', encoding='utf-8') as f:
    for line in f:
        if '=' in line and not line.strip().startswith('#'):
            k, v = line.strip().split('=', 1)
            env_vars[k] = v.strip().strip('"').strip("'")

url = env_vars.get("VITE_SUPABASE_URL")
key = env_vars.get("VITE_SUPABASE_SERVICE_ROLE_KEY")

HEADERS = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

req_url = f"{url}/rest/v1/investors?name=ilike.*Partech*&select=id,name,twitter_url"
req = urllib.request.Request(req_url, headers=HEADERS)

with urllib.request.urlopen(req) as res:
    data = json.loads(res.read().decode('utf-8'))
    for inv in data:
        print("Found:", inv)
        if 'Partech' in inv['name']:
            inv_id = inv['id']
            patch_url = f"{url}/rest/v1/investors?id=eq.{inv_id}"
            patch_req = urllib.request.Request(
                patch_url, 
                data=json.dumps({"twitter_url": "https://x.com/PartechPartners"}).encode('utf-8'), 
                headers=HEADERS, 
                method='PATCH'
            )
            urllib.request.urlopen(patch_req)
            print(f"Updated {inv['name']} to PartechPartners")
