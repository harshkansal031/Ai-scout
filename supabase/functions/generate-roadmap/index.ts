import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { field_id, roadmap_id, title, description } = await req.json()

    if (!field_id || !roadmap_id || !title) {
      throw new Error("Missing required fields: field_id, roadmap_id, title")
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Check if it already exists to prevent duplicate generation (The Infinite Library)
    const { data: existing } = await supabaseClient
      .from('ai_roadmaps')
      .select('content')
      .eq('id', roadmap_id)
      .maybeSingle()

    if (existing && existing.content && existing.content.length > 0) {
      return new Response(JSON.stringify(existing.content), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. If it doesn't exist, call Gemini API to generate the curriculum
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set")
    }

    // Notice we are explicitly asking Gemini to prioritize YouTube videos!
    const prompt = `You are an expert AI curriculum designer. Build a progressive 4-5 step learning roadmap for the topic: "${title}". 
Description context: ${description || 'N/A'}.

For each step, find the absolute best educational resource (prioritizing high-quality YouTube video tutorials, or canonical articles if no good video exists) that explains it. 

Return ONLY a valid JSON array of objects, with no markdown formatting or extra text. Each object must have:
- "id": a short unique string (e.g. "t1")
- "title": Title of the topic
- "diff": "Beginner", "Intermediate", or "Advanced"
- "desc": One short, punchy sentence explaining what they will learn.
- "resource": A real URL to a high-quality YouTube video or canonical guide for this exact topic.`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
           temperature: 0.2, // Low temperature for factual consistency
           responseMimeType: "application/json",
        }
      })
    })

    const geminiData = await response.json()
    let generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (!generatedText) {
      throw new Error("Failed to generate content from Gemini")
    }

    const roadmapContent = JSON.parse(generatedText)

    // 3. Save to database permanently
    const { error: insertError } = await supabaseClient
      .from('ai_roadmaps')
      .upsert({
        id: roadmap_id,
        field_id: field_id,
        title: title,
        description: description || '',
        content: roadmapContent,
        is_generated: true
      })

    if (insertError) {
      throw insertError
    }

    return new Response(JSON.stringify(roadmapContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
