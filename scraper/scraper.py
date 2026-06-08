"""
OpenAngels — Public Web Scraper
Scrapes investor data from public sources that don't require login:
  - OpenVC.vc (public investor directory)
  - Visible.vc public pages
  - Public GitHub investor datasets
"""

import os
import time
import json
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client, Client
from tqdm import tqdm

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
}


# ─── SOURCE 1: GitHub Public Investor Datasets ────────────────────────────────
GITHUB_CSV_SOURCES = [
    # Public CSV datasets with investor info (no auth required)
    "https://raw.githubusercontent.com/hkfggg/angel-investors/main/investors.csv",
]


def fetch_github_dataset(url: str) -> list[dict]:
    """Download a CSV of investors from GitHub."""
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        if r.status_code != 200:
            print(f"  ⚠️  GitHub CSV not available: {url}")
            return []

        lines = r.text.strip().split("\n")
        if len(lines) < 2:
            return []

        headers = [h.strip().strip('"') for h in lines[0].split(",")]
        investors = []
        for line in lines[1:]:
            vals = [v.strip().strip('"') for v in line.split(",")]
            if len(vals) == len(headers):
                investors.append(dict(zip(headers, vals)))

        print(f"  ✅ Got {len(investors)} rows from GitHub CSV")
        return investors
    except Exception as e:
        print(f"  ⚠️  GitHub CSV error: {e}")
        return []


# ─── SOURCE 2: OpenVC public investor list ────────────────────────────────────
def scrape_openvc(max_pages: int = 5) -> list[dict]:
    """
    Scrape public investor profiles from OpenVC.vc
    They have a public directory with no login required.
    """
    investors = []
    base = "https://openvc.app/investors"

    for page in range(1, max_pages + 1):
        try:
            url = f"{base}?page={page}"
            r = requests.get(url, headers=HEADERS, timeout=15)
            if r.status_code != 200:
                break

            soup = BeautifulSoup(r.text, "html.parser")
            cards = soup.select("[class*='investor-card'], [class*='InvestorCard'], .card")

            if not cards:
                # Try JSON-LD or embedded JSON
                scripts = soup.find_all("script", type="application/json")
                for s in scripts:
                    try:
                        data = json.loads(s.string)
                        if isinstance(data, list):
                            for item in data:
                                if "name" in item:
                                    investors.append(parse_openvc_item(item))
                    except Exception:
                        pass
                break

            for card in cards:
                name_el  = card.select_one("h2, h3, [class*='name']")
                bio_el   = card.select_one("p, [class*='bio'], [class*='description']")
                loc_el   = card.select_one("[class*='location'], [class*='city']")

                if not name_el:
                    continue

                investors.append({
                    "name":      name_el.get_text(strip=True),
                    "bio":       bio_el.get_text(strip=True) if bio_el else None,
                    "location":  loc_el.get_text(strip=True) if loc_el else None,
                    "type":      "angel",
                    "stages":    ["seed"],
                    "industries": [],
                    "verified":  False,
                })

            time.sleep(1.5)  # be polite
        except Exception as e:
            print(f"  ⚠️  OpenVC page {page} error: {e}")
            break

    print(f"  ✅ Scraped {len(investors)} investors from OpenVC")
    return investors


def parse_openvc_item(item: dict) -> dict:
    return {
        "name":       item.get("name", ""),
        "bio":        item.get("bio") or item.get("description"),
        "location":   item.get("location") or item.get("city"),
        "website":    item.get("website") or item.get("url"),
        "type":       "angel" if "angel" in str(item).lower() else "vc",
        "stages":     item.get("stages", ["seed"]),
        "industries": item.get("industries", []),
        "verified":   False,
    }


