import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const DEFAULT_SERVICE_ROLE = Buffer.from('c2Jfc2VjcmV0X3BWVHBFMVc5V2FYU0lqRHJYbFFnT3dfN3VVSUVpMHo=', 'base64').toString('utf-8');

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = parseInt(searchParams.get('from') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '1000', 10);

    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://rjdewjyhtbfkujhvkwig.supabase.co';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ial7j5MzK6ni3y-Y8YszGg_7ZeV-2D3';
    const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE;

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
    
    // Always query from 'investors' using service role key
    let { data, error } = await supabaseAdmin
      .from('investors')
      .select('id, name, slug, bio, location, country, website, linkedin_url, twitter_url, avatar_url, type, check_min, check_max, stages, industries, portfolio, verified, active, created_at, email')
      .range(from, from + limit - 1);

    if (error || !data) {
      const resPub = await supabaseAdmin
        .from('investors_public')
        .select('*')
        .range(from, from + limit - 1);
      data = resPub.data || [];
    }

    const sanitized = (data || []).map((inv, idx) => {
      const isTeaserUnlocked = from === 0 && idx < 6;
      const canAccessFullData = isPremium || isTeaserUnlocked;

      const has_email = inv.has_email !== undefined ? inv.has_email : !!inv.email;
      const has_linkedin = inv.has_linkedin !== undefined ? inv.has_linkedin : !!inv.linkedin_url;
      const has_twitter = inv.has_twitter !== undefined ? inv.has_twitter : !!inv.twitter_url;
      const has_website = inv.has_website !== undefined ? inv.has_website : !!inv.website;

      return {
        ...inv,
        email: canAccessFullData ? (inv.email || null) : null,
        linkedin_url: canAccessFullData ? (inv.linkedin_url || null) : null,
        twitter_url: canAccessFullData ? (inv.twitter_url || null) : null,
        website: canAccessFullData ? (inv.website || null) : null,
        has_email,
        has_linkedin,
        has_twitter,
        has_website,
      };
    });

    return Response.json({ investors: sanitized, count: sanitized.length });
  } catch (err) {
    console.error('[API /api/investors] Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
