"""
Source Trust Engine v1.0
OpenAngels Data Intelligence Platform — DAY 3 Implementation
Context-Aware Multi-Tier Source Reliability & Conflict Resolution Engine

Philosophy:
A source tier is NEVER an absolute scalar truth. Sources possess different 
fitness and epistemic weight for different claims (e.g. an official company 
website is supreme for product description, but SEC filings and financial press 
are far superior for round valuation and independent financial claims).
"""

import os
import sys
import re
from urllib.parse import urlparse
from typing import Dict, List, Tuple, Any, Optional, Set
from difflib import SequenceMatcher

# Force stdout to utf-8 on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# ============================================================================
# 1. TIER DEFINITIONS & DOMAIN REGISTRIES
# ============================================================================

TIER_1_GOVERNMENT_REGISTRIES = {
    'sec.gov', 'edgar.sec.gov', 'companieshouse.gov.uk', 'gov.uk',
    'inpi.fr', 'handelsregister.de', 'overheid.nl', 'asic.gov.au'
}

TIER_1_TIER1_VC_DOMAINS = {
    'a16z.com', 'sequoiacap.com', 'foundersfund.com', 'benchmark.com',
    'ycombinator.com', 'accel.com', 'greylock.com', 'kleinerperkins.com',
    'bvp.com', 'bessemer.com', 'lightspeedvp.com', 'indexventures.com',
    'generalcatalyst.com', 'khoslaventures.com', 'matrixpartners.com',
    'nea.com', 'insightpartners.com', 'usv.com', 'craftventures.com'
}

TIER_2_MAJOR_MEDIA = {
    'techcrunch.com', 'bloomberg.com', 'reuters.com', 'ft.com', 'wsj.com',
    'forbes.com', 'sifted.eu', 'theinformation.com', 'axios.com',
    'cnbc.com', 'fortune.com', 'wired.com', 'businessinsider.com'
}

TIER_2_DATABASES = {
    'pitchbook.com', 'crunchbase.com', 'dealroom.co', 'cbinsights.com'
}

TIER_3_INDUSTRY_MEDIA = {
    'eu-startups.com', 'tech.eu', 'pulse2.com', 'inc42.com', 'venturebeat.com',
    'startupdaily.net', 'latamlist.com', 'arcticstartup.com', 'finsmes.com',
    'geekwire.com', 'betakit.com', 'disrupt-africa.com'
}

TIER_3_PROFESSIONAL_PLATFORMS = {
    'linkedin.com', 'x.com', 'twitter.com', 'angellist.com', 'wellfound.com', 'signal.nfx.com'
}

TIER_4_UNVERIFIED_SOCIAL = {
    'reddit.com', 'quora.com', 'news.ycombinator.com', 'facebook.com',
    'instagram.com', 'threads.net', 'tiktok.com', 'discord.com', 'telegram.org'
}

# Base Tier Credibility Multipliers (Baseline when unadjusted by claim type)
BASE_TIER_SCORES = {
    'tier_1': 1.00,  # Official primary source / Government registry
    'tier_2': 0.88,  # Major reputable press / Recognized database
    'tier_3': 0.74,  # Industry niche press / Professional profile
    'tier_4': 0.45   # Social community / Aggregator / Unverified
}

# ============================================================================
# 2. CONTEXTUAL CLAIM-TO-SOURCE FITNESS MATRIX
# ============================================================================
# Format: CLAIM_FITNESS_MATRIX[claim_type][tier_or_subtype] = fitness_coefficient (0.0 to 1.0)

