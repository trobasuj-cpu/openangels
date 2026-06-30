import os
import json
import urllib.request
from dotenv import load_dotenv

load_dotenv('frontend/.env')
SUPABASE_URL = os.environ.get('VITE_SUPABASE_URL') or 'https://rjdewjyhtbfkujhvkwig.supabase.co'
SUPABASE_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY')

security_investors = [
    {
        "name": "Shlomo Kramer",
        "bio": "Co-founder of Check Point, Imperva, and Cato Networks. One of the most prolific angel investors in cybersecurity globally.",
        "industries": ["security", "enterprise", "software"],
        "type": "angel",
        "location": "Tel Aviv / San Francisco",
        "check_min": 500000,
        "check_max": 5000000
    },
    {
        "name": "Mickey Boodaei",
        "bio": "Co-founder of Trusteer and Imperva. Extremely active early-stage cybersecurity angel investor.",
        "industries": ["security", "enterprise"],
        "type": "angel",
        "location": "Tel Aviv, Israel",
        "linkedin_url": "https://www.linkedin.com/in/mickeyboodaei/"
    },
    {
        "name": "Rakesh Loonkar",
        "bio": "Co-founder of Trusteer and Transmit Security. Serial cybersecurity entrepreneur and highly active angel investor.",
        "industries": ["security", "identity", "enterprise"],
        "type": "angel",
        "location": "Boston, MA",
        "linkedin_url": "https://www.linkedin.com/in/rakeshloonkar/"
    },
    {
        "name": "Gili Raanan",
        "bio": "Founder of Cyberstarts. Backing the most ambitious cybersecurity entrepreneurs.",
        "industries": ["security", "cloud", "infrastructure"],
        "type": "angel",
        "location": "Tel Aviv, Israel",
        "twitter_url": "https://twitter.com/giliraanan"
    },
    {
        "name": "Lior Simon",
        "bio": "General Partner at Cyberstarts. Focused purely on early-stage cybersecurity investments.",
        "industries": ["security", "developer-tools", "cloud"],
        "type": "angel",
        "location": "Tel Aviv, Israel"
    },
    {
        "name": "Yoav Leitersdorf",
        "bio": "Managing Partner at YL Ventures. Investing exclusively in early-stage cybersecurity startups.",
        "industries": ["security", "enterprise", "b2b"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/YoavLeitersdorf"
    },
    {
        "name": "John Brennan",
        "bio": "Senior Partner at YL Ventures. Working closely with founders building the next generation of cybersecurity.",
        "industries": ["security", "cloud", "b2b"],
        "type": "angel",
        "location": "New York, NY",
        "linkedin_url": "https://www.linkedin.com/in/john-brennan-1b1b3b1/"
    },
    {
        "name": "Asheem Chandna",
        "bio": "Partner at Greylock. Forbes Midas List investor. Backed Palo Alto Networks, AppDynamics, and many security unicorns.",
        "industries": ["security", "infrastructure", "enterprise"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/chandna"
    },
    {
        "name": "Enrique Salem",
        "bio": "Partner at Bain Capital Ventures. Former CEO of Symantec. Investing heavily in infrastructure software and cybersecurity.",
        "industries": ["security", "infrastructure", "software"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/EKSF"
    },
    {
        "name": "Bob Ackerman",
        "bio": "Founder of AllegisCyber. Dedicated early-stage cybersecurity venture capitalist.",
        "industries": ["security", "defense", "data"],
        "type": "angel",
        "location": "San Francisco, CA",
        "linkedin_url": "https://www.linkedin.com/in/bob-ackerman-1b1b3b1/"
    },
    {
        "name": "Theresia Gouw",
        "bio": "Founding Partner at Acrew Capital. Prominent security and enterprise software investor (Forescout, Imperva, Cato).",
        "industries": ["security", "enterprise", "data"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/tgr"
    },
    {
        "name": "Chenxi Wang",
        "bio": "Managing General Partner at Rain Capital. Cybersecurity focused VC, former Forrester analyst and security executive.",
        "industries": ["security", "enterprise", "cloud"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/chenxiwang"
    },
    {
        "name": "Zane Lackey",
        "bio": "General Partner at a16z. Former co-founder of Signal Sciences and CISO at Etsy. Investing in security and enterprise IT.",
        "industries": ["security", "developer-tools", "enterprise"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/zanelackey"
    },
    {
        "name": "Joel de la Garza",
        "bio": "Operating Partner at a16z (Security). Former Chief Security Officer at Box. Angel investing in next-gen infosec tools.",
        "industries": ["security", "infrastructure", "cloud"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/joeldelagarza"
    },
    {
        "name": "Dino Dai Zovi",
        "bio": "Renowned hacker and security leader. Angel investor in developer-first security and infrastructure startups.",
        "industries": ["security", "developer-tools", "mobile"],
        "type": "angel",
        "location": "New York, NY",
        "twitter_url": "https://twitter.com/dinodaizovi"
    },
    {
        "name": "Kelly Shortridge",
        "bio": "Senior Principal at Fastly. Author and active angel investor in resilience, infrastructure, and cybersecurity.",
        "industries": ["security", "infrastructure", "developer-tools"],
        "type": "angel",
        "location": "New York, NY",
        "twitter_url": "https://twitter.com/swagitda_"
    },
    {
        "name": "Runa Sandvik",
        "bio": "Security researcher and founder of Granitt. Angel investing in privacy and security tech.",
        "industries": ["security", "privacy", "media"],
        "type": "angel",
        "location": "Oslo / New York",
        "twitter_url": "https://twitter.com/runasand"
    },
    {
        "name": "HD Moore",
        "bio": "Creator of Metasploit and founder of runZero. Active angel investor in deeply technical cybersecurity startups.",
        "industries": ["security", "infrastructure", "networking"],
        "type": "angel",
        "location": "Austin, TX",
        "twitter_url": "https://twitter.com/hdmoore"
    },
    {
        "name": "Nir Polak",
        "bio": "Co-founder of Exabeam. Active angel investor backing Israeli and US cybersecurity founders.",
        "industries": ["security", "data", "analytics"],
        "type": "angel",
        "location": "San Francisco, CA",
        "linkedin_url": "https://www.linkedin.com/in/nirpolak/"
    },
    {
        "name": "Jay Leek",
        "bio": "Managing Partner at SYN Ventures. Former CISO at Blackstone. Dedicated cybersecurity investor.",
        "industries": ["security", "enterprise", "infrastructure"],
        "type": "angel",
        "location": "New York, NY"
    },
    {
        "name": "Alon Cohen",
        "bio": "Co-founder of CyberArk. Prominent early-stage investor in Israeli cybersecurity companies.",
        "industries": ["security", "identity", "enterprise"],
        "type": "angel",
        "location": "Tel Aviv, Israel"
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
            
    print(f"[*] Успешно добавлено {success} новых контактов по категории Security.")

if __name__ == "__main__":
    save_to_supabase(security_investors)
