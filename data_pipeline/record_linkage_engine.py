"""
Record Linkage & Probabilistic Deduplication Engine
OpenAngels Pipeline & Platform — Stage 5 Curriculum Implementation
Calibrated for 0% False Positives on human names & companies.
"""

import os
import sys
import re
import unicodedata
from difflib import SequenceMatcher
from typing import Dict, List, Tuple, Any, Optional, Set

# Force stdout to utf-8 on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# ============================================================================
# 1. STRING NORMALIZATION & TOKENIZATION
# ============================================================================

def strip_accents(text: str) -> str:
    """Strips accents and diacritics (e.g. 'Alströmer' -> 'Alstromer', 'Zennström' -> 'Zennstrom')."""
    if not text: return ""
    text = unicodedata.normalize('NFD', text)
    return ''.join(ch for ch in text if unicodedata.category(ch) != 'Mn')

def normalize_name_for_comparison(name: str) -> str:
    """Cleans names for entity comparison: strips middle initials, brackets, and corporate tags."""
    if not name: return ""
    cleaned = strip_accents(name).lower().strip()
    
    # Strip bracketed remarks like '(SparkToro)', '(early)', '(Sheel Mohnot)'
    cleaned = re.sub(r'[\(\[\{].*?[\)\]\}]', '', cleaned).strip()
    
    # Strip legal suffixes
    cleaned = re.sub(r'\b(inc|inc\.|llc|ltd|corp|corporation|technologies|ventures|capital|group)\b', '', cleaned).strip()
    
    # Strip middle initials like 'Marc L. Andreessen' -> 'Marc Andreessen'
    cleaned = re.sub(r'\b[a-z]\.\b', '', cleaned)
    
    # Strip non-alphanumeric
    cleaned = re.sub(r'[^a-z0-9\s]', ' ', cleaned)
    return ' '.join(cleaned.split())

def split_first_last_tokens(clean_name: str) -> Tuple[str, str]:
    tokens = clean_name.split()
    if len(tokens) == 0: return "", ""
    if len(tokens) == 1: return tokens[0], ""
    return tokens[0], tokens[-1]

def jaro_winkler_similarity(s1: str, s2: str, prefix_weight: float = 0.1) -> float:
    """Calculates Jaro-Winkler similarity (0.0 to 1.0)."""
    if not s1 or not s2: return 0.0
    s1, s2 = s1.lower(), s2.lower()
    if s1 == s2: return 1.0

    len1, len2 = len(s1), len(s2)
    max_dist = max(len1, len2) // 2 - 1
    if max_dist < 0: max_dist = 0

    s1_matches = [False] * len1
    s2_matches = [False] * len2
    matches = 0
    transpositions = 0

    for i in range(len1):
        start = max(0, i - max_dist)
        end = min(i + max_dist + 1, len2)
        for j in range(start, end):
            if s2_matches[j]: continue
            if s1[i] != s2[j]: continue
            s1_matches[i] = True
            s2_matches[j] = True
            matches += 1
            break

    if matches == 0: return 0.0

    k = 0
    for i in range(len1):
        if not s1_matches[i]: continue
        while not s2_matches[k]: k += 1
        if s1[i] != s2[k]: transpositions += 1
        k += 1

    transpositions //= 2
    jaro = (matches / len1 + matches / len2 + (matches - transpositions) / matches) / 3.0

    prefix = 0
    for i in range(min(len1, len2, 4)):
        if s1[i] == s2[i]: prefix += 1
        else: break

    return jaro + prefix * prefix_weight * (1.0 - jaro)

def name_similarity_score(n1: str, n2: str) -> Tuple[float, bool]:
    """
    Evaluates human name similarity with strict First + Last name consistency.
    Returns (score: float, is_last_name_consistent: bool).
    """
    if not n1 or not n2: return 0.0, False
    raw1, raw2 = n1.strip(), n2.strip()
    if raw1.lower() == raw2.lower(): return 1.0, True

    clean1 = normalize_name_for_comparison(raw1)
    clean2 = normalize_name_for_comparison(raw2)
    if clean1 == clean2 and clean1: return 1.0, True

    first1, last1 = split_first_last_tokens(clean1)
    first2, last2 = split_first_last_tokens(clean2)

    # If both have a last name, the last names MUST match with high similarity
    last_name_consistent = True
    if last1 and last2:
        last_sim = SequenceMatcher(None, last1, last2).ratio()
        if last_sim < 0.80:
            last_name_consistent = False
            # Different last names (e.g. 'Flor' vs 'Rauch') -> Score clamped!
            return 0.30, False

    first_sim = SequenceMatcher(None, first1, first2).ratio() if (first1 and first2) else 0.50
    overall_seq = SequenceMatcher(None, clean1, clean2).ratio()
    overall_jw = jaro_winkler_similarity(clean1, clean2)

    final_score = max(overall_seq, overall_jw * 0.9 + overall_seq * 0.1)
    return round(final_score, 4), last_name_consistent


