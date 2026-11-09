import crawlerEditorialMeta from './crawlerEditorialMeta.generated.js';
import crawlerHubMeta from './crawlerHubMeta.generated.js';
import crawlerPlaceMeta from './crawlerPlaceMeta.generated.js';
import {
  isExploreSeoCategory,
  isExploreSeoContinent,
} from '../pages/Home/lib/exploreCategorySeo.js';

const SITE_ORIGIN = 'https://www.gateo.kr';

function buildPlaceBaseUrl(slug, locale) {
  const path = `/place/${slug}`;
  if (locale === 'en') return `${SITE_ORIGIN}${path}?lang=en`;
  return `${SITE_ORIGIN}${path}`;
}

function buildPlaceBaseHreflang(slug) {
  const ko = buildPlaceBaseUrl(slug, 'ko');
  const en = buildPlaceBaseUrl(slug, 'en');
  return [
    { hreflang: 'ko', href: ko },
    { hreflang: 'en', href: en },
    { hreflang: 'x-default', href: ko },
  ];
}

function placeBaseTitle(placeName, locale) {
  const name = String(placeName || '').trim();
  if (locale === 'en') return `${name} travel — sights, planner, and AI docent`;
  return `${name} 여행 — 명소·플래너·AI 도슨트`;
}

const PLACE_TABS = new Set(['gallery', 'planner', 'wiki']);
const HUB_PATHS = new Set(['/', '/korea', '/korea/theme/scenic', '/explore', '/blog', '/blog/curation', '/world-events']);

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
    countryName: row.countryName,
    slug: row.slug,
    tab: row.tab,
    destIata: row.destIata,
    galleryImages: row.galleryImages,
    editorialSlug: row.editorialSlug,
    articleTitle: row.articleTitle,
    placeSlug: row.placeSlug,
    robotsNoIndex: row.robotsNoIndex,
  };
}

export function parseCrawlerPath(pathname) {
  const path = normalizePath(pathname);
  if (HUB_PATHS.has(path)) {
    return { kind: 'hub', path };
  }

  const exploreCategoryMatch = path.match(/^\/explore\/([^/]+)\/([^/]+)$/);
  if (exploreCategoryMatch) {
    const [, continent, category] = exploreCategoryMatch;
    if (isExploreSeoContinent(continent) && isExploreSeoCategory(category)) {
      return { kind: 'explore-category', path, continent, category };
    }
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

  const editorialMatch = path.match(/^\/blog\/e\/([^/]+)$/);
  if (editorialMatch) {
    return { kind: 'editorial-logbook', slug: editorialMatch[1] };
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

  if (parsed.kind === 'hub' || parsed.kind === 'explore-category') {
    return toMetaRow(crawlerHubMeta?.[parsed.path]?.[locale], locale);
  }

  if (parsed.kind === 'place-base') {
    const gallery = crawlerPlaceMeta?.[parsed.slug]?.gallery?.[locale];
    if (!gallery) return null;
    return toMetaRow(
      {
        ...gallery,
        title: placeBaseTitle(gallery.placeName, locale),
        description:
          locale === 'en'
            ? `Plan ${gallery.placeName}: sights, a trip planner, and an AI docent on GATEO.`
            : `${gallery.placeName} 여행. 명소, 플래너, AI 도슨트를 GATEO에서 확인하세요.`,
        canonicalUrl: buildPlaceBaseUrl(parsed.slug, locale),
        hreflangAlternates: buildPlaceBaseHreflang(parsed.slug),
        tab: 'base',
        galleryImages: undefined,
      },
      locale,
    );
  }

  if (parsed.kind === 'place-tab') {
    const row = crawlerPlaceMeta?.[parsed.slug]?.[parsed.tab]?.[locale];
    return toMetaRow(row, locale);
  }

  if (parsed.kind === 'editorial-logbook') {
    const row = crawlerEditorialMeta?.[parsed.slug]?.[locale];
    return toMetaRow(row, locale);
  }

  return null;
}

export function isCrawlerSoft404Path(pathname) {
  const parsed = parseCrawlerPath(pathname);
  if (!parsed) return false;
  if (parsed.kind === 'editorial-logbook') {
    return !crawlerEditorialMeta?.[parsed.slug];
  }
  if (parsed.kind === 'place-base' || parsed.kind === 'place-tab') {
    return !crawlerPlaceMeta?.[parsed.slug];
  }
  return false;
}

export function buildCrawlerSoft404Meta(pathname, locale = 'ko') {
  const path = normalizePath(pathname);
  const loc = locale === 'en' ? 'en' : 'ko';
  const title = loc === 'en' ? 'Page not found' : '페이지를 찾을 수 없습니다';
  const description =
    loc === 'en'
      ? 'This URL is not on GATEO. Return to the home page or use site search.'
      : '요청한 GATEO 페이지가 없습니다. 홈 또는 검색으로 이동하세요.';
  return {
    locale: loc,
    title,
    description,
    keywords: '',
    canonicalUrl: '',
    hreflangAlternates: [],
    robotsNoIndex: true,
    soft404Path: path,
  };
}

/** @deprecated use resolveCrawlerMeta */
export function resolveCrawlerPlaceMeta(pathname, locale = 'ko') {
  return resolveCrawlerMeta(pathname, locale);
}

export function getCrawlerMetaKind(pathname) {
  const parsed = parseCrawlerPath(pathname);
  if (!parsed) return null;
  if (parsed.kind === 'explore-category') return 'explore-category';
  if (parsed.kind === 'hub') {
    if (parsed.path === '/') return 'home';
    if (parsed.path === '/korea') return 'korea';
    if (parsed.path === '/korea/theme/scenic') return 'scenic';
    if (parsed.path === '/explore') return 'explore';
    if (parsed.path === '/blog') return 'blog';
    if (parsed.path === '/blog/curation') return 'curation';
    if (parsed.path === '/world-events') return 'world-events';
    return 'hub';
  }
  if (parsed.kind === 'place-base') return 'tier1-place-base';
  if (parsed.kind === 'editorial-logbook') return 'editorial-logbook';
  return 'tier1-place';
}

export function getCrawlerPlaceMetaSlugCount() {
  return Object.keys(crawlerPlaceMeta || {}).length;
}
