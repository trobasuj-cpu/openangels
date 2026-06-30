import { supabase } from '@/lib/supabase';
import {
  absoluteUrl, formatIndustryLabel, getIndustryPage,
  INVESTOR_COUNT, PRODUCT_NAME, SITE_URL,
  STAGE_SLUGS, GEO_REGIONS, POPULAR_HUBS,
  parseFilters, getStageInfo, getGeoInfo, isUSLocation,
} from '@/seo.js';
import Link from 'next/link';
import { ArrowLeft, Mail, MapPin, DollarSign, Sparkles, Filter } from 'lucide-react';
import Footer from '@/components/Footer';
import { notFound } from 'next/navigation';

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Build a Supabase query based on parsed filters.
 * Returns { query, industryLabel, stageLabel, geoLabel }.
 */
function buildQuery(parsed, selectClause = '*', countOnly = false) {
  let query = supabase
    .from('investors_secure')
    .select(selectClause, countOnly ? { count: 'exact', head: true } : { count: 'exact' });

  const industryLabel = parsed.industry ? formatIndustryLabel(parsed.industry) : null;
  const stageInfo = parsed.stage ? getStageInfo(parsed.stage) : null;
  const geoInfo = parsed.geo ? getGeoInfo(parsed.geo) : null;

  // Industry filter
  if (parsed.industry) {
    query = query.contains('industries', [parsed.industry]);
  }

  // Stage filter
  if (stageInfo) {
    query = query.contains('stages', [stageInfo.dbValue]);
  }

  // Geo filter — handled after query since we need to filter in JS for complex regions
  // We'll apply location filter via .in() for known locations, or post-filter for USA

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

export async function generateMetadata({ params }) {
  const { filters } = await params;
  const parsed = parseFilters(filters);

  // At least one filter must be valid
  if (!parsed.industry && !parsed.stage && !parsed.geo) {
    return {};
  }

  const { query, industryLabel, stageLabel, geoLabel, geoInfo } = buildQuery(parsed, '*', true);
  const { count } = await query;

  // Apply USA post-filter for count (approximate — use the DB count as-is for non-USA)
  let numInvestors = count || 0;

  // Build dynamic labels
  const parts = [industryLabel, stageLabel].filter(Boolean);
  const typeStr = parts.length > 0 ? parts.join(' ') : '';
  const geoStr = geoLabel ? ` in ${geoLabel}` : '';

  const title = numInvestors > 0
    ? `Top ${numInvestors} ${typeStr} Angel Investors${geoStr} (${CURRENT_YEAR}) | OpenAngels`
    : `${typeStr} Angel Investors${geoStr} | OpenAngels`;

  const description = `Looking for ${stageLabel || ''} funding? Access our verified list of ${numInvestors > 0 ? numInvestors : ''} ${typeStr} angel investors and VCs${geoStr}. Get emails, LinkedIn profiles, and investment focus on OpenAngels.`.replace(/\s+/g, ' ').trim();

  const canonicalPath = `/investors/${filters.join('/')}`;

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(canonicalPath) },
    openGraph: {
      title: `${typeStr} Angel Investors${geoStr} | OpenAngels`,
      description,
      url: absoluteUrl(canonicalPath),
    },
    twitter: {
      title: `${typeStr} Angel Investors${geoStr} | OpenAngels`,
      description,
    },
  };
}

