import os
import re
import json
import urllib.request
import xml.etree.ElementTree as ET
from dotenv import load_dotenv

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
    req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
    
    try:
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode('utf-8'))
            response_text = data['candidates'][0]['content']['parts'][0]['text']
            # Clean up markdown if Gemini ignored instructions
            response_text = response_text.replace('```json', '').replace('```', '').strip()
            names = json.loads(response_text)
            return [n for n in names if isinstance(n, str) and len(n.split()) >= 2]
    except Exception as e:
        print(f"Gemini API Error: {e}")
        return []

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
        
        # Simple heuristic to save Gemini API calls: only process if it mentions funding
        if any(kw in text.lower() for kw in ['raise', 'funding', 'seed', 'series', 'angel', 'invest', 'backing']):
            items.append({'text': text, 'link': link})
    
    return items

def run_news_scraper():
    print("Starting News Scraper...")
    feeds = [
        "https://techcrunch.com/category/startups/feed/",
        # Add more RSS feeds here
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
