import Dashboard from "@/components/Dashboard";
import { getDynamicInvestorCount, absoluteUrl, PRODUCT_NAME, SITE_URL } from "@/seo";
import { isBoilerplateBio, extractFirmFromBio, generateUniqueBio } from "@/lib/investorUtils";

export const revalidate = 86400; // ISR 24 hours

export const metadata = {
  title: 'OpenAngels: 10,400+ Verified Angel Investors & Pitch Emails',
  description: 'Search 10,400+ verified angel investors & seed VCs (Naval Ravikant, Sam Altman, Chris Dixon & more). Filter by sector, check size, portfolio & direct pitch emails.',
  alternates: { canonical: absoluteUrl('/') },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
  openGraph: {
    title: 'OpenAngels: 10,400+ Verified Angel Investors & Pitch Emails',
    description: 'Search 10,400+ verified angel investors & seed VCs (Naval Ravikant, Sam Altman, Chris Dixon & more). Filter by sector, check size, portfolio & direct pitch emails.',
    url: absoluteUrl('/'),
    siteName: 'OpenAngels',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenAngels: 10,400+ Verified Angel Investors & Pitch Emails',
    description: 'Search 10,400+ verified angel investors & seed VCs (Naval Ravikant, Sam Altman, Chris Dixon & more). Filter by sector, check size, portfolio & direct pitch emails.',
  }
};

async function getInitialInvestors() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rjdewjyhtbfkujhvkwig.supabase.co';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ial7j5MzK6ni3y-Y8YszGg_7ZeV-2D3';
    
    // Fetch top 36 curated, active verified investors from investors_public view (no -hex6 thin profiles)
    const res = await fetch(
      `${supabaseUrl}/rest/v1/investors_public?select=id,slug,name,bio,location,avatar_url,stages,industries,portfolio,verified,active,has_email,has_linkedin,has_twitter,has_website,created_at&slug=not.is.null&or=(avatar_url.not.is.null,has_email.eq.true)&order=created_at.asc,id.asc&limit=36`,
      {
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        next: { revalidate: 86400 },
      }
    );

    if (res.ok) {
      const data = await res.json();
      return (data || []).map((inv, idx) => {
        const cleanFirm = extractFirmFromBio(inv.bio, inv.firm);
        const cleanBio = isBoilerplateBio(inv.bio)
          ? generateUniqueBio({ ...inv, firm: cleanFirm })
          : inv.bio;
        return {
          ...inv,
          firm: cleanFirm,
          bio: cleanBio,
          email: null,
          phone: null,
          is_blurred: idx >= 6,
        };
      });
    }
  } catch (err) {
    console.error('[Home SSR] Error fetching initial investors:', err);
  }
  return [];
}

export default async function Home() {
  const [initialInvestors, countData] = await Promise.all([
    getInitialInvestors(),
    getDynamicInvestorCount(),
  ]);

  const homeSchema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        '@id': absoluteUrl('/#website'),
        name: PRODUCT_NAME,
        url: SITE_URL,
      },
      {
        '@type': 'Organization',
        '@id': absoluteUrl('/#organization'),
        name: PRODUCT_NAME,
        url: SITE_URL,
        logo: absoluteUrl('/og-image.png'),
      },
      {
        '@type': 'ItemList',
        name: 'Top Verified Angel Investors & Seed VCs',
        numberOfItems: Math.min(24, initialInvestors.length),
        itemListElement: initialInvestors.slice(0, 24).map((inv, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: inv.name,
          url: absoluteUrl(`/investor/${inv.slug}`),
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema) }}
      />
      <Dashboard
        initialInvestors={initialInvestors}
        initialCount={countData?.total || 10400}
      />
    </>
  );
}
