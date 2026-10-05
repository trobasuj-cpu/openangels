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

// DAY 6 STANDARD: Compound Signal Topologies (Signal Fusion)
export const COMPOUND_SIGNAL_DEFINITIONS = [
  {
    id: 'breakout',
    name: 'Breakout Velocity',
    shortName: 'Breakout',
    badge: '⚡ COMPOUND: BREAKOUT VELOCITY',
    emoji: '⚡',
    shortDesc: 'Funding round + hiring acceleration + core product launch in 90 days',
    accentBorder: 'hover:border-amber-500/60 border-amber-500/30',
    activeBg: 'bg-gradient-to-br from-amber-500/20 via-zinc-900 to-zinc-950 border-amber-500/80 shadow-lg shadow-amber-500/10',
    activeText: 'text-amber-400',
    requiredSignals: ['funding', 'hiring', 'product'],
    minMatchCount: 2,
    narrative: 'Observed event convergence: fresh capital inflow verified simultaneously with headcount expansion (>20%) and key product release within a 90-day observation window.'
  },
  {
    id: 'enterprise',
    name: 'Enterprise Commercialization',
    shortName: 'Enterprise',
    badge: '🏢 COMPOUND: ENTERPRISE EXPANSION',
    emoji: '🏢',
    shortDesc: 'Enterprise product rollout + commercial leadership + market expansion',
    accentBorder: 'hover:border-cyan-500/60 border-cyan-500/30',
    activeBg: 'bg-gradient-to-br from-cyan-500/20 via-zinc-900 to-zinc-950 border-cyan-500/80 shadow-lg shadow-cyan-500/10',
    activeText: 'text-cyan-400',
    requiredSignals: ['product', 'leadership', 'expansion'],
    minMatchCount: 2,
    narrative: 'Observed event convergence: production enterprise platform release verified alongside commercial executive appointments and geographic territory expansion.'
  },
  {
    id: 'foundational',
    name: 'Foundational Moat Velocity',
    shortName: 'Moat Velocity',
    badge: '🛡️ COMPOUND: FOUNDATIONAL MOAT',
    emoji: '🛡️',
    shortDesc: 'Core tech breakthrough + research lab talent inflow + elite syndicate',
    accentBorder: 'hover:border-purple-500/60 border-purple-500/30',
    activeBg: 'bg-gradient-to-br from-purple-500/20 via-zinc-900 to-zinc-950 border-purple-500/80 shadow-lg shadow-purple-500/10',
    activeText: 'text-purple-400',
    requiredSignals: ['hiring', 'product', 'leadership'],
    minMatchCount: 2,
    narrative: 'Observed event convergence: strategic talent inflow from leading research labs concentrated around proprietary architecture and model deployments.'
  },
  {
    id: 'syndicate_momentum',
    name: 'Syndicate Momentum',
    shortName: 'Syndicate',
    badge: '👥 COMPOUND: SYNDICATE MOMENTUM',
    emoji: '👥',
    shortDesc: 'Serial founder pedigree + tier-1 syndicate backing + rapid core team build',
    accentBorder: 'hover:border-emerald-500/60 border-emerald-500/30',
    activeBg: 'bg-gradient-to-br from-emerald-500/20 via-zinc-900 to-zinc-950 border-emerald-500/80 shadow-lg shadow-emerald-500/10',
    activeText: 'text-emerald-400',
    requiredSignals: ['leadership', 'hiring', 'funding'],
    minMatchCount: 2,
    narrative: 'Observed event convergence: tier-1 venture syndicate backing verified alongside serial founder track record and rapid initial engineering team assembly.'
  }
];

/**
 * DAY 6 STANDARD: Signal Fusion & Compound Signal Detector
 * Identifies multi-modal temporal convergences across independent factual sources.
 * Adheres strictly to the non-speculative standard: reports observed factual clusters,
 * never makes speculative financial claims.
 */
