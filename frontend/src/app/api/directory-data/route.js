export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ investors: [], error: 'Missing env vars' });
    }

    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Range': '0-3999',
      'Prefer': 'count=exact',
    };

    // Fetch in batches of 1000
    const batches = [];
    for (let offset = 0; offset < 5000; offset += 1000) {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/investors_secure?select=slug,name,firm&slug=not.is.null&name=not.is.null&order=name.asc&offset=${offset}&limit=1000`,
        { headers, next: { revalidate: 3600 } }
      );
      if (!res.ok) break;
      const data = await res.json();
      if (!data || data.length === 0) break;
      batches.push(...data);
    }

    return Response.json(
      { investors: batches, count: batches.length },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (err) {
    return Response.json({ investors: [], error: err.message });
  }
}
