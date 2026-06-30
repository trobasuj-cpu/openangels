import urllib.request, urllib.parse, re
url = 'https://html.duckduckgo.com/html/?q=' + urllib.parse.quote('site:kaggle.com/datasets crunchbase investor_name')
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    html = urllib.request.urlopen(req).read().decode('utf-8')
    for match in re.findall(r'href="([^"]+kaggle\.com/datasets/[^"]+)"', html):
        if 'duckduckgo' in match:
            u = urllib.parse.parse_qs(urllib.parse.urlparse(match).query).get('uddg')
            if u: print(u[0])
        else:
            print(match)
except Exception as e:
    print('Error', e)
