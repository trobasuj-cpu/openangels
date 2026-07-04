import os
import re
import json
import urllib.request
import urllib.parse
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from pathlib import Path
from duckduckgo_search import DDGS
import concurrent.futures

# Load .env absolutely
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
        return True

def insert_investor(name, slug, source_url):
    url = f"{SUPABASE_URL}/rest/v1/investors_secure"
    payload = {
        "name": name,
        "slug": slug,
        "bio": f"Extracted from public investor list. Source: {source_url}"
    }
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=HEADERS, method='POST')
    try:
        with urllib.request.urlopen(req) as res:
            return res.status in [200, 201]
    except Exception as e:
        print(f"Failed to insert {name}: {e}")
        return False

def extract_names_with_gemini(text):
    if not GEMINI_API_KEY:
        print("GEMINI_API_KEY not set!")
        return []
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    prompt = """
    Extract ONLY the names of individual Angel Investors mentioned in the following text.
    Ignore VC funds, firm names, and generic words. Only human names.
    Return strictly as a valid JSON array of strings. Do not add markdown or backticks.
    Text:
    """ + text[:30000] # Limit to 30k chars to save tokens/time
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    
    headers = {'Content-Type': 'application/json'}
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
    
    try:
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode('utf-8'))
            response_text = data['candidates'][0]['content']['parts'][0]['text']
            response_text = response_text.replace('```json', '').replace('```', '').strip()
            names = json.loads(response_text)
            return [n for n in names if isinstance(n, str) and len(n.split()) >= 2]
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return []

def ddg_search(query, max_results=3, timeout=10):
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

def scrape_page_text(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as res:
            html = res.read()
            soup = BeautifulSoup(html, 'html.parser')
            # Extract visible text
            for script in soup(["script", "style"]):
                script.extract()
            text = soup.get_text(separator=' ')
            # Clean up whitespace
            text = re.sub(r'\s+', ' ', text).strip()
            return text
    except Exception as e:
        print(f"  [!] Failed to scrape {url}: {e}")
        return ""

def run_lists_scraper():
    print("Starting Open Lists Scraper...")
    
    # Search for public lists of angel investors
    queries = [
        '"angel investors" filetype:pdf OR filetype:csv',
        '"list of angel investors" "name" "portfolio"',
        'site:github.com "angel investors" csv'
    ]
    
    total_added = 0
    
    for query in queries:
        print(f"Searching for lists: {query}")
        results = ddg_search(query, max_results=3)
        
        for r in results:
            url = r.get('href', '')
            if not url or url.endswith('.pdf'): 
                continue # Skip PDFs for now as they require special parsing
                
            print(f"Scraping list page: {url}")
            page_text = scrape_page_text(url)
            
            if len(page_text) < 100:
                continue
                
            print(f"  -> Extracted {len(page_text)} chars of text. Sending to Gemini for analysis...")
            names = extract_names_with_gemini(page_text)
            
            if names:
                print(f"  -> Gemini found {len(names)} names.")
                for name in names[:20]: # Limit to 20 per list to avoid spamming the DB in one go
                    slug = generate_slug(name)
                    if check_exists(slug):
                        pass # Silently skip
                    else:
                        print(f"     [+] Inserting {name} into database...")
                        if insert_investor(name, slug, url):
                            total_added += 1
            else:
                print("  -> No names extracted.")
                
    print(f"\nOpen Lists Scraper finished. Total new investors added: {total_added}")

if __name__ == "__main__":
    run_lists_scraper()
    import os
    os._exit(0)
