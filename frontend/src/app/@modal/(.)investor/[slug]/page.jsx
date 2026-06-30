import { supabase } from '@/lib/supabase';
import InvestorProfileModal from '@/components/InvestorProfileModal';
import { notFound } from 'next/navigation';

export default async function InterceptedInvestorModal({ params }) {
  const { slug } = await params;
  
  // Try to fetch by slug, if it fails try by id
  const { data: investor, error } = await supabase
    .from('investors_secure')
    .select('*')
    .eq('slug', slug)
    .single();

  // Fallback for UUID
  const { data: investorById } = !investor && slug.length > 20 
    ? await supabase.from('investors_secure').select('*').eq('id', slug).single()
    : { data: null };
    
  const finalInvestor = investor || investorById;

  if (!finalInvestor) {
    notFound();
  }

  return <InvestorProfileModal investor={finalInvestor} isStandalone={false} />;
}
