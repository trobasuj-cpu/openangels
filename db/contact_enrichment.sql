-- Contact enrichment quality fields for OpenAngels.
-- Run this in Supabase SQL Editor before applying enriched contact updates.

alter table investors
  add column if not exists email_source text,
  add column if not exists email_confidence numeric,
  add column if not exists linkedin_source text,
  add column if not exists linkedin_confidence numeric,
  add column if not exists contact_enriched_at timestamptz,
  add column if not exists contact_review_status text
    check (contact_review_status in ('pending', 'auto', 'manual', 'rejected'));

create index if not exists investors_email_confidence_idx
  on investors(email_confidence);

create index if not exists investors_linkedin_confidence_idx
  on investors(linkedin_confidence);

create index if not exists investors_contact_review_status_idx
  on investors(contact_review_status);
