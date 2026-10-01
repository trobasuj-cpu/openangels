// OpenAngels Emerging Signals Radar Engine (Day 5 Standard)
// Institutional-grade temporal signals classifier and telemetry counter.

export const RADAR_SIGNAL_DEFINITIONS = [
  {
    id: 'hiring',
    name: 'Hiring acceleration',
    shortName: 'Hiring',
    emoji: '🔥',
    badge: '🔥 HIRING ACCELERATION',
    shortDesc: 'Aggressive headcount expansion & engineering team growth',
    subtext: '+30% to +50% 90d velocity',
    accentBorder: 'hover:border-orange-500/50 border-orange-500/20',
    activeBg: 'bg-gradient-to-br from-orange-500/20 via-red-950/40 to-zinc-900 border-orange-500/80 shadow-lg shadow-orange-500/10',
    activeText: 'text-orange-400',
    pulseColor: 'bg-orange-400',
    dotClass: 'bg-orange-400',
    badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/30'
  },
  {
    id: 'funding',
    name: 'New funding',
    shortName: 'Funding',
    emoji: '💰',
    badge: '💰 NEW FUNDING',
    shortDesc: 'Recent seed/growth rounds & valuation step-ups',
    subtext: 'Audited SEC Form D & Lead VCs',
    accentBorder: 'hover:border-emerald-500/50 border-emerald-500/20',
    activeBg: 'bg-gradient-to-br from-emerald-500/20 via-zinc-900 to-zinc-950 border-emerald-500/80 shadow-lg shadow-emerald-500/10',
    activeText: 'text-emerald-400',
    pulseColor: 'bg-emerald-400',
    dotClass: 'bg-emerald-400',
    badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  },
  {
    id: 'expansion',
    name: 'Market expansion',
    shortName: 'Expansion',
    emoji: '🌍',
    badge: '🌍 MARKET EXPANSION',
    shortDesc: 'Global geographic rollouts, compute clusters & market entry',
    subtext: 'International enterprise scale',
    accentBorder: 'hover:border-cyan-500/50 border-cyan-500/20',
    activeBg: 'bg-gradient-to-br from-cyan-500/20 via-blue-950/40 to-zinc-900 border-cyan-500/80 shadow-lg shadow-cyan-500/10',
    activeText: 'text-cyan-400',
    pulseColor: 'bg-cyan-400',
    dotClass: 'bg-cyan-400',
    badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
  },
  {
    id: 'product',
    name: 'Product launch',
    shortName: 'Product',
    emoji: '🚀',
    badge: '🚀 PRODUCT LAUNCH',
    shortDesc: 'Frontier model releases, v2 rollouts & autonomous agent debuts',
    subtext: 'Next-gen platform breakthroughs',
    accentBorder: 'hover:border-purple-500/50 border-purple-500/20',
    activeBg: 'bg-gradient-to-br from-purple-500/20 via-indigo-950/40 to-zinc-900 border-purple-500/80 shadow-lg shadow-purple-500/10',
    activeText: 'text-purple-400',
    pulseColor: 'bg-purple-400',
    dotClass: 'bg-purple-400',
    badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30'
  },
  {
    id: 'leadership',
    name: 'Leadership change',
    shortName: 'Leadership',
    emoji: '👥',
    badge: '👥 LEADERSHIP & SYNDICATE',
    shortDesc: 'Executive hires, co-founders & tier-1 venture syndicates',
    subtext: 'Tier-1 venture syndicate additions',
    accentBorder: 'hover:border-amber-500/50 border-amber-500/20',
    activeBg: 'bg-gradient-to-br from-amber-500/20 via-yellow-950/30 to-zinc-900 border-amber-500/80 shadow-lg shadow-amber-500/10',
    activeText: 'text-amber-400',
    pulseColor: 'bg-amber-400',
    dotClass: 'bg-amber-400',
    badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  }
];

