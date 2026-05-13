import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const [contentResult, topicResult] = await Promise.all([
      supabase
        .from('content_items')
        .select('*')
        .or(`title.ilike.%${query}%,summary.ilike.%${query}%,source_name.ilike.%${query}%`)
        .order('published_at', { ascending: false })
        .limit(20),
      supabase
        .from('daily_topics')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(10),
    ]);

    if (contentResult.error) throw contentResult.error;
    if (topicResult.error) throw topicResult.error;

    return Response.json(
      {
        items: [
          ...(topicResult.data ?? []).map((topic) => ({ ...topic, type: 'topic' })),
          ...(contentResult.data ?? []),
        ],
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
