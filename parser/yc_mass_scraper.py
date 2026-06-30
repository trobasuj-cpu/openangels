import asyncio
from playwright.async_api import async_playwright
import json
import os
import re
import html as htmlmod

LINKS_FILE = "yc_links.json"

async def collect_company_links(max_scrolls=50):
    """Скроллит главную страницу YC и собирает ссылки на стартапы."""
    print("[*] Запускаем массовый сбор ссылок YC...")
    links = set()
    
    # Пытаемся загрузить уже собранные ссылки, чтобы продолжить с того же места
    if os.path.exists(LINKS_FILE):
        with open(LINKS_FILE, 'r') as f:
            links = set(json.load(f))
            print(f"[*] Найдено {len(links)} ссылок в кэше.")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("https://www.ycombinator.com/companies", wait_until="networkidle")
        
        print("[*] Начинаем прокрутку страницы для подгрузки всех компаний...")
        no_growth_count = 0
        last_links_count = len(links)
        
        for i in range(max_scrolls):
            # Собираем текущие ссылки
            elements = await page.query_selector_all("a[href^='/companies/']")
            for el in elements:
                href = await el.get_attribute("href")
                if href and href != '/companies/founders':
                    links.add(f"https://www.ycombinator.com{href}")
            
            # Проверка на зависание списка (ограничение YC)
            if len(links) == last_links_count:
                no_growth_count += 1
            else:
                no_growth_count = 0
                last_links_count = len(links)
                
            if no_growth_count >= 3:
                print(f"  -> Достигнут лимит бесконечного скролла (список не растет). Прерываем прокрутку.")
                break
            
            # Прокручиваем вниз
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(1000) # Ждем подгрузки (React Hydration)
            
            print(f"  -> Скролл {i+1}/{max_scrolls}. Собрано уникальных ссылок: {len(links)}")
            
            # Сохраняем промежуточный результат
            with open(LINKS_FILE, 'w') as f:
                json.dump(list(links), f)
                
        await browser.close()
        print(f"[+] Сбор ссылок завершен. Итого: {len(links)} стартапов.")
        return list(links)

async def extract_founders_from_profile(page, url):
    """Открывает страницу компании и извлекает данные фаундеров из встроенного JSON."""
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=60000)
        await page.wait_for_timeout(2000)
        
        # Получаем весь HTML и декодируем HTML-entities (&quot; -> ")
        raw_html = await page.content()
        decoded = htmlmod.unescape(raw_html)
        
        # Извлекаем домен компании из поля "website"
        domain = None
        domain_match = re.search(r'"website":\s*"(https?://[^"]+)"', decoded)
        if domain_match:
            raw_url = domain_match.group(1)
            domain = raw_url.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0]
        
        # Извлекаем название компании
        company_name = None
        name_match = re.search(r'"name":\s*"([^"]+)"', decoded)
        if name_match:
            company_name = name_match.group(1)
        
        # Извлекаем JSON-массив founders из HTML
        founders_match = re.search(r'"founders":\s*(\[.*?\])\s*[,}]', decoded)
        if not founders_match:
            return []
            
        founders_json = json.loads(founders_match.group(1))
        
        founders = []
        for f in founders_json:
            full_name = f.get('full_name', '').strip()
            if not full_name:
                continue
            parts = full_name.split()
            if len(parts) < 2:
                continue
                
            founders.append({
                'first_name': parts[0],
                'last_name': ' '.join(parts[1:]),
                'full_name': full_name,
                'title': f.get('title', ''),
                'linkedin_url': f.get('linkedin_url', ''),
                'twitter_url': f.get('twitter_url', ''),
                'domain': domain,
                'company_name': company_name,
                'company_url': url
            })
        return founders
    except Exception as e:
        print(f"[!] Ошибка при парсинге {url}: {e}")
        return []

if __name__ == "__main__":
    # Для теста запускаем только 5 скроллов
    asyncio.run(collect_company_links(max_scrolls=5))
