import { supabase } from '@/lib/supabase';
import { absoluteUrl } from '@/seo';
import InvestorProfileModal from '@/components/InvestorProfileModal';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  const { data: investor } = await supabase
    .from('investors_secure')
    .select('name, bio, industry, firm')
    .eq('slug', slug)
    .single();

  if (!investor) return {};

  const investorName = investor.name;
  const firmText = investor.firm ? ` at ${investor.firm}` : '';
  
  return {
    title: `${investorName}${firmText} - Angel Investor Profile | OpenAngels`,
    description: investor.bio ? investor.bio.substring(0, 160) : `Contact ${investorName} and see their investment thesis, past investments, and check size on OpenAngels.`,
    alternates: { canonical: absoluteUrl(`/investor/${slug}`) },
  };
}

export default async function StandaloneInvestorPage({ params }) {
  const { slug } = await params;
  
  // Try to fetch by slug, if it fails try by id
  const { data: investor, error } = await supabase
    .from('investors_secure')
    .select('*')
    .eq('slug', slug)
    .single();

  // Fallback for UUID if slug is missing or not used
  const { data: investorById } = !investor && slug.length > 20 
    ? await supabase.from('investors_secure').select('*').eq('id', slug).single()
    : { data: null };
    
  const finalInvestor = investor || investorById;

  if (!finalInvestor) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col pt-12 items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-2xl shadow-xl overflow-hidden relative min-h-[600px] border border-zinc-200 dark:border-zinc-800">
        <InvestorProfileModal investor={finalInvestor} isStandalone={true} />
      </div>
    </div>
  );
}
