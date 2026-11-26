/**
 * Shared SEO, data-sanitization, and profile-classification utilities for investor profiles and hubs.
 */

export const HEX_SLUG_REGEX = /-[0-9a-f]{6}$/i;

// Lightweight slug set for known company dossiers (avoids importing 232KB companyData.js in investor SSR)
export const KNOWN_COMPANY_SLUGS = new Set([
  'openai', 'stripe', 'anthropic', 'perplexity', 'cursor', 'figma', 'airbnb', 'uber',
  'twitter', 'linkedin', 'facebook', 'cognition', 'glean', 'harvey', 'mercor', 'poolside',
  'decagon', 'sierra', 'figure-ai', 'groq', 'restate', 'nori-robotics', 'notion', 'linear',
  'vercel', 'supabase', 'scale-ai', 'databricks', 'coinbase', 'discord', 'ramp', 'rippling',
]);

/**
 * Deterministic verification badge metadata (shared by Dashboard and InvestorProfileModal
 * without pulling Dashboard.jsx into standalone /investor/[slug] SSR/client bundles).
 */
export function getVerificationInfo(investor) {
  const dateStr = investor?.created_at || investor?.updated_at;
  let formattedDate = 'Sep 2026';
  if (dateStr) {
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
      }
    } catch {}
  }

  const hasEmail = !!investor?.email || !!investor?.has_email;
  const hasSocial = !!investor?.linkedin_url || !!investor?.has_linkedin || !!investor?.twitter_url || !!investor?.has_twitter;

  let method = 'Registry Confirmed';
  if (hasEmail) {
    method = 'SMTP Validated';
  } else if (hasSocial) {
    method = 'Profile Confirmed';
  }

  return {
    date: formattedDate,
    method,
    badgeText: `Verified: ${formattedDate} (${method})`,
  };
}

export const JUNK_FIRM_PATTERNS = [
  /^hotmail(?:\.com)?$/i,
  /^gmail(?:\.com)?$/i,
  /^yahoo(?:\.com)?$/i,
  /^outlook(?:\.com)?$/i,
  /^icloud(?:\.com)?$/i,
  /^aol(?:\.com)?$/i,
  /^proton(?:mail)?(?:\.com)?$/i,
  /^live(?:\.com)?$/i,
  /^msn(?:\.com)?$/i,
  /^yandex(?:\.[a-z]+)?$/i,
  /^mail(?:\.ru|\.com)?$/i,
  /^gmx(?:\.[a-z]+)?$/i,
  /^zoho(?:\.com)?$/i,
  /^fastmail(?:\.com)?$/i,
  /^me(?:\.com)?$/i,
  /^self[- ]?employed$/i,
  /^stealth(?:\s+(?:startup|mode|company|ventures?))?$/i,
  /^independent$/i,
  /^freelance$/i,
  /^individual$/i,
  /^personal$/i,
  /^private$/i,
  /^angel(?:\s+investor)?$/i,
  /^investor$/i,
  /^unknown$/i,
  /^undisclosed$/i,
  /^none$/i,
  /^n\/?a$/i,
  /^tbd$/i,
  /^null$/i,
  /^-+$/,
];

/**
 * Normalize array or comma-separated metadata fields into a clean string array.
 * @param {string[]|string|null|undefined} value
 * @returns {string[]}
 */
export function parseListField(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => String(item).trim()).filter(Boolean);
        }
      } catch {
        // Fallback to comma split below.
      }
    }
    return trimmed.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return [];
}

const JUNK_FIRM_EXACT = new Set([
  'hotmail', 'hotmail.com', 'gmail', 'gmail.com', 'yahoo', 'yahoo.com',
  'outlook', 'outlook.com', 'icloud', 'icloud.com', 'aol', 'aol.com',
  'proton', 'proton.com', 'protonmail', 'protonmail.com', 'live', 'live.com',
  'msn', 'msn.com', 'yandex', 'yandex.ru', 'yandex.com', 'mail', 'mail.ru', 'mail.com',
  'gmx', 'gmx.com', 'gmx.de', 'zoho', 'zoho.com', 'fastmail', 'fastmail.com',
  'me', 'me.com', 'self-employed', 'self employed', 'selfemployed', 'stealth',
  'stealth startup', 'stealth mode', 'stealth company', 'stealth venture', 'stealth ventures',
  'independent', 'freelance', 'individual', 'personal', 'private',
  'angel', 'angel investor', 'investor', 'unknown', 'undisclosed',
  'none', 'na', 'n/a', 'tbd', 'null', '-', '--', '---',
]);

const JUNK_FIRM_COMBINED_RE =
  /^(?:(?:hotmail|gmail|yahoo|outlook|icloud|aol|proton(?:mail)?|live|msn|zoho|fastmail|me)\.com|(?:yandex|gmx)\.[a-z]+|mail\.(?:ru|com)|self[- ]?employed|stealth(?:\s+(?:startup|mode|company|ventures?))?|-+)$/i;

