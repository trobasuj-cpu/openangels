with open('investors_batch6.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the > that should be : after check_max
fixed = content.replace('"check_max">', '"check_max":')
count = content.count('"check_max">')

with open('investors_batch6.py', 'w', encoding='utf-8') as f:
    f.write(fixed)

print(f"Fixed {count} occurrences of check_max>")
