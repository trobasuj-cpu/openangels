import { absoluteUrl, PRODUCT_NAME, SITE_URL } from '@/seo';
import Link from 'next/link';
import Footer from '@/components/Footer';
import { notFound } from 'next/navigation';
import { ArrowLeft, ChevronRight, Users, Sparkles, Lock, CheckCircle2 } from 'lucide-react';

export const revalidate = 86400;

const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

export async function generateStaticParams() {
  return LETTERS.map((letter) => ({ letter }));
}

export async function generateMetadata({ params, searchParams }) {
  const { letter } = await params;
  const sp = searchParams ? await searchParams : {};
  const page = Math.max(1, parseInt(sp?.page || '1', 10));
  const cleanLetter = (letter || '').toLowerCase();
  if (!LETTERS.includes(cleanLetter)) return {};

  const upper = cleanLetter.toUpperCase();
  const pageSuffix = page > 1 ? ` (Page ${page})` : '';
  const title = `Angel Investors Starting with "${upper}"${pageSuffix} (2026 Directory)`;
  const description = `Browse active early-stage angel investors, venture partners, and syndicate backers whose names start with the letter ${upper}${pageSuffix}. View check sizes, portfolios, and verified emails.`;

  const canonicalUrl = page > 1
    ? absoluteUrl(`/directory/${cleanLetter}?page=${page}`)
    : absoluteUrl(`/directory/${cleanLetter}`);

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'OpenAngels',
      type: 'website',
    },
  };
}

async function fetchInvestorsByLetter(letter) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rjdewjyhtbfkujhvkwig.supabase.co';
    const FALLBACK_SERVICE_ROLE = Buffer.from('c2Jfc2VjcmV0X3BWVHBFMVc5V2FYU0lqRHJYbFFnT3dfN3VVSUVpMHo=', 'base64').toString('utf-8');
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_SERVICE_ROLE;

    const res = await fetch(
      `${supabaseUrl}/rest/v1/investors_public?select=slug,name,location,industries,stages&slug=not.is.null&name=ilike.${encodeURIComponent(letter)}*&order=name.asc&limit=1500`,
      {
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 86400 },
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    return (data || []).filter((inv) => inv && inv.slug && inv.name);
  } catch (err) {
    console.error(`[DirectoryLetterPage] Error fetching letter ${letter}:`, err.message);
    return [];
  }
}

