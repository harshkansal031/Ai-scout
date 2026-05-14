import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// ── Types ────────────────────────────────────────────────────────────────────
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
  metadata?: Record<string, unknown>;
};

// ── RSS Parser ────────────────────────────────────────────────────────────────
function xmlGet(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim() ?? '';
}

function parseRssDate(dateStr: string): string | undefined {
  if (!dateStr) return undefined;
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function slugify(url: string): string {
  return url.replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(-60);
}

function getSmartTags(title: string, summary: string, sourceTags: string[]): string[] {
  const tags = new Set([...sourceTags]);
  const text = `${title} ${summary}`.toLowerCase();

  const launchKeywords = ['launch', 'release', 'introducing', 'unveils', 'available now', 'new model', 'announcing'];
  const industryKeywords = ['funding', 'raised', 'acquisition', 'startup', 'market', 'valuation', 'hiring', 'partnership'];
  const researchKeywords = ['paper', 'breakthrough', 'research', 'study', 'benchmark', 'dataset', 'llm', 'training'];

  if (launchKeywords.some(k => text.includes(k))) tags.add('launches');
  if (industryKeywords.some(k => text.includes(k))) tags.add('industry');
  if (researchKeywords.some(k => text.includes(k))) tags.add('research');

  if (!tags.has('launches') && !tags.has('industry') && !tags.has('research')) {
    tags.add('general');
  }

  return Array.from(tags);
}

async function fetchRssFeed(
  feedUrl: string,
  sourceName: string,
  type: 'news' | 'research' | 'paper',
  sourceTags: string[],
): Promise<FeedItem[]> {
  try {
    const response = await fetch(feedUrl, {
      headers: { 'User-Agent': 'AI-Scout-Bot/1.0', Accept: 'application/rss+xml, application/xml, text/xml' },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return [];

    const xml = await response.text();

    const items: FeedItem[] = [];
    const rawItems = xml.split(/<item[\s>]/i).slice(1);

    for (const raw of rawItems.slice(0, 15)) {
      const title = xmlGet(raw, 'title');
      if (!title) continue;

      const link = xmlGet(raw, 'link') || xmlGet(raw, 'guid');
      if (!link || !link.startsWith('http')) continue;

      const pubDateStr = xmlGet(raw, 'pubDate') || xmlGet(raw, 'dc:date') || xmlGet(raw, 'updated');
      const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();

      const description = xmlGet(raw, 'description') || xmlGet(raw, 'content:encoded') || xmlGet(raw, 'summary');
      const summary = description.slice(0, 320) || title;

      items.push({
        id: `rss-${slugify(link)}`,
        type,
        title,
        summary,
        source_name: sourceName,
        source_url: link,
        canonical_url: link,
        published_at: pubDate.toISOString(),
        external_id: link,
        tags: getSmartTags(title, summary, sourceTags),
        metadata: { ingested_at: new Date().toISOString(), source: sourceName },
      });
    }

    return items;
  } catch {
    return [];
  }
}

const RSS_SOURCES = [
  {
    url: 'https://techcrunch.com/category/artificial-intelligence/feed/',
    name: 'TechCrunch AI',
    type: 'news' as const,
    tags: ['news'],
  },
  {
    url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml',
    name: 'The Verge AI',
    type: 'news' as const,
    tags: ['news'],
  },
  {
    url: 'https://venturebeat.com/category/ai/feed/',
    name: 'VentureBeat AI',
    type: 'news' as const,
    tags: ['news'],
  },
  {
    url: 'https://the-decoder.com/feed/',
    name: 'The Decoder',
    type: 'news' as const,
    tags: ['news'],
  },
  {
    url: 'https://huggingface.co/blog/feed.xml',
    name: 'Hugging Face',
    type: 'research' as const,
    tags: ['research', 'launches'],
  },
  {
    url: 'https://simonwillison.net/categories/ai/atom.xml',
    name: 'Simon Willison',
    type: 'news' as const,
    tags: ['news', 'builder'],
  },
  {
    url: 'https://blog.google/technology/ai/rss/',
    name: 'Google AI',
    type: 'news' as const,
    tags: ['news', 'launches'],
  },
  {
    url: 'https://openai.com/news/rss.xml',
    name: 'OpenAI News',
    type: 'news' as const,
    tags: ['news', 'launches'],
  },
  {
    url: 'https://www.anthropic.com/rss.xml',
    name: 'Anthropic',
    type: 'research' as const,
    tags: ['research'],
  },
];

// ── arXiv (latest cs.AI papers) ───────────────────────────────────────────────
async function fetchArxiv(): Promise<FeedItem[]> {
  try {
    const url = 'https://export.arxiv.org/api/query?search_query=cat:cs.AI&start=0&max_results=10&sortBy=submittedDate&sortOrder=descending';
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const xml = await response.text();
    return xml
      .split('<entry>')
      .slice(1)
      .map((entry) => {
        const id = xmlGet(entry, 'id');
        const rawSummary = xmlGet(entry, 'summary').replace(/\s+/g, ' ');
        return {
          id: `arxiv-${id.split('/').pop()}`,
          type: 'paper' as const,
          title: xmlGet(entry, 'title').replace(/\s+/g, ' '),
          summary: rawSummary.length > 300 ? rawSummary.slice(0, 297) + '…' : rawSummary,
          source_name: 'arXiv',
          source_url: id,
          canonical_url: id,
          published_at: xmlGet(entry, 'published'),
          external_id: id,
          tags: ['paper', 'arxiv', 'research'],
          metadata: { ingested_at: new Date().toISOString() },
        };
      });
  } catch {
    return [];
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Fetch all RSS sources + arXiv in parallel
    const [arxivItems, ...rssResults] = await Promise.all([
      fetchArxiv(),
      ...RSS_SOURCES.map((src) => fetchRssFeed(src.url, src.name, src.type, src.tags)),
    ]);

    const allItems = [
      ...arxivItems,
      ...rssResults.flat(),
    ];

    if (allItems.length === 0) {
      return Response.json({ inserted: 0, message: 'No new items in the last 6 hours.' }, { headers: corsHeaders });
    }

    // Pre-fetch existing ids + canonical_urls to avoid constraint violations
    const { data: existing } = await supabase
      .from('content_items')
      .select('id, canonical_url');

    const existingIds = new Set((existing ?? []).map((r: { id: string }) => r.id));
    const existingUrls = new Set(
      (existing ?? [])
        .map((r: { canonical_url: string | null }) => r.canonical_url)
        .filter(Boolean),
    );

    // Filter out duplicates against DB
    const filtered = allItems.filter(
      (item) =>
        !existingIds.has(item.id) &&
        (!item.canonical_url || !existingUrls.has(item.canonical_url)),
    );

    // Deduplicate within the batch by canonical_url
    const seenUrls = new Set<string>();
    const deduplicatedItems = filtered.filter((item) => {
      if (!item.canonical_url) return true;
      if (seenUrls.has(item.canonical_url)) return false;
      seenUrls.add(item.canonical_url);
      return true;
    });

    if (deduplicatedItems.length === 0) {
      return Response.json(
        { inserted: 0, message: 'All fetched items already exist in the database.' },
        { headers: corsHeaders },
      );
    }

    const { error } = await supabase
      .from('content_items')
      .insert(deduplicatedItems);

    if (error) throw error;

    // Build per-source breakdown
    const breakdown: Record<string, number> = { arxiv: arxivItems.length };
    RSS_SOURCES.forEach((src, i) => {
      breakdown[src.name] = rssResults[i]?.length ?? 0;
    });

    return Response.json(
      { inserted: deduplicatedItems.length, breakdown },
      { headers: corsHeaders },
    );
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
