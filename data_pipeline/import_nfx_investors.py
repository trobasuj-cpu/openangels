import os
import sys
import json
import time
import re
import gzip
import io
import urllib.parse
import urllib.request
import requests
from bs4 import BeautifulSoup
from pathlib import Path
from dotenv import load_dotenv

# Import OSINT email search helpers
sys.path.append(os.path.dirname(__file__))
import find_emails as fe

# Force stdout encoding to UTF-8
sys.stdout.reconfigure(encoding='utf-8')

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

STANDARD_TAGS = [
    "ai", "saas", "fintech", "b2b", "b2c", "climate", "health", 
    "crypto", "web3", "creator-economy", "marketplace", "developer-tools",
    "deeptech", "ecommerce", "edtech", "hardware", "gaming"
]

def check_duplicate_in_db(name, linkedin_url=None):
    """
    Checks if investor already exists in Supabase by name or LinkedIn URL.
    Returns True if exists (duplicate), False if new.
    """
    # 1. Check exact name match
    query_name = f"{SUPABASE_URL}/rest/v1/investors_secure?name=ilike.{urllib.parse.quote(name.strip())}&select=id"
    req = urllib.request.Request(query_name, headers=HEADERS)
    try:
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode('utf-8'))
            if len(data) > 0:
                return True
    except Exception:
        pass

    # 2. Check LinkedIn URL match if provided
    if linkedin_url:
        clean_li = linkedin_url.split('?')[0].rstrip('/')
        query_li = f"{SUPABASE_URL}/rest/v1/investors_secure?linkedin_url=ilike.*{urllib.parse.quote(clean_li)}*&select=id"
        req = urllib.request.Request(query_li, headers=HEADERS)
        try:
            with urllib.request.urlopen(req) as res:
                data = json.loads(res.read().decode('utf-8'))
                if len(data) > 0:
                    return True
        except Exception:
            pass

    return False

def make_slug(name):
    clean = re.sub(r'[^a-zA-Z0-9\s-]', '', name).strip().lower()
    return re.sub(r'[\s-]+', '-', clean)

def fetch_nfx_sitemap_urls(max_urls=100):
    print("Fetching Signal NFX sitemap.xml.gz...")
    url = "https://signal.nfx.com/sitemap.xml.gz"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    
    try:
        with urllib.request.urlopen(req, timeout=10) as res:
            compressed = res.read()
            xml_text = gzip.GzipFile(fileobj=io.BytesIO(compressed)).read().decode('utf-8')
            investor_urls = re.findall(r'https://signal\.nfx\.com/investors/[a-zA-Z0-9_-]+', xml_text)
            print(f"Found {len(investor_urls)} total investor URLs in NFX sitemap.")
            return list(dict.fromkeys(investor_urls))[:max_urls]
    except Exception as e:
        print(f"Error fetching NFX sitemap: {e}")
        return []

