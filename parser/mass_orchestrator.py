import asyncio
from playwright.async_api import async_playwright
import json
import csv
import sys
from yc_mass_scraper import collect_company_links, extract_founders_from_profile, LINKS_FILE
from async_email_verifier import process_batch

DB_FILE = "MASSIVE_DATABASE.csv"
RAW_FOUNDERS_FILE = "raw_founders.json"

def save_founders_csv(founders, filename=DB_FILE):
    """Сохраняет фаундеров в CSV."""
    if not founders:
        return
    keys = founders[0].keys()
    with open(filename, 'w', newline='', encoding='utf-8') as f:
        dict_writer = csv.DictWriter(f, fieldnames=keys)
        dict_writer.writeheader()
        dict_writer.writerows(founders)

async def run_massive_pipeline(max_scrolls=400, batch_size=5):
    print("=" * 60, flush=True)
    print("🚀 OPERATION '10,000 CONTACTS' — V2 (FIXED)", flush=True)
    print("=" * 60, flush=True)
    
    # Шаг 1: Сбор ссылок (используем кэш)
    links = await collect_company_links(max_scrolls)
    
    if not links:
        print("[!] Не найдено ссылок для парсинга.", flush=True)
        return
    
    print(f"\n[*] ФАЗА 2: Парсинг {len(links)} стартапов (по {batch_size} за раз)...", flush=True)
    
    all_founders = []
    errors = 0
    
    # Шаг 2: Парсинг страниц стартапов (пачками по batch_size)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        for i in range(0, len(links), batch_size):
            chunk = links[i:i+batch_size]
            
            # Создаём новый контекст для каждой пачки (предотвращает memory leak)
            context = await browser.new_context()
            
            for url in chunk:
                page = await context.new_page()
                try:
                    founders = await extract_founders_from_profile(page, url)
                    all_founders.extend(founders)
                    if founders:
                        names = [f['full_name'] for f in founders]
                        print(f"  ✅ [{i+1+chunk.index(url)}/{len(links)}] {url.split('/')[-1]}: {', '.join(names)} @ {founders[0].get('domain', '?')}", flush=True)
                except Exception as e:
                    errors += 1
                    print(f"  ❌ [{i+1+chunk.index(url)}/{len(links)}] {url.split('/')[-1]}: {e}", flush=True)
                finally:
                    await page.close()
            
            await context.close()
            
            # Промежуточное сохранение каждые 50 стартапов
            if (i + batch_size) % 50 == 0 or i + batch_size >= len(links):
                with open(RAW_FOUNDERS_FILE, 'w', encoding='utf-8') as f:
                    json.dump(all_founders, f, ensure_ascii=False, indent=2)
                print(f"\n  📊 ПРОГРЕСС: {i+batch_size}/{len(links)} стартапов | {len(all_founders)} фаундеров | {errors} ошибок", flush=True)
                print(f"  💾 Промежуточное сохранение в {RAW_FOUNDERS_FILE}\n", flush=True)
        
        await browser.close()
    
    print(f"\n{'='*60}", flush=True)
    print(f"[+] ФАЗА 2 ЗАВЕРШЕНА: {len(all_founders)} фаундеров из {len(links)} стартапов", flush=True)
    
    # Сохраняем сырые данные (даже без email — уже ценная база с LinkedIn!)
    save_founders_csv(all_founders, "FOUNDERS_WITH_LINKEDIN.csv")
    print(f"📁 База с LinkedIn сохранена в FOUNDERS_WITH_LINKEDIN.csv", flush=True)
    
    # Шаг 3: Валидация Email (только для фаундеров с доменом)
    founders_with_domain = [f for f in all_founders if f.get('domain')]
    print(f"\n[*] ФАЗА 3: Проверка email для {len(founders_with_domain)} фаундеров с доменами...", flush=True)
    
    valid_contacts = []
    email_batch_size = 20
    for i in range(0, len(founders_with_domain), email_batch_size):
        batch = founders_with_domain[i:i+email_batch_size]
        print(f"  -> Email-проверка ({i+1}-{min(i+email_batch_size, len(founders_with_domain))})...", flush=True)
        try:
            verified = await process_batch(batch)
            valid_contacts.extend(verified)
        except Exception as e:
            print(f"  ❌ Ошибка проверки: {e}", flush=True)
    
    print(f"\n{'='*60}", flush=True)
    print(f"✅ ОПЕРАЦИЯ ЗАВЕРШЕНА!", flush=True)
    print(f"   📊 Стартапов обработано: {len(links)}", flush=True)
    print(f"   👤 Фаундеров найдено: {len(all_founders)}", flush=True)
    print(f"   🔗 С LinkedIn: {len([f for f in all_founders if f.get('linkedin_url')])}", flush=True)
    print(f"   🌐 С доменом: {len(founders_with_domain)}", flush=True)
    print(f"   ✉️  С верифицированным email: {len(valid_contacts)}", flush=True)
    
    if valid_contacts:
        save_founders_csv(valid_contacts, DB_FILE)
        print(f"   📁 База с email: {DB_FILE}", flush=True)
    
    # Сохраняем полную базу (LinkedIn + все данные)
    save_founders_csv(all_founders, "FOUNDERS_WITH_LINKEDIN.csv")
    print(f"   📁 Полная база: FOUNDERS_WITH_LINKEDIN.csv", flush=True)
    print(f"{'='*60}", flush=True)

if __name__ == "__main__":
    asyncio.run(run_massive_pipeline(max_scrolls=400, batch_size=5))
