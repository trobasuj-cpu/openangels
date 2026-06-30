import asyncio
from playwright.async_api import async_playwright

async def debug_yc_page():
    """Открывает одну страницу стартапа и дампит HTML для анализа."""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        
        url = "https://www.ycombinator.com/companies/stripe"
        print(f"[*] Загружаем {url}...")
        await page.goto(url, wait_until="networkidle", timeout=60000)
        await page.wait_for_timeout(3000)
        
        # Дампим весь HTML
        html = await page.content()
        with open("debug_yc_page.html", "w", encoding="utf-8") as f:
            f.write(html)
        print(f"[+] HTML сохранен в debug_yc_page.html ({len(html)} байт)")
        
        # Ищем все заголовки h3
        h3_elements = await page.query_selector_all('h3')
        print(f"\n[*] Найдено h3 элементов: {len(h3_elements)}")
        for i, h3 in enumerate(h3_elements):
            text = await h3.inner_text()
            classes = await h3.get_attribute('class')
            print(f"  h3[{i}]: class='{classes}' text='{text}'")
        
        # Ищем все ссылки с текстом "Founder"
        all_text = await page.query_selector_all('*')
        print(f"\n[*] Ищем элементы с текстом 'Founder'...")
        for el in all_text[:500]:  # Только первые 500 чтобы не зависло
            try:
                text = await el.inner_text()
                if 'founder' in text.lower() and len(text) < 200:
                    tag = await el.evaluate("el => el.tagName")
                    classes = await el.get_attribute('class')
                    print(f"  <{tag}> class='{classes}': {text[:100]}")
            except:
                pass
        
        # Ищем ссылки (для домена)
        links = await page.query_selector_all('a')
        print(f"\n[*] Все внешние ссылки:")
        for a in links:
            href = await a.get_attribute('href')
            if href and 'http' in href and 'ycombinator' not in href:
                text = await a.inner_text()
                print(f"  {href} -> '{text[:50]}'")
        
        await browser.close()

asyncio.run(debug_yc_page())
