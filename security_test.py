import urllib.request, json, os
from dotenv import load_dotenv
load_dotenv('frontend/.env')
key = os.environ.get('VITE_SUPABASE_ANON_KEY') or 'sb_publishable_ial7j5MzK6ni3y-Y8YszGg_7ZeV-2D3'
base = 'https://rjdewjyhtbfkujhvkwig.supabase.co/rest/v1'

def api(url, method='GET', body=None):
    headers = {'apikey': key, 'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'}
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body else None, headers=headers, method=method)
    return urllib.request.urlopen(req)

print("=== TEST 1: Read investors_secure (should WORK) ===")
try:
    data = json.loads(api(f'{base}/investors_secure?select=id,name&limit=2').read())
    print(f"OK: {len(data)} investors readable")
except Exception as e:
    print(f"ERROR: {e}")

print("\n=== TEST 2: Emails via secure view (should be NULL) ===")
try:
    data = json.loads(api(f'{base}/investors_secure?select=name,email&limit=5').read())
    has_email = [d for d in data if d.get('email')]
    print(f"Emails visible: {len(has_email)} (should be 0)")
    for d in data:
        print(f"  {d['name']}: email={d.get('email')}")
except Exception as e:
    print(f"ERROR: {e}")

print("\n=== TEST 3: Raw investors table (should be BLOCKED) ===")
try:
    data = json.loads(api(f'{base}/investors?select=name,email&limit=3').read())
    print(f"VULNERABLE: {len(data)} rows from raw table!")
except Exception as e:
    print(f"OK: raw table blocked!")

print("\n=== TEST 4: Profiles (should be BLOCKED) ===")
try:
    data = json.loads(api(f'{base}/profiles?select=*&limit=3').read())
    if data:
        print(f"EXPOSED: {len(data)} profiles!")
    else:
        print("OK: 0 profiles (blocked)")
except Exception as e:
    print(f"OK: blocked!")

print("\n=== TEST 5: Insert/Delete/Update (should be BLOCKED) ===")
try:
    api(f'{base}/investors', 'POST', {'name': 'HACK'})
    print("VULNERABLE: insert allowed")
except:
    print("OK: insert blocked")
try:
    api(f'{base}/investors?name=eq.HACK', 'DELETE')
    print("VULNERABLE: delete allowed")
except:
    print("OK: delete blocked")
try:
    api(f'{base}/investors?id=eq.97ca73aa-b059-4e0a-96a1-d88f3ff37240', 'PATCH', {'name': 'X'})
    print("VULNERABLE: update allowed")
except:
    print("OK: update blocked")

print("\n=============================")
print("SECURITY AUDIT COMPLETE")
print("=============================")
