import requests
import xml.etree.ElementTree as ET
import time
import re
from bs4 import BeautifulSoup

SEC_HEADERS = {
    'User-Agent': 'OpenAngels Parser openangels@example.com',
    'Accept-Encoding': 'gzip, deflate',
    'Host': 'www.sec.gov'
}

def clean_company_name(name: str) -> str:
    """Очищает название компании от 'Inc.', 'LLC' и пробелов для угадывания домена."""
    clean = name.lower()
    for word in [' inc.', ' inc', ' llc', ' ltd', ' ltd.', ' corp', ' corp.']:
        clean = clean.replace(word, '')
    
    clean = re.sub(r'[^a-z0-9]', '', clean)
    return f"{clean}.com"

def fetch_latest_form_d(limit=2):
    """
    Получает последние поданные формы D с сайта SEC.
    Извлекает инвесторов (Director/Promoter) из списка Related Persons.
    """
    print("[*] Подключаемся к базе SEC EDGAR (США)...")
    
    rss_url = "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=D&output=atom"
    try:
        res = requests.get(rss_url, headers=SEC_HEADERS, timeout=10)
        if res.status_code != 200:
            print(f"[!] Ошибка доступа к SEC: {res.status_code}")
            return []
            
        soup = BeautifulSoup(res.text, 'xml')
        entries = soup.find_all('entry')
        
        found_contacts = []
        count = 0
        
        for entry in entries:
            if count >= limit:
                break
                
            title = entry.find('title').text if entry.find('title') else ""
            if not title.startswith('D -') and not title.startswith('D/A -'):
                continue # На всякий случай пропускаем, если это не Form D
                
            link_tag = entry.find('link')
            if not link_tag:
                continue
                
            index_url = link_tag['href']
            # Конвертируем ссылку на индекс в ссылку на сырой текстовый файл
            txt_url = index_url.replace('-index.htm', '.txt')
            
            print(f"  -> Анализ документа: {txt_url}")
            time.sleep(0.5) # Соблюдаем лимиты SEC (макс 10 реквестов в секунду)
            
            doc_res = requests.get(txt_url, headers=SEC_HEADERS, timeout=10)
            if doc_res.status_code != 200:
                continue
                
            # Ищем нужные теги в сыром XML внутри txt файла
            doc_soup = BeautifulSoup(doc_res.text, 'xml')
            
            # Название компании (Issuer)
            issuer_tag = doc_soup.find('entityName')
            if not issuer_tag:
                continue
            company_name = issuer_tag.text.strip()
            guessed_domain = clean_company_name(company_name)
            
            # Связанные лица (Related Persons)
            related_persons = doc_soup.find_all('relatedPersonInfo')
            
            for person in related_persons:
                first_name_tag = person.find('firstName')
                last_name_tag = person.find('lastName')
                
                # Проверяем роль (нужен Director, Promoter)
                roles = person.find_all('relationship')
                is_target = any(r.text.strip() in ['Director', 'Promoter'] for r in roles)
                
                if first_name_tag and last_name_tag and is_target:
                    first_name = first_name_tag.text.strip()
                    last_name = last_name_tag.text.strip()
                    
                    if first_name.lower() in ['n/a', 'none', '']:
                        continue # Пропускаем компании, если это не живой человек
                    
                    contact = {
                        "first_name": first_name.capitalize(),
                        "last_name": last_name.capitalize(),
                        "domain": guessed_domain,
                        "bio": f"SEC Form D Filer (Director at {company_name})",
                        "industries": ["form_d", "recent_funding"]
                    }
                    found_contacts.append(contact)
                    print(f"    [OK] Найден инвестор/директор: {contact['first_name']} {contact['last_name']} ({company_name})")
                    
            count += 1
            
        return found_contacts
            
    except Exception as e:
        print(f"[!] Ошибка SEC парсера: {e}")
        return []

if __name__ == "__main__":
    contacts = fetch_latest_form_d(limit=2)
    for c in contacts:
        print(c)
