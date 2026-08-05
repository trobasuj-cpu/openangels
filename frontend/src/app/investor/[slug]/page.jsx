import { supabase } from '@/lib/supabase';
import { absoluteUrl } from '@/seo';
import InvestorProfileModal from '@/components/InvestorProfileModal';
import { notFound } from 'next/navigation';
import Link from 'next/link';

export async function generateStaticParams() {
  const { data } = await supabase
    .from('investors_secure')
    .select('slug')
    .not('slug', 'is', null)
    .limit(1000);

  return (data || []).map((inv) => ({ slug: inv.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  const { data: investors } = await supabase
    .from('investors_secure')
    .select('name, bio, industries, firm, location')
    .eq('slug', slug)
    .limit(1);

  const investor = investors?.[0];
  if (!investor) return {};

  const investorName = investor.name;
  const firmText = investor.firm ? ` (${investor.firm})` : '';
  
  let cleanBio = investor.bio || '';
  if (cleanBio.includes('Source: http')) {
    cleanBio = cleanBio.split('Source: http')[0].trim();
  }
  if (!cleanBio || cleanBio.includes("automated news") || cleanBio.includes("public investor list")) {
    cleanBio = `${investorName} is an active early-stage angel investor${investor.firm ? ` at ${investor.firm}` : ''}${investor.location ? ` based in ${investor.location}` : ''}. View investment thesis, check sizes, focus industries, and contact info on OpenAngels.`;
  }

  const title = `${investorName}${firmText} - Angel Investor Profile | OpenAngels`;
  const description = cleanBio.substring(0, 160);

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

export default async function StandaloneInvestorPage({ params }) {
  const { slug } = await params;
  
  const { data: investorsData } = await supabase
    .from('investors_secure')
    .select('*')
    .eq('slug', slug)
    .limit(1);
    
  const investor = investorsData?.[0];

  const { data: investorByIds } = !investor && slug.length > 20 
    ? await supabase.from('investors_secure').select('*').eq('id', slug).limit(1)
    : { data: null };
    
  const finalInvestor = investor || investorByIds?.[0];

  if (!finalInvestor) {
    notFound();
  }

  let cleanBio = finalInvestor.bio || '';
  if (cleanBio.includes('Source: http')) {
    cleanBio = cleanBio.split('Source: http')[0].trim();
  }
  if (!cleanBio || cleanBio.includes("automated news") || cleanBio.includes("public investor list")) {
    cleanBio = `${finalInvestor.name} is an active early-stage angel investor${finalInvestor.firm ? ` at ${finalInvestor.firm}` : ''}${finalInvestor.location ? ` based in ${finalInvestor.location}` : ''}. View investment thesis, check sizes, focus industries, and contact details on OpenAngels.`;
  }

  const rawInd = finalInvestor.industry || finalInvestor.industries;
  const industries = Array.isArray(rawInd) ? rawInd : (typeof rawInd === 'string' ? [rawInd] : []);

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": finalInvestor.name || "Angel Investor",
    "description": cleanBio,
    "url": absoluteUrl(`/investor/${finalInvestor.slug || finalInvestor.id}`),
    ...(finalInvestor.firm && { "worksFor": { "@type": "Organization", "name": finalInvestor.firm } }),
    ...(finalInvestor.location && { "homeLocation": { "@type": "Place", "name": finalInvestor.location } }),
    "sameAs": [
      finalInvestor.linkedin_url,
      finalInvestor.twitter_url,
      finalInvestor.website
    ].filter(Boolean)
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col pt-12 items-center justify-center p-4 sm:p-6">
      {/* Schema.org JSON-LD for Googlebot */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Hidden SSR Semantic HTML for Search Engine Crawlers */}
      <article className="sr-only">
        <h1>{finalInvestor.name} - Angel Investor Profile</h1>
        {finalInvestor.firm && <h2>Partner / Investor at {finalInvestor.firm}</h2>}
        {finalInvestor.location && <p>Location: {finalInvestor.location}</p>}
        <p>{cleanBio}</p>
        {industries.length > 0 && (
          <div>
            <h3>Investment Focus & Industries</h3>
            <ul>
              {industries.map(ind => <li key={ind}>{ind}</li>)}
            </ul>
          </div>
        )}
        <nav aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <Link href="/directory">Investor Directory</Link>
          <span>{finalInvestor.name}</span>
        </nav>
      </article>

      {/* Visible Interactive Dossier Component */}
      <div className="w-full max-w-3xl bg-zinc-950 rounded-3xl shadow-2xl overflow-hidden relative min-h-[600px] border border-zinc-800">
        <InvestorProfileModal investor={finalInvestor} isStandalone={true} />
      </div>
    </div>
  );
}
