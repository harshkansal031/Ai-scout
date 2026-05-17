import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const FIELD_COLORS = [
  '#7C3AED', '#2563EB', '#059669', '#D97706', '#DC2626',
  '#DB2777', '#0891B2', '#4F46E5', '#65A30D', '#EA580C',
  '#9333EA', '#0D9488', '#CA8A04', '#E11D48', '#0369A1',
]

const ALLOWED_ICONS = new Set([
  'sparkles', 'hardware-chip', 'git-network', 'eye', 'mic', 'image',
  'code-slash', 'library', 'school', 'bulb', 'rocket', 'layers',
  'analytics', 'cloud', 'shield-checkmark', 'construct', 'flask',
  'planet', 'pulse', 'terminal', 'videocam', 'document-text', 'cube',
])

type RoadmapSeed = { id: string; title: string; description: string }
type FieldSeed = {
  id: string
  title: string
  description: string
  icon: string
  roadmaps: RoadmapSeed[]
}

function slugify(text: string, max = 30): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, max)
}

function normalizeIcon(icon: string | undefined): string {
  const name = (icon ?? 'library').replace(/^ion-/, '').trim()
  return ALLOWED_ICONS.has(name) ? name : 'library'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {}
    const fieldCount = Math.min(Math.max(Number(body.field_count) || 12, 4), 20)
    const roadmapsPerField = Math.min(Math.max(Number(body.roadmaps_per_field) || 5, 2), 8)
    const replace = Boolean(body.replace)

    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const prompt = `You are building the master taxonomy for Scout AI, a personalized AI learning app.

Create a comprehensive, modern map of the AI field as of 2025–2026.

Return ONLY valid JSON (no markdown) in this exact shape:
{
  "fields": [
    {
      "id": "kebab-case-slug-max-24-chars",
      "title": "Human-readable category name",
      "description": "One sentence for learners.",
      "icon": "ionicons-name",
      "roadmaps": [
        {
          "id": "kebab-case-slug-max-24-chars",
          "title": "Specific learnable topic",
          "description": "One sentence on what the learner will master."
        }
      ]
    }
  ]
}

Rules:
- Exactly ${fieldCount} top-level "fields" spanning the full AI landscape (not just 3 buckets).
- Exactly ${roadmapsPerField} roadmaps per field (${fieldCount * roadmapsPerField} topics total).
- Cover: LLMs, multimodal, CV, NLP, RL, agents, RAG, fine-tuning, MLOps, ethics/safety, robotics, speech, generative media, edge AI, data, classical ML, neuroscience-inspired AI, AI products, etc.
- ids: lowercase a-z0-9 and hyphens only, unique globally across all roadmaps.
- icon: pick ONLY from: ${[...ALLOWED_ICONS].join(', ')}
- No duplicate titles. Topics must be specific (e.g. "Retrieval-Augmented Generation" not "AI Basics").`

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, responseMimeType: 'application/json' },
        }),
      },
    )

    const geminiData = await geminiRes.json()
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      throw new Error('Gemini returned no taxonomy')
    }

    const parsed = JSON.parse(text) as { fields: FieldSeed[] }
    if (!Array.isArray(parsed.fields) || parsed.fields.length === 0) {
      throw new Error('Invalid taxonomy shape from Gemini')
    }

    if (replace) {
      await supabase.from('ai_roadmaps').delete().neq('id', '')
      await supabase.from('ai_fields').delete().neq('id', '')
    }

    const seenRoadmapIds = new Set<string>()
    let fieldsUpserted = 0
    let roadmapsUpserted = 0

    for (let i = 0; i < parsed.fields.length; i++) {
      const raw = parsed.fields[i]
      const fieldId = slugify(raw.id || raw.title, 24)
      if (!fieldId) continue

      const { error: fieldError } = await supabase.from('ai_fields').upsert({
        id: fieldId,
        title: raw.title,
        description: raw.description ?? '',
        icon: normalizeIcon(raw.icon),
        color: FIELD_COLORS[i % FIELD_COLORS.length],
        sort_order: i + 1,
      })
      if (fieldError) throw fieldError
      fieldsUpserted += 1

      for (const rm of raw.roadmaps ?? []) {
        let roadmapId = slugify(rm.id || rm.title, 24)
        if (!roadmapId || seenRoadmapIds.has(roadmapId)) {
          roadmapId = slugify(`${fieldId}-${rm.title}`, 24)
        }
        if (!roadmapId || seenRoadmapIds.has(roadmapId)) continue
        seenRoadmapIds.add(roadmapId)

        const { data: existing } = await supabase
          .from('ai_roadmaps')
          .select('content')
          .eq('id', roadmapId)
          .maybeSingle()

        const hasContent = Array.isArray(existing?.content) && existing.content.length > 0

        const { error: roadmapError } = await supabase.from('ai_roadmaps').upsert({
          id: roadmapId,
          field_id: fieldId,
          title: rm.title,
          description: rm.description ?? '',
          content: hasContent ? existing!.content : [],
          is_generated: hasContent,
        })
        if (roadmapError) throw roadmapError
        roadmapsUpserted += 1
      }
    }

    const { data: fieldRows } = await supabase.from('ai_fields').select('id', { count: 'exact' })
    const { data: roadmapRows } = await supabase.from('ai_roadmaps').select('id', { count: 'exact' })

    return Response.json(
      {
        fields_upserted: fieldsUpserted,
        roadmaps_upserted: roadmapsUpserted,
        total_fields: fieldRows?.length ?? fieldsUpserted,
        total_roadmaps: roadmapRows?.length ?? roadmapsUpserted,
        replace,
      },
      { headers: corsHeaders },
    )
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 400, headers: corsHeaders },
    )
  }
})
