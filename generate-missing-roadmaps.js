/**
 * Generates timeline content for roadmaps that have empty content[].
 *
 * Usage:
 *   node generate-missing-roadmaps.js
 *   node generate-missing-roadmaps.js --limit 10 --delay 3000
 *
 * Env (project root `.env`): EXPO_PUBLIC_SUPABASE_URL plus one of:
 *   SUPABASE_SERVICE_ROLE_KEY — preferred (same as seed/prefill scripts)
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY — works if DB RLS allows read + Functions accept anon JWT
 *
 * Important: Dashboard → Edge Functions → Secrets — set GEMINI_ROADMAP_API_KEY (or GEMINI_API_KEY).
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx === -1) return;
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (key && val && !process.env[key]) process.env[key] = val;
    });
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/['"]/g, '').trim();
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.replace(/['"]/g, '').trim();
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.replace(/['"]/g, '').trim();
const supabaseKey = serviceKey || anonKey;
const supabase = createClient(supabaseUrl, supabaseKey);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Reliable Edge Function invocation: supabase.functions.invoke loses error JSON on non-2xx.
 * Always logs HTTP status + raw/parsed body.
 */
async function invokeGenerateRoadmap(fnBody) {
  const base = supabaseUrl.replace(/\/+$/, '');
  const url = `${base}/functions/v1/generate-roadmap`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${supabaseKey}`,
      apikey: supabaseKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(fnBody),
  });
  const text = await res.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return {
    ok: res.ok,
    status: res.status,
    parsed,
    rawSnippet: typeof text === 'string' ? text.slice(0, 800) : '',
  };
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

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or EXPO_PUBLIC_SUPABASE_ANON_KEY.');
    process.exit(1);
  }

  console.log(serviceKey ? 'Using SUPABASE_SERVICE_ROLE_KEY for RPC + Functions.' : 'Using EXPO_PUBLIC_SUPABASE_ANON_KEY.');
  console.log(
    'Edge secrets needed: GEMINI_ROADMAP_API_KEY (or GEMINI_API_KEY). Optional: GEMINI_ROADMAP_MODEL=gemini-2.0-flash if 2.5 free quota is exhausted.',
  );

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
    if (!topic.field_id) {
      console.log(`⚠️ Skip "${topic.title}" — missing field_id`);
      fail += 1;
      continue;
    }
    console.log(`Generating: ${topic.title}...`);
    const inv = await invokeGenerateRoadmap({
      field_id: topic.field_id,
      roadmap_id: topic.id,
      title: topic.title,
      description: topic.description ?? '',
      force_regenerate: true,
    });

    if (!inv.ok) {
      const hint =
        inv.status === 401 || inv.status === 403
          ? ' JWT rejected — redeploy with: npx supabase functions deploy generate-roadmap --no-verify-jwt'
          : '';
      console.log(`  ❌ HTTP ${inv.status}${hint}`);
      if (typeof inv.parsed === 'object' && inv.parsed && inv.parsed.error) {
        console.log('     Edge:', inv.parsed.error);
      } else if (typeof inv.parsed === 'object' && inv.parsed !== null) {
        console.log('     Body:', JSON.stringify(inv.parsed, null, 2));
      } else if (inv.rawSnippet) {
        console.log('     Raw:', inv.rawSnippet);
      }
      fail += 1;
    } else if (typeof inv.parsed === 'object' && inv.parsed && inv.parsed.error) {
      console.log('  ⚠️ 200 but:', inv.parsed.error);
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
