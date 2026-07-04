import os
import re
import json
import time
import smtplib
import dns.resolver
import urllib.request
import urllib.parse
import concurrent.futures
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from duckduckgo_search import DDGS

load_dotenv('frontend/.env')

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_SERVICE_ROLE_KEY")
github_token = os.environ.get("GITHUB_TOKEN")

if not key or "ВСТАВЬТЕ_СЮДА" in key:
    print("ERROR: Add VITE_SUPABASE_SERVICE_ROLE_KEY to frontend/.env")
    exit(1)

HEADERS = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
}

# ============================================================
# UTILITY
# ============================================================

def ddg_search(query, max_results=3, timeout=8):
    """DuckDuckGo search with hard timeout to prevent hangs."""
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

CHECKED_FILE = os.path.join(os.path.dirname(__file__), 'checked.txt')

def load_checked():
    """Load set of already-processed investor IDs."""
    if os.path.exists(CHECKED_FILE):
        with open(CHECKED_FILE, 'r') as f:
            return set(line.strip() for line in f if line.strip())
    return set()

def mark_checked(investor_id):
    """Append investor ID to checked file."""
    with open(CHECKED_FILE, 'a') as f:
        f.write(str(investor_id) + '\n')

def is_junk_email(email, name=None):
    """Filter out generic/junk emails that are not personal."""
    junk_prefixes = ['noreply', 'no-reply', 'support@', 'info@', 'hello@', 'contact@',
            'sales@', 'admin@', 'help@', 'team@', 'press@', 'jobs@', 'plans@',
            'office@', 'billing@', 'privacy@', 'legal@', 'abuse@', 'webmaster@',
            'postmaster@', 'marketing@', 'feedback@', 'newsletter@', 'enquiries@',
            'corrections@', 'editor@', 'tips@', 'news@', 'media@', 'pr@',
            'careers@', 'recruiting@', 'hr@', 'donate@', 'mail@']
    junk_domains = ['forbes.com', 'nytimes.com', 'wsj.com', 'techcrunch.com',
            'bloomberg.com', 'reuters.com', 'bbc.com', 'cnn.com', 'example.com',
            'sentry.io', 'github.com', 'google.com', 'facebook.com', 'wired.com']
    email_lower = email.lower().strip('.')
    if any(email_lower.startswith(j) for j in junk_prefixes):
        return True
    domain = email_lower.split('@')[-1] if '@' in email_lower else ''
    if domain in junk_domains:
        return True
    if email_lower.endswith(('.png', '.jpg', '.jpeg', '.gif', '.css', '.js', '.svg')):
        return True
    # Name relevance: if we have a name, check the email contains at least part of it
    if name:
        name_parts = re.sub(r'[^a-zA-Z\s]', '', name).lower().split()
        if name_parts:
            email_local = email_lower.split('@')[0]
            # Reject fan/tribute accounts
            if 'fan' in email_local or 'tribute' in email_local or 'official' in email_local:
                return True
            # At least first or last name (3+ chars) should appear in email local part
            relevant = any(part in email_local for part in name_parts if len(part) >= 3)
            if not relevant:
                return True
    return False

# ============================================================
# METHOD 1: Obfuscated email in bio
# ============================================================

def method_deobfuscate(bio):
    if not bio:
        return None
    text = bio.lower()
    text = text.replace('[at]', '@').replace('(at)', '@').replace(' at ', '@')
    text = text.replace('[dot]', '.').replace('(dot)', '.').replace(' dot ', '.')
    match = re.search(r'([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)', text)
    if match:
        return match.group(1)
    return None

# ============================================================
# METHOD 2: GitHub public events (uses github username, NOT twitter)
# ============================================================

def method_github(name):
    """Search GitHub for the person by name, then check their public events."""
    if not github_token:
        return None
    gh_headers = {
        'User-Agent': 'Mozilla/5.0',
        'Authorization': f'token {github_token}'
    }
    # Search GitHub users by name
    try:
        search_url = f"https://api.github.com/search/users?q={urllib.parse.quote(name)}&per_page=3"
        res = requests.get(search_url, headers=gh_headers, timeout=5)
        if res.status_code != 200:
            return None
        users = res.json().get('items', [])
        for user in users:
            login = user['login']
            # Check public events for push commits
            ev_res = requests.get(f"https://api.github.com/users/{login}/events/public",
                                  headers=gh_headers, timeout=5)
            if ev_res.status_code == 200:
                for ev in ev_res.json():
                    if ev.get('type') == 'PushEvent':
                        for c in ev['payload'].get('commits', []):
                            email = c.get('author', {}).get('email', '')
                            if email and 'noreply.github.com' not in email and not is_junk_email(email):
                                return email
    except Exception:
        pass
    return None

