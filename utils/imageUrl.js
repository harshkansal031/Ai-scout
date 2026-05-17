/** Decode common HTML entities in scraped image URLs (e.g. VentureBeat / Contentful). */
export function sanitizeImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }
  return url
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/** React Native Image source with Referer for CDNs that hotlink-block (e.g. ctfassets.net). */
export function buildArticleImageSource(uri, articleUrl) {
  if (!uri) {
    return null;
  }
  const cleanUri = sanitizeImageUrl(uri);
  const source = { uri: cleanUri };

  if (articleUrl && !cleanUri.includes('logo.clearbit.com')) {
    try {
      const origin = new URL(articleUrl).origin;
      source.headers = { Referer: `${origin}/` };
    } catch {
      // ignore invalid article URL
    }
  }

  return source;
}
