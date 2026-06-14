# -*- coding: utf-8 -*-
import argparse
import csv
import os
import re
import sys
import time
import random
from datetime import datetime, timezone
from urllib.parse import quote_plus, urlparse

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client
import dns.resolver

from domain_map_extended import DOMAIN_MAP

if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

EMAIL_RE = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.I)
LINKEDIN_RE = re.compile(r"https?://(?:[a-z]{2,3}\.)?linkedin\.com/in/[A-Za-z0-9_\-%.]+/?", re.I)

class RateLimitError(Exception):
    pass

def fetch(url: str, timeout: int = 10) -> str:
    try:
        res = requests.get(url, headers=HEADERS, timeout=timeout)
        if res.status_code == 429 or res.status_code == 503:
            raise RateLimitError("Rate limited by server")
        if res.status_code == 200 and res.text:
            return res.text
    except RateLimitError:
        raise
    except requests.RequestException:
        return ""
    return ""

def duckduckgo_search(query: str, max_results: int = 5) -> list[tuple[str, str]]:
    url = f"https://duckduckgo.com/html/?q={quote_plus(query)}"
    try:
        html = fetch(url)
    except RateLimitError:
        print("\n[!] DuckDuckGo Rate Limit Hit. Waiting 30s...")
        time.sleep(30)
        try:
            html = fetch(url)
        except RateLimitError:
            print("[!] Still rate limited. Giving up on this query.")
            return []
    if not html:
        return []

    soup = BeautifulSoup(html, "html.parser")
    results = []
    from urllib.parse import urlparse, parse_qs
    for a in soup.find_all("a", class_="result__a"):
        href = a.get("href", "")
        if "uddg=" in href:
            parsed = urlparse(href)
            qs = parse_qs(parsed.query)
            if "uddg" in qs:
                href = qs["uddg"][0]
        title = a.get_text(strip=True)
        if href and title:
            results.append((href, title))
            print(f"DEBUG DDG URL: {href}")
        if len(results) >= max_results:
            break
    return results

def search_linkedin_serper(row, max_results=5):
    """
    Search Google via Serper for LinkedIn profile.
    Returns (url, confidence)
    """
    name = row.get("name", "")
    if not name:
        return "", 0.0
        
    company_hint = row.get("company_hint", "")
    query = f'"{name}"'
    if company_hint:
        query += f' "{company_hint}"'
    query += ' site:linkedin.com/in'
    
    print(f"  [Serper] Searching: {query}")
    api_key = os.getenv("SERPER_API_KEY")
    if not api_key:
        print("  [Error] SERPER_API_KEY not found.")
        return "", 0.0

    try:
        res = requests.post(
            'https://google.serper.dev/search',
            headers={'X-API-KEY': api_key, 'Content-Type': 'application/json'},
            json={'q': query, 'num': max_results},
            timeout=15
        )
        data = res.json()
        results = []
        for item in data.get("organic", []):
            url = item.get("link", "")
            title = item.get("title", "")
            if url and title:
                results.append((url, title))
    except Exception as e:
        print(f"  [Error] Serper search failed: {e}")
        return "", 0.0

    # Score results
    best_candidate, best_score = "", 0.0
    name_lower = name.lower()
    hint_lower = company_hint.lower() if company_hint else ""
    
    name_parts = [p.lower() for p in name.split()]
    company_parts = [p.lower() for p in company_hint.split()] if company_hint else []
    
    for url, title in results:
        title_lower = title.lower()
        
        match = LINKEDIN_RE.search(url)
        if not match:
            continue
            
        candidate = match.group(0).rstrip("/")
        score = 0.4 # Base score for being an /in/ link
        
        slug = candidate.split("/")[-1].lower()
        
        # Require at least some name match
        if not any(p in slug for p in name_parts) and not any(p in title_lower for p in name_parts):
            continue
            
        score = 0.2 # Base score
        
        # Name in slug
        if all(p in slug for p in name_parts):
            score += 0.4
        elif any(p in slug for p in name_parts):
            score += 0.2
            
        # Name in title
        if all(p in title_lower for p in name_parts):
            score += 0.2
        elif any(p in title_lower for p in name_parts):
            score += 0.1
            
        # Company match
        if company_parts and any(p in title_lower for p in company_parts):
            score += 0.2
            
        # Type specifics
        if row.get("type") == "angel":
            score += 0.1
            
        if "investor" in title_lower or "partner" in title_lower:
            score += 0.1
            
        score = min(score, 0.98)
        if score > best_score:
            best_score = score
            best_candidate = candidate
            
    return best_candidate, round(best_score, 2)

def scrape_email_from_website(website: str) -> tuple[str, float]:
    if not website:
        return "", 0.0
    
    if not website.startswith("http"):
        website = f"https://{website}"
        
    try:
        html = fetch(website, timeout=8)
    except RateLimitError:
        return "", 0.0
        
    if not html:
        return "", 0.0
        
    emails = set(EMAIL_RE.findall(html))
    best_email = ""
    best_score = 0.0
    
    domain = urlparse(website).netloc.replace("www.", "")
    
    for email in emails:
        email = email.lower()
        score = 0.8 # Found on their own site!
        
        if email.endswith(f"@{domain}"):
            score += 0.1
            
        if any(p in email for p in ["info@", "contact@", "hello@"]):
            score -= 0.3
            
        if score > best_score:
            best_score = score
            best_email = email
            
    return best_email, round(best_score, 2)

def verify_mx(domain: str) -> bool:
    try:
        answers = dns.resolver.resolve(domain, 'MX')
        return len(answers) > 0
    except Exception:
        return False

