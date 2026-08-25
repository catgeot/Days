import crawlerPlaceMeta from './crawlerPlaceMeta.generated.js';

const TABS = new Set(['gallery', 'planner']);

export function parseCrawlerPlacePath(pathname) {
  const match = String(pathname || '').match(/^\/place\/([^/]+)\/(gallery|planner)\/?$/);
  if (!match) return null;
  const [, slug, tab] = match;
  if (!TABS.has(tab)) return null;
  return { slug, tab };
}

export function resolveCrawlerPlaceMeta(pathname, locale = 'ko') {
  const parsed = parseCrawlerPlacePath(pathname);
  if (!parsed) return null;
  const row = crawlerPlaceMeta?.[parsed.slug]?.[parsed.tab]?.[locale];
  if (!row) return null;
  return {
    locale,
    title: row.title,
    description: row.description,
    keywords: row.keywords,
    canonicalUrl: row.canonicalUrl,
    hreflangAlternates: row.hreflangAlternates,
  };
}

export function getCrawlerPlaceMetaSlugCount() {
  return Object.keys(crawlerPlaceMeta || {}).length;
}
