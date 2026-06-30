import urllib.request, json, urllib.parse
def get_domain(query):
    url = f"https://autocomplete.clearbit.com/v1/companies/suggest?query={urllib.parse.quote(query)}"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as res:
            data = json.loads(res.read().decode())
            if data: return data[0]['domain']
    except Exception as e: print(e)
    return None

print('Sequoia:', get_domain('Sequoia Capital'))
print('Y Combinator:', get_domain('Y Combinator'))
print('A16Z:', get_domain('Andreessen Horowitz'))
