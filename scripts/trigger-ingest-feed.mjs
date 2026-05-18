/**
 * One-off helper: POST to Edge Function ingest-feed using root .env
 * Usage: node scripts/trigger-ingest-feed.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env');

function parseEnv(contents) {
  const out = {};
  for (const line of contents.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i === -1) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const env = parseEnv(fs.readFileSync(envPath, 'utf8'));
const base = env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const key = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!base || !key) {
  console.error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const url = `${base}/functions/v1/ingest-feed`;
const res = await fetch(url, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  },
});

const text = await res.text();
console.log('Status:', res.status);
console.log(text);
if (!res.ok) process.exit(1);
