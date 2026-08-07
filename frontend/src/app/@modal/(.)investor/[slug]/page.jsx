import { supabase } from '@/lib/supabase';
import InvestorProfileModal from '@/components/InvestorProfileModal';
import { sanitizePublicInvestor } from '@/lib/security';
import { notFound } from 'next/navigation';

export default async function InterceptedInvestorModal({ params }) {
  const { slug } = await params;
  
  const publicFields = 'id, slug, name, firm, title, location, bio, industry, industries, stages, avatar, avatar_url, status';

  // Try to fetch by slug, if it fails try by id
  const { data: investorsData } = await supabase
    .from('investors_secure')
    .select(publicFields)
    .eq('slug', slug)
    .limit(1);
    
  const investor = investorsData?.[0];

  // Fallback for UUID
  const { data: investorByIds } = !investor && slug.length > 20 
    ? await supabase.from('investors_secure').select(publicFields).eq('id', slug).limit(1)
    : { data: null };
    
  const rawInvestor = investor || investorByIds?.[0];

  if (!rawInvestor) {
    notFound();
  }

  const safeInvestor = sanitizePublicInvestor(rawInvestor);

  return <InvestorProfileModal investor={safeInvestor} isStandalone={false} />;
}
