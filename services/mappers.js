import { sanitizeImageUrl } from '../utils/imageUrl';

export function normalizeTopic(topic) {
  if (!topic) {
    return null;
  }

  return {
    id: topic.id,
    slug: topic.slug ?? topic.id,
    tag: topic.tag ?? topic.title,
    title: topic.title,
    duration: topic.duration ?? topic.duration_minutes ?? 30,
    difficulty: topic.difficulty ?? 'Intermediate',
    description: topic.description ?? '',
    whatYoullLearn: topic.whatYoullLearn ?? topic.content_blocks?.whatYoullLearn ?? [],
    builderTakeaway: topic.builderTakeaway ?? topic.builder_takeaway ?? '',
    resources: topic.resources ?? [],
    publishDate: topic.publish_date ?? null,
  };
}

export function normalizeContentItem(item) {
  if (!item) {
    return null;
  }

  let imageUrl = sanitizeImageUrl(
    item.imageUrl ?? item.image_url ?? item.metadata?.imageUrl ?? item.metadata?.image_url ?? item.metadata?.ogImage ?? null,
  );

  // Clean relative URLs into absolute URLs using the sourceUrl domain
  if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
    const sourceUrl = item.source_url ?? item.sourceUrl ?? '';
    if (sourceUrl) {
      try {
        const match = sourceUrl.match(/^(https?:\/\/[^\/]+)/i);
        if (match && match[1]) {
          const host = match[1];
          if (imageUrl.startsWith('/')) {
            imageUrl = host + imageUrl;
          } else {
            imageUrl = host + '/' + imageUrl;
          }
        }
      } catch (e) {
        // Silent ignore
      }
    }
  }

  return {
    id: item.id,
    type: item.type ?? 'news',
    category: item.category ?? item.type ?? 'News',
    categoryColor: item.categoryColor ?? pickCategoryColor(item.type ?? item.category),
    title: item.title,
    summary: item.summary ?? '',
    time: item.time ?? item.relative_time ?? '',
    publishedAt: item.published_at ?? null,
    sourceName: item.source_name ?? item.sourceName ?? '',
    sourceUrl: item.source_url ?? item.sourceUrl ?? '',
    imageUrl,
    tags: item.tags ?? [],
    saved: Boolean(item.saved),
    imageGradient: item.imageGradient ?? pickGradient(item.type ?? item.category),
    metadata: item.metadata ?? {},
  };
}

export function groupExploreResults(items = []) {
  return items.reduce(
    (acc, item) => {
      const normalized = normalizeContentItem(item);
      if (!normalized) {
        return acc;
      }

      if (normalized.type === 'paper') {
        acc.papers.push(normalized);
      } else if (normalized.type === 'tool') {
        acc.tools.push(normalized);
      } else if (normalized.type === 'resource' || normalized.type === 'course') {
        acc.resources.push(normalized);
      } else if (normalized.type === 'topic') {
        acc.topics.push(normalizeTopic(item));
      } else {
        acc.news.push(normalized);
      }

      return acc;
    },
    { topics: [], papers: [], tools: [], resources: [], news: [] },
  );
}

export function toBookmarkMap(bookmarks = []) {
  return bookmarks.reduce((acc, bookmark) => {
    acc[bookmark.contentId ?? bookmark.content_id] = bookmark;
    return acc;
  }, {});
}

export function buildCitationLabel(item) {
  if (!item) {
    return '';
  }

  const source = item.sourceName ?? item.source_name ?? item.category ?? item.type ?? 'Source';
  return `${source}: ${item.title}`;
}

function pickCategoryColor(category) {
  switch ((category ?? '').toLowerCase()) {
    case 'paper':
    case 'papers':
      return '#D97706';
    case 'research':
      return '#7C3AED';
    case 'tool':
    case 'tools':
      return '#059669';
    default:
      return '#0891B2';
  }
}

function pickGradient(category) {
  switch ((category ?? '').toLowerCase()) {
    case 'paper':
    case 'papers':
      return ['#4A1942', '#6B21A8'];
    case 'research':
      return ['#1E1B4B', '#312E81'];
    case 'tool':
    case 'tools':
      return ['#064E3B', '#065F46'];
    default:
      return ['#0C4A6E', '#075985'];
  }
}
