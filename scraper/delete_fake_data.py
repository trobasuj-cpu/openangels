import json
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def delete_fakes():
    with open("massive_investors.json", "r") as f:
        data = json.load(f)
    
    names = [inv["name"] for inv in data]
    
    # We will delete in batches
    batch_size = 100
    for i in range(0, len(names), batch_size):
        batch_names = names[i:i+batch_size]
        try:
            res = supabase.table("investors").delete().in_("name", batch_names).execute()
            if res.data:
                print(f"Deleted {len(res.data)} fake records...")
        except Exception as e:
            print(f"Error deleting batch: {e}")

if __name__ == "__main__":
    delete_fakes()
