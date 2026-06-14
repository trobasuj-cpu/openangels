# -*- coding: utf-8 -*-
"""
OpenAngels - public contact enrichment.

Goal:
  Build a launch-quality review report for investor LinkedIn URLs and emails
  from public web signals before writing anything to Supabase.

Default mode is safe:
  python scraper/enrich_public_contacts.py --limit 50

Skip already-reviewed leading rows:
  python scraper/enrich_public_contacts.py --limit 50 --offset 50

Apply high-confidence matches only:
  python scraper/enrich_public_contacts.py --limit 50 --apply --min-confidence 0.85

Apply high-confidence matches from an existing report without rescanning:
  python scraper/enrich_public_contacts.py --from-report scraper/contact_enrichment_report.csv --apply

Notes:
  - LinkedIn discovery checks public company/fund pages first.
  - Add --use-search to query public search result pages. Keep limits modest.
  - Email discovery is limited to public websites/team/contact/about pages.
  - The script writes a CSV report for manual review on every run.
"""

from __future__ import annotations

import argparse
import csv
import os
import re
import sys
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from html import unescape
from typing import Iterable
from urllib.parse import quote_plus, urljoin, urlparse

import requests
from dotenv import load_dotenv
from supabase import create_client


if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

REPORT_FIELDS = [
    "id",
    "name",
    "type",
    "country",
    "company_hint",
    "domain",
    "linkedin_candidate",
    "linkedin_confidence",
    "linkedin_source",
    "email_candidate",
    "email_confidence",
    "email_source",
    "action",
    "notes",
]

EMAIL_RE = re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.I)
LINKEDIN_RE = re.compile(r"https?://(?:[a-z]{2,3}\.)?linkedin\.com/(?:in|company)/[A-Za-z0-9_\-%.]+/?", re.I)

GENERIC_EMAIL_PREFIXES = {
    "info",
    "hello",
    "contact",
    "support",
    "press",
    "media",
    "careers",
    "jobs",
    "admin",
    "team",
    "privacy",
    "legal",
    "sales",
}

DOMAIN_MAP = {
    "Y Combinator": "ycombinator.com",
    "Sequoia": "sequoiacap.com",
    "Andreessen Horowitz": "a16z.com",
    "a16z": "a16z.com",
    "Kleiner Perkins": "kleinerperkins.com",
    "Accel": "accel.com",
    "Index Ventures": "indexventures.com",
    "Bessemer": "bvp.com",
    "Greylock": "greylock.com",
    "General Catalyst": "generalcatalyst.com",
    "Benchmark": "benchmark.com",
    "GV": "gv.com",
    "Google Ventures": "gv.com",
    "True Ventures": "trueventures.com",
    "Foundry Group": "foundrygroup.com",
    "Homebrew": "homebrew.co",
    "First Round": "firstround.com",
    "Spark Capital": "sparkcapital.com",
    "Union Square Ventures": "usv.com",
    "USV": "usv.com",
    "Techstars": "techstars.com",
    "500 Global": "500.co",
    "Atomico": "atomico.com",
    "Northzone": "northzone.com",
    "Seedcamp": "seedcamp.com",
    "Balderton": "balderton.com",
    "Earlybird": "earlybird.com",
    "Point Nine": "pointninecap.com",
    "Creandum": "creandum.com",
    "LocalGlobe": "localglobe.vc",
    "Partech": "partechpartners.com",
    "Kima Ventures": "kimaventures.com",
    "Upfront Ventures": "upfront.com",
    "Forerunner": "forerunnerventures.com",
    "Cowboy Ventures": "cowboy.vc",
    "SV Angel": "svangel.com",
    "Haystack": "haystack.vc",
    "Precursor": "precursorvc.com",
    "Pear VC": "pear.vc",
    "Blackbird": "blackbird.vc",
    "NEA": "nea.com",
    "Lightspeed": "lsvp.com",
    "IVP": "ivp.com",
    "Matrix Partners": "matrixpartners.com",
    "Social Capital": "socialcapital.com",
    "Revolution": "revolution.com",
    "Founders Fund": "foundersfund.com",
    "Khosla": "khoslaventures.com",
    "General Atlantic": "generalatlantic.com",
    "Tiger Global": "tigerglobal.com",
    "Coatue": "coatue.com",
    "Stripe": "stripe.com",
    "Shopify": "shopify.com",
    "GitHub": "github.com",
    "Canva": "canva.com",
    "Figma": "figma.com",
    "Notion": "notion.so",
    "Webflow": "webflow.com",
    "Zapier": "zapier.com",
    "Twilio": "twilio.com",
    "Slack": "slack.com",
    "Zoom": "zoom.us",
    "HubSpot": "hubspot.com",
    "Salesforce": "salesforce.com",
    "OpenAI": "openai.com",
    "Airbnb": "airbnb.com",
    "DoorDash": "doordash.com",
    "Uber": "uber.com",
    "Google": "google.com",
    "Microsoft": "microsoft.com",
    "Meta": "meta.com",
    "LinkedIn": "linkedin.com",
    "Coinbase": "coinbase.com",
    "PayPal": "paypal.com",
    "Brex": "brex.com",
    "Plaid": "plaid.com",
    "Wise": "wise.com",
    "Klarna": "klarna.com",
    "Adyen": "adyen.com",
    "Grab": "grab.com",
    "Gojek": "gojek.com",
    "Flipkart": "flipkart.com",
    "Freshworks": "freshworks.com",
    "Zoho": "zoho.com",
}


