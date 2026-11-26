import { cache } from 'react';
import {
  absoluteUrl, formatIndustryLabel, getIndustryPage,
  DEFAULT_OG_IMAGE,
  STAGE_SLUGS, GEO_REGIONS, POPULAR_HUBS, INDUSTRY_PAGES, US_LOCATION_OR_FILTER,
  parseFilters, getStageInfo, getGeoInfo,
} from '@/seo.js';
import Link from 'next/link';
import { ArrowLeft, MapPin, Filter, ChevronRight, Sparkles, Lock, CheckCircle2, BarChart3 } from 'lucide-react';
import Footer from '@/components/Footer';
import AddToCrmButton from '@/components/AddToCrmButton';
import InvestorAvatar from '@/components/InvestorAvatar';
import {
  HEX_SLUG_REGEX,
  isBoilerplateBio,
  extractFirmFromBio,
  generateUniqueBio,
  truncateMetaDescription,
} from '@/lib/investorUtils';
import { notFound } from 'next/navigation';

export const revalidate = 86400;
export const dynamicParams = true;

// Prerender top ~55 flagship hubs at build time so Cloudflare Free Tier serves them as 0ms static HTML
export async function generateStaticParams() {
  const seen = new Set();
  const list = [];
  const add = (filters) => {
    const key = filters.join('/');
    if (!key || seen.has(key)) return;
    seen.add(key);
    list.push({ filters });
  };

  INDUSTRY_PAGES.slice(0, 16).forEach((p) => add([p.slug]));
  Object.keys(STAGE_SLUGS).forEach((s) => add([s]));
  ['usa', 'silicon-valley', 'san-francisco', 'new-york', 'london', 'europe', 'asia', 'canada', 'boston', 'austin'].forEach((g) => add([g]));
  POPULAR_HUBS.slice(0, 26).forEach((h) => add(h.filters));

  return list;
}

const CURRENT_YEAR = 2026;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://rjdewjyhtbfkujhvkwig.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ial7j5MzK6ni3y-Y8YszGg_7ZeV-2D3';
const HUB_COLUMNS = 'id,slug,name,bio,location,avatar_url,stages,industries,portfolio,past_investments,has_email,has_linkedin,has_twitter,created_at';
const HUB_MEM_CACHE = new Map();
const HUB_MEM_TTL_MS = 5 * 60 * 1000;

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Prevent double "Angel Angel Investors" when stage === 'angel'.
 */
function formatInvestorRole(industryLabel, stageLabel) {
  if (stageLabel === 'Angel') {
    return industryLabel ? `${industryLabel} Angel Investors` : 'Angel Investors';
  }
  const parts = [industryLabel, stageLabel].filter(Boolean);
  return parts.length > 0 ? `${parts.join(' ')} Angel Investors` : 'Angel Investors';
}

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

      if (indKeyword && (bio.includes(indKeyword) || portArr.some((p) => p.toLowerCase().includes(indKeyword)))) {
        score += 90;
      }
      if (stageKeyword && bio.includes(stageKeyword)) {
        score += 35;
      }
      if (!HEX_SLUG_REGEX.test(inv.slug || '')) score += 45;
      if (inv.avatar_url) score += 25;
      if (portArr.length > 0) score += Math.min(portArr.length * 8, 40);
      if (bio.length > 60 && !isBoilerplateBio(inv.bio)) score += 30;
      if (inv.has_email) score += 15;
      if (inv.has_twitter || inv.has_linkedin) score += 15;
      if (!inv.avatar_url && !inv.has_email) score -= 25;

      const tieBreaker = hashString(`${inv.slug || inv.id}::${canonicalPath}`) % 45;
      score += tieBreaker;

      return { inv, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((item) => item.inv);
}

