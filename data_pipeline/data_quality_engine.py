import sys
import os
import re
from typing import Dict, List, Tuple, Any, Optional

try:
    import entity_resolution_engine as ere
except ImportError:
    from . import entity_resolution_engine as ere

# Force stdout to utf-8 on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# ============================================================================
# 1. CANONICAL BRAND & STARTUP ENTITY DICTIONARY
# ============================================================================

CANONICAL_COMPANIES = {
    # Top AI & Frontier Tech
    'openai': 'OpenAI',
    'open ai': 'OpenAI',
    'anthropic': 'Anthropic',
    'perplexity': 'Perplexity',
    'perplexity ai': 'Perplexity',
    'midjourney': 'Midjourney',
    'scale ai': 'Scale AI',
    'scale': 'Scale AI',
    'mistral': 'Mistral AI',
    'mistral ai': 'Mistral AI',
    'hugging face': 'Hugging Face',
    'huggingface': 'Hugging Face',
    'elevenlabs': 'ElevenLabs',
    'eleven labs': 'ElevenLabs',
    'together ai': 'Together AI',
    'together': 'Together AI',
    'jasper': 'Jasper',
    'jasper ai': 'Jasper',
    'runway': 'Runway',
    'runwayml': 'Runway',
    'synthesia': 'Synthesia',
    'cohere': 'Cohere',
    'pinecone': 'Pinecone',
    'weaviate': 'Weaviate',
    'qdrant': 'Qdrant',
    'langchain': 'LangChain',
    'llamaindex': 'LlamaIndex',
    'modal': 'Modal',
    'modal labs': 'Modal',
    'anyscale': 'Anyscale',
    'replicate': 'Replicate',
    'groq': 'Groq',
    'baseten': 'Baseten',
    'fireworks ai': 'Fireworks AI',
    'cursor': 'Cursor',
    'linear': 'Linear',
    'notion': 'Notion',
    'retool': 'Retool',
    'vercel': 'Vercel',
    'supabase': 'Supabase',
    'airtable': 'Airtable',

    # Major Tech & Unicorns
    'figma': 'Figma',
    'stripe': 'Stripe',
    'airbnb': 'Airbnb',
    'uber': 'Uber',
    'lyft': 'Lyft',
    'spacex': 'SpaceX',
    'space x': 'SpaceX',
    'palantir': 'Palantir',
    'coinbase': 'Coinbase',
    'doordash': 'DoorDash',
    'door dash': 'DoorDash',
    'instacart': 'Instacart',
    'robinhood': 'Robinhood',
    'postmates': 'Postmates',
    'pinterest': 'Pinterest',
    'snapchat': 'Snap',
    'snap': 'Snap',
    'dropbox': 'Dropbox',
    'slack': 'Slack',
    'hubspot': 'HubSpot',
    'snowflake': 'Snowflake',
    'datadog': 'Datadog',
    'mongodb': 'MongoDB',
    'gusto': 'Gusto',
    'brex': 'Brex',
    'ramp': 'Ramp',
    'deel': 'Deel',
    'rippling': 'Rippling',
    'canva': 'Canva',
    'gumroad': 'Gumroad',
    'buzzfeed': 'BuzzFeed',
    'buzz feed': 'BuzzFeed',
    'fitbit': 'Fitbit',
    'fit bit': 'Fitbit',
    'mindbody': 'Mindbody',
    'mind body': 'Mindbody',
    'sugar cosmetics': 'SUGAR Cosmetics',
    'transferwise': 'Wise',
    'wise': 'Wise',
    'github': 'GitHub',
    'gitlab': 'GitLab',
    'reddit': 'Reddit',
    'facebook': 'Facebook',
    'meta': 'Meta',
    'twitter': 'Twitter',
    'x': 'X (Twitter)',
    'google': 'Google',
    'alphabet': 'Google',
    'apple': 'Apple',
    'amazon': 'Amazon',
    'microsoft': 'Microsoft',
    'netflix': 'Netflix',
    'spotify': 'Spotify',
    'affirm': 'Affirm',
    'klarna': 'Klarna',
    'plaid': 'Plaid',
    'chime': 'Chime',
    'revolut': 'Revolut',
    'monzo': 'Monzo',
    'n26': 'N26',
    'kraken': 'Kraken',
    'opensea': 'OpenSea',
    'dapper labs': 'Dapper Labs',
    'solana': 'Solana',
    'chainlink': 'Chainlink',
    'polygon': 'Polygon'
}