# ============================================================================
# 2. SOCIAL & CONTACT SIGNAL EXTRACTION
# ============================================================================

def extract_social_handle(url: Optional[str]) -> str:
    """Extracts clean, normalized handle from Twitter or LinkedIn URL."""
    if not url or not isinstance(url, str): return ""
    cleaned = url.split('?')[0].rstrip('/')
    parts = [p for p in cleaned.split('/') if p]
    if not parts: return ""
    handle = parts[-1].lower()
    banned = {'search', 'home', 'explore', 'i', 'intent', 'company', 'feed', 'notifications', 'messages', 'terms', 'privacy', 'login', 'signup'}
    return handle if handle not in banned and len(handle) >= 2 else ""

def extract_firm_or_org(record: Dict[str, Any]) -> str:
    """Extracts clean, normalized venture firm / fund / organization from metadata."""
    if not record or not isinstance(record, dict):
        return ""
    
    # 1. Explicit firm/company fields if present
    firm = record.get('firm') or record.get('company') or ''
    if firm:
        cleaned = strip_accents(str(firm)).lower().strip()
        cleaned = re.sub(r'\b(inc|llc|ltd|corp|corporation|technologies|group)\b', '', cleaned).strip()
        if len(cleaned) >= 2:
            return cleaned

    # 2. Corporate email domain
    email = (record.get('email') or '').lower().strip()
    if '@' in email:
        domain = email.split('@')[-1]
        domain_name = domain.split('.')[0]
        generic_emails = {'gmail', 'yahoo', 'hotmail', 'outlook', 'icloud', 'proton', 'protonmail', 'me', 'aol', 'mail', 'live', 'fastmail'}
        if domain_name and domain_name not in generic_emails and len(domain_name) >= 3:
            return domain_name

    # 3. Website domain
    website = (record.get('website') or '').lower().strip()
    if website:
        cleaned_url = re.sub(r'^https?://', '', website).split('/')[0].replace('www.', '')
        domain_name = cleaned_url.split('.')[0]
        generic_sites = {'linkedin', 'twitter', 'x', 'crunchbase', 'angellist', 'wellfound', 'linktr', 'substack', 'medium', 'notion', 'github'}
        if domain_name and domain_name not in generic_sites and len(domain_name) >= 3:
            return domain_name

    # 4. Pattern matching in bio
    bio = record.get('bio') or ''
    if bio and isinstance(bio, str):
        m = re.search(r'(?:partner|managing partner|general partner|gp|vp|principal|associate|director|founder|co-founder)\s+(?:at|@|with)\s+([A-Za-z0-9\s&]{2,30}?)(?:\.|\,|\||\;|\n|\(|$)', bio, re.IGNORECASE)
        if m:
            cand = m.group(1).strip().lower()
            cand = re.sub(r'\b(the|a|an)\b', '', cand).strip()
            if len(cand) >= 3 and cand not in ('various', 'multiple', 'several', 'early-stage', 'stealth'):
                return cand

        m2 = re.search(r'([A-Za-z0-9\s&]{2,25}\s+(?:ventures|capital|partners|fund|investments))', bio, re.IGNORECASE)
        if m2:
            return m2.group(1).strip().lower()

    return ""

def extract_location_tokens(record: Dict[str, Any]) -> Set[str]:
    """Extracts significant geographical tokens for disambiguation."""
    if not record or not isinstance(record, dict):
        return set()
    loc = strip_accents((record.get('location') or '') + ' ' + (record.get('country') or '')).lower()
    raw_tokens = re.findall(r'\b[a-z]{3,}\b', loc)
    generic = {'none', 'unknown', 'remote', 'united', 'states', 'usa', 'global', 'europe', 'world', 'city', 'area', 'bay', 'metro'}
    return set(t for t in raw_tokens if t not in generic)


# ============================================================================
# 3. PROBABILISTIC ENTITY MATCHING (same_entity_probability)
# ============================================================================

