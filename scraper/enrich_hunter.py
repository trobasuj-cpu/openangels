# -*- coding: utf-8 -*-
"""
OpenAngels - Investor Enrichment via Hunter.io
Email finder by name + company domain. Works on free plan!
Free tier: 25 searches/month per account (create multiple accounts).

Setup:
1. Go to https://hunter.io/users/sign_up
2. API key: https://hunter.io/api-keys
3. Add to .env: HUNTER_API_KEY=your_key
"""
import os, time, sys
import requests
from dotenv import load_dotenv
from supabase import create_client

# Fix Windows encoding
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

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
    "Foundry": "foundrygroup.com",
    "NEA": "nea.com",
    "Lightspeed": "lsvp.com",
    "IVP": "ivp.com",
    "Matrix Partners": "matrixpartners.com",
    "Social Capital": "socialcapital.com",
    "Revolution": "revolution.com",
    "Founders Fund": "foundersfund.com",
    "Khosla": "khoslaventures.com",
    "General Atlantic": "generalatlantic.com",
    "Tiger Global": "tigerglobal.com",
    "Coatue": "coatue.com",
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
    "Twitter": "twitter.com",
    "Google": "google.com",
    "Microsoft": "microsoft.com",
    "Facebook": "meta.com", "Meta": "meta.com",
    "LinkedIn": "linkedin.com",
    "Dropbox": "dropbox.com",
    "Box": "box.com",
    "Okta": "okta.com",
    "Snowflake": "snowflake.com",
    "Coinbase": "coinbase.com",
    "Ripple": "ripple.com",
    "PayPal": "paypal.com",
    "Square": "squareup.com",
    "Brex": "brex.com",
    "Plaid": "plaid.com",
    "Nubank": "nubank.com.br",
    "Razorpay": "razorpay.com",
    "Revolut": "revolut.com",
    "Wise": "wise.com",
    "Klarna": "klarna.com",
    "Adyen": "adyen.com",
    "Grab": "grab.com",
    "Gojek": "gojek.com",
    "Tokopedia": "tokopedia.com",
    "Flipkart": "flipkart.com",
    "Freshworks": "freshworks.com",
    "Zoho": "zoho.com",
    "Ola": "olacabs.com",
    "Byju": "byjus.com",
    "Paytm": "paytm.com",
    "Zerodha": "zerodha.com",
}

def get_domain(bio):
    bio_lower = (bio or "").lower()
    for company, domain in DOMAIN_MAP.items():
        if company.lower() in bio_lower:
            return domain, company
    return None, None

def find_email(first, last, domain):
    """Hunter.io Email Finder API - works on free plan"""
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
            score = data.get("score", 0)
            if email and score >= 40:
                return email
        elif r.status_code == 429:
            print("Rate limited - waiting 30s")
            time.sleep(30)
        elif r.status_code == 403:
            print("QUOTA EXHAUSTED - time to switch accounts!")
            return "QUOTA"
        elif r.status_code == 401:
            print("Invalid API key!")
            return "INVALID"
    except Exception as e:
        print(f"Error: {e}")
    return None

def check_quota():
    """Check remaining Hunter.io credits"""
    r = requests.get(
        "https://api.hunter.io/v2/account",
        params={"api_key": HUNTER_KEY},
        timeout=10
    )
    if r.status_code == 200:
        data = r.json().get("data", {})
        requests_left = data.get("requests", {}).get("searches", {}).get("available", 0)
        requests_used = data.get("requests", {}).get("searches", {}).get("used", 0)
        print(f"Hunter.io quota: {requests_used} used, {requests_left} remaining")
        return requests_left
    return 0

def run(limit=25):
    print("\n>>> Hunter.io Email Enrichment\n")

    # Check quota first
    remaining = check_quota()
    if remaining == 0:
        print("No credits left - register new account at hunter.io")
        return

    actual_limit = min(limit, remaining)
    print(f"Will enrich {actual_limit} investors\n")

    # Get investors without email but with known company domain
    investors = supabase.table("investors")\
        .select("id,name,bio,email")\
        .eq("verified", True)\
        .is_("email", "null")\
        .limit(300)\
        .execute().data

    # Filter to those where we know the domain
    enrichable = []
    for inv in investors:
        domain, company = get_domain(inv.get("bio",""))
        if domain:
            enrichable.append({**inv, "_domain": domain, "_company": company})

    print(f"Investors with known company domains: {len(enrichable)}")
    print(f"Processing first {min(actual_limit, len(enrichable))}...\n")

    ok, failed = 0, 0
    for inv in enrichable[:actual_limit]:
        parts = inv["name"].split()
        first = parts[0]
        last = " ".join(parts[1:]) if len(parts) > 1 else ""

        name_safe = inv["name"].encode("ascii","replace").decode("ascii")
        print(f"  [{ok+failed+1}] {name_safe} @ {inv['_domain']} ... ", end="", flush=True)

        email = find_email(first, last, inv["_domain"])

        if email in ("QUOTA", "INVALID"):
            print("STOPPING - switch Hunter account!")
            break
        elif email:
            supabase.table("investors").update({"email": email}).eq("id", inv["id"]).execute()
            print(f"OK -> {email}")
            ok += 1
        else:
            print("not found")
            failed += 1
        time.sleep(1.2)

    print(f"\nDone! Found={ok} Not found={failed}")
    total = supabase.table("investors").select("id", count="exact").not_.is_("email", "null").execute()
    print(f"Total investors with email in DB: {total.count}")

if __name__ == "__main__":
    if not HUNTER_KEY:
        print("ERROR: Add HUNTER_API_KEY to .env")
        print("Get it at: https://hunter.io/api-keys")
    else:
        run(limit=25)
