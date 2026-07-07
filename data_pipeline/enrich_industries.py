import os
import json
import urllib.request
import time
import requests
from dotenv import load_dotenv
from pathlib import Path

# Load .env
env_path = Path(__file__).parent.parent / 'frontend' / '.env'
load_dotenv(str(env_path))

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

STANDARD_TAGS = [
    "ai", "saas", "fintech", "b2b", "b2c", "climate", "health", 
    "crypto", "web3", "creator-economy", "marketplace", "developer-tools",
    "deeptech", "ecommerce", "edtech", "hardware", "gaming"
]

def get_investors_without_industries():
    # Filter where industries is null
    url = f"{SUPABASE_URL}/rest/v1/investors_secure?industries=is.null&select=id,name,bio,twitter_url&limit=100"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode('utf-8'))
            return data
    except Exception as e:
        print(f"Error fetching investors: {e}")
        return []

def extract_industries_with_gemini(investor):
    if not GEMINI_API_KEY:
        print("GEMINI_API_KEY not set!")
        return []
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    bio = investor.get('bio', '')
    if not bio or len(bio) < 10 or "Found via automated" in bio or "Extracted from public" in bio:
        return [] # Fallback for empty/generic bios
        
    prompt = f"""
    Analyze the following bio of an angel investor.
    Categorize their investment interests into 1 to 4 tags from this specific list ONLY:
    {json.dumps(STANDARD_TAGS)}
    
    If you cannot determine, just return ["saas"].
    Return the result strictly as a valid JSON array of strings. Do not add markdown or backticks.
    
    Bio: {bio}
    """
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    
    headers = {'Content-Type': 'application/json'}
    for attempt in range(3):
        try:
            res = requests.post(url, headers=headers, data=json.dumps(payload), timeout=10)
            res.raise_for_status()
            response_data = res.json()
            
            try:
                text_result = response_data['candidates'][0]['content']['parts'][0]['text']
                response_text = text_result.replace('```json', '').replace('```', '').strip()
                tags = json.loads(response_text)
                
                # Filter to only standard tags
                valid_tags = [t for t in tags if t in STANDARD_TAGS]
                return valid_tags
            except (KeyError, IndexError, json.JSONDecodeError):
                return []
        except requests.exceptions.HTTPError as e:
            if res.status_code == 429:
                time.sleep(5)
            else:
                break
        except Exception:
            break
            
    return []

def update_investor_industries(investor_id, industries):
    url = f"{SUPABASE_URL}/rest/v1/investors_secure?id=eq.{investor_id}"
    payload = {"industries": industries}
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=HEADERS, method='PATCH')
    try:
        with urllib.request.urlopen(req) as res:
            return res.status in [200, 204]
    except Exception as e:
        print(f"Failed to update industries for {investor_id}: {e}")
        return False

def run_enrichment():
    print("Starting Industry Enrichment...")
    investors = get_investors_without_industries()
    print(f"Found {len(investors)} investors without industries.")
    
    success = 0
    for i, inv in enumerate(investors):
        print(f"[{i+1}/{len(investors)}] Analyzing {inv.get('name')}...")
        tags = extract_industries_with_gemini(inv)
        print(f"  -> Extracted tags: {tags}")
        if update_investor_industries(inv['id'], tags):
            success += 1
        time.sleep(1)
        
    print(f"Enrichment finished. Updated {success} investors.")

if __name__ == "__main__":
    run_enrichment()
    import os
    os._exit(0)
