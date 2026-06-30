import urllib.request, urllib.parse, json, re
url = 'https://html.duckduckgo.com/html/?q=' + urllib.parse.quote('filetype:csv "angel investor" OR "venture capital" github')
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    res = urllib.request.urlopen(req)
    html = res.read().decode('utf-8')
    links = re.findall(r'href="([^"]+)"', html)
    for link in links:
        if '.csv' in link.lower() and 'http' in link:
            print('Found CSV:', link)
except Exception as e:
    print('Error:', e)
