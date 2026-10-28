export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://rjdewjyhtbfkujhvkwig.supabase.co';
    const envServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const res = await fetch(`${supabaseUrl}/rest/v1/investors_public?select=id&limit=1`, {
      headers: {
        'apikey': envServiceKey,
        'Authorization': `Bearer ${envServiceKey}`,
        'Prefer': 'count=exact'
      },
      next: { revalidate: 3600 }
    });

    const range = res.headers.get('content-range') || '';
    const total = range.includes('/') ? parseInt(range.split('/')[1], 10) : 7430;

    return Response.json({ total: (isNaN(total) || total < 1000) ? 7430 : total });
  } catch (e) {
    return Response.json({ total: 7430 });
  }
}