def parse_nfx_profile(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
    try:
        with urllib.request.urlopen(req, timeout=8) as res:
            html = res.read().decode('utf-8')
            soup = BeautifulSoup(html, 'html.parser')
            
            # Name
            h1 = soup.find('h1')
            if not h1:
                return None
            name = h1.text.strip()
            if not name or len(name) < 3 or len(name.split()) > 4:
                return None

            # Remove noise suffixes like "(1)" in names
            name = re.sub(r'\(\d+\)', '', name).strip()
                
            # Social links
            linkedin_url = None
            twitter_url = None
            website = None
            
            for a in soup.find_all('a', href=True):
                href = a['href']
                if 'linkedin.com/in/' in href and not linkedin_url:
                    linkedin_url = href.split('?')[0]
                elif ('twitter.com/' in href or 'x.com/' in href) and not twitter_url:
                    if 'nfx.com' not in href and 'nfx' not in href.split('/')[-1] and '/status/' not in href:
                        twitter_url = href.split('?')[0]
                elif href.startswith('http') and not any(x in href for x in ['signal.nfx.com', 'nfx.com', 'linkedin.com', 'twitter.com', 'x.com', 'google.com']):
                    if not website:
                        website = href

            # Firm & Location
            firm = None
            text_block = soup.get_text('\n')
            lines = [line.strip() for line in text_block.split('\n') if line.strip()]
            
            location = None
            for idx, line in enumerate(lines):
                if any(loc in line for loc in ['San Francisco', 'Bay Area', 'New York', 'London', 'Boston', 'Austin', 'Los Angeles', 'Seattle', 'Chicago', 'Europe']):
                    if not location and len(line) < 45:
                        location = line
                if line == 'is a member of' and idx + 1 < len(lines):
                    potential_firm = lines[idx + 1]
                    if potential_firm not in ['CONNECTIONS', 'Current Investing Position']:
                        firm = potential_firm

            # Bio
            meta_desc = soup.find('meta', property='og:description')
            bio = meta_desc['content'].strip() if meta_desc and meta_desc.get('content') else ""
            if not bio or "View who can give you a warm intro" in bio or "Signal" in bio:
                if firm and firm != "Independent":
                    bio = f"Partner at {firm}. Active early-stage angel investor and VC."
                else:
                    bio = f"Active early-stage angel investor and VC."

            # Tags
            industries = ["saas", "ai"]
            stages = ["pre-seed", "seed"]

            # Try finding email via OSINT cascade if domain/socials exist
            email = None
            if website or linkedin_url:
                try:
                    email_result = fe.find_investor_email(name, website, linkedin_url)
                    if email_result and isinstance(email_result, dict):
                        email = email_result.get('email')
                except Exception:
                    pass

            return {
                "name": name,
                "slug": make_slug(name),
                "bio": bio,
                "location": location or "United States",
                "website": website,
                "linkedin_url": linkedin_url,
                "twitter_url": twitter_url,
                "email": email,
                "industries": industries,
                "stages": stages,
                "source_url": url
            }
    except Exception as e:
        return None

def import_nfx_batch(limit=10):
    print(f"=== Starting NFX Signal Investor Importer (Batch size: {limit}) ===")
    
    urls = fetch_nfx_sitemap_urls(max_urls=limit * 4)
    if not urls:
        print("No URLs found. Exiting.")
        return

    added_count = 0
    skipped_duplicates = 0

    for url in urls:
        if added_count >= limit:
            break
            
        print(f"\nProcessing: {url}")
        profile = parse_nfx_profile(url)
        if not profile:
            print("  -> Could not parse profile. Skipping.")
            continue

        name = profile['name']

        # CHECK DEDUPARATION BEFORE INSERTING
        if check_duplicate_in_db(name, profile['linkedin_url']):
            print(f"  -> ⚠️ DUPLICATE FOUND: '{name}' is already in Supabase database! SKIPPING.")
            skipped_duplicates += 1
            continue

        # Insert new investor into Supabase (NO 'firm' field, embedded in bio!)
        payload_data = {
            "name": profile["name"],
            "slug": profile["slug"],
            "bio": profile["bio"],
            "location": profile["location"],
            "website": profile["website"],
            "linkedin_url": profile["linkedin_url"],
            "twitter_url": profile["twitter_url"],
            "email": profile["email"],
            "industries": profile["industries"],
            "stages": profile["stages"],
            "active": True,
            "created_at": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
        }
        
        payload = json.dumps(payload_data).encode('utf-8')

        req = urllib.request.Request(f"{SUPABASE_URL}/rest/v1/investors_secure", data=payload, headers=HEADERS, method='POST')
        try:
            with urllib.request.urlopen(req) as res:
                if res.status in (200, 201):
                    added_count += 1
                    email_str = f" [Email: {profile['email']}]" if profile['email'] else ""
                    print(f"  -> ✅ SUCCESS: Added '{name}' to OpenAngels database!{email_str}")
        except Exception as e:
            print(f"  -> Error inserting to DB: {e}")

        time.sleep(1) # Gentle 1s rate limit

    print("\n" + "="*50)
    print(f"SUMMARY: Added {added_count} new unique investors. Skipped {skipped_duplicates} duplicates.")
    print("="*50)

    if added_count > 0:
        print("\n⚡ Running OSINT Email Search Cascade (find_emails.py) for new profiles...")
        try:
            subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), 'find_emails.py')], timeout=60)
        except Exception as e:
            print(f"  -> Email search finished or timed out: {e}")

if __name__ == "__main__":
    count = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    import_nfx_batch(limit=count)
