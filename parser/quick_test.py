import asyncio
import sys
from playwright.async_api import async_playwright
import json
from yc_mass_scraper import extract_founders_from_profile

async def quick_test():
    """Быстрый тест: берем 20 стартапов из кэша и парсим их."""
    with open("yc_links.json", "r") as f:
        all_links = json.load(f)
    
    test_links = all_links[:20]
    print(f"[*] Быстрый тест: парсим {len(test_links)} стартапов...", flush=True)
    
    all_founders = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        
        for i, url in enumerate(test_links):
            page = await context.new_page()
            try:
                founders = await extract_founders_from_profile(page, url)
                all_founders.extend(founders)
                if founders:
                    names = [f['full_name'] for f in founders]
                    print(f"  [{i+1}/{len(test_links)}] {url.split('/')[-1]}: {', '.join(names)} (домен: {founders[0].get('domain', 'N/A')})", flush=True)
                else:
                    print(f"  [{i+1}/{len(test_links)}] {url.split('/')[-1]}: НЕТ ФАУНДЕРОВ", flush=True)
            except Exception as e:
                print(f"  [{i+1}/{len(test_links)}] ОШИБКА: {e}", flush=True)
            finally:
                await page.close()
        
        await browser.close()
    
    print(f"\n{'='*50}", flush=True)
    print(f"ИТОГО: {len(all_founders)} фаундеров из {len(test_links)} стартапов", flush=True)
    for f in all_founders:
        print(f"  - {f['full_name']} ({f.get('title','')}) @ {f.get('domain','?')} | LI: {f.get('linkedin_url','')}", flush=True)
    print(f"{'='*50}", flush=True)

if __name__ == "__main__":
    asyncio.run(quick_test())
