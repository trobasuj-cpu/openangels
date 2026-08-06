import { INDUSTRY_PAGES, STAGE_SLUGS, GEO_REGIONS, absoluteUrl } from '@/seo';
import Link from 'next/link';
import Footer from '@/components/Footer';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Investor Directory | OpenAngels',
  description: 'Browse our complete directory of angel investors and VCs by industry, stage, and location.',
  alternates: { canonical: absoluteUrl('/directory') },
};

async function fetchInvestors() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[DirectoryPage] Missing Supabase env vars');
      return [];
    }

    const res = await fetch(
      `${supabaseUrl}/rest/v1/investors_secure?select=slug,name,firm&slug=not.is.null&name=not.is.null&order=name.asc&limit=4000`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        next: { revalidate: 3600 }, // ISR: refresh every 1 hour
      }
    );

    if (!res.ok) {
      console.error('[DirectoryPage] Supabase fetch error:', res.status, res.statusText);
      return [];
    }

    return await res.json();
  } catch (err) {
    console.error('[DirectoryPage] Fetch error:', err.message);
    return [];
  }
}

export default async function DirectoryPage() {
  const investorList = await fetchInvestors();

  // Group into alphabetical sections
  const grouped = {};
  for (const inv of investorList) {
    const letter = (inv.name?.[0] || '#').toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(inv);
  }
  const sortedLetters = Object.keys(grouped).sort();

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col font-sans text-zinc-900 dark:text-zinc-100">
      <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 lg:px-8 bg-white dark:bg-black shrink-0">
        <Link href="/" className="flex items-center gap-2 text-zinc-900 dark:text-white font-semibold text-lg tracking-tight hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-zinc-900 dark:bg-white rounded-lg flex items-center justify-center">
            <span className="text-white dark:text-black text-sm font-bold">OA</span>
          </div>
          OpenAngels
        </Link>
      </header>
      
      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
        <div className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">Investor Directory</h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400">
            Browse our complete database of angel investors and venture capitalists by industry, funding stage, and geographic location.
          </p>
        </div>

        <div className="space-y-16">
          <section>
            <h2 className="text-2xl font-bold mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-2">Browse by Industry</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {INDUSTRY_PAGES.map(page => (
                <Link 
                  key={page.slug} 
                  href={`/investors/${page.slug}`}
                  className="text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-500 font-medium transition-colors"
                >
                  {page.label} Investors
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-2">Browse by Funding Stage</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(STAGE_SLUGS).map(([slug, info]) => (
                <Link 
                  key={slug} 
                  href={`/investors/${slug}`}
                  className="text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-500 font-medium transition-colors"
                >
                  {info.label} Investors
                </Link>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-2">Browse by Location</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(GEO_REGIONS).map(([slug, info]) => (
                <Link 
                  key={slug} 
                  href={`/investors/${slug}`}
                  className="text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-500 font-medium transition-colors"
                >
                  Investors in {info.label}
                </Link>
              ))}
            </div>
          </section>

          {/* Complete A-Z Investor Index — crawlable internal links for Googlebot */}
          {investorList.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold mb-6 border-b border-zinc-200 dark:border-zinc-800 pb-2">
                All Angel Investors A-Z ({investorList.length.toLocaleString()} profiles)
              </h2>
              
              {/* Letter quick-nav */}
              <nav className="flex flex-wrap gap-1.5 mb-8" aria-label="Alphabetical navigation">
                {sortedLetters.map(letter => (
                  <a 
                    key={letter} 
                    href={`#letter-${letter}`}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 border border-zinc-200 dark:border-zinc-800 transition-colors"
                  >
                    {letter}
                  </a>
                ))}
              </nav>

              {/* Investor list grouped by letter */}
              <div className="space-y-8">
                {sortedLetters.map(letter => (
                  <div key={letter} id={`letter-${letter}`}>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-3 sticky top-0 bg-zinc-50 dark:bg-zinc-950 py-1 z-10 border-b border-zinc-200/50 dark:border-zinc-800/50">
                      {letter}
                      <span className="text-xs font-normal text-zinc-500 ml-2">({grouped[letter].length})</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-1">
                      {grouped[letter].map(inv => (
                        <Link
                          key={inv.slug}
                          href={`/investor/${inv.slug}`}
                          className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 truncate py-0.5 transition-colors"
                          title={inv.firm ? `${inv.name} — ${inv.firm}` : inv.name}
                        >
                          {inv.name}
                          {inv.firm && <span className="text-zinc-400 dark:text-zinc-600 text-xs ml-1">· {inv.firm}</span>}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
