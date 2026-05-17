import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import {
  roadmapHasUnsafeYouTubeUrls,
  sanitizeRoadmapContent,
  type RoadmapStep,
} from "../_shared/roadmapUrls.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { field_id, roadmap_id, title, description, force_regenerate } = await req.json()

    if (!field_id || !roadmap_id || !title) {
      throw new Error("Missing required fields: field_id, roadmap_id, title")
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: existing } = await supabaseClient
      .from('ai_roadmaps')
      .select('content')
      .eq('id', roadmap_id)
      .maybeSingle()

    const existingContent = existing?.content as RoadmapStep[] | undefined

    if (
      !force_regenerate &&
      existingContent &&
      Array.isArray(existingContent) &&
      existingContent.length > 0
    ) {
      if (roadmapHasUnsafeYouTubeUrls(existingContent)) {
        const repaired = sanitizeRoadmapContent(existingContent, title)
        await supabaseClient
          .from('ai_roadmaps')
          .update({ content: repaired })
          .eq('id', roadmap_id)

        return new Response(JSON.stringify(repaired), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      return new Response(JSON.stringify(existingContent), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Dedicated key for roadmap generation (recommended). Falls back so older deploys keep working.
    const GEMINI_API_KEY =
      Deno.env.get('GEMINI_ROADMAP_API_KEY') ?? Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error(
        'Set Edge secret GEMINI_ROADMAP_API_KEY (recommended) or GEMINI_API_KEY in Supabase Dashboard',
      )
    }

    const GEMINI_MODEL =
      Deno.env.get('GEMINI_ROADMAP_MODEL')?.trim() || 'gemini-2.5-flash'

    const prompt = `You are an expert AI curriculum designer. Build a progressive 4-5 step learning roadmap for the topic: "${title}".
Description context: ${description || 'N/A'}.

For each step, identify the official documentation URL or best canonical reference for that specific concept.

Return ONLY a valid JSON array of objects, with no markdown formatting or extra text. Each object must have:
- "id": a short unique string (e.g. "t1")
- "title": Title of the topic
- "diff": "Beginner", "Intermediate", or "Advanced"
- "desc": One short, punchy sentence explaining what they will learn.
- "resource": The official documentation URL or best canonical reference for this step (e.g. "https://pytorch.org/docs/stable/nn.html" for PyTorch modules, "https://huggingface.co/docs/transformers" for HuggingFace). Use null if no official docs exist. NEVER use YouTube URLs.`

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      },
    )

    const geminiData = await response.json()
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text

    if (!generatedText) {
      const blocked = geminiData.promptFeedback
      const gErr = geminiData.error ?? geminiData
      throw new Error(
        `Gemini produced no candidates: HTTP ${response.status}; ` +
          (blocked?.blockReason ? `blocked=${blocked.blockReason}; ` : '') +
          (typeof gErr === 'object' ? JSON.stringify(gErr) : String(gErr)).slice(0, 420),
      )
    }

    const rawContent = JSON.parse(generatedText) as RoadmapStep[]
    const roadmapContent = sanitizeRoadmapContent(rawContent, title)

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
