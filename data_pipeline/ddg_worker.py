import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import search_rotation_engine as sre

def main():
    if len(sys.argv) < 2:
        print("[]")
        return
    query = sys.argv[1]
    try:
        res = sre.search_multi_provider(query, max_results=3)
        print(json.dumps(res))
    except Exception:
        print("[]")

if __name__ == "__main__":
    main()
