import Dashboard from "@/components/Dashboard";
import { getDynamicInvestorCount, absoluteUrl } from "@/seo";

export const revalidate = 86400; // ISR 24 hours

export const metadata = {
  title: 'OpenAngels: 10,400+ Verified Angel Investors & VCs',
  description: 'Search 10,400+ verified angel investors and seed VCs. Filter by sector, check size, and thesis. Unlock direct founder pitch emails and AI pitches.',
  alternates: { canonical: absoluteUrl('/') },
  robots: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
  },
  openGraph: {
    title: 'OpenAngels: 10,400+ Verified Angel Investors & VCs',
    description: 'Search 10,400+ verified angel investors and seed VCs. Filter by sector, check size, and thesis. Unlock direct founder pitch emails and AI pitches.',
    url: absoluteUrl('/'),
    siteName: 'OpenAngels',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OpenAngels: 10,400+ Verified Angel Investors & VCs',
    description: 'Search 10,400+ verified angel investors and seed VCs. Filter by sector, check size, and thesis. Unlock direct founder pitch emails and AI pitches.',
  }
};

async function getInitialInvestors() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rjdewjyhtbfkujhvkwig.supabase.co';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ial7j5MzK6ni3y-Y8YszGg_7ZeV-2D3';
    
    // Fetch top 24 active verified investors from investors_public view
    const res = await fetch(
      `${supabaseUrl}/rest/v1/investors_public?select=id,slug,name,bio,location,avatar_url,stages,industries,verified,active,has_email,has_linkedin,has_twitter,has_website,created_at&order=id.asc&limit=24`,
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
      return (data || []).map((inv, idx) => ({
        ...inv,
        email: null,
        phone: null,
        is_blurred: idx >= 6,
      }));
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

  return (
    <Dashboard
      initialInvestors={initialInvestors}
      initialCount={countData?.total || 10400}
    />
  );
}
