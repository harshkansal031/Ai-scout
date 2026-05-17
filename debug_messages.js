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
  console.log('Querying last assistant message from chat_messages...');
  
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('text, created_at')
      .eq('role', 'assistant')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error) {
      console.log('Error querying database:', error);
    } else {
      console.log('Success! Created At:', data.created_at);
      console.log('Full Text stored in DB:');
      console.log(JSON.stringify(data.text));
    }
  } catch (err) {
    console.error('Thrown error:', err);
  }
}

main().catch(console.error);