/**
 * Deterministically inspects a company object and returns evidence for all 5 signals.
 */
export function matchCompanySignals(company) {
  if (!company) return {};

  const result = {
    hiring: { matched: false, evidence: null, badge: '🔥 HIRING ACCELERATION' },
    funding: { matched: false, evidence: null, badge: '💰 NEW FUNDING' },
    expansion: { matched: false, evidence: null, badge: '🌍 MARKET EXPANSION' },
    product: { matched: false, evidence: null, badge: '🚀 PRODUCT LAUNCH' },
    leadership: { matched: false, evidence: null, badge: '👥 LEADERSHIP & SYNDICATE' }
  };

  const rawSignals = [
    ...(company.investmentSignals?.signals || []),
    ...(company.signals || []),
    ...(company.timeline || [])
  ];

  // 1. HIRING ACCELERATION
  const hiringData = company.hiring || {};
  const growthRate = company.employeeGrowth90d || company.employee_growth_90d || '';
  const openRoles = hiringData.openRoles || hiringData.open_roles || 0;

  for (const s of rawSignals) {
    const text = `${s.name || ''} ${s.badge || ''} ${s.title || ''} ${s.event || ''} ${s.category || ''} ${s.evidence || ''}`.toLowerCase();
    if (
      s.category === 'talent' ||
      s.category === 'hiring' ||
      text.includes('hiring') ||
      text.includes('headcount') ||
      text.includes('talent') ||
      text.includes('recruiting') ||
      text.includes('engineers added')
    ) {
      result.hiring.matched = true;
      result.hiring.evidence = s.evidence || s.title || s.event || `${openRoles} open roles • ${growthRate}`;
      break;
    }
  }

  if (!result.hiring.matched) {
    if (openRoles > 0 || /velocity|growth|\+\d+%/i.test(growthRate)) {
      result.hiring.matched = true;
      result.hiring.evidence = growthRate ? `${growthRate} (${openRoles ? `${openRoles} open roles` : 'rapid scaling'})` : `${openRoles} open roles`;
    }
  }

  // 2. NEW FUNDING
  for (const s of rawSignals) {
    const text = `${s.name || ''} ${s.badge || ''} ${s.title || ''} ${s.event || ''} ${s.category || ''} ${s.evidence || ''}`.toLowerCase();
    if (
      s.category === 'capital' ||
      s.category === 'funding' ||
      text.includes('funding') ||
      text.includes('raised') ||
      text.includes('series') ||
      text.includes('seed round') ||
      text.includes('valuation')
    ) {
      result.funding.matched = true;
      result.funding.evidence = s.evidence || s.title || s.event || `Raised ${company.lastRoundAmount || company.last_round_amount || 'growth capital'}`;
      break;
    }
  }

  if (!result.funding.matched) {
    const raised = company.totalRaised || company.total_raised || company.funding?.totalRaised;
    const round = company.lastRoundAmount || company.last_round_amount || company.funding?.lastRoundAmount;
    if (raised || round) {
      result.funding.matched = true;
      result.funding.evidence = round ? `Raised ${round} in recent round` : `Total raised: ${raised}`;
    }
  }

  // 3. MARKET EXPANSION
  for (const s of rawSignals) {
    const text = `${s.name || ''} ${s.badge || ''} ${s.title || ''} ${s.event || ''} ${s.category || ''} ${s.evidence || ''} ${s.explanation || ''}`.toLowerCase();
    if (
      s.category === 'expansion' ||
      s.category === 'commercial' ||
      text.includes('expansion') ||
      text.includes('expand') ||
      text.includes('compute') ||
      text.includes('global') ||
      text.includes('europe') ||
      text.includes('gcc') ||
      text.includes('international') ||
      text.includes('enterprise adoption') ||
      text.includes('jurisdictions') ||
      text.includes('cluster')
    ) {
      result.expansion.matched = true;
      result.expansion.evidence = s.evidence || s.title || s.event || 'Expanding global market presence and regional enterprise coverage';
      break;
    }
  }

  if (!result.expansion.matched) {
    const growthSig = JSON.stringify(company.growthSignals || company.growth_signals || {});
    if (/global|expansion|international|enterprises|jurisdiction/i.test(growthSig)) {
      result.expansion.matched = true;
      result.expansion.evidence = 'Expanding footprint across enterprise and regional markets';
    }
  }

  // 4. PRODUCT LAUNCH
  for (const s of rawSignals) {
    const text = `${s.name || ''} ${s.badge || ''} ${s.title || ''} ${s.event || ''} ${s.category || ''} ${s.evidence || ''}`.toLowerCase();
    if (
      s.category === 'product' ||
      text.includes('launch') ||
      text.includes('launched') ||
      text.includes('released') ||
      text.includes('unveiled') ||
      text.includes('v2') ||
      text.includes('model') ||
      text.includes('agent') ||
      text.includes('composer') ||
      text.includes('devin') ||
      text.includes('feature') ||
      text.includes('platform')
    ) {
      result.product.matched = true;
      result.product.evidence = s.evidence || s.title || s.event || 'Launched next-generation AI platform release';
      break;
    }
  }

  if (!result.product.matched) {
    if (Array.isArray(company.products) && company.products.length > 0) {
      result.product.matched = true;
      result.product.evidence = `Active products: ${company.products.slice(0, 2).join(', ')}`;
    }
  }

  // 5. LEADERSHIP CHANGE & SYNDICATE
  for (const s of rawSignals) {
    const text = `${s.name || ''} ${s.badge || ''} ${s.title || ''} ${s.event || ''} ${s.category || ''} ${s.evidence || ''}`.toLowerCase();
    if (
      s.category === 'alliance' ||
      s.category === 'alliances' ||
      s.category === 'leadership' ||
      text.includes('partnership') ||
      text.includes('alliance') ||
      text.includes('joined') ||
      text.includes('appointed') ||
      text.includes('leadership') ||
      text.includes('ceo') ||
      text.includes('cto') ||
      text.includes('board') ||
      text.includes('syndicate')
    ) {
      result.leadership.matched = true;
      result.leadership.evidence = s.evidence || s.title || s.event || 'Key executive leadership and strategic venture syndicate additions';
      break;
    }
  }

  if (!result.leadership.matched) {
    const invCount = Array.isArray(company.investors) ? company.investors.length : 0;
    const foundersCount = Array.isArray(company.founders) ? company.founders.length : 0;
    if (invCount >= 2 || foundersCount >= 2) {
      result.leadership.matched = true;
      result.leadership.evidence = invCount > 0 ? `Syndicate backed by ${company.investors.slice(0, 2).join(', ')}` : 'Founded by seasoned serial tech entrepreneurs';
    }
  }

  return result;
}

/**
 * Computes live company counts for each of the 5 signals across the given company dataset.
 */
export function computeSignalStats(companies = []) {
  const counts = {
    all: companies.length,
    hiring: 0,
    funding: 0,
    expansion: 0,
    product: 0,
    leadership: 0
  };

  companies.forEach(company => {
    const matches = matchCompanySignals(company);
    if (matches.hiring?.matched) counts.hiring++;
    if (matches.funding?.matched) counts.funding++;
    if (matches.expansion?.matched) counts.expansion++;
    if (matches.product?.matched) counts.product++;
    if (matches.leadership?.matched) counts.leadership++;
  });

  return counts;
}

/**
 * Returns companies matching the specified signal ID ('all', 'hiring', 'funding', 'expansion', 'product', 'leadership').
 */
export function filterCompaniesBySignal(companies = [], signalId = 'all') {
  if (!signalId || signalId === 'all') return companies;
  return companies.filter(c => {
    const matches = matchCompanySignals(c);
    return !!matches[signalId]?.matched;
  });
}
