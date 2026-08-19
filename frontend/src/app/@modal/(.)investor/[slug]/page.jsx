import { createClient } from '@supabase/supabase-js';
import InvestorProfileModal from '@/components/InvestorProfileModal';
import { notFound } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://rjdewjyhtbfkujhvkwig.supabase.co';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ial7j5MzK6ni3y-Y8YszGg_7ZeV-2D3';
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || anonKey;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

export default async function InterceptedInvestorModal({ params }) {
  const { slug } = await params;
  
  const { data: investorsData } = await supabaseAdmin
    .from('investors')
    .select('*')
    .eq('slug', slug)
    .limit(1);
    
  let rawInvestor = investorsData?.[0];

  if (!rawInvestor && slug.length > 20) {
    const { data: investorByIds } = await supabaseAdmin
      .from('investors')
      .select('*')
      .eq('id', slug)
      .limit(1);
    rawInvestor = investorByIds?.[0];
  }

  if (!rawInvestor) {
    notFound();
  }

  const safeInvestor = {
    ...rawInvestor,
    email: rawInvestor.email || null,
    has_email: !!rawInvestor.email,
    has_linkedin: !!rawInvestor.linkedin_url,
    has_twitter: !!rawInvestor.twitter_url,
    has_website: !!rawInvestor.website,
  };

  return <InvestorProfileModal investor={safeInvestor} isStandalone={false} />;
}
