import os
import sys
import json
import uuid
import time
import urllib.request
import urllib.parse
import requests
import subprocess
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from pathlib import Path
from urllib.parse import urlparse

import find_emails as fe

# Force stdout to utf-8 if printing
sys.stdout.reconfigure(encoding='utf-8')

env_path = Path(__file__).parent.parent / 'frontend' / '.env'
load_dotenv(str(env_path))

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_SERVICE_ROLE_KEY")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

RSS_FEEDS = [
    "https://techcrunch.com/category/venture/feed/",
    "https://techcrunch.com/category/startups/feed/",
    "https://www.eu-startups.com/feed/",
    "https://sifted.eu/feed",
    "https://strictlyvc.substack.com/feed"
]

STANDARD_TAGS = [
    "ai", "saas", "fintech", "b2b", "b2c", "climate", "health", 
    "crypto", "web3", "creator-economy", "marketplace", "developer-tools",
    "deeptech", "ecommerce", "edtech", "hardware", "gaming"
]

def ddg_search(query, max_results=3, timeout=8):
    worker_script = os.path.join(os.path.dirname(__file__), 'ddg_worker.py')
    try:
        proc = subprocess.run(
            [sys.executable, worker_script, query],
            capture_output=True, text=True, timeout=timeout
        )
        if proc.returncode == 0:
            return json.loads(proc.stdout)
    except Exception:
        pass
    return []

def find_linkedin(name, twitter_handle=''):
    query1 = f'"{name}" site:linkedin.com/in/'
    query2 = f'"{name}" "{twitter_handle}" site:linkedin.com/in/' if twitter_handle else None
    
    res1 = ddg_search(query1, max_results=3)
    for r in res1:
        href = r.get('href', '')
        if 'linkedin.com/in/' in href:
            parsed = urlparse(href)
            return f"https://www.linkedin.com{parsed.path}"
            
    if query2:
        res2 = ddg_search(query2, max_results=3)
        for r in res2:
            href = r.get('href', '')
            if 'linkedin.com/in/' in href:
                parsed = urlparse(href)
                return f"https://www.linkedin.com{parsed.path}"
    return None

def find_twitter(name):
    query = f'"{name}" "investor" site:twitter.com OR site:x.com'
    results = ddg_search(query, max_results=3)
    for r in results:
        href = r.get('href', '')
        if 'twitter.com/' in href or 'x.com/' in href:
            if '/status/' not in href and '/search' not in href:
                parsed = urlparse(href)
                handle = parsed.path.strip('/').split('/')[0]
                if handle not in ['home', 'explore', 'notifications', 'messages']:
                    return f"https://x.com/{handle}"
    return None

def enrich_with_gemini(text):
    prompt = f"""
You are a VC analyst building a database of INDIVIDUAL ANGEL INVESTORS and VENTURE CAPITALISTS (human people only).

From the following raw text, extract ALL individual people who are investors (angels, VCs, partners at funds, etc.).

CRITICAL RULES:
- Extract ONLY real human people. NEVER extract company names, fund names, or startup names as investors.
- If the text mentions a VC fund (e.g. "led by Lightspeed Venture Partners"), try to find the specific PARTNER name. If no individual name is given, skip that fund.
- If a person is a FOUNDER or CEO raising money (not investing), do NOT include them.
- If you cannot find ANY individual investor names in the text, return: {{"investors": [], "no_investors": True}}

Return a JSON object with key "investors" containing an array. Each element must have:
- "name": Full name of the person (string).
- "bio": A professional bio in 3rd person (2-3 sentences) describing them as an investor, mentioning the deal from the article if relevant. (string).
- "industries": Investment focus tags. Pick 1-4 from ONLY this list: {json.dumps(STANDARD_TAGS)}. Default to ["saas"] if unclear.
- "location": City/country if mentioned, otherwise null.
- "source_url": The EXACT link of the article where this investor was mentioned. (string).

Raw Text (Contains Multiple Articles):
{text}
"""
    api_url = "https://openrouter.ai/api/v1/chat/completions"
    payload = {
        "model": "google/gemini-2.0-flash-lite-preview-02-05:free",
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ],
        "temperature": 0.2,
        "response_format": {"type": "json_object"}
    }
    
    # Rate limit pause
    time.sleep(5)
    
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://openangels.xyz",
        "X-Title": "OpenAngels Pipeline"
    }
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            res = requests.post(api_url, json=payload, headers=headers)
            if res.status_code == 429:
                wait = 15 * (attempt + 1)
                print(f"  [Rate limited, waiting {wait}s...]")
                time.sleep(wait)
                continue
            res.raise_for_status()
            data = res.json()
            raw_output = data['choices'][0]['message']['content']
            cleaned_output = raw_output.replace('```json', '').replace('```', '').strip()
            parsed = json.loads(cleaned_output)
            return parsed.get('investors', [])
        except Exception as e:
            if attempt < max_retries - 1:
                print(f"  [Retry {attempt+1}, waiting 15s...]")
                time.sleep(15)
            else:
                print(f"  OpenRouter Error: {e} | Response: {res.text if 'res' in locals() else ''}")
    return []

def check_duplicate_in_db(name):
    query_url = f"{SUPABASE_URL}/rest/v1/investors_secure?name=eq.{urllib.parse.quote(name)}&select=id"
    req = urllib.request.Request(query_url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode('utf-8'))
            return len(data) > 0
    except Exception:
        return False

