import json, os, urllib.request, re, ast
from dotenv import load_dotenv

load_dotenv('frontend/.env')
SUPABASE_URL = 'https://rjdewjyhtbfkujhvkwig.supabase.co'
SUPABASE_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY')

with open('C:/Users/User/.gemini/antigravity/brain/39257401-10ee-48e8-be0c-960b66750f6f/.system_generated/steps/1748/content.md', 'r', encoding='utf-8') as f:
    text = f.read()

# The Next.js data is pushed via self.__next_f.push([1,"...string..."])
# We can find all these script pushes and concatenate the strings
strings = []
for match in re.finditer(r'self\.__next_f\.push\(\[1,\s*(.*?)\s*\]\)', text):
    try:
        # ast.literal_eval will parse the JSON string literal into a Python string
        js_str = ast.literal_eval(match.group(1))
        strings.append(js_str)
    except Exception as e:
        pass

full_str = "".join(strings)
print("Extracted script string length:", len(full_str))

# Now full_str contains the concatenated unescaped string.
# We can easily search for "data":[{"id":
start = full_str.find('"data":[{')
if start != -1:
    end = full_str.find('}]}', start)
    if end != -1:
        json_str = '[{' + full_str[start+9:end+2]
        try:
            data = json.loads(json_str)
            print('Found investors:', len(data))
            
            inserts = []
            for d in data:
                min_check = 10000
                max_check = 50000
                cid = d.get('checksize_id')
                if cid == 2:
                    min_check, max_check = 1000, 10000
                elif cid == 3:
                    min_check, max_check = 10000, 25000
                elif cid == 4:
                    min_check, max_check = 25000, 50000
                elif cid == 5:
                    min_check, max_check = 50000, 100000
                elif cid == 6:
                    min_check, max_check = 100000, 500000

                investor = {
                    'name': d['name'],
                    'bio': (d.get('details') or '') + f" ({d.get('title', '')} at {d.get('company', '')})",
                    'location': 'San Francisco, CA',
                    'twitter_url': d.get('email') if d.get('email') and 'twitter' in d.get('email', '') else None,
                    'website': d.get('site'),
                    'avatar_url': d.get('twitterPicture'),
                    'type': 'angel',
                    'check_min': min_check,
                    'check_max': max_check,
                    'stages': ['pre-seed', 'seed'],
                    'industries': ['ai'],
                    'verified': True,
                    'active': True
                }
                inserts.append(investor)
            
            success = 0
            for inv in inserts:
                req = urllib.request.Request(
                    f"{SUPABASE_URL}/rest/v1/investors",
                    data=json.dumps([inv]).encode('utf-8'),
                    headers={
                        'apikey': SUPABASE_KEY,
                        'Authorization': f'Bearer {SUPABASE_KEY}',
                        'Content-Type': 'application/json',
                        'Prefer': 'return=minimal'
                    },
                    method='POST'
                )
                try:
                    urllib.request.urlopen(req)
                    success += 1
                except Exception as e:
                    pass
            print(f"Successfully inserted {success} out of {len(inserts)} investors into Supabase!")
        except Exception as e:
            print("Failed json parse:", e)
else:
    print('JSON data not found in HTML')
