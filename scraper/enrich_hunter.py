# -*- coding: utf-8 -*-
"""
OpenAngels - Investor Enrichment via Hunter.io
Gets professional email by name + company domain.
Free tier: 25 searches/month per account.

Setup:
1. Register at https://hunter.io
2. Go to API -> Get API key
3. Add to .env: HUNTER_API_KEY=your_key_here
"""
import os, time
import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))
HUNTER_KEY = os.getenv("HUNTER_API_KEY", "")

DOMAIN_MAP = {
    "Y Combinator": "ycombinator.com",
    "Sequoia": "sequoiacap.com",
    "a16z": "a16z.com", "Andreessen Horowitz": "a16z.com",
    "Kleiner Perkins": "kleinerperkins.com",
    "Accel": "accel.com",
    "Index Ventures": "indexventures.com",
    "Bessemer": "bvp.com",
    "Greylock": "greylock.com",
    "General Catalyst": "generalcatalyst.com",
    "Benchmark": "benchmark.com",
    "GV": "gv.com",
    "True Ventures": "trueventures.com",
    "Foundry Group": "foundrygroup.com",
    "Homebrew": "homebrew.co",
    "First Round": "firstround.com",
    "Spark Capital": "sparkcapital.com",
    "Union Square Ventures": "usv.com",
    "Techstars": "techstars.com",
    "500 Global": "500.co",
    "Atomico": "atomico.com",
    "Northzone": "northzone.com",
    "Seedcamp": "seedcamp.com",
    "Balderton": "balderton.com",
    "Earlybird": "earlybird.com",
    "Point Nine": "pointninecap.com",
    "Creandum": "creandum.com",
    "LocalGlobe": "localglobe.vc",
    "Partech": "partechpartners.com",
    "Kima Ventures": "kimaventures.com",
    "Upfront Ventures": "upfront.com",
    "Forerunner": "forerunnerventures.com",
    "Cowboy Ventures": "cowboy.vc",
    "SV Angel": "svangel.com",
    "Haystack": "haystack.vc",
    "Precursor": "precursorvc.com",
    "Pear VC": "pear.vc",
    "Blackbird": "blackbird.vc",
    "Stripe": "stripe.com",
    "Shopify": "shopify.com",
    "GitHub": "github.com",
    "Atlassian": "atlassian.com",
    "Canva": "canva.com",
    "Figma": "figma.com",
    "Notion": "notion.so",
    "Webflow": "webflow.com",
    "Zapier": "zapier.com",
    "Twilio": "twilio.com",
    "Slack": "slack.com",
    "Zoom": "zoom.us",
    "HubSpot": "hubspot.com",
    "Salesforce": "salesforce.com",
    "OpenAI": "openai.com",
    "Airbnb": "airbnb.com",
    "DoorDash": "doordash.com",
    "Lyft": "lyft.com",
    "Uber": "uber.com",
    "Pinterest": "pinterest.com",
    "Twitter": "twitter.com",
    "Google": "google.com",
    "Microsoft": "microsoft.com",
    "Facebook": "meta.com",
    "LinkedIn": "linkedin.com",
}

def get_domain(bio):
    """Find company domain from investor bio"""
    bio_lower = (bio or "").lower()
    for company, domain in DOMAIN_MAP.items():
        if company.lower() in bio_lower:
            return domain, company
    return None, None

def find_email_hunter(first, last, domain):
    """Call Hunter.io Email Finder API"""
    url = "https://api.hunter.io/v2/email-finder"
    params = {
        "domain": domain,
        "first_name": first,
        "last_name": last,
        "api_key": HUNTER_KEY,
    }
    try:
        r = requests.get(url, params=params, timeout=15)
        if r.status_code == 200:
            data = r.json().get("data", {})
            email = data.get("email")
            confidence = data.get("score", 0)
            if email and confidence >= 50:
                return email
        elif r.status_code == 429:
            print("Rate limited - wait 60s")
            time.sleep(60)
        elif r.status_code == 403:
            print("Hunter quota exhausted for this account")
            return "QUOTA_EXHAUSTED"
    except Exception as e:
        print(f"Error: {e}")
    return None

def run(limit=25, skip_existing=True):
    print(f"\n>>> Hunter.io Email Enrichment (limit={limit})\n")

    query = supabase.table("investors").select("id,name,bio,email").eq("verified", True)
    if skip_existing:
        query = query.is_("email", "null")
    investors = query.limit(200).execute().data

    # Only process investors where we know the domain
    enrichable = []
    for inv in investors:
        domain, company = get_domain(inv.get("bio",""))
        if domain:
            enrichable.append({**inv, "_domain": domain, "_company": company})

    print(f"Found {len(enrichable)} investors with known company domains")
    print(f"Processing first {min(limit, len(enrichable))}...\n")

    ok, failed, quota = 0, 0, 0
    for inv in enrichable[:limit]:
        if quota > 0:
            break
        parts = inv["name"].split()
        first = parts[0]
        last = " ".join(parts[1:]) if len(parts) > 1 else ""

        print(f"  [{ok+1}] {inv['name']} @ {inv['_domain']} ...", end=" ", flush=True)

        email = find_email_hunter(first, last, inv["_domain"])

        if email == "QUOTA_EXHAUSTED":
            print("QUOTA DONE - switch account!")
            quota += 1
            break
        elif email:
            supabase.table("investors").update({"email": email}).eq("id", inv["id"]).execute()
            print(f"OK -> {email}")
            ok += 1
        else:
            print("not found")
            failed += 1
        time.sleep(1.0)

    print(f"\nDone! Found={ok} Not found={failed}")
    try:
        total = supabase.table("investors").select("id", count="exact").not_.is_("email", "null").execute()
        print(f"Total investors with email: {total.count}")
    except:
        pass

if __name__ == "__main__":
    if not HUNTER_KEY:
        print("ERROR: Add HUNTER_API_KEY to your .env file")
        print("Get it from: https://hunter.io -> API -> Your API key")
    else:
        run(limit=25)
