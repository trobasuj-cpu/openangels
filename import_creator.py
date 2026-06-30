import os
import json
import urllib.request
from dotenv import load_dotenv

load_dotenv('frontend/.env')
SUPABASE_URL = os.environ.get('VITE_SUPABASE_URL') or 'https://rjdewjyhtbfkujhvkwig.supabase.co'
SUPABASE_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY')

creator_investors = [
    {
        "name": "Li Jin",
        "bio": "Co-founder & General Partner at Variant. Creator of the 'Passion Economy' concept. The most prominent investor in the creator economy space.",
        "industries": ["creator-economy", "web3", "consumer"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/lijin18",
        "check_min": 100000,
        "check_max": 2000000
    },
    {
        "name": "Rex Woodbury",
        "bio": "Founder & Managing Partner at Daybreak. Writer of Digital Native. Deep focus on creator economy, consumer social, and digital culture.",
        "industries": ["creator-economy", "consumer", "social"],
        "type": "angel",
        "location": "New York, NY",
        "twitter_url": "https://twitter.com/rex_woodbury"
    },
    {
        "name": "Hugo Amsellem",
        "bio": "Angel investor in the Creator Economy. Former VP at Jellysmack. Writing deeply about the future of creators.",
        "industries": ["creator-economy", "media"],
        "type": "angel",
        "location": "Paris, France",
        "twitter_url": "https://twitter.com/HugoAmsellem"
    },
    {
        "name": "Megan Quinn",
        "bio": "Former General Partner at Spark Capital and Niantic executive. Active angel investor in consumer, creators, and marketplaces.",
        "industries": ["creator-economy", "consumer", "marketplace"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/msquinn"
    },
    {
        "name": "Sasha Kaletsky",
        "bio": "Co-founder of Creator Ventures. Backing consumer internet companies alongside the world's biggest creators.",
        "industries": ["creator-economy", "consumer", "social"],
        "type": "angel",
        "location": "London, UK",
        "twitter_url": "https://twitter.com/SashaKaletsky"
    },
    {
        "name": "Caspar Lee",
        "bio": "Co-founder of Creator Ventures. Massive YouTuber turned investor. Unmatched network in the creator space.",
        "industries": ["creator-economy", "media", "consumer"],
        "type": "angel",
        "location": "London / LA",
        "twitter_url": "https://twitter.com/Caspar_Lee"
    },
    {
        "name": "Josh Richards",
        "bio": "TikTok star and Co-founder of Animal Capital. Investing in Gen Z focused consumer and creator tools.",
        "industries": ["creator-economy", "consumer", "social"],
        "type": "angel",
        "location": "Los Angeles, CA",
        "twitter_url": "https://twitter.com/JoshRichards"
    },
    {
        "name": "Marshall Sandman",
        "bio": "Managing Partner at Animal Capital. Focusing on Gen Z consumer and creator economy startups.",
        "industries": ["creator-economy", "consumer", "media"],
        "type": "angel",
        "location": "Los Angeles, CA"
    },
    {
        "name": "Ezra Cooperstein",
        "bio": "President at Night Media (manages MrBeast). Active investor in companies building infrastructure for creators.",
        "industries": ["creator-economy", "infrastructure", "media"],
        "type": "angel",
        "location": "Dallas, TX",
        "twitter_url": "https://twitter.com/ezracoop"
    },
    {
        "name": "Reed Duchscher",
        "bio": "CEO at Night Media (MrBeast's manager). Angel investor heavily focused on the creator economy and consumer brands.",
        "industries": ["creator-economy", "brands", "consumer"],
        "type": "angel",
        "location": "Dallas, TX",
        "twitter_url": "https://twitter.com/reedduchscher"
    },
    {
        "name": "Blake Robbins",
        "bio": "Partner at Benchmark. Deep thinker on the creator economy, gaming, and consumer internet.",
        "industries": ["creator-economy", "gaming", "consumer"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/blakeir"
    },
    {
        "name": "Kirstine Stewart",
        "bio": "Active angel investor and former executive at Twitter and YouTube. Focusing on media, creators, and the future of work.",
        "industries": ["creator-economy", "media", "social"],
        "type": "angel",
        "location": "Toronto, Canada",
        "twitter_url": "https://twitter.com/kirstinestewart"
    },
    {
        "name": "Brianne Kimmel",
        "bio": "Founder of Worklife Ventures. Prominent early-stage investor focusing on creative tools, SaaS, and the creator economy.",
        "industries": ["creator-economy", "saas", "developer-tools"],
        "type": "angel",
        "location": "San Francisco / LA",
        "twitter_url": "https://twitter.com/briannekimmel"
    },
    {
        "name": "Lenny Rachitsky",
        "bio": "Host of Lenny's Podcast. Extremely influential creator and active angel investor in product-led growth and creator tools.",
        "industries": ["creator-economy", "saas", "b2b"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/lennysan"
    },
    {
        "name": "Packy McCormick",
        "bio": "Founder of Not Boring Capital. Huge newsletter creator turned highly active angel investor in web3 and creator tech.",
        "industries": ["creator-economy", "web3", "deeptech"],
        "type": "angel",
        "location": "New York, NY",
        "twitter_url": "https://twitter.com/packyM"
    },
    {
        "name": "Turner Novak",
        "bio": "Founder of Banana Capital. Content creator and investor backing early-stage consumer and creator economy startups.",
        "industries": ["creator-economy", "consumer", "fintech"],
        "type": "angel",
        "location": "Ann Arbor, MI",
        "twitter_url": "https://twitter.com/TurnerNovak"
    },
    {
        "name": "Harry Stebbings",
        "bio": "Founder of 20VC. One of the most successful creators-turned-fund-managers in the world.",
        "industries": ["creator-economy", "saas", "consumer"],
        "type": "angel",
        "location": "London, UK",
        "twitter_url": "https://twitter.com/HarryStebbings"
    },
    {
        "name": "Colin and Samir",
        "bio": "Top YouTubers covering the creator economy. Now actively angel investing in creator tools and platforms via their syndicate.",
        "industries": ["creator-economy", "media", "software"],
        "type": "angel",
        "location": "Los Angeles, CA",
        "twitter_url": "https://twitter.com/ColinandSamir"
    },
    {
        "name": "Kaya Thomas",
        "bio": "Angel investor, author, and developer. Investing in creator tools and consumer apps that empower individuals.",
        "industries": ["creator-economy", "consumer", "developer-tools"],
        "type": "angel",
        "location": "San Francisco, CA",
        "twitter_url": "https://twitter.com/kthomas901"
    },
    {
        "name": "Nitesh Banta",
        "bio": "Co-founder of B12. Active angel investor in the passion/creator economy and AI tools for creatives.",
        "industries": ["creator-economy", "ai", "software"],
        "type": "angel",
        "location": "New York, NY",
        "twitter_url": "https://twitter.com/niteshbanta"
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
            
    print(f"[*] Успешно добавлено {success} новых контактов по категории Creator Economy.")

if __name__ == "__main__":
    save_to_supabase(creator_investors)