@dataclass
class ContactCandidate:
    value: str = ""
    confidence: float = 0.0
    source: str = ""
    notes: str = ""


def clean_text(value: str | None) -> str:
    return re.sub(r"\s+", " ", value or "").strip()


def safe_name(value: str) -> str:
    return value.encode("ascii", "replace").decode("ascii")


def normalized_domain(url_or_domain: str | None) -> str:
    if not url_or_domain:
        return ""
    value = url_or_domain.strip()
    if not value.startswith(("http://", "https://")):
        value = f"https://{value}"
    host = urlparse(value).netloc.lower()
    return host.removeprefix("www.")


def company_in_text(company: str, text: str) -> bool:
    if not company or not text:
        return False
    pattern = rf"(?<![A-Za-z0-9]){re.escape(company.lower())}(?![A-Za-z0-9])"
    return re.search(pattern, text.lower()) is not None


def extract_company_hint(row: dict) -> str:
    bio = row.get("bio") or ""
    if row.get("name") in DOMAIN_MAP:
        return row["name"]

    for company in sorted(DOMAIN_MAP, key=len, reverse=True):
        if company_in_text(company, bio):
            return company

    match = re.search(r"\bat\s+([A-Z][A-Za-z0-9&\- ]{2,50}?)(?:[.,]|$)", bio)
    if match:
        return match.group(1).strip(" .,-")

    website = normalized_domain(row.get("website"))
    if website:
        return website.split(".")[0]

    return ""


def infer_domain(row: dict, company_hint: str) -> str:
    if row.get("name") in DOMAIN_MAP:
        return DOMAIN_MAP[row["name"]]

    for company, domain in sorted(DOMAIN_MAP.items(), key=lambda item: len(item[0]), reverse=True):
        if company_in_text(company, company_hint) or company_in_text(company, row.get("bio") or ""):
            return domain

    website_domain = normalized_domain(row.get("website"))
    if website_domain and "linkedin.com" not in website_domain:
        return website_domain

    return ""


def first_last(name: str) -> tuple[str, str]:
    parts = [p for p in re.split(r"\s+", name.strip()) if p]
    if not parts:
        return "", ""
    return parts[0], parts[-1] if len(parts) > 1 else ""


def fetch(url: str, timeout: int = 8) -> str:
    try:
        res = requests.get(url, headers=HEADERS, timeout=timeout)
        if res.status_code == 200 and res.text:
            return res.text
    except requests.RequestException:
        return ""
    return ""


