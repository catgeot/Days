/**
 * 국내 동음 지명 감지기 — 사전 후보를 disambiguationCandidates로 구조화.
 * 2곳 이상이면 unique resolve는 null (임의 단정 금지).
 */
import { KOREA_HOMONYM_GROUPS } from './koreaHomonymDictionary.js';
import { resolveCityAttractionHub } from './cityAttractionHubs.js';

function compactKey(query) {
  return String(query || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function candidateToCard(query, row) {
  const q = String(query || '').trim();
  const region = String(row.region || '').trim();
  const baseName = String(row.name || '').trim();
  const labeled = region ? `${baseName} · ${region}` : baseName;
  const lat = Number(row.lat);
  const lng = Number(row.lng);
  const stayAdmin = row.stayAdmin && typeof row.stayAdmin === 'object' ? { ...row.stayAdmin } : undefined;
  const placeCategory = String(row.placeCategory || '').trim();
  return {
    id: `ko-homonym-dict-${compactKey(baseName)}-${region.replace(/\s+/g, '')}-${lat.toFixed(4)}-${lng.toFixed(4)}`,
    kind: row.kind || 'city',
    badge: row.badge || '장소',
    name: labeled,
    name_en: String(row.name_en || labeled).trim(),
    name_ko: baseName,
    parentCity: region,
    country: '한국',
    country_en: 'South Korea',
    lat,
    lng,
    source: 'korea-homonym-dict',
    uiPlace: true,
    originalQuery: q,
    stayAdmin,
    desc: labeled,
    display_name: labeled,
    ...(row.contentId ? { contentId: String(row.contentId) } : {}),
    ...(row.hubId ? { hubId: row.hubId } : {}),
    ...(placeCategory ? { tourCategory: placeCategory, placeCategory } : {}),
  };
}

const HOMONYM_BY_KEY = new Map();
for (const group of KOREA_HOMONYM_GROUPS) {
  for (const key of group.keys || []) {
    const compact = compactKey(key);
    if (compact) HOMONYM_BY_KEY.set(compact, group);
  }
}

export function listKoreaHomonymDictionaryKeys() {
  return [...HOMONYM_BY_KEY.keys()];
}

/**
 * @param {string} query
 * @returns {{ query: string, key: string, disambiguationCandidates: object[] } | null}
 */
export function detectHomonymLocation(query) {
  const q = String(query || '').trim();
  const key = compactKey(q);
  if (!key) return null;
  const group = HOMONYM_BY_KEY.get(key);
  if (!group?.candidates?.length) return null;
  const disambiguationCandidates = group.candidates
    .filter((row) => Number.isFinite(Number(row.lat)) && Number.isFinite(Number(row.lng)))
    .map((row) => candidateToCard(q, row));
  if (disambiguationCandidates.length < 2) return null;
  return { query: q, key, disambiguationCandidates };
}

export function collectKoreaHomonymDisambiguationCandidates(query) {
  return detectHomonymLocation(query)?.disambiguationCandidates || [];
}

export const KOREA_HOMONYM_SOURCES = new Set(['korea-homonym-dict', 'nominatim-homonym']);

export function isKoreaHomonymCandidate(item) {
  return KOREA_HOMONYM_SOURCES.has(String(item?.source || ''));
}

export function isKoreaHomonymChoiceSet(candidates) {
  const list = Array.isArray(candidates) ? candidates : [];
  return list.filter(isKoreaHomonymCandidate).length >= 2;
}

export function koreaHomonymChoiceQuery(candidates, fallback = '') {
  const list = Array.isArray(candidates) ? candidates : [];
  const fromItem = String(list.find((item) => item?.originalQuery)?.originalQuery || '').trim();
  return fromItem || String(fallback || '').trim();
}

export function koreaHomonymChipLabel(item) {
  const region = String(item?.parentCity || '').trim();
  const rawName = String(item?.name_ko || item?.name || '').trim();
  const base = rawName.split('·')[0].trim() || rawName;
  if (region && base && !base.includes(region) && !region.includes(base)) {
    return `${region} ${base}`;
  }
  return base || region;
}

/**
 * hub exact(용산·고성)는 도시+명소 카드가 이미 있음 — 사전으로 덮지 않음.
 */
export function shouldOfferKoreaHomonymDisambiguation(query) {
  if (resolveCityAttractionHub(query)) return false;
  return collectKoreaHomonymDisambiguationCandidates(query).length >= 2;
}

/** 다후보면 null. 한곳만 있을 때만 반환. */
export function resolveUniqueKoreaHomonym(query) {
  const list = collectKoreaHomonymDisambiguationCandidates(query);
  if (list.length === 1) return list[0];
  return null;
}
