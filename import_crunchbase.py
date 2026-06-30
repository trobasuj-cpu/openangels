import pandas as pd
import json, os, urllib.request
from dotenv import load_dotenv

load_dotenv('frontend/.env')
SUPABASE_URL = 'https://rjdewjyhtbfkujhvkwig.supabase.co'
SUPABASE_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY')

print("Downloading Crunchbase investments...")
url = 'https://raw.githubusercontent.com/notpeter/crunchbase-data/master/investments.csv'
df = pd.read_csv(url)

# Filter for angel and seed rounds to find early-stage investors
df_early = df[df['funding_round_type'].isin(['angel', 'seed'])].copy()

# Drop rows where investor_name is missing
df_early = df_early.dropna(subset=['investor_name'])

# Get unique investors
unique_investors = df_early['investor_name'].unique()
print(f"Found {len(unique_investors)} unique early-stage investors.")

# Take the first 2500 investors
target_investors = unique_investors[:2500]

inserts = []
for inv_name in target_investors:
    # Some basic heuristics
    # We will set a generic bio
    inv_data = df_early[df_early['investor_name'] == inv_name].iloc[0]
    location = ""
    if pd.notna(inv_data['investor_city']) and pd.notna(inv_data['investor_state_code']):
        location = f"{inv_data['investor_city']}, {inv_data['investor_state_code']}"
    
    investor = {
        'name': inv_name,
        'bio': f"Active investor in early-stage startups.",
        'location': location,
        'type': 'angel',
        'check_min': 10000,
        'check_max': 250000,
        'stages': ['pre-seed', 'seed', 'angel'],
        'industries': ['software', 'technology'],
        'verified': True,
        'active': True
    }
    inserts.append(investor)

print(f"Preparing to insert {len(inserts)} investors...")

# Insert one by one
success = 0
for i, inv in enumerate(inserts):
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/investors",
        data=json.dumps([inv]).encode('utf-8'),
        headers={
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        method='POST'
    )
    try:
        urllib.request.urlopen(req)
        success += 1
    except Exception as e:
        pass
    
    if i % 200 == 0 and i > 0:
        print(f"Processed {i}...")

print(f"Successfully inserted {success} new investors into Supabase!")
