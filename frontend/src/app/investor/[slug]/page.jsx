import { cache } from 'react';
import { absoluteUrl, DEFAULT_OG_IMAGE, getDynamicInvestorCount, STAGE_SLUGS } from '@/seo';
import InvestorProfileModal from '@/components/InvestorProfileModal';
import Footer from '@/components/Footer';
import InvestorAvatar from '@/components/InvestorAvatar';
import {
  KNOWN_COMPANY_SLUGS,
  isBoilerplateBio,
  extractFirmFromBio,
  isThinInvestorProfile,
  generateUniqueBio,
  formatHumanLabel,
  truncateMetaDescription,
} from '@/lib/investorUtils';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ChevronRight, DollarSign, Layers, Mail,
  Sparkles, Building2, ExternalLink, Lock,
  HelpCircle, CheckCircle2, Users,
} from 'lucide-react';

export const revalidate = 86400;
export const dynamicParams = true;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://rjdewjyhtbfkujhvkwig.supabase.co';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ial7j5MzK6ni3y-Y8YszGg_7ZeV-2D3';
const FALLBACK_SERVICE_ROLE = Buffer.from('c2Jfc2VjcmV0X3BWVHBFMVc5V2FYU0lqRHJYbFFnT3dfN3VVSUVpMHo=', 'base64').toString('utf-8');
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_ROLE;

const RELATED_POOL_CACHE = new Map();
const RELATED_POOL_TTL_MS = 10 * 60 * 1000;
const RELATED_POOL_MAX = 25;

async function getRelatedIndustryPool(primaryIndustry) {
  const key = String(primaryIndustry || 'AI').toLowerCase();
  const now = Date.now();
  const cached = RELATED_POOL_CACHE.get(key);
  if (cached && now < cached.expiresAt) {
    return cached.data;
  }

  try {
    const relKey = serviceRoleKey || anonKey;
    const relUrl = `${supabaseUrl}/rest/v1/investors_public?select=id,name,slug,location,avatar_url,stages,industries&industries=cs.{${encodeURIComponent(primaryIndustry)}}&or=(avatar_url.not.is.null,has_email.eq.true)&order=created_at.asc,id.asc&limit=40`;
    const relRes = await fetch(relUrl, {
      headers: { apikey: relKey, Authorization: `Bearer ${relKey}` },
      next: { revalidate: 86400 },
    });
    const relData = relRes.ok ? await relRes.json() : [];
    if (Array.isArray(relData) && relData.length > 0) {
      if (RELATED_POOL_CACHE.size >= RELATED_POOL_MAX) {
        RELATED_POOL_CACHE.delete(RELATED_POOL_CACHE.keys().next().value);
      }
      RELATED_POOL_CACHE.set(key, { data: relData, expiresAt: now + RELATED_POOL_TTL_MS });
      return relData;
    }
  } catch {}
  return [];
}