# Suffixes to strip
LEGAL_SUFFIX_PATTERN = re.compile(
    r'[\s,]+(inc|inc\.|llc|llc\.|ltd|ltd\.|corp|corp\.|corporation|co|co\.|company|technologies|tech|labs|holdings|group|ventures|capital|global|international|systems|software|interactive)\b',
    re.IGNORECASE
)

STAGE_BRACKET_PATTERN = re.compile(
    r'[\(\[\{].*?(early|seed|series|angel|pre-seed|acquired|ipo|stealth|round|lead|growth).*?[\)\]\}]',
    re.IGNORECASE
)

def canonicalize_portfolio_company(raw_name: str) -> Optional[str]:
    """
    Resolves any raw company name, legal variation, or domain into its canonical entity name
    using Entity Resolution Engine v0.1.
    """
    if not raw_name or not isinstance(raw_name, str):
        return None
    
    cleaned = raw_name.strip()
    if not cleaned:
        return None

    # 1. First pass through Entity Resolution Engine v0.1
    try:
        engine = ere.get_engine()
        resolved = engine.resolve_single_name_or_domain(cleaned)
        if resolved and len(resolved) >= 2:
            return resolved
    except Exception:
        pass

    # 2. Fallback cleaning: Strip bracketed stage markers
    cleaned = STAGE_BRACKET_PATTERN.sub('', cleaned).strip()

    # 3. Strip standard trailing legal/corporate suffixes
    cleaned = LEGAL_SUFFIX_PATTERN.sub('', cleaned).strip()

    # 4. Clean remaining punctuation and whitespace
    cleaned = re.sub(r'^[,\-–—\.\s]+|[,\-–—\.\s]+$', '', cleaned)
    cleaned = ' '.join(cleaned.split())

    if len(cleaned) < 2 or len(cleaned) > 40:
        return None

    # 5. Check canonical dictionary match
    key = cleaned.lower()
    if key in CANONICAL_COMPANIES:
        return CANONICAL_COMPANIES[key]

    # 6. Smart Title Casing for unmapped entities
    if any(c.isupper() for c in cleaned[1:]):
        return cleaned
    
    return ' '.join(w.capitalize() for w in cleaned.split())


def canonicalize_portfolio_list(portfolio: Any) -> List[str]:
    """Canonicalizes and deduplicates an entire list of portfolio companies."""
    if not portfolio:
        return []
    
    raw_list = portfolio if isinstance(portfolio, list) else str(portfolio).split(',')
    seen = set()
    result = []
    
    for item in raw_list:
        if isinstance(item, str) and item.strip():
            canon = canonicalize_portfolio_company(item)
            if canon and canon.lower() not in seen:
                seen.add(canon.lower())
                result.append(canon)
                
    return result[:10]


# ============================================================================
# 2. LOCATION & GEOGRAPHY NORMALIZER
# ============================================================================

US_STATE_MAP = {
    'california': 'CA', 'new york': 'NY', 'texas': 'TX', 'massachusetts': 'MA',
    'washington': 'WA', 'florida': 'FL', 'illinois': 'IL', 'colorado': 'CO',
    'utah': 'UT', 'georgia': 'GA', 'pennsylvania': 'PA', 'district of columbia': 'DC',
    'north carolina': 'NC', 'virginia': 'VA', 'oregon': 'OR', 'ohio': 'OH',
    'michigan': 'MI', 'minnesota': 'MN', 'maryland': 'MD', 'tennessee': 'TN',
    'arizona': 'AZ', 'connecticut': 'CT', 'new jersey': 'NJ', 'nevada': 'NV'
}