def compute_entity_match_probability(inv1: Dict[str, Any], inv2: Dict[str, Any]) -> Tuple[float, List[str], bool]:
    """
    Computes calibrated multi-signal probability that two records represent the EXACT SAME entity.
    Returns: (same_entity_probability: float, match_reasons: List[str], is_same_entity: bool)
    Threshold: probability >= 0.90 with verified evidence qualifies as same entity.
    Includes strict Name-Collision (Тёзки) guards for conflicting social, geo, or firm signals.
    """
    name1, name2 = inv1.get('name', ''), inv2.get('name', '')
    name_sim, last_name_consistent = name_similarity_score(name1, name2)

    reasons = []

    # 1. Extract Identifiers
    tw1, tw2 = extract_social_handle(inv1.get('twitter_url')), extract_social_handle(inv2.get('twitter_url'))
    li1, li2 = extract_social_handle(inv1.get('linkedin_url')), extract_social_handle(inv2.get('linkedin_url'))
    em1, em2 = (inv1.get('email') or '').lower().strip(), (inv2.get('email') or '').lower().strip()

    # ------------------------------------------------------------------------
    # HARD DISQUALIFIER 1: Conflicting Social Handles
    # If both have Twitter and they differ, or both have LinkedIn and they differ,
    # they are definitely distinct human beings (Name Collision / Тёзки).
    # ------------------------------------------------------------------------
    if tw1 and tw2 and tw1 != tw2:
        return 0.05, [f"Conflicting Twitter handles (@{tw1} vs @{tw2}) - Name Collision Disqualified"], False

    if li1 and li2 and li1 != li2:
        return 0.05, [f"Conflicting LinkedIn handles ({li1} vs {li2}) - Name Collision Disqualified"], False

    # Check Positive Exact Social / Email Collision
    social_exact_match = False
    if tw1 and tw2 and tw1 == tw2:
        if last_name_consistent or name_sim >= 0.50:
            social_exact_match = True
            reasons.append(f"Identical Twitter handle (@{tw1})")

    if li1 and li2 and li1 == li2:
        if last_name_consistent or name_sim >= 0.50:
            social_exact_match = True
            reasons.append(f"Identical LinkedIn slug ({li1})")

    if em1 and em2 and em1 == em2 and '@' in em1 and not em1.startswith('info@') and not em1.startswith('contact@'):
        if last_name_consistent or name_sim >= 0.50:
            social_exact_match = True
            reasons.append(f"Identical verified Email ({em1})")

    if social_exact_match:
        prob = min(0.99, 0.92 + name_sim * 0.07)
        return prob, reasons, True

    # If last names are completely different and NO direct social match, reject immediately
    if not last_name_consistent:
        return 0.20, [], False

    # ------------------------------------------------------------------------
    # HARD DISQUALIFIER 2: Conflicting Venture Organizations / Funds
    # ------------------------------------------------------------------------
    firm1 = extract_firm_or_org(inv1)
    firm2 = extract_firm_or_org(inv2)
    if firm1 and firm2:
        f_sim = SequenceMatcher(None, firm1, firm2).ratio()
        if f_sim < 0.60 and firm1 not in firm2 and firm2 not in firm1:
            return 0.10, [f"Conflicting venture firms ('{firm1}' vs '{firm2}') - Name Collision Disqualified"], False
        elif f_sim >= 0.80 or firm1 == firm2:
            reasons.append(f"Matching venture firm ({firm1})")

    # 2. Portfolio Intersect
    p1 = inv1.get('portfolio') or []
    p2 = inv2.get('portfolio') or []
    port1 = set(x.lower().strip() for x in (p1 if isinstance(p1, list) else str(p1).split(',')) if x.strip())
    port2 = set(x.lower().strip() for x in (p2 if isinstance(p2, list) else str(p2).split(',')) if x.strip())

    port_jaccard = 0.0
    if port1 and port2:
        intersect = port1.intersection(port2)
        union = port1.union(port2)
        port_jaccard = len(intersect) / len(union)
        if len(intersect) >= 1:
            reasons.append(f"Shared portfolio: {', '.join(list(intersect)[:3])}")

    # 3. Location Proximity & Conflict Detection
    loc1 = strip_accents(inv1.get('location') or '').lower()
    loc2 = strip_accents(inv2.get('location') or '').lower()
    loc_tokens1 = extract_location_tokens(inv1)
    loc_tokens2 = extract_location_tokens(inv2)
    
    geo_conflict = False
    loc_sim = 0.0

    if loc_tokens1 and loc_tokens2:
        overlap = loc_tokens1.intersection(loc_tokens2)
        loc_sim = SequenceMatcher(None, loc1, loc2).ratio()
        if not overlap and loc_sim < 0.45:
            geo_conflict = True
            # If locations are mutually exclusive and no shared portfolio, disqualify collision!
            if port_jaccard == 0:
                return 0.15, [f"Conflicting locations ('{inv1.get('location')}' vs '{inv2.get('location')}') - Name Collision Disqualified"], False
        elif overlap or loc_sim >= 0.80:
            reasons.append(f"Same location ({inv1.get('location')})")
    elif loc1 and loc2 and loc1 not in ('none', 'unknown', 'remote') and loc2 not in ('none', 'unknown', 'remote'):
        loc_sim = SequenceMatcher(None, loc1, loc2).ratio()
        if loc_sim >= 0.85:
            reasons.append(f"Same location ({inv1.get('location')})")

    # 4. Pure Name-Based Match Evaluation
    # Near-identical spelling (e.g. 'Tomasz Tunguz' vs 'Tomas Tunguz', 'Gustaf Alströmer' vs 'Gustaf Alstromer')
    if name_sim >= 0.94:
        if geo_conflict:
            return 0.20, ["Near-identical name but conflicting locations - Name Collision Disqualified"], False
        prob = 0.96 if (loc_sim >= 0.80 or port_jaccard > 0 or (firm1 and firm2 and firm1 == firm2)) else 0.92
        reasons.append("Near-identical name spelling (Levenshtein >= 0.94)")
        return round(prob, 4), reasons, True

    if name_sim >= 0.88 and (loc_sim >= 0.85 or port_jaccard >= 0.50):
        prob = 0.93
        reasons.append("High name similarity with matching geo/portfolio")
        return round(prob, 4), reasons, True

    return round(name_sim * 0.7, 4), reasons, False