export default async function FilteredInvestorsPage({ params }) {
  const { filters } = await params;
  const parsed = parseFilters(filters);

  // At least one valid filter must exist
  if (!parsed.industry && !parsed.stage && !parsed.geo) {
    notFound();
  }

  const { query, industryLabel, stageLabel, geoLabel, geoInfo } = buildQuery(parsed);

  // Fetch data
  let investors = [];
  let totalMatches = 0;

  try {
    const result = await query.order('name', { ascending: true }).limit(100);
    if (result.error) throw result.error;
    
    let data = result.data || [];
    
    // Post-filter for USA (locations matching US state codes)
    if (geoInfo?.countryMatch) {
      data = data.filter(inv => isUSLocation(inv.location));
    }
    
    investors = data;
    
    // For total count with USA, we need a separate approach
    if (geoInfo?.countryMatch) {
      totalMatches = investors.length; // approximate from the fetched set
    } else {
      totalMatches = result.count || data.length;
    }
  } catch (err) {
    console.error('Error fetching filtered investors:', err);
  }

  // CRITICAL: Soft 404 protection — don't let Google index empty pages
  if (totalMatches === 0) {
    notFound();
  }

  // Build display strings
  const parts = [industryLabel, stageLabel].filter(Boolean);
  const typeStr = parts.length > 0 ? parts.join(' ') : '';
  const geoStr = geoLabel ? ` in ${geoLabel}` : '';
  const canonicalPath = `/investors/${filters.join('/')}`;

  // Build Schema.org structured data
  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${typeStr} Angel Investors${geoStr}`,
    url: absoluteUrl(canonicalPath),
    description: `Find ${totalMatches} verified ${typeStr} angel investors and VCs${geoStr} on OpenAngels.`,
    isPartOf: {
      '@type': 'WebSite',
      name: PRODUCT_NAME,
      url: SITE_URL,
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: Math.min(investors.length, 50),
      itemListElement: investors.slice(0, 10).map((investor, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: investor.name,
        description: investor.bio || `${typeStr} investor on OpenAngels`,
      })),
    },
  };

  // Build faceted navigation links
  const stageLinks = !parsed.stage ? Object.entries(STAGE_SLUGS).map(([slug, info]) => ({
    href: parsed.industry
      ? `/investors/${parsed.industry}/${slug}${parsed.geo ? `/${parsed.geo}` : ''}`
      : `/investors/${slug}${parsed.geo ? `/${parsed.geo}` : ''}`,
    label: info.label,
  })) : [];

  const geoLinks = !parsed.geo ? Object.entries(GEO_REGIONS).slice(0, 12).map(([slug, info]) => ({
    href: parsed.industry
      ? `/investors/${parsed.industry}${parsed.stage ? `/${parsed.stage}` : ''}/${slug}`
      : `/investors/${parsed.stage || ''}/${slug}`.replace('//', '/'),
    label: info.label.replace(/^the /, ''),
  })) : [];

  // Related hubs for cross-linking
  const relatedHubs = POPULAR_HUBS
    .filter(hub => {
      const hubParsed = parseFilters(hub.filters);
      // Show hubs that share at least one dimension but aren't identical
      const shares = (hubParsed.industry === parsed.industry) ||
                     (hubParsed.stage === parsed.stage) ||
                     (hubParsed.geo === parsed.geo);
      const identical = hubParsed.industry === parsed.industry &&
                        hubParsed.stage === parsed.stage &&
                        hubParsed.geo === parsed.geo;
      return shares && !identical;
    })
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans flex flex-col selection:bg-amber-500/30">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />

      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to all investors
          </Link>
        </div>

        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl mb-4">
            Find {totalMatches} {typeStr} Angel Investors{geoStr}
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl">
            {`We found ${totalMatches} verified angel investors and VCs${industryLabel ? ` actively investing in ${industryLabel} startups` : ''}${stageLabel ? ` at the ${stageLabel} stage` : ''}${geoStr}.`}
          </p>
        </div>

        {/* Faceted Navigation — Stage Refinement */}
        {stageLinks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter by Stage
            </h2>
            <div className="flex flex-wrap gap-2">
              {stageLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 rounded-full text-sm font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-500 transition-all hover:shadow-sm"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Faceted Navigation — Geo Refinement */}
        {geoLinks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Filter by Location
            </h2>
            <div className="flex flex-wrap gap-2">
              {geoLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 rounded-full text-sm font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-amber-500/50 hover:text-amber-600 dark:hover:text-amber-500 transition-all hover:shadow-sm"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Investor Cards */}
        <div className="space-y-4">
          {investors.map((investor) => (
            <div
              key={investor.id}
              className="group relative bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 transition-all hover:shadow-lg hover:border-amber-500/50"
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left Column - Core Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <Link href={`/investor/${investor.slug || investor.id}`} className="hover:underline">
                          {investor.name}
                        </Link>
                        {(investor.linkedin_url || investor.twitter_url) && (
                          <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                      </h2>
                      {investor.firm && (
                        <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mt-1">
                          {investor.title ? `${investor.title} at ` : ''}{investor.firm}
                        </div>
                      )}
                    </div>
                  </div>

                  {investor.bio && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-3 line-clamp-2 leading-relaxed">
                      {investor.bio}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-3">
                    {investor.location && (
                      <span className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
                        <MapPin className="w-3 h-3" /> {investor.location}
                      </span>
                    )}
                    {(() => {
                      const rawStages = investor.stages || investor.stage;
                      const stagesArr = Array.isArray(rawStages) ? rawStages : (typeof rawStages === 'string' ? [rawStages] : []);
                      return stagesArr.slice(0, 3).map(s => (
                        <span key={s} className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
                          {STAGE_SLUGS[s]?.label || s}
                        </span>
                      ));
                    })()}
                  </div>
                </div>

                {/* Right Column - Actions */}
                <div className="flex flex-col sm:items-end gap-3 shrink-0">
                  <Link
                    href={`/investor/${investor.slug || investor.id}`}
                    className="inline-flex items-center justify-center h-10 px-6 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-sm font-medium transition-transform hover:scale-105 shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 mr-2 text-amber-500" />
                    View Profile
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Related Hubs Section for Cross-Linking */}
        {relatedHubs.length > 0 && (
          <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
              Related Investor Lists
            </h2>
            <div className="flex flex-wrap gap-3">
              {relatedHubs.map(hub => (
                <Link
                  key={hub.filters.join('/')}
                  href={`/investors/${hub.filters.join('/')}`}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300 hover:border-amber-500/50 hover:bg-amber-50 dark:hover:bg-amber-500/5 hover:text-amber-700 dark:hover:text-amber-400 transition-all"
                >
                  {hub.label} →
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