# ============================================================
# METHOD 3: Personal website scraping
# ============================================================

def extract_personal_url(bio):
    if not bio:
        return None
    match = re.search(r'(?:https?://)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})(?:/|\s|$)', bio)
    if match:
        domain = match.group(1)
        skip = ['twitter.com', 'linkedin.com', 'google.com', 'facebook.com',
                'instagram.com', 'youtube.com', 'medium.com', 'github.com',
                'crunchbase.com', 'angel.co', 'substack.com']
        if domain not in skip and not any(domain.endswith(ext) for ext in ['.png', '.jpg', '.pdf']):
            return 'http://' + domain
    return None

def method_scrape_website(website_url):
    if not website_url:
        return None
    try:
        res = requests.get(website_url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=5)
        if res.status_code == 200:
            soup = BeautifulSoup(res.text, 'html.parser')
            for a in soup.find_all('a', href=True):
                if a['href'].startswith('mailto:'):
                    email = a['href'].replace('mailto:', '').split('?')[0].strip()
                    if not is_junk_email(email):
                        return email
            match = re.search(r'([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)', soup.get_text())
            if match and not is_junk_email(match.group(1)):
                return match.group(1)
    except Exception:
        pass
    return None

# ============================================================
# METHOD 4: Company domain extraction + SMTP verification
# ============================================================

def extract_company_name(bio):
    """Extract CLEAN company name from bio text."""
    if not bio:
        return None
    # Pattern: "at CompanyName" or "of CompanyName" — take only 1-3 words before punctuation
    patterns = [
        r'(?:partner at|investor at|ceo of|cto of|founder of|co-founder of|managing partner at|principal at|gp at|vp at|director at)\s+([A-Z][a-zA-Z0-9]+(?:\s[A-Z][a-zA-Z0-9]+){0,2})',
        r'(?:Founder|CEO|CTO|Partner)\s+(?:of|at)\s+([A-Z][a-zA-Z0-9]+(?:\s[A-Z][a-zA-Z0-9]+){0,2})',
    ]
    for pat in patterns:
        match = re.search(pat, bio)
        if match:
            company = match.group(1).strip().rstrip('.,;:!')
            if len(company) > 2:
                return company
    return None

def get_clearbit_domain(company_name):
    try:
        api_url = f"https://autocomplete.clearbit.com/v1/companies/suggest?query={urllib.parse.quote(company_name)}"
        res = requests.get(api_url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=5)
        if res.status_code == 200:
            data = res.json()
            if data:
                return data[0]['domain']
    except Exception:
        pass
    return None

def extract_domain_from_bio(bio):
    """Try to find a company domain directly mentioned in bio."""
    if not bio:
        return None
    match = re.search(r'([a-zA-Z0-9-]+\.(vc|capital|co|io|fund|partners|ventures|xyz))', bio.lower())
    if match:
        return match.group(1).replace('www.', '')
    return None

def get_mx_record(domain):
    try:
        return sorted(dns.resolver.resolve(domain, 'MX'), key=lambda r: r.preference)[0].exchange.to_text()
    except Exception:
        return None

def verify_email(email, mx_record):
    try:
        server = smtplib.SMTP(timeout=5)
        server.connect(mx_record)
        server.helo(server.local_hostname)
        server.mail('hello@openangels.xyz')
        code, _ = server.rcpt(email)
        server.quit()
        return code == 250
    except Exception:
        return False

def is_catch_all(domain, mx_record):
    return verify_email(f"noreply_test_{int(time.time())}@{domain}", mx_record)

def generate_permutations(name, domain):
    clean = re.sub(r'[^a-zA-Z\s]', '', name).lower().strip()
    parts = clean.split()
    if not parts:
        return []
    if len(parts) == 1:
        return [f"{parts[0]}@{domain}"]
    first, last = parts[0], parts[-1]
    return [
        f"{first}@{domain}", f"{first}{last}@{domain}", f"{first}.{last}@{domain}",
        f"{first[0]}{last}@{domain}", f"{first[0]}.{last}@{domain}",
        f"{first}{last[0]}@{domain}", f"{first}.{last[0]}@{domain}",
        f"{last}@{domain}"
    ]