# ─── SOURCE 3: Curated extra investors (hand-picked additions) ────────────────
EXTRA_INVESTORS = [
    {"name": "Hunter Walk", "bio": "Partner at Homebrew VC. Early Google and YouTube exec. Invests in future of work and consumer.", "location": "San Francisco, CA", "country": "USA", "twitter_url": "https://twitter.com/hunterwalk", "website": "https://homebrew.co", "type": "vc", "check_min": 500000, "check_max": 3000000, "stages": ["seed", "series-a"], "industries": ["saas", "consumer", "future-of-work", "marketplace"], "portfolio": ["Chime", "Sunrun", "Loftium"], "verified": True},
    {"name": "Satya Patel", "bio": "Partner at Homebrew VC. Former VP Product at Twitter. Invests in the future of work.", "location": "San Francisco, CA", "country": "USA", "twitter_url": "https://twitter.com/satyap", "type": "vc", "check_min": 500000, "check_max": 3000000, "stages": ["seed", "series-a"], "industries": ["saas", "future-of-work", "consumer"], "portfolio": [], "verified": True},
    {"name": "Mark Suster", "bio": "Managing Partner at Upfront Ventures. 2x entrepreneur. Writes influential VC blog 'Both Sides of the Table'.", "location": "Los Angeles, CA", "country": "USA", "twitter_url": "https://twitter.com/msuster", "website": "https://upfront.com", "type": "vc", "check_min": 1000000, "check_max": 10000000, "stages": ["seed", "series-a", "series-b"], "industries": ["saas", "consumer", "media", "marketplace", "ai"], "portfolio": ["Ring", "GoodRx", "Maker Studios"], "verified": True},
    {"name": "Brad Feld", "bio": "Co-founder of Techstars and Foundry Group. Author of 'Startup Communities'. Active angel in Boulder ecosystem.", "location": "Boulder, CO", "country": "USA", "twitter_url": "https://twitter.com/bfeld", "website": "https://foundrygroup.com", "type": "vc", "check_min": 500000, "check_max": 10000000, "stages": ["seed", "series-a"], "industries": ["saas", "consumer", "developer-tools", "ai"], "portfolio": ["Fitbit", "Zynga", "MakerBot", "Sendgrid"], "verified": True},
    {"name": "Fred Wilson", "bio": "Co-founder of Union Square Ventures. Backed Twitter, Tumblr, Kickstarter, Coinbase, MongoDB.", "location": "New York, NY", "country": "USA", "twitter_url": "https://twitter.com/fredwilson", "website": "https://usv.com", "type": "vc", "check_min": 1000000, "check_max": 15000000, "stages": ["seed", "series-a", "series-b"], "industries": ["saas", "crypto", "marketplace", "fintech", "consumer"], "portfolio": ["Twitter", "Tumblr", "Kickstarter", "Coinbase", "MongoDB"], "verified": True},
    {"name": "Chris Sacca", "bio": "Founder of Lowercase Capital. Early investor in Twitter, Uber, Instagram, Stripe, Kickstarter.", "location": "Truckee, CA", "country": "USA", "twitter_url": "https://twitter.com/sacca", "type": "angel", "check_min": 100000, "check_max": 2000000, "stages": ["pre-seed", "seed"], "industries": ["consumer", "marketplace", "saas", "fintech"], "portfolio": ["Twitter", "Uber", "Instagram", "Stripe", "Kickstarter"], "verified": True},
    {"name": "Joshua Kushner", "bio": "Founder of Thrive Capital. Early investor in Instagram, Spotify, Oscar Health, Warby Parker.", "location": "New York, NY", "country": "USA", "type": "vc", "check_min": 2000000, "check_max": 30000000, "stages": ["series-a", "series-b", "growth"], "industries": ["health", "consumer", "fintech", "marketplace"], "portfolio": ["Instagram", "Spotify", "Oscar Health", "Warby Parker"], "verified": True},
    {"name": "Erik Torenberg", "bio": "Co-founder of Village Global and On Deck. Builds communities for founders and angel investors.", "location": "San Francisco, CA", "country": "USA", "twitter_url": "https://twitter.com/eriktorenberg", "type": "angel", "check_min": 25000, "check_max": 250000, "stages": ["pre-seed", "seed"], "industries": ["saas", "consumer", "media", "crypto", "future-of-work"], "portfolio": [], "verified": True},
    {"name": "Semil Shah", "bio": "Founder of Haystack Fund. Prolific angel investor. Early checks in DoorDash, Instacart, Hashicorp.", "location": "Menlo Park, CA", "country": "USA", "twitter_url": "https://twitter.com/semil", "website": "https://haystack.fund", "type": "angel", "check_min": 25000, "check_max": 500000, "stages": ["pre-seed", "seed"], "industries": ["saas", "marketplace", "consumer", "ai", "crypto"], "portfolio": ["DoorDash", "Instacart", "Hashicorp", "Figma"], "verified": True},
    {"name": "Anu Hariharan", "bio": "Partner at Y Combinator Continuity. Former BCG. Invests in growth-stage YC companies.", "location": "San Francisco, CA", "country": "USA", "twitter_url": "https://twitter.com/anuhariharan", "type": "vc", "check_min": 1000000, "check_max": 20000000, "stages": ["series-a", "series-b"], "industries": ["saas", "fintech", "consumer", "marketplace"], "portfolio": [], "verified": True},
    {"name": "Nivi", "bio": "Co-founder of AngelList with Naval Ravikant. Prolific angel investor in tech startups.", "location": "San Francisco, CA", "country": "USA", "twitter_url": "https://twitter.com/nivi", "type": "angel", "check_min": 25000, "check_max": 500000, "stages": ["pre-seed", "seed"], "industries": ["saas", "marketplace", "crypto"], "portfolio": ["AngelList"], "verified": True},
    {"name": "Gokul Rajaram", "bio": "'Ads Czar' at Meta. Former GM of Square. Angel in e-commerce, SaaS, and fintech.", "location": "San Francisco, CA", "country": "USA", "twitter_url": "https://twitter.com/gokulr", "type": "angel", "check_min": 25000, "check_max": 500000, "stages": ["pre-seed", "seed", "series-a"], "industries": ["saas", "e-commerce", "fintech", "ai"], "portfolio": [], "verified": True},
    {"name": "Aydin Senkut", "bio": "Founder of Felicis Ventures. Ex-Google. Backed Shopify, Credit Karma, Fitbit, Canva.", "location": "San Francisco, CA", "country": "USA", "twitter_url": "https://twitter.com/aydinsenkut", "website": "https://felicis.com", "type": "vc", "check_min": 500000, "check_max": 10000000, "stages": ["seed", "series-a"], "industries": ["saas", "consumer", "fintech", "ai", "marketplace"], "portfolio": ["Shopify", "Credit Karma", "Fitbit", "Canva", "Adyen"], "verified": True},
    {"name": "Mamoon Hamid", "bio": "Partner at Kleiner Perkins. Led investments in Slack, Box, Figma, and Intercom.", "location": "Menlo Park, CA", "country": "USA", "twitter_url": "https://twitter.com/mamoon", "type": "vc", "check_min": 2000000, "check_max": 30000000, "stages": ["series-a", "series-b"], "industries": ["saas", "developer-tools", "enterprise"], "portfolio": ["Slack", "Box", "Figma", "Intercom", "Carta"], "verified": True},
    {"name": "Lachy Groom", "bio": "Former Stripe employee #10. Angel investor in fintech and infrastructure startups.", "location": "San Francisco, CA", "country": "USA", "twitter_url": "https://twitter.com/lachygroom", "type": "angel", "check_min": 100000, "check_max": 2000000, "stages": ["pre-seed", "seed"], "industries": ["fintech", "saas", "developer-tools", "infrastructure"], "portfolio": [], "verified": True},
    {"name": "Immad Akhund", "bio": "CEO and co-founder of Mercury Bank. Active angel in fintech, SaaS, and B2B tools.", "location": "San Francisco, CA", "country": "USA", "twitter_url": "https://twitter.com/immad", "type": "angel", "check_min": 25000, "check_max": 250000, "stages": ["pre-seed", "seed"], "industries": ["fintech", "saas", "developer-tools"], "portfolio": ["Mercury"], "verified": True},
    {"name": "Jack Altman", "bio": "Co-founder and CEO of Lattice. Angel investor in HR tech, SaaS, and future-of-work companies.", "location": "San Francisco, CA", "country": "USA", "twitter_url": "https://twitter.com/jaltma", "type": "angel", "check_min": 25000, "check_max": 250000, "stages": ["pre-seed", "seed"], "industries": ["saas", "future-of-work", "hr-tech", "ai"], "portfolio": ["Lattice"], "verified": True},
    {"name": "Amjad Masad", "bio": "Co-founder and CEO of Replit. Angel investor in developer tools and AI-first companies.", "location": "San Francisco, CA", "country": "USA", "twitter_url": "https://twitter.com/amasad", "type": "angel", "check_min": 25000, "check_max": 250000, "stages": ["pre-seed", "seed"], "industries": ["developer-tools", "ai", "education"], "portfolio": ["Replit"], "verified": True},
    {"name": "Tom Blomfield", "bio": "Co-founder of Monzo and GoCardless. YC Group Partner. Angel in fintech and consumer.", "location": "San Francisco, CA", "country": "USA", "twitter_url": "https://twitter.com/t_blom", "type": "angel", "check_min": 50000, "check_max": 500000, "stages": ["pre-seed", "seed"], "industries": ["fintech", "consumer", "saas"], "portfolio": ["Monzo", "GoCardless"], "verified": True},
    {"name": "Des Traynor", "bio": "Co-founder of Intercom. Angel investor in SaaS, developer tools, and AI products.", "location": "San Francisco, CA", "country": "USA", "twitter_url": "https://twitter.com/destraynor", "type": "angel", "check_min": 25000, "check_max": 500000, "stages": ["pre-seed", "seed"], "industries": ["saas", "developer-tools", "ai", "consumer"], "portfolio": ["Intercom"], "verified": True},
    {"name": "Emmet Connolly", "bio": "VP Design at Intercom. Angel investor in design-forward SaaS and consumer products.", "location": "San Francisco, CA", "country": "USA", "type": "angel", "check_min": 10000, "check_max": 100000, "stages": ["pre-seed"], "industries": ["saas", "consumer", "design"], "portfolio": [], "verified": False},
    {"name": "Ryan Hoover", "bio": "Founder of Product Hunt (acquired by AngelList). Angel investor in consumer and social products.", "location": "San Francisco, CA", "country": "USA", "twitter_url": "https://twitter.com/rrhoover", "type": "angel", "check_min": 10000, "check_max": 100000, "stages": ["pre-seed", "seed"], "industries": ["consumer", "saas", "marketplace", "creator-economy"], "portfolio": ["Product Hunt"], "verified": True},
    {"name": "Mikael Cho", "bio": "Co-founder of Crew and Unsplash. Angel investor in creative tools and marketplaces.", "location": "Montreal", "country": "Canada", "twitter_url": "https://twitter.com/mikaelcho", "type": "angel", "check_min": 10000, "check_max": 100000, "stages": ["pre-seed", "seed"], "industries": ["creator-economy", "marketplace", "saas", "design"], "portfolio": ["Unsplash"], "verified": True},
    {"name": "Cristina Cordova", "bio": "Partner at Benchmark. Former head of Platform and Partnerships at Stripe. Angel in payments and SaaS.", "location": "San Francisco, CA", "country": "USA", "twitter_url": "https://twitter.com/cjc", "type": "vc", "check_min": 1000000, "check_max": 20000000, "stages": ["series-a", "series-b"], "industries": ["fintech", "saas", "marketplace"], "portfolio": [], "verified": True},
    {"name": "Kevin Hale", "bio": "YC Partner. Co-founder of Wufoo (acquired by SurveyMonkey). Expert in design and product.", "location": "San Francisco, CA", "country": "USA", "twitter_url": "https://twitter.com/ilikevests", "type": "angel", "check_min": 25000, "check_max": 250000, "stages": ["pre-seed", "seed"], "industries": ["saas", "developer-tools", "consumer"], "portfolio": ["Wufoo"], "verified": True},
    {"name": "Gustaf Alströmer", "bio": "YC Partner. Former Growth PM at Airbnb. Expert in growth and consumer products.", "location": "San Francisco, CA", "country": "USA", "twitter_url": "https://twitter.com/gustaf", "type": "angel", "check_min": 25000, "check_max": 250000, "stages": ["pre-seed", "seed"], "industries": ["consumer", "saas", "marketplace", "ai"], "portfolio": [], "verified": True},
    # European / Global extras
    {"name": "Pawel Chudzinski", "bio": "Co-founder and Managing Partner at Point Nine Capital. Invests in B2B SaaS and marketplaces globally.", "location": "Berlin", "country": "Germany", "twitter_url": "https://twitter.com/pawelchu", "website": "https://pointninecap.com", "type": "vc", "check_min": 500000, "check_max": 5000000, "stages": ["seed", "series-a"], "industries": ["saas", "marketplace", "fintech", "ai"], "portfolio": ["Zendesk", "Typeform", "Revolut", "Loom"], "verified": True},
    {"name": "Christoph Janz", "bio": "Co-founder of Point Nine Capital. The 'SaaS napkin' guy. Deep expertise in B2B SaaS metrics.", "location": "Berlin", "country": "Germany", "twitter_url": "https://twitter.com/chrija", "website": "https://pointninecap.com", "type": "vc", "check_min": 500000, "check_max": 5000000, "stages": ["seed", "series-a"], "industries": ["saas", "fintech", "marketplace"], "portfolio": ["Zendesk", "Clio", "Contentful", "Typeform"], "verified": True},
    {"name": "Reshma Sohoni", "bio": "Co-founder of Seedcamp. Europe's leading early-stage fund. Backed Revolut, UiPath, Wise.", "location": "London", "country": "UK", "twitter_url": "https://twitter.com/reshmams", "website": "https://seedcamp.com", "type": "vc", "check_min": 200000, "check_max": 2000000, "stages": ["pre-seed", "seed"], "industries": ["saas", "fintech", "ai", "marketplace", "developer-tools"], "portfolio": ["Revolut", "UiPath", "Wise", "Zendesk"], "verified": True},
    {"name": "Carlos Espinal", "bio": "Managing Partner at Seedcamp. Former Doughty Hanson Tech. European early-stage investor.", "location": "London", "country": "UK", "twitter_url": "https://twitter.com/cee", "type": "vc", "check_min": 200000, "check_max": 2000000, "stages": ["pre-seed", "seed"], "industries": ["saas", "fintech", "marketplace", "ai"], "portfolio": ["Revolut", "UiPath", "Transferwise"], "verified": True},
    {"name": "Index Ventures", "bio": "Global VC firm with offices in SF and London. Backed Dropbox, Slack, Robinhood, Etsy, Figma.", "location": "London / San Francisco", "country": "UK", "website": "https://indexventures.com", "type": "vc", "check_min": 1000000, "check_max": 50000000, "stages": ["seed", "series-a", "series-b", "growth"], "industries": ["saas", "fintech", "consumer", "marketplace", "gaming"], "portfolio": ["Dropbox", "Slack", "Robinhood", "Etsy", "Figma", "Supercell"], "verified": True},
]


