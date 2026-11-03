/**
 * TourAPI title exact 다건(고산사 등) — Enter·하이브리드 제안. contentId로 /place 상세.
 */
import { canonicalizeExploreSearchQuery } from './exploreSearchAliases.js';
import { makeDisambiguationResult } from './cityAttractionHubs.js';
import { enrichSearchCandidateScenicMedia } from './koreaLocalScenicLists.js';
import { tourAttractionToPoiSuggestion } from './koreaPoiTypeSearch.js';
import { tourRowTitleMatchesCompactQuery } from './koreaTourAttractionTitleMatch.js';
import { resolveCityAttractionHub } from './cityAttractionHubs.js';

const HAS_HANGUL_RE = /[\uAC00-\uD7A3]/;

/** @type {string[] | null} */
let tourEnterCallLog = null;

export function __testSetTourEnterCallLog(log) {
  tourEnterCallLog = log;
}

export function __testResetTourEnterCallLog() {
  tourEnterCallLog = null;
}

function compactKey(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function hubIdFromParentheticalTitle(title) {
  const region = String(title || '').match(/\(([^)]+)\)/)?.[1]?.trim();
  if (!region) return '';
  return resolveCityAttractionHub(region)?.hubId || '';
}

/**
 * @param {string} query
 * @param {{ lookupRows?: (title: string) => Promise<object[]> }} [opts]
 * @returns {Promise<object[]>}
 */
export async function collectKoreaTourTitleSearchCandidates(query, opts = {}) {
  const q = String(query || '').trim();
  if (!q || !HAS_HANGUL_RE.test(q) || /\s/.test(q)) return [];

  const title = canonicalizeExploreSearchQuery(q);
  const titleKey = compactKey(title);
  if (titleKey.length < 2) return [];

  let rows = [];
  if (typeof opts.lookupRows === 'function') {
    rows = await opts.lookupRows(title);
  } else {
    const { lookupKoreaTourAttractionsMatchingTitle } = await import('./koreaTourAttractions.js');
    const hubId = hubIdFromParentheticalTitle(title);
    rows = await lookupKoreaTourAttractionsMatchingTitle(title, {
      limit: 40,
      hubId: hubId || undefined,
    });
  }

  const exact = (rows || []).filter((row) => tourRowTitleMatchesCompactQuery(row, title));
  const out = [];
  const seen = new Set();
  for (const row of exact) {
    const item = tourAttractionToPoiSuggestion(row);
    if (!item?.name) continue;
    const k = compactKey(item.name);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(item);
  }
  return out;
}

/**
 * @param {string} query
 * @param {{ lookupRows?: (title: string) => Promise<object[]> }} [opts]
 */
export async function buildKoreaTourTitleEnterDisambiguation(query, opts = {}) {
  const q = String(query || '').trim();
  if (tourEnterCallLog) tourEnterCallLog.push(q);
  if (!q) return null;
  const candidates = await collectKoreaTourTitleSearchCandidates(q, opts);
  if (!candidates.length) return null;
  let list = candidates.map(enrichSearchCandidateScenicMedia);
  try {
    const { searchBoxForward, searchBoxTypesForQuery } = await import('./mapboxSearchBox.js');
    const remote = await searchBoxForward(q, {
      limit: 4,
      types: searchBoxTypesForQuery(q),
      language: 'ko',
    });
    const seen = new Set(list.map((item) => String(item?.id || item?.name || '')));
    for (const item of remote || []) {
      const key = String(item?.id || item?.name || '');
      if (!key || seen.has(key)) continue;
      seen.add(key);
      list.push(enrichSearchCandidateScenicMedia(item));
    }
  } catch {
    // Mapbox offline — Tour 후보만
  }
  return makeDisambiguationResult(q, list, {
    title: `'${q}' → 도시·명소·여행지`,
  });
}