function buildRestQueryParams(parsed) {
  const industryLabel = parsed.industry ? formatIndustryLabel(parsed.industry) : null;
  const stageInfo = parsed.stage ? getStageInfo(parsed.stage) : null;
  const geoInfo = parsed.geo ? getGeoInfo(parsed.geo) : null;

  const qs = [`select=${HUB_COLUMNS}`];
  if (parsed.industry) {
    qs.push(`industries=cs.{${encodeURIComponent(parsed.industry)}}`);
  }
  if (stageInfo) {
    qs.push(`stages=cs.{${encodeURIComponent(stageInfo.dbValue)}}`);
  }
  if (geoInfo?.countryMatch) {
    qs.push(US_LOCATION_OR_FILTER);
  } else if (geoInfo?.locations && geoInfo.locations.length > 0) {
    const clauses = geoInfo.locations.map((loc) => {
      const encoded = encodeURIComponent(`*${loc}*`);
      return loc.includes(',') || loc.includes(' ')
        ? `location.ilike.%22${encoded}%22`
        : `location.ilike.${encoded}`;
    });
    qs.push(`or=(${clauses.join(',')})`);
  }

  qs.push('order=created_at.asc,has_email.desc');
  qs.push('limit=120');

  return {
    queryString: qs.join('&'),
    industryLabel,
    stageLabel: stageInfo?.label || null,
    geoLabel: geoInfo?.label || null,
  };
}

function computeCohortStats(investors) {
  if (!investors || investors.length === 0) {
    return { emailPct: 0, topCities: [], topPortfolio: [] };
  }
  let withEmail = 0;
  const cityCounts = new Map();
  const portCounts = new Map();

  for (const inv of investors) {
    if (inv.has_email) withEmail++;
    if (inv.location && inv.location.length > 2) {
      const city = inv.location.split(',')[0].trim();
      if (city && !/^(unknown|global|remote)$/i.test(city)) {
        cityCounts.set(city, (cityCounts.get(city) || 0) + 1);
      }
    }
    const rawPort = inv.portfolio || inv.past_investments;
    const arr = Array.isArray(rawPort)
      ? rawPort
      : typeof rawPort === 'string' && rawPort.trim()
      ? rawPort.split(',').map((s) => s.trim())
      : [];
    for (const p of arr) {
      if (p && p.length > 1 && p.length < 40) {
        portCounts.set(p, (portCounts.get(p) || 0) + 1);
      }
    }
  }

  const topCities = [...cityCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c);
  const topPortfolio = [...portCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([p]) => p);
  const emailPct = Math.round((withEmail / investors.length) * 100);
  return { emailPct, topCities, topPortfolio };
}

function getHubFaqQuestions(rolePhrase, geoLabel, totalMatches, topInvestorNames, cohortStats) {
  const g = geoLabel ? ` in ${geoLabel}` : '';
  const c = totalMatches > 0 ? totalMatches.toLocaleString('en-US') : 'verified';
  const topNamesStr = topInvestorNames && topInvestorNames.length > 0
    ? topInvestorNames.slice(0, 5).join(', ')
    : 'prominent operator-angels and syndicate leads';
  const citiesNote = cohortStats?.topCities?.length > 0
    ? ` Key geographic concentrations in this cohort include ${cohortStats.topCities.join(', ')}.`
    : '';
  const portNote = cohortStats?.topPortfolio?.length > 0
    ? ` Notable portfolio companies backed by this group include ${cohortStats.topPortfolio.slice(0, 4).join(', ')}.`
    : '';

  return [
    {
      q: `Who are the top ${rolePhrase}${g} in ${CURRENT_YEAR}?`,
      a: `OpenAngels tracks ${c} verified ${rolePhrase}${g}, including ${topNamesStr}.${portNote} Each profile includes investment stages, focus sectors, portfolio startups, and verified founder pitch channels.`,
    },
    {
      q: `How can founders find ${rolePhrase}${g} for free?`,
      a: `Founders can browse and compare ${c} active ${rolePhrase}${g} on OpenAngels without monthly subscriptions.${citiesNote} Filter by sector, check size ($10k to $250k+), and portfolio fit before reaching out.`,
    },
    {
      q: `What is the typical check size for ${rolePhrase}${g}?`,
      a: `Most individual ${rolePhrase}${g} write checks between $10,000 and $100,000, while super-angels and syndicate leads typically deploy $100,000 to $500,000+ into pre-seed and seed rounds.`,
    },
    {
      q: `How can startup founders contact and pitch ${rolePhrase}${g}?`,
      a: `Inspect their backed startups on OpenAngels to verify thesis alignment, then unlock SMTP-verified direct email addresses (${cohortStats?.emailPct || 70}%+ verified coverage in this cohort) and AI-personalized cold pitch drafts.`,
    },
  ];
}

