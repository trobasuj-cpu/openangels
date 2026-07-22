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

def scan_junk():
    # Fetch all records without limit truncation
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

    junk_list = []
    
    # Word boundary regex for companies & non-human headline patterns
    company_regexes = [
        r'\bventures?\b', r'\bcapitals?\b', r'\bpartners?\b', r'\bfunds?\b', 
        r'\binc\.?\b', r'\bllc\.?\b', r'\bltd\.?\b', r'\bcorp\.?\b', r'\bgroup ag\b',
        r'\bvc\b', r'\bhashtag\b', r'\bstocks?\b', r'\binvesting\b', r'\bopportunities\b',
        r'\buncertainty\b', r'\boverview\b', r'\bseries [a-z]\b', r'\bseed round\b',
        r'\btop \d+\b', r'\bhow to\b', r'\bguide\b', r'\breport\b', r'\bdigest\b',
        r'\bnewsletter\b', r'\bofficial\b', r'\btwitter\b', r'\bwatchlist\b'
    ]
    
    combined_re = re.compile('|'.join(company_regexes), re.IGNORECASE)

    for inv in investors:
        name = inv.get('name', '').strip()
        
        is_junk = False
        reason = ""
        
        if name.startswith('#') or name.startswith('http') or name.startswith('www.'):
            is_junk = True
            reason = "Hashtag or URL"
            
        elif len(name.split()) > 4:
            is_junk = True
            reason = "Name too long (>4 words, headline)"
            
        elif combined_re.search(name):
            is_junk = True
            reason = f"Company/headline pattern ({combined_re.search(name).group(0)})"
            
        if is_junk:
            junk_list.append((inv['id'], name, reason))
            
    print(f"Total scanned in DB: {len(investors)}")
    print(f"Junk/Company profiles found: {len(junk_list)}\n")
    print("Sample junk entries found:")
    for j in junk_list[:50]:
        print(f"  [{j[2]}] {j[1]}")
        
    return junk_list

if __name__ == "__main__":
    scan_junk()