CLAIM_FITNESS_MATRIX = {
    # 1. Product Description / Stack / Mission
    'product_description': {
        'tier_1_official_company': 1.00,  # Supreme: company defines its own product
        'tier_1_investor_announcement': 0.90,
        'tier_1_gov_registry': 0.70,      # Too formal / legalistic
        'tier_2_major_media': 0.85,
        'tier_2_recognized_db': 0.80,
        'tier_3_industry_pub': 0.75,
        'tier_3_professional_profile': 0.80,
        'tier_4_social_aggregator': 0.40
    },

    # 2. Round Amount & Post-Money Valuation
    'round_amount_valuation': {
        'tier_1_gov_registry': 1.00,          # Supreme: legal penalty under perjury (SEC Form D)
        'tier_2_major_media': 0.92,           # High: Bloomberg / TechCrunch investigative verification
        'tier_2_recognized_db': 0.85,         # High: PitchBook confirmed data
        'tier_1_investor_announcement': 0.85, # Good: Lead VC announcement
        'tier_1_official_company': 0.70,      # Flawed: PR often inflates valuation or hides debt
        'tier_3_industry_pub': 0.70,
        'tier_3_professional_profile': 0.65,
        'tier_4_social_aggregator': 0.25      # High hallucination / rumor risk
    },

    # 3. Investor Role & Current Venture Firm
    'investor_role_fund': {
        'tier_1_investor_announcement': 1.00, # Supreme: Fund's team page / a16z.com
        'tier_3_professional_profile': 0.96,  # Supreme: Personal LinkedIn vanity / in / slug
        'tier_2_major_media': 0.90,
        'tier_1_gov_registry': 0.85,
        'tier_2_recognized_db': 0.80,
        'tier_3_industry_pub': 0.75,
        'tier_4_social_aggregator': 0.40
    },

    # 4. Contact Deliverability (Direct Email, Vanity Social)
    'contact_deliverability': {
        'tier_1_direct_smtp': 1.00,           # Supreme: Direct MX / SMTP protocol handshake
        'tier_3_professional_profile': 0.95,  # Verified personal vanity link
        'tier_1_official_company': 0.85,      # Domain match e.g. @firm.com
        'tier_2_recognized_db': 0.65,         # Often stale or generic mailboxes
        'tier_2_major_media': 0.50,           # Rare to find direct emails
        'tier_3_industry_pub': 0.50,
        'tier_4_social_aggregator': 0.20      # High spam / scrape decay
    },

    # 5. Check Size & Investment Stage
    'check_size_stage': {
        'tier_1_investor_announcement': 1.00, # Supreme: VC stating their explicit check size
        'tier_2_major_media': 0.80,           # Deduced from round lead participation
        'tier_2_recognized_db': 0.80,
        'tier_1_gov_registry': 0.60,          # Does not break down individual checks
        'tier_3_industry_pub': 0.70,
        'tier_4_social_aggregator': 0.35
    },

    # 6. Co-Investor Syndicate Network
    'co_investor_network': {
        'tier_1_gov_registry': 1.00,          # SEC joint signatories
        'tier_2_major_media': 0.95,           # TechCrunch deal participant lists
        'tier_1_investor_announcement': 0.90,
        'tier_2_recognized_db': 0.88,
        'tier_3_professional_profile': 0.80,  # Portfolio overlap calculations
        'tier_3_industry_pub': 0.75,
        'tier_4_social_aggregator': 0.30
    }
}


# ============================================================================
# 3. SOURCE CLASSIFIER & TIER IDENTIFIER
# ============================================================================

def clean_domain(url_or_domain: str) -> str:
    """Extracts normalized hostname without www or subpaths."""
    if not url_or_domain:
        return ""
    text = url_or_domain.strip().lower()
    if '://' in text:
        try:
            text = urlparse(text).netloc
        except Exception:
            pass
    text = text.split('/')[0].split(':')[0]
    if text.startswith('www.'):
        text = text[4:]
    return text