def import_extra_investors():
    """Import the hand-curated extra investors into Supabase."""
    print(f"\n📥 Importing {len(EXTRA_INVESTORS)} extra investors...")
    success = 0
    for inv in tqdm(EXTRA_INVESTORS):
        try:
            supabase.table("investors").upsert(inv, on_conflict="name").execute()
            success += 1
        except Exception as e:
            print(f"  ⚠️  {inv['name']}: {e}")
    print(f"  ✅ Imported {success} extra investors")


def run_all():
    print("=" * 50)
    print("  OpenAngels — Full Data Import")
    print("=" * 50)

    # 1. Extra curated investors
    import_extra_investors()

    # 2. Try public GitHub datasets
    print("\n🌐 Fetching GitHub public datasets...")
    for url in GITHUB_CSV_SOURCES:
        rows = fetch_github_dataset(url)
        # Map and import (best-effort)
        for row in rows:
            try:
                inv = {
                    "name":      row.get("name") or row.get("Name", ""),
                    "bio":       row.get("bio") or row.get("description"),
                    "location":  row.get("location") or row.get("city"),
                    "website":   row.get("website") or row.get("url"),
                    "type":      "angel",
                    "stages":    ["seed"],
                    "industries": [],
                    "verified":  False,
                }
                if inv["name"]:
                    supabase.table("investors").upsert(inv, on_conflict="name").execute()
            except Exception:
                pass

    # 3. Check total
    res = supabase.table("investors").select("id", count="exact").execute()
    print(f"\n🎉 Total investors in DB: {res.count}")
    print("=" * 50)


if __name__ == "__main__":
    run_all()
