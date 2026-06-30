import requests
from bs4 import BeautifulSoup
import time
import random
import json

def fetch_yc_companies(limit=10):
    """
    Автоматический скрейпер базы стартапов Y Combinator.
    Извлекает имена фаундеров и домены их компаний.
    """
    print("[*] Запускаем Web Scraper для Y Combinator...")
    companies = []
    
    # YC использует Algolia или скрытый API, но для простоты
    # сделаем парсинг публичного каталога (первые несколько страниц)
    url = "https://www.ycombinator.com/companies"
    
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        response = requests.get(url, headers=headers)
        if response.status_code != 200:
            print(f"[!] Ошибка доступа к YC: {response.status_code}")
            return []
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Находим ссылки на компании
        links = soup.find_all('a', href=True)
        company_urls = [l['href'] for l in links if '/companies/' in l['href'] and len(l['href'].split('/')) == 3]
        company_urls = list(set(company_urls))[:limit]
        
        print(f"[*] Найдено {len(company_urls)} компаний на первой странице. Начинаем глубокий парсинг...")
        
        for comp_url in company_urls:
            full_url = f"https://www.ycombinator.com{comp_url}"
            try:
                res = requests.get(full_url, headers=headers)
                comp_soup = BeautifulSoup(res.text, 'html.parser')
                
                # Ищем домен
                website_el = comp_soup.find('a', string=lambda text: text and 'http' in text.lower())
                if not website_el:
                    # Fallback поиск домена
                    links_div = comp_soup.find('div', class_='flex flex-row items-center gap-x-2')
                    if links_div:
                        a_tag = links_div.find('a')
                        if a_tag:
                            website_el = a_tag

                domain = ""
                if website_el and 'href' in website_el.attrs:
                    raw_domain = website_el['href']
                    domain = raw_domain.replace('https://', '').replace('http://', '').replace('www.', '').split('/')[0]
                
                # Ищем фаундеров
                founders = []
                founder_cards = comp_soup.find_all('h3', class_='text-lg font-bold')
                for f in founder_cards:
                    name_parts = f.text.strip().split()
                    if len(name_parts) >= 2:
                        founders.append({
                            'first_name': name_parts[0],
                            'last_name': ' '.join(name_parts[1:])
                        })
                
                if domain and founders:
                    for f in founders:
                        person = {
                            'first_name': f['first_name'],
                            'last_name': f['last_name'],
                            'domain': domain,
                            'bio': f"YC Founder ({domain})",
                            'industries': ['startup', 'ycombinator']
                        }
                        companies.append(person)
                        print(f"    [+] Спарсен: {person['first_name']} {person['last_name']} из {domain}")
                        
            except Exception as e:
                print(f"[!] Ошибка парсинга {full_url}: {e}")
                
            time.sleep(random.uniform(0.5, 1.5))
            
    except Exception as e:
        print(f"[!] Глобальная ошибка скрейпера: {e}")
        
    return companies

if __name__ == "__main__":
    data = fetch_yc_companies(limit=3)
    print(json.dumps(data, indent=2))
