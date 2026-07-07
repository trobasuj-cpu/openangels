import os
import re
import json
import urllib.request
from dotenv import load_dotenv
from ddgs import DDGS
import concurrent.futures
from pathlib import Path
# Load .env absolutely
env_path = Path(__file__).parent.parent / 'frontend' / '.env'
load_dotenv(str(env_path))

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_SERVICE_ROLE_KEY")

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

def generate_slug(name):
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[-\s]+', '-', slug).strip('-')
    return slug

def check_exists(slug):
    url = f"{SUPABASE_URL}/rest/v1/investors_secure?slug=eq.{slug}&select=id"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode('utf-8'))
            return len(data) > 0
    except Exception as e:
        print(f"Error checking DB for {slug}: {e}")
        return True # Default to true to avoid duplicates on error

def insert_investor(name, slug, twitter_url, bio):
    url = f"{SUPABASE_URL}/rest/v1/investors_secure"
    payload = {
        "name": name,
        "slug": slug,
        "twitter_url": twitter_url,
        "bio": bio
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=HEADERS, method='POST')
    try:
        with urllib.request.urlopen(req) as res:
            return res.status in [200, 201]
    except Exception as e:
        print(f"Failed to insert {name}: {e}")
        return False

def ddg_search(query, max_results=10, timeout=10):
    def _run():
        try:
            return list(DDGS().text(query, max_results=max_results))
        except Exception:
            return []
    pool = concurrent.futures.ThreadPoolExecutor(max_workers=1)
    fut = pool.submit(_run)
    try:
        res = fut.result(timeout=timeout)
        pool.shutdown(wait=False)
        return res
    except (concurrent.futures.TimeoutError, Exception):
        pool.shutdown(wait=False)
        return []

def extract_name_from_twitter_title(title):
    # Titles usually look like: "John Doe (@johndoe) / X" or "John Doe on X: ..."
    match = re.match(r'^([^\(]+?)\s+\(@', title)
    if match:
        return match.group(1).strip()
    match = re.match(r'^([^|]+?)\s+on X:', title)
    if match:
        return match.group(1).strip()
    
    # Fallback
    parts = title.split('/')
    if len(parts) > 1:
        potential_name = parts[0].replace('(@', '').strip()
        # remove twitter handle if it's there
        potential_name = re.sub(r'@[a-zA-Z0-9_]+', '', potential_name).strip()
        return potential_name
    return title.strip()

def run_twitter_scraper():
    print("Starting Twitter Scraper...")
    
    queries = [
        'site:x.com "Angel Investor"',
        'site:x.com "Investing in early stage"',
        'site:x.com "Pre-seed investor"',
        'site:x.com "Angel backing"',
        'site:x.com "Seed investor" "portfolio"',
        'site:x.com "Investing in AI" "angel"',
        'site:x.com "Investing in SaaS"',
        'site:x.com "Angel investor" "fintech"',
        'site:x.com "investor" "seed" "b2b"',
        'site:x.com "Angel Syndicate"',
        'site:x.com "early stage investor"',
        'site:x.com "investing my own money"',
        'site:x.com "angel investing" "startups"',
        'site:twitter.com "Angel Investor"',
        'site:twitter.com "investing in startups"'
    ]
    
    total_added = 0
    
    for query in queries:
        print(f"Searching: {query}")
        results = ddg_search(query, max_results=10)
        
        for r in results:
            url = r.get('href', '')
            title = r.get('title', '')
            body = r.get('body', '')
            
            # Only accept actual Twitter/X profile URLs
            is_twitter = ('x.com/' in url or 'twitter.com/' in url)
            is_ad = 'bing.com' in url or 'aclick' in url or 'google.com/aclick' in url
            is_status = '/status/' in url
            is_hashtag = '/hashtag/' in url
            is_event = '/i/events/' in url or '/i/lists/' in url
            
            if not is_twitter or is_ad or is_status or is_hashtag or is_event:
                continue
            
            name = extract_name_from_twitter_title(title)
            
            # Validate name quality
            if len(name.split()) < 2:
                continue # Skip single words
            if len(name) > 40:
                continue # Too long to be a real name
            junk_words = ['results', 'connect with', 'get funded', 'list of', 
                         'top angel', 'best investors', 'how to', 'what is',
                         'the seed', 'angel investors', 'stock', 'invest in',
                         'los angeles', 'call back', 'theory', 'you need our']
            if any(jw in name.lower() for jw in junk_words):
                continue
            # Name should not contain special chars typical of page titles
            if any(c in name for c in ['|', '#', '→', '—', ':', '®', '™', '✨', '🩵']):
                continue
            
            # Filter names containing emojis (using basic regex for non-ascii ranges that usually contain emojis)
            if re.search(r'[\U00010000-\U0010ffff]', name):
                continue
                
            slug = generate_slug(name)
            
            print(f"  -> Found Profile: {name} ({url})")
            
            if check_exists(slug):
                print(f"     [Skip] Already exists in DB.")
            else:
                print(f"     [+] Inserting {name} into database...")
                bio = f"{body} (Source: Twitter)"
                if insert_investor(name, slug, url, bio):
                    total_added += 1
                    
    print(f"\nTwitter Scraper finished. Total new investors added: {total_added}")

if __name__ == "__main__":
    run_twitter_scraper()
    import os
    os._exit(0)
