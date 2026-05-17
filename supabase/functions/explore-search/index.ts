/**
 * explore-search
 *
 * Unified search endpoint for the Explore section.
 * Queries explore_topics (precomputed corpus) + content_items (news feed)
 * and returns a merged, ranked result set — all from our own DB.
 * Zero live external API calls on the search path.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { query } = await req.json() as { query?: string };
    const q = (query ?? '').trim();

    if (!q) {
      return Response.json({ topics: [], items: [] }, { headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const [topicsResult, contentResult, dailyTopicsResult] = await Promise.all([
      // Search precomputed AI topic corpus (primary explore topics)
      supabase
        .from('explore_topics')
        .select('id, title, field, field_slug, short_desc, difficulty, docs_url, tags')
        .or(`title.ilike.%${q}%,short_desc.ilike.%${q}%,field.ilike.%${q}%`)
        .order('title')
        .limit(12),

      // Search content_items (articles, papers, news from ingest-feed)
      supabase
        .from('content_items')
        .select('*')
        .or(`title.ilike.%${q}%,summary.ilike.%${q}%,source_name.ilike.%${q}%`)
        .order('published_at', { ascending: false })
        .limit(15),

      // Search daily_topics for learning path matches
      supabase
        .from('daily_topics')
        .select('id, title, description, difficulty, tag')
        .or(`title.ilike.%${q}%,description.ilike.%${q}%`)
        .eq('is_published', true)
        .limit(5),
    ]);

    return Response.json(
      {
        topics: topicsResult.data ?? [],
        items: [
          ...(dailyTopicsResult.data ?? []).map((t) => ({ ...t, type: 'daily_topic' })),
          ...(contentResult.data ?? []),
        ],
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    return Response.json(
      { error: (error as Error).message },
      { status: 500, headers: corsHeaders },
    );
  }
});
