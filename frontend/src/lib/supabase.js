import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://rjdewjyhtbfkujhvkwig.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_ial7j5MzK6ni3y-Y8YszGg_7ZeV-2D3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
