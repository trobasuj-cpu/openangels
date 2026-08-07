import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const id = searchParams.get('id');

    if (!slug && !id) {
      return Response.json({ error: 'Missing slug or id parameter' }, { status: 400 });
    }

    const authHeader = request.headers.get('Authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || anonKey;

    if (!supabaseUrl || !anonKey) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // 1. Verify user JWT token if present
    let userId = null;
    let isPremium = false;

    if (token) {
      const supabaseAuthClient = createClient(supabaseUrl, anonKey, {
        auth: { persistSession: false },
      });
      const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser(token);
      if (user && !authError) {
        userId = user.id;
        // Check profile premium status
        const { data: profile } = await supabaseAuthClient
          .from('profiles')
          .select('is_premium')
          .eq('id', user.id)
          .single();

        if (profile?.is_premium) {
          isPremium = true;
        }
      }
    }

    // 2. If NOT premium, deny access to sensitive contact details
    if (!isPremium) {
      return Response.json({
        isPremium: false,
        locked: true,
        message: 'Upgrade to Premium to access direct emails, social links, and check sizes.',
      }, { status: 403 });
    }

    // 3. User IS Premium — fetch full sensitive contact info securely
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    let query = supabaseAdmin.from('investors_secure').select('*');
    if (slug) {
      query = query.eq('slug', slug);
    } else {
      query = query.eq('id', id);
    }

    const { data, error } = await query.limit(1);

    if (error || !data || data.length === 0) {
      return Response.json({ error: 'Investor not found' }, { status: 404 });
    }

    const fullInvestor = data[0];

    return Response.json({
      isPremium: true,
      locked: false,
      contact: {
        email: fullInvestor.email || null,
        linkedin_url: fullInvestor.linkedin_url || null,
        twitter_url: fullInvestor.twitter_url || null,
        website: fullInvestor.website || null,
        check_min: fullInvestor.check_min || null,
        check_max: fullInvestor.check_max || null,
      },
    });
  } catch (err) {
    console.error('[API /api/investor/contact] Error:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
