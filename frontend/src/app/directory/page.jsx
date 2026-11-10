import { INDUSTRY_PAGES, STAGE_SLUGS, GEO_REGIONS, POPULAR_HUBS, absoluteUrl, PRODUCT_NAME, SITE_URL } from '@/seo';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { ChevronRight, Users, ArrowUpRight, Sparkles, Lock, CheckCircle2 } from 'lucide-react';

export const revalidate = 86400;

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

const FEATURED_ANGELS = [
  { name: 'Naval Ravikant', slug: 'naval-ravikant', firm: 'AngelList • San Francisco' },
  { name: 'Sam Altman', slug: 'sam-altman', firm: 'OpenAI / Hydrazine • SF' },
  { name: 'Lenny Rachitsky', slug: 'lenny-rachitsky', firm: 'Airbnb Alumni • SaaS & Product' },
  { name: 'Elad Gil', slug: 'elad-gil', firm: 'Cosmic / Ex-Twitter • AI & SaaS' },
  { name: 'Paul Graham', slug: 'paul-graham', firm: 'Y Combinator • Mountain View' },
  { name: 'Garry Tan', slug: 'garry-tan', firm: 'Y Combinator / Initialized' },
  { name: 'Peter Thiel', slug: 'peter-thiel', firm: 'Founders Fund • Deep Tech' },
  { name: 'Reid Hoffman', slug: 'reid-hoffman', firm: 'Greylock / LinkedIn • AI' },
  { name: 'Balaji Srinivasan', slug: 'balaji-srinivasan', firm: 'Ex-a16z / Coinbase • Crypto & AI' },
  { name: 'Jason Calacanis', slug: 'jason-calacanis', firm: 'LAUNCH Syndicate • Seed' },
  { name: 'Greg Brockman', slug: 'greg-brockman', firm: 'OpenAI / Ex-Stripe • AI' },
  { name: 'Pieter Levels', slug: 'pieter-levels', firm: 'Indie Angel • AI & SaaS' },
  { name: 'Packy McCormick', slug: 'packy-mccormick', firm: 'Not Boring Capital • Seed' },
  { name: 'Dylan Field', slug: 'dylan-field', firm: 'Figma • Design & AI' },
  { name: 'Vinod Khosla', slug: 'vinod-khosla', firm: 'Khosla Ventures • Deep Tech' },
  { name: 'Daniel Gross', slug: 'daniel-gross', firm: 'AI Grant / Pioneer • AI' },
  { name: 'Chris Dixon', slug: 'chris-dixon', firm: 'a16z • Web3 & Software' },
  { name: 'Ron Conway', slug: 'ron-conway', firm: 'SV Angel • Silicon Valley' },
  { name: 'Shreyas Doshi', slug: 'shreyas-doshi', firm: 'Ex-Stripe / Twitter • B2B SaaS' },
  { name: 'Howard Hartenbaum', slug: 'howard-hartenbaum', firm: 'August Capital • Menlo Park' },
  { name: 'Tiffany Zhong', slug: 'tiffany-zhong', firm: 'Pineapple Capital • Consumer' },
  { name: 'Waseem Daher', slug: 'waseem-daher', firm: 'Pilot / Ex-Dropbox • Fintech' },
  { name: 'Mercedes Bent', slug: 'mercedes-bent', firm: 'Lightspeed • Consumer & EdTech' },
  { name: 'Bob Pasker', slug: 'bob-pasker', firm: 'Enterprise & Cloud Infrastructure' },
];

export const metadata = {
  title: 'Angel Investor Directory: 10,400+ Verified Startup Backers',
  description: 'Explore 10,400+ verified angel investors, syndicate leads, and early-stage VCs organized by industry (AI, SaaS, Fintech), stage (Pre-Seed, Seed), and A–Z index.',
  alternates: { canonical: absoluteUrl('/directory') },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
  openGraph: {
    title: 'Angel Investor Directory: 10,400+ Verified Startup Backers',
    description: 'Explore 10,400+ verified angel investors and early-stage VCs by industry, stage, location, and A–Z index.',
    url: absoluteUrl('/directory'),
    siteName: 'OpenAngels',
    type: 'website',
  },
};

