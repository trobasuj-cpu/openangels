const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load .env manually
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
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function cleanEmails() {
  // Fix Ben Tossell — decode URL-encoded email
  const { error: e1 } = await supabase
    .from('investors')
    .update({ email: 'ben.tossell@gmail.com' })
    .eq('id', 'bc9f0f93-30a3-4f7d-afa1-a8d3027315af');
  console.log('Ben Tossell:', e1 ? 'ERROR ' + e1.message : 'FIXED -> ben.tossell@gmail.com');

  // Fix Christopher Steiner — deobfuscate
  const { error: e2 } = await supabase
    .from('investors')
    .update({ email: 'chris@chrissteiner.com' })
    .eq('id', '220497a6-b01a-4b4d-9e44-1fe403de3729');
  console.log('Christopher Steiner:', e2 ? 'ERROR ' + e2.message : 'FIXED -> chris@chrissteiner.com');

  // Null out pure garbage (file names, HTML fragments, %20 spaces, truncated)
  const garbageIds = [
    'fc916a2c-8750-4b6b-9a34-ab61c442078e', // HAX - background-video@2x-scaled.jpg
    '735d7669-a646-41e4-8b50-11bb744c8f09', // Obvious Ventures - certified-corporation@2x.png
    '313d7596-7606-4dbe-90c5-af0acbb1b37e', // IndieBio - sosv-ny-logo@2x.webp
    '06885c4c-87fe-4304-a2ab-bd9424fd4836', // Blockchain Capital - %20
    '616c62e2-c90e-4b5e-8537-a19549b067af', // Samer Karam - samer.karam@tu-
    '8e641665-a644-4f1d-bfd4-5d3c5c0e2a46', // Emmett Shear - %20
    'ff522b8e-f677-4e45-b908-7e8410a07d9d', // Nomura Securities - <a href=
    '143802bb-77c4-4218-889f-48199a04a9b0', // Digital Currency Group - %20
  ];

  const { error: e3 } = await supabase
    .from('investors')
    .update({ email: null })
    .in('id', garbageIds);
  console.log('Garbage nullified (' + garbageIds.length + ' records):', e3 ? 'ERROR ' + e3.message : 'OK');

  console.log('\nDone! Cleaned 10 bad email records.');
}

cleanEmails();
