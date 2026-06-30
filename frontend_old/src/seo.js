export const SITE_URL = 'https://openangels.xyz';
export const PRODUCT_NAME = 'OpenAngels';
export const INVESTOR_COUNT = '4,700+';
export const LEGAL_UPDATED_LABEL = 'June 21, 2026';
export const SEO_LASTMOD = '2026-06-21';

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