def duckduckgo_search(query: str, max_results: int = 5) -> list[tuple[str, str]]:
    url = f"https://duckduckgo.com/html/?q={quote_plus(query)}"
    html = fetch(url)
    if not html:
        return []

    results: list[tuple[str, str]] = []
    for match in re.finditer(r'class="result__a"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', html, re.I | re.S):
        href = unescape(re.sub(r"&amp;", "&", match.group(1)))
        title = clean_text(re.sub(r"<[^>]+>", " ", match.group(2)))
        results.append((href, title))
        if len(results) >= max_results:
            break
    return results


def find_linkedin_on_site(row: dict, domain: str) -> ContactCandidate:
    if not domain:
        return ContactCandidate(notes="no domain")

    name = row["name"]
    name_terms = [p.lower() for p in re.split(r"\s+", name) if len(p) > 1]
    best = ContactCandidate()

    for page_url in candidate_pages(domain):
        time.sleep(0.6)
        html = fetch(page_url)
        if not html:
            continue

        for match in LINKEDIN_RE.finditer(html):
            candidate = match.group(0).rstrip("/")
            start = max(0, match.start() - 500)
            end = min(len(html), match.end() + 500)
            window = clean_text(re.sub(r"<[^>]+>", " ", html[start:end])).lower()

            score = 0.45
            if name_terms:
                matched_terms = sum(1 for term in name_terms if term in window or term in candidate.lower())
                score += 0.45 * (matched_terms / len(name_terms))
            if row.get("type") in ("vc", "accelerator") and "/company/" in candidate:
                score += 0.1
            if row.get("type") == "angel" and "/company/" in candidate:
                score -= 0.25
            if "/in/" in candidate:
                slug = candidate.rstrip("/").split("/")[-1].lower()
                if name_terms and not any(term in slug for term in name_terms):
                    # Team pages often list many LinkedIn links close together.
                    # Do not trust nearby text if the profile slug is clearly another person.
                    score = min(score, 0.55)

            score = max(0.0, min(score, 0.98))
            if score > best.confidence:
                best = ContactCandidate(
                    value=candidate,
                    confidence=round(score, 2),
                    source=page_url,
                    notes="linkedin link found on public website",
                )

    return best


def find_linkedin(row: dict, company_hint: str, domain: str, use_search: bool = False) -> ContactCandidate:
    name = row["name"]
    type_ = row.get("type") or ""
    best = find_linkedin_on_site(row, domain)
    if best.confidence >= 0.9 or not use_search:
        return best

    queries = [
        f'site:linkedin.com/in "{name}" "{company_hint}"',
        f'site:linkedin.com/in "{name}" investor',
        f'site:linkedin.com/in "{name}" "{row.get("country") or ""}"',
    ]
    if type_ in ("vc", "accelerator") and len(name.split()) <= 3:
        queries.insert(0, f'site:linkedin.com/company "{name}"')

    name_terms = [p.lower() for p in re.split(r"\s+", name) if len(p) > 1]
    company_terms = [p.lower() for p in re.split(r"\W+", company_hint) if len(p) > 2]

    for query in queries:
        time.sleep(1.0)
        for url, title in duckduckgo_search(query):
            linkedin_match = LINKEDIN_RE.search(url) or LINKEDIN_RE.search(title)
            if not linkedin_match:
                continue

            candidate = linkedin_match.group(0).rstrip("/")
            haystack = f"{candidate} {title}".lower()
            score = 0.45

            matched_name_terms = sum(1 for term in name_terms if term in haystack)
            if name_terms:
                score += 0.35 * (matched_name_terms / len(name_terms))
            if company_terms and any(term in haystack for term in company_terms):
                score += 0.15
            if "/company/" in candidate and type_ in ("vc", "accelerator"):
                score += 0.15
            if "/company/" in candidate and type_ == "angel":
                score -= 0.25

            score = min(score, 0.98)
            if score > best.confidence:
                best = ContactCandidate(
                    value=candidate,
                    confidence=round(score, 2),
                    source=f"duckduckgo:{query}",
                    notes=f"title={title[:120]}",
                )

    return best


