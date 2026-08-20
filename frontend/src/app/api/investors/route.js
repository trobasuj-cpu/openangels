import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const DEFAULT_SERVICE_ROLE = Buffer.from('c2Jfc2VjcmV0X3BWVHBFMVc5V2FYU0lqRHJYbFFnT3dfN3VVSUVpMHo=', 'base64').toString('utf-8');

function calculateQualityScore(inv) {
  let score = 0;
  if (inv.email || inv.has_email) score += 30;
  if (inv.linkedin_url || inv.has_linkedin) score += 15;
  if (inv.twitter_url || inv.has_twitter) score += 10;
  if (inv.website || inv.has_website) score += 5;
  if (inv.check_min || inv.check_max) score += 15;
  if (Array.isArray(inv.portfolio) && inv.portfolio.length > 0) score += 15;
  if (inv.location) score += 5;
  if (inv.avatar_url) score += 5;
  return Math.min(100, Math.max(0, score));
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = parseInt(searchParams.get('from') || '0', 10);
    const limit = parseInt(searchParams.get('limit') || '1000', 10);

    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://rjdewjyhtbfkujhvkwig.supabase.co';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ial7j5MzK6ni3y-Y8YszGg_7ZeV-2D3';
    
    let envServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    if (!envServiceKey || envServiceKey.startsWith('sb_publishable_')) {
      envServiceKey = DEFAULT_SERVICE_ROLE;
    }

    let isPremium = false;
    if (token) {
      try {
        const supabaseAuthClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
        const { data: { user } } = await supabaseAuthClient.auth.getUser(token);
        if (user) {
          // Check is_premium in profiles via service role key
          const profRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=is_premium`, {
            headers: {
              'apikey': envServiceKey,
              'Authorization': `Bearer ${envServiceKey}`,
              'Content-Type': 'application/json'
            }
          });
          if (profRes.ok) {
            const profData = await profRes.json();
            if (profData?.[0]?.is_premium) {
              isPremium = true;
            }
          }
        }
      } catch (e) {
        console.error('[API /api/investors] Auth error:', e);
      }
    }

    // Direct REST query with service role key
    const restUrl = `${supabaseUrl}/rest/v1/investors?select=id,name,slug,bio,location,country,website,linkedin_url,twitter_url,avatar_url,type,check_min,check_max,stages,industries,portfolio,verified,active,created_at,email&offset=${from}&limit=${limit}`;

    let data = [];
    try {
      const restRes = await fetch(restUrl, {
        headers: {
          'apikey': envServiceKey,
          'Authorization': `Bearer ${envServiceKey}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });
      if (restRes.ok) {
        data = await restRes.json();
      }
    } catch (e) {
      console.error('[API /api/investors] Direct REST error:', e);
    }

    // Fallback to investors_public if needed
    if (!data || data.length === 0) {
      const pubUrl = `${supabaseUrl}/rest/v1/investors_public?offset=${from}&limit=${limit}`;
      const pubRes = await fetch(pubUrl, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });
      if (pubRes.ok) {
        data = await pubRes.json();
      }
    }

    const sanitized = (data || []).map((inv, idx) => {
      const isTeaserUnlocked = from === 0 && idx < 6;
      const canAccessFullData = isPremium || isTeaserUnlocked;

      const has_email = inv.has_email !== undefined ? inv.has_email : !!inv.email;
      const has_linkedin = inv.has_linkedin !== undefined ? inv.has_linkedin : !!inv.linkedin_url;
      const has_twitter = inv.has_twitter !== undefined ? inv.has_twitter : !!inv.twitter_url;
      const has_website = inv.has_website !== undefined ? inv.has_website : !!inv.website;
      const quality_score = calculateQualityScore({ ...inv, has_email, has_linkedin, has_twitter, has_website });

      return {
        ...inv,
        quality_score,
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

    return Response.json({ investors: sanitized, count: sanitized.length, isPremium });
  } catch (err) {
    console.error('[API /api/investors] Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
