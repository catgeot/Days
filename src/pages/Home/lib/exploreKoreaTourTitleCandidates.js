/**
 * TourAPI title exact 다건(고산사 등) — Enter·하이브리드 제안. contentId로 /place 상세.
 */
import { canonicalizeExploreSearchQuery } from './exploreSearchAliases.js';
import { makeDisambiguationResult } from './cityAttractionHubs.js';
import { enrichSearchCandidateScenicMedia } from './koreaLocalScenicLists.js';
import { tourAttractionToPoiSuggestion } from './koreaPoiTypeSearch.js';

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

function rowTitleMatchesQuery(row, titleKey) {
  const keys = [row?.title, row?.name].map(compactKey).filter(Boolean);
  for (const k of keys) {
    if (k === titleKey) return true;
    if (titleKey.length < 2) continue;
    if (k.endsWith(titleKey)) return true;
    const idx = k.indexOf(titleKey);
    if (idx < 0) continue;
    const after = k.slice(idx + titleKey.length);
    if (!after) return true;
    if (/^(?:대웅전|루|전|각|암|탑|동|리|사|터|원|당|문|각|채|각)$/u.test(after)) return true;
  }
  return false;
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
    rows = await lookupKoreaTourAttractionsMatchingTitle(title, { limit: 40 });
  }

  const exact = (rows || []).filter((row) => rowTitleMatchesQuery(row, titleKey));
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
