import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = parseInt(searchParams.get('from') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '1000', 10);

    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || anonKey;

    if (!supabaseUrl) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    let isPremium = false;
    if (token) {
      const supabaseAuthClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
      const { data: { user } } = await supabaseAuthClient.auth.getUser(token);
      if (user) {
        const { data: profile } = await supabaseAuthClient.from('profiles').select('is_premium').eq('id', user.id).single();
        if (profile?.is_premium) isPremium = true;
      }
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data, error } = await supabaseAdmin
      .from('investors')
      .select('id, name, slug, bio, location, country, website, linkedin_url, twitter_url, avatar_url, type, check_min, check_max, stages, industries, portfolio, verified, active, created_at, email')
      .range(from, from + limit - 1);

    if (error) throw error;

    const sanitized = (data || []).map(inv => {
      const { email, ...rest } = inv;
      return {
        ...rest,
        email: isPremium ? (email || null) : null,
        has_email: !!email,
        has_linkedin: !!inv.linkedin_url,
        has_twitter: !!inv.twitter_url,
        has_website: !!inv.website,
      };
    });

    return Response.json({ investors: sanitized, count: sanitized.length });
  } catch (err) {
    console.error('[API /api/investors] Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