def main():
    if not OPENROUTER_API_KEY:
        print("ERROR: OPENROUTER_API_KEY not found in .env")
        return
        
    print("=== Step 1: Fetching News (RSS) ===")
    seen_links = set()
    articles = []
    for feed_url in RSS_FEEDS:
        print(f"Fetching {feed_url}...")
        try:
            res = requests.get(feed_url, timeout=10)
            if res.status_code == 200:
                soup = BeautifulSoup(res.text, "xml")
                items = soup.find_all("item")
                for item in items[:5]: 
                    title = item.title.text if item.title else ""
                    link = item.link.text if item.link else ""
                    if link in seen_links:
                        continue
                    seen_links.add(link)
                    desc_html = item.description.text if item.description else ""
                    clean_desc = BeautifulSoup(desc_html, "html.parser").get_text(separator=' ').strip()
                    articles.append((title, link, clean_desc))
        except Exception as e:
            print(f"Error fetching {feed_url}: {e}")

    print(f"Total unique articles found: {len(articles)}")
    
    print("\n=== Step 2: AI Enrichment (Batch Processing) ===")
    all_found_investors = []
    
    if articles:
        combined_text = ""
        for idx, (title, link, desc) in enumerate(articles):
            combined_text += f"\n--- ARTICLE {idx+1} ---\nTitle: {title}\nLink: {link}\nContent:\n{desc}\n"
            
        print("Sending all articles to Gemini in a single request...")
        investors = enrich_with_gemini(combined_text)
        
        if not investors:
            print("  -> No human investors found in any of the articles.")
        else:
            print(f"  -> Found {len(investors)} potential investors. Searching social links...")
            
            for inv in investors:
                name = inv.get('name', '')
                if not name: continue
                
                if check_duplicate_in_db(name):
                    print(f"  -> {name} is already in the database. Skipping.")
                    continue

                print(f"  -> Processing: {name}")
                
                twitter_url = find_twitter(name)
                
                tw_handle = ''
                if twitter_url:
                    parts = [p for p in twitter_url.split('/') if p and p != 'twitter.com' and p != 'x.com']
                    if parts:
                        tw_handle = parts[-1]
                        
                linkedin_url = find_linkedin(name, tw_handle)
                
                # Email search
                email = fe.method_deobfuscate(inv.get('bio', ''))
                if not email:
                    try:
                        email = fe.method_ddg_email_search(name)
                    except AttributeError:
                        email = None
                if not email:
                    email = fe.method_github(name)

                inv['twitter_url'] = twitter_url
                inv['linkedin_url'] = linkedin_url
                inv['email'] = email
                if not inv.get('source_url'):
                    inv['source_url'] = articles[0][1] if articles else ""
                all_found_investors.append(inv)
                
                time.sleep(2)

    if not all_found_investors:
        print("\nNo new investors found today. Exiting.")
        return

    print("\n=== Step 4: Final Review ===")
    for i, inv in enumerate(all_found_investors):
        print(f"\n[{i+1}] {inv['name']}")
        print(f"    Industries: {', '.join(inv.get('industries', []))}")
        print(f"    Location: {inv.get('location', 'Unknown')}")
        print(f"    LinkedIn: {inv.get('linkedin_url', 'Not found')}")
        print(f"    Twitter: {inv.get('twitter_url', 'Not found')}")
        print(f"    Email: {inv.get('email', 'Not found')}")
        print(f"    Bio: {inv.get('bio', '')}")

    print("\n---------------------------------------------------------")
    print("REVIEW: Are there any bad profiles in this list?")
    user_input = input("Press ENTER to save ALL, or type comma-separated numbers to REJECT (e.g. 1, 3): ").strip()
    
    rejected_indices = []
    if user_input:
        try:
            rejected_indices = [int(x.strip()) - 1 for x in user_input.split(',')]
        except ValueError:
            print("Invalid input. Rejecting nothing by default.")
            
    print("\n=== Step 5: Saving to Database ===")
    saved_count = 0
    for i, inv in enumerate(all_found_investors):
        if i in rejected_indices:
            print(f"Skipping {inv['name']} (Rejected)")
            continue
            
        base_slug = inv['name'].lower().replace(' ', '-')
        slug = f"{base_slug}-{uuid.uuid4().hex[:6]}"
        
        payload = {
            "name": inv['name'],
            "slug": slug,
            "bio": inv.get('bio', ''),
            "industries": inv.get('industries', ['saas'])
        }
        
        if inv.get('linkedin_url'): payload['linkedin_url'] = inv['linkedin_url']
        if inv.get('twitter_url'): payload['twitter_url'] = inv['twitter_url']
        if inv.get('email'): payload['email'] = inv['email']
        
        insert_url = f"{SUPABASE_URL}/rest/v1/investors_secure"
        req = urllib.request.Request(insert_url, data=json.dumps(payload).encode('utf-8'), headers=HEADERS, method='POST')
        try:
            with urllib.request.urlopen(req) as res:
                if res.status in [200, 201]:
                    print(f"Saved: {inv['name']}")
                    saved_count += 1
        except Exception as e:
            print(f"Failed to save {inv['name']}: {e}")

    print(f"\n=== DONE! Added {saved_count} new investors to the database. ===")

if __name__ == "__main__":
    main()
