import { supabase } from '@/lib/supabase';
import { absoluteUrl } from '@/seo';
import InvestorProfileModal from '@/components/InvestorProfileModal';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  const { data: investors } = await supabase
    .from('investors_secure')
    .select('name, bio, industries, firm, email, linkedin_url, twitter_url, website')
    .eq('slug', slug)
    .limit(1);

  const investor = investors?.[0];

  if (!investor) return {};

  const investorName = investor.name;
  const firmText = investor.firm ? ` at ${investor.firm}` : '';
  
  const hasRealBio = investor.bio && !investor.bio.includes("Found via automated") && !investor.bio.includes("Extracted from public");
  const rawInd = investor.industries;
  const hasTags = Array.isArray(rawInd) ? rawInd.length > 0 : !!rawInd;
  const hasSocial = !!investor.email || !!investor.linkedin_url || !!investor.twitter_url || !!investor.website;
  
  const isThin = !(hasRealBio || hasTags || hasSocial);
  
  return {
    title: `${investorName}${firmText} - Angel Investor Profile | OpenAngels`,
    description: investor.bio ? investor.bio.substring(0, 160) : `Contact ${investorName} and see their investment thesis, past investments, and check size on OpenAngels.`,
    alternates: { canonical: absoluteUrl(`/investor/${slug}`) },
    ...(isThin && { robots: { index: false, follow: true } })
  };
}

export default async function StandaloneInvestorPage({ params }) {
  const { slug } = await params;
  
  // Try to fetch by slug, if it fails try by id
  const { data: investorsData, error } = await supabase
    .from('investors_secure')
    .select('*')
    .eq('slug', slug)
    .limit(1);
    
  const investor = investorsData?.[0];

  // Fallback for UUID if slug is missing or not used
  const { data: investorByIds } = !investor && slug.length > 20 
    ? await supabase.from('investors_secure').select('*').eq('id', slug).limit(1)
    : { data: null };
    
  const investorById = investorByIds?.[0];
    
  const finalInvestor = investor || investorById;

  if (!finalInvestor) {
    notFound();
  }

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": finalInvestor.name || "Angel Investor",
    "description": finalInvestor.bio || "Angel Investor Profile",
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col pt-12 items-center justify-center p-4 sm:p-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden relative min-h-[600px] border border-zinc-200 dark:border-zinc-800">
        <InvestorProfileModal investor={finalInvestor} isStandalone={true} />
      </div>
    </div>
  );
}
