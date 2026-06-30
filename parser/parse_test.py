import re, json, html as htmlmod

raw = open('debug_yc_page.html', 'r', encoding='utf-8').read()

# Данные закодированы через &quot; - декодируем
decoded = htmlmod.unescape(raw)

# Ищем паттерн founders JSON array
match = re.search(r'"founders":\s*(\[.*?\])\s*[,}]', decoded)
if match:
    founders_json = match.group(1)
    founders = json.loads(founders_json)
    for f in founders:
        keys_to_show = ['full_name', 'title', 'linkedin_url', 'twitter_url']
        print(json.dumps({k: f[k] for k in keys_to_show if k in f}, indent=2))
else:
    print('Pattern not found')
    idx = decoded.find('"founders"')
    if idx > 0:
        chunk = decoded[idx:idx+500]
        print(f'Raw: {chunk[:400]}')
