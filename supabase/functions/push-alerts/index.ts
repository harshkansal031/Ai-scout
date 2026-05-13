import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const [topicResult, tokenResult] = await Promise.all([
      supabase.from('daily_topics').select('title').eq('is_published', true).order('publish_date', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('device_tokens').select('token, user_id'),
    ]);

    if (topicResult.error) throw topicResult.error;
    if (tokenResult.error) throw tokenResult.error;

    const messages = (tokenResult.data ?? []).map((entry) => ({
      to: entry.token,
      sound: 'default',
      title: 'Today on AI Scout',
      body: topicResult.data?.title ?? 'A new AI topic is ready to study.',
      data: { type: 'daily-topic' },
    }));

    if (messages.length) {
      await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });
    }

    return Response.json({ sent: messages.length }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
