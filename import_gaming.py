import os
import json
import urllib.request
from dotenv import load_dotenv

load_dotenv('frontend/.env')
SUPABASE_URL = os.environ.get('VITE_SUPABASE_URL') or 'https://rjdewjyhtbfkujhvkwig.supabase.co'
SUPABASE_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY')

gaming_investors = [
    {
        "name": "Amy Wu",
        "bio": "Head of Ventures and Gaming at FTX (pre-collapse). Now independent angel investor in gaming and web3 gaming.",
        "industries": ["gaming", "web3", "consumer"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/amytongwu"
    },
    {
        "name": "Josh Buckley",
        "bio": "CEO of Buckets and angel investor. Former youngest CEO of a publicly traded company. Prolific gaming and consumer investor.",
        "industries": ["gaming", "consumer", "mobile"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/joshbuckley"
    },
    {
        "name": "Jonathan Lai",
        "bio": "Partner at a16z Games. Investing in next-gen gaming studios, platforms, and infrastructure.",
        "industries": ["gaming", "consumer", "infrastructure"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/jonathanlai"
    },
    {
        "name": "Andrew Chen",
        "bio": "General Partner at a16z. Deep expertise in growth and consumer products. Active in gaming and social apps.",
        "industries": ["gaming", "consumer", "marketplace"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/andrewchen"
    },
    {
        "name": "Matthew Ball",
        "bio": "Former Head of Strategy at Amazon Studios. CEO of Epyllion. Author of 'The Metaverse'. Angel investor in gaming infrastructure.",
        "industries": ["gaming", "entertainment", "infrastructure"],
        "type": "angel",
        "location": "New York, NY",
        "twitter_url": "https://twitter.com/MatthewBall"
    },
    {
        "name": "Joost van Dreunen",
        "bio": "Founder of SuperData Research (acquired by Nielsen). NYU professor and angel investor in gaming startups.",
        "industries": ["gaming", "data", "entertainment"],
        "type": "angel",
        "location": "New York, NY",
        "twitter_url": "https://twitter.com/joostvandreunen"
    },
    {
        "name": "Pany Haritatos",
        "bio": "Partner at Lightspeed Venture Partners. Led investments in Epic Games. Focused on gaming, consumer, and entertainment.",
        "industries": ["gaming", "consumer", "entertainment"],
        "type": "angel",
        "location": "San Francisco, CA"
    },
    {
        "name": "Phil Harrison",
        "bio": "Former VP at Google (Stadia), Xbox, PlayStation. Active angel investor in game studios and gaming technology.",
        "industries": ["gaming", "cloud", "entertainment"],
        "type": "angel",
        "location": "London, UK"
    },
    {
        "name": "Mitch Lasky",
        "bio": "Partner at Benchmark. Former EA executive. One of the most respected gaming investors in Silicon Valley.",
        "industries": ["gaming", "mobile", "consumer"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/mitchlasky"
    },
    {
        "name": "Anil Dharni",
        "bio": "Co-founder of Skydance Interactive. Managing Director at BITKRAFT Ventures. Leading global gaming and esports VC.",
        "industries": ["gaming", "ar-vr", "entertainment"],
        "type": "angel",
        "location": "San Francisco, CA"
    },
    {
        "name": "Jens Hilgers",
        "bio": "Founder of BITKRAFT Ventures. Pioneer in esports (co-founded ESL). One of the top global gaming investors.",
        "industries": ["gaming", "sports", "entertainment"],
        "type": "angel",
        "location": "Berlin, Germany",
        "twitter_url": "https://twitter.com/jaborandi"
    },
    {
        "name": "Ethan Kurzweil",
        "bio": "Partner at Bessemer Venture Partners. Active investor in gaming infrastructure and consumer platforms.",
        "industries": ["gaming", "consumer", "saas"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/ethankurz"
    },
    {
        "name": "Mark Pincus",
        "bio": "Founder of Zynga. Prolific angel investor in gaming, social, and consumer internet startups.",
        "industries": ["gaming", "social", "consumer"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/markpincus"
    },
    {
        "name": "London Venture Partners",
        "bio": "David Lau-Kee and team — the only pure-play gaming VC in Europe. Backed Unity, Supercell, and NaturalMotion.",
        "industries": ["gaming", "mobile", "entertainment"],
        "type": "angel",
        "location": "London, UK"
    },
    {
        "name": "Alexis Ohanian",
        "bio": "Co-founder of Reddit and Seven Seven Six. Prominent angel investor in gaming, esports, and creator economy.",
        "industries": ["gaming", "creator-economy", "social"],
        "type": "angel",
        "location": "Los Angeles, CA",
        "twitter_url": "https://twitter.com/alexisohanian"
    },
    {
        "name": "Kristian Segerstrale",
        "bio": "CEO of Super Evil Megacorp. Angel investor in mobile gaming and game tech infrastructure.",
        "industries": ["gaming", "mobile", "ar-vr"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/KSeger"
    },
    {
        "name": "Niko Partners (Lisa Cosmas Hanson)",
        "bio": "Founder of Niko Partners, the leading research firm on games in Asia. Angel investor in gaming and emerging markets.",
        "industries": ["gaming", "emerging-markets", "data"],
        "type": "angel",
        "location": "San Jose, CA"
    },
    {
        "name": "Justin Kan",
        "bio": "Co-founder of Twitch. Serial entrepreneur (Atrium, Fractal). Active angel investor in gaming and livestreaming.",
        "industries": ["gaming", "creator-economy", "web3"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/justinkan"
    },
    {
        "name": "Ryan Wyatt",
        "bio": "Former Head of Gaming at YouTube / Google. CEO of Polygon Labs. Angel investor in gaming infrastructure and web3.",
        "industries": ["gaming", "web3", "infrastructure"],
        "type": "angel",
        "location": "Los Angeles, CA",
        "twitter_url": "https://twitter.com/Fwiz"
    },
    {
        "name": "Chris Lee",
        "bio": "Managing Partner at Griffin Gaming Partners. Former Kabam executive. Leading investor in gaming studios and platforms.",
        "industries": ["gaming", "mobile", "entertainment"],
        "type": "angel",
        "location": "Los Angeles, CA"
    }
]

def save_to_supabase(contacts):
    success = 0
    url = f"{SUPABASE_URL}/rest/v1/investors"
    for c in contacts:
        try:
            req = urllib.request.Request(url, data=json.dumps(c).encode('utf-8'), headers={
                'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}',
                'Content-Type': 'application/json', 'Prefer': 'return=minimal'
            }, method='POST')
            with urllib.request.urlopen(req) as res:
                if res.status in [200, 201]: success += 1
        except: pass
    print(f"[*] Успешно добавлено {success} новых контактов по категории Gaming.")

if __name__ == "__main__":
    save_to_supabase(gaming_investors)