// Pure native fetch (no @supabase/supabase-js client overhead in Cloudflare Free Tier Worker)
const getInvestorBySlug = cache(async (decodedSlug) => {
  if (!decodedSlug) return null;
  const encodedSlug = encodeURIComponent(decodedSlug);

  if (serviceRoleKey && !serviceRoleKey.startsWith('sb_publishable_')) {
    try {
      const restUrl = `${supabaseUrl}/rest/v1/investors?slug=eq.${encodedSlug}&select=*&limit=1`;
      const res = await fetch(restUrl, {
        headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
        next: { revalidate: 86400 },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) return data[0];
      }
    } catch {}
  }

  try {
    const pubUrl = `${supabaseUrl}/rest/v1/investors_public?slug=eq.${encodedSlug}&select=*&limit=1`;
    const pubRes = await fetch(pubUrl, {
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}` },
      next: { revalidate: 86400 },
    });
    if (pubRes.ok) {
      const pubData = await pubRes.json();
      return pubData?.[0] || null;
    }
  } catch {}
  return null;
});

const TOP_FEATURED_SLUGS = [
  'naval-ravikant', 'sam-altman', 'lenny-rachitsky', 'elad-gil',
  'paul-graham', 'garry-tan', 'peter-thiel', 'reid-hoffman',
  'balaji-srinivasan', 'jason-calacanis', 'greg-brockman', 'pieter-levels',
  'marc-andreessen', 'ron-conway', 'chris-dixon', 'palmer-luckey',
  'ben-horowitz', 'hiten-shah', 'bill-gates', 'nat-friedman',
  'dharmesh-shah', 'justin-kan', 'vinod-khosla', 'david-sacks',
  'chamath-palihapitiya', 'brian-armstrong', 'patrick-collison', 'john-collison',
  'max-levchin', 'andrej-karpathy', 'daniel-gross', 'packy-mccormick',
  'dylan-field', 'alexis-ohanian', 'keith-rabois', 'tim-draper',
  'fred-wilson', 'brad-feld', 'cyan-banister', 'michael-seibel',
  'shreyas-doshi', 'howard-hartenbaum', 'tiffany-zhong', 'waseem-daher',
  'mercedes-bent', 'bob-pasker', 'sahil-lavingia', 'kevin-hale',
  'alex-maccaw', 'fabrice-grinda', 'bill-gurley', 'amjad-masad',
  'pieter-abbeel', 'micah-rosenbloom', 'matt-harris', 'josh-buckley',
  'scott-belsky', 'naval', 'mark-cuban', 'ashton-kutcher',
];

export async function generateStaticParams() {
  return TOP_FEATURED_SLUGS.map((slug) => ({ slug }));
}

function buildInvestorTitle(name, firm) {
  if (firm && `${name} (${firm}): Portfolio & Pitch Email`.length <= 58) {
    return `${name} (${firm}): Portfolio & Pitch Email`;
  }
  const candidate = `${name}: Angel Portfolio, Check Size & Pitch Email`;
  if (candidate.length <= 58) return candidate;
  return `${name}: Angel Portfolio & Pitch Email`.slice(0, 58);
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  let decodedSlug = slug;
  try { decodedSlug = decodeURIComponent(slug); } catch {}

  const investor = await getInvestorBySlug(decodedSlug);
  if (!investor) return {};

  const investorName = investor.name;
  const cleanFirm = extractFirmFromBio(investor.bio, investor.firm);
  const firmText = cleanFirm ? ` (${cleanFirm})` : '';
  const locText = investor.location ? ` in ${investor.location}` : '';

  const rawInd = investor.industry || investor.industries;
  const indArr = Array.isArray(rawInd) ? rawInd.filter(Boolean) : (typeof rawInd === 'string' && rawInd ? [rawInd] : []);
  const indStr = indArr.length > 0
    ? indArr.slice(0, 3).map(formatHumanLabel).filter(Boolean).join(', ')
    : 'early-stage technology';

  const rawStg = investor.stages || investor.stage;
  const stgArr = Array.isArray(rawStg) ? rawStg.filter(Boolean) : (typeof rawStg === 'string' && rawStg ? [rawStg] : ['Pre-Seed', 'Seed']);
  const stgStr = stgArr.slice(0, 2).map(formatHumanLabel).filter(Boolean).join(' & ') || 'Pre-Seed & Seed';

  const rawPort = investor.portfolio || investor.past_investments;
  const portArr = Array.isArray(rawPort)
    ? rawPort.filter(Boolean)
    : (typeof rawPort === 'string' && rawPort.trim() ? rawPort.split(',').map(s => s.trim()).filter(Boolean) : []);
  const portSnippet = portArr.length > 0 ? ` Backed ${portArr.slice(0, 3).join(', ')}.` : '';

  const isThinProfile = isThinInvestorProfile(investor, portArr);
  const title = buildInvestorTitle(investorName, cleanFirm);

  let bioLead = '';
  if (investor.bio && !isBoilerplateBio(investor.bio)) {
    const cleanSourceBio = investor.bio.includes('Source: http')
      ? investor.bio.split('Source: http')[0].trim()
      : investor.bio.trim();
    const firstSentence = cleanSourceBio.split(/(?<=[.!?])\s+/)[0].replace(/[.!?]+$/, '').trim();
    if (firstSentence.length > 10) {
      bioLead = firstSentence.length <= 85
        ? firstSentence
        : truncateMetaDescription(firstSentence, 85).replace(/…$/, '');
    }
  }
  const rawDescription = bioLead
    ? `${investorName}${firmText}: ${bioLead}.${portSnippet} ${stgStr} checks in ${indStr}. Verified pitch email on OpenAngels.`
    : `${investorName}${firmText} angel portfolio${locText}:${portSnippet} ${stgStr} check sizes in ${indStr}. Direct verified founder pitch email on OpenAngels.`;
  const description = truncateMetaDescription(rawDescription, 155);

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/investor/${decodedSlug}`) },
    robots: {
      index: !isThinProfile,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/investor/${decodedSlug}`),
      siteName: 'OpenAngels',
      images: [DEFAULT_OG_IMAGE],
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_OG_IMAGE.url],
    },
  };
}

function getCompanyLink(companyName) {
  if (!companyName) return { href: '/directory', isInternal: false };
  const cleanSlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (KNOWN_COMPANY_SLUGS.has(cleanSlug)) {
    return { href: `/company/${cleanSlug}`, isInternal: true };
  }
  return { href: `/?search=${encodeURIComponent(companyName)}`, isInternal: false };
}

export default async function StandaloneInvestorPage({ params }) {
  const { slug } = await params;
  let decodedSlug = slug;
  try { decodedSlug = decodeURIComponent(slug); } catch {}

  const [rawInvestor, countData] = await Promise.all([
    getInvestorBySlug(decodedSlug),
    getDynamicInvestorCount(),
  ]);
  const { seoLabel } = countData;

  if (!rawInvestor) {
    notFound();
  }

  const safeInvestor = {
    ...rawInvestor,
    firm: extractFirmFromBio(rawInvestor.bio, rawInvestor.firm),
    email: null,
    phone: null,
    linkedin_url: rawInvestor.linkedin_url || null,
    twitter_url: rawInvestor.twitter_url || null,
    website: rawInvestor.website || null,
    has_email: rawInvestor.has_email !== undefined ? rawInvestor.has_email : !!rawInvestor.email,
    has_linkedin: rawInvestor.has_linkedin !== undefined ? rawInvestor.has_linkedin : !!rawInvestor.linkedin_url,
    has_twitter: rawInvestor.has_twitter !== undefined ? rawInvestor.has_twitter : !!rawInvestor.twitter_url,
    has_website: rawInvestor.has_website !== undefined ? rawInvestor.has_website : !!rawInvestor.website,
  };

  const formatMoney = (val) => {
    if (!val) return '';
    if (val >= 1000000) return `$${val / 1000000}M`;
    if (val >= 1000) return `$${val / 1000}k`;
    return `$${val}`;
  };

  const minStr = formatMoney(safeInvestor.check_min);
  const maxStr = formatMoney(safeInvestor.check_max);
  let checkSizeStr = 'Undisclosed ($25k – $250k typical for early angels)';
  if (minStr && maxStr) checkSizeStr = `${minStr} – ${maxStr}`;
  else if (minStr) checkSizeStr = `${minStr}+`;
  else if (maxStr) checkSizeStr = `Up to ${maxStr}`;

  const rawInd = safeInvestor.industry || safeInvestor.industries;
  const industries = Array.isArray(rawInd) ? rawInd : (typeof rawInd === 'string' ? [rawInd] : []);
  const primaryIndustry = industries[0] || 'AI';

  const rawStages = safeInvestor.stages || safeInvestor.stage;
  const stages = Array.isArray(rawStages) ? rawStages : (typeof rawStages === 'string' ? [rawStages] : ['Pre-seed', 'Seed']);

  const rawPort = safeInvestor.portfolio || safeInvestor.past_investments;
  const portfolioList = Array.isArray(rawPort)
    ? rawPort.filter(Boolean)
    : (typeof rawPort === 'string' && rawPort.trim() ? rawPort.split(',').map(s => s.trim()).filter(Boolean) : []);

  let cleanBio = safeInvestor.bio || '';
  if (cleanBio.includes('Source: http')) {
    cleanBio = cleanBio.split('Source: http')[0].trim();
  }
  if (isBoilerplateBio(cleanBio)) {
    cleanBio = generateUniqueBio(safeInvestor, industries, stages, checkSizeStr, portfolioList);
  }
  safeInvestor.bio = cleanBio;

  let relatedInvestors = [];
  try {
    const relData = await getRelatedIndustryPool(primaryIndustry);
    if (relData && relData.length > 0) {
      const slugHash = (decodedSlug || '').split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      const picked = [];
      for (let i = 0; i < relData.length && picked.length < 9; i++) {
        const idx = (slugHash + i * 7) % relData.length;
        const candidate = relData[idx];
        if (candidate && candidate.slug !== decodedSlug && !picked.some((p) => p.slug === candidate.slug)) {
          picked.push(candidate);
        }
      }
      relatedInvestors = picked;
    }
  } catch {}

  const firstChar = ((safeInvestor.name || 'a').trim()[0] || 'a').toLowerCase();
  const directoryLetter = /^[a-z]$/.test(firstChar) ? firstChar : 'a';

  const sameAsLinks = [
    safeInvestor.linkedin_url,
    safeInvestor.twitter_url,
    safeInvestor.website,
  ].filter(Boolean);

  const faqList = [
    {
      q: `What is ${safeInvestor.name}'s typical angel check size?`,
      a: `${safeInvestor.name}'s investment check size typically ranges around ${checkSizeStr}, participating in early-stage financing rounds alongside leading venture capital funds and angel syndicates.`,
    },
    {
      q: `What stages and sectors does ${safeInvestor.name} invest in?`,
      a: `${safeInvestor.name} primarily backs early-stage startups across ${stages.join(', ')} stages, focusing on ${industries.length > 0 ? industries.join(', ') : 'high-growth technology startups and venture software'}.`,
    },
    {
      q: `What companies are in ${safeInvestor.name}'s angel portfolio?`,
      a: portfolioList.length > 0
        ? `${safeInvestor.name} has backed notable companies including ${portfolioList.slice(0, 8).join(', ')}.`
        : `${safeInvestor.name} actively participates in early-stage technology investments and venture syndicates.`,
    },
    {
      q: `How can startup founders contact or pitch ${safeInvestor.name}?`,
      a: `Founders can access verified direct email contact channels, AI-assisted pitch drafting, and syndicate warm intro paths for ${safeInvestor.name} through OpenAngels.`,
    },
  ];

  const profileUrl = absoluteUrl(`/investor/${safeInvestor.slug || safeInvestor.id}`);
  const schemaData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${profileUrl}#webpage`,
        url: profileUrl,
        name: `${safeInvestor.name} — Angel Investor Profile (2026) | OpenAngels`,
        ...(safeInvestor.created_at && { dateCreated: new Date(safeInvestor.created_at).toISOString() }),
        dateModified: new Date(safeInvestor.updated_at || safeInvestor.created_at || '2026-11-26T00:00:00.000Z').toISOString(),
        isPartOf: { '@id': absoluteUrl('/#website') },
        breadcrumb: {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: absoluteUrl('/') },
            { '@type': 'ListItem', position: 2, name: 'Directory', item: absoluteUrl('/directory') },
            { '@type': 'ListItem', position: 3, name: `Investors (${directoryLetter.toUpperCase()})`, item: absoluteUrl(`/directory/${directoryLetter}`) },
            { '@type': 'ListItem', position: 4, name: safeInvestor.name, item: profileUrl },
          ],
        },
        mainEntity: {
          '@type': 'Person',
          '@id': `${profileUrl}#person`,
          name: safeInvestor.name || 'Angel Investor',
          jobTitle: 'Angel Investor',
          description: cleanBio,
          image: safeInvestor.avatar_url || 'https://openangels.xyz/og-image.png',
          url: profileUrl,
          mainEntityOfPage: profileUrl,
          ...(sameAsLinks.length > 0 && { sameAs: sameAsLinks }),
          ...(safeInvestor.firm && { worksFor: { '@type': 'Organization', name: safeInvestor.firm } }),
          ...(safeInvestor.location && { homeLocation: { '@type': 'Place', name: safeInvestor.location } }),
          ...(industries.length > 0 && { knowsAbout: industries }),
        },
      },
      {
        '@type': 'FAQPage',
        '@id': `${profileUrl}#faq`,
        mainEntity: faqList.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }} />

      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-400 min-w-0">
            <Link href="/" prefetch={false} className="hover:text-white transition-colors truncate">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <Link href="/directory" prefetch={false} className="hover:text-white transition-colors truncate">Directory</Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <Link href={`/directory/${directoryLetter}`} prefetch={false} className="hover:text-white transition-colors shrink-0">
              {directoryLetter.toUpperCase()}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <span className="text-zinc-200 font-semibold truncate">{safeInvestor.name}</span>
          </nav>

          <Link
            href="/directory"
            prefetch={false}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors text-xs font-medium shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to Directory</span>
            <span className="sm:hidden">Directory</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        <section aria-label="Investor Dossier">
          <InvestorProfileModal investor={safeInvestor} isStandalone={true} isPremium={false} />
        </section>

        <section
          id="quick-facts"
          aria-label="Key Deal Terms & Quick Facts"
          className="rounded-2xl sm:rounded-3xl bg-zinc-900/40 border border-zinc-800/80 p-5 sm:p-7 backdrop-blur-xl relative overflow-hidden shadow-xl"
        >
          <div className="flex items-center justify-between gap-3 mb-5 border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-300 border border-zinc-750">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">Key Deal Terms &amp; Quick Facts</h2>
                <p className="text-xs text-zinc-400">Audited venture due diligence summary for {safeInvestor.name}</p>
              </div>
            </div>

            <Link
              href="/methodology"
              prefetch={false}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-md bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-750 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Verified Deal Signals
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-zinc-400 font-semibold uppercase tracking-wider text-[10.5px] mb-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Typical Check Size</span>
              </div>
              <p className="text-sm font-bold text-emerald-400">{checkSizeStr}</p>
              <span className="text-[10px] text-zinc-400 mt-1">Direct angel check per syndicate / round</span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-zinc-400 font-semibold uppercase tracking-wider text-[10.5px] mb-1">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                <span>Target Stages</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {stages.map((stg) => (
                  <span key={stg} className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-850 text-zinc-300 border border-zinc-750">
                    {stg}
                  </span>
                ))}
              </div>
              <span className="text-[10px] text-zinc-400 mt-1">Early-stage entry valuation priority</span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-zinc-400 font-medium uppercase tracking-wider text-[10.5px] mb-1">
                <Lock className="w-3.5 h-3.5 text-red-400" />
                <span>Founder Pitch Contact</span>
              </div>
              <p className="text-xs font-mono text-zinc-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Verified (Protected — Unlock)</span>
              </p>
              <span className="text-[10px] text-zinc-400 mt-1">Direct mailbox protected against spam</span>
            </div>

            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 sm:col-span-2 lg:col-span-3">
              <div className="flex items-center gap-1.5 text-zinc-400 font-semibold uppercase tracking-wider text-[10.5px] mb-2">
                <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Focus Industries &amp; Categories</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {industries.length > 0 ? (
                  <>
                    {industries.map((ind) => {
                      const filterSlug = ind.toLowerCase().replace(/[\s/]+/g, '-');
                      return (
                        <Link
                          key={ind}
                          href={`/investors/${filterSlug}`}
                          prefetch={false}
                          title={`Browse all ${formatHumanLabel(ind)} angel investors and venture backers`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-amber-500/40 transition-colors"
                        >
                          <span>{formatHumanLabel(ind)} Investors</span>
                          <ChevronRight className="w-3 h-3 text-zinc-500" />
                        </Link>
                      );
                    })}
                    {(() => {
                      const validStages = stages
                        .map((s) => String(s).toLowerCase().trim().replace(/[\s_]+/g, '-'))
                        .filter((s) => Boolean(STAGE_SLUGS[s]));
                      const crossLinks = [];
                      for (const ind of industries.slice(0, 2)) {
                        const indSlug = ind.toLowerCase().replace(/[\s/]+/g, '-');
                        for (const stgSlug of validStages.slice(0, 2)) {
                          if (crossLinks.length >= 4) break;
                          crossLinks.push({ indSlug, stgSlug, label: `${formatHumanLabel(ind)} ${STAGE_SLUGS[stgSlug].label} Investors` });
                        }
                      }
                      return crossLinks.map((cl) => (
                        <Link
                          key={`${cl.indSlug}/${cl.stgSlug}`}
                          href={`/investors/${cl.indSlug}/${cl.stgSlug}`}
                          prefetch={false}
                          title={`Browse ${cl.label}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800/80 hover:border-emerald-500/40 transition-colors"
                        >
                          <span>{cl.label}</span>
                          <ChevronRight className="w-3 h-3 text-zinc-500" />
                        </Link>
                      ));
                    })()}
                  </>
                ) : (
                  <span className="text-zinc-400 text-xs">Technology &amp; Early-Stage Venture</span>
                )}
              </div>
            </div>

            {portfolioList.length > 0 && (
              <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 sm:col-span-2 lg:col-span-3">
                <div className="flex items-center justify-between text-zinc-400 font-semibold uppercase tracking-wider text-[10.5px] mb-2">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Notable Backed Deals &amp; Startups</span>
                  </span>
                  <span className="text-zinc-400 text-[10px] lowercase">Internal company dossiers</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {portfolioList.map((company, idx) => {
                    const link = getCompanyLink(company);
                    return (
                      <Link
                        key={idx}
                        href={link.href}
                        prefetch={false}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/20 hover:border-amber-500/40 transition-all"
                        title={link.isInternal ? `Inspect ${company} Company Dossier` : `Search ${company} on OpenAngels`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span>{company}</span>
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </section>

        <section
          aria-label="Unlock Pitch Contact"
          className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-red-950/30 border border-zinc-800 p-6 sm:p-8 relative overflow-hidden shadow-2xl"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Founder Pitch Acceleration</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Want to pitch {safeInvestor.name}?
              </h2>

              <p className="text-sm text-zinc-300 leading-relaxed">
                Unlock {safeInvestor.name}&apos;s verified direct pitch email address, AI-personalized cold pitch drafter tailored to their portfolio thesis, plus instant lifetime access to our entire database of {seoLabel} angel investors and seed VCs.
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-300 pt-1">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Verified direct email
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> AI pitch email drafter
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> One-time $49 payment
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
              <a
                href="https://beatsprom.gumroad.com/l/vgobnh"
                className="gumroad-button inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-xl shadow-red-600/25 hover:scale-[1.02] cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Unlock Pitch Email ($49)</span>
              </a>
              <p className="text-[11px] text-zinc-400 text-center">
                Instant unlock • {seoLabel} contacts
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="faq-heading" className="space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <HelpCircle className="w-4 h-4 text-red-500" />
            <h2 id="faq-heading" className="text-base sm:text-lg font-bold text-white tracking-tight">
              Frequently Asked Questions about {safeInvestor.name}
            </h2>
          </div>

          <div className="space-y-3">
            {faqList.map((item, idx) => (
              <details
                key={idx}
                open={idx === 0}
                className="group rounded-2xl bg-zinc-900/30 border border-zinc-800/80 overflow-hidden transition-all duration-200 open:bg-zinc-900/60 open:border-zinc-700/80"
              >
                <summary className="flex items-center justify-between gap-3 p-4 sm:p-5 font-semibold text-xs sm:text-sm text-zinc-200 hover:text-white cursor-pointer list-none select-none">
                  <span>{item.q}</span>
                  <span className="text-xs font-mono text-zinc-400 group-open:rotate-180 transition-transform shrink-0">▼</span>
                </summary>
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/40 pt-3">
                  <p>{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {relatedInvestors.length > 0 && (
          <section aria-labelledby="related-heading" className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-zinc-400" />
                <h2 id="related-heading" className="text-base sm:text-lg font-semibold text-white tracking-tight">
                  Other Active Angels in {primaryIndustry}
                </h2>
              </div>
              <Link
                href={`/investors/${primaryIndustry.toLowerCase().replace(/[\s/]+/g, '-')}`}
                prefetch={false}
                className="text-xs font-medium text-zinc-300 hover:text-white transition-colors"
              >
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {relatedInvestors.map((rel) => {
                const relStages = Array.isArray(rel.stages) ? rel.stages : [];
                return (
                  <Link
                    key={rel.id}
                    href={`/investor/${rel.slug}`}
                    prefetch={false}
                    className="group p-4 rounded-xl bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-colors flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <InvestorAvatar
                        name={rel.name}
                        avatarUrl={rel.avatar_url}
                        size={40}
                        className="w-10 h-10 rounded-xl ring-1 ring-zinc-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-semibold text-zinc-200 group-hover:text-white truncate">
                          {rel.name}
                        </h3>
                        {rel.location && (
                          <p className="text-[10px] text-zinc-400 truncate">{rel.location}</p>
                        )}
                      </div>
                    </div>

                    {relStages.length > 0 && (
                      <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10.5px]">
                        <span className="text-zinc-400">Stages:</span>
                        <span className="font-medium text-zinc-300">{relStages.slice(0, 2).join(', ')}</span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