export default function DirectoryPage() {

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'OpenAngels Investor Directory (2026)',
    url: absoluteUrl('/directory'),
    description: 'Master directory of 10,800+ verified angel investors and early-stage venture funds organized by industry, funding stage, geography, and alphabetical index.',
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
      ],
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: FEATURED_ANGELS.length,
      itemListElement: FEATURED_ANGELS.map((inv, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: absoluteUrl(`/investor/${inv.slug}`),
        name: inv.name,
      })),
    },
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col font-sans text-zinc-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      <header className="h-14 border-b border-zinc-800/80 flex items-center justify-between px-4 sm:px-8 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40 shrink-0">
        <Link href="/" className="flex items-center gap-2 text-white font-semibold text-base tracking-tight hover:opacity-90 transition-opacity">
          <div className="w-7 h-7 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">OA</span>
          </div>
          <span>OpenAngels</span>
        </Link>

        <Link
          href="/"
          className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-medium transition-colors"
        >
          Interactive Search &amp; Filters
        </Link>
      </header>
      
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-12 w-full space-y-12">
        {/* Hero Header */}
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 mb-3">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>10,800+ Verified Angel Profiles • Updated 2026</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-semibold tracking-tight text-white mb-3">
            Angel Investor &amp; Venture Directory
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-3xl leading-relaxed">
            OpenAngels indexes over 10,800 active early-stage angel investors, operator-angels, and venture syndicates. Browse below by alphabetical index (A–Z), target industry, investment stage, or geographic hub to inspect verified check sizes, backed startups, and direct founder pitch contacts.
          </p>
        </div>

        {/* Directory Pitch & Access Banner */}
        <section 
          aria-label="Unlock Full Investor Database"
          className="rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-red-950/30 border border-zinc-800 p-6 sm:p-7 relative overflow-hidden shadow-xl"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>All 10,400+ Investor Profiles</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Want Direct Pitch Email Access to the Full Database?
              </h2>
              <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                Unlock direct verified founder pitch emails, AI cold pitch generator, check sizes, and complete CSV export for all 10,400+ angel investors and seed VCs across every sector.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400 pt-1">
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 10,400+ verified contacts
                </span>
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Full CSV export
                </span>
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> $49 one-time lifetime
                </span>
              </div>
            </div>

            <div className="shrink-0 w-full md:w-auto">
              <a
                href="https://beatsprom.gumroad.com/l/vgobnh"
                className="gumroad-button inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm transition-all shadow-lg shadow-red-600/25 hover:scale-[1.02] cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Unlock Full Database ($49)</span>
              </a>
            </div>
          </div>
        </section>

        {/* 1. Alphabetical Directory A-Z Subpages */}
        <section aria-labelledby="az-heading" className="p-5 sm:p-6 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h2 id="az-heading" className="text-base sm:text-lg font-semibold text-white tracking-tight">
                Browse All 10,800+ Investors Alphabetically (A–Z)
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Select a letter to browse the complete index of verified angel investors by last or first name.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-13 gap-2">
            {LETTERS.map((letter) => (
              <Link
                key={letter}
                href={`/directory/${letter}`}
                className="h-10 flex items-center justify-center rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 hover:border-zinc-700 font-mono text-xs sm:text-sm font-semibold transition-colors"
                title={`Angel Investors starting with ${letter.toUpperCase()}`}
              >
                {letter.toUpperCase()}
              </Link>
            ))}
          </div>
        </section>

        {/* 2. Featured Active Super-Angels */}
        <section aria-labelledby="featured-heading">
          <div className="flex items-center justify-between gap-2 mb-4 pb-2.5 border-b border-zinc-800/80">
            <div>
              <h2 id="featured-heading" className="text-lg sm:text-xl font-semibold text-white tracking-tight">
                Featured Active Angel Investors
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                High-velocity operator-angels and syndicate leads actively deploying pre-seed &amp; seed checks.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {FEATURED_ANGELS.map((inv) => (
              <Link
                key={inv.slug}
                href={`/investor/${inv.slug}`}
                className="p-3 rounded-lg bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-colors group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-xs sm:text-sm font-medium text-zinc-100 group-hover:text-white truncate">
                    {inv.name}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 shrink-0 transition-colors" />
                </div>
                <span className="text-[11px] text-zinc-500 truncate mt-1">
                  {inv.firm}
                </span>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. High-Intent Cross-Filter Hubs (Industry + Stage / Location) */}
        <section aria-labelledby="hubs-heading">
          <h2 id="hubs-heading" className="text-lg sm:text-xl font-semibold text-white tracking-tight mb-4 pb-2.5 border-b border-zinc-800/80">
            Curated Sector &amp; Stage Investor Lists
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {POPULAR_HUBS.map((hub) => (
              <Link
                key={hub.filters.join('/')}
                href={`/investors/${hub.filters.join('/')}`}
                className="px-3.5 py-2.5 rounded-lg bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 text-xs font-medium text-zinc-300 hover:text-white flex items-center justify-between transition-colors"
              >
                <span className="truncate">{hub.label} Investors</span>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
              </Link>
            ))}
          </div>
        </section>

        {/* 4. Browse by Industry */}
        <section aria-labelledby="industry-heading">
          <h2 id="industry-heading" className="text-lg sm:text-xl font-semibold text-white tracking-tight mb-4 pb-2.5 border-b border-zinc-800/80">
            Browse Investors by Industry
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {INDUSTRY_PAGES.map((page) => (
              <Link
                key={page.slug}
                href={`/investors/${page.slug}`}
                className="px-3 py-2 rounded-lg bg-zinc-900/20 hover:bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700 text-xs text-zinc-300 hover:text-white transition-colors truncate"
              >
                {page.label} Investors
              </Link>
            ))}
          </div>
        </section>

        {/* 5. Browse by Funding Stage & Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section aria-labelledby="stage-heading">
            <h2 id="stage-heading" className="text-lg font-semibold text-white tracking-tight mb-4 pb-2.5 border-b border-zinc-800/80">
              Browse by Funding Stage
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(STAGE_SLUGS).map(([slug, info]) => (
                <Link
                  key={slug}
                  href={`/investors/${slug}`}
                  className="px-3.5 py-2.5 rounded-lg bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 text-xs font-medium text-zinc-300 hover:text-white flex items-center justify-between transition-colors"
                >
                  <span>{info.label} Investors</span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />
                </Link>
              ))}
            </div>
          </section>

          <section aria-labelledby="geo-heading">
            <h2 id="geo-heading" className="text-lg font-semibold text-white tracking-tight mb-4 pb-2.5 border-b border-zinc-800/80">
              Browse by Location
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(GEO_REGIONS).map(([slug, info]) => (
                <Link
                  key={slug}
                  href={`/investors/${slug}`}
                  className="px-3 py-2 rounded-lg bg-zinc-900/20 hover:bg-zinc-900 border border-zinc-800/60 hover:border-zinc-700 text-xs text-zinc-300 hover:text-white transition-colors truncate"
                >
                  Investors in {info.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
