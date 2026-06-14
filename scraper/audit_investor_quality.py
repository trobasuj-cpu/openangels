# -*- coding: utf-8 -*-
"""
OpenAngels - investor database quality audit.

Reads Supabase investors and creates:
  - quality summary in terminal
  - review queue CSV for manual/semi-automated enrichment

Safe by default: this script does not write to Supabase.
"""

from __future__ import annotations

import argparse
import csv
import os
import re
import sys
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timezone

from dotenv import load_dotenv
from supabase import create_client


if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


REVIEW_FIELDS = [
    "priority_rank",
    "quality_score",
    "priority_reason",
    "missing_fields",
    "name",
    "type",
    "country",
    "location",
    "bio",
    "current_linkedin",
    "current_email",
    "current_twitter",
    "current_website",
    "current_portfolio",
    "linkedin_query",
    "source_query",
    "email_query",
    "linkedin_to_fill",
    "email_to_fill",
    "website_to_fill",
    "twitter_to_fill",
    "source_url",
    "review_status",
    "notes",
    "id",
]

IMPORTANT_COMPANIES = {
    "Y Combinator",
    "Sequoia",
    "a16z",
    "Andreessen Horowitz",
    "Founders Fund",
    "Benchmark",
    "Greylock",
    "Kleiner Perkins",
    "Accel",
    "Index Ventures",
    "Bessemer",
    "General Catalyst",
    "First Round",
    "Union Square Ventures",
    "SV Angel",
    "Techstars",
    "500 Global",
}


@dataclass
class QualityResult:
    score: int
    missing: list[str]
    priority_reason: str


def clean_text(value: object) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def has_value(row: dict, field: str) -> bool:
    return row.get(field) not in (None, "", [])


def mentions_important_company(row: dict) -> bool:
    text = f"{row.get('name') or ''} {row.get('bio') or ''} {row.get('website') or ''}".lower()
    return any(company.lower() in text for company in IMPORTANT_COMPANIES)


def is_high_priority(row: dict) -> tuple[bool, str]:
    name = row.get("name") or ""
    type_ = row.get("type") or ""
    bio = row.get("bio") or ""
    check_max = row.get("check_max") or 0

    if type_ == "accelerator":
        return True, "accelerator"
    if mentions_important_company(row):
        return True, "top_firm_or_brand"
    if check_max >= 10_000_000:
        return True, "large_check_size"
    if any(word in bio.lower() for word in ("founder", "co-founder", "partner", "general partner")):
        return True, "operator_or_partner"
    if name in {"Paul Graham", "Sam Altman", "Marc Andreessen", "Peter Thiel", "Reid Hoffman"}:
        return True, "famous_investor"
    return False, "standard"


def quality_score(row: dict) -> QualityResult:
    score = 0
    missing: list[str] = []

    checks = [
        ("bio", 10),
        ("location", 5),
        ("country", 5),
        ("type", 5),
        ("check_min", 5),
        ("check_max", 5),
        ("stages", 10),
        ("industries", 10),
        ("portfolio", 10),
        ("twitter_url", 10),
        ("website", 10),
        ("linkedin_url", 15),
        ("email", 10),
    ]

    for field, points in checks:
        if has_value(row, field):
            score += points
        else:
            missing.append(field)

    if row.get("verified") is True:
        score += 5
    else:
        missing.append("verified")

    if has_value(row, "linkedin_source") or has_value(row, "email_source"):
        score += 5
    else:
        missing.append("contact_source")

    priority, reason = is_high_priority(row)
    if priority and ("linkedin_url" in missing or "website" in missing or "email" in missing):
        reason = f"{reason}: important but missing contact data"

    return QualityResult(score=min(score, 100), missing=missing, priority_reason=reason)


def portfolio_text(row: dict) -> str:
    portfolio = row.get("portfolio")
    if isinstance(portfolio, list):
        return ", ".join(str(item) for item in portfolio[:8])
    return clean_text(portfolio)


def review_priority(row: dict, result: QualityResult) -> tuple[int, int, str]:
    high_priority, reason = is_high_priority(row)
    missing_linkedin = not has_value(row, "linkedin_url")
    missing_website = not has_value(row, "website")
    missing_email = not has_value(row, "email")
    missing_source = not has_value(row, "linkedin_source") and not has_value(row, "email_source")

    priority = 0
    if high_priority:
        priority += 1000
    if missing_linkedin:
        priority += 400
    if missing_website:
        priority += 150
    if missing_email:
        priority += 75
    if missing_source:
        priority += 50
    if row.get("type") == "accelerator":
        priority += 100
    if row.get("twitter_url"):
        priority += 25

    # Lower quality score should rise inside similar priority buckets.
    priority += max(0, 100 - result.score)
    return -priority, result.score, reason


