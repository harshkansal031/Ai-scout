/**
 * fetch-topic-content
 *
 * Fetches articles, research papers, and community posts for one or all
 * explore_topics and stores them in topic_content using the atomic-swap pattern.
 *
 * Called by:
 *  - The pg_cron schedule (runs 2x daily) with { run_all: true }
 *  - The seed script after first seeding explore_topics
 *  - Optionally on-demand with { topic_id: "transformer-architecture" }
 *
 * Body params:
 *   topic_id?  – single topic to refresh
 *   run_all?   – if true, refreshes every topic in explore_topics
 *   batch_id?  – optional UUID to correlate with a cron_runs log entry
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

type TopicRow = { id: string; title: string };

type ContentRow = {
  id: string;
  topic_id: string;
  type: string;
  title: string;
  summary: string;
  source_url: string;
  source_name: string;
  category: string;
  category_color: string;
  published_at?: string;
  is_staging: boolean;
  batch_id: string;
  metadata: Record<string, unknown>;
};

// ── XML helper (reused from ingest-feed) ────────────────────────────────────
function xmlGet(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim() ?? '';
}

// ── Dev.to ───────────────────────────────────────────────────────────────────
async function fetchDevTo(topic: TopicRow, batchId: string): Promise<ContentRow[]> {
  try {
    // Use tags search for better precision; fall back to title search
    const tag = topic.title.toLowerCase().replace(/\s+/g, '-').slice(0, 30);
    const res = await fetch(
      `https://dev.to/api/articles?per_page=6&tag=${encodeURIComponent(tag)}&top=7`,
      { headers: { 'User-Agent': 'Scout-AI/1.0' }, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return [];
    const articles = (await res.json()) as Record<string, unknown>[];
    return articles.slice(0, 5).map((a: Record<string, unknown>) => ({
      id: `devto-${a['id']}-${topic.id}`,
      topic_id: topic.id,
      type: 'article',
      title: String(a['title'] ?? ''),
      summary: String(a['description'] ?? a['title'] ?? '').slice(0, 320),
      source_url: String(a['url'] ?? ''),
      source_name: 'Dev.to',
      category: 'Article',
      category_color: '#059669',
      published_at: a['published_at'] ? String(a['published_at']) : undefined,
      is_staging: true,
      batch_id: batchId,
      metadata: { reading_time: a['reading_time_minutes'] ?? 0 },
    })).filter((r) => r.title && r.source_url);
  } catch {
    return [];
  }
}

// ── ArXiv ────────────────────────────────────────────────────────────────────
async function fetchArxiv(topic: TopicRow, batchId: string): Promise<ContentRow[]> {
  try {
    const q = encodeURIComponent(`ti:"${topic.title}" OR abs:"${topic.title}"`);
    const url = `https://export.arxiv.org/api/query?search_query=${q}&start=0&max_results=5&sortBy=submittedDate&sortOrder=descending`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const xml = await res.text();
    return xml
      .split('<entry>')
      .slice(1)
      .map((entry) => {
        const arxivId = xmlGet(entry, 'id');
        const rawSummary = xmlGet(entry, 'summary').replace(/\s+/g, ' ').trim();
        const title = xmlGet(entry, 'title').replace(/\s+/g, ' ').trim();
        if (!title || !arxivId) return null;
        return {
          id: `arxiv-${arxivId.split('/').pop()}-${topic.id}`,
          topic_id: topic.id,
          type: 'research',
          title,
          summary: rawSummary.length > 320 ? rawSummary.slice(0, 317) + '…' : rawSummary,
          source_url: arxivId,
          source_name: 'ArXiv',
          category: 'Research Paper',
          category_color: '#7C3AED',
          published_at: xmlGet(entry, 'published') || undefined,
          is_staging: true,
          batch_id: batchId,
          metadata: {},
        } satisfies ContentRow;
      })
      .filter((r): r is ContentRow => r !== null);
  } catch {
    return [];
  }
}

// ── Semantic Scholar ──────────────────────────────────────────────────────────
async function fetchSemanticScholar(topic: TopicRow, batchId: string): Promise<ContentRow[]> {
  try {
    const q = encodeURIComponent(topic.title);
    const res = await fetch(
      `https://api.semanticscholar.org/graph/v1/paper/search?query=${q}&limit=5&fields=title,abstract,url,year,publicationDate`,
      { headers: { 'User-Agent': 'Scout-AI/1.0' }, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return [];
    const data = await res.json() as { data?: Record<string, unknown>[] };
    return (data.data ?? []).map((p) => {
      const paperId = String(p['paperId'] ?? '');
      const abstract = String(p['abstract'] ?? '');
      const title = String(p['title'] ?? '');
      if (!title) return null;
      return {
        id: `s2-${paperId}-${topic.id}`,
        topic_id: topic.id,
        type: 'research',
        title,
        summary: abstract.length > 320 ? abstract.slice(0, 317) + '…' : abstract || title,
        source_url: String(p['url'] ?? `https://www.semanticscholar.org/paper/${paperId}`),
        source_name: 'Semantic Scholar',
        category: 'Research Paper',
        category_color: '#7C3AED',
        published_at: p['publicationDate'] ? new Date(String(p['publicationDate'])).toISOString() : undefined,
        is_staging: true,
        batch_id: batchId,
        metadata: { year: p['year'] ?? null },
      } satisfies ContentRow;
    }).filter((r): r is ContentRow => r !== null);
  } catch {
    return [];
  }
}

// ── Hacker News (Algolia) ─────────────────────────────────────────────────────
async function fetchHackerNews(topic: TopicRow, batchId: string): Promise<ContentRow[]> {
  try {
    const q = encodeURIComponent(topic.title);
    const res = await fetch(
      `https://hn.algolia.com/api/v1/search?query=${q}&tags=story&hitsPerPage=8`,
      { signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return [];
    const data = await res.json() as { hits?: Record<string, unknown>[] };
    return (data.hits ?? [])
      .filter((h) => h['url'] && Number(h['points'] ?? 0) > 30)
      .slice(0, 3)
      .map((h) => ({
        id: `hn-${h['objectID']}-${topic.id}`,
        topic_id: topic.id,
        type: 'post',
        title: String(h['title'] ?? ''),
        summary: `${Number(h['points'] ?? 0)} points · ${Number(h['num_comments'] ?? 0)} comments on Hacker News`,
        source_url: String(h['url'] ?? ''),
        source_name: 'Hacker News',
        category: 'Community Post',
        category_color: '#EA580C',
        published_at: h['created_at'] ? String(h['created_at']) : undefined,
        is_staging: true,
        batch_id: batchId,
        metadata: { points: h['points'], comments: h['num_comments'] },
      }))
      .filter((r) => r.title && r.source_url);
  } catch {
    return [];
  }
}

// ── PapersWithCode ────────────────────────────────────────────────────────────
async function fetchPapersWithCode(topic: TopicRow, batchId: string): Promise<ContentRow[]> {
  try {
    const q = encodeURIComponent(topic.title);
    const res = await fetch(
      `https://paperswithcode.com/api/v1/papers/?q=${q}&items_per_page=4`,
      { headers: { 'User-Agent': 'Scout-AI/1.0' }, signal: AbortSignal.timeout(8000) },
    );
    if (!res.ok) return [];
    const data = await res.json() as { results?: Record<string, unknown>[] };
    return (data.results ?? []).slice(0, 3).map((p) => {
      const title = String(p['title'] ?? '');
      const paperId = String(p['id'] ?? '');
      if (!title) return null;
      return {
        id: `pwc-${paperId}-${topic.id}`,
        topic_id: topic.id,
        type: 'research',
        title,
        summary: String(p['abstract'] ?? title).slice(0, 320),
        source_url: `https://paperswithcode.com/paper/${p['paper_swc_id'] ?? paperId}`,
        source_name: 'Papers With Code',
        category: 'Research + Code',
        category_color: '#0891B2',
        published_at: p['published'] ? String(p['published']) : undefined,
        is_staging: true,
        batch_id: batchId,
        metadata: { stars: p['github_link'] ? 1 : 0 },
      } satisfies ContentRow;
    }).filter((r): r is ContentRow => r !== null);
  } catch {
    return [];
  }
}

// ── Deduplicate by source_url within a batch ──────────────────────────────────
function deduplicate(items: ContentRow[]): ContentRow[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item.source_url || seen.has(item.source_url)) return false;
    seen.add(item.source_url);
    return true;
  });
}

// ── Handler ───────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;
    const { topic_id, run_all, batch_id } = body;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const batchId = String(batch_id ?? crypto.randomUUID());

    // Log start of cron run
    const { data: runLog } = await supabase
      .from('cron_runs')
      .insert({ job_name: 'fetch-topic-content', batch_id: batchId, status: 'running' })
      .select('id')
      .single();
    const runId = runLog?.id;

    // Resolve which topics to process
    let topics: TopicRow[] = [];
    if (run_all) {
      const { data } = await supabase.from('explore_topics').select('id, title');
      topics = (data ?? []) as TopicRow[];
    } else if (topic_id) {
      const { data } = await supabase
        .from('explore_topics')
        .select('id, title')
        .eq('id', String(topic_id))
        .maybeSingle();
      if (data) topics = [data as TopicRow];
    }

    if (topics.length === 0) {
      await supabase
        .from('cron_runs')
        .update({ status: 'failed', error_message: 'No topics found', finished_at: new Date().toISOString() })
        .eq('id', runId);
      return Response.json({ error: 'No topics found' }, { status: 400, headers: corsHeaders });
    }

    let totalInserted = 0;

    // Process topics in small parallel batches to avoid rate limits
    const BATCH_SIZE = 5;
    for (let i = 0; i < topics.length; i += BATCH_SIZE) {
      const chunk = topics.slice(i, i + BATCH_SIZE);

      await Promise.all(
        chunk.map(async (topic) => {
          const [devtoItems, arxivItems, s2Items, hnItems, pwcItems] = await Promise.all([
            fetchDevTo(topic, batchId),
            fetchArxiv(topic, batchId),
            fetchSemanticScholar(topic, batchId),
            fetchHackerNews(topic, batchId),
            fetchPapersWithCode(topic, batchId),
          ]);

          const allItems = deduplicate([
            ...devtoItems,
            ...arxivItems,
            ...s2Items,
            ...hnItems,
            ...pwcItems,
          ]);

          if (allItems.length === 0) return;

          const { error } = await supabase
            .from('topic_content')
            .upsert(allItems, { onConflict: 'id' });

          if (!error) totalInserted += allItems.length;
        }),
      );

      // Small delay between chunks to be respectful of free-tier APIs
      if (i + BATCH_SIZE < topics.length) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // Atomic swap: promote staging rows → live, delete old live rows
    if (run_all) {
      const { data: swapResult } = await supabase.rpc('swap_topic_content_batch', {
        p_batch_id: batchId,
      });
      console.log('[fetch-topic-content] Atomic swap result:', swapResult);
    }

    // Update cron run log
    await supabase
      .from('cron_runs')
      .update({
        status: 'success',
        topics_processed: topics.length,
        items_inserted: totalInserted,
        finished_at: new Date().toISOString(),
      })
      .eq('id', runId);

    return Response.json(
      {
        batch_id: batchId,
        topics_processed: topics.length,
        items_inserted: totalInserted,
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
