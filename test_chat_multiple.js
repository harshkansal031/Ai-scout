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

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function main() {
  console.log('Running 3 consecutive tests to check for systematic truncation...');
  for (let i = 1; i <= 3; i++) {
    console.log(`\n--- TEST #${i} ---`);
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: 'Llm',
          page_context_type: 'general',
          page_context_id: null,
          query: null,
          user_id: 'local-user'
        }
      });
      
      if (error) {
        console.log('Error:', error);
      } else {
        console.log(`Length: ${data.answer.length} chars`);
        console.log('Answer:');
        console.log(data.answer);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  }
}

main().catch(console.error);
