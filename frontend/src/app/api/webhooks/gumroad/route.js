import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let email = null;
    let refunded = false;
    let permalink = null;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      email = formData.get('email');
      permalink = formData.get('permalink');
      refunded = formData.get('refunded') === 'true';
    } else {
      const body = await request.json();
      email = body.email;
      permalink = body.permalink;
      refunded = body.refunded === true || body.refunded === 'true';
    }

    if (!email) {
      return Response.json({ error: 'Missing email in webhook payload' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return Response.json({ error: 'Server configuration missing' }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const isPremium = !refunded;

    // Update user profile premium status in Supabase
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ is_premium: isPremium, updated_at: new Date().toISOString() })
      .eq('email', cleanEmail)
      .select();

    if (updateError) {
      console.error('[Gumroad Webhook] Error updating profile:', updateError);
    }

    console.log(`[Gumroad Webhook] Set is_premium=${isPremium} for email=${cleanEmail}`);

    return Response.json({
      success: true,
      email: cleanEmail,
      is_premium: isPremium,
      updated_rows: updatedProfile?.length || 0,
    });
  } catch (err) {
    console.error('[Gumroad Webhook] Error processing ping:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
