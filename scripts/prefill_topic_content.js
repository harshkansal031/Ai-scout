/**
 * Backfill topic_content for explore_topics that have no live rows.
 *
 * Usage:
 *   node scripts/prefill_topic_content.js --limit 50
 *   node scripts/prefill_topic_content.js --all
 *   node scripts/prefill_topic_content.js --all --batch-size 40 --delay 2500
 *
 * Reads .env from project root (same as seed_explore_topics.js).
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim();
    if (key && val && !process.env[key]) process.env[key] = val;
  });
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
const ATTEMPTED_PATH = path.join(__dirname, '.prefill_attempted.json');

function loadAttemptedIds() {
  try {
    if (fs.existsSync(ATTEMPTED_PATH)) {
      return new Set(JSON.parse(fs.readFileSync(ATTEMPTED_PATH, 'utf8')));
    }
  } catch {
    /* ignore */
  }
  return new Set();
}

function saveAttemptedIds(set) {
  fs.writeFileSync(ATTEMPTED_PATH, JSON.stringify([...set], null, 0));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseArgs() {
  const args = process.argv.slice(2);
  let limit = Infinity;
  let delayMs = 2500;
  let batchSize = 50;
  let runAll = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--limit' && args[i + 1]) limit = parseInt(args[i + 1], 10);
    if (args[i] === '--delay' && args[i + 1]) delayMs = parseInt(args[i + 1], 10);
    if (args[i] === '--batch-size' && args[i + 1]) batchSize = parseInt(args[i + 1], 10);
    if (args[i] === '--all') runAll = true;
  }
  if (runAll) limit = batchSize;
  return { limit, delayMs, runAll, batchSize };
}

async function getMissingTopics(attemptedIds) {
  const { data: topics, error: topicsErr } = await supabase
    .from('explore_topics')
    .select('id, title')
    .order('title');
  if (topicsErr) throw topicsErr;

  const { data: withContent, error: contentErr } = await supabase
    .from('topic_content')
    .select('topic_id')
    .eq('is_staging', false);
  if (contentErr) throw contentErr;

  const hasContent = new Set((withContent ?? []).map((r) => r.topic_id));
  const missing = (topics ?? []).filter(
    (t) => !hasContent.has(t.id) && !attemptedIds.has(t.id),
  );
  return { total: topics?.length ?? 0, withContent: hasContent.size, missing };
}

async function crawlTopics(toProcess, delayMs, attemptedIds) {
  let ok = 0;
  let empty = 0;
  let failed = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const t = toProcess[i];
    process.stdout.write(`[${i + 1}/${toProcess.length}] ${t.id} … `);

    const { data, error } = await supabase.functions.invoke('fetch-topic-content', {
      body: { topic_id: t.id, topic_title: t.title },
    });

    if (error) {
      console.log(`❌ ${error.message}`);
      failed += 1;
    } else {
      const n = Number(data?.items_inserted ?? 0);
      if (n > 0) {
        console.log(`✅ ${n} items`);
        ok += 1;
      } else {
        console.log(`⚠️ 0 items (sources had no matches)`);
        empty += 1;
      }
    }

    attemptedIds.add(t.id);
    saveAttemptedIds(attemptedIds);

    if (i < toProcess.length - 1) await sleep(delayMs);
  }

  return { ok, empty, failed };
}

async function main() {
  const { limit, delayMs, runAll, batchSize } = parseArgs();
  const attemptedIds = loadAttemptedIds();

  let round = 0;
  let totalOk = 0;
  let totalEmpty = 0;
  let totalFailed = 0;

  do {
    round += 1;
    const { total, withContent, missing } = await getMissingTopics(attemptedIds);
    console.log(`\n📊 Corpus: ${total} topics, ${withContent} with live content, ${missing.length} still missing.`);

    if (missing.length === 0) {
      console.log('✅ All topics have been attempted at least once.');
      break;
    }

    const cap = runAll ? batchSize : (Number.isFinite(limit) ? limit : missing.length);
    const toProcess = missing.slice(0, cap);

    if (runAll) {
      console.log(`🔄 Batch ${round}: crawling ${toProcess.length} topics (${delayMs}ms gap)…\n`);
    } else {
      console.log(`🔄 Crawling ${toProcess.length} topics (${delayMs}ms between calls)…\n`);
    }

    const { ok, empty, failed } = await crawlTopics(toProcess, delayMs, attemptedIds);
    totalOk += ok;
    totalEmpty += empty;
    totalFailed += failed;

    if (!runAll) break;

    const { missing: stillMissing } = await getMissingTopics(attemptedIds);
    if (stillMissing.length === 0) break;

    console.log(`\n⏸ Batch ${round} done. Pausing 5s before next batch…`);
    await sleep(5000);
  } while (runAll);

  console.log(`\n✅ Finished. Topics with new content: ${totalOk}, no API matches: ${totalEmpty}, failed: ${totalFailed}`);
  const { withContent, missing } = await getMissingTopics(attemptedIds);
  console.log(`📊 Now: ${withContent} topics have live rows in topic_content (${missing.length} never got matches — normal for niche titles).`);
  console.log('\nRe-check in Supabase: select count(distinct topic_id) from topic_content where is_staging = false;');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
