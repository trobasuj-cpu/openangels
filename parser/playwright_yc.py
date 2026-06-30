import asyncio
from playwright.async_api import async_playwright

async def scrape_yc_directory_async(limit=3):
    companies_data = []
    
    print("\n[+] Запускаем невидимый браузер Chromium...")
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        url = "https://www.ycombinator.com/companies"
        print(f"[*] Открываем {url}")
        
        try:
            await page.goto(url, timeout=60000)
            print("[*] Ожидаем загрузки списка стартапов (React Hydration)...")
            
            # Ждем появления карточек компаний. В YC ссылки на компании обычно выглядят как /companies/название
            await page.wait_for_selector('a[href^="/companies/"]', timeout=30000)
            
            # Собираем ссылки на страницы компаний
            elements = await page.query_selector_all('a[href^="/companies/"]')
            
            company_urls = []
            for el in elements:
                href = await el.get_attribute('href')
                if href and len(href.split('/')) == 3:  # /companies/airbnb
                    company_urls.append(href)
                    
            company_urls = list(set(company_urls))[:limit]
            print(f"[+] Успешно обошли защиту! Найдено {len(company_urls)} компаний. Начинаем сбор...")
            
            for comp_url in company_urls:
                full_url = f"https://www.ycombinator.com{comp_url}"
                print(f"  -> Переходим в профиль {full_url}")
                
                comp_page = await context.new_page()
                try:
                    await comp_page.goto(full_url, timeout=30000)
                    
                    # Ищем домен компании
                    domain = ""
                    website_links = await comp_page.query_selector_all('a')
                    for link in website_links:
                        href = await link.get_attribute('href')
                        if href and href.startswith('http') and 'ycombinator.com' not in href and 'twitter.com' not in href and 'linkedin.com' not in href:
                            # Первая попавшаяся внешняя ссылка часто является доменом
                            domain = href.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0]
                            break
                            
                    # Ищем фаундеров (обычно в YC они в карточках с классом font-bold)
                    founders = []
                    h3_elements = await comp_page.query_selector_all('h3.font-bold')
                    for h3 in h3_elements:
                        text = await h3.inner_text()
                        parts = text.strip().split()
                        if len(parts) == 2 and " " not in parts[0] and "." not in parts[0]:  # Похоже на Имя Фамилия
                            founders.append({
                                'first_name': parts[0],
                                'last_name': parts[1]
                            })
                            
                    if domain and founders:
                        for f in founders:
                            person = {
                                "first_name": f["first_name"],
                                "last_name": f["last_name"],
                                "domain": domain,
                                "bio": f"YC Founder ({domain})",
                                "industries": ["startup", "ycombinator"]
                            }
                            companies_data.append(person)
                            print(f"    [OK] Спарсен фаундер: {f['first_name']} {f['last_name']} ({domain})")
                    else:
                        print(f"    [SKIP] Не удалось найти домен или фаундеров.")
                        
                except Exception as e:
                    print(f"    [ERROR] Ошибка профиля: {e}")
                finally:
                    await comp_page.close()
                    
        except Exception as e:
            print(f"[!] Глобальная ошибка Playwright: {e}")
            
        finally:
            await browser.close()
            
    return companies_data

def scrape_yc_directory(limit=3):
    return asyncio.run(scrape_yc_directory_async(limit))

if __name__ == "__main__":
    data = scrape_yc_directory(limit=2)
    print(data)
