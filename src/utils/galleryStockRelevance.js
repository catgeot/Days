import {
  isCityHubLocation,
  stripKoAdminSuffixForCategory,
} from '../pages/Home/lib/placeMatchCategory.js';
import {
  isDomesticKoreaLocation,
  isDomesticKoreaLocationForTourApi,
} from './tourApiMatch.js';

const HANGUL_RE = /[\u3131-\uD79D]/;

export function normalizeGalleryRelevanceToken(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[\s_\-·,./]+/g, '');
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

export function shouldPersistKoreanGalleryToPlaceStats(images, location) {
  if (!isKoreanGallerySubSpot(location)) return true;
  return !isStockOnlyGallery(images);
}

function latinTokenMinLength(token) {
  return token.length >= 3;
}

function hangulTokenMinLength(token) {
  return token.length >= 2;
}

function addRelevanceTokensFromRaw(tokens, raw) {
  const full = normalizeGalleryRelevanceToken(raw);
  if (!full) return;
  if (HANGUL_RE.test(full) && hangulTokenMinLength(full)) {
    tokens.add(full);
  } else if (!HANGUL_RE.test(full) && latinTokenMinLength(full)) {
    tokens.add(full);
  }
  const strippedKo = stripKoAdminSuffixForCategory(String(raw || '').trim());
  if (strippedKo && strippedKo !== String(raw || '').trim()) {
    addRelevanceTokensFromRaw(tokens, strippedKo);
  }
  for (const word of String(raw || '').split(/[\s,·/]+/)) {
    const piece = word.trim();
    if (!piece) continue;
    const norm = normalizeGalleryRelevanceToken(piece);
    if (!norm) continue;
    if (HANGUL_RE.test(piece)) {
      if (hangulTokenMinLength(norm)) tokens.add(norm);
    } else if (latinTokenMinLength(norm)) {
      tokens.add(norm);
    }
  }
}

/**
 * @param {{ koreanName?: string, primaryQuery?: string, englishName?: string }} ctx
 * @returns {Set<string>}
 */
export function buildGalleryStockRelevanceTokens(ctx = {}) {
  const tokens = new Set();
  addRelevanceTokensFromRaw(tokens, ctx.koreanName);
  addRelevanceTokensFromRaw(tokens, ctx.primaryQuery);
  addRelevanceTokensFromRaw(tokens, ctx.englishName);
  return tokens;
}

export function stockGalleryImageRelevanceHaystack(img) {
  if (!img || typeof img !== 'object') return '';
  const tagTitles = Array.isArray(img.tags)
    ? img.tags.map((tag) => (typeof tag === 'string' ? tag : tag?.title || ''))
    : [];
  const parts = [
    img.alt_description,
    img.alt,
    img.description,
    img.links?.html,
    img.user?.name,
    ...tagTitles,
  ];
  return normalizeGalleryRelevanceToken(parts.filter(Boolean).join(' '));
}

export function isStockImageRelevantToPlace(img, tokens) {
  if (!isStockGalleryImageRecord(img)) return true;
  const set = tokens instanceof Set ? tokens : new Set(tokens || []);
  if (!set.size) return false;
  const haystack = stockGalleryImageRelevanceHaystack(img);
  if (!haystack) return false;
  for (const token of set) {
    if (!token) continue;
    if (haystack.includes(token)) return true;
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
