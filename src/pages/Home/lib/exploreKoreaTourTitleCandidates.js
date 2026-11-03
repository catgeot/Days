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

/** «고산사(홍성)» → { base: '고산사', region: '홍성' }. DB·searchKeyword는 괄호 sanitize로 «고산사홍성» 0건 */
export function splitParentheticalRegionTitle(title) {
  const m = String(title || '')
    .trim()
    .match(/^(.+?)\s*\(([^)]+)\)\s*$/u);
  if (!m) return null;
  const base = m[1].trim();
  const region = m[2].trim();
  if (base.length < 2 || region.length < 1) return null;
  return { base, region };
}

function tourRowInRegion(row, region, hubId) {
  const hay = [row?.addr1, row?.addr2, row?.title, row?.name].map((s) => String(s || '')).join(' ');
  if (hay.includes(region)) return true;
  if (!hubId) return false;
  const hub = resolveCityAttractionHub(hubId);
  const hubName = String(hub?.name || '').trim();
  const bare = hubName.replace(/(특별자치시|광역시|특별시|자치시|시|군|구)$/u, '').trim();
  return [hubName, bare].some((h) => h.length >= 2 && hay.includes(h));
}

/**
 * @param {string} query
 * @param {{ lookupRows?: (title: string) => Promise<object[]> }} [opts]
 * @returns {Promise<object[]>}
 */
export async function collectKoreaTourTitleSearchCandidates(query, opts = {}) {
  const q = String(query || '')
    .trim()
    .replace(/\s+\(/g, '(');
  if (!q || !HAS_HANGUL_RE.test(q)) return [];

  let title = canonicalizeExploreSearchQuery(q);
  let hubId = hubIdFromParentheticalTitle(title);

  if (/\s/.test(q)) {
    const { parseKoreaRegionalExploreQuery } = await import('./exploreRegionalPlaceQuery.js');
    const regional = parseKoreaRegionalExploreQuery(q);
    if (!regional?.placeQuery) return [];
    title = String(regional.placeQuery || '').trim();
    hubId = String(regional.hub?.hubId || hubId || '').trim();
    if (title.length < 2) return [];
  } else if (/\s/.test(title)) {
    return [];
  }

  const titleKey = compactKey(title);
  if (titleKey.length < 2) return [];

  const paren = /\s/.test(q) ? null : splitParentheticalRegionTitle(title);
  const lookupTitle = paren ? paren.base : title;

  let rows = [];
  if (typeof opts.lookupRows === 'function') {
    rows = await opts.lookupRows(lookupTitle);
  } else {
    const { lookupKoreaTourAttractionsMatchingTitle } = await import('./koreaTourAttractions.js');
    rows = await lookupKoreaTourAttractionsMatchingTitle(lookupTitle, {
      limit: 40,
      hubId: hubId || undefined,
    });
  }

  const matchTitle = /\s/.test(q) ? q : title;
  const exact = (rows || []).filter((row) => {
    if (tourRowTitleMatchesCompactQuery(row, matchTitle)) return true;
    if (!paren) return false;
    const baseKey = compactKey(paren.base);
    const titleMatchesBase = [row?.title, row?.name]
      .map(compactKey)
      .some((k) => k === baseKey || k.startsWith(`${baseKey}(`));
    return titleMatchesBase && tourRowInRegion(row, paren.region, hubId);
  });
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
