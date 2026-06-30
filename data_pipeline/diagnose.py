"""Диагностический скрипт: проверяет каждый метод по отдельности на 5 инвесторах"""
import os, re, json, time, urllib.request, urllib.parse
from dotenv import load_dotenv
from ddgs import DDGS

load_dotenv('frontend/.env')
url = os.environ.get("VITE_SUPABASE_URL")
key = os.environ.get("VITE_SUPABASE_SERVICE_ROLE_KEY")
github_token = os.environ.get("GITHUB_TOKEN")

HEADERS = {
    'apikey': key,
    'Authorization': f'Bearer {key}',
    'Content-Type': 'application/json',
}

# Fetch 10 investors without email
req = urllib.request.Request(
    f'{url}/rest/v1/investors?select=id,name,bio,linkedin_url,twitter_url&email=is.null&limit=10',
    headers=HEADERS
)
with urllib.request.urlopen(req) as res:
    investors = json.loads(res.read().decode())

print(f"=== ДИАГНОСТИКА: {len(investors)} инвесторов ===\n")

for inv in investors:
    name = inv.get('name', '?')
    bio = inv.get('bio', '') or ''
    twitter = inv.get('twitter_url', '') or ''
    linkedin = inv.get('linkedin_url', '') or ''
    
    print(f"--- {name} ---")
    print(f"  Bio: {bio[:120]}...")
    print(f"  Twitter: {twitter}")
    print(f"  LinkedIn: {linkedin}")
    
    # Test 1: Obfuscated email in bio
    has_at = '@' in bio or '[at]' in bio.lower() or '(at)' in bio.lower()
    print(f"  [Метод 1 - Деобфускация] Email-паттерн в bio: {has_at}")
    
    # Test 2: GitHub via twitter handle
    if twitter:
        handle = twitter.strip('/').split('/')[-1].split('?')[0]
        print(f"  [Метод 2 - GitHub] Twitter handle -> GitHub handle: '{handle}'")
        try:
            import requests
            gh_headers = {'User-Agent': 'Mozilla/5.0'}
            if github_token:
                gh_headers['Authorization'] = f'token {github_token}'
            gh_res = requests.get(f'https://api.github.com/users/{handle}', headers=gh_headers, timeout=5)
            if gh_res.status_code == 200:
                gh_data = gh_res.json()
                print(f"    GitHub профиль НАЙДЕН: {gh_data.get('login')} (email в профиле: {gh_data.get('email')})")
                # Check events
                ev_res = requests.get(f'https://api.github.com/users/{handle}/events/public', headers=gh_headers, timeout=5)
                if ev_res.status_code == 200:
                    events = ev_res.json()
                    push_count = sum(1 for e in events if e.get('type') == 'PushEvent')
                    print(f"    PushEvent count: {push_count}")
            elif gh_res.status_code == 404:
                print(f"    GitHub профиль НЕ НАЙДЕН (404) — Twitter handle != GitHub handle!")
            else:
                print(f"    GitHub API status: {gh_res.status_code}")
        except Exception as e:
            print(f"    GitHub error: {e}")
    else:
        print(f"  [Метод 2 - GitHub] Нет Twitter URL")
    
    # Test 3: Personal URL in bio
    url_match = re.search(r'(?:https?://)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,6})(?:/|\s|$)', bio)
    if url_match:
        domain = url_match.group(1)
        print(f"  [Метод 3 - Личный сайт] Найден домен в bio: {domain}")
    else:
        print(f"  [Метод 3 - Личный сайт] Домен в bio НЕ найден")
    
    # Test 4: Company extraction from bio
    domain_match = re.search(r'([a-zA-Z0-9-]+\.(com|vc|capital|co|io|network|fund|partners|ventures|org))', bio.lower())
    if domain_match:
        print(f"  [Метод 4 - Компания regex] Найден домен: {domain_match.group(1)}")
    else:
        comp_match = re.search(r'(?:at|of|founder of|partner at|ceo of|investor at)\s+([A-Z0-9][a-zA-Z0-9&\s\.\-]+)(?:\.|\n|,|$)', bio, re.IGNORECASE)
        if comp_match:
            company = comp_match.group(1).strip()
            print(f"  [Метод 4 - Компания regex] Извлечена компания: '{company}'")
            # Test Clearbit
            try:
                import requests
                cb_res = requests.get(f'https://autocomplete.clearbit.com/v1/companies/suggest?query={urllib.parse.quote(company[:30])}', 
                                     headers={'User-Agent': 'Mozilla/5.0'}, timeout=5)
                if cb_res.status_code == 200 and cb_res.json():
                    print(f"    Clearbit домен: {cb_res.json()[0]['domain']}")
                else:
                    print(f"    Clearbit: ничего не найдено")
            except Exception as e:
                print(f"    Clearbit error: {e}")
        else:
            print(f"  [Метод 4 - Компания regex] Компания в bio НЕ найдена")
    
    # Test 5: DDG search
    try:
        results = list(DDGS().text(f'"{name}" email contact', max_results=3))
        if results:
            for r in results:
                body = r.get('body', '')
                email_match = re.search(r'([a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)', body)
                print(f"  [Метод 5 - DDG OSINT] {r.get('href', '')[:60]}")
                if email_match:
                    print(f"    >>> НАЙДЕН EMAIL: {email_match.group(1)}")
        else:
            print(f"  [Метод 5 - DDG OSINT] Нет результатов")
    except Exception as e:
        print(f"  [Метод 5 - DDG OSINT] Ошибка: {e}")
    
    print()