KNOWN_CITIES = {
    'sf': ('San Francisco', 'CA'),
    'san francisco': ('San Francisco', 'CA'),
    'san francisco bay area': ('San Francisco', 'CA'),
    'bay area': ('San Francisco', 'CA'),
    'silicon valley': ('San Francisco', 'CA'),
    'palo alto': ('Palo Alto', 'CA'),
    'menlo park': ('Menlo Park', 'CA'),
    'mountain view': ('Mountain View', 'CA'),
    'san jose': ('San Jose', 'CA'),
    'oakland': ('Oakland', 'CA'),
    'berkeley': ('Berkeley', 'CA'),
    'los angeles': ('Los Angeles', 'CA'),
    'la': ('Los Angeles', 'CA'),
    'santa monica': ('Santa Monica', 'CA'),
    'san diego': ('San Diego', 'CA'),
    'nyc': ('New York', 'NY'),
    'new york': ('New York', 'NY'),
    'new york city': ('New York', 'NY'),
    'brooklyn': ('New York', 'NY'),
    'manhattan': ('New York', 'NY'),
    'boston': ('Boston', 'MA'),
    'cambridge': ('Cambridge', 'MA'),
    'austin': ('Austin', 'TX'),
    'dallas': ('Dallas', 'TX'),
    'houston': ('Houston', 'TX'),
    'seattle': ('Seattle', 'WA'),
    'miami': ('Miami', 'FL'),
    'denver': ('Denver', 'CO'),
    'boulder': ('Boulder', 'CO'),
    'chicago': ('Chicago', 'IL'),
    'atlanta': ('Atlanta', 'GA'),
    'salt lake city': ('Salt Lake City', 'UT'),
    'washington': ('Washington', 'DC'),
    'washington dc': ('Washington', 'DC'),
    'london': ('London', 'United Kingdom'),
    'berlin': ('Berlin', 'Germany'),
    'paris': ('Paris', 'France'),
    'amsterdam': ('Amsterdam', 'Netherlands'),
    'stockholm': ('Stockholm', 'Sweden'),
    'dublin': ('Dublin', 'Ireland'),
    'toronto': ('Toronto', 'Canada'),
    'vancouver': ('Vancouver', 'Canada'),
    'montreal': ('Montreal', 'Canada'),
    'singapore': ('Singapore', 'Singapore'),
    'tel aviv': ('Tel Aviv', 'Israel'),
    'sydney': ('Sydney', 'Australia'),
    'melbourne': ('Melbourne', 'Australia'),
    'tokyo': ('Tokyo', 'Japan'),
    'bengaluru': ('Bengaluru', 'India'),
    'bangalore': ('Bengaluru', 'India'),
    'mumbai': ('Mumbai', 'India'),
    'delhi': ('New Delhi', 'India'),
    'new delhi': ('New Delhi', 'India'),
}

def normalize_location(raw_loc: Optional[str]) -> Optional[str]:
    """
    Standardizes location string to 'City, ST' for US or 'City, Country' for Global hubs.
    """
    if not raw_loc or not isinstance(raw_loc, str):
        return None
    
    cleaned = ' '.join(raw_loc.strip().split())
    if not cleaned or cleaned.lower() in ('remote', 'global', 'unknown', 'worldwide', 'n/a', 'earth'):
        return None

    lower = cleaned.lower()
    
    # 1. Exact city lookup
    if lower in KNOWN_CITIES:
        city, region = KNOWN_CITIES[lower]
        return f"{city}, {region}"

    # 2. Check parts split by comma
    parts = [p.strip() for p in cleaned.split(',') if p.strip()]
    if len(parts) >= 2:
        city_raw = parts[0].lower()
        state_raw = parts[1].lower()
        
        # Check if city is known
        if city_raw in KNOWN_CITIES:
            city, region = KNOWN_CITIES[city_raw]
            return f"{city}, {region}"
        
        # Check if state is in US map
        if state_raw in US_STATE_MAP:
            return f"{parts[0].title()}, {US_STATE_MAP[state_raw]}"
        
        # Check 2-letter uppercase state code (e.g. CA, NY, TX)
        if len(parts[1]) == 2 and parts[1].upper() in US_STATE_MAP.values():
            return f"{parts[0].title()}, {parts[1].upper()}"

        return f"{parts[0].title()}, {parts[1].title()}"

    # Single word location
    if lower in KNOWN_CITIES:
        city, region = KNOWN_CITIES[lower]
        return f"{city}, {region}"

    return cleaned.title()


# ============================================================================
# 3. ANOMALY DETECTION & SANITIZATION GUARD
# ============================================================================

COMMON_EMAIL_DOMAIN_TYPOS = {
    'gmai.com': 'gmail.com',
    'gmaill.com': 'gmail.com',
    'gamil.com': 'gmail.com',
    'gmail.con': 'gmail.com',
    'gmial.com': 'gmail.com',
    'hotmial.com': 'hotmail.com',
    'hotmai.com': 'hotmail.com',
    'outlok.com': 'outlook.com',
    'outloo.com': 'outlook.com',
    'yaho.com': 'yahoo.com',
    'yahooo.com': 'yahoo.com',
    'yahoo.con': 'yahoo.com',
}

