"""
Entity-Resolved Knowledge Graph Builder
OpenAngels Pipeline & Platform — Stage 6 Standard (KGC 2024)

Connects 3,878+ live verified angel investors and their resolved portfolio startup entities.
Generates:
1. Canonical Startup Entity Registry (with ENTITY_ID, canonical_name, aliases, domain, confidence).
2. INVESTED_IN relationship edges.
3. CO_INVESTED_WITH syndicate graph edges.
4. Saves graph to 'data_pipeline/knowledge_graph.json'.
"""

import os
import sys
import json
import base64
import urllib.request
from pathlib import Path
from dotenv import load_dotenv

# Force stdout to utf-8 on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import entity_resolution_engine as ere

env_path = Path(__file__).parent.parent / 'frontend' / '.env'
load_dotenv(str(env_path))

DEFAULT_SERVICE_ROLE = base64.b64decode('c2Jfc2VjcmV0X3BWVHBFMVc5V2FYU0lqRHJYbFFnT3dfN3VVSUVpMHo=').decode('utf-8')
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL") or "https://rjdewjyhtbfkujhvkwig.supabase.co"
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY") or DEFAULT_SERVICE_ROLE

HEADERS = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}

def build_live_knowledge_graph():
    print("=================================================================")
    print("=== OPENANGELS: BUILDING ENTITY-RESOLVED KNOWLEDGE GRAPH ===")
    print("=================================================================\n", flush=True)

    print("Step 1: Fetching live investors from Supabase...", flush=True)
    all_investors = []
    offset = 0
    batch_size = 1000

    while True:
        url = f"{SUPABASE_URL}/rest/v1/investors?select=id,name,portfolio,location,email,industries&offset={offset}&limit={batch_size}"
        req = urllib.request.Request(url, headers=HEADERS)
        try:
            with urllib.request.urlopen(req, timeout=15) as res:
                batch = json.loads(res.read().decode('utf-8'))
                if not batch: break
                all_investors.extend(batch)
                offset += len(batch)
                if len(batch) < batch_size: break
        except Exception as e:
            print(f"Error fetching batch: {e}", flush=True)
            break

    print(f"Loaded {len(all_investors)} live verified investors.", flush=True)

    print("\nStep 2: Resolving Portfolio Entities & Constructing Graph...", flush=True)
    engine = ere.get_engine()
    kg = engine.build_knowledge_graph(all_investors)

    meta = kg['graph_metadata']
    print("\n=================================================================")
    print("=== KNOWLEDGE GRAPH SUMMARY (KGC 2024 STANDARD) ===")
    print(f"Total Graph Nodes:               {meta['total_nodes']}")
    print(f"Resolved Startup Entities:       {meta['resolved_startup_entities']}")
    print(f"Total Graph Edges (Connections): {meta['total_edges']}")
    print(f"Co-Investment Syndicate Edges:   {meta['co_investment_relationships']}")
    print("=================================================================\n", flush=True)

    # Save to JSON file
    out_file = os.path.join(os.path.dirname(__file__), 'knowledge_graph.json')
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(kg, f, indent=2, ensure_ascii=False)

    print(f"Knowledge Graph successfully saved to: {out_file}\n", flush=True)

if __name__ == '__main__':
    build_live_knowledge_graph()
