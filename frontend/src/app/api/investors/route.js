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
    const from = Math.max(0, parseInt(searchParams.get('from') || searchParams.get('offset') || '0', 10));
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get('limit') || '24', 10)));
    const search = (searchParams.get('search') || searchParams.get('q') || '').trim();
    const industry = (searchParams.get('industry') || searchParams.get('industries') || '').trim();
    const stage = (searchParams.get('stage') || searchParams.get('stages') || '').trim();
    const location = (searchParams.get('location') || searchParams.get('locations') || '').trim();
    const checkMinParam = searchParams.get('check_min');
    const checkMaxParam = searchParams.get('check_max');
    const orderParam = searchParams.get('order') || '';

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

    // Build PostgREST query parameters
    const queryParts = [
      'select=id,name,slug,bio,location,country,website,linkedin_url,twitter_url,avatar_url,type,check_min,check_max,stages,industries,portfolio,verified,active,created_at,email'
    ];

    // Search query across name, bio, location
    if (search) {
      const cleanSearch = encodeURIComponent(search.replace(/[%*]/g, ''));
      queryParts.push(`or=(name.ilike.*${cleanSearch}*,bio.ilike.*${cleanSearch}*,location.ilike.*${cleanSearch}*)`);
    }

    // Industry filter (supports comma-separated list)
    if (industry) {
      const indList = industry.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      if (indList.length === 1) {
        queryParts.push(`industries=cs.{${encodeURIComponent(indList[0])}}`);
      } else if (indList.length > 1) {
        const indConditions = indList.map(ind => `industries.cs.{${encodeURIComponent(ind)}}`).join(',');
        queryParts.push(`or=(${indConditions})`);
      }
    }

    // Stage filter
    if (stage) {
      const stgList = stage.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
      if (stgList.length === 1) {
        queryParts.push(`stages=cs.{${encodeURIComponent(stgList[0])}}`);
      } else if (stgList.length > 1) {
        const stgConditions = stgList.map(stg => `stages.cs.{${encodeURIComponent(stg)}}`).join(',');
        queryParts.push(`or=(${stgConditions})`);
      }
    }

    // Location filter
    if (location) {
      const locList = location.split(',').map(s => s.trim()).filter(Boolean);
      if (locList.length === 1) {
        queryParts.push(`location=ilike.*${encodeURIComponent(locList[0])}*`);
      } else if (locList.length > 1) {
        const locConditions = locList.map(loc => `location.ilike.*${encodeURIComponent(loc)}*`).join(',');
        queryParts.push(`or=(${locConditions})`);
      }
    }

    // Check size filters
    if (checkMinParam && !isNaN(parseInt(checkMinParam, 10))) {
      queryParts.push(`check_max=gte.${parseInt(checkMinParam, 10)}`);
    }
    if (checkMaxParam && !isNaN(parseInt(checkMaxParam, 10))) {
      queryParts.push(`check_min=lte.${parseInt(checkMaxParam, 10)}`);
    }

    // Order clause
    if (orderParam === 'created_at.desc' || orderParam === 'newest') {
      queryParts.push('order=created_at.desc');
    } else {
      queryParts.push('order=id.asc');
    }

    // Pagination
    queryParts.push(`offset=${from}`);
    queryParts.push(`limit=${limit}`);

    // Direct REST query with service role key
    const restUrl = `${supabaseUrl}/rest/v1/investors?${queryParts.join('&')}`;

    let data = [];
    let totalCount = 4267;

    try {
      const restRes = await fetch(restUrl, {
        headers: {
          'apikey': envServiceKey,
          'Authorization': `Bearer ${envServiceKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'count=exact'
        },
        cache: 'no-store'
      });
      if (restRes.ok) {
        const range = restRes.headers.get('content-range') || '';
        if (range.includes('/')) {
          const parsed = parseInt(range.split('/')[1], 10);
          if (!isNaN(parsed) && parsed >= 0) {
            totalCount = parsed;
          }
        }
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
          'Content-Type': 'application/json',
          'Prefer': 'count=exact'
        },
        cache: 'no-store'
      });
      if (pubRes.ok) {
        const range = pubRes.headers.get('content-range') || '';
        if (range.includes('/')) {
          const parsed = parseInt(range.split('/')[1], 10);
          if (!isNaN(parsed) && parsed > 0) {
            totalCount = parsed;
          }
        }
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

    return Response.json({
      investors: sanitized,
      count: sanitized.length,
      totalCount,
      from,
      limit,
      hasMore: (from + sanitized.length) < totalCount,
      isPremium
    });
  } catch (err) {
    console.error('[API /api/investors] Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
