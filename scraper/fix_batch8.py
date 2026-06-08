with open('investors_batch8.py', 'r', encoding='utf-8') as f:
    content = f.read()
fixed = content.replace('"check_max">', '"check_max":')
# also fix broken twitter_url field
fixed = fixed.replace('"twitter_url":"https://twitter.com":"brianrequarth"', '"twitter_url":"https://twitter.com/brianrequarth"')
count = content.count('"check_max">')
with open('investors_batch8.py', 'w', encoding='utf-8') as f:
    f.write(fixed)
print(f"Fixed {count} occurrences")