def build_review_row(rank: int, row: dict, result: QualityResult) -> dict:
    name = row.get("name") or ""
    bio = clean_text(row.get("bio"))
    company_hint = ""
    at_match = re.search(r"\bat\s+([A-Z][A-Za-z0-9&\- ]{2,50}?)(?:[.,]|$)", bio)
    if at_match:
        company_hint = at_match.group(1).strip()

    linkedin_query = f'site:linkedin.com/in "{name}" investor'
    if company_hint:
        linkedin_query = f'site:linkedin.com/in "{name}" "{company_hint}"'
    elif row.get("type") in ("vc", "accelerator"):
        linkedin_query = f'site:linkedin.com/company "{name}"'

    source_query = f'"{name}" investor official'
    if company_hint:
        source_query = f'"{name}" "{company_hint}" investor'

    return {
        "priority_rank": rank,
        "quality_score": result.score,
        "priority_reason": result.priority_reason,
        "missing_fields": ", ".join(result.missing),
        "name": name,
        "type": row.get("type") or "",
        "country": row.get("country") or "",
        "location": row.get("location") or "",
        "bio": bio,
        "current_linkedin": row.get("linkedin_url") or "",
        "current_email": row.get("email") or "",
        "current_twitter": row.get("twitter_url") or "",
        "current_website": row.get("website") or "",
        "current_portfolio": portfolio_text(row),
        "linkedin_query": linkedin_query,
        "source_query": source_query,
        "email_query": f'"{name}" email investor',
        "linkedin_to_fill": "",
        "email_to_fill": "",
        "website_to_fill": "",
        "twitter_to_fill": "",
        "source_url": "",
        "review_status": "",
        "notes": "",
        "id": row.get("id") or "",
    }


def fetch_all_investors(supabase) -> list[dict]:
    rows: list[dict] = []
    start = 0
    while True:
        batch = supabase.table("investors").select("*").range(start, start + 999).execute().data
        rows.extend(batch or [])
        if len(batch or []) < 1000:
            break
        start += 1000
    return rows


def print_summary(rows: list[dict], scored: list[tuple[dict, QualityResult]]) -> None:
    total = len(rows)
    print(f"TOTAL investors: {total}")
    for field in ("linkedin_url", "email", "website", "twitter_url", "portfolio"):
        filled = sum(1 for row in rows if has_value(row, field))
        pct = (filled / total * 100) if total else 0
        print(f"{field}: {filled}/{total} ({pct:.1f}%)")

    print(f"types: {Counter(row.get('type') for row in rows)}")
    print(f"countries top 10: {Counter(row.get('country') for row in rows).most_common(10)}")

    buckets = Counter()
    for _, result in scored:
        if result.score >= 80:
            buckets["80-100"] += 1
        elif result.score >= 60:
            buckets["60-79"] += 1
        elif result.score >= 40:
            buckets["40-59"] += 1
        else:
            buckets["0-39"] += 1
    print(f"quality buckets: {dict(buckets)}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--top", type=int, default=200)
    parser.add_argument("--out", default="")
    args = parser.parse_args()

    load_dotenv("scraper/.env")
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    if not supabase_url or not supabase_key:
        print("ERROR: Missing SUPABASE_URL or SUPABASE_KEY in scraper/.env")
        return 1

    supabase = create_client(supabase_url, supabase_key)
    rows = fetch_all_investors(supabase)
    scored = [(row, quality_score(row)) for row in rows]
    scored.sort(key=lambda item: review_priority(item[0], item[1]))

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    out_path = args.out or f"scraper/review_queue_top_{args.top}_{stamp}.csv"

    with open(out_path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=REVIEW_FIELDS)
        writer.writeheader()
        for rank, (row, result) in enumerate(scored[: args.top], start=1):
            writer.writerow(build_review_row(rank, row, result))

    print_summary(rows, scored)
    print(f"Review queue written: {out_path}")
    print("Top 20 review queue:")
    for rank, (row, result) in enumerate(scored[:20], start=1):
        print(f"{rank:>2}. {row.get('name')} | score={result.score} | missing={', '.join(result.missing[:5])}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
