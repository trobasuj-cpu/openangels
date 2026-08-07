import { supabase } from '@/lib/supabase';
import { absoluteUrl } from '@/seo';
import InvestorProfileModal from '@/components/InvestorProfileModal';
import { sanitizePublicInvestor } from '@/lib/security';
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
    .select('id, slug, name, firm, title, location, bio, industry, industries, stages, avatar, avatar_url, status')
    .eq('slug', slug)
    .limit(1);
    
  const investor = investorsData?.[0];

  const { data: investorByIds } = !investor && slug.length > 20 
    ? await supabase.from('investors_secure').select('id, slug, name, firm, title, location, bio, industry, industries, stages, avatar, avatar_url, status').eq('id', slug).limit(1)
    : { data: null };
    
  const rawInvestor = investor || investorByIds?.[0];

  if (!rawInvestor) {
    notFound();
  }

  // Sanitize investor data so no emails or social URLs are passed to SSR HTML/props
  const safeInvestor = sanitizePublicInvestor(rawInvestor);

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
      {/* Schema.org JSON-LD for Googlebot */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />

      {/* Hidden SSR Semantic HTML for Search Engine Crawlers */}
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

      {/* Visible Interactive Dossier Component */}
      <div className="w-full max-w-3xl bg-zinc-950 rounded-3xl shadow-2xl overflow-hidden relative min-h-[600px] border border-zinc-800">
        <InvestorProfileModal investor={safeInvestor} isStandalone={true} />
      </div>
    </div>
  );
}
