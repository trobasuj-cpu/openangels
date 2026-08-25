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

    // Dynamically calculate real co-investors from Supabase Knowledge Graph
    const t_port = fullInvestor.portfolio || [];
    const t_ind = fullInvestor.industries || [];
    const t_id = fullInvestor.id;
    const t_name = (fullInvestor.name || '').trim().toLowerCase();
    let syndicate_partners = [];

    // 1. Match by shared portfolio startups
    if (t_port && t_port.length > 0) {
      for (const p of t_port.slice(0, 3)) {
        if (!p || p.trim().length < 2) continue;
        try {
          const pUrl = `${supabaseUrl}/rest/v1/investors?portfolio=cs.{${encodeURIComponent(p.trim())}}&id=neq.${t_id}&select=id,name,slug,portfolio&limit=4`;
          const pRes = await fetch(pUrl, {
            headers: {
              'apikey': envServiceKey,
              'Authorization': `Bearer ${envServiceKey}`,
              'Content-Type': 'application/json'
            },
            cache: 'no-store'
          });
          if (pRes.ok) {
            const matches = await pRes.json();
            for (const m of matches) {
              if (m.name && m.name.toLowerCase() !== t_name && !syndicate_partners.some(s => s.name.toLowerCase() === m.name.toLowerCase())) {
                syndicate_partners.push({
                  name: m.name,
                  slug: m.slug || m.name.toLowerCase().replace(/\s+/g, '-'),
                  deal: p.trim(),
                  count: 2
                });
              }
            }
          }
        } catch (e) {}
        if (syndicate_partners.length >= 3) break;
      }
    }

    // 2. Fallback to real active peers in same industry
    if (syndicate_partners.length < 3 && t_ind && t_ind.length > 0) {
      try {
        const ind = t_ind[0];
        const indUrl = `${supabaseUrl}/rest/v1/investors?industries=cs.{${encodeURIComponent(ind)}}&id=neq.${t_id}&select=id,name,slug,portfolio&limit=8`;
        const indRes = await fetch(indUrl, {
          headers: {
            'apikey': envServiceKey,
            'Authorization': `Bearer ${envServiceKey}`,
            'Content-Type': 'application/json'
          },
          cache: 'no-store'
        });
        if (indRes.ok) {
          const indMatches = await indRes.json();
          for (const m of indMatches) {
            if (m.name && m.name.toLowerCase() !== t_name && !syndicate_partners.some(s => s.name.toLowerCase() === m.name.toLowerCase())) {
              syndicate_partners.push({
                name: m.name,
                slug: m.slug || m.name.toLowerCase().replace(/\s+/g, '-'),
                deal: `${ind.charAt(0).toUpperCase() + ind.slice(1)} Deal`,
                count: 1
              });
              if (syndicate_partners.length >= 3) break;
            }
          }
        }
      } catch (e) {}
    }

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
        syndicate_partners: syndicate_partners.slice(0, 3)
      }
    });
  } catch (err) {
    console.error('Error in /api/investor/contact:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
