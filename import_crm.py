import json, os, urllib.request, urllib.parse
from dotenv import load_dotenv

load_dotenv('frontend/.env')
SUPABASE_URL = 'https://rjdewjyhtbfkujhvkwig.supabase.co'
SUPABASE_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY')

def import_leads():
    print("Loading raw_founders.json...")
    try:
        with open('parser/raw_founders.json', 'r', encoding='utf-8') as f:
            founders = json.load(f)
    except Exception as e:
        print("Error loading founders:", e)
        return

    # Map founders to existing 'investors' table schema
    payload = []
    for f in founders:
        name = f.get('full_name')
        if not name: continue
        
        bio = f"{f.get('title', 'Founder')} @ {f.get('company', '')}"
        
        payload.append({
            "name": name,
            "bio": bio,
            "website": f.get('domain'),
            "linkedin_url": f.get('linkedin_url'),
            "type": "lead", # Marks them as CRM leads rather than angels
            "linkedin_source": "inbox", # Kanban status
            "active": True
        })

    print(f"Preparing to upload {len(payload)} leads...")

    # Upload in batches of 100
    batch_size = 100
    for i in range(0, len(payload), batch_size):
        batch = payload[i:i+batch_size]
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/investors?on_conflict=name",
            data=json.dumps(batch).encode('utf-8'),
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Content-Type": "application/json",
                "Prefer": "return=minimal,resolution=ignore-duplicates"
            },
            method="POST"
        )
        try:
            with urllib.request.urlopen(req) as response:
                print(f"Batch {i//batch_size + 1} uploaded successfully.")
        except urllib.error.HTTPError as e:
            print(f"Batch {i//batch_size + 1} failed: {e.read().decode('utf-8')}")
        except Exception as e:
            print(f"Batch {i//batch_size + 1} failed: {e}")

if __name__ == "__main__":
    import_leads()
