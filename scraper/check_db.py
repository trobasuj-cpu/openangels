# -*- coding: utf-8 -*-
"""Add email + linkedin_url columns to Supabase investors table"""
import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

# Test connection and check current count
res = supabase.table("investors").select("id", count="exact").execute()
print(f"Total investors in DB: {res.count}")

# Check one row to see existing columns
sample = supabase.table("investors").select("*").limit(1).execute()
if sample.data:
    print(f"Existing columns: {list(sample.data[0].keys())}")
    has_email = "email" in sample.data[0]
    has_linkedin = "linkedin_url" in sample.data[0]
    print(f"Has email column: {has_email}")
    print(f"Has linkedin_url column: {has_linkedin}")
