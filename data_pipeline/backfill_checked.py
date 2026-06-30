"""Pre-populate checked.txt with IDs of investors already processed in overnight run."""
import os, json, urllib.request
from dotenv import load_dotenv

load_dotenv('frontend/.env')
url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_SERVICE_ROLE_KEY")
HEADERS = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json',
}

# Fetch all investors without email (same order as pipeline)
targets = []
limit, offset = 1000, 0
while True:
    req_url = f'{url}/rest/v1/investors?select=id,name&email=is.null&limit={limit}&offset={offset}'
    req = urllib.request.Request(req_url, headers=HEADERS)
    with urllib.request.urlopen(req) as res:
        data = json.loads(res.read().decode())
        targets.extend(data)
        if len(data) < limit:
            break
        offset += limit

print(f"Total without email: {len(targets)}")

# The overnight run processed the first ~3500 of the original 4622.
# Those 3500 included ~1300 that got emails (no longer in this list)
# and ~2200 that got nothing (still in this list, at the beginning).
# Mark the first 2300 as checked (generous estimate).
SKIP_COUNT = 2300
checked_file = os.path.join(os.path.dirname(__file__), 'checked.txt')

# Load existing checked IDs
existing = set()
if os.path.exists(checked_file):
    with open(checked_file, 'r') as f:
        existing = set(line.strip() for line in f if line.strip())

added = 0
with open(checked_file, 'a') as f:
    for item in targets[:SKIP_COUNT]:
        inv_id = str(item['id'])
        if inv_id not in existing:
            f.write(inv_id + '\n')
            added += 1

remaining = len(targets) - SKIP_COUNT
print(f"Added {added} IDs to checked.txt")
print(f"Remaining to process: ~{remaining}")
print(f"First unchecked: {targets[SKIP_COUNT]['name'] if len(targets) > SKIP_COUNT else 'N/A'}")
