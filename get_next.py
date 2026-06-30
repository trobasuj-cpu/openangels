import urllib.request, json, os
from dotenv import load_dotenv
load_dotenv('frontend/.env')
url = os.environ.get('VITE_SUPABASE_URL')
key = os.environ.get('VITE_SUPABASE_SERVICE_ROLE_KEY')
headers = {'apikey': key, 'Authorization': f'Bearer {key}', 'Content-Type': 'application/json', 'Prefer': 'return=representation'}
req = urllib.request.Request(f'{url}/rest/v1/investors?select=name,bio,linkedin_url,twitter_url&email=is.null&limit=5', headers=headers)
with urllib.request.urlopen(req) as res:
    data = json.loads(res.read().decode())
    for d in data:
        bio = d.get('bio', '')
        if bio: bio = bio[:80].replace('\n', ' ')
        print(f"- {d['name']} ({bio}...)")
