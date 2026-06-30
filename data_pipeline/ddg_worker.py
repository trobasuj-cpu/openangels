import sys
import json
from ddgs import DDGS

def main():
    if len(sys.argv) < 2:
        print("[]")
        return
    query = sys.argv[1]
    try:
        res = list(DDGS().text(query, max_results=3))
        print(json.dumps(res))
    except Exception:
        print("[]")

if __name__ == "__main__":
    main()
