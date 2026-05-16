import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const GEMINI_MODEL = 'gemini-flash-latest';
const GEMINI_URL = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${key}`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Fetch existing topics to avoid duplicates
    const { data: existingTopics } = await supabase.from('daily_topics').select('title').limit(50);
    const existingTitles = existingTopics?.map((t) => t.title).join(', ') ?? 'None';

    const systemInstruction = `You are an expert AI curriculum designer. Generate a new, unique daily learning topic for AI builders (software engineers, founders). 
The topic must be practical, cutting-edge, and highly relevant to building AI apps right now. Do NOT use any of these existing topics: ${existingTitles}.

Return ONLY a valid JSON object with the following structure, no markdown formatting, no backticks, just the raw JSON:
{
  "id": "slug-format-id",
  "slug": "slug-format-id",
  "title": "Short Catchy Title",
  "tag": "Short Tag (1-2 words)",
  "duration_minutes": 25,
  "difficulty": "Beginner | Intermediate | Advanced",
  "description": "1 sentence description of what this is and why it matters.",
  "builder_takeaway": "1 sentence practical takeaway for an engineer.",
  "whatYoullLearn": [
    "Bullet point 1",
    "Bullet point 2",
    "Bullet point 3"
  ],
  "resources": [
    {
      "type": "article | video | tool",
      "title": "Name of the resource (make it sound real/authoritative)",
      "url": "https://example.com",
      "duration_label": "15 min",
      "sort_order": 1
    },
    {
      "type": "article | video | tool",
      "title": "Name of the second resource",
      "url": "https://example.com",
      "duration_label": "20 min",
      "sort_order": 2
    }
  ]
}`;

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY') ?? '';
    const response = await fetch(GEMINI_URL(geminiApiKey), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: 'Generate a new daily topic for today.' }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      }),
    });

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      console.error('Gemini API Error Response:', data);
      throw new Error(`Failed to generate topic from Gemini: ${JSON.stringify(data)}`);
    }

    const topicData = JSON.parse(resultText);

    // Insert into daily_topics
    const { error: topicError } = await supabase.from('daily_topics').insert({
      id: topicData.id,
      slug: topicData.slug,
      title: topicData.title,
      tag: topicData.tag,
      duration_minutes: topicData.duration_minutes,
      difficulty: topicData.difficulty,
      description: topicData.description,
      builder_takeaway: topicData.builder_takeaway,
      content_blocks: { whatYoullLearn: topicData.whatYoullLearn },
      publish_date: new Date().toISOString().split('T')[0], // Today
      is_published: true,
    });

    if (topicError) throw topicError;

    // Insert resources
    if (topicData.resources?.length) {
      const resourcesToInsert = topicData.resources.map((res: any) => ({
        topic_id: topicData.id,
        type: res.type,
        title: res.title,
        url: res.url,
        duration_label: res.duration_label,
        sort_order: res.sort_order,
      }));

      const { error: resError } = await supabase.from('resources').insert(resourcesToInsert);
      if (resError) console.error('Failed to insert resources:', resError);
    }

    // Mark previous topic as published=false if we want to rotate, or just leave them all true.
    // The query usually fetches the latest one ordered by publish_date.

    return Response.json({ success: true, topic: topicData.title }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
