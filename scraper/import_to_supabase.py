# -*- coding: utf-8 -*-
"""
OpenAngels -- Import seed data to Supabase
Run: python import_to_supabase.py
"""

import os
import sys
from dotenv import load_dotenv
from supabase import create_client, Client
from seed_investors import INVESTORS
from tqdm import tqdm

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Missing SUPABASE_URL or SUPABASE_KEY in .env file")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def clean_investor(inv: dict) -> dict:
    cleaned = {}
    for k, v in inv.items():
        if v is not None and v != "" and v != []:
            cleaned[k] = v
    return cleaned


def import_investors():
    print(f"\n>>> Starting import of {len(INVESTORS)} investors...\n")

    success = 0
    skipped = 0
    errors  = 0

    for inv in tqdm(INVESTORS, desc="Importing"):
        try:
            data = clean_investor(inv)
            supabase.table("investors").upsert(
                data, on_conflict="name"
            ).execute()
            success += 1
        except Exception as e:
            err = str(e)
            if "duplicate" in err.lower() or "unique" in err.lower():
                skipped += 1
            else:
                print(f"\n  WARNING on '{inv['name'].encode('ascii', 'replace').decode()}': {str(err)[:80]}")
                errors += 1

    print(f"\nDone!")
    print(f"  Imported : {success}")
    print(f"  Skipped  : {skipped} (duplicates)")
    print(f"  Errors   : {errors}")


def verify():
    res = supabase.table("investors").select("id", count="exact").execute()
    print(f"\nTotal investors in DB: {res.count}")


if __name__ == "__main__":
    import_investors()
    verify()

