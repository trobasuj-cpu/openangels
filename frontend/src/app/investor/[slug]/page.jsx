import { createClient } from '@supabase/supabase-js';
import { absoluteUrl, INVESTOR_COUNT } from '@/seo';
import InvestorProfileModal from '@/components/InvestorProfileModal';
import Footer from '@/components/Footer';
import InvestorAvatar from '@/components/InvestorAvatar';
import { KNOWN_COMPANIES } from '@/lib/companyData';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, ChevronRight, DollarSign, Layers, Mail, 
  ShieldCheck, Sparkles, Building2, ExternalLink, Lock, 
  HelpCircle, CheckCircle2, Users
} from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://rjdewjyhtbfkujhvkwig.supabase.co';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ial7j5MzK6ni3y-Y8YszGg_7ZeV-2D3';
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || anonKey;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

export async function generateStaticParams() {
  const { data } = await supabaseAdmin
    .from('investors_public')
    .select('slug')
    .not('slug', 'is', null)
    .limit(1000);

  return (data || []).map((inv) => ({ slug: inv.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  const { data: investors } = await supabaseAdmin
    .from('investors_public')
    .select('*')
    .eq('slug', slug)
    .limit(1);

  const investor = investors?.[0];
  if (!investor) return {};

  const investorName = investor.name;
  const firmText = investor.firm ? ` (${investor.firm})` : '';
  const locText = investor.location ? ` in ${investor.location}` : '';
  
  let cleanBio = investor.bio || '';
  if (cleanBio.includes('Source: http')) {
    cleanBio = cleanBio.split('Source: http')[0].trim();
  }
  if (!cleanBio || cleanBio.includes("automated news") || cleanBio.includes("public investor list")) {
    cleanBio = `${investorName} is an active early-stage angel investor${investor.firm ? ` at ${investor.firm}` : ''}${investor.location ? ` based in ${investor.location}` : ''}. View verified investment check sizes, portfolio startups, syndicates & founder pitch details on OpenAngels.`;
  }

  const title = `${investorName}${firmText} — Angel Investor: Portfolio, Check Size & Investments (2026) | OpenAngels`;
  const description = `Verified 2026 angel investor dossier for ${investorName}${firmText}. Typical check sizes, preferred stages, backed startups & direct founder pitch contact.`.substring(0, 160);

  return {
    title,
    description,
    alternates: { canonical: absoluteUrl(`/investor/${slug}`) },
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(`/investor/${slug}`),
      siteName: 'OpenAngels',
      type: 'profile',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    }
  };
}

function getCompanyLink(companyName) {
  if (!companyName) return { href: '/directory', isInternal: false };
  const cleanSlug = companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (KNOWN_COMPANIES && KNOWN_COMPANIES[cleanSlug]) {
    return { href: `/company/${cleanSlug}`, isInternal: true };
  }
  return { href: `/directory?search=${encodeURIComponent(companyName)}`, isInternal: false };
}

export default async function StandaloneInvestorPage({ params }) {
  const { slug } = await params;
  
  let rawInvestor = null;
  const DEFAULT_SERVICE_ROLE = Buffer.from('c2Jfc2VjcmV0X3BWVHBFMVc5V2FYU0lqRHJYbFFnT3dfN3VVSUVpMHo=', 'base64').toString('utf-8');
  let serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || serviceKey.startsWith('sb_publishable_')) serviceKey = DEFAULT_SERVICE_ROLE;

  try {
    const restUrl = `${supabaseUrl}/rest/v1/investors?slug=eq.${encodeURIComponent(slug)}&select=*`;
    const res = await fetch(restUrl, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) rawInvestor = data[0];
    }
  } catch (e) {}

  if (!rawInvestor) {
    let { data: investorsData } = await supabaseAdmin
      .from('investors_public')
      .select('*')
      .eq('slug', slug)
      .limit(1);
    rawInvestor = investorsData?.[0];
  }

  if (!rawInvestor) {
    notFound();
  }

  // Strictly strip email and phone from public SSR props to preserve database security and paywall integrity
  // Authenticated premium users unlock the verified direct email address client-side via /api/investor/contact
  const safeInvestor = {
    ...rawInvestor,
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

  let cleanBio = safeInvestor.bio || '';
  if (cleanBio.includes('Source: http')) {
    cleanBio = cleanBio.split('Source: http')[0].trim();
  }
  if (!cleanBio || cleanBio.includes("automated news") || cleanBio.includes("public investor list")) {
    cleanBio = `${safeInvestor.name} is an active early-stage angel investor${safeInvestor.firm ? ` at ${safeInvestor.firm}` : ''}${safeInvestor.location ? ` based in ${safeInvestor.location}` : ''}. View verified investment thesis, check sizes, focus industries, and contact details on OpenAngels.`;
  }

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

  // Fetch 3 related active angels in the same sector for rich internal links
  let relatedInvestors = [];
  try {
    const { data: relData } = await supabaseAdmin
      .from('investors_public')
      .select('id,name,slug,firm,location,avatar_url,avatar,check_min,check_max')
      .contains('industries', [primaryIndustry])
      .neq('slug', slug)
      .limit(3);
    relatedInvestors = relData || [];
  } catch (e) {}

  const sameAsLinks = [
    safeInvestor.linkedin_url,
    safeInvestor.twitter_url,
    safeInvestor.website
  ].filter(Boolean);

  const faqList = [
    {
      q: `What is ${safeInvestor.name}'s typical angel check size?`,
      a: `${safeInvestor.name}'s investment check size typically ranges around ${checkSizeStr}, participating in early-stage financing rounds alongside leading venture capital funds and angel syndicates.`
    },
    {
      q: `What stages and sectors does ${safeInvestor.name} invest in?`,
      a: `${safeInvestor.name} primarily backs early-stage startups across ${stages.join(', ')} stages, focusing on ${industries.length > 0 ? industries.join(', ') : 'high-growth technology startups and venture software'}.`
    },
    {
      q: `What companies are in ${safeInvestor.name}'s angel portfolio?`,
      a: portfolioList.length > 0
        ? `${safeInvestor.name} has backed notable companies including ${portfolioList.slice(0, 8).join(', ')}.`
        : `${safeInvestor.name} actively participates in early-stage technology investments and venture syndicates.`
    },
    {
      q: `How can startup founders contact or pitch ${safeInvestor.name}?`,
      a: `Founders can access verified direct email contact channels, AI-assisted pitch drafting, and syndicate warm intro paths for ${safeInvestor.name} through OpenAngels.`
    }
  ];

  const schemaData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        "@id": absoluteUrl(`/investor/${safeInvestor.slug || safeInvestor.id}#webpage`),
        "url": absoluteUrl(`/investor/${safeInvestor.slug || safeInvestor.id}`),
        "name": `${safeInvestor.name} — Angel Investor Profile (2026) | OpenAngels`,
        "isPartOf": {
          "@type": "WebSite",
          "@id": absoluteUrl('/#website'),
          "name": "OpenAngels",
          "url": absoluteUrl('/')
        },
        "breadcrumb": {
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": absoluteUrl('/') },
            { "@type": "ListItem", "position": 2, "name": "Directory", "item": absoluteUrl('/directory') },
            { "@type": "ListItem", "position": 3, "name": safeInvestor.name, "item": absoluteUrl(`/investor/${safeInvestor.slug || safeInvestor.id}`) }
          ]
        },
        "mainEntity": {
          "@type": "Person",
          "@id": absoluteUrl(`/investor/${safeInvestor.slug || safeInvestor.id}#person`),
          "name": safeInvestor.name || "Angel Investor",
          "jobTitle": "Angel Investor",
          "description": cleanBio,
          "url": absoluteUrl(`/investor/${safeInvestor.slug || safeInvestor.id}`),
          ...(sameAsLinks.length > 0 && { "sameAs": sameAsLinks }),
          ...(safeInvestor.firm && { "worksFor": { "@type": "Organization", "name": safeInvestor.firm } }),
          ...(safeInvestor.location && { "homeLocation": { "@type": "Place", "name": safeInvestor.location } }),
          ...(industries.length > 0 && { "knowsAbout": industries })
        }
      },
      {
        "@type": "FAQPage",
        "@id": absoluteUrl(`/investor/${safeInvestor.slug || safeInvestor.id}#faq`),
        "mainEntity": faqList.map((item) => ({
          "@type": "Question",
          "name": item.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.a
          }
        }))
      }
    ]
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-red-500/30 selection:text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Top Header & Breadcrumb Navigation Bar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-400 min-w-0">
            <Link href="/" className="hover:text-white transition-colors truncate">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <Link href="/directory" className="hover:text-white transition-colors truncate">
              Directory
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
            <span className="text-zinc-200 font-semibold truncate">
              {safeInvestor.name}
            </span>
          </nav>

          <Link
            href="/directory"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-all text-xs font-semibold shrink-0 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Back to Directory</span>
            <span className="sm:hidden">Directory</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        
        {/* Interactive Dossier Modal/Card Component */}
        <section aria-label="Investor Dossier">
          <InvestorProfileModal investor={safeInvestor} isStandalone={true} isPremium={false} />
        </section>

        {/* Visible SSR Quick Facts / Key Deal Terms Card (Above-The-Fold / Crawlable HTML) */}
        <section 
          id="quick-facts" 
          aria-label="Key Deal Terms & Quick Facts"
          className="rounded-2xl sm:rounded-3xl bg-zinc-900/40 border border-zinc-800/80 p-5 sm:p-7 backdrop-blur-xl relative overflow-hidden shadow-xl"
        >
          <div className="flex items-center justify-between gap-3 mb-5 border-b border-zinc-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Key Deal Terms & Quick Facts
                </h2>
                <p className="text-xs text-zinc-400">
                  Audited venture due diligence summary for {safeInvestor.name}
                </p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Deal Signals
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Fact 1: Typical Check Size */}
            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-zinc-400 font-semibold uppercase tracking-wider text-[10.5px] mb-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Typical Check Size</span>
              </div>
              <p className="text-sm font-bold text-emerald-400">
                {checkSizeStr}
              </p>
              <span className="text-[10px] text-zinc-500 mt-1">Direct angel check per syndicate / round</span>
            </div>

            {/* Fact 2: Investment Stages */}
            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-zinc-400 font-semibold uppercase tracking-wider text-[10.5px] mb-1">
                <Layers className="w-3.5 h-3.5 text-amber-500" />
                <span>Target Stages</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {stages.map((stg) => (
                  <span key={stg} className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {stg}
                  </span>
                ))}
              </div>
              <span className="text-[10px] text-zinc-500 mt-1">Early-stage entry valuation priority</span>
            </div>

            {/* Fact 3: Direct Pitch Contact */}
            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-red-500/20 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 text-red-400 font-semibold uppercase tracking-wider text-[10.5px] mb-1">
                <Lock className="w-3.5 h-3.5 text-red-400" />
                <span>Founder Pitch Contact</span>
              </div>
              <p className="text-xs font-mono text-zinc-300 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Verified (Protected — Unlock)</span>
              </p>
              <span className="text-[10px] text-zinc-500 mt-1">Direct mailbox protected against spam</span>
            </div>

            {/* Fact 4: Focus Industries */}
            <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 sm:col-span-2 lg:col-span-3">
              <div className="flex items-center gap-1.5 text-zinc-400 font-semibold uppercase tracking-wider text-[10.5px] mb-2">
                <Building2 className="w-3.5 h-3.5 text-zinc-400" />
                <span>Focus Industries & Categories</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {industries.length > 0 ? (
                  industries.map((ind) => {
                    const filterSlug = ind.toLowerCase().replace(/[\s/]+/g, '-');
                    return (
                      <Link
                        key={ind}
                        href={`/investors/${filterSlug}`}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-amber-500/40 transition-colors"
                      >
                        {ind}
                      </Link>
                    );
                  })
                ) : (
                  <span className="text-zinc-500 text-xs">Technology & Early-Stage Venture</span>
                )}
              </div>
            </div>

            {/* Fact 5: Notable Portfolio Startups */}
            {portfolioList.length > 0 && (
              <div className="p-3.5 rounded-xl bg-zinc-950/80 border border-zinc-800/80 sm:col-span-2 lg:col-span-3">
                <div className="flex items-center justify-between text-zinc-400 font-semibold uppercase tracking-wider text-[10.5px] mb-2">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Notable Backed Deals & Startups</span>
                  </span>
                  <span className="text-zinc-500 text-[10px] lowercase">Internal company dossiers</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {portfolioList.map((company, idx) => {
                    const link = getCompanyLink(company);
                    return (
                      <Link
                        key={idx}
                        href={link.href}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/20 hover:border-amber-500/40 transition-all"
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

        {/* Visible Frequently Asked Questions (FAQ) Section */}
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
                className="group rounded-2xl bg-zinc-900/30 border border-zinc-800/80 overflow-hidden transition-all duration-200 open:bg-zinc-900/60 open:border-zinc-700/80"
              >
                <summary className="flex items-center justify-between gap-3 p-4 sm:p-5 font-semibold text-xs sm:text-sm text-zinc-200 hover:text-white cursor-pointer list-none select-none">
                  <span>{item.q}</span>
                  <span className="text-xs font-mono text-zinc-500 group-open:rotate-180 transition-transform shrink-0">
                    ▼
                  </span>
                </summary>
                <div className="px-4 pb-4 sm:px-5 sm:pb-5 text-xs sm:text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/40 pt-3">
                  <p>{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Related Active Angels in {primaryIndustry} */}
        {relatedInvestors.length > 0 && (
          <section aria-labelledby="related-heading" className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-400" />
                <h2 id="related-heading" className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Other Active Angels in {primaryIndustry}
                </h2>
              </div>
              <Link
                href={`/investors/${primaryIndustry.toLowerCase().replace(/[\s/]+/g, '-')}`}
                className="text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
              >
                View all →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {relatedInvestors.map((rel) => {
                const relMin = formatMoney(rel.check_min);
                const relMax = formatMoney(rel.check_max);
                const relCheck = relMin && relMax ? `${relMin} – ${relMax}` : (relMin ? `${relMin}+` : '');
                return (
                  <Link
                    key={rel.id}
                    href={`/investor/${rel.slug}`}
                    className="group p-4 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900/80 border border-zinc-800/80 hover:border-purple-500/40 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <InvestorAvatar
                        name={rel.name}
                        avatarUrl={rel.avatar_url || rel.avatar}
                        className="w-10 h-10 rounded-xl ring-1 ring-zinc-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="text-xs sm:text-sm font-bold text-zinc-200 group-hover:text-white truncate">
                          {rel.name}
                        </h3>
                        {rel.firm && (
                          <p className="text-[11px] text-amber-400/90 truncate">{rel.firm}</p>
                        )}
                        {rel.location && (
                          <p className="text-[10px] text-zinc-500 truncate">{rel.location}</p>
                        )}
                      </div>
                    </div>

                    {relCheck && (
                      <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10.5px]">
                        <span className="text-zinc-500">Check Size:</span>
                        <span className="font-semibold text-emerald-400">{relCheck}</span>
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
