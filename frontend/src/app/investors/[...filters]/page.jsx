import { cache } from 'react';
import { supabase } from '@/lib/supabase';
import {
  absoluteUrl, formatIndustryLabel, getIndustryPage,
  INVESTOR_COUNT, PRODUCT_NAME, SITE_URL,
  STAGE_SLUGS, GEO_REGIONS, POPULAR_HUBS,
  parseFilters, getStageInfo, getGeoInfo, isUSLocation,
} from '@/seo.js';
import Link from 'next/link';
import { ArrowLeft, MapPin, Filter, ChevronRight } from 'lucide-react';
import Footer from '@/components/Footer';
import AddToCrmButton from '@/components/AddToCrmButton';
import InvestorAvatar from '@/components/InvestorAvatar';
import { notFound } from 'next/navigation';

export const revalidate = 86400; // Cache hub pages on Vercel Edge CDN for 24h
export const dynamicParams = true;

export async function generateStaticParams() {
  return POPULAR_HUBS.slice(0, 12).map((h) => ({ filters: h.filters }));
}

const CURRENT_YEAR = new Date().getFullYear();

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Score and deterministically order investors so each hub showcases
 * its highest-signal, sector-relevant verified profiles first — without
 * duplicating the same alphabetical "A" names across every hub page.
 */
