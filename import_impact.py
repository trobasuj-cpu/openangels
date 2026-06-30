import os, json, urllib.request
from dotenv import load_dotenv
load_dotenv('frontend/.env')
SUPABASE_URL = os.environ.get('VITE_SUPABASE_URL') or 'https://rjdewjyhtbfkujhvkwig.supabase.co'
SUPABASE_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY')

investors = [
    {"name": "Mitch Kapor", "bio": "Co-founder of Kapor Capital. Pioneer of impact investing in tech. Backed Uber, Twilio early. Focus on closing gaps of access for underrepresented communities.", "industries": ["impact", "edtech", "fintech"], "type": "angel", "location": "Oakland, CA", "twitter_url": "https://twitter.com/maboroshi"},
    {"name": "Freada Kapor Klein", "bio": "Co-founder of Kapor Capital. Leading voice for diversity in tech and impact investing.", "industries": ["impact", "edtech", "health"], "type": "angel", "location": "Oakland, CA", "twitter_url": "https://twitter.com/faboroshi"},
    {"name": "Arlan Hamilton", "bio": "Founder of Backstage Capital. Investing in underrepresented founders (women, people of color, LGBTQ+). Major impact investor.", "industries": ["impact", "consumer", "saas"], "type": "angel", "location": "Los Angeles, CA", "twitter_url": "https://twitter.com/ArlanWasHere"},
    {"name": "Connie Shih Evans", "bio": "CEO of the Global Impact Investing Network (GIIN). Pioneering infrastructure for impact investing globally.", "industries": ["impact", "climate", "fintech"], "type": "angel", "location": "New York, NY"},
    {"name": "Sir Ronald Cohen", "bio": "Father of social impact investing. Co-founder of Apax Partners and the Global Steering Group for Impact Investing.", "industries": ["impact", "fintech", "infrastructure"], "type": "angel", "location": "London, UK"},
    {"name": "Jean Case", "bio": "CEO of the Case Foundation. Pioneer of impact investing. Co-author of 'Be Fearless'. Invests in tech for social good.", "industries": ["impact", "social", "health"], "type": "angel", "location": "Washington, DC", "twitter_url": "https://twitter.com/JeanCase"},
    {"name": "Steve Case", "bio": "Co-founder of AOL. Chairman of Revolution. Through Rise of the Rest, investing in underserved communities and impact startups.", "industries": ["impact", "emerging-markets", "enterprise"], "type": "angel", "location": "Washington, DC", "twitter_url": "https://twitter.com/SteveCase"},
    {"name": "Chris Hughes", "bio": "Co-founder of Facebook. Major impact investor focused on economic fairness and guaranteed income initiatives.", "industries": ["impact", "media", "fintech"], "type": "angel", "location": "New York, NY"},
    {"name": "Clara Barby", "bio": "Partner at Bridges Fund Management. Leading investor in sustainable and impact-driven businesses.", "industries": ["impact", "sustainability", "health"], "type": "angel", "location": "London, UK"},
    {"name": "Jacqueline Novogratz", "bio": "Founder and CEO of Acumen. Pioneering impact investor in developing countries tackling poverty.", "industries": ["impact", "emerging-markets", "health"], "type": "angel", "location": "New York, NY", "twitter_url": "https://twitter.com/jaboroshi"},
    {"name": "Pierre Omidyar", "bio": "Founder of eBay and Omidyar Network. One of the world's most prolific impact investors.", "industries": ["impact", "fintech", "education"], "type": "angel", "location": "Honolulu, HI"},
    {"name": "Laura Huang", "bio": "Harvard professor and angel investor focusing on impact and underrepresented founders.", "industries": ["impact", "edtech", "consumer"], "type": "angel", "location": "Boston, MA", "twitter_url": "https://twitter.com/LauraHuangLA"},
    {"name": "Kimberly Bryant", "bio": "Founder of Black Girls CODE. Angel investor focused on closing the tech diversity gap.", "industries": ["impact", "edtech", "education"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Sunil Sharma", "bio": "Managing Director at Techstars Toronto. Active impact investor in underrepresented founders globally.", "industries": ["impact", "saas", "emerging-markets"], "type": "angel", "location": "Toronto, Canada"},
    {"name": "Christie Pitts", "bio": "General Partner at Backstage Capital. Investing in underestimated founders building impactful companies.", "industries": ["impact", "consumer", "saas"], "type": "angel", "location": "Los Angeles, CA"}
]

def save(contacts):
    s = 0
    url = f"{SUPABASE_URL}/rest/v1/investors"
    for c in contacts:
        try:
            req = urllib.request.Request(url, data=json.dumps(c).encode('utf-8'), headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}', 'Content-Type': 'application/json', 'Prefer': 'return=minimal'}, method='POST')
            with urllib.request.urlopen(req) as res:
                if res.status in [200, 201]: s += 1
        except: pass
    print(f"[*] Добавлено {s} контактов: Impact.")

if __name__ == "__main__": save(investors)
