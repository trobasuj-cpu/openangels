import asyncio
import aiosmtplib
import dns.resolver

def generate_email_permutations(first_name, last_name, domain):
    first = first_name.lower().strip()
    last = last_name.lower().strip()
    
    if not first or not domain:
        return []
        
    perms = [
        f"{first}@{domain}",
        f"{first}{last}@{domain}",
        f"{first}.{last}@{domain}",
        f"{first[0]}{last}@{domain}",
        f"{first}_{last}@{domain}",
    ]
    return perms

import ssl

async def check_email_smtp_async(email, mx_record):
    """Асинхронная проверка существования email через SMTP"""
    try:
        tls_context = ssl.create_default_context()
        tls_context.check_hostname = False
        tls_context.verify_mode = ssl.CERT_NONE
        
        # Открываем соединение с MX сервером
        smtp = aiosmtplib.SMTP(hostname=mx_record, port=25, timeout=5, tls_context=tls_context)
        await smtp.connect()
        
        # Представляемся
        await smtp.ehlo("mail.google.com")
        
        # От кого (обязательно реальный формат почты)
        await smtp.mail("hello@openangels.com")
        
        # Кому (проверяемый адрес)
        code, message = await smtp.rcpt(email)
        
        await smtp.quit()
        
        # Код 250 означает что ящик существует
        if code == 250:
            return True
        return False
    except Exception:
        return False

async def get_mx_record_async(domain):
    loop = asyncio.get_event_loop()
    try:
        answers = await loop.run_in_executor(None, dns.resolver.resolve, domain, 'MX')
        mx_record = str(answers[0].exchange)
        return mx_record
    except Exception:
        return None

async def find_valid_email_async(first_name, last_name, domain):
    mx_record = await get_mx_record_async(domain)
    if not mx_record:
        return None
        
    perms = generate_email_permutations(first_name, last_name, domain)
    
    # Запускаем проверку всех вариантов одновременно
    tasks = [check_email_smtp_async(email, mx_record) for email in perms]
    results = await asyncio.gather(*tasks)
    
    for email, is_valid in zip(perms, results):
        if is_valid:
            return email
            
    return None

async def process_batch(founders):
    """Проверяет пачку фаундеров асинхронно"""
    tasks = []
    for founder in founders:
        tasks.append(find_valid_email_async(founder['first_name'], founder['last_name'], founder['domain']))
        
    emails = await asyncio.gather(*tasks)
    
    # Присваиваем найденные email обратно фаундерам
    valid_contacts = []
    for founder, email in zip(founders, emails):
        if email:
            founder['email'] = email
            valid_contacts.append(founder)
            
    return valid_contacts
