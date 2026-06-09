# -*- coding: utf-8 -*-
"""
OpenAngels - Investor Enrichment via Apollo.io
Gets real email + LinkedIn URL for investors.
Free tier: 50 credits/month per account.

Setup:
1. Register at https://app.apollo.io
2. Go to Settings -> Integrations -> API Keys -> Create API Key
3. Add to .env: APOLLO_API_KEY=your_key_here
"""
import os, time, json
import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
APOLLO_KEY = os.getenv("APOLLO_API_KEY", "")

def extract_company(bio, name):
    """Extract company name from bio for Apollo search"""
    import re
    # Common VC firms
    firms = [
        "Y Combinator","Sequoia","a16z","Andreessen Horowitz","Kleiner Perkins",
        "Accel","Index Ventures","Bessemer","Foundry Group","True Ventures",
        "GV","Google Ventures","Benchmark","Greylock","General Catalyst",
        "Matrix Partners","NEA","Redpoint","IVP","Lightspeed",
        "First Round","Spark Capital","Union Square","USV","SV Angel",
        "Haystack","Precursor","Pear VC","Initialized","Homebrew",
        "Forerunner","Cowboy Ventures","Backstage Capital",
        "Techstars","500 Global","Seedcamp","Atomico","Northzone",
        "Earlybird","Point Nine","Creandum","LocalGlobe","Balderton",
        "Kima Ventures","Partech","SOSV","Upfront Ventures",
        "Founders Fund","Khosla","Social Capital","Revolution",
        "Emergence Capital","Bain Capital Ventures",
        "OpenAI","Stripe","Shopify","GitHub","Twitter","Facebook","Google",
        "Microsoft","Amazon","LinkedIn","Uber","Airbnb","Lyft","DoorDash",
        "Dropbox","Box","Slack","Zoom","Twilio","HubSpot","Salesforce",
        "Atlassian","Canva","Figma","Notion","Webflow","Zapier",
        "Nubank","Flipkart","Ola","Grab","Tokopedia","Gojek",
        "Wise","Monzo","Revolut","N26","Klarna","Adyen",
    ]
    bio_lower = bio.lower() if bio else ""
    for firm in firms:
        if firm.lower() in bio_lower:
            return firm
    # Try to extract "at [Company]" pattern
    match = re.search(r'\bat\s+([A-Z][A-Za-z\s&]+?)[\.\,]', bio or "")
    if match:
        return match.group(1).strip()
    return ""

def search_apollo(name, company):
    """Search Apollo.io People API for a person"""
    if not APOLLO_KEY:
        print("No APOLLO_API_KEY in .env!")
        return None
    
    url = "https://api.apollo.io/api/v1/people/match"
    payload = {
        "name": name,
        "organization_name": company,
        "reveal_personal_emails": False,
        "reveal_phone_number": False,
    }
    headers = {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": APOLLO_KEY,
    }
    try:
        r = requests.post(url, json=payload, headers=headers, timeout=15)
        if r.status_code == 200:
            data = r.json()
            person = data.get("person", {})
            return {
                "email": person.get("email"),
                "linkedin_url": person.get("linkedin_url"),
                "title": person.get("title"),
            }
        elif r.status_code == 429:
            print("Rate limited by Apollo - wait 60s")
            time.sleep(60)
        else:
            print(f"Apollo error {r.status_code}: {r.text[:100]}")
    except Exception as e:
        print(f"Error: {e}")
    return None

def run(limit=50, skip_existing=True):
    """Enrich investors with Apollo.io data"""
    print(f"\n>>> Apollo.io Enrichment (limit={limit})\n")
    
    # Get investors without email/linkedin
    query = supabase.table("investors").select("id,name,bio,email,linkedin_url").eq("verified", True)
    if skip_existing:
        query = query.is_("email", "null")
    investors = query.limit(limit * 2).execute().data  # fetch more, filter locally
    
    print(f"Found {len(investors)} investors to enrich")
    
    ok, skipped, failed = 0, 0, 0
    
    for inv in investors[:limit]:
        if ok >= limit:
            break
        name = inv["name"]
        company = extract_company(inv.get("bio", ""), name)
        
        print(f"  [{ok+1}] {name} @ {company or '?'} ...", end=" ", flush=True)
        
        result = search_apollo(name, company)
        
        if result and (result.get("email") or result.get("linkedin_url")):
            update = {}
            if result.get("email"):
                update["email"] = result["email"]
            if result.get("linkedin_url"):
                update["linkedin_url"] = result["linkedin_url"]
            
            supabase.table("investors").update(update).eq("id", inv["id"]).execute()
            print(f"OK - email={result.get('email','—')} linkedin={'yes' if result.get('linkedin_url') else '—'}")
            ok += 1
        else:
            print("not found")
            failed += 1
        
        time.sleep(1.2)  # Be respectful to API rate limits
    
    print(f"\nDone! Enriched={ok} Failed={failed}")
    
    # Show total enriched
    total = supabase.table("investors").select("id", count="exact").not_.is_("email", "null").execute()
    print(f"Total investors with email: {total.count}")

if __name__ == "__main__":
    if not APOLLO_KEY:
        print("ERROR: Add APOLLO_API_KEY to your .env file")
        print("Get it from: https://app.apollo.io -> Settings -> API Keys")
    else:
        run(limit=50)
