import os
import json
import urllib.request
from dotenv import load_dotenv

load_dotenv('frontend/.env')
SUPABASE_URL = os.environ.get('VITE_SUPABASE_URL') or 'https://rjdewjyhtbfkujhvkwig.supabase.co'
SUPABASE_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY')

edtech_investors = [
    {
        "name": "Ian Chiu",
        "bio": "Managing Director at Owl Ventures, the world's largest venture capital fund focused on the education technology market.",
        "industries": ["edtech", "education", "software"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/ianwchiu",
        "check_min": 500000,
        "check_max": 10000000
    },
    {
        "name": "Tory Patterson",
        "bio": "Co-founder & Managing Director at Owl Ventures. Investing in top EdTech companies globally.",
        "industries": ["edtech", "education", "hr-tech"],
        "type": "angel",
        "location": "San Francisco, CA",
        "linkedin_url": "https://www.linkedin.com/in/torypatterson/"
    },
    {
        "name": "Jennifer Carolan",
        "bio": "Co-founder and Partner at Reach Capital. Passionate about empowering educators and backing transformative edtech startups.",
        "industries": ["edtech", "education", "impact"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/jencarolan"
    },
    {
        "name": "Wayee Chu",
        "bio": "General Partner at Reach Capital. Investing in early-stage education technology companies.",
        "industries": ["edtech", "education", "consumer"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/wayeechu"
    },
    {
        "name": "Esteban Sosnik",
        "bio": "General Partner at Reach Capital. Former edtech founder turned investor.",
        "industries": ["edtech", "gaming", "education"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/esosnik"
    },
    {
        "name": "Rob Hutter",
        "bio": "Managing Partner at Learn Capital. Backing entrepreneurs driving the transformation of learning.",
        "industries": ["edtech", "education", "enterprise"],
        "type": "angel",
        "location": "San Mateo, CA"
    },
    {
        "name": "Colin M.A. Taylor",
        "bio": "Partner at Learn Capital. Focusing on early-stage and growth-stage EdTech investments.",
        "industries": ["edtech", "education", "software"],
        "type": "angel",
        "location": "San Mateo, CA"
    },
    {
        "name": "Michael Moe",
        "bio": "Founder of GSV Ventures. Investor in top EdTech unicorns like Coursera, MasterClass, and Course Hero.",
        "industries": ["edtech", "education", "future-of-work"],
        "type": "angel",
        "location": "Woodside, CA",
        "twitter_url": "https://twitter.com/michaelmoe"
    },
    {
        "name": "Deborah Quazzo",
        "bio": "Managing Partner at GSV Ventures. Deeply committed to increasing access to high-quality education through tech.",
        "industries": ["edtech", "education", "impact"],
        "type": "angel",
        "location": "Chicago, IL",
        "twitter_url": "https://twitter.com/DeborahQuazzo"
    },
    {
        "name": "Matt Greenfield",
        "bio": "Managing Partner at Rethink Education. Investing in companies that positively impact education and learning.",
        "industries": ["edtech", "education", "impact"],
        "type": "angel",
        "location": "New York, NY",
        "twitter_url": "https://twitter.com/mattgreenfield"
    },
    {
        "name": "Rick Segal",
        "bio": "Partner at Rethink Education. Backing startups solving the most complex challenges in education.",
        "industries": ["edtech", "future-of-work", "education"],
        "type": "angel",
        "location": "New York, NY"
    },
    {
        "name": "Ashley Bittner",
        "bio": "Founding Partner at Firework Ventures. Investing in the future of work and learning.",
        "industries": ["edtech", "future-of-work", "hr-tech"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/ashleycbittner"
    },
    {
        "name": "Mercedes Bent",
        "bio": "Partner at Lightspeed Venture Partners. Investing in EdTech, Consumer, and Future of Work.",
        "industries": ["edtech", "consumer", "future-of-work"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/mercedesbent"
    },
    {
        "name": "Charles Hudson",
        "bio": "Managing Partner at Precursor Ventures. Early stage investor with a strong track record in EdTech and future of work.",
        "industries": ["edtech", "saas", "consumer"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/chudson",
        "check_min": 100000,
        "check_max": 500000
    },
    {
        "name": "Shauntel Garvey",
        "bio": "General Partner at Reach Capital. Focusing on early childhood education and K-12 edtech.",
        "industries": ["edtech", "education", "impact"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/ShauntelGarvey"
    },
    {
        "name": "Amit Patel",
        "bio": "Managing Director at Owl Ventures. Deeply involved in scaling education companies globally.",
        "industries": ["edtech", "education", "software"],
        "type": "angel",
        "location": "San Francisco, CA"
    },
    {
        "name": "John Danner",
        "bio": "Managing Partner at Dunce Capital. Angel investor specifically focused on early-stage edtech and future of work.",
        "industries": ["edtech", "education", "future-of-work"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/JohnDanner"
    },
    {
        "name": "Stacey Childress",
        "bio": "CEO of NewSchools Venture Fund. Fostering innovation in K-12 education.",
        "industries": ["edtech", "education", "impact"],
        "type": "angel",
        "location": "Oakland, CA",
        "twitter_url": "https://twitter.com/staceychildress"
    },
    {
        "name": "Jomayra Herrera",
        "bio": "Partner at Reach Capital. Investing in the intersection of education, work, and economic mobility.",
        "industries": ["edtech", "future-of-work", "consumer"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/jomayra_herrera"
    },
    {
        "name": "Eileen Carey",
        "bio": "Angel Investor and operator. Backing underrepresented founders in EdTech and enterprise software.",
        "industries": ["edtech", "enterprise", "software"],
        "type": "angel",
        "location": "New York, NY",
        "twitter_url": "https://twitter.com/eileenmcarey"
    },
    {
        "name": "Chian Gong",
        "bio": "Partner at Reach Capital. Dedicated to backing founders expanding educational access.",
        "industries": ["edtech", "education", "impact"],
        "type": "angel",
        "location": "San Francisco, CA"
    },
    {
        "name": "Binit Sharma",
        "bio": "Angel investor focusing on emerging markets EdTech and upskilling platforms.",
        "industries": ["edtech", "emerging-markets", "future-of-work"],
        "type": "angel",
        "location": "London, UK"
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
            
    print(f"[*] Успешно добавлено {success} новых контактов по категории EdTech.")

if __name__ == "__main__":
    save_to_supabase(edtech_investors)
