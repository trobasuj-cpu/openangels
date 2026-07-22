import os
import sys
import json
import re
import urllib.request
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).parent.parent / 'frontend' / '.env'
load_dotenv(str(env_path))

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_SERVICE_ROLE_KEY")

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}

def clean_database():
    print("=== OpenAngels Junk & Non-Human Cleanup ===")
    
    # 1. Fetch all records
    investors = []
    limit = 1000
    offset = 0
    while True:
        req_url = f"{SUPABASE_URL}/rest/v1/investors_secure?select=id,name,bio,created_at&limit={limit}&offset={offset}"
        req = urllib.request.Request(req_url, headers=HEADERS)
        with urllib.request.urlopen(req) as res:
            batch = json.loads(res.read().decode('utf-8'))
            investors.extend(batch)
            if len(batch) < limit:
                break
            offset += limit

    # Word boundary regex for non-person entries (funds, companies, headlines, twitter hashtags)
    company_regexes = [
        r'\bventures?\b', r'\bcapitals?\b', r'\bpartners?\b', r'\bfunds?\b', 
        r'\binc\.?\b', r'\bllc\.?\b', r'\bltd\.?\b', r'\bcorp\.?\b', r'\bgroup ag\b',
        r'\bvc\b', r'\bhashtag\b', r'\bstocks?\b', r'\binvesting\b', r'\bopportunities\b',
        r'\buncertainty\b', r'\boverview\b', r'\bseries [a-z]\b', r'\bseed round\b',
        r'\btop \d+\b', r'\bhow to\b', r'\bguide\b', r'\breport\b', r'\bdigest\b',
        r'\bnewsletter\b', r'\bofficial\b', r'\btwitter\b', r'\bwatchlist\b',
        r'\binvestment\b', r'\binvestor list\b', r'\bsupport\b'
    ]
    
    combined_re = re.compile('|'.join(company_regexes), re.IGNORECASE)

    to_delete = []
    for inv in investors:
        name = inv.get('name', '').strip()
        
        is_junk = False
        if name.startswith('#') or name.startswith('http') or name.startswith('www.'):
            is_junk = True
        elif len(name.split()) > 4:
            is_junk = True
        elif combined_re.search(name):
            is_junk = True
            
        if is_junk:
            to_delete.append((inv['id'], name))
            
    print(f"Total profiles scanned: {len(investors)}")
    print(f"Found {len(to_delete)} non-human / junk profiles to remove.")
    
    if not to_delete:
        print("Database is clean!")
        return

    # Delete in batches of 50
    deleted_count = 0
    for i in range(0, len(to_delete), 50):
        batch = to_delete[i:i+50]
        ids = [b[0] for b in batch]
        ids_str = ",".join(ids)
        delete_url = f"{SUPABASE_URL}/rest/v1/investors_secure?id=in.({ids_str})"
        
        del_req = urllib.request.Request(delete_url, headers=HEADERS, method='DELETE')
        try:
            with urllib.request.urlopen(del_req) as res:
                deleted_count += len(batch)
                print(f"Deleted {deleted_count}/{len(to_delete)}...")
        except Exception as e:
            print(f"Error deleting batch: {e}")
            
    print(f"\nSuccessfully cleaned up {deleted_count} junk & company entries from database!")

if __name__ == "__main__":
    clean_database()