def classify_source_category(source_url: str, source_name: str = "") -> Tuple[str, str]:
    """
    Categorizes a source into (base_tier, specific_subtype).
    Returns:
      base_tier: 'tier_1', 'tier_2', 'tier_3', or 'tier_4'
      subtype: e.g. 'tier_1_gov_registry', 'tier_2_major_media', etc.
    """
    domain = clean_domain(source_url)
    name_low = (source_name or '').lower()
    url_low = (source_url or '').lower()

    # 1. Government / Legal Registries (Tier 1)
    if (any(gov in domain for gov in TIER_1_GOVERNMENT_REGISTRIES) 
        or 'sec form d' in name_low or 'edgar' in name_low or 'companies house' in name_low or domain.endswith('.gov') or domain.endswith('.mil')):
        return 'tier_1', 'tier_1_gov_registry'

    # 2. Known Tier 1 VC Funds / Official Investor Announcement (Tier 1)
    if domain in TIER_1_TIER1_VC_DOMAINS or any(vc in domain for vc in TIER_1_TIER1_VC_DOMAINS) or 'investor announcement' in name_low:
        return 'tier_1', 'tier_1_investor_announcement'

    # 3. Official Company Domain / PR / Corporate Site (Tier 1)
    if (any(k in name_low for k in ['official', 'press', 'pr release', 'corporate', 'company website'])
        or any(k in url_low for k in ['/press', '/newsroom', '/announcements'])
        or 'startup.com' in domain):
        return 'tier_1', 'tier_1_official_company'

    # 4. Major Reputable Venture / Financial Media (Tier 2)
    if domain in TIER_2_MAJOR_MEDIA or any(med in domain for med in TIER_2_MAJOR_MEDIA):
        return 'tier_2', 'tier_2_major_media'

    # 5. Recognized Databases (Tier 2)
    if domain in TIER_2_DATABASES or any(db in domain for db in TIER_2_DATABASES):
        return 'tier_2', 'tier_2_recognized_db'

    # 6. Industry Niche Media (Tier 3)
    if domain in TIER_3_INDUSTRY_MEDIA or any(ind in domain for ind in TIER_3_INDUSTRY_MEDIA):
        return 'tier_3', 'tier_3_industry_pub'

    # 7. Professional Personal Profiles (Tier 3)
    if any(p in domain for p in TIER_3_PROFESSIONAL_PLATFORMS) or 'linkedin.com' in url_low or 'x.com' in url_low or 'twitter.com' in url_low:
        return 'tier_3', 'tier_3_professional_profile'

    # 8. Unverified Social / Community Aggregators (Tier 4)
    if domain in TIER_4_UNVERIFIED_SOCIAL or any(soc in domain for soc in TIER_4_UNVERIFIED_SOCIAL) or any(k in name_low for k in ['reddit', 'forum', 'aggregator', 'rumor', 'scraper']):
        return 'tier_4', 'tier_4_social_aggregator'

    # Default heuristic
    if domain.endswith('.edu'):
        return 'tier_2', 'tier_2_major_media'

    # Unknown / Unverified Web Source
    return 'tier_4', 'tier_4_social_aggregator'


# ============================================================================
# 4. CONTEXT-AWARE TRUST SCORER
# ============================================================================

def calculate_source_trust_score(
    source_url: str,
    claim_type: str,
    source_name: str = "",
    is_direct_smtp: bool = False,
    domain_reputation: float = 1.0
) -> Dict[str, Any]:
    """
    Calculates the exact context-aware trust score for an individual source assertion.
    
    Returns a dict with:
      - trust_score: float (0.00 to 1.00)
      - base_tier: str ('tier_1'..'tier_4')
      - subtype: str
      - fitness_weight: float
      - rationale: str
    """
    # Special bypass for direct SMTP socket handshake
    if is_direct_smtp or source_name == "OSINT Direct Mailbox":
        return {
            "trust_score": 0.98,
            "base_tier": "tier_1",
            "subtype": "tier_1_direct_smtp",
            "fitness_weight": 1.00,
            "rationale": "Direct SMTP socket handshake confirmed mailbox deliverability."
        }

    base_tier, subtype = classify_source_category(source_url, source_name)
    base_score = BASE_TIER_SCORES.get(base_tier, 0.50)

    # Lookup Claim Fitness Weight
    fitness_map = CLAIM_FITNESS_MATRIX.get(claim_type, {})
    fitness_weight = fitness_map.get(subtype)

    if fitness_weight is None:
        # Fallback to generic tier mapping if subtype is not explicitly mapped
        for k, v in fitness_map.items():
            if k.startswith(base_tier):
                fitness_weight = v
                break
    
    if fitness_weight is None:
        fitness_weight = base_score

    # Compute Final Adjusted Trust Score
    # Balanced formulation: 50% base source reputation + 50% claim contextual fitness
    adjusted_score = (base_score * 0.40) + (fitness_weight * 0.60)
    final_score = round(min(1.00, max(0.10, adjusted_score * domain_reputation)), 3)

    rationale = (
        f"Base: {base_tier.upper()} ({base_score:.2f}) × "
        f"Claim Fitness for '{claim_type}': {fitness_weight:.2f} -> "
        f"Adjusted Trust: {final_score:.2f}"
    )

    return {
        "trust_score": final_score,
        "base_tier": base_tier,
        "subtype": subtype,
        "fitness_weight": round(fitness_weight, 2),
        "rationale": rationale
    }