def method_smtp_company(name, bio):
    """Try to find company domain via bio regex or Clearbit, then SMTP verify."""
    # 1. Direct domain in bio
    domain = extract_domain_from_bio(bio)
    # 2. Company name -> Clearbit
    if not domain:
        company = extract_company_name(bio)
        if company:
            domain = get_clearbit_domain(company)
    if not domain:
        return None, None
        
    mx = get_mx_record(domain)
    if not mx:
        return domain, None
    if is_catch_all(domain, mx):
        return domain, 'CATCHALL'
    
    perms = generate_permutations(name, domain)
    for p in perms:
        if verify_email(p, mx):
            return domain, p
        time.sleep(0.3)
    return domain, None

# ============================================================
# METHOD 5 (NEW!): DDG direct email search in snippets
# ============================================================

def method_ddg_email_search(name):
    """Search DuckDuckGo for the person's email directly in search snippets."""
    results = ddg_search(f'"{name}" email contact', max_results=5, timeout=8)
    for r in results:
        text = (r.get('body', '') + ' ' + r.get('title', '')).lower()
        emails = re.findall(r'([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)', text)
        for email in emails:
            email = email.strip('.').lower()
            if not is_junk_email(email, name):
                return email
    return None

# ============================================================
# METHOD 6: DDG catch-all domain email leak search
# ============================================================

def method_ddg_catchall(name, domain):
    """For catch-all domains, search DDG for leaked emails."""
    results = ddg_search(f'"{name}" "@{domain}" email', max_results=5, timeout=8)
    for r in results:
        text = r.get('body', '') + ' ' + r.get('title', '')
        match = re.search(r'([a-zA-Z0-9_.+-]+@' + re.escape(domain) + r')', text, re.IGNORECASE)
        if match:
            email = match.group(1).lower().strip('.')
            if not is_junk_email(email, name):
                return email
    return None

# ============================================================
# METHOD 7: DDG domain discovery fallback
# ============================================================

def method_ddg_find_domain(name):
    """Use DDG to find the investor's company website when bio has no clues."""
    results = ddg_search(f'"{name}" investor official website', max_results=3, timeout=5)
    skip = ['linkedin.com', 'twitter.com', 'crunchbase.com', 'wikipedia.org',
            'facebook.com', 'instagram.com', 'youtube.com', 'medium.com',
            'angel.co', 'rocketreach.co', 'contactout.com', 'zoominfo.com']
    for r in results:
        try:
            d = urllib.parse.urlparse(r.get('href', '')).netloc.replace('www.', '')
            if d and len(d) > 3 and not any(s in d for s in skip):
                return d
        except Exception:
            pass
    return None

# ============================================================
# METHOD 8: DDG scrape contact page
# ============================================================

def method_ddg_scrape_contact(name):
    """Search for the person's contact/about page and scrape it for emails."""
    results = ddg_search(f'"{name}" contact email site', max_results=3, timeout=5)
    for r in results:
        page_url = r.get('href', '')
        if not page_url or any(s in page_url for s in ['linkedin.com', 'twitter.com', 'rocketreach.co', 'contactout.com', 'zoominfo.com']):
            continue
        try:
            res = requests.get(page_url, headers={'User-Agent': 'Mozilla/5.0'}, timeout=5)
            if res.status_code == 200:
                soup = BeautifulSoup(res.text, 'html.parser')
                # Check mailto links
                for a in soup.find_all('a', href=True):
                    if a['href'].startswith('mailto:'):
                        email = a['href'].replace('mailto:', '').split('?')[0].strip()
                        if not is_junk_email(email, name):
                            return email
                # Check text
                text = soup.get_text()
                emails = re.findall(r'([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)', text)
                for email in emails:
                    if not is_junk_email(email, name):
                        return email
        except Exception:
            pass
    return None

# ============================================================
# SUPABASE UPDATE
# ============================================================

def update_supabase(investor_id, email):
    update_url = f"{url}/rest/v1/investors?id=eq.{investor_id}"
    req = urllib.request.Request(
        update_url,
        data=json.dumps({"email": email}).encode('utf-8'),
        headers=HEADERS,
        method='PATCH'
    )
    try:
        with urllib.request.urlopen(req) as res:
            return res.status in [200, 204]
    except Exception:
        return False

# ============================================================
# MAIN PIPELINE
# ============================================================

