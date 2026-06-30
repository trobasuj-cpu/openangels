import os
import json
import urllib.request
from dotenv import load_dotenv

load_dotenv('frontend/.env')
SUPABASE_URL = 'https://rjdewjyhtbfkujhvkwig.supabase.co'
SUPABASE_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY')

def fetch_all_investors():
    all_investors = []
    limit = 1000
    offset = 0
    
    while True:
        url = f"{SUPABASE_URL}/rest/v1/investors?select=id,name,email,linkedin_url,twitter_url&limit={limit}&offset={offset}"
        req = urllib.request.Request(url, headers={
            'apikey': SUPABASE_KEY,
            'Authorization': f'Bearer {SUPABASE_KEY}',
            'Range-Unit': 'items'
        })
        
        try:
            with urllib.request.urlopen(req) as response:
                data = json.loads(response.read().decode('utf-8'))
                all_investors.extend(data)
                
                if len(data) < limit:
                    break
                offset += limit
        except Exception as e:
            print(f"Error fetching data at offset {offset}: {e}")
            break
            
    return all_investors

def audit():
    print("Fetching investors from database...")
    investors = fetch_all_investors()
    total = len(investors)
    print(f"Total investors fetched: {total}\n")
    
    if total == 0:
        return

    stats = {
        "ideal": 0,
        "missing_email_only": 0,
        "missing_linkedin_only": 0,
        "missing_twitter_only": 0,
        "missing_two_fields": 0,
        "missing_all_three": 0,
        
        # Absolute missing counts
        "total_missing_email": 0,
        "total_missing_linkedin": 0,
        "total_missing_twitter": 0,
    }

    for inv in investors:
        has_email = bool(inv.get('email') and str(inv.get('email')).strip())
        has_li = bool(inv.get('linkedin_url') and str(inv.get('linkedin_url')).strip())
        has_tw = bool(inv.get('twitter_url') and str(inv.get('twitter_url')).strip())
        
        fields_count = sum([has_email, has_li, has_tw])
        
        if not has_email: stats["total_missing_email"] += 1
        if not has_li: stats["total_missing_linkedin"] += 1
        if not has_tw: stats["total_missing_twitter"] += 1

        if fields_count == 3:
            stats["ideal"] += 1
        elif fields_count == 2:
            if not has_email:
                stats["missing_email_only"] += 1
            elif not has_li:
                stats["missing_linkedin_only"] += 1
            elif not has_tw:
                stats["missing_twitter_only"] += 1
        elif fields_count == 1:
            stats["missing_two_fields"] += 1
        else:
            stats["missing_all_three"] += 1

    print("--- АУДИТ БАЗЫ ДАННЫХ ИНВЕСТОРОВ ---")
    print(f"Всего записей: {total}")
    print(f"✅ Идеальные (есть Email, LinkedIn, Twitter): {stats['ideal']} ({(stats['ideal']/total)*100:.1f}%)")
    print("-" * 40)
    print("⚠️ Не хватает ровно одного поля:")
    print(f"  - Нет Email (но есть соцсети): {stats['missing_email_only']}")
    print(f"  - Нет LinkedIn (но есть Email и Twitter): {stats['missing_linkedin_only']}")
    print(f"  - Нет Twitter (но есть Email и LinkedIn): {stats['missing_twitter_only']}")
    print("-" * 40)
    print(f"🚨 Не хватает двух полей: {stats['missing_two_fields']} ({(stats['missing_two_fields']/total)*100:.1f}%)")
    print(f"🗑️ Мусорные (нет ни Email, ни LinkedIn, ни Twitter): {stats['missing_all_three']} ({(stats['missing_all_three']/total)*100:.1f}%)")
    print("-" * 40)
    print("Общая статистика отсутствующих полей:")
    print(f"Всего без Email:    {stats['total_missing_email']} ({(stats['total_missing_email']/total)*100:.1f}%)")
    print(f"Всего без LinkedIn: {stats['total_missing_linkedin']} ({(stats['total_missing_linkedin']/total)*100:.1f}%)")
    print(f"Всего без Twitter:  {stats['total_missing_twitter']} ({(stats['total_missing_twitter']/total)*100:.1f}%)")

if __name__ == "__main__":
    audit()