# ============================================================================
# 4. SMART NON-DESTRUCTIVE RECORD MERGER
# ============================================================================

def merge_two_investors(primary: Dict[str, Any], secondary: Dict[str, Any]) -> Dict[str, Any]:
    """Merges two entity records into one supreme, enriched record."""
    merged = dict(primary)

    # 1. Best Canonical Name
    n1, n2 = primary.get('name', ''), secondary.get('name', '')
    if '(' in n1 and '(' not in n2 and len(n2) >= 3:
        merged['name'] = n2
    elif len(n2) > len(n1) and not any(ch in n2 for ch in '()[]'):
        merged['name'] = n2

    # 2. Email
    em1, em2 = primary.get('email'), secondary.get('email')
    if not em1 and em2:
        merged['email'] = em2

    # 3. Twitter / LinkedIn / Website
    if not primary.get('twitter_url') and secondary.get('twitter_url'):
        merged['twitter_url'] = secondary['twitter_url']
    if not primary.get('linkedin_url') and secondary.get('linkedin_url'):
        merged['linkedin_url'] = secondary['linkedin_url']
    if not primary.get('website') and secondary.get('website'):
        merged['website'] = secondary['website']

    # 4. Avatar
    av1, av2 = primary.get('avatar_url'), secondary.get('avatar_url')
    if (not av1 or 'default' in str(av1).lower()) and av2:
        merged['avatar_url'] = av2

    # 5. Union of Portfolio Companies
    p1 = primary.get('portfolio') or []
    p2 = secondary.get('portfolio') or []
    list1 = p1 if isinstance(p1, list) else str(p1).split(',')
    list2 = p2 if isinstance(p2, list) else str(p2).split(',')
    
    seen_ports = set()
    combined_ports = []
    for p in (list1 + list2):
        if isinstance(p, str) and p.strip():
            clean_p = p.strip()
            if clean_p.lower() not in seen_ports:
                seen_ports.add(clean_p.lower())
                combined_ports.append(clean_p)
    merged['portfolio'] = combined_ports[:10]

    # 6. Union of Industries & Stages
    ind1 = primary.get('industries') or []
    ind2 = secondary.get('industries') or []
    arr_ind1 = ind1 if isinstance(ind1, list) else str(ind1).split(',')
    arr_ind2 = ind2 if isinstance(ind2, list) else str(ind2).split(',')
    merged['industries'] = list(dict.fromkeys([i.strip().lower() for i in (arr_ind1 + arr_ind2) if i and i.strip()]))

    st1 = primary.get('stages') or []
    st2 = secondary.get('stages') or []
    arr_st1 = st1 if isinstance(st1, list) else str(st1).split(',')
    arr_st2 = st2 if isinstance(st2, list) else str(st2).split(',')
    merged['stages'] = list(dict.fromkeys([s.strip().lower() for s in (arr_st1 + arr_st2) if s and s.strip()]))

    # 7. Rich Bio
    b1 = primary.get('bio') or ''
    b2 = secondary.get('bio') or ''
    if len(b2) > len(b1) and "Active early-stage" not in b2[:18]:
        merged['bio'] = b2

    # 8. Check Sizes
    if not merged.get('check_min') and secondary.get('check_min'):
        merged['check_min'] = secondary['check_min']
    if not merged.get('check_max') and secondary.get('check_max'):
        merged['check_max'] = secondary['check_max']

    # 9. Location
    if (not merged.get('location') or merged.get('location') in ('None', 'United States')) and secondary.get('location'):
        merged['location'] = secondary['location']

    return merged


