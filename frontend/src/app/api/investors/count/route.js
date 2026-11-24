import { DEFAULT_INVESTOR_COUNT } from '@/seo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://rjdewjyhtbfkujhvkwig.supabase.co';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ial7j5MzK6ni3y-Y8YszGg_7ZeV-2D3';
    const envServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || anonKey;

    const res = await fetch(`${supabaseUrl}/rest/v1/investors_public?select=id&limit=1`, {
      headers: {
        'apikey': envServiceKey,
        'Authorization': `Bearer ${envServiceKey}`,
        'Prefer': 'count=exact'
      },
      next: { revalidate: 3600 }
    });

    const range = res.headers.get('content-range') || '';
    const total = range.includes('/') ? parseInt(range.split('/')[1], 10) : DEFAULT_INVESTOR_COUNT;

    return Response.json({ total: (isNaN(total) || total < 1000) ? DEFAULT_INVESTOR_COUNT : total });
  } catch (e) {
    return Response.json({ total: DEFAULT_INVESTOR_COUNT });
  }
}
