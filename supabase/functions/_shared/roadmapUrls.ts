export type RoadmapStep = {
  id?: string
  title?: string
  diff?: string
  desc?: string
  resource?: string  // Official docs/reference URL for this step's topic
}

export function isValidHttpUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function isYouTubeUrl(url: string): boolean {
  const lower = url.toLowerCase()
  return lower.includes('youtube.com') || lower.includes('youtu.be')
}

/**
 * Sanitizes a single roadmap step's resource field.
 * Accepts any valid https URL as a docs/reference link.
 * Strips YouTube links (no longer used for text-content phase).
 * Falls back to null so the UI can show "Read & Explore" without a docs link.
 */
export function sanitizeStepResource(step: RoadmapStep): RoadmapStep {
  const resource = step.resource?.trim() ?? ''

  if (!resource) return { ...step, resource: undefined }

  // Strip YouTube links — we are in the text-content phase
  if (isYouTubeUrl(resource)) return { ...step, resource: undefined }

  // Accept any other valid https URL (official docs, GitHub, papers, etc.)
  if (isValidHttpUrl(resource)) return step

  return { ...step, resource: undefined }
}

export function sanitizeRoadmapContent(
  content: RoadmapStep[],
  _roadmapTitle: string,
): RoadmapStep[] {
  if (!Array.isArray(content)) return []
  return content.map((step) => sanitizeStepResource(step))
}

export function roadmapHasUnsafeYouTubeUrls(content: RoadmapStep[]): boolean {
  if (!Array.isArray(content)) return false
  return content.some((step) => step.resource && isYouTubeUrl(step.resource))
}
