export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const debug = {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey,
      keyPrefix: supabaseKey ? supabaseKey.substring(0, 10) : 'NONE',
    };

    if (!supabaseUrl || !supabaseKey) {
      return Response.json({ investors: [], debug, error: 'Missing env vars' });
    }

    const headers = {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    };

    // Test 1: exact same query as sitemap-1 (known to work)
    const testRes = await fetch(
      `${supabaseUrl}/rest/v1/investors_secure?select=slug,created_at&slug=not.is.null&order=id.asc&offset=0&limit=5`,
      { headers }
    );
    const testData = testRes.ok ? await testRes.json() : null;
    debug.sitemapQueryStatus = testRes.status;
    debug.sitemapQueryCount = testData ? testData.length : 0;

    // Test 2: our query with name
    const testRes2 = await fetch(
      `${supabaseUrl}/rest/v1/investors_secure?select=slug,name&slug=not.is.null&order=id.asc&offset=0&limit=5`,
      { headers }
    );
    const testData2 = testRes2.ok ? await testRes2.json() : await testRes2.text();
    debug.nameQueryStatus = testRes2.status;
    debug.nameQueryResult = testData2;

    // Test 3: with firm
    const testRes3 = await fetch(
      `${supabaseUrl}/rest/v1/investors_secure?select=slug,name,firm&slug=not.is.null&order=id.asc&offset=0&limit=5`,
      { headers }
    );
    debug.firmQueryStatus = testRes3.status;
    if (testRes3.ok) {
      debug.firmQueryResult = await testRes3.json();
    } else {
      debug.firmQueryError = await testRes3.text();
    }

    return Response.json({ debug });
  } catch (err) {
    return Response.json({ error: err.message, stack: err.stack });
  }
}