def run_pipeline():
    print("Pipeline V4 (Full OSINT Cascade)")
    
    # Check GitHub token
    if github_token:
        try:
            res = requests.get('https://api.github.com/rate_limit',
                               headers={'Authorization': f'token {github_token}', 'User-Agent': 'Mozilla/5.0'}, timeout=5)
            if res.status_code == 200:
                remaining = res.json()['rate']['remaining']
                print(f"  GitHub API: OK (remaining: {remaining})")
            else:
                print(f"  GitHub API: BROKEN (status {res.status_code}) - check your token!")
        except Exception as e:
            print(f"  GitHub API: Error ({e})")
    else:
        print("  GitHub API: No token set")
    
    # Fetch all investors without email
    targets = []
    limit, offset = 1000, 0
    while True:
        req_url = f"{url}/rest/v1/investors?select=id,name,bio,email,linkedin_url,twitter_url&limit={limit}&offset={offset}"
        req = urllib.request.Request(req_url, headers=HEADERS)
        try:
            with urllib.request.urlopen(req) as res:
                data = json.loads(res.read().decode('utf-8'))
                for item in data:
                    has_email = bool(item.get('email') and str(item.get('email')).strip())
                    if not has_email:
                        targets.append(item)
                if len(data) < limit:
                    break
                offset += limit
        except Exception as e:
            print(f"Download error: {e}")
            break
    
    print(f"  Targets: {len(targets)}\n")
    success = 0
    total = len(targets)
    
    checked = load_checked()
    skipped = 0
    
    for i, item in enumerate(targets):
        inv_id = str(item['id'])
        if inv_id in checked:
            skipped += 1
            continue
        
        name = item.get('name', 'Unknown')
        bio = item.get('bio', '') or ''
        processed = i + 1
        remaining = total - skipped
        pct = f"[{processed - skipped}/{remaining}]"
        
        print(f"{pct} {name}...", end="", flush=True)
        
        # --- Method 1: Deobfuscation ---
        email = method_deobfuscate(bio)
        if email:
            print(f" M1(deobfuscate): {email}")
            if update_supabase(item['id'], email):
                success += 1
            mark_checked(item['id'])
            continue
        
        # --- Method 5 (NEW): DDG direct email search ---
        email = method_ddg_email_search(name)
        if email:
            print(f" M5(ddg-email): {email}")
            if update_supabase(item['id'], email):
                success += 1
            mark_checked(item['id'])
            continue
        
        # --- Method 2: GitHub ---
        email = method_github(name)
        if email:
            print(f" M2(github): {email}")
            if update_supabase(item['id'], email):
                success += 1
            mark_checked(item['id'])
            continue
        
        # --- Method 3: Personal website ---
        personal_url = extract_personal_url(bio)
        if personal_url:
            email = method_scrape_website(personal_url)
            if email:
                print(f" M3(website): {email}")
                if update_supabase(item['id'], email):
                    success += 1
                mark_checked(item['id'])
                continue
        
        # --- Method 4: Company SMTP ---
        domain, result = method_smtp_company(name, bio)
        if result and result != 'CATCHALL':
            print(f" M4(smtp): {result}")
            if update_supabase(item['id'], result):
                success += 1
            mark_checked(item['id'])
            continue
        elif result == 'CATCHALL' and domain:
            # Method 6: DDG catch-all leak
            email = method_ddg_catchall(name, domain)
            if email:
                print(f" M6(catchall-ddg): {email}")
                if update_supabase(item['id'], email):
                    success += 1
                mark_checked(item['id'])
                continue
        
        # --- Method 7: DDG domain discovery ---
        if not domain:
            domain = method_ddg_find_domain(name)
            if domain:
                mx = get_mx_record(domain)
                if mx and not is_catch_all(domain, mx):
                    perms = generate_permutations(name, domain)
                    found = False
                    for p in perms:
                        if verify_email(p, mx):
                            print(f" M7(ddg-domain+smtp): {p}")
                            if update_supabase(item['id'], p):
                                success += 1
                            found = True
                            break
                        time.sleep(0.3)
                    if found:
                        mark_checked(item['id'])
                        continue
        
        # --- Method 8: DDG scrape contact page ---
        email = method_ddg_scrape_contact(name)
        if email:
            print(f" M8(ddg-scrape): {email}")
            if update_supabase(item['id'], email):
                success += 1
            mark_checked(item['id'])
            continue
        
        print(" X (NOT FOUND)")
        # Mark as NOT_FOUND in database to avoid re-checking tomorrow
        update_supabase(item['id'], "NOT_FOUND")
        mark_checked(item['id'])
        time.sleep(1)
    
    print(f"\n=== DONE! Found: {success} / {total} ===")

if __name__ == "__main__":
    run_pipeline()
    import os
    os._exit(0)
