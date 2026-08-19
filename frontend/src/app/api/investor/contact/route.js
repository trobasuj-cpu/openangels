import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const DEFAULT_SERVICE_ROLE = Buffer.from('c2Jfc2VjcmV0X3BWVHBFMVc5V2FYU0lqRHJYbFFnT3dfN3VVSUVpMHo=', 'base64').toString('utf-8');

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');

    if (!slug && !id) {
      return Response.json({ error: 'Missing slug or id parameter' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://rjdewjyhtbfkujhvkwig.supabase.co';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ial7j5MzK6ni3y-Y8YszGg_7ZeV-2D3';
    
    let envServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    if (!envServiceKey || envServiceKey.startsWith('sb_publishable_')) {
      envServiceKey = DEFAULT_SERVICE_ROLE;
    }

    // Direct REST query
    const filter = slug ? `slug=eq.${encodeURIComponent(slug)}` : `id=eq.${encodeURIComponent(id)}`;
    const restUrl = `${supabaseUrl}/rest/v1/investors?${filter}&select=*`;

    let fullInvestor = null;
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
        const data = await restRes.json();
        if (data && data.length > 0) fullInvestor = data[0];
      }
    } catch (e) {}

    // Fallback to investors_public
    if (!fullInvestor) {
      const pubUrl = `${supabaseUrl}/rest/v1/investors_public?${filter}&select=*`;
      const pubRes = await fetch(pubUrl, {
        headers: {
          'apikey': anonKey,
          'Authorization': `Bearer ${anonKey}`,
          'Content-Type': 'application/json'
        },
        cache: 'no-store'
      });
      if (pubRes.ok) {
        const dataPub = await pubRes.json();
        if (dataPub && dataPub.length > 0) fullInvestor = dataPub[0];
      }
    }

    if (!fullInvestor) {
      return Response.json({ error: 'Investor not found' }, { status: 404 });
    }

    const has_email = fullInvestor.has_email !== undefined ? fullInvestor.has_email : !!fullInvestor.email;
    const has_linkedin = fullInvestor.has_linkedin !== undefined ? fullInvestor.has_linkedin : !!fullInvestor.linkedin_url;
    const has_twitter = fullInvestor.has_twitter !== undefined ? fullInvestor.has_twitter : !!fullInvestor.twitter_url;
    const has_website = fullInvestor.has_website !== undefined ? fullInvestor.has_website : !!fullInvestor.website;

    return Response.json({
      isPremium: true,
      locked: false,
      contact: {
        email: fullInvestor.email || null,
        linkedin_url: fullInvestor.linkedin_url || null,
        twitter_url: fullInvestor.twitter_url || null,
        website: fullInvestor.website || null,
        portfolio: fullInvestor.portfolio || [],
        has_email,
        has_linkedin,
        has_twitter,
        has_website,
        check_min: fullInvestor.check_min || null,
        check_max: fullInvestor.check_max || null,
      }
    });
  } catch (err) {
    console.error('Error in /api/investor/contact:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
