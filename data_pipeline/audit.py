import os
import json
import urllib.request

env_path = os.path.join(os.path.dirname(__file__), '..', 'frontend', '.env')
env_vars = {}
try:
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            if '=' in line and not line.strip().startswith('#'):
                k, v = line.strip().split('=', 1)
                env_vars[k] = v
except Exception as e:
    print(f"Failed to load .env: {e}")
    exit(1)

url = env_vars.get("VITE_SUPABASE_URL")
key = env_vars.get("VITE_SUPABASE_SERVICE_ROLE_KEY") or env_vars.get("VITE_SUPABASE_ANON_KEY")

HEADERS = {
    "apikey": key,
    "Authorization": f"Bearer {key}",
    "Content-Type": "application/json"
}

def get_all_investors():
    all_data = []
    offset = 0
    limit = 1000
    while True:
        req_url = f"{url}/rest/v1/investors?select=email,linkedin_url,twitter_url&limit={limit}&offset={offset}"
        req = urllib.request.Request(req_url, headers=HEADERS)
        try:
            with urllib.request.urlopen(req) as res:
                data = json.loads(res.read().decode('utf-8'))
                if not data:
                    break
                all_data.extend(data)
                offset += limit
        except Exception as e:
            print(f"Error fetching data: {e}")
            break
    return all_data

def run_audit():
    investors = get_all_investors()
    total = len(investors)
    if total == 0:
        print("No investors found.")
        return

    ideal = 0
    missing_one_email = 0
    missing_one_linkedin = 0
    missing_one_twitter = 0
    missing_two = 0
    empty = 0
    
    total_no_email = 0
    total_no_linkedin = 0
    total_no_twitter = 0

    for inv in investors:
        has_email = bool(inv.get('email'))
        has_linkedin = bool(inv.get('linkedin_url'))
        has_twitter = bool(inv.get('twitter_url'))
        
        count = sum([has_email, has_linkedin, has_twitter])
        
        if count == 3:
            ideal += 1
        elif count == 2:
            if not has_email:
                missing_one_email += 1
            elif not has_linkedin:
                missing_one_linkedin += 1
            elif not has_twitter:
                missing_one_twitter += 1
        elif count == 1:
            missing_two += 1
        elif count == 0:
            empty += 1
            
        if not has_email:
            total_no_email += 1
        if not has_linkedin:
            total_no_linkedin += 1
        if not has_twitter:
            total_no_twitter += 1

    print("--- АУДИТ БАЗЫ ДАННЫХ ИНВЕСТОРОВ ---")
    print(f"✅ Идеальные (есть Email, LinkedIn, Twitter): {ideal} ({(ideal/total)*100:.1f}%)")
    print("--------------------------------------------------")
    print("⚠️ Не хватает ровно ОДНОГО поля (кандидаты на парсинг в первую очередь):")
    print(f"  - Нет Email (но есть соцсети): {missing_one_email}")
    print(f"  - Нет LinkedIn (но есть Email и Twitter): {missing_one_linkedin}")
    print(f"  - Нет Twitter (но есть Email и LinkedIn): {missing_one_twitter}")
    print("--------------------------------------------------")
    print(f"🔒 Не хватает ДВУХ полей: {missing_two} ({(missing_two/total)*100:.1f}%)")
    print(f"🗑️ Пустые контакты (нет ни Email, ни LinkedIn, ни Twitter): {empty} ({(empty/total)*100:.1f}%)")
    print("--------------------------------------------------")
    print("Общая статистика отсутствующих данных:")
    print(f"Всего без Email:    {total_no_email} ({(total_no_email/total)*100:.1f}%)")
    print(f"Всего без LinkedIn: {total_no_linkedin} ({(total_no_linkedin/total)*100:.1f}%)")
    print(f"Всего без Twitter:  {total_no_twitter} ({(total_no_twitter/total)*100:.1f}%)")
    print("--------------------------------------------------")
    print(f"Всего записей в базе: {total}")

if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    run_audit()
