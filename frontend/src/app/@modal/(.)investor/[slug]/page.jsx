import { supabase } from '@/lib/supabase';
import InvestorProfileModal from '@/components/InvestorProfileModal';
import { sanitizePublicInvestor } from '@/lib/security';
import { notFound } from 'next/navigation';

export default async function InterceptedInvestorModal({ params }) {
  const { slug } = await params;
  
  // Fetch with select('*') — investors_secure view already limits visible columns
  const { data: investorsData } = await supabase
    .from('investors_public')
    .select('*')
    .eq('slug', slug)
    .limit(1);
    
  const investor = investorsData?.[0];

  const { data: investorByIds } = !investor && slug.length > 20 
    ? await supabase.from('investors_public').select('*').eq('id', slug).limit(1)
    : { data: null };
    
  const rawInvestor = investor || investorByIds?.[0];

  if (!rawInvestor) {
    notFound();
  }

  // SECURITY: Strip sensitive fields before passing to client component
  const safeInvestor = sanitizePublicInvestor(rawInvestor);

  return <InvestorProfileModal investor={safeInvestor} isStandalone={false} />;
}
