import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

type FeedItem = {
  id: string;
  type: string;
  title: string;
  summary: string;
  source_name: string;
  source_url: string;
  canonical_url?: string;
  published_at?: string;
  tags?: string[];
  external_id?: string;
};

const ARXIV_URL = 'https://export.arxiv.org/api/query?search_query=all:artificial+intelligence&start=0&max_results=8&sortBy=submittedDate&sortOrder=descending';
const HN_SEARCH_URL = 'https://hn.algolia.com/api/v1/search_by_date?query=artificial%20intelligence&tags=story';

function xmlValue(entry: string, tag: string) {
  const match = entry.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return match?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() ?? '';
}

async function fetchArxiv(): Promise<FeedItem[]> {
  const response = await fetch(ARXIV_URL);
  const xml = await response.text();
  return xml
    .split('<entry>')
    .slice(1)
    .map((entry) => {
      const id = xmlValue(entry, 'id');
      return {
        id,
        type: 'paper',
        title: xmlValue(entry, 'title').replace(/\s+/g, ' '),
        summary: xmlValue(entry, 'summary').replace(/\s+/g, ' '),
        source_name: 'arXiv',
        source_url: id,
        canonical_url: id,
        published_at: xmlValue(entry, 'published'),
        external_id: id,
        tags: ['paper', 'arxiv'],
      };
    });
}

async function fetchHn(): Promise<FeedItem[]> {
  const response = await fetch(HN_SEARCH_URL);
  const json = await response.json();
  return (json.hits ?? []).slice(0, 10).map((hit: any) => ({
    id: `hn-${hit.objectID}`,
    type: 'news',
    title: hit.title ?? hit.story_title ?? 'AI News',
    summary: hit.story_text ?? 'AI news item from Hacker News.',
    source_name: 'Hacker News',
    source_url: hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`,
    canonical_url: hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`,
    published_at: hit.created_at,
    external_id: `hn-${hit.objectID}`,
    tags: ['news', 'hn'],
  }));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const items = [...await fetchArxiv(), ...await fetchHn()];

    const payload = items.map((item) => ({
      ...item,
      metadata: {
        ingested_at: new Date().toISOString(),
      },
    }));

    const { error } = await supabase.from('content_items').upsert(payload, {
      onConflict: 'id',
    });

    if (error) {
      throw error;
    }

    return Response.json({ inserted: payload.length }, { headers: corsHeaders });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
