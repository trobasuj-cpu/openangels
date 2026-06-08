# -*- coding: utf-8 -*-
"""Import batch 6 investors to Supabase"""
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from investors_batch6 import INVESTORS_BATCH6
from tqdm import tqdm

load_dotenv()
supabase: Client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

def clean(inv):
    return {k: v for k, v in inv.items() if v is not None and v != "" and v != []}

def run():
    print(f"\n>>> Importing {len(INVESTORS_BATCH6)} investors (batch 6)...\n")
    ok, skip, err = 0, 0, 0
    for inv in tqdm(INVESTORS_BATCH6, desc="Uploading"):
        try:
            supabase.table("investors").upsert(clean(inv), on_conflict="name").execute()
            ok += 1
        except Exception as e:
            s = str(e)
            if "duplicate" in s.lower() or "unique" in s.lower():
                skip += 1
            else:
                err += 1
    res = supabase.table("investors").select("id", count="exact").execute()
    print(f"\nDone! Imported={ok} Skipped={skip} Errors={err}")
    print(f"TOTAL in DB: {res.count}")
    if res.count >= 1000:
        print(">>> 1000 INVESTORS MILESTONE REACHED!")
    else:
        print(f">>> Need {1000 - res.count} more to reach 1000")

if __name__ == "__main__":
    run()
