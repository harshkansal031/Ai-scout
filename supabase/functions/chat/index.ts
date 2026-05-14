import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Google Gemini REST API
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_URL = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

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

    // ── Build grounded context from the database ──────────────────────────
    const contextParts: string[] = [];

    if (page_context_type === 'lecture' || page_context_type === 'today') {
      const { data } = await supabase
        .from('daily_topics')
        .select('title, description, builder_takeaway, content_blocks')
        .eq('id', page_context_id)
        .maybeSingle();
      if (data) {
        contextParts.push(`Topic: ${data.title}`);
        contextParts.push(`Description: ${data.description}`);
        contextParts.push(`Builder takeaway: ${data.builder_takeaway}`);
      }
    }

    if (page_context_type === 'news' || page_context_type === 'explore') {
      const q = query ?? message;
      const { data } = await supabase
        .from('content_items')
        .select('title, summary, source_name, source_url')
        .or(`title.ilike.%${q}%,summary.ilike.%${q}%`)
        .limit(5);
      if (data?.length) {
        contextParts.push(
          `Relevant sources:\n${data.map((item) => `- ${item.title} (${item.source_name})`).join('\n')}`,
        );
      }
    }

    // ── Build the Gemini prompt ───────────────────────────────────────────
    const systemInstruction = [
      'You are the AI Scout in-app assistant — a helpful guide for AI builders.',
      'Answer concisely and practically.',
      'Ground your answers in the supplied context when possible.',
      'At the end, list the source titles you used as citations.',
      contextParts.length ? `\n\nContext:\n${contextParts.join('\n\n')}` : '',
    ].join('\n');

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
    const geminiResponse = await fetch(GEMINI_URL(geminiApiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: message }] }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 512,
        },
      }),
    });

    const geminiData = await geminiResponse.json();
    const answer =
      geminiData.candidates?.[0]?.content?.parts?.[0]?.text ??
      'I could not generate a response right now. Please try again.';

    // ── Persist the chat session & messages ──────────────────────────────
    const { data: session } = await supabase
      .from('chat_sessions')
      .insert({ user_id, page_context_type, page_context_id, query })
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
      { answer, citations, session_id: session?.id ?? null },
      { headers: corsHeaders },
    );
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
