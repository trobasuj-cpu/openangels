import re, json, html as htmlmod

raw = open('debug_yc_page.html', 'r', encoding='utf-8').read()
decoded = htmlmod.unescape(raw)

# Ищем все поля с url/website в JSON
pattern = r'"(\w*(?:url|website|site|href)\w*)":\s*"([^"]{5,80})"'
for match in re.finditer(pattern, decoded, re.IGNORECASE):
    key = match.group(1)
    val = match.group(2)
    if 's3.' not in val and 'bookface' not in val and 'avatar' not in val:
        print(f'{key}: {val}')

print("\n--- Looking for company website specifically ---")
# Ищем паттерн "website":"..."
website_match = re.search(r'"website":\s*"([^"]+)"', decoded)
if website_match:
    print(f'website field: {website_match.group(1)}')

# Ищем "company_url" или подобное
for key in ['company_url', 'url', 'website', 'homepage', 'site_url']:
    m = re.search(f'"{key}":\\s*"([^"]+)"', decoded)
    if m:
        print(f'{key}: {m.group(1)}')
