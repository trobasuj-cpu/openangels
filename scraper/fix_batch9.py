with open('investors_batch9.py', 'r', encoding='utf-8') as f:
    content = f.read()
fixed = content.replace('"check_max">', '"check_max":')
count = content.count('"check_max">')
with open('investors_batch9.py', 'w', encoding='utf-8') as f:
    f.write(fixed)
print(f"Fixed {count} occurrences")
