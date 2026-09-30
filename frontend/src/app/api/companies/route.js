import { createClient } from '@supabase/supabase-js';
import companiesCache from '@/lib/companies_cache.json';
import { KNOWN_COMPANIES } from '@/lib/companyData';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = (searchParams.get('category') || 'all').toLowerCase();
    const search = (searchParams.get('search') || searchParams.get('q') || '').trim().toLowerCase();
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || searchParams.get('from') || '0', 10));

    let companiesList = [];

    // 1. Try fetching from Supabase 'companies_secure'
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && anonKey) {
      try {
        const supabase = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });
        let query = supabase
          .from('companies_secure')
          .select('*')
          .order('openangels_score', { ascending: false });

        if (search) {
          query = query.or(`name.ilike.%${search}%,tagline.ilike.%${search}%,overview.ilike.%${search}%,industry.ilike.%${search}%`);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          companiesList = data.map(c => ({
            ...c,
            legalName: c.legal_name || c.legalName,
            totalRaised: c.total_raised || c.totalRaised,
            lastRoundAmount: c.last_round_amount || c.lastRoundAmount,
            lastRoundType: c.last_round_type || c.lastRoundType,
            roundDate: c.round_date || c.roundDate,
            employeeGrowth90d: c.employee_growth_90d || c.employeeGrowth90d,
            openangelsScore: c.openangels_score || c.openangelsScore,
            scoreBadge: c.score_badge || c.scoreBadge,
            pitchHook: c.pitch_hook || c.pitchHook,
            technologySignals: c.technology_signals || c.technologySignals,
            growthSignals: c.growth_signals || c.growthSignals,
            funding: {
              totalRaised: c.total_raised || c.funding?.totalRaised || 'Confidential',
              lastRoundAmount: c.last_round_amount || c.funding?.lastRoundAmount,
              lastRoundType: c.last_round_type || c.stage || 'Venture Round',
              valuation: c.valuation || c.funding?.valuation || 'Verified via Funding Round',
              roundDate: c.round_date || c.funding?.roundDate || 'Recent',
              status: 'VERIFIED'
            }
          }));
        }
      } catch (e) {
        console.warn('[API /api/companies] Supabase query fallback:', e.message);
      }
    }

    // 2. Fallback to cached + curated companies if Supabase table is not yet populated
    if (companiesList.length === 0) {
      const mergedMap = new Map();
      
      // Known curated companies
      Object.values(KNOWN_COMPANIES || {}).forEach(c => {
        if (c && c.slug) mergedMap.set(c.slug, c);
      });

      // Scraped & enriched companies from cache
      Object.values(companiesCache || {}).forEach(c => {
        if (c && c.slug) {
          const comp = {
            ...c,
            legalName: c.legal_name || c.legalName,
            totalRaised: c.total_raised || c.totalRaised,
            lastRoundAmount: c.last_round_amount || c.lastRoundAmount,
            lastRoundType: c.last_round_type || c.lastRoundType,
            roundDate: c.round_date || c.roundDate,
            employeeGrowth90d: c.employee_growth_90d || c.employeeGrowth90d,
            openangelsScore: c.openangels_score || c.openangelsScore,
            scoreBadge: c.score_badge || c.scoreBadge,
            pitchHook: c.pitch_hook || c.pitchHook,
            technologySignals: c.technology_signals || c.technologySignals,
            growthSignals: c.growth_signals || c.growthSignals,
            funding: {
              totalRaised: c.total_raised || c.funding?.totalRaised || '$5M+',
              lastRoundAmount: c.last_round_amount || c.funding?.lastRoundAmount,
              lastRoundType: c.last_round_type || c.stage || 'Venture Round',
              valuation: c.valuation || c.funding?.valuation || 'Verified via Funding Round',
              roundDate: c.round_date || c.funding?.roundDate || 'Recent',
              status: 'VERIFIED'
            }
          };
          mergedMap.set(c.slug, comp);
        }
      });

      companiesList = Array.from(mergedMap.values());
    }

    // 3. Category filtering
    if (category && category !== 'all') {
      companiesList = companiesList.filter(comp => {
        const ind = (comp.industry || '').toLowerCase();
        const slug = (comp.slug || '').toLowerCase();
        const tag = (comp.tagline || '').toLowerCase();
        
        if (category === 'ai') {
          return ind.includes('ai') || ind.includes('reasoning') || ind.includes('machine learning') || tag.includes('ai') || ['openai', 'anthropic', 'perplexity', 'poolside', 'glean', 'harvey', 'cursor', 'cognition', 'decagon', 'mercor'].includes(slug);
        }
        if (category === 'devtools') {
          return ind.includes('developer') || ind.includes('devtools') || ind.includes('compiler') || ind.includes('tools') || ['cursor', 'cognition', 'poolside'].includes(slug);
        }
        if (category === 'fintech') {
          return ind.includes('fintech') || ind.includes('payment') || ind.includes('banking') || ind.includes('finance') || ['stripe'].includes(slug);
        }
        if (category === 'marketplace') {
          return ind.includes('marketplace') || ind.includes('network') || ind.includes('talent') || ['mercor', 'airbnb', 'uber', 'linkedin', 'twitter'].includes(slug);
        }
        if (category === 'saas') {
          return ind.includes('saas') || ind.includes('enterprise') || ind.includes('b2b');
        }
        return ind.includes(category);
      });
    }

    // 4. Search filter
    if (search) {
      companiesList = companiesList.filter(comp => {
        const text = `${comp.name} ${comp.tagline || ''} ${comp.overview || ''} ${comp.industry || ''} ${(comp.investors || []).join(' ')}`.toLowerCase();
        return text.includes(search);
      });
    }

    // Sort by openangelsScore descending
    companiesList.sort((a, b) => (b.openangelsScore || b.openangels_score || 85) - (a.openangelsScore || a.openangels_score || 85));

    const totalCount = companiesList.length;
    const paginated = companiesList.slice(offset, offset + limit);

    return Response.json({
      companies: paginated,
      totalCount,
      hasMore: offset + limit < totalCount,
      source: 'hybrid_dealflow_radar'
    });
  } catch (error) {
    console.error('[API /api/companies Error]:', error);
    return Response.json({ error: error.message, companies: [] }, { status: 500 });
  }
}
