import os
import json
import urllib.request
from collections import defaultdict
from dotenv import load_dotenv

load_dotenv('frontend/.env')
SUPABASE_URL = 'https://rjdewjyhtbfkujhvkwig.supabase.co'
SUPABASE_KEY = os.environ.get('VITE_SUPABASE_ANON_KEY')

categories = [
    "adtech", "agriculture", "agritech", "agtech", "ai", "analytics", "api", "ar-vr", "automation", "autonomous", "b2b", "banking", "beauty", "biotech", "bootstrapped", "brands", "climate", "cloud", "collaboration", "communication", "community", "computer-vision", "consumer", "creator-economy", "crypto", "customer-success", "data", "deep-tech", "deeptech", "defense", "defi", "design", "developer-tools", "e-commerce", "edtech", "education", "emerging-markets", "energy", "enterprise", "entertainment", "ev", "femtech", "fintech", "food", "foodtech", "future-of-work", "gaming", "genomics", "govtech", "grocery", "hardware", "health", "hospitality", "hr-tech", "identity", "impact", "infrastructure", "insurance", "insurtech", "iot", "legal-tech", "legaltech", "local-commerce", "logistics", "longevity", "machine-learning", "manufacturing", "marketing-tech", "marketplace", "media", "messaging", "mobile", "mobility", "music", "nft", "no-code", "open-source", "payments", "pharma", "privacy", "productivity", "proptech", "quantum", "real-estate", "regtech", "robotics", "saas", "safety", "sales-tech", "security", "semiconductor", "smart-city", "social", "software", "space", "sports", "supply-chain", "sustainability", "technology", "transportation", "travel", "vertical-saas", "web3"
]

def fetch_all_investors():
    all_data = []
    limit = 1000
    offset = 0
    while True:
        url = f"{SUPABASE_URL}/rest/v1/investors?select=industries,bio&limit={limit}&offset={offset}"
        req = urllib.request.Request(url, headers={'apikey': SUPABASE_KEY, 'Authorization': f'Bearer {SUPABASE_KEY}'})
        try:
            with urllib.request.urlopen(req) as res:
                data = json.loads(res.read())
                if not data:
                    break
                all_data.extend(data)
                offset += limit
        except Exception as e:
            print("Error fetching:", e)
            break
    return all_data

def main():
    investors = fetch_all_investors()
    print(f"Fetched {len(investors)} total investors.")
    
    category_counts = defaultdict(int)
    
    for inv in investors:
        # Get explicitly assigned industries
        ind1 = inv.get('industry') or []
        ind2 = inv.get('industries') or []
        
        if isinstance(ind1, str):
            ind1 = [i.strip() for i in ind1.split(',')]
        if isinstance(ind2, str):
            ind2 = [i.strip() for i in ind2.split(',')]
            
        assigned = set([i.lower() for i in ind1 + ind2])
        
        # Check against our official list
        matched = set()
        for cat in categories:
            if cat in assigned:
                matched.add(cat)
            else:
                # Also check bio text
                bio = (inv.get('bio') or "").lower()
                # Basic word matching
                padded_bio = f" {bio.replace(',', ' ').replace('.', ' ')} "
                if f" {cat} " in padded_bio or f" {cat.replace('-', ' ')} " in padded_bio:
                    matched.add(cat)
        
        for m in matched:
            category_counts[m] += 1
            
    # Prepare results
    result = []
    result.append("# 📊 Анализ категорий инвесторов (Аудит)")
    result.append(f"**Всего проанализировано контактов:** {len(investors)}\n")
    
    result.append("## 🟢 Хорошее покрытие (> 50 контактов)")
    result.append("| Категория | Контактов |")
    result.append("|-----------|-----------|")
    good_cats = sorted([(cat, category_counts[cat]) for cat in categories if category_counts[cat] >= 50], key=lambda x: x[1], reverse=True)
    for cat, count in good_cats:
        result.append(f"| {cat} | {count} |")
        
    result.append("\n## 🟡 Среднее покрытие (10 - 49 контактов)")
    result.append("| Категория | Контактов |")
    result.append("|-----------|-----------|")
    mid_cats = sorted([(cat, category_counts[cat]) for cat in categories if 10 <= category_counts[cat] < 50], key=lambda x: x[1], reverse=True)
    for cat, count in mid_cats:
        result.append(f"| {cat} | {count} |")
        
    result.append("\n## 🔴 Критическая нехватка (< 10 контактов)")
    result.append("| Категория | Контактов |")
    result.append("|-----------|-----------|")
    bad_cats = sorted([(cat, category_counts[cat]) for cat in categories if category_counts[cat] < 10], key=lambda x: x[1])
    for cat, count in bad_cats:
        result.append(f"| {cat} | {count} |")
        
    with open("C:/Users/User/.gemini/antigravity/brain/39257401-10ee-48e8-be0c-960b66750f6f/audit_results.md", "w", encoding="utf-8") as f:
        f.write("\n".join(result))
        
    print("Audit saved to audit_results.md")

if __name__ == "__main__":
    main()
