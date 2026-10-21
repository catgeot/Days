import {
  isCityHubLocation,
  stripKoAdminSuffixForCategory,
} from '../pages/Home/lib/placeMatchCategory.js';
import {
  isDomesticKoreaLocation,
  isDomesticKoreaLocationForTourApi,
} from './tourApiMatch.js';

const HANGUL_RE = /[\u3131-\uD79D]/;

/** Standalone English tokens — never split from full place names into match keys */
const GENERIC_STOCK_WORDS = new Set(
  [
    'fortress',
    'island',
    'korea',
    'korean',
    'south',
    'north',
    'mountain',
    'lake',
    'temple',
    'park',
    'beach',
    'city',
    'observatory',
    'valley',
    'river',
    'county',
    'peninsula',
    'national',
    'provincial',
    'republic',
    'landscape',
    'travel',
    'tourism',
    'scenic',
    'view',
    'aerial',
    'traditional',
    'modern',
    'street',
    'downtown',
    'coastal',
    'seaside',
    'village',
    'town',
    'region',
    'area',
    'province',
    'metropolitan',
  ].map((w) => w.toLowerCase()),
);

export function normalizeGalleryRelevanceToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[\s_\-·,./]+/g, '');
}

/**
 * Full place label → one match token (generic words stripped, no per-word tokens).
 * @param {string} raw
 * @returns {string}
 */
export function normalizeFullPlaceNameToken(raw) {
  const words = String(raw || '')
    .trim()
    .split(/[\s,·/]+/)
    .map((w) => w.trim())
    .filter(Boolean);
  const kept = words.filter((word) => {
    const norm = normalizeGalleryRelevanceToken(word);
    return norm && !GENERIC_STOCK_WORDS.has(norm);
  });
  if (!kept.length) return '';
  return normalizeGalleryRelevanceToken(kept.join(' '));
}

export function isTourApiGalleryImageRecord(img) {
  if (!img || typeof img !== 'object') return false;
  if (img.source === 'tourapi') return true;
  return String(img.id ?? '').startsWith('tourapi');
}

export function isPexelsGalleryImageRecord(img) {
  if (!img || typeof img !== 'object') return false;
  if (img.source === 'pexels') return true;
  return String(img.id ?? '').startsWith('pexels');
}

export function isOfficialGalleryImageRecord(img) {
  if (!img || typeof img !== 'object') return false;
  if (isTourApiGalleryImageRecord(img)) return true;
  if (img.source === 'local-scenic-official') return true;
  return String(img.id ?? '').startsWith('local-scenic-official');
}

/** Unsplash / Pexels — not TourAPI or curated local scenic */
export function isStockGalleryImageRecord(img) {
  if (!img || typeof img !== 'object') return false;
  if (isOfficialGalleryImageRecord(img)) return false;
  if (isPexelsGalleryImageRecord(img)) return true;
  if (img.source && img.source !== 'unsplash') return false;
  return Boolean(img.urls?.regular || img.urls?.small || img.urls?.full);
}

export function isStockOnlyGallery(images) {
  const list = Array.isArray(images) ? images.filter(Boolean) : [];
  if (!list.length) return false;
  return list.every(isStockGalleryImageRecord);
}

export function isKoreanPlaceForGalleryStockPolicy(location) {
  if (!location || typeof location !== 'object') return false;
  if (isDomesticKoreaLocationForTourApi(location)) return true;
  if (isDomesticKoreaLocation(location)) return true;
  const lat = Number(location.lat);
  const lng = Number(location.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng) && (lat !== 0 || lng !== 0)) {
    return isDomesticKoreaLocationForTourApi({ lat, lng });
  }
  return false;
}

export function isKoreanGallerySubSpot(location) {
  if (!isKoreanPlaceForGalleryStockPolicy(location)) return false;
  const slug = String(location.slug || '').trim().toLowerCase();
  const hubId = String(location.hubId || '').trim().toLowerCase();
  if (slug && hubId) return slug !== hubId;
  return !isCityHubLocation(location);
}

