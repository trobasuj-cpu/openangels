import requests
from bs4 import BeautifulSoup
import time
import csv
import json
import re

SEC_HEADERS = {
    'User-Agent': 'OpenAngels Parser openangels@example.com',
    'Accept-Encoding': 'gzip, deflate',
    'Host': 'www.sec.gov'
}

def clean_company_name(name: str) -> str:
    clean = name.lower()
    for word in [' inc.', ' inc', ' llc', ' ltd', ' ltd.', ' corp', ' corp.']:
        clean = clean.replace(word, '')
    clean = re.sub(r'[^a-z0-9]', '', clean)
    return f"{clean}.com"

def bulk_scrape_sec(limit=20):
    print("="*50)
    print("🚀 BULK SEC EDGAR SCRAPER STARTING...")
    print("="*50)
    
    rss_url = f"https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=D&count={limit}&output=atom"
    try:
        res = requests.get(rss_url, headers=SEC_HEADERS, timeout=10)
        soup = BeautifulSoup(res.text, 'xml')
        entries = soup.find_all('entry')
        
        print(f"[*] Получено {len(entries)} свежих инвестиционных форм Form D")
        
        all_contacts = []
        
        for idx, entry in enumerate(entries):
            title = entry.find('title').text if entry.find('title') else ""
            if not title.startswith('D -') and not title.startswith('D/A -'):
                continue
                
            link_tag = entry.find('link')
            if not link_tag:
                continue
                
            txt_url = link_tag['href'].replace('-index.htm', '.txt')
            
            print(f"[{idx+1}/{len(entries)}] Анализ: {txt_url}")
            time.sleep(0.3)
            
            doc_res = requests.get(txt_url, headers=SEC_HEADERS, timeout=10)
            if doc_res.status_code != 200:
                continue
                
            doc_soup = BeautifulSoup(doc_res.text, 'xml')
            
            issuer_tag = doc_soup.find('entityName')
            company_name = issuer_tag.text.strip() if issuer_tag else "Unknown"
            guessed_domain = clean_company_name(company_name)
            
            related_persons = doc_soup.find_all('relatedPersonInfo')
            
            for person in related_persons:
                first_name_tag = person.find('firstName')
                last_name_tag = person.find('lastName')
                
                roles = person.find_all('relationship')
                is_target = any(r.text.strip() in ['Director', 'Promoter', 'Executive Officer'] for r in roles)
                
                if first_name_tag and last_name_tag and is_target:
                    first_name = first_name_tag.text.strip()
                    last_name = last_name_tag.text.strip()
                    
                    if first_name.lower() in ['n/a', 'none', '']:
                        continue
                        
                    contact = {
                        "first_name": first_name.capitalize(),
                        "last_name": last_name.capitalize(),
                        "company": company_name,
                        "domain": guessed_domain,
                        "bio": f"SEC Form D Filer (Director at {company_name})",
                        "industries": "form_d, recent_funding"
                    }
                    all_contacts.append(contact)
                    print(f"    [+] Найден: {contact['first_name']} {contact['last_name']} ({company_name})")
                    
        return all_contacts
        
    except Exception as e:
        print(f"[!] Ошибка: {e}")
        return []

if __name__ == "__main__":
    contacts = bulk_scrape_sec(limit=40)
    
    # Save to CSV
    csv_file = "investors_database.csv"
    if contacts:
        keys = contacts[0].keys()
        with open(csv_file, 'w', newline='', encoding='utf-8') as f:
            dict_writer = csv.DictWriter(f, fieldnames=keys)
            dict_writer.writeheader()
            dict_writer.writerows(contacts)
            
        print("="*50)
        print(f"✅ УСПЕШНО! Собрано {len(contacts)} инвесторов/директоров.")
        print(f"📁 Данные сохранены в файл: {csv_file}")
        print("="*50)