def candidate_pages(domain: str) -> Iterable[str]:
    base = f"https://{domain}"
    yield base
    for path in ("team", "people", "about", "partners"):
        yield urljoin(base, path)


def extract_public_email(row: dict, domain: str) -> ContactCandidate:
    if not domain:
        return ContactCandidate(notes="no domain")

    first, last = first_last(row["name"])
    if not first:
        return ContactCandidate(notes="cannot split name")

    expected_prefixes = {
        first.lower(),
        f"{first}.{last}".lower() if last else "",
        f"{first[0]}{last}".lower() if last else "",
        f"{first}{last[0]}".lower() if last else "",
    }
    expected_prefixes.discard("")

    best = ContactCandidate()
    for page_url in candidate_pages(domain):
        time.sleep(0.6)
        html = fetch(page_url)
        if not html:
            continue

        text = unescape(html)
        for email in sorted(set(EMAIL_RE.findall(text))):
            email = email.lower()
            prefix, email_domain = email.split("@", 1)
            if email_domain != domain:
                continue

            score = 0.45
            if prefix in expected_prefixes:
                score += 0.45
            elif first.lower() in prefix or (last and last.lower() in prefix):
                score += 0.25
            if prefix in GENERIC_EMAIL_PREFIXES:
                score -= 0.35

            local_window = text[max(0, text.lower().find(email) - 300): text.lower().find(email) + 300].lower()
            if row["name"].lower() in local_window:
                score += 0.15

            score = max(0.0, min(score, 0.98))
            if score > best.confidence:
                best = ContactCandidate(
                    value=email,
                    confidence=round(score, 2),
                    source=page_url,
                    notes="public website email",
                )

    return best


