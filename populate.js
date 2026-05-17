const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL.replace(/['"]/g, '').trim();
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.replace(/['"]/g, '').trim();

const supabase = createClient(supabaseUrl, supabaseKey);

const topicsToGenerate = [
  { field_id: 'ml-core', roadmap_id: 'neural-nets', title: 'Neural Networks', description: 'The foundation of deep learning.' },
  { field_id: 'agents', roadmap_id: 'frameworks', title: 'Agent Frameworks', description: 'LangChain, AutoGen, and CrewAI.' }
];

async function run() {
  console.log("Forcing generation of roadmaps...");
  for (const topic of topicsToGenerate) {
    console.log(`Generating: ${topic.title}...`);
    const { data, error } = await supabase.functions.invoke('generate-roadmap', {
      body: topic
    });
    if (error) {
      console.log("❌ Error:", error.message);
    } else {
      console.log("✅ Success:", topic.title);
    }
  }
}

run();
