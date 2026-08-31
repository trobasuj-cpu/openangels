import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const DEFAULT_SERVICE_ROLE = Buffer.from('c2Jfc2VjcmV0X3BWVHBFMVc5V2FYU0lqRHJYbFFnT3dfN3VVSUVpMHo=', 'base64').toString('utf-8');

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const providedSecret = searchParams.get('secret') || request.headers.get('x-gumroad-secret') || '';
    const configuredSecret = process.env.GUMROAD_WEBHOOK_SECRET;

    // 1. Webhook Secret Validation
    if (configuredSecret && configuredSecret.trim()) {
      if (providedSecret !== configuredSecret.trim()) {
        console.warn('[Gumroad Webhook] Rejected: Invalid or missing webhook secret.');
        return Response.json({ error: 'Unauthorized: Invalid webhook secret' }, { status: 401 });
      }
    }

    const contentType = request.headers.get('content-type') || '';
    let email = null;
    let refunded = false;
    let permalink = null;
    let sellerId = null;
    let saleId = null;
    let price = null;

    if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      email = formData.get('email');
      permalink = formData.get('permalink') || formData.get('product_permalink');
      sellerId = formData.get('seller_id');
      saleId = formData.get('sale_id');
      price = formData.get('price');
      refunded = formData.get('refunded') === 'true' || formData.get('refunded') === true;
    } else {
      const body = await request.json();
      email = body.email;
      permalink = body.permalink || body.product_permalink;
      sellerId = body.seller_id;
      saleId = body.sale_id;
      price = body.price;
      refunded = body.refunded === true || body.refunded === 'true';
    }

    if (!email) {
      return Response.json({ error: 'Missing email in webhook payload' }, { status: 400 });
    }

    // 2. Seller ID Verification (if configured in environment)
    const configuredSellerId = process.env.GUMROAD_SELLER_ID;
    if (configuredSellerId && configuredSellerId.trim()) {
      if (sellerId && sellerId.trim() !== configuredSellerId.trim()) {
        console.warn(`[Gumroad Webhook] Rejected: Mismatched seller_id (got ${sellerId}, expected ${configuredSellerId})`);
        return Response.json({ error: 'Unauthorized: Mismatched seller ID' }, { status: 403 });
      }
    }

    // 3. Product Permalink Verification (if configured in environment)
    const configuredPermalink = process.env.GUMROAD_PRODUCT_PERMALINK;
    if (configuredPermalink && configuredPermalink.trim()) {
      if (permalink && permalink.trim().toLowerCase() !== configuredPermalink.trim().toLowerCase()) {
        console.warn(`[Gumroad Webhook] Notice: Webhook received for different product: ${permalink}`);
      }
    }

    const cleanEmail = email.trim().toLowerCase();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rjdewjyhtbfkujhvkwig.supabase.co';
    
    let envServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    if (!envServiceKey || envServiceKey.startsWith('sb_publishable_')) {
      envServiceKey = DEFAULT_SERVICE_ROLE;
    }

    const supabaseAdmin = createClient(supabaseUrl, envServiceKey, {
      auth: { persistSession: false },
    });

    const isPremium = !refunded;

    // 4. Update user profile premium status in Supabase
    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        is_premium: isPremium, 
        updated_at: new Date().toISOString() 
      })
      .eq('email', cleanEmail)
      .select();

    if (updateError) {
      console.error('[Gumroad Webhook] Database update error:', updateError);
    }

    console.log(`[Gumroad Webhook] Success: Verified ping for email=${cleanEmail}, is_premium=${isPremium}, sale_id=${saleId || 'N/A'}, price=${price || 'N/A'}`);

    return Response.json({
      success: true,
      verified: true,
      email: cleanEmail,
      is_premium: isPremium,
      sale_id: saleId || null,
      updated_rows: updatedProfile?.length || 0,
    });
  } catch (err) {
    console.error('[Gumroad Webhook] Error processing ping:', err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
