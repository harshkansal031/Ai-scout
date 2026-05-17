/**
 * explore-search
 *
 * Unified search for Explore: explore_topics corpus + content_items + daily_topics.
 * Uses synonym / phrase expansion ("Gen AI" → generative…) + heuristic relevance ranking.
 * Still no embedding index — deterministic and fast over existing pg_trgm-friendly ILIKE queries.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import {
  buildIlikeOrClause,
  expandSearchNeedles,
  rankContentRow,
  rankExploreTopic,
  uniqByKey,
} from '../_shared/searchExpand.ts';

type DailyRow = {
  id: string;
  title: string | null;
  description: string | null;
  difficulty?: string | null;
  tag?: string | null;
};

function rankDailyRow(row: DailyRow, needles: string[], rawLower: string): number {
  return rankContentRow(
    { title: row.title, summary: row.description, source_name: row.tag ?? null },
    needles,
    rawLower,
  );
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { query } = (await req.json()) as { query?: string };
    const qRaw = (query ?? '').trim();
    const rawLower = qRaw.toLowerCase();

    if (!qRaw) {
      return Response.json({ topics: [], items: [] }, { headers: corsHeaders });
    }

    const needles = expandSearchNeedles(qRaw);
    if (!needles.length) {
      return Response.json({ topics: [], items: [] }, { headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const topicCols = ['title', 'short_desc', 'description', 'field', 'id'];
    const topicsOr = buildIlikeOrClause(topicCols, needles, 72);
    const contentOr = buildIlikeOrClause(['title', 'summary', 'source_name'], needles, 60);
    const dailyOr = buildIlikeOrClause(['title', 'description', 'tag'], needles, 36);

    const [topicsResult, contentResult, dailyTopicsResult] = await Promise.all([
      supabase
        .from('explore_topics')
        .select('id, title, field, field_slug, description, short_desc, difficulty, docs_url, tags')
        .or(topicsOr)
        .limit(72),

      supabase.from('content_items').select('*').or(contentOr).order('published_at', { ascending: false }).limit(48),

      supabase.from('daily_topics').select('*').or(dailyOr).eq('is_published', true).limit(20),
    ]);

    const mergedTopics = uniqByKey(topicsResult.data ?? [], (r) => String(r.id)).sort((a, b) => {
      const sa = rankExploreTopic(a, needles, rawLower);
      const sb = rankExploreTopic(b, needles, rawLower);
      if (sb !== sa) return sb - sa;
      return (a.title ?? '').localeCompare(b.title ?? '');
    });

    const mergedContent = uniqByKey(contentResult.data ?? [], (r) => String(r.id)).sort((a, b) => {
      const sa = rankContentRow(a, needles, rawLower);
      const sb = rankContentRow(b, needles, rawLower);
      if (sb !== sa) return sb - sa;
      return String(b.published_at ?? '').localeCompare(String(a.published_at ?? ''));
    });

    const mergedDaily = uniqByKey(dailyTopicsResult.data ?? [], (r: DailyRow) => r.id).sort((a: DailyRow, b: DailyRow) => {
      const sa = rankDailyRow(a, needles, rawLower);
      const sb = rankDailyRow(b, needles, rawLower);
      return sb - sa;
    });

    const topicPayload = mergedTopics.slice(0, 12).map(({ description: _omit, tags, ...rest }) => ({
      ...rest,
      tags,
      short_desc: rest.short_desc ?? '',
    }));

    return Response.json(
      {
        topics: topicPayload,
        items: [
          ...mergedDaily.slice(0, 5).map((t: DailyRow) => ({ ...t, type: 'daily_topic' })),
          ...mergedContent.slice(0, 15),
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
