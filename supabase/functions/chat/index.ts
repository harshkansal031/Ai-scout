import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const body = await req.json();
    const { message, page_context_type, page_context_id, query, user_id } = body;

    const contextParts: string[] = [];

    if (page_context_type === 'lecture' || page_context_type === 'today') {
      const { data } = await supabase.from('daily_topics').select('title, description, builder_takeaway, content_blocks').eq('id', page_context_id).maybeSingle();
      if (data) {
        contextParts.push(`Topic: ${data.title}`);
        contextParts.push(`Description: ${data.description}`);
        contextParts.push(`Builder takeaway: ${data.builder_takeaway}`);
      }
    }

    if (page_context_type === 'news' || page_context_type === 'explore') {
      const q = query ?? message;
      const { data } = await supabase.from('content_items').select('title, summary, source_name, source_url').or(`title.ilike.%${q}%,summary.ilike.%${q}%`).limit(5);
      if (data?.length) {
        contextParts.push(
          `Relevant sources:\n${data.map((item) => `- ${item.title} (${item.source_name})`).join('\n')}`,
        );
      }
    }

    const system = [
      'You are the AI Scout in-app assistant.',
      'Answer concisely for builders.',
      'Ground answers in the supplied context only when possible.',
      'Return a short practical explanation and cite the source titles you used.',
      contextParts.join('\n\n'),
    ].join('\n\n');

    const openAiResponse = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: Deno.env.get('OPENAI_CHAT_MODEL') ?? 'gpt-4.1-mini',
        temperature: 0.4,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: message },
        ],
      }),
    });

    const completion = await openAiResponse.json();
    const answer = completion.choices?.[0]?.message?.content ?? 'I could not generate a response right now.';

    const { data: session } = await supabase
      .from('chat_sessions')
      .insert({
        user_id,
        page_context_type,
        page_context_id,
        query,
      })
      .select('id')
      .single();

    const citations = contextParts
      .flatMap((part) => part.split('\n'))
      .filter((line) => line.startsWith('- '))
      .map((line) => line.replace('- ', ''));

    if (session?.id) {
      await supabase.from('chat_messages').insert([
        { session_id: session.id, role: 'user', text: message },
        { session_id: session.id, role: 'assistant', text: answer, citations },
      ]);
    }

    return Response.json(
      {
        answer,
        citations,
        session_id: session?.id ?? null,
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