def generate_email_pattern(name: str, domain: str) -> tuple[str, float]:
    if not domain:
        return "", 0.0
        
    parts = name.split()
    if not parts:
        return "", 0.0
        
    first = parts[0].lower()
    last = parts[-1].lower() if len(parts) > 1 else ""
    
    if not verify_mx(domain):
        return "", 0.0
        
    # We don't know which pattern is right without SMTP checking,
    # so we just return the most common VC pattern but with low confidence.
    email = f"{first}@{domain}"
    
    # Confidence is 0.6 because MX is valid, but we are guessing the pattern.
    return email, 0.6

def search_email_ddg(name: str, domain: str) -> tuple[str, float]:
    if not domain:
        return "", 0.0
        
    query = f'"{name}" email "@{domain}"'
    time.sleep(random.uniform(2.0, 4.0))
    results = duckduckgo_search(query, max_results=3)
    
    for url, title in results:
        text = f"{url} {title}".lower()
        emails = EMAIL_RE.findall(text)
        for email in emails:
            if email.endswith(f"@{domain}"):
                return email.lower(), 0.75 # Found in search, pretty good
                
    return "", 0.0

def extract_company_hint(row: dict) -> str:
    bio = row.get("bio") or ""
    if row.get("name") in DOMAIN_MAP:
        return row["name"]

    for company in sorted(DOMAIN_MAP, key=len, reverse=True):
        pattern = rf"(?<![A-Za-z0-9]){re.escape(company.lower())}(?![A-Za-z0-9])"
        if re.search(pattern, bio.lower()):
            return company

    match = re.search(r"\bat\s+([A-Z][A-Za-z0-9&\- ]{2,50}?)(?:[.,]|$)", bio)
    if match:
        return match.group(1).strip(" .,-")
        
    return ""

def infer_domain(row: dict, company_hint: str) -> str:
    if row.get("name") in DOMAIN_MAP:
        return DOMAIN_MAP[row["name"]]
        
    for company, domain in sorted(DOMAIN_MAP.items(), key=lambda item: len(item[0]), reverse=True):
        if company.lower() == company_hint.lower():
            return domain
            
    if row.get("website"):
        domain = urlparse(row["website"] if row["website"].startswith("http") else f"http://{row['website']}").netloc
        domain = domain.replace("www.", "")
        if "linkedin.com" not in domain:
            return domain
            
    return ""

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch-size", type=int, default=50)
    parser.add_argument("--limit", type=int, default=1000)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--linkedin-threshold", type=float, default=0.6)
    parser.add_argument("--email-threshold", type=float, default=0.8)
    parser.add_argument("--resume", action="store_true")
    args = parser.parse_args()

    load_dotenv("scraper/.env")
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    supabase = create_client(supabase_url, supabase_key)

    # Fetch rows
    res = supabase.table("investors").select("id,name,bio,type,website,linkedin_url,email").execute()
    all_rows = res.data or []
    
    # Filter rows that need enrichment
    rows = []
    for r in all_rows:
        needs_linkedin = not r.get("linkedin_url")
        needs_email = not r.get("email")
        if needs_linkedin or needs_email:
            rows.append(r)
            
    rows = rows[:args.limit]
    print(f"Loaded {len(rows)} investors needing enrichment.")
    
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d")
    report_file = f"scraper/enrichment_ddg_{stamp}.csv"
    
    processed_ids = set()
    if args.resume and os.path.exists(report_file):
        with open(report_file, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                processed_ids.add(r["id"])
        print(f"Resuming... skipped {len(processed_ids)} already processed.")
    else:
        with open(report_file, "w", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["id", "name", "linkedin_candidate", "linkedin_conf", "email_candidate", "email_conf", "source"])

    rows_to_process = [r for r in rows if r["id"] not in processed_ids]
    
    for i, row in enumerate(rows_to_process, 1):
        name = row["name"]
        print(f"\n[{i}/{len(rows_to_process)}] Processing {name}...")
        
        company_hint = extract_company_hint(row)
        domain = infer_domain(row, company_hint)
        row["company_hint"] = company_hint
        
        linkedin_cand, linkedin_conf = "", 0.0
        if not row.get("linkedin_url"):
            linkedin_cand, linkedin_conf = search_linkedin_serper(row)
            print(f"  LinkedIn: {linkedin_cand} (conf: {linkedin_conf})")
            
        email_cand, email_conf = "", 0.0
        email_source = ""
        if not row.get("email"):
            # 1. Try website
            if row.get("website") and "linkedin.com" not in row.get("website"):
                email_cand, email_conf = scrape_email_from_website(row["website"])
                email_source = "website"
                    
            # 2. Try Pattern
            if email_conf < args.email_threshold and domain:
                cand, conf = generate_email_pattern(name, domain)
                if conf > email_conf:
                    email_cand, email_conf = cand, conf
                    email_source = "pattern"
                    
            print(f"  Email: {email_cand} (conf: {email_conf}, source: {email_source})")
            
        # Write to report
        with open(report_file, "a", encoding="utf-8", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([row["id"], name, linkedin_cand, linkedin_conf, email_cand, email_conf, email_source])
            
        # Update Supabase
        if args.apply:
            payload = {}
            if linkedin_cand and linkedin_conf >= args.linkedin_threshold:
                payload["linkedin_url"] = linkedin_cand
            if email_cand and email_conf >= args.email_threshold:
                payload["email"] = email_cand
                
            if payload:
                payload["contact_enriched_at"] = datetime.now(timezone.utc).isoformat()
                supabase.table("investors").update(payload).eq("id", row["id"]).execute()
                print("  -> Updated Supabase.")

if __name__ == "__main__":
    main()
