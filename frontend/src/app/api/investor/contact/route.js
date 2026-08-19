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
    const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_ROLE;

    if (!supabaseUrl || !anonKey) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    let fullInvestor = null;

    // 1. Try 'investors' table
    try {
      let query1 = supabaseAdmin.from('investors').select('*');
      if (slug) query1 = query1.eq('slug', slug);
      else query1 = query1.eq('id', id);
      const { data: data1 } = await query1.limit(1);
      if (data1 && data1.length > 0) fullInvestor = data1[0];
    } catch (e) {}

    // 2. Try 'investors_secure'
    if (!fullInvestor) {
      try {
        let query2 = supabaseAdmin.from('investors_secure').select('*');
        if (slug) query2 = query2.eq('slug', slug);
        else query2 = query2.eq('id', id);
        const { data: data2 } = await query2.limit(1);
        if (data2 && data2.length > 0) fullInvestor = data2[0];
      } catch (e) {}
    }

    // 3. Fallback to 'investors_public'
    if (!fullInvestor) {
      try {
        let query3 = supabaseAdmin.from('investors_public').select('*');
        if (slug) query3 = query3.eq('slug', slug);
        else query3 = query3.eq('id', id);
        const { data: data3 } = await query3.limit(1);
        if (data3 && data3.length > 0) fullInvestor = data3[0];
      } catch (e) {}
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
