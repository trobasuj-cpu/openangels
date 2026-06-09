# -*- coding: utf-8 -*-
"""
Add email column to Supabase investors table via RPC/raw SQL
Since supabase-py anon key can't run DDL, we use the REST API workaround:
just upsert with email field - Supabase will reject if column doesn't exist.

INSTRUCTIONS:
Go to: https://supabase.com/dashboard/project/rjdewjyhtbfkujhvkwig/editor
Run this SQL:
  ALTER TABLE investors ADD COLUMN IF NOT EXISTS email text;
  ALTER TABLE investors ADD COLUMN IF NOT EXISTS linkedin_url text;

Then run this script to verify.
"""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Try inserting email into one row to test
test = supabase.table("investors").select("id,name,email,linkedin_url").limit(3).execute()
print("Columns test:")
for row in test.data:
    print(f"  {row['name']}: email={row.get('email')}, linkedin={row.get('linkedin_url')}")
