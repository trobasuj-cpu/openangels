import { supabase } from '@/lib/supabase';
import { absoluteUrl, formatIndustryLabel, getIndustryPage, INVESTOR_COUNT, PRODUCT_NAME, SITE_URL } from '@/seo.js';
import Link from 'next/link';
import { ArrowLeft, Mail, MapPin, DollarSign, Sparkles } from 'lucide-react';
import Footer from '@/components/Footer';

const CURRENT_YEAR = new Date().getFullYear();

export async function generateMetadata({ params }) {
  const { industry } = await params;
  const formattedIndustry = formatIndustryLabel(industry);
  const isKnownIndustry = Boolean(getIndustryPage(industry));
  const description = `Find ${formattedIndustry} angel investors and VCs from OpenAngels, a curated ${INVESTOR_COUNT} investor database with outreach tools for founders.`;
  const canonicalUrl = absoluteUrl(`/investors/${industry}`);

  return {
    title: `${formattedIndustry} Angel Investors and VCs (${CURRENT_YEAR}) | OpenAngels`,
    description,
    alternates: { canonical: canonicalUrl },
    robots: {
      index: isKnownIndustry,
      follow: true,
    },
    openGraph: {
      title: `${formattedIndustry} Angel Investors and VCs | OpenAngels`,
      description,
      url: canonicalUrl,
    },
    twitter: {
      title: `${formattedIndustry} Angel Investors | OpenAngels`,
      description,
    }
  };
}

export default async function IndustryInvestors({ params }) {
  const { industry } = await params;
  const formattedIndustry = formatIndustryLabel(industry);
  const canonicalUrl = absoluteUrl(`/investors/${industry}`);
  const description = `Find ${formattedIndustry} angel investors and VCs from OpenAngels, a curated ${INVESTOR_COUNT} investor database with outreach tools for founders.`;

  // Fetch data on the server
  let investors = [];
  let totalMatches = 0;
  
  try {
    const { data, count, error } = await supabase
      .from('investors_secure')
      .select('*', { count: 'exact' })
      .contains('industries', [industry])
      .order('name', { ascending: true })
      .limit(50);

    if (error) throw error;
    investors = data || [];
    totalMatches = count || data?.length || 0;
  } catch (err) {
    console.error('Error fetching industry investors:', err);
  }

  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${formattedIndustry} Angel Investors and VCs`,
    url: canonicalUrl,
    description,
    isPartOf: {
      '@type': 'WebSite',
      name: PRODUCT_NAME,
      url: SITE_URL,
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: investors.length,
      itemListElement: investors.slice(0, 10).map((investor, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: investor.name,
        description: investor.bio || `${formattedIndustry} investor profile on OpenAngels`,
      })),
    },
  };

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
            {formattedIndustry} Angel Investors
          </h1>
          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-3xl">
            {totalMatches > 0 
              ? `We found ${totalMatches} verified angel investors and VCs actively investing in ${formattedIndustry} startups.`
              : `Browse ${formattedIndustry} angel investors and VCs in our curated database.`
            }
          </p>
        </div>

        {investors.length > 0 ? (
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
                          {investor.name}
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
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/30 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
              No investors found
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 mb-6">
              We couldn't find any investors matching the {formattedIndustry} category.
            </p>
            <Link 
              href="/"
              className="inline-flex items-center justify-center h-10 px-6 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm font-medium transition-transform hover:scale-105"
            >
              Clear filters
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
