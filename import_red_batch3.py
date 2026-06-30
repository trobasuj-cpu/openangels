import os, json, urllib.request
from dotenv import load_dotenv
load_dotenv('frontend/.env')
SUPABASE_URL = os.environ.get('VITE_SUPABASE_URL') or 'https://rjdewjyhtbfkujhvkwig.supabase.co'
SUPABASE_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY')

all_investors = [
    # === MESSAGING ===
    {"name": "Jan Koum", "bio": "Co-founder of WhatsApp. Angel investor in messaging, privacy, and consumer communication.", "industries": ["messaging", "privacy", "consumer"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Niklas Zennstrom", "bio": "Co-founder of Skype. Founder of Atomico. Pioneer investor in messaging and communication tech.", "industries": ["messaging", "communication", "consumer"], "type": "angel", "location": "London, UK"},
    {"name": "Stewart Butterfield", "bio": "Co-founder of Slack and Flickr. Angel investor in workplace messaging and collaboration.", "industries": ["messaging", "collaboration", "enterprise"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Janus Friis", "bio": "Co-founder of Skype. Angel investor in messaging, communication, and P2P tech.", "industries": ["messaging", "communication", "consumer"], "type": "angel", "location": "London, UK"},

    # === COMMUNICATION ===
    {"name": "Eric Yuan", "bio": "Founder and CEO of Zoom. Angel investor in video communication and remote collaboration.", "industries": ["communication", "collaboration", "enterprise"], "type": "angel", "location": "San Jose, CA"},
    {"name": "Jeff Lawson", "bio": "Co-founder and CEO of Twilio. Angel investor in communication APIs and developer tools.", "industries": ["communication", "api", "developer-tools"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/jeffiel"},
    {"name": "Tilio Mazza", "bio": "Former Vonage exec. Angel investor in CPaaS and business communication platforms.", "industries": ["communication", "api", "enterprise"], "type": "angel", "location": "New York, NY"},
    {"name": "Ajay Bhatt", "bio": "Intel engineer, inventor of USB. Angel investor in communication hardware and interfaces.", "industries": ["communication", "hardware", "infrastructure"], "type": "angel", "location": "Portland, OR"},

    # === NFT ===
    {"name": "Devin Finzer", "bio": "Co-founder and CEO of OpenSea. Angel investor in NFT infrastructure and digital collectibles.", "industries": ["nft", "web3", "marketplace"], "type": "angel", "location": "New York, NY"},
    {"name": "Roham Gharegozlou", "bio": "Founder and CEO of Dapper Labs (CryptoKitties, NBA Top Shot). Pioneer investor in NFTs.", "industries": ["nft", "web3", "gaming"], "type": "angel", "location": "Vancouver, Canada"},
    {"name": "Pranksy", "bio": "Pseudonymous NFT collector and prolific angel investor in NFT platforms and digital art.", "industries": ["nft", "web3", "creator-economy"], "type": "angel", "location": "UK"},
    {"name": "Gmoney", "bio": "Pseudonymous NFT collector. Founder of 9dcc. Angel investor in NFT fashion and culture.", "industries": ["nft", "web3", "brands"], "type": "angel", "location": "US"},

    # === REGTECH ===
    {"name": "Jo Ann Barefoot", "bio": "CEO of Alliance for Innovative Regulation. Former US Treasury advisor. Angel investor in regtech.", "industries": ["regtech", "fintech", "govtech"], "type": "angel", "location": "Washington, DC"},
    {"name": "David Ehrich", "bio": "Co-founder of the Global RegTech Summit. Angel investor in compliance and regulatory tech.", "industries": ["regtech", "fintech", "legal-tech"], "type": "angel", "location": "New York, NY"},
    {"name": "Huy Nguyen Trieu", "bio": "Founder of CFTE. Former Citi MD. Angel investor in regtech and financial education.", "industries": ["regtech", "fintech", "edtech"], "type": "angel", "location": "London, UK"},
    {"name": "Sanj Daya", "bio": "CEO of Bain & Company's FinTech practice. Angel investor in regtech and compliance automation.", "industries": ["regtech", "fintech", "enterprise"], "type": "angel", "location": "London, UK"},

    # === LEGALTECH / LEGAL-TECH ===
    {"name": "Andrew Arruda", "bio": "Co-founder of ROSS Intelligence. Pioneer of AI in legal. Angel investor in legal tech.", "industries": ["legaltech", "legal-tech", "ai"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Jake Heller", "bio": "Founder of Casetext (acquired by Thomson Reuters). Angel investor in AI-powered legal tools.", "industries": ["legaltech", "legal-tech", "ai"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Mark Cohen", "bio": "Founder of Legal Mosaic. Leading legal industry futurist and angel investor in legaltech.", "industries": ["legaltech", "legal-tech", "enterprise"], "type": "angel", "location": "Scottsdale, AZ"},
    {"name": "Cat Moon", "bio": "Director of Innovation at Vanderbilt Law. Angel investor and advisor in legal tech.", "industries": ["legaltech", "legal-tech", "edtech"], "type": "angel", "location": "Nashville, TN"},

    # === PROPTECH ===
    {"name": "Vik Chawla", "bio": "Co-founder of Fifth Wall. Leading proptech investor globally.", "industries": ["proptech", "real-estate", "climate"], "type": "angel", "location": "Los Angeles, CA"},
    {"name": "Zach Aarons", "bio": "Co-founder of MetaProp. Prolific early-stage proptech investor.", "industries": ["proptech", "real-estate", "saas"], "type": "angel", "location": "New York, NY"},
    {"name": "Constance Freedman", "bio": "Founder of Moderne Ventures. One of the top proptech focused investors.", "industries": ["proptech", "real-estate", "insurance"], "type": "angel", "location": "Chicago, IL"},
    {"name": "Chris Yip", "bio": "General Partner at RET Ventures. Leading investor in multifamily and commercial proptech.", "industries": ["proptech", "real-estate", "enterprise"], "type": "angel", "location": "San Francisco, CA"},

    # === GROCERY / LOCAL-COMMERCE / HOSPITALITY ===
    {"name": "Apoorva Mehta", "bio": "Founder of Instacart. Angel investor in grocery delivery and local commerce.", "industries": ["grocery", "local-commerce", "marketplace"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Max Mullen", "bio": "Co-founder of Instacart. Angel investor in grocery tech and last-mile logistics.", "industries": ["grocery", "local-commerce", "logistics"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Chieh Huang", "bio": "Co-founder and CEO of Boxed. Angel investor in grocery, warehouse, and local commerce.", "industries": ["grocery", "local-commerce", "e-commerce"], "type": "angel", "location": "New York, NY"},
    {"name": "Samer Hamadeh", "bio": "Co-founder of Zeel. Angel investor in hospitality, wellness, and on-demand services.", "industries": ["hospitality", "local-commerce", "consumer"], "type": "angel", "location": "New York, NY"},
    {"name": "Craig Smith", "bio": "Former President of Marriott International. Angel investor in hospitality tech.", "industries": ["hospitality", "travel", "enterprise"], "type": "angel", "location": "Bethesda, MD"},

    # === PHARMA / GENOMICS ===
    {"name": "Anne Wojcicki", "bio": "Co-founder and CEO of 23andMe. Angel investor in genomics, personalized medicine, and consumer health.", "industries": ["genomics", "pharma", "health"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "George Church", "bio": "Harvard geneticist. Co-founder of dozens of genomics companies. The most prolific biotech founder-investor.", "industries": ["genomics", "pharma", "biotech"], "type": "angel", "location": "Boston, MA"},
    {"name": "Eric Topol", "bio": "Founder of Scripps Research Translational Institute. Author and angel investor in precision medicine.", "industries": ["pharma", "health", "genomics"], "type": "angel", "location": "La Jolla, CA"},
    {"name": "Bob Nelsen (ARCH)", "bio": "Co-founder of ARCH Venture Partners. Backed Illumina, 10x Genomics. Legendary pharma/genomics VC.", "industries": ["pharma", "genomics", "biotech"], "type": "angel", "location": "Seattle, WA"},

    # === MACHINE-LEARNING / AUTONOMOUS / DEEPTECH ===
    {"name": "Andrew Ng", "bio": "Co-founder of Coursera. Former head of Google Brain and Baidu AI. Founder of AI Fund. Top ML investor.", "industries": ["machine-learning", "ai", "edtech"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/AndrewYNg"},
    {"name": "Yann LeCun", "bio": "Chief AI Scientist at Meta. Turing Award winner. Angel investor in deep learning and vision.", "industries": ["machine-learning", "ai", "computer-vision"], "type": "angel", "location": "New York, NY"},
    {"name": "Kyle Vogt", "bio": "Co-founder of Cruise and Twitch. Angel investor in autonomous vehicles and robotics.", "industries": ["autonomous", "robotics", "ai"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Chris Urmson", "bio": "Former CTO of Google's self-driving car project. Co-founder of Aurora. Angel investor in autonomous tech.", "industries": ["autonomous", "transportation", "ai"], "type": "angel", "location": "Pittsburgh, PA"},
    {"name": "Bryan Salesky", "bio": "Co-founder of Argo AI. Former Google self-driving car engineer. Angel investor in autonomous mobility.", "industries": ["autonomous", "transportation", "mobility"], "type": "angel", "location": "Pittsburgh, PA"},

    # === TRANSPORTATION / MOBILITY ===
    {"name": "Robin Chase", "bio": "Co-founder of Zipcar. Author of 'Peers Inc'. Angel investor in shared mobility and transportation.", "industries": ["transportation", "mobility", "sustainability"], "type": "angel", "location": "Cambridge, MA"},
    {"name": "John Zimmer", "bio": "Co-founder of Lyft. Angel investor in mobility, transportation, and autonomous vehicles.", "industries": ["transportation", "mobility", "autonomous"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Logan Green", "bio": "Co-founder of Lyft. Angel investor in EV charging, micromobility, and clean transportation.", "industries": ["transportation", "mobility", "ev"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Horace Dediu", "bio": "Founder of Micromobility Industries. Leading analyst and angel investor in micromobility.", "industries": ["mobility", "transportation", "sustainability"], "type": "angel", "location": "Helsinki, Finland"},

    # === VERTICAL-SAAS / EMERGING-MARKETS / SAFETY ===
    {"name": "Rory O'Driscoll", "bio": "Partner at Scale Venture Partners. Major investor in vertical SaaS businesses.", "industries": ["vertical-saas", "saas", "enterprise"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Jason Lemkin", "bio": "Founder of SaaStr. Former CEO of EchoSign. Prolific investor in vertical and horizontal SaaS.", "industries": ["vertical-saas", "saas", "b2b"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/jasonlk"},
    {"name": "Keet van Zyl", "bio": "Co-founder of Knife Capital. Leading African VC. Angel investor in emerging market tech.", "industries": ["emerging-markets", "fintech", "impact"], "type": "angel", "location": "Cape Town, South Africa"},
    {"name": "Victoria Barret", "bio": "GP at Village Global. Former Forbes editor. Angel investor in emerging market startups.", "industries": ["emerging-markets", "consumer", "edtech"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Richie Etwaru", "bio": "Former CIO at IMS Health. Angel investor in safety tech and compliance.", "industries": ["safety", "enterprise", "health"], "type": "angel", "location": "New Jersey"},

    # === MARKETING-TECH / AUTOMATION / COLLABORATION ===
    {"name": "Dharmesh Shah", "bio": "Co-founder and CTO of HubSpot. Angel investor in marketing tech and inbound marketing tools.", "industries": ["marketing-tech", "saas", "automation"], "type": "angel", "location": "Cambridge, MA", "twitter_url": "https://twitter.com/dharmesh"},
    {"name": "Rand Fishkin (SparkToro)", "bio": "Founder of SparkToro and Moz. Angel investor in audience research and marketing tech.", "industries": ["marketing-tech", "analytics", "saas"], "type": "angel", "location": "Seattle, WA"},
    {"name": "Wade Foster", "bio": "Co-founder and CEO of Zapier. Angel investor in automation and workflow tools.", "industries": ["automation", "saas", "no-code"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Tope Awotona", "bio": "Founder and CEO of Calendly. Angel investor in scheduling, automation, and productivity.", "industries": ["automation", "productivity", "saas"], "type": "angel", "location": "Atlanta, GA"},
    {"name": "Aaron Levie", "bio": "Founder and CEO of Box. Angel investor in collaboration, cloud storage, and enterprise SaaS.", "industries": ["collaboration", "cloud", "enterprise"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/levie"},
    {"name": "Mikkel Svane", "bio": "Founder of Zendesk. Angel investor in customer experience and collaboration tools.", "industries": ["collaboration", "customer-success", "saas"], "type": "angel", "location": "San Francisco, CA"},

    # === COMMUNITY / EDUCATION / FOOD ===
    {"name": "Evan Spiegel", "bio": "Co-founder and CEO of Snap. Angel investor in community, social, and communication apps.", "industries": ["community", "social", "consumer"], "type": "angel", "location": "Los Angeles, CA"},
    {"name": "David Spinks", "bio": "Founder of CMX and Bevy. The leading community-building expert. Angel investor in community platforms.", "industries": ["community", "saas", "social"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Sal Khan", "bio": "Founder of Khan Academy. The most impactful figure in online education. Angel investor in ed-access.", "industries": ["education", "edtech", "impact"], "type": "angel", "location": "Mountain View, CA"},
    {"name": "Daphne Koller (Coursera)", "bio": "Co-founder of Coursera. Stanford professor. Angel investor in online education and learning science.", "industries": ["education", "edtech", "ai"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "David Chang", "bio": "Founder of Momofuku restaurants. Host of 'Ugly Delicious'. Angel investor in food tech and restaurant innovation.", "industries": ["food", "hospitality", "consumer"], "type": "angel", "location": "New York, NY"},
    {"name": "Tom Colicchio", "bio": "Celebrity chef and restaurateur. Angel investor in sustainable food and food tech.", "industries": ["food", "sustainability", "consumer"], "type": "angel", "location": "New York, NY"},
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
    print(f"[*] Добавлено {s} контактов (красный список batch 3 — ФИНАЛЬНЫЙ).")

if __name__ == "__main__": save(all_investors)
