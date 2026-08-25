import crawlerHubMeta from './crawlerHubMeta.generated.js';
import crawlerPlaceMeta from './crawlerPlaceMeta.generated.js';

const PLACE_TABS = new Set(['gallery', 'planner', 'wiki']);
const HUB_PATHS = new Set(['/', '/korea', '/korea/theme/scenic', '/explore', '/blog', '/blog/curation']);

function normalizePath(pathname) {
  const raw = String(pathname || '').trim();
  if (!raw || raw === '/') return '/';
  return raw.replace(/\/+$/, '') || '/';
}

function toMetaRow(row, locale) {
  if (!row) return null;
  return {
    locale,
    title: row.title,
    description: row.description,
    keywords: row.keywords,
    canonicalUrl: row.canonicalUrl,
    hreflangAlternates: row.hreflangAlternates,
    ogImage: row.ogImage,
    placeName: row.placeName,
    galleryImages: row.galleryImages,
  };
}

export function parseCrawlerPath(pathname) {
  const path = normalizePath(pathname);
  if (HUB_PATHS.has(path)) {
    return { kind: 'hub', path };
  }

  const baseMatch = path.match(/^\/place\/([^/]+)$/);
  if (baseMatch) {
    return { kind: 'place-base', slug: baseMatch[1] };
  }

  const tabMatch = path.match(/^\/place\/([^/]+)\/(gallery|planner|wiki)$/);
  if (tabMatch) {
    const [, slug, tab] = tabMatch;
    if (!PLACE_TABS.has(tab)) return null;
    return { kind: 'place-tab', slug, tab };
  }

  return null;
}

/** @deprecated use parseCrawlerPath */
export function parseCrawlerPlacePath(pathname) {
  const parsed = parseCrawlerPath(pathname);
  if (!parsed || parsed.kind !== 'place-tab') return null;
  return { slug: parsed.slug, tab: parsed.tab };
}

export function resolveCrawlerMeta(pathname, locale = 'ko') {
  const parsed = parseCrawlerPath(pathname);
  if (!parsed) return null;

  if (parsed.kind === 'hub') {
    return toMetaRow(crawlerHubMeta?.[parsed.path]?.[locale], locale);
  }

  if (parsed.kind === 'place-base') {
    const row = crawlerPlaceMeta?.[parsed.slug]?.gallery?.[locale];
    return toMetaRow(row, locale);
  }

  if (parsed.kind === 'place-tab') {
    const row = crawlerPlaceMeta?.[parsed.slug]?.[parsed.tab]?.[locale];
    return toMetaRow(row, locale);
  }

  return null;
}

/** @deprecated use resolveCrawlerMeta */
export function resolveCrawlerPlaceMeta(pathname, locale = 'ko') {
  return resolveCrawlerMeta(pathname, locale);
}

export function getCrawlerMetaKind(pathname) {
  const parsed = parseCrawlerPath(pathname);
  if (!parsed) return null;
  if (parsed.kind === 'hub') {
    if (parsed.path === '/') return 'home';
    if (parsed.path === '/korea') return 'korea';
    if (parsed.path === '/korea/theme/scenic') return 'scenic';
    if (parsed.path === '/explore') return 'explore';
    if (parsed.path === '/blog') return 'blog';
    if (parsed.path === '/blog/curation') return 'curation';
    return 'hub';
  }
  if (parsed.kind === 'place-base') return 'tier1-place-base';
  return 'tier1-place';
}

export function getCrawlerPlaceMetaSlugCount() {
  return Object.keys(crawlerPlaceMeta || {}).length;
}
