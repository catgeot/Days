/**
 * TourAPI title exact 다건(고산사 등) — Enter·하이브리드 제안. contentId로 /place 상세.
 */
import { canonicalizeExploreSearchQuery } from './exploreSearchAliases.js';
import { makeDisambiguationResult } from './cityAttractionHubs.js';
import { enrichSearchCandidateScenicMedia } from './koreaLocalScenicLists.js';
import { tourAttractionToPoiSuggestion } from './koreaPoiTypeSearch.js';

const HAS_HANGUL_RE = /[\uAC00-\uD7A3]/;

function compactKey(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function rowTitleMatchesQuery(row, titleKey) {
  const keys = [row?.title, row?.name].map(compactKey).filter(Boolean);
  return keys.some((k) => k === titleKey);
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
  if (!q) return null;
  const candidates = await collectKoreaTourTitleSearchCandidates(q, opts);
  if (!candidates.length) return null;
  const list = candidates.map(enrichSearchCandidateScenicMedia);
  return makeDisambiguationResult(q, list, {
    title: `'${q}' → 도시·명소·여행지`,
  });
}
