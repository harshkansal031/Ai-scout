/**
 * Seeds the Explore "Infinite AI Library" via Gemini + Supabase.
 *
 * Usage:
 *   node seed-ai-library.js              # merge new taxonomy (keeps existing lesson content)
 *   node seed-ai-library.js --replace    # wipe fields/roadmaps and rebuild taxonomy
 *   node seed-ai-library.js --fields 14 --per-field 6
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/['"]/g, '').trim();
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.replace(/['"]/g, '').trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { replace: false, fieldCount: 12, roadmapsPerField: 5 };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--replace') opts.replace = true;
    if (args[i] === '--fields' && args[i + 1]) opts.fieldCount = Number(args[++i]);
    if (args[i] === '--per-field' && args[i + 1]) opts.roadmapsPerField = Number(args[++i]);
  }
  return opts;
}

async function run() {
  const opts = parseArgs();
  console.log('🌱 Seeding AI library taxonomy via Gemini...');
  console.log(`   ${opts.fieldCount} fields × ${opts.roadmapsPerField} topics${opts.replace ? ' (replace mode)' : ''}`);

  const { data, error } = await supabase.functions.invoke('seed-ai-library', {
    body: {
      field_count: opts.fieldCount,
      roadmaps_per_field: opts.roadmapsPerField,
      replace: opts.replace,
    },
  });

  if (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }

  if (data?.error) {
    console.error('❌ Seed failed:', data.error);
    process.exit(1);
  }

  console.log('✅ Library seeded:', data);
  console.log('\nNext: generate lesson timelines (optional, slow):');
  console.log('  node generate-missing-roadmaps.js --limit 20');
  console.log('\nThen reload your Expo app.');
}

run();
