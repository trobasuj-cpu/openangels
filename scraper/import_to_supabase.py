"""
OpenAngels — Import seed data to Supabase
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
    print("❌ Missing SUPABASE_URL or SUPABASE_KEY in .env file")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def clean_investor(inv: dict) -> dict:
    """Remove None values and ensure correct types."""
    cleaned = {}
    for k, v in inv.items():
        if v is not None and v != "" and v != []:
            cleaned[k] = v
    return cleaned


def import_investors():
    print(f"\n🚀 Starting import of {len(INVESTORS)} investors...\n")

    success = 0
    skipped = 0
    errors  = 0

    for inv in tqdm(INVESTORS, desc="Importing"):
        try:
            data = clean_investor(inv)
            # upsert by name to avoid duplicates
            res = supabase.table("investors").upsert(
                data, on_conflict="name"
            ).execute()
            success += 1
        except Exception as e:
            err = str(e)
            if "duplicate" in err.lower() or "unique" in err.lower():
                skipped += 1
            else:
                print(f"\n  ⚠️  Error on '{inv['name']}': {err}")
                errors += 1

    print(f"\n✅ Done!")
    print(f"   Imported : {success}")
    print(f"   Skipped  : {skipped} (duplicates)")
    print(f"   Errors   : {errors}")


def verify():
    """Check how many records are in the DB."""
    res = supabase.table("investors").select("id", count="exact").execute()
    print(f"\n📊 Total investors in DB: {res.count}")


if __name__ == "__main__":
    import_investors()
    verify()
