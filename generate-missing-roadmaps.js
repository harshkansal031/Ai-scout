/**
 * Generates timeline content for roadmaps that have empty content[].
 *
 * Usage:
 *   node generate-missing-roadmaps.js
 *   node generate-missing-roadmaps.js --limit 10 --delay 3000
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/['"]/g, '').trim();
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.replace(/['"]/g, '').trim();
const supabase = createClient(supabaseUrl, supabaseKey);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { limit: 999, delay: 2500 };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--limit' && args[i + 1]) opts.limit = Number(args[++i]);
    if (args[i] === '--delay' && args[i + 1]) opts.delay = Number(args[++i]);
  }
  return opts;
}

async function run() {
  const opts = parseArgs();

  const { data: roadmaps, error } = await supabase
    .from('ai_roadmaps')
    .select('id, field_id, title, description, content')
    .order('title');

  if (error) {
    console.error('❌', error.message);
    process.exit(1);
  }

  const pending = (roadmaps ?? []).filter((r) => {
    const content = typeof r.content === 'string' ? JSON.parse(r.content) : r.content;
    return !Array.isArray(content) || content.length === 0;
  }).slice(0, opts.limit);

  console.log(`📚 ${pending.length} roadmap(s) need lesson content (of ${roadmaps?.length ?? 0} total)`);

  let ok = 0;
  let fail = 0;

  for (const topic of pending) {
    console.log(`Generating: ${topic.title}...`);
    const { error: genError } = await supabase.functions.invoke('generate-roadmap', {
      body: {
        field_id: topic.field_id,
        roadmap_id: topic.id,
        title: topic.title,
        description: topic.description ?? '',
        force_regenerate: true,
      },
    });

    if (genError) {
      console.log('  ❌', genError.message);
      fail += 1;
    } else {
      console.log('  ✅', topic.title);
      ok += 1;
    }

    if (opts.delay > 0) await sleep(opts.delay);
  }

  console.log(`\n🎉 Done. ${ok} generated, ${fail} failed.`);
}

run();