const fetchHubInvestors = cache(async (filterKey) => {
  const now = Date.now();
  const cached = HUB_MEM_CACHE.get(filterKey);
  if (cached && now < cached.expiresAt) {
    return cached.value;
  }

  const filters = filterKey.split('/').filter(Boolean);
  const parsed = parseFilters(filters);
  const { queryString, industryLabel, stageLabel, geoLabel } = buildRestQueryParams(parsed);
  const canonicalSegments = [parsed.industry, parsed.stage, parsed.geo].filter(Boolean);
  const canonicalPath = `/investors/${canonicalSegments.length > 0 ? canonicalSegments.join('/') : filters.join('/')}`;

  let investors = [];
  let totalMatches = 0;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/investors_public?${queryString}`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: 'count=exact',
      },
      next: { revalidate: 86400 },
    });
    if (!res.ok) throw new Error(`Supabase HTTP ${res.status}`);
    const range = res.headers.get('content-range') || '';
    const parsedCount = range.includes('/') ? parseInt(range.split('/')[1], 10) : 0;
    const data = await res.json();
    const safeData = Array.isArray(data) ? data : [];

    const ranked = rankInvestorsForHub(safeData, parsed, canonicalPath);
    investors = ranked.slice(0, 48).map((inv) => {
      const cleanFirm = extractFirmFromBio(inv.bio, inv.firm);
      const cleanBio = isBoilerplateBio(inv.bio)
        ? generateUniqueBio({ ...inv, firm: cleanFirm })
        : inv.bio;
      return { ...inv, firm: cleanFirm, bio: cleanBio };
    });
    totalMatches = !isNaN(parsedCount) && parsedCount > 0 ? parsedCount : safeData.length;
  } catch (err) {
    console.error('Error fetching filtered investors:', err);
  }

  const cohortStats = computeCohortStats(investors);
  const value = { parsed, investors, totalMatches, industryLabel, stageLabel, geoLabel, canonicalPath, cohortStats };
  if (HUB_MEM_CACHE.size >= 40) {
    HUB_MEM_CACHE.delete(HUB_MEM_CACHE.keys().next().value);
  }
  HUB_MEM_CACHE.set(filterKey, { value, expiresAt: now + HUB_MEM_TTL_MS });
  return value;
});

function buildHubTitle(numInvestors, rolePhrase, geoStr, currentYear) {
  const countStr = numInvestors > 0 ? `${numInvestors.toLocaleString('en-US')} ` : '';
  let cand = `Top ${countStr}${rolePhrase}${geoStr} (${currentYear})`;
  if (cand.length <= 58) return cand;
  cand = `${rolePhrase}${geoStr} (${currentYear})`;
  if (cand.length <= 58) return cand;
  return cand.slice(0, 58);
}

export async function generateMetadata({ params }) {
  const { filters } = await params;
  const parsed = parseFilters(filters);

  if (!parsed.industry && !parsed.stage && !parsed.geo) {
    return {};
  }

  const { investors, totalMatches: numInvestors, industryLabel, stageLabel, geoLabel, canonicalPath } = await fetchHubInvestors(filters.join('/'));
  if (numInvestors === 0) {
    return {
      title: 'Investor Directory Not Found | OpenAngels',
      robots: { index: false, follow: false },
    };
  }

  const rolePhrase = formatInvestorRole(industryLabel, stageLabel);
  const geoStr = geoLabel ? ` in ${geoLabel}` : '';
  const topNames = (investors || []).slice(0, 3).map((i) => i.name).filter(Boolean).join(', ');
  const title = buildHubTitle(numInvestors, rolePhrase, geoStr, CURRENT_YEAR);

  const description = truncateMetaDescription(
    `Compare ${numInvestors.toLocaleString('en-US')} verified ${rolePhrase}${geoStr}${topNames ? ` (including ${topNames})` : ''}. Check sizes, portfolios & direct pitch emails.`,
    155
  );

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(canonicalPath) },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(canonicalPath),
      siteName: 'OpenAngels',
      images: [DEFAULT_OG_IMAGE],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}

export default async function FilteredInvestorsPage({ params }) {
  const { filters } = await params;
  const parsed = parseFilters(filters);

  if (!parsed.industry && !parsed.stage && !parsed.geo) {
    notFound();
  }

  const { investors, totalMatches, industryLabel, stageLabel, geoLabel, canonicalPath, cohortStats } = await fetchHubInvestors(filters.join('/'));

  // Eliminate infinite Soft-404 crawl traps: return genuine HTTP 404 when no matching investors exist
  if (totalMatches === 0 || investors.length === 0) {
    notFound();
  }

  const rolePhrase = formatInvestorRole(industryLabel, stageLabel);
  const geoStr = geoLabel ? ` in ${geoLabel}` : '';
  const industryPage = parsed.industry ? getIndustryPage(parsed.industry) : null;

  const questions = getHubFaqQuestions(
    rolePhrase,
    geoLabel,
    totalMatches,
    investors.slice(0, 5).map((i) => i.name),
    cohortStats
  );

  const schemaItems = investors.slice(0, 15);
  const unifiedSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: `${rolePhrase}${geoStr} (${CURRENT_YEAR})`,
        url: absoluteUrl(canonicalPath),
        description: `Verified directory of ${totalMatches.toLocaleString('en-US')} ${rolePhrase}${geoStr} on OpenAngels.`,
        isPartOf: { '@id': absoluteUrl('/#website') },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
            { '@type': 'ListItem', position: 2, name: 'Directory', item: absoluteUrl('/directory') },
            { '@type': 'ListItem', position: 3, name: `${rolePhrase}${geoStr}`, item: absoluteUrl(canonicalPath) },
          ],
        },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: schemaItems.length,
          itemListElement: schemaItems.map((investor, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: absoluteUrl(`/investor/${investor.slug || investor.id}`),
            name: investor.name,
            description: investor.bio || `${rolePhrase} on OpenAngels`,
          })),
        },
      },
      {
        '@type': 'FAQPage',
        mainEntity: questions.map((q) => ({
          '@type': 'Question',
          name: q.q,
          acceptedAnswer: { '@type': 'Answer', text: q.a },
        })),
      },
    ],
  };

  const stageLinks = !parsed.stage
    ? Object.entries(STAGE_SLUGS)
        .filter(([slug]) => slug !== 'angel' || !parsed.industry) // Avoid sparse /industry/angel pairs
        .map(([slug, info]) => ({
          href: parsed.industry
            ? `/investors/${parsed.industry}/${slug}${parsed.geo ? `/${parsed.geo}` : ''}`
            : `/investors/${slug}${parsed.geo ? `/${parsed.geo}` : ''}`,
          label: info.label,
        }))
    : [];

  const geoLinks = !parsed.geo
    ? Object.entries(GEO_REGIONS)
        .slice(0, 10)
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(unifiedSchema) }} />

      <header className="h-14 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-400 min-w-0">
            <Link href="/" prefetch={false} className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <Link href="/directory" prefetch={false} className="hover:text-white transition-colors">Directory</Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <span className="text-zinc-200 font-medium truncate">{rolePhrase}{geoStr}</span>
          </nav>

          <Link
            href="/"
            prefetch={false}
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
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300 mb-3 tabular-nums">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>{totalMatches.toLocaleString('en-US')} Verified Profiles • {CURRENT_YEAR} Dataset</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-white mb-3">
            Top {totalMatches.toLocaleString('en-US')} {rolePhrase}{geoStr} ({CURRENT_YEAR})
          </h1>
          <p className="text-sm sm:text-base text-zinc-300 max-w-3xl leading-relaxed">
            OpenAngels tracks <strong className="text-white font-medium">{totalMatches.toLocaleString('en-US')} verified {rolePhrase.toLowerCase()}</strong>
            {geoStr}. Notable active investors in this cohort include{' '}
            <span className="text-zinc-200">{investors.slice(0, 5).map((i) => i.name).join(', ')}</span>.
            {industryPage ? ` Tailored for ${industryPage.audience} focused on ${industryPage.angle}.` : ''} Compare check sizes, portfolio deals, and verified direct founder pitch emails below.
          </p>
        </div>

        {/* Unique Cohort Telemetry Snapshot (Original Data for Google & AI Overviews) */}
        <section aria-label="Cohort Data Snapshot" className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Email Coverage</span>
            </div>
            <div className="text-xl font-bold text-white mt-1">{cohortStats.emailPct}% SMTP Verified</div>
            <p className="text-xs text-zinc-400 mt-0.5">Across top {investors.length} ranked profiles</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>Top Investor Hubs</span>
            </div>
            <div className="text-sm font-semibold text-white mt-1.5 truncate">
              {cohortStats.topCities.length > 0 ? cohortStats.topCities.join(' • ') : (geoLabel || 'Global / US')}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Primary active geographies</p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>Frequently Backed Deals</span>
            </div>
            <div className="text-sm font-semibold text-white mt-1.5 truncate">
              {cohortStats.topPortfolio.length > 0 ? cohortStats.topPortfolio.slice(0, 3).join(', ') : 'Early-Stage Tech Startups'}
            </div>
            <p className="text-xs text-zinc-400 mt-1">Co-investment overlap signals</p>
          </div>
        </section>

        {/* Faceted Navigation — Stage & Geo Refinement (accessible mobile tap targets) */}
        {(stageLinks.length > 0 || geoLinks.length > 0) && (
          <div className="mb-8 p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/80 space-y-4">
            {stageLinks.length > 0 && (
              <div>
                <h2 className="text-xs font-medium text-zinc-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Filter by Funding Stage</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  {stageLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      prefetch={false}
                      className="px-3.5 py-2 rounded-lg text-xs font-medium border border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {geoLinks.length > 0 && (
              <div>
                <h2 className="text-xs font-medium text-zinc-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Filter by Location</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  {geoLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      prefetch={false}
                      className="px-3.5 py-2 rounded-lg text-xs font-medium border border-zinc-800 bg-zinc-900 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cohort Pitch & Monetization Banner */}
        <section
          aria-label="Unlock All Investor Contacts"
          className="mb-10 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-red-950/30 border border-zinc-800 p-6 sm:p-7 relative overflow-hidden shadow-xl"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Direct Founder Outreach</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Fundraising for a {industryLabel || stageLabel || 'Tech'} Startup{geoStr}?
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Unlock direct verified pitch emails, check size data, and LinkedIn profiles for all {totalMatches.toLocaleString('en-US')} {rolePhrase.toLowerCase()}{geoStr}, plus our AI pitch drafter trained on their deal history.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300 pt-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> All {totalMatches.toLocaleString('en-US')} contacts included
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> AI pitch &amp; CRM workflow
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> $49 one-time lifetime access
                </span>
              </div>
            </div>

            <div className="shrink-0 w-full md:w-auto">
              <a
                href="https://beatsprom.gumroad.com/l/vgobnh"
                className="gumroad-button inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-red-600/25 hover:scale-[1.02] cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Unlock All Contacts ($49)</span>
              </a>
            </div>
          </div>
        </section>

        {/* Featured Snippet Comparison Table */}
        {tableInvestors.length > 0 && (
          <section className="mb-10" aria-labelledby="comparison-table-heading">
            <div className="flex items-center justify-between mb-3">
              <h2 id="comparison-table-heading" className="text-base sm:text-lg font-semibold text-white tracking-tight">
                Featured {rolePhrase}{geoStr} — Quick Comparison
              </h2>
              <span className="text-xs font-mono text-zinc-400 hidden sm:inline">
                Showing Top {tableInvestors.length} of {totalMatches.toLocaleString('en-US')}
              </span>
            </div>
            <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-900/30">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/60 text-zinc-300 uppercase tracking-wider text-[10.5px]">
                    <th className="py-2.5 px-3.5 font-medium">Investor</th>
                    <th className="py-2.5 px-3.5 font-medium">Location</th>
                    <th className="py-2.5 px-3.5 font-medium">Stages</th>
                    <th className="py-2.5 px-3.5 font-medium">Core Sectors</th>
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
                          <Link href={`/investor/${inv.slug || inv.id}`} prefetch={false} className="hover:underline">
                            {inv.name}
                          </Link>
                        </td>
                        <td className="py-2.5 px-3.5 text-zinc-300 whitespace-nowrap">{inv.location || 'Global / US'}</td>
                        <td className="py-2.5 px-3.5 text-zinc-300 whitespace-nowrap">{stgArr.slice(0, 2).join(', ')}</td>
                        <td className="py-2.5 px-3.5 text-zinc-300 max-w-xs truncate">{indArr.slice(0, 4).join(', ')}</td>
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                          <Link
                            href={`/investor/${inv.slug || inv.id}`}
                            prefetch={false}
                            className="text-zinc-200 hover:text-white font-medium underline-offset-2 hover:underline"
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
          {investors.map((investor) => {
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
                        size={44}
                        className="w-11 h-11 rounded-xl shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="text-base font-semibold text-white truncate">
                            <Link href={`/investor/${investor.slug || investor.id}`} prefetch={false} className="hover:underline">
                              {investor.name}
                            </Link>
                          </h2>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-800/80 border border-zinc-700/60 text-[10.5px] font-medium text-zinc-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            Verified
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-zinc-300 mt-0.5 flex-wrap">
                          {investor.firm && <span className="text-zinc-200 font-medium">{investor.firm}</span>}
                          {investor.location && (
                            <span className="inline-flex items-center gap-1 text-zinc-400">
                              <MapPin className="w-3 h-3 text-zinc-400" /> {investor.location}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {investor.bio && (
                      <p className="text-xs sm:text-sm text-zinc-300 mt-3 line-clamp-2 leading-relaxed">
                        {investor.bio}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {(() => {
                        const rawStages = investor.stages || investor.stage;
                        const stagesArr = Array.isArray(rawStages) ? rawStages : typeof rawStages === 'string' ? [rawStages] : [];
                        return stagesArr.slice(0, 3).map((s) => (
                          <span key={s} className="text-[11px] font-medium text-zinc-200 bg-zinc-800/80 border border-zinc-700/60 px-2 py-0.5 rounded-md">
                            {STAGE_SLUGS[s]?.label || s}
                          </span>
                        ));
                      })()}
                      {indList.slice(0, 4).map((ind) => (
                        <span key={ind} className="text-[11px] text-zinc-300 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md">
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
                      prefetch={false}
                      className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-semibold transition-colors shadow-sm"
                    >
                      View Dossier
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* Related Hubs Section */}
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
                  prefetch={false}
                  className="px-3.5 py-2 rounded-lg text-xs font-medium border border-zinc-800 bg-zinc-900/50 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  {hub.label} Investors →
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* FAQ Section */}
        <section className="mt-14 pt-8 border-t border-zinc-800/80" aria-labelledby="faq-heading">
          <h2 id="faq-heading" className="text-xl font-semibold text-white tracking-tight mb-5">
            Frequently Asked Questions — {rolePhrase}{geoStr}
          </h2>
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={idx} className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-4 sm:p-5">
                <h3 className="text-sm sm:text-base font-semibold text-white mb-1.5">{q.q}</h3>
                <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">{q.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Sector-Specific Editorial Guide */}
        <section className="mt-14 pt-8 border-t border-zinc-800/80" aria-labelledby="pitch-guide-heading">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 id="pitch-guide-heading" className="text-xl font-semibold text-white tracking-tight">
              How to Pitch {rolePhrase}{geoStr}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed max-w-3xl mb-6">
            {industryPage
              ? `For ${industryPage.audience}${geoStr}, active ${stageLabel || 'early-stage'} angels evaluate startups primarily on ${industryPage.angle}. Structure your outreach around concrete proof points from this ${totalMatches.toLocaleString('en-US')}-investor cohort:`
              : `When pitching ${rolePhrase.toLowerCase()}${geoStr}, lead with crisp traction metrics, round terms, and clear thesis alignment with their past startup investments:`}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-1.5 text-zinc-100 font-semibold text-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono flex items-center justify-center text-[11px]">1</span>
                <span>Thesis &amp; Stage Alignment</span>
              </div>
              <p className="text-zinc-300 leading-relaxed">
                Target angels actively backing {stageLabel || 'Pre-Seed and Seed'} rounds{geoStr}. In this cohort, {cohortStats.emailPct}% of top-ranked profiles have SMTP-verified direct pitch emails.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-1.5 text-zinc-100 font-semibold text-xs">
                <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono flex items-center justify-center text-[11px]">2</span>
                <span>Lead with Sector Proof</span>
              </div>
              <p className="text-zinc-300 leading-relaxed">
                {industryPage
                  ? `Highlight measurable proof across ${industryPage.angle}, plus why your team has an unfair distribution or technical edge right now.`
                  : 'Lead with retention velocity, defensible technical moats, customer pull, and capital-efficient product execution.'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80 space-y-2">
              <div className="flex items-center gap-1.5 text-zinc-100 font-semibold text-xs">
                <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 font-mono flex items-center justify-center text-[11px]">3</span>
                <span>Portfolio-Anchored Outreach</span>
              </div>
              <p className="text-zinc-300 leading-relaxed">
                {cohortStats.topPortfolio.length > 0
                  ? `Reference overlapping portfolio deals such as ${cohortStats.topPortfolio.slice(0, 3).join(', ')} to show why their operator network accelerates your round.`
                  : 'Reference past deals from the investor portfolio and explain in 3 sentences why their operator network accelerates your round.'}
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
