import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function generateSlug(name) {
  if (!name) return null;
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-')          // Remove duplicate hyphens
    .trim();                      // Remove leading/trailing spaces
    
  if (baseSlug.endsWith('-')) baseSlug = baseSlug.slice(0, -1);
  if (baseSlug.startsWith('-')) baseSlug = baseSlug.slice(1);
  return baseSlug || 'investor';
}

async function run() {
  console.log('Fetching investors...');
  
  let allInvestors = [];
  let page = 0;
  let hasMore = true;
  
  while (hasMore) {
    const { data, error } = await supabase
      .from('investors')
      .select('id, name, slug')
      .is('slug', null)
      .range(page * 1000, (page + 1) * 1000 - 1);
      
    if (error) {
      console.error('Error fetching investors:', error);
      return;
    }
    
    if (data.length === 0) {
      hasMore = false;
    } else {
      allInvestors = allInvestors.concat(data);
      page++;
    }
  }

  console.log(`Found ${allInvestors.length} investors without slugs.`);
  if (allInvestors.length === 0) return;
  
  let updatedCount = 0;
  
  for (const investor of allInvestors) {
    if (investor.name) {
      let newSlug = generateSlug(investor.name);
      
      const { error: updateError } = await supabase
        .from('investors')
        .update({ slug: newSlug })
        .eq('id', investor.id);
        
      if (updateError) {
        console.error(`Failed to update ${investor.id}:`, updateError);
      } else {
        updatedCount++;
        if (updatedCount % 100 === 0) {
          console.log(`Updated ${updatedCount} slugs...`);
        }
      }
    }
  }

  console.log(`Finished! Updated ${updatedCount} investors with new slugs.`);
}

run();
