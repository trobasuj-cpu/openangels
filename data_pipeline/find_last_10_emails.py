import os
import sys
import json
import urllib.request
from pathlib import Path
from dotenv import load_dotenv

# Force stdout encoding to UTF-8
sys.stdout.reconfigure(encoding='utf-8')

sys.path.append(os.path.dirname(__file__))
import find_emails as fe

env_path = Path(__file__).parent.parent / 'frontend' / '.env'
load_dotenv(str(env_path))

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_SERVICE_ROLE_KEY")

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}

def process_last_10():
    print("=== Fetching 10 Most Recently Added Investors ===")
    req_url = f"{SUPABASE_URL}/rest/v1/investors_secure?select=id,name,bio,email,website,linkedin_url,twitter_url,created_at&order=created_at.desc&limit=10"
    req = urllib.request.Request(req_url, headers=HEADERS)
    
    try:
        with urllib.request.urlopen(req) as res:
            investors = json.loads(res.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching investors: {e}")
        return

    print(f"Found {len(investors)} latest investors:\n")
    for idx, inv in enumerate(investors, 1):
        email_str = inv.get('email') or 'NONE'
        print(f"  {idx}. {inv['name']} | Email: {email_str} | Added: {inv.get('created_at')}")

    print("\n" + "="*50)
    print("⚡ Running OSINT Email Search Cascade on these 10 investors...")
    print("="*50 + "\n")

    found_count = 0
    for idx, inv in enumerate(investors, 1):
        name = inv['name']
        inv_id = inv['id']
        current_email = inv.get('email')
        bio = inv.get('bio') or ''
        website = inv.get('website')
        linkedin = inv.get('linkedin_url')

        if current_email:
            print(f"[{idx}/10] {name}: Already has email ({current_email}). Skipping.")
            continue

        print(f"[{idx}/10] Searching email for '{name}'...", end="", flush=True)

        # 1. Deobfuscation
        found = fe.method_deobfuscate(bio)
        if found:
            print(f" ✅ Found via Deobfuscation: {found}")
            fe.update_supabase(inv_id, found)
            found_count += 1
            continue

        # 2. DuckDuckGo Direct Search
        found = fe.method_ddg_email_search(name)
        if found:
            print(f" ✅ Found via DDG Search: {found}")
            fe.update_supabase(inv_id, found)
            found_count += 1
            continue

        # 3. GitHub Search
        found = fe.method_github(name)
        if found:
            print(f" ✅ Found via GitHub: {found}")
            fe.update_supabase(inv_id, found)
            found_count += 1
            continue

        # 4. Website Scraping
        personal_url = fe.extract_personal_url(bio) or website
        if personal_url:
            found = fe.method_scrape_website(personal_url)
            if found:
                print(f" ✅ Found via Website ({personal_url}): {found}")
                fe.update_supabase(inv_id, found)
                found_count += 1
                continue

        # 5. Company SMTP / Pattern Matching
        domain, result = fe.method_smtp_company(name, bio)
        if result and result != 'CATCHALL':
            print(f" ✅ Found via Corporate SMTP ({domain}): {result}")
            fe.update_supabase(inv_id, result)
            found_count += 1
            continue
        elif result == 'CATCHALL' and domain:
            found = fe.method_ddg_catchall(name, domain)
            if found:
                print(f" ✅ Found via Catchall Leak ({domain}): {found}")
                fe.update_supabase(inv_id, found)
                found_count += 1
                continue

        print(" ❌ No email found via current OSINT channels.")

    print("\n" + "="*50)
    print(f"DONE! Successfully found and updated emails for {found_count} out of {len(investors)} latest investors.")
    print("="*50)

if __name__ == "__main__":
    process_last_10()
