import { DEFAULT_OG_IMAGE, getPlaceOgImageUrl } from '../pages/Home/lib/placeSeoOg.js';
import { resolveLogbookFeedExcerpt } from '../utils/logbookDek.js';
import { logbookHeroImageUrl } from '../utils/logbookImageSrc.js';

// Edge middleware bundles this file. locationDisplay.js pulls JSON `with` imports
// the Edge compiler rejects (NOW_SANDBOX_WORKER_MAX_EDGE_FUNCTION_SOURCE).
const TOUR_CONTENT_ID_EN_FALLBACK_RE = /^Tour\s+\d{1,32}$/i;
const KO_KOREA_RE = /^(한국|대한민국|korea|south\s*korea|republic of korea|kr)$/i;

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function placeNameForLocale(location, locale) {
  if (locale === 'en') {
    const raw = location?.name_en || location?.curation_data?.locationEn;
    const text = String(raw ?? '').trim();
    if (text && !TOUR_CONTENT_ID_EN_FALLBACK_RE.test(text)) return text;
  }
  return normalizeText(location?.name) || '';
}

function countryForLocale(location, locale) {
  const korean = normalizeText(location?.country);
  const english = normalizeText(location?.country_en);
  if (locale === 'en') return english || korean;
  if (KO_KOREA_RE.test(korean) || KO_KOREA_RE.test(english)) return '대한민국';
  return korean || '';
}

const META_DESCRIPTION_MAX = 150;
const SITE_ORIGIN = 'https://www.gateo.kr';

export function buildEditorialPageUrl(slug, locale) {
  const path = `/blog/e/${slug}`;
  if (locale === 'en') return `${SITE_ORIGIN}${path}?lang=en`;
  return `${SITE_ORIGIN}${path}`;
}

export function buildEditorialHreflang(slug) {
  const path = `/blog/e/${slug}`;
  return [
    { hreflang: 'ko', href: `${SITE_ORIGIN}${path}` },
    { hreflang: 'en', href: `${SITE_ORIGIN}${path}?lang=en` },
    { hreflang: 'x-default', href: `${SITE_ORIGIN}${path}` },
  ];
}

function placeLabelFromSlug(placeSlug) {
  return String(placeSlug || '')
    .replace(/-/g, ' ')
    .trim();
}

function resolveEditorialOgImage(row, spot) {
  const cover = logbookHeroImageUrl(row.images, { maxWidth: 1200 });
  if (cover) return cover;
  if (spot) return getPlaceOgImageUrl(spot);
  return DEFAULT_OG_IMAGE;
}

/**
 * @param {object} row — published editorial report row
 * @param {{ spotsBySlug?: Record<string, object> | null }} [options]
 */
export function buildEditorialCrawlerMetaBundle(row, options = {}) {
  const slug = String(row.slug || '').trim();
  const spotsBySlug = options.spotsBySlug || null;
  const spot = spotsBySlug?.[row.place_slug] || null;
  const placeNameKo = spot
    ? placeNameForLocale(spot, 'ko') || spot.name
    : placeLabelFromSlug(row.place_slug);
  const placeNameEn = spot
    ? placeNameForLocale(spot, 'en') || spot.name_en || spot.name
    : placeNameKo;
  const countryKo = spot ? countryForLocale(spot, 'ko') : '';
  const countryEn = spot ? countryForLocale(spot, 'en') : '';
  const headline = String(row.title || '').trim();
  const description = resolveLogbookFeedExcerpt(row, META_DESCRIPTION_MAX);
  const ogImage = resolveEditorialOgImage(row, spot);

  const kwKo = [placeNameKo, headline, '기행문', '여행 블로그', 'GATEO'].filter(Boolean).join(', ');
  const kwEn = [placeNameEn, headline, 'travelogue', 'travel blog', 'GATEO'].filter(Boolean).join(', ');

  const base = {
    title: headline,
    description,
    ogImage,
    editorialSlug: slug,
    articleTitle: headline,
    placeName: placeNameKo,
    countryName: countryKo,
    placeSlug: row.place_slug || null,
  };

  return {
    ko: {
      ...base,
      keywords: kwKo,
      canonicalUrl: buildEditorialPageUrl(slug, 'ko'),
      hreflangAlternates: buildEditorialHreflang(slug),
    },
    en: {
      ...base,
      keywords: kwEn,
      placeName: placeNameEn,
      countryName: countryEn,
      canonicalUrl: buildEditorialPageUrl(slug, 'en'),
      hreflangAlternates: buildEditorialHreflang(slug),
    },
  };
}
