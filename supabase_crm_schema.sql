-- SQL for Supabase SQL Editor
CREATE TABLE crm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    title TEXT,
    company TEXT,
    linkedin_url TEXT,
    email TEXT,
    domain TEXT,
    status TEXT DEFAULT 'inbox' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE crm_leads ENABLE ROW LEVEL SECURITY;

-- Allow anon access (since this is a simple client-side app currently without auth)
CREATE POLICY "Enable read access for all users" ON crm_leads FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON crm_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON crm_leads FOR UPDATE USING (true);
