import asyncio
import json
import csv
from async_email_verifier import process_batch
from mass_orchestrator import save_founders_csv

async def validate_existing_founders():
    print("=" * 60)
    print("🚀 EMAIL VALIDATION PHASE (from raw_founders.json)")
    print("=" * 60)

    try:
        with open("raw_founders.json", "r", encoding="utf-8") as f:
            all_founders = json.load(f)
    except Exception as e:
        print(f"[!] Error loading raw_founders.json: {e}")
        return

    # Filter to those with a domain
    founders_with_domain = [f for f in all_founders if f.get('domain')]
    print(f"[*] Loaded {len(all_founders)} total founders.")
    print(f"[*] Found {len(founders_with_domain)} founders with domains to verify.")

    valid_contacts = []
    email_batch_size = 50
    for i in range(0, len(founders_with_domain), email_batch_size):
        batch = founders_with_domain[i:i+email_batch_size]
        print(f"  -> Email checking batch {i+1}-{min(i+email_batch_size, len(founders_with_domain))}...")
        try:
            verified = await process_batch(batch)
            valid_contacts.extend(verified)
        except Exception as e:
            print(f"  ❌ Verification error: {e}")

    print("=" * 60)
    print("✅ EMAIL VALIDATION COMPLETE!")
    print(f"   ✉️ Contacts with verified email: {len(valid_contacts)}")

    if valid_contacts:
        save_founders_csv(valid_contacts, "MASSIVE_DATABASE.csv")
        print("   📁 Saved verified database to MASSIVE_DATABASE.csv")
    else:
        print("   ⚠️ No verified emails found.")

if __name__ == "__main__":
    asyncio.run(validate_existing_founders())
