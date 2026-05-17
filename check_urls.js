const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL.replace(/['"]/g, '').trim();
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY.replace(/['"]/g, '').trim();

const supabase = createClient(supabaseUrl, supabaseKey);

function isBadYouTubeUrl(url) {
  const lower = String(url).toLowerCase();
  return lower.includes('youtube.com/watch') || lower.includes('youtu.be/');
}

async function run() {
  const { data, error } = await supabase.from('ai_roadmaps').select('id, title, content');
  if (error) {
    console.error(error);
    return;
  }

  let badCount = 0;

  for (const roadmap of data) {
    console.log(`\nRoadmap: ${roadmap.title}`);
    const content = typeof roadmap.content === 'string' ? JSON.parse(roadmap.content) : roadmap.content;
    for (const item of content) {
      const flag = isBadYouTubeUrl(item.resource) ? ' [BAD]' : '';
      if (flag) badCount += 1;
      console.log(`  - ${item.title}: ${item.resource}${flag}`);
    }
  }

  console.log(`\n${badCount === 0 ? '✅ All URLs look safe.' : `⚠️ ${badCount} bad direct-video URL(s) remain.`}`);
}

run();
