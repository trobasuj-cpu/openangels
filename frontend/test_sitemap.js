const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env
const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
envFile.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      process.env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
    }
  }
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testSitemap() {
  console.log('Testing investors_secure view with anon key...');
  
  // Test 1: basic query
  const { data: test1, error: err1 } = await supabase
    .from('investors_secure')
    .select('slug, updated_at')
    .not('slug', 'is', null)
    .limit(5);
  
  console.log('Test 1 - investors_secure with slug filter:');
  console.log('  Error:', err1 ? err1.message : 'none');
  console.log('  Rows:', test1 ? test1.length : 0);
  if (test1 && test1.length > 0) console.log('  Sample:', test1[0]);

  // Test 2: count all with slug
  const { count, error: err2 } = await supabase
    .from('investors_secure')
    .select('slug', { count: 'exact', head: true })
    .not('slug', 'is', null);
  
  console.log('\nTest 2 - total count with slug:');
  console.log('  Error:', err2 ? err2.message : 'none');
  console.log('  Count:', count);

  // Test 3: check if slug column exists
  const { data: test3, error: err3 } = await supabase
    .from('investors_secure')
    .select('*')
    .limit(1);
  
  console.log('\nTest 3 - all columns in investors_secure:');
  console.log('  Error:', err3 ? err3.message : 'none');
  if (test3 && test3.length > 0) {
    console.log('  Columns:', Object.keys(test3[0]).join(', '));
    console.log('  Has slug?', 'slug' in test3[0]);
  }
}

testSitemap();
