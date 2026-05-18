/**
 * Backfill metadata.imageUrl for existing content_items by scraping og:image (same idea as ingest-feed).
 * Uses SUPABASE_SERVICE_ROLE_KEY for updates.
 *
 * Usage: node scripts/backfill-og-images.mjs [--limit 40]
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

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

function sanitizeImageUrl(url) {
  if (!url || typeof url !== 'string') return null;
  return url
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

async function fetchOgImage(sourceUrl) {
  const cleanUrl = sourceUrl.trim().replace(/\s+/g, '');
  let ogImageUrl = null;
  try {
    const response = await fetch(cleanUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(4500),
    });

    if (!response.ok) return null;

    const finalUrl = response.url;
    if (finalUrl.includes('/error_docs/') || finalUrl.includes('forbidden.html') || finalUrl.includes('/404') || finalUrl.includes('access-denied')) {
      return null;
    }

    let canonicalUrl = finalUrl;
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html')) return null;

    const html = await response.text();

    const canonicalMatch =
      html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) ||
      html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
    if (canonicalMatch?.[1]?.trim()?.startsWith('http')) {
      canonicalUrl = canonicalMatch[1].trim();
    }

    const ogImageMatch =
      html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
      html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);

    if (ogImageMatch?.[1]) {
      let imgUrl = ogImageMatch[1].trim();
      if (imgUrl && !imgUrl.startsWith('http')) {
        try {
          const parsedUrl = new URL(canonicalUrl);
          imgUrl = imgUrl.startsWith('/') ? `${parsedUrl.protocol}//${parsedUrl.host}${imgUrl}` : `${parsedUrl.protocol}//${parsedUrl.host}/${imgUrl}`;
        } catch {
          return null;
        }
      }
      ogImageUrl = sanitizeImageUrl(imgUrl);
    }
    return ogImageUrl;
  } catch {
    return null;
  }
}

function argLimit() {
  const idx = process.argv.indexOf('--limit');
  if (idx === -1 || !process.argv[idx + 1]) return 40;
  const n = parseInt(process.argv[idx + 1], 10);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 80) : 40;
}

const env = parseEnv(fs.readFileSync(path.join(root, '.env'), 'utf8'));
const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Need EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const limit = argLimit();
const supabase = createClient(supabaseUrl, serviceKey);

const { data: rows, error } = await supabase
  .from('content_items')
  .select('id, source_url, metadata')
  .in('type', ['news', 'research', 'paper'])
  .order('published_at', { ascending: false })
  .limit(120);

if (error) {
  console.error(error);
  process.exit(1);
}

const candidates = (rows ?? []).filter((row) => {
  const m = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  const has = Boolean(m.imageUrl || m.image_url || m.ogImage);
  return !has && row.source_url && /^https?:\/\//i.test(row.source_url);
}).slice(0, limit);

console.log(`Backfilling up to ${candidates.length} items (limit ${limit})…`);

let updated = 0;
let skipped = 0;

for (const row of candidates) {
  const og = await fetchOgImage(row.source_url);
  await new Promise((r) => setTimeout(r, 250));

  if (!og) {
    skipped += 1;
    console.log(`— no og:image: ${row.id}`);
    continue;
  }

  const meta = { ...(row.metadata && typeof row.metadata === 'object' ? row.metadata : {}), imageUrl: og };
  const { error: upErr } = await supabase.from('content_items').update({ metadata: meta, updated_at: new Date().toISOString() }).eq('id', row.id);

  if (upErr) {
    console.error(`Update failed ${row.id}:`, upErr.message);
  } else {
    updated += 1;
    console.log(`✓ ${row.id}`);
  }
}

console.log(`Done. Updated ${updated}, no image ${skipped}.`);
