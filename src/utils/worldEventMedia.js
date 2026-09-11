import {
  getKindLabel,
  placeUrlSlug,
  resolveCityAttractionHub,
} from '../pages/Home/lib/cityAttractionHubs.js';
import { getWorldEventTitle, getWorldEventPlaceMeta } from './worldEvents.js';

/** Wave1.5 pilot — shared with D2 chips / D3 media. */
export const WORLD_EVENT_WAVE15_PILOT_EVENT_IDS = [
  'edinburgh-fringe-2026',
  'munich-oktoberfest-2026',
  'bali-galungan-season-2026',
];

export const WORLD_EVENT_D3_ATTRACTION_LIMIT = 5;

/**
 * D3 hero·갤러리·미디어 섹션 — heroImage/heroImages가 있으면 표시.
 * @param {import('./worldEvents').WorldEvent | string | null | undefined} eventOrId
 */
export function hasWorldEventD3Media(eventOrId) {
  const event =
    eventOrId && typeof eventOrId === 'object'
      ? eventOrId
      : null;
  if (event) {
    if (Array.isArray(event.heroImages) && event.heroImages.length > 0) return true;
    if (String(event.heroImage || '').trim().startsWith('http')) return true;
  }
  const id = String(event?.id ?? eventOrId ?? '').trim();
  return WORLD_EVENT_WAVE15_PILOT_EVENT_IDS.includes(id);
}

/**
 * @param {import('./worldEvents').WorldEvent | null | undefined} event
 * @param {string} [locale]
 */
export function buildWorldEventSearchQuery(event, locale = 'ko') {
  if (!event) return '';
  const title = getWorldEventTitle(event, locale);
  const placeMeta = getWorldEventPlaceMeta(event.slug, locale);
  const placeLabel = placeMeta?.label ? String(placeMeta.label).trim() : '';
  return [title, placeLabel].filter(Boolean).join(' ');
}

/**
 * @param {string[]} values
 */