const BOILERPLATE_BIO_RE =
  /active early-stage technology angel investor and vc|active early-stage angel investor and technology backer|^active investor in early-stage startups\.?$|automated news|public investor list/i;

/**
 * Check whether a firm string is a consumer email provider, placeholder, or junk value.
 * Uses O(1) Set lookup + single combined RegExp to minimize Worker SSR CPU time.
 * @param {string|null|undefined} firm
 * @returns {boolean}
 */
export function isJunkFirm(firm) {
  if (!firm || typeof firm !== 'string') return true;
  const cleaned = firm.trim().replace(/^@+/, '').replace(/[.,;:]+$/, '');
  if (cleaned.length < 2) return true;
  const lower = cleaned.toLowerCase();
  return JUNK_FIRM_EXACT.has(lower) || JUNK_FIRM_COMBINED_RE.test(lower);
}

/**
 * Detect known thin or mass-templated boilerplate bios across bulk imports.
 * @param {string|null|undefined} bio
 * @returns {boolean}
 */
export function isBoilerplateBio(bio) {
  if (!bio || typeof bio !== 'string') return true;
  const trimmed = bio.trim();
  if (trimmed.length < 20) return true;
  if (BOILERPLATE_BIO_RE.test(trimmed)) return true;
  if (trimmed.length < 140 && /^founder\s*@/i.test(trimmed)) return true;
  return false;
}

/**
 * Extract a valid firm/fund name from an explicit field or a templated bio string, filtering out junk firms.
 * @param {string|null|undefined} bio
 * @param {string|null|undefined} existingFirm
 * @returns {string|null}
 */
export function extractFirmFromBio(bio, existingFirm = null) {
  if (existingFirm && typeof existingFirm === 'string') {
    const cleanExisting = existingFirm.trim();
    if (!isJunkFirm(cleanExisting)) {
      return cleanExisting;
    }
  }

  if (!bio || typeof bio !== 'string') return null;

  const partnerMatch = bio.match(
    /(?:^|\b)(?:Managing\s+Partner|General\s+Partner|Founding\s+Partner|Partner|Principal|Venture\s+Partner|Investor)\s+(?:at|@)\s+([^.\n,;()]+)/i
  );
  if (partnerMatch?.[1]) {
    const candidate = partnerMatch[1].trim();
    if (!isJunkFirm(candidate)) {
      return candidate;
    }
    return null;
  }

  const founderMatch = bio.match(/(?:^|\b)(?:Co-?Founder|Founder)\s*(?:at|@)\s*([^.\n,;()]+)/i);
  if (founderMatch?.[1]) {
    const candidate = founderMatch[1].trim();
    if (!isJunkFirm(candidate)) {
      return candidate;
    }
    return null;
  }

  const ofMatch = bio.match(
    /(?:^|\b)(?:Co-?Founder(?:\s+and\s+[A-Z]+)?|Founder|Former\s+CEO|CEO|Chairman|Partner|General\s+Partner|Managing\s+Partner)\s+of\s+([^.\n,;()]+)/i
  );
  if (ofMatch?.[1]) {
    const candidate = ofMatch[1].split(/\s+and\s+/i)[0].trim();
    if (!isJunkFirm(candidate)) {
      return candidate;
    }
  }

  return null;
}

const HUMAN_LABEL_MAP = {
  ai: 'AI',
  saas: 'SaaS',
  b2b: 'B2B',
  web3: 'Web3',
  'ar-vr': 'AR/VR',
  api: 'API',
  edtech: 'EdTech',
  fintech: 'Fintech',
  biotech: 'Biotech',
  'deep-tech': 'Deep Tech',
  'developer-tools': 'Developer Tools',
  'pre-seed': 'Pre-Seed',
  'series-a': 'Series A',
  'series-b': 'Series B',
  seed: 'Seed',
  angel: 'Angel',
  growth: 'Growth',
  'e-commerce': 'E-Commerce',
  'open-source': 'Open Source',
  'marketing-tech': 'Marketing Tech',
  'legal-tech': 'Legal Tech',
  'future-of-work': 'Future of Work',
  'creator-economy': 'Creator Economy',
};

/**
 * Convert slug/raw tags (e.g., "developer-tools", "series-a") into clean display labels for SEO snippets.
 * @param {string|null|undefined} value
 * @returns {string}
 */
