import os, sys, urllib.request, json
from dotenv import load_dotenv

sys.stdout.reconfigure(encoding='utf-8')
load_dotenv('frontend/.env')

url = os.environ.get('NEXT_PUBLIC_SUPABASE_URL')
key = os.environ.get('VITE_SUPABASE_SERVICE_ROLE_KEY')
headers = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json'
}

# Find all investors with "Signal NFX" in bio
req = urllib.request.Request(
    f'{url}/rest/v1/investors_secure?bio=ilike.*Signal*NFX*&select=id,name,bio',
    headers=headers
)
data = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
print(f'Found {len(data)} investors with "Signal NFX" in bio\n')

for inv in data:
    old_bio = inv['bio']
    new_bio = old_bio.replace(' featured on Signal NFX.', '.').replace(' featured on Signal NFX', '')
    new_bio = new_bio.replace(' on Signal NFX.', '.').replace(' on Signal NFX', '')
    new_bio = new_bio.replace('Signal NFX', '').strip()
    # Clean double periods
    new_bio = new_bio.replace('..', '.')

    print(f"  {inv['name']}")
    print(f"    OLD: {old_bio}")
    print(f"    NEW: {new_bio}")

    patch = urllib.request.Request(
        f"{url}/rest/v1/investors_secure?id=eq.{inv['id']}",
        data=json.dumps({'bio': new_bio}).encode('utf-8'),
        headers=headers,
        method='PATCH'
    )
    urllib.request.urlopen(patch)
    print(f"    -> Updated!")

print(f'\nDone! Cleaned {len(data)} bios.')
