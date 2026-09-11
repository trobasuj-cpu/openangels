-- OpenAngels — Epistemic Claims & Multi-Source Evidence Schema (DAY 4)
-- Run this in Supabase SQL Editor
-- Implements the 7-layer Epistemic Provenance Chain:
-- CLAIM ↓ VALUE ↓ SOURCE ↓ EVIDENCE ↓ DATE ↓ CONFIDENCE ↓ STATUS

-- 1. Claims Table
CREATE TABLE IF NOT EXISTS claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id TEXT NOT NULL,                  -- External ID, slug, or UUID of company/investor
  subject_name TEXT NOT NULL,                -- e.g. "Company X", "Stripe", "Brad Feld"
  subject_type TEXT NOT NULL DEFAULT 'company' CHECK (subject_type IN ('company', 'investor', 'fund')),
  claim_type TEXT NOT NULL,                  -- e.g. 'funding_round', 'valuation', 'email_deliverability', 'check_size', 'role_fund'
  statement TEXT NOT NULL,                   -- Human-readable claim: "Company X raised $5M in Series A"
  canonical_value TEXT NOT NULL,             -- Consensus winning value e.g. "$5M"
  status TEXT NOT NULL DEFAULT 'PROBABLE' CHECK (status IN ('VERIFIED', 'PROBABLE', 'CONFLICT', 'DISPUTED', 'UNVERIFIED')),
  confidence NUMERIC(4,3) NOT NULL DEFAULT 0.850 CHECK (confidence >= 0.000 AND confidence <= 1.000),
  consensus_ratio TEXT DEFAULT '1/1',         -- e.g. "3/3", "1/2"
  evidence_count INTEGER DEFAULT 1,          -- Total number of evidence records attached
  conflict_count INTEGER DEFAULT 0,          -- Count of dissenting/conflicting assertions
  first_observed_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for rapid lookup
CREATE INDEX IF NOT EXISTS idx_claims_subject_id ON claims(subject_id);
CREATE INDEX IF NOT EXISTS idx_claims_claim_type ON claims(claim_type);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_claims_confidence ON claims(confidence);

-- 2. Claim Evidence Table
CREATE TABLE IF NOT EXISTS claim_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES claims(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,                 -- e.g. "SEC EDGAR Form D", "TechCrunch", "Wall Street Journal"
  source_url TEXT,                           -- Direct URL citation if available
  source_tier TEXT NOT NULL DEFAULT 'tier_2' CHECK (source_tier IN ('tier_1', 'tier_2', 'tier_3', 'tier_4')),
  source_subtype TEXT,                       -- e.g. 'tier_1_gov_registry', 'tier_2_major_media'
  asserted_value TEXT NOT NULL,              -- The exact value asserted by this specific source (e.g. "$5M" or "$4.5M")
  evidence_text TEXT NOT NULL,               -- Verbatim text excerpt or log snippet proving the assertion
  trust_score NUMERIC(4,3) DEFAULT 0.850 CHECK (trust_score >= 0.000 AND trust_score <= 1.000),
  published_at TIMESTAMPTZ DEFAULT NOW(),    -- Date when published by the external source
  collected_at TIMESTAMPTZ DEFAULT NOW(),    -- Date when OpenAngels harvested the evidence
  is_supporting BOOLEAN DEFAULT true,        -- True if aligns with canonical_value, False if conflicting assertion
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for evidence
CREATE INDEX IF NOT EXISTS idx_claim_evidence_claim_id ON claim_evidence(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_evidence_tier ON claim_evidence(source_tier);
CREATE INDEX IF NOT EXISTS idx_claim_evidence_is_supporting ON claim_evidence(is_supporting);

-- 3. Row Level Security (RLS)
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_evidence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read claims" ON claims;
CREATE POLICY "Public read claims"
  ON claims FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read claim evidence" ON claim_evidence;
CREATE POLICY "Public read claim evidence"
  ON claim_evidence FOR SELECT USING (true);

-- 4. Analytical View: Disputed & Conflicting Claims
CREATE OR REPLACE VIEW conflicting_claims_view AS
SELECT 
  c.id AS claim_id,
  c.subject_name,
  c.claim_type,
  c.canonical_value,
  c.status,
  c.confidence,
  c.consensus_ratio,
  ce.source_name AS dissenting_source,
  ce.asserted_value AS dissenting_value,
  ce.evidence_text AS dissenting_evidence,
  ce.trust_score AS dissenting_trust
FROM claims c
JOIN claim_evidence ce ON c.id = ce.claim_id
WHERE c.status = 'CONFLICT' AND ce.is_supporting = false;