export function formatHumanLabel(value) {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  const key = trimmed.toLowerCase().replace(/[\s_]+/g, '-');
  if (HUMAN_LABEL_MAP[key]) return HUMAN_LABEL_MAP[key];
  return trimmed
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase();
      if (HUMAN_LABEL_MAP[lower]) return HUMAN_LABEL_MAP[lower];
      if (/^[A-Z0-9]{2,5}$/.test(word)) return word;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

/**
 * Truncate a meta description at word boundaries to avoid cutting words in half in SERP snippets.
 * @param {string|null|undefined} text
 * @param {number} maxLen
 * @returns {string}
 */
export function truncateMetaDescription(text, maxLen = 155) {
  if (!text || typeof text !== 'string') return '';
  const cleaned = text.replace(/\s+/g, ' ').trim();
  if (cleaned.length <= maxLen) return cleaned;

  const sliced = cleaned.slice(0, maxLen - 1);
  const lastSpace = sliced.lastIndexOf(' ');
  const boundary = lastSpace > Math.floor(maxLen * 0.6) ? sliced.slice(0, lastSpace) : sliced;
  const trimmed = boundary.replace(/[,;:\-–\s]+$/g, '');
  if (!trimmed) return cleaned.slice(0, maxLen).trim();
  if (/[.!?]$/.test(trimmed)) return trimmed;
  return `${trimmed}…`;
}

/**
 * Determine whether an investor profile lacks standalone indexation signals (noindex guard).
 * Aligned with sitemap inclusion rules (requires avatar, email, portfolio, or non-boilerplate bio).
 * @param {object} investor
 * @param {string[]|null} portArr
 * @returns {boolean}
 */
export function isThinInvestorProfile(investor, portArr = null) {
  if (!investor) return true;
  const resolvedPort = Array.isArray(portArr)
    ? portArr
    : parseListField(investor.portfolio || investor.past_investments);
  const hasRealBio = Boolean(investor.bio && !isBoilerplateBio(investor.bio));
  const cleanFirm = extractFirmFromBio(investor.bio, investor.firm);
  const isHexSlug = HEX_SLUG_REGEX.test(investor.slug || '');

  const hasRichSignals =
    Boolean(investor.avatar_url) ||
    Boolean(investor.has_email) ||
    Boolean(investor.email) ||
    resolvedPort.length > 0 ||
    hasRealBio ||
    (Boolean(cleanFirm) && !isHexSlug);

  return !hasRichSignals;
}

function stableHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

/**
 * Generate a deterministic, unique 6-variant summary bio when an investor only has boilerplate text.
 * @param {object} investor
 * @param {string[]} industries
 * @param {string[]} stages
 * @param {string} checkSizeStr
 * @param {string[]} portfolioList
 * @returns {string}
 */
export function generateUniqueBio(
  investor,
  industries = [],
  stages = [],
  checkSizeStr = '',
  portfolioList = []
) {
  const name = investor?.name || 'This investor';
  const location = investor?.location && !/^(unknown|global|n\/a)$/i.test(investor.location.trim())
    ? investor.location.trim()
    : '';
  const cleanFirm = extractFirmFromBio(investor?.bio, investor?.firm);

  const indList = industries.length > 0 ? industries : parseListField(investor?.industries);
  const stageList = stages.length > 0 ? stages : parseListField(investor?.stages);
  const portList =
    portfolioList.length > 0
      ? portfolioList
      : parseListField(investor?.portfolio || investor?.past_investments);

  const primaryIndustries =
    indList.slice(0, 3).map(formatHumanLabel).filter(Boolean).join(', ') || 'early-stage technology';
  const primaryStages =
    stageList.slice(0, 2).map(formatHumanLabel).filter(Boolean).join(' and ') || 'Pre-Seed and Seed';
  const notableBacking = portList.length > 0 ? portList.slice(0, 2).join(' and ') : '';
  const firmClause = cleanFirm ? ` at ${cleanFirm}` : '';
  const locationClause = location ? ` based in ${location}` : '';
  const cleanCheckSize =
    checkSizeStr && !String(checkSizeStr).includes('Undisclosed') ? String(checkSizeStr).trim() : '';
  const checkClause = cleanCheckSize ? ` with typical check sizes around ${cleanCheckSize}` : '';
  const portfolioClause = notableBacking ? ` Notable portfolio companies include ${notableBacking}.` : '';

  const seed = investor?.slug || name;
  const variant = stableHash(seed) % 6;

  switch (variant) {
    case 0:
      return `${name} is an active angel investor${firmClause}${locationClause}, backing ${primaryStages} founders building across ${primaryIndustries}${checkClause}.${portfolioClause}`.trim();
    case 1:
      return `Focused on ${primaryIndustries}, ${name}${firmClause} partners with ${primaryStages} startups${locationClause}${checkClause}.${portfolioClause}`.trim();
    case 2:
      return `${name}${locationClause} invests at the ${primaryStages} stage${firmClause}, supporting high-conviction teams in ${primaryIndustries}${checkClause}.${portfolioClause}`.trim();
    case 3:
      return `Writing early checks${firmClause} into ${primaryIndustries}, ${name}${locationClause} backs ambitious ${primaryStages} operators${checkClause}.${portfolioClause}`.trim();
    case 4:
      return `${cleanFirm ? `Associated with ${cleanFirm}, ` : ''}${name} is an early-stage backer${locationClause} concentrating on ${primaryStages} opportunities in ${primaryIndustries}${checkClause}.${portfolioClause}`.trim();
    case 5:
    default:
      return `${name} supports emerging founders${locationClause} across ${primaryIndustries} from ${primaryStages} onward${firmClause}${checkClause}.${portfolioClause}`.trim();
  }
}