function extractPexelsPhotoSlug(html) {
  const match = String(html || '').match(/\/photo\/([^/?#]+)/i);
  if (!match) return '';
  return match[1].replace(/-\d+$/, '');
}

export function stockGalleryImageRelevanceHaystack(img) {
  if (!img || typeof img !== 'object') return '';
  const pexelsSlug = extractPexelsPhotoSlug(img.links?.html);
  const parts = [img.alt_description, img.alt, img.description, pexelsSlug];
  return normalizeGalleryRelevanceToken(parts.filter(Boolean).join(' '));
}

/**
 * @param {{
 *   koreanName?: string,
 *   englishName?: string,
 *   parentPlaceTokens?: string[],
 * }} ctx
 * @returns {Set<string>}
 */
export function buildGalleryStockRelevanceTokens(ctx = {}) {
  const tokens = new Set();
  const koFull = normalizeFullPlaceNameToken(ctx.koreanName);
  const enFull = normalizeFullPlaceNameToken(ctx.englishName);
  if (koFull) tokens.add(koFull);
  if (
    enFull &&
    enFull !== koFull &&
    enFull.length >= 4 &&
    !GENERIC_STOCK_WORDS.has(enFull)
  ) {
    tokens.add(enFull);
  }

  const strippedKo = stripKoAdminSuffixForCategory(String(ctx.koreanName || '').trim());
  if (strippedKo) {
    const bare = normalizeGalleryRelevanceToken(strippedKo);
    if (bare && bare !== koFull) tokens.add(bare);
  }

  for (const parent of ctx.parentPlaceTokens || []) {
    const p = normalizeGalleryRelevanceToken(parent);
    if (p) tokens.delete(p);
    const pFull = normalizeFullPlaceNameToken(parent);
    if (pFull) tokens.delete(pFull);
  }

  return tokens;
}

export function isStockImageRelevantToPlace(img, tokens) {
  if (!isStockGalleryImageRecord(img)) return true;
  const set = tokens instanceof Set ? tokens : new Set(tokens || []);
  if (!set.size) return false;
  const haystack = stockGalleryImageRelevanceHaystack(img);
  if (!haystack) return false;
  for (const token of set) {
    if (token && token.length >= 2 && haystack.includes(token)) return true;
  }
  return false;
}

export function filterGalleryStockForKoreaPolicy(images, ctx) {
  const list = Array.isArray(images) ? images.filter(Boolean) : [];
  if (!ctx?.applyKoreanStockPolicy) return list;
  const tokens = ctx.relevanceTokens || buildGalleryStockRelevanceTokens(ctx);
  if (!tokens.size) return list.filter((img) => !isStockGalleryImageRecord(img));
  return list.filter((img) => isStockImageRelevantToPlace(img, tokens));
}

/**
 * Korean sub-spots: persist TourAPI/mixed, filtered stock-only, or empty (clears bad DB drift).
 * Never persist stock-only with any irrelevant row in the payload.
 */
export function shouldPersistKoreanGalleryToPlaceStats(images, location, ctx = {}) {
  if (!isKoreanGallerySubSpot(location)) return true;
  const list = Array.isArray(images) ? images.filter(Boolean) : [];
  if (!list.length) return true;
  if (!isStockOnlyGallery(list)) return true;
  const tokens = ctx.relevanceTokens || buildGalleryStockRelevanceTokens(ctx);
  return list.every((img) => isStockImageRelevantToPlace(img, tokens));
}

/**
 * TourAPI LIVE (keyword search) — homonym guard. Official contentId and curated hubs stay on;
 * other domestic places need keyword to contain the full place name (KO or EN), optionally with region.
 */
export function shouldRunTourApiLiveGalleryFetch(tourMapping, location, ctx = {}) {
  if (!tourMapping?.photoKeyword) return false;
  if (ctx.hasOfficialTourContentId) return true;
  if (tourMapping.curated && isCityHubLocation(location)) return true;

  const keyword = normalizeGalleryRelevanceToken(tourMapping.photoKeyword);
  if (!keyword) return false;

  const ko = normalizeFullPlaceNameToken(ctx.koreanName || location?.name);
  const en = normalizeFullPlaceNameToken(ctx.englishName);
  if (ko && ko.length >= 2 && keyword.includes(ko)) return true;
  if (en && en.length >= 3 && keyword.includes(en)) return true;

  const region = normalizeGalleryRelevanceToken(
    location?.stayAdmin || location?.parentCity || '',
  );
  if (en && region && keyword.includes(en) && keyword.includes(region)) return true;

  return false;
}
