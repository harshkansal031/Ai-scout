const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL.replace(/['"]/g, '').trim(),
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.replace(/['"]/g, '').trim(),
);

async function run() {
  const [fields, roadmaps] = await Promise.all([
    supabase.from('ai_fields').select('*').order('sort_order'),
    supabase.from('ai_roadmaps').select('id, title, field_id'),
  ]);

  console.log('=== ai_fields (Explore root cards) ===');
  for (const f of fields.data ?? []) {
    const count = (roadmaps.data ?? []).filter((r) => r.field_id === f.id).length;
    console.log(`  ${f.id}: ${f.title} → ${count} roadmap(s)`);
    for (const r of (roadmaps.data ?? []).filter((x) => x.field_id === f.id)) {
      console.log(`      - ${r.title} (${r.id})`);
    }
  }
  console.log(`\nTotal fields: ${fields.data?.length ?? 0}, total roadmaps: ${roadmaps.data?.length ?? 0}`);
}

run();
