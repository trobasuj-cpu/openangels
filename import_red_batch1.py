import os, json, urllib.request
from dotenv import load_dotenv
load_dotenv('frontend/.env')
SUPABASE_URL = os.environ.get('VITE_SUPABASE_URL') or 'https://rjdewjyhtbfkujhvkwig.supabase.co'
SUPABASE_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY')

all_investors = [
    # === ADTECH ===
    {"name": "Jeff Green", "bio": "Founder and CEO of The Trade Desk. Angel investor in programmatic advertising and adtech.", "industries": ["adtech", "data", "enterprise"], "type": "angel", "location": "Ventura, CA"},
    {"name": "Jonah Goodhart", "bio": "Co-founder of Moat (acquired by Oracle). Angel investor in ad measurement and brand safety.", "industries": ["adtech", "data", "marketing-tech"], "type": "angel", "location": "New York, NY"},
    {"name": "Brian O'Kelley", "bio": "Founder of AppNexus (acquired by AT&T/Xandr). Prolific angel investor in adtech and data privacy.", "industries": ["adtech", "privacy", "data"], "type": "angel", "location": "New York, NY", "twitter_url": "https://twitter.com/oaboroshi"},
    {"name": "Ari Paparo", "bio": "Founder of Marketecture and Beeswax (acquired by Comcast). Prolific adtech angel and commentator.", "industries": ["adtech", "marketing-tech", "saas"], "type": "angel", "location": "New York, NY", "twitter_url": "https://twitter.com/aripaparo"},
    {"name": "Eric Franchi", "bio": "Co-founder of Undertone. Venture Partner at Math Capital. Active adtech and marketing tech investor.", "industries": ["adtech", "marketing-tech", "consumer"], "type": "angel", "location": "New York, NY"},

    # === AR-VR ===
    {"name": "Hugo Barra", "bio": "Former VP at Meta (Oculus), Xiaomi, and Google. Angel investor in AR/VR and immersive tech.", "industries": ["ar-vr", "mobile", "consumer"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Tony Parisi", "bio": "Co-creator of VRML and glTF. Unity veteran. Angel investor in spatial computing and AR/VR.", "industries": ["ar-vr", "gaming", "developer-tools"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Tim Sweeney", "bio": "Founder and CEO of Epic Games (Unreal Engine, Fortnite). Major investor in metaverse and AR/VR tech.", "industries": ["ar-vr", "gaming", "infrastructure"], "type": "angel", "location": "Raleigh, NC"},
    {"name": "Tipatat Chennavasin", "bio": "Co-founder of The Venture Reality Fund. One of the most dedicated AR/VR-only investors globally.", "industries": ["ar-vr", "gaming", "enterprise"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/tipatat"},
    {"name": "Marco DeMiroz", "bio": "Co-founder of The Venture Reality Fund. Veteran telecom exec turned AR/VR investor.", "industries": ["ar-vr", "entertainment", "enterprise"], "type": "angel", "location": "San Francisco, CA"},

    # === BANKING ===
    {"name": "Brett King", "bio": "Founder of Moven. Author of 'Breaking Banks'. Futurist and angel investor in neobanking and open banking.", "industries": ["banking", "fintech", "payments"], "type": "angel", "location": "New York, NY", "twitter_url": "https://twitter.com/BrettKing"},
    {"name": "Angela Strange", "bio": "General Partner at a16z. Thesis: every company will be a fintech company. Active in banking infrastructure.", "industries": ["banking", "fintech", "infrastructure"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Shamir Karkal", "bio": "Co-founder of Simple (acquired by BBVA) and Sila. Pioneer of neobanking. Angel investor in banking-as-a-service.", "industries": ["banking", "fintech", "api"], "type": "angel", "location": "Portland, OR"},
    {"name": "Alex Rampell", "bio": "General Partner at a16z. Co-founder of TrialPay. Deep investor in fintech, insurance, and banking.", "industries": ["banking", "fintech", "insurance"], "type": "angel", "location": "Menlo Park, CA"},
    {"name": "Yael Wissner-Levy", "bio": "VP at Lemonade. Former journalist. Angel investor in insurtech and neobanking.", "industries": ["banking", "insurtech", "fintech"], "type": "angel", "location": "New York, NY"},

    # === ENTERTAINMENT ===
    {"name": "Scooter Braun", "bio": "Founder of SB Projects. Manager of Justin Bieber, Ariana Grande. Angel investor in entertainment tech.", "industries": ["entertainment", "music", "media"], "type": "angel", "location": "Los Angeles, CA"},
    {"name": "Troy Carter", "bio": "Founder of Q&A. Former manager of Lady Gaga. Partner at a16z cultural leadership. Angel investor in entertainment.", "industries": ["entertainment", "music", "consumer"], "type": "angel", "location": "Los Angeles, CA", "twitter_url": "https://twitter.com/troycarter"},
    {"name": "Casey Neistat", "bio": "Legendary YouTuber. Co-founder of Beme (acquired by CNN). Angel investor in creator tools and entertainment.", "industries": ["entertainment", "creator-economy", "media"], "type": "angel", "location": "New York, NY", "twitter_url": "https://twitter.com/Casey"},
    {"name": "Michael Ovitz", "bio": "Co-founder of CAA. Former Disney President. Angel investor in entertainment and media tech.", "industries": ["entertainment", "media", "consumer"], "type": "angel", "location": "Los Angeles, CA"},
    {"name": "David Karp", "bio": "Founder of Tumblr (acquired by Yahoo). Angel investor in creative tools, entertainment, and consumer.", "industries": ["entertainment", "social", "consumer"], "type": "angel", "location": "New York, NY"},

    # === FEMTECH ===
    {"name": "Ida Tin", "bio": "Co-founder of Clue. Coined the term 'FemTech'. Angel investor in women's health and reproductive technology.", "industries": ["femtech", "health", "consumer"], "type": "angel", "location": "Copenhagen, Denmark"},
    {"name": "Deborah Anderson", "bio": "Founder of the FemTech Collective. Angel investor in women's health startups.", "industries": ["femtech", "health", "biotech"], "type": "angel", "location": "Los Angeles, CA"},
    {"name": "Halle Tecco", "bio": "Founder of Rock Health. Pioneer of digital health and femtech investing.", "industries": ["femtech", "health", "impact"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/halletecco"},
    {"name": "Sophia Yen", "bio": "Co-founder of Pandia Health. Stanford professor. Angel investor in reproductive health and telemedicine.", "industries": ["femtech", "health", "consumer"], "type": "angel", "location": "Sunnyvale, CA"},
    {"name": "Anne Boden", "bio": "Founder of Starling Bank. Angel investor and advocate for women in fintech and femtech.", "industries": ["femtech", "fintech", "banking"], "type": "angel", "location": "London, UK"},

    # === MANUFACTURING ===
    {"name": "Sridhar Iyengar", "bio": "Co-founder of Elemental Machines and Misfit Wearables. Angel investor in smart manufacturing.", "industries": ["manufacturing", "iot", "hardware"], "type": "angel", "location": "Boston, MA"},
    {"name": "John Hart", "bio": "MIT professor of Mechanical Engineering. Co-founder of Desktop Metal. Angel investor in additive manufacturing.", "industries": ["manufacturing", "hardware", "deeptech"], "type": "angel", "location": "Cambridge, MA"},
    {"name": "Ric Fulop", "bio": "Founder and CEO of Desktop Metal. Serial entrepreneur and angel investor in manufacturing tech.", "industries": ["manufacturing", "hardware", "3d-printing"], "type": "angel", "location": "Boston, MA"},
    {"name": "Scott Phoenix", "bio": "Co-founder of Vicarious (acquired by Alphabet). Angel investor in AI-powered manufacturing.", "industries": ["manufacturing", "ai", "robotics"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Sanjay Sarma", "bio": "Former VP of Open Learning at MIT. RFID pioneer. Angel investor in smart manufacturing and IoT.", "industries": ["manufacturing", "iot", "edtech"], "type": "angel", "location": "Cambridge, MA"},

    # === SUPPLY-CHAIN ===
    {"name": "Noel Perry", "bio": "Founder of Transport Futures. Leading economist and angel investor in supply chain analytics.", "industries": ["supply-chain", "logistics", "data"], "type": "angel", "location": "Cleveland, OH"},
    {"name": "Kris Kosmala", "bio": "Former GE/Lenovo supply chain exec. Angel investor in supply chain visibility platforms.", "industries": ["supply-chain", "enterprise", "saas"], "type": "angel", "location": "Singapore"},
    {"name": "Jeff Silver", "bio": "Co-founder of Coyote Logistics (acquired by UPS). Angel investor in freight tech and supply chain.", "industries": ["supply-chain", "logistics", "marketplace"], "type": "angel", "location": "Chicago, IL"},
    {"name": "Ravi Anupindi", "bio": "Michigan Ross professor of Operations. Angel investor in supply chain resilience tech.", "industries": ["supply-chain", "sustainability", "enterprise"], "type": "angel", "location": "Ann Arbor, MI"},
    {"name": "Suuchi Ramesh", "bio": "Founder of Suuchi Inc. Angel investor in supply chain tech for fashion and manufacturing.", "industries": ["supply-chain", "manufacturing", "brands"], "type": "angel", "location": "New Jersey"},

    # === SEMICONDUCTOR ===
    {"name": "Jim Keller", "bio": "Legendary chip architect (AMD, Tesla, Apple, Intel). Angel investor in semiconductor startups.", "industries": ["semiconductor", "hardware", "deeptech"], "type": "angel", "location": "San Jose, CA"},
    {"name": "Lip-Bu Tan", "bio": "Former CEO of Cadence Design Systems. One of the most connected semiconductor investors worldwide.", "industries": ["semiconductor", "hardware", "enterprise"], "type": "angel", "location": "San Jose, CA"},
    {"name": "Vinod Dham", "bio": "Father of the Pentium chip. Prolific angel investor in semiconductor and deep tech.", "industries": ["semiconductor", "hardware", "deeptech"], "type": "angel", "location": "San Jose, CA"},
    {"name": "Renee James", "bio": "Former President of Intel. Founder and CEO of Ampere Computing. Angel investor in cloud semiconductors.", "industries": ["semiconductor", "cloud", "enterprise"], "type": "angel", "location": "San Jose, CA"},
    {"name": "Pat Moorhead", "bio": "Founder of Moor Insights & Strategy. Former AMD SVP. Influential analyst and angel in semiconductors.", "industries": ["semiconductor", "ai", "hardware"], "type": "angel", "location": "Austin, TX", "twitter_url": "https://twitter.com/PatrickMoorhead"},

    # === IOT ===
    {"name": "Zach Supalla", "bio": "Founder and CEO of Particle. Leading IoT platform builder and angel investor in IoT infrastructure.", "industries": ["iot", "hardware", "developer-tools"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Rob Coneybeer", "bio": "Co-founder of Shasta Ventures. Early Nest investor. Active in IoT and connected devices.", "industries": ["iot", "consumer", "hardware"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Bret Swanson", "bio": "President of Entropy Economics. Analyst and angel investor in IoT, edge computing, and connectivity.", "industries": ["iot", "infrastructure", "data"], "type": "angel", "location": "Washington, DC"},
    {"name": "Sarah Al-Hussaini", "bio": "Co-founder of Ultimate.ai and IoT pioneer. Angel investor in connected devices and AI.", "industries": ["iot", "ai", "automation"], "type": "angel", "location": "Berlin, Germany"},
    {"name": "Shahin Farshchi", "bio": "Partner at Lux Capital. Deep focus on IoT, autonomous systems, and connected hardware.", "industries": ["iot", "autonomous", "hardware"], "type": "angel", "location": "San Francisco, CA"},

    # === QUANTUM ===
    {"name": "John Preskill", "bio": "Caltech quantum physicist who coined 'quantum supremacy'. Advisor and angel investor in quantum startups.", "industries": ["quantum", "deeptech", "hardware"], "type": "angel", "location": "Pasadena, CA"},
    {"name": "Christophe Jurczak", "bio": "Founder of Quantonation, the first VC fund dedicated to quantum technologies.", "industries": ["quantum", "deeptech", "semiconductor"], "type": "angel", "location": "Paris, France"},
    {"name": "Bob Sutor", "bio": "Former VP of Quantum at IBM. Advisor and angel investor in quantum computing and post-quantum cryptography.", "industries": ["quantum", "security", "enterprise"], "type": "angel", "location": "New York, NY"},
    {"name": "Andrew Fursman", "bio": "Co-founder of 1QBit. Angel investor in quantum software and applications.", "industries": ["quantum", "deeptech", "software"], "type": "angel", "location": "Vancouver, Canada"},
    {"name": "Will Zeng", "bio": "Former Head of Quantum at Goldman Sachs. Founder of Unitary Fund. Angel investor in open-source quantum.", "industries": ["quantum", "open-source", "deeptech"], "type": "angel", "location": "New York, NY"},

    # === EV ===
    {"name": "JB Straubel", "bio": "Co-founder of Tesla and Redwood Materials. Angel investor in EV battery recycling and electrification.", "industries": ["ev", "climate", "energy"], "type": "angel", "location": "Reno, NV"},
    {"name": "Tony Posawatz", "bio": "Former Chevy Volt Vehicle Line Director at GM. Angel investor in EV and mobility.", "industries": ["ev", "mobility", "hardware"], "type": "angel", "location": "Los Angeles, CA"},
    {"name": "Rainer Zietlow", "bio": "EV adventurer and record-holder. Angel investor in electric vehicle infrastructure.", "industries": ["ev", "mobility", "infrastructure"], "type": "angel", "location": "Germany"},
    {"name": "Stefan Moeller", "bio": "Co-founder of Sono Motors. Angel investor in solar-integrated EV tech.", "industries": ["ev", "energy", "climate"], "type": "angel", "location": "Munich, Germany"},
    {"name": "Sarah Chen", "bio": "Former Tesla and Rivian engineer. Angel investor in EV charging infrastructure and battery tech.", "industries": ["ev", "energy", "infrastructure"], "type": "angel", "location": "San Francisco, CA"},

    # === GOVTECH ===
    {"name": "Ron Bouganim", "bio": "Founder of The GovTech Fund. The first and most prominent VC dedicated to government technology.", "industries": ["govtech", "enterprise", "saas"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Jennifer Pahlka", "bio": "Founder of Code for America. Former US Deputy CTO. Angel investor in civic tech and govtech.", "industries": ["govtech", "impact", "saas"], "type": "angel", "location": "Oakland, CA", "twitter_url": "https://twitter.com/pahlkadot"},
    {"name": "Jen Anastasoff", "bio": "Former Director at US Digital Service. Board member at USDS. Angel investor in govtech and civic innovation.", "industries": ["govtech", "impact", "enterprise"], "type": "angel", "location": "Washington, DC"},
    {"name": "Steph Hannon", "bio": "Former CTO of Hillary Clinton's campaign. VP Engineering at Cloudflare. Angel investor in govtech.", "industries": ["govtech", "security", "enterprise"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Gil Elbaz", "bio": "Founder of Factual (acquired by Foursquare). Co-founder of Applied Semantics (acquired by Google). Investing in data for public good.", "industries": ["govtech", "data", "ai"], "type": "angel", "location": "Los Angeles, CA"},

    # === LONGEVITY ===
    {"name": "Christian Angermayer", "bio": "Founder of Apeiron Investment Group. Major investor in longevity, psychedelics, and life extension.", "industries": ["longevity", "biotech", "health"], "type": "angel", "location": "London / Malta"},
    {"name": "Sergey Young", "bio": "Founder of the $100M Longevity Vision Fund. Angel investor dedicated to extending healthy human lifespan.", "industries": ["longevity", "biotech", "health"], "type": "angel", "location": "London, UK"},
    {"name": "James Peyer", "bio": "Co-founder and CEO of Cambrian Biopharma. Angel investor in aging biology and longevity therapeutics.", "industries": ["longevity", "biotech", "pharma"], "type": "angel", "location": "New York, NY"},
    {"name": "Aubrey de Grey", "bio": "Co-founder of SENS Research Foundation. Leading advocate and investor in anti-aging research.", "industries": ["longevity", "biotech", "deeptech"], "type": "angel", "location": "Mountain View, CA"},
    {"name": "Reason (Fight Aging!)", "bio": "Founder of Repair Biotechnologies and Fight Aging! blog. Angel investor in rejuvenation biotech.", "industries": ["longevity", "biotech", "health"], "type": "angel", "location": "San Francisco, CA"},

    # === PRIVACY ===
    {"name": "Max Schrems", "bio": "Founder of noyb (European Center for Digital Rights). Privacy advocate and advisor to privacy-first startups.", "industries": ["privacy", "legal-tech", "security"], "type": "angel", "location": "Vienna, Austria"},
    {"name": "Brian Acton", "bio": "Co-founder of WhatsApp. Founder of Signal Foundation. Angel investor in privacy-preserving technologies.", "industries": ["privacy", "messaging", "consumer"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Jon Callas", "bio": "Former CTO of PGP and co-founder of Silent Circle. Angel investor in encryption and privacy tools.", "industries": ["privacy", "security", "messaging"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Maciej Ceglowski", "bio": "Founder of Pinboard. Privacy advocate and angel investor in privacy-first consumer tools.", "industries": ["privacy", "consumer", "security"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/Pinboard"},
    {"name": "Moxie Marlinspike", "bio": "Founder of Signal. Cryptographer and activist. Angel investor in privacy and secure communications.", "industries": ["privacy", "security", "messaging"], "type": "angel", "location": "San Francisco, CA"},
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
    print(f"[*] Добавлено {s} контактов (красный список batch 1).")

if __name__ == "__main__": save(all_investors)