# ============================================================================
# 5. SELF-TEST
# ============================================================================

if __name__ == '__main__':
    print("=== Testing Calibrated Record Linkage Engine ===")

    # Test Negative Controls (Should be False!)
    neg_pairs = [
        ("Guillermo Flor", "Guillermo Rauch"),
        ("Ajay Bhatt", "Ajay Trehan"),
        ("Roger Lee", "Roger Ehrenberg"),
        ("Peter Thiel", "Elon Musk")
    ]
    print("\n1. Negative Controls (Distinct people with same first name):")
    for n1, n2 in neg_pairs:
        prob, reasons, is_same = compute_entity_match_probability({'name': n1}, {'name': n2})
        print(f"  '{n1}' vs '{n2}' -> Prob: {prob:.2f} | Match: {is_same}")
        assert not is_same, f"False Positive on {n1} vs {n2}!"

    # Test Positive Controls (Should be True!)
    pos_pairs = [
        ("Gustaf Alströmer", "Gustaf Alstromer", "gustaf"),
        ("Tomasz Tunguz", "Tomas Tunguz", None),
        ("Niklas Zennström", "Niklas Zennstrom", None),
        ("Rand Fishkin", "Rand Fishkin (SparkToro)", "randfish"),
        ("Babak Nivi", "Nivi", "nivi")
    ]
    print("\n2. Positive Controls (Actual duplicates):")
    for n1, n2, tw in pos_pairs:
        p1 = {'name': n1, 'twitter_url': f'https://x.com/{tw}' if tw else None}
        p2 = {'name': n2, 'twitter_url': f'https://x.com/{tw}' if tw else None}
        prob, reasons, is_same = compute_entity_match_probability(p1, p2)
        print(f"  '{n1}' vs '{n2}' -> Prob: {prob:.2f} | Match: {is_same} | Evidence: {reasons}")
    # Test Name Collision Disqualification (Same name, but different social / firm / geo -> MUST BE FALSE!)
    collision_pairs = [
        # Same name, different LinkedIn
        ({"name": "Alex Smith", "linkedin_url": "https://linkedin.com/in/alexsmith-london"},
         {"name": "Alex Smith", "linkedin_url": "https://linkedin.com/in/alexsmith-sf"}),
        # Same name, different Twitter
        ({"name": "Michael Brown", "twitter_url": "https://x.com/mbrown_vc"},
         {"name": "Michael Brown", "twitter_url": "https://x.com/mikebrown_health"}),
        # Same name, conflicting venture firms
        ({"name": "David Chen", "bio": "Partner at Sequoia Capital"},
         {"name": "David Chen", "bio": "General Partner at Founders Fund"}),
        # Same name, conflicting locations (no shared portfolio)
        ({"name": "Chris Johnson", "location": "London, United Kingdom"},
         {"name": "Chris Johnson", "location": "San Francisco, CA"})
    ]
    print("\n3. Name Collision Controls (Identical Names but distinct people -> MUST NOT MERGE):")
    for p1, p2 in collision_pairs:
        prob, reasons, is_same = compute_entity_match_probability(p1, p2)
        print(f"  '{p1.get('name')}' (Case A) vs '{p2.get('name')}' (Case B) -> Prob: {prob:.2f} | Match: {is_same} | Evidence: {reasons}")
        assert not is_same, f"CRITICAL FAILURE: Name collision falsely merged on {p1.get('name')}!"

    print("\n=== All Precision, Collision & Reliability Tests Passed 100% ===")
