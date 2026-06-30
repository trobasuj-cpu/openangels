import os, json, urllib.request
from dotenv import load_dotenv
load_dotenv('frontend/.env')
SUPABASE_URL = os.environ.get('VITE_SUPABASE_URL') or 'https://rjdewjyhtbfkujhvkwig.supabase.co'
SUPABASE_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY')

all_investors = [
    # === FUTURE-OF-WORK ===
    {"name": "Jeff Wald", "bio": "Founder of Work Market (acquired by ADP). Author of 'The End of Jobs'. Angel investor in future of work startups.", "industries": ["future-of-work", "hr-tech", "saas"], "type": "angel", "location": "New York, NY", "twitter_url": "https://twitter.com/jeffwald"},
    {"name": "Roy Bahat", "bio": "Head of Bloomberg Beta. Leading investor in the future of work. Backed dozens of workforce tech startups.", "industries": ["future-of-work", "ai", "enterprise"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/roybahat"},
    {"name": "Trae Vassallo", "bio": "Co-founder & General Partner at Defy Partners. Deep focus on future of work, collaboration, and productivity.", "industries": ["future-of-work", "saas", "collaboration"], "type": "angel", "location": "Menlo Park, CA"},
    {"name": "Bruce Nolop", "bio": "Former CFO of Pitney Bowes. Angel investor in remote work tools and future-of-work platforms.", "industries": ["future-of-work", "enterprise", "saas"], "type": "angel", "location": "New York, NY"},
    {"name": "Reshma Sohoni", "bio": "Co-founder and Managing Partner at Seedcamp. Active investor in future of work and HR tech across Europe.", "industries": ["future-of-work", "hr-tech", "saas"], "type": "angel", "location": "London, UK", "twitter_url": "https://twitter.com/rsohoni"},
    {"name": "Jeff Weiner", "bio": "Former CEO of LinkedIn. Executive Chairman. Angel investor in future of work, compassionate management, and edtech.", "industries": ["future-of-work", "edtech", "social"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Ryan Hoover", "bio": "Founder of Product Hunt. Partner at Weekend Fund. Angel investor in productivity tools and future of work.", "industries": ["future-of-work", "productivity", "consumer"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/rrhoover"},
    {"name": "Claire Hughes Johnson", "bio": "Former COO of Stripe. Author of 'Scaling People'. Angel investor in future-of-work and people tools.", "industries": ["future-of-work", "enterprise", "hr-tech"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Hiten Shah", "bio": "Co-founder of FYI, KISSmetrics, Crazy Egg. Prolific angel investor in productivity and future-of-work tools.", "industries": ["future-of-work", "saas", "productivity"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/hnshah"},
    {"name": "April Underwood", "bio": "Co-founder of #ANGELS. Former VP Product at Slack. Active angel in future of work, collaboration, and SaaS.", "industries": ["future-of-work", "collaboration", "saas"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/aaborella"},

    # === SOCIAL ===
    {"name": "Mike Krieger", "bio": "Co-founder of Instagram. Active angel investor in consumer social, creativity tools, and messaging.", "industries": ["social", "consumer", "mobile"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/mikeyk"},
    {"name": "Ev Williams", "bio": "Co-founder of Twitter and Medium. Investing in media, social platforms, and the future of communication.", "industries": ["social", "media", "consumer"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/ev"},
    {"name": "Kevin Systrom", "bio": "Co-founder of Instagram. Angel investor in consumer social, AI, and health.", "industries": ["social", "consumer", "ai"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Josh Elman", "bio": "Former growth PM at Twitter, Facebook, LinkedIn. Partner at Greylock. Deep expertise in social consumer products.", "industries": ["social", "consumer", "mobile"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/joshelman"},
    {"name": "Anamitra Banerji", "bio": "Former VP Product at Twitter. Founding team at Twitter Ads. Angel investor in social and advertising.", "industries": ["social", "adtech", "consumer"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Dara Khosrowshahi", "bio": "CEO of Uber. Former Expedia CEO. Angel investor in social platforms and consumer marketplaces.", "industries": ["social", "marketplace", "consumer"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Cyan Banister", "bio": "Former Partner at Founders Fund. Prolific angel investor. Backed early social and consumer startups including Uber.", "industries": ["social", "consumer", "saas"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/CyanBanister"},
    {"name": "Josh Miller", "bio": "Former Director of Product at the White House. Built The Browser Company (Arc). Angel investor in social.", "industries": ["social", "consumer", "productivity"], "type": "angel", "location": "New York, NY", "twitter_url": "https://twitter.com/joshm"},
    {"name": "Nikita Bier", "bio": "Serial social app founder (tbh acquired by Facebook, Gas acquired by Discord). Active angel in consumer social.", "industries": ["social", "consumer", "mobile"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/nikitabier"},
    {"name": "David Byttow", "bio": "Founder of Secret. Former Google engineer. Angel investor in anonymous/authentic social apps.", "industries": ["social", "consumer", "mobile"], "type": "angel", "location": "San Francisco, CA"},

    # === DATA ===
    {"name": "DJ Patil", "bio": "Former US Chief Data Scientist under Obama. Partner at GreatPoint Ventures. Investing in data infrastructure and AI.", "industries": ["data", "ai", "infrastructure"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/daboroshi"},
    {"name": "Hilary Mason", "bio": "Founder of Fast Forward Labs (acquired by Cloudera). Former Chief Scientist at Bitly. Angel investor in data and ML.", "industries": ["data", "machine-learning", "ai"], "type": "angel", "location": "New York, NY", "twitter_url": "https://twitter.com/hmason"},
    {"name": "Pete Skomoroch", "bio": "Former Principal Data Scientist at LinkedIn. Co-founder of SkipFlag. Active angel in data infrastructure.", "industries": ["data", "ai", "enterprise"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/peteskomoroch"},
    {"name": "Tomasz Tunguz", "bio": "General Partner at Theory Ventures. One of the most data-driven VCs. Backing data infrastructure and SaaS.", "industries": ["data", "saas", "infrastructure"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/ttunguz"},
    {"name": "Ali Ghodsi", "bio": "Co-founder and CEO of Databricks. Angel investor in data engineering and AI/ML infrastructure.", "industries": ["data", "ai", "cloud"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Tristan Handy", "bio": "Founder and CEO of dbt Labs. Angel investor in the modern data stack and analytics tools.", "industries": ["data", "developer-tools", "analytics"], "type": "angel", "location": "Philadelphia, PA", "twitter_url": "https://twitter.com/jthandy"},
    {"name": "Elad Gil", "bio": "Author of 'High Growth Handbook'. Former VP at Twitter. Prolific angel investor in data, AI, and infrastructure.", "industries": ["data", "ai", "infrastructure"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/eaboroshi"},
    {"name": "Bob Muglia", "bio": "Former CEO of Snowflake. Angel investor in data cloud and analytics.", "industries": ["data", "cloud", "analytics"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Jure Leskovec", "bio": "Stanford professor and Chief Scientist at Pinterest. Angel investor in graph data and machine learning.", "industries": ["data", "machine-learning", "ai"], "type": "angel", "location": "Stanford, CA"},
    {"name": "Monica Rogati", "bio": "Former VP of Data at Jawbone. Independent data science advisor and angel investor in data startups.", "industries": ["data", "ai", "analytics"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/maboroshi"},

    # === WEB3 ===
    {"name": "Chris Dixon", "bio": "General Partner at a16z crypto. One of the most influential investors in web3 and decentralized internet.", "industries": ["web3", "crypto", "infrastructure"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/cdixon"},
    {"name": "Katie Haun", "bio": "Founder of Haun Ventures. Former federal prosecutor and a16z crypto partner. Leading web3 investor.", "industries": ["web3", "crypto", "defi"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/katie_haun"},
    {"name": "Fred Ehrsam", "bio": "Co-founder of Coinbase and Paradigm. Major investor in web3 protocols and infrastructure.", "industries": ["web3", "crypto", "defi"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/FEhrsam"},
    {"name": "Olaf Carlson-Wee", "bio": "Founder of Polychain Capital. First employee at Coinbase. Pioneer in crypto/web3 investing.", "industries": ["web3", "crypto", "defi"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Arianna Simpson", "bio": "General Partner at a16z crypto. Former founder of Autonomous Partners. Deep web3 and DeFi investor.", "industries": ["web3", "defi", "crypto"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/ariaboroshi"},
    {"name": "Linda Xie", "bio": "Co-founder of Scalar Capital. Former Product Manager at Coinbase. Angel investor in web3 and crypto consumer apps.", "industries": ["web3", "crypto", "consumer"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/ljxie"},
    {"name": "Stani Kulechov", "bio": "Founder of Aave and Lens Protocol. Active angel investor in DeFi and decentralized social.", "industries": ["web3", "defi", "social"], "type": "angel", "location": "London, UK", "twitter_url": "https://twitter.com/StaniKulechov"},
    {"name": "Santiago Roel Santos", "bio": "Angel investor and writer on web3 consumer applications and token economies.", "industries": ["web3", "consumer", "crypto"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/santiagoroel"},
    {"name": "Sandeep Nailwal", "bio": "Co-founder of Polygon. Active angel investor in web3 infrastructure and scaling solutions.", "industries": ["web3", "infrastructure", "crypto"], "type": "angel", "location": "Dubai / India", "twitter_url": "https://twitter.com/sanaboroshi"},
    {"name": "Jesse Walden", "bio": "Founder of Variant. Former head of a16z crypto investments. Investing in web3 ownership economy.", "industries": ["web3", "creator-economy", "crypto"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/jessaboroshi"},

    # === ENERGY ===
    {"name": "Jigar Shah", "bio": "Director of the Loan Programs Office at the US DOE. Founder of SunEdison. Pioneer in clean energy investing.", "industries": ["energy", "climate", "infrastructure"], "type": "angel", "location": "Washington, DC", "twitter_url": "https://twitter.com/JigarShahDC"},
    {"name": "Shayle Kann", "bio": "Partner at Energy Impact Partners. Host of The Interchange podcast. Deep energy transition investor.", "industries": ["energy", "climate", "infrastructure"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/shaylekann"},
    {"name": "Katherine Hamilton", "bio": "Chair of 38 North Solutions. Prominent clean energy policy expert and angel investor.", "industries": ["energy", "climate", "govtech"], "type": "angel", "location": "Washington, DC"},
    {"name": "Danny Kennedy", "bio": "Co-founder of Sungevity. Managing Director at New Energy Nexus. Clean energy angel investor.", "industries": ["energy", "climate", "emerging-markets"], "type": "angel", "location": "Oakland, CA"},
    {"name": "Mateo Jaramillo", "bio": "Co-founder of Form Energy. Former Tesla VP of Energy. Angel investor in grid-scale energy storage.", "industries": ["energy", "hardware", "climate"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Emily Kirsch", "bio": "Founder and Managing Partner of Powerhouse Ventures. Leading climate-energy VC.", "industries": ["energy", "climate", "infrastructure"], "type": "angel", "location": "Oakland, CA", "twitter_url": "https://twitter.com/EmilyKirsch"},
    {"name": "Ramez Naam", "bio": "Author of 'The Infinite Resource'. Former Microsoft Director. Angel investor in solar, batteries, and energy tech.", "industries": ["energy", "climate", "deeptech"], "type": "angel", "location": "Seattle, WA", "twitter_url": "https://twitter.com/ramaboroshi"},
    {"name": "Varun Sivaram", "bio": "Senior Fellow at Columbia SIPA. Former DOE official. Author on solar energy. Active angel investor.", "industries": ["energy", "climate", "deeptech"], "type": "angel", "location": "New York, NY"},
    {"name": "Nuo Xu", "bio": "Partner at Congruent Ventures. Investing in energy transition and sustainable infrastructure.", "industries": ["energy", "climate", "sustainability"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Stephen Lacey", "bio": "Co-founder of Post Script Media. Host of The Carbon Copy podcast. Angel investor in energy and cleantech.", "industries": ["energy", "media", "climate"], "type": "angel", "location": "Boston, MA"},

    # === DESIGN ===
    {"name": "John Maeda", "bio": "Former Global Head of Design at Microsoft. Author of 'The Laws of Simplicity'. Active angel in design tools and creative tech.", "industries": ["design", "developer-tools", "ai"], "type": "angel", "location": "New York, NY", "twitter_url": "https://twitter.com/johnmaeda"},
    {"name": "Dylan Field", "bio": "Co-founder and CEO of Figma. Angel investor in design tools and developer infrastructure.", "industries": ["design", "developer-tools", "collaboration"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/zoink"},
    {"name": "Tobias van Schneider", "bio": "Former Lead Product Designer at Spotify. Founder of Semplice. Active angel in design and creative tools.", "industries": ["design", "consumer", "saas"], "type": "angel", "location": "New York, NY", "twitter_url": "https://twitter.com/vanschneider"},
    {"name": "Irene Au", "bio": "Former VP Design at Google, Yahoo. Design Partner at Khosla Ventures. Angel investor in design-led startups.", "industries": ["design", "health", "consumer"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Bobby Ghoshal", "bio": "Co-founder of Butter and Candor. Super angel investor in design-first startups.", "industries": ["design", "saas", "collaboration"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/bobbyghoshal"},
    {"name": "Scott Belsky", "bio": "Co-founder of Behance (acquired by Adobe). CPO at Adobe. Prolific angel investor in creative and design tools.", "industries": ["design", "consumer", "creator-economy"], "type": "angel", "location": "New York, NY", "twitter_url": "https://twitter.com/scottbelsky"},
    {"name": "Julie Zhuo", "bio": "Former VP Design at Facebook/Meta. Co-founder of Sundial. Angel investor in design, productivity, and consumer.", "industries": ["design", "productivity", "consumer"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/joulee"},
    {"name": "Sahil Lavingia", "bio": "Founder and CEO of Gumroad. Former Pinterest designer. Super prolific angel investor with a design eye.", "industries": ["design", "creator-economy", "saas"], "type": "angel", "location": "Provo, UT", "twitter_url": "https://twitter.com/shl"},
    {"name": "Daniel Burka", "bio": "Former Design Partner at Google Ventures. Director of Design at Resolve to Save Lives. Angel investor in design for impact.", "industries": ["design", "health", "impact"], "type": "angel", "location": "Ontario, Canada"},
    {"name": "Cap Watkins", "bio": "Former VP Design at BuzzFeed. Angel investor in design systems and creative tools.", "industries": ["design", "consumer", "media"], "type": "angel", "location": "New York, NY"},

    # === BRANDS ===
    {"name": "Emily Weiss", "bio": "Founder of Glossier. Angel investor in direct-to-consumer brands and beauty.", "industries": ["brands", "beauty", "consumer"], "type": "angel", "location": "New York, NY", "twitter_url": "https://twitter.com/EmilyWeiss"},
    {"name": "Kirsten Green", "bio": "Founder of Forerunner Ventures. Earliest investor in Dollar Shave Club, Glossier, Warby Parker. The queen of DTC brands.", "industries": ["brands", "consumer", "e-commerce"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Katrina Lake", "bio": "Founder and CEO of Stitch Fix. Angel investor in innovative consumer and fashion brands.", "industries": ["brands", "consumer", "ai"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Jesse Derris", "bio": "Founder of Derris PR. Worked with Warby Parker, Harry's, Sweetgreen. Angel investor in brand-led startups.", "industries": ["brands", "consumer", "marketing-tech"], "type": "angel", "location": "New York, NY"},
    {"name": "Philip Krim", "bio": "Co-founder of Casper. Angel investor in digitally native vertical brands (DNVBs).", "industries": ["brands", "consumer", "e-commerce"], "type": "angel", "location": "New York, NY"},
    {"name": "Jen Rubio", "bio": "Co-founder and CEO of Away. Angel investor in purpose-driven consumer brands and travel.", "industries": ["brands", "consumer", "travel"], "type": "angel", "location": "New York, NY", "twitter_url": "https://twitter.com/jenrubio"},
    {"name": "Andy Dunn", "bio": "Founder of Bonobos (acquired by Walmart). Author of 'Burn Rate'. Active angel in consumer brands.", "industries": ["brands", "consumer", "e-commerce"], "type": "angel", "location": "New York, NY", "twitter_url": "https://twitter.com/duaboroshi"},
    {"name": "Musa Tariq", "bio": "Former CMO of Ford and GoFundMe. Head of Marketing at Apple. Angel investor in brand-first consumer startups.", "industries": ["brands", "marketing-tech", "consumer"], "type": "angel", "location": "New York, NY"},
    {"name": "Ben Lerer", "bio": "Managing Partner at Lerer Hippeau. Investor behind Warby Parker, Casper, Allbirds, and many iconic DTC brands.", "industries": ["brands", "consumer", "media"], "type": "angel", "location": "New York, NY", "twitter_url": "https://twitter.com/benlerer"},
    {"name": "Daniel Gulati", "bio": "Managing Director at Comcast Ventures. Author and angel investor in consumer brands and health.", "industries": ["brands", "consumer", "health"], "type": "angel", "location": "San Francisco, CA"},
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
    print(f"[*] Добавлено {s} контактов по категориям: future-of-work, social, data, web3, energy, design, brands.")

if __name__ == "__main__": save(all_investors)
