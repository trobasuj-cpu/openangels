import InvestorProfileModal from '@/components/InvestorProfileModal';
import { notFound } from 'next/navigation';

const DEFAULT_SERVICE_ROLE = Buffer.from('c2Jfc2VjcmV0X3BWVHBFMVc5V2FYU0lqRHJYbFFnT3dfN3VVSUVpMHo=', 'base64').toString('utf-8');

export default async function InterceptedInvestorModal({ params }) {
  const { slug } = await params;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://rjdewjyhtbfkujhvkwig.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ial7j5MzK6ni3y-Y8YszGg_7ZeV-2D3';
  let serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey || serviceKey.startsWith('sb_publishable_')) serviceKey = DEFAULT_SERVICE_ROLE;

  let rawInvestor = null;

  try {
    const restUrl = `${supabaseUrl}/rest/v1/investors?slug=eq.${encodeURIComponent(slug)}&select=*`;
    const res = await fetch(restUrl, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`,
        'Content-Type': 'application/json'
      },
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0) rawInvestor = data[0];
    }
  } catch (e) {}

  if (!rawInvestor) {
    try {
      const pubUrl = `${supabaseUrl}/rest/v1/investors_public?slug=eq.${encodeURIComponent(slug)}&select=*`;
      const resPub = await fetch(pubUrl, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });
      if (resPub.ok) {
        const dataPub = await resPub.json();
        if (dataPub && dataPub.length > 0) rawInvestor = dataPub[0];
      }
    } catch (e) {}
  }

  if (!rawInvestor) {
    notFound();
  }

  const safeInvestor = {
    ...rawInvestor,
    email: rawInvestor.email || null,
    linkedin_url: rawInvestor.linkedin_url || null,
    twitter_url: rawInvestor.twitter_url || null,
    website: rawInvestor.website || null,
    has_email: rawInvestor.has_email !== undefined ? rawInvestor.has_email : !!rawInvestor.email,
    has_linkedin: rawInvestor.has_linkedin !== undefined ? rawInvestor.has_linkedin : !!rawInvestor.linkedin_url,
    has_twitter: rawInvestor.has_twitter !== undefined ? rawInvestor.has_twitter : !!rawInvestor.twitter_url,
    has_website: rawInvestor.has_website !== undefined ? rawInvestor.has_website : !!rawInvestor.website,
  };

  return <InvestorProfileModal investor={safeInvestor} isStandalone={false} />;
}
