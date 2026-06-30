import os, json, urllib.request
from dotenv import load_dotenv
load_dotenv('frontend/.env')
SUPABASE_URL = os.environ.get('VITE_SUPABASE_URL') or 'https://rjdewjyhtbfkujhvkwig.supabase.co'
SUPABASE_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY')

all_investors = [
    # === AGRITECH / AGTECH / AGRICULTURE ===
    {"name": "Arama Kukutai", "bio": "Co-founder of Finistere Ventures. Leading agritech and food systems investor globally.", "industries": ["agritech", "agtech", "agriculture", "foodtech"], "type": "angel", "location": "New Zealand / San Diego"},
    {"name": "Sarah Nolet", "bio": "Founder of Tenacious Ventures. Australia's first agrifoodtech VC. Angel investor in precision agriculture.", "industries": ["agritech", "agtech", "agriculture", "foodtech"], "type": "angel", "location": "Sydney, Australia"},
    {"name": "Seana Day", "bio": "Partner at Congruent Ventures. Former SVB agtech lead. Deeply focused on agriculture and climate.", "industries": ["agritech", "agtech", "agriculture", "climate"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Rob Leclerc", "bio": "Founder of AgFunder. Runs the world's leading agri-foodtech investment platform.", "industries": ["agritech", "agtech", "agriculture", "foodtech"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Michael Dean", "bio": "Co-founder of AgFunder. Investing in agriculture and food tech from seed to growth.", "industries": ["agritech", "agtech", "agriculture", "sustainability"], "type": "angel", "location": "Singapore"},

    # === BEAUTY ===
    {"name": "Gwyneth Paltrow", "bio": "Founder of Goop. Active angel investor in beauty, wellness, and clean consumer brands.", "industries": ["beauty", "brands", "consumer"], "type": "angel", "location": "Los Angeles, CA"},
    {"name": "Jessica Alba", "bio": "Founder of The Honest Company. Angel investor in clean beauty and wellness.", "industries": ["beauty", "brands", "consumer"], "type": "angel", "location": "Los Angeles, CA"},
    {"name": "Huda Kattan", "bio": "Founder of Huda Beauty. Angel investor in beauty tech and DTC beauty brands.", "industries": ["beauty", "brands", "e-commerce"], "type": "angel", "location": "Dubai, UAE"},
    {"name": "Marcia Kilgore", "bio": "Serial beauty founder (Bliss, FitFlop, Beauty Pie). Angel investor in beauty disruption.", "industries": ["beauty", "consumer", "e-commerce"], "type": "angel", "location": "London, UK"},
    {"name": "Annie Jackson", "bio": "Co-founder of Credo Beauty. Angel investor in clean and sustainable beauty.", "industries": ["beauty", "sustainability", "consumer"], "type": "angel", "location": "San Francisco, CA"},

    # === COMPUTER-VISION ===
    {"name": "Fei-Fei Li", "bio": "Stanford HAI Co-Director. Creator of ImageNet. Angel investor in computer vision and AI.", "industries": ["computer-vision", "ai", "health"], "type": "angel", "location": "Stanford, CA"},
    {"name": "Andrej Karpathy", "bio": "Former Director of AI at Tesla. Founded Eureka Labs. Angel investor in computer vision and autonomous systems.", "industries": ["computer-vision", "ai", "autonomous"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/karpathy"},
    {"name": "Jitendra Malik", "bio": "UC Berkeley professor. Pioneer of computer vision. Angel investor in visual AI startups.", "industries": ["computer-vision", "ai", "robotics"], "type": "angel", "location": "Berkeley, CA"},
    {"name": "Ali Farhadi", "bio": "Former CEO of AI2. UW professor. Angel investor in computer vision and embodied AI.", "industries": ["computer-vision", "ai", "robotics"], "type": "angel", "location": "Seattle, WA"},

    # === CUSTOMER-SUCCESS ===
    {"name": "Nick Mehta", "bio": "CEO of Gainsight. The godfather of customer success. Angel investor in CS and retention tech.", "industries": ["customer-success", "saas", "enterprise"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/nrmehta"},
    {"name": "Lincoln Murphy", "bio": "Founder of Sixteen Ventures. Customer success strategist and angel investor.", "industries": ["customer-success", "saas", "b2b"], "type": "angel", "location": "Austin, TX"},
    {"name": "Dan Steinman", "bio": "CCO at Gainsight. Co-author of 'Customer Success'. Angel investor in post-sale tech.", "industries": ["customer-success", "saas", "enterprise"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Allison Pickens", "bio": "Former COO of Gainsight. Now runs her own fund. Major customer success and vertical SaaS investor.", "industries": ["customer-success", "vertical-saas", "saas"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/PickensAllison"},

    # === IDENTITY ===
    {"name": "Andre Durand", "bio": "Founder and CEO of Ping Identity. Pioneer of digital identity. Angel investor in identity and access management.", "industries": ["identity", "security", "enterprise"], "type": "angel", "location": "Denver, CO"},
    {"name": "Eve Maler", "bio": "CTO at ForgeRock. Pioneer of identity standards (SAML, OAuth). Angel investor in decentralized identity.", "industries": ["identity", "security", "web3"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Kim Cameron", "bio": "Former Chief Identity Architect at Microsoft. Author of 'The Laws of Identity'. Advisor and angel in identity.", "industries": ["identity", "security", "privacy"], "type": "angel", "location": "Seattle, WA"},
    {"name": "Todd McKinnon", "bio": "Co-founder and CEO of Okta. Angel investor in identity, zero trust, and workforce security.", "industries": ["identity", "security", "cloud"], "type": "angel", "location": "San Francisco, CA"},

    # === INSURTECH ===
    {"name": "Daniel Schreiber", "bio": "Co-founder and CEO of Lemonade. Pioneer of AI-driven insurance. Angel investor in insurtech.", "industries": ["insurtech", "insurance", "ai"], "type": "angel", "location": "New York, NY"},
    {"name": "Shai Wininger", "bio": "Co-founder of Lemonade and Fiverr. Angel investor in insurtech and marketplace platforms.", "industries": ["insurtech", "insurance", "marketplace"], "type": "angel", "location": "Tel Aviv, Israel"},
    {"name": "Adrian Jones", "bio": "Former Head of Insurance at Hudson Structured Capital. Angel investor in insurtech and reinsurance.", "industries": ["insurtech", "insurance", "fintech"], "type": "angel", "location": "New York, NY"},
    {"name": "Caribou Honig", "bio": "Co-founder of InsureTech Connect. Prolific insurtech angel investor and thought leader.", "industries": ["insurtech", "insurance", "data"], "type": "angel", "location": "New York, NY"},

    # === MUSIC ===
    {"name": "Will.i.am", "bio": "Musician, tech entrepreneur. Founder of i.am+. Angel investor in music tech and AI.", "industries": ["music", "entertainment", "ai"], "type": "angel", "location": "Los Angeles, CA"},
    {"name": "DJ Tiesto", "bio": "World-renowned DJ. Angel investor in music streaming, creator tools, and nightlife tech.", "industries": ["music", "entertainment", "consumer"], "type": "angel", "location": "Las Vegas, NV"},
    {"name": "Matt Pincus", "bio": "Founder of Songs Music Publishing. Angel investor in music rights and royalties tech.", "industries": ["music", "entertainment", "fintech"], "type": "angel", "location": "New York, NY"},
    {"name": "Haim Sadger", "bio": "Managing Partner at Viola Group. Angel investor in music tech and entertainment platforms.", "industries": ["music", "entertainment", "consumer"], "type": "angel", "location": "Tel Aviv, Israel"},

    # === SPORTS ===
    {"name": "Andre Iguodala", "bio": "NBA champion. One of the most active athlete-investors in Silicon Valley. Focus on sports tech.", "industries": ["sports", "consumer", "health"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/andre"},
    {"name": "Serena Williams", "bio": "Tennis legend. Founder of Serena Ventures. Active angel investor in sports, health, and consumer brands.", "industries": ["sports", "health", "consumer"], "type": "angel", "location": "Miami, FL"},
    {"name": "Kevin Durant", "bio": "NBA star. Co-founder of Thirty Five Ventures. Prolific investor in sports, media, and tech.", "industries": ["sports", "media", "consumer"], "type": "angel", "location": "New York, NY"},
    {"name": "Robert Kraft", "bio": "Owner of New England Patriots. Co-founder of Kraft Group Ventures. Investor in sports tech.", "industries": ["sports", "media", "entertainment"], "type": "angel", "location": "Boston, MA"},
    {"name": "Mark Cuban", "bio": "Owner of Dallas Mavericks. Shark Tank star. Prolific angel investor across sports, health, and consumer tech.", "industries": ["sports", "consumer", "health"], "type": "angel", "location": "Dallas, TX"},

    # === SALES-TECH ===
    {"name": "Max Altschuler", "bio": "Founder of Sales Hacker (acquired by Outreach). VP Marketing at Outreach. Angel investor in sales tech.", "industries": ["sales-tech", "saas", "b2b"], "type": "angel", "location": "New York, NY"},
    {"name": "Kyle Porter", "bio": "Co-founder and CEO of SalesLoft. Angel investor in revenue tech and sales engagement.", "industries": ["sales-tech", "saas", "enterprise"], "type": "angel", "location": "Atlanta, GA"},
    {"name": "Manny Medina", "bio": "Co-founder and CEO of Outreach. Angel investor in AI-powered sales tools.", "industries": ["sales-tech", "ai", "enterprise"], "type": "angel", "location": "Seattle, WA"},
    {"name": "Jill Rowley", "bio": "Chief Evangelist at various sales tech companies. Angel investor in social selling and sales enablement.", "industries": ["sales-tech", "saas", "marketing-tech"], "type": "angel", "location": "San Francisco, CA"},

    # === SMART-CITY ===
    {"name": "Adie Tomer", "bio": "Senior Fellow at Brookings Institution. Leading smart city researcher and angel investor.", "industries": ["smart-city", "govtech", "infrastructure"], "type": "angel", "location": "Washington, DC"},
    {"name": "Gabe Klein", "bio": "Former Commissioner of Transportation for Chicago and Washington DC. Angel investor in smart mobility.", "industries": ["smart-city", "mobility", "govtech"], "type": "angel", "location": "Washington, DC"},
    {"name": "Ryan Chin", "bio": "Co-founder of Optimus Ride. MIT Media Lab alum. Angel investor in smart city mobility.", "industries": ["smart-city", "autonomous", "mobility"], "type": "angel", "location": "Boston, MA"},
    {"name": "Eyal Amir", "bio": "Co-founder of Foresight AI. Former UIUC professor. Angel investor in smart city AI.", "industries": ["smart-city", "ai", "data"], "type": "angel", "location": "San Francisco, CA"},

    # === NO-CODE ===
    {"name": "Vlad Magdalin", "bio": "Founder and CEO of Webflow. Pioneer of the no-code movement. Angel investor in no-code/low-code tools.", "industries": ["no-code", "developer-tools", "design"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Ben Tossell", "bio": "Founder of Makerpad (acquired by Zapier). Leading no-code educator and angel investor.", "industries": ["no-code", "creator-economy", "education"], "type": "angel", "location": "London, UK", "twitter_url": "https://twitter.com/bentossell"},
    {"name": "Emmanuel Straschnov", "bio": "Co-founder of Bubble. Building the most powerful no-code platform. Angel investor in no-code ecosystem.", "industries": ["no-code", "developer-tools", "saas"], "type": "angel", "location": "New York, NY"},
    {"name": "Tara Reed", "bio": "Founder of Apps Without Code. Leading no-code advocate and angel investor in no-code startups.", "industries": ["no-code", "education", "consumer"], "type": "angel", "location": "San Francisco, CA"},

    # === TRAVEL ===
    {"name": "Glenn Fogel", "bio": "CEO of Booking Holdings. Angel investor in travel tech and hospitality platforms.", "industries": ["travel", "hospitality", "consumer"], "type": "angel", "location": "Norwalk, CT"},
    {"name": "Gillian Tans", "bio": "Former CEO of Booking.com. Chairwoman. Angel investor in travel and hospitality tech.", "industries": ["travel", "hospitality", "marketplace"], "type": "angel", "location": "Amsterdam, Netherlands"},
    {"name": "Sam Shank", "bio": "Founder and CEO of HotelTonight (acquired by Airbnb). Angel investor in last-minute travel and hospitality.", "industries": ["travel", "hospitality", "mobile"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Paul English", "bio": "Co-founder of Kayak and Lola.com. Serial travel tech entrepreneur and active angel.", "industries": ["travel", "consumer", "ai"], "type": "angel", "location": "Boston, MA"},

    # === ANALYTICS ===
    {"name": "Hjalmar Gislason", "bio": "Founder of GRID and DataMarket (acquired by Qlik). Angel investor in data analytics and BI.", "industries": ["analytics", "data", "saas"], "type": "angel", "location": "Reykjavik, Iceland"},
    {"name": "Avinash Kaushik", "bio": "Digital Marketing Evangelist at Google. Author and angel investor in analytics and marketing tech.", "industries": ["analytics", "marketing-tech", "data"], "type": "angel", "location": "Los Angeles, CA"},
    {"name": "Neil Patel", "bio": "Co-founder of Crazy Egg, KISSmetrics, and NP Digital. Angel investor in analytics and marketing SaaS.", "industries": ["analytics", "marketing-tech", "saas"], "type": "angel", "location": "Las Vegas, NV", "twitter_url": "https://twitter.com/neilpatel"},
    {"name": "Suhail Doshi", "bio": "Founder of Mixpanel. Angel investor in product analytics and developer tools.", "industries": ["analytics", "developer-tools", "saas"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/Suhail"},

    # === SUSTAINABILITY ===
    {"name": "Yvon Chouinard", "bio": "Founder of Patagonia. Gave away his company to fight climate change. Investor in sustainable businesses.", "industries": ["sustainability", "climate", "brands"], "type": "angel", "location": "Ventura, CA"},
    {"name": "Paul Hawken", "bio": "Author of 'Drawdown' and 'Natural Capitalism'. Environmentalist and angel investor in sustainability.", "industries": ["sustainability", "climate", "impact"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Lisa Jackson", "bio": "VP of Environment, Policy and Social Initiatives at Apple. Former EPA Administrator. Investing in sustainability.", "industries": ["sustainability", "climate", "govtech"], "type": "angel", "location": "Washington, DC"},
    {"name": "Andrew Beebe", "bio": "Managing Director at Obvious Ventures. Investing in 'world-positive' sustainability and climate startups.", "industries": ["sustainability", "climate", "energy"], "type": "angel", "location": "San Francisco, CA"},

    # === PRODUCTIVITY ===
    {"name": "Rahul Vohra", "bio": "Founder and CEO of Superhuman. Angel investor in productivity, email, and workflow tools.", "industries": ["productivity", "saas", "consumer"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/rahulvohra"},
    {"name": "Ivan Zhao", "bio": "Co-founder and CEO of Notion. Angel investor in productivity and knowledge management.", "industries": ["productivity", "saas", "design"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Amir Salihefendic", "bio": "Founder and CEO of Todoist / Doist. Angel investor in remote work and async productivity.", "industries": ["productivity", "future-of-work", "saas"], "type": "angel", "location": "Remote (Chile)"},
    {"name": "Steph Smith", "bio": "Host at a16z podcast. Former Trends analyst at The Hustle. Angel investor in productivity tools.", "industries": ["productivity", "saas", "creator-economy"], "type": "angel", "location": "Remote"},

    # === INSURANCE ===
    {"name": "Florian Graillot", "bio": "Founder of AXA Venture Partners' InsurTech fund. Active angel investor in insurance innovation.", "industries": ["insurance", "insurtech", "fintech"], "type": "angel", "location": "Paris, France"},
    {"name": "Nigel Walsh", "bio": "Managing Director at Deloitte. Leading insurtech thought leader and angel investor.", "industries": ["insurance", "insurtech", "enterprise"], "type": "angel", "location": "London, UK"},
    {"name": "Sanjay Beri", "bio": "Former VP at Aon. Founder of Netskope. Angel investor in cyber insurance and InsurTech.", "industries": ["insurance", "security", "enterprise"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Matteo Carbone", "bio": "Founder of the IoT Insurance Observatory. Leading global InsurTech advisor and investor.", "industries": ["insurance", "iot", "data"], "type": "angel", "location": "Milan / Boston"},
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
    print(f"[*] Добавлено {s} контактов (красный список batch 2).")

if __name__ == "__main__": save(all_investors)
