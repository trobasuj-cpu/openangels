import os
import re
import sys
import json
import time
import argparse
import urllib.request
import urllib.parse
from bs4 import BeautifulSoup
from dotenv import load_dotenv

load_dotenv('frontend/.env')
SUPABASE_URL = os.environ.get('VITE_SUPABASE_URL') or 'https://rjdewjyhtbfkujhvkwig.supabase.co'
SUPABASE_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY')


def search_linkedin_angels(category, limit=50):
    print(f"[*] Ищем инвесторов для категории: {category}")
    # Поиск через DuckDuckGo HTML версию
    query = f'"Angel Investor" OR "Venture Capital" "{category}" site:linkedin.com/in/'
    url = 'https://html.duckduckgo.com/html/?q=' + urllib.parse.quote(query)
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    contacts = []
    
    try:
        req = urllib.request.Request(url, headers=headers)
        html = urllib.request.urlopen(req).read().decode('utf-8')
        soup = BeautifulSoup(html, 'html.parser')
        
        results = soup.find_all('a', class_='result__snippet')
        title_links = soup.find_all('a', class_='result__url')
        
        for i in range(min(len(results), limit)):
            snippet = results[i].get_text()
            link = title_links[i]['href']
            
            if "linkedin.com/in/" not in link:
                continue
                
            # Extract name from the URL or Snippet (very basic extraction)
            # URL format: https://www.linkedin.com/in/john-doe-1234
            username = link.split('linkedin.com/in/')[-1].split('/')[0].split('?')[0]
            name = " ".join([word.capitalize() for word in username.split('-') if not word.isdigit()])
            
            if not name:
                continue
                
            contacts.append({
                "name": name,
                "bio": snippet[:200] + "...",
                "linkedin_url": link,
                "industries": [category],
                "type": "angel"
            })
            
    except Exception as e:
        print(f"Error fetching from DuckDuckGo: {e}")
        
    return contacts

def save_to_supabase(contacts):
    success = 0
    for c in contacts:
        try:
            # Simple insert using REST API
            url = f"{SUPABASE_URL}/rest/v1/investors"
            req = urllib.request.Request(
                url, 
                data=json.dumps(c).encode('utf-8'),
                headers={
                    'apikey': SUPABASE_KEY, 
                    'Authorization': f'Bearer {SUPABASE_KEY}',
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                method='POST'
            )
            with urllib.request.urlopen(req) as res:
                if res.status in [200, 201]:
                    success += 1
        except Exception as e:
            # Ignore duplicates or errors
            pass
    print(f"[*] Успешно добавлено {success} новых контактов в базу.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--category", required=True, help="Category to parse")
    parser.add_argument("--limit", type=int, default=15, help="Number of contacts to fetch per run")
    args = parser.parse_args()
    
    results = search_linkedin_angels(args.category, args.limit)
    if results:
        for r in results[:3]:
            print(f"Found: {r['name']} - {r['linkedin_url']}")
        save_to_supabase(results)
    else:
        print("Ничего не найдено.")
