import { INDUSTRY_PAGES, STAGE_SLUGS, GEO_REGIONS, absoluteUrl } from '@/seo';
import Link from 'next/link';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Investor Directory | OpenAngels',
  description: 'Browse our complete directory of angel investors and VCs by industry, stage, and location.',
  alternates: { canonical: absoluteUrl('/directory') },
};

export default function DirectoryPage() {
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
        </div>
      </main>

      <Footer />
    </div>
  );
}
