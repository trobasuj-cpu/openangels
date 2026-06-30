import dns.resolver
import smtplib
import socket
import random
import time
from typing import List, Optional

def generate_email_permutations(first_name: str, last_name: str, domain: str) -> List[str]:
    """Генерирует все возможные варианты почты для инвестора."""
    f = first_name.lower().strip()
    l = last_name.lower().strip()
    d = domain.lower().strip()
    
    if not f or not l or not d:
        return []
        
    return [
        f"{f}@{d}",                 # john@vc.com
        f"{f[0]}{l}@{d}",           # jsmith@vc.com
        f"{f}.{l}@{d}",             # john.smith@vc.com
        f"{f}{l}@{d}",              # johnsmith@vc.com
        f"{f}_{l}@{d}",             # john_smith@vc.com
        f"{f}{l[0]}@{d}",           # johns@vc.com
        f"{l}@{d}",                 # smith@vc.com
    ]

def get_mx_record(domain: str) -> Optional[str]:
    """Получает почтовый сервер (MX запись) для домена."""
    try:
        records = dns.resolver.resolve(domain, 'MX')
        mx_record = records[0].exchange.to_text()
        return mx_record
    except Exception as e:
        return None

def verify_email(email: str, mx_record: str) -> bool:
    """Проверяет существование email адреса через SMTP handshake."""
    domain = email.split('@')[1]
    
    try:
        # Подключаемся к почтовому серверу
        server = smtplib.SMTP(timeout=5)
        server.set_debuglevel(0)
        
        # Шаг 1: Подключение
        server.connect(mx_record)
        server.helo(server.local_hostname)
        
        # Шаг 2: От кого (используем фейковый адрес)
        server.mail('hello@openangels.xyz')
        
        # Шаг 3: Кому (проверяемый адрес)
        code, message = server.rcpt(email)
        server.quit()
        
        # Если код 250, значит ящик существует и готов принять письмо
        if code == 250:
            return True
            
        return False
    except Exception as e:
        return False

def find_valid_email(first_name: str, last_name: str, company_domain: str) -> Optional[str]:
    """Ищет валидный email, перебирая варианты."""
    if not company_domain:
        return None
        
    permutations = generate_email_permutations(first_name, last_name, company_domain)
    if not permutations:
        return None
        
    mx_record = get_mx_record(company_domain)
    if not mx_record:
        return None
        
    print(f"    [SMTP] Найден почтовый сервер для {company_domain}: {mx_record}")
    
    for email in permutations:
        print(f"    [SMTP] Проверка {email}...")
        is_valid = verify_email(email, mx_record)
        if is_valid:
            print(f"    [SUCCESS] Найден рабочий email: {email}")
            return email
        
        # Задержка, чтобы нас не заблокировали
        time.sleep(random.uniform(0.5, 1.5))
        
    return None

if __name__ == "__main__":
    # Тест
    print("Тестирование поиска email...")
    result = find_valid_email("Marc", "Andreessen", "a16z.com")
    print(f"Результат: {result}")
