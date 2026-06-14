import csv
import os
import smtplib
import socket
import dns.resolver
from dotenv import load_dotenv
from supabase import create_client
import uuid
import time
import sys
from datetime import datetime, timezone

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# We need to set a reliable from-address
FROM_EMAIL = "hello@openangels.com" 

def resolve_mx(domain):
    try:
        answers = dns.resolver.resolve(domain, 'MX')
        mx_records = sorted(answers, key=lambda r: r.preference)
        return [r.exchange.to_text() for r in mx_records]
    except Exception:
        return []

def check_email_smtp(email: str, mx_hosts: list) -> str:
    """
    Returns: 'VALID', 'INVALID', 'CATCH_ALL', or 'ERROR'
    """
    domain = email.split('@')[1]
    
    # 1. Test for catch-all
    catch_all = False
    fake_email = f"test_{uuid.uuid4().hex[:8]}@{domain}"
    
    server = None
    connected = False
    
    for mx in mx_hosts:
        try:
            server = smtplib.SMTP(timeout=5)
            server.connect(mx)
            server.helo(server.local_hostname)
            server.mail(FROM_EMAIL)
            code, _ = server.rcpt(fake_email)
            if code == 250:
                catch_all = True
            connected = True
            break
        except Exception:
            if server:
                try:
                    server.quit()
                except:
                    pass
            continue
            
    if not connected:
        return 'ERROR'
        
    if catch_all:
        try:
            server.quit()
        except:
            pass
        return 'CATCH_ALL'
        
    # 2. Test actual email
    try:
        # Some servers require resetting the connection or re-helo
        server.quit()
        server = smtplib.SMTP(timeout=5)
        server.connect(mx_hosts[0])
        server.helo(server.local_hostname)
        server.mail(FROM_EMAIL)
        code, message = server.rcpt(email)
        server.quit()
        
        if code == 250:
            return 'VALID'
        elif code >= 500:
            return 'INVALID'
        else:
            return 'ERROR'
    except Exception as e:
        return 'ERROR'

def main():
    load_dotenv("scraper/.env")
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    supabase = create_client(supabase_url, supabase_key)

    csv_file = "scraper/enrichment_ddg_20260612.csv"
    if not os.path.exists(csv_file):
        print("CSV not found.")
        return

    rows = []
    with open(csv_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            rows.append(r)

    # Filter pattern emails (confidence 0.6)
    target_rows = [r for r in rows if r.get("email_conf") == "0.6" and r.get("email_candidate")]
    print(f"Loaded {len(target_rows)} pattern emails to verify via SMTP.")
    
    valid_count = 0
    domain_cache = {} # domain -> 'CATCH_ALL', 'NORMAL', 'ERROR', etc.

    for i, r in enumerate(target_rows, 1):
        email = r["email_candidate"]
        domain = email.split("@")[1]
        
        print(f"[{i}/{len(target_rows)}] Verifying {email} ... ", end="", flush=True)
        
        # Check cache
        if domain in domain_cache and domain_cache[domain] == 'CATCH_ALL':
            print("CATCH_ALL (cached)")
            continue
            
        mx_hosts = resolve_mx(domain)
        if not mx_hosts:
            print("INVALID_MX")
            continue
            
        status = check_email_smtp(email, mx_hosts)
        print(status)
        
        if status == 'CATCH_ALL':
            domain_cache[domain] = 'CATCH_ALL'
            
        if status == 'VALID':
            valid_count += 1
            # Push to Supabase immediately!
            try:
                payload = {
                    "email": email,
                    "contact_enriched_at": datetime.now(timezone.utc).isoformat()
                }
                supabase.table("investors").update(payload).eq("id", r["id"]).execute()
                print("    -> Saved to Supabase!")
            except Exception as e:
                print(f"    -> DB Error: {e}")
                
        time.sleep(1) # Polite delay
        
    print(f"\nVerification complete. Found {valid_count} 100% valid emails.")

if __name__ == "__main__":
    main()
