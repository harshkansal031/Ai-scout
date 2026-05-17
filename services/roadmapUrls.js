export function toYouTubeSearchUrl(query) {
  const trimmed = String(query ?? '').trim();
  if (!trimmed) {
    return 'https://www.youtube.com/results?search_query=AI+tutorial';
  }
  const encoded = encodeURIComponent(trimmed).replace(/%20/g, '+');
  return `https://www.youtube.com/results?search_query=${encoded}`;
}

export function isHallucinatedYouTubeUrl(url) {
  const lower = String(url).toLowerCase();
  return lower.includes('youtube.com/watch') || lower.includes('youtu.be/');
}

export function sanitizeStepResource(step, roadmapTitle) {
  const resource = step.resource?.trim() ?? '';
  const searchQuery = `${roadmapTitle} ${step.title ?? ''}`.trim();

  if (!resource || isHallucinatedYouTubeUrl(resource)) {
    return { ...step, resource: toYouTubeSearchUrl(searchQuery) };
  }

  return step;
}

export function sanitizeRoadmapContent(content, roadmapTitle) {
  if (!Array.isArray(content)) {
    return [];
  }
  return content.map((step) => sanitizeStepResource(step, roadmapTitle));
}