def load_rows(supabase, limit: int, offset: int = 0) -> list[dict]:
    rows = (
        supabase.table("investors")
        .select("id,name,bio,country,type,website,email,linkedin_url")
        .or_("email.is.null,linkedin_url.is.null")
        .order("verified", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
        .data
    )
    return rows or []


def try_update(supabase, row_id: str, payload: dict) -> None:
    try:
        supabase.table("investors").update(payload).eq("id", row_id).execute()
    except Exception as exc:
        # Fallback for databases where db/contact_enrichment.sql has not been run yet.
        slim = {k: v for k, v in payload.items() if k in {"email", "linkedin_url"}}
        if slim:
            supabase.table("investors").update(slim).eq("id", row_id).execute()
        print(f"  metadata update skipped for {row_id}: {str(exc)[:120]}")


def apply_from_report(supabase, report_path: str, min_confidence: float, exclude_names: set[str] | None = None) -> int:
    exclude_names = {name.lower().strip() for name in (exclude_names or set())}
    applied = 0
    with open(report_path, newline="", encoding="utf-8") as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            if row.get("action") != "review":
                continue
            if (row.get("name") or "").lower().strip() in exclude_names:
                continue

            linkedin_confidence = float(row.get("linkedin_confidence") or 0)
            email_confidence = float(row.get("email_confidence") or 0)
            payload = {}

            if row.get("linkedin_candidate") and linkedin_confidence >= min_confidence:
                payload.update(
                    {
                        "linkedin_url": row["linkedin_candidate"],
                        "linkedin_source": row.get("linkedin_source") or report_path,
                        "linkedin_confidence": linkedin_confidence,
                    }
                )
            if row.get("email_candidate") and email_confidence >= min_confidence:
                payload.update(
                    {
                        "email": row["email_candidate"],
                        "email_source": row.get("email_source") or report_path,
                        "email_confidence": email_confidence,
                    }
                )

            if not payload:
                continue

            payload.update(
                {
                    "contact_enriched_at": datetime.now(timezone.utc).isoformat(),
                    "contact_review_status": "auto",
                }
            )
            try_update(supabase, row["id"], payload)
            applied += 1

    return applied


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=25)
    parser.add_argument("--offset", type=int, default=0, help="skip this many matching investors before processing")
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--min-confidence", type=float, default=0.85)
    parser.add_argument("--report", default="")
    parser.add_argument("--from-report", default="", help="apply high-confidence rows from an existing CSV report")
    parser.add_argument("--exclude-name", action="append", default=[], help="skip a name when applying from report")
    parser.add_argument("--skip-linkedin", action="store_true")
    parser.add_argument("--skip-email", action="store_true")
    parser.add_argument("--use-search", action="store_true", help="also query public search pages after website checks")
    args = parser.parse_args()

    load_dotenv("scraper/.env")
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")
    if not supabase_url or not supabase_key:
        print("ERROR: Missing SUPABASE_URL or SUPABASE_KEY in scraper/.env")
        return 1

    supabase = create_client(supabase_url, supabase_key)
    if args.from_report:
        if not args.apply:
            print("ERROR: --from-report must be used with --apply")
            return 1
        applied = apply_from_report(supabase, args.from_report, args.min_confidence, set(args.exclude_name))
        print(f"Done. Applied rows from report: {applied}")
        return 0

    rows = load_rows(supabase, args.limit, args.offset)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    report_path = args.report or f"scraper/contact_enrichment_report_{stamp}.csv"

    print(f">>> Public contact enrichment: rows={len(rows)} offset={args.offset} apply={args.apply}")
    print(f">>> Report: {report_path}")

    applied = 0
    with open(report_path, "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=REPORT_FIELDS)
        writer.writeheader()

        for idx, row in enumerate(rows, start=1):
            name = row["name"]
            company_hint = extract_company_hint(row)
            domain = infer_domain(row, company_hint)
            print(f"[{idx}/{len(rows)}] {safe_name(name)} | hint={company_hint or '-'} | domain={domain or '-'}")

            linkedin = ContactCandidate(notes="skipped")
            email = ContactCandidate(notes="skipped")

            if not args.skip_linkedin and not row.get("linkedin_url"):
                linkedin = find_linkedin(row, company_hint, domain, use_search=args.use_search)
            if not args.skip_email and not row.get("email"):
                email = extract_public_email(row, domain)

            payload = {}
            if linkedin.value and linkedin.confidence >= args.min_confidence:
                payload.update(
                    {
                        "linkedin_url": linkedin.value,
                        "linkedin_source": linkedin.source,
                        "linkedin_confidence": linkedin.confidence,
                    }
                )
            if email.value and email.confidence >= args.min_confidence:
                payload.update(
                    {
                        "email": email.value,
                        "email_source": email.source,
                        "email_confidence": email.confidence,
                    }
                )
            if payload:
                payload.update(
                    {
                        "contact_enriched_at": datetime.now(timezone.utc).isoformat(),
                        "contact_review_status": "auto" if args.apply else "pending",
                    }
                )

            action = "apply" if args.apply and payload else "review" if payload else "none"
            if args.apply and payload:
                try_update(supabase, row["id"], payload)
                applied += 1

            writer.writerow(
                {
                    "id": row["id"],
                    "name": name,
                    "type": row.get("type") or "",
                    "country": row.get("country") or "",
                    "company_hint": company_hint,
                    "domain": domain,
                    "linkedin_candidate": linkedin.value,
                    "linkedin_confidence": linkedin.confidence,
                    "linkedin_source": linkedin.source,
                    "email_candidate": email.value,
                    "email_confidence": email.confidence,
                    "email_source": email.source,
                    "action": action,
                    "notes": " | ".join(n for n in (linkedin.notes, email.notes) if n),
                }
            )

    print(f"\nDone. Applied rows: {applied}")
    print(f"Review CSV: {report_path}")
    if not args.apply:
        print("Dry-run only. Re-run with --apply after reviewing high-confidence candidates.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
