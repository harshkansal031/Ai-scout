export function isValidHttpUrl(url) {
  try {
    const u = new URL(String(url ?? ''));
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isYouTubeUrl(url) {
  const lower = String(url ?? '').toLowerCase();
  return lower.includes('youtube.com') || lower.includes('youtu.be');
}

export function sanitizeStepResource(step) {
  const resource = step.resource?.trim() ?? '';
  if (!resource || isYouTubeUrl(resource)) return { ...step, resource: undefined };
  if (isValidHttpUrl(resource)) return step;
  return { ...step, resource: undefined };
}

export function sanitizeRoadmapContent(content) {
  if (!Array.isArray(content)) return [];
  return content.map((step) => sanitizeStepResource(step));
}
