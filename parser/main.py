import os
import csv
import json
import argparse
from dotenv import load_dotenv
from email_verifier import find_valid_email
from supabase import create_client, Client

# Загружаем ключи из фронтенда
load_dotenv('../frontend/.env')
load_dotenv('../frontend/.env.local')

# Настройки Supabase
def init_supabase():
    url = os.environ.get("VITE_SUPABASE_URL", "")
    key = os.environ.get("VITE_SUPABASE_ANON_KEY", "")
    if not url or not key:
        return None
    try:
        return create_client(url, key)
    except Exception as e:
        print(f"[!] Supabase Init Error: {e}")
        return None

def parse_and_enrich_csv(csv_path: str):
    """
    Читает CSV файл с инвесторами, находит их email адреса через OSINT
    и загружает в Supabase.
    
    Ожидаемый формат CSV: First Name, Last Name, Company Domain, Bio, Industries
    """
    supabase = init_supabase()
    
    print(f"[*] Открываем файл: {csv_path}")
    if not os.path.exists(csv_path):
        print(f"[!] Файл {csv_path} не найден.")
        return

    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        
        for row_num, row in enumerate(reader, 1):
            # Попробуем найти нужные колонки
            # Поддерживаем разные названия колонок
            first_name = row.get('First Name') or row.get('first_name') or row.get('FirstName', '')
            last_name = row.get('Last Name') or row.get('last_name') or row.get('LastName', '')
            domain = row.get('Company Domain') or row.get('domain') or row.get('website', '').replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0]
            bio = row.get('Bio') or row.get('bio', '')
            industries_str = row.get('Industries') or row.get('industries', '')
            
            industries = [i.strip() for i in industries_str.split(',')] if industries_str else []

            if not first_name or not last_name or not domain:
                print(f"[SKIP] Строка {row_num}: Недостаточно данных (Имя: {first_name}, Домен: {domain})")
                continue
                
            print(f"\n[*] Обработка инвестора: {first_name} {last_name} ({domain})")
            
            # OSINT поиск email
            valid_email = find_valid_email(first_name, last_name, domain)
            
            if valid_email:
                # Подготовка данных для Supabase
                investor_data = {
                    "name": f"{first_name} {last_name}",
                    "email": valid_email,
                    "location": row.get('Location', 'Remote'),
                    "bio": bio,
                    "industries": industries,
                    # Можно добавить check_min / check_max если они есть в CSV
                }
                
                try:
                    # Отправляем в Supabase
                    response = supabase.table('investors').insert(investor_data).execute()
                    print(f"[+] Успешно добавлено в базу: {valid_email}")
                except Exception as e:
                    print(f"[!] Ошибка записи в Supabase: {e}")
            else:
                print(f"[-] Не удалось найти email для {first_name} {last_name}")

def run_strong_pipeline(source='yc_strong'):
    if source == 'yc_strong':
        from playwright_yc import scrape_yc_directory
        scraped_people = scrape_yc_directory(limit=2)
    elif source == 'sec':
        from sec_scraper import fetch_latest_form_d
        scraped_people = fetch_latest_form_d(limit=5)
    else:
        scraped_people = []
        
    print("="*50)
    print("=== OpenAngels STRONG Web Scraper & OSINT Pipeline ===")
    print("="*50)
    
    supabase = init_supabase()
    
    # ШАГ 1: Веб-скрейпинг (сбор сырых данных)
    
    print("\n[+] Передаем собранные данные в модуль OSINT (поиск email)...")
    
    # ШАГ 2: OSINT Проверка (генерация и SMTP валидация)
    for person in scraped_people:
        print(f"\n[*] Обогащение контакта: {person['first_name']} {person['last_name']} ({person['domain']})")
        email = find_valid_email(person['first_name'], person['last_name'], person['domain'])
        
        if email:
            person['email'] = email
            
            # ШАГ 3: Загрузка в Supabase (проверка на дубликаты)
            try:
                # Проверяем, есть ли уже такой email в базе
                existing = supabase.table('investors').select('id').eq('email', email).execute()
                if existing.data and len(existing.data) > 0:
                    print(f"    [SKIP] Контакт {email} уже есть в нашей базе (дубликат).")
                else:
                    supabase.table('investors').insert(person).execute()
                    print(f"    [DATABASE] Контакт {email} успешно добавлен в базу!")
            except Exception as e:
                print(f"    [DATABASE] Ошибка базы данных: {e}")
        else:
            print(f"    [-] Не удалось сгенерировать валидный email.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OpenAngels Parser & OSINT Email Finder")
    parser.add_argument("--csv", help="Путь к CSV файлу со списком инвесторов", required=False)
    parser.add_argument("--scrape", choices=['yc_strong', 'sec'], help="Запустить мощный веб-парсер", required=False)
    parser.add_argument("--test", action="store_true", help="Запустить тестовую проверку")
    
    args = parser.parse_args()
    
    print("="*50)
    print("=== OpenAngels Parser & OSINT Enrichment ===")
    print("="*50)
    
    if args.test:
        print("Запуск тестового режима...")
        email = find_valid_email("Marc", "Andreessen", "a16z.com")
        if email:
            print(f"Тест успешен! Найден email: {email}")
        else:
            print("Тест не удался. Возможно ваш провайдер блокирует порт 25 (SMTP).")
    elif args.scrape == 'yc_strong':
        run_strong_pipeline('yc_strong')
    elif args.scrape == 'sec':
        run_strong_pipeline('sec')
    elif args.csv:
        parse_and_enrich_csv(args.csv)
    else:
        print("Используйте: python main.py --scrape yc_strong (для парсинга YC)")
        print("Или: python main.py --csv data.csv (для загрузки из CSV)")