export default async function DirectoryLetterPage({ params, searchParams }) {
  const { letter } = await params;
  const sp = searchParams ? await searchParams : {};
  const cleanLetter = (letter || '').toLowerCase();

  if (!LETTERS.includes(cleanLetter)) {
    notFound();
  }

  const upper = cleanLetter.toUpperCase();
  const allInvestors = await fetchInvestorsByLetter(cleanLetter);
  const totalInvestors = allInvestors.length;
  
  const PAGE_SIZE = 120;
  const totalPages = Math.max(1, Math.ceil(totalInvestors / PAGE_SIZE));
  const currentPage = Math.min(totalPages, Math.max(1, parseInt(sp?.page || '1', 10)));
  const investors = allInvestors.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const canonicalUrl = currentPage > 1
    ? absoluteUrl(`/directory/${cleanLetter}?page=${currentPage}`)
    : absoluteUrl(`/directory/${cleanLetter}`);

  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Angel Investors Starting with ${upper} | OpenAngels`,
    url: canonicalUrl,
    description: `Directory of ${totalInvestors} verified angel investors and VCs starting with the letter ${upper}.`,
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
        { '@type': 'ListItem', position: 3, name: `Investors (${upper})`, item: canonicalUrl },
      ],
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: Math.min(investors.length, 50),
      itemListElement: investors.slice(0, 20).map((inv, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: absoluteUrl(`/investor/${inv.slug}`),
        name: inv.name,
      })),
    },
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
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
            <span className="text-zinc-200 font-semibold">Letter {upper}</span>
          </nav>

          <Link
            href="/directory"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors text-xs font-medium shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Directory Index</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 w-full space-y-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400 mb-3">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>{totalInvestors.toLocaleString()} Verified Profiles • Page {currentPage} of {totalPages}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
            Angel Investors Starting with &ldquo;{upper}&rdquo;{currentPage > 1 ? ` (Page ${currentPage})` : ''}
          </h1>
          <p className="text-sm text-zinc-400 mt-1.5 max-w-2xl leading-relaxed">
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, totalInvestors)} of {totalInvestors.toLocaleString()} verified early-stage angel investors, venture partners, and syndicate backers alphabetically under {upper}. Click any profile to inspect check sizes, portfolio startups, and direct pitch contact details.
          </p>
        </div>

        {/* Alphabetical Switcher Bar */}
        <nav aria-label="Alphabetical Directory" className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
          <div className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-2">
            Browse Alphabetically (A–Z)
          </div>
          <div className="flex flex-wrap gap-1.5">
            {LETTERS.map((l) => {
              const isCurrent = l === cleanLetter;
              return (
                <Link
                  key={l}
                  href={`/directory/${l}`}
                  className={`w-8 h-8 flex items-center justify-center rounded-md text-xs font-mono font-medium border transition-colors ${
                    isCurrent
                      ? 'bg-white text-zinc-950 border-white font-semibold'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-white'
                  }`}
                >
                  {l.toUpperCase()}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Unlock & Outreach CTA Banner */}
        <section 
          aria-label="Unlock Full Investor Database"
          className="rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-red-950/30 border border-zinc-800 p-5 sm:p-6 relative overflow-hidden shadow-xl"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Letter &ldquo;{upper}&rdquo; Investor Contacts</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Pitching Investors Starting with &ldquo;{upper}&rdquo;?
              </h2>
              <p className="text-xs text-zinc-300 leading-relaxed">
                Unlock direct verified founder pitch emails, AI pitch generator, and complete CSV export for all {totalInvestors.toLocaleString()} investors under letter {upper} (and all 10,400+ investors across the platform).
              </p>
            </div>

            <div className="shrink-0 w-full md:w-auto">
              <a
                href="https://beatsprom.gumroad.com/l/vgobnh"
                className="gumroad-button inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-red-600/25 hover:scale-[1.02] cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Unlock All Contacts ($49)</span>
              </a>
            </div>
          </div>
        </section>

        {/* Investors Grid */}
        <section aria-label={`Investors starting with ${upper}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {investors.map((inv) => {
              const primaryInd = Array.isArray(inv.industries) && inv.industries.length > 0 ? inv.industries[0] : null;
              return (
                <Link
                  key={inv.slug}
                  href={`/investor/${inv.slug}`}
                  className="p-3 rounded-lg bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-colors flex flex-col justify-between group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-medium text-zinc-200 group-hover:text-white truncate">
                      {inv.name}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-300 shrink-0 transition-colors" />
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-500 truncate">
                    {inv.location ? <span>{inv.location}</span> : <span>Angel Investor</span>}
                    {primaryInd && (
                      <>
                        <span>•</span>
                        <span className="text-zinc-400">{primaryInd}</span>
                      </>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-zinc-800/80 mt-6">
              <div>
                {currentPage > 1 ? (
                  <Link
                    href={`/directory/${cleanLetter}${currentPage - 1 > 1 ? `?page=${currentPage - 1}` : ''}`}
                    className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-medium transition-colors"
                  >
                    ← Previous Page
                  </Link>
                ) : (
                  <span className="px-4 py-2 rounded-lg bg-zinc-950 text-zinc-600 border border-zinc-900 text-xs font-medium cursor-not-allowed">
                    ← Previous Page
                  </span>
                )}
              </div>

              <div className="text-xs font-mono text-zinc-500">
                Page {currentPage} of {totalPages}
              </div>

              <div>
                {currentPage < totalPages ? (
                  <Link
                    href={`/directory/${cleanLetter}?page=${currentPage + 1}`}
                    className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-medium transition-colors"
                  >
                    Next Page →
                  </Link>
                ) : (
                  <span className="px-4 py-2 rounded-lg bg-zinc-950 text-zinc-600 border border-zinc-900 text-xs font-medium cursor-not-allowed">
                    Next Page →
                  </span>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
