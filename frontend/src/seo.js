export const SITE_URL = 'https://openangels.xyz';
export const PRODUCT_NAME = 'OpenAngels';
export const INVESTOR_COUNT = '4,700+';
export const LEGAL_UPDATED_LABEL = 'June 21, 2026';
export const SEO_LASTMOD = '2026-06-21';

// Stage slugs for catch-all routes
export const STAGE_SLUGS = {
  'pre-seed': { label: 'Pre-Seed', dbValue: 'pre-seed' },
  'seed': { label: 'Seed', dbValue: 'seed' },
  'series-a': { label: 'Series A', dbValue: 'series-a' },
  'series-b': { label: 'Series B', dbValue: 'series-b' },
  'angel': { label: 'Angel', dbValue: 'angel' },
};

// Geo regions for catch-all routes — each maps to an array of DB location prefixes
export const GEO_REGIONS = {
  'usa': { label: 'the USA', locations: null, countryMatch: true },
  'europe': { label: 'Europe', locations: ['London', 'Berlin', 'Paris', 'Amsterdam', 'Stockholm', 'Barcelona', 'Madrid', 'Munich', 'Helsinki', 'Copenhagen', 'Oslo', 'Milan', 'Rome', 'Zurich', 'Geneva', 'Basel', 'Lisbon', 'Dublin', 'Prague', 'Warsaw', 'Vienna', 'Budapest', 'Bucharest', 'Bratislava', 'Tallinn', 'Riga', 'Brussels', 'Luxembourg', 'Hamburg', 'Genoa', 'Malmo', 'Sarajevo', 'Newcastle Upon Tyne', 'Limassol', 'St. Gallen', 'Valencia', 'Liège'] },
  'asia': { label: 'Asia', locations: ['Singapore', 'Tokyo', 'Seoul', 'Hong Kong', 'Beijing', 'Shenzhen', 'Hangzhou', 'Bangalore', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Noida', 'Gurugram', 'Kolkata', 'Jakarta', 'Kuala Lumpur', 'Osaka', 'Bangkok'] },
  'san-francisco': { label: 'San Francisco', locations: ['San Francisco, CA'] },
  'new-york': { label: 'New York', locations: ['New York, NY'] },
  'london': { label: 'London', locations: ['London'] },
  'los-angeles': { label: 'Los Angeles', locations: ['Los Angeles, CA', 'Santa Monica, CA'] },
  'silicon-valley': { label: 'Silicon Valley', locations: ['San Francisco, CA', 'Palo Alto, CA', 'Menlo Park, CA', 'Mountain View, CA', 'Sunnyvale, CA', 'San Jose, CA', 'San Mateo, CA', 'Redwood City, CA', 'Los Altos, CA', 'Atherton, CA', 'Portola Valley, CA', 'Pescadero, CA'] },
  'india': { label: 'India', locations: ['Bangalore', 'Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Noida', 'Gurugram', 'Kolkata'] },
  'middle-east': { label: 'the Middle East', locations: ['Dubai', 'Riyadh', 'Amman', 'Beirut', 'Kuwait City', 'Manama', 'Muscat', 'Jerusalem', 'Tel Aviv'] },
  'africa': { label: 'Africa', locations: ['Lagos', 'Nairobi', 'Cape Town', 'Johannesburg', 'Accra', 'Cairo', 'Abuja', 'Yaounde'] },
  'latam': { label: 'Latin America', locations: ['Sao Paulo', 'Buenos Aires', 'Mexico City', 'Santiago', 'Bogota'] },
  'canada': { label: 'Canada', locations: ['Toronto', 'Montreal', 'Ottawa', 'Victoria, BC', 'Moncton'] },
  'boston': { label: 'Boston', locations: ['Boston, MA', 'Cambridge, MA', 'Northampton, MA'] },
  'miami': { label: 'Miami', locations: ['Miami, FL', 'Fort Lauderdale, FL'] },
  'austin': { label: 'Austin', locations: ['Austin, TX'] },
  'seattle': { label: 'Seattle', locations: ['Seattle, WA', 'Medina, WA'] },
  'chicago': { label: 'Chicago', locations: ['Chicago, IL'] },
};

// USA state abbreviations for matching US-based investors
const US_STATE_CODES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'];

export function isUSLocation(location) {
  if (!location) return false;
  // Match "City, ST" pattern where ST is a US state code
  const match = location.match(/,\s*([A-Z]{2})$/);
  if (match && US_STATE_CODES.includes(match[1])) return true;
  // Also match "Washington DC" / "Washington, DC"
  if (location.includes('Washington')) return true;
  return false;
}

export function getStageInfo(slug) {
  return STAGE_SLUGS[slug] || null;
}

export function getGeoInfo(slug) {
  return GEO_REGIONS[slug] || null;
}

/**
 * Parse a catch-all filters array from the URL.
 * Returns { industry, stage, geo } with null for missing segments.
 * Uses known STAGE_SLUGS and GEO_REGIONS to disambiguate.
 */
export function parseFilters(filtersArray) {
  const result = { industry: null, stage: null, geo: null };
  if (!filtersArray || filtersArray.length === 0) return result;
  
  for (const segment of filtersArray) {
    const lower = segment.toLowerCase();
    if (!result.stage && STAGE_SLUGS[lower]) {
      result.stage = lower;
    } else if (!result.geo && GEO_REGIONS[lower]) {
      result.geo = lower;
    } else if (!result.industry) {
      result.industry = lower;
    }
  }
  
  return result;
}

// Popular cross-filter hubs for internal linking
export const POPULAR_HUBS = [
  { filters: ['saas', 'pre-seed'], label: 'SaaS Pre-Seed' },
  { filters: ['ai', 'seed'], label: 'AI Seed' },
  { filters: ['fintech', 'seed'], label: 'Fintech Seed' },
  { filters: ['saas', 'silicon-valley'], label: 'SaaS in Silicon Valley' },
  { filters: ['ai', 'san-francisco'], label: 'AI in San Francisco' },
  { filters: ['fintech', 'europe'], label: 'Fintech in Europe' },
  { filters: ['b2b', 'pre-seed'], label: 'B2B Pre-Seed' },
  { filters: ['consumer', 'seed'], label: 'Consumer Seed' },
  { filters: ['health', 'usa'], label: 'Health in the USA' },
  { filters: ['crypto', 'seed'], label: 'Crypto Seed' },
  { filters: ['marketplace', 'pre-seed'], label: 'Marketplace Pre-Seed' },
  { filters: ['enterprise', 'series-a'], label: 'Enterprise Series A' },
  { filters: ['deep-tech', 'europe'], label: 'Deep Tech in Europe' },
  { filters: ['developer-tools', 'seed'], label: 'Developer Tools Seed' },
  { filters: ['ai', 'pre-seed', 'new-york'], label: 'AI Pre-Seed in New York' },
  { filters: ['saas', 'seed', 'europe'], label: 'SaaS Seed in Europe' },
  { filters: ['climate', 'seed'], label: 'Climate Seed' },
  { filters: ['edtech', 'pre-seed'], label: 'EdTech Pre-Seed' },
  { filters: ['biotech', 'seed'], label: 'Biotech Seed' },
  { filters: ['gaming', 'angel'], label: 'Gaming Angel' },
];

export const INDUSTRY_PAGES = [
  {
    slug: 'saas',
    label: 'SaaS',
    audience: 'SaaS founders',
    angle: 'recurring revenue, retention, and efficient go-to-market',
  },
  {
    slug: 'ai',
    label: 'AI',
    audience: 'AI startup founders',
    angle: 'model differentiation, defensibility, and fast customer adoption',
  },
  {
    slug: 'fintech',
    label: 'Fintech',
    audience: 'fintech founders',
    angle: 'regulated markets, payments, lending, and financial infrastructure',
  },
  {
    slug: 'marketplace',
    label: 'Marketplace',
    audience: 'marketplace founders',
    angle: 'liquidity, supply quality, demand generation, and network effects',
  },
  {
    slug: 'consumer',
    label: 'Consumer',
    audience: 'consumer startup founders',
    angle: 'brand, distribution, retention, and community-led growth',
  },
  {
    slug: 'enterprise',
    label: 'Enterprise',
    audience: 'enterprise software founders',
    angle: 'sales cycles, security reviews, pilots, and expansion revenue',
  },
  {
    slug: 'developer-tools',
    label: 'Developer Tools',
    audience: 'developer tools founders',
    angle: 'technical adoption, open-source motion, and product-led growth',
  },
  {
    slug: 'health',
    label: 'Health',
    audience: 'health startup founders',
    angle: 'clinical workflows, compliance, patient outcomes, and buyer trust',
  },
  {
    slug: 'deep-tech',
    label: 'Deep Tech',
    audience: 'deep tech founders',
    angle: 'technical risk, defensible IP, timelines, and milestone-based funding',
  },
  {
    slug: 'crypto',
    label: 'Crypto',
    audience: 'crypto founders',
    angle: 'protocol traction, security, token design, and ecosystem distribution',
  },
  {
    slug: 'e-commerce',
    label: 'E-commerce',
    audience: 'e-commerce founders',
    angle: 'conversion, margin, acquisition costs, and repeat purchase behavior',
  },
  {
    slug: 'climate',
    label: 'Climate',
    audience: 'climate tech founders',
    angle: 'impact, commercial adoption, policy tailwinds, and capital intensity',
  },
  {
    slug: 'edtech',
    label: 'EdTech',
    audience: 'edtech founders',
    angle: 'learning outcomes, buyer channels, retention, and institutional sales',
  },
  {
    slug: 'biotech',
    label: 'Biotech',
    audience: 'biotech founders',
    angle: 'scientific validation, regulatory path, and milestone financing',
  },
  {
    slug: 'security',
    label: 'Security',
    audience: 'cybersecurity founders',
    angle: 'threat urgency, enterprise trust, compliance, and technical credibility',
  },
  {
    slug: 'b2b',
    label: 'B2B',
    audience: 'B2B founders',
    angle: 'pipeline quality, buying committees, ROI, and repeatable sales',
  },
  {
    slug: 'gaming',
    label: 'Gaming',
    audience: 'gaming founders',
    angle: 'community, retention, monetization, and content loops',
  },
  {
    slug: 'infrastructure',
    label: 'Infrastructure',
    audience: 'infrastructure startup founders',
    angle: 'reliability, scale, developer adoption, and enterprise readiness',
  },
  {
    slug: 'media',
    label: 'Media',
    audience: 'media startup founders',
    angle: 'audience ownership, monetization, content supply, and distribution',
  },
  {
    slug: 'creator-economy',
    label: 'Creator Economy',
    audience: 'creator economy founders',
    angle: 'creator acquisition, monetization, workflow pain, and network effects',
  },
  {
    slug: 'data',
    label: 'Data',
    audience: 'data startup founders',
    angle: 'data quality, integrations, workflows, and measurable business value',
  },
  {
    slug: 'web3',
    label: 'Web3',
    audience: 'Web3 founders',
    angle: 'ecosystem traction, community, security, and protocol utility',
  },
  {
    slug: 'future-of-work',
    label: 'Future of Work',
    audience: 'future of work founders',
    angle: 'team productivity, collaboration behavior, and buyer urgency',
  },
  {
    slug: 'impact',
    label: 'Impact',
    audience: 'impact startup founders',
    angle: 'measurable outcomes, mission alignment, and scalable business models',
  },
];

export const INDEXABLE_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0', lastmod: SEO_LASTMOD },
  { path: '/contact', changefreq: 'monthly', priority: '0.6', lastmod: SEO_LASTMOD },
  ...INDUSTRY_PAGES.map((page) => ({
    path: `/investors/${page.slug}`,
    changefreq: 'weekly',
    priority: ['saas', 'ai', 'fintech', 'marketplace', 'consumer'].includes(page.slug) ? '0.9' : '0.7',
    lastmod: SEO_LASTMOD,
  })),
];

export const PRERENDER_ROUTES = [
  ...INDEXABLE_ROUTES.map((route) => route.path),
  '/terms',
  '/privacy',
  '/refund',
  '/gdpr',
  '/crm',
];

export function absoluteUrl(path = '/') {
  return new URL(path, SITE_URL).href;
}

export function getIndustryPage(slug) {
  return INDUSTRY_PAGES.find((page) => page.slug === slug);
}

export function formatIndustryLabel(slug = '') {
  const page = getIndustryPage(slug);
  if (page) return page.label;

  const upper = ['ai', 'saas', 'api', 'b2b', 'web3'];
  if (upper.includes(slug.toLowerCase())) return slug.toUpperCase();
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
