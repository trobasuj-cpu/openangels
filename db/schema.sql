-- OpenAngels — Investors Database Schema
-- Run this in Supabase SQL Editor

create table if not exists investors (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  bio          text,
  location     text,
  country      text,
  website      text,
  linkedin_url text,
  twitter_url  text,
  avatar_url   text,
  type         text check (type in ('angel', 'vc', 'accelerator', 'family_office')),
  check_min    integer,   -- minimum investment in USD
  check_max    integer,   -- maximum investment in USD
  stages       text[],    -- ['pre-seed', 'seed', 'series-a']
  industries   text[],    -- ['saas', 'ai', 'fintech', ...]
  portfolio    text[],    -- notable companies invested in
  verified     boolean default false,
  active       boolean default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Full text search index
create index if not exists investors_fts on investors
  using gin(to_tsvector('english', coalesce(name,'') || ' ' || coalesce(bio,'') || ' ' || coalesce(location,'')));

-- Indexes for filters
create index if not exists investors_type_idx      on investors(type);
create index if not exists investors_country_idx   on investors(country);
create index if not exists investors_stages_idx    on investors using gin(stages);
create index if not exists investors_industries_idx on investors using gin(industries);
create index if not exists investors_check_idx     on investors(check_min, check_max);

-- Waitlist emails table
create table if not exists waitlist (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  created_at timestamptz default now()
);

-- Enable Row Level Security (public read)
alter table investors enable row level security;
alter table waitlist  enable row level security;

create policy "Public read investors"
  on investors for select using (true);

create policy "Anyone can join waitlist"
  on waitlist for insert with check (true);

-- Useful views
create or replace view investor_stats as
select
  count(*)                                          as total,
  count(*) filter (where type = 'angel')            as angels,
  count(*) filter (where type = 'vc')               as vcs,
  count(distinct country)                           as countries,
  count(*) filter (where 'ai' = any(industries))    as ai_focused,
  count(*) filter (where 'saas' = any(industries))  as saas_focused
from investors
where active = true;