function rankInvestorsForHub(investors, parsed, canonicalPath) {
  const indKeyword = (parsed.industry || '').toLowerCase().replace(/-/g, ' ');
  const stageKeyword = (parsed.stage || '').toLowerCase().replace(/-/g, ' ');

  return [...investors]
    .map((inv) => {
      let score = 0;
      const bio = (inv.bio || '').toLowerCase();
      const rawPort = inv.portfolio || inv.past_investments;
      const portArr = Array.isArray(rawPort)
        ? rawPort.filter(Boolean)
        : typeof rawPort === 'string' && rawPort.trim()
        ? rawPort.split(',').map((s) => s.trim()).filter(Boolean)
        : [];

      // 1. Explicit mention of target industry in bio or portfolio
      if (indKeyword && (bio.includes(indKeyword) || portArr.some((p) => p.toLowerCase().includes(indKeyword)))) {
        score += 90;
      }
      if (stageKeyword && bio.includes(stageKeyword)) {
        score += 35;
      }

      // 2. Profile completeness & authority signals
      if (inv.avatar_url) score += 25;
      if (portArr.length > 0) score += Math.min(portArr.length * 8, 40);
      if (bio.length > 60 && !bio.includes('public investor list')) score += 30;
      if (inv.has_email) score += 15;
      if (inv.has_twitter || inv.has_linkedin) score += 15;

      // 3. Deterministic hub-specific variation (breaks ties uniquely per hub URL)
      const tieBreaker = hashString(`${inv.slug || inv.id}::${canonicalPath}`) % 45;
      score += tieBreaker;

      return { inv, score, portArr };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.inv);
}

/**
 * Build a Supabase query based on parsed filters.
 * Returns { query, industryLabel, stageLabel, geoLabel }.
 */
function buildQuery(parsed, selectClause = '*', countOnly = false) {
  let query = supabase
    .from('investors_public')
    .select(selectClause, countOnly ? { count: 'exact', head: true } : { count: 'exact' });

  const industryLabel = parsed.industry ? formatIndustryLabel(parsed.industry) : null;
  const stageInfo = parsed.stage ? getStageInfo(parsed.stage) : null;
  const geoInfo = parsed.geo ? getGeoInfo(parsed.geo) : null;

  if (parsed.industry) {
    query = query.contains('industries', [parsed.industry]);
  }

  if (stageInfo) {
    query = query.contains('stages', [stageInfo.dbValue]);
  }

  if (geoInfo && !geoInfo.countryMatch && geoInfo.locations) {
    query = query.in('location', geoInfo.locations);
  }

  return {
    query,
    industryLabel,
    stageLabel: stageInfo?.label || null,
    geoLabel: geoInfo?.label || null,
    geoInfo,
  };
}

function ConversationalFAQ({ industryLabel, stageLabel, geoLabel, totalMatches, topInvestorNames }) {
  const i = industryLabel || 'early-stage';
  const s = stageLabel ? `${stageLabel} ` : '';
  const g = geoLabel ? ` in ${geoLabel}` : '';
  const c = totalMatches > 0 ? totalMatches.toLocaleString() : 'verified';
  const topNamesStr = topInvestorNames && topInvestorNames.length > 0
    ? topInvestorNames.slice(0, 5).join(', ')
    : 'prominent operator-angels and syndicate leads';

  const questions = [
    {
      q: `Who are the top ${s}${i} angel investors${g} in ${CURRENT_YEAR}?`,
      a: `OpenAngels tracks ${c} verified ${s}${i} angel investors and early-stage venture backers${g}, including ${topNamesStr}. Each profile includes typical check sizes, preferred stages, portfolio startups, and verified founder pitch channels.`,
    },
    {
      q: `What is the typical check size for ${s}${i} angel investors${g}?`,
      a: `Most individual ${s}${i} angel investors${g} write checks between $10,000 and $100,000, while super-angels and syndicate leads typically deploy $100,000 to $500,000+ into pre-seed and seed rounds.`,
    },
    {
      q: `How can startup founders contact and pitch ${i} angel investors${g}?`,
      a: `Founders can filter our ${c} ${i} investor profiles${g} on OpenAngels, inspect their past investments to verify thesis alignment, and unlock direct verified email addresses and AI-personalized cold pitch drafts.`,
    },
  ];

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.a,
      },
    })),
  };

  return (
    <section className="mt-14 pt-8 border-t border-zinc-800/80" aria-labelledby="faq-heading">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <h2 id="faq-heading" className="text-xl font-semibold text-white tracking-tight mb-5">
        Frequently Asked Questions — {s}{i} Investors{g}
      </h2>
      <div className="space-y-3">
        {questions.map((q, idx) => (
          <div key={idx} className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 sm:p-5">
            <h3 className="text-sm sm:text-base font-semibold text-white mb-1.5">{q.q}</h3>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">{q.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

const HUB_COLUMNS = '*';

const fetchHubInvestors = cache(async (filterKey) => {
  const filters = filterKey.split('/').filter(Boolean);
  const parsed = parseFilters(filters);
  const { query, industryLabel, stageLabel, geoLabel, geoInfo } = buildQuery(parsed, HUB_COLUMNS, false);
  const canonicalSegments = [parsed.industry, parsed.stage, parsed.geo].filter(Boolean);
  const canonicalPath = `/investors/${canonicalSegments.length > 0 ? canonicalSegments.join('/') : filters.join('/')}`;

  let investors = [];
  let totalMatches = 0;

  try {
    const result = await query.order('has_email', { ascending: false }).limit(300);
    if (result.error) throw result.error;

    let data = result.data || [];
    if (geoInfo?.countryMatch) {
      data = data.filter((inv) => isUSLocation(inv.location));
    }

    const ranked = rankInvestorsForHub(data, parsed, canonicalPath);
    investors = ranked.slice(0, 100);
    totalMatches = geoInfo?.countryMatch ? data.length : (result.count || data.length);
  } catch (err) {
    console.error('Error fetching filtered investors:', err);
  }

  return { parsed, investors, totalMatches, industryLabel, stageLabel, geoLabel, canonicalPath };
});

function buildHubTitle(numInvestors, typeStr, geoStr, currentYear) {
  const base = typeStr || 'Startup';
  let cand = `Top ${numInvestors > 0 ? numInvestors + ' ' : ''}${base} Investors${geoStr} (${currentYear})`;
  if (cand.length <= 58) return cand;
  cand = `${base} Angel Investors${geoStr} (${currentYear} List)`;
  if (cand.length <= 58) return cand;
  return `${base} Investors${geoStr} (${currentYear})`.slice(0, 58);
}

export async function generateMetadata({ params }) {
  const { filters } = await params;
  const parsed = parseFilters(filters);

  if (!parsed.industry && !parsed.stage && !parsed.geo) {
    return {};
  }

  const { totalMatches: numInvestors, industryLabel, stageLabel, geoLabel, canonicalPath } = await fetchHubInvestors(filters.join('/'));

  const parts = [industryLabel, stageLabel].filter(Boolean);
  const typeStr = parts.length > 0 ? parts.join(' ') : '';
  const geoStr = geoLabel ? ` in ${geoLabel}` : '';

  const title = buildHubTitle(numInvestors, typeStr, geoStr, CURRENT_YEAR);

  const description = `Verified ${CURRENT_YEAR} directory of ${numInvestors > 0 ? numInvestors.toLocaleString() : 'active'} ${typeStr} angel investors & seed VCs${geoStr}. Compare check sizes, backed startups, and direct founder pitch emails on OpenAngels.`.replace(/\s+/g, ' ').trim();

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(canonicalPath) },
    ...(numInvestors === 0 && { robots: { index: false, follow: true } }),
    openGraph: {
      title,
      description,
      url: absoluteUrl(canonicalPath),
      siteName: 'OpenAngels',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function FilteredInvestorsPage({ params }) {
  const { filters } = await params;
  const parsed = parseFilters(filters);

  if (!parsed.industry && !parsed.stage && !parsed.geo) {
    notFound();
  }

  const { investors, totalMatches, industryLabel, stageLabel, geoLabel, canonicalPath } = await fetchHubInvestors(filters.join('/'));

  const parts = [industryLabel, stageLabel].filter(Boolean);
  const typeStr = parts.length > 0 ? parts.join(' ') : '';
  const geoStr = geoLabel ? ` in ${geoLabel}` : '';

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${typeStr} Angel Investors${geoStr} (${CURRENT_YEAR})`,
    url: absoluteUrl(canonicalPath),
    description: `Verified directory of ${totalMatches} ${typeStr} angel investors and VCs${geoStr} on OpenAngels.`,
    isPartOf: {
      '@type': 'WebSite',
      name: PRODUCT_NAME,
      url: SITE_URL,
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
        { '@type': 'ListItem', position: 2, name: 'Directory', item: absoluteUrl('/directory') },
        { '@type': 'ListItem', position: 3, name: `${typeStr || 'Angel'} Investors${geoStr}`, item: absoluteUrl(canonicalPath) },
      ],
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: Math.min(investors.length, 50),
      itemListElement: investors.slice(0, 15).map((investor, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: absoluteUrl(`/investor/${investor.slug || investor.id}`),
        name: investor.name,
        description: investor.bio || `${typeStr} angel investor on OpenAngels`,
      })),
    },
  };

  const stageLinks = !parsed.stage
    ? Object.entries(STAGE_SLUGS).map(([slug, info]) => ({
        href: parsed.industry
          ? `/investors/${parsed.industry}/${slug}${parsed.geo ? `/${parsed.geo}` : ''}`
          : `/investors/${slug}${parsed.geo ? `/${parsed.geo}` : ''}`,
        label: info.label,
      }))
    : [];

  const geoLinks = !parsed.geo
    ? Object.entries(GEO_REGIONS)
        .slice(0, 12)
        .map(([slug, info]) => ({
          href: parsed.industry
            ? `/investors/${parsed.industry}${parsed.stage ? `/${parsed.stage}` : ''}/${slug}`
            : `/investors/${parsed.stage || ''}/${slug}`.replace('//', '/'),
          label: info.label.replace(/^the /, ''),
        }))
    : [];

  const relatedHubs = POPULAR_HUBS.filter((hub) => {
    const hubParsed = parseFilters(hub.filters);
    const shares =
      hubParsed.industry === parsed.industry ||
      hubParsed.stage === parsed.stage ||
      hubParsed.geo === parsed.geo;
    const identical =
      hubParsed.industry === parsed.industry &&
      hubParsed.stage === parsed.stage &&
      hubParsed.geo === parsed.geo;
    return shares && !identical;
  }).slice(0, 8);

  const tableInvestors = investors.slice(0, 12);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />

      <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-400 min-w-0">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <Link href="/directory" className="hover:text-white transition-colors">
              Directory
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <span className="text-zinc-200 font-medium truncate">
              {typeStr || 'Angel'} Investors{geoStr}
            </span>
          </nav>

          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors text-xs font-medium shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>All Investors</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full">
        {/* Hero & GEO Direct Answer Block */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 mb-3 tabular-nums">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{totalMatches.toLocaleString()} Verified Profiles • {CURRENT_YEAR} Dataset</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-white mb-3">
            Top {totalMatches.toLocaleString()} {typeStr} Angel Investors{geoStr} ({CURRENT_YEAR})
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-3xl leading-relaxed">
            OpenAngels tracks <strong className="text-zinc-200 font-medium">{totalMatches.toLocaleString()} verified angel investors and early-stage venture backers</strong>
            {industryLabel ? ` actively funding ${industryLabel} startups` : ''}
            {stageLabel ? ` at the ${stageLabel} stage` : ''}
            {geoStr}. Notable active investors in this cohort include{' '}
            <span className="text-zinc-300">
              {investors.slice(0, 5).map((i) => i.name).join(', ')}
            </span>
            . Compare typical check sizes, past portfolio deals, and direct founder pitch emails below.
          </p>
        </div>

        {/* Faceted Navigation — Stage & Geo Refinement */}
        {(stageLinks.length > 0 || geoLinks.length > 0) && (
          <div className="mb-8 p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/80 space-y-4">
            {stageLinks.length > 0 && (
              <div>
                <h2 className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Filter by Funding Stage</span>
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {stageLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="px-3 py-1 rounded-md text-xs font-medium border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {geoLinks.length > 0 && (
              <div>
                <h2 className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Filter by Location</span>
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {geoLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="px-3 py-1 rounded-md text-xs font-medium border border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Featured Snippet Comparison Table (Position #0 & AI Overviews Target) */}
        {tableInvestors.length > 0 && (
          <section className="mb-10" aria-labelledby="comparison-table-heading">
            <div className="flex items-center justify-between mb-3">
              <h2 id="comparison-table-heading" className="text-base sm:text-lg font-semibold text-white tracking-tight">
                Featured {typeStr} Angel Investors{geoStr} — Quick Comparison
              </h2>
              <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
                Showing Top {tableInvestors.length} of {totalMatches.toLocaleString()}
              </span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-900/30">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-400 uppercase tracking-wider text-[10.5px]">
                    <th className="py-2.5 px-3.5 font-medium">Investor</th>
                    <th className="py-2.5 px-3.5 font-medium">Location</th>
                    <th className="py-2.5 px-3.5 font-medium">Stages</th>
                    <th className="py-2.5 px-3.5 font-medium">Core Sectors &amp; Portfolio</th>
                    <th className="py-2.5 px-3.5 font-medium text-right">Dossier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {tableInvestors.map((inv) => {
                    const rawStages = inv.stages || inv.stage;
                    const stgArr = Array.isArray(rawStages) ? rawStages : typeof rawStages === 'string' ? [rawStages] : ['Pre-seed', 'Seed'];
                    const rawInd = inv.industries || inv.industry;
                    const indArr = Array.isArray(rawInd) ? rawInd : typeof rawInd === 'string' ? [rawInd] : [];
                    return (
                      <tr key={inv.id} className="hover:bg-zinc-900/60 transition-colors">
                        <td className="py-2.5 px-3.5 font-medium text-white whitespace-nowrap">
                          <Link href={`/investor/${inv.slug || inv.id}`} className="hover:underline">
                            {inv.name}
                          </Link>
                        </td>
                        <td className="py-2.5 px-3.5 text-zinc-400 whitespace-nowrap">
                          {inv.location || 'Global / US'}
                        </td>
                        <td className="py-2.5 px-3.5 text-zinc-300 whitespace-nowrap">
                          {stgArr.slice(0, 2).join(', ')}
                        </td>
                        <td className="py-2.5 px-3.5 text-zinc-400 max-w-xs truncate">
                          {indArr.slice(0, 4).join(', ')}
                        </td>
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                          <Link
                            href={`/investor/${inv.slug || inv.id}`}
                            className="text-zinc-300 hover:text-white font-medium underline-offset-2 hover:underline"
                          >
                            View Profile →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Investor Dossier Cards */}
        <section aria-label="Investor Profiles" className="space-y-3">
          {investors.length === 0 ? (
            <div className="text-center py-14 px-6 bg-zinc-900/40 rounded-xl border border-zinc-800">
              <h3 className="text-base font-semibold text-white mb-2">
                No investors found matching this exact filter combination
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto mb-5">
                {parsed.industry
                  ? `We don't have active ${stageLabel || ''} investors matching ${industryLabel}${geoLabel ? ` in ${geoLabel}` : ''} yet.`
                  : `No investors found matching your filter criteria.`}
              </p>
              <div className="flex flex-wrap justify-center gap-2.5">
                {parsed.industry && (
                  <Link
                    href={`/investors/${parsed.industry}`}
                    className="px-4 py-2 rounded-lg bg-white text-zinc-950 text-xs font-semibold hover:bg-zinc-200 transition-colors"
                  >
                    View all {industryLabel} Investors →
                  </Link>
                )}
                <Link
                  href="/directory"
                  className="px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs font-medium hover:bg-zinc-800 transition-colors"
                >
                  Browse Directory
                </Link>
              </div>
            </div>
          ) : (
            investors.map((investor) => {
              const rawPort = investor.portfolio || investor.past_investments;
              const portList = Array.isArray(rawPort)
                ? rawPort.filter(Boolean)
                : typeof rawPort === 'string' && rawPort.trim()
                ? rawPort.split(',').map((s) => s.trim()).filter(Boolean)
                : [];
              const rawInd = investor.industries || investor.industry;
              const indList = Array.isArray(rawInd) ? rawInd : typeof rawInd === 'string' ? [rawInd] : [];

              return (
                <div
                  key={investor.id}
                  className="group bg-zinc-900/40 hover:bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-4 sm:p-5 transition-colors duration-150"
                >
                  <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <InvestorAvatar
                          name={investor.name}
                          avatarUrl={investor.avatar_url || investor.avatar}
                          className="w-11 h-11 rounded-xl shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-base font-semibold text-white truncate">
                              <Link href={`/investor/${investor.slug || investor.id}`} className="hover:underline">
                                {investor.name}
                              </Link>
                            </h2>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-[10.5px] font-medium text-zinc-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Verified
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5 flex-wrap">
                            {investor.firm && <span className="text-zinc-300 font-medium">{investor.firm}</span>}
                            {investor.location && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-zinc-500" /> {investor.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {investor.bio && (
                        <p className="text-xs sm:text-sm text-zinc-400 mt-3 line-clamp-2 leading-relaxed">
                          {investor.bio}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {(() => {
                          const rawStages = investor.stages || investor.stage;
                          const stagesArr = Array.isArray(rawStages) ? rawStages : typeof rawStages === 'string' ? [rawStages] : [];
                          return stagesArr.slice(0, 3).map((s) => (
                            <span key={s} className="text-[11px] font-medium text-zinc-300 bg-zinc-800/80 border border-zinc-700/60 px-2 py-0.5 rounded-md">
                              {STAGE_SLUGS[s]?.label || s}
                            </span>
                          ));
                        })()}
                        {indList.slice(0, 4).map((ind) => (
                          <span key={ind} className="text-[11px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">
                            {ind}
                          </span>
                        ))}
                        {portList.slice(0, 3).map((comp) => (
                          <span key={comp} className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                            Backed: {comp}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex sm:items-center gap-2 shrink-0 pt-2 md:pt-0">
                      <AddToCrmButton investorId={investor.id} />
                      <Link
                        href={`/investor/${investor.slug || investor.id}`}
                        className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-colors shadow-sm"
                      >
                        View Dossier
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* Related Hubs Section for Cross-Linking */}
        {relatedHubs.length > 0 && (
          <section className="mt-14 pt-8 border-t border-zinc-800/80" aria-labelledby="related-hubs-heading">
            <h2 id="related-hubs-heading" className="text-base sm:text-lg font-semibold text-white mb-4">
              Related Investor Directories
            </h2>
            <div className="flex flex-wrap gap-2">
              {relatedHubs.map((hub) => (
                <Link
                  key={hub.filters.join('/')}
                  href={`/investors/${hub.filters.join('/')}`}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium border border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  {hub.label} Investors →
                </Link>
              ))}
            </div>
          </section>
        )}

        <ConversationalFAQ
          industryLabel={industryLabel}
          stageLabel={stageLabel}
          geoLabel={geoLabel}
          totalMatches={totalMatches}
          topInvestorNames={investors.slice(0, 5).map((i) => i.name)}
        />
      </main>

      <Footer />
    </div>
  );
}
