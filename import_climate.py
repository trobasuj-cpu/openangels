import os
import json
import urllib.request
from dotenv import load_dotenv

load_dotenv('frontend/.env')
SUPABASE_URL = os.environ.get('VITE_SUPABASE_URL') or 'https://rjdewjyhtbfkujhvkwig.supabase.co'
SUPABASE_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY')

climate_investors = [
    {
        "name": "Chris Sacca",
        "bio": "Founder of Lowercarbon Capital. Backing founders buying us time to un-f**k the planet.",
        "industries": ["climate", "deeptech", "energy"],
        "type": "angel",
        "location": "Jackson, WY",
        "twitter_url": "https://twitter.com/sacca",
        "check_min": 100000,
        "check_max": 5000000
    },
    {
        "name": "Bill Gates",
        "bio": "Founder of Breakthrough Energy Ventures. Investing in climate tech innovations that will lead the world to net-zero emissions.",
        "industries": ["climate", "energy", "hardware"],
        "type": "angel",
        "location": "Seattle, WA",
        "twitter_url": "https://twitter.com/BillGates",
        "check_min": 1000000,
        "check_max": 50000000
    },
    {
        "name": "Seth Bannon",
        "bio": "Founding Partner at Fifty Years. Backing founders solving the world's biggest problems (including climate & sustainability).",
        "industries": ["climate", "biotech", "foodtech"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/sethbannon"
    },
    {
        "name": "Jason Jacobs",
        "bio": "Creator of My Climate Journey (MCJ) Collective. Backing early-stage founders building climate solutions.",
        "industries": ["climate", "sustainability", "energy"],
        "type": "angel",
        "location": "Boston, MA",
        "twitter_url": "https://twitter.com/jjacobs22",
        "check_min": 25000,
        "check_max": 250000
    },
    {
        "name": "Sierra Peterson",
        "bio": "Partner at Voyager Ventures. Investing in early-stage climate technology companies decarbonizing the global economy.",
        "industries": ["climate", "mobility", "energy"],
        "type": "angel",
        "location": "San Francisco, CA",
        "linkedin_url": "https://www.linkedin.com/in/sierrapeterson/"
    },
    {
        "name": "Sarah Sclarsic",
        "bio": "Managing Partner at Voyager Ventures. Investing in climate tech and decarbonization.",
        "industries": ["climate", "deeptech", "mobility"],
        "type": "angel",
        "location": "New York, NY",
        "twitter_url": "https://twitter.com/sclarsic"
    },
    {
        "name": "Albert Wenger",
        "bio": "Managing Partner at Union Square Ventures. Author of World After Capital. Passionate about climate tech and mitigating the climate crisis.",
        "industries": ["climate", "web3", "software"],
        "type": "angel",
        "location": "New York, NY",
        "twitter_url": "https://twitter.com/albertwenger"
    },
    {
        "name": "Dan Fishman",
        "bio": "Co-founder at Congruent Ventures. Backing early-stage companies in the climate and sustainability sectors.",
        "industries": ["climate", "energy", "agriculture"],
        "type": "angel",
        "location": "San Francisco, CA"
    },
    {
        "name": "Abe Yokell",
        "bio": "Co-founder & Managing Partner at Congruent Ventures. Focusing on hardware and software climate tech startups.",
        "industries": ["climate", "hardware", "software"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/AbeYokell"
    },
    {
        "name": "Clea Kolster",
        "bio": "Partner at Lowercarbon Capital. Focused on carbon removal, energy transition, and deep decarbonization technologies.",
        "industries": ["climate", "deeptech", "energy"],
        "type": "angel",
        "location": "San Francisco, CA",
        "linkedin_url": "https://www.linkedin.com/in/cleakolster/"
    },
    {
        "name": "Carmichael Roberts",
        "bio": "Co-lead of the investment committee at Breakthrough Energy Ventures. Investing in bold climate tech solutions.",
        "industries": ["climate", "deeptech", "hardware"],
        "type": "angel",
        "location": "Boston, MA"
    },
    {
        "name": "Nancy Pfund",
        "bio": "Founder and Managing Partner of DBL Partners. Pioneer in impact investing and climate tech.",
        "industries": ["climate", "impact", "energy"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/NancyPfundDBL"
    },
    {
        "name": "Ira Ehrenpreis",
        "bio": "Founder & Managing Partner at DBL Partners. Long-time investor in energy innovation and climate solutions.",
        "industries": ["climate", "ev", "energy"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/IraEhrenpreis"
    },
    {
        "name": "Tom Steyer",
        "bio": "Co-Executive Chair at Galvanize Climate Solutions. Dedicated to accelerating the clean energy transition.",
        "industries": ["climate", "energy", "infrastructure"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/TomSteyer"
    },
    {
        "name": "Matthew Nordan",
        "bio": "General Partner at Azolla Ventures. Investing in neglected climate technologies with massive impact potential.",
        "industries": ["climate", "deeptech", "manufacturing"],
        "type": "angel",
        "location": "Boston, MA",
        "twitter_url": "https://twitter.com/matthewnordan"
    },
    {
        "name": "Gabriel Kra",
        "bio": "Managing Director at Prelude Ventures. Backing startups addressing climate change and energy transition.",
        "industries": ["climate", "energy", "foodtech"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/gabrielkra"
    },
    {
        "name": "Tim Woodward",
        "bio": "Managing Director at Prelude Ventures. Investing in low-carbon economy solutions.",
        "industries": ["climate", "hardware", "deeptech"],
        "type": "angel",
        "location": "San Francisco, CA"
    },
    {
        "name": "Ryan Panchadsaram",
        "bio": "Advisor at Kleiner Perkins. Partner to John Doerr. Co-author of Speed & Scale: An Action Plan for Solving Our Climate Crisis Now.",
        "industries": ["climate", "software", "energy"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/rypan"
    },
    {
        "name": "Shuo Yang",
        "bio": "Partner at Fifty Years. Backing founders tackling climate, biology, and deep tech challenges.",
        "industries": ["climate", "biotech", "deeptech"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/shuo_y"
    },
    {
        "name": "Clay Dumas",
        "bio": "Founding Partner at Lowercarbon Capital. Backing founders who are buying us time to fix the planet.",
        "industries": ["climate", "energy", "mobility"],
        "type": "angel",
        "location": "Jackson, WY",
        "twitter_url": "https://twitter.com/claydumas"
    },
    {
        "name": "Michael Berkowitz",
        "bio": "Angel investor in climate resilience and adaptation technologies.",
        "industries": ["climate", "infrastructure", "smart-city"],
        "type": "angel",
        "location": "New York, NY"
    },
    {
        "name": "Christian Garcia",
        "bio": "Investor at Breakthrough Energy Ventures focused on scaling zero-emissions technologies.",
        "industries": ["climate", "energy", "manufacturing"],
        "type": "angel",
        "location": "Seattle, WA"
    },
    {
        "name": "Craig Lawrence",
        "bio": "Partner at Energy Transition Ventures. Early-stage investments in clean energy and climate tech.",
        "industries": ["climate", "energy", "cloud"],
        "type": "angel",
        "location": "Austin, TX",
        "twitter_url": "https://twitter.com/craig_lawrence"
    },
    {
        "name": "Sophie Purdom",
        "bio": "Co-founder of Climate Tech VC (CTVC) and Planeteer Capital. Investing in pre-seed climate founders.",
        "industries": ["climate", "software", "deeptech"],
        "type": "angel",
        "location": "New York, NY",
        "twitter_url": "https://twitter.com/SophiePurdom"
    },
    {
        "name": "Kim Zou",
        "bio": "Co-founder & CEO of Climate Tech VC (CTVC). Angel investor in early-stage climate startups.",
        "industries": ["climate", "data", "media"],
        "type": "angel",
        "location": "New York, NY",
        "twitter_url": "https://twitter.com/kimzou_"
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
            # ignore duplicates
            pass
            
    print(f"[*] Успешно добавлено {success} новых контактов по категории Climate.")

if __name__ == "__main__":
    save_to_supabase(climate_investors)
