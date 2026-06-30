import os, json, urllib.request
from dotenv import load_dotenv
load_dotenv('frontend/.env')
SUPABASE_URL = os.environ.get('VITE_SUPABASE_URL') or 'https://rjdewjyhtbfkujhvkwig.supabase.co'
SUPABASE_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY')

all_investors = [
    # === CLOUD ===
    {"name": "David Linthicum", "bio": "Chief Cloud Strategy Officer at Deloitte. Author of 13 books on cloud computing. Angel investor in cloud infrastructure.", "industries": ["cloud", "infrastructure", "enterprise"], "type": "angel", "location": "Washington, DC"},
    {"name": "Corey Quinn", "bio": "Chief Cloud Economist at The Duckbill Group. Prominent cloud commentator and angel investor in cloud-native tools.", "industries": ["cloud", "developer-tools", "saas"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/QuinnyPig"},
    {"name": "Adrian Cockcroft", "bio": "Former VP Cloud Architecture at AWS. Former Netflix cloud architect. Angel investor in cloud and infrastructure.", "industries": ["cloud", "infrastructure", "developer-tools"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/adrianco"},
    {"name": "Mitchell Hashimoto", "bio": "Co-founder of HashiCorp (Terraform, Vagrant, Vault). Angel investor in cloud infrastructure and developer tools.", "industries": ["cloud", "developer-tools", "infrastructure"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/mitchellh"},
    {"name": "Armon Dadgar", "bio": "Co-founder and CTO of HashiCorp. Angel investor in cloud-native security and infrastructure.", "industries": ["cloud", "security", "infrastructure"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Martin Casado", "bio": "General Partner at a16z. Co-founder of Nicira (acquired by VMware). Pioneer in cloud networking and virtualization.", "industries": ["cloud", "infrastructure", "enterprise"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/martin_casado"},
    {"name": "Kelsey Hightower", "bio": "Former Principal Engineer at Google Cloud. Kubernetes legend. Active angel investor in cloud-native and DevOps tools.", "industries": ["cloud", "developer-tools", "open-source"], "type": "angel", "location": "Portland, OR", "twitter_url": "https://twitter.com/kelseyhightower"},
    {"name": "Solomon Hykes", "bio": "Founder of Docker. Co-founder of Dagger. Angel investor in cloud-native developer tools and infrastructure.", "industries": ["cloud", "developer-tools", "open-source"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/saboroshi"},

    # === DEFENSE ===
    {"name": "Palmer Luckey", "bio": "Founder of Oculus VR and Anduril Industries. Major investor and builder in defense technology.", "industries": ["defense", "ar-vr", "hardware"], "type": "angel", "location": "Orange County, CA"},
    {"name": "Trae Stephens", "bio": "Partner at Founders Fund. Co-founder of Anduril. First employee at Palantir. Leading defense tech investor.", "industries": ["defense", "ai", "security"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/traestephens"},
    {"name": "Katherine Boyle", "bio": "General Partner at a16z American Dynamism. Investing in defense, space, and critical infrastructure.", "industries": ["defense", "space", "infrastructure"], "type": "angel", "location": "Washington, DC", "twitter_url": "https://twitter.com/KTmBoyle"},
    {"name": "Mike Solana", "bio": "VP at Founders Fund. Writer of Pirate Wires. Active investor in defense and frontier tech.", "industries": ["defense", "media", "deeptech"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/miaboroshi"},
    {"name": "Raj Shah", "bio": "Managing Partner at Shield Capital. Former Head of DIU (Defense Innovation Unit). Deep defense tech investor.", "industries": ["defense", "ai", "security"], "type": "angel", "location": "Washington, DC"},
    {"name": "Ellen Lord", "bio": "Former Under Secretary of Defense for A&S. Board member and angel investor in defense startups.", "industries": ["defense", "manufacturing", "security"], "type": "angel", "location": "Washington, DC"},
    {"name": "Steve Blank", "bio": "Father of the Lean Startup methodology. Advisor to US DoD. Angel investor in defense innovation and dual-use tech.", "industries": ["defense", "enterprise", "deeptech"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/sgblank"},

    # === OPEN-SOURCE ===
    {"name": "Joseph Jacks", "bio": "Founder of OSS Capital. The first and only VC fund dedicated 100% to open-source software companies.", "industries": ["open-source", "developer-tools", "infrastructure"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/JosephJacks_"},
    {"name": "Peter Levine", "bio": "General Partner at a16z. Former CEO of XenSource. Published the definitive framework for open-source business models.", "industries": ["open-source", "enterprise", "cloud"], "type": "angel", "location": "Menlo Park, CA"},
    {"name": "Adam Jacob", "bio": "Co-founder of Chef (acquired by Progress). Active angel investor in open-source infrastructure and DevOps.", "industries": ["open-source", "developer-tools", "cloud"], "type": "angel", "location": "Seattle, WA", "twitter_url": "https://twitter.com/adamhjk"},
    {"name": "Heather Meeker", "bio": "Leading open-source licensing attorney. OSS Capital GP. Angel investor in open-source companies.", "industries": ["open-source", "legal-tech", "developer-tools"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Matt Mullenweg", "bio": "Founder of WordPress and Automattic. Pioneer of open-source business models. Active angel in OSS startups.", "industries": ["open-source", "consumer", "developer-tools"], "type": "angel", "location": "Houston, TX", "twitter_url": "https://twitter.com/photomatt"},
    {"name": "Spencer Kimball", "bio": "Co-founder and CEO of Cockroach Labs. Angel investor in open-source databases and infrastructure.", "industries": ["open-source", "data", "cloud"], "type": "angel", "location": "New York, NY"},
    {"name": "Sid Sijbrandij", "bio": "Co-founder and CEO of GitLab. One of the most vocal champions and investors in open-source DevOps.", "industries": ["open-source", "developer-tools", "cloud"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/saboroshi"},

    # === HARDWARE ===
    {"name": "Brady Forrest", "bio": "Founder of Highway1 (PCH International). Leading hardware accelerator operator and angel investor.", "industries": ["hardware", "iot", "consumer"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/brady"},
    {"name": "Ben Einstein", "bio": "Founder of Bolt (hardware VC). Industrial designer. Deeply technical hardware investor.", "industries": ["hardware", "manufacturing", "consumer"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/beneinstein"},
    {"name": "Avidan Ross", "bio": "Founder of Root Ventures. Hardware and frontier tech focused VC. Former mechanical engineer.", "industries": ["hardware", "robotics", "manufacturing"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/avidanross"},
    {"name": "Cyril Ebersweiler", "bio": "Founder of HAX (world's largest hardware accelerator) and SOSV. Pioneer of hardware investing.", "industries": ["hardware", "robotics", "deeptech"], "type": "angel", "location": "Shenzhen / San Francisco"},
    {"name": "Bilal Zuberi", "bio": "Partner at Lux Capital. Deeply technical hardware and deep tech investor. PhD in materials science.", "industries": ["hardware", "deeptech", "manufacturing"], "type": "angel", "location": "New York, NY"},
    {"name": "Nick Pinkston", "bio": "Founder of Plethora (acquired by Tempo Automation). Angel investor in manufacturing and hardware startups.", "industries": ["hardware", "manufacturing", "robotics"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/nickpinkston"},

    # === LOGISTICS ===
    {"name": "Ryan Petersen", "bio": "Founder and CEO of Flexport. Angel investor in global trade, logistics, and supply chain tech.", "industries": ["logistics", "supply-chain", "enterprise"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/typesfast"},
    {"name": "Jonathan Cheatham", "bio": "Former VP of Logistics at Walmart. Angel investor in last-mile delivery and supply chain automation.", "industries": ["logistics", "automation", "enterprise"], "type": "angel", "location": "Dallas, TX"},
    {"name": "Eric Sager", "bio": "Co-founder of Bringg. Angel investor in delivery logistics and fleet management.", "industries": ["logistics", "mobility", "saas"], "type": "angel", "location": "Chicago, IL"},
    {"name": "Dan Lewis", "bio": "Founder and CEO of Convoy (autonomous trucking marketplace). Angel investor in freight tech and logistics.", "industries": ["logistics", "marketplace", "autonomous"], "type": "angel", "location": "Seattle, WA"},
    {"name": "Zvi Schreiber", "bio": "Founder and CEO of Freightos. Angel investor in digital freight and logistics platforms.", "industries": ["logistics", "marketplace", "saas"], "type": "angel", "location": "Hong Kong / Israel"},
    {"name": "Kara Swisher (Lux Capital)", "bio": "Partner at Lux Capital portfolio advisory. Angel investor in robotics, logistics, and autonomous systems.", "industries": ["logistics", "robotics", "autonomous"], "type": "angel", "location": "Miami, FL"},

    # === SPACE ===
    {"name": "Dylan Taylor", "bio": "Chairman and CEO of Voyager Space. One of the most active angel investors in space startups globally.", "industries": ["space", "defense", "hardware"], "type": "angel", "location": "Denver, CO", "twitter_url": "https://twitter.com/DylanTaylorJr"},
    {"name": "Shaun Maguire", "bio": "Partner at Sequoia Capital. Former Caltech PhD physicist. Active investor in space, defense, and frontier tech.", "industries": ["space", "defense", "deeptech"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/shaunmmaguire"},
    {"name": "Chad Anderson", "bio": "Founder and Managing Partner of Space Capital. Former Managing Director at Space Angels. Top global space investor.", "industries": ["space", "deeptech", "defense"], "type": "angel", "location": "New York, NY", "twitter_url": "https://twitter.com/caboroshi"},
    {"name": "Tess Hatch", "bio": "Partner at Bessemer Venture Partners. Leading investor in space, drones, and aviation.", "industries": ["space", "hardware", "autonomous"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/tessrhatch"},
    {"name": "Mark Boggett", "bio": "CEO of Seraphim Capital. Runs the world's first space tech VC fund.", "industries": ["space", "defense", "infrastructure"], "type": "angel", "location": "London, UK"},
    {"name": "Sunil Nagaraj", "bio": "Founder of Ubiquity Ventures. Investing in 'software beyond the screen' including space and robotics.", "industries": ["space", "robotics", "hardware"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/sunaboroshi"},

    # === HR-TECH ===
    {"name": "Josh Bersin", "bio": "Founder of Bersin by Deloitte and The Josh Bersin Company. The most influential analyst and angel in HR tech.", "industries": ["hr-tech", "future-of-work", "enterprise"], "type": "angel", "location": "Oakland, CA", "twitter_url": "https://twitter.com/josh_bersin"},
    {"name": "David Green", "bio": "Director at Insight222. Leading people analytics expert and angel investor in HR tech startups.", "industries": ["hr-tech", "data", "enterprise"], "type": "angel", "location": "London, UK"},
    {"name": "Katelin Holloway", "bio": "Founding Partner at 776 (Alexis Ohanian). Former VP People at Reddit. Angel investor in people-first HR tech.", "industries": ["hr-tech", "future-of-work", "saas"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Lars Schmidt", "bio": "Founder of Amplify. Author of 'Redefining HR'. Angel investor in modern HR tools.", "industries": ["hr-tech", "future-of-work", "saas"], "type": "angel", "location": "Washington, DC", "twitter_url": "https://twitter.com/larsschmidt"},
    {"name": "Tracy Cote", "bio": "Former CHRO of Genesys and StockX. Active angel investor in early-stage HR tech and people analytics.", "industries": ["hr-tech", "enterprise", "saas"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Adam Grant", "bio": "Wharton professor. #1 NYT bestselling author. Angel investor in organizational psychology and HR tech.", "industries": ["hr-tech", "edtech", "future-of-work"], "type": "angel", "location": "Philadelphia, PA", "twitter_url": "https://twitter.com/AdamMGrant"},

    # === ROBOTICS ===
    {"name": "Daniela Rus", "bio": "Director of MIT CSAIL. World-renowned robotics researcher and angel investor in robotics startups.", "industries": ["robotics", "ai", "hardware"], "type": "angel", "location": "Cambridge, MA"},
    {"name": "Steve Jurvetson", "bio": "Co-founder of Future Ventures. Former DFJ partner. Early investor in SpaceX. Deep robotics and frontier tech investor.", "industries": ["robotics", "space", "deeptech"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/jurvetson"},
    {"name": "Helen Greiner", "bio": "Co-founder of iRobot (Roomba). Founder of CyPhy Works. Pioneer angel investor in robotics and drones.", "industries": ["robotics", "hardware", "defense"], "type": "angel", "location": "Boston, MA"},
    {"name": "Pieter Abbeel", "bio": "UC Berkeley professor. Co-founder of Covariant. Leading AI robotics researcher and angel investor.", "industries": ["robotics", "ai", "machine-learning"], "type": "angel", "location": "Berkeley, CA", "twitter_url": "https://twitter.com/paboroshi"},
    {"name": "Sebastian Thrun", "bio": "Founder of Waymo and Kitty Hawk. Former Stanford AI Lab director. Angel investor in autonomous robotics.", "industries": ["robotics", "autonomous", "ai"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Dmitry Grishin", "bio": "Founder of Grishin Robotics. Co-founder of Mail.ru Group. One of the world's first dedicated robotics VCs.", "industries": ["robotics", "hardware", "consumer"], "type": "angel", "location": "New York, NY"},

    # === PAYMENTS ===
    {"name": "Max Levchin", "bio": "Co-founder of PayPal and Affirm. Angel investor in fintech, payments, and BNPL.", "industries": ["payments", "fintech", "consumer"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/maboroshi"},
    {"name": "Patrick Collison", "bio": "Co-founder and CEO of Stripe. Angel investor in payments infrastructure and developer tools.", "industries": ["payments", "developer-tools", "infrastructure"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/patrickc"},
    {"name": "John Collison", "bio": "Co-founder and President of Stripe. Active angel investor alongside his brother in payments and fintech.", "industries": ["payments", "fintech", "infrastructure"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/collision"},
    {"name": "Lachy Groom", "bio": "Former Stripe exec (#20 employee). Founder of his own fund. Angel investor in payments and fintech infrastructure.", "industries": ["payments", "fintech", "infrastructure"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/lachygroom"},
    {"name": "Matt Harris", "bio": "Partner at Bain Capital Ventures. The most active fintech and payments investor on the East Coast.", "industries": ["payments", "fintech", "banking"], "type": "angel", "location": "New York, NY"},
    {"name": "Renaud Laplanche", "bio": "Founder of LendingClub and Upgrade. Angel investor in lending, payments, and embedded finance.", "industries": ["payments", "fintech", "consumer"], "type": "angel", "location": "San Francisco, CA"},

    # === FOODTECH ===
    {"name": "Josh Tetrick", "bio": "Co-founder and CEO of Eat Just (JUST Egg, Good Meat). Angel investor in alt-protein and food innovation.", "industries": ["foodtech", "climate", "biotech"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/joshtetrick"},
    {"name": "Bruce Friedrich", "bio": "Founder of The Good Food Institute. Leading advocate and angel investor in alternative proteins.", "industries": ["foodtech", "climate", "biotech"], "type": "angel", "location": "Washington, DC"},
    {"name": "Ali Partovi", "bio": "CEO of Neo. Angel investor in edtech, food, and consumer. Early Dropbox and Facebook investor.", "industries": ["foodtech", "edtech", "consumer"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/apartovi"},
    {"name": "Kimbal Musk", "bio": "Founder of The Kitchen Restaurant Group and Square Roots. Elon's brother. Angel investor in food tech and urban farming.", "industries": ["foodtech", "agriculture", "sustainability"], "type": "angel", "location": "Boulder, CO"},
    {"name": "Sarah Tavel", "bio": "General Partner at Benchmark. Former Pinterest PM. Investor in consumer and foodtech marketplaces.", "industries": ["foodtech", "marketplace", "consumer"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/sarahtavel"},
    {"name": "Marie-Therese Gustafsson", "bio": "Partner at Astanor Ventures. Leading European investor in sustainable food systems.", "industries": ["foodtech", "sustainability", "agriculture"], "type": "angel", "location": "Brussels, Belgium"},

    # === REAL-ESTATE ===
    {"name": "Brendan Wallace", "bio": "Co-founder and Managing Partner of Fifth Wall. The largest proptech VC in the world.", "industries": ["real-estate", "proptech", "climate"], "type": "angel", "location": "Los Angeles, CA", "twitter_url": "https://twitter.com/baboroshi"},
    {"name": "Clelia Warburg Peters", "bio": "Former president of MetaProp. Board member and angel investor in real estate technology.", "industries": ["real-estate", "proptech", "fintech"], "type": "angel", "location": "New York, NY"},
    {"name": "Aaron Block", "bio": "Co-founder of MetaProp. Prominent proptech venture investor and angel.", "industries": ["real-estate", "proptech", "saas"], "type": "angel", "location": "New York, NY"},
    {"name": "Zak Schwarzman", "bio": "Co-founder of MetaProp. Active angel investor in proptech and construction tech.", "industries": ["real-estate", "proptech", "saas"], "type": "angel", "location": "New York, NY"},
    {"name": "Pete Flint", "bio": "Co-founder of Trulia (acquired by Zillow). Managing Partner at NFX. Angel investor in real estate and marketplace.", "industries": ["real-estate", "marketplace", "consumer"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/peteflint"},
    {"name": "Spencer Rascoff", "bio": "Co-founder of Zillow, Pacaso, and dot.LA. Prolific angel investor in proptech and real estate.", "industries": ["real-estate", "proptech", "media"], "type": "angel", "location": "Los Angeles, CA", "twitter_url": "https://twitter.com/spencerrascoff"},

    # === BOOTSTRAPPED ===
    {"name": "Tyler Tringas", "bio": "Founder of Calm Fund (Earnest Capital). Pioneer of funding for bootstrapped and 'calm' companies.", "industries": ["bootstrapped", "saas", "indie"], "type": "angel", "location": "Remote", "twitter_url": "https://twitter.com/tylertringas"},
    {"name": "Rob Walling", "bio": "Founder of TinySeed and MicroConf. The godfather of bootstrapped SaaS investing.", "industries": ["bootstrapped", "saas", "developer-tools"], "type": "angel", "location": "Minneapolis, MN", "twitter_url": "https://twitter.com/robwalling"},
    {"name": "Bryce Roberts", "bio": "Co-founder of Indie.vc. Partner at OATV. Pioneered revenue-based financing for bootstrapped startups.", "industries": ["bootstrapped", "saas", "impact"], "type": "angel", "location": "Salt Lake City, UT", "twitter_url": "https://twitter.com/bryce"},
    {"name": "Nathan Barry", "bio": "Founder and CEO of ConvertKit (now Kit). Active angel investor in bootstrapped and creator-economy businesses.", "industries": ["bootstrapped", "creator-economy", "saas"], "type": "angel", "location": "Boise, ID", "twitter_url": "https://twitter.com/nathanbarry"},
    {"name": "Rand Fishkin", "bio": "Founder of SparkToro and Moz. Outspoken advocate for bootstrapping. Angel investor in indie startups.", "industries": ["bootstrapped", "marketing-tech", "saas"], "type": "angel", "location": "Seattle, WA", "twitter_url": "https://twitter.com/randfish"},
    {"name": "DHH (David Heinemeier Hansson)", "bio": "Co-founder of Basecamp and HEY. Creator of Ruby on Rails. Vocal proponent and angel investor in bootstrapped companies.", "industries": ["bootstrapped", "saas", "open-source"], "type": "angel", "location": "Copenhagen / Chicago"},

    # === MOBILE ===
    {"name": "Nate Fikke", "bio": "Former Head of Mobile at Sequoia. Angel investor in mobile-first consumer and fintech startups.", "industries": ["mobile", "consumer", "fintech"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Anand Agarawala", "bio": "Founder of Bumptop (acquired by Google). Angel investor in mobile and touch interfaces.", "industries": ["mobile", "consumer", "design"], "type": "angel", "location": "Toronto, Canada"},
    {"name": "Phil Libin", "bio": "Former CEO of Evernote. Co-founder of mmhmm and All Turtles. Angel investor in mobile productivity.", "industries": ["mobile", "productivity", "consumer"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/paboroshi"},
    {"name": "Rana el Kaliouby", "bio": "Co-founder of Affectiva. Emotion AI pioneer. Angel investor in mobile health and AI.", "industries": ["mobile", "ai", "health"], "type": "angel", "location": "Boston, MA"},
    {"name": "Matt Murphy", "bio": "Partner at Montage Ventures. Former Kleiner Perkins and Menlo Ventures. Top mobile and consumer investor.", "industries": ["mobile", "consumer", "enterprise"], "type": "angel", "location": "San Francisco, CA"},
    {"name": "Semil Shah", "bio": "Founder of Haystack. Early-stage investor deeply focused on mobile-first and consumer apps.", "industries": ["mobile", "consumer", "saas"], "type": "angel", "location": "San Francisco, CA", "twitter_url": "https://twitter.com/semil"},
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
    print(f"[*] Добавлено {s} контактов по категориям: cloud, defense, open-source, hardware, logistics, space, hr-tech, robotics, payments, foodtech, real-estate, bootstrapped, mobile.")

if __name__ == "__main__": save(all_investors)
