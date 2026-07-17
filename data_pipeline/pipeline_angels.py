import os
import json
import urllib.request
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from pathlib import Path

# Load .env absolutely
env_path = Path(__file__).parent.parent / 'frontend' / '.env'
load_dotenv(str(env_path))

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_SERVICE_ROLE_KEY")

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

def check_duplicate(url):
    check_url = f"{SUPABASE_URL}/rest/v1/investor_queue?source_url=eq.{urllib.parse.quote(url)}&select=id"
    req = urllib.request.Request(check_url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode('utf-8'))
            return len(data) > 0
    except Exception:
        return False

def push_to_queue(text, url):
    insert_url = f"{SUPABASE_URL}/rest/v1/investor_queue"
    payload = {
        "raw_text": text,
        "source_url": url,
        "status": "pending"
    }
    req = urllib.request.Request(insert_url, data=json.dumps(payload).encode('utf-8'), headers=HEADERS, method='POST')
    try:
        with urllib.request.urlopen(req) as res:
            return res.status in [200, 201]
    except Exception as e:
        print(f"Failed to queue: {e}")
        return False

def run_sourcing():
    print("Starting Reliable Sourcing (RSS Feeds)...")
    added = 0
    
    for feed_url in RSS_FEEDS:
        print(f"\n[+] Fetching {feed_url}")
        try:
            res = requests.get(feed_url, timeout=10)
            if res.status_code != 200:
                continue
            
            soup = BeautifulSoup(res.text, "xml")
            items = soup.find_all("item")
            
            for item in items[:15]: 
                title = item.title.text if item.title else ""
                link = item.link.text if item.link else ""
                desc_html = item.description.text if item.description else ""
                
                # We fetch all deals. The updated AI in the Admin UI will now automatically 
                # extract ONLY human names and skip companies.
                if check_duplicate(link):
                    print(f"  [Skip] Already queued: {title}")
                    continue
                
                clean_desc = BeautifulSoup(desc_html, "html.parser").get_text(separator=' ').strip()
                raw_text = f"Title: {title}\nLink: {link}\n\nContent:\n{clean_desc}"
                
                print(f"  [Queueing] {title}")
                if push_to_queue(raw_text, link):
                    added += 1
                    
        except Exception as e:
            print(f"Error processing {feed_url}: {e}")
            
    print(f"\n=== Sourcing Complete! Added {added} fresh items to the Queue ===")

if __name__ == "__main__":
    run_sourcing()