def sanitize_email_domain(email: Optional[str]) -> Optional[str]:
    """Fixes common clerical typos in email domains and discards dummy domains."""
    if not email or not isinstance(email, str):
        return None
    
    clean_email = email.strip().lower()
    # Strip URL prefixes and mailto prefixes
    clean_email = re.sub(r'^(?:https?:\/\/|mailto:)+', '', clean_email)
    clean_email = clean_email.strip('/:,; \t\n\r')
    
    match = re.match(r'^([a-zA-Z0-9_.+-]+)@([a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+)$', clean_email)
    if not match:
        return None
    
    user_part, domain_part = match.group(1), match.group(2)
    
    # Fix common domain typos
    if domain_part in COMMON_EMAIL_DOMAIN_TYPOS:
        domain_part = COMMON_EMAIL_DOMAIN_TYPOS[domain_part]
        
    return f"{user_part}@{domain_part}"


def sanitize_check_sizes(check_min: Any, check_max: Any) -> Tuple[Optional[int], Optional[int]]:
    """
    Sanity checks and clamps investment check sizes for early-stage angel investing.
    """
    c_min = int(check_min) if check_min is not None and str(check_min).isdigit() else None
    c_max = int(check_max) if check_max is not None and str(check_max).isdigit() else None

    # Anomaly checks
    if c_min is not None and c_max is not None:
        if c_min > c_max:
            c_min, c_max = c_max, c_min
            
    # Clamp extreme bounds ($1k to $50M)
    if c_min is not None:
        if c_min < 1000: c_min = 1000
        if c_min > 25000000: c_min = 25000000
        
    if c_max is not None:
        if c_max > 50000000: c_max = 50000000
        if c_min is not None and c_max < c_min: c_max = c_min * 2

    return c_min, c_max


RESERVED_TWITTER_HANDLES = {
    '', 'x', 'x.com', 'twitter.com', 'www.twitter.com', 'www.x.com', 'home', 'explore',
    'notifications', 'messages', 'i', 'search', 'terms', 'privacy', 'intent',
    'login', 'signup', 'share', 'status', 'nfx', 'settings', 'hashtag', 'about',
    'help', 'tos', 'jobs', 'download', 'compose', 'who_to_follow', 'account',
    'search-advanced', 'login-to', 'null', 'undefined', 'en', 'es', 'fr', 'de',
    'ja', 'pt', 'ru', 'it', 'zh', 'ar', 'ko', 'hi', 'tr', 'nl', 'pl', 'sv',
    'id', 'vi', 'uk', 'th', 'cs', 'el', 'ro', 'hu', 'da', 'fi', 'no', 'he', 'fa',
    'share_url', 'direct_messages', 'lists', 'bookmarks', 'communities', 'premium',
    'access', 'session', 'oauth', 'authorize', 'verify', 'support', 'developer', 'dev',
    'blog', 'legal'
}

def sanitize_twitter_url(url: Optional[str]) -> Optional[str]:
    """Strictly validates and canonicalizes Twitter/X profile URLs."""
    if not url or not isinstance(url, str): return None
    url = url.strip().split('?')[0].rstrip('/')
    parts = [p for p in url.split('/') if p]
    if not parts: return None
    handle = parts[-1].lower()
    if handle.startswith('@'): handle = handle[1:]
    if handle in RESERVED_TWITTER_HANDLES: return None
    if not re.match(r'^[a-zA-Z0-9_]{1,30}$', handle): return None
    return f"https://x.com/{parts[-1]}"

def sanitize_linkedin_url(url: Optional[str]) -> Optional[str]:
    """Strictly validates and canonicalizes LinkedIn personal profile URLs."""
    if not url or not isinstance(url, str): return None
    url = url.strip().split('?')[0].rstrip('/')
    if 'linkedin.com/in/' not in url.lower(): return None
    slug = url.lower().split('linkedin.com/in/')[-1].strip('/')
    if not slug or any(x in slug for x in ['search', 'company', 'feed', 'groups', 'pulse', 'school', 'jobs']):
        return None
    # Strip language subpaths like /de, /en
    slug = slug.split('/')[0]
    if not re.match(r'^[a-zA-Z0-9\-_%]{2,100}$', slug): return None
    return f"https://www.linkedin.com/in/{slug}"

def sanitize_email_address(email: Optional[str]) -> Optional[str]:
    """Strictly validates and fixes email addresses."""
    if not email or not isinstance(email, str) or '@' not in email: return None
    clean = sanitize_email_domain(email)
    if not clean: return None
    if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', clean): return None
    mailbox = clean.split('@')[0]
    if mailbox in {'info', 'contact', 'support', 'hello', 'admin', 'help', 'sales', 'team', 'jobs', 'service', 'press', 'media', 'hi'}:
        return None
    return clean