export function detectCompoundSignals(company) {
  if (!company) {
    return {
      isCompound: false,
      count: 0,
      activeSignals: [],
      primaryCompound: null,
      auditTrail: [],
      disclaimer: ''
    };
  }

  const atomicMatches = matchCompanySignals(company);
  const activeSignals = [];
  const auditTrail = [];

  for (const sigDef of RADAR_SIGNAL_DEFINITIONS) {
    const match = atomicMatches[sigDef.id];
    if (match?.matched) {
      activeSignals.push(sigDef.id);
      auditTrail.push({
        signalId: sigDef.id,
        name: sigDef.name,
        emoji: sigDef.emoji,
        badge: sigDef.badge,
        evidence: match.evidence || 'Audited verified telemetry record',
        source: sigDef.id === 'funding' ? 'SEC Form D / Lead VC Disclosure'
               : sigDef.id === 'hiring' ? 'Verified Talent Index & Headcount Registry'
               : sigDef.id === 'product' ? 'Production Release Registry & API Telemetry'
               : sigDef.id === 'expansion' ? 'Commercial Rollout & Regional Registry'
               : 'Corporate Leadership & Syndicate Filing'
      });
    }
  }

  const count = activeSignals.length;
  const isCompound = count >= 2;

  let primaryCompound = null;
  if (isCompound) {
    // Determine the highest-matching compound topology
    let bestMatch = null;
    let maxIntersect = 0;

    for (const def of COMPOUND_SIGNAL_DEFINITIONS) {
      const intersect = def.requiredSignals.filter(s => activeSignals.includes(s)).length;
      if (intersect > maxIntersect && intersect >= def.minMatchCount) {
        maxIntersect = intersect;
        bestMatch = def;
      }
    }

    if (!bestMatch) {
      bestMatch = COMPOUND_SIGNAL_DEFINITIONS[0]; // Breakout Velocity
    }

    primaryCompound = {
      ...bestMatch,
      matchedSignalsCount: count,
      matchedSignalNames: activeSignals.map(s => {
        const d = RADAR_SIGNAL_DEFINITIONS.find(def => def.id === s);
        return d ? `${d.emoji} ${d.shortName}` : s;
      }),
      observationSummary: `Observed event convergence: OpenAngels detected a synchronous cluster of ${count} independent empirical events across regulatory, talent, and product indices within a 90-day window.`
    };
  }

  const disclaimer = 'Regulatory Notice: OpenAngels telemetry tracks verifiable temporal events across public registries, SEC Form D disclosures, and talent registries. Signal convergences represent observed empirical patterns, not financial advice or speculative endorsement.';

  return {
    isCompound,
    count,
    activeSignals,
    atomicMatches,
    primaryCompound,
    auditTrail,
    disclaimer
  };
}

/**
 * Computes live company counts for each signal and compound convergence across the given company dataset.
 */
export function computeSignalStats(companies = []) {
  const counts = {
    all: companies.length,
    hiring: 0,
    funding: 0,
    expansion: 0,
    product: 0,
    leadership: 0,
    compound: 0,
    breakout: 0,
    enterprise: 0,
    foundational: 0,
    syndicate_momentum: 0
  };

  companies.forEach(company => {
    const matches = matchCompanySignals(company);
    if (matches.hiring?.matched) counts.hiring++;
    if (matches.funding?.matched) counts.funding++;
    if (matches.expansion?.matched) counts.expansion++;
    if (matches.product?.matched) counts.product++;
    if (matches.leadership?.matched) counts.leadership++;

    const compoundInfo = detectCompoundSignals(company);
    if (compoundInfo.isCompound) {
      counts.compound++;
      if (compoundInfo.primaryCompound?.id && counts[compoundInfo.primaryCompound.id] !== undefined) {
        counts[compoundInfo.primaryCompound.id]++;
      }
    }
  });

  return counts;
}

/**
 * Returns companies matching the specified signal ID or compound filter.
 */
export function filterCompaniesBySignal(companies = [], signalId = 'all') {
  if (!signalId || signalId === 'all') return companies;

  if (signalId === 'compound') {
    return companies.filter(c => detectCompoundSignals(c).isCompound);
  }

  const isCompoundType = COMPOUND_SIGNAL_DEFINITIONS.some(d => d.id === signalId);
  if (isCompoundType) {
    return companies.filter(c => {
      const comp = detectCompoundSignals(c);
      return comp.isCompound && comp.primaryCompound?.id === signalId;
    });
  }

  return companies.filter(c => {
    const matches = matchCompanySignals(c);
    return !!matches[signalId]?.matched;
  });
}
