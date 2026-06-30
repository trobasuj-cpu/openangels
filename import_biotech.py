import os
import json
import urllib.request
from dotenv import load_dotenv

load_dotenv('frontend/.env')
SUPABASE_URL = os.environ.get('VITE_SUPABASE_URL') or 'https://rjdewjyhtbfkujhvkwig.supabase.co'
SUPABASE_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY')

biotech_investors = [
    {
        "name": "Vijay Pande",
        "bio": "General Partner at a16z Bio + Health. Former Stanford professor. Investing at the intersection of biology and computer science.",
        "industries": ["biotech", "health", "ai"],
        "type": "angel",
        "location": "Menlo Park, CA",
        "twitter_url": "https://twitter.com/vijaypande",
        "check_min": 1000000,
        "check_max": 20000000
    },
    {
        "name": "Jorge Conde",
        "bio": "General Partner at a16z Bio + Health. Investing in therapeutics, diagnostics, and life sciences.",
        "industries": ["biotech", "health", "pharma"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/jorgeconde0"
    },
    {
        "name": "Vineeta Agarwala",
        "bio": "General Partner at a16z Bio + Health. Physician-scientist investing in biotech and healthtech.",
        "industries": ["biotech", "health", "genomics"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/vagarwala"
    },
    {
        "name": "Robert Nelsen",
        "bio": "Co-founder and Managing Director at ARCH Venture Partners. Legendary biotech investor backing transformational science.",
        "industries": ["biotech", "deeptech", "pharma"],
        "type": "angel",
        "location": "Seattle, WA",
        "twitter_url": "https://twitter.com/rtnarch"
    },
    {
        "name": "Laura Deming",
        "bio": "Founder of The Longevity Fund and Age1. Thiel Fellow. Pioneering investor in anti-aging and longevity biotech.",
        "industries": ["biotech", "longevity", "health"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/laurademing"
    },
    {
        "name": "Alex Telford",
        "bio": "Founder of Conviction Bio. Angel investor and writer focusing on therapeutics and biotechnology platforms.",
        "industries": ["biotech", "pharma"],
        "type": "angel",
        "location": "San Francisco, CA"
    },
    {
        "name": "Celine Halioua",
        "bio": "Founder of Loyal (anti-aging for dogs). Active angel investor in bold biotech and longevity startups.",
        "industries": ["biotech", "longevity"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/celinehalioua"
    },
    {
        "name": "Martin Varsavsky",
        "bio": "Serial entrepreneur (Prelude Fertility, Gameto). Angel investor in fertility, biotech, and reproductive health.",
        "industries": ["biotech", "health", "femtech"],
        "type": "angel",
        "location": "Madrid / New York",
        "twitter_url": "https://twitter.com/martinvars"
    },
    {
        "name": "Ursheet Parikh",
        "bio": "Partner at Mayfield. Investing in IT and deep health/biotech. Backed companies at the intersection of AI and biology.",
        "industries": ["biotech", "ai", "health"],
        "type": "angel",
        "location": "Menlo Park, CA"
    },
    {
        "name": "Nina Kjellson",
        "bio": "General Partner at Canaan Partners. Investing in biopharma and digital health startups.",
        "industries": ["biotech", "health", "pharma"],
        "type": "angel",
        "location": "Menlo Park, CA"
    },
    {
        "name": "Peter Thiel",
        "bio": "Co-founder of PayPal and Founders Fund. Active investor in life extension, longevity, and contrarian biotech.",
        "industries": ["biotech", "longevity", "deeptech"],
        "type": "angel",
        "location": "Los Angeles, CA"
    },
    {
        "name": "Alexis Borisy",
        "bio": "Prominent biotech entrepreneur and investor. Co-founder of EQRx, Foundation Medicine. Partner at Curie.Bio.",
        "industries": ["biotech", "pharma", "genomics"],
        "type": "angel",
        "location": "Boston, MA"
    },
    {
        "name": "Zach Weinberg",
        "bio": "Co-founder of Flatiron Health. Co-founder of Curie.Bio. Highly active angel investor in biotech and therapeutics.",
        "industries": ["biotech", "pharma", "health"],
        "type": "angel",
        "location": "New York, NY",
        "twitter_url": "https://twitter.com/zachweinberg"
    },
    {
        "name": "Nat Turner",
        "bio": "Co-founder of Flatiron Health. Co-founder of Operator Partners. Angel investor in biotech, healthcare, and software.",
        "industries": ["biotech", "health", "software"],
        "type": "angel",
        "location": "New York, NY",
        "twitter_url": "https://twitter.com/natturner"
    },
    {
        "name": "Naval Ravikant",
        "bio": "Co-founder of AngelList. Broad angel investor who actively funds synthetic biology, longevity, and frontier biotech.",
        "industries": ["biotech", "longevity", "deeptech"],
        "type": "angel",
        "location": "Miami, FL",
        "twitter_url": "https://twitter.com/naval"
    },
    {
        "name": "Daphne Koller",
        "bio": "Founder of insitro. Former Stanford professor. Key figure and angel investor in AI-driven drug discovery.",
        "industries": ["biotech", "ai", "pharma"],
        "type": "angel",
        "location": "South San Francisco, CA",
        "twitter_url": "https://twitter.com/DaphneKoller"
    },
    {
        "name": "Balaji Srinivasan",
        "bio": "Former CTO of Coinbase. Co-founder of Counsyl. Active angel investor in genomics, transhumanism, and biotech.",
        "industries": ["biotech", "genomics", "crypto"],
        "type": "angel",
        "location": "Singapore / US",
        "twitter_url": "https://twitter.com/balajis"
    },
    {
        "name": "Alice Zhang",
        "bio": "Co-founder & CEO of Verge Genomics. Angel investor backing AI-driven biotech founders.",
        "industries": ["biotech", "ai", "genomics"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/alice_a_zhang"
    },
    {
        "name": "Garry Tan",
        "bio": "President and CEO of Y Combinator. Long-time investor in synthetic biology, biotech, and deeptech.",
        "industries": ["biotech", "deeptech", "software"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/garrytan"
    },
    {
        "name": "Sam Altman",
        "bio": "CEO of OpenAI. Major investor in life extension (Retro Biosciences) and frontier biotech.",
        "industries": ["biotech", "longevity", "ai"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/sama"
    },
    {
        "name": "Bryan Johnson",
        "bio": "Founder of Blueprint, Kernel, Braintree. Investing heavily in longevity, synthetic biology, and human enhancement.",
        "industries": ["biotech", "longevity", "deeptech"],
        "type": "angel",
        "location": "Los Angeles, CA",
        "twitter_url": "https://twitter.com/bryan_johnson"
    }
]

def save_to_supabase(contacts):
    success = 0
    url = f"{SUPABASE_URL}/rest/v1/investors"
    
    for c in contacts:
        try:
            req = urllib.request.Request(
                url, 
                data=json.dumps(c).encode('utf-8'),
                headers={
                    'apikey': SUPABASE_KEY, 
                    'Authorization': f'Bearer {SUPABASE_KEY}',
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                method='POST'
            )
            with urllib.request.urlopen(req) as res:
                if res.status in [200, 201]:
                    success += 1
        except Exception as e:
            pass
            
    print(f"[*] Успешно добавлено {success} новых контактов по категории Biotech.")

if __name__ == "__main__":
    save_to_supabase(biotech_investors)