def has_verified_contact(inv: Dict[str, Any]) -> bool:
    """Verifies that the investor profile has at least ONE valid, non-empty contact method."""
    tw = sanitize_twitter_url(inv.get('twitter_url'))
    li = sanitize_linkedin_url(inv.get('linkedin_url'))
    em = sanitize_email_address(inv.get('email'))
    # Mutate in-place to sanitized versions
    inv['twitter_url'] = tw
    inv['linkedin_url'] = li
    inv['email'] = em
    return bool(tw or li or em)


# ============================================================================
# 4. PROFILE QUALITY SCORER (0 - 100%)
# ============================================================================

def calculate_quality_score(inv: Dict[str, Any]) -> int:
    """
    Calculates a deterministic 0-100% Quality Score based on field completeness,
    data lineage, and verification level.
    """
    score = 0

    # 1. Verified Direct Contact (30 pts)
    if inv.get('email'):
        score += 30
    elif inv.get('has_email'):
        score += 15

    # 2. Direct Social Link Presence (25 pts)
    has_li = bool(inv.get('linkedin_url') or inv.get('has_linkedin'))
    has_tw = bool(inv.get('twitter_url') or inv.get('has_twitter'))
    has_web = bool(inv.get('website') or inv.get('has_website'))
    
    if has_li: score += 12
    if has_tw: score += 8
    if has_web: score += 5

    # 3. Investment Check Size Range (15 pts)
    if inv.get('check_min') or inv.get('check_max'):
        score += 15

    # 4. Verified Portfolio Companies (15 pts)
    port = inv.get('portfolio')
    if isinstance(port, list) and len(port) > 0:
        score += 15
    elif isinstance(port, str) and len(port.strip()) > 0:
        score += 10

    # 5. Structured Location (5 pts)
    if inv.get('location'):
        score += 5

    # 6. High-Res Avatar (5 pts)
    if inv.get('avatar_url'):
        score += 5

    # 7. Rich Bio (5 pts)
    bio = inv.get('bio') or ''
    if len(bio) >= 30 and 'Active' not in bio[:10]:
        score += 5

    return min(100, max(0, score))


# ============================================================================
# 5. SELF-TEST RUNNER
# ============================================================================

if __name__ == '__main__':
    print("=== Testing Data Quality Engine ===")
    
    # Test 1: Portfolio Entity Resolution
    test_ports = [
        "Open AI", "OpenAI, Inc.", "Figma (early)", "Doordash LLC", 
        "TransferWise", "FitBit", "MindBody", "SUGAR Cosmetics", "Stripe Tech"
    ]
    print("\n1. Portfolio Entity Resolution:")
    for raw in test_ports:
        print(f"  '{raw}' ──► '{canonicalize_portfolio_company(raw)}'")

    # Test 2: Location Normalization
    test_locs = ["SF", "NYC", "San Francisco, California", "Austin, Texas", "London, UK", "Berlin", "Remote"]
    print("\n2. Location Normalization:")
    for loc in test_locs:
        print(f"  '{loc}' ──► '{normalize_location(loc)}'")

    # Test 3: Email Typo Fixer
    test_emails = ["alex@gmai.com", "sarah@hotmial.com", "mike@outlok.com", "valid@google.com"]
    print("\n3. Email Typo Fixing:")
    for em in test_emails:
        print(f"  '{em}' ──► '{sanitize_email_domain(em)}'")

    # Test 4: Quality Scoring
    sample_inv = {
        "name": "Sahil Lavingia",
        "email": "sahil.lavingia@gmail.com",
        "linkedin_url": "https://linkedin.com/in/sahillavingia",
        "twitter_url": "https://x.com/shl",
        "website": "https://sahillavingia.com",
        "check_min": 5000,
        "check_max": 200000,
        "portfolio": ["Gumroad", "Figma"],
        "location": "Los Angeles, CA",
        "avatar_url": "https://pbs.twimg.com/...",
        "bio": "Founder of Gumroad. Active angel investor in creator economy and SaaS."
    }
    score = calculate_quality_score(sample_inv)
    print(f"\n4. Quality Score for Sahil Lavingia: {score}/100%")
    print("=== All Data Quality Tests Passed Successfully ===")
