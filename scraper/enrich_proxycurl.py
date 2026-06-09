# -*- coding: utf-8 -*-
"""
OpenAngels - Investor Enrichment via Proxycurl
Gets real LinkedIn profile URL + data.
Free tier: 100 credits on signup.

Setup:
1. Register at https://nubela.co/proxycurl
2. Get API key from dashboard
3. Add to .env: PROXYCURL_API_KEY=your_key_here
"""
import os, time
import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
PROXYCURL_KEY = os.getenv("PROXYCURL_API_KEY", "")

def find_linkedin_by_name(name, company=""):
    """Use Proxycurl Person Lookup API to find LinkedIn by name"""
    url = "https://nubela.co/proxycurl/api/linkedin/profile/resolve"
    params = {
        "first_name": name.split()[0],
        "last_name": " ".join(name.split()[1:]) if len(name.split()) > 1 else "",
        "company_domain": "",  # optional
        "location": "",
        "title": "",
        "similarity_checks": "include",
        "enrich_profile": "skip",
    }
    if company:
        # Map company to domain
        domain_map = {
            "Y Combinator": "ycombinator.com",
            "Sequoia": "sequoiacap.com",
            "a16z": "a16z.com","Andreessen Horowitz": "a16z.com",
            "Kleiner Perkins": "kleinerperkins.com",
            "Accel": "accel.com","Index Ventures": "indexventures.com",
            "Bessemer": "bvp.com","Greylock": "greylock.com",
            "General Catalyst": "generalcatalyst.com",
            "Benchmark": "benchmark.com","GV": "gv.com",
            "Techstars": "techstars.com","500 Global": "500.co",
            "Atomico": "atomico.com","Northzone": "northzone.com",
            "Seedcamp": "seedcamp.com","Balderton": "balderton.com",
            "Stripe": "stripe.com","Shopify": "shopify.com",
            "GitHub": "github.com","Twitter": "twitter.com",
            "Google": "google.com","Microsoft": "microsoft.com",
            "Atlassian": "atlassian.com","Canva": "canva.com",
            "Figma": "figma.com","Notion": "notion.so",
        }
        for k, v in domain_map.items():
            if k.lower() in company.lower():
                params["company_domain"] = v
                break

    headers = {"Authorization": f"Bearer {PROXYCURL_KEY}"}
    try:
        r = requests.get(url, params=params, headers=headers, timeout=15)
        if r.status_code == 200:
            data = r.json()
            linkedin = data.get("url", "")
            return linkedin if linkedin else None
        elif r.status_code == 404:
            return None
        elif r.status_code == 429:
            print("Rate limited - waiting 30s")
            time.sleep(30)
        else:
            print(f"Proxycurl error {r.status_code}: {r.text[:100]}")
    except Exception as e:
        print(f"Error: {e}")
    return None

def extract_company(bio):
    import re
    firms = [
        "Y Combinator","Sequoia","a16z","Andreessen Horowitz","Kleiner Perkins",
        "Accel","Index Ventures","Bessemer","Greylock","General Catalyst",
        "Benchmark","GV","Techstars","500 Global","Atomico","Northzone",
        "Seedcamp","Balderton","Stripe","Shopify","GitHub","Atlassian",
        "Canva","Figma","Notion","Webflow","Zapier","Twilio","Slack","Zoom",
    ]
    bio_lower = bio.lower() if bio else ""
    for firm in firms:
        if firm.lower() in bio_lower:
            return firm
    match = re.search(r'\bat\s+([A-Z][A-Za-z\s&]+?)[\.\,]', bio or "")
    if match:
        return match.group(1).strip()
    return ""

def run(limit=100, skip_existing=True):
    print(f"\n>>> Proxycurl LinkedIn Enrichment (limit={limit})\n")
    
    # Get investors without linkedin_url
    query = supabase.table("investors").select("id,name,bio,linkedin_url").eq("verified", True)
    if skip_existing:
        query = query.is_("linkedin_url", "null")
    investors = query.limit(limit * 2).execute().data

    print(f"Found {len(investors)} investors without LinkedIn")
    
    ok, failed = 0, 0
    for inv in investors[:limit]:
        if ok >= limit:
            break
        name = inv["name"]
        company = extract_company(inv.get("bio",""))
        print(f"  [{ok+1}] {name} @ {company or '?'} ...", end=" ", flush=True)
        
        linkedin = find_linkedin_by_name(name, company)
        if linkedin:
            supabase.table("investors").update({"linkedin_url": linkedin}).eq("id", inv["id"]).execute()
            print(f"OK -> {linkedin}")
            ok += 1
        else:
            print("not found")
            failed += 1
        time.sleep(1.5)
    
    print(f"\nDone! Found={ok} Failed={failed}")
    total = supabase.table("investors").select("id", count="exact").not_.is_("linkedin_url", "null").execute()
    print(f"Total investors with LinkedIn: {total.count}")

if __name__ == "__main__":
    if not PROXYCURL_KEY:
        print("ERROR: Add PROXYCURL_API_KEY to your .env file")
        print("Get it from: https://nubela.co/proxycurl -> Dashboard -> API Key")
    else:
        run(limit=100)
