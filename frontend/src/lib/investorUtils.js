/**
 * Shared SEO, data-sanitization, and profile-classification utilities for investor profiles and hubs.
 */

export const HEX_SLUG_REGEX = /-[0-9a-f]{6}$/i;

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

/**
 * Check whether a firm string is a consumer email provider, placeholder, or junk value.
 * @param {string|null|undefined} firm
 * @returns {boolean}
 */
export function isJunkFirm(firm) {
  if (!firm || typeof firm !== 'string') return true;
  const cleaned = firm.trim().replace(/^@+/, '').replace(/[.,;:]+$/, '');
  if (cleaned.length < 2) return true;
  return JUNK_FIRM_PATTERNS.some((pattern) => pattern.test(cleaned));
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

  const lower = trimmed.toLowerCase();
  if (
    lower.includes('active early-stage technology angel investor and vc') ||
    lower.includes('active early-stage angel investor and technology backer') ||
    lower === 'active investor in early-stage startups.' ||
    lower === 'active investor in early-stage startups' ||
    lower.includes('automated news') ||
    lower.includes('public investor list')
  ) {
    return true;
  }

  if (/^founder\s*@/i.test(trimmed) && trimmed.length < 140) {
    return true;
  }

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

  return null;
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

  const primaryIndustries = indList.slice(0, 3).join(', ') || 'early-stage technology';
  const primaryStages = stageList.slice(0, 2).join(' and ') || 'Pre-Seed and Seed';
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
