const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.resolve('.env');
const env = {};
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
      if (key && val) env[key] = val;
    });
}

const SUPABASE_URL = env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_KEY  = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  console.log('Querying content_items from DB...');
  const { data, error } = await supabase
    .from('content_items')
    .select('id, title, published_at, tags')
    .contains('tags', ['launches'])
    .order('published_at', { ascending: false });
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log(`Found ${data.length} items:`);
  data.forEach((item, idx) => {
    console.log(`${idx + 1}. [${item.published_at}] - ${item.title} (Tags: ${JSON.stringify(item.tags)})`);
  });
}

main().catch(console.error);