function uniqueNonEmptyStrings(values) {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const trimmed = String(value || '').trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

const PHOTO_KEYWORD_STOP = new Set([
  'the',
  'and',
  'with',
  'from',
  'for',
  'season',
  'window',
  'holiday',
  'city',
  'week',
  'annual',
  'event',
  'tour',
]);

/**
 * Unsplash/Wikimedia index English captions. Hangul queries return unrelated hits and skip EN fallbacks.
 * @param {string} value
 */
export function isHangulPhotoQuery(value) {
  return /[\uAC00-\uD7A3]/.test(String(value || ''));
}

/**
 * @param {string} value
 */
function normalizePhotoQuery(value) {
  return String(value || '')
    .replace(/[·•]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @param {import('./worldEvents').WorldEvent | null | undefined} event
 */
function englishPhotoQueryCandidates(event) {
  if (!event) return [];

  const titleEn = getWorldEventTitle(event, 'en');
  const placeMeta = getWorldEventPlaceMeta(event.slug, 'en');
  const placeEn = placeMeta?.label ? String(placeMeta.label).trim() : '';
  const glossaryEnTerms = (Array.isArray(event.glossaryTerms) ? event.glossaryTerms : [])
    .map((term) => normalizePhotoQuery(term.termEn))
    .filter(Boolean);
  const shortTitleEn = normalizePhotoQuery(String(titleEn || '').split(/[·&]/)[0]);

  return uniqueNonEmptyStrings([
    event.heroGallerySearchQueryEn,
    shortTitleEn && placeEn ? `${shortTitleEn} ${placeEn}` : '',
    titleEn,
    shortTitleEn,
    ...glossaryEnTerms.slice(0, 3),
  ]).filter((query) => !isHangulPhotoQuery(query));
}

/**
 * Words used to prefer Unsplash hits whose caption matches the event.
 * @param {import('./worldEvents').WorldEvent | null | undefined} event
 * @returns {string[]}
 */
export function buildWorldEventPhotoSearchKeywords(event) {
  if (!event) return [];
  const queries = englishPhotoQueryCandidates(event);
  const words = [];
  for (const query of queries) {
    for (const raw of String(query).toLowerCase().split(/[^a-z0-9]+/i)) {
      const word = raw.trim();
      if (word.length < 3) continue;
      if (PHOTO_KEYWORD_STOP.has(word)) continue;
      words.push(word);
    }
  }
  return uniqueNonEmptyStrings(words);
}

/**
 * Hero gallery — Unsplash/Wikimedia queries are English-only (UI locale ignored).
 * @param {import('./worldEvents').WorldEvent | null | undefined} event
 * @param {string} [_locale]
 */
export function buildWorldEventHeroGalleryQueries(event, _locale = 'ko') {
  if (!event) return { primary: '', fallbackEn: '', wikimediaQueries: [] };

  const candidates = englishPhotoQueryCandidates(event);
  const primary = candidates[0] || '';
  const fallbackEn = candidates.find((query) => query !== primary) || '';

  return {
    primary,
    fallbackEn,
    wikimediaQueries: uniqueNonEmptyStrings(candidates),
  };
}

/**
 * Hub list thumbs — English Unsplash queries only.
 * @param {import('./worldEvents').WorldEvent | null | undefined} event
 * @param {string} [_locale]
 * @returns {string[]}
 */
export function buildWorldEventListPhotoQueries(event, _locale = 'ko') {
  return englishPhotoQueryCandidates(event);
}

/**
 * @param {import('./worldEvents').WorldEvent | null | undefined} event
 * @param {string} [locale]
 */
export function buildWorldEventYoutubeSearchQuery(event, locale = 'ko') {
  if (!event) return '';
  if (locale === 'en' && event.youtubeSearchQueryEn) {
    return String(event.youtubeSearchQueryEn).trim();
  }
  if (event.youtubeSearchQueryKo) {
    return String(event.youtubeSearchQueryKo).trim();
  }
  return buildWorldEventSearchQuery(event, locale);
}

/**
 * @param {import('./worldEvents').WorldEvent | null | undefined} event
 * @param {string} [locale]
 */
export function getWorldEventYoutubeVideos(event, locale = 'ko') {
  if (!event?.youtubeVideos?.length) return [];
  return event.youtubeVideos.map((video) => ({
    id: video.id,
    title:
      locale === 'en' && video.titleEn
        ? video.titleEn
        : video.titleKo || video.titleEn || video.id,
  }));
}

/**
 * @param {import('./worldEvents').WorldEvent | null | undefined} event
 * @param {{ limit?: number, locale?: string }} [options]
 */
export function getWorldEventHubAttractions(event, options = {}) {
  const limit = options.limit ?? WORLD_EVENT_D3_ATTRACTION_LIMIT;
  const locale = options.locale ?? 'ko';
  const hubId = String(event?.hubId || event?.slug || '').trim();
  if (!hubId) return { hub: null, attractions: [] };

  const hub = resolveCityAttractionHub(hubId);
  if (!hub) return { hub: null, attractions: [] };

  const hubLabel =
    locale === 'en' && hub.name_en ? hub.name_en : hub.name || hub.name_en || hubId;

  const attractions = (hub.attractions || []).slice(0, limit).map((attraction) => {
    const name =
      locale === 'en' && attraction.name_en ? attraction.name_en : attraction.name;
    const slug = placeUrlSlug(attraction.name_en, attraction.name);
    return {
      id: `${hub.hubId}-${slug}`,
      name,
      slug,
      kindLabel: getKindLabel(attraction.kind, locale),
      href: slug ? `/place/${slug}` : '',
    };
  });

  return {
    hub: {
      hubId: hub.hubId,
      label: hubLabel,
      href: `/place/${hub.hubId}`,
    },
    attractions: attractions.filter((item) => item.href),
  };
}
