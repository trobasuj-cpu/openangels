import urllib.request, urllib.parse, re
url = 'https://html.duckduckgo.com/html/?q=' + urllib.parse.quote('filetype:csv crunchbase investments.csv github')
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    for match in re.findall(r'href="([^"]+\.csv)"', html):
        print(match)
except Exception as e:
    print('Error:', e)
