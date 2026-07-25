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

# Find all investors with nfx.com in twitter_url
req = urllib.request.Request(
    f'{url}/rest/v1/investors_secure?twitter_url=ilike.*nfx.com*&select=id,name,twitter_url',
    headers=headers
)
data = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
print(f'Found {len(data)} investors with nfx.com in twitter_url\n')

for inv in data:
    print(f"  {inv['name']}: {inv['twitter_url']} -> NULL")
    patch = urllib.request.Request(
        f"{url}/rest/v1/investors_secure?id=eq.{inv['id']}",
        data=json.dumps({'twitter_url': None}).encode('utf-8'),
        headers=headers,
        method='PATCH'
    )
    urllib.request.urlopen(patch)
    print(f"    -> Cleaned!")

# Also check website field for nfx.com junk
req2 = urllib.request.Request(
    f'{url}/rest/v1/investors_secure?website=ilike.*nfx.com*&select=id,name,website',
    headers=headers
)
data2 = json.loads(urllib.request.urlopen(req2).read().decode('utf-8'))
if data2:
    print(f'\nAlso found {len(data2)} investors with nfx.com in website field\n')
    for inv in data2:
        print(f"  {inv['name']}: {inv['website']} -> NULL")
        patch = urllib.request.Request(
            f"{url}/rest/v1/investors_secure?id=eq.{inv['id']}",
            data=json.dumps({'website': None}).encode('utf-8'),
            headers=headers,
            method='PATCH'
        )
        urllib.request.urlopen(patch)
        print(f"    -> Cleaned!")

print(f'\nDone! Cleaned {len(data)} twitter_url and {len(data2)} website entries.')
