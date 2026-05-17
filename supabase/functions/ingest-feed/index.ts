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

function sanitizeImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
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

async function resolveAndValidateUrl(url: string): Promise<{ finalUrl: string; ogImageUrl: string | null; isValid: boolean }> {
  let ogImageUrl: string | null = null;
  try {
    const cleanUrl = url.trim().replace(/\s+/g, '');
    const response = await fetch(cleanUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(3500),
    });

    if (!response.ok) {
      console.log(`[URL Validator] Rejected non-OK status ${response.status} for ${cleanUrl}`);
      return { finalUrl: cleanUrl, ogImageUrl: null, isValid: false };
    }

    const finalUrl = response.url;
    if (finalUrl.includes('/error_docs/') || finalUrl.includes('forbidden.html') || finalUrl.includes('/404') || finalUrl.includes('access-denied')) {
      console.log(`[URL Validator] Rejected error-related final URL: ${finalUrl}`);
      return { finalUrl: cleanUrl, ogImageUrl: null, isValid: false };
    }

    let canonicalUrl = finalUrl;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      const html = await response.text();
      
      // 1. Extract canonical URL
      const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) ||
                             html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
      if (canonicalMatch && canonicalMatch[1]) {
        const canonical = canonicalMatch[1].trim();
        if (canonical.startsWith('http')) {
          canonicalUrl = canonical;
        }
      }

      // 2. Extract Open Graph image (og:image)
      const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                           html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i) ||
                           html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
      if (ogImageMatch && ogImageMatch[1]) {
        let imgUrl = ogImageMatch[1].trim();
        if (imgUrl && !imgUrl.startsWith('http')) {
          try {
            const parsedUrl = new URL(canonicalUrl);
            if (imgUrl.startsWith('/')) {
              imgUrl = `${parsedUrl.protocol}//${parsedUrl.host}${imgUrl}`;
            } else {
              imgUrl = `${parsedUrl.protocol}//${parsedUrl.host}/${imgUrl}`;
            }
          } catch {
            // Ignore
          }
        }
        ogImageUrl = sanitizeImageUrl(imgUrl);
      }
    }

    return { finalUrl: canonicalUrl, ogImageUrl, isValid: true };
  } catch (e) {
    let fallbackUrl = url.trim().replace(/\s+/g, '');
    return { finalUrl: fallbackUrl, ogImageUrl: null, isValid: true };
  }
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

    for (const raw of rawItems.slice(0, 8)) {
      const title = xmlGet(raw, 'title');
      if (!title) continue;

      const link = xmlGet(raw, 'link') || xmlGet(raw, 'guid');
      if (!link || !link.startsWith('http')) continue;

      const { finalUrl, ogImageUrl, isValid } = await resolveAndValidateUrl(link);
      if (!isValid) continue;

      const pubDateStr = xmlGet(raw, 'pubDate') || xmlGet(raw, 'dc:date') || xmlGet(raw, 'updated');
      const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();

      const description = xmlGet(raw, 'description') || xmlGet(raw, 'content:encoded') || xmlGet(raw, 'summary');
      const summary = description.slice(0, 320) || title;

      items.push({
        id: `rss-${slugify(finalUrl)}`,
        type,
        title,
        summary,
        source_name: sourceName,
        source_url: finalUrl,
        canonical_url: finalUrl,
        published_at: pubDate.toISOString(),
        external_id: finalUrl,
        tags: getSmartTags(title, summary, sourceTags),
        metadata: { 
          ingested_at: new Date().toISOString(), 
          source: sourceName, 
          imageUrl: ogImageUrl || undefined 
        },
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

// ── Hacker News ──────────────────────────────────────────────────────────────
async function fetchHackerNews(): Promise<FeedItem[]> {
  try {
    const topUrl = 'https://hacker-news.firebaseio.com/v0/topstories.json';
    const topRes = await fetch(topUrl, { signal: AbortSignal.timeout(8000) });
    const topIds: number[] = await topRes.json();
    
    // Fetch top 50 to find high impact stories
    const items = await Promise.all(
      topIds.slice(0, 50).map(async (id) => {
        try {
          const itemRes = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { signal: AbortSignal.timeout(5000) });
          return await itemRes.json();
        } catch {
          return null;
        }
      })
    );
    
    // Score > 100 for big news to ensure we don't return empty results on slow days
    const highImpact = items.filter(item => item && item.score && item.score > 100 && item.url);
    
    return highImpact.map(item => {
      const summary = `Trending on Hacker News with ${item.score} points. ${item.title}`;
      const tags = Array.from(new Set(['news', ...getSmartTags(item.title, summary, [])]));
      
      return {
        id: `hn-${item.id}`,
        type: 'news',
        title: item.title,
        summary: summary,
        source_name: 'Hacker News',
        source_url: item.url,
        canonical_url: item.url,
        published_at: new Date(item.time * 1000).toISOString(),
        external_id: String(item.id),
        tags,
        metadata: { ingested_at: new Date().toISOString(), score: item.score },
      };
    });
  } catch (e) {
    return [];
  }
}

// ── Infinite Knowledge Expander ────────────────────────────────────────────────
async function expandKnowledgeGraph(supabase: any, newItems: FeedItem[]) {
  if (!newItems || newItems.length === 0) return;
  
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_API_KEY) return;

  const { data: fieldRows } = await supabase
    .from('ai_fields')
    .select('id, title')
    .order('sort_order', { ascending: true });

  const fieldList = (fieldRows ?? [])
    .map((f: { id: string; title: string }) => `"${f.id}" (${f.title})`)
    .join(', ');

  if (!fieldList) return;

  const titles = newItems.slice(0, 15).map(i => i.title).join('\n');
  
  const prompt = `You are an AI trend analyzer. Read these recent news headlines and identify the single most important emerging AI subfield, architecture, or tool mentioned.
Headlines:
${titles}

Return ONLY a valid JSON object with:
- "title": The name of the topic
- "desc": A one-sentence description of what it is.
- "field_id": The best-matching category id from this list: ${fieldList}
Use ONLY an id from that list. If nothing fits, pick the closest category.`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, responseMimeType: "application/json" }
      })
    });
    
    const geminiData = await response.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return;
    
    const topic = JSON.parse(text);
    if (!topic.title || !topic.field_id) return;

    const validFieldIds = new Set((fieldRows ?? []).map((f: { id: string }) => f.id));
    if (!validFieldIds.has(topic.field_id)) {
      topic.field_id = (fieldRows ?? [])[0]?.id;
    }
    if (!topic.field_id) return;

    // Convert title to an ID (slug)
    const roadmapId = topic.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 30);
    
    // Check if it already exists
    const { data: existing } = await supabase.from('ai_roadmaps').select('id').eq('id', roadmapId).maybeSingle();
    if (existing) return; // We already have a roadmap for this!

    console.log(`[Knowledge Expander] Discovered new topic: ${topic.title}. Generating curriculum...`);

    // We discovered a brand new topic! Wait for the generator to build it.
    await supabase.functions.invoke('generate-roadmap', {
      body: { 
        field_id: topic.field_id, 
        roadmap_id: roadmapId, 
        title: topic.title, 
        description: topic.desc 
      }
    });

  } catch (e) {
    console.error("[Knowledge Expander] Failed:", e);
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

    // Fetch all RSS sources + arXiv + Hacker News in parallel
    const [arxivItems, hnItems, ...rssResults] = await Promise.all([
      fetchArxiv(),
      fetchHackerNews(),
      ...RSS_SOURCES.map((src) => fetchRssFeed(src.url, src.name, src.type, src.tags)),
    ]);

    const allItems = [
      ...arxivItems,
      ...hnItems,
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
    const breakdown: Record<string, number> = { arxiv: arxivItems.length, hacker_news: hnItems.length };
    RSS_SOURCES.forEach((src, i) => {
      breakdown[src.name] = rssResults[i]?.length ?? 0;
    });

    // Run the Infinite Knowledge Expander to detect new topics
    await expandKnowledgeGraph(supabase, deduplicatedItems);

    return Response.json(
      { inserted: deduplicatedItems.length, breakdown },
      { headers: corsHeaders },
    );
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500, headers: corsHeaders });
  }
});
