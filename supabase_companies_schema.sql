-- ============================================================================
-- OpenAngels Dealflow & Startup Radar Table: companies_secure
-- Run this in your Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.companies_secure (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    legal_name TEXT,
    domain TEXT,
    tagline TEXT,
    overview TEXT,
    location TEXT,
    country TEXT DEFAULT 'United States',
    stage TEXT DEFAULT 'Seed',
    industry TEXT DEFAULT 'AI & Machine Learning',
    total_raised TEXT,
    last_round_amount TEXT,
    last_round_type TEXT,
    valuation TEXT,
    round_date TEXT,
    founders JSONB DEFAULT '[]'::jsonb,
    investors TEXT[] DEFAULT '{}'::text[],
    products TEXT[] DEFAULT '{}'::text[],
    customers TEXT[] DEFAULT '{}'::text[],
    employees INTEGER DEFAULT 25,
    employee_growth_90d TEXT DEFAULT '+20% 90d growth',
    hiring JSONB DEFAULT '{}'::jsonb,
    technology_signals JSONB DEFAULT '{}'::jsonb,
    growth_signals JSONB DEFAULT '{}'::jsonb,
    signals JSONB DEFAULT '[]'::jsonb,
    timeline JSONB DEFAULT '[]'::jsonb,
    claims JSONB DEFAULT '[]'::jsonb,
    openangels_score NUMERIC DEFAULT 85.0,
    score_badge TEXT DEFAULT 'Verified Breakout',
    pitch_hook TEXT,
    source_url TEXT,
    verified BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_companies_secure_slug ON public.companies_secure(slug);
CREATE INDEX IF NOT EXISTS idx_companies_secure_stage ON public.companies_secure(stage);
CREATE INDEX IF NOT EXISTS idx_companies_secure_industry ON public.companies_secure(industry);
CREATE INDEX IF NOT EXISTS idx_companies_secure_score ON public.companies_secure(openangels_score DESC);

-- Row Level Security
ALTER TABLE public.companies_secure ENABLE ROW LEVEL SECURITY;

-- Allow public read access (Frontend search & SSR)
DROP POLICY IF EXISTS "Public read access for companies" ON public.companies_secure;
CREATE POLICY "Public read access for companies" 
ON public.companies_secure 
FOR SELECT 
USING (true);

-- Allow service role full access (Pipeline inserts & updates)
DROP POLICY IF EXISTS "Service role full access for companies" ON public.companies_secure;
CREATE POLICY "Service role full access for companies" 
ON public.companies_secure 
FOR ALL 
USING (true);
