import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Mail, MapPin, DollarSign, Sparkles } from 'lucide-react';
import Footer from '../components/Footer';
import { absoluteUrl, formatIndustryLabel, getIndustryPage, INVESTOR_COUNT, PRODUCT_NAME, SITE_URL } from '../seo.js';

const CURRENT_YEAR = new Date().getFullYear();

export default function IndustryInvestors() {
  const { industry = '' } = useParams();
  const [investors, setInvestors] = useState([]);
  const [totalMatches, setTotalMatches] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const industryPage = useMemo(() => getIndustryPage(industry), [industry]);
  const formattedIndustry = useMemo(() => formatIndustryLabel(industry), [industry]);
  const canonicalPath = `/investors/${industry}`;
  const canonicalUrl = absoluteUrl(canonicalPath);
  const isKnownIndustry = Boolean(industryPage);
  const description = `Find ${formattedIndustry} angel investors and VCs from OpenAngels, a curated ${INVESTOR_COUNT} investor database with outreach tools for founders.`;

  useEffect(() => {
    const fetchInvestors = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data, count, error: fetchError } = await supabase
          .from('investors_secure')
          .select('*', { count: 'exact' })
          .contains('industries', [industry])
          .order('name', { ascending: true })
          .limit(50);

        if (fetchError) throw fetchError;

        setInvestors(data || []);
        setTotalMatches(count || data?.length || 0);
      } catch (err) {
        console.error('Error fetching industry investors:', err);
        setError(err.message);
        setInvestors([]);
        setTotalMatches(0);
      } finally {
        setLoading(false);
      }
    };

    if (industry) fetchInvestors();
  }, [industry]);

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
      <Helmet>
        <title>{formattedIndustry} Angel Investors and VCs ({CURRENT_YEAR}) | OpenAngels</title>
        <meta name="description" content={description} />
        <meta name="robots" content={isKnownIndustry ? 'index,follow' : 'noindex,follow'} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={PRODUCT_NAME} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:title" content={`${formattedIndustry} Angel Investors and VCs | OpenAngels`} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content={absoluteUrl('/og-image.png')} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${formattedIndustry} Angel Investors | OpenAngels`} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={absoluteUrl('/og-image.png')} />
        <script type="application/ld+json">{JSON.stringify(pageSchema)}</script>
      </Helmet>

      <main className="flex-1 max-w-5xl mx-auto px-6 py-12 w-full">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-500 dark:hover:text-amber-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Database
          </Link>
        </div>

        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            {formattedIndustry} Angel Investors <span className="text-zinc-500 dark:text-zinc-500 font-medium">({CURRENT_YEAR})</span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-3xl leading-relaxed">
            Raising for a {formattedIndustry} startup is easier when your outreach starts with investors who already understand {industryPage?.angle || 'the market, buyer, and funding path'}. OpenAngels helps {industryPage?.audience || 'founders'} find relevant angels and VCs, review profiles, and draft personalized investor emails.
          </p>
        </div>

        <div className="mb-12 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold mb-2 text-amber-900 dark:text-amber-400">
              {loading ? 'Loading investor matches...' : `Found ${totalMatches.toLocaleString()} ${formattedIndustry} investor profiles`}
            </h2>
            <p className="text-amber-700 dark:text-amber-500/80">
              Unlock the full database to view contact details, save investors to your CRM, and use the AI pitch generator.
            </p>
          </div>
          <Link to="/" className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl whitespace-nowrap shadow-lg shadow-amber-500/25 transition-all">
            Open Investor Database
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
          </div>
        ) : error ? (
          <div className="py-20 text-center text-red-600 dark:text-red-400">
            Could not load investor profiles right now.
          </div>
        ) : investors.length === 0 ? (
          <div className="py-20 text-center text-zinc-500 dark:text-zinc-400">
            No investor profiles are available for this category yet.
          </div>
        ) : (
          <div className="space-y-4 mb-16">
            {investors.map((inv) => (
              <article key={inv.id} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col md:flex-row gap-6 hover:border-amber-500/50 transition-colors group">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="text-xl font-bold">{inv.name}</h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400 mb-4">
                    {inv.location && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" />
                        {inv.location}
                      </div>
                    )}
                    {(inv.check_min || inv.check_max) && (
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4" />
                        {inv.check_min ? `$${inv.check_min / 1000}k` : '$0'} - {inv.check_max ? `$${inv.check_max / 1000}k` : 'Max'}
                      </div>
                    )}
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-300 line-clamp-2 leading-relaxed">
                    {inv.bio || `Investor profile relevant to ${formattedIndustry} founders.`}
                  </p>
                </div>
                <div className="flex items-center md:items-end justify-start md:justify-end">
                  <Link to="/" className="px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-zinc-900 dark:text-amber-500 font-medium rounded-xl text-sm transition-colors flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Reveal Contact
                  </Link>
                </div>
              </article>
            ))}

            {totalMatches > investors.length && (
              <div className="pt-8 text-center mb-16">
                <Link to="/" className="inline-flex items-center gap-2 px-8 py-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 font-bold rounded-xl transition-colors shadow-lg">
                  <Sparkles className="w-5 h-5" />
                  View all {totalMatches.toLocaleString()} profiles
                </Link>
              </div>
            )}
          </div>
        )}

        <section className="mt-12 pt-12 border-t border-zinc-200 dark:border-zinc-800">
          <h2 className="text-2xl font-bold mb-6">How to approach {formattedIndustry} investors</h2>
          <div className="space-y-6 text-zinc-600 dark:text-zinc-400">
            <p>
              A strong {formattedIndustry} investor list should help you avoid generic outreach. Start with investors whose thesis matches your market, then personalize around the proof they care about: {industryPage?.angle || 'traction, timing, team credibility, and a clear funding milestone'}.
            </p>
            <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 mt-8 mb-4">What to include in your first message</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>One-line positioning:</strong> explain the company, buyer, and outcome in plain language.</li>
              <li><strong>Relevant proof:</strong> mention traction, pilots, revenue, waitlist, technical milestone, or founder-market fit.</li>
              <li><strong>Clear ask:</strong> request a short call or permission to send the deck instead of attaching everything at once.</li>
            </ul>
            <h3 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 mt-8 mb-4">Using OpenAngels for this category</h3>
            <p>
              OpenAngels combines searchable investor profiles, industry filters, CRM tracking, and AI email drafting so founders can move from research to outreach faster while keeping each message specific to the investor.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