# ============================================================================
# 5. MULTI-SOURCE WEIGHTED CONSENSUS & CONFLICT RESOLUTION
# ============================================================================

def resolve_multi_source_consensus(
    claim_type: str,
    assertions: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Evaluates competing claims from multiple sources using weighted trust scores.
    Instead of simple head-counting (which can be manipulated by spam aggregators),
    the value with the highest cumulative epistemic trust weight wins.

    Input assertions structure:
      [
        {"source_name": "...", "source_url": "...", "value": "$5M", "is_direct_smtp": False},
        {"source_name": "...", "source_url": "...", "value": "$4.5M", ...}
      ]

    Returns:
      - canonical_value: winning value
      - total_weight: sum of weights
      - winning_weight: weight of the winner
      - agreement_ratio: weighted confidence (0.0 to 1.0)
      - status: 'VERIFIED', 'PROBABLE', or 'CONFLICT_DETECTED'
      - conflicts: list of dissenting claims with their trust scores
    """
    if not assertions:
        return {
            "canonical_value": None,
            "agreement_ratio": 0.0,
            "status": "UNVERIFIED",
            "conflicts": []
        }

    scored_assertions = []
    value_weights: Dict[str, float] = {}
    value_original_casing: Dict[str, Any] = {}
    value_sources: Dict[str, List[Dict[str, Any]]] = {}

    for item in assertions:
        val = item.get('value')
        if val is None:
            continue
        norm_key = str(val).strip().lower()
        value_original_casing[norm_key] = val

        score_res = calculate_source_trust_score(
            source_url=item.get('source_url', ''),
            claim_type=claim_type,
            source_name=item.get('source_name', ''),
            is_direct_smtp=item.get('is_direct_smtp', False)
        )

        t_score = score_res['trust_score']
        scored_assertions.append({
            "source_name": item.get('source_name'),
            "source_url": item.get('source_url'),
            "value": val,
            "trust_info": score_res
        })

        value_weights[norm_key] = value_weights.get(norm_key, 0.0) + t_score
        value_sources.setdefault(norm_key, []).append(score_res)

    if not value_weights:
        return {
            "canonical_value": None,
            "agreement_ratio": 0.0,
            "status": "UNVERIFIED",
            "conflicts": []
        }

    total_weight = sum(value_weights.values())
    winning_key, winning_weight = max(value_weights.items(), key=lambda x: x[1])
    canonical_value = value_original_casing[winning_key]

    weighted_ratio = round(winning_weight / total_weight, 3) if total_weight > 0 else 1.0

    # Build Conflict Registry for dissenting sources
    conflicts = []
    for k, w in value_weights.items():
        if k != winning_key:
            conflicts.append({
                "conflicting_value": value_original_casing[k],
                "conflicting_weight": round(w, 2),
                "winner_value": canonical_value,
                "winner_weight": round(winning_weight, 2),
                "reason": f"Dissenting assertion '{value_original_casing[k]}' (Trust Weight {w:.2f}) was outvoted by consensus '{canonical_value}' (Trust Weight {winning_weight:.2f})."
            })

    if weighted_ratio >= 0.70 and winning_weight >= 1.2:
        status = "VERIFIED"
        confidence = min(0.99, round(0.75 + (weighted_ratio * 0.20), 2))
    elif conflicts and weighted_ratio < 0.60:
        status = "CONFLICT_DETECTED"
        confidence = round(weighted_ratio, 2)
    else:
        status = "PROBABLE"
        confidence = round(max(0.70, min(0.90, weighted_ratio * 0.95)), 2)

    return {
        "canonical_value": canonical_value,
        "weighted_agreement_ratio": weighted_ratio,
        "total_epistemic_weight": round(total_weight, 2),
        "winning_weight": round(winning_weight, 2),
        "confidence": confidence,
        "verification_status": status,
        "conflicts": conflicts,
        "detailed_assertions": scored_assertions
    }


# ============================================================================
# 6. SELF-TEST RUNNER (Unit & Edge Case Validation)
# ============================================================================

if __name__ == '__main__':
    print("=== Testing Source Trust Engine v1.0 ===")

    # Scenario 1: Product Description Fitness
    # Official Website (Tier 1) vs Major Media (Tier 2)
    s1_official = calculate_source_trust_score(
        source_url="https://openai.com", 
        claim_type="product_description", 
        source_name="OpenAI Official Site"
    )
    s1_press = calculate_source_trust_score(
        source_url="https://techcrunch.com", 
        claim_type="product_description", 
        source_name="TechCrunch"
    )
    print("\nScenario 1: Product Description (Official Company Site vs Media):")
    print(f"  Official Site: {s1_official['trust_score']} (Fitness: {s1_official['fitness_weight']})")
    print(f"  TechCrunch:    {s1_press['trust_score']} (Fitness: {s1_press['fitness_weight']})")
    assert s1_official['trust_score'] > s1_press['trust_score'], "Official company site MUST outrank press for product description!"

    # Scenario 2: Round Valuation Fitness
    # SEC Form D (Tier 1 Gov) vs Company PR (Tier 1 PR) vs Reddit (Tier 4)
    s2_sec = calculate_source_trust_score(
        source_url="https://www.sec.gov/edgar/searchedgar/companysearch", 
        claim_type="round_amount_valuation", 
        source_name="SEC EDGAR Form D"
    )
    s2_pr = calculate_source_trust_score(
        source_url="https://startup.com/press", 
        claim_type="round_amount_valuation", 
        source_name="Startup PR Release"
    )
    s2_reddit = calculate_source_trust_score(
        source_url="https://reddit.com/r/startups", 
        claim_type="round_amount_valuation", 
        source_name="Reddit Rumor"
    )
    print("\nScenario 2: Round Valuation (SEC Form D vs Company PR vs Reddit):")
    print(f"  SEC Form D: {s2_sec['trust_score']} (Fitness: {s2_sec['fitness_weight']})")
    print(f"  Company PR: {s2_pr['trust_score']} (Fitness: {s2_pr['fitness_weight']})")
    print(f"  Reddit:     {s2_reddit['trust_score']} (Fitness: {s2_reddit['fitness_weight']})")
    assert s2_sec['trust_score'] > s2_pr['trust_score'] > s2_reddit['trust_score'], "SEC MUST outrank Company PR for valuation!"

    # Scenario 3: Multi-Source Weighted Consensus Resolution
    # TechCrunch ($10M) + SEC ($10M) vs 3 Unverified Scrapers ($8M each)
    # Headcount: 2 votes for $10M, 3 votes for $8M.
    # Simple count would FAIL ($8M wins). Epistemic Trust Consensus MUST pick $10M!
    assertions_test = [
        {"source_name": "SEC Form D", "source_url": "https://sec.gov/filing", "value": "$10M"},
        {"source_name": "TechCrunch", "source_url": "https://techcrunch.com/article", "value": "$10M"},
        {"source_name": "Scraper A", "source_url": "https://random-aggregator.xyz/deal", "value": "$8M"},
        {"source_name": "Scraper B", "source_url": "https://directory-clone.top/deal", "value": "$8M"},
        {"source_name": "Reddit Post", "source_url": "https://reddit.com/r/venture", "value": "$8M"}
    ]
    consensus = resolve_multi_source_consensus(
        claim_type="round_amount_valuation",
        assertions=assertions_test
    )
    print("\nScenario 3: Multi-Source Consensus (2 High-Trust Sources vs 3 Low-Trust Aggregators):")
    print(f"  Canonical Value: {consensus['canonical_value']}")
    print(f"  Confidence:      {consensus['confidence']}")
    print(f"  Status:          {consensus['verification_status']}")
    print(f"  Winning Weight:  {consensus['winning_weight']} vs Competing Weight: {consensus['conflicts'][0]['conflicting_weight']}")
    assert consensus['canonical_value'] == "$10M", "High-trust sources MUST defeat headcount of low-trust aggregators!"

    print("\n=== All Source Trust Engine Tests Passed 100% Successfully ===")
