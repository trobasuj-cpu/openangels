import { createClient } from '@supabase/supabase-js';
import { absoluteUrl } from '@/seo';
import InvestorProfileModal from '@/components/InvestorProfileModal';
import { notFound } from 'next/navigation';
import Link from 'next/link';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || anonKey;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

export async function generateStaticParams() {
  const { data } = await supabaseAdmin
    .from('investors')
    .select('slug')
    .not('slug', 'is', null)
    .limit(1000);

  return (data || []).map((inv) => ({ slug: inv.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  
  const { data: investors } = await supabaseAdmin
    .from('investors')
    .select('*')
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
  
  let { data: investorsData } = await supabaseAdmin
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

  // Strip email from raw public SSR render if non-premium, but KEEP full twitter_url, linkedin_url, website
  const safeInvestor = {
    ...rawInvestor,
    email: rawInvestor.email || null,
    has_email: !!rawInvestor.email,
    has_linkedin: !!rawInvestor.linkedin_url,
    has_twitter: !!rawInvestor.twitter_url,
    has_website: !!rawInvestor.website,
  };

  let cleanBio = safeInvestor.bio || '';
  if (cleanBio.includes('Source: http')) {
    cleanBio = cleanBio.split('Source: http')[0].trim();
  }
  if (!cleanBio || cleanBio.includes("automated news") || cleanBio.includes("public investor list")) {
    cleanBio = `${safeInvestor.name} is an active early-stage angel investor${safeInvestor.firm ? ` at ${safeInvestor.firm}` : ''}${safeInvestor.location ? ` based in ${safeInvestor.location}` : ''}. View investment thesis, check sizes, focus industries, and contact details on OpenAngels.`;
  }

  const rawInd = safeInvestor.industry || safeInvestor.industries;
  const industries = Array.isArray(rawInd) ? rawInd : (typeof rawInd === 'string' ? [rawInd] : []);

  const schemaData = {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": safeInvestor.name || "Angel Investor",
    "description": cleanBio,
    "url": absoluteUrl(`/investor/${safeInvestor.slug || safeInvestor.id}`),
    ...(safeInvestor.firm && { "worksFor": { "@type": "Organization", "name": safeInvestor.firm } }),
    ...(safeInvestor.location && { "homeLocation": { "@type": "Place", "name": safeInvestor.location } })
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col pt-12 items-center justify-center p-4 sm:p-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
      <article className="sr-only">
        <h1>{safeInvestor.name} - Angel Investor Profile</h1>
        {safeInvestor.firm && <h2>Partner / Investor at {safeInvestor.firm}</h2>}
        {safeInvestor.location && <p>Location: {safeInvestor.location}</p>}
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
          <span>{safeInvestor.name}</span>
        </nav>
      </article>
      <div className="w-full max-w-3xl bg-zinc-950 rounded-3xl shadow-2xl overflow-hidden relative min-h-[600px] border border-zinc-800">
        <InvestorProfileModal investor={safeInvestor} isStandalone={true} isPremium={true} />
      </div>
    </div>
  );
}
