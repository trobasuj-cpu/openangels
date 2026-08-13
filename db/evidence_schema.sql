-- OpenAngels — Evidence & Data Lineage Layer Schema
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS investor_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id UUID NOT NULL REFERENCES investors(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,         -- e.g. 'investment_thesis', 'email_deliverability', 'portfolio_deal', 'stage_focus'
  evidence_text TEXT NOT NULL,       -- Human readable quote / snippet of proof
  source_name TEXT NOT NULL,         -- e.g. "TechCrunch", "SEC Form D", "SMTP MX Check", "Twitter/X", "Signal Feed"
  source_url TEXT,                  -- Link to original article or filing if available
  confidence_score INTEGER DEFAULT 95 CHECK (confidence_score >= 0 AND confidence_score <= 100),
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup by investor_id
CREATE INDEX IF NOT EXISTS idx_investor_evidence_investor_id ON investor_evidence(investor_id);
CREATE INDEX IF NOT EXISTS idx_investor_evidence_field_name ON investor_evidence(field_name);

-- Enable RLS
ALTER TABLE investor_evidence ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for anon key on frontend)
DROP POLICY IF EXISTS "Public read investor evidence" ON investor_evidence;
CREATE POLICY "Public read investor evidence"
  ON investor_evidence FOR SELECT USING (true);
