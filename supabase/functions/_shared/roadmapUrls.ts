export type RoadmapStep = {
  id?: string
  title?: string
  diff?: string
  desc?: string
  resource?: string
}

export function toYouTubeSearchUrl(query: string): string {
  const trimmed = query.trim()
  if (!trimmed) {
    return 'https://www.youtube.com/results?search_query=AI+tutorial'
  }
  const encoded = encodeURIComponent(trimmed).replace(/%20/g, '+')
  return `https://www.youtube.com/results?search_query=${encoded}`
}

export function isHallucinatedYouTubeUrl(url: string): boolean {
  const lower = url.toLowerCase()
  return lower.includes('youtube.com/watch') || lower.includes('youtu.be/')
}

export function sanitizeStepResource(
  step: RoadmapStep,
  roadmapTitle: string,
): RoadmapStep {
  const resource = step.resource?.trim() ?? ''
  const searchQuery = `${roadmapTitle} ${step.title ?? ''}`.trim()

  if (!resource) {
    return { ...step, resource: toYouTubeSearchUrl(searchQuery) }
  }

  if (isHallucinatedYouTubeUrl(resource)) {
    return { ...step, resource: toYouTubeSearchUrl(searchQuery) }
  }

  if (resource.toLowerCase().includes('youtube.com/results')) {
    return step
  }

  return step
}

export function sanitizeRoadmapContent(
  content: RoadmapStep[],
  roadmapTitle: string,
): RoadmapStep[] {
  if (!Array.isArray(content)) {
    return []
  }
  return content.map((step) => sanitizeStepResource(step, roadmapTitle))
}

export function roadmapHasUnsafeYouTubeUrls(content: RoadmapStep[]): boolean {
  if (!Array.isArray(content)) {
    return false
  }
  return content.some((step) => step.resource && isHallucinatedYouTubeUrl(step.resource))
}
