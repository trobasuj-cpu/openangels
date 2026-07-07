import os
import re
import json
import urllib.request
import xml.etree.ElementTree as ET
from dotenv import load_dotenv
import requests
import time
from bs4 import BeautifulSoup

# Load .env relative to script location
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', '.env')
load_dotenv(env_path)

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
    # Basic slug generation: lower case, replace spaces with hyphens, remove special chars
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

def insert_investor(name, slug, source_url):
    url = f"{SUPABASE_URL}/rest/v1/investors_secure"
    payload = {
        "name": name,
        "slug": slug,
        "bio": f"Found via automated news parsing. Source: {source_url}"
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
    Analyze the following startup funding news text.
    Extract ONLY the names of individual Angel Investors mentioned as participants in the funding round.
    Do NOT include Venture Capital funds, corporate funds, or company names. Only human names.
    Return the result strictly as a valid JSON array of strings. Do not add markdown formatting or backticks. If none found, return [].
    Text:
    """ + text
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    
    headers = {'Content-Type': 'application/json'}
    for attempt in range(3):
        try:
            res = requests.post(url, headers=headers, data=json.dumps(payload), timeout=15)
            res.raise_for_status()
            response_data = res.json()
            
            try:
                text_result = response_data['candidates'][0]['content']['parts'][0]['text']
                # Clean up markdown if Gemini ignored instructions
                response_text = text_result.replace('```json', '').replace('```', '').strip()
                names = json.loads(response_text)
                return [n for n in names if isinstance(n, str) and len(n.split()) >= 2]
            except (KeyError, IndexError, json.JSONDecodeError):
                return []
        except requests.exceptions.HTTPError as e:
            if res.status_code == 429:
                print(f"Gemini API Rate Limit (429). Retrying in 10s... (Attempt {attempt+1}/3)")
                time.sleep(10)
            else:
                print(f"Gemini API Error: {e}")
                break
        except Exception as e:
            print(f"Gemini API Exception: {e}")
            break
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
        print(f"  [!] Failed to scrape article {url}: {e}")
        return ""

def scrape_rss(feed_url):
    print(f"Fetching RSS: {feed_url}")
    req = urllib.request.Request(feed_url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as res:
            xml_data = res.read()
    except Exception as e:
        print(f"Failed to fetch {feed_url}: {e}")
        return []

    root = ET.fromstring(xml_data)
    items = []
    # Parse RSS (usually inside channel -> item)
    for item in root.findall('.//item'):
        title = item.find('title').text if item.find('title') is not None else ""
        desc = item.find('description').text if item.find('description') is not None else ""
        link = item.find('link').text if item.find('link') is not None else ""
        
        # Combine title and desc to send to Gemini
        text = f"{title}\n{desc}"
        
        # Simple heuristic to save API calls: only process if title/desc mentions funding
        if any(kw in text.lower() for kw in ['raise', 'funding', 'seed', 'series', 'angel', 'invest', 'backing']):
            print(f"  -> Found relevant article: {title}")
            full_text = scrape_page_text(link)
            if len(full_text) > 200:
                # Truncate to save tokens if it's crazy long
                items.append({'text': full_text[:20000], 'link': link})
            else:
                items.append({'text': text, 'link': link})
    
    return items

def run_news_scraper():
    print("Starting News Scraper...")
    feeds = [
        "https://techcrunch.com/category/startups/feed/",
        "https://techcrunch.com/category/venture/feed/",
        "https://sifted.eu/feed/",
        "https://news.crunchbase.com/feed/"
    ]
    
    total_added = 0
    for feed in feeds:
        articles = scrape_rss(feed)
        print(f"Found {len(articles)} relevant articles in {feed}")
        
        for article in articles[:10]: # Limit to 10 articles per run to save API/time
            print(f"Analyzing article: {article['link']}")
            names = extract_names_with_gemini(article['text'])
            print(f"  -> Found names: {names}")
            
            for name in names:
                slug = generate_slug(name)
                if check_exists(slug):
                    print(f"  -> {name} already exists. Skipping.")
                else:
                    print(f"  -> Inserting {name} into database...")
                    if insert_investor(name, slug, article['link']):
                        total_added += 1
                        
    print(f"News Scraper finished. Total new investors added: {total_added}")

if __name__ == "__main__":
    run_news_scraper()
