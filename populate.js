const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL.replace(/['"]/g, '').trim();
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.replace(/['"]/g, '').trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: roadmaps, error: fetchError } = await supabase
    .from('ai_roadmaps')
    .select('id, field_id, title, description');

  if (fetchError) {
    console.error('❌ Failed to load roadmaps:', fetchError.message);
    return;
  }

  if (!roadmaps?.length) {
    console.log('No roadmaps found in database.');
    return;
  }

  console.log(`🧹 Clearing ${roadmaps.length} cached roadmap(s)...`);

  const { error: deleteError } = await supabase
    .from('ai_roadmaps')
    .delete()
    .in('id', roadmaps.map((r) => r.id));

  if (deleteError) {
    console.error('❌ Failed to clear cache:', deleteError.message);
    return;
  }

  console.log('🚀 Regenerating with Official Documentation URLs...');

  for (const topic of roadmaps) {
    console.log(`Generating: ${topic.title}...`);
    const { error } = await supabase.functions.invoke('generate-roadmap', {
      body: {
        field_id: topic.field_id,
        roadmap_id: topic.id,
        title: topic.title,
        description: topic.description ?? '',
        force_regenerate: true,
      },
    });

    if (error) {
      console.log('❌ Error:', topic.title, '-', error.message);
    } else {
      console.log('✅ Success:', topic.title);
    }
  }

  console.log('🎉 Done! Reload your Expo app to see updated links.');
}

run();
