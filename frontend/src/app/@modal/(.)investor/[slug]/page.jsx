import { supabase } from '@/lib/supabase';
import InvestorProfileModal from '@/components/InvestorProfileModal';
import { notFound } from 'next/navigation';

export default async function InterceptedInvestorModal({ params }) {
  const { slug } = await params;
  
  // Try to fetch by slug, if it fails try by id
  const { data: investorsData, error } = await supabase
    .from('investors_secure')
    .select('*')
    .eq('slug', slug)
    .limit(1);
    
  const investor = investorsData?.[0];

  // Fallback for UUID
  const { data: investorByIds } = !investor && slug.length > 20 
    ? await supabase.from('investors_secure').select('*').eq('id', slug).limit(1)
    : { data: null };
    
  const investorById = investorByIds?.[0];
    
  const finalInvestor = investor || investorById;

  if (!finalInvestor) {
    notFound();
  }

  return <InvestorProfileModal investor={finalInvestor} isStandalone={false} />;
}
